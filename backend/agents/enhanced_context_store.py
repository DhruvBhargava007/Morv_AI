#!/usr/bin/env python3
"""
Enhanced Context Store - Advanced Hyperspell Usage
Makes much better use of context storage for learning, patterns, and intelligence
"""

import sqlite3
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from collections import defaultdict

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tank_database.db')


class EnhancedContextStore:
    """Enhanced context storage with learning and pattern recognition capabilities"""
    
    def __init__(self, api_key=None):
        self.api_key = api_key
        self._ensure_tables()
    
    def _ensure_tables(self):
        """Create all necessary tables for enhanced context storage"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if agent_context table exists and has the required columns
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='agent_context'
        """)
        table_exists = cursor.fetchone() is not None
        
        if table_exists:
            # Check if columns exist
            cursor.execute("PRAGMA table_info(agent_context)")
            columns = [row[1] for row in cursor.fetchall()]
            
            # Add metadata column if missing
            if 'metadata' not in columns:
                try:
                    cursor.execute("ALTER TABLE agent_context ADD COLUMN metadata TEXT")
                    print("✅ Added 'metadata' column to agent_context table")
                except sqlite3.OperationalError as e:
                    print(f"⚠️  Could not add metadata column: {e}")
            
            # Add version column if missing
            if 'version' not in columns:
                try:
                    cursor.execute("ALTER TABLE agent_context ADD COLUMN version INTEGER DEFAULT 1")
                    # Update existing rows
                    cursor.execute("UPDATE agent_context SET version = 1 WHERE version IS NULL")
                    print("✅ Added 'version' column to agent_context table")
                except sqlite3.OperationalError as e:
                    print(f"⚠️  Could not add version column: {e}")
        else:
            # Create table with all columns if it doesn't exist
            cursor.execute("""
            CREATE TABLE agent_context (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                namespace TEXT NOT NULL,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                metadata TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                version INTEGER DEFAULT 1,
                UNIQUE(namespace, key)
            )
            """)
        
        # Historical context (keep history of changes)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS context_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            namespace TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            metadata TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (namespace, key) REFERENCES agent_context(namespace, key)
        )
        """)
        
        # Pattern storage (learned patterns from historical data)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS learned_patterns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pattern_type TEXT NOT NULL,  -- 'anomaly', 'degradation', 'failure_mode', etc.
            namespace TEXT,
            component_id TEXT,
            pattern_data TEXT NOT NULL,  -- JSON
            confidence REAL,
            first_seen TIMESTAMP,
            last_seen TIMESTAMP,
            occurrence_count INTEGER DEFAULT 1,
            associated_outcomes TEXT  -- JSON array of outcomes
        )
        """)
        
        # Agent decisions and outcomes (for learning)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS agent_decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            namespace TEXT NOT NULL,
            agent_name TEXT NOT NULL,
            decision_type TEXT NOT NULL,  -- 'priority', 'schedule', 'parts_order', etc.
            input_context TEXT NOT NULL,  -- JSON
            decision TEXT NOT NULL,  -- JSON
            reasoning TEXT,
            outcome TEXT,  -- JSON (filled later)
            outcome_timestamp TIMESTAMP,
            success_score REAL,  -- 0-1 score
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Cross-tank insights (learn from all tanks)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS fleet_insights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            insight_type TEXT NOT NULL,  -- 'common_failure', 'optimal_maintenance', etc.
            component_id TEXT NOT NULL,
            insight_data TEXT NOT NULL,  -- JSON
            affected_tanks TEXT,  -- JSON array
            confidence REAL,
            first_observed TIMESTAMP,
            last_validated TIMESTAMP,
            validation_count INTEGER DEFAULT 1
        )
        """)
        
        # Component lifecycle tracking
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS component_lifecycles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            namespace TEXT NOT NULL,
            component_id TEXT NOT NULL,
            health_trajectory TEXT NOT NULL,  -- JSON array of {timestamp, health, rul}
            failure_predictions TEXT,  -- JSON array
            maintenance_history TEXT,  -- JSON array
            patterns_detected TEXT,  -- JSON array
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(namespace, component_id)
        )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_context_namespace_key ON agent_context(namespace, key)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_history_namespace_key ON context_history(namespace, key, timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_patterns_type ON learned_patterns(pattern_type, component_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_decisions_agent ON agent_decisions(agent_name, decision_type)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_insights_type ON fleet_insights(insight_type, component_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_lifecycles_component ON component_lifecycles(namespace, component_id)")
        
        conn.commit()
        conn.close()
    
    # ==================== BASIC OPERATIONS (Backward Compatible) ====================
    
    def store(self, namespace: str, key: str, value: str, metadata: Dict = None):
        """Store context data with optional metadata"""
        # Ensure tables are up to date
        self._ensure_tables()
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if columns exist (handle old schema)
        cursor.execute("PRAGMA table_info(agent_context)")
        columns = [row[1] for row in cursor.fetchall()]
        has_version = 'version' in columns
        has_metadata = 'metadata' in columns
        
        # Get current version for history (if column exists)
        if has_version:
            cursor.execute("SELECT version FROM agent_context WHERE namespace = ? AND key = ?", (namespace, key))
            row = cursor.fetchone()
            current_version = (row[0] if row else 0) + 1
        else:
            current_version = 1
        
        # Save to history if updating existing
        if has_version:
            cursor.execute("SELECT id FROM agent_context WHERE namespace = ? AND key = ?", (namespace, key))
            existing = cursor.fetchone()
            if existing:
                cursor.execute("""
                    INSERT INTO context_history (namespace, key, value, metadata, timestamp)
                    SELECT namespace, key, value, metadata, timestamp FROM agent_context
                    WHERE namespace = ? AND key = ?
                """, (namespace, key))
        
        # Store/update - handle both old and new schema
        metadata_json = json.dumps(metadata) if metadata else None
        
        if has_version and has_metadata:
            # New schema with both columns
            cursor.execute("""
                INSERT OR REPLACE INTO agent_context (namespace, key, value, metadata, timestamp, version)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (namespace, key, value, metadata_json, datetime.now().isoformat(), current_version))
        elif has_metadata:
            # Has metadata but no version
            cursor.execute("""
                INSERT OR REPLACE INTO agent_context (namespace, key, value, metadata, timestamp)
                VALUES (?, ?, ?, ?, ?)
            """, (namespace, key, value, metadata_json, datetime.now().isoformat()))
        else:
            # Old schema - no metadata, no version
            cursor.execute("""
                INSERT OR REPLACE INTO agent_context (namespace, key, value, timestamp)
                VALUES (?, ?, ?, ?)
            """, (namespace, key, value, datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
    
    def retrieve(self, namespace: str, key: str) -> Optional[str]:
        """Retrieve latest context data"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT value FROM agent_context
            WHERE namespace = ? AND key = ?
            ORDER BY timestamp DESC
            LIMIT 1
        """, (namespace, key))
        
        row = cursor.fetchone()
        conn.close()
        
        return row[0] if row else None
    
    def retrieve_with_metadata(self, namespace: str, key: str) -> Optional[Dict]:
        """Retrieve context with metadata"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT value, metadata, timestamp, version FROM agent_context
            WHERE namespace = ? AND key = ?
            ORDER BY timestamp DESC
            LIMIT 1
        """, (namespace, key))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                'value': row[0],
                'metadata': json.loads(row[1]) if row[1] else {},
                'timestamp': row[2],
                'version': row[3]
            }
        return None
    
    def list_keys(self, namespace: str) -> List[str]:
        """List all keys in a namespace"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT DISTINCT key FROM agent_context
            WHERE namespace = ?
            ORDER BY timestamp DESC
        """, (namespace,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [row[0] for row in rows]
    
    # ==================== ENHANCED FEATURES ====================
    
    def store_decision(self, namespace: str, agent_name: str, decision_type: str,
                      input_context: Dict, decision: Dict, reasoning: str = None):
        """Store agent decision for learning from outcomes"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO agent_decisions 
            (namespace, agent_name, decision_type, input_context, decision, reasoning, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            namespace,
            agent_name,
            decision_type,
            json.dumps(input_context),
            json.dumps(decision),
            reasoning,
            datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
        return cursor.lastrowid
    
    def update_decision_outcome(self, decision_id: int, outcome: Dict, success_score: float):
        """Update decision with outcome for learning"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE agent_decisions
            SET outcome = ?, success_score = ?, outcome_timestamp = ?
            WHERE id = ?
        """, (json.dumps(outcome), success_score, datetime.now().isoformat(), decision_id))
        
        conn.commit()
        conn.close()
    
    def learn_pattern(self, pattern_type: str, namespace: str, component_id: str,
                     pattern_data: Dict, confidence: float = 0.5):
        """Store a learned pattern"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if similar pattern exists
        cursor.execute("""
            SELECT id, occurrence_count, last_seen FROM learned_patterns
            WHERE pattern_type = ? AND namespace = ? AND component_id = ?
            AND ABS(confidence - ?) < 0.1
            ORDER BY last_seen DESC
            LIMIT 1
        """, (pattern_type, namespace, component_id, confidence))
        
        row = cursor.fetchone()
        now = datetime.now().isoformat()
        
        if row:
            # Update existing pattern
            pattern_id, count, last_seen = row
            cursor.execute("""
                UPDATE learned_patterns
                SET occurrence_count = occurrence_count + 1,
                    last_seen = ?,
                    pattern_data = ?
                WHERE id = ?
            """, (now, json.dumps(pattern_data), pattern_id))
        else:
            # Create new pattern
            cursor.execute("""
                INSERT INTO learned_patterns
                (pattern_type, namespace, component_id, pattern_data, confidence,
                 first_seen, last_seen, occurrence_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            """, (pattern_type, namespace, component_id, json.dumps(pattern_data),
                  confidence, now, now))
        
        conn.commit()
        conn.close()
    
    def get_learned_patterns(self, pattern_type: str = None, component_id: str = None,
                            namespace: str = None, min_confidence: float = 0.5) -> List[Dict]:
        """Retrieve learned patterns"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        query = "SELECT * FROM learned_patterns WHERE 1=1"
        params = []
        
        if pattern_type:
            query += " AND pattern_type = ?"
            params.append(pattern_type)
        if component_id:
            query += " AND component_id = ?"
            params.append(component_id)
        if namespace:
            query += " AND namespace = ?"
            params.append(namespace)
        if min_confidence:
            query += " AND confidence >= ?"
            params.append(min_confidence)
        
        query += " ORDER BY occurrence_count DESC, confidence DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        patterns = []
        for row in rows:
            patterns.append({
                'id': row[0],
                'pattern_type': row[1],
                'namespace': row[2],
                'component_id': row[3],
                'pattern_data': json.loads(row[4]),
                'confidence': row[5],
                'first_seen': row[6],
                'last_seen': row[7],
                'occurrence_count': row[8],
                'associated_outcomes': json.loads(row[9]) if row[9] else []
            })
        
        return patterns
    
    def update_component_lifecycle(self, namespace: str, component_id: str,
                                  health: float, rul_hours: float, patterns: List[str] = None):
        """Track component lifecycle over time"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get existing trajectory
        cursor.execute("""
            SELECT health_trajectory FROM component_lifecycles
            WHERE namespace = ? AND component_id = ?
        """, (namespace, component_id))
        
        row = cursor.fetchone()
        now = datetime.now().isoformat()
        
        new_point = {
            'timestamp': now,
            'health': health,
            'rul_hours': rul_hours
        }
        
        if row:
            trajectory = json.loads(row[0])
            trajectory.append(new_point)
            # Keep last 100 points
            if len(trajectory) > 100:
                trajectory = trajectory[-100:]
            
            # Update
            patterns_json = json.dumps(patterns) if patterns else None
            cursor.execute("""
                UPDATE component_lifecycles
                SET health_trajectory = ?, patterns_detected = ?, last_updated = ?
                WHERE namespace = ? AND component_id = ?
            """, (json.dumps(trajectory), patterns_json, now, namespace, component_id))
        else:
            # Create new
            cursor.execute("""
                INSERT INTO component_lifecycles
                (namespace, component_id, health_trajectory, patterns_detected, last_updated)
                VALUES (?, ?, ?, ?, ?)
            """, (namespace, component_id, json.dumps([new_point]),
                  json.dumps(patterns) if patterns else None, now))
        
        conn.commit()
        conn.close()
    
    def get_component_lifecycle(self, namespace: str, component_id: str) -> Optional[Dict]:
        """Get complete lifecycle data for a component"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM component_lifecycles
            WHERE namespace = ? AND component_id = ?
        """, (namespace, component_id))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                'namespace': row[1],
                'component_id': row[2],
                'health_trajectory': json.loads(row[3]),
                'failure_predictions': json.loads(row[4]) if row[4] else [],
                'maintenance_history': json.loads(row[5]) if row[5] else [],
                'patterns_detected': json.loads(row[6]) if row[6] else [],
                'last_updated': row[7]
            }
        return None
    
    def create_fleet_insight(self, insight_type: str, component_id: str,
                            insight_data: Dict, affected_tanks: List[str],
                            confidence: float = 0.7):
        """Create fleet-wide insight from multiple tanks"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        
        cursor.execute("""
            INSERT INTO fleet_insights
            (insight_type, component_id, insight_data, affected_tanks, confidence,
             first_observed, last_validated, validation_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        """, (
            insight_type,
            component_id,
            json.dumps(insight_data),
            json.dumps(affected_tanks),
            confidence,
            now,
            now
        ))
        
        conn.commit()
        conn.close()
    
    def get_fleet_insights(self, component_id: str = None, insight_type: str = None,
                          min_confidence: float = 0.6) -> List[Dict]:
        """Get fleet-wide insights"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        query = "SELECT * FROM fleet_insights WHERE 1=1"
        params = []
        
        if component_id:
            query += " AND component_id = ?"
            params.append(component_id)
        if insight_type:
            query += " AND insight_type = ?"
            params.append(insight_type)
        if min_confidence:
            query += " AND confidence >= ?"
            params.append(min_confidence)
        
        query += " ORDER BY confidence DESC, validation_count DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        insights = []
        for row in rows:
            insights.append({
                'id': row[0],
                'insight_type': row[1],
                'component_id': row[2],
                'insight_data': json.loads(row[3]),
                'affected_tanks': json.loads(row[4]) if row[4] else [],
                'confidence': row[5],
                'first_observed': row[6],
                'last_validated': row[7],
                'validation_count': row[8]
            })
        
        return insights
    
    def get_similar_tank_contexts(self, namespace: str, limit: int = 5) -> List[Dict]:
        """Find tanks with similar patterns/contexts for learning"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get current tank's health predictions
        cursor.execute("""
            SELECT value FROM agent_context
            WHERE namespace = ? AND key = 'health_predictions'
        """, (namespace,))
        
        row = cursor.fetchone()
        if not row:
            return []
        
        current_context = json.loads(row[0])
        current_components = {c['id']: c for c in current_context.get('components', [])}
        
        # Find other tanks with similar component health issues
        similar_tanks = []
        cursor.execute("""
            SELECT DISTINCT namespace FROM agent_context
            WHERE namespace != ? AND key = 'health_predictions'
        """, (namespace,))
        
        other_tanks = [row[0] for row in cursor.fetchall()]
        
        for other_namespace in other_tanks[:20]:  # Limit search
            cursor.execute("""
                SELECT value FROM agent_context
                WHERE namespace = ? AND key = 'health_predictions'
                ORDER BY timestamp DESC LIMIT 1
            """, (other_namespace,))
            
            row = cursor.fetchone()
            if row:
                other_context = json.loads(row[0])
                other_components = {c['id']: c for c in other_context.get('components', [])}
                
                # Calculate similarity
                similarity_score = self._calculate_similarity(current_components, other_components)
                
                if similarity_score > 0.5:
                    similar_tanks.append({
                        'namespace': other_namespace,
                        'similarity': similarity_score,
                        'context': other_context
                    })
        
        # Sort by similarity
        similar_tanks.sort(key=lambda x: x['similarity'], reverse=True)
        conn.close()
        
        return similar_tanks[:limit]
    
    def _calculate_similarity(self, components1: Dict, components2: Dict) -> float:
        """Calculate similarity between two sets of components"""
        if not components1 or not components2:
            return 0.0
        
        total_score = 0.0
        count = 0
        
        for comp_id in components1:
            if comp_id in components2:
                c1 = components1[comp_id]
                c2 = components2[comp_id]
                
                # Compare health status
                if c1.get('status') == c2.get('status'):
                    total_score += 0.5
                
                # Compare health levels (within 10%)
                health_diff = abs(c1.get('health', 0) - c2.get('health', 0))
                if health_diff < 10:
                    total_score += 0.3
                
                # Compare RUL (within 20%)
                rul1 = c1.get('rul_hours', 0)
                rul2 = c2.get('rul_hours', 0)
                if rul1 > 0 and rul2 > 0:
                    rul_diff = abs(rul1 - rul2) / max(rul1, rul2)
                    if rul_diff < 0.2:
                        total_score += 0.2
                
                count += 1
        
        return total_score / count if count > 0 else 0.0
    
    def get_historical_context(self, namespace: str, key: str, 
                              days_back: int = 30, limit: int = 10) -> List[Dict]:
        """Get historical versions of context"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cutoff = (datetime.now() - timedelta(days=days_back)).isoformat()
        
        cursor.execute("""
            SELECT value, metadata, timestamp FROM context_history
            WHERE namespace = ? AND key = ? AND timestamp >= ?
            ORDER BY timestamp DESC
            LIMIT ?
        """, (namespace, key, cutoff, limit))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [
            {
                'value': json.loads(row[0]) if row[0] else {},
                'metadata': json.loads(row[1]) if row[1] else {},
                'timestamp': row[2]
            }
            for row in rows
        ]
    
    def aggregate_context_for_ai(self, namespace: str) -> Dict:
        """Aggregate all context for a tank into rich AI prompt context"""
        keys = self.list_keys(namespace)
        aggregated = {
            'tank_id': namespace.replace('tank_', ''),
            'contexts': {},
            'patterns': [],
            'lifecycle_data': {},
            'historical_decisions': [],
            'fleet_insights': []
        }
        
        # Get all current contexts
        for key in keys:
            ctx = self.retrieve_with_metadata(namespace, key)
            if ctx:
                aggregated['contexts'][key] = ctx
        
        # Get learned patterns
        aggregated['patterns'] = self.get_learned_patterns(namespace=namespace)
        
        # Get component lifecycles
        components = ['eng-001', 'trn-001', 'hyd-001', 'sus-001', 'fcs-001', 'com-001']
        for comp_id in components:
            lifecycle = self.get_component_lifecycle(namespace, comp_id)
            if lifecycle:
                aggregated['lifecycle_data'][comp_id] = lifecycle
        
        # Get recent decisions
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT agent_name, decision_type, decision, reasoning, success_score, timestamp
            FROM agent_decisions
            WHERE namespace = ?
            ORDER BY timestamp DESC
            LIMIT 10
        """, (namespace,))
        
        for row in cursor.fetchall():
            aggregated['historical_decisions'].append({
                'agent': row[0],
                'type': row[1],
                'decision': json.loads(row[2]),
                'reasoning': row[3],
                'success_score': row[4],
                'timestamp': row[5]
            })
        
        conn.close()
        
        # Get fleet insights for components
        for comp_id in components:
            insights = self.get_fleet_insights(component_id=comp_id)
            aggregated['fleet_insights'].extend(insights)
        
        return aggregated


# Backward compatibility alias
EnhancedHyperspell = EnhancedContextStore

