import React from 'react';

interface LoadingPopupProps {
  open: boolean;
}

const LoadingPopup: React.FC<LoadingPopupProps> = ({ open }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center">
        <div className="loading mb-4">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <p className="text-lg font-medium text-gray-800">กำลังดำเนินการ...</p>
        <p className="text-sm text-gray-500 mt-2">กรุณารอสักครู่</p>
      </div>
      <style jsx>{`
        .loading {
          --speed-of-animation: 0.9s;
          --gap: 6px;
          --first-color: #4c86f9;
          --second-color: #49a84c;
          --third-color: #f6bb02;
          --fourth-color: #f6bb02;
          --fifth-color: #2196f3;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100px;
          gap: 6px;
          height: 100px;
        }

        .loading span {
          width: 4px;
          height: 50px;
          background: var(--first-color);
          animation: scale var(--speed-of-animation) ease-in-out infinite;
        }

        .loading span:nth-child(2) {
          background: var(--second-color);
          animation-delay: -0.8s;
        }

        .loading span:nth-child(3) {
          background: var(--third-color);
          animation-delay: -0.7s;
        }

        .loading span:nth-child(4) {
          background: var(--fourth-color);
          animation-delay: -0.6s;
        }

        .loading span:nth-child(5) {
          background: var(--fifth-color);
          animation-delay: -0.5s;
        }

        @keyframes scale {
          0%, 40%, 100% {
            transform: scaleY(0.05);
          }
          20% {
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingPopup;
