import React, { useMemo, useState, useEffect } from 'react';
import { useWelfare } from '@/context/WelfareContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Download, Filter } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { WelfareType, StatusType } from '@/types';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';

import { fetchAllEmployees, SimpleEmployee } from '@/services/employeeApi';
import { getBenefitLimitsByEmpId, BenefitLimit } from '@/services/welfareLimitApi';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const welfareTypeLabels: Record<WelfareType, string> = {
  wedding: 'ค่าแต่งงาน',
  training: 'ค่าอบรม',
  childbirth: 'ค่าคลอดบุตร',
  funeral: 'ค่าช่วยเหลืองานศพ',
  glasses: 'ค่าตัดแว่น',
  dental: 'ค่าทำฟัน',
  fitness: 'ค่าออกกำลังกาย',
  medical: 'ค่ารักษาพยาบาล',
};

// ฟังก์ชัน export CSV ที่รองรับภาษาไทย (UTF-8 BOM)
function exportReportToCSV({ summaryByType, statusSummary, departmentSummary, welfareTypeLabels }: any) {
  let csv = '';
  csv += 'สรุปการใช้สวัสดิการแยกตามประเภท\r\n';
  csv += 'ประเภท,จำนวนคำร้อง,ยอดใช้ไป,คงเหลือ\r\n';
  summaryByType.forEach((row: any) => {
    csv += `"${welfareTypeLabels[row.type as WelfareType] || row.type}","${row.count}","${row.used}","${row.remaining}"\r\n`;
  });

  csv += '\r\nสรุปสถานะคำร้อง\r\n';
  csv += 'สถานะ,จำนวน\r\n';
  statusSummary.forEach((row: any) => {
    const statusLabel = row.label || (row.status === 'pending' ? 'รอดำเนินการ' : row.status === 'approved' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ');
    csv += `"${statusLabel}","${row.count}"\r\n`;
  });

  csv += '\r\nสรุปตามแผนก\r\n';
  csv += 'แผนก,จำนวนคำร้อง,ยอดใช้ไป\r\n';
  departmentSummary.forEach((row: any) => {
    csv += `"${row.department}","${row.count}","${row.used}"\r\n`;
  });

  // ใส่ BOM เพื่อให้ Excel อ่านภาษาไทยถูก
  const csvWithBom = '\uFEFF' + csv;
  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `welfare_report_${new Date().toISOString().slice(0, 10)}.csv`);
}

import Modal from '@/components/ui/modal';

const AdminReport = () => {
  const navigate = useNavigate();
  const { welfareRequests } = useWelfare();

  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null } | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);
  // Modal สำหรับดูรายการคำร้องแต่ละสถานะ
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loadingEmp, setLoadingEmp] = useState(true);
  const [empError, setEmpError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoadingEmp(true);
      setEmpError(null);
      try {
        const emps = await fetchAllEmployees();
        setEmployees(emps);
        const uniqueDepartments = Array.from(new Set(emps.map(e => e.Team).filter(Boolean))) as string[];
        setDepartments(uniqueDepartments);
      } catch (e: any) {
        setEmpError(e.message || 'เกิดข้อผิดพลาด');
      } finally {
        setLoadingEmp(false);
      }
    }
    load();
  }, []);

  const filteredRequests = useMemo(() => {
    return welfareRequests.filter((req) => {
      if (typeFilter !== 'all' && req.type !== typeFilter) return false;
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
  }, [welfareRequests, typeFilter, departmentFilter, statusFilter, employeeFilter, dateRange]);

  const summaryByType = useMemo(() => {
    const map: Record<string, { count: number; used: number; remaining: number }> = {};
    const totalLimitPerType = 100000; // สมมติวงเงินรวมต่อประเภท 100,000

    // Initialize map with all welfare types to ensure they appear even if unused
    Object.keys(welfareTypeLabels).forEach(type => {
        map[type] = { count: 0, used: 0, remaining: totalLimitPerType };
    });

    filteredRequests.forEach((req) => {
      if (!map[req.type]) return; // Skip if type is not in our defined labels
      map[req.type].count++;
      if (req.status === 'approved') {
        map[req.type].used += req.amount;
      }
    });

    Object.keys(map).forEach((type) => {
      map[type].remaining = totalLimitPerType - map[type].used;
    });

    return Object.entries(map).map(([type, v]) => ({ type, ...v }));
  }, [filteredRequests]);

  const statusSummary = useMemo(() => {
    const detailedMap: Record<string, number> = {
      'pending_manager': 0,
      'pending_hr': 0,
      'pending_accounting': 0,
      'approved': 0,
      'rejected': 0,
    };

    filteredRequests.forEach((req) => {
      if (req.status === 'pending') {
        // ตรวจสอบว่าคำร้องอยู่ในขั้นตอนไหน
        if (!req.managerApproval) {
          detailedMap['pending_manager']++;
        } else if (req.managerApproval === 'approved' && !req.hrApproval) {
          detailedMap['pending_hr']++;
        } else if (req.hrApproval === 'approved' && !req.accountingApproval) {
          detailedMap['pending_accounting']++;
        }
      } else {
        detailedMap[req.status]++;
      }
    });

    return [
      { status: 'pending_manager', count: detailedMap['pending_manager'], label: 'รอผู้จัดการอนุมัติ' },
      { status: 'pending_hr', count: detailedMap['pending_hr'], label: 'รอ HR อนุมัติ' },
      { status: 'pending_accounting', count: detailedMap['pending_accounting'], label: 'รอฝ่ายบัญชีตรวจสอบ' },
      { status: 'approved', count: detailedMap['approved'], label: 'อนุมัติแล้ว' },
      { status: 'rejected', count: detailedMap['rejected'], label: 'ไม่อนุมัติ' },
    ];
  }, [filteredRequests]);

  const departmentSummary = useMemo(() => {
    const map: Record<string, { count: number; used: number }> = {};
    filteredRequests.forEach((req) => {
      const dept = req.userDepartment || 'ไม่ระบุแผนก';
      if (!map[dept]) map[dept] = { count: 0, used: 0 };
      map[dept].count++;
      if (req.status === 'approved') map[dept].used += req.amount;
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
  wedding:   '#FF6F61', // แดงส้มสด
  training:  '#6A5ACD', // น้ำเงินม่วงสด
  childbirth:'#FFD700', // เหลืองทองสด
  funeral:   '#20B2AA', // ฟ้าอมเขียวสด
  glasses:   '#FF69B4', // ชมพูสด
  dental:    '#40E0D0', // ฟ้าครามสด
  fitness:   '#FF8C00', // ส้มเข้มสด
  medical:   '#43A047', // เขียวสด
};

// 3D Bar Chart Configuration
const barData = {
    labels: summaryByType.map((d) => welfareTypeLabels[d.type as WelfareType] || d.type),
    datasets: [
      {
        label: 'ยอดใช้ไป (บาท)',
        data: summaryByType.map((d) => d.used),
        backgroundColor: summaryByType.map((d) => barColors[d.type] || '#3b82f6'),
        borderColor: summaryByType.map((d) => barColors[d.type] || '#3b82f6'),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 14,
            weight: 'bold',
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
          label: function(context: any) {
            return `${context.dataset.label}: ${Number(context.parsed.y).toLocaleString()} บาท`;
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
            weight: 'bold',
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
          callback: function(value: any) {
            return Number(value).toLocaleString() + ' บาท';
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto rounded-2xl shadow-lg bg-white dark:bg-gray-800 p-6 md:p-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin')}>
              ย้อนกลับ
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white drop-shadow">ภาพรวมสวัสดิการ</h1>
          </div>
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={() => exportReportToCSV({ summaryByType, statusSummary, departmentSummary, welfareTypeLabels })}
          >
            <Download className="w-4 h-4" />
            ดาวน์โหลดรายงาน
          </Button>
        </div>

        <div className="space-y-8">
          <Card>
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
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger><SelectValue placeholder="ประเภทสวัสดิการ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกประเภท</SelectItem>
                    {Object.entries(welfareTypeLabels).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="สถานะ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="pending">รอดำเนินการ</SelectItem>
                    <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                    <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
                  </SelectContent>
                </Select>
                
                <DateRangePicker value={dateRange} onChange={setDateRange} />
              </div>
            </CardContent>
          </Card>
          
          {/* Section for summary cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>สรุปการใช้สวัสดิการแยกตามประเภท</CardTitle></CardHeader>
              <CardContent>
                <div className="h-96">
                  <Bar data={barData} options={barOptions} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>สรุปสถานะคำร้อง</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {statusSummary.filter(s => s.count > 0).map((s) => (
  <li key={s.status} className="flex justify-between items-center">
    <span className="text-sm font-medium">{s.label}</span>
    <span
      className="font-bold text-blue-600 cursor-pointer hover:underline"
      onClick={() => {
        if (s.count > 0) {
          // Map detailed status back to basic status for modal
          let modalStatusValue: 'pending' | 'approved' | 'rejected' = 'pending';
          if (s.status === 'approved') modalStatusValue = 'approved';
          else if (s.status === 'rejected') modalStatusValue = 'rejected';
          else modalStatusValue = 'pending'; // for all pending variants
          
          setModalStatus(modalStatusValue);
          setModalOpen(true);
        }
      }}
      role="button"
      tabIndex={0}
      style={{ userSelect: 'none' }}
    >
      {s.count.toLocaleString()} รายการ
    </span>
  </li>
))}

{/* Modal แสดงรายการคำร้องแต่ละสถานะ */}
{modalOpen && modalStatus && (
  <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
    <div className="p-4 w-full max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          รายการคำร้องสถานะ
          {modalStatus === 'pending' ? 'รอดำเนินการ' : modalStatus === 'approved' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ'}
        </h2>
        <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-red-500 text-lg">✕</button>
      </div>
      <div className="overflow-y-auto max-h-[60vh]">
        {filteredRequests.filter(r => r.status === modalStatus).length === 0 ? (
          <div className="text-center text-gray-400 py-10">ไม่พบรายการคำร้อง</div>
        ) : (
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-2 border">วันที่</th>
                <th className="py-2 px-2 border">ชื่อพนักงาน</th>
                <th className="py-2 px-2 border">ประเภท</th>
                <th className="py-2 px-2 border">จำนวนเงิน</th>
                <th className="py-2 px-2 border">แผนก</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.filter(r => r.status === modalStatus).map((r, i) => (
                <tr key={r.id || i} className="odd:bg-white even:bg-gray-50">
                  <td className="border px-2 py-1">{new Date(r.date).toLocaleDateString('th-TH')}</td>
                  <td className="border px-2 py-1">{r.userName}</td>
                  <td className="border px-2 py-1">{welfareTypeLabels[r.type] || r.type}</td>
                  <td className="border px-2 py-1 text-right">{Number(r.amount).toLocaleString()} บาท</td>
                  <td className="border px-2 py-1">{r.userDepartment || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  </Modal>
)}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>สรุปตามแผนก</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-3 max-h-48 overflow-y-auto">
                    {departmentSummary.map((d) => (
                      <li key={d.department} className="flex justify-between items-center">
                        <span>{d.department}</span>
                        <span className="font-semibold">{d.used.toLocaleString()} บาท</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Employee Summary */}
          {employeeFilter !== 'all' && employeeWelfareSummary && (
             <Card>
               <CardHeader><CardTitle>สรุปสวัสดิการของ {employees.find(e => e.id.toString() === employeeFilter)?.Name || ''}</CardTitle></CardHeader>
               <CardContent>
  <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white dark:bg-gray-900 p-4">
    <table className="min-w-full text-base text-gray-700 dark:text-gray-200">
      <thead className="bg-welfare-blue/10">
        <tr>
          <th className="font-semibold text-welfare-blue text-base py-3 px-2 text-left">ประเภทสวัสดิการ</th>
          <th className="font-semibold text-welfare-blue text-base py-3 px-2 text-right">วงเงินทั้งหมด</th>
          <th className="font-semibold text-welfare-blue text-base py-3 px-2 text-right">ใช้ไปแล้ว</th>
          <th className="font-semibold text-welfare-blue text-base py-3 px-2 text-right">คงเหลือ</th>
          <th className="w-[180px] font-semibold text-welfare-blue text-base py-3 px-2 text-center">สัดส่วนคงเหลือ</th>
        </tr>
      </thead>
      <tbody>
        {employeeWelfareSummary.map((w) => {
          const percentRemaining = w.limit > 0 ? (w.remaining / w.limit) * 100 : 0;
          // สี bar ตาม type
          const barColors: Record<string, string> = {
  wedding:   '#FF6F61', // แดงส้มสด
  training:  '#6A5ACD', // น้ำเงินม่วงสด
  childbirth:'#FFD700', // เหลืองทองสด
  funeral:   '#20B2AA', // ฟ้าอมเขียวสด
  glasses:   '#FF69B4', // ชมพูสด
  dental:    '#40E0D0', // ฟ้าครามสด
  fitness:   '#FF8C00', // ส้มเข้มสด
  medical:   '#43A047', // เขียวสด
};
          return (
            <tr key={w.type} className="hover:bg-welfare-blue/5 dark:hover:bg-welfare-blue/20 transition-colors">
              <td className="font-medium flex items-center gap-3 py-2 px-2">
                <span className="inline-block w-3 h-3 rounded-full" style={{background: barColors[w.type] || '#3b82f6'}}></span>
                <span className="text-base">{w.label}</span>
              </td>
              <td className="text-right px-2">{w.limit.toLocaleString()} <span className="text-xs text-gray-400">บาท</span></td>
              <td className="text-right px-2">{w.used.toLocaleString()} <span className="text-xs text-gray-400">บาท</span></td>
              <td className="text-right px-2">{w.remaining.toLocaleString()} <span className="text-xs text-gray-400">บาท</span></td>
              <td className="text-center px-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700" style={{minWidth:'120px'}}>
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${percentRemaining}%`, background: barColors[w.type] || '#3b82f6' }}
                    />
                  </div>
                  <span className="text-base w-12 font-semibold text-gray-700 dark:text-gray-200">{Math.round(percentRemaining)}%</span>
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
    </div>
  );
};

export default AdminReport;