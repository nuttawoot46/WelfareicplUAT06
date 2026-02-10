import { useState } from 'react';
import type { PdfTemplate } from '@/types/pdfTemplate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, EyeOff, FileText, Calendar } from 'lucide-react';

interface PdfTemplateListProps {
  templates: PdfTemplate[];
  onEdit: (template: PdfTemplate) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onPreview: (template: PdfTemplate) => void;
}

const formTypeLabels: Record<string, string> = {
  custom: 'กำหนดเอง',
  advance: 'เบิกเงินล่วงหน้า',
  'general-advance': 'เบิกเงินล่วงหน้าทั่วไป',
  'expense-clearing': 'ปรับปรุงค่าใช้จ่าย',
  welfare: 'สวัสดิการ',
  leave: 'ใบลา',
  training: 'การอบรม',
};

export const PdfTemplateList = ({
  templates,
  onEdit,
  onDelete,
  onToggleStatus,
  onPreview,
}: PdfTemplateListProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบเทมเพลตนี้?')) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">ยังไม่มีเทมเพลตในระบบ</p>
          <p className="text-gray-400 text-sm mt-1">กดปุ่ม "สร้างเทมเพลตใหม่" เพื่อเริ่มต้น</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {templates.map((template) => (
        <Card
          key={template.id}
          className={`transition-opacity ${!template.is_active ? 'opacity-60' : ''}`}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                  <Badge className="bg-blue-100 text-blue-800">
                    {formTypeLabels[template.form_type] || template.form_type}
                  </Badge>
                  <Badge className={`text-xs ${template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {template.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    v{template.version}
                  </Badge>
                </div>

                {template.description && (
                  <p className="text-gray-600 text-sm mb-2">{template.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    สร้างเมื่อ {new Date(template.created_at).toLocaleDateString('th-TH')}
                  </span>
                  {template.updated_at !== template.created_at && (
                    <span>
                      แก้ไขล่าสุด {new Date(template.updated_at).toLocaleDateString('th-TH')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPreview(template)}
                  title="ดูตัวอย่าง"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onToggleStatus(template.id, template.is_active)}
                  title={template.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                >
                  {template.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(template)}
                  title="แก้ไข"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(template.id)}
                  disabled={deletingId === template.id}
                  title="ลบ"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
