'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'

interface PerformanceTrackingProps {
  organizationId: string
  user: any
}

interface PerformanceMetrics {
  id: string
  user_id: string
  period_start: string
  period_end: string
  revenue_actual: number
  revenue_target: number
  deals_closed: number
  deals_target: number
  activities_completed: number
  activities_target: number
  conversion_rate: number
  pipeline_coverage: number
  user: {
    id: string
    full_name: string
    email: string
  }
  territory?: {
    name: string
    region: string
  }
  quota_plan?: {
    name: string
    target_revenue: number
  }
}

export function PerformanceTracking({ organizationId, user }: PerformanceTrackingProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('current')

  useEffect(() => {
    fetchPerformanceMetrics()
  }, [organizationId, selectedPeriod])

  const fetchPerformanceMetrics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        organizationId,
        ...(selectedPeriod !== 'all' && { periodStart: getPeriodStart(), periodEnd: getPeriodEnd() })
      })

      const response = await fetch(`/api/sales-performance/performance-metrics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPeriodStart = () => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return startOfMonth.toISOString().split('T')[0]
  }

  const getPeriodEnd = () => {
    const now = new Date()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return endOfMonth.toISOString().split('T')[0]
  }

  const calculateQuotaAttainment = (actual: number, target: number) => {
    if (target === 0) return 0
    return Math.min((actual / target) * 100, 500) // Cap at 500%
  }

  const getPerformanceColor = (attainment: number) => {
    if (attainment >= 100) return 'text-green-600'
    if (attainment >= 80) return 'text-yellow-600'
    if (attainment >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Performance Tracking</h2>
        <div className="flex space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="current">Current Month</option>
            <option value="last">Last Month</option>
            <option value="quarter">Current Quarter</option>
            <option value="year">Current Year</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={fetchPerformanceMetrics}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const quotaAttainment = calculateQuotaAttainment(metric.revenue_actual, metric.revenue_target)
          const dealAttainment = calculateQuotaAttainment(metric.deals_closed, metric.deals_target)
          const activityAttainment = calculateQuotaAttainment(metric.activities_completed, metric.activities_target)

          return (
            <Card key={metric.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {metric.user.full_name}
                </h3>
                <span className="text-sm text-gray-500">
                  {metric.territory?.name || 'No Territory'}
                </span>
              </div>

              <div className="space-y-4">
                {/* Revenue Performance */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Revenue</span>
                    <span className={`text-sm font-semibold ${getPerformanceColor(quotaAttainment)}`}>
                      {quotaAttainment.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        quotaAttainment >= 100 ? 'bg-green-500' :
                        quotaAttainment >= 80 ? 'bg-yellow-500' :
                        quotaAttainment >= 50 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(quotaAttainment, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>${metric.revenue_actual.toLocaleString()}</span>
                    <span>${metric.revenue_target.toLocaleString()}</span>
                  </div>
                </div>

                {/* Deals Performance */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Deals</span>
                    <span className={`text-sm font-semibold ${getPerformanceColor(dealAttainment)}`}>
                      {dealAttainment.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        dealAttainment >= 100 ? 'bg-green-500' :
                        dealAttainment >= 80 ? 'bg-yellow-500' :
                        dealAttainment >= 50 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(dealAttainment, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{metric.deals_closed}</span>
                    <span>{metric.deals_target}</span>
                  </div>
                </div>

                {/* Activities Performance */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Activities</span>
                    <span className={`text-sm font-semibold ${getPerformanceColor(activityAttainment)}`}>
                      {activityAttainment.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        activityAttainment >= 100 ? 'bg-green-500' :
                        activityAttainment >= 80 ? 'bg-yellow-500' :
                        activityAttainment >= 50 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(activityAttainment, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{metric.activities_completed}</span>
                    <span>{metric.activities_target}</span>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Conversion Rate:</span>
                      <span className="ml-2 font-medium">{(metric.conversion_rate * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pipeline Coverage:</span>
                      <span className="ml-2 font-medium">{(metric.pipeline_coverage * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {metrics.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No performance metrics found</div>
          <p className="text-gray-400 mt-2">Performance data will appear here once metrics are recorded</p>
        </div>
      )}
    </div>
  )
}
