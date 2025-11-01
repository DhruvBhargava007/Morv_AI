'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tank } from '@/lib/types';
import { Shield, MapPin, Calendar, Gauge } from 'lucide-react';

interface TankOverviewProps {
  tank: Tank;
  isTechnician?: boolean;
}

export function TankOverview({ tank, isTechnician = false }: TankOverviewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-900/30 text-green-400 border-green-400/30';
      case 'maintenance':
        return 'bg-amber-900/30 text-amber-400 border-amber-400/30';
      case 'standby':
        return 'bg-blue-900/30 text-blue-400 border-blue-400/30';
      case 'critical':
        return 'bg-red-900/30 text-red-400 border-red-400/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-600';
    }
  };

  const getReadinessColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-slate-400" />
              <CardTitle className="text-2xl text-slate-100">{tank.designation}</CardTitle>
            </div>
            <p className="text-sm text-slate-400">{tank.model}</p>
          </div>
          <Badge className={`${getStatusColor(tank.status)} text-sm px-3 py-1`}>
            {tank.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid ${isTechnician ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}>
          {!isTechnician && (
            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Serial Number</p>
              <p className="text-sm font-mono text-slate-200">{tank.serialNumber}</p>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Tank ID</p>
            <p className="text-sm font-mono text-slate-200">{tank.id}</p>
          </div>
          <div className="space-y-1 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-500 mt-1" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Location</p>
              <p className="text-sm text-slate-200">{tank.location}</p>
            </div>
          </div>
          <div className="space-y-1 flex items-start gap-2">
            <Gauge className="w-4 h-4 text-slate-500 mt-1" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Operating Hours</p>
              <p className="text-sm text-slate-200">{tank.operatingHours.toLocaleString()} hrs</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm text-slate-400">Readiness Score</p>
              <span className={`text-3xl font-bold ${getReadinessColor(tank.readinessScore)}`}>
                {tank.readinessScore}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  tank.readinessScore >= 85
                    ? 'bg-green-500'
                    : tank.readinessScore >= 70
                    ? 'bg-blue-500'
                    : tank.readinessScore >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${tank.readinessScore}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Last Inspection</p>
              <p className="text-sm text-slate-200">
                {new Date(tank.lastInspection).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

