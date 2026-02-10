import { supabase } from '@/integrations/supabase/client';
import type { PdfTemplate, CreatePdfTemplateData, UpdatePdfTemplateData } from '@/types/pdfTemplate';

export const getAllPdfTemplates = async (): Promise<PdfTemplate[]> => {
  const { data, error } = await supabase
    .from('pdf_templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as PdfTemplate[];
};

export const getPdfTemplateById = async (id: string): Promise<PdfTemplate> => {
  const { data, error } = await supabase
    .from('pdf_templates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as PdfTemplate;
};

export const createPdfTemplate = async (templateData: CreatePdfTemplateData): Promise<PdfTemplate> => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('pdf_templates')
    .insert({
      name: templateData.name,
      description: templateData.description || null,
      form_type: templateData.form_type,
      template_json: templateData.template_json as any,
      sample_input: templateData.sample_input as any || null,
      is_active: templateData.is_active ?? true,
      created_by: user?.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as PdfTemplate;
};

export const updatePdfTemplate = async (templateData: UpdatePdfTemplateData): Promise<PdfTemplate> => {
  const { id, version, ...rest } = templateData;
  const updatePayload: any = { ...rest };
  if (rest.template_json) updatePayload.template_json = rest.template_json;
  if (rest.sample_input) updatePayload.sample_input = rest.sample_input;

  const { data, error } = await supabase
    .from('pdf_templates')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as PdfTemplate;
};

export const deletePdfTemplate = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('pdf_templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const togglePdfTemplateStatus = async (id: string, is_active: boolean): Promise<PdfTemplate> => {
  const { data, error } = await supabase
    .from('pdf_templates')
    .update({ is_active })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as PdfTemplate;
};
