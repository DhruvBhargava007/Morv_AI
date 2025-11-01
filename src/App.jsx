import React, { useState, useEffect } from 'react';
import Scene3D from './components/Scene3D';
import InfoDrawer from './components/InfoDrawer';
import InventoryDropdown from './components/InventoryDropdown';
import UploadButton from './components/UploadButton';
import SpecChanger from './components/SpecChanger';
import { partsData } from './data/mockData';
import { defaultTank } from './config/tanks';
import { getPartInfo, initDatabase } from './services/database';

function App() {
  const [selectedPart, setSelectedPart] = useState(null);
  const [hoveredPart, setHoveredPart] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTank, setCurrentTank] = useState(defaultTank);
  const [loadingPart, setLoadingPart] = useState(false);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);

  // Available parts for cycling and selection
  const availableParts = ['turret', 'engine', 'tracks', 'armor', 'optics', 'transmission'];

  // Initialize database on mount
  useEffect(() => {
    initDatabase().catch(console.error);
  }, []);

  const handlePartClick = async (partName) => {
    console.log('🔵 handlePartClick called with:', partName);
    setLoadingPart(true);
    
    // Map common part names to database part names - expanded mapping
    const partNameMap = {
      // Turret variations
      'turret': 'turret',
      'gun': 'turret',
      'main gun': 'turret',
      'weapon': 'turret',
      'cannon': 'turret',
      'barrel': 'turret',
      // Engine variations
      'engine': 'engine',
      'powerplant': 'engine',
      'motor': 'engine',
      'power': 'engine',
      'powertrain': 'engine',
      // Tracks variations
      'tracks': 'tracks',
      'track': 'tracks',
      'suspension': 'tracks',
      'wheel': 'tracks',
      'wheels': 'tracks',
      'running gear': 'tracks',
      // Armor variations
      'armor': 'armor',
      'hull': 'armor',
      'protection': 'armor',
      'body': 'armor',
      // Optics variations
      'optics': 'optics',
      'sight': 'optics',
      'fire control': 'optics',
      'fcs': 'optics',
      'viewer': 'optics',
      // Transmission variations
      'transmission': 'transmission',
      'gearbox': 'transmission',
      'trans': 'transmission'
    };

    const normalizedPartName = partName.toLowerCase().trim();
    let dbPartName = partNameMap[normalizedPartName];
    
    // Try to find direct match first
    if (!dbPartName) {
      // Try exact match
      dbPartName = partNameMap[normalizedPartName];
    }
    
    // Try to find partial match
    if (!dbPartName) {
      for (const [key, value] of Object.entries(partNameMap)) {
        if (normalizedPartName.includes(key) || key.includes(normalizedPartName)) {
          dbPartName = value;
          console.log(`✅ Matched "${partName}" to "${key}" -> ${value}`);
          break;
        }
      }
    }

    // If still no match, cycle to next part instead of defaulting
    if (!dbPartName) {
      console.log('⚠️ Part not recognized, cycling to next part:', partName);
      // Cycle to next part in the list
      const nextIndex = (currentPartIndex + 1) % availableParts.length;
      setCurrentPartIndex(nextIndex);
      dbPartName = availableParts[nextIndex];
      console.log(`🔄 Cycling to: ${dbPartName}`);
    } else {
      // Update index to match the selected part
      const foundIndex = availableParts.indexOf(dbPartName);
      if (foundIndex !== -1) {
        setCurrentPartIndex(foundIndex);
      }
    }

    try {
      // Try to get data from database first
      const dbPartInfo = await getPartInfo(currentTank, dbPartName);
      
      if (dbPartInfo) {
        // Add the actual part name for display
        dbPartInfo.partName = dbPartName.charAt(0).toUpperCase() + dbPartName.slice(1);
        setSelectedPart(dbPartInfo);
        setDrawerOpen(true);
        console.log('Opening drawer with database data:', dbPartName);
      } else {
        // Fallback to mock data
        console.log('Database query returned no data, using mock data');
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

  const handlePartHover = (partName) => {
    setHoveredPart(partName);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedPart(null);
  };

  const handleTankSelect = (tank) => {
    if (tank.modelPath) {
      setCurrentTank(tank);
      // Close drawer when switching tanks
      setDrawerOpen(false);
      setSelectedPart(null);
    }
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
            {/* Inventory Dropdown */}
            <InventoryDropdown 
              selectedTank={currentTank}
              onTankSelect={handleTankSelect}
            />
          </div>
          <div className="text-right">
            <div className="text-white text-xs mb-0.5">Vehicle: {currentTank.vehicleId}</div>
            <div className="text-green-400 text-xs">● Operational</div>
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

          {/* 3D Scene */}
          <Scene3D
            onPartHover={handlePartHover}
            onPartClick={handlePartClick}
            hoveredPart={hoveredPart}
            tankModel={currentTank}
          />
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

export default App;

