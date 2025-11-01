'use client';

import { MaintenanceWeights } from '@/lib/types';
import { transformWeightsForReadinessBreakdown } from '@/lib/chart-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Gauge } from 'lucide-react';

interface ReadinessBreakdownProps {
  weights: MaintenanceWeights;
  readinessScore: number;
}

export function ReadinessBreakdown({ weights, readinessScore }: ReadinessBreakdownProps) {
  const breakdown = transformWeightsForReadinessBreakdown(weights);

  const getReadinessColor = (score: number) => {
    if (score >= 85) return '#10b981'; // green-500
    if (score >= 70) return '#3b82f6'; // blue-500
    if (score >= 50) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-slate-200 mb-1">{payload[0].name}</p>
          <p className="text-xs text-slate-400">
            Weight: <span className="text-slate-200 font-medium">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-slate-400" />
            <CardTitle className="text-slate-100">Readiness Score Breakdown</CardTitle>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getReadinessColor(readinessScore)}`}>
              {readinessScore}%
            </div>
            <div className="text-xs text-slate-500">Overall Readiness</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut Chart */}
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown as any}
                  dataKey="value"
                  nameKey="weight"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  label={({ weight, value }: any) => `${weight}: ${value}%`}
                  labelLine={false}
                >
                  {breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ color: '#e5e7eb' }}
                  formatter={(value) => <span className="text-slate-400">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Weight Details List */}
          <div className="flex flex-col justify-center space-y-3">
            {breakdown.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm text-slate-300">{entry.weight}</span>
                </div>
                <span className="text-sm font-semibold text-slate-200">{entry.value}%</span>
              </div>
            ))}
            <div className="pt-3 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Total Weight</span>
                <span className="text-sm font-bold text-slate-100">
                  {breakdown.reduce((sum, item) => sum + item.value, 0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

