'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TankComponent, Tank, TankNetwork } from '@/lib/types';
import { GitBranch, ArrowRight, TrendingUp, DollarSign, Clock, Sparkles, Lock, Unlock } from 'lucide-react';
import { generateTransferId, calculateTransferPath } from '@/lib/repair-utils';
import { useRepairStream } from '@/lib/hooks/useRepairStream';

interface PartTransferSystemProps {
  component: TankComponent;
  tank: Tank;
  allTanks: Tank[];
  tankNetwork: TankNetwork;
  isRecommended?: boolean;
  userRole: 'admin' | 'technician';
  onSubmit: (transfer: any) => void;
  onStreamUpdate?: (updates: any[]) => void;
}

export function PartTransferSystem({
  component,
  tank,
  allTanks,
  tankNetwork,
  isRecommended = false,
  userRole,
  onSubmit,
  onStreamUpdate
}: PartTransferSystemProps) {
  const [sourceTankId, setSourceTankId] = useState('');
  const [partId, setPartId] = useState('');
  const [partName, setPartName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');

  // AI assistance state
  const [aiAssistEnabled, setAiAssistEnabled] = useState(false);
  const [lockedFields, setLockedFields] = useState<Set<string>>(new Set());
  const { streamState, startStream, getFieldValue, getFieldReasoning } = useRepairStream();

  // Apply AI recommendations as they come in
  useEffect(() => {
    if (streamState.updates.length > 0) {
      streamState.updates.forEach((update) => {
        if (!lockedFields.has(update.field)) {
          switch (update.field) {
            case 'sourceTankId':
              setSourceTankId(update.value);
              break;
            case 'partId':
              setPartId(update.value);
              break;
            case 'partName':
              setPartName(update.value);
              break;
            case 'quantity':
              setQuantity(Number(update.value));
              break;
            case 'reason':
              setReason(update.value);
              break;
          }
        }
      });
      
      onStreamUpdate?.(streamState.updates);
    }
  }, [streamState.updates, lockedFields, onStreamUpdate]);

  const toggleFieldLock = (field: string) => {
    setLockedFields((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  };

  const handleAIAssist = () => {
    setAiAssistEnabled(true);
    startStream(component.id, tank.id, 'part_transfer');
  };

  const isFieldLocked = (field: string) => lockedFields.has(field);
  const getFieldHighlight = (field: string) => {
    if (streamState.completedFields.has(field) && !isFieldLocked(field)) {
      return 'bg-slate-900/30';
    }
    return '';
  };

  // Filter tanks that have compatible parts
  const availableTanks = allTanks.filter(t => t.id !== tank.id);

  const handleSubmit = () => {
    if (!sourceTankId) return;

    const pathData = calculateTransferPath(sourceTankId, tank.id, allTanks);
    
    const transfer = {
      id: generateTransferId(),
      componentId: component.id,
      partId: partId || `PART-${component.id}`,
      partName: partName || component.name,
      sourceTankId,
      destinationTankId: tank.id,
      quantity,
      reason,
      transferPath: pathData.path,
      estimatedTime: pathData.estimatedTime,
      logisticsCost: pathData.logisticsCost,
      status: userRole === 'admin' ? 'approved' : 'pending',
      submittedBy: userRole === 'admin' ? 'Admin User' : 'Technician User',
      submittedAt: new Date().toISOString(),
      ...(userRole === 'admin' && {
        approvedBy: 'Admin User',
        approvedAt: new Date().toISOString()
      })
    };
    onSubmit(transfer);
  };

  const selectedSourceTank = allTanks.find(t => t.id === sourceTankId);
  const pathData = sourceTankId ? calculateTransferPath(sourceTankId, tank.id, allTanks) : null;

  // Calculate optimal transfer suggestion
  const getOptimalSource = () => {
    if (availableTanks.length === 0) return null;
    
    // Simple logic: find tank with parts and lowest transfer cost
    const tanksWithParts = availableTanks.filter(t => 
      t.partsInventory.some(p => p.quantity > p.minQuantity)
    );
    
    if (tanksWithParts.length === 0) return null;
    
    // For now, return first tank (in real implementation, use actual GNN/graph algorithms)
    return tanksWithParts[0];
  };

  const optimalSource = getOptimalSource();

  const isFormValid = () => {
    return sourceTankId !== '' &&
      quantity > 0 &&
      reason.trim() !== '';
  };

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-slate-400" />
            <CardTitle className="text-slate-100">Part Transfer</CardTitle>
          </div>
          {isRecommended && (
            <Badge className="bg-slate-800/50 text-slate-300 border-slate-700/50">
              Recommended
            </Badge>
          )}
        </div>
        {!aiAssistEnabled && (
          <Button
            onClick={handleAIAssist}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Assist - Auto-Fill Form
          </Button>
        )}
        {aiAssistEnabled && streamState.isStreaming && (
          <div className="text-sm text-slate-400 text-center py-2">
            <Sparkles className="w-4 h-4 inline mr-2 animate-pulse" />
            AI is analyzing and filling fields...
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Visualization */}
        <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Tank Network
          </div>
          <div className="space-y-3">
            {tankNetwork.nodes.map((node) => {
              const isSource = node.id === sourceTankId;
              const isDestination = node.id === tank.id;
              const isOptimal = optimalSource?.id === node.id;
              
              return (
                <div
                  key={node.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isDestination
                      ? 'bg-slate-800/50 border-slate-600/50'
                      : isSource
                      ? 'bg-slate-800/40 border-slate-600/50'
                      : isOptimal
                      ? 'bg-slate-900/50 border-slate-700/50'
                      : 'bg-slate-900 border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-200">
                        {node.designation}
                      </div>
                      <div className="text-xs text-slate-500">{node.location}</div>
                    </div>
                    <div className="flex gap-2">
                      {isDestination && (
                        <Badge className="bg-slate-800/50 text-slate-300 border-slate-700/50 text-xs">
                          Destination
                        </Badge>
                      )}
                      {isSource && (
                        <Badge className="bg-slate-800/40 text-slate-400 border-slate-700/50 text-xs">
                          Selected Source
                        </Badge>
                      )}
                      {isOptimal && !isSource && !isDestination && (
                        <Badge className="bg-slate-900/50 text-slate-400 border-slate-700/50 text-xs">
                          Optimal
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transfer Path Visualization */}
          {pathData && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Transfer Route
              </div>
              <div className="flex items-center gap-2 mb-3">
                {pathData.path.map((tankId, idx) => {
                  const tankData = tankNetwork.nodes.find(n => n.id === tankId);
                  return (
                    <div key={tankId} className="flex items-center gap-2">
                      <div className="text-xs font-mono text-slate-300">
                        {tankData?.designation || tankId}
                      </div>
                      {idx < pathData.path.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-900 rounded p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="w-3 h-3 text-slate-500" />
                    <div className="text-xs text-slate-500">Distance</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-200">
                    {pathData.distance} km
                  </div>
                </div>
                <div className="bg-slate-900 rounded p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <div className="text-xs text-slate-500">Est. Time</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-200">
                    {pathData.estimatedTime}
                  </div>
                </div>
                <div className="bg-slate-900 rounded p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className="w-3 h-3 text-slate-500" />
                    <div className="text-xs text-slate-500">Cost</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-200">
                    ${pathData.logisticsCost}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transfer Form */}
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-2 block">
            Source Tank <span className="text-red-400">*</span>
          </label>
          <select
            value={sourceTankId}
            onChange={(e) => setSourceTankId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-600"
          >
            <option value="">Select source tank...</option>
            {availableTanks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.designation} - {t.location}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-2 block">
              Part ID
            </label>
            <input
              type="text"
              value={partId}
              onChange={(e) => setPartId(e.target.value)}
              placeholder="Auto-generated if empty"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-2 block">
              Quantity <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-600"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-300 mb-2 block">
            Part Name
          </label>
          <input
            type="text"
            value={partName}
            onChange={(e) => setPartName(e.target.value)}
            placeholder={`Default: ${component.name}`}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-600"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-300 mb-2 block">
            Reason <span className="text-red-400">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Provide justification for this part transfer..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid()}
          className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {userRole === 'admin' ? 'Approve & Execute Transfer' : 'Submit for Approval'}
        </Button>

        <div className="text-xs text-slate-500 text-center">
          All fields marked with <span className="text-red-400">*</span> are required
        </div>
      </CardContent>
    </Card>
  );
}

