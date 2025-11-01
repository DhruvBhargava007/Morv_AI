'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TankComponent, Tank } from '@/lib/types';
import { FileText, Sparkles, Lock, Unlock } from 'lucide-react';
import { generateWONumber, getPriorityFromComponent } from '@/lib/repair-utils';
import { useRepairStream } from '@/lib/hooks/useRepairStream';

interface WorkOrderFormProps {
  component: TankComponent;
  tank: Tank;
  isRecommended?: boolean;
  userRole: 'admin' | 'technician';
  onSubmit: (workOrder: any) => void;
  onStreamUpdate?: (updates: any[]) => void;
}

const vendors = [
  'General Dynamics Land Systems',
  'Honeywell Aerospace',
  'BAE Systems',
  'Lockheed Martin',
  'Raytheon Technologies',
  'Harris Corporation',
  'L3Harris Technologies'
];

export function WorkOrderForm({ 
  component, 
  tank, 
  isRecommended = false,
  userRole,
  onSubmit,
  onStreamUpdate
}: WorkOrderFormProps) {
  const [woNumber] = useState(generateWONumber());
  const [partNumber, setPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState(getPriorityFromComponent(component));
  const [justification, setJustification] = useState('');
  const [vendor, setVendor] = useState(vendors[0]);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [deliveryTimeline, setDeliveryTimeline] = useState('3-5 days');
  
  // AI assistance state
  const [aiAssistEnabled, setAiAssistEnabled] = useState(false);
  const [lockedFields, setLockedFields] = useState<Set<string>>(new Set());
  const { streamState, startStream, getFieldValue, getFieldReasoning } = useRepairStream();

  // Apply AI recommendations as they come in
  useEffect(() => {
    if (streamState.updates.length > 0) {
      streamState.updates.forEach((update) => {
        // Only update if field is not locked
        if (!lockedFields.has(update.field)) {
          switch (update.field) {
            case 'partNumber':
              setPartNumber(update.value);
              break;
            case 'partName':
              setPartName(update.value);
              break;
            case 'quantity':
              setQuantity(Number(update.value));
              break;
            case 'priority':
              setPriority(update.value);
              break;
            case 'justification':
              setJustification(update.value);
              break;
            case 'vendor':
              setVendor(update.value);
              break;
            case 'estimatedCost':
              setEstimatedCost(Number(update.value));
              break;
            case 'deliveryTimeline':
              setDeliveryTimeline(update.value);
              break;
          }
        }
      });
      
      // Notify parent about updates
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
    startStream(component.id, tank.id, 'work_order');
  };

  const isFieldLocked = (field: string) => lockedFields.has(field);
  const getFieldHighlight = (field: string) => {
    if (streamState.completedFields.has(field) && !isFieldLocked(field)) {
      return 'ring-1 ring-slate-600/50 bg-slate-900/30';
    }
    return '';
  };

  const handleSubmit = () => {
    const workOrder = {
      id: `WO-${Date.now()}`,
      woNumber,
      componentId: component.id,
      tankId: tank.id,
      partNumber,
      partName,
      quantity,
      priority,
      justification,
      vendor,
      estimatedCost,
      deliveryTimeline,
      status: userRole === 'admin' ? 'approved' : 'pending',
      submittedBy: userRole === 'admin' ? 'Admin User' : 'Technician User',
      submittedAt: new Date().toISOString(),
      ...(userRole === 'admin' && {
        approvedBy: 'Admin User',
        approvedAt: new Date().toISOString()
      })
    };
    onSubmit(workOrder);
  };

  const isFormValid = () => {
    return partNumber.trim() !== '' &&
      partName.trim() !== '' &&
      quantity > 0 &&
      justification.trim() !== '' &&
      estimatedCost >= 0;
  };

  return (
    <Card className={`bg-slate-900 border-slate-700 ${isRecommended ? 'ring-1 ring-slate-600/50' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" />
            <CardTitle className="text-slate-100">Work Order</CardTitle>
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
        {/* WO Number & Component Info */}
        <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">WO Number</div>
              <div className="font-mono font-semibold text-slate-200">{woNumber}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Component</div>
              <div className="font-semibold text-slate-200">{component.name}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tank</div>
              <div className="font-semibold text-slate-200">{tank.designation}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Serial</div>
              <div className="font-mono text-xs text-slate-300">{tank.serialNumber}</div>
            </div>
          </div>
        </div>

        {/* Part Information */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-300">
                Part Number <span className="text-red-400">*</span>
              </label>
              {aiAssistEnabled && (
                <button
                  onClick={() => toggleFieldLock('partNumber')}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
                >
                  {isFieldLocked('partNumber') ? (
                    <><Lock className="w-3 h-3" /> Locked</>
                  ) : (
                    <><Unlock className="w-3 h-3" /> Unlocked</>
                  )}
                </button>
              )}
            </div>
            <input
              type="text"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              placeholder="e.g., TRK-5589-A"
              disabled={isFieldLocked('partNumber')}
              className={`w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-600 font-mono transition-all ${getFieldHighlight('partNumber')} ${isFieldLocked('partNumber') ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
            {aiAssistEnabled && getFieldReasoning('partNumber') && (
              <div className="mt-1 text-xs text-slate-500 italic">
                AI: {getFieldReasoning('partNumber')}
              </div>
            )}
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
            Part Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={partName}
            onChange={(e) => setPartName(e.target.value)}
            placeholder="e.g., Track Link Assembly"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-2 block">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Justification */}
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-2 block">
            Justification <span className="text-red-400">*</span>
          </label>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={3}
            placeholder="Provide detailed justification for this work order..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
        </div>

        {/* Vendor */}
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-2 block">
            Vendor
          </label>
          <select
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {vendors.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Cost & Timeline */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-2 block">
              Estimated Cost (USD) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(Number(e.target.value))}
                min="0"
                step="0.01"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-2 block">
              Delivery Timeline
            </label>
            <input
              type="text"
              value={deliveryTimeline}
              onChange={(e) => setDeliveryTimeline(e.target.value)}
              placeholder="e.g., 3-5 days"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-600"
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid()}
          className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {userRole === 'admin' ? 'Approve & Submit WO' : 'Submit for Approval'}
        </Button>

        <div className="text-xs text-slate-500 text-center">
          All fields marked with <span className="text-red-400">*</span> are required
        </div>
      </CardContent>
    </Card>
  );
}

