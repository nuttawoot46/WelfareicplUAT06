import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useWelfare } from '@/context/WelfareContext';
import { Upload, FileText, X, AlertCircle, Loader2 } from 'lucide-react';

interface RevisionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: number;
  currentAttachments: string[];
  revisionNote?: string;
  revisionRequestedBy?: string;
  onSuccess: () => void;
}

export function RevisionUploadModal({
  isOpen,
  onClose,
  requestId,
  currentAttachments,
  revisionNote,
  revisionRequestedBy,
  onSuccess,
}: RevisionUploadModalProps) {
  const { user } = useAuth();
  const { refreshRequests } = useWelfare();
  const { toast } = useToast();
  const [newFiles, setNewFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    if (!fileInput.files || fileInput.files.length === 0) return;

    try {
      setIsUploading(true);
      const uploadPromises = Array.from(fileInput.files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${user?.id || 'anonymous'}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('welfare-attachments')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('welfare-attachments')
          .getPublicUrl(data.path);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setNewFiles(prev => [...prev, ...uploadedUrls]);

      toast({
        title: "อัพโหลดสำเร็จ",
        description: `อัพโหลดไฟล์เรียบร้อยแล้ว ${uploadedUrls.length} ไฟล์`,
      });
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถอัปโหลดไฟล์ได้: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      fileInput.value = '';
    }
  };

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getReturnStatus = () => {
    switch (revisionRequestedBy) {
      case 'manager': return 'pending_manager';
      case 'hr': return 'pending_hr';
      case 'accounting': return 'pending_accounting';
      default: return 'pending_manager';
    }
  };

  const handleSubmit = async () => {
    if (newFiles.length === 0) {
      toast({
        title: "กรุณาแนบไฟล์",
        description: "กรุณาอัพโหลดเอกสารอย่างน้อย 1 ไฟล์",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const allAttachments = [...currentAttachments, ...newFiles];
      const returnStatus = getReturnStatus();

      const { error } = await supabase
        .from('welfare_requests')
        .update({
          attachment_url: JSON.stringify(allAttachments),
          status: returnStatus,
          revision_note: null,
          revision_requested_by: null,
          revision_requested_at: null,
        } as any)
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "ส่งเอกสารสำเร็จ",
        description: "เอกสารเพิ่มเติมถูกส่งเรียบร้อยแล้ว คำร้องจะกลับเข้าสู่คิวอนุมัติ",
      });

      await refreshRequests(true);
      setNewFiles([]);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error submitting revision:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถส่งเอกสารได้: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNewFiles([]);
      onClose();
    }
  };

  const getRequesterLabel = () => {
    switch (revisionRequestedBy) {
      case 'manager': return 'หัวหน้า';
      case 'hr': return 'HR';
      case 'accounting': return 'บัญชี';
      default: return 'ผู้อนุมัติ';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>แนบเอกสารเพิ่มเติม</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Revision Note from approver */}
          {revisionNote && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    หมายเหตุจาก{getRequesterLabel()}:
                  </p>
                  <p className="text-sm text-amber-700 mt-1">{revisionNote}</p>
                </div>
              </div>
            </div>
          )}

          {/* Existing Attachments */}
          {currentAttachments.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                เอกสารที่แนบแล้ว ({currentAttachments.length} ไฟล์)
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {currentAttachments.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded px-2 py-1.5">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate hover:text-blue-600 hover:underline"
                    >
                      เอกสาร {index + 1}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Files Upload */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              อัพโหลดเอกสารเพิ่มเติม <span className="text-red-500">*</span>
            </p>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300 hover:border-amber-400 transition-colors">
              <div className="flex flex-col items-center justify-center pt-2 pb-2">
                {isUploading ? (
                  <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 text-gray-400" />
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {isUploading ? 'กำลังอัพโหลด...' : 'คลิกเพื่อเลือกไฟล์'}
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileUpload}
                disabled={isUploading || isSubmitting}
              />
            </label>
          </div>

          {/* New Files List */}
          {newFiles.length > 0 && (
            <div>
              <p className="text-sm font-medium text-green-700 mb-2">
                ไฟล์ใหม่ที่จะแนบ ({newFiles.length} ไฟล์)
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {newFiles.map((url, index) => (
                  <div key={index} className="flex items-center justify-between gap-2 text-sm bg-green-50 rounded px-2 py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-green-700 hover:underline"
                      >
                        ไฟล์ใหม่ {index + 1}
                      </a>
                    </div>
                    <button
                      onClick={() => removeNewFile(index)}
                      className="text-red-400 hover:text-red-600 flex-shrink-0"
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={newFiles.length === 0 || isSubmitting}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                กำลังส่ง...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                ส่งเอกสารเพิ่มเติม
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
