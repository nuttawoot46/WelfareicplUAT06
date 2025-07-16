// ฟังก์ชัน export CSV ที่รองรับภาษาไทย (UTF-8 BOM)
const exportToCSV = (data: WelfareRequestItem[], filename = "welfare_report.csv") => {
  if (!data || data.length === 0) return;
  // สร้าง header
  const header = [
    'วันที่ยื่น',
    'ชื่อผู้ยื่น',
    'ประเภท',
    'จำนวนเงิน',
    'สถานะ',
    'รายละเอียด',

    'หมายเหตุจากผู้จัดการ'
  ];
  const rows = data.map(row => [
    formatDate(row.created_at),
    row.employee_name || '',
    row.request_type || '',
    row.amount?.toString() || '',
    getStatusText(row.status),
    row.details || '',

    row.manager_notes || ''
  ]);
  // รวม header กับ rows
  const csv = [header, ...rows].map(e => e.map(v => '"' + (v?.toString().replace(/"/g, '""') || '') + '"').join(",")).join("\r\n");
  // ใส่ BOM เพื่อให้ Excel อ่านภาษาไทยถูก
  const csvWithBom = '\uFEFF' + csv;
  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { RefreshCw, FileText, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { WelfareEditModal } from '@/components/forms/WelfareEditModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';


// Interface for welfare requests from database
interface WelfareRequestItem {
  id: number;
  employee_id: number;
  employee_name: string;
  request_type: string;
  status: string;
  amount: number;
  created_at: string;
  details?: string;

  manager_notes?: string;
  attachment_url?: string;
  attachments?: string[];
}

const formatDate = (dateString: string | Date) => {
  try {
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy', { locale: th });
  } catch (error) {
    return 'วันที่ไม่ถูกต้อง';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getStatusText = (status: string) => {
  if (!status) return 'รออนุมัติโดยหัวหน้า';
  switch (status.toLowerCase()) {
    case 'pending_manager':
      return 'รออนุมัติโดยหัวหน้า';
    case 'pending_accounting':
      return 'รอตรวจสอบโดยบัญชี';
    case 'completed':
      return 'เสร็จสมบูรณ์';
    case 'rejected_manager':
      return 'ปฏิเสธโดยหัวหน้า';
    case 'rejected_accounting':
      return 'ปฏิเสธโดยบัญชี';
    default:
      return 'สถานะไม่ทราบ';
  }
};

const getStatusClass = (status: string) => {
  if (!status) return 'bg-yellow-100 text-yellow-800';
  switch (status.toLowerCase()) {
    case 'pending_manager':
      return 'bg-yellow-100 text-yellow-800';
    case 'pending_accounting':
      return 'bg-amber-200 text-amber-900';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'rejected_manager':
      return 'bg-red-100 text-red-800';
    case 'rejected_accounting':
      return 'bg-pink-200 text-pink-900';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const WelfareStatusChart: React.FC = () => {
  // state เดิมที่มีอยู่แล้ว
  const { profile } = useAuth();
  const [requests, setRequests] = useState<WelfareRequestItem[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<WelfareRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<WelfareRequestItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editType, setEditType] = useState<string | null>(null);
  const navigate = useNavigate();
  // state ที่เพิ่มใหม่สำหรับ filter ปี
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [years, setYears] = useState<string[]>([]);
  // Double click handler for editing
  const handleDoubleClick = (request: WelfareRequestItem) => {
    setEditId(request.id);
    setEditType(request.request_type);
    setEditModalOpen(true);
  };

  // Single click handler for edit button
  const handleEdit = (request: WelfareRequestItem) => {
    setEditId(request.id);
    setEditType(request.request_type);
    setEditModalOpen(true);
  };

  const fetchRequests = useCallback(async () => {
    if (!profile) return;
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('welfare_requests')
        .select('*')
        .eq('employee_name', profile.display_name)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error('ไม่สามารถโหลดข้อมูลการเบิกสวัสดิการได้');
      }

      // Map attachment_url to attachments array here
      const mapped = (data || []).map((req: WelfareRequestItem) => {
        let attachments: string[] = [];
        if (Array.isArray(req.attachment_url)) {
          attachments = req.attachment_url;
        } else if (typeof req.attachment_url === 'string') {
          try {
            const parsed = JSON.parse(req.attachment_url);
            attachments = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            attachments = req.attachment_url ? [req.attachment_url] : [];
          }
        }
        return { ...req, attachments };
      });
      setRequests(mapped);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // อัปเดตรายการปีที่มีในข้อมูลเมื่อ requests เปลี่ยน
  useEffect(() => {
    if (requests.length === 0) {
      setYears([]);
      return;
    }
    // ดึงปีจาก created_at
    const yearSet = new Set<string>();
    requests.forEach((req) => {
      if (req.created_at) {
        const year = new Date(req.created_at).getFullYear().toString();
        yearSet.add(year);
      }
    });
    // เรียงจากมากไปน้อย (ล่าสุดอยู่บน)
    setYears(Array.from(yearSet).sort((a, b) => parseInt(b) - parseInt(a)));
  }, [requests]);

  useEffect(() => {
    if (!requests.length) {
      setFilteredRequests([]);
      return;
    }
    let result = [...requests];
    if (selectedStatus !== 'all') {
      result = result.filter(request => 
        request.status?.toLowerCase() === selectedStatus.toLowerCase()
      );
    }
    if (selectedYear !== 'all') {
      result = result.filter(request => {
        if (!request.created_at) return false;
        const year = new Date(request.created_at).getFullYear().toString();
        return year === selectedYear;
      });
    }
    setFilteredRequests(result);
  }, [requests, selectedStatus, selectedYear]);


  const handleViewDetails = (request: WelfareRequestItem) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">ประวัติการยื่นเบิกสวัสดิการ</CardTitle>
              <CardDescription className="mt-1">ข้อมูลการเบิกสวัสดิการของคุณ</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                className="px-3 py-2 border rounded-md text-sm w-full sm:w-auto"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="pending">รออนุมัติ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="rejected">ไม่อนุมัติ</option>
              </select>
              {/* Year Filter */}
              <select
                className="px-3 py-2 border rounded-md text-sm w-full sm:w-auto"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="all">ทุกปี</option>
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <Button 
                onClick={fetchRequests} 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'กำลังโหลด...' : 'รีเฟรช'}
              </Button>
              <Button
                onClick={() => exportToCSV(filteredRequests)}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
                disabled={filteredRequests.length === 0}
              >
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-4 text-center text-red-600 bg-red-50 rounded-lg">
              <p className="font-medium">เกิดข้อผิดพลาด</p>
              <p className="text-sm mb-2">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-2"
                variant="default"
                size="sm"
              >
                โหลดใหม่
              </Button>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedStatus !== 'all' 
                ? 'ไม่พบข้อมูลที่ตรงกับการค้นหา' 
                : 'ไม่พบข้อมูลการยื่นเบิกสวัสดิการ'}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-[120px]">วันที่ยื่น</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead className="text-right">จำนวนเงิน</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                    <TableHead className="text-center">เอกสารแนบ</TableHead>
                    <TableHead className="w-[100px] text-center">รายละเอียด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow 
                      key={request.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onDoubleClick={() => handleDoubleClick(request)}
                    >
                      <TableCell className="whitespace-nowrap">
                        {formatDate(request.created_at)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {request.request_type || 'ไม่ระบุ'}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatCurrency(request.amount || 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {request.attachments && request.attachments.length > 0 ? (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {request.attachments.map((file, idx) => (
                              <Button asChild variant="ghost" size="icon" key={idx} onClick={e => e.stopPropagation()}>
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
                            <Button
  variant="ghost"
  size="icon"
  onClick={e => {
    e.stopPropagation();
    handleEdit(request);
  }}
>
  <span className="sr-only">แก้ไข</span>
  แก้ไข
</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      {selectedRequest && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>รายละเอียดคำร้อง</DialogTitle>
              <DialogDescription>
                รายละเอียดสำหรับคำร้องขอสวัสดิการประเภท "{selectedRequest.request_type}".
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-muted-foreground">ชื่อผู้ยื่น:</span>
                <span className="col-span-2 font-medium">{selectedRequest.employee_name || 'ไม่ระบุ'}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-muted-foreground">ประเภท:</span>
                <span className="col-span-2">{selectedRequest.request_type || 'ไม่ระบุ'}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-muted-foreground">จำนวนเงิน:</span>
                <span className="col-span-2">{formatCurrency(selectedRequest.amount || 0)}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-muted-foreground">สถานะ:</span>
                <span className={`col-span-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(selectedRequest.status)}`}>
                  {getStatusText(selectedRequest.status)}
                </span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-muted-foreground">วันที่ยื่น:</span>
                <span className="col-span-2">{formatDate(selectedRequest.created_at)}</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <span className="text-muted-foreground">รายละเอียด:</span>
                <p className="p-2 bg-muted rounded-md text-muted-foreground break-words">
                  {selectedRequest.details || 'ไม่มีรายละเอียด'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <span className="text-muted-foreground">หมายเหตุจากผู้จัดการ:</span>
                <p className="p-2 bg-muted rounded-md text-muted-foreground break-words">
                  {selectedRequest.manager_notes || 'ไม่มีหมายเหตุ'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  ปิด
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Popup Edit Modal */}
      <WelfareEditModal
        open={editModalOpen}
        onOpenChange={open => {
          setEditModalOpen(open);
          if (!open) {
            setEditId(null);
            setEditType(null);
          }
        }}
        editId={editId}
        type={editType as any}
        onSuccess={() => {
          setEditModalOpen(false);
          setEditId(null);
          setEditType(null);
          fetchRequests();
        }}
      />
    </>
  );
};

export default WelfareStatusChart;
