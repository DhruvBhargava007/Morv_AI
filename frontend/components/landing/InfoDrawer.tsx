'use client';

import React from 'react';
import { PartData } from '@/lib/landing-types';

// Helper to format field names for display
const formatFieldName = (field: string) => {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

// Helper to format field values
const formatFieldValue = (key: string, value: any) => {
  if (typeof value === 'number') {
    if (key.includes('_mm') || key.includes('caliber')) {
      return `${value} mm`;
    }
    if (key.includes('_m')) {
      return `${value} m`;
    }
    if (key.includes('_kmh') || key.includes('speed')) {
      return `${value} km/h`;
    }
    if (key.includes('_km')) {
      return `${value} km`;
    }
    if (key.includes('_hp') || key.includes('power')) {
      return `${value} HP`;
    }
    if (key.includes('_nm') || key.includes('torque')) {
      return `${value} N⋅m`;
    }
    if (key.includes('_kg')) {
      return `${value.toLocaleString()} kg`;
    }
    if (key.includes('_liters') || key.includes('_l')) {
      return `${value} L`;
    }
    if (key.includes('_hours')) {
      return `${value} hours`;
    }
    if (key.includes('_rounds')) {
      return `${value} rounds`;
    }
    if (key.includes('_percent') || key.includes('_ratio')) {
      return value;
    }
    if (key.includes('degrees')) {
      return `${value}°`;
    }
    if (key.includes('_per_sec')) {
      return `${value}°/sec`;
    }
    if (key.includes('_per_min')) {
      return `${value}/min`;
    }
    if (typeof value === 'number' && value % 1 === 0) {
      return value.toLocaleString();
    }
    return value.toFixed(2);
  }
  if (value === 1 || value === 0) {
    return value === 1 ? 'Yes' : 'No';
  }
  return String(value);
};

interface InfoDrawerProps {
  selectedPart: PartData | null;
  isOpen: boolean;
  onClose: () => void;
  isAlwaysVisible?: boolean;
}

const InfoDrawer: React.FC<InfoDrawerProps> = ({ selectedPart, isOpen, onClose, isAlwaysVisible }) => {
  const isDatabaseData = selectedPart?.partData && selectedPart.partData.specifications;

  if (!isAlwaysVisible && (!isOpen || !selectedPart)) return null;

  return (
    <div className="h-full w-full bg-gray-900/95 backdrop-blur-sm border border-gray-800 shadow-2xl overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Part Details</h2>
          {!isAlwaysVisible && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {!selectedPart ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400 text-sm">Click on a part to view details</p>
              <p className="text-gray-500 text-xs mt-2">Or use the part selector buttons</p>
            </div>
          </div>
        ) : isDatabaseData ? (
          <>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white mb-2 capitalize">{selectedPart.partName || selectedPart.name}</h3>
              <p className="text-gray-400 text-sm mb-3">{selectedPart.partData?.description}</p>
            </div>

            {selectedPart.partData?.specifications && Object.keys(selectedPart.partData.specifications).length > 0 && (
              <div className="mb-5">
                <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase">Specifications</h4>
                <div className="space-y-2">
                  {Object.entries(selectedPart.partData.specifications).map(([key, value]) => (
                    <div key={key} className="p-2 bg-gray-800/50 rounded border border-gray-700/50">
                      <div className="flex justify-between items-start">
                        <span className="text-gray-400 text-xs">{formatFieldName(key)}:</span>
                        <span className="text-white text-xs font-medium text-right ml-2">
                          {formatFieldValue(key, value)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPart.maintenanceData && Object.keys(selectedPart.maintenanceData).length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase">Maintenance Requirements</h4>
                <div className="space-y-2">
                  {Object.entries(selectedPart.maintenanceData)
                    .filter(([key, value]) => value !== null && value !== undefined)
                    .map(([key, value]) => (
                      <div key={key} className="p-2 bg-gray-800/50 rounded border border-gray-700/50">
                        <div className="flex justify-between items-start">
                          <span className="text-gray-400 text-xs">{formatFieldName(key)}:</span>
                          <span className="text-white text-xs font-medium text-right ml-2">
                            {formatFieldValue(key, value)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white mb-2">{selectedPart.name}</h3>
              <p className="text-gray-400 text-sm mb-3">{selectedPart.description}</p>
              
              <div className="inline-block px-3 py-1 rounded border bg-green-500/20 text-green-400 border-green-500/50 text-xs font-medium">
                OPERATIONAL
              </div>
            </div>

            {selectedPart.lastMaintenance && (
              <div className="mb-5 p-3 bg-gray-800/50 rounded border border-gray-700/50">
                <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Maintenance Schedule</h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last:</span>
                    <span className="text-white">{selectedPart.lastMaintenance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Next:</span>
                    <span className="text-white font-medium">{selectedPart.nextMaintenance}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedPart.maintenanceHistory && selectedPart.maintenanceHistory.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase">History</h4>
                <div className="space-y-2">
                  {selectedPart.maintenanceHistory.map((entry, index) => (
                    <div key={index} className="p-3 bg-gray-800/50 rounded border border-gray-700/50">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-white text-sm font-medium">{entry.date}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          entry.type === 'Repair' ? 'bg-red-500/20 text-red-400' :
                          entry.type === 'Preventive' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {entry.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{entry.technician}</p>
                      <p className="text-sm text-gray-300">{entry.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InfoDrawer;

