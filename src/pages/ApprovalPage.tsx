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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Filter, FileText, History, Clock, BarChart3, TrendingUp, Users, DollarSign, Download, Check, X, FileWarning } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SignaturePopup } from '@/components/signature/SignaturePopup';
import { SignatureDisplay } from '@/components/signature/SignatureDisplay';
import { usePDFOperations } from '@/hooks/usePDFOperations';
import LoadingPopup from '@/components/forms/LoadingPopup';
import { getWelfareTypeLabel } from '@/lib/utils';



import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { sendLineNotification } from '@/services/lineApi';

export const ApprovalPage = () => {
  const { user, profile, loading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { updateRequestStatus, welfareRequests: allRequests, refreshRequests } = useWelfare();
  const { trainingRequests: internalTrainingRequests, updateRequestStatus: updateInternalTrainingStatus, refreshRequests: refreshInternalTrainingRequests } = useInternalTraining();
  const [isLoading, setIsLoading] = useState(false);
  const [managers, setManagers] = useState<{[key: string]: string}>({});
  const [teamMemberIds, setTeamMemberIds] = useState<number[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<WelfareRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionRequestId, setRejectionRequestId] = useState<number | null>(null);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [isSignaturePopupOpen, setIsSignaturePopupOpen] = useState(false);
  const [pendingApprovalRequest, setPendingApprovalRequest] = useState<WelfareRequest | null>(null);
  const [activeTab, setActiveTab] = useState('pending-welfare');
  const [reportDateRange, setReportDateRange] = useState<{ from: Date | null; to: Date | null } | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const { downloadPDF, previewPDF, isLoading: isPDFLoading } = usePDFOperations();

  // Waiver states (อนุโลมส่วนเกินค่าอบรม)
  const [isWaiverDialogOpen, setIsWaiverDialogOpen] = useState(false);
  const [waiverType, setWaiverType] = useState<'none' | 'full' | 'partial'>('none');
  const [waiverAmount, setWaiverAmount] = useState<number>(0);
  const [waiverReason, setWaiverReason] = useState('');

  // Revision request states (ขอเอกสารเพิ่มเติม)
  const [isRevisionDialogOpen, setIsRevisionDialogOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [revisionRequestId, setRevisionRequestId] = useState<number | null>(null);

  // Cleanup function to reset states
  const resetApprovalStates = () => {
    setPendingApprovalRequest(null);
    setIsSignaturePopupOpen(false);
    setIsWaiverDialogOpen(false);
    setWaiverType('none');
    setWaiverAmount(0);
    setWaiverReason('');
  };



  useEffect(() => {
    if (isAuthLoading) return;

    if (!user || (!['manager', 'admin', 'accountingandmanager'].includes(profile?.role))) {
      addNotification({
        userId: user?.id || 'system',
        title: 'ไม่มีสิทธิ์เข้าถึง',
        message: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้',
        type: 'error',
      });
      navigate('/dashboard', { replace: true });
    } else if ((profile?.role === 'manager' || profile?.role === 'accountingandmanager') && profile.display_name) {
      fetchTeamMemberIds(profile.display_name);
    } else if (profile?.role === 'admin') {
      // Admin user will see all requests
    }
  }, [user, profile, isAuthLoading, navigate, addNotification]);

  const fetchTeamMemberIds = async (managerName: string) => {
    try {
      const { data, error } = await supabase
        .from('Employee')
        .select('id')
        .eq('manager_name', managerName);

      if (error) {
        console.error('Error fetching team members by manager name:', error);
        return;
      }

      if (data) {
        const memberIds = data.map(member => member.id);
        setTeamMemberIds(memberIds);
      }
    } catch (err) {
      console.error('Failed to fetch team member IDs:', err);
    }
  };

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
    // Skip filtering for reports tab as it has its own filtering logic
    if (activeTab === 'reports') {
      return [];
    }

    let base = combinedRequests;
    if ((profile?.role === 'manager' || profile?.role === 'accountingandmanager') && teamMemberIds.length > 0) {
      // For history tab, include manager's own requests as well
      if (activeTab === 'history') {
        base = combinedRequests.filter(req => {
          if (!req.userId) return false;
          const userIdNum = parseInt(req.userId, 10);
          // Include team members' requests OR manager's own requests
          return teamMemberIds.includes(userIdNum) || req.userId === profile?.employee_id?.toString();
        });
      } else {
        base = combinedRequests.filter(req => req.userId && teamMemberIds.includes(parseInt(req.userId, 10)));
      }
    }

    // ประเภทที่ต้องส่งไปบัญชี (accounting types)
    const accountingTypes = ['advance', 'general-advance', 'expense-clearing', 'general-expense-clearing'];

    return base
      .filter((req: WelfareRequest) => {
        // Filter by tab type first
        if (activeTab === 'pending-welfare') {
          // Show only welfare requests pending manager approval
          if (req.status !== 'pending_manager') return false;
          // Filter out accounting types
          if (accountingTypes.includes(req.type)) return false;
        } else if (activeTab === 'pending-accounting') {
          // Show only accounting requests pending manager approval
          if (req.status !== 'pending_manager') return false;
          // Only show accounting types
          if (!accountingTypes.includes(req.type)) return false;
        } else if (activeTab === 'history') {
          // Show requests that have been processed by manager (approved or rejected)
          const processedStatuses = ['pending_executive', 'pending_hr', 'pending_accounting', 'approved', 'rejected_executive', 'rejected_manager', 'rejected_hr', 'rejected_accounting'];
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
  }, [combinedRequests, profile?.role, teamMemberIds, statusFilter, dateFilter, searchTerm, activeTab]);

  // Count pending requests per tab (ไม่ขึ้นกับ search/date filter)
  const pendingCounts = useMemo(() => {
    const accountingTypes = ['advance', 'general-advance', 'expense-clearing', 'general-expense-clearing'];
    let base = combinedRequests;
    if ((profile?.role === 'manager' || profile?.role === 'accountingandmanager') && teamMemberIds.length > 0) {
      base = combinedRequests.filter(req => req.userId && teamMemberIds.includes(parseInt(req.userId, 10)));
    }
    const pendingManager = base.filter(req => req.status === 'pending_manager');
    return {
      welfare: pendingManager.filter(req => !accountingTypes.includes(req.type)).length,
      accounting: pendingManager.filter(req => accountingTypes.includes(req.type)).length,
    };
  }, [combinedRequests, profile?.role, teamMemberIds]);

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





  const handleViewDetails = (request: WelfareRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const confirmRejection = async () => {
    if (!rejectionRequestId || !rejectionReason || !user) return;
    setIsLoading(true);
    try {
      await updateRequestStatus(rejectionRequestId, 'rejected_manager', rejectionReason);
      addNotification({
        userId: user.id,
        title: 'สำเร็จ',
        message: 'ปฏิเสธคำร้องสำเร็จ',
        type: 'success'
      });
      setRejectionReason('');
      setRejectionRequestId(null);
      setIsRejectionModalOpen(false);
    } catch (error) {
      addNotification({
        userId: user.id,
        title: 'เกิดข้อผิดพลาด',
        message: 'ปฏิเสธคำร้องล้มเหลว',
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

    setPendingApprovalRequest(request);
    setIsModalOpen(false);

    // ถ้าเป็น training ที่มีส่วนเกิน → แสดง dialog อนุโลมก่อน
    const hasExcess = request.type === 'training' && (request.excess_amount || 0) > 0;
    if (hasExcess) {
      setWaiverType('none');
      setWaiverAmount(0);
      setWaiverReason('');
      setIsWaiverDialogOpen(true);
    } else {
      setIsSignaturePopupOpen(true);
    }
  };

  // เมื่อหัวหน้ายืนยันตัวเลือกอนุโลม → เปิด signature popup
  const handleWaiverConfirm = () => {
    setIsWaiverDialogOpen(false);
    setIsSignaturePopupOpen(true);
  };

  const handleSignatureComplete = async (signature: string) => {
    if (!user || !pendingApprovalRequest) return;
    
    setIsLoading(true);
    try {
      const currentDateTime = new Date().toISOString();
      
      // Handle individual approval
      // Determine next status based on request type
      const accountingTypesForStatus = ['advance', 'general-advance', 'expense-clearing', 'general-expense-clearing'];
      const nextStatus = accountingTypesForStatus.includes(pendingApprovalRequest.type) ? 'pending_accounting' : 'pending_hr';

      // คำนวณ company_payment / employee_payment ใหม่ตามการอนุโลม
      const hasExcess = pendingApprovalRequest.type === 'training' && (pendingApprovalRequest.excess_amount || 0) > 0;
      const excessAmount = pendingApprovalRequest.excess_amount || 0;
      let updatedCompanyPayment = pendingApprovalRequest.company_payment;
      let updatedEmployeePayment = pendingApprovalRequest.employee_payment;

      if (hasExcess && waiverType !== 'none') {
        if (waiverType === 'full') {
          // บริษัทจ่ายส่วนเกินทั้งหมด
          updatedCompanyPayment = excessAmount;
          updatedEmployeePayment = 0;
        } else if (waiverType === 'partial') {
          // กำหนดเอง: บริษัทจ่ายเพิ่มตาม waiverAmount
          const originalCompany = excessAmount / 2;
          const extraCompany = Math.min(waiverAmount, excessAmount / 2); // ไม่เกินส่วนของพนักงาน
          updatedCompanyPayment = originalCompany + extraCompany;
          updatedEmployeePayment = excessAmount - updatedCompanyPayment;
          if ((updatedEmployeePayment || 0) < 0) updatedEmployeePayment = 0;
        }
      }

      const updateData: any = {
        status: nextStatus,
        manager_approver_id: user.id,
        manager_approver_name: profile?.display_name || user.email,
        manager_approver_position: profile?.position || '',
        manager_approved_at: currentDateTime,
        manager_signature: signature,
        updated_at: currentDateTime,
      };

      // เพิ่ม waiver fields เฉพาะเมื่อมีส่วนเกิน
      if (hasExcess) {
        updateData.manager_waiver_type = waiverType;
        updateData.manager_waiver_amount = waiverType === 'partial' ? waiverAmount : (waiverType === 'full' ? excessAmount : 0);
        updateData.manager_waiver_reason = waiverReason || null;
        updateData.company_payment = updatedCompanyPayment;
        updateData.employee_payment = updatedEmployeePayment;
      }

      const { error } = await supabase
        .from('welfare_requests')
        .update(updateData)
        .eq('id', pendingApprovalRequest.id);

      if (error) {
        console.error('Error updating request:', error);
        throw error;
      }

      const accountingTypesForDest = ['advance', 'general-advance', 'expense-clearing', 'general-expense-clearing'];
      const destination = accountingTypesForDest.includes(pendingApprovalRequest.type) ? 'บัญชี' : 'HR';
      addNotification({
        userId: user.id,
        title: 'สำเร็จ',
        message: `อนุมัติคำร้องสำเร็จ พร้อมลายเซ็น ส่งต่อไป${destination}`,
        type: 'success'
      });

      // Send LINE notification to the requester
      try {
        // Get employee email from request
        const { data: employeeData } = await supabase
          .from('Employee')
          .select('email_user')
          .eq('id', pendingApprovalRequest.userId)
          .single();

        if (employeeData?.email_user) {
          await sendLineNotification({
            employeeEmail: employeeData.email_user,
            type: getWelfareTypeLabel(pendingApprovalRequest.type),
            status: `รอ${destination === 'HR' ? ' HR ' : 'บัญชี'}อนุมัติ`,
            amount: Number(pendingApprovalRequest.amount) || 0,
            userName: pendingApprovalRequest.userName,
            requestDate: new Date().toLocaleString('th-TH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
          });
        }
      } catch (lineError) {
        console.error('LINE notification error:', lineError);
      }

      // Refresh both welfare and internal training requests
      await refreshRequests();
      await refreshInternalTrainingRequests();

      // Store requestId before resetting state
      const requestId = pendingApprovalRequest.id;

      // Reset states
      setPendingApprovalRequest(null);
      setIsSignaturePopupOpen(false);

      // Add signature to PDF in background (non-blocking)
      setTimeout(async () => {
        try {
          // Check if it's internal training or welfare request
          if (pendingApprovalRequest.type === 'internal_training') {
            // Handle internal training PDF generation
            const { generateInternalTrainingPDF } = await import('@/components/pdf/InternalTrainingPDFGenerator');
            const pdfBlob = await generateInternalTrainingPDF(
              pendingApprovalRequest as any,
              user,
              undefined,
              signature, // manager signature
              undefined, // hr signature
              pendingApprovalRequest.userSignature || pendingApprovalRequest.user_signature // user signature
            );

            // Store PDF in database
            const { storePDFInDatabase } = await import('@/utils/pdfManager');
            await storePDFInDatabase(requestId, pdfBlob, signature, 'manager', profile?.display_name || user.email);
          } else {
            // Handle welfare PDF
            const { addSignatureToPDF, debugPDFColumns } = await import('@/utils/pdfManager');
            await addSignatureToPDF(
              requestId,
              'manager',
              signature,
              profile?.display_name || user.email
            );
            // Debug PDF columns after adding signature
            await debugPDFColumns(requestId);
          }
          // PDF signature added successfully in background
        } catch (pdfError) {
          console.error('Error adding signature to PDF (background):', pdfError);
          // Don't show error to user since main approval was successful
        }
      }, 100);

    } catch (error) {
      console.error('Error in handleSignatureComplete:', error);
      addNotification({
        userId: user.id,
        title: 'เกิดข้อผิดพลาด',
        message: 'อนุมัติคำร้องล้มเหลว',
        type: 'error'
      });
      // Don't reset states on error so user can try again
      throw error; // Re-throw to let SignaturePopup handle the error state
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReject = async (requestId: number, comment: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      // All requests are now stored in welfare_requests table
      await updateRequestStatus(requestId, 'rejected_manager', comment);
      
      // Note: The state will be updated automatically by the context
      addNotification({
        userId: user.id,
        title: 'สำเร็จ',
        message: 'ปฏิเสธคำร้องสำเร็จ',
        type: 'success'
      });
      setIsModalOpen(false);
      setIsRejectionModalOpen(false);
    } catch (error) {
      addNotification({
        userId: user.id,
        title: 'เกิดข้อผิดพลาด',
        message: 'ปฏิเสธคำร้องล้มเหลว',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevisionRequest = async () => {
    if (!revisionRequestId || !revisionNote.trim()) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('welfare_requests')
        .update({
          status: 'pending_revision',
          revision_requested_by: 'manager',
          revision_note: revisionNote.trim(),
          revision_requested_at: new Date().toISOString(),
        } as any)
        .eq('id', revisionRequestId);

      if (error) throw error;

      // Send LINE notification to employee
      const request = allRequests.find(r => r.id === revisionRequestId);
      if (request) {
        const { data: employeeData } = await supabase
          .from('Employee')
          .select('email_user')
          .eq('id', Number(request.userId))
          .single();

        if (employeeData?.email_user) {
          await sendLineNotification({
            employeeEmail: employeeData.email_user,
            type: getWelfareTypeLabel(request.type),
            status: 'ขอเอกสารเพิ่มเติม',
            amount: Number(request.amount) || 0,
            userName: request.userName,
            requestDate: new Date().toLocaleString('th-TH', {
              year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            }),
          });
        }
      }

      addNotification({
        userId: user!.id,
        title: 'สำเร็จ',
        message: 'ส่งคำขอเอกสารเพิ่มเติมเรียบร้อยแล้ว',
        type: 'success',
      });

      await refreshRequests(true);
      setIsRevisionDialogOpen(false);
      setRevisionNote('');
      setRevisionRequestId(null);
      setIsModalOpen(false);
    } catch (error) {
      addNotification({
        userId: user!.id,
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถส่งคำขอเอกสารเพิ่มเติมได้',
        type: 'error',
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
            <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Helper functions for reports
  const getTeamRequests = () => {
    let teamRequests = [];

    // First, filter by role and team membership
    if (profile?.role === 'admin') {
      // Admin can see all requests
      teamRequests = combinedRequests;
    } else if ((profile?.role === 'manager' || profile?.role === 'accountingandmanager') && teamMemberIds.length > 0) {
      // Manager can see their team members' requests AND their own requests
      teamRequests = combinedRequests.filter(req => {
        if (!req.userId) return false;

        // Try both string and number comparison
        const userIdAsNumber = parseInt(req.userId, 10);
        const userIdAsString = req.userId.toString();

        // Include team members' requests OR manager's own requests
        return teamMemberIds.includes(userIdAsNumber) ||
               teamMemberIds.map(id => id.toString()).includes(userIdAsString) ||
               req.userId === profile?.employee_id?.toString();
      });
    } else {
      // If no team members loaded yet or not authorized, return empty array
      return [];
    }
    
    // Apply date filter if set
    if (reportDateRange?.from && reportDateRange?.to) {
      teamRequests = teamRequests.filter(req => {
        const reqDate = new Date(req.date);
        const fromDate = new Date(reportDateRange.from!);
        const toDate = new Date(reportDateRange.to!);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        return reqDate >= fromDate && reqDate <= toDate;
      });
    }
    
    // Apply employee filter if set
    if (selectedEmployee !== 'all') {
      teamRequests = teamRequests.filter(req => req.userName === selectedEmployee);
    }
    
    // Apply search term if set
    if (searchTerm) {
      teamRequests = teamRequests.filter(req => 
        req.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return teamRequests;
  };

  const getTeamReportData = () => {
    const teamRequests = getTeamRequests();
    const totalRequests = teamRequests.length;
    const totalAmount = teamRequests.reduce((sum, req) => sum + (req.amount || 0), 0);
    const activeMembers = new Set(teamRequests.map(req => req.userName)).size;
    const approvedRequests = teamRequests.filter(req => 
      ['approved', 'completed', 'pending_hr', 'pending_accounting'].includes(req.status)
    ).length;
    const approvalRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;
    
    return {
      totalRequests,
      totalAmount,
      activeMembers,
      approvalRate
    };
  };

  const getWelfareTypeSummary = () => {
    const teamRequests = getTeamRequests();
    const summary: Record<string, { count: number; amount: number }> = {};
    
    teamRequests.forEach(req => {
      if (!summary[req.type]) {
        summary[req.type] = { count: 0, amount: 0 };
      }
      summary[req.type].count++;
      summary[req.type].amount += req.amount || 0;
    });
    
    return Object.entries(summary)
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getIndividualEmployeeReport = () => {
    const teamRequests = getTeamRequests();
    const employeeMap: Record<string, {
      name: string;
      department: string;
      totalRequests: number;
      approved: number;
      pending: number;
      rejected: number;
      totalAmount: number;
    }> = {};
    
    teamRequests.forEach(req => {
      if (!employeeMap[req.userName]) {
        employeeMap[req.userName] = {
          name: req.userName,
          department: req.userDepartment || req.department_user || '-',
          totalRequests: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          totalAmount: 0
        };
      }
      
      const emp = employeeMap[req.userName];
      emp.totalRequests++;
      emp.totalAmount += req.amount || 0;
      
      if (['approved', 'completed'].includes(req.status)) {
        emp.approved++;
      } else if (req.status.includes('pending')) {
        emp.pending++;
      } else if (req.status.includes('rejected')) {
        emp.rejected++;
      }
    });
    
    return Object.values(employeeMap).sort((a, b) => b.totalAmount - a.totalAmount);
  };

  const exportTeamReport = () => {
    const teamRequests = getTeamRequests();
    const reportData = getTeamReportData();
    const welfareTypeSummary = getWelfareTypeSummary();
    const individualReport = getIndividualEmployeeReport();
    
    let csv = '';
    
    // Header information
    csv += 'Team Welfare Report\r\n';
    csv += `Generated on: ${new Date().toLocaleDateString()}\r\n`;
    csv += `Manager: ${profile?.display_name || user?.email || ''}\r\n`;
    if (reportDateRange?.from && reportDateRange?.to) {
      csv += `Period: ${format(reportDateRange.from, 'PP')} - ${format(reportDateRange.to, 'PP')}\r\n`;
    }
    csv += '\r\n';
    
    // Summary
    csv += 'SUMMARY\r\n';
    csv += `Total Requests,${reportData.totalRequests}\r\n`;
    csv += `Total Amount,${reportData.totalAmount.toLocaleString()}\r\n`;
    csv += `Active Members,${reportData.activeMembers}\r\n`;
    csv += `Approval Rate,${reportData.approvalRate}%\r\n`;
    csv += '\r\n';
    
    // Welfare Type Summary
    csv += 'WELFARE TYPE SUMMARY\r\n';
    csv += 'Type,Count,Amount\r\n';
    welfareTypeSummary.forEach(item => {
      csv += `"${getWelfareTypeLabel(item.type)}",${item.count},"${item.amount.toLocaleString()}"\r\n`;
    });
    csv += '\r\n';
    
    // Individual Employee Report
    csv += 'INDIVIDUAL EMPLOYEE REPORT\r\n';
    csv += 'Employee,Department,Total Requests,Approved,Pending,Rejected,Total Amount\r\n';
    individualReport.forEach(emp => {
      csv += `"${emp.name}","${emp.department}",${emp.totalRequests},${emp.approved},${emp.pending},${emp.rejected},"${emp.totalAmount.toLocaleString()}"\r\n`;
    });
    csv += '\r\n';
    
    // Detailed Requests
    csv += 'DETAILED REQUESTS\r\n';
    csv += 'Date,Employee,Department,Type,Amount,Status,Details\r\n';
    teamRequests.forEach(req => {
      csv += `"${format(new Date(req.date), 'PP')}","${req.userName}","${req.userDepartment || req.department_user || '-'}","${getWelfareTypeLabel(req.type)}","${(req.amount || 0).toLocaleString()}","${req.status}","${req.details || ''}"\r\n`;
    });
    
    // Create and download file
    const csvWithBom = '\uFEFF' + csv;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = reportDateRange?.from && reportDateRange?.to
      ? `${format(reportDateRange.from, 'yyyy-MM-dd')}_${format(reportDateRange.to, 'yyyy-MM-dd')}`
      : format(new Date(), 'yyyy-MM-dd');
    link.download = `team_welfare_report_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingPopup open={isLoading} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-600">กำลังดำเนินการอนุมัติ...</p>
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
            <span>แดชบอร์ดอนุมัติคำร้อง (ผู้จัดการ)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 p-1 rounded-lg gap-1">
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
              <TabsTrigger value="reports" className="flex items-center gap-2 bg-gray-200 text-gray-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white shadow-md transition-all">
                <BarChart3 className="h-4 w-4" />
                รายงาน
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending-welfare" className="space-y-4">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">คำร้องสวัสดิการ</h3>
                <p className="text-sm text-blue-600">รายการคำร้องสวัสดิการที่รอการอนุมัติจากผู้จัดการ</p>
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
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-3">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">ไม่มีคำร้องสวัสดิการที่รอการอนุมัติ</div>
                ) : (
                  filteredRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-3 bg-white shadow-sm space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{request.userName}</p>
                          <p className="text-xs text-muted-foreground">{request.userDepartment || request.department_user || '-'}</p>
                        </div>
                        <Badge
                          variant={
                            request.status === 'pending_manager' ? 'secondary' :
                            request.status === 'pending_hr' ? 'outline' :
                            request.status === 'pending_accounting' ? 'outline' :
                            request.status.includes('rejected') ? 'destructive' : 'secondary'
                          }
                          className="text-[10px] shrink-0"
                        >
                          {request.status === 'pending_manager' ? 'รอผู้จัดการ' :
                           request.status === 'pending_hr' ? 'รอ HR' :
                           request.status === 'pending_accounting' ? 'รอบัญชี' :
                           request.status === 'approved' ? 'อนุมัติ' :
                           request.status === 'rejected_manager' ? 'ปฏิเสธ' :
                           request.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline" className="text-[10px]">{getWelfareTypeLabel(request.type)}</Badge>
                        <span className="font-bold text-blue-700">{request.amount ? `฿${request.amount.toLocaleString()}` : '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{format(new Date(request.date), 'dd/MM/yyyy')}</span>
                        <div className="flex items-center gap-1">
                          {request.attachments && request.attachments.length > 0 && (
                            <a href={request.attachments[0]} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                              <FileText className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {(() => {
                            let pdfUrl = null;
                            if (request.status === 'pending_manager' && (request.pdfUrl || request.pdf_url)) pdfUrl = request.pdfUrl || request.pdf_url;
                            else if (request.status === 'pending_hr' && request.pdf_request_manager) pdfUrl = request.pdf_request_manager;
                            else if ((request.status === 'pending_accounting' || request.status === 'approved') && (request.pdf_request_hr || request.pdf_request_manager)) pdfUrl = request.pdf_request_hr || request.pdf_request_manager;
                            if (pdfUrl) return <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-green-600"><FileText className="h-3.5 w-3.5" /></a>;
                            if (request.managerSignature || request.hrSignature) return <button onClick={() => downloadPDF(request.id)} className="text-blue-600"><FileText className="h-3.5 w-3.5" /></button>;
                            return null;
                          })()}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1 border-t">
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleViewDetails(request)}>
                          ดูรายละเอียด
                        </Button>
                        {request.status === 'pending_manager' && (
                          <>
                            <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleApprove(request.id)} disabled={isLoading}>
                              อนุมัติ
                            </Button>
                            <Button size="sm" variant="destructive" className="flex-1 h-8 text-xs" onClick={() => { setRejectionRequestId(request.id); setRejectionReason(''); setIsRejectionModalOpen(true); }} disabled={isLoading}>
                              ปฏิเสธ
                            </Button>
                            <Button size="sm" className="flex-1 h-8 text-xs bg-amber-500 hover:bg-amber-600" onClick={() => { setRevisionRequestId(request.id); setRevisionNote(''); setIsRevisionDialogOpen(true); }} disabled={isLoading}>
                              ขอเอกสารเพิ่ม
                            </Button>
                          </>
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
                      <TableHead>พนักงาน</TableHead>
                      <TableHead>แผนก</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>จำนวนเงิน</TableHead>
                      <TableHead>วันที่ยื่น</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-center">เอกสารแนบ</TableHead>
                      <TableHead className="text-center">PDF</TableHead>
                      <TableHead>การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          ไม่มีคำร้องสวัสดิการที่รอการอนุมัติ
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
                            <Badge
                              variant={
                                request.status === 'approved' ? 'default' :
                                request.status === 'pending_manager' ? 'secondary' :
                                request.status === 'pending_hr' ? 'outline' :
                                request.status === 'pending_accounting' ? 'outline' :
                                request.status.includes('rejected') ? 'destructive' : 'secondary'
                              }
                            >
                              {request.status === 'pending_executive' ? 'รอ Executive' :
                               request.status === 'pending_manager' ? 'รอผู้จัดการ' :
                               request.status === 'pending_hr' ? 'รอ HR' :
                               request.status === 'pending_accounting' ? 'รอบัญชี' :
                               request.status === 'approved' ? 'อนุมัติ' :
                               request.status === 'rejected_executive' ? 'ปฏิเสธโดย Executive' :
                               request.status === 'rejected_manager' ? 'ปฏิเสธโดยผู้จัดการ' :
                               request.status === 'rejected_hr' ? 'ปฏิเสธโดย HR' :
                               request.status === 'rejected_accounting' ? 'ปฏิเสธโดยบัญชี' :
                               request.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {request.attachments && request.attachments.length > 0 ? (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {request.attachments.map((file, idx) => (
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
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {(() => {
                              // เลือก PDF URL ตามสถานะ
                              let pdfUrl = null;
                              let pdfTitle = "ดู PDF เอกสาร";

                              if (request.status === 'pending_manager' && (request.pdfUrl || request.pdf_url)) {
                                pdfUrl = request.pdfUrl || request.pdf_url;
                                pdfTitle = "ดู PDF เอกสาร";
                              } else if (request.status === 'pending_hr' && request.pdf_request_manager) {
                                pdfUrl = request.pdf_request_manager;
                                pdfTitle = "ดู PDF ที่ Manager อนุมัติแล้ว";
                              } else if ((request.status === 'pending_accounting' || request.status === 'approved') && (request.pdf_request_hr || request.pdf_request_manager)) {
                                pdfUrl = request.pdf_request_hr || request.pdf_request_manager;
                                pdfTitle = request.pdf_request_hr ? "ดู PDF ที่ HR อนุมัติแล้ว" : "ดู PDF ที่ Manager อนุมัติแล้ว";
                              } else if (request.managerSignature || request.hrSignature) {
                                // ถ้ามีลายเซ็นให้ใช้ downloadPDF
                                return (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadPDF(request.id)}
                                    disabled={isPDFLoading}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    PDF
                                  </Button>
                                );
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(request)}
                              >
                                ดูรายละเอียด
                              </Button>
                              {request.status === 'pending_manager' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(request.id)}
                                    disabled={isLoading}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    อนุมัติ
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => { setRejectionRequestId(request.id); setRejectionReason(''); setIsRejectionModalOpen(true); }}
                                    disabled={isLoading}
                                  >
                                    ปฏิเสธ
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => { setRevisionRequestId(request.id); setRevisionNote(''); setIsRevisionDialogOpen(true); }}
                                    disabled={isLoading}
                                    className="bg-amber-500 hover:bg-amber-600"
                                  >
                                    <FileWarning className="h-4 w-4 mr-1" />
                                    ขอเอกสารเพิ่ม
                                  </Button>
                                </>
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
                <h3 className="font-semibold text-green-800 mb-2">คำร้องบัญชี</h3>
                <p className="text-sm text-green-600">รายการคำร้องเบิกเงินล่วงหน้าและเคลียร์ค่าใช้จ่ายที่รอการอนุมัติจากผู้จัดการ</p>
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
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-3">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">ไม่มีคำร้องบัญชีที่รอการอนุมัติ</div>
                ) : (
                  filteredRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-3 bg-white shadow-sm space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{request.userName}</p>
                          <p className="text-xs text-muted-foreground">{request.userDepartment || request.department_user || '-'}</p>
                        </div>
                        <Badge
                          variant={
                            request.status === 'pending_manager' ? 'secondary' :
                            request.status === 'pending_hr' ? 'outline' :
                            request.status === 'pending_accounting' ? 'outline' :
                            request.status.includes('rejected') ? 'destructive' : 'secondary'
                          }
                          className="text-[10px] shrink-0"
                        >
                          {request.status === 'pending_manager' ? 'รอผู้จัดการ' :
                           request.status === 'pending_hr' ? 'รอ HR' :
                           request.status === 'pending_accounting' ? 'รอบัญชี' :
                           request.status === 'approved' ? 'อนุมัติ' :
                           request.status === 'rejected_manager' ? 'ปฏิเสธ' :
                           request.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline" className="text-[10px]">{getWelfareTypeLabel(request.type)}</Badge>
                        <span className="font-bold text-blue-700">{request.amount ? `฿${request.amount.toLocaleString()}` : '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{format(new Date(request.date), 'dd/MM/yyyy')}</span>
                        <div className="flex items-center gap-1">
                          {request.attachments && request.attachments.length > 0 && (
                            <a href={request.attachments[0]} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                              <FileText className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {(() => {
                            let pdfUrl = null;
                            if (request.status === 'pending_manager' && (request.pdfUrl || request.pdf_url)) pdfUrl = request.pdfUrl || request.pdf_url;
                            else if (request.status === 'pending_hr' && request.pdf_request_manager) pdfUrl = request.pdf_request_manager;
                            else if ((request.status === 'pending_accounting' || request.status === 'approved') && (request.pdf_request_hr || request.pdf_request_manager)) pdfUrl = request.pdf_request_hr || request.pdf_request_manager;
                            if (pdfUrl) return <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-green-600"><FileText className="h-3.5 w-3.5" /></a>;
                            if (request.managerSignature || request.hrSignature) return <button onClick={() => downloadPDF(request.id)} className="text-blue-600"><FileText className="h-3.5 w-3.5" /></button>;
                            return null;
                          })()}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1 border-t">
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleViewDetails(request)}>
                          ดูรายละเอียด
                        </Button>
                        {request.status === 'pending_manager' && (
                          <>
                            <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleApprove(request.id)} disabled={isLoading}>
                              อนุมัติ
                            </Button>
                            <Button size="sm" variant="destructive" className="flex-1 h-8 text-xs" onClick={() => { setRejectionRequestId(request.id); setRejectionReason(''); setIsRejectionModalOpen(true); }} disabled={isLoading}>
                              ปฏิเสธ
                            </Button>
                            <Button size="sm" className="flex-1 h-8 text-xs bg-amber-500 hover:bg-amber-600" onClick={() => { setRevisionRequestId(request.id); setRevisionNote(''); setIsRevisionDialogOpen(true); }} disabled={isLoading}>
                              ขอเอกสารเพิ่ม
                            </Button>
                          </>
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
                      <TableHead>พนักงาน</TableHead>
                      <TableHead>แผนก</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>จำนวนเงิน</TableHead>
                      <TableHead>วันที่ยื่น</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-center">เอกสารแนบ</TableHead>
                      <TableHead className="text-center">PDF</TableHead>
                      <TableHead>การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          ไม่มีคำร้องบัญชีที่รอการอนุมัติ
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
                            <Badge
                              variant={
                                request.status === 'approved' ? 'default' :
                                request.status === 'pending_manager' ? 'secondary' :
                                request.status === 'pending_hr' ? 'outline' :
                                request.status === 'pending_accounting' ? 'outline' :
                                request.status.includes('rejected') ? 'destructive' : 'secondary'
                              }
                            >
                              {request.status === 'pending_executive' ? 'รอ Executive' :
                               request.status === 'pending_manager' ? 'รอผู้จัดการ' :
                               request.status === 'pending_hr' ? 'รอ HR' :
                               request.status === 'pending_accounting' ? 'รอบัญชี' :
                               request.status === 'approved' ? 'อนุมัติ' :
                               request.status === 'rejected_executive' ? 'ปฏิเสธโดย Executive' :
                               request.status === 'rejected_manager' ? 'ปฏิเสธโดยผู้จัดการ' :
                               request.status === 'rejected_hr' ? 'ปฏิเสธโดย HR' :
                               request.status === 'rejected_accounting' ? 'ปฏิเสธโดยบัญชี' :
                               request.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {request.attachments && request.attachments.length > 0 ? (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {request.attachments.map((file, idx) => (
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
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {(() => {
                              // เลือก PDF URL ตามสถานะ
                              let pdfUrl = null;
                              let pdfTitle = "ดู PDF เอกสาร";

                              if (request.status === 'pending_manager' && (request.pdfUrl || request.pdf_url)) {
                                pdfUrl = request.pdfUrl || request.pdf_url;
                                pdfTitle = "ดู PDF เอกสาร";
                              } else if (request.status === 'pending_hr' && request.pdf_request_manager) {
                                pdfUrl = request.pdf_request_manager;
                                pdfTitle = "ดู PDF ที่ Manager อนุมัติแล้ว";
                              } else if ((request.status === 'pending_accounting' || request.status === 'approved') && (request.pdf_request_hr || request.pdf_request_manager)) {
                                pdfUrl = request.pdf_request_hr || request.pdf_request_manager;
                                pdfTitle = request.pdf_request_hr ? "ดู PDF ที่ HR อนุมัติแล้ว" : "ดู PDF ที่ Manager อนุมัติแล้ว";
                              } else if (request.managerSignature || request.hrSignature) {
                                // ถ้ามีลายเซ็นให้ใช้ downloadPDF
                                return (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadPDF(request.id)}
                                    disabled={isPDFLoading}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    PDF
                                  </Button>
                                );
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(request)}
                              >
                                ดูรายละเอียด
                              </Button>
                              {request.status === 'pending_manager' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(request.id)}
                                    disabled={isLoading}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    อนุมัติ
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => { setRejectionRequestId(request.id); setRejectionReason(''); setIsRejectionModalOpen(true); }}
                                    disabled={isLoading}
                                  >
                                    ปฏิเสธ
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => { setRevisionRequestId(request.id); setRevisionNote(''); setIsRevisionDialogOpen(true); }}
                                    disabled={isLoading}
                                    className="bg-amber-500 hover:bg-amber-600"
                                  >
                                    <FileWarning className="h-4 w-4 mr-1" />
                                    ขอเอกสารเพิ่ม
                                  </Button>
                                </>
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
                    placeholder="ค้นหาพนักงาน..." 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                      <Filter className="mr-2 h-4 w-4" />
                      <span>กรองตามสถานะ, วันที่</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-4">
                      <h4 className="font-medium mb-2">ตัวกรอง</h4>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="สถานะ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                          <SelectItem value="pending_hr">รอ HR</SelectItem>
                          <SelectItem value="pending_accounting">รอบัญชี</SelectItem>
                          <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                          <SelectItem value="rejected_manager">ปฏิเสธโดยผู้จัดการ</SelectItem>
                          <SelectItem value="rejected_hr">ปฏิเสธโดย HR</SelectItem>
                          <SelectItem value="rejected_accounting">ปฏิเสธโดยบัญชี</SelectItem>
                        </SelectContent>
                      </Select>
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
                        {req.status === 'pending_hr' ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px] shrink-0">รอ HR</Badge>
                        ) : req.status === 'pending_accounting' ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] shrink-0">รอบัญชี</Badge>
                        ) : req.status === 'approved' ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] shrink-0">อนุมัติแล้ว</Badge>
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
                        <span>ดำเนินการ: {req.managerApprovedAt ? format(new Date(req.managerApprovedAt), 'dd/MM/yyyy') : req.updatedAt ? format(new Date(req.updatedAt), 'dd/MM/yyyy') : '-'}</span>
                      </div>
                      {(req.managerNotes || req.hrNotes || req.accountingNotes) && (
                        <div className="text-xs space-y-0.5 bg-gray-50 rounded p-2">
                          {req.managerNotes && <div><span className="font-medium">ผู้จัดการ:</span> {req.managerNotes}</div>}
                          {req.hrNotes && <div><span className="font-medium">HR:</span> {req.hrNotes}</div>}
                          {req.accountingNotes && <div><span className="font-medium">บัญชี:</span> {req.accountingNotes}</div>}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1 border-t">
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleViewDetails(req)}>
                          ดูรายละเอียด
                        </Button>
                        {(req.managerSignature || req.hrSignature) && (
                          <Button variant="outline" size="sm" className="h-8 text-xs text-blue-600" onClick={() => downloadPDF(req.id)} disabled={isPDFLoading}>
                            <FileText className="h-3.5 w-3.5 mr-1" /> PDF
                          </Button>
                        )}
                        {req.attachments && req.attachments.length > 0 && (
                          <a href={req.attachments[0]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 px-2 text-xs border rounded-md text-muted-foreground hover:text-foreground">
                            <FileText className="h-3.5 w-3.5" />
                          </a>
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
                      <TableHead>พนักงาน</TableHead>
                      <TableHead>แผนก</TableHead>
                      <TableHead>ประเภทสวัสดิการ</TableHead>
                      <TableHead>จำนวนเงิน</TableHead>
                      <TableHead>วันที่ยื่น</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>วันที่ดำเนินการ</TableHead>
                      <TableHead className="w-[200px]">หมายเหตุ</TableHead>
                      <TableHead className="text-center">เอกสารแนบ</TableHead>
                      <TableHead className="text-center">เอกสารการอนุมัติ</TableHead>
                      <TableHead>การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
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
                            {req.status === 'pending_hr' ? (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                รอ HR
                              </Badge>
                            ) : req.status === 'pending_accounting' ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                รอบัญชี
                              </Badge>
                            ) : req.status === 'approved' ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                อนุมัติแล้ว
                              </Badge>
                            ) : req.status === 'rejected_manager' ? (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                ปฏิเสธโดยผู้จัดการ
                              </Badge>
                            ) : req.status === 'rejected_hr' ? (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                ปฏิเสธโดย HR
                              </Badge>
                            ) : req.status === 'rejected_accounting' ? (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                ปฏิเสธโดยบัญชี
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                {req.status}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {req.managerApprovedAt ? format(new Date(req.managerApprovedAt), 'PP') :
                             req.updatedAt ? format(new Date(req.updatedAt), 'PP') : '-'}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <div className="text-sm space-y-1">
                              {req.managerNotes && (
                                <div>
                                  <span className="font-medium">ผู้จัดการ:</span> {req.managerNotes}
                                </div>
                              )}
                              {req.hrNotes && (
                                <div>
                                  <span className="font-medium">HR:</span> {req.hrNotes}
                                </div>
                              )}
                              {req.accountingNotes && (
                                <div>
                                  <span className="font-medium">บัญชี:</span> {req.accountingNotes}
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
                                  onClick={() => downloadPDF(req.id)}
                                  disabled={isPDFLoading}
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
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(req)}>ดูรายละเอียด</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="reports" className="space-y-6">
              {/* Report Filters */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาพนักงาน..."
                      className="pl-8 w-[180px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="เลือกพนักงาน" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">พนักงานทั้งหมด</SelectItem>
                      {Array.from(new Set(combinedRequests
                        .filter(req => {
                          if ((profile?.role === 'manager' || profile?.role === 'accountingandmanager') && teamMemberIds.length > 0) {
                            if (!req.userId) return false;
                            const userIdAsNumber = parseInt(req.userId, 10);
                            const userIdAsString = req.userId.toString();
                            return teamMemberIds.includes(userIdAsNumber) ||
                                   teamMemberIds.map(id => id.toString()).includes(userIdAsString) ||
                                   req.userId === profile?.employee_id?.toString();
                          }
                          return profile?.role === 'admin';
                        })
                        .map(req => req.userName)))
                        .sort()
                        .map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[220px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {reportDateRange?.from && reportDateRange?.to
                          ? `${format(reportDateRange.from, 'dd/MM/yy')} - ${format(reportDateRange.to, 'dd/MM/yy')}`
                          : <span>เลือกช่วงวันที่</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={reportDateRange ? { from: reportDateRange.from || undefined, to: reportDateRange.to || undefined } : undefined}
                        onSelect={(range) => setReportDateRange(range ? { from: range.from || null, to: range.to || null } : null)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {(searchTerm || selectedEmployee !== 'all' || reportDateRange) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedEmployee('all');
                        setReportDateRange(null);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      ล้างตัวกรอง
                    </Button>
                  )}
                </div>
                <Button
                  variant="default"
                  onClick={() => exportTeamReport()}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4" />
                  ส่งออกรายงาน
                </Button>
              </div>

              {/* Loading state for managers */}
              {(profile?.role === 'manager' || profile?.role === 'accountingandmanager') && teamMemberIds.length === 0 && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">กำลังโหลดข้อมูลทีม...</p>
                </div>
              )}

              {/* Show content only when team data is loaded or user is admin */}
              {(profile?.role === 'admin' || ((profile?.role === 'manager' || profile?.role === 'accountingandmanager') && teamMemberIds.length > 0)) && (
                <>
                  {/* Team Overview Cards - 4 columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white shadow-lg">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-sm font-medium">คำร้องทั้งหมด</p>
                            <p className="text-3xl font-bold mt-1">{getTeamReportData().totalRequests}</p>
                          </div>
                          <div className="bg-blue-400/30 p-3 rounded-full">
                            <FileText className="w-6 h-6" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white shadow-lg">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-emerald-100 text-sm font-medium">ยอดเงินรวม</p>
                            <p className="text-2xl font-bold mt-1">{getTeamReportData().totalAmount.toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })}</p>
                          </div>
                          <div className="bg-emerald-400/30 p-3 rounded-full">
                            <DollarSign className="w-6 h-6" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white shadow-lg">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-100 text-sm font-medium">จำนวนพนักงาน</p>
                            <p className="text-3xl font-bold mt-1">{getTeamReportData().activeMembers}</p>
                          </div>
                          <div className="bg-purple-400/30 p-3 rounded-full">
                            <Users className="w-6 h-6" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0 text-white shadow-lg">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-amber-100 text-sm font-medium">อัตราอนุมัติ</p>
                            <p className="text-3xl font-bold mt-1">{getTeamReportData().approvalRate}%</p>
                          </div>
                          <div className="bg-amber-400/30 p-3 rounded-full">
                            <TrendingUp className="w-6 h-6" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Status Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-500 text-sm">อนุมัติแล้ว</p>
                            <p className="text-2xl font-bold text-green-600">
                              {getTeamRequests().filter(req => ['approved', 'completed', 'pending_hr', 'pending_accounting'].includes(req.status)).length}
                            </p>
                          </div>
                          <div className="text-green-500 bg-green-50 p-2 rounded-full">
                            <Check className="w-5 h-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-500 text-sm">รอดำเนินการ</p>
                            <p className="text-2xl font-bold text-yellow-600">
                              {getTeamRequests().filter(req => req.status.includes('pending')).length}
                            </p>
                          </div>
                          <div className="text-yellow-500 bg-yellow-50 p-2 rounded-full">
                            <Clock className="w-5 h-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-500 text-sm">ปฏิเสธ</p>
                            <p className="text-2xl font-bold text-red-600">
                              {getTeamRequests().filter(req => req.status.includes('rejected')).length}
                            </p>
                          </div>
                          <div className="text-red-500 bg-red-50 p-2 rounded-full">
                            <X className="w-5 h-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Welfare Type Summary with Progress Bars */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        สรุปตามประเภทสวัสดิการ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getWelfareTypeSummary().length > 0 ? (
                        <div className="space-y-4">
                          {(() => {
                            const summary = getWelfareTypeSummary();
                            const maxAmount = Math.max(...summary.map(s => s.amount), 1);
                            const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-rose-500'];
                            return summary.map((item, index) => (
                              <div key={item.type} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                                    <span className="font-medium text-gray-700">{getWelfareTypeLabel(item.type)}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-bold text-gray-900">{item.amount.toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })}</span>
                                    <span className="text-gray-500 text-sm ml-2">({item.count} รายการ)</span>
                                  </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                  <div
                                    className={`h-2.5 rounded-full ${colors[index % colors.length]} transition-all duration-500`}
                                    style={{ width: `${(item.amount / maxAmount) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          ไม่มีข้อมูลในช่วงเวลาที่เลือก
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Individual Employee Report */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-600" />
                        รายงานรายบุคคล
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Mobile Card View */}
                      <div className="lg:hidden space-y-3">
                        {getIndividualEmployeeReport().map((employee) => (
                          <div key={employee.name} className="border rounded-lg p-3 bg-white shadow-sm space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-sm">{employee.name}</p>
                                <p className="text-xs text-muted-foreground">{employee.department}</p>
                              </div>
                              <span className="font-bold text-blue-600 text-sm">
                                {employee.totalAmount.toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">ทั้งหมด: <strong>{employee.totalRequests}</strong></span>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">{employee.approved} อนุมัติ</Badge>
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px]">{employee.pending} รอ</Badge>
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">{employee.rejected} ปฏิเสธ</Badge>
                            </div>
                          </div>
                        ))}
                        {getIndividualEmployeeReport().length > 0 && (
                          <div className="border-t-2 pt-2 px-1 flex items-center justify-between text-sm font-bold">
                            <span>รวมทั้งหมด ({getTeamReportData().totalRequests} รายการ)</span>
                            <span className="text-blue-700">{getTeamReportData().totalAmount.toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })}</span>
                          </div>
                        )}
                      </div>

                      {/* Desktop Table View */}
                      <div className="overflow-x-auto hidden lg:block">
                        <Table>
                          <TableHeader className="bg-gradient-to-r from-blue-600 to-blue-700 [&_th]:text-white">
                            <TableRow>
                              <TableHead className="font-semibold">พนักงาน</TableHead>
                              <TableHead className="font-semibold">แผนก</TableHead>
                              <TableHead className="text-center font-semibold">คำร้องทั้งหมด</TableHead>
                              <TableHead className="text-center font-semibold">อนุมัติ</TableHead>
                              <TableHead className="text-center font-semibold">รอดำเนินการ</TableHead>
                              <TableHead className="text-center font-semibold">ปฏิเสธ</TableHead>
                              <TableHead className="text-right font-semibold">ยอดรวม</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getIndividualEmployeeReport().map((employee, index) => (
                              <TableRow key={employee.name} className={index % 2 === 0 ? 'bg-gray-50/50' : ''}>
                                <TableCell className="font-medium">{employee.name}</TableCell>
                                <TableCell className="text-gray-600">{employee.department}</TableCell>
                                <TableCell className="text-center">
                                  <span className="font-semibold">{employee.totalRequests}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-semibold">
                                    {employee.approved}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 font-semibold">
                                    {employee.pending}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-semibold">
                                    {employee.rejected}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold text-blue-600">
                                  {employee.totalAmount.toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })}
                                </TableCell>
                              </TableRow>
                            ))}
                            {/* Total Row */}
                            {getIndividualEmployeeReport().length > 0 && (
                              <TableRow className="bg-gray-100 font-bold border-t-2">
                                <TableCell colSpan={2} className="text-right">รวมทั้งหมด</TableCell>
                                <TableCell className="text-center">{getTeamReportData().totalRequests}</TableCell>
                                <TableCell className="text-center text-green-700">
                                  {getTeamRequests().filter(req => ['approved', 'completed', 'pending_hr', 'pending_accounting'].includes(req.status)).length}
                                </TableCell>
                                <TableCell className="text-center text-yellow-700">
                                  {getTeamRequests().filter(req => req.status.includes('pending')).length}
                                </TableCell>
                                <TableCell className="text-center text-red-700">
                                  {getTeamRequests().filter(req => req.status.includes('rejected')).length}
                                </TableCell>
                                <TableCell className="text-right text-blue-700">
                                  {getTeamReportData().totalAmount.toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {getIndividualEmployeeReport().length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">ไม่พบข้อมูล</p>
                          <p className="text-sm">ไม่มีคำร้องในช่วงเวลาที่เลือก</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
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
                    selectedRequest.status === 'pending_manager' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                    selectedRequest.status === 'pending_hr' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                    selectedRequest.status === 'pending_accounting' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    selectedRequest.status.includes('rejected') ? 'bg-red-100 text-red-800 border-red-300' :
                    'bg-green-100 text-green-800 border-green-300'
                  }`}
                  variant="outline"
                >
                  {selectedRequest.status === 'pending_executive' ? 'รอ Executive' :
                   selectedRequest.status === 'pending_manager' ? 'รอผู้จัดการ' :
                   selectedRequest.status === 'pending_hr' ? 'รอ HR' :
                   selectedRequest.status === 'pending_accounting' ? 'รอบัญชี' :
                   selectedRequest.status === 'completed' ? 'อนุมัติแล้ว' :
                   selectedRequest.status === 'rejected_manager' ? 'ปฏิเสธโดยผู้จัดการ' :
                   selectedRequest.status === 'rejected_hr' ? 'ปฏิเสธโดย HR' :
                   selectedRequest.status === 'rejected_accounting' ? 'ปฏิเสธโดยบัญชี' :
                   selectedRequest.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>แผนก: <strong className="text-foreground">{selectedRequest.userDepartment || selectedRequest.department_user || '-'}</strong></span>
                <span>วันที่ยื่น: <strong className="text-foreground">{format(new Date(selectedRequest.date), 'dd/MM/yyyy')}</strong></span>
                <span>จำนวนเงิน: <strong className="text-blue-700 text-base">{selectedRequest.amount?.toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 })}</strong></span>
                {selectedRequest.runNumber && <span>เลขที่: <strong className="text-foreground">{selectedRequest.runNumber}</strong></span>}
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
            {selectedRequest.status === 'pending_manager' && (
              <div className="px-6 py-3 border-t bg-gray-50/80 rounded-b-lg flex-shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="กรุณาระบุเหตุผลการปฏิเสธ..."
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
                      disabled={isLoading || !rejectionReason}
                      className="px-6"
                    >
                      <X className="h-4 w-4 mr-2" />
                      ปฏิเสธ
                    </Button>
                    <Button
                      onClick={() => {
                        setRevisionRequestId(selectedRequest.id);
                        setRevisionNote('');
                        setIsRevisionDialogOpen(true);
                      }}
                      className="bg-amber-500 hover:bg-amber-600 px-4"
                      disabled={isLoading}
                    >
                      <FileWarning className="h-4 w-4 mr-2" />
                      ขอเอกสารเพิ่ม
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
            <DialogTitle>ยืนยันการปฏิเสธ</DialogTitle>
          </DialogHeader>
          <p>กรุณาระบุเหตุผลในการปฏิเสธคำร้อง</p>
          <Input
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="เหตุผลการปฏิเสธ..."
          />
          <DialogFooter>
            <Button onClick={confirmRejection} disabled={!rejectionReason}>ยืนยัน</Button>
            <Button variant="outline" onClick={() => setIsRejectionModalOpen(false)}>ยกเลิก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revision Request Dialog (ขอเอกสารเพิ่มเติม) */}
      <Dialog open={isRevisionDialogOpen} onOpenChange={(open) => { if (!open) { setIsRevisionDialogOpen(false); setRevisionNote(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ขอเอกสารเพิ่มเติม</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">กรุณาระบุเอกสารที่ต้องการให้พนักงานแนบเพิ่มเติม</p>
          <Textarea
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            placeholder="เช่น กรุณาแนบใบเสร็จรับเงิน, สำเนาบัตรประชาชน..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsRevisionDialogOpen(false); setRevisionNote(''); }}>ยกเลิก</Button>
            <Button
              onClick={handleRevisionRequest}
              disabled={!revisionNote.trim() || isLoading}
              className="bg-amber-500 hover:bg-amber-600"
            >
              ส่งคำขอเอกสาร
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Waiver Dialog (อนุโลมส่วนเกินค่าอบรม) */}
      <Dialog open={isWaiverDialogOpen} onOpenChange={(open) => { if (!open) setIsWaiverDialogOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ส่วนเกินค่าอบรม</DialogTitle>
          </DialogHeader>
          {pendingApprovalRequest && (
            <div className="space-y-4">
              {/* แสดงข้อมูลส่วนเกิน */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm space-y-1">
                <p><span className="font-medium">ค่าใช้จ่ายทั้งหมด:</span> {Number(pendingApprovalRequest.amount || 0).toLocaleString('th-TH')} บาท</p>
                <p><span className="font-medium">ส่วนเกินงบประมาณ:</span> <span className="text-red-600 font-semibold">{Number(pendingApprovalRequest.excess_amount || 0).toLocaleString('th-TH')} บาท</span></p>
                <p className="text-muted-foreground">ตามปกติ: บริษัทจ่าย {(Number(pendingApprovalRequest.excess_amount || 0) / 2).toLocaleString('th-TH')} / พนักงานจ่าย {(Number(pendingApprovalRequest.excess_amount || 0) / 2).toLocaleString('th-TH')}</p>
              </div>

              {/* ตัวเลือกการอนุโลม */}
              <div className="space-y-2">
                <Label className="font-medium">เลือกรูปแบบ</Label>
                <RadioGroup value={waiverType} onValueChange={(val) => setWaiverType(val as 'none' | 'full' | 'partial')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="waiver-none" />
                    <Label htmlFor="waiver-none">ตามปกติ (50/50) - บริษัทและพนักงานแบ่งจ่ายคนละครึ่ง</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="waiver-full" />
                    <Label htmlFor="waiver-full">บริษัทจ่ายส่วนเกินทั้งหมด</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partial" id="waiver-partial" />
                    <Label htmlFor="waiver-partial">กำหนดจำนวนเอง</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Input สำหรับ partial */}
              {waiverType === 'partial' && (
                <div className="space-y-2">
                  <Label htmlFor="waiver-amount">จำนวนเงินที่บริษัทจ่ายเพิ่ม (บาท)</Label>
                  <Input
                    id="waiver-amount"
                    type="number"
                    min={0}
                    max={Number(pendingApprovalRequest.excess_amount || 0) / 2}
                    value={waiverAmount || ''}
                    onChange={(e) => setWaiverAmount(Number(e.target.value))}
                    placeholder={`สูงสุด ${(Number(pendingApprovalRequest.excess_amount || 0) / 2).toLocaleString('th-TH')} บาท`}
                  />
                  <p className="text-xs text-muted-foreground">
                    บริษัทจ่ายรวม: {((Number(pendingApprovalRequest.excess_amount || 0) / 2) + Math.min(waiverAmount, Number(pendingApprovalRequest.excess_amount || 0) / 2)).toLocaleString('th-TH')} บาท
                    {' / '}
                    พนักงานจ่าย: {(Number(pendingApprovalRequest.excess_amount || 0) - ((Number(pendingApprovalRequest.excess_amount || 0) / 2) + Math.min(waiverAmount, Number(pendingApprovalRequest.excess_amount || 0) / 2))).toLocaleString('th-TH')} บาท
                  </p>
                </div>
              )}

              {/* แสดงสรุปเมื่อเลือก full */}
              {waiverType === 'full' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <p className="text-green-700">บริษัทจ่ายส่วนเกินทั้งหมด: <span className="font-semibold">{Number(pendingApprovalRequest.excess_amount || 0).toLocaleString('th-TH')} บาท</span></p>
                  <p className="text-green-700">พนักงานจ่าย: <span className="font-semibold">0 บาท</span></p>
                </div>
              )}

              {/* เหตุผล */}
              {waiverType !== 'none' && (
                <div className="space-y-2">
                  <Label htmlFor="waiver-reason">เหตุผลการอนุโลม</Label>
                  <Textarea
                    id="waiver-reason"
                    value={waiverReason}
                    onChange={(e) => setWaiverReason(e.target.value)}
                    placeholder="ระบุเหตุผลการอนุโลม..."
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWaiverDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleWaiverConfirm}>ยืนยันและลงลายเซ็น</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Popup */}
      <SignaturePopup
        isOpen={isSignaturePopupOpen}
        onClose={resetApprovalStates}
        onSave={handleSignatureComplete}
        title="ลงลายเซ็นอนุมัติ"
        approverName={profile?.display_name || user?.email || ''}
        requestDetails={
          pendingApprovalRequest
            ? `คำขอของ: ${pendingApprovalRequest.userName} (${getWelfareTypeLabel(pendingApprovalRequest.type)})`
            : undefined
        }
      />

      {/* Loading Popup */}
      <LoadingPopup open={isLoading} />
    </Layout>
  );
};