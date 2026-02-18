export interface User {
  budget_fitness: number;
  id: string;
  email: string;
  name: string;
  position: string;
  role: 'employee' | 'admin' | 'manager' | 'hr' | 'superadmin';
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
  executive_id?: number; // ID reference to the employee's executive (for MR → ME chain)
}

export type StatusType =
  | 'pending_executive' // สำหรับ Marketing Representative → Marketing Executive
  | 'pending_manager'
  | 'pending_hr'
  | 'pending_accounting'
  | 'pending_special_approval' // สำหรับ Internal Training > 10,000 บาท
  | 'completed'
  | 'rejected_executive'
  | 'rejected_manager'
  | 'rejected_hr'
  | 'rejected_accounting'
  | 'rejected_special_approval';

export type WelfareType = 
  | 'wedding'
  | 'training'
  | 'childbirth'
  | 'funeral'
  | 'glasses'
  | 'dental'
  | 'fitness'
  | 'medical'
  | 'internal_training'
  | 'advance'
  | 'general-advance'
  | 'expense-clearing'
  | 'general-expense-clearing'
  | 'employment-approval';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  type: 'system' | 'welfare' | 'training' | 'general';
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Fitness participant for shared cost feature
export interface FitnessParticipant {
  employee_id: number;
  employee_name: string;
  email: string;
  amount: number;
}

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
  hrApproverPosition?: string; // Position of HR who approved
  hrApprovedAt?: string; // Date and time when HR approved
  // Manager approval fields
  managerApproverId?: string; // ID of manager who approved
  managerApproverName?: string; // Name of manager who approved
  managerApproverPosition?: string; // Position of manager who approved
  managerApprovedAt?: string; // Date and time when manager approved
  // Executive approval fields (for Marketing Representative → Marketing Executive)
  executiveId?: number; // ID of the executive assigned to this request
  executiveApproverId?: string; // ID of executive who approved
  executiveApproverName?: string; // Name of executive who approved
  executiveApproverPosition?: string; // Position of executive who approved
  executiveApprovedAt?: string; // Date and time when executive approved
  executiveSignature?: string; // Executive's digital signature (Base64)
  // Special approval fields (for Internal Training > 10,000 บาท)
  specialApproverId?: string; // ID of special approver (kanin.s@icpladda.com)
  specialApproverName?: string; // Name of special approver
  specialApprovedAt?: string; // Date and time when special approved
  requiresSpecialApproval?: boolean; // Flag to indicate if special approval is required
  // ฟิลด์ใหม่สำหรับ training และอื่น ๆ
  start_date?: string;
  end_date?: string;
  total_days?: number;
  birth_type?: string;
  childbirths?: string; // JSON string of array of {childName?: string, birthType: 'natural' | 'caesarean'}
  funeral_type?: string;
  // Fitness specific fields (ค่าออกกำลังกาย)
  fitness_participants?: string; // JSON array of {employee_id, employee_name, email, amount}
  fitness_split_equally?: boolean; // Whether to split cost equally among participants
  fitness_amount_per_person?: number; // Calculated split amount per person
  training_topics?: string;
  total_amount?: number;
  tax7_percent?: number;
  withholding_tax3_percent?: number;
  net_amount?: number;
  excess_amount?: number;
  company_payment?: number;
  employee_payment?: number;
  // Manager waiver for training excess amount (อนุโลมส่วนเกิน)
  manager_waiver_type?: 'none' | 'full' | 'partial' | null;
  manager_waiver_amount?: number;
  manager_waiver_reason?: string;
  course_name?: string;
  organizer?: string;
  department_user?: string;
  department_request?: string;
  // ลายเซ็นดิจิทัล
  userSignature?: string; // Base64 encoded signature image
  managerSignature?: string; // Manager's digital signature
  hrSignature?: string; // HR's digital signature
  specialSignature?: string; // Special approver's digital signature (Deputy Managing Director)
  // PDF file storage
  pdfRequest?: string; // Base64 encoded PDF file that gets updated with signatures
  pdfUrl?: string; // PDF URL from storage
  pdf_url?: string; // PDF URL (snake_case alias)
  pdf_request_manager?: string; // PDF URL after manager approval
  pdf_request_hr?: string; // PDF URL after HR approval
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
  instructorFeeWithholding?: number;
  instructorFeeVat?: number;
  instructorFeeTotal?: number;
  roomFoodBeverage?: number;
  roomFoodBeverageWithholding?: number;
  roomFoodBeverageVat?: number;
  roomFoodBeverageTotal?: number;
  otherExpenses?: number;
  otherExpensesWithholding?: number;
  otherExpensesVat?: number;
  otherExpensesTotal?: number;
  withholdingTax?: number;
  vat?: number;
  averageCostPerPerson?: number;
  taxCertificateName?: string;
  withholdingTaxAmount?: number;
  additionalNotes?: string;
  isVatIncluded?: boolean;
  // Advance (เบิกเงินทดลอง) specific fields
  advanceDepartment?: string;
  advanceDepartmentOther?: string; // ระบุแผนกอื่นๆ (แยกจาก advanceActivityOther)
  advanceDistrict?: string;
  advanceActivityType?: string;
  advanceActivityOther?: string;
  advanceShopCompany?: string;
  advanceAmphur?: string;
  advanceProvince?: string;
  advanceTravelDays?: number;
  advanceWorkDays?: number;
  advanceTotalDays?: number;
  advanceDailyRate?: number;
  advanceAccommodationCost?: number;
  advanceTransportationCost?: number;
  advanceMealAllowance?: number;
  advanceOtherExpenses?: number;
  advanceProjectName?: string;
  advanceProjectLocation?: string;
  advanceExpectedReturnDate?: string;
  advanceUrgencyLevel?: string;
  advanceApprovalDeadline?: string;
  advanceSubdealerName?: string;
  advanceDealerName?: string;
  advanceLocation?: string;
  advanceParticipants?: number;
  advanceEventDate?: string;
  advanceExpenseItems?: any[] | string;

  // Bank account information
  bankAccountName?: string;
  bankName?: string;
  bankAccountNumber?: string;

  // Expense clearing specific fields
  originalAdvanceRequestId?: number;
  originalAdvanceRunNumber?: string;
  expenseClearingItems?: any[] | string;

  // Run number for tracking requests
  runNumber?: string;

  // Attachment selections for PDF checkmarks
  attachmentSelections?: {
    receipt?: boolean; // ใบเสร็จรับเงิน
    birthCertificate?: boolean; // สำเนาสูติบัตรบุตร
    medicalCertificate?: boolean; // ใบรับรองแพทย์
    idCardCopy?: boolean; // สำเนาบัตรประชาชน
    deathCertificate?: boolean; // สำเนาใบมรณะบัตร
    marriageCertificate?: boolean; // สำเนาทะเบียนสมรส
    bankBookCopy?: boolean; // สำเนาบัญชีธนาคาร
    weddingCard?: boolean; // การ์ดแต่งงาน
    other?: boolean; // อื่นๆ
    otherText?: string; // ระบุอื่นๆ
  };

  // Employment approval specific fields
  employmentType?: 'new-hire' | 'replacement' | 'temporary' | 'contract-extension';
  positionTitle?: string;
  departmentRequesting?: string;
  reportingTo?: string;
  employmentStartDate?: string;
  employmentEndDate?: string;
  hiringReason?: 'replacement' | 'new-position' | 'temporary';
  replacementFor?: string; // Name of person being replaced
  replacementDepartureDate?: string; // Departure date of person being replaced
  newPositionReason?: string; // Reason for requesting new position
  temporaryDurationYears?: number; // Duration in years for temporary position
  temporaryDurationMonths?: number; // Duration in months for temporary position
  gender?: string;
  minimumEducation?: string;
  major?: string;
  experienceField?: string;
  minimumExperience?: string;
  otherSkills?: string;
  contractType?: 'permanent' | 'temporary' | 'contract' | 'probation';
  workLocation?: string;
  numberOfPositions?: number;
  currentEmployeeCount?: number; // Current number of employees in department
  currentPositions?: any[] | string; // JSON array of current positions in department: [{positionName: string, count: number}]
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
  selectedParticipants?: ParticipantMember[];
}

export interface ParticipantMember {
  id?: number; // Employee ID if from database
  name: string;
  position?: string;
  isCustom?: boolean; // True if manually added, false if from employee database
}

export interface InternalTrainingRequest extends WelfareRequest {
  // Internal training specific fields
  department?: string;
  branch?: string;
  start_time?: string;
  end_time?: string;
  total_hours?: number;
  venue?: string;
  participants?: ParticipantGroup[] | string;
  total_participants?: number;
  instructor_fee?: number;
  instructor_fee_withholding?: number;
  instructor_fee_vat?: number;
  instructor_fee_total?: number;
  room_food_beverage?: number;
  room_food_beverage_withholding?: number;
  room_food_beverage_vat?: number;
  room_food_beverage_total?: number;
  other_expenses?: number;
  other_expenses_withholding?: number;
  other_expenses_vat?: number;
  other_expenses_total?: number;
  withholding_tax?: number;
  vat?: number;
  average_cost_per_person?: number;
  tax_certificate_name?: string;
  withholding_tax_amount?: number;
  additional_notes?: string;
  is_vat_included?: boolean;
  user_name?: string;
  employee_id?: number;
  employee_name?: string;
  request_type?: string;
  department_request?: string;
  created_at?: string;
  updated_at?: string;
  // Approval fields
  manager_approver_name?: string;
  manager_approved_at?: string;
  hr_approver_name?: string;
  hr_approved_at?: string;
  accounting_approver_name?: string;
  accounting_approved_at?: string;
  pdf_url?: string;
}
// Support Ticket Types
export interface SupportTicket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'account' | 'system' | 'network' | 'printer' | 'software' | 'database' | 'bug' | 'feature' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assigned_to?: string;
  resolution?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface SupportTicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
}

export interface CreateTicketData {
  title: string;
  description: string;
  category: SupportTicket['category'];
  priority: SupportTicket['priority'];
}

export interface CreateCommentData {
  ticket_id: string;
  comment: string;
  is_internal?: boolean;
}

// Leave System Types
export type LeaveStatusType =
  | 'pending_manager'
  | 'pending_hr'
  | 'completed'
  | 'rejected_manager'
  | 'rejected_hr'
  | 'cancelled';

export interface LeaveType {
  id: number;
  name_en: string;
  name_th: string;
  color: string;
  max_days_per_year: number | null;
  is_paid: boolean;
  requires_attachment: boolean;
  min_days_in_advance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Holiday {
  id: number;
  date: string;
  name_en: string;
  name_th: string;
  year: number;
  location: 'All' | 'Office' | 'Factory';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: number;
  employee_id: number;
  leave_type_id: number;
  leave_type?: LeaveType;
  year: number;
  total_days: number;
  used_days: number;
  used_hours: number;
  used_minutes: number;
  remaining_days: number;
  carry_over_days: number;
  carry_over_expiry: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_email: string;
  employee_position?: string;
  employee_team?: string;
  leave_type_id: number;
  leave_type_name: string;
  leave_type?: LeaveType;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  is_half_day: boolean;
  half_day_period?: 'morning' | 'afternoon';
  total_days: number;
  total_hours: number;
  total_minutes: number;
  reason?: string;
  attachment_urls: string[];

  status: LeaveStatusType;

  // Manager approval
  manager_id?: number;
  manager_name?: string;
  manager_approval_status?: string;
  manager_approval_date?: string;
  manager_signature?: string;
  manager_comment?: string;

  // HR approval
  hr_approver_id?: number;
  hr_approver_name?: string;
  hr_approval_status?: string;
  hr_approval_date?: string;
  hr_signature?: string;
  hr_comment?: string;

  // User signature
  user_signature?: string;

  // PDF storage
  pdf_url?: string;
  pdf_request_manager?: string;
  pdf_request_hr?: string;

  created_at: string;
  updated_at: string;
}

export interface LeaveCalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  color: string;
  type: 'leave' | 'holiday';
  employee_name?: string;
  leave_type?: string;
  status?: LeaveStatusType;
}

export interface LeaveFormData {
  leave_type_id: number;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  is_half_day: boolean;
  half_day_period?: 'morning' | 'afternoon';
  reason?: string;
  attachments?: FileList;
  user_signature?: string;
}

export interface EmployeeLeaveDetail {
  employee: {
    id: number;
    name: string;
    position: string;
    email: string;
    gmail?: string;
  };
  balances: LeaveBalance[];
}

// Audit Log Types
export type AuditLogCategory =
  | 'welfare_request'
  | 'leave_request'
  | 'authentication'
  | 'user_management'
  | 'system_config'
  | 'security';

export type AuditLogSeverity = 'low' | 'medium' | 'high';
export type AuditLogStatus = 'success' | 'failed' | 'warning';

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  user_role: string | null;
  action: string;
  category: AuditLogCategory;
  severity: AuditLogSeverity;
  status: AuditLogStatus;
  details: string | null;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  department: string | null;
  created_at: string;
}

export interface CreateAuditLogData {
  action: string;
  category: AuditLogCategory;
  severity?: AuditLogSeverity;
  status?: AuditLogStatus;
  details?: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, any>;
  department?: string;
}
