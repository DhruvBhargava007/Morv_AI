#!/usr/bin/env python3
"""
Enhanced Health Agent - AI-Driven
Uses AI for pattern recognition and health prediction instead of just formulas
"""

import os
import sys
import json
from datetime import datetime
from typing import Dict, List

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from health_engine import compute_health_index, compute_readiness_score
from health_engine import fetch_telemetry
from ingestion import log_activity
from agents.ai_health_predictor import AIHealthPredictor

# Try to import OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Use SimpleContextStore
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


class EnhancedHealthAgent:
    """AI-driven health agent using LLM for pattern analysis"""
    
    def __init__(self, tank_id: str, openai_client: OpenAI = None, hyperspell: Hyperspell = None):
        self.tank_id = tank_id
        self.openai_client = openai_client
        self.hyperspell = hyperspell
        self.namespace = f"tank_{tank_id}"
        self.ai_predictor = AIHealthPredictor(openai_client) if openai_client else None
    
    def predict_health_with_ai(self, component_id: str) -> Dict:
        """
        Use AI to predict component health from telemetry patterns
        
        Args:
            component_id: Component identifier
        
        Returns:
            Enhanced health prediction with AI insights
        """
        component_name = COMPONENT_NAMES.get(component_id, component_id)
        
        # Get telemetry data
        telemetry_df = fetch_telemetry(self.tank_id, component_id, days=30)
        
        if len(telemetry_df) == 0:
            # Fallback to formula if no data
            return compute_health_index(self.tank_id, component_id)
        
        # Get formula-based result for comparison
        formula_result = compute_health_index(self.tank_id, component_id)
        
        # Use AI to analyze patterns
        if self.ai_predictor:
            ai_prediction = self.ai_predictor.analyze_telemetry_patterns(
                telemetry_df, component_name
            )
            
            if 'error' not in ai_prediction:
                # Synthesize AI and formula results
                enhanced_result = self.ai_predictor.compare_with_formula(
                    ai_prediction, formula_result
                )
                return enhanced_result
        
        # Fallback to formula if AI unavailable
        return formula_result
    
    def generate_comprehensive_explanation(self, component_id: str, health_result: dict) -> str:
        """Generate detailed AI explanation with context"""
        if not self.openai_client:
            return health_result.get('ai_reasoning', 'Health analysis completed.')
        
        try:
            component_name = COMPONENT_NAMES.get(component_id, component_id)
            anomalies = health_result.get('anomalies', [])
            patterns = health_result.get('patterns_detected', [])
            
            prompt = f"""Provide a comprehensive technical explanation for tank component health:

Component: {component_name}
Health Index: {health_result['health']}%
Status: {health_result['status']}
Remaining Useful Life: {health_result['rul_hours']} hours

Anomalies Detected:
{chr(10).join(f'- {a}' for a in anomalies) if anomalies else 'None detected'}

Patterns Identified:
{chr(10).join(f'- {p}' for p in patterns) if patterns else 'Normal operation'}

Contributing Factors:
{chr(10).join(f'- {d.get("feature", "unknown")}: {d.get("reason", "significant contribution")}' for d in health_result.get('drivers', [])[:3])}

Generate a detailed 3-4 sentence explanation for maintenance personnel that:
1. Explains the current health status
2. Highlights critical anomalies or patterns
3. Provides actionable maintenance recommendations
4. Estimates urgency based on RUL and anomalies"""

            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a senior maintenance engineer providing detailed technical explanations with actionable insights."
                    },
                    {"role": "user", "content": prompt}
                ],
                max_tokens=250,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"Error generating explanation: {e}")
            return health_result.get('ai_reasoning', f"{component_name} health: {health_result['health']}%")
    
    def run(self, context: dict = None) -> dict:
        """Main agent execution with AI-driven predictions"""
        log_activity(self.tank_id, 'EnhancedHealthAgent', 'Computing AI-driven health predictions', 'in_progress')
        
        # Get context from Hyperspell if available
        if self.hyperspell:
            stored_context = self.hyperspell.retrieve(self.namespace, 'data_ingestion')
            if stored_context:
                context = json.loads(stored_context) if isinstance(stored_context, str) else stored_context
        
        # Compute health for all components using AI
        components = []
        for component_id in COMPONENT_IDS:
            try:
                # Use AI-enhanced prediction
                health_result = self.predict_health_with_ai(component_id)
                
                if 'error' not in health_result:
                    # Generate comprehensive explanation
                    explanation = self.generate_comprehensive_explanation(component_id, health_result)
                    
                    component_data = {
                        'id': component_id,
                        'name': COMPONENT_NAMES.get(component_id, component_id),
                        'health': health_result['health'],
                        'status': health_result['status'],
                        'rul_hours': health_result['rul_hours'],
                        'explanation': explanation,
                        'drivers': health_result.get('drivers', []),
                        'anomalies': health_result.get('anomalies', []),
                        'patterns_detected': health_result.get('patterns_detected', []),
                        'formula': health_result.get('formula', {}),
                        'source': health_result.get('source', 'formula')
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
                'degraded_count': len([c for c in components if c['status'] == 'degraded']),
                'ai_enhanced': True
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
            'EnhancedHealthAgent',
            f'Completed AI-driven health predictions: Readiness {readiness_score}%, {critical_count} critical components',
            'completed',
            json.dumps({
                'readiness_score': readiness_score,
                'components': len(components),
                'critical': critical_count,
                'ai_enhanced': True
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
                'degraded_components': [c['id'] for c in components if c['status'] == 'degraded'],
                'anomalies_detected': sum(len(c.get('anomalies', [])) for c in components)
            }
        }


if __name__ == '__main__':
    from agents.config import OPENAI_API_KEY, HYPERSPELL_API_KEY
    
    openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_AVAILABLE and OPENAI_API_KEY else None
    hyperspell = Hyperspell(api_key=HYPERSPELL_API_KEY) if HYPERSPELL_AVAILABLE else None
    
    agent = EnhancedHealthAgent('TNK-B-023', openai_client=openai_client, hyperspell=hyperspell)
    result = agent.run()
    
    print(f"\nEnhancedHealthAgent Result:")
    print(f"  Readiness Score: {result['readiness_score']}%")
    print(f"  Components: {len(result['components'])}")
    print(f"  Critical: {len(result['context']['critical_components'])}")
    print(f"  Anomalies Detected: {result['context']['anomalies_detected']}")

