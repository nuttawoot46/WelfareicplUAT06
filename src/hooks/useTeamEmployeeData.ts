
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
        
        // ดึงข้อมูลทีมจาก column Team
        const { data: teamsData, error: teamsError } = await supabase
          .from('Employee')
          .select('Team')
          .not('Team', 'is', null);
        
        if (teamsError) {
          console.error('Error fetching teams:', teamsError);
          throw teamsError;
        }
        
        // ดึงข้อมูลพนักงานทั้งหมด
        const { data: employeesData, error: employeesError } = await supabase
          .from('Employee')
          .select('*')
          .not('ชื่อพนักงาน', 'is', null);
        
        if (employeesError) {
          console.error('Error fetching employees:', employeesError);
          throw employeesError;
        }
        
        console.log('ข้อมูลทีม:', teamsData);
        console.log('ข้อมูลพนักงาน:', employeesData);
        
        // สร้างรายการทีมที่ไม่ซ้ำกัน
        const uniqueTeams = [...new Set(teamsData?.map(item => item.Team).filter(Boolean) || [])];
        
        setTeams(uniqueTeams);
        setEmployees(employeesData || []);
        
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
