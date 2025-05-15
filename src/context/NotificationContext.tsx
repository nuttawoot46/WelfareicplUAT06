
import React, { createContext, useContext, useState } from 'react';
import { Notification } from '@/types';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

// Generate a random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock initial notifications
const initialNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    title: 'คำร้องได้รับการอนุมัติ',
    message: 'คำร้องขอสวัสดิการค่าแต่งงานของคุณได้รับการอนุมัติแล้ว',
    type: 'success',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: '2',
    userId: '1',
    title: 'คำร้องใหม่รออนุมัติ',
    message: 'คุณมีคำร้องขอสวัสดิการค่าอบรมที่รออนุมัติ',
    type: 'info',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  }
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const { user } = useAuth();

  // Get unread count for current user
  const unreadCount = user 
    ? notifications.filter(n => n.userId === user.id && !n.read).length 
    : 0;

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      read: false,
      createdAt: new Date().toISOString()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    if (!user) return;

    setNotifications(prev => 
      prev.map(notification => 
        notification.userId === user.id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  const clearNotifications = () => {
    if (!user) return;
    setNotifications(prev => prev.filter(notification => notification.userId !== user.id));
  };

  const value = {
    notifications: user 
      ? notifications.filter(n => n.userId === user.id)
      : [],
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
