import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Trash2, Check } from 'lucide-react';

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
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  // Initialize canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 600;
    canvas.height = 200;

    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set drawing properties
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
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
    setHasDrawnSignature(true);
  }, [isDrawing, lastPoint, getCoordinates]);

  // Stop drawing
  const stopDrawing = useCallback((e?: any) => {
    if (e?.cancelable) e.preventDefault();
    setIsDrawing(false);
    setLastPoint(null);
  }, []);

  const clearSignature = useCallback(() => {
    initCanvas();
    setHasDrawnSignature(false);
  }, [initCanvas]);

  const saveSignature = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || isSaving || !hasDrawnSignature) return;

    setIsSaving(true);
    try {
      const dataURL = canvas.toDataURL('image/png');
      await onSave(dataURL);
      onClose();
      setHasDrawnSignature(false);
      clearSignature();
    } catch (error) {
      console.error('Error saving signature:', error);
      setIsSaving(false);
    }
  }, [canvasRef, isSaving, hasDrawnSignature, onSave, onClose, clearSignature]);

  const handleClose = () => {
    onClose();
    setHasDrawnSignature(false);
    clearSignature();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-hidden"
      style={{ touchAction: 'none' }}
      onTouchMove={(e) => e.preventDefault()}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 relative"
        style={{ touchAction: 'auto' }}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Draw Signature */}
        <div className="mb-4">
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
            <div
              className="border border-gray-400 bg-white rounded"
              style={{ touchAction: 'none' }}
            >
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="cursor-crosshair w-full h-[200px]"
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
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-600">กรุณาวาดลายเซ็นของคุณในกรอบด้านบน</p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSignature}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                ลบ
              </Button>
            </div>
          </div>
        </div>

        {/* Approver Name Display */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>ผู้อนุมัติ:</strong> {approverName}
          </p>
        </div>

        {/* Request Details */}
        {requestDetails && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{requestDetails}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            ยกเลิก
          </Button>
          <Button
            onClick={saveSignature}
            disabled={!hasDrawnSignature || isSaving}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            {isSaving ? 'กำลังบันทึก...' : 'ยืนยันลายเซ็น'}
          </Button>
        </div>
      </div>
    </div>
  );
};
