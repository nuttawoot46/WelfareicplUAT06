import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { auditLogApi, AuditLogFilters } from '@/services/auditLogApi';
import type { AuditLog } from '@/types';
import {
  Activity,
  Download,
  Filter,
  Search,
  RefreshCw,
  User,
  FileText,
  Settings,
  Shield,
  CalendarDays,
  LogIn,
} from 'lucide-react';

// Role config: what each role sees
const ROLE_CONFIG: Record<string, {
  title: string;
  description: string;
  categories: string[] | null; // null = ใช้ scoping แบบอื่น
  fetchMode: 'own' | 'department' | 'categories' | 'all';
}> = {
  employee: {
    title: 'ประวัติกิจกรรมของคุณ',
    description: 'ดูประวัติการส่งคำขอและสถานะการอนุมัติของคุณ',
    categories: null,
    fetchMode: 'own',
  },
  manager: {
    title: 'ประวัติกิจกรรมทีม',
    description: 'ดูประวัติกิจกรรมของสมาชิกในทีม',
    categories: null,
    fetchMode: 'department',
  },
  hr: {
    title: 'ประวัติสวัสดิการและการลา',
    description: 'ดูประวัติคำขอสวัสดิการและการลาทั้งหมด',
    categories: ['welfare_request', 'leave_request'],
    fetchMode: 'categories',
  },
  accounting: {
    title: 'ประวัติทางการเงิน',
    description: 'ดูประวัติการอนุมัติจ่ายเงินและคำขอสวัสดิการ',
    categories: ['welfare_request'],
    fetchMode: 'categories',
  },
  accountingandmanager: {
    title: 'ประวัติกิจกรรม',
    description: 'ดูประวัติกิจกรรมทีมและการเงิน',
    categories: ['welfare_request', 'leave_request'],
    fetchMode: 'categories',
  },
  admin: {
    title: 'ประวัติกิจกรรมระบบ',
    description: 'ดูประวัติการจัดการระบบและผู้ใช้',
    categories: ['user_management', 'system_config', 'authentication'],
    fetchMode: 'categories',
  },
};

export const ActivityHistoryPage = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const userRole = profile?.role?.toLowerCase() || 'employee';
  const config = ROLE_CONFIG[userRole] || ROLE_CONFIG.employee;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
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

  // Build available category options based on role
  const getAvailableCategories = useCallback(() => {
    if (config.fetchMode === 'own') {
      // Employee sees all categories but only their own data
      return [
        { value: 'welfare_request', label: 'คำขอสวัสดิการ' },
        { value: 'leave_request', label: 'คำขอลา' },
        { value: 'authentication', label: 'เข้าสู่ระบบ' },
      ];
    }
    if (config.fetchMode === 'department') {
      return [
        { value: 'welfare_request', label: 'คำขอสวัสดิการ' },
        { value: 'leave_request', label: 'คำขอลา' },
      ];
    }
    if (config.categories) {
      const categoryLabels: Record<string, string> = {
        welfare_request: 'คำขอสวัสดิการ',
        leave_request: 'คำขอลา',
        authentication: 'เข้าสู่ระบบ',
        user_management: 'จัดการผู้ใช้',
        system_config: 'ตั้งค่าระบบ',
        security: 'ความปลอดภัย',
      };
      return config.categories.map(cat => ({
        value: cat,
        label: categoryLabels[cat] || cat,
      }));
    }
    return [];
  }, [config]);

  const fetchLogs = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const baseFilters: AuditLogFilters = {
        search: searchTerm || undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        startDate: getStartDate(dateRange),
        limit: 100,
      };

      // Apply category filter if user selected one
      if (categoryFilter !== 'all') {
        baseFilters.category = categoryFilter;
      }

      let result: { data: AuditLog[]; count: number };

      switch (config.fetchMode) {
        case 'own':
          result = await auditLogApi.getUserLogs(user.id, baseFilters);
          break;
        case 'department': {
          const department = profile?.department || '';
          if (department) {
            result = await auditLogApi.getDepartmentLogs(department, baseFilters);
          } else {
            result = await auditLogApi.getUserLogs(user.id, baseFilters);
          }
          break;
        }
        case 'categories': {
          // If user selected a specific category, use that; otherwise use all allowed categories
          const categories = categoryFilter !== 'all'
            ? [categoryFilter]
            : (config.categories || []);
          result = await auditLogApi.getLogsByCategories(categories, baseFilters);
          break;
        }
        default:
          result = await auditLogApi.getUserLogs(user.id, baseFilters);
      }

      setLogs(result.data);
      setTotalCount(result.count);
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
  }, [user?.id, profile?.department, config, searchTerm, categoryFilter, severityFilter, dateRange, getStartDate, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const exportLogs = () => {
    try {
      const csvContent = [
        ['เวลา', 'ผู้ใช้', 'อีเมล', 'การกระทำ', 'หมวดหมู่', 'รายละเอียด', 'ระดับ', 'สถานะ'].join(','),
        ...logs.map(log => [
          log.created_at,
          `"${log.user_name || ''}"`,
          log.user_email || '',
          `"${log.action}"`,
          log.category,
          `"${(log.details || '').replace(/"/g, '""')}"`,
          log.severity,
          log.status,
        ].join(','))
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

      toast({ title: 'ส่งออกสำเร็จ', description: `ส่งออก ${logs.length} รายการเรียบร้อยแล้ว` });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถส่งออกได้', variant: 'destructive' });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'welfare_request': return <FileText className="h-4 w-4" />;
      case 'leave_request': return <CalendarDays className="h-4 w-4" />;
      case 'authentication': return <LogIn className="h-4 w-4" />;
      case 'user_management': return <User className="h-4 w-4" />;
      case 'system_config': return <Settings className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      welfare_request: 'bg-green-100 text-green-800',
      leave_request: 'bg-teal-100 text-teal-800',
      authentication: 'bg-indigo-100 text-indigo-800',
      user_management: 'bg-blue-100 text-blue-800',
      system_config: 'bg-purple-100 text-purple-800',
      security: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      welfare_request: 'คำขอสวัสดิการ',
      leave_request: 'คำขอลา',
      authentication: 'เข้าสู่ระบบ',
      user_management: 'จัดการผู้ใช้',
      system_config: 'ตั้งค่าระบบ',
      security: 'ความปลอดภัย',
    };
    return (
      <Badge className={colors[category] || 'bg-gray-100 text-gray-800'}>
        {getCategoryIcon(category)}
        <span className="ml-1">{labels[category] || category}</span>
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return <Badge className="bg-red-100 text-red-800">สูง</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">กลาง</Badge>;
      case 'low': return <Badge className="bg-green-100 text-green-800">ต่ำ</Badge>;
      default: return <Badge>-</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800">สำเร็จ</Badge>;
      case 'failed': return <Badge className="bg-red-100 text-red-800">ล้มเหลว</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">เตือน</Badge>;
      default: return <Badge>-</Badge>;
    }
  };

  const availableCategories = getAvailableCategories();
  const showCategoryFilter = availableCategories.length > 1;

  return (
    <Layout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{config.title}</h1>
          <p className="text-muted-foreground">{config.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchLogs} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            รีเฟรช
          </Button>
          <Button onClick={exportLogs} size="sm">
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
          <div className={cn(
            "grid gap-4",
            showCategoryFilter ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3"
          )}>
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">ค้นหา</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาผู้ใช้, การกระทำ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category filter - only if multiple categories */}
            {showCategoryFilter && (
              <div className="space-y-2">
                <label className="text-sm font-medium">หมวดหมู่</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {availableCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Severity */}
            <div className="space-y-2">
              <label className="text-sm font-medium">ระดับความสำคัญ</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="high">สูง</SelectItem>
                  <SelectItem value="medium">กลาง</SelectItem>
                  <SelectItem value="low">ต่ำ</SelectItem>
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

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            ประวัติกิจกรรม ({totalCount} รายการ)
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
                    {config.fetchMode !== 'own' && <TableHead>ผู้ใช้</TableHead>}
                    <TableHead>การกระทำ</TableHead>
                    <TableHead>หมวดหมู่</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('th-TH')}
                        </TableCell>
                        {config.fetchMode !== 'own' && (
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.user_name || '-'}</div>
                              <div className="text-sm text-muted-foreground">{log.user_email || '-'}</div>
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell>{getCategoryBadge(log.category)}</TableCell>
                        <TableCell className="max-w-xs truncate" title={log.details || ''}>
                          {log.details || '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={config.fetchMode !== 'own' ? 6 : 5} className="text-center py-8 text-muted-foreground">
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
    </Layout>
  );
};

// Helper - cn utility (re-export for local use)
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default ActivityHistoryPage;
