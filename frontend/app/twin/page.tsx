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
      const partData = partsData[dbPartName] || partsData['turret'];
      if (partData) {
        setSelectedPart(partData);
        setDrawerOpen(true);
      }
    } catch (error) {
      console.error('Error loading part data:', error);
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
    <div className="w-full h-screen bg-gray-900 relative overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-40 bg-black/60 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Morv AI</h1>
              <p className="text-gray-400 text-xs mt-0.5">Military CMMS System</p>
            </div>
            <InventoryDropdown 
              selectedTank={currentTank}
              onTankSelect={handleTankSelect}
            />
          </div>
          <div className="flex items-center gap-4">
            {/* Run AI Agent Pipeline Button */}
            <button
              onClick={handleRunAIPipeline}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2 border border-blue-400/30"
            >
              <Play className="w-5 h-5" />
              Run AI Agent Pipeline on Digital Twin
            </button>
            <div className="text-right">
              <div className="text-white text-xs mb-0.5">Vehicle: {currentTank.vehicleId}</div>
              <div className="text-green-400 text-xs">● Operational</div>
            </div>
          </div>
        </div>
      </header>

      {/* 4-Quadrant Layout */}
      <div className="w-full h-full pt-16 grid grid-cols-2 grid-rows-2">
        {/* Top Left Quadrant - 3D Scene */}
        <div className="relative border-r border-b border-gray-800">
          {/* Part selector buttons overlay */}
          <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-sm border border-gray-800 rounded-lg px-3 py-2">
            <p className="text-gray-300 text-xs mb-2">
              Hover to highlight • Click for details
            </p>
            <div className="flex flex-wrap gap-1">
              {availableParts.map((part, index) => (
                <button
                  key={part}
                  onClick={() => handlePartClick(part)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    index === currentPartIndex
                      ? 'bg-blue-500/30 border-blue-500 text-blue-300'
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
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
              <div className="bg-black/80 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-2 shadow-lg">
                <p className="text-white text-sm font-medium capitalize">{hoveredPart}</p>
                <p className="text-gray-400 text-xs mt-0.5">Click to view</p>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {loadingPart && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-black/80 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-3 shadow-lg">
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
