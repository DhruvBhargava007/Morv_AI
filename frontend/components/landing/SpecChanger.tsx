'use client';

import React, { useState } from 'react';
import { PartData } from '@/lib/landing-types';

interface SpecChangerProps {
  selectedPart: PartData | null;
}

const SpecChanger: React.FC<SpecChangerProps> = ({ selectedPart }) => {
  const [recommendations, setRecommendations] = useState<Array<{
    partSection: string;
    recommendation: string;
    timestamp: string;
    partName: string;
  }>>([]);

  const handleManualInput = () => {
    const text = prompt('Enter your recommendation for changes:');
    if (text) {
      const recommendation = {
        partSection: selectedPart?.name?.toLowerCase() || 'turret',
        recommendation: text,
        timestamp: new Date().toISOString(),
        partName: selectedPart?.name || 'Unknown',
      };

      setRecommendations(prev => [...prev, recommendation]);

      // Create JSON file with the recommendation
      const data = {
        ...recommendation,
        vehicleId: 'TANK-001',
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recommendation_${recommendation.partSection}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    }
  };

  return (
    <div className="h-full w-full bg-gray-900/60 backdrop-blur-sm border border-gray-800 p-4 overflow-y-auto">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Spec Changer</h3>
          <p className="text-gray-400 text-sm mb-4">
            Record recommendations for {selectedPart?.name || 'selected part'}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleManualInput}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Add Recommendation
          </button>
        </div>

        {recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Recent Recommendations</h4>
            <div className="space-y-2">
              {recommendations.slice().reverse().map((rec, index) => (
                <div key={index} className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-400 capitalize">{rec.partSection}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(rec.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">{rec.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecChanger;

