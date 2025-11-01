#!/usr/bin/env python3
"""
Enhanced Supervisor - Uses AI-Driven Agents
Orchestrates enhanced agents with stronger AI dependency
"""

import os
import sys
import json
from typing import Dict, Any

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from agents.data_agent import DataAgent
from agents.enhanced_health_agent import EnhancedHealthAgent
from agents.intelligent_health_agent import IntelligentHealthAgent
from agents.enhanced_scheduler_agent import EnhancedSchedulerAgent
from agents.logistics_agent import LogisticsAgent
from agents.config import OPENAI_API_KEY, HYPERSPELL_API_KEY

# Try to import OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Use Enhanced Context Store for better learning
from agents.enhanced_context_store import EnhancedContextStore
from agents.context_store import SimpleContextStore as Hyperspell  # Fallback


class EnhancedSupervisor:
    """Orchestrates AI-driven agents for maintenance pipeline"""
    
    def __init__(self, tank_id: str, use_enhanced_agents: bool = True, use_intelligent_learning: bool = True):
        self.tank_id = tank_id
        self.use_enhanced_agents = use_enhanced_agents
        self.use_intelligent_learning = use_intelligent_learning
        
        # Initialize clients
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_AVAILABLE and OPENAI_API_KEY else None
        
        # Use enhanced context store for intelligent learning
        if use_intelligent_learning:
            self.context_store = EnhancedContextStore(api_key=HYPERSPELL_API_KEY)
            self.hyperspell = self.context_store  # For backward compatibility
        else:
            self.hyperspell = Hyperspell(api_key=HYPERSPELL_API_KEY)
            self.context_store = None
        
        if not self.openai_client:
            print("⚠️  WARNING: OpenAI client not available. Enhanced agents will fallback to rule-based methods.")
        
        # Initialize agents - use intelligent health agent if learning enabled
        self.data_agent = DataAgent(tank_id, hyperspell=self.hyperspell)
        
        if use_intelligent_learning and self.context_store:
            self.health_agent = IntelligentHealthAgent(tank_id, openai_client=self.openai_client, context_store=self.context_store)
        else:
            self.health_agent = EnhancedHealthAgent(tank_id, openai_client=self.openai_client, hyperspell=self.hyperspell)
        
        self.scheduler_agent = EnhancedSchedulerAgent(tank_id, openai_client=self.openai_client, hyperspell=self.hyperspell)
        self.logistics_agent = LogisticsAgent(tank_id, openai_client=self.openai_client, hyperspell=self.hyperspell)
    
    def run_maintenance_pipeline(self, data_directory: str = None) -> Dict[str, Any]:
        """
        Run the complete AI-enhanced maintenance pipeline
        
        Args:
            data_directory: Path to CSV files (optional if data already ingested)
        
        Returns:
            Complete pipeline result with all agent outputs
        """
        from ingestion import log_activity
        
        log_activity(
            self.tank_id,
            'EnhancedSupervisor',
            'Starting AI-enhanced maintenance pipeline',
            'in_progress',
            json.dumps({'pipeline': 'ai_enhanced_workflow', 'use_enhanced': self.use_enhanced_agents})
        )
        
        try:
            # Step 1: DataAgent (if data_directory provided)
            result = {}
            if data_directory:
                data_result = self.data_agent.run(data_directory)
                result['data_agent_result'] = data_result
                context = data_result.get('context', {})
            else:
                context = {}
            
            # Step 2: Enhanced HealthAgent (AI-driven pattern analysis)
            health_result = self.health_agent.run(context)
            result['health_agent_result'] = health_result
            context = health_result.get('context', {})
            
            # Step 3: Enhanced SchedulerAgent (AI-driven priority and optimization)
            scheduler_result = self.scheduler_agent.run(context)
            result['scheduler_agent_result'] = scheduler_result
            context = scheduler_result.get('context', {})
            
            # Step 4: LogisticsAgent
            logistics_result = self.logistics_agent.run(context)
            result['logistics_agent_result'] = logistics_result
            
            # Aggregate results
            pipeline_result = {
                'status': 'success',
                'tank_id': self.tank_id,
                'pipeline': 'ai_enhanced_workflow',
                'ai_enhanced': True,
                'results': {
                    'data_ingestion': result.get('data_agent_result', {}),
                    'health_predictions': result.get('health_agent_result', {}),
                    'maintenance_schedule': result.get('scheduler_agent_result', {}),
                    'logistics': result.get('logistics_agent_result', {})
                }
            }
            
            log_activity(
                self.tank_id,
                'EnhancedSupervisor',
                'Completed AI-enhanced maintenance pipeline',
                'completed',
                json.dumps({
                    'readiness_score': health_result.get('readiness_score', 0),
                    'events_generated': len(scheduler_result.get('events', [])),
                    'work_orders': len(logistics_result.get('work_orders', [])),
                    'ai_enhanced': True
                })
            )
            
            return pipeline_result
            
        except Exception as e:
            from ingestion import log_activity
            log_activity(
                self.tank_id,
                'EnhancedSupervisor',
                f'Pipeline error: {str(e)}',
                'error',
                json.dumps({'error': str(e)})
            )
            
            return {
                'status': 'error',
                'tank_id': self.tank_id,
                'error': str(e)
            }


if __name__ == '__main__':
    import json
    
    # Test enhanced supervisor
    supervisor = EnhancedSupervisor('TNK-B-023', use_enhanced_agents=True)
    
    result = supervisor.run_maintenance_pipeline(data_directory='synthetic_data/TNK-B-023')
    
    print(f"\nEnhanced Supervisor Pipeline Result:")
    print(f"  Status: {result['status']}")
    print(f"  AI Enhanced: {result.get('ai_enhanced', False)}")
    print(f"  Readiness Score: {result['results']['health_predictions'].get('readiness_score', 0)}%")
    print(f"  Events: {len(result['results']['maintenance_schedule'].get('events', []))}")
    print(f"  Work Orders: {len(result['results']['logistics'].get('work_orders', []))}")

