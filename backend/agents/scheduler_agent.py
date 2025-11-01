#!/usr/bin/env python3
"""
Scheduler Agent
Generates maintenance schedules with AI-driven priority assessment
"""

import os
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, List

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from ingestion import log_activity
from agents.tools import query_priority_policy, query_maintenance_history

# Try to import OpenAI and Hyperspell
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Use SimpleContextStore (SQLite-based, replaces Hyperspell)
from agents.context_store import SimpleContextStore as Hyperspell


class SchedulerAgent:
    """Agent responsible for maintenance scheduling and priority assessment"""
    
    def __init__(self, tank_id: str, openai_client: OpenAI = None, hyperspell: Hyperspell = None):
        self.tank_id = tank_id
        self.openai_client = openai_client
        self.hyperspell = hyperspell
        self.namespace = f"tank_{tank_id}"
    
    def assess_priority_with_ai(self, component_id: str, health: float, rul_hours: float, risk_class: str = 'medium') -> dict:
        """
        Use AI to assess maintenance priority
        
        Args:
            component_id: Component identifier
            health: Health index (0-100)
            rul_hours: Remaining useful life in hours
            risk_class: Risk classification
        
        Returns:
            Dict with priority, type, and reasoning
        """
        # Get priority policy
        policy = query_priority_policy(component_id)
        base_priority = policy.get('base_priority', 'medium')
        sla_days = policy.get('sla_days', 7)
        
        # Rule-based fallback
        if rul_hours < 72 or health < 40:
            priority = 'critical'
            event_type = 'unscheduled'
            scheduled_date = datetime.now() + timedelta(days=1)
            reasoning = f"CRITICAL: Component health {health}% with RUL {rul_hours}h. Immediate maintenance required."
        elif rul_hours < 168 or health < 60:
            priority = 'high'
            event_type = 'unscheduled' if health < 70 else 'scheduled'
            scheduled_date = datetime.now() + timedelta(days=3)
            reasoning = f"HIGH: Component health {health}% with RUL {rul_hours}h. Schedule within 3 days."
        elif rul_hours < 336 or health < 75:
            priority = 'medium'
            event_type = 'preventive'
            scheduled_date = datetime.now() + timedelta(days=sla_days)
            reasoning = f"MEDIUM: Component health {health}% with RUL {rul_hours}h. Schedule within SLA window ({sla_days} days)."
        else:
            priority = 'low'
            event_type = 'preventive'
            scheduled_date = datetime.now() + timedelta(days=sla_days * 2)
            reasoning = f"LOW: Component health {health}%. Preventive maintenance scheduled."
        
        # Use AI to refine if available
        if self.openai_client and (priority in ['critical', 'high'] or health < 70):
            try:
                prompt = f"""Assess maintenance priority for a tank component:

Component ID: {component_id}
Current Health: {health}%
Remaining Useful Life: {rul_hours} hours
Risk Class: {risk_class}
Base Priority: {base_priority}

Current Assessment:
- Priority: {priority}
- Type: {event_type}
- Reasoning: {reasoning}

Provide a concise 1-sentence maintenance recommendation focusing on urgency and impact."""

                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are a maintenance scheduler for military vehicles."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=100,
                    temperature=0.5
                )
                
                ai_reasoning = response.choices[0].message.content.strip()
                reasoning = f"{reasoning} {ai_reasoning}"
                
            except Exception as e:
                print(f"Error getting AI reasoning: {e}")
        
        return {
            'priority': priority,
            'type': event_type,
            'scheduled_date': scheduled_date.strftime('%Y-%m-%d'),
            'reasoning': reasoning
        }
    
    def run(self, context: dict = None) -> dict:
        """
        Main agent execution
        
        Args:
            context: Context from previous agent (HealthAgent)
        
        Returns:
            Dict with maintenance events
        """
        log_activity(self.tank_id, 'SchedulerAgent', 'Generating maintenance schedule', 'in_progress')
        
        # Get health predictions from Hyperspell
        if self.hyperspell:
            health_context = self.hyperspell.retrieve(self.namespace, 'health_predictions')
            if health_context:
                if isinstance(health_context, str):
                    health_context = json.loads(health_context)
                context = health_context
        
        if not context or 'components' not in context:
            return {
                'status': 'error',
                'error': 'No health predictions available',
                'events': []
            }
        
        components = context.get('components', [])
        
        # Generate maintenance events
        events = []
        event_id = 1
        
        for component in components:
            component_id = component['id']
            health = component['health']
            rul_hours = component['rul_hours']
            status = component['status']
            
            # Only create events for components needing attention
            if health < 80 or rul_hours < 336:
                # Assess priority
                assessment = self.assess_priority_with_ai(
                    component_id,
                    health,
                    rul_hours,
                    risk_class='critical' if status == 'critical' else 'medium'
                )
                
                # Get component name
                component_name = component.get('name', component_id)
                
                # Generate description
                description = f"{component_name} maintenance - Health: {health}%, RUL: {rul_hours}h"
                if component.get('explanation'):
                    description += f". {component['explanation']}"
                
                events.append({
                    'id': f'mnt-{event_id:03d}',
                    'date': assessment['scheduled_date'],
                    'type': assessment['type'],
                    'component': component_id,
                    'description': description,
                    'status': 'pending',
                    'priority': assessment['priority'],
                    'reasoning': assessment['reasoning']
                })
                
                event_id += 1
        
        # Store results in Hyperspell
        if self.hyperspell:
            scheduler_context = {
                'events': events,
                'timestamp': datetime.now().isoformat(),
                'total_events': len(events),
                'critical_events': len([e for e in events if e['priority'] == 'critical']),
                'high_events': len([e for e in events if e['priority'] == 'high'])
            }
            
            self.hyperspell.store(
                namespace=self.namespace,
                key='maintenance_schedule',
                value=json.dumps(scheduler_context)
            )
        
        # Log completion
        critical_count = len([e for e in events if e['priority'] == 'critical'])
        log_activity(
            self.tank_id,
            'SchedulerAgent',
            f'Scheduled {len(events)} maintenance events ({critical_count} critical)',
            'completed',
            json.dumps({
                'total_events': len(events),
                'critical': critical_count
            })
        )
        
        return {
            'status': 'success',
            'tank_id': self.tank_id,
            'events': events,
            'next_agent': 'LogisticsAgent',
            'context': {
                'tank_id': self.tank_id,
                'events_generated': len(events),
                'critical_events': [e['id'] for e in events if e['priority'] == 'critical']
            }
        }


if __name__ == '__main__':
    # Test agent
    from agents.config import OPENAI_API_KEY, HYPERSPELL_API_KEY
    
    openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_AVAILABLE and OPENAI_API_KEY else None
    hyperspell = Hyperspell(api_key=HYPERSPELL_API_KEY) if HYPERSPELL_AVAILABLE else None
    
    # Mock context
    context = {
        'components': [
            {'id': 'fcs-001', 'name': 'Fire Control System', 'health': 12.2, 'rul_hours': 533, 'status': 'critical'},
            {'id': 'com-001', 'name': 'Communications Array', 'health': 11.1, 'rul_hours': 436, 'status': 'critical'}
        ]
    }
    
    agent = SchedulerAgent('TNK-B-023', openai_client=openai_client, hyperspell=hyperspell)
    result = agent.run(context)
    
    print(f"\nSchedulerAgent Result:")
    print(f"  Events Generated: {len(result['events'])}")
    for event in result['events']:
        print(f"  [{event['priority'].upper()}] {event['component']} - {event['date']}")
    print(f"  Next Agent: {result['next_agent']}")

