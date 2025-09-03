import React, { useState, useRef, useCallback } from 'react';
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
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  // Initialize canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 200;

    // Set drawing properties
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Lock body scroll and setup canvas
  React.useEffect(() => {
    if (!isOpen) return;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    // Initialize canvas after a short delay
    const timer = setTimeout(initCanvas, 50);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen, initCanvas]);

  // Get coordinates from mouse or touch event
  const getCoordinates = useCallback((e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.type.startsWith('touch')) {
      const touch = e.touches?.[0] || e.changedTouches?.[0];
      if (!touch) return { x: 0, y: 0 };
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  // Start drawing
  const startDrawing = useCallback((e: any) => {
    if (e.cancelable) e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const point = getCoordinates(e);
    setIsDrawing(true);
    setLastPoint(point);
    
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }, [getCoordinates]);

  // Continue drawing
  const continueDrawing = useCallback((e: any) => {
    if (e.cancelable) e.preventDefault();
    
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const point = getCoordinates(e);
    
    if (lastPoint) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    
    setLastPoint(point);
  }, [isDrawing, lastPoint, getCoordinates]);

  // Stop drawing
  const stopDrawing = useCallback((e?: any) => {
    if (e?.cancelable) e.preventDefault();
    setIsDrawing(false);
    setLastPoint(null);
  }, []);

  const clearSignature = useCallback(() => {
    initCanvas();
  }, [initCanvas]);

  const saveSignature = useCallback(async () => {
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
  }, [canvasRef, isSaving, onSave, onClose]);

  if (!isOpen) return null;



  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-hidden"
      style={{ touchAction: 'none' }}
      onTouchMove={(e) => e.preventDefault()}
    >
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative"
        style={{ touchAction: 'auto' }}
        onTouchMove={(e) => e.stopPropagation()}
      >
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

        <div 
          className="border-2 border-gray-300 rounded-lg mb-4 bg-white relative"
          style={{ touchAction: 'none' }}
        >
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="w-full h-[200px] cursor-crosshair block border-0"
            onMouseDown={startDrawing}
            onMouseMove={continueDrawing}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={continueDrawing}
            onTouchEnd={stopDrawing}
            onTouchCancel={stopDrawing}
            onContextMenu={(e) => e.preventDefault()}
            style={{ touchAction: 'none' }}
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