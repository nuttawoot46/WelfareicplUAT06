// Role-based access control utilities

export type UserRole = 'employee' | 'admin' | 'manager' | 'hr' | 'accounting' | 'accountingandmanager' | 'superadmin';

export interface Permission {
  // User Management
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  
  // Welfare Requests
  canViewAllRequests: boolean;
  canApproveRequests: boolean;
  canRejectRequests: boolean;
  
  // System Management
  canAccessSystemSettings: boolean;
  canManageDatabase: boolean;
  canViewAuditLogs: boolean;
  canManageSecurity: boolean;
  
  // Reports
  canViewReports: boolean;
  canExportData: boolean;
  
  // SuperAdmin exclusive
  canManageEverything: boolean;
}

export const getRolePermissions = (role: UserRole): Permission => {
  const basePermissions: Permission = {
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewAllRequests: false,
    canApproveRequests: false,
    canRejectRequests: false,
    canAccessSystemSettings: false,
    canManageDatabase: false,
    canViewAuditLogs: false,
    canManageSecurity: false,
    canViewReports: false,
    canExportData: false,
    canManageEverything: false
  };

  switch (role) {
    case 'superadmin':
      return {
        ...basePermissions,
        canViewUsers: true,
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canViewAllRequests: true,
        canApproveRequests: true,
        canRejectRequests: true,
        canAccessSystemSettings: true,
        canManageDatabase: true,
        canViewAuditLogs: true,
        canManageSecurity: true,
        canViewReports: true,
        canExportData: true,
        canManageEverything: true
      };

    case 'admin':
      return {
        ...basePermissions,
        canViewUsers: true,
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canViewAllRequests: true,
        canApproveRequests: true,
        canRejectRequests: true,
        canViewReports: true,
        canExportData: true
      };

    case 'hr':
      return {
        ...basePermissions,
        canViewUsers: true,
        canViewAllRequests: true,
        canApproveRequests: true,
        canRejectRequests: true,
        canViewReports: true
      };

    case 'manager':
    case 'accountingandmanager':
      return {
        ...basePermissions,
        canViewAllRequests: true,
        canApproveRequests: true,
        canRejectRequests: true,
        canViewReports: true
      };

    case 'accounting':
      return {
        ...basePermissions,
        canViewAllRequests: true,
        canApproveRequests: true,
        canRejectRequests: true
      };

    case 'employee':
    default:
      return basePermissions;
  }
};

export const hasPermission = (userRole: UserRole, permission: keyof Permission): boolean => {
  const permissions = getRolePermissions(userRole);
  return permissions[permission];
};

export const canAccessRoute = (userRole: UserRole, route: string): boolean => {
  // SuperAdmin can access everything
  if (userRole === 'superadmin') {
    return true;
  }

  // Route-specific access control
  if (route.startsWith('/superadmin')) {
    return userRole === 'superadmin';
  }

  if (route.startsWith('/admin')) {
    return userRole === 'admin' || userRole === 'superadmin';
  }

  if (route.startsWith('/hr-approve')) {
    return userRole === 'hr' || userRole === 'admin' || userRole === 'superadmin';
  }

  if (route.startsWith('/approve')) {
    return ['manager', 'accountingandmanager', 'admin', 'superadmin'].includes(userRole);
  }

  if (route.startsWith('/accounting-review') || route.startsWith('/welfare-accounting-review') || route.startsWith('/general-accounting-review')) {
    return ['accounting', 'accountingandmanager', 'admin', 'superadmin'].includes(userRole);
  }

  // Default routes accessible to all authenticated users
  return true;
};

export const getHighestRole = (roles: UserRole[]): UserRole => {
  const roleHierarchy: Record<UserRole, number> = {
    'superadmin': 6,
    'admin': 5,
    'hr': 4,
    'accountingandmanager': 3,
    'manager': 2,
    'accounting': 1,
    'employee': 0
  };

  return roles.reduce((highest, current) => {
    return roleHierarchy[current] > roleHierarchy[highest] ? current : highest;
  }, 'employee');
};