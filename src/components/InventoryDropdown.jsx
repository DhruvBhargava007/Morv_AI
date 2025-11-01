import React, { useState, useEffect, useRef } from 'react';
import { tanks } from '../config/tanks';

const InventoryDropdown = ({ selectedTank, onTankSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const tankOptions = Object.values(tanks);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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
                className="bg-gray-800/80 border border-gray-700 rounded px-3 py-2 text-white text-sm font-medium hover:bg-gray-700 transition-colors flex items-center gap-2 min-w-[140px]"
            >
                <span>Inventory</span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded shadow-lg overflow-hidden min-w-[180px] z-50">
                    {tankOptions.map((tank) => (
                        <button
                            key={tank.id}
                            onClick={() => {
                                if (tank.modelPath) {
                                    onTankSelect(tank);
                                    setIsOpen(false);
                                }
                            }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${selectedTank?.id === tank.id
                                ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-500'
                                : 'text-gray-300 hover:bg-gray-800'
                                } ${!tank.modelPath ? 'opacity-40 cursor-not-allowed' : ''}`}
                            disabled={!tank.modelPath}
                        >
                            <span className="font-normal">{tank.name}</span>
                            {selectedTank?.id === tank.id && (
                                <span className="text-blue-400 text-xs">●</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InventoryDropdown;
