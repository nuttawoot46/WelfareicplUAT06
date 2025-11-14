import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useWelfare } from '@/context/WelfareContext';
import { ArrowLeft, AlertCircle, Plus, X, Paperclip, Check, Loader2, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { generateAdvancePDF } from '../pdf/AdvancePDFGenerator';
import { uploadPDFToSupabase } from '@/utils/pdfUtils';
import { DigitalSignature } from '../signature/DigitalSignature';

interface AdvanceFormProps {
  onBack: () => void;
  editId?: number | null;
}

// Advance form specific interface
interface AdvanceFormValues {
  startDate: string;
  endDate?: string;
  amount: number;
  details: string;
  title?: string;
  attachments?: FileList;

  // Advance (เบิกเงินล่วงหน้า) fields
  advanceDepartment: string; // แผนก
  advanceDepartmentOther?: string; // ระบุแผนกอื่นๆ (แยกจาก advanceActivityOther)
  advanceDistrict?: string; // เขต
  advanceActivityType: string; // ประเภทกิจกรรม
  advanceActivityOther?: string; // ระบุกิจกรรมอื่นๆ
  advanceShopCompany?: string; // ชื่อร้าน/บริษัท
  advanceAmphur?: string; // อำเภอ
  advanceProvince?: string; // จังหวัด
  advanceEventDate?: string; // วันที่จัด
  advanceParticipants: number; // จำนวนผู้เข้าร่วม
  advanceDailyRate?: number;
  advanceAccommodationCost?: number;
  advanceTransportationCost?: number;
  advanceMealAllowance?: number;
  advanceOtherExpenses?: number;
  advanceProjectName?: string;
  advanceProjectLocation?: string;
  venue?: string; // สถานที่
  advanceDealerName?: string; // ระบุชื่อร้าน
  advanceSubdealerName?: string; //ระบุชื่อร้าน

  // Advance expense items
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

// Generate run number for advance requests
const generateAdvanceRunNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp for uniqueness
  return `ADV${year}${month}${timestamp}`;
};

// รายการค่าใช้จ่ายเบิกเงินล่วงหน้า
const ADVANCE_EXPENSE_CATEGORIES = [
  { name: 'ค่าอาหาร และ เครื่องดื่ม', taxRate: 0 },
  { name: 'ค่าเช่าสถานที่', taxRate: 5 },
  { name: 'งบสนับสนุนร้านค้า', taxRate: 3 },
  { name: 'ค่าบริการ /ค่าจ้างทำป้าย /ค่าจ้างอื่น ๆ', taxRate: 3 },
  { name: 'ค่าวงดนตรี / เครื่องเสียง / MC', taxRate: 3 },
  { name: 'ค่าของรางวัลเพื่อการชิงโชค', taxRate: 5 },
  { name: 'ค่าว่าจ้างโฆษณาทางวิทยุ', taxRate: 2 },
  { name: 'ค่าใช้จ่ายอื่น ๆ (โปรดระบุรายละเอียด)', taxRate: 0 }
];

// ประเภทกิจกรรมและคำนิยาม
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

export function AdvanceForm({ onBack, editId }: AdvanceFormProps) {
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
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [userSignature, setUserSignature] = useState<string>('');
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [dealerList, setDealerList] = useState<Array<{ No: string; Name: string; City: string; County: string }>>([]);
  const [showActivityInfoModal, setShowActivityInfoModal] = useState(false);
  const [selectedActivityInfo, setSelectedActivityInfo] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors }
  } = useForm<AdvanceFormValues>({
    defaultValues: {
      advanceExpenseItems: [{ name: '', taxRate: 0, requestAmount: 0, taxAmount: 0, netAmount: 0, otherDescription: '' }]
    }
  });

  const { fields: expenseFields, append: appendExpense, remove: removeExpense } = useFieldArray({
    control,
    name: "advanceExpenseItems"
  });

  // Fetch employee data when component mounts
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user?.email) return;

      try {
        const { data, error } = await supabase
          .from('Employee')
          .select('id, Name, Position, Team')
          .eq('email_user', user.email)
          .single();

        if (!error && data) {
          setEmployeeData(data);
          
          // Fetch district code from sales_data based on employee name
          if (data.Name) {
            const { data: salesData, error: salesError } = await supabase
              .from('sales_data' as any)
              .select('code')
              .eq('name', data.Name)
              .single();

            if (!salesError && salesData) {
              // Auto-populate the district field with the code
              const districtCode = (salesData as any).code;
              if (districtCode) {
                setValue('advanceDistrict', districtCode);
                console.log('✅ Auto-populated district code:', districtCode, 'for employee:', data.Name);
              }
            } else {
              console.log('ℹ️ No district code found for employee:', data.Name);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching employee data:', error);
      }
    };

    fetchEmployeeData();
  }, [user?.email, setValue]);

  // Fetch dealer list when component mounts
  useEffect(() => {
    let isMounted = true;

    const fetchDealerList = async () => {
      try {
        console.log('🔍 Fetching dealer list...');

        // Try RPC function first
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_dealer_list' as any);

        if (!rpcError && rpcData && isMounted) {
          console.log('✅ Dealer list loaded via RPC:', rpcData.length, 'dealers');
          console.log('📋 Sample dealer data from RPC:', rpcData[0]);
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

        // Fallback: Direct query with proper error handling
        const { data, error } = await supabase
          .from('data_dealer' as any)
          .select('*')
          .order('Name', { ascending: true });

        if (!error && data && isMounted) {
          console.log('✅ Dealer list loaded via direct query:', data.length, 'dealers');
          console.log('📋 Sample dealer data from direct query:', data[0]);
          const mappedData = data.map((d: any) => ({
            No: d['No.'] || '',
            Name: d.Name || '',
            City: d.City || '',
            County: d.County || ''
          }));
          console.log('📋 Mapped dealer data sample:', mappedData[0]);
          setDealerList(mappedData);
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
            // Advance fields
            advanceDepartment: dbData.advance_department || '',
            advanceDepartmentOther: dbData.advance_department_other || '',
            advanceDistrict: dbData.advance_district || '',
            advanceActivityType: dbData.advance_activity_type || '',
            advanceActivityOther: dbData.advance_activity_other || '',
            advanceDealerName: dbData.advance_dealer_name || '',
            advanceSubdealerName: dbData.advance_subdealer_name || '',
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
            venue: dbData.advance_location || '', // เพิ่มการโหลดข้อมูลสถานที่
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

  // Calculate advance total amount in real-time
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

  const onSubmit = async (data: AdvanceFormValues) => {
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

    console.log('🚀 Form submitted with data:', data);
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
  const processFormSubmission = async (data: AdvanceFormValues, employeeData: any, signature?: string) => {
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
          // Advance fields
          advance_department: data.advanceDepartment,
          advance_department_other: data.advanceDepartmentOther,
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
          advance_location: data.venue, // เพิ่มการส่งข้อมูลสถานที่
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
      // Generate run number only for advance type
      const runNumber = generateAdvanceRunNumber();
      const requestData = {
        userId: profile.employee_id.toString(),
        userName: employeeData?.Name || user?.email || 'Unknown User',
        userDepartment: employeeData?.Team || 'Unknown Department',
        department_request: employeeData?.Team || 'Unknown Department',
        type: 'advance' as const,
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
        runNumber: runNumber, // Add run number
        // Document selections
        attachmentSelections: data.attachmentSelections,
        // Advance fields for requestData
        advanceDepartment: data.advanceDepartment,
        advanceDepartmentOther: data.advanceDepartmentOther,
        advanceDistrict: data.advanceDistrict,
        advanceActivityType: data.advanceActivityType,
        advanceActivityOther: data.advanceActivityOther,
        advanceDealerName: data.advanceDealerName,
        advanceSubdealerName: data.advanceSubdealerName,
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
        advanceLocation: data.venue, // เพิ่มการส่งข้อมูลสถานที่
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
          signature || userSignature
        );

        // สร้างชื่อไฟล์ที่ปลอดภัยโดยใช้ employee_id หรือ timestamp แทนชื่อไทย
        const employeeId = employeeData?.employee_id || user?.id?.slice(-8) || 'user';
        const timestamp = Date.now();
        const filename = `advance_emp${employeeId}_${timestamp}.pdf`;
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

      <div id="advance-form-content" className="form-container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">แบบขออนุมัติเบิกเงินล่วงหน้า</h1>
        </div>

        {/* Special info for advance payment */}
        <div className="mb-6">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>เบิกเงินทดลอง:</strong> สามารถขออนุมัติได้ตลอดเวลา ไม่มีข้อจำกัดเรื่องวงเงินหรืองบประมาณ ระบบจะคำนวณจำนวนเงินให้อัตโนมัติตามรายละเอียดที่กรอก
            </AlertDescription>
          </Alert>
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
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">ข้อมูลทั่วไป</h3>

            {/* แผนกและเขต */}
            <div className="grid grid-cols-2 gap-4">
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
                  <p className="text-red-500 text-sm mt-1">{errors.advanceDepartment.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="form-label">เขต</label>
                <Input
                  placeholder="ระบุเขต"
                  className="form-input bg-gray-50"
                  readOnly
                  {...register('advanceDistrict')}
                />
                <p className="text-xs text-gray-500">เขตจะถูกกรอกอัตโนมัติตามข้อมูลพนักงาน</p>
              </div>
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
                  <p className="text-red-500 text-sm mt-1">{errors.advanceDepartmentOther.message}</p>
                )}
              </div>
            )}

            {/* ประเภทกิจกรรม */}
            <div className="space-y-2">
              <label className="form-label flex items-center gap-2">
                ประเภทกิจกรรม <span className="text-red-500">*</span>
                {watch('advanceActivityType') && (
                  <button
                    type="button"
                    onClick={() => {
                      const activity = ACTIVITY_TYPES.find(a => a.name === watch('advanceActivityType'));
                      if (activity) {
                        setSelectedActivityInfo(activity.description);
                        setShowActivityInfoModal(true);
                      }
                    }}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                )}
              </label>
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

            {/* Dealer/Subdealer Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="form-label">ดีลเลอร์</label>
                <Select
                  onValueChange={(value) => {
                    console.log('🔍 Dealer selected:', value);
                    console.log('🔍 Current dealer list:', dealerList);
                    
                    if (value === 'none') {
                      setValue('advanceDealerName', '');
                      // Don't clear amphur/province when selecting "none"
                    } else {
                      setValue('advanceDealerName', value);
                      // Find the selected dealer and auto-populate amphur and province
                      const selectedDealer = dealerList.find(d => d.Name === value);
                      console.log('🔍 Found dealer:', selectedDealer);
                      
                      if (selectedDealer) {
                        if (selectedDealer.City) {
                          setValue('advanceAmphur', selectedDealer.City);
                          console.log('✅ Set amphur to:', selectedDealer.City);
                        } else {
                          console.log('⚠️ No City found for dealer');
                        }
                        if (selectedDealer.County) {
                          setValue('advanceProvince', selectedDealer.County);
                          console.log('✅ Set province to:', selectedDealer.County);
                        } else {
                          console.log('⚠️ No County found for dealer');
                        }
                        console.log('✅ Auto-populated amphur:', selectedDealer.City, 'province:', selectedDealer.County);
                      } else {
                        console.log('❌ Dealer not found in list');
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

          {/* ส่วนที่ 2: รายละเอียดค่าใช้จ่าย */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">รายละเอียดค่าใช้จ่าย</h3>
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
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium w-16">ลำดับ</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">ชื่อรายการ</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">ภาษี %</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">จำนวนเงินเบิก</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">ยอดสุทธิ</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseFields.map((field, index) => (
                    <tr key={field.id}>
                      <td className="border border-gray-300 p-1 text-center">
                        <div className="text-sm font-medium text-gray-700">{index + 1}</div>
                      </td>
                      <td className="border border-gray-300 p-1">
                        <div className="space-y-2">
                          <Select
                            onValueChange={(value) => {
                              const selectedCategory = ADVANCE_EXPENSE_CATEGORIES.find(cat => cat.name === value);
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
                              {ADVANCE_EXPENSE_CATEGORIES.map((category) => (
                                <SelectItem key={category.name} value={category.name}>{category.name}</SelectItem>
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
                              className="w-full text-sm"
                              {...register(`advanceExpenseItems.${index}.otherDescription` as const, {
                                required: watch(`advanceExpenseItems.${index}.name`) === 'ค่าใช้จ่ายอื่น ๆ (โปรดระบุรายละเอียด)' ? 'กรุณาระบุรายละเอียด' : false
                              })}
                            />
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 p-1 text-center">
                        <div className="text-sm font-medium text-gray-700">
                          {watch(`advanceExpenseItems.${index}.taxRate`) || 0}%
                        </div>
                      </td>
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-32"
                          placeholder="0.00"
                          {...register(`advanceExpenseItems.${index}.requestAmount` as const, {
                            min: { value: 0, message: 'ต้องไม่น้อยกว่า 0' },
                            valueAsNumber: true
                          })}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          step="0.01"
                          className="w-32 bg-blue-50 font-semibold"
                          placeholder="0.00"
                          value={(watch(`advanceExpenseItems.${index}.netAmount`) || 0).toFixed(2)}
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
                  <tr className="bg-blue-50 font-semibold">
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 min-w-[200px]">
                <div className="text-sm text-blue-600 font-medium">จำนวนเงินรวมทั้งสิ้น</div>
                <div className="text-2xl font-bold text-blue-800">
                  {calculateTotalAmount().toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} บาท
                </div>
              </div>
            </div>
          </div>

          

          {/* แนบไฟล์ */}
          <div className="space-y-4">
            <label className="form-label">แนบไฟล์เอกสาร</label>
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
                    ใบแจ้งหนี้ Statment เอกสารอื่น (ขนาดไม่เกิน 5 mb)
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

      {/* Activity Info Modal */}
      {showActivityInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-800">ความหมายของประเภทกิจกรรม</h3>
              <button
                onClick={() => setShowActivityInfoModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {watch('advanceActivityType')}
              </p>
              <div className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-4 rounded">
                {selectedActivityInfo}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                onClick={() => setShowActivityInfoModal(false)}
                variant="outline"
              >
                ปิด
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}