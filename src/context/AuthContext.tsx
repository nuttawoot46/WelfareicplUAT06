
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  selectUser: (teamId: string, employeeId: string, email: string) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data structure - Now used for selection rather than login
const MOCK_USERS: Record<string, User> = {
  's1': {
    id: 's1',
    email: '',
    name: 'สมชาย ใจดี',
    role: 'employee',
    department: 'Strategy'
  },
  's2': {
    id: 's2',
    email: '',
    name: 'ณัฐพร รักษ์ไทย',
    role: 'employee',
    department: 'Strategy'
  },
  's3': {
    id: 's3',
    email: '',
    name: 'วิชัย พัฒนา',
    role: 'employee',
    department: 'Strategy'
  },
  'i1': {
    id: 'i1',
    email: '',
    name: 'มานี มีหัวใจ',
    role: 'employee',
    department: 'Inspiration'
  },
  'i2': {
    id: 'i2',
    email: '',
    name: 'สุชาติ สร้างสรรค์',
    role: 'employee',
    department: 'Inspiration'
  },
  'i3': {
    id: 'i3',
    email: '',
    name: 'นภาพร ดาวเด่น',
    role: 'employee',
    department: 'Inspiration'
  },
  'r1': {
    id: 'r1',
    email: '',
    name: 'รัชนี จัดซื้อ',
    role: 'employee',
    department: 'Registration/Procurement'
  },
  'r2': {
    id: 'r2',
    email: '',
    name: 'พรชัย เอกสาร',
    role: 'employee',
    department: 'Registration/Procurement'
  },
  'r3': {
    id: 'r3',
    email: '',
    name: 'อนุสรณ์ พัสดุ',
    role: 'employee',
    department: 'Registration/Procurement'
  },
  'm1': {
    id: 'm1',
    email: '',
    name: 'กัญญา โฆษณา',
    role: 'employee',
    department: 'Marketing'
  },
  'm2': {
    id: 'm2',
    email: '',
    name: 'ไพศาล ขายเก่ง',
    role: 'employee',
    department: 'Marketing'
  },
  'm3': {
    id: 'm3',
    email: '',
    name: 'ศิริลักษณ์ สื่อสาร',
    role: 'employee',
    department: 'Marketing'
  },
  'f1': {
    id: 'f1',
    email: '',
    name: 'กนกวรรณ บัญชี',
    role: 'employee',
    department: 'Accounting & Finance'
  },
  'f2': {
    id: 'f2',
    email: '',
    name: 'ประเสริฐ การเงิน',
    role: 'admin',
    department: 'Accounting & Finance'
  },
  'f3': {
    id: 'f3',
    email: '',
    name: 'จิตรา ภาษี',
    role: 'employee',
    department: 'Accounting & Finance'
  },
};

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

  const selectUser = (teamId: string, employeeId: string, email: string): void => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (employeeId === 'all' || employeeId.startsWith('all-')) {
        setError('กรุณาเลือกพนักงาน');
        setIsLoading(false);
        return;
      }

      const selectedUser = MOCK_USERS[employeeId];
      
      if (selectedUser) {
        // Set the provided email
        const userWithEmail = { ...selectedUser, email };
        setUser(userWithEmail);
        localStorage.setItem('welfareUser', JSON.stringify(userWithEmail));
      } else {
        setError('ไม่พบข้อมูลพนักงาน');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
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
