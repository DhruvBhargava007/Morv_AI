'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MaintenanceEvent } from '@/lib/types';
import { Calendar } from 'lucide-react';

interface MaintenanceScheduleProps {
  events: MaintenanceEvent[];
}

export function MaintenanceScheduleNew({ events }: MaintenanceScheduleProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/30 text-red-400 border-red-500/50';
      case 'high':
        return 'bg-orange-500/30 text-orange-400 border-orange-500/50';
      case 'medium':
        return 'bg-amber-500/30 text-amber-400 border-amber-500/50';
      case 'low':
        return 'bg-blue-500/30 text-blue-400 border-blue-500/50';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scheduled':
        return 'text-blue-400';
      case 'preventive':
        return 'text-green-400';
      case 'unscheduled':
        return 'text-orange-400';
      default:
        return 'text-slate-400';
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const statusOrder = { in_progress: 0, pending: 1, completed: 2 };
    
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            <CardTitle className="text-slate-100">Maintenance Schedule</CardTitle>
          </div>
          <div className="text-xs text-slate-500">
            {events.filter(e => e.status === 'in_progress').length} Active | {' '}
            {events.filter(e => e.status === 'pending').length} Pending
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                  Date
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                  Component
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                  Description
                </th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                  Type
                </th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                  Priority
                </th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sortedEvents.map((event) => (
                <tr 
                  key={event.id} 
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-slate-300 font-medium">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(event.date).getFullYear()}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-slate-200">{event.component}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-slate-300 max-w-md">{event.description}</p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-xs font-medium ${getTypeColor(event.type)}`}>
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Badge className={`${getPriorityColor(event.priority)} text-xs`}>
                      {event.priority.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge className={`${getStatusColor(event.status)} text-xs whitespace-nowrap`}>
                      {event.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

