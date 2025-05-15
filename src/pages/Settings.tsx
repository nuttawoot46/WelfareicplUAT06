
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { User, Settings as SettingsIcon, Bell, Lock } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [dashboardNotifications, setDashboardNotifications] = useState(true);
  const [lineNotifications, setLineNotifications] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const handleSaveNotificationSettings = () => {
    toast({
      title: "บันทึกการตั้งค่าสำเร็จ",
      description: "การตั้งค่าการแจ้งเตือนถูกบันทึกแล้ว",
      variant: "default",
    });
  };
  
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "เปลี่ยนรหัสผ่านสำเร็จ",
      description: "รหัสผ่านของคุณได้รับการเปลี่ยนแปลงแล้ว",
      variant: "default",
    });
    
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">ตั้งค่า</h1>
        <p className="text-gray-600">จัดการบัญชีและการตั้งค่าของคุณ</p>
      </div>
      
      <div className="space-y-8 animate-fade-in">
        {/* Profile Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center space-x-2">
            <User className="h-5 w-5" />
            <CardTitle>ข้อมูลส่วนตัว</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                <Input id="name" defaultValue={user?.name} disabled />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">แผนก</Label>
                <Input id="department" defaultValue={user?.department} disabled />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input id="email" defaultValue={user?.email} disabled />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">ตำแหน่ง</Label>
                <Input id="role" defaultValue={user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน'} disabled />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Notification Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center space-x-2">
            <Bell className="h-5 w-5" />
            <CardTitle>การแจ้งเตือน</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">การแจ้งเตือนทางอีเมล</Label>
                  <p className="text-sm text-muted-foreground">รับการแจ้งเตือนผ่านทางอีเมล</p>
                </div>
                <Switch 
                  id="email-notifications" 
                  checked={emailNotifications} 
                  onCheckedChange={setEmailNotifications} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dashboard-notifications">การแจ้งเตือนบนแดชบอร์ด</Label>
                  <p className="text-sm text-muted-foreground">รับการแจ้งเตือนผ่านแดชบอร์ด</p>
                </div>
                <Switch 
                  id="dashboard-notifications" 
                  checked={dashboardNotifications} 
                  onCheckedChange={setDashboardNotifications} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="line-notifications">การแจ้งเตือนผ่าน Line</Label>
                  <p className="text-sm text-muted-foreground">รับการแจ้งเตือนผ่านแอพพลิเคชั่น Line</p>
                </div>
                <Switch 
                  id="line-notifications" 
                  checked={lineNotifications} 
                  onCheckedChange={setLineNotifications} 
                />
              </div>
            </div>
            
            <Button onClick={handleSaveNotificationSettings}>บันทึกการตั้งค่า</Button>
          </CardContent>
        </Card>
        
        {/* Password Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center space-x-2">
            <Lock className="h-5 w-5" />
            <CardTitle>เปลี่ยนรหัสผ่าน</CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">รหัสผ่านปัจจุบัน</Label>
                <Input 
                  id="current-password" 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
                <Input 
                  id="new-password" 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</Label>
                <Input 
                  id="confirm-password" 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit">เปลี่ยนรหัสผ่าน</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;
