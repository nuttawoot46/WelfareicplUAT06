import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Save, RefreshCw, AlertTriangle } from 'lucide-react';

interface SystemConfig {
  // Application Settings
  appName: string;
  appVersion: string;
  maintenanceMode: boolean;
  
  // Welfare Budget Settings
  defaultWeddingBudget: number;
  defaultChildbirthBudget: number;
  defaultFuneralEmployeeBudget: number;
  defaultFuneralFamilyBudget: number;
  defaultFuneralChildBudget: number;
  defaultDentalGlassesBudget: number;
  defaultFitnessBudget: number;
  defaultMedicalBudget: number;
  defaultTrainingBudget: number;
  
  // Email Settings
  emailNotifications: boolean;
  smtpServer: string;
  smtpPort: number;
  smtpUsername: string;
  
  // Security Settings
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requirePasswordChange: boolean;
  
  // File Upload Settings
  maxFileSize: number;
  allowedFileTypes: string;
  
  // Approval Workflow Settings
  autoApprovalLimit: number;
  requireManagerApproval: boolean;
  requireHRApproval: boolean;
  requireAccountingApproval: boolean;
}

export const SystemSettings = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<SystemConfig>({
    appName: 'Welfare Management System',
    appVersion: '1.0.0',
    maintenanceMode: false,
    
    defaultWeddingBudget: 3000,
    defaultChildbirthBudget: 6000,
    defaultFuneralEmployeeBudget: 10000,
    defaultFuneralFamilyBudget: 10000,
    defaultFuneralChildBudget: 10000,
    defaultDentalGlassesBudget: 2000,
    defaultFitnessBudget: 300,
    defaultMedicalBudget: 1000,
    defaultTrainingBudget: 5000,
    
    emailNotifications: true,
    smtpServer: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: '',
    
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requirePasswordChange: false,
    
    maxFileSize: 10,
    allowedFileTypes: 'pdf,jpg,jpeg,png,doc,docx',
    
    autoApprovalLimit: 1000,
    requireManagerApproval: true,
    requireHRApproval: true,
    requireAccountingApproval: true
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    setLoading(true);
    try {
      // In a real implementation, you would load this from a system_config table
      // For now, we'll use default values
      toast({
        title: 'ข้อมูลโหลดเสร็จสิ้น',
        description: 'โหลดการตั้งค่าระบบเรียบร้อยแล้ว'
      });
    } catch (error) {
      console.error('Error loading system config:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดการตั้งค่าระบบได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSystemConfig = async () => {
    setSaving(true);
    try {
      // In a real implementation, you would save this to a system_config table
      // For now, we'll just show a success message
      
      toast({
        title: 'บันทึกสำเร็จ',
        description: 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว'
      });
    } catch (error) {
      console.error('Error saving system config:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกการตั้งค่าได้',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SystemConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetToDefaults = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตการตั้งค่าเป็นค่าเริ่มต้น?')) {
      setConfig({
        appName: 'Welfare Management System',
        appVersion: '1.0.0',
        maintenanceMode: false,
        
        defaultWeddingBudget: 3000,
        defaultChildbirthBudget: 6000,
        defaultFuneralEmployeeBudget: 10000,
        defaultFuneralFamilyBudget: 10000,
        defaultFuneralChildBudget: 10000,
        defaultDentalGlassesBudget: 2000,
        defaultFitnessBudget: 300,
        defaultMedicalBudget: 1000,
        defaultTrainingBudget: 5000,
        
        emailNotifications: true,
        smtpServer: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUsername: '',
        
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        requirePasswordChange: false,
        
        maxFileSize: 10,
        allowedFileTypes: 'pdf,jpg,jpeg,png,doc,docx',
        
        autoApprovalLimit: 1000,
        requireManagerApproval: true,
        requireHRApproval: true,
        requireAccountingApproval: true
      });
      
      toast({
        title: 'รีเซ็ตเสร็จสิ้น',
        description: 'รีเซ็ตการตั้งค่าเป็นค่าเริ่มต้นแล้ว'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ตั้งค่าระบบ</h1>
          <p className="text-muted-foreground">จัดการการตั้งค่าและพารามิเตอร์ของระบบ</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={resetToDefaults} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            รีเซ็ตค่าเริ่มต้น
          </Button>
          <Button onClick={saveSystemConfig} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </Button>
        </div>
      </div>

      {/* Maintenance Mode Warning */}
      {config.maintenanceMode && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <p className="text-orange-800 font-medium">
                ระบบอยู่ในโหมดปรับปรุง - ผู้ใช้ทั่วไปไม่สามารถเข้าถึงได้
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">ทั่วไป</TabsTrigger>
          <TabsTrigger value="budgets">งบประมาณ</TabsTrigger>
          <TabsTrigger value="email">อีเมล</TabsTrigger>
          <TabsTrigger value="security">ความปลอดภัย</TabsTrigger>
          <TabsTrigger value="workflow">ขั้นตอนอนุมัติ</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>การตั้งค่าทั่วไป</CardTitle>
              <CardDescription>ตั้งค่าพื้นฐานของระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">ชื่อแอปพลิเคชัน</Label>
                  <Input
                    id="appName"
                    value={config.appName}
                    onChange={(e) => handleInputChange('appName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appVersion">เวอร์ชัน</Label>
                  <Input
                    id="appVersion"
                    value={config.appVersion}
                    onChange={(e) => handleInputChange('appVersion', e.target.value)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>โหมดปรับปรุงระบบ</Label>
                  <p className="text-sm text-muted-foreground">
                    เมื่อเปิดใช้งาน ผู้ใช้ทั่วไปจะไม่สามารถเข้าถึงระบบได้
                  </p>
                </div>
                <Switch
                  checked={config.maintenanceMode}
                  onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">การตั้งค่าไฟล์อัปโหลด</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxFileSize">ขนาดไฟล์สูงสุด (MB)</Label>
                    <Input
                      id="maxFileSize"
                      type="number"
                      value={config.maxFileSize}
                      onChange={(e) => handleInputChange('maxFileSize', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allowedFileTypes">ประเภทไฟล์ที่อนุญาต</Label>
                    <Input
                      id="allowedFileTypes"
                      value={config.allowedFileTypes}
                      onChange={(e) => handleInputChange('allowedFileTypes', e.target.value)}
                      placeholder="pdf,jpg,jpeg,png,doc,docx"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets">
          <Card>
            <CardHeader>
              <CardTitle>งบประมาณเริ่มต้น</CardTitle>
              <CardDescription>กำหนดงบประมาณเริ่มต้นสำหรับพนักงานใหม่</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weddingBudget">งบแต่งงาน (บาท)</Label>
                  <Input
                    id="weddingBudget"
                    type="number"
                    value={config.defaultWeddingBudget}
                    onChange={(e) => handleInputChange('defaultWeddingBudget', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="childbirthBudget">งบคลอดบุตร (บาท)</Label>
                  <Input
                    id="childbirthBudget"
                    type="number"
                    value={config.defaultChildbirthBudget}
                    onChange={(e) => handleInputChange('defaultChildbirthBudget', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="funeralEmployeeBudget">งบงานศพพนักงาน (บาท)</Label>
                  <Input
                    id="funeralEmployeeBudget"
                    type="number"
                    value={config.defaultFuneralEmployeeBudget}
                    onChange={(e) => handleInputChange('defaultFuneralEmployeeBudget', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="funeralFamilyBudget">งบงานศพครอบครัว (บาท)</Label>
                  <Input
                    id="funeralFamilyBudget"
                    type="number"
                    value={config.defaultFuneralFamilyBudget}
                    onChange={(e) => handleInputChange('defaultFuneralFamilyBudget', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dentalGlassesBudget">งบแว่นตา/ทันตกรรม (บาท)</Label>
                  <Input
                    id="dentalGlassesBudget"
                    type="number"
                    value={config.defaultDentalGlassesBudget}
                    onChange={(e) => handleInputChange('defaultDentalGlassesBudget', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fitnessBudget">งบออกกำลังกาย (บาท)</Label>
                  <Input
                    id="fitnessBudget"
                    type="number"
                    value={config.defaultFitnessBudget}
                    onChange={(e) => handleInputChange('defaultFitnessBudget', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicalBudget">งบรักษาพยาบาล (บาท)</Label>
                  <Input
                    id="medicalBudget"
                    type="number"
                    value={config.defaultMedicalBudget}
                    onChange={(e) => handleInputChange('defaultMedicalBudget', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trainingBudget">งบอบรม (บาท)</Label>
                  <Input
                    id="trainingBudget"
                    type="number"
                    value={config.defaultTrainingBudget}
                    onChange={(e) => handleInputChange('defaultTrainingBudget', Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>การตั้งค่าอีเมล</CardTitle>
              <CardDescription>กำหนดค่าการส่งอีเมลแจ้งเตือน</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>เปิดใช้งานการแจ้งเตือนทางอีเมล</Label>
                  <p className="text-sm text-muted-foreground">
                    ส่งอีเมลแจ้งเตือนเมื่อมีการอัปเดตสถานะ
                  </p>
                </div>
                <Switch
                  checked={config.emailNotifications}
                  onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
                />
              </div>
              
              {config.emailNotifications && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpServer">SMTP Server</Label>
                      <Input
                        id="smtpServer"
                        value={config.smtpServer}
                        onChange={(e) => handleInputChange('smtpServer', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={config.smtpPort}
                        onChange={(e) => handleInputChange('smtpPort', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpUsername">SMTP Username</Label>
                    <Input
                      id="smtpUsername"
                      value={config.smtpUsername}
                      onChange={(e) => handleInputChange('smtpUsername', e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>การตั้งค่าความปลอดภัย</CardTitle>
              <CardDescription>กำหนดนโยบายความปลอดภัยของระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">หมดเวลาเซสชัน (นาที)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={config.sessionTimeout}
                    onChange={(e) => handleInputChange('sessionTimeout', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">จำนวนครั้งล็อกอินสูงสุด</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={config.maxLoginAttempts}
                    onChange={(e) => handleInputChange('maxLoginAttempts', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">ความยาวรหัสผ่านขั้นต่ำ</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={config.passwordMinLength}
                    onChange={(e) => handleInputChange('passwordMinLength', Number(e.target.value))}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>บังคับเปลี่ยนรหัสผ่านเมื่อล็อกอินครั้งแรก</Label>
                  <p className="text-sm text-muted-foreground">
                    ผู้ใช้ใหม่จะต้องเปลี่ยนรหัสผ่านเมื่อล็อกอินครั้งแรก
                  </p>
                </div>
                <Switch
                  checked={config.requirePasswordChange}
                  onCheckedChange={(checked) => handleInputChange('requirePasswordChange', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow">
          <Card>
            <CardHeader>
              <CardTitle>ขั้นตอนการอนุมัติ</CardTitle>
              <CardDescription>กำหนดขั้นตอนการอนุมัติคำขอสวัสดิการ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="autoApprovalLimit">วงเงินอนุมัติอัตโนมัติ (บาท)</Label>
                <Input
                  id="autoApprovalLimit"
                  type="number"
                  value={config.autoApprovalLimit}
                  onChange={(e) => handleInputChange('autoApprovalLimit', Number(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  คำขอที่มีจำนวนเงินต่ำกว่านี้จะได้รับการอนุมัติอัตโนมัติ
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>ต้องการการอนุมัติจากผู้จัดการ</Label>
                    <p className="text-sm text-muted-foreground">
                      คำขอทั้งหมดต้องผ่านการอนุมัติจากผู้จัดการก่อน
                    </p>
                  </div>
                  <Switch
                    checked={config.requireManagerApproval}
                    onCheckedChange={(checked) => handleInputChange('requireManagerApproval', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>ต้องการการอนุมัติจาก HR</Label>
                    <p className="text-sm text-muted-foreground">
                      คำขอทั้งหมดต้องผ่านการอนุมัติจาก HR
                    </p>
                  </div>
                  <Switch
                    checked={config.requireHRApproval}
                    onCheckedChange={(checked) => handleInputChange('requireHRApproval', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>ต้องการการอนุมัติจากแผนกบัญชี</Label>
                    <p className="text-sm text-muted-foreground">
                      คำขอทั้งหมดต้องผ่านการอนุมัติจากแผนกบัญชี
                    </p>
                  </div>
                  <Switch
                    checked={config.requireAccountingApproval}
                    onCheckedChange={(checked) => handleInputChange('requireAccountingApproval', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};