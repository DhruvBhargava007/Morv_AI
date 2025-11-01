#!/usr/bin/env python3
"""
Agent Configuration
Setup for Mastra orchestration, Hyperspell context, and Composio tools
"""

import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
HYPERSPELL_API_KEY = os.getenv('HYPERSPELL_API_KEY', 'hs2-182-wrOEoSA1mKDxlv0knF7y6F6eMIRUKWaq')

# Tank IDs for Hyperspell namespaces
TANK_NAMESPACES = ['TNK-A-047', 'TNK-B-023', 'TNK-C-091']

# Agent registry
AGENTS = {
    'DataAgent': {
        'name': 'DataAgent',
        'description': 'Handles CSV ingestion, validation, and data preprocessing',
        'tools': ['ingest_data', 'query_telemetry', 'validate_schema']
    },
    'HealthAgent': {
        'name': 'HealthAgent',
        'description': 'Computes component health predictions and RUL with natural language explanations',
        'tools': ['compute_component_health', 'query_telemetry', 'query_maintenance_history']
    },
    'SchedulerAgent': {
        'name': 'SchedulerAgent',
        'description': 'Generates maintenance schedules with AI-driven priority assessment',
        'tools': ['query_maintenance_history', 'check_parts_inventory', 'query_priority_policy']
    },
    'LogisticsAgent': {
        'name': 'LogisticsAgent',
        'description': 'Manages parts inventory, personnel assignment, and work order generation',
        'tools': ['check_parts_inventory', 'match_personnel', 'generate_work_order', 'optimize_transfer']
    }
}

# Hyperspell configuration
HYPERSPELL_CONFIG = {
    'api_key': HYPERSPELL_API_KEY,
    'namespaces': TANK_NAMESPACES,
    'context_retention_days': 90
}

# Mastra workflow DAG
WORKFLOW_DAG = {
    'nodes': ['DataAgent', 'HealthAgent', 'SchedulerAgent', 'LogisticsAgent'],
    'edges': [
        ('DataAgent', 'HealthAgent'),
        ('HealthAgent', 'SchedulerAgent'),
        ('SchedulerAgent', 'LogisticsAgent')
    ]
}

# Validate required keys
if not OPENAI_API_KEY:
    print("⚠️  WARNING: OPENAI_API_KEY not set in environment")
if not HYPERSPELL_API_KEY:
    print("⚠️  WARNING: HYPERSPELL_API_KEY not set")

