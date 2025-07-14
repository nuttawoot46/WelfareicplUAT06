import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { TeamSelector } from './TeamSelector';
import { EmployeeSelector } from './EmployeeSelector';
import { useNavigate } from 'react-router-dom';
import { Employee } from '@/types';
import PasswordVerification from '@/components/auth/PasswordVerification';

interface TeamSelectionFormProps {
  teams: string[];
  employees: Employee[];
  isLoading: boolean;
}

export const TeamSelectionForm = ({ teams, employees, isLoading }: TeamSelectionFormProps) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const { 
    selectUser, 
    isLoading: authLoading, 
    error: authError, 
    requiresPasswordVerification, 
    user, 
    setRequiresPasswordVerification 
  } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleTeamChange = (value: string) => {
    setSelectedTeam(value);
    setSelectedEmployee('');
    setEmail('');
    setPosition('');
    setFilteredEmployees(employees.filter(emp => emp.Team === value));
  };

  const handleEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
    const employee = employees.find(emp => emp.Name === value);
    if (employee) {
      const employeeEmail = employee['email_user'] || ''; 
      setEmail(employeeEmail);
      setPosition(employee.Position || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !selectedEmployee) {
      toast({
        title: "กรุณาเลือกทีมและพนักงาน",
        variant: "destructive",
      });
      return;
    }
    await selectUser(selectedTeam, selectedEmployee, email);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
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
            onEmployeeChange={handleEmployeeChange}
            disabled={!selectedTeam || isLoading}
            isLoading={isLoading}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            อีเมล
          </label>
          <div className="p-[2px] rounded-md" style={{
            backgroundImage: 'linear-gradient(90deg, rgb(111 133 200) 2.64%, rgb(240, 191, 170) 39.56%, rgb(225, 158, 200) 69.51%, rgb(108, 161, 199) 102.42%)'
          }}>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly
              className="w-full bg-white !border-0"
              placeholder="อีเมลจะแสดงโดยอัตโนมัติเมื่อเลือกพนักงาน"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="position" className="block text-sm font-medium text-gray-700">
            ตำแหน่ง
          </label>
          <div className="p-[2px] rounded-md" style={{
            backgroundImage: 'linear-gradient(90deg, rgb(111 133 200) 2.64%, rgb(240, 191, 170) 39.56%, rgb(225, 158, 200) 69.51%, rgb(108, 161, 199) 102.42%)'
          }}>
            <Input
              id="position"
              type="text"
              value={position}
              readOnly
              className="w-full bg-white !border-0"
              placeholder="ตำแหน่งจะแสดงโดยอัตโนมัติเมื่อเลือกพนักงาน"
            />
          </div>
        </div>
        <Button type="submit" className="w-full btn-hover-effect" disabled={authLoading || isLoading}>
          {authLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </Button>
      </form>
      {requiresPasswordVerification && (
        <PasswordVerification
          isOpen={true}
          user={user!}
          isNewPassword={!user?.hasPasswordSet}
          onClose={() => {
            setRequiresPasswordVerification(false);
          }}
          onPasswordVerified={() => {
            toast({
              title: "ยืนยันตัวตนสำเร็จ",
              description: "ยินดีต้อนรับเข้าสู่ระบบ",
              variant: "default",
            });
            navigate('/dashboard'); 
          }}
        />
      )}
    </>
  );
};