import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Upload, Pen, Trash2, Check } from 'lucide-react';

interface DigitalSignatureProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureData: string) => void;
  userName?: string;
}

export const DigitalSignature: React.FC<DigitalSignatureProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureType, setSignatureType] = useState<'draw' | 'upload'>('draw');
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);

  useEffect(() => {
    if (isOpen && signatureType === 'draw') {
      // Lock body scroll on mobile
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Set white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Set drawing properties
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen, signatureType]);

  // Get coordinates from mouse or touch event
  const getCoordinates = (e: any) => {
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
  };

  const startDrawing = (e: any) => {
    if (e.cancelable) e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (e.cancelable) e.preventDefault();
    
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCoordinates(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasDrawnSignature(true);
  };

  const stopDrawing = (e?: any) => {
    if (e?.cancelable) e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Reset white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Reset drawing properties
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        setHasDrawnSignature(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedSignature(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    let signatureData = '';

    if (signatureType === 'draw' && hasDrawnSignature) {
      const canvas = canvasRef.current;
      if (canvas) {
        signatureData = canvas.toDataURL('image/png');
      }
    } else if (signatureType === 'upload' && uploadedSignature) {
      signatureData = uploadedSignature;
    }

    if (signatureData) {
      onConfirm(signatureData);
      onClose();
      // Reset state
      setUploadedSignature(null);
      setHasDrawnSignature(false);
      clearCanvas();
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state
    setUploadedSignature(null);
    setHasDrawnSignature(false);
    clearCanvas();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">ลายเซ็นดิจิทัล</h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Signature Type Selection */}
        <div className="flex gap-4 mb-4">
          <Button
            variant={signatureType === 'draw' ? 'default' : 'outline'}
            onClick={() => setSignatureType('draw')}
            className="flex items-center gap-2"
          >
            <Pen className="h-4 w-4" />
            วาดลายเซ็น
          </Button>
          <Button
            variant={signatureType === 'upload' ? 'default' : 'outline'}
            onClick={() => setSignatureType('upload')}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            อัพโหลดไฟล์
          </Button>
        </div>

        {/* Draw Signature */}
        {signatureType === 'draw' && (
          <div className="mb-4">
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
              <div 
                className="border border-gray-400 bg-white rounded"
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                onTouchCancel={stopDrawing}
                style={{ touchAction: 'none' }}
              >
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="cursor-crosshair w-full h-[200px] pointer-events-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-600">กรุณาวาดลายเซ็นของคุณในกรอบด้านบน</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCanvas}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  ลบ
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Signature */}
        {signatureType === 'upload' && (
          <div className="mb-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {uploadedSignature ? (
                <div className="space-y-4">
                  <img
                    src={uploadedSignature}
                    alt="Uploaded signature"
                    className="max-h-32 mx-auto border border-gray-300 rounded"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setUploadedSignature(null)}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                    ลบรูป
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-gray-600 mb-2">อัพโหลดไฟล์ลายเซ็น</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    รองรับไฟล์: JPG, PNG, GIF (ขนาดไม่เกิน 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Name Display */}
        {userName && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ชื่อผู้ลงนาม:</strong> {userName}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              (signatureType === 'draw' && !hasDrawnSignature) ||
              (signatureType === 'upload' && !uploadedSignature)
            }
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            ยืนยันลายเซ็น
          </Button>
        </div>
      </div>
    </div>
  );
};