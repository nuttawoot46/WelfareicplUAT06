import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
        
        // ดึงข้อมูลพนักงานทั้งหมดก่อน
        const { data: employeesData, error: employeesError } = await supabase
          .from('Employee')
          .select('*');
        
        if (employeesError) {
          console.error('Error fetching employees:', employeesError);
          throw employeesError;
        }
        
        // Log the data structure
        console.log('Employee data structure:', employeesData?.[0]);
        
        // กรองและสร้างรายการทีมจากข้อมูลที่ได้
        const uniqueTeams = [...new Set(
          employeesData
            ?.filter(item => item.Team && item.Team.trim() !== '')
            .map(item => item.Team) || []
        )];
        
        // กรองพนักงานที่มีชื่อ (ใช้ column Name แทน ชื่อพนักงาน)
        const validEmployees = employeesData?.filter(emp => 
          emp.Name && emp.Name.trim() !== ''
        ) || [];
        
        console.log('ทีมที่พบ:', uniqueTeams);
        console.log('พนักงานที่พบ:', validEmployees);
        
        setTeams(uniqueTeams);
        setEmployees(validEmployees);
        
      } catch (err) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', err);
        setError('ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return { teams, employees, isLoading, error };
};
