
import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotification } from '@/context/NotificationContext';
import { Link } from 'react-router-dom';

export function NotificationBadge() {
  const { unreadCount } = useNotification();
  
  return (
    <Link to="/notifications">
      <Button variant="ghost" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  );
}
