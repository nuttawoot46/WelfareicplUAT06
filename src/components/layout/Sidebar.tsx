import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  ChartBar,
  File,
  LogOut,
  Settings,
  CheckSquare,
  Bell,
  HomeIcon,
  Menu,
  X,
  Users,
  ShieldCheck,
  FileText,
  ChevronDown,
  UserPlus,
  BarChart3,
  Crown,
  Database,
  Shield,
  Activity,
  HelpCircle,
  Layout,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ProfilePictureUpload } from "@/components/profile/ProfilePictureUpload";

export function Sidebar() {
  const { user, profile, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  // Make role check case-insensitive
  const userRole = profile?.role?.toLowerCase() || '';
  const isAdmin = userRole === 'admin';
  const isSuperAdmin = userRole === 'superadmin';
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  // Mobile responsive management
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Submenu states
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const toggleSubmenu = (menuKey: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const isActive = (path: string) => location.pathname === path;

  const isSubmenuActive = (paths: string[]) => {
    return paths.some(path => location.pathname.includes(path));
  };

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

  // Sync avatar URL when profile changes
  useEffect(() => {
    if (profile?.avatar_url !== undefined) {
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile?.avatar_url]);

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
          {/* Home Page */}
          <Link to="/dashboard" className={cn(
            "nav-link group",
            isActive('/dashboard') ? "nav-link-active" : "text-white/90 hover:text-white"
          )}>
            <HomeIcon className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <span className="transition-all duration-300 text-white font-medium">หน้าหลัก</span>
            )}
          </Link>

          {/* Dashboard Menu with Dropdown */}
          <div className="relative">
            <div
              className={cn(
                "nav-link group cursor-pointer",
                isSubmenuActive(['/welfare-dashboard', '/accounting-dashboard']) ? "nav-link-active" : "text-white/90 hover:text-white"
              )}
              onClick={() => isOpen && toggleSubmenu('dashboard')}
              onMouseEnter={() => !isOpen && setOpenSubmenus(prev => ({ ...prev, dashboard: true }))}
              onMouseLeave={() => !isOpen && setOpenSubmenus(prev => ({ ...prev, dashboard: false }))}
            >
              <ChartBar className="h-5 w-5 flex-shrink-0" />
              {isOpen && (
                <>
                  <span className="transition-all duration-300 text-white font-medium">แดชบอร์ด</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 ml-auto transition-transform duration-200",
                    openSubmenus.dashboard && "rotate-180"
                  )} />
                </>
              )}
            </div>

            {/* Dashboard Submenu */}
            {(openSubmenus.dashboard || !isOpen) && (
              <div className={cn(
                isOpen ? "mt-2 ml-6 space-y-1" : "absolute left-full top-0 ml-2 w-64 bg-white rounded-lg shadow-xl border z-50 p-2"
              )}>
                <Link to="/welfare-dashboard" className={cn(
                  "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                  isOpen ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}>
                  <BarChart3 className="h-4 w-4" />
                  <span>แดชบอร์ดสวัสดิการ</span>
                </Link>
                <Link to="/accounting-dashboard" className={cn(
                  "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                  isOpen ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}>
                  <FileText className="h-4 w-4" />
                  <span>แดชบอร์ดบัญชี</span>
                </Link>
              </div>
            )}
          </div>

          {/* Accounting Review Menu with Dropdown (for accounting role only) */}
          {(userRole === 'accounting' || userRole === 'accountingandmanager') && (
            <div className="relative">
              <div
                className={cn(
                  "nav-link group cursor-pointer",
                  isSubmenuActive(['/accounting-review', '/welfare-accounting-review', '/general-accounting-review']) ? "nav-link-active" : "text-white/90 hover:text-white"
                )}
                onClick={() => isOpen && toggleSubmenu('accounting')}
                onMouseEnter={() => !isOpen && setOpenSubmenus(prev => ({ ...prev, accounting: true }))}
                onMouseLeave={() => !isOpen && setOpenSubmenus(prev => ({ ...prev, accounting: false }))}
              >
                <FileText className="h-5 w-5 flex-shrink-0" />
                {isOpen && (
                  <>
                    <span className="transition-all duration-300 text-white font-medium">รายการรอตรวจสอบ (บัญชี)</span>
                    <ChevronDown className={cn(
                      "h-4 w-4 ml-auto transition-transform duration-200",
                      openSubmenus.accounting && "rotate-180"
                    )} />
                  </>
                )}
              </div>

              {/* Accounting Review Submenu */}
              {(openSubmenus.accounting || !isOpen) && (
                <div className={cn(
                  isOpen ? "mt-2 ml-6 space-y-1" : "absolute left-full top-0 ml-2 w-64 bg-white rounded-lg shadow-xl border z-50 p-2"
                )}>

                  <Link to="/welfare-accounting-review" className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                    isOpen ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}>
                    <FileText className="h-4 w-4" />
                    <span>ตรวจสอบสวัสดิการ</span>
                  </Link>
                  <Link to="/general-accounting-review" className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                    isOpen ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}>
                    <FileText className="h-4 w-4" />
                    <span>ตรวจสอบบัญชีทั่วไป</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Forms Menu with Dropdown */}
          <div className="relative">
            <div
              className={cn(
                "nav-link group cursor-pointer",
                isSubmenuActive(['/forms', '/welfare-forms', '/accounting-forms']) ? "nav-link-active" : "text-white/90 hover:text-white"
              )}
              onClick={() => isOpen && toggleSubmenu('forms')}
              onMouseEnter={() => !isOpen && setOpenSubmenus(prev => ({ ...prev, forms: true }))}
              onMouseLeave={() => !isOpen && setOpenSubmenus(prev => ({ ...prev, forms: false }))}
            >
              <File className="h-5 w-5 flex-shrink-0" />
              {isOpen && (
                <>
                  <span className="transition-all duration-300 text-white font-medium">แบบฟอร์ม</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 ml-auto transition-transform duration-200",
                    openSubmenus.forms && "rotate-180"
                  )} />
                </>
              )}
            </div>

            {/* Forms Submenu */}
            {(openSubmenus.forms || !isOpen) && (
              <div className={cn(
                isOpen ? "mt-2 ml-6 space-y-1" : "absolute left-full top-0 ml-2 w-64 bg-white rounded-lg shadow-xl border z-50 p-2"
              )}>
                <Link to="/welfare-forms" className={cn(
                  "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                  isOpen ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}>
                  <File className="h-4 w-4" />
                  <span>ฟอร์ม HR</span>
                </Link>
                <Link to="/accounting-forms" className={cn(
                  "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                  isOpen ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}>
                  <FileText className="h-4 w-4" />
                  <span>ฟอร์ม บัญชี</span>
                </Link>
              </div>
            )}
          </div>



          {/* Approval Page */}
          {(userRole === 'manager' || userRole === 'accountingandmanager' || userRole === 'admin') && (
            <Link to="/approve" className={cn(
              "nav-link group",
              isActive('/approve') ? "nav-link-active" : "text-white/90 hover:text-white"
            )}>
              <CheckSquare className="h-5 w-5 flex-shrink-0" />
              {isOpen && (
                <span className="transition-all duration-300 text-white font-medium">อนุมัติคำร้อง (ผู้จัดการ)</span>
              )}
            </Link>
          )}

          {/* HR Approval Page - Admin only */}
          {(userRole === 'admin' || userRole === 'hr') && (
            <Link to="/hr-approve" className={cn(
              "nav-link group",
              isActive('/hr-approve') ? "nav-link-active" : "text-white/90 hover:text-white"
            )}>
              <Users className="h-5 w-5 flex-shrink-0" />
              {isOpen && (
                <span className="transition-all duration-300 text-white font-medium">อนุมัติคำร้อง (HR)</span>
              )}
            </Link>
          )}

          {/* Special Approval Page - For kanin.s@icpladda.com and Admin */}
          {(user?.email === 'kanin.s@icpladda.com' || userRole === 'admin') && (
            <Link to="/special-approve" className={cn(
              "nav-link group",
              isActive('/special-approve') ? "nav-link-active" : "text-white/90 hover:text-white"
            )}>
              <ShieldCheck className="h-5 w-5 flex-shrink-0" />
              {isOpen && (
                <span className="transition-all duration-300 text-white font-medium">อนุมัติโดย กรรมการผู้จัดการ</span>
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

          {/* SuperAdmin */}
          {isSuperAdmin && (
            <div className="relative">
              <div
                className={cn(
                  "nav-link group cursor-pointer",
                  isSubmenuActive(['/superadmin']) ? "nav-link-active" : "text-white/90 hover:text-white"
                )}
                onClick={() => isOpen && toggleSubmenu('superadmin')}
                onMouseEnter={() => !isOpen && setOpenSubmenus(prev => ({ ...prev, superadmin: true }))}
                onMouseLeave={() => !isOpen && setOpenSubmenus(prev => ({ ...prev, superadmin: false }))}
              >
                <Crown className="h-5 w-5 flex-shrink-0" />
                {isOpen && (
                  <>
                    <span className="transition-all duration-300 text-white font-medium">SuperAdmin</span>
                    <ChevronDown className={cn(
                      "h-4 w-4 ml-auto transition-transform duration-200",
                      openSubmenus.superadmin && "rotate-180"
                    )} />
                  </>
                )}
              </div>

              {/* Submenu */}
              {(openSubmenus.superadmin || !isOpen) && (
                <div className={cn(
                  isOpen ? "mt-2 ml-6 space-y-1" : "absolute left-full top-0 ml-2 w-64 bg-white rounded-lg shadow-xl border z-50 p-2"
                )}>
                  <Link to="/superadmin/dashboard" className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                    isOpen ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}>
                    <ChartBar className="h-4 w-4" />
                    <span>แดชบอร์ด</span>
                  </Link>
                  <Link to="/superadmin/users" className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                    isOpen ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}>
                    <UserPlus className="h-4 w-4" />
                    <span>จัดการผู้ใช้</span>
                  </Link>
                  <Link to="/superadmin/system" className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                    isOpen ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}>
                    <Settings className="h-4 w-4" />
                    <span>ตั้งค่าระบบ</span>
                  </Link>
                  <Link to="/superadmin/database" className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                    isOpen ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}>
                    <Database className="h-4 w-4" />
                    <span>ฐานข้อมูล</span>
                  </Link>
                  <Link to="/superadmin/security" className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                    isOpen ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}>
                    <Shield className="h-4 w-4" />
                    <span>ความปลอดภัย</span>
                  </Link>
                  <Link to="/superadmin/audit" className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                    isOpen ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}>
                    <Activity className="h-4 w-4" />
                    <span>บันทึกการใช้งาน</span>
                  </Link>
                  <Link to="/superadmin/report" className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                    isOpen ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}>
                    <BarChart3 className="h-4 w-4" />
                    <span>รายงาน</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Admin */}
          {profile?.role === 'admin' && (
            <div className="relative">
              <div
                className={cn(
                  "nav-link group cursor-pointer",
                  isSubmenuActive(['/admin']) ? "nav-link-active" : "text-white/90 hover:text-white"
                )}
                onClick={() => isOpen && toggleSubmenu('admin')}
                onMouseEnter={() => !isOpen && setOpenSubmenus(prev => ({ ...prev, admin: true }))}
                onMouseLeave={() => !isOpen && setOpenSubmenus(prev => ({ ...prev, admin: false }))}
              >
                <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                {isOpen && (
                  <>
                    <span className="transition-all duration-300 text-white font-medium">ผู้ดูแลระบบ</span>
                    <ChevronDown className={cn(
                      "h-4 w-4 ml-auto transition-transform duration-200",
                      openSubmenus.admin && "rotate-180"
                    )} />
                  </>
                )}
              </div>

              {/* Submenu */}
              {(openSubmenus.admin || !isOpen) && (
                <div className={cn(
                  isOpen ? "mt-2 ml-6 space-y-1" : "absolute left-full top-0 ml-2 w-64 bg-white rounded-lg shadow-xl border z-50 p-2"
                )}>
                  <Link to="/admin#users" className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                    isOpen ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}>
                    <UserPlus className="h-4 w-4" />
                    <span>จัดการผู้ใช้</span>
                  </Link>
                  <Link to="/admin/support" className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                    isOpen ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}>
                    <HelpCircle className="h-4 w-4" />
                    <span>จัดการ Support</span>
                  </Link>
                  <Link to="/admin/announcements" className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                    isOpen ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}>
                    <Bell className="h-4 w-4" />
                    <span>จัดการประกาศ</span>
                  </Link>
                  <Link to="/admin/forms" className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                    isOpen ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}>
                    <Layout className="h-4 w-4" />
                    <span>จัดการฟอร์ม</span>
                  </Link>
                  <Link to="/admin/report" className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                    isOpen ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}>
                    <BarChart3 className="h-4 w-4" />
                    <span>รายงาน</span>
                  </Link>

                </div>
              )}
            </div>
          )}

          {/* Activity History - visible to all roles except superadmin (who uses /superadmin/audit) */}
          {!isSuperAdmin && (
            <Link to="/activity-history" className={cn(
              "nav-link group",
              isActive('/activity-history') ? "nav-link-active" : "text-white/90 hover:text-white"
            )}>
              <Activity className="h-5 w-5 flex-shrink-0" />
              {isOpen && (
                <span className="transition-all duration-300 text-white font-medium">ประวัติกิจกรรม</span>
              )}
            </Link>
          )}

          {/* User Guide */}
          <Link to="/user-guide" className={cn(
            "nav-link group",
            isActive('/user-guide') ? "nav-link-active" : "text-white/90 hover:text-white"
          )}>
            <BookOpen className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <span className="transition-all duration-300 text-white font-medium">คู่มือการใช้งาน</span>
            )}
          </Link>

          {/* Support/IT Contact */}
          <Link to="/support" className={cn(
            "nav-link group",
            isActive('/support') ? "nav-link-active" : "text-white/90 hover:text-white"
          )}>
            <HelpCircle className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <span className="transition-all duration-300 text-white font-medium">ติดต่อฝ่าย IT</span>
            )}
          </Link>

        </nav>

        {/* User profile & logout */}
        <div className="p-4 border-t border-white/20 bg-white/5">
          <div className={cn(
            "flex items-center gap-3 mb-4 group relative",
            isOpen ? "justify-start" : "justify-center"
          )}>
            {/* Profile Picture with Upload */}
            <div className="relative">
              <ProfilePictureUpload
                currentAvatarUrl={avatarUrl}
                displayName={displayName}
                onAvatarUpdate={(newUrl) => setAvatarUrl(newUrl || null)}
                isOpen={isOpen}
              />

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
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
