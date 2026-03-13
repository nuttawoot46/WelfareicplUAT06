import React from "react";
import { AdvancedSidebar } from "@/components/sidebar/AdvancedSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { NotificationBadge } from "../notifications/NotificationBadge";
import { cn } from "@/lib/utils";
import N8nChatbot from "@/components/chatbot/N8nChatbot";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuth();
  const { isExpanded } = useSidebar();

  if (!isAuthenticated) {
    return <div className="h-full">{children}</div>;
  }

  return (
    <div className={cn(
      "min-h-screen bg-[#F7F8FA] transition-colors duration-500 h-full",
      "dark:bg-dark-radial dark:bg-fixed dark:bg-dark-mesh"
    )}>
      <AdvancedSidebar />
      <MobileBottomNav />

      <div className={cn(
        "p-4 md:p-6 lg:p-8 pt-20 xl:pt-6 transition-all duration-300 min-h-full relative z-10",
        isExpanded ? "xl:ml-64" : "xl:ml-20"
      )}>
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
