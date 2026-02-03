
import { WelfareRequest, StatusType, WelfareType } from '@/types';
import { supabase } from '@/integrations/supabase/client';



// Interface for benefit limits
export interface BenefitLimit {
  type: WelfareType;
  totalLimit: number;
  used: number;
  remaining: number;
}


// --- All Google Script/axios code removed. Only Supabase and relevant exports below. ---
// If you need to add or update welfare requests, use Supabase client directly in your context or service logic.

export const getBenefitLimits = async (): Promise<BenefitLimit[]> => {
  console.log('Fetching benefit limits from Supabase');
  try {
    // ดึงข้อมูลผู้ใช้ปัจจุบันจาก Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.email) {
      console.error('Error getting current user:', userError);
      throw new Error('User not logged in');
    }
    
    console.log('Current user email:', user.email);
    
    // ดึงข้อมูลพนักงานจากตาราง Employee โดยใช้ email_user เป็นตัวค้นหา
    const { data: employeeData, error: fetchError } = await supabase
      .from('Employee')
      .select('*')
      .eq('"email_user"', user.email)  // ใช้ double quotes รอบชื่อคอลัมน์ที่มีจุด
      .single();
      
    if (fetchError || !employeeData) {
      console.error('Error fetching employee data:', fetchError);
      throw new Error('ไม่พบข้อมูลพนักงานที่เกี่ยวข้องกับบัญชีนี้');
    }
    
    console.log('Employee data from Supabase:', employeeData);
    
    // สร้างข้อมูลวงเงินสวัสดิการจากข้อมูลที่ได้จาก Supabase
    // ข้อมูลวงเงินคงเหลือจะอยู่ในคอลัมน์ต่างๆ เช่น budget_wedding, Budget_Training, budget_dentalglasses, budget_medical
    
    const benefitLimits: BenefitLimit[] = [];
    
    // ใช้ type assertion เพื่อให้ TypeScript ยอมรับ property ที่อาจจะไม่มีในตาราง
    const employee = employeeData as any;
    
    // สวัสดิการค่าแต่งงาน
    if (employee.budget_wedding !== null) {
      const totalLimit = 3000; // วงเงินทั้งหมด (กำหนดตามนโยบายบริษัท)
      const remaining = employee.budget_wedding; // ใช้ยอดคงเหลือจาก Supabase โดยตรง
      const used = totalLimit - remaining;
      
      benefitLimits.push({
        type: 'wedding',
        totalLimit,
        used,
        remaining
      });
    }
    // สวัสดิการค่าออกกำลังกาย
    if (employee.budget_fitness !== null) {
      const totalLimit = 300; // วงเงินทั้งหมด (กำหนดตามนโยบายบริษัท)
      const remaining = employee.budget_fitness; // ใช้ยอดคงเหลือจาก Supabase โดยตรง
      const used = totalLimit - remaining;
      
      benefitLimits.push({
        type: 'fitness',
        totalLimit,
        used,
        remaining
      });
    }
    
    // สวัสดิการค่าอบรม
    if (employee.Budget_Training !== null) {
      const totalLimit = employee.Original_Budget_Training;
      const remaining = employee.Budget_Training; // ใช้ยอดคงเหลือจาก Supabase โดยตรง
      const used = totalLimit - remaining;
      
      benefitLimits.push({
        type: 'training',
        totalLimit,
        used,
        remaining
      });
    }
    
    // สวัสดิการค่าตัดแว่นสายตาและทำฟัน (รวมกัน)
    if (employee.budget_dentalglasses !== null && employee.budget_dentalglasses !== undefined) {
      const totalLimit = 2000; // วงเงินทั้งหมด (รวมค่าแว่นและค่ารักษาทัตกรรม)
      const remaining = employee.budget_dentalglasses; // ใช้ยอดคงเหลือจาก Supabase โดยตรง
      const used = totalLimit - remaining;
      
      // เพิ่มทั้ง dental และ glasses ที่ใช้งบประมาณร่วมกัน
      benefitLimits.push({
        type: 'dental',
        totalLimit,
        used,
        remaining
      });
      
      benefitLimits.push({
        type: 'glasses',
        totalLimit,
        used,
        remaining
      });
    }
    
    // สวัสดิการค่ารักษาพยาบาล
    if (employee.budget_medical !== null) {
      const totalLimit = 1000; // วงเงินทั้งหมด (กำหนดตามนโยบายบริษัท)
      const remaining = employee.budget_medical; // ใช้ยอดคงเหลือจาก Supabase โดยตรง
      const used = totalLimit - remaining;
      
      benefitLimits.push({
        type: 'medical',
        totalLimit,
        used,
        remaining
      });
    }
    
    // สวัสดิการค่าคลอดบุตร
    if (employee.budget_childbirth !== null && employee.budget_childbirth !== undefined) {
      const totalLimit = 8000; // วงเงินทั้งหมด (กำหนดตามนโยบายบริษัท)
      const remaining = employee.budget_childbirth || 0;
      const used = totalLimit - remaining;
      
      benefitLimits.push({
        type: 'childbirth',
        totalLimit,
        used,
        remaining
      });
    }
    
    // สวัสดิการค่าช่วยเหลืองานศพ
    if (employee.budget_funeral !== null && employee.budget_funeral !== undefined) {
      const totalLimit = 10000; // วงเงินทั้งหมด (กำหนดตามนโยบายบริษัท)
      const remaining = employee.budget_funeral || 0;
      const used = totalLimit - remaining;
      
      benefitLimits.push({
        type: 'funeral',
        totalLimit,
        used,
        remaining
      });
    }
    
    // เพิ่มสวัสดิการอื่นๆ ที่ไม่มีในฐานข้อมูล (ใช้ค่าเริ่มต้น)
    const defaultBenefits: Array<{type: WelfareType, totalLimit: number}> = [
      { type: 'childbirth', totalLimit: 8000 },
      { type: 'funeral', totalLimit: 10000 },
    ];
    
    // ตรวจสอบว่ามีสวัสดิการใดที่ยังไม่ได้เพิ่ม
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

    
    // สวัสดิการค่าออกกำลังกาย
    if (employee.budget_fitness !== null && employee.budget_fitness !== undefined) {
      // หาและลบรายการค่าออกกำลังกายที่เพิ่มไว้จาก defaultBenefits (ถ้ามี)
      const fitnessIndex = benefitLimits.findIndex(item => item.type === 'fitness');
      if (fitnessIndex !== -1) {
        benefitLimits.splice(fitnessIndex, 1);
      }
      
      const totalLimit = 300; // วงเงินทั้งหมด (กำหนดตามนโยบายบริษัท)
      const remaining = employee.budget_fitness || 0;
      const used = totalLimit - remaining;
      
      benefitLimits.push({
        type: 'fitness',
        totalLimit,
        used,
        remaining
      });
    }
    
    console.log('Generated benefit limits:', benefitLimits);
    return benefitLimits;
    
  } catch (error: any) {
    console.error('Error fetching benefit limits from Supabase:', {
      message: error.message,
    });
    
    // Return mock data in case of error
    return [
      { type: 'wedding', totalLimit: 3000, used: 0, remaining: 3000 },
      { type: 'training', totalLimit: 10000, used: 2500, remaining: 7500 },
      { type: 'childbirth', totalLimit: 8000, used: 0, remaining: 8000 },
      { type: 'funeral', totalLimit: 10000, used: 0, remaining: 10000 },
      // รวมค่าตัดแว่นสายตาและค่ารักษาทัตกรรมเป็นรายการเดียวกัน
      { type: 'dental', totalLimit: 2000, used: 0, remaining: 2000 },
      { type: 'glasses', totalLimit: 2000, used: 0, remaining: 2000 },
      { type: 'fitness', totalLimit: 300, used: 0, remaining: 300 },
      { type: 'medical', totalLimit: 1000, used: 0, remaining: 1000 },
    ];
  }
};


// Get employee data for PDF generation and other purposes
export const getEmployeeData = async (userId: string): Promise<{ Name: string; Position: string; Team: string; start_date?: string } | undefined> => {
  try {
    // First try to get by numeric ID
    const numericId = parseInt(userId, 10);
    if (!isNaN(numericId)) {
      const { data: employeeById, error: errorById } = await supabase
        .from('Employee')
        .select('Name, Position, Team, start_date, Budget_Training, Original_Budget_Training')
        .eq('id', numericId)
        .single();

      if (!errorById && employeeById) {
        return {
          Name: employeeById.Name,
          Position: employeeById.Position,
          Team: employeeById.Team,
          start_date: employeeById.start_date
        };
      }
    }

    // If not found by ID, try by email
    const { data, error } = await supabase
      .from('Employee')
      .select('Name, Position, Team, start_date, Budget_Training, Original_Budget_Training')
      .eq('"email_user"', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching employee data:', error);
      return undefined;
    }

    return {
      Name: data.Name,
      Position: data.Position,
      Team: data.Team,
      start_date: data.start_date
    };
  } catch (error) {
    console.error('Error fetching employee data:', error);
    return undefined;
  }
};