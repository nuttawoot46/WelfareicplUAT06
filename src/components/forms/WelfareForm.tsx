
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WelfareType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useWelfare } from '@/context/WelfareContext';
import { ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WelfareFormProps {
  type: WelfareType;
  onBack: () => void;
}

interface FormValues {
  date: string;
  amount: number;
  details: string;
  birthType?: 'natural' | 'caesarean'; 
  attachments?: FileList;
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
  };
  
  return titles[type] || 'แบบฟอร์มขอสวัสดิการ';
};

export function WelfareForm({ type, onBack }: WelfareFormProps) {
  const { user } = useAuth();
  const { submitRequest, isLoading, getWelfareLimit, getRemainingBudget } = useWelfare();
  const [files, setFiles] = useState<string[]>([]);
  const { toast } = useToast();
  const [maxAmount, setMaxAmount] = useState<number | null>(null);
  const [condition, setCondition] = useState<string | undefined>();
  const [isMonthly, setIsMonthly] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    reset,
    watch,
    setValue,
    formState: { errors } 
  } = useForm<FormValues>();

  // For childbirth form
  const birthType = watch('birthType');
  
  useEffect(() => {
    if (!user) return;
    
    const limit = getWelfareLimit(type);
    setMaxAmount(limit.amount);
    setCondition(limit.condition);
    setIsMonthly(!!limit.monthly);
    
    // Set default values for specific welfare types
    if (type === 'wedding') {
      setValue('amount', 3000);
    } else if (type === 'fitness') {
      setValue('amount', 300);
    } else if (type === 'childbirth') {
      setValue('birthType', 'natural');
      setValue('amount', 4000);
    }
  }, [type, user, getWelfareLimit, setValue]);
  
  // Update amount when birth type changes
  useEffect(() => {
    if (type === 'childbirth' && birthType) {
      const amount = birthType === 'natural' ? 4000 : 6000;
      setValue('amount', amount);
    }
  }, [birthType, type, setValue]);

  // For demo purposes, we'll simulate file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    
    if (fileInput.files && fileInput.files.length > 0) {
      const newFiles = Array.from(fileInput.files).map(file => file.name);
      setFiles([...files, ...newFiles]);
      
      toast({
        title: "อัพโหลดสำเร็จ",
        description: `อัพโหลดไฟล์ ${newFiles.join(', ')} สำเร็จ`,
      });
    }
  };

  const onSubmit = (data: FormValues) => {
    if (!user) return;
    
    submitRequest({
      userId: user.id,
      userName: user.name,
      userDepartment: user.department,
      type,
      amount: Number(data.amount),
      date: data.date,
      details: data.details,
      attachments: files
    });
    
    // Reset form after successful submission
    reset();
    setFiles([]);
    
    // Wait for the submission to complete then go back to selector
    setTimeout(onBack, 2000);
  };

  const remainingBudget = user ? getRemainingBudget(user.id, type) : 0;

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
      
      <div className="form-container">
        <h1 className="text-2xl font-bold mb-6">{getFormTitle(type)}</h1>
        
        {/* Display welfare limits */}
        {maxAmount !== null && (
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
        
        {/* Display remaining budget */}
        {user && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700">
              งบประมาณคงเหลือสำหรับสวัสดิการนี้: <span className="font-bold text-welfare-blue">{remainingBudget.toLocaleString()} บาท</span>
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Date Field */}
          <div className="space-y-2">
            <label htmlFor="date" className="form-label">วันที่เกิดค่าใช้จ่าย</label>
            <Input
              id="date"
              type="date"
              className="form-input"
              {...register('date', { required: 'กรุณาระบุวันที่' })}
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>
          
          {/* Birth Type Field for Childbirth */}
          {type === 'childbirth' && (
            <div className="space-y-2">
              <label htmlFor="birthType" className="form-label">ประเภทการคลอด</label>
              <Select
                defaultValue="natural"
                onValueChange={(value) => setValue('birthType', value as 'natural' | 'caesarean')}
              >
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="เลือกประเภทการคลอด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="natural">คลอดธรรมชาติ (4,000 บาท)</SelectItem>
                  <SelectItem value="caesarean">ผ่าคลอด (6,000 บาท)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Amount Field */}
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
              readOnly={['wedding', 'childbirth', 'fitness'].includes(type)}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>
          
          {/* Details Field */}
          <div className="space-y-2">
            <label htmlFor="details" className="form-label">รายละเอียด</label>
            <Textarea
              id="details"
              className="form-input min-h-[100px]"
              placeholder="กรอกรายละเอียดเพิ่มเติม"
              {...register('details', { 
                required: 'กรุณาระบุรายละเอียด',
                minLength: {
                  value: 10,
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
                  {files.map((file, index) => (
                    <li key={index} className="flex items-center gap-2 text-green-600">
                      <Check className="h-4 w-4" />
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full btn-hover-effect"
            disabled={isLoading}
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
        </form>
      </div>
    </div>
  );
}
