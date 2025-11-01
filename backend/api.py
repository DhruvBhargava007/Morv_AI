#!/usr/bin/env python3
"""
Backend API for Predictive Insights Dashboard
Provides REST API endpoints to interact with tank database
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
import uuid
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
from werkzeug.utils import secure_filename
import tempfile
import shutil

# Import our modules
from ingestion import ingest_tank_data
from health_engine import compute_health_index, compute_readiness_score

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), 'tank_database.db')
COMPONENT_IDS = ['eng-001', 'trn-001', 'hyd-001', 'sus-001', 'fcs-001', 'com-001']
COMPONENT_NAMES = {
    'eng-001': 'Main Engine',
    'trn-001': 'Transmission',
    'hyd-001': 'Hydraulic System',
    'sus-001': 'Suspension System',
    'fcs-001': 'Fire Control System',
    'com-001': 'Communications Array'
}


def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.route('/api/tanks', methods=['GET'])
def get_tanks():
    """Get all tanks with basic information"""
    conn = get_db_connection()
    
    query = """
    SELECT 
        t.tank_id as id,
        t.name || ' ' || t.variant as model,
        CASE 
            WHEN t.tank_id % 4 = 0 THEN 'critical'
            WHEN t.tank_id % 4 = 1 THEN 'maintenance'
            ELSE 'operational'
        END as status,
        (80 + (t.tank_id * 3) % 20) as health_score,
        'B-' || t.tank_id as location,
        (1000 + t.tank_id * 234) as operating_hours,
        date('now', '-' || (t.tank_id * 2) || ' days') as last_service,
        date('now', '+' || (30 - t.tank_id * 2) || ' days') as next_service,
        (t.tank_id % 10) as alerts
    FROM tanks t
    ORDER BY t.tank_id
    LIMIT 50
    """
    
    rows = conn.execute(query).fetchall()
    conn.close()
    
    tanks = []
    for row in rows:
        tanks.append({
            'id': f"TANK-A-{str(row['id']).zfill(3)}",
            'model': row['model'],
            'status': row['status'],
            'healthScore': row['health_score'],
            'location': row['location'],
            'operatingHours': row['operating_hours'],
            'lastService': row['last_service'],
            'nextService': row['next_service'],
            'alerts': row['alerts'],
            'systemHealth': {
                'POWERTRAIN': 70 + (row['id'] * 2) % 30,
                'SUSPENSION': 60 + (row['id'] * 3) % 40,
                'WEAPONS': 85 + (row['id'] * 5) % 15,
                'ARMOR': 90 + (row['id'] * 7) % 10,
                'ELECTRICAL': 75 + (row['id'] * 11) % 25,
                'FIRE_CONTROL': 80 + (row['id'] * 13) % 20,
                'COMMUNICATION': 85 + (row['id'] * 17) % 15,
                'HYDRAULICS': 70 + (row['id'] * 19) % 30,
                'CREW_SYSTEMS': 75 + (row['id'] * 23) % 25,
                'AMMUNITION': 90 + (row['id'] * 29) % 10,
            }
        })
    
    return jsonify({
        'tanks': tanks,
        'stats': {
            'totalTanks': len(tanks),
            'criticalTanks': len([t for t in tanks if t['status'] == 'critical']),
            'warningTanks': len([t for t in tanks if t['healthScore'] < 70]),
            'lastUpdated': datetime.now().isoformat()
        }
    })


@app.route('/api/tanks/<tank_id>', methods=['GET'])
def get_tank(tank_id: str):
    """Get detailed information for a specific tank"""
    # Extract numeric ID from tank_id (e.g., "TANK-A-001" -> 1)
    try:
        numeric_id = int(tank_id.split('-')[-1])
    except:
        return jsonify({'error': 'Invalid tank ID'}), 400
    
    conn = get_db_connection()
    
    # Get tank details
    tank_query = """
    SELECT 
        t.tank_id,
        t.name || ' ' || t.variant as model,
        t.country,
        t.weight_combat_kg,
        p.max_speed_road_kmh,
        e.max_power_hp,
        wm.gun_caliber_mm
    FROM tanks t
    LEFT JOIN performance p ON t.tank_id = p.tank_id
    LEFT JOIN engines e ON t.tank_id = e.tank_id
    LEFT JOIN weapons_main wm ON t.tank_id = wm.tank_id
    WHERE t.tank_id = ?
    """
    
    row = conn.execute(tank_query, (numeric_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Tank not found'}), 404
    
    conn.close()
    
    return jsonify({
        'id': f"TANK-A-{str(row['tank_id']).zfill(3)}",
        'model': row['model'],
        'country': row['country'],
        'weight': row['weight_combat_kg'],
        'maxSpeed': row['max_speed_road_kmh'],
        'power': row['max_power_hp'],
        'gunCaliber': row['gun_caliber_mm']
    })


# Old endpoints removed - replaced with v2 below


@app.route('/api/parts', methods=['GET'])
def get_parts():
    """Get parts requirements"""
    tank_id = request.args.get('tank_id')
    
    # Mock parts requirements
    parts = [
        {
            'id': '1',
            'name': 'Road Wheel Assembly',
            'quantity': 6,
            'inStock': 2,
            'needByDate': (datetime.now() + timedelta(days=10)).isoformat(),
            'leadTimeDays': 14,
            'supplier': 'Defense Parts Co.',
            'cost': 15000,
            'status': 'need_to_order'
        },
        {
            'id': '2',
            'name': 'Transmission Fluid (20L)',
            'quantity': 20,
            'inStock': 15,
            'needByDate': (datetime.now() + timedelta(days=20)).isoformat(),
            'leadTimeDays': 3,
            'supplier': 'Fluid Systems Inc.',
            'cost': 450,
            'status': 'in_stock'
        }
    ]
    
    return jsonify({'parts': parts})


@app.route('/api/ingest', methods=['POST'])
def ingest_data():
    """
    Ingest CSV data files for a tank
    Expects multipart/form-data with tank_id and 6 CSV files
    """
    if 'tank_id' not in request.form:
        return jsonify({'error': 'tank_id is required'}), 400
    
    tank_id = request.form['tank_id']
    
    # Check if files are provided
    required_files = ['maintenance', 'risk', 'priority', 'usage', 'sensors', 'logs']
    uploaded_files = {}
    
    for file_type in required_files:
        file_key = f'{file_type}_file'
        if file_key in request.files:
            uploaded_files[file_type] = request.files[file_key]
    
    if not uploaded_files:
        return jsonify({'error': 'No files uploaded'}), 400
    
    # Create temporary directory for uploads
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Save uploaded files
        for file_type, file_obj in uploaded_files.items():
            filename = secure_filename(f'{file_type}.csv')
            file_path = os.path.join(temp_dir, filename)
            file_obj.save(file_path)
        
        # Ingest data
        summary = ingest_tank_data(tank_id, temp_dir)
        
        # Generate job ID for tracking
        job_id = str(uuid.uuid4())
        
        response = {
            'jobId': job_id,
            'tankId': tank_id,
            'status': summary['status'],
            'filesProcessed': summary['files_processed'],
            'ingestedCounts': {
                file_type: result.get('rows_inserted', 0)
                for file_type, result in summary['file_results'].items()
            },
            'warnings': summary['warnings'][:10],  # Limit warnings
            'errors': summary['errors'][:10]  # Limit errors
        }
        
        return jsonify(response), 200 if summary['status'] == 'success' else 207
        
    finally:
        # Clean up temporary directory
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.route('/api/predictions', methods=['GET'])
def get_predictions_v2():
    """
    Get component health predictions for a tank
    Replaces the old mock endpoint with real calculations
    """
    tank_id = request.args.get('tank_id')
    
    if not tank_id:
        return jsonify({'error': 'tank_id parameter is required'}), 400
    
    # Compute health for all components
    components = []
    for component_id in COMPONENT_IDS:
        try:
            health_result = compute_health_index(tank_id, component_id)
            
            if 'error' not in health_result:
                components.append({
                    'id': component_id,
                    'name': COMPONENT_NAMES.get(component_id, component_id),
                    'health': health_result['health'],
                    'status': health_result['status'],
                    'hoursRemaining': health_result['rul_hours'],
                    'lastServiced': health_result.get('lastServiced', 'Unknown'),
                    'nextService': health_result.get('nextService', 'Unknown'),
                    'drivers': health_result.get('drivers', []),
                    'formula': health_result.get('formula', {})
                })
        except Exception as e:
            print(f"Error computing health for {component_id}: {e}")
            # Skip components with errors
            continue
    
    # Compute tank readiness score
    try:
        readiness_score = compute_readiness_score(tank_id, COMPONENT_IDS)
    except:
        readiness_score = 50.0  # Default fallback
    
    return jsonify({
        'tankId': tank_id,
        'readinessScore': readiness_score,
        'lastUpdated': datetime.now().isoformat(),
        'components': components
    })


@app.route('/api/maintenance', methods=['GET'])
def get_maintenance_v2():
    """
    Get maintenance schedule for a tank (rule-based, no AI yet)
    """
    tank_id = request.args.get('tank_id')
    
    if not tank_id:
        return jsonify({'error': 'tank_id parameter is required'}), 400
    
    # Get component health predictions
    components = []
    for component_id in COMPONENT_IDS:
        try:
            health_result = compute_health_index(tank_id, component_id)
            if 'error' not in health_result:
                components.append({
                    'id': component_id,
                    'health': health_result['health'],
                    'rul_hours': health_result['rul_hours'],
                    'status': health_result['status']
                })
        except:
            continue
    
    # Generate maintenance events based on rules
    events = []
    event_id = 1
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    for component in components:
        # Fetch priority policy
        cursor.execute("""
        SELECT basePriority, slaDays FROM priority_policy
        WHERE componentId = ?
        """, (component['id'],))
        policy = cursor.fetchone()
        
        base_priority = policy['basePriority'] if policy else 'medium'
        sla_days = policy['slaDays'] if policy else 7
        
        # Rule-based priority
        if component['rul_hours'] < 72 or component['health'] < 40:
            priority = 'critical'
            scheduled_date = datetime.now() + timedelta(days=1)
        elif component['rul_hours'] < 168 or component['health'] < 60:
            priority = 'high'
            scheduled_date = datetime.now() + timedelta(days=3)
        elif component['rul_hours'] < 336 or component['health'] < 75:
            priority = 'medium'
            scheduled_date = datetime.now() + timedelta(days=sla_days)
        else:
            priority = 'low'
            scheduled_date = datetime.now() + timedelta(days=sla_days * 2)
        
        # Determine type
        if component['health'] < 70:
            event_type = 'unscheduled'
        elif component['health'] < 80:
            event_type = 'preventive'
        else:
            event_type = 'scheduled'
        
        # Only create events for components needing attention
        if component['health'] < 80 or component['rul_hours'] < 336:
            events.append({
                'id': f'mnt-{event_id:03d}',
                'date': scheduled_date.strftime('%Y-%m-%d'),
                'type': event_type,
                'component': component['id'],
                'description': f"{component['id']} maintenance - Health: {component['health']}%, RUL: {component['rul_hours']}h",
                'status': 'pending',
                'priority': priority
            })
            event_id += 1
    
    conn.close()
    
    return jsonify({
        'tankId': tank_id,
        'events': events
    })


@app.route('/api/activity', methods=['GET'])
def get_activity():
    """Get recent agent activity for a tank"""
    tank_id = request.args.get('tank_id')
    limit = request.args.get('limit', 50, type=int)
    
    conn = get_db_connection()
    
    query = """
    SELECT id, tankId, agentName, action, status, details, timestamp
    FROM agent_activity_log
    """
    
    params = []
    if tank_id:
        query += " WHERE tankId = ?"
        params.append(tank_id)
    
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)
    
    rows = conn.execute(query, params).fetchall()
    conn.close()
    
    activities = []
    for row in rows:
        activities.append({
            'id': row['id'],
            'tankId': row['tankId'],
            'agentName': row['agentName'],
            'action': row['action'],
            'status': row['status'],
            'details': json.loads(row['details']) if row['details'] else {},
            'timestamp': row['timestamp']
        })
    
    return jsonify({'activities': activities})


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'database': os.path.exists(DB_PATH)})


if __name__ == '__main__':
    # Check if database exists
    if not os.path.exists(DB_PATH):
        print(f"Warning: Database not found at {DB_PATH}")
        print("Run scripts/create_tank_database.py to create the database")
    
    app.run(debug=True, port=8000)

