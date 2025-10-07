'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { UserRole } from '@/lib/roles'
import { PerformanceMetrics, getPerformanceDataForRole, getDrillDownData } from '@/lib/performance-data'
import RoleSelector from '@/components/RoleSelector';

interface HierarchicalPerformanceDashboardProps {
  userRole: UserRole
  userId: string
  userName: string
  userRegion?: string
  userBusinessUnit?: string
}

type ViewLevel = 'individual' | 'team' | 'regional' | 'global'

const HierarchicalPerformanceDashboard = ({ 
  userRole: initialUserRole, 
  userId, 
  userName, 
  userRegion, 
  userBusinessUnit 
}: HierarchicalPerformanceDashboardProps) => {
  const [userRole, setUserRole] = useState<UserRole>(initialUserRole)
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics[]>([])
  const [currentView, setCurrentView] = useState<ViewLevel>('individual')
  const [_selectedManager, _setSelectedManager] = useState<string | null>(null)
  const [_selectedRegion, _setSelectedRegion] = useState<string | null>(null)

  const loadPerformanceData = useCallback(() => {
    let data: PerformanceMetrics[] = []
    
    if (currentView === 'individual') {
      data = getPerformanceDataForRole(userId, userRole, userRegion, userBusinessUnit)
    } else {
      data = getDrillDownData(userId, userRole, currentView)
    }
    
    setPerformanceData(data)
  }, [currentView, userId, userRole, userRegion, userBusinessUnit])

  useEffect(() => {
    loadPerformanceData()
  }, [loadPerformanceData])

  const getViewTitle = () => {
    switch (currentView) {
      case 'individual': return 'Personal Performance'
      case 'team': return 'Team Performance'
      case 'regional': return 'Regional Performance'
      case 'global': return 'Global Performance'
      default: return 'Performance Dashboard'
    }
  }

  const getAvailableViews = (): ViewLevel[] => {
    switch (userRole) {
      case 'salesman':
        return ['individual']
      case 'sales_manager':
        return ['individual', 'team']
      case 'regional_sales_director':
        return ['individual', 'team', 'regional']
      case 'global_sales_lead':
      case 'business_unit_head':
        return ['individual', 'team', 'regional', 'global']
      default:
        return ['individual']
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600'
    if (percentage >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getViewTitle()} - {userName}
              </h1>
              <p className="text-gray-600">
                {userRole.replace('_', ' ').toUpperCase()} • {userRegion || 'Global'}
              </p>
            </div>
            <div className="flex space-x-4">
              {/* Role Selector */}
              <RoleSelector 
                currentRole={userRole} 
                onRoleChange={setUserRole} 
              />
              {/* View Level Selector */}
              <div className="flex space-x-2">
                {getAvailableViews().map((view) => (
                  <button
                    key={view}
                    onClick={() => setCurrentView(view)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      currentView === view
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {performanceData.slice(0, 4).map((metric, index) => (
              <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                        metric.percentage >= 100 ? 'bg-green-500' :
                        metric.percentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        <span className="text-white text-sm font-medium">
                          {metric.percentage >= 100 ? '✓' : '📊'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {metric.name}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatCurrency(metric.achieved)}
                        </dd>
                        <dd className={`text-sm ${getPerformanceColor(metric.percentage)}`}>
                          {metric.percentage.toFixed(1)}% of {formatCurrency(metric.quota)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Performance Table */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {getViewTitle()} Details
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Region
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quota
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Achieved
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {performanceData.map((metric, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-600 font-medium">
                                  {metric.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {metric.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {metric.role.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {metric.region || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(metric.quota)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(metric.achieved)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${getPerformanceBarColor(metric.percentage)}`}
                                style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm font-medium ${getPerformanceColor(metric.percentage)}`}>
                              {metric.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {metric.role === 'salesman' && (
                            <button className="text-indigo-600 hover:text-indigo-900">
                              View Details
                            </button>
                          )}
                          {metric.role === 'sales_manager' && (
                            <button 
                              onClick={() => setCurrentView('team')}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Drill Down
                            </button>
                          )}
                          {metric.role === 'regional_sales_director' && (
                            <button 
                              onClick={() => setCurrentView('regional')}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Drill Down
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Performance Charts Section */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quota Achievement Chart */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Quota Achievement
                </h3>
                <div className="space-y-4">
                  {performanceData.slice(0, 5).map((metric, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{metric.name}</div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(metric.achieved)} / {formatCurrency(metric.quota)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getPerformanceBarColor(metric.percentage)}`}
                            style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium w-12 text-right ${getPerformanceColor(metric.percentage)}`}>
                          {metric.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Performance Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total Quota</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(performanceData.reduce((sum, m) => sum + m.quota, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total Achieved</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(performanceData.reduce((sum, m) => sum + m.achieved, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Average Performance</span>
                    <span className={`text-sm font-medium ${getPerformanceColor(
                      performanceData.reduce((sum, m) => sum + m.percentage, 0) / performanceData.length
                    )}`}>
                      {(performanceData.reduce((sum, m) => sum + m.percentage, 0) / performanceData.length).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Above Quota</span>
                    <span className="text-sm font-medium text-green-600">
                      {performanceData.filter(m => m.percentage >= 100).length} / {performanceData.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HierarchicalPerformanceDashboard
