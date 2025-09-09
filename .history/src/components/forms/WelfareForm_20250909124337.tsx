import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WelfareType, ParticipantGroup, ParticipantMember } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useWelfare } from '@/context/WelfareContext';
import { useInternalTraining } from '@/context/InternalTrainingContext';
import { ArrowLeft, Check, Loader2, AlertCircle, Plus, X, Paperclip, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

import LoadingPopup from './LoadingPopup';
import { generateWelfarePDF } from '../pdf/WelfarePDFGenerator';
import { generateTrainingPDF } from '../pdf/TrainingPDFGenerator';
import { generateAdvancePDF } from '../pdf/AdvancePDFGenerator';
import { uploadPDFToSupabase } from '@/utils/pdfUtils';
import { DigitalSignature } from '../signature/DigitalSignature';
import { ParticipantSelector } from './ParticipantSelector';

interface WelfareFormProps {
  type: WelfareType;
  onBack: () => void;
  editId?: number | null;
}

// 1. อัปเดต FormValues Interface
interface FormValues {
  startDate: string;
  endDate: string;
  totalDays: number;
  amount: number;
  details: string;
  title?: string;

  birthType?: 'natural' | 'caesarean';
  funeralType?: 'employee_spouse' | 'child' | 'parent';
  attachments?: FileList;
  trainingTopics?: { value: string }[];
  totalAmount?: number;
  tax7Percent?: number;
  withholdingTax3Percent?: number;
  netAmount?: number;
  excessAmount?: number;
  companyPayment?: number;
  employeePayment?: number;
  courseName?: string;
  organizer?: string;
  isVatIncluded?: boolean; // เพิ่ม field สำหรับ checkbox

  // Internal Training fields
  department?: string;
  branch?: string;
  startTime?: string;
  endTime?: string;
  totalHours?: number;
  venue?: string;
  participants?: ParticipantGroup[];
  totalParticipants?: number;
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

  // Advance (เบิกเงินทดลอง) fields
  advanceDepartment?: string; // แผนก
  advanceDistrict?: string; // เขต
  advanceActivityType?: string; // ประเภทกิจกรรม
  advanceActivityOther?: string; // ระบุอื่นๆ
  advanceShopCompany?: string; // ชื่อร้าน/บริษัท
  advanceAmphur?: string; // อำเภอ
  advanceProvince?: string; // จังหวัด
  advanceEventDate?: string; // วันที่จัด
  advanceParticipants?: number; // จำนวนผู้เข้าร่วม
  advanceDailyRate?: number;
  advanceAccommodationCost?: number;
  advanceTransportationCost?: number;
  advanceMealAllowance?: number;
  advanceOtherExpenses?: number;
  advanceProjectName?: string;
  advanceProjectLocation?: string;
}

// Available teams/departments for internal training
const TEAMS = [
  'Management',
  'Account',
  'Inspiration (IS)',
  'Marketing(PES)',
  'Marketing(DIS)',
  'Marketing(COP)',
  'Marketing(PD)',
  'Procurement',
  'Strategy',
];

// Employee levels for internal training (ตาม PDF)
const EMPLOYEE_LEVELS = [
  'พนักงาน',
  'เจ้าหน้าที่',
  'ผู้ช่วยหัวหน้างาน',
  'หัวหน้างาน',
  'ผู้ช่วยผู้จัดการ',
  'ผู้จัดการ',
  'รองกรรมการผู้จัดการ',
  'กรรมการผู้จัดการ / ประธาน'
];

const DEPARTMENTS = [
  'ทรัพยากรบุคคล',
];

const BRANCHES = [
  'สำนักงานสุรวงศ์',
  'โรงงานนครปฐม',
];

// ประเภทกิจกรรมสำหรับเบิกเงินทดลอง
const ACTIVITY_TYPES = [
  'จัดประชุม',
  'ออกบูธ',
  'ดีเลอร์',
  'ซับดีลเลอร์',
  'อื่นๆ ระบุ'
];

// Helper to get form title by welfare type
const getFormTitle = (type: WelfareType): string => {
  const titles: Record<WelfareType, string> = {
    wedding: 'แบบฟอร์มขอสวัสดิการค่าแต่งงาน',
    training: 'แบบฟอร์มขอสวัสดิการค่าอบรม',
    childbirth: 'แบบฟอร์มขอสวัสดิการค่าคลอดบุตร',
    funeral: 'แบบฟอร์มขอสวัสดิการค่าช่วยเหลืองานศพ',
    glasses: 'แบบฟอร์มขอสวัสดิการค่าตัดแว่น',
    dental: 'แบบฟอร์มขอสวัสดิการค่าทำฟัน',
    fitness: 'แบบฟอร์มขอสวัสดิการค่าออกกำลังกาย',
    medical: 'แบบฟอร์มขอสวัสดิการค่าของเยี่ยมกรณีเจ็บป่วย',
    internal_training: 'ฟอร์มเบิกค่าอบรม (ภายใน)',
    advance: 'แบบขออนุมัติเบิกเงินทดลอง',
  };

  return titles[type] || 'แบบฟอร์มขอสวัสดิการ';
};

export function WelfareForm({ type, onBack, editId }: WelfareFormProps) {
  // รองรับ editId จาก prop (modal edit) หรือจาก query string (หน้า /Forms)
  const location = useLocation();
  let editIdNum: number | undefined = undefined;
  if (typeof editId === 'number') {
    editIdNum = editId;
  } else {
    const searchParams = new URLSearchParams(location.search);
    const editIdStr = searchParams.get('editId');
    editIdNum = editIdStr ? Number(editIdStr) : undefined;
  }
  const { user, profile } = useAuth();
  const { submitRequest, isLoading, getWelfareLimit, getRemainingBudget, trainingBudget, refreshRequests } = useWelfare();
  const { submitRequest: submitInternalTrainingRequest, refreshRequests: refreshInternalTrainingRequests } = useInternalTraining();
  const [files, setFiles] = useState<string[]>([]);
  const { toast } = useToast();
  const [maxAmount, setMaxAmount] = useState<number | null>(null);
  const [condition, setCondition] = useState<string | undefined>();
  const [isMonthly, setIsMonthly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeBudget, setEmployeeBudget] = useState<number | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [userSignature, setUserSignature] = useState<string>('');
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [workDaysError, setWorkDaysError] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      trainingTopics: [{ value: '' }, { value: '' }],
      participants: [{ team: '', count: 0, selectedParticipants: [] }]
    }
  });




  const { fields, append, remove } = useFieldArray({
    control,
    name: "trainingTopics"
  });

  const { fields: participantFields, append: appendParticipant, remove: removeParticipant } = useFieldArray({
    control,
    name: "participants"
  });

  // Fetch employee data when component mounts
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user?.email) return;

      try {
        const { data, error } = await supabase
          .from('Employee')
          .select('id, Name, Position, Team, start_date')
          .eq('email_user', user.email)
          .single();

        if (!error && data) {
          setEmployeeData(data);
        }
      } catch (error) {
        console.error('Error fetching employee data:', error);
      }
    };

    fetchEmployeeData();
  }, [user?.email]);

  // Helper function to calculate work days
  const calculateWorkDays = (startDate: string): number => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = today.getTime() - start.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Check work days eligibility for training
  const checkTrainingEligibility = (employeeData: any): boolean => {
    if (type !== 'training' || !employeeData?.start_date) return true;

    const workDays = calculateWorkDays(employeeData.start_date);
    if (workDays < 180) {
      setWorkDaysError(`ไม่สามารถเบิกสวัสดิการอบรมได้ เนื่องจากอายุงานยังไม่ถึง 180 วัน (ปัจจุบันทำงานมาแล้ว ${workDays} วัน)`);
      return false;
    }

    setWorkDaysError('');
    return true;
  };

  // 1. ตั้งค่าขีดจำกัดและเงื่อนไขของสวัสดิการตาม type ทุกครั้งที่ type หรือ user เปลี่ยน
  useEffect(() => {
    if (!user) return;
    let limitAmount = 0;
    let limitCondition = '';
    let limitMonthly = false;
    if (type === 'training') {
      limitAmount = trainingBudget || 0;
      limitCondition = 'อ้างอิงจากงบประมาณคงเหลือของพนักงาน';
    } else {
      const limit = getWelfareLimit(type);
      limitAmount = limit.amount;
      limitCondition = limit.condition;
      limitMonthly = limit.monthly || false;
    }
    setMaxAmount(limitAmount);
    setIsMonthly(limitMonthly);
    setCondition(limitCondition);
    if (type === 'training' && user && profile) {
      const budgetResult = getRemainingBudget(user.id, type);
      setEmployeeBudget(budgetResult);
    } else if (type !== 'training' && limitAmount) {
      setValue('amount', parseFloat(limitAmount.toFixed(2)));
    }

    // ถ้ามี editId ให้ดึงข้อมูลมา prefill
    const fetchEditData = async () => {
      if (editIdNum) {
        const { data, error } = await supabase
          .from('welfare_requests')
          .select('*')
          .eq('id', editIdNum)
          .single();
        if (!error && data) {
          // Map only fields that exist in the schema
          const dbData = data as any; // Type assertion for database fields
          reset({
            amount: dbData.amount,
            details: dbData.details || '',
            title: dbData.title || '',
            startDate: dbData.start_date || '',
            endDate: dbData.end_date || '',
            totalDays: dbData.total_days || 0,
            birthType: dbData.birth_type || '',
            funeralType: (dbData.funeral_type as 'employee_spouse' | 'child' | 'parent') || undefined,
            trainingTopics: dbData.training_topics ? JSON.parse(dbData.training_topics) : [],
            totalAmount: dbData.total_amount || 0,
            tax7Percent: dbData.tax7_percent || 0,
            withholdingTax3Percent: dbData.withholding_tax3_percent || 0,
            netAmount: dbData.net_amount || dbData.amount || 0,
            excessAmount: dbData.excess_amount || 0,
            companyPayment: dbData.company_payment || 0,
            employeePayment: dbData.employee_payment || 0,
            courseName: dbData.course_name || '',
            organizer: dbData.organizer || '',
            isVatIncluded: dbData.is_vat_included || false,
            // Internal Training detailed tax fields
            instructorFee: dbData.instructor_fee || 0,
            instructorFeeWithholding: dbData.instructor_fee_withholding || 0,
            instructorFeeVat: dbData.instructor_fee_vat || 0,
            instructorFeeTotal: dbData.instructor_fee_total || 0,
            roomFoodBeverage: dbData.room_food_beverage || 0,
            roomFoodBeverageWithholding: dbData.room_food_beverage_withholding || 0,
            roomFoodBeverageVat: dbData.room_food_beverage_vat || 0,
            roomFoodBeverageTotal: dbData.room_food_beverage_total || 0,
            otherExpenses: dbData.other_expenses || 0,
            otherExpensesWithholding: dbData.other_expenses_withholding || 0,
            otherExpensesVat: dbData.other_expenses_vat || 0,
            otherExpensesTotal: dbData.other_expenses_total || 0,
            withholdingTax: dbData.withholding_tax || 0,
            vat: dbData.vat || 0,
            // Advance fields
            advanceDepartment: dbData.advance_department || '',
            advanceDistrict: dbData.advance_district || '',
            advanceActivityType: dbData.advance_activity_type || '',
            advanceActivityOther: dbData.advance_activity_other || '',
            advanceShopCompany: dbData.advance_shop_company || '',
            advanceAmphur: dbData.advance_amphur || '',
            advanceProvince: dbData.advance_province || '',
            advanceEventDate: dbData.advance_event_date || '',
            advanceParticipants: dbData.advance_participants || 0,
            advanceDailyRate: dbData.advance_daily_rate || 0,
            advanceAccommodationCost: dbData.advance_accommodation_cost || 0,
            advanceTransportationCost: dbData.advance_transportation_cost || 0,
            advanceMealAllowance: dbData.advance_meal_allowance || 0,
            advanceOtherExpenses: dbData.advance_other_expenses || 0,
            advanceProjectName: dbData.advance_project_name || '',
            advanceProjectLocation: dbData.advance_project_location || '',
          });
          // Attachments
          if (data.attachment_url) {
            let attachments: string[] = [];
            if (Array.isArray(data.attachment_url)) {
              attachments = data.attachment_url;
            } else if (typeof data.attachment_url === 'string') {
              try {
                const parsed = JSON.parse(data.attachment_url);
                attachments = Array.isArray(parsed) ? parsed : [parsed];
              } catch {
                attachments = data.attachment_url ? [data.attachment_url] : [];
              }
            }
            setFiles(attachments);
          }
        }
      }
    };
    fetchEditData();
  }, [type, user, getWelfareLimit, setValue, trainingBudget, editId, reset]);

  // Check training eligibility when employeeData changes
  useEffect(() => {
    if (employeeData) {
      checkTrainingEligibility(employeeData);
    }
  }, [employeeData, type]);

  // For childbirth form
  const birthType = watch('birthType');

  // Update amount when birth type changes
  useEffect(() => {
    if (type === 'childbirth' && birthType) {
      const amount = birthType === 'natural' ? 4000.00 : 6000.00;
      setValue('amount', parseFloat(amount.toFixed(2)));
    }
  }, [birthType, type, setValue]);

  // คำนวณผลลัพธ์ใหม่ทันทีเมื่อเปลี่ยน amount, VAT หรือ withholding tax
  useEffect(() => {
    const amount = watch('amount');
    const vatAmount = Number(watch('tax7Percent')) || 0;
    const withholdingAmount = Number(watch('withholdingTax3Percent')) || 0;
    
    if (type === 'training') {
      // สมมติว่า remainingBudget ใช้ trainingBudget
      const remainingBudget = currentRemainingBudget ?? 0;
      if (amount !== undefined && amount !== null && !isNaN(Number(amount))) {
        calculateTrainingAmounts(Number(amount), Number(remainingBudget), vatAmount, withholdingAmount);
      }
    } else if (type === 'wedding' || type === 'childbirth' || type === 'funeral' || type === 'glasses' || type === 'dental' || type === 'fitness' || type === 'medical') {
      // คำนวณสำหรับ welfare types อื่น ๆ
      if (amount !== undefined && amount !== null && !isNaN(Number(amount))) {
        calculateNonTrainingAmounts(Number(amount), vatAmount, withholdingAmount);
      }
    }
  }, [watch('amount'), watch('tax7Percent'), watch('withholdingTax3Percent'), type]);

  // Calculate total days when start or end date changes
  useEffect(() => {
    const startDate = watch('startDate');
    const endDate = watch('endDate');
    if (startDate && endDate) {
      const totalDays = calculateTotalDays(startDate, endDate);
      setValue('totalDays', totalDays);
    }
  }, [watch('startDate'), watch('endDate'), setValue]);

  // Calculate total participants for internal training
  useEffect(() => {
    if (type === 'internal_training') {
      const participants = watch('participants') || [];
      const total = participants.reduce((sum, p) => sum + (Number(p.count) || 0), 0);
      setValue('totalParticipants', total);
    }
  }, [watch('participants'), setValue, type]);

  // Watch for changes in participant counts and update total immediately
  const watchedParticipants = watch('participants');
  useEffect(() => {
    if (type === 'internal_training' && watchedParticipants) {
      // Calculate total based on actual selected participants, fallback to count
      const total = watchedParticipants.reduce((sum, p) => {
        const selectedCount = p?.selectedParticipants?.length || 0;
        const declaredCount = Number(p?.count) || 0;
        // Use the actual selected count, but don't exceed declared count
        return sum + Math.min(selectedCount, declaredCount);
      }, 0);
      setValue('totalParticipants', total);
    }
  }, [watchedParticipants, setValue, type]);

  // Calculate total hours for internal training
  useEffect(() => {
    if (type === 'internal_training') {
      const startTime = watch('startTime');
      const endTime = watch('endTime');
      const startDate = watch('startDate');
      const endDate = watch('endDate');

      if (startTime && endTime && startDate && endDate) {
        const start = new Date(`${startDate}T${startTime}`);
        const end = new Date(`${endDate}T${endTime}`);

        if (end > start) {
          const diffMs = end.getTime() - start.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          setValue('totalHours', Math.round(diffHours * 100) / 100);
        }
      }
    }
  }, [watch('startTime'), watch('endTime'), watch('startDate'), watch('endDate'), setValue, type]);

  // Calculate advance total amount
  useEffect(() => {
    if (type === 'advance') {
      // Calculate total amount
      const dailyRate = Number(watch('advanceDailyRate')) || 0;
      const accommodationCost = Number(watch('advanceAccommodationCost')) || 0;
      const transportationCost = Number(watch('advanceTransportationCost')) || 0;
      const mealAllowance = Number(watch('advanceMealAllowance')) || 0;
      const otherExpenses = Number(watch('advanceOtherExpenses')) || 0;
      const participants = Number(watch('advanceParticipants')) || 0;

      const totalAmount = (dailyRate * participants) + accommodationCost + transportationCost + mealAllowance + otherExpenses;
      setValue('amount', Math.round(totalAmount * 100) / 100);
    }
  }, [watch('advanceDailyRate'), watch('advanceAccommodationCost'), watch('advanceTransportationCost'), watch('advanceMealAllowance'), watch('advanceOtherExpenses'), watch('advanceParticipants'), setValue, type]);

  // Calculate internal training costs with separate tax calculations
  useEffect(() => {
    if (type === 'internal_training') {
      const instructorFee = Number(watch('instructorFee')) || 0;
      const roomFoodBeverage = Number(watch('roomFoodBeverage')) || 0;
      const otherExpenses = Number(watch('otherExpenses')) || 0;
      const totalParticipants = Number(watch('totalParticipants')) || 0;

      // Get manual withholding tax and VAT values
      const instructorWithholding = Number(watch('instructorFeeWithholding')) || 0;
      const roomWithholding = Number(watch('roomFoodBeverageWithholding')) || 0;
      const otherWithholding = Number(watch('otherExpensesWithholding')) || 0;

      const instructorVat = Number(watch('instructorFeeVat')) || 0;
      const roomVat = Number(watch('roomFoodBeverageVat')) || 0;
      const otherVat = Number(watch('otherExpensesVat')) || 0;

      // Calculate totals for each category
      const instructorTotal = instructorFee + instructorVat - instructorWithholding;
      const roomTotal = roomFoodBeverage + roomVat - roomWithholding;
      const otherTotal = otherExpenses + otherVat - otherWithholding;

      // Calculate grand totals
      const totalWithholding = instructorWithholding + roomWithholding + otherWithholding;
      const totalVat = instructorVat + roomVat + otherVat;
      const grandTotal = instructorTotal + roomTotal + otherTotal;
      const average = totalParticipants > 0 ? grandTotal / totalParticipants : 0;

      // Set individual total values
      setValue('instructorFeeTotal', Math.round(instructorTotal * 100) / 100);
      setValue('roomFoodBeverageTotal', Math.round(roomTotal * 100) / 100);
      setValue('otherExpensesTotal', Math.round(otherTotal * 100) / 100);

      // Set summary values
      setValue('withholdingTax', Math.round(totalWithholding * 100) / 100);
      setValue('vat', Math.round(totalVat * 100) / 100);
      setValue('totalAmount', Math.round(grandTotal * 100) / 100);
      setValue('amount', Math.round(grandTotal * 100) / 100);
      setValue('averageCostPerPerson', Math.round(average * 100) / 100);
      setValue('withholdingTaxAmount', Math.round(totalWithholding * 100) / 100);
    }
  }, [watch('instructorFee'), watch('roomFoodBeverage'), watch('otherExpenses'), watch('totalParticipants'), watch('instructorFeeWithholding'), watch('roomFoodBeverageWithholding'), watch('otherExpensesWithholding'), watch('instructorFeeVat'), watch('roomFoodBeverageVat'), watch('otherExpensesVat'), setValue, type]);

  // Function to generate and download CSV for internal training
  const downloadTrainingCSV = () => {
    if (type !== 'internal_training') return;

    const formData = watch();
    const participants = formData.participants || [];

    // Collect all selected participants
    const allParticipants: any[] = [];
    let participantNumber = 1;

    participants.forEach((group: any) => {
      if (group.selectedParticipants && group.selectedParticipants.length > 0) {
        group.selectedParticipants.forEach((participant: any) => {
          allParticipants.push({
            no: participantNumber++,
            name: participant.name || '',
            team: group.team || '',
            position: participant.position || '',
            signatureIn: '',
            signatureOut: ''
          });
        });
      }
    });

    // Format date and venue info
    const startDate = formData.startDate ? new Date(formData.startDate).toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';

    const endDate = formData.endDate ? new Date(formData.endDate).toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';

    const startTime = formData.startTime || '';
    const endTime = formData.endTime || '';
    const venue = formData.venue || '';

    // Create date and venue string
    let dateVenueInfo = '';
    if (startDate && endDate && startDate === endDate) {
      dateVenueInfo = `${startDate} เวลา ${startTime} - ${endTime} น. ณ ${venue}`;
    } else if (startDate && endDate) {
      dateVenueInfo = `${startDate} ถึง ${endDate} เวลา ${startTime} - ${endTime} น. ณ ${venue}`;
    } else if (startDate) {
      dateVenueInfo = `${startDate} เวลา ${startTime} - ${endTime} น. ณ ${venue}`;
    }

    // Create CSV content
    const csvContent = [
      // Header with course info
      ['แบบลงทะเบียนผู้เข้าอบรม'],
      [''],
      [formData.courseName || 'MBTI Training 2025'],
      [''],
      [dateVenueInfo],
      [''],
      ['วิทยากร', '', '', '', ''],
      [''],
      // Table headers
      ['No.', 'Name', 'Team', 'Position', 'Signature', ''],
      ['', '', '', '', 'รอบเข้า', 'รอบบ่าย'],
      // Participant data
      ...allParticipants.map(p => [
        p.no,
        p.name,
        p.team,
        p.position,
        p.signatureIn,
        p.signatureOut
      ])
    ];

    // Convert to CSV string
    const csvString = csvContent
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvString;

    // Create and download file
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${formData.courseName || 'internal_training'}_participants.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'ดาวน์โหลดสำเร็จ',
      description: 'ไฟล์ CSV รายชื่อผู้เข้าอบรมถูกดาวน์โหลดเรียบร้อยแล้ว',
    });
  };

  // ฟังก์ชันสำหรับอัพโหลดไฟล์ไปยัง Supabase Storage
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;

    if (!fileInput.files || fileInput.files.length === 0) return;

    try {
      const uploadPromises = Array.from(fileInput.files).map(async (file) => {
        // Create a unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${user?.id || 'anonymous'}/${fileName}`;

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('welfare-attachments')
          .upload(filePath, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('welfare-attachments')
          .getPublicUrl(data.path);

        return publicUrl;
      });

      // Wait for all uploads to complete
      const uploadedUrls = await Promise.all(uploadPromises);

      // Update files state with new URLs
      setFiles(prevFiles => [...prevFiles, ...uploadedUrls]);

      toast({
        title: "อัพโหลดสำเร็จ",
        description: `อัพโหลดไฟล์เรียบร้อยแล้ว`,
      });
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถอัปโหลดไฟล์ได้: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      // Reset the file input
      fileInput.value = '';
    }
  };

  // ฟังก์ชันสำหรับลบไฟล์ที่อัพโหลด
  const handleRemoveFile = async (index: number) => {
    try {
      // Get the file URL to remove
      const fileUrl = files[index];

      // Extract the file path from the URL
      const filePath = fileUrl.split('/').slice(-2).join('/');

      // Delete the file from Supabase Storage
      const { error } = await supabase.storage
        .from('welfare-attachments')
        .remove([filePath]);

      if (error) throw error;

      // Update the files state
      setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));

      toast({
        title: "ลบไฟล์สำเร็จ",
        description: "ลบไฟล์เรียบร้อยแล้ว",
      });
    } catch (error: any) {
      console.error('Error removing file:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถลบไฟล์ได้: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Get remaining budget from getBenefitLimits API to ensure consistency
  const [currentRemainingBudget, setCurrentRemainingBudget] = useState<number>(0);

  // Recalculate training amounts when remaining budget updates
  useEffect(() => {
    if (type === 'training') {
      const amount = Number(watch('amount')) || 0;
      const vatAmount = Number(watch('tax7Percent')) || 0;
      const withholdingAmount = Number(watch('withholdingTax3Percent')) || 0;
      calculateTrainingAmounts(amount, Number(currentRemainingBudget) || 0, vatAmount, withholdingAmount);
    }
  }, [currentRemainingBudget, type]);


  // Fetch remaining budget from getBenefitLimits API
  useEffect(() => {
    const fetchRemainingBudget = async () => {
      if (!user) return;

      try {
        const { getBenefitLimits } = await import('@/services/welfareApi');
        const limits = await getBenefitLimits();

        // สำหรับ glasses และ dental ใช้ budget_dentalglasses ร่วมกัน
        if (type === 'glasses' || type === 'dental') {
          const dentalLimit = limits.find(limit => limit.type === 'dental');
          setCurrentRemainingBudget(dentalLimit ? dentalLimit.remaining : (profile?.budget_dentalglasses ?? 0));
        } else {
          const limit = limits.find(limit => limit.type === type);
          setCurrentRemainingBudget(limit ? limit.remaining : 0);
        }
      } catch (error) {
        console.error('Error fetching remaining budget:', error);
        // Fallback to context method
        if (type === 'glasses' || type === 'dental') {
          setCurrentRemainingBudget(profile?.budget_dentalglasses ?? 0);
        } else if (user?.id) {
          setCurrentRemainingBudget(getRemainingBudget(user.id, type));
        }
      }
    };

    fetchRemainingBudget();
  }, [user, type, profile?.budget_dentalglasses, getRemainingBudget]);

  const remainingBudget = currentRemainingBudget;

  const onSubmit = async (data: any) => {
    // Store form data and show signature modal for all types (including training)
    // Make sure we have employeeData before showing signature modal
    if (!employeeData) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่พบข้อมูลพนักงาน กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
      return;
    }

    // Check training eligibility before submission
    if (type === 'training' && !checkTrainingEligibility(employeeData)) {
      toast({
        title: 'ไม่สามารถส่งคำร้องได้',
        description: workDaysError,
        variant: 'destructive',
      });
      return;
    }

    setPendingFormData({ data, employeeData });
    setShowSignatureModal(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First, fetch the employee data to get the correct department and name
      const { data: employeeData, error: employeeError } = await supabase
        .from('Employee')
        .select('id, Name, Position, Team, start_date')
        .eq('email_user', user.email)
        .single();

      console.log('employeeData:', employeeData);
      if (employeeError || !employeeData) {
        throw new Error('Employee data not found. Please contact support.');
      }

      // For training type, submit directly without PDF generation
      if (type === 'training') {
        await processFormSubmission(data, employeeData);
        return;
      }

      // Store form data and employee data for later use
      setPendingFormData({ data, employeeData });

      // Show signature modal for wedding type
      if (type === 'wedding') {
        setShowSignatureModal(true);
        setIsSubmitting(false);
        return;
      }

      if (editIdNum) {
        // ตรวจสอบสถานะคำร้องก่อนอนุญาตให้แก้ไข
        const { data: currentRequest, error: fetchError } = await supabase
          .from('welfare_requests')
          .select('status')
          .eq('id', editIdNum)
          .single();
        if (fetchError || !currentRequest) {
          throw new Error('ไม่พบข้อมูลคำร้อง หรือเกิดข้อผิดพลาดในการตรวจสอบสถานะ');
        }
        if (currentRequest.status && currentRequest.status.toLowerCase() === 'approved') {
          toast({
            title: 'ไม่สามารถแก้ไขได้',
            description: 'คำร้องนี้ได้รับการอนุมัติแล้ว ไม่สามารถแก้ไขได้',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
        // UPDATE EXISTING REQUEST
        const updateData: any = {
          amount: Number(data.netAmount || data.amount || 0), // Net amount ยังคง map ไป column เดิม
          details: data.details || '',
          title: data.title || '',
          attachment_url: JSON.stringify(files),
          updated_at: new Date().toISOString(),
          start_date: data.startDate,
          end_date: data.endDate,
          total_days: data.totalDays,
          birth_type: data.birthType,
          funeral_type: data.funeralType,
          training_topics: data.trainingTopics ? JSON.stringify(data.trainingTopics) : null,
          total_amount: data.totalAmount,
          tax7_percent: data.tax7Percent,
          withholding_tax3_percent: data.withholdingTax3Percent,
          net_amount: data.netAmount,
          excess_amount: data.excessAmount,
          company_payment: data.companyPayment,
          employee_payment: data.employeePayment,
          course_name: data.courseName,
          organizer: data.organizer,
          is_vat_included: data.isVatIncluded,
          department_request: (employeeData as any)?.Team,
          // Internal Training detailed tax fields
          instructor_fee: data.instructorFee,
          instructor_fee_withholding: data.instructorFeeWithholding,
          instructor_fee_vat: data.instructorFeeVat,
          instructor_fee_total: data.instructorFeeTotal,
          room_food_beverage: data.roomFoodBeverage,
          room_food_beverage_withholding: data.roomFoodBeverageWithholding,
          room_food_beverage_vat: data.roomFoodBeverageVat,
          room_food_beverage_total: data.roomFoodBeverageTotal,
          other_expenses: data.otherExpenses,
          other_expenses_withholding: data.otherExpensesWithholding,
          other_expenses_vat: data.otherExpensesVat,
          other_expenses_total: data.otherExpensesTotal,
          withholding_tax: data.withholdingTax,
          vat: data.vat,
          // Advance fields
          advance_department: data.advanceDepartment,
          advance_district: data.advanceDistrict,
          advance_activity_type: data.advanceActivityType,
          advance_activity_other: data.advanceActivityOther,
          advance_shop_company: data.advanceShopCompany,
          advance_amphur: data.advanceAmphur,
          advance_province: data.advanceProvince,
          advance_event_date: data.advanceEventDate,
          advance_participants: data.advanceParticipants,
          advance_daily_rate: data.advanceDailyRate,
          advance_accommodation_cost: data.advanceAccommodationCost,
          advance_transportation_cost: data.advanceTransportationCost,
          advance_meal_allowance: data.advanceMealAllowance,
          advance_other_expenses: data.advanceOtherExpenses,
          advance_project_name: data.advanceProjectName,
          advance_project_location: data.advanceProjectLocation,
        };

        console.log('UPDATE MODE: updateData', updateData, 'editIdNum', editIdNum);

        const { error: updateError } = await supabase
          .from('welfare_requests')
          .update(updateData)
          .eq('id', editIdNum);

        if (updateError) {
          console.error('Supabase updateError:', updateError);
          throw new Error('ไม่สามารถแก้ไขคำร้องได้ กรุณาลองใหม่');
        }

        await refreshRequests();

        toast({
          title: 'แก้ไขคำร้องสำเร็จ',
          description: 'ข้อมูลคำร้องได้รับการแก้ไขเรียบร้อยแล้ว',
        });
        setTimeout(onBack, 2000);
        return;
      }

      // For wedding and advance types, show signature modal before submitting
      if (['wedding', 'advance'].includes(type)) {
        // Store form data temporarily
        setPendingFormData({ data, employeeData });
        setShowSignatureModal(true);
        setIsSubmitting(false);
        return;
      }

      // For non-wedding types, proceed with normal submission
      await processFormSubmission(data, employeeData);

    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถส่งคำร้องได้ กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle signature confirmation
  const handleSignatureConfirm = async (signatureData: string) => {
    setUserSignature(signatureData);

    if (pendingFormData) {
      try {
        setIsSubmitting(true);
        await processFormSubmission(pendingFormData.data, pendingFormData.employeeData, signatureData);
      } catch (error: any) {
        console.error('Error submitting form after signature:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: error.message || 'ไม่สามารถส่งคำร้องได้ กรุณาลองใหม่อีกครั้ง',
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
        setPendingFormData(null);
      }
    }
  };



  // Process form submission with PDF (for all types including training)
  const processFormSubmission = async (data: any, employeeData: any, signature?: string) => {
    // If employeeData is not provided, fetch it
    let finalEmployeeData = employeeData;
    if (!finalEmployeeData) {
      try {
        const { data: fetchedEmployeeData, error } = await supabase
          .from('Employee')
          .select('id, Name, Position, Team, start_date')
          .eq('email_user', user!.email)
          .single();

        if (!error && fetchedEmployeeData) {
          finalEmployeeData = fetchedEmployeeData;
        } else {
          throw new Error('ไม่พบข้อมูลพนักงาน');
        }
      } catch (error) {
        throw new Error('ไม่สามารถดึงข้อมูลพนักงานได้');
      }
    }

    // Handle Internal Training differently
    if (type === 'internal_training') {
      const internalTrainingData = {
        employee_id: finalEmployeeData.id,
        employee_name: finalEmployeeData.Name || user.email || 'Unknown User',
        request_type: 'internal_training',
        status: 'pending_manager',
        title: data.courseName || '',
        details: data.additionalNotes || data.details || '',
        amount: Number(data.totalAmount || data.amount || 0),
        department_request: finalEmployeeData.Team || 'Unknown Department',
        department: data.department || finalEmployeeData.Team || 'Unknown Department',
        branch: data.branch || null,
        course_name: data.courseName || '',
        start_date: data.startDate || null,
        end_date: data.endDate || null,
        start_time: data.startTime || null,
        end_time: data.endTime || null,
        total_hours: Number(data.totalHours || 0),
        venue: data.venue || null,
        participants: data.participants ? JSON.stringify(data.participants) : null,
        total_participants: Number(data.totalParticipants || 0),
        instructor_fee: Number(data.instructorFee || 0),
        instructor_fee_withholding: Number(data.instructorFeeWithholding || 0),
        instructor_fee_vat: Number(data.instructorFeeVat || 0),
        instructor_fee_total: Number(data.instructorFeeTotal || 0),
        room_food_beverage: Number(data.roomFoodBeverage || 0),
        room_food_beverage_withholding: Number(data.roomFoodBeverageWithholding || 0),
        room_food_beverage_vat: Number(data.roomFoodBeverageVat || 0),
        room_food_beverage_total: Number(data.roomFoodBeverageTotal || 0),
        other_expenses: Number(data.otherExpenses || 0),
        other_expenses_withholding: Number(data.otherExpensesWithholding || 0),
        other_expenses_vat: Number(data.otherExpensesVat || 0),
        other_expenses_total: Number(data.otherExpensesTotal || 0),
        withholding_tax: Number(data.withholdingTax || 0),
        vat: Number(data.vat || 0),
        total_amount: Number(data.totalAmount || 0),
        average_cost_per_person: Number(data.averageCostPerPerson || 0),
        tax_certificate_name: data.taxCertificateName || null,
        withholding_tax_amount: Number(data.withholdingTaxAmount || 0),
        additional_notes: data.additionalNotes || null,
        is_vat_included: Boolean(data.isVatIncluded),
        userSignature: signature || userSignature, // Add user signature
        user_signature: signature || userSignature, // Add alternative field name
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_name: finalEmployeeData.Name || user.email || 'Unknown User'
      };

      const result = await submitInternalTrainingRequest(internalTrainingData);
      if (!result) {
        throw new Error('Failed to submit internal training request');
      }

      // Generate PDF and upload to Supabase
      try {
        const { generateInternalTrainingPDF } = await import('../pdf/InternalTrainingPDFGenerator');
        const blob = await generateInternalTrainingPDF(
          {
            ...internalTrainingData,
            id: result.id || Date.now(),
            status: 'pending_manager' as const,
            created_at: internalTrainingData.created_at,
            updated_at: internalTrainingData.updated_at,
            userSignature: signature || userSignature, // Add user signature
            user_signature: signature || userSignature // Add alternative field name
          } as any,
          user as any,
          finalEmployeeData,
          undefined, // managerSignature
          undefined, // hrSignature
          signature || userSignature // userSignature
        );

        // Create safe filename
        const employeeId = finalEmployeeData?.employee_id || user?.id?.slice(-8) || 'user';
        const timestamp = Date.now();
        const filename = `internal_training_emp${employeeId}_${timestamp}.pdf`;
        const pdfUrl = await uploadPDFToSupabase(blob, filename, user?.id);

        // Update the request with the PDF URL
        if (result.id && pdfUrl) {
          await supabase.from('welfare_requests').update({ pdf_url: pdfUrl }).eq('id', result.id);
        }

        toast({
          title: 'ส่งคำร้องและอัปโหลด PDF สำเร็จ',
          description: 'คำร้องการอบรมภายในของคุณถูกส่งเรียบร้อยแล้ว และ PDF ได้ถูกบันทึกในระบบแล้ว',
        });
      } catch (pdfError) {
        console.error('PDF generation/upload error:', pdfError);
        toast({
          title: 'ส่งคำร้องสำเร็จ',
          description: 'คำร้องของคุณถูกส่งเรียบร้อยแล้ว แต่ไม่สามารถสร้าง/อัปโหลด PDF ได้ในขณะนี้',
        });
      }

      await refreshInternalTrainingRequests();
      
      toast({
        title: 'ส่งคำร้องสำเร็จ',
        description: 'คำร้องการอบรมภายในของคุณถูกส่งเรียบร้อยแล้ว และอยู่ในระหว่างการพิจารณา',
      });

      reset();
      setFiles([]);
      setTimeout(onBack, 2000);
      return result;
    }

    // CREATE NEW REQUEST (for other welfare types)
    const requestData = {
      userId: profile.employee_id.toString(),
      userName: finalEmployeeData?.Name || user?.email || 'Unknown User',
      userDepartment: finalEmployeeData?.Team || 'Unknown Department',
      department_request: finalEmployeeData?.Team || 'Unknown Department',
      type: type,
      status: 'pending' as const,
      amount: Number(data.netAmount || data.amount || 0),
      date: data.startDate || new Date().toISOString(),
      details: data.details || '',
      attachments: files,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      managerId: finalEmployeeData?.Position,
      start_date: data.startDate,
      end_date: data.endDate,
      total_days: data.totalDays,
      birth_type: data.birthType,
      funeral_type: data.funeralType,
      training_topics: data.trainingTopics ? JSON.stringify(data.trainingTopics) : null,
      total_amount: data.totalAmount,
      tax7_percent: data.tax7Percent,
      withholding_tax3_percent: data.withholdingTax3Percent,
      net_amount: data.netAmount,
      excess_amount: data.excessAmount,
      company_payment: data.companyPayment,
      employee_payment: data.employeePayment,
      course_name: data.courseName,
      organizer: data.organizer,
      is_vat_included: data.isVatIncluded,
      userSignature: signature || userSignature, // เพิ่มลายเซ็น
      // Advance fields for requestData
      advanceDepartment: data.advanceDepartment,
      advanceDistrict: data.advanceDistrict,
      advanceActivityType: data.advanceActivityType,
      advanceActivityOther: data.advanceActivityOther,
      advanceShopCompany: data.advanceShopCompany,
      advanceAmphur: data.advanceAmphur,
      advanceProvince: data.advanceProvince,
      advanceEventDate: data.advanceEventDate,
      advanceParticipants: data.advanceParticipants,
      advanceDailyRate: data.advanceDailyRate,
      advanceAccommodationCost: data.advanceAccommodationCost,
      advanceTransportationCost: data.advanceTransportationCost,
      advanceMealAllowance: data.advanceMealAllowance,
      advanceOtherExpenses: data.advanceOtherExpenses,
      advanceProjectName: data.advanceProjectName,
      advanceProjectLocation: data.advanceProjectLocation,
    };

    const result = await submitRequest(requestData);
    if (!result) {
      throw new Error('Failed to submit request');
    }

    await refreshRequests();
    // Generate PDF and upload to Supabase
    try {
      let blob: Blob;

      if (type === 'training') {
        // Use Training PDF Generator for training type
        blob = await generateTrainingPDF(
          {
            ...requestData,
            id: result.id || Date.now(),
            status: 'pending_manager' as const,
            createdAt: requestData.createdAt,
            updatedAt: requestData.updatedAt,
            userSignature: signature || userSignature
          },
          user as any,
          finalEmployeeData,
          signature || userSignature,
          remainingBudget
        );
      } else if (type === 'advance') {
        // Use Advance PDF Generator for advance type
        blob = await generateAdvancePDF(
          {
            ...requestData,
            id: result.id || Date.now(),
            status: 'pending_manager' as const,
            createdAt: requestData.createdAt,
            updatedAt: requestData.updatedAt,
            userSignature: signature || userSignature
          },
          user as any,
          finalEmployeeData,
          signature || userSignature
        );
      } else {
        // Use Welfare PDF Generator for other types
        blob = await generateWelfarePDF(
          {
            ...requestData,
            id: result.id || Date.now(),
            status: 'pending_manager' as const,
            createdAt: requestData.createdAt,
            updatedAt: requestData.updatedAt,
            userSignature: signature || userSignature
          },
          user as any,
          finalEmployeeData
        );
      }
      // สร้างชื่อไฟล์ที่ปลอดภัยโดยใช้ employee_id หรือ timestamp แทนชื่อไทย
      const employeeId = finalEmployeeData?.employee_id || user?.id?.slice(-8) || 'user';
      const timestamp = Date.now();
      const filename = `welfare_${requestData.type}_emp${employeeId}_${timestamp}.pdf`;
      const pdfUrl = await uploadPDFToSupabase(blob, filename, user?.id);
      // Update the request with the PDF URL
      if (result.id && pdfUrl) {
        await supabase.from('welfare_requests').update({ pdf_url: pdfUrl }).eq('id', result.id);
      }
      toast({
        title: 'ส่งคำร้องและอัปโหลด PDF สำเร็จ',
        description: 'คำร้องของคุณถูกส่งเรียบร้อยแล้ว และ PDF ได้ถูกบันทึกในระบบแล้ว',
      });
    } catch (pdfError) {
      console.error('PDF generation/upload error:', pdfError);
      toast({
        title: 'ส่งคำร้องสำเร็จ',
        description: 'คำร้องของคุณถูกส่งเรียบร้อยแล้ว แต่ไม่สามารถสร้าง/อัปโหลด PDF ได้ในขณะนี้',
      });
    }

    toast({
      title: 'ส่งคำร้องสำเร็จ',
      description: 'คำร้องของคุณถูกส่งเรียบร้อยแล้ว และอยู่ในระหว่างการพิจารณา',
    });


    reset();
    setFiles([]);
    setUserSignature('');
    setTimeout(onBack, 2000);
  };



  // 3. อัปเดตฟังก์ชัน calculateTrainingAmounts
  const calculateTrainingAmounts = (total: number, remainingBudget: number, customVat?: number, customWithholding?: number) => {
    // ตรวจสอบค่าที่ส่งเข้ามา
    if (typeof total !== 'number' || isNaN(total) || total < 0) return;
    if (typeof remainingBudget !== 'number' || isNaN(remainingBudget)) remainingBudget = 0;

    // ใช้ค่าที่ผู้ใช้กรอกโดยตรง หรือ 0 ถ้าไม่ได้กรอก
    const vat = customVat !== undefined && !isNaN(customVat) ? customVat : 0;
    const withholding = customWithholding !== undefined && !isNaN(customWithholding) ? customWithholding : 0;

    const grossAmount = total + vat;
    const remainingNum = Number(remainingBudget) || 0;

    let netNum = 0;
    let excessAmountValue = 0;
    let companyPaymentValue = 0;
    let employeePaymentValue = 0;

    if (grossAmount > remainingNum) {
      // --- กรณีเกินงบประมาณ ---
      excessAmountValue = grossAmount - remainingNum;
      netNum = grossAmount - withholding; // แก้ไข: ลบภาษี ณ ที่จ่าย

      companyPaymentValue = excessAmountValue / 2;
      employeePaymentValue = (excessAmountValue / 2) + withholding; // พนักงานต้องจ่ายส่วนเกิน + ภาษี ณ ที่จ่าย

    } else {
      // --- กรณีไม่เกินงบประมาณ ---
      netNum = grossAmount - withholding; // แก้ไข: ลบภาษี ณ ที่จ่าย
      excessAmountValue = 0;
      companyPaymentValue = 0;
      employeePaymentValue = withholding; // พนักงานจ่ายเฉพาะภาษี ณ ที่จ่าย
    }

    // --- อัปเดตค่าทั้งหมดไปยังฟอร์ม ---
    setValue('totalAmount', parseFloat((total || 0).toFixed(2)));
    setValue('netAmount', parseFloat((netNum || 0).toFixed(2)));
    setValue('excessAmount', parseFloat((excessAmountValue || 0).toFixed(2))); // ตั้งค่า Field ใหม่
    setValue('companyPayment', parseFloat((companyPaymentValue || 0).toFixed(2)));
    setValue('employeePayment', parseFloat((employeePaymentValue || 0).toFixed(2)));
  };

  // ฟังก์ชันคำนวณสำหรับ welfare types อื่น ๆ (ไม่ใช่ training)
  const calculateNonTrainingAmounts = (total: number, customVat?: number, customWithholding?: number) => {
    // ตรวจสอบค่าที่ส่งเข้ามา
    if (typeof total !== 'number' || isNaN(total) || total < 0) return;

    // ใช้ค่าที่ผู้ใช้กรอกโดยตรง หรือ 0 ถ้าไม่ได้กรอก
    const vat = customVat !== undefined && !isNaN(customVat) ? customVat : 0;
    const withholding = customWithholding !== undefined && !isNaN(customWithholding) ? customWithholding : 0;

    const netAmount = total + vat - withholding;

    // อัปเดตค่าทั้งหมดไปยังฟอร์ม
    setValue('totalAmount', parseFloat((total || 0).toFixed(2)));
    setValue('netAmount', parseFloat((netAmount || 0).toFixed(2)));
  };

  // Add function to calculate total days
  const calculateTotalDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    return totalDays;
  };

  // Add document types for welfare types except training, internal training, and advance
  const DOCUMENT_TYPES = [
    'ใบเสร็จรับเงิน',
    'สำเนาสูติบัตรบุตร',
    'ใบรับรองแพทย์',
    'สำเนาบัตรประชาชน',
    'สำเนาใบมรณะบัตร',
    'สำเนาทะเบียนสมรส',
    'สำเนาบัญชีธนาคาร',
    'การ์ดแต่งงาน',
    'อื่นๆ'
  ];

  // Check if document upload is required for the current welfare type
  const isDocumentUploadRequired = !['training', 'internal_training', 'advance'].includes(type);

  return (
    <div className="animate-fade-in">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={onBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        กลับ
      </Button>

      <div id="welfare-form-content" className="form-container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{getFormTitle(type)}</h1>
        </div>

        {/* Display welfare limits for non-training types */}
        {maxAmount !== null && type !== 'training' && type !== 'internal_training' && type !== 'advance' && (
          <div className="mb-6">
            <Alert>
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                {type === 'childbirth' ? (
                  <>คลอดธรรมชาติ 4,000 บาท, ผ่าคลอด 6,000 บาท</>
                ) : (
                  <>วงเงินสูงสุด: {isMonthly ? `${maxAmount} บาท/เดือน` : `${maxAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท/ปี`}</>
                )}
                {condition && <> ({condition})</>}
              </AlertDescription>
            </Alert>
          </div>
        )}
        {user && type !== 'training' && type !== 'internal_training' && type !== 'advance' && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700">
              งบประมาณคงเหลือสำหรับสวัสดิการนี้: <span className="font-bold text-welfare-blue">{remainingBudget.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
            </p>
          </div>
        )}
        {type === 'training' && (
          <div className="space-y-4 mb-6">
            <Alert>
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                วงเงินสูงสุด: {maxAmount?.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} บาท
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                งบประมาณคงเหลือ: {remainingBudget?.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} บาท
              </AlertDescription>
            </Alert>
            {workDaysError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  {workDaysError}
                </AlertDescription>
              </Alert>
            )}
            {employeeData?.start_date && !workDaysError && (
              <Alert>
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  อายุงาน: {calculateWorkDays(employeeData.start_date)} วัน (เข้าทำงานวันที่ {new Date(employeeData.start_date).toLocaleDateString('th-TH')})
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Special info for advance payment */}
        {type === 'advance' && (
          <div className="mb-6">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>เบิกเงินทดลอง:</strong> สามารถขออนุมัติได้ตลอดเวลา ไม่มีข้อจำกัดเรื่องวงเงินหรืองบประมาณ ระบบจะคำนวณจำนวนเงินให้อัตโนมัติตามรายละเอียดที่กรอก
              </AlertDescription>
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Training specific fields */}
          {type === 'training' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="form-label">หลักสูตร</label>
                  <Input
                    placeholder="ระบุชื่อหลักสูตร"
                    className="form-input"
                    {...register('courseName', {
                      required: 'กรุณาระบุชื่อหลักสูตร'
                    })}
                  />
                  {errors.courseName && (
                    <p className="text-red-500 text-sm mt-1">{errors.courseName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="form-label">จัดขึ้นโดย</label>
                  <Input
                    placeholder="ระบุชื่อผู้จัด"
                    className="form-input"
                    {...register('organizer', {
                      required: 'กรุณาระบุผู้จัด'
                    })}
                  />
                  {errors.organizer && (
                    <p className="text-red-500 text-sm mt-1">{errors.organizer.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="form-label">ตั้งแต่วันที่</label>
                  <Input
                    type="date"
                    className="form-input"
                    {...register('startDate', {
                      required: 'กรุณาระบุวันที่เริ่ม',
                      onChange: (e) => {
                        const endDate = watch('endDate');
                        if (endDate && e.target.value > endDate) {
                          setValue('endDate', e.target.value);
                        }
                      }
                    })}
                  />
                  {errors.startDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="form-label">ถึงวันที่</label>
                  <Input
                    type="date"
                    className="form-input"
                    {...register('endDate', {
                      required: 'กรุณาระบุวันที่สิ้นสุด',
                      validate: value => {
                        const startDate = watch('startDate');
                        return !value || !startDate || value >= startDate || 'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่ม';
                      }
                    })}
                  />
                  {errors.endDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="form-label">รวมเป็นจำนวน</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="form-input"
                      readOnly
                      {...register('totalDays')}
                    />
                    <span className="text-sm">วัน</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="form-label">โดยมีวัตถุประสงค์ที่ขอเข้าอบรม ดังนี้</label>
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Input
                        {...register(`trainingTopics.${index}.value` as const)}
                        placeholder={`วัตถุประสงค์ที่ ${index + 1}`}
                        className="form-input"
                      />
                      {fields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {fields.length < 5 && (
                    <Button
                      type="button"
                      onClick={() => append({ value: '' })}
                      className="mt-2"
                      variant="outline"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      เพิ่มวัตถุประสงค์
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="amount" className="form-label">จำนวนเงิน</label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="ระบุจำนวนเงิน"
                  {...register('amount', {
                    required: 'กรุณาระบุจำนวนเงิน',
                    min: {
                      value: 1,
                      message: 'จำนวนเงินต้องมากกว่า 0'
                    },
                    max: {
                      value: maxAmount || 100000,
                      message: `จำนวนเงินต้องไม่เกิน ${maxAmount} บาท`
                    },
                    onChange: (e) => {
                      const amount = Number(e.target.value);
                      const vatAmount = Number(watch('tax7Percent')) || 0;
                      const withholdingAmount = Number(watch('withholdingTax3Percent')) || 0;
                      calculateTrainingAmounts(amount, remainingBudget, vatAmount, withholdingAmount);
                    }
                  })}
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>



              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="form-label">ภาษีมูลค่าเพิ่ม (7%)</label>
                  <Input
                    type="number"
                    className="form-input"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    defaultValue="0"
                    {...register('tax7Percent', {
                      min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' },
                      onChange: (e) => {
                        const amount = watch('amount');
                        const vatAmount = Number(e.target.value) || 0;
                        const withholdingAmount = Number(watch('withholdingTax3Percent')) || 0;
                        if (amount) {
                          calculateTrainingAmounts(Number(amount), remainingBudget, vatAmount, withholdingAmount);
                        }
                      }
                    })}
                  />
                  {errors.tax7Percent && (
                    <p className="text-red-500 text-sm mt-1">{errors.tax7Percent.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="form-label">หักภาษี ณ ที่จ่าย (3%)</label>
                  <Input
                    type="number"
                    className="form-input"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    defaultValue="0"
                    {...register('withholdingTax3Percent', {
                      min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' },
                      onChange: (e) => {
                        const amount = watch('amount');
                        const withholdingAmount = Number(e.target.value) || 0;
                        const vatAmount = Number(watch('tax7Percent')) || 0;
                        if (amount) {
                          calculateTrainingAmounts(Number(amount), remainingBudget, vatAmount, withholdingAmount);
                        }
                      }
                    })}
                  />
                  {errors.withholdingTax3Percent && (
                    <p className="text-red-500 text-sm mt-1">{errors.withholdingTax3Percent.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="form-label">จำนวนเงินสุทธิ</label>
                  <Input
                    type="number"
                    step="0.01"
                    className="form-input bg-gray-100"
                    readOnly
                    value={watch('netAmount') ? Number(watch('netAmount')).toFixed(2) : ''}
                    {...register('netAmount')}
                  />
                </div>
              </div>

              {/* 2. เพิ่ม Field 'ยอดส่วนเกินทั้งหมด' ในหน้าฟอร์ม (JSX) */}
              <div className="space-y-2">
                <label className="form-label">ยอดส่วนเกินทั้งหมด</label>
                <Input
                  type="number"
                  step="0.01"
                  className="form-input bg-gray-100"
                  readOnly
                  value={watch('excessAmount') ? Number(watch('excessAmount')).toFixed(2) : ''}
                  {...register('excessAmount')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="form-label">บริษัทจ่าย</label>
                  <Input
                    type="number"
                    step="0.01"
                    className="form-input bg-gray-100"
                    readOnly
                    value={watch('companyPayment') ? Number(watch('companyPayment')).toFixed(2) : ''}
                    {...register('companyPayment')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="form-label">พนักงานจ่าย</label>
                  <Input
                    type="number"
                    step="0.01"
                    className="form-input bg-gray-100"
                    readOnly
                    value={watch('employeePayment') ? Number(watch('employeePayment')).toFixed(2) : ''}
                    {...register('employeePayment')}
                  />
                </div>
              </div>
            </>
          )}

          {/* Funeral specific fields */}
          {type === 'funeral' && (
            <div className="space-y-2">
              <label className="form-label">ประเภทสวัสดิการงานศพ</label>
              <Select
                onValueChange={(value) => setValue('funeralType', value as 'employee_spouse' | 'child' | 'parent')}
                defaultValue={watch('funeralType')}
                {...register('funeralType', {
                  required: type === 'funeral' ? 'กรุณาเลือกประเภทสวัสดิการงานศพ' : false
                })}
              >
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="เลือกประเภทสวัสดิการงานศพ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee_spouse">สวัสดิการงานศพ พนักงาน/สามีหรือภรรยาของพนักงาน</SelectItem>
                  <SelectItem value="child">สวัสดิการงานศพ บุตร ของพนักงาน</SelectItem>
                  <SelectItem value="parent">สวัสดิการงานศพ บิดา/มารดา ของพนักงาน</SelectItem>
                </SelectContent>
              </Select>
              {errors.funeralType && (
                <p className="text-red-500 text-sm mt-1">{errors.funeralType.message}</p>
              )}
            </div>
          )}

          {/* Internal Training specific fields */}
          {type === 'internal_training' && (
            <>
              {/* ส่วนที่ 1: รายละเอียดการอบรม */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">รายละเอียดการอบรม</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="form-label">ฝ่าย/แผนกผู้ขออนุมัติ</label>
                    <Select
                      onValueChange={(value) => setValue('department', value)}
                      defaultValue={watch('department')}
                    >
                      <SelectTrigger className="form-input">
                        <SelectValue placeholder="เลือกฝ่าย/แผนก" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="form-label">สาขา</label>
                    <Select
                      onValueChange={(value) => setValue('branch', value)}
                      defaultValue={watch('branch')}
                    >
                      <SelectTrigger className="form-input">
                        <SelectValue placeholder="เลือกสาขา" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANCHES.map((branch) => (
                          <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="form-label">ชื่อหลักสูตร/หัวข้ออบรม</label>
                  <Input
                    placeholder="ระบุชื่อหลักสูตรหรือหัวข้ออบรม"
                    className="form-input"
                    {...register('courseName', {
                      required: 'กรุณาระบุชื่อหลักสูตรหรือหัวข้ออบรม'
                    })}
                  />
                  {errors.courseName && (
                    <p className="text-red-500 text-sm mt-1">{errors.courseName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="form-label">วันที่เริ่มอบรม</label>
                    <Input
                      type="date"
                      className="form-input"
                      {...register('startDate', {
                        required: 'กรุณาระบุวันที่เริ่มอบรม'
                      })}
                    />
                    {errors.startDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="form-label">วันที่สิ้นสุดอบรม</label>
                    <Input
                      type="date"
                      className="form-input"
                      {...register('endDate', {
                        required: 'กรุณาระบุวันที่สิ้นสุดอบรม',
                        validate: value => {
                          const startDate = watch('startDate');
                          return !value || !startDate || value >= startDate || 'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่ม';
                        }
                      })}
                    />
                    {errors.endDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="form-label">เวลาเริ่ม</label>
                    <Input
                      type="time"
                      className="form-input"
                      {...register('startTime', {
                        required: 'กรุณาระบุเวลาเริ่ม'
                      })}
                    />
                    {errors.startTime && (
                      <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="form-label">เวลาสิ้นสุด</label>
                    <Input
                      type="time"
                      className="form-input"
                      {...register('endTime', {
                        required: 'กรุณาระบุเวลาสิ้นสุด'
                      })}
                    />
                    {errors.endTime && (
                      <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="form-label">รวมระยะเวลาการอบรม (ชั่วโมง)</label>
                    <Input
                      type="number"
                      step="0.01"
                      className="form-input bg-gray-100"
                      readOnly
                      value={watch('totalHours') ? Number(watch('totalHours')).toFixed(2) : ''}
                      {...register('totalHours')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="form-label">สถานที่ฝึกอบรม</label>
                  <Input
                    placeholder="ระบุสถานที่ฝึกอบรม"
                    className="form-input"
                    {...register('venue', {
                      required: 'กรุณาระบุสถานที่ฝึกอบรม'
                    })}
                  />
                  {errors.venue && (
                    <p className="text-red-500 text-sm mt-1">{errors.venue.message}</p>
                  )}
                </div>
              </div>

              {/* ส่วนที่ 2: จำนวนผู้เข้าร่วมอบรม */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">จำนวนผู้เข้าร่วมอบรม</h3>

                <div className="space-y-4">
                  <label className="form-label">เลือกทีมและผู้เข้าร่วมอบรม</label>
                  <div className="space-y-6">
                    {participantFields.map((field, index) => {
                      const currentParticipant = watch(`participants.${index}`);
                      return (
                        <div key={field.id} className="space-y-4 border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">ทีมที่ {index + 1}</span>
                            {participantFields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeParticipant(index)}
                              >
                                <X className="h-4 w-4" />
                                ลบทีม
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-gray-600 mb-1 block">เลือกทีม:</label>
                              <Select
                                onValueChange={(value) => {
                                  setValue(`participants.${index}.team`, value);
                                  // Reset selected participants when team changes
                                  setValue(`participants.${index}.selectedParticipants`, []);
                                }}
                                value={currentParticipant?.team || ''}
                              >
                                <SelectTrigger className="form-input">
                                  <SelectValue placeholder="เลือกทีม" />
                                </SelectTrigger>
                                <SelectContent>
                                  {TEAMS.map((team) => (
                                    <SelectItem key={team} value={team}>{team}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="text-sm text-gray-600 mb-1 block">จำนวนผู้เข้าร่วม:</label>
                              <Input
                                type="number"
                                min="0"
                                max="50"
                                className="form-input"
                                placeholder="0"
                                {...register(`participants.${index}.count` as const, {
                                  min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' },
                                  max: { value: 50, message: 'จำนวนต้องไม่เกิน 50 คน' },
                                  valueAsNumber: true,
                                  onChange: () => {
                                    // Reset selected participants if count is reduced
                                    const currentCount = Number(watch(`participants.${index}.count`)) || 0;
                                    const currentSelected = watch(`participants.${index}.selectedParticipants`) || [];
                                    if (currentSelected.length > currentCount) {
                                      setValue(`participants.${index}.selectedParticipants`, currentSelected.slice(0, currentCount));
                                    }

                                    // Trigger total recalculation
                                    setTimeout(() => {
                                      const participants = watch('participants') || [];
                                      const total = participants.reduce((sum, p) => sum + (Number(p?.count) || 0), 0);
                                      setValue('totalParticipants', total);
                                    }, 0);
                                  }
                                })}
                              />
                            </div>
                          </div>

                          {/* Participant Selector */}
                          {currentParticipant?.team && currentParticipant?.count > 0 && (
                            <ParticipantSelector
                              team={currentParticipant.team}
                              maxCount={currentParticipant.count}
                              selectedParticipants={currentParticipant.selectedParticipants || []}
                              onParticipantsChange={(participants) => {
                                setValue(`participants.${index}.selectedParticipants`, participants);
                              }}
                            />
                          )}
                        </div>
                      );
                    })}

                    <Button
                      type="button"
                      onClick={() => appendParticipant({ team: '', count: 0, selectedParticipants: [] })}
                      className="mt-2"
                      variant="outline"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      เพิ่มทีม
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="form-label font-semibold">รวมจำนวนผู้เข้าอบรมทั้งหมด</label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      className="form-input bg-gray-100 font-bold text-lg text-center w-[151px]"
                      readOnly
                      value={watch('totalParticipants') || 0}
                      {...register('totalParticipants')}
                    />
                    <Button
                      type="button"
                      onClick={downloadTrainingCSV}
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={!watch('totalParticipants') || watch('totalParticipants') === 0}
                    >
                      <Download className="h-4 w-4" />
                      Download CSV
                    </Button>
                  </div>
                </div>
              </div>

              {/* ส่วนที่ 3: งบประมาณและค่าใช้จ่าย */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">งบประมาณและค่าใช้จ่าย</h3>



                {/* ค่าวิทยากร */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold text-gray-700 mb-3">1. ค่าวิทยากร</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="form-label text-sm">จำนวนเงิน</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        placeholder="0.00"
                        {...register('instructorFee', {
                          min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' }
                        })}
                      />
                      {errors.instructorFee && (
                        <p className="text-red-500 text-xs mt-1">{errors.instructorFee.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="form-label text-sm">หักภาษี ณ ที่จ่าย (3%)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        placeholder="0.00"
                        {...register('instructorFeeWithholding', {
                          min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="form-label text-sm">VAT (7%)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        placeholder="0.00"
                        {...register('instructorFeeVat', {
                          min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="form-label text-sm font-semibold">รวม</label>
                      <Input
                        type="number"
                        step="0.01"
                        className="form-input bg-blue-100 font-semibold"
                        readOnly
                        value={watch('instructorFeeTotal') ? Number(watch('instructorFeeTotal')).toFixed(2) : '0.00'}
                        {...register('instructorFeeTotal')}
                      />
                    </div>
                  </div>
                </div>

                {/* ค่าห้อง อาหารและเครื่องดื่ม */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold text-gray-700 mb-3">2. ค่าห้อง อาหารและเครื่องดื่ม</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="form-label text-sm">จำนวนเงิน</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        placeholder="0.00"
                        {...register('roomFoodBeverage', {
                          min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' }
                        })}
                      />
                      {errors.roomFoodBeverage && (
                        <p className="text-red-500 text-xs mt-1">{errors.roomFoodBeverage.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="form-label text-sm">หักภาษี ณ ที่จ่าย (3%)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        placeholder="0.00"
                        {...register('roomFoodBeverageWithholding', {
                          min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="form-label text-sm">VAT (7%)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        placeholder="0.00"
                        {...register('roomFoodBeverageVat', {
                          min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="form-label text-sm font-semibold">รวม</label>
                      <Input
                        type="number"
                        step="0.01"
                        className="form-input bg-blue-100 font-semibold"
                        readOnly
                        value={watch('roomFoodBeverageTotal') ? Number(watch('roomFoodBeverageTotal')).toFixed(2) : '0.00'}
                        {...register('roomFoodBeverageTotal')}
                      />
                    </div>
                  </div>
                </div>

                {/* ค่าใช้จ่ายอื่นๆ */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold text-gray-700 mb-3">3. ค่าใช้จ่ายอื่นๆ</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="form-label text-sm">จำนวนเงิน</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        placeholder="0.00"
                        {...register('otherExpenses', {
                          min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' }
                        })}
                      />
                      {errors.otherExpenses && (
                        <p className="text-red-500 text-xs mt-1">{errors.otherExpenses.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="form-label text-sm">หักภาษี ณ ที่จ่าย (3%)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        placeholder="0.00"
                        {...register('otherExpensesWithholding', {
                          min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="form-label text-sm">VAT (7%)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        placeholder="0.00"
                        {...register('otherExpensesVat', {
                          min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="form-label text-sm font-semibold">รวม</label>
                      <Input
                        type="number"
                        step="0.01"
                        className="form-input bg-blue-100 font-semibold"
                        readOnly
                        value={watch('otherExpensesTotal') ? Number(watch('otherExpensesTotal')).toFixed(2) : '0.00'}
                        {...register('otherExpensesTotal')}
                      />
                    </div>
                  </div>
                </div>

                {/* สรุปรวม */}
                <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h4 className="font-bold text-blue-800 mb-4">สรุปรวมทั้งหมด</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="form-label text-sm font-semibold">รวมหักภาษี ณ ที่จ่าย</label>
                      <Input
                        type="number"
                        step="0.01"
                        className="form-input bg-red-100 font-semibold"
                        readOnly
                        value={watch('withholdingTax') ? Number(watch('withholdingTax')).toFixed(2) : '0.00'}
                        {...register('withholdingTax')}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="form-label text-sm font-semibold">รวม VAT</label>
                      <Input
                        type="number"
                        step="0.01"
                        className="form-input bg-green-100 font-semibold"
                        readOnly
                        value={watch('vat') ? Number(watch('vat')).toFixed(2) : '0.00'}
                        {...register('vat')}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="form-label text-sm font-bold">รวมเป็นเงินทั้งสิ้น</label>
                      <Input
                        type="number"
                        step="0.01"
                        className="form-input bg-yellow-100 font-bold text-lg"
                        readOnly
                        value={watch('totalAmount') ? Number(watch('totalAmount')).toFixed(2) : '0.00'}
                        {...register('totalAmount')}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="form-label text-sm font-semibold">เฉลี่ยต่อคน</label>
                      <Input
                        type="number"
                        step="0.01"
                        className="form-input bg-purple-100 font-semibold"
                        readOnly
                        value={watch('averageCostPerPerson') ? Number(watch('averageCostPerPerson')).toFixed(2) : '0.00'}
                        {...register('averageCostPerPerson')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ส่วนที่ 4: หมายเหตุ */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">หมายเหตุ</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="form-label">ออกหนังสือรับรองหักภาษี ณ ที่จ่ายในนาม</label>
                    <Input
                      placeholder="ระบุชื่อที่ต้องการออกหนังสือรับรอง"
                      className="form-input"
                      {...register('taxCertificateName')}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="form-label">จำนวนเงินที่ต้องหัก ณ ที่จ่าย</label>
                    <Input
                      type="number"
                      step="0.01"
                      className="form-input bg-gray-100"
                      readOnly
                      value={watch('withholdingTaxAmount') ? Number(watch('withholdingTaxAmount')).toFixed(2) : ''}
                      {...register('withholdingTaxAmount')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="form-label">หมายเหตุเพิ่มเติม</label>
                  <Textarea
                    className="form-input min-h-[100px]"
                    placeholder="กรอกรายละเอียดเพิ่มเติมถ้ามี"
                    {...register('additionalNotes')}
                  />
                </div>
              </div>
            </>
          )}

          {/* Advance (เบิกเงินทดลอง) specific fields */}
          {type === 'advance' && (
            <>
              {/* ส่วนที่ 1: ข้อมูลทั่วไป */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">ข้อมูลทั่วไป</h3>

                {/* แผนกและเขต */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="form-label">แผนก</label>
                    <Input
                      placeholder="ระบุแผนก"
                      className="form-input"
                      {...register('advanceDepartment', {
                        required: 'กรุณาระบุแผนก'
                      })}
                    />
                    {errors.advanceDepartment && (
                      <p className="text-red-500 text-sm mt-1">{errors.advanceDepartment.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="form-label">เขต</label>
                    <Input
                      placeholder="ระบุเขต"
                      className="form-input"
                      {...register('advanceDistrict', {
                        required: 'กรุณาระบุเขต'
                      })}
                    />
                    {errors.advanceDistrict && (
                      <p className="text-red-500 text-sm mt-1">{errors.advanceDistrict.message}</p>
                    )}
                  </div>
                </div>

                {/* ประเภทกิจกรรม */}
                <div className="space-y-2">
                  <label className="form-label">ประเภทกิจกรรม</label>
                  <Select
                    onValueChange={(value) => setValue('advanceActivityType', value)}
                    defaultValue={watch('advanceActivityType')}
                  >
                    <SelectTrigger className="form-input">
                      <SelectValue placeholder="เลือกประเภทกิจกรรม" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((activity) => (
                        <SelectItem key={activity} value={activity}>{activity}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.advanceActivityType && (
                    <p className="text-red-500 text-sm mt-1">{errors.advanceActivityType.message}</p>
                  )}
                </div>

                {/* ฟิลด์ระบุอื่นๆ เมื่อเลือก "อื่นๆ ระบุ" */}
                {watch('advanceActivityType') === 'อื่นๆ ระบุ' && (
                  <div className="space-y-2">
                    <label className="form-label">โปรดระบุ</label>
                    <Input
                      placeholder="ระบุประเภทกิจกรรมอื่นๆ"
                      className="form-input"
                      {...register('advanceActivityOther', {
                        required: watch('advanceActivityType') === 'อื่นๆ ระบุ' ? 'กรุณาระบุประเภทกิจกรรม' : false
                      })}
                    />
                    {errors.advanceActivityOther && (
                      <p className="text-red-500 text-sm mt-1">{errors.advanceActivityOther.message}</p>
                    )}
                  </div>
                )}

                {/* ข้อมูลสถานที่ */}
                <div className="space-y-2">
                  <label className="form-label">ชื่อร้าน/บริษัท</label>
                  <Input
                    placeholder="ระบุชื่อร้านหรือบริษัท"
                    className="form-input"
                    {...register('advanceShopCompany', {
                      required: 'กรุณาระบุชื่อร้าน/บริษัท'
                    })}
                  />
                  {errors.advanceShopCompany && (
                    <p className="text-red-500 text-sm mt-1">{errors.advanceShopCompany.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="form-label">อำเภอ</label>
                    <Input
                      placeholder="ระบุอำเภอ"
                      className="form-input"
                      {...register('advanceAmphur', {
                        required: 'กรุณาระบุอำเภอ'
                      })}
                    />
                    {errors.advanceAmphur && (
                      <p className="text-red-500 text-sm mt-1">{errors.advanceAmphur.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="form-label">จังหวัด</label>
                    <Input
                      placeholder="ระบุจังหวัด"
                      className="form-input"
                      {...register('advanceProvince', {
                        required: 'กรุณาระบุจังหวัด'
                      })}
                    />
                    {errors.advanceProvince && (
                      <p className="text-red-500 text-sm mt-1">{errors.advanceProvince.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ส่วนที่ 2: รายละเอียดงาน */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">รายละเอียดงาน</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="form-label">วันที่จัด</label>
                    <Input
                      type="date"
                      className="form-input"
                      {...register('advanceEventDate', {
                        required: 'กรุณาระบุวันที่จัด'
                      })}
                    />
                    {errors.advanceEventDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.advanceEventDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="form-label">จำนวนผู้เข้าร่วม</label>
                    <Input
                      type="number"
                      min="0"
                      className="form-input"
                      placeholder="0"
                      {...register('advanceParticipants', {
                        required: 'กรุณาระบุจำนวนผู้เข้าร่วม',
                        min: { value: 1, message: 'จำนวนผู้เข้าร่วมต้องมากกว่า 0' },
                        valueAsNumber: true
                      })}
                    />
                    {errors.advanceParticipants && (
                      <p className="text-red-500 text-sm mt-1">{errors.advanceParticipants.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ส่วนที่ 3: ค่าใช้จ่าย */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">รายละเอียดค่าใช้จ่าย</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="form-label">อัตราค่าใช้จ่ายต่อคน (บาท)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="0.00"
                      {...register('advanceDailyRate', {
                        min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' }
                      })}
                    />
                    {errors.advanceDailyRate && (
                      <p className="text-red-500 text-sm mt-1">{errors.advanceDailyRate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="form-label">ค่าที่พัก (บาท)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="0.00"
                      {...register('advanceAccommodationCost', {
                        min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' }
                      })}
                    />
                    {errors.advanceAccommodationCost && (
                      <p className="text-red-500 text-sm mt-1">{errors.advanceAccommodationCost.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="form-label">ค่าเดินทาง (บาท)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="0.00"
                      {...register('advanceTransportationCost', {
                        min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' }
                      })}
                    />
                    {errors.advanceTransportationCost && (
                      <p className="text-red-500 text-sm mt-1">{errors.advanceTransportationCost.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="form-label">เบี้ยเลี้ยง (บาท)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="0.00"
                      {...register('advanceMealAllowance', {
                        min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' }
                      })}
                    />
                    {errors.advanceMealAllowance && (
                      <p className="text-red-500 text-sm mt-1">{errors.advanceMealAllowance.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="form-label">ค่าใช้จ่ายอื่นๆ (บาท)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="0.00"
                    {...register('advanceOtherExpenses', {
                      min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' }
                    })}
                  />
                  {errors.advanceOtherExpenses && (
                    <p className="text-red-500 text-sm mt-1">{errors.advanceOtherExpenses.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="form-label font-semibold">รวมจำนวนเงินที่ขอเบิกทดลอง (บาท)</label>
                  <Input
                    type="number"
                    step="0.01"
                    className="form-input bg-blue-50 font-bold text-lg"
                    readOnly
                    value={watch('amount') ? Number(watch('amount')).toFixed(2) : ''}
                    {...register('amount')}
                  />
                </div>
              </div>
            </>
          )}

          {/* Continue with existing fields for other welfare types */}
          {type !== 'training' && type !== 'internal_training' && type !== 'advance' && (
            <>
              {/* Original amount field */}
              <div className="space-y-2">
                <label htmlFor="amount" className="form-label">จำนวนเงิน (บาท)</label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="ระบุจำนวนเงิน"
                  {...register('amount', {
                    required: 'กรุณาระบุจำนวนเงิน',
                    min: {
                      value: 1,
                      message: 'จำนวนเงินต้องมากกว่า 0'
                    },
                    max: {
                      value: maxAmount || 100000,
                      message: `จำนวนเงินต้องไม่เกิน ${maxAmount} บาท`
                    },
                    validate: {
                      notMoreThanRemaining: value =>
                        Number(value) <= remainingBudget || 'จำนวนเงินเกินงบประมาณที่เหลืออยู่'
                    },
                    onChange: (e) => {
                      const amount = Number(e.target.value);
                      const vatAmount = Number(watch('tax7Percent')) || 0;
                      const withholdingAmount = Number(watch('withholdingTax3Percent')) || 0;
                      calculateNonTrainingAmounts(amount, vatAmount, withholdingAmount);
                    }
                  })}
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>



              {/* VAT and Tax fields for non-training types */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="form-label">ภาษีมูลค่าเพิ่ม (7%)</label>
                  <Input
                    type="number"
                    className="form-input"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    defaultValue="0"
                    {...register('tax7Percent', {
                      min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' },
                      onChange: (e) => {
                        const amount = watch('amount');
                        const vatAmount = Number(e.target.value) || 0;
                        const withholdingAmount = Number(watch('withholdingTax3Percent')) || 0;
                        if (amount) {
                          calculateNonTrainingAmounts(Number(amount), vatAmount, withholdingAmount);
                        }
                      }
                    })}
                  />
                  {errors.tax7Percent && (
                    <p className="text-red-500 text-sm mt-1">{errors.tax7Percent.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="form-label">หักภาษี ณ ที่จ่าย (3%)</label>
                  <Input
                    type="number"
                    className="form-input"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    defaultValue="0"
                    {...register('withholdingTax3Percent', {
                      min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' },
                      onChange: (e) => {
                        const amount = watch('amount');
                        const withholdingAmount = Number(e.target.value) || 0;
                        const vatAmount = Number(watch('tax7Percent')) || 0;
                        if (amount) {
                          calculateNonTrainingAmounts(Number(amount), vatAmount, withholdingAmount);
                        }
                      }
                    })}
                  />
                  {errors.withholdingTax3Percent && (
                    <p className="text-red-500 text-sm mt-1">{errors.withholdingTax3Percent.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="form-label">จำนวนเงินสุทธิ</label>
                  <Input
                    type="number"
                    step="0.01"
                    className="form-input bg-gray-100"
                    readOnly
                    value={watch('netAmount') ? Number(watch('netAmount')).toFixed(2) : ''}
                    {...register('netAmount')}
                  />
                </div>
              </div>
            </>
          )}

          {/* Details Field */}
          <div className="space-y-2">
            <label htmlFor="details" className="form-label">รายละเอียด</label>
            <Textarea
              id="details"
              className="form-input min-h-[100px]"
              placeholder="กรอกรายละเอียดเพิ่มเติมถ้ามี"
              {...register('details', {

                minLength: {
                  value: 0,
                  message: 'รายละเอียดต้องมีความยาวอย่างน้อย 0 ตัวอักษร'
                }
              })}
            />
            {errors.details && (
              <p className="text-red-500 text-sm mt-1">{errors.details.message}</p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label htmlFor="attachments" className="form-label flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              แนบเอกสาร (ใบเสร็จรับเงิน, รายละเอียดหลักสูตร, ใบเสนอราคา/ใบแจ้งหนี้)
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="attachments"
                type="file"
                className="form-input"
                onChange={handleFileChange}
                multiple
              />
            </div>

            {/* Show uploaded files */}
            {files.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-1">ไฟล์ที่อัพโหลด:</p>
                <ul className="text-sm space-y-1">
                  {files.map((file, index) => {
                    const fileName = file.split('/').pop() || `ไฟล์ ${index + 1}`;
                    return (
                      <li key={index} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2 text-green-600">
                          <Check className="h-4 w-4 flex-shrink-0" />
                          <a
                            href={file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate hover:underline"
                            title={fileName}
                          >
                            {fileName}
                          </a>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="sr-only">ลบไฟล์</span>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-gray-500 mt-1">
                  จำนวนไฟล์ที่อัปโหลด: {files.length} ไฟล์
                </p>
              </div>
            )}
          </div>

          {/* Document types selection - welfare types except training, internal training, and advance */}
          {isDocumentUploadRequired && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">เอกสารที่ต้องแนบ</h3>
              <div className="grid grid-cols-2 gap-4">
                {DOCUMENT_TYPES.map((docType, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`document-${index}`}
                      {...register(`attachmentSelections.${docType}`)}
                      className="h-4 w-4"
                    />
                    <label htmlFor={`document-${index}`} className="text-sm text-gray-700">{docType}</label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full btn-hover-effect"
            disabled={isLoading || isSubmitting || (type === 'training' && Boolean(workDaysError))}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังส่งคำร้อง...
              </>
            ) : (
              'ส่งคำร้อง'
            )}
          </Button>

          {/* Animated Loading Popup */}
          <LoadingPopup open={isSubmitting} />
        </form>
      </div>

      {/* Digital Signature Modal */}
      <DigitalSignature
        isOpen={showSignatureModal}
        onClose={() => {
          setShowSignatureModal(false);
          setPendingFormData(null);
        }}
        onConfirm={handleSignatureConfirm}
        userName={user?.email || ''}
      />
    </div>
  );
}

