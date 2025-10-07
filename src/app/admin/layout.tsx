// Administration Module - Layout and Navigation
// Main layout component for the admin console

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ;
  CogIcon, 
  UsersIcon, 
  ShieldCheckIcon, 
  ChartBarIcon,
  PuzzlePieceIcon,
  ServerIcon,
  PaintBrushIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon,
  BellIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavigationItem[];
  badge?: string;
  requiresPermission?: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

// =============================================================================
// NAVIGATION CONFIGURATION
// =============================================================================

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: HomeIcon
  },
  {
    name: 'Organization',
    href: '/admin/organization',
    icon: CogIcon,
    children: [
      { name: 'Settings', href: '/admin/organization/settings' },
      { name: 'Features & Modules', href: '/admin/organization/features' },
      { name: 'Compliance', href: '/admin/organization/compliance' },
      { name: 'Branding', href: '/admin/organization/branding' }
    ]
  },
  {
    name: 'Users & Access',
    href: '/admin/users',
    icon: UsersIcon,
    children: [
      { name: 'User Management', href: '/admin/users/list' },
      { name: 'Roles & Permissions', href: '/admin/users/roles' },
      { name: 'Teams & Hierarchy', href: '/admin/users/teams' },
      { name: 'Custom Roles', href: '/admin/users/custom-roles' }
    ]
  },
  {
    name: 'Module Configuration',
    href: '/admin/modules',
    icon: PuzzlePieceIcon,
    children: [
      { name: 'CRM Settings', href: '/admin/modules/crm' },
      { name: 'Sales Performance', href: '/admin/modules/sales-performance' },
      { name: 'KPI & Analytics', href: '/admin/modules/kpi' },
      { name: 'Learning Platform', href: '/admin/modules/learning' },
      { name: 'Integration Hub', href: '/admin/modules/integrations' },
      { name: 'AI & Automation', href: '/admin/modules/ai' },
      { name: 'Mobile App', href: '/admin/modules/mobile' }
    ]
  },
  {
    name: 'Security & Compliance',
    href: '/admin/security',
    icon: ShieldCheckIcon,
    children: [
      { name: 'Authentication', href: '/admin/security/authentication' },
      { name: 'Multi-Factor Auth', href: '/admin/security/mfa' },
      { name: 'SSO Configuration', href: '/admin/security/sso' },
      { name: 'Audit Logs', href: '/admin/audit/logs' },
      { name: 'Data Governance', href: '/admin/security/data-governance' }
    ]
  },
  {
    name: 'System Administration',
    href: '/admin/system',
    icon: ServerIcon,
    children: [
      { name: 'Configuration Editor', href: '/admin/configuration/editor' },
      { name: 'Database Management', href: '/admin/system/database' },
      { name: 'Monitoring & Alerts', href: '/admin/system/monitoring' },
      { name: 'Backup & Restore', href: '/admin/system/backups' },
      { name: 'Maintenance Mode', href: '/admin/system/maintenance' }
    ]
  },
  {
    name: 'Customization',
    href: '/admin/customization',
    icon: PaintBrushIcon,
    children: [
      { name: 'Custom Fields', href: '/admin/customization/fields' },
      { name: 'Form Designer', href: '/admin/customization/forms' },
      { name: 'Workflow Builder', href: '/admin/customization/workflows' },
      { name: 'Email Templates', href: '/admin/customization/templates' },
      { name: 'Theme Customizer', href: '/admin/customization/themes' }
    ]
  }
];

// =============================================================================
// ADMIN SIDEBAR COMPONENT
// =============================================================================

function AdminSidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const hasActiveChild = (children: NavigationItem[]) => {
    return children.some(child => isActive(child.href));
  };

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white">
      {/* Logo/Brand */}
      <div className="flex items-center h-16 px-6 border-b border-gray-800">
        <div className="flex items-center">
          <CogIcon className="h-8 w-8 text-blue-400" />
          <span className="ml-2 text-xl font-semibold">FulQrun Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.name);
          const isItemActive = isActive(item.href);
          const hasActiveChildItem = hasChildren && hasActiveChild(item.children!);

          return (
            <div key={item.name}>
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  isItemActive || hasActiveChildItem
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                onClick={() => {
                  if (hasChildren) {
                    toggleExpanded(item.name);
                  }
                }}
              >
                <div className="flex items-center">
                  <item.icon className="h-5 w-5 mr-3" />
                  <span className="text-sm font-medium">{item.name}</span>
                  {item.badge && (
                    <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                {hasChildren && (
                  <div className="ml-2">
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </div>
                )}
              </div>

              {/* Children */}
              {hasChildren && isExpanded && (
                <div className="ml-6 mt-2 space-y-1">
                  {item.children!.map((child) => (
                    <Link
                      key={child.name}
                      href={child.href}
                      className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                        isActive(child.href)
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex items-center">
          <UserCircleIcon className="h-8 w-8 text-gray-400" />
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-gray-400">Super Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ADMIN HEADER COMPONENT
// =============================================================================

function AdminHeader() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Admin Console</span>
          <span className="text-sm text-gray-400">/</span>
          <span className="text-sm font-medium text-gray-900">Dashboard</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-gray-400 hover:text-gray-600 relative">
            <BellIcon className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          {/* System Status */}
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">System Healthy</span>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-2">
            <UserCircleIcon className="h-8 w-8 text-gray-400" />
            <div className="text-sm">
              <p className="font-medium text-gray-900">Admin User</p>
              <p className="text-gray-500">Super Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// =============================================================================
// BREADCRUMB NAVIGATION COMPONENT
// =============================================================================

function BreadcrumbNav() {
  const pathname = usePathname();
  
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Admin', href: '/admin' }];
    
    // Skip the first segment if it's 'admin' to avoid duplication
    const pathSegments = segments[0] === 'admin' ? segments.slice(1) : segments;
    
    let currentPath = '/admin';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');
      breadcrumbs.push({ name, href: currentPath });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className="flex px-6 py-3 bg-gray-50 border-b border-gray-200">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400">/</span>
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-sm font-medium text-gray-900">
                {breadcrumb.name}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {breadcrumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// =============================================================================
// MAIN ADMIN LAYOUT COMPONENT
// =============================================================================

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Breadcrumb */}
        <BreadcrumbNav />
        
        {/* Page Content */}
        <main className="flex-1 bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTED COMPONENTS
// =============================================================================

export { AdminSidebar, AdminHeader, BreadcrumbNav };
