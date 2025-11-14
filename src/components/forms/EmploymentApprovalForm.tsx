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
  hiringReason: 'replacement' | 'new-position' | 'temporary';
  replacementFor?: string;
  replacementReason?: string;
  temporaryDurationYears?: number;
  temporaryDurationMonths?: number;
  temporaryReason?: string;
  gender: string;
  minimumEducation: string;
  major: string;
  experienceField: string;
  minimumExperience: string;
  otherSkills: string;
  budgetCode: string;
  costCenter: string;
  contractType: 'permanent' | 'temporary' | 'contract' | 'probation';
  workLocation: string;
  numberOfPositions: number;
}

const departmentOptions = [
  'Inspiration (IS)',
  'Management',
  'Strategy',
  'Account',
  'Marketing(PES)',
  'Marketing(DIS)',
  'Marketing(COP)',
  'Marketing(PD)',
  'Procurement',
  'Registration',
];

export function EmploymentApprovalForm() {
  const { user, profile } = useAuth();
  const { submitRequest } = useWelfare();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EmploymentApprovalFormData>({
    defaultValues: {
      employmentType: 'new-hire',
      contractType: 'probation',
      numberOfPositions: 1,
      workingHours: '08:00-17:00',
      hiringReason: 'new-position',
      temporaryDurationYears: 0,
      temporaryDurationMonths: 0,
      gender: 'ไม่ระบุ',
      minimumEducation: 'ปริญญาตรี',
    }
  });

  const employmentType = watch('employmentType');
  const contractType = watch('contractType');
  const hiringReason = watch('hiringReason');

  const onSubmit = async (data: EmploymentApprovalFormData) => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อนส่งคำขอ');
      return;
    }

    try {
      setLoading(true);

      const request: Partial<WelfareRequest> = {
        userId: user.id,
        userName: profile?.display_name || user.email,
        userDepartment: profile?.department || '',
        type: 'employment-approval',
        status: 'pending_manager',
        amount: 0,
        date: new Date().toISOString(),
        title: `ขออนุมัติการจ้างงาน - ${data.positionTitle}`,
        details: `แผนก: ${data.departmentRequesting}, ตำแหน่ง: ${data.positionTitle}`,
        employmentType: data.employmentType,
        positionTitle: data.positionTitle,
        departmentRequesting: data.departmentRequesting,
        reportingTo: data.reportingTo,
        employmentStartDate: data.employmentStartDate,
        employmentEndDate: data.employmentEndDate,
        workingHours: data.workingHours,
        hiringReason: data.hiringReason,
        replacementFor: data.replacementFor,
        replacementReason: data.replacementReason,
        temporaryDurationYears: data.temporaryDurationYears,
        temporaryDurationMonths: data.temporaryDurationMonths,
        temporaryReason: data.temporaryReason,
        gender: data.gender,
        minimumEducation: data.minimumEducation,
        major: data.major,
        experienceField: data.experienceField,
        minimumExperience: data.minimumExperience,
        otherSkills: data.otherSkills,
        budgetCode: data.budgetCode,
        costCenter: data.costCenter,
        contractType: data.contractType,
        workLocation: data.workLocation,
        numberOfPositions: data.numberOfPositions,
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
                <Select
                  value={watch('departmentRequesting')}
                  onValueChange={(value) => setValue('departmentRequesting', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกแผนก" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentOptions.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          </div>

          {/* Section 2: รายละเอียดการจ้างงาน */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">2. รายละเอียดการจ้างงาน</h3>
            
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
              <Label htmlFor="hiringReason">ประเภท/เหตุผลการจ้าง *</Label>
              <Select
                value={hiringReason}
                onValueChange={(value) => setValue('hiringReason', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="replacement">ตำแหน่งทดแทน</SelectItem>
                  <SelectItem value="new-position">ตำแหน่งงานใหม่</SelectItem>
                  <SelectItem value="temporary">ตำแหน่งชั่วคราว</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hiringReason === 'replacement' && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <div className="space-y-2">
                  <Label htmlFor="replacementFor">ทดแทนใคร</Label>
                  <Input
                    id="replacementFor"
                    {...register('replacementFor')}
                    placeholder="ระบุชื่อพนักงานที่จะทดแทน"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replacementReason">ลาออกไป</Label>
                  <Input
                    id="replacementReason"
                    {...register('replacementReason')}
                    placeholder="ระบุเหตุผล เช่น ลาออก, เกษียณอายุ"
                  />
                </div>
              </div>
            )}

            {hiringReason === 'temporary' && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="temporaryDurationYears">ระยะเวลาจ้าง (ปี)</Label>
                    <Input
                      id="temporaryDurationYears"
                      type="number"
                      min="0"
                      {...register('temporaryDurationYears')}
                      placeholder="จำนวนปี"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temporaryDurationMonths">ระยะเวลาจ้าง (เดือน)</Label>
                    <Input
                      id="temporaryDurationMonths"
                      type="number"
                      min="0"
                      max="11"
                      {...register('temporaryDurationMonths')}
                      placeholder="จำนวนเดือน"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temporaryReason">เหตุผล</Label>
                  <Textarea
                    id="temporaryReason"
                    {...register('temporaryReason')}
                    rows={3}
                    placeholder="ระบุเหตุผลในการจ้างชั่วคราว"
                  />
                </div>
              </div>
            )}

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

          {/* Section 3: คุณสมบัติและหน้าที่ */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">3. คุณสมบัติและหน้าที่</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">เพศ *</Label>
                <Select
                  value={watch('gender')}
                  onValueChange={(value) => setValue('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ชาย">ชาย</SelectItem>
                    <SelectItem value="หญิง">หญิง</SelectItem>
                    <SelectItem value="ไม่ระบุ">ไม่ระบุ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumEducation">วุฒิการศึกษาขั้นต่ำ *</Label>
                <Select
                  value={watch('minimumEducation')}
                  onValueChange={(value) => setValue('minimumEducation', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ม.6">ม.6</SelectItem>
                    <SelectItem value="ปวช.">ปวช.</SelectItem>
                    <SelectItem value="ปวส.">ปวส.</SelectItem>
                    <SelectItem value="ปริญญาตรี">ปริญญาตรี</SelectItem>
                    <SelectItem value="ปริญญาโท">ปริญญาโท</SelectItem>
                    <SelectItem value="ปริญญาเอก">ปริญญาเอก</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="major">สาขาวิชา</Label>
              <Input
                id="major"
                {...register('major')}
                placeholder="เช่น วิทยาการคอมพิวเตอร์, บริหารธุรกิจ, วิศวกรรมศาสตร์"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experienceField">ประสบการณ์ด้าน</Label>
                <Input
                  id="experienceField"
                  {...register('experienceField')}
                  placeholder="เช่น การตลาดดิจิทัล, การพัฒนาซอฟต์แวร์"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumExperience">ประสบการณ์ขั้นต่ำ</Label>
                <Input
                  id="minimumExperience"
                  {...register('minimumExperience')}
                  placeholder="เช่น 2-3 ปี, 5 ปีขึ้นไป"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherSkills">ความสามารถชำนาญอื่นๆ</Label>
              <Textarea
                id="otherSkills"
                {...register('otherSkills')}
                rows={3}
                placeholder="ระบุความสามารถ ทักษะพิเศษ หรือคุณสมบัติอื่นๆ ที่ต้องการ"
              />
            </div>
          </div>

          {/* Section 4: ข้อมูลงบประมาณ */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">4. ข้อมูลงบประมาณ</h3>
            
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
