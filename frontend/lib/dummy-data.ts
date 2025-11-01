import { Tank, TankComponent, MaintenanceEvent, PartInventory, Personnel, WorkOrder, PartTransfer, PersonnelAssignment, RepairRecommendation, ApprovalRequest, TankNetwork } from './types';

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
  designation: 'Alpha-047',
  model: 'M1A2 SEPv3',
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
  designation: 'Bravo-023',
  model: 'M1A2 SEPv3',
  serialNumber: 'USAM1-2024-0623',
  operatingHours: 3142,
  location: 'Fort Hood, TX',
  status: 'maintenance',
  readinessScore: 62,
  lastInspection: '2025-10-25',
  components: [
    { id: 'eng-001', name: 'Main Engine', health: 78, status: 'operational', lastServiced: '2025-08-10', nextService: '2025-11-10', hoursRemaining: 180 },
    { id: 'trn-001', name: 'Transmission', health: 88, status: 'operational', lastServiced: '2025-09-20', nextService: '2025-12-20', hoursRemaining: 320 },
    { id: 'hyd-001', name: 'Hydraulic System', health: 52, status: 'maintenance_required', lastServiced: '2025-06-28', nextService: '2025-10-31', hoursRemaining: 2 },
    { id: 'sus-001', name: 'Suspension System', health: 58, status: 'degraded', lastServiced: '2025-07-20', nextService: '2025-11-08', hoursRemaining: 95 },
    { id: 'fcs-001', name: 'Fire Control System', health: 85, status: 'operational', lastServiced: '2025-09-15', nextService: '2025-12-15', hoursRemaining: 290 },
    { id: 'com-001', name: 'Communications Array', health: 68, status: 'degraded', lastServiced: '2025-08-01', nextService: '2025-11-15', hoursRemaining: 140 }
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
  designation: 'Charlie-091',
  model: 'M1A2 SEPv3',
  serialNumber: 'USAM1-2024-0991',
  operatingHours: 1523,
  location: 'Fort Benning, GA',
  status: 'operational',
  readinessScore: 94,
  lastInspection: '2025-10-30',
  components: [
    { id: 'eng-001', name: 'Main Engine', health: 96, status: 'operational', lastServiced: '2025-10-01', nextService: '2026-01-01', hoursRemaining: 480 },
    { id: 'trn-001', name: 'Transmission', health: 93, status: 'operational', lastServiced: '2025-10-05', nextService: '2026-01-05', hoursRemaining: 450 },
    { id: 'hyd-001', name: 'Hydraulic System', health: 95, status: 'operational', lastServiced: '2025-10-12', nextService: '2026-01-12', hoursRemaining: 490 },
    { id: 'sus-001', name: 'Suspension System', health: 91, status: 'operational', lastServiced: '2025-09-20', nextService: '2025-12-20', hoursRemaining: 435 },
    { id: 'fcs-001', name: 'Fire Control System', health: 94, status: 'operational', lastServiced: '2025-10-10', nextService: '2026-01-10', hoursRemaining: 480 },
    { id: 'com-001', name: 'Communications Array', health: 88, status: 'operational', lastServiced: '2025-09-30', nextService: '2025-12-30', hoursRemaining: 460 }
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

export const dummyPersonnel: Personnel[] = [
  {
    id: 'PER-001',
    name: 'SSG James Mitchell',
    specialization: 'Engine Mechanics',
    currentAssignments: ['TNK-A-042'],
    availabilityStatus: 'assigned',
    location: 'Fort Hood, TX'
  },
  {
    id: 'PER-002',
    name: 'SPC Maria Rodriguez',
    specialization: 'Hydraulics & Suspension',
    currentAssignments: [],
    availabilityStatus: 'available',
    location: 'Fort Hood, TX'
  },
  {
    id: 'PER-003',
    name: 'SGT David Chen',
    specialization: 'Fire Control Systems',
    currentAssignments: ['TNK-A-042', 'TNK-C-091'],
    availabilityStatus: 'assigned',
    location: 'Fort Hood, TX'
  },
  {
    id: 'PER-004',
    name: 'SPC Robert Taylor',
    specialization: 'Track & Transmission',
    currentAssignments: [],
    availabilityStatus: 'available',
    location: 'Fort Benning, GA'
  },
  {
    id: 'PER-005',
    name: 'SSG Jennifer Williams',
    specialization: 'Communications & Electronics',
    currentAssignments: ['TNK-B-087'],
    availabilityStatus: 'assigned',
    location: 'Fort Hood, TX'
  },
  {
    id: 'PER-006',
    name: 'SPC Michael Brown',
    specialization: 'General Maintenance',
    currentAssignments: [],
    availabilityStatus: 'available',
    location: 'Fort Hood, TX'
  },
  {
    id: 'PER-007',
    name: 'SGT Lisa Anderson',
    specialization: 'Armor & Structural',
    currentAssignments: ['TNK-B-087'],
    availabilityStatus: 'assigned',
    location: 'Fort Benning, GA'
  },
  {
    id: 'PER-008',
    name: 'SPC Kevin Martinez',
    specialization: 'Power Systems',
    currentAssignments: [],
    availabilityStatus: 'available',
    location: 'Fort Hood, TX'
  },
  {
    id: 'PER-009',
    name: 'SSG Thomas Jackson',
    specialization: 'Engine Mechanics',
    currentAssignments: [],
    availabilityStatus: 'on_leave',
    location: 'Fort Hood, TX'
  },
  {
    id: 'PER-010',
    name: 'SPC Amanda White',
    specialization: 'Hydraulics & Suspension',
    currentAssignments: ['TNK-C-091'],
    availabilityStatus: 'assigned',
    location: 'Fort Benning, GA'
  },
  {
    id: 'PER-011',
    name: 'SGT Christopher Lee',
    specialization: 'Track & Transmission',
    currentAssignments: [],
    availabilityStatus: 'available',
    location: 'Fort Hood, TX'
  },
  {
    id: 'PER-012',
    name: 'SPC Sarah Harris',
    specialization: 'Fire Control Systems',
    currentAssignments: [],
    availabilityStatus: 'available',
    location: 'Fort Benning, GA'
  }
];

export const dummyWorkOrders: WorkOrder[] = [
  {
    id: 'WO-001',
    woNumber: 'WO-20251101-001',
    componentId: 'trk-002',
    tankId: 'TNK-B-087',
    partNumber: 'TRK-5589-A',
    partName: 'Track Link Assembly',
    quantity: 45,
    priority: 'critical',
    justification: 'Track system critical failure. Immediate replacement required to restore operational status.',
    vendor: 'General Dynamics Land Systems',
    estimatedCost: 12500,
    deliveryTimeline: '24-48 hours',
    status: 'pending',
    submittedBy: 'SPC Michael Brown',
    submittedAt: '2025-11-01T08:30:00Z'
  },
  {
    id: 'WO-002',
    woNumber: 'WO-20251031-002',
    componentId: 'hyd-002',
    tankId: 'TNK-B-087',
    partNumber: 'HYD-2234-B',
    partName: 'Hydraulic Pump Assembly',
    quantity: 2,
    priority: 'critical',
    justification: 'Hydraulic system pump failure detected during inspection. Replacement required for system integrity.',
    vendor: 'Honeywell Aerospace',
    estimatedCost: 8900,
    deliveryTimeline: '48-72 hours',
    status: 'approved',
    submittedBy: 'SPC Maria Rodriguez',
    submittedAt: '2025-10-31T14:20:00Z',
    approvedBy: 'CPT Anderson',
    approvedAt: '2025-10-31T16:45:00Z'
  },
  {
    id: 'WO-003',
    woNumber: 'WO-20251030-003',
    componentId: 'com-002',
    tankId: 'TNK-B-087',
    partNumber: 'COM-8821-C',
    partName: 'Radio Transceiver Unit',
    quantity: 1,
    priority: 'high',
    justification: 'Communications array showing degraded performance. Preventive replacement recommended.',
    vendor: 'Harris Corporation',
    estimatedCost: 15600,
    deliveryTimeline: '5-7 days',
    status: 'pending',
    submittedBy: 'SSG Jennifer Williams',
    submittedAt: '2025-10-30T11:15:00Z'
  }
];

export const dummyPartTransfers: PartTransfer[] = [
  {
    id: 'PT-001',
    componentId: 'sus-001',
    partId: 'SUS-4421-A',
    partName: 'Suspension Strut Assembly',
    sourceTankId: 'TNK-C-091',
    destinationTankId: 'TNK-A-042',
    quantity: 2,
    reason: 'Destination tank requires immediate suspension repair. Source tank has excess inventory.',
    transferPath: ['TNK-C-091', 'TNK-A-042'],
    estimatedTime: '6 hours',
    logisticsCost: 450,
    status: 'pending',
    submittedBy: 'SPC Robert Taylor',
    submittedAt: '2025-11-01T09:45:00Z'
  },
  {
    id: 'PT-002',
    componentId: 'pow-001',
    partId: 'POW-7732-B',
    partName: 'APU Starter Motor',
    sourceTankId: 'TNK-B-087',
    destinationTankId: 'TNK-C-091',
    quantity: 1,
    reason: 'Optimize parts distribution across battalion. Source tank overstocked.',
    transferPath: ['TNK-B-087', 'TNK-C-091'],
    estimatedTime: '8 hours',
    logisticsCost: 380,
    status: 'approved',
    submittedBy: 'SPC Kevin Martinez',
    submittedAt: '2025-10-30T13:20:00Z',
    approvedBy: 'CPT Anderson',
    approvedAt: '2025-10-30T15:30:00Z'
  }
];

export const dummyPersonnelAssignments: PersonnelAssignment[] = [
  {
    id: 'PA-001',
    componentId: 'fcs-001',
    tankId: 'TNK-A-042',
    personnelIds: ['PER-003', 'PER-012'],
    estimatedHours: 6,
    priority: 'medium',
    specialInstructions: 'Perform diagnostic check and software calibration on fire control system.',
    status: 'approved',
    submittedBy: 'SSG James Mitchell',
    submittedAt: '2025-10-31T10:00:00Z',
    approvedBy: 'CPT Anderson',
    approvedAt: '2025-10-31T11:30:00Z'
  },
  {
    id: 'PA-002',
    componentId: 'trk-001',
    tankId: 'TNK-A-042',
    personnelIds: ['PER-004', 'PER-011'],
    estimatedHours: 8,
    priority: 'high',
    specialInstructions: 'Inspect track system wear and replace damaged components as needed.',
    status: 'pending',
    submittedBy: 'SPC Michael Brown',
    submittedAt: '2025-11-01T07:30:00Z'
  }
];

export const dummyApprovalRequests: ApprovalRequest[] = [
  {
    id: 'APR-001',
    type: 'work_order',
    payload: dummyWorkOrders[0],
    submittedBy: 'SPC Michael Brown',
    submittedAt: '2025-11-01T08:30:00Z',
    status: 'pending'
  },
  {
    id: 'APR-002',
    type: 'work_order',
    payload: dummyWorkOrders[2],
    submittedBy: 'SSG Jennifer Williams',
    submittedAt: '2025-10-30T11:15:00Z',
    status: 'pending'
  },
  {
    id: 'APR-003',
    type: 'part_transfer',
    payload: dummyPartTransfers[0],
    submittedBy: 'SPC Robert Taylor',
    submittedAt: '2025-11-01T09:45:00Z',
    status: 'pending'
  },
  {
    id: 'APR-004',
    type: 'personnel_assignment',
    payload: dummyPersonnelAssignments[1],
    submittedBy: 'SPC Michael Brown',
    submittedAt: '2025-11-01T07:30:00Z',
    status: 'pending'
  }
];

export const tankNetwork: TankNetwork = {
  nodes: [
    { id: 'TNK-A-042', designation: 'M1A2 SEPv2', location: 'Fort Hood, TX', x: 100, y: 200 },
    { id: 'TNK-B-087', designation: 'M1A2 SEPv2', location: 'Fort Hood, TX', x: 300, y: 180 },
    { id: 'TNK-C-091', designation: 'M1A2 SEPv3', location: 'Fort Benning, GA', x: 500, y: 220 }
  ],
  edges: [
    { source: 'TNK-A-042', target: 'TNK-B-087', distance: 15, logisticsCost: 250, estimatedTime: '2 hours' },
    { source: 'TNK-B-087', target: 'TNK-C-091', distance: 420, logisticsCost: 1850, estimatedTime: '12 hours' },
    { source: 'TNK-A-042', target: 'TNK-C-091', distance: 435, logisticsCost: 1920, estimatedTime: '13 hours' }
  ]
};

