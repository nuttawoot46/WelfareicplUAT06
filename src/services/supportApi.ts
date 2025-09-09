import { supabase } from '@/lib/supabase';
import { SupportTicket, SupportTicketComment, CreateTicketData, CreateCommentData } from '@/types';

class SupportApiService {
  // Create a new support ticket
  async createTicket(data: CreateTicketData): Promise<SupportTicket> {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('Error creating support ticket:', error);
      throw new Error('Failed to create support ticket');
    }

    return ticket;
  }

  // Get user's support tickets
  async getUserTickets(userId: string): Promise<SupportTicket[]> {
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user tickets:', error);
      throw new Error('Failed to fetch support tickets');
    }

    return tickets || [];
  }

  // Get all support tickets (admin only)
  async getAllTickets(): Promise<SupportTicket[]> {
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        profiles:user_id (
          display_name,
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all tickets:', error);
      throw new Error('Failed to fetch support tickets');
    }

    return tickets || [];
  }

  // Get a specific ticket by ID
  async getTicketById(ticketId: string): Promise<SupportTicket | null> {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        profiles:user_id (
          display_name,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', ticketId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Ticket not found
      }
      console.error('Error fetching ticket:', error);
      throw new Error('Failed to fetch support ticket');
    }

    return ticket;
  }

  // Update ticket status (admin only)
  async updateTicketStatus(
    ticketId: string, 
    status: SupportTicket['status'],
    resolution?: string
  ): Promise<SupportTicket> {
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
      if (resolution) {
        updateData.resolution = resolution;
      }
    }

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      console.error('Error updating ticket status:', error);
      throw new Error('Failed to update ticket status');
    }

    return ticket;
  }

  // Assign ticket to staff member (admin only)
  async assignTicket(ticketId: string, assignedTo: string): Promise<SupportTicket> {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .update({ 
        assigned_to: assignedTo,
        status: 'in-progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      console.error('Error assigning ticket:', error);
      throw new Error('Failed to assign ticket');
    }

    return ticket;
  }

  // Add comment to ticket
  async addComment(data: CreateCommentData): Promise<SupportTicketComment> {
    const { data: comment, error } = await supabase
      .from('support_ticket_comments')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }

    return comment;
  }

  // Get comments for a ticket
  async getTicketComments(ticketId: string): Promise<SupportTicketComment[]> {
    const { data: comments, error } = await supabase
      .from('support_ticket_comments')
      .select(`
        *,
        profiles:user_id (
          display_name,
          first_name,
          last_name,
          role
        )
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      throw new Error('Failed to fetch comments');
    }

    return comments || [];
  }

  // Get ticket statistics (admin only)
  async getTicketStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('status, category, priority');

    if (error) {
      console.error('Error fetching ticket stats:', error);
      throw new Error('Failed to fetch ticket statistics');
    }

    const stats = {
      total: tickets?.length || 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      byCategory: {} as Record<string, number>,
      byPriority: {} as Record<string, number>
    };

    tickets?.forEach(ticket => {
      // Count by status
      switch (ticket.status) {
        case 'open':
          stats.open++;
          break;
        case 'in-progress':
          stats.inProgress++;
          break;
        case 'resolved':
          stats.resolved++;
          break;
        case 'closed':
          stats.closed++;
          break;
      }

      // Count by category
      stats.byCategory[ticket.category] = (stats.byCategory[ticket.category] || 0) + 1;

      // Count by priority
      stats.byPriority[ticket.priority] = (stats.byPriority[ticket.priority] || 0) + 1;
    });

    return stats;
  }
}

export const supportApi = new SupportApiService();