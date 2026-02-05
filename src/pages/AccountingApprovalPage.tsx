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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Filter, FileText, History, Clock, BarChart3 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SignaturePopup } from '@/components/signature/SignaturePopup';
import { usePDFOperations } from '@/hooks/usePDFOperations';
import LoadingPopup from '@/components/forms/LoadingPopup';
import { getWelfareTypeLabel } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { sendLineNotification } from '@/services/lineApi';

export const AccountingApprovalPage = () => {
  const { user, profile, loading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { updateRequestStatus, welfareRequests: allRequests, refreshRequests } = useWelfare();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WelfareRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [isSignaturePopupOpen, setIsSignaturePopupOpen] = useState(false);
  const [pendingApprovalRequest, setPendingApprovalRequest] = useState<WelfareRequest | null>(null);
  const [pendingBulkApproval, setPendingBulkApproval] = useState<WelfareRequest[]>([]);
  const [isBulkApproval, setIsBulkApproval] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const { downloadPDF, previewPDF, isLoading: isPDFLoading } = usePDFOperations();

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user || (!['accounting', 'accountingandmanager', 'admin'].includes(profile?.role))) {
      addNotification({
        userId: user?.id || 'system',
        title: 'Access Denied',
        message: 'You do not have permission to view this page.',
        type: 'error',
      });
      navigate('/dashboard', { replace: true });
    }
  }, [user, profile, isAuthLoading, navigate, addNotification]);

  // Filter requests for accounting approval (only advance, general-advance and expense-clearing types)
  const filteredRequests = useMemo(() => {
    if (activeTab === 'reports') {
      return [];
    }
    
    return allRequests
      .filter((req: WelfareRequest) => {
        // Only show accounting-related requests
        if (req.type !== 'advance' && req.type !== 'general-advance' && req.type !== 'expense-clearing') return false;
        
        // Filter by tab
        if (activeTab === 'pending') {
          // Show only requests pending accounting approval
          if (req.status !== 'pending_accounting') return false;
        } else if (activeTab === 'history') {
          // Show requests that have been processed by accounting
          const processedStatuses = ['approved', 'rejected_accounting'];
          if (!processedStatuses.includes(req.status)) return false;
        }
        
        // Apply search filter
        if (searchTerm && !req.userName.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // Apply date filter
        if (dateFilter && format(new Date(req.date), 'yyyy-MM-dd') !== format(dateFilter, 'yyyy-MM-dd')) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allRequests, activeTab, searchTerm, dateFilter]);

  const handleSelectRequest = (requestId: number) => {
    const newSelectedRequests = selectedRequests.includes(requestId)
      ? selectedRequests.filter(id => id !== requestId)
      : [...selectedRequests, requestId];
    setSelectedRequests(newSelectedRequests);
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      const selectableRequests = filteredRequests.filter(req => 
        req.status === 'pending_accounting' && activeTab === 'pending'
      );
      setSelectedRequests(selectableRequests.map(req => req.id));
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
    
    const requestsToApprove = filteredRequests.filter(req => 
      selectedRequests.includes(req.id) && req.status === 'pending_accounting'
    );

    if (requestsToApprove.length === 0) {
      addNotification({
        userId: user.id,
        title: 'Info',
        message: 'No pending requests selected for approval.',
        type: 'info',
      });
      return;
    }

    setPendingBulkApproval(requestsToApprove);
    setIsBulkApproval(true);
    setIsSignaturePopupOpen(true);
  };

  const handleBulkReject = () => {
    if (selectedRequests.length === 0) return;
    setIsRejectionModalOpen(true);
  };

  const confirmRejection = async () => {
    if (selectedRequests.length === 0 || !rejectionReason || !user) return;
    setIsLoading(true);
    try {
      const requestsToReject = filteredRequests.filter(req => 
        selectedRequests.includes(req.id) && req.status === 'pending_accounting'
      );

      for (const req of requestsToReject) {
        await updateRequestStatus(req.id, 'rejected_accounting', rejectionReason);
      }
      
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
    
    const request = allRequests.find(req => req.id === requestId);
    if (!request) {
      console.error('Request not found:', requestId);
      return;
    }
    
    setPendingApprovalRequest(request);
    setIsSignaturePopupOpen(true);
    setIsModalOpen(false);
  };

  const handleSignatureComplete = async (signature: string) => {
    if (!user || (!pendingApprovalRequest && pendingBulkApproval.length === 0)) return;
    
    setIsLoading(true);
    try {
      const currentDateTime = new Date().toISOString();
      
      if (isBulkApproval && pendingBulkApproval.length > 0) {
        // Handle bulk approval
        for (const req of pendingBulkApproval) {
          const { error } = await supabase
            .from('welfare_requests')
            .update({
              status: 'approved',
              accounting_approver_id: user.id,
              accounting_approver_name: profile?.display_name || user.email,
              accounting_approved_at: currentDateTime,
              accounting_signature: signature,
              updated_at: currentDateTime
            })
            .eq('id', req.id);

          if (error) {
            console.error('Error updating request:', error);
            throw error;
          }

          // Send LINE notification for each approved request
          try {
            const employeeId = (req as any).employee_id || req.userId;
            const numericId = parseInt(employeeId, 10);
            let employeeEmail = null;

            if (!isNaN(numericId)) {
              const { data: empData } = await supabase
                .from('Employee')
                .select('email_user')
                .eq('id', numericId)
                .single();
              employeeEmail = empData?.email_user;
            }

            if (employeeEmail) {
              await sendLineNotification({
                employeeEmail,
                type: getWelfareTypeLabel(req.type),
                status: 'อนุมัติเรียบร้อย',
                amount: Number(req.amount) || 0,
                userName: req.userName,
                requestDate: new Date().toLocaleString('th-TH', {
                  timeZone: 'Asia/Bangkok',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              });
            }
          } catch (lineError) {
            console.error('Failed to send LINE notification:', lineError);
          }
        }

        addNotification({
          userId: user.id,
          title: 'Success',
          message: `${pendingBulkApproval.length} requests approved successfully with signature.`,
          type: 'success'
        });

        await refreshRequests();

        setPendingBulkApproval([]);
        setIsBulkApproval(false);
        setIsSignaturePopupOpen(false);
        setSelectedRequests([]);

      } else if (pendingApprovalRequest) {
        // Handle individual approval
        const { error } = await supabase
          .from('welfare_requests')
          .update({
            status: 'approved',
            accounting_approver_id: user.id,
            accounting_approver_name: profile?.display_name || user.email,
            accounting_approved_at: currentDateTime,
            accounting_signature: signature,
            updated_at: currentDateTime
          })
          .eq('id', pendingApprovalRequest.id);

        if (error) {
          console.error('Error updating request:', error);
          throw error;
        }

        // Send LINE notification
        try {
          const employeeId = (pendingApprovalRequest as any).employee_id || pendingApprovalRequest.userId;
          const numericId = parseInt(employeeId, 10);
          let employeeEmail = null;

          if (!isNaN(numericId)) {
            const { data: empData } = await supabase
              .from('Employee')
              .select('email_user')
              .eq('id', numericId)
              .single();
            employeeEmail = empData?.email_user;
          }

          if (employeeEmail) {
            await sendLineNotification({
              employeeEmail,
              type: getWelfareTypeLabel(pendingApprovalRequest.type),
              status: 'อนุมัติเรียบร้อย',
              amount: Number(pendingApprovalRequest.amount) || 0,
              userName: pendingApprovalRequest.userName,
              requestDate: new Date().toLocaleString('th-TH', {
                timeZone: 'Asia/Bangkok',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
            });
          }
        } catch (lineError) {
          console.error('Failed to send LINE notification:', lineError);
        }

        addNotification({
          userId: user.id,
          title: 'Success',
          message: 'Request approved successfully with signature.',
          type: 'success'
        });

        await refreshRequests();

        setPendingApprovalRequest(null);
        setIsSignaturePopupOpen(false);
      }
      
    } catch (error) {
      console.error('Error in handleSignatureComplete:', error);
      addNotification({ 
        userId: user.id, 
        title: 'Error', 
        message: 'Failed to approve request(s).', 
        type: 'error' 
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (requestId: number, comment: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await updateRequestStatus(requestId, 'rejected_accounting', comment);
      
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

  if (isAuthLoading || !user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading authentication...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <LoadingPopup open={isLoading} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-600">Processing approval...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Accounting Approval Dashboard</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>
            <span>อนุมัติคำร้องบัญชี</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                รอการอนุมัติ
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                ประวัติ
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                รายงาน
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="space-y-4">
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">คำร้องบัญชีที่รอการอนุมัติ</h3>
                <p className="text-sm text-green-600">รายการคำร้องเบิกเงินล่วงหน้าและเคลียร์ค่าใช้จ่ายที่รอการอนุมัติจากฝ่ายบัญชี</p>
              </div>
              
              <div className="flex items-center justify-between">
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
                        <span>Filter by date</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-4">
                        <h4 className="font-medium mb-2">Filters</h4>
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
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={handleBulkApprove} 
                    disabled={selectedRequests.length === 0 || isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve Selected ({selectedRequests.length})
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleBulkReject} 
                    disabled={selectedRequests.length === 0 || isLoading}
                  >
                    Reject Selected ({selectedRequests.length})
                  </Button>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-welfare-blue/100 [&_th]:text-white">
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            filteredRequests.filter(req => req.status === 'pending_accounting').length > 0 &&
                            selectedRequests.length === filteredRequests.filter(req => req.status === 'pending_accounting').length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Manager Approved</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attachment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          ไม่มีคำร้องบัญชีที่รอการอนุมัติ
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            {request.status === 'pending_accounting' && (
                              <Checkbox
                                checked={selectedRequests.includes(request.id)}
                                onCheckedChange={() => handleSelectRequest(request.id)}
                              />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{request.userName}</TableCell>
                          <TableCell>{request.userDepartment || request.department_user || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getWelfareTypeLabel(request.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>{request.amount ? `฿${request.amount.toLocaleString()}` : '-'}</TableCell>
                          <TableCell>{format(new Date(request.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            {request.managerApproverName ? (
                              <div className="text-sm">
                                <div className="font-medium">{request.managerApproverName}</div>
                                {request.managerApprovedAt && (
                                  <div className="text-muted-foreground">
                                    {format(new Date(request.managerApprovedAt), 'dd/MM/yyyy HH:mm')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                request.status === 'approved' ? 'default' :
                                request.status === 'pending_accounting' ? 'secondary' :
                                request.status.includes('rejected') ? 'destructive' : 'secondary'
                              }
                            >
                              {request.status === 'pending_accounting' ? 'รอบัญชี' :
                               request.status === 'approved' ? 'อนุมัติ' :
                               request.status === 'rejected_accounting' ? 'ปฏิเสธโดยบัญชี' :
                               request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {request.pdfUrl ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(request.pdfUrl, '_blank')}
                                className="h-8 w-8 p-0"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(request)}
                              >
                                View
                              </Button>
                              {request.status === 'pending_accounting' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(request.id)}
                                  disabled={isLoading}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Approve
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">ประวัติการอนุมัติ</h3>
                <p className="text-sm text-gray-600">รายการคำร้องบัญชีที่ได้รับการอนุมัติหรือปฏิเสธแล้ว</p>
              </div>
              
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
                      <span>Filter by date</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-4">
                      <h4 className="font-medium mb-2">Filters</h4>
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

              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-welfare-blue/100 [&_th]:text-white">
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Accounting Decision</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attachment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          ไม่มีประวัติการอนุมัติ
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.userName}</TableCell>
                          <TableCell>{request.userDepartment || request.department_user || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getWelfareTypeLabel(request.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>{request.amount ? `฿${request.amount.toLocaleString()}` : '-'}</TableCell>
                          <TableCell>{format(new Date(request.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            {request.accountingApproverName ? (
                              <div className="text-sm">
                                <div className="font-medium">{request.accountingApproverName}</div>
                                {request.accountingApprovedAt && (
                                  <div className="text-muted-foreground">
                                    {format(new Date(request.accountingApprovedAt), 'dd/MM/yyyy HH:mm')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                request.status === 'approved' ? 'default' :
                                request.status.includes('rejected') ? 'destructive' : 'secondary'
                              }
                            >
                              {request.status === 'approved' ? 'อนุมัติ' :
                               request.status === 'rejected_accounting' ? 'ปฏิเสธโดยบัญชี' :
                               request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {request.pdfUrl ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(request.pdfUrl, '_blank')}
                                className="h-8 w-8 p-0"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(request)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>รายงานจะพัฒนาในอนาคต</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Request Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Employee</label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.userName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Department</label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.userDepartment || selectedRequest.department_user || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <p className="text-sm text-muted-foreground">{getWelfareTypeLabel(selectedRequest.type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.amount ? `฿${selectedRequest.amount.toLocaleString()}` : '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Submission Date</label>
                  <p className="text-sm text-muted-foreground">{format(new Date(selectedRequest.date), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge variant="outline">{selectedRequest.status}</Badge>
                </div>
              </div>
              {selectedRequest.details && (
                <div>
                  <label className="text-sm font-medium">Details</label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedRequest.details}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
            {selectedRequest?.status === 'pending_accounting' && (
              <>
                <Button
                  onClick={() => handleApprove(selectedRequest.id)}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setSelectedRequests([selectedRequest.id]);
                    setIsRejectionModalOpen(true);
                    setIsModalOpen(false);
                  }}
                  disabled={isLoading}
                >
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Modal */}
      <Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request(s)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for rejection</label>
              <Input
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRejection}
              disabled={!rejectionReason || isLoading}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Popup */}
      <SignaturePopup
        isOpen={isSignaturePopupOpen}
        onClose={() => {
          setIsSignaturePopupOpen(false);
          setPendingApprovalRequest(null);
          setPendingBulkApproval([]);
          setIsBulkApproval(false);
        }}
        onSave={handleSignatureComplete}
        title={isBulkApproval ? `Approve ${pendingBulkApproval.length} Requests` : 'Approve Request'}
        approverName={profile?.display_name || user?.email || ''}
        requestDetails={isBulkApproval
          ? `อนุมัติคำร้องบัญชี ${pendingBulkApproval.length} รายการ`
          : pendingApprovalRequest ? `${pendingApprovalRequest.userName} - ${getWelfareTypeLabel(pendingApprovalRequest.type)} ฿${pendingApprovalRequest.amount?.toLocaleString() || '0'}` : undefined
        }
      />
    </Layout>
  );
};