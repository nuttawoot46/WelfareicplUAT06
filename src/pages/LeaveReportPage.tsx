import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { useLeave } from '@/context/LeaveContext';
import { getLeaveRequests, getLeaveTypes } from '@/services/leaveApi';
import { LeaveRequest, LeaveType, LeaveStatusType } from '@/types';
import { format, parseISO, startOfYear, endOfYear } from 'date-fns';
import {
  FileText,
  Download,
  Filter,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  BarChart3,
  PieChart,
  TrendingUp,
  Search,
  Printer,
  RefreshCw,
  Building2,
  CalendarDays,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Types for report data
interface LeaveReportSummary {
  totalRequests: number;
  approvedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  totalDaysUsed: number;
  byLeaveType: { leaveType: string; count: number; days: number; color: string }[];
  byMonth: { month: string; count: number }[];
  byEmployee: { name: string; team: string; totalDays: number; requestCount: number }[];
}

const LeaveReportPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { employeeId } = useLeave();

  // State
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filter states - default to current year
  const [startDate, setStartDate] = useState(() => format(startOfYear(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(() => format(endOfYear(new Date()), 'yyyy-MM-dd'));
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Check if user is admin/hr
  const userRole = profile?.role?.toLowerCase() || '';
  const isAdmin = userRole === 'admin' || userRole === 'hr' || userRole === 'superadmin';

  // Check if any filter is active
  const hasActiveFilters = selectedLeaveType !== 'all' || selectedStatus !== 'all' || selectedTeam !== 'all' || searchQuery !== '';

  // Get date range label
  const getDateRangeLabel = () => {
    return `${format(parseISO(startDate), 'dd MMM yyyy')} - ${format(parseISO(endDate), 'dd MMM yyyy')}`;
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedLeaveType('all');
    setSelectedStatus('all');
    setSelectedTeam('all');
    setSearchQuery('');
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const types = await getLeaveTypes();
        setLeaveTypes(types);

        let requests: LeaveRequest[] = [];
        if (isAdmin) {
          requests = await getLeaveRequests({ startDate, endDate });
        } else if (employeeId) {
          requests = await getLeaveRequests({ employeeId, startDate, endDate });
        }
        setLeaveRequests(requests);
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [startDate, endDate, isAdmin, employeeId]);

  // Get unique teams from requests
  const teams = useMemo(() => {
    const teamSet = new Set(leaveRequests.map((r) => r.employee_team).filter(Boolean));
    return Array.from(teamSet).sort();
  }, [leaveRequests]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((request) => {
      if (selectedLeaveType !== 'all' && request.leave_type_id.toString() !== selectedLeaveType) return false;
      if (selectedStatus !== 'all' && request.status !== selectedStatus) return false;
      if (isAdmin && selectedTeam !== 'all' && request.employee_team !== selectedTeam) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = request.employee_name?.toLowerCase().includes(query);
        const matchesEmail = request.employee_email?.toLowerCase().includes(query);
        const matchesType = request.leave_type_name?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesType) return false;
      }
      return true;
    });
  }, [leaveRequests, selectedLeaveType, selectedStatus, selectedTeam, searchQuery, isAdmin]);

  // Calculate summary statistics
  const summary: LeaveReportSummary = useMemo(() => {
    const approved = filteredRequests.filter((r) => r.status === 'completed');
    const pending = filteredRequests.filter((r) => r.status === 'pending_manager' || r.status === 'pending_hr');
    const rejected = filteredRequests.filter((r) => r.status === 'rejected_manager' || r.status === 'rejected_hr');

    const byLeaveTypeMap = new Map<string, { count: number; days: number; color: string }>();
    filteredRequests.forEach((request) => {
      const key = request.leave_type_name;
      const current = byLeaveTypeMap.get(key) || { count: 0, days: 0, color: request.leave_type?.color || '#6366f1' };
      current.count += 1;
      current.days += request.total_days;
      byLeaveTypeMap.set(key, current);
    });

    const byMonthMap = new Map<string, number>();
    filteredRequests.forEach((request) => {
      const month = format(parseISO(request.start_date), 'MMM yyyy');
      byMonthMap.set(month, (byMonthMap.get(month) || 0) + 1);
    });

    const byEmployeeMap = new Map<string, { team: string; totalDays: number; requestCount: number }>();
    if (isAdmin) {
      filteredRequests.forEach((request) => {
        const key = request.employee_name;
        const current = byEmployeeMap.get(key) || { team: request.employee_team || '', totalDays: 0, requestCount: 0 };
        current.totalDays += request.total_days;
        current.requestCount += 1;
        byEmployeeMap.set(key, current);
      });
    }

    return {
      totalRequests: filteredRequests.length,
      approvedRequests: approved.length,
      pendingRequests: pending.length,
      rejectedRequests: rejected.length,
      totalDaysUsed: approved.reduce((sum, r) => sum + r.total_days, 0),
      byLeaveType: Array.from(byLeaveTypeMap.entries()).map(([leaveType, data]) => ({ leaveType, ...data })),
      byMonth: Array.from(byMonthMap.entries()).map(([month, count]) => ({ month, count })),
      byEmployee: Array.from(byEmployeeMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.totalDays - a.totalDays),
    };
  }, [filteredRequests, isAdmin]);

  // Status badge helper
  const getStatusBadge = (status: LeaveStatusType) => {
    const styles: Record<string, string> = {
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pending_manager: 'bg-amber-50 text-amber-700 border-amber-200',
      pending_hr: 'bg-blue-50 text-blue-700 border-blue-200',
      rejected_manager: 'bg-red-50 text-red-700 border-red-200',
      rejected_hr: 'bg-red-50 text-red-700 border-red-200',
      cancelled: 'bg-gray-50 text-gray-600 border-gray-200',
    };
    const labels: Record<string, string> = {
      completed: 'อนุมัติแล้ว',
      pending_manager: 'รอผู้จัดการ',
      pending_hr: 'รอ HR',
      rejected_manager: 'ปฏิเสธ',
      rejected_hr: 'ปฏิเสธ',
      cancelled: 'ยกเลิก',
    };
    return (
      <Badge variant="outline" className={cn('text-xs font-medium border', styles[status] || 'bg-gray-50 text-gray-600')}>
        {labels[status] || status}
      </Badge>
    );
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['ลำดับ', 'ชื่อพนักงาน', 'ทีม', 'ประเภทการลา', 'วันที่เริ่ม', 'วันที่สิ้นสุด', 'จำนวนวัน', 'สถานะ', 'เหตุผล', 'วันที่ยื่นคำขอ'];
    const statusLabels: Record<string, string> = {
      completed: 'อนุมัติแล้ว',
      pending_manager: 'รอผู้จัดการอนุมัติ',
      pending_hr: 'รอ HR อนุมัติ',
      rejected_manager: 'ผู้จัดการปฏิเสธ',
      rejected_hr: 'HR ปฏิเสธ',
      cancelled: 'ยกเลิก',
    };
    const rows = filteredRequests.map((request, index) => [
      index + 1,
      request.employee_name,
      request.employee_team || '-',
      request.leave_type_name,
      format(parseISO(request.start_date), 'dd/MM/yyyy'),
      format(parseISO(request.end_date), 'dd/MM/yyyy'),
      request.total_days,
      statusLabels[request.status] || request.status,
      request.reason || '-',
      format(parseISO(request.created_at), 'dd/MM/yyyy HH:mm'),
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leave-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // Filter Component
  const FilterContent = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">วันที่เริ่มต้น</Label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-white border-gray-200"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">วันที่สิ้นสุด</Label>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-white border-gray-200"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">ประเภทการลา</Label>
        <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
          <SelectTrigger className="w-full bg-white border-gray-200">
            <SelectValue placeholder="ทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            {leaveTypes.map((type) => (
              <SelectItem key={type.id} value={type.id.toString()}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color }} />
                  {type.name_th}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">สถานะ</Label>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full bg-white border-gray-200">
            <SelectValue placeholder="ทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="completed">อนุมัติแล้ว</SelectItem>
            <SelectItem value="pending_manager">รอผู้จัดการ</SelectItem>
            <SelectItem value="pending_hr">รอ HR</SelectItem>
            <SelectItem value="rejected_manager">ผู้จัดการปฏิเสธ</SelectItem>
            <SelectItem value="rejected_hr">HR ปฏิเสธ</SelectItem>
            <SelectItem value="cancelled">ยกเลิก</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isAdmin && teams.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">แผนก/ทีม</Label>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-full bg-white border-gray-200">
              <SelectValue placeholder="ทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team} value={team as string}>{team}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">ค้นหา</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="ชื่อ, อีเมล, ประเภทการลา..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full border-gray-200 text-gray-600 hover:text-gray-800">
          <RefreshCw className="w-4 h-4 mr-2" />
          ล้างตัวกรอง
        </Button>
      )}
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-xl mb-4">
            <FileText className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">รายงานการลา</h1>
          <p className="text-gray-500 text-sm sm:text-base">
            {isAdmin ? 'รายงานสรุปการลาของพนักงานทั้งองค์กร' : 'รายงานสรุปการลาของคุณ'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-600">
            <CalendarDays className="w-4 h-4" />
            <span>{getDateRangeLabel()}</span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden border-gray-200 bg-white">
                <Filter className="w-4 h-4 mr-2" />
                ตัวกรอง
                {hasActiveFilters && (
                  <span className="ml-2 w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">!</span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[380px]">
              <SheetHeader>
                <SheetTitle>ตัวกรองข้อมูล</SheetTitle>
                <SheetDescription>กรองข้อมูลรายงานการลา</SheetDescription>
              </SheetHeader>
              <div className="mt-6"><FilterContent /></div>
            </SheetContent>
          </Sheet>

          <Button variant="outline" size="sm" onClick={exportToCSV} className="border-gray-200 bg-white">
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">ส่งออก CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="border-gray-200 bg-white hidden sm:flex">
            <Printer className="w-4 h-4 mr-2" />
            พิมพ์
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Desktop Sidebar Filters */}
          <div className="hidden lg:block lg:col-span-3">
            <Card className="border-gray-200 shadow-sm sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  ตัวกรองข้อมูล
                </CardTitle>
              </CardHeader>
              <CardContent><FilterContent /></CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-6">

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card className="border-gray-200 shadow-sm bg-white">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{summary.totalRequests}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">คำขอทั้งหมด</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm bg-white">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{summary.approvedRequests}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">อนุมัติแล้ว</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm bg-white">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-amber-600">{summary.pendingRequests}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">รอดำเนินการ</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm bg-white">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600">{summary.totalDaysUsed.toFixed(1)}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">วันลาทั้งหมด</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Card className="border-gray-200 shadow-sm bg-white">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader className="pb-0">
                  <TabsList className="w-full grid grid-cols-3 bg-gray-100/80 p-1 rounded-lg">
                    <TabsTrigger value="overview" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
                      <BarChart3 className="w-4 h-4 mr-1.5 hidden sm:inline" />
                      ภาพรวม
                    </TabsTrigger>
                    <TabsTrigger value="details" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
                      <FileText className="w-4 h-4 mr-1.5 hidden sm:inline" />
                      รายละเอียด
                    </TabsTrigger>
                    {isAdmin && (
                      <TabsTrigger value="employees" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
                        <Users className="w-4 h-4 mr-1.5 hidden sm:inline" />
                        พนักงาน
                      </TabsTrigger>
                    )}
                  </TabsList>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Overview Tab */}
                  <TabsContent value="overview" className="mt-0 space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {/* Leave by Type */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <PieChart className="w-5 h-5 text-indigo-600" />
                          <h3 className="font-semibold text-gray-800">การลาตามประเภท</h3>
                        </div>
                        <div className="space-y-3">
                          {summary.byLeaveType.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                              <PieChart className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                              <p className="text-gray-500 text-sm">ไม่มีข้อมูล</p>
                            </div>
                          ) : (
                            summary.byLeaveType.map((item) => (
                              <div key={item.leaveType} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-sm font-medium text-gray-700">{item.leaveType}</span>
                                  </div>
                                  <span className="text-sm text-gray-500">{item.count} ครั้ง / {item.days.toFixed(1)} วัน</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full transition-all duration-500"
                                    style={{ backgroundColor: item.color, width: `${Math.max((item.count / summary.totalRequests) * 100, 5)}%` }}
                                  />
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Leave by Month */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-indigo-600" />
                          <h3 className="font-semibold text-gray-800">การลาตามเดือน</h3>
                        </div>
                        <div className="space-y-3">
                          {summary.byMonth.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                              <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                              <p className="text-gray-500 text-sm">ไม่มีข้อมูล</p>
                            </div>
                          ) : (
                            summary.byMonth.slice(0, 6).map((item) => {
                              const maxCount = Math.max(...summary.byMonth.map((m) => m.count));
                              return (
                                <div key={item.month} className="flex items-center gap-3">
                                  <div className="w-20 text-sm text-gray-600 font-medium">{item.month}</div>
                                  <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-end pr-3 transition-all duration-500"
                                      style={{ width: `${Math.max((item.count / maxCount) * 100, 15)}%` }}
                                    >
                                      <span className="text-xs text-white font-semibold">{item.count}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Details Tab */}
                  <TabsContent value="details" className="mt-0">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-500">แสดง {filteredRequests.length} รายการ</p>
                    </div>

                    {/* Mobile Card View */}
                    <div className="sm:hidden space-y-3">
                      {filteredRequests.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">ไม่พบข้อมูล</p>
                        </div>
                      ) : (
                        filteredRequests.slice(0, 10).map((request) => (
                          <div key={request.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                                  style={{ backgroundColor: request.leave_type?.color || '#6366f1' }}
                                >
                                  {request.employee_name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-gray-900">{request.employee_name}</p>
                                  <p className="text-xs text-gray-500">{request.employee_team}</p>
                                </div>
                              </div>
                              {getStatusBadge(request.status)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: request.leave_type?.color || '#6366f1' }} />
                              {request.leave_type_name}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">
                                {format(parseISO(request.start_date), 'dd/MM/yy')}
                                {request.start_date !== request.end_date && <> - {format(parseISO(request.end_date), 'dd/MM/yy')}</>}
                              </span>
                              <span className="font-semibold text-indigo-600">{request.total_days} วัน</span>
                            </div>
                          </div>
                        ))
                      )}
                      {filteredRequests.length > 10 && (
                        <p className="text-center text-sm text-gray-500 py-3">และอีก {filteredRequests.length - 10} รายการ...</p>
                      )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="w-12 text-center font-semibold text-gray-700">#</TableHead>
                            {isAdmin && <TableHead className="font-semibold text-gray-700">พนักงาน</TableHead>}
                            <TableHead className="font-semibold text-gray-700">ประเภทการลา</TableHead>
                            <TableHead className="font-semibold text-gray-700">วันที่</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700">จำนวนวัน</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700">สถานะ</TableHead>
                            <TableHead className="font-semibold text-gray-700 max-w-[180px]">เหตุผล</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRequests.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-12">
                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">ไม่พบข้อมูล</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredRequests.map((request, index) => (
                              <TableRow key={request.id} className="hover:bg-gray-50/50">
                                <TableCell className="text-center text-gray-500 font-medium">{index + 1}</TableCell>
                                {isAdmin && (
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs flex-shrink-0"
                                        style={{ backgroundColor: request.leave_type?.color || '#6366f1' }}
                                      >
                                        {request.employee_name.charAt(0)}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-medium text-sm text-gray-900 truncate">{request.employee_name}</div>
                                        <div className="text-xs text-gray-500 truncate">{request.employee_team}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                )}
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: request.leave_type?.color || '#6366f1' }} />
                                    <span className="text-sm text-gray-700">{request.leave_type_name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-gray-700">
                                    {format(parseISO(request.start_date), 'dd/MM/yyyy')}
                                    {request.start_date !== request.end_date && (
                                      <span className="text-gray-400"> - {format(parseISO(request.end_date), 'dd/MM/yyyy')}</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-50 text-indigo-700 rounded-lg font-semibold text-sm">
                                    {request.total_days}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">{getStatusBadge(request.status)}</TableCell>
                                <TableCell className="max-w-[180px]">
                                  <p className="text-sm text-gray-500 truncate">{request.reason || '-'}</p>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* Employees Tab */}
                  {isAdmin && (
                    <TabsContent value="employees" className="mt-0">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-500">แสดง {summary.byEmployee.length} คน</p>
                      </div>

                      {/* Mobile Card View */}
                      <div className="sm:hidden space-y-3">
                        {summary.byEmployee.length === 0 ? (
                          <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">ไม่พบข้อมูล</p>
                          </div>
                        ) : (
                          summary.byEmployee.slice(0, 10).map((employee, index) => (
                            <div key={employee.name} className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                                index < 3 ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white" : "bg-gray-200 text-gray-600"
                              )}>
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900 truncate">{employee.name}</p>
                                <p className="text-xs text-gray-500">{employee.team || '-'}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-indigo-600">{employee.totalDays.toFixed(1)} วัน</p>
                                <p className="text-xs text-gray-500">{employee.requestCount} ครั้ง</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="w-12 text-center font-semibold text-gray-700">#</TableHead>
                              <TableHead className="font-semibold text-gray-700">ชื่อพนักงาน</TableHead>
                              <TableHead className="font-semibold text-gray-700">แผนก/ทีม</TableHead>
                              <TableHead className="text-center font-semibold text-gray-700">จำนวนครั้ง</TableHead>
                              <TableHead className="text-center font-semibold text-gray-700">จำนวนวัน</TableHead>
                              <TableHead className="text-center font-semibold text-gray-700">เฉลี่ย/ครั้ง</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {summary.byEmployee.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-12">
                                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                  <p className="text-gray-500">ไม่พบข้อมูล</p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              summary.byEmployee.map((employee, index) => (
                                <TableRow key={employee.name} className="hover:bg-gray-50/50">
                                  <TableCell className="text-center">
                                    <div className={cn(
                                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto",
                                      index < 3 ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                                    )}>
                                      {index + 1}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium text-gray-900">{employee.name}</TableCell>
                                  <TableCell className="text-gray-600">{employee.team || '-'}</TableCell>
                                  <TableCell className="text-center">
                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm">
                                      {employee.requestCount}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="inline-flex items-center justify-center px-3 h-8 bg-indigo-50 text-indigo-700 rounded-lg font-semibold text-sm">
                                      {employee.totalDays.toFixed(1)} วัน
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center text-gray-600">
                                    {(employee.totalDays / employee.requestCount).toFixed(1)} วัน
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  )}
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>รายงานนี้สร้างโดยระบบอัตโนมัติ | {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        </div>
      </div>
    </Layout>
  );
};

export default LeaveReportPage;
