import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  Activity, 
  Download, 
  Filter, 
  Search,
  RefreshCw,
  Eye,
  User,
  FileText,
  Settings,
  Shield,
  Database
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userEmail: string;
  action: string;
  category: 'user_management' | 'welfare_request' | 'system_config' | 'security' | 'database';
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high';
  status: 'success' | 'failed' | 'warning';
}

export const AuditLogs = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7days');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm, categoryFilter, severityFilter, statusFilter, dateRange]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      // Mock audit logs data - in real implementation, fetch from audit_logs table
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          user: 'SuperAdmin',
          userEmail: 'superadmin@company.com',
          action: 'สร้างผู้ใช้ใหม่',
          category: 'user_management',
          details: 'สร้างบัญชีผู้ใช้ใหม่: john.doe@company.com',
          ipAddress: '192.168.1.100',
          userAgent: 'Chrome 120.0.0.0',
          severity: 'medium',
          status: 'success'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          user: 'Admin User',
          userEmail: 'admin@company.com',
          action: 'อนุมัติคำขอสวัสดิการ',
          category: 'welfare_request',
          details: 'อนุมัติคำขอสวัสดิการแต่งงาน ID: 123',
          ipAddress: '192.168.1.101',
          userAgent: 'Firefox 121.0.0.0',
          severity: 'low',
          status: 'success'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          user: 'SuperAdmin',
          userEmail: 'superadmin@company.com',
          action: 'เปลี่ยนการตั้งค่าระบบ',
          category: 'system_config',
          details: 'เปลี่ยนงบประมาณเริ่มต้นสำหรับสวัสดิการแต่งงาน',
          ipAddress: '192.168.1.100',
          userAgent: 'Chrome 120.0.0.0',
          severity: 'high',
          status: 'success'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          user: 'Unknown',
          userEmail: 'unknown@example.com',
          action: 'พยายามเข้าสู่ระบบ',
          category: 'security',
          details: 'พยายามเข้าสู่ระบบด้วยรหัสผ่านผิด',
          ipAddress: '203.0.113.1',
          userAgent: 'Unknown',
          severity: 'high',
          status: 'failed'
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          user: 'SuperAdmin',
          userEmail: 'superadmin@company.com',
          action: 'สำรองข้อมูล',
          category: 'database',
          details: 'สำรองข้อมูลฐานข้อมูลแบบด้วยตนเอง',
          ipAddress: '192.168.1.100',
          userAgent: 'Chrome 120.0.0.0',
          severity: 'medium',
          status: 'success'
        }
      ];

      setLogs(mockLogs);

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
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(log => log.severity === severityFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    // Date range filter
    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case '1day':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate = new Date(0); // All time
    }

    filtered = filtered.filter(log => new Date(log.timestamp) >= startDate);

    setFilteredLogs(filtered);
  };

  const exportLogs = () => {
    try {
      const csvContent = [
        ['Timestamp', 'User', 'Email', 'Action', 'Category', 'Details', 'IP Address', 'Severity', 'Status'].join(','),
        ...filteredLogs.map(log => [
          log.timestamp,
          log.user,
          log.userEmail,
          log.action,
          log.category,
          log.details,
          log.ipAddress,
          log.severity,
          log.status
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
        description: 'ส่งออกบันทึกการใช้งานเรียบร้อยแล้ว'
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
      case 'system_config':
        return <Settings className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      user_management: 'bg-blue-100 text-blue-800',
      welfare_request: 'bg-green-100 text-green-800',
      system_config: 'bg-purple-100 text-purple-800',
      security: 'bg-red-100 text-red-800',
      database: 'bg-orange-100 text-orange-800'
    };

    const labels = {
      user_management: 'จัดการผู้ใช้',
      welfare_request: 'คำขอสวัสดิการ',
      system_config: 'ตั้งค่าระบบ',
      security: 'ความปลอดภัย',
      database: 'ฐานข้อมูล'
    };

    return (
      <Badge className={colors[category as keyof typeof colors]}>
        {getCategoryIcon(category)}
        <span className="ml-1">{labels[category as keyof typeof labels]}</span>
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
                  <SelectItem value="user_management">จัดการผู้ใช้</SelectItem>
                  <SelectItem value="welfare_request">คำขอสวัสดิการ</SelectItem>
                  <SelectItem value="system_config">ตั้งค่าระบบ</SelectItem>
                  <SelectItem value="security">ความปลอดภัย</SelectItem>
                  <SelectItem value="database">ฐานข้อมูล</SelectItem>
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
          <CardTitle>บันทึกการใช้งาน ({filteredLogs.length} รายการ)</CardTitle>
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
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {new Date(log.timestamp).toLocaleString('th-TH')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.user}</div>
                            <div className="text-sm text-muted-foreground">{log.userEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell>{getCategoryBadge(log.category)}</TableCell>
                        <TableCell className="max-w-xs truncate" title={log.details}>
                          {log.details}
                        </TableCell>
                        <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
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