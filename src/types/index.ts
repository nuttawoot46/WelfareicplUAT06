
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'employee' | 'admin';
  department: string;
  avatar?: string;
}

export type StatusType = 'pending' | 'approved' | 'rejected';

export type WelfareType = 
  | 'wedding'
  | 'training'
  | 'childbirth'
  | 'funeral' 
  | 'glasses'
  | 'dental'
  | 'fitness';

export interface WelfareRequest {
  id: string;
  userId: string;
  userName: string;
  userDepartment: string;
  type: WelfareType;
  status: StatusType;
  amount: number;
  date: string;
  details: string;
  attachments?: string[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}
