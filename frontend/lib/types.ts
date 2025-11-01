export interface MaintenanceWeights {
  operatingHours: number;
  environmentalConditions: number;
  componentAge: number;
  missionCriticality: number;
  maintenanceHistory: number;
  partsAvailability: number;
}

export interface TankComponent {
  id: string;
  name: string;
  health: number;
  status: 'operational' | 'degraded' | 'critical' | 'maintenance_required';
  lastServiced: string;
  nextService: string;
  hoursRemaining: number;
  drivers?: {feature: string; contribution: number}[];
  formula?: {
    alpha: number;
    beta: number;
    gamma: number;
    delta: number;
    weights: Record<string, number>;
    thresholds: Record<string, number>;
  };
}

export interface MaintenanceEvent {
  id: string;
  date: string;
  type: 'scheduled' | 'unscheduled' | 'preventive';
  component: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface PartInventory {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
  minQuantity: number;
  status: 'available' | 'low_stock' | 'critical' | 'out_of_stock';
  estimatedDelivery?: string;
}

export interface Tank {
  id: string;
  designation: string;
  model: string;
  serialNumber: string;
  operatingHours: number;
  location: string;
  status: 'operational' | 'maintenance' | 'standby' | 'critical';
  readinessScore: number;
  lastInspection: string;
  components: TankComponent[];
  maintenanceEvents: MaintenanceEvent[];
  partsInventory: PartInventory[];
}

export interface Personnel {
  id: string;
  name: string;
  specialization: string;
  currentAssignments: string[];
  availabilityStatus: 'available' | 'assigned' | 'on_leave' | 'unavailable';
  location: string;
}

export interface WorkOrder {
  id: string;
  woNumber: string;
  componentId: string;
  tankId: string;
  partNumber: string;
  partName: string;
  quantity: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  justification: string;
  vendor: string;
  estimatedCost: number;
  deliveryTimeline: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
  submittedBy: string;
  submittedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface PartTransfer {
  id: string;
  componentId: string;
  partId: string;
  partName: string;
  sourceTankId: string;
  destinationTankId: string;
  quantity: number;
  reason: string;
  transferPath: string[];
  estimatedTime: string;
  logisticsCost: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
  submittedBy: string;
  submittedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface PersonnelAssignment {
  id: string;
  componentId: string;
  tankId: string;
  personnelIds: string[];
  estimatedHours: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  specialInstructions: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
  submittedBy: string;
  submittedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface RepairRecommendation {
  type: 'assign' | 'order' | 'transfer';
  confidence: number;
  reasoning: string;
  estimatedTime: string;
  estimatedCost: number;
  recommendedAction: PersonnelAssignment | WorkOrder | PartTransfer;
}

export interface ApprovalRequest {
  id: string;
  type: 'work_order' | 'part_transfer' | 'personnel_assignment';
  payload: WorkOrder | PartTransfer | PersonnelAssignment;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  comments?: string;
}

export interface TankNode {
  id: string;
  designation: string;
  location: string;
  x?: number;
  y?: number;
}

export interface TransferEdge {
  source: string;
  target: string;
  distance: number;
  logisticsCost: number;
  estimatedTime: string;
}

export interface TankNetwork {
  nodes: TankNode[];
  edges: TransferEdge[];
}

