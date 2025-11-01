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

