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
    { id: 'TNK-A-047', designation: 'Alpha-047', location: 'Fort Irwin, CA', x: 100, y: 200 },
    { id: 'TNK-B-023', designation: 'Bravo-023', location: 'Fort Hood, TX', x: 300, y: 180 },
    { id: 'TNK-C-091', designation: 'Charlie-091', location: 'Fort Benning, GA', x: 500, y: 220 }
  ],
  edges: [
    { source: 'TNK-A-047', target: 'TNK-B-023', distance: 1850, logisticsCost: 2500, estimatedTime: '18 hours' },
    { source: 'TNK-B-023', target: 'TNK-C-091', distance: 1320, logisticsCost: 1850, estimatedTime: '13 hours' },
    { source: 'TNK-A-047', target: 'TNK-C-091', distance: 2940, logisticsCost: 3920, estimatedTime: '29 hours' }
  ]
};

// Enhanced Personnel with additional details
export interface PersonnelExtended extends Personnel {
  certifications: string[];
  experienceYears: number;
  hourlyRate: number;
  performanceScore: number;
  recentAssignments: string[];
}

export const extendedPersonnel: PersonnelExtended[] = [
  {
    id: 'PER-001',
    name: 'SSG James Mitchell',
    specialization: 'Engine Mechanics',
    certifications: ['ASE Master Technician', 'Diesel Specialist', 'Heavy Equipment'],
    experienceYears: 8,
    currentAssignments: ['TNK-A-042'],
    availabilityStatus: 'assigned',
    location: 'Fort Hood, TX',
    hourlyRate: 45,
    performanceScore: 92,
    recentAssignments: ['eng-001', 'eng-003', 'pow-001']
  },
  {
    id: 'PER-002',
    name: 'SPC Maria Rodriguez',
    specialization: 'Hydraulics & Suspension',
    certifications: ['Hydraulic Systems', 'Pneumatic Systems', 'Safety Inspector'],
    experienceYears: 5,
    currentAssignments: [],
    availabilityStatus: 'available',
    location: 'Fort Hood, TX',
    hourlyRate: 38,
    performanceScore: 88,
    recentAssignments: ['hyd-001', 'sus-002']
  },
  {
    id: 'PER-003',
    name: 'SGT David Chen',
    specialization: 'Fire Control Systems',
    certifications: ['Advanced Electronics', 'Ballistic Computer', 'Targeting Systems'],
    experienceYears: 10,
    currentAssignments: ['TNK-A-042', 'TNK-C-091'],
    availabilityStatus: 'assigned',
    location: 'Fort Hood, TX',
    hourlyRate: 52,
    performanceScore: 95,
    recentAssignments: ['fcs-001', 'fcs-003']
  },
  {
    id: 'PER-004',
    name: 'SPC Robert Taylor',
    specialization: 'Track & Transmission',
    certifications: ['Track Systems', 'Transmission Repair', 'Drivetrain'],
    experienceYears: 4,
    currentAssignments: [],
    availabilityStatus: 'available',
    location: 'Fort Benning, GA',
    hourlyRate: 36,
    performanceScore: 85,
    recentAssignments: ['trk-001', 'trn-002']
  },
  {
    id: 'PER-005',
    name: 'SSG Jennifer Williams',
    specialization: 'Communications & Electronics',
    certifications: ['Radio Systems', 'Satellite Comm', 'Network Security'],
    experienceYears: 9,
    currentAssignments: ['TNK-B-087'],
    availabilityStatus: 'assigned',
    location: 'Fort Hood, TX',
    hourlyRate: 48,
    performanceScore: 91,
    recentAssignments: ['com-001', 'com-004']
  },
  {
    id: 'PER-006',
    name: 'SPC Michael Brown',
    specialization: 'General Maintenance',
    certifications: ['Basic Repair', 'Preventive Maintenance', 'Tool Specialist'],
    experienceYears: 3,
    currentAssignments: [],
    availabilityStatus: 'available',
    location: 'Fort Hood, TX',
    hourlyRate: 32,
    performanceScore: 80,
    recentAssignments: ['arm-001', 'pow-002']
  },
  {
    id: 'PER-007',
    name: 'SGT Lisa Anderson',
    specialization: 'Armor & Structural',
    certifications: ['Welding', 'Armor Plate', 'Structural Integrity'],
    experienceYears: 7,
    currentAssignments: ['TNK-B-087'],
    availabilityStatus: 'assigned',
    location: 'Fort Benning, GA',
    hourlyRate: 44,
    performanceScore: 87,
    recentAssignments: ['arm-001', 'arm-003']
  },
  {
    id: 'PER-008',
    name: 'SPC Kevin Martinez',
    specialization: 'Power Systems',
    certifications: ['Electrical Systems', 'Battery Systems', 'Generator Repair'],
    experienceYears: 4,
    currentAssignments: [],
    availabilityStatus: 'available',
    location: 'Fort Hood, TX',
    hourlyRate: 36,
    performanceScore: 83,
    recentAssignments: ['pow-001', 'pow-003']
  },
  {
    id: 'PER-009',
    name: 'SSG Thomas Jackson',
    specialization: 'Engine Mechanics',
    certifications: ['ASE Certified', 'Turbine Engines', 'Fuel Systems'],
    experienceYears: 12,
    currentAssignments: [],
    availabilityStatus: 'on_leave',
    location: 'Fort Hood, TX',
    hourlyRate: 50,
    performanceScore: 94,
    recentAssignments: []
  },
  {
    id: 'PER-010',
    name: 'SPC Amanda White',
    specialization: 'Hydraulics & Suspension',
    certifications: ['Hydraulic Specialist', 'Suspension Expert'],
    experienceYears: 3,
    currentAssignments: ['TNK-C-091'],
    availabilityStatus: 'assigned',
    location: 'Fort Benning, GA',
    hourlyRate: 35,
    performanceScore: 82,
    recentAssignments: ['hyd-002', 'sus-001']
  },
  {
    id: 'PER-011',
    name: 'SGT Christopher Lee',
    specialization: 'Track & Transmission',
    certifications: ['Advanced Drivetrain', 'Track Systems', 'Clutch Specialist'],
    experienceYears: 6,
    currentAssignments: [],
    availabilityStatus: 'available',
    location: 'Fort Hood, TX',
    hourlyRate: 42,
    performanceScore: 89,
    recentAssignments: ['trk-002', 'trn-001']
  },
  {
    id: 'PER-012',
    name: 'SPC Sarah Harris',
    specialization: 'Fire Control Systems',
    certifications: ['Electronics', 'Computer Systems', 'Optics'],
    experienceYears: 3,
    currentAssignments: [],
    availabilityStatus: 'available',
    location: 'Fort Benning, GA',
    hourlyRate: 35,
    performanceScore: 86,
    recentAssignments: ['fcs-002']
  }
];

// Vendor Database with Performance Metrics
export interface VendorData {
  name: string;
  specialties: string[];
  avgLeadTimeDays: { [key: string]: number };
  reliabilityScore: number;
  costFactor: number;
  contactInfo: string;
}

export const vendorDatabase: VendorData[] = [
  {
    name: 'General Dynamics Land Systems',
    specialties: ['Engine', 'Transmission', 'Track', 'Armor'],
    avgLeadTimeDays: { critical: 2, high: 3, medium: 5, low: 7 },
    reliabilityScore: 95,
    costFactor: 1.2,
    contactInfo: 'parts@gdls.com | 1-800-555-0101'
  },
  {
    name: 'Honeywell Aerospace',
    specialties: ['Hydraulic', 'Power Systems', 'APU'],
    avgLeadTimeDays: { critical: 2, high: 4, medium: 6, low: 10 },
    reliabilityScore: 92,
    costFactor: 1.1,
    contactInfo: 'defense@honeywell.com | 1-800-555-0102'
  },
  {
    name: 'BAE Systems',
    specialties: ['Armor', 'Weapons', 'Fire Control', 'Ammunition'],
    avgLeadTimeDays: { critical: 3, high: 5, medium: 7, low: 14 },
    reliabilityScore: 90,
    costFactor: 1.3,
    contactInfo: 'support@baesystems.com | 1-800-555-0103'
  },
  {
    name: 'Lockheed Martin',
    specialties: ['Fire Control', 'Electronics', 'Sensors', 'Optics'],
    avgLeadTimeDays: { critical: 2, high: 4, medium: 6, low: 12 },
    reliabilityScore: 93,
    costFactor: 1.4,
    contactInfo: 'defense@lockheedmartin.com | 1-800-555-0104'
  },
  {
    name: 'Raytheon Technologies',
    specialties: ['Electronics', 'Sensors', 'Targeting', 'Communications'],
    avgLeadTimeDays: { critical: 3, high: 5, medium: 8, low: 15 },
    reliabilityScore: 88,
    costFactor: 1.25,
    contactInfo: 'parts@raytheon.com | 1-800-555-0105'
  },
  {
    name: 'Harris Corporation',
    specialties: ['Communications', 'Radio', 'Electronics', 'Antennas'],
    avgLeadTimeDays: { critical: 2, high: 3, medium: 5, low: 8 },
    reliabilityScore: 91,
    costFactor: 1.15,
    contactInfo: 'support@harris.com | 1-800-555-0106'
  },
  {
    name: 'L3Harris Technologies',
    specialties: ['Communications', 'Electronics', 'Night Vision'],
    avgLeadTimeDays: { critical: 2, high: 4, medium: 6, low: 10 },
    reliabilityScore: 89,
    costFactor: 1.2,
    contactInfo: 'orders@l3harris.com | 1-800-555-0107'
  }
];

// Historical Repair Records
export interface HistoricalRepair {
  id: string;
  componentId: string;
  componentName: string;
  date: string;
  repairType: 'personnel_assignment' | 'work_order' | 'part_transfer';
  personnelUsed?: string[];
  partsUsed?: Array<{ partNumber: string; partName: string; quantity: number }>;
  vendor?: string;
  actualCost: number;
  estimatedCost: number;
  actualHours: number;
  estimatedHours: number;
  outcome: 'success' | 'partial_success' | 'failed';
  healthBefore: number;
  healthAfter: number;
  notes: string;
}

export const historicalRepairs: HistoricalRepair[] = [
  {
    id: 'REP-001',
    componentId: 'eng-001',
    componentName: 'Main Engine',
    date: '2025-08-15',
    repairType: 'personnel_assignment',
    personnelUsed: ['PER-001'],
    actualCost: 450,
    estimatedCost: 500,
    actualHours: 6,
    estimatedHours: 6,
    outcome: 'success',
    healthBefore: 68,
    healthAfter: 92,
    notes: 'Oil filter replacement and system flush completed successfully.'
  },
  {
    id: 'REP-002',
    componentId: 'hyd-001',
    componentName: 'Hydraulic System',
    date: '2025-09-01',
    repairType: 'work_order',
    partsUsed: [{ partNumber: 'HYD-5580', partName: 'Hydraulic Seals Kit', quantity: 2 }],
    vendor: 'Honeywell Aerospace',
    actualCost: 2450,
    estimatedCost: 2500,
    actualHours: 4,
    estimatedHours: 5,
    outcome: 'success',
    healthBefore: 48,
    healthAfter: 85,
    notes: 'Seal replacement and pressure testing completed.'
  },
  {
    id: 'REP-003',
    componentId: 'sus-001',
    componentName: 'Suspension System',
    date: '2025-08-22',
    repairType: 'part_transfer',
    partsUsed: [{ partNumber: 'SUS-4421-A', partName: 'Suspension Strut Assembly', quantity: 2 }],
    actualCost: 450,
    estimatedCost: 500,
    actualHours: 5,
    estimatedHours: 6,
    outcome: 'success',
    healthBefore: 62,
    healthAfter: 88,
    notes: 'Parts transferred from TNK-C-091. Installation completed ahead of schedule.'
  },
  {
    id: 'REP-004',
    componentId: 'fcs-001',
    componentName: 'Fire Control System',
    date: '2025-09-10',
    repairType: 'personnel_assignment',
    personnelUsed: ['PER-003', 'PER-012'],
    actualCost: 300,
    estimatedCost: 350,
    actualHours: 3,
    estimatedHours: 4,
    outcome: 'success',
    healthBefore: 82,
    healthAfter: 95,
    notes: 'Software update and sensor calibration completed.'
  },
  {
    id: 'REP-005',
    componentId: 'com-001',
    componentName: 'Communications Array',
    date: '2025-08-05',
    repairType: 'work_order',
    partsUsed: [{ partNumber: 'COM-8845-M', partName: 'Communications Module', quantity: 1 }],
    vendor: 'Harris Corporation',
    actualCost: 15600,
    estimatedCost: 15000,
    actualHours: 8,
    estimatedHours: 8,
    outcome: 'success',
    healthBefore: 35,
    healthAfter: 88,
    notes: 'Complete module replacement. Extended testing performed.'
  },
  {
    id: 'REP-006',
    componentId: 'trn-001',
    componentName: 'Transmission',
    date: '2025-07-10',
    repairType: 'personnel_assignment',
    personnelUsed: ['PER-004', 'PER-011'],
    actualCost: 600,
    estimatedCost: 700,
    actualHours: 8,
    estimatedHours: 10,
    outcome: 'success',
    healthBefore: 71,
    healthAfter: 91,
    notes: 'Fluid change and clutch adjustment. No parts needed.'
  }
];

// Part Number Database
export interface PartSpec {
  partNumber: string;
  partName: string;
  category: string;
  componentTypes: string[];
  unitCost: number;
  weight: number;
  criticality: 'high' | 'medium' | 'low';
  shelfLife: string;
  specifications: string;
}

export const partDatabase: PartSpec[] = [
  {
    partNumber: 'ENG-7720-F',
    partName: 'Engine Oil Filter',
    category: 'Engine',
    componentTypes: ['eng-001'],
    unitCost: 85,
    weight: 2.5,
    criticality: 'medium',
    shelfLife: '2 years',
    specifications: 'High-capacity filtration, 25 micron'
  },
  {
    partNumber: 'HYD-5580',
    partName: 'Hydraulic Seals Kit',
    category: 'Hydraulic',
    componentTypes: ['hyd-001'],
    unitCost: 1225,
    weight: 5.0,
    criticality: 'high',
    shelfLife: '5 years',
    specifications: 'Complete seal kit for main hydraulic system'
  },
  {
    partNumber: 'HYD-2234-B',
    partName: 'Hydraulic Pump Assembly',
    category: 'Hydraulic',
    componentTypes: ['hyd-001'],
    unitCost: 4450,
    weight: 45.0,
    criticality: 'high',
    shelfLife: '10 years',
    specifications: '3000 PSI capacity, variable displacement'
  },
  {
    partNumber: 'TRK-2040-B',
    partName: 'Track Links',
    category: 'Track',
    componentTypes: ['trk-001'],
    unitCost: 125,
    weight: 12.0,
    criticality: 'medium',
    shelfLife: 'Indefinite',
    specifications: 'Reinforced steel, 63 links per side'
  },
  {
    partNumber: 'TRN-3310-L',
    partName: 'Transmission Fluid',
    category: 'Transmission',
    componentTypes: ['trn-001'],
    unitCost: 45,
    weight: 20.0,
    criticality: 'medium',
    shelfLife: '3 years',
    specifications: 'Synthetic ATF, 20L capacity'
  },
  {
    partNumber: 'SUS-1240-W',
    partName: 'Road Wheels',
    category: 'Suspension',
    componentTypes: ['sus-001'],
    unitCost: 850,
    weight: 95.0,
    criticality: 'high',
    shelfLife: 'Indefinite',
    specifications: 'Heavy-duty steel, rubber-tired'
  },
  {
    partNumber: 'SUS-4421-A',
    partName: 'Suspension Strut Assembly',
    category: 'Suspension',
    componentTypes: ['sus-001'],
    unitCost: 2200,
    weight: 65.0,
    criticality: 'high',
    shelfLife: '15 years',
    specifications: 'Torsion bar suspension, adjustable'
  },
  {
    partNumber: 'FCS-9920-C',
    partName: 'Fire Control Computer Module',
    category: 'Fire Control',
    componentTypes: ['fcs-001'],
    unitCost: 12500,
    weight: 8.0,
    criticality: 'high',
    shelfLife: '10 years',
    specifications: 'Ballistic computer, environmental sealed'
  },
  {
    partNumber: 'COM-8845-M',
    partName: 'Communications Module',
    category: 'Communications',
    componentTypes: ['com-001'],
    unitCost: 15600,
    weight: 12.0,
    criticality: 'high',
    shelfLife: '8 years',
    specifications: 'Multi-band transceiver, encrypted'
  },
  {
    partNumber: 'COM-8850-A',
    partName: 'Antenna Assembly',
    category: 'Communications',
    componentTypes: ['com-001'],
    unitCost: 750,
    weight: 3.5,
    criticality: 'medium',
    shelfLife: '10 years',
    specifications: 'Multi-frequency, ruggedized'
  }
];

