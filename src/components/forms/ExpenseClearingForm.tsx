import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useWelfare } from '@/context/WelfareContext';
import { ArrowLeft, AlertCircle, Plus, X, Paperclip, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { generateExpenseClearingPDF } from '../pdf/ExpenseClearingPDFGenerator';
import { uploadPDFToSupabase } from '@/utils/pdfUtils';
import { DigitalSignature } from '../signature/DigitalSignature';

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

  // Dealer/Subdealer checkboxes
  isDealerActivity?: boolean;
  isSubdealerActivity?: boolean;

  // Document selections for expense clearing
  attachmentSelections?: {
    receipt?: boolean;
    idCardCopy?: boolean;
    bankBookCopy?: boolean;
    other?: boolean;
    otherText?: string;
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
    name: 'จัดประชุมดิลเลอร์',
    description: 'ค่าใช้จ่ายในการจัดประชุมดิลเลอร์'
  },
  {
    name: 'ค่ารับรองลูกค้า/ของขวัญร้านค้า',
    description: 'อาหาร-เครื่องดื่ม / กาแฟ / ขนม'
  }
];

// รายการค่าใช้จ่ายเคลียร์
const EXPENSE_CLEARING_CATEGORIES = [
  { name: 'ค่าอาหารและเครื่องดื่ม', taxRate: 0 },
  { name: 'ค่าเช่าสถานที่', taxRate: 5 },
  { name: 'ค่าบริการ/ค่าสนับสนุนร้านค้า/ค่าจ้างทำป้าย/ค่าจ้างอื่นๆ/ค่าบริการสถานที่', taxRate: 3 },
  { name: 'ค่าดนตรี/เครื่องเสียง/MC', taxRate: 3 },
  { name: 'ของรางวัลเพื่อการชิงโชค', taxRate: 5 },
  { name: 'ค่าโฆษณา (โฆษณาทางวิทยุ)', taxRate: 2 },
  { name: 'ค่าตั๋วเครื่องบิน/ค่าที่พัก', taxRate: 0 },
  { name: 'อุปกรณ์และอื่นๆ', taxRate: 0 },
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
  const [isAdvanceRequestSelected, setIsAdvanceRequestSelected] = useState(false);
  const [dealerList, setDealerList] = useState<Array<{ No: string; Name: string; City: string; County: string }>>([]);

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
      default:
        return 'ไม่ทราบสถานะ';
    }
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

  // Fetch dealer list when component mounts
  useEffect(() => {
    let isMounted = true;

    const fetchDealerList = async () => {
      try {
        console.log('🔍 Fetching dealer list for expense clearing...');

        // Try RPC function first
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_dealer_list' as any);

        if (!rpcError && rpcData && isMounted) {
          console.log('✅ Dealer list loaded via RPC:', rpcData.length, 'dealers');
          setDealerList(rpcData.map((d: any) => ({
            No: d['No.'] || d.No || '',
            Name: d.Name || '',
            City: d.City || '',
            County: d.County || ''
          })));
          return;
        }

        if (rpcError) {
          console.warn('⚠️ RPC function not available, trying direct query:', rpcError.message);
        }

        // Fallback: Direct query
        const { data, error } = await supabase
          .from('data_dealer' as any)
          .select('*')
          .order('Name', { ascending: true });

        if (!error && data && isMounted) {
          console.log('✅ Dealer list loaded via direct query:', data.length, 'dealers');
          setDealerList(data.map((d: any) => ({
            No: d['No.'] || '',
            Name: d.Name || '',
            City: d.City || '',
            County: d.County || ''
          })));
        } else if (error) {
          console.warn('⚠️ Dealer table not available:', error.message);
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
  }, []);

  // Fetch available advance requests for this user
  useEffect(() => {
    const fetchAdvanceRequests = async () => {
      if (!user?.email || !employeeData?.id) return;

      try {
        const { data, error } = await supabase
          .from('welfare_requests')
          .select('id, amount, created_at, details, advance_activity_type, status, run_number')
          .eq('employee_id', employeeData.id)
          .eq('request_type', 'advance')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setAvailableAdvanceRequests(data);
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
      setIsAdvanceRequestSelected(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('welfare_requests')
        .select('*')
        .eq('id', parseInt(requestId))
        .single();

      if (!error && data) {
        setIsAdvanceRequestSelected(true);
        
        // Populate form with data from original advance request
        setValue('originalAdvanceRequestId', data.id);
        setValue('advanceDepartment', (data as any).advance_department || '');
        setValue('advanceDistrict', (data as any).advance_district || '');
        setValue('advanceActivityType', (data as any).advance_activity_type || '');
        setValue('advanceActivityOther', (data as any).advance_activity_other || '');
        setValue('advanceDealerName', (data as any).advance_dealer_name || '');
        setValue('advanceSubdealerName', (data as any).advance_subdealer_name || '');
        setValue('advanceShopCompany', (data as any).advance_shop_company || '');
        setValue('advanceAmphur', (data as any).advance_amphur || '');
        setValue('advanceProvince', (data as any).advance_province || '');
        setValue('advanceEventDate', (data as any).advance_event_date || '');
        setValue('advanceParticipants', (data as any).advance_participants || 0);
        setValue('venue', (data as any).advance_location || '');
        setValue('startDate', data.start_date || '');
        setValue('endDate', data.end_date || '');

        // Load expense items from original request
        if ((data as any).advance_expense_items) {
          const expenseItems = JSON.parse((data as any).advance_expense_items);
          setValue('expenseClearingItems', expenseItems.map((item: any) => {
            const requestAmount = Number(item.requestAmount) || 0;
            const usedAmount = 0; // Initialize used amount as 0 for user to fill
            const vatAmount = 0; // Initialize VAT as 0
            const taxAmount = Number(item.taxAmount) || 0;
            const netAmount = Number(item.netAmount) || 0;
            const refund = requestAmount - usedAmount; // Initialize refund as request amount
            
            return {
              ...item,
              requestAmount,
              usedAmount,
              vatAmount,
              taxAmount,
              netAmount,
              taxRate: Number(item.taxRate) || 0,
              refund,
              otherDescription: item.otherDescription || ''
            };
          }));
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
      
      // Auto-calculate VAT 7% from used amount
      const autoVatAmount = (usedAmount * 7) / 100;
      
      // Auto-calculate tax amount (ภาษีหัก ณ ที่จ่าย) based on used amount and tax rate
      const autoTaxAmount = (usedAmount * taxRate) / 100;
      
      // Net amount = used amount + VAT - tax
      const netAmount = usedAmount + autoVatAmount - autoTaxAmount;
      
      // Refund = จำนวนเงินเบิก - รวมจำนวนเงินทั้งสิ้น
      const refund = requestAmount - netAmount;
      
      // Check if values need to be updated
      const currentVatAmount = typeof item.vatAmount === 'string' 
        ? parseFloat(item.vatAmount) || 0 
        : Number(item.vatAmount) || 0;
      const currentTaxAmount = typeof item.taxAmount === 'string' 
        ? parseFloat(item.taxAmount) || 0 
        : Number(item.taxAmount) || 0;
      const currentNetAmount = typeof item.netAmount === 'string' 
        ? parseFloat(item.netAmount) || 0 
        : Number(item.netAmount) || 0;
      const currentRefund = typeof item.refund === 'string' 
        ? parseFloat(item.refund) || 0 
        : Number(item.refund) || 0;
      
      if (Math.abs(currentVatAmount - autoVatAmount) > 0.01 ||
          Math.abs(currentTaxAmount - autoTaxAmount) > 0.01 || 
          Math.abs(currentNetAmount - netAmount) > 0.01 ||
          Math.abs(currentRefund - refund) > 0.01) {
        setValue(`expenseClearingItems.${index}.vatAmount`, autoVatAmount, { shouldValidate: false });
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
      console.log('💰 Updating expense clearing amount field:', refundAmount);
      console.log('💰 Expense clearing items:', watchedExpenseItems);
      setValue('amount', refundAmount, { shouldValidate: true, shouldDirty: true });
    }, 100); // Small debounce to prevent excessive updates

    return () => clearTimeout(timeoutId);
  }, [calculateTotalRefund, setValue, watchedExpenseItems, watchedUsedAmounts]);

  // File handling functions (same as AdvanceForm)
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
        attachments: files,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        managerId: employeeData?.Position,
        start_date: data.startDate,
        end_date: data.endDate,
        userSignature: signature || userSignature,
        // Document selections
        attachmentSelections: data.attachmentSelections,
        // Expense clearing fields
        originalAdvanceRequestId: data.originalAdvanceRequestId,
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
        const blob = await generateExpenseClearingPDF(
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
          signature || userSignature
        );

        const employeeId = employeeData?.employee_id || user?.id?.slice(-8) || 'user';
        const timestamp = Date.now();
        const filename = `expense_clearing_emp${employeeId}_${timestamp}.pdf`;
        const pdfUrl = await uploadPDFToSupabase(blob, filename, user?.id);

        if (result.id && pdfUrl) {
          await supabase.from('welfare_requests').update({ pdf_url: pdfUrl }).eq('id', result.id);
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
          <h1 className="text-2xl font-bold">แบบเคลียร์ค่าใช้จ่าย</h1>
        </div>

        {/* Info for expense clearing */}
        <div className="mb-6">
          <Alert className="border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 mr-2 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>เคลียร์ค่าใช้จ่าย:</strong> สำหรับการรายงานการใช้เงินจากการเบิกล่วงหน้า คุณสามารถเลือกคำขอเบิกเงินล่วงหน้าที่เคยทำไว้ หรือกรอกข้อมูลใหม่ทั้งหมด
            </AlertDescription>
          </Alert>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Hidden amount field for form submission */}
          <input
            type="hidden"
            {...register('amount', { valueAsNumber: true })}
          />
          {/* ส่วนเลือกคำขอเบิกเงินล่วงหน้าเดิม */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">เลือกคำขอเบิกเงินล่วงหน้าเดิม (ถ้ามี)</h3>
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
                        {`${request.run_number || 'ไม่มีเลขที่'} - ${request.advance_activity_type || 'ไม่ระบุ'} - ${request.amount?.toLocaleString()} บาท (${new Date(request.created_at).toLocaleDateString('th-TH')}) - สถานะ: ${getStatusText(request.status)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-600 text-sm">
                    ไม่พบคำขอเบิกเงินล่วงหน้าที่ได้รับการอนุมัติแล้ว กรุณากรอกข้อมูลใหม่ทั้งหมดในส่วนข้อมูลทั่วไปด้านล่าง
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ส่วนที่ 1: ข้อมูลทั่วไป */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">ข้อมูลทั่วไป</h3>

            {/* แผนกและเขต */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="form-label">แผนก</label>
                <Select
                  onValueChange={(value) => setValue('advanceDepartment', value)}
                  value={watch('advanceDepartment')}
                  disabled={isAdvanceRequestSelected}
                >
                  <SelectTrigger className={`form-input ${isAdvanceRequestSelected ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
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
                  <p className="text-red-500 text-sm mt-1">{errors.advanceDepartment.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="form-label">เขต</label>
                <Input
                  placeholder="ระบุเขต"
                  className={`form-input ${isAdvanceRequestSelected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  disabled={isAdvanceRequestSelected}
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
                  {...register('advanceActivityOther', {
                    required: watch('advanceDepartment') === 'อื่นๆ' ? 'กรุณาระบุแผนก' : false
                  })}
                />
                {errors.advanceActivityOther && (
                  <p className="text-red-500 text-sm mt-1">{errors.advanceActivityOther.message}</p>
                )}
              </div>
            )}

            {/* ประเภทกิจกรรม */}
            <div className="space-y-2">
              <label className="form-label">ประเภทกิจกรรม <span className="text-red-500">*</span></label>
              <Select
                onValueChange={(value) => setValue('advanceActivityType', value)}
                value={watch('advanceActivityType')}
              >
                <SelectTrigger className="form-input">
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
                <p className="text-red-500 text-sm mt-1">{errors.advanceActivityType.message}</p>
              )}
            </div>

            {/* รายละเอียดเพิ่มเติม */}
            <div className="space-y-2">
              <label className="form-label">โปรดระบุรายละเอียด</label>
              <Textarea
                placeholder="ระบุรายละเอียด"
                className="form-input"
                rows={3}
                {...register('details')}
              />
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
                  <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
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
                  <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="form-label">จำนวนผู้เข้าร่วม</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="80"
                  className="form-input"
                  {...register('advanceParticipants', {
                    required: 'กรุณาระบุจำนวนผู้เข้าร่วม',
                    min: { value: 1, message: 'จำนวนผู้เข้าร่วมต้องมากกว่า 0' }
                  })}
                />
                {errors.advanceParticipants && (
                  <p className="text-red-500 text-sm mt-1">{errors.advanceParticipants.message}</p>
                )}
              </div>
            </div>

            {/* Dealer/Subdealer Checkboxes */}
            <div className="space-y-4">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDealerActivity"
                    className="rounded border-gray-300"
                    {...register('isDealerActivity')}
                  />
                  <label htmlFor="isDealerActivity" className="text-sm font-medium text-gray-700">
                    ดีลเลอร์
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isSubdealerActivity"
                    className="rounded border-gray-300"
                    {...register('isSubdealerActivity')}
                  />
                  <label htmlFor="isSubdealerActivity" className="text-sm font-medium text-gray-700">
                    ซับดีลเลอร์
                  </label>
                </div>
              </div>


            </div>

            {/* Dealer Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="form-label">ดีลเลอร์</label>
                <Select
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setValue('advanceDealerName', '');
                    } else {
                      setValue('advanceDealerName', value);
                      // Find the selected dealer and auto-populate amphur and province
                      const selectedDealer = dealerList.find(d => d.Name === value);
                      if (selectedDealer) {
                        if (selectedDealer.City) {
                          setValue('advanceAmphur', selectedDealer.City);
                        }
                        if (selectedDealer.County) {
                          setValue('advanceProvince', selectedDealer.County);
                        }
                        console.log('✅ Auto-populated amphur:', selectedDealer.City, 'province:', selectedDealer.County);
                      }
                    }
                  }}
                  value={watch('advanceDealerName') || 'none'}
                >
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="เลือกดีลเลอร์" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ไม่ระบุ</SelectItem>
                    {dealerList.map((dealer, index) => (
                      <SelectItem key={`${dealer.No}-${index}`} value={dealer.Name}>
                        {dealer.Name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="hidden"
                  {...register('advanceDealerName')}
                />
              </div>

              <div className="space-y-2">
                <label className="form-label">ซับดีลเลอร์</label>
                <Input
                  placeholder="ระบุซับดีลเลอร์"
                  className="form-input"
                  {...register('advanceSubdealerName')}
                />
              </div>
            </div>

            {/* สถานที่ อำเภอ และจังหวัด */}
            <div className="grid grid-cols-3 gap-4">
              

              <div className="space-y-2">
                <label className="form-label">อำเภอ <span className="text-red-500">*</span></label>
                <Input
                  placeholder="ระบุอำเภอ"
                  className="form-input"
                  value={watch('advanceAmphur') || ''}
                  onChange={(e) => setValue('advanceAmphur', e.target.value)}
                />
                <input
                  type="hidden"
                  {...register('advanceAmphur', {
                    required: 'กรุณาระบุอำเภอ'
                  })}
                />
                {errors.advanceAmphur && (
                  <p className="text-red-500 text-sm mt-1">{errors.advanceAmphur.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="form-label">จังหวัด <span className="text-red-500">*</span></label>
                <Input
                  placeholder="ระบุจังหวัด"
                  className="form-input"
                  value={watch('advanceProvince') || ''}
                  onChange={(e) => setValue('advanceProvince', e.target.value)}
                />
                <input
                  type="hidden"
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

          {/* ส่วนที่ 2: รายละเอียดค่าใช้จ่ายจริง */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">รายละเอียดค่าใช้จ่ายจริง</h3>
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">ลำดับ</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">ชื่อรายการ</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">อัตราภาษี</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">จำนวนเบิก</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">จำนวนใช้<br/>(ก่อนภาษีมูลค่าเพิ่ม)</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">ภาษีมูลค่าเพิ่ม</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">ภาษีหัก ณ ที่จ่าย</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">รวมจำนวนเงินทั้งสิ้น</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">คืนเงินบริษัท(+)<br/>เบิกเงินบริษัท(-)</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseFields.map((field, index) => (
                    <tr key={field.id}>
                      {/* ลำดับ */}
                      <td className="border border-gray-300 p-1 text-center">
                        <span className="font-medium">{index + 1}</span>
                      </td>
                      {/* ชื่อรายการ */}
                      <td className="border border-gray-300 p-1">
                        <div className="space-y-2">
                          <Select
                            onValueChange={(value) => {
                              const selectedCategory = EXPENSE_CLEARING_CATEGORIES.find(cat => cat.name === value);
                              setValue(`expenseClearingItems.${index}.name`, value);
                              if (selectedCategory) {
                                setValue(`expenseClearingItems.${index}.taxRate`, selectedCategory.taxRate);
                              }
                              // Clear other description when changing category
                              if (value !== 'อุปกรณ์และอื่นๆ') {
                                setValue(`expenseClearingItems.${index}.otherDescription`, '');
                              }
                            }}
                            value={watch(`expenseClearingItems.${index}.name`) || ''}
                          >
                            <SelectTrigger className="w-full min-w-[200px]">
                              <SelectValue placeholder="เลือกรายการ" />
                            </SelectTrigger>
                            <SelectContent>
                              {EXPENSE_CLEARING_CATEGORIES.map((category) => (
                                <SelectItem key={category.name} value={category.name}>{category.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <input
                            type="hidden"
                            {...register(`expenseClearingItems.${index}.name` as const)}
                          />
                          {watch(`expenseClearingItems.${index}.name`) === 'อุปกรณ์และอื่นๆ' && (
                            <Input
                              placeholder="ระบุรายละเอียด"
                              className="w-full text-sm"
                              {...register(`expenseClearingItems.${index}.otherDescription` as const, {
                                required: watch(`expenseClearingItems.${index}.name`) === 'อุปกรณ์และอื่นๆ' ? 'กรุณาระบุรายละเอียด' : false
                              })}
                            />
                          )}
                        </div>
                      </td>
                      {/* อัตราภาษี */}
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="w-20 bg-gray-100"
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
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-28"
                          placeholder="0.00"
                          {...register(`expenseClearingItems.${index}.requestAmount` as const, {
                            min: { value: 0, message: 'ต้องไม่น้อยกว่า 0' },
                            valueAsNumber: true
                          })}
                        />
                      </td>
                      {/* จำนวนใช้ (ก่อนภาษีมูลค่าเพิ่ม) */}
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-28"
                          placeholder="0.00"
                          {...register(`expenseClearingItems.${index}.usedAmount` as const, {
                            min: { value: 0, message: 'ต้องไม่น้อยกว่า 0' },
                            valueAsNumber: true
                          })}
                        />
                      </td>
                      {/* ภาษีมูลค่าเพิ่ม (VAT) 7% */}
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-28 bg-purple-50"
                          placeholder="0.00"
                          value={(watch(`expenseClearingItems.${index}.vatAmount`) || 0).toFixed(2)}
                          readOnly
                        />
                        <input
                          type="hidden"
                          {...register(`expenseClearingItems.${index}.vatAmount` as const)}
                        />
                      </td>
                      {/* ภาษีหัก ณ ที่จ่าย */}
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-28 bg-gray-100"
                          placeholder="0.00"
                          value={(watch(`expenseClearingItems.${index}.taxAmount`) || 0).toFixed(2)}
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
                          type="number"
                          step="0.01"
                          className="w-28 bg-blue-50 font-semibold"
                          placeholder="0.00"
                          value={(watch(`expenseClearingItems.${index}.netAmount`) || 0).toFixed(2)}
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
                          type="number"
                          step="0.01"
                          className={`w-28 ${
                            (watch(`expenseClearingItems.${index}.refund`) || 0) >= 0 
                              ? 'bg-green-50' 
                              : 'bg-red-50'
                          }`}
                          placeholder="0.00"
                          value={(watch(`expenseClearingItems.${index}.refund`) || 0).toFixed(2)}
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
                  <tr className="bg-green-50 font-semibold">
                    <td className="border border-gray-300 px-2 py-2 text-center" colspan="2">รวม</td>
                    <td className="border border-gray-300 px-2 py-2"></td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      {(() => {
                        const expenseItems = watchedExpenseItems || [];
                        const total = expenseItems.reduce((sum, item) => {
                          const requestAmount = typeof item.requestAmount === 'string' 
                            ? parseFloat(item.requestAmount) || 0 
                            : Number(item.requestAmount) || 0;
                          return sum + requestAmount;
                        }, 0);
                        return total.toLocaleString('th-TH', { minimumFractionDigits: 2 });
                      })()}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      {(() => {
                        const expenseItems = watchedExpenseItems || [];
                        const total = expenseItems.reduce((sum, item) => {
                          const usedAmount = typeof item.usedAmount === 'string' 
                            ? parseFloat(item.usedAmount) || 0 
                            : Number(item.usedAmount) || 0;
                          return sum + usedAmount;
                        }, 0);
                        return total.toLocaleString('th-TH', { minimumFractionDigits: 2 });
                      })()}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      {(() => {
                        const expenseItems = watchedExpenseItems || [];
                        const total = expenseItems.reduce((sum, item) => {
                          const vatAmount = typeof item.vatAmount === 'string' 
                            ? parseFloat(item.vatAmount) || 0 
                            : Number(item.vatAmount) || 0;
                          return sum + vatAmount;
                        }, 0);
                        return total.toLocaleString('th-TH', { minimumFractionDigits: 2 });
                      })()}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      {(() => {
                        const expenseItems = watchedExpenseItems || [];
                        const total = expenseItems.reduce((sum, item) => {
                          const taxAmount = typeof item.taxAmount === 'string' 
                            ? parseFloat(item.taxAmount) || 0 
                            : Number(item.taxAmount) || 0;
                          return sum + taxAmount;
                        }, 0);
                        return total.toLocaleString('th-TH', { minimumFractionDigits: 2 });
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
                        return total.toLocaleString('th-TH', { minimumFractionDigits: 2 });
                      })()}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      {(() => {
                        const total = calculateTotalRefund(); // Calculate in real-time
                        const isNegative = total < 0;
                        return (
                          <span className={isNegative ? 'text-red-700 font-bold' : 'text-green-700 font-bold'}>
                            {total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="border border-gray-300 px-2 py-2"></td>
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
                    <div className={`text-sm font-medium ${
                      isNegative 
                        ? 'text-red-600' 
                        : isPositive 
                          ? 'text-green-600'
                          : 'text-gray-600'
                    }`}>
                      {isNegative ? 'จำนวนเงินที่ต้องชำระเพิ่ม' : 'จำนวนเงินคืนรวม'}
                    </div>
                    <div className={`text-2xl font-bold ${
                      isNegative 
                        ? 'text-red-800' 
                        : isPositive 
                          ? 'text-green-800'
                          : 'text-gray-800'
                    }`}>
                      {isNegative ? '-' : ''}{Math.abs(amount).toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} บาท
                    </div>
                  </div>
                );
              })()}
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

          {/* แนบไฟล์ */}
          <div className="space-y-4">
            <label className="form-label">แนบไฟล์เอกสาร (ใบเสร็จ, หลักฐานการจ่าย)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Paperclip className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                    </span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    รองรับไฟล์: PDF, JPG, PNG, DOC, DOCX (ขนาดไม่เกิน 10MB)
                  </p>
                </div>
              </div>
            </div>

            {/* แสดงรายการไฟล์ที่อัพโหลด */}
            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">ไฟล์ที่แนบ:</h4>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600 truncate">
                        ไฟล์ที่ {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
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
    </div>
  );
}