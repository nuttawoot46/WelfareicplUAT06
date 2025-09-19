import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AccountingRequestItem {
  id: number;
  employee_id: number;
  employee_name: string;
  request_type: string;
  status: string;
  amount: number;
  created_at: string;
  details?: string;
  title?: string;
  manager_notes?: string;
  attachment_url?: string;
}

export function useAccountingRequests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<AccountingRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!profile) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Filter only accounting-related requests (advance and expense-clearing types)
      const { data, error: fetchError } = await supabase
        .from('welfare_requests')
        .select('*')
        .eq('employee_name', profile.display_name)
        .in('request_type', ['advance', 'expense-clearing']) // Only accounting requests
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error('ไม่สามารถโหลดข้อมูลการเบิกบัญชีได้');
      }

      setRequests(data || []);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      console.error('Error fetching accounting requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const refetch = () => {
    return fetchRequests();
  };

  return {
    requests,
    isLoading,
    error,
    refetch,
  };
}