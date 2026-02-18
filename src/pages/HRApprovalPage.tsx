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
import { Calendar as CalendarIcon, Search, Filter, FileText, History, Clock, Check, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SignaturePopup } from '@/components/signature/SignaturePopup';
import LoadingPopup from '@/components/forms/LoadingPopup';
import { getWelfareTypeLabel } from '@/lib/utils';

import { supabase } from '@/lib/supabase';
import { sendLineNotification } from '@/services/lineApi';

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

  // Count pending requests per tab (ไม่ขึ้นกับ search/date filter)
  const pendingCounts = useMemo(() => {
    const pendingHR = combinedRequests.filter(req => req.status === 'pending_hr');
    return {
      welfare: pendingHR.filter(req => req.type !== 'advance' && req.type !== 'expense-clearing').length,
      accounting: pendingHR.filter(req => req.type === 'advance' || req.type === 'expense-clearing').length,
    };
  }, [combinedRequests]);

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
          const processedStatuses = ['pending_accounting', 'pending_special_approval', 'approved', 'rejected_hr', 'rejected_accounting', 'rejected_special_approval'];
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

      // Check if this is a training request that requires special approval
      const amount = Number(pendingApprovalRequest.amount);
      const requestType = pendingApprovalRequest.type || pendingApprovalRequest.request_type;
      const requiresSpecialApproval = (requestType === 'internal_training' || requestType === 'training') && amount > 10000;
      
      const nextStatus = requiresSpecialApproval ? 'pending_special_approval' : 'pending_accounting';

      console.log('HR Approval Debug:', {
        requestType: requestType,
        originalAmount: pendingApprovalRequest.amount,
        convertedAmount: amount,
        amountType: typeof pendingApprovalRequest.amount,
        isGreaterThan10000: amount > 10000,
        requiresSpecialApproval,
        nextStatus
      });

      // Update with HR approval information and signature
      const { error } = await supabase
        .from('welfare_requests')
        .update({
          status: nextStatus,
          hr_approver_id: user.id,
          hr_approver_name: profile?.display_name || user.email,
          hr_approver_position: profile?.position || '',
          hr_approved_at: currentDateTime,
          hr_signature: signature,
          requires_special_approval: requiresSpecialApproval,
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

      // Generate PDF with both manager and HR signatures
      const updatedRequest = {
        ...pendingApprovalRequest,
        status: nextStatus as const,
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
      if (requestType === 'internal_training') {
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
          // Send LINE notification for current request before moving to next
          try {
            const employeeId = pendingApprovalRequest.employee_id || pendingApprovalRequest.userId;
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
                status: requiresSpecialApproval ? 'รออนุมัติโดย กรรมการผู้จัดการ' : 'รอบัญชีอนุมัติ',
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

          // Move to next request in bulk approval
          setCurrentBulkIndex(nextIndex);
          setPendingApprovalRequest(bulkApprovalQueue[nextIndex]);
          // Keep signature popup open for next request
        } else {
          // Send LINE notification for the last request in bulk
          try {
            const employeeId = pendingApprovalRequest.employee_id || pendingApprovalRequest.userId;
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
                status: requiresSpecialApproval ? 'รออนุมัติโดย กรรมการผู้จัดการ' : 'รอบัญชีอนุมัติ',
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

          // Bulk approval complete
          const hasSpecialApproval = bulkApprovalQueue.some(req => {
            const reqType = req.type || req.request_type;
            return (reqType === 'internal_training' || reqType === 'training') && Number(req.amount) > 10000;
          });
          const message = hasSpecialApproval
            ? `All ${bulkApprovalQueue.length} requests approved successfully. Some requests sent to Special Approval, others to Accounting.`
            : `All ${bulkApprovalQueue.length} requests approved successfully with signatures and sent to Accounting.`;

          addNotification({
            userId: user.id,
            title: 'Success',
            message,
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
        // Single approval - Send LINE notification
        try {
          const employeeId = pendingApprovalRequest.employee_id || pendingApprovalRequest.userId;
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
              status: requiresSpecialApproval ? 'รออนุมัติโดย กรรมการผู้จัดการ' : 'รอบัญชีอนุมัติ',
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

        const message = requiresSpecialApproval
          ? 'Request approved successfully with signature and sent to Special Approval.'
          : 'Request approved successfully with signature and sent to Accounting for final approval.';

        addNotification({
          userId: user.id,
          title: 'Success',
          message,
          type: 'success'
        });

        // Reset states
        setPendingApprovalRequest(null);
        setIsSignaturePopupOpen(false);
      }

    } catch (error: any) {
      console.error('Error in handleSignatureComplete:', error);
      
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
      

      <Card>
        <CardHeader>
          <CardTitle>
            <span>HR Approval Dashboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 p-1 rounded-lg gap-1">
              <TabsTrigger value="pending-welfare" className="flex items-center gap-2 bg-gray-200 text-gray-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white shadow-md transition-all">
                <Clock className="h-4 w-4" />
                สวัสดิการ
                {pendingCounts.welfare > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] text-center">
                    {pendingCounts.welfare}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending-accounting" className="flex items-center gap-2 bg-gray-200 text-gray-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white shadow-md transition-all">
                <FileText className="h-4 w-4" />
                บัญชี
                {pendingCounts.accounting > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] text-center">
                    {pendingCounts.accounting}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2 bg-gray-200 text-gray-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white shadow-md transition-all">
                <History className="h-4 w-4" />
                ประวัติ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending-welfare" className="space-y-4">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">คำร้องสวัสดิการ HR</h3>
                <p className="text-sm text-blue-600">รายการคำร้องสวัสดิการที่รอการอนุมัติจาก HR</p>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[150px]">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาพนักงาน..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <Filter className="mr-2 h-4 w-4" />
                        <span>กรองตามวันที่</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-4">
                        <h4 className="font-medium mb-2">ตัวกรอง</h4>
                        <div className="mt-4">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant={'outline'} className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateFilter ? format(dateFilter, 'PPP') : <span>เลือกวันที่</span>}
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
                <div className="flex gap-2">
                  <Button
                    onClick={handleBulkApprove}
                    disabled={selectedRequests.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    อนุมัติ ({selectedRequests.length})
                  </Button>
                  <Button
                    onClick={handleBulkReject}
                    disabled={selectedRequests.length === 0}
                    variant="destructive"
                  >
                    ปฏิเสธ ({selectedRequests.length})
                  </Button>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-3">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">ไม่มีคำร้องสวัสดิการที่รอการอนุมัติจาก HR</div>
                ) : (
                  filteredRequests.map((req: WelfareRequest, index: number) => (
                    <div key={`${req.id}-${req.type}-${index}`} className="border rounded-lg p-3 bg-white shadow-sm space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            onCheckedChange={() => handleSelectRequest(req.id)}
                            checked={selectedRequests.includes(req.id)}
                            disabled={req.status !== 'pending_hr'}
                          />
                          <div>
                            <p className="font-semibold text-sm">{req.userName}</p>
                            <p className="text-xs text-muted-foreground">{req.userDepartment || '-'}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px] shrink-0">Pending HR</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline" className="text-[10px]">{getWelfareTypeLabel(req.type)}</Badge>
                        <span className="font-bold text-blue-700">{req.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{format(new Date(req.date), 'dd/MM/yyyy')}</span>
                        <span>ผจก: {req.managerApproverName || '-'}</span>
                      </div>
                      <div className="flex gap-2 pt-1 border-t">
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleViewDetails(req)}>ดูรายละเอียด</Button>
                        {req.status === 'pending_hr' && (
                          <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleApprove(req.id)} disabled={isLoading}>อนุมัติ</Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="rounded-md border overflow-x-auto hidden lg:block">
                <Table className="text-xs md:text-sm">
                  <TableHeader className="bg-welfare-blue/100 [&_th]:text-white">
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
                      <TableHead>พนักงาน</TableHead>
                      <TableHead>แผนก</TableHead>
                      <TableHead>ประเภทสวัสดิการ</TableHead>
                      <TableHead>จำนวนเงิน</TableHead>
                      <TableHead>วันที่ยื่น</TableHead>
                      <TableHead>ผู้จัดการอนุมัติ</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-center">เอกสารแนบ</TableHead>
                      <TableHead className="text-center">PDF</TableHead>
                      <TableHead>การดำเนินการ</TableHead>
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
                          <TableCell className="text-center">
                            {(() => {
                              // เลือก PDF URL ตามสถานะ - สำหรับ HR ที่รอ pending_hr จะใช้ pdf_request_manager
                              let pdfUrl = null;
                              let pdfTitle = "ดู PDF เอกสาร";

                              if (req.pdf_request_manager) {
                                pdfUrl = req.pdf_request_manager;
                                pdfTitle = "ดู PDF ที่ Manager อนุมัติแล้ว";
                              } else if (req.pdfUrl || req.pdf_url) {
                                pdfUrl = req.pdfUrl || req.pdf_url;
                                pdfTitle = "ดู PDF เอกสาร";
                              }

                              return pdfUrl ? (
                                <Button asChild variant="ghost" size="icon">
                                  <a
                                    href={pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:text-green-800"
                                    title={pdfTitle}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              );
                            })()}
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
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[150px]">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาพนักงาน..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <Filter className="mr-2 h-4 w-4" />
                        <span>กรองตามวันที่</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-4">
                        <h4 className="font-medium mb-2">ตัวกรอง</h4>
                        <div className="mt-4">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant={'outline'} className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateFilter ? format(dateFilter, 'PPP') : <span>เลือกวันที่</span>}
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
                <div className="flex gap-2">
                  <Button
                    onClick={handleBulkApprove}
                    disabled={selectedRequests.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    อนุมัติ ({selectedRequests.length})
                  </Button>
                  <Button
                    onClick={handleBulkReject}
                    disabled={selectedRequests.length === 0}
                    variant="destructive"
                  >
                    ปฏิเสธ ({selectedRequests.length})
                  </Button>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-3">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">ไม่มีคำร้องบัญชีที่รอการอนุมัติจาก HR</div>
                ) : (
                  filteredRequests.map((req: WelfareRequest, index: number) => (
                    <div key={`${req.id}-${req.type}-${index}`} className="border rounded-lg p-3 bg-white shadow-sm space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            onCheckedChange={() => handleSelectRequest(req.id)}
                            checked={selectedRequests.includes(req.id)}
                            disabled={req.status !== 'pending_hr'}
                          />
                          <div>
                            <p className="font-semibold text-sm">{req.userName}</p>
                            <p className="text-xs text-muted-foreground">{req.userDepartment || '-'}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px] shrink-0">Pending HR</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline" className="text-[10px]">{getWelfareTypeLabel(req.type)}</Badge>
                        <span className="font-bold text-blue-700">{req.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{format(new Date(req.date), 'dd/MM/yyyy')}</span>
                        <span>ผจก: {req.managerApproverName || '-'}</span>
                      </div>
                      <div className="flex gap-2 pt-1 border-t">
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleViewDetails(req)}>ดูรายละเอียด</Button>
                        {req.status === 'pending_hr' && (
                          <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleApprove(req.id)} disabled={isLoading}>อนุมัติ</Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="rounded-md border overflow-x-auto hidden lg:block">
                <Table className="text-xs md:text-sm">
                  <TableHeader className="bg-welfare-blue/100 [&_th]:text-white">
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
                      <TableHead>พนักงาน</TableHead>
                      <TableHead>แผนก</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>จำนวนเงิน</TableHead>
                      <TableHead>วันที่ยื่น</TableHead>
                      <TableHead>ผู้จัดการอนุมัติ</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-center">เอกสารแนบ</TableHead>
                      <TableHead className="text-center">PDF</TableHead>
                      <TableHead>การดำเนินการ</TableHead>
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
                          <TableCell className="text-center">
                            {(() => {
                              // เลือก PDF URL ตามสถานะ - สำหรับ HR ที่รอ pending_hr จะใช้ pdf_request_manager
                              let pdfUrl = null;
                              let pdfTitle = "ดู PDF เอกสาร";

                              if (req.pdf_request_manager) {
                                pdfUrl = req.pdf_request_manager;
                                pdfTitle = "ดู PDF ที่ Manager อนุมัติแล้ว";
                              } else if (req.pdfUrl || req.pdf_url) {
                                pdfUrl = req.pdfUrl || req.pdf_url;
                                pdfTitle = "ดู PDF เอกสาร";
                              }

                              return pdfUrl ? (
                                <Button asChild variant="ghost" size="icon">
                                  <a
                                    href={pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:text-green-800"
                                    title={pdfTitle}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              );
                            })()}
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
                          <SelectItem value="pending_special_approval">Pending Special Approval</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected_hr">Rejected by HR</SelectItem>
                          <SelectItem value="rejected_accounting">Rejected by Accounting</SelectItem>
                          <SelectItem value="rejected_special_approval">Rejected by Special Approval</SelectItem>
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

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-3">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">ไม่มีประวัติการอนุมัติ</div>
                ) : (
                  filteredRequests.map((req: WelfareRequest, index: number) => (
                    <div key={`${req.id}-${req.type}-${index}`} className="border rounded-lg p-3 bg-white shadow-sm space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{req.userName}</p>
                          <p className="text-xs text-muted-foreground">{req.userDepartment || '-'}</p>
                        </div>
                        {req.status === 'pending_accounting' ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] shrink-0">รอบัญชี</Badge>
                        ) : req.status === 'pending_special_approval' ? (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] shrink-0">รอผู้บริหาร</Badge>
                        ) : req.status === 'completed' ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] shrink-0">เสร็จสมบูรณ์</Badge>
                        ) : req.status?.includes('rejected') ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] shrink-0">ปฏิเสธ</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] shrink-0">{req.status}</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline" className="text-[10px]">{getWelfareTypeLabel(req.type)}</Badge>
                        <span className="font-bold text-blue-700">{req.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>ยื่น: {format(new Date(req.date), 'dd/MM/yyyy')}</span>
                        <span>ผจก: {req.managerApproverName || '-'}</span>
                      </div>
                      {(req.managerNotes || req.hrNotes) && (
                        <div className="text-xs space-y-0.5 bg-gray-50 rounded p-2">
                          {req.managerNotes && <div><span className="font-medium">Manager:</span> {req.managerNotes}</div>}
                          {req.hrNotes && <div><span className="font-medium">HR:</span> {req.hrNotes}</div>}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1 border-t">
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleViewDetails(req)}>ดูรายละเอียด</Button>
                        {(() => {
                          let pdfUrl = req.pdf_request_hr || req.pdf_request_manager || req.pdfUrl || req.pdf_url;
                          if (pdfUrl) return <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 px-3 text-xs border rounded-md text-green-600"><FileText className="h-3.5 w-3.5 mr-1" />PDF</a>;
                          return null;
                        })()}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="rounded-md border overflow-x-auto hidden lg:block">
                <Table className="text-xs md:text-sm">
                  <TableHeader className="bg-welfare-blue/100 [&_th]:text-white">
                    <TableRow>
                      <TableHead>พนักงาน</TableHead>
                      <TableHead>แผนก</TableHead>
                      <TableHead>ประเภทสวัสดิการ</TableHead>
                      <TableHead>จำนวนเงิน</TableHead>
                      <TableHead>วันที่ยื่น</TableHead>
                      <TableHead>ผู้จัดการอนุมัติ</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>วันที่ HR ดำเนินการ</TableHead>
                      <TableHead className="w-[200px]">หมายเหตุ</TableHead>
                      <TableHead className="text-center">เอกสารแนบ</TableHead>
                      <TableHead className="text-center">เอกสารการอนุมัติ</TableHead>
                      <TableHead>การดำเนินการ</TableHead>
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
                            ) : req.status === 'pending_special_approval' ? (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                Pending Special Approval
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
                            ) : req.status === 'rejected_special_approval' ? (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Rejected by Special Approval
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
                            {(() => {
                              // เลือก PDF URL ตามสถานะ
                              let pdfUrl = null;
                              let pdfTitle = "ดู PDF เอกสาร";

                              if (req.pdf_request_hr) {
                                pdfUrl = req.pdf_request_hr;
                                pdfTitle = "ดู PDF ที่ HR อนุมัติแล้ว";
                              } else if (req.pdf_request_manager) {
                                pdfUrl = req.pdf_request_manager;
                                pdfTitle = "ดู PDF ที่ Manager อนุมัติแล้ว";
                              } else if (req.pdfUrl || req.pdf_url) {
                                pdfUrl = req.pdfUrl || req.pdf_url;
                                pdfTitle = "ดู PDF เอกสาร";
                              }

                              return pdfUrl ? (
                                <Button asChild variant="ghost" size="icon">
                                  <a
                                    href={pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:text-green-800"
                                    title={pdfTitle}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              );
                            })()}
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
          <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
            {/* Header สรุปข้อมูล */}
            <div className="px-6 pt-6 pb-3 border-b bg-gray-50/80 rounded-t-lg flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <DialogHeader className="p-0 space-y-0">
                  <DialogTitle className="text-lg">{selectedRequest.userName} — {getWelfareTypeLabel(selectedRequest.type)}</DialogTitle>
                </DialogHeader>
                <Badge
                  className={`text-sm px-3 py-1 ${
                    selectedRequest.status === 'pending_hr' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                    selectedRequest.status === 'pending_accounting' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    selectedRequest.status === 'pending_special_approval' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                    selectedRequest.status.includes('rejected') ? 'bg-red-100 text-red-800 border-red-300' :
                    selectedRequest.status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' :
                    'bg-gray-100 text-gray-800 border-gray-300'
                  }`}
                  variant="outline"
                >
                  {selectedRequest.status === 'pending_hr' ? 'รอ HR' :
                   selectedRequest.status === 'pending_accounting' ? 'รอบัญชี' :
                   selectedRequest.status === 'pending_special_approval' ? 'รออนุมัติพิเศษ' :
                   selectedRequest.status === 'approved' ? 'อนุมัติแล้ว' :
                   selectedRequest.status === 'rejected_hr' ? 'ปฏิเสธโดย HR' :
                   selectedRequest.status === 'rejected_accounting' ? 'ปฏิเสธโดยบัญชี' :
                   selectedRequest.status === 'rejected_special_approval' ? 'ปฏิเสธโดยอนุมัติพิเศษ' :
                   selectedRequest.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>แผนก: <strong className="text-foreground">{selectedRequest.userDepartment || selectedRequest.department_user || '-'}</strong></span>
                <span>วันที่ยื่น: <strong className="text-foreground">{format(new Date(selectedRequest.date), 'dd/MM/yyyy')}</strong></span>
                <span>จำนวนเงิน: <strong className="text-blue-700 text-base">{selectedRequest.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 })}</strong></span>
                {selectedRequest.runNumber && <span>เลขที่: <strong className="text-foreground">{selectedRequest.runNumber}</strong></span>}
                {selectedRequest.managerApproverName && (
                  <span>ผู้จัดการ: <strong className="text-foreground">{selectedRequest.managerApproverName}</strong></span>
                )}
                {/* แสดงข้อมูลอนุโลมส่วนเกิน (ถ้ามี) */}
                {selectedRequest.type === 'training' && selectedRequest.manager_waiver_type && selectedRequest.manager_waiver_type !== 'none' && (
                  <span className="text-orange-600">
                    อนุโลมส่วนเกิน: <strong>
                      {selectedRequest.manager_waiver_type === 'full' ? 'บริษัทจ่ายทั้งหมด' :
                       `บริษัทจ่ายเพิ่ม ${Number(selectedRequest.manager_waiver_amount || 0).toLocaleString('th-TH')} บาท`}
                    </strong>
                    {selectedRequest.manager_waiver_reason && ` (${selectedRequest.manager_waiver_reason})`}
                  </span>
                )}
                {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                  <span className="flex items-center gap-1">
                    เอกสารแนบ:
                    {selectedRequest.attachments.map((file, idx) => (
                      <a key={idx} href={file} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium">
                        <FileText className="h-3.5 w-3.5" />ไฟล์ {idx + 1}
                      </a>
                    ))}
                  </span>
                )}
              </div>
            </div>

            {/* PDF Preview */}
            <div className="flex-1 min-h-0 px-6 py-3">
              {(() => {
                const pdfUrl = selectedRequest.pdf_request_manager || selectedRequest.pdfUrl || selectedRequest.pdf_url;
                if (pdfUrl) {
                  return (
                    <iframe
                      src={pdfUrl}
                      className="w-full h-full rounded-lg border"
                      title="PDF Preview"
                    />
                  );
                }
                return (
                  <div className="w-full h-full flex items-center justify-center border rounded-lg bg-gray-50">
                    <div className="text-center text-muted-foreground">
                      <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">ไม่มี PDF สำหรับแสดงตัวอย่าง</p>
                      <p className="text-sm mt-1">PDF จะถูกสร้างหลังจากมีการอนุมัติ</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer — ปุ่ม Action */}
            {selectedRequest.status === 'pending_hr' && (
              <div className="px-6 py-3 border-t bg-gray-50/80 rounded-b-lg flex-shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="ระบุเหตุผลการปฏิเสธ (ถ้ามี)..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      onClick={() => handleApprove(selectedRequest.id)}
                      className="bg-green-600 hover:bg-green-700 px-6"
                      disabled={isLoading}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      อนุมัติ
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(selectedRequest.id, rejectionReason)}
                      disabled={isLoading}
                      className="px-6"
                    >
                      <X className="h-4 w-4 mr-2" />
                      ปฏิเสธ
                    </Button>
                  </div>
                </div>
              </div>
            )}
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