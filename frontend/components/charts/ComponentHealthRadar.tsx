'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { TankComponent } from '@/lib/types';
import { transformComponentsForRadar, calculateHealthDistribution } from '@/lib/chart-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';

interface ComponentHealthRadarProps {
  components: TankComponent[];
  showDistribution?: boolean;
}

export function ComponentHealthRadar({ components, showDistribution = false }: ComponentHealthRadarProps) {
  const radarData = transformComponentsForRadar(components);
  const distribution = calculateHealthDistribution(components);

  const getHealthColor = (health: number) => {
    if (health >= 85) return '#10b981'; // green-500
    if (health >= 70) return '#3b82f6'; // blue-500
    if (health >= 50) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  // Calculate average health for main color
  const avgHealth = components.reduce((sum, c) => sum + c.health, 0) / components.length;
  const strokeColor = getHealthColor(avgHealth);

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" />
            <CardTitle className="text-slate-100">Component Health Overview</CardTitle>
          </div>
          <div className="text-xs text-slate-500">
            {components.filter((c) => c.health >= 85).length} Optimal |{' '}
            {components.filter((c) => c.health < 85 && c.health >= 70).length} Good |{' '}
            {components.filter((c) => c.health < 70 && c.health >= 50).length} Degraded |{' '}
            {components.filter((c) => c.health < 50).length} Critical
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Radar Chart */}
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis
                  dataKey="component"
                  tick={{ fill: '#e5e7eb', fontSize: 12 }}
                  style={{ fill: '#9ca3af' }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                />
                <Radar
                  name="Health"
                  dataKey="health"
                  stroke={strokeColor}
                  fill={strokeColor}
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
                <Legend
                  wrapperStyle={{ color: '#e5e7eb' }}
                  iconType="circle"
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Health Distribution Bar Chart */}
          {showDistribution && (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} layout="horizontal">
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="category"
                    type="category"
                    tick={{ fill: '#e5e7eb', fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#e5e7eb',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} shape={(props: any) => {
                    const { payload, x, y, width, height } = props;
                    const color = distribution.find(d => d.category === payload.category)?.color || '#3b82f6';
                    return (
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={color}
                        rx={4}
                      />
                    );
                  }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

