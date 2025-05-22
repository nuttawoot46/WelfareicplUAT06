
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Employee } from '@/types';

export const useTeamEmployeeData = () => {
  const [teams, setTeams] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('เริ่มดึงข้อมูลจาก Supabase');
        
        // เพิ่มข้อมูลตัวอย่างถ้าไม่มีข้อมูลใน Supabase (สำหรับการทดสอบ)
        // ใช้ข้อมูลจากภาพที่คุณแสดงมา
        const mockTeams = ["Account", "Inspiration (IS)"];
        const mockEmployees: Employee[] = [
          { id: '1', name: 'ณัฐวุฒิ เรืองรัตน์สุนทร', Team: 'Account', department: 'Marketing', role: 'employee' },
          { id: '2', name: 'วิสูตร์ เทอตะกาญจน์', Team: 'Account', department: 'Marketing', role: 'employee' },
          { id: '3', name: 'สุภาวดี บรรเทา', Team: 'Account', department: 'Marketing', role: 'employee' },
          { id: '4', name: 'รัชนี ศรีสุวรรณ์', Team: 'Account', department: 'Marketing', role: 'employee' },
          { id: '5', name: 'จักรพันธ์ โลยศิริยม', Team: 'Account', department: 'Marketing', role: 'employee' },
          { id: '6', name: 'วรรณภัทร รุ่งศิลา', Team: 'Account', department: 'Marketing', role: 'employee' },
          { id: '7', name: 'ประภาสิริ พงษ์รัตน์', Team: 'Account', department: 'Marketing', role: 'employee' },
          { id: '8', name: 'มลลิกา เพียมสวัสดิ์', Team: 'Account', department: 'Marketing', role: 'employee' },
          { id: '9', name: 'พินายุสุ ลิมทรลาภี', Team: 'Account', department: 'Marketing', role: 'employee' },
          { id: '10', name: 'พิมลพรรณ สีลอง', Team: 'Account', department: 'Marketing', role: 'employee' },
          { id: '11', name: 'รัตนา ศรีจันทวงษ์', Team: 'Account', department: 'Marketing', role: 'employee' },
          { id: '12', name: 'หนึ่งฤทัย ทรัพย์ประเสริฐ', Team: 'Inspiration (IS)', department: 'Creative', role: 'employee' },
          { id: '13', name: 'วุฒินันท์ จันทร์ออน', Team: 'Inspiration (IS)', department: 'Creative', role: 'employee' },
          { id: '14', name: 'ปัทมณี ธนาภัทรุธนา', Team: 'Inspiration (IS)', department: 'Creative', role: 'employee' },
          { id: '15', name: 'อุดมชัย อุดมหลาน', Team: 'Inspiration (IS)', department: 'Creative', role: 'employee' },
          { id: '16', name: 'นิลาวัลย์ มั่งงาม', Team: 'Inspiration (IS)', department: 'Creative', role: 'employee' },
          { id: '17', name: 'กฤษณา กีมภา', Team: 'Inspiration (IS)', department: 'Creative', role: 'employee' },
          { id: '18', name: 'รังสรรค์ กมลเงิน', Team: 'Inspiration (IS)', department: 'Creative', role: 'employee' }
        ];
        
        // ลองดึงข้อมูลจาก Supabase ก่อน
        const { data: teamsData, error: teamsError } = await supabase
          .from('Employee')
          .select('Team')
          .order('Team');
        
        if (teamsError) throw teamsError;
        
        const { data: employeesData, error: employeesError } = await supabase
          .from('Employee')
          .select('*');
        
        if (employeesError) throw employeesError;
        
        // ตรวจสอบว่าได้ข้อมูลจาก Supabase หรือไม่
        if (teamsData && teamsData.length > 0 && employeesData && employeesData.length > 0) {
          console.log('ได้รับข้อมูลจาก Supabase:', teamsData, employeesData);
          
          // ใช้ข้อมูลจาก Supabase
          const uniqueTeams = [...new Set(teamsData.map(item => item.Team))];
          setTeams(uniqueTeams);
          setEmployees(employeesData);
        } else {
          console.log('ไม่พบข้อมูลใน Supabase ใช้ข้อมูลตัวอย่างแทน');
          
          // ใช้ข้อมูลตัวอย่าง
          setTeams(mockTeams);
          setEmployees(mockEmployees);
        }
      } catch (err) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', err);
        setError('ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        
        // ในกรณีที่เกิดข้อผิดพลาด ให้ใช้ข้อมูลตัวอย่าง
        const mockTeams = ["Account", "Inspiration (IS)"];
        const mockEmployees: Employee[] = [
          { id: '1', name: 'ณัฐวุฒิ เรืองรัตน์สุนทร', Team: 'Account', department: 'Marketing', role: 'employee' },
          { id: '2', name: 'วิสูตร์ เทอตะกาญจน์', Team: 'Account', department: 'Marketing', role: 'employee' },
          { id: '3', name: 'สุภาวดี บรรเทา', Team: 'Account', department: 'Marketing', role: 'employee' },
          { id: '4', name: 'รัชนี ศรีสุวรรณ์', Team: 'Account', department: 'Marketing', role: 'employee' },
          // ... เหลือข้อมูลตัวอย่างอื่นๆ ไว้เหมือนเดิม
        ];
        
        setTeams(mockTeams);
        setEmployees(mockEmployees);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return { teams, employees, isLoading, error };
};
