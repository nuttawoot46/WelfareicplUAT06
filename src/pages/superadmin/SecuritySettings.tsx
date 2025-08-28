import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  Shield, 
  Lock, 
  Key, 
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Users,
  Activity,
  Ban
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: 'login_success' | 'login_failed' | 'password_change' | 'permission_change' | 'suspicious_activity';
  user: string;
  timestamp: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
}

interface ActiveSession {
  id: string;
  user: string;
  email: string;
  loginTime: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
}

export const SecuritySettings = () => {
  const { toast } = useToast();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Security Settings State
  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    passwordExpiry: 90,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    requireStrongPassword: true,
    logSecurityEvents: true,
    emailSecurityAlerts: true,
    ipWhitelist: '',
    allowMultipleSessions: true
  });

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      // Mock security events data
      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          type: 'login_success',
          user: 'admin@company.com',
          timestamp: new Date().toISOString(),
          details: 'เข้าสู่ระบบสำเร็จ',
          severity: 'low'
        },
        {
          id: '2',
          type: 'login_failed',
          user: 'unknown@example.com',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          details: 'พยายามเข้าสู่ระบบด้วยรหัสผ่านผิด 3 ครั้ง',
          severity: 'medium'
        },
        {
          id: '3',
          type: 'suspicious_activity',
          user: 'user@company.com',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          details: 'เข้าถึงจาก IP ที่ไม่คุ้นเคย',
          severity: 'high'
        }
      ];

      // Mock active sessions data
      const mockSessions: ActiveSession[] = [
        {
          id: '1',
          user: 'Admin User',
          email: 'admin@company.com',
          loginTime: new Date(Date.now() - 3600000).toISOString(),
          lastActivity: new Date().toISOString(),
          ipAddress: '192.168.1.100',
          userAgent: 'Chrome 120.0.0.0'
        },
        {
          id: '2',
          user: 'HR Manager',
          email: 'hr@company.com',
          loginTime: new Date(Date.now() - 1800000).toISOString(),
          lastActivity: new Date(Date.now() - 300000).toISOString(),
          ipAddress: '192.168.1.101',
          userAgent: 'Firefox 121.0.0.0'
        }
      ];

      setSecurityEvents(mockEvents);
      setActiveSessions(mockSessions);

    } catch (error) {
      console.error('Error fetching security data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลความปลอดภัยได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSecuritySettings = async () => {
    try {
      // In a real implementation, save to database
      toast({
        title: 'บันทึกสำเร็จ',
        description: 'บันทึกการตั้งค่าความปลอดภัยเรียบร้อยแล้ว'
      });
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกการตั้งค่าได้',
        variant: 'destructive'
      });
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
      toast({
        title: 'ยกเลิกเซสชันสำเร็จ',
        description: 'ยกเลิกเซสชันผู้ใช้เรียบร้อยแล้ว'
      });
    } catch (error) {
      console.error('Error terminating session:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถยกเลิกเซสชันได้',
        variant: 'destructive'
      });
    }
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

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login_success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'login_failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'password_change':
        return <Key className="h-4 w-4 text-blue-500" />;
      case 'permission_change':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'suspicious_activity':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">การตั้งค่าความปลอดภัย</h1>
          <p className="text-muted-foreground">จัดการความปลอดภัยและการเข้าถึงระบบ</p>
        </div>
        <Button onClick={saveSecuritySettings}>
          <Shield className="w-4 h-4 mr-2" />
          บันทึกการตั้งค่า
        </Button>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">การตั้งค่า</TabsTrigger>
          <TabsTrigger value="sessions">เซสชันที่ใช้งาน</TabsTrigger>
          <TabsTrigger value="events">บันทึกความปลอดภัย</TabsTrigger>
          <TabsTrigger value="permissions">สิทธิ์การเข้าถึง</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Authentication Settings */}
            <Card>
              <CardHeader>
                <CardTitle>การยืนยันตัวตน</CardTitle>
                <CardDescription>ตั้งค่าการเข้าสู่ระบบและการยืนยันตัวตน</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>การยืนยันตัวตนแบบ 2 ขั้นตอน</Label>
                    <p className="text-sm text-muted-foreground">
                      เพิ่มความปลอดภัยด้วยการยืนยันตัวตนแบบ 2 ขั้นตอน
                    </p>
                  </div>
                  <Switch
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, twoFactorAuth: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">จำนวนครั้งการเข้าสู่ระบบสูงสุด</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxLoginAttempts: Number(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration">ระยะเวลาล็อคบัญชี (นาที)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    value={settings.lockoutDuration}
                    onChange={(e) => setSettings(prev => ({ ...prev, lockoutDuration: Number(e.target.value) }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>บังคับใช้รหัสผ่านที่แข็งแกร่ง</Label>
                    <p className="text-sm text-muted-foreground">
                      รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่ เล็ก ตัวเลข และสัญลักษณ์
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireStrongPassword}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireStrongPassword: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Session Settings */}
            <Card>
              <CardHeader>
                <CardTitle>การจัดการเซสชัน</CardTitle>
                <CardDescription>ตั้งค่าเซสชันและการหมดเวลา</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">หมดเวลาเซสชัน (นาที)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordExpiry">หมดอายุรหัสผ่าน (วัน)</Label>
                  <Input
                    id="passwordExpiry"
                    type="number"
                    value={settings.passwordExpiry}
                    onChange={(e) => setSettings(prev => ({ ...prev, passwordExpiry: Number(e.target.value) }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>อนุญาตให้เข้าสู่ระบบหลายเซสชัน</Label>
                    <p className="text-sm text-muted-foreground">
                      ผู้ใช้สามารถเข้าสู่ระบบจากหลายอุปกรณ์พร้อมกันได้
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowMultipleSessions}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowMultipleSessions: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle>การตรวจสอบความปลอดภัย</CardTitle>
                <CardDescription>ตั้งค่าการตรวจสอบและแจ้งเตือน</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>บันทึกเหตุการณ์ความปลอดภัย</Label>
                    <p className="text-sm text-muted-foreground">
                      บันทึกการเข้าสู่ระบบและกิจกรรมที่น่าสงสัย
                    </p>
                  </div>
                  <Switch
                    checked={settings.logSecurityEvents}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, logSecurityEvents: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>แจ้งเตือนความปลอดภัยทางอีเมล</Label>
                    <p className="text-sm text-muted-foreground">
                      ส่งอีเมลแจ้งเตือนเมื่อมีกิจกรรมที่น่าสงสัย
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailSecurityAlerts}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailSecurityAlerts: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* IP Whitelist */}
            <Card>
              <CardHeader>
                <CardTitle>การควบคุมการเข้าถึง</CardTitle>
                <CardDescription>จำกัดการเข้าถึงจาก IP ที่กำหนด</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ipWhitelist">รายการ IP ที่อนุญาต</Label>
                  <Input
                    id="ipWhitelist"
                    placeholder="192.168.1.0/24, 10.0.0.1"
                    value={settings.ipWhitelist}
                    onChange={(e) => setSettings(prev => ({ ...prev, ipWhitelist: e.target.value }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    ใส่ IP address หรือ CIDR notation คั่นด้วยเครื่องหมายจุลภาค
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>เซสชันที่ใช้งานอยู่</CardTitle>
              <CardDescription>ผู้ใช้ที่เข้าสู่ระบบอยู่ในขณะนี้</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{session.user}</h3>
                          <p className="text-sm text-muted-foreground">{session.email}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                            <span>เข้าสู่ระบบ: {new Date(session.loginTime).toLocaleString('th-TH')}</span>
                            <span>กิจกรรมล่าสุด: {new Date(session.lastActivity).toLocaleString('th-TH')}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>IP: {session.ipAddress}</span>
                            <span>Browser: {session.userAgent}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => terminateSession(session.id)}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        ยกเลิกเซสชัน
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>บันทึกเหตุการณ์ความปลอดภัย</CardTitle>
              <CardDescription>ประวัติการเข้าสู่ระบบและกิจกรรมที่น่าสงสัย</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {securityEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getEventIcon(event.type)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{event.user}</h3>
                            {getSeverityBadge(event.severity)}
                          </div>
                          <p className="text-sm text-muted-foreground">{event.details}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString('th-TH')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>สิทธิ์การเข้าถึง</CardTitle>
              <CardDescription>จัดการสิทธิ์และบทบาทของผู้ใช้</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">SuperAdmin</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>จัดการผู้ใช้ทั้งหมด</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>ตั้งค่าระบบ</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>จัดการฐานข้อมูล</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>ความปลอดภัย</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Admin</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>จัดการผู้ใช้</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>ดูรายงาน</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span>ตั้งค่าระบบ (จำกัด)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">HR</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>อนุมัติคำขอ</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>ดูข้อมูลพนักงาน</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span>จัดการผู้ใช้ (ไม่ได้)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};