export interface User {
  budget_fitness: number;
  id: string;
  email: string;
  name: string;
  position: string;
  role: 'employee' | 'admin' | 'manager' | 'hr';
  department: string;
  avatar?: string;
  training_budget?: number; // Current available training budget
  original_training_budget?: number; // Original/Maximum training budget
  budget_dentalglasses?: number; // Current available glasses/dental budget
  budget_medical?: number; // Current available medical budget
  budget_wedding?: number; // Current available wedding budget
  hasPasswordSet?: boolean; // Whether the user has set up a password
  isPasswordVerified?: boolean; // Whether the password has been verified in the current session
}

export interface Employee {
  Team: string | null;
  Name: string | null;
  'email_user': string | null;
  'Email.Manager'?: string | null;
  'Position'?: string | null;
  start_date?: string | null; // Employee start date
  Pin?: string; // Password stored in the Pin column
  Role?: number;
  Budget_Training?: number;
  Original_Budget_Training?: number;
  budget_dentalglasses?: number;
  budget_medical?: number;
  budget_wedding?: number;
  budget_fitness?: number;
  manager_id?: number; // ID reference to the employee's manager
}

export type StatusType =
  | 'pending_manager'
  | 'pending_hr'
  | 'pending_accounting'
  | 'completed'
  | 'rejected_manager'
  | 'rejected_hr'
  | 'rejected_accounting';

export type WelfareType = 
  | 'wedding'
  | 'training'
  | 'childbirth'
  | 'funeral' 
  | 'glasses'
  | 'dental'
  | 'fitness'
  | 'medical'
  | 'internal_training';

export interface WelfareRequest {
  id: number;
  userId: string;
  userName: string;
  userDepartment: string;
  type: WelfareType;
  status: StatusType;
  amount: number;
  date: string;
  details: string;
  attachments?: string[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  title?: string;
  approverId?: string;
  managerId?: string; // ID of the employee's manager
  // HR approval fields
  hrApproverId?: string; // ID of HR who approved
  hrApproverName?: string; // Name of HR who approved
  hrApprovedAt?: string; // Date and time when HR approved
  // Manager approval fields
  managerApproverId?: string; // ID of manager who approved
  managerApproverName?: string; // Name of manager who approved
  managerApprovedAt?: string; // Date and time when manager approved
  // ฟิลด์ใหม่สำหรับ training และอื่น ๆ
  start_date?: string;
  end_date?: string;
  total_days?: number;
  birth_type?: string;
  funeral_type?: string;
  training_topics?: string;
  total_amount?: number;
  tax7_percent?: number;
  withholding_tax3_percent?: number;
  excess_amount?: number;
  company_payment?: number;
  employee_payment?: number;
  course_name?: string;
  organizer?: string;
  department_user?: string;
  // ลายเซ็นดิจิทัล
  userSignature?: string; // Base64 encoded signature image
  managerSignature?: string; // Manager's digital signature
  hrSignature?: string; // HR's digital signature
  // PDF file storage
  pdfRequest?: string; // Base64 encoded PDF file that gets updated with signatures
  // Internal training specific fields
  branch?: string;
  courseName?: string;
  venue?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  totalHours?: number;
  totalParticipants?: number;
  participants?: ParticipantGroup[] | string;
  instructorFee?: number;
  roomFoodBeverage?: number;
  otherExpenses?: number;
  withholdingTax?: number;
  vat?: number;
  averageCostPerPerson?: number;
  taxCertificateName?: string;
  withholdingTaxAmount?: number;
  additionalNotes?: string;
  isVatIncluded?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface ParticipantGroup {
  team: string;
  count: number;
}

export interface InternalTrainingRequest extends WelfareRequest {
  // Internal training specific fields
  branch?: string;
  start_time?: string;
  end_time?: string;
  total_hours?: number;
  venue?: string;
  participants?: ParticipantGroup[] | string;
  total_participants?: number;
  instructor_fee?: number;
  room_food_beverage?: number;
  other_expenses?: number;
  withholding_tax?: number;
  vat?: number;
  average_cost_per_person?: number;
  tax_certificate_name?: string;
  withholding_tax_amount?: number;
  additional_notes?: string;
  is_vat_included?: boolean;
}
