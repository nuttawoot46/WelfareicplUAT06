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
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }
    }
  }, [isOpen, signatureType]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasDrawnSignature(true);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="border border-gray-400 bg-white cursor-crosshair w-full"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
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