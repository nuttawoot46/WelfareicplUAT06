import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorPicker } from './ColorPicker';
import { useSidebar } from '@/context/SidebarContext';
import type { CustomGroup } from '@/types/sidebar';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGroup?: CustomGroup | null;
}

export function CreateGroupDialog({ open, onOpenChange, editingGroup }: CreateGroupDialogProps) {
  const { createGroup, updateGroup } = useSidebar();
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const isEditing = !!editingGroup;

  useEffect(() => {
    if (editingGroup) {
      setLabel(editingGroup.label);
      setColor(editingGroup.color);
    } else {
      setLabel('');
      setColor('#3B82F6');
    }
  }, [editingGroup, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;

    if (isEditing && editingGroup) {
      updateGroup(editingGroup.id, { label: trimmed, color });
    } else {
      createGroup(trimmed, color);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'แก้ไขกลุ่ม' : 'สร้างกลุ่มใหม่'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">ชื่อกลุ่ม</Label>
            <Input
              id="group-name"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="เช่น งานประจำวัน"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>สีกลุ่ม</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={!label.trim()}>
              {isEditing ? 'บันทึก' : 'สร้างกลุ่ม'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
