'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import InfoDrawer from '@/components/landing/InfoDrawer';
import InventoryDropdown from '@/components/landing/InventoryDropdown';
import UploadButton from '@/components/landing/UploadButton';
import SpecChanger from '@/components/landing/SpecChanger';
import { partsData } from '@/lib/landing-data';
import { defaultTank } from '@/lib/landing-config';
import { TankConfig, PartData } from '@/lib/landing-types';
import { Play } from 'lucide-react';

// Dynamically import Scene3D to avoid SSR issues with Three.js - load immediately but non-blocking
const Scene3D = dynamic(() => import('@/components/landing/Scene3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 relative">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-white text-sm font-medium">Initializing 3D Scene...</div>
        <div className="text-gray-400 text-xs">This may take a moment</div>
      </div>
    </div>
  ),
});

export default function DigitalTwinPage() {
  const router = useRouter();
  const [selectedPart, setSelectedPart] = useState<PartData | null>(null);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTank, setCurrentTank] = useState<TankConfig>(defaultTank);
  const [loadingPart, setLoadingPart] = useState(false);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure page renders immediately, model loads after mount
  React.useEffect(() => {
    setIsMounted(true);
    
    // Preload the default model early for faster initial load
    if (currentTank?.modelPath) {
      // Use link preload for faster loading
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'fetch';
      link.href = currentTank.modelPath;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      
      // Also preload related resources if GLTF
      if (currentTank.modelPath.endsWith('.gltf')) {
        const basePath = currentTank.modelPath.replace('/scene.gltf', '');
        // Preload .bin file
        const binLink = document.createElement('link');
        binLink.rel = 'preload';
        binLink.as = 'fetch';
        binLink.href = `${basePath}/scene.bin`;
        binLink.crossOrigin = 'anonymous';
        document.head.appendChild(binLink);
      }
    }
  }, []);

  const availableParts = ['turret', 'engine', 'tracks', 'armor', 'optics', 'transmission'];

  // Map frontend tank names to database names and variants
  const getTankDbMapping = (tank: TankConfig): { name: string; variant: string } => {
    const mapping: Record<string, { name: string; variant: string }> = {
      'Abrams M1A2 SEPv3': { name: 'M1 Abrams', variant: 'M1A2 SEPv3' },
      'Leopard 2A7': { name: 'Leopard 2', variant: '2A7' },
      'T-90M': { name: 'T-90', variant: 'T-90M Proryv-3' },
    };
    return mapping[tank.name] || { name: 'M1 Abrams', variant: 'M1A2 SEPv3' };
  };

  // Fetch part info from API
  const fetchPartInfo = async (tank: TankConfig, partName: string): Promise<PartData | null> => {
    const tankMapping = getTankDbMapping(tank);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    
    try {
      const params = new URLSearchParams({
        tank_name: tankMapping.name,
        tank_variant: tankMapping.variant,
        part_name: partName,
      });
      
      const response = await fetch(`${apiBase}/part-info?${params}`);
      
      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      
      return {
        partName: data.partName || partName,
        name: partName.charAt(0).toUpperCase() + partName.slice(1),
        description: data.partData?.description || `${partName} specifications`,
        partData: data.partData,
        maintenanceData: data.maintenanceData,
      };
    } catch (error) {
      console.error('Error fetching part info from API:', error);
      return null;
    }
  };

  const handlePartClick = async (partName: string) => {
    console.log('🔵 handlePartClick called with:', partName);
    setLoadingPart(true);
    
    const partNameMap: Record<string, string> = {
      'turret': 'turret',
      'gun': 'turret',
      'main gun': 'turret',
      'weapon': 'turret',
      'cannon': 'turret',
      'barrel': 'turret',
      'engine': 'engine',
      'powerplant': 'engine',
      'motor': 'engine',
      'power': 'engine',
      'powertrain': 'engine',
      'tracks': 'tracks',
      'track': 'tracks',
      'suspension': 'tracks',
      'wheel': 'tracks',
      'wheels': 'tracks',
      'running gear': 'tracks',
      'armor': 'armor',
      'hull': 'armor',
      'protection': 'armor',
      'body': 'armor',
      'optics': 'optics',
      'sight': 'optics',
      'fire control': 'optics',
      'fcs': 'optics',
      'viewer': 'optics',
      'transmission': 'transmission',
      'gearbox': 'transmission',
      'trans': 'transmission'
    };

    const normalizedPartName = partName.toLowerCase().trim();
    let dbPartName = partNameMap[normalizedPartName];
    
    if (!dbPartName) {
      for (const [key, value] of Object.entries(partNameMap)) {
        if (normalizedPartName.includes(key) || key.includes(normalizedPartName)) {
          dbPartName = value;
          console.log(`✅ Matched "${partName}" to "${key}" -> ${value}`);
          break;
        }
      }
    }

    if (!dbPartName) {
      console.log('⚠️ Part not recognized, cycling to next part:', partName);
      const nextIndex = (currentPartIndex + 1) % availableParts.length;
      setCurrentPartIndex(nextIndex);
      dbPartName = availableParts[nextIndex];
      console.log(`🔄 Cycling to: ${dbPartName}`);
    } else {
      const foundIndex = availableParts.indexOf(dbPartName);
      if (foundIndex !== -1) {
        setCurrentPartIndex(foundIndex);
      }
    }

    try {
      // Try to fetch from API first
      const apiPartData = await fetchPartInfo(currentTank, dbPartName);
      
      if (apiPartData && apiPartData.partData) {
        console.log('✅ Using database data for:', dbPartName);
        setSelectedPart(apiPartData);
        setDrawerOpen(true);
      } else {
        // Fallback to mock data if API fails
        console.log('⚠️ API data not available, using mock data for:', dbPartName);
      const partData = partsData[dbPartName] || partsData['turret'];
      if (partData) {
        setSelectedPart(partData);
        setDrawerOpen(true);
        }
      }
    } catch (error) {
      console.error('Error loading part data:', error);
      // Fallback to mock data on error
      const partData = partsData[dbPartName] || partsData['turret'];
      if (partData) {
        setSelectedPart(partData);
        setDrawerOpen(true);
      }
    } finally {
      setLoadingPart(false);
    }
  };

  const handlePartHover = (partName: string | null) => {
    setHoveredPart(partName);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedPart(null);
  };

  const handleTankSelect = (tank: TankConfig) => {
    if (tank.modelPath) {
      setCurrentTank(tank);
      setDrawerOpen(false);
      setSelectedPart(null);
    }
  };

  const handleRunAIPipeline = () => {
    router.push('/dashboard');
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <div className="w-full h-screen bg-black relative overflow-visible">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid-overlay opacity-40 pointer-events-none" />
      
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-40 bg-[#161B22]/90 backdrop-blur-sm border-b border-[#3B82F6]/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl title-brand">MORV AI</h1>
            </div>
            <InventoryDropdown 
              selectedTank={currentTank}
              onTankSelect={handleTankSelect}
            />
          </div>
          <div className="flex items-center gap-4">
            {/* Run Digital Pipeline Button */}
            <button
              onClick={handleRunAIPipeline}
              className="btn-military px-6 py-2.5 text-sm flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Run Digital Pipeline
            </button>
            <div className="text-right">
              <div className="text-white text-xs mb-0.5 font-sans">Vehicle: {currentTank.vehicleId}</div>
              <div className="status-operational text-xs font-sans font-semibold">● Operational</div>
            </div>
          </div>
        </div>
      </header>

      {/* 4-Quadrant Layout */}
      <div className="w-full h-full pt-16 grid grid-cols-2 grid-rows-2 overflow-visible">
        {/* Top Left Quadrant - 3D Scene */}
        <div className="relative border-r border-b border-white/8 overflow-visible" style={{ overflow: 'visible', clipPath: 'none' }}>
          {/* Part selector buttons overlay */}
          <div className="absolute top-4 left-4 z-20 card-military backdrop-blur-sm px-3 py-2 min-w-max" style={{ whiteSpace: 'nowrap' }}>
            <p className="text-white text-xs mb-2 font-sans">
              Hover to highlight • Click for details
            </p>
            <div className="flex flex-wrap gap-1">
              {availableParts.map((part, index) => (
                <button
                  key={part}
                  onClick={() => handlePartClick(part)}
                  className={`px-2 py-1 text-xs rounded-2xl border transition-all font-sans ${
                    index === currentPartIndex
                      ? 'bg-gradient-to-r from-[#3B82F6]/30 to-[#2563EB]/20 border-[#3B82F6]/60 text-[#60A5FA]'
                      : 'bg-[#21262D] border-[#3B82F6]/10 text-[#8B949E] hover:border-[#3B82F6]/40 hover:text-[#60A5FA] hover:bg-[#3B82F6]/10'
                  }`}
                >
                  {part.charAt(0).toUpperCase() + part.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Hover Tooltip */}
          {hoveredPart && !drawerOpen && !loadingPart && (
            <div className="absolute top-2 right-2 z-10 pointer-events-none">
              <div className="bg-black/80 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-2">
                <p className="text-white text-sm font-medium capitalize">{hoveredPart}</p>
                <p className="text-gray-400 text-xs mt-0.5">Click to view</p>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {loadingPart && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-black/80 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-white text-sm">Loading part data...</p>
                </div>
              </div>
            </div>
          )}

          {/* 3D Scene - Only render after mount to avoid blocking initial render */}
          {isMounted && (
            <Scene3D
              onPartHover={handlePartHover}
              onPartClick={handlePartClick}
              hoveredPart={hoveredPart}
              tankModel={currentTank}
            />
          )}
        </div>

        {/* Top Right Quadrant - Info Drawer */}
        <div className="relative border-b border-gray-800">
          <InfoDrawer
            selectedPart={selectedPart}
            isOpen={drawerOpen}
            onClose={handleCloseDrawer}
            isAlwaysVisible={true}
          />
        </div>

        {/* Bottom Left Quadrant - Spec Changer */}
        <div className="relative border-r border-gray-800">
          <SpecChanger selectedPart={selectedPart} />
        </div>

        {/* Bottom Right Quadrant - Upload Button */}
        <div className="relative">
          <UploadButton />
        </div>
      </div>
    </div>
  );
}
