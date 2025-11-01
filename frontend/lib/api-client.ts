// API Client for Tank Maintenance Backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface PredictionsResponse {
  tankId: string;
  readinessScore: number;
  lastUpdated: string;
  components: Array<{
    id: string;
    name: string;
    health: number;
    status: 'operational' | 'degraded' | 'critical' | 'maintenance_required';
    hoursRemaining: number;
    lastServiced: string;
    nextService: string;
    drivers?: {feature: string; contribution: number}[];
    formula?: {
      alpha: number;
      beta: number;
      gamma: number;
      delta: number;
      weights: Record<string, number>;
      thresholds: Record<string, number>;
    };
  }>;
}

export interface MaintenanceResponse {
  tankId: string;
  events: Array<{
    id: string;
    date: string;
    type: 'scheduled' | 'unscheduled' | 'preventive';
    component: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export interface ActivityResponse {
  activities: Array<{
    id: number;
    tankId: string;
    agentName: string;
    action: string;
    status: string;
    details: Record<string, any>;
    timestamp: string;
  }>;
}

/**
 * Fetch component health predictions for a tank
 */
export async function fetchPredictions(tankId: string): Promise<PredictionsResponse> {
  const response = await fetch(`${API_BASE}/predictions?tank_id=${tankId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch predictions: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch maintenance schedule for a tank
 */
export async function fetchMaintenance(tankId: string): Promise<MaintenanceResponse> {
  const response = await fetch(`${API_BASE}/maintenance?tank_id=${tankId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch maintenance: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch recent agent activity for a tank
 */
export async function fetchActivity(tankId?: string, limit: number = 50): Promise<ActivityResponse> {
  const params = new URLSearchParams();
  if (tankId) params.set('tank_id', tankId);
  params.set('limit', limit.toString());
  
  const response = await fetch(`${API_BASE}/activity?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch activity: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Upload data files for ingestion
 */
export async function uploadData(
  tankId: string,
  files: {
    maintenance?: File;
    risk?: File;
    priority?: File;
    usage?: File;
    sensors?: File;
    logs?: File;
  }
): Promise<{
  jobId: string;
  tankId: string;
  status: string;
  filesProcessed: number;
  ingestedCounts: Record<string, number>;
  warnings: string[];
  errors: string[];
}> {
  const formData = new FormData();
  formData.append('tank_id', tankId);
  
  if (files.maintenance) formData.append('maintenance_file', files.maintenance);
  if (files.risk) formData.append('risk_file', files.risk);
  if (files.priority) formData.append('priority_file', files.priority);
  if (files.usage) formData.append('usage_file', files.usage);
  if (files.sensors) formData.append('sensors_file', files.sensors);
  if (files.logs) formData.append('logs_file', files.logs);
  
  const response = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to upload data');
  }
  
  return response.json();
}

