'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TankConfig } from '@/lib/landing-types';
import { tanks } from '@/lib/landing-config';

interface InventoryDropdownProps {
  selectedTank: TankConfig;
  onTankSelect: (tank: TankConfig) => void;
}

const InventoryDropdown: React.FC<InventoryDropdownProps> = ({ selectedTank, onTankSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const tankOptions = Object.values(tanks);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="card-military border-[#3B82F6]/30 hover:border-[#3B82F6]/60 px-3 py-2 text-white text-sm font-medium transition-all flex items-center gap-2 min-w-[140px] hover:shadow-[0_0_12px_rgba(59,130,246,0.3)]"
      >
        <span className="font-sans">Inventory</span>
        <svg
          className={`w-4 h-4 transition-transform text-[#60A5FA] ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 card-military border-[#3B82F6]/30 shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden min-w-[180px] z-50 accent-glow">
          {tankOptions.map((tank) => (
            <button
              key={tank.id}
              onClick={() => {
                if (tank.modelPath) {
                  onTankSelect(tank);
                  setIsOpen(false);
                }
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-all flex items-center justify-between font-sans ${
                selectedTank?.id === tank.id
                  ? 'bg-gradient-to-r from-[#3B82F6]/30 to-[#2563EB]/20 text-[#60A5FA] border-l-2 border-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                  : 'text-[#8B949E] hover:bg-[#3B82F6]/10 hover:text-[#60A5FA]'
              } ${!tank.modelPath ? 'opacity-40 cursor-not-allowed' : ''}`}
              disabled={!tank.modelPath}
            >
              <span className="font-normal">{tank.name}</span>
              {selectedTank?.id === tank.id && (
                <span className="text-[#60A5FA] text-xs font-semibold">●</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryDropdown;

