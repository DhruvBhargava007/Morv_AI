'use client';

import { useState } from 'react';
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
import { MaintenanceWeights, Tank } from '@/lib/types';
import { allTanks, defaultWeights } from '@/lib/dummy-data';

export default function Home() {
  const [weights, setWeights] = useState<MaintenanceWeights>(defaultWeights);
  const [selectedTank, setSelectedTank] = useState<Tank>(allTanks[0]);
  const [userRole, setUserRole] = useState<UserRole>('admin');

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
              <RoleSelector 
                role={userRole}
                onRoleChange={setUserRole}
              />
              <TankSelector 
                tanks={allTanks} 
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
