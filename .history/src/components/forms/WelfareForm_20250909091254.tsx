import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WelfareType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useWelfare } from '@/context/WelfareContext';
import { ArrowLeft, Check, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

import LoadingPopup from './LoadingPopup';
import { generateWelfarePDF } from '../pdf/WelfarePDFGenerator';
import { uploadPDFToSupabase } from '@/utils/pdfUtils';
import { DigitalSignature } from '../signature/DigitalSignature';

interface WelfareFormProps {
  type: WelfareType;
  onBack: () => void;
  editId?: number | null;
}

// 1. เธญเธฑเธเน€เธ”เธ• FormValues Interface
interface FormValues {
  startDate: string;
  endDate: string;
  totalDays: number;
  amount: number;
  details: string;

  birthType?: 'natural' | 'caesarean';
  funeralType?: 'employee_spouse' | 'child' | 'parent';
  attachments?: FileList;
  trainingTopics?: { value: string }[];
  totalAmount?: number;
  tax7Percent?: number;
  withholdingTax3Percent?: number;
  netAmount?: number;
  excessAmount?: number;
  companyPayment?: number;
  employeePayment?: number;
  courseName?: string;
  organizer?: string;
  isVatIncluded?: boolean; // เน€เธเธดเนเธก field เธชเธณเธซเธฃเธฑเธ checkbox
}

// Helper to get form title by welfare type
const getFormTitle = (type: WelfareType): string => {
  const titles: Record<WelfareType, string> = {
    wedding: 'เนเธเธเธเธญเธฃเนเธกเธเธญเธชเธงเธฑเธชเธ”เธดเธเธฒเธฃเธเนเธฒเนเธ•เนเธเธเธฒเธ',
    training: 'เนเธเธเธเธญเธฃเนเธกเธเธญเธชเธงเธฑเธชเธ”เธดเธเธฒเธฃเธเนเธฒเธญเธเธฃเธก',
    childbirth: 'เนเธเธเธเธญเธฃเนเธกเธเธญเธชเธงเธฑเธชเธ”เธดเธเธฒเธฃเธเนเธฒเธเธฅเธญเธ”เธเธธเธ•เธฃ',
    funeral: 'เนเธเธเธเธญเธฃเนเธกเธเธญเธชเธงเธฑเธชเธ”เธดเธเธฒเธฃเธเนเธฒเธเนเธงเธขเน€เธซเธฅเธทเธญเธเธฒเธเธจเธ',
    glasses: 'เนเธเธเธเธญเธฃเนเธกเธเธญเธชเธงเธฑเธชเธ”เธดเธเธฒเธฃเธเนเธฒเธ•เธฑเธ”เนเธงเนเธ',
    dental: 'เนเธเธเธเธญเธฃเนเธกเธเธญเธชเธงเธฑเธชเธ”เธดเธเธฒเธฃเธเนเธฒเธ—เธณเธเธฑเธ',
    fitness: 'เนเธเธเธเธญเธฃเนเธกเธเธญเธชเธงเธฑเธชเธ”เธดเธเธฒเธฃเธเนเธฒเธญเธญเธเธเธณเธฅเธฑเธเธเธฒเธข',
    medical: 'เนเธเธเธเธญเธฃเนเธกเธเธญเธชเธงเธฑเธชเธ”เธดเธเธฒเธฃเธเนเธฒเธเธญเธเน€เธขเธตเนเธขเธกเธเธฃเธ“เธตเน€เธเนเธเธเนเธงเธข',
  };

  return titles[type] || 'เนเธเธเธเธญเธฃเนเธกเธเธญเธชเธงเธฑเธชเธ”เธดเธเธฒเธฃ';
};

export function WelfareForm({ type, onBack, editId }: WelfareFormProps) {
  // เธฃเธญเธเธฃเธฑเธ editId เธเธฒเธ prop (modal edit) เธซเธฃเธทเธญเธเธฒเธ query string (เธซเธเนเธฒ /Forms)
  const location = useLocation();
  let editIdNum: number | undefined = undefined;
  if (typeof editId === 'number') {
    editIdNum = editId;
  } else {
    const searchParams = new URLSearchParams(location.search);
    const editIdStr = searchParams.get('editId');
    editIdNum = editIdStr ? Number(editIdStr) : undefined;
  }
  const { user, profile } = useAuth();
  const { submitRequest, isLoading, getWelfareLimit, getRemainingBudget, trainingBudget } = useWelfare();
  const [files, setFiles] = useState<string[]>([]);
  const { toast } = useToast();
  const [maxAmount, setMaxAmount] = useState<number | null>(null);
  const [condition, setCondition] = useState<string | undefined>();
  const [isMonthly, setIsMonthly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeBudget, setEmployeeBudget] = useState<number | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [userSignature, setUserSignature] = useState<string>('');
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [employeeData, setEmployeeData] = useState<any>(null);

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
      trainingTopics: [{ value: '' }, { value: '' }]
    }
  });

  const isVatIncluded = watch('isVatIncluded');


  const { fields, append, remove } = useFieldArray({
    control,
    name: "trainingTopics"
  });

  // Fetch employee data when component mounts
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
  }, [user?.email]);

  // 1. เธ•เธฑเนเธเธเนเธฒเธเธตเธ”เธเธณเธเธฑเธ”เนเธฅเธฐเน€เธเธทเนเธญเธเนเธเธเธญเธเธชเธงเธฑเธชเธ”เธดเธเธฒเธฃเธ•เธฒเธก type เธ—เธธเธเธเธฃเธฑเนเธเธ—เธตเน type เธซเธฃเธทเธญ user เน€เธเธฅเธตเนเธขเธ
  useEffect(() => {
    if (!user) return;
    let limitAmount = 0;
    let limitCondition = '';
    let limitMonthly = false;
    if (type === 'training') {
      limitAmount = trainingBudget || 0;
      limitCondition = 'เธญเนเธฒเธเธญเธดเธเธเธฒเธเธเธเธเธฃเธฐเธกเธฒเธ“เธเธเน€เธซเธฅเธทเธญเธเธญเธเธเธเธฑเธเธเธฒเธ';
    } else {
      const limit = getWelfareLimit(type);
      limitAmount = limit.amount;
      limitCondition = limit.condition;
      limitMonthly = limit.monthly || false;
    }
    setMaxAmount(limitAmount);
    setIsMonthly(limitMonthly);
    setCondition(limitCondition);
    if (type === 'training' && user && profile) {
      const budgetResult = getRemainingBudget(user.id, type);
      if (budgetResult && typeof budgetResult.then === 'function') {
        budgetResult.then(setEmployeeBudget);
      } else {
        setEmployeeBudget(budgetResult);
      }
    } else if (type !== 'training') {
      setValue('amount', limitAmount);
    }

    // เธ–เนเธฒเธกเธต editId เนเธซเนเธ”เธถเธเธเนเธญเธกเธนเธฅเธกเธฒ prefill
    const fetchEditData = async () => {
      if (editIdNum) {
        const { data, error } = await supabase
          .from('welfare_requests')
          .select('*')
          .eq('id', editIdNum)
          .single();
        if (!error && data) {
          // Map only fields that exist in the schema
          reset({
            amount: data.amount,
            details: data.details || '',
            title: data.title || '',
            startDate: data.start_date || '',
            endDate: data.end_date || '',
            totalDays: data.total_days || 0,
            birthType: data.birth_type || '',
            funeralType: data.funeral_type || '',
            trainingTopics: data.training_topics ? JSON.parse(data.training_topics) : [],
            totalAmount: data.total_amount || 0,
            tax7Percent: data.tax7_percent || 0,
            withholdingTax3Percent: data.withholding_tax3_percent || 0,
            netAmount: data.net_amount || data.amount || 0,
            excessAmount: data.excess_amount || 0,
            companyPayment: data.company_payment || 0,
            employeePayment: data.employee_payment || 0,
            courseName: data.course_name || '',
            organizer: data.organizer || '',
            isVatIncluded: data.is_vat_included || false,
          });
          // Attachments
          if (data.attachment_url) {
            let attachments: string[] = [];
            if (Array.isArray(data.attachment_url)) {
              attachments = data.attachment_url;
            } else if (typeof data.attachment_url === 'string') {
              try {
                const parsed = JSON.parse(data.attachment_url);
                attachments = Array.isArray(parsed) ? parsed : [parsed];
              } catch {
                attachments = data.attachment_url ? [data.attachment_url] : [];
              }
            }
            setFiles(attachments);
          }
        }
      }
    };
    fetchEditData();
  }, [type, user, getWelfareLimit, setValue, trainingBudget, editId, reset]);

  // For childbirth form
  const birthType = watch('birthType');

  // Update amount when birth type changes
  useEffect(() => {
    if (type === 'childbirth' && birthType) {
      const amount = birthType === 'natural' ? 4000 : 6000;
      setValue('amount', amount);
    }
  }, [birthType, type, setValue]);

  // เธเธณเธเธงเธ“เธเธฅเธฅเธฑเธเธเนเนเธซเธกเนเธ—เธฑเธเธ—เธตเน€เธกเธทเนเธญเน€เธเธฅเธตเนเธขเธเธชเธ–เธฒเธเธฐ isVatIncluded เธซเธฃเธทเธญ amount (เธขเนเธฒเธขเนเธเธเธณเธเธงเธ“เธซเธฅเธฑเธเธ—เธฃเธฒเธเธเธเธเธเน€เธซเธฅเธทเธญเธเธฃเธดเธ)
  // เน€เธ”เธดเธกเธญเนเธฒเธเธญเธดเธ trainingBudget; เธเธฃเธฑเธเน€เธเนเธเนเธเนเธเธเธเธเน€เธซเธฅเธทเธญเธเธฃเธดเธ (remainingBudget)

  // เธเธฑเธเธเนเธเธฑเธเธชเธณเธซเธฃเธฑเธเธญเธฑเธเนเธซเธฅเธ”เนเธเธฅเนเนเธเธขเธฑเธ Supabase Storage
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;

    if (!fileInput.files || fileInput.files.length === 0) return;

    try {
      const uploadPromises = Array.from(fileInput.files).map(async (file) => {
        // Create a unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${user?.id || 'anonymous'}/${fileName}`;

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('welfare-attachments')
          .upload(filePath, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('welfare-attachments')
          .getPublicUrl(data.path);

        return publicUrl;
      });

      // Wait for all uploads to complete
      const uploadedUrls = await Promise.all(uploadPromises);

      // Update files state with new URLs
      setFiles(prevFiles => [...prevFiles, ...uploadedUrls]);

      toast({
        title: "เธญเธฑเธเนเธซเธฅเธ”เธชเธณเน€เธฃเนเธ",
        description: `เธญเธฑเธเนเธซเธฅเธ”เนเธเธฅเนเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง`,
      });
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast({
        title: "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
        description: `เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเธฑเธเนเธซเธฅเธ”เนเธเธฅเนเนเธ”เน: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      // Reset the file input
      fileInput.value = '';
    }
  };

  // เธเธฑเธเธเนเธเธฑเธเธชเธณเธซเธฃเธฑเธเธฅเธเนเธเธฅเนเธ—เธตเนเธญเธฑเธเนเธซเธฅเธ”
  const handleRemoveFile = async (index: number) => {
    try {
      // Get the file URL to remove
      const fileUrl = files[index];

      // Extract the file path from the URL
      const filePath = fileUrl.split('/').slice(-2).join('/');

      // Delete the file from Supabase Storage
      const { error } = await supabase.storage
        .from('welfare-attachments')
        .remove([filePath]);

      if (error) throw error;

      // Update the files state
      setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));

      toast({
        title: "เธฅเธเนเธเธฅเนเธชเธณเน€เธฃเนเธ",
        description: "เธฅเธเนเธเธฅเนเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง",
      });
    } catch (error: any) {
      console.error('Error removing file:', error);
      toast({
        title: "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
        description: `เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเนเธเธฅเนเนเธ”เน: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Get remaining budget from context. This is now the single source of truth.
  // เนเธเน budget เน€เธ”เธตเธขเธงเธเธฑเธเธชเธณเธซเธฃเธฑเธ glasses/dental
  let remainingBudget = 0;
  if (type === 'glasses' || type === 'dental') {
    remainingBudget = profile?.budget_dentalglasses ?? 0;
  } else if (user?.id) {
    remainingBudget = getRemainingBudget(user.id, type);
  } else {
    remainingBudget = 0;
  }

  const onSubmit = async (data: any) => {
    // Store form data and show signature modal for wedding type
    if (type === 'wedding') {
      // Make sure we have employeeData before showing signature modal
      if (!employeeData) {
        toast({
          title: 'เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”',
          description: 'เนเธกเนเธเธเธเนเธญเธกเธนเธฅเธเธเธฑเธเธเธฒเธ เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเนเธญเธตเธเธเธฃเธฑเนเธ',
          variant: 'destructive',
        });
        return;
      }
      setPendingFormData({ data, employeeData });
      setShowSignatureModal(true);
  // คำนวณผลลัพธ์ทันทีเมื่อ amount/isVatIncluded/remainingBudget เปลี่ยน
  useEffect(() => {
    const amount = watch('amount');
    if (type === 'training') {
      if (amount !== undefined && amount !== null && amount !== '') {
        calculateTrainingAmounts(Number(amount), Number(remainingBudget));
      }
    } else {
      if (amount !== undefined && amount !== null && amount !== '') {
        calculateNonTrainingAmounts(Number(amount));
      }
    }
  }, [isVatIncluded, watch('amount'), remainingBudget, type]);
      return;
    }

    // For other types, submit directly
    await handleFormSubmit(data);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First, fetch the employee data to get the correct department and name
      const { data: employeeData, error: employeeError } = await supabase
        .from('Employee')
        .select('id, Name, Position, Team')
        .eq('email_user', user.email)
        .single();

      console.log('employeeData:', employeeData);
      console.log('employeeData.Team:', employeeData.Team);
      if (employeeError || !employeeData) {
        throw new Error('Employee data not found. Please contact support.');
      }

      // Store form data and employee data for later use
      setPendingFormData({ data, employeeData });

      // Show signature modal for wedding type
      if (type === 'wedding') {
        setShowSignatureModal(true);
        setIsSubmitting(false);
        return;
      }

      if (editIdNum) {
        // เธ•เธฃเธงเธเธชเธญเธเธชเธ–เธฒเธเธฐเธเธณเธฃเนเธญเธเธเนเธญเธเธญเธเธธเธเธฒเธ•เนเธซเนเนเธเนเนเธ
        const { data: currentRequest, error: fetchError } = await supabase
          .from('welfare_requests')
          .select('status')
          .eq('id', editIdNum)
          .single();
        if (fetchError || !currentRequest) {
          throw new Error('เนเธกเนเธเธเธเนเธญเธกเธนเธฅเธเธณเธฃเนเธญเธ เธซเธฃเธทเธญเน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธ•เธฃเธงเธเธชเธญเธเธชเธ–เธฒเธเธฐ');
        }
        if (currentRequest.status && currentRequest.status.toLowerCase() === 'approved') {
          toast({
            title: 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เนเธเนเนเธเนเธ”เน',
            description: 'เธเธณเธฃเนเธญเธเธเธตเนเนเธ”เนเธฃเธฑเธเธเธฒเธฃเธญเธเธธเธกเธฑเธ•เธดเนเธฅเนเธง เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เนเธเนเนเธเนเธ”เน',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
        // UPDATE EXISTING REQUEST
        const updateData: any = {
          amount: Number(data.netAmount || data.amount || 0), // Net amount เธขเธฑเธเธเธ map เนเธ column เน€เธ”เธดเธก
          details: data.details || '',
          title: data.title || '',
          attachment_url: JSON.stringify(files),
          updated_at: new Date().toISOString(),
          start_date: data.startDate,
          end_date: data.endDate,
          total_days: data.totalDays,
          birth_type: data.birthType,
          funeral_type: data.funeralType,
          training_topics: data.trainingTopics ? JSON.stringify(data.trainingTopics) : null,
          total_amount: data.totalAmount,
          tax7_percent: data.tax7Percent,
          withholding_tax3_percent: data.withholdingTax3Percent,
          net_amount: data.netAmount,
          excess_amount: data.excessAmount,
          company_payment: data.companyPayment,
          employee_payment: data.employeePayment,
          course_name: data.courseName,
          organizer: data.organizer,
          is_vat_included: data.isVatIncluded,
          department_user: employeeData.Team,
        };

        console.log('UPDATE MODE: updateData', updateData, 'editIdNum', editIdNum);

        const { error: updateError } = await supabase
          .from('welfare_requests')
          .update(updateData)
          .eq('id', editIdNum);

        if (updateError) {
          console.error('Supabase updateError:', updateError);
          throw new Error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เนเธเนเนเธเธเธณเธฃเนเธญเธเนเธ”เน เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเน');
        }

        toast({
          title: 'เนเธเนเนเธเธเธณเธฃเนเธญเธเธชเธณเน€เธฃเนเธ',
          description: 'เธเนเธญเธกเธนเธฅเธเธณเธฃเนเธญเธเนเธ”เนเธฃเธฑเธเธเธฒเธฃเนเธเนเนเธเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง',
        });
        setTimeout(onBack, 2000);
        return;
      }

      // For wedding type, show signature modal before submitting
      if (type === 'wedding') {
        // Store form data temporarily
        setPendingFormData({ data, employeeData });
        setShowSignatureModal(true);
        setIsSubmitting(false);
        return;
      }

      // For non-wedding types, proceed with normal submission
      await processFormSubmission(data, employeeData);

    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        title: 'เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”',
        description: error.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเนเธเธเธณเธฃเนเธญเธเนเธ”เน เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเนเธญเธตเธเธเธฃเธฑเนเธ',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle signature confirmation
  const handleSignatureConfirm = async (signatureData: string) => {
    setUserSignature(signatureData);

    if (pendingFormData) {
      try {
        setIsSubmitting(true);
        await processFormSubmission(pendingFormData.data, pendingFormData.employeeData, signatureData);
      } catch (error: any) {
        console.error('Error submitting form after signature:', error);
        toast({
          title: 'เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”',
          description: error.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเนเธเธเธณเธฃเนเธญเธเนเธ”เน เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเนเธญเธตเธเธเธฃเธฑเนเธ',
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
        setPendingFormData(null);
      }
    }
  };

  // Process form submission
  const processFormSubmission = async (data: any, employeeData: any, signature?: string) => {
    // If employeeData is not provided, fetch it
    let finalEmployeeData = employeeData;
    if (!finalEmployeeData) {
      try {
        const { data: fetchedEmployeeData, error } = await supabase
          .from('Employee')
          .select('id, Name, Position, Team')
          .eq('email_user', user!.email)
          .single();

        if (!error && fetchedEmployeeData) {
          finalEmployeeData = fetchedEmployeeData;
        } else {
          throw new Error('เนเธกเนเธเธเธเนเธญเธกเธนเธฅเธเธเธฑเธเธเธฒเธ');
        }
      } catch (error) {
        throw new Error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเธเธเธฑเธเธเธฒเธเนเธ”เน');
      }
    }

    // CREATE NEW REQUEST
    const requestData = {
      userId: user!.id,
      userName: finalEmployeeData?.Name || profile?.name || user?.name || 'Unknown User',
      userDepartment: finalEmployeeData?.Team || 'Unknown Department',
      department_user: finalEmployeeData?.Team || 'Unknown Department',
      type: type,
      status: 'pending' as const,
      amount: Number(data.netAmount || data.amount || 0),
      date: data.startDate || new Date().toISOString(),
      details: data.details || '',
      attachments: files,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      managerId: finalEmployeeData?.Position,
      start_date: data.startDate,
      end_date: data.endDate,
      total_days: data.totalDays,
      birth_type: data.birthType,
      funeral_type: data.funeralType,
      training_topics: data.trainingTopics ? JSON.stringify(data.trainingTopics) : null,
      total_amount: data.totalAmount,
      tax7_percent: data.tax7Percent,
      withholding_tax3_percent: data.withholdingTax3Percent,
      net_amount: data.netAmount,
      excess_amount: data.excessAmount,
      company_payment: data.companyPayment,
      employee_payment: data.employeePayment,
      course_name: data.courseName,
      organizer: data.organizer,
      is_vat_included: data.isVatIncluded,
      userSignature: signature || userSignature, // เน€เธเธดเนเธกเธฅเธฒเธขเน€เธเนเธ
    };

    const result = await submitRequest(requestData);
    if (!result) {
      throw new Error('Failed to submit request');
    }

    // Generate PDF and upload to Supabase
    try {
      const { blob, filename } = await generateWelfarePDF(
        {
          ...requestData,
          id: result.id || Date.now(),
          status: 'pending_manager' as const,
          createdAt: requestData.createdAt,
          updatedAt: requestData.updatedAt,
          userSignature: signature || userSignature
        },
        user!,
        finalEmployeeData
      );
      const pdfUrl = await uploadPDFToSupabase(blob, filename, user?.id);
      // Update the request with the PDF URL
      if (result.id && pdfUrl) {
        await supabase.from('welfare_requests').update({ pdf_url: pdfUrl }).eq('id', result.id);
      }
      toast({
        title: 'เธชเนเธเธเธณเธฃเนเธญเธเนเธฅเธฐเธญเธฑเธเนเธซเธฅเธ” PDF เธชเธณเน€เธฃเนเธ',
        description: 'เธเธณเธฃเนเธญเธเธเธญเธเธเธธเธ“เธ–เธนเธเธชเนเธเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง เนเธฅเธฐ PDF เนเธ”เนเธ–เธนเธเธเธฑเธเธ—เธถเธเนเธเธฃเธฐเธเธเนเธฅเนเธง',
      });
    } catch (pdfError) {
      console.error('PDF generation/upload error:', pdfError);
      toast({
        title: 'เธชเนเธเธเธณเธฃเนเธญเธเธชเธณเน€เธฃเนเธ',
        description: 'เธเธณเธฃเนเธญเธเธเธญเธเธเธธเธ“เธ–เธนเธเธชเนเธเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง เนเธ•เนเนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธ/เธญเธฑเธเนเธซเธฅเธ” PDF เนเธ”เนเนเธเธเธ“เธฐเธเธตเน',
      });
    }

    toast({
      title: 'เธชเนเธเธเธณเธฃเนเธญเธเธชเธณเน€เธฃเนเธ',
      description: 'เธเธณเธฃเนเธญเธเธเธญเธเธเธธเธ“เธ–เธนเธเธชเนเธเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง เนเธฅเธฐเธญเธขเธนเนเนเธเธฃเธฐเธซเธงเนเธฒเธเธเธฒเธฃเธเธดเธเธฒเธฃเธ“เธฒ',
    });


    reset();
    setFiles([]);
    setUserSignature('');
    setTimeout(onBack, 2000);
  };



  // 3. เธญเธฑเธเน€เธ”เธ•เธเธฑเธเธเนเธเธฑเธ calculateTrainingAmounts
  const calculateTrainingAmounts = (total: number, remainingBudget: number) => {
    // เธ–เนเธฒเน€เธฅเธทเธญเธ checkbox เธงเนเธฒ "เธเธณเธเธงเธเน€เธเธดเธเธฃเธงเธก VAT เนเธฅเธฐ เธ เธฒเธฉเธต เธ“ เธ—เธตเนเธเนเธฒเธขเนเธฅเนเธง"
    let vat = 0;
    let withholding = 0;
    let grossAmount = total;
    if (!isVatIncluded) {
      vat = total * 0.07;
      withholding = total * 0.03;
      grossAmount = total + vat;
    } else {
      // เธเธฃเธ“เธตเธเธนเนเนเธเนเธเธฃเธญเธเธขเธญเธ”เธฃเธงเธกเธกเธฒเนเธฅเนเธง เนเธกเนเธเธงเธ VAT/เธซเธฑเธ เธ“ เธ—เธตเนเธเนเธฒเธขเธเนเธณ
      vat = 0;
      withholding = 0;
      grossAmount = total;
    }
    const remainingNum = Number(remainingBudget);

    let netNum = 0;
    let excessAmountValue = 0;
    let companyPaymentValue = 0;
    let employeePaymentValue = 0;

    if (grossAmount > remainingNum) {
      // --- เธเธฃเธ“เธตเน€เธเธดเธเธเธเธเธฃเธฐเธกเธฒเธ“ ---
      excessAmountValue = grossAmount - remainingNum;
      netNum = grossAmount;

      companyPaymentValue = excessAmountValue / 2;
      employeePaymentValue = (excessAmountValue / 2) + withholding;

    } else {
      // --- เธเธฃเธ“เธตเนเธกเนเน€เธเธดเธเธเธเธเธฃเธฐเธกเธฒเธ“ ---
      netNum = grossAmount + withholding;
      excessAmountValue = 0;
      companyPaymentValue = 0;
      employeePaymentValue = 0;
    }

    // --- เธญเธฑเธเน€เธ”เธ•เธเนเธฒเธ—เธฑเนเธเธซเธกเธ”เนเธเธขเธฑเธเธเธญเธฃเนเธก ---
    setValue('totalAmount', total);
    setValue('tax7Percent', vat);
    setValue('withholdingTax3Percent', withholding);
    setValue('netAmount', netNum);
    setValue('excessAmount', excessAmountValue); // เธ•เธฑเนเธเธเนเธฒ Field เนเธซเธกเน
    setValue('companyPayment', companyPaymentValue);
    setValue('employeePayment', employeePaymentValue);
  };

  // เธเธฑเธเธเนเธเธฑเธเธเธณเธเธงเธ“เธชเธณเธซเธฃเธฑเธ welfare types เธญเธทเนเธ เน (เนเธกเนเนเธเน training)
  const calculateNonTrainingAmounts = (total: number) => {
    let vat = 0;
    let withholding = 0;
    let netAmount = total;

    if (!isVatIncluded) {
      // เธเธฃเธ“เธตเธ—เธตเนเธขเธฑเธเนเธกเนเธฃเธงเธก VAT เนเธฅเธฐเธ เธฒเธฉเธต เธ“ เธ—เธตเนเธเนเธฒเธข
      vat = total * 0.07;
      withholding = total * 0.03;
      netAmount = total + vat - withholding;
    } else {
      // เธเธฃเธ“เธตเธ—เธตเนเธฃเธงเธก VAT เนเธฅเธฐเธ เธฒเธฉเธต เธ“ เธ—เธตเนเธเนเธฒเธขเนเธฅเนเธง
      vat = 0;
      withholding = 0;
      netAmount = total;
    }

    // เธญเธฑเธเน€เธ”เธ•เธเนเธฒเธ—เธฑเนเธเธซเธกเธ”เนเธเธขเธฑเธเธเธญเธฃเนเธก
    setValue('totalAmount', total);
    setValue('tax7Percent', vat);
    setValue('withholdingTax3Percent', withholding);
    setValue('netAmount', netAmount);
  };

  // Add function to calculate total days
  const calculateTotalDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    return totalDays;
  };

  return (
    <div className="animate-fade-in">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={onBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        เธเธฅเธฑเธ
      </Button>

      <div id="welfare-form-content" className="form-container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{getFormTitle(type)}</h1>
        </div>

        {/* Display welfare limits for non-training types */}
        {maxAmount !== null && type !== 'training' && (
          <div className="mb-6">
            <Alert>
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                {type === 'childbirth' ? (
                  <>เธเธฅเธญเธ”เธเธฃเธฃเธกเธเธฒเธ•เธด 4,000 เธเธฒเธ—, เธเนเธฒเธเธฅเธญเธ” 6,000 เธเธฒเธ—</>
                ) : (
                  <>เธงเธเน€เธเธดเธเธชเธนเธเธชเธธเธ”: {isMonthly ? `${maxAmount} เธเธฒเธ—/เน€เธ”เธทเธญเธ` : `${maxAmount.toLocaleString()} เธเธฒเธ—/เธเธต`}</>
                )}
                {condition && <> ({condition})</>}
              </AlertDescription>
            </Alert>
          </div>
        )}
        {user && type !== 'training' && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700">
              เธเธเธเธฃเธฐเธกเธฒเธ“เธเธเน€เธซเธฅเธทเธญเธชเธณเธซเธฃเธฑเธเธชเธงเธฑเธชเธ”เธดเธเธฒเธฃเธเธตเน: <span className="font-bold text-welfare-blue">{remainingBudget.toLocaleString()} เธเธฒเธ—</span>
            </p>
          </div>
        )}
        {type === 'training' && (
          <div className="space-y-4 mb-6">
            <Alert>
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                เธงเธเน€เธเธดเธเธชเธนเธเธชเธธเธ”: {maxAmount?.toLocaleString() || '0'} เธเธฒเธ—
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                เธเธเธเธฃเธฐเธกเธฒเธ“เธเธเน€เธซเธฅเธทเธญ: {remainingBudget?.toLocaleString() || '0'} เธเธฒเธ—
              </AlertDescription>
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Training specific fields */}
          {type === 'training' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="form-label">เธซเธฅเธฑเธเธชเธนเธ•เธฃ</label>
                  <Input
                    placeholder="เธฃเธฐเธเธธเธเธทเนเธญเธซเธฅเธฑเธเธชเธนเธ•เธฃ"
                    className="form-input"
                    {...register('courseName', {
                      required: 'เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธเธทเนเธญเธซเธฅเธฑเธเธชเธนเธ•เธฃ'
                    })}
                  />
                  {errors.courseName && (
                    <p className="text-red-500 text-sm mt-1">{errors.courseName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="form-label">เธเธฑเธ”เธเธถเนเธเนเธ”เธข</label>
                  <Input
                    placeholder="เธฃเธฐเธเธธเธเธทเนเธญเธเธนเนเธเธฑเธ”"
                    className="form-input"
                    {...register('organizer', {
                      required: 'เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธเธนเนเธเธฑเธ”'
                    })}
                  />
                  {errors.organizer && (
                    <p className="text-red-500 text-sm mt-1">{errors.organizer.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="form-label">เธ•เธฑเนเธเนเธ•เนเธงเธฑเธเธ—เธตเน</label>
                  <Input
                    type="date"
                    className="form-input"
                    {...register('startDate', {
                      required: 'เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธงเธฑเธเธ—เธตเนเน€เธฃเธดเนเธก',
                      onChange: (e) => {
                        if (endDate && e.target.value > endDate) {
                          setValue('endDate', e.target.value);
                        }
                      }
                    })}
                  />
                  {errors.startDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="form-label">เธ–เธถเธเธงเธฑเธเธ—เธตเน</label>
                  <Input
                    type="date"
                    className="form-input"
                    {...register('endDate', {
                      required: 'เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธงเธฑเธเธ—เธตเนเธชเธดเนเธเธชเธธเธ”',
                      validate: value => !value || !startDate || value >= startDate || 'เธงเธฑเธเธ—เธตเนเธชเธดเนเธเธชเธธเธ”เธ•เนเธญเธเนเธกเนเธเนเธญเธขเธเธงเนเธฒเธงเธฑเธเธ—เธตเนเน€เธฃเธดเนเธก'
                    })}
                  />
                  {errors.endDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="form-label">เธฃเธงเธกเน€เธเนเธเธเธณเธเธงเธ</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="form-input"
                      readOnly
                      {...register('totalDays')}
                    />
                    <span className="text-sm">เธงเธฑเธ</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="form-label">เนเธ”เธขเธกเธตเธงเธฑเธ•เธ–เธธเธเธฃเธฐเธชเธเธเนเธ—เธตเนเธเธญเน€เธเนเธฒเธญเธเธฃเธก เธ”เธฑเธเธเธตเน</label>
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Input
                        {...register(`trainingTopics.${index}.value` as const)}
                        placeholder={`เธงเธฑเธ•เธ–เธธเธเธฃเธฐเธชเธเธเนเธ—เธตเน ${index + 1}`}
                        className="form-input"
                      />
                      {fields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {fields.length < 5 && (
                    <Button
                      type="button"
                      onClick={() => append({ value: '' })}
                      className="mt-2"
                      variant="outline"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      เน€เธเธดเนเธกเธงเธฑเธ•เธ–เธธเธเธฃเธฐเธชเธเธเน
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="amount" className="form-label">เธเธณเธเธงเธเน€เธเธดเธ</label>
                <Input
                  id="amount"
                  type="number"
                  className="form-input"
                  placeholder="เธฃเธฐเธเธธเธเธณเธเธงเธเน€เธเธดเธ"
                  {...register('amount', {
                    required: 'เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธเธณเธเธงเธเน€เธเธดเธ',
                    min: {
                      value: 1,
                      message: 'เธเธณเธเธงเธเน€เธเธดเธเธ•เนเธญเธเธกเธฒเธเธเธงเนเธฒ 0'
                    },
                    max: {
                      value: maxAmount || 100000,
                      message: `เธเธณเธเธงเธเน€เธเธดเธเธ•เนเธญเธเนเธกเนเน€เธเธดเธ ${maxAmount} เธเธฒเธ—`
                    },
                    onChange: (e) => calculateTrainingAmounts(Number(e.target.value), remainingBudget)
                  })}
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>

              {/* Checkbox: เธฃเธงเธก VAT เนเธฅเธฐ เธ เธฒเธฉเธต เธ“ เธ—เธตเนเธเนเธฒเธขเนเธฅเนเธง */}
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="isVatIncluded"
                  {...register('isVatIncluded')}
                  className="mr-2"
                />
                <label htmlFor="isVatIncluded" className="form-label text-gray-700">
                  เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเธ–เนเธฒเธเธณเธเธงเธเน€เธเธดเธเธฃเธงเธก VAT เนเธฅเธฐ เธ เธฒเธฉเธต เธ“ เธ—เธตเนเธเนเธฒเธขเนเธฅเนเธง
                </label>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="form-label">เธ เธฒเธฉเธตเธกเธนเธฅเธเนเธฒเน€เธเธดเนเธก 7%</label>
                  <Input
                    type="number"
                    className="form-input"
                    readOnly
                    {...register('tax7Percent')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="form-label">เธซเธฑเธเธ เธฒเธฉเธต เธ“ เธ—เธตเนเธเนเธฒเธข 3%</label>
                  <Input
                    type="number"
                    className="form-input"
                    readOnly
                    {...register('withholdingTax3Percent')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="form-label">เธเธณเธเธงเธเน€เธเธดเธเธชเธธเธ—เธเธด</label>
                  <Input
                    type="number"
                    className="form-input"
                    readOnly
                    {...register('netAmount')}
                  />
                </div>
              </div>

              {/* 2. เน€เธเธดเนเธก Field 'เธขเธญเธ”เธชเนเธงเธเน€เธเธดเธเธ—เธฑเนเธเธซเธกเธ”' เนเธเธซเธเนเธฒเธเธญเธฃเนเธก (JSX) */}
              <div className="space-y-2">
                <label className="form-label">เธขเธญเธ”เธชเนเธงเธเน€เธเธดเธเธ—เธฑเนเธเธซเธกเธ”</label>
                <Input
                  type="number"
                  className="form-input bg-gray-100"
                  readOnly
                  {...register('excessAmount')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="form-label">เธเธฃเธดเธฉเธฑเธ—เธเนเธฒเธข</label>
                  <Input
                    type="number"
                    className="form-input bg-gray-100"
                    readOnly
                    {...register('companyPayment')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="form-label">เธเธเธฑเธเธเธฒเธเธเนเธฒเธข</label>
                  <Input
                    type="number"
                    className="form-input bg-gray-100"
                    readOnly
                    {...register('employeePayment')}
                  />
                </div>
              </div>
            </>
          )}

          {/* Funeral specific fields */}
          {type === 'funeral' && (
            <div className="space-y-2">
              <label className="form-label">เธเธฃเธฐเน€เธ เธ—เธชเธงเธฑเธชเธ”เธดเธเธฒเธฃเธเธฒเธเธจเธ</label>
              <Select
                onValueChange={(value) => setValue('funeralType', value as 'employee_spouse' | 'child' | 'parent')}
                defaultValue={watch('funeralType')}
                {...register('funeralType', {
                  required: type === 'funeral' ? 'เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเธเธฃเธฐเน€เธ เธ—เธชเธงเธฑเธชเธ”เธดเธเธฒเธฃเธเธฒเธเธจเธ' : false
                })}
              >
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="เน€เธฅเธทเธญเธเธเธฃเธฐเน€เธ เธ—เธชเธงเธฑเธชเธ”เธดเธเธฒเธฃเธเธฒเธเธจเธ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee_spouse">เธชเธงเธฑเธชเธ”เธดเธเธฒเธฃเธเธฒเธเธจเธ เธเธเธฑเธเธเธฒเธ/เธชเธฒเธกเธตเธซเธฃเธทเธญเธ เธฃเธฃเธขเธฒเธเธญเธเธเธเธฑเธเธเธฒเธ</SelectItem>
                  <SelectItem value="child">เธชเธงเธฑเธชเธ”เธดเธเธฒเธฃเธเธฒเธเธจเธ เธเธธเธ•เธฃ เธเธญเธเธเธเธฑเธเธเธฒเธ</SelectItem>
                  <SelectItem value="parent">เธชเธงเธฑเธชเธ”เธดเธเธฒเธฃเธเธฒเธเธจเธ เธเธดเธ”เธฒ/เธกเธฒเธฃเธ”เธฒ เธเธญเธเธเธเธฑเธเธเธฒเธ</SelectItem>
                </SelectContent>
              </Select>
              {errors.funeralType && (
                <p className="text-red-500 text-sm mt-1">{errors.funeralType.message}</p>
              )}
            </div>
          )}

          {/* Continue with existing fields for other welfare types */}
          {type !== 'training' && (
            <>
              {/* Original amount field */}
              <div className="space-y-2">
                <label htmlFor="amount" className="form-label">เธเธณเธเธงเธเน€เธเธดเธ (เธเธฒเธ—)</label>
                <Input
                  id="amount"
                  type="number"
                  className="form-input"
                  placeholder="เธฃเธฐเธเธธเธเธณเธเธงเธเน€เธเธดเธ"
                  {...register('amount', {
                    required: 'เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธเธณเธเธงเธเน€เธเธดเธ',
                    min: {
                      value: 1,
                      message: 'เธเธณเธเธงเธเน€เธเธดเธเธ•เนเธญเธเธกเธฒเธเธเธงเนเธฒ 0'
                    },
                    max: {
                      value: maxAmount || 100000,
                      message: `เธเธณเธเธงเธเน€เธเธดเธเธ•เนเธญเธเนเธกเนเน€เธเธดเธ ${maxAmount} เธเธฒเธ—`
                    },
                    validate: {
                      notMoreThanRemaining: value =>
                        Number(value) <= remainingBudget || 'เธเธณเธเธงเธเน€เธเธดเธเน€เธเธดเธเธเธเธเธฃเธฐเธกเธฒเธ“เธ—เธตเนเน€เธซเธฅเธทเธญเธญเธขเธนเน'
                    },
                    onChange: (e) => calculateNonTrainingAmounts(Number(e.target.value))
                  })}

                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>

              {/* Checkbox: เธฃเธงเธก VAT เนเธฅเธฐ เธ เธฒเธฉเธต เธ“ เธ—เธตเนเธเนเธฒเธขเนเธฅเนเธง */}
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="isVatIncluded-nontraining"
                  {...register('isVatIncluded')}
                  className="mr-2"
                />
                <label htmlFor="isVatIncluded-nontraining" className="form-label text-gray-700">
                  เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเธ–เนเธฒเธเธณเธเธงเธเน€เธเธดเธเธฃเธงเธก VAT เนเธฅเธฐ เธ เธฒเธฉเธต เธ“ เธ—เธตเนเธเนเธฒเธขเนเธฅเนเธง
                </label>
              </div>

              {/* VAT and Tax fields for non-training types */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="form-label">เธ เธฒเธฉเธตเธกเธนเธฅเธเนเธฒเน€เธเธดเนเธก 7%</label>
                  <Input
                    type="number"
                    className="form-input bg-gray-100"
                    readOnly
                    {...register('tax7Percent')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="form-label">เธซเธฑเธเธ เธฒเธฉเธต เธ“ เธ—เธตเนเธเนเธฒเธข 3%</label>
                  <Input
                    type="number"
                    className="form-input bg-gray-100"
                    readOnly
                    {...register('withholdingTax3Percent')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="form-label">เธเธณเธเธงเธเน€เธเธดเธเธชเธธเธ—เธเธด</label>
                  <Input
                    type="number"
                    className="form-input bg-gray-100"
                    readOnly
                    {...register('netAmount')}
                  />
                </div>
              </div>
            </>
          )}

          {/* Details Field */}
          <div className="space-y-2">
            <label htmlFor="details" className="form-label">เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”</label>
            <Textarea
              id="details"
              className="form-input min-h-[100px]"
              placeholder="เธเธฃเธญเธเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เน€เธเธดเนเธกเน€เธ•เธดเธกเธ–เนเธฒเธกเธต"
              {...register('details', {
                required: 'เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”',
                minLength: {
                  value: 0,
                  message: 'เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธ•เนเธญเธเธกเธตเธเธงเธฒเธกเธขเธฒเธงเธญเธขเนเธฒเธเธเนเธญเธข 10 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ'
                }
              })}
            />
            {errors.details && (
              <p className="text-red-500 text-sm mt-1">{errors.details.message}</p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label htmlFor="attachments" className="form-label">เนเธเธเน€เธญเธเธชเธฒเธฃ (เนเธเน€เธชเธฃเนเธเธฃเธฑเธเน€เธเธดเธ, เน€เธญเธเธชเธฒเธฃเธเธฃเธฐเธเธญเธ)</label>
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
                <p className="text-sm font-medium mb-1">เนเธเธฅเนเธ—เธตเนเธญเธฑเธเนเธซเธฅเธ”:</p>
                <ul className="text-sm space-y-1">
                  {files.map((file, index) => {
                    const fileName = file.split('/').pop() || `เนเธเธฅเน ${index + 1}`;
                    return (
                      <li key={index} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2 text-green-600">
                          <Check className="h-4 w-4 flex-shrink-0" />
                          <a
                            href={file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate hover:underline"
                            title={fileName}
                          >
                            {fileName}
                          </a>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="sr-only">เธฅเธเนเธเธฅเน</span>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-gray-500 mt-1">
                  เธเธณเธเธงเธเนเธเธฅเนเธ—เธตเนเธญเธฑเธเนเธซเธฅเธ”: {files.length} เนเธเธฅเน
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full btn-hover-effect"
            disabled={isLoading || isSubmitting}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                เธเธณเธฅเธฑเธเธชเนเธเธเธณเธฃเนเธญเธ...
              </>
            ) : (
              'เธชเนเธเธเธณเธฃเนเธญเธ'
            )}
          </Button>

          {/* Animated Loading Popup */}
          <LoadingPopup open={isSubmitting} />
        </form>
      </div>

      {/* Digital Signature Modal */}
      <DigitalSignature
        isOpen={showSignatureModal}
        onClose={() => {
          setShowSignatureModal(false);
          setPendingFormData(null);
        }}
        onConfirm={handleSignatureConfirm}
        userName={employeeData?.Name || profile?.name || user?.name || ''}
      />
    </div>
  );
}
