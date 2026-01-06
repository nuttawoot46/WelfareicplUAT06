import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  LeaveType,
  Holiday,
  LeaveBalance,
  LeaveRequest,
  LeaveStatusType,
  LeaveFormData,
  EmployeeLeaveDetail,
} from '@/types';
import * as leaveApi from '@/services/leaveApi';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LeaveContextType {
  // Data
  leaveTypes: LeaveType[];
  holidays: Holiday[];
  leaveBalances: LeaveBalance[];
  leaveRequests: LeaveRequest[];
  currentYear: number;
  currentMonth: number;
  selectedLocation: 'All' | 'Office' | 'Factory';
  selectedTeam: string;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;

  // Actions
  setCurrentYear: (year: number) => void;
  setCurrentMonth: (month: number) => void;
  setSelectedLocation: (location: 'All' | 'Office' | 'Factory') => void;
  setSelectedTeam: (team: string) => void;

  // Data fetching
  refreshLeaveTypes: () => Promise<void>;
  refreshHolidays: () => Promise<void>;
  refreshLeaveBalances: () => Promise<void>;
  refreshLeaveRequests: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // Leave requests
  submitLeaveRequest: (formData: LeaveFormData) => Promise<LeaveRequest | null>;
  cancelLeaveRequest: (id: number) => Promise<boolean>;
  approveLeaveRequest: (
    id: number,
    signature?: string,
    comment?: string
  ) => Promise<boolean>;
  rejectLeaveRequest: (id: number, comment?: string) => Promise<boolean>;

  // Helpers
  getLeaveBalance: (leaveTypeId: number) => LeaveBalance | undefined;
  getRemainingDays: (leaveTypeId: number) => number;
  checkLeaveConflict: (startDate: string, endDate: string, excludeId?: number) => Promise<LeaveRequest[]>;
  getCalendarEvents: () => Promise<{
    leaves: LeaveRequest[];
    holidays: Holiday[];
  }>;
  getEmployeeDetail: () => Promise<EmployeeLeaveDetail | null>;

  // Pending requests for managers
  getPendingManagerRequests: () => LeaveRequest[];
  getPendingHRRequests: () => LeaveRequest[];
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export const LeaveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [selectedLocation, setSelectedLocation] = useState<'All' | 'Office' | 'Factory'>('All');
  const [selectedTeam, setSelectedTeam] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Get employee ID from profile (numeric ID from Employee table, not auth UUID)
  const getEmployeeId = useCallback((): number | null => {
    if (!profile) return null;
    // employee_id is the numeric ID from the Employee table
    // id is the auth UUID - we need employee_id for leave_balances/leave_requests
    const employeeId = (profile as any).employee_id;
    if (employeeId && typeof employeeId === 'number') {
      return employeeId;
    }
    // Fallback: try to get 'id' if it looks like a number
    const profileId = (profile as any).id;
    if (profileId && typeof profileId === 'number') {
      return profileId;
    }
    console.warn('LeaveContext: Could not find numeric employee_id in profile', profile);
    return null;
  }, [profile]);

  // Fetch leave types
  const refreshLeaveTypes = useCallback(async () => {
    const types = await leaveApi.getLeaveTypes();
    setLeaveTypes(types);
  }, []);

  // Fetch holidays
  const refreshHolidays = useCallback(async () => {
    const holidayData = await leaveApi.getHolidays(currentYear, selectedLocation);
    setHolidays(holidayData);
  }, [currentYear, selectedLocation]);

  // Fetch leave balances
  const refreshLeaveBalances = useCallback(async () => {
    const employeeId = getEmployeeId();
    if (!employeeId) return;

    const balances = await leaveApi.getLeaveBalances(employeeId, currentYear);

    // If no balances exist, initialize them
    if (balances.length === 0) {
      await leaveApi.initializeLeaveBalances(employeeId, currentYear);
      const newBalances = await leaveApi.getLeaveBalances(employeeId, currentYear);
      setLeaveBalances(newBalances);
    } else {
      setLeaveBalances(balances);
    }
  }, [currentYear, getEmployeeId]);

  // Fetch leave requests
  const refreshLeaveRequests = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchTime < CACHE_DURATION) {
      return;
    }

    setIsLoading(true);
    try {
      const employeeId = getEmployeeId();
      const userRole = (profile as any)?.Role;

      let requests: LeaveRequest[] = [];

      // Fetch based on user role
      if (userRole === 'hr' || userRole === 'admin' || userRole === 'superadmin') {
        // HR and admins can see all requests
        requests = await leaveApi.getLeaveRequests();
      } else if (userRole === 'manager') {
        // Managers see their team's requests and their own
        const [managerRequests, ownRequests] = await Promise.all([
          leaveApi.getLeaveRequests({ managerId: employeeId! }),
          leaveApi.getLeaveRequests({ employeeId: employeeId! }),
        ]);
        requests = [...managerRequests, ...ownRequests];
        // Remove duplicates
        requests = requests.filter(
          (req, index, self) => index === self.findIndex((r) => r.id === req.id)
        );
      } else if (employeeId) {
        // Regular employees see only their own
        requests = await leaveApi.getLeaveRequests({ employeeId });
      }

      setLeaveRequests(requests);
      setLastFetchTime(now);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getEmployeeId, lastFetchTime, profile]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        refreshLeaveTypes(),
        refreshHolidays(),
        refreshLeaveBalances(),
        refreshLeaveRequests(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [refreshLeaveTypes, refreshHolidays, refreshLeaveBalances, refreshLeaveRequests]);

  // Initial data load
  useEffect(() => {
    if (user && profile) {
      refreshAll();
    }
  }, [user, profile, refreshAll]);

  // Refresh when year/month/location changes
  useEffect(() => {
    if (user && profile) {
      refreshHolidays();
    }
  }, [currentYear, selectedLocation, user, profile, refreshHolidays]);

  // Submit leave request
  const submitLeaveRequest = useCallback(
    async (formData: LeaveFormData): Promise<LeaveRequest | null> => {
      const employeeId = getEmployeeId();
      if (!employeeId || !profile) {
        toast({
          title: 'Error',
          description: 'User profile not found',
          variant: 'destructive',
        });
        return null;
      }

      setIsSubmitting(true);
      try {
        const leaveType = leaveTypes.find((t) => t.id === formData.leave_type_id);
        if (!leaveType) {
          toast({
            title: 'Error',
            description: 'Invalid leave type',
            variant: 'destructive',
          });
          return null;
        }

        const employeeData = {
          id: employeeId,
          name: (profile as any).Name || '',
          email: (profile as any).email_user || '',
          position: (profile as any).Position || '',
          team: (profile as any).Team || '',
          manager_id: (profile as any).manager_id,
        };

        const request = await leaveApi.createLeaveRequest(
          employeeData,
          formData,
          `${leaveType.name_en} (${leaveType.name_th})`
        );

        if (request) {
          setLeaveRequests((prev) => [request, ...prev]);
          await refreshLeaveBalances();
        }

        return request;
      } finally {
        setIsSubmitting(false);
      }
    },
    [getEmployeeId, profile, leaveTypes, toast, refreshLeaveBalances]
  );

  // Cancel leave request
  const cancelLeaveRequest = useCallback(
    async (id: number): Promise<boolean> => {
      const success = await leaveApi.cancelLeaveRequest(id);
      if (success) {
        setLeaveRequests((prev) =>
          prev.map((req) =>
            req.id === id ? { ...req, status: 'cancelled' as LeaveStatusType } : req
          )
        );
        await refreshLeaveBalances();
      }
      return success;
    },
    [refreshLeaveBalances]
  );

  // Approve leave request
  const approveLeaveRequest = useCallback(
    async (id: number, signature?: string, comment?: string): Promise<boolean> => {
      const employeeId = getEmployeeId();
      const userRole = (profile as any)?.Role;
      const userName = (profile as any)?.Name || '';

      if (!employeeId) return false;

      const request = leaveRequests.find((r) => r.id === id);
      if (!request) return false;

      let approverType: 'manager' | 'hr';
      let newStatus: LeaveStatusType;

      if (request.status === 'pending_manager') {
        approverType = 'manager';
        newStatus = 'pending_hr';
      } else if (request.status === 'pending_hr' && (userRole === 'hr' || userRole === 'admin')) {
        approverType = 'hr';
        newStatus = 'completed';
      } else {
        toast({
          title: 'Error',
          description: 'You are not authorized to approve this request',
          variant: 'destructive',
        });
        return false;
      }

      const success = await leaveApi.updateLeaveRequestStatus(
        id,
        newStatus,
        {
          approverId: employeeId,
          approverName: userName,
          signature,
          comment,
        },
        approverType
      );

      if (success) {
        setLeaveRequests((prev) =>
          prev.map((req) =>
            req.id === id
              ? {
                  ...req,
                  status: newStatus,
                  ...(approverType === 'manager'
                    ? {
                        manager_approval_status: 'approved',
                        manager_approval_date: new Date().toISOString(),
                        manager_name: userName,
                        manager_signature: signature,
                        manager_comment: comment,
                      }
                    : {
                        hr_approval_status: 'approved',
                        hr_approval_date: new Date().toISOString(),
                        hr_approver_name: userName,
                        hr_signature: signature,
                        hr_comment: comment,
                      }),
                }
              : req
          )
        );
      }

      return success;
    },
    [getEmployeeId, profile, leaveRequests, toast]
  );

  // Reject leave request
  const rejectLeaveRequest = useCallback(
    async (id: number, comment?: string): Promise<boolean> => {
      const employeeId = getEmployeeId();
      const userRole = (profile as any)?.Role;
      const userName = (profile as any)?.Name || '';

      if (!employeeId) return false;

      const request = leaveRequests.find((r) => r.id === id);
      if (!request) return false;

      let approverType: 'manager' | 'hr';
      let newStatus: LeaveStatusType;

      if (request.status === 'pending_manager') {
        approverType = 'manager';
        newStatus = 'rejected_manager';
      } else if (request.status === 'pending_hr' && (userRole === 'hr' || userRole === 'admin')) {
        approverType = 'hr';
        newStatus = 'rejected_hr';
      } else {
        toast({
          title: 'Error',
          description: 'You are not authorized to reject this request',
          variant: 'destructive',
        });
        return false;
      }

      const success = await leaveApi.updateLeaveRequestStatus(
        id,
        newStatus,
        {
          approverId: employeeId,
          approverName: userName,
          comment,
        },
        approverType
      );

      if (success) {
        setLeaveRequests((prev) =>
          prev.map((req) =>
            req.id === id ? { ...req, status: newStatus } : req
          )
        );
      }

      return success;
    },
    [getEmployeeId, profile, leaveRequests, toast]
  );

  // Get leave balance for a specific type
  const getLeaveBalance = useCallback(
    (leaveTypeId: number): LeaveBalance | undefined => {
      return leaveBalances.find((b) => b.leave_type_id === leaveTypeId);
    },
    [leaveBalances]
  );

  // Get remaining days for a leave type
  const getRemainingDays = useCallback(
    (leaveTypeId: number): number => {
      const balance = getLeaveBalance(leaveTypeId);
      return balance?.remaining_days || 0;
    },
    [getLeaveBalance]
  );

  // Check for leave conflicts
  const checkLeaveConflict = useCallback(
    async (startDate: string, endDate: string, excludeId?: number): Promise<LeaveRequest[]> => {
      const employeeId = getEmployeeId();
      if (!employeeId) return [];
      return await leaveApi.checkLeaveConflict(employeeId, startDate, endDate, excludeId);
    },
    [getEmployeeId]
  );

  // Get calendar events
  const getCalendarEvents = useCallback(async () => {
    return await leaveApi.getLeaveCalendarEvents(currentYear, currentMonth, {
      team: selectedTeam !== 'All' ? selectedTeam : undefined,
      location: selectedLocation,
    });
  }, [currentYear, currentMonth, selectedTeam, selectedLocation]);

  // Get employee detail
  const getEmployeeDetail = useCallback(async (): Promise<EmployeeLeaveDetail | null> => {
    const employeeId = getEmployeeId();
    if (!employeeId) return null;
    return await leaveApi.getEmployeeLeaveDetail(employeeId);
  }, [getEmployeeId]);

  // Get pending requests for managers
  const getPendingManagerRequests = useCallback((): LeaveRequest[] => {
    const employeeId = getEmployeeId();
    return leaveRequests.filter(
      (req) => req.status === 'pending_manager' && req.manager_id === employeeId
    );
  }, [leaveRequests, getEmployeeId]);

  // Get pending requests for HR
  const getPendingHRRequests = useCallback((): LeaveRequest[] => {
    return leaveRequests.filter((req) => req.status === 'pending_hr');
  }, [leaveRequests]);

  const value: LeaveContextType = {
    leaveTypes,
    holidays,
    leaveBalances,
    leaveRequests,
    currentYear,
    currentMonth,
    selectedLocation,
    selectedTeam,
    isLoading,
    isSubmitting,
    setCurrentYear,
    setCurrentMonth,
    setSelectedLocation,
    setSelectedTeam,
    refreshLeaveTypes,
    refreshHolidays,
    refreshLeaveBalances,
    refreshLeaveRequests,
    refreshAll,
    submitLeaveRequest,
    cancelLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    getLeaveBalance,
    getRemainingDays,
    checkLeaveConflict,
    getCalendarEvents,
    getEmployeeDetail,
    getPendingManagerRequests,
    getPendingHRRequests,
  };

  return <LeaveContext.Provider value={value}>{children}</LeaveContext.Provider>;
};

export const useLeave = (): LeaveContextType => {
  const context = useContext(LeaveContext);
  if (context === undefined) {
    throw new Error('useLeave must be used within a LeaveProvider');
  }
  return context;
};
