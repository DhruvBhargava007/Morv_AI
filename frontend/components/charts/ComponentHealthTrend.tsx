'use client';

import { TankComponent } from '@/lib/types';
import { generateHistoricalHealthData, ComponentHealthChartData } from '@/lib/chart-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface ComponentHealthTrendProps {
  components: TankComponent[];
  days?: number;
}

export function ComponentHealthTrend({ components, days = 30 }: ComponentHealthTrendProps) {
  const historicalData = generateHistoricalHealthData(components, days);

  // Get top 5 components for readability
  const topComponents = [...components]
    .sort((a, b) => b.health - a.health)
    .slice(0, 5);

  const getHealthColor = (health: number) => {
    if (health >= 85) return '#10b981'; // green-500
    if (health >= 70) return '#3b82f6'; // blue-500
    if (health >= 50) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#f97316', // orange
  ];

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-400" />
            <CardTitle className="text-slate-100">Component Health Trends</CardTitle>
          </div>
          <div className="text-xs text-slate-500">
            Last {days} Days
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                label={{ value: 'Health %', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#e5e7eb',
                }}
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                }}
              />
              <Legend
                wrapperStyle={{ color: '#e5e7eb', fontSize: '12px' }}
                iconType="line"
              />
              {topComponents.map((component, index) => (
                <Line
                  key={component.id}
                  type="monotone"
                  dataKey={component.name}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

