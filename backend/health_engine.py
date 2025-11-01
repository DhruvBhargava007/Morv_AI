#!/usr/bin/env python3
"""
Health Engine - Transparent Component Health Prediction
Computes Health Index (HI) and Remaining Useful Life (RUL) using feature engineering and Weibull models
"""

import numpy as np
import pandas as pd
import sqlite3
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
from scipy import stats
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'tank_database.db')

# Default formula weights (tunable)
DEFAULT_FORMULA_WEIGHTS = {
    'alpha': 0.15,  # Feature deviation weight
    'beta': 0.25,   # Overload exposure weight
    'gamma': 0.30,  # Weibull hazard weight
    'delta': 0.20   # Maintenance recency weight
}

# Component-specific feature weights
COMPONENT_FEATURE_WEIGHTS = {
    'Engine': {'temp': 0.35, 'pressure': 0.25, 'vib': 0.30, 'codes': 0.10},
    'Transmission': {'temp': 0.30, 'pressure': 0.30, 'vib': 0.30, 'codes': 0.10},
    'Hydraulics': {'temp': 0.25, 'pressure': 0.35, 'vib': 0.25, 'codes': 0.15},
    'Suspension': {'vib': 0.50, 'temp': 0.30, 'travel': 0.20},
    'FireControl': {'temp': 0.25, 'voltage': 0.25, 'drift': 0.30, 'codes': 0.20},
    'Communications': {'signal': 0.35, 'voltage': 0.20, 'temp': 0.25, 'codes': 0.20}
}

# Z-score thresholds (features exceeding this trigger penalties)
Z_SCORE_THRESHOLD = 2.0


def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_component_name_from_id(component_id: str) -> str:
    """Extract component name from ID (e.g., 'eng-001' -> 'Engine')"""
    prefix_map = {
        'eng': 'Engine',
        'trn': 'Transmission',
        'hyd': 'Hydraulics',
        'sus': 'Suspension',
        'fcs': 'FireControl',
        'com': 'Communications'
    }
    prefix = component_id.split('-')[0]
    return prefix_map.get(prefix, 'Unknown')


def fetch_telemetry(tank_id: str, component_id: str, days: int = 30) -> pd.DataFrame:
    """Fetch recent telemetry data for a component"""
    conn = get_db_connection()
    
    # First, get the latest timestamp in the data
    cursor = conn.cursor()
    cursor.execute("""
    SELECT MAX(timestamp) as max_ts FROM telemetry
    WHERE tankId = ? AND componentId = ?
    """, (tank_id, component_id))
    
    row = cursor.fetchone()
    if row and row['max_ts']:
        # Use the latest timestamp in data as "now"
        latest_time = datetime.strptime(row['max_ts'], '%Y-%m-%d %H:%M:%S')
        cutoff_time = latest_time - timedelta(days=days)
    else:
        # Fallback to actual now
        cutoff_time = datetime.now() - timedelta(days=days)
    
    query = """
    SELECT timestamp, feature, value
    FROM telemetry
    WHERE tankId = ? AND componentId = ? AND timestamp >= ?
    ORDER BY timestamp ASC
    """
    
    df = pd.read_sql_query(
        query,
        conn,
        params=(tank_id, component_id, cutoff_time.strftime('%Y-%m-%d %H:%M:%S'))
    )
    
    conn.close()
    
    if len(df) > 0:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    return df


def fetch_usage_profile(tank_id: str, days: int = 30) -> pd.DataFrame:
    """Fetch recent usage profile data"""
    conn = get_db_connection()
    
    # Get latest date in usage data
    cursor = conn.cursor()
    cursor.execute("""
    SELECT MAX(date) as max_date FROM usage_profile
    WHERE tankId = ?
    """, (tank_id,))
    
    row = cursor.fetchone()
    if row and row['max_date']:
        latest_date = datetime.strptime(row['max_date'], '%Y-%m-%d').date()
        cutoff_date = latest_date - timedelta(days=days)
    else:
        cutoff_date = datetime.now().date() - timedelta(days=days)
    
    query = """
    SELECT date, hoursUsed, envSeverity, overloadPct, missionType
    FROM usage_profile
    WHERE tankId = ? AND date >= ?
    ORDER BY date ASC
    """
    
    df = pd.read_sql_query(
        query,
        conn,
        params=(tank_id, cutoff_date.strftime('%Y-%m-%d'))
    )
    
    conn.close()
    
    if len(df) > 0:
        df['date'] = pd.to_datetime(df['date'])
    
    return df


def fetch_maintenance_history(tank_id: str, component_id: str) -> pd.DataFrame:
    """Fetch maintenance history for a component"""
    conn = get_db_connection()
    
    query = """
    SELECT eventTime, type, downtimeHrs
    FROM maintenance_events
    WHERE tankId = ? AND componentId = ?
    ORDER BY eventTime DESC
    LIMIT 10
    """
    
    df = pd.read_sql_query(
        query,
        conn,
        params=(tank_id, component_id)
    )
    
    conn.close()
    
    if len(df) > 0:
        df['eventTime'] = pd.to_datetime(df['eventTime'])
    
    return df


def fetch_risk_profile(component_id: str) -> Optional[Dict]:
    """Fetch risk profile and Weibull parameters"""
    conn = get_db_connection()
    
    query = """
    SELECT riskClass, missionCriticality, weibull_k, weibull_eta_hours
    FROM part_risk
    WHERE componentId = ?
    """
    
    cursor = conn.cursor()
    cursor.execute(query, (component_id,))
    row = cursor.fetchone()
    
    conn.close()
    
    if row:
        return {
            'riskClass': row['riskClass'],
            'missionCriticality': row['missionCriticality'],
            'weibull_k': row['weibull_k'],
            'weibull_eta': row['weibull_eta_hours']
        }
    
    return None


def compute_z_scores(telemetry_df: pd.DataFrame, window_days: int = 7) -> Dict[str, float]:
    """
    Compute z-scores for each feature over rolling windows
    Returns current z-score for each feature
    """
    z_scores = {}
    
    # Group by feature
    for feature in telemetry_df['feature'].unique():
        feature_data = telemetry_df[telemetry_df['feature'] == feature].sort_values('timestamp')
        
        if len(feature_data) < 10:
            z_scores[feature] = 0.0
            continue
        
        # Compute rolling statistics
        values = feature_data['value'].values
        
        # Use last 20% of data for "current" and earlier data for baseline
        split_idx = int(len(values) * 0.8)
        baseline_values = values[:split_idx] if split_idx > 5 else values
        current_values = values[split_idx:] if split_idx > 5 else values[-5:]
        
        baseline_mean = np.mean(baseline_values)
        baseline_std = np.std(baseline_values)
        
        if baseline_std > 0:
            current_mean = np.mean(current_values)
            z_score = (current_mean - baseline_mean) / baseline_std
            z_scores[feature] = z_score
        else:
            z_scores[feature] = 0.0
    
    return z_scores


def compute_trend_slopes(telemetry_df: pd.DataFrame, days: int = 14) -> Dict[str, float]:
    """
    Compute linear trend slopes for each feature
    Returns slope (change per day) for each feature
    """
    slopes = {}
    
    cutoff_time = datetime.now() - timedelta(days=days)
    recent_data = telemetry_df[telemetry_df['timestamp'] >= cutoff_time]
    
    for feature in recent_data['feature'].unique():
        feature_data = recent_data[recent_data['feature'] == feature].sort_values('timestamp')
        
        if len(feature_data) < 5:
            slopes[feature] = 0.0
            continue
        
        # Convert timestamps to numeric (days since first reading)
        time_numeric = (feature_data['timestamp'] - feature_data['timestamp'].min()).dt.total_seconds() / (24 * 3600)
        values = feature_data['value'].values
        
        # Linear regression
        if len(time_numeric) > 1:
            slope, intercept, r_value, p_value, std_err = stats.linregress(time_numeric, values)
            slopes[feature] = slope
        else:
            slopes[feature] = 0.0
    
    return slopes


def compute_over_threshold_exposure(telemetry_df: pd.DataFrame) -> Dict[str, float]:
    """
    Compute fraction of time each feature spends above its 90th percentile
    """
    exposures = {}
    
    for feature in telemetry_df['feature'].unique():
        feature_data = telemetry_df[telemetry_df['feature'] == feature]
        
        if len(feature_data) < 10:
            exposures[feature] = 0.0
            continue
        
        values = feature_data['value'].values
        p90 = np.percentile(values, 90)
        
        # Fraction of readings above 90th percentile
        exposure = np.sum(values > p90) / len(values)
        exposures[feature] = exposure
    
    return exposures


def compute_error_code_rate(telemetry_df: pd.DataFrame, usage_df: pd.DataFrame) -> float:
    """
    Compute error code rate (codes per 100 operating hours)
    """
    # Find error code features
    error_features = [f for f in telemetry_df['feature'].unique() if 'error' in f.lower() or 'code' in f.lower()]
    
    if not error_features or len(usage_df) == 0:
        return 0.0
    
    # Sum all error codes
    error_data = telemetry_df[telemetry_df['feature'].isin(error_features)]
    total_errors = error_data['value'].sum()
    
    # Total operating hours
    total_hours = usage_df['hoursUsed'].sum()
    
    if total_hours > 0:
        return (total_errors / total_hours) * 100
    
    return 0.0


def compute_maintenance_recency(maintenance_df: pd.DataFrame, weibull_eta: float) -> float:
    """
    Compute maintenance recency factor (hours since last service / MTBF)
    Higher value = more time since last service relative to MTBF
    """
    if len(maintenance_df) == 0:
        # No maintenance history, assume component is at 50% of MTBF
        return 0.5
    
    last_service = maintenance_df['eventTime'].max()
    hours_since = (datetime.now() - last_service).total_seconds() / 3600
    
    # Normalize by MTBF
    recency_factor = hours_since / weibull_eta
    
    return min(recency_factor, 1.0)  # Cap at 1.0


def compute_weibull_hazard_integral(
    operating_hours: float,
    weibull_eta: float,
    weibull_k: float
) -> float:
    """
    Compute cumulative Weibull hazard up to current operating hours
    """
    # Cumulative hazard: H(t) = (t/eta)^k
    cumulative_hazard = (operating_hours / weibull_eta) ** weibull_k
    return cumulative_hazard


def compute_overload_exposure(usage_df: pd.DataFrame) -> float:
    """
    Compute average overload exposure from usage profile
    """
    if len(usage_df) == 0:
        return 0.0
    
    return usage_df['overloadPct'].mean()


def group_features_by_type(z_scores: Dict[str, float], component_name: str) -> Dict[str, List[str]]:
    """
    Group features into categories (temp, pressure, vibration, etc.)
    """
    grouped = {
        'temp': [],
        'pressure': [],
        'vib': [],
        'voltage': [],
        'signal': [],
        'drift': [],
        'travel': [],
        'codes': []
    }
    
    for feature in z_scores.keys():
        feature_lower = feature.lower()
        if 'temp' in feature_lower:
            grouped['temp'].append(feature)
        elif 'pressure' in feature_lower:
            grouped['pressure'].append(feature)
        elif 'vib' in feature_lower:
            grouped['vib'].append(feature)
        elif 'voltage' in feature_lower:
            grouped['voltage'].append(feature)
        elif 'signal' in feature_lower:
            grouped['signal'].append(feature)
        elif 'drift' in feature_lower:
            grouped['drift'].append(feature)
        elif 'travel' in feature_lower or 'damper' in feature_lower:
            grouped['travel'].append(feature)
        elif 'error' in feature_lower or 'code' in feature_lower:
            grouped['codes'].append(feature)
    
    return grouped


def compute_health_index(
    tank_id: str,
    component_id: str,
    formula_weights: Optional[Dict] = None
) -> Dict:
    """
    Compute Health Index (HI) and derive Remaining Useful Life (RUL)
    
    Returns dict with:
        - health: HI value (0-100)
        - rul_hours: Remaining useful life in hours
        - status: operational/degraded/maintenance_required/critical
        - drivers: Top 3 contributing features with contributions
        - formula: Formula parameters used
        - last_service: Date of last maintenance
        - next_service: Recommended next service date
    """
    # Use default weights if not provided
    if formula_weights is None:
        formula_weights = DEFAULT_FORMULA_WEIGHTS.copy()
    
    # Fetch data
    telemetry_df = fetch_telemetry(tank_id, component_id, days=30)
    usage_df = fetch_usage_profile(tank_id, days=30)
    maintenance_df = fetch_maintenance_history(tank_id, component_id)
    risk_profile = fetch_risk_profile(component_id)
    
    # Handle missing data
    if len(telemetry_df) == 0:
        return {
            'health': 50,
            'rul_hours': 0,
            'status': 'unknown',
            'drivers': [],
            'formula': formula_weights,
            'error': 'No telemetry data available'
        }
    
    # Default Weibull parameters if not in database
    if risk_profile is None:
        risk_profile = {
            'weibull_eta': 3500,
            'weibull_k': 2.0,
            'missionCriticality': 0.8,
            'riskClass': 'medium'
        }
    
    component_name = get_component_name_from_id(component_id)
    
    # Feature engineering
    z_scores = compute_z_scores(telemetry_df)
    slopes = compute_trend_slopes(telemetry_df)
    exposures = compute_over_threshold_exposure(telemetry_df)
    error_rate = compute_error_code_rate(telemetry_df, usage_df)
    
    # Aggregate metrics
    overload_exposure = compute_overload_exposure(usage_df)
    maintenance_recency = compute_maintenance_recency(maintenance_df, risk_profile['weibull_eta'])
    
    # Estimate total operating hours (sum from usage profile)
    total_operating_hours = usage_df['hoursUsed'].sum() if len(usage_df) > 0 else 0
    if total_operating_hours == 0:
        total_operating_hours = 1000  # Default assumption
    
    weibull_hazard = compute_weibull_hazard_integral(
        total_operating_hours,
        risk_profile['weibull_eta'],
        risk_profile['weibull_k']
    )
    
    # Get feature weights for this component
    feature_weights = COMPONENT_FEATURE_WEIGHTS.get(component_name, {
        'temp': 0.30, 'pressure': 0.25, 'vib': 0.30, 'codes': 0.15
    })
    
    # Group features by type
    grouped_features = group_features_by_type(z_scores, component_name)
    
    # Compute weighted feature deviation penalty
    feature_penalties = {}
    total_feature_penalty = 0.0
    
    for feature_type, weight in feature_weights.items():
        features_in_group = grouped_features.get(feature_type, [])
        if features_in_group:
            # Average z-score for this feature type
            group_z_scores = [abs(z_scores.get(f, 0)) for f in features_in_group]
            avg_z_score = np.mean(group_z_scores)
            
            # Apply threshold and weight
            penalty = weight * max(0, avg_z_score - Z_SCORE_THRESHOLD)
            feature_penalties[feature_type] = penalty
            total_feature_penalty += penalty
    
    # Add error rate contribution
    if 'codes' in feature_weights:
        error_penalty = feature_weights['codes'] * (error_rate / 10.0)  # Normalize to 0-1 range
        feature_penalties['error_rate'] = error_penalty
        total_feature_penalty += error_penalty
    
    # Compute Health Index
    # HI = 100 * exp(-[alpha * feature_penalty + beta * overload + gamma * hazard + delta * recency])
    penalty_sum = (
        formula_weights['alpha'] * total_feature_penalty +
        formula_weights['beta'] * overload_exposure +
        formula_weights['gamma'] * weibull_hazard +
        formula_weights['delta'] * maintenance_recency
    )
    
    health_index = 100 * np.exp(-penalty_sum)
    health_index = np.clip(health_index, 0, 100)
    
    # Compute RUL
    # RUL = (HI / 100) * eta_effective where eta_effective = eta / (1 + 0.5 * overload)
    eta_effective = risk_profile['weibull_eta'] / (1 + 0.5 * overload_exposure)
    rul_hours = (health_index / 100) * eta_effective
    
    # Determine status
    if health_index >= 80:
        status = 'operational'
    elif health_index >= 60:
        status = 'degraded'
    elif health_index >= 40:
        status = 'maintenance_required'
    else:
        status = 'critical'
    
    # Rank drivers by contribution
    contribution_breakdown = {
        'feature_deviation': formula_weights['alpha'] * total_feature_penalty,
        'overload_exposure': formula_weights['beta'] * overload_exposure,
        'age_wear': formula_weights['gamma'] * weibull_hazard,
        'maintenance_recency': formula_weights['delta'] * maintenance_recency
    }
    
    total_contribution = sum(contribution_breakdown.values())
    
    drivers = []
    for driver, contrib in sorted(contribution_breakdown.items(), key=lambda x: x[1], reverse=True)[:3]:
        if total_contribution > 0:
            contribution_pct = contrib / total_contribution
            drivers.append({
                'feature': driver,
                'contribution': round(contribution_pct, 3)
            })
    
    # Add top specific feature contributors
    for feature_type, penalty in sorted(feature_penalties.items(), key=lambda x: x[1], reverse=True)[:2]:
        if penalty > 0.05 and len(drivers) < 5:  # Only add significant contributors
            drivers.append({
                'feature': f"{feature_type}_deviation",
                'contribution': round(penalty / max(total_contribution, 0.01), 3)
            })
    
    # Calculate service dates
    last_service = maintenance_df['eventTime'].max() if len(maintenance_df) > 0 else None
    next_service = datetime.now() + timedelta(hours=rul_hours) if rul_hours > 0 else datetime.now()
    
    return {
        'health': round(health_index, 1),
        'rul_hours': round(rul_hours, 0),
        'status': status,
        'drivers': drivers[:5],  # Top 5 drivers
        'formula': {
            **formula_weights,
            'weights': feature_weights,
            'thresholds': {'z_score': Z_SCORE_THRESHOLD}
        },
        'lastServiced': last_service.strftime('%Y-%m-%d') if last_service else 'Unknown',
        'nextService': next_service.strftime('%Y-%m-%d')
    }


def compute_readiness_score(tank_id: str, component_ids: List[str]) -> float:
    """
    Compute tank-level readiness score as weighted average of component health
    weighted by mission criticality
    """
    total_weighted_health = 0.0
    total_weight = 0.0
    
    for component_id in component_ids:
        health_result = compute_health_index(tank_id, component_id)
        risk_profile = fetch_risk_profile(component_id)
        
        if risk_profile:
            weight = risk_profile['missionCriticality']
        else:
            weight = 0.8  # Default
        
        total_weighted_health += health_result['health'] * weight
        total_weight += weight
    
    if total_weight > 0:
        readiness = total_weighted_health / total_weight
    else:
        readiness = 50.0
    
    return round(readiness, 1)


if __name__ == '__main__':
    # Example usage
    print("=== Health Engine Test ===\n")
    
    tank_id = "TNK-A-047"
    component_id = "eng-001"
    
    print(f"Computing health for {tank_id} - {component_id}...\n")
    
    result = compute_health_index(tank_id, component_id)
    
    print(f"Health Index: {result['health']}%")
    print(f"Status: {result['status']}")
    print(f"RUL: {result['rul_hours']} hours")
    print(f"Last Service: {result.get('lastServiced', 'Unknown')}")
    print(f"Next Service: {result.get('nextService', 'Unknown')}")
    print(f"\nTop Drivers:")
    for driver in result['drivers']:
        print(f"  - {driver['feature']}: {driver['contribution']*100:.1f}%")

