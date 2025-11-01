'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { MaintenanceWeights } from '@/lib/types';
import { defaultWeights } from '@/lib/dummy-data';
import { Settings2, RotateCcw } from 'lucide-react';

interface WeightPanelProps {
  weights: MaintenanceWeights;
  onWeightsChange: (weights: MaintenanceWeights) => void;
  readOnly?: boolean;
}

const weightDescriptions = {
  operatingHours: 'Total operating time and usage intensity',
  environmentalConditions: 'Terrain, climate, and operational environment impact',
  componentAge: 'Time since installation or last major overhaul',
  missionCriticality: 'Strategic importance and readiness requirements',
  maintenanceHistory: 'Past failure patterns and service records',
  partsAvailability: 'Supply chain status and logistics constraints'
};

export function WeightPanel({ weights, onWeightsChange, readOnly = false }: WeightPanelProps) {
  const [localWeights, setLocalWeights] = useState(weights);
  const [isExpanded, setIsExpanded] = useState(!readOnly); // Collapsed by default for technicians

  const handleWeightChange = (key: keyof MaintenanceWeights, value: number[]) => {
    if (readOnly) return;
    const newWeights = { ...localWeights, [key]: value[0] };
    setLocalWeights(newWeights);
    onWeightsChange(newWeights);
  };

  const handleReset = () => {
    if (readOnly) return;
    setLocalWeights(defaultWeights);
    onWeightsChange(defaultWeights);
  };

  const formatLabel = (key: string): string => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const totalWeight = Object.values(localWeights).reduce((sum, val) => sum + val, 0);
  const isBalanced = totalWeight === 100;

  // Hide weight panel completely for technicians
  if (readOnly) {
    return null;
  }

  return (
    <Card className="w-full bg-slate-900 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-slate-400" />
            <CardTitle className="text-slate-100">Maintenance Priority Weights</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-200"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
        <CardDescription className="text-slate-400">
          Adjust parameters to calculate maintenance priority scores
        </CardDescription>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          {Object.entries(localWeights).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300">
                  {formatLabel(key)}
                </label>
                <span className="text-sm font-semibold text-slate-100 bg-slate-800 px-2 py-1 rounded">
                  {value}%
                </span>
              </div>
              <Slider
                value={[value]}
                onValueChange={(val) => handleWeightChange(key as keyof MaintenanceWeights, val)}
                max={100}
                step={5}
                className="w-full"
                disabled={readOnly}
              />
              <p className="text-xs text-slate-500">
                {weightDescriptions[key as keyof typeof weightDescriptions]}
              </p>
            </div>
          ))}

          <div className="pt-4 border-t border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-slate-300">Total Weight</span>
              <span className={`text-sm font-bold px-3 py-1 rounded ${
                isBalanced 
                  ? 'bg-green-900/30 text-green-400' 
                  : 'bg-amber-900/30 text-amber-400'
              }`}>
                {totalWeight}%
              </span>
            </div>
            {!isBalanced && (
              <p className="text-xs text-amber-400 mb-3">
                Note: Total should equal 100% for accurate calculations
              </p>
            )}
            {!readOnly && (
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
            )}
          </div>

          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Military Standard:</span> Modern armed forces 
              typically prioritize operating hours (25-30%), mission criticality (20-25%), and component 
              age (15-20%). Environmental factors and maintenance history receive moderate weighting (10-15% each), 
              while parts availability is considered but given lower priority (5-10%) in well-supplied units.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

