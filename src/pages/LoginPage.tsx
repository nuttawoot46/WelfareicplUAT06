
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import PinVerification from '@/components/auth/PinVerification';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define team data
const teams = [
  { id: 'strategy', name: 'Strategy' },
  { id: 'inspiration', name: 'Inspiration' },
  { id: 'registration', name: 'Registration/Procurement' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'finance', name: 'Accounting & Finance' }
];

// Define mock employee data by team
const employeesData = {
  strategy: [
    { id: 's1', name: 'สมชาย ใจดี', team: 'strategy' },
    { id: 's2', name: 'ณัฐพร รักษ์ไทย', team: 'strategy' },
    { id: 's3', name: 'วิชัย พัฒนา', team: 'strategy' }
  ],
  inspiration: [
    { id: 'i1', name: 'มานี มีหัวใจ', team: 'inspiration' },
    { id: 'i2', name: 'สุชาติ สร้างสรรค์', team: 'inspiration' },
    { id: 'i3', name: 'นภาพร ดาวเด่น', team: 'inspiration' }
  ],
  registration: [
    { id: 'r1', name: 'รัชนี จัดซื้อ', team: 'registration' },
    { id: 'r2', name: 'พรชัย เอกสาร', team: 'registration' },
    { id: 'r3', name: 'อนุสรณ์ พัสดุ', team: 'registration' }
  ],
  marketing: [
    { id: 'm1', name: 'กัญญา โฆษณา', team: 'marketing' },
    { id: 'm2', name: 'ไพศาล ขายเก่ง', team: 'marketing' },
    { id: 'm3', name: 'ศิริลักษณ์ สื่อสาร', team: 'marketing' }
  ],
  finance: [
    { id: 'f1', name: 'กนกวรรณ บัญชี', team: 'finance' },
    { id: 'f2', name: 'ประเสริฐ การเงิน', team: 'finance' },
    { id: 'f3', name: 'จิตรา ภาษี', team: 'finance' }
  ]
};

const LoginPage = () => {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [filteredEmployees, setFilteredEmployees] = useState<Array<{id: string, name: string}>>([]);
  
  const { user, selectUser, isLoading, error, requiresPinVerification } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Update filtered employees when team changes
  const handleTeamChange = (value: string) => {
    setSelectedTeam(value);
    setSelectedEmployee('');
    setFilteredEmployees(employeesData[value] || []);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeam || !selectedEmployee || !email) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณาเลือกทีม พนักงาน และกรอกอีเมล",
        variant: "destructive",
      });
      return;
    }
    
    if (!email.includes('@')) {
      toast({
        title: "รูปแบบอีเมลไม่ถูกต้อง",
        description: "กรุณาตรวจสอบอีเมลอีกครั้ง",
        variant: "destructive",
      });
      return;
    }
    
    // Use the selectUser method
    selectUser(selectedTeam, selectedEmployee, email);
    
    toast({
      title: "เข้าสู่ระบบสำเร็จ",
      description: "ยินดีต้อนรับสู่ระบบสวัสดิการพนักงาน",
      variant: "default",
    });
  };

  const handlePinVerified = () => {
    toast({
      title: 'สำเร็จ',
      description: 'ยืนยันตัวตนสำเร็จ! กำลังนำคุณไปยังแดชบอร์ด',
      variant: 'default',
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Login Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-primary mx-auto flex items-center justify-center text-white font-bold text-2xl mb-4">
              WF
            </div>
            <h1 className="text-3xl font-bold text-gray-900">ระบบสวัสดิการพนักงาน</h1>
            <p className="text-gray-600 mt-2">ยินดีต้อนรับ กรุณาเข้าสู่ระบบเพื่อดำเนินการ</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Show any errors */}
            {error && (
              <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="team" className="block text-sm font-medium text-gray-700">
                เลือกทีม
              </label>
              <Select value={selectedTeam} onValueChange={handleTeamChange}>
                <SelectTrigger id="team" className="w-full">
                  <SelectValue placeholder="เลือกทีม" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="employee" className="block text-sm font-medium text-gray-700">
                เลือกพนักงาน
              </label>
              <Select 
                value={selectedEmployee} 
                onValueChange={setSelectedEmployee}
                disabled={!selectedTeam}
              >
                <SelectTrigger id="employee" className="w-full">
                  <SelectValue placeholder="เลือกพนักงาน" />
                </SelectTrigger>
                <SelectContent>
                  {filteredEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                อีเมล
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@company.com"
                required
                className="form-input"
              />
            </div>

            <Button type="submit" className="w-full btn-hover-effect" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="animate-spin inline-block h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  เข้าสู่ระบบ
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
      {requiresPinVerification && user && (
        <PinVerification
          isOpen={requiresPinVerification}
          onClose={() => {}}
          user={user}
          onPinVerified={handlePinVerified}
          isNewPin={!user.hasPinSet}
        />
      )}
      
      {/* Right side - Decorative Java-inspired Background */}
      <div className="hidden md:block md:w-1/2 bg-gradient-primary relative overflow-hidden java-effect">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-lg text-white shadow-lg border border-white/20">
            <h2 className="text-3xl font-bold mb-4">ยินดีต้อนรับสู่ระบบสวัสดิการพนักงาน</h2>
            <p className="mb-6">
              ระบบการจัดการสวัสดิการที่ครบวงจรสำหรับพนักงานทุกคน ช่วยให้การยื่นคำร้องขอสวัสดิการเป็นเรื่องง่าย สะดวก และรวดเร็ว
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">ง่ายต่อการใช้งาน</h3>
                <p className="text-sm">กรอกแบบฟอร์มออนไลน์ได้ทุกที่ทุกเวลา ไม่ต้องกรอกเอกสาร</p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">ติดตามสถานะ</h3>
                <p className="text-sm">ดูสถานะคำร้องขอสวัสดิการได้แบบเรียลไทม์</p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">การแจ้งเตือน</h3>
                <p className="text-sm">รับการแจ้งเตือนเมื่อมีการอัพเดทสถานะคำขอ</p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">รายงานสรุป</h3>
                <p className="text-sm">ดูสรุปการใช้สวัสดิการของคุณได้อย่างชัดเจน</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Animated Objects */}
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-welfare-teal/20 animate-bounce" style={{ animationDuration: '6s' }}></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-welfare-purple/20 animate-pulse-slow" style={{ animationDuration: '7s' }}></div>
        <div className="absolute top-1/3 right-10 w-16 h-16 rounded bg-welfare-orange/20 animate-spin-slow" style={{ animationDuration: '15s' }}></div>
      </div>
    </div>
  );
};

export default LoginPage;

