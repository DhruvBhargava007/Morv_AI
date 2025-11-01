#!/usr/bin/env python3
"""
Enhanced Scheduler Agent - AI-Driven Priority Assessment
Uses AI to make intelligent scheduling decisions based on multiple factors
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

# Try to import OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Use SimpleContextStore
from agents.context_store import SimpleContextStore as Hyperspell


class EnhancedSchedulerAgent:
    """AI-driven scheduler that makes intelligent maintenance decisions"""
    
    def __init__(self, tank_id: str, openai_client: OpenAI = None, hyperspell: Hyperspell = None):
        self.tank_id = tank_id
        self.openai_client = openai_client
        self.hyperspell = hyperspell
        self.namespace = f"tank_{tank_id}"
    
    def ai_assess_priority(self, component_data: dict, context: dict = None) -> dict:
        """
        Use AI to assess maintenance priority and scheduling
        
        Args:
            component_data: Component health data
            context: Additional context (tank mission status, availability, etc.)
        
        Returns:
            Dict with AI-determined priority, scheduling, and reasoning
        """
        if not self.openai_client:
            # Fallback to rule-based
            return self._rule_based_assessment(component_data)
        
        try:
            # Get maintenance history
            history = query_maintenance_history(self.tank_id, component_data['id'])
            
            # Prepare context for AI
            prompt = f"""Assess maintenance priority and scheduling for a military tank component:

Component: {component_data.get('name', component_data['id'])}
Current Health: {component_data['health']}%
Status: {component_data['status']}
Remaining Useful Life: {component_data['rul_hours']} hours
Anomalies: {', '.join(component_data.get('anomalies', [])) if component_data.get('anomalies') else 'None'}
Patterns: {', '.join(component_data.get('patterns_detected', [])) if component_data.get('patterns_detected') else 'Normal'}

Recent Maintenance History:
{json.dumps(history.get('recent_events', [])[:5], indent=2) if history.get('recent_events') else 'No recent maintenance'}

Tank Context:
- Tank ID: {self.tank_id}
- Readiness Score: {context.get('readiness_score', 'Unknown')}%
- Critical Components: {len(context.get('critical_components', []))}

Consider:
1. Component criticality for mission readiness
2. Maintenance resource availability
3. Historical maintenance patterns
4. Anomaly severity and frequency
5. Operational requirements

Provide maintenance scheduling recommendation in JSON format:
{{
    "priority": "<critical|high|medium|low>",
    "event_type": "<unscheduled|scheduled|preventive>",
    "scheduled_date": "<YYYY-MM-DD>",
    "estimated_duration_hours": <number>,
    "urgency_score": <0-100>,
    "reasoning": "<detailed explanation>",
    "recommended_actions": ["<action1>", "<action2>", ...],
    "risk_if_delayed": "<assessment>"
}}"""

            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a military maintenance scheduler making critical decisions about tank maintenance. Consider mission readiness, resource constraints, and component criticality."
                    },
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.4,
                max_tokens=400
            )
            
            ai_result = json.loads(response.choices[0].message.content)
            
            # Parse scheduled date
            try:
                scheduled_date = datetime.strptime(ai_result['scheduled_date'], '%Y-%m-%d')
            except:
                # Fallback: calculate from urgency
                urgency_score = ai_result.get('urgency_score', 50)
                if urgency_score >= 80:
                    scheduled_date = datetime.now() + timedelta(days=1)
                elif urgency_score >= 60:
                    scheduled_date = datetime.now() + timedelta(days=3)
                elif urgency_score >= 40:
                    scheduled_date = datetime.now() + timedelta(days=7)
                else:
                    scheduled_date = datetime.now() + timedelta(days=14)
            
            return {
                'priority': ai_result.get('priority', 'medium').lower(),
                'type': ai_result.get('event_type', 'preventive').lower(),
                'scheduled_date': scheduled_date.strftime('%Y-%m-%d'),
                'estimated_duration_hours': ai_result.get('estimated_duration_hours', 4),
                'urgency_score': ai_result.get('urgency_score', 50),
                'reasoning': ai_result.get('reasoning', ''),
                'recommended_actions': ai_result.get('recommended_actions', []),
                'risk_if_delayed': ai_result.get('risk_if_delayed', 'Unknown'),
                'source': 'ai'
            }
            
        except Exception as e:
            print(f"Error in AI priority assessment: {e}")
            return self._rule_based_assessment(component_data)
    
    def _rule_based_assessment(self, component_data: dict) -> dict:
        """Fallback rule-based assessment"""
        health = component_data['health']
        rul_hours = component_data['rul_hours']
        
        if rul_hours < 72 or health < 40:
            priority = 'critical'
            event_type = 'unscheduled'
            scheduled_date = datetime.now() + timedelta(days=1)
        elif rul_hours < 168 or health < 60:
            priority = 'high'
            event_type = 'unscheduled' if health < 70 else 'scheduled'
            scheduled_date = datetime.now() + timedelta(days=3)
        elif rul_hours < 336 or health < 75:
            priority = 'medium'
            event_type = 'preventive'
            scheduled_date = datetime.now() + timedelta(days=7)
        else:
            priority = 'low'
            event_type = 'preventive'
            scheduled_date = datetime.now() + timedelta(days=14)
        
        return {
            'priority': priority,
            'type': event_type,
            'scheduled_date': scheduled_date.strftime('%Y-%m-%d'),
            'estimated_duration_hours': 4,
            'urgency_score': 100 - health,
            'reasoning': f"Rule-based: Health {health}%, RUL {rul_hours}h",
            'recommended_actions': [],
            'risk_if_delayed': 'Unknown',
            'source': 'rule_based'
        }
    
    def optimize_schedule(self, events: List[dict]) -> List[dict]:
        """
        Use AI to optimize maintenance schedule considering resource constraints
        
        Args:
            events: List of maintenance events
        
        Returns:
            Optimized schedule
        """
        if not self.openai_client or len(events) == 0:
            return events
        
        try:
            prompt = f"""Optimize maintenance schedule for multiple components:

Maintenance Events:
{json.dumps(events, indent=2)}

Constraints:
- Limited maintenance personnel
- Parts availability may vary
- Mission-critical components must be prioritized
- Consider maintenance efficiency (can multiple components be serviced together?)

Provide optimized schedule with:
1. Recommended sequencing
2. Resource allocation
3. Risk mitigation strategies

Respond in JSON:
{{
    "optimized_events": [
        {{
            "id": "<event_id>",
            "sequence": <number>,
            "group_with": ["<other_event_ids>"],
            "reasoning": "<why this sequence>"
        }}
    ],
    "resource_recommendations": {{
        "personnel_required": <number>,
        "parts_needed": ["<part1>", ...],
        "time_estimate": "<days|hours>"
    }}
}}"""

            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are optimizing maintenance schedules for military vehicles considering resource constraints and mission readiness."
                    },
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=500
            )
            
            optimization = json.loads(response.choices[0].message.content)
            
            # Apply optimization to events
            optimized_events = []
            sequence_map = {e['id']: e for e in optimization.get('optimized_events', [])}
            
            for event in events:
                event_id = event['id']
                if event_id in sequence_map:
                    event['sequence'] = sequence_map[event_id].get('sequence', len(optimized_events))
                    event['group_with'] = sequence_map[event_id].get('group_with', [])
                    event['optimization_reasoning'] = sequence_map[event_id].get('reasoning', '')
                
                optimized_events.append(event)
            
            # Sort by sequence
            optimized_events.sort(key=lambda x: x.get('sequence', 999))
            
            return optimized_events
            
        except Exception as e:
            print(f"Error in schedule optimization: {e}")
            return events
    
    def run(self, context: dict = None) -> dict:
        """Main agent execution"""
        log_activity(self.tank_id, 'EnhancedSchedulerAgent', 'Generating AI-driven maintenance schedule', 'in_progress')
        
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
        
        # Generate maintenance events using AI
        events = []
        event_id = 1
        
        for component in components:
            component_id = component['id']
            health = component['health']
            rul_hours = component['rul_hours']
            
            # Use AI to assess priority
            if health < 90 or rul_hours < 500:  # More inclusive threshold
                assessment = self.ai_assess_priority(component, context)
                
                component_name = component.get('name', component_id)
                
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
                    'reasoning': assessment['reasoning'],
                    'estimated_duration_hours': assessment['estimated_duration_hours'],
                    'urgency_score': assessment['urgency_score'],
                    'recommended_actions': assessment['recommended_actions'],
                    'risk_if_delayed': assessment['risk_if_delayed'],
                    'source': assessment.get('source', 'ai')
                })
                
                event_id += 1
        
        # Optimize schedule with AI
        events = self.optimize_schedule(events)
        
        # Store results
        if self.hyperspell:
            scheduler_context = {
                'events': events,
                'timestamp': datetime.now().isoformat(),
                'total_events': len(events),
                'critical_events': len([e for e in events if e['priority'] == 'critical']),
                'ai_optimized': True
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
            'EnhancedSchedulerAgent',
            f'Generated {len(events)} AI-optimized maintenance events ({critical_count} critical)',
            'completed',
            json.dumps({
                'total_events': len(events),
                'critical': critical_count,
                'ai_optimized': True
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

