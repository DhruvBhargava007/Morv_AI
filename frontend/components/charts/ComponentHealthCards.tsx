'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TankComponent } from '@/lib/types';
import { Activity, Clock, AlertTriangle, Wrench, Sparkles } from 'lucide-react';

interface ComponentHealthCardsProps {
  components: TankComponent[];
  aiAdjustedScores?: Record<string, {
    original_health: number;
    adjusted_health: number;
    confidence: number;
    reasoning: string;
  }>;
}

export function ComponentHealthCards({ components, aiAdjustedScores = {} }: ComponentHealthCardsProps) {
  const router = useRouter();
  const [animatedComponents, setAnimatedComponents] = useState<Set<string>>(new Set());
  const animationDelay = 150; // ms delay between animations

  // Sort by priority: critical > maintenance_required > degraded > operational, then by health (lowest first)
  const sortedComponents = [...components].sort((a, b) => {
    const statusPriority: Record<string, number> = { critical: 0, maintenance_required: 1, degraded: 2, operational: 3 };
    if (a.status !== b.status) {
      return (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99);
    }
    return a.health - b.health;
  });

  // Initialize sequential animation on mount
  useEffect(() => {
    if (sortedComponents.length === 0) return;
    
    // Reset animation state
    setAnimatedComponents(new Set());
    
    sortedComponents.forEach((component, index) => {
      setTimeout(() => {
        setAnimatedComponents((prev) => {
          const newSet = new Set(prev);
          newSet.add(component.id);
          return newSet;
        });
      }, index * animationDelay);
    });
  }, [components.length]); // Re-run if components change

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-slate-800/50 text-slate-300 border-slate-700/50';
      case 'degraded':
        return 'bg-slate-800/40 text-slate-400 border-slate-700/40';
      case 'maintenance_required':
        return 'bg-slate-800/50 text-slate-500 border-slate-700/50';
      case 'critical':
        return 'bg-slate-900/70 text-slate-400 border-slate-600/50';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-600';
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 85) return 'text-slate-300';
    if (health >= 70) return 'text-slate-400';
    if (health >= 50) return 'text-slate-500';
    return 'text-slate-600';
  };

  const getHealthBarColor = (health: number) => {
    if (health >= 85) return 'bg-slate-400';
    if (health >= 70) return 'bg-slate-500';
    if (health >= 50) return 'bg-slate-600';
    return 'bg-slate-700';
  };

  // Get health score for component (with AI adjustment if available)
  const getComponentHealth = (component: TankComponent) => {
    const adjusted = aiAdjustedScores[component.id];
    if (adjusted && adjusted.adjusted_health !== adjusted.original_health) {
      return {
        display: adjusted.adjusted_health,
        original: adjusted.original_health,
        adjusted: adjusted.adjusted_health,
        hasAdjustment: true,
        confidence: adjusted.confidence,
        reasoning: adjusted.reasoning,
      };
    }
    return {
      display: component.health,
      original: component.health,
      adjusted: null,
      hasAdjustment: false,
      confidence: null,
      reasoning: null,
    };
  };

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
          {sortedComponents.map((component) => {
            const healthData = getComponentHealth(component);
            const isAnimated = animatedComponents.has(component.id);
            const animationWidth = isAnimated ? healthData.display : 0;

            return (
              <div
                key={component.id}
                onClick={() => router.push(`/repair/${component.id}`)}
                className={`p-4 rounded-lg border transition-all hover:border-opacity-60 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  component.status === 'critical' || component.status === 'maintenance_required'
                    ? 'bg-slate-900/50 border-slate-700 hover:bg-slate-900'
                    : component.status === 'degraded'
                    ? 'bg-slate-900/40 border-slate-700 hover:bg-slate-900'
                    : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                }`}
              >
              {/* Component Name & Status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-200 truncate mb-1">
                    {component.name}
                  </h4>
                  {component.hoursRemaining < 50 && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
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
                  <div className="flex items-center gap-2">
                    {healthData.hasAdjustment && (
                      <Badge className="bg-slate-800/50 text-slate-300 border-slate-700/50 text-xs px-1.5 py-0">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI-Adjusted
                      </Badge>
                    )}
                    <span className={`text-lg font-bold ${getHealthColor(healthData.display)}`}>
                      {healthData.display.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {healthData.hasAdjustment && (
                  <div className="text-xs text-slate-500 mb-1">
                    Original: {healthData.original.toFixed(1)}% | Adjusted: {healthData.adjusted?.toFixed(1)}%
                  </div>
                )}
                <div className="w-full bg-slate-700 rounded-full h-2 relative">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getHealthBarColor(healthData.display)}`}
                    style={{ width: `${animationWidth}%` }}
                  ></div>
                </div>
              </div>

              {/* Hours Until Service */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                <Clock className={`w-3 h-3 ${
                  component.hoursRemaining < 50
                    ? 'text-slate-600'
                    : component.hoursRemaining < 150
                    ? 'text-slate-500'
                    : 'text-slate-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">Next Service</p>
                  <p className={`text-sm font-semibold truncate ${
                    component.hoursRemaining < 50
                      ? 'text-slate-500'
                      : component.hoursRemaining < 150
                      ? 'text-slate-400'
                      : 'text-slate-300'
                  }`}>
                    {component.hoursRemaining} hrs
                  </p>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

