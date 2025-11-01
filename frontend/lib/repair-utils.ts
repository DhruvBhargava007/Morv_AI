import { Personnel, TankComponent, Tank, RepairRecommendation, WorkOrder, PartTransfer, PersonnelAssignment } from './types';

export function generateWONumber(): string {
  const prefix = 'WO';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

export function generateTransferId(): string {
  const prefix = 'PT';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

export function generateAssignmentId(): string {
  const prefix = 'PA';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

export function checkPersonnelAvailability(
  personnel: Personnel,
  requiredHours: number
): boolean {
  if (personnel.availabilityStatus !== 'available') return false;
  // Simple logic: if person has less than 3 current assignments, they're available
  return personnel.currentAssignments.length < 3;
}

export function calculateTransferPath(
  sourceTankId: string,
  destinationTankId: string,
  allTanks: Tank[]
): { path: string[]; distance: number; estimatedTime: string; logisticsCost: number } {
  // Simplified path calculation
  // In real implementation, this would use graph algorithms
  
  const source = allTanks.find(t => t.id === sourceTankId);
  const destination = allTanks.find(t => t.id === destinationTankId);
  
  if (!source || !destination) {
    return {
      path: [sourceTankId, destinationTankId],
      distance: 0,
      estimatedTime: '0 hours',
      logisticsCost: 0
    };
  }
  
  // Simple direct path for now
  const distance = Math.floor(Math.random() * 500) + 100; // km
  const timeHours = Math.ceil(distance / 60); // Assume 60 km/h average
  const cost = distance * 2.5; // $2.5 per km
  
  return {
    path: [sourceTankId, destinationTankId],
    distance,
    estimatedTime: `${timeHours} hours`,
    logisticsCost: Math.round(cost)
  };
}

export function getAIRecommendation(
  component: TankComponent,
  tank: Tank,
  availablePersonnel: Personnel[],
  allTanks: Tank[]
): RepairRecommendation {
  // AI logic to determine best repair option
  // This is a simplified version - in production, this would call an actual AI model
  
  const health = component.health;
  const hoursRemaining = component.hoursRemaining;
  
  // Critical components need immediate attention
  if (health < 50 || component.status === 'critical') {
    // Check if we have parts in inventory
    const hasParts = tank.partsInventory.some(
      p => p.name.toLowerCase().includes(component.name.toLowerCase().split(' ')[0]) && 
      p.quantity > 0
    );
    
    if (hasParts && availablePersonnel.length > 0) {
      // Recommend personnel assignment if we have parts and people
      return {
        type: 'assign',
        confidence: 92,
        reasoning: 'Component is in critical condition. Parts are available in inventory and qualified personnel are ready for immediate deployment.',
        estimatedTime: '4-6 hours',
        estimatedCost: 2500,
        recommendedAction: {} as PersonnelAssignment
      };
    } else {
      // Check if other tanks have the part
      const otherTanksWithPart = allTanks.filter(
        t => t.id !== tank.id && 
        t.partsInventory.some(p => 
          p.name.toLowerCase().includes(component.name.toLowerCase().split(' ')[0]) &&
          p.quantity > p.minQuantity
        )
      );
      
      if (otherTanksWithPart.length > 0) {
        return {
          type: 'transfer',
          confidence: 85,
          reasoning: 'Critical component requires immediate attention. Part transfer from nearby tank is faster than ordering new parts.',
          estimatedTime: '8-12 hours',
          estimatedCost: 1200,
          recommendedAction: {} as PartTransfer
        };
      } else {
        return {
          type: 'order',
          confidence: 78,
          reasoning: 'Component is critical and parts are not available in inventory or nearby tanks. Expedited order is recommended.',
          estimatedTime: '24-48 hours',
          estimatedCost: 4500,
          recommendedAction: {} as WorkOrder
        };
      }
    }
  } else if (health < 70 || component.status === 'degraded') {
    // Degraded - prefer ordering parts for scheduled maintenance
    return {
      type: 'order',
      confidence: 88,
      reasoning: 'Component is degraded but not critical. Ordering replacement parts for scheduled maintenance is most cost-effective.',
      estimatedTime: '3-5 days',
      estimatedCost: 3200,
      recommendedAction: {} as WorkOrder
    };
  } else {
    // Operational but preventive maintenance
    return {
      type: 'assign',
      confidence: 75,
      reasoning: 'Component is operational. Preventive maintenance by available personnel will extend service life.',
      estimatedTime: '2-3 hours',
      estimatedCost: 800,
      recommendedAction: {} as PersonnelAssignment
    };
  }
}

export function getPriorityFromComponent(component: TankComponent): 'critical' | 'high' | 'medium' | 'low' {
  if (component.health < 50 || component.status === 'critical') return 'critical';
  if (component.health < 70 || component.status === 'maintenance_required') return 'high';
  if (component.health < 85 || component.status === 'degraded') return 'medium';
  return 'low';
}

export function canUserApprove(userRole: 'admin' | 'technician'): boolean {
  return userRole === 'admin';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'approved':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'rejected':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'completed':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'draft':
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'high':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'medium':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'low':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

