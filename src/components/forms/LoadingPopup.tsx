import React, { useEffect, useState } from 'react';

interface LoadingPopupProps {
  open: boolean;
}

const LoadingPopup: React.FC<LoadingPopupProps> = ({ open }) => {
  const [percent, setPercent] = useState(1);

  useEffect(() => {
    if (!open) {
      setPercent(1);
      return;
    }
    let current = 1;
    const interval = setInterval(() => {
      current += 1;
      setPercent(current);
      if (current >= 100) clearInterval(interval);
    }, 20); // 2 วินาทีถึง 100%
    return () => clearInterval(interval);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center">
        <div className="relative w-24 h-24 mb-4">
          <svg className="w-full h-full" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              className="stroke-green-100"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              className="stroke-green-600"
              strokeWidth="3"
              strokeDasharray="100"
              strokeDashoffset={100 - percent}
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-green-600">{percent}%</span>
          </div>
        </div>
        <p className="text-lg font-medium text-gray-800">กำลังดำเนินการ...</p>
        <p className="text-sm text-gray-500 mt-2">กรุณารอสักครู่</p>
      </div>
    </div>
  );
};

export default LoadingPopup;
