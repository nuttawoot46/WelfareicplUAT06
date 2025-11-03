import { supabase } from '@/lib/supabase';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  type: 'system' | 'welfare' | 'training' | 'general';
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  youtube_embed_url: string | null;
  generated_html_content: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  type: 'system' | 'welfare' | 'training' | 'general';
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  youtube_embed_url?: string | null;
  generated_html_content?: string | null;
}

export interface UpdateAnnouncementData extends Partial<CreateAnnouncementData> {
  id: string;
}

// Get all active announcements for dashboard
export const getActiveAnnouncements = async (): Promise<Announcement[]> => {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', new Date().toISOString().split('T')[0])
    .or(`end_date.is.null,end_date.gte.${new Date().toISOString().split('T')[0]}`)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active announcements:', error);
    throw error;
  }

  return data || [];
};

// Get all announcements for admin management
export const getAllAnnouncements = async (): Promise<Announcement[]> => {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all announcements:', error);
    throw error;
  }

  return data || [];
};

// Create new announcement
export const createAnnouncement = async (announcementData: CreateAnnouncementData): Promise<Announcement> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      ...announcementData,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }

  return data;
};

// Update announcement
export const updateAnnouncement = async (announcementData: UpdateAnnouncementData): Promise<Announcement> => {
  const { id, ...updateData } = announcementData;
  
  const { data, error } = await supabase
    .from('announcements')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating announcement:', error);
    throw error;
  }

  return data;
};

// Delete announcement
export const deleteAnnouncement = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
};

// Toggle announcement active status
export const toggleAnnouncementStatus = async (id: string, is_active: boolean): Promise<Announcement> => {
  const { data, error } = await supabase
    .from('announcements')
    .update({ is_active })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error toggling announcement status:', error);
    throw error;
  }

  return data;
};