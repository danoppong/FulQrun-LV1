'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClientComponentClient } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import {
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
  ArrowPathIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Contacts', href: '/contacts', icon: UserGroupIcon },
  { name: 'Companies', href: '/companies', icon: BuildingOfficeIcon },
  { name: 'Leads', href: '/leads', icon: UserPlusIcon },
  { name: 'Opportunities', href: '/opportunities', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

// Phase 2 features navigation
const phase2Navigation = [
  { name: 'Pipeline Config', href: '/pipeline', icon: CogIcon, badge: 'NEW' },
  { name: 'AI Insights', href: '/ai-insights', icon: LightBulbIcon, badge: 'AI' },
  { name: 'PEAK Process', href: '/peak', icon: DocumentTextIcon, badge: 'PEAK' },
  { name: 'Performance', href: '/performance', icon: ChartPieIcon, badge: 'CSTPV' },
  { name: 'Integrations', href: '/integrations', icon: PuzzlePieceIcon, badge: 'HUB' },
  { name: 'Learning', href: '/learning', icon: AcademicCapIcon, badge: 'LMS' },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, badge: 'BI' },
]

// Phase 3 Enterprise features navigation
const phase3Navigation = [
  { name: 'Enterprise AI', href: '/enterprise-ai', icon: CpuChipIcon, badge: 'AI+' },
  { name: 'Enterprise Analytics', href: '/enterprise-analytics', icon: ChartBarIcon, badge: 'BI+' },
  { name: 'Enterprise Integrations', href: '/enterprise-integrations', icon: PuzzlePieceIcon, badge: 'HUB+' },
  { name: 'Enterprise Security', href: '/enterprise-security', icon: ShieldCheckIcon, badge: 'SEC+' },
  { name: 'Enterprise Workflows', href: '/enterprise-workflows', icon: ArrowPathIcon, badge: 'WF+' },
  { name: 'Mobile App', href: '/mobile-app', icon: DevicePhoneMobileIcon, badge: 'MOBILE' },
  { name: 'Learning Platform', href: '/learning-platform', icon: AcademicCapIcon, badge: 'LMS+' },
]

export default function Navigation() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      // Handle sign out error
    }
  }

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'block opacity-100' : 'hidden opacity-0'}`}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-card/95 backdrop-blur-xl border-r border-border/50 shadow-2xl">
          <div className="flex h-20 items-center justify-between px-6 border-b border-border/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">FulQrun</h1>
            </div>
            <button
              type="button"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {/* Core Navigation */}
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-md'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                  {item.name}
                </Link>
              )
            })}
            
            {/* Phase 2 Features Separator */}
            <div className="pt-4">
              <div className="flex items-center px-4 py-2">
                <div className="flex-1 border-t border-border/30"></div>
                <span className="px-3 text-xs font-semibold text-muted-foreground bg-card rounded-full">Phase 2 Features</span>
                <div className="flex-1 border-t border-border/30"></div>
              </div>
            </div>
            
            {/* Phase 2 Navigation */}
            {phase2Navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-md'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center">
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    />
                    {item.name}
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
            
            {/* Phase 3 Features Separator */}
            <div className="pt-4">
              <div className="flex items-center px-4 py-2">
                <div className="flex-1 border-t border-border/30"></div>
                <span className="px-3 text-xs font-semibold text-muted-foreground bg-card rounded-full">Phase 3 Enterprise</span>
                <div className="flex-1 border-t border-border/30"></div>
              </div>
            </div>
            
            {/* Phase 3 Navigation */}
            {phase3Navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-phase3-primary text-white shadow-lg shadow-purple-500/25'
                      : 'text-muted-foreground hover:bg-gradient-phase3-hover hover:text-white hover:shadow-md'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center">
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-muted-foreground group-hover:text-white'
                      }`}
                    />
                    {item.name}
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gradient-phase3-secondary text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
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
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto bg-card/80 backdrop-blur-xl border-r border-border/50 shadow-xl">
          <div className="flex h-20 items-center px-6 border-b border-border/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">FulQrun</h1>
            </div>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {/* Core Navigation */}
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-md'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                  {item.name}
                </Link>
              )
            })}
            
            {/* Phase 2 Features Separator */}
            <div className="pt-4">
              <div className="flex items-center px-4 py-2">
                <div className="flex-1 border-t border-border/30"></div>
                <span className="px-3 text-xs font-semibold text-muted-foreground bg-card rounded-full">Phase 2 Features</span>
                <div className="flex-1 border-t border-border/30"></div>
              </div>
            </div>
            
            {/* Phase 2 Navigation */}
            {phase2Navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    />
                    {item.name}
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
            
            {/* Phase 3 Features Separator */}
            <div className="pt-4">
              <div className="flex items-center px-4 py-2">
                <div className="flex-1 border-t border-border/30"></div>
                <span className="px-3 text-xs font-semibold text-muted-foreground bg-card rounded-full">Phase 3 Enterprise</span>
                <div className="flex-1 border-t border-border/30"></div>
              </div>
            </div>
            
            {/* Phase 3 Navigation */}
            {phase3Navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-phase3-primary text-white shadow-lg shadow-purple-500/25'
                      : 'text-muted-foreground hover:bg-gradient-phase3-hover hover:text-white hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-muted-foreground group-hover:text-white'
                      }`}
                    />
                    {item.name}
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gradient-phase3-secondary text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
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

      {/* Mobile menu button */}
      <div className="lg:hidden">
        <div className="flex h-16 items-center justify-between px-4 bg-card/80 backdrop-blur-xl border-b border-border/50">
          <button
            type="button"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(true)}
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
