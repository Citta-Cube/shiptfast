export function hasPermission(userRole, requiredRole) {
  const roleHierarchy = {
    'ADMIN': 3,
    'MANAGER': 2,
    'OPERATOR': 1,
    'VIEWER': 0
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export const ROLE_PERMISSIONS = {
  ADMIN: {
    can: [
      'manage_company_settings',
      'manage_members',
      'manage_operations',
      'view_all_data',
      'edit_all_data',
      'delete_data'
    ]
  },
  MANAGER: {
    can: [
      'manage_operations',
      'manage_team',
      'view_all_data',
      'edit_operations'
    ]
  },
  OPERATOR: {
    can: [
      'perform_operations',
      'view_assigned_data',
      'edit_assigned_data'
    ]
  },
  VIEWER: {
    can: [
      'view_assigned_data'
    ]
  }
};

export function checkPermission(userRole, permission) {
  return ROLE_PERMISSIONS[userRole]?.can.includes(permission) ?? false;
} 