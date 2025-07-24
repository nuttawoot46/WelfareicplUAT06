import React, { useState } from 'react';
import { SignaturePopup } from '@/components/signature/SignaturePopup';

export const SignatureTest: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = (signature: string) => {
    console.log('Signature saved:', signature);
    setIsOpen(false);
  };

  return (
    <div className="p-4">
      <button
        onClick={() => {
          console.log('Test button clicked, opening signature popup');
          setIsOpen(true);
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test Signature Popup
      </button>

      <SignaturePopup
        isOpen={isOpen}
        onClose={() => {
          console.log('Signature popup closed');
          setIsOpen(false);
        }}
        onSave={handleSave}
        title="Test Signature"
        approverName="Test User"
      />
    </div>
  );
};