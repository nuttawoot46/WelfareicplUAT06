import { describe, it, expect } from 'vitest';
import {
  mapTrainingData,
  validateTrainingData,
  applyFallbacks,
  transformTrainingData,
  formatThaiDate,
  calculateFinancials,
  parseTrainingObjectives,
  numberToThaiText,
  type TrainingFormData
} from '../externalTrainingDataMapper';
import { WelfareRequest, User } from '@/types';

// Mock data for testing
const mockWelfareRequest: WelfareRequest = {
  id: 1,
  userId: 'test-user-id',
  userName: 'John Doe',
  userDepartment: 'IT Department',
  type: 'training',
  status: 'pending_manager',
  amount: 10000,
  date: '2024-01-15',
  details: 'Training details',
  createdAt: '2024-01-15T10:00:00Z',
  course_name: 'Advanced JavaScript',
  organizer: 'Tech Academy',
  start_date: '2024-02-01',
  end_date: '2024-02-03',
  total_days: 3,
  training_topics: 'JavaScript, React, Node.js'
};

const mockUser: User = {
  id: 'test-user-id',
  email: 'john.doe@company.com',
  name: 'John Doe',
  position: 'Senior Developer',
  role: 'employee',
  department: 'IT Department',
  budget_fitness: 5000,
  training_budget: 50000
};

const mockEmployeeData = {
  Name: 'John Doe',
  Position: 'Senior Developer',
  Team: 'IT Department',
  manager_name: 'Jane Smith'
};

describe('externalTrainingDataMapper', () => {
  describe('formatThaiDate', () => {
    it('should format date string to Thai format', () => {
      const result = formatThaiDate('2024-01-15');
      expect(result.day).toBe('15');
      expect(result.year).toBe('2567'); // Buddhist year
      expect(result.formatted).toMatch(/15\/01\/2567/);
    });

    it('should handle current date when no date provided', () => {
      const result = formatThaiDate();
      expect(result.day).toBeDefined();
      expect(result.month).toBeDefined();
      expect(result.year).toBeDefined();
      expect(result.formatted).toBeDefined();
    });
  });

  describe('calculateFinancials', () => {
    it('should calculate financial amounts correctly', () => {
      const result = calculateFinancials(10000);
      
      expect(result.baseCost).toBe(10000);
      expect(result.vatAmount).toBe(700); // 7%
      expect(result.withholdingTax).toBe(300); // 3%
      expect(result.totalAmount).toBe(10700); // base + VAT
      expect(result.netAmount).toBe(10400); // total - withholding
      expect(result.companyPayment).toBe(5000); // 50%
      expect(result.employeePayment).toBe(5000); // 50%
      expect(result.netAmountText).toContain('บาทถ้วน');
    });

    it('should handle zero amount', () => {
      const result = calculateFinancials(0);
      
      expect(result.baseCost).toBe(0);
      expect(result.vatAmount).toBe(0);
      expect(result.withholdingTax).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.netAmount).toBe(0);
      expect(result.netAmountText).toBe('ศูนย์บาทถ้วน');
    });
  });

  describe('numberToThaiText', () => {
    it('should convert numbers to Thai text correctly', () => {
      expect(numberToThaiText(0)).toBe('ศูนย์บาทถ้วน');
      expect(numberToThaiText(1)).toBe('หนึ่งบาทถ้วน');
      expect(numberToThaiText(21)).toBe('ยี่สิบเอ็ดบาทถ้วน');
      expect(numberToThaiText(100)).toBe('หนึ่งร้อยบาทถ้วน');
      expect(numberToThaiText(1000)).toBe('หนึ่งพันบาทถ้วน');
    });

    it('should handle complex numbers', () => {
      const result = numberToThaiText(1234);
      expect(result).toContain('หนึ่งพัน');
      expect(result).toContain('สองร้อย');
      expect(result).toContain('สามสิบ');
      expect(result).toContain('สี่');
      expect(result).toContain('บาทถ้วน');
    });
  });

  describe('parseTrainingObjectives', () => {
    it('should parse comma-separated objectives', () => {
      const result = parseTrainingObjectives('Objective 1, Objective 2, Objective 3');
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Objective 1');
      expect(result[1]).toBe('Objective 2');
    });

    it('should parse JSON array objectives', () => {
      const jsonObjectives = JSON.stringify(['Objective A', 'Objective B']);
      const result = parseTrainingObjectives(jsonObjectives);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('Objective A');
      expect(result[1]).toBe('Objective B');
    });

    it('should return default objectives when input is empty', () => {
      const result = parseTrainingObjectives('');
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('เพิ่มพูนความรู้และทักษะในการปฏิบัติงาน');
      expect(result[1]).toBe('พัฒนาประสิทธิภาพและคุณภาพการทำงาน');
    });

    it('should handle malformed JSON gracefully', () => {
      const result = parseTrainingObjectives('invalid json {');
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('เพิ่มพูนความรู้และทักษะในการปฏิบัติงาน');
    });
  });

  describe('mapTrainingData', () => {
    it('should map all data correctly with complete input', () => {
      const result = mapTrainingData(
        mockWelfareRequest,
        mockUser,
        mockEmployeeData,
        'user-signature',
        'manager-signature',
        'hr-signature',
        45000
      );

      expect(result.employeeName).toBe('John Doe');
      expect(result.employeePosition).toBe('Senior Developer');
      expect(result.employeeDepartment).toBe('IT Department');
      expect(result.managerName).toBe('Jane Smith');
      expect(result.courseName).toBe('Advanced JavaScript');
      expect(result.organizer).toBe('Tech Academy');
      expect(result.totalDays).toBe(3);
      expect(result.baseCost).toBe(10000);
      expect(result.remainingBudget).toBe(45000);
      expect(result.userSignature).toBe('user-signature');
      expect(result.managerSignature).toBe('manager-signature');
      expect(result.hrSignature).toBe('hr-signature');
    });

    it('should apply fallbacks when employee data is missing', () => {
      const result = mapTrainingData(
        mockWelfareRequest,
        mockUser
      );

      expect(result.employeeName).toBe('John Doe'); // From userData
      expect(result.employeePosition).toBe('Senior Developer'); // From userData
      expect(result.managerName).toBe('ผู้จัดการ'); // Default fallback
    });

    it('should calculate total days when not provided', () => {
      const requestWithoutTotalDays = {
        ...mockWelfareRequest,
        total_days: undefined
      };

      const result = mapTrainingData(requestWithoutTotalDays, mockUser);
      expect(result.totalDays).toBe(3); // Calculated from start/end dates
    });
  });

  describe('validateTrainingData', () => {
    it('should validate complete data successfully', () => {
      const completeData = mapTrainingData(mockWelfareRequest, mockUser, mockEmployeeData);
      const result = validateTrainingData(completeData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const incompleteData: TrainingFormData = {
        ...mapTrainingData(mockWelfareRequest, mockUser, mockEmployeeData),
        employeeName: '',
        courseName: '',
        baseCost: 0
      };

      const result = validateTrainingData(incompleteData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Required field missing: employeeName');
      expect(result.errors).toContain('Required field missing: courseName');
      expect(result.errors).toContain('Base cost must be greater than 0');
    });

    it('should generate warnings for incomplete optional data', () => {
      const dataWithWarnings: TrainingFormData = {
        ...mapTrainingData(mockWelfareRequest, mockUser, mockEmployeeData),
        organizer: 'องค์กรจัดการฝึกอบรม', // Default value
        trainingObjectives: [],
        userSignature: undefined
      };

      const result = validateTrainingData(dataWithWarnings);

      expect(result.warnings).toContain('Organizer information may be incomplete');
      expect(result.warnings).toContain('No training objectives specified');
      expect(result.warnings).toContain('User signature is missing');
    });
  });

  describe('applyFallbacks', () => {
    it('should apply fallbacks for missing fields', () => {
      const partialData: Partial<TrainingFormData> = {
        employeeName: 'John Doe',
        baseCost: 5000
      };

      const result = applyFallbacks(partialData);

      expect(result.employeeName).toBe('John Doe');
      expect(result.baseCost).toBe(5000);
      expect(result.employeePosition).toBe('พนักงาน'); // Default
      expect(result.courseName).toBe('หลักสูตรการฝึกอบรม'); // Default
      expect(result.trainingObjectives).toHaveLength(2); // Default objectives
      expect(result.requestTaxCertificate).toBe(true); // Default
    });

    it('should preserve existing values when applying fallbacks', () => {
      const partialData: Partial<TrainingFormData> = {
        employeeName: 'John Doe',
        courseName: 'Custom Course',
        requestTaxCertificate: false
      };

      const result = applyFallbacks(partialData);

      expect(result.employeeName).toBe('John Doe');
      expect(result.courseName).toBe('Custom Course');
      expect(result.requestTaxCertificate).toBe(false);
    });
  });

  describe('transformTrainingData', () => {
    it('should complete the full transformation pipeline', () => {
      const result = transformTrainingData(
        mockWelfareRequest,
        mockUser,
        mockEmployeeData,
        'user-signature'
      );

      expect(result.data).toBeDefined();
      expect(result.validation).toBeDefined();
      expect(result.validation.isValid).toBe(true);
      expect(result.data.employeeName).toBe('John Doe');
      expect(result.data.courseName).toBe('Advanced JavaScript');
    });

    it('should handle incomplete data with validation errors', () => {
      const incompleteRequest: WelfareRequest = {
        ...mockWelfareRequest,
        course_name: '',
        amount: 0
      };

      const result = transformTrainingData(incompleteRequest, mockUser);

      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors.length).toBeGreaterThan(0);
      expect(result.data.courseName).toBe('หลักสูตรการฝึกอบรม'); // Fallback applied
    });
  });
});