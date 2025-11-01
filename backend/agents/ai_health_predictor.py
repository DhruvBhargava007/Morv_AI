#!/usr/bin/env python3
"""
AI-Driven Health Predictor
Uses LLM to analyze telemetry patterns and predict component health
"""

import json
import pandas as pd
from typing import Dict, List, Optional
from datetime import datetime, timedelta


class AIHealthPredictor:
    """Uses AI to predict component health from telemetry patterns"""
    
    def __init__(self, openai_client):
        self.openai_client = openai_client
    
    def analyze_telemetry_patterns(self, telemetry_df: pd.DataFrame, component_name: str) -> Dict:
        """
        Use AI to analyze telemetry patterns and detect anomalies
        
        Args:
            telemetry_df: DataFrame with timestamp, feature, value columns
            component_name: Name of the component
        
        Returns:
            Dict with AI-generated insights
        """
        if not self.openai_client or len(telemetry_df) == 0:
            return {'error': 'No AI client or data available'}
        
        # Aggregate telemetry data for AI analysis
        recent_data = telemetry_df.tail(100)  # Last 100 readings
        
        # Create summary statistics
        feature_summary = {}
        for feature in recent_data['feature'].unique():
            feature_data = recent_data[recent_data['feature'] == feature]
            feature_summary[feature] = {
                'mean': float(feature_data['value'].mean()),
                'std': float(feature_data['value'].std()),
                'min': float(feature_data['value'].min()),
                'max': float(feature_data['value'].max()),
                'trend': 'increasing' if len(feature_data) > 1 and feature_data['value'].iloc[-1] > feature_data['value'].iloc[0] else 'decreasing'
            }
        
        # Prepare prompt for AI analysis
        prompt = f"""Analyze telemetry data for a tank component and predict its health status.

Component: {component_name}

Telemetry Summary (last 100 readings):
{json.dumps(feature_summary, indent=2)}

Recent readings (last 10):
{recent_data.tail(10).to_dict('records')}

Based on the telemetry patterns, provide:
1. Health assessment (0-100 scale)
2. Predicted failure risk (low/medium/high/critical)
3. Estimated remaining useful life (RUL) in hours
4. Top 3 contributing factors
5. Specific anomalies or patterns detected
6. Recommended maintenance urgency

Respond in JSON format:
{{
    "health": <number>,
    "risk": "<low|medium|high|critical>",
    "rul_hours": <number>,
    "contributing_factors": [
        {{"factor": "<name>", "contribution": <0-1>, "reason": "<explanation>"}},
        ...
    ],
    "anomalies": ["<anomaly1>", ...],
    "patterns_detected": ["<pattern1>", ...],
    "maintenance_urgency": "<low|medium|high|critical>",
    "reasoning": "<explanation>"
}}"""

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert maintenance engineer analyzing tank component telemetry data. Provide precise health predictions based on sensor patterns, trends, and anomalies."
                    },
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=500
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            print(f"Error in AI health prediction: {e}")
            return {'error': str(e)}
    
    def compare_with_formula(self, ai_prediction: Dict, formula_result: Dict) -> Dict:
        """
        Compare AI prediction with formula-based result and synthesize
        
        Args:
            ai_prediction: AI-generated health prediction
            formula_result: Formula-based health calculation
        
        Returns:
            Synthesized result combining both approaches
        """
        if 'error' in ai_prediction:
            return formula_result
        
        # Weighted combination: 70% AI, 30% formula for critical components
        ai_health = ai_prediction.get('health', formula_result.get('health', 50))
        formula_health = formula_result.get('health', 50)
        
        # Use AI prediction if it indicates higher risk
        if ai_prediction.get('risk') in ['high', 'critical']:
            final_health = 0.8 * ai_health + 0.2 * formula_health
        else:
            final_health = 0.6 * ai_health + 0.4 * formula_health
        
        # Use AI RUL if available and more conservative
        ai_rul = ai_prediction.get('rul_hours', formula_result.get('rul_hours', 0))
        formula_rul = formula_result.get('rul_hours', 0)
        final_rul = min(ai_rul, formula_rul) if ai_rul > 0 and formula_rul > 0 else (ai_rul if ai_rul > 0 else formula_rul)
        
        # Merge contributing factors
        ai_factors = ai_prediction.get('contributing_factors', [])
        formula_drivers = formula_result.get('drivers', [])
        
        # Combine and deduplicate
        combined_factors = []
        factor_names = set()
        
        for factor in ai_factors[:3]:
            combined_factors.append({
                'feature': factor.get('factor', 'unknown'),
                'contribution': factor.get('contribution', 0.0),
                'reason': factor.get('reason', ''),
                'source': 'ai'
            })
            factor_names.add(factor.get('factor', 'unknown'))
        
        for driver in formula_drivers:
            if driver['feature'] not in factor_names:
                combined_factors.append({
                    **driver,
                    'source': 'formula'
                })
        
        return {
            'health': round(final_health, 2),
            'rul_hours': round(final_rul, 2),
            'status': ai_prediction.get('risk', 'operational').lower().replace('critical', 'critical'),
            'drivers': combined_factors[:5],
            'anomalies': ai_prediction.get('anomalies', []),
            'patterns_detected': ai_prediction.get('patterns_detected', []),
            'ai_reasoning': ai_prediction.get('reasoning', ''),
            'formula': formula_result.get('formula', {}),
            'source': 'ai_enhanced'
        }

