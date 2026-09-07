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
    canViewNerdData: true,
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
    canViewNerdData: false,
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
    canViewNerdData: false,
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
    canViewNerdData: false,
  },
  nerd_viewer: {
    canViewStudentNysc: false,
    canEditStudentNysc: false,
    canAddStudentNysc: false,
    canDeleteStudentNysc: false,
    canViewPayments: false,
    canEditPayments: false,
    canViewTempSubmissions: false,
    canEditTempSubmissions: false,
    canDownloadData: false,
    canAssignRoles: false,
    canViewAnalytics: false,
    canManageSystem: false,
    canViewNerdData: true,
  },
};

// Super admin staff ID
export const SUPER_ADMIN_STAFF_ID = 596;

// Staff members restricted to the Nerd records page only (view + export).
// Roles are derived from these lists; leave empty to disable.
export const NERD_VIEWER_ROLE = 'nerd_viewer' as AdminRole;

// Staff members granted Nerd-only access (matched against login email).
export const NERD_VIEWER_STAFF = [
  { id: 0, email: 'ukwuanir@veritas.edu.ng' },
];

export const isNerdViewerStaff = (userId: number): boolean =>
  NERD_VIEWER_STAFF.some((s) => s.id === userId);

export const isNerdViewerStaffByEmail = (email?: string | null): boolean =>
  !!email && NERD_VIEWER_STAFF.some((s) => s.email.toLowerCase() === email.toLowerCase());

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
  // Nerd-only staff win over any range-based role
  if (isNerdViewerStaff(staffId)) {
    return NERD_VIEWER_ROLE;
  }

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

// Get user role from the login/stored email identity (nerd-only staff can be
// matched by email even before their staff ID is known).
export const getUserRoleByEmail = (email: string): AdminRole | undefined => {
  if (isNerdViewerStaffByEmail(email)) {
    return NERD_VIEWER_ROLE;
  }
  return undefined;
};

// True when the role is restricted to the Nerd records page only.
export const isNerdViewerRole = (role: AdminRole | undefined): boolean =>
  role === NERD_VIEWER_ROLE;

// Role hierarchy for UI display
export const ROLE_HIERARCHY: AdminRole[] = [
  'super_admin',
  'admin', 
  'sub_admin',
  'manager',
  'nerd_viewer',
];

// Role display names
export const ROLE_DISPLAY_NAMES: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  sub_admin: 'Sub Admin',
  manager: 'Manager',
  nerd_viewer: 'Nerd Viewer',
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: 'Full system access with role assignment capabilities',
  admin: 'Full NYSC data management and analytics access',
  sub_admin: 'NYSC data management with limited editing permissions',
  manager: 'View and download access with analytics dashboard',
  nerd_viewer: 'Nerd records only: view, verify and export graduate data',
};