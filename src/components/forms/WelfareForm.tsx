import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WelfareType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useWelfare } from '@/context/WelfareContext';
import { ArrowLeft, Check, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

import LoadingPopup from './LoadingPopup';

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
}

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
  const { submitRequest, isLoading, getWelfareLimit, getRemainingBudget, trainingBudget } = useWelfare();
  const [files, setFiles] = useState<string[]>([]);
  const { toast } = useToast();
  const [maxAmount, setMaxAmount] = useState<number | null>(null);
  const [condition, setCondition] = useState<string | undefined>();
  const [isMonthly, setIsMonthly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeBudget, setEmployeeBudget] = useState<number | null>(null);
  
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
      trainingTopics: [{ value: '' }, { value: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "trainingTopics"
  });

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
      if (budgetResult && typeof budgetResult.then === 'function') {
        budgetResult.then(setEmployeeBudget);
      } else {
        setEmployeeBudget(budgetResult);
      }
    } else if (type !== 'training') {
      setValue('amount', limitAmount);
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
          reset({
            amount: data.amount,
            details: data.details || '',
            title: data.title || '',
            startDate: data.start_date || '',
            endDate: data.end_date || '',
            totalDays: data.total_days || 0,
            birthType: data.birth_type || '',
            trainingTopics: data.training_topics ? JSON.parse(data.training_topics) : [],
            totalAmount: data.total_amount || 0,
            tax7Percent: data.tax7_percent || 0,
            withholdingTax3Percent: data.withholding_tax3_percent || 0,
            netAmount: data.amount || 0,
            excessAmount: data.excess_amount || 0,
            companyPayment: data.company_payment || 0,
            employeePayment: data.employee_payment || 0,
            courseName: data.course_name || '',
            organizer: data.organizer || '',
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

  // For childbirth form
  const birthType = watch('birthType');
  
  // Update amount when birth type changes
  useEffect(() => {
    if (type === 'childbirth' && birthType) {
      const amount = birthType === 'natural' ? 4000 : 6000;
      setValue('amount', amount);
    }
  }, [birthType, type, setValue]);

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
  
  // Get remaining budget from context. This is now the single source of truth.
  // ใช้ budget เดียวกันสำหรับ glasses/dental
let remainingBudget = 0;
if (type === 'glasses' || type === 'dental') {
  remainingBudget = profile?.budget_dentalglasses ?? 0;
} else if (user?.id) {
  remainingBudget = getRemainingBudget(user.id, type);
} else {
  remainingBudget = 0;
}

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First, fetch the employee data to get the correct department and name
      const { data: employeeData, error: employeeError } = await supabase
        .from('Employee')
        .select('id, Name, Position, Team')
        .eq('email_user', user.email)
        .single();

      if (employeeError || !employeeData) {
        throw new Error('Employee data not found. Please contact support.');
      }

      if (editIdNum) {
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
          training_topics: data.trainingTopics ? JSON.stringify(data.trainingTopics) : null,
          total_amount: data.totalAmount,
          tax7_percent: data.tax7Percent,
          withholding_tax3_percent: data.withholdingTax3Percent,
          excess_amount: data.excessAmount,
          company_payment: data.companyPayment,
          employee_payment: data.employeePayment,
          course_name: data.courseName,
          organizer: data.organizer,
        };


        const { error: updateError } = await supabase
          .from('welfare_requests')
          .update(updateData)
          .eq('id', editIdNum);

        if (updateError) {
          throw new Error('ไม่สามารถแก้ไขคำร้องได้ กรุณาลองใหม่');
        }

        toast({
          title: 'แก้ไขคำร้องสำเร็จ',
          description: 'ข้อมูลคำร้องได้รับการแก้ไขเรียบร้อยแล้ว',
        });
        setTimeout(onBack, 2000);
        return;
      }

      // CREATE NEW REQUEST (เหมือนเดิม)
      const requestData = {
        userId: user.id,
        userName: employeeData.Name || 'Unknown User',
        userDepartment: employeeData.Team || 'Unknown Department',
        type: type,
        status: 'pending' as const,
        amount: Number(data.netAmount || data.amount || 0), // Net amount ยังคง map ไป column เดิม
        date: data.startDate || new Date().toISOString(),
        details: data.details || '',
        attachments: files, // This now contains the public URLs of the uploaded files
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        managerId: employeeData.Position, // Assuming Position contains manager ID
        start_date: data.startDate,
        end_date: data.endDate,
        total_days: data.totalDays,
        birth_type: data.birthType,
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
      };

      const result = await submitRequest(requestData);
      if (!result) {
        throw new Error('Failed to submit request');
      }
      reset();
      setFiles([]);
      toast({
        title: 'ส่งคำร้องสำเร็จ',
        description: 'คำร้องของคุณถูกส่งเรียบร้อยแล้ว และอยู่ในระหว่างการพิจารณา',
      });
      setTimeout(onBack, 2000);
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



  // 3. อัปเดตฟังก์ชัน calculateTrainingAmounts
  const calculateTrainingAmounts = (total: number, remainingBudget: number) => {
    const vat = total * 0.07;
    const withholding = total * 0.03;
    const grossAmount = total + vat;
    const remainingNum = Number(remainingBudget);

    let netNum = 0;
    let excessAmountValue = 0;
    let companyPaymentValue = 0;
    let employeePaymentValue = 0;

    if (grossAmount > remainingNum) {
      // --- กรณีเกินงบประมาณ ---
      excessAmountValue = grossAmount - remainingNum;
      netNum = grossAmount;
      
      companyPaymentValue = excessAmountValue / 2;
      employeePaymentValue = (excessAmountValue / 2) + withholding;

    } else {
      // --- กรณีไม่เกินงบประมาณ ---
      netNum = grossAmount + withholding;
      excessAmountValue = 0;
      companyPaymentValue = 0;
      employeePaymentValue = 0;
    }

    // --- อัปเดตค่าทั้งหมดไปยังฟอร์ม ---
    setValue('totalAmount', total);
    setValue('tax7Percent', vat);
    setValue('withholdingTax3Percent', withholding);
    setValue('netAmount', netNum);
    setValue('excessAmount', excessAmountValue); // ตั้งค่า Field ใหม่
    setValue('companyPayment', companyPaymentValue);
    setValue('employeePayment', employeePaymentValue);
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

  // Watch start and end dates
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  // Update total days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const days = calculateTotalDays(startDate, endDate);
      setValue('totalDays', days);
    }
  }, [startDate, endDate, setValue]);

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
        {maxAmount !== null && type !== 'training' && (
          <div className="mb-6">
            <Alert>
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                {type === 'childbirth' ? (
                  <>คลอดธรรมชาติ 4,000 บาท, ผ่าคลอด 6,000 บาท</>
                ) : (
                  <>วงเงินสูงสุด: {isMonthly ? `${maxAmount} บาท/เดือน` : `${maxAmount.toLocaleString()} บาท/ปี`}</>
                )}
                {condition && <> ({condition})</>}
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {/* Display remaining budget for non-training types */}
        {user && type !== 'training' && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700">
              งบประมาณคงเหลือสำหรับสวัสดิการนี้: <span className="font-bold text-welfare-blue">{remainingBudget.toLocaleString()} บาท</span>
            </p>
          </div>
        )}
        
        {type === 'training' && (
          <div className="space-y-4 mb-6">
            <Alert>
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                วงเงินสูงสุด: {maxAmount?.toLocaleString() || '0'} บาท
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                งบประมาณคงเหลือ: {remainingBudget?.toLocaleString() || '0'} บาท
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
                      validate: value => !value || !startDate || value >= startDate || 'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่ม'
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
                    onChange: (e) => calculateTrainingAmounts(Number(e.target.value), remainingBudget)
                  })}
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="form-label">ภาษีมูลค่าเพิ่ม 7%</label>
                  <Input
                    type="number"
                    className="form-input"
                    readOnly
                    {...register('tax7Percent')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="form-label">หักภาษี ณ ที่จ่าย 3%</label>
                  <Input
                    type="number"
                    className="form-input"
                    readOnly
                    {...register('withholdingTax3Percent')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="form-label">จำนวนเงินสุทธิ</label>
                  <Input
                    type="number"
                    className="form-input"
                    readOnly
                    {...register('netAmount')}
                  />
                </div>
              </div>
              
              {/* 2. เพิ่ม Field 'ยอดส่วนเกินทั้งหมด' ในหน้าฟอร์ม (JSX) */}
              <div className="space-y-2">
                  <label className="form-label">ยอดส่วนเกินทั้งหมด</label>
                  <Input
                      type="number"
                      className="form-input bg-gray-100"
                      readOnly
                      {...register('excessAmount')}
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="form-label">บริษัทจ่าย</label>
                  <Input
                    type="number"
                    className="form-input bg-gray-100"
                    readOnly
                    {...register('companyPayment')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="form-label">พนักงานจ่าย</label>
                  <Input
                    type="number"
                    className="form-input bg-gray-100"
                    readOnly
                    {...register('employeePayment')}
                  />
                </div>
              </div>
            </>
          )}
          
          {/* Continue with existing fields for other welfare types */}
          {type !== 'training' && (
            <>
              {/* Original amount field */}
              <div className="space-y-2">
                <label htmlFor="amount" className="form-label">จำนวนเงิน (บาท)</label>
                <Input
                  id="amount"
                  type="number"
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
                    }
                  })}
                  
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>
            </>
          )}
          
          {/* Title Field */}
          <div className="space-y-2">
            <label htmlFor="title" className="form-label">หัวข้อ (ถ้ามี)</label>
            <input
              id="title"
              type="text"
              className="form-input"
              placeholder="ระบุหัวข้อคำร้อง (ถ้ามี)"
              {...register('title')}
            />
          </div>

          {/* Details Field */}
          <div className="space-y-2">
            <label htmlFor="details" className="form-label">รายละเอียด</label>
            <Textarea
              id="details"
              className="form-input min-h-[100px]"
              placeholder="กรอกรายละเอียดเพิ่มเติมถ้ามี"
              {...register('details', { 
                required: 'กรุณาระบุรายละเอียด',
                minLength: {
                  value: 0,
                  message: 'รายละเอียดต้องมีความยาวอย่างน้อย 10 ตัวอักษร'
                }
              })}
            />
            {errors.details && (
              <p className="text-red-500 text-sm mt-1">{errors.details.message}</p>
            )}
          </div>
          
          {/* File Upload */}
          <div className="space-y-2">
            <label htmlFor="attachments" className="form-label">แนบเอกสาร (ใบเสร็จรับเงิน, เอกสารประกอบ)</label>
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
                    // Extract file name from URL
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
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full btn-hover-effect"
            disabled={isLoading || isSubmitting}
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
    </div>
  );
}