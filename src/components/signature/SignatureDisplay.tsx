import React, { useState } from 'react';
import { format } from 'date-fns';

interface SignatureDisplayProps {
  signature: string;
  approverName?: string;
  approvedAt?: string;
  role: 'manager' | 'hr';
  className?: string;
}

export const SignatureDisplay: React.FC<SignatureDisplayProps> = ({
  signature,
  approverName,
  approvedAt,
  role,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const roleConfig = {
    manager: {
      borderColor: 'border-red-500',
      textColor: 'text-red-700',
      label: 'ลายเซ็นผู้จัดการ',
      roleText: 'ผู้จัดการ'
    },
    hr: {
      borderColor: 'border-blue-500',
      textColor: 'text-blue-700',
      label: 'ลายเซ็นฝ่ายบุคคล',
      roleText: 'ฝ่ายบุคคล'
    }
  };

  const config = roleConfig[role];

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  return (
    <div className={`mb-4 p-3 border-2 ${config.borderColor} rounded-lg bg-white ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${config.textColor}`}>
          {config.label}
        </span>
        <span className="text-xs text-gray-500">
          {approvedAt && format(new Date(approvedAt), 'dd/MM/yyyy HH:mm')}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {imageLoading && !imageError && (
          <div className="h-16 w-32 border rounded flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
          </div>
        )}
        {!imageError ? (
          <img 
            src={signature} 
            alt={`${config.roleText} Signature`} 
            className={`h-16 border rounded ${imageLoading ? 'hidden' : 'block'}`}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ maxWidth: '200px' }}
          />
        ) : (
          <div className="h-16 w-32 border rounded flex items-center justify-center bg-gray-100 text-xs text-gray-500">
            ไม่สามารถโหลดลายเซ็นได้
          </div>
        )}
        <div className="text-sm">
          <div className="font-medium">{approverName || '-'}</div>
          <div className="text-gray-600">{config.roleText}</div>
        </div>
      </div>
    </div>
  );
};