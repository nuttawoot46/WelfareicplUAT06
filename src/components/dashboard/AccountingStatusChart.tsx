import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { RefreshCw, FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { WelfareEditModal } from '@/components/forms/WelfareEditModal';

// Interface for accounting requests from database
interface AccountingRequestItem {
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
  pdf_request_hr?: string; // PDF ที่ HR approve แล้ว
  pdf_request_manager?: string; // PDF ที่ Manager approve แล้ว
  pdf_url?: string; // PDF URL จาก database
  run_number?: string; // เลขที่เอกสาร เช่น ADV2025
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
    case 'pending_hr':
      return 'รอตรวจสอบโดย HR';
    case 'pending_accounting':
      return 'รอตรวจสอบโดยบัญชี';
    case 'completed':
      return 'เสร็จสมบูรณ์';
    case 'rejected_manager':
      return 'ปฏิเสธโดยหัวหน้า';
    case 'rejected_accounting':
      return 'ปฏิเสธโดยบัญชี';
    case 'rejected_hr':
      return 'ปฏิเสธโดย HR';
    default:
      return 'สถานะไม่ทราบ';
  }
};

const getStatusClass = (status: string) => {
  if (!status) return 'bg-yellow-100 text-yellow-800';
  switch (status.toLowerCase()) {
    case 'pending_manager':
      return 'bg-yellow-100 text-yellow-800';
    case 'pending_hr':
      return 'bg-amber-200 text-amber-900';
    case 'pending_accounting':
      return 'bg-amber-200 text-amber-900';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'rejected_manager':
      return 'bg-red-100 text-red-800';
    case 'rejected_accounting':
      return 'bg-red-100 text-red-800';
    case 'rejected_hr':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getRequestTypeText = (requestType: string) => {
  if (!requestType) return 'ไม่ระบุ';
  switch (requestType.toLowerCase()) {
    case 'advance':
      return 'เบิกเงินล่วงหน้า (ฝ่ายขาย)';
    case 'general-advance':
      return 'เบิกเงินล่วงหน้า (ทั่วไป)';
    case 'expense-clearing':
      return 'เคลียร์ค่าใช้จ่าย (ฝ่ายขาย)';
    case 'general-expense-clearing':
      return 'เคลียร์ค่าใช้จ่าย (ทั่วไป)';
    default:
      return requestType;
  }
};

// ฟังก์ชัน export CSV ที่รองรับภาษาไทย (UTF-8 BOM)
const exportToCSV = (data: AccountingRequestItem[], filename = "accounting_report.csv") => {
  if (!data || data.length === 0) return;

  // สร้าง header
  const header = [
    'เลขที่เอกสาร',
    'วันที่ยื่น',
    'ชื่อผู้ยื่น',
    'ประเภท',
    'จำนวนเงิน',
    'สถานะ',
    'รายละเอียด',
    'หมายเหตุจากผู้จัดการ'
  ];

  const rows = data.map((row) => [
    row.run_number || '-',
    formatDate(row.created_at),
    row.employee_name || '',
    getRequestTypeText(row.request_type),
    row.amount?.toString() || '',
    getStatusText(row.status),
    row.details || '',
    row.manager_notes || ''
  ]);

  // รวม header กับ rows
  const csv = [header, ...rows]
    .map(e => e.map(v => '"' + (v?.toString().replace(/"/g, '""') || '') + '"').join(","))
    .join("\r\n");

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
  URL.revokeObjectURL(url);
};

const AccountingStatusChart: React.FC = React.memo(() => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<AccountingRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editType, setEditType] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Double click handler for editing - เฉพาะสถานะ pending_manager เท่านั้น
  const handleDoubleClick = (request: AccountingRequestItem) => {
    if (request.status === 'pending_manager') {
      setEditId(request.id);
      setEditType(request.request_type);
      setEditModalOpen(true);
    }
  };

  // Single click handler for edit button
  const handleEdit = (request: AccountingRequestItem) => {
    setEditId(request.id);
    setEditType(request.request_type);
    setEditModalOpen(true);
  };

  const fetchRequests = useCallback(async (isRefresh = false) => {
    if (!profile?.display_name) {
      setIsLoading(false);
      setError('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Filter only accounting-related requests (advance, general-advance and expense-clearing types)
      const { data, error: fetchError } = await supabase
        .from('welfare_requests')
        .select('*')
        .eq('employee_name', profile.display_name)
        .in('request_type', ['advance', 'general-advance', 'expense-clearing', 'general-expense-clearing']) // Only accounting requests
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Database error:', fetchError);
        throw new Error(`ไม่สามารถโหลดข้อมูลการเบิกบัญชีได้: ${fetchError.message}`);
      }

      if (!data) {
        setRequests([]);
        return;
      }

      // Map attachment_url to attachments array with better error handling
      const mapped = data.map((req: AccountingRequestItem) => {
        let attachments: string[] = [];

        try {
          if (Array.isArray(req.attachment_url)) {
            attachments = req.attachment_url.filter(url => url && typeof url === 'string');
          } else if (typeof req.attachment_url === 'string' && req.attachment_url.trim()) {
            // Try to parse as JSON first
            try {
              const parsed = JSON.parse(req.attachment_url);
              if (Array.isArray(parsed)) {
                attachments = parsed.filter(url => url && typeof url === 'string');
              } else if (typeof parsed === 'string') {
                attachments = [parsed];
              }
            } catch {
              // If not JSON, treat as single URL
              attachments = [req.attachment_url];
            }
          }
        } catch (error) {
          console.warn('Error processing attachments for request:', req.id, error);
          attachments = [];
        }

        return { ...req, attachments };
      });

      setRequests(mapped);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [profile]);

  const handleRefresh = useCallback(() => {
    fetchRequests(true);
  }, [fetchRequests]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // อัปเดตรายการปีที่มีในข้อมูลเมื่อ requests เปลี่ยน - ใช้ useMemo เพื่อประสิทธิภาพ
  const years = useMemo(() => {
    if (requests.length === 0) return [];

    const yearSet = new Set<string>();
    requests.forEach((req) => {
      if (req.created_at) {
        try {
          const year = new Date(req.created_at).getFullYear().toString();
          yearSet.add(year);
        } catch (error) {
          console.warn('Invalid date format:', req.created_at);
        }
      }
    });

    // เรียงจากมากไปน้อย (ล่าสุดอยู่บน)
    return Array.from(yearSet).sort((a, b) => parseInt(b) - parseInt(a));
  }, [requests]);

  // อัปเดตรายการเดือนที่มีในข้อมูลเมื่อ requests เปลี่ยน - ใช้ useMemo เพื่อประสิทธิภาพ
  const months = useMemo(() => {
    if (requests.length === 0) return [];

    const monthSet = new Set<string>();
    requests.forEach((req) => {
      if (req.created_at) {
        try {
          const date = new Date(req.created_at);
          const year = date.getFullYear().toString();
          const month = (date.getMonth() + 1).toString().padStart(2, '0');

          // ถ้าเลือกปีเฉพาะ ให้แสดงเฉพาะเดือนของปีนั้น
          if (selectedYear === 'all' || year === selectedYear) {
            monthSet.add(month);
          }
        } catch (error) {
          console.warn('Invalid date format:', req.created_at);
        }
      }
    });

    // เรียงจาก 01 ถึง 12
    return Array.from(monthSet).sort();
  }, [requests, selectedYear]);

  // ฟังก์ชันแปลงเลขเดือนเป็นชื่อเดือนไทย
  const getMonthName = (month: string) => {
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const monthIndex = parseInt(month) - 1;
    return monthNames[monthIndex] || month;
  };

  // Filter requests - ใช้ useMemo เพื่อประสิทธิภาพ
  const filteredRequests = useMemo(() => {
    if (!requests.length) return [];

    let result = [...requests];

    // Filter by status
    if (selectedStatus !== 'all') {
      result = result.filter(request =>
        request.status === selectedStatus
      );
    }

    // Filter by year
    if (selectedYear !== 'all') {
      result = result.filter(request => {
        if (!request.created_at) return false;
        try {
          const year = new Date(request.created_at).getFullYear().toString();
          return year === selectedYear;
        } catch {
          return false;
        }
      });
    }

    // Filter by month
    if (selectedMonth !== 'all') {
      result = result.filter(request => {
        if (!request.created_at) return false;
        try {
          const month = (new Date(request.created_at).getMonth() + 1).toString().padStart(2, '0');
          return month === selectedMonth;
        } catch {
          return false;
        }
      });
    }

    return result;
  }, [requests, selectedStatus, selectedYear, selectedMonth]);

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">ประวัติการยื่นเบิกบัญชี</CardTitle>
              
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                className="px-3 py-2 border rounded-md text-sm w-full sm:w-auto"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="pending_manager">รออนุมัติโดยหัวหน้า</option>
                <option value="pending_hr">รอตรวจสอบโดย HR</option>
                <option value="pending_accounting">รอตรวจสอบโดยบัญชี</option>
                <option value="completed">เสร็จสมบูรณ์</option>
                <option value="rejected_manager">ปฏิเสธโดยหัวหน้า</option>
                <option value="rejected_accounting">ปฏิเสธโดยบัญชี</option>
              </select>
              {/* Year Filter */}
              <select
                className="px-3 py-2 border rounded-md text-sm w-full sm:w-auto"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  // รีเซ็ตเดือนเมื่อเปลี่ยนปี
                  setSelectedMonth('all');
                }}
              >
                <option value="all">ทุกปี</option>
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              {/* Month Filter */}
              <select
                className="px-3 py-2 border rounded-md text-sm w-full sm:w-auto"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disabled={months.length === 0}
              >
                <option value="all">ทุกเดือน</option>
                {months.map((month) => (
                  <option key={month} value={month}>{getMonthName(month)}</option>
                ))}
              </select>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={isLoading || isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${(isLoading || isRefreshing) ? 'animate-spin' : ''}`} />
                {isLoading ? 'กำลังโหลด...' : isRefreshing ? 'รีเฟรช...' : 'รีเฟรช'}
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
            <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
              <p className="text-sm text-gray-500 mt-1">กรุณารอสักครู่</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-red-600 bg-red-50 rounded-lg min-h-[200px]">
              <p className="font-medium text-lg mb-2">เกิดข้อผิดพลาด</p>
              <p className="text-sm mb-4 max-w-md">{error}</p>
              <div className="flex gap-2">
                <Button
                  onClick={handleRefresh}
                  variant="default"
                  size="sm"
                  disabled={isRefreshing}
                >
                  {isRefreshing ? 'กำลังลองใหม่...' : 'ลองใหม่'}
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  โหลดหน้าใหม่
                </Button>
              </div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-lg font-medium mb-2">
                {selectedStatus !== 'all' || selectedYear !== 'all' || selectedMonth !== 'all'
                  ? 'ไม่พบข้อมูลที่ตรงกับการค้นหา'
                  : 'ไม่พบข้อมูลการยื่นเบิกบัญชี'}
              </div>
              <p className="text-sm">
                {selectedStatus !== 'all' || selectedYear !== 'all' || selectedMonth !== 'all'
                  ? 'ลองเปลี่ยนตัวกรองหรือเพิ่มข้อมูลใหม่'
                  : 'เริ่มต้นโดยการยื่นคำร้องขอเบิกเงินล่วงหน้าใหม่'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table className="text-xs md:text-sm">
                <TableHeader className="bg-welfare-blue/100 [&_th]:text-white">
                  <TableRow>
                    <TableHead className="w-[120px] whitespace-nowrap">เลขที่เอกสาร</TableHead>
                    <TableHead className="w-[120px] whitespace-nowrap">วันที่ยื่น</TableHead>
                    <TableHead className="whitespace-nowrap">ประเภท</TableHead>
                    <TableHead className="text-right whitespace-nowrap">จำนวนเงิน</TableHead>
                    <TableHead className="text-center whitespace-nowrap">สถานะ</TableHead>
                    <TableHead className="text-center whitespace-nowrap">เอกสารแนบ</TableHead>
                    <TableHead className="text-center whitespace-nowrap">PDF</TableHead>
                    <TableHead className="w-[200px] whitespace-nowrap">หมายเหตุ</TableHead>
                    <TableHead className="w-[100px] text-center whitespace-nowrap">รายละเอียด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow
                      key={request.id}
                      className={`hover:bg-gray-50 ${request.status === 'pending_manager' ? 'cursor-pointer' : 'cursor-default'}`}
                      onDoubleClick={() => handleDoubleClick(request)}
                    >
                      <TableCell className="font-medium">
                        {request.run_number || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(request.created_at)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {getRequestTypeText(request.request_type)}
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
                        <div className="flex flex-wrap gap-1 justify-center items-center">
                          {/* เอกสารแนบต้นฉบับ */}
                          {request.attachments && request.attachments.length > 0 && (
                            <>
                              {request.attachments.map((file, idx) => (
                                <div key={`attachment-${idx}`} className="flex flex-col items-center">
                                  <Button asChild variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
                                    <a
                                      href={file}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label={`View attachment ${idx + 1}`}
                                      className="text-blue-600 hover:text-blue-800"
                                      title="เอกสารแนบต้นฉบับ"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </a>
                                  </Button>
                                  <span className="text-xs text-gray-500">เอกสารแนบ</span>
                                </div>
                              ))}
                            </>
                          )}

                          {/* แสดง - เมื่อไม่มีเอกสารแนบ */}
                          {(!request.attachments || request.attachments.length === 0) && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-wrap gap-1 justify-center items-center">
                          {/* PDF ลิงก์จาก database - เลือกตามสถานะ */}
                          {(() => {
                            // เลือก PDF URL ตามสถานะ
                            let pdfUrl = null;
                            let pdfTitle = "ดู PDF เอกสาร";

                            if (request.status === 'pending_manager' && request.pdf_url) {
                              pdfUrl = request.pdf_url;
                              pdfTitle = "ดู PDF เอกสาร";
                            } else if (request.status === 'pending_hr' && request.pdf_request_manager) {
                              pdfUrl = request.pdf_request_manager;
                              pdfTitle = "ดู PDF ที่ Manager อนุมัติแล้ว";
                            } else if (request.status === 'pending_accounting' || request.status === 'completed') {
                              if (request.pdf_request_hr) {
                                pdfUrl = request.pdf_request_hr;
                                pdfTitle = "ดู PDF ที่ HR อนุมัติแล้ว";
                              } else if (request.pdf_request_manager) {
                                pdfUrl = request.pdf_request_manager;
                                pdfTitle = "ดู PDF ที่ Manager อนุมัติแล้ว";
                              }
                            } else if (request.pdf_url) {
                              pdfUrl = request.pdf_url;
                            }

                            return pdfUrl ? (
                              <Button asChild variant="ghost" size="icon">
                                <a
                                  href={pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-800"
                                  title={pdfTitle}
                                  onClick={e => e.stopPropagation()}
                                >
                                  <FileText className="h-4 w-4" />
                                </a>
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            );
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="text-sm text-gray-700 truncate" title={request.manager_notes || ''}>
                          {request.manager_notes || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {request.status === 'pending_manager' ? (
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
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
});

AccountingStatusChart.displayName = 'AccountingStatusChart';

export default AccountingStatusChart;