import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { WelfareForm } from './WelfareForm';
import { WelfareType } from '@/types';

interface WelfareEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId: number | null;
  type: WelfareType | null;
  onSuccess?: () => void;
}

export const WelfareEditModal: React.FC<WelfareEditModalProps> = ({ open, onOpenChange, editId, type, onSuccess }) => {
  if (!editId || !type) return null;
  
  const handleSuccess = () => {
    onOpenChange(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>แก้ไขคำร้องสวัสดิการ</DialogTitle>
        </DialogHeader>
        <WelfareForm
          type={type}
          editId={editId}
          onBack={() => onOpenChange(false)}
          onSuccess={handleSuccess}
          key={editId} // force re-mount on editId change
        />
      </DialogContent>
    </Dialog>
  );
};
