import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWelfare } from '@/context/WelfareContext';
import { WelfareRequest } from '@/types';
import { useNotification } from '../context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Filter, Bug, FileText } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { debugDatabaseConnection } from '@/context/WelfareContext';
import { supabase } from '@/lib/supabase';

export const ApprovalPage = () => {
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { updateRequestStatus, welfareRequests: allRequests } = useWelfare();
  const [isLoading, setIsLoading] = useState(false);
  const [managers, setManagers] = useState<{[key: string]: string}>({});
  const [teamMemberIds, setTeamMemberIds] = useState<number[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<WelfareRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>();

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user || (!['manager', 'admin', 'accountingandmanager'].includes(profile?.role))) {
      addNotification({
        userId: user?.id || 'system',
        title: 'Access Denied',
        message: 'You do not have permission to view this page.',
        type: 'error',
      });
      navigate('/dashboard', { replace: true });
    } else if (profile?.role === 'manager' && profile.employee_id) {
      fetchTeamMemberIds(profile.employee_id);
    } else if (profile?.role === 'admin') {
      console.log('Admin user, will see all requests.');
    }
  }, [user, profile, isAuthLoading, navigate, addNotification]);

  const fetchTeamMemberIds = async (managerId: number) => {
    try {
      console.log('Fetching team members for manager ID:', managerId);
      const { data, error } = await supabase
        .from('Employee')
        .select('id')
        .eq('manager_id', managerId);

      if (error) {
        console.error('Error fetching team members by manager ID:', error);
        return;
      }

      if (data) {
        const memberIds = data.map(member => member.id);
        console.log('Team member IDs:', memberIds);
        setTeamMemberIds(memberIds);
      }
    } catch (err) {
      console.error('Failed to fetch team member IDs:', err);
    }
  };

  // ใช้ useMemo แทน useEffect + setState
  // รวม filter ทั้งหมดไว้ใน useMemo เดียว
  const filteredRequests = useMemo(() => {
    let base = allRequests;
    if ((profile?.role === 'manager' || profile?.role === 'accountingandmanager') && teamMemberIds.length > 0) {
      base = allRequests.filter(req => req.userId && teamMemberIds.includes(parseInt(req.userId, 10)));
    }
    return base
      .filter((req: WelfareRequest) => {
        if (statusFilter !== 'all' && req.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
        if (dateFilter && format(new Date(req.date), 'yyyy-MM-dd') !== format(dateFilter, 'yyyy-MM-dd')) {
          return false;
        }
        if (searchTerm && !req.userName.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allRequests, profile?.role, teamMemberIds, statusFilter, dateFilter, searchTerm]);

  // (ถ้ามี logic อื่นๆ ที่ต้องใช้ approverIds ให้คงไว้)
  useEffect(() => {
    const approverIds = allRequests
      .filter(req => req.approverId)
      .map(req => req.approverId as string);
    if (approverIds.length > 0) {
      fetchManagerNames(approverIds);
    }
  }, [allRequests]);

  const fetchManagerNames = async (approverIds: string[]) => {
    try {
      const uniqueIds = [...new Set(approverIds)];
      const { data, error } = await supabase
        .from('Employee')
        .select('id, Name')
        .in('id', uniqueIds);
        
      if (error) {
        console.error('Error fetching manager names:', error);
        return;
      }
      
      if (data) {
        const managerMap: {[key: string]: string} = {};
        data.forEach(manager => {
          managerMap[manager.id] = manager.Name;
        });
        setManagers(managerMap);
      }
    } catch (err) {
      console.error('Failed to fetch manager names:', err);
    }
  };



  const allSelectedAreFinal = useMemo(() => {
    if (selectedRequests.length === 0) return true;
    return selectedRequests.every(id => {
      const request = filteredRequests.find(req => req.id === id);
      return request && (request.status === 'pending_accounting' || request.status === 'completed' || request.status === 'rejected_manager' || request.status === 'rejected_accounting');
    });
  }, [selectedRequests, filteredRequests]);

  const handleSelectRequest = (requestId: number) => {
    const newSelectedRequests = selectedRequests.includes(requestId)
      ? selectedRequests.filter(id => id !== requestId)
      : [...selectedRequests, requestId];
    setSelectedRequests(newSelectedRequests);
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedRequests(filteredRequests.map(req => req.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleViewDetails = (request: WelfareRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleBulkApprove = async () => {
    if (selectedRequests.length === 0 || !user) return;
    setIsLoading(true);
    try {
      const requestsToApprove = welfareRequests.filter(req => 
        selectedRequests.includes(req.id) && req.status === 'pending_manager'
      );

      if (requestsToApprove.length === 0) {
        addNotification({
          userId: user.id,
          title: 'Info',
          message: 'No pending requests selected for approval.',
          type: 'info',
        });
        setIsLoading(false);
        return;
      }

      for (const req of requestsToApprove) {
        await updateRequestStatus(req.id, 'pending_accounting');
      }
      setWelfareRequests(prev => 
        prev.map(req => requestsToApprove.some(r => r.id === req.id) 
          ? { ...req, status: 'pending_accounting', approverId: user.id } 
          : req
        )
      );
      addNotification({ 
        userId: user.id, 
        title: 'Success', 
        message: 'Requests approved successfully.', 
        type: 'success' 
      });
      setSelectedRequests([]);
    } catch (error) {
      addNotification({ 
        userId: user.id, 
        title: 'Error', 
        message: 'Failed to approve some requests.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkReject = () => {
    if (selectedRequests.length === 0) return;
    setIsRejectionModalOpen(true);
  };

  const confirmRejection = async () => {
    if (selectedRequests.length === 0 || !rejectionReason || !user) return;
    setIsLoading(true);
    try {
      const requestsToReject = welfareRequests.filter(req => 
        selectedRequests.includes(req.id) && req.status === 'pending_manager'
      );

      if (requestsToReject.length === 0) {
        addNotification({
          userId: user.id,
          title: 'Info',
          message: 'No pending requests selected for rejection.',
          type: 'info',
        });
        setIsLoading(false);
        setIsRejectionModalOpen(false);
        return;
      }

      for (const req of requestsToReject) {
        await updateRequestStatus(req.id, 'rejected_manager', rejectionReason);
      }
      setWelfareRequests(prev => 
        prev.map(req => requestsToReject.some(r => r.id === req.id) 
          ? { ...req, status: 'rejected_manager', notes: rejectionReason, manager_notes: rejectionReason, approverId: user.id } 
          : req
        )
      );
      addNotification({ 
        userId: user.id, 
        title: 'Success', 
        message: 'Requests rejected successfully.', 
        type: 'success' 
      });
      setSelectedRequests([]);
      setRejectionReason('');
      setIsRejectionModalOpen(false);
    } catch (error) {
      addNotification({ 
        userId: user.id, 
        title: 'Error', 
        message: 'Failed to reject some requests.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await updateRequestStatus(requestId, 'pending_accounting');
      setWelfareRequests(prev => 
        prev.map(req => req.id === requestId 
          ? { ...req, status: 'pending_accounting', approverId: user.id } 
          : req
        )
      );
      addNotification({ 
        userId: user.id, 
        title: 'Success', 
        message: 'Request approved successfully.', 
        type: 'success' 
      });
      setIsModalOpen(false);
    } catch (error) {
      addNotification({ 
        userId: user.id, 
        title: 'Error', 
        message: 'Failed to approve request.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReject = async (requestId: number, comment: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await updateRequestStatus(requestId, 'rejected_manager', comment);
      setWelfareRequests(prev => 
        prev.map(req => req.id === requestId 
          ? { ...req, status: 'rejected_manager', notes: comment, manager_notes: comment, approverId: user.id } 
          : req
        )
      );
      addNotification({ 
        userId: user.id, 
        title: 'Success', 
        message: 'Request rejected successfully.', 
        type: 'success' 
      });
      setIsModalOpen(false);
      setIsRejectionModalOpen(false);
    } catch (error) {
      addNotification({ 
        userId: user.id, 
        title: 'Error', 
        message: 'Failed to reject request.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading || isLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Manager Approval Dashboard</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>
            <span>Welfare Requests for Approval</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by employee..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <Filter className="mr-2 h-4 w-4" />
                    <span>Filter by status, date</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-4">
                    <h4 className="font-medium mb-2">Filters</h4>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                                                                                              </SelectContent>
                    </Select>
                    <div className="mt-4">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={'outline'} className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFilter ? format(dateFilter, 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateFilter}
                            onSelect={setDateFilter}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-x-2">

            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Checkbox 
                    onCheckedChange={handleSelectAll}
                    checked={
                      filteredRequests.length > 0 && selectedRequests.length === filteredRequests.length
                        ? true
                        : selectedRequests.length > 0
                        ? 'indeterminate'
                        : false
                    }
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Welfare Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Attachment</TableHead>
                
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((req: WelfareRequest) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <Checkbox 
                    onCheckedChange={() => handleSelectRequest(req.id)}
                    checked={selectedRequests.includes(req.id)}
                    aria-label={`Select request ${req.id}`}
                    disabled={req.status === 'pending_accounting' || req.status === 'completed' || req.status === 'rejected_manager' || req.status === 'rejected_accounting'}
                  />
                  </TableCell>
                  <TableCell>{req.userName}</TableCell>
                  <TableCell>{req.userDepartment || '-'}</TableCell>
                  <TableCell>{req.type}</TableCell>
                  <TableCell>{req.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{format(new Date(req.date), 'PP')}</TableCell>
                  <TableCell>
                    <Select
                      value={req.status === 'pending_accounting' ? 'approved' : req.status === 'rejected_manager' ? 'reject' : ''}
                      onValueChange={(newStatus: string) => {
                        if (newStatus === 'approved') {
                          updateRequestStatus(req.id, 'pending_accounting');
                        } else if (newStatus === 'reject') {
                          updateRequestStatus(req.id, 'rejected_manager');
                        }
                      }}
                      disabled={req.status === 'pending_accounting' || req.status === 'completed' || req.status === 'rejected_manager' || req.status === 'rejected_accounting'}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
  <SelectItem value="approved">อนุมัติ (Approve)</SelectItem>
  <SelectItem value="reject">ปฏิเสธ (Reject)</SelectItem>
</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    {req.attachments && req.attachments.length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {req.attachments.map((file, idx) => (
                          <Button asChild variant="ghost" size="icon" key={idx}>
                            <a
                              href={file}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`View attachment ${idx + 1}`}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <FileText className="h-4 w-4" />
                            </a>
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(req)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedRequest && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
            </DialogHeader>
            <div>
              <div className="space-y-2">
                <p><strong>Employee:</strong> {selectedRequest.userName}</p>
                <p><strong>Department:</strong> {selectedRequest.userDepartment}</p>
                <p><strong>Welfare Type:</strong> {selectedRequest.type}</p>
                <p><strong>Amount:</strong> {selectedRequest.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</p>
                <p><strong>Date:</strong> {format(new Date(selectedRequest.date), 'PPP')}</p>
                <p><strong>Status:</strong> {selectedRequest.status}</p>
                <p><strong>Approved By:</strong> {selectedRequest.approverId ? (managers[selectedRequest.approverId] || 'รออนุมัติ') : 'Not approved yet'}</p>
                <p><strong>Details:</strong> {selectedRequest.details}</p>
                <p><strong>Title:</strong> {selectedRequest.title}</p>
                <p><strong>Attachment:</strong> {selectedRequest.attachments && selectedRequest.attachments[0] ? (<a href={selectedRequest.attachments[0]} target="_blank" rel="noopener noreferrer">View Attachment</a>) : 'No attachment'}</p>
                <p><strong>Attachment:</strong> {selectedRequest.attachments && selectedRequest.attachments.length > 0 ? (
                  <span className="flex flex-wrap gap-2">
                    {selectedRequest.attachments.map((file, idx) => (
                      <a key={idx} href={file} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                        <FileText className="h-4 w-4" />
                        <span>ไฟล์ {idx + 1}</span>
                      </a>
                    ))}
                  </span>
                ) : 'No attachment'}</p>
                <p><strong>Manager Notes:</strong> {selectedRequest.notes}</p>
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Rejection Reason (if applicable):</p>
                  <Input 
                    placeholder="Enter reason for rejection..." 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => handleApprove(selectedRequest.id)}
                disabled={selectedRequest.status === 'approved' || selectedRequest.status === 'rejected'}
              >
                Approve
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleReject(selectedRequest.id, rejectionReason)}
                disabled={selectedRequest.status === 'approved' || selectedRequest.status === 'rejected'}
              >
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Rejection</DialogTitle>
          </DialogHeader>
          <p>Please provide a reason for rejecting the selected requests.</p>
          <Input 
            value={rejectionReason} 
            onChange={(e) => setRejectionReason(e.target.value)} 
            placeholder="Rejection reason..."
          />
          <DialogFooter>
            <Button onClick={confirmRejection}>Confirm</Button>
            <Button variant="outline" onClick={() => setIsRejectionModalOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};