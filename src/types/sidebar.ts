import { LucideIcon } from 'lucide-react';

// Visibility rule - กำหนดว่า item/section จะแสดงเมื่อไหร่
export interface VisibilityRule {
  roles?: string[];           // OR logic: แสดงถ้า role ตรงอันใดอันหนึ่ง
  requiresExecutive?: boolean;
  requiresSalesZone?: boolean;
  requiresEmail?: string[];   // OR: แสดงถ้า email ตรง
  alwaysVisible?: boolean;
}

// ข้อมูล user context สำหรับเช็ค visibility
export interface NavContextData {
  userRole: string;
  isExecutive: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  hasSalesZone: boolean;
  userEmail?: string;
}

// นิยามเมนูรายการ
export interface MenuItemDef {
  id: string;
  sectionId: string;
  label: string;
  path: string;
  icon: LucideIcon;
  visibility: VisibilityRule;
  order: number;
  searchKeywords?: string[];
}

// นิยาม section
export interface MenuSectionDef {
  id: string;
  label: string;
  icon: LucideIcon;
  order: number;
  visibility: VisibilityRule;
  activePaths: string[];
}

// กลุ่มที่ user สร้างเอง
export interface CustomGroup {
  id: string;
  label: string;
  color: string;
  itemIds: string[];
  order: number;
}

// Recently visited entry
export interface RecentVisit {
  itemId: string;
  path: string;
  label: string;
  timestamp: number;
}

// User preferences ทั้งหมด
export interface SidebarPreferences {
  favoriteIds: string[];
  sectionOrder: string[];
  collapsedSections: string[];
  customGroups: CustomGroup[];
  sidebarExpanded: boolean;
}

// Default preferences
export const DEFAULT_SIDEBAR_PREFERENCES: SidebarPreferences = {
  favoriteIds: [],
  sectionOrder: ['home', 'hr', 'accounting', 'approval', 'system'],
  collapsedSections: [],
  customGroups: [],
  sidebarExpanded: true,
};
