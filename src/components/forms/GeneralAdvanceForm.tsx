import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useWelfare } from '@/context/WelfareContext';
import { ArrowLeft, AlertCircle, Plus, X, Paperclip, Check, Loader2, Trash2, Info, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { generateAdvancePDF } from '../pdf/AdvancePDFGenerator';
import { uploadPDFToSupabase } from '@/utils/pdfUtils';
import { DigitalSignature } from '../signature/DigitalSignature';
import { formatNumberWithCommas, parseFormattedNumber, formatNumberForInput, formatNumberOnBlur, formatInputWhileTyping } from '@/utils/numberFormat';

interface GeneralAdvanceFormProps {
  onBack: () => void;
  editId?: number | null;
}

// General advance form specific interface
interface GeneralAdvanceFormValues {
  startDate: string;
  endDate?: string;
  amount: number;
  details: string;
  title?: string;
  attachments?: FileList;

  // General Advance (เบิกเงินล่วงหน้าทั่วไป) fields
  advanceDepartment: string; // แผนก
  advanceDepartmentOther?: string; // ระบุแผนกอื่นๆ
  advanceActivityType: string; // ประเภทกิจกรรม
  advanceActivityOther?: string; // ระบุกิจกรรมอื่นๆ
  advanceEventDate?: string; // วันที่จัด
  advanceParticipants: number; // จำนวนผู้เข้าร่วม
  advanceDailyRate?: number;
  advanceAccommodationCost?: number;
  advanceTransportationCost?: number;
  advanceMealAllowance?: number;
  advanceOtherExpenses?: number;
  advanceProjectName?: string;
  advanceProjectLocation?: string;
  
  // Bank account information
  bankAccountName?: string; // ชื่อบัญชี
  bankName?: string; // ธนาคาร
  bankAccountNumber?: string; // เลขที่บัญชี

  // General advance expense items
  advanceExpenseItems: {
    name: string;
    taxRate: number;
    requestAmount: number;
    taxAmount: number;
    netAmount: number;
    otherDescription?: string; // For "อุปกรณ์และอื่นๆ" specification
  }[];



  // Document selections for advance types
  attachmentSelections?: {
    receipt?: boolean; // ใบเสร็จรับเงิน
    idCardCopy?: boolean; // สำเนาบัตรประชาชน
    bankBookCopy?: boolean; // สำเนาบัญชีธนาคาร
    other?: boolean; // อื่นๆ
    otherText?: string; // ระบุอื่นๆ
  };
}

// Generate run number for general advance requests
const generateGeneralAdvanceRunNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp for uniqueness
  return `GADV${year}${month}${timestamp}`;
};

// รายการค่าใช้จ่ายเบิกเงินล่วงหน้าทั่วไป
const GENERAL_ADVANCE_EXPENSE_CATEGORIES = [
  { name: 'ค่าอาหาร และ เครื่องดื่ม', taxRate: 0, hasInfo: false },
  { name: 'ค่าที่พัก', taxRate: 0, hasInfo: false },
  { name: 'ค่าเช่าสถานที่', taxRate: 5, hasInfo: false },
  { name: 'งบสนับสนุนร้านค้า', taxRate: 3, hasInfo: false },
  { name: 'ค่าบริการ /ค่าจ้างทำป้าย /ค่าจ้างอื่น ๆ', taxRate: 3, hasInfo: false },
  { name: 'ค่าวงดนตรี / เครื่องเสียง / MC', taxRate: 3, hasInfo: false },
  { name: 'ค่าของรางวัลเพื่อการชิงโชค', taxRate: 5, hasInfo: true, infoText: 'ของรางวัลชิงโชค คือ ของรางวัลที่มีมูลค่า/ชิ้น ตั้งแต่ 1,000 บาท ขึ้นไป (ต้องขออนุญาตชิงโชค หากไม่ได้รับอนุญาต แล้วจัดกิจกรรม มีความผิดตามกฎหมาย อาจได้รับโทษปรับและ/หรือจำคุก)' },
  { name: 'ค่าว่าจ้างโฆษณาทางวิทยุ', taxRate: 2, hasInfo: false },
  { name: 'ค่าขนส่ง', taxRate: 1, hasInfo: true, infoText: 'กรณีจดทะเบียนประเภทธุรกิจขนส่ง' },
  { name: 'ค่าน้ำมัน', taxRate: 0, hasInfo: false },
  { name: 'ค่าใช้จ่ายอื่น ๆ (โปรดระบุรายละเอียด)', taxRate: 0, hasInfo: false }
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
  'ธนาคารพัฒนาวิสาหกิจขนาดกลางและขนาดย่อมแห่งประเทศไทย (SME Bank)',
  'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (BAAC)',
  'ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย (EXIM Bank)',
  'ธนาคารออมสิน (Government Savings Bank)',
  'ธนาคารอาคารสงเคราะห์ (Government Housing Bank)',
  'ธนาคารอิสลามแห่งประเทศไทย (Islamic Bank of Thailand)',
  'ธนาคารสแตนดาร์ดชาร์เตอร์ด (ไทย) (Standard Chartered Thailand)'
];

export function GeneralAdvanceForm({ onBack, editId }: GeneralAdvanceFormProps) {
  // รองรับ editId จาก prop (modal edit) หรือจาก query string (หน้า /Forms)
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

  // Document type files & checkbox state for advance form
  type GeneralAdvanceDocType = 'invoice' | 'bankbook';
  const GENERAL_ADVANCE_DOC_TYPES: { key: GeneralAdvanceDocType; label: string }[] = [
    { key: 'invoice', label: 'ใบแจ้งหนี้' },
    { key: 'bankbook', label: 'บุ๊คแบงค์' },
  ];

  const [documentFiles, setDocumentFiles] = useState<Record<GeneralAdvanceDocType, string[]>>({
    invoice: [],
    bankbook: [],
  });
  const [documentSelections, setDocumentSelections] = useState<Record<GeneralAdvanceDocType, boolean>>({
    invoice: false,
    bankbook: false,
  });
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [userSignature, setUserSignature] = useState<string>('');
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [showLotteryInfoModal, setShowLotteryInfoModal] = useState(false);
  const [showTransportInfoModal, setShowTransportInfoModal] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Draft key for localStorage
  const DRAFT_KEY = `general_advance_draft_${user?.email || 'anonymous'}`;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors }
  } = useForm<GeneralAdvanceFormValues>({
    defaultValues: {
      advanceExpenseItems: [{ name: '', taxRate: 0, requestAmount: 0, taxAmount: 0, netAmount: 0, otherDescription: '' }]
    }
  });

  const { fields: expenseFields, append: appendExpense, remove: removeExpense } = useFieldArray({
    control,
    name: "advanceExpenseItems"
  });

  // Save draft to localStorage
  const saveDraft = () => {
    setIsSavingDraft(true);
    try {
      const formData = watch();
      const draftData = {
        ...formData,
        files,
        documentFiles,
        documentSelections,
        savedAt: new Date().toISOString(),
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

  // Load draft from localStorage
  const loadDraft = () => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        // Reset form with draft data
        reset({
          startDate: draftData.startDate || '',
          endDate: draftData.endDate || '',
          amount: draftData.amount || 0,
          details: draftData.details || '',
          title: draftData.title || '',
          advanceDepartment: draftData.advanceDepartment || '',
          advanceDepartmentOther: draftData.advanceDepartmentOther || '',
          advanceActivityType: draftData.advanceActivityType || '',
          advanceActivityOther: draftData.advanceActivityOther || '',
          advanceEventDate: draftData.advanceEventDate || '',
          advanceParticipants: draftData.advanceParticipants || 0,
          advanceDailyRate: draftData.advanceDailyRate || 0,
          advanceAccommodationCost: draftData.advanceAccommodationCost || 0,
          advanceTransportationCost: draftData.advanceTransportationCost || 0,
          advanceMealAllowance: draftData.advanceMealAllowance || 0,
          advanceOtherExpenses: draftData.advanceOtherExpenses || 0,
          advanceProjectName: draftData.advanceProjectName || '',
          advanceProjectLocation: draftData.advanceProjectLocation || '',
          bankAccountName: draftData.bankAccountName || '',
          bankName: draftData.bankName || '',
          bankAccountNumber: draftData.bankAccountNumber || '',
          advanceExpenseItems: draftData.advanceExpenseItems || [{ name: '', taxRate: 0, requestAmount: 0, taxAmount: 0, netAmount: 0, otherDescription: '' }],
          attachmentSelections: draftData.attachmentSelections || {},
        });
        if (draftData.files) {
          setFiles(draftData.files);
        }
        if (draftData.documentFiles) {
          setDocumentFiles(draftData.documentFiles);
        }
        if (draftData.documentSelections) {
          setDocumentSelections(draftData.documentSelections);
        }
        toast({
          title: 'โหลดฉบับร่างสำเร็จ',
          description: `ข้อมูลฉบับร่างถูกโหลดเรียบร้อยแล้ว (บันทึกเมื่อ ${new Date(draftData.savedAt).toLocaleString('th-TH')})`,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading draft:', error);
      return false;
    }
  };

  // Clear draft from localStorage
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

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

  // Load draft when component mounts (only if not in edit mode)
  useEffect(() => {
    if (!editIdNum) {
      loadDraft();
    }
  }, []);

  // Load edit data if editId is provided
  useEffect(() => {
    const fetchEditData = async () => {
      if (editIdNum) {
        const { data, error } = await supabase
          .from('welfare_requests')
          .select('*')
          .eq('id', editIdNum)
          .single();

        if (!error && data) {
          const dbData = data as any;
          reset({
            amount: dbData.amount,
            details: dbData.details || '',
            title: dbData.title || '',
            startDate: dbData.start_date || '',
            endDate: dbData.end_date || '',
            // General advance fields
            advanceDepartment: dbData.advance_department || '',
            advanceDepartmentOther: dbData.advance_department_other || '',
            advanceActivityType: dbData.advance_activity_type || '',
            advanceActivityOther: dbData.advance_activity_other || '',
            advanceEventDate: dbData.advance_event_date || '',
            advanceParticipants: dbData.advance_participants || 0,
            advanceDailyRate: dbData.advance_daily_rate || 0,
            advanceAccommodationCost: dbData.advance_accommodation_cost || 0,
            advanceTransportationCost: dbData.advance_transportation_cost || 0,
            advanceMealAllowance: dbData.advance_meal_allowance || 0,
            advanceOtherExpenses: dbData.advance_other_expenses || 0,
            advanceProjectName: dbData.advance_project_name || '',
            advanceProjectLocation: dbData.advance_project_location || '',
            // Bank account information
            bankAccountName: dbData.bank_account_name || '',
            bankName: dbData.bank_name || '',
            bankAccountNumber: dbData.bank_account_number || '',
            advanceExpenseItems: dbData.advance_expense_items ? 
              JSON.parse(dbData.advance_expense_items).map((item: any) => ({
                ...item,
                requestAmount: Number(item.requestAmount) || 0,
                taxRate: Number(item.taxRate) || 0,
                taxAmount: Number(item.taxAmount) || 0,
                netAmount: Number(item.netAmount) || 0,
                otherDescription: item.otherDescription || ''
              })) : [{ name: '', taxRate: 0, requestAmount: 0, taxAmount: 0, netAmount: 0, otherDescription: '' }],
            // Document selections
            attachmentSelections: dbData.attachment_selections ? JSON.parse(dbData.attachment_selections) : {},
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
  }, [editIdNum, reset]);

  // Watch expense items for real-time updates
  const watchedExpenseItems = watch('advanceExpenseItems');
  
  // Watch individual request amounts for immediate calculation
  const watchedRequestAmounts = watchedExpenseItems?.map((_, index) => 
    watch(`advanceExpenseItems.${index}.requestAmount`)
  ) || [];

  // Calculate general advance total amount in real-time
  const calculateTotalAmount = useCallback(() => {
    const expenseItems = watchedExpenseItems || [];
    return expenseItems.reduce((sum, item) => {
      const netAmount = typeof item.netAmount === 'string' 
        ? parseFloat(item.netAmount) || 0 
        : Number(item.netAmount) || 0;
      return sum + netAmount;
    }, 0);
  }, [watchedExpenseItems]);

  // Calculate net amounts and auto-calculate tax amounts when expense items change
  useEffect(() => {
    const expenseItems = watchedExpenseItems || [];
    let hasChanges = false;
    
    expenseItems.forEach((item, index) => {
      const requestAmount = typeof item.requestAmount === 'string' 
        ? parseFloat(item.requestAmount) || 0 
        : Number(item.requestAmount) || 0;
      const taxRate = typeof item.taxRate === 'string' 
        ? parseFloat(item.taxRate) || 0 
        : Number(item.taxRate) || 0;
      
      // Auto-calculate tax amount based on request amount and tax rate
      const autoTaxAmount = (requestAmount * taxRate) / 100;
      // Net amount = request amount (no tax deduction)
      const netAmount = requestAmount;
      
      // Check if values need to be updated
      const currentTaxAmount = typeof item.taxAmount === 'string' 
        ? parseFloat(item.taxAmount) || 0 
        : Number(item.taxAmount) || 0;
      const currentNetAmount = typeof item.netAmount === 'string' 
        ? parseFloat(item.netAmount) || 0 
        : Number(item.netAmount) || 0;
      
      if (Math.abs(currentTaxAmount - autoTaxAmount) > 0.01 || Math.abs(currentNetAmount - netAmount) > 0.01) {
        setValue(`advanceExpenseItems.${index}.taxAmount`, autoTaxAmount, { shouldValidate: false });
        setValue(`advanceExpenseItems.${index}.netAmount`, netAmount, { shouldValidate: false });
        hasChanges = true;
      }
    });
    
    // Force update total amount if there were changes
    if (hasChanges) {
      const totalAmount = calculateTotalAmount();
      setValue('amount', totalAmount, { shouldValidate: true, shouldDirty: true });
    }
  }, [watchedExpenseItems, setValue, calculateTotalAmount, watchedRequestAmounts]);

  // Update form amount field when expense items change - with debounce for better performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const totalAmount = calculateTotalAmount();
      const currentAmount = watch('amount');
      
      // Only update if the amount has actually changed to prevent infinite loop
      if (Math.abs(currentAmount - totalAmount) > 0.01) {
        setValue('amount', totalAmount, { shouldValidate: false, shouldDirty: false });
      }
    }, 100); // Small debounce to prevent excessive updates

    return () => clearTimeout(timeoutId);
  }, [calculateTotalAmount, setValue, watchedRequestAmounts]);

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

  // Handle checkbox toggle for document type
  const handleDocCheckboxChange = (docType: GeneralAdvanceDocType) => {
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

  // Upload handler for specific document type
  const handleDocTypeFileChange = async (e: React.ChangeEvent<HTMLInputElement>, docType: GeneralAdvanceDocType) => {
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
      toast({ title: "อัพโหลดสำเร็จ", description: "อัพโหลดไฟล์เรียบร้อยแล้ว" });
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast({ title: "เกิดข้อผิดพลาด", description: `ไม่สามารถอัปโหลดไฟล์ได้: ${error.message}`, variant: "destructive" });
    } finally {
      fileInput.value = '';
    }
  };

  // Remove handler for specific document type
  const handleRemoveDocTypeFile = async (docType: GeneralAdvanceDocType, index: number) => {
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
      toast({ title: "ลบไฟล์สำเร็จ", description: "ลบไฟล์เรียบร้อยแล้ว" });
    } catch (error: any) {
      console.error('Error removing file:', error);
      toast({ title: "เกิดข้อผิดพลาด", description: `ไม่สามารถลบไฟล์ได้: ${error.message}`, variant: "destructive" });
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

  const onSubmit = async (data: GeneralAdvanceFormValues) => {
    // คำนวณยอดรวมใหม่ก่อนส่งข้อมูล และแปลงข้อมูลให้เป็น number
    const expenseItems = data.advanceExpenseItems || [];
    const calculatedAmount = expenseItems.reduce((sum, item) => {
      const requestAmount = typeof item.requestAmount === 'string' 
        ? parseFloat(item.requestAmount) || 0 
        : Number(item.requestAmount) || 0;
      return sum + requestAmount;
    }, 0);
    
    data.amount = calculatedAmount;
    
    // แปลงข้อมูลใน expense items ให้เป็น number ทั้งหมด
    data.advanceExpenseItems = expenseItems.map(item => ({
      ...item,
      requestAmount: typeof item.requestAmount === 'string' 
        ? parseFloat(item.requestAmount) || 0 
        : Number(item.requestAmount) || 0,
      taxRate: typeof item.taxRate === 'string' 
        ? parseFloat(item.taxRate) || 0 
        : Number(item.taxRate) || 0,
      taxAmount: typeof item.taxAmount === 'string' 
        ? parseFloat(item.taxAmount) || 0 
        : Number(item.taxAmount) || 0,
      netAmount: typeof item.netAmount === 'string' 
        ? parseFloat(item.netAmount) || 0 
        : Number(item.netAmount) || 0,
      otherDescription: item.otherDescription || ''
    }));
    
    console.log('🚀 General advance form submitted with data:', data);
    console.log('🚀 Employee data:', employeeData);
    console.log('🚀 Form errors:', errors);
    console.log('🚀 Calculated total amount:', calculatedAmount);
    console.log('🚀 Form amount field (updated):', data.amount);
    console.log('🚀 Expense items:', data.advanceExpenseItems);

    // Validate that at least one expense item has both name and amount
    const validExpenseItems = data.advanceExpenseItems?.filter(item =>
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
    const missingAttachments = GENERAL_ADVANCE_DOC_TYPES.filter(
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

    // Make sure we have employeeData before showing signature modal
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
  const processFormSubmission = async (data: GeneralAdvanceFormValues, employeeData: any, signature?: string) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
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
          return;
        }

        // UPDATE EXISTING REQUEST
        const updateData: any = {
          amount: Number(data.amount || 0),
          details: data.details || '',
          title: data.title || '',
          attachment_url: JSON.stringify(files),
          updated_at: new Date().toISOString(),
          start_date: data.startDate,
          end_date: data.endDate,
          department_request: employeeData?.Team,
          // General advance fields
          advance_department: data.advanceDepartment,
          advance_department_other: data.advanceDepartmentOther,
          advance_activity_type: data.advanceActivityType,
          advance_activity_other: data.advanceActivityOther,
          advance_event_date: data.advanceEventDate,
          advance_participants: data.advanceParticipants,
          advance_daily_rate: data.advanceDailyRate,
          advance_accommodation_cost: data.advanceAccommodationCost,
          advance_transportation_cost: data.advanceTransportationCost,
          advance_meal_allowance: data.advanceMealAllowance,
          advance_other_expenses: data.advanceOtherExpenses,
          advance_project_name: data.advanceProjectName,
          advance_project_location: data.advanceProjectLocation,
          // Bank account information
          bank_account_name: data.bankAccountName,
          bank_name: data.bankName,
          bank_account_number: data.bankAccountNumber,
          advance_expense_items: data.advanceExpenseItems ? JSON.stringify(data.advanceExpenseItems) : null,
          // Document selections
          attachment_selections: data.attachmentSelections ? JSON.stringify(data.attachmentSelections) : null,
        };

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

      // CREATE NEW REQUEST
      // Generate run number only for general advance type
      const runNumber = generateGeneralAdvanceRunNumber();
      const requestData = {
        userId: profile.employee_id.toString(),
        userName: employeeData?.Name || user?.email || 'Unknown User',
        userDepartment: employeeData?.Team || 'Unknown Department',
        department_request: employeeData?.Team || 'Unknown Department',
        type: 'general-advance' as const,
        status: 'pending_manager' as const,
        amount: Number(data.amount || 0),
        date: data.startDate || new Date().toISOString(),
        details: data.details || '',
        attachments: [...files, ...documentFiles.invoice, ...documentFiles.bankbook],
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        managerId: employeeData?.Position,
        start_date: data.startDate,
        end_date: data.endDate,
        userSignature: signature || userSignature,
        runNumber: runNumber, // Add run number
        // Document selections
        attachmentSelections: data.attachmentSelections,
        // General advance fields for requestData
        advanceDepartment: data.advanceDepartment,
        advanceDepartmentOther: data.advanceDepartmentOther,
        advanceActivityType: data.advanceActivityType,
        advanceActivityOther: data.advanceActivityOther,
        advanceEventDate: data.advanceEventDate,
        advanceParticipants: data.advanceParticipants,
        advanceDailyRate: data.advanceDailyRate,
        advanceAccommodationCost: data.advanceAccommodationCost,
        advanceTransportationCost: data.advanceTransportationCost,
        advanceMealAllowance: data.advanceMealAllowance,
        advanceOtherExpenses: data.advanceOtherExpenses,
        advanceProjectName: data.advanceProjectName,
        advanceProjectLocation: data.advanceProjectLocation,
        // Bank account information
        bankAccountName: data.bankAccountName,
        bankName: data.bankName,
        bankAccountNumber: data.bankAccountNumber,
        advanceExpenseItems: data.advanceExpenseItems,
      };

      console.log('📤 Sending requestData to submitRequest:', requestData);
      console.log('📤 Amount being sent:', requestData.amount);
      const result = await submitRequest(requestData);
      if (!result) {
        throw new Error('Failed to submit request');
      }

      await refreshRequests();

      // Generate PDF and upload to Supabase
      try {
        const isMR = employeeData?.Position === 'MR' || employeeData?.Position === 'Marketing Representative';
        const blob = await generateAdvancePDF(
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
          isMR // showExecutiveSignature - true for MR position
        );

        // สร้างชื่อไฟล์ที่ปลอดภัยโดยใช้ employee_id หรือ timestamp แทนชื่อไทย
        const employeeId = employeeData?.employee_id || user?.id?.slice(-8) || 'user';
        const timestamp = Date.now();
        const filename = `general_advance_emp${employeeId}_${timestamp}.pdf`;
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

      <div id="general-advance-form-content" className="form-container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">แบบฟอร์มขออนุมัติเบิกเงินล่วงหน้า (ทั่วไป)</h1>
        </div>

        

        <form onSubmit={handleSubmit(onSubmit, (errors) => {
          console.log('❌ Form validation errors:', errors);
          toast({
            title: 'กรุณาตรวจสอบข้อมูล',
            description: 'มีข้อมูลที่จำเป็นยังไม่ได้กรอก กรุณาตรวจสอบและกรอกข้อมูลให้ครบถ้วน',
            variant: 'destructive',
          });
        })} className="space-y-6">
          {/* ส่วนที่ 1: ข้อมูลทั่วไป */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">ข้อมูลทั่วไป</h3>

            {/* แผนก */}
            <div className="space-y-2">
              <label className="form-label">แผนก</label>
              <Select
                onValueChange={(value) => setValue('advanceDepartment', value)}
                value={watch('advanceDepartment')}
              >
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="เลือกแผนก" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={employeeData?.Team || 'แผนกของฉัน'}>{employeeData?.Team || 'แผนกของฉัน'}</SelectItem>
                  <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
                </SelectContent>
              </Select>
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

            {/* ฟิลด์ระบุแผนกอื่นๆ */}
            {watch('advanceDepartment') === 'อื่นๆ' && (
              <div className="space-y-2">
                <label className="form-label">โปรดระบุแผนก</label>
                <Input
                  placeholder="ระบุแผนกอื่นๆ"
                  className="form-input"
                  {...register('advanceDepartmentOther', {
                    required: watch('advanceDepartment') === 'อื่นๆ' ? 'กรุณาระบุแผนก' : false
                  })}
                />
                {errors.advanceDepartmentOther && (
                  <p className="text-red-500 text-base mt-1">{errors.advanceDepartmentOther.message}</p>
                )}
              </div>
            )}

            {/* ประเภทกิจกรรม */}
            <div className="space-y-2">
              <label className="form-label">ประเภทกิจกรรม <span className="text-red-500">*</span></label>
              <Input
                placeholder="ระบุประเภทกิจกรรม เช่น จัดประชุม, ออกบูธ, อบรม, สัมมนา"
                className="form-input"
                {...register('advanceActivityType', {
                  required: 'กรุณาระบุประเภทกิจกรรม'
                })}
              />
              {errors.advanceActivityType && (
                <p className="text-red-500 text-base mt-1">{errors.advanceActivityType.message}</p>
              )}
            </div>

            {/* วันที่และจำนวนผู้เข้าร่วม */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="form-label cursor-pointer" onClick={() => (document.getElementById('genAdvStartDate') as HTMLInputElement)?.showPicker?.()}>วันที่เริ่มกิจกรรม</label>
                <Input
                  id="genAdvStartDate"
                  type="date"
                  className="form-input cursor-pointer"
                  onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                  {...register('startDate', {
                    required: 'กรุณาระบุวันที่เริ่มกิจกรรม'
                  })}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-base mt-1">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="form-label cursor-pointer" onClick={() => (document.getElementById('genAdvEndDate') as HTMLInputElement)?.showPicker?.()}>วันที่สิ้นสุดกิจกรรม</label>
                <Input
                  id="genAdvEndDate"
                  type="date"
                  className="form-input cursor-pointer"
                  onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
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
                    min: { value: 1, message: 'จำนวนผู้เข้าร่วมต้องมากกว่า 0' }
                  })}
                />
                {errors.advanceParticipants && (
                  <p className="text-red-500 text-base mt-1">{errors.advanceParticipants.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* ส่วนที่ 2: รายละเอียดค่าใช้จ่าย */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">รายละเอียดค่าใช้จ่าย</h3>
              <Button
                type="button"
                onClick={() => appendExpense({ name: '', taxRate: 0, requestAmount: 0, taxAmount: 0, netAmount: 0, otherDescription: '' })}
                variant="outline"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มรายการ
              </Button>
            </div>

            {/* ตารางรายการค่าใช้จ่าย */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 py-2 text-base font-medium w-16">ลำดับ</th>
                    <th className="border border-gray-300 px-2 py-2 text-base font-medium">ชื่อรายการ</th>
                    <th className="border border-gray-300 px-2 py-2 text-base font-medium">ภาษี %</th>
                    <th className="border border-gray-300 px-2 py-2 text-base font-medium">จำนวนเงินเบิก</th>
                    <th className="border border-gray-300 px-2 py-2 text-base font-medium">ยอดสุทธิ</th>
                    <th className="border border-gray-300 px-2 py-2 text-base font-medium"><Trash2 className="h-4 w-4 mx-auto text-gray-500" /></th>
                  </tr>
                </thead>
                <tbody>
                  {expenseFields.map((field, index) => (
                    <tr key={field.id}>
                      <td className="border border-gray-300 p-1 text-center">
                        <div className="text-base font-medium text-gray-700">{index + 1}</div>
                      </td>
                      <td className="border border-gray-300 p-1">
                        <div className="space-y-2">
                          <Select
                            onValueChange={(value) => {
                              const selectedCategory = GENERAL_ADVANCE_EXPENSE_CATEGORIES.find(cat => cat.name === value);
                              setValue(`advanceExpenseItems.${index}.name`, value);
                              if (selectedCategory) {
                                setValue(`advanceExpenseItems.${index}.taxRate`, selectedCategory.taxRate);
                              }
                              // Clear other description when changing category
                              if (value !== 'ค่าใช้จ่ายอื่น ๆ (โปรดระบุรายละเอียด)') {
                                setValue(`advanceExpenseItems.${index}.otherDescription`, '');
                              }
                            }}
                            value={watch(`advanceExpenseItems.${index}.name`) || ''}
                          >
                            <SelectTrigger className="w-full min-w-[200px]">
                              <SelectValue placeholder="เลือกรายการ" />
                            </SelectTrigger>
                            <SelectContent>
                              {GENERAL_ADVANCE_EXPENSE_CATEGORIES.map((category) => (
                                <SelectItem key={category.name} value={category.name}>
                                  <div className="flex items-center gap-2">
                                    {category.name}
                                    {category.hasInfo && (
                                      <Info
                                        className="h-4 w-4 text-yellow-500 cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowLotteryInfoModal(true);
                                        }}
                                      />
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <input
                            type="hidden"
                            {...register(`advanceExpenseItems.${index}.name` as const)}
                          />
                          {watch(`advanceExpenseItems.${index}.name`) === 'ค่าใช้จ่ายอื่น ๆ (โปรดระบุรายละเอียด)' && (
                            <Input
                              placeholder="ระบุรายละเอียด"
                              className="w-full text-base"
                              {...register(`advanceExpenseItems.${index}.otherDescription` as const, {
                                required: watch(`advanceExpenseItems.${index}.name`) === 'ค่าใช้จ่ายอื่น ๆ (โปรดระบุรายละเอียด)' ? 'กรุณาระบุรายละเอียด' : false
                              })}
                            />
                          )}
                          {watch(`advanceExpenseItems.${index}.name`) === 'ค่าของรางวัลเพื่อการชิงโชค' && (
                            <button
                              type="button"
                              onClick={() => setShowLotteryInfoModal(true)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-base mt-1"
                            >
                              <Info className="h-4 w-4" />
                              ดูข้อมูลเพิ่มเติม
                            </button>
                          )}
                          {watch(`advanceExpenseItems.${index}.name`) === 'ค่าขนส่ง' && (
                            <button
                              type="button"
                              onClick={() => setShowTransportInfoModal(true)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-base mt-1"
                            >
                              <Info className="h-4 w-4" />
                              ดูข้อมูลเพิ่มเติม
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 p-1 text-center">
                        <div className="text-base font-medium text-gray-700">
                          {watch(`advanceExpenseItems.${index}.taxRate`) || 0}%
                        </div>
                      </td>
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
                            setValue(`advanceExpenseItems.${index}.requestAmount`, numValue);
                          }}
                          onBlur={(e) => {
                            let numValue = parseFormattedNumber(e.target.value);
                            if (numValue > 999999) {
                              numValue = 999999;
                            }
                            if (numValue > 0) {
                              e.target.value = formatNumberOnBlur(numValue);
                              setValue(`advanceExpenseItems.${index}.requestAmount`, numValue);
                            }
                          }}
                          defaultValue={formatNumberForInput(watch(`advanceExpenseItems.${index}.requestAmount`))}
                        />
                        <input
                          type="hidden"
                          {...register(`advanceExpenseItems.${index}.requestAmount` as const, {
                            min: { value: 0, message: 'ต้องไม่น้อยกว่า 0' },
                            max: { value: 999999, message: 'จำนวนเงินต้องไม่เกิน 999,999' },
                            valueAsNumber: true
                          })}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="text"
                          className="w-full bg-welfare-blue/10 font-semibold text-right"
                          placeholder="0.00"
                          value={formatNumberWithCommas(watch(`advanceExpenseItems.${index}.netAmount`))}
                          readOnly
                        />
                        <input
                          type="hidden"
                          {...register(`advanceExpenseItems.${index}.taxRate` as const)}
                        />
                        <input
                          type="hidden"
                          {...register(`advanceExpenseItems.${index}.taxAmount` as const)}
                        />
                        <input
                          type="hidden"
                          {...register(`advanceExpenseItems.${index}.netAmount` as const)}
                        />
                      </td>
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
                  <tr className="bg-welfare-blue/10 font-semibold">
                    <td className="border border-gray-300 px-2 py-2 text-center" colSpan={3}>รวม</td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
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
                    <td className="border border-gray-300 px-2 py-2 text-center">
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
                    <td className="border border-gray-300 px-2 py-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Hidden amount field for form submission */}
          <input
            type="hidden"
            {...register('amount', { valueAsNumber: true })}
          />

          {/* Total Amount Display */}
            <div className="flex justify-end">
              <div className="bg-welfare-blue/10 border border-welfare-blue/30 rounded-lg p-4 min-w-[200px]">
                <div className="text-base text-welfare-blue font-medium">จำนวนเงินรวมทั้งสิ้น</div>
                <div className="text-3xl font-bold text-welfare-blue">
                  {formatNumberWithCommas(calculateTotalAmount())} บาท
                </div>
              </div>
            </div>
          </div>

          {/* รายละเอียดเพิ่มเติม */}
          <div className="space-y-2">
            <label className="form-label">รายละเอียดเพิ่มเติม</label>
            <Textarea
              placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
              className="form-input"
              rows={3}
              {...register('details')}
            />
          </div>

          {/* ข้อมูลบัญชีธนาคาร */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">ข้อมูลบัญชีธนาคาร (สำหรับโอนเงิน)</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="form-label">ชื่อบัญชี <span className="text-red-500">*</span></label>
                <Input
                  placeholder="ระบุชื่อบัญชีธนาคาร"
                  className="form-input"
                  {...register('bankAccountName', {
                    required: 'กรุณาระบุชื่อบัญชี'
                  })}
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
                >
                  <SelectTrigger className="form-input">
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
                  {...register('bankName', {
                    required: 'กรุณาเลือกธนาคาร'
                  })}
                />
                {errors.bankName && (
                  <p className="text-red-500 text-base mt-1">{errors.bankName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="form-label">เลขที่บัญชี <span className="text-red-500">*</span></label>
                <Input
                  placeholder="ระบุเลขที่บัญชีธนาคาร"
                  className="form-input"
                  maxLength={15}
                  {...register('bankAccountNumber', {
                    required: 'กรุณาระบุเลขที่บัญชี',
                    pattern: {
                      value: /^[0-9-]+$/,
                      message: 'เลขที่บัญชีต้องเป็นตัวเลขเท่านั้น'
                    },
                    maxLength: { value: 15, message: 'เลขที่บัญชีต้องไม่เกิน 15 ตัวอักษร' }
                  })}
                />
                {errors.bankAccountNumber && (
                  <p className="text-red-500 text-base mt-1">{errors.bankAccountNumber.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* แนบเอกสารประกอบ */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">แนบเอกสารประกอบ</h3>
            <p className="text-base text-gray-600">เลือกประเภทเอกสารที่ต้องการแนบ แล้วอัพโหลดไฟล์</p>

            <div className="grid grid-cols-1 gap-4">
              {GENERAL_ADVANCE_DOC_TYPES.map((docType) => (
                <div key={docType.key} className="border rounded-lg p-4 bg-white">
                  {/* Checkbox for document type */}
                  <div className="flex items-center space-x-3 mb-3">
                    <input
                      type="checkbox"
                      id={`doc-${docType.key}`}
                      checked={documentSelections[docType.key]}
                      onChange={() => handleDocCheckboxChange(docType.key)}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
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
                            onChange={(e) => handleDocTypeFileChange(e, docType.key)}
                          />
                        </label>
                      </div>

                      {/* Show uploaded files for this document type */}
                      {documentFiles[docType.key].length > 0 && (
                        <div className="space-y-2">
                          {documentFiles[docType.key].map((fileUrl, index) => {
                            const isImage = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(fileUrl);
                            return (
                              <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                                  <div className="flex items-center space-x-2">
                                    <Check className="h-4 w-4 text-blue-600" />
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-700 hover:text-blue-900 underline truncate max-w-[150px]"
                                    >
                                      ไฟล์ {index + 1}
                                    </a>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveDocTypeFile(docType.key, index)}
                                    className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                {isImage && (
                                  <div className="ml-6">
                                    <img
                                      src={fileUrl}
                                      alt={`Preview ${index + 1}`}
                                      className="max-w-xs max-h-48 rounded border border-gray-300"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary of uploaded documents */}
            {Object.values(documentFiles).some(f => f.length > 0) && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-base font-medium text-blue-800 mb-2">สรุปเอกสารที่แนบ:</h4>
                <div className="space-y-1">
                  {GENERAL_ADVANCE_DOC_TYPES.filter(dt => documentFiles[dt.key].length > 0).map(dt => (
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
              className="bg-welfare-blue hover:bg-welfare-blue/90"
              onClick={() => {
                console.log('🔘 Submit button clicked');
                console.log('🔘 Current form values:', watch());
                console.log('🔘 Current errors:', errors);
                console.log('🔘 Is submitting:', isSubmitting);
                console.log('🔘 Employee data:', employeeData);
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังส่งคำร้อง...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  ส่งคำร้อง
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

      {/* Transport Info Modal */}
      {showTransportInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Info className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">ข้อมูลสำคัญ: ค่าขนส่ง</h3>
              </div>
              <button
                onClick={() => setShowTransportInfoModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>ค่าขนส่ง (ภาษี 1%)</strong>
              </p>
              <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded">
                <p className="text-blue-800 text-base">
                  กรณีจดทะเบียนประเภทธุรกิจขนส่ง
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setShowTransportInfoModal(false)}
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