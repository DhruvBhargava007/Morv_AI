#!/usr/bin/env python3
"""
Tank Database Query Examples
Demonstrates common queries and data retrieval patterns for the tank database
"""

import sqlite3

def connect_db():
    """Connect to the tank database"""
    return sqlite3.connect('tank_database.db')

def print_query_results(cursor, title):
    """Helper function to print query results nicely"""
    print(f"\n{'='*80}")
    print(f"{title}")
    print(f"{'='*80}")
    rows = cursor.fetchall()
    if not rows:
        print("No results found.")
        return
    
    # Get column names
    columns = [description[0] for description in cursor.description]
    
    # Print column headers
    header = " | ".join([f"{col:20}" for col in columns])
    print(header)
    print("-" * len(header))
    
    # Print rows
    for row in rows:
        row_str = " | ".join([f"{str(val):20}" for val in row])
        print(row_str)
    print(f"\nTotal rows: {len(rows)}")

def example_1_list_all_tanks():
    """Example 1: List all tanks with basic information"""
    conn = connect_db()
    cursor = conn.cursor()
    
    query = """
    SELECT name, variant, country, weight_combat_kg, crew_size, service_year
    FROM tanks
    ORDER BY country, name
    """
    cursor.execute(query)
    print_query_results(cursor, "EXAMPLE 1: All Tanks - Basic Information")
    conn.close()

def example_2_tank_complete_specs():
    """Example 2: Get complete specifications for a specific tank"""
    conn = connect_db()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        t.name, t.variant, t.country,
        t.weight_combat_kg, t.length_m, t.width_m, t.height_m,
        p.max_speed_road_kmh, p.max_speed_offroad_kmh, p.range_road_km,
        e.engine_type, e.engine_model, e.max_power_hp,
        wm.gun_caliber_mm, wm.gun_model, wm.rate_of_fire_rounds_per_min
    FROM tanks t
    LEFT JOIN performance p ON t.tank_id = p.tank_id
    LEFT JOIN engines e ON t.tank_id = e.tank_id
    LEFT JOIN weapons_main wm ON t.tank_id = wm.tank_id
    WHERE t.name = 'M1 Abrams' AND t.variant = 'M1A2 SEPv3'
    """
    cursor.execute(query)
    print_query_results(cursor, "EXAMPLE 2: M1A2 Abrams SEPv3 - Complete Specifications")
    conn.close()

def example_3_compare_engines():
    """Example 3: Compare engines across all tanks"""
    conn = connect_db()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        t.name, t.variant,
        e.engine_type, e.engine_model, e.max_power_hp, e.max_torque_nm,
        e.fuel_type, e.multi_fuel_capable, e.turbocharger
    FROM tanks t
    JOIN engines e ON t.tank_id = e.tank_id
    ORDER BY e.max_power_hp DESC
    """
    cursor.execute(query)
    print_query_results(cursor, "EXAMPLE 3: Engine Comparison Across All Tanks")
    conn.close()

def example_4_weapons_comparison():
    """Example 4: Compare main weapons"""
    conn = connect_db()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        t.name, t.variant,
        wm.gun_caliber_mm, wm.gun_type, wm.gun_model,
        wm.max_effective_range_m, wm.rate_of_fire_rounds_per_min,
        wm.autoloader, ammo.total_ammunition_capacity
    FROM tanks t
    JOIN weapons_main wm ON t.tank_id = wm.tank_id
    JOIN ammunition ammo ON t.tank_id = ammo.tank_id
    ORDER BY wm.gun_caliber_mm DESC
    """
    cursor.execute(query)
    print_query_results(cursor, "EXAMPLE 4: Main Weapon Comparison")
    conn.close()

def example_5_armor_comparison():
    """Example 5: Compare armor protection"""
    conn = connect_db()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        t.name, t.variant,
        a.hull_front_equivalent_rha_mm,
        a.turret_front_equivalent_rha_mm,
        a.reactive_armor, a.reactive_armor_type,
        a.composite_armor, a.hard_kill_systems
    FROM tanks t
    JOIN armor a ON t.tank_id = a.tank_id
    ORDER BY a.turret_front_equivalent_rha_mm DESC
    """
    cursor.execute(query)
    print_query_results(cursor, "EXAMPLE 5: Armor Protection Comparison")
    conn.close()

def example_6_secondary_weapons():
    """Example 6: List all secondary weapons for each tank"""
    conn = connect_db()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        t.name, t.variant,
        ws.weapon_type, ws.caliber_mm, ws.model,
        ws.mount_location, ws.rate_of_fire_rounds_per_min
    FROM tanks t
    JOIN weapons_secondary ws ON t.tank_id = ws.tank_id
    ORDER BY t.name, ws.caliber_mm DESC
    """
    cursor.execute(query)
    print_query_results(cursor, "EXAMPLE 6: Secondary Weapons by Tank")
    conn.close()

def example_7_fire_control_systems():
    """Example 7: Compare fire control systems"""
    conn = connect_db()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        t.name, t.variant,
        fcs.ballistic_computer_type, fcs.laser_rangefinder_range_m,
        fcs.commander_independent_viewer, fcs.hunter_killer_capable,
        fcs.target_tracking, fcs.first_round_hit_probability
    FROM tanks t
    JOIN fire_control fcs ON t.tank_id = fcs.tank_id
    ORDER BY fcs.first_round_hit_probability DESC
    """
    cursor.execute(query)
    print_query_results(cursor, "EXAMPLE 7: Fire Control System Comparison")
    conn.close()

def example_8_performance_ranking():
    """Example 8: Rank tanks by performance metrics"""
    conn = connect_db()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        t.name, t.variant,
        p.max_speed_road_kmh,
        p.power_to_weight_ratio,
        p.range_road_km,
        p.acceleration_0_to_32kmh_sec
    FROM tanks t
    JOIN performance p ON t.tank_id = p.tank_id
    ORDER BY p.max_speed_road_kmh DESC
    """
    cursor.execute(query)
    print_query_results(cursor, "EXAMPLE 8: Performance Ranking by Speed")
    conn.close()

def example_9_maintenance_schedules():
    """Example 9: Compare maintenance requirements"""
    conn = connect_db()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        t.name, t.variant,
        m.engine_oil_change_hours,
        m.transmission_service_hours,
        m.major_overhaul_hours,
        m.barrel_life_rounds,
        m.technical_manual_reference
    FROM tanks t
    JOIN maintenance m ON t.tank_id = m.tank_id
    ORDER BY m.engine_oil_change_hours
    """
    cursor.execute(query)
    print_query_results(cursor, "EXAMPLE 9: Maintenance Schedule Comparison")
    conn.close()

def example_10_electrical_systems():
    """Example 10: Compare electrical power systems"""
    conn = connect_db()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        t.name, t.variant,
        e.voltage_system_v, e.battery_count,
        e.alternator_output_kw, e.auxiliary_power_unit,
        e.apu_output_kw, e.total_power_consumption_kw
    FROM tanks t
    JOIN electrical e ON t.tank_id = e.tank_id
    ORDER BY e.total_power_consumption_kw DESC
    """
    cursor.execute(query)
    print_query_results(cursor, "EXAMPLE 10: Electrical Systems Comparison")
    conn.close()

def example_11_suspension_details():
    """Example 11: Compare suspension and running gear"""
    conn = connect_db()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        t.name, t.variant,
        s.suspension_type, s.road_wheels_per_side,
        s.track_type, s.track_width_mm,
        s.shock_absorbers
    FROM tanks t
    JOIN suspension s ON t.tank_id = s.tank_id
    ORDER BY t.name
    """
    cursor.execute(query)
    print_query_results(cursor, "EXAMPLE 11: Suspension System Comparison")
    conn.close()

def example_12_ammunition_capacity():
    """Example 12: Compare ammunition storage and types"""
    conn = connect_db()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        t.name, t.variant,
        a.total_ammunition_capacity,
        a.main_gun_ready_rounds, a.main_gun_stored_rounds,
        a.apfsds_available, a.heat_available, a.guided_rounds_available,
        a.autoloader_rounds_per_min, a.manual_loader_rounds_per_min
    FROM tanks t
    JOIN ammunition a ON t.tank_id = a.tank_id
    ORDER BY a.total_ammunition_capacity DESC
    """
    cursor.execute(query)
    print_query_results(cursor, "EXAMPLE 12: Ammunition Capacity and Types")
    conn.close()

def example_13_country_statistics():
    """Example 13: Statistics by country"""
    conn = connect_db()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        country,
        COUNT(*) as tank_count,
        AVG(weight_combat_kg) as avg_weight_kg,
        AVG(crew_size) as avg_crew_size
    FROM tanks
    GROUP BY country
    ORDER BY country
    """
    cursor.execute(query)
    print_query_results(cursor, "EXAMPLE 13: Statistics by Country")
    conn.close()

def example_14_comprehensive_tank_view():
    """Example 14: Comprehensive view of all tanks with all systems, one by one"""
    conn = connect_db()
    cursor = conn.cursor()
    
    # Get all tanks
    cursor.execute("SELECT tank_id, name, variant FROM tanks ORDER BY country, name")
    all_tanks = cursor.fetchall()
    
    if not all_tanks:
        print("No tanks found in database")
        conn.close()
        return
    
    for tank_id, name, variant in all_tanks:
        print(f"\n{'='*80}")
        print(f"COMPREHENSIVE SPECIFICATIONS: {name} {variant}")
        print(f"{'='*80}")
        
        # Basic info
        cursor.execute("SELECT * FROM tanks WHERE tank_id = ?", (tank_id,))
        print("\n--- BASIC INFORMATION ---")
        columns = [desc[0] for desc in cursor.description]
        row = cursor.fetchone()
        for col, val in zip(columns, row):
            if val:
                print(f"{col:30}: {val}")
        
        # Performance
        cursor.execute("SELECT * FROM performance WHERE tank_id = ?", (tank_id,))
        print("\n--- PERFORMANCE ---")
        columns = [desc[0] for desc in cursor.description]
        row = cursor.fetchone()
        if row:
            for col, val in zip(columns, row):
                if val and col != 'performance_id' and col != 'tank_id':
                    print(f"{col:30}: {val}")
        
        # Engine
        cursor.execute("SELECT * FROM engines WHERE tank_id = ?", (tank_id,))
        print("\n--- ENGINE ---")
        columns = [desc[0] for desc in cursor.description]
        row = cursor.fetchone()
        if row:
            for col, val in zip(columns, row):
                if val and col != 'engine_id' and col != 'tank_id':
                    print(f"{col:30}: {val}")
        
        # Transmission
        cursor.execute("SELECT * FROM transmissions WHERE tank_id = ?", (tank_id,))
        print("\n--- TRANSMISSION ---")
        columns = [desc[0] for desc in cursor.description]
        row = cursor.fetchone()
        if row:
            for col, val in zip(columns, row):
                if val and col != 'transmission_id' and col != 'tank_id':
                    print(f"{col:30}: {val}")
        
        # Suspension
        cursor.execute("SELECT * FROM suspension WHERE tank_id = ?", (tank_id,))
        print("\n--- SUSPENSION & RUNNING GEAR ---")
        columns = [desc[0] for desc in cursor.description]
        row = cursor.fetchone()
        if row:
            for col, val in zip(columns, row):
                if val and col != 'suspension_id' and col != 'tank_id':
                    print(f"{col:30}: {val}")
        
        # Main Weapon
        cursor.execute("SELECT * FROM weapons_main WHERE tank_id = ?", (tank_id,))
        print("\n--- MAIN WEAPON ---")
        columns = [desc[0] for desc in cursor.description]
        row = cursor.fetchone()
        if row:
            for col, val in zip(columns, row):
                if val and col != 'weapon_id' and col != 'tank_id':
                    print(f"{col:30}: {val}")
        
        # Secondary Weapons
        cursor.execute("SELECT * FROM weapons_secondary WHERE tank_id = ?", (tank_id,))
        print("\n--- SECONDARY WEAPONS ---")
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        if rows:
            for idx, row in enumerate(rows, 1):
                print(f"\n  Secondary Weapon #{idx}:")
                for col, val in zip(columns, row):
                    if val and col != 'secondary_id' and col != 'tank_id':
                        print(f"    {col:28}: {val}")
        else:
            print("  None")
        
        # Fire Control
        cursor.execute("SELECT * FROM fire_control WHERE tank_id = ?", (tank_id,))
        print("\n--- FIRE CONTROL SYSTEM ---")
        columns = [desc[0] for desc in cursor.description]
        row = cursor.fetchone()
        if row:
            for col, val in zip(columns, row):
                if val and col != 'fcs_id' and col != 'tank_id':
                    print(f"{col:30}: {val}")
        
        # Armor
        cursor.execute("SELECT * FROM armor WHERE tank_id = ?", (tank_id,))
        print("\n--- ARMOR & PROTECTION ---")
        columns = [desc[0] for desc in cursor.description]
        row = cursor.fetchone()
        if row:
            for col, val in zip(columns, row):
                if val and col != 'armor_id' and col != 'tank_id':
                    print(f"{col:30}: {val}")
        
        # Electrical
        cursor.execute("SELECT * FROM electrical WHERE tank_id = ?", (tank_id,))
        print("\n--- ELECTRICAL SYSTEMS ---")
        columns = [desc[0] for desc in cursor.description]
        row = cursor.fetchone()
        if row:
            for col, val in zip(columns, row):
                if val and col != 'electrical_id' and col != 'tank_id':
                    print(f"{col:30}: {val}")
        
        # Communications
        cursor.execute("SELECT * FROM communications WHERE tank_id = ?", (tank_id,))
        print("\n--- COMMUNICATIONS & NAVIGATION ---")
        columns = [desc[0] for desc in cursor.description]
        row = cursor.fetchone()
        if row:
            for col, val in zip(columns, row):
                if val and col != 'comm_id' and col != 'tank_id':
                    print(f"{col:30}: {val}")
        
        # Hydraulics
        cursor.execute("SELECT * FROM hydraulics WHERE tank_id = ?", (tank_id,))
        print("\n--- HYDRAULIC & PNEUMATIC SYSTEMS ---")
        columns = [desc[0] for desc in cursor.description]
        row = cursor.fetchone()
        if row:
            for col, val in zip(columns, row):
                if val and col != 'hydraulic_id' and col != 'tank_id':
                    print(f"{col:30}: {val}")
        
        # Crew Systems
        cursor.execute("SELECT * FROM crew_systems WHERE tank_id = ?", (tank_id,))
        print("\n--- CREW SYSTEMS ---")
        columns = [desc[0] for desc in cursor.description]
        row = cursor.fetchone()
        if row:
            for col, val in zip(columns, row):
                if val and col != 'crew_system_id' and col != 'tank_id':
                    # Format boolean values better
                    if isinstance(val, int) and col.endswith('_system') or col in ['crew_seats_armored', 'crew_restraints']:
                        val_str = 'Yes' if val == 1 else 'No'
                        print(f"{col:30}: {val_str}")
                    else:
                        print(f"{col:30}: {val}")
        
        # Ammunition
        cursor.execute("SELECT * FROM ammunition WHERE tank_id = ?", (tank_id,))
        print("\n--- AMMUNITION ---")
        columns = [desc[0] for desc in cursor.description]
        row = cursor.fetchone()
        if row:
            for col, val in zip(columns, row):
                if val and col != 'ammo_id' and col != 'tank_id':
                    # Format boolean values better
                    if isinstance(val, int) and col.endswith('_available'):
                        val_str = 'Yes' if val == 1 else 'No'
                        print(f"{col:30}: {val_str}")
                    elif isinstance(val, int) and col == 'blast_doors':
                        val_str = 'Yes' if val == 1 else 'No'
                        print(f"{col:30}: {val_str}")
                    else:
                        print(f"{col:30}: {val}")
        
        # Maintenance
        cursor.execute("SELECT * FROM maintenance WHERE tank_id = ?", (tank_id,))
        print("\n--- MAINTENANCE REQUIREMENTS ---")
        columns = [desc[0] for desc in cursor.description]
        row = cursor.fetchone()
        if row:
            for col, val in zip(columns, row):
                if val and col != 'maintenance_id' and col != 'tank_id':
                    # Format boolean values better
                    if isinstance(val, int) and col.startswith('preventive_maintenance'):
                        val_str = 'Yes' if val == 1 else 'No'
                        print(f"{col:30}: {val_str}")
                    else:
                        print(f"{col:30}: {val}")
        
        print("\n" + "-"*80 + "\n")
    
    conn.close()

def example_15_find_tanks_by_criteria():
    """Example 15: Find tanks matching specific criteria"""
    conn = connect_db()
    cursor = conn.cursor()
    
    # Find tanks with:
    # - 120mm or larger gun
    # - Diesel engine
    # - Autoloader
    # - Maximum speed > 60 km/h
    
    query = """
    SELECT DISTINCT
        t.name, t.variant, t.country,
        wm.gun_caliber_mm,
        e.engine_type,
        wm.autoloader,
        p.max_speed_road_kmh
    FROM tanks t
    JOIN weapons_main wm ON t.tank_id = wm.tank_id
    JOIN engines e ON t.tank_id = e.tank_id
    JOIN performance p ON t.tank_id = p.tank_id
    WHERE wm.gun_caliber_mm >= 120
      AND e.engine_type = 'Diesel'
      AND wm.autoloader = 0
      AND p.max_speed_road_kmh > 60
    ORDER BY t.country, t.name
    """
    cursor.execute(query)
    print_query_results(cursor, "EXAMPLE 15: Tanks with 120mm+ gun, Diesel engine, Manual loader, Speed > 60 km/h")
    conn.close()

def run_all_examples():
    """Run all query examples"""
    examples = [
        example_1_list_all_tanks,
        example_2_tank_complete_specs,
        example_3_compare_engines,
        example_4_weapons_comparison,
        example_5_armor_comparison,
        example_6_secondary_weapons,
        example_7_fire_control_systems,
        example_8_performance_ranking,
        example_9_maintenance_schedules,
        example_10_electrical_systems,
        example_11_suspension_details,
        example_12_ammunition_capacity,
        example_13_country_statistics,
        example_14_comprehensive_tank_view,
        example_15_find_tanks_by_criteria,
    ]
    
    for example_func in examples:
        try:
            example_func()
        except Exception as e:
            print(f"\nError in {example_func.__name__}: {e}")

if __name__ == "__main__":
    print("Tank Database Query Examples")
    print("=" * 80)
    print("\nRunning all examples...\n")
    
    run_all_examples()
    
    print("\n" + "=" * 80)
    print("All examples completed!")
    print("=" * 80)

