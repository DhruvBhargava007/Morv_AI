#!/usr/bin/env python3
"""
Intelligent Health Agent - Leveraging Enhanced Hyperspell
Uses historical learning, patterns, and fleet insights for better predictions
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
from agents.enhanced_context_store import EnhancedContextStore
from agents.ai_health_predictor import AIHealthPredictor

# Try to import OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

COMPONENT_IDS = ['eng-001', 'trn-001', 'hyd-001', 'sus-001', 'fcs-001', 'com-001']
COMPONENT_NAMES = {
    'eng-001': 'Main Engine',
    'trn-001': 'Transmission',
    'hyd-001': 'Hydraulic System',
    'sus-001': 'Suspension System',
    'fcs-001': 'Fire Control System',
    'com-001': 'Communications Array'
}


class IntelligentHealthAgent:
    """Health agent that learns from history and fleet patterns"""
    
    def __init__(self, tank_id: str, openai_client: OpenAI = None, context_store: EnhancedContextStore = None):
        self.tank_id = tank_id
        self.openai_client = openai_client
        self.context_store = context_store or EnhancedContextStore()
        self.namespace = f"tank_{tank_id}"
        self.ai_predictor = AIHealthPredictor(openai_client) if openai_client else None
    
    def get_historical_patterns(self, component_id: str) -> Dict:
        """Get learned patterns for this component"""
        patterns = self.context_store.get_learned_patterns(
            component_id=component_id,
            namespace=self.namespace
        )
        
        # Get fleet-wide patterns for this component
        fleet_patterns = self.context_store.get_fleet_insights(component_id=component_id)
        
        return {
            'tank_specific': patterns,
            'fleet_wide': fleet_patterns
        }
    
    def get_component_history(self, component_id: str) -> Dict:
        """Get component lifecycle history"""
        lifecycle = self.context_store.get_component_lifecycle(self.namespace, component_id)
        
        if lifecycle and len(lifecycle['health_trajectory']) > 5:
            trajectory = lifecycle['health_trajectory']
            
            # Calculate trends
            recent = trajectory[-10:] if len(trajectory) >= 10 else trajectory
            old = trajectory[:10] if len(trajectory) >= 10 else trajectory[:len(trajectory)//2]
            
            if old and recent:
                avg_old = sum(p['health'] for p in old) / len(old)
                avg_recent = sum(p['health'] for p in recent) / len(recent)
                trend = avg_recent - avg_old
                
                return {
                    'trajectory': trajectory,
                    'trend': trend,
                    'degradation_rate': abs(trend) / len(recent),
                    'patterns_detected': lifecycle.get('patterns_detected', [])
                }
        
        return {}
    
    def predict_with_ai_and_history(self, component_id: str, telemetry_df) -> Dict:
        """Predict health using AI, formulas, AND historical patterns"""
        import pandas as pd
        
        component_name = COMPONENT_NAMES.get(component_id, component_id)
        
        # Get formula result
        formula_result = compute_health_index(self.tank_id, component_id)
        
        # Get historical context
        patterns = self.get_historical_patterns(component_id)
        history = self.get_component_history(component_id)
        
        # Get similar tanks' experiences
        similar_tanks = self.context_store.get_similar_tank_contexts(self.namespace, limit=3)
        
        # Build rich context for AI
        ai_context = {
            'component': component_name,
            'current_health': formula_result.get('health', 50),
            'current_rul': formula_result.get('rul_hours', 0),
            'learned_patterns': patterns,
            'historical_trend': history.get('trend', 0) if history else 0,
            'degradation_rate': history.get('degradation_rate', 0) if history else 0,
            'similar_tanks': [
                {
                    'tank_id': t['namespace'].replace('tank_', ''),
                    'similarity': t['similarity'],
                    'outcomes': t['context'].get('components', [])
                }
                for t in similar_tanks
            ]
        }
        
        # Use AI with rich context
        if self.ai_predictor and len(telemetry_df) > 0:
            ai_prediction = self.ai_predictor.analyze_telemetry_patterns(telemetry_df, component_name)
            
            if 'error' not in ai_prediction:
                # Enhance AI prediction with historical insights
                enhanced_prediction = self._enhance_with_history(
                    ai_prediction, formula_result, patterns, history, similar_tanks
                )
                return enhanced_prediction
        
        # Fallback to formula
        return formula_result
    
    def _enhance_with_history(self, ai_prediction: Dict, formula_result: Dict,
                              patterns: Dict, history: Dict, similar_tanks: List[Dict]) -> Dict:
        """Enhance AI prediction with historical learning"""
        
        # Adjust confidence based on pattern matches
        pattern_confidence = 1.0
        if patterns['tank_specific']:
            # If we've seen similar patterns before, increase confidence
            matching_patterns = [
                p for p in patterns['tank_specific']
                if p.get('occurrence_count', 0) > 2
            ]
            if matching_patterns:
                pattern_confidence = min(1.0, 0.7 + len(matching_patterns) * 0.1)
        
        # Adjust RUL based on historical trends
        base_rul = ai_prediction.get('rul_hours', formula_result.get('rul_hours', 0))
        if history and history.get('degradation_rate'):
            # If degradation is faster than expected, reduce RUL
            degradation_factor = max(0.5, 1.0 - (history['degradation_rate'] * 0.1))
            adjusted_rul = base_rul * degradation_factor
        else:
            adjusted_rul = base_rul
        
        # Learn from similar tanks
        similar_outcomes = []
        if similar_tanks:
            for tank in similar_tanks:
                # Extract component data from similar tank context
                context = tank.get('context', {})
                components = context.get('components', [])
                for comp in components:
                    if comp.get('id') == component_id:
                        similar_outcomes.append(comp)
        
        # If similar tanks had failures, adjust risk
        if similar_outcomes:
            avg_health_similar = sum(c.get('health', 50) for c in similar_outcomes) / len(similar_outcomes)
            if avg_health_similar < 50:
                # Similar tanks had issues - increase risk
                current_risk = ai_prediction.get('risk', 'medium')
                risk_map = {'low': 'medium', 'medium': 'high', 'high': 'critical', 'critical': 'critical'}
                ai_prediction['risk'] = risk_map.get(current_risk, current_risk)
        
        # Store pattern if significant (extract component_id from function parameter)
        component_id_param = component_id  # Use parameter
        if ai_prediction.get('anomalies'):
            self.context_store.learn_pattern(
                pattern_type='anomaly',
                namespace=self.namespace,
                component_id=component_id_param,
                pattern_data={
                    'anomalies': ai_prediction.get('anomalies', []),
                    'health': ai_prediction.get('health', 0),
                    'patterns': ai_prediction.get('patterns_detected', [])
                },
                confidence=pattern_confidence
            )
        
        # Update lifecycle tracking
        self.context_store.update_component_lifecycle(
            self.namespace,
            component_id_param,
            ai_prediction.get('health', formula_result.get('health', 50)),
            adjusted_rul,
            ai_prediction.get('patterns_detected', [])
        )
        
        # Merge results
        enhanced = {
            'health': ai_prediction.get('health', formula_result.get('health', 50)),
            'rul_hours': adjusted_rul,
            'status': ai_prediction.get('risk', 'operational').lower().replace('critical', 'critical'),
            'drivers': ai_prediction.get('contributing_factors', []),
            'anomalies': ai_prediction.get('anomalies', []),
            'patterns_detected': ai_prediction.get('patterns_detected', []),
            'historical_context': {
                'pattern_matches': len(patterns['tank_specific']),
                'fleet_insights': len(patterns['fleet_wide']),
                'similar_tanks': len(similar_tanks),
                'trend': history.get('trend', 0) if history else None
            },
            'confidence': pattern_confidence,
            'source': 'intelligent_ai'
        }
        
        return enhanced
    
    def run(self, context: dict = None) -> dict:
        """Main execution with intelligent learning"""
        log_activity(self.tank_id, 'IntelligentHealthAgent', 'Computing health with learning', 'in_progress')
        
        # Get aggregated context for AI
        aggregated_context = self.context_store.aggregate_context_for_ai(self.namespace)
        
        # Compute health for all components
        components = []
        for component_id in COMPONENT_IDS:
            try:
                from health_engine import fetch_telemetry
                telemetry_df = fetch_telemetry(self.tank_id, component_id, days=30)
                
                # Use intelligent prediction
                health_result = self.predict_with_ai_and_history(component_id, telemetry_df)
                
                if 'error' not in health_result:
                    component_data = {
                        'id': component_id,
                        'name': COMPONENT_NAMES.get(component_id, component_id),
                        'health': health_result['health'],
                        'status': health_result['status'],
                        'rul_hours': health_result['rul_hours'],
                        'drivers': health_result.get('drivers', []),
                        'anomalies': health_result.get('anomalies', []),
                        'patterns_detected': health_result.get('patterns_detected', []),
                        'historical_context': health_result.get('historical_context', {}),
                        'confidence': health_result.get('confidence', 0.5),
                        'source': health_result.get('source', 'formula')
                    }
                    
                    components.append(component_data)
            except Exception as e:
                print(f"Error computing health for {component_id}: {e}")
                continue
        
        # Store results
        readiness_score = compute_readiness_score(self.tank_id, COMPONENT_IDS)
        
        result_context = {
            'readiness_score': readiness_score,
            'components': components,
            'timestamp': datetime.now().isoformat(),
            'intelligent': True,
            'patterns_used': sum(len(c.get('patterns_detected', [])) for c in components),
            'historical_insights_applied': True
        }
        
        self.context_store.store(
            self.namespace,
            'health_predictions',
            json.dumps(result_context),
            metadata={'intelligent': True, 'patterns_used': result_context['patterns_used']}
        )
        
        log_activity(
            self.tank_id,
            'IntelligentHealthAgent',
            f'Completed intelligent predictions: {readiness_score}% readiness',
            'completed',
            json.dumps(result_context)
        )
        
        return {
            'status': 'success',
            'tank_id': self.tank_id,
            'readiness_score': readiness_score,
            'components': components,
            'next_agent': 'SchedulerAgent',
            'context': {
                **result_context,
                'intelligent': True
            }
        }


if __name__ == '__main__':
    from agents.config import OPENAI_API_KEY
    
    openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_AVAILABLE and OPENAI_API_KEY else None
    context_store = EnhancedContextStore()
    
    agent = IntelligentHealthAgent('TNK-B-023', openai_client, context_store)
    result = agent.run()
    
    print(f"\nIntelligentHealthAgent Result:")
    print(f"  Readiness: {result['readiness_score']}%")
    print(f"  Components: {len(result['components'])}")
    print(f"  Patterns Used: {sum(len(c.get('patterns_detected', [])) for c in result['components'])}")

