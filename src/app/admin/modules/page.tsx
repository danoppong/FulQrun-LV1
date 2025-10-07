'use client'

import React from 'react'
import Link from 'next/link';
import {
  UsersIcon,
  ChartBarIcon,
  AcademicCapIcon,
  CubeIcon,
  SparklesIcon,
  DevicePhoneMobileIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import AuthWrapper from '@/components/auth/AuthWrapper';

// =============================================================================
// MODULE CONFIGURATION OVERVIEW
// =============================================================================

interface ModuleCard {
  id: string
  name: string
  description: string
  href: string
  icon: any
  color: string
  status: 'active' | 'inactive' | 'beta'
  features: string[]
}

const modules: ModuleCard[] = [
  {
    id: 'crm',
    name: 'CRM Settings',
    description: 'Configure CRM features, qualification frameworks, and sales workflows',
    href: '/admin/modules/crm',
    icon: UsersIcon,
    color: 'blue',
    status: 'active',
    features: [
      'Lead qualification frameworks',
      'Opportunity management',
      'Sales pipeline configuration',
      'Custom fields and workflows'
    ]
  },
  {
    id: 'sales-performance',
    name: 'Sales Performance',
    description: 'Track and analyze sales team performance metrics and KPIs',
    href: '/admin/modules/sales-performance',
    icon: ChartBarIcon,
    color: 'green',
    status: 'active',
    features: [
      'Performance dashboards',
      'Sales metrics tracking',
      'Goal management',
      'Leaderboards and competitions'
    ]
  },
  {
    id: 'kpi',
    name: 'KPI & Analytics',
    description: 'Configure key performance indicators and analytics dashboards',
    href: '/admin/modules/kpi',
    icon: ChartBarIcon,
    color: 'purple',
    status: 'active',
    features: [
      'Custom KPI definitions',
      'Analytics dashboards',
      'Reporting templates',
      'Data visualization'
    ]
  },
  {
    id: 'dashboard-builder',
    name: 'Dashboard Builder',
    description: 'Create comprehensive dashboards with drag-and-drop functionality',
    href: '/admin/modules/dashboard-builder',
    icon: ChartBarIcon,
    color: 'emerald',
    status: 'active',
    features: [
      'Drag-and-drop interface',
      '16 widget types',
      'Custom themes',
      'Real-time preview',
      'Responsive layouts',
      'Advanced customization'
    ]
  },
  {
    id: 'learning',
    name: 'Learning Platform',
    description: 'Manage training content, courses, and learning paths',
    href: '/admin/modules/learning',
    icon: AcademicCapIcon,
    color: 'yellow',
    status: 'active',
    features: [
      'Course management',
      'Learning paths',
      'Certifications',
      'Training compliance'
    ]
  },
  {
    id: 'integrations',
    name: 'Integration Hub',
    description: 'Connect with third-party services and manage API integrations',
    href: '/admin/modules/integrations',
    icon: CubeIcon,
    color: 'indigo',
    status: 'beta',
    features: [
      'API integrations',
      'Webhooks',
      'Data synchronization',
      'Third-party connectors'
    ]
  },
  {
    id: 'ai',
    name: 'AI & Automation',
    description: 'Configure AI-powered features and workflow automation',
    href: '/admin/modules/ai',
    icon: SparklesIcon,
    color: 'pink',
    status: 'beta',
    features: [
      'AI lead scoring',
      'Automated workflows',
      'Predictive analytics',
      'Smart recommendations'
    ]
  },
  {
    id: 'mobile',
    name: 'Mobile App',
    description: 'Configure mobile app settings and features',
    href: '/admin/modules/mobile',
    icon: DevicePhoneMobileIcon,
    color: 'orange',
    status: 'inactive',
    features: [
      'Mobile access control',
      'Push notifications',
      'Offline mode settings',
      'Mobile-specific features'
    ]
  }
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      )
    case 'beta':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Beta
        </span>
      )
    case 'inactive':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Coming Soon
        </span>
      )
    default:
      return null
  }
}

export default function ModulesOverview() {
  const activeModules = modules.filter(m => m.status === 'active')
  const betaModules = modules.filter(m => m.status === 'beta')
  const inactiveModules = modules.filter(m => m.status === 'inactive')

  return (
    <AuthWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Module Configuration</h1>
          <p className="mt-2 text-gray-600">
            Configure and manage application modules and features
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Modules</p>
                <p className="text-3xl font-bold text-green-600">{activeModules.length}</p>
              </div>
              <Cog6ToothIcon className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Beta Modules</p>
                <p className="text-3xl font-bold text-yellow-600">{betaModules.length}</p>
              </div>
              <SparklesIcon className="h-12 w-12 text-yellow-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Coming Soon</p>
                <p className="text-3xl font-bold text-gray-600">{inactiveModules.length}</p>
              </div>
              <CubeIcon className="h-12 w-12 text-gray-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Link
              key={module.id}
              href={module.href}
              className={`bg-white rounded-lg shadow hover:shadow-lg transition-all ${
                module.status === 'inactive' ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              {...(module.status === 'inactive' ? { onClick: (e) => e.preventDefault() } : {})}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-${module.color}-100`}>
                    <module.icon className={`h-6 w-6 text-${module.color}-600`} />
                  </div>
                  {getStatusBadge(module.status)}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {module.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {module.description}
                </p>

                {/* Features */}
                <ul className="space-y-2">
                  {module.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-xs text-gray-500">
                      <svg
                        className="h-4 w-4 text-green-500 mr-2 flex-shrink-0"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Action */}
                {module.status !== 'inactive' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className={`text-sm font-medium text-${module.color}-600 hover:text-${module.color}-700`}>
                      Configure →
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AuthWrapper>
  )
}

