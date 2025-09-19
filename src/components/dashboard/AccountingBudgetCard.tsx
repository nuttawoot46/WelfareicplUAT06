import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { WelfareRequest } from '@/types';
import { useWelfare } from '@/context/WelfareContext';

interface AccountingBudgetCardProps {
  requests: WelfareRequest[];
  userId: string;
  maxBudget?: number;
}

export const AccountingBudgetCard: React.FC<AccountingBudgetCardProps> = ({ 
  requests, 
  userId,
  maxBudget = 50000 // Default higher budget for accounting requests
}) => {
  const { getWelfareLimit, getRemainingBudget } = useWelfare();
  
  // Filter only accounting-related requests (advance and expense-clearing types)
  const accountingRequests = requests.filter(r => r.type === 'advance' || r.type === 'expense-clearing');
  
  // Calculate total used amount for advance requests
  const totalUsed = accountingRequests
    .filter(r => r.status === 'completed' || r.status === 'pending_accounting' || r.status === 'pending_hr')
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  
  const remainingBudget = maxBudget - totalUsed;
  const usagePercentage = (totalUsed / maxBudget) * 100;
  
  return (
    <Card className="java-card">
      <CardHeader>
        <CardTitle className="text-xl font-medium">รายละเอียดวงเงินบัญชี</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm">
            <div className="flex justify-between mb-2">
              <span className="font-medium">วงเงินเบิกล่วงหน้าทั้งหมด:</span>
              <span className="font-bold text-welfare-cyan">
                {maxBudget.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
              </span>
            </div>
          </div>
          
          <div className="text-sm">
            <div className="flex justify-between mb-2">
              <span className="font-medium">ใช้ไปแล้ว:</span>
              <span className="font-bold text-orange-600">
                {totalUsed.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
              </span>
            </div>
          </div>
          
          <div className="text-sm">
            <div className="flex justify-between mb-2">
              <span className="font-medium">คงเหลือ:</span>
              <span className="font-bold text-green-600">
                {remainingBudget.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
              </span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            <div className="text-xs text-gray-500 mt-1">
              ใช้ไป {usagePercentage.toFixed(1)}% จากวงเงินทั้งหมด
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">หมายเหตุ:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• เบิกเงินล่วงหน้าสำหรับค่าใช้จ่ายในการปฏิบัติงาน</li>
              <li>• ต้องส่งใบเสร็จและเอกสารหลักฐานภายใน 30 วัน</li>
              <li>• กรณีเหลือเงินต้องคืนให้บริษัทภายในกำหนด</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};