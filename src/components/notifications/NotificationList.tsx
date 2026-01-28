
import React, { useState, useEffect } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { CheckCheck, Bell, AlertCircle, CheckCircle, Info, Loader2, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLineLoginUrl, getLineConnectionStatus, disconnectLineAccount, sendLineNotification } from '@/services/lineApi';
import { useToast } from '@/hooks/use-toast';

// LINE icon SVG component
const LineIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

export function NotificationList() {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotification();
  const { user } = useAuth();
  const { toast } = useToast();
  const [lineStatus, setLineStatus] = useState<{
    connected: boolean;
    displayName?: string;
    connectedAt?: string;
  }>({ connected: false });
  const [lineLoading, setLineLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testingSend, setTestingSend] = useState(false);

  // ดึงสถานะ LINE connection
  useEffect(() => {
    const fetchLineStatus = async () => {
      if (!user?.email) return;
      setLineLoading(true);
      const status = await getLineConnectionStatus(user.email);
      setLineStatus(status);
      setLineLoading(false);
    };
    fetchLineStatus();
  }, [user?.email]);

  // เชื่อมต่อ LINE
  const handleConnectLine = () => {
    const state = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('line_oauth_state', state);
    window.location.href = getLineLoginUrl(state);
  };

  // ยกเลิกการเชื่อมต่อ LINE
  const handleDisconnectLine = async () => {
    if (!user?.email) return;
    setDisconnecting(true);
    const result = await disconnectLineAccount(user.email);
    if (result.success) {
      setLineStatus({ connected: false });
      toast({ title: 'ยกเลิกการเชื่อมต่อ LINE สำเร็จ' });
    } else {
      toast({ title: 'เกิดข้อผิดพลาด', description: result.error, variant: 'destructive' });
    }
    setDisconnecting(false);
  };

  // ทดสอบส่ง LINE notification
  const handleTestNotification = async () => {
    if (!user?.email) return;
    setTestingSend(true);
    const result = await sendLineNotification({
      employeeEmail: user.email,
      type: 'fitness',
      status: 'completed',
      amount: 300,
      userName: user?.user_metadata?.full_name || 'ทดสอบ',
    });
    if (result.success) {
      toast({ title: '✅ ส่งแจ้งเตือนทดสอบสำเร็จ', description: 'ตรวจสอบข้อความใน LINE' });
    } else {
      toast({ title: 'ส่งไม่สำเร็จ', description: result.error, variant: 'destructive' });
    }
    setTestingSend(false);
  };

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
      {/* LINE Connection Card */}
      <Card className={cn(
        "border shadow-sm transition-all",
        lineStatus.connected
          ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
          : "bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-xl",
                lineStatus.connected ? "bg-[#06C755]" : "bg-gray-400"
              )}>
                <LineIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  LINE แจ้งเตือน
                </h3>
                {lineLoading ? (
                  <p className="text-xs text-gray-500">กำลังตรวจสอบ...</p>
                ) : lineStatus.connected ? (
                  <p className="text-xs text-green-700">
                    เชื่อมต่อแล้ว: <strong>{lineStatus.displayName}</strong>
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    เชื่อมต่อเพื่อรับแจ้งเตือนผ่าน LINE
                  </p>
                )}
              </div>
            </div>

            {lineLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            ) : lineStatus.connected ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestNotification}
                  disabled={testingSend}
                  className="text-[#004F9F] border-blue-200 hover:bg-blue-50"
                >
                  {testingSend ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Bell className="h-4 w-4 mr-1" />
                  )}
                  ทดสอบแจ้งเตือน
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectLine}
                  disabled={disconnecting}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  {disconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Unlink className="h-4 w-4 mr-1" />
                  )}
                  ยกเลิก
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleConnectLine}
                className="bg-[#06C755] hover:bg-[#05b34c] text-white shadow-sm"
              >
                <LineIcon className="h-4 w-4 mr-1.5" />
                เชื่อมต่อ LINE
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Header */}
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
