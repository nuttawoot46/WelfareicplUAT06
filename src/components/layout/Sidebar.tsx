import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  ChartBar, 
  File, 
  LogOut, 
  Settings, 
  CheckSquare, 
  Bell,
  Menu,
  X,
  CheckCircle,
  Users,
  ShieldCheck,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function Sidebar() {
  const { user, profile, signOut } = useAuth();
  console.log('Sidebar - Profile:', profile);
  console.log('Sidebar - Profile Role:', profile?.role);
  // Make role check case-insensitive
  const userRole = profile?.role?.toLowerCase() || '';
  const isAdmin = userRole === 'admin';
  console.log('Sidebar - User:', user);
  console.log('Sidebar - Profile:', profile);
  console.log('Sidebar - User Role:', userRole);
  console.log('Sidebar - isAdmin:', isAdmin);
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

  // Get user information with priority to profile data
  const displayName = profile?.display_name || 
                     `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
                     user?.user_metadata?.full_name ||
                     user?.email?.split('@')[0] ||
                     "User";
  const email = user?.email || '';
  const department = profile?.department || '';
  const position = profile?.position || '';
  const displayInitial = displayName.charAt(0).toUpperCase();

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
        "dark:bg-card",
        isOpen ? "w-64" : "w-20",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo and title */}
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <div className={cn(
            "flex items-center gap-3 transition-all duration-300 overflow-hidden",
            isOpen ? "w-auto" : "w-12"
          )}>
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center">
              <img 
                src="/Picture/logo-Photoroom.jpg" 
                alt="ICP Ladda Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            {isOpen && (
              <h1 className="text-white font-bold text-xl animate-fade-in">ICP Ladda</h1>
            )}
          </div>
          

        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Dashboard */}
          <Link 
            to="/dashboard" 
            className={cn(
              "nav-link group",
              isActive('/dashboard') ? "nav-link-active" : "text-white/90 hover:text-white"
            )}
          >
            <ChartBar className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <span className="transition-all duration-300 text-white font-medium">แดชบอร์ด</span>
            )}
          </Link>

          {/* Accounting Review Menu (for accounting role only) */}
          {(userRole === 'accounting' || userRole === 'accountingandmanager') && (
            <Link to="/accounting-review" className={cn(
              "nav-link group",
              isActive('/accounting-review') ? "nav-link-active" : "text-white/90 hover:text-white"
            )}>
              <FileText className="h-5 w-5 flex-shrink-0" />
              {isOpen && (
                <span className="transition-all duration-300 text-white font-medium">รายการรอตรวจสอบ (บัญชี)</span>
              )}
            </Link>
          )}

          {/* Welfare Forms */}
          <Link to="/forms" className={cn(
            "nav-link group",
            isActive('/forms') ? "nav-link-active" : "text-white/90 hover:text-white"
          )}>
            <File className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <span className="transition-all duration-300 text-white font-medium">แบบฟอร์มขอสวัสดิการ</span>
            )}
          </Link>
          
          {/* Approval Page */}
          {(userRole === 'manager' || userRole === 'accountingandmanager' || userRole === 'admin') && (
            <Link to="/approve" className={cn(
              "nav-link group",
              isActive('/approve') ? "nav-link-active" : "text-white/90 hover:text-white"
            )}>
              <CheckSquare className="h-5 w-5 flex-shrink-0" />
              {isOpen && (
                <span className="transition-all duration-300 text-white font-medium">อนุมัติคำร้อง</span>
              )}
            </Link>
          )}
          
          {/* Notifications */}
          <Link to="/notifications" className={cn(
            "nav-link group",
            isActive('/notifications') ? "nav-link-active" : "text-white/90 hover:text-white"
          )}>
            <Bell className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <span className="transition-all duration-300 text-white font-medium">การแจ้งเตือน</span>
            )}
          </Link>
          
          {/* Admin */}
          {profile?.role === 'admin' && (
            <Link to="/admin#users" className={cn(
              "nav-link group",
              isActive('/admin') ? "nav-link-active" : "text-white/90 hover:text-white"
            )}>
              <ShieldCheck className="h-5 w-5 flex-shrink-0" />
              {isOpen && (
                <span className="transition-all duration-300 text-white font-medium">ผู้ดูแลระบบ</span>
              )}
            </Link>
          )}
          
          {/* Settings */}
          <Link to="/settings" className={cn(
            "nav-link group",
            isActive('/settings') ? "nav-link-active" : "text-white/90 hover:text-white"
          )}>
            <Settings className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <span className="transition-all duration-300 text-white font-medium">ตั้งค่า</span>
            )}
          </Link>
        </nav>
        
        {/* User profile & logout */}
        <div className="p-4 border-t border-white/20 bg-white/5">
          <div className={cn(
            "flex items-center gap-3 mb-4 group relative",
            isOpen ? "justify-start" : "justify-center"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-primary font-bold text-xl",
              !isOpen && "group-hover:bg-white/80 transition-colors",
              "shadow-md"
            )}>
              {displayInitial}
              
              {/* Tooltip for collapsed state */}
              {!isOpen && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all duration-200 z-50 shadow-xl">
                  <div className="font-semibold">{displayName}</div>
                  <div className="mt-1 pt-1 space-y-1 border-t border-white/10">
                    {email && <div className="text-xs text-gray-300">{email}</div>}
                    {department && <div className="text-xs text-gray-300">{department}</div>}
                    {position && <div className="text-xs text-gray-300">{position}</div>}
                  </div>
                </div>
              )}
            </div>
            
            {isOpen && (
              <div className="overflow-hidden">
                <p className="text-base font-semibold text-white truncate">{displayName}</p>
                <div className="mt-0.5 space-y-0.5">
                  {email && <p className="text-xs text-white/80 truncate">{email}</p>}
                  {(department || position) && (
                    <div className="flex gap-2">
                      {department && <p className="text-xs text-white/70 truncate">{department}</p>}
                      {position && department && <span className="text-white/50">•</span>}
                      {position && <p className="text-xs text-white/70 truncate">{position}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              // Add a small delay to ensure the click is processed
              setTimeout(() => {
                signOut().catch(error => {
                  console.error('Error in sign out callback:', error);
                  // The AuthContext will handle the redirect even if there's an error
                });
              }, 100);
            }}
            className={cn(
              "w-full text-white hover:bg-white/20 flex items-center gap-2 font-medium",
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
