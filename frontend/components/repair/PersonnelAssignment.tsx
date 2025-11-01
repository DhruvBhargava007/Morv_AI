'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Personnel, TankComponent, Tank } from '@/lib/types';
import { Users, CheckCircle2, XCircle, Search } from 'lucide-react';
import { checkPersonnelAvailability, generateAssignmentId, getPriorityFromComponent } from '@/lib/repair-utils';

interface PersonnelAssignmentProps {
  component: TankComponent;
  tank: Tank;
  availablePersonnel: Personnel[];
  isRecommended?: boolean;
  userRole: 'admin' | 'technician';
  onSubmit: (assignment: any) => void;
}

export function PersonnelAssignment({ 
  component, 
  tank, 
  availablePersonnel, 
  isRecommended = false,
  userRole,
  onSubmit 
}: PersonnelAssignmentProps) {
  const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([]);
  const [estimatedHours, setEstimatedHours] = useState<number>(4);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const togglePersonnel = (personnelId: string) => {
    if (selectedPersonnel.includes(personnelId)) {
      setSelectedPersonnel(selectedPersonnel.filter(id => id !== personnelId));
    } else {
      setSelectedPersonnel([...selectedPersonnel, personnelId]);
    }
  };

  const handleSubmit = () => {
    const assignment = {
      id: generateAssignmentId(),
      componentId: component.id,
      tankId: tank.id,
      personnelIds: selectedPersonnel,
      estimatedHours,
      priority: getPriorityFromComponent(component),
      specialInstructions,
      status: userRole === 'admin' ? 'approved' : 'pending',
      submittedBy: userRole === 'admin' ? 'Admin User' : 'Technician User',
      submittedAt: new Date().toISOString(),
      ...(userRole === 'admin' && {
        approvedBy: 'Admin User',
        approvedAt: new Date().toISOString()
      })
    };
    onSubmit(assignment);
  };

  const getAvailabilityIcon = (person: Personnel) => {
    if (person.availabilityStatus === 'available') {
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    }
    return <XCircle className="w-4 h-4 text-red-400" />;
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'assigned':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'on_leave':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'unavailable':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const filteredPersonnel = availablePersonnel.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className={`bg-slate-900 border-slate-700 ${isRecommended ? 'ring-2 ring-emerald-500/50' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-slate-100">Assign Personnel</CardTitle>
          </div>
          {isRecommended && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              Recommended
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search personnel by name or specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Personnel List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredPersonnel.map((person) => (
            <div
              key={person.id}
              onClick={() => person.availabilityStatus !== 'unavailable' && togglePersonnel(person.id)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                selectedPersonnel.includes(person.id)
                  ? 'bg-blue-950/50 border-blue-500/50'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
              } ${person.availabilityStatus === 'unavailable' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getAvailabilityIcon(person)}
                    <span className="text-sm font-semibold text-slate-200">{person.name}</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-1">{person.specialization}</div>
                  <div className="text-xs text-slate-500">
                    {person.location} • {person.currentAssignments.length} active assignments
                  </div>
                </div>
                <Badge className={`text-xs ${getAvailabilityColor(person.availabilityStatus)}`}>
                  {person.availabilityStatus.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Estimated Hours */}
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-2 block">
            Estimated Hours
          </label>
          <input
            type="number"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(Number(e.target.value))}
            min="1"
            max="48"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Special Instructions */}
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-2 block">
            Special Instructions
          </label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={3}
            placeholder="Enter any special instructions or notes..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={selectedPersonnel.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {userRole === 'admin' ? 'Approve & Assign' : 'Submit for Approval'}
        </Button>

        <div className="text-xs text-slate-500 text-center">
          {selectedPersonnel.length} personnel selected
        </div>
      </CardContent>
    </Card>
  );
}

