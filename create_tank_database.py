#!/usr/bin/env python3
"""
Tank Database Creation Script
Creates a comprehensive SQLite database for military tank specifications
"""

import sqlite3
import os

def create_database():
    """Create the tank database with all tables and populate with data"""
    
    # Remove existing database if it exists
    db_path = 'tank_database.db'
    if os.path.exists(db_path):
        os.remove(db_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON")
    
    # Create tables
    print("Creating database schema...")
    create_schema(cursor)
    
    # Populate data
    print("Populating with tank specifications...")
    populate_tanks(cursor)
    
    # Commit and close
    conn.commit()
    conn.close()
    print(f"Database created successfully: {db_path}")

def create_schema(cursor):
    """Create all database tables with normalized structure"""
    
    # 1. Main Tanks table
    cursor.execute("""
    CREATE TABLE tanks (
        tank_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        variant TEXT,
        country TEXT NOT NULL,
        manufacturer TEXT,
        service_year INTEGER,
        production_years TEXT,
        weight_combat_kg INTEGER,
        weight_empty_kg INTEGER,
        length_m REAL,
        width_m REAL,
        height_m REAL,
        ground_clearance_m REAL,
        crew_size INTEGER,
        unit_cost_usd INTEGER,
        total_produced INTEGER,
        operational_status TEXT,
        notes TEXT,
        UNIQUE(name, variant)
    )
    """)
    
    # 2. Performance Specifications
    cursor.execute("""
    CREATE TABLE performance (
        performance_id INTEGER PRIMARY KEY AUTOINCREMENT,
        tank_id INTEGER NOT NULL,
        max_speed_road_kmh REAL,
        max_speed_offroad_kmh REAL,
        range_road_km INTEGER,
        range_offroad_km INTEGER,
        fuel_capacity_liters REAL,
        fuel_consumption_liters_per_100km REAL,
        vertical_obstacle_m REAL,
        trench_width_m REAL,
        fording_depth_m REAL,
        gradient_percent REAL,
        power_to_weight_ratio REAL,
        acceleration_0_to_32kmh_sec REAL,
        FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE CASCADE
    )
    """)
    
    # 3. Engines
    cursor.execute("""
    CREATE TABLE engines (
        engine_id INTEGER PRIMARY KEY AUTOINCREMENT,
        tank_id INTEGER NOT NULL,
        engine_type TEXT NOT NULL,
        engine_model TEXT,
        manufacturer TEXT,
        configuration TEXT,
        cylinders INTEGER,
        displacement_liters REAL,
        max_power_hp INTEGER,
        max_power_rpm INTEGER,
        max_torque_nm INTEGER,
        max_torque_rpm INTEGER,
        fuel_type TEXT,
        multi_fuel_capable INTEGER DEFAULT 0,
        turbocharger INTEGER DEFAULT 0,
        supercharger INTEGER DEFAULT 0,
        compression_ratio REAL,
        cooling_system_type TEXT,
        cooling_capacity_liters REAL,
        air_filter_type TEXT,
        FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE CASCADE
    )
    """)
    
    # 4. Transmissions
    cursor.execute("""
    CREATE TABLE transmissions (
        transmission_id INTEGER PRIMARY KEY AUTOINCREMENT,
        tank_id INTEGER NOT NULL,
        transmission_type TEXT NOT NULL,
        manufacturer TEXT,
        model TEXT,
        forward_gears INTEGER,
        reverse_gears INTEGER,
        torque_converter INTEGER,
        final_drive_ratio REAL,
        steering_type TEXT,
        braking_system TEXT,
        parking_brake_type TEXT,
        FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE CASCADE
    )
    """)
    
    # 5. Suspension and Running Gear
    cursor.execute("""
    CREATE TABLE suspension (
        suspension_id INTEGER PRIMARY KEY AUTOINCREMENT,
        tank_id INTEGER NOT NULL,
        suspension_type TEXT NOT NULL,
        road_wheels_per_side INTEGER,
        track_type TEXT,
        track_width_mm INTEGER,
        track_length_mm INTEGER,
        track_links_per_side INTEGER,
        track_pitch_mm INTEGER,
        idler_wheel_type TEXT,
        drive_sprocket_teeth INTEGER,
        return_rollers_per_side INTEGER,
        shock_absorbers INTEGER,
        torsion_bar_material TEXT,
        FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE CASCADE
    )
    """)
    
    # 6. Main Weapons
    cursor.execute("""
    CREATE TABLE weapons_main (
        weapon_id INTEGER PRIMARY KEY AUTOINCREMENT,
        tank_id INTEGER NOT NULL,
        gun_caliber_mm INTEGER NOT NULL,
        gun_type TEXT,
        gun_model TEXT,
        manufacturer TEXT,
        barrel_length_m REAL,
        rifling_twist REAL,
        elevation_degrees REAL,
        depression_degrees REAL,
        turret_traverse_degrees_per_sec REAL,
        gun_elevation_rate_degrees_per_sec REAL,
        muzzle_velocity_ms REAL,
        max_effective_range_m INTEGER,
        rate_of_fire_rounds_per_min REAL,
        autoloader INTEGER DEFAULT 0,
        bore_evacuator INTEGER DEFAULT 1,
        thermal_sleeve INTEGER DEFAULT 0,
        FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE CASCADE
    )
    """)
    
    # 7. Secondary Weapons
    cursor.execute("""
    CREATE TABLE weapons_secondary (
        secondary_id INTEGER PRIMARY KEY AUTOINCREMENT,
        tank_id INTEGER NOT NULL,
        weapon_type TEXT NOT NULL,
        caliber_mm REAL,
        model TEXT,
        mount_location TEXT,
        elevation_degrees REAL,
        depression_degrees REAL,
        ammunition_type TEXT,
        rate_of_fire_rounds_per_min INTEGER,
        effective_range_m INTEGER,
        FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE CASCADE
    )
    """)
    
    # 8. Fire Control Systems
    cursor.execute("""
    CREATE TABLE fire_control (
        fcs_id INTEGER PRIMARY KEY AUTOINCREMENT,
        tank_id INTEGER NOT NULL,
        ballistic_computer_type TEXT,
        ballistic_computer_model TEXT,
        laser_rangefinder_type TEXT,
        laser_rangefinder_range_m INTEGER,
        crosswind_sensor INTEGER DEFAULT 0,
        stabilization_system TEXT,
        stabilization_axes TEXT,
        gunner_sight_type TEXT,
        gunner_sight_day_range_m INTEGER,
        gunner_sight_thermal_range_m INTEGER,
        commander_sight_type TEXT,
        commander_independent_viewer INTEGER DEFAULT 0,
        commander_thermal_range_m INTEGER,
        hunter_killer_capable INTEGER DEFAULT 0,
        target_tracking INTEGER DEFAULT 0,
        first_round_hit_probability REAL,
        FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE CASCADE
    )
    """)
    
    # 9. Armor and Protection
    cursor.execute("""
    CREATE TABLE armor (
        armor_id INTEGER PRIMARY KEY AUTOINCREMENT,
        tank_id INTEGER NOT NULL,
        hull_front_type TEXT,
        hull_front_thickness_mm REAL,
        hull_front_equivalent_rha_mm REAL,
        hull_side_type TEXT,
        hull_side_thickness_mm REAL,
        hull_side_equivalent_rha_mm REAL,
        hull_rear_type TEXT,
        hull_rear_thickness_mm REAL,
        hull_top_type TEXT,
        hull_top_thickness_mm REAL,
        turret_front_type TEXT,
        turret_front_thickness_mm REAL,
        turret_front_equivalent_rha_mm REAL,
        turret_side_type TEXT,
        turret_side_thickness_mm REAL,
        turret_rear_type TEXT,
        turret_roof_type TEXT,
        reactive_armor INTEGER DEFAULT 0,
        reactive_armor_type TEXT,
        composite_armor INTEGER DEFAULT 0,
        composite_armor_components TEXT,
        spall_liners INTEGER DEFAULT 0,
        soft_kill_systems TEXT,
        hard_kill_systems TEXT,
        FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE CASCADE
    )
    """)
    
    # 10. Electrical Systems
    cursor.execute("""
    CREATE TABLE electrical (
        electrical_id INTEGER PRIMARY KEY AUTOINCREMENT,
        tank_id INTEGER NOT NULL,
        voltage_system_v INTEGER,
        battery_count INTEGER,
        battery_type TEXT,
        battery_capacity_ah REAL,
        alternator_output_kw REAL,
        generator_output_kw REAL,
        auxiliary_power_unit INTEGER DEFAULT 0,
        apu_output_kw REAL,
        apu_fuel_type TEXT,
        total_power_consumption_kw REAL,
        FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE CASCADE
    )
    """)
    
    # 11. Communications
    cursor.execute("""
    CREATE TABLE communications (
        comm_id INTEGER PRIMARY KEY AUTOINCREMENT,
        tank_id INTEGER NOT NULL,
        radio_type_vhf TEXT,
        radio_model TEXT,
        radio_range_km INTEGER,
        intercom_system TEXT,
        encryption_system TEXT,
        gps_system INTEGER DEFAULT 0,
        inertial_navigation INTEGER DEFAULT 0,
        digital_map_system INTEGER DEFAULT 0,
        tactical_data_link TEXT,
        antenna_count INTEGER,
        FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE CASCADE
    )
    """)
    
    # 12. Hydraulic and Pneumatic Systems
    cursor.execute("""
    CREATE TABLE hydraulics (
        hydraulic_id INTEGER PRIMARY KEY AUTOINCREMENT,
        tank_id INTEGER NOT NULL,
        hydraulic_pressure_psi INTEGER,
        hydraulic_fluid_type TEXT,
        hydraulic_reservoir_capacity_liters REAL,
        turret_traverse_hydraulic INTEGER DEFAULT 0,
        gun_elevation_hydraulic INTEGER DEFAULT 0,
        pneumatic_system INTEGER DEFAULT 0,
        air_pressure_psi INTEGER,
        nbc_overpressure_system INTEGER DEFAULT 0,
        nbc_pressure_pa INTEGER,
        FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE CASCADE
    )
    """)
    
    # 13. Crew Systems
    cursor.execute("""
    CREATE TABLE crew_systems (
        crew_system_id INTEGER PRIMARY KEY AUTOINCREMENT,
        tank_id INTEGER NOT NULL,
        heating_system INTEGER DEFAULT 0,
        ventilation_system INTEGER DEFAULT 0,
        air_conditioning INTEGER DEFAULT 0,
        nbc_filter_system INTEGER DEFAULT 0,
        nbc_filter_type TEXT,
        fire_suppression_system INTEGER DEFAULT 0,
        fire_suppression_type TEXT,
        fire_suppression_zones INTEGER,
        crew_seats_armored INTEGER DEFAULT 0,
        crew_restraints INTEGER DEFAULT 0,
        emergency_escape_hatches INTEGER,
        FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE CASCADE
    )
    """)
    
    # 14. Ammunition
    cursor.execute("""
    CREATE TABLE ammunition (
        ammo_id INTEGER PRIMARY KEY AUTOINCREMENT,
        tank_id INTEGER NOT NULL,
        main_gun_ready_rounds INTEGER,
        main_gun_stored_rounds INTEGER,
        total_ammunition_capacity INTEGER,
        ammunition_types TEXT,
        apfsds_available INTEGER DEFAULT 0,
        heat_available INTEGER DEFAULT 0,
        he_available INTEGER DEFAULT 0,
        he_frag_available INTEGER DEFAULT 0,
        canister_available INTEGER DEFAULT 0,
        guided_rounds_available INTEGER DEFAULT 0,
        autoloader_rounds_per_min REAL,
        manual_loader_rounds_per_min REAL,
        storage_ready_rack INTEGER,
        storage_hull INTEGER,
        storage_turret INTEGER,
        blast_doors INTEGER DEFAULT 0,
        FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE CASCADE
    )
    """)
    
    # 15. Maintenance Requirements
    cursor.execute("""
    CREATE TABLE maintenance (
        maintenance_id INTEGER PRIMARY KEY AUTOINCREMENT,
        tank_id INTEGER NOT NULL,
        engine_oil_change_hours INTEGER,
        transmission_service_hours INTEGER,
        track_service_hours INTEGER,
        major_overhaul_hours INTEGER,
        engine_rebuild_hours INTEGER,
        transmission_rebuild_hours INTEGER,
        track_replacement_km INTEGER,
        barrel_life_rounds INTEGER,
        preventive_maintenance_weekly INTEGER DEFAULT 1,
        preventive_maintenance_monthly INTEGER DEFAULT 1,
        critical_spares_required TEXT,
        technical_manual_reference TEXT,
        FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE CASCADE
    )
    """)
    
    # Create indexes for common queries
    cursor.execute("CREATE INDEX idx_tanks_name ON tanks(name)")
    cursor.execute("CREATE INDEX idx_tanks_country ON tanks(country)")
    cursor.execute("CREATE INDEX idx_engines_type ON engines(engine_type)")
    cursor.execute("CREATE INDEX idx_weapons_caliber ON weapons_main(gun_caliber_mm)")
    cursor.execute("CREATE INDEX idx_performance_speed ON performance(max_speed_road_kmh)")

def populate_tanks(cursor):
    """Populate database with tank specifications"""
    
    # M1A2 Abrams SEPv3
    populate_m1a2_abrams(cursor)
    
    # Leopard 2A7
    populate_leopard_2a7(cursor)
    
    # T-90M
    populate_t90m(cursor)

def populate_m1a2_abrams(cursor):
    """Insert comprehensive M1A2 Abrams SEPv3 specifications"""
    
    # Insert main tank record
    cursor.execute("""
    INSERT INTO tanks (name, variant, country, manufacturer, service_year, production_years,
                      weight_combat_kg, weight_empty_kg, length_m, width_m, height_m,
                      ground_clearance_m, crew_size, unit_cost_usd, total_produced,
                      operational_status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        'M1 Abrams', 'M1A2 SEPv3', 'United States', 'General Dynamics Land Systems',
        2017, '2017-present',
        73600, 63500, 9.77, 3.66, 2.44,
        0.48, 4, 8700000, None,
        'Active', 'System Enhancement Package Version 3 with improved armor, electronics, and power management'
    ))
    tank_id = cursor.lastrowid
    
    # Performance
    cursor.execute("""
    INSERT INTO performance (tank_id, max_speed_road_kmh, max_speed_offroad_kmh, range_road_km,
                            range_offroad_km, fuel_capacity_liters, fuel_consumption_liters_per_100km,
                            vertical_obstacle_m, trench_width_m, fording_depth_m, gradient_percent,
                            power_to_weight_ratio, acceleration_0_to_32kmh_sec)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 67.6, 48.3, 426,
        130, 1907.6, 448,
        1.07, 2.74, 1.22, 60,
        23.15, 7.2
    ))
    
    # Engine
    cursor.execute("""
    INSERT INTO engines (tank_id, engine_type, engine_model, manufacturer, configuration,
                        cylinders, displacement_liters, max_power_hp, max_power_rpm,
                        max_torque_nm, max_torque_rpm, fuel_type, multi_fuel_capable,
                        turbocharger, supercharger, compression_ratio, cooling_system_type,
                        cooling_capacity_liters, air_filter_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 'Gas Turbine', 'AGT-1500', 'Textron Lycoming', '3-shaft gas turbine',
        None, None, 1500, 3000,
        3950, 3000, 'Multi-fuel (JP-8, diesel, gasoline)', 1,
        1, 0, None, 'Air-to-air intercooler',
        113.6, 'Multi-stage centrifugal'
    ))
    
    # Transmission
    cursor.execute("""
    INSERT INTO transmissions (tank_id, transmission_type, manufacturer, model,
                              forward_gears, reverse_gears, torque_converter,
                              final_drive_ratio, steering_type, braking_system,
                              parking_brake_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 'Automatic', 'Allison', 'X-1100-3B',
        4, 2, 1,
        4.71, 'Pivot steer', 'Hydraulic disc brakes',
        'Hydraulic'
    ))
    
    # Suspension
    cursor.execute("""
    INSERT INTO suspension (tank_id, suspension_type, road_wheels_per_side, track_type,
                           track_width_mm, track_length_mm, track_links_per_side,
                           track_pitch_mm, idler_wheel_type, drive_sprocket_teeth,
                           return_rollers_per_side, shock_absorbers, torsion_bar_material)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 'Torsion bar', 7, 'Rubber-padded steel',
        635, 5800, 156,
        152, 'Adjustable', 11,
        2, 6, 'Alloy steel'
    ))
    
    # Main Weapon
    cursor.execute("""
    INSERT INTO weapons_main (tank_id, gun_caliber_mm, gun_type, gun_model, manufacturer,
                             barrel_length_m, rifling_twist, elevation_degrees, depression_degrees,
                             turret_traverse_degrees_per_sec, gun_elevation_rate_degrees_per_sec,
                             muzzle_velocity_ms, max_effective_range_m, rate_of_fire_rounds_per_min,
                             autoloader, bore_evacuator, thermal_sleeve)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 120, 'Smoothbore', 'M256', 'Watervliet Arsenal',
        6.3, None, 20, -10,
        60, 30,
        1750, 4000, 6,
        0, 1, 1
    ))
    
    # Secondary Weapons
    secondary_weapons = [
        ('Coaxial Machine Gun', 7.62, 'M240C', 'Coaxial', 65, -10, '7.62x51mm NATO', 750, 1100),
        ("Commander's Machine Gun", 12.7, 'M2HB', "Commander's cupola", 80, -10, '.50 BMG', 550, 2000),
        ("Loader's Machine Gun", 7.62, 'M240', "Loader's hatch", 80, -10, '7.62x51mm NATO', 750, 1100)
    ]
    for weapon in secondary_weapons:
        cursor.execute("""
        INSERT INTO weapons_secondary (tank_id, weapon_type, caliber_mm, model, mount_location,
                                      elevation_degrees, depression_degrees, ammunition_type,
                                      rate_of_fire_rounds_per_min, effective_range_m)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (tank_id, *weapon))
    
    # Fire Control System
    cursor.execute("""
    INSERT INTO fire_control (tank_id, ballistic_computer_type, ballistic_computer_model,
                             laser_rangefinder_type, laser_rangefinder_range_m, crosswind_sensor,
                             stabilization_system, stabilization_axes, gunner_sight_type,
                             gunner_sight_day_range_m, gunner_sight_thermal_range_m,
                             commander_sight_type, commander_independent_viewer,
                             commander_thermal_range_m, hunter_killer_capable, target_tracking,
                             first_round_hit_probability)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 'Digital', 'ISU (Integrated Sight Unit)', 'Nd:YAG',
        8000, 1,
        'Electric/hydraulic', '2-axis (elevation, traverse)', 'Gunner Primary Sight (GPS)',
        5000, 4000,
        'Commander Independent Thermal Viewer (CITV)', 1,
        4000, 1, 1,
        0.95
    ))
    
    # Armor
    cursor.execute("""
    INSERT INTO armor (tank_id, hull_front_type, hull_front_thickness_mm, hull_front_equivalent_rha_mm,
                      hull_side_type, hull_side_thickness_mm, hull_side_equivalent_rha_mm,
                      hull_rear_type, hull_rear_thickness_mm, hull_top_type, hull_top_thickness_mm,
                      turret_front_type, turret_front_thickness_mm, turret_front_equivalent_rha_mm,
                      turret_side_type, turret_side_thickness_mm, turret_rear_type, turret_roof_type,
                      reactive_armor, reactive_armor_type, composite_armor, composite_armor_components,
                      spall_liners, soft_kill_systems, hard_kill_systems)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 'Composite with DU inserts', 120, 600,
        'Composite', 76, 300,
        'Rolled homogeneous', 50, 'Rolled homogeneous', 25,
        'Composite with DU inserts', 180, 1300,
        'Composite', 100, 'Rolled homogeneous', 'Rolled homogeneous',
        0, None, 1, 'Chobham armor, depleted uranium, steel, ceramic',
        1, 'MCD smoke grenade launchers', None
    ))
    
    # Electrical
    cursor.execute("""
    INSERT INTO electrical (tank_id, voltage_system_v, battery_count, battery_type,
                           battery_capacity_ah, alternator_output_kw, generator_output_kw,
                           auxiliary_power_unit, apu_output_kw, apu_fuel_type,
                           total_power_consumption_kw)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 24, 6, '12V lead-acid',
        950, 15, None,
        0, None, None,
        10.5
    ))
    
    # Communications
    cursor.execute("""
    INSERT INTO communications (tank_id, radio_type_vhf, radio_model, radio_range_km,
                               intercom_system, encryption_system, gps_system,
                               inertial_navigation, digital_map_system, tactical_data_link,
                               antenna_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 'VHF/FM', 'SINCGARS', 50,
        'AN/VIC-3', 'KG-175D TACLANE', 1,
        1, 1, 'FBCB2 (Force XXI Battle Command)',
        3
    ))
    
    # Hydraulics
    cursor.execute("""
    INSERT INTO hydraulics (tank_id, hydraulic_pressure_psi, hydraulic_fluid_type,
                           hydraulic_reservoir_capacity_liters, turret_traverse_hydraulic,
                           gun_elevation_hydraulic, pneumatic_system, air_pressure_psi,
                           nbc_overpressure_system, nbc_pressure_pa)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 3450, 'MIL-H-83282',
        95, 1,
        1, 1, 120,
        1, 343
    ))
    
    # Crew Systems
    cursor.execute("""
    INSERT INTO crew_systems (tank_id, heating_system, ventilation_system, air_conditioning,
                             nbc_filter_system, nbc_filter_type, fire_suppression_system,
                             fire_suppression_type, fire_suppression_zones, crew_seats_armored,
                             crew_restraints, emergency_escape_hatches)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 1, 1, 0,
        1, 'HEPA filter', 1,
        'Halon 1301', 3, 1,
        1, 4
    ))
    
    # Ammunition
    cursor.execute("""
    INSERT INTO ammunition (tank_id, main_gun_ready_rounds, main_gun_stored_rounds,
                           total_ammunition_capacity, ammunition_types, apfsds_available,
                           heat_available, he_available, he_frag_available, canister_available,
                           guided_rounds_available, autoloader_rounds_per_min,
                           manual_loader_rounds_per_min, storage_ready_rack, storage_hull,
                           storage_turret, blast_doors)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 18, 24,
        42, 'M829A4 APFSDS, M830A1 HEAT-MP-T, M1028 Canister, M908 HE-OR-T', 1,
        1, 0, 1, 1,
        1, None,
        6, 18, 22, 2,
        1
    ))
    
    # Maintenance
    cursor.execute("""
    INSERT INTO maintenance (tank_id, engine_oil_change_hours, transmission_service_hours,
                           track_service_hours, major_overhaul_hours, engine_rebuild_hours,
                           transmission_rebuild_hours, track_replacement_km, barrel_life_rounds,
                           preventive_maintenance_weekly, preventive_maintenance_monthly,
                           critical_spares_required, technical_manual_reference)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 200, 600,
        24, 2000, 3000,
        2000, 1300, 500,
        1, 1,
        'Track links (10%), filters (oil/fuel/air), batteries, hydraulic seals', 'TM 9-2350-264-10'
    ))
    
    print("  - M1A2 Abrams SEPv3 data inserted")

def populate_leopard_2a7(cursor):
    """Insert comprehensive Leopard 2A7 specifications"""
    
    # Insert main tank record
    cursor.execute("""
    INSERT INTO tanks (name, variant, country, manufacturer, service_year, production_years,
                      weight_combat_kg, weight_empty_kg, length_m, width_m, height_m,
                      ground_clearance_m, crew_size, unit_cost_usd, total_produced,
                      operational_status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        'Leopard 2', '2A7', 'Germany', 'Krauss-Maffei Wegmann',
        2014, '2014-present',
        67500, 59600, 9.97, 3.75, 3.03,
        0.54, 4, 15000000, None,
        'Active', 'Most advanced Leopard 2 variant with urban warfare kit, improved armor, and enhanced systems'
    ))
    tank_id = cursor.lastrowid
    
    # Performance
    cursor.execute("""
    INSERT INTO performance (tank_id, max_speed_road_kmh, max_speed_offroad_kmh, range_road_km,
                            range_offroad_km, fuel_capacity_liters, fuel_consumption_liters_per_100km,
                            vertical_obstacle_m, trench_width_m, fording_depth_m, gradient_percent,
                            power_to_weight_ratio, acceleration_0_to_32kmh_sec)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 72.0, 50.0, 500,
        150, 1200, 240,
        1.10, 3.00, 1.00, 60,
        26.67, 6.5
    ))
    
    # Engine
    cursor.execute("""
    INSERT INTO engines (tank_id, engine_type, engine_model, manufacturer, configuration,
                        cylinders, displacement_liters, max_power_hp, max_power_rpm,
                        max_torque_nm, max_torque_rpm, fuel_type, multi_fuel_capable,
                        turbocharger, supercharger, compression_ratio, cooling_system_type,
                        cooling_capacity_liters, air_filter_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 'Diesel', 'MTU MB 873 Ka-501', 'MTU Friedrichshafen', 'V12 90-degree',
        12, 47.6, 1500, 2600,
        4700, 1600, 'Diesel (multi-fuel capable)', 1,
        2, 0, 18.5, 'Liquid cooling with radiators',
        120, 'Two-stage centrifugal air filters'
    ))
    
    # Transmission
    cursor.execute("""
    INSERT INTO transmissions (tank_id, transmission_type, manufacturer, model,
                              forward_gears, reverse_gears, torque_converter,
                              final_drive_ratio, steering_type, braking_system,
                              parking_brake_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 'Automatic', 'Renk', 'HSWL 354',
        4, 2, 1,
        3.47, 'Pivot steer', 'Hydraulic disc brakes',
        'Hydraulic'
    ))
    
    # Suspension
    cursor.execute("""
    INSERT INTO suspension (tank_id, suspension_type, road_wheels_per_side, track_type,
                           track_width_mm, track_length_mm, track_links_per_side,
                           track_pitch_mm, idler_wheel_type, drive_sprocket_teeth,
                           return_rollers_per_side, shock_absorbers, torsion_bar_material)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 'Torsion bar', 7, 'Rubber-padded steel',
        635, 5900, 166,
        184, 'Adjustable', 13,
        4, 8, 'Alloy steel'
    ))
    
    # Main Weapon
    cursor.execute("""
    INSERT INTO weapons_main (tank_id, gun_caliber_mm, gun_type, gun_model, manufacturer,
                             barrel_length_m, rifling_twist, elevation_degrees, depression_degrees,
                             turret_traverse_degrees_per_sec, gun_elevation_rate_degrees_per_sec,
                             muzzle_velocity_ms, max_effective_range_m, rate_of_fire_rounds_per_min,
                             autoloader, bore_evacuator, thermal_sleeve)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 120, 'Smoothbore', 'Rh-120 L55', 'Rheinmetall',
        6.6, None, 20, -9,
        60, 30,
        1750, 4000, 10,
        0, 1, 1
    ))
    
    # Secondary Weapons
    secondary_weapons = [
        ('Coaxial Machine Gun', 7.62, 'MG3A1', 'Coaxial', 75, -9, '7.62x51mm NATO', 1200, 1200),
        ("Commander's Machine Gun", 7.62, 'MG3A1', "Commander's cupola", 75, -9, '7.62x51mm NATO', 1200, 1200),
        ("Loader's Machine Gun", 7.62, 'MG3A1', "Loader's hatch", 75, -9, '7.62x51mm NATO', 1200, 1200)
    ]
    for weapon in secondary_weapons:
        cursor.execute("""
        INSERT INTO weapons_secondary (tank_id, weapon_type, caliber_mm, model, mount_location,
                                      elevation_degrees, depression_degrees, ammunition_type,
                                      rate_of_fire_rounds_per_min, effective_range_m)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (tank_id, *weapon))
    
    # Fire Control System
    cursor.execute("""
    INSERT INTO fire_control (tank_id, ballistic_computer_type, ballistic_computer_model,
                             laser_rangefinder_type, laser_rangefinder_range_m, crosswind_sensor,
                             stabilization_system, stabilization_axes, gunner_sight_type,
                             gunner_sight_day_range_m, gunner_sight_thermal_range_m,
                             commander_sight_type, commander_independent_viewer,
                             commander_thermal_range_m, hunter_killer_capable, target_tracking,
                             first_round_hit_probability)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 'Digital', 'PERI-R 17 A3', 'Nd:YAG',
        10000, 1,
        'Electric/hydraulic', '2-axis (elevation, traverse)', 'EMES 15 (Gunner Primary Sight)',
        6000, 5000,
        'PERI-R 17 A3 (Commander Panoramic Sight)', 1,
        5000, 1, 1,
        0.90
    ))
    
    # Armor
    cursor.execute("""
    INSERT INTO armor (tank_id, hull_front_type, hull_front_thickness_mm, hull_front_equivalent_rha_mm,
                      hull_side_type, hull_side_thickness_mm, hull_side_equivalent_rha_mm,
                      hull_rear_type, hull_rear_thickness_mm, hull_top_type, hull_top_thickness_mm,
                      turret_front_type, turret_front_thickness_mm, turret_front_equivalent_rha_mm,
                      turret_side_type, turret_side_thickness_mm, turret_rear_type, turret_roof_type,
                      reactive_armor, reactive_armor_type, composite_armor, composite_armor_components,
                      spall_liners, soft_kill_systems, hard_kill_systems)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 'Composite with add-on modules', 80, 620,
        'Composite with side skirts', 70, 280,
        'Rolled homogeneous', 40, 'Rolled homogeneous', 20,
        'Composite with add-on modules', 150, 1200,
        'Composite with add-on modules', 120, 'Rolled homogeneous', 'Rolled homogeneous',
        1, 'AMAP composite modules', 1, 'Ceramic, steel, tungsten, composite',
        1, 'Galix smoke grenade launchers', None
    ))
    
    # Electrical
    cursor.execute("""
    INSERT INTO electrical (tank_id, voltage_system_v, battery_count, battery_type,
                           battery_capacity_ah, alternator_output_kw, generator_output_kw,
                           auxiliary_power_unit, apu_output_kw, apu_fuel_type,
                           total_power_consumption_kw)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 24, 8, '12V lead-acid',
        240, 20, None,
        1, 17, 'Diesel',
        12
    ))
    
    # Communications
    cursor.execute("""
    INSERT INTO communications (tank_id, radio_type_vhf, radio_model, radio_range_km,
                               intercom_system, encryption_system, gps_system,
                               inertial_navigation, digital_map_system, tactical_data_link,
                               antenna_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 'VHF/FM', 'SEM 80/90', 40,
        'Intercom system', 'Secure voice/data', 1,
        1, 1, 'IFIS (Integrated Command and Information System)',
        2
    ))
    
    # Hydraulics
    cursor.execute("""
    INSERT INTO hydraulics (tank_id, hydraulic_pressure_psi, hydraulic_fluid_type,
                           hydraulic_reservoir_capacity_liters, turret_traverse_hydraulic,
                           gun_elevation_hydraulic, pneumatic_system, air_pressure_psi,
                           nbc_overpressure_system, nbc_pressure_pa)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 2900, 'HFC hydraulic fluid',
        100, 1,
        1, 1, 120,
        1, 300
    ))
    
    # Crew Systems
    cursor.execute("""
    INSERT INTO crew_systems (tank_id, heating_system, ventilation_system, air_conditioning,
                             nbc_filter_system, nbc_filter_type, fire_suppression_system,
                             fire_suppression_type, fire_suppression_zones, crew_seats_armored,
                             crew_restraints, emergency_escape_hatches)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 1, 1, 0,
        1, 'HEPA filter', 1,
        'Halon 1301', 3, 1,
        1, 4
    ))
    
    # Ammunition
    cursor.execute("""
    INSERT INTO ammunition (tank_id, main_gun_ready_rounds, main_gun_stored_rounds,
                           total_ammunition_capacity, ammunition_types, apfsds_available,
                           heat_available, he_available, he_frag_available, canister_available,
                           guided_rounds_available, autoloader_rounds_per_min,
                           manual_loader_rounds_per_min, storage_ready_rack, storage_hull,
                           storage_turret, blast_doors)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 15, 27,
        42, 'DM53 APFSDS, DM12 HEAT, DM11 HE-Frag, DM63 APFSDS', 1,
        1, 0, 1, 0,
        1, None,
        10, 15, 27, 0,
        1
    ))
    
    # Maintenance
    cursor.execute("""
    INSERT INTO maintenance (tank_id, engine_oil_change_hours, transmission_service_hours,
                           track_service_hours, major_overhaul_hours, engine_rebuild_hours,
                           transmission_rebuild_hours, track_replacement_km, barrel_life_rounds,
                           preventive_maintenance_weekly, preventive_maintenance_monthly,
                           critical_spares_required, technical_manual_reference)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 400, 800,
        24, 2000, 2000,
        2000, 1500, 600,
        1, 1,
        'Track links (10%), filters (oil/fuel/air), batteries, hydraulic seals', 'KMWeg maintenance documentation'
    ))
    
    print("  - Leopard 2A7 data inserted")

def populate_t90m(cursor):
    """Insert comprehensive T-90M Proryv-3 specifications"""
    
    # Insert main tank record
    cursor.execute("""
    INSERT INTO tanks (name, variant, country, manufacturer, service_year, production_years,
                      weight_combat_kg, weight_empty_kg, length_m, width_m, height_m,
                      ground_clearance_m, crew_size, unit_cost_usd, total_produced,
                      operational_status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        'T-90', 'T-90M Proryv-3', 'Russia', 'Uralvagonzavod',
        2017, '2017-present',
        48000, 46500, 9.53, 3.78, 2.23,
        0.49, 3, 4500000, None,
        'Active', 'Modernized T-90 with improved armor, fire control, and protection systems'
    ))
    tank_id = cursor.lastrowid
    
    # Performance
    cursor.execute("""
    INSERT INTO performance (tank_id, max_speed_road_kmh, max_speed_offroad_kmh, range_road_km,
                            range_offroad_km, fuel_capacity_liters, fuel_consumption_liters_per_100km,
                            vertical_obstacle_m, trench_width_m, fording_depth_m, gradient_percent,
                            power_to_weight_ratio, acceleration_0_to_32kmh_sec)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 65.0, 45.0, 550,
        180, 1600, 291,
        0.85, 2.80, 1.20, 60,
        23.96, 8.5
    ))
    
    # Engine
    cursor.execute("""
    INSERT INTO engines (tank_id, engine_type, engine_model, manufacturer, configuration,
                        cylinders, displacement_liters, max_power_hp, max_power_rpm,
                        max_torque_nm, max_torque_rpm, fuel_type, multi_fuel_capable,
                        turbocharger, supercharger, compression_ratio, cooling_system_type,
                        cooling_capacity_liters, air_filter_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 'Diesel', 'V-92S2F', 'ChTZ', 'V12 60-degree',
        12, 38.88, 1130, 2000,
        4420, 1400, 'Diesel (multi-fuel capable)', 1,
        2, 0, 17, 'Liquid cooling',
        120, 'Two-stage centrifugal air filters'
    ))
    
    # Transmission
    cursor.execute("""
    INSERT INTO transmissions (tank_id, transmission_type, manufacturer, model,
                              forward_gears, reverse_gears, torque_converter,
                              final_drive_ratio, steering_type, braking_system,
                              parking_brake_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 'Automatic', 'ChTZ', '7-speed planetary',
        7, 1, 1,
        5.45, 'Differential steering', 'Hydraulic disc brakes',
        'Mechanical'
    ))
    
    # Suspension
    cursor.execute("""
    INSERT INTO suspension (tank_id, suspension_type, road_wheels_per_side, track_type,
                           track_width_mm, track_length_mm, track_links_per_side,
                           track_pitch_mm, idler_wheel_type, drive_sprocket_teeth,
                           return_rollers_per_side, shock_absorbers, torsion_bar_material)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 'Torsion bar', 6, 'Rubber-padded steel',
        580, 4600, 125,
        137, 'Adjustable', 13,
        0, 6, 'Alloy steel'
    ))
    
    # Main Weapon
    cursor.execute("""
    INSERT INTO weapons_main (tank_id, gun_caliber_mm, gun_type, gun_model, manufacturer,
                             barrel_length_m, rifling_twist, elevation_degrees, depression_degrees,
                             turret_traverse_degrees_per_sec, gun_elevation_rate_degrees_per_sec,
                             muzzle_velocity_ms, max_effective_range_m, rate_of_fire_rounds_per_min,
                             autoloader, bore_evacuator, thermal_sleeve)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 125, 'Smoothbore', '2A46M-5', 'Uralvagonzavod',
        6.4, None, 18, -5,
        24, 12,
        1800, 5000, 8,
        1, 1, 1
    ))
    
    # Secondary Weapons
    secondary_weapons = [
        ('Coaxial Machine Gun', 7.62, 'PKTM', 'Coaxial', 60, -5, '7.62x54mmR', 250, 2000),
        ("Commander's Machine Gun", 12.7, 'NSVT', "Commander's cupola", 75, -5, '12.7x108mm', 700, 2000)
    ]
    for weapon in secondary_weapons:
        cursor.execute("""
        INSERT INTO weapons_secondary (tank_id, weapon_type, caliber_mm, model, mount_location,
                                      elevation_degrees, depression_degrees, ammunition_type,
                                      rate_of_fire_rounds_per_min, effective_range_m)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (tank_id, *weapon))
    
    # Fire Control System
    cursor.execute("""
    INSERT INTO fire_control (tank_id, ballistic_computer_type, ballistic_computer_model,
                             laser_rangefinder_type, laser_rangefinder_range_m, crosswind_sensor,
                             stabilization_system, stabilization_axes, gunner_sight_type,
                             gunner_sight_day_range_m, gunner_sight_thermal_range_m,
                             commander_sight_type, commander_independent_viewer,
                             commander_thermal_range_m, hunter_killer_capable, target_tracking,
                             first_round_hit_probability)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 'Digital', 'Kalina FCS', 'Nd:YAG',
        5000, 1,
        'Electric/hydraulic', '2-axis (elevation, traverse)', 'PNM Sosna-U',
        3500, 3500,
        'PNM Sosna-U', 1,
        3500, 1, 1,
        0.85
    ))
    
    # Armor
    cursor.execute("""
    INSERT INTO armor (tank_id, hull_front_type, hull_front_thickness_mm, hull_front_equivalent_rha_mm,
                      hull_side_type, hull_side_thickness_mm, hull_side_equivalent_rha_mm,
                      hull_rear_type, hull_rear_thickness_mm, hull_top_type, hull_top_thickness_mm,
                      turret_front_type, turret_front_thickness_mm, turret_front_equivalent_rha_mm,
                      turret_side_type, turret_side_thickness_mm, turret_rear_type, turret_roof_type,
                      reactive_armor, reactive_armor_type, composite_armor, composite_armor_components,
                      spall_liners, soft_kill_systems, hard_kill_systems)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 'Composite with ERA', 120, 550,
        'Composite with side skirts and ERA', 80, 250,
        'Rolled homogeneous', 45, 'Rolled homogeneous', 20,
        'Composite with ERA', 150, 950,
        'Composite with ERA', 100, 'Rolled homogeneous', 'Rolled homogeneous',
        1, 'Relikt ERA', 1, 'Steel, ceramic, aluminum, composite',
        1, 'Shtora-1 (LED dazzlers, smoke grenades)', 'Arena-M (hard kill APS)'
    ))
    
    # Electrical
    cursor.execute("""
    INSERT INTO electrical (tank_id, voltage_system_v, battery_count, battery_type,
                           battery_capacity_ah, alternator_output_kw, generator_output_kw,
                           auxiliary_power_unit, apu_output_kw, apu_fuel_type,
                           total_power_consumption_kw)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 27, 6, '12V lead-acid',
        190, 18, None,
        0, None, None,
        8.5
    ))
    
    # Communications
    cursor.execute("""
    INSERT INTO communications (tank_id, radio_type_vhf, radio_model, radio_range_km,
                               intercom_system, encryption_system, gps_system,
                               inertial_navigation, digital_map_system, tactical_data_link,
                               antenna_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 'VHF/FM', 'R-168', 40,
        'R-174 intercom', 'Encrypted', 1,
        1, 1, 'Tactical data link',
        2
    ))
    
    # Hydraulics
    cursor.execute("""
    INSERT INTO hydraulics (tank_id, hydraulic_pressure_psi, hydraulic_fluid_type,
                           hydraulic_reservoir_capacity_liters, turret_traverse_hydraulic,
                           gun_elevation_hydraulic, pneumatic_system, air_pressure_psi,
                           nbc_overpressure_system, nbc_pressure_pa)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 2700, 'Mineral oil',
        85, 1,
        1, 1, 100,
        1, 250
    ))
    
    # Crew Systems
    cursor.execute("""
    INSERT INTO crew_systems (tank_id, heating_system, ventilation_system, air_conditioning,
                             nbc_filter_system, nbc_filter_type, fire_suppression_system,
                             fire_suppression_type, fire_suppression_zones, crew_seats_armored,
                             crew_restraints, emergency_escape_hatches)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 1, 1, 0,
        1, 'PZ filter', 1,
        'Automatic fire suppression', 2, 1,
        1, 3
    ))
    
    # Ammunition
    cursor.execute("""
    INSERT INTO ammunition (tank_id, main_gun_ready_rounds, main_gun_stored_rounds,
                           total_ammunition_capacity, ammunition_types, apfsds_available,
                           heat_available, he_available, he_frag_available, canister_available,
                           guided_rounds_available, autoloader_rounds_per_min,
                           manual_loader_rounds_per_min, storage_ready_rack, storage_hull,
                           storage_turret, blast_doors)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 22, 21,
        43, '3BM60/3BM59 APFSDS, 3BK29 HEAT, 3OF26 HE-Frag, 3UBK20 guided missile', 1,
        1, 0, 1, 0,
        1, 8,
        None, 22, 21, 0,
        1
    ))
    
    # Maintenance
    cursor.execute("""
    INSERT INTO maintenance (tank_id, engine_oil_change_hours, transmission_service_hours,
                           track_service_hours, major_overhaul_hours, engine_rebuild_hours,
                           transmission_rebuild_hours, track_replacement_km, barrel_life_rounds,
                           preventive_maintenance_weekly, preventive_maintenance_monthly,
                           critical_spares_required, technical_manual_reference)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tank_id, 300, 600,
        24, 1500, 2500,
        1500, 1200, 600,
        1, 1,
        'Track links (10%), filters (oil/fuel/air), batteries, hydraulic seals', 'Russian GRAU index manuals'
    ))
    
    print("  - T-90M Proryv-3 data inserted")

if __name__ == "__main__":
    create_database()

