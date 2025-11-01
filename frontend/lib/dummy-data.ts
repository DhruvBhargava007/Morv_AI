import { Tank, TankComponent, MaintenanceEvent, PartInventory } from './types';

export const dummyComponents: TankComponent[] = [
  {
    id: 'eng-001',
    name: 'Main Engine',
    health: 87,
    status: 'operational',
    lastServiced: '2025-09-15',
    nextService: '2025-12-15',
    hoursRemaining: 245
  },
  {
    id: 'trk-001',
    name: 'Track System',
    health: 72,
    status: 'degraded',
    lastServiced: '2025-08-20',
    nextService: '2025-11-20',
    hoursRemaining: 120
  },
  {
    id: 'trn-001',
    name: 'Transmission',
    health: 91,
    status: 'operational',
    lastServiced: '2025-10-01',
    nextService: '2026-01-01',
    hoursRemaining: 380
  },
  {
    id: 'gun-001',
    name: 'Main Gun System',
    health: 95,
    status: 'operational',
    lastServiced: '2025-10-10',
    nextService: '2026-01-10',
    hoursRemaining: 420
  },
  {
    id: 'sus-001',
    name: 'Suspension System',
    health: 65,
    status: 'degraded',
    lastServiced: '2025-07-15',
    nextService: '2025-11-05',
    hoursRemaining: 85
  },
  {
    id: 'fcs-001',
    name: 'Fire Control System',
    health: 88,
    status: 'operational',
    lastServiced: '2025-09-25',
    nextService: '2025-12-25',
    hoursRemaining: 310
  },
  {
    id: 'com-001',
    name: 'Communications Array',
    health: 42,
    status: 'maintenance_required',
    lastServiced: '2025-06-10',
    nextService: '2025-11-02',
    hoursRemaining: 18
  },
  {
    id: 'pow-001',
    name: 'Auxiliary Power Unit',
    health: 78,
    status: 'operational',
    lastServiced: '2025-09-01',
    nextService: '2025-12-01',
    hoursRemaining: 265
  },
  {
    id: 'hyd-001',
    name: 'Hydraulic System',
    health: 55,
    status: 'critical',
    lastServiced: '2025-07-01',
    nextService: '2025-11-01',
    hoursRemaining: 5
  },
  {
    id: 'arm-001',
    name: 'Reactive Armor Panels',
    health: 82,
    status: 'operational',
    lastServiced: '2025-09-10',
    nextService: '2025-12-10',
    hoursRemaining: 290
  }
];

export const dummyMaintenanceEvents: MaintenanceEvent[] = [
  {
    id: 'mnt-001',
    date: '2025-11-01',
    type: 'scheduled',
    component: 'Hydraulic System',
    description: 'Critical hydraulic fluid replacement and seal inspection',
    status: 'in_progress',
    priority: 'critical'
  },
  {
    id: 'mnt-002',
    date: '2025-11-02',
    type: 'scheduled',
    component: 'Communications Array',
    description: 'Antenna calibration and signal strength testing',
    status: 'pending',
    priority: 'high'
  },
  {
    id: 'mnt-003',
    date: '2025-11-05',
    type: 'preventive',
    component: 'Suspension System',
    description: 'Torsion bar inspection and road wheel replacement',
    status: 'pending',
    priority: 'medium'
  },
  {
    id: 'mnt-004',
    date: '2025-11-08',
    type: 'scheduled',
    component: 'Track System',
    description: 'Track tension adjustment and pin replacement',
    status: 'pending',
    priority: 'medium'
  },
  {
    id: 'mnt-005',
    date: '2025-10-28',
    type: 'unscheduled',
    component: 'Main Engine',
    description: 'Oil filter replacement due to contamination',
    status: 'completed',
    priority: 'high'
  },
  {
    id: 'mnt-006',
    date: '2025-11-15',
    type: 'scheduled',
    component: 'Fire Control System',
    description: 'Ballistic computer software update',
    status: 'pending',
    priority: 'low'
  }
];

export const dummyPartsInventory: PartInventory[] = [
  {
    id: 'prt-001',
    name: 'Track Links',
    partNumber: 'TRK-2040-B',
    quantity: 45,
    minQuantity: 30,
    status: 'available'
  },
  {
    id: 'prt-002',
    name: 'Hydraulic Seals Kit',
    partNumber: 'HYD-5580',
    quantity: 2,
    minQuantity: 5,
    status: 'critical',
    estimatedDelivery: '2025-11-03'
  },
  {
    id: 'prt-003',
    name: 'Engine Oil Filter',
    partNumber: 'ENG-7720-F',
    quantity: 12,
    minQuantity: 8,
    status: 'available'
  },
  {
    id: 'prt-004',
    name: 'Road Wheels',
    partNumber: 'SUS-1240-W',
    quantity: 6,
    minQuantity: 4,
    status: 'available'
  },
  {
    id: 'prt-005',
    name: 'Communications Module',
    partNumber: 'COM-8845-M',
    quantity: 0,
    minQuantity: 2,
    status: 'out_of_stock',
    estimatedDelivery: '2025-11-10'
  },
  {
    id: 'prt-006',
    name: 'Transmission Fluid',
    partNumber: 'TRN-3310-L',
    quantity: 85,
    minQuantity: 40,
    status: 'available'
  },
  {
    id: 'prt-007',
    name: 'Fire Suppression Cartridge',
    partNumber: 'SAF-9920-C',
    quantity: 8,
    minQuantity: 10,
    status: 'low_stock',
    estimatedDelivery: '2025-11-05'
  },
  {
    id: 'prt-008',
    name: 'Antenna Assembly',
    partNumber: 'COM-8850-A',
    quantity: 3,
    minQuantity: 2,
    status: 'available'
  }
];

export const dummyTank: Tank = {
  id: 'TNK-A-047',
  designation: 'M1A2 SEPv3',
  model: 'M1 Abrams',
  serialNumber: 'USAM1-2024-0847',
  operatingHours: 2847,
  location: 'Fort Irwin, CA',
  status: 'operational',
  readinessScore: 78,
  lastInspection: '2025-10-28',
  components: dummyComponents,
  maintenanceEvents: dummyMaintenanceEvents,
  partsInventory: dummyPartsInventory
};

// Additional tank data for selection
export const dummyTank2: Tank = {
  id: 'TNK-B-023',
  designation: 'M1A2 SEPv3',
  model: 'M1 Abrams',
  serialNumber: 'USAM1-2024-0623',
  operatingHours: 3142,
  location: 'Fort Hood, TX',
  status: 'maintenance',
  readinessScore: 62,
  lastInspection: '2025-10-25',
  components: [
    { id: 'eng-002', name: 'Main Engine', health: 78, status: 'operational', lastServiced: '2025-08-10', nextService: '2025-11-10', hoursRemaining: 180 },
    { id: 'trk-002', name: 'Track System', health: 45, status: 'critical', lastServiced: '2025-06-15', nextService: '2025-11-01', hoursRemaining: 8 },
    { id: 'trn-002', name: 'Transmission', health: 88, status: 'operational', lastServiced: '2025-09-20', nextService: '2025-12-20', hoursRemaining: 320 },
    { id: 'gun-002', name: 'Main Gun System', health: 92, status: 'operational', lastServiced: '2025-10-05', nextService: '2026-01-05', hoursRemaining: 410 },
    { id: 'sus-002', name: 'Suspension System', health: 58, status: 'degraded', lastServiced: '2025-07-20', nextService: '2025-11-08', hoursRemaining: 95 },
    { id: 'fcs-002', name: 'Fire Control System', health: 85, status: 'operational', lastServiced: '2025-09-15', nextService: '2025-12-15', hoursRemaining: 290 },
    { id: 'com-002', name: 'Communications Array', health: 68, status: 'degraded', lastServiced: '2025-08-01', nextService: '2025-11-15', hoursRemaining: 140 },
    { id: 'pow-002', name: 'Auxiliary Power Unit', health: 75, status: 'operational', lastServiced: '2025-08-25', nextService: '2025-11-25', hoursRemaining: 240 },
    { id: 'hyd-002', name: 'Hydraulic System', health: 52, status: 'maintenance_required', lastServiced: '2025-06-28', nextService: '2025-10-31', hoursRemaining: 2 },
    { id: 'arm-002', name: 'Reactive Armor Panels', health: 80, status: 'operational', lastServiced: '2025-09-05', nextService: '2025-12-05', hoursRemaining: 270 }
  ],
  maintenanceEvents: [
    { id: 'mnt-201', date: '2025-10-31', type: 'scheduled', component: 'Hydraulic System', description: 'Emergency hydraulic system overhaul', status: 'in_progress', priority: 'critical' },
    { id: 'mnt-202', date: '2025-11-01', type: 'scheduled', component: 'Track System', description: 'Complete track replacement due to excessive wear', status: 'pending', priority: 'critical' },
    { id: 'mnt-203', date: '2025-11-08', type: 'preventive', component: 'Suspension System', description: 'Suspension system inspection and component replacement', status: 'pending', priority: 'high' }
  ],
  partsInventory: dummyPartsInventory
};

export const dummyTank3: Tank = {
  id: 'TNK-C-091',
  designation: 'M1A2 SEPv3',
  model: 'M1 Abrams',
  serialNumber: 'USAM1-2024-0991',
  operatingHours: 1523,
  location: 'Fort Benning, GA',
  status: 'operational',
  readinessScore: 94,
  lastInspection: '2025-10-30',
  components: [
    { id: 'eng-003', name: 'Main Engine', health: 96, status: 'operational', lastServiced: '2025-10-01', nextService: '2026-01-01', hoursRemaining: 480 },
    { id: 'trk-003', name: 'Track System', health: 89, status: 'operational', lastServiced: '2025-09-25', nextService: '2025-12-25', hoursRemaining: 420 },
    { id: 'trn-003', name: 'Transmission', health: 93, status: 'operational', lastServiced: '2025-10-05', nextService: '2026-01-05', hoursRemaining: 450 },
    { id: 'gun-003', name: 'Main Gun System', health: 97, status: 'operational', lastServiced: '2025-10-15', nextService: '2026-01-15', hoursRemaining: 510 },
    { id: 'sus-003', name: 'Suspension System', health: 91, status: 'operational', lastServiced: '2025-09-20', nextService: '2025-12-20', hoursRemaining: 435 },
    { id: 'fcs-003', name: 'Fire Control System', health: 94, status: 'operational', lastServiced: '2025-10-10', nextService: '2026-01-10', hoursRemaining: 480 },
    { id: 'com-003', name: 'Communications Array', health: 88, status: 'operational', lastServiced: '2025-09-30', nextService: '2025-12-30', hoursRemaining: 460 },
    { id: 'pow-003', name: 'Auxiliary Power Unit', health: 92, status: 'operational', lastServiced: '2025-10-08', nextService: '2026-01-08', hoursRemaining: 475 },
    { id: 'hyd-003', name: 'Hydraulic System', health: 95, status: 'operational', lastServiced: '2025-10-12', nextService: '2026-01-12', hoursRemaining: 490 },
    { id: 'arm-003', name: 'Reactive Armor Panels', health: 90, status: 'operational', lastServiced: '2025-10-03', nextService: '2026-01-03', hoursRemaining: 465 }
  ],
  maintenanceEvents: [
    { id: 'mnt-301', date: '2025-11-20', type: 'preventive', component: 'Main Engine', description: 'Routine oil change and filter replacement', status: 'pending', priority: 'low' },
    { id: 'mnt-302', date: '2025-11-25', type: 'scheduled', component: 'Fire Control System', description: 'Software update and calibration', status: 'pending', priority: 'medium' }
  ],
  partsInventory: dummyPartsInventory
};

export const allTanks = [dummyTank, dummyTank2, dummyTank3];

export const defaultWeights = {
  operatingHours: 25,
  environmentalConditions: 15,
  componentAge: 20,
  missionCriticality: 20,
  maintenanceHistory: 10,
  partsAvailability: 10
};

