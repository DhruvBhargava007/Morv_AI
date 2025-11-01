// Mock data for military vehicle parts
export const partsData = {
  'turret': {
    id: 'turret',
    name: 'Main Turret',
    description: 'Primary weapon mounting system with 360-degree rotation capability',
    status: 'operational',
    lastMaintenance: '2024-01-15',
    nextMaintenance: '2024-04-15',
    maintenanceHistory: [
      { date: '2024-01-15', type: 'Preventive', technician: 'Sgt. Johnson', notes: 'Replaced hydraulic seals, tested rotation' },
      { date: '2023-10-20', type: 'Inspection', technician: 'Cpl. Martinez', notes: 'Routine inspection, no issues found' },
      { date: '2023-07-10', type: 'Repair', technician: 'Sgt. Johnson', notes: 'Fixed rotation motor, replaced bearings' },
    ],
    aiPrediction: {
      riskLevel: 'low',
      predictedFailure: '2024-05-20',
      confidence: 0.85,
      recommendation: 'Schedule preventive maintenance before predicted failure date'
    }
  },
  'engine': {
    id: 'engine',
    name: 'Main Engine',
    description: 'Multi-fuel diesel engine, 1500 HP output',
    status: 'operational',
    lastMaintenance: '2024-01-10',
    nextMaintenance: '2024-02-10',
    maintenanceHistory: [
      { date: '2024-01-10', type: 'Preventive', technician: 'Sgt. Williams', notes: 'Oil change, filter replacement, compression test' },
      { date: '2023-11-05', type: 'Inspection', technician: 'Cpl. Davis', notes: 'Visual inspection, checked coolant levels' },
      { date: '2023-08-15', type: 'Repair', technician: 'Sgt. Williams', notes: 'Replaced fuel injectors, tuned timing' },
    ],
    aiPrediction: {
      riskLevel: 'medium',
      predictedFailure: '2024-03-25',
      confidence: 0.78,
      recommendation: 'Monitor engine performance closely, schedule maintenance within 6 weeks'
    }
  },
  'tracks': {
    id: 'tracks',
    name: 'Tracks & Suspension',
    description: 'Heavy-duty tracks with independent suspension system',
    status: 'operational',
    lastMaintenance: '2024-01-05',
    nextMaintenance: '2024-03-05',
    maintenanceHistory: [
      { date: '2024-01-05', type: 'Preventive', technician: 'Cpl. Brown', notes: 'Track tension adjustment, inspected road wheels' },
      { date: '2023-09-18', type: 'Repair', technician: 'Sgt. Miller', notes: 'Replaced worn track pads, serviced suspension' },
      { date: '2023-06-12', type: 'Inspection', technician: 'Cpl. Brown', notes: 'Routine inspection, minor adjustments' },
    ],
    aiPrediction: {
      riskLevel: 'low',
      predictedFailure: '2024-04-10',
      confidence: 0.72,
      recommendation: 'Tracks in good condition, continue regular inspections'
    }
  },
  'armor': {
    id: 'armor',
    name: 'Hull Armor',
    description: 'Composite armor system protecting vehicle structure',
    status: 'operational',
    lastMaintenance: '2024-01-20',
    nextMaintenance: '2024-05-20',
    maintenanceHistory: [
      { date: '2024-01-20', type: 'Inspection', technician: 'Sgt. Taylor', notes: 'Visual inspection, checked for cracks or damage' },
      { date: '2023-12-01', type: 'Preventive', technician: 'Cpl. Anderson', notes: 'Armor panel integrity test, passed all checks' },
      { date: '2023-09-05', type: 'Inspection', technician: 'Sgt. Taylor', notes: 'Routine structural inspection' },
    ],
    aiPrediction: {
      riskLevel: 'low',
      predictedFailure: 'N/A',
      confidence: 0.95,
      recommendation: 'Armor system integrity excellent, no maintenance needed'
    }
  },
  'optics': {
    id: 'optics',
    name: 'Targeting Optics',
    description: 'Advanced fire control and targeting system',
    status: 'operational',
    lastMaintenance: '2024-01-18',
    nextMaintenance: '2024-03-18',
    maintenanceHistory: [
      { date: '2024-01-18', type: 'Preventive', technician: 'Cpl. Wilson', notes: 'Calibrated targeting system, cleaned lenses' },
      { date: '2023-10-25', type: 'Repair', technician: 'Sgt. Moore', notes: 'Fixed image stabilization, replaced sensor' },
      { date: '2023-07-30', type: 'Inspection', technician: 'Cpl. Wilson', notes: 'System functionality test' },
    ],
    aiPrediction: {
      riskLevel: 'medium',
      predictedFailure: '2024-03-15',
      confidence: 0.80,
      recommendation: 'Schedule calibration and inspection before predicted date'
    }
  },
  'transmission': {
    id: 'transmission',
    name: 'Transmission System',
    description: 'Automatic transmission with torque converter',
    status: 'operational',
    lastMaintenance: '2024-01-12',
    nextMaintenance: '2024-04-12',
    maintenanceHistory: [
      { date: '2024-01-12', type: 'Preventive', technician: 'Sgt. Jackson', notes: 'Transmission fluid change, filter replacement' },
      { date: '2023-09-20', type: 'Inspection', technician: 'Cpl. White', notes: 'Checked transmission performance, no issues' },
      { date: '2023-05-15', type: 'Repair', technician: 'Sgt. Jackson', notes: 'Replaced transmission seals, fixed shifting issue' },
    ],
    aiPrediction: {
      riskLevel: 'low',
      predictedFailure: '2024-06-01',
      confidence: 0.75,
      recommendation: 'Transmission performing well, continue regular maintenance schedule'
    }
  }
};

