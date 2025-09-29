import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { NotificationBadge } from "../notifications/NotificationBadge";
import { cn } from "@/lib/utils";
import N8nChatbot from "@/components/chatbot/N8nChatbot";

interface LayoutProps {
  children: React.ReactNode;
}

// ... import อื่นๆ

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <div className="h-full">{children}</div>;
  }

  return (
    <div className={cn(
      "min-h-screen bg-gray-50 transition-colors duration-500 h-full noise-bg",
      "dark:bg-dark-radial dark:bg-fixed dark:bg-dark-mesh"
    )}>
      <Sidebar />
      
      <div className="md:ml-64 p-4 md:p-8 transition-all duration-300 min-h-full relative z-10">
        <div className="mb-6 flex justify-end gap-2">
          <NotificationBadge />
        </div>
        
        <main className="animate-fade-in">
          {children}
        </main>
      </div>
      
      <N8nChatbot />
    </div>
  );
}