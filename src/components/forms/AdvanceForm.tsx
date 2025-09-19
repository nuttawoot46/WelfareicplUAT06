import React, { useState, useEffect, useCallback } from 'react';
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
  advanceDistrict?: string; // เขต
  advanceActivityType: string; // ประเภทกิจกรรม
  advanceActivityOther?: string; // ระบุอื่นๆ
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
    usedAmount: number;
    tax: number;
    vat: number;
    refund: number;
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

// ประเภทกิจกรรมสำหรับเบิกเงินทดลอง
const ACTIVITY_TYPES = [
  'จัดประชุม',
  'ออกบูธ',
  'ดีลเลอร์',
  'ซับดีลเลอร์',
  'อื่นๆ',
];

// รายการค่าใช้จ่ายเบิกเงินล่วงหน้า
const ADVANCE_EXPENSE_CATEGORIES = [
  'ค่าอาหารและเครื่องดื่ม',
  'ค่าเช่าสถานที่',
  'ค่าบริการ/ค่าสนับสนุนร้านค้า/ค่าจ้างทำป้าย/ค่าจ้างอื่นๆ/ค่าบริการสถานที่',
  'ค่าดนตรี/เครื่องเสียง/MC',
  'ของรางวัลเพื่อการชิงโชค',
  'ค่าโฆษณา (โฆษณาทางวิทยุ)',
  'อุปกรณ์และอื่นๆ',
  'ของขวัญแจกช่วงเล่นเกม'
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
      advanceExpenseItems: [{ name: '', taxRate: 0, requestAmount: 0, usedAmount: 0, tax: 0, vat: 0, refund: 0 }]
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
                usedAmount: Number(item.usedAmount) || 0,
                taxRate: Number(item.taxRate) || 0,
                tax: Number(item.tax) || 0,
                vat: Number(item.vat) || 0,
                refund: Number(item.refund) || 0
              })) : [{ name: '', taxRate: 0, requestAmount: 0, usedAmount: 0, tax: 0, vat: 0, refund: 0 }],
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

  // Calculate advance total amount in real-time
  const calculateTotalAmount = useCallback(() => {
    const expenseItems = watchedExpenseItems || [];
    return expenseItems.reduce((sum, item) => {
      const requestAmount = typeof item.requestAmount === 'string' 
        ? parseFloat(item.requestAmount) || 0 
        : Number(item.requestAmount) || 0;
      return sum + requestAmount;
    }, 0);
  }, [watchedExpenseItems]);

  // Update form amount field when expense items change
  useEffect(() => {
    const totalAmount = calculateTotalAmount();
    console.log('💰 Updating amount field:', totalAmount);
    console.log('💰 Expense items:', watchedExpenseItems);
    setValue('amount', totalAmount, { shouldValidate: true, shouldDirty: true });
  }, [calculateTotalAmount, setValue]);

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
      usedAmount: typeof item.usedAmount === 'string' 
        ? parseFloat(item.usedAmount) || 0 
        : Number(item.usedAmount) || 0,
      taxRate: typeof item.taxRate === 'string' 
        ? parseFloat(item.taxRate) || 0 
        : Number(item.taxRate) || 0,
      tax: typeof item.tax === 'string' 
        ? parseFloat(item.tax) || 0 
        : Number(item.tax) || 0,
      vat: typeof item.vat === 'string' 
        ? parseFloat(item.vat) || 0 
        : Number(item.vat) || 0,
      refund: typeof item.refund === 'string' 
        ? parseFloat(item.refund) || 0 
        : Number(item.refund) || 0
    }));
    
    console.log('🚀 Form submitted with data:', data);
    console.log('🚀 Employee data:', employeeData);
    console.log('🚀 Form errors:', errors);
    console.log('🚀 Calculated total amount:', calculatedAmount);
    console.log('🚀 Form amount field (updated):', data.amount);
    console.log('🚀 Expense items:', data.advanceExpenseItems);

    // Validate that at least one expense item has both name and amount
    const validExpenseItems = data.advanceExpenseItems?.filter(item =>
      item.name && item.name.trim() !== '' && item.requestAmount > 0
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
        // Document selections
        attachmentSelections: data.attachmentSelections,
        // Advance fields for requestData
        advanceDepartment: data.advanceDepartment,
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
                  {...register('advanceDistrict')}
                />
              </div>
            </div>

            {/* ประเภทกิจกรรม */}
            <div className="space-y-2">
              <label className="form-label">ประเภทกิจกรรม</label>
              <Select
                onValueChange={(value) => setValue('advanceActivityType', value)}
                value={watch('advanceActivityType')}
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

            {/* ฟิลด์ระบุอื่นๆ เมื่อเลือก "อื่นๆ" */}
            {(['อื่นๆ'].includes(watch('advanceActivityType'))) && (
              <div className="space-y-2">
                <label className="form-label">โปรดระบุ</label>
                <Input
                  placeholder="ระบุประเภทกิจกรรมอื่นๆ"
                  className="form-input"
                  {...register('advanceActivityOther', {
                    required: ['อื่นๆ'].includes(watch('advanceActivityType')) ? 'กรุณาระบุ' : false
                  })}
                />
                {errors.advanceActivityOther && (
                  <p className="text-red-500 text-sm mt-1">{errors.advanceActivityOther.message}</p>
                )}
              </div>
            )}

            {/* ฟิลด์ระบุ"ดีลเลอร์" */}
            {(['ดีลเลอร์'].includes(watch('advanceActivityType'))) && (
              <div className="space-y-2">
                <label className="form-label">โปรดระบุชื่อร้าน</label>
                <Input
                  placeholder="ระบุชื่อร้าน"
                  className="form-input"
                  {...register('advanceDealerName', {
                    required: ['ดีลเลอร์'].includes(watch('advanceActivityType')) ? 'กรุณาระบุชื่อร้าน' : false
                  })}
                />
                {errors.advanceDealerName && (
                  <p className="text-red-500 text-sm mt-1">{errors.advanceDealerName.message}</p>
                )}
              </div>
            )}

            {/* ฟิลด์ระบุ"ซับดีลเลอร์" */}
            {(['ซับดีลเลอร์'].includes(watch('advanceActivityType'))) && (
              <div className="space-y-2">
                <label className="form-label">โปรดระบุชื่อร้าน</label>
                <Input
                  placeholder="ระบุชื่อร้าน"
                  className="form-input"
                  {...register('advanceSubdealerName', {
                    required: ['ซับดีลเลอร์'].includes(watch('advanceActivityType')) ? 'กรุณาระบุชื่อร้าน' : false
                  })}
                />
                {errors.advanceSubdealerName && (
                  <p className="text-red-500 text-sm mt-1">{errors.advanceSubdealerName.message}</p>
                )}
              </div>
            )}

            {/* วันที่และจำนวนผู้เข้าร่วม */}
            <div className="grid grid-cols-2 gap-4">
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

            {/* สถานที่ อำเภอ และจังหวัด */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="form-label">ชื่อร้าน/บริษัท</label>
                <Input
                  placeholder="ระบุสถานที่"
                  className="form-input"
                  {...register('venue')}
                />
              </div>

              <div className="space-y-2">
                <label className="form-label">อำเภอ</label>
                <Input
                  placeholder="ระบุอำเภอ"
                  className="form-input"
                  {...register('advanceAmphur')}
                />
              </div>

              <div className="space-y-2">
                <label className="form-label">จังหวัด</label>
                <Input
                  placeholder="ระบุจังหวัด"
                  className="form-input"
                  {...register('advanceProvince')}
                />
              </div>
            </div>
          </div>

          {/* ส่วนที่ 2: รายละเอียดค่าใช้จ่าย */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">รายละเอียดค่าใช้จ่าย</h3>
              <Button
                type="button"
                onClick={() => appendExpense({ name: '', taxRate: 0, requestAmount: 0, usedAmount: 0, tax: 0, vat: 0, refund: 0 })}
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
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">ชื่อรายการ</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">ภาษี %</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">จำนวนเงินเบิก</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">จำนวนเงินใช้</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">ภาษี</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">ภาษีมูลค่าเพิ่ม</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">คืน</th>
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseFields.map((field, index) => (
                    <tr key={field.id}>
                      <td className="border border-gray-300 p-1">
                        <Select
                          onValueChange={(value) => setValue(`advanceExpenseItems.${index}.name`, value)}
                          value={watch(`advanceExpenseItems.${index}.name`) || ''}
                        >
                          <SelectTrigger className="w-full min-w-[200px]">
                            <SelectValue placeholder="เลือกรายการ" />
                          </SelectTrigger>
                          <SelectContent>
                            {ADVANCE_EXPENSE_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <input
                          type="hidden"
                          {...register(`advanceExpenseItems.${index}.name` as const)}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="w-20"
                          placeholder="0"
                          {...register(`advanceExpenseItems.${index}.taxRate` as const, {
                            min: { value: 0, message: 'ต้องไม่น้อยกว่า 0' },
                            max: { value: 100, message: 'ต้องไม่เกิน 100' },
                            valueAsNumber: true
                          })}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-28"
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
                          min="0"
                          className="w-28"
                          placeholder="0.00"
                          {...register(`advanceExpenseItems.${index}.usedAmount` as const, {
                            min: { value: 0, message: 'ต้องไม่น้อยกว่า 0' },
                            valueAsNumber: true
                          })}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-24"
                          placeholder="0.00"
                          {...register(`advanceExpenseItems.${index}.tax` as const, {
                            min: { value: 0, message: 'ต้องไม่น้อยกว่า 0' },
                            valueAsNumber: true
                          })}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-24"
                          placeholder="0.00"
                          {...register(`advanceExpenseItems.${index}.vat` as const, {
                            min: { value: 0, message: 'ต้องไม่น้อยกว่า 0' },
                            valueAsNumber: true
                          })}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-24"
                          placeholder="0.00"
                          {...register(`advanceExpenseItems.${index}.refund` as const, {
                            min: { value: 0, message: 'ต้องไม่น้อยกว่า 0' },
                            valueAsNumber: true
                          })}
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
                    <td className="border border-gray-300 px-2 py-2 text-center">รวม</td>
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
                    <td className="border border-gray-300 px-2 py-2"></td>
                    <td className="border border-gray-300 px-2 py-2"></td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      {(() => {
                        const expenseItems = watchedExpenseItems || [];
                        const total = expenseItems.reduce((sum, item) => {
                          const refund = typeof item.refund === 'string' 
                            ? parseFloat(item.refund) || 0 
                            : Number(item.refund) || 0;
                          return sum + refund;
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
    </div>
  );
}