import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/types';
import { toast } from 'react-hot-toast';

interface PinVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onPinVerified: () => void;
  isNewPin?: boolean;
}

const PinVerification: React.FC<PinVerificationProps> = ({
  isOpen,
  onClose,
  user,
  onPinVerified,
  isNewPin = false
}) => {
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { verifyPin, setPin: setAuthPin, logout } = useAuth();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow numbers
    if (value.length <= 6) {
      setPin(value);
      setError('');
    }
  };

  const handleConfirmPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow numbers
    if (value.length <= 6) {
      setConfirmPin(value);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    let success = false;
    if (isNewPin) {
      if (pin.length < 4 || pin.length > 6) {
        setError('รหัส PIN ต้องมีความยาว 4-6 หลัก');
        setIsSubmitting(false);
        return;
      }
      if (pin !== confirmPin) {
        setError('รหัส PIN ไม่ตรงกัน');
        setIsSubmitting(false);
        return;
      }
      success = await setAuthPin(pin);
      if (success) {
        toast.success('ตั้งรหัส PIN สำเร็จ');
      } else {
        setError('เกิดข้อผิดพลาดในการตั้งรหัส PIN กรุณาลองใหม่');
      }
    } else {
      success = await verifyPin(pin);
      if (!success) {
        setError('รหัส PIN ไม่ถูกต้อง');
      }
    }

    setIsSubmitting(false);
    if (success) {
      onPinVerified();
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
            {isNewPin ? 'สร้างรหัส PIN' : 'กรุณายืนยันรหัส PIN'}
          </Dialog.Title>
          
          {isNewPin ? (
            <p className="text-sm text-gray-500 mb-4">
              เพื่อความปลอดภัย กรุณาตั้งรหัส PIN 4-6 หลักสำหรับใช้ในการเข้าสู่ระบบครั้งถัดไป
            </p>
          ) : (
            <p className="text-sm text-gray-500 mb-4">
              กรุณากรอกรหัส PIN ของคุณเพื่อยืนยันตัวตน
            </p>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-xl tracking-widest"
                placeholder={isNewPin ? 'รหัส PIN 4-6 หลัก' : 'กรอกรหัส PIN'}
                value={pin}
                onChange={handlePinChange}
                maxLength={6}
                autoComplete="off"
              />
            </div>
            
            {isNewPin && (
              <div className="mb-4">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-xl tracking-widest"
                  placeholder="ยืนยันรหัส PIN"
                  value={confirmPin}
                  onChange={handleConfirmPinChange}
                  maxLength={6}
                  autoComplete="off"
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
                disabled={isSubmitting || (isNewPin ? !pin || !confirmPin : !pin)}
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

export default PinVerification;
