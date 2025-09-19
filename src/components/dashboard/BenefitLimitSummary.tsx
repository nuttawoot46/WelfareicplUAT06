import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  Heart,
  GraduationCap,
  Baby,
  Cross,
  Glasses,
  Smile,
  Dumbbell,
  Stethoscope
} from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { WelfareType } from '@/types';
import { BenefitLimit, getBenefitLimits } from '@/services/welfareApi';
import { Button } from '@/components/ui/button';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BenefitLimitSummaryProps {
  limit?: number;
}

// Welfare type labels in Thai
const welfareTypeLabels: Record<WelfareType, string> = {
  wedding: 'ค่าแต่งงาน',
  training: 'ค่าอบรม',
  childbirth: 'ค่าคลอดบุตร',
  funeral: 'ค่าช่วยเหลืองานศพ',
  glasses: 'ค่าตัดแว่น',
  dental: 'ค่าตัดแว่นและทำฟัน',
  fitness: 'ค่าออกกำลังกาย (ต่อเดือน)',
  medical: 'ค่าเยี่ยมกรณีเจ็บป่วย',
};

// ไอคอนสำหรับแต่ละประเภทสวัสดิการ
const welfareIcons: Record<WelfareType, React.ReactNode> = {
  wedding: <Heart className="h-4 w-4 text-pink-500" />,
  training: <GraduationCap className="h-4 w-4 text-blue-500" />,
  childbirth: <Baby className="h-4 w-4 text-yellow-500" />,
  funeral: <Cross className="h-4 w-4 text-gray-500" />,
  glasses: <Glasses className="h-4 w-4 text-purple-500" />,
  dental: <Smile className="h-4 w-4 text-orange-500" />,
  fitness: <Dumbbell className="h-4 w-4 text-green-500" />,
  medical: <Stethoscope className="h-4 w-4 text-red-500" />,
};

// สีสำหรับแต่ละประเภทสวัสดิการ (สำหรับ chart)
const barColors: Record<WelfareType, string> = {
  wedding: 'rgba(236, 72, 153, 0.7)',
  training: 'rgba(59, 130, 246, 0.7)',
  childbirth: 'rgba(234, 179, 8, 0.7)',
  funeral: 'rgba(107, 114, 128, 0.7)',
  glasses: 'rgba(147, 51, 234, 0.7)',
  dental: 'rgba(249, 115, 22, 0.7)',
  fitness: 'rgba(34, 197, 94, 0.7)',
  medical: 'rgba(239, 68, 68, 0.7)',
};

export function BenefitLimitSummary({ limit = 8 }: BenefitLimitSummaryProps) {
  const [benefits, setBenefits] = useState<BenefitLimit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const fetchBenefitLimits = async () => {
    setIsLoading(true);
    try {
      const data = await getBenefitLimits();

      // รวมสวัสดิการค่าตัดแว่นและค่าทำฟันเป็นรายการเดียวกัน
      const processedData = data.filter(benefit => {
        // กรองเอาเฉพาะรายการที่ไม่ใช่ค่าตัดแว่น
        return benefit.type !== 'glasses';
      });

      setBenefits(processedData);
    } catch (err) {
      console.error('Failed to fetch benefit limits:', err);
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBenefitLimits();
  }, []);

  // Sort by remaining percentage (lowest first) and limit
  const sortedBenefits = [...benefits]
    .sort((a, b) => (a.remaining / a.totalLimit) - (b.remaining / b.totalLimit))
    .slice(0, limit);

  const chartData = {
    labels: sortedBenefits.map((benefit) => welfareTypeLabels[benefit.type] || benefit.type),
    datasets: [
      {
        label: 'Remaining Budget',
        data: sortedBenefits.map((benefit) => benefit.remaining),
        backgroundColor: sortedBenefits.map((benefit) => barColors[benefit.type] || 'rgba(75, 192, 192, 0.6)'),
      },
    ],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-welfare-blue">
          <span>สรุปวงเงินสวัสดิการ</span>
          
        </CardTitle>

      </CardHeader>
      <CardContent>
        {viewMode === 'table' ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white dark:bg-gray-900">
            <Table className="min-w-full text-sm text-gray-700 dark:text-gray-200">
              <TableHeader className="bg-welfare-blue/10">
                <TableRow>
                  <TableHead className="font-semibold text-welfare-blue">ประเภทสวัสดิการ</TableHead>
                  <TableHead className="font-semibold text-welfare-blue">วงเงินทั้งหมด</TableHead>
                  <TableHead className="font-semibold text-welfare-blue">ใช้ไปแล้ว</TableHead>
                  <TableHead className="font-semibold text-welfare-blue">คงเหลือ</TableHead>
                  <TableHead className="w-[180px] font-semibold text-welfare-blue">สัดส่วนคงเหลือ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-red-600">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : sortedBenefits.length > 0 ? (
                  sortedBenefits.map((benefit) => {
                    const percentRemaining = (benefit.remaining / benefit.totalLimit) * 100;
                    return (
                      <TableRow key={benefit.type} className="hover:bg-welfare-blue/5 dark:hover:bg-welfare-blue/20 transition-colors">
                        <TableCell className="font-medium flex items-center gap-2">
                          {welfareIcons[benefit.type] || <Heart className="h-4 w-4 text-gray-500" />}
                          {welfareTypeLabels[benefit.type] || benefit.type}
                        </TableCell>
                        <TableCell>{benefit.totalLimit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-gray-400">บาท</span></TableCell>
                        <TableCell>{benefit.used.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-gray-400">บาท</span></TableCell>
                        <TableCell>{benefit.remaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-gray-400">บาท</span></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-full rounded-full overflow-hidden ${percentRemaining < 25 ? 'bg-red-100' :
                                percentRemaining < 50 ? 'bg-amber-100' : 'bg-green-100 dark:bg-dark-green/30'
                              }`}>
                              <div
                                className={`h-full rounded-full ${percentRemaining < 25 ? 'bg-red-500' :
                                    percentRemaining < 50 ? 'bg-amber-500' : 'bg-green-500 dark:bg-dark-green'
                                  }`}
                                style={{ width: `${percentRemaining}%` }}
                              />
                            </div>
                            <span className="text-sm w-12 font-semibold text-gray-600 dark:text-gray-200">{Math.round(percentRemaining)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      ไม่มีข้อมูลวงเงินสวัสดิการ
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 shadow-sm">
            <Bar data={chartData} options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false
                },
                title: {
                  display: true,
                  text: 'งบประมาณคงเหลือแต่ละประเภท',
                  color: '#3b82f6',
                  font: { size: 18, weight: 'bold' }
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      return `${context.dataset.label}: ${context.parsed.y.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  grid: { color: '#e5e7eb' },
                  ticks: { color: '#3b82f6', font: { weight: 'bold' } }
                },
                y: {
                  grid: { color: '#e5e7eb' },
                  ticks: { color: '#64748b', font: { weight: 'bold' } }
                }
              }
            }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}