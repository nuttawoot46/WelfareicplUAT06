
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { WelfareRequest } from '@/types';

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
  // Calculate used budget (only count approved requests)
  const usedBudget = requests
    .filter(req => req.userId === userId && req.status === 'approved')
    .reduce((sum, req) => sum + req.amount, 0);

  // Calculate remaining budget
  const remainingBudget = Math.max(0, maxBudget - usedBudget);
  
  // Calculate percentage used
  const percentageUsed = (usedBudget / maxBudget) * 100;
  
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
        </div>
      </CardContent>
    </Card>
  );
};
