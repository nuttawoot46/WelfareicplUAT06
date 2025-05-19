
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { WelfareRequest } from '@/types';
import { useWelfare } from '@/context/WelfareContext';

interface RemainingBudgetCardProps {
  requests: WelfareRequest[];
  userId: string;
  maxBudget?: number;
}

export const RemainingBudgetCard: React.FC<RemainingBudgetCardProps> = ({ 
  requests, 
  userId,
  maxBudget = 10000 
}) => {
  const { getWelfareLimit } = useWelfare();
  
  // Calculate used budget (only count approved requests)
  const usedBudget = requests
    .filter(req => req.userId === userId && req.status === 'approved')
    .reduce((sum, req) => sum + req.amount, 0);

  // Calculate remaining budget
  const remainingBudget = Math.max(0, maxBudget - usedBudget);
  
  // Calculate percentage used
  const percentageUsed = (usedBudget / maxBudget) * 100;
  
  // Get welfare-specific limits for the detail section
  const dentalGlassesLimit = getWelfareLimit('dental').amount;
  const weddingLimit = getWelfareLimit('wedding').amount;
  const trainingLimit = getWelfareLimit('training').amount;
  const fitnessMonthlyLimit = getWelfareLimit('fitness').amount;
  // Fix: Access monthly limit properly - this was causing the TypeScript error
  const fitnessYearlyLimit = getWelfareLimit('fitness').amount * 12; // Calculate yearly total from monthly amount
  
  return (
    <Card className="java-card">
      <CardHeader>
        <CardTitle className="text-xl font-medium">งบประมาณสวัสดิการคงเหลือ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <div>
              <p className="text-4xl font-bold text-welfare-blue">
                {remainingBudget.toLocaleString()} <span className="text-base">บาท</span>
              </p>
              <p className="text-sm text-muted-foreground">จากทั้งหมด {maxBudget.toLocaleString()} บาท/ปี</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-gray-700">
                ใช้ไปแล้ว {usedBudget.toLocaleString()} บาท
              </p>
              <p className="text-sm text-muted-foreground">คิดเป็น {percentageUsed.toFixed(0)}%</p>
            </div>
          </div>
          
          <Progress value={percentageUsed} className="h-2" />
          
          <div className="flex justify-between text-sm">
            <span>0 บาท</span>
            <span>{maxBudget.toLocaleString()} บาท</span>
          </div>
          
          {/* Welfare limits information */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium mb-2">รายละเอียดวงเงินสวัสดิการ</h4>
            <ul className="text-xs space-y-1 text-gray-600">
              <li>• ค่ารักษาทางทันตกรรมและตัดแว่น: สูงสุด {dentalGlassesLimit?.toLocaleString()} บาท/ปี (หลังทำงานครบ 180 วัน)</li>
              <li>• เงินช่วยเหลือคลอดบุตร: คลอดธรรมชาติ 4,000 บาท, ผ่าคลอด 6,000 บาท</li>
              <li>• ค่าอบรม: สูงสุด {trainingLimit?.toLocaleString()} บาท/ปี</li>
              <li>• เงินช่วยเหลือกรณีแต่งงาน: {weddingLimit?.toLocaleString()} บาท</li>
              <li>• ค่าออกกำลังกาย: {fitnessMonthlyLimit} บาท/เดือน หรือ {fitnessYearlyLimit} บาท/ปี</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
