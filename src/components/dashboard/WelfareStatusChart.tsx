
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WelfareRequest, StatusType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WelfareStatusChartProps {
  requests: WelfareRequest[];
}

const statusLabels: Record<StatusType, string> = {
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ไม่อนุมัติ',
};

const statusColors: Record<StatusType, string> = {
  pending: '#FFCA3A',
  approved: '#06D6A0',
  rejected: '#D90429',
};

export function WelfareStatusChart({ requests }: WelfareStatusChartProps) {
  // Count welfare by status
  const statusCounts = requests.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Transform into chart data
  const data = Object.entries(statusCounts).map(([status, count]) => ({
    name: statusLabels[status as StatusType] || status,
    count,
    status,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm">{`จำนวน: ${item.count} รายการ`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="java-card">
      <CardHeader>
        <CardTitle>สถิติสถานะคำขอ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                barSize={40}
                radius={[4, 4, 0, 0]}
                className="animate-pulse-slow"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={statusColors[entry.status as StatusType] || '#4361EE'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
