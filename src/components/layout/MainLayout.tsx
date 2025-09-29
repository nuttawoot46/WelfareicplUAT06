import React from 'react';
import N8nChatbot from '@/components/chatbot/N8nChatbot';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <N8nChatbot />
    </div>
  );
};

export default MainLayout;