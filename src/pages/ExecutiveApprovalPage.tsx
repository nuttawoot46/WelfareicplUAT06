import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWelfare } from '@/context/WelfareContext';
import { WelfareRequest } from '@/types';
import { useNotification } from '../context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Filter, FileText, History, Clock, Check, X, FileWarning } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SignaturePopup } from '@/components/signature/SignaturePopup';
import { usePDFOperations } from '@/hooks/usePDFOperations';
import LoadingPopup from '@/components/forms/LoadingPopup';
import { getWelfareTypeLabel } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { sendLineNotification } from '@/services/lineApi';

export const ExecutiveApprovalPage = () => {
  const { user, profile, loading: isAuthLoading } = useAuth();
  const { addNotification } = useNotification();
  const { welfareRequests: allRequests, refreshRequests } = useWelfare();
  const { downloadPDF, isLoading: isPDFLoading } = usePDFOperations();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WelfareRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionRequestId, setRejectionRequestId] = useState<number | null>(null);

  // Revision request states (ขอเอกสารเพิ่มเติม)
  const [isRevisionDialogOpen, setIsRevisionDialogOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [revisionRequestId, setRevisionRequestId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [isSignaturePopupOpen, setIsSignaturePopupOpen] = useState(false);
  const [pendingApprovalRequest, setPendingApprovalRequest] = useState<WelfareRequest | null>(null);
  const [activeTab, setActiveTab] = useState('pending');

  // Cleanup function to reset states
  const resetApprovalStates = () => {
    setPendingApprovalRequest(null);
    setIsSignaturePopupOpen(false);
  };

  // Filter requests assigned to this executive
  const executiveRequests = useMemo(() => {
    if (!profile?.employee_id) return [];
    return allRequests.filter(
      req => req.executiveId && String(req.executiveId) === String(profile.employee_id)
    );
  }, [allRequests, profile?.employee_id]);

  // Filter for pending tab
  const pendingRequests = useMemo(() => {
    let base = executiveRequests.filter(req => req.status === 'pending_executive');

    if (searchTerm) {
      base = base.filter(req =>
        req.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (dateFilter) {
      base = base.filter(req =>
        format(new Date(req.date), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd')
      );
    }

    return base.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [executiveRequests, searchTerm, dateFilter]);

  // Filter for history tab
  const historyRequests = useMemo(() => {
    const processedStatuses = [
      'pending_manager',
      'pending_accounting',
      'pending_hr',
      'completed',
      'rejected_executive',
      'rejected_manager',
      'rejected_hr',
      'rejected_accounting',
    ];
    let base = executiveRequests.filter(req => processedStatuses.includes(req.status));

    if (searchTerm) {
      base = base.filter(req =>
        req.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (dateFilter) {
      base = base.filter(req =>
        format(new Date(req.date), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd')
      );
    }

    return base.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [executiveRequests, searchTerm, dateFilter]);

  // Get the list being displayed based on active tab
  const displayedRequests = activeTab === 'pending' ? pendingRequests : historyRequests;

  const handleViewDetails = (request: WelfareRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  // Individual approve - opens signature popup
  const handleApprove = (requestId: number) => {
    if (!user) return;
    const request = executiveRequests.find(req => req.id === requestId);
    if (!request) return;

    setPendingApprovalRequest(request);
    setIsSignaturePopupOpen(true);
    setIsModalOpen(false);
  };

  // Signature completed - execute approval
  const handleSignatureComplete = async (signature: string) => {
    if (!user || !pendingApprovalRequest) return;

    setIsLoading(true);
    try {
      const currentDateTime = new Date().toISOString();

      const { error } = await supabase
        .from('welfare_requests')
        .update({
          status: 'pending_manager',
          executive_approver_id: profile?.employee_id,
          executive_approver_name: profile?.display_name || user.email,
          executive_approver_position: profile?.position || '',
          executive_approved_at: currentDateTime,
          executive_signature: signature,
          updated_at: currentDateTime,
        })
        .eq('id', pendingApprovalRequest.id);

      if (error) {
        console.error('Error updating request:', error);
        throw error;
      }

      addNotification({
        userId: user.id,
        title: 'สำเร็จ',
        message: 'อนุมัติคำร้องสำเร็จ พร้อมลายเซ็น ส่งต่อไปผู้จัดการ',
        type: 'success',
      });

      // Send LINE notification
      try {
        const { data: employeeData } = await supabase
          .from('Employee')
          .select('email_user')
          .eq('id', pendingApprovalRequest.userId)
          .single();

        if (employeeData?.email_user) {
          await sendLineNotification({
            employeeEmail: employeeData.email_user,
            type: getWelfareTypeLabel(pendingApprovalRequest.type),
            status: 'รอผู้จัดการอนุมัติ',
            amount: Number(pendingApprovalRequest.amount) || 0,
            userName: pendingApprovalRequest.userName,
            requestDate: new Date().toLocaleString('th-TH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          });
        }
      } catch (lineError) {
        console.error('LINE notification error:', lineError);
      }

      await refreshRequests(true);

      // Reset states
      setPendingApprovalRequest(null);
      setIsSignaturePopupOpen(false);
    } catch (error) {
      console.error('Error in handleSignatureComplete:', error);
      addNotification({
        userId: user.id,
        title: 'เกิดข้อผิดพลาด',
        message: 'อนุมัติคำร้องล้มเหลว',
        type: 'error',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Individual reject from detail modal
  const handleReject = async (requestId: number, comment: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('welfare_requests')
        .update({
          status: 'rejected_executive',
          executive_approver_id: profile?.employee_id,
          executive_approver_name: profile?.display_name || user.email,
          executive_approved_at: new Date().toISOString(),
          manager_notes: comment,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting request:', error);
        throw error;
      }

      addNotification({
        userId: user.id,
        title: 'สำเร็จ',
        message: 'ปฏิเสธคำร้องสำเร็จ',
        type: 'success',
      });

      await refreshRequests(true);
      setIsModalOpen(false);
      setRejectionReason('');
    } catch (error) {
      addNotification({
        userId: user.id,
        title: 'เกิดข้อผิดพลาด',
        message: 'ปฏิเสธคำร้องล้มเหลว',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Single rejection confirmation
  const confirmRejection = async () => {
    if (!rejectionRequestId || !rejectionReason || !user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('welfare_requests')
        .update({
          status: 'rejected_executive',
          executive_approver_id: profile?.employee_id,
          executive_approver_name: profile?.display_name || user.email,
          executive_approved_at: new Date().toISOString(),
          manager_notes: rejectionReason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rejectionRequestId);

      if (error) throw error;

      addNotification({
        userId: user.id,
        title: 'สำเร็จ',
        message: 'ปฏิเสธคำร้องสำเร็จ',
        type: 'success',
      });

      await refreshRequests();
      setRejectionReason('');
      setRejectionRequestId(null);
      setIsRejectionModalOpen(false);
    } catch (error) {
      addNotification({
        userId: user.id,
        title: 'เกิดข้อผิดพลาด',
        message: 'ปฏิเสธคำร้องล้มเหลว',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Revision request handler (ขอเอกสารเพิ่มเติม)
  const handleRevisionRequest = async () => {
    if (!revisionRequestId || !revisionNote.trim()) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('welfare_requests')
        .update({
          status: 'pending_revision',
          revision_requested_by: 'executive',
          revision_note: revisionNote.trim(),
          revision_requested_at: new Date().toISOString(),
        } as any)
        .eq('id', revisionRequestId);

      if (error) throw error;

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

      await refreshRequests();
      setIsRevisionDialogOpen(false);
      setRevisionNote('');
      setRevisionRequestId(null);
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

  // Status badge renderer
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_executive':
        return (
          <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
            รอ Executive
          </Badge>
        );
      case 'pending_manager':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            รอผู้จัดการ
          </Badge>
        );
      case 'pending_accounting':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            รอบัญชี
          </Badge>
        );
      case 'pending_hr':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            รอ HR
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            อนุมัติ
          </Badge>
        );
      case 'rejected_executive':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            ปฏิเสธโดย Executive
          </Badge>
        );
      case 'rejected_manager':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            ปฏิเสธโดยผู้จัดการ
          </Badge>
        );
      case 'rejected_hr':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            ปฏิเสธโดย HR
          </Badge>
        );
      case 'rejected_accounting':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            ปฏิเสธโดยบัญชี
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // PDF URL resolver
  const renderPdfCell = (request: WelfareRequest) => {
    let pdfUrl: string | null | undefined = null;
    let pdfTitle = 'ดู PDF เอกสาร';

    if (request.pdfUrl || request.pdf_url) {
      pdfUrl = request.pdfUrl || request.pdf_url;
      pdfTitle = 'ดู PDF เอกสาร';
    } else if (request.pdf_request_manager) {
      pdfUrl = request.pdf_request_manager;
      pdfTitle = 'ดู PDF ที่ Manager อนุมัติแล้ว';
    } else if (request.pdf_request_hr) {
      pdfUrl = request.pdf_request_hr;
      pdfTitle = 'ดู PDF ที่ HR อนุมัติแล้ว';
    }

    if (pdfUrl) {
      return (
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
      );
    }

    if (request.managerSignature || request.hrSignature || request.executiveSignature) {
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

    return <span className="text-muted-foreground text-sm">-</span>;
  };

  // Loading states
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
            <span>แดชบอร์ดอนุมัติคำร้อง</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1 rounded-lg gap-1">
              <TabsTrigger value="pending" className="flex items-center gap-2 bg-gray-200 text-gray-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white shadow-md transition-all">
                <Clock className="h-4 w-4" />
                รอการอนุมัติ
                {pendingRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] text-center">
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2 bg-gray-200 text-gray-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white shadow-md transition-all">
                <History className="h-4 w-4" />
                ประวัติ
              </TabsTrigger>
            </TabsList>

            {/* Pending Tab */}
            <TabsContent value="pending" className="space-y-4">
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="font-semibold text-orange-800 mb-2">คำร้องรอ Executive อนุมัติ</h3>
                <p className="text-sm text-orange-600">
                  รายการคำร้องเบิกเงินทดลอง/เคลียร์ค่าใช้จ่ายจากพนักงานในทีมของคุณ ที่รอการอนุมัติจาก Executive
                </p>
              </div>

              <div className="flex items-center justify-between">
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
                        <span>กรองตามวันที่</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-4">
                        <h4 className="font-medium mb-2">ตัวกรอง</h4>
                        <div className="mt-4">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
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

              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-welfare-blue/100 [&_th]:text-white">
                    <TableRow>
                      <TableHead>พนักงาน</TableHead>
                      <TableHead>แผนก</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>จำนวนเงิน</TableHead>
                      <TableHead>วันที่ยื่น</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-center">PDF</TableHead>
                      <TableHead>การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          ไม่มีคำร้องที่รอการอนุมัติ
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.userName}</TableCell>
                          <TableCell>{request.userDepartment || request.department_user || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getWelfareTypeLabel(request.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {request.amount ? `฿${request.amount.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell>{format(new Date(request.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{renderStatusBadge(request.status)}</TableCell>
                          <TableCell className="text-center">
                            {renderPdfCell(request)}
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
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* History Tab */}
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
                      <span>กรองตามวันที่</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-4">
                      <h4 className="font-medium mb-2">ตัวกรอง</h4>
                      <div className="mt-4">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
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

              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-welfare-blue/100 [&_th]:text-white">
                    <TableRow>
                      <TableHead>พนักงาน</TableHead>
                      <TableHead>แผนก</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>จำนวนเงิน</TableHead>
                      <TableHead>วันที่ยื่น</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>วันที่ดำเนินการ</TableHead>
                      <TableHead className="text-center">PDF</TableHead>
                      <TableHead>การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          ไม่มีประวัติการอนุมัติ
                        </TableCell>
                      </TableRow>
                    ) : (
                      historyRequests.map((request, index) => (
                        <TableRow key={`${request.id}-${index}`}>
                          <TableCell className="font-medium">{request.userName}</TableCell>
                          <TableCell>{request.userDepartment || request.department_user || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getWelfareTypeLabel(request.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {request.amount
                              ? request.amount.toLocaleString('th-TH', {
                                  style: 'currency',
                                  currency: 'THB',
                                  minimumFractionDigits: 2,
                                })
                              : '-'}
                          </TableCell>
                          <TableCell>{format(new Date(request.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{renderStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            {request.executiveApprovedAt
                              ? format(new Date(request.executiveApprovedAt), 'dd/MM/yyyy')
                              : request.updatedAt
                                ? format(new Date(request.updatedAt), 'dd/MM/yyyy')
                                : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {renderPdfCell(request)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(request)}
                            >
                              ดูรายละเอียด
                            </Button>
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

      {/* Detail Modal */}
      {selectedRequest && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
            {/* Header สรุปข้อมูล */}
            <div className="px-6 pt-6 pb-3 border-b bg-gray-50/80 rounded-t-lg flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <DialogHeader className="p-0 space-y-0">
                  <DialogTitle className="text-lg">{selectedRequest.userName} — {getWelfareTypeLabel(selectedRequest.type)}</DialogTitle>
                </DialogHeader>
                {renderStatusBadge(selectedRequest.status)}
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
                const pdfUrl = selectedRequest.pdfUrl || selectedRequest.pdf_url || selectedRequest.pdf_request_manager || selectedRequest.pdf_request_hr;
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
            {selectedRequest.status === 'pending_executive' && (
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

      {/* Rejection Modal */}
      <Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการปฏิเสธ</DialogTitle>
          </DialogHeader>
          <p>กรุณาระบุเหตุผลในการปฏิเสธคำร้อง</p>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="เหตุผลการปฏิเสธ..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectionModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={confirmRejection}
              disabled={!rejectionReason || isLoading}
              variant="destructive"
            >
              ยืนยันปฏิเสธ
            </Button>
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
