import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ArrowLeft, FileText } from 'lucide-react';
import type { Template } from '@pdfme/common';
import type { PdfTemplate } from '@/types/pdfTemplate';
import {
  getAllPdfTemplates,
  createPdfTemplate,
  updatePdfTemplate,
  deletePdfTemplate,
  togglePdfTemplateStatus,
} from '@/services/pdfTemplateApi';
import {
  getBlankTemplate,
  getAdvancePaymentStarterTemplate,
  getAdvancePaymentSampleInput,
} from '@/utils/pdfmeConfig';
import { PdfTemplateDesigner } from '@/components/pdf-templates/PdfTemplateDesigner';
import { PdfTemplatePreview } from '@/components/pdf-templates/PdfTemplatePreview';
import { PdfTemplateList } from '@/components/pdf-templates/PdfTemplateList';

type ViewMode = 'list' | 'create' | 'designer' | 'edit';

interface TemplateFormData {
  name: string;
  description: string;
  form_type: string;
  starterTemplate: 'blank' | 'advance_payment';
}

const initialFormData: TemplateFormData = {
  name: '',
  description: '',
  form_type: 'custom',
  starterTemplate: 'blank',
};

export const PdfTemplateManagement = () => {
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);
  const [editingTemplate, setEditingTemplate] = useState<PdfTemplate | null>(null);
  const [designerTemplate, setDesignerTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<PdfTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getAllPdfTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStart = () => {
    setFormData(initialFormData);
    setEditingTemplate(null);
    setViewMode('create');
  };

  const handleCreateContinue = () => {
    if (!formData.name.trim()) {
      alert('กรุณากรอกชื่อเทมเพลต');
      return;
    }

    const starterTemplate =
      formData.starterTemplate === 'advance_payment'
        ? getAdvancePaymentStarterTemplate()
        : getBlankTemplate();

    setDesignerTemplate(starterTemplate);
    setViewMode('designer');
  };

  const handleEditStart = (template: PdfTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      form_type: template.form_type,
      starterTemplate: 'blank',
    });
    setDesignerTemplate(template.template_json);
    setViewMode('designer');
  };

  const handleDesignerSave = async (template: Template) => {
    try {
      const sampleInput =
        formData.starterTemplate === 'advance_payment' && !editingTemplate
          ? getAdvancePaymentSampleInput()
          : editingTemplate?.sample_input || null;

      if (editingTemplate) {
        await updatePdfTemplate({
          id: editingTemplate.id,
          name: formData.name,
          description: formData.description || null,
          form_type: formData.form_type,
          template_json: template,
          sample_input: sampleInput,
        });
      } else {
        await createPdfTemplate({
          name: formData.name,
          description: formData.description || null,
          form_type: formData.form_type,
          template_json: template,
          sample_input: sampleInput,
        });
      }

      await loadTemplates();
      setViewMode('list');
      setEditingTemplate(null);
      setDesignerTemplate(null);
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกเทมเพลต');
    }
  };

  const handleDesignerCancel = () => {
    if (confirm('คุณแน่ใจหรือไม่? การเปลี่ยนแปลงที่ยังไม่บันทึกจะหายไป')) {
      setViewMode('list');
      setEditingTemplate(null);
      setDesignerTemplate(null);
      setFormData(initialFormData);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePdfTemplate(id);
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('เกิดข้อผิดพลาดในการลบเทมเพลต');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await togglePdfTemplateStatus(id, !currentStatus);
      await loadTemplates();
    } catch (error) {
      console.error('Error toggling template status:', error);
    }
  };

  const handlePreview = (template: PdfTemplate) => {
    setPreviewTemplate(template);
  };

  // Designer view - full screen via portal (bypass sidebar stacking context)
  if (viewMode === 'designer' && designerTemplate) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-white" style={{ isolation: 'isolate' }}>
        <PdfTemplateDesigner
          template={designerTemplate}
          onSave={handleDesignerSave}
          onCancel={handleDesignerCancel}
        />
      </div>,
      document.body
    );
  }

  // Create form view
  if (viewMode === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">สร้างเทมเพลตใหม่</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลเทมเพลต</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อเทมเพลต *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น ใบเบิกเงินล่วงหน้า v2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">คำอธิบาย</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="คำอธิบายเทมเพลต (ไม่บังคับ)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="form_type">ประเภทฟอร์ม</Label>
                <Select
                  value={formData.form_type}
                  onValueChange={(value) => setFormData({ ...formData, form_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">กำหนดเอง</SelectItem>
                    <SelectItem value="advance">เบิกเงินล่วงหน้า</SelectItem>
                    <SelectItem value="general-advance">เบิกเงินล่วงหน้าทั่วไป</SelectItem>
                    <SelectItem value="expense-clearing">ปรับปรุงค่าใช้จ่าย</SelectItem>
                    <SelectItem value="welfare">สวัสดิการ</SelectItem>
                    <SelectItem value="leave">ใบลา</SelectItem>
                    <SelectItem value="training">การอบรม</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>เทมเพลตตั้งต้น</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setFormData({ ...formData, starterTemplate: 'blank' })}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.starterTemplate === 'blank'
                        ? 'border-[#004F9F] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="font-medium">เทมเพลตเปล่า</p>
                    <p className="text-sm text-gray-500">เริ่มจาก A4 เปล่า</p>
                  </div>
                  <div
                    onClick={() => setFormData({ ...formData, starterTemplate: 'advance_payment' })}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.starterTemplate === 'advance_payment'
                        ? 'border-[#004F9F] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="h-8 w-8 text-blue-500 mb-2" />
                    <p className="font-medium">ใบเบิกเงินล่วงหน้า</p>
                    <p className="text-sm text-gray-500">มี field ตั้งต้นพร้อมใช้</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateContinue}>
                  ถัดไป - เปิด Designer
                </Button>
                <Button variant="outline" onClick={() => setViewMode('list')}>
                  ยกเลิก
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view (default)
  if (loading) {
    return <div className="flex justify-center items-center h-64">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการเทมเพลต PDF</h1>
          <p className="text-gray-600">ออกแบบและจัดการเทมเพลต PDF แบบ drag-and-drop</p>
        </div>
        <Button onClick={handleCreateStart} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          สร้างเทมเพลตใหม่
        </Button>
      </div>

      <PdfTemplateList
        templates={templates}
        onEdit={handleEditStart}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        onPreview={handlePreview}
      />

      {previewTemplate && (
        <PdfTemplatePreview
          open={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          template={previewTemplate.template_json}
          sampleInput={previewTemplate.sample_input}
          templateName={previewTemplate.name}
        />
      )}
    </div>
  );
};
