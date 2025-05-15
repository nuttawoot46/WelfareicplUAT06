
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { WelfareRequest } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WelfareTypeChartProps {
  requests: WelfareRequest[];
}

const COLORS = [
  '#4361EE', // wedding
  '#4CC9F0', // training
  '#F72585', // childbirth
  '#3A0CA3', // funeral
  '#4CC9F0', // glasses
  '#FB8500', // dental
  '#06D6A0', // fitness
];

const welfareTypeLabels: Record<string, string> = {
  wedding: 'ค่าแต่งงาน',
  training: 'ค่าอบรม',
  childbirth: 'ค่าคลอดบุตร',
  funeral: 'ค่าช่วยเหลืองานศพ',
  glasses: 'ค่าตัดแว่น',
  dental: 'ค่าทำฟัน',
  fitness: 'ค่าออกกำลังกาย',
};

export function WelfareTypeChart({ requests }: WelfareTypeChartProps) {
  // Count welfare types
  const typeCounts = requests.reduce((acc, req) => {
    acc[req.type] = (acc[req.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Transform into chart data
  const data = Object.entries(typeCounts).map(([type, value]) => ({
    name: welfareTypeLabels[type] || type,
    value,
    type
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm">{`จำนวน: ${item.value} รายการ`}</p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = ({ payload }: any) => {
    return (
      <ul className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center">
            <span className="inline-block w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-sm">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card className="java-card">
      <CardHeader>
        <CardTitle>สัดส่วนประเภทสวัสดิการ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                animationDuration={1000}
                animationBegin={200}
                className="animate-pulse-slow"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
