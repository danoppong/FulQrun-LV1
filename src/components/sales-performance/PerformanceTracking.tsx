'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card';

interface PerformanceTrackingProps {
  organizationId: string
  user: unknown
}

interface KPIData {
  win_rate: {
    total_opportunities: number
    won_opportunities: number
    win_rate: number
  }
  revenue_growth: {
    current_period_revenue: number
    previous_period_revenue: number
    growth_amount: number
    growth_percentage: number
  }
  avg_deal_size: {
    total_revenue: number
    total_deals: number
    avg_deal_size: number
    median_deal_size: number
    largest_deal: number
    smallest_deal: number
  }
  sales_cycle_length: {
    total_days: number
    total_deals: number
    avg_cycle_length: number
    median_cycle_length: number
    shortest_cycle: number
    longest_cycle: number
  }
  lead_conversion_rate: {
    total_leads: number
    qualified_opportunities: number
    conversion_rate: number
  }
  cac: {
    total_cost: number
    new_customers: number
    cac: number
  }
  quota_attainment: {
    quota_target: number
    actual_achievement: number
    attainment_percentage: number
  }
  clv: {
    avg_purchase_value: number
    purchase_frequency: number
    customer_lifespan_months: number
    clv: number
  }
  pipeline_coverage: {
    total_pipeline_value: number
    sales_quota: number
    coverage_ratio: number
  }
  activities_per_rep: {
    total_activities: number
    calls: number
    emails: number
    meetings: number
    demos: number
    presentations: number
    activities_per_day: number
  }
  calculation_metadata: {
    organization_id: string
    user_id: string | null
    territory_id: string | null
    period_start: string
    period_end: string
    calculated_at: string
  }
}

export function PerformanceTracking({ organizationId, user }: PerformanceTrackingProps) {
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview')

  useEffect(() => {
    if (organizationId) {
      fetchKPIData()
    }
  }, [organizationId, selectedPeriod])

  const fetchKPIData = async () => {
    if (!organizationId) {
      setError('Organization ID is required')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        organizationId,
        periodStart: getPeriodStart(),
        periodEnd: getPeriodEnd(),
        kpiType: 'all',
        includeTrends: 'true',
        includeBenchmarks: 'true'
      })

      const response = await fetch(`/api/kpis?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch KPI data')
      }

      setKpiData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching KPI data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPeriodStart = () => {
    const days = parseInt(selectedPeriod)
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }

  const getPeriodEnd = () => {
    return new Date().toISOString().split('T')[0]
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return `$${value.toFixed(0)}`
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  const getPerformanceColor = (value: number, thresholds?: { excellent: number; good: number; average: number }) => {
    if (!thresholds) return 'text-gray-600'
    if (value >= thresholds.excellent) return 'text-green-600'
    if (value >= thresholds.good) return 'text-blue-600'
    if (value >= thresholds.average) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Loading organization data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-lg">Error loading KPI data</p>
        <p className="text-gray-500 text-sm mt-2">{error}</p>
        <button
          onClick={fetchKPIData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!kpiData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No KPI data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Performance KPIs</h1>
          <p className="text-gray-600">Comprehensive performance metrics and analytics</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>

          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                viewMode === 'overview' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md ${
                viewMode === 'detailed' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Detailed
            </button>
          </div>

          <button
            onClick={fetchKPIData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Win Rate */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Win Rate</h3>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Performance
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {formatPercentage(kpiData.win_rate.win_rate)}
              </div>
              <div className="text-sm text-gray-600">
                {kpiData.win_rate.won_opportunities} of {kpiData.win_rate.total_opportunities} opportunities
              </div>
            </div>
          </div>
        </Card>

        {/* Revenue Growth */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Growth</h3>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Revenue
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {formatPercentage(kpiData.revenue_growth.growth_percentage)}
              </div>
              <div className="text-sm text-gray-600">
                {formatCurrency(kpiData.revenue_growth.growth_amount)} growth
              </div>
            </div>
          </div>
        </Card>

        {/* Average Deal Size */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Avg Deal Size</h3>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Revenue
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(kpiData.avg_deal_size.avg_deal_size)}
              </div>
              <div className="text-sm text-gray-600">
                {kpiData.avg_deal_size.total_deals} deals closed
              </div>
            </div>
          </div>
        </Card>

        {/* Sales Cycle Length */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Sales Cycle</h3>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Efficiency
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {kpiData.sales_cycle_length.avg_cycle_length.toFixed(0)} days
              </div>
              <div className="text-sm text-gray-600">
                {kpiData.sales_cycle_length.total_deals} deals analyzed
              </div>
            </div>
          </div>
        </Card>

        {/* Lead Conversion Rate */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Lead Conversion</h3>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Conversion
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {formatPercentage(kpiData.lead_conversion_rate.conversion_rate)}
              </div>
              <div className="text-sm text-gray-600">
                {kpiData.lead_conversion_rate.qualified_opportunities} of {kpiData.lead_conversion_rate.total_leads} leads
              </div>
            </div>
          </div>
        </Card>

        {/* Customer Acquisition Cost */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">CAC</h3>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Cost
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(kpiData.cac.cac)}
              </div>
              <div className="text-sm text-gray-600">
                {kpiData.cac.new_customers} new customers
              </div>
            </div>
          </div>
        </Card>

        {/* Quota Attainment */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Quota Attainment</h3>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                Performance
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {formatPercentage(kpiData.quota_attainment.attainment_percentage)}
              </div>
              <div className="text-sm text-gray-600">
                {formatCurrency(kpiData.quota_attainment.actual_achievement)} of {formatCurrency(kpiData.quota_attainment.quota_target)}
              </div>
            </div>
          </div>
        </Card>

        {/* Customer Lifetime Value */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">CLV</h3>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                Value
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(kpiData.clv.clv)}
              </div>
              <div className="text-sm text-gray-600">
                {kpiData.clv.customer_lifespan_months.toFixed(1)} months avg lifespan
              </div>
            </div>
          </div>
        </Card>

        {/* Pipeline Coverage */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Pipeline Coverage</h3>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Pipeline
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {kpiData.pipeline_coverage.coverage_ratio.toFixed(1)}x
              </div>
              <div className="text-sm text-gray-600">
                {formatCurrency(kpiData.pipeline_coverage.total_pipeline_value)} pipeline value
              </div>
            </div>
          </div>
        </Card>

        {/* Activities per Rep */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Activities</h3>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                Activity
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {kpiData.activities_per_rep.activities_per_day.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">
                activities per day
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed View */}
      {viewMode === 'detailed' && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Metrics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activities Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Calls</span>
                  <span className="text-sm font-medium">{kpiData.activities_per_rep.calls}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Emails</span>
                  <span className="text-sm font-medium">{kpiData.activities_per_rep.emails}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Meetings</span>
                  <span className="text-sm font-medium">{kpiData.activities_per_rep.meetings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Demos</span>
                  <span className="text-sm font-medium">{kpiData.activities_per_rep.demos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Presentations</span>
                  <span className="text-sm font-medium">{kpiData.activities_per_rep.presentations}</span>
                </div>
              </div>
            </Card>

            {/* Deal Size Analysis */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Size Analysis</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Median Deal Size</span>
                  <span className="text-sm font-medium">{formatCurrency(kpiData.avg_deal_size.median_deal_size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Largest Deal</span>
                  <span className="text-sm font-medium">{formatCurrency(kpiData.avg_deal_size.largest_deal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Smallest Deal</span>
                  <span className="text-sm font-medium">{formatCurrency(kpiData.avg_deal_size.smallest_deal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <span className="text-sm font-medium">{formatCurrency(kpiData.avg_deal_size.total_revenue)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Calculation Metadata */}
      <div className="text-xs text-gray-500 text-center">
        Last calculated: {new Date(kpiData.calculation_metadata.calculated_at).toLocaleString()}
        <br />
        Period: {kpiData.calculation_metadata.period_start} to {kpiData.calculation_metadata.period_end}
      </div>
    </div>
  )
}