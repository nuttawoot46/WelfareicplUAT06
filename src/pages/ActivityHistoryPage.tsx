import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { getWelfareTypeLabel } from '@/lib/utils';
import {
  Activity,
  Download,
  Filter,
  Search,
  RefreshCw,
  FileText,
  CalendarDays,
  LogIn,
  CheckCircle,
  XCircle,
  Clock,
  Send,
} from 'lucide-react';

// Unified activity item
interface ActivityItem {
  id: string;
  date: string;
  category: 'welfare' | 'leave' | 'login';
  action: string;
  details: string;
  status: string;
  amount?: number;
  type?: string; // welfare type or leave type
}

// Status label mapping
const STATUS_LABELS: Record<string, string> = {
  pending_executive: 'รอ Executive อนุมัติ',
  pending_manager: 'รอหัวหน้าอนุมัติ',
  pending_hr: 'รอ HR อนุมัติ',
  pending_accounting: 'รอบัญชีอนุมัติ',
  pending_special_approval: 'รออนุมัติพิเศษ',
  completed: 'อนุมัติแล้ว',
  approved: 'อนุมัติแล้ว',
  rejected_executive: 'Executive ปฏิเสธ',
  rejected_manager: 'หัวหน้าปฏิเสธ',
  rejected_hr: 'HR ปฏิเสธ',
  rejected_accounting: 'บัญชีปฏิเสธ',
  rejected_special_approval: 'ผู้อนุมัติพิเศษปฏิเสธ',
  pending_revision: 'รอเอกสารเพิ่มเติม',
  cancelled: 'ยกเลิก',
};

export const ActivityHistoryPage = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30days');

  const getStartDate = useCallback((range: string): string | undefined => {
    const now = new Date();
    switch (range) {
      case '7days':
        now.setDate(now.getDate() - 7);
        return now.toISOString();
      case '30days':
        now.setDate(now.getDate() - 30);
        return now.toISOString();
      case '90days':
        now.setDate(now.getDate() - 90);
        return now.toISOString();
      default:
        return undefined;
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      const startDate = getStartDate(dateRange);
      const items: ActivityItem[] = [];
      const employeeId = profile?.employee_id;

      // 1) Fetch welfare_requests
      if ((categoryFilter === 'all' || categoryFilter === 'welfare') && employeeId) {
        let welfareQuery = (supabase as any)
          .from('welfare_requests')
          .select('id, created_at, request_type, status, amount, employee_name, details, run_number')
          .eq('employee_id', employeeId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (startDate) {
          welfareQuery = welfareQuery.gte('created_at', startDate);
        }

        const { data: welfareData } = await welfareQuery;

        if (welfareData && Array.isArray(welfareData)) {
          for (const r of welfareData as any[]) {
            const typeLabel = getWelfareTypeLabel(r.request_type || '');
            const statusLabel = STATUS_LABELS[r.status] || r.status;
            items.push({
              id: `welfare-${r.id}`,
              date: r.created_at,
              category: 'welfare',
              action: `ส่งคำขอ ${typeLabel}`,
              details: r.run_number
                ? `เลขที่ ${r.run_number} - ${statusLabel}${r.amount ? ` ฿${Number(r.amount).toLocaleString()}` : ''}`
                : `${statusLabel}${r.amount ? ` ฿${Number(r.amount).toLocaleString()}` : ''}`,
              status: r.status,
              amount: r.amount ? Number(r.amount) : undefined,
              type: r.request_type,
            });
          }
        }
      }

      // 2) Fetch leave_requests
      if (categoryFilter === 'all' || categoryFilter === 'leave') {
        let leaveQuery = (supabase as any)
          .from('leave_requests')
          .select('id, created_at, status, start_date, end_date, total_days, reason, leave_type_id, is_half_day, half_day_period')
          .eq('employee_email', user.email)
          .order('created_at', { ascending: false })
          .limit(100);

        if (startDate) {
          leaveQuery = leaveQuery.gte('created_at', startDate);
        }

        const { data: leaveData } = await leaveQuery;

        // Fetch leave types for labels
        const { data: leaveTypes } = await (supabase as any)
          .from('leave_types')
          .select('id, name_th');

        const leaveTypeMap: Record<number, string> = {};
        if (leaveTypes && Array.isArray(leaveTypes)) {
          for (const lt of leaveTypes as any[]) {
            leaveTypeMap[lt.id] = lt.name_th;
          }
        }

        if (leaveData && Array.isArray(leaveData)) {
          for (const r of leaveData as any[]) {
            const leaveTypeName = leaveTypeMap[r.leave_type_id] || 'ลา';
            const statusLabel = STATUS_LABELS[r.status] || r.status;
            const halfDayText = r.is_half_day
              ? ` (${r.half_day_period === 'morning' ? 'ครึ่งเช้า' : 'ครึ่งบ่าย'})`
              : '';
            items.push({
              id: `leave-${r.id}`,
              date: r.created_at,
              category: 'leave',
              action: `ส่งคำขอ${leaveTypeName}`,
              details: `${r.start_date} ถึง ${r.end_date} (${r.total_days} วัน${halfDayText}) - ${statusLabel}`,
              status: r.status,
              type: leaveTypeName,
            });
          }
        }
      }

      // 3) Fetch audit_logs for login events
      if (categoryFilter === 'all' || categoryFilter === 'login') {
        let loginQuery = (supabase as any)
          .from('audit_logs')
          .select('id, created_at, action, details, status, category')
          .eq('user_id', user.id)
          .eq('category', 'authentication')
          .order('created_at', { ascending: false })
          .limit(50);

        if (startDate) {
          loginQuery = loginQuery.gte('created_at', startDate);
        }

        const { data: loginData } = await loginQuery;

        if (loginData && Array.isArray(loginData)) {
          for (const r of loginData as any[]) {
            items.push({
              id: `login-${r.id}`,
              date: r.created_at,
              category: 'login',
              action: r.action === 'login' ? 'เข้าสู่ระบบ' : r.action === 'logout' ? 'ออกจากระบบ' : r.action,
              details: r.details || '',
              status: r.status || 'success',
            });
          }
        }
      }

      // Sort all by date descending
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Apply search filter
      let filtered = items;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = items.filter(
          (item) =>
            item.action.toLowerCase().includes(term) ||
            item.details.toLowerCase().includes(term) ||
            (item.type || '').toLowerCase().includes(term)
        );
      }

      setActivities(filtered);
    } catch (error) {
      console.error('Error fetching activity history:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดประวัติกิจกรรมได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.id, profile?.employee_id, searchTerm, categoryFilter, dateRange, getStartDate, toast]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const exportCsv = () => {
    try {
      const csvContent = [
        ['เวลา', 'หมวดหมู่', 'การกระทำ', 'รายละเอียด', 'สถานะ'].join(','),
        ...activities.map((a) =>
          [
            new Date(a.date).toLocaleString('th-TH'),
            getCategoryLabel(a.category),
            `"${a.action}"`,
            `"${a.details.replace(/"/g, '""')}"`,
            getStatusLabel(a.status),
          ].join(',')
        ),
      ].join('\n');

      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `activity_history_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'ส่งออกสำเร็จ', description: `ส่งออก ${activities.length} รายการเรียบร้อยแล้ว` });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถส่งออกได้', variant: 'destructive' });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'welfare': return <FileText className="h-4 w-4" />;
      case 'leave': return <CalendarDays className="h-4 w-4" />;
      case 'login': return <LogIn className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'welfare': return 'คำขอสวัสดิการ';
      case 'leave': return 'คำขอลา';
      case 'login': return 'เข้าสู่ระบบ';
      default: return category;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      welfare: 'bg-green-100 text-green-800',
      leave: 'bg-teal-100 text-teal-800',
      login: 'bg-indigo-100 text-indigo-800',
    };
    return (
      <Badge className={colors[category] || 'bg-gray-100 text-gray-800'}>
        {getCategoryIcon(category)}
        <span className="ml-1">{getCategoryLabel(category)}</span>
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed' || status === 'approved' || status === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (status.startsWith('rejected') || status === 'failed' || status === 'cancelled') {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    if (status.startsWith('pending')) {
      return <Clock className="h-4 w-4 text-amber-500" />;
    }
    return <Send className="h-4 w-4 text-blue-500" />;
  };

  const getStatusLabel = (status: string) => {
    return STATUS_LABELS[status] || (status === 'success' ? 'สำเร็จ' : status);
  };

  const getStatusBadge = (status: string) => {
    const label = getStatusLabel(status);
    if (status === 'completed' || status === 'approved' || status === 'success') {
      return <Badge className="bg-green-100 text-green-800">{getStatusIcon(status)}<span className="ml-1">{label}</span></Badge>;
    }
    if (status.startsWith('rejected') || status === 'failed' || status === 'cancelled') {
      return <Badge className="bg-red-100 text-red-800">{getStatusIcon(status)}<span className="ml-1">{label}</span></Badge>;
    }
    if (status.startsWith('pending')) {
      return <Badge className="bg-amber-100 text-amber-800">{getStatusIcon(status)}<span className="ml-1">{label}</span></Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">{label}</Badge>;
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ประวัติกิจกรรมของคุณ</h1>
            <p className="text-muted-foreground">ดูประวัติคำขอสวัสดิการ การลา และการเข้าสู่ระบบ</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={fetchActivities} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              รีเฟรช
            </Button>
            <Button onClick={exportCsv} size="sm">
              <Download className="w-4 h-4 mr-2" />
              ส่งออก CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Filter className="w-5 h-5 mr-2" />
              ตัวกรอง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">ค้นหา</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ค้นหาการกระทำ, รายละเอียด..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium">หมวดหมู่</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="welfare">คำขอสวัสดิการ</SelectItem>
                    <SelectItem value="leave">คำขอลา</SelectItem>
                    <SelectItem value="login">เข้าสู่ระบบ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">ช่วงเวลา</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">7 วันที่แล้ว</SelectItem>
                    <SelectItem value="30days">30 วันที่แล้ว</SelectItem>
                    <SelectItem value="90days">90 วันที่แล้ว</SelectItem>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              ประวัติกิจกรรม ({activities.length} รายการ)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เวลา</TableHead>
                      <TableHead>หมวดหมู่</TableHead>
                      <TableHead>การกระทำ</TableHead>
                      <TableHead>รายละเอียด</TableHead>
                      <TableHead>สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.length > 0 ? (
                      activities.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm whitespace-nowrap">
                            {new Date(item.date).toLocaleString('th-TH')}
                          </TableCell>
                          <TableCell>{getCategoryBadge(item.category)}</TableCell>
                          <TableCell className="font-medium">{item.action}</TableCell>
                          <TableCell className="max-w-xs truncate" title={item.details}>
                            {item.details || '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          ไม่พบประวัติกิจกรรมที่ตรงกับเงื่อนไข
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
};

export default ActivityHistoryPage;
