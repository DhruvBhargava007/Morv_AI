'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TankComponent } from '@/lib/types';
import { Activity, Clock, AlertTriangle } from 'lucide-react';

interface ComponentHealthCardsProps {
  components: TankComponent[];
}

export function ComponentHealthCards({ components }: ComponentHealthCardsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'degraded':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'maintenance_required':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-600';
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 85) return 'text-green-400';
    if (health >= 70) return 'text-blue-400';
    if (health >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getHealthBarColor = (health: number) => {
    if (health >= 85) return 'bg-green-500';
    if (health >= 70) return 'bg-blue-500';
    if (health >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Sort by health (worst first) and status priority
  const sortedComponents = [...components].sort((a, b) => {
    const statusPriority = { critical: 0, maintenance_required: 1, degraded: 2, operational: 3 };
    if (a.status !== b.status) {
      return statusPriority[a.status] - statusPriority[b.status];
    }
    return a.health - b.health;
  });

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" />
            <CardTitle className="text-slate-100">Component Health</CardTitle>
          </div>
          <div className="text-xs text-slate-500">
            {sortedComponents.filter(c => c.health >= 85).length} Optimal |{' '}
            {sortedComponents.filter(c => c.health < 50 || c.status === 'critical').length} Need Attention
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedComponents.map((component) => (
            <div
              key={component.id}
              className={`p-4 rounded-lg border transition-all hover:border-opacity-60 ${
                component.status === 'critical' || component.status === 'maintenance_required'
                  ? 'bg-red-500/10 border-red-500/30'
                  : component.status === 'degraded'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-slate-800/50 border-slate-700'
              }`}
            >
              {/* Component Name & Status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-200 truncate mb-1">
                    {component.name}
                  </h4>
                  {component.hoursRemaining < 50 && (
                    <div className="flex items-center gap-1 text-xs text-red-400">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Service Due Soon</span>
                    </div>
                  )}
                </div>
                <Badge className={`${getStatusColor(component.status)} text-xs whitespace-nowrap ml-2`}>
                  {component.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Health Score */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">Health</span>
                  <span className={`text-lg font-bold ${getHealthColor(component.health)}`}>
                    {component.health}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getHealthBarColor(component.health)}`}
                    style={{ width: `${component.health}%` }}
                  ></div>
                </div>
              </div>

              {/* Hours Until Service */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                <Clock className={`w-3 h-3 ${
                  component.hoursRemaining < 50
                    ? 'text-red-400'
                    : component.hoursRemaining < 150
                    ? 'text-amber-400'
                    : 'text-slate-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">Next Service</p>
                  <p className={`text-sm font-semibold truncate ${
                    component.hoursRemaining < 50
                      ? 'text-red-400'
                      : component.hoursRemaining < 150
                      ? 'text-amber-400'
                      : 'text-slate-300'
                  }`}>
                    {component.hoursRemaining} hrs
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

