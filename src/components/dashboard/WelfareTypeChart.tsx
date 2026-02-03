import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWelfare } from '@/context/WelfareContext';
import { WelfareType } from '@/types';

// ICP Ladda CI Blue Color Palette
const COLORS = [
  '#004F9F', // wedding - ICP Blue Primary
  '#0066CC', // training - ICP Blue Light
  '#3385CF', // childbirth - ICP Blue 400
  '#003D7A', // funeral - ICP Blue Dark
  '#66A3DB', // glasses - ICP Blue 300
  '#FB8500', // dental - Orange accent
  '#06D6A0', // fitness - Green accent
];

export function WelfareTypeChart() {
  const { getWelfareLimit } = useWelfare();

  const getChildbirthLimits = () => {
    const limit = getWelfareLimit('childbirth') as any;
    return {
      natural: limit.natural || 4000,
      caesarean: limit.caesarean || 6000,
    };
  };

  const data = [
    {
      name: 'ค่าแต่งงาน',
      value: getWelfareLimit('wedding').amount,
      type: 'wedding',
    },
    {
      name: 'ค่าอบรม',
      value: getWelfareLimit('training').amount,
      type: 'training',
    },
    {
      name: 'ค่าคลอดบุตร (คลอดธรรมชาติ)',
      value: getChildbirthLimits().natural,
      type: 'childbirth_natural',
    },
    {
      name: 'ค่าคลอดบุตร (ผ่าคลอด)',
      value: getChildbirthLimits().caesarean,
      type: 'childbirth_caesarean',
    },
    {
      name: 'ค่าตัดแว่นสายตา',
      value: getWelfareLimit('glasses').amount,
      type: 'glasses',
    },
    {
      name: 'ค่ารักษาทัตกรรม',
      value: getWelfareLimit('dental').amount,
      type: 'dental',
    },
    {
      name: 'ค่าออกกำลังกาย (ต่อเดือน)',
      value: getWelfareLimit('fitness').amount,
      type: 'fitness',
    },
  ].filter(item => item.value !== null && item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm">{`วงเงิน: ${item.value?.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`}</p>
        </div>
      );
    }
    return null;
  };

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
        <CardTitle>สัดส่วนวงเงินสวัสดิการแต่ละประเภท</CardTitle>
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
                nameKey="name"
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