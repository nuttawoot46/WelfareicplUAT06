import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useWelfare } from '@/context/WelfareContext';
import { ArrowLeft, AlertCircle, Plus, X, Paperclip, Check, Loader2, Info, Trash2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { generateSalesExpenseClearingPDF } from '../pdf/SalesExpenseClearingPDFGenerator';
import { generatePhotoGridPDF } from '../pdf/PhotoGridPDFGenerator';
import { uploadPDFToSupabase } from '@/utils/pdfUtils';
import { DigitalSignature } from '../signature/DigitalSignature';
import { formatNumberWithCommas, parseFormattedNumber, formatNumberForInput, formatNumberOnBlur, formatInputWhileTyping } from '@/utils/numberFormat';

interface ExpenseClearingFormProps {
  onBack: () => void;
  editId?: number | null;
}

// Expense clearing form specific interface
interface ExpenseClearingFormValues {
  startDate: string;
  endDate?: string;
  amount: number;
  details: string;
  title?: string;
  attachments?: FileList;

  // Reference to original advance request
  originalAdvanceRequestId?: number;
  originalAdvanceRunNumber?: string;

  // Expense clearing fields (similar to advance but with actual usage)
  advanceDepartment: string;
  advanceDistrict?: string;
  advanceActivityType: string;
  advanceActivityOther?: string;
  advanceShopCompany?: string;
  advanceAmphur?: string;
  advanceProvince?: string;
  advanceEventDate?: string;
  advanceParticipants: number;
  venue?: string;
  advanceDealerName?: string;
  advanceSubdealerName?: string;

  // Expense clearing items with actual usage
  expenseClearingItems: {
    name: string;
    taxRate: number;
    requestAmount: number;
    usedAmount: number;
    vatAmount: number; // VAT 7%
    taxAmount: number;
    netAmount: number;
    refund: number;
    otherDescription?: string; // For "อุปกรณ์และอื่นๆ" specification
  }[];

  // Bank account information
  bankAccountName?: string;
  bankName?: string;
  bankAccountNumber?: string;

  // Dealer/Subdealer checkboxes
  isDealerActivity?: boolean;
  isSubdealerActivity?: boolean;

  // Document selections for expense clearing
  attachmentSelections?: {
    receiptSubstitute?: boolean; // ใบแทนใบเสร็จรับเงิน
    receipt?: boolean; // ใบเสร็จรับเงิน
    transferSlip?: boolean; // สลิปโอนเงิน
    photo?: boolean; // รูปภาพ
    idCardCopySelf?: boolean; // สำเนาบัตร (ตนเอง)
    idCardCopyContractor?: boolean; // สำเนาบัตร (ผู้รับจ้าง)
    withholdingTaxCert?: boolean; // หนังสือรับรองการหัก ณ ที่จ่าย
    taxInvoice?: boolean; // ใบกำกับภาษี
  };
  // File URLs for each document type
  documentFiles?: {
    receiptSubstitute?: string[];
    receipt?: string[];
    transferSlip?: string[];
    photo?: string[];
    idCardCopySelf?: string[];
    idCardCopyContractor?: string[];
    withholdingTaxCert?: string[];
    taxInvoice?: string[];
  };
}

// ประเภทกิจกรรมและคำนิยาม (เหมือน AdvanceForm)
const ACTIVITY_TYPES = [
  {
    name: 'จัดประชุมเกษตรกร',
    description: 'ค่าอาหาร-เครื่องดื่ม สำหรับจัดประชุม\nค่าถ่ายเอกสาร / อุปกรณ์อื่นๆ เพื่อใช้ในการประชุมเกษตรกร\nค่าป้ายไวนิล / ป้ายประกาศให้มาร่วมงาน / ใบปลิว / โบร์ชัวร์'
  },
  {
    name: 'จัดบูธประชาสัมพันธ์สินค้า',
    description: 'ค่าอาหาร-เครื่องดื่มตั้งบูธ หน้าร้านลูกค้าเพื่อช่วยระบายสินค้า\nซื้อของรางวัลร่วมจัดงานหน้าร้านลูกค้า เช่น กระติกน้ำ ปากกา แจกคนร่วมงาน\nจัดซื้อสินค้าอื่นๆ เพื่อแจกเกษตรที่เข้าร่วมงาน (กรุณาระบุสิ่งที่ต้องซื้อ)'
  },
  {
    name: 'จัดซื้อสินค้าอื่นๆ เพื่อแจกเกษตรที่เข้าร่วมงาน (กรุณาระบุสิ่งที่ต้องซื้อ)',
    description: 'สินค้าแถมเพื่อโปรโมชันต่างๆ เช่น ซื้อทูโฟฟอสแถมน้ำมัน'
  },
  {
    name: 'จัดงานฟิลเดย์ ลงแปลงเกษตร',
    description: 'ค่าอาหาร-เครื่องดื่มให้เกษตรที่ทำแปลง'
  },
  {
    name: 'จัดประชุมดีลเลอร์',
    description: 'ค่าใช้จ่ายในการดีลเลอร์'
  },
  {
    name: 'ค่ารับรองลูกค้า/ของขวัญร้านค้า',
    description: 'อาหาร-เครื่องดื่ม / กาแฟ / ขนม'
  },
  {
    name: 'ค่าน้ำมันรถทดแทน ',
    description: 'ค่าอาหาร-เครื่องดื่มให้เกษตรที่ทำแปลง'
  },
  {
    name: 'อื่นๆ',
    description: 'กรุณาระบุรายละเอียดเพิ่มเติม'
  }
];

// รายชื่อธนาคารในประเทศไทย
const THAI_BANKS = [
  'ธนาคารกรุงเทพ (Bangkok Bank)',
  'ธนาคารกสิกรไทย (Kasikornbank)',
  'ธนาคารกรุงไทย (Krungthai Bank)',
  'ธนาคารทหารไทยธนชาต (TTB Bank)',
  'ธนาคารไทยพาณิชย์ (Siam Commercial Bank)',
  'ธนาคารกรุงศรีอยุธยา (Bank of Ayudhya)',
  'ธนาคารเกียรตินาคินภัทร (Kiatnakin Phatra Bank)',
  'ธนาคารซีไอเอ็มบีไทย (CIMB Thai Bank)',
  'ธนาคารทิสโก้ (TISCO Bank)',
  'ธนาคารธนชาต (Thanachart Bank)',
  'ธนาคารยูโอบี (United Overseas Bank)',
  'ธนาคารแลนด์ แอนด์ เฮ้าส์ (Land and Houses Bank)',
  'ธนาคารไอซีบีซี (ไทย) (ICBC Thai)',
  'ธนาคารเอชเอสบีซี (HSBC)',
  'ธนาคารออมสิน (Government Savings Bank)',
  'ธนาคารอาคารสงเคราะห์ (Government Housing Bank)',
];

// Generate run number for expense clearing requests (ฝ่ายขาย)
const generateExpenseClearingRunNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp for uniqueness
  return `EXP${year}${month}${timestamp}`;
};

// รายการค่าใช้จ่ายเคลียร์
const EXPENSE_CLEARING_CATEGORIES = [
  { name: 'ค่าอาหาร และ เครื่องดื่ม', taxRate: 0, hasInfo: false },
  { name: 'ค่าที่พัก', taxRate: 0, hasInfo: false },
  { name: 'ค่าเช่าสถานที่', taxRate: 5, hasInfo: false },
  { name: 'งบสนับสนุนร้านค้า', taxRate: 3, hasInfo: false },
  { name: 'ค่าบริการ /ค่าจ้างทำป้าย /ค่าจ้างอื่น ๆ', taxRate: 3, hasInfo: false },
  { name: 'ค่าวงดนตรี / เครื่องเสียง / MC', taxRate: 3, hasInfo: false },
  { name: 'ค่าของรางวัลเพื่อการชิงโชค', taxRate: 5, hasInfo: true, infoText: 'ของรางวัลชิงโชค คือ ของรางวัลที่มีมูลค่า/ชิ้น ตั้งแต่ 1,000 บาท ขึ้นไป (ต้องขออนุญาตชิงโชค หากไม่ได้รับอนุญาต แล้วจัดกิจกรรม มีความผิดตามกฎหมาย อาจได้รับโทษปรับและ/หรือจำคุก)' },
  { name: 'ค่าว่าจ้างโฆษณาทางวิทยุ', taxRate: 2, hasInfo: false },
  { name: 'ค่าน้ำมัน', taxRate: 0, hasInfo: false },
  { name: 'ค่าใช้จ่ายอื่น ๆ (โปรดระบุรายละเอียด)', taxRate: 0, hasInfo: false },
];

export function ExpenseClearingForm({ onBack, editId }: ExpenseClearingFormProps) {
  const location = useLocation();
  const navigate = useNavigate();
  let editIdNum: number | undefined = undefined;
  if (typeof editId === 'number') {
    editIdNum = editId;
  } else {
    const searchParams = new URLSearchParams(location.search);
    const editIdStr = searchParams.get('editId');
    editIdNum = editIdStr ? Number(editIdStr) : undefined;
  }

  const { user, profile } = useAuth();
  const { submitRequest, refreshRequests } = useWelfare();
  const [files, setFiles] = useState<string[]>([]);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [userSignature, setUserSignature] = useState<string>('');
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [availableAdvanceRequests, setAvailableAdvanceRequests] = useState<any[]>([]);
  const [dealerList, setDealerList] = useState<Array<{ No: string; Name: string; City: string; County: string }>>([]);
  const [dealerSearchTerm, setDealerSearchTerm] = useState('');
  const [showDealerDropdown, setShowDealerDropdown] = useState(false);
  const [filteredDealers, setFilteredDealers] = useState<Array<{ No: string; Name: string; City: string; County: string }>>([]);
  const [isDealerFieldsLocked, setIsDealerFieldsLocked] = useState<boolean>(false);
  const [showLotteryInfoModal, setShowLotteryInfoModal] = useState(false);

  // Document type files state
  const [documentFiles, setDocumentFiles] = useState<{
    receiptSubstitute: string[];
    receipt: string[];
    transferSlip: string[];
    photo: string[];
    idCardCopySelf: string[];
    idCardCopyContractor: string[];
    withholdingTaxCert: string[];
    taxInvoice: string[];
  }>({
    receiptSubstitute: [],
    receipt: [],
    transferSlip: [],
    photo: [],
    idCardCopySelf: [],
    idCardCopyContractor: [],
    withholdingTaxCert: [],
    taxInvoice: [],
  });

  // Photo descriptions state (max 4 photos)
  const [photoDescriptions, setPhotoDescriptions] = useState<string[]>(['', '', '', '']);

  // Document type checkboxes state
  const [documentSelections, setDocumentSelections] = useState<{
    receiptSubstitute: boolean;
    receipt: boolean;
    transferSlip: boolean;
    photo: boolean;
    idCardCopySelf: boolean;
    idCardCopyContractor: boolean;
    withholdingTaxCert: boolean;
    taxInvoice: boolean;
  }>({
    receiptSubstitute: false,
    receipt: false,
    transferSlip: false,
    photo: false,
    idCardCopySelf: false,
    idCardCopyContractor: false,
    withholdingTaxCert: false,
    taxInvoice: false,
  });

  // Draft functionality state
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const DRAFT_KEY = `expense_clearing_draft_${user?.email || 'anonymous'}`;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors }
  } = useForm<ExpenseClearingFormValues>({
    defaultValues: {
      expenseClearingItems: [{ name: '', taxRate: 0, requestAmount: 0, usedAmount: 0, vatAmount: 0, taxAmount: 0, netAmount: 0, refund: 0, otherDescription: '' }]
    }
  });

  const { fields: expenseFields, append: appendExpense, remove: removeExpense } = useFieldArray({
    control,
    name: "expenseClearingItems"
  });

  // Function to get status text in Thai
  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending_manager':
        return 'รอผู้จัดการอนุมัติ';
      case 'pending_hr':
        return 'รอ HR อนุมัติ';
      case 'pending_accounting':
        return 'รอบัญชีอนุมัติ';
      case 'approved':
      case 'completed':
        return 'อนุมัติแล้ว';
      case 'rejected_manager':
        return 'ผู้จัดการปฏิเสธ';
      case 'rejected_hr':
        return 'HR ปฏิเสธ';
      case 'rejected_accounting':
        return 'บัญชีปฏิเสธ';
      case 'pending_revision':
        return 'รอเอกสารเพิ่มเติม';
      default:
        return 'ไม่ทราบสถานะ';
    }
  };

  // Draft functions
  const saveDraft = () => {
    setIsSavingDraft(true);
    try {
      const formData = watch();
      const draftData = {
        ...formData,
        files,
        documentFiles,
        documentSelections,
        photoDescriptions,
        dealerSearchTerm,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      toast({
        title: 'บันทึกฉบับร่างสำเร็จ',
        description: 'ข้อมูลถูกบันทึกเป็นฉบับร่างเรียบร้อยแล้ว',
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกฉบับร่างได้',
        variant: 'destructive',
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const loadDraft = () => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        const { files: savedFiles, documentFiles: savedDocFiles, documentSelections: savedDocSelections, photoDescriptions: savedPhotoDesc, dealerSearchTerm: savedDealer, savedAt, ...formData } = draftData;
        reset(formData);
        if (savedFiles) setFiles(savedFiles);
        if (savedDocFiles) setDocumentFiles(savedDocFiles);
        if (savedDocSelections) setDocumentSelections(savedDocSelections);
        if (savedPhotoDesc) setPhotoDescriptions(savedPhotoDesc);
        if (savedDealer) setDealerSearchTerm(savedDealer);
        toast({
          title: 'โหลดฉบับร่างสำเร็จ',
          description: `โหลดข้อมูลจากฉบับร่างที่บันทึกเมื่อ ${new Date(savedAt).toLocaleString('th-TH')}`,
        });
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

  // Load draft on mount (only if not in edit mode)
  useEffect(() => {
    if (!editIdNum) {
      loadDraft();
    }
  }, []);

  // Fetch employee data when component mounts
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user?.email) return;

      try {
        const { data, error } = await (supabase
          .from('Employee')
          .select('id, Name, Position, Team, sales_zone') as any)
          .eq('email_user', user.email)
          .single();

        if (!error && data) {
          setEmployeeData(data);

          // Auto-populate department field
          if (data.Team) {
            setValue('advanceDepartment', data.Team);
          }

          // Auto-populate district from sales_zone in Employee table
          if (data.sales_zone) {
            setValue('advanceDistrict', data.sales_zone);
          }
        }
      } catch (error) {
        console.error('Error fetching employee data:', error);
      }
    };

    fetchEmployeeData();
  }, [user?.email, setValue]);

  // Fetch dealer list filtered by employee's sales_zone
  useEffect(() => {
    let isMounted = true;

    const fetchDealerList = async () => {
      try {
        const zoneCode = employeeData?.sales_zone || null;
        console.log('🔍 Fetching dealer list for expense clearing, zone:', zoneCode || 'ALL');

        let query = supabase
          .from('customer_active' as any)
          .select('cus_name1, cus_city, county');

        if (zoneCode) {
          query = query.eq('zone_code', zoneCode);
        }

        const { data, error } = await query.order('cus_name1', { ascending: true });

        if (!error && data && isMounted) {
          console.log('✅ Dealer list loaded:', data.length, 'dealers for zone:', zoneCode || 'ALL');
          setDealerList(data.map((d: any) => ({
            No: '',
            Name: d.cus_name1 || '',
            City: d.cus_city || '',
            County: d.county || ''
          })));
        } else if (error) {
          console.warn('⚠️ customer_active table not available:', error.message);
          if (isMounted) {
            setDealerList([]);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching dealer list:', error);
        if (isMounted) {
          setDealerList([]);
        }
      }
    };

    fetchDealerList();

    return () => {
      isMounted = false;
    };
  }, [employeeData]);

  // Fetch available advance requests for this user (exclude already-linked ones)
  useEffect(() => {
    const fetchAdvanceRequests = async () => {
      if (!user?.email || !employeeData?.id) return;

      try {
        // Fetch completed advance requests
        const { data: advanceData, error: advanceError } = await supabase
          .from('welfare_requests')
          .select('id, amount, created_at, details, advance_activity_type, status, run_number')
          .eq('employee_id', employeeData.id)
          .eq('request_type', 'advance')
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

        // Fetch non-rejected expense-clearing requests that already link to an advance request
        // Rejected ones are excluded so the advance can be reused
        const { data: linkedData, error: linkedError } = await supabase
          .from('welfare_requests')
          .select('original_advance_request_id')
          .eq('employee_id', employeeData.id)
          .eq('request_type', 'expense-clearing')
          .not('original_advance_request_id', 'is', null)
          .not('status', 'like', 'rejected%');

        if (!advanceError && advanceData) {
          // Get set of already-linked advance request IDs
          const linkedIds = new Set(
            (linkedData || []).map((r: any) => r.original_advance_request_id)
          );
          // Filter out advance requests that are already linked to an expense clearing
          const available = advanceData.filter((req: any) => !linkedIds.has(req.id));
          setAvailableAdvanceRequests(available);
        }
      } catch (error) {
        console.error('Error fetching advance requests:', error);
      }
    };

    if (employeeData?.id) {
      fetchAdvanceRequests();
    }
  }, [user?.email, employeeData?.id]);

  // Handle selection of original advance request
  const handleAdvanceRequestSelection = async (requestId: string) => {
    if (!requestId) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('welfare_requests')
        .select('*')
        .eq('id', parseInt(requestId))
        .single();

      if (!error && data) {
        console.log('📋 Loading advance request data:', data);
        console.log('📋 Advance expense items raw:', (data as any).advance_expense_items);

        // Populate form with data from original advance request
        setValue('originalAdvanceRequestId', data.id);
        setValue('originalAdvanceRunNumber', (data as any).run_number || '');
        setValue('advanceDepartment', (data as any).advance_department || '');
        setValue('advanceDistrict', (data as any).advance_district || '');
        const activityType = (data as any).advance_activity_type || '';
        setValue('advanceActivityType', activityType);
        setValue('advanceActivityOther', (data as any).advance_activity_other || '');
        setValue('details', data.details || ''); // Set details/description
        const dealerName = (data as any).advance_dealer_name || '';
        setValue('advanceDealerName', dealerName);
        setDealerSearchTerm(dealerName); // Set search term to show dealer name
        setValue('advanceSubdealerName', (data as any).advance_subdealer_name || '');
        setValue('advanceShopCompany', (data as any).advance_shop_company || '');
        setValue('advanceAmphur', (data as any).advance_amphur || '');
        setValue('advanceProvince', (data as any).advance_province || '');
        setValue('advanceEventDate', (data as any).advance_event_date || '');
        setValue('advanceParticipants', (data as any).advance_participants || 0);
        setValue('venue', (data as any).advance_location || '');
        setValue('startDate', data.start_date || '');
        setValue('endDate', data.end_date || '');

        // Load bank account information
        setValue('bankAccountName', (data as any).bank_account_name || '');
        setValue('bankName', (data as any).bank_name || '');
        setValue('bankAccountNumber', (data as any).bank_account_number || '');

        // Load expense items from original request
        if ((data as any).advance_expense_items) {
          const expenseItemsRaw = (data as any).advance_expense_items;
          console.log('📋 Expense items type:', typeof expenseItemsRaw);
          
          let expenseItems;
          if (typeof expenseItemsRaw === 'string') {
            expenseItems = JSON.parse(expenseItemsRaw);
          } else {
            expenseItems = expenseItemsRaw;
          }
          
          console.log('📋 Parsed expense items:', expenseItems);
          
          const mappedItems = expenseItems.map((item: any) => {
            console.log('📋 Mapping item:', item);
            const requestAmount = Number(item.requestAmount) || 0;
            const usedAmount = 0;
            const vatAmount = 0;
            const taxAmount = 0;
            const netAmount = 0;
            const refund = requestAmount;
            
            return {
              name: item.name || '',
              requestAmount,
              usedAmount,
              vatAmount,
              taxAmount,
              netAmount,
              taxRate: Number(item.taxRate) || 0,
              refund,
              otherDescription: item.otherDescription || ''
            };
          });
          
          console.log('📋 Mapped items:', mappedItems);
          
          // Clear existing items first
          setValue('expenseClearingItems', []);
          
          // Then set new items with a small delay to ensure re-render
          setTimeout(() => {
            setValue('expenseClearingItems', mappedItems, { shouldValidate: true });
          }, 50);
        }

        toast({
          title: 'โหลดข้อมูลสำเร็จ',
          description: 'ข้อมูลจากคำขอเบิกเงินล่วงหน้าได้ถูกโหลดเรียบร้อยแล้ว',
        });
      }
    } catch (error) {
      console.error('Error loading advance request:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลคำขอเบิกเงินล่วงหน้าได้',
        variant: 'destructive',
      });
    }
  };

  // Filter dealers based on search term (เหมือน AdvanceForm)
  useEffect(() => {
    if (dealerSearchTerm.trim() === '') {
      setFilteredDealers([]);
      setShowDealerDropdown(false);
    } else {
      const filtered = dealerList.filter(dealer =>
        dealer.Name.toLowerCase().includes(dealerSearchTerm.toLowerCase())
      );
      setFilteredDealers(filtered.slice(0, 10)); // Limit to 10 suggestions
      setShowDealerDropdown(filtered.length > 0);
    }
  }, [dealerSearchTerm, dealerList]);

  // Watch expense items for real-time updates
  const watchedExpenseItems = watch('expenseClearingItems');
  
  // Watch individual used amounts for immediate calculation
  const watchedUsedAmounts = watchedExpenseItems?.map((_, index) => 
    watch(`expenseClearingItems.${index}.usedAmount`)
  ) || [];
  
  // Calculate total refund amount (can be negative if overspent) in real-time
  const calculateTotalRefund = () => {
    const expenseItems = watchedExpenseItems || [];
    return expenseItems.reduce((sum, item) => {
      const refund = typeof item.refund === 'string' 
        ? parseFloat(item.refund) || 0 
        : Number(item.refund) || 0;
      return sum + refund; // Sum all refund amounts
    }, 0);
  };

  // Calculate net amounts, VAT, tax amounts, and refunds when expense items change
  useEffect(() => {
    const expenseItems = watchedExpenseItems || [];
    let hasChanges = false;
    
    expenseItems.forEach((item, index) => {
      const requestAmount = typeof item.requestAmount === 'string' 
        ? parseFloat(item.requestAmount) || 0 
        : Number(item.requestAmount) || 0;
      const usedAmount = typeof item.usedAmount === 'string' 
        ? parseFloat(item.usedAmount) || 0 
        : Number(item.usedAmount) || 0;
      const taxRate = typeof item.taxRate === 'string' 
        ? parseFloat(item.taxRate) || 0 
        : Number(item.taxRate) || 0;
      
      // Get manually entered VAT amount
      const vatAmount = typeof item.vatAmount === 'string'
        ? parseFloat(item.vatAmount) || 0
        : Number(item.vatAmount) || 0;
      
      // Auto-calculate tax amount (ภาษีหัก ณ ที่จ่าย) based on used amount and tax rate
      const autoTaxAmount = (usedAmount * taxRate) / 100;
      
      // Net amount = used amount + VAT - tax
      const netAmount = usedAmount + vatAmount - autoTaxAmount;
      
      // Refund = จำนวนเงินเบิก - รวมจำนวนเงินทั้งสิ้น
      const refund = requestAmount - netAmount;
      
      // Check if values need to be updated
      const currentTaxAmount = typeof item.taxAmount === 'string' 
        ? parseFloat(item.taxAmount) || 0 
        : Number(item.taxAmount) || 0;
      const currentNetAmount = typeof item.netAmount === 'string' 
        ? parseFloat(item.netAmount) || 0 
        : Number(item.netAmount) || 0;
      const currentRefund = typeof item.refund === 'string' 
        ? parseFloat(item.refund) || 0 
        : Number(item.refund) || 0;
      
      if (Math.abs(currentTaxAmount - autoTaxAmount) > 0.01 || 
          Math.abs(currentNetAmount - netAmount) > 0.01 ||
          Math.abs(currentRefund - refund) > 0.01) {
        setValue(`expenseClearingItems.${index}.taxAmount`, autoTaxAmount, { shouldValidate: false });
        setValue(`expenseClearingItems.${index}.netAmount`, netAmount, { shouldValidate: false });
        setValue(`expenseClearingItems.${index}.refund`, refund, { shouldValidate: false });
        hasChanges = true;
      }
    });
    
    // Force update total amount if there were changes
    if (hasChanges) {
      const refundAmount = calculateTotalRefund();
      setValue('amount', refundAmount, { shouldValidate: true, shouldDirty: true });
    }
  }, [watchedExpenseItems, setValue, watchedUsedAmounts]);

  // Update form amount field when expense items change - with debounce for better performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const refundAmount = calculateTotalRefund();
      setValue('amount', refundAmount, { shouldValidate: false, shouldDirty: false });
    }, 300); // Increased debounce time

    return () => clearTimeout(timeoutId);
  }, [watchedUsedAmounts, setValue]); // Only watch used amounts, not the entire items array

  // Document types configuration
  type DocumentType = 'receiptSubstitute' | 'receipt' | 'transferSlip' | 'photo' | 'idCardCopySelf' | 'idCardCopyContractor' | 'withholdingTaxCert' | 'taxInvoice';

  const DOCUMENT_TYPES: { key: DocumentType; label: string }[] = [
    { key: 'receiptSubstitute', label: 'ใบแทนใบเสร็จรับเงิน' },
    { key: 'receipt', label: 'ใบเสร็จรับเงิน' },
    { key: 'transferSlip', label: 'สลิปโอนเงิน' },
    { key: 'photo', label: 'รูปภาพ (กิจกรรม)' },
    { key: 'idCardCopySelf', label: 'สำเนาบัตรประชาชน (ตนเอง)' },
    { key: 'idCardCopyContractor', label: 'สำเนาบัตรประชาชน (ผู้รับจ้าง)' },
    { key: 'withholdingTaxCert', label: 'หนังสือรับรองการหัก ณ ที่จ่าย' },
    { key: 'taxInvoice', label: 'ใบกำกับภาษี' },
  ];

  // Handle checkbox toggle for document type
  const handleDocumentCheckboxChange = (docType: DocumentType) => {
    setDocumentSelections(prev => ({
      ...prev,
      [docType]: !prev[docType]
    }));
    // Clear files if unchecked
    if (documentSelections[docType]) {
      setDocumentFiles(prev => ({
        ...prev,
        [docType]: []
      }));
    }
  };

  // File handling functions for document types
  const handleDocumentFileChange = async (e: React.ChangeEvent<HTMLInputElement>, docType: DocumentType) => {
    const fileInput = e.target;

    if (!fileInput.files || fileInput.files.length === 0) return;

    try {
      const uploadPromises = Array.from(fileInput.files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${user?.id || 'anonymous'}/${docType}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('welfare-attachments')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('welfare-attachments')
          .getPublicUrl(data.path);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setDocumentFiles(prev => ({
        ...prev,
        [docType]: [...prev[docType], ...uploadedUrls]
      }));

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
      fileInput.value = '';
    }
  };

  const handleRemoveDocumentFile = async (docType: DocumentType, index: number) => {
    try {
      const fileUrl = documentFiles[docType][index];
      const filePath = fileUrl.split('/').slice(-3).join('/');

      const { error } = await supabase.storage
        .from('welfare-attachments')
        .remove([filePath]);

      if (error) throw error;

      setDocumentFiles(prev => ({
        ...prev,
        [docType]: prev[docType].filter((_, i) => i !== index)
      }));

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

  // Legacy file handling (kept for compatibility)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;

    if (!fileInput.files || fileInput.files.length === 0) return;

    try {
      const uploadPromises = Array.from(fileInput.files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${user?.id || 'anonymous'}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('welfare-attachments')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('welfare-attachments')
          .getPublicUrl(data.path);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
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
      fileInput.value = '';
    }
  };

  const handleRemoveFile = async (index: number) => {
    try {
      const fileUrl = files[index];
      const filePath = fileUrl.split('/').slice(-2).join('/');

      const { error } = await supabase.storage
        .from('welfare-attachments')
        .remove([filePath]);

      if (error) throw error;

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

  const onSubmit = async (data: ExpenseClearingFormValues) => {
    // คำนวณยอดรวมใหม่ก่อนส่งข้อมูล และแปลงข้อมูลให้เป็น number
    const expenseItems = data.expenseClearingItems || [];
    const calculatedRefund = expenseItems.reduce((sum, item) => {
      const requestAmount = typeof item.requestAmount === 'string' 
        ? parseFloat(item.requestAmount) || 0 
        : Number(item.requestAmount) || 0;
      const netAmount = typeof item.netAmount === 'string' 
        ? parseFloat(item.netAmount) || 0 
        : Number(item.netAmount) || 0;
      // Refund = จำนวนเงินเบิก - รวมจำนวนเงินทั้งสิ้น
      return sum + (requestAmount - netAmount);
    }, 0);
    
    data.amount = calculatedRefund;
    
    // แปลงข้อมูลใน expense items ให้เป็น number ทั้งหมด
    data.expenseClearingItems = expenseItems.map(item => {
      return {
        ...item,
        requestAmount: typeof item.requestAmount === 'string' 
          ? parseFloat(item.requestAmount) || 0 
          : Number(item.requestAmount) || 0,
        usedAmount: typeof item.usedAmount === 'string' 
          ? parseFloat(item.usedAmount) || 0 
          : Number(item.usedAmount) || 0,
        vatAmount: typeof item.vatAmount === 'string' 
          ? parseFloat(item.vatAmount) || 0 
          : Number(item.vatAmount) || 0,
        taxRate: typeof item.taxRate === 'string' 
          ? parseFloat(item.taxRate) || 0 
          : Number(item.taxRate) || 0,
        taxAmount: typeof item.taxAmount === 'string' 
          ? parseFloat(item.taxAmount) || 0 
          : Number(item.taxAmount) || 0,
        netAmount: typeof item.netAmount === 'string' 
          ? parseFloat(item.netAmount) || 0 
          : Number(item.netAmount) || 0,
        refund: typeof item.refund === 'string' 
          ? parseFloat(item.refund) || 0 
          : Number(item.refund) || 0,
        otherDescription: item.otherDescription || ''
      };
    });

    console.log('🚀 Expense clearing form submitted with data:', data);
    console.log('🚀 Calculated refund amount:', calculatedRefund);
    console.log('🚀 Form amount field (updated):', data.amount);
    console.log('🚀 Expense clearing items:', data.expenseClearingItems);

    // Validate that at least one expense item has both name and net amount
    const validExpenseItems = data.expenseClearingItems?.filter(item =>
      item.name && item.name.trim() !== '' && item.netAmount > 0
    );

    if (!validExpenseItems || validExpenseItems.length === 0) {
      toast({
        title: 'กรุณาเพิ่มรายการค่าใช้จ่าย',
        description: 'กรุณาเพิ่มรายการค่าใช้จ่ายอย่างน้อย 1 รายการ พร้อมระบุชื่อรายการและจำนวนเงิน',
        variant: 'destructive',
      });
      return;
    }

    // Validate required attachments - if checkbox is checked, file must be uploaded
    const missingAttachments = DOCUMENT_TYPES.filter(
      docType => documentSelections[docType.key] && documentFiles[docType.key].length === 0
    );
    if (missingAttachments.length > 0) {
      const missingNames = missingAttachments.map(d => d.label).join(', ');
      toast({
        title: 'กรุณาแนบเอกสาร',
        description: `กรุณาอัพโหลดไฟล์สำหรับ: ${missingNames}`,
        variant: 'destructive',
      });
      return;
    }

    if (!employeeData) {
      console.error('❌ No employee data found');
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่พบข้อมูลพนักงาน กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
      return;
    }

    console.log('✅ Setting pending form data and showing signature modal');
    setPendingFormData({ data, employeeData });
    setShowSignatureModal(true);
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

  // Process form submission with PDF
  const processFormSubmission = async (data: ExpenseClearingFormValues, employeeData: any, signature?: string) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Collect all document file URLs into a single attachments array
      const allAttachments = Object.values(documentFiles).flat();

      // Generate run number for expense clearing
      const runNumber = generateExpenseClearingRunNumber();

      // CREATE NEW EXPENSE CLEARING REQUEST
      const requestData = {
        userId: profile.employee_id.toString(),
        userName: employeeData?.Name || user?.email || 'Unknown User',
        userDepartment: employeeData?.Team || 'Unknown Department',
        department_request: employeeData?.Team || 'Unknown Department',
        type: 'expense-clearing' as const,
        status: 'pending_manager' as const,
        amount: Number(data.amount || 0),
        date: data.startDate || new Date().toISOString(),
        details: data.details || '',
        attachments: allAttachments,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        managerId: employeeData?.Position,
        start_date: data.startDate,
        end_date: data.endDate,
        userSignature: signature || userSignature,
        // Document selections (checkbox states)
        attachmentSelections: documentSelections,
        // Document files by type
        documentFiles: documentFiles,
        // Photo descriptions for PDF generation
        photoDescriptions: photoDescriptions,
        // Expense clearing fields
        originalAdvanceRequestId: data.originalAdvanceRequestId,
        originalAdvanceRunNumber: data.originalAdvanceRunNumber,
        advanceDepartment: data.advanceDepartment,
        advanceDistrict: data.advanceDistrict,
        advanceActivityType: data.advanceActivityType,
        advanceActivityOther: data.advanceActivityOther,
        advanceDealerName: data.advanceDealerName,
        advanceSubdealerName: data.advanceSubdealerName,
        advanceShopCompany: data.advanceShopCompany,
        advanceAmphur: data.advanceAmphur,
        advanceProvince: data.advanceProvince,
        advanceEventDate: data.advanceEventDate || null,
        advanceParticipants: data.advanceParticipants,
        advanceLocation: data.venue,
        expenseClearingItems: data.expenseClearingItems,
        // Bank account information
        bankAccountName: data.bankAccountName,
        bankName: data.bankName,
        bankAccountNumber: data.bankAccountNumber,
        // Run number for expense clearing
        runNumber: runNumber,
      };

      // Debug: Log the exact data being sent
      console.log('🔍 Request data keys:', Object.keys(requestData));
      console.log('🔍 Request data type:', requestData.type);
      console.log('🔍 Expense clearing items count:', data.expenseClearingItems?.length || 0);
      console.log('🔍 Date fields check:', {
        startDate: data.startDate,
        endDate: data.endDate,
        advanceEventDate: data.advanceEventDate,
        'startDate empty?': data.startDate === '',
        'endDate empty?': data.endDate === '',
        'advanceEventDate empty?': data.advanceEventDate === ''
      });

      console.log('🔍 Submitting expense clearing request data:', requestData);
      console.log('🔍 Expense clearing items:', JSON.stringify(data.expenseClearingItems, null, 2));
      console.log('📤 Sending expense clearing requestData to submitRequest:', requestData);
      console.log('📤 Amount being sent:', requestData.amount);
      
      let result: any;
      try {
        result = await submitRequest(requestData);
        if (!result) {
          throw new Error('Failed to submit request');
        }
        
        console.log('✅ Submit request result:', result);
      } catch (submitError: any) {
        console.error('❌ Submit request error:', submitError);
        console.error('❌ Error details:', submitError.message);
        
        // Try to get more specific error info
        if (submitError.message && submitError.message.includes('Failed to submit request')) {
          console.error('❌ This is a generic error, check WelfareContext logs for Supabase error details');
        }
        
        throw submitError;
      }

      await refreshRequests();

      // Generate PDF and upload to Supabase
      try {
        const hasExecutive = !!profile?.executive_id;
        const blob = await generateSalesExpenseClearingPDF(
          {
            ...requestData,
            id: result.id || Date.now(),
            status: 'pending_manager' as const,
            createdAt: requestData.createdAt,
            updatedAt: requestData.updatedAt,
            userSignature: signature || userSignature
          },
          user as any,
          employeeData,
          signature || userSignature,
          undefined, // managerSignature
          undefined, // accountingSignature
          true, // showManagerSignature - always show หัวหน้า field
          hasExecutive // showExecutiveSignature - true for MR (has executive), false for ME
        );

        const employeeId = employeeData?.employee_id || user?.id?.slice(-8) || 'user';
        const timestamp = Date.now();
        const filename = `expense_clearing_emp${employeeId}_${timestamp}.pdf`;
        const pdfUrl = await uploadPDFToSupabase(blob, filename, user?.id);

        if (result.id && pdfUrl) {
          await supabase.from('welfare_requests').update({ pdf_url: pdfUrl }).eq('id', result.id);
        }

        // Generate Photo Grid PDF if there are photos
        if (documentFiles.photo.length > 0) {
          try {
            const photosWithDescriptions = documentFiles.photo.map((url, index) => ({
              url,
              description: photoDescriptions[index] || ''
            }));

            const photoBlob = await generatePhotoGridPDF(
              photosWithDescriptions,
              `รูปภาพกิจกรรม - ${employeeData?.Name || user?.email}`
            );

            const photoFilename = `expense_clearing_photos_emp${employeeId}_${timestamp}.pdf`;
            const photoPdfUrl = await uploadPDFToSupabase(photoBlob, photoFilename, user?.id);

            if (result.id && photoPdfUrl) {
              // Append photo PDF URL to attachment_url (stored as JSON array)
              const { data: currentData } = await supabase
                .from('welfare_requests')
                .select('attachment_url')
                .eq('id', result.id)
                .single();

              // Parse existing attachment_url as JSON array
              let existingUrls: string[] = [];
              if (currentData?.attachment_url) {
                try {
                  const parsed = JSON.parse(currentData.attachment_url);
                  existingUrls = Array.isArray(parsed) ? parsed : [parsed];
                } catch {
                  // If not valid JSON, treat as single URL string
                  existingUrls = currentData.attachment_url ? [currentData.attachment_url] : [];
                }
              }

              // Add the photo PDF URL to the array
              existingUrls.push(photoPdfUrl);

              await supabase.from('welfare_requests').update({
                attachment_url: JSON.stringify(existingUrls)
              }).eq('id', result.id);
            }
            console.log('✅ Photo Grid PDF generated and uploaded:', photoPdfUrl);
          } catch (photoError) {
            console.error('Photo Grid PDF generation error:', photoError);
            // Don't throw - main form submission was successful
          }
        }

        toast({
          title: 'ส่งคำร้องและอัปโหลด PDF สำเร็จ',
          description: 'คำร้องเคลียร์ค่าใช้จ่ายของคุณถูกส่งเรียบร้อยแล้ว และ PDF ได้ถูกบันทึกในระบบแล้ว',
        });
      } catch (pdfError) {
        console.error('PDF generation/upload error:', pdfError);
        toast({
          title: 'ส่งคำร้องสำเร็จ',
          description: 'คำร้องเคลียร์ค่าใช้จ่ายของคุณถูกส่งเรียบร้อยแล้ว แต่ไม่สามารถสร้าง/อัปโหลด PDF ได้ในขณะนี้',
        });
      }

      reset();
      setFiles([]);
      setUserSignature('');
      clearDraft(); // Clear draft after successful submission
      setTimeout(onBack, 2000);

    } catch (error: any) {
      console.error('Error submitting form:', error);
      throw error;
    }
  };

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

      <div id="expense-clearing-form-content" className="form-container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">แบบฟอร์มเคลียร์ค่าใช้จ่าย (ฝ่ายขาย)</h1>
        </div>

        

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Hidden amount field for form submission */}
          <input
            type="hidden"
            {...register('amount', { valueAsNumber: true })}
          />
          {/* ส่วนเลือกคำขอเบิกเงินล่วงหน้าเดิม */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">เลือกคำขอเบิกเงินล่วงหน้าเดิม (ถ้ามี)</h3>
            <div className="space-y-2">
              <label className="form-label">คำขอเบิกเงินล่วงหน้าที่ต้องการเคลียร์</label>
              {availableAdvanceRequests.length > 0 ? (
                <Select onValueChange={handleAdvanceRequestSelection}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="เลือกคำขอเบิกเงินล่วงหน้า (หรือข้ามไปกรอกใหม่)" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAdvanceRequests.map((request) => (
                      <SelectItem key={request.id} value={request.id.toString()}>
                        {`${request.run_number || 'ไม่มีเลขที่'} - ${request.advance_activity_type || 'ไม่ระบุ'} - ${formatNumberWithCommas(request.amount)} บาท (${new Date(request.created_at).toLocaleDateString('th-TH')}) - สถานะ: ${getStatusText(request.status)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-600 text-base">
                    ไม่พบคำขอเบิกเงินล่วงหน้าที่ได้รับการอนุมัติแล้ว
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ส่วนที่ 1: ข้อมูลทั่วไป */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">ข้อมูลทั่วไป</h3>

            {/* แผนกและเขต */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="form-label">แผนก</label>
                <Input
                  placeholder="แผนก"
                  className="form-input bg-gray-100 cursor-not-allowed"
                  maxLength={255}
                  disabled={true}
                  value={watch('advanceDepartment') || employeeData?.Team || ''}
                  readOnly
                />
                <input
                  type="hidden"
                  {...register('advanceDepartment', {
                    required: 'กรุณาเลือกแผนก'
                  })}
                />
                {errors.advanceDepartment && (
                  <p className="text-red-500 text-base mt-1">{errors.advanceDepartment.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="form-label">เขต</label>
                <Input
                  placeholder="เขต"
                  className="form-input bg-gray-100 cursor-not-allowed"
                  maxLength={255}
                  disabled={true}
                  value={watch('advanceDistrict') || ''}
                  readOnly
                />
                <input
                  type="hidden"
                  {...register('advanceDistrict')}
                />
              </div>
            </div>

            {/* ฟิลด์ระบุแผนกอื่นๆ */}
            {watch('advanceDepartment') === 'อื่นๆ' && (
              <div className="space-y-2">
                <label className="form-label">โปรดระบุแผนก</label>
                <Input
                  placeholder="ระบุแผนกอื่นๆ"
                  className="form-input"
                  maxLength={255}
                  {...register('advanceActivityOther', {
                    required: watch('advanceDepartment') === 'อื่นๆ' ? 'กรุณาระบุแผนก' : false
                  })}
                />
                {errors.advanceActivityOther && (
                  <p className="text-red-500 text-base mt-1">{errors.advanceActivityOther.message}</p>
                )}
              </div>
            )}

            {/* ประเภทกิจกรรม */}
            <div className="space-y-2">
              <label className="form-label">ประเภทกิจกรรม <span className="text-red-500">*</span></label>
              <Select
                onValueChange={(value) => setValue('advanceActivityType', value)}
                value={watch('advanceActivityType')}
                disabled={!!watch('originalAdvanceRequestId')}
              >
                <SelectTrigger className={`form-input ${watch('originalAdvanceRequestId') ? 'bg-gray-200 cursor-not-allowed text-gray-500' : ''}`}>
                  <SelectValue placeholder="เลือกประเภทกิจกรรม" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((activity) => (
                    <SelectItem key={activity.name} value={activity.name}>
                      {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register('advanceActivityType', {
                  required: 'กรุณาเลือกประเภทกิจกรรม'
                })}
              />
              {errors.advanceActivityType && (
                <p className="text-red-500 text-base mt-1">{errors.advanceActivityType.message}</p>
              )}
            </div>

            {/* รายละเอียดเพิ่มเติม */}
            <div className="space-y-2">
              <label className="form-label">โปรดระบุรายละเอียด <span className="text-red-500">*</span></label>
              <Textarea
                placeholder="ระบุรายละเอียด"
                className="form-input"
                rows={3}
                maxLength={255}
                {...register('details', { required: 'กรุณาระบุรายละเอียด' })}
              />
              {errors.details && (
                <p className="text-red-500 text-base mt-1">{errors.details.message}</p>
              )}
            </div>
            


            {/* วันที่และจำนวนผู้เข้าร่วม */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="form-label">วันที่เริ่มกิจกรรม</label>
                <Input
                  type="date"
                  className="form-input"
                  {...register('startDate', {
                    required: 'กรุณาระบุวันที่เริ่มกิจกรรม'
                  })}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-base mt-1">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="form-label">วันที่สิ้นสุดกิจกรรม</label>
                <Input
                  type="date"
                  className="form-input"
                  {...register('endDate')}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-base mt-1">{errors.endDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="form-label">จำนวนผู้เข้าร่วม</label>
                <Input
                  type="number"
                  min="1"
                  placeholder=""
                  className="form-input"
                  {...register('advanceParticipants', {
                    required: 'กรุณาระบุจำนวนผู้เข้าร่วม',
                    min: { value: 1, message: 'จำนวนผู้เข้าร่วมต้องมากกว่า 0' }
                  })}
                />
                {errors.advanceParticipants && (
                  <p className="text-red-500 text-base mt-1">{errors.advanceParticipants.message}</p>
                )}
              </div>
            </div>

            {/* Dealer/Subdealer Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <label className="form-label">
                  ดีลเลอร์
                  {watch('advanceActivityType') !== 'ค่ารับรองลูกค้า/ของขวัญร้านค้า' &&
                   watch('advanceActivityType') !== 'ค่าน้ำมันรถทดแทน ' && (
                    <span className="text-red-500"> *</span>
                  )}
                </label>
                <Input
                  placeholder="ค้นหาดีลเลอร์..."
                  className="form-input"
                  maxLength={255}
                  value={dealerSearchTerm}
                  onChange={(e) => {
                    setDealerSearchTerm(e.target.value);
                    setValue('advanceDealerName', e.target.value);
                    setIsDealerFieldsLocked(false);
                  }}
                  onFocus={() => {
                    if (dealerSearchTerm && filteredDealers.length > 0) {
                      setShowDealerDropdown(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowDealerDropdown(false), 200);
                  }}
                />
                <input
                  type="hidden"
                  {...register('advanceDealerName', {
                    validate: (value) => {
                      const activityType = watch('advanceActivityType');
                      if (activityType === 'ค่ารับรองลูกค้า/ของขวัญร้านค้า' || activityType === 'ค่าน้ำมันรถทดแทน ') {
                        return true;
                      }
                      return value && value.trim() !== '' ? true : 'กรุณาระบุชื่อดีลเลอร์';
                    }
                  })}
                />
                {errors.advanceDealerName && (
                  <p className="text-red-500 text-base mt-1">{errors.advanceDealerName.message}</p>
                )}
                {/* Autocomplete Dropdown */}
                {showDealerDropdown && filteredDealers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredDealers.map((dealer, index) => (
                      <div
                        key={`${dealer.No}-${index}`}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          console.log('🔍 Dealer selected:', dealer.Name);
                          setDealerSearchTerm(dealer.Name);
                          setValue('advanceDealerName', dealer.Name);
                          if (dealer.City) {
                            setValue('advanceAmphur', dealer.City);
                            console.log('✅ Set amphur to:', dealer.City);
                          }
                          if (dealer.County) {
                            setValue('advanceProvince', dealer.County);
                            console.log('✅ Set province to:', dealer.County);
                          }
                          if (dealer.City || dealer.County) {
                            setIsDealerFieldsLocked(true);
                          }
                          setShowDealerDropdown(false);
                        }}
                      >
                        <div className="font-medium text-base">{dealer.Name}</div>
                        {(dealer.City || dealer.County) && (
                          <div className="text-sm text-gray-500">
                            {dealer.City && dealer.County ? `${dealer.City}, ${dealer.County}` : dealer.City || dealer.County}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="form-label">ซับดีลเลอร์</label>
                <Input
                  placeholder="ระบุซับดีลเลอร์"
                  className="form-input"
                  maxLength={255}
                  {...register('advanceSubdealerName')}
                />
              </div>
            </div>

            {/* สถานที่ อำเภอ และจังหวัด */}
            <div className="grid grid-cols-3 gap-4">
              

              <div className="space-y-2">
                <label className="form-label">
                  อำเภอ
                  {watch('advanceActivityType') !== 'ค่าน้ำมันรถทดแทน ' && (
                    <span className="text-red-500"> *</span>
                  )}
                </label>
                <Input
                  placeholder={watch('advanceActivityType') === 'ค่าน้ำมันรถทดแทน ' ? '-' : 'ระบุอำเภอ'}
                  className={`form-input ${(watch('advanceActivityType') === 'ค่าน้ำมันรถทดแทน ' || isDealerFieldsLocked) ? 'bg-gray-200 cursor-not-allowed text-gray-500' : ''}`}
                  maxLength={255}
                  value={watch('advanceActivityType') === 'ค่าน้ำมันรถทดแทน ' ? '' : (watch('advanceAmphur') || '')}
                  onChange={(e) => setValue('advanceAmphur', e.target.value)}
                  disabled={watch('advanceActivityType') === 'ค่าน้ำมันรถทดแทน ' || isDealerFieldsLocked}
                />
                <input
                  type="hidden"
                  {...register('advanceAmphur', {
                    validate: (value) => {
                      const activityType = watch('advanceActivityType');
                      if (activityType === 'ค่าน้ำมันรถทดแทน ') {
                        return true;
                      }
                      return value && value.trim() !== '' ? true : 'กรุณาระบุอำเภอ';
                    }
                  })}
                />
                {errors.advanceAmphur && (
                  <p className="text-red-500 text-base mt-1">{errors.advanceAmphur.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="form-label">
                  จังหวัด
                  {watch('advanceActivityType') !== 'ค่าน้ำมันรถทดแทน ' && (
                    <span className="text-red-500"> *</span>
                  )}
                </label>
                <Input
                  placeholder={watch('advanceActivityType') === 'ค่าน้ำมันรถทดแทน ' ? '-' : 'ระบุจังหวัด'}
                  className={`form-input ${(watch('advanceActivityType') === 'ค่าน้ำมันรถทดแทน ' || isDealerFieldsLocked) ? 'bg-gray-200 cursor-not-allowed text-gray-500' : ''}`}
                  maxLength={255}
                  value={watch('advanceActivityType') === 'ค่าน้ำมันรถทดแทน ' ? '' : (watch('advanceProvince') || '')}
                  onChange={(e) => setValue('advanceProvince', e.target.value)}
                  disabled={watch('advanceActivityType') === 'ค่าน้ำมันรถทดแทน ' || isDealerFieldsLocked}
                />
                <input
                  type="hidden"
                  {...register('advanceProvince', {
                    validate: (value) => {
                      const activityType = watch('advanceActivityType');
                      if (activityType === 'ค่าน้ำมันรถทดแทน ') {
                        return true;
                      }
                      return value && value.trim() !== '' ? true : 'กรุณาระบุจังหวัด';
                    }
                  })}
                />
                {errors.advanceProvince && (
                  <p className="text-red-500 text-base mt-1">{errors.advanceProvince.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* ส่วนที่ 2: รายละเอียดค่าใช้จ่ายจริง */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">รายละเอียดค่าใช้จ่ายจริง</h3>
              <Button
                type="button"
                onClick={() => appendExpense({ name: '', taxRate: 0, requestAmount: 0, usedAmount: 0, vatAmount: 0, taxAmount: 0, netAmount: 0, refund: 0, otherDescription: '' })}
                variant="outline"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มรายการ
              </Button>
            </div>

            {/* ตารางรายการค่าใช้จ่าย */}
            <div className="overflow-x-auto relative">
              <table className="border-collapse border border-gray-300" style={{minWidth: '1200px'}}>
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 py-2 text-base font-medium sticky left-0 z-20 bg-gray-50 min-w-[50px]">ลำดับ</th>
                    <th className="border border-gray-300 px-2 py-2 text-base font-medium sticky z-20 bg-gray-50 min-w-[200px]" style={{left: 50}}>ชื่อรายการ</th>
                    <th className="border border-gray-300 px-2 py-2 text-base font-medium sticky z-20 bg-gray-50 min-w-[80px]" style={{left: 250}}>อัตราภาษี</th>
                    <th className="border border-gray-300 px-2 py-2 text-base font-medium sticky z-20 bg-gray-50 min-w-[130px]" style={{left: 330, boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)'}}>จำนวนเบิก</th>
                    <th className="border border-gray-300 px-2 py-2 text-base font-medium min-w-[130px]">จำนวนใช้<br/>(ก่อนภาษีมูลค่าเพิ่ม)</th>
                    <th className="border border-gray-300 px-2 py-2 text-base font-medium min-w-[120px]">ภาษีมูลค่าเพิ่ม</th>
                    <th className="border border-gray-300 px-2 py-2 text-base font-medium min-w-[120px]">ภาษีหัก ณ ที่จ่าย</th>
                    <th className="border border-gray-300 px-2 py-2 text-base font-medium min-w-[140px]">รวมจำนวนเงินทั้งสิ้น</th>
                    <th className="border border-gray-300 px-2 py-2 text-base font-medium min-w-[140px]">คืนเงินบริษัท(+)<br/>เบิกเงินบริษัท(-)</th>
                    <th className="border border-gray-300 px-2 py-2 text-base font-medium min-w-[50px]"><Trash2 className="h-4 w-4 mx-auto text-gray-500" /></th>
                  </tr>
                </thead>
                <tbody>
                  {expenseFields.map((field, index) => (
                    <tr key={field.id}>
                      {/* ลำดับ */}
                      <td className="border border-gray-300 p-1 text-center sticky left-0 z-10 bg-white min-w-[50px]">
                        <span className="font-medium">{index + 1}</span>
                      </td>
                      {/* ชื่อรายการ */}
                      <td className="border border-gray-300 p-1 sticky z-10 bg-white min-w-[200px]" style={{left: 50}}>
                        <div className="space-y-2">
                          {(() => {
                            const currentName = watch(`expenseClearingItems.${index}.name`) || '';
                            const isInCategories = EXPENSE_CLEARING_CATEGORIES.some(cat => cat.name === currentName);
                            
                            // If name from DB is not in categories, show it as read-only text
                            if (currentName && !isInCategories) {
                              return (
                                <>
                                  <div className="text-base font-medium text-gray-700 p-2 bg-gray-50 rounded border border-gray-300 min-w-[200px]">
                                    {currentName}
                                  </div>
                                  <input
                                    type="hidden"
                                    {...register(`expenseClearingItems.${index}.name` as const)}
                                  />
                                </>
                              );
                            }
                            
                            // Normal select for categories
                            return (
                              <>
                                <Select
                                  onValueChange={(value) => {
                                    const selectedCategory = EXPENSE_CLEARING_CATEGORIES.find(cat => cat.name === value);
                                    setValue(`expenseClearingItems.${index}.name`, value);
                                    if (selectedCategory) {
                                      setValue(`expenseClearingItems.${index}.taxRate`, selectedCategory.taxRate);
                                    }
                                    if (value !== 'ค่าใช้จ่ายอื่น ๆ (โปรดระบุรายละเอียด)') {
                                      setValue(`expenseClearingItems.${index}.otherDescription`, '');
                                    }
                                  }}
                                  value={currentName}
                                >
                                  <SelectTrigger className="w-full min-w-[200px]">
                                    <SelectValue placeholder="เลือกรายการ" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {EXPENSE_CLEARING_CATEGORIES.map((category) => (
                                      <SelectItem key={category.name} value={category.name}>
                                        <span className="flex items-center gap-1">
                                          {category.name}
                                          {category.hasInfo && (
                                            <Info className="h-3 w-3 text-blue-500" />
                                          )}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <input
                                  type="hidden"
                                  {...register(`expenseClearingItems.${index}.name` as const)}
                                />
                              </>
                            );
                          })()}
                          {/* Info button for lottery prize category */}
                          {watch(`expenseClearingItems.${index}.name`) === 'ค่าของรางวัลเพื่อการชิงโชค' && (
                            <button
                              type="button"
                              onClick={() => setShowLotteryInfoModal(true)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mt-1"
                            >
                              <Info className="h-4 w-4" />
                              <span>ดูข้อมูลเพิ่มเติม</span>
                            </button>
                          )}
                          {watch(`expenseClearingItems.${index}.name`) === 'ค่าใช้จ่ายอื่น ๆ (โปรดระบุรายละเอียด)' && (
                            <Input
                              placeholder="ระบุรายละเอียด"
                              className="w-full text-base"
                              {...register(`expenseClearingItems.${index}.otherDescription` as const, {
                                required: watch(`expenseClearingItems.${index}.name`) === 'ค่าใช้จ่ายอื่น ๆ (โปรดระบุรายละเอียด)' ? 'กรุณาระบุรายละเอียด' : false
                              })}
                            />
                          )}
                        </div>
                      </td>
                      {/* อัตราภาษี */}
                      <td className="border border-gray-300 p-1 sticky z-10 bg-white min-w-[80px]" style={{left: 250}}>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="w-full bg-gray-100 text-right"
                          placeholder="0"
                          value={watch(`expenseClearingItems.${index}.taxRate`) || 0}
                          readOnly
                        />
                        <input
                          type="hidden"
                          {...register(`expenseClearingItems.${index}.taxRate` as const)}
                        />
                      </td>
                      {/* จำนวนเบิก */}
                      <td className="border border-gray-300 p-1 sticky z-10 bg-white min-w-[130px]" style={{left: 330, boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)'}}>
                        <Input
                          type="text"
                          className="w-full text-right"
                          placeholder="ระบุจำนวนเงิน"
                          onChange={(e) => {
                            const formatted = formatInputWhileTyping(e.target.value);
                            e.target.value = formatted;
                            const numValue = parseFormattedNumber(formatted);
                            setValue(`expenseClearingItems.${index}.requestAmount`, numValue);
                          }}
                          onBlur={(e) => {
                            const numValue = parseFormattedNumber(e.target.value);
                            if (numValue >= 0) {
                              e.target.value = formatNumberOnBlur(numValue);
                              setValue(`expenseClearingItems.${index}.requestAmount`, numValue);
                            }
                          }}
                          defaultValue={formatNumberForInput(watch(`expenseClearingItems.${index}.requestAmount`))}
                        />
                        <input
                          type="hidden"
                          {...register(`expenseClearingItems.${index}.requestAmount` as const, {
                            valueAsNumber: true
                          })}
                        />
                      </td>
                      {/* จำนวนใช้ (ก่อนภาษีมูลค่าเพิ่ม) */}
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="text"
                          className="w-full text-right"
                          placeholder="ระบุจำนวนเงิน"
                          onChange={(e) => {
                            const formatted = formatInputWhileTyping(e.target.value);
                            e.target.value = formatted;
                            let numValue = parseFormattedNumber(formatted);
                            if (numValue > 999999) {
                              numValue = 999999;
                              e.target.value = formatNumberForInput(numValue);
                            }
                            setValue(`expenseClearingItems.${index}.usedAmount`, numValue);
                          }}
                          onBlur={(e) => {
                            let numValue = parseFormattedNumber(e.target.value);
                            if (numValue > 999999) {
                              numValue = 999999;
                            }
                            if (numValue >= 0) {
                              e.target.value = formatNumberOnBlur(numValue);
                              setValue(`expenseClearingItems.${index}.usedAmount`, numValue);
                            }
                          }}
                          defaultValue={formatNumberForInput(watch(`expenseClearingItems.${index}.usedAmount`))}
                        />
                        <input
                          type="hidden"
                          {...register(`expenseClearingItems.${index}.usedAmount` as const, {
                            valueAsNumber: true,
                            max: {
                              value: 999999,
                              message: 'จำนวนเงินต้องไม่เกิน 999,999'
                            }
                          })}
                        />
                      </td>
                      {/* ภาษีมูลค่าเพิ่ม (VAT) - Manual Entry */}
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="text"
                          className="w-full text-right"
                          placeholder="ระบุจำนวนเงิน"
                          onChange={(e) => {
                            const formatted = formatInputWhileTyping(e.target.value);
                            e.target.value = formatted;
                            const numValue = parseFormattedNumber(formatted);
                            setValue(`expenseClearingItems.${index}.vatAmount`, numValue);
                          }}
                          onBlur={(e) => {
                            const numValue = parseFormattedNumber(e.target.value);
                            if (numValue > 0) {
                              e.target.value = formatNumberOnBlur(numValue);
                              setValue(`expenseClearingItems.${index}.vatAmount`, numValue);
                            }
                          }}
                          defaultValue={formatNumberForInput(watch(`expenseClearingItems.${index}.vatAmount`))}
                        />
                        <input
                          type="hidden"
                          {...register(`expenseClearingItems.${index}.vatAmount` as const, { valueAsNumber: true })}
                        />
                      </td>
                      {/* ภาษีหัก ณ ที่จ่าย */}
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="text"
                          className="w-full bg-gray-100 text-right"
                          placeholder="0.00"
                          value={formatNumberWithCommas(watch(`expenseClearingItems.${index}.taxAmount`))}
                          readOnly
                        />
                        <input
                          type="hidden"
                          {...register(`expenseClearingItems.${index}.taxAmount` as const)}
                        />
                      </td>
                      {/* รวมจำนวนเงินทั้งสิ้น */}
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="text"
                          className="w-full bg-gray-100 font-semibold text-right"
                          placeholder="0.00"
                          value={formatNumberWithCommas(watch(`expenseClearingItems.${index}.netAmount`))}
                          readOnly
                        />
                        <input
                          type="hidden"
                          {...register(`expenseClearingItems.${index}.netAmount` as const)}
                        />
                      </td>
                      {/* คืนเงินบริษัท(+) เบิกเงินบริษัท(-) */}
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="text"
                          className={`w-full text-right ${
                            (watch(`expenseClearingItems.${index}.refund`) || 0) >= 0
                              ? 'bg-green-50'
                              : 'bg-red-50'
                          }`}
                          placeholder="0.00"
                          value={formatNumberWithCommas(watch(`expenseClearingItems.${index}.refund`))}
                          readOnly
                        />
                        <input
                          type="hidden"
                          {...register(`expenseClearingItems.${index}.refund` as const)}
                        />
                      </td>
                      {/* จัดการ */}
                      <td className="border border-gray-300 p-1 text-center">
                        {expenseFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExpense(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Row รวม */}
                  <tr className="font-semibold">
                    <td className="border border-gray-300 px-2 py-2 text-center sticky left-0 z-10 bg-blue-50" colSpan={2} style={{minWidth: 250}}>รวม</td>
                    <td className="border border-gray-300 px-2 py-2 sticky z-10 bg-blue-50" style={{left: 250}}></td>
                    <td className="border border-gray-300 px-2 py-2 text-right sticky z-10 bg-blue-50" style={{left: 330, boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)'}}>
                      {(() => {
                        const expenseItems = watchedExpenseItems || [];
                        const total = expenseItems.reduce((sum, item) => {
                          const requestAmount = typeof item.requestAmount === 'string'
                            ? parseFloat(item.requestAmount) || 0
                            : Number(item.requestAmount) || 0;
                          return sum + requestAmount;
                        }, 0);
                        return formatNumberWithCommas(total);
                      })()}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right bg-blue-50">
                      {(() => {
                        const expenseItems = watchedExpenseItems || [];
                        const total = expenseItems.reduce((sum, item) => {
                          const usedAmount = typeof item.usedAmount === 'string'
                            ? parseFloat(item.usedAmount) || 0
                            : Number(item.usedAmount) || 0;
                          return sum + usedAmount;
                        }, 0);
                        return formatNumberWithCommas(total);
                      })()}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right bg-blue-50">
                      {(() => {
                        const expenseItems = watchedExpenseItems || [];
                        const total = expenseItems.reduce((sum, item) => {
                          const vatAmount = typeof item.vatAmount === 'string'
                            ? parseFloat(item.vatAmount) || 0
                            : Number(item.vatAmount) || 0;
                          return sum + vatAmount;
                        }, 0);
                        return formatNumberWithCommas(total);
                      })()}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right bg-blue-50">
                      {(() => {
                        const expenseItems = watchedExpenseItems || [];
                        const total = expenseItems.reduce((sum, item) => {
                          const taxAmount = typeof item.taxAmount === 'string'
                            ? parseFloat(item.taxAmount) || 0
                            : Number(item.taxAmount) || 0;
                          return sum + taxAmount;
                        }, 0);
                        return formatNumberWithCommas(total);
                      })()}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right bg-blue-50">
                      {(() => {
                        const expenseItems = watchedExpenseItems || [];
                        const total = expenseItems.reduce((sum, item) => {
                          const netAmount = typeof item.netAmount === 'string'
                            ? parseFloat(item.netAmount) || 0
                            : Number(item.netAmount) || 0;
                          return sum + netAmount;
                        }, 0);
                        return formatNumberWithCommas(total);
                      })()}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right bg-blue-50">
                      {(() => {
                        const total = calculateTotalRefund(); // Calculate in real-time
                        const isNegative = total < 0;
                        return (
                          <span className={isNegative ? 'text-red-700 font-bold' : 'text-green-700 font-bold'}>
                            {formatNumberWithCommas(total)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 bg-blue-50"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Refund Amount Display */}
            <div className="flex justify-end">
              {(() => {
                const amount = calculateTotalRefund(); // Calculate in real-time
                const isNegative = amount < 0;
                const isPositive = amount > 0;

                return (
                  <div className={`border rounded-lg p-4 min-w-[200px] ${
                    isNegative
                      ? 'bg-red-50 border-red-200'
                      : isPositive
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`text-base font-medium ${
                      isNegative
                        ? 'text-red-600'
                        : isPositive
                          ? 'text-green-600'
                          : 'text-gray-600'
                    }`}>
                      {isNegative ? 'เบิกเงินบริษัท' : 'คืนเงินบริษัท'}
                    </div>
                    <div className={`text-3xl font-bold ${
                      isNegative
                        ? 'text-red-800'
                        : isPositive
                          ? 'text-green-800'
                          : 'text-gray-800'
                    }`}>
                      {isNegative ? '-' : ''}{formatNumberWithCommas(Math.abs(amount))} บาท
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          

          {/* ข้อมูลบัญชีธนาคารสำหรับโอนให้ผู้ค้าหรือบุคคลภายนอก */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">ข้อมูลบัญชีธนาคารสำหรับโอนให้ผู้ค้าหรือบุคคลภายนอก</h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="form-label">ชื่อบัญชี <span className="text-red-500">*</span></label>
                <Input
                  placeholder="ระบุชื่อบัญชีธนาคาร"
                  className={`form-input ${watch('originalAdvanceRequestId') ? 'bg-gray-200 cursor-not-allowed text-gray-500' : ''}`}
                  readOnly={!!watch('originalAdvanceRequestId')}
                  {...register('bankAccountName', { required: 'กรุณาระบุชื่อบัญชี' })}
                />
                {errors.bankAccountName && (
                  <p className="text-red-500 text-base mt-1">{errors.bankAccountName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="form-label">ธนาคาร <span className="text-red-500">*</span></label>
                <Select
                  onValueChange={(value) => setValue('bankName', value)}
                  value={watch('bankName')}
                  disabled={!!watch('originalAdvanceRequestId')}
                >
                  <SelectTrigger className={`form-input ${watch('originalAdvanceRequestId') ? 'bg-gray-200 cursor-not-allowed text-gray-500' : ''}`}>
                    <SelectValue placeholder="เลือกธนาคาร" />
                  </SelectTrigger>
                  <SelectContent>
                    {THAI_BANKS.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="hidden"
                  {...register('bankName', { required: 'กรุณาเลือกธนาคาร' })}
                />
                {errors.bankName && (
                  <p className="text-red-500 text-base mt-1">{errors.bankName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="form-label">เลขที่บัญชี <span className="text-red-500">*</span></label>
                <Input
                  placeholder="ระบุเลขที่บัญชีธนาคาร"
                  className={`form-input ${watch('originalAdvanceRequestId') ? 'bg-gray-200 cursor-not-allowed text-gray-500' : ''}`}
                  readOnly={!!watch('originalAdvanceRequestId')}
                  maxLength={15}
                  {...register('bankAccountNumber', {
                    required: 'กรุณาระบุเลขที่บัญชี',
                    pattern: {
                      value: /^[0-9-]+$/,
                      message: 'เลขที่บัญชีต้องเป็นตัวเลขเท่านั้น'
                    },
                    maxLength: {
                      value: 15,
                      message: 'เลขที่บัญชีต้องไม่เกิน 15 หลัก'
                    }
                  })}
                />
                {errors.bankAccountNumber && (
                  <p className="text-red-500 text-base mt-1">{errors.bankAccountNumber.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* แนบไฟล์เอกสาร - Checkbox Based */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">แนบเอกสารประกอบ</h3>
            <p className="text-base text-gray-600">เลือกประเภทเอกสารที่ต้องการแนบ แล้วอัพโหลดไฟล์</p>

            <div className="grid grid-cols-1 gap-4">
              {DOCUMENT_TYPES.map((docType) => (
                <div key={docType.key} className="border rounded-lg p-4 bg-white">
                  {/* Checkbox for document type */}
                  <div className="flex items-center space-x-3 mb-3">
                    <input
                      type="checkbox"
                      id={`doc-${docType.key}`}
                      checked={documentSelections[docType.key]}
                      onChange={() => handleDocumentCheckboxChange(docType.key)}
                      className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                    />
                    <label
                      htmlFor={`doc-${docType.key}`}
                      className="text-base font-medium text-gray-700 cursor-pointer"
                    >
                      {docType.label}
                    </label>
                  </div>

                  {/* File upload area - shown when checkbox is checked */}
                  {documentSelections[docType.key] && (
                    <div className="mt-2 space-y-2">
                      {/* Special handling for photo type - max 4 photos with descriptions */}
                      {docType.key === 'photo' ? (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-500">อัพโหลดได้สูงสุด 4 รูป พร้อมรายละเอียดแต่ละรูป</p>
                          <div className="grid grid-cols-2 gap-4">
                            {[0, 1, 2, 3].map((photoIndex) => (
                              <div key={photoIndex} className="border rounded-lg p-3 bg-gray-50">
                                <div className="text-sm font-medium text-gray-700 mb-2">รูปที่ {photoIndex + 1}</div>

                                {/* Photo upload or preview */}
                                {documentFiles.photo[photoIndex] ? (
                                  <div className="space-y-2">
                                    <div className="relative">
                                      <img
                                        src={documentFiles.photo[photoIndex]}
                                        alt={`รูปที่ ${photoIndex + 1}`}
                                        className="w-full h-32 object-cover rounded border"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          // Remove photo at this index
                                          const newPhotos = [...documentFiles.photo];
                                          newPhotos.splice(photoIndex, 1);
                                          setDocumentFiles(prev => ({ ...prev, photo: newPhotos }));
                                          // Also shift descriptions
                                          const newDescs = [...photoDescriptions];
                                          newDescs.splice(photoIndex, 1);
                                          newDescs.push('');
                                          setPhotoDescriptions(newDescs);
                                        }}
                                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white h-6 w-6 p-0 rounded-full"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    {/* Description input */}
                                    <Input
                                      type="text"
                                      placeholder="รายละเอียดรูปภาพ..."
                                      value={photoDescriptions[photoIndex] || ''}
                                      onChange={(e) => {
                                        const newDescs = [...photoDescriptions];
                                        newDescs[photoIndex] = e.target.value;
                                        setPhotoDescriptions(newDescs);
                                      }}
                                      className="text-sm"
                                    />
                                  </div>
                                ) : (
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 bg-white">
                                    <label htmlFor={`photo-${photoIndex}`} className="cursor-pointer block text-center">
                                      <Paperclip className="mx-auto h-5 w-5 text-gray-400" />
                                      <span className="mt-1 block text-sm text-gray-500">
                                        คลิกเพื่อเลือกรูป
                                      </span>
                                      <input
                                        id={`photo-${photoIndex}`}
                                        type="file"
                                        className="sr-only"
                                        accept=".jpg,.jpeg,.png"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;

                                          try {
                                            const fileExt = file.name.split('.').pop();
                                            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                                            const filePath = `${user?.id || 'anonymous'}/photos/${fileName}`;

                                            const { data, error } = await supabase.storage
                                              .from('welfare-attachments')
                                              .upload(filePath, file);

                                            if (error) throw error;

                                            const { data: { publicUrl } } = supabase.storage
                                              .from('welfare-attachments')
                                              .getPublicUrl(data.path);

                                            // Insert photo at the correct index
                                            const newPhotos = [...documentFiles.photo];
                                            newPhotos[photoIndex] = publicUrl;
                                            // Remove undefined gaps
                                            const filteredPhotos = newPhotos.filter(Boolean);
                                            setDocumentFiles(prev => ({ ...prev, photo: filteredPhotos }));

                                            toast({
                                              title: "อัพโหลดสำเร็จ",
                                              description: `อัพโหลดรูปที่ ${photoIndex + 1} เรียบร้อยแล้ว`,
                                            });
                                          } catch (error: any) {
                                            console.error('Error uploading photo:', error);
                                            toast({
                                              title: "เกิดข้อผิดพลาด",
                                              description: `ไม่สามารถอัปโหลดรูปได้: ${error.message}`,
                                              variant: "destructive",
                                            });
                                          }
                                          e.target.value = '';
                                        }}
                                      />
                                    </label>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Standard file upload for other document types */
                        <>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 bg-gray-50">
                            <label htmlFor={`file-${docType.key}`} className="cursor-pointer block text-center">
                              <Paperclip className="mx-auto h-6 w-6 text-gray-400" />
                              <span className="mt-1 block text-sm text-gray-600">
                                คลิกเพื่อเลือกไฟล์
                              </span>
                              <input
                                id={`file-${docType.key}`}
                                type="file"
                                className="sr-only"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => handleDocumentFileChange(e, docType.key)}
                              />
                            </label>
                          </div>

                          {/* Show uploaded files for this document type */}
                          {documentFiles[docType.key].length > 0 && (
                            <div className="space-y-1">
                              {documentFiles[docType.key].map((fileUrl, index) => {
                                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
                                return (
                                  <div key={index} className="space-y-2">
                                    <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                                      <div className="flex items-center space-x-2">
                                        <Check className="h-4 w-4 text-green-600" />
                                        <a
                                          href={fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-green-700 hover:text-green-900 underline truncate max-w-[150px]"
                                        >
                                          ไฟล์ {index + 1}
                                        </a>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveDocumentFile(docType.key, index)}
                                        className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    {isImage && (
                                      <div className="pl-6">
                                        <img
                                          src={fileUrl}
                                          alt={`Preview ${index + 1}`}
                                          className="max-w-[200px] max-h-[200px] rounded border border-gray-300"
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary of uploaded documents */}
            {Object.values(documentFiles).some(files => files.length > 0) && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-base font-medium text-blue-800 mb-2">สรุปเอกสารที่แนบ:</h4>
                <div className="space-y-1">
                  {DOCUMENT_TYPES.filter(dt => documentFiles[dt.key].length > 0).map(dt => (
                    <div key={dt.key} className="flex items-center text-sm text-blue-700">
                      <Check className="h-3 w-3 mr-2" />
                      {dt.label}: {documentFiles[dt.key].length} ไฟล์
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ปุ่มส่งคำร้อง */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={saveDraft}
              disabled={isSavingDraft}
              className="border-amber-500 text-amber-600 hover:bg-amber-50"
            >
              {isSavingDraft ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  บันทึกฉบับร่าง
                </>
              )}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังส่งคำร้อง...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  ส่งคำร้องเคลียร์ค่าใช้จ่าย
                </>
              )}
            </Button>
          </div>
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
        userName={employeeData?.Name || user?.email || ''}
      />

      {/* Lottery Prize Info Modal */}
      {showLotteryInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">ข้อมูลสำคัญ: ค่าของรางวัลเพื่อการชิงโชค</h3>
              </div>
              <button
                onClick={() => setShowLotteryInfoModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>ของรางวัลชิงโชค</strong> คือ ของรางวัลที่มีมูลค่า/ชิ้น ตั้งแต่ <strong className="text-red-600">1,000 บาท</strong> ขึ้นไป
              </p>
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700 text-base">
                  <strong>คำเตือน:</strong> ต้องขออนุญาตชิงโชค หากไม่ได้รับอนุญาต แล้วจัดกิจกรรม มีความผิดตามกฎหมาย อาจได้รับโทษปรับและ/หรือจำคุก
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setShowLotteryInfoModal(false)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                รับทราบ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}