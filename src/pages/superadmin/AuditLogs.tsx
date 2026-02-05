import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { auditLogApi } from '@/services/auditLogApi';
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
  Database,
  CalendarDays,
  LogIn
} from 'lucide-react';

export const AuditLogs = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7days');

  const getStartDate = useCallback((range: string): string | undefined => {
    const now = new Date();
    switch (range) {
      case '1day':
        now.setDate(now.getDate() - 1);
        return now.toISOString();
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
        return undefined; // all time
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, count } = await auditLogApi.getLogs({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        startDate: getStartDate(dateRange),
        limit: 100,
      });
      setLogs(data);
      setTotalCount(count);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดบันทึกการใช้งานได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, severityFilter, statusFilter, searchTerm, dateRange, getStartDate, toast]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const exportLogs = () => {
    try {
      const csvContent = [
        ['Timestamp', 'User', 'Email', 'Role', 'Action', 'Category', 'Details', 'Severity', 'Status', 'Department'].join(','),
        ...logs.map(log => [
          log.created_at,
          `"${log.user_name || ''}"`,
          log.user_email || '',
          log.user_role || '',
          `"${log.action}"`,
          log.category,
          `"${(log.details || '').replace(/"/g, '""')}"`,
          log.severity,
          log.status,
          log.department || ''
        ].join(','))
      ].join('\n');

      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'ส่งออกสำเร็จ',
        description: `ส่งออกบันทึก ${logs.length} รายการเรียบร้อยแล้ว`
      });

    } catch (error) {
      console.error('Error exporting logs:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถส่งออกบันทึกได้',
        variant: 'destructive'
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user_management':
        return <User className="h-4 w-4" />;
      case 'welfare_request':
        return <FileText className="h-4 w-4" />;
      case 'leave_request':
        return <CalendarDays className="h-4 w-4" />;
      case 'system_config':
        return <Settings className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'authentication':
        return <LogIn className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      user_management: 'bg-blue-100 text-blue-800',
      welfare_request: 'bg-green-100 text-green-800',
      leave_request: 'bg-teal-100 text-teal-800',
      system_config: 'bg-purple-100 text-purple-800',
      security: 'bg-red-100 text-red-800',
      authentication: 'bg-indigo-100 text-indigo-800',
      database: 'bg-orange-100 text-orange-800'
    };

    const labels: Record<string, string> = {
      user_management: 'จัดการผู้ใช้',
      welfare_request: 'คำขอสวัสดิการ',
      leave_request: 'คำขอลา',
      system_config: 'ตั้งค่าระบบ',
      security: 'ความปลอดภัย',
      authentication: 'เข้าสู่ระบบ',
      database: 'ฐานข้อมูล'
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
      case 'high':
        return <Badge className="bg-red-100 text-red-800">สูง</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">กลาง</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">ต่ำ</Badge>;
      default:
        return <Badge>ไม่ทราบ</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">สำเร็จ</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">ล้มเหลว</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">เตือน</Badge>;
      default:
        return <Badge>ไม่ทราบ</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">บันทึกการใช้งาน</h1>
          <p className="text-muted-foreground">ตรวจสอบกิจกรรมและการเปลี่ยนแปลงในระบบ</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchAuditLogs} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            รีเฟรช
          </Button>
          <Button onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            ส่งออก CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            ตัวกรอง
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

            <div className="space-y-2">
              <label className="text-sm font-medium">หมวดหมู่</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="welfare_request">คำขอสวัสดิการ</SelectItem>
                  <SelectItem value="leave_request">คำขอลา</SelectItem>
                  <SelectItem value="authentication">เข้าสู่ระบบ</SelectItem>
                  <SelectItem value="user_management">จัดการผู้ใช้</SelectItem>
                  <SelectItem value="system_config">ตั้งค่าระบบ</SelectItem>
                  <SelectItem value="security">ความปลอดภัย</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

            <div className="space-y-2">
              <label className="text-sm font-medium">สถานะ</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="success">สำเร็จ</SelectItem>
                  <SelectItem value="failed">ล้มเหลว</SelectItem>
                  <SelectItem value="warning">เตือน</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ช่วงเวลา</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">1 วันที่แล้ว</SelectItem>
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
          <CardTitle>บันทึกการใช้งาน ({totalCount} รายการ)</CardTitle>
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
                    <TableHead>ผู้ใช้</TableHead>
                    <TableHead>การกระทำ</TableHead>
                    <TableHead>หมวดหมู่</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead>ระดับ</TableHead>
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
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.user_name || '-'}</div>
                            <div className="text-sm text-muted-foreground">{log.user_email || '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell>{getCategoryBadge(log.category)}</TableCell>
                        <TableCell className="max-w-xs truncate" title={log.details || ''}>
                          {log.details || '-'}
                        </TableCell>
                        <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        ไม่พบบันทึกการใช้งานที่ตรงกับเงื่อนไข
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
