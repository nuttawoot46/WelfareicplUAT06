import type { Template } from '@pdfme/common';

export interface PdfTemplate {
  id: string;
  name: string;
  description: string | null;
  form_type: string;
  template_json: Template;
  sample_input: Record<string, string>[] | null;
  is_active: boolean;
  version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePdfTemplateData {
  name: string;
  description?: string | null;
  form_type: string;
  template_json: Template;
  sample_input?: Record<string, string>[] | null;
  is_active?: boolean;
}

export interface UpdatePdfTemplateData extends Partial<CreatePdfTemplateData> {
  id: string;
  version?: number;
}
