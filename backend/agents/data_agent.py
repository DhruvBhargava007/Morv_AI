#!/usr/bin/env python3
"""
Data Agent
Handles CSV ingestion, validation, log parsing, and stores results in Hyperspell
"""

import os
import sys
import json
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from ingestion import ingest_tank_data, log_activity
from agents.tools import ingest_data

# Use SimpleContextStore (SQLite-based, replaces Hyperspell)
from agents.context_store import SimpleContextStore as Hyperspell


class DataAgent:
    """Agent responsible for data ingestion and validation"""
    
    def __init__(self, tank_id: str, hyperspell: Hyperspell = None):
        self.tank_id = tank_id
        self.hyperspell = hyperspell
        self.namespace = f"tank_{tank_id}"
    
    def run(self, data_directory: str) -> dict:
        """
        Main agent execution
        
        Args:
            data_directory: Path to directory containing CSV files
        
        Returns:
            Dict with ingestion summary and context for next agent
        """
        log_activity(self.tank_id, 'DataAgent', 'Starting data ingestion', 'in_progress')
        
        # Ingest data
        summary = ingest_tank_data(self.tank_id, data_directory)
        
        # Store context in Hyperspell
        if self.hyperspell:
            context = {
                'ingestion_summary': {
                    'status': summary['status'],
                    'files_processed': summary['files_processed'],
                    'total_rows_inserted': summary['total_rows_inserted'],
                    'timestamp': datetime.now().isoformat()
                },
                'components_ingested': len(summary.get('file_results', {})),
                'warnings': summary.get('warnings', [])[:5],  # Top 5 warnings
                'errors': summary.get('errors', [])[:5]  # Top 5 errors
            }
            
            self.hyperspell.store(
                namespace=self.namespace,
                key='data_ingestion',
                value=json.dumps(context)
            )
        
        # Log completion
        log_activity(
            self.tank_id,
            'DataAgent',
            f'Completed ingestion: {summary["files_processed"]} files, {summary["total_rows_inserted"]} rows',
            'completed' if summary['status'] == 'success' else 'warning',
            json.dumps({
                'files': summary['files_processed'],
                'rows': summary['total_rows_inserted'],
                'status': summary['status']
            })
        )
        
        return {
            'status': 'success' if summary['status'] == 'success' else 'partial',
            'summary': summary,
            'next_agent': 'HealthAgent',
            'context': {
                'tank_id': self.tank_id,
                'data_available': summary['status'] == 'success',
                'components_available': ['eng-001', 'trn-001', 'hyd-001', 'sus-001', 'fcs-001', 'com-001']
            }
        }


if __name__ == '__main__':
    # Test agent
    from agents.config import HYPERSPELL_API_KEY
    
    hyperspell = Hyperspell(api_key=HYPERSPELL_API_KEY) if HYPERSPELL_AVAILABLE else None
    
    agent = DataAgent('TNK-A-047', hyperspell=hyperspell)
    result = agent.run('synthetic_data/TNK-A-047')
    
    print(f"\nDataAgent Result:")
    print(f"  Status: {result['status']}")
    print(f"  Files: {result['summary']['files_processed']}")
    print(f"  Next Agent: {result['next_agent']}")

