
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WelfareRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  [key: string]: any;
}

interface WelfareStatusChartProps {
  requests: WelfareRequest[];
}

const WelfareStatusChart: React.FC<WelfareStatusChartProps> = ({ requests }) => {
  // Count requests by status
  const statusCounts = requests.reduce((acc, request) => {
    const { status } = request;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = [
    { name: 'รออนุมัติ', value: statusCounts.pending || 0, color: '#FFCA3A' },
    { name: 'อนุมัติแล้ว', value: statusCounts.approved || 0, color: '#06D6A0' },
    { name: 'ไม่อนุมัติ', value: statusCounts.rejected || 0, color: '#D90429' },
  ];

  // Filter out statuses with zero count
  const filteredData = chartData.filter(item => item.value > 0);

  return (
    <Card className="java-card">
      <CardHeader>
        <CardTitle className="text-xl font-medium">สถานะคำร้องขอสวัสดิการ</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={filteredData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {filteredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} รายการ`, 'จำนวน']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex justify-center items-center h-[300px] text-muted-foreground">
            ไม่มีข้อมูลคำร้องขอสวัสดิการ
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WelfareStatusChart;
