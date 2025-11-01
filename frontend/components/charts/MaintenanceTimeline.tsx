'use client';

import { MaintenanceEvent } from '@/lib/types';
import { transformMaintenanceForTimeline, calculateMaintenanceTypeDistribution, calculatePriorityDistribution } from '@/lib/chart-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface MaintenanceTimelineProps {
  events: MaintenanceEvent[];
  showDistribution?: boolean;
}

export function MaintenanceTimeline({ events, showDistribution = false }: MaintenanceTimelineProps) {
  const timelineData = transformMaintenanceForTimeline(events);
  const typeDistribution = calculateMaintenanceTypeDistribution(events);
  const priorityDistribution = calculatePriorityDistribution(events);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '#ef4444'; // red-500
      case 'high':
        return '#f97316'; // orange-500
      case 'medium':
        return '#f59e0b'; // amber-500
      case 'low':
        return '#3b82f6'; // blue-500
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return '#3b82f6'; // blue-500
      case 'pending':
        return '#f59e0b'; // amber-500
      case 'completed':
        return '#10b981'; // green-500
      default:
        return '#6b7280';
    }
  };

  // Sort timeline data by date
  const sortedTimeline = [...timelineData].sort((a, b) => {
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  // Get date range for timeline
  const dates = sortedTimeline.map((item) => new Date(item.startDate));
  const minDate = dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : new Date();
  const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map((d) => new Date(d).getTime()))) : new Date();
  maxDate.setDate(maxDate.getDate() + 7); // Add 7 days buffer

  // Calculate position and width for each item
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  const calculatePosition = (date: string) => {
    const itemDate = new Date(date);
    const daysFromStart = Math.ceil((itemDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    return (daysFromStart / totalDays) * 100;
  };

  const calculateWidth = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return (days / totalDays) * 100;
  };

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            <CardTitle className="text-slate-100">Maintenance Schedule</CardTitle>
          </div>
          <div className="text-xs text-slate-500">
            {events.filter((e) => e.status === 'in_progress').length} Active | {' '}
            {events.filter((e) => e.status === 'pending').length} Pending
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Timeline Visualization */}
          <div className="space-y-3">
            <div className="text-xs text-slate-400 mb-2">Timeline View (Next 30 Days)</div>
            <div className="relative h-[200px] border-t border-slate-700">
              {/* Time axis */}
              <div className="absolute top-0 left-0 right-0 h-6 border-b border-slate-700">
                <div className="relative h-full">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const date = new Date(minDate);
                    date.setDate(date.getDate() + Math.floor((totalDays / 5) * i));
                    const position = (i / 5) * 100;
                    return (
                      <div
                        key={i}
                        className="absolute top-0 transform -translate-x-1/2"
                        style={{ left: `${position}%` }}
                      >
                        <div className="h-2 w-px bg-slate-600"></div>
                        <div className="text-xs text-slate-500 mt-1 whitespace-nowrap">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Timeline bars */}
              <div className="absolute top-6 left-0 right-0 bottom-0">
                {sortedTimeline.slice(0, 10).map((item, index) => {
                  const left = calculatePosition(item.startDate);
                  const width = calculateWidth(item.startDate, item.endDate);
                  const color = getPriorityColor(item.priority);
                  const statusColor = getStatusColor(item.status);

                  return (
                    <div
                      key={item.id}
                      className="absolute h-8 rounded border-l-2 transition-all hover:opacity-80 cursor-pointer group"
                      style={{
                        left: `${left}%`,
                        width: `${Math.max(width, 2)}%`,
                        backgroundColor: `${color}20`,
                        borderColor: color,
                        top: `${index * 40}px`,
                      }}
                      title={`${item.component}: ${item.description}`}
                    >
                      <div className="h-full flex items-center px-2">
                        <div
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: statusColor }}
                        ></div>
                        <span className="text-xs text-slate-200 truncate">{item.component}</span>
                      </div>
                      {/* Tooltip on hover */}
                      <div className="absolute left-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 min-w-[200px]">
                        <div className="text-xs font-semibold text-slate-200 mb-1">{item.component}</div>
                        <div className="text-xs text-slate-400 mb-1">{item.description}</div>
                        <div className="flex gap-2 text-xs">
                          <span className="text-slate-500">Priority:</span>
                          <span className="font-medium" style={{ color }}>{item.priority.toUpperCase()}</span>
                          <span className="text-slate-500 ml-2">Status:</span>
                          <span className="font-medium" style={{ color: statusColor }}>
                            {item.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Distribution Charts */}
          {showDistribution && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Type Distribution */}
              <div className="h-[250px]">
                <div className="text-xs text-slate-400 mb-3">Maintenance Type Distribution</div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      labelLine={false}
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f97316'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#e5e7eb',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Priority Distribution */}
              <div className="h-[250px]">
                <div className="text-xs text-slate-400 mb-3">Priority Distribution</div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityDistribution}>
                    <XAxis
                      dataKey="priority"
                      tick={{ fill: '#e5e7eb', fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#e5e7eb',
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      radius={[4, 4, 0, 0]}
                      shape={(props: any) => {
                        const { payload, x, y, width, height } = props;
                        const color = priorityDistribution.find(d => d.priority === payload.priority)?.color || '#3b82f6';
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
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

