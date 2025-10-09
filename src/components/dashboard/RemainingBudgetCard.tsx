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
  
  // Filter out accounting requests (advance, general-advance and expense-clearing) - only use welfare requests
  const welfareOnlyRequests = requests.filter(r => r.type !== 'advance' && r.type !== 'general-advance' && r.type !== 'expense-clearing');
  
  // Get welfare-specific limits and remaining amounts
  const dentalGlassesLimit = getWelfareLimit('dental').amount;
  const dentalGlassesRemaining = getRemainingBudget(userId, 'dental');

  const dentalglassesLimit = getWelfareLimit('glasses').amount;
  const dentalglassesRemaining = getRemainingBudget(userId, 'glasses');
  
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
        <CardTitle className="text-xl font-medium">รายละเอียดวงเงินสวัสดิการ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-xs">
            <div className="flex justify-between mb-1">
              <span>ค่ารักษาทางทันตกรรมหรือค่าตัดแว่นสายตา: สูงสุด {dentalGlassesLimit?.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท/ปี (หลังทำงานครบ 180 วัน)</span>
              <span className="font-medium text-welfare-blue">คงเหลือ {dentalGlassesRemaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
            </div>
            <Progress value={dentalGlassesPercentage} className="h-1" />
          </div>
          
          <div className="text-xs">
            <div className="flex justify-between mb-1">
              <span>ของเยี่ยมกรณีเจ็บป่วย 1,000 บาท</span>
              <span className="font-medium text-welfare-blue">คงเหลือตามสิทธิ</span>
            </div>
          </div>
                    
          <div className="text-xs">
            <div className="flex justify-between mb-1">
              <span>เงินช่วยเหลือคลอดบุตร: คลอดธรรมชาติ 4,000 บาท, ผ่าคลอด 6,000 บาท</span>
              <span className="font-medium text-welfare-blue">คงเหลือตามสิทธิ</span>
            </div>
          </div>
          
          <div className="text-xs">
            <div className="flex justify-between mb-1">
              <span>ค่าอบรม: สูงสุด {trainingLimit?.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท/ปี</span>
              <span className="font-medium text-welfare-blue">คงเหลือ {trainingRemaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
            </div>
            <Progress value={trainingPercentage} className="h-1" />
          </div>
          
          <div className="text-xs">
            <div className="flex justify-between mb-1">
              <span>เงินช่วยเหลือกรณีแต่งงาน: {weddingLimit?.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
              <span className="font-medium text-welfare-blue">คงเหลือ {weddingRemaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
            </div>
            <Progress value={weddingPercentage} className="h-1" />
          </div>

          <div className="text-xs">
            <div className="flex justify-between mb-1">
              <span>สวัสดิการงานศพ บุตร ของพนักงาน ค่าเจ้าภาพ 3,000 บาท เงินช่วยเหลือ 4,000 บาท + พวงหลีด 1 พวง</span>
              <span className="font-medium text-welfare-blue">คงเหลือตามสิทธิ</span>
            </div>
          </div>

          <div className="text-xs">
            <div className="flex justify-between mb-1">
              <span>สวัสดิการงานศพ บิดา มารดา ของพนักงาน ค่าเจ้าภาพ 3,000 บาท เงินช่วยเหลือ 3,000 บาท + พวงหลีด 1 พวง</span>
              <span className="font-medium text-welfare-blue">คงเหลือตามสิทธิ</span>
            </div>
          </div>
          
          <div className="text-xs">
            <div className="flex justify-between mb-1">
              <span>ค่าออกกำลังกาย: {fitnessMonthlyLimit} บาท/เดือน หรือ {fitnessYearlyLimit} บาท/ปี</span>
              <span className="font-medium text-welfare-blue">คงเหลือ {fitnessRemaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
            </div>
            <Progress value={fitnessPercentage} className="h-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
