#!/usr/bin/env python3
"""
Database Migration Script
Adds new tables for predictive maintenance system while preserving existing tank specification data
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'tank_database.db')


def get_db_connection():
    """Get database connection"""
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        print("Please run create_tank_database.py first to create the base database")
        exit(1)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def table_exists(cursor, table_name):
    """Check if a table exists"""
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (table_name,)
    )
    return cursor.fetchone() is not None


def create_maintenance_events_table(cursor):
    """Create maintenance_events table for historical maintenance records"""
    if table_exists(cursor, 'maintenance_events'):
        print("  ⚠ Table maintenance_events already exists, skipping...")
        return False
    
    cursor.execute("""
    CREATE TABLE maintenance_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tankId TEXT NOT NULL,
        componentId TEXT NOT NULL,
        eventTime TIMESTAMP NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('scheduled', 'unscheduled', 'preventive')),
        actions TEXT,
        downtimeHrs REAL,
        partsUsed TEXT,
        resultStatus TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    cursor.execute("""
    CREATE INDEX idx_maintenance_tank_comp 
    ON maintenance_events(tankId, componentId, eventTime)
    """)
    
    print("  ✓ Created maintenance_events table")
    return True


def create_part_risk_table(cursor):
    """Create part_risk table for component risk profiles and Weibull parameters"""
    if table_exists(cursor, 'part_risk'):
        print("  ⚠ Table part_risk already exists, skipping...")
        return False
    
    cursor.execute("""
    CREATE TABLE part_risk (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        componentId TEXT NOT NULL UNIQUE,
        componentName TEXT NOT NULL,
        riskClass TEXT NOT NULL CHECK(riskClass IN ('low', 'medium', 'high', 'critical')),
        missionCriticality REAL NOT NULL CHECK(missionCriticality >= 0 AND missionCriticality <= 1),
        weibull_k REAL NOT NULL,
        weibull_eta_hours INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    cursor.execute("""
    CREATE INDEX idx_part_risk_component 
    ON part_risk(componentId)
    """)
    
    print("  ✓ Created part_risk table")
    return True


def create_priority_policy_table(cursor):
    """Create priority_policy table for maintenance priority rules"""
    if table_exists(cursor, 'priority_policy'):
        print("  ⚠ Table priority_policy already exists, skipping...")
        return False
    
    cursor.execute("""
    CREATE TABLE priority_policy (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        componentId TEXT NOT NULL UNIQUE,
        componentName TEXT NOT NULL,
        basePriority TEXT NOT NULL CHECK(basePriority IN ('low', 'medium', 'high', 'critical')),
        slaDays INTEGER NOT NULL,
        deferCapDays INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    cursor.execute("""
    CREATE INDEX idx_priority_component 
    ON priority_policy(componentId)
    """)
    
    print("  ✓ Created priority_policy table")
    return True


def create_usage_profile_table(cursor):
    """Create usage_profile table for daily operational usage data"""
    if table_exists(cursor, 'usage_profile'):
        print("  ⚠ Table usage_profile already exists, skipping...")
        return False
    
    cursor.execute("""
    CREATE TABLE usage_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tankId TEXT NOT NULL,
        date DATE NOT NULL,
        hoursUsed REAL NOT NULL,
        envSeverity REAL NOT NULL CHECK(envSeverity >= 0 AND envSeverity <= 1),
        overloadPct REAL NOT NULL CHECK(overloadPct >= 0 AND overloadPct <= 1),
        missionType TEXT NOT NULL CHECK(missionType IN ('heavy', 'moderate', 'light', 'standby')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tankId, date)
    )
    """)
    
    cursor.execute("""
    CREATE INDEX idx_usage_tank_date 
    ON usage_profile(tankId, date)
    """)
    
    print("  ✓ Created usage_profile table")
    return True


def create_telemetry_table(cursor):
    """Create telemetry table for sensor time-series data"""
    if table_exists(cursor, 'telemetry'):
        print("  ⚠ Table telemetry already exists, skipping...")
        return False
    
    cursor.execute("""
    CREATE TABLE telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tankId TEXT NOT NULL,
        componentId TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        feature TEXT NOT NULL,
        value REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Compound index for efficient time-series queries
    cursor.execute("""
    CREATE INDEX idx_telemetry_tank_comp_ts 
    ON telemetry(tankId, componentId, timestamp)
    """)
    
    cursor.execute("""
    CREATE INDEX idx_telemetry_feature 
    ON telemetry(feature, timestamp)
    """)
    
    print("  ✓ Created telemetry table")
    return True


def create_logs_parsed_table(cursor):
    """Create logs_parsed table for system logs and fault codes"""
    if table_exists(cursor, 'logs_parsed'):
        print("  ⚠ Table logs_parsed already exists, skipping...")
        return False
    
    cursor.execute("""
    CREATE TABLE logs_parsed (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tankId TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        componentId TEXT NOT NULL,
        severity TEXT NOT NULL CHECK(severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
        code TEXT NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    cursor.execute("""
    CREATE INDEX idx_logs_tank_time 
    ON logs_parsed(tankId, timestamp)
    """)
    
    cursor.execute("""
    CREATE INDEX idx_logs_severity 
    ON logs_parsed(severity, timestamp)
    """)
    
    print("  ✓ Created logs_parsed table")
    return True


def create_agent_activity_log_table(cursor):
    """Create agent_activity_log table for tracking AI agent actions"""
    if table_exists(cursor, 'agent_activity_log'):
        print("  ⚠ Table agent_activity_log already exists, skipping...")
        return False
    
    cursor.execute("""
    CREATE TABLE agent_activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tankId TEXT,
        agentName TEXT NOT NULL,
        action TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('in_progress', 'completed', 'warning', 'error')),
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    cursor.execute("""
    CREATE INDEX idx_activity_tank_time 
    ON agent_activity_log(tankId, timestamp DESC)
    """)
    
    cursor.execute("""
    CREATE INDEX idx_activity_agent 
    ON agent_activity_log(agentName, timestamp DESC)
    """)
    
    print("  ✓ Created agent_activity_log table")
    return True


def verify_existing_tables(cursor):
    """Verify that existing tank specification tables are intact"""
    required_tables = ['tanks', 'performance', 'engines']
    missing_tables = []
    
    for table in required_tables:
        if not table_exists(cursor, table):
            missing_tables.append(table)
    
    if missing_tables:
        print(f"\n⚠ Warning: Missing required base tables: {', '.join(missing_tables)}")
        print("Please run create_tank_database.py first to create the base database")
        return False
    
    # Check if tanks table has data
    cursor.execute("SELECT COUNT(*) FROM tanks")
    tank_count = cursor.fetchone()[0]
    
    print(f"\n✓ Existing database verified: {tank_count} tanks in base tables")
    return True


def main():
    print("=== Tank Database Migration ===\n")
    print("This will add new tables for the predictive maintenance system")
    print("while preserving existing tank specification data.\n")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verify existing tables
    if not verify_existing_tables(cursor):
        conn.close()
        exit(1)
    
    print("\nCreating new tables...\n")
    
    # Track which tables were created
    tables_created = []
    
    # Create all new tables
    if create_maintenance_events_table(cursor):
        tables_created.append('maintenance_events')
    
    if create_part_risk_table(cursor):
        tables_created.append('part_risk')
    
    if create_priority_policy_table(cursor):
        tables_created.append('priority_policy')
    
    if create_usage_profile_table(cursor):
        tables_created.append('usage_profile')
    
    if create_telemetry_table(cursor):
        tables_created.append('telemetry')
    
    if create_logs_parsed_table(cursor):
        tables_created.append('logs_parsed')
    
    if create_agent_activity_log_table(cursor):
        tables_created.append('agent_activity_log')
    
    # Commit changes
    conn.commit()
    
    # Display summary
    print("\n" + "="*50)
    if tables_created:
        print(f"✓ Migration complete! Created {len(tables_created)} new tables:")
        for table in tables_created:
            print(f"  - {table}")
    else:
        print("✓ All tables already exist, no changes needed")
    
    # Display all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    all_tables = [row[0] for row in cursor.fetchall()]
    print(f"\nTotal tables in database: {len(all_tables)}")
    
    # Check database size
    db_size = os.path.getsize(DB_PATH) / (1024 * 1024)  # Convert to MB
    print(f"Database size: {db_size:.2f} MB")
    print(f"Database location: {DB_PATH}")
    
    conn.close()
    
    print("\n✓ Database is ready for data ingestion!")
    print("\nNext steps:")
    print("  1. Generate synthetic data: python data_generator.py --tanks 3 --days 365 --output synthetic_data/")
    print("  2. Start the API server: python api.py")
    print("  3. Upload data via the frontend interface")


if __name__ == '__main__':
    main()

