#!/usr/bin/env python3
"""
Simple Context Store (SQLite-based replacement for Hyperspell)
Stores agent context in database for cross-agent communication
"""

import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tank_database.db')


class SimpleContextStore:
    """SQLite-based context storage (replacement for Hyperspell)"""
    
    def __init__(self, api_key=None):
        self.api_key = api_key  # Not used, for compatibility
        self._ensure_table()
    
    def _ensure_table(self):
        """Create context table if not exists"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS agent_context (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            namespace TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(namespace, key)
        )
        """)
        
        cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_context_namespace_key
        ON agent_context(namespace, key)
        """)
        
        conn.commit()
        conn.close()
    
    def store(self, namespace: str, key: str, value: str):
        """Store context data"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
        INSERT OR REPLACE INTO agent_context (namespace, key, value, timestamp)
        VALUES (?, ?, ?, ?)
        """, (namespace, key, value, datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
    
    def retrieve(self, namespace: str, key: str) -> str:
        """Retrieve context data"""
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
    
    def list_keys(self, namespace: str) -> list:
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

