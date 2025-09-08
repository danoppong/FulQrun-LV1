export enum UserRole {
  SALESMAN = 'salesman',
  SALES_MANAGER = 'sales_manager', 
  REGIONAL_SALES_DIRECTOR = 'regional_sales_director',
  GLOBAL_SALES_LEAD = 'global_sales_lead',
  BUSINESS_UNIT_HEAD = 'business_unit_head'
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  managerId?: string
  region?: string
  businessUnit?: string
  teamMembers?: string[]
}

export const ROLE_HIERARCHY = {
  [UserRole.SALESMAN]: 1,
  [UserRole.SALES_MANAGER]: 2,
  [UserRole.REGIONAL_SALES_DIRECTOR]: 3,
  [UserRole.GLOBAL_SALES_LEAD]: 4,
  [UserRole.BUSINESS_UNIT_HEAD]: 5
}

export const ROLE_PERMISSIONS = {
  [UserRole.SALESMAN]: {
    canViewOwnData: true,
    canViewTeamData: false,
    canViewRegionalData: false,
    canViewGlobalData: false,
    canManageUsers: false,
    canCustomizeDashboard: true,
    canExportData: false
  },
  [UserRole.SALES_MANAGER]: {
    canViewOwnData: true,
    canViewTeamData: true,
    canViewRegionalData: false,
    canViewGlobalData: false,
    canManageUsers: true,
    canCustomizeDashboard: true,
    canExportData: true
  },
  [UserRole.REGIONAL_SALES_DIRECTOR]: {
    canViewOwnData: true,
    canViewTeamData: true,
    canViewRegionalData: true,
    canViewGlobalData: false,
    canManageUsers: true,
    canCustomizeDashboard: true,
    canExportData: true
  },
  [UserRole.GLOBAL_SALES_LEAD]: {
    canViewOwnData: true,
    canViewTeamData: true,
    canViewRegionalData: true,
    canViewGlobalData: true,
    canManageUsers: true,
    canCustomizeDashboard: true,
    canExportData: true
  },
  [UserRole.BUSINESS_UNIT_HEAD]: {
    canViewOwnData: true,
    canViewTeamData: true,
    canViewRegionalData: true,
    canViewGlobalData: true,
    canManageUsers: true,
    canCustomizeDashboard: true,
    canExportData: true
  }
}

export function getUserPermissions(role: UserRole) {
  return ROLE_PERMISSIONS[role]
}

export function canUserAccessLevel(userRole: UserRole, targetLevel: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetLevel]
}
