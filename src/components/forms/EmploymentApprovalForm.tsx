import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/AuthContext';
import { useWelfare } from '@/context/WelfareContext';
import { WelfareRequest } from '@/types';
import { toast } from 'sonner';

interface EmploymentApprovalFormData {
  employmentType: 'new-hire' | 'replacement' | 'temporary' | 'contract-extension';
  positionTitle: string;
  departmentRequesting: string;
  reportingTo: string;
  employmentStartDate: string;
  employmentEndDate?: string;
  workingHours: string;
  probationPeriod: number;
  salaryOffered: number;
  housingAllowance: number;
  transportationAllowance: number;
  mealAllowance: number;
  otherAllowance: number;
  otherAllowanceDescription: string;
  benefits: string[];
  jobDescription: string;
  educationRequired: string;
  experienceRequired: string;
  skillsRequired: string;
  certificationsRequired: string;
  reasonForHiring: string;
  budgetCode: string;
  costCenter: string;
  replacementFor: string;
  contractType: 'permanent' | 'temporary' | 'contract' | 'probation';
  workLocation: string;
  numberOfPositions: number;
  urgencyLevel: 'normal' | 'urgent' | 'critical';
  recruitmentMethod: 'internal' | 'external' | 'agency' | 'referral';
  expectedInterviewDate: string;
  expectedOnboardingDate: string;
}

const benefitOptions = [
  'ประกันสังคม',
  'ประกันสุขภาพ',
  'ประกันชีวิต',
  'กองทุนสำรองเลี้ยงชีพ',
  'โบนัสประจำปี',
  'ค่าเดินทาง',
  'ค่าโทรศัพท์',
  'ค่าอาหาร',
  'ชุดยูนิฟอร์ม',
  'วันหยุดพักผ่อน',
];

export function EmploymentApprovalForm() {
  const { user, profile } = useAuth();
  const { submitRequest } = useWelfare();
  const [loading, setLoading] = useState(false);
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EmploymentApprovalFormData>({
    defaultValues: {
      employmentType: 'new-hire',
      contractType: 'probation',
      urgencyLevel: 'normal',
      recruitmentMethod: 'external',
      numberOfPositions: 1,
      probationPeriod: 3,
      workingHours: '08:00-17:00',
      housingAllowance: 0,
      transportationAllowance: 0,
      mealAllowance: 0,
      otherAllowance: 0,
    }
  });

  const employmentType = watch('employmentType');
  const contractType = watch('contractType');

  const handleBenefitToggle = (benefit: string) => {
    setSelectedBenefits(prev =>
      prev.includes(benefit)
        ? prev.filter(b => b !== benefit)
        : [...prev, benefit]
    );
  };

  const onSubmit = async (data: EmploymentApprovalFormData) => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อนส่งคำขอ');
      return;
    }

    try {
      setLoading(true);

      const totalAllowances = 
        (data.housingAllowance || 0) +
        (data.transportationAllowance || 0) +
        (data.mealAllowance || 0) +
        (data.otherAllowance || 0);

      const totalCompensation = (data.salaryOffered || 0) + totalAllowances;

      const request: Partial<WelfareRequest> = {
        userId: user.id,
        userName: profile?.display_name || user.email,
        userDepartment: profile?.department || '',
        type: 'employment-approval',
        status: 'pending_manager',
        amount: totalCompensation,
        date: new Date().toISOString(),
        title: `ขออนุมัติการจ้างงาน - ${data.positionTitle}`,
        details: data.reasonForHiring || '',
        employmentType: data.employmentType,
        positionTitle: data.positionTitle,
        departmentRequesting: data.departmentRequesting,
        reportingTo: data.reportingTo,
        employmentStartDate: data.employmentStartDate,
        employmentEndDate: data.employmentEndDate,
        workingHours: data.workingHours,
        probationPeriod: data.probationPeriod,
        salaryOffered: data.salaryOffered,
        allowances: {
          housing: data.housingAllowance,
          transportation: data.transportationAllowance,
          meal: data.mealAllowance,
          other: data.otherAllowance,
          otherDescription: data.otherAllowanceDescription,
        },
        benefits: selectedBenefits,
        jobDescription: data.jobDescription,
        qualifications: {
          education: data.educationRequired,
          experience: data.experienceRequired,
          skills: data.skillsRequired.split(',').map(s => s.trim()).filter(Boolean),
          certifications: data.certificationsRequired.split(',').map(c => c.trim()).filter(Boolean),
        },
        reasonForHiring: data.reasonForHiring,
        budgetCode: data.budgetCode,
        costCenter: data.costCenter,
        replacementFor: data.replacementFor,
        contractType: data.contractType,
        workLocation: data.workLocation,
        numberOfPositions: data.numberOfPositions,
        urgencyLevel: data.urgencyLevel,
        recruitmentMethod: data.recruitmentMethod,
        expectedInterviewDate: data.expectedInterviewDate,
        expectedOnboardingDate: data.expectedOnboardingDate,
      };

      await submitRequest(request as any);
      toast.success('ส่งคำขออนุมัติการจ้างงานสำเร็จ');
    } catch (error) {
      console.error('Error submitting employment approval:', error);
      toast.error('เกิดข้อผิดพลาดในการส่งคำขอ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>แบบขออนุมัติการจ้างงาน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section 1: ข้อมูลทั่วไป */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">1. ข้อมูลทั่วไป</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentType">ประเภทการจ้างงาน *</Label>
                <Select
                  value={employmentType}
                  onValueChange={(value) => setValue('employmentType', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new-hire">จ้างใหม่</SelectItem>
                    <SelectItem value="replacement">ทดแทนตำแหน่งเดิม</SelectItem>
                    <SelectItem value="temporary">จ้างชั่วคราว</SelectItem>
                    <SelectItem value="contract-extension">ต่อสัญญา</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfPositions">จำนวนตำแหน่ง *</Label>
                <Input
                  id="numberOfPositions"
                  type="number"
                  min="1"
                  {...register('numberOfPositions', { required: true, min: 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="positionTitle">ตำแหน่งงาน *</Label>
                <Input
                  id="positionTitle"
                  {...register('positionTitle', { required: true })}
                  placeholder="เช่น วิศวกรซอฟต์แวร์"
                />
                {errors.positionTitle && (
                  <span className="text-sm text-red-500">กรุณาระบุตำแหน่งงาน</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="departmentRequesting">แผนกที่ขอจ้าง *</Label>
                <Input
                  id="departmentRequesting"
                  {...register('departmentRequesting', { required: true })}
                  placeholder="เช่น แผนกพัฒนาระบบ"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reportingTo">รายงานตัวต่อ *</Label>
                <Input
                  id="reportingTo"
                  {...register('reportingTo', { required: true })}
                  placeholder="ชื่อผู้บังคับบัญชา"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workLocation">สถานที่ทำงาน *</Label>
                <Input
                  id="workLocation"
                  {...register('workLocation', { required: true })}
                  placeholder="เช่น สำนักงานใหญ่ กรุงเทพฯ"
                />
              </div>
            </div>

            {employmentType === 'replacement' && (
              <div className="space-y-2">
                <Label htmlFor="replacementFor">ทดแทนตำแหน่งของ</Label>
                <Input
                  id="replacementFor"
                  {...register('replacementFor')}
                  placeholder="ชื่อพนักงานที่จะทดแทน"
                />
              </div>
            )}
          </div>

          {/* Section 2: รายละเอียดการจ้างงาน */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">2. รายละเอียดการจ้างงาน</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractType">ประเภทสัญญา *</Label>
                <Select
                  value={contractType}
                  onValueChange={(value) => setValue('contractType', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="probation">ทดลองงาน</SelectItem>
                    <SelectItem value="permanent">พนักงานประจำ</SelectItem>
                    <SelectItem value="temporary">ชั่วคราว</SelectItem>
                    <SelectItem value="contract">สัญญาจ้าง</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="probationPeriod">ระยะเวลาทดลองงาน (เดือน)</Label>
                <Input
                  id="probationPeriod"
                  type="number"
                  min="0"
                  max="12"
                  {...register('probationPeriod')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentStartDate">วันที่เริ่มงาน *</Label>
                <Input
                  id="employmentStartDate"
                  type="date"
                  {...register('employmentStartDate', { required: true })}
                />
              </div>

              {(contractType === 'temporary' || contractType === 'contract') && (
                <div className="space-y-2">
                  <Label htmlFor="employmentEndDate">วันที่สิ้นสุดสัญญา</Label>
                  <Input
                    id="employmentEndDate"
                    type="date"
                    {...register('employmentEndDate')}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="workingHours">เวลาทำงาน *</Label>
              <Input
                id="workingHours"
                {...register('workingHours', { required: true })}
                placeholder="เช่น 08:00-17:00"
              />
            </div>
          </div>

          {/* Section 3: ค่าตอบแทนและสวัสดิการ */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">3. ค่าตอบแทนและสวัสดิการ</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salaryOffered">เงินเดือน (บาท) *</Label>
                <Input
                  id="salaryOffered"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('salaryOffered', { required: true, min: 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="housingAllowance">ค่าที่พัก (บาท)</Label>
                <Input
                  id="housingAllowance"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('housingAllowance')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transportationAllowance">ค่าเดินทาง (บาท)</Label>
                <Input
                  id="transportationAllowance"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('transportationAllowance')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mealAllowance">ค่าอาหาร (บาท)</Label>
                <Input
                  id="mealAllowance"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('mealAllowance')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="otherAllowance">เบี้ยเลี้ยงอื่นๆ (บาท)</Label>
                <Input
                  id="otherAllowance"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('otherAllowance')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherAllowanceDescription">ระบุเบี้ยเลี้ยงอื่นๆ</Label>
                <Input
                  id="otherAllowanceDescription"
                  {...register('otherAllowanceDescription')}
                  placeholder="ระบุรายละเอียด"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>สวัสดิการที่ได้รับ</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {benefitOptions.map((benefit) => (
                  <div key={benefit} className="flex items-center space-x-2">
                    <Checkbox
                      id={benefit}
                      checked={selectedBenefits.includes(benefit)}
                      onCheckedChange={() => handleBenefitToggle(benefit)}
                    />
                    <Label htmlFor={benefit} className="font-normal cursor-pointer">
                      {benefit}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: คุณสมบัติและหน้าที่ */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">4. คุณสมบัติและหน้าที่</h3>
            
            <div className="space-y-2">
              <Label htmlFor="jobDescription">หน้าที่และความรับผิดชอบ *</Label>
              <Textarea
                id="jobDescription"
                {...register('jobDescription', { required: true })}
                rows={4}
                placeholder="อธิบายหน้าที่และความรับผิดชอบของตำแหน่งนี้"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="educationRequired">วุฒิการศึกษา *</Label>
              <Input
                id="educationRequired"
                {...register('educationRequired', { required: true })}
                placeholder="เช่น ปริญญาตรี สาขาวิทยาการคอมพิวเตอร์"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceRequired">ประสบการณ์ที่ต้องการ *</Label>
              <Input
                id="experienceRequired"
                {...register('experienceRequired', { required: true })}
                placeholder="เช่น 2-3 ปี ในสายงานที่เกี่ยวข้อง"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillsRequired">ทักษะที่ต้องการ (คั่นด้วยเครื่องหมายจุลภาค)</Label>
              <Textarea
                id="skillsRequired"
                {...register('skillsRequired')}
                rows={2}
                placeholder="เช่น JavaScript, React, Node.js, SQL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificationsRequired">ใบรับรองหรือคุณสมบัติพิเศษ (คั่นด้วยเครื่องหมายจุลภาค)</Label>
              <Input
                id="certificationsRequired"
                {...register('certificationsRequired')}
                placeholder="เช่น PMP, AWS Certified"
              />
            </div>
          </div>

          {/* Section 5: เหตุผลและความจำเป็น */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">5. เหตุผลและความจำเป็น</h3>
            
            <div className="space-y-2">
              <Label htmlFor="reasonForHiring">เหตุผลในการจ้างงาน *</Label>
              <Textarea
                id="reasonForHiring"
                {...register('reasonForHiring', { required: true })}
                rows={4}
                placeholder="อธิบายเหตุผลและความจำเป็นในการจ้างงานตำแหน่งนี้"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="urgencyLevel">ระดับความเร่งด่วน *</Label>
                <Select
                  defaultValue="normal"
                  onValueChange={(value) => setValue('urgencyLevel', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">ปกติ</SelectItem>
                    <SelectItem value="urgent">เร่งด่วน</SelectItem>
                    <SelectItem value="critical">เร่งด่วนมาก</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recruitmentMethod">วิธีการสรรหา *</Label>
                <Select
                  defaultValue="external"
                  onValueChange={(value) => setValue('recruitmentMethod', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">ภายในองค์กร</SelectItem>
                    <SelectItem value="external">ภายนอกองค์กร</SelectItem>
                    <SelectItem value="agency">ผ่านเอเจนซี่</SelectItem>
                    <SelectItem value="referral">แนะนำโดยพนักงาน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expectedInterviewDate">วันที่คาดว่าจะสัมภาษณ์</Label>
                <Input
                  id="expectedInterviewDate"
                  type="date"
                  {...register('expectedInterviewDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedOnboardingDate">วันที่คาดว่าจะเริ่มงาน</Label>
                <Input
                  id="expectedOnboardingDate"
                  type="date"
                  {...register('expectedOnboardingDate')}
                />
              </div>
            </div>
          </div>

          {/* Section 6: ข้อมูลงบประมาณ */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">6. ข้อมูลงบประมาณ</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetCode">รหัสงบประมาณ</Label>
                <Input
                  id="budgetCode"
                  {...register('budgetCode')}
                  placeholder="เช่น BUD-2024-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costCenter">Cost Center</Label>
                <Input
                  id="costCenter"
                  {...register('costCenter')}
                  placeholder="เช่น CC-IT-001"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'กำลังส่งคำขอ...' : 'ส่งคำขออนุมัติ'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
