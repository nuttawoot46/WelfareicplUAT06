import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Upload, X, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProfilePictureUploadProps {
  currentAvatarUrl?: string | null;
  displayName: string;
  onAvatarUpdate: (newUrl: string) => void;
  isOpen?: boolean; // For sidebar - controls expanded state
}

export function ProfilePictureUpload({
  currentAvatarUrl,
  displayName,
  onAvatarUpdate,
  isOpen = true
}: ProfilePictureUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const displayInitial = displayName.charAt(0).toUpperCase();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'ไฟล์ไม่ถูกต้อง',
        description: 'กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, GIF)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'ไฟล์ใหญ่เกินไป',
        description: 'ขนาดไฟล์ต้องไม่เกิน 5MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ไม่พบผู้ใช้งาน');

      // Create unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        // If bucket doesn't exist, try creating it first
        if (uploadError.message.includes('Bucket not found')) {
          toast({
            title: 'กรุณาติดต่อผู้ดูแลระบบ',
            description: 'Storage bucket สำหรับรูปโปรไฟล์ยังไม่ได้ตั้งค่า',
            variant: 'destructive',
          });
          setIsUploading(false);
          return;
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update Employee table with new avatar URL
      // Use .select() to verify rows were actually updated
      const { data: updateData, error: updateError } = await supabase
        .from('Employee')
        .update({ avatar_url: publicUrl })
        .eq('auth_uid', user.id)
        .select();

      if (updateError || !updateData || updateData.length === 0) {
        // Fallback: try updating by email_user
        const { data: updateByEmailData, error: updateByEmailError } = await supabase
          .from('Employee')
          .update({ avatar_url: publicUrl })
          .eq('email_user', user.email)
          .select();

        if (updateByEmailError) throw updateByEmailError;
        if (!updateByEmailData || updateByEmailData.length === 0) {
          throw new Error('ไม่พบข้อมูลพนักงานในระบบ');
        }
      }

      // Update local state
      onAvatarUpdate(publicUrl);

      toast({
        title: 'สำเร็จ',
        description: 'อัพโหลดรูปโปรไฟล์เรียบร้อยแล้ว',
      });

      setIsDialogOpen(false);
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถอัพโหลดรูปภาพได้',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ไม่พบผู้ใช้งาน');

      // Update Employee table to remove avatar URL
      const { data: updateData, error: updateError } = await supabase
        .from('Employee')
        .update({ avatar_url: null })
        .eq('auth_uid', user.id)
        .select();

      if (updateError || !updateData || updateData.length === 0) {
        // Fallback: try updating by email_user
        const { data: updateByEmailData, error: updateByEmailError } = await supabase
          .from('Employee')
          .update({ avatar_url: null })
          .eq('email_user', user.email)
          .select();

        if (updateByEmailError) throw updateByEmailError;
        if (!updateByEmailData || updateByEmailData.length === 0) {
          throw new Error('ไม่พบข้อมูลพนักงานในระบบ');
        }
      }

      onAvatarUpdate('');

      toast({
        title: 'สำเร็จ',
        description: 'ลบรูปโปรไฟล์เรียบร้อยแล้ว',
      });

      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถลบรูปภาพได้',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* Profile Picture Display - Clickable */}
      <div
        onClick={() => setIsDialogOpen(true)}
        className={cn(
          "relative cursor-pointer group",
          "w-12 h-12 rounded-full overflow-hidden",
          "bg-white/90 flex items-center justify-center",
          "shadow-md transition-all duration-200",
          "hover:ring-2 hover:ring-white/50"
        )}
        title="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
      >
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-primary font-bold text-xl">
            {displayInitial}
          </span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">เปลี่ยนรูปโปรไฟล์</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {/* Preview Area */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : currentAvatarUrl ? (
                  <img
                    src={currentAvatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
            </div>

            {/* File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 w-full">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full gap-2"
                disabled={isUploading}
              >
                <Upload className="w-4 h-4" />
                เลือกรูปภาพ
              </Button>

              {selectedFile && (
                <Button
                  onClick={handleUpload}
                  className="w-full gap-2"
                  disabled={isUploading}
                >
                  {isUploading ? 'กำลังอัพโหลด...' : 'บันทึกรูปภาพ'}
                </Button>
              )}

              {currentAvatarUrl && !previewUrl && (
                <Button
                  onClick={handleRemoveAvatar}
                  variant="destructive"
                  className="w-full gap-2"
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                  ลบรูปโปรไฟล์
                </Button>
              )}
            </div>

            {/* Info */}
            <p className="text-xs text-gray-500 text-center">
              รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 5MB
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
