import { AdminRole, RolePermissions } from '@/types/admin.types';

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<AdminRole, RolePermissions> = {
  super_admin: {
    canViewStudentNysc: true,
    canEditStudentNysc: true,
    canAddStudentNysc: true,
    canDeleteStudentNysc: true,
    canViewPayments: true,
    canEditPayments: true,
    canViewTempSubmissions: true,
    canEditTempSubmissions: true,
    canDownloadData: true,
    canAssignRoles: true,
    canViewAnalytics: true,
    canManageSystem: true,
  },
  admin: {
    canViewStudentNysc: true,
    canEditStudentNysc: true,
    canAddStudentNysc: true,
    canDeleteStudentNysc: true,
    canViewPayments: true,
    canEditPayments: true,
    canViewTempSubmissions: true,
    canEditTempSubmissions: true,
    canDownloadData: true,
    canAssignRoles: false,
    canViewAnalytics: true,
    canManageSystem: true,
  },
  sub_admin: {
    canViewStudentNysc: true,
    canEditStudentNysc: true,
    canAddStudentNysc: true,
    canDeleteStudentNysc: false,
    canViewPayments: true,
    canEditPayments: false,
    canViewTempSubmissions: true,
    canEditTempSubmissions: true,
    canDownloadData: true,
    canAssignRoles: false,
    canViewAnalytics: true,
    canManageSystem: false,
  },
  manager: {
    canViewStudentNysc: true,
    canEditStudentNysc: false,
    canAddStudentNysc: false,
    canDeleteStudentNysc: false,
    canViewPayments: true,
    canEditPayments: false,
    canViewTempSubmissions: true,
    canEditTempSubmissions: false,
    canDownloadData: true,
    canAssignRoles: false,
    canViewAnalytics: true,
    canManageSystem: false,
  },
};

// Super admin staff ID
export const SUPER_ADMIN_STAFF_ID = 596;

// Check if user has specific permission
export const hasPermission = (
  userRole: AdminRole,
  permission: keyof RolePermissions
): boolean => {
  return ROLE_PERMISSIONS[userRole][permission];
};

// Check if user is super admin
export const isSuperAdmin = (staffId: number): boolean => {
  return staffId === SUPER_ADMIN_STAFF_ID;
};

// Get role permissions
export const getRolePermissions = (role: AdminRole): RolePermissions => {
  return ROLE_PERMISSIONS[role];
};

// Get user role based on staff ID (hardcoded for now)
export const getUserRole = (staffId: number): AdminRole => {
  if (staffId === SUPER_ADMIN_STAFF_ID) {
    return 'super_admin';
  }
  
  // For demo purposes, assign roles based on staff ID ranges
  // In production, this would come from database
  if (staffId >= 500 && staffId < 600) {
    return 'admin';
  } else if (staffId >= 400 && staffId < 500) {
    return 'sub_admin';
  } else {
    return 'manager';
  }
};

// Role hierarchy for UI display
export const ROLE_HIERARCHY: AdminRole[] = [
  'super_admin',
  'admin', 
  'sub_admin',
  'manager'
];

// Role display names
export const ROLE_DISPLAY_NAMES: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  sub_admin: 'Sub Admin',
  manager: 'Manager'
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: 'Full system access with role assignment capabilities',
  admin: 'Full NYSC data management and analytics access',
  sub_admin: 'NYSC data management with limited editing permissions',
  manager: 'View and download access with analytics dashboard'
};