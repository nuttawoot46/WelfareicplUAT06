import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FormVisibility, getFormVisibility, updateFormVisibility } from '@/services/formVisibilityApi';

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
        <p className="text-gray-600 mt-1">เปิด/ปิดการแสดงฟอร์มต่างๆ ในระบบ</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ฟอร์มสวัสดิการและอบรม</CardTitle>
          <CardDescription>จัดการการแสดงฟอร์มสวัสดิการและอบรมต่างๆ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {welfareForms.map((form) => (
              <div
                key={form.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <Label htmlFor={form.form_type} className="text-base font-medium cursor-pointer">
                    {formLabels[form.form_type]?.title || form.form_type}
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    {form.is_visible ? 'ผู้ใช้สามารถเห็นและเลือกฟอร์มนี้ได้' : 'ฟอร์มนี้ถูกซ่อนจากผู้ใช้'}
                  </p>
                </div>
                <Switch
                  id={form.form_type}
                  checked={form.is_visible}
                  onCheckedChange={(checked) => handleToggle(form.form_type, checked)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ฟอร์มบัญชี</CardTitle>
          <CardDescription>จัดการการแสดงฟอร์มบัญชีต่างๆ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accountingForms.map((form) => (
              <div
                key={form.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <Label htmlFor={form.form_type} className="text-base font-medium cursor-pointer">
                    {formLabels[form.form_type]?.title || form.form_type}
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    {form.is_visible ? 'ผู้ใช้สามารถเห็นและเลือกฟอร์มนี้ได้' : 'ฟอร์มนี้ถูกซ่อนจากผู้ใช้'}
                  </p>
                </div>
                <Switch
                  id={form.form_type}
                  checked={form.is_visible}
                  onCheckedChange={(checked) => handleToggle(form.form_type, checked)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
