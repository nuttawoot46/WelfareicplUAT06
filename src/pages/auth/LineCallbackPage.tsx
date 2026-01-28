import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { connectLineAccount } from '@/services/lineApi';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const LineCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('กำลังเชื่อมต่อบัญชี LINE...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      // ตรวจสอบ error จาก LINE
      if (error) {
        setStatus('error');
        setMessage('ผู้ใช้ยกเลิกการเชื่อมต่อ');
        setTimeout(() => navigate('/notifications'), 3000);
        return;
      }

      // ตรวจสอบ state (CSRF protection)
      const savedState = sessionStorage.getItem('line_oauth_state');
      if (!code || state !== savedState) {
        setStatus('error');
        setMessage('ข้อมูลไม่ถูกต้อง กรุณาลองใหม่');
        setTimeout(() => navigate('/notifications'), 3000);
        return;
      }

      // ลบ state ที่ใช้แล้ว
      sessionStorage.removeItem('line_oauth_state');

      if (!user?.email) {
        setStatus('error');
        setMessage('กรุณาเข้าสู่ระบบก่อน');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      // เรียก Edge Function
      const result = await connectLineAccount(code, user.email);

      if (result.success) {
        setStatus('success');
        setMessage(`เชื่อมต่อสำเร็จ! (${result.lineDisplayName})`);
      } else {
        setStatus('error');
        setMessage(result.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      }

      setTimeout(() => navigate('/notifications'), 3000);
    };

    handleCallback();
  }, [searchParams, navigate, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 text-[#06C755] animate-spin mb-4" />
              <p className="text-lg font-medium text-gray-700">{message}</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="p-3 bg-green-100 rounded-full mb-4">
                <CheckCircle className="h-12 w-12 text-[#06C755]" />
              </div>
              <p className="text-lg font-medium text-gray-900">{message}</p>
              <p className="text-sm text-gray-500 mt-2">กำลังกลับสู่หน้าแจ้งเตือน...</p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="p-3 bg-red-100 rounded-full mb-4">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <p className="text-lg font-medium text-gray-900">{message}</p>
              <p className="text-sm text-gray-500 mt-2">กำลังกลับสู่หน้าแจ้งเตือน...</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LineCallbackPage;
