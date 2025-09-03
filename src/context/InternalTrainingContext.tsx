import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { InternalTrainingRequest, StatusType, WelfareRequest } from '@/types';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InternalTrainingContextType {
  trainingRequests: WelfareRequest[];
  getRequestsByUser: (userId: string) => WelfareRequest[];
  getRequestsByStatus: (status: StatusType) => WelfareRequest[];
  submitRequest: (requestData: Omit<WelfareRequest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<WelfareRequest | null>;
  updateRequest: (id: number, data: Partial<WelfareRequest>) => Promise<void>;
  updateRequestStatus: (id: number, status: StatusType, comment?: string, approverInfo?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  refreshRequests: () => Promise<void>;
  isLoading: boolean;
}

const InternalTrainingContext = createContext<InternalTrainingContextType | undefined>(undefined);

export const InternalTrainingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trainingRequests, setTrainingRequests] = useState<WelfareRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const { user } = useAuth();
  const { toast } = useToast();

  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchRequests = useCallback(async (forceRefresh = false) => {
    // Check if we need to fetch (cache is expired or force refresh)
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < CACHE_DURATION && trainingRequests.length > 0) {
      console.log('Using cached internal training data, skipping fetch');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('welfare_requests')
        .select('*')
        .eq('request_type', 'internal_training')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching internal training requests:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถโหลดข้อมูลคำร้องอบรมภายในได้',
          variant: 'destructive',
        });
        return;
      }

      setTrainingRequests(
        (data || []).map((row: any) => {
          let attachments: string[] = [];
          if (row.attachment_url) {
            try {
              if (typeof row.attachment_url === 'string' && row.attachment_url.startsWith('[')) {
                attachments = JSON.parse(row.attachment_url);
              } else {
                attachments = row.attachment_url ? [row.attachment_url] : [];
              }
            } catch {
              attachments = row.attachment_url ? [row.attachment_url] : [];
            }
          }
          return {
            id: row.id,
            userId: row.employee_id?.toString(),
            userName: row.employee_name || row.Employee?.Name || '',
            userDepartment: row.department_request || row.Employee?.Team || '',
            type: row.request_type,
            status: row.status?.toLowerCase() || 'pending',
            amount: row.amount,
            date: row.created_at,
            details: row.details,
            attachments,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            title: row.title,
            approverId: row.manager_approver_id || row.approver_id,
            notes: row.manager_notes || '',
            managerId: row.manager_id?.toString(),
            // Internal training specific fields
            branch: row.branch,
            courseName: row.course_name || row.title,
            venue: row.venue,
            startDate: row.start_date,
            endDate: row.end_date,
            startTime: row.start_time,
            endTime: row.end_time,
            totalHours: row.total_hours,
            totalParticipants: row.total_participants,
            participants: row.participants,
            instructorFee: row.instructor_fee,
            instructorFeeWithholding: row.instructor_fee_withholding,
            instructorFeeVat: row.instructor_fee_vat,
            instructorFeeTotal: row.instructor_fee_total,
            roomFoodBeverage: row.room_food_beverage,
            roomFoodBeverageWithholding: row.room_food_beverage_withholding,
            roomFoodBeverageVat: row.room_food_beverage_vat,
            roomFoodBeverageTotal: row.room_food_beverage_total,
            otherExpenses: row.other_expenses,
            otherExpensesWithholding: row.other_expenses_withholding,
            otherExpensesVat: row.other_expenses_vat,
            otherExpensesTotal: row.other_expenses_total,
            withholdingTax: row.withholding_tax,
            vat: row.vat,
            averageCostPerPerson: row.average_cost_per_person,
            taxCertificateName: row.tax_certificate_name,
            withholdingTaxAmount: row.withholding_tax_amount,
            additionalNotes: row.additional_notes,
            isVatIncluded: row.is_vat_included,
            // Approval fields
            managerApproverName: row.manager_approver_name,
            managerApprovedAt: row.manager_approved_at,
            hrApproverId: row.hr_approver_id,
            hrApproverName: row.hr_approver_name,
            hrApprovedAt: row.hr_approved_at,
            // Digital signatures
            userSignature: row.user_signature,
            managerSignature: row.manager_signature,
            hrSignature: row.hr_signature,
          };
        })
      );
      setLastFetchTime(now);
    } catch (error) {
      console.error('Error in fetchRequests:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลคำร้องอบรมภายในได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [lastFetchTime, trainingRequests.length, toast]);

  // Fetch requests on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, fetchRequests]);

  // Real-time subscription for internal training requests
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('internal_training_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'welfare_requests',
          filter: 'request_type=eq.internal_training'
        },
        (payload) => {
          console.log('Internal training real-time update received:', payload);

          // Only refresh if the change is significant
          if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
            const statusChanged = payload.new.status !== payload.old.status;
            const signatureChanged =
              payload.new.manager_signature !== payload.old.manager_signature ||
              payload.new.hr_signature !== payload.old.hr_signature;

            // Only fetch if status or signature changed
            if (statusChanged || signatureChanged) {
              console.log('Significant internal training change detected, refreshing data...');
              fetchRequests(true);
            } else {
              console.log('Minor internal training change detected, skipping refresh');
            }
          } else {
            // For INSERT/DELETE, always refresh
            fetchRequests(true);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchRequests]);

  const getRequestsByUser = useCallback((userId: string): WelfareRequest[] => {
    return trainingRequests.filter(request => request.userId === userId);
  }, [trainingRequests]);

  const getRequestsByStatus = useCallback((status: StatusType): WelfareRequest[] => {
    return trainingRequests.filter(request => request.status === status);
  }, [trainingRequests]);

  const submitRequest = useCallback(async (
    requestData: Omit<WelfareRequest, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WelfareRequest | null> => {
    // ป้องกันการ submit ซ้ำ
    if (isLoading) {
      console.log('Already submitting request, preventing duplicate');
      return null;
    }
    
    try {
      setIsLoading(true);

      // Debug logs removed for production

      // ตรวจสอบว่ามี request ที่คล้ายกันในช่วงเวลาใกล้เคียงหรือไม่ (ป้องกัน duplicate)
      const recentTime = new Date(Date.now() - 30000).toISOString(); // 30 วินาทีที่แล้ว
      const { data: existingRequests, error: checkError } = await supabase
        .from('welfare_requests')
        .select('id')
        .eq('employee_id', Number(requestData.employee_id))
        .eq('request_type', 'internal_training')
        .eq('course_name', requestData.course_name)
        .gte('created_at', recentTime);

      if (checkError) {
        console.error('Error checking for duplicate requests:', checkError);
      } else if (existingRequests && existingRequests.length > 0) {
        console.log('Duplicate request detected, preventing submission');
        toast({
          title: 'คำร้องซ้ำ',
          description: 'มีคำร้องที่คล้ายกันถูกส่งไปแล้วในช่วงเวลาใกล้เคียง',
          variant: 'destructive',
        });
        return null;
      }

      // Convert camelCase to snake_case for database with proper type conversion
      const dbData = {
        employee_id: Number(requestData.employee_id),
        employee_name: requestData.employee_name || '',
        request_type: 'internal_training',
        status: requestData.status || 'pending_manager',
        title: requestData.title || '',
        details: requestData.details || '',
        amount: Number(requestData.amount || 0),
        department_request: requestData.department_request || '',
        branch: requestData.branch || null,
        course_name: requestData.course_name || '',
        start_date: requestData.start_date || null,
        end_date: requestData.end_date || null,
        start_time: requestData.start_time || null,
        end_time: requestData.end_time || null,
        total_hours: Number(requestData.total_hours || 0),
        venue: requestData.venue || null,
        participants: requestData.participants || null,
        total_participants: Number(requestData.total_participants || 0),
        instructor_fee: Number(requestData.instructor_fee || 0),
        instructor_fee_withholding: Number(requestData.instructor_fee_withholding || 0),
        instructor_fee_vat: Number(requestData.instructor_fee_vat || 0),
        instructor_fee_total: Number(requestData.instructor_fee_total || 0),
        room_food_beverage: Number(requestData.room_food_beverage || 0),
        room_food_beverage_withholding: Number(requestData.room_food_beverage_withholding || 0),
        room_food_beverage_vat: Number(requestData.room_food_beverage_vat || 0),
        room_food_beverage_total: Number(requestData.room_food_beverage_total || 0),
        other_expenses: Number(requestData.other_expenses || 0),
        other_expenses_withholding: Number(requestData.other_expenses_withholding || 0),
        other_expenses_vat: Number(requestData.other_expenses_vat || 0),
        other_expenses_total: Number(requestData.other_expenses_total || 0),
        withholding_tax: Number(requestData.withholding_tax || 0),
        vat: Number(requestData.vat || 0),
        total_amount: Number(requestData.total_amount || 0),
        average_cost_per_person: Number(requestData.average_cost_per_person || 0),
        tax_certificate_name: requestData.tax_certificate_name || null,
        withholding_tax_amount: Number(requestData.withholding_tax_amount || 0),
        additional_notes: requestData.additional_notes || null,
        is_vat_included: Boolean(requestData.is_vat_included),
        user_signature: requestData.userSignature || requestData.user_signature || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Debug logs removed for production

      const { data, error } = await supabase
        .from('welfare_requests')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error('Error submitting internal training request:', error);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Error message:', error.message);
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: `ไม่สามารถส่งคำร้องอบรมภายในได้: ${error.message}`,
          variant: 'destructive',
        });
        return null;
      }

      // Add to local state
      setTrainingRequests(prev => [data, ...prev]);

      toast({
        title: 'ส่งคำร้องสำเร็จ',
        description: 'คำร้องอบรมภายในของคุณถูกส่งเรียบร้อยแล้ว',
      });

      return data;
    } catch (error) {
      console.error('Error in submitRequest:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถส่งคำร้องอบรมภายในได้',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateRequest = useCallback(async (
    id: number,
    data: Partial<WelfareRequest>
  ): Promise<void> => {
    try {
      setIsLoading(true);

      // Convert camelCase to snake_case for database update
      const dbData: any = {
        updated_at: new Date().toISOString()
      };

      // Map only the fields that might be updated
      if (data.employee_id !== undefined) dbData.employee_id = data.employee_id;
      if (data.employee_name !== undefined) dbData.employee_name = data.employee_name;
      if (data.status !== undefined) dbData.status = data.status;
      if (data.title !== undefined) dbData.title = data.title;
      if (data.details !== undefined) dbData.details = data.details;
      if (data.amount !== undefined) dbData.amount = data.amount;
      if (data.department_request !== undefined) dbData.department_request = data.department_request;
      if (data.branch !== undefined) dbData.branch = data.branch;
      if (data.course_name !== undefined) dbData.course_name = data.course_name;
      if (data.start_date !== undefined) dbData.start_date = data.start_date;
      if (data.end_date !== undefined) dbData.end_date = data.end_date;
      if (data.start_time !== undefined) dbData.start_time = data.start_time;
      if (data.end_time !== undefined) dbData.end_time = data.end_time;
      if (data.total_hours !== undefined) dbData.total_hours = data.total_hours;
      if (data.venue !== undefined) dbData.venue = data.venue;
      if (data.participants !== undefined) dbData.participants = data.participants;
      if (data.total_participants !== undefined) dbData.total_participants = data.total_participants;
      if (data.instructor_fee !== undefined) dbData.instructor_fee = data.instructor_fee;
      if (data.room_food_beverage !== undefined) dbData.room_food_beverage = data.room_food_beverage;
      if (data.other_expenses !== undefined) dbData.other_expenses = data.other_expenses;
      if (data.withholding_tax !== undefined) dbData.withholding_tax = data.withholding_tax;
      if (data.vat !== undefined) dbData.vat = data.vat;
      if (data.total_amount !== undefined) dbData.total_amount = data.total_amount;
      if (data.average_cost_per_person !== undefined) dbData.average_cost_per_person = data.average_cost_per_person;
      if (data.tax_certificate_name !== undefined) dbData.tax_certificate_name = data.tax_certificate_name;
      if (data.withholding_tax_amount !== undefined) dbData.withholding_tax_amount = data.withholding_tax_amount;
      if (data.additional_notes !== undefined) dbData.additional_notes = data.additional_notes;
      if (data.is_vat_included !== undefined) dbData.is_vat_included = data.is_vat_included;

      const { error } = await supabase
        .from('welfare_requests')
        .update(dbData)
        .eq('id', id)
        .eq('request_type', 'internal_training');

      if (error) {
        console.error('Error updating internal training request:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถอัปเดตคำร้องอบรมภายในได้',
          variant: 'destructive',
        });
        return;
      }

      // Update local state
      setTrainingRequests(prev =>
        prev.map(request =>
          request.id === id
            ? { ...request, ...data, updated_at: new Date().toISOString() }
            : request
        )
      );

      toast({
        title: 'อัปเดตสำเร็จ',
        description: 'ข้อมูลคำร้องอบรมภายในได้รับการอัปเดตแล้ว',
      });
    } catch (error) {
      console.error('Error in updateRequest:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถอัปเดตคำร้องอบรมภายในได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateRequestStatus = useCallback(async (
    id: number,
    status: StatusType,
    comment?: string,
    approverInfo?: any
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      setIsLoading(true);

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Add rejection reason if provided
      if (comment) {
        updateData.rejection_reason = comment;
      }

      // Add approver information based on status
      if (status === 'pending_hr' && approverInfo) {
        updateData.manager_approved_at = new Date().toISOString();
        updateData.manager_approver_id = approverInfo.id;
        updateData.manager_approver_name = approverInfo.name;
      } else if (status === 'pending_accounting' && approverInfo) {
        updateData.hr_approved_at = new Date().toISOString();
        updateData.hr_approver_id = approverInfo.id;
        updateData.hr_approver_name = approverInfo.name;
      } else if (status === 'completed' && approverInfo) {
        updateData.accounting_approved_at = new Date().toISOString();
        updateData.accounting_approver_id = approverInfo.id;
        updateData.accounting_approver_name = approverInfo.name;
      }

      const { data, error } = await supabase
        .from('welfare_requests')
        .update(updateData)
        .eq('id', id)
        .eq('request_type', 'internal_training')
        .select()
        .single();

      if (error) {
        console.error('Error updating internal training request status:', error);
        return {
          success: false,
          error: 'ไม่สามารถอัปเดตสถานะคำร้องอบรมภายในได้'
        };
      }

      // Don't update local state immediately - let real-time subscription handle it
      // This prevents race conditions and duplicate entries

      const statusMessages = {
        pending_hr: 'อนุมัติโดยผู้จัดการแล้ว กำลังส่งต่อไปยัง HR',
        pending_accounting: 'อนุมัติโดย HR แล้ว กำลังส่งต่อไปยังแผนกบัญชี',
        completed: 'อนุมัติเรียบร้อยแล้ว',
        rejected_manager: 'ถูกปฏิเสธโดยผู้จัดการ',
        rejected_hr: 'ถูกปฏิเสธโดย HR',
        rejected_accounting: 'ถูกปฏิเสธโดยแผนกบัญชี'
      };

      toast({
        title: 'อัปเดตสถานะสำเร็จ',
        description: statusMessages[status] || 'สถานะคำร้องได้รับการอัปเดตแล้ว',
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateRequestStatus:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ'
      };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const refreshRequests = useCallback(async (): Promise<void> => {
    await fetchRequests(true);
  }, [fetchRequests]);

  const contextValue: InternalTrainingContextType = {
    trainingRequests,
    getRequestsByUser,
    getRequestsByStatus,
    submitRequest,
    updateRequest,
    updateRequestStatus,
    refreshRequests,
    isLoading
  };

  return (
    <InternalTrainingContext.Provider value={contextValue}>
      {children}
    </InternalTrainingContext.Provider>
  );
};

export const useInternalTraining = (): InternalTrainingContextType => {
  const context = useContext(InternalTrainingContext);
  if (!context) {
    throw new Error('useInternalTraining must be used within an InternalTrainingProvider');
  }
  return context;
};