import {
  HomeIcon,
  Users,
  Banknote,
  CheckSquare,
  Settings,
  BarChart3,
  File,
  ChartBar,
  FileText,
  Plus,
  Bell,
  UserPlus,
  HelpCircle,
  Layout,
  BookOpen,
  ShieldCheck,
  Database,
  Shield,
  Activity,
} from 'lucide-react';
import type { MenuSectionDef, MenuItemDef } from '@/types/sidebar';

// ═══════════ SECTIONS ═══════════

export const MENU_SECTIONS: MenuSectionDef[] = [
  {
    id: 'home',
    label: 'หน้าหลัก',
    icon: HomeIcon,
    order: 0,
    visibility: { alwaysVisible: true },
    activePaths: ['/dashboard'],
  },
  {
    id: 'hr',
    label: 'HR',
    icon: Users,
    order: 1,
    visibility: { alwaysVisible: true },
    activePaths: ['/welfare-dashboard', '/welfare-forms'],
  },
  {
    id: 'accounting',
    label: 'บัญชี',
    icon: Banknote,
    order: 2,
    visibility: { alwaysVisible: true },
    activePaths: [
      '/accounting-dashboard',
      '/accounting-forms',
      '/payment-notification',
      '/welfare-accounting-review',
      '/general-accounting-review',
    ],
  },
  {
    id: 'approval',
    label: 'อนุมัติ',
    icon: CheckSquare,
    order: 3,
    visibility: {
      roles: ['manager', 'accountingandmanager', 'admin', 'hr'],
      requiresExecutive: true,
      requiresEmail: ['kanin.s@icpladda.com'],
    },
    activePaths: ['/executive-approve', '/approve', '/hr-approve', '/special-approve'],
  },
  {
    id: 'system',
    label: 'ระบบ',
    icon: Settings,
    order: 4,
    visibility: { alwaysVisible: true },
    activePaths: ['/notifications', '/admin', '/superadmin', '/user-guide', '/support'],
  },
];

// ═══════════ MENU ITEMS ═══════════

export const MENU_ITEMS: MenuItemDef[] = [
  // ── Home ──
  {
    id: 'home.dashboard',
    sectionId: 'home',
    label: 'หน้าหลัก',
    path: '/dashboard',
    icon: HomeIcon,
    visibility: { alwaysVisible: true },
    order: 0,
    searchKeywords: ['dashboard', 'home', 'แดชบอร์ด'],
  },

  // ── HR ──
  {
    id: 'hr.welfare-dashboard',
    sectionId: 'hr',
    label: 'แดชบอร์ดสวัสดิการ',
    path: '/welfare-dashboard',
    icon: BarChart3,
    visibility: { alwaysVisible: true },
    order: 0,
    searchKeywords: ['welfare', 'dashboard', 'สวัสดิการ'],
  },
  {
    id: 'hr.welfare-forms',
    sectionId: 'hr',
    label: 'ฟอร์ม HR',
    path: '/welfare-forms',
    icon: File,
    visibility: { alwaysVisible: true },
    order: 1,
    searchKeywords: ['form', 'hr', 'ฟอร์ม'],
  },

  // ── Accounting ──
  {
    id: 'accounting.dashboard',
    sectionId: 'accounting',
    label: 'แดชบอร์ดบัญชี',
    path: '/accounting-dashboard',
    icon: ChartBar,
    visibility: { alwaysVisible: true },
    order: 0,
    searchKeywords: ['accounting', 'dashboard', 'บัญชี'],
  },
  {
    id: 'accounting.forms',
    sectionId: 'accounting',
    label: 'ฟอร์ม บัญชี',
    path: '/accounting-forms',
    icon: FileText,
    visibility: { alwaysVisible: true },
    order: 1,
    searchKeywords: ['accounting', 'form', 'ฟอร์ม', 'บัญชี'],
  },
  {
    id: 'accounting.payment-notification',
    sectionId: 'accounting',
    label: 'แจ้งชำระเงินใหม่',
    path: '/payment-notification',
    icon: Plus,
    visibility: {
      roles: ['accounting', 'accountingandmanager', 'admin'],
      requiresSalesZone: true,
    },
    order: 2,
    searchKeywords: ['payment', 'notification', 'ชำระเงิน', 'แจ้ง'],
  },
  {
    id: 'accounting.payment-notification-list',
    sectionId: 'accounting',
    label: 'รายการแจ้งชำระเงิน',
    path: '/payment-notification-list',
    icon: FileText,
    visibility: {
      roles: ['accounting', 'accountingandmanager', 'admin'],
      requiresSalesZone: true,
    },
    order: 3,
    searchKeywords: ['payment', 'list', 'รายการ', 'ชำระเงิน'],
  },
  {
    id: 'accounting.welfare-review',
    sectionId: 'accounting',
    label: 'ตรวจสอบสวัสดิการ',
    path: '/welfare-accounting-review',
    icon: FileText,
    visibility: { roles: ['accounting', 'accountingandmanager'] },
    order: 4,
    searchKeywords: ['review', 'welfare', 'ตรวจสอบ', 'สวัสดิการ'],
  },
  {
    id: 'accounting.general-review',
    sectionId: 'accounting',
    label: 'ตรวจสอบบัญชีทั่วไป',
    path: '/general-accounting-review',
    icon: FileText,
    visibility: { roles: ['accounting', 'accountingandmanager'] },
    order: 5,
    searchKeywords: ['review', 'general', 'ตรวจสอบ', 'บัญชี', 'ทั่วไป'],
  },

  // ── Approval ──
  {
    id: 'approval.executive',
    sectionId: 'approval',
    label: 'อนุมัติคำร้อง (หัวหน้า)',
    path: '/executive-approve',
    icon: CheckSquare,
    visibility: { requiresExecutive: true },
    order: 0,
    searchKeywords: ['approve', 'executive', 'อนุมัติ', 'หัวหน้า'],
  },
  {
    id: 'approval.manager',
    sectionId: 'approval',
    label: 'อนุมัติคำร้อง (ผู้จัดการ)',
    path: '/approve',
    icon: CheckSquare,
    visibility: { roles: ['manager', 'accountingandmanager', 'admin'] },
    order: 1,
    searchKeywords: ['approve', 'manager', 'อนุมัติ', 'ผู้จัดการ'],
  },
  {
    id: 'approval.hr',
    sectionId: 'approval',
    label: 'อนุมัติคำร้อง (HR)',
    path: '/hr-approve',
    icon: Users,
    visibility: { roles: ['admin', 'hr'] },
    order: 2,
    searchKeywords: ['approve', 'hr', 'อนุมัติ'],
  },
  {
    id: 'approval.special',
    sectionId: 'approval',
    label: 'อนุมัติโดย กก.ผจก.',
    path: '/special-approve',
    icon: ShieldCheck,
    visibility: { roles: ['admin'], requiresEmail: ['kanin.s@icpladda.com'] },
    order: 3,
    searchKeywords: ['approve', 'special', 'อนุมัติ', 'กก.ผจก.'],
  },

  // ── System ──
  {
    id: 'system.notifications',
    sectionId: 'system',
    label: 'แจ้งเตือน / ประวัติ',
    path: '/notifications',
    icon: Bell,
    visibility: { alwaysVisible: true },
    order: 0,
    searchKeywords: ['notification', 'history', 'แจ้งเตือน', 'ประวัติ'],
  },
  {
    id: 'system.admin-users',
    sectionId: 'system',
    label: 'จัดการผู้ใช้',
    path: '/admin#users',
    icon: UserPlus,
    visibility: { roles: ['admin'] },
    order: 1,
    searchKeywords: ['admin', 'user', 'จัดการ', 'ผู้ใช้'],
  },
  {
    id: 'system.admin-support',
    sectionId: 'system',
    label: 'จัดการ Support',
    path: '/admin/support',
    icon: HelpCircle,
    visibility: { roles: ['admin'] },
    order: 2,
    searchKeywords: ['admin', 'support', 'จัดการ'],
  },
  {
    id: 'system.admin-announcements',
    sectionId: 'system',
    label: 'จัดการประกาศ',
    path: '/admin/announcements',
    icon: Bell,
    visibility: { roles: ['admin'] },
    order: 3,
    searchKeywords: ['admin', 'announcement', 'จัดการ', 'ประกาศ'],
  },
  {
    id: 'system.admin-forms',
    sectionId: 'system',
    label: 'จัดการฟอร์ม',
    path: '/admin/forms',
    icon: Layout,
    visibility: { roles: ['admin'] },
    order: 4,
    searchKeywords: ['admin', 'form', 'จัดการ', 'ฟอร์ม'],
  },
  {
    id: 'system.admin-pdf-templates',
    sectionId: 'system',
    label: 'จัดการเทมเพลต PDF',
    path: '/admin/pdf-templates',
    icon: FileText,
    visibility: { roles: ['admin'] },
    order: 5,
    searchKeywords: ['admin', 'pdf', 'template', 'จัดการ', 'เทมเพลต'],
  },
  {
    id: 'system.admin-report',
    sectionId: 'system',
    label: 'รายงาน',
    path: '/admin/report',
    icon: BarChart3,
    visibility: { roles: ['admin'] },
    order: 6,
    searchKeywords: ['admin', 'report', 'รายงาน'],
  },

  // ── SuperAdmin ──
  {
    id: 'system.sa-dashboard',
    sectionId: 'system',
    label: 'SA แดชบอร์ด',
    path: '/superadmin/dashboard',
    icon: ChartBar,
    visibility: { roles: ['superadmin'] },
    order: 10,
    searchKeywords: ['superadmin', 'dashboard', 'แดชบอร์ด'],
  },
  {
    id: 'system.sa-users',
    sectionId: 'system',
    label: 'SA จัดการผู้ใช้',
    path: '/superadmin/users',
    icon: UserPlus,
    visibility: { roles: ['superadmin'] },
    order: 11,
    searchKeywords: ['superadmin', 'user', 'จัดการ', 'ผู้ใช้'],
  },
  {
    id: 'system.sa-system',
    sectionId: 'system',
    label: 'SA ตั้งค่าระบบ',
    path: '/superadmin/system',
    icon: Settings,
    visibility: { roles: ['superadmin'] },
    order: 12,
    searchKeywords: ['superadmin', 'system', 'ตั้งค่า'],
  },
  {
    id: 'system.sa-database',
    sectionId: 'system',
    label: 'SA ฐานข้อมูล',
    path: '/superadmin/database',
    icon: Database,
    visibility: { roles: ['superadmin'] },
    order: 13,
    searchKeywords: ['superadmin', 'database', 'ฐานข้อมูล'],
  },
  {
    id: 'system.sa-security',
    sectionId: 'system',
    label: 'SA ความปลอดภัย',
    path: '/superadmin/security',
    icon: Shield,
    visibility: { roles: ['superadmin'] },
    order: 14,
    searchKeywords: ['superadmin', 'security', 'ความปลอดภัย'],
  },
  {
    id: 'system.sa-audit',
    sectionId: 'system',
    label: 'SA บันทึกการใช้งาน',
    path: '/superadmin/audit',
    icon: Activity,
    visibility: { roles: ['superadmin'] },
    order: 15,
    searchKeywords: ['superadmin', 'audit', 'บันทึก', 'การใช้งาน'],
  },
  {
    id: 'system.sa-report',
    sectionId: 'system',
    label: 'SA รายงาน',
    path: '/superadmin/report',
    icon: BarChart3,
    visibility: { roles: ['superadmin'] },
    order: 16,
    searchKeywords: ['superadmin', 'report', 'รายงาน'],
  },

  // ── Common System Items ──
  {
    id: 'system.user-guide',
    sectionId: 'system',
    label: 'คู่มือการใช้งาน',
    path: '/user-guide',
    icon: BookOpen,
    visibility: { alwaysVisible: true },
    order: 20,
    searchKeywords: ['guide', 'manual', 'คู่มือ', 'การใช้งาน'],
  },
  {
    id: 'system.support',
    sectionId: 'system',
    label: 'ติดต่อฝ่าย IT',
    path: '/support',
    icon: HelpCircle,
    visibility: { alwaysVisible: true },
    order: 21,
    searchKeywords: ['support', 'it', 'ติดต่อ', 'ช่วยเหลือ'],
  },
];

// Helper: ดึง items ตาม section
export function getItemsBySection(sectionId: string): MenuItemDef[] {
  return MENU_ITEMS
    .filter(item => item.sectionId === sectionId)
    .sort((a, b) => a.order - b.order);
}

// Helper: ค้นหา item ตาม id
export function getItemById(id: string): MenuItemDef | undefined {
  return MENU_ITEMS.find(item => item.id === id);
}

// Helper: ค้นหา section ตาม id
export function getSectionById(id: string): MenuSectionDef | undefined {
  return MENU_SECTIONS.find(section => section.id === id);
}
