// Database service for querying tank database
import initSqlJs from 'sql.js';

let SQL;
let db = null;
let dbInitialized = false;

// Initialize the database
export async function initDatabase() {
  if (dbInitialized && db) {
    return db;
  }

  try {
    SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`
    });

    // Load the database file
    const response = await fetch('/tank_database.db');
    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);
    
    db = new SQL.Database(data);
    dbInitialized = true;
    
    console.log('✅ Database initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    return null;
  }
}

// Map part names to database tables and fields
const partToDatabaseMap = {
  'turret': {
    table: 'weapons_main',
    description: 'Main weapon and turret system specifications',
    fields: ['gun_caliber_mm', 'gun_type', 'gun_model', 'barrel_length_m', 'turret_traverse_degrees_per_sec', 'rate_of_fire_rounds_per_min', 'max_effective_range_m']
  },
  'engine': {
    table: 'engines',
    description: 'Engine and powerplant specifications',
    fields: ['engine_type', 'engine_model', 'max_power_hp', 'max_torque_nm', 'fuel_type', 'displacement_liters', 'configuration']
  },
  'tracks': {
    table: 'suspension',
    description: 'Suspension and track system specifications',
    fields: ['suspension_type', 'road_wheels_per_side', 'track_type', 'track_width_mm', 'track_length_mm', 'track_links_per_side', 'shock_absorbers']
  },
  'armor': {
    table: 'armor',
    description: 'Armor and protection system specifications',
    fields: ['hull_front_type', 'hull_front_equivalent_rha_mm', 'turret_front_type', 'turret_front_equivalent_rha_mm', 'reactive_armor', 'composite_armor', 'hard_kill_systems']
  },
  'optics': {
    table: 'fire_control',
    description: 'Fire control and targeting system specifications',
    fields: ['laser_rangefinder_range_m', 'gunner_sight_type', 'gunner_sight_thermal_range_m', 'commander_independent_viewer', 'hunter_killer_capable', 'target_tracking', 'first_round_hit_probability']
  },
  'transmission': {
    table: 'transmissions',
    description: 'Transmission and drivetrain specifications',
    fields: ['transmission_type', 'model', 'forward_gears', 'reverse_gears', 'torque_converter', 'steering_type', 'braking_system']
  }
};

// Get tank ID from tank config
export async function getTankIdFromConfig(tankConfig) {
  if (!db) {
    await initDatabase();
  }
  
  if (!db) return null;

  try {
    const name = tankConfig.dbName || tankConfig.name;
    const variant = tankConfig.dbVariant || tankConfig.variant;
    
    if (!name || !variant) return null;

    const stmt = db.prepare(`SELECT tank_id FROM tanks WHERE name = ? AND variant = ?`);
    stmt.bind([name, variant]);
    
    const result = [];
    while (stmt.step()) {
      result.push(stmt.getAsObject());
    }
    stmt.free();

    if (result.length > 0 && result[0].tank_id) {
      return result[0].tank_id;
    }
    return null;
  } catch (error) {
    console.error('Error getting tank ID:', error);
    return null;
  }
}

// Get part data from database
export async function getPartData(tankId, partName) {
  if (!db) {
    await initDatabase();
  }
  
  if (!db) {
    console.warn('Database not initialized');
    return null;
  }

  const partMap = partToDatabaseMap[partName.toLowerCase()];
  if (!partMap) {
    console.warn(`No database mapping for part: ${partName}`);
    return null;
  }

  try {
    const fields = partMap.fields.join(', ');
    const query = `SELECT ${fields} FROM ${partMap.table} WHERE tank_id = ?`;
    
    // sql.js exec() uses positional parameters in the query string
    const stmt = db.prepare(query);
    stmt.bind([tankId]);
    
    const result = [];
    while (stmt.step()) {
      result.push(stmt.getAsObject());
    }
    stmt.free();
    
    if (result.length > 0) {
      const partData = {};
      Object.keys(result[0]).forEach(key => {
        if (result[0][key] !== null && result[0][key] !== undefined) {
          partData[key] = result[0][key];
        }
      });

      return {
        description: partMap.description,
        specifications: partData
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error querying ${partMap.table}:`, error);
    return null;
  }
}

// Get maintenance data from database
export async function getMaintenanceData(tankId) {
  if (!db) {
    await initDatabase();
  }
  
  if (!db) return null;

  try {
    const stmt = db.prepare(`SELECT * FROM maintenance WHERE tank_id = ?`);
    stmt.bind([tankId]);
    
    const result = [];
    while (stmt.step()) {
      result.push(stmt.getAsObject());
    }
    stmt.free();

    if (result.length > 0) {
      const maintenanceData = {};
      Object.keys(result[0]).forEach(key => {
        if (key !== 'maintenance_id' && key !== 'tank_id' && result[0][key] !== null) {
          maintenanceData[key] = result[0][key];
        }
      });

      return maintenanceData;
    }
    
    return null;
  } catch (error) {
    console.error('Error querying maintenance:', error);
    return null;
  }
}

// Main function to get part information for InfoDrawer
export async function getPartInfo(tankConfig, partName) {
  if (!tankConfig) return null;

  const tankId = await getTankIdFromConfig(tankConfig);
  if (!tankId) {
    console.warn('Could not find tank in database:', tankConfig);
    return null;
  }

  const [partData, maintenanceData] = await Promise.all([
    getPartData(tankId, partName),
    getMaintenanceData(tankId)
  ]);

  if (!partData) return null;

  return {
    partData,
    maintenanceData,
    partName: partName,
    tankId: tankId
  };
}

