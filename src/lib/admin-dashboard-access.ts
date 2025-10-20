/**
 * Admin Dashboard Access Helper
 * Utility functions to check and manage admin access to all dashboards
 */

import { UserRole } from '@/lib/roles'

export interface AdminDashboardAccess {
  hasAdminAccess: boolean;
  canAccessAllDashboards: boolean;
  canViewExecutiveDashboard: boolean;
  canViewPharmaceuticalBI: boolean;
  canViewAnalyticsDashboard: boolean;
  canCustomizeAllDashboards: boolean;
  canManageUserDashboards: boolean;
}

/**
 * Checks if user has admin-level dashboard access
 */
export function checkAdminDashboardAccess(userRole: UserRole): AdminDashboardAccess {
  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
  
  return {
    hasAdminAccess: isAdmin,
    canAccessAllDashboards: isAdmin,
    canViewExecutiveDashboard: isAdmin,
    canViewPharmaceuticalBI: isAdmin,
    canViewAnalyticsDashboard: isAdmin,
    canCustomizeAllDashboards: isAdmin,
    canManageUserDashboards: isAdmin
  };
}

/**
 * Gets available dashboard routes for admin users
 */
export function getAdminDashboardRoutes(): Array<{name: string, path: string, description: string}> {
  return [
    {
      name: 'Main Dashboard',
      path: '/dashboard',
      description: 'Core pharmaceutical sales dashboard'
    },
    {
      name: 'Enhanced Dashboard',
      path: '/enhanced-dashboard',
      description: 'Advanced dashboard with latest features'
    },
    {
      name: 'Executive Dashboard',
      path: '/executive-dashboard',
      description: 'Executive-level analytics and insights'
    },
    {
      name: 'Pharmaceutical BI',
      path: '/pharmaceutical-bi',
      description: 'Pharmaceutical business intelligence dashboard'
    },
    {
      name: 'Admin Dashboard',
      path: '/admin',
      description: 'Administrative control panel'
    },
    {
      name: 'Sales Performance',
      path: '/sales-performance',
      description: 'Sales performance tracking and analytics'
    },
    {
      name: 'KPI Dashboard',
      path: '/kpi-dashboard',
      description: 'Key performance indicators dashboard'
    },
    {
      name: 'Analytics Dashboard',
      path: '/analytics',
      description: 'Advanced analytics and reporting'
    }
  ];
}

/**
 * Dashboard permissions for admin users
 */
export const ADMIN_DASHBOARD_PERMISSIONS = [
  'dashboard.view',
  'dashboard.customize',
  'dashboard.analytics',
  'dashboard.view_all',
  'dashboard.admin_access',
  'dashboard.executive_access',
  'dashboard.analytics_advanced',
  'dashboard.pharmaceutical_bi',
  'dashboard.real_time',
  'dashboard.predictive_analytics',
  'dashboard.team_performance',
  'dashboard.sales_performance',
  'dashboard.kpi_management',
  'pharma.dashboard.territory',
  'pharma.dashboard.product',
  'pharma.dashboard.hcp',
  'pharma.dashboard.market_share',
  'pharma.dashboard.trx_analysis',
  'bi.dashboard.executive',
  'bi.dashboard.operational',
  'bi.dashboard.financial',
  'bi.dashboard.competitive',
  'bi.dashboard.forecasting',
  'admin.dashboard.view',
  'admin.view_dashboard',
  'admin.manage_users',
  'admin.manage_roles',
  'admin.manage_organization'
] as const;

/**
 * Checks if admin user has specific dashboard permission
 */
export function hasAdminDashboardPermission(
  userRole: UserRole, 
  permission: string
): boolean {
  if (userRole === UserRole.SUPER_ADMIN) {
    return true; // Super admin has all permissions
  }
  
  if (userRole === UserRole.ADMIN) {
    return ADMIN_DASHBOARD_PERMISSIONS.includes(permission as typeof ADMIN_DASHBOARD_PERMISSIONS[number]);
  }
  
  return false;
}

/**
 * Validates admin access to a specific dashboard
 */
export function validateAdminDashboardAccess(
  userRole: UserRole,
  _dashboardType: string
): { hasAccess: boolean; reason?: string } {
  const adminAccess = checkAdminDashboardAccess(userRole);
  
  if (!adminAccess.hasAdminAccess) {
    return {
      hasAccess: false,
      reason: 'User does not have administrative privileges'
    };
  }
  
  // Admin users have access to all dashboard types
  return { hasAccess: true };
}

const AdminDashboardAccessHelper = {
  checkAdminDashboardAccess,
  getAdminDashboardRoutes,
  hasAdminDashboardPermission,
  validateAdminDashboardAccess,
  ADMIN_DASHBOARD_PERMISSIONS
};

export default AdminDashboardAccessHelper;