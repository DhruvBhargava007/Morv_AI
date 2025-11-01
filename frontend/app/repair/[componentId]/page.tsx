'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIRecommendation } from '@/components/repair/AIRecommendation';
import { PersonnelAssignment } from '@/components/repair/PersonnelAssignment';
import { WorkOrderForm } from '@/components/repair/WorkOrderForm';
import { PartTransferSystem } from '@/components/repair/PartTransferSystem';
import { LiveReasoningPanel } from '@/components/repair/LiveReasoningPanel';
import { TankComponent, Tank } from '@/lib/types';
import { allTanks, dummyPersonnel, tankNetwork } from '@/lib/dummy-data';
import { getAIRecommendation } from '@/lib/repair-utils';
import RepairContextManager from '@/lib/repair-context';
import { ArrowLeft, Loader2, CheckCircle, Database } from 'lucide-react';

interface RepairPageProps {
  params: Promise<{ componentId: string }>;
}

export default function RepairPage({ params }: RepairPageProps) {
  const resolvedParams = use(params);
  const componentId = resolvedParams.componentId;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [component, setComponent] = useState<TankComponent | null>(null);
  const [tank, setTank] = useState<Tank | null>(null);
  const [userRole] = useState<'admin' | 'technician'>('admin'); // In real app, get from auth
  const [recommendation, setRecommendation] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedType, setSubmittedType] = useState<string>('');
  
  // AI streaming state for reasoning panel
  const [streamUpdates, setStreamUpdates] = useState<any[]>([]);
  const [currentStreamingType, setCurrentStreamingType] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [contextLoaded, setContextLoaded] = useState(false);

  useEffect(() => {
    // Load component and repair context
    const loadRepairData = async () => {
      // Find the component and tank
      let foundComponent: TankComponent | null = null;
      let foundTank: Tank | null = null;

      for (const t of allTanks) {
        const comp = t.components.find(c => c.id === componentId);
        if (comp) {
          foundComponent = comp;
          foundTank = t;
          break;
        }
      }

      if (foundComponent && foundTank) {
        setComponent(foundComponent);
        setTank(foundTank);
        
        // Get AI recommendation
        const aiRec = getAIRecommendation(foundComponent, foundTank, dummyPersonnel, allTanks);
        setRecommendation(aiRec);
        
        // Build and store comprehensive repair context
        const repairContext = RepairContextManager.buildRepairContext(
          foundComponent,
          foundTank,
          aiRec
        );
        
        await RepairContextManager.storeContext(componentId, repairContext);
        setContextLoaded(true);
      }

      setLoading(false);
    };

    // Simulate analysis delay for UX
    const timer = setTimeout(loadRepairData, 1000);

    return () => clearTimeout(timer);
  }, [componentId]);

  const handleStreamUpdate = (updates: any[], formType: string) => {
    setStreamUpdates(updates);
    setCurrentStreamingType(formType);
    setIsStreaming(updates.length > 0);
  };

  const handleSubmit = (type: string, data: any) => {
    console.log(`Submitted ${type}:`, data);
    setSubmittedType(type);
    setSubmitted(true);
    
    // Auto-redirect after 2 seconds
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-slate-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-200 mb-2">
            Analyzing Repair Options
          </h2>
          <p className="text-slate-400">AI is evaluating the best solution for this component...</p>
        </div>
      </div>
    );
  }

  if (!component || !tank) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-200 mb-2">
            Component Not Found
          </h2>
          <p className="text-slate-400 mb-4">
            The requested component could not be found.
          </p>
          <Button onClick={() => router.push('/')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900 border-slate-700/50 max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-200 mb-2">
              {userRole === 'admin' ? 'Approved!' : 'Submitted!'}
            </h2>
            <p className="text-slate-300 mb-4">
              {userRole === 'admin' 
                ? `Your ${submittedType} has been approved and is now active.`
                : `Your ${submittedType} has been submitted for admin approval.`
              }
            </p>
            <p className="text-sm text-slate-500">
              Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getHealthColor = (health: number) => {
    if (health >= 85) return 'text-slate-300';
    if (health >= 70) return 'text-slate-400';
    if (health >= 50) return 'text-slate-500';
    return 'text-slate-600';
  };

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

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-6 max-w-[1800px]">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-4 text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-100 mb-2">
                  Component Repair Workflow
                </h1>
                <p className="text-slate-400 mb-4">
                  AI-driven repair recommendations and execution
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                      Component
                    </div>
                    <div className="text-base font-semibold text-slate-200">
                      {component.name}
                    </div>
                    <div className="text-xs font-mono text-slate-500">{component.id}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                      Tank
                    </div>
                    <div className="text-base font-semibold text-slate-200">
                      {tank.designation}
                    </div>
                    <div className="text-xs font-mono text-slate-500">{tank.serialNumber}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                      Health
                    </div>
                    <div className={`text-2xl font-bold ${getHealthColor(component.health)}`}>
                      {component.health}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                      Status
                    </div>
                    <Badge className={getStatusColor(component.status)}>
                      {component.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
              <Badge className="bg-slate-800/50 text-slate-300 border-slate-700/50 text-sm">
                {userRole.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        {recommendation && (
          <div className="mb-6">
            <AIRecommendation recommendation={recommendation} />
          </div>
        )}

        {/* Context Loaded Indicator */}
        {contextLoaded && (
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
            <Database className="w-4 h-4" />
            <span>Repair context loaded - AI agents have full component history</span>
          </div>
        )}

        {/* Live AI Reasoning Panel */}
        <div className="mb-6">
          <LiveReasoningPanel
            isStreaming={isStreaming}
            isConnected={false}
            updates={streamUpdates}
            currentField={currentStreamingType}
          />
        </div>

        {/* Three Options */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Option 1: Personnel Assignment */}
          <PersonnelAssignment
            component={component}
            tank={tank}
            availablePersonnel={dummyPersonnel}
            isRecommended={recommendation?.type === 'assign'}
            userRole={userRole}
            onSubmit={(data) => handleSubmit('personnel assignment', data)}
            onStreamUpdate={(updates) => handleStreamUpdate(updates, 'personnel_assignment')}
          />

          {/* Option 2: Work Order */}
          <WorkOrderForm
            component={component}
            tank={tank}
            isRecommended={recommendation?.type === 'order'}
            userRole={userRole}
            onSubmit={(data) => handleSubmit('work order', data)}
            onStreamUpdate={(updates) => handleStreamUpdate(updates, 'work_order')}
          />

          {/* Option 3: Part Transfer */}
          <PartTransferSystem
            component={component}
            tank={tank}
            allTanks={allTanks}
            tankNetwork={tankNetwork}
            isRecommended={recommendation?.type === 'transfer'}
            userRole={userRole}
            onSubmit={(data) => handleSubmit('part transfer', data)}
            onStreamUpdate={(updates) => handleStreamUpdate(updates, 'part_transfer')}
          />
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            Component Repair Workflow v1.0 | AI-Powered Decision Support
          </p>
        </footer>
      </div>
    </div>
  );
}

