#!/usr/bin/env python3
"""
Composio Tool Wrappers
Wraps backend functions as agent-callable tools
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from health_engine import compute_health_index, compute_readiness_score, fetch_telemetry, fetch_usage_profile, fetch_maintenance_history, fetch_risk_profile
from ingestion import ingest_tank_data
import sqlite3

# Try to import Composio, fallback if not available
try:
    from composio import Action, composio_tool
    COMPOSIO_AVAILABLE = True
except ImportError:
    # Fallback decorator if Composio not installed
    def composio_tool(**kwargs):
        def decorator(func):
            return func
        return decorator
    COMPOSIO_AVAILABLE = False

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tank_database.db')


def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@composio_tool(
    name="ingest_data",
    description="Ingest CSV data files for a tank into the database"
)
def ingest_data(tank_id: str, data_directory: str) -> dict:
    """
    Ingests CSV files for a tank
    
    Args:
        tank_id: Tank identifier (e.g., "TNK-A-047")
        data_directory: Path to directory containing CSV files
    
    Returns:
        Dict with ingestion summary
    """
    from ingestion import ingest_tank_data
    return ingest_tank_data(tank_id, data_directory)


@composio_tool(
    name="compute_component_health",
    description="Compute health index and RUL for a specific component"
)
def compute_component_health(tank_id: str, component_id: str) -> dict:
    """
    Computes component health prediction
    
    Args:
        tank_id: Tank identifier
        component_id: Component identifier (e.g., "eng-001")
    
    Returns:
        Dict with health, RUL, status, drivers, formula
    """
    return compute_health_index(tank_id, component_id)


@composio_tool(
    name="query_telemetry",
    description="Query sensor telemetry data for a component"
)
def query_telemetry(tank_id: str, component_id: str, days: int = 30) -> dict:
    """
    Gets sensor telemetry data
    
    Args:
        tank_id: Tank identifier
        component_id: Component identifier
        days: Number of days to retrieve
    
    Returns:
        Dict with telemetry DataFrame as JSON
    """
    df = fetch_telemetry(tank_id, component_id, days)
    return {
        'data': df.to_dict('records') if len(df) > 0 else [],
        'count': len(df)
    }


@composio_tool(
    name="query_maintenance_history",
    description="Get maintenance history for a component"
)
def query_maintenance_history(tank_id: str, component_id: str) -> dict:
    """
    Gets maintenance events for a component
    
    Args:
        tank_id: Tank identifier
        component_id: Component identifier
    
    Returns:
        Dict with maintenance events
    """
    df = fetch_maintenance_history(tank_id, component_id)
    return {
        'events': df.to_dict('records') if len(df) > 0 else [],
        'count': len(df)
    }


@composio_tool(
    name="check_parts_inventory",
    description="Check parts inventory status for a component"
)
def check_parts_inventory(component_id: str) -> dict:
    """
    Checks parts inventory
    
    Args:
        component_id: Component identifier
    
    Returns:
        Dict with inventory status
    """
    conn = get_db_connection()
    
    # Query parts inventory (using dummy data structure for now)
    # TODO: Add actual parts inventory table
    component_name_map = {
        'eng-001': 'Engine',
        'trn-001': 'Transmission',
        'hyd-001': 'Hydraulic',
        'sus-001': 'Suspension',
        'fcs-001': 'Fire Control',
        'com-001': 'Communications'
    }
    
    component_name = component_name_map.get(component_id, 'Unknown')
    
    conn.close()
    
    return {
        'component_id': component_id,
        'component_name': component_name,
        'parts_available': True,  # Placeholder
        'min_quantity': 2,
        'current_quantity': 5
    }


@composio_tool(
    name="match_personnel",
    description="Find available personnel matching a specialization"
)
def match_personnel(specialization: str, location: str = None) -> dict:
    """
    Matches personnel by specialization
    
    Args:
        specialization: Required skill (e.g., "Hydraulics & Suspension")
        location: Preferred location (optional)
    
    Returns:
        Dict with matched personnel list
    """
    # TODO: Integrate with actual personnel database
    # For now, return placeholder matches
    specialization_map = {
        'Hydraulics': ['SPC Maria Rodriguez', 'SSG James Mitchell'],
        'Engine': ['SSG James Mitchell', 'SSG Thomas Jackson'],
        'Transmission': ['SPC Robert Taylor', 'SGT Christopher Lee'],
        'Suspension': ['SPC Robert Taylor', 'SPC Kevin Martinez'],
        'Fire Control': ['SGT David Chen', 'SPC Sarah Harris'],
        'Communications': ['SSG Jennifer Williams', 'SPC Sarah Harris']
    }
    
    matches = []
    for key, names in specialization_map.items():
        if key.lower() in specialization.lower():
            matches.extend(names)
    
    return {
        'specialization': specialization,
        'location': location,
        'matches': list(set(matches)),
        'count': len(set(matches))
    }


@composio_tool(
    name="generate_work_order",
    description="Generate a work order for parts procurement"
)
def generate_work_order(component_id: str, part_name: str, quantity: int, priority: str) -> dict:
    """
    Creates a work order draft
    
    Args:
        component_id: Component needing the part
        part_name: Part name
        quantity: Quantity needed
        priority: Priority level (low/medium/high/critical)
    
    Returns:
        Dict with work order details
    """
    import uuid
    from datetime import datetime
    
    return {
        'id': f'WO-{uuid.uuid4().hex[:8].upper()}',
        'component_id': component_id,
        'part_name': part_name,
        'quantity': quantity,
        'priority': priority,
        'status': 'draft',
        'created_at': datetime.now().isoformat()
    }


@composio_tool(
    name="query_priority_policy",
    description="Get priority policy for a component"
)
def query_priority_policy(component_id: str) -> dict:
    """
    Gets priority policy for a component
    
    Args:
        component_id: Component identifier
    
    Returns:
        Dict with priority policy
    """
    conn = get_db_connection()
    
    cursor = conn.cursor()
    cursor.execute("""
    SELECT basePriority, slaDays, deferCapDays
    FROM priority_policy
    WHERE componentId = ?
    """, (component_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            'component_id': component_id,
            'base_priority': row['basePriority'],
            'sla_days': row['slaDays'],
            'defer_cap_days': row['deferCapDays']
        }
    
    return {
        'component_id': component_id,
        'base_priority': 'medium',
        'sla_days': 7,
        'defer_cap_days': 3
    }


# Register all tools with Composio
TOOLS = [
    ingest_data,
    compute_component_health,
    query_telemetry,
    query_maintenance_history,
    check_parts_inventory,
    match_personnel,
    generate_work_order,
    query_priority_policy
]

