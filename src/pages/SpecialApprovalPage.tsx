import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, XCircle, Clock, FileText, Search, Filter } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Layout } from '@/components/layout/Layout';
import { SignaturePopup } from '@/components/signature/SignaturePopup';
import { format } from 'date-fns';
import { getWelfareTypeLabel } from '@/lib/utils';
import {
  getSpecialApprovalRequests,
  approveSpecialRequest,
  rejectSpecialRequest,
  isSpecialApprover,
  SpecialApprovalRequest
} from '@/services/specialApprovalApi';

export default function SpecialApprovalPage() {
  const { user, profile, loading: isAuthLoading } = useAuth();
  const { addNotification } = useNotification();
  const { toast } = useToast();
  const [requests, setRequests] = useState<SpecialApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<SpecialApprovalRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [isSignaturePopupOpen, setIsSignaturePopupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user is authorized
  const isAuthorized = user?.email && isSpecialApprover(user.email, profile?.role);

  useEffect(() => {
    if (isAuthorized) {
      fetchRequests();
    }
  }, [isAuthorized]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getSpecialApprovalRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      addNotification({
        userId: user?.id || 'system',
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถโหลดข้อมูลคำร้องได้',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    if (!user?.email) return;

    // Set pending request and open signature popup
    const request = requests.find(req => req.id === requestId);
    if (request) {
      setSelectedRequest(request);
      setIsSignaturePopupOpen(true);
    }
  };

  const handleSignatureComplete = async (signature: string) => {
    if (!selectedRequest || !user?.email) return;

    try {
      setProcessingId(selectedRequest.id);
      console.log('Starting special approval with signature...');
      
      await approveSpecialRequest(selectedRequest.id, user.id, user.name || user.email, signature);
      
      console.log('Special approval completed successfully');
      
      addNotification({
        userId: user.id,
        title: 'อนุมัติสำเร็จ',
        message: 'คำร้องได้รับการอนุมัติแล้ว และส่งต่อไปยังแผนกบัญชี',
        type: 'success',
      });

      // Refresh the list
      await fetchRequests();
      setIsModalOpen(false);
      setIsSignaturePopupOpen(false);
    } catch (error: any) {
      console.error('Error approving request:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details
      });
      
      const errorMessage = error?.message || 'ไม่สามารถอนุมัติคำร้องได้';
      
      addNotification({
        userId: user.id,
        title: 'เกิดข้อผิดพลาด',
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    if (!user?.email || !rejectReason?.trim()) {
      addNotification({
        userId: user?.id || 'system',
        title: 'กรุณาระบุเหตุผล',
        message: 'กรุณาระบุเหตุผลในการปฏิเสธคำร้อง',
        type: 'error',
      });
      return;
    }

    try {
      setProcessingId(requestId);
      await rejectSpecialRequest(
        requestId,
        user.id,
        user.name || user.email,
        rejectReason
      );
      
      addNotification({
        userId: user.id,
        title: 'ปฏิเสธสำเร็จ',
        message: 'คำร้องได้รับการปฏิเสธแล้ว',
        type: 'success',
      });

      // Clear reject form and refresh
      setRejectReason('');
      setIsRejectionModalOpen(false);
      setIsModalOpen(false);
      await fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      addNotification({
        userId: user.id,
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถปฏิเสธคำร้องได้',
        type: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = (request: SpecialApprovalRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const filteredRequests = requests.filter(request => 
    searchTerm === '' || request.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (!isAuthorized) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              คุณไม่มีสิทธิ์เข้าถึงหน้านี้ หน้านี้สำหรับผู้อนุมัติพิเศษ (kanin.s@icpladda.com) และ Admin เท่านั้น
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลด...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Card>
        <CardHeader>
          <CardTitle>การอนุมัติพิเศษ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-2">คำร้องที่มีจำนวนเงินเกิน 10,000 บาท</h3>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="ค้นหาตามชื่อพนักงาน..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-welfare-blue/100 [&_th]:text-white">
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>หลักสูตร</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Submission Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <FileText className="h-12 w-12 mb-4 opacity-50" />
                        <p>ไม่มีคำร้องที่รอการอนุมัติพิเศษ</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.employee_name}</TableCell>
                      <TableCell>{getWelfareTypeLabel(request.type)}</TableCell>
                      <TableCell>{request.course_name || 'การอบรม'}</TableCell>
                      <TableCell>
                        <span className="text-lg font-bold text-red-600">
                          ฿{request.amount.toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(request.created_at), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          <Clock className="h-3 w-3 mr-1" />
                          รอการอนุมัติพิเศษ
                        </Badge>
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
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={processingId === request.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {processingId === request.id ? 'กำลังอนุมัติ...' : 'อนุมัติ'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Request Details Modal */}
      {selectedRequest && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>รายละเอียดคำร้องพิเศษ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  คำร้องนี้ต้องการการอนุมัติพิเศษเนื่องจากจำนวนเงินเกิน 10,000 บาท
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">พนักงาน:</p>
                  <p className="text-sm">{selectedRequest.employee_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">หลักสูตร:</p>
                  <p className="text-sm">{selectedRequest.course_name || 'การอบรม'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">จำนวนเงิน:</p>
                  <p className="text-lg font-bold text-red-600">
                    ฿{selectedRequest.amount.toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">วันที่ส่งคำร้อง:</p>
                  <p className="text-sm">{format(new Date(selectedRequest.created_at), 'dd/MM/yyyy HH:mm')}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium mb-2">เหตุผลในการปฏิเสธ (หากมี):</p>
                <Textarea 
                  placeholder="กรุณาระบุเหตุผลในการปฏิเสธคำร้อง..." 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => handleApprove(selectedRequest.id)}
                disabled={processingId === selectedRequest.id}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {processingId === selectedRequest.id ? 'กำลังอนุมัติ...' : 'อนุมัติ'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsRejectionModalOpen(true)}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                ปฏิเสธ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Rejection Confirmation Modal */}
      <Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการปฏิเสธ</DialogTitle>
          </DialogHeader>
          <p>คุณแน่ใจหรือไม่ที่จะปฏิเสธคำร้องนี้?</p>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => selectedRequest && handleReject(selectedRequest.id)}
              disabled={processingId === selectedRequest?.id || !rejectReason.trim()}
            >
              {processingId === selectedRequest?.id ? 'กำลังปฏิเสธ...' : 'ยืนยันปฏิเสธ'}
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
        onClose={() => {
          setIsSignaturePopupOpen(false);
          setSelectedRequest(null);
        }}
        onSave={handleSignatureComplete}
        title="ลงลายเซ็นอนุมัติพิเศษ - กรรมการผู้จัดการ"
        approverName={profile?.display_name || user?.email || ''}
      />
    </Layout>
  );
}