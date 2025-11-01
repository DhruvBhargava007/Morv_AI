#!/usr/bin/env python3
"""
Health Agent
Computes component health predictions with natural language explanations
"""

import os
import sys
import json
from datetime import datetime
from typing import Dict, List

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from health_engine import compute_health_index, compute_readiness_score
from ingestion import log_activity

# Try to import OpenAI and Hyperspell
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Use SimpleContextStore (SQLite-based, replaces Hyperspell)
from agents.context_store import SimpleContextStore as Hyperspell

COMPONENT_IDS = ['eng-001', 'trn-001', 'hyd-001', 'sus-001', 'fcs-001', 'com-001']
COMPONENT_NAMES = {
    'eng-001': 'Main Engine',
    'trn-001': 'Transmission',
    'hyd-001': 'Hydraulic System',
    'sus-001': 'Suspension System',
    'fcs-001': 'Fire Control System',
    'com-001': 'Communications Array'
}


class HealthAgent:
    """Agent responsible for health prediction and natural language explanations"""
    
    def __init__(self, tank_id: str, openai_client: OpenAI = None, hyperspell: Hyperspell = None):
        self.tank_id = tank_id
        self.openai_client = openai_client
        self.hyperspell = hyperspell
        self.namespace = f"tank_{tank_id}"
    
    def generate_explanation(self, component_id: str, health_result: dict) -> str:
        """
        Generate natural language explanation for component health
        
        Args:
            component_id: Component identifier
            health_result: Result from compute_health_index
        
        Returns:
            Natural language explanation
        """
        if not self.openai_client:
            # Fallback to template-based explanation
            drivers = health_result.get('drivers', [])
            top_driver = drivers[0] if drivers else None
            
            explanation = f"{COMPONENT_NAMES.get(component_id, component_id)} health is {health_result['health']}%"
            if top_driver:
                explanation += f". Health is primarily affected by {top_driver['feature']} ({top_driver['contribution']*100:.1f}% contribution)."
            
            if health_result['status'] == 'critical':
                explanation += f" CRITICAL: Component requires immediate maintenance. RUL: {health_result['rul_hours']} hours."
            elif health_result['status'] == 'degraded':
                explanation += f" Component is degraded. RUL: {health_result['rul_hours']} hours. Schedule maintenance soon."
            
            return explanation
        
        # Use OpenAI to generate natural language explanation
        try:
            drivers = health_result.get('drivers', [])[:3]
            drivers_text = "\n".join([
                f"- {d['feature']}: {d['contribution']*100:.1f}% contribution"
                for d in drivers
            ])
            
            prompt = f"""Generate a concise technical explanation for tank component health prediction.

Component: {COMPONENT_NAMES.get(component_id, component_id)}
Health Index: {health_result['health']}%
Status: {health_result['status']}
Remaining Useful Life: {health_result['rul_hours']} hours

Top Contributing Factors:
{drivers_text}

Last Service: {health_result.get('lastServiced', 'Unknown')}
Next Service: {health_result.get('nextService', 'Unknown')}

Generate a 2-3 sentence explanation suitable for maintenance personnel. Focus on actionable insights."""

            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a maintenance engineer explaining component health predictions."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"Error generating explanation: {e}")
            # Fallback to template
            return f"{COMPONENT_NAMES.get(component_id, component_id)} health is {health_result['health']}% ({health_result['status']}). RUL: {health_result['rul_hours']} hours."
    
    def run(self, context: dict = None) -> dict:
        """
        Main agent execution
        
        Args:
            context: Context from previous agent (DataAgent)
        
        Returns:
            Dict with health predictions and explanations
        """
        log_activity(self.tank_id, 'HealthAgent', 'Computing component health predictions', 'in_progress')
        
        # Get context from Hyperspell if available
        if self.hyperspell:
            stored_context = self.hyperspell.retrieve(self.namespace, 'data_ingestion')
            if stored_context:
                context = json.loads(stored_context) if isinstance(stored_context, str) else stored_context
        
        # Compute health for all components
        components = []
        for component_id in COMPONENT_IDS:
            try:
                health_result = compute_health_index(self.tank_id, component_id)
                
                if 'error' not in health_result:
                    # Generate natural language explanation
                    explanation = self.generate_explanation(component_id, health_result)
                    
                    component_data = {
                        'id': component_id,
                        'name': COMPONENT_NAMES.get(component_id, component_id),
                        'health': health_result['health'],
                        'status': health_result['status'],
                        'rul_hours': health_result['rul_hours'],
                        'lastServiced': health_result.get('lastServiced', 'Unknown'),
                        'nextService': health_result.get('nextService', 'Unknown'),
                        'explanation': explanation,
                        'drivers': health_result.get('drivers', []),
                        'formula': health_result.get('formula', {})
                    }
                    
                    components.append(component_data)
            except Exception as e:
                print(f"Error computing health for {component_id}: {e}")
                continue
        
        # Compute tank readiness score
        readiness_score = compute_readiness_score(self.tank_id, COMPONENT_IDS)
        
        # Store results in Hyperspell
        if self.hyperspell:
            health_context = {
                'readiness_score': readiness_score,
                'components': components,
                'timestamp': datetime.now().isoformat(),
                'critical_count': len([c for c in components if c['status'] == 'critical']),
                'degraded_count': len([c for c in components if c['status'] == 'degraded'])
            }
            
            self.hyperspell.store(
                namespace=self.namespace,
                key='health_predictions',
                value=json.dumps(health_context)
            )
        
        # Log completion
        critical_count = len([c for c in components if c['status'] == 'critical'])
        log_activity(
            self.tank_id,
            'HealthAgent',
            f'Completed health predictions: Readiness {readiness_score}%, {critical_count} critical components',
            'completed',
            json.dumps({
                'readiness_score': readiness_score,
                'components': len(components),
                'critical': critical_count
            })
        )
        
        return {
            'status': 'success',
            'tank_id': self.tank_id,
            'readiness_score': readiness_score,
            'components': components,
            'next_agent': 'SchedulerAgent',
            'context': {
                'tank_id': self.tank_id,
                'readiness_score': readiness_score,
                'critical_components': [c['id'] for c in components if c['status'] == 'critical'],
                'degraded_components': [c['id'] for c in components if c['status'] == 'degraded']
            }
        }


if __name__ == '__main__':
    # Test agent
    from agents.config import OPENAI_API_KEY, HYPERSPELL_API_KEY
    
    openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_AVAILABLE and OPENAI_API_KEY else None
    hyperspell = Hyperspell(api_key=HYPERSPELL_API_KEY) if HYPERSPELL_AVAILABLE else None
    
    agent = HealthAgent('TNK-B-023', openai_client=openai_client, hyperspell=hyperspell)
    result = agent.run()
    
    print(f"\nHealthAgent Result:")
    print(f"  Readiness Score: {result['readiness_score']}%")
    print(f"  Components: {len(result['components'])}")
    print(f"  Critical: {len(result['context']['critical_components'])}")
    print(f"  Next Agent: {result['next_agent']}")

