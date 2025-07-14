import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get the session from the URL
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (data.session) {
          // If we have a session, redirect to dashboard
          navigate('/dashboard');
        } else {
          // If no session, try to get the session from the URL
          const { error: signInError } = await supabase.auth.getSession();
          
          if (signInError) {
            throw signInError;
          }
          
          // Redirect to dashboard after successful session retrieval
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
      }
    };

    handleAuth();
  }, [navigate]);

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem', color: 'red' }}>
        {error}
        <br />
        <button onClick={() => window.location.href = '/'} style={{ marginTop: '1rem' }}>
          กลับไปหน้าหลัก
        </button>
      </div>
    );
  }


  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      กำลังเข้าสู่ระบบ...
    </div>
  );
};

export default AuthCallback;