'use client'
import React from 'react';

import { useState } from 'react'
import Link from 'next/link';
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {;
  HomeIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  UserPlusIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  CogIcon,
  AcademicCapIcon,
  ChartPieIcon,
  PuzzlePieceIcon,
  LightBulbIcon,
  DocumentTextIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  ArrowPathIcon,
  TrophyIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BriefcaseIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ChartBarSquareIcon,
  DocumentChartBarIcon,
  FunnelIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline'

interface SubMenuItem {
  name: string
  href: string
}

interface MenuItem {
  name: string
  href?: string
  icon: any
  submenu?: SubMenuItem[]
}

const navigation: MenuItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: HomeIcon 
  },
  { 
    name: 'Account', 
    icon: BriefcaseIcon,
    submenu: [
      { name: 'Companies', href: '/companies' },
      { name: 'Contacts', href: '/contacts' },
      { name: 'Partners', href: '/partners' },
    ]
  },
  { 
    name: 'Leads', 
    icon: UserPlusIcon,
    submenu: [
      { name: 'Leads Listing', href: '/leads' },
      { name: 'AI Lead Management', href: '/leads/ai-management' },
      { name: 'Qualification', href: '/leads/qualification' },
      { name: 'Progression', href: '/leads/progression' },
      { name: 'Analytics', href: '/leads/analytics' },
      { name: 'Reports', href: '/leads/reports' },
    ]
  },
  { 
    name: 'Opportunity', 
    icon: FunnelIcon,
    submenu: [
      { name: 'Opportunity Listing', href: '/opportunities' },
      { name: 'MEDDPICC', href: '/opportunities/meddpicc' },
      { name: 'PEAK Pipeline', href: '/peak' },
    ]
  },
  { 
    name: 'SPM', 
    icon: TrophyIcon,
    submenu: [
      { name: 'Sales Performance', href: '/sales-performance' },
      { name: 'Target/Quota Management', href: '/sales-performance/quotas' },
      { name: 'Performance KPIs', href: '/performance' },
    ]
  },
  { 
    name: 'Business Intelligence', 
    icon: PresentationChartLineIcon,
    submenu: [
      { name: 'Reports', href: '/analytics' },
      { name: 'AI Insights', href: '/ai-insights' },
      { name: 'Pharmaceutical BI', href: '/pharmaceutical-bi' },
    ]
  },
  { 
    name: 'Enterprise AI', 
    href: '/enterprise-ai', 
    icon: CpuChipIcon 
  },
  { 
    name: 'Enterprise Analytics', 
    href: '/enterprise-analytics', 
    icon: ChartPieIcon 
  },
  { 
    name: 'Integrations', 
    icon: PuzzlePieceIcon,
    submenu: [
      { name: 'Integration Hub', href: '/integrations' },
      { name: 'Enterprise Integrations', href: '/enterprise-integrations' },
    ]
  },
  { 
    name: 'Enterprise Security', 
    href: '/enterprise-security', 
    icon: ShieldCheckIcon 
  },
  { 
    name: 'Enterprise Workflows', 
    href: '/enterprise-workflows', 
    icon: ArrowPathIcon 
  },
  { 
    name: 'Mobile App', 
    href: '/mobile-app', 
    icon: DevicePhoneMobileIcon 
  },
  { 
    name: 'Learning Platform', 
    href: '/learning-platform', 
    icon: AcademicCapIcon 
  },
  { 
    name: 'Administration', 
    icon: Cog6ToothIcon,
    submenu: [
      { name: 'Admin Dashboard', href: '/admin' },
      { name: 'Organization Settings', href: '/admin/organization/settings' },
      { name: 'User Management', href: '/admin/users' },
      { name: 'Enterprise Roles', href: '/admin/users/enterprise-roles' },
      { name: 'Module Configuration', href: '/admin/modules/crm' },
      { name: 'Security & Compliance', href: '/admin/security/authentication' },
      { name: 'System Administration', href: '/admin/system/database' },
      { name: 'Customization', href: '/admin/customization/fields' },
      { name: 'Legacy Settings', href: '/settings' },
    ]
  },
]

export default function Navigation() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const pathname = usePathname()
  const router = useRouter()

  // Update CSS variable for sidebar width
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty(
        '--sidebar-width',
        sidebarCollapsed ? '5rem' : '18rem'
      )
    }
  }, [sidebarCollapsed])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (_error) {
      // Handle sign out error
    }
  }

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    )
  }

  const isMenuActive = (item: MenuItem) => {
    if (item.href) {
      return pathname === item.href
    }
    if (item.submenu) {
      return item.submenu.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/'))
    }
    return false
  }

  const isSubmenuItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Render menu item (works for both mobile and desktop)
  const renderMenuItem = (item: MenuItem, isMobile = false) => {
    const isActive = isMenuActive(item)
    const isExpanded = expandedMenus.includes(item.name)

    if (item.submenu) {
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => toggleMenu(item.name)}
            className={`group flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-md'
            }`}
          >
            <div className="flex items-center">
              <item.icon
                className={`${sidebarCollapsed && !isMobile ? 'mr-0' : 'mr-3'} h-5 w-5 flex-shrink-0 transition-all ${
                  isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                }`}
              />
              {(!sidebarCollapsed || isMobile) && <span>{item.name}</span>}
            </div>
            {(!sidebarCollapsed || isMobile) && (
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform duration-200 ${
                  isExpanded ? 'transform rotate-180' : ''
                } ${isActive ? 'text-white' : 'text-muted-foreground'}`}
              />
            )}
          </button>
          {isExpanded && (!sidebarCollapsed || isMobile) && (
            <div className="ml-4 space-y-1 border-l-2 border-border/30 pl-4">
              {item.submenu.map((subItem) => {
                const isSubActive = isSubmenuItemActive(subItem.href)
                return (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    onClick={() => isMobile && setSidebarOpen(false)}
                    className={`block px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                      isSubActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {subItem.name}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.name}
        href={item.href || '#'}
        onClick={() => isMobile && setSidebarOpen(false)}
        className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-md'
        }`}
      >
        <item.icon
          className={`${sidebarCollapsed && !isMobile ? 'mr-0' : 'mr-3'} h-5 w-5 flex-shrink-0 transition-all ${
            isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
          }`}
        />
        {(!sidebarCollapsed || isMobile) && <span>{item.name}</span>}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'block opacity-100' : 'hidden opacity-0'}`}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white dark:bg-gray-900 backdrop-blur-xl border-r border-border/50 shadow-2xl">
          <div className="flex h-20 items-center justify-between px-6 border-b border-border/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">FulQrun</h1>
            </div>
            <button
              type="button"
              className="p-3 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors touch-manipulation"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation menu"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
            {navigation.map((item) => renderMenuItem(item, true))}
          </nav>
          <div className="border-t border-border/50 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}`}>
        <div className="flex flex-grow flex-col overflow-y-auto bg-white dark:bg-gray-900 border-r border-border/50 shadow-xl">
          <div className="flex h-20 items-center justify-between px-6 border-b border-border/50">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                  <SparklesIcon className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">FulQrun</h1>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="flex items-center justify-center w-full">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                  <SparklesIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Collapse sidebar"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
            {navigation.map((item) => renderMenuItem(item, false))}
          </nav>
          {sidebarCollapsed && (
            <div className="border-t border-border/50 p-3 flex justify-center">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Expand sidebar"
              >
                <ChevronRightIcon className="h-5 w-5 transform rotate-180" />
              </button>
            </div>
          )}
          {!sidebarCollapsed && (
            <div className="border-t border-border/50 p-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all duration-200"
              >
                <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                Sign out
              </button>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="border-t border-border/50 p-3 flex justify-center">
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label="Sign out"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden">
        <div className="flex h-16 items-center justify-between px-4 bg-white dark:bg-gray-900 border-b border-border/50">
          <button
            type="button"
            className="p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors touch-manipulation"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">FulQrun</h1>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>
    </>
  )
}
