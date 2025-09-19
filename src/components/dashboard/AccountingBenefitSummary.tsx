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
import { Calculator, TrendingUp, DollarSign } from 'lucide-react';

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
import { useAuth } from '@/context/AuthContext';
import { useWelfare } from '@/context/WelfareContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AccountingBenefitSummaryProps {
  limit?: number;
}

export function AccountingBenefitSummary({ limit = 4 }: AccountingBenefitSummaryProps) {
  const { user } = useAuth();
  const { welfareRequests } = useWelfare();
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter only accounting-related requests (advance and expense-clearing types)
  const accountingRequests = welfareRequests.filter(r => r.type === 'advance' || r.type === 'expense-clearing');

  // Calculate statistics
  const totalRequests = accountingRequests.length;
  const completedRequests = accountingRequests.filter(r => r.status === 'completed').length;
  const pendingRequests = accountingRequests.filter(r => 
    r.status === 'pending_manager' || r.status === 'pending_hr' || r.status === 'pending_accounting'
  ).length;
  const rejectedRequests = accountingRequests.filter(r => 
    r.status === 'rejected_manager' || r.status === 'rejected_hr' || r.status === 'rejected_accounting'
  ).length;

  const totalAmount = accountingRequests
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const pendingAmount = accountingRequests
    .filter(r => r.status === 'pending_manager' || r.status === 'pending_hr' || r.status === 'pending_accounting')
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const accountingData = [
    {
      type: 'เบิกเงินล่วงหน้า',
      totalLimit: 50000,
      used: totalAmount,
      remaining: 50000 - totalAmount,
      requests: completedRequests,
      icon: <Calculator className="h-4 w-4 text-blue-500" />
    },
    {
      type: 'รออนุมัติ',
      totalLimit: pendingAmount,
      used: 0,
      remaining: pendingAmount,
      requests: pendingRequests,
      icon: <TrendingUp className="h-4 w-4 text-orange-500" />
    },
    {
      type: 'ยอดรวมทั้งหมด',
      totalLimit: totalAmount + pendingAmount,
      used: totalAmount,
      remaining: pendingAmount,
      requests: totalRequests,
      icon: <DollarSign className="h-4 w-4 text-green-500" />
    }
  ];

  const chartData = {
    labels: accountingData.map((item) => item.type),
    datasets: [
      {
        label: 'จำนวนเงิน (บาท)',
        data: accountingData.map((item) => item.totalLimit),
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(249, 115, 22, 0.7)',
          'rgba(34, 197, 94, 0.7)',
        ],
      },
    ],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-welfare-cyan">
          <Calculator className="h-5 w-5" />
          <span>สรุปข้อมูลบัญชี</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {viewMode === 'table' ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white dark:bg-gray-900">
            <Table className="min-w-full text-sm text-gray-700 dark:text-gray-200">
              <TableHeader className="bg-welfare-cyan/10">
                <TableRow>
                  <TableHead className="font-semibold text-welfare-cyan">ประเภท</TableHead>
                  <TableHead className="font-semibold text-welfare-cyan">จำนวนคำร้อง</TableHead>
                  <TableHead className="font-semibold text-welfare-cyan">จำนวนเงิน</TableHead>
                  <TableHead className="font-semibold text-welfare-cyan">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : accountingData.length > 0 ? (
                  accountingData.map((item, index) => (
                    <TableRow key={index} className="hover:bg-welfare-cyan/5 dark:hover:bg-welfare-cyan/20 transition-colors">
                      <TableCell className="font-medium flex items-center gap-2">
                        {item.icon}
                        {item.type}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.requests} คำร้อง
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.totalLimit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                        <span className="text-xs text-gray-400 ml-1">บาท</span>
                      </TableCell>
                      <TableCell>
                        {index === 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            เสร็จสมบูรณ์
                          </span>
                        )}
                        {index === 1 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            รออนุมัติ
                          </span>
                        )}
                        {index === 2 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ยอดรวม
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      ไม่มีข้อมูลบัญชี
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
                  text: 'สรุปข้อมูลบัญชี',
                  color: '#0891b2',
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
                  ticks: { color: '#0891b2', font: { weight: 'bold' } }
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