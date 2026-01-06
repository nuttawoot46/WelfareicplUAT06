import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FormVisibility, getFormVisibility, updateFormVisibility, updateFormAllowedRoles, AVAILABLE_ROLES, RoleType } from '@/services/formVisibilityApi';

const formLabels: Record<string, { title: string; category: string }> = {
  // Welfare forms
  'training': { title: 'ค่าอบรม', category: 'สวัสดิการ' },
  'glasses': { title: 'ค่าตัดแว่น', category: 'สวัสดิการ' },
  'dental': { title: 'ค่าทำฟัน', category: 'สวัสดิการ' },
  'fitness': { title: 'ค่าออกกำลังกาย', category: 'สวัสดิการ' },
  'medical': { title: 'ของเยี่ยมกรณีเจ็บป่วย', category: 'สวัสดิการ' },
  'wedding': { title: 'สวัสดิการงานสมรส', category: 'สวัสดิการ' },
  'childbirth': { title: 'ค่าคลอดบุตร', category: 'สวัสดิการ' },
  'funeral': { title: 'ค่าช่วยเหลืองานศพ', category: 'สวัสดิการ' },
  'internal_training': { title: 'อบรมภายใน', category: 'สวัสดิการ' },
  'employment-approval': { title: 'ขออนุมัติการจ้างงาน', category: 'สวัสดิการ' },
  // Accounting forms
  'advance': { title: 'เบิกเงินล่วงหน้า (ฝ่ายขาย)', category: 'บัญชี' },
  'general-advance': { title: 'เบิกเงินล่วงหน้า (ทั่วไป)', category: 'บัญชี' },
  'expense-clearing': { title: 'เคลียร์ค่าใช้จ่าย (ฝ่ายขาย)', category: 'บัญชี' },
  'general-expense-clearing': { title: 'เคลียร์ค่าใช้จ่าย (ทั่วไป)', category: 'บัญชี' },
};

// Component for each form item with role selection
function FormItem({
  form,
  onToggle,
  onRolesChange
}: {
  form: FormVisibility;
  onToggle: (formType: string, isVisible: boolean) => void;
  onRolesChange: (formType: string, roles: RoleType[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<RoleType[]>(form.allowed_roles || []);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleRoleToggle = (role: RoleType, checked: boolean) => {
    if (checked) {
      setSelectedRoles([...selectedRoles, role]);
    } else {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    }
  };

  const handleSaveRoles = async () => {
    setSaving(true);
    try {
      onRolesChange(form.form_type, selectedRoles);
      toast({
        title: 'บันทึกสำเร็จ',
        description: `อัปเดตสิทธิ์การเข้าถึงฟอร์ม ${formLabels[form.form_type]?.title || form.form_type} แล้ว`,
      });
    } catch (error) {
      console.error('Error saving roles:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกการเปลี่ยนแปลงได้',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getRolesDisplay = () => {
    if (!form.allowed_roles || form.allowed_roles.length === 0) {
      return 'ทุก Role';
    }
    return form.allowed_roles
      .map(role => AVAILABLE_ROLES.find(r => r.value === role)?.label || role)
      .join(', ');
  };

  return (
    <div className="border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Label htmlFor={form.form_type} className="text-base font-medium cursor-pointer">
              {formLabels[form.form_type]?.title || form.form_type}
            </Label>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500 hover:text-gray-700 p-1 rounded"
              title="จัดการสิทธิ์ Role"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {form.is_visible ? 'แสดง' : 'ซ่อน'} | Role: {getRolesDisplay()}
          </p>
        </div>
        <Switch
          id={form.form_type}
          checked={form.is_visible}
          onCheckedChange={(checked) => onToggle(form.form_type, checked)}
        />
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t pt-3 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-3">เลือก Role ที่สามารถเห็นฟอร์มนี้:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AVAILABLE_ROLES.map((role) => (
              <div key={role.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${form.form_type}-${role.value}`}
                  checked={selectedRoles.includes(role.value)}
                  onCheckedChange={(checked) => handleRoleToggle(role.value, checked as boolean)}
                />
                <Label
                  htmlFor={`${form.form_type}-${role.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {role.label}
                </Label>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSaveRoles}
              disabled={saving}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกสิทธิ์'}
            </Button>
            <p className="text-xs text-gray-500">
              * ถ้าไม่เลือก Role ใดเลย = ทุก Role สามารถเห็นได้
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function FormManagement() {
  const [forms, setForms] = useState<FormVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await getFormVisibility();
      setForms(data);
    } catch (error) {
      console.error('Error loading forms:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลฟอร์มได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (formType: string, isVisible: boolean) => {
    try {
      await updateFormVisibility(formType, isVisible);
      setForms(forms.map(f =>
        f.form_type === formType ? { ...f, is_visible: isVisible } : f
      ));
      toast({
        title: 'บันทึกสำเร็จ',
        description: `${formLabels[formType]?.title || formType} ${isVisible ? 'แสดง' : 'ซ่อน'}แล้ว`,
      });
    } catch (error) {
      console.error('Error updating form visibility:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกการเปลี่ยนแปลงได้',
        variant: 'destructive',
      });
    }
  };

  const handleRolesChange = async (formType: string, roles: RoleType[]) => {
    await updateFormAllowedRoles(formType, roles);
    setForms(forms.map(f =>
      f.form_type === formType ? { ...f, allowed_roles: roles } : f
    ));
  };

  const welfareForms = forms.filter(f => formLabels[f.form_type]?.category === 'สวัสดิการ');
  const accountingForms = forms.filter(f => formLabels[f.form_type]?.category === 'บัญชี');

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">จัดการฟอร์ม</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-12 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">จัดการฟอร์ม</h1>
        <p className="text-gray-600 mt-1">เปิด/ปิดการแสดงฟอร์มต่างๆ และกำหนดสิทธิ์ Role ในระบบ</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ฟอร์มสวัสดิการและอบรม</CardTitle>
          <CardDescription>จัดการการแสดงฟอร์มสวัสดิการและอบรมต่างๆ รวมถึงกำหนดว่า Role ใดสามารถเห็นฟอร์มได้</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {welfareForms.map((form) => (
              <FormItem
                key={form.id}
                form={form}
                onToggle={handleToggle}
                onRolesChange={handleRolesChange}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ฟอร์มบัญชี</CardTitle>
          <CardDescription>จัดการการแสดงฟอร์มบัญชีต่างๆ รวมถึงกำหนดว่า Role ใดสามารถเห็นฟอร์มได้</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accountingForms.map((form) => (
              <FormItem
                key={form.id}
                form={form}
                onToggle={handleToggle}
                onRolesChange={handleRolesChange}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
