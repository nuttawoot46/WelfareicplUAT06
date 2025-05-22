
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
        // Fetch unique teams from the Employee table
        const { data: teamsData, error: teamsError } = await supabase
          .from('Employee')
          .select('team')
          .order('team');
        
        if (teamsError) throw teamsError;
        
        // Get unique team values
        const uniqueTeams = [...new Set(teamsData.map(item => item.team))];
        setTeams(uniqueTeams);
        
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

  return { teams, employees, isLoading, error };
};
