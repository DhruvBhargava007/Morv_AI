'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApprovalRequest, WorkOrder, PartTransfer, PersonnelAssignment } from '@/lib/types';
import { dummyApprovalRequests, dummyPersonnel, allTanks } from '@/lib/dummy-data';
import { getStatusColor, getPriorityColor } from '@/lib/repair-utils';
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, GitBranch, Users, Search } from 'lucide-react';

export default function ApprovalsPage() {
  const router = useRouter();
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(dummyApprovalRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  const handleApprove = (requestId: string) => {
    setApprovalRequests(requests =>
      requests.map(req =>
        req.id === requestId
          ? {
              ...req,
              status: 'approved',
              reviewedBy: 'CPT Anderson',
              reviewedAt: new Date().toISOString()
            }
          : req
      )
    );
  };

  const handleReject = (requestId: string) => {
    setApprovalRequests(requests =>
      requests.map(req =>
        req.id === requestId
          ? {
              ...req,
              status: 'rejected',
              reviewedBy: 'CPT Anderson',
              reviewedAt: new Date().toISOString()
            }
          : req
      )
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'work_order':
        return <FileText className="w-4 h-4 text-orange-400" />;
      case 'part_transfer':
        return <GitBranch className="w-4 h-4 text-purple-400" />;
      case 'personnel_assignment':
        return <Users className="w-4 h-4 text-blue-400" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredRequests = approvalRequests.filter(req => {
    const matchesSearch = req.submittedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getTypeLabel(req.type).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = selectedTab === 'all' || 
      (selectedTab === 'work_orders' && req.type === 'work_order') ||
      (selectedTab === 'transfers' && req.type === 'part_transfer') ||
      (selectedTab === 'assignments' && req.type === 'personnel_assignment');
    
    return matchesSearch && matchesTab;
  });

  const pendingCount = approvalRequests.filter(r => r.status === 'pending').length;

  const renderRequestDetails = (request: ApprovalRequest) => {
    const payload = request.payload;

    if (request.type === 'work_order') {
      const wo = payload as WorkOrder;
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-500 mb-1">WO Number</div>
            <div className="font-mono text-slate-300">{wo.woNumber}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Part</div>
            <div className="text-slate-300">{wo.partName}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Quantity</div>
            <div className="text-slate-300">{wo.quantity}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Est. Cost</div>
            <div className="text-slate-300">${wo.estimatedCost.toLocaleString()}</div>
          </div>
          <div className="col-span-2 md:col-span-4">
            <div className="text-xs text-slate-500 mb-1">Justification</div>
            <div className="text-slate-300 text-xs">{wo.justification}</div>
          </div>
        </div>
      );
    } else if (request.type === 'part_transfer') {
      const pt = payload as PartTransfer;
      const sourceTank = allTanks.find(t => t.id === pt.sourceTankId);
      const destTank = allTanks.find(t => t.id === pt.destinationTankId);
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-500 mb-1">Part</div>
            <div className="text-slate-300">{pt.partName}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">From</div>
            <div className="text-slate-300">{sourceTank?.designation || pt.sourceTankId}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">To</div>
            <div className="text-slate-300">{destTank?.designation || pt.destinationTankId}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Cost</div>
            <div className="text-slate-300">${pt.logisticsCost.toLocaleString()}</div>
          </div>
          <div className="col-span-2 md:col-span-4">
            <div className="text-xs text-slate-500 mb-1">Reason</div>
            <div className="text-slate-300 text-xs">{pt.reason}</div>
          </div>
        </div>
      );
    } else if (request.type === 'personnel_assignment') {
      const pa = payload as PersonnelAssignment;
      const assignedPersonnel = dummyPersonnel.filter(p => pa.personnelIds.includes(p.id));
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-500 mb-1">Personnel</div>
            <div className="text-slate-300">{assignedPersonnel.map(p => p.name).join(', ')}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Est. Hours</div>
            <div className="text-slate-300">{pa.estimatedHours} hrs</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Priority</div>
            <Badge className={getPriorityColor(pa.priority)}>
              {pa.priority.toUpperCase()}
            </Badge>
          </div>
          <div className="col-span-2 md:col-span-4">
            <div className="text-xs text-slate-500 mb-1">Instructions</div>
            <div className="text-slate-300 text-xs">{pa.specialInstructions}</div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-6 max-w-[1600px]">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            className="mb-4 text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-1">
                Pending Approvals
              </h1>
              <p className="text-slate-400">
                Review and approve work orders, transfers, and assignments
              </p>
            </div>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-lg px-4 py-2">
              <Clock className="w-4 h-4 mr-2" />
              {pendingCount} Pending
            </Badge>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ID, submitter, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6" onValueChange={setSelectedTab}>
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="all">
              All ({approvalRequests.length})
            </TabsTrigger>
            <TabsTrigger value="work_orders">
              Work Orders ({approvalRequests.filter(r => r.type === 'work_order').length})
            </TabsTrigger>
            <TabsTrigger value="transfers">
              Transfers ({approvalRequests.filter(r => r.type === 'part_transfer').length})
            </TabsTrigger>
            <TabsTrigger value="assignments">
              Assignments ({approvalRequests.filter(r => r.type === 'personnel_assignment').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="space-y-4">
            {filteredRequests.length === 0 ? (
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-400">No approval requests found.</p>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(request.type)}
                        <div>
                          <CardTitle className="text-slate-100 text-lg">
                            {getTypeLabel(request.type)}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 font-mono">{request.id}</span>
                            <span className="text-xs text-slate-500">•</span>
                            <span className="text-xs text-slate-400">
                              Submitted by {request.submittedBy}
                            </span>
                            <span className="text-xs text-slate-500">•</span>
                            <span className="text-xs text-slate-400">
                              {new Date(request.submittedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderRequestDetails(request)}
                    
                    {request.status === 'pending' && (
                      <div className="flex gap-3 pt-3 border-t border-slate-800">
                        <Button
                          onClick={() => handleApprove(request.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(request.id)}
                          variant="outline"
                          className="flex-1 border-red-500/50 text-red-400 hover:bg-red-950/50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {request.status !== 'pending' && request.reviewedBy && (
                      <div className="pt-3 border-t border-slate-800 text-xs text-slate-500">
                        {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.reviewedBy} on{' '}
                        {new Date(request.reviewedAt!).toLocaleString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            Approval Management System v1.0 | Admin Access Only
          </p>
        </footer>
      </div>
    </div>
  );
}

