# Tank Database Schema Documentation

## Overview

The tank database is a normalized relational SQLite database containing comprehensive specifications for military main battle tanks. The database uses a normalized design with 15 interconnected tables covering all major tank systems.

## Database Structure

### Entity-Relationship Overview

The database follows a star-like structure centered on the `tanks` table:
- **Core Table**: `tanks` - Basic tank identification and physical specifications
- **System Tables**: All other tables reference `tanks` via `tank_id` foreign key
- **One-to-One Relationships**: Most system tables have one record per tank
- **One-to-Many Relationships**: `weapons_secondary` can have multiple records per tank

## Tables and Field Descriptions

### 1. tanks

Primary table containing basic tank identification and specifications.

| Field | Type | Description |
|-------|------|-------------|
| tank_id | INTEGER | Primary key, auto-incremented |
| name | TEXT | Tank family name (e.g., "M1 Abrams", "Leopard 2") |
| variant | TEXT | Specific variant/model (e.g., "M1A2 SEPv3") |
| country | TEXT | Country of origin |
| manufacturer | TEXT | Primary manufacturer |
| service_year | INTEGER | Year entered service |
| production_years | TEXT | Production period |
| weight_combat_kg | INTEGER | Combat weight in kilograms |
| weight_empty_kg | INTEGER | Empty weight in kilograms |
| length_m | REAL | Overall length in meters |
| width_m | REAL | Width in meters |
| height_m | REAL | Height in meters |
| ground_clearance_m | REAL | Ground clearance in meters |
| crew_size | INTEGER | Number of crew members |
| unit_cost_usd | INTEGER | Estimated unit cost in USD |
| total_produced | INTEGER | Total units produced (NULL if unknown) |
| operational_status | TEXT | Current status (Active, Retired, etc.) |
| notes | TEXT | Additional notes and information |

**Indexes**: `idx_tanks_name`, `idx_tanks_country`

---

### 2. performance

Mobility and performance specifications.

| Field | Type | Description |
|-------|------|-------------|
| performance_id | INTEGER | Primary key |
| tank_id | INTEGER | Foreign key to tanks |
| max_speed_road_kmh | REAL | Maximum road speed (km/h) |
| max_speed_offroad_kmh | REAL | Maximum off-road speed (km/h) |
| range_road_km | INTEGER | Road range in kilometers |
| range_offroad_km | INTEGER | Off-road range in kilometers |
| fuel_capacity_liters | REAL | Total fuel capacity |
| fuel_consumption_liters_per_100km | REAL | Average fuel consumption |
| vertical_obstacle_m | REAL | Maximum vertical obstacle height |
| trench_width_m | REAL | Maximum trench crossing width |
| fording_depth_m | REAL | Maximum fording depth |
| gradient_percent | REAL | Maximum gradient capability |
| power_to_weight_ratio | REAL | Power-to-weight ratio (hp/ton) |
| acceleration_0_to_32kmh_sec | REAL | Acceleration time to 32 km/h |

**Indexes**: `idx_performance_speed`

---

### 3. engines

Powerplant specifications and characteristics.

| Field | Type | Description |
|-------|------|-------------|
| engine_id | INTEGER | Primary key |
| tank_id | INTEGER | Foreign key to tanks |
| engine_type | TEXT | Type (Diesel, Gas Turbine, etc.) |
| engine_model | TEXT | Specific model designation |
| manufacturer | TEXT | Engine manufacturer |
| configuration | TEXT | Engine layout (V12, inline, etc.) |
| cylinders | INTEGER | Number of cylinders |
| displacement_liters | REAL | Engine displacement |
| max_power_hp | INTEGER | Maximum power in horsepower |
| max_power_rpm | INTEGER | RPM at max power |
| max_torque_nm | INTEGER | Maximum torque in Newton-meters |
| max_torque_rpm | INTEGER | RPM at max torque |
| fuel_type | TEXT | Primary fuel type |
| multi_fuel_capable | INTEGER | Boolean: 1 if multi-fuel, 0 if not |
| turbocharger | INTEGER | Boolean: 1 if turbocharged |
| supercharger | INTEGER | Boolean: 1 if supercharged |
| compression_ratio | REAL | Compression ratio |
| cooling_system_type | TEXT | Cooling system description |
| cooling_capacity_liters | REAL | Cooling system capacity |
| air_filter_type | TEXT | Air filtration system type |

**Indexes**: `idx_engines_type`

---

### 4. transmissions

Transmission and drivetrain specifications.

| Field | Type | Description |
|-------|------|-------------|
| transmission_id | INTEGER | Primary key |
| tank_id | INTEGER | Foreign key to tanks |
| transmission_type | TEXT | Type (Automatic, Manual, etc.) |
| manufacturer | TEXT | Transmission manufacturer |
| model | TEXT | Transmission model |
| forward_gears | INTEGER | Number of forward gears |
| reverse_gears | INTEGER | Number of reverse gears |
| torque_converter | INTEGER | Boolean: 1 if equipped |
| final_drive_ratio | REAL | Final drive reduction ratio |
| steering_type | TEXT | Steering system type |
| braking_system | TEXT | Brake system description |
| parking_brake_type | TEXT | Parking brake type |

---

### 5. suspension

Suspension and running gear specifications.

| Field | Type | Description |
|-------|------|-------------|
| suspension_id | INTEGER | Primary key |
| tank_id | INTEGER | Foreign key to tanks |
| suspension_type | TEXT | Type (Torsion bar, Coil spring, etc.) |
| road_wheels_per_side | INTEGER | Number of road wheels |
| track_type | TEXT | Track construction type |
| track_width_mm | INTEGER | Track width in millimeters |
| track_length_mm | INTEGER | Track length in millimeters |
| track_links_per_side | INTEGER | Number of track links per side |
| track_pitch_mm | INTEGER | Distance between track link pins |
| idler_wheel_type | TEXT | Idler wheel configuration |
| drive_sprocket_teeth | INTEGER | Number of sprocket teeth |
| return_rollers_per_side | INTEGER | Return rollers per side |
| shock_absorbers | INTEGER | Number of shock absorbers |
| torsion_bar_material | TEXT | Torsion bar material (if applicable) |

---

### 6. weapons_main

Primary armament specifications.

| Field | Type | Description |
|-------|------|-------------|
| weapon_id | INTEGER | Primary key |
| tank_id | INTEGER | Foreign key to tanks |
| gun_caliber_mm | INTEGER | Caliber in millimeters |
| gun_type | TEXT | Type (Smoothbore, Rifled) |
| gun_model | TEXT | Gun model designation |
| manufacturer | TEXT | Gun manufacturer |
| barrel_length_m | REAL | Barrel length in meters |
| rifling_twist | REAL | Rifling twist rate (if applicable) |
| elevation_degrees | REAL | Maximum elevation angle |
| depression_degrees | REAL | Maximum depression angle |
| turret_traverse_degrees_per_sec | REAL | Turret traverse rate |
| gun_elevation_rate_degrees_per_sec | REAL | Gun elevation rate |
| muzzle_velocity_ms | REAL | Typical muzzle velocity (m/s) |
| max_effective_range_m | INTEGER | Maximum effective range |
| rate_of_fire_rounds_per_min | REAL | Rate of fire |
| autoloader | INTEGER | Boolean: 1 if autoloader equipped |
| bore_evacuator | INTEGER | Boolean: 1 if bore evacuator present |
| thermal_sleeve | INTEGER | Boolean: 1 if thermal sleeve fitted |

**Indexes**: `idx_weapons_caliber`

---

### 7. weapons_secondary

Secondary weapons (machine guns, etc.). Multiple records per tank possible.

| Field | Type | Description |
|-------|------|-------------|
| secondary_id | INTEGER | Primary key |
| tank_id | INTEGER | Foreign key to tanks |
| weapon_type | TEXT | Weapon type description |
| caliber_mm | REAL | Caliber in millimeters |
| model | TEXT | Weapon model |
| mount_location | TEXT | Mounting location |
| elevation_degrees | REAL | Maximum elevation |
| depression_degrees | REAL | Maximum depression |
| ammunition_type | TEXT | Ammunition caliber/type |
| rate_of_fire_rounds_per_min | INTEGER | Rate of fire |
| effective_range_m | INTEGER | Effective range in meters |

---

### 8. fire_control

Fire control system specifications.

| Field | Type | Description |
|-------|------|-------------|
| fcs_id | INTEGER | Primary key |
| tank_id | INTEGER | Foreign key to tanks |
| ballistic_computer_type | TEXT | Computer type (Digital, Analog) |
| ballistic_computer_model | TEXT | Computer model |
| laser_rangefinder_type | TEXT | Laser type (Nd:YAG, etc.) |
| laser_rangefinder_range_m | INTEGER | Maximum range |
| crosswind_sensor | INTEGER | Boolean: 1 if equipped |
| stabilization_system | TEXT | Stabilization system type |
| stabilization_axes | TEXT | Stabilized axes |
| gunner_sight_type | TEXT | Gunner primary sight type |
| gunner_sight_day_range_m | INTEGER | Day sight range |
| gunner_sight_thermal_range_m | INTEGER | Thermal sight range |
| commander_sight_type | TEXT | Commander sight type |
| commander_independent_viewer | INTEGER | Boolean: 1 if CITV equipped |
| commander_thermal_range_m | INTEGER | Commander thermal range |
| hunter_killer_capable | INTEGER | Boolean: hunter-killer capability |
| target_tracking | INTEGER | Boolean: auto-tracking capability |
| first_round_hit_probability | REAL | First-round hit probability |

---

### 9. armor

Armor protection specifications.

| Field | Type | Description |
|-------|------|-------------|
| armor_id | INTEGER | Primary key |
| tank_id | INTEGER | Foreign key to tanks |
| hull_front_type | TEXT | Hull front armor type |
| hull_front_thickness_mm | REAL | Physical thickness (mm) |
| hull_front_equivalent_rha_mm | REAL | Equivalent RHA protection (mm) |
| hull_side_type | TEXT | Hull side armor type |
| hull_side_thickness_mm | REAL | Physical thickness (mm) |
| hull_side_equivalent_rha_mm | REAL | Equivalent RHA protection (mm) |
| hull_rear_type | TEXT | Hull rear armor type |
| hull_rear_thickness_mm | REAL | Physical thickness (mm) |
| hull_top_type | TEXT | Hull top armor type |
| hull_top_thickness_mm | REAL | Physical thickness (mm) |
| turret_front_type | TEXT | Turret front armor type |
| turret_front_thickness_mm | REAL | Physical thickness (mm) |
| turret_front_equivalent_rha_mm | REAL | Equivalent RHA protection (mm) |
| turret_side_type | TEXT | Turret side armor type |
| turret_side_thickness_mm | REAL | Physical thickness (mm) |
| turret_rear_type | TEXT | Turret rear armor type |
| turret_roof_type | TEXT | Turret roof armor type |
| reactive_armor | INTEGER | Boolean: 1 if ERA equipped |
| reactive_armor_type | TEXT | ERA type/model |
| composite_armor | INTEGER | Boolean: 1 if composite armor |
| composite_armor_components | TEXT | Composite armor composition |
| spall_liners | INTEGER | Boolean: 1 if spall liners present |
| soft_kill_systems | TEXT | Soft kill APS description |
| hard_kill_systems | TEXT | Hard kill APS description |

---

### 10. electrical

Electrical power systems.

| Field | Type | Description |
|-------|------|-------------|
| electrical_id | INTEGER | Primary key |
| tank_id | INTEGER | Foreign key to tanks |
| voltage_system_v | INTEGER | System voltage |
| battery_count | INTEGER | Number of batteries |
| battery_type | TEXT | Battery type |
| battery_capacity_ah | REAL | Total capacity (ampere-hours) |
| alternator_output_kw | REAL | Alternator output power |
| generator_output_kw | REAL | Generator output power |
| auxiliary_power_unit | INTEGER | Boolean: 1 if APU equipped |
| apu_output_kw | REAL | APU output power |
| apu_fuel_type | TEXT | APU fuel type |
| total_power_consumption_kw | REAL | Total electrical load |

---

### 11. communications

Communication and navigation systems.

| Field | Type | Description |
|-------|------|-------------|
| comm_id | INTEGER | Primary key |
| tank_id | INTEGER | Foreign key to tanks |
| radio_type_vhf | TEXT | Radio type/frequency band |
| radio_model | TEXT | Radio model |
| radio_range_km | INTEGER | Maximum range |
| intercom_system | TEXT | Intercom system model |
| encryption_system | TEXT | Encryption system |
| gps_system | INTEGER | Boolean: 1 if GPS equipped |
| inertial_navigation | INTEGER | Boolean: 1 if INS equipped |
| digital_map_system | INTEGER | Boolean: 1 if equipped |
| tactical_data_link | TEXT | Tactical data link system |
| antenna_count | INTEGER | Number of antennas |

---

### 12. hydraulics

Hydraulic and pneumatic systems.

| Field | Type | Description |
|-------|------|-------------|
| hydraulic_id | INTEGER | Primary key |
| tank_id | INTEGER | Foreign key to tanks |
| hydraulic_pressure_psi | INTEGER | Operating pressure |
| hydraulic_fluid_type | TEXT | Fluid specification |
| hydraulic_reservoir_capacity_liters | REAL | Reservoir capacity |
| turret_traverse_hydraulic | INTEGER | Boolean: 1 if hydraulic traverse |
| gun_elevation_hydraulic | INTEGER | Boolean: 1 if hydraulic elevation |
| pneumatic_system | INTEGER | Boolean: 1 if pneumatic system present |
| air_pressure_psi | INTEGER | Pneumatic pressure |
| nbc_overpressure_system | INTEGER | Boolean: 1 if NBC overpressure |
| nbc_pressure_pa | INTEGER | NBC system pressure (Pascals) |

---

### 13. crew_systems

Crew environment and safety systems.

| Field | Type | Description |
|-------|------|-------------|
| crew_system_id | INTEGER | Primary key |
| tank_id | INTEGER | Foreign key to tanks |
| heating_system | INTEGER | Boolean: 1 if equipped |
| ventilation_system | INTEGER | Boolean: 1 if equipped |
| air_conditioning | INTEGER | Boolean: 1 if A/C equipped |
| nbc_filter_system | INTEGER | Boolean: 1 if NBC filtration |
| nbc_filter_type | TEXT | Filter type |
| fire_suppression_system | INTEGER | Boolean: 1 if equipped |
| fire_suppression_type | TEXT | Suppression system type |
| fire_suppression_zones | INTEGER | Number of fire zones |
| crew_seats_armored | INTEGER | Boolean: 1 if armored seats |
| crew_restraints | INTEGER | Boolean: 1 if safety restraints |
| emergency_escape_hatches | INTEGER | Number of escape hatches |

---

### 14. ammunition

Ammunition storage and loading systems.

| Field | Type | Description |
|-------|------|-------------|
| ammo_id | INTEGER | Primary key |
| tank_id | INTEGER | Foreign key to tanks |
| main_gun_ready_rounds | INTEGER | Ready rack rounds |
| main_gun_stored_rounds | INTEGER | Stored rounds |
| total_ammunition_capacity | INTEGER | Total rounds |
| ammunition_types | TEXT | Available round types |
| apfsds_available | INTEGER | Boolean: 1 if APFSDS available |
| heat_available | INTEGER | Boolean: 1 if HEAT available |
| he_available | INTEGER | Boolean: 1 if HE available |
| he_frag_available | INTEGER | Boolean: 1 if HE-Frag available |
| canister_available | INTEGER | Boolean: 1 if canister available |
| guided_rounds_available | INTEGER | Boolean: 1 if guided rounds available |
| autoloader_rounds_per_min | REAL | Autoloader rate (if applicable) |
| manual_loader_rounds_per_min | REAL | Manual loading rate |
| storage_ready_rack | INTEGER | Ready rack capacity |
| storage_hull | INTEGER | Hull storage capacity |
| storage_turret | INTEGER | Turret storage capacity |
| blast_doors | INTEGER | Boolean: 1 if blast doors present |

---

### 15. maintenance

Maintenance requirements and schedules.

| Field | Type | Description |
|-------|------|-------------|
| maintenance_id | INTEGER | Primary key |
| tank_id | INTEGER | Foreign key to tanks |
| engine_oil_change_hours | INTEGER | Oil change interval (hours) |
| transmission_service_hours | INTEGER | Transmission service interval |
| track_service_hours | INTEGER | Track service interval |
| major_overhaul_hours | INTEGER | Major overhaul interval |
| engine_rebuild_hours | INTEGER | Engine rebuild interval |
| transmission_rebuild_hours | INTEGER | Transmission rebuild interval |
| track_replacement_km | INTEGER | Track replacement interval (km) |
| barrel_life_rounds | INTEGER | Main gun barrel life |
| preventive_maintenance_weekly | INTEGER | Boolean: weekly PM required |
| preventive_maintenance_monthly | INTEGER | Boolean: monthly PM required |
| critical_spares_required | TEXT | Critical spare parts list |
| technical_manual_reference | TEXT | Official technical manual reference |

---

## Foreign Key Relationships

All system tables reference the `tanks` table via `tank_id` foreign key:
- `ON DELETE CASCADE` ensures that deleting a tank removes all associated records
- Foreign key constraints are enforced via `PRAGMA foreign_keys = ON`

## Indexes

The database includes indexes on frequently queried columns:
- `idx_tanks_name` - Tank name lookups
- `idx_tanks_country` - Country-based queries
- `idx_engines_type` - Engine type filtering
- `idx_weapons_caliber` - Weapon caliber queries
- `idx_performance_speed` - Performance comparisons

## Data Integrity

- **Primary Keys**: All tables have auto-incrementing integer primary keys
- **Foreign Keys**: All foreign keys are properly constrained
- **Unique Constraints**: `tanks` table has UNIQUE constraint on (name, variant)
- **Data Types**: Appropriate types chosen for numeric precision and text storage

## Current Data

The database is populated with exhaustive specifications for three main battle tanks:
1. **M1A2 Abrams SEPv3** (United States)
2. **Leopard 2A7** (Germany)
3. **T-90M Proryv-3** (Russia)

Each tank includes complete data across all 15 system tables, with hundreds of individual data points per tank.

## Querying the Database

See `query_examples.py` for comprehensive examples of common queries and data retrieval patterns.

