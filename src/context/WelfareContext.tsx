
import React, { createContext, useContext, useState } from 'react';
import { WelfareRequest, WelfareType, StatusType } from '@/types';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';

// Generate a random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Get current date in ISO format
const getCurrentDate = () => new Date().toISOString();

interface WelfareContextType {
  welfareRequests: WelfareRequest[];
  getRequestsByUser: (userId: string) => WelfareRequest[];
  getRequestsByStatus: (status: StatusType) => WelfareRequest[];
  getRequestsByType: (type: WelfareType) => WelfareRequest[];
  submitRequest: (requestData: Omit<WelfareRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  updateRequestStatus: (id: string, status: StatusType, notes?: string) => void;
  isLoading: boolean;
}

// Mock data
const mockRequests: WelfareRequest[] = [
  {
    id: '1',
    userId: '1',
    userName: 'สมชาย ใจดี',
    userDepartment: 'การตลาด',
    type: 'wedding',
    status: 'approved',
    amount: 5000,
    date: '2024-05-10',
    details: 'แต่งงานวันที่ 10 พฤษภาคม 2567',
    attachments: ['wedding_cert.jpg'],
    createdAt: '2024-05-01T12:30:00Z',
    updatedAt: '2024-05-03T09:15:00Z'
  },
  {
    id: '2',
    userId: '1',
    userName: 'สมชาย ใจดี',
    userDepartment: 'การตลาด',
    type: 'training',
    status: 'pending',
    amount: 2500,
    date: '2024-05-20',
    details: 'คอร์สอบรม Digital Marketing วันที่ 20 พฤษภาคม 2567',
    createdAt: '2024-05-05T10:00:00Z'
  },
  {
    id: '3',
    userId: '1',
    userName: 'สมชาย ใจดี',
    userDepartment: 'การตลาด',
    type: 'glasses',
    status: 'rejected',
    amount: 1500,
    date: '2024-04-15',
    details: 'ซื้อแว่นตาใหม่เมื่อวันที่ 15 เมษายน 2567',
    notes: 'เอกสารไม่ครบถ้วน กรุณาแนบใบเสร็จรับเงินที่มีรายละเอียดชัดเจน',
    createdAt: '2024-04-16T14:20:00Z',
    updatedAt: '2024-04-18T11:45:00Z'
  }
];

const WelfareContext = createContext<WelfareContextType | undefined>(undefined);

export const WelfareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [welfareRequests, setWelfareRequests] = useState<WelfareRequest[]>(mockRequests);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const getRequestsByUser = (userId: string) => {
    return welfareRequests.filter(request => request.userId === userId);
  };

  const getRequestsByStatus = (status: StatusType) => {
    return welfareRequests.filter(request => request.status === status);
  };

  const getRequestsByType = (type: WelfareType) => {
    return welfareRequests.filter(request => request.type === type);
  };

  const submitRequest = (requestData: Omit<WelfareRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const newRequest: WelfareRequest = {
        ...requestData,
        id: generateId(),
        status: 'pending',
        createdAt: getCurrentDate()
      };
      
      setWelfareRequests(prev => [newRequest, ...prev]);
      
      toast({
        title: "ส่งคำร้องสำเร็จ",
        description: "คำร้องของคุณถูกส่งเรียบร้อยแล้ว และอยู่ในระหว่างการพิจารณา",
        variant: "default",
      });
      
      setIsLoading(false);
    }, 1000);
  };

  const updateRequestStatus = (id: string, status: StatusType, notes?: string) => {
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      setWelfareRequests(prev => 
        prev.map(request => 
          request.id === id 
            ? { 
                ...request, 
                status, 
                notes: notes || request.notes,
                updatedAt: getCurrentDate()
              } 
            : request
        )
      );
      
      toast({
        title: "อัพเดทสถานะสำเร็จ",
        description: `คำร้องหมายเลข ${id} ได้รับการอัพเดทสถานะแล้ว`,
        variant: "default",
      });
      
      setIsLoading(false);
    }, 1000);
  };

  const value = {
    welfareRequests,
    getRequestsByUser,
    getRequestsByStatus,
    getRequestsByType,
    submitRequest,
    updateRequestStatus,
    isLoading
  };

  return <WelfareContext.Provider value={value}>{children}</WelfareContext.Provider>;
};

export const useWelfare = (): WelfareContextType => {
  const context = useContext(WelfareContext);
  if (context === undefined) {
    throw new Error('useWelfare must be used within a WelfareProvider');
  }
  return context;
};
