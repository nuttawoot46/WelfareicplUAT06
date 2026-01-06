import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  LeaveType,
  Holiday,
  LeaveBalance,
  LeaveRequest,
  LeaveStatusType,
  LeaveFormData,
  EmployeeLeaveDetail,
} from '@/types';

// =====================
// Leave Types
// =====================
export const getLeaveTypes = async (): Promise<LeaveType[]> => {
  try {
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .eq('is_active', true)
      .order('id');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching leave types:', error);
    toast.error('Failed to fetch leave types');
    return [];
  }
};

export const createLeaveType = async (leaveType: Partial<LeaveType>): Promise<LeaveType | null> => {
  try {
    const { data, error } = await supabase
      .from('leave_types')
      .insert(leaveType)
      .select()
      .single();

    if (error) throw error;
    toast.success('Leave type created successfully');
    return data;
  } catch (error) {
    console.error('Error creating leave type:', error);
    toast.error('Failed to create leave type');
    return null;
  }
};

export const updateLeaveType = async (id: number, updates: Partial<LeaveType>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('leave_types')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    toast.success('Leave type updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating leave type:', error);
    toast.error('Failed to update leave type');
    return false;
  }
};

// =====================
// Holidays
// =====================
export const getHolidays = async (year?: number, location?: string): Promise<Holiday[]> => {
  try {
    let query = supabase
      .from('holidays')
      .select('*')
      .eq('is_active', true)
      .order('date');

    if (year) {
      query = query.eq('year', year);
    }

    if (location && location !== 'All') {
      query = query.or(`location.eq.All,location.eq.${location}`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching holidays:', error);
    toast.error('Failed to fetch holidays');
    return [];
  }
};

export const createHoliday = async (holiday: Partial<Holiday>): Promise<Holiday | null> => {
  try {
    const { data, error } = await supabase
      .from('holidays')
      .insert(holiday)
      .select()
      .single();

    if (error) throw error;
    toast.success('Holiday created successfully');
    return data;
  } catch (error) {
    console.error('Error creating holiday:', error);
    toast.error('Failed to create holiday');
    return null;
  }
};

export const updateHoliday = async (id: number, updates: Partial<Holiday>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('holidays')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    toast.success('Holiday updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating holiday:', error);
    toast.error('Failed to update holiday');
    return false;
  }
};

export const deleteHoliday = async (id: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('holidays')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    toast.success('Holiday deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting holiday:', error);
    toast.error('Failed to delete holiday');
    return false;
  }
};

// =====================
// Leave Balances
// =====================
export const getLeaveBalances = async (employeeId: number, year?: number): Promise<LeaveBalance[]> => {
  try {
    const currentYear = year || new Date().getFullYear();

    const { data, error } = await supabase
      .from('leave_balances')
      .select(`
        *,
        leave_type:leave_types(*)
      `)
      .eq('employee_id', employeeId)
      .eq('year', currentYear);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching leave balances:', error);
    toast.error('Failed to fetch leave balances');
    return [];
  }
};

export const initializeLeaveBalances = async (employeeId: number, year?: number): Promise<boolean> => {
  try {
    const currentYear = year || new Date().getFullYear();
    const leaveTypes = await getLeaveTypes();

    const balances = leaveTypes.map((type) => ({
      employee_id: employeeId,
      leave_type_id: type.id,
      year: currentYear,
      total_days: type.max_days_per_year || 0,
      used_days: 0,
      used_hours: 0,
      used_minutes: 0,
      carry_over_days: 0,
    }));

    const { error } = await supabase
      .from('leave_balances')
      .upsert(balances, {
        onConflict: 'employee_id,leave_type_id,year',
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error initializing leave balances:', error);
    return false;
  }
};

export const updateLeaveBalance = async (
  employeeId: number,
  leaveTypeId: number,
  year: number,
  updates: Partial<LeaveBalance>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('leave_balances')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .eq('year', year);

    if (error) throw error;
    toast.success('Leave balance updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating leave balance:', error);
    toast.error('Failed to update leave balance');
    return false;
  }
};

// =====================
// Leave Requests
// =====================
export const getLeaveRequests = async (filters?: {
  employeeId?: number;
  status?: LeaveStatusType | LeaveStatusType[];
  startDate?: string;
  endDate?: string;
  managerId?: number;
  team?: string;
}): Promise<LeaveRequest[]> => {
  try {
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        leave_type:leave_types(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters?.startDate) {
      query = query.gte('start_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('end_date', filters.endDate);
    }

    if (filters?.managerId) {
      query = query.eq('manager_id', filters.managerId);
    }

    if (filters?.team) {
      query = query.eq('employee_team', filters.team);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    toast.error('Failed to fetch leave requests');
    return [];
  }
};

export const getLeaveRequestById = async (id: number): Promise<LeaveRequest | null> => {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        leave_type:leave_types(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching leave request:', error);
    toast.error('Failed to fetch leave request');
    return null;
  }
};

export const createLeaveRequest = async (
  employeeData: {
    id: number;
    name: string;
    email: string;
    position?: string;
    team?: string;
    manager_id?: number;
  },
  formData: LeaveFormData,
  leaveTypeName: string
): Promise<LeaveRequest | null> => {
  try {
    // Calculate total days
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    let totalDays = 0;

    if (formData.is_half_day) {
      totalDays = 0.5;
    } else {
      // Calculate working days (excluding weekends)
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          totalDays += 1;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Upload attachments if any
    const attachmentUrls: string[] = [];
    if (formData.attachments) {
      for (const file of Array.from(formData.attachments)) {
        const fileName = `leave-attachments/${employeeData.id}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(fileName);

        attachmentUrls.push(urlData.publicUrl);
      }
    }

    const requestData = {
      employee_id: employeeData.id,
      employee_name: employeeData.name,
      employee_email: employeeData.email,
      employee_position: employeeData.position,
      employee_team: employeeData.team,
      leave_type_id: formData.leave_type_id,
      leave_type_name: leaveTypeName,
      start_date: formData.start_date,
      end_date: formData.end_date,
      start_time: formData.start_time || '08:30:00',
      end_time: formData.end_time || '17:30:00',
      is_half_day: formData.is_half_day,
      half_day_period: formData.half_day_period,
      total_days: totalDays,
      reason: formData.reason,
      attachment_urls: attachmentUrls,
      user_signature: formData.user_signature,
      manager_id: employeeData.manager_id,
      status: 'pending_manager',
    };

    const { data, error } = await supabase
      .from('leave_requests')
      .insert(requestData)
      .select(`
        *,
        leave_type:leave_types(*)
      `)
      .single();

    if (error) throw error;

    toast.success('Leave request submitted successfully');
    return data;
  } catch (error) {
    console.error('Error creating leave request:', error);
    toast.error('Failed to submit leave request');
    return null;
  }
};

export const updateLeaveRequestStatus = async (
  id: number,
  status: LeaveStatusType,
  approverData: {
    approverId: number;
    approverName: string;
    signature?: string;
    comment?: string;
  },
  approverType: 'manager' | 'hr'
): Promise<boolean> => {
  try {
    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (approverType === 'manager') {
      updateData.manager_approval_status = status.includes('rejected') ? 'rejected' : 'approved';
      updateData.manager_approval_date = new Date().toISOString();
      updateData.manager_name = approverData.approverName;
      updateData.manager_signature = approverData.signature;
      updateData.manager_comment = approverData.comment;

      // If manager approved, move to HR
      if (!status.includes('rejected')) {
        updateData.status = 'pending_hr';
      }
    } else if (approverType === 'hr') {
      updateData.hr_approval_status = status.includes('rejected') ? 'rejected' : 'approved';
      updateData.hr_approval_date = new Date().toISOString();
      updateData.hr_approver_id = approverData.approverId;
      updateData.hr_approver_name = approverData.approverName;
      updateData.hr_signature = approverData.signature;
      updateData.hr_comment = approverData.comment;

      // If HR approved, complete the request
      if (!status.includes('rejected')) {
        updateData.status = 'completed';
      }
    }

    const { error } = await supabase
      .from('leave_requests')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    toast.success(`Leave request ${status.includes('rejected') ? 'rejected' : 'approved'} successfully`);
    return true;
  } catch (error) {
    console.error('Error updating leave request status:', error);
    toast.error('Failed to update leave request');
    return false;
  }
};

export const cancelLeaveRequest = async (id: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    toast.success('Leave request cancelled successfully');
    return true;
  } catch (error) {
    console.error('Error cancelling leave request:', error);
    toast.error('Failed to cancel leave request');
    return false;
  }
};

// =====================
// Calendar & Reports
// =====================
export const getLeaveCalendarEvents = async (
  year: number,
  month: number,
  filters?: {
    team?: string;
    location?: string;
  }
): Promise<{ leaves: LeaveRequest[]; holidays: Holiday[] }> => {
  try {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const startDate = startOfMonth.toISOString().split('T')[0];
    const endDate = endOfMonth.toISOString().split('T')[0];

    // Get approved leave requests for the month
    let leaveQuery = supabase
      .from('leave_requests')
      .select(`
        *,
        leave_type:leave_types(*)
      `)
      .in('status', ['pending_manager', 'pending_hr', 'completed'])
      .or(`start_date.gte.${startDate},end_date.lte.${endDate}`);

    if (filters?.team) {
      leaveQuery = leaveQuery.eq('employee_team', filters.team);
    }

    const { data: leaves, error: leaveError } = await leaveQuery;
    if (leaveError) throw leaveError;

    // Get holidays for the month
    let holidayQuery = supabase
      .from('holidays')
      .select('*')
      .eq('year', year)
      .eq('is_active', true)
      .gte('date', startDate)
      .lte('date', endDate);

    if (filters?.location && filters.location !== 'All') {
      holidayQuery = holidayQuery.or(`location.eq.All,location.eq.${filters.location}`);
    }

    const { data: holidays, error: holidayError } = await holidayQuery;
    if (holidayError) throw holidayError;

    return {
      leaves: leaves || [],
      holidays: holidays || [],
    };
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    toast.error('Failed to fetch calendar events');
    return { leaves: [], holidays: [] };
  }
};

export const getEmployeeLeaveDetail = async (employeeId: number): Promise<EmployeeLeaveDetail | null> => {
  try {
    // Get employee data
    const { data: employee, error: empError } = await supabase
      .from('Employee')
      .select('id, Name, Position, email_user')
      .eq('id', employeeId)
      .single();

    if (empError) throw empError;

    // Get leave balances
    const balances = await getLeaveBalances(employeeId);

    return {
      employee: {
        id: employee.id,
        name: employee.Name || '',
        position: employee.Position || '',
        email: employee.email_user || '',
      },
      balances,
    };
  } catch (error) {
    console.error('Error fetching employee leave detail:', error);
    toast.error('Failed to fetch employee leave detail');
    return null;
  }
};

// =====================
// Utility Functions
// =====================
export const checkLeaveConflict = async (
  employeeId: number,
  startDate: string,
  endDate: string,
  excludeRequestId?: number
): Promise<LeaveRequest[]> => {
  try {
    let query = supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', employeeId)
      .in('status', ['pending_manager', 'pending_hr', 'completed'])
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

    if (excludeRequestId) {
      query = query.neq('id', excludeRequestId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error checking leave conflict:', error);
    return [];
  }
};

export const isHoliday = async (date: string, location?: string): Promise<boolean> => {
  try {
    let query = supabase
      .from('holidays')
      .select('id')
      .eq('date', date)
      .eq('is_active', true);

    if (location && location !== 'All') {
      query = query.or(`location.eq.All,location.eq.${location}`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking holiday:', error);
    return false;
  }
};

export const calculateWorkingDays = async (
  startDate: string,
  endDate: string,
  location?: string
): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('calculate_working_days', {
      p_start_date: startDate,
      p_end_date: endDate,
      location_filter: location || 'All',
    });

    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('Error calculating working days:', error);
    // Fallback to simple calculation without holidays
    let workingDays = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    let current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays += 1;
      }
      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  }
};

// Format leave balance display (e.g., "4 D - 4 h - 30 m")
export const formatLeaveBalance = (days: number, hours: number = 0, minutes: number = 0): string => {
  return `${Math.floor(days)} D - ${hours} h - ${minutes} m`;
};

// Calculate percentage used for progress bar
export const calculateUsagePercentage = (used: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((used / total) * 100);
};

// Get relative time (e.g., "352 Days Ago", "11 Days")
export const getRelativeTime = (date: string): string => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} Days Ago`;
  } else if (diffDays === 0) {
    return 'Today';
  } else {
    return `${diffDays} Days`;
  }
};
