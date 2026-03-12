import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Paperclip, Loader2, Save, X, FileText, AlertTriangle, Download, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PaymentNotificationFormValues, PaymentCondition, PaymentType } from '@/types';
import { paymentNotificationApi } from '@/services/paymentNotificationApi';
import { sendLineNotification } from '@/services/lineApi';
import { formatNumberWithCommas, parseFormattedNumber, formatInputWhileTyping, formatNumberOnBlur } from '@/utils/numberFormat';
import { analyzeSlipImage, SlipAnalysisResult, compareSlipSender, SenderMatchResult } from '@/services/openaiApi';
import { downloadPaymentConfirmationPDF } from '@/utils/paymentConfirmationPdfGenerator';

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
  { value: 'ครบกำหนดชำระ', label: 'ครบกำหนดชำระ' },
  { value: 'โอนก่อนส่งของ', label: 'โอนก่อนส่งของ' },
];

const PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: 'เช็ค', label: 'เช็ค' },
  { value: 'โอนเงิน', label: 'โอนเงิน' },
];

export function PaymentNotificationForm({ onBack }: PaymentNotificationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [files, setFiles] = useState<string[]>([]);

  // Customer search state (from customer_ar)
  const [customerList, setCustomerList] = useState<Array<{ cus_no: string; cus_name: string; contact_name: string }>>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Array<{ cus_no: string; cus_name: string; contact_name: string }>>([]);

  // Document numbers from customer_ar
  const [customerDocs, setCustomerDocs] = useState<CustomerArDoc[]>([]);
  const [selectedDocNos, setSelectedDocNos] = useState<string[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Contact name (ชื่อกรรมการบริษัท)
  const [contactName, setContactName] = useState('');

  // Slip analysis state
  const [slipAnalysis, setSlipAnalysis] = useState<SlipAnalysisResult | null>(null);
  const [isAnalyzingSlip, setIsAnalyzingSlip] = useState(false);

  // Sender name matching state
  const [senderMatchResult, setSenderMatchResult] = useState<SenderMatchResult | null>(null);
  const [isComparingSender, setIsComparingSender] = useState(false);
  const [showMismatchWarning, setShowMismatchWarning] = useState(false);
  const [isGeneratingConfirmPdf, setIsGeneratingConfirmPdf] = useState(false);

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
  const paymentCondition = watch('paymentCondition');

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
          .select('cus_no, cus_name, contact_name')
          .eq('customer_status', 'Active');

        if (zoneCode) {
          query = query.eq('zone_code', zoneCode);
        }

        const { data, error } = await query.order('cus_name', { ascending: true });

        if (!error && data && isMounted) {
          // Get distinct customers
          const uniqueMap = new Map<string, { cus_no: string; cus_name: string; contact_name: string }>();
          (data as any[]).forEach((row: any) => {
            if (row.cus_name && !uniqueMap.has(row.cus_name)) {
              uniqueMap.set(row.cus_name, {
                cus_no: row.cus_no || '',
                cus_name: row.cus_name,
                contact_name: row.contact_name || '',
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

  // Compare slip sender with customer/contact name
  useEffect(() => {
    let cancelled = false;
    const compareSender = async () => {
      if (!slipAnalysis?.sender || slipAnalysis.sender === '-') return;
      const currentCustomerName = watch('customerName');
      if (!currentCustomerName || currentCustomerName.trim() === '') return;

      setIsComparingSender(true);
      setSenderMatchResult(null);
      setShowMismatchWarning(false);

      try {
        const result = await compareSlipSender(
          slipAnalysis.sender,
          currentCustomerName,
          contactName || undefined
        );
        if (!cancelled) {
          setSenderMatchResult(result);
          if (!result.matches) {
            setShowMismatchWarning(true);
          }
        }
      } catch (err) {
        console.error('Sender comparison failed:', err);
      } finally {
        if (!cancelled) setIsComparingSender(false);
      }
    };

    compareSender();
    return () => { cancelled = true; };
  }, [slipAnalysis, watch('customerName'), contactName]);

  // Download confirmation PDF handler
  const handleDownloadConfirmationPDF = async () => {
    setIsGeneratingConfirmPdf(true);
    try {
      const currentAmount = watch('amount');
      const parsedAmount = parseFormattedNumber(currentAmount);
      const formattedAmount = parsedAmount > 0
        ? formatNumberWithCommas(parsedAmount) + ' บาท'
        : '';

      await downloadPaymentConfirmationPDF({
        customerName: watch('customerName') || '',
        senderName: slipAnalysis?.sender || '',
        amount: formattedAmount,
      });
      toast({ title: 'ดาวน์โหลดสำเร็จ', description: 'หนังสือยืนยันฯ ถูกดาวน์โหลดเรียบร้อยแล้ว' });
    } catch (err) {
      console.error('Error generating confirmation PDF:', err);
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถสร้าง PDF ได้', variant: 'destructive' });
    } finally {
      setIsGeneratingConfirmPdf(false);
    }
  };

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
        .is('cheque_date', null)
        .is('pay_in_date', null)
        .order('posting_date', { ascending: false });

      if (!error && data) {
        const docs: CustomerArDoc[] = (data as any[])
          .filter((d: any) => d.doc_no && d.doc_no.trim() !== '' && !d.doc_no.startsWith('SO'))
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

  // File upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    if (!fileInput.files || fileInput.files.length === 0) return;

    // หา image file สำหรับวิเคราะห์สลิป (ทำคู่ขนานกับ upload)
    const imageFile = Array.from(fileInput.files).find(f => f.type.startsWith('image/'));
    if (imageFile) {
      setIsAnalyzingSlip(true);
      setSlipAnalysis(null);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const result = await analyzeSlipImage(base64);
          setSlipAnalysis(result);
        } catch (err) {
          console.error('Slip analysis failed:', err);
        } finally {
          setIsAnalyzingSlip(false);
        }
      };
      reader.readAsDataURL(imageFile);
    }

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
        contact_name: contactName || '',
        amount: parsedAmount,
        transfer_date: data.paymentType === 'โอนเงิน' ? data.transferDate || undefined : undefined,
        transfer_time: data.paymentType === 'โอนเงิน' ? data.transferTime || undefined : undefined,
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
        attachmentUrls: files.length > 0 ? files : undefined,
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
                setContactName('');

                setSenderMatchResult(null);
                setShowMismatchWarning(false);
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
                      setContactName(customer.contact_name);
      
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

          {/* Contact Name - ชื่อกรรมการบริษัท */}
          {contactName && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">กรรมการบริษัท:</span>
              <span className="text-sm text-blue-600">{contactName}</span>
            </div>
          )}
        </div>

        {/* Section 3: Payment Details */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">รายละเอียดการชำระเงิน</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">วันที่แจ้งชำระเงิน <span className="text-red-500">*</span></label>
              <Input
                type="date"
                {...register('paymentDate', { required: 'กรุณาระบุวันที่' })}
                readOnly
                className="bg-gray-50"
              />
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
            </div>
          </div>
        </div>

        {/* Section 4: Conditional Date Fields */}
        {(paymentType === 'โอนเงิน' || paymentType === 'เช็ค') && (
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              {paymentType === 'โอนเงิน' ? 'วันที่โอน' : 'วันที่เช็ค'}
            </h3>
            {paymentType === 'โอนเงิน' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">วันที่โอน</label>
                  <Input type="date" {...register('transferDate')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">เวลาที่โอน</label>
                  <div className="flex items-center gap-2">
                    <Select
                      onValueChange={(value) => {
                        const currentMin = watch('transferTime')?.split('.')[1] || '00';
                        setValue('transferTime', `${value}.${currentMin}`);
                      }}
                      value={watch('transferTime')?.split('.')[0] || ''}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="ชม." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-gray-500 font-medium">.</span>
                    <Select
                      onValueChange={(value) => {
                        const currentHr = watch('transferTime')?.split('.')[0] || '00';
                        setValue('transferTime', `${currentHr}.${value}`);
                      }}
                      value={watch('transferTime')?.split('.')[1] || ''}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="นาที" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-500">น.</span>
                  </div>
                </div>
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

        {/* Section 5: Attachments */}
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

            {/* Slip Analysis Result */}
            {isAnalyzingSlip && (
              <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-blue-600">กำลังอ่านสลิป...</span>
              </div>
            )}

            {slipAnalysis && !isAnalyzingSlip && (
              <div className="relative px-4 py-4 bg-blue-50 border border-blue-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSlipAnalysis(null)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="text-sm font-semibold text-blue-700 mb-3">ผลการอ่านสลิป</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">ผู้โอน: </span>
                    <span className="font-medium text-gray-800">{slipAnalysis.sender}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">ผู้รับ: </span>
                    <span className="font-medium text-gray-800">{slipAnalysis.receiver}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">จำนวนเงิน: </span>
                    <span className="font-medium text-blue-700">{slipAnalysis.amount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">วันที่โอน: </span>
                    <span className="font-medium text-gray-800">{slipAnalysis.transferDate}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sender Name Comparison */}
            {isComparingSender && (
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                <span className="text-sm text-gray-600">กำลังเปรียบเทียบชื่อผู้โอน...</span>
              </div>
            )}

            {senderMatchResult && senderMatchResult.matches && (
              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700">
                  ชื่อผู้โอนตรงกับ: {senderMatchResult.matchedName}
                </span>
              </div>
            )}

            {senderMatchResult && !senderMatchResult.matches && showMismatchWarning && (
              <div className="relative px-4 py-4 bg-amber-50 border border-amber-300 rounded-lg">
                <button
                  type="button"
                  onClick={() => setShowMismatchWarning(false)}
                  className="absolute top-2 right-2 text-amber-400 hover:text-amber-600"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800 mb-1">
                      ชื่อผู้โอนไม่ตรงกับชื่อลูกค้า/กรรมการบริษัท
                    </p>
                    <p className="text-sm text-amber-700 mb-1">
                      ผู้โอน: "{slipAnalysis?.sender}" ไม่ตรงกับ "{watch('customerName')}"
                      {contactName && ` หรือ "${contactName}"`}
                    </p>
                    <p className="text-xs text-amber-600 mb-3">{senderMatchResult.reason}</p>
                    <p className="text-sm text-amber-700 mb-3">
                      กรุณาให้ลูกค้าดาวน์โหลดและลงนาม หนังสือยืนยันการให้ผู้อื่นโอนเงินค่าสินค้าแทน
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadConfirmationPDF}
                      disabled={isGeneratingConfirmPdf}
                      className="border-amber-500 text-amber-700 hover:bg-amber-100"
                    >
                      {isGeneratingConfirmPdf ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          กำลังสร้าง PDF...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          ดาวน์โหลดหนังสือยืนยันฯ
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {senderMatchResult && !senderMatchResult.matches && !showMismatchWarning && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-amber-600">ชื่อผู้โอนไม่ตรง</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadConfirmationPDF}
                  disabled={isGeneratingConfirmPdf}
                  className="text-amber-600 hover:text-amber-700 text-xs h-7 px-2"
                >
                  <Download className="h-3 w-3 mr-1" />
                  ดาวน์โหลดหนังสือยืนยันฯ
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Section 6: Document Numbers (from customer_ar) - ซ่อนเมื่อ โอนเงิน + โอนก่อนส่งของ */}
        {!(paymentType === 'โอนเงิน' && paymentCondition === 'โอนก่อนส่งของ') && (
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">เลขที่เอกสาร</h3>

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
        )}

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
