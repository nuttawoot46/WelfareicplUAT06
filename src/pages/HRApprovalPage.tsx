import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWelfare } from '@/context/WelfareContext';
import { useInternalTraining } from '@/context/InternalTrainingContext';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Filter, FileText, History, Clock } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SignaturePopup } from '@/components/signature/SignaturePopup';
import { SignatureDisplay } from '@/components/signature/SignatureDisplay';
import LoadingPopup from '@/components/forms/LoadingPopup';
import { getWelfareTypeLabel } from '@/lib/utils';

import { supabase } from '@/lib/supabase';

export const HRApprovalPage = () => {
  const { user, profile, loading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { updateRequestStatus, welfareRequests: allRequests, refreshRequests } = useWelfare();
  const { trainingRequests: internalTrainingRequests, updateRequestStatus: updateInternalTrainingStatus, refreshRequests: refreshInternalTrainingRequests } = useInternalTraining();
  const [isLoading, setIsLoading] = useState(false);
  const [managers, setManagers] = useState<{ [key: string]: string }>({});
  const [selectedRequest, setSelectedRequest] = useState<WelfareRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [isSignaturePopupOpen, setIsSignaturePopupOpen] = useState(false);
  const [pendingApprovalRequest, setPendingApprovalRequest] = useState<WelfareRequest | null>(null);
  const [isBulkApprovalMode, setIsBulkApprovalMode] = useState(false);
  const [bulkApprovalQueue, setBulkApprovalQueue] = useState<WelfareRequest[]>([]);
  const [currentBulkIndex, setCurrentBulkIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('pending-welfare');

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user || (!['hr', 'admin'].includes(profile?.role))) {
      addNotification({
        userId: user?.id || 'system',
        title: 'Access Denied',
        message: 'You do not have permission to view this page.',
        type: 'error',
      });
      navigate('/dashboard', { replace: true });
    }
  }, [user, profile, isAuthLoading, navigate, addNotification]);

  // Combine welfare and internal training requests with deduplication
  const combinedRequests = useMemo(() => {
    const requestMap = new Map();
    
    // Add welfare requests
    allRequests.forEach(req => {
      requestMap.set(`${req.id}-${req.type}`, req);
    });
    
    // Add internal training requests (avoid duplicates)
    internalTrainingRequests.forEach(req => {
      const key = `${req.id}-${req.type}`;
      if (!requestMap.has(key)) {
        requestMap.set(key, req);
      }
    });
    
    return Array.from(requestMap.values());
  }, [allRequests, internalTrainingRequests]);

  // Filter requests based on active tab
  const filteredRequests = useMemo(() => {
    return combinedRequests
      .filter((req: WelfareRequest) => {
        // Filter by tab type first
        if (activeTab === 'pending-welfare') {
          // Show only welfare requests pending HR approval
          if (req.status !== 'pending_hr') return false;
          // Filter out accounting types (advance and expense-clearing)
          if (req.type === 'advance' || req.type === 'expense-clearing') return false;
        } else if (activeTab === 'pending-accounting') {
          // Show only accounting requests pending HR approval
          if (req.status !== 'pending_hr') return false;
          // Only show accounting types (advance and expense-clearing)
          if (req.type !== 'advance' && req.type !== 'expense-clearing') return false;
        } else if (activeTab === 'history') {
          // Show requests that have been processed by HR (approved or rejected)
          const processedStatuses = ['pending_accounting', 'approved', 'rejected_hr', 'rejected_accounting'];
          if (!processedStatuses.includes(req.status)) return false;
        }

        // Apply other filters
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
  }, [combinedRequests, statusFilter, dateFilter, searchTerm, activeTab]);

  useEffect(() => {
    const approverIds = combinedRequests
      .filter(req => req.approverId)
      .map(req => req.approverId as string);
    if (approverIds.length > 0) {
      fetchManagerNames(approverIds);
    }
  }, [combinedRequests]);

  const fetchManagerNames = async (approverIds: string[]) => {
    try {
      const uniqueIds = [...new Set(approverIds)].map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      const { data, error } = await supabase
        .from('Employee')
        .select('id, Name')
        .in('id', uniqueIds);

      if (error) {
        console.error('Error fetching manager names:', error);
        return;
      }

      if (data) {
        const managerMap: { [key: string]: string } = {};
        data.forEach(manager => {
          managerMap[manager.id] = manager.Name;
        });
        setManagers(managerMap);
      }
    } catch (err) {
      console.error('Failed to fetch manager names:', err);
    }
  };

  const handleSelectRequest = (requestId: number) => {
    const newSelectedRequests = selectedRequests.includes(requestId)
      ? selectedRequests.filter(id => id !== requestId)
      : [...selectedRequests, requestId];
    setSelectedRequests(newSelectedRequests);
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      // Only select requests that are pending_hr (can be approved) and only in pending tabs
      const selectableRequests = filteredRequests.filter(req => 
        req.status === 'pending_hr' && (activeTab === 'pending-welfare' || activeTab === 'pending-accounting')
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
      selectedRequests.includes(req.id) && req.status === 'pending_hr'
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

    // Start bulk approval process with signatures
    setIsBulkApprovalMode(true);
    setBulkApprovalQueue(requestsToApprove);
    setCurrentBulkIndex(0);
    setPendingApprovalRequest(requestsToApprove[0]);
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
        selectedRequests.includes(req.id) && req.status === 'pending_hr'
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
        // All requests are now stored in welfare_requests table
        await updateRequestStatus(req.id, 'rejected_hr', rejectionReason);
      }

      // Refresh data to show updated status immediately
      await refreshRequests();
      await refreshInternalTrainingRequests();

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

    // Find the request to approve
    const request = combinedRequests.find(req => req.id === requestId);
    if (!request) {
      console.error('Request not found:', requestId);
      return;
    }

    console.log('Opening signature popup for request:', request);

    // Set pending request and open signature popup
    setPendingApprovalRequest(request);
    setIsSignaturePopupOpen(true);
    setIsModalOpen(false);
  };

  const handleSignatureComplete = async (signature: string) => {
    if (!user || !pendingApprovalRequest) return;

    setIsLoading(true);
    try {
      const currentDateTime = new Date().toISOString();

      // Update with HR approval information and signature
      const { error } = await supabase
        .from('welfare_requests')
        .update({
          status: 'pending_accounting',
          hr_approver_id: user.id,
          hr_approver_name: profile?.display_name || user.email,
          hr_approved_at: currentDateTime,
          hr_signature: signature,
          updated_at: currentDateTime
        })
        .eq('id', pendingApprovalRequest.id);

      if (error) {
        console.error('Error updating request:', error);
        throw error;
      }

      // Fetch the latest request data to get the manager signature
      const { data: latestRequestData, error: fetchError } = await supabase
        .from('welfare_requests')
        .select('*')
        .eq('id', pendingApprovalRequest.id)
        .single();

      if (fetchError) {
        console.error('Error fetching latest request data:', fetchError);
      }

      // Generate PDF with both manager and HR signatures (pending accounting approval)
      const updatedRequest = {
        ...pendingApprovalRequest,
        status: 'pending_accounting' as const,
        hrApproverName: profile?.display_name || user.email,
        hrApprovedAt: currentDateTime,
        hrSignature: signature,
        managerSignature: latestRequestData?.manager_signature || pendingApprovalRequest.managerSignature
      };

      console.log('HR Approval - Updated request with signatures:', {
        managerSignature: updatedRequest.managerSignature ? 'Present' : 'Missing',
        hrSignature: updatedRequest.hrSignature ? 'Present' : 'Missing',
        managerSignatureLength: updatedRequest.managerSignature?.length || 0,
        hrSignatureLength: updatedRequest.hrSignature?.length || 0,
        latestRequestManagerSignature: latestRequestData?.manager_signature ? 'Present' : 'Missing',
        pendingRequestManagerSignature: pendingApprovalRequest.managerSignature ? 'Present' : 'Missing'
      });

      // Handle PDF generation based on request type
      if (pendingApprovalRequest.type === 'internal_training') {
        // Get employee data for PDF generation
        let employeeData;
        try {
          const employeeId = pendingApprovalRequest.employee_id || pendingApprovalRequest.userId;
          const numericId = parseInt(employeeId, 10);
          
          if (!isNaN(numericId)) {
            const { data: empData, error: empError } = await supabase
              .from('Employee')
              .select('Name, Position, Team, start_date')
              .eq('id', numericId)
              .single();
            
            if (!empError && empData) {
              employeeData = empData;
            }
          }
          
          // Fallback to email lookup if numeric ID didn't work
          if (!employeeData && employeeId) {
            const { data: empData, error: empError } = await supabase
              .from('Employee')
              .select('Name, Position, Team, start_date')
              .eq('"email_user"', employeeId)
              .single();
            
            if (!empError && empData) {
              employeeData = empData;
            }
          }
        } catch (error) {
          console.error('Error fetching employee data for PDF:', error);
        }

        // Create a proper InternalTrainingRequest object with all required fields
        const internalTrainingRequest = {
          ...pendingApprovalRequest,
          // Ensure all required fields are present with proper fallbacks
          course_name: pendingApprovalRequest.course_name || pendingApprovalRequest.title || 'หลักสูตรอบรม',
          courseName: pendingApprovalRequest.course_name || pendingApprovalRequest.title || 'หลักสูตรอบรม',
          department: pendingApprovalRequest.department || pendingApprovalRequest.userDepartment || 'ฝ่ายทรัพยากรบุคคล',
          branch: pendingApprovalRequest.branch || 'สำนักงานสุรวงศ์',
          start_date: pendingApprovalRequest.start_date || pendingApprovalRequest.date,
          end_date: pendingApprovalRequest.end_date || pendingApprovalRequest.date,
          startDate: pendingApprovalRequest.start_date || pendingApprovalRequest.date,
          endDate: pendingApprovalRequest.end_date || pendingApprovalRequest.date,
          start_time: pendingApprovalRequest.start_time || '09:00',
          end_time: pendingApprovalRequest.end_time || '17:00',
          startTime: pendingApprovalRequest.start_time || '09:00',
          endTime: pendingApprovalRequest.end_time || '17:00',
          total_hours: pendingApprovalRequest.total_hours || 7,
          totalHours: pendingApprovalRequest.total_hours || 7,
          venue: pendingApprovalRequest.venue || 'สถานที่อบรม',
          participants: pendingApprovalRequest.participants || '[]',
          instructor_fee: pendingApprovalRequest.instructor_fee || 0,
          instructorFee: pendingApprovalRequest.instructor_fee || 0,
          room_food_beverage: pendingApprovalRequest.room_food_beverage || 0,
          roomFoodBeverage: pendingApprovalRequest.room_food_beverage || 0,
          other_expenses: pendingApprovalRequest.other_expenses || 0,
          otherExpenses: pendingApprovalRequest.other_expenses || 0,
          total_amount: pendingApprovalRequest.total_amount || pendingApprovalRequest.amount || 0,
          totalAmount: pendingApprovalRequest.total_amount || pendingApprovalRequest.amount || 0,
          average_cost_per_person: pendingApprovalRequest.average_cost_per_person || 0,
          averageCostPerPerson: pendingApprovalRequest.average_cost_per_person || 0,
          withholding_tax_amount: pendingApprovalRequest.withholding_tax_amount || 0,
          withholdingTaxAmount: pendingApprovalRequest.withholding_tax_amount || 0,
          // Signature fields
          userSignature: pendingApprovalRequest.userSignature || pendingApprovalRequest.user_signature,
          user_signature: pendingApprovalRequest.userSignature || pendingApprovalRequest.user_signature,
          managerSignature: updatedRequest.managerSignature,
          manager_signature: updatedRequest.managerSignature,
          hrSignature: signature,
          hr_signature: signature,
          manager_approver_name: pendingApprovalRequest.managerApproverName,
          managerApproverName: pendingApprovalRequest.managerApproverName,
          manager_approved_at: pendingApprovalRequest.managerApprovedAt,
          managerApprovedAt: pendingApprovalRequest.managerApprovedAt,
          hr_approver_name: profile?.display_name || user.email,
          hrApproverName: profile?.display_name || user.email,
          hr_approved_at: new Date().toISOString(),
          hrApprovedAt: new Date().toISOString(),
          createdAt: pendingApprovalRequest.createdAt || pendingApprovalRequest.date,
          created_at: pendingApprovalRequest.createdAt || pendingApprovalRequest.date
        };

        console.log('=== HR Internal Training PDF Generation Debug ===');
        console.log('internalTrainingRequest:', internalTrainingRequest);
        console.log('employeeData:', employeeData);
        
        // Use the original PDF generator with proper signature support
        const { generateInternalTrainingPDF } = await import('@/components/pdf/InternalTrainingPDFGenerator');
        const pdfBlob = await generateInternalTrainingPDF(
          internalTrainingRequest as any,
          user,
          employeeData,
          updatedRequest.managerSignature,
          signature,
          pendingApprovalRequest.userSignature || pendingApprovalRequest.user_signature
        );
        
        console.log('Generated PDF blob size:', pdfBlob.size);
        
        // Store updated PDF in database
        const { storePDFInDatabase } = await import('@/utils/pdfManager');
        await storePDFInDatabase(pendingApprovalRequest.id, pdfBlob, signature, 'hr', profile?.display_name || user.email);
      } else {
        // Use new PDF manager to add HR signature for welfare requests
        const { addSignatureToPDF } = await import('@/utils/pdfManager');
        await addSignatureToPDF(
          pendingApprovalRequest.id,
          'hr',
          signature,
          profile?.display_name || user.email
        );
      }

      // Refresh data to show updated status immediately
      await refreshRequests();
      await refreshInternalTrainingRequests();

      // Handle bulk approval flow
      if (isBulkApprovalMode) {
        const nextIndex = currentBulkIndex + 1;
        if (nextIndex < bulkApprovalQueue.length) {
          // Move to next request in bulk approval
          setCurrentBulkIndex(nextIndex);
          setPendingApprovalRequest(bulkApprovalQueue[nextIndex]);
          // Keep signature popup open for next request
        } else {
          // Bulk approval complete
          addNotification({
            userId: user.id,
            title: 'Success',
            message: `All ${bulkApprovalQueue.length} requests approved successfully with signatures and sent to Accounting.`,
            type: 'success'
          });

          // Reset bulk approval states
          setIsBulkApprovalMode(false);
          setBulkApprovalQueue([]);
          setCurrentBulkIndex(0);
          setSelectedRequests([]);
          setPendingApprovalRequest(null);
          setIsSignaturePopupOpen(false);
        }
      } else {
        // Single approval
        addNotification({
          userId: user.id,
          title: 'Success',
          message: 'Request approved successfully with signature and sent to Accounting for final approval.',
          type: 'success'
        });

        // Reset states
        setPendingApprovalRequest(null);
        setIsSignaturePopupOpen(false);
      }

    } catch (error) {
      addNotification({
        userId: user.id,
        title: 'Error',
        message: 'Failed to approve request.',
        type: 'error'
      });

      // Reset states on error
      if (isBulkApprovalMode) {
        setIsBulkApprovalMode(false);
        setBulkApprovalQueue([]);
        setCurrentBulkIndex(0);
        setSelectedRequests([]);
      }
      setPendingApprovalRequest(null);
      setIsSignaturePopupOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (requestId: number, comment: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      // All requests are now stored in welfare_requests table
      await updateRequestStatus(requestId, 'rejected_hr', comment);

      // Refresh data to show updated status immediately
      await refreshRequests();
      await refreshInternalTrainingRequests();

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
        <LoadingPopup open={isAuthLoading} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-600">Loading authentication...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">HR Approval Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>
            <span>HR Approval Dashboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending-welfare" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                สวัสดิการ
              </TabsTrigger>
              <TabsTrigger value="pending-accounting" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                บัญชี
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending-welfare" className="space-y-4">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">คำร้องสวัสดิการ HR</h3>
                <p className="text-sm text-blue-600">รายการคำร้องสวัสดิการที่รอการอนุมัติจาก HR</p>
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
                <div className="space-x-2">
                  <Button
                    onClick={handleBulkApprove}
                    disabled={selectedRequests.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve ({selectedRequests.length})
                  </Button>
                  <Button
                    onClick={handleBulkReject}
                    disabled={selectedRequests.length === 0}
                    variant="destructive"
                  >
                    Reject ({selectedRequests.length})
                  </Button>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            filteredRequests.filter(req => req.status === 'pending_hr').length > 0 &&
                            selectedRequests.length === filteredRequests.filter(req => req.status === 'pending_hr').length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Welfare Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Approved by Manager</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Attachment</TableHead>
                      <TableHead className="text-center">PDF</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                          ไม่มีคำร้องสวัสดิการที่รอการอนุมัติจาก HR
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((req: WelfareRequest, index: number) => (
                        <TableRow key={`${req.id}-${req.type}-${index}`}>
                          <TableCell>
                            <Checkbox
                              onCheckedChange={() => handleSelectRequest(req.id)}
                              checked={selectedRequests.includes(req.id)}
                              aria-label={`Select request ${req.id}`}
                              disabled={req.status !== 'pending_hr'}
                            />
                          </TableCell>
                          <TableCell>{req.userName}</TableCell>
                          <TableCell>{req.userDepartment || '-'}</TableCell>
                          <TableCell>{getWelfareTypeLabel(req.type)}</TableCell>
                          <TableCell>{req.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>{format(new Date(req.date), 'PP')}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{req.managerApproverName}</div>
                              {req.managerApprovedAt && (
                                <div className="text-xs text-gray-500">
                                  {format(new Date(req.managerApprovedAt), 'dd/MM/yyyy HH:mm')}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Pending HR
                            </Badge>
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
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(req)}>View</Button>
                              {req.status === 'pending_hr' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(req.id)}
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
            
            <TabsContent value="pending-accounting" className="space-y-4">
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">คำร้องบัญชี HR</h3>
                <p className="text-sm text-green-600">รายการคำร้องเบิกเงินล่วงหน้าและเคลียร์ค่าใช้จ่ายที่รอการอนุมัติจาก HR</p>
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
                <div className="space-x-2">
                  <Button
                    onClick={handleBulkApprove}
                    disabled={selectedRequests.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve ({selectedRequests.length})
                  </Button>
                  <Button
                    onClick={handleBulkReject}
                    disabled={selectedRequests.length === 0}
                    variant="destructive"
                  >
                    Reject ({selectedRequests.length})
                  </Button>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            filteredRequests.filter(req => req.status === 'pending_hr').length > 0 &&
                            selectedRequests.length === filteredRequests.filter(req => req.status === 'pending_hr').length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Approved by Manager</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Attachment</TableHead>
                      <TableHead className="text-center">PDF</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                          ไม่มีคำร้องบัญชีที่รอการอนุมัติจาก HR
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((req: WelfareRequest, index: number) => (
                        <TableRow key={`${req.id}-${req.type}-${index}`}>
                          <TableCell>
                            <Checkbox
                              onCheckedChange={() => handleSelectRequest(req.id)}
                              checked={selectedRequests.includes(req.id)}
                              aria-label={`Select request ${req.id}`}
                              disabled={req.status !== 'pending_hr'}
                            />
                          </TableCell>
                          <TableCell>{req.userName}</TableCell>
                          <TableCell>{req.userDepartment || '-'}</TableCell>
                          <TableCell>{getWelfareTypeLabel(req.type)}</TableCell>
                          <TableCell>{req.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>{format(new Date(req.date), 'PP')}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{req.managerApproverName}</div>
                              {req.managerApprovedAt && (
                                <div className="text-xs text-gray-500">
                                  {format(new Date(req.managerApprovedAt), 'dd/MM/yyyy HH:mm')}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Pending HR
                            </Badge>
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
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(req)}>View</Button>
                              {req.status === 'pending_hr' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(req.id)}
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
                          <SelectItem value="pending_accounting">Pending Accounting</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected_hr">Rejected by HR</SelectItem>
                          <SelectItem value="rejected_accounting">Rejected by Accounting</SelectItem>
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

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Welfare Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Approved by Manager</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>HR Processed Date</TableHead>
                      <TableHead className="w-[200px]">หมายเหตุ</TableHead>
                      <TableHead className="text-center">Attachment</TableHead>
                      <TableHead className="text-center">เอกสารการอนุมัติ</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                          ไม่มีประวัติการอนุมัติ
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((req: WelfareRequest, index: number) => (
                        <TableRow key={`${req.id}-${req.type}-${index}`}>
                          <TableCell>{req.userName}</TableCell>
                          <TableCell>{req.userDepartment || '-'}</TableCell>
                          <TableCell>{getWelfareTypeLabel(req.type)}</TableCell>
                          <TableCell>{req.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>{format(new Date(req.date), 'PP')}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{req.managerApproverName}</div>
                              {req.managerApprovedAt && (
                                <div className="text-xs text-gray-500">
                                  {format(new Date(req.managerApprovedAt), 'dd/MM/yyyy HH:mm')}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {req.status === 'pending_accounting' ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Pending Accounting
                              </Badge>
                            ) : req.status === 'approved' ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Approved
                              </Badge>
                            ) : req.status === 'rejected_hr' ? (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Rejected by HR
                              </Badge>
                            ) : req.status === 'rejected_accounting' ? (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Rejected by Accounting
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                {req.status}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {req.hrApprovedAt ? format(new Date(req.hrApprovedAt), 'PP') : 
                             req.updatedAt ? format(new Date(req.updatedAt), 'PP') : '-'}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <div className="text-sm space-y-1">
                              {req.managerNotes && (
                                <div>
                                  <span className="font-medium">Manager:</span> {req.managerNotes}
                                </div>
                              )}
                              {req.hrNotes && (
                                <div>
                                  <span className="font-medium">HR:</span> {req.hrNotes}
                                </div>
                              )}
                            </div>
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
                          <TableCell className="text-center">
                            {(req.managerSignature || req.hrSignature) ? (
                              <div className="flex gap-1 justify-center">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={async () => {
                                    const { downloadPDFFromDatabase } = await import('@/utils/pdfManager');
                                    await downloadPDFFromDatabase(req.id);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  PDF
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">ยังไม่อนุมัติ</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(req)}>View</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>

        </CardContent>
      </Card>

      {selectedRequest && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request Details - HR Review</DialogTitle>
            </DialogHeader>
            <div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><strong>Employee:</strong> {selectedRequest.userName}</p>
                    <p><strong>Department:</strong> {selectedRequest.userDepartment || selectedRequest.department_user}</p>
                    <p><strong>Welfare Type:</strong> {getWelfareTypeLabel(selectedRequest.type)}</p>
                    <p><strong>Amount:</strong> {selectedRequest.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</p>
                  </div>
                  <div>
                    <p><strong>Date:</strong> {format(new Date(selectedRequest.date), 'PPP')}</p>
                    <p><strong>Status:</strong> {selectedRequest.status}</p>
                    <p><strong>Manager Approved By:</strong> {selectedRequest.approverId ? (managers[selectedRequest.approverId] || 'รออนุมัติ') : 'Not approved yet'}</p>
                  </div>
                </div>

                <div>
                  <p><strong>Title:</strong> {selectedRequest.title}</p>
                  <p><strong>Details:</strong> {selectedRequest.details}</p>
                </div>

                <div>
                  <p><strong>Attachments:</strong></p>
                  {selectedRequest.attachments && selectedRequest.attachments.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRequest.attachments.map((file, idx) => (
                        <a key={idx} href={file} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                          <FileText className="h-4 w-4" />
                          <span>ไฟล์ {idx + 1}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No attachments</span>
                  )}
                </div>

                <div>
                  <p><strong>Manager Notes:</strong> {selectedRequest.notes || 'No notes from manager'}</p>
                </div>

                {/* Signature Display Section */}
                {(selectedRequest.managerSignature || selectedRequest.hrSignature) && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-3">ลายเซ็นอนุมัติ</h4>

                    {/* Manager Signature */}
                    {selectedRequest.managerSignature && (
                      <SignatureDisplay
                        signature={selectedRequest.managerSignature}
                        approverName={selectedRequest.managerApproverName}
                        approvedAt={selectedRequest.managerApprovedAt}
                        role="manager"
                      />
                    )}

                    {/* HR Signature */}
                    {selectedRequest.hrSignature && (
                      <SignatureDisplay
                        signature={selectedRequest.hrSignature}
                        approverName={selectedRequest.hrApproverName}
                        approvedAt={selectedRequest.hrApprovedAt}
                        role="hr"
                      />
                    )}
                  </div>
                )}

                {/* PDF Download Button */}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const { downloadPDFFromDatabase } = await import('@/utils/pdfManager');
                      await downloadPDFFromDatabase(selectedRequest.id);
                    }}
                  >
                    Download PDF
                  </Button>

                  {/* Preview Button - Show only if there are signatures */}
                  {(selectedRequest.managerSignature || selectedRequest.hrSignature) && (
                    <Button
                      variant="default"
                      onClick={async () => {
                        const { previewPDFFromDatabase } = await import('@/utils/pdfManager');
                        await previewPDFFromDatabase(selectedRequest.id);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Preview PDF with Signatures
                    </Button>
                  )}
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">HR Review Notes (optional):</p>
                  <Input
                    placeholder="Enter HR review notes or rejection reason..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              {selectedRequest.status === 'pending_hr' && (
                <>
                  <Button
                    onClick={() => {
                      console.log('HR Approve button clicked for request:', selectedRequest);
                      handleApprove(selectedRequest.id);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve & Send to Accounting
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(selectedRequest.id, rejectionReason)}
                  >
                    Reject Request
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Rejection</DialogTitle>
          </DialogHeader>
          <p>Please provide a reason for rejecting the selected requests.</p>
          <Input
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="HR rejection reason..."
          />
          <DialogFooter>
            <Button onClick={confirmRejection} variant="destructive">Confirm Rejection</Button>
            <Button variant="outline" onClick={() => setIsRejectionModalOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Popup */}
      <SignaturePopup
        isOpen={isSignaturePopupOpen}
        onClose={() => {
          setIsSignaturePopupOpen(false);
          setPendingApprovalRequest(null);
          // Reset bulk approval states if user cancels
          if (isBulkApprovalMode) {
            setIsBulkApprovalMode(false);
            setBulkApprovalQueue([]);
            setCurrentBulkIndex(0);
            setSelectedRequests([]);
          }
        }}
        onSave={handleSignatureComplete}
        title={
          isBulkApprovalMode
            ? `ลงลายเซ็นอนุมัติ HR (${currentBulkIndex + 1}/${bulkApprovalQueue.length}) - ${pendingApprovalRequest?.userName}`
            : "ลงลายเซ็นอนุมัติ HR"
        }
        approverName={profile?.display_name || user?.email || ''}
      />

      {/* Loading Popup */}
      <LoadingPopup open={isLoading} />

    </Layout>
  );
};