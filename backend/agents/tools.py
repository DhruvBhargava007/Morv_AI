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


@composio_tool(
    name="query_historical_repairs",
    description="Get historical repair data for a component"
)
def query_historical_repairs(component_id: str, tank_id: str = None) -> dict:
    """
    Gets historical repair records for a component
    
    Args:
        component_id: Component identifier
        tank_id: Optional tank identifier for filtering
    
    Returns:
        Dict with historical repair records
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Query maintenance history as proxy for repairs
    query = """
    SELECT timestamp, componentId, healthBefore, healthAfter, 
           maintenanceType, costUSD, hoursSpent
    FROM maintenance
    WHERE componentId = ?
    """
    
    params = [component_id]
    if tank_id:
        query += " AND tankId = ?"
        params.append(tank_id)
    
    query += " ORDER BY timestamp DESC LIMIT 10"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    repairs = []
    for row in rows:
        repairs.append({
            'date': row['timestamp'],
            'component_id': row['componentId'],
            'health_before': row['healthBefore'],
            'health_after': row['healthAfter'],
            'maintenance_type': row['maintenanceType'],
            'cost': row['costUSD'],
            'hours_spent': row['hoursSpent']
        })
    
    return {
        'component_id': component_id,
        'repairs': repairs,
        'count': len(repairs)
    }


@composio_tool(
    name="estimate_repair_cost",
    description="Estimate cost for a repair based on component and repair type"
)
def estimate_repair_cost(component_id: str, repair_type: str, severity: str = 'medium') -> dict:
    """
    Estimates repair cost
    
    Args:
        component_id: Component identifier
        repair_type: Type of repair (personnel, work_order, transfer)
        severity: Severity level (low, medium, high, critical)
    
    Returns:
        Dict with cost estimates
    """
    # Base costs by component type
    component_type = component_id.split('-')[0]
    
    base_costs = {
        'eng': {'personnel': 800, 'work_order': 3500, 'transfer': 600},
        'trn': {'personnel': 700, 'work_order': 4200, 'transfer': 550},
        'hyd': {'personnel': 500, 'work_order': 2500, 'transfer': 450},
        'sus': {'personnel': 600, 'work_order': 2800, 'transfer': 500},
        'fcs': {'personnel': 400, 'work_order': 8500, 'transfer': 380},
        'com': {'personnel': 350, 'work_order': 15000, 'transfer': 320}
    }
    
    severity_multipliers = {
        'low': 0.8,
        'medium': 1.0,
        'high': 1.3,
        'critical': 1.6
    }
    
    base_cost = base_costs.get(component_type, {}).get(repair_type, 1000)
    multiplier = severity_multipliers.get(severity, 1.0)
    
    estimated_cost = base_cost * multiplier
    
    return {
        'component_id': component_id,
        'repair_type': repair_type,
        'severity': severity,
        'estimated_cost': round(estimated_cost, 2),
        'base_cost': base_cost,
        'multiplier': multiplier,
        'confidence': 0.75
    }


@composio_tool(
    name="find_optimal_vendor",
    description="Find the best vendor for a part based on priority and lead time requirements"
)
def find_optimal_vendor(part_type: str, priority: str = 'medium', max_lead_time_days: int = None) -> dict:
    """
    Finds optimal vendor
    
    Args:
        part_type: Type of part (Engine, Hydraulic, etc.)
        priority: Priority level (critical/high/medium/low)
        max_lead_time_days: Maximum acceptable lead time
    
    Returns:
        Dict with recommended vendor
    """
    # Vendor database
    vendors = [
        {
            'name': 'General Dynamics Land Systems',
            'specialties': ['Engine', 'Transmission', 'Track'],
            'lead_times': {'critical': 2, 'high': 3, 'medium': 5, 'low': 7},
            'reliability': 95,
            'cost_factor': 1.2
        },
        {
            'name': 'Honeywell Aerospace',
            'specialties': ['Hydraulic', 'Power'],
            'lead_times': {'critical': 2, 'high': 4, 'medium': 6, 'low': 10},
            'reliability': 92,
            'cost_factor': 1.1
        },
        {
            'name': 'BAE Systems',
            'specialties': ['Armor', 'Weapons', 'Fire Control'],
            'lead_times': {'critical': 3, 'high': 5, 'medium': 7, 'low': 14},
            'reliability': 90,
            'cost_factor': 1.3
        },
        {
            'name': 'Harris Corporation',
            'specialties': ['Communications', 'Radio', 'Electronics'],
            'lead_times': {'critical': 2, 'high': 3, 'medium': 5, 'low': 8},
            'reliability': 91,
            'cost_factor': 1.15
        },
        {
            'name': 'Lockheed Martin',
            'specialties': ['Fire Control', 'Electronics', 'Sensors'],
            'lead_times': {'critical': 2, 'high': 4, 'medium': 6, 'low': 12},
            'reliability': 93,
            'cost_factor': 1.4
        }
    ]
    
    # Filter by specialty
    matching_vendors = [v for v in vendors if any(spec in part_type for spec in v['specialties'])]
    
    if not matching_vendors:
        matching_vendors = vendors  # Fallback to all vendors
    
    # Score vendors based on priority and constraints
    scored_vendors = []
    for vendor in matching_vendors:
        lead_time = vendor['lead_times'].get(priority, 7)
        
        if max_lead_time_days and lead_time > max_lead_time_days:
            continue
        
        # Score: higher reliability, lower lead time, lower cost is better
        score = (vendor['reliability'] * 0.4) - (lead_time * 2) - (vendor['cost_factor'] * 10)
        
        scored_vendors.append({
            'vendor': vendor['name'],
            'lead_time_days': lead_time,
            'reliability': vendor['reliability'],
            'cost_factor': vendor['cost_factor'],
            'score': score
        })
    
    if not scored_vendors:
        return {
            'error': 'No vendors found matching criteria',
            'part_type': part_type,
            'priority': priority
        }
    
    # Sort by score
    scored_vendors.sort(key=lambda x: x['score'], reverse=True)
    best_vendor = scored_vendors[0]
    
    return {
        'recommended_vendor': best_vendor['vendor'],
        'lead_time_days': best_vendor['lead_time_days'],
        'reliability_score': best_vendor['reliability'],
        'cost_factor': best_vendor['cost_factor'],
        'alternatives': scored_vendors[1:3] if len(scored_vendors) > 1 else [],
        'part_type': part_type,
        'priority': priority
    }


@composio_tool(
    name="calculate_delivery_timeline",
    description="Calculate estimated delivery timeline based on vendor, priority, and location"
)
def calculate_delivery_timeline(vendor: str, priority: str, location: str = None) -> dict:
    """
    Calculates delivery timeline
    
    Args:
        vendor: Vendor name
        priority: Priority level
        location: Delivery location (optional)
    
    Returns:
        Dict with timeline estimates
    """
    # Base lead times by vendor
    vendor_lead_times = {
        'General Dynamics Land Systems': {'critical': 2, 'high': 3, 'medium': 5, 'low': 7},
        'Honeywell Aerospace': {'critical': 2, 'high': 4, 'medium': 6, 'low': 10},
        'BAE Systems': {'critical': 3, 'high': 5, 'medium': 7, 'low': 14},
        'Harris Corporation': {'critical': 2, 'high': 3, 'medium': 5, 'low': 8},
        'Lockheed Martin': {'critical': 2, 'high': 4, 'medium': 6, 'low': 12},
        'Raytheon Technologies': {'critical': 3, 'high': 5, 'medium': 8, 'low': 15},
        'L3Harris Technologies': {'critical': 2, 'high': 4, 'medium': 6, 'low': 10}
    }
    
    base_days = vendor_lead_times.get(vendor, {}).get(priority, 7)
    
    # Add location-based adjustments
    location_delays = {
        'Fort Hood': 0,
        'Fort Benning': 1,
        'Fort Irwin': 2,
        'Overseas': 5
    }
    
    location_delay = 0
    if location:
        for loc_key, delay in location_delays.items():
            if loc_key in location:
                location_delay = delay
                break
    
    total_days = base_days + location_delay
    
    # Format timeline string
    if total_days <= 2:
        timeline_str = f"{total_days * 24}-{(total_days + 1) * 24} hours"
    else:
        timeline_str = f"{total_days}-{total_days + 2} days"
    
    return {
        'vendor': vendor,
        'priority': priority,
        'location': location,
        'estimated_days': total_days,
        'timeline_string': timeline_str,
        'expedited_available': priority in ['critical', 'high']
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
    query_priority_policy,
    query_historical_repairs,
    estimate_repair_cost,
    find_optimal_vendor,
    calculate_delivery_timeline
]

