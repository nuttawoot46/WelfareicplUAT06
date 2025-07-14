import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/types';
import { toast } from 'react-hot-toast';

interface PasswordVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onPasswordVerified: () => void;
  isNewPassword?: boolean;
}

const PasswordVerification: React.FC<PasswordVerificationProps> = ({
  isOpen,
  onClose,
  user,
  onPasswordVerified,
  isNewPassword = false
}) => {
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { verifyPassword, setPassword: setAuthPassword, logout } = useAuth();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!/[\u0E00-\u0E7F]/.test(value) && value.length <= 16) {
      setPassword(value);
      setError('');
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!/[\u0E00-\u0E7F]/.test(value) && value.length <= 16) {
      setConfirmPassword(value);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    let success = false;
    if (isNewPassword) {
      if (password.length < 8 || password.length > 16) {
        setError('รหัสผ่านต้องมีความยาว 8-16 ตัวอักษร');
        setIsSubmitting(false);
        return;
      }
      
      if (/[\u0E00-\u0E7F]/.test(password)) {
        setError('รหัสผ่านต้องประกอบด้วยภาษาอังกฤษ, ตัวเลข และอักขระพิเศษเท่านั้น (ไม่รับภาษาไทย)');
        setIsSubmitting(false);
        return;
      }
      
      if (password !== confirmPassword) {
        setError('รหัสผ่านไม่ตรงกัน');
        setIsSubmitting(false);
        return;
      }
      success = await setAuthPassword(password);
      if (success) {
        toast.success('ตั้งรหัสผ่านสำเร็จ');
      } else {
        setError('เกิดข้อผิดพลาดในการตั้งรหัสผ่าน กรุณาลองใหม่');
      }
    } else {
      success = await verifyPassword(password);
      if (!success) {
        setError('รหัสผ่านไม่ถูกต้อง');
      }
    }

    setIsSubmitting(false);
    if (success) {
      onPasswordVerified();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => {}}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
        <Dialog.Panel className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
            {isNewPassword ? 'สร้างรหัสผ่าน' : 'กรุณายืนยันรหัสผ่าน'}
          </Dialog.Title>
          
          {isNewPassword ? (
            <p className="text-sm text-gray-500 mb-4">
              เพื่อความปลอดภัย กรุณาตั้งรหัสผ่าน 8-16 ตัวอักษร (ภาษาอังกฤษ, ตัวเลข และอักขระพิเศษเท่านั้น) สำหรับใช้ในการเข้าสู่ระบบครั้งถัดไป
            </p>
          ) : (
            <p className="text-sm text-gray-500 mb-4">
              กรุณากรอกรหัสผ่านของคุณเพื่อยืนยันตัวตน
            </p>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                ref={inputRef}
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center"
                placeholder={isNewPassword ? 'รหัสผ่าน 8-16 ตัวอักษร (ไม่รับภาษาไทย)' : 'กรอกรหัสผ่าน'}
                value={password}
                onChange={handlePasswordChange}
                maxLength={16}
                autoComplete="new-password"
              />
            </div>
            
            {isNewPassword && (
              <div className="mb-4">
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center"
                  placeholder="ยืนยันรหัสผ่าน"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  maxLength={16}
                  autoComplete="new-password"
                />
              </div>
            )}
            
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                ออก
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={isSubmitting || (isNewPassword ? !password || !confirmPassword : !password)}
              >
                {isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default PasswordVerification; 