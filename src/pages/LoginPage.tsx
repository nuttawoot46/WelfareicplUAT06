
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(email, password);
      
      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: "ยินดีต้อนรับสู่ระบบสวัสดิการพนักงาน",
        variant: "default",
      });
    } catch (error) {
      // Error is handled within the auth context
    }
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
            {/* Show any login errors */}
            {error && (
              <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

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

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                รหัสผ่าน
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="form-input"
              />
              <div className="text-right">
                <a href="#" className="text-sm text-welfare-blue hover:underline">
                  ลืมรหัสผ่าน?
                </a>
              </div>
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
            
            <div className="text-center text-sm text-gray-500 mt-4">
              <p className="mb-2">
                สำหรับการทดสอบ:
              </p>
              <p className="font-mono bg-gray-100 p-2 rounded text-xs">
                Employee: employee@example.com / password<br />
                Admin: admin@example.com / password
              </p>
            </div>
          </form>
        </div>
      </div>
      
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
