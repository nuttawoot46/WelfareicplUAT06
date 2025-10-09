import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WelfareRequest, WelfareType, StatusType } from '@/types';
import { BenefitLimit, getBenefitLimits } from '@/services/welfareApi';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { debounce } from '@/utils/debounce';

interface WelfareContextType {
  welfareRequests: WelfareRequest[];
  getRequestsByUser: (userId: string) => WelfareRequest[];
  getRequestsByStatus: (status: StatusType) => WelfareRequest[];
  getRequestsByType: (type: WelfareType) => WelfareRequest[];
  submitRequest: (requestData: Omit<WelfareRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<WelfareRequest | null>;
  updateRequest: (id: number, data: Partial<WelfareRequest>) => Promise<void>;
  updateRequestStatus: (id: number, status: StatusType, comment?: string) => Promise<{ success: boolean; data?: any; error?: string; details?: any }>;
  refreshRequests: () => Promise<void>;
  isLoading: boolean;
  getWelfareLimit: (type: WelfareType) => { amount: number | null, condition?: string, monthly?: boolean };
  getRemainingBudget: (userId: string, type?: WelfareType) => number;
  trainingBudget: number | null;
}

const WelfareContext = createContext<WelfareContextType | undefined>(undefined);

export const WelfareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [welfareRequests, setWelfareRequests] = useState<WelfareRequest[]>([]);
  const [benefitLimits, setBenefitLimits] = useState<BenefitLimit[]>([]);
  const [trainingBudget, setTrainingBudget] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const { user } = useAuth();
  const { toast } = useToast();

  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchRequests = useCallback(async (forceRefresh = false) => {
    // Check if we need to fetch (cache is expired or force refresh)
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < CACHE_DURATION) {
      console.log('Using cached data, skipping fetch');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('welfare_requests')
        .select(`
          *,
          Employee!employee_id (
            Team,
            Name
          )
        `)
        .neq('request_type', 'internal_training');

      console.log('WelfareContext - Fetched data:', data);
      console.log('WelfareContext - Error:', error);

      if (error) {
        toast({ title: 'โหลดข้อมูลล้มเหลว', description: error.message, variant: 'destructive' });
      } else {
        setWelfareRequests(
          (data || []).map((row: any) => {
            let attachments: string[] = [];
            if (Array.isArray(row.attachment_url)) {
              attachments = row.attachment_url;
            } else if (typeof row.attachment_url === 'string') {
              try {
                // Try parse JSON string
                const parsed = JSON.parse(row.attachment_url);
                attachments = Array.isArray(parsed) ? parsed : [parsed];
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
              // Parse attachment selections JSON if present
              attachmentSelections: (() => {
                try {
                  if (!row.attachment_selections) return undefined;
                  if (typeof row.attachment_selections === 'string') {
                    return JSON.parse(row.attachment_selections);
                  }
                  return row.attachment_selections;
                } catch {
                  return undefined;
                }
              })(),
              createdAt: row.created_at,
              updatedAt: row.updated_at,
              title: row.title,
              approverId: row.manager_approver_id || row.approver_id,
              notes: row.manager_notes || '',
              managerId: row.manager_id?.toString(),
              // เพิ่มข้อมูล approval
              managerApproverName: row.manager_approver_name,
              managerApprovedAt: row.manager_approved_at,
              hrApproverId: row.hr_approver_id,
              hrApproverName: row.hr_approver_name,
              hrApprovedAt: row.hr_approved_at,
              // ลายเซ็นดิจิทัล - แก้ไข JSON parse error
              userSignature: (() => {
                try {
                  if (typeof row.user_signature === 'string' && row.user_signature.startsWith('data:image')) {
                    return row.user_signature; // ถ้าเป็น data URL ให้ใช้ตรงๆ
                  } else if (typeof row.user_signature === 'string') {
                    return JSON.parse(row.user_signature);
                  }
                  return row.user_signature;
                } catch {
                  return row.user_signature; // ถ้า parse ไม่ได้ให้ใช้ค่าเดิม
                }
              })(),
              managerSignature: row.manager_signature,
              hrSignature: row.hr_signature,
              // Training-specific fields
              course_name: row.course_name,
              organizer: row.organizer,
              training_topics: row.training_topics,
              start_date: row.start_date,
              end_date: row.end_date,
              total_days: row.total_days,
              total_amount: row.total_amount,
              tax7_percent: row.tax7_percent,
              withholding_tax3_percent: row.withholding_tax3_percent,
              net_amount: row.net_amount,
              company_payment: row.company_payment,
              employee_payment: row.employee_payment,
              is_vat_included: row.is_vat_included,
              // Advance payment specific fields
              advanceDepartment: row.advance_department,
              advanceDepartmentOther: row.advance_department_other,
              advanceDistrict: row.advance_district,
              advanceActivityType: row.advance_activity_type,
              advanceActivityOther: row.advance_activity_other,
              advanceShopCompany: row.advance_shop_company,
              advanceAmphur: row.advance_amphur,
              advanceProvince: row.advance_province,
              advanceEventDate: row.advance_event_date,
              advanceParticipants: row.advance_participants,
              advanceDailyRate: row.advance_daily_rate,
              advanceAccommodationCost: row.advance_accommodation_cost,
              advanceTransportationCost: row.advance_transportation_cost,
              advanceMealAllowance: row.advance_meal_allowance,
              advanceOtherExpenses: row.advance_other_expenses,
              advanceProjectName: row.advance_project_name,
              advanceProjectLocation: row.advance_project_location,
              advanceLocation: row.advance_location,
              advanceDealerName: row.advance_dealer_name,
              advanceSubdealerName: row.advance_subdealer_name,
              advanceExpenseItems: row.advance_expense_items,
              // Expense clearing specific fields
              originalAdvanceRequestId: row.original_advance_request_id,
              expenseClearingItems: row.expense_clearing_items,
              // Run number
              runNumber: row.run_number,
            };
          })
        );
        setLastFetchTime(Date.now());
      }
    } catch (err) {
      console.error('Exception fetching data:', err);
      toast({ title: 'โหลดข้อมูลล้มเหลว', description: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!user) return;

    const fetchBenefitLimits = async () => {
      try {
        const limits = await getBenefitLimits();
        setBenefitLimits(limits);
      } catch (error) {
        console.error("Failed to fetch benefit limits", error);
        toast({
          title: 'ไม่สามารถโหลดข้อมูลวงเงินสวัสดิการได้',
          variant: 'destructive',
        });
      }
    };

    const fetchTrainingBudget = async () => {
      try {
        const { data, error } = await supabase
          .from('Employee')
          .select('Original_Budget_Training')
          .eq('email_user', user.email)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          setTrainingBudget(data.Original_Budget_Training);
          console.log('Fetched training budget:', data.Original_Budget_Training);
        }
      } catch (error) {
        console.error('Error fetching training budget:', error);
      }
    };

    // Initial fetch
    fetchRequests();
    fetchBenefitLimits();
    fetchTrainingBudget();

    // Create debounced version of fetchRequests with longer delay
    const debouncedFetchRequests = debounce(() => fetchRequests(true), 3000);

    // Set up real-time subscription for welfare_requests with debouncing
    const subscription = supabase
      .channel('welfare_requests_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'welfare_requests'
        },
        (payload) => {
          console.log('Real-time update received:', payload);

          // Only refresh if the change is significant
          if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
            const statusChanged = payload.new.status !== payload.old.status;
            const signatureChanged =
              payload.new.manager_signature !== payload.old.manager_signature ||
              payload.new.hr_signature !== payload.old.hr_signature;

            // Only fetch if status or signature changed
            if (statusChanged || signatureChanged) {
              console.log('Significant change detected, refreshing data...');
              debouncedFetchRequests();
            } else {
              console.log('Minor change detected, skipping refresh');
            }
          } else {
            // For INSERT/DELETE, always refresh
            debouncedFetchRequests();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchRequests, toast]);

  const getRequestsByUser = (userId: string) => {
    return welfareRequests.filter(request => request.userId === userId);
  };

  const getRequestsByStatus = (status: StatusType) => {
    return welfareRequests.filter(request => request.status === status);
  };

  const getRequestsByType = (type: WelfareType) => {
    return welfareRequests.filter(request => request.type === type);
  };

  const getWelfareLimit = (type: WelfareType) => {
    const limits = {
      dental: { amount: 2000, condition: "หลังทำงานครบ 180 วัน" },
      glasses: { amount: 2000, condition: "หลังทำงานครบ 180 วัน" },
      childbirth: {
        natural: 4000,
        caesarean: 6000,
        condition: "จำกัด 3 คนต่อครอบครัว"
      },
      training: { amount: trainingBudget },
      wedding: { amount: 3000 },
      medical: { amount: 1000 },
      fitness: { amount: 300, monthly: true, yearlyTotal: 3600 },
      funeral: { amount: null }
    };
    return limits[type] || { amount: 10000 };
  };

  const getRemainingBudget = (userId: string, type?: WelfareType) => {
    if (!type || !user || user.id !== userId) return 0;

    const limitInfo = benefitLimits.find(limit => limit.type === type);
    return limitInfo ? limitInfo.remaining : 0;
  };

  const submitRequest = async (requestData: Omit<WelfareRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    try {
      console.log('📥 WelfareContext - Received requestData:', requestData);
      console.log('📥 WelfareContext - Amount received:', requestData.amount, typeof requestData.amount);
      let managerId: number | null = null;
      if (user?.id) {
        try {
          const userId = parseInt(user.id, 10);
          if (!isNaN(userId)) {
            const { data: employeeData, error: employeeError } = await supabase
              .from('Employee')
              .select('manager_id')
              .eq('id', userId)
              .single();

            if (!employeeError && employeeData) {
              managerId = employeeData.manager_id as number;
            }
          }
        } catch (error) {
          console.error('Error fetching manager ID:', error);
        }
      }

      // Always save attachments as JSON string in attachment_url
      let attachmentsToSave: string = '[]';
      if (Array.isArray(requestData.attachments)) {
        attachmentsToSave = JSON.stringify(requestData.attachments);
      } else if (typeof requestData.attachments === 'string') {
        attachmentsToSave = JSON.stringify([requestData.attachments]);
      }
      // สร้าง object สำหรับ insert
      const requestDataObj = {
        employee_id: Number(requestData.userId),
        employee_name: requestData.userName,
        request_type: requestData.type,
        status: 'pending_manager',
        amount: requestData.amount,
        created_at: new Date().toISOString(),
        details: requestData.details,
        attachment_url: attachmentsToSave,
        // Store attachment checklist selections for PDF mapping
        attachment_selections: requestData.attachmentSelections
          ? JSON.stringify(requestData.attachmentSelections)
          : JSON.stringify({}),
        title: requestData.title,
        manager_id: managerId,
        start_date: requestData.start_date || null,
        end_date: requestData.end_date || null,
        total_days: requestData.total_days,
        birth_type: requestData.birth_type,
        training_topics: requestData.training_topics,
        total_amount: requestData.total_amount,
        tax7_percent: requestData.tax7_percent,
        withholding_tax3_percent: requestData.withholding_tax3_percent,
        net_amount: requestData.net_amount,
        excess_amount: requestData.excess_amount,
        company_payment: requestData.company_payment,
        employee_payment: requestData.employee_payment,
        course_name: requestData.course_name,
        organizer: requestData.organizer,
        is_vat_included: requestData.isVatIncluded,
        department_request: requestData.department_request,
        user_signature: requestData.userSignature, // บันทึกลายเซ็น

        // Advance payment specific fields
        advance_department: (requestData as any).advanceDepartment,
        advance_department_other: (requestData as any).advanceDepartmentOther,
        advance_district: (requestData as any).advanceDistrict,
        advance_activity_type: (requestData as any).advanceActivityType,
        advance_activity_other: (requestData as any).advanceActivityOther,
        advance_shop_company: (requestData as any).advanceShopCompany,
        advance_amphur: (requestData as any).advanceAmphur,
        advance_province: (requestData as any).advanceProvince,
        advance_event_date: (requestData as any).advanceEventDate || null,
        advance_participants: (requestData as any).advanceParticipants,
        advance_daily_rate: (requestData as any).advanceDailyRate,
        advance_accommodation_cost: (requestData as any).advanceAccommodationCost,
        advance_transportation_cost: (requestData as any).advanceTransportationCost,
        advance_meal_allowance: (requestData as any).advanceMealAllowance,
        advance_other_expenses: (requestData as any).advanceOtherExpenses,
        advance_project_name: (requestData as any).advanceProjectName,
        advance_project_location: (requestData as any).advanceProjectLocation,
        advance_expense_items: (requestData as any).advanceExpenseItems
          ? JSON.stringify((requestData as any).advanceExpenseItems)
          : null,
        advance_location: (requestData as any).advanceLocation,
        total_participants: (requestData as any).advanceParticipants,
        advance_dealer_name: (requestData as any).advanceDealerName,
        advance_subdealer_name: (requestData as any).advanceSubdealerName,
        // Add run number for advance and general-advance types
        run_number: (requestData.type === 'advance' || requestData.type === 'general-advance') ? (requestData as any).runNumber : null,

        // Expense clearing specific fields
        original_advance_request_id: (requestData as any).originalAdvanceRequestId,
        expense_clearing_items: (() => {
          const items = (requestData as any).expenseClearingItems;
          if (!items) return null;

          // Ensure it's an array before stringifying
          const itemsArray = Array.isArray(items) ? items : [items];
          console.log('🔍 Expense clearing items to save:', itemsArray);
          return JSON.stringify(itemsArray);
        })(),
      };
      // requestDataObj ไม่มี id อยู่แล้ว

      console.log('🔍 WelfareContext - Inserting data to Supabase:', requestDataObj);

      const { data, error } = await supabase
        .from('welfare_requests')
        .insert(requestDataObj)
        .select();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        console.error('❌ Error details:', error.details);
        console.error('❌ Error hint:', error.hint);
        console.error('❌ Error message:', error.message);
      }

      if (error) {
        throw new Error(error.message);
      }

      const newRequestId = data[0].id;
      const newRequest: WelfareRequest = {
        ...requestData,
        id: newRequestId,
        status: 'pending_manager',
        createdAt: data[0].created_at,
        managerId: managerId?.toString() || null
      };

      setWelfareRequests(prev => [newRequest, ...prev]);
      return newRequest;
    } catch (err: any) {
      toast({
        title: "ส่งคำร้องล้มเหลว",
        description: err.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateRequest = async (id: number, data: Partial<WelfareRequest>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('welfare_requests')
        .update(data)
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      setWelfareRequests(prev =>
        prev.map(req => req.id === id ? { ...req, ...data } : req)
      );
    } catch (err: any) {
      toast({
        title: "อัปเดตล้มเหลว",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateRequestStatus = async (id: number, status: StatusType, comment?: string) => {
    setIsLoading(true);
    try {
      const updateObj: any = { status };
      const currentDateTime = new Date().toISOString();

      // Get employee data from profile instead of using UUID
      if (user?.id) {
        // Fetch employee data from Employee table
        const { data: employeeData } = await supabase
          .from('Employee')
          .select('id, Name')
          .eq('auth_uid', user.id)
          .single();

        if (employeeData) {
          // Legacy fields for backward compatibility
          updateObj.approver_id = employeeData.id;
          updateObj.approver_at = currentDateTime;

          // New Manager approval fields
          updateObj.manager_approver_id = employeeData.id; // Employee ID (integer)
          updateObj.manager_approver_name = employeeData.Name;
          updateObj.manager_approved_at = currentDateTime;
        }
      }

      if (comment) updateObj.manager_notes = comment;

      const { data, error } = await supabase
        .from('welfare_requests')
        .update(updateObj)
        .eq('id', id)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      // Don't update local state immediately - let real-time subscription handle it
      // This prevents race conditions and duplicate entries

      return { success: true, data };
    } catch (err: any) {
      toast({ title: 'อัพเดทสถานะล้มเหลว', description: err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const value: WelfareContextType = {
    welfareRequests,
    getRequestsByUser,
    getRequestsByStatus,
    getRequestsByType,
    submitRequest,
    updateRequest,
    updateRequestStatus,
    refreshRequests: () => fetchRequests(true),
    isLoading,
    getWelfareLimit,
    getRemainingBudget,
    trainingBudget
  };

  return <WelfareContext.Provider value={value}>{children}</WelfareContext.Provider>;
};

export const useWelfare = (): WelfareContextType => {
  const context = useContext(WelfareContext);
  if (context === undefined) {
    throw new Error('useWelfare must be used within a WelfareProvider');
  }
  return context;
};
