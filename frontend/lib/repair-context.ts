/**
 * Repair Context Manager
 * Manages context storage and retrieval for the repair workflow
 */

import { TankComponent, Tank, RepairRecommendation, MaintenanceEvent } from './types';
import { historicalRepairs, type HistoricalRepair } from './dummy-data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ComponentHealthHistory {
  date: string;
  health: number;
  status: string;
  notes?: string;
}

export interface RepairContext {
  component: TankComponent;
  tank: Tank;
  aiRecommendation?: RepairRecommendation;
  healthHistory?: ComponentHealthHistory[];
  maintenanceHistory?: MaintenanceEvent[];
  historicalRepairs?: HistoricalRepair[];
  userSelections?: Record<string, any>;
  timestamp?: string;
}

export class RepairContextManager {
  /**
   * Store repair workflow context on the backend
   */
  static async storeContext(componentId: string, context: Partial<RepairContext>): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/repair/context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          componentId,
          ...context,
        }),
      });

      if (!response.ok) {
        console.error('Failed to store context:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error storing repair context:', error);
      return false;
    }
  }

  /**
   * Retrieve stored repair workflow context from the backend
   */
  static async getContext(componentId: string): Promise<RepairContext | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/repair/context/${componentId}`);

      if (!response.ok) {
        console.error('Failed to retrieve context:', await response.text());
        return null;
      }

      const data = await response.json();
      return data.context as RepairContext;
    } catch (error) {
      console.error('Error retrieving repair context:', error);
      return null;
    }
  }

  /**
   * Update user selections in the repair context
   */
  static async updateUserSelection(
    componentId: string,
    selectionKey: string,
    value: any
  ): Promise<boolean> {
    try {
      // First, get existing context
      const existingContext = await this.getContext(componentId);

      const userSelections = existingContext?.userSelections || {};
      userSelections[selectionKey] = value;

      // Store updated context
      return await this.storeContext(componentId, {
        ...existingContext,
        userSelections,
      });
    } catch (error) {
      console.error('Error updating user selection:', error);
      return false;
    }
  }

  /**
   * Build comprehensive context for a component repair
   */
  static buildRepairContext(
    component: TankComponent,
    tank: Tank,
    recommendation?: RepairRecommendation
  ): RepairContext {
    // Get historical repairs for this component type
    const componentType = component.id.split('-')[0];
    const relevantRepairs = historicalRepairs.filter(
      (repair) => repair.componentId.startsWith(componentType)
    );

    // Build health history from component data
    const healthHistory: ComponentHealthHistory[] = [
      {
        date: component.lastServiced,
        health: component.health + 15, // Previous state
        status: 'operational',
        notes: 'Last service completed'
      },
      {
        date: new Date().toISOString().split('T')[0],
        health: component.health,
        status: component.status,
        notes: 'Current state'
      }
    ];

    return {
      component,
      tank,
      aiRecommendation: recommendation,
      healthHistory,
      maintenanceHistory: tank.maintenanceEvents.filter(
        (event) => event.component === component.name
      ),
      historicalRepairs: relevantRepairs,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clear stored context for a component
   */
  static async clearContext(componentId: string): Promise<boolean> {
    try {
      return await this.storeContext(componentId, {
        component: {} as TankComponent,
        tank: {} as Tank,
        userSelections: {},
      });
    } catch (error) {
      console.error('Error clearing repair context:', error);
      return false;
    }
  }

  /**
   * Check if context exists for a component
   */
  static async hasContext(componentId: string): Promise<boolean> {
    const context = await this.getContext(componentId);
    return context !== null && Object.keys(context).length > 0;
  }
}

export default RepairContextManager;

