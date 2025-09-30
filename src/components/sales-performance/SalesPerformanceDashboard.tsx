'use client'

import { useState, useEffect } from 'react'
import { TerritoryManagement } from './TerritoryManagement'
import { QuotaPlanning } from './QuotaPlanning'
import { CompensationManagement } from './CompensationManagement'
import { EnhancedPerformanceTracking } from './EnhancedPerformanceTracking'
import { CommissionApproval } from './CommissionApproval'
import { ScenarioPlanning } from './ScenarioPlanning'
import { GamificationDashboard } from './GamificationDashboard'

interface SalesPerformanceDashboardProps {
  user: any
}

export function SalesPerformanceDashboard({ user }: SalesPerformanceDashboardProps) {
  const [activeTab, setActiveTab] = useState('performance')
  const [organizationId, setOrganizationId] = useState<string>('')

  useEffect(() => {
    if (user?.profile?.organization_id) {
      setOrganizationId(user.profile.organization_id)
    }
  }, [user])

  const tabs = [
    { id: 'performance', name: 'Performance Tracking', icon: '📊' },
    { id: 'territories', name: 'Territory Management', icon: '🗺️' },
    { id: 'quotas', name: 'Quota Planning', icon: '🎯' },
    { id: 'compensation', name: 'Compensation', icon: '💰' },
    { id: 'commissions', name: 'Commission Approval', icon: '✅' },
    { id: 'scenarios', name: 'Scenario Planning', icon: '🔮' },
    { id: 'gamification', name: 'Recognition', icon: '🏆' }
  ]

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'performance':
        return <EnhancedPerformanceTracking organizationId={organizationId} user={user} />
      case 'territories':
        return <TerritoryManagement organizationId={organizationId} user={user} />
      case 'quotas':
        return <QuotaPlanning organizationId={organizationId} user={user} />
      case 'compensation':
        return <CompensationManagement organizationId={organizationId} user={user} />
      case 'commissions':
        return <CommissionApproval organizationId={organizationId} user={user} />
      case 'scenarios':
        return <ScenarioPlanning organizationId={organizationId} user={user} />
      case 'gamification':
        return <GamificationDashboard organizationId={organizationId} user={user} />
      default:
        return <EnhancedPerformanceTracking organizationId={organizationId} user={user} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderActiveTab()}
      </div>
    </div>
  )
}
