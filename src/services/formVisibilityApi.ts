import { supabase } from '@/lib/supabase';

// Available roles in the system
export const AVAILABLE_ROLES = [
  { value: 'employee', label: 'พนักงาน' },
  { value: 'manager', label: 'หัวหน้า' },
  { value: 'hr', label: 'HR' },
  { value: 'accounting', label: 'บัญชี' },
  { value: 'accountingandmanager', label: 'บัญชีและหัวหน้า' },
  { value: 'admin', label: 'ผู้ดูแลระบบ' },
] as const;

export type RoleType = typeof AVAILABLE_ROLES[number]['value'];

export interface FormVisibility {
  id: string;
  form_type: string;
  is_visible: boolean;
  allowed_roles: RoleType[]; // Roles that can see this form
  updated_at: string;
  updated_by: string | null;
}

export const getFormVisibility = async (): Promise<FormVisibility[]> => {
  const { data, error } = await supabase
    .from('form_visibility')
    .select('*')
    .order('form_type');

  if (error) throw error;
  return data || [];
};

export const updateFormVisibility = async (
  formType: string,
  isVisible: boolean
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  console.log('Updating form visibility:', { formType, isVisible, userId: user?.id });

  const { data, error } = await supabase
    .from('form_visibility')
    .update({
      is_visible: isVisible,
      updated_at: new Date().toISOString(),
      updated_by: user?.id
    })
    .eq('form_type', formType)
    .select();

  console.log('Update result:', { data, error });

  if (error) {
    console.error('Update error details:', error);
    throw error;
  }
};

export const updateFormAllowedRoles = async (
  formType: string,
  allowedRoles: RoleType[]
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  console.log('Updating form allowed roles:', { formType, allowedRoles, userId: user?.id });

  const { data, error } = await supabase
    .from('form_visibility')
    .update({
      allowed_roles: allowedRoles,
      updated_at: new Date().toISOString(),
      updated_by: user?.id
    })
    .eq('form_type', formType)
    .select();

  console.log('Update result:', { data, error });

  if (error) {
    console.error('Update error details:', error);
    throw error;
  }
};

export const isFormVisible = async (formType: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('form_visibility')
    .select('is_visible')
    .eq('form_type', formType)
    .single();

  if (error) {
    console.error('Error checking form visibility:', error);
    return true; // Default to visible if error
  }

  return data?.is_visible ?? true;
};
