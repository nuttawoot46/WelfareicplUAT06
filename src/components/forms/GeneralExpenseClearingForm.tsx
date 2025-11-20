import React, { useState, useEffect } from 'react';
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
import { formatNumberWithCommas, parseFormattedNumber } from '@/utils/numberFormat';

interface GeneralExpenseClearingFormProps {
  onBack: () => void;
  editId?: number | null;
}

interface GeneralExpenseClearingFormValues {
  startDate: string;
  endDate?: string;
  amount: number;
  details: string;
  title?: string;
  attachments?: FileList;
  originalAdvanceRequestId?: number;
  advanceDepartment?: string;
  advanceDepartmentOther?: string;
  advanceActivityType?: string;
  advanceParticipants?: number;
  expenseClearingItems: {
    name: string;
    taxRate: number;
    requestAmount: number;
    usedAmount: number;
    vatAmount: number; // VAT 7%
    taxAmount: number;
    netAmount: number;
    refund: number;
    otherDescription?: string;
  }[];
  attachmentSelections?: {
    receipt?: boolean;
    idCardCopy?: boolean;
    bankBookCopy?: boolean;
    other?: boolean;
    otherText?: string;
  };
}

const GENERAL_EXPENSE_CATEGORIES = [
  { name: 'ค่าอาหาร และ เครื่องดื่ม', taxRate: 0 },
  { name: 'ค่าเช่าสถานที่', taxRate: 5 },
  { name: 'งบสนับสนุนร้านค้า', taxRate: 3 },
  { name: 'ค่าบริการ /ค่าจ้างทำป้าย /ค่าจ้างอื่น ๆ', taxRate: 3 },
  { name: 'ค่าวงดนตรี / เครื่องเสียง / MC', taxRate: 3 },
  { name: 'ค่าของรางวัลเพื่อการชิงโชค *', taxRate: 5 },
  { name: 'ค่าว่าจ้างโฆษณาทางวิทยุ', taxRate: 2 },
  { name: 'ค่าใช้จ่ายอื่น ๆ (โปรดระบุรายละเอียด)', taxRate: 0 },
];

export function GeneralExpenseClearingForm({ onBack, editId }: GeneralExpenseClearingFormProps) {
  const location = useLocation();
  const navigate = useNavigate();
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

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors }
  } = useForm<GeneralExpenseClearingFormValues>({
    defaultValues: {
      expenseClearingItems: [{ name: '', taxRate: 0, requestAmount: 0, usedAmount: 0, vatAmount: 0, taxAmount: 0, netAmount: 0, refund: 0, otherDescription: '' }]
    }
  });

  const { fields: expenseFields, append: appendExpense, remove: removeExpense } = useFieldArray({
    control,
    name: "expenseClearingItems"
  });

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending_manager': return 'รอผู้จัดการอนุมัติ';
      case 'pending_hr': return 'รอ HR อนุมัติ';
      case 'pending_accounting': return 'รอบัญชีอนุมัติ';
      case 'approved':
      case 'completed': return 'อนุมัติแล้ว';
      case 'rejected_manager': return 'ผู้จัดการปฏิเสธ';
      case 'rejected_hr': return 'HR ปฏิเสธ';
      case 'rejected_accounting': return 'บัญชีปฏิเสธ';
      default: return 'ไม่ทราบสถานะ';
    }
  };

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

  useEffect(() => {
    const fetchAdvanceRequests = async () => {
      if (!user?.email || !employeeData?.id) return;
      try {
        const { data, error } = await supabase
          .from('welfare_requests')
          .select('id, amount, created_at, details, status, run_number')
          .eq('employee_id', employeeData.id)
          .eq('request_type', 'general-advance')
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

  const handleAdvanceRequestSelection = async (requestId: string) => {
    if (!requestId) return;
    try {
      const { data, error } = await supabase
        .from('welfare_requests')
        .select('*')
        .eq('id', parseInt(requestId))
        .single();
      if (!error && data) {
        setValue('originalAdvanceRequestId', data.id);
        setValue('startDate', data.start_date || '');
        setValue('endDate', data.end_date || '');
        setValue('advanceDepartment', (data as any).advance_department || '');
        setValue('advanceDepartmentOther', (data as any).advance_department_other || '');
        setValue('advanceActivityType', (data as any).advance_activity_type || '');
        setValue('advanceParticipants', (data as any).advance_participants || 0);
        if ((data as any).advance_expense_items) {
          const expenseItems = JSON.parse((data as any).advance_expense_items);
          setValue('expenseClearingItems', expenseItems.map((item: any) => ({
            ...item,
            requestAmount: Number(item.requestAmount) || 0,
            usedAmount: 0,
            vatAmount: 0,
            taxAmount: Number(item.taxAmount) || 0,
            netAmount: Number(item.netAmount) || 0,
            taxRate: Number(item.taxRate) || 0,
            refund: Number(item.requestAmount) || 0,
            otherDescription: item.otherDescription || ''
          })));
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

  const watchedExpenseItems = watch('expenseClearingItems');
  const watchedUsedAmounts = watchedExpenseItems?.map((_, index) => 
    watch(`expenseClearingItems.${index}.usedAmount`)
  ) || [];

  const calculateTotalRefund = () => {
    const expenseItems = watchedExpenseItems || [];
    return expenseItems.reduce((sum, item) => {
      const refund = typeof item.refund === 'string' 
        ? parseFloat(item.refund) || 0 
        : Number(item.refund) || 0;
      return sum + refund;
    }, 0);
  };

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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const refundAmount = calculateTotalRefund();
      setValue('amount', refundAmount, { shouldValidate: true, shouldDirty: true });
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [calculateTotalRefund, setValue, watchedExpenseItems, watchedUsedAmounts]);

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

  const onSubmit = async (data: GeneralExpenseClearingFormValues) => {
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
    data.expenseClearingItems = expenseItems.map(item => ({
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
    }));

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
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่พบข้อมูลพนักงาน กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
      return;
    }
    setPendingFormData({ data, employeeData });
    setShowSignatureModal(true);
  };

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

  const processFormSubmission = async (data: GeneralExpenseClearingFormValues, employeeData: any, signature?: string) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      const requestData = {
        userId: profile.employee_id.toString(),
        userName: employeeData?.Name || user?.email || 'Unknown User',
        userDepartment: employeeData?.Team || 'Unknown Department',
        department_request: employeeData?.Team || 'Unknown Department',
        type: 'general-expense-clearing' as const,
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
        attachmentSelections: data.attachmentSelections,
        originalAdvanceRequestId: data.originalAdvanceRequestId,
        expenseClearingItems: data.expenseClearingItems,
        advanceDepartment: data.advanceDepartment,
        advanceDepartmentOther: data.advanceDepartmentOther,
        advanceActivityType: data.advanceActivityType,
        advanceParticipants: data.advanceParticipants,
      };

      let result: any;
      try {
        result = await submitRequest(requestData);
        if (!result) {
          throw new Error('Failed to submit request');
        }
      } catch (submitError: any) {
        console.error('❌ Submit request error:', submitError);
        throw submitError;
      }
      await refreshRequests();

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
        const filename = `general_expense_clearing_emp${employeeId}_${timestamp}.pdf`;
        const pdfUrl = await uploadPDFToSupabase(blob, filename, user?.id);
        if (result.id && pdfUrl) {
          await supabase.from('welfare_requests').update({ pdf_url: pdfUrl }).eq('id', result.id);
        }
        toast({
          title: 'ส่งคำร้องและอัปโหลด PDF สำเร็จ',
          description: 'คำร้องเคลียร์ค่าใช้จ่าย (ทั่วไป) ของคุณถูกส่งเรียบร้อยแล้ว',
        });
      } catch (pdfError) {
        console.error('PDF generation/upload error:', pdfError);
        toast({
          title: 'ส่งคำร้องสำเร็จ',
          description: 'คำร้องเคลียร์ค่าใช้จ่าย (ทั่วไป) ของคุณถูกส่งเรียบร้อยแล้ว',
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
      <Button variant="ghost" className="mb-6" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        กลับ
      </Button>

      <div id="general-expense-clearing-form-content" className="form-container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">แบบฟอร์มเคลียร์ค่าใช้จ่าย (ทั่วไป)</h1>
        </div>

        <div className="mb-6">
          <Alert className="border-purple-200 bg-purple-50">
            <AlertCircle className="h-4 w-4 mr-2 text-purple-600" />
            <AlertDescription className="text-purple-800">
              <strong>เคลียร์ค่าใช้จ่าย (ทั่วไป):</strong> สำหรับการรายงานการใช้เงินจากการเบิกล่วงหน้าทั่วไป คุณสามารถเลือกคำขอเบิกเงินล่วงหน้าที่เคยทำไว้ หรือกรอกข้อมูลใหม่ทั้งหมด
            </AlertDescription>
          </Alert>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <input type="hidden" {...register('amount', { valueAsNumber: true })} />

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
                        {`${request.run_number || 'ไม่มีเลขที่'} - ${formatNumberWithCommas(request.amount)} บาท (${new Date(request.created_at).toLocaleDateString('th-TH')}) - สถานะ: ${getStatusText(request.status)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-600 text-sm">
                    ไม่พบคำขอเบิกเงินล่วงหน้าทั่วไป กรุณากรอกข้อมูลใหม่ทั้งหมดในส่วนข้อมูลทั่วไปด้านล่าง
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">ข้อมูลทั่วไป</h3>
            
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
            </div>

            {/* ฟิลด์ระบุแผนกอื่นๆ */}
            {watch('advanceDepartment') === 'อื่นๆ' && (
              <div className="space-y-2">
                <label className="form-label">โปรดระบุแผนก</label>
                <Input
                  placeholder="ระบุแผนกอื่นๆ"
                  className="form-input"
                  {...register('advanceDepartmentOther')}
                />
              </div>
            )}

            {/* ประเภทกิจกรรม */}
            <div className="space-y-2">
              <label className="form-label">ประเภทกิจกรรม</label>
              <Input
                placeholder="ระบุประเภทกิจกรรม เช่น จัดประชุม, ออกบูธ, อบรม, สัมมนา"
                className="form-input"
                {...register('advanceActivityType')}
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
                <Input type="date" className="form-input" {...register('endDate')} />
              </div>
              <div className="space-y-2">
                <label className="form-label">จำนวนผู้เข้าร่วม</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="80"
                  className="form-input"
                  {...register('advanceParticipants', {
                    min: { value: 1, message: 'จำนวนผู้เข้าร่วมต้องมากกว่า 0' }
                  })}
                />
                {errors.advanceParticipants && (
                  <p className="text-red-500 text-sm mt-1">{errors.advanceParticipants.message}</p>
                )}
              </div>
            </div>
          </div>

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
                    <th className="border border-gray-300 px-2 py-2 text-sm font-medium"></th>
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
                              const selectedCategory = GENERAL_EXPENSE_CATEGORIES.find(cat => cat.name === value);
                              setValue(`expenseClearingItems.${index}.name`, value);
                              if (selectedCategory) {
                                setValue(`expenseClearingItems.${index}.taxRate`, selectedCategory.taxRate);
                              }
                              if (value !== 'ค่าใช้จ่ายอื่น ๆ (โปรดระบุรายละเอียด)') {
                                setValue(`expenseClearingItems.${index}.otherDescription`, '');
                              }
                            }}
                            value={watch(`expenseClearingItems.${index}.name`) || ''}
                          >
                            <SelectTrigger className="w-full min-w-[200px]">
                              <SelectValue placeholder="เลือกรายการ" />
                            </SelectTrigger>
                            <SelectContent>
                              {GENERAL_EXPENSE_CATEGORIES.map((category) => (
                                <SelectItem key={category.name} value={category.name}>{category.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <input type="hidden" {...register(`expenseClearingItems.${index}.name` as const)} />
                          {watch(`expenseClearingItems.${index}.name`) === 'ค่าใช้จ่ายอื่น ๆ (โปรดระบุรายละเอียด)' && (
                            <Input
                              placeholder="ระบุรายละเอียด"
                              className="w-full text-sm"
                              {...register(`expenseClearingItems.${index}.otherDescription` as const, {
                                required: watch(`expenseClearingItems.${index}.name`) === 'ค่าใช้จ่ายอื่น ๆ (โปรดระบุรายละเอียด)' ? 'กรุณาระบุรายละเอียด' : false
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
                        <input type="hidden" {...register(`expenseClearingItems.${index}.taxRate` as const)} />
                      </td>
                      {/* จำนวนเบิก */}
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="text"
                          className="w-28 text-right"
                          placeholder="0.00"
                          value={formatNumberWithCommas(watch(`expenseClearingItems.${index}.requestAmount`))}
                          onChange={(e) => {
                            const numValue = parseFormattedNumber(e.target.value);
                            setValue(`expenseClearingItems.${index}.requestAmount`, numValue);
                          }}
                        />
                        <input type="hidden" {...register(`expenseClearingItems.${index}.requestAmount` as const, { valueAsNumber: true })} />
                      </td>
                      {/* จำนวนใช้ (ก่อนภาษีมูลค่าเพิ่ม) */}
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="text"
                          className="w-28 text-right"
                          placeholder="0.00"
                          value={formatNumberWithCommas(watch(`expenseClearingItems.${index}.usedAmount`))}
                          onChange={(e) => {
                            const numValue = parseFormattedNumber(e.target.value);
                            setValue(`expenseClearingItems.${index}.usedAmount`, numValue);
                          }}
                        />
                        <input type="hidden" {...register(`expenseClearingItems.${index}.usedAmount` as const, { valueAsNumber: true })} />
                      </td>
                      {/* ภาษีมูลค่าเพิ่ม (VAT) - Manual Entry */}
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="text"
                          className="w-28 text-right"
                          placeholder="0.00"
                          value={formatNumberWithCommas(watch(`expenseClearingItems.${index}.vatAmount`))}
                          onChange={(e) => {
                            const numValue = parseFormattedNumber(e.target.value);
                            setValue(`expenseClearingItems.${index}.vatAmount`, numValue);
                          }}
                        />
                        <input type="hidden" {...register(`expenseClearingItems.${index}.vatAmount` as const, { valueAsNumber: true })} />
                      </td>
                      {/* ภาษีหัก ณ ที่จ่าย */}
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="text"
                          className="w-28 bg-gray-100 text-right"
                          placeholder="0.00"
                          value={formatNumberWithCommas(watch(`expenseClearingItems.${index}.taxAmount`) || 0)}
                          readOnly
                        />
                        <input type="hidden" {...register(`expenseClearingItems.${index}.taxAmount` as const)} />
                      </td>
                      {/* รวมจำนวนเงินทั้งสิ้น */}
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="text"
                          className="w-28 bg-blue-50 font-semibold text-right"
                          placeholder="0.00"
                          value={formatNumberWithCommas(watch(`expenseClearingItems.${index}.netAmount`) || 0)}
                          readOnly
                        />
                        <input type="hidden" {...register(`expenseClearingItems.${index}.netAmount` as const)} />
                      </td>
                      {/* คืนเงินบริษัท(+) เบิกเงินบริษัท(-) */}
                      <td className="border border-gray-300 p-1">
                        <Input
                          type="text"
                          className={`w-28 text-right ${
                            (watch(`expenseClearingItems.${index}.refund`) || 0) >= 0
                              ? 'bg-green-50'
                              : 'bg-red-50'
                          }`}
                          placeholder="0.00"
                          value={formatNumberWithCommas(watch(`expenseClearingItems.${index}.refund`) || 0)}
                          readOnly
                        />
                        <input type="hidden" {...register(`expenseClearingItems.${index}.refund` as const)} />
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
                  <tr className="bg-green-50 font-semibold">
                    <td className="border border-gray-300 px-2 py-2 text-center" colSpan={2}>รวม</td>
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
                        return formatNumberWithCommas(total);
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
                        return formatNumberWithCommas(total);
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
                        return formatNumberWithCommas(total);
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
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      {(() => {
                        const total = calculateTotalRefund();
                        const isNegative = total < 0;
                        return (
                          <span className={isNegative ? 'text-red-700 font-bold' : 'text-green-700 font-bold'}>
                            {formatNumberWithCommas(total)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="border border-gray-300 px-2 py-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              {(() => {
                const amount = calculateTotalRefund();
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
                      {isNegative ? '-' : ''}{formatNumberWithCommas(Math.abs(amount))} บาท
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="space-y-2">
            <label className="form-label">รายละเอียดเพิ่มเติม</label>
            <Textarea
              placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
              className="form-input"
              rows={3}
              {...register('details')}
            />
          </div>

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

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onBack}>
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
