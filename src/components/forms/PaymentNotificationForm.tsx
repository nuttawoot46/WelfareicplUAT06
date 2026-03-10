import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Paperclip, Loader2, Save, X, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PaymentNotificationFormValues, PaymentCondition, PaymentType } from '@/types';
import { paymentNotificationApi } from '@/services/paymentNotificationApi';
import { sendLineNotification } from '@/services/lineApi';
import { formatNumberWithCommas, parseFormattedNumber, formatInputWhileTyping, formatNumberOnBlur } from '@/utils/numberFormat';

interface PaymentNotificationFormProps {
  onBack: () => void;
}

interface CustomerArDoc {
  doc_no: string;
  amt_lcy: number | null;
  due_date: string | null;
  posting_date: string | null;
  overdue: number | null;
}

const PAYMENT_CONDITIONS: { value: PaymentCondition; label: string }[] = [
  { value: 'เช็คฝากล่วงหน้า', label: 'เช็คฝากล่วงหน้า' },
  { value: 'เครดิต', label: 'เครดิต' },
  { value: 'เงินสด', label: 'เงินสด' },
  { value: 'โอนเงิน', label: 'โอนเงิน' },
];

const PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: 'เช็ค', label: 'เช็ค' },
  { value: 'โอนเงิน', label: 'โอนเงิน' },
  { value: 'เงินสด', label: 'เงินสด' },
];

export function PaymentNotificationForm({ onBack }: PaymentNotificationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [files, setFiles] = useState<string[]>([]);

  // Customer search state (from customer_ar)
  const [customerList, setCustomerList] = useState<Array<{ cus_no: string; cus_name: string }>>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Array<{ cus_no: string; cus_name: string }>>([]);

  // Document numbers from customer_ar
  const [customerDocs, setCustomerDocs] = useState<CustomerArDoc[]>([]);
  const [selectedDocNos, setSelectedDocNos] = useState<string[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const DRAFT_KEY = `payment_notification_draft_${user?.email || 'anonymous'}`;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PaymentNotificationFormValues>({
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
      documentNumbers: [],
      amount: '',
    }
  });

  const paymentType = watch('paymentType');

  // Fetch employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user?.email) return;
      try {
        const { data, error } = await (supabase
          .from('Employee')
          .select('id, Name, Position, Team, sales_zone') as any)
          .eq('email_user', user.email)
          .single();

        if (!error && data) {
          setEmployeeData(data);
          setValue('salesTeam', data.sales_zone || '');
          setValue('department', data.Team || '');
        }
      } catch (error) {
        console.error('Error fetching employee data:', error);
      }
    };
    fetchEmployeeData();
  }, [user?.email, setValue]);

  // Load draft
  useEffect(() => {
    loadDraft();
  }, []);

  // Fetch distinct customer list from customer_ar
  useEffect(() => {
    let isMounted = true;
    const fetchCustomerList = async () => {
      try {
        const zoneCode = employeeData?.sales_zone || null;

        let query = (supabase.from('customer_ar' as any) as any)
          .select('cus_no, cus_name');

        if (zoneCode) {
          query = query.eq('zone_code', zoneCode);
        }

        const { data, error } = await query.order('cus_name', { ascending: true });

        if (!error && data && isMounted) {
          // Get distinct customers
          const uniqueMap = new Map<string, { cus_no: string; cus_name: string }>();
          (data as any[]).forEach((row: any) => {
            if (row.cus_name && !uniqueMap.has(row.cus_name)) {
              uniqueMap.set(row.cus_name, {
                cus_no: row.cus_no || '',
                cus_name: row.cus_name,
              });
            }
          });
          setCustomerList(Array.from(uniqueMap.values()));
        } else if (isMounted) {
          setCustomerList([]);
        }
      } catch (error) {
        console.error('Error fetching customer list:', error);
        if (isMounted) setCustomerList([]);
      }
    };
    fetchCustomerList();
    return () => { isMounted = false; };
  }, [employeeData]);

  // Filter customers based on search term
  useEffect(() => {
    if (customerSearchTerm.trim() === '') {
      setFilteredCustomers([]);
      setShowCustomerDropdown(false);
    } else {
      const filtered = customerList.filter(c =>
        c.cus_name.toLowerCase().includes(customerSearchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered.slice(0, 10));
      setShowCustomerDropdown(filtered.length > 0);
    }
  }, [customerSearchTerm, customerList]);

  // Fetch doc_no list when customer is selected
  const fetchCustomerDocs = async (cusName: string) => {
    setIsLoadingDocs(true);
    setCustomerDocs([]);
    setSelectedDocNos([]);
    setValue('documentNumbers', []);

    try {
      const { data, error } = await (supabase.from('customer_ar' as any) as any)
        .select('doc_no, amt_lcy, due_date, posting_date, overdue')
        .eq('cus_name', cusName)
        .not('doc_no', 'is', null)
        .order('posting_date', { ascending: false });

      if (!error && data) {
        const docs: CustomerArDoc[] = (data as any[])
          .filter((d: any) => d.doc_no && d.doc_no.trim() !== '')
          .map((d: any) => ({
            doc_no: d.doc_no,
            amt_lcy: d.amt_lcy,
            due_date: d.due_date,
            posting_date: d.posting_date,
            overdue: d.overdue,
          }));
        setCustomerDocs(docs);
      }
    } catch (error) {
      console.error('Error fetching customer docs:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Handle doc_no checkbox toggle
  const handleDocToggle = (docNo: string, checked: boolean) => {
    let updated: string[];
    if (checked) {
      updated = [...selectedDocNos, docNo];
    } else {
      updated = selectedDocNos.filter(d => d !== docNo);
    }
    setSelectedDocNos(updated);
    setValue('documentNumbers', updated.map(v => ({ value: v })));
  };

  // Select all / deselect all
  const handleSelectAllDocs = () => {
    if (selectedDocNos.length === customerDocs.length) {
      setSelectedDocNos([]);
      setValue('documentNumbers', []);
    } else {
      const allDocNos = customerDocs.map(d => d.doc_no);
      setSelectedDocNos(allDocNos);
      setValue('documentNumbers', allDocNos.map(v => ({ value: v })));
    }
  };

  // File upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    if (!fileInput.files || fileInput.files.length === 0) return;

    try {
      const uploadPromises = Array.from(fileInput.files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${user?.id || 'anonymous'}/payment-notification/${fileName}`;

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
      setFiles(prev => [...prev, ...uploadedUrls]);
      toast({ title: 'อัพโหลดสำเร็จ', description: 'อัพโหลดไฟล์เรียบร้อยแล้ว' });
    } catch (error: any) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: `ไม่สามารถอัปโหลดไฟล์ได้: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      fileInput.value = '';
    }
  };

  // Remove file
  const handleRemoveFile = async (index: number) => {
    try {
      const fileUrl = files[index];
      const filePath = fileUrl.split('/').slice(-3).join('/');

      await supabase.storage.from('welfare-attachments').remove([filePath]);
      setFiles(prev => prev.filter((_, i) => i !== index));
      toast({ title: 'ลบไฟล์สำเร็จ' });
    } catch (error: any) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: `ไม่สามารถลบไฟล์ได้: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  // Draft management
  const saveDraft = () => {
    setIsSavingDraft(true);
    try {
      const formData = watch();
      const draftData = {
        ...formData,
        files,
        customerSearchTerm,
        selectedDocNos,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      toast({ title: 'บันทึกฉบับร่างสำเร็จ', description: 'ข้อมูลถูกบันทึกเป็นฉบับร่างเรียบร้อยแล้ว' });
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถบันทึกฉบับร่างได้', variant: 'destructive' });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const loadDraft = () => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        reset({
          paymentDate: draftData.paymentDate || new Date().toISOString().split('T')[0],
          paymentCondition: draftData.paymentCondition || undefined,
          paymentType: draftData.paymentType || undefined,
          customerName: draftData.customerName || '',
          customerNo: draftData.customerNo || '',
          salesTeam: draftData.salesTeam || '',
          department: draftData.department || '',
          amount: draftData.amount || '',
          transferDate: draftData.transferDate || '',
          checkDate: draftData.checkDate || '',
          documentNumbers: draftData.documentNumbers || [],
          notes: draftData.notes || '',
        });
        if (draftData.files) setFiles(draftData.files);
        if (draftData.customerSearchTerm) setCustomerSearchTerm(draftData.customerSearchTerm);
        if (draftData.selectedDocNos) setSelectedDocNos(draftData.selectedDocNos);
        toast({
          title: 'โหลดฉบับร่างสำเร็จ',
          description: `ข้อมูลฉบับร่างถูกโหลดเรียบร้อยแล้ว (บันทึกเมื่อ ${new Date(draftData.savedAt).toLocaleString('th-TH')})`,
        });
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

  // Submit handler
  const onSubmit = async (data: PaymentNotificationFormValues) => {
    if (!employeeData) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่พบข้อมูลพนักงาน', variant: 'destructive' });
      return;
    }

    if (!data.customerName || data.customerName.trim() === '') {
      toast({ title: 'กรุณาเลือกลูกค้า', description: 'กรุณาค้นหาและเลือกชื่อลูกค้า', variant: 'destructive' });
      return;
    }

    const parsedAmount = parseFormattedNumber(data.amount);
    if (parsedAmount <= 0) {
      toast({ title: 'กรุณาระบุจำนวนเงิน', description: 'จำนวนเงินต้องมากกว่า 0', variant: 'destructive' });
      return;
    }

    const validDocs = selectedDocNos.filter(d => d.trim() !== '');

    setIsSubmitting(true);
    try {
      const runNumber = paymentNotificationApi.generateRunNumber();

      await paymentNotificationApi.createNotification({
        employee_id: employeeData.id,
        employee_name: employeeData.Name || user?.email || '',
        employee_email: user?.email || '',
        team: employeeData.Team || '',
        run_number: runNumber,
        payment_date: data.paymentDate,
        payment_condition: data.paymentCondition,
        payment_type: data.paymentType,
        customer_name: data.customerName,
        customer_no: data.customerNo || '',
        amount: parsedAmount,
        transfer_date: data.paymentType === 'โอนเงิน' ? data.transferDate || undefined : undefined,
        check_date: data.paymentType === 'เช็ค' ? data.checkDate || undefined : undefined,
        document_numbers: validDocs.map(v => ({ value: v })),
        late_payment_days: 0,
        attachment_urls: files,
        notes: data.notes || '',
      });

      clearDraft();

      // ส่ง LINE Flex Message แจ้งเตือนผู้แจ้ง (fire-and-forget)
      sendLineNotification({
        employeeEmail: user?.email || '',
        type: 'payment-notification',
        status: 'completed',
        userName: employeeData.Name || '',
        amount: parsedAmount,
        runNumber,
        customerName: data.customerName,
        paymentCondition: data.paymentCondition,
        paymentType: data.paymentType,
        documentNumbers: validDocs,
        team: employeeData.sales_zone || employeeData.Team || '',
      }).catch(() => {});

      toast({ title: 'สำเร็จ', description: 'แจ้งการชำระเงินเรียบร้อยแล้ว' });
      reset();
      setFiles([]);
      setCustomerSearchTerm('');
      setSelectedDocNos([]);
      setCustomerDocs([]);
      setTimeout(onBack, 1500);
    } catch (error: any) {
      console.error('Error submitting payment notification:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">แจ้งการชำระเงินจากลูกค้า</h2>
            <p className="text-gray-500 text-sm">กรอกข้อมูลการชำระเงินจากลูกค้า</p>
          </div>
        </div>
        <Button variant="outline" onClick={saveDraft} disabled={isSavingDraft}>
          <Save className="h-4 w-4 mr-2" />
          {isSavingDraft ? 'กำลังบันทึก...' : 'บันทึกฉบับร่าง'}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Employee Info */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">ข้อมูลพนักงาน</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ชื่อพนักงาน</label>
              <Input
                value={employeeData?.Name || user?.email || 'กำลังโหลด...'}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ทีมขาย</label>
              <Input
                {...register('salesTeam')}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">แผนก</label>
              <Input
                {...register('department')}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Customer Search */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">ข้อมูลลูกค้า</h3>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-600 mb-1">ชื่อลูกค้า <span className="text-red-500">*</span></label>
            <Input
              value={customerSearchTerm}
              onChange={(e) => {
                setCustomerSearchTerm(e.target.value);
                setValue('customerName', e.target.value);
                setValue('customerNo', '');
                // Clear docs when customer changes
                setCustomerDocs([]);
                setSelectedDocNos([]);
                setValue('documentNumbers', []);
              }}
              onFocus={() => {
                if (customerSearchTerm.trim() !== '' && filteredCustomers.length > 0) {
                  setShowCustomerDropdown(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowCustomerDropdown(false), 200);
              }}
              placeholder="ค้นหาชื่อลูกค้า..."
            />
            {showCustomerDropdown && filteredCustomers.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {filteredCustomers.map((customer, idx) => (
                  <div
                    key={`${customer.cus_no}-${idx}`}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setCustomerSearchTerm(customer.cus_name);
                      setValue('customerName', customer.cus_name);
                      setValue('customerNo', customer.cus_no);
                      setShowCustomerDropdown(false);
                      // Fetch docs for this customer
                      fetchCustomerDocs(customer.cus_name);
                    }}
                  >
                    <div className="font-medium">{customer.cus_name}</div>
                    {customer.cus_no && (
                      <div className="text-xs text-gray-500">รหัส: {customer.cus_no}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Document Numbers (from customer_ar) */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">เลขที่เอกสาร</h3>
            {customerDocs.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllDocs}
              >
                {selectedDocNos.length === customerDocs.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
              </Button>
            )}
          </div>

          {!watch('customerName') || watch('customerName').trim() === '' ? (
            <p className="text-sm text-gray-400">กรุณาเลือกลูกค้าก่อน</p>
          ) : isLoadingDocs ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              กำลังโหลดเอกสาร...
            </div>
          ) : customerDocs.length === 0 ? (
            <p className="text-sm text-gray-400">ไม่พบเอกสารของลูกค้านี้</p>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-3">
                เลือกเลขที่เอกสารที่ลูกค้าชำระ ({selectedDocNos.length}/{customerDocs.length} รายการ)
              </p>
              <div className="max-h-64 overflow-auto border rounded-lg divide-y">
                {customerDocs.map((doc) => (
                  <label
                    key={doc.doc_no}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedDocNos.includes(doc.doc_no)}
                      onCheckedChange={(checked) => handleDocToggle(doc.doc_no, checked === true)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800">{doc.doc_no}</div>
                      <div className="flex gap-3 text-xs text-gray-500">
                        {doc.amt_lcy != null && (
                          <span>ยอด: {formatNumberWithCommas(doc.amt_lcy)} บาท</span>
                        )}
                        {doc.due_date && (
                          <span>ครบกำหนด: {new Date(doc.due_date).toLocaleDateString('th-TH')}</span>
                        )}
                        {doc.overdue != null && doc.overdue > 0 && (
                          <span className="text-red-500">เกินกำหนด {doc.overdue} วัน</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Section 4: Payment Details */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">รายละเอียดการชำระเงิน</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">วันที่แจ้งชำระเงิน <span className="text-red-500">*</span></label>
              <Input
                type="date"
                {...register('paymentDate', { required: 'กรุณาระบุวันที่' })}
              />
              {errors.paymentDate && <p className="text-red-500 text-sm mt-1">{errors.paymentDate.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">จำนวนเงิน (บาท) <span className="text-red-500">*</span></label>
              <Input
                {...register('amount', { required: 'กรุณาระบุจำนวนเงิน' })}
                placeholder="0.00"
                onChange={(e) => {
                  const formatted = formatInputWhileTyping(e.target.value);
                  e.target.value = formatted;
                  setValue('amount', formatted);
                }}
                onBlur={(e) => {
                  const numValue = parseFormattedNumber(e.target.value);
                  if (numValue > 0) {
                    e.target.value = formatNumberOnBlur(numValue);
                    setValue('amount', e.target.value);
                  }
                }}
              />
              {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">เงื่อนไขการชำระ <span className="text-red-500">*</span></label>
              <Select
                onValueChange={(value) => setValue('paymentCondition', value as PaymentCondition)}
                value={watch('paymentCondition')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกเงื่อนไขการชำระ" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_CONDITIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!watch('paymentCondition') && errors.paymentCondition && (
                <p className="text-red-500 text-sm mt-1">กรุณาเลือกเงื่อนไขการชำระ</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ประเภทการจ่ายชำระ <span className="text-red-500">*</span></label>
              <Select
                onValueChange={(value) => setValue('paymentType', value as PaymentType)}
                value={watch('paymentType')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภทการจ่ายชำระ" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Section 5: Conditional Date Fields */}
        {(paymentType === 'โอนเงิน' || paymentType === 'เช็ค') && (
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              {paymentType === 'โอนเงิน' ? 'วันที่โอน' : 'วันที่เช็ค'}
            </h3>
            {paymentType === 'โอนเงิน' && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">วันที่โอน</label>
                <Input type="date" {...register('transferDate')} />
              </div>
            )}
            {paymentType === 'เช็ค' && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">วันที่เช็ค</label>
                <Input type="date" {...register('checkDate')} />
              </div>
            )}
          </div>
        )}

        {/* Section 6: Attachments */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">แนบเอกสาร</h3>
          <p className="text-sm text-gray-500 mb-3">แนบเอกสารการโอนเงิน Slip / เช็ครับเงิน</p>

          <div className="space-y-3">
            <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Paperclip className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">คลิกเพื่อเลือกไฟล์</span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((fileUrl, index) => (
                  <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        ไฟล์แนบ #{index + 1}
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 7: Notes */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">หมายเหตุ</h3>
          <Textarea
            {...register('notes')}
            placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
            rows={3}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onBack}>
            ยกเลิก
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              'ส่งแจ้งการชำระเงิน'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
