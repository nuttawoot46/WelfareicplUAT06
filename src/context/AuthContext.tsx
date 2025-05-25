
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  selectUser: (teamId: string, employeeName: string, email: string) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is stored in localStorage on component mount
    const storedUser = localStorage.getItem('welfareUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        localStorage.removeItem('welfareUser');
      }
    }
    setIsLoading(false);
  }, []);

  const selectUser = async (teamId: string, employeeName: string, email: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: employeeData, error: fetchError } = await supabase
        .from('Employee')
        .select('*')
        .eq('Name', employeeName)
        .single();
      
      if (fetchError) {
        throw new Error('ไม่พบข้อมูลพนักงาน');
      }
      
      if (employeeData) {
        // Map employee data from Supabase to our User type
        const userData: User = {
          id: employeeData.Name || '',
          name: employeeData.Name || '',
          email: email, // Use the provided email
          department: teamId, // Use team as department
          role: 'employee',
        };
        
        setUser(userData);
        localStorage.setItem('welfareUser', JSON.stringify(userData));
        navigate('/dashboard');
      } else {
        setError('ไม่พบข้อมูลพนักงาน');
      }
    } catch (err) {
      console.error('Error selecting user:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
    
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('welfareUser');
    navigate('/'); // Redirect to home page after logout
  };

  const value = {
    user,
    selectUser,
    logout,
    isLoading,
    isAuthenticated: !!user,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
