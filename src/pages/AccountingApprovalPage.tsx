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

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Filter, FileText, History, Clock, BarChart3, FileWarning } from 'lucide-react';
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

  // Revision request states (ขอเอกสารเพิ่มเติม)
  const [isRevisionDialogOpen, setIsRevisionDialogOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [revisionRequestId, setRevisionRequestId] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user || (!['accounting', 'accountingandmanager', 'admin'].includes(profile?.role))) {
      addNotification({
        userId: user?.id || 'system',
        title: 'ไม่มีสิทธิ์เข้าถึง',
        message: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้',
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

  const handleViewDetails = (request: WelfareRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
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
        title: 'สำเร็จ',
        message: 'ปฏิเสธคำร้องเรียบร้อยแล้ว',
        type: 'success' 
      });
      setSelectedRequests([]);
      setRejectionReason('');
      setIsRejectionModalOpen(false);
    } catch (error) {
      addNotification({ 
        userId: user.id, 
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถปฏิเสธบางคำร้องได้',
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
          title: 'สำเร็จ',
          message: `อนุมัติ ${pendingBulkApproval.length} คำร้องเรียบร้อยแล้ว พร้อมลายเซ็น`,
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
          title: 'สำเร็จ',
          message: 'อนุมัติคำร้องเรียบร้อยแล้ว พร้อมลายเซ็น',
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
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถอนุมัติคำร้องได้',
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
        title: 'สำเร็จ',
        message: 'ปฏิเสธคำร้องเรียบร้อยแล้ว',
        type: 'success' 
      });
      setIsModalOpen(false);
      setIsRejectionModalOpen(false);
    } catch (error) {
      addNotification({ 
        userId: user.id, 
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถปฏิเสธคำร้องได้',
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
          revision_requested_by: 'accounting',
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
      <h1 className="text-2xl font-bold mb-4">แดชบอร์ดอนุมัติคำร้อง (บัญชี)</h1>
      
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

              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-welfare-blue/100 [&_th]:text-white">
                    <TableRow>
                      <TableHead>พนักงาน</TableHead>
                      <TableHead>แผนก</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>จำนวนเงิน</TableHead>
                      <TableHead>วันที่ยื่น</TableHead>
                      <TableHead>ผู้จัดการอนุมัติ</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>เอกสารแนบ</TableHead>
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
                               request.status === 'pending_revision' ? 'รอเอกสารเพิ่มเติม' :
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
                            <div className="flex items-center space-x-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(request)}
                              >
                                ดูรายละเอียด
                              </Button>
                              {request.status === 'pending_accounting' && (
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
                                    onClick={() => {
                                      setSelectedRequests([request.id]);
                                      setIsRejectionModalOpen(true);
                                    }}
                                    disabled={isLoading}
                                  >
                                    ปฏิเสธ
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setRevisionRequestId(request.id);
                                      setRevisionNote('');
                                      setIsRevisionDialogOpen(true);
                                    }}
                                    disabled={isLoading}
                                    className="bg-amber-500 hover:bg-amber-600"
                                  >
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
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">ประวัติการอนุมัติ</h3>
                <p className="text-sm text-gray-600">รายการคำร้องบัญชีที่ได้รับการอนุมัติหรือปฏิเสธแล้ว</p>
              </div>
              
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

              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-welfare-blue/100 [&_th]:text-white">
                    <TableRow>
                      <TableHead>พนักงาน</TableHead>
                      <TableHead>แผนก</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>จำนวนเงิน</TableHead>
                      <TableHead>วันที่ยื่น</TableHead>
                      <TableHead>บัญชีดำเนินการ</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>เอกสารแนบ</TableHead>
                      <TableHead>การดำเนินการ</TableHead>
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
                               request.status === 'pending_revision' ? 'รอเอกสารเพิ่มเติม' :
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
            <DialogTitle>รายละเอียดคำร้อง</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">พนักงาน</label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.userName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">แผนก</label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.userDepartment || selectedRequest.department_user || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">ประเภท</label>
                  <p className="text-sm text-muted-foreground">{getWelfareTypeLabel(selectedRequest.type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">จำนวนเงิน</label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.amount ? `฿${selectedRequest.amount.toLocaleString()}` : '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">วันที่ยื่น</label>
                  <p className="text-sm text-muted-foreground">{format(new Date(selectedRequest.date), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">สถานะ</label>
                  <Badge variant="outline">{selectedRequest.status}</Badge>
                </div>
              </div>
              {selectedRequest.details && (
                <div>
                  <label className="text-sm font-medium">รายละเอียด</label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedRequest.details}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              ปิด
            </Button>
            {selectedRequest?.status === 'pending_accounting' && (
              <>
                <Button
                  onClick={() => handleApprove(selectedRequest.id)}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  อนุมัติ
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
                  ปฏิเสธ
                </Button>
                <Button
                  onClick={() => {
                    setRevisionRequestId(selectedRequest.id);
                    setRevisionNote('');
                    setIsRevisionDialogOpen(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-600"
                  disabled={isLoading}
                >
                  <FileWarning className="h-4 w-4 mr-2" />
                  ขอเอกสารเพิ่ม
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
            <DialogTitle>ปฏิเสธคำร้อง</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">เหตุผลในการปฏิเสธ</label>
              <Input
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="กรุณาระบุเหตุผลในการปฏิเสธ..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectionModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRejection}
              disabled={!rejectionReason || isLoading}
            >
              ยืนยันการปฏิเสธ
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
          <textarea
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            placeholder="เช่น กรุณาแนบใบเสร็จรับเงิน, สำเนาบัตรประชาชน..."
            rows={3}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
        onClose={() => {
          setIsSignaturePopupOpen(false);
          setPendingApprovalRequest(null);
          setPendingBulkApproval([]);
          setIsBulkApproval(false);
        }}
        onSave={handleSignatureComplete}
        title={isBulkApproval ? `อนุมัติ ${pendingBulkApproval.length} คำร้อง` : 'อนุมัติคำร้อง'}
        approverName={profile?.display_name || user?.email || ''}
        requestDetails={isBulkApproval
          ? `อนุมัติคำร้องบัญชี ${pendingBulkApproval.length} รายการ`
          : pendingApprovalRequest ? `${pendingApprovalRequest.userName} - ${getWelfareTypeLabel(pendingApprovalRequest.type)} ฿${pendingApprovalRequest.amount?.toLocaleString() || '0'}` : undefined
        }
      />
    </Layout>
  );
};