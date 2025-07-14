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
          key={editId} // force re-mount on editId change
        />
        <DialogFooter>
          <DialogClose asChild>
            <button type="button" className="btn btn-secondary">ปิด</button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
