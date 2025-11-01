'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TankComponent } from '@/lib/types';
import { Activity } from 'lucide-react';

interface ComponentHealthProps {
  components: TankComponent[];
}

export function ComponentHealthNew({ components }: ComponentHealthProps) {
  const router = useRouter();

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

  const sortedComponents = [...components].sort((a, b) => a.health - b.health);

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" />
            <CardTitle className="text-slate-100">Component Health Matrix</CardTitle>
          </div>
          <div className="text-xs text-slate-500">
            {components.filter(c => c.health >= 85).length} Optimal | {' '}
            {components.filter(c => c.health < 85 && c.health >= 70).length} Good | {' '}
            {components.filter(c => c.health < 70 && c.health >= 50).length} Degraded | {' '}
            {components.filter(c => c.health < 50).length} Critical
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                  Component
                </th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                  Health
                </th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                  Hours Remaining
                </th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                  Next Service
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sortedComponents.map((component) => (
                <tr 
                  key={component.id} 
                  onClick={() => router.push(`/repair/${component.id}`)}
                  className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{component.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{component.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Badge className={`${getStatusColor(component.status)} text-xs whitespace-nowrap`}>
                      {component.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-800 rounded-full h-2 min-w-[80px]">
                        <div
                          className={`h-2 rounded-full transition-all ${getHealthBarColor(component.health)}`}
                          style={{ width: `${component.health}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-bold min-w-[45px] text-right ${getHealthColor(component.health)}`}>
                        {component.health}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-sm font-semibold ${
                      component.hoursRemaining < 50
                        ? 'text-red-400'
                        : component.hoursRemaining < 150
                        ? 'text-amber-400'
                        : 'text-slate-300'
                    }`}>
                      {component.hoursRemaining} hrs
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-sm text-slate-300">
                      {new Date(component.nextService).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
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

