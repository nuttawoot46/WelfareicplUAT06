import { useMemo, useState, useEffect } from 'react';
import { useWelfare } from '@/context/WelfareContext';
import { useInternalTraining } from '@/context/InternalTrainingContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Download, Filter, TrendingUp, Users, FileText, BookOpen, GraduationCap, Building2 } from 'lucide-react';
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
  dental: 'ค่ารักษาทันตกรรม / ค่าตัดแว่นสายตา',
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
  csv += reportType === 'internal_training' ? 'รายงานสรุปการอบรมภายใน\r\n' : reportType === 'external_training' ? 'รายงานสรุปการอบรมภายนอก\r\n' : 'รายงานสรุปการใช้สวัสดิการ\r\n';
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
        csv += `"${req.courseName || req.title || req.details || 'ไม่ระบุ'}","${req.venue || 'ไม่ระบุ'}","${new Date(req.date).toLocaleDateString('th-TH')}","${req.totalParticipants || 0}","${req.totalHours || 0}","${req.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}","${statusSummary.find((s: any) => s.status === req.status)?.label || req.status}","${req.additionalNotes || 'ไม่มี'}"\r\n`;
      });
    } else if (reportType === 'external_training') {
      csv += 'รายละเอียดการอบรมภายนอกทั้งหมด\r\n';
      csv += 'หลักสูตร,ผู้จัดอบรม,ชื่อพนักงาน,แผนก,วันที่เริ่ม,วันที่สิ้นสุด,จำนวนวัน,ค่าใช้จ่าย,สถานะ\r\n';

      filteredRequests.forEach((req: any) => {
        csv += `"${req.course_name || req.title || req.details || 'ไม่ระบุ'}","${req.organizer || 'ไม่ระบุ'}","${req.userName}","${req.userDepartment || 'ไม่ระบุ'}","${req.start_date ? new Date(req.start_date).toLocaleDateString('th-TH') : new Date(req.date).toLocaleDateString('th-TH')}","${req.end_date ? new Date(req.end_date).toLocaleDateString('th-TH') : '-'}","${req.total_days || 0}","${req.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}","${statusSummary.find((s: any) => s.status === req.status)?.label || req.status}"\r\n`;
      });
    } else {
      csv += 'รายละเอียดการเบิกสวัสดิการของพนักงานทุกคน\r\n';
      csv += 'ชื่อพนักงาน,แผนก,ค่าแต่งงาน,ค่าอบรม,ค่าคลอดบุตร,ค่าช่วยเหลืองานศพ,ค่าตัดแว่นสายตา,ค่ารักษาทันตกรรม,ค่าออกกำลังกาย,ค่ารักษาพยาบาล,รวมทั้งหมด\r\n';

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
    }
    csv += '\r\n';
  }

  // สรุปข้อมูลแยกตามประเภท
  if (reportType === 'internal_training') {
    csv += 'สรุปการอบรมภายในแยกตามหลักสูตร\r\n';
    csv += 'หลักสูตร/สถานที่,จำนวนครั้ง (รายการ),ค่าใช้จ่าย (บาท)\r\n';
  } else if (reportType === 'external_training') {
    csv += 'สรุปการอบรมภายนอกแยกตามหลักสูตร\r\n';
    csv += 'หลักสูตร,จำนวนคำร้อง (รายการ),ค่าใช้จ่าย (บาท)\r\n';
  } else {
    csv += 'สรุปการใช้สวัสดิการแยกตามประเภท\r\n';
    csv += 'ประเภทสวัสดิการ,จำนวนคำร้อง (รายการ),ยอดเงินที่ใช้ไป (บาท)\r\n';
  }

  summaryByType.forEach((row: any) => {
    const typeLabel = reportType !== 'welfare' ? row.type : (welfareTypeLabels[row.type as WelfareType] || row.type);
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
      csv += `"${new Date(req.date).toLocaleDateString('th-TH')}","${req.id || 'ไม่ระบุ'}","${req.courseName || req.title || req.details || 'ไม่ระบุ'}","${req.venue || 'ไม่ระบุ'}","${req.totalParticipants || 0}","${req.totalHours || 0}","${req.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}","${statusSummary.find((s: any) => s.status === req.status)?.label || req.status}","${req.additionalNotes || 'ไม่มี'}"\r\n`;
    });
  } else if (reportType === 'external_training') {
    csv += 'วันที่ยื่นคำร้อง,รหัสคำร้อง,หลักสูตร,ผู้จัดอบรม,ชื่อพนักงาน,แผนก,วันที่เริ่ม,วันที่สิ้นสุด,จำนวนวัน,ค่าใช้จ่าย (บาท),สถานะ\r\n';
    filteredRequests.forEach((req: any) => {
      csv += `"${new Date(req.date).toLocaleDateString('th-TH')}","${req.id || 'ไม่ระบุ'}","${req.course_name || req.title || req.details || 'ไม่ระบุ'}","${req.organizer || 'ไม่ระบุ'}","${req.userName}","${req.userDepartment || 'ไม่ระบุ'}","${req.start_date ? new Date(req.start_date).toLocaleDateString('th-TH') : '-'}","${req.end_date ? new Date(req.end_date).toLocaleDateString('th-TH') : '-'}","${req.total_days || 0}","${req.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}","${statusSummary.find((s: any) => s.status === req.status)?.label || req.status}"\r\n`;
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
    : reportType === 'external_training'
      ? `external_training_report_${dateStr}.csv`
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
  const [reportType, setReportType] = useState<'welfare' | 'internal_training' | 'external_training'>('welfare');

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
    const requests = reportType === 'welfare'
      ? welfareRequests
      : reportType === 'internal_training'
        ? trainingRequests
        : welfareRequests.filter(r => r.type === 'training');
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
        const key = req.courseName || req.title || req.details || 'ไม่ระบุ';
        if (!map[key]) map[key] = { count: 0, used: 0, remaining: 0 };
        map[key].count++;
        if (req.status === 'completed') {
          map[key].used += req.amount;
        }
      });

      return Object.entries(map).map(([type, v]) => ({ type, ...v }));
    } else if (reportType === 'external_training') {
      // External training: group by course_name
      const map: Record<string, { count: number; used: number; remaining: number }> = {};

      filteredRequests.forEach((req) => {
        const key = req.course_name || req.title || req.details || 'ไม่ระบุ';
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
      'pending_revision': 0,
    };

    filteredRequests.forEach((req) => {
      detailedMap[req.status]++;
    });

    return [
      { status: 'pending_manager', count: detailedMap['pending_manager'], label: 'รอผู้จัดการอนุมัติ' },
      { status: 'pending_hr', count: detailedMap['pending_hr'], label: 'รอ HR อนุมัติ' },
      { status: 'pending_accounting', count: detailedMap['pending_accounting'], label: 'รอฝ่ายบัญชีตรวจสอบ' },
      { status: 'pending_revision', count: detailedMap['pending_revision'], label: 'รอเอกสารเพิ่มเติม' },
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

  // External training computed data (memoized to prevent flickering)
  const externalTrainingStats = useMemo(() => {
    if (reportType !== 'external_training') return null;
    const uniqueCourses = new Set(filteredRequests.map(r => r.course_name || r.title || r.details)).size;
    const uniqueEmployees = new Set(filteredRequests.map(r => r.userName)).size;
    const totalDays = filteredRequests.reduce((sum, r) => sum + (r.total_days || 0), 0);
    const completedRequests = filteredRequests.filter(r => r.status === 'completed');
    const uniqueCompletedEmp = new Set(completedRequests.map(r => r.userName)).size;
    const totalCompletedAmt = completedRequests.reduce((sum, r) => sum + r.amount, 0);
    const avgCost = uniqueCompletedEmp > 0 ? totalCompletedAmt / uniqueCompletedEmp : 0;
    return { uniqueCourses, uniqueEmployees, totalDays, avgCost };
  }, [filteredRequests, reportType]);

  const organizerSummary = useMemo(() => {
    if (reportType !== 'external_training') return [];
    const orgMap: Record<string, { count: number; amount: number }> = {};
    filteredRequests.forEach(r => {
      const org = r.organizer || 'ไม่ระบุ';
      if (!orgMap[org]) orgMap[org] = { count: 0, amount: 0 };
      orgMap[org].count++;
      if (r.status === 'completed') orgMap[org].amount += r.amount;
    });
    const sorted = Object.entries(orgMap).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
    const maxCount = sorted.length > 0 ? sorted[0][1].count : 1;
    return sorted.map(([org, data]) => ({ org, count: data.count, amount: data.amount, pct: (data.count / maxCount) * 100 }));
  }, [filteredRequests, reportType]);

  const externalDeptSummary = useMemo(() => {
    if (reportType !== 'external_training') return [];
    const deptMap: Record<string, { people: Set<string>; days: number; amount: number }> = {};
    filteredRequests.forEach(r => {
      const dept = r.userDepartment || 'ไม่ระบุ';
      if (!deptMap[dept]) deptMap[dept] = { people: new Set(), days: 0, amount: 0 };
      deptMap[dept].people.add(r.userName);
      deptMap[dept].days += r.total_days || 0;
      if (r.status === 'completed') deptMap[dept].amount += r.amount;
    });
    const sorted = Object.entries(deptMap).sort((a, b) => b[1].amount - a[1].amount);
    const maxAmount = sorted.length > 0 ? Math.max(...sorted.map(s => s[1].amount)) : 1;
    return sorted.map(([dept, data]) => ({
      dept, peopleCount: data.people.size, days: data.days, amount: data.amount, pct: (data.amount / (maxAmount || 1)) * 100,
    }));
  }, [filteredRequests, reportType]);

  const popularCourses = useMemo(() => {
    if (reportType !== 'external_training') return [];
    const courseMap: Record<string, { count: number; amount: number; latestStatus: string }> = {};
    filteredRequests.forEach(r => {
      const course = r.course_name || r.title || r.details || 'ไม่ระบุ';
      if (!courseMap[course]) courseMap[course] = { count: 0, amount: 0, latestStatus: r.status };
      courseMap[course].count++;
      if (r.status === 'completed') courseMap[course].amount += r.amount;
      courseMap[course].latestStatus = r.status;
    });
    return Object.entries(courseMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([course, data]) => ({ course, ...data }));
  }, [filteredRequests, reportType]);

  // External training bar chart: by department or by employee
  const externalBarData = useMemo(() => {
    if (reportType !== 'external_training') return null;
    const colors = ['#0071e3', '#34c759', '#ff9500', '#af52de', '#5ac8fa', '#ff3b30', '#ff6482', '#30d158', '#64d2ff', '#bf5af2'];

    if (departmentFilter !== 'all') {
      // Group by employee within selected department
      const empMap: Record<string, number> = {};
      filteredRequests.forEach(r => {
        const name = r.userName || 'ไม่ระบุ';
        empMap[name] = (empMap[name] || 0) + r.amount;
      });
      const sorted = Object.entries(empMap).sort((a, b) => b[1] - a[1]);
      return {
        labels: sorted.map(([name]) => name),
        datasets: [{
          label: 'ค่าใช้จ่าย (บาท)',
          data: sorted.map(([, amt]) => amt),
          backgroundColor: sorted.map((_, i) => colors[i % colors.length]),
          borderColor: sorted.map((_, i) => colors[i % colors.length]),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false as const,
        }],
      };
    } else {
      // Group by department
      const deptMap: Record<string, number> = {};
      filteredRequests.forEach(r => {
        const dept = r.userDepartment || 'ไม่ระบุ';
        deptMap[dept] = (deptMap[dept] || 0) + r.amount;
      });
      const sorted = Object.entries(deptMap).sort((a, b) => b[1] - a[1]);
      return {
        labels: sorted.map(([dept]) => dept),
        datasets: [{
          label: 'ค่าใช้จ่าย (บาท)',
          data: sorted.map(([, amt]) => amt),
          backgroundColor: sorted.map((_, i) => colors[i % colors.length]),
          borderColor: sorted.map((_, i) => colors[i % colors.length]),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false as const,
        }],
      };
    }
  }, [filteredRequests, reportType, departmentFilter]);

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
    const trainingColors = reportType !== 'welfare' ? generateTrainingColors(summaryByType) : {};

    return {
      labels: summaryByType.map((d) => {
        if (reportType !== 'welfare') {
          return d.type;
        }
        return welfareTypeLabels[d.type as WelfareType] || d.type;
      }),
      datasets: [
        {
          label: reportType === 'welfare' ? 'ยอดใช้ไป (บาท)' : 'ค่าใช้จ่าย (บาท)',
          data: summaryByType.map((d) => d.used),
          backgroundColor: summaryByType.map((d) =>
            reportType !== 'welfare'
              ? trainingColors[d.type] || '#3b82f6'
              : barColors[d.type] || '#3b82f6'
          ),
          borderColor: summaryByType.map((d) =>
            reportType !== 'welfare'
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
            size: 12,
            weight: 'normal' as const,
          },
          color: '#86868b',
        },
      },
      tooltip: {
        backgroundColor: '#1d1d1f',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#424245',
        borderWidth: 0,
        cornerRadius: 10,
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
            size: 11,
            weight: 'normal' as const,
          },
          color: '#86868b',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f5f5f7',
          lineWidth: 1,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#86868b',
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
        backgroundColor: ['#34c759', '#ff9500', '#ff3b30'],
        borderWidth: 0,
        cutout: '72%',
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
            size: 11,
          },
          color: '#86868b',
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#1d1d1f',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderWidth: 0,
        cornerRadius: 10,
      },
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Apple-style Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-1 text-[#0071e3] text-sm font-medium hover:underline mb-4 transition-colors"
          >
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="mt-px"><path d="M6 1L1 6l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ย้อนกลับ
          </button>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight text-[#1d1d1f]">
                {reportType === 'welfare' ? 'ภาพรวมสวัสดิการ' : reportType === 'internal_training' ? 'ภาพรวมการอบรมภายใน' : 'ภาพรวมการอบรมภายนอก'}
              </h1>
              <p className="text-[#86868b] text-[15px] mt-1">
                {reportType === 'welfare'
                  ? 'รายงานและสถิติการใช้งานสวัสดิการของบริษัท'
                  : reportType === 'internal_training'
                    ? 'รายงานและสถิติการอบรมภายในของบริษัท'
                    : 'รายงานและสถิติการอบรมภายนอกของบริษัท'
                }
              </p>
            </div>
            <button
              disabled={!dateRange?.from || !dateRange?.to}
              onClick={() => exportReportToCSV({
                summaryByType, statusSummary, departmentSummary, welfareTypeLabels,
                filteredRequests, employees, departmentFilter, employeeFilter, dateRange, reportType
              })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1d1d1f] text-white text-sm font-medium hover:bg-[#424245] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              ดาวน์โหลดรายงาน
            </button>
          </div>
        </div>

        {/* Apple Segmented Control */}
        <div className="inline-flex items-center bg-[#e8e8ed] rounded-full p-[3px] mb-6">
          {([
            { key: 'welfare', label: 'สวัสดิการ', icon: FileText },
            { key: 'internal_training', label: 'อบรมภายใน', icon: BookOpen },
            { key: 'external_training', label: 'อบรมภายนอก', icon: GraduationCap },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setReportType(key)}
              className={`inline-flex items-center gap-1.5 px-4 py-[7px] rounded-full text-[13px] font-medium transition-all ${
                reportType === key
                  ? 'bg-white text-[#1d1d1f] shadow-sm'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Apple-style Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/40 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-[#86868b]" />
            <span className="text-[13px] font-medium text-[#86868b] uppercase tracking-wide">ตัวกรอง</span>
          </div>
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
                  <SelectItem value="pending_revision">รอเอกสารเพิ่มเติม</SelectItem>
                  <SelectItem value="completed">อนุมัติแล้ว</SelectItem>
                  <SelectItem value="rejected_manager">ผู้จัดการไม่อนุมัติ</SelectItem>
                  <SelectItem value="rejected_hr">HR ไม่อนุมัติ</SelectItem>
                  <SelectItem value="rejected_accounting">ฝ่ายบัญชีไม่อนุมัติ</SelectItem>
                </SelectContent>
              </Select>

              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
        </div>

        {/* Analytics */}
        {reportType !== 'external_training' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/40 p-5">
            <h3 className="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#86868b]" />
              {reportType === 'welfare'
                ? 'สรุปการใช้สวัสดิการแยกตามประเภท'
                : 'สรุปค่าใช้จ่ายการอบรมภายในแยกตามหลักสูตร'
              }
            </h3>
            <div className="h-96">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/40 p-5">
            <h3 className="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-[#86868b]" />
              สถานะคำร้อง
            </h3>
            <div className="h-56 mb-4">
              <Doughnut data={statusData} options={doughnutOptions} />
            </div>
            <div className="space-y-1">
              {statusSummary.filter(s => s.count > 0).map((s) => (
                <div key={s.status} className="flex justify-between items-center py-2 px-3 rounded-xl hover:bg-[#f5f5f7] transition-colors">
                  <span className="text-[13px] text-[#1d1d1f]">{s.label}</span>
                  <span
                    className="text-[13px] font-semibold text-[#0071e3] cursor-pointer hover:underline tabular-nums"
                    onClick={() => { if (s.count > 0) { setModalStatus(s.status as StatusType); setModalOpen(true); } }}
                    role="button"
                    tabIndex={0}
                  >
                    {s.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Department & Type Summary */}
        {reportType !== 'external_training' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/40 p-5">
            <h3 className="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-[#86868b]" />
              สรุปตามแผนก
            </h3>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {departmentSummary.map((d, index) => (
                <div key={d.department} className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-[#f5f5f7] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#e8e8ed] flex items-center justify-center text-[11px] font-semibold text-[#86868b]">
                      {index + 1}
                    </span>
                    <span className="text-[13px] font-medium text-[#1d1d1f]">{d.department}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-semibold text-[#1d1d1f] tabular-nums">{d.used.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</div>
                    <div className="text-[11px] text-[#86868b]">{d.count} รายการ</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/40 p-5">
            <h3 className="text-[15px] font-semibold text-[#1d1d1f] mb-4">
              {reportType === 'welfare'
                ? 'ประเภทสวัสดิการยอดนิยม'
                : 'หลักสูตรการอบรมยอดนิยม'
              }
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {summaryByType
                .sort((a, b) => b.used - a.used)
                .slice(0, 8)
                .map((item) => {
                  const trainingColors = reportType === 'internal_training' ? generateTrainingColors(summaryByType) : {};
                  return (
                    <div key={item.type} className="p-3 rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: reportType === 'internal_training'
                              ? trainingColors[item.type] || '#3b82f6'
                              : barColors[item.type] || '#3b82f6'
                          }}
                        />
                        <span className="text-[12px] font-medium text-[#6e6e73] truncate">
                          {reportType === 'welfare'
                            ? (welfareTypeLabels[item.type as WelfareType] || item.type)
                            : item.type
                          }
                        </span>
                      </div>
                      <div className="text-[15px] font-semibold text-[#1d1d1f] tabular-nums">
                        {item.used.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-[#86868b]">
                        {item.count} รายการ
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
        )}

        {/* External Training Layout - Row 1: Charts */}
        {reportType === 'external_training' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            {/* Bar Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/40 p-5">
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-[#86868b]" />
                {departmentFilter !== 'all'
                  ? `สรุปค่าใช้จ่ายรายพนักงาน — ${departmentFilter}`
                  : 'สรุปค่าใช้จ่ายตามแผนก'
                }
              </h3>
              <div className="h-80">
                {externalBarData && <Bar data={externalBarData} options={barOptions} />}
              </div>
            </div>

            {/* Status Donut */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/40 p-5">
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-[#86868b]" /> สถานะคำร้อง
              </h3>
              <div className="h-56 mb-4">
                <Doughnut data={statusData} options={doughnutOptions} />
              </div>
              <div className="space-y-1">
                {statusSummary.filter(s => s.count > 0).map((s) => (
                  <div key={s.status} className="flex justify-between items-center py-2 px-3 rounded-xl hover:bg-[#f5f5f7] transition-colors">
                    <span className="text-[13px] text-[#1d1d1f]">{s.label}</span>
                    <span
                      className="text-[13px] font-semibold text-[#0071e3] cursor-pointer hover:underline tabular-nums"
                      onClick={() => { if (s.count > 0) { setModalStatus(s.status as StatusType); setModalOpen(true); } }}
                      role="button" tabIndex={0}
                    >{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* External Training Layout - Row 2: Department & Course Summary */}
        {reportType === 'external_training' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* Department List (ranked) */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/40 p-5">
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-[#86868b]" /> สรุปตามแผนก
              </h3>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {externalDeptSummary.map((d, index) => (
                  <div key={d.dept} className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-[#f5f5f7] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#e8e8ed] flex items-center justify-center text-[11px] font-semibold text-[#86868b]">
                        {index + 1}
                      </span>
                      <div>
                        <span className="text-[13px] font-medium text-[#1d1d1f]">{d.dept}</span>
                        <div className="text-[11px] text-[#86868b]">{d.peopleCount} คน · {d.days} วัน</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] font-semibold text-[#1d1d1f] tabular-nums">
                        {d.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Summary Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/40 p-5">
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2 mb-4">
                <GraduationCap className="w-4 h-4 text-[#86868b]" /> หลักสูตรยอดนิยม
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(() => {
                  const colors = ['#0071e3', '#34c759', '#ff9500', '#af52de', '#5ac8fa', '#ff3b30', '#ff6482', '#30d158', '#64d2ff', '#bf5af2'];
                  return summaryByType
                    .sort((a, b) => b.used - a.used)
                    .slice(0, 8)
                    .map((item, i) => (
                      <div key={item.type} className="p-3 rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: colors[i % colors.length] }}
                          />
                          <span className="text-[12px] font-medium text-[#6e6e73] truncate">{item.type}</span>
                        </div>
                        <div className="text-[15px] font-semibold text-[#1d1d1f] tabular-nums">
                          {item.used.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-[#86868b]">
                          {item.count} รายการ
                        </div>
                      </div>
                    ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {modalOpen && modalStatus && (
          <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
            <div className="p-6 w-full max-w-4xl bg-white rounded-2xl">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-[20px] font-semibold tracking-tight text-[#1d1d1f]">
                  {statusSummary.find(s => s.status === modalStatus)?.label || modalStatus}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#e8e8ed] hover:bg-[#d2d2d7] flex items-center justify-center text-[#86868b] text-sm transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-y-auto max-h-[70vh]">
                {(() => {
                  const filteredModalRequests = filteredRequests.filter(r => r.status === modalStatus);

                  return filteredModalRequests.length === 0 ? (
                    <div className="text-center py-20">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-[#d2d2d7]" />
                      <p className="text-[15px] text-[#86868b]">ไม่พบรายการคำร้อง</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-[#d2d2d7]/40">
                      <table className="min-w-full text-[13px]">
                        <thead>
                          <tr className="border-b border-[#d2d2d7]/40 bg-[#f5f5f7]">
                            <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">วันที่</th>
                            <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">ชื่อพนักงาน</th>
                            <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                              {reportType === 'welfare' ? 'ประเภท' : 'หลักสูตร/สถานที่'}
                            </th>
                            <th className="py-2.5 px-4 text-right text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">จำนวนเงิน</th>
                            <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">แผนก</th>
                            {reportType === 'internal_training' && (
                              <>
                                <th className="py-2.5 px-4 text-center text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">ผู้เข้าอบรม</th>
                                <th className="py-2.5 px-4 text-center text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">ชั่วโมง</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredModalRequests.map((r, i) => (
                            <tr key={r.id || i} className="border-b border-[#d2d2d7]/20 hover:bg-[#f5f5f7] transition-colors">
                              <td className="py-2.5 px-4 text-[#6e6e73] tabular-nums">
                                {new Date(r.date).toLocaleDateString('th-TH')}
                              </td>
                              <td className="py-2.5 px-4 text-[#1d1d1f] font-medium">{r.userName}</td>
                              <td className="py-2.5 px-4 text-[#6e6e73]">
                                {reportType === 'welfare'
                                  ? (welfareTypeLabels[r.type] || r.type)
                                  : (r.courseName || r.title || r.details || 'ไม่ระบุ')
                                }
                              </td>
                              <td className="py-2.5 px-4 text-right font-semibold text-[#34c759] tabular-nums">
                                {Number(r.amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                              </td>
                              <td className="py-2.5 px-4 text-[#6e6e73]">{r.userDepartment || '-'}</td>
                              {reportType === 'internal_training' && (
                                <>
                                  <td className="py-2.5 px-4 text-center text-[#6e6e73] tabular-nums">
                                    {r.totalParticipants || '-'}
                                  </td>
                                  <td className="py-2.5 px-4 text-center text-[#6e6e73] tabular-nums">
                                    {r.totalHours || '-'}
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

        {/* Internal Training Statistics */}
        {reportType === 'internal_training' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/40 p-5">
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-[#86868b]" />
                สถิติการอบรมภายใน
              </h3>
              <div className="space-y-0">
                {[
                  { label: 'รวมจำนวนหลักสูตร', value: new Set(filteredRequests.map(r => r.courseName || r.title || r.details)).size, color: 'text-[#0071e3]' },
                  { label: 'รวมผู้เข้าอบรม', value: `${filteredRequests.reduce((sum, r) => sum + (r.totalParticipants || 0), 0)} คน`, color: 'text-[#34c759]' },
                  { label: 'รวมชั่วโมงการอบรม', value: `${filteredRequests.reduce((sum, r) => sum + (r.totalHours || 0), 0)} ชั่วโมง`, color: 'text-[#af52de]' },
                  { label: 'ค่าใช้จ่ายเฉลี่ยต่อคน', value: `${(() => { const tp = filteredRequests.reduce((s, r) => s + (r.totalParticipants || 0), 0); const tu = filteredRequests.reduce((s, r) => r.status === 'completed' ? s + r.amount : s, 0); return tp > 0 ? (tu / tp).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'; })()} บาท`, color: 'text-[#ff9500]' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between py-3 border-b border-[#d2d2d7]/20 last:border-0">
                    <span className="text-[13px] text-[#86868b]">{stat.label}</span>
                    <span className={`text-[15px] font-semibold tabular-nums ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/40 p-5">
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-[#86868b]" />
                สถานที่อบรม
              </h3>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {(() => {
                  const venueMap: Record<string, { count: number; participants: number }> = {};
                  filteredRequests.forEach(r => {
                    const venue = r.venue || 'ไม่ระบุสถานที่';
                    if (!venueMap[venue]) venueMap[venue] = { count: 0, participants: 0 };
                    venueMap[venue].count++;
                    venueMap[venue].participants += r.totalParticipants || 0;
                  });

                  return Object.entries(venueMap).map(([venue, data], index) => (
                    <div key={venue} className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-[#f5f5f7] transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#e8e8ed] flex items-center justify-center text-[11px] font-semibold text-[#86868b]">
                          {index + 1}
                        </span>
                        <span className="text-[13px] font-medium text-[#1d1d1f]">{venue}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] font-semibold text-[#1d1d1f] tabular-nums">{data.count} หลักสูตร</div>
                        <div className="text-[11px] text-[#86868b]">{data.participants} คน</div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Employee Welfare Usage */}
        {departmentFilter === 'all' && employeeFilter === 'all' && reportType === 'welfare' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/40 mb-6 overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#86868b]" />
                รายชื่อพนักงานและการใช้สวัสดิการ
              </h3>
            </div>
            <div className="px-5 pb-5">
              <div className="overflow-x-auto rounded-xl border border-[#d2d2d7]/40">
                <table className="min-w-full text-[13px]">
                  <thead>
                    <tr className="bg-[#f5f5f7] border-b border-[#d2d2d7]/40">
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-4 text-left sticky left-0 bg-[#f5f5f7] z-10">
                        ชื่อพนักงาน
                      </th>
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-3 text-left min-w-[100px]">แผนก</th>
                      {Object.entries(welfareTypeLabels).map(([type, label]) => (
                        <th key={type} className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-3 text-right min-w-[90px]">
                          <div className="flex items-center justify-end gap-1.5">
                            <span
                              className="inline-block w-2 h-2 rounded-full"
                              style={{ backgroundColor: barColors[type] || '#3b82f6' }}
                            />
                            <span className="leading-tight">{label}</span>
                          </div>
                        </th>
                      ))}
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-4 text-right min-w-[110px] bg-[#e8e8ed]">
                        รวม
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
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

                      return sortedEmployees.map((emp) => {
                        const empRequests = filteredRequests.filter(req => req.userName === emp.Name);
                        const welfareUsage: Record<string, number> = {};
                        Object.keys(welfareTypeLabels).forEach(type => { welfareUsage[type] = 0; });
                        empRequests.forEach(req => {
                          if (req.status === 'completed') {
                            welfareUsage[req.type] = (welfareUsage[req.type] || 0) + req.amount;
                          }
                        });
                        const totalUsage = Object.values(welfareUsage).reduce((sum, amount) => sum + amount, 0);
                        const hasUsage = totalUsage > 0;

                        return (
                          <tr key={emp.id} className="border-b border-[#d2d2d7]/20 hover:bg-[#f5f5f7] transition-colors">
                            <td className="py-2.5 px-4 font-medium text-[#1d1d1f] sticky left-0 bg-white z-10">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${hasUsage ? 'bg-[#34c759]' : 'bg-[#d2d2d7]'}`} />
                                <span className="truncate max-w-[150px]" title={emp.Name}>
                                  {emp.Name || `ID: ${emp.id}`}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-[12px] text-[#86868b]">
                              {emp.Team || 'ไม่ระบุ'}
                            </td>
                            {Object.keys(welfareTypeLabels).map(type => {
                              const amount = welfareUsage[type];
                              return (
                                <td key={type} className="py-2.5 px-3 text-right tabular-nums">
                                  {amount > 0 ? (
                                    <span className="font-semibold text-[#34c759]">
                                      {amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  ) : (
                                    <span className="text-[#d2d2d7]">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="py-2.5 px-4 text-right bg-[#f5f5f7]/50">
                              {totalUsage > 0 ? (
                                <span className="font-semibold text-[#0071e3] tabular-nums">
                                  {totalUsage.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              ) : (
                                <span className="text-[#d2d2d7] text-[12px]">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center gap-4 text-[12px] text-[#86868b]">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#34c759]" />
                  <span>มีการใช้สวัสดิการ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d2d2d7]" />
                  <span>ยังไม่มีการใช้</span>
                </div>
                <div className="ml-auto">แสดงเฉพาะคำร้องที่อนุมัติแล้ว</div>
              </div>
            </div>
          </div>
        )}

        {/* Internal Training Detail */}
        {reportType === 'internal_training' && departmentFilter === 'all' && employeeFilter === 'all' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/40 mb-6 overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#86868b]" />
                รายละเอียดการอบรมภายใน
              </h3>
            </div>
            <div className="px-5 pb-5">
              <div className="overflow-x-auto rounded-xl border border-[#d2d2d7]/40">
                <table className="min-w-full text-[13px]">
                  <thead>
                    <tr className="bg-[#f5f5f7] border-b border-[#d2d2d7]/40">
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-4 text-left sticky left-0 bg-[#f5f5f7] z-10">หลักสูตร</th>
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-3 text-left min-w-[120px]">สถานที่</th>
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-3 text-center min-w-[80px]">ผู้เข้าอบรม</th>
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-3 text-center min-w-[80px]">ชั่วโมง</th>
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-3 text-right min-w-[110px]">ค่าใช้จ่าย</th>
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-3 text-center min-w-[90px]">วันที่</th>
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-4 text-center min-w-[100px]">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((req) => (
                        <tr key={req.id} className="border-b border-[#d2d2d7]/20 hover:bg-[#f5f5f7] transition-colors">
                          <td className="py-2.5 px-4 font-medium text-[#1d1d1f] sticky left-0 bg-white z-10">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${req.status === 'completed' ? 'bg-[#34c759]' : req.status.includes('pending') ? 'bg-[#ff9500]' : 'bg-[#ff3b30]'}`} />
                              <span className="truncate max-w-[200px]" title={req.courseName || req.title || req.details}>
                                {req.courseName || req.title || req.details || 'ไม่ระบุหลักสูตร'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-[12px] text-[#86868b]">{req.venue || 'ไม่ระบุ'}</td>
                          <td className="py-2.5 px-3 text-center tabular-nums text-[#0071e3] font-semibold">{req.totalParticipants || '-'}</td>
                          <td className="py-2.5 px-3 text-center tabular-nums text-[#af52de] font-semibold">{req.totalHours || '-'}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-[#34c759] font-semibold">
                            {req.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-center text-[12px] text-[#86868b] tabular-nums">
                            {new Date(req.date).toLocaleDateString('th-TH')}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              req.status === 'completed' ? 'bg-[#34c759]/10 text-[#34c759]' :
                              req.status.includes('pending') ? 'bg-[#ff9500]/10 text-[#ff9500]' :
                              'bg-[#ff3b30]/10 text-[#ff3b30]'
                            }`}>
                              {statusSummary.find(s => s.status === req.status)?.label || req.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center gap-4 text-[12px] text-[#86868b]">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#34c759]" />
                  <span>อนุมัติแล้ว</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff9500]" />
                  <span>รอดำเนินการ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                  <span>ไม่อนุมัติ</span>
                </div>
                <div className="ml-auto">รวม {filteredRequests.length} หลักสูตร</div>
              </div>
            </div>
          </div>
        )}

        {/* External Training Detail */}
        {reportType === 'external_training' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/40 mb-6 overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#86868b]" />
                รายละเอียดการอบรมภายนอก
              </h3>
            </div>
            <div className="px-5 pb-5">
              <div className="overflow-x-auto rounded-xl border border-[#d2d2d7]/40">
                <table className="min-w-full text-[13px]">
                  <thead>
                    <tr className="bg-[#f5f5f7] border-b border-[#d2d2d7]/40">
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-4 text-left sticky left-0 bg-[#f5f5f7] z-10">หลักสูตร</th>
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-3 text-left min-w-[130px]">ผู้จัดอบรม</th>
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-3 text-left min-w-[110px]">ชื่อพนักงาน</th>
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-3 text-left min-w-[90px]">แผนก</th>
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-3 text-center min-w-[130px]">ช่วงวันที่</th>
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-3 text-center min-w-[50px]">วัน</th>
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-3 text-right min-w-[110px]">ค่าใช้จ่าย</th>
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-4 text-center min-w-[100px]">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((req) => (
                        <tr key={req.id} className="border-b border-[#d2d2d7]/20 hover:bg-[#f5f5f7] transition-colors">
                          <td className="py-2.5 px-4 font-medium text-[#1d1d1f] sticky left-0 bg-white z-10">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${req.status === 'completed' ? 'bg-[#34c759]' : req.status.includes('pending') ? 'bg-[#ff9500]' : 'bg-[#ff3b30]'}`} />
                              <span className="truncate max-w-[200px]" title={req.course_name || req.title || req.details}>
                                {req.course_name || req.title || req.details || 'ไม่ระบุหลักสูตร'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-[12px] text-[#86868b]">{req.organizer || 'ไม่ระบุ'}</td>
                          <td className="py-2.5 px-3 font-medium text-[#1d1d1f]">{req.userName}</td>
                          <td className="py-2.5 px-3 text-[12px] text-[#86868b]">{req.userDepartment || 'ไม่ระบุ'}</td>
                          <td className="py-2.5 px-3 text-center text-[12px] text-[#86868b] tabular-nums">
                            {req.start_date ? new Date(req.start_date).toLocaleDateString('th-TH') : new Date(req.date).toLocaleDateString('th-TH')}
                            {req.end_date && req.start_date !== req.end_date ? ` - ${new Date(req.end_date).toLocaleDateString('th-TH')}` : ''}
                          </td>
                          <td className="py-2.5 px-3 text-center tabular-nums text-[#af52de] font-semibold">{req.total_days || '-'}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-[#34c759] font-semibold">
                            {req.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              req.status === 'completed' ? 'bg-[#34c759]/10 text-[#34c759]' :
                              req.status.includes('pending') ? 'bg-[#ff9500]/10 text-[#ff9500]' :
                              'bg-[#ff3b30]/10 text-[#ff3b30]'
                            }`}>
                              {statusSummary.find(s => s.status === req.status)?.label || req.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center gap-4 text-[12px] text-[#86868b]">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#34c759]" />
                  <span>อนุมัติแล้ว</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff9500]" />
                  <span>รอดำเนินการ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                  <span>ไม่อนุมัติ</span>
                </div>
                <div className="ml-auto">รวม {filteredRequests.length} คำร้อง</div>
              </div>
            </div>
          </div>
        )}

        {/* Employee Summary */}
        {employeeFilter !== 'all' && employeeWelfareSummary && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/40 overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#86868b]" />
                สรุปสวัสดิการของ {employees.find(e => e.id.toString() === employeeFilter)?.Name || ''}
              </h3>
            </div>
            <div className="px-5 pb-5">
              <div className="overflow-x-auto rounded-xl border border-[#d2d2d7]/40">
                <table className="min-w-full text-[13px]">
                  <thead>
                    <tr className="bg-[#f5f5f7] border-b border-[#d2d2d7]/40">
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-3 text-left">ประเภทสวัสดิการ</th>
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-3 text-right">วงเงิน</th>
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-3 text-right">ใช้ไปแล้ว</th>
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-3 text-right">คงเหลือ</th>
                      <th className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider py-3 px-3 text-center w-[180px]">สัดส่วน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeWelfareSummary.map((w) => {
                      const percentUsed = w.limit > 0 ? (w.used / w.limit) * 100 : 0;
                      return (
                        <tr key={w.type} className="border-b border-[#d2d2d7]/20 hover:bg-[#f5f5f7] transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="inline-block w-3 h-3 rounded-full"
                                style={{ background: barColors[w.type] || '#3b82f6' }}
                              />
                              <span className="font-medium text-[#1d1d1f]">{w.label}</span>
                            </div>
                          </td>
                          <td className="text-right px-3 text-[#6e6e73] tabular-nums">
                            {w.limit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="text-right px-3 text-[#34c759] font-semibold tabular-nums">
                            {w.used.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="text-right px-3 text-[#0071e3] font-semibold tabular-nums">
                            {w.remaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-[#e8e8ed] rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${percentUsed}%`,
                                    backgroundColor: barColors[w.type] || '#3b82f6'
                                  }}
                                />
                              </div>
                              <span className="text-[12px] font-semibold text-[#1d1d1f] w-10 text-right tabular-nums">
                                {Math.round(percentUsed)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReport;
