'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WeightPanel } from '@/components/WeightPanel';
import { TankOverview } from '@/components/TankOverview';
import { TankSelector } from '@/components/TankSelector';
import { RoleSelector, UserRole } from '@/components/RoleSelector';
import { ComponentHealthRadar } from '@/components/charts/ComponentHealthRadar';
import { ComponentHealthCards } from '@/components/charts/ComponentHealthCards';
import { MaintenanceTimeline } from '@/components/charts/MaintenanceTimeline';
import { ReadinessBreakdown } from '@/components/charts/ReadinessBreakdown';
import { ComponentHealthTrend } from '@/components/charts/ComponentHealthTrend';
import { ContextUpload } from '@/components/upload/ContextUpload';
import { AIExplanationPanel } from '@/components/AIExplanationPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MaintenanceWeights, Tank } from '@/lib/types';
import { allTanks, defaultWeights, dummyApprovalRequests } from '@/lib/dummy-data';
import { fetchPredictions, fetchMaintenance } from '@/lib/api-client';
import { ClipboardCheck, AlertCircle } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [weights, setWeights] = useState<MaintenanceWeights>(defaultWeights);
  const [selectedTank, setSelectedTank] = useState<Tank>(allTanks[0]);
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [tankList, setTankList] = useState<Tank[]>(allTanks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingApprovals = dummyApprovalRequests.filter(r => r.status === 'pending').length;

  // Fetch real data from API for selected tank
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      
      try {
        const [predictions, maintenance] = await Promise.all([
          fetchPredictions(selectedTank.id),
          fetchMaintenance(selectedTank.id)
        ]);
        
        // Update the selected tank with real API data (includes AI explanations)
        const updatedTank: Tank = {
          ...selectedTank,
          readinessScore: predictions.readinessScore,
          components: predictions.components.map(c => ({
            id: c.id,
            name: c.name || c.id,
            health: c.health,
            status: c.status,
            hoursRemaining: c.hoursRemaining,
            lastServiced: c.lastServiced,
            nextService: c.nextService,
            explanation: c.explanation,  // AI-generated explanation from agents
            drivers: c.drivers,
            formula: c.formula
          })),
          maintenanceEvents: maintenance.events.map(e => ({
            id: e.id,
            date: e.date,
            type: e.type,
            component: e.component,
            description: e.description,
            status: e.status,
            priority: e.priority
          }))
        };
        
        // Update both the selected tank and the tank in the list
        setSelectedTank(updatedTank);
        setTankList(prev => prev.map(t => t.id === updatedTank.id ? updatedTank : t));
        setError(null);
      } catch (err) {
        console.error('Failed to load API data:', err);
        setError('Using offline data - backend not available');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [selectedTank.id]);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-6 max-w-[1800px]">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-100 mb-1">
                Tank Maintenance Control System
          </h1>
              <p className="text-slate-400">
                Advanced predictive maintenance monitoring and management
          </p>
        </div>
            <div className="flex items-center gap-3">
              {userRole === 'admin' && (
                <Button
                  onClick={() => router.push('/approvals')}
                  variant="outline"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-950/50 relative"
                >
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Approvals
                  {pendingApprovals > 0 && (
                    <Badge className="ml-2 bg-amber-500 text-slate-950 border-0">
                      {pendingApprovals}
                    </Badge>
                  )}
                </Button>
              )}
              <RoleSelector 
                role={userRole}
                onRoleChange={setUserRole}
              />
              <TankSelector 
                tanks={tankList} 
                selectedTank={selectedTank} 
                onSelectTank={setSelectedTank}
              />
              <div className="text-right">
                <p className="text-sm text-slate-500 uppercase tracking-wider">System Status</p>
                <p className="text-green-400 font-semibold">OPERATIONAL</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Weight Panel (Admin Only) */}
          {userRole === 'admin' && (
            <div className="col-span-12 lg:col-span-4 xl:col-span-3">
              <div className="sticky top-6">
                <WeightPanel 
                  weights={weights} 
                  onWeightsChange={setWeights}
                  readOnly={false}
                />
              </div>
            </div>
          )}

          {/* Main Content - Full width for technicians, reduced for admin */}
          <div className={`${userRole === 'admin' ? 'col-span-12 lg:col-span-8 xl:col-span-9' : 'col-span-12'} space-y-6`}>
            {/* Loading/Error State */}
            {error && (
              <div className="mb-4 p-4 bg-amber-950/30 border border-amber-500/50 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span className="text-amber-200 text-sm">{error}</span>
              </div>
            )}

            {loading && (
              <div className="mb-4 p-4 bg-blue-950/30 border border-blue-500/50 rounded-lg text-center">
                <span className="text-blue-200 text-sm">Loading tank data...</span>
              </div>
            )}

            {/* Tank Overview */}
            <TankOverview tank={selectedTank} isTechnician={userRole === 'technician'} />

            {/* Readiness Breakdown - Admin Only */}
            {userRole === 'admin' && (
              <ReadinessBreakdown 
                weights={weights} 
                readinessScore={selectedTank.readinessScore}
              />
            )}

            {/* Component Health - Different views for admin vs technician */}
            {userRole === 'admin' ? (
              <ComponentHealthRadar 
                components={selectedTank.components}
                showDistribution={true}
              />
            ) : (
              <ComponentHealthCards 
                components={selectedTank.components}
              />
            )}

            {/* Component Health Trends - Admin Only */}
            {userRole === 'admin' && (
              <ComponentHealthTrend 
                components={selectedTank.components}
                days={30}
              />
            )}

            {/* AI Health Analysis with Explanations */}
            <AIExplanationPanel components={selectedTank.components} />

            {/* Maintenance Timeline */}
            <MaintenanceTimeline 
              events={selectedTank.maintenanceEvents}
              showDistribution={userRole === 'admin'}
            />

            {/* AI Context Upload - Admin Only */}
            {userRole === 'admin' && (
              <ContextUpload tankId={selectedTank.id} />
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            Tank Maintenance Control System v1.0 | Classified: UNCLASSIFIED
          </p>
        </footer>
      </div>
    </div>
  );
}
