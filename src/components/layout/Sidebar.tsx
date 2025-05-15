
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  ChartBar, 
  File, 
  LogIn, 
  LogOut, 
  Settings, 
  CheckSquare, 
  Bell,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  
  // Mobile responsive management
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  
  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const isActive = (path: string) => location.pathname === path;

  // If not logged in, don't show sidebar
  if (!user) return null;

  return (
    <>
      {/* Mobile menu button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleMobileSidebar} 
        className="fixed top-4 left-4 z-50 md:hidden bg-primary text-white rounded-full shadow-lg"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>
      
      {/* Sidebar container */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 bg-gradient-primary shadow-xl transition-all duration-300 flex flex-col",
        isOpen ? "w-64" : "w-20",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo and title */}
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <div className={cn(
            "flex items-center gap-3 transition-all duration-300 overflow-hidden",
            isOpen ? "w-auto" : "w-12"
          )}>
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary font-bold text-xl">
              WF
            </div>
            {isOpen && (
              <h1 className="text-white font-bold text-xl animate-fade-in">Welfare</h1>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="text-white hover:bg-white/10 hidden md:flex"
          >
            {isOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Dashboard */}
          <Link to="/dashboard" className={cn(
            "nav-link group",
            isActive('/dashboard') && "nav-link-active"
          )}>
            <ChartBar className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <span className="transition-all duration-300">แดชบอร์ด</span>
            )}
          </Link>
          
          {/* Welfare Forms */}
          <Link to="/forms" className={cn(
            "nav-link group",
            isActive('/forms') && "nav-link-active"
          )}>
            <File className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <span className="transition-all duration-300">แบบฟอร์มขอสวัสดิการ</span>
            )}
          </Link>
          
          {/* Admin Panel (only for admin) */}
          {user.role === 'admin' && (
            <Link to="/admin" className={cn(
              "nav-link group",
              isActive('/admin') && "nav-link-active"
            )}>
              <CheckSquare className="h-5 w-5 flex-shrink-0" />
              {isOpen && (
                <span className="transition-all duration-300">อนุมัติคำร้อง</span>
              )}
            </Link>
          )}
          
          {/* Notifications */}
          <Link to="/notifications" className={cn(
            "nav-link group",
            isActive('/notifications') && "nav-link-active"
          )}>
            <Bell className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <span className="transition-all duration-300">การแจ้งเตือน</span>
            )}
          </Link>
          
          {/* Settings */}
          <Link to="/settings" className={cn(
            "nav-link group",
            isActive('/settings') && "nav-link-active"
          )}>
            <Settings className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <span className="transition-all duration-300">ตั้งค่า</span>
            )}
          </Link>
        </nav>
        
        {/* User profile & logout */}
        <div className="p-4 border-t border-white/20">
          <div className={cn(
            "flex items-center gap-3 mb-4",
            isOpen ? "justify-start" : "justify-center"
          )}>
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-primary font-bold">
              {user.name.charAt(0)}
            </div>
            
            {isOpen && (
              <div className="overflow-hidden">
                <p className="text-sm text-white font-medium truncate">{user.name}</p>
                <p className="text-xs text-white/70 truncate">{user.department}</p>
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            onClick={logout}
            className={cn(
              "w-full text-white hover:bg-white/10 flex items-center gap-2",
              !isOpen && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4" />
            {isOpen && <span>ออกจากระบบ</span>}
          </Button>
        </div>
      </div>
    </>
  );
}

// Helper icon components
function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m15 18-6-6 6-6"/>
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
