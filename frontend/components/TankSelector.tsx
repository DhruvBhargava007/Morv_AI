'use client';

import { Tank } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Shield } from 'lucide-react';

interface TankSelectorProps {
  tanks: Tank[];
  selectedTank: Tank;
  onSelectTank: (tank: Tank) => void;
}

export function TankSelector({ tanks, selectedTank, onSelectTank }: TankSelectorProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-900/30 text-green-400 border-green-400/30';
      case 'maintenance':
        return 'bg-amber-900/30 text-amber-400 border-amber-400/30';
      case 'standby':
        return 'bg-blue-900/30 text-blue-400 border-blue-400/30';
      case 'critical':
        return 'bg-red-900/30 text-red-400 border-red-400/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-600';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-slate-100 min-w-[280px] justify-between"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="font-semibold">{selectedTank.id}</span>
            <span className="text-slate-500">|</span>
            <span className="text-sm text-slate-400">{selectedTank.designation}</span>
          </div>
          <ChevronDown className="w-4 h-4 ml-2 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[350px] bg-slate-900 border-slate-700">
        {tanks.map((tank) => (
          <DropdownMenuItem
            key={tank.id}
            onClick={() => onSelectTank(tank)}
            className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 p-4"
          >
            <div className="flex items-start justify-between w-full">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-slate-200">{tank.id}</p>
                  <Badge className={`${getStatusColor(tank.status)} text-xs`}>
                    {tank.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mb-1">{tank.designation} - {tank.model}</p>
                <p className="text-xs text-slate-500">{tank.location}</p>
              </div>
              <div className="text-right ml-4">
                <p className="text-xs text-slate-500 mb-1">Readiness</p>
                <p className={`text-lg font-bold ${
                  tank.readinessScore >= 85
                    ? 'text-green-400'
                    : tank.readinessScore >= 70
                    ? 'text-blue-400'
                    : tank.readinessScore >= 50
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}>
                  {tank.readinessScore}%
                </p>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

