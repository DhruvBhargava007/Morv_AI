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
from ingestion import ingest_tank_data, log_activity
from health_engine import compute_health_index, compute_readiness_score

# Import agents (with fallback if not installed)
try:
    from agents.supervisor import Supervisor
    from agents.config import OPENAI_API_KEY, HYPERSPELL_API_KEY
    # Use EnhancedContextStore for better Hyperspell integration
    try:
        from agents.enhanced_context_store import EnhancedContextStore
        ENHANCED_HYPERSPELL_AVAILABLE = True
    except ImportError:
        from agents.context_store import SimpleContextStore as EnhancedContextStore
        ENHANCED_HYPERSPELL_AVAILABLE = False
    
    # Try to use Hyperspell Cloud if available and enabled
    USE_HYPERSPELL_CLOUD = os.getenv('USE_HYPERSPELL_CLOUD', 'false').lower() == 'true'
    HYPERSPELL_CLOUD_AVAILABLE = False
    HyperspellCloudClient = None
    
    if USE_HYPERSPELL_CLOUD and HYPERSPELL_API_KEY:
        try:
            from agents.hyperspell_cloud_client import HyperspellCloudClient
            # Test connection
            test_client = HyperspellCloudClient(api_key=HYPERSPELL_API_KEY)
            HYPERSPELL_CLOUD_AVAILABLE = True
            print("✅ Hyperspell Cloud service enabled")
        except Exception as e:
            print(f"⚠️  Hyperspell Cloud unavailable: {e}. Using local storage.")
            HYPERSPELL_CLOUD_AVAILABLE = False
    
    AGENTS_AVAILABLE = True
except ImportError:
    AGENTS_AVAILABLE = False
    ENHANCED_HYPERSPELL_AVAILABLE = False
    HYPERSPELL_CLOUD_AVAILABLE = False
    USE_HYPERSPELL_CLOUD = False
    print("⚠️  Agents not available - using rule-based fallback")

app = Flask(__name__)
CORS(app)

# Handle database path for both local and serverless (Vercel)
if os.path.exists('/tmp'):  # Serverless environment (Vercel)
    DB_PATH = os.path.join('/tmp', 'tank_database.db')
    # In serverless, we may need to copy database on first run
    # For now, use /tmp which is writable
else:
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


def get_hyperspell_instance():
    """
    Get Hyperspell instance - uses cloud if available, otherwise local
    Returns instance that matches EnhancedContextStore interface
    """
    if HYPERSPELL_CLOUD_AVAILABLE and HyperspellCloudClient and USE_HYPERSPELL_CLOUD:
        try:
            return HyperspellCloudClient(api_key=HYPERSPELL_API_KEY)
        except:
            # Fallback to local if cloud fails
            return EnhancedContextStore()
    else:
        return EnhancedContextStore()


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
        
        # Use Supervisor with agents if available, otherwise direct ingestion
        if AGENTS_AVAILABLE:
            try:
                supervisor = Supervisor(tank_id)
                pipeline_result = supervisor.run_maintenance_pipeline(data_directory=temp_dir)
                
                # Extract results
                data_result = pipeline_result['results'].get('data_ingestion', {})
                summary = data_result.get('summary', {})
                
                response = {
                    'jobId': str(uuid.uuid4()),
                    'tankId': tank_id,
                    'status': pipeline_result['status'],
                    'filesProcessed': summary.get('files_processed', 0),
                    'ingestedCounts': {
                        file_type: result.get('rows_inserted', 0)
                        for file_type, result in summary.get('file_results', {}).items()
                    },
                    'warnings': summary.get('warnings', [])[:10],
                    'errors': summary.get('errors', [])[:10],
                    'agentResults': {
                        'readinessScore': pipeline_result['results'].get('health_predictions', {}).get('readiness_score', 0),
                        'eventsGenerated': len(pipeline_result['results'].get('maintenance_schedule', {}).get('events', [])),
                        'workOrdersCreated': len(pipeline_result['results'].get('logistics', {}).get('work_orders', []))
                    }
                }
                
                return jsonify(response), 200 if pipeline_result['status'] == 'success' else 207
                
            except Exception as e:
                print(f"Agent pipeline error: {e}")
                # Fallback to direct ingestion
                pass
        
        # Fallback: Direct ingestion (no agents)
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
    Uses agents with AI explanations if available, otherwise direct calculation
    """
    tank_id = request.args.get('tank_id')
    
    if not tank_id:
        return jsonify({'error': 'tank_id parameter is required'}), 400
    
    # Try to get from context store (agent results) first
    if AGENTS_AVAILABLE:
        try:
            hyperspell = get_hyperspell_instance()
            namespace = f"tank_{tank_id}"
            
            # Get health predictions from context store
            health_context = hyperspell.retrieve(namespace, 'health_predictions')
            
            # Also get learned patterns and fleet insights for enhanced predictions
            if ENHANCED_HYPERSPELL_AVAILABLE:
                all_patterns = {}
                all_insights = {}
                all_lifecycles = {}
                
                for component_id in COMPONENT_IDS:
                    # Get learned patterns for this component
                    patterns = hyperspell.get_learned_patterns(
                        component_id=component_id,
                        namespace=namespace,
                        min_confidence=0.6
                    )
                    if patterns:
                        all_patterns[component_id] = patterns
                    
                    # Get fleet-wide insights
                    insights = hyperspell.get_fleet_insights(component_id=component_id)
                    if insights:
                        all_insights[component_id] = insights
                    
                    # Get component lifecycle
                    lifecycle = hyperspell.get_component_lifecycle(namespace, component_id)
                    if lifecycle:
                        all_lifecycles[component_id] = lifecycle
            
            if health_context:
                if isinstance(health_context, str):
                    import json
                    health_context = json.loads(health_context)
                
                components_data = health_context.get('components', [])
                
                # Enhance components with learned patterns and insights
                if ENHANCED_HYPERSPELL_AVAILABLE:
                    for comp in components_data:
                        comp_id = comp.get('id', '')
                        if comp_id in all_patterns:
                            comp['learnedPatterns'] = all_patterns[comp_id]
                        if comp_id in all_insights:
                            comp['fleetInsights'] = all_insights[comp_id]
                        if comp_id in all_lifecycles:
                            lifecycle = all_lifecycles[comp_id]
                            comp['lifecycleTrend'] = {
                                'degradationRate': lifecycle.get('degradation_rate'),
                                'patternCount': len(lifecycle.get('patterns_detected', []))
                            }
                
                # Return agent-generated predictions with AI explanations
                return jsonify({
                    'tankId': tank_id,
                    'readinessScore': health_context.get('readiness_score', 0),
                    'lastUpdated': health_context.get('timestamp', datetime.now().isoformat()),
                    'components': components_data,
                    'source': 'agent',  # Indicates AI-generated
                    'hyperspellEnhanced': ENHANCED_HYPERSPELL_AVAILABLE
                })
        except Exception as e:
            print(f"Error retrieving from Hyperspell: {e}")
            # Fallback to direct calculation
    
    # Fallback: Direct calculation (no agents)
    components = []
    hyperspell = None
    namespace = f"tank_{tank_id}"
    
    # Initialize Hyperspell for pattern learning even without agents
    if AGENTS_AVAILABLE:
        try:
            hyperspell = get_hyperspell_instance()
        except:
            hyperspell = None
    
    for component_id in COMPONENT_IDS:
        try:
            health_result = compute_health_index(tank_id, component_id)
            
            if 'error' not in health_result:
                comp_data = {
                    'id': component_id,
                    'name': COMPONENT_NAMES.get(component_id, component_id),
                    'health': health_result['health'],
                    'status': health_result['status'],
                    'hoursRemaining': health_result['rul_hours'],
                    'lastServiced': health_result.get('lastServiced', 'Unknown'),
                    'nextService': health_result.get('nextService', 'Unknown'),
                    'drivers': health_result.get('drivers', []),
                    'formula': health_result.get('formula', {})
                }
                
                # Enhance with Hyperspell patterns if available
                if hyperspell and ENHANCED_HYPERSPELL_AVAILABLE:
                    # Get learned patterns
                    patterns = hyperspell.get_learned_patterns(
                        component_id=component_id,
                        namespace=namespace,
                        min_confidence=0.6
                    )
                    if patterns:
                        comp_data['learnedPatterns'] = patterns
                    
                    # Get fleet insights
                    insights = hyperspell.get_fleet_insights(component_id=component_id)
                    if insights:
                        comp_data['fleetInsights'] = insights
                    
                    # Update component lifecycle
                    hyperspell.update_component_lifecycle(
                        namespace=namespace,
                        component_id=component_id,
                        health=health_result['health'],
                        rul_hours=health_result['rul_hours'],
                        patterns=[d for d in health_result.get('drivers', [])]
                    )
                    
                    # Detect anomalies and learn patterns
                    if health_result['health'] < 50 or health_result['status'] == 'critical':
                        # Learn critical health pattern
                        hyperspell.learn_pattern(
                            pattern_type='critical_health',
                            namespace=namespace,
                            component_id=component_id,
                            pattern_data={
                                'health': health_result['health'],
                                'status': health_result['status'],
                                'drivers': health_result.get('drivers', []),
                                'rul_hours': health_result['rul_hours']
                            },
                            confidence=0.8
                        )
                
                components.append(comp_data)
        except Exception as e:
            print(f"Error computing health for {component_id}: {e}")
            continue
    
    # Compute tank readiness score
    try:
        readiness_score = compute_readiness_score(tank_id, COMPONENT_IDS)
    except:
        readiness_score = 50.0
    
    return jsonify({
        'tankId': tank_id,
        'readinessScore': readiness_score,
        'lastUpdated': datetime.now().isoformat(),
        'components': components,
        'source': 'direct',  # Indicates direct calculation
        'hyperspellEnhanced': ENHANCED_HYPERSPELL_AVAILABLE if hyperspell else False
    })


@app.route('/api/maintenance', methods=['GET'])
def get_maintenance_v2():
    """
    Get maintenance schedule for a tank
    Uses agents with AI-driven scheduling if available, otherwise rule-based
    """
    tank_id = request.args.get('tank_id')
    
    if not tank_id:
        return jsonify({'error': 'tank_id parameter is required'}), 400
    
    # Try to get from context store (agent results) first
    if AGENTS_AVAILABLE:
        try:
            hyperspell = get_hyperspell_instance()
            namespace = f"tank_{tank_id}"
            
            # Get maintenance schedule from context store
            schedule_context = hyperspell.retrieve(namespace, 'maintenance_schedule')
            
            if schedule_context:
                if isinstance(schedule_context, str):
                    import json
                    schedule_context = json.loads(schedule_context)
                
                # Get logistics recommendations
                logistics_context = hyperspell.retrieve(namespace, 'logistics_recommendations')
                if logistics_context:
                    if isinstance(logistics_context, str):
                        logistics_context = json.loads(logistics_context)
                else:
                    logistics_context = {'work_orders': [], 'personnel_assignments': []}
                
                # Get historical decisions for this tank (if enhanced)
                historical_decisions = []
                if ENHANCED_HYPERSPELL_AVAILABLE:
                    try:
                        conn = get_db_connection()
                        cursor = conn.cursor()
                        cursor.execute("""
                            SELECT agent_name, decision_type, decision, reasoning, success_score, timestamp
                            FROM agent_decisions
                            WHERE namespace = ?
                            ORDER BY timestamp DESC
                            LIMIT 10
                        """, (namespace,))
                        for row in cursor.fetchall():
                            historical_decisions.append({
                                'agent': row[0],
                                'type': row[1],
                                'decision': json.loads(row[2]) if isinstance(row[2], str) else row[2],
                                'reasoning': row[3],
                                'successScore': row[4],
                                'timestamp': row[5]
                            })
                        conn.close()
                    except:
                        pass
                
                # Return agent-generated schedule with AI reasoning
                return jsonify({
                    'tankId': tank_id,
                    'events': schedule_context.get('events', []),
                    'workOrders': logistics_context.get('work_orders', []),
                    'personnelAssignments': logistics_context.get('personnel_assignments', []),
                    'source': 'agent',  # Indicates AI-generated
                    'historicalDecisions': historical_decisions,
                    'hyperspellEnhanced': ENHANCED_HYPERSPELL_AVAILABLE
                })
        except Exception as e:
            print(f"Error retrieving from Hyperspell: {e}")
            # Fallback to rule-based
    
    # Fallback: Rule-based scheduling (no agents)
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
    
    # Track decisions in Hyperspell if available
    hyperspell = None
    namespace = f"tank_{tank_id}"
    if AGENTS_AVAILABLE:
        try:
            hyperspell = EnhancedContextStore()
        except:
            pass
    
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
            # Track this decision in Hyperspell if available
            decision_id = None
            if hyperspell and ENHANCED_HYPERSPELL_AVAILABLE:
                try:
                    decision_id = hyperspell.store_decision(
                        namespace=namespace,
                        agent_name='RuleBasedScheduler',
                        decision_type='maintenance_priority',
                        input_context={
                            'component_id': component['id'],
                            'health': component['health'],
                            'rul_hours': component['rul_hours'],
                            'status': component['status']
                        },
                        decision={
                            'priority': priority,
                            'type': event_type,
                            'scheduled_date': scheduled_date.isoformat()
                        },
                        reasoning=f"Health: {component['health']}%, RUL: {component['rul_hours']}h, Status: {component['status']}"
                    )
                except Exception as e:
                    print(f"Error tracking decision in Hyperspell: {e}")
            
            events.append({
                'id': f'mnt-{event_id:03d}',
                'date': scheduled_date.strftime('%Y-%m-%d'),
                'type': event_type,
                'component': component['id'],
                'description': f"{component['id']} maintenance - Health: {component['health']}%, RUL: {component['rul_hours']}h",
                'status': 'pending',
                'priority': priority,
                'decisionId': decision_id  # For tracking outcomes later
            })
            event_id += 1
    
    conn.close()
    
    return jsonify({
        'tankId': tank_id,
        'events': events,
        'workOrders': [],
        'personnelAssignments': [],
        'source': 'direct',  # Indicates rule-based
        'hyperspellEnhanced': ENHANCED_HYPERSPELL_AVAILABLE if hyperspell else False
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


# ============================================================================
# REPAIR WORKFLOW ENDPOINTS
# ============================================================================

@app.route('/api/repair/context', methods=['POST'])
def store_repair_context():
    """
    Store repair workflow context for a component
    Used to carry context from page to page in the repair workflow
    """
    try:
        data = request.get_json()
        
        component_id = data.get('componentId')
        if not component_id:
            return jsonify({'error': 'componentId is required'}), 400
        
        # Store in context store
        if AGENTS_AVAILABLE:
            context_store = get_hyperspell_instance()
            namespace = f"repair_{component_id}"
            
            # Store different context pieces
            if 'component' in data:
                context_store.store(namespace, 'component', json.dumps(data['component']))
            
            if 'tank' in data:
                context_store.store(namespace, 'tank', json.dumps(data['tank']))
            
            if 'aiRecommendation' in data:
                context_store.store(namespace, 'ai_recommendation', json.dumps(data['aiRecommendation']))
            
            if 'healthHistory' in data:
                context_store.store(namespace, 'health_history', json.dumps(data['healthHistory']))
            
            if 'maintenanceHistory' in data:
                context_store.store(namespace, 'maintenance_history', json.dumps(data['maintenanceHistory']))
            
            if 'historicalRepairs' in data:
                context_store.store(namespace, 'historical_repairs', json.dumps(data['historicalRepairs']))
            
            if 'userSelections' in data:
                context_store.store(namespace, 'user_selections', json.dumps(data['userSelections']))
            
            return jsonify({
                'status': 'success',
                'componentId': component_id,
                'timestamp': datetime.now().isoformat()
            }), 200
        else:
            return jsonify({'error': 'Context store not available'}), 503
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/repair/context/<component_id>', methods=['GET'])
def get_repair_context(component_id: str):
    """
    Retrieve stored repair workflow context for a component
    """
    try:
        if AGENTS_AVAILABLE:
            context_store = get_hyperspell_instance()
            namespace = f"repair_{component_id}"
            
            # Retrieve all context pieces
            context = {}
            
            keys = ['component', 'tank', 'ai_recommendation', 'health_history', 
                   'maintenance_history', 'historical_repairs', 'user_selections']
            
            for key in keys:
                value = context_store.retrieve(namespace, key)
                if value:
                    try:
                        context[key] = json.loads(value) if isinstance(value, str) else value
                    except:
                        context[key] = value
            
            return jsonify({
                'status': 'success',
                'componentId': component_id,
                'context': context,
                'timestamp': datetime.now().isoformat()
            }), 200
        else:
            return jsonify({'error': 'Context store not available'}), 503
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/repair/stream', methods=['POST'])
def stream_repair_recommendation():
    """
    Stream AI-powered repair form field recommendations
    Server-Sent Events (SSE) endpoint
    """
    from flask import Response, stream_with_context
    
    try:
        data = request.get_json()
        
        component_id = data.get('componentId')
        tank_id = data.get('tankId')
        repair_type = data.get('repairType')  # 'personnel_assignment', 'work_order', or 'part_transfer'
        
        if not all([component_id, tank_id, repair_type]):
            return jsonify({'error': 'componentId, tankId, and repairType are required'}), 400
        
        if repair_type not in ['personnel_assignment', 'work_order', 'part_transfer']:
            return jsonify({'error': 'Invalid repairType'}), 400
        
        # Initialize repair agent
        if AGENTS_AVAILABLE:
            from agents.repair_agent import RepairAgent
            
            agent = RepairAgent(tank_id, component_id)
            
            def generate():
                """Generator for SSE stream"""
                try:
                    # Send initial connection event
                    yield f"data: {json.dumps({'type': 'connected', 'status': 'streaming_started'})}\n\n"
                    
                    # Stream field recommendations
                    for field_update in agent.stream_repair_recommendation(repair_type):
                        try:
                            # Validate that field_update is valid JSON string
                            if isinstance(field_update, str):
                                # Try to parse it to ensure it's valid JSON
                                parsed = json.loads(field_update)
                                # Ensure it has required fields
                                if 'field' in parsed:
                                    yield f"data: {field_update}\n\n"
                                else:
                                    print(f"Warning: Invalid field update structure: {field_update}")
                            else:
                                # If it's already a dict, stringify it
                                yield f"data: {json.dumps(field_update)}\n\n"
                        except (json.JSONDecodeError, TypeError) as e:
                            print(f"Warning: Skipping invalid JSON from agent: {field_update}")
                            continue
                        except Exception as e:
                            print(f"Error processing field update: {e}")
                            yield f"data: {json.dumps({'type': 'error', 'error': f'Error processing field: {str(e)}'})}\n\n"
                            break
                    
                    # Send completion event only if no errors occurred
                    yield f"data: {json.dumps({'type': 'complete', 'status': 'streaming_complete'})}\n\n"
                    
                except Exception as e:
                    error_msg = str(e).replace('\n', ' ').replace('"', "'")  # Sanitize error message
                    yield f"data: {json.dumps({'type': 'error', 'error': error_msg})}\n\n"
            
            return Response(
                stream_with_context(generate()),
                mimetype='text/event-stream',
                headers={
                    'Cache-Control': 'no-cache',
                    'X-Accel-Buffering': 'no',
                    'Connection': 'keep-alive'
                }
            )
        else:
            return jsonify({'error': 'AI agents not available'}), 503
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/health/upload', methods=['POST'])
def upload_health_csv():
    """Upload CSV file for health recalculation"""
    try:
        from utils.file_processor import validate_csv_file, parse_csv_by_category
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read file content
        file_content = file.read()
        filename = secure_filename(file.filename)
        
        # Validate CSV file
        is_valid, detected_category, error_message, detected_columns = validate_csv_file(file_content, filename)
        
        if not is_valid:
            return jsonify({
                'error': error_message,
                'detected_columns': detected_columns
            }), 400
        
        # Store file temporarily
        job_id = str(uuid.uuid4())
        temp_dir = os.path.join(os.path.dirname(__file__), 'temp_uploads')
        os.makedirs(temp_dir, exist_ok=True)
        
        temp_file_path = os.path.join(temp_dir, f"{job_id}_{filename}")
        with open(temp_file_path, 'wb') as f:
            f.write(file_content)
        
        # Parse CSV
        csv_content = file_content.decode('utf-8')
        try:
            csv_data = parse_csv_by_category(csv_content, detected_category)
        except Exception as e:
            return jsonify({'error': f'Failed to parse CSV: {str(e)}'}), 400
        
        return jsonify({
            'job_id': job_id,
            'detected_category': detected_category,
            'filename': filename,
            'rows': len(csv_data),
            'columns': detected_columns,
            'status': 'uploaded'
        })
        
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500


@app.route('/api/health/recalculate', methods=['POST'])
def recalculate_health():
    """Trigger AI recalculation with uploaded CSV data"""
    try:
        from agents.health_adjustment_agent import HealthAdjustmentAgent
        from utils.file_processor import parse_csv_by_category
        
        data = request.get_json()
        tank_id = data.get('tank_id')
        job_id = data.get('job_id')
        detected_category = data.get('detected_category')
        
        if not tank_id or not job_id or not detected_category:
            return jsonify({'error': 'tank_id, job_id, and detected_category are required'}), 400
        
        # Load uploaded file
        temp_dir = os.path.join(os.path.dirname(__file__), 'temp_uploads')
        temp_files = [f for f in os.listdir(temp_dir) if f.startswith(job_id)]
        
        if not temp_files:
            return jsonify({'error': 'Uploaded file not found'}), 404
        
        temp_file_path = os.path.join(temp_dir, temp_files[0])
        
        # Read and parse CSV
        with open(temp_file_path, 'r', encoding='utf-8') as f:
            csv_content = f.read()
        
        csv_data = parse_csv_by_category(csv_content, detected_category)
        
        # Initialize agent
        agent = HealthAdjustmentAgent(tank_id)
        
        # Process CSV and adjust health
        result = agent.process_csv_and_adjust_health(csv_data, detected_category)
        
        # Clean up temp file
        try:
            os.remove(temp_file_path)
        except:
            pass
        
        # Format response
        adjusted_scores = {}
        for component_id, score_data in result['adjusted_scores'].items():
            adjusted_scores[component_id] = {
                'original_health': score_data['original_health'],
                'adjusted_health': score_data['adjusted_health'],
                'confidence': score_data['confidence'],
                'reasoning': score_data['reasoning'],
                'status': score_data['status'],
                'has_adjustment': score_data['adjusted_health'] != score_data['original_health']
            }
        
        return jsonify({
            'tank_id': tank_id,
            'category': detected_category,
            'adjusted_scores': adjusted_scores,
            'insights': result['insights'],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Recalculation failed: {str(e)}'}), 500


@app.route('/api/health/scores/<tank_id>', methods=['GET'])
def get_health_scores(tank_id):
    """Get current health scores (base + AI adjusted if available)"""
    try:
        from health_engine import compute_health_index
        
        # Get base scores for all components
        component_ids = ['eng-001', 'trn-001', 'hyd-001', 'sus-001', 'fcs-001', 'com-001']
        
        scores = {}
        for component_id in component_ids:
            try:
                health_data = compute_health_index(tank_id, component_id)
                scores[component_id] = {
                    'original_health': health_data.get('health', 50),
                    'adjusted_health': None,  # Will be populated if AI adjustments exist
                    'status': health_data.get('status', 'unknown'),
                    'rul_hours': health_data.get('rul_hours', 0),
                    'drivers': health_data.get('drivers', []),
                    'has_ai_adjustment': False
                }
            except Exception as e:
                scores[component_id] = {
                    'original_health': 50,
                    'adjusted_health': None,
                    'status': 'unknown',
                    'rul_hours': 0,
                    'drivers': [],
                    'has_ai_adjustment': False,
                    'error': str(e)
                }
        
        return jsonify({
            'tank_id': tank_id,
            'scores': scores,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get health scores: {str(e)}'}), 500


@app.route('/api/hyperspell/patterns', methods=['GET'])
def get_learned_patterns():
    """
    Get learned patterns from Hyperspell for a component or tank
    """
    if not AGENTS_AVAILABLE or not ENHANCED_HYPERSPELL_AVAILABLE:
        return jsonify({'error': 'Enhanced Hyperspell not available'}), 503
    
    try:
        tank_id = request.args.get('tank_id')
        component_id = request.args.get('component_id')
        pattern_type = request.args.get('pattern_type')  # Optional filter
        min_confidence = float(request.args.get('min_confidence', 0.6))
        
        store = get_hyperspell_instance()
        namespace = f"tank_{tank_id}" if tank_id else None
        
        if component_id:
            patterns = store.get_learned_patterns(
                component_id=component_id,
                namespace=namespace,
                pattern_type=pattern_type,
                min_confidence=min_confidence
            )
            return jsonify({
                'component_id': component_id,
                'patterns': patterns,
                'count': len(patterns)
            })
        else:
            # Get patterns for all components
            all_patterns = {}
            for comp_id in COMPONENT_IDS:
                patterns = store.get_learned_patterns(
                    component_id=comp_id,
                    namespace=namespace,
                    pattern_type=pattern_type,
                    min_confidence=min_confidence
                )
                if patterns:
                    all_patterns[comp_id] = patterns
            
            return jsonify({
                'patterns': all_patterns,
                'total_count': sum(len(p) for p in all_patterns.values())
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/hyperspell/fleet-insights', methods=['GET'])
def get_fleet_insights():
    """
    Get fleet-wide insights from Hyperspell
    """
    if not AGENTS_AVAILABLE or not ENHANCED_HYPERSPELL_AVAILABLE:
        return jsonify({'error': 'Enhanced Hyperspell not available'}), 503
    
    try:
        component_id = request.args.get('component_id')
        insight_type = request.args.get('insight_type')  # Optional filter
        
        store = get_hyperspell_instance()
        
        if component_id:
            insights = store.get_fleet_insights(component_id=component_id, insight_type=insight_type)
            return jsonify({
                'component_id': component_id,
                'insights': insights,
                'count': len(insights)
            })
        else:
            # Get insights for all components
            all_insights = {}
            for comp_id in COMPONENT_IDS:
                insights = store.get_fleet_insights(component_id=comp_id, insight_type=insight_type)
                if insights:
                    all_insights[comp_id] = insights
            
            return jsonify({
                'insights': all_insights,
                'total_count': sum(len(i) for i in all_insights.values())
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/hyperspell/lifecycle/<tank_id>/<component_id>', methods=['GET'])
def get_component_lifecycle(tank_id: str, component_id: str):
    """
    Get component lifecycle tracking data
    """
    if not AGENTS_AVAILABLE or not ENHANCED_HYPERSPELL_AVAILABLE:
        return jsonify({'error': 'Enhanced Hyperspell not available'}), 503
    
    try:
        store = get_hyperspell_instance()
        namespace = f"tank_{tank_id}"
        
        lifecycle = store.get_component_lifecycle(namespace, component_id)
        
        if lifecycle:
            return jsonify({
                'tank_id': tank_id,
                'component_id': component_id,
                'lifecycle': lifecycle
            })
        else:
            return jsonify({
                'tank_id': tank_id,
                'component_id': component_id,
                'lifecycle': None,
                'message': 'No lifecycle data available yet'
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/hyperspell/decisions', methods=['GET'])
def get_historical_decisions():
    """
    Get historical agent decisions with outcomes
    """
    if not AGENTS_AVAILABLE or not ENHANCED_HYPERSPELL_AVAILABLE:
        return jsonify({'error': 'Enhanced Hyperspell not available'}), 503
    
    try:
        tank_id = request.args.get('tank_id')
        agent_name = request.args.get('agent_name')  # Optional filter
        decision_type = request.args.get('decision_type')  # Optional filter
        limit = int(request.args.get('limit', 20))
        
        store = get_hyperspell_instance()
        namespace = f"tank_{tank_id}" if tank_id else None
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT id, namespace, agent_name, decision_type, input_context, 
                   decision, reasoning, outcome, success_score, timestamp
            FROM agent_decisions
            WHERE 1=1
        """
        params = []
        
        if namespace:
            query += " AND namespace = ?"
            params.append(namespace)
        
        if agent_name:
            query += " AND agent_name = ?"
            params.append(agent_name)
        
        if decision_type:
            query += " AND decision_type = ?"
            params.append(decision_type)
        
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        decisions = []
        for row in rows:
            decisions.append({
                'id': row[0],
                'namespace': row[1],
                'agent': row[2],
                'type': row[3],
                'inputContext': json.loads(row[4]) if row[4] else None,
                'decision': json.loads(row[5]) if row[5] else None,
                'reasoning': row[6],
                'outcome': json.loads(row[7]) if row[7] else None,
                'successScore': row[8],
                'timestamp': row[9]
            })
        
        return jsonify({
            'decisions': decisions,
            'count': len(decisions)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/hyperspell/decision/<decision_id>/outcome', methods=['POST'])
def update_decision_outcome(decision_id: int):
    """
    Update a decision with its outcome (for learning)
    """
    if not AGENTS_AVAILABLE or not ENHANCED_HYPERSPELL_AVAILABLE:
        return jsonify({'error': 'Enhanced Hyperspell not available'}), 503
    
    try:
        data = request.get_json()
        outcome = data.get('outcome', {})
        success_score = float(data.get('success_score', 0.5))
        
        store = get_hyperspell_instance()
        store.update_decision_outcome(decision_id, outcome, success_score)
        
        return jsonify({
            'status': 'success',
            'decision_id': decision_id,
            'message': 'Outcome recorded'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/hyperspell/context/<tank_id>', methods=['GET'])
def get_aggregated_context(tank_id: str):
    """
    Get all aggregated context for a tank (patterns, lifecycles, decisions, insights)
    """
    if not AGENTS_AVAILABLE or not ENHANCED_HYPERSPELL_AVAILABLE:
        return jsonify({'error': 'Enhanced Hyperspell not available'}), 503
    
    try:
        store = get_hyperspell_instance()
        namespace = f"tank_{tank_id}"
        
        aggregated = store.aggregate_context_for_ai(namespace)
        
        return jsonify({
            'tank_id': tank_id,
            'context': aggregated
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/part-info', methods=['GET'])
def get_part_info():
    """Get part specifications and maintenance data for a specific tank and part"""
    tank_name = request.args.get('tank_name')  # e.g., "M1 Abrams", "Leopard 2", "T-90"
    tank_variant = request.args.get('tank_variant')  # e.g., "M1A2 SEPv3", "2A7", "T-90M Proryv-3"
    part_name = request.args.get('part_name')  # e.g., "turret", "engine", "tracks", "armor", "optics", "transmission"
    
    if not tank_name or not tank_variant or not part_name:
        return jsonify({'error': 'tank_name, tank_variant, and part_name parameters are required'}), 400
    
    conn = get_db_connection()
    
    # First, get the tank_id from name and variant
    tank_query = "SELECT tank_id FROM tanks WHERE name = ? AND variant = ?"
    tank_row = conn.execute(tank_query, (tank_name, tank_variant)).fetchone()
    
    if not tank_row:
        conn.close()
        return jsonify({'error': 'Tank not found'}), 404
    
    tank_id = tank_row['tank_id']
    
    # Map part names to database tables
    part_table_map = {
        'turret': {
            'table': 'weapons_main',
            'description': 'Main weapon and turret system specifications',
            'fields': ['gun_caliber_mm', 'gun_type', 'gun_model', 'barrel_length_m', 
                      'turret_traverse_degrees_per_sec', 'rate_of_fire_rounds_per_min', 
                      'max_effective_range_m']
        },
        'engine': {
            'table': 'engines',
            'description': 'Engine and powerplant specifications',
            'fields': ['engine_type', 'engine_model', 'max_power_hp', 'max_torque_nm', 
                      'fuel_type', 'displacement_liters', 'configuration']
        },
        'tracks': {
            'table': 'suspension',
            'description': 'Suspension and track system specifications',
            'fields': ['suspension_type', 'road_wheels_per_side', 'track_type', 
                      'track_width_mm', 'track_length_mm', 'track_links_per_side', 'shock_absorbers']
        },
        'armor': {
            'table': 'armor',
            'description': 'Armor and protection system specifications',
            'fields': ['hull_front_type', 'hull_front_equivalent_rha_mm', 
                      'turret_front_type', 'turret_front_equivalent_rha_mm', 
                      'reactive_armor', 'composite_armor', 'hard_kill_systems']
        },
        'optics': {
            'table': 'fire_control',
            'description': 'Fire control and targeting system specifications',
            'fields': ['laser_rangefinder_range_m', 'gunner_sight_type', 
                      'gunner_sight_thermal_range_m', 'commander_independent_viewer', 
                      'hunter_killer_capable', 'target_tracking', 'first_round_hit_probability']
        },
        'transmission': {
            'table': 'transmissions',
            'description': 'Transmission and drivetrain specifications',
            'fields': ['transmission_type', 'model', 'forward_gears', 'reverse_gears', 
                      'torque_converter', 'steering_type', 'braking_system']
        }
    }
    
    part_config = part_table_map.get(part_name.lower())
    if not part_config:
        conn.close()
        return jsonify({'error': f'Unknown part: {part_name}'}), 400
    
    # Get part specifications
    fields = ', '.join(part_config['fields'])
    part_query = f"SELECT {fields} FROM {part_config['table']} WHERE tank_id = ?"
    part_row = conn.execute(part_query, (tank_id,)).fetchone()
    
    if not part_row:
        conn.close()
        return jsonify({'error': f'Part data not found for {part_name}'}), 404
    
    # Convert row to dictionary, filtering out None values
    specifications = {field: part_row[field] for field in part_config['fields'] 
                      if part_row[field] is not None}
    
    # Get maintenance data
    maint_query = "SELECT * FROM maintenance WHERE tank_id = ?"
    maint_row = conn.execute(maint_query, (tank_id,)).fetchone()
    
    maintenance_data = {}
    if maint_row:
        # Exclude internal IDs
        for key in maint_row.keys():
            if key not in ['maintenance_id', 'tank_id'] and maint_row[key] is not None:
                maintenance_data[key] = maint_row[key]
    
    conn.close()
    
    return jsonify({
        'partName': part_name,
        'partData': {
            'description': part_config['description'],
            'specifications': specifications
        },
        'maintenanceData': maintenance_data,
        'tankId': tank_id
    })


if __name__ == '__main__':
    # Check if database exists
    if not os.path.exists(DB_PATH):
        print(f"Warning: Database not found at {DB_PATH}")
        print("Run scripts/create_tank_database.py to create the database")
    
    app.run(debug=True, port=8000)

