
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { TeamSelector } from './TeamSelector';
import { EmployeeSelector } from './EmployeeSelector';
import { Employee } from '@/types';

interface TeamSelectionFormProps {
  teams: string[];
  employees: Employee[];
  isLoading: boolean;
}

export const TeamSelectionForm = ({ teams, employees, isLoading }: TeamSelectionFormProps) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  
  const { selectUser, isLoading: authLoading, error: authError } = useAuth();
  const { toast } = useToast();
  
  const handleTeamChange = (value: string) => {
    setSelectedTeam(value);
    setSelectedEmployee('');
    
    // Filter employees by the selected team (using Team with capital T)
    const filtered = employees.filter(emp => emp.Team === value);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Show any errors */}
      {authError && (
        <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
          {authError}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="team" className="block text-sm font-medium text-gray-700">
          เลือกทีม
        </label>
        <TeamSelector
          teams={teams}
          selectedTeam={selectedTeam}
          onTeamChange={handleTeamChange}
          isLoading={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="employee" className="block text-sm font-medium text-gray-700">
          เลือกพนักงาน
        </label>
        <EmployeeSelector
          employees={filteredEmployees}
          selectedEmployee={selectedEmployee}
          onEmployeeChange={setSelectedEmployee}
          disabled={!selectedTeam || isLoading}
          isLoading={isLoading}
        />
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
  );
};
