import React, { useState, useEffect, useMemo, useRef } from 'react';
import { subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { Sparkles, TrendingUp, Users, ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import {
  generateAllInsights,
  type WelfareReportItem,
  type InsightCategory,
  type InsightSeverity,
  type InsightResult,
} from '@/utils/welfareInsightEngine';

// ============================================================
// Props
// ============================================================

interface WelfareAIInsightsProps {
  reportData: WelfareReportItem[];
  reportSummary: {
    totalAmount: number;
    totalRequests: number;
    byType: { [key: string]: { count: number; amount: number } };
  };
  reportPeriod: 'month' | 'year';
  selectedMonth: string;
  selectedYear: string;
}

// ============================================================
// Helpers
// ============================================================

const SEVERITY_COLORS: Record<InsightSeverity, { border: string; badge: string; dot: string }> = {
  positive: { border: 'border-l-green-500', badge: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  warning: { border: 'border-l-amber-500', badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  critical: { border: 'border-l-red-500', badge: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  neutral: { border: 'border-l-blue-500', badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
};

const SEVERITY_LABELS: Record<InsightSeverity, string> = {
  positive: 'ปกติ',
  warning: 'เฝ้าระวัง',
  critical: 'เร่งด่วน',
  neutral: 'ข้อมูล',
};

const ICON_MAP = {
  TrendingUp,
  Users,
} as const;

const ACCOUNTING_TYPES = ['advance', 'general-advance', 'expense-clearing', 'general-expense-clearing'];

// ============================================================
// Sub-components
// ============================================================

function InsightsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {[1, 2].map(i => (
        <Card key={i} className="border-l-4 border-l-gray-200">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InsightCard({ category }: { category: InsightCategory }) {
  const colors = SEVERITY_COLORS[category.overallSeverity];
  const IconComponent = ICON_MAP[category.icon];

  return (
    <Card className={`border-l-4 ${colors.border} hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <IconComponent className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{category.title}</span>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${colors.badge}`}>
            {SEVERITY_LABELS[category.overallSeverity]}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {category.items.map((item, idx) => {
            const dotColor = SEVERITY_COLORS[item.severity].dot;
            return (
              <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed">
                <span className={`h-2 w-2 rounded-full ${dotColor} mt-1 flex-shrink-0`} />
                <span className="flex-1">{item.text}</span>
                {item.value && (
                  <span className="font-bold text-xs whitespace-nowrap ml-1">{item.value}</span>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Component
// ============================================================

export const WelfareAIInsights: React.FC<WelfareAIInsightsProps> = ({
  reportData,
  reportPeriod,
  selectedMonth,
  selectedYear,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previousData, setPreviousData] = useState<WelfareReportItem[]>([]);
  const hasFetched = useRef(false);
  const lastKey = useRef('');

  const selectionKey = `${reportPeriod}-${selectedMonth}-${selectedYear}`;

  // Fetch previous period data when collapsible is opened
  useEffect(() => {
    if (!isOpen) return;
    if (hasFetched.current && lastKey.current === selectionKey) return;

    const fetchPreviousPeriodData = async () => {
      setIsLoading(true);

      try {
        let prevStart: Date;
        let prevEnd: Date;

        if (reportPeriod === 'month') {
          const current = new Date(selectedMonth + '-01');
          const prev = subMonths(current, 1);
          prevStart = startOfMonth(prev);
          prevEnd = endOfMonth(prev);
        } else {
          const prevYear = parseInt(selectedYear) - 1;
          prevStart = startOfYear(new Date(`${prevYear}-01-01`));
          prevEnd = endOfYear(new Date(`${prevYear}-01-01`));
        }

        const { data } = await supabase
          .from('welfare_requests')
          .select('id, employee_id, employee_name, department_request, request_type, status, amount, created_at, manager_approved_at, hr_approved_at, accounting_approved_at')
          .eq('status', 'completed')
          .not('request_type', 'in', `(${ACCOUNTING_TYPES.join(',')})`)
          .gte('accounting_approved_at', prevStart.toISOString())
          .lte('accounting_approved_at', prevEnd.toISOString());

        setPreviousData((data || []) as WelfareReportItem[]);

        hasFetched.current = true;
        lastKey.current = selectionKey;
      } catch (err) {
        console.error('Error fetching AI insight data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreviousPeriodData();
  }, [isOpen, selectionKey, reportPeriod, selectedMonth, selectedYear]);

  // Reset fetch flag when selection changes
  useEffect(() => {
    if (lastKey.current !== selectionKey) {
      hasFetched.current = false;
    }
  }, [selectionKey]);

  // Compute insights
  const insights: InsightResult | null = useMemo(() => {
    if (isLoading || !hasFetched.current) return null;
    if (reportData.length === 0 && previousData.length === 0) return null;

    return generateAllInsights({
      reportData,
      previousPeriodData: previousData,
      reportPeriod,
    });
  }, [reportData, previousData, reportPeriod, isLoading]);

  const totalInsightCount = insights
    ? insights.categories.reduce((sum, c) => sum + c.items.length, 0)
    : 0;

  return (
    <div className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border border-purple-200/50 hover:border-purple-300 transition-all group cursor-pointer">
            <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
            <span className="font-semibold text-gray-800">AI วิเคราะห์อัตโนมัติ</span>
            <Badge variant="outline" className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">
              Beta
            </Badge>
            {insights && totalInsightCount > 0 && (
              <span className="text-xs text-gray-500">
                พบ {totalInsightCount} ข้อมูลเชิงลึก
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 ml-auto text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {isLoading ? (
            <InsightsSkeleton />
          ) : insights && insights.categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {insights.categories.map(category => (
                <InsightCard key={category.id} category={category} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm py-6 mt-4 bg-gray-50 rounded-lg">
              ไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์ในช่วงเวลาที่เลือก
            </div>
          )}

          {insights && (
            <div className="text-right text-[10px] text-gray-400 mt-2">
              วิเคราะห์จาก {insights.dataPoints} รายการ | อัปเดตเมื่อ{' '}
              {insights.generatedAt.toLocaleTimeString('th-TH')}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
