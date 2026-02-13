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
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Filter, FileText, History, Clock } from 'lucide-react';
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

  // Cleanup function to reset states
  const resetApprovalStates = () => {
    setPendingApprovalRequest(null);
    setPendingBulkApproval([]);
    setIsBulkApproval(false);
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

  const handleSelectRequest = (requestId: number) => {
    setSelectedRequests(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      const selectableIds = pendingRequests.map(req => req.id);
      setSelectedRequests(selectableIds);
    } else {
      setSelectedRequests([]);
    }
  };

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
    setIsBulkApproval(false);
    setIsSignaturePopupOpen(true);
    setIsModalOpen(false);
  };

  // Bulk approve - opens signature popup
  const handleBulkApprove = () => {
    if (selectedRequests.length === 0 || !user) return;

    const requestsToApprove = pendingRequests.filter(
      req => selectedRequests.includes(req.id) && req.status === 'pending_executive'
    );

    if (requestsToApprove.length === 0) {
      addNotification({
        userId: user.id,
        title: 'แจ้งเตือน',
        message: 'ไม่มีคำร้องที่เลือกสำหรับอนุมัติ',
        type: 'info',
      });
      return;
    }

    setPendingBulkApproval(requestsToApprove);
    setIsBulkApproval(true);
    setIsSignaturePopupOpen(true);
  };

  // Bulk reject - opens rejection modal
  const handleBulkReject = () => {
    if (selectedRequests.length === 0) return;
    setIsRejectionModalOpen(true);
  };

  // Signature completed - execute approval
  const handleSignatureComplete = async (signature: string) => {
    if (!user || (!pendingApprovalRequest && pendingBulkApproval.length === 0)) return;

    setIsLoading(true);
    try {
      const currentDateTime = new Date().toISOString();

      if (isBulkApproval && pendingBulkApproval.length > 0) {
        // Bulk approval
        for (const req of pendingBulkApproval) {
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
            .eq('id', req.id);

          if (error) {
            console.error('Error updating request:', error);
            throw error;
          }
        }

        addNotification({
          userId: user.id,
          title: 'สำเร็จ',
          message: `อนุมัติ ${pendingBulkApproval.length} คำร้องสำเร็จ พร้อมลายเซ็น ส่งต่อไปผู้จัดการ`,
          type: 'success',
        });

        // Send LINE notifications
        for (const req of pendingBulkApproval) {
          try {
            const { data: employeeData } = await supabase
              .from('Employee')
              .select('email_user')
              .eq('id', req.userId)
              .single();

            if (employeeData?.email_user) {
              await sendLineNotification({
                employeeEmail: employeeData.email_user,
                type: getWelfareTypeLabel(req.type),
                status: 'รอผู้จัดการอนุมัติ',
                amount: Number(req.amount) || 0,
                userName: req.userName,
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
        }

        await refreshRequests(true);

        // Reset states
        setPendingBulkApproval([]);
        setIsBulkApproval(false);
        setIsSignaturePopupOpen(false);
        setSelectedRequests([]);
      } else if (pendingApprovalRequest) {
        // Individual approval
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
      }
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

  // Bulk rejection confirmation
  const confirmBulkRejection = async () => {
    if (selectedRequests.length === 0 || !rejectionReason || !user) return;
    setIsLoading(true);
    try {
      const requestsToReject = pendingRequests.filter(
        req => selectedRequests.includes(req.id) && req.status === 'pending_executive'
      );

      if (requestsToReject.length === 0) {
        addNotification({
          userId: user.id,
          title: 'แจ้งเตือน',
          message: 'ไม่มีคำร้องที่เลือกสำหรับปฏิเสธ',
          type: 'info',
        });
        setIsLoading(false);
        setIsRejectionModalOpen(false);
        return;
      }

      for (const req of requestsToReject) {
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
          .eq('id', req.id);

        if (error) {
          console.error('Error rejecting request:', error);
          throw error;
        }
      }

      addNotification({
        userId: user.id,
        title: 'สำเร็จ',
        message: `ปฏิเสธ ${requestsToReject.length} คำร้องสำเร็จ`,
        type: 'success',
      });

      await refreshRequests(true);
      setSelectedRequests([]);
      setRejectionReason('');
      setIsRejectionModalOpen(false);
    } catch (error) {
      addNotification({
        userId: user.id,
        title: 'เกิดข้อผิดพลาด',
        message: 'ปฏิเสธคำร้องบางรายการล้มเหลว',
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
            <span>แดชบอร์ดอนุมัติคำร้อง (Marketing Executive)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                รอการอนุมัติ
                {pendingRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-orange-100 text-orange-700">
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
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
                <div className="space-x-2">
                  <Button
                    onClick={handleBulkApprove}
                    disabled={selectedRequests.length === 0 || isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    อนุมัติ ({selectedRequests.length})
                  </Button>
                  <Button
                    onClick={handleBulkReject}
                    disabled={selectedRequests.length === 0 || isLoading}
                    variant="destructive"
                  >
                    ปฏิเสธ ({selectedRequests.length})
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
                            pendingRequests.length > 0 &&
                            selectedRequests.length === pendingRequests.length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
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
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          ไม่มีคำร้องที่รอการอนุมัติ
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedRequests.includes(request.id)}
                              onCheckedChange={() => handleSelectRequest(request.id)}
                            />
                          </TableCell>
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>รายละเอียดคำร้อง</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <p><strong>พนักงาน:</strong> {selectedRequest.userName}</p>
              <p><strong>แผนก:</strong> {selectedRequest.userDepartment || selectedRequest.department_user || '-'}</p>
              <p><strong>ประเภท:</strong> {getWelfareTypeLabel(selectedRequest.type)}</p>
              <p>
                <strong>จำนวนเงิน:</strong>{' '}
                {selectedRequest.amount?.toLocaleString('th-TH', {
                  style: 'currency',
                  currency: 'THB',
                })}
              </p>
              <p><strong>วันที่ยื่น:</strong> {format(new Date(selectedRequest.date), 'PPP')}</p>
              <p><strong>สถานะ:</strong> {renderStatusBadge(selectedRequest.status)}</p>
              {selectedRequest.runNumber && (
                <p><strong>เลขที่เอกสาร:</strong> {selectedRequest.runNumber}</p>
              )}
              <p><strong>รายละเอียด:</strong> {selectedRequest.details || '-'}</p>

              {/* Attachments */}
              <p>
                <strong>เอกสารแนบ:</strong>{' '}
                {selectedRequest.attachments && selectedRequest.attachments.length > 0 ? (
                  <span className="flex flex-wrap gap-2">
                    {selectedRequest.attachments.map((file, idx) => (
                      <a
                        key={idx}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        <span>ไฟล์ {idx + 1}</span>
                      </a>
                    ))}
                  </span>
                ) : (
                  'ไม่มีเอกสารแนบ'
                )}
              </p>

              {/* PDF link */}
              {(selectedRequest.pdfUrl || selectedRequest.pdf_url) && (
                <p>
                  <strong>PDF:</strong>{' '}
                  <a
                    href={selectedRequest.pdfUrl || selectedRequest.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    ดูเอกสาร PDF
                  </a>
                </p>
              )}

              {/* Rejection reason input (only for pending requests) */}
              {selectedRequest.status === 'pending_executive' && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">เหตุผลการปฏิเสธ (ถ้ามี):</p>
                  <Textarea
                    placeholder="ระบุเหตุผลการปฏิเสธ..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              {selectedRequest.status === 'pending_executive' && (
                <>
                  <Button
                    onClick={() => handleApprove(selectedRequest.id)}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isLoading}
                  >
                    อนุมัติ
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(selectedRequest.id, rejectionReason)}
                    disabled={isLoading}
                  >
                    ปฏิเสธ
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Rejection Modal */}
      <Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการปฏิเสธ</DialogTitle>
          </DialogHeader>
          <p>กรุณาระบุเหตุผลในการปฏิเสธคำร้องที่เลือก ({selectedRequests.length} รายการ)</p>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="เหตุผลการปฏิเสธ..."
            rows={3}
          />
          <DialogFooter>
            <Button
              onClick={confirmBulkRejection}
              disabled={!rejectionReason || isLoading}
            >
              ยืนยัน
            </Button>
            <Button variant="outline" onClick={() => setIsRejectionModalOpen(false)}>
              ยกเลิก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Popup */}
      <SignaturePopup
        isOpen={isSignaturePopupOpen}
        onClose={resetApprovalStates}
        onSave={handleSignatureComplete}
        title={
          isBulkApproval
            ? `ลงลายเซ็นอนุมัติ (${pendingBulkApproval.length} คำขอ)`
            : 'ลงลายเซ็นอนุมัติ'
        }
        approverName={profile?.display_name || user?.email || ''}
        requestDetails={
          isBulkApproval
            ? `คำขอที่จะอนุมัติ: ${pendingBulkApproval.map(req => `${req.userName} (${getWelfareTypeLabel(req.type)})`).join(', ')}`
            : pendingApprovalRequest
              ? `คำขอของ: ${pendingApprovalRequest.userName} (${getWelfareTypeLabel(pendingApprovalRequest.type)})`
              : undefined
        }
      />

      {/* Loading Popup */}
      <LoadingPopup open={isLoading} />
    </Layout>
  );
};
