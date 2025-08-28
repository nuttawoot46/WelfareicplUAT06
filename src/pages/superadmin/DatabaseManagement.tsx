import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Activity
} from 'lucide-react';

interface DatabaseStats {
  totalTables: number;
  totalRecords: number;
  databaseSize: string;
  lastBackup: string;
  backupStatus: 'success' | 'failed' | 'in-progress' | 'none';
}

interface TableInfo {
  name: string;
  records: number;
  size: string;
  lastModified: string;
}

export const DatabaseManagement = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DatabaseStats>({
    totalTables: 0,
    totalRecords: 0,
    databaseSize: '0 MB',
    lastBackup: 'ไม่เคย',
    backupStatus: 'none'
  });
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [backupInProgress, setBackupInProgress] = useState(false);

  useEffect(() => {
    fetchDatabaseStats();
    fetchTableInfo();
  }, []);

  const fetchDatabaseStats = async () => {
    try {
      // Get Employee count
      const { count: employeeCount } = await supabase
        .from('Employee')
        .select('*', { count: 'exact', head: true });

      // Get welfare requests count
      const { count: welfareCount } = await supabase
        .from('welfare_requests')
        .select('*', { count: 'exact', head: true });

      const totalRecords = (employeeCount || 0) + (welfareCount || 0);

      setStats({
        totalTables: 5, // Approximate number of main tables
        totalRecords,
        databaseSize: '125 MB', // This would need to be fetched from database stats
        lastBackup: 'วันนี้ 03:00 น.',
        backupStatus: 'success'
      });

    } catch (error) {
      console.error('Error fetching database stats:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลฐานข้อมูลได้',
        variant: 'destructive'
      });
    }
  };

  const fetchTableInfo = async () => {
    setLoading(true);
    try {
      // Get counts for each table
      const { count: employeeCount } = await supabase
        .from('Employee')
        .select('*', { count: 'exact', head: true });

      const { count: welfareCount } = await supabase
        .from('welfare_requests')
        .select('*', { count: 'exact', head: true });

      const tableData: TableInfo[] = [
        {
          name: 'Employee',
          records: employeeCount || 0,
          size: '2.5 MB',
          lastModified: 'วันนี้'
        },
        {
          name: 'welfare_requests',
          records: welfareCount || 0,
          size: '15.2 MB',
          lastModified: 'วันนี้'
        },
        {
          name: 'notifications',
          records: 0,
          size: '0.8 MB',
          lastModified: 'เมื่อวาน'
        },
        {
          name: 'system_logs',
          records: 0,
          size: '5.1 MB',
          lastModified: 'วันนี้'
        },
        {
          name: 'auth.users',
          records: employeeCount || 0,
          size: '1.2 MB',
          lastModified: 'วันนี้'
        }
      ];

      setTables(tableData);

    } catch (error) {
      console.error('Error fetching table info:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลตารางได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const performBackup = async () => {
    setBackupInProgress(true);
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setStats(prev => ({
        ...prev,
        lastBackup: new Date().toLocaleString('th-TH'),
        backupStatus: 'success'
      }));

      toast({
        title: 'สำรองข้อมูลสำเร็จ',
        description: 'สำรองข้อมูลฐานข้อมูลเรียบร้อยแล้ว'
      });

    } catch (error) {
      console.error('Error performing backup:', error);
      setStats(prev => ({
        ...prev,
        backupStatus: 'failed'
      }));
      
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสำรองข้อมูลได้',
        variant: 'destructive'
      });
    } finally {
      setBackupInProgress(false);
    }
  };

  const exportData = async (tableName: string) => {
    try {
      let data;
      
      if (tableName === 'Employee') {
        const { data: employees } = await supabase
          .from('Employee')
          .select('*');
        data = employees;
      } else if (tableName === 'welfare_requests') {
        const { data: requests } = await supabase
          .from('welfare_requests')
          .select('*');
        data = requests;
      }

      if (data) {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tableName}_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: 'ส่งออกข้อมูลสำเร็จ',
          description: `ส่งออกข้อมูลจากตาราง ${tableName} เรียบร้อยแล้ว`
        });
      }

    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถส่งออกข้อมูลได้',
        variant: 'destructive'
      });
    }
  };

  const getBackupStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />สำเร็จ</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />ล้มเหลว</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />กำลังดำเนินการ</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">ไม่เคย</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">จัดการฐานข้อมูล</h1>
          <p className="text-muted-foreground">สำรองข้อมูล ส่งออก และจัดการฐานข้อมูล</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchDatabaseStats} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            รีเฟรช
          </Button>
          <Button onClick={performBackup} disabled={backupInProgress}>
            <Download className="w-4 h-4 mr-2" />
            {backupInProgress ? 'กำลังสำรอง...' : 'สำรองข้อมูล'}
          </Button>
        </div>
      </div>

      {/* Database Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">จำนวนตาราง</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTables}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">จำนวนข้อมูล</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ขนาดฐานข้อมูล</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.databaseSize}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สำรองข้อมูลล่าสุด</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold mb-2">{stats.lastBackup}</div>
            {getBackupStatusBadge(stats.backupStatus)}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tables">ตารางข้อมูล</TabsTrigger>
          <TabsTrigger value="backup">สำรองข้อมูล</TabsTrigger>
          <TabsTrigger value="maintenance">บำรุงรักษา</TabsTrigger>
        </TabsList>

        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle>ตารางข้อมูลในระบบ</CardTitle>
              <CardDescription>ข้อมูลและสถิติของแต่ละตาราง</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {tables.map((table, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Database className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold">{table.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {table.records.toLocaleString()} รายการ • {table.size} • แก้ไขล่าสุด: {table.lastModified}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportData(table.name)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          ส่งออก
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>การสำรองข้อมูล</CardTitle>
              <CardDescription>จัดการการสำรองข้อมูลและการกู้คืน</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">สำรองข้อมูลอัตโนมัติ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>สถานะ:</span>
                        <Badge className="bg-green-100 text-green-800">เปิดใช้งาน</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>ความถี่:</span>
                        <span>ทุกวันเวลา 03:00 น.</span>
                      </div>
                      <div className="flex justify-between">
                        <span>เก็บไว้:</span>
                        <span>30 วัน</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">สำรองข้อมูลด้วยตนเอง</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        สร้างการสำรองข้อมูลทันทีสำหรับการปรับปรุงหรือการเปลี่ยนแปลงที่สำคัญ
                      </p>
                      <Button 
                        onClick={performBackup} 
                        disabled={backupInProgress}
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {backupInProgress ? 'กำลังสำรอง...' : 'สำรองข้อมูลทันที'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ประวัติการสำรองข้อมูล</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">สำรองข้อมูลอัตโนมัติ</p>
                          <p className="text-sm text-muted-foreground">วันนี้ 03:00 น.</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">125 MB</div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">สำรองข้อมูลอัตโนมัติ</p>
                          <p className="text-sm text-muted-foreground">เมื่อวาน 03:00 น.</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">123 MB</div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">สำรองข้อมูลด้วยตนเอง</p>
                          <p className="text-sm text-muted-foreground">2 วันที่แล้ว 14:30 น.</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">120 MB</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>บำรุงรักษาฐานข้อมูล</CardTitle>
              <CardDescription>เครื่องมือสำหรับการบำรุงรักษาและเพิ่มประสิทธิภาพ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">เพิ่มประสิทธิภาพ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      อัปเดตสถิติตาราง
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="w-4 h-4 mr-2" />
                      ปรับปรุงดัชนี
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <HardDrive className="w-4 h-4 mr-2" />
                      ล้างข้อมูลชั่วคราว
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">การดำเนินการที่เสี่ยง</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="destructive" className="w-full justify-start">
                      <Trash2 className="w-4 h-4 mr-2" />
                      ล้างบันทึกเก่า
                    </Button>
                    <Button variant="destructive" className="w-full justify-start">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      รีเซ็ตฐานข้อมูล
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-800">คำเตือน</h4>
                      <p className="text-sm text-orange-700 mt-1">
                        การดำเนินการบำรุงรักษาบางอย่างอาจส่งผลต่อประสิทธิภาพของระบบ 
                        ควรทำในช่วงเวลาที่มีผู้ใช้น้อย และควรสำรองข้อมูลก่อนดำเนินการ
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};