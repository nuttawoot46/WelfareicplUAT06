import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface StatusCount {
  name: string;
  count: number;
  color: string;
}

export function CombinedStatusChart() {
  const { profile } = useAuth();
  const [data, setData] = useState<StatusCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatusCounts = useCallback(async () => {
    if (!profile?.display_name) return;

    try {
      setIsLoading(true);
      const { data: requests, error } = await supabase
        .from('welfare_requests')
        .select('status')
        .eq('employee_name', profile.display_name);

      if (error) throw error;

      const pending = (requests || []).filter((r) =>
        ['pending_manager', 'pending_hr', 'pending_accounting', 'pending_special_approval'].includes(r.status)
      ).length;

      const completed = (requests || []).filter((r) => r.status === 'completed').length;

      const rejected = (requests || []).filter((r) =>
        ['rejected_manager', 'rejected_hr', 'rejected_accounting', 'rejected_special_approval'].includes(r.status)
      ).length;

      setData([
        { name: 'รออนุมัติ', count: pending, color: '#f59e0b' },
        { name: 'อนุมัติแล้ว', count: completed, color: '#22c55e' },
        { name: 'ปฏิเสธ', count: rejected, color: '#ef4444' },
      ]);
    } catch (error) {
      console.error('Error fetching status counts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.display_name]);

  useEffect(() => {
    fetchStatusCounts();
  }, [fetchStatusCounts]);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          สถานะคำร้องทั้งหมด
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : total === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">
            ไม่มีข้อมูลคำร้อง
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 13, fill: '#374151' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <Tooltip
                formatter={(value: number) => [`${value} คำร้อง`, 'จำนวน']}
                contentStyle={{ borderRadius: '8px', fontSize: '13px' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
