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
  Users,
  ShieldCheck,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  BarChart3,
  Database,
  Shield,
  Activity,
  HelpCircle,
  Layout,
  BookOpen,
  Banknote,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavContext } from "@/hooks/useNavContext";
import { ProfilePictureUpload } from "@/components/profile/ProfilePictureUpload";

export function Sidebar() {
  const {
    user, profile, signOut, userRole, isAdmin, isSuperAdmin,
    isExecutive, hasSalesZone, displayName, email, department, position
  } = useNavContext();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  // Submenu states
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
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

  // Sync avatar URL when profile changes
  useEffect(() => {
    if (profile?.avatar_url !== undefined) {
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile?.avatar_url]);

  return (
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 transition-all duration-300 hidden xl:flex flex-col",
        isOpen ? "w-64" : "w-20"
      )}>
        {/* Logo and title */}
        <div className="flex items-center justify-between py-2 px-4 border-b border-gray-100">
          <a href="/dashboard" className={cn(
            "flex items-center gap-2 transition-all duration-300 overflow-hidden",
            isOpen ? "w-auto" : "w-12 justify-center"
          )}>
            <img
              src="/Picture/logo-Photoroom.jpg"
              alt="ICP Ladda"
              width="71"
              height="71"
              className="object-contain flex-shrink-0"
              style={{ width: '71px', height: '71px' }}
            />
            {isOpen && (
              <>
                <div className="h-5 w-px bg-gray-300 flex-shrink-0"></div>
                <span className="text-lg font-bold tracking-tight text-[#004F9F]">Jinglebell</span>
              </>
            )}
          </a>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden xl:flex text-gray-400 hover:text-gray-600 hover:bg-gray-100 h-8 w-8"
          >
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* Home Page */}
          <Link to="/dashboard" className={cn(
            "nav-link group",
            isActive('/dashboard') ? "nav-link-active" : ""
          )}>
            <HomeIcon className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <span className="transition-all duration-300 text-gray-900 font-medium">หน้าหลัก</span>
            )}
          </Link>

          {/* ═══════════ Section: HR ═══════════ */}
          <div className="relative">
            <div
              className={cn(
                "nav-link group cursor-pointer",
                isSubmenuActive(['/welfare-dashboard', '/welfare-forms']) ? "nav-link-active" : ""
              )}
              onClick={() => isOpen && toggleSubmenu('sectionHR')}
              onMouseEnter={() => !isOpen && setOpenSubmenus(prev => ({ ...prev, sectionHR: true }))}
              onMouseLeave={() => !isOpen && setOpenSubmenus(prev => ({ ...prev, sectionHR: false }))}
            >
              <Users className="h-5 w-5 flex-shrink-0" />
              {isOpen && (
                <>
                  <span className="transition-all duration-300 text-gray-900 font-medium">HR</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 ml-auto transition-transform duration-200",
                    openSubmenus.sectionHR && "rotate-180"
                  )} />
                </>
              )}
            </div>

            {(openSubmenus.sectionHR || !isOpen) && (
              <div className={cn(
                isOpen ? "mt-1 ml-6 space-y-1" : "absolute left-full top-0 ml-2 w-64 bg-white rounded-lg shadow-xl border z-50 p-2"
              )}>
                <Link to="/welfare-dashboard" className={cn(
                  "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                  isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}>
                  <BarChart3 className="h-4 w-4" />
                  <span>แดชบอร์ดสวัสดิการ</span>
                </Link>
                <Link to="/welfare-forms" className={cn(
                  "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                  isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}>
                  <File className="h-4 w-4" />
                  <span>ฟอร์ม HR</span>
                </Link>
              </div>
            )}
          </div>

          {/* ═══════════ Section: บัญชี ═══════════ */}
          <div className="relative">
            <div
              className={cn(
                "nav-link group cursor-pointer",
                isSubmenuActive(['/accounting-dashboard', '/accounting-forms', '/payment-notification', '/welfare-accounting-review', '/general-accounting-review']) ? "nav-link-active" : ""
              )}
              onClick={() => isOpen && toggleSubmenu('sectionAccounting')}
              onMouseEnter={() => !isOpen && setOpenSubmenus(prev => ({ ...prev, sectionAccounting: true }))}
              onMouseLeave={() => !isOpen && setOpenSubmenus(prev => ({ ...prev, sectionAccounting: false }))}
            >
              <Banknote className="h-5 w-5 flex-shrink-0" />
              {isOpen && (
                <>
                  <span className="transition-all duration-300 text-gray-900 font-medium">บัญชี</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 ml-auto transition-transform duration-200",
                    openSubmenus.sectionAccounting && "rotate-180"
                  )} />
                </>
              )}
            </div>

            {(openSubmenus.sectionAccounting || !isOpen) && (
              <div className={cn(
                isOpen ? "mt-1 ml-6 space-y-1" : "absolute left-full top-0 ml-2 w-64 bg-white rounded-lg shadow-xl border z-50 p-2"
              )}>
                <Link to="/accounting-dashboard" className={cn(
                  "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                  isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}>
                  <ChartBar className="h-4 w-4" />
                  <span>แดชบอร์ดบัญชี</span>
                </Link>
                <Link to="/accounting-forms" className={cn(
                  "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                  isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}>
                  <FileText className="h-4 w-4" />
                  <span>ฟอร์ม บัญชี</span>
                </Link>

                {/* Payment Notification */}
                {(hasSalesZone || userRole === 'accounting' || userRole === 'accountingandmanager' || userRole === 'admin' || isSuperAdmin) && (
                  <>
                    <Link to="/payment-notification" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <Plus className="h-4 w-4" />
                      <span>แจ้งชำระเงินใหม่</span>
                    </Link>
                    <Link to="/payment-notification-list" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <FileText className="h-4 w-4" />
                      <span>รายการแจ้งชำระเงิน</span>
                    </Link>
                  </>
                )}

                {/* Accounting Review */}
                {(userRole === 'accounting' || userRole === 'accountingandmanager') && (
                  <>
                    <Link to="/welfare-accounting-review" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <FileText className="h-4 w-4" />
                      <span>ตรวจสอบสวัสดิการ</span>
                    </Link>
                    <Link to="/general-accounting-review" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <FileText className="h-4 w-4" />
                      <span>ตรวจสอบบัญชีทั่วไป</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ═══════════ Section: อนุมัติ ═══════════ */}
          {(isExecutive || userRole === 'manager' || userRole === 'accountingandmanager' || userRole === 'admin' || userRole === 'hr' || user?.email === 'kanin.s@icpladda.com') && (
            <div className="relative">
              <div
                className={cn(
                  "nav-link group cursor-pointer",
                  isSubmenuActive(['/executive-approve', '/approve', '/hr-approve', '/special-approve']) ? "nav-link-active" : ""
                )}
                onClick={() => isOpen && toggleSubmenu('sectionApproval')}
                onMouseEnter={() => !isOpen && setOpenSubmenus(prev => ({ ...prev, sectionApproval: true }))}
                onMouseLeave={() => !isOpen && setOpenSubmenus(prev => ({ ...prev, sectionApproval: false }))}
              >
                <CheckSquare className="h-5 w-5 flex-shrink-0" />
                {isOpen && (
                  <>
                    <span className="transition-all duration-300 text-gray-900 font-medium">อนุมัติ</span>
                    <ChevronDown className={cn(
                      "h-4 w-4 ml-auto transition-transform duration-200",
                      openSubmenus.sectionApproval && "rotate-180"
                    )} />
                  </>
                )}
              </div>

              {(openSubmenus.sectionApproval || !isOpen) && (
                <div className={cn(
                  isOpen ? "mt-1 ml-6 space-y-1" : "absolute left-full top-0 ml-2 w-64 bg-white rounded-lg shadow-xl border z-50 p-2"
                )}>
                  {/* Executive Approval */}
                  {isExecutive && (
                    <Link to="/executive-approve" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <CheckSquare className="h-4 w-4" />
                      <span>อนุมัติคำร้อง (หัวหน้า)</span>
                    </Link>
                  )}

                  {/* Manager Approval */}
                  {(userRole === 'manager' || userRole === 'accountingandmanager' || userRole === 'admin') && (
                    <Link to="/approve" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <CheckSquare className="h-4 w-4" />
                      <span>อนุมัติคำร้อง (ผู้จัดการ)</span>
                    </Link>
                  )}

                  {/* HR Approval */}
                  {(userRole === 'admin' || userRole === 'hr') && (
                    <Link to="/hr-approve" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <Users className="h-4 w-4" />
                      <span>อนุมัติคำร้อง (HR)</span>
                    </Link>
                  )}

                  {/* Special Approval */}
                  {(user?.email === 'kanin.s@icpladda.com' || userRole === 'admin') && (
                    <Link to="/special-approve" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <ShieldCheck className="h-4 w-4" />
                      <span>อนุมัติโดย กก.ผจก.</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══════════ Section: ระบบ ═══════════ */}
          <div className="relative">
            <div
              className={cn(
                "nav-link group cursor-pointer",
                isSubmenuActive(['/notifications', '/admin', '/superadmin', '/user-guide', '/support']) ? "nav-link-active" : ""
              )}
              onClick={() => isOpen && toggleSubmenu('sectionSystem')}
              onMouseEnter={() => !isOpen && setOpenSubmenus(prev => ({ ...prev, sectionSystem: true }))}
              onMouseLeave={() => !isOpen && setOpenSubmenus(prev => ({ ...prev, sectionSystem: false }))}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {isOpen && (
                <>
                  <span className="transition-all duration-300 text-gray-900 font-medium">ระบบ</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 ml-auto transition-transform duration-200",
                    openSubmenus.sectionSystem && "rotate-180"
                  )} />
                </>
              )}
            </div>

            {(openSubmenus.sectionSystem || !isOpen) && (
              <div className={cn(
                isOpen ? "mt-1 ml-6 space-y-1" : "absolute left-full top-0 ml-2 w-64 bg-white rounded-lg shadow-xl border z-50 p-2"
              )}>
                {/* Notifications */}
                <Link to="/notifications" className={cn(
                  "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                  isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}>
                  <Bell className="h-4 w-4" />
                  <span>แจ้งเตือน / ประวัติ</span>
                </Link>

                {/* Admin */}
                {profile?.role === 'admin' && (
                  <>
                    <Link to="/admin#users" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <UserPlus className="h-4 w-4" />
                      <span>จัดการผู้ใช้</span>
                    </Link>
                    <Link to="/admin/support" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <HelpCircle className="h-4 w-4" />
                      <span>จัดการ Support</span>
                    </Link>
                    <Link to="/admin/announcements" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <Bell className="h-4 w-4" />
                      <span>จัดการประกาศ</span>
                    </Link>
                    <Link to="/admin/forms" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <Layout className="h-4 w-4" />
                      <span>จัดการฟอร์ม</span>
                    </Link>
                    <Link to="/admin/pdf-templates" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <FileText className="h-4 w-4" />
                      <span>จัดการเทมเพลต PDF</span>
                    </Link>
                    <Link to="/admin/report" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <BarChart3 className="h-4 w-4" />
                      <span>รายงาน</span>
                    </Link>
                  </>
                )}

                {/* SuperAdmin */}
                {isSuperAdmin && (
                  <>
                    <Link to="/superadmin/dashboard" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <ChartBar className="h-4 w-4" />
                      <span>SA แดชบอร์ด</span>
                    </Link>
                    <Link to="/superadmin/users" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <UserPlus className="h-4 w-4" />
                      <span>SA จัดการผู้ใช้</span>
                    </Link>
                    <Link to="/superadmin/system" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <Settings className="h-4 w-4" />
                      <span>SA ตั้งค่าระบบ</span>
                    </Link>
                    <Link to="/superadmin/database" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <Database className="h-4 w-4" />
                      <span>SA ฐานข้อมูล</span>
                    </Link>
                    <Link to="/superadmin/security" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <Shield className="h-4 w-4" />
                      <span>SA ความปลอดภัย</span>
                    </Link>
                    <Link to="/superadmin/audit" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <Activity className="h-4 w-4" />
                      <span>SA บันทึกการใช้งาน</span>
                    </Link>
                    <Link to="/superadmin/report" className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                      isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}>
                      <BarChart3 className="h-4 w-4" />
                      <span>SA รายงาน</span>
                    </Link>
                  </>
                )}

                {/* User Guide */}
                <Link to="/user-guide" className={cn(
                  "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                  isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}>
                  <BookOpen className="h-4 w-4" />
                  <span>คู่มือการใช้งาน</span>
                </Link>

                {/* Support/IT Contact */}
                <Link to="/support" className={cn(
                  "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                  isOpen ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}>
                  <HelpCircle className="h-4 w-4" />
                  <span>ติดต่อฝ่าย IT</span>
                </Link>
              </div>
            )}
          </div>

        </nav>

        {/* User profile & logout */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
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
                <p className="text-base font-semibold text-gray-900 truncate">{displayName}</p>
                <div className="mt-0.5 space-y-0.5">
                  {email && <p className="text-xs text-gray-500 truncate">{email}</p>}
                  {department && <p className="text-xs text-gray-400 truncate">{department}</p>}
                  {position && <p className="text-xs text-gray-400 truncate">{position}</p>}
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
              "w-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2 font-medium",
              !isOpen && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4" />
            {isOpen && <span>ออกจากระบบ</span>}
          </Button>
        </div>
      </div>
  );
}
