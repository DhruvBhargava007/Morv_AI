#!/usr/bin/env python3
"""
Repair Agent - AI-Powered Form Field Generation with Streaming
Intelligently fills repair forms (Personnel Assignment, Work Order, Part Transfer)
with real-time streaming and detailed reasoning
"""

import os
import sys
import json
import logging
from typing import Dict, Any, Generator, Optional
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from agents.config import OPENAI_API_KEY, REPAIR_AGENT_PROMPTS
from agents.context_store import SimpleContextStore

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class RepairAgent:
    """AI Agent for intelligent repair form field generation"""
    
    def __init__(self, tank_id: str, component_id: str, openai_client=None, hyperspell=None):
        self.tank_id = tank_id
        self.component_id = component_id
        self.openai_client = openai_client or (OpenAI(api_key=OPENAI_API_KEY) if OPENAI_AVAILABLE and OPENAI_API_KEY else None)
        self.hyperspell = hyperspell or SimpleContextStore()
        self.namespace = f"repair_{component_id}"
        
    def _gather_context(self, repair_type: str) -> Dict[str, Any]:
        """Gather comprehensive context for repair decision making"""
        from health_engine import compute_health_index, fetch_telemetry, fetch_maintenance_history
        from agents.tools import check_parts_inventory, match_personnel
        import sqlite3
        
        context = {}
        
        # Get component health data
        try:
            health_data = compute_health_index(self.tank_id, self.component_id)
            context['component'] = {
                'id': self.component_id,
                'name': health_data.get('component_name', self.component_id),
                'health': health_data.get('health', 0),
                'status': health_data.get('status', 'unknown'),
                'rul_hours': health_data.get('rul_hours', 0),
                'drivers': health_data.get('drivers', [])
            }
        except Exception as e:
            print(f"Error fetching health data: {e}")
            context['component'] = {'id': self.component_id, 'health': 50, 'status': 'unknown', 'rul_hours': 100}
        
        # Get tank info
        try:
            db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tank_database.db')
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM tanks WHERE tank_id = ? LIMIT 1", (self.tank_id,))
            tank_row = cursor.fetchone()
            
            if tank_row:
                context['tank'] = {
                    'id': self.tank_id,
                    'name': tank_row['name'],
                    'location': f"Base {tank_row['country'][:2]}-{tank_row['tank_id']}",
                    'operating_hours': 2000 + tank_row['tank_id'] * 100
                }
            else:
                context['tank'] = {'id': self.tank_id, 'location': 'Unknown', 'operating_hours': 2000}
            
            conn.close()
        except Exception as e:
            print(f"Error fetching tank data: {e}")
            context['tank'] = {'id': self.tank_id, 'location': 'Unknown', 'operating_hours': 2000}
        
        # Get historical repairs from context store
        try:
            historical_data = self.hyperspell.retrieve(self.namespace, 'historical_repairs')
            if historical_data:
                try:
                    if isinstance(historical_data, str):
                        context['historical_repairs'] = json.loads(historical_data)
                    else:
                        context['historical_repairs'] = historical_data
                except json.JSONDecodeError as e:
                    print(f"Warning: Failed to parse historical_repairs JSON: {e}")
                    context['historical_repairs'] = self._get_dummy_historical_repairs()
            else:
                context['historical_repairs'] = self._get_dummy_historical_repairs()
        except Exception as e:
            print(f"Warning: Error retrieving historical_repairs: {e}")
            context['historical_repairs'] = self._get_dummy_historical_repairs()
        
        # Repair type specific context
        if repair_type == 'personnel_assignment':
            context['available_personnel'] = self._get_available_personnel()
            
        elif repair_type == 'work_order':
            context['parts_inventory'] = self._get_parts_inventory()
            context['vendor_data'] = self._get_vendor_data()
            context['historical_orders'] = self._get_historical_orders()
            
        elif repair_type == 'part_transfer':
            context['tank_network'] = self._get_tank_network()
            context['network_inventory'] = self._get_network_inventory()
            context['historical_transfers'] = self._get_historical_transfers()
        
        return context
    
    def _get_dummy_historical_repairs(self) -> list:
        """Get dummy historical repair data"""
        component_type = self.component_id.split('-')[0]
        
        repairs = {
            'eng': [
                {'date': '2025-08-15', 'type': 'personnel', 'personnel': ['PER-001'], 'hours': 6, 'cost': 450, 'outcome': 'success'},
                {'date': '2025-06-20', 'type': 'work_order', 'part': 'ENG-7720-F', 'cost': 1200, 'vendor': 'General Dynamics', 'outcome': 'success'}
            ],
            'trn': [
                {'date': '2025-07-10', 'type': 'personnel', 'personnel': ['PER-004'], 'hours': 8, 'cost': 600, 'outcome': 'success'},
            ],
            'hyd': [
                {'date': '2025-09-01', 'type': 'work_order', 'part': 'HYD-5580', 'cost': 2450, 'vendor': 'Honeywell Aerospace', 'outcome': 'success'},
                {'date': '2025-07-15', 'type': 'personnel', 'personnel': ['PER-002'], 'hours': 4, 'cost': 350, 'outcome': 'success'}
            ],
            'sus': [
                {'date': '2025-08-22', 'type': 'part_transfer', 'source': 'TNK-C-091', 'cost': 450, 'hours': 6, 'outcome': 'success'},
            ],
            'fcs': [
                {'date': '2025-09-10', 'type': 'personnel', 'personnel': ['PER-003', 'PER-012'], 'hours': 3, 'cost': 300, 'outcome': 'success'},
            ],
            'com': [
                {'date': '2025-08-05', 'type': 'work_order', 'part': 'COM-8845-M', 'cost': 15600, 'vendor': 'Harris Corporation', 'outcome': 'success'},
            ]
        }
        
        return repairs.get(component_type, [])
    
    def _get_available_personnel(self) -> list:
        """Get available personnel with specializations"""
        return [
            {'id': 'PER-001', 'name': 'SSG James Mitchell', 'specialization': 'Engine Mechanics', 'available': False, 'location': 'Fort Hood, TX', 'experience_years': 8, 'hourly_rate': 45},
            {'id': 'PER-002', 'name': 'SPC Maria Rodriguez', 'specialization': 'Hydraulics & Suspension', 'available': True, 'location': 'Fort Hood, TX', 'experience_years': 5, 'hourly_rate': 38},
            {'id': 'PER-003', 'name': 'SGT David Chen', 'specialization': 'Fire Control Systems', 'available': False, 'location': 'Fort Hood, TX', 'experience_years': 10, 'hourly_rate': 52},
            {'id': 'PER-004', 'name': 'SPC Robert Taylor', 'specialization': 'Track & Transmission', 'available': True, 'location': 'Fort Benning, GA', 'experience_years': 4, 'hourly_rate': 36},
            {'id': 'PER-005', 'name': 'SSG Jennifer Williams', 'specialization': 'Communications & Electronics', 'available': False, 'location': 'Fort Hood, TX', 'experience_years': 9, 'hourly_rate': 48},
            {'id': 'PER-006', 'name': 'SPC Michael Brown', 'specialization': 'General Maintenance', 'available': True, 'location': 'Fort Hood, TX', 'experience_years': 3, 'hourly_rate': 32},
            {'id': 'PER-007', 'name': 'SGT Lisa Anderson', 'specialization': 'Armor & Structural', 'available': False, 'location': 'Fort Benning, GA', 'experience_years': 7, 'hourly_rate': 44},
            {'id': 'PER-008', 'name': 'SPC Kevin Martinez', 'specialization': 'Power Systems', 'available': True, 'location': 'Fort Hood, TX', 'experience_years': 4, 'hourly_rate': 36},
            {'id': 'PER-011', 'name': 'SGT Christopher Lee', 'specialization': 'Track & Transmission', 'available': True, 'location': 'Fort Hood, TX', 'experience_years': 6, 'hourly_rate': 42},
            {'id': 'PER-012', 'name': 'SPC Sarah Harris', 'specialization': 'Fire Control Systems', 'available': True, 'location': 'Fort Benning, GA', 'experience_years': 3, 'hourly_rate': 35},
        ]
    
    def _get_parts_inventory(self) -> list:
        """Get parts inventory status"""
        component_type = self.component_id.split('-')[0]
        
        inventory = {
            'eng': [
                {'part_number': 'ENG-7720-F', 'name': 'Engine Oil Filter', 'quantity': 12, 'min_quantity': 8, 'status': 'available'},
                {'part_number': 'ENG-8840-P', 'name': 'Piston Ring Set', 'quantity': 3, 'min_quantity': 5, 'status': 'low_stock'},
            ],
            'trn': [
                {'part_number': 'TRN-3310-L', 'name': 'Transmission Fluid', 'quantity': 85, 'min_quantity': 40, 'status': 'available'},
                {'part_number': 'TRN-4420-G', 'name': 'Gear Assembly', 'quantity': 1, 'min_quantity': 3, 'status': 'critical'},
            ],
            'hyd': [
                {'part_number': 'HYD-5580', 'name': 'Hydraulic Seals Kit', 'quantity': 2, 'min_quantity': 5, 'status': 'critical'},
                {'part_number': 'HYD-2234-B', 'name': 'Hydraulic Pump Assembly', 'quantity': 0, 'min_quantity': 2, 'status': 'out_of_stock'},
            ],
            'sus': [
                {'part_number': 'SUS-1240-W', 'name': 'Road Wheels', 'quantity': 6, 'min_quantity': 4, 'status': 'available'},
                {'part_number': 'SUS-4421-A', 'name': 'Suspension Strut Assembly', 'quantity': 2, 'min_quantity': 3, 'status': 'low_stock'},
            ],
            'fcs': [
                {'part_number': 'FCS-9920-C', 'name': 'Fire Control Computer Module', 'quantity': 3, 'min_quantity': 2, 'status': 'available'},
                {'part_number': 'FCS-8810-S', 'name': 'Sensor Array', 'quantity': 5, 'min_quantity': 3, 'status': 'available'},
            ],
            'com': [
                {'part_number': 'COM-8845-M', 'name': 'Communications Module', 'quantity': 0, 'min_quantity': 2, 'status': 'out_of_stock'},
                {'part_number': 'COM-8850-A', 'name': 'Antenna Assembly', 'quantity': 3, 'min_quantity': 2, 'status': 'available'},
            ]
        }
        
        return inventory.get(component_type, [])
    
    def _get_vendor_data(self) -> list:
        """Get vendor information with performance metrics"""
        return [
            {
                'name': 'General Dynamics Land Systems',
                'specialties': ['Engine', 'Transmission', 'Track'],
                'avg_lead_time_days': {'critical': 2, 'high': 3, 'medium': 5, 'low': 7},
                'reliability_score': 95,
                'cost_factor': 1.2
            },
            {
                'name': 'Honeywell Aerospace',
                'specialties': ['Hydraulic', 'Power Systems'],
                'avg_lead_time_days': {'critical': 2, 'high': 4, 'medium': 6, 'low': 10},
                'reliability_score': 92,
                'cost_factor': 1.1
            },
            {
                'name': 'BAE Systems',
                'specialties': ['Armor', 'Weapons', 'Fire Control'],
                'avg_lead_time_days': {'critical': 3, 'high': 5, 'medium': 7, 'low': 14},
                'reliability_score': 90,
                'cost_factor': 1.3
            },
            {
                'name': 'Lockheed Martin',
                'specialties': ['Fire Control', 'Electronics'],
                'avg_lead_time_days': {'critical': 2, 'high': 4, 'medium': 6, 'low': 12},
                'reliability_score': 93,
                'cost_factor': 1.4
            },
            {
                'name': 'Raytheon Technologies',
                'specialties': ['Electronics', 'Sensors'],
                'avg_lead_time_days': {'critical': 3, 'high': 5, 'medium': 8, 'low': 15},
                'reliability_score': 88,
                'cost_factor': 1.25
            },
            {
                'name': 'Harris Corporation',
                'specialties': ['Communications', 'Radio'],
                'avg_lead_time_days': {'critical': 2, 'high': 3, 'medium': 5, 'low': 8},
                'reliability_score': 91,
                'cost_factor': 1.15
            },
            {
                'name': 'L3Harris Technologies',
                'specialties': ['Communications', 'Electronics'],
                'avg_lead_time_days': {'critical': 2, 'high': 4, 'medium': 6, 'low': 10},
                'reliability_score': 89,
                'cost_factor': 1.2
            }
        ]
    
    def _get_historical_orders(self) -> list:
        """Get historical work orders for similar components"""
        return [
            {'date': '2025-09-01', 'part': 'Similar Part', 'vendor': 'General Dynamics', 'cost': 3500, 'lead_time': '3 days', 'outcome': 'on_time'},
            {'date': '2025-08-15', 'part': 'Similar Part', 'vendor': 'Honeywell', 'cost': 2800, 'lead_time': '4 days', 'outcome': 'delayed_1_day'},
        ]
    
    def _get_tank_network(self) -> dict:
        """Get tank network topology"""
        return {
            'nodes': [
                {'id': 'TNK-A-047', 'designation': 'Alpha-047', 'location': 'Fort Irwin, CA'},
                {'id': 'TNK-B-023', 'designation': 'Bravo-023', 'location': 'Fort Hood, TX'},
                {'id': 'TNK-C-091', 'designation': 'Charlie-091', 'location': 'Fort Benning, GA'}
            ],
            'edges': [
                {'source': 'TNK-A-047', 'target': 'TNK-B-023', 'distance': 1850, 'hours': 18},
                {'source': 'TNK-B-023', 'target': 'TNK-C-091', 'distance': 1320, 'hours': 13},
                {'source': 'TNK-A-047', 'target': 'TNK-C-091', 'distance': 2940, 'hours': 29}
            ]
        }
    
    def _get_network_inventory(self) -> dict:
        """Get parts inventory across tank network"""
        return {
            'TNK-A-047': {'surplus_parts': ['TRN-3310-L', 'FCS-8810-S'], 'shortage_parts': ['HYD-5580', 'COM-8845-M']},
            'TNK-B-023': {'surplus_parts': ['ENG-7720-F'], 'shortage_parts': ['TRK-2040-B', 'HYD-2234-B']},
            'TNK-C-091': {'surplus_parts': ['SUS-1240-W', 'SUS-4421-A', 'COM-8850-A'], 'shortage_parts': []}
        }
    
    def _get_historical_transfers(self) -> list:
        """Get historical part transfers"""
        return [
            {'date': '2025-09-15', 'source': 'TNK-C-091', 'destination': 'TNK-A-047', 'part': 'SUS-4421-A', 'cost': 450, 'time': '6 hours'},
            {'date': '2025-08-20', 'source': 'TNK-B-023', 'destination': 'TNK-C-091', 'part': 'POW-7732-B', 'cost': 380, 'time': '8 hours'},
        ]
    
    def stream_repair_recommendation(self, repair_type: str) -> Generator[str, None, None]:
        """
        Stream repair form field recommendations with reasoning
        
        Args:
            repair_type: 'personnel_assignment', 'work_order', or 'part_transfer'
            
        Yields:
            JSON strings with field updates
        """
        try:
            if not self.openai_client:
                # Fallback to rule-based generation
                yield from self._fallback_generation(repair_type)
                return
            
            # Gather all context
            try:
                context = self._gather_context(repair_type)
            except Exception as e:
                print(f"Error gathering context: {e}")
                # Use fallback generation if context gathering fails
                yield from self._fallback_generation(repair_type)
                return
            
            # Build prompt
            prompt_template = REPAIR_AGENT_PROMPTS.get(repair_type, '')
            
            # Helper function to safely serialize JSON
            def safe_json_dumps(data, default='[]'):
                try:
                    return json.dumps(data, indent=2, default=str)  # default=str handles non-serializable objects
                except (TypeError, ValueError) as e:
                    print(f"Warning: Failed to serialize JSON: {e}")
                    return default
            
            # Format prompt with context
            try:
                prompt = prompt_template.format(
                    component_id=context.get('component', {}).get('id', self.component_id),
                    component_name=context.get('component', {}).get('name', self.component_id),
                    health=context.get('component', {}).get('health', 50),
                    status=context.get('component', {}).get('status', 'unknown'),
                    hours_remaining=context.get('component', {}).get('rul_hours', 100),
                    tank_id=context.get('tank', {}).get('id', self.tank_id),
                    location=context.get('tank', {}).get('location', 'Unknown'),
                    operating_hours=context.get('tank', {}).get('operating_hours', 2000),
                    historical_repairs=safe_json_dumps(context.get('historical_repairs', []), '[]'),
                    available_personnel=safe_json_dumps(context.get('available_personnel', []), '[]') if repair_type == 'personnel_assignment' else '',
                    parts_inventory=safe_json_dumps(context.get('parts_inventory', []), '[]') if repair_type == 'work_order' else '',
                    vendor_data=safe_json_dumps(context.get('vendor_data', []), '[]') if repair_type == 'work_order' else '',
                    historical_orders=safe_json_dumps(context.get('historical_orders', []), '[]') if repair_type == 'work_order' else '',
                    tank_network=safe_json_dumps(context.get('tank_network', {}), '{}') if repair_type == 'part_transfer' else '',
                    network_inventory=safe_json_dumps(context.get('network_inventory', {}), '{}') if repair_type == 'part_transfer' else '',
                    historical_transfers=safe_json_dumps(context.get('historical_transfers', []), '[]') if repair_type == 'part_transfer' else ''
                )
            except (KeyError, TypeError) as e:
                print(f"Error formatting prompt: {e}")
                # Fallback: use minimal context
                prompt = prompt_template.format(
                    component_id=self.component_id,
                    component_name=self.component_id,
                    health=50,
                    status='unknown',
                    hours_remaining=100,
                    tank_id=self.tank_id,
                    location='Unknown',
                    operating_hours=2000,
                    historical_repairs='[]',
                    available_personnel='[]' if repair_type == 'personnel_assignment' else '',
                    parts_inventory='[]' if repair_type == 'work_order' else '',
                    vendor_data='[]' if repair_type == 'work_order' else '',
                    historical_orders='[]' if repair_type == 'work_order' else '',
                    tank_network='{}' if repair_type == 'part_transfer' else '',
                    network_inventory='{}' if repair_type == 'part_transfer' else '',
                    historical_transfers='[]' if repair_type == 'part_transfer' else ''
                )
            
            # Stream from OpenAI
            try:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": "You are an expert military maintenance AI assistant. Generate field values one at a time. Each response must be a single, complete, valid JSON object on a single line with no extra text or formatting. Use this exact format: {\"field\":\"fieldName\",\"value\":<value>,\"reasoning\":\"explanation\",\"confidence\":<0-100>}. Do NOT include any text before or after the JSON object."},
                        {"role": "user", "content": prompt}
                    ],
                    stream=True,
                    temperature=0.7
                )
                
                buffer = ""
                brace_count = 0
                json_start = -1
                
                try:
                    for chunk in response:
                        if chunk.choices[0].delta.content:
                            content = chunk.choices[0].delta.content
                            buffer += content
                            
                            # Process buffer to extract complete JSON objects
                            i = 0
                            while i < len(buffer):
                                if buffer[i] == '{':
                                    if json_start == -1:
                                        json_start = i
                                        brace_count = 1
                                    else:
                                        brace_count += 1
                                elif buffer[i] == '}':
                                    brace_count -= 1
                                    if brace_count == 0 and json_start >= 0:
                                        # Found complete JSON object
                                        json_str = buffer[json_start:i+1]
                                        buffer = buffer[i+1:]
                                        json_start = -1
                                        brace_count = 0
                                        i = -1  # Reset index since buffer changed
                                        
                                        # Try to parse and yield the JSON
                                        try:
                                            # Clean the JSON string (remove whitespace issues)
                                            json_str = json_str.strip()
                                            data = json.loads(json_str)
                                            
                                            # Validate required fields
                                            if all(key in data for key in ['field', 'value', 'reasoning', 'confidence']):
                                                # Yield clean JSON string (re-stringify to ensure format)
                                                yield json.dumps(data, ensure_ascii=False)
                                            else:
                                                print(f"Warning: Missing required fields in: {data}")
                                        except (json.JSONDecodeError, KeyError) as e:
                                            # Skip invalid JSON - might be partial or malformed
                                            print(f"Warning: Failed to parse JSON: {e}, content: {json_str[:100]}")
                                i += 1
                except Exception as e:
                    print(f"Error in OpenAI streaming: {e}")
                    # Don't propagate error, fall back to rule-based generation
                    raise
            except Exception as e:
                print(f"OpenAI streaming error: {e}")
                # Fall back to rule-based generation
                yield from self._fallback_generation(repair_type)
        except Exception as e:
            print(f"Unexpected error in stream_repair_recommendation: {e}")
            import traceback
            traceback.print_exc()
            # Final fallback
            yield from self._fallback_generation(repair_type)
    
    def _fallback_generation(self, repair_type: str) -> Generator[str, None, None]:
        """Fallback rule-based generation when OpenAI unavailable"""
        import time
        
        context = self._gather_context(repair_type)
        component = context['component']
        
        # Simulate streaming delay
        def stream_field(field, value, reasoning, confidence):
            time.sleep(0.5)  # Simulate processing time
            return json.dumps({
                'field': field,
                'value': value,
                'reasoning': reasoning,
                'confidence': confidence
            })
        
        if repair_type == 'personnel_assignment':
            # Find matching personnel
            available = [p for p in context['available_personnel'] if p['available']]
            
            yield stream_field(
                'personnelIds',
                [available[0]['id']] if available else [],
                f"Selected {available[0]['name']} based on availability and specialization match",
                85
            )
            
            yield stream_field(
                'estimatedHours',
                6 if component['health'] < 60 else 4,
                f"Estimated based on component health ({component['health']}%) and typical repair time",
                80
            )
            
            yield stream_field(
                'specialInstructions',
                f"Inspect {component['name']} thoroughly. Component health is at {component['health']}%. Follow standard maintenance procedures.",
                "Generated based on component condition and safety protocols",
                75
            )
            
            priority = 'critical' if component['health'] < 50 else 'high' if component['health'] < 70 else 'medium'
            yield stream_field(
                'priority',
                priority,
                f"Priority set to {priority} based on health score of {component['health']}%",
                90
            )
        
        elif repair_type == 'work_order':
            inventory = context['parts_inventory']
            part = inventory[0] if inventory else {'part_number': 'PART-001', 'name': 'Replacement Part'}
            
            yield stream_field(
                'partNumber',
                part['part_number'],
                f"Part number from inventory database for {component['name']}",
                90
            )
            
            yield stream_field(
                'partName',
                part['name'],
                "Standard part name from catalog",
                95
            )
            
            yield stream_field(
                'quantity',
                1,
                "Single unit required for immediate repair",
                85
            )
            
            priority = 'critical' if component['health'] < 50 else 'high'
            yield stream_field(
                'priority',
                priority,
                f"Set to {priority} based on component health and operational impact",
                90
            )
            
            yield stream_field(
                'justification',
                f"{component['name']} health at {component['health']}% requires immediate replacement to maintain operational readiness. Component showing degradation with {component['rul_hours']} hours remaining.",
                "Justification based on health assessment and mission requirements",
                85
            )
            
            vendor = context['vendor_data'][0]['name'] if context['vendor_data'] else 'General Dynamics Land Systems'
            yield stream_field(
                'vendor',
                vendor,
                f"Selected {vendor} for reliability and lead time optimization",
                80
            )
            
            yield stream_field(
                'estimatedCost',
                3500,
                "Cost estimated based on historical orders and current market rates",
                75
            )
            
            yield stream_field(
                'deliveryTimeline',
                '24-48 hours' if priority == 'critical' else '3-5 days',
                f"Expedited delivery for {priority} priority order",
                85
            )
        
        elif repair_type == 'part_transfer':
            network = context['tank_network']
            available_sources = [n for n in network['nodes'] if n['id'] != self.tank_id]
            
            yield stream_field(
                'sourceTankId',
                available_sources[0]['id'] if available_sources else 'TNK-C-091',
                f"Selected based on proximity and surplus inventory availability",
                85
            )
            
            yield stream_field(
                'partId',
                f"PART-{component['id']}-001",
                "Generated part ID for tracking",
                90
            )
            
            yield stream_field(
                'partName',
                component['name'],
                "Part name matches component being repaired",
                95
            )
            
            yield stream_field(
                'quantity',
                1,
                "Single unit transfer for immediate repair need",
                85
            )
            
            yield stream_field(
                'reason',
                f"{component['name']} requires replacement. Source tank has surplus inventory and can spare this component without impacting operational readiness.",
                "Transfer justification based on network inventory analysis",
                80
            )
            
            yield stream_field(
                'transferPath',
                [available_sources[0]['id'], self.tank_id] if available_sources else [],
                "Direct transfer path - most efficient route",
                90
            )
            
            yield stream_field(
                'estimatedTime',
                '8 hours',
                "Estimated based on distance and logistics coordination time",
                75
            )
            
            yield stream_field(
                'logisticsCost',
                650,
                "Cost includes transport, handling, and coordination fees",
                70
            )
    
    def run(self, repair_type: str) -> Dict[str, Any]:
        """Non-streaming synchronous run (for compatibility)"""
        context = self._gather_context(repair_type)
        
        return {
            'status': 'success',
            'repair_type': repair_type,
            'context': context,
            'timestamp': datetime.now().isoformat()
        }


if __name__ == '__main__':
    # Test the repair agent
    agent = RepairAgent('TNK-A-047', 'hyd-001')
    
    print("Testing Personnel Assignment Stream:")
    print("=" * 50)
    for update in agent.stream_repair_recommendation('personnel_assignment'):
        print(update.strip())
        
    print("\n\nTesting Work Order Stream:")
    print("=" * 50)
    for update in agent.stream_repair_recommendation('work_order'):
        print(update.strip())

