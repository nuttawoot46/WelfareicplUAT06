import { useRef, useEffect, useCallback, useState } from 'react';
import { Designer } from '@pdfme/ui';
import type { Template, Schema } from '@pdfme/common';
import { getPdfmeFonts, getPdfmePlugins } from '@/utils/pdfmeConfig';
import {
  Type,
  Image,
  Minus,
  Square,
  Circle,
  Table2,
  QrCode,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PdfTemplateDesignerProps {
  template: Template;
  onSave: (template: Template) => void;
  onCancel: () => void;
}

interface ToolbarItem {
  label: string;
  icon: React.ReactNode;
  schema: Partial<Schema> & { type: string };
}

const toolbarItems: ToolbarItem[] = [
  {
    label: 'Text',
    icon: <Type className="h-4 w-4" />,
    schema: {
      type: 'text',
      width: 50,
      height: 8,
      fontSize: 12,
      fontName: 'Sarabun',
      content: 'ข้อความ',
    } as any,
  },
  {
    label: 'Text (Bold)',
    icon: <span className="font-black text-xs">B</span>,
    schema: {
      type: 'text',
      width: 50,
      height: 8,
      fontSize: 14,
      fontName: 'Sarabun-Bold',
      content: 'หัวข้อ',
    } as any,
  },
  {
    label: 'Image',
    icon: <Image className="h-4 w-4" />,
    schema: {
      type: 'image',
      width: 40,
      height: 30,
    } as any,
  },
  {
    label: 'Line',
    icon: <Minus className="h-4 w-4" />,
    schema: {
      type: 'line',
      width: 80,
      height: 1,
      color: '#000000',
    } as any,
  },
  {
    label: 'Rectangle',
    icon: <Square className="h-4 w-4" />,
    schema: {
      type: 'rectangle',
      width: 50,
      height: 30,
      borderWidth: 1,
      borderColor: '#000000',
      color: '',
    } as any,
  },
  {
    label: 'Ellipse',
    icon: <Circle className="h-4 w-4" />,
    schema: {
      type: 'ellipse',
      width: 30,
      height: 30,
      borderWidth: 1,
      borderColor: '#000000',
    } as any,
  },
  {
    label: 'Table',
    icon: <Table2 className="h-4 w-4" />,
    schema: {
      type: 'table',
      width: 170,
      height: 40,
      content: JSON.stringify([
        ['Header1', 'Header2', 'Header3'],
        ['Data1', 'Data2', 'Data3'],
      ]),
    } as any,
  },
  {
    label: 'QR Code',
    icon: <QrCode className="h-4 w-4" />,
    schema: {
      type: 'qrcode',
      width: 30,
      height: 30,
      content: 'https://example.com',
    } as any,
  },
];

let fieldCounter = 0;

export const PdfTemplateDesigner = ({ template, onSave, onCancel }: PdfTemplateDesignerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const designerRef = useRef<Designer | null>(null);
  const [showToolbar, setShowToolbar] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const font = getPdfmeFonts();
    const plugins = getPdfmePlugins();

    const designer = new Designer({
      domContainer: containerRef.current,
      template,
      options: {
        font,
        lang: 'en',
        theme: {
          token: {
            colorPrimary: '#004F9F',
          },
        },
      },
      plugins,
    });

    designerRef.current = designer;

    return () => {
      designer.destroy();
      designerRef.current = null;
    };
  }, [template]);

  const handleSave = useCallback(() => {
    if (!designerRef.current) return;
    const currentTemplate = designerRef.current.getTemplate();
    onSave(currentTemplate);
  }, [onSave]);

  const addField = useCallback((item: ToolbarItem) => {
    if (!designerRef.current) return;

    const currentTemplate = designerRef.current.getTemplate();
    const pageCursor = designerRef.current.getPageCursor();
    const schemas = currentTemplate.schemas;

    if (!schemas[pageCursor]) return;

    fieldCounter++;
    const uniqueName = `${item.label.replace(/[^a-zA-Z0-9]/g, '_')}_${fieldCounter}`;

    const newSchema = {
      name: uniqueName,
      ...item.schema,
      position: { x: 20 + (fieldCounter % 5) * 8, y: 20 + (fieldCounter % 10) * 8 },
    };

    const updatedSchemas = [...schemas];
    const currentPageSchemas = [...(updatedSchemas[pageCursor] as any[])];
    currentPageSchemas.push(newSchema);
    updatedSchemas[pageCursor] = currentPageSchemas as any;

    designerRef.current.updateTemplate({
      ...currentTemplate,
      schemas: updatedSchemas,
    });
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800">PDF Template Designer</h3>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-[#004F9F] rounded-md hover:bg-[#003D7A]"
          >
            บันทึกเทมเพลต
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-50 border-b">
        <div className="flex items-center gap-1 px-4 py-2">
          <button
            onClick={() => setShowToolbar(!showToolbar)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 rounded"
          >
            เพิ่ม Field
            {showToolbar ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showToolbar && (
            <div className="flex items-center gap-1 ml-2">
              {toolbarItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => addField(item)}
                  title={item.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Designer container */}
      <div ref={containerRef} style={{ flex: 1, width: '100%', minHeight: 0 }} />
    </div>
  );
};
