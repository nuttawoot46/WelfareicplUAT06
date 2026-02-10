import { useState, useEffect } from 'react';
import { generate } from '@pdfme/generator';
import type { Template } from '@pdfme/common';
import { getPdfmeFonts, getPdfmePlugins } from '@/utils/pdfmeConfig';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface PdfTemplatePreviewProps {
  open: boolean;
  onClose: () => void;
  template: Template;
  sampleInput: Record<string, string>[] | null;
  templateName: string;
}

export const PdfTemplatePreview = ({
  open,
  onClose,
  template,
  sampleInput,
  templateName,
}: PdfTemplatePreviewProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && template) {
      generatePreview();
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    };
  }, [open, template, sampleInput]);

  const generatePreview = async () => {
    setGenerating(true);
    setError(null);

    try {
      const font = getPdfmeFonts();
      const plugins = getPdfmePlugins();

      const inputs = sampleInput || [buildEmptyInputs(template)];

      const pdf = await generate({
        template,
        inputs,
        options: { font },
        plugins,
      });

      const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err: any) {
      console.error('Error generating PDF preview:', err);
      setError(err.message || 'ไม่สามารถสร้าง PDF ตัวอย่างได้');
    } finally {
      setGenerating(false);
    }
  };

  const buildEmptyInputs = (tmpl: Template): Record<string, string> => {
    const inputs: Record<string, string> = {};
    if (tmpl.schemas && tmpl.schemas.length > 0) {
      for (const schema of tmpl.schemas) {
        if (Array.isArray(schema)) {
          for (const field of schema) {
            const name = (field as any).name || '';
            if (name) {
              inputs[name] = (field as any).content || name;
            }
          }
        }
      }
    }
    return inputs;
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${templateName || 'template'}-preview.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>ตัวอย่าง PDF: {templateName}</span>
            {pdfUrl && (
              <Button size="sm" variant="outline" onClick={handleDownload} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                ดาวน์โหลด
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden rounded-lg border bg-gray-100">
          {generating && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-[#004F9F]" />
              <span className="ml-2 text-gray-600">กำลังสร้าง PDF...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-600 mb-2">{error}</p>
                <Button size="sm" onClick={generatePreview}>
                  ลองใหม่
                </Button>
              </div>
            </div>
          )}

          {pdfUrl && !generating && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
