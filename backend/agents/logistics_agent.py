#!/usr/bin/env python3
"""
Logistics Agent
Manages parts inventory, personnel assignment, and work order generation
"""

import os
import sys
import json
from datetime import datetime
from typing import Dict, List

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from ingestion import log_activity
from agents.tools import check_parts_inventory, match_personnel, generate_work_order

# Try to import OpenAI and Hyperspell
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Use SimpleContextStore (SQLite-based, replaces Hyperspell)
from agents.context_store import SimpleContextStore as Hyperspell

COMPONENT_NAMES = {
    'eng-001': 'Main Engine',
    'trn-001': 'Transmission',
    'hyd-001': 'Hydraulic System',
    'sus-001': 'Suspension System',
    'fcs-001': 'Fire Control System',
    'com-001': 'Communications Array'
}

SPECIALIZATION_MAP = {
    'eng-001': 'Engine Mechanics',
    'trn-001': 'Track & Transmission',
    'hyd-001': 'Hydraulics & Suspension',
    'sus-001': 'Hydraulics & Suspension',
    'fcs-001': 'Fire Control Systems',
    'com-001': 'Communications & Electronics'
}


class LogisticsAgent:
    """Agent responsible for parts procurement and personnel assignment"""
    
    def __init__(self, tank_id: str, openai_client: OpenAI = None, hyperspell: Hyperspell = None):
        self.tank_id = tank_id
        self.openai_client = openai_client
        self.hyperspell = hyperspell
        self.namespace = f"tank_{tank_id}"
    
    def generate_work_order_justification(self, component_id: str, health: float, priority: str) -> str:
        """
        Generate natural language justification for work order
        
        Args:
            component_id: Component identifier
            health: Component health index
            priority: Priority level
        
        Returns:
            Natural language justification
        """
        component_name = COMPONENT_NAMES.get(component_id, component_id)
        
        if not self.openai_client:
            # Fallback template
            if priority == 'critical':
                return f"{component_name} requires immediate parts procurement. Health: {health}%. CRITICAL: Component failure imminent."
            elif priority == 'high':
                return f"{component_name} needs parts for scheduled maintenance. Health: {health}%. High priority maintenance required."
            else:
                return f"{component_name} maintenance parts needed. Health: {health}%. Standard maintenance procurement."
        
        # Use AI to generate justification
        try:
            prompt = f"""Generate a work order justification for tank maintenance:

Component: {component_name}
Current Health: {health}%
Priority: {priority.upper()}

Generate a concise 2-sentence justification for parts procurement suitable for approval workflow."""

            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are generating work order justifications for military tank maintenance."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100,
                temperature=0.6
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"Error generating justification: {e}")
            return f"{component_name} requires parts procurement for {priority} priority maintenance. Health: {health}%."
    
    def run(self, context: dict = None) -> dict:
        """
        Main agent execution
        
        Args:
            context: Context from previous agent (SchedulerAgent)
        
        Returns:
            Dict with work orders and personnel assignments
        """
        log_activity(self.tank_id, 'LogisticsAgent', 'Checking parts inventory and personnel', 'in_progress')
        
        # Get maintenance schedule from Hyperspell
        if self.hyperspell:
            schedule_context = self.hyperspell.retrieve(self.namespace, 'maintenance_schedule')
            if schedule_context:
                if isinstance(schedule_context, str):
                    schedule_context = json.loads(schedule_context)
                context = schedule_context
        
        if not context or 'events' not in context:
            return {
                'status': 'error',
                'error': 'No maintenance schedule available',
                'work_orders': [],
                'personnel_assignments': []
            }
        
        events = context.get('events', [])
        
        work_orders = []
        personnel_assignments = []
        
        # Process each maintenance event
        for event in events:
            component_id = event['component']
            component_name = COMPONENT_NAMES.get(component_id, component_id)
            priority = event['priority']
            
            # Check parts inventory
            inventory = check_parts_inventory(component_id)
            
            # Generate work order if parts are low
            if not inventory.get('parts_available', True) or inventory.get('current_quantity', 0) < inventory.get('min_quantity', 2):
                justification = self.generate_work_order_justification(
                    component_id,
                    event.get('health', 50),  # Get health from context if available
                    priority
                )
                
                work_order = generate_work_order(
                    component_id=component_id,
                    part_name=f"{component_name} repair parts",
                    quantity=inventory.get('min_quantity', 2),
                    priority=priority
                )
                
                work_order['justification'] = justification
                work_order['event_id'] = event['id']
                
                work_orders.append(work_order)
            
            # Match personnel
            specialization = SPECIALIZATION_MAP.get(component_id, 'General Maintenance')
            personnel = match_personnel(specialization)
            
            if personnel.get('matches'):
                # Estimate repair hours based on priority
                if priority == 'critical':
                    estimated_hours = 8
                elif priority == 'high':
                    estimated_hours = 6
                else:
                    estimated_hours = 4
                
                personnel_assignment = {
                    'id': f'PA-{len(personnel_assignments)+1:03d}',
                    'component_id': component_id,
                    'tank_id': self.tank_id,
                    'personnel_ids': personnel['matches'],
                    'estimated_hours': estimated_hours,
                    'priority': priority,
                    'special_instructions': f"{component_name} maintenance - {event.get('reasoning', 'Standard maintenance')}",
                    'status': 'draft',
                    'event_id': event['id']
                }
                
                personnel_assignments.append(personnel_assignment)
        
        # Store results in Hyperspell
        if self.hyperspell:
            logistics_context = {
                'work_orders': work_orders,
                'personnel_assignments': personnel_assignments,
                'timestamp': datetime.now().isoformat(),
                'total_work_orders': len(work_orders),
                'total_assignments': len(personnel_assignments)
            }
            
            self.hyperspell.store(
                namespace=self.namespace,
                key='logistics_recommendations',
                value=json.dumps(logistics_context)
            )
        
        # Log completion
        log_activity(
            self.tank_id,
            'LogisticsAgent',
            f'Generated {len(work_orders)} work orders, {len(personnel_assignments)} personnel assignments',
            'completed',
            json.dumps({
                'work_orders': len(work_orders),
                'assignments': len(personnel_assignments)
            })
        )
        
        return {
            'status': 'success',
            'tank_id': self.tank_id,
            'work_orders': work_orders,
            'personnel_assignments': personnel_assignments,
            'next_agent': None  # End of pipeline
        }


if __name__ == '__main__':
    # Test agent
    from agents.config import OPENAI_API_KEY, HYPERSPELL_API_KEY
    
    openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_AVAILABLE and OPENAI_API_KEY else None
    hyperspell = Hyperspell(api_key=HYPERSPELL_API_KEY) if HYPERSPELL_AVAILABLE else None
    
    # Mock context
    context = {
        'events': [
            {
                'id': 'mnt-001',
                'component': 'fcs-001',
                'priority': 'critical',
                'health': 12.2,
                'reasoning': 'CRITICAL: Component health 12.2% with RUL 533h'
            }
        ]
    }
    
    agent = LogisticsAgent('TNK-B-023', openai_client=openai_client, hyperspell=hyperspell)
    result = agent.run(context)
    
    print(f"\nLogisticsAgent Result:")
    print(f"  Work Orders: {len(result['work_orders'])}")
    print(f"  Personnel Assignments: {len(result['personnel_assignments'])}")

