import { TankComponent, MaintenanceEvent, MaintenanceWeights } from './types';

// Component Health Chart Data
export interface ComponentHealthChartData {
  date: string;
  [componentName: string]: number | string;
}

export interface RadarChartData {
  component: string;
  health: number;
  fullMark: number;
}

export interface HealthDistributionData {
  category: 'Optimal' | 'Good' | 'Degraded' | 'Critical';
  count: number;
  color: string;
}

// Maintenance Chart Data
export interface MaintenanceTimelineData {
  id: string;
  component: string;
  startDate: string;
  endDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed';
  type: 'scheduled' | 'unscheduled' | 'preventive';
  description: string;
}

export interface MaintenanceDistributionData {
  type: string;
  count: number;
  percentage: number;
}

export interface PriorityDistributionData {
  priority: string;
  count: number;
  color: string;
}

// Readiness Score Data
export interface ReadinessBreakdown {
  weight: string;
  value: number;
  color: string;
}

/**
 * Transform component health data for radar chart
 */
export function transformComponentsForRadar(
  components: TankComponent[]
): RadarChartData[] {
  return components.map((component) => ({
    component: component.name,
    health: component.health,
    fullMark: 100,
  }));
}

/**
 * Calculate health distribution across components
 */
export function calculateHealthDistribution(
  components: TankComponent[]
): HealthDistributionData[] {
  const distribution = {
    Optimal: 0,
    Good: 0,
    Degraded: 0,
    Critical: 0,
  };

  components.forEach((component) => {
    if (component.health >= 85) {
      distribution.Optimal++;
    } else if (component.health >= 70) {
      distribution.Good++;
    } else if (component.health >= 50) {
      distribution.Degraded++;
    } else {
      distribution.Critical++;
    }
  });

  return [
    {
      category: 'Optimal',
      count: distribution.Optimal,
      color: '#10b981', // green-500
    },
    {
      category: 'Good',
      count: distribution.Good,
      color: '#3b82f6', // blue-500
    },
    {
      category: 'Degraded',
      count: distribution.Degraded,
      color: '#f59e0b', // amber-500
    },
    {
      category: 'Critical',
      count: distribution.Critical,
      color: '#ef4444', // red-500
    },
  ];
}

/**
 * Transform maintenance events for timeline/Gantt chart
 */
export function transformMaintenanceForTimeline(
  events: MaintenanceEvent[]
): MaintenanceTimelineData[] {
  return events
    .filter((event) => event.status !== 'completed')
    .map((event) => {
      const startDate = new Date(event.date);
      const estimatedDuration = getMaintenanceDuration(event.priority, event.type);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + estimatedDuration);

      return {
        id: event.id,
        component: event.component,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        priority: event.priority,
        status: event.status,
        type: event.type,
        description: event.description,
      };
    });
}

/**
 * Get estimated maintenance duration in days based on priority and type
 */
function getMaintenanceDuration(
  priority: string,
  type: string
): number {
  const baseDuration: Record<string, Record<string, number>> = {
    critical: { scheduled: 3, unscheduled: 2, preventive: 5 },
    high: { scheduled: 2, unscheduled: 1, preventive: 4 },
    medium: { scheduled: 1, unscheduled: 1, preventive: 3 },
    low: { scheduled: 1, unscheduled: 1, preventive: 2 },
  };

  return baseDuration[priority]?.[type] || 1;
}

/**
 * Calculate maintenance type distribution
 */
export function calculateMaintenanceTypeDistribution(
  events: MaintenanceEvent[]
): MaintenanceDistributionData[] {
  const distribution: Record<string, number> = {
    scheduled: 0,
    preventive: 0,
    unscheduled: 0,
  };

  events.forEach((event) => {
    distribution[event.type]++;
  });

  const total = events.length;
  
  return [
    {
      type: 'Scheduled',
      count: distribution.scheduled,
      percentage: total > 0 ? Math.round((distribution.scheduled / total) * 100) : 0,
    },
    {
      type: 'Preventive',
      count: distribution.preventive,
      percentage: total > 0 ? Math.round((distribution.preventive / total) * 100) : 0,
    },
    {
      type: 'Unscheduled',
      count: distribution.unscheduled,
      percentage: total > 0 ? Math.round((distribution.unscheduled / total) * 100) : 0,
    },
  ];
}

/**
 * Calculate priority distribution
 */
export function calculatePriorityDistribution(
  events: MaintenanceEvent[]
): PriorityDistributionData[] {
  const distribution: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  events.forEach((event) => {
    distribution[event.priority]++;
  });

  return [
    {
      priority: 'Critical',
      count: distribution.critical,
      color: '#ef4444', // red-500
    },
    {
      priority: 'High',
      count: distribution.high,
      color: '#f97316', // orange-500
    },
    {
      priority: 'Medium',
      count: distribution.medium,
      color: '#f59e0b', // amber-500
    },
    {
      priority: 'Low',
      count: distribution.low,
      color: '#3b82f6', // blue-500
    },
  ];
}

/**
 * Transform maintenance weights for readiness breakdown donut chart
 */
export function transformWeightsForReadinessBreakdown(
  weights: MaintenanceWeights
): ReadinessBreakdown[] {
  const colors = [
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#f59e0b', // amber-500
    '#f97316', // orange-500
    '#8b5cf6', // purple-500
    '#06b6d4', // cyan-500
  ];

  const weightEntries = Object.entries(weights);
  const formatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return weightEntries.map(([key, value], index) => ({
    weight: formatLabel(key),
    value: value,
    color: colors[index % colors.length],
  }));
}

/**
 * Generate historical health data (dummy for now, will be replaced with real data)
 * Optimized to prevent memory issues by limiting data points
 */
export function generateHistoricalHealthData(
  components: TankComponent[],
  days: number = 30
): ComponentHealthChartData[] {
  // Limit to prevent memory issues
  const safeDays = Math.min(days, 30);
  const maxComponents = 10; // Limit components to prevent memory overflow
  const limitedComponents = components.slice(0, maxComponents);
  
  const data: ComponentHealthChartData[] = [];
  const today = new Date();

  // Use fewer data points for performance
  const step = safeDays > 15 ? 2 : 1; // Skip days if > 15 days
  const actualDays = Math.floor(safeDays / step);

  for (let i = actualDays; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - (i * step));
    const dateStr = date.toISOString().split('T')[0];

    const entry: ComponentHealthChartData = {
      date: dateStr,
    };

    limitedComponents.forEach((component) => {
      // Simulate slight variation in health over time
      const baseHealth = component.health;
      const variation = Math.sin((i * step) / 5) * 2; // Small variation
      entry[component.name] = Math.max(0, Math.min(100, baseHealth + variation));
    });

    data.push(entry);
  }

  return data;
}

/**
 * Get critical components (health < 50 or hoursRemaining < 50)
 */
export function getCriticalComponents(components: TankComponent[]): TankComponent[] {
  return components.filter(
    (c) => c.health < 50 || c.hoursRemaining < 50 || c.status === 'critical'
  );
}

/**
 * Get upcoming maintenance (next 30 days)
 */
export function getUpcomingMaintenance(
  events: MaintenanceEvent[],
  days: number = 30
): MaintenanceEvent[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + days);

  return events
    .filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate <= cutoffDate && event.status !== 'completed';
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
}

