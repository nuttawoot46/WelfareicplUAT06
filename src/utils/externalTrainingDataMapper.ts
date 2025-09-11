import { WelfareRequest, User } from '@/types';

// Interface for the processed training form data
export interface TrainingFormData {
  // Header Information
  formCode: string;
  currentDate: ThaiDate;
  
  // Employee Information
  employeeName: string;
  employeePosition: string;
  employeeDepartment: string;
  managerName: string;
  
  // Training Information
  courseName: string;
  organizer: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  trainingObjectives: string[];
  
  // Financial Information
  baseCost: number;
  vatAmount: number;
  withholdingTax: number;
  netAmount: number;
  totalAmount: number;
  companyPayment: number;
  employeePayment: number;
  netAmountText: string;
  remainingBudget: number;
  
  // Signatures
  userSignature?: string;
  managerSignature?: string;
  hrSignature?: string;
  
  // Checkboxes
  isCompleted: boolean;
  requestTaxCertificate: boolean;
}

export interface ThaiDate {
  day: string;
  month: string;
  year: string; // Buddhist year
  formatted: string;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Required fields for PDF generation
const REQUIRED_FIELDS = [
  'employeeName',
  'courseName',
  'baseCost'
] as const;

/**
 * Data mapping function to extract required fields from WelfareRequest and User types
 */
export const mapTrainingData = (
  welfareData: WelfareRequest,
  userData: User,
  employeeData?: {
    Name: string;
    Position: string;
    Team: string;
    manager_name?: string;
  },
  userSignature?: string,
  managerSignature?: string,
  hrSignature?: string,
  remainingBudget?: number
): TrainingFormData => {
  // Extract employee information with fallbacks
  const employeeName = employeeData?.Name || userData.name || welfareData.userName || '';
  const employeePosition = employeeData?.Position || userData.position || 'พนักงาน';
  const employeeDepartment = employeeData?.Team || userData.department || welfareData.userDepartment || 'ไม่ระบุแผนก';
  const managerName = employeeData?.manager_name || 'ผู้จัดการ';

  // Extract training information with fallbacks
  const courseName = welfareData.course_name || welfareData.title || 'หลักสูตรการฝึกอบรม';
  const organizer = welfareData.organizer || 'องค์กรจัดการฝึกอบรม';

  // Process dates
  const startDate = formatThaiDate(welfareData.start_date);
  const endDate = formatThaiDate(welfareData.end_date);
  const currentDate = formatThaiDate();

  // Calculate total days with fallback logic
  let totalDays = welfareData.total_days || 1;
  if (!totalDays && welfareData.start_date && welfareData.end_date) {
    const start = new Date(welfareData.start_date);
    const end = new Date(welfareData.end_date);
    totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  // Parse training objectives
  const trainingObjectives = parseTrainingObjectives(welfareData.training_topics || welfareData.details);

  // Calculate financial information
  const baseAmount = welfareData.amount || 0;
  const financials = calculateFinancials(baseAmount);

  // Process remaining budget
  const remainingBudgetAmount = remainingBudget || userData.training_budget || 0;

  // Determine checkbox states
  const isCompleted = welfareData.status === 'completed';
  const requestTaxCertificate = true; // Default to true as per form requirements

  return {
    // Header Information
    formCode: 'F-TRA-01-06 Rev: 02 01/09/2023',
    currentDate,
    
    // Employee Information
    employeeName,
    employeePosition,
    employeeDepartment,
    managerName,
    
    // Training Information
    courseName,
    organizer,
    startDate: startDate.formatted,
    endDate: endDate.formatted,
    totalDays,
    trainingObjectives,
    
    // Financial Information
    baseCost: financials.baseCost,
    vatAmount: financials.vatAmount,
    withholdingTax: financials.withholdingTax,
    netAmount: financials.netAmount,
    totalAmount: financials.totalAmount,
    companyPayment: financials.companyPayment,
    employeePayment: financials.employeePayment,
    netAmountText: financials.netAmountText,
    remainingBudget: remainingBudgetAmount,
    
    // Signatures
    userSignature,
    managerSignature,
    hrSignature,
    
    // Checkboxes
    isCompleted,
    requestTaxCertificate
  };
};

/**
 * Validation for required fields before PDF generation
 */
export const validateTrainingData = (data: TrainingFormData): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  REQUIRED_FIELDS.forEach(field => {
    const value = data[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`Required field missing: ${field}`);
    }
  });

  // Validate financial data
  if (data.baseCost <= 0) {
    errors.push('Base cost must be greater than 0');
  }

  if (data.totalDays <= 0) {
    errors.push('Total days must be greater than 0');
  }

  // Check for warnings
  if (!data.organizer || data.organizer === 'องค์กรจัดการฝึกอบรม') {
    warnings.push('Organizer information may be incomplete');
  }

  if (data.trainingObjectives.length === 0) {
    warnings.push('No training objectives specified');
  }

  if (!data.userSignature) {
    warnings.push('User signature is missing');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Fallback logic for missing or undefined data fields
 */
export const applyFallbacks = (data: Partial<TrainingFormData>): TrainingFormData => {
  const defaultObjectives = [
    'เพิ่มพูนความรู้และทักษะในการปฏิบัติงาน',
    'พัฒนาประสิทธิภาพและคุณภาพการทำงาน'
  ];

  return {
    // Header Information
    formCode: data.formCode || 'F-TRA-01-06 Rev: 02 01/09/2023',
    currentDate: data.currentDate || formatThaiDate(),
    
    // Employee Information
    employeeName: data.employeeName || 'ไม่ระบุชื่อ',
    employeePosition: data.employeePosition || 'พนักงาน',
    employeeDepartment: data.employeeDepartment || 'ไม่ระบุแผนก',
    managerName: data.managerName || 'ผู้จัดการ',
    
    // Training Information
    courseName: data.courseName || 'หลักสูตรการฝึกอบรม',
    organizer: data.organizer || 'องค์กรจัดการฝึกอบรม',
    startDate: data.startDate || formatThaiDate().formatted,
    endDate: data.endDate || formatThaiDate().formatted,
    totalDays: data.totalDays || 1,
    trainingObjectives: data.trainingObjectives?.length ? data.trainingObjectives : defaultObjectives,
    
    // Financial Information
    baseCost: data.baseCost || 0,
    vatAmount: data.vatAmount || 0,
    withholdingTax: data.withholdingTax || 0,
    netAmount: data.netAmount || 0,
    totalAmount: data.totalAmount || 0,
    companyPayment: data.companyPayment || 0,
    employeePayment: data.employeePayment || 0,
    netAmountText: data.netAmountText || 'ศูนย์บาทถ้วน',
    remainingBudget: data.remainingBudget || 0,
    
    // Signatures
    userSignature: data.userSignature,
    managerSignature: data.managerSignature,
    hrSignature: data.hrSignature,
    
    // Checkboxes
    isCompleted: data.isCompleted || false,
    requestTaxCertificate: data.requestTaxCertificate !== undefined ? data.requestTaxCertificate : true
  };
};

/**
 * Data transformation pipeline to convert raw data to template-ready format
 */
export const transformTrainingData = (
  welfareData: WelfareRequest,
  userData: User,
  employeeData?: {
    Name: string;
    Position: string;
    Team: string;
    manager_name?: string;
  },
  userSignature?: string,
  managerSignature?: string,
  hrSignature?: string,
  remainingBudget?: number
): { data: TrainingFormData; validation: ValidationResult } => {
  // Step 1: Map raw data to structured format
  const mappedData = mapTrainingData(
    welfareData,
    userData,
    employeeData,
    userSignature,
    managerSignature,
    hrSignature,
    remainingBudget
  );

  // Step 2: Apply fallbacks for missing data
  const dataWithFallbacks = applyFallbacks(mappedData);

  // Step 3: Validate the final data
  const validation = validateTrainingData(dataWithFallbacks);

  return {
    data: dataWithFallbacks,
    validation
  };
};

// Helper functions (imported from existing utilities)

/**
 * Thai date formatting utility
 */
export const formatThaiDate = (dateString?: string): ThaiDate => {
  if (!dateString) {
    const now = new Date();
    return {
      day: now.getDate().toString(),
      month: now.toLocaleDateString('th-TH', { month: 'long' }),
      year: (now.getFullYear() + 543).toString(),
      formatted: now.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    };
  }

  const date = new Date(dateString);
  return {
    day: date.getDate().toString(),
    month: date.toLocaleDateString('th-TH', { month: 'long' }),
    year: (date.getFullYear() + 543).toString(),
    formatted: date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  };
};

/**
 * Financial calculations utility
 */
export const calculateFinancials = (baseAmount: number) => {
  const vatAmount = baseAmount * 0.07;
  const withholdingTax = baseAmount * 0.03;
  const totalAmount = baseAmount + vatAmount;
  const netAmount = totalAmount - withholdingTax;
  const companyPayment = baseAmount * 0.5;
  const employeePayment = baseAmount * 0.5;

  return {
    baseCost: baseAmount,
    vatAmount,
    withholdingTax,
    totalAmount,
    netAmount,
    companyPayment,
    employeePayment,
    netAmountText: numberToThaiText(Math.round(netAmount))
  };
};

/**
 * Training objectives parser utility
 */
export const parseTrainingObjectives = (topicsSource?: string): string[] => {
  const defaultObjectives = [
    'เพิ่มพูนความรู้และทักษะในการปฏิบัติงาน',
    'พัฒนาประสิทธิภาพและคุณภาพการทำงาน'
  ];

  if (!topicsSource) return defaultObjectives;

  try {
    let topicsData = topicsSource;

    // Handle double-encoded JSON strings
    if (typeof topicsData === 'string' && topicsData.startsWith('"') && topicsData.endsWith('"')) {
      topicsData = JSON.parse(topicsData);
    }

    // Try to parse as JSON first
    if (typeof topicsData === 'string' && (topicsData.includes('[') || topicsData.includes('{'))) {
      const parsed = JSON.parse(topicsData);
      if (Array.isArray(parsed)) {
        const objectives = parsed.map(item => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item.value) return item.value;
          return String(item);
        }).filter(Boolean);

        return objectives.length >= 2 ? objectives : [...objectives, ...defaultObjectives].slice(0, 2);
      }
    } else {
      // If not JSON, split by common delimiters
      const objectives = topicsData.split(/[,\n;]/).map(s => s.trim()).filter(Boolean);
      return objectives.length >= 2 ? objectives : [...objectives, ...defaultObjectives].slice(0, 2);
    }
  } catch (e) {
    // If parsing fails, split by delimiters
    const objectives = topicsSource.split(/[,\n;]/).map(s => s.trim()).filter(Boolean);
    return objectives.length >= 2 ? objectives : [...objectives, ...defaultObjectives].slice(0, 2);
  }

  return defaultObjectives;
};

/**
 * Thai number conversion utility
 */
export const numberToThaiText = (num: number): string => {
  if (num === 0) return 'ศูนย์บาทถ้วน';

  const ones = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const tens = ['', '', 'ยี่สิบ', 'สามสิบ', 'สี่สิบ', 'ห้าสิบ', 'หกสิบ', 'เจ็ดสิบ', 'แปดสิบ', 'เก้าสิบ'];

  const convertGroup = (n: number): string => {
    if (n === 0) return '';

    let result = '';
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const one = n % 10;

    if (hundred > 0) {
      result += ones[hundred] + 'ร้อย';
    }

    if (ten > 0) {
      if (ten === 1) {
        result += 'สิบ';
      } else if (ten === 2) {
        result += 'ยี่สิบ';
      } else {
        result += ones[ten] + 'สิบ';
      }
    }

    if (one > 0) {
      if (ten > 0 && one === 1) {
        result += 'เอ็ด';
      } else {
        result += ones[one];
      }
    }

    return result;
  };

  // Handle numbers up to millions
  const million = Math.floor(num / 1000000);
  const thousand = Math.floor((num % 1000000) / 1000);
  const remainder = num % 1000;

  let result = '';

  if (million > 0) {
    result += convertGroup(million) + 'ล้าน';
  }

  if (thousand > 0) {
    result += convertGroup(thousand) + 'พัน';
  }

  if (remainder > 0) {
    result += convertGroup(remainder);
  }

  return result + 'บาทถ้วน';
};