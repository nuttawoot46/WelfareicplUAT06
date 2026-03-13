import type { VisibilityRule, NavContextData, MenuItemDef, MenuSectionDef } from '@/types/sidebar';

/**
 * เช็คว่า item/section มองเห็นได้ไหม
 * ใช้ OR logic: ผ่านเงื่อนไขใดเงื่อนไขหนึ่งก็แสดง
 */
export function isVisible(rule: VisibilityRule, ctx: NavContextData): boolean {
  // Always visible → แสดงเสมอ
  if (rule.alwaysVisible) return true;

  // SuperAdmin เห็นทุกอย่าง (ยกเว้น items ที่ lock เฉพาะ role อื่น)
  if (ctx.isSuperAdmin) return true;

  // เช็ค roles (OR logic)
  if (rule.roles?.some(role => ctx.userRole === role)) return true;

  // เช็ค executive flag
  if (rule.requiresExecutive && ctx.isExecutive) return true;

  // เช็ค sales zone flag
  if (rule.requiresSalesZone && ctx.hasSalesZone) return true;

  // เช็ค email (OR logic)
  if (rule.requiresEmail?.some(email => ctx.userEmail === email)) return true;

  return false;
}

/**
 * กรอง menu items ที่ user มีสิทธิ์เห็น
 */
export function getVisibleItems(items: MenuItemDef[], ctx: NavContextData): MenuItemDef[] {
  return items.filter(item => isVisible(item.visibility, ctx));
}

/**
 * กรอง sections ที่ user มีสิทธิ์เห็น
 */
export function getVisibleSections(sections: MenuSectionDef[], ctx: NavContextData): MenuSectionDef[] {
  return sections.filter(section => isVisible(section.visibility, ctx));
}
