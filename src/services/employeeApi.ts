import { supabase } from '@/lib/supabase';
export interface SimpleEmployee {
  id: number;
  Name: string | null;
  Team: string | null;
}

export async function fetchAllEmployees(): Promise<SimpleEmployee[]> {
  const { data, error } = await supabase
    .from('Employee')
    .select('id, Name, Team')
    .order('Name', { ascending: true });
  if (error) throw error;
  return data as SimpleEmployee[];
}
