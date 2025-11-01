#!/usr/bin/env python3
"""
Synthetic Data Generator for Tank Predictive Maintenance
Generates realistic Weibull-based degradation data for 6 critical subsystems
"""

import numpy as np
import pandas as pd
import argparse
import os
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import json

# Component configuration with Weibull parameters (eta=MTBF in hours, k=shape)
COMPONENT_CONFIG = {
    'Engine': {
        'id_prefix': 'eng',
        'weibull_eta': 3500,  # MTBF hours
        'weibull_k': 2.2,
        'sensors': ['oil_temp', 'coolant_temp', 'oil_pressure', 'vib_rms', 'vib_kurtosis', 'rpm'],
        'sensor_ranges': {
            'oil_temp': (80, 100),  # Celsius
            'coolant_temp': (75, 95),
            'oil_pressure': (40, 60),  # PSI
            'vib_rms': (0.5, 2.0),  # mm/s
            'vib_kurtosis': (2.5, 4.0),
            'rpm': (2000, 2800)
        },
        'risk_class': 'critical',
        'mission_criticality': 0.95,
        'base_priority': 'critical',
        'sla_days': 3,
        'defer_cap_days': 1
    },
    'Transmission': {
        'id_prefix': 'trn',
        'weibull_eta': 4200,
        'weibull_k': 2.5,
        'sensors': ['fluid_temp', 'pressure', 'gear_pos', 'vib_rms', 'torque'],
        'sensor_ranges': {
            'fluid_temp': (70, 90),
            'pressure': (30, 50),
            'gear_pos': (1, 6),
            'vib_rms': (0.3, 1.5),
            'torque': (1000, 2000)  # Nm
        },
        'risk_class': 'high',
        'mission_criticality': 0.90,
        'base_priority': 'high',
        'sla_days': 5,
        'defer_cap_days': 2
    },
    'Hydraulics': {
        'id_prefix': 'hyd',
        'weibull_eta': 2800,
        'weibull_k': 1.8,
        'sensors': ['fluid_temp', 'pressure', 'flow_rate', 'vib_rms', 'leak_rate'],
        'sensor_ranges': {
            'fluid_temp': (60, 85),
            'pressure': (2000, 3000),  # PSI
            'flow_rate': (10, 30),  # L/min
            'vib_rms': (0.4, 1.8),
            'leak_rate': (0, 0.5)  # ml/hr
        },
        'risk_class': 'critical',
        'mission_criticality': 0.92,
        'base_priority': 'critical',
        'sla_days': 2,
        'defer_cap_days': 1
    },
    'Suspension': {
        'id_prefix': 'sus',
        'weibull_eta': 3200,
        'weibull_k': 2.0,
        'sensors': ['left_damper_travel', 'right_damper_travel', 'vib_rms', 'road_wheel_temp'],
        'sensor_ranges': {
            'left_damper_travel': (0, 200),  # mm
            'right_damper_travel': (0, 200),
            'vib_rms': (1.0, 3.0),
            'road_wheel_temp': (30, 70)
        },
        'risk_class': 'medium',
        'mission_criticality': 0.75,
        'base_priority': 'medium',
        'sla_days': 7,
        'defer_cap_days': 3
    },
    'FireControl': {
        'id_prefix': 'fcs',
        'weibull_eta': 5000,
        'weibull_k': 3.0,
        'sensors': ['voltage', 'current', 'cpu_temp', 'sensor_drift', 'error_codes'],
        'sensor_ranges': {
            'voltage': (22, 30),  # VDC
            'current': (5, 20),  # A
            'cpu_temp': (40, 70),
            'sensor_drift': (0, 5),  # pixels
            'error_codes': (0, 5)
        },
        'risk_class': 'high',
        'mission_criticality': 0.88,
        'base_priority': 'high',
        'sla_days': 4,
        'defer_cap_days': 2
    },
    'Communications': {
        'id_prefix': 'com',
        'weibull_eta': 4500,
        'weibull_k': 2.8,
        'sensors': ['signal_strength', 'voltage', 'temp', 'packet_loss', 'error_codes'],
        'sensor_ranges': {
            'signal_strength': (-80, -30),  # dBm
            'voltage': (22, 30),
            'temp': (30, 60),
            'packet_loss': (0, 10),  # %
            'error_codes': (0, 3)
        },
        'risk_class': 'medium',
        'mission_criticality': 0.70,
        'base_priority': 'medium',
        'sla_days': 7,
        'defer_cap_days': 3
    }
}

TANK_IDS = ['TNK-A-047', 'TNK-B-023', 'TNK-C-091']

# Tank-specific degradation profiles
# TNK-A-047: Good condition (baseline)
# TNK-B-023: Heavy wear and high usage (needs maintenance!)
# TNK-C-091: Moderate wear
TANK_DEGRADATION_MULTIPLIERS = {
    'TNK-A-047': 1.0,   # Normal degradation
    'TNK-B-023': 8.0,   # 8x faster degradation (CRITICAL! Needs immediate maintenance)
    'TNK-C-091': 2.5    # 2.5x degradation (degraded, needs preventive maintenance)
}

TANK_USAGE_INTENSITY = {
    'TNK-A-047': 'moderate',  # Normal usage
    'TNK-B-023': 'heavy',     # Heavy usage - lots of combat/training
    'TNK-C-091': 'moderate'   # Moderate usage
}


def weibull_hazard(t: float, eta: float, k: float) -> float:
    """Compute Weibull hazard rate at time t"""
    return (k / eta) * (t / eta) ** (k - 1)


def weibull_cdf(t: float, eta: float, k: float) -> float:
    """Compute Weibull cumulative distribution function"""
    return 1 - np.exp(-(t / eta) ** k)


def generate_degradation_trajectory(days: int, eta: float, k: float, degradation_multiplier: float = 1.0, noise: float = 0.05) -> np.ndarray:
    """
    Generate health degradation trajectory over time using Weibull distribution
    Returns health index (0-100) for each hour
    degradation_multiplier: >1 means faster degradation (worse condition)
    """
    hours = days * 24
    times = np.arange(hours)
    
    # Apply degradation multiplier to simulate accelerated wear
    # Effectively reduces MTBF
    effective_eta = eta / degradation_multiplier
    
    # Health index inversely proportional to cumulative hazard
    health = 100 * np.exp(-np.cumsum([weibull_hazard(t, effective_eta, k) for t in times]))
    
    # Add noise
    health += np.random.normal(0, noise * health, size=len(health))
    health = np.clip(health, 0, 100)
    
    return health


def correlate_sensor_to_health(
    health: np.ndarray,
    sensor_range: Tuple[float, float],
    inverse: bool = False,
    spike_threshold: float = 40
) -> np.ndarray:
    """
    Correlate sensor readings to health degradation
    inverse=True: sensor increases as health decreases (e.g., temperature, vibration)
    inverse=False: sensor decreases as health decreases (e.g., pressure, signal strength)
    """
    min_val, max_val = sensor_range
    
    if inverse:
        # Sensor increases as health drops
        normalized_health = (100 - health) / 100
        base_values = min_val + normalized_health * (max_val - min_val)
    else:
        # Sensor decreases as health drops
        normalized_health = health / 100
        base_values = min_val + normalized_health * (max_val - min_val)
    
    # Add physics-based noise (increases with degradation)
    noise_scale = 0.02 + 0.08 * (100 - health) / 100
    noise = np.random.normal(0, noise_scale * (max_val - min_val), size=len(health))
    values = base_values + noise
    
    # Add occasional spikes when health is critical
    spike_prob = np.where(health < spike_threshold, 0.05, 0.001)
    spikes = np.random.random(len(health)) < spike_prob
    values[spikes] += np.random.uniform(0.1, 0.3) * (max_val - min_val) * np.sign(max_val - min_val)
    
    return np.clip(values, min_val, max_val)


def generate_error_codes(health: np.ndarray, component: str) -> np.ndarray:
    """Generate error codes that appear 2-4 weeks before failure"""
    error_codes = np.zeros(len(health), dtype=int)
    
    # Error codes appear when health drops below thresholds
    critical_mask = health < 40
    warning_mask = (health >= 40) & (health < 60)
    
    # Critical errors
    error_codes[critical_mask] = np.random.poisson(2, size=np.sum(critical_mask))
    # Warning errors
    error_codes[warning_mask] = np.random.poisson(0.5, size=np.sum(warning_mask))
    
    return np.clip(error_codes, 0, 10)


def generate_usage_profile(tank_id: str, days: int) -> pd.DataFrame:
    """Generate daily usage profile with operational hours and conditions"""
    dates = pd.date_range(start='2024-01-01', periods=days, freq='D')
    
    # Get tank-specific usage intensity
    intensity = TANK_USAGE_INTENSITY.get(tank_id, 'moderate')
    
    # Adjust usage patterns based on tank intensity
    if intensity == 'heavy':
        # TNK-B-023: Lots of heavy usage
        pattern_probs = [0.40, 0.35, 0.15, 0.10]  # More heavy, less standby
    elif intensity == 'moderate':
        # TNK-A-047, TNK-C-091: Normal usage
        pattern_probs = [0.15, 0.35, 0.35, 0.15]
    else:
        pattern_probs = [0.10, 0.30, 0.40, 0.20]
    
    # Simulate operational patterns (training exercises, maintenance, standby)
    usage_patterns = np.random.choice(
        ['heavy', 'moderate', 'light', 'standby'],
        size=days,
        p=pattern_probs
    )
    
    hours_map = {'heavy': (8, 12), 'moderate': (4, 8), 'light': (1, 4), 'standby': (0, 1)}
    env_map = {'heavy': (0.6, 0.9), 'moderate': (0.3, 0.6), 'light': (0.1, 0.3), 'standby': (0, 0.1)}
    overload_map = {'heavy': (0.3, 0.6), 'moderate': (0.1, 0.3), 'light': (0, 0.1), 'standby': (0, 0)}
    
    data = []
    for i, (date, pattern) in enumerate(zip(dates, usage_patterns)):
        hours_range = hours_map[pattern]
        env_range = env_map[pattern]
        overload_range = overload_map[pattern]
        
        data.append({
            'tankId': tank_id,
            'date': date.strftime('%Y-%m-%d'),
            'hoursUsed': np.random.uniform(*hours_range),
            'envSeverity': np.random.uniform(*env_range),
            'overloadPct': np.random.uniform(*overload_range),
            'missionType': pattern
        })
    
    return pd.DataFrame(data)


def generate_maintenance_history(tank_id: str, component_id: str, component_name: str, days: int) -> List[Dict]:
    """Generate past maintenance events"""
    events = []
    num_events = np.random.randint(3, 8)
    
    event_types = ['scheduled', 'unscheduled', 'preventive']
    priorities = ['low', 'medium', 'high', 'critical']
    
    for i in range(num_events):
        days_ago = np.random.randint(10, days)
        event_date = datetime.now() - timedelta(days=days_ago)
        
        event_type = np.random.choice(event_types, p=[0.5, 0.3, 0.2])
        priority = np.random.choice(priorities, p=[0.2, 0.4, 0.3, 0.1])
        
        events.append({
            'tankId': tank_id,
            'componentId': component_id,
            'eventTime': event_date.strftime('%Y-%m-%d %H:%M:%S'),
            'type': event_type,
            'actions': f"{component_name} inspection and servicing",
            'downtimeHrs': np.random.uniform(2, 12),
            'partsUsed': json.dumps([f"{component_name} filter", f"{component_name} seal"]),
            'resultStatus': 'completed',
            'notes': f"Routine {event_type} maintenance performed"
        })
    
    return events


def generate_logs(tank_id: str, component_id: str, health: np.ndarray, days: int) -> List[Dict]:
    """Generate log entries with fault codes"""
    logs = []
    hours = days * 24
    
    # Generate logs when health is below thresholds or randomly
    for hour in range(hours):
        if health[hour] < 60:
            # More logs when health is poor
            if np.random.random() < 0.1:
                severity = 'ERROR' if health[hour] < 40 else 'WARNING'
                code = f"ERR_{np.random.randint(1000, 9999)}"
                
                timestamp = datetime.now() - timedelta(hours=hours - hour)
                logs.append({
                    'tankId': tank_id,
                    'timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                    'componentId': component_id,
                    'severity': severity,
                    'code': code,
                    'message': f"Component degradation detected: health={health[hour]:.1f}%"
                })
    
    # Add some INFO logs
    for _ in range(np.random.randint(5, 15)):
        hour = np.random.randint(0, hours)
        timestamp = datetime.now() - timedelta(hours=hours - hour)
        logs.append({
            'tankId': tank_id,
            'timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'componentId': component_id,
            'severity': 'INFO',
            'code': 'INFO_0000',
            'message': "Routine system check completed"
        })
    
    return sorted(logs, key=lambda x: x['timestamp'])


def generate_tank_data(tank_id: str, days: int, output_dir: str):
    """Generate all data files for a single tank"""
    print(f"\nGenerating data for {tank_id}...")
    
    # Get degradation multiplier for this tank
    degradation_multiplier = TANK_DEGRADATION_MULTIPLIERS.get(tank_id, 1.0)
    
    if degradation_multiplier > 1.5:
        print(f"  ⚠️  HIGH WEAR PROFILE (degradation: {degradation_multiplier}x)")
    elif degradation_multiplier > 1.0:
        print(f"  ⚠️  MODERATE WEAR PROFILE (degradation: {degradation_multiplier}x)")
    else:
        print(f"  ✓  NORMAL CONDITION PROFILE")
    
    # Create output directory
    tank_dir = os.path.join(output_dir, tank_id)
    os.makedirs(tank_dir, exist_ok=True)
    
    # Storage for aggregated data
    all_maintenance = []
    all_risk = []
    all_priority = []
    all_telemetry = []
    all_logs = []
    
    # Generate usage profile
    usage_df = generate_usage_profile(tank_id, days)
    usage_df.to_csv(os.path.join(tank_dir, 'usage.csv'), index=False)
    print(f"  ✓ Generated usage.csv ({len(usage_df)} days)")
    
    # Generate data for each component
    for comp_name, config in COMPONENT_CONFIG.items():
        component_id = f"{config['id_prefix']}-001"
        print(f"  Processing {comp_name} ({component_id})...")
        
        # Generate health degradation trajectory with tank-specific multiplier
        health_trajectory = generate_degradation_trajectory(
            days,
            config['weibull_eta'],
            config['weibull_k'],
            degradation_multiplier=degradation_multiplier
        )
        
        # Generate sensor time series
        hours = days * 24
        timestamps = pd.date_range(start='2024-01-01', periods=hours, freq='H')
        
        for sensor_name, sensor_range in config['sensor_ranges'].items():
            # Determine if sensor should increase or decrease with degradation
            inverse_sensors = ['temp', 'vib_rms', 'vib_kurtosis', 'leak_rate', 'packet_loss', 'error_codes', 'sensor_drift']
            is_inverse = any(inv in sensor_name for inv in inverse_sensors)
            
            if 'error_codes' in sensor_name:
                sensor_values = generate_error_codes(health_trajectory, comp_name)
            else:
                sensor_values = correlate_sensor_to_health(
                    health_trajectory,
                    sensor_range,
                    inverse=is_inverse
                )
            
            # Create telemetry records
            for ts, value in zip(timestamps, sensor_values):
                all_telemetry.append({
                    'tankId': tank_id,
                    'componentId': component_id,
                    'timestamp': ts.strftime('%Y-%m-%d %H:%M:%S'),
                    'feature': sensor_name,
                    'value': round(value, 3)
                })
        
        # Generate maintenance history
        maintenance_events = generate_maintenance_history(tank_id, component_id, comp_name, days)
        all_maintenance.extend(maintenance_events)
        
        # Generate risk profile
        all_risk.append({
            'componentId': component_id,
            'componentName': comp_name,
            'riskClass': config['risk_class'],
            'missionCriticality': config['mission_criticality'],
            'weibull_k': config['weibull_k'],
            'weibull_eta_hours': config['weibull_eta']
        })
        
        # Generate priority policy
        all_priority.append({
            'componentId': component_id,
            'componentName': comp_name,
            'basePriority': config['base_priority'],
            'slaDays': config['sla_days'],
            'deferCapDays': config['defer_cap_days']
        })
        
        # Generate logs
        logs = generate_logs(tank_id, component_id, health_trajectory, days)
        all_logs.extend(logs)
    
    # Save all aggregated files
    pd.DataFrame(all_maintenance).to_csv(os.path.join(tank_dir, 'maintenance.csv'), index=False)
    print(f"  ✓ Generated maintenance.csv ({len(all_maintenance)} events)")
    
    pd.DataFrame(all_risk).to_csv(os.path.join(tank_dir, 'risk.csv'), index=False)
    print(f"  ✓ Generated risk.csv ({len(all_risk)} components)")
    
    pd.DataFrame(all_priority).to_csv(os.path.join(tank_dir, 'priority.csv'), index=False)
    print(f"  ✓ Generated priority.csv ({len(all_priority)} components)")
    
    # Save telemetry (can be large)
    telemetry_df = pd.DataFrame(all_telemetry)
    telemetry_df.to_csv(os.path.join(tank_dir, 'sensors.csv'), index=False)
    print(f"  ✓ Generated sensors.csv ({len(telemetry_df)} readings)")
    
    pd.DataFrame(all_logs).to_csv(os.path.join(tank_dir, 'logs.csv'), index=False)
    print(f"  ✓ Generated logs.csv ({len(all_logs)} entries)")
    
    print(f"  ✓ Completed {tank_id}")


def main():
    parser = argparse.ArgumentParser(description='Generate synthetic tank maintenance data')
    parser.add_argument('--tanks', type=int, default=3, help='Number of tanks (default: 3)')
    parser.add_argument('--days', type=int, default=365, help='Days of data to generate (default: 365)')
    parser.add_argument('--output', type=str, default='synthetic_data', help='Output directory (default: synthetic_data)')
    
    args = parser.parse_args()
    
    # Use predefined tank IDs
    tank_ids = TANK_IDS[:args.tanks]
    
    print(f"=== Synthetic Data Generator ===")
    print(f"Tanks: {args.tanks} ({', '.join(tank_ids)})")
    print(f"Days: {args.days}")
    print(f"Output: {args.output}")
    print(f"Components: {len(COMPONENT_CONFIG)}")
    
    # Create output directory
    os.makedirs(args.output, exist_ok=True)
    
    # Generate data for each tank
    for tank_id in tank_ids:
        generate_tank_data(tank_id, args.days, args.output)
    
    print(f"\n✓ Data generation complete!")
    print(f"  Total files: {args.tanks * 6} (6 files × {args.tanks} tanks)")
    print(f"  Location: {os.path.abspath(args.output)}")


if __name__ == '__main__':
    main()

