
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

// Define types for the data we'll fetch
interface Team {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  team_id: string;
  department: string;
}

const TeamSelectionPage = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { selectUser, isLoading: authLoading, error: authError } = useAuth();
  const { toast } = useToast();
  
  // Fetch teams and employees from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch unique teams from the Employee table
        const { data: teamsData, error: teamsError } = await supabase
          .from('Employee')
          .select('team, department')
          .order('team')
          .distinct();
        
        if (teamsError) throw teamsError;
        
        // Transform the team data into the format we need
        const formattedTeams = teamsData.map((item, index) => ({
          id: item.team,
          name: item.team
        }));
        
        setTeams(formattedTeams);
        
        // Fetch all employees
        const { data: employeesData, error: employeesError } = await supabase
          .from('Employee')
          .select('*');
        
        if (employeesError) throw employeesError;
        
        setEmployees(employeesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Update filtered employees when team changes
  const handleTeamChange = (value: string) => {
    setSelectedTeam(value);
    setSelectedEmployee('');
    
    // Filter employees by the selected team
    const filtered = employees.filter(emp => emp.team_id === value);
    setFilteredEmployees(filtered);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
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
    
    // Find the selected employee
    const employee = employees.find(emp => emp.id === selectedEmployee);
    
    if (employee) {
      // Use the selectUser method with employee data
      selectUser(selectedTeam, selectedEmployee, email);
      
      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: "ยินดีต้อนรับสู่ระบบสวัสดิการพนักงาน",
        variant: "default",
      });
    } else {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่พบข้อมูลพนักงาน",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Selection Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-primary mx-auto flex items-center justify-center text-white font-bold text-2xl mb-4">
              WF
            </div>
            <h1 className="text-3xl font-bold text-gray-900">ระบบสวัสดิการพนักงาน</h1>
            <p className="text-gray-600 mt-2">กรุณาเลือกทีมและชื่อพนักงานเพื่อเข้าใช้งาน</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Show any errors */}
            {(error || authError) && (
              <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
                {error || authError}
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
                  {isLoading ? (
                    <SelectItem value="loading" disabled>กำลังโหลด...</SelectItem>
                  ) : teams.length > 0 ? (
                    teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>ไม่พบข้อมูลทีม</SelectItem>
                  )}
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
                disabled={!selectedTeam || isLoading}
              >
                <SelectTrigger id="employee" className="w-full">
                  <SelectValue placeholder="เลือกพนักงาน" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>กำลังโหลด...</SelectItem>
                  ) : filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>ไม่พบพนักงานในทีมที่เลือก</SelectItem>
                  )}
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

            <Button type="submit" className="w-full btn-hover-effect" disabled={authLoading || isLoading}>
              {authLoading ? (
                <>
                  <span className="animate-spin inline-block h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  เข้าสู่ระบบ
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
      
      {/* Right side - Decorative Background */}
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

export default TeamSelectionPage;
