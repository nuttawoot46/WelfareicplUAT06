import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Database, 
  Shield, 
  Settings, 
  Activity, 
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Server,
  Lock
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  databaseSize: string;
  activeConnections: number;
}

export const SuperAdminDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    systemHealth: 'healthy',
    databaseSize: '0 MB',
    activeConnections: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    setLoading(true);
    try {
      // Fetch user count
      const { count: userCount } = await supabase
        .from('Employee')
        .select('*', { count: 'exact', head: true });

      // Fetch welfare requests count
      const { count: requestCount } = await supabase
        .from('welfare_requests')
        .select('*', { count: 'exact', head: true });

      // Fetch pending requests
      const { count: pendingCount } = await supabase
        .from('welfare_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending_manager', 'pending_hr', 'pending_accounting']);

      // Fetch completed requests
      const { count: completedCount } = await supabase
        .from('welfare_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      setStats({
        totalUsers: userCount || 0,
        totalRequests: requestCount || 0,
        pendingRequests: pendingCount || 0,
        completedRequests: completedCount || 0,
        systemHealth: 'healthy',
        databaseSize: '125 MB', // This would need to be fetched from database stats
        activeConnections: 12 // This would need to be fetched from connection pool
      });

    } catch (error) {
      console.error('Error fetching system stats:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลระบบได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'จัดการผู้ใช้',
      description: 'เพิ่ม แก้ไข หรือลบผู้ใช้ในระบบ',
      icon: Users,
      href: '/superadmin/users',
      color: 'bg-blue-500'
    },
    {
      title: 'ตั้งค่าระบบ',
      description: 'กำหนดค่าระบบและการทำงาน',
      icon: Settings,
      href: '/superadmin/system',
      color: 'bg-green-500'
    },
    {
      title: 'จัดการฐานข้อมูล',
      description: 'สำรองข้อมูล และจัดการฐานข้อมูล',
      icon: Database,
      href: '/superadmin/database',
      color: 'bg-purple-500'
    },
    {
      title: 'ความปลอดภัย',
      description: 'ตั้งค่าความปลอดภัยและสิทธิ์การเข้าถึง',
      icon: Shield,
      href: '/superadmin/security',
      color: 'bg-red-500'
    },
    {
      title: 'บันทึกการใช้งาน',
      description: 'ตรวจสอบบันทึกการใช้งานระบบ',
      icon: Activity,
      href: '/superadmin/audit',
      color: 'bg-orange-500'
    },
    {
      title: 'รายงานภาพรวม',
      description: 'ดูรายงานและสถิติการใช้งาน',
      icon: FileText,
      href: '/superadmin/report',
      color: 'bg-indigo-500'
    }
  ];

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />ปกติ</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />เตือน</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />วิกฤต</Badge>;
      default:
        return <Badge>ไม่ทราบ</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SuperAdmin Dashboard</h1>
          <p className="text-muted-foreground">จัดการและควบคุมระบบทั้งหมด</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchSystemStats} variant="outline">
            รีเฟรชข้อมูล
          </Button>
        </div>
      </div>

      {/* System Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ผู้ใช้ทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +2 จากเดือนที่แล้ว
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คำขอทั้งหมด</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              <Clock className="inline h-3 w-3 mr-1" />
              {stats.pendingRequests} รอดำเนินการ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สถานะระบบ</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {getHealthBadge(stats.systemHealth)}
            </div>
            <p className="text-xs text-muted-foreground">
              การเชื่อมต่อ: {stats.activeConnections}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ฐานข้อมูล</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.databaseSize}</div>
            <p className="text-xs text-muted-foreground">
              <CheckCircle className="inline h-3 w-3 mr-1 text-green-500" />
              สำรองล่าสุด: วันนี้
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>การจัดการด่วน</CardTitle>
          <CardDescription>เข้าถึงฟังก์ชันการจัดการหลักได้อย่างรวดเร็ว</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{action.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & System Info */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">กิจกรรมล่าสุด</TabsTrigger>
          <TabsTrigger value="system">ข้อมูลระบบ</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>กิจกรรมล่าสุด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">ผู้ใช้ใหม่ลงทะเบียนเข้าระบบ</p>
                    <p className="text-xs text-muted-foreground">5 นาทีที่แล้ว</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">คำขอสวัสดิการใหม่ถูกส่ง</p>
                    <p className="text-xs text-muted-foreground">15 นาทีที่แล้ว</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">การสำรองข้อมูลเสร็จสิ้น</p>
                    <p className="text-xs text-muted-foreground">1 ชั่วโมงที่แล้ว</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลระบบ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">เซิร์ฟเวอร์</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>CPU:</span>
                      <span>15%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory:</span>
                      <span>2.1GB / 8GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Disk:</span>
                      <span>45GB / 100GB</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">ฐานข้อมูล</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Connections:</span>
                      <span>{stats.activeConnections}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{stats.databaseSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Backup:</span>
                      <span>Today 03:00</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};