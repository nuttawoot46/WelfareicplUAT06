
import React from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/context/AuthContext";
import { NotificationBadge } from "../notifications/NotificationBadge";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="md:ml-64 p-4 md:p-8 transition-all duration-300">
        <div className="mb-6 flex justify-end">
          <NotificationBadge />
        </div>
        
        <main className="animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
