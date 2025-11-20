import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useInternalTraining } from '@/context/InternalTrainingContext';
import { ArrowLeft, Plus, X, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { generateInternalTrainingPDF } from '../pdf/InternalTrainingPDFGenerator';
import { uploadPDFToSupabase } from '@/utils/pdfUtils';

interface InternalTrainingFormProps {
  onBack: () => void;
  editId?: number | null;
}

interface ParticipantGroup {
  team: string;
  count: number;
}

interface FormValues {
  // Section 1: Training Details
  department: string;
  branch: string;
  courseName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  venue: string;

  // Section 2: Participants
  participants: ParticipantGroup[];
  totalParticipants: number;

  // Section 3: Budget and Expenses
  instructorFee: number;
  roomFoodBeverage: number;
  otherExpenses: number;
  withholdingTax: number;
  vat: number;
  totalAmount: number;
  averageCostPerPerson: number;

  // Section 4: Notes
  taxCertificateName: string;
  withholdingTaxAmount: number;
  additionalNotes: string;
}

// Available teams/departments
const TEAMS = [
  'HR',
  'Finance',
  'IT',
  'Marketing',
  'Sales',
  'Operations',
  'Production',
  'Quality Assurance',
  'Research & Development',
  'Customer Service'
];

// Available departments
const DEPARTMENTS = [
  'บริหาร',
  'การเงิน',
  'บุคคล',
  'ขาย',
  'การตลาด',
  'ผลิต',
  'คุณภาพ',
  'วิจัยและพัฒนา',
  'บริการลูกค้า',
  'IT'
];

// Available branches
const BRANCHES = [
  'สำนักงานใหญ่',
  'สาขาภาคเหนือ',
  'สาขาภาคใต้',
  'สาขาภาคตะวันออก',
  'สาขาภาคตะวันตก'
];

export function InternalTrainingForm({ onBack, editId }: InternalTrainingFormProps) {
  const { user, profile } = useAuth();
  const { submitRequest, updateRequest, refreshRequests, isLoading } = useInternalTraining();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      participants: [{ team: '', count: 0 }],
      totalParticipants: 0,
      totalHours: 0,
      totalAmount: 0,
      averageCostPerPerson: 0,
      withholdingTax: 0,
      vat: 0
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants"
  });

  // Watch values for calculations
  const watchedValues = watch([
    'instructorFee',
    'roomFoodBeverage', 
    'otherExpenses',
    'withholdingTax',
    'vat',
    'participants',
    'startTime',
    'endTime',
    'startDate',
    'endDate'
  ]);

  // Calculate total participants
  useEffect(() => {
    const participants = watch('participants') || [];
    const total = participants.reduce((sum, p) => sum + (Number(p.count) || 0), 0);
    setValue('totalParticipants', total);
  }, [watch('participants'), setValue]);

  // Calculate total hours
  useEffect(() => {
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
  }, [watch('startTime'), watch('endTime'), watch('startDate'), watch('endDate'), setValue]);

  // Calculate totals and averages
  useEffect(() => {
    const instructorFee = Number(watch('instructorFee')) || 0;
    const roomFoodBeverage = Number(watch('roomFoodBeverage')) || 0;
    const otherExpenses = Number(watch('otherExpenses')) || 0;
    const withholdingTax = Number(watch('withholdingTax')) || 0;
    const vat = Number(watch('vat')) || 0;
    const totalParticipants = Number(watch('totalParticipants')) || 0;

    const subtotal = instructorFee + roomFoodBeverage + otherExpenses;
    const total = subtotal + vat - withholdingTax;
    const average = totalParticipants > 0 ? total / totalParticipants : 0;

    setValue('totalAmount', Math.round(total * 100) / 100);
    setValue('averageCostPerPerson', Math.round(average * 100) / 100);
  }, [watchedValues, setValue]);

  // Auto-calculate withholding tax (3%) and VAT (7%)
  useEffect(() => {
    const instructorFee = Number(watch('instructorFee')) || 0;
    const roomFoodBeverage = Number(watch('roomFoodBeverage')) || 0;
    const otherExpenses = Number(watch('otherExpenses')) || 0;
    
    const subtotal = instructorFee + roomFoodBeverage + otherExpenses;
    const autoWithholding = subtotal * 0.03;
    const autoVat = subtotal * 0.07;
    
    setValue('withholdingTax', Math.round(autoWithholding * 100) / 100);
    setValue('vat', Math.round(autoVat * 100) / 100);
    setValue('withholdingTaxAmount', Math.round(autoWithholding * 100) / 100);
  }, [watch('instructorFee'), watch('roomFoodBeverage'), watch('otherExpenses'), setValue]);

  // Load edit data if editId is provided
  useEffect(() => {
    const fetchEditData = async () => {
      if (editId) {
        try {
          const { data, error } = await supabase
            .from('welfare_requests')
            .select('*')
            .eq('id', editId)
            .eq('request_type', 'internal_training')
            .single();

          if (!error && data) {
            // Parse JSON fields
            const participants = data.participants ? 
              (typeof data.participants === 'string' ? JSON.parse(data.participants) : data.participants) 
              : [{ team: '', count: 0 }];
            
            reset({
              department: data.department_request || '',
              branch: data.branch || '',
              courseName: data.course_name || '',
              startDate: data.start_date || '',
              endDate: data.end_date || '',
              startTime: data.start_time || '',
              endTime: data.end_time || '',
              totalHours: data.total_hours || 0,
              venue: data.venue || '',
              participants: participants,
              totalParticipants: data.total_participants || 0,
              instructorFee: data.instructor_fee || 0,
              roomFoodBeverage: data.room_food_beverage || 0,
              otherExpenses: data.other_expenses || 0,
              withholdingTax: data.withholding_tax || 0,
              vat: data.vat || 0,
              totalAmount: data.total_amount || 0,
              averageCostPerPerson: data.average_cost_per_person || 0,
              taxCertificateName: data.tax_certificate_name || '',
              withholdingTaxAmount: data.withholding_tax_amount || 0,
              additionalNotes: data.additional_notes || ''
            });
          }
        } catch (error) {
          console.error('Error fetching edit data:', error);
          toast({
            title: 'เกิดข้อผิดพลาด',
            description: 'ไม่สามารถโหลดข้อมูลสำหรับแก้ไขได้',
            variant: 'destructive'
          });
        }
      }
    };

    fetchEditData();
  }, [editId, reset, toast]);

  const onSubmit = async (data: FormValues) => {
    // ป้องกันการ submit ซ้ำ
    if (isSubmitting || isLoading) {
      console.log('Form is already being submitted, preventing duplicate');
      return;
    }
    
    try {
      setIsSubmitting(true);

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get employee data
      const { data: employeeData, error: employeeError } = await supabase
        .from('Employee')
        .select('id, Name, Position, Team, start_date')
        .eq('email_user', user.email)
        .single();

      if (employeeError || !employeeData) {
        throw new Error('Employee data not found');
      }

      const requestData = {
        employee_id: employeeData.id,
        employee_name: employeeData.Name || user.name || 'Unknown User',
        request_type: 'internal_training',
        status: 'pending_manager',
        title: data.courseName,
        details: data.additionalNotes || '',
        amount: data.totalAmount,
        department_request: data.department,
        branch: data.branch,
        course_name: data.courseName,
        start_date: data.startDate,
        end_date: data.endDate,
        start_time: data.startTime,
        end_time: data.endTime,
        total_hours: data.totalHours,
        venue: data.venue,
        participants: JSON.stringify(data.participants),
        total_participants: data.totalParticipants,
        instructor_fee: data.instructorFee,
        room_food_beverage: data.roomFoodBeverage,
        other_expenses: data.otherExpenses,
        withholding_tax: data.withholdingTax,
        vat: data.vat,
        total_amount: data.totalAmount,
        average_cost_per_person: data.averageCostPerPerson,
        tax_certificate_name: data.taxCertificateName,
        withholding_tax_amount: data.withholdingTaxAmount,
        additional_notes: data.additionalNotes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Debug logs removed for production

      let requestId: number;
      let result: any;

      if (editId) {
        // Update existing request
        await updateRequest(editId, requestData);
        requestId = editId;
        
        toast({
          title: 'แก้ไขสำเร็จ',
          description: 'ข้อมูลคำร้องอบรมภายในได้รับการแก้ไขเรียบร้อยแล้ว'
        });
      } else {
        // Create new request - ป้องกันการ submit ซ้ำ
        if (isSubmitting) {
          console.log('Already submitting, preventing duplicate submission');
          return;
        }
        
        result = await submitRequest(requestData);
        if (!result) {
          throw new Error('ไม่สามารถส่งคำร้องได้');
        }
        requestId = result.id;
        
        toast({
          title: 'ส่งคำร้องสำเร็จ',
          description: 'คำร้องอบรมภายในของคุณถูกส่งเรียบร้อยแล้ว'
        });
      }

      await refreshRequests();

      // Generate and upload PDF
      try {
        const pdfRequest = {
          ...requestData,
          id: requestId,
          participants: data.participants
        };

        const blob = await generateInternalTrainingPDF(
          pdfRequest as any,
          user,
          employeeData
        );

        // Create safe filename
        const employeeId = employeeData?.employee_id || user?.id?.slice(-8) || 'user';
        const timestamp = Date.now();
        const filename = `internal_training_emp${employeeId}_${timestamp}.pdf`;
        
        const pdfUrl = await uploadPDFToSupabase(blob, filename, user?.id);

        // Update request with PDF URL
        if (pdfUrl) {
          await supabase
            .from('welfare_requests')
            .update({ pdf_request: pdfUrl })
            .eq('id', requestId);
        }

        console.log('PDF created and uploaded successfully');
      } catch (pdfError) {
        console.error('PDF generation/upload error:', pdfError);
        toast({
          title: 'คำเตือน',
          description: 'คำร้องถูกส่งแล้ว แต่ไม่สามารถสร้าง PDF ได้ในขณะนี้',
          variant: 'destructive'
        });
      }

      // รีเซ็ตฟอร์มและกลับไปหน้าหลัก
      reset();
      setTimeout(() => {
        onBack();
      }, 1500);

    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถส่งคำร้องได้ กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
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

      <div className="form-container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {editId ? 'แก้ไขฟอร์มเบิกค่าอบรม (ภายใน)' : 'ฟอร์มเบิกค่าอบรม (ภายใน)'}
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 1: Training Details */}
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4 text-blue-600">ส่วนที่ 1: รายละเอียดการอบรม</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
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
                {errors.department && (
                  <p className="text-red-500 text-sm">{errors.department.message}</p>
                )}
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
                {errors.branch && (
                  <p className="text-red-500 text-sm">{errors.branch.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <label className="form-label">ชื่อหลักสูตร/หัวข้ออบรม</label>
              <Input
                placeholder="ระบุชื่อหลักสูตรหรือหัวข้ออบรม"
                className="form-input"
                {...register('courseName', {
                  required: 'กรุณาระบุชื่อหลักสูตร'
                })}
              />
              {errors.courseName && (
                <p className="text-red-500 text-sm">{errors.courseName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
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
                  <p className="text-red-500 text-sm">{errors.startDate.message}</p>
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
                  <p className="text-red-500 text-sm">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
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
                  <p className="text-red-500 text-sm">{errors.startTime.message}</p>
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
                  <p className="text-red-500 text-sm">{errors.endTime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="form-label">รวมระยะเวลาการอบรม (ชั่วโมง)</label>
                <Input
                  type="number"
                  step="0.1"
                  className="form-input bg-gray-100"
                  readOnly
                  value={watch('totalHours') || 0}
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
                <p className="text-red-500 text-sm">{errors.venue.message}</p>
              )}
            </div>
          </div>

          {/* Section 2: Participants */}
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4 text-blue-600">ส่วนที่ 2: จำนวนผู้เข้าร่วมอบรม</h2>
            
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="form-label">เลือกทีม</label>
                    <Select
                      onValueChange={(value) => setValue(`participants.${index}.team`, value)}
                      defaultValue={watch(`participants.${index}.team`)}
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

                  <div className="flex-1 space-y-2">
                    <label className="form-label">จำนวน</label>
                    <Input
                      type="number"
                      min="0"
                      className="form-input"
                      {...register(`participants.${index}.count`, {
                        required: 'กรุณาระบุจำนวน',
                        min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' }
                      })}
                    />
                  </div>

                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="mb-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                onClick={() => append({ team: '', count: 0 })}
                variant="outline"
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มทีม
              </Button>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">รวมจำนวนผู้เข้าอบรมทั้งหมด:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {watch('totalParticipants') || 0} คน
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Budget and Expenses */}
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4 text-blue-600">ส่วนที่ 3: งบประมาณและค่าใช้จ่าย</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="form-label">ค่าวิทยากร (บาท)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  {...register('instructorFee', {
                    min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' }
                  })}
                />
                {errors.instructorFee && (
                  <p className="text-red-500 text-sm">{errors.instructorFee.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="form-label">ค่าห้อง อาหารและเครื่องดื่ม (บาท)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  {...register('roomFoodBeverage', {
                    min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' }
                  })}
                />
                {errors.roomFoodBeverage && (
                  <p className="text-red-500 text-sm">{errors.roomFoodBeverage.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <label className="form-label">ค่าใช้จ่ายอื่นๆ (บาท)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                {...register('otherExpenses', {
                  min: { value: 0, message: 'จำนวนต้องไม่น้อยกว่า 0' }
                })}
              />
              {errors.otherExpenses && (
                <p className="text-red-500 text-sm">{errors.otherExpenses.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="form-label">หักภาษี ณ ที่จ่าย (3%) (บาท)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input bg-gray-100"
                  readOnly
                  value={watch('withholdingTax') || 0}
                />
              </div>

              <div className="space-y-2">
                <label className="form-label">ภาษีมูลค่าเพิ่ม (VAT 7%) (บาท)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input bg-gray-100"
                  readOnly
                  value={watch('vat') || 0}
                />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">รวมเป็นเงินทั้งสิ้น:</span>
                <span className="text-xl font-bold text-green-600">
                  {(watch('totalAmount') || 0).toLocaleString('th-TH', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })} บาท
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">เฉลี่ยค่าใช้จ่ายต่อคน:</span>
                <span className="text-lg font-bold text-green-600">
                  {(watch('averageCostPerPerson') || 0).toLocaleString('th-TH', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })} บาท/คน
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4 text-blue-600">ส่วนที่ 4: หมายเหตุ</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="form-label">ออกหนังสือรับรองหักภาษี ณ ที่จ่ายในนาม</label>
                <Input
                  placeholder="ระบุชื่อสำหรับออกหนังสือรับรอง"
                  className="form-input"
                  {...register('taxCertificateName')}
                />
              </div>

              <div className="space-y-2">
                <label className="form-label">จำนวนเงินที่ต้องหัก ณ ที่จ่าย (บาท)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input bg-gray-100"
                  readOnly
                  value={watch('withholdingTaxAmount') || 0}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="form-label">หมายเหตุเพิ่มเติม</label>
              <Textarea
                className="form-input min-h-[100px]"
                placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
                {...register('additionalNotes')}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full btn-hover-effect"
            disabled={isSubmitting || isLoading}
            onClick={(e) => {
              // ป้องกันการคลิกซ้ำ
              if (isSubmitting || isLoading) {
                e.preventDefault();
                return;
              }
            }}
          >
            {(isSubmitting || isLoading) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editId ? 'กำลังบันทึก...' : 'กำลังส่งคำร้อง...'}
              </>
            ) : (
              editId ? 'บันทึกการแก้ไข' : 'ส่งคำร้อง'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}