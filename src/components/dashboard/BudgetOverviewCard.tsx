import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Heart, GraduationCap, Smile, Dumbbell } from 'lucide-react';
import { BenefitLimit, getBenefitLimits } from '@/services/welfareApi';
import { WelfareType } from '@/types';

const welfareTypeLabels: Partial<Record<WelfareType, string>> = {
  wedding: 'ค่าแต่งงาน',
  training: 'ค่าอบรม',
  dental: 'ทันตกรรม / แว่นสายตา',
  fitness: 'ค่าออกกำลังกาย',
  medical: 'ค่าเยี่ยมเจ็บป่วย',
};

const welfareTypeIcons: Partial<Record<WelfareType, React.ReactNode>> = {
  wedding: <Heart className="h-4 w-4 text-pink-500" />,
  training: <GraduationCap className="h-4 w-4 text-blue-500" />,
  dental: <Smile className="h-4 w-4 text-orange-500" />,
  fitness: <Dumbbell className="h-4 w-4 text-green-500" />,
  medical: <Heart className="h-4 w-4 text-red-500" />,
};

export function BudgetOverviewCard() {
  const [benefits, setBenefits] = useState<BenefitLimit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getBenefitLimits();
        // Filter out glasses (merged with dental), childbirth, funeral
        const filtered = data.filter(
          (b) => b.type !== 'glasses' && b.type !== 'childbirth' && b.type !== 'funeral'
        );
        setBenefits(filtered);
      } catch (error) {
        console.error('Error loading budget overview:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Wallet className="h-5 w-5 text-blue-600" />
          ภาพรวมวงเงิน
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))
        ) : benefits.length > 0 ? (
          benefits.map((benefit) => {
            const percent = benefit.totalLimit > 0
              ? (benefit.remaining / benefit.totalLimit) * 100
              : 0;
            const barColor =
              percent < 25
                ? 'bg-red-500'
                : percent < 50
                ? 'bg-amber-500'
                : 'bg-green-500';
            const barBg =
              percent < 25
                ? 'bg-red-100'
                : percent < 50
                ? 'bg-amber-100'
                : 'bg-green-100';

            return (
              <div key={benefit.type} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-700">
                    {welfareTypeIcons[benefit.type] || <Wallet className="h-4 w-4 text-gray-400" />}
                    {welfareTypeLabels[benefit.type] || benefit.type}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {benefit.remaining.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / {benefit.totalLimit.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} บาท
                  </span>
                </div>
                <div className={`h-2 w-full rounded-full overflow-hidden ${barBg}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-sm text-gray-500 py-4">
            ไม่มีข้อมูลวงเงิน
          </p>
        )}
      </CardContent>
    </Card>
  );
}
