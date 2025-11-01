'use client';

import { TankComponent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Wrench, AlertTriangle } from 'lucide-react';

interface AIExplanationPanelProps {
  components: TankComponent[];
}

export function AIExplanationPanel({ components }: AIExplanationPanelProps) {
  const criticalComponents = components.filter(c => c.status === 'critical');
  const degradedComponents = components.filter(c => c.status === 'degraded');

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-400" />
          <CardTitle className="text-slate-100">AI Health Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Critical Components */}
        {criticalComponents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-red-400">Critical Systems</h3>
              <Badge className="bg-red-900/30 text-red-400 border-red-400/30">
                {criticalComponents.length}
              </Badge>
            </div>
            
            {criticalComponents.map(component => (
              <div key={component.id} className="p-4 bg-red-950/20 border border-red-900/40 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-200">{component.name}</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">Health:</span>
                    <span className="text-xl font-bold text-red-400">{component.health.toFixed(1)}%</span>
                  </div>
                </div>
                
                {component.explanation && (
                  <div className="mt-3 p-3 bg-slate-900/50 rounded border border-slate-700">
                    <div className="flex items-start gap-2">
                      <Brain className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-300">{component.explanation}</p>
                    </div>
                  </div>
                )}
                
                {component.drivers && component.drivers.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 mb-2">Top Contributing Factors:</p>
                    <div className="space-y-1">
                      {component.drivers.slice(0, 3).map((driver, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-800/50 rounded-full h-1.5">
                            <div 
                              className="bg-red-500/70 h-1.5 rounded-full" 
                              style={{width: `${driver.contribution * 100}%`}}
                            />
                          </div>
                          <span className="text-xs text-slate-400 min-w-[120px]">
                            {driver.feature.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-mono text-slate-500 min-w-[40px] text-right">
                            {(driver.contribution * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span>RUL: {component.hoursRemaining}h</span>
                  <span>•</span>
                  <span>Next Service: {component.nextService}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Degraded Components */}
        {degradedComponents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-400">Degraded Systems</h3>
              <Badge className="bg-amber-900/30 text-amber-400 border-amber-400/30">
                {degradedComponents.length}
              </Badge>
            </div>
            
            {degradedComponents.map(component => (
              <div key={component.id} className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-200 text-sm">{component.name}</h4>
                  <span className="text-lg font-bold text-amber-400">{component.health.toFixed(1)}%</span>
                </div>
                
                {component.explanation && (
                  <div className="mt-2 p-2 bg-slate-900/50 rounded border border-slate-700/50">
                    <p className="text-xs text-slate-300">{component.explanation}</p>
                  </div>
                )}
                
                <div className="mt-2 text-xs text-slate-500">
                  RUL: {component.hoursRemaining}h | Next: {component.nextService}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Healthy Status */}
        {criticalComponents.length === 0 && degradedComponents.length === 0 && (
          <div className="p-4 bg-green-950/20 border border-green-900/40 rounded-lg text-center">
            <Wrench className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-green-400 font-semibold">All Systems Operational</p>
            <p className="text-xs text-slate-400 mt-1">No immediate maintenance required</p>
          </div>
        )}
        
        {/* Formula Transparency */}
        {components[0]?.formula && (
          <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
            <h4 className="text-xs font-semibold text-slate-400 mb-2">Health Index Formula</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">α (feature deviation):</span>
                <span className="text-slate-300 font-mono">{components[0].formula.alpha}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">β (overload):</span>
                <span className="text-slate-300 font-mono">{components[0].formula.beta}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">γ (age/wear):</span>
                <span className="text-slate-300 font-mono">{components[0].formula.gamma}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">δ (maintenance):</span>
                <span className="text-slate-300 font-mono">{components[0].formula.delta}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

