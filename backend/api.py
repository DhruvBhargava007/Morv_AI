#!/usr/bin/env python3
"""
Backend API for Predictive Insights Dashboard
Provides REST API endpoints to interact with tank database
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), 'tank_database.db')


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


@app.route('/api/predictions', methods=['GET'])
def get_predictions():
    """Get failure predictions"""
    tank_id = request.args.get('tank_id')
    
    # Mock predictions - replace with actual ML predictions
    predictions = [
        {
            'id': '1',
            'system': 'SUSPENSION',
            'component': 'Road Wheels',
            'riskScore': 87,
            'estimatedFailure': {'minDays': 12, 'maxDays': 18},
            'confidence': 87,
            'severity': 'critical',
            'recommendations': [
                'Inspect road wheels for wear',
                'Check track tension',
                'Replace if necessary'
            ]
        },
        {
            'id': '2',
            'system': 'POWERTRAIN',
            'component': 'Transmission',
            'riskScore': 72,
            'estimatedFailure': {'minDays': 22, 'maxDays': 28},
            'confidence': 72,
            'severity': 'warning',
            'recommendations': [
                'Monitor transmission fluid levels',
                'Schedule maintenance service'
            ]
        }
    ]
    
    return jsonify({'predictions': predictions})


@app.route('/api/maintenance', methods=['GET'])
def get_maintenance():
    """Get maintenance tasks"""
    tank_id = request.args.get('tank_id')
    
    # Mock maintenance tasks
    maintenance_tasks = [
        {
            'id': '1',
            'system': 'SUSPENSION',
            'title': 'Suspension Inspection',
            'priority': {'urgency': 4, 'importance': 5},
            'estimatedDuration': 4,
            'scheduledDate': (datetime.now() + timedelta(days=3)).isoformat(),
            'partsReady': True,
            'status': 'pending'
        },
        {
            'id': '2',
            'system': 'POWERTRAIN',
            'title': 'Oil Change (Engine)',
            'priority': {'urgency': 3, 'importance': 4},
            'estimatedDuration': 2,
            'scheduledDate': (datetime.now() + timedelta(days=7)).isoformat(),
            'partsReady': True,
            'status': 'pending'
        }
    ]
    
    return jsonify({'tasks': maintenance_tasks})


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

