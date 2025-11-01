'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RepairRecommendation } from '@/lib/types';
import { Brain, TrendingUp, Clock, DollarSign } from 'lucide-react';

interface AIRecommendationProps {
  recommendation: RepairRecommendation;
}

export function AIRecommendation({ recommendation }: AIRecommendationProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'assign':
        return 'Personnel Assignment';
      case 'order':
        return 'Order New Parts';
      case 'transfer':
        return 'Part Transfer';
      default:
        return type;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-emerald-400';
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 70) return 'text-blue-400';
    return 'text-amber-400';
  };

  return (
    <Card className="bg-gradient-to-br from-emerald-950/50 to-slate-900 border-emerald-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-400" />
            <CardTitle className="text-emerald-400">AI Recommended Solution</CardTitle>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <TrendingUp className="w-3 h-3 mr-1" />
            {recommendation.confidence}% Confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm font-semibold text-slate-300 mb-1">Recommended Action</div>
          <div className="text-lg font-bold text-emerald-400">{getTypeLabel(recommendation.type)}</div>
        </div>

        <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Analysis
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {recommendation.reasoning}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Est. Time
              </div>
            </div>
            <div className="text-base font-bold text-slate-200">
              {recommendation.estimatedTime}
            </div>
          </div>

          <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Est. Cost
              </div>
            </div>
            <div className="text-base font-bold text-slate-200">
              ${recommendation.estimatedCost.toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

