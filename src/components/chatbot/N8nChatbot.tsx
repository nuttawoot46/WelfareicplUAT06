// N8nChatbot.tsx
import React, { useEffect, useRef } from 'react';
import { createClient, User } from '@supabase/supabase-js';

// ---------- Supabase Client (ใช้ .env ของคุณ) ----------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnon);

// ---------- Props ----------
interface N8nChatbotProps {
  webhookUrl?: string;           // n8n webhook URL (/chat)
  authToken?: string | null;     // แนบ JWT ของระบบคุณ (ถ้ามี)
  targetId?: string;             // id ของ element ที่จะ mount widget
}

// ---------- Component ----------
const N8nChatbot: React.FC<N8nChatbotProps> = ({
  webhookUrl = 'https://n8n.icpladda.com/webhook/f3fe133a-dc33-42df-8135-11962a4a2f31/chat',
  authToken = null,
  targetId = 'n8n-chat',
}) => {
  const chatInitialized = useRef(false);
  const unsubAuthRef = useRef<ReturnType<typeof supabase.auth.onAuthStateChange> | null>(null);

  // ลบ widget เดิม (สำหรับ re-init)
  const destroyChatWidget = () => {
    const mount = document.getElementById(targetId);
    if (!mount) return;
    while (mount.firstChild) mount.removeChild(mount.firstChild);
    chatInitialized.current = false;
  };

  // ดึงอีเมลจาก Supabase Auth (+สำรองจาก localStorage)
  const resolveEmail = async (): Promise<string | null> => {
    const { data, error } = await supabase.auth.getUser();
    const user: User | null = error ? null : data.user ?? null;
    const email = user?.email ?? null;

    if (email) {
      localStorage.setItem('currentUserEmail', email);
      return email;
    }
    // fallback: localStorage (กรณี re-open tab)
    return localStorage.getItem('currentUserEmail');
  };

  // init n8n chat widget
  const initChat = async () => {
    if (typeof window === 'undefined') return;
    if (chatInitialized.current) return;

    // โหลด CSS (กันโหลดซ้ำ)
    const cssHref = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css';
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      const link = document.createElement('link');
      link.href = cssHref;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    // ธีม/ปรับสไตล์ (กันซ้ำ)
    if (!document.getElementById('n8n-chat-custom-styles')) {
      const style = document.createElement('style');
      style.id = 'n8n-chat-custom-styles';
      style.textContent = `
        :root{
          --chat--color-primary:#e74266;
          --chat--color-secondary:#20b69e;
          --chat--color-dark:#101330;
          --chat--color-white:#ffffff;
          --chat--window--width:400px;
          --chat--window--height:600px;
          --chat--message--user--background:var(--chat--color-secondary);
          --chat--message--user--color:var(--chat--color-white);
        }
      `;
      document.head.appendChild(style);
    }

    // session คงเดิม (ผูกกับ Memory ของ n8n)
    const sessionKey = 'sessionId';
    const existingSession = localStorage.getItem(sessionKey);
    const sessionId = existingSession || crypto.randomUUID();
    if (!existingSession) localStorage.setItem(sessionKey, sessionId);

    // ดึงอีเมลผู้ใช้
    const email = await resolveEmail();
    console.log('[N8nChatbot] resolved email =', email);

    // โหลด bundle แล้วสร้างวิดเจ็ต
    // @ts-ignore - import จาก CDN
    const { createChat } = await import('https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js');

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    if (email) headers['X-User-Email'] = email; // กันพลาด: ส่งซ้ำที่ Header

    createChat({
      webhookUrl,
      webhookConfig: { method: 'POST', headers },
      target: `#${targetId}`,
      mode: 'window',
      chatInputKey: 'chatInput',
      chatSessionKey: sessionKey,
      loadPreviousSession: true,

      // สำคัญที่สุด → ส่งให้ n8n ที่ $json.metadata.userEmail
      metadata: {
        userEmail: email ?? undefined,  // อย่าส่ง null; ถ้าไม่มีปล่อย undefined
        app: 'welfare-portal',
      },

      defaultLanguage: 'th',
      showWelcomeScreen: false,
      initialMessages: ['สวัสดี', 'ฉันชื่อ ลัดดา สามารถสอบถามข้อมูลสวัสดิการได้ 24 ชม.'],
      i18n: {
        th: {
          title: 'สวัสดีชาว ICP Ladda',
          subtitle: 'คุณสามารถคุยกับฉันได้ 24 ชม.',
          footer: '',
          getStarted: 'เริ่มการสนทนาใหม่',
          inputPlaceholder: 'พิมพ์คำถามของคุณ...',
        },
      },
      enableStreaming: false,
    });

    chatInitialized.current = true;
  };

  // init ครั้งแรก
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = setTimeout(initChat, 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webhookUrl]);

  // subscribe เมื่อ auth state ของ Supabase เปลี่ยน (login/logout) → re-init widget
  useEffect(() => {
    unsubAuthRef.current = supabase.auth.onAuthStateChange((_event, _session) => {
      // เมื่อสถานะเปลี่ยน เราจะ re-init เพื่ออัปเดต metadata.userEmail
      if (chatInitialized.current) {
        destroyChatWidget();
        initChat();
      }
    });
    return () => {
      unsubAuthRef.current?.data.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id={targetId} />;
};

export default N8nChatbot;
