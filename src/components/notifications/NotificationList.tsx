
import React from 'react';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { CheckCheck, Bell, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NotificationList() {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotification();

  // Format date from ISO to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">การแจ้งเตือน</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={markAllAsRead}
            disabled={notifications.length === 0 || notifications.every(n => n.read)}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            อ่านทั้งหมด
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearNotifications}
            disabled={notifications.length === 0}
          >
            ล้างการแจ้งเตือนทั้งหมด
          </Button>
        </div>
      </div>
      
      {notifications.length === 0 ? (
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="flex items-center justify-center py-12 flex-col text-center text-muted-foreground">
            <Bell className="h-12 w-12 opacity-20 mb-3" />
            <p>ไม่มีการแจ้งเตือนในขณะนี้</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={cn(
                "bg-white shadow-sm border transition-all",
                notification.read 
                  ? "border-gray-100" 
                  : "border-l-4 border-l-welfare-blue shadow-md"
              )}
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getNotificationIcon(notification.type)}
                    <h3 className="font-medium">{notification.title}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pb-2 pt-0 px-4">
                <p className="text-sm">{notification.message}</p>
              </CardContent>
              {!notification.read && (
                <CardFooter className="justify-end py-2 px-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => markAsRead(notification.id)}
                  >
                    ทำเครื่องหมายว่าอ่านแล้ว
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
