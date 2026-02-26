import { getWelfareTypeLabel } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

export type InsightSeverity = 'positive' | 'warning' | 'critical' | 'neutral';

export interface InsightItem {
  text: string;
  severity: InsightSeverity;
  value?: string;
}

export interface InsightCategory {
  id: string;
  title: string;
  icon: 'TrendingUp' | 'Users';
  items: InsightItem[];
  overallSeverity: InsightSeverity;
}

export interface InsightResult {
  categories: InsightCategory[];
  generatedAt: Date;
  dataPoints: number;
}

export interface WelfareReportItem {
  id: number;
  employee_id: number;
  employee_name: string;
  department_request?: string;
  request_type: string;
  status: string;
  amount: number;
  created_at: string;
  manager_approved_at?: string;
  hr_approved_at?: string;
  accounting_approved_at?: string;
}

export interface ReportSummary {
  totalAmount: number;
  totalRequests: number;
  byType: { [key: string]: { count: number; amount: number } };
}

// ============================================================
// Helpers
// ============================================================

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  arr.forEach(item => {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
}

function formatThb(amount: number): string {
  return amount.toLocaleString('th-TH', { style: 'currency', currency: 'THB' });
}

function worstSeverity(items: InsightItem[]): InsightSeverity {
  if (items.some(i => i.severity === 'critical')) return 'critical';
  if (items.some(i => i.severity === 'warning')) return 'warning';
  if (items.some(i => i.severity === 'positive')) return 'positive';
  return 'neutral';
}

// ============================================================
// 1. Trend Insight
// ============================================================

export function generateTrendInsights(
  currentData: WelfareReportItem[],
  previousData: WelfareReportItem[],
  reportPeriod: 'month' | 'year',
): InsightCategory {
  const items: InsightItem[] = [];
  const periodLabel = reportPeriod === 'month' ? 'เดือน' : 'ปี';

  if (previousData.length === 0) {
    items.push({ text: `ไม่มีข้อมูล${periodLabel}ก่อนหน้าสำหรับเปรียบเทียบ`, severity: 'neutral' });
    return { id: 'trend', title: 'Trend Insight', icon: 'TrendingUp', items, overallSeverity: 'neutral' };
  }

  const currentTotal = currentData.reduce((s, r) => s + r.amount, 0);
  const prevTotal = previousData.reduce((s, r) => s + r.amount, 0);
  const change = pctChange(currentTotal, prevTotal);

  if (change > 20) {
    items.push({
      text: `ยอดเบิกสวัสดิการเพิ่มขึ้น ${change.toFixed(0)}% เทียบกับ${periodLabel}ก่อน (${formatThb(prevTotal)} → ${formatThb(currentTotal)})`,
      severity: 'warning',
      value: `+${change.toFixed(0)}%`,
    });
  } else if (change < -10) {
    items.push({
      text: `ยอดเบิกสวัสดิการลดลง ${Math.abs(change).toFixed(0)}% เทียบกับ${periodLabel}ก่อน`,
      severity: 'positive',
      value: `${change.toFixed(0)}%`,
    });
  } else {
    items.push({
      text: `ยอดเบิกสวัสดิการคงที่ เปลี่ยนแปลง ${change >= 0 ? '+' : ''}${change.toFixed(0)}% เทียบกับ${periodLabel}ก่อน`,
      severity: 'neutral',
      value: `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`,
    });
  }

  // Count comparison
  const countChange = pctChange(currentData.length, previousData.length);
  if (Math.abs(countChange) > 10) {
    items.push({
      text: `จำนวนรายการ ${countChange > 0 ? 'เพิ่มขึ้น' : 'ลดลง'} ${Math.abs(countChange).toFixed(0)}% (${previousData.length} → ${currentData.length} รายการ)`,
      severity: countChange > 20 ? 'warning' : 'neutral',
    });
  }

  // Per-type biggest movers
  const currentByType = groupBy(currentData, r => r.request_type);
  const prevByType = groupBy(previousData, r => r.request_type);

  const allTypes = new Set([...Object.keys(currentByType), ...Object.keys(prevByType)]);
  let biggestIncrease = { type: '', change: 0 };
  let biggestDecrease = { type: '', change: 0 };

  allTypes.forEach(type => {
    const curAmt = (currentByType[type] || []).reduce((s, r) => s + r.amount, 0);
    const prevAmt = (prevByType[type] || []).reduce((s, r) => s + r.amount, 0);
    const ch = pctChange(curAmt, prevAmt);
    if (ch > biggestIncrease.change) biggestIncrease = { type, change: ch };
    if (ch < biggestDecrease.change) biggestDecrease = { type, change: ch };
  });

  if (biggestIncrease.change > 10) {
    items.push({
      text: `${getWelfareTypeLabel(biggestIncrease.type)} เพิ่มขึ้นมากที่สุด (+${biggestIncrease.change.toFixed(0)}%)`,
      severity: biggestIncrease.change > 40 ? 'warning' : 'neutral',
    });
  }
  if (biggestDecrease.change < -10) {
    items.push({
      text: `${getWelfareTypeLabel(biggestDecrease.type)} ลดลงมากที่สุด (${biggestDecrease.change.toFixed(0)}%)`,
      severity: 'positive',
    });
  }

  return { id: 'trend', title: 'Trend Insight', icon: 'TrendingUp', items, overallSeverity: worstSeverity(items) };
}

// ============================================================
// 2. User Behavior
// ============================================================

export function generateUserBehaviorInsights(
  reportData: WelfareReportItem[],
): InsightCategory {
  const items: InsightItem[] = [];

  if (reportData.length === 0) {
    items.push({ text: 'ไม่มีข้อมูลเพียงพอสำหรับวิเคราะห์พฤติกรรม', severity: 'neutral' });
    return { id: 'behavior', title: 'User Behavior', icon: 'Users', items, overallSeverity: 'neutral' };
  }

  // Top claimers by count
  const byEmployee = groupBy(reportData, r => r.employee_name);
  const employeeStats = Object.entries(byEmployee)
    .map(([name, records]) => ({
      name,
      count: records.length,
      total: records.reduce((s, r) => s + r.amount, 0),
    }))
    .sort((a, b) => b.count - a.count);

  const avgCount = mean(employeeStats.map(e => e.count));

  if (employeeStats.length > 0 && employeeStats[0].count > avgCount * 2) {
    items.push({
      text: `${employeeStats[0].name} เบิกบ่อยกว่าค่าเฉลี่ย ${(employeeStats[0].count / avgCount).toFixed(1)} เท่า (${employeeStats[0].count} ครั้ง, รวม ${formatThb(employeeStats[0].total)})`,
      severity: 'warning',
    });
  } else if (employeeStats.length > 0) {
    items.push({
      text: `พนักงานที่เบิกบ่อยที่สุด: ${employeeStats[0].name} (${employeeStats[0].count} ครั้ง, รวม ${formatThb(employeeStats[0].total)})`,
      severity: 'neutral',
    });
  }

  // Top departments
  const byDept = groupBy(reportData, r => r.department_request || 'ไม่ระบุแผนก');
  const deptStats = Object.entries(byDept)
    .map(([dept, records]) => ({
      dept,
      count: records.length,
      total: records.reduce((s, r) => s + r.amount, 0),
    }))
    .sort((a, b) => b.total - a.total);

  if (deptStats.length > 0) {
    items.push({
      text: `แผนกที่ใช้งบสูงสุด: ${deptStats[0].dept} (${formatThb(deptStats[0].total)}, ${deptStats[0].count} รายการ)`,
      severity: 'neutral',
    });
  }
  if (deptStats.length > 1) {
    const lowest = deptStats[deptStats.length - 1];
    items.push({
      text: `แผนกที่ใช้งบต่ำสุด: ${lowest.dept} (${formatThb(lowest.total)}, ${lowest.count} รายการ)`,
      severity: 'neutral',
    });
  }

  // Most popular welfare type
  const byType = groupBy(reportData, r => r.request_type);
  const typeStats = Object.entries(byType)
    .map(([type, records]) => ({ type, count: records.length }))
    .sort((a, b) => b.count - a.count);

  if (typeStats.length > 0) {
    items.push({
      text: `สวัสดิการที่นิยมมากที่สุด: ${getWelfareTypeLabel(typeStats[0].type)} (${typeStats[0].count} รายการ)`,
      severity: 'neutral',
    });
  }

  return { id: 'behavior', title: 'User Behavior', icon: 'Users', items, overallSeverity: worstSeverity(items) };
}

// ============================================================
// Orchestrator
// ============================================================

export function generateAllInsights(params: {
  reportData: WelfareReportItem[];
  previousPeriodData: WelfareReportItem[];
  reportPeriod: 'month' | 'year';
}): InsightResult {
  const { reportData, previousPeriodData, reportPeriod } = params;

  const categories: InsightCategory[] = [
    generateTrendInsights(reportData, previousPeriodData, reportPeriod),
    generateUserBehaviorInsights(reportData),
  ];

  return {
    categories,
    generatedAt: new Date(),
    dataPoints: reportData.length,
  };
}
