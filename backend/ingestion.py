#!/usr/bin/env python3
"""
Data Ingestion Module
Validates and imports CSV data into the database with activity logging
"""

import pandas as pd
import sqlite3
import os
import json
from datetime import datetime
from typing import Dict, List, Tuple
import traceback

DB_PATH = os.path.join(os.path.dirname(__file__), 'tank_database.db')

# Required columns for each file type
REQUIRED_SCHEMAS = {
    'maintenance': ['tankId', 'componentId', 'eventTime', 'type', 'actions', 'downtimeHrs', 'partsUsed', 'resultStatus'],
    'risk': ['componentId', 'componentName', 'riskClass', 'missionCriticality', 'weibull_k', 'weibull_eta_hours'],
    'priority': ['componentId', 'componentName', 'basePriority', 'slaDays', 'deferCapDays'],
    'usage': ['tankId', 'date', 'hoursUsed', 'envSeverity', 'overloadPct', 'missionType'],
    'sensors': ['tankId', 'componentId', 'timestamp', 'feature', 'value'],
    'logs': ['tankId', 'timestamp', 'componentId', 'severity', 'code', 'message']
}


def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def log_activity(tank_id: str, agent_name: str, action: str, status: str, details: str = None):
    """Log activity to agent_activity_log table"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    INSERT INTO agent_activity_log (tankId, agentName, action, status, details)
    VALUES (?, ?, ?, ?, ?)
    """, (tank_id, agent_name, action, status, details))
    
    conn.commit()
    conn.close()


def validate_schema(df: pd.DataFrame, file_type: str) -> Tuple[bool, List[str]]:
    """
    Validate that DataFrame has all required columns
    Returns (is_valid, missing_columns)
    """
    required_cols = REQUIRED_SCHEMAS.get(file_type, [])
    missing_cols = [col for col in required_cols if col not in df.columns]
    
    return len(missing_cols) == 0, missing_cols


def validate_types(df: pd.DataFrame, file_type: str) -> Tuple[bool, List[str]]:
    """
    Validate data types and value ranges
    Returns (is_valid, warnings)
    """
    warnings = []
    
    if file_type == 'maintenance':
        if 'downtimeHrs' in df.columns:
            if df['downtimeHrs'].dtype not in ['float64', 'int64']:
                warnings.append("downtimeHrs should be numeric")
            elif df['downtimeHrs'].min() < 0:
                warnings.append(f"Found negative downtimeHrs values")
    
    elif file_type == 'risk':
        if 'missionCriticality' in df.columns:
            if (df['missionCriticality'] < 0).any() or (df['missionCriticality'] > 1).any():
                warnings.append("missionCriticality should be between 0 and 1")
        
        if 'weibull_k' in df.columns:
            if (df['weibull_k'] <= 0).any():
                warnings.append("weibull_k should be positive")
    
    elif file_type == 'usage':
        if 'envSeverity' in df.columns:
            if (df['envSeverity'] < 0).any() or (df['envSeverity'] > 1).any():
                warnings.append("envSeverity should be between 0 and 1")
        
        if 'overloadPct' in df.columns:
            if (df['overloadPct'] < 0).any() or (df['overloadPct'] > 1).any():
                warnings.append("overloadPct should be between 0 and 1")
    
    elif file_type == 'sensors':
        if 'value' in df.columns:
            if df['value'].dtype not in ['float64', 'int64']:
                warnings.append("sensor values should be numeric")
    
    return len(warnings) == 0, warnings


def deduplicate_data(df: pd.DataFrame, file_type: str) -> Tuple[pd.DataFrame, int]:
    """
    Remove duplicate rows based on primary keys
    Returns (deduplicated_df, num_duplicates_removed)
    """
    initial_count = len(df)
    
    if file_type == 'maintenance':
        df = df.drop_duplicates(subset=['tankId', 'componentId', 'eventTime'], keep='last')
    elif file_type == 'risk':
        df = df.drop_duplicates(subset=['componentId'], keep='last')
    elif file_type == 'priority':
        df = df.drop_duplicates(subset=['componentId'], keep='last')
    elif file_type == 'usage':
        df = df.drop_duplicates(subset=['tankId', 'date'], keep='last')
    elif file_type == 'sensors':
        df = df.drop_duplicates(subset=['tankId', 'componentId', 'timestamp', 'feature'], keep='last')
    elif file_type == 'logs':
        df = df.drop_duplicates(subset=['tankId', 'timestamp', 'componentId', 'code'], keep='last')
    
    duplicates_removed = initial_count - len(df)
    return df, duplicates_removed


def ingest_maintenance(df: pd.DataFrame, tank_id: str) -> Tuple[int, List[str]]:
    """Ingest maintenance events"""
    warnings = []
    conn = get_db_connection()
    cursor = conn.cursor()
    
    inserted_count = 0
    for _, row in df.iterrows():
        try:
            cursor.execute("""
            INSERT OR REPLACE INTO maintenance_events 
            (tankId, componentId, eventTime, type, actions, downtimeHrs, partsUsed, resultStatus, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                row['tankId'],
                row['componentId'],
                row['eventTime'],
                row['type'],
                row['actions'],
                row['downtimeHrs'],
                row['partsUsed'],
                row['resultStatus'],
                row.get('notes', '')
            ))
            inserted_count += 1
        except Exception as e:
            warnings.append(f"Error inserting maintenance row: {str(e)}")
    
    conn.commit()
    conn.close()
    
    return inserted_count, warnings


def ingest_risk(df: pd.DataFrame) -> Tuple[int, List[str]]:
    """Ingest risk profiles"""
    warnings = []
    conn = get_db_connection()
    cursor = conn.cursor()
    
    inserted_count = 0
    for _, row in df.iterrows():
        try:
            cursor.execute("""
            INSERT OR REPLACE INTO part_risk 
            (componentId, componentName, riskClass, missionCriticality, weibull_k, weibull_eta_hours)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (
                row['componentId'],
                row['componentName'],
                row['riskClass'],
                row['missionCriticality'],
                row['weibull_k'],
                row['weibull_eta_hours']
            ))
            inserted_count += 1
        except Exception as e:
            warnings.append(f"Error inserting risk row: {str(e)}")
    
    conn.commit()
    conn.close()
    
    return inserted_count, warnings


def ingest_priority(df: pd.DataFrame) -> Tuple[int, List[str]]:
    """Ingest priority policies"""
    warnings = []
    conn = get_db_connection()
    cursor = conn.cursor()
    
    inserted_count = 0
    for _, row in df.iterrows():
        try:
            cursor.execute("""
            INSERT OR REPLACE INTO priority_policy 
            (componentId, componentName, basePriority, slaDays, deferCapDays)
            VALUES (?, ?, ?, ?, ?)
            """, (
                row['componentId'],
                row['componentName'],
                row['basePriority'],
                row['slaDays'],
                row['deferCapDays']
            ))
            inserted_count += 1
        except Exception as e:
            warnings.append(f"Error inserting priority row: {str(e)}")
    
    conn.commit()
    conn.close()
    
    return inserted_count, warnings


def ingest_usage(df: pd.DataFrame, tank_id: str) -> Tuple[int, List[str]]:
    """Ingest usage profiles"""
    warnings = []
    conn = get_db_connection()
    cursor = conn.cursor()
    
    inserted_count = 0
    for _, row in df.iterrows():
        try:
            cursor.execute("""
            INSERT OR REPLACE INTO usage_profile 
            (tankId, date, hoursUsed, envSeverity, overloadPct, missionType)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (
                row['tankId'],
                row['date'],
                row['hoursUsed'],
                row['envSeverity'],
                row['overloadPct'],
                row['missionType']
            ))
            inserted_count += 1
        except Exception as e:
            warnings.append(f"Error inserting usage row: {str(e)}")
    
    conn.commit()
    conn.close()
    
    return inserted_count, warnings


def ingest_sensors(df: pd.DataFrame, tank_id: str) -> Tuple[int, List[str]]:
    """Ingest sensor telemetry (batch insert for performance)"""
    warnings = []
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Batch insert for better performance
        records = [
            (row['tankId'], row['componentId'], row['timestamp'], row['feature'], row['value'])
            for _, row in df.iterrows()
        ]
        
        cursor.executemany("""
        INSERT OR REPLACE INTO telemetry 
        (tankId, componentId, timestamp, feature, value)
        VALUES (?, ?, ?, ?, ?)
        """, records)
        
        inserted_count = len(records)
    except Exception as e:
        warnings.append(f"Error inserting sensor data: {str(e)}")
        inserted_count = 0
    
    conn.commit()
    conn.close()
    
    return inserted_count, warnings


def ingest_logs(df: pd.DataFrame, tank_id: str) -> Tuple[int, List[str]]:
    """Ingest log entries"""
    warnings = []
    conn = get_db_connection()
    cursor = conn.cursor()
    
    inserted_count = 0
    for _, row in df.iterrows():
        try:
            cursor.execute("""
            INSERT OR REPLACE INTO logs_parsed 
            (tankId, timestamp, componentId, severity, code, message)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (
                row['tankId'],
                row['timestamp'],
                row['componentId'],
                row['severity'],
                row['code'],
                row.get('message', '')
            ))
            inserted_count += 1
        except Exception as e:
            warnings.append(f"Error inserting log row: {str(e)}")
    
    conn.commit()
    conn.close()
    
    return inserted_count, warnings


def ingest_csv_file(file_path: str, file_type: str, tank_id: str) -> Dict:
    """
    Ingest a single CSV file
    Returns ingestion summary dict
    """
    result = {
        'file_type': file_type,
        'file_path': file_path,
        'status': 'success',
        'rows_read': 0,
        'rows_inserted': 0,
        'duplicates_removed': 0,
        'warnings': [],
        'errors': []
    }
    
    try:
        # Log start
        log_activity(tank_id, 'DataAgent', f'Processing {file_type}.csv', 'in_progress',
                    json.dumps({'file': file_path}))
        
        # Read CSV
        df = pd.read_csv(file_path)
        result['rows_read'] = len(df)
        
        # Validate schema
        is_valid, missing_cols = validate_schema(df, file_type)
        if not is_valid:
            result['status'] = 'error'
            result['errors'].append(f"Missing required columns: {', '.join(missing_cols)}")
            log_activity(tank_id, 'DataAgent', f'Failed to process {file_type}.csv', 'error',
                        json.dumps({'error': f"Missing columns: {', '.join(missing_cols)}"}))
            return result
        
        # Validate types
        _, type_warnings = validate_types(df, file_type)
        result['warnings'].extend(type_warnings)
        
        # Deduplicate
        df, duplicates = deduplicate_data(df, file_type)
        result['duplicates_removed'] = duplicates
        
        # Ingest based on type
        if file_type == 'maintenance':
            inserted, warnings = ingest_maintenance(df, tank_id)
        elif file_type == 'risk':
            inserted, warnings = ingest_risk(df)
        elif file_type == 'priority':
            inserted, warnings = ingest_priority(df)
        elif file_type == 'usage':
            inserted, warnings = ingest_usage(df, tank_id)
        elif file_type == 'sensors':
            inserted, warnings = ingest_sensors(df, tank_id)
        elif file_type == 'logs':
            inserted, warnings = ingest_logs(df, tank_id)
        else:
            result['status'] = 'error'
            result['errors'].append(f"Unknown file type: {file_type}")
            return result
        
        result['rows_inserted'] = inserted
        result['warnings'].extend(warnings)
        
        # Log completion
        log_activity(tank_id, 'DataAgent', f'Completed {file_type}.csv', 'completed',
                    json.dumps({'rows': inserted, 'duplicates': duplicates}))
        
    except FileNotFoundError:
        result['status'] = 'error'
        result['errors'].append(f"File not found: {file_path}")
        log_activity(tank_id, 'DataAgent', f'Failed to find {file_type}.csv', 'error',
                    json.dumps({'error': 'File not found'}))
    except Exception as e:
        result['status'] = 'error'
        result['errors'].append(f"Unexpected error: {str(e)}")
        result['errors'].append(traceback.format_exc())
        log_activity(tank_id, 'DataAgent', f'Error processing {file_type}.csv', 'error',
                    json.dumps({'error': str(e)}))
    
    return result


def ingest_tank_data(tank_id: str, data_dir: str) -> Dict:
    """
    Ingest all CSV files for a tank
    
    Args:
        tank_id: Tank identifier (e.g., "TNK-A-047")
        data_dir: Directory containing the CSV files
    
    Returns:
        Dict with ingestion summary
    """
    summary = {
        'tank_id': tank_id,
        'status': 'success',
        'files_processed': 0,
        'total_rows_inserted': 0,
        'total_duplicates_removed': 0,
        'file_results': {},
        'warnings': [],
        'errors': []
    }
    
    # Log start
    log_activity(tank_id, 'DataAgent', f'Starting data ingestion for {tank_id}', 'in_progress',
                json.dumps({'directory': data_dir}))
    
    file_types = ['maintenance', 'risk', 'priority', 'usage', 'sensors', 'logs']
    
    for file_type in file_types:
        file_path = os.path.join(data_dir, f'{file_type}.csv')
        
        if not os.path.exists(file_path):
            summary['warnings'].append(f"File not found: {file_type}.csv (skipping)")
            continue
        
        result = ingest_csv_file(file_path, file_type, tank_id)
        summary['file_results'][file_type] = result
        summary['files_processed'] += 1
        
        if result['status'] == 'success':
            summary['total_rows_inserted'] += result['rows_inserted']
            summary['total_duplicates_removed'] += result['duplicates_removed']
        else:
            summary['status'] = 'partial'
            summary['errors'].extend(result['errors'])
        
        summary['warnings'].extend(result['warnings'])
    
    # Final status
    if summary['files_processed'] == 0:
        summary['status'] = 'error'
        summary['errors'].append("No files were processed")
    elif len(summary['errors']) > 0:
        summary['status'] = 'partial'
    
    # Log completion
    final_status = 'completed' if summary['status'] == 'success' else 'warning'
    log_activity(tank_id, 'DataAgent', f'Finished data ingestion for {tank_id}', final_status,
                json.dumps({
                    'files': summary['files_processed'],
                    'rows': summary['total_rows_inserted'],
                    'status': summary['status']
                }))
    
    return summary


if __name__ == '__main__':
    # Example usage
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python ingestion.py <tank_id> <data_directory>")
        print("Example: python ingestion.py TNK-A-047 synthetic_data/TNK-A-047")
        sys.exit(1)
    
    tank_id = sys.argv[1]
    data_dir = sys.argv[2]
    
    print(f"=== Ingesting data for {tank_id} ===\n")
    
    summary = ingest_tank_data(tank_id, data_dir)
    
    print(f"\nStatus: {summary['status']}")
    print(f"Files processed: {summary['files_processed']}")
    print(f"Total rows inserted: {summary['total_rows_inserted']}")
    print(f"Duplicates removed: {summary['total_duplicates_removed']}")
    
    if summary['warnings']:
        print(f"\nWarnings ({len(summary['warnings'])}):")
        for warning in summary['warnings'][:5]:
            print(f"  - {warning}")
    
    if summary['errors']:
        print(f"\nErrors ({len(summary['errors'])}):")
        for error in summary['errors'][:5]:
            print(f"  - {error}")

