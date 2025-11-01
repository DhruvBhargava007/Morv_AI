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
    },
    'RepairAgent': {
        'name': 'RepairAgent',
        'description': 'Generates intelligent repair form field values with real-time streaming and reasoning',
        'tools': ['query_historical_repairs', 'estimate_repair_cost', 'find_optimal_vendor', 
                  'match_personnel', 'check_parts_inventory', 'query_telemetry', 'calculate_delivery_timeline']
    }
}

# Repair Agent Prompts
REPAIR_AGENT_PROMPTS = {
    'personnel_assignment': """You are an expert military maintenance coordinator analyzing a component repair request.

Component Details:
- ID: {component_id}
- Name: {component_name}
- Current Health: {health}%
- Status: {status}
- Hours Until Service: {hours_remaining}

Tank Context:
- Tank ID: {tank_id}
- Location: {location}
- Operating Hours: {operating_hours}

Historical Context:
{historical_repairs}

Available Personnel:
{available_personnel}

Your task: Fill out a personnel assignment form with ALL of the following fields (YOU MUST COMPLETE ALL 4 FIELDS):
1. personnelIds: Array of personnel IDs to assign (e.g., ["PER-002", "PER-008"]) - consider specialization match, availability, location proximity. Select 1-3 personnel.
2. estimatedHours: Realistic time estimate (number) based on component type, health status, and historical data
3. specialInstructions: Detailed technical instructions (string) based on component condition and past repair patterns
4. priority: One of "critical", "high", "medium", or "low" based on health, hours remaining, and mission criticality

IMPORTANT: You must provide ALL 4 fields. Stream one field at a time.

For each field, respond with this exact JSON format:
{
  "field": "fieldName",
  "value": <actual_value>,
  "reasoning": "explanation for your choice",
  "confidence": <0-100>
}

Example for personnelIds field:
{"field": "personnelIds", "value": ["PER-002", "PER-008"], "reasoning": "Selected SPC Maria Rodriguez (Hydraulics specialist) and SPC Kevin Martinez (Power Systems) based on component type and availability", "confidence": 88}

Stream each field sequentially.""",

    'work_order': """You are an expert military procurement specialist analyzing a parts order request.

Component Details:
- ID: {component_id}
- Name: {component_name}
- Current Health: {health}%
- Status: {status}
- Hours Until Service: {hours_remaining}

Tank Context:
- Tank ID: {tank_id}
- Location: {location}

Parts Inventory Status:
{parts_inventory}

Historical Orders:
{historical_orders}

Available Vendors:
{vendor_data}

Your task: Fill out a work order form with ALL of the following fields (YOU MUST COMPLETE ALL 8 FIELDS):
1. partNumber: Official part number string (e.g., "HYD-5580") - use historical data or generate from component specs
2. partName: Descriptive part name string (e.g., "Hydraulic Seals Kit")
3. quantity: Number of units needed (integer) - consider spares and future maintenance
4. priority: One of "critical", "high", "medium", or "low" based on urgency
5. justification: Detailed 2-3 sentence justification string for this order
6. vendor: Best vendor name (string) from available vendors based on lead time, cost, reliability for given priority
7. estimatedCost: Realistic cost estimate (number) in USD based on vendor pricing and quantity
8. deliveryTimeline: Expected delivery time string (e.g., "24-48 hours", "3-5 days")

IMPORTANT: You must provide ALL 8 fields. Stream one field at a time.

For each field, respond with this exact JSON format:
{
  "field": "fieldName",
  "value": <actual_value>,
  "reasoning": "explanation for your choice",
  "confidence": <0-100>
}

Example for partNumber field:
{"field": "partNumber", "value": "HYD-5580", "reasoning": "Part number from inventory database matches hydraulic seal kit needed for this component based on maintenance records", "confidence": 92}

Stream each field sequentially in order (1 through 8).""",

    'part_transfer': """You are an expert military logistics coordinator analyzing a part transfer request.

Component Details:
- ID: {component_id}
- Name: {component_name}
- Current Health: {health}%
- Status: {status}

Source Tank: {tank_id}
Destination Tank Context:
- Location: {location}
- Operating Hours: {operating_hours}

Tank Network:
{tank_network}

Parts Inventory Across Network:
{network_inventory}

Historical Transfers:
{historical_transfers}

Your task: Fill out a part transfer form with ALL of the following fields (YOU MUST COMPLETE ALL 8 FIELDS):
1. sourceTankId: Source tank ID string (e.g., "TNK-C-091") - consider proximity, surplus inventory, operational status
2. partId: Part identifier string for tracking (e.g., "PART-hyd-001-001")
3. partName: Descriptive part name string (e.g., "Hydraulic Seals Kit")
4. quantity: Number of units to transfer (integer)
5. reason: Detailed 2-3 sentence justification string for this transfer
6. transferPath: Array of tank IDs (e.g., ["TNK-C-091", "TNK-A-047"]) forming the optimal route (direct or multi-hop)
7. estimatedTime: Realistic transit time string (e.g., "6 hours", "12 hours")
8. logisticsCost: Estimated cost (number) in USD based on distance and logistics

IMPORTANT: You must provide ALL 8 fields. Stream one field at a time.

For each field, respond with this exact JSON format:
{
  "field": "fieldName",
  "value": <actual_value>,
  "reasoning": "explanation for your choice",
  "confidence": <0-100>
}

Example for sourceTankId field:
{"field": "sourceTankId", "value": "TNK-C-091", "reasoning": "Selected Charlie-091 as source because it has surplus hydraulic parts, is operationally ready (94% readiness), and has shortest transfer distance", "confidence": 87}

Example for transferPath field:
{"field": "transferPath", "value": ["TNK-C-091", "TNK-A-047"], "reasoning": "Direct path is most efficient with 2940km distance and 29-hour transit time", "confidence": 90}

Stream each field sequentially in order (1 through 8)."""
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

