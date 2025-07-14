import { supabase } from '@/integrations/supabase/client';
import { WelfareType } from '@/types';

export interface BenefitLimit {
  type: WelfareType;
  totalLimit: number;
  used: number;
  remaining: number;
}

export const getBenefitLimitsByEmpId = async (empId: number): Promise<BenefitLimit[]> => {
  // ดึงข้อมูล employee ตาม id
  const { data: employee, error } = await supabase
    .from('Employee')
    .select('*')
    .eq('id', empId)
    .single();

  if (error || !employee) throw error || new Error('Employee not found');

  const benefitLimits: BenefitLimit[] = [];

  // ตัวอย่าง mapping ตามที่มีใน welfareApi.ts
  if (employee.budget_wedding !== null && employee.budget_wedding !== undefined) {
    const totalLimit = 3000;
    const remaining = employee.budget_wedding;
    const used = totalLimit - remaining;
    benefitLimits.push({ type: 'wedding', totalLimit, used, remaining });
  }
  if (employee.Budget_Training !== null && employee.Budget_Training !== undefined) {
    const totalLimit = employee.Original_Budget_Training || 10000;
    const remaining = employee.Budget_Training;
    const used = totalLimit - remaining;
    benefitLimits.push({ type: 'training', totalLimit, used, remaining });
  }
  if (employee.budget_dentalglasses !== null && employee.budget_dentalglasses !== undefined) {
    const totalLimit = 2000;
    const remaining = employee.budget_dentalglasses;
    const used = totalLimit - remaining;
    benefitLimits.push({ type: 'dental', totalLimit, used, remaining });
  }
  if (employee.budget_medical !== null && employee.budget_medical !== undefined) {
    const totalLimit = 1000;
    const remaining = employee.budget_medical;
    const used = totalLimit - remaining;
    benefitLimits.push({ type: 'medical', totalLimit, used, remaining });
  }
  if (employee.budget_fitness !== null && employee.budget_fitness !== undefined) {
    const totalLimit = 300;
    const remaining = employee.budget_fitness;
    const used = totalLimit - remaining;
    benefitLimits.push({ type: 'fitness', totalLimit, used, remaining });
  }
  // เพิ่ม default benefits หากไม่มีข้อมูลใน db
  const defaultBenefits: Array<{type: WelfareType, totalLimit: number}> = [
    { type: 'childbirth', totalLimit: 8000 },
    { type: 'funeral', totalLimit: 10000 },
  ];
  defaultBenefits.forEach(benefit => {
    const exists = benefitLimits.some(item => item.type === benefit.type);
    if (!exists) {
      benefitLimits.push({
        type: benefit.type,
        totalLimit: benefit.totalLimit,
        used: 0,
        remaining: benefit.totalLimit
      });
    }
  });
  return benefitLimits;
};
