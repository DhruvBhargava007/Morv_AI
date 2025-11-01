#!/usr/bin/env python3
"""
Health Adjustment Agent - AI-Powered Health Score Adjustment
Processes uploaded CSV files (one of 6 categories) to adjust health calculations
and provide insights based on new data
"""

import os
import sys
import json
import logging
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get OpenAI API key from environment or config
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')


class HealthAdjustmentAgent:
    """AI Agent for adjusting health scores based on uploaded CSV data"""
    
    def __init__(self, tank_id: str, openai_client=None):
        self.tank_id = tank_id
        self.openai_client = openai_client or (OpenAI(api_key=OPENAI_API_KEY) if OPENAI_AVAILABLE and OPENAI_API_KEY else None)
        
    def _get_base_health_scores(self, component_ids: List[str]) -> Dict[str, Dict[str, Any]]:
        """Get base health scores for all components using health_engine"""
        from health_engine import compute_health_index
        
        base_scores = {}
        for component_id in component_ids:
            try:
                health_data = compute_health_index(self.tank_id, component_id)
                base_scores[component_id] = {
                    'health': health_data.get('health', 50),
                    'status': health_data.get('status', 'unknown'),
                    'rul_hours': health_data.get('rul_hours', 0),
                    'drivers': health_data.get('drivers', []),
                    'formula': health_data.get('formula', {})
                }
            except Exception as e:
                logger.error(f"Error fetching base health for {component_id}: {e}")
                base_scores[component_id] = {
                    'health': 50,
                    'status': 'unknown',
                    'rul_hours': 0,
                    'drivers': [],
                    'formula': {}
                }
        
        return base_scores
    
    def _get_component_ids_from_tank(self) -> List[str]:
        """Get all component IDs for the tank"""
        try:
            import sqlite3
            db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tank_database.db')
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            
            cursor = conn.cursor()
            cursor.execute(
                "SELECT DISTINCT component_id FROM telemetry WHERE tank_id = ?",
                (self.tank_id,)
            )
            component_ids = [row[0] for row in cursor.fetchall()]
            conn.close()
            return component_ids
        except Exception as e:
            logger.error(f"Error fetching component IDs: {e}")
            return []
    
    def _analyze_csv_with_ai(self, csv_data: pd.DataFrame, category: str, base_scores: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Use OpenAI to analyze CSV data and generate adjustments and insights
        
        Args:
            csv_data: Parsed CSV DataFrame
            category: CSV category (maintenance, risk, priority, usage, sensors, logs)
            base_scores: Base health scores for components
            
        Returns:
            Dict with 'adjustments' and 'insights'
        """
        if not self.openai_client:
            logger.warning("OpenAI client not available, using fallback")
            return self._fallback_analysis(csv_data, category, base_scores)
        
        try:
            # Prepare prompt
            csv_summary = csv_data.head(20).to_dict('records')  # Sample rows for context
            csv_stats = {
                'rows': len(csv_data),
                'columns': list(csv_data.columns),
                'sample': csv_summary[:5]  # First 5 rows
            }
            
            prompt = f"""You are an AI health analysis agent for military vehicle maintenance.
Analyze the uploaded {category} CSV data and provide:

1. Health Score Adjustments: For each component affected, calculate adjusted health scores (0-100) based on the new data.
   - Original scores are provided
   - Adjust based on anomalies, patterns, or critical information in the CSV
   - Provide confidence level (0-100) for each adjustment
   - Explain reasoning for each adjustment

2. Insights: Provide actionable insights and recommendations based on the data analysis.
   - Identify critical issues or patterns
   - Suggest maintenance priorities
   - Highlight urgent actions needed

CSV Category: {category}
CSV Data Summary:
{json.dumps(csv_stats, indent=2, default=str)}

Base Health Scores:
{json.dumps(base_scores, indent=2, default=str)}

Tank ID: {self.tank_id}

Respond in JSON format:
{{
  "adjustments": [
    {{
      "component_id": "eng-001",
      "original_health": 75.5,
      "adjusted_health": 68.2,
      "confidence": 85,
      "reasoning": "Sensor readings show increased vibration and temperature anomalies indicating bearing wear",
      "status_change": "degraded"
    }}
  ],
  "insights": [
    {{
      "type": "critical",
      "component_id": "eng-001",
      "message": "Immediate inspection required due to vibration spikes",
      "recommendation": "Schedule maintenance within 48 hours"
    }},
    {{
      "type": "warning",
      "message": "Overall system degradation trend detected",
      "recommendation": "Increase monitoring frequency"
    }}
  ]
}}

Return ONLY valid JSON, no additional text.
"""
            
            # Call OpenAI
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert military vehicle maintenance analyst. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            # Parse JSON
            ai_result = json.loads(response_text)
            
            return {
                'adjustments': ai_result.get('adjustments', []),
                'insights': ai_result.get('insights', [])
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            return self._fallback_analysis(csv_data, category, base_scores)
        except Exception as e:
            logger.error(f"Error in AI analysis: {e}")
            return self._fallback_analysis(csv_data, category, base_scores)
    
    def _fallback_analysis(self, csv_data: pd.DataFrame, category: str, base_scores: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Fallback analysis when AI is unavailable"""
        adjustments = []
        insights = []
        
        # Simple rule-based adjustments based on category
        if category == 'sensors':
            # Look for anomalies in sensor values
            if 'value' in csv_data.columns and 'componentId' in csv_data.columns:
                for component_id in csv_data['componentId'].unique():
                    if component_id in base_scores:
                        component_data = csv_data[csv_data['componentId'] == component_id]
                        if len(component_data) > 0:
                            avg_value = component_data['value'].mean()
                            # Simple heuristic: if values are high, reduce health
                            if avg_value > 100:  # Threshold example
                                original = base_scores[component_id]['health']
                                adjusted = max(0, original - 5)
                                adjustments.append({
                                    'component_id': component_id,
                                    'original_health': original,
                                    'adjusted_health': adjusted,
                                    'confidence': 60,
                                    'reasoning': f"Sensor values indicate potential issues (avg: {avg_value:.2f})",
                                    'status_change': None
                                })
        
        elif category == 'maintenance':
            # Recent maintenance events might improve health
            if 'componentId' in csv_data.columns and 'resultStatus' in csv_data.columns:
                recent_maintenance = csv_data[csv_data['resultStatus'] == 'completed']
                for component_id in recent_maintenance['componentId'].unique():
                    if component_id in base_scores:
                        original = base_scores[component_id]['health']
                        adjusted = min(100, original + 2)
                        adjustments.append({
                            'component_id': component_id,
                            'original_health': original,
                            'adjusted_health': adjusted,
                            'confidence': 70,
                            'reasoning': "Recent maintenance completed",
                            'status_change': None
                        })
        
        insights.append({
            'type': 'info',
            'message': 'Analysis completed using rule-based fallback',
            'recommendation': 'AI analysis unavailable, using basic heuristics'
        })
        
        return {
            'adjustments': adjustments,
            'insights': insights
        }
    
    def process_csv_and_adjust_health(
        self,
        csv_data: pd.DataFrame,
        category: str,
        component_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Process CSV file and generate health adjustments
        
        Args:
            csv_data: Parsed CSV DataFrame
            category: CSV category (one of 6: maintenance, risk, priority, usage, sensors, logs)
            component_ids: Optional list of component IDs to analyze (default: all in tank)
            
        Returns:
            Dict with:
            - 'original_scores': Dict of component_id -> base health data
            - 'adjusted_scores': Dict of component_id -> adjusted health data
            - 'insights': List of insights/recommendations
        """
        # Get component IDs if not provided
        if component_ids is None:
            component_ids = self._get_component_ids_from_tank()
        
        # Get base health scores
        base_scores = self._get_base_health_scores(component_ids)
        
        # Analyze CSV with AI
        ai_result = self._analyze_csv_with_ai(csv_data, category, base_scores)
        
        # Build adjusted scores
        adjusted_scores = {}
        for adjustment in ai_result.get('adjustments', []):
            component_id = adjustment['component_id']
            if component_id in base_scores:
                adjusted_scores[component_id] = {
                    'original_health': adjustment.get('original_health', base_scores[component_id]['health']),
                    'adjusted_health': adjustment.get('adjusted_health', base_scores[component_id]['health']),
                    'confidence': adjustment.get('confidence', 50),
                    'reasoning': adjustment.get('reasoning', 'No reasoning provided'),
                    'status': adjustment.get('status_change') or base_scores[component_id]['status'],
                    'base_data': base_scores[component_id]
                }
        
        # Include components without adjustments (use original scores)
        for component_id in component_ids:
            if component_id not in adjusted_scores:
                adjusted_scores[component_id] = {
                    'original_health': base_scores[component_id]['health'],
                    'adjusted_health': base_scores[component_id]['health'],  # No change
                    'confidence': 100,  # High confidence (no adjustment needed)
                    'reasoning': 'No adjustments needed based on uploaded data',
                    'status': base_scores[component_id]['status'],
                    'base_data': base_scores[component_id]
                }
        
        return {
            'original_scores': base_scores,
            'adjusted_scores': adjusted_scores,
            'insights': ai_result.get('insights', [])
        }


if __name__ == '__main__':
    # Test agent
    agent = HealthAdjustmentAgent('TNK-A-047')
    
    # Sample CSV data
    sample_csv = pd.DataFrame({
        'tankId': ['TNK-A-047', 'TNK-A-047'],
        'componentId': ['eng-001', 'eng-001'],
        'timestamp': ['2024-01-01 00:00:00', '2024-01-01 01:00:00'],
        'feature': ['oil_temp', 'vib_rms'],
        'value': [95.5, 2.8]
    })
    
    result = agent.process_csv_and_adjust_health(sample_csv, 'sensors')
    print(json.dumps(result, indent=2, default=str))

