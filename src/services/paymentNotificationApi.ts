import { supabase } from '@/lib/supabase';
import { PaymentNotification } from '@/types';

class PaymentNotificationApiService {
  generateRunNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `PMT${year}${month}${timestamp}`;
  }

  async createNotification(data: Omit<PaymentNotification, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentNotification> {
    const { data: notification, error } = await supabase
      .from('payment_notifications' as any)
      .insert([{
        ...data,
        document_numbers: JSON.stringify(data.document_numbers),
        attachment_urls: JSON.stringify(data.attachment_urls),
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating payment notification:', error);
      throw new Error(`ไม่สามารถบันทึกข้อมูลได้: ${error.message}`);
    }
    return this.parseNotification(notification);
  }

  async getMyNotifications(employeeId: number): Promise<PaymentNotification[]> {
    const { data, error } = await supabase
      .from('payment_notifications' as any)
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my notifications:', error);
      throw new Error('ไม่สามารถดึงข้อมูลได้');
    }
    return (data || []).map(this.parseNotification);
  }

  async getAllNotifications(filters?: {
    team?: string;
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
  }): Promise<PaymentNotification[]> {
    let query = supabase
      .from('payment_notifications' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.team) {
      query = query.eq('team', filters.team);
    }
    if (filters?.dateFrom) {
      query = query.gte('payment_date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('payment_date', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching all notifications:', error);
      throw new Error('ไม่สามารถดึงข้อมูลได้');
    }

    let result = (data || []).map(this.parseNotification);

    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(n =>
        n.customer_name.toLowerCase().includes(term) ||
        n.employee_name.toLowerCase().includes(term) ||
        (n.run_number && n.run_number.toLowerCase().includes(term))
      );
    }

    return result;
  }

  async deleteNotification(id: number): Promise<void> {
    const { error } = await supabase
      .from('payment_notifications' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting payment notification:', error);
      throw new Error('ไม่สามารถลบข้อมูลได้');
    }
  }

  private parseNotification(row: any): PaymentNotification {
    return {
      ...row,
      document_numbers: typeof row.document_numbers === 'string'
        ? JSON.parse(row.document_numbers)
        : row.document_numbers || [],
      attachment_urls: typeof row.attachment_urls === 'string'
        ? JSON.parse(row.attachment_urls)
        : row.attachment_urls || [],
    };
  }
}

export const paymentNotificationApi = new PaymentNotificationApiService();
