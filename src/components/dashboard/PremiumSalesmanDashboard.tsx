/**
 * Premium Salesman Dashboard Component
 * 
 * Displays pharmaceutical sales KPIs with hierarchy support:
 * - Individual salesman view (default)
 * - Team rollup view (for managers)
 * 
 * Implements sophisticated formulas from Section 1 & 2:
 * - Funnel Health (weighted velocity + qualified volume)
 * - Win Rate, Revenue Growth, Average Deal Size
 * - Performance vs Target (Weekly/Monthly/Annually)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  TrophyIcon, 
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import type { SalesmanKPIResults } from '@/lib/services/salesman-kpi-engine'

interface PremiumSalesmanDashboardProps {
  userId: string
  userRole: string
  organizationId: string
  darkMode?: boolean
}

type TimeFrame = 'weekly' | 'monthly' | 'annually'

export default function PremiumSalesmanDashboard({
  userId,
  userRole,
  organizationId: _organizationId,
  darkMode = false
}: PremiumSalesmanDashboardProps) {
  const [kpiData, setKpiData] = useState<SalesmanKPIResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('monthly')
  const [viewMode, setViewMode] = useState<'individual' | 'rollup'>('individual')
  const [refreshKey, setRefreshKey] = useState(0)

  // Calculate date ranges based on timeframe
  const getDateRange = useCallback((timeFrame: TimeFrame) => {
    const now = new Date()
    let periodStart: Date
    
    switch (timeFrame) {
      case 'weekly':
        periodStart = new Date(now)
        periodStart.setDate(now.getDate() - 7)
        break
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'annually':
        periodStart = new Date(now.getFullYear(), 0, 1)
        break
    }
    
    return { periodStart, periodEnd: now }
  }, [])

  // Fetch KPI data
  const fetchKPIs = useCallback(async () => {
    // Guard: Don't fetch if userId is not available
    if (!userId || userId.trim() === '') {
      setError('User ID not available')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const { periodStart, periodEnd } = getDateRange(selectedTimeFrame)
      
      const params = new URLSearchParams({
        salesmanId: userId,
        viewMode,
        includeSubordinates: (viewMode === 'rollup').toString(),
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString()
      })

      const response = await fetch(`/api/dashboard/salesman-kpis?${params}`, {
        cache: 'no-store',
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('KPI API Error:', response.status, errorText)
        throw new Error(`Failed to fetch KPIs: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setKpiData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load KPI data')
      console.error('KPI fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, selectedTimeFrame, viewMode, getDateRange])

  useEffect(() => {
    // Only fetch KPIs if userId is available
    if (userId && userId.trim() !== '') {
      void fetchKPIs()
    } else {
      setError('User ID not available')
      setLoading(false)
    }
  }, [fetchKPIs, refreshKey, userId])

  // Manual refresh handler
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  // Render loading state
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <ArrowPathIcon className={`w-12 h-12 animate-spin mx-auto mb-4 ${
            darkMode ? 'text-blue-400' : 'text-blue-600'
          }`} />
          <p className={`text-lg font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Calculating KPIs...
          </p>
        </div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className={`max-w-md p-6 rounded-xl ${
          darkMode 
            ? 'bg-red-900/20 border border-red-500/30' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <h3 className={`text-lg font-bold mb-2 ${
            darkMode ? 'text-red-400' : 'text-red-700'
          }`}>
            Error Loading Dashboard
          </h3>
          <p className={`text-sm mb-4 ${
            darkMode ? 'text-red-300' : 'text-red-600'
          }`}>
            {error}
          </p>
          <button
            onClick={handleRefresh}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              darkMode
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!kpiData) return null

  const isManager = ['manager', 'admin', 'regional_director'].includes(userRole)
  const performanceData = kpiData.performanceVsTarget[selectedTimeFrame]

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50'
    }`}>
      {/* Header */}
      <div className={`border-b transition-all duration-500 ${
        darkMode 
          ? 'bg-gray-900/95 border-gray-700/50 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-white/5' 
          : 'bg-white/95 border-gray-200/80 backdrop-blur-xl shadow-lg shadow-gray-200/50 ring-1 ring-gray-900/5'
      } sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${
                darkMode ? 'text-white drop-shadow-2xl' : 'text-gray-900'
              }`}>
                {viewMode === 'rollup' ? 'Team Performance Dashboard' : 'Salesman Dashboard'}
              </h1>
              <p className={`text-sm font-medium ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {kpiData.metadata.salesmanName} • {kpiData.metadata.viewMode === 'rollup' ? 'Team View' : 'Individual View'}
              </p>
            </div>
            
            <button
              onClick={handleRefresh}
              className={`group p-3 rounded-xl transition-all duration-300 hover:scale-110 ${
                darkMode
                  ? 'bg-blue-500/10 hover:bg-blue-500/20 ring-1 ring-blue-500/20'
                  : 'bg-blue-50 hover:bg-blue-100 ring-1 ring-blue-200/50'
              }`}
              title="Refresh Data"
            >
              <ArrowPathIcon className={`w-6 h-6 ${
                darkMode ? 'text-blue-400' : 'text-blue-600'
              } group-hover:rotate-180 transition-transform duration-500`} />
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4">
            {/* Timeframe Selector */}
            <div className="flex gap-2">
              {(['weekly', 'monthly', 'annually'] as TimeFrame[]).map(tf => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeFrame(tf)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    selectedTimeFrame === tf
                      ? darkMode
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50 ring-1 ring-blue-400/50'
                        : 'bg-blue-600 text-white shadow-md shadow-blue-500/50 ring-1 ring-blue-400/50'
                      : darkMode
                        ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 ring-1 ring-gray-600/50'
                        : 'bg-white text-gray-700 hover:bg-gray-50 ring-1 ring-gray-300/50'
                  }`}
                >
                  {tf.charAt(0).toUpperCase() + tf.slice(1)}
                </button>
              ))}
            </div>

            {/* View Mode Toggle (for managers) */}
            {isManager && (
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setViewMode('individual')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    viewMode === 'individual'
                      ? darkMode
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50 ring-1 ring-purple-400/50'
                        : 'bg-purple-600 text-white shadow-md shadow-purple-500/50 ring-1 ring-purple-400/50'
                      : darkMode
                        ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 ring-1 ring-gray-600/50'
                        : 'bg-white text-gray-700 hover:bg-gray-50 ring-1 ring-gray-300/50'
                  }`}
                >
                  Individual
                </button>
                <button
                  onClick={() => setViewMode('rollup')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    viewMode === 'rollup'
                      ? darkMode
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50 ring-1 ring-purple-400/50'
                        : 'bg-purple-600 text-white shadow-md shadow-purple-500/50 ring-1 ring-purple-400/50'
                      : darkMode
                        ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 ring-1 ring-gray-600/50'
                        : 'bg-white text-gray-700 hover:bg-gray-50 ring-1 ring-gray-300/50'
                  }`}
                >
                  Team Rollup
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Funnel Health */}
          <KPICard
            title="Funnel Health"
            value={`${kpiData.funnelHealth.overallScore.toFixed(1)}%`}
            subtitle={`${kpiData.funnelHealth.numberOfOpportunities} opportunities`}
            icon={FunnelIcon}
            trend={kpiData.funnelHealth.overallScore >= 70 ? 'up' : 'down'}
            darkMode={darkMode}
            color="blue"
          />

          {/* Win Rate */}
          <KPICard
            title="Win Rate"
            value={`${kpiData.winRate.winRate.toFixed(1)}%`}
            subtitle={`${kpiData.winRate.dealsWon} of ${kpiData.winRate.totalClosed} closed`}
            icon={TrophyIcon}
            trend={kpiData.winRate.winRate >= 50 ? 'up' : 'down'}
            darkMode={darkMode}
            color="green"
          />

          {/* Revenue Growth */}
          <KPICard
            title="Revenue Growth"
            value={`${kpiData.revenueGrowth.growthRate >= 0 ? '+' : ''}${kpiData.revenueGrowth.growthRate.toFixed(1)}%`}
            subtitle={`$${(kpiData.revenueGrowth.currentPeriodRevenue / 1000).toFixed(1)}K current`}
            icon={ArrowTrendingUpIcon}
            trend={kpiData.revenueGrowth.growthRate >= 0 ? 'up' : 'down'}
            darkMode={darkMode}
            color="purple"
          />

          {/* Average Deal Size */}
          <KPICard
            title="Avg Deal Size"
            value={`$${(kpiData.averageDealSize.averageDealSize / 1000).toFixed(1)}K`}
            subtitle={`${kpiData.averageDealSize.numberOfClosedDeals} deals closed`}
            icon={CurrencyDollarIcon}
            trend="stable"
            darkMode={darkMode}
            color="orange"
          />
        </div>

        {/* Performance vs Target - Large Card */}
        <div className={`group rounded-2xl border p-8 mb-8 transition-all duration-500 ${
          darkMode 
            ? 'bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border-gray-700/50 shadow-2xl shadow-black/50 hover:shadow-blue-900/20 hover:shadow-2xl ring-1 ring-white/5' 
            : 'bg-white/95 border-gray-200/80 shadow-xl shadow-gray-200/50 hover:shadow-blue-100/30 hover:shadow-2xl ring-1 ring-gray-900/5'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-2xl font-bold mb-2 ${
                darkMode ? 'text-white drop-shadow-lg' : 'text-gray-900'
              }`}>
                Performance vs Target
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {selectedTimeFrame.charAt(0).toUpperCase() + selectedTimeFrame.slice(1)} Period
              </p>
            </div>
            <div className={`px-6 py-3 rounded-xl ${
              performanceData.onTrack
                ? darkMode
                  ? 'bg-green-500/10 ring-1 ring-green-500/20 shadow-lg shadow-green-500/10'
                  : 'bg-green-50 ring-1 ring-green-200/50 shadow-md shadow-green-200/50'
                : darkMode
                  ? 'bg-red-500/10 ring-1 ring-red-500/20 shadow-lg shadow-red-500/10'
                  : 'bg-red-50 ring-1 ring-red-200/50 shadow-md shadow-red-200/50'
            }`}>
              <div className={`text-3xl font-bold ${
                performanceData.onTrack
                  ? darkMode ? 'text-green-400' : 'text-green-600'
                  : darkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                {performanceData.performancePercentage.toFixed(1)}%
              </div>
              <div className={`text-xs font-semibold uppercase tracking-wider mt-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {performanceData.onTrack ? 'On Track' : 'Below Target'}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative mb-6">
            <div className={`w-full rounded-full h-6 overflow-hidden ${
              darkMode ? 'bg-gray-700/50 ring-1 ring-gray-600/50' : 'bg-gray-200 ring-1 ring-gray-300/50'
            }`}>
              <div 
                className={`h-6 rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${
                  performanceData.onTrack
                    ? darkMode 
                      ? 'bg-gradient-to-r from-green-500 via-green-600 to-green-500 shadow-lg shadow-green-500/50' 
                      : 'bg-gradient-to-r from-green-500 via-green-600 to-green-500 shadow-md shadow-green-500/30'
                    : darkMode
                      ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 shadow-lg shadow-blue-500/50'
                      : 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 shadow-md shadow-blue-500/30'
                }`}
                style={{ width: `${Math.min(performanceData.performancePercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className={`text-sm font-semibold mb-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Actual
              </div>
              <div className={`text-2xl font-bold ${
                darkMode ? 'text-blue-400' : 'text-blue-600'
              }`}>
                ${(performanceData.actualValue / 1000).toFixed(1)}K
              </div>
            </div>
            <div>
              <div className={`text-sm font-semibold mb-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Target
              </div>
              <div className={`text-2xl font-bold ${
                darkMode ? 'text-purple-400' : 'text-purple-600'
              }`}>
                ${(performanceData.targetValue / 1000).toFixed(1)}K
              </div>
            </div>
            <div>
              <div className={`text-sm font-semibold mb-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Variance
              </div>
              <div className={`text-2xl font-bold ${
                performanceData.variance >= 0
                  ? darkMode ? 'text-green-400' : 'text-green-600'
                  : darkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                {performanceData.variance >= 0 ? '+' : ''} ${(performanceData.variance / 1000).toFixed(1)}K
              </div>
            </div>
          </div>
        </div>

        {/* Funnel Health Breakdown */}
        <div className={`group rounded-2xl border p-8 transition-all duration-500 ${
          darkMode 
            ? 'bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border-gray-700/50 shadow-2xl shadow-black/50 hover:shadow-purple-900/20 hover:shadow-2xl ring-1 ring-white/5' 
            : 'bg-white/95 border-gray-200/80 shadow-xl shadow-gray-200/50 hover:shadow-purple-100/30 hover:shadow-2xl ring-1 ring-gray-900/5'
        }`}>
          <h2 className={`text-2xl font-bold mb-6 ${
            darkMode ? 'text-white drop-shadow-lg' : 'text-gray-900'
          }`}>
            Funnel Stage Breakdown
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpiData.funnelHealth.breakdown.map((stage, idx) => (
              <div 
                key={idx}
                className={`p-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                  darkMode
                    ? 'bg-blue-500/10 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10'
                    : 'bg-gradient-to-br from-blue-50 to-blue-100/50 ring-1 ring-blue-200/50 shadow-md shadow-blue-200/50'
                }`}
              >
                <h3 className={`text-lg font-bold mb-4 ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  {stage.stage}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Opportunities
                    </span>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stage.count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Value
                    </span>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      ${(stage.value / 1000).toFixed(1)}K
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Avg Days
                    </span>
                    <span className={`font-bold ${
                      stage.velocityRatio > 1.2 
                        ? darkMode ? 'text-red-400' : 'text-red-600'
                        : darkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {stage.avgDaysInStage.toFixed(0)} days
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper component for KPI cards
interface KPICardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  trend: 'up' | 'down' | 'stable'
  darkMode: boolean
  color: 'blue' | 'green' | 'purple' | 'orange'
}

function KPICard({ title, value, subtitle, icon: Icon, trend, darkMode, color }: KPICardProps) {
  const colorClasses = {
    blue: darkMode 
      ? 'from-blue-500/10 to-blue-600/10 ring-blue-500/20 shadow-blue-500/10 text-blue-400'
      : 'from-blue-50 to-blue-100/50 ring-blue-200/50 shadow-blue-200/50 text-blue-600',
    green: darkMode
      ? 'from-green-500/10 to-green-600/10 ring-green-500/20 shadow-green-500/10 text-green-400'
      : 'from-green-50 to-green-100/50 ring-green-200/50 shadow-green-200/50 text-green-600',
    purple: darkMode
      ? 'from-purple-500/10 to-purple-600/10 ring-purple-500/20 shadow-purple-500/10 text-purple-400'
      : 'from-purple-50 to-purple-100/50 ring-purple-200/50 shadow-purple-200/50 text-purple-600',
    orange: darkMode
      ? 'from-orange-500/10 to-orange-600/10 ring-orange-500/20 shadow-orange-500/10 text-orange-400'
      : 'from-orange-50 to-orange-100/50 ring-orange-200/50 shadow-orange-200/50 text-orange-600'
  }

  return (
    <div className={`group rounded-2xl border transition-all duration-500 hover:scale-[1.02] p-6 bg-gradient-to-br ${colorClasses[color]} ${
      darkMode ? 'border-gray-700/50 shadow-2xl ring-1' : 'border-gray-200/80 shadow-xl ring-1'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-semibold mb-2 uppercase tracking-wider ${
            darkMode ? 'text-gray-400/90' : 'text-gray-600/90'
          }`}>
            {title}
          </p>
          <p className={`text-4xl font-bold mb-1 tracking-tight ${
            darkMode ? 'text-white drop-shadow-lg' : 'text-gray-900'
          }`}>
            {value}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {subtitle}
          </p>
        </div>
        <div className={`p-4 rounded-xl transition-all duration-300 group-hover:scale-110 ${
          darkMode 
            ? `bg-${color}-500/10 ring-1 ring-${color}-500/20 shadow-lg shadow-${color}-500/10` 
            : `bg-gradient-to-br from-${color}-50 to-${color}-100/50 ring-1 ring-${color}-200/50 shadow-md shadow-${color}-200/50`
        }`}>
          <Icon className={`w-7 h-7 ${colorClasses[color].split(' ').slice(-1)[0]}`} />
        </div>
      </div>
      {trend !== 'stable' && (
        <div className={`mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit ${
          trend === 'up'
            ? darkMode ? 'bg-green-500/10 ring-1 ring-green-500/20' : 'bg-green-50 ring-1 ring-green-200/50'
            : darkMode ? 'bg-red-500/10 ring-1 ring-red-500/20' : 'bg-red-50 ring-1 ring-red-200/50'
        }`}>
          <ArrowTrendingUpIcon className={`w-4 h-4 ${
            trend === 'up' ? 'text-green-500' : 'text-red-500 rotate-180'
          }`} />
          <span className={`text-xs font-bold ${
            trend === 'up' ? 'text-green-500' : 'text-red-500'
          }`}>
            {trend === 'up' ? 'Above Target' : 'Needs Attention'}
          </span>
        </div>
      )}
    </div>
  )
}
