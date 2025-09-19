import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface WelfareRequestItem {
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

export function useWelfareRequests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<WelfareRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!profile) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Filter only welfare-related requests (exclude advance and expense-clearing types)
      const { data, error: fetchError } = await supabase
        .from('welfare_requests')
        .select('*')
        .eq('employee_name', profile.display_name)
        .not('request_type', 'in', '(advance,expense-clearing)') // Exclude accounting requests
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error('ไม่สามารถโหลดข้อมูลการเบิกสวัสดิการได้');
      }

      setRequests(data || []);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      console.error('Error fetching welfare requests:', err);
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