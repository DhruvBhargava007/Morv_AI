'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { RoleSelector, UserRole } from '@/components/RoleSelector';
import { TankSelector } from '@/components/TankSelector';
import { Tank } from '@/lib/types';
import { allTanks, defaultWeights } from '@/lib/dummy-data';
import { AlertTriangle, ArrowLeft, Shield, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HealthFileUpload } from '@/components/dashboard/HealthFileUpload';

// Dynamically import chart components to reduce initial bundle size and prevent memory issues
const ComponentHealthCards = dynamic(
  () => import('@/components/charts/ComponentHealthCards').then(mod => ({ default: mod.ComponentHealthCards })),
  { ssr: false, loading: () => <div className="h-64 bg-slate-900 rounded-lg animate-pulse" /> }
);
// ComponentHealthTrend and ComponentHealthRadar removed from dashboard
const MaintenanceTimeline = dynamic(
  () => import('@/components/charts/MaintenanceTimeline').then(mod => ({ default: mod.MaintenanceTimeline })),
  { ssr: false, loading: () => <div className="h-64 bg-slate-900 rounded-lg animate-pulse" /> }
);
const ReadinessBreakdown = dynamic(
  () => import('@/components/charts/ReadinessBreakdown').then(mod => ({ default: mod.ReadinessBreakdown })),
  { ssr: false, loading: () => <div className="h-64 bg-slate-900 rounded-lg animate-pulse" /> }
);

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTank, setSelectedTank] = useState<Tank>(() => allTanks[0]);
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [aiAdjustedScores, setAiAdjustedScores] = useState<Record<string, {original_health: number; adjusted_health: number; confidence: number; reasoning: string}>>({});
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    const tankId = searchParams.get('tankId');
    if (tankId) {
      const tank = allTanks.find(t => t.id === tankId);
      if (tank) setSelectedTank(tank);
    }
  }, [searchParams]);

  const handleUploadComplete = async (jobId: string, category: string) => {
    setIsRecalculating(true);
    try {
      const response = await fetch('http://localhost:8000/api/health/recalculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tank_id: selectedTank.id,
          job_id: jobId,
          detected_category: category,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store adjusted scores
        const scores: Record<string, {original_health: number; adjusted_health: number; confidence: number; reasoning: string}> = {};
        for (const [componentId, scoreData] of Object.entries(data.adjusted_scores || {})) {
          scores[componentId] = {
            original_health: (scoreData as any).original_health,
            adjusted_health: (scoreData as any).adjusted_health,
            confidence: (scoreData as any).confidence,
            reasoning: (scoreData as any).reasoning,
          };
        }
        setAiAdjustedScores(scores);
      }
    } catch (error) {
      console.error('Recalculation failed:', error);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Memoize broken/critical components to avoid recalculating
  const brokenComponents = useMemo(() => 
    selectedTank.components.filter(
      c => c.status === 'critical' || c.status === 'maintenance_required' || c.health < 50
    ), [selectedTank.components]
  );

  const criticalComponents = useMemo(() => 
    selectedTank.components.filter(c => c.status === 'critical'),
    [selectedTank.components]
  );

  // Admin vs Technician view differences
  const isAdmin = userRole === 'admin';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-black/60 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl title-brand">MORV AI</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <TankSelector
              tanks={allTanks}
              selectedTank={selectedTank}
              onSelectTank={setSelectedTank}
            />
            {isAdmin && (
              <HealthFileUpload
                tankId={selectedTank.id}
                onUploadComplete={handleUploadComplete}
              />
            )}
            <RoleSelector
              role={userRole}
              onRoleChange={setUserRole}
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Alert Banner for Broken Components */}
        {brokenComponents.length > 0 && (
          <Card className="bg-slate-900/70 border-slate-700/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-slate-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-400 mb-1">
                    {brokenComponents.length} Component{brokenComponents.length !== 1 ? 's' : ''} Requiring Attention
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">
                    {criticalComponents.length > 0 && (
                      <span className="font-semibold">{criticalComponents.length} critical</span>
                    )}
                    {criticalComponents.length > 0 && brokenComponents.length > criticalComponents.length && ' • '}
                    {brokenComponents.length > criticalComponents.length && (
                      <span>{brokenComponents.length - criticalComponents.length} maintenance required</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {brokenComponents.slice(0, 5).map(component => (
                      <Badge
                        key={component.id}
                        className="bg-slate-800/50 text-slate-300 border-slate-700/50 cursor-pointer hover:bg-slate-800/70"
                        onClick={() => router.push(`/repair/${component.id}`)}
                      >
                        {component.name}
                      </Badge>
                    ))}
                    {brokenComponents.length > 5 && (
                      <Badge className="bg-slate-800/50 text-slate-300 border-slate-700/50">
                        +{brokenComponents.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tank Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Tank Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield className={`w-5 h-5 ${
                  selectedTank.status === 'operational' ? 'text-slate-400' :
                  selectedTank.status === 'maintenance' ? 'text-slate-500' :
                  'text-slate-600'
                }`} />
                <span className="text-xl font-bold text-slate-200 capitalize">{selectedTank.status}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{selectedTank.designation}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Readiness Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-200">{selectedTank.readinessScore}%</div>
              <p className="text-xs text-slate-500 mt-1">Overall System Health</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Components</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-200">{selectedTank.components.length}</div>
              <p className="text-xs text-slate-500 mt-1">Total Components</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Maintenance Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-200">
                {selectedTank.maintenanceEvents.filter(e => e.status === 'pending' || e.status === 'in_progress').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Active & Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Component Health Cards - Shows what's broken - All roles */}
          <div className="lg:col-span-2">
            <ComponentHealthCards 
              components={selectedTank.components}
              aiAdjustedScores={aiAdjustedScores}
            />
          </div>

          {/* Maintenance Timeline - All roles */}
          <div className="lg:col-span-2">
            <MaintenanceTimeline 
              events={selectedTank.maintenanceEvents} 
              showDistribution={true} 
            />
          </div>

          {/* Readiness Breakdown - Admin only */}
          {isAdmin && (
            <div className="lg:col-span-2">
              <ReadinessBreakdown weights={defaultWeights} readinessScore={selectedTank.readinessScore} />
            </div>
          )}

          {/* Role-specific Actions Section */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-slate-400" />
                  <CardTitle className="text-slate-100">
                    {isAdmin ? 'Administrator Actions' : 'Technician View'}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isAdmin ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => router.push('/approvals')}
                      className="p-4 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-all text-left"
                    >
                      <h3 className="font-semibold text-slate-200 mb-1">Approve Requests</h3>
                      <p className="text-sm text-slate-400">Review and approve work orders, transfers, and assignments</p>
                    </button>
                    <button
                      onClick={() => router.push(`/repair/${brokenComponents[0]?.id || selectedTank.components[0].id}`)}
                      className="p-4 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-all text-left"
                    >
                      <h3 className="font-semibold text-slate-200 mb-1">Create Work Order</h3>
                      <p className="text-sm text-slate-400">Generate new maintenance work orders for components</p>
                    </button>
                    <button
                      onClick={() => router.push(`/repair/${brokenComponents[0]?.id || selectedTank.components[0].id}`)}
                      className="p-4 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-all text-left"
                    >
                      <h3 className="font-semibold text-slate-200 mb-1">System Settings</h3>
                      <p className="text-sm text-slate-400">Configure maintenance weights and thresholds</p>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <h3 className="font-semibold text-slate-200 mb-2">View-Only Access</h3>
                      <p className="text-sm text-slate-400">
                        As a technician, you can view all component health data, maintenance schedules, and system analytics.
                        Contact an administrator to submit work orders or request approvals.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => router.push(`/repair/${brokenComponents[0]?.id || selectedTank.components[0].id}`)}
                        className="p-4 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-all text-left"
                      >
                        <h3 className="font-semibold text-slate-200 mb-1">View Component Details</h3>
                        <p className="text-sm text-slate-400">Inspect individual component health and maintenance history</p>
                      </button>
                      <button
                        onClick={() => router.push(`/repair/${brokenComponents[0]?.id || selectedTank.components[0].id}`)}
                        className="p-4 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-all text-left"
                      >
                        <h3 className="font-semibold text-slate-200 mb-1">Maintenance Schedule</h3>
                        <p className="text-sm text-slate-400">View upcoming and active maintenance events</p>
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

