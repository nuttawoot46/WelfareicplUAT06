import { useState, useEffect } from 'react';
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
import { supabase } from '@/lib/supabase';
import { generateAndDownloadEmploymentApprovalPDF } from '@/components/pdf/EmploymentApprovalPDFGenerator';
import { DigitalSignature } from '@/components/signature/DigitalSignature';

interface CurrentPosition {
  positionName: string;
  count: number;
}

interface EmploymentApprovalFormData {
  employmentType: 'new-hire' | 'replacement' | 'temporary' | 'contract-extension';
  departmentRequesting: string;
  currentEmployeeCount: number;
  currentPositions: CurrentPosition[];
  positionTitle: string;
  numberOfPositions: number;
  employmentStartDate: string;
  workLocation: string;
  reportingTo: string;
  employmentEndDate?: string;
  hiringReason: 'replacement' | 'new-position' | 'temporary';
  replacementFor?: string;
  replacementDepartureDate?: string;
  newPositionReason?: string;
  temporaryDurationYears?: number;
  temporaryDurationMonths?: number;
  gender: string;
  minimumEducation: string;
  major: string;
  experienceField: string;
  minimumExperience: string;
  otherSkills: string;
  contractType: 'permanent' | 'temporary' | 'contract' | 'probation';
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
  const [currentPositions, setCurrentPositions] = useState<CurrentPosition[]>([
    { positionName: '', count: 1 }
  ]);
  const [loadingDepartmentData, setLoadingDepartmentData] = useState(false);

  // Signature states
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [userSignature, setUserSignature] = useState<string>('');
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [employeeData, setEmployeeData] = useState<any>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EmploymentApprovalFormData>({
    defaultValues: {
      employmentType: 'new-hire',
      contractType: 'probation',
      numberOfPositions: 1,
      currentEmployeeCount: 0,
      currentPositions: [{ positionName: '', count: 1 }],
      hiringReason: 'new-position',
      temporaryDurationYears: 0,
      temporaryDurationMonths: 0,
      gender: 'ไม่ระบุ',
      minimumEducation: 'ปริญญาตรี',
    }
  });

  const hiringReason = watch('hiringReason');
  const selectedDepartment = watch('departmentRequesting');

  // ดึงข้อมูลพนักงานของผู้ใช้
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
        }
      } catch (error) {
        console.error('Error fetching employee data:', error);
      }
    };

    fetchEmployeeData();
  }, [user]);

  // ดึงข้อมูลพนักงานเมื่อเลือกแผนก
  useEffect(() => {
    const fetchDepartmentData = async () => {
      if (!selectedDepartment) return;

      setLoadingDepartmentData(true);
      try {
        const { data: employees, error } = await supabase
          .from('Employee')
          .select('Position')
          .eq('Team', selectedDepartment);

        if (error) {
          console.error('Error fetching department data:', error);
          toast.error('ไม่สามารถดึงข้อมูลแผนกได้');
          return;
        }

        if (employees && employees.length > 0) {
          // นับจำนวนพนักงานทั้งหมด
          const totalCount = employees.length;
          setValue('currentEmployeeCount', totalCount);

          // จัดกลุ่มตามตำแหน่งและนับจำนวน
          const positionMap: { [key: string]: number } = {};
          employees.forEach((emp) => {
            const position = emp.Position || 'ไม่ระบุตำแหน่ง';
            positionMap[position] = (positionMap[position] || 0) + 1;
          });

          // แปลงเป็น array สำหรับ UI
          const positions: CurrentPosition[] = Object.entries(positionMap).map(
            ([positionName, count]) => ({
              positionName,
              count,
            })
          );

          setCurrentPositions(positions);
          setValue('currentPositions', positions);
        } else {
          // ถ้าไม่มีพนักงานในฝ่ายนี้
          setValue('currentEmployeeCount', 0);
          setCurrentPositions([{ positionName: '', count: 1 }]);
          setValue('currentPositions', [{ positionName: '', count: 1 }]);
        }
      } catch (error) {
        console.error('Error fetching department data:', error);
        toast.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
      } finally {
        setLoadingDepartmentData(false);
      }
    };

    fetchDepartmentData();
  }, [selectedDepartment, setValue]);

  const addPosition = () => {
    const newPositions = [...currentPositions, { positionName: '', count: 1 }];
    setCurrentPositions(newPositions);
    setValue('currentPositions', newPositions);
  };

  const removePosition = (index: number) => {
    if (currentPositions.length > 1) {
      const newPositions = currentPositions.filter((_, i) => i !== index);
      setCurrentPositions(newPositions);
      setValue('currentPositions', newPositions);
    }
  };

  const updatePosition = (index: number, field: keyof CurrentPosition, value: string | number) => {
    const newPositions = [...currentPositions];
    newPositions[index] = { ...newPositions[index], [field]: value };
    setCurrentPositions(newPositions);
    setValue('currentPositions', newPositions);
  };

  const onSubmit = async (data: EmploymentApprovalFormData) => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อนส่งคำขอ');
      return;
    }

    if (!employeeData) {
      toast.error('ไม่พบข้อมูลพนักงาน กรุณาลองใหม่อีกครั้ง');
      return;
    }

    // เก็บข้อมูลฟอร์มและเปิด Modal เพื่อเซ็นชื่อ
    setPendingFormData({ data, employeeData });
    setShowSignatureModal(true);
  };

  const handleSignatureConfirm = async (signatureData: string) => {
    setUserSignature(signatureData);
    setShowSignatureModal(false);

    if (pendingFormData) {
      await processFormSubmission(pendingFormData.data, signatureData);
    }
  };

  const processFormSubmission = async (data: EmploymentApprovalFormData, signature: string) => {
    try {
      setLoading(true);

      const currentPositionsDetail = data.currentPositions
        .filter(p => p.positionName.trim() !== '')
        .map(p => `ตำแหน่ง${p.positionName} ${p.count} คน`)
        .join(', ');

      const request: Partial<WelfareRequest> = {
        userId: user.id,
        employeeId: employeeData?.id, // เพิ่ม employeeId
        userName: employeeData?.Name || user.email,
        userDepartment: profile?.department || '',
        type: 'employment-approval',
        status: 'pending_manager',
        amount: 0,
        date: new Date().toISOString(),
        title: `ขออนุมัติการจ้างงาน - ${data.positionTitle}`,
        details: `ฝ่าย: ${data.departmentRequesting}, ปัจจุบันมีพนักงาน ${data.currentEmployeeCount} คน${currentPositionsDetail ? ` (${currentPositionsDetail})` : ''}, ต้องการจ้างตำแหน่ง: ${data.positionTitle} จำนวน ${data.numberOfPositions} อัตรา`,
        userSignature: signature, // เพิ่มลายเซ็นผู้ขอ
        employmentType: data.employmentType,
        positionTitle: data.positionTitle,
        departmentRequesting: data.departmentRequesting,
        reportingTo: data.reportingTo,
        employmentStartDate: data.employmentStartDate,
        employmentEndDate: data.employmentEndDate,
        hiringReason: data.hiringReason,
        replacementFor: data.replacementFor,
        replacementDepartureDate: data.replacementDepartureDate,
        newPositionReason: data.newPositionReason,
        temporaryDurationYears: data.temporaryDurationYears,
        temporaryDurationMonths: data.temporaryDurationMonths,
        gender: data.gender,
        minimumEducation: data.minimumEducation,
        major: data.major,
        experienceField: data.experienceField,
        minimumExperience: data.minimumExperience,
        otherSkills: data.otherSkills,
        contractType: data.contractType,
        workLocation: data.workLocation,
        numberOfPositions: data.numberOfPositions,
        currentEmployeeCount: data.currentEmployeeCount,
        currentPositions: JSON.stringify(data.currentPositions), // แปลงเป็น JSON string
      };

      await submitRequest(request as any);
      toast.success('ส่งคำขออนุมัติการจ้างงานสำเร็จ');
      setPendingFormData(null);
    } catch (error) {
      console.error('Error submitting employment approval:', error);
      toast.error('เกิดข้อผิดพลาดในการส่งคำขอ');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewPDF = async () => {
    const formData = watch();

    if (!user || !profile) {
      toast.error('กรุณาเข้าสู่ระบบก่อนดู PDF');
      return;
    }

    // Create a temporary request object for preview
    const previewRequest: Partial<WelfareRequest> = {
      userId: user.id,
      userName: profile?.display_name || user.email || '',
      userDepartment: profile?.department || '',
      type: 'employment-approval',
      status: 'pending_manager',
      amount: 0,
      createdAt: new Date().toISOString(),
      positionTitle: formData.positionTitle,
      departmentRequesting: formData.departmentRequesting,
      reportingTo: formData.reportingTo,
      employmentStartDate: formData.employmentStartDate,
      employmentEndDate: formData.employmentEndDate,
      hiringReason: formData.hiringReason,
      replacementFor: formData.replacementFor,
      replacementDepartureDate: formData.replacementDepartureDate,
      newPositionReason: formData.newPositionReason,
      temporaryDurationYears: formData.temporaryDurationYears,
      temporaryDurationMonths: formData.temporaryDurationMonths,
      gender: formData.gender,
      minimumEducation: formData.minimumEducation,
      major: formData.major,
      experienceField: formData.experienceField,
      minimumExperience: formData.minimumExperience,
      otherSkills: formData.otherSkills,
      contractType: formData.contractType,
      workLocation: formData.workLocation,
      numberOfPositions: formData.numberOfPositions,
      currentEmployeeCount: formData.currentEmployeeCount,
      currentPositions: formData.currentPositions,
    };

    const employeeData = {
      Name: profile?.display_name || user.email || '',
      Position: profile?.position || '',
      Team: profile?.department || '',
    };

    try {
      await generateAndDownloadEmploymentApprovalPDF(
        previewRequest as WelfareRequest,
        {
          ...user,
          name: profile?.display_name || user.email || '',
          position: profile?.position || '',
          department: profile?.department || '',
        } as any,
        employeeData
      );
      toast.success('กำลังดาวน์โหลด PDF...');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้าง PDF');
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

            {/* ฝ่าย */}
            <div className="space-y-2">
              <Label htmlFor="departmentRequesting">ฝ่าย *</Label>
              <Select
                value={watch('departmentRequesting')}
                onValueChange={(value) => setValue('departmentRequesting', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกฝ่าย/แผนก" />
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

            {/* ปัจจุบันมีพนักงานในฝ่าย */}
            <div className="space-y-2">
              <Label htmlFor="currentEmployeeCount">
                ปัจจุบันมีพนักงานในฝ่าย (คน) *
                {loadingDepartmentData && (
                  <span className="ml-2 text-sm text-gray-500">(กำลังโหลด...)</span>
                )}
              </Label>
              <Input
                id="currentEmployeeCount"
                type="number"
                min="0"
                {...register('currentEmployeeCount', { required: true, min: 0 })}
                placeholder="จำนวนพนักงานปัจจุบัน"
                readOnly={loadingDepartmentData}
                className={loadingDepartmentData ? 'bg-gray-100' : ''}
              />
            </div>

            {/* ประกอบด้วยตำแหน่ง */}
            <div className="space-y-2">
              <Label>
                ประกอบด้วย
                {loadingDepartmentData && (
                  <span className="ml-2 text-sm text-gray-500">(กำลังโหลด...)</span>
                )}
              </Label>
              <div className="space-y-3">
                {currentPositions.map((position, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label htmlFor={`position-name-${index}`} className="text-sm">
                        ตำแหน่ง {index + 1}
                      </Label>
                      <Input
                        id={`position-name-${index}`}
                        value={position.positionName}
                        onChange={(e) => updatePosition(index, 'positionName', e.target.value)}
                        placeholder="เช่น ผู้จัดการฝ่าย, พนักงานขาย"
                        readOnly={loadingDepartmentData}
                        className={loadingDepartmentData ? 'bg-gray-100' : ''}
                      />
                    </div>
                    <div className="w-32">
                      <Label htmlFor={`position-count-${index}`} className="text-sm">
                        จำนวน (คน)
                      </Label>
                      <Input
                        id={`position-count-${index}`}
                        type="number"
                        min="1"
                        value={position.count}
                        onChange={(e) => updatePosition(index, 'count', parseInt(e.target.value) || 1)}
                        readOnly={loadingDepartmentData}
                        className={loadingDepartmentData ? 'bg-gray-100' : ''}
                      />
                    </div>
                    {currentPositions.length > 1 && !loadingDepartmentData && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removePosition(index)}
                        className="mb-0"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
                {!loadingDepartmentData && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPosition}
                    className="w-full"
                  >
                    + เพิ่มตำแหน่ง
                  </Button>
                )}
              </div>
            </div>

            {/* ตำแหน่งงานที่ต้องการ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="positionTitle">ตำแหน่งงานที่ต้องการ *</Label>
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
                <Label htmlFor="numberOfPositions">จำนวนที่ต้องการ (อัตรา) *</Label>
                <Input
                  id="numberOfPositions"
                  type="number"
                  min="1"
                  {...register('numberOfPositions', { required: true, min: 1 })}
                />
              </div>
            </div>

            {/* วันที่ต้องการ และสถานที่ทำงาน */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentStartDate">วันที่ต้องการ *</Label>
                <Input
                  id="employmentStartDate"
                  type="date"
                  {...register('employmentStartDate', { required: true })}
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

            {/* รายงานโดยตรงต่อ */}
            <div className="space-y-2">
              <Label htmlFor="reportingTo">รายงานโดยตรงต่อ *</Label>
              <Input
                id="reportingTo"
                {...register('reportingTo', { required: true })}
                placeholder="ชื่อผู้บังคับบัญชา"
              />
            </div>
          </div>

          {/* Section 2: รายละเอียดการจ้างงาน */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">2. รายละเอียดการจ้างงาน</h3>

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
                  <SelectItem value="new-position">ตำแหน่งประจำที่ขอเพิ่ม</SelectItem>
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
                  <Label htmlFor="replacementDepartureDate">วันที่ออก</Label>
                  <Input
                    id="replacementDepartureDate"
                    type="date"
                    {...register('replacementDepartureDate')}
                  />
                </div>
              </div>
            )}

            {hiringReason === 'new-position' && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <div className="space-y-2">
                  <Label htmlFor="newPositionReason">เหตุผลในการขอเพิ่ม *</Label>
                  <Textarea
                    id="newPositionReason"
                    {...register('newPositionReason', { required: true })}
                    rows={3}
                    placeholder="ระบุเหตุผลในการขอเพิ่มตำแหน่งงาน"
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
              </div>
            )}
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
                  placeholder="เช่น 1 ปี, 5 ปี"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherSkills">ความสามารถ / ความชำนาญอย่างอื่น</Label>
              <Textarea
                id="otherSkills"
                {...register('otherSkills')}
                rows={3}
                placeholder="ภาษาต่างประเทศ คอมพิวเตอร์ ขับรถยนตร์ได้มีใบอนุญาตขับขี่ ทำงานต่างจังหวัดได้ ฯลฯ"
              />
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
            <Button
              type="button"
              variant="secondary"
              onClick={handlePreviewPDF}
            >
              ดูตัวอย่าง PDF
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'กำลังส่งคำขอ...' : 'ส่งคำขออนุมัติ'}
            </Button>
          </div>
        </CardContent>
      </Card>

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
    </form>
  );
}
