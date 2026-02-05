import { supabase } from '@/lib/supabase';
import { AuditLog, CreateAuditLogData } from '@/types';

export interface AuditLogFilters {
  category?: string;
  severity?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  department?: string;
  limit?: number;
  offset?: number;
}

class AuditLogApiService {

  // Create a new audit log entry (non-blocking: returns null on error)
  async createLog(data: CreateAuditLogData): Promise<AuditLog | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get employee info for richer logging
      let employeeData: { Name: string | null; Team: string | null; Role: string | null } | null = null;
      if (user?.id) {
        const { data: emp } = await supabase
          .from('Employee')
          .select('Name, Team, Role')
          .eq('auth_uid', user.id)
          .single();
        employeeData = emp;
      }

      const logEntry = {
        user_id: user?.id || null,
        user_email: user?.email || null,
        user_name: employeeData?.Name || null,
        user_role: employeeData?.Role || null,
        action: data.action,
        category: data.category,
        severity: data.severity || 'low',
        status: data.status || 'success',
        details: data.details || null,
        resource_type: data.resource_type || null,
        resource_id: data.resource_id || null,
        metadata: data.metadata || {},
        ip_address: null,
        user_agent: navigator.userAgent,
        department: data.department || employeeData?.Team || null,
      };

      const { data: log, error } = await supabase
        .from('audit_logs')
        .insert([logEntry])
        .select()
        .single();

      if (error) {
        console.error('Error creating audit log:', error);
        return null;
      }

      return log;
    } catch (error) {
      console.error('Error creating audit log:', error);
      return null;
    }
  }

  // Get audit logs with server-side filters
  async getLogs(filters: AuditLogFilters = {}): Promise<{ data: AuditLog[]; count: number }> {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    if (filters.severity && filters.severity !== 'all') {
      query = query.eq('severity', filters.severity);
    }
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.department) {
      query = query.eq('department', filters.department);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters.search) {
      query = query.or(
        `user_name.ilike.%${filters.search}%,user_email.ilike.%${filters.search}%,action.ilike.%${filters.search}%,details.ilike.%${filters.search}%`
      );
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      throw new Error('Failed to fetch audit logs');
    }

    return { data: (data as AuditLog[]) || [], count: count || 0 };
  }

  // Get logs scoped for a specific user
  async getUserLogs(userId: string, filters: AuditLogFilters = {}): Promise<{ data: AuditLog[]; count: number }> {
    return this.getLogs({ ...filters, userId });
  }

  // Get logs scoped for a department
  async getDepartmentLogs(department: string, filters: AuditLogFilters = {}): Promise<{ data: AuditLog[]; count: number }> {
    return this.getLogs({ ...filters, department });
  }

  // Get logs scoped by categories
  async getLogsByCategories(
    categories: string[],
    filters: AuditLogFilters = {}
  ): Promise<{ data: AuditLog[]; count: number }> {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    query = query.in('category', categories);

    if (filters.severity && filters.severity !== 'all') {
      query = query.eq('severity', filters.severity);
    }
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.search) {
      query = query.or(
        `user_name.ilike.%${filters.search}%,user_email.ilike.%${filters.search}%,action.ilike.%${filters.search}%,details.ilike.%${filters.search}%`
      );
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching audit logs by categories:', error);
      throw new Error('Failed to fetch audit logs');
    }

    return { data: (data as AuditLog[]) || [], count: count || 0 };
  }
}

export const auditLogApi = new AuditLogApiService();
