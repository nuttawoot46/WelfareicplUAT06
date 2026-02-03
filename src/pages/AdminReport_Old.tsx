import { useMemo, useState, useEffect } from 'react';
import { useWelfare } from '@/context/WelfareContext';
import { useInternalTraining } from '@/context/InternalTrainingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Download, Filter, TrendingUp, Users, DollarSign, FileText, BookOpen } from 'lucide-react';
import { WelfareType, StatusType } from '@/types';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';

import { fetchAllEmployees, SimpleEmployee } from '@/services/employeeApi';
import { getBenefitLimitsByEmpId, BenefitLimit } from '@/services/welfareLimitApi';
import Modal from '@/components/ui/modal';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const welfareTypeLabels: Record<WelfareType, string> = {
  wedding: 'ค่าแต่งงาน',
  training: 'ค่าอบรม',
  childbirth: 'ค่าคลอดบุตร',
  funeral: 'ค่าช่วยเหลืองานศพ',
  glasses: 'ค่าตัดแว่นสายตา',
  dental: 'ค่ารักษาทัตกรรม',
  fitness: 'ค่าออกกำลังกาย',
  medical: 'ค่ารักษาพยาบาล',
};

// ฟังก์ชัน export CSV ที่รองรับภาษาไทย (UTF-8 BOM)
function exportReportToCSV({
  summaryByType,
  statusSummary,
  departmentSummary,
  welfareTypeLabels,
  filteredRequests,
  employees,
  departmentFilter,
  employeeFilter,
  dateRange,
  reportType
}: any) {
  let csv = '';

  // Header information
  csv += reportType === 'internal_training' ? 'รายงานสรุปการอบรมภายใน\r\n' : 'รายงานสรุปการใช้สวัสดิการ\r\n';
  csv += `วันที่สร้างรายงาน: ${new Date().toLocaleDateString('th-TH')}\r\n`;
  if (dateRange?.from && dateRange?.to) {
    csv += `ช่วงเวลา: ${dateRange.from.toLocaleDateString('th-TH')} - ${dateRange.to.toLocaleDateString('th-TH')}\r\n`;
  }
  csv += '\r\n';

  // ถ้าเลือกทุกแผนก และพนักงานทุกคน
  if (departmentFilter === 'all' && employeeFilter === 'all') {
    if (reportType === 'internal_training') {
      csv += 'รายละเอียดการอบรมภายในทั้งหมด\r\n';
      csv += 'หลักสูตร,สถานที่,วันที่,ผู้เข้าอบรม,ชั่วโมง,ค่าใช้จ่าย,สถานะ,หมายเหตุ\r\n';
      
      filteredRequests.forEach((req: any) => {
        csv += `"${req.courseName || req.description || 'ไม่ระบุ'}","${req.venue || 'ไม่ระบุ'}","${new Date(req.date).toLocaleDateString('th-TH')}","${req.total_participants || 0}","${req.total_hours || 0}","${req.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}","${statusSummary.find((s: any) => s.status === req.status)?.label || req.status}","${req.additional_notes || 'ไม่มี'}"\r\n`;
      });
    } else {
      csv += 'รายละเอียดการเบิกสวัสดิการของพนักงานทุกคน\r\n';
      csv += 'ชื่อพนักงาน,แผนก,ค่าแต่งงาน,ค่าอบรม,ค่าคลอดบุตร,ค่าช่วยเหลืองานศพ,ค่าตัดแว่นสายตา,ค่ารักษาทัตกรรม,ค่าออกกำลังกาย,ค่ารักษาพยาบาล,รวมทั้งหมด\r\n';

    // Sort employees by department first (Management first), then by name
    const sortedEmployees = [...employees].sort((a, b) => {
      const deptA = a.Team || 'ไม่ระบุ';
      const deptB = b.Team || 'ไม่ระบุ';

      if (deptA !== deptB) {
        // Management department comes first
        if (deptA.toLowerCase().includes('management')) return -1;
        if (deptB.toLowerCase().includes('management')) return 1;

        // Then sort other departments alphabetically
        return deptA.localeCompare(deptB, 'th');
      }
      return (a.Name || '').localeCompare(b.Name || '', 'th');
    });

    sortedEmployees.forEach((emp: SimpleEmployee) => {
      const empRequests = filteredRequests.filter((req: any) => req.userName === emp.Name);
      const welfareUsage: Record<string, number> = {};

      // Initialize all welfare types
      Object.keys(welfareTypeLabels).forEach(type => {
        welfareUsage[type] = 0;
      });

      // Calculate usage for each type
      empRequests.forEach((req: any) => {
        if (req.status === 'completed') {
          welfareUsage[req.type] = (welfareUsage[req.type] || 0) + req.amount;
        }
      });

      const totalUsage = Object.values(welfareUsage).reduce((sum: number, amount: number) => sum + amount, 0);

      csv += `"${emp.Name}","${emp.Team || 'ไม่ระบุ'}"`;
      Object.keys(welfareTypeLabels).forEach(type => {
        const amount = welfareUsage[type];
        csv += `,"${amount > 0 ? amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}"`;
      });
      csv += `,"${totalUsage.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"\r\n`;
    });
    csv += '\r\n';
  }

  // สรุปข้อมูลแยกตามประเภท
  if (reportType === 'internal_training') {
    csv += 'สรุปการอบรมภายในแยกตามหลักสูตร\r\n';
    csv += 'หลักสูตร/สถานที่,จำนวนครั้ง (รายการ),ค่าใช้จ่าย (บาท)\r\n';
  } else {
    csv += 'สรุปการใช้สวัสดิการแยกตามประเภท\r\n';
    csv += 'ประเภทสวัสดิการ,จำนวนคำร้อง (รายการ),ยอดเงินที่ใช้ไป (บาท)\r\n';
  }
  
  summaryByType.forEach((row: any) => {
    const typeLabel = reportType === 'internal_training' ? row.type : (welfareTypeLabels[row.type as WelfareType] || row.type);
    csv += `"${typeLabel}","${row.count.toLocaleString()}","${row.used.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"\r\n`;
  });

  csv += '\r\nสรุปสถานะคำร้อง\r\n';
  csv += 'สถานะการอนุมัติ,จำนวนคำร้อง (รายการ)\r\n';
  statusSummary.forEach((row: any) => {
    csv += `"${row.label}","${row.count.toLocaleString()}"\r\n`;
  });

  csv += '\r\nสรุปการใช้สวัสดิการตามแผนก\r\n';
  csv += 'ชื่อแผนก,จำนวนคำร้อง (รายการ),ยอดเงินที่ใช้ไป (บาท)\r\n';
  departmentSummary.forEach((row: any) => {
    csv += `"${row.department}","${row.count.toLocaleString()}","${row.used.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"\r\n`;
  });

  // รายละเอียดคำร้องทั้งหมด
  csv += '\r\nรายละเอียดคำร้องทั้งหมด\r\n';
  
  if (reportType === 'internal_training') {
    csv += 'วันที่,รหัสคำร้อง,หลักสูตร,สถานที่,ผู้เข้าอบรม,ชั่วโมง,ค่าใช้จ่าย (บาท),สถานะ,หมายเหตุ\r\n';
    filteredRequests.forEach((req: any) => {
      csv += `"${new Date(req.date).toLocaleDateString('th-TH')}","${req.id || 'ไม่ระบุ'}","${req.courseName || req.description || 'ไม่ระบุ'}","${req.venue || 'ไม่ระบุ'}","${req.total_participants || 0}","${req.total_hours || 0}","${req.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}","${statusSummary.find((s: any) => s.status === req.status)?.label || req.status}","${req.additional_notes || 'ไม่มี'}"\r\n`;
    });
  } else {
    csv += 'วันที่ยื่นคำร้อง,รหัสคำร้อง,ชื่อพนักงาน,แผนก,ประเภทสวัสดิการ,จำนวนเงิน (บาท),สถานะ,หมายเหตุ\r\n';
    filteredRequests.forEach((req: any) => {
      csv += `"${new Date(req.date).toLocaleDateString('th-TH')}","${req.id || 'ไม่ระบุ'}","${req.userName}","${req.userDepartment || 'ไม่ระบุ'}","${welfareTypeLabels[req.type] || req.type}","${req.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}","${statusSummary.find((s: any) => s.status === req.status)?.label || req.status}","${req.description || 'ไม่มี'}"\r\n`;
    });
  }

  // ใส่ BOM เพื่อให้ Excel อ่านภาษาไทยถูก
  const csvWithBom = '\uFEFF' + csv;
  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });

  const dateStr = dateRange?.from && dateRange?.to
    ? `${dateRange.from.toISOString().slice(0, 10)}_${dateRange.to.toISOString().slice(0, 10)}`
    : new Date().toISOString().slice(0, 10);

  const fileName = reportType === 'internal_training' 
    ? `internal_training_report_${dateStr}.csv`
    : `welfare_report_${dateStr}.csv`;

  saveAs(blob, fileName);
}

const AdminReport = () => {
  const navigate = useNavigate();
  const { welfareRequests } = useWelfare();
  const { trainingRequests } = useInternalTraining();

  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null } | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [reportType, setReportType] = useState<'welfare' | 'internal_training'>('welfare');

  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);
  // Modal สำหรับดูรายการคำร้องแต่ละสถานะ
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<StatusType | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const emps = await fetchAllEmployees();
        setEmployees(emps);
        const uniqueDepartments = Array.from(new Set(emps.map(e => e.Team).filter(Boolean))) as string[];
        setDepartments(uniqueDepartments);
      } catch (e: any) {
        console.error('Error loading employees:', e);
      }
    }
    load();
  }, []);

  const filteredRequests = useMemo(() => {
    const requests = reportType === 'welfare' ? welfareRequests : trainingRequests;
    return requests.filter((req) => {
      if (reportType === 'welfare' && typeFilter !== 'all' && req.type !== typeFilter) return false;
      if (departmentFilter !== 'all' && req.userDepartment !== departmentFilter) return false;
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;
      if (employeeFilter !== 'all') {
        const emp = employees.find(e => e.id.toString() === employeeFilter);
        if (!emp || req.userName !== emp.Name) return false;
      }
      if (dateRange?.from && dateRange?.to) {
        const reqDate = new Date(req.date);
        // Set hours to 0 to compare dates only
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        if (reqDate < fromDate || reqDate > toDate) return false;
      }
      return true;
    });
  }, [welfareRequests, trainingRequests, reportType, typeFilter, departmentFilter, statusFilter, employeeFilter, dateRange]);

  const summaryByType = useMemo(() => {
    if (reportType === 'internal_training') {
      // For internal training, we don't need type breakdown, so return summary by course/venue
      const map: Record<string, { count: number; used: number; remaining: number }> = {};
      
      filteredRequests.forEach((req) => {
        const key = req.courseName || req.venue || 'ไม่ระบุ';
        if (!map[key]) map[key] = { count: 0, used: 0, remaining: 0 };
        map[key].count++;
        if (req.status === 'completed') {
          map[key].used += req.amount;
        }
      });

      return Object.entries(map).map(([type, v]) => ({ type, ...v }));
    } else {
      // Original welfare type logic
      const map: Record<string, { count: number; used: number; remaining: number }> = {};
      const totalLimitPerType = 100000; // สมมติวงเงินรวมต่อประเภท 100,000

      // Initialize map with all welfare types to ensure they appear even if unused
      Object.keys(welfareTypeLabels).forEach(type => {
        map[type] = { count: 0, used: 0, remaining: totalLimitPerType };
      });

      filteredRequests.forEach((req) => {
        if (!map[req.type]) return; // Skip if type is not in our defined labels
        map[req.type].count++;
        if (req.status === 'completed') {
          map[req.type].used += req.amount;
        }
      });

      Object.keys(map).forEach((type) => {
        map[type].remaining = totalLimitPerType - map[type].used;
      });

      return Object.entries(map).map(([type, v]) => ({ type, ...v }));
    }
  }, [filteredRequests, reportType]);

  const statusSummary = useMemo(() => {
    const detailedMap: Record<string, number> = {
      'pending_manager': 0,
      'pending_hr': 0,
      'pending_accounting': 0,
      'completed': 0,
      'rejected_manager': 0,
      'rejected_hr': 0,
      'rejected_accounting': 0,
    };

    filteredRequests.forEach((req) => {
      detailedMap[req.status]++;
    });

    return [
      { status: 'pending_manager', count: detailedMap['pending_manager'], label: 'รอผู้จัดการอนุมัติ' },
      { status: 'pending_hr', count: detailedMap['pending_hr'], label: 'รอ HR อนุมัติ' },
      { status: 'pending_accounting', count: detailedMap['pending_accounting'], label: 'รอฝ่ายบัญชีตรวจสอบ' },
      { status: 'completed', count: detailedMap['completed'], label: 'อนุมัติแล้ว' },
      { status: 'rejected_manager', count: detailedMap['rejected_manager'], label: 'ผู้จัดการไม่อนุมัติ' },
      { status: 'rejected_hr', count: detailedMap['rejected_hr'], label: 'HR ไม่อนุมัติ' },
      { status: 'rejected_accounting', count: detailedMap['rejected_accounting'], label: 'ฝ่ายบัญชีไม่อนุมัติ' },
    ];
  }, [filteredRequests]);

  const departmentSummary = useMemo(() => {
    const map: Record<string, { count: number; used: number }> = {};
    filteredRequests.forEach((req) => {
      const dept = req.userDepartment || 'ไม่ระบุแผนก';
      if (!map[dept]) map[dept] = { count: 0, used: 0 };
      map[dept].count++;
      if (req.status === 'completed') map[dept].used += req.amount;
    });
    return Object.entries(map).map(([department, v]) => ({ department, ...v }));
  }, [filteredRequests]);



  const [benefitLimits, setBenefitLimits] = useState<BenefitLimit[] | null>(null);

  useEffect(() => {
    const fetchLimits = async () => {
      if (employeeFilter === 'all') {
        setBenefitLimits(null);
        return;
      }
      const emp = employees.find(e => e.id.toString() === employeeFilter);
      if (!emp) {
        setBenefitLimits(null);
        return;
      }
      try {
        const limits = await getBenefitLimitsByEmpId(emp.id);
        setBenefitLimits(limits);
      } catch (e) {
        setBenefitLimits(null);
      }
    };
    fetchLimits();
  }, [employeeFilter, employees]);

  const employeeWelfareSummary = useMemo(() => {
    if (!benefitLimits) return null;
    return benefitLimits.map((b) => ({
      type: b.type,
      label: welfareTypeLabels[b.type as WelfareType] || b.type,
      limit: b.totalLimit,
      used: b.used,
      remaining: b.remaining,
      percent: b.totalLimit > 0 ? Math.round((b.used / b.totalLimit) * 100) : 0,
    }));
  }, [benefitLimits]);

  // Vibrant color palette for welfare types
  const barColors: Record<string, string> = {
    wedding: '#FF6F61', // แดงส้มสด
    training: '#6A5ACD', // น้ำเงินม่วงสด
    childbirth: '#FFD700', // เหลืองทองสด
    funeral: '#20B2AA', // ฟ้าอมเขียวสด
    glasses: '#FF69B4', // ชมพูสด
    dental: '#40E0D0', // ฟ้าครามสด
    fitness: '#FF8C00', // ส้มเข้มสด
    medical: '#43A047', // เขียวสด
  };

  // Generate colors for internal training courses/venues
  const generateTrainingColors = (items: any[]) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const colorMap: Record<string, string> = {};
    items.forEach((item, index) => {
      colorMap[item.type] = colors[index % colors.length];
    });
    return colorMap;
  };

  // 3D Bar Chart Configuration
  const barData = useMemo(() => {
    const trainingColors = reportType === 'internal_training' ? generateTrainingColors(summaryByType) : {};
    
    return {
      labels: summaryByType.map((d) => {
        if (reportType === 'internal_training') {
          return d.type;
        }
        return welfareTypeLabels[d.type as WelfareType] || d.type;
      }),
      datasets: [
        {
          label: reportType === 'internal_training' ? 'ค่าใช้จ่าย (บาท)' : 'ยอดใช้ไป (บาท)',
          data: summaryByType.map((d) => d.used),
          backgroundColor: summaryByType.map((d) => 
            reportType === 'internal_training' 
              ? trainingColors[d.type] || '#3b82f6'
              : barColors[d.type] || '#3b82f6'
          ),
          borderColor: summaryByType.map((d) => 
            reportType === 'internal_training' 
              ? trainingColors[d.type] || '#3b82f6'
              : barColors[d.type] || '#3b82f6'
          ),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  }, [summaryByType, reportType]);

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 14,
            weight: 'bold' as const,
          },
          color: '#374151',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${Number(context.parsed.y).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: 'normal' as const,
          },
          color: '#6b7280',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6',
          lineWidth: 1,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: '#6b7280',
          callback: function (value: any) {
            return Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' บาท';
          }
        },
      },
    },
    elements: {
      bar: {
        borderRadius: 8,
        borderSkipped: false,
      },
    },
  };

  // Calculate key metrics
  const totalUsed = summaryByType.reduce((sum, item) => sum + item.used, 0);
  const totalRequests = filteredRequests.length;
  const completedRequests = filteredRequests.filter(req => req.status === 'completed').length;
  const pendingRequests = filteredRequests.filter(req => req.status.includes('pending')).length;
  const rejectedRequests = filteredRequests.filter(req => req.status.includes('rejected')).length;

  // Doughnut chart for status distribution
  const statusData = {
    labels: ['อนุมัติแล้ว', 'รอดำเนินการ', 'ไม่อนุมัติ'],
    datasets: [
      {
        data: [completedRequests, pendingRequests, rejectedRequests],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 0,
        cutout: '70%',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 12,
          },
          color: '#374151',
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto rounded-2xl shadow-lg bg-white p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin')}>
              ← ย้อนกลับ
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 drop-shadow">
                {reportType === 'welfare' ? 'ภาพรวมสวัสดิการ' : 'ภาพรวมการอบรมภายใน'}
              </h1>
              <p className="text-gray-600">
                {reportType === 'welfare' 
                  ? 'รายงานและสถิติการใช้งานสวัสดิการของบริษัท'
                  : 'รายงานและสถิติการอบรมภายในของบริษัท'
                }
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            disabled={!dateRange?.from || !dateRange?.to}
            onClick={() => exportReportToCSV({
              summaryByType,
              statusSummary,
              departmentSummary,
              welfareTypeLabels,
              filteredRequests,
              employees,
              departmentFilter,
              employeeFilter,
              dateRange,
              reportType
            })}
          >
            <Download className="w-4 h-4" />
            ดาวน์โหลดรายงาน
            {(!dateRange?.from || !dateRange?.to) && (
              <span className="text-xs text-gray-500 ml-1">(เลือกช่วงเวลาก่อน)</span>
            )}
          </Button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">ใช้ไปแล้ว</p>
                  <p className="text-2xl font-bold">{totalUsed.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs text-green-100">บาท</p>
                </div>
                <div className="bg-green-400/30 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">คำร้องทั้งหมด</p>
                  <p className="text-2xl font-bold">{totalRequests}</p>
                  <p className="text-xs text-blue-100">รายการ</p>
                </div>
                <div className="bg-blue-400/30 p-3 rounded-full">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">พนักงานที่ใช้</p>
                  <p className="text-2xl font-bold">
                    {new Set(filteredRequests.map(req => req.userName)).size}
                  </p>
                  <p className="text-xs text-purple-100">คน</p>
                </div>
                <div className="bg-purple-400/30 p-3 rounded-full">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Type Selection */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">ประเภทรายงาน:</span>
              <div className="flex gap-2">
                <Button 
                  variant={reportType === 'welfare' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReportType('welfare')}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  สวัสดิการ
                </Button>
                <Button 
                  variant={reportType === 'internal_training' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReportType('internal_training')}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  การอบรมภายใน
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5" /> ตัวกรองข้อมูล
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-center">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger><SelectValue placeholder="เลือกแผนก" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกแผนก</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger><SelectValue placeholder="เลือกพนักงาน" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">พนักงานทุกคน</SelectItem>
                  {employees
                    .filter(emp => departmentFilter === 'all' || emp.Team === departmentFilter)
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.Name || `ID: ${emp.id}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {reportType === 'welfare' && (
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger><SelectValue placeholder="ประเภทสวัสดิการ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกประเภท</SelectItem>
                    {Object.entries(welfareTypeLabels).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="สถานะ" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="pending_manager">รอผู้จัดการอนุมัติ</SelectItem>
                  <SelectItem value="pending_hr">รอ HR อนุมัติ</SelectItem>
                  <SelectItem value="pending_accounting">รอฝ่ายบัญชีตรวจสอบ</SelectItem>
                  <SelectItem value="completed">อนุมัติแล้ว</SelectItem>
                  <SelectItem value="rejected_manager">ผู้จัดการไม่อนุมัติ</SelectItem>
                  <SelectItem value="rejected_hr">HR ไม่อนุมัติ</SelectItem>
                  <SelectItem value="rejected_accounting">ฝ่ายบัญชีไม่อนุมัติ</SelectItem>
                </SelectContent>
              </Select>

              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          </CardContent>
        </Card>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Bar Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {reportType === 'welfare' 
                  ? 'สรุปการใช้สวัสดิการแยกตามประเภท' 
                  : 'สรุปค่าใช้จ่ายการอบรมภายในแยกตามหลักสูตร'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <Bar data={barData} options={barOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Status Doughnut Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                สถานะคำร้อง
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-4">
                <Doughnut data={statusData} options={doughnutOptions} />
              </div>
              <div className="space-y-2">
                {statusSummary.filter(s => s.count > 0).map((s) => (
                  <div key={s.status} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-700">{s.label}</span>
                    <span
                      className="font-bold text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
                      onClick={() => {
                        if (s.count > 0) {
                          setModalStatus(s.status as StatusType);
                          setModalOpen(true);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      style={{ userSelect: 'none' }}
                    >
                      {s.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                สรุปตามแผนก
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {departmentSummary.map((d, index) => (
                  <div key={d.department} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="text-gray-700 font-medium">{d.department}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 font-bold">{d.used.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</div>
                      <div className="text-gray-500 text-sm">{d.count} รายการ</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Welfare Type Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {reportType === 'welfare' 
                  ? 'ประเภทสวัสดิการยอดนิยม' 
                  : 'หลักสูตรการอบรมยอดนิยม'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {summaryByType
                  .sort((a, b) => b.used - a.used)
                  .slice(0, 8)
                  .map((item) => {
                    const trainingColors = reportType === 'internal_training' ? generateTrainingColors(summaryByType) : {};
                    return (
                      <div key={item.type} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: reportType === 'internal_training' 
                                ? trainingColors[item.type] || '#3b82f6'
                                : barColors[item.type] || '#3b82f6' 
                            }}
                          />
                          <span className="text-gray-700 text-sm font-medium truncate">
                            {reportType === 'welfare' 
                              ? (welfareTypeLabels[item.type as WelfareType] || item.type)
                              : item.type
                            }
                          </span>
                        </div>
                        <div className="text-gray-900 font-bold text-lg">
                          {item.used.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {item.count} รายการ
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal แสดงรายการคำร้องแต่ละสถานะ */}
        {modalOpen && modalStatus && (
          <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
            <div className="p-6 w-full max-w-4xl bg-white rounded-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  รายการคำร้องสถานะ {statusSummary.find(s => s.status === modalStatus)?.label || modalStatus}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-500 hover:text-red-500 text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-y-auto max-h-[70vh]">
                {(() => {
                  const filteredModalRequests = filteredRequests.filter(r => r.status === modalStatus);

                  return filteredModalRequests.length === 0 ? (
                    <div className="text-center text-gray-400 py-20">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">ไม่พบรายการคำร้อง</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white rounded-lg overflow-hidden border">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="py-3 px-4 text-left text-gray-900 font-semibold">วันที่</th>
                            <th className="py-3 px-4 text-left text-gray-900 font-semibold">ชื่อพนักงาน</th>
                            <th className="py-3 px-4 text-left text-gray-900 font-semibold">
                              {reportType === 'welfare' ? 'ประเภท' : 'หลักสูตร/สถานที่'}
                            </th>
                            <th className="py-3 px-4 text-right text-gray-900 font-semibold">จำนวนเงิน</th>
                            <th className="py-3 px-4 text-left text-gray-900 font-semibold">แผนก</th>
                            {reportType === 'internal_training' && (
                              <>
                                <th className="py-3 px-4 text-center text-gray-900 font-semibold">จำนวนผู้เข้าอบรม</th>
                                <th className="py-3 px-4 text-center text-gray-900 font-semibold">ชั่วโมง</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredModalRequests.map((r, i) => (
                            <tr key={r.id || i} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-700">
                                {new Date(r.date).toLocaleDateString('th-TH')}
                              </td>
                              <td className="py-3 px-4 text-gray-900 font-medium">{r.userName}</td>
                              <td className="py-3 px-4 text-gray-700">
                                {reportType === 'welfare' 
                                  ? (welfareTypeLabels[r.type] || r.type)
                                  : (r.courseName || r.venue || 'ไม่ระบุ')
                                }
                              </td>
                              <td className="py-3 px-4 text-right text-green-600 font-bold">
                                {Number(r.amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                              </td>
                              <td className="py-3 px-4 text-gray-700">{r.userDepartment || '-'}</td>
                              {reportType === 'internal_training' && (
                                <>
                                  <td className="py-3 px-4 text-center text-gray-700">
                                    {r.total_participants || '-'}
                                  </td>
                                  <td className="py-3 px-4 text-center text-gray-700">
                                    {r.total_hours || '-'}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
          </Modal>
        )}

        {/* Internal Training Specific Statistics */}
        {reportType === 'internal_training' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Training Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  สถิติการอบรมภายใน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50">
                    <span className="text-gray-700 font-medium">รวมจำนวนหลักสูตร</span>
                    <span className="text-blue-600 font-bold text-lg">
                      {new Set(filteredRequests.map(r => r.courseName)).size}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-green-50">
                    <span className="text-gray-700 font-medium">รวมผู้เข้าอบรม</span>
                    <span className="text-green-600 font-bold text-lg">
                      {filteredRequests.reduce((sum, r) => sum + (r.total_participants || 0), 0)} คน
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-purple-50">
                    <span className="text-gray-700 font-medium">รวมชั่วโมงการอบรม</span>
                    <span className="text-purple-600 font-bold text-lg">
                      {filteredRequests.reduce((sum, r) => sum + (r.total_hours || 0), 0)} ชั่วโมง
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-orange-50">
                    <span className="text-gray-700 font-medium">ค่าใช้จ่ายเฉลี่ยต่อคน</span>
                    <span className="text-orange-600 font-bold text-lg">
                      {(() => {
                        const totalParticipants = filteredRequests.reduce((sum, r) => sum + (r.total_participants || 0), 0);
                        const totalUsed = filteredRequests.reduce((sum, r) => r.status === 'completed' ? sum + r.amount : sum, 0);
                        return totalParticipants > 0 
                          ? (totalUsed / totalParticipants).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : '0.00';
                      })()} บาท
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Training Venues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  สถานที่อบรม
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {(() => {
                    const venueMap: Record<string, { count: number; participants: number }> = {};
                    filteredRequests.forEach(r => {
                      const venue = r.venue || 'ไม่ระบุสถานที่';
                      if (!venueMap[venue]) venueMap[venue] = { count: 0, participants: 0 };
                      venueMap[venue].count++;
                      venueMap[venue].participants += r.total_participants || 0;
                    });

                    return Object.entries(venueMap).map(([venue, data], index) => (
                      <div key={venue} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <span className="text-gray-700 font-medium">{venue}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-900 font-bold">{data.count} หลักสูตร</div>
                          <div className="text-gray-500 text-sm">{data.participants} คน</div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Individual Employee Welfare Usage - Show when viewing all departments and all employees */}
        {departmentFilter === 'all' && employeeFilter === 'all' && reportType === 'welfare' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                รายชื่อพนักงานและการใช้สวัสดิการ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="font-semibold text-blue-700 py-4 px-4 text-left sticky left-0 bg-blue-50 z-10 border-r border-blue-200">
                        ชื่อพนักงาน
                      </th>
                      <th className="font-semibold text-blue-700 py-4 px-3 text-left min-w-[120px]">แผนก</th>
                      {Object.entries(welfareTypeLabels).map(([type, label]) => (
                        <th key={type} className="font-semibold text-blue-700 py-4 px-3 text-right min-w-[100px]">
                          <div className="flex items-center justify-end gap-2">
                            <span
                              className="inline-block w-3 h-3 rounded-full"
                              style={{ backgroundColor: barColors[type] || '#3b82f6' }}
                            />
                            <span className="text-xs leading-tight">{label}</span>
                          </div>
                        </th>
                      ))}
                      <th className="font-semibold text-blue-700 py-4 px-4 text-right min-w-[120px] bg-blue-100">
                        รวมทั้งหมด
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Sort employees by department (Management first), then by name
                      const sortedEmployees = [...employees].sort((a, b) => {
                        const deptA = a.Team || 'ไม่ระบุ';
                        const deptB = b.Team || 'ไม่ระบุ';

                        if (deptA !== deptB) {
                          if (deptA.toLowerCase().includes('management')) return -1;
                          if (deptB.toLowerCase().includes('management')) return 1;
                          return deptA.localeCompare(deptB, 'th');
                        }
                        return (a.Name || '').localeCompare(b.Name || '', 'th');
                      });

                      return sortedEmployees.map((emp, index) => {
                        const empRequests = filteredRequests.filter(req => req.userName === emp.Name);
                        const welfareUsage: Record<string, number> = {};

                        // Initialize all welfare types
                        Object.keys(welfareTypeLabels).forEach(type => {
                          welfareUsage[type] = 0;
                        });

                        // Calculate usage for each type (only completed requests)
                        empRequests.forEach(req => {
                          if (req.status === 'completed') {
                            welfareUsage[req.type] = (welfareUsage[req.type] || 0) + req.amount;
                          }
                        });

                        const totalUsage = Object.values(welfareUsage).reduce((sum, amount) => sum + amount, 0);
                        const hasUsage = totalUsage > 0;

                        return (
                          <tr
                            key={emp.id}
                            className={`border-b border-gray-100 transition-colors ${hasUsage ? 'hover:bg-blue-50/30' : 'hover:bg-gray-50/50'
                              } ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                          >
                            <td className="py-3 px-4 font-medium text-gray-900 sticky left-0 bg-inherit z-10 border-r border-gray-200">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${hasUsage ? 'bg-green-500' : 'bg-gray-300'}`} />
                                <span className="truncate max-w-[150px]" title={emp.Name}>
                                  {emp.Name || `ID: ${emp.id}`}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-gray-600 text-xs">
                              <span className="inline-block px-2 py-1 bg-gray-100 rounded-full">
                                {emp.Team || 'ไม่ระบุ'}
                              </span>
                            </td>
                            {Object.keys(welfareTypeLabels).map(type => {
                              const amount = welfareUsage[type];
                              return (
                                <td key={type} className="py-3 px-3 text-right">
                                  {amount > 0 ? (
                                    <span className="font-semibold text-green-600">
                                      {amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="py-3 px-4 text-right bg-blue-50/50">
                              {totalUsage > 0 ? (
                                <div className="font-bold text-blue-600 text-base">
                                  {totalUsage.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  <div className="text-xs text-gray-500 font-normal">บาท</div>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">ไม่มีการใช้</span>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>มีการใช้สวัสดิการ</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <span>ยังไม่มีการใช้สวัสดิการ</span>
                </div>
                <div className="ml-auto text-gray-500">
                  แสดงเฉพาะคำร้องที่อนุมัติแล้ว
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Internal Training Detail Report */}
        {reportType === 'internal_training' && departmentFilter === 'all' && employeeFilter === 'all' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                รายละเอียดการอบรมภายใน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gradient-to-r from-green-50 to-blue-50">
                    <tr>
                      <th className="font-semibold text-blue-700 py-4 px-4 text-left sticky left-0 bg-green-50 z-10 border-r border-blue-200">
                        หลักสูตร
                      </th>
                      <th className="font-semibold text-blue-700 py-4 px-3 text-left min-w-[120px]">สถานที่</th>
                      <th className="font-semibold text-blue-700 py-4 px-3 text-center min-w-[100px]">ผู้เข้าอบรม</th>
                      <th className="font-semibold text-blue-700 py-4 px-3 text-center min-w-[100px]">ชั่วโมง</th>
                      <th className="font-semibold text-blue-700 py-4 px-3 text-right min-w-[120px]">ค่าใช้จ่าย</th>
                      <th className="font-semibold text-blue-700 py-4 px-3 text-center min-w-[100px]">วันที่</th>
                      <th className="font-semibold text-blue-700 py-4 px-4 text-center min-w-[120px] bg-blue-100">
                        สถานะ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((req, index) => (
                        <tr
                          key={req.id}
                          className={`border-b border-gray-100 transition-colors hover:bg-blue-50/30 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                          }`}
                        >
                          <td className="py-3 px-4 font-medium text-gray-900 sticky left-0 bg-inherit z-10 border-r border-gray-200">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                req.status === 'completed' ? 'bg-green-500' : 
                                req.status.includes('pending') ? 'bg-yellow-500' : 'bg-red-500'
                              }`} />
                              <span className="truncate max-w-[200px]" title={req.courseName || req.description}>
                                {req.courseName || req.description || 'ไม่ระบุหลักสูตร'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-gray-600 text-xs">
                            <span className="inline-block px-2 py-1 bg-gray-100 rounded-full">
                              {req.venue || 'ไม่ระบุ'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-semibold text-blue-600">
                              {req.total_participants || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-semibold text-purple-600">
                              {req.total_hours || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="font-semibold text-green-600">
                              {req.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-gray-600 text-xs">
                            {new Date(req.date).toLocaleDateString('th-TH')}
                          </td>
                          <td className="py-3 px-4 text-center bg-blue-50/50">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              req.status === 'completed' ? 'bg-green-100 text-green-800' :
                              req.status.includes('pending') ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {statusSummary.find(s => s.status === req.status)?.label || req.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>อนุมัติแล้ว</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span>รอดำเนินการ</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span>ไม่อนุมัติ</span>
                </div>
                <div className="ml-auto text-gray-500">
                  รวม {filteredRequests.length} หลักสูตร
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employee Summary */}
        {employeeFilter !== 'all' && employeeWelfareSummary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                สรุปสวัสดิการของ {employees.find(e => e.id.toString() === employeeFilter)?.Name || ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white p-4">
                <table className="min-w-full text-base text-gray-700">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="font-semibold text-blue-700 text-base py-3 px-2 text-left">ประเภทสวัสดิการ</th>
                      <th className="font-semibold text-blue-700 text-base py-3 px-2 text-right">วงเงินทั้งหมด</th>
                      <th className="font-semibold text-blue-700 text-base py-3 px-2 text-right">ใช้ไปแล้ว</th>
                      <th className="font-semibold text-blue-700 text-base py-3 px-2 text-right">คงเหลือ</th>
                      <th className="w-[200px] font-semibold text-blue-700 text-base py-3 px-2 text-center">สัดส่วนการใช้</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeWelfareSummary.map((w) => {
                      const percentRemaining = w.limit > 0 ? (w.remaining / w.limit) * 100 : 0;
                      const percentUsed = w.limit > 0 ? (w.used / w.limit) * 100 : 0;
                      return (
                        <tr key={w.type} className="border-b border-gray-200 hover:bg-blue-50/50 transition-colors">
                          <td className="font-medium flex items-center gap-3 py-4 px-2">
                            <span
                              className="inline-block w-4 h-4 rounded-full shadow-lg"
                              style={{ background: barColors[w.type] || '#3b82f6' }}
                            />
                            <span className="text-gray-900 text-base">{w.label}</span>
                          </td>
                          <td className="text-right px-2 text-gray-700">
                            {w.limit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-xs text-gray-400 ml-1">บาท</span>
                          </td>
                          <td className="text-right px-2 text-green-600 font-semibold">
                            {w.used.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-xs text-gray-400 ml-1">บาท</span>
                          </td>
                          <td className="text-right px-2 text-blue-600 font-semibold">
                            {w.remaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-xs text-gray-400 ml-1">บาท</span>
                          </td>
                          <td className="text-center px-2">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                                <div
                                  className="h-full rounded-full transition-all duration-500 shadow-sm"
                                  style={{
                                    width: `${percentUsed}%`,
                                    background: `linear-gradient(90deg, ${barColors[w.type] || '#3b82f6'}, ${barColors[w.type] || '#3b82f6'}dd)`
                                  }}
                                />
                              </div>
                              <span className="text-gray-900 font-bold text-sm w-12 text-right">
                                {Math.round(percentUsed)}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ใช้ไปแล้ว
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminReport;