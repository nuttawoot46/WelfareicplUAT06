import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useNavContext } from "@/hooks/useNavContext";
import {
  HomeIcon,
  Users,
  Banknote,
  CheckSquare,
  Menu,
  BarChart3,
  File,
  ChartBar,
  FileText,
  Plus,
  Bell,
  UserPlus,
  HelpCircle,
  Layout as LayoutIcon,
  BookOpen,
  Settings,
  Shield,
  Database,
  Activity,
  ShieldCheck,
  LogOut,
  User,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

export function MobileBottomNav() {
  const {
    user, profile, signOut, userRole, isAdmin, isSuperAdmin,
    isExecutive, hasSalesZone, displayName, email, department, position,
  } = useNavContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);

  if (!user) return null;

  const isTabActive = (paths: string[]) => {
    return paths.some(p => location.pathname.includes(p));
  };

  const showApprovalTab = isExecutive ||
    userRole === 'manager' ||
    userRole === 'accountingandmanager' ||
    userRole === 'admin' ||
    userRole === 'hr' ||
    user?.email === 'kanin.s@icpladda.com';

  // --- Sub-items for each drawer ---

  const hrItems: NavItem[] = [
    { path: "/welfare-dashboard", label: "แดชบอร์ดสวัสดิการ", icon: <BarChart3 className="h-5 w-5" /> },
    { path: "/welfare-forms", label: "ฟอร์ม HR", icon: <File className="h-5 w-5" /> },
  ];

  const accountingItems: NavItem[] = [
    { path: "/accounting-dashboard", label: "แดชบอร์ดบัญชี", icon: <ChartBar className="h-5 w-5" /> },
    { path: "/accounting-forms", label: "ฟอร์ม บัญชี", icon: <FileText className="h-5 w-5" /> },
    ...(hasSalesZone || userRole === 'accounting' || userRole === 'accountingandmanager' || isAdmin || isSuperAdmin ? [
      { path: "/payment-notification", label: "แจ้งชำระเงินใหม่", icon: <Plus className="h-5 w-5" /> },
      { path: "/payment-notification-list", label: "รายการแจ้งชำระเงิน", icon: <FileText className="h-5 w-5" /> },
    ] : []),
    ...(userRole === 'accounting' || userRole === 'accountingandmanager' ? [
      { path: "/welfare-accounting-review", label: "ตรวจสอบสวัสดิการ", icon: <FileText className="h-5 w-5" /> },
      { path: "/general-accounting-review", label: "ตรวจสอบบัญชีทั่วไป", icon: <FileText className="h-5 w-5" /> },
    ] : []),
  ];

  const approvalItems: NavItem[] = [
    ...(isExecutive ? [
      { path: "/executive-approve", label: "อนุมัติคำร้อง (หัวหน้า)", icon: <CheckSquare className="h-5 w-5" /> },
    ] : []),
    ...(userRole === 'manager' || userRole === 'accountingandmanager' || isAdmin ? [
      { path: "/approve", label: "อนุมัติคำร้อง (ผู้จัดการ)", icon: <CheckSquare className="h-5 w-5" /> },
    ] : []),
    ...(isAdmin || userRole === 'hr' ? [
      { path: "/hr-approve", label: "อนุมัติคำร้อง (HR)", icon: <Users className="h-5 w-5" /> },
    ] : []),
    ...(user?.email === 'kanin.s@icpladda.com' || isAdmin ? [
      { path: "/special-approve", label: "อนุมัติโดย กก.ผจก.", icon: <ShieldCheck className="h-5 w-5" /> },
    ] : []),
  ];

  const systemItems: NavItem[] = [
    { path: "/notifications", label: "แจ้งเตือน / ประวัติ", icon: <Bell className="h-5 w-5" /> },
    ...(profile?.role === 'admin' ? [
      { path: "/admin#users", label: "จัดการผู้ใช้", icon: <UserPlus className="h-5 w-5" /> },
      { path: "/admin/support", label: "จัดการ Support", icon: <HelpCircle className="h-5 w-5" /> },
      { path: "/admin/announcements", label: "จัดการประกาศ", icon: <Bell className="h-5 w-5" /> },
      { path: "/admin/forms", label: "จัดการฟอร์ม", icon: <LayoutIcon className="h-5 w-5" /> },
      { path: "/admin/pdf-templates", label: "จัดการเทมเพลต PDF", icon: <FileText className="h-5 w-5" /> },
      { path: "/admin/report", label: "รายงาน", icon: <BarChart3 className="h-5 w-5" /> },
    ] : []),
    ...(isSuperAdmin ? [
      { path: "/superadmin/dashboard", label: "SA แดชบอร์ด", icon: <ChartBar className="h-5 w-5" /> },
      { path: "/superadmin/users", label: "SA จัดการผู้ใช้", icon: <UserPlus className="h-5 w-5" /> },
      { path: "/superadmin/system", label: "SA ตั้งค่าระบบ", icon: <Settings className="h-5 w-5" /> },
      { path: "/superadmin/database", label: "SA ฐานข้อมูล", icon: <Database className="h-5 w-5" /> },
      { path: "/superadmin/security", label: "SA ความปลอดภัย", icon: <Shield className="h-5 w-5" /> },
      { path: "/superadmin/audit", label: "SA บันทึกการใช้งาน", icon: <Activity className="h-5 w-5" /> },
      { path: "/superadmin/report", label: "SA รายงาน", icon: <BarChart3 className="h-5 w-5" /> },
    ] : []),
    { path: "/user-guide", label: "คู่มือการใช้งาน", icon: <BookOpen className="h-5 w-5" /> },
    { path: "/support", label: "ติดต่อฝ่าย IT", icon: <HelpCircle className="h-5 w-5" /> },
  ];

  const drawerTitles: Record<string, string> = {
    hr: "HR",
    accounting: "บัญชี",
    approval: "อนุมัติ",
    more: "เพิ่มเติม",
  };

  const drawerItems: Record<string, NavItem[]> = {
    hr: hrItems,
    accounting: accountingItems,
    approval: approvalItems,
    more: systemItems,
  };

  const handleTabClick = (key: string, directPath?: string) => {
    if (directPath) {
      navigate(directPath);
      return;
    }
    setOpenDrawer(key);
  };

  const handleNavItemClick = (path: string) => {
    setOpenDrawer(null);
    navigate(path);
  };

  const handleLogout = () => {
    setOpenDrawer(null);
    signOut().catch(error => {
      console.error('Error in sign out:', error);
    });
  };

  // Tab definitions
  const tabs = [
    {
      key: "home",
      label: "หน้าหลัก",
      icon: <HomeIcon className="h-5 w-5" />,
      directPath: "/dashboard",
      activePaths: ["/dashboard"],
    },
    {
      key: "hr",
      label: "HR",
      icon: <Users className="h-5 w-5" />,
      activePaths: ["/welfare-dashboard", "/welfare-forms"],
    },
    {
      key: "accounting",
      label: "บัญชี",
      icon: <Banknote className="h-5 w-5" />,
      activePaths: ["/accounting-dashboard", "/accounting-forms", "/payment-notification", "/welfare-accounting-review", "/general-accounting-review"],
    },
    ...(showApprovalTab ? [{
      key: "approval",
      label: "อนุมัติ",
      icon: <CheckSquare className="h-5 w-5" />,
      activePaths: ["/executive-approve", "/approve", "/hr-approve", "/special-approve"],
    }] : []),
    {
      key: "more",
      label: "เพิ่มเติม",
      icon: <Menu className="h-5 w-5" />,
      activePaths: ["/notifications", "/admin", "/superadmin", "/user-guide", "/support"],
    },
  ];

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-200 xl:hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const active = isTabActive(tab.activePaths) || openDrawer === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key, tab.directPath)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors",
                  active ? "text-[#004F9F]" : "text-gray-400"
                )}
              >
                {tab.icon}
                <span className={cn(
                  "text-[10px] leading-tight",
                  active && "font-semibold"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Drawer for sub-menus */}
      <Drawer open={openDrawer !== null} onOpenChange={(open) => { if (!open) setOpenDrawer(null); }}>
        <DrawerContent className="max-h-[70vh]">
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle>{openDrawer ? drawerTitles[openDrawer] : ""}</DrawerTitle>
          </DrawerHeader>

          <div className="overflow-y-auto px-4 pb-4">
            {/* Navigation items */}
            {openDrawer && drawerItems[openDrawer] && (
              <div className="space-y-1">
                {drawerItems[openDrawer].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavItemClick(item.path)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                      location.pathname === item.path || location.pathname.includes(item.path)
                        ? "bg-blue-50 text-[#004F9F] font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Profile section in "More" drawer */}
            {openDrawer === "more" && (
              <>
                <div className="border-t border-gray-100 mt-3 pt-3">
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                      {email && <p className="text-xs text-gray-500 truncate">{email}</p>}
                      {department && <p className="text-xs text-gray-400 truncate">{department}</p>}
                      {position && <p className="text-xs text-gray-400 truncate">{position}</p>}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors mt-1"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
