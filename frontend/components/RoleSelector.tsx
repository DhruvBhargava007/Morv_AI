'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, User, UserCog } from 'lucide-react';

export type UserRole = 'admin' | 'technician';

interface RoleSelectorProps {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export function RoleSelector({ role, onRoleChange }: RoleSelectorProps) {
  const getRoleIcon = (r: UserRole) => {
    return r === 'admin' ? <UserCog className="w-4 h-4" /> : <User className="w-4 h-4" />;
  };

  const getRoleBadge = (r: UserRole) => {
    return r === 'admin' 
      ? 'bg-purple-900/30 text-purple-400 border-purple-400/30'
      : 'bg-blue-900/30 text-blue-400 border-blue-400/30';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-slate-100 min-w-[180px] justify-between"
        >
          <div className="flex items-center gap-2">
            {getRoleIcon(role)}
            <span className="font-semibold capitalize">{role}</span>
          </div>
          <ChevronDown className="w-4 h-4 ml-2 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[240px] bg-slate-900 border-slate-700">
        <DropdownMenuItem
          onClick={() => onRoleChange('admin')}
          className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 p-4"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <UserCog className="w-5 h-5 text-purple-400" />
              <div>
                <p className="font-semibold text-slate-200">Administrator</p>
                <p className="text-xs text-slate-400">Full system access</p>
              </div>
            </div>
            {role === 'admin' && (
              <Badge className="bg-purple-900/30 text-purple-400 border-purple-400/30 text-xs">
                Active
              </Badge>
            )}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onRoleChange('technician')}
          className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 p-4"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-semibold text-slate-200">Technician</p>
                <p className="text-xs text-slate-400">View-only access</p>
              </div>
            </div>
            {role === 'technician' && (
              <Badge className="bg-blue-900/30 text-blue-400 border-blue-400/30 text-xs">
                Active
              </Badge>
            )}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

