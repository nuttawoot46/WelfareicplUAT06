import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

interface SignaturePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: string) => Promise<void>;
  title: string;
  approverName: string;
  requestDetails?: string;
}

export const SignaturePopup: React.FC<SignaturePopupProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  approverName,
  requestDetails
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize canvas - must be before early return to maintain hook order
  React.useEffect(() => {
    if (!isOpen) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 200;

    // Set drawing properties
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [isOpen]);

  console.log('SignaturePopup render - isOpen:', isOpen, 'title:', title);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isSaving) return;

    setIsSaving(true);
    try {
      const dataURL = canvas.toDataURL('image/png');
      await onSave(dataURL);
      // If successful, close the popup
      onClose();
    } catch (error) {
      console.error('Error saving signature:', error);
      // Keep popup open on error so user can try again
      setIsSaving(false);
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            กรุณาลงลายเซ็นของคุณในกรอบด้านล่าง
          </p>
          <p className="text-sm font-medium text-gray-800">
            ผู้อนุมัติ: {approverName}
          </p>
          {requestDetails && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
              {requestDetails}
            </div>
          )}
        </div>

        <div className="border-2 border-gray-300 rounded-lg mb-4">
          <canvas
            ref={canvasRef}
            className="w-full cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>

        <div className="flex justify-between">
          <button
            onClick={clearSignature}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ลบลายเซ็น
          </button>
          <div className="space-x-2">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ยกเลิก
            </button>
            <button
              onClick={saveSignature}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกลายเซ็น'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};