import { supabase } from '@/lib/supabase';

const LINE_LOGIN_CHANNEL_ID = import.meta.env.VITE_LINE_LOGIN_CHANNEL_ID;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// สร้าง LINE Login URL สำหรับ redirect ไป LINE
export function getLineLoginUrl(state: string): string {
  const redirectUri = `${window.location.origin}/auth/line/callback`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_LOGIN_CHANNEL_ID,
    redirect_uri: redirectUri,
    state,
    scope: 'profile openid',
  });
  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}

// เรียก Edge Function เพื่อแลก code เป็น LINE User ID แล้วบันทึกลง DB
export async function connectLineAccount(code: string, employeeEmail: string): Promise<{
  success: boolean;
  lineDisplayName?: string;
  error?: string;
}> {
  const redirectUri = `${window.location.origin}/auth/line/callback`;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/line-callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({
      code,
      redirectUri,
      employeeEmail,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, error: data.error || 'Failed to connect LINE' };
  }

  return { success: true, lineDisplayName: data.lineDisplayName };
}

// ยกเลิกการเชื่อมต่อ LINE
export async function disconnectLineAccount(employeeEmail: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const { error } = await supabase
    .from('Employee')
    .update({
      line_user_id: null,
      line_connected_at: null,
    } as any)
    .eq('"email_user"', employeeEmail);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ดึงสถานะการเชื่อมต่อ LINE ของ employee
export async function getLineConnectionStatus(employeeEmail: string): Promise<{
  connected: boolean;
  displayName?: string;
  connectedAt?: string;
}> {
  const { data, error } = await supabase
    .from('Employee')
    .select('line_user_id, line_display_name, line_connected_at')
    .eq('"email_user"', employeeEmail)
    .single();

  if (error || !data?.line_user_id) {
    return { connected: false };
  }

  return {
    connected: true,
    displayName: (data as any).line_display_name || 'LINE User',
    connectedAt: data.line_connected_at,
  };
}

// ส่ง LINE notification (เรียกจาก frontend เมื่อสถานะเปลี่ยน)
export async function sendLineNotification(params: {
  employeeEmail: string;
  type: string;
  status: string;
  amount?: number;
  userName?: string;
  runNumber?: string;
  remainingBudget?: number;
  requestDate?: string;
}): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/line-notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (data.skipped) {
    return { success: true }; // User ไม่ได้ connect LINE - skip ไม่ error
  }

  if (!response.ok) {
    return { success: false, error: data.error };
  }

  return { success: true };
}
