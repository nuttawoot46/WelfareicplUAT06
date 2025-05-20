
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
  const { getWelfareLimit, getRemainingBudget } = useWelfare();
  
  // Calculate used budget (only count approved requests)
  const usedBudget = requests
    .filter(req => req.userId === userId && req.status === 'approved')
    .reduce((sum, req) => sum + req.amount, 0);

  // Calculate remaining budget
  const remainingBudget = Math.max(0, maxBudget - usedBudget);
  
  // Calculate percentage used
  const percentageUsed = (usedBudget / maxBudget) * 100;
  
  // Get welfare-specific limits and remaining amounts
  const dentalGlassesLimit = getWelfareLimit('dental').amount;
  const dentalGlassesRemaining = getRemainingBudget(userId, 'dental');
  
  const weddingLimit = getWelfareLimit('wedding').amount;
  const weddingRemaining = getRemainingBudget(userId, 'wedding');
  
  const trainingLimit = getWelfareLimit('training').amount;
  const trainingRemaining = getRemainingBudget(userId, 'training');
  
  const fitnessMonthlyLimit = getWelfareLimit('fitness').amount;
  const fitnessYearlyLimit = fitnessMonthlyLimit * 12;
  const fitnessRemaining = getRemainingBudget(userId, 'fitness');
  
  // Calculate percentage for each welfare type 
  const dentalGlassesPercentage = dentalGlassesLimit ? ((dentalGlassesLimit - dentalGlassesRemaining) / dentalGlassesLimit) * 100 : 0;
  const weddingPercentage = weddingLimit ? ((weddingLimit - weddingRemaining) / weddingLimit) * 100 : 0;
  const trainingPercentage = trainingLimit ? ((trainingLimit - trainingRemaining) / trainingLimit) * 100 : 0;
  const fitnessPercentage = fitnessYearlyLimit ? ((fitnessYearlyLimit - fitnessRemaining) / fitnessYearlyLimit) * 100 : 0;
  
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
          
          {/* Welfare limits information with remaining amounts */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium mb-3">รายละเอียดวงเงินสวัสดิการ</h4>
            
            <div className="space-y-3">
              <div className="text-xs">
                <div className="flex justify-between mb-1">
                  <span>ค่ารักษาทางทันตกรรมและตัดแว่น: สูงสุด {dentalGlassesLimit?.toLocaleString()} บาท/ปี (หลังทำงานครบ 180 วัน)</span>
                  <span className="font-medium text-welfare-blue">คงเหลือ {dentalGlassesRemaining.toLocaleString()} บาท</span>
                </div>
                <Progress value={dentalGlassesPercentage} className="h-1" />
              </div>
              
              <div className="text-xs">
                <div className="flex justify-between mb-1">
                  <span>เงินช่วยเหลือคลอดบุตร: คลอดธรรมชาติ 4,000 บาท, ผ่าคลอด 6,000 บาท (จำกัด 3 คนต่อครอบครัว)</span>
                  <span className="font-medium text-welfare-blue">คงเหลือตามสิทธิ</span>
                </div>
              </div>
              
              <div className="text-xs">
                <div className="flex justify-between mb-1">
                  <span>ค่าอบรม: สูงสุด {trainingLimit?.toLocaleString()} บาท/ปี</span>
                  <span className="font-medium text-welfare-blue">คงเหลือ {trainingRemaining.toLocaleString()} บาท</span>
                </div>
                <Progress value={trainingPercentage} className="h-1" />
              </div>
              
              <div className="text-xs">
                <div className="flex justify-between mb-1">
                  <span>เงินช่วยเหลือกรณีแต่งงาน: {weddingLimit?.toLocaleString()} บาท</span>
                  <span className="font-medium text-welfare-blue">คงเหลือ {weddingRemaining.toLocaleString()} บาท</span>
                </div>
                <Progress value={weddingPercentage} className="h-1" />
              </div>
              
              <div className="text-xs">
                <div className="flex justify-between mb-1">
                  <span>ค่าออกกำลังกาย: {fitnessMonthlyLimit} บาท/เดือน หรือ {fitnessYearlyLimit} บาท/ปี</span>
                  <span className="font-medium text-welfare-blue">คงเหลือ {fitnessRemaining.toLocaleString()} บาท</span>
                </div>
                <Progress value={fitnessPercentage} className="h-1" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
