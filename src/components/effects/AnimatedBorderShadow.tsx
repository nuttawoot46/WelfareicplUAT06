import React, { ReactNode } from 'react';

interface AnimatedBorderShadowProps {
  children: ReactNode;
  className?: string;
  shadowColor?: string;
  duration?: number;
}

export const AnimatedBorderShadow: React.FC<AnimatedBorderShadowProps> = ({
  children,
  className = '',
  shadowColor = 'rgba(99, 102, 241, 0.7)', // Default to indigo-500 with some transparency
  duration = 4, // seconds
}) => {
  return (
    <div 
      className={`relative p-[2px] rounded-lg ${className}`}
      style={{
        '--shadow-color': shadowColor,
        '--duration': `${duration}s`,
        '--gradient-size': '200%',
      } as React.CSSProperties}
    >
      <div 
        className="absolute inset-0 rounded-lg opacity-75"
        style={{
          background: `
            linear-gradient(
              45deg,
              transparent,
              var(--shadow-color),
              transparent,
              transparent,
              var(--shadow-color),
              transparent
            )`,
          backgroundSize: 'var(--gradient-size) 100%',
          animation: `shimmer var(--duration) linear infinite`,
        }}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-md overflow-hidden">
        {children}
      </div>
      <style>
        {`
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
        `}
      </style>
    </div>
  );
};
