import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { RefreshCw, FileText, Download, Heart, Briefcase, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { WelfareEditModal } from '@/components/forms/WelfareEditModal';



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
  pdf_request_hr?: string; // PDF ที่ HR approve แล้ว
  pdf_request_manager?: string; // PDF ที่ Manager approve แล้ว
  pdf_url?: string; // PDF URL จาก database
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
    case 'pending_special_approval':
      return 'รออนุมัติโดย ผู้บริหาร';      
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
    case 'pending_special_approval':
      return 'bg-amber-200 text-amber-900';  
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getRequestTypeText = (requestType: string) => {
  if (!requestType) return 'ไม่ระบุ';
  switch (requestType.toLowerCase()) {
    case 'wedding':
      return 'ค่าแต่งงาน';
    case 'training':
      return 'ค่าอบรม';
    case 'childbirth':
      return 'ค่าคลอดบุตร';
    case 'funeral':
      return 'ค่าช่วยเหลืองานศพ';
    case 'glasses':
      return 'ค่าตัดแว่น';
    case 'dental':
      return 'ค่าทำฟัน';
    case 'fitness':
      return 'ค่าออกกำลังกาย';
    case 'medical':
      return 'ค่าของเยี่ยมกรณีเจ็บป่วย';
    case 'internal_training':
      return 'ค่าอบรมภายใน';
    default:
      return requestType;
  }
};

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

// ประเภทสวัสดิการ (ไม่รวมค่าอบรม)
const WELFARE_TYPES = ['wedding', 'childbirth', 'funeral', 'glasses', 'dental', 'fitness', 'medical'];
// ประเภทค่าอบรม
const TRAINING_TYPES = ['training', 'internal_training'];
// ประเภทขออนุมัติงาน
const EMPLOYMENT_TYPES = ['employment-approval'];

const WelfareStatusChart: React.FC = React.memo(() => {
  // state เดิมที่มีอยู่แล้ว
  const { profile } = useAuth();
  const [requests, setRequests] = useState<WelfareRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editType, setEditType] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('welfare');
  // Double click handler for editing - เฉพาะสถานะ pending_manager เท่านั้น
  const handleDoubleClick = (request: WelfareRequestItem) => {
    if (request.status === 'pending_manager') {
      setEditId(request.id);
      setEditType(request.request_type);
      setEditModalOpen(true);
    }
  };

  // Single click handler for edit button
  const handleEdit = (request: WelfareRequestItem) => {
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

      const { data, error: fetchError } = await supabase
        .from('welfare_requests')
        .select('*')
        .eq('employee_name', profile.display_name)
        .not('request_type', 'in', '(advance,general-advance,expense-clearing)') // Exclude accounting requests
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Database error:', fetchError);
        throw new Error(`ไม่สามารถโหลดข้อมูลการเบิกสวัสดิการได้: ${fetchError.message}`);
      }

      if (!data) {
        setRequests([]);
        return;
      }

      // Map attachment_url to attachments array with better error handling
      const mapped = data.map((req: WelfareRequestItem) => {
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

    // Filter by tab type (สวัสดิการ vs ค่าอบรม vs ขออนุมัติงาน)
    if (activeTab === 'welfare') {
      result = result.filter(request => WELFARE_TYPES.includes(request.request_type));
    } else if (activeTab === 'training') {
      result = result.filter(request => TRAINING_TYPES.includes(request.request_type));
    } else if (activeTab === 'employment') {
      result = result.filter(request => EMPLOYMENT_TYPES.includes(request.request_type));
    }

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
  }, [requests, selectedStatus, selectedYear, selectedMonth, activeTab]);

  // Function to render table content
  const renderTableContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
          <Button onClick={handleRefresh} variant="outline" className="mt-4">
            ลองใหม่
          </Button>
        </div>
      );
    }

    if (filteredRequests.length === 0) {
      const tabName = activeTab === 'welfare' ? 'สวัสดิการ' : activeTab === 'training' ? 'ค่าอบรม' : 'อนุมัติจ้างงาน';
      return (
        <div className="text-center py-8 text-gray-500">
          <p>ไม่พบรายการคำร้องขอ{tabName}</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">วันที่ยื่น</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead className="text-right">จำนวนเงิน</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>เอกสารแนบ</TableHead>
              <TableHead>PDF</TableHead>
              <TableHead className="w-[80px]">การดำเนินการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request) => {
              // Determine which PDF URL to show based on status
              let pdfUrl = null;
              if (request.status === 'pending_manager' && request.pdf_url) {
                pdfUrl = request.pdf_url;
              } else if (request.status === 'pending_hr' && request.pdf_request_manager) {
                pdfUrl = request.pdf_request_manager;
              } else if ((request.status === 'pending_accounting' || request.status === 'completed') && (request.pdf_request_hr || request.pdf_request_manager)) {
                pdfUrl = request.pdf_request_hr || request.pdf_request_manager;
              }

              return (
                <TableRow
                  key={request.id}
                  className={request.status === 'pending_manager' ? 'cursor-pointer hover:bg-gray-50' : ''}
                  onDoubleClick={() => handleDoubleClick(request)}
                >
                  <TableCell className="font-medium">
                    {formatDate(request.created_at)}
                  </TableCell>
                  <TableCell>{getRequestTypeText(request.request_type)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(request.amount)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {request.attachments && request.attachments.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {request.attachments.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            ไฟล์ {index + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {pdfUrl ? (
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">ดู PDF</span>
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {request.status === 'pending_manager' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(request)}
                      >
                        แก้ไข
                      </Button>
                    )}
                    {(request.status === 'pending_accounting' || request.status === 'completed') && pdfUrl && (
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          พิมพ์
                        </Button>
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };




  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">ประวัติการยื่นคำร้อง</CardTitle>
              <CardDescription className="mt-1">
                เมื่อสถานะ รอตรวจสอบโดยบัญชี กรุณาปริ้นเอกสาร PDF ส่งให้ทางฝ่ายบัญชี
              </CardDescription>
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
                <option value="completed">เสร็จสมบูรณ์</option>
                <option value="rejected_manager">ปฏิเสธโดยหัวหน้า</option>
                <option value="rejected_hr">ปฏิเสธโดย HR</option>
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger
                value="welfare"
                className="flex items-center gap-2 data-[state=active]:bg-pink-500 data-[state=active]:text-white"
              >
                <Heart className="h-4 w-4" />
                สวัสดิการ
              </TabsTrigger>
              <TabsTrigger
                value="training"
                className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white"
              >
                <GraduationCap className="h-4 w-4" />
                ค่าอบรม
              </TabsTrigger>
              <TabsTrigger
                value="employment"
                className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                <Briefcase className="h-4 w-4" />
                ขออนุมัติจ้างงาน
              </TabsTrigger>
            </TabsList>

            {/* Shared content for all tabs */}
            <TabsContent value="welfare" className="mt-0">
              {renderTableContent()}
            </TabsContent>

            <TabsContent value="training" className="mt-0">
              {renderTableContent()}
            </TabsContent>

            <TabsContent value="employment" className="mt-0">
              {renderTableContent()}
            </TabsContent>
          </Tabs>
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

WelfareStatusChart.displayName = 'WelfareStatusChart';

export default WelfareStatusChart;
