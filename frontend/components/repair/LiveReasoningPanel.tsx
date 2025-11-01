'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { StreamFieldUpdate } from '@/lib/hooks/useRepairStream';

interface LiveReasoningPanelProps {
  isStreaming: boolean;
  isConnected: boolean;
  updates: StreamFieldUpdate[];
  currentField?: string;
  error?: string | null;
}

export function LiveReasoningPanel({
  isStreaming,
  isConnected,
  updates,
  currentField,
  error
}: LiveReasoningPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAllUpdates, setShowAllUpdates] = useState(false);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-emerald-400';
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 70) return 'text-blue-400';
    if (confidence >= 60) return 'text-amber-400';
    return 'text-orange-400';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 90) return 'bg-emerald-500/20 border-emerald-500/30';
    if (confidence >= 80) return 'bg-green-500/20 border-green-500/30';
    if (confidence >= 70) return 'bg-blue-500/20 border-blue-500/30';
    if (confidence >= 60) return 'bg-amber-500/20 border-amber-500/30';
    return 'bg-orange-500/20 border-orange-500/30';
  };

  const formatFieldName = (field: string): string => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Show only the last 3 updates unless "show all" is clicked
  const displayedUpdates = showAllUpdates ? updates : updates.slice(-3);
  const latestUpdate = updates[updates.length - 1];

  if (error) {
    return (
      <Card className="bg-red-950/50 border-red-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-red-400" />
              <CardTitle className="text-red-400">AI Analysis Error</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-red-300 text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-950/50 to-slate-900 border-blue-500/30 transition-all duration-300">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-blue-400">AI Live Analysis</CardTitle>
            {isStreaming && (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            )}
            {isConnected && !isStreaming && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                Connected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {updates.length > 0 && (
              <Badge className="bg-slate-700 text-slate-300 text-xs">
                {updates.length} field{updates.length !== 1 ? 's' : ''} analyzed
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          {!isStreaming && updates.length === 0 && (
            <div className="text-center py-6">
              <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                Click "AI Assist" to start intelligent field analysis
              </p>
            </div>
          )}

          {isStreaming && updates.length === 0 && (
            <div className="text-center py-6">
              <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-3 animate-spin" />
              <p className="text-blue-300 text-sm font-semibold">
                Analyzing component data...
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Gathering context and generating recommendations
              </p>
            </div>
          )}

          {updates.length > 0 && (
            <>
              {/* Current Field Being Analyzed */}
              {isStreaming && latestUpdate && (
                <div className="bg-blue-950/50 border border-blue-500/30 rounded-lg p-3 mb-3 animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    <div className="text-sm font-semibold text-blue-300">
                      Currently analyzing: {formatFieldName(latestUpdate.field)}
                    </div>
                  </div>
                </div>
              )}

              {/* Update History */}
              <div className="space-y-2">
                {displayedUpdates.map((update, idx) => (
                  <div
                    key={`${update.field}-${idx}`}
                    className={`bg-slate-950/50 border rounded-lg p-3 transition-all duration-300 ${
                      idx === displayedUpdates.length - 1 && isStreaming
                        ? 'border-blue-500/50 shadow-lg shadow-blue-500/10'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-200 mb-1">
                          {formatFieldName(update.field)}
                        </div>
                        <div className="text-xs text-slate-400 mb-2">
                          Value: <span className="text-slate-300 font-mono">{
                            typeof update.value === 'object' 
                              ? JSON.stringify(update.value)
                              : String(update.value)
                          }</span>
                        </div>
                      </div>
                      <Badge className={`${getConfidenceBg(update.confidence)} text-xs ml-2`}>
                        <TrendingUp className={`w-3 h-3 mr-1 ${getConfidenceColor(update.confidence)}`} />
                        {update.confidence}%
                      </Badge>
                    </div>

                    <div className="bg-slate-900/50 rounded px-3 py-2 border-l-2 border-blue-500/50">
                      <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                        Reasoning
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {update.reasoning}
                      </p>
                    </div>
                  </div>
                ))}

                {updates.length > 3 && !showAllUpdates && (
                  <button
                    onClick={() => setShowAllUpdates(true)}
                    className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Show all {updates.length} updates
                  </button>
                )}

                {showAllUpdates && updates.length > 3 && (
                  <button
                    onClick={() => setShowAllUpdates(false)}
                    className="w-full py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Show less
                  </button>
                )}
              </div>

              {/* Summary */}
              {!isStreaming && updates.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Analysis complete</span>
                    <span>
                      Avg confidence:{' '}
                      <span className="text-slate-300 font-semibold">
                        {Math.round(
                          updates.reduce((sum, u) => sum + u.confidence, 0) / updates.length
                        )}%
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default LiveReasoningPanel;

