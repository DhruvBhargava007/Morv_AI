#!/usr/bin/env python3
"""
Supervisor - Mastra Orchestrator
Orchestrates the 4 agents in a workflow DAG
"""

import os
import sys
import json
from typing import Dict, Any

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from agents.data_agent import DataAgent
from agents.health_agent import HealthAgent
from agents.scheduler_agent import SchedulerAgent
from agents.logistics_agent import LogisticsAgent
from agents.config import OPENAI_API_KEY, HYPERSPELL_API_KEY, WORKFLOW_DAG

# NOTE: Mastra is TypeScript/Node.js only, not available for Python
# Using manual Python orchestration instead
MASTRA_AVAILABLE = False

# Use SimpleContextStore (SQLite-based, replaces Hyperspell)
from agents.context_store import SimpleContextStore as Hyperspell
HYPERSPELL_AVAILABLE = True

# Try to import OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class Supervisor:
    """Orchestrates multi-agent workflow for tank maintenance"""
    
    def __init__(self, tank_id: str):
        self.tank_id = tank_id
        
        # Initialize clients
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_AVAILABLE and OPENAI_API_KEY else None
        self.hyperspell = Hyperspell(api_key=HYPERSPELL_API_KEY) if HYPERSPELL_AVAILABLE else None
        
        # Initialize agents
        self.data_agent = DataAgent(tank_id, hyperspell=self.hyperspell)
        self.health_agent = HealthAgent(tank_id, openai_client=self.openai_client, hyperspell=self.hyperspell)
        self.scheduler_agent = SchedulerAgent(tank_id, openai_client=self.openai_client, hyperspell=self.hyperspell)
        self.logistics_agent = LogisticsAgent(tank_id, openai_client=self.openai_client, hyperspell=self.hyperspell)
        
        # Using Python orchestration (Mastra is TypeScript only)
        self.mastra = None
        self.workflow = None
    
    def _create_workflow(self):
        """Create workflow DAG - Mastra not available in Python, using manual orchestration"""
        return None
    
    def _run_data_agent(self, context: dict = None) -> dict:
        """Wrapper for DataAgent"""
        if 'data_directory' not in context:
            raise ValueError("data_directory required for DataAgent")
        return self.data_agent.run(context['data_directory'])
    
    def _run_health_agent(self, context: dict = None) -> dict:
        """Wrapper for HealthAgent"""
        return self.health_agent.run(context)
    
    def _run_scheduler_agent(self, context: dict = None) -> dict:
        """Wrapper for SchedulerAgent"""
        return self.scheduler_agent.run(context)
    
    def _run_logistics_agent(self, context: dict = None) -> dict:
        """Wrapper for LogisticsAgent"""
        return self.logistics_agent.run(context)
    
    def run_maintenance_pipeline(self, data_directory: str = None) -> Dict[str, Any]:
        """
        Run the complete maintenance pipeline
        
        Args:
            data_directory: Path to CSV files (optional if data already ingested)
        
        Returns:
            Complete pipeline result with all agent outputs
        """
        from ingestion import log_activity
        
        log_activity(
            self.tank_id,
            'Supervisor',
            'Starting maintenance pipeline',
            'in_progress',
            json.dumps({'pipeline': 'maintenance_workflow'})
        )
        
        try:
            # Use manual Python orchestration (Mastra is TypeScript only)
            result = self._run_manual_pipeline(data_directory)
            
            # Aggregate results
            pipeline_result = {
                'status': 'success',
                'tank_id': self.tank_id,
                'pipeline': 'maintenance_workflow',
                'results': {
                    'data_ingestion': result.get('data_agent_result', {}),
                    'health_predictions': result.get('health_agent_result', {}),
                    'maintenance_schedule': result.get('scheduler_agent_result', {}),
                    'logistics': result.get('logistics_agent_result', {})
                }
            }
            
            log_activity(
                self.tank_id,
                'Supervisor',
                'Completed maintenance pipeline',
                'completed',
                json.dumps({
                    'readiness_score': result.get('health_agent_result', {}).get('readiness_score', 0),
                    'events_generated': len(result.get('scheduler_agent_result', {}).get('events', [])),
                    'work_orders': len(result.get('logistics_agent_result', {}).get('work_orders', []))
                })
            )
            
            return pipeline_result
            
        except Exception as e:
            log_activity(
                self.tank_id,
                'Supervisor',
                f'Pipeline error: {str(e)}',
                'error',
                json.dumps({'error': str(e)})
            )
            
            return {
                'status': 'error',
                'tank_id': self.tank_id,
                'error': str(e)
            }
    
    def _run_manual_pipeline(self, data_directory: str = None) -> dict:
        """Manual orchestration fallback (without Mastra)"""
        result = {}
        
        # Step 1: DataAgent (if data_directory provided)
        if data_directory:
            data_result = self.data_agent.run(data_directory)
            result['data_agent_result'] = data_result
            context = data_result.get('context', {})
        else:
            context = {}
        
        # Step 2: HealthAgent
        health_result = self.health_agent.run(context)
        result['health_agent_result'] = health_result
        context = health_result.get('context', {})
        
        # Step 3: SchedulerAgent
        scheduler_result = self.scheduler_agent.run(context)
        result['scheduler_agent_result'] = scheduler_result
        context = scheduler_result.get('context', {})
        
        # Step 4: LogisticsAgent
        logistics_result = self.logistics_agent.run(context)
        result['logistics_agent_result'] = logistics_result
        
        return result


if __name__ == '__main__':
    import json
    
    # Test supervisor
    supervisor = Supervisor('TNK-B-023')
    
    result = supervisor.run_maintenance_pipeline(data_directory='synthetic_data/TNK-B-023')
    
    print(f"\nSupervisor Pipeline Result:")
    print(f"  Status: {result['status']}")
    print(f"  Readiness Score: {result['results']['health_predictions'].get('readiness_score', 0)}%")
    print(f"  Events: {len(result['results']['maintenance_schedule'].get('events', []))}")
    print(f"  Work Orders: {len(result['results']['logistics'].get('work_orders', []))}")

