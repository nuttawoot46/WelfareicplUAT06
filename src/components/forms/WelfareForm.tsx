
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { WelfareType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useWelfare } from '@/context/WelfareContext';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface WelfareFormProps {
  type: WelfareType;
  onBack: () => void;
}

interface FormValues {
  date: string;
  amount: number;
  details: string;
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
  const { submitRequest, isLoading } = useWelfare();
  const [files, setFiles] = useState<string[]>([]);
  const { toast } = useToast();
  
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors } 
  } = useForm<FormValues>();

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
                }
              })}
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
