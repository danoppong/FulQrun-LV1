'use client'

import { useState, useEffect } from 'react'
import { opportunityAPI } from '@/lib/api/opportunities'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface PipelineData {
  stage: string
  count: number
  value: number
  weightedValue: number
}

interface PipelineSummary {
  totalValue: number
  weightedValue: number
  byStage: {
    prospecting: { count: number; value: number; weightedValue: number }
    engaging: { count: number; value: number; weightedValue: number }
    advancing: { count: number; value: number; weightedValue: number }
    key_decision: { count: number; value: number; weightedValue: number }
  }
}

const COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981']

export default function PipelineChart() {
  const [data, setData] = useState<PipelineData[]>([])
  const [summary, setSummary] = useState<PipelineSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPipelineData()
  }, [])

  const loadPipelineData = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: summaryData, error } = await opportunityAPI.getPipelineSummary()
      
      if (error) {
        setError(error.message || 'Failed to load pipeline data')
      } else if (summaryData) {
        setSummary(summaryData)
        
        // Transform data for charts
        const chartData = [
          {
            stage: 'Prospecting',
            count: typeof summaryData.byStage.prospecting.count === 'number' ? summaryData.byStage.prospecting.count : 0,
            value: typeof summaryData.byStage.prospecting.value === 'number' ? summaryData.byStage.prospecting.value : 0,
            weightedValue: typeof summaryData.byStage.prospecting.weightedValue === 'number' ? summaryData.byStage.prospecting.weightedValue : 0
          },
          {
            stage: 'Engaging',
            count: typeof summaryData.byStage.engaging.count === 'number' ? summaryData.byStage.engaging.count : 0,
            value: typeof summaryData.byStage.engaging.value === 'number' ? summaryData.byStage.engaging.value : 0,
            weightedValue: typeof summaryData.byStage.engaging.weightedValue === 'number' ? summaryData.byStage.engaging.weightedValue : 0
          },
          {
            stage: 'Advancing',
            count: typeof summaryData.byStage.advancing.count === 'number' ? summaryData.byStage.advancing.count : 0,
            value: typeof summaryData.byStage.advancing.value === 'number' ? summaryData.byStage.advancing.value : 0,
            weightedValue: typeof summaryData.byStage.advancing.weightedValue === 'number' ? summaryData.byStage.advancing.weightedValue : 0
          },
          {
            stage: 'Key Decision',
            count: typeof summaryData.byStage.key_decision.count === 'number' ? summaryData.byStage.key_decision.count : 0,
            value: typeof summaryData.byStage.key_decision.value === 'number' ? summaryData.byStage.key_decision.value : 0,
            weightedValue: typeof summaryData.byStage.key_decision.weightedValue === 'number' ? summaryData.byStage.key_decision.weightedValue : 0
          }
        ]
        
        setData(chartData)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    )
  }

  if (!summary || data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No pipeline data</h3>
        <p className="mt-1 text-sm text-gray-500">
          Create some opportunities to see your pipeline analytics.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Total Pipeline Value Card */}
        <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden shadow-lg rounded-xl border border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <dl>
                    <dt className="text-sm font-semibold text-blue-700 truncate">
                      Total Pipeline Value
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(summary.totalValue)}
                    </dd>
                    <dd className="text-xs text-blue-600 font-medium">
                      All stages combined
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Weighted Pipeline Value Card */}
        <div className="group relative bg-gradient-to-br from-emerald-50 to-emerald-100 overflow-hidden shadow-lg rounded-xl border border-emerald-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <dl>
                    <dt className="text-sm font-semibold text-emerald-700 truncate">
                      Weighted Pipeline Value
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(summary.weightedValue)}
                    </dd>
                    <dd className="text-xs text-emerald-600 font-medium">
                      Probability adjusted
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Opportunities Card */}
        <div className="group relative bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden shadow-lg rounded-xl border border-purple-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <dl>
                    <dt className="text-sm font-semibold text-purple-700 truncate">
                      Total Opportunities
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 mt-1">
                      {data.reduce((sum, item) => sum + (typeof item.count === 'number' ? item.count : 0), 0)}
                    </dd>
                    <dd className="text-xs text-purple-600 font-medium">
                      Active deals
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-blue-900">
                {summary.totalValue > 0 ? ((summary.weightedValue / summary.totalValue) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Avg Deal Size</p>
              <p className="text-2xl font-bold text-emerald-900">
                {data.reduce((sum, item) => sum + (typeof item.count === 'number' ? item.count : 0), 0) > 0 
                  ? formatCurrency(summary.totalValue / data.reduce((sum, item) => sum + (typeof item.count === 'number' ? item.count : 0), 0))
                  : '$0'
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Pipeline Health</p>
              <p className="text-2xl font-bold text-purple-900">
                {summary.totalValue > 0 ? ((summary.weightedValue / summary.totalValue) * 100) >= 70 ? 'Good' : 
                 (summary.weightedValue / summary.totalValue) * 100 >= 50 ? 'Fair' : 'Needs Work' : 'N/A'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Top Stage</p>
              <p className="text-2xl font-bold text-amber-900">
                {data.reduce((max, item) => item.value > max.value ? item : max, data[0] || { stage: 'N/A' }).stage}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pipeline Value by Stage - Enhanced Bar Chart */}
        <div className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Pipeline Value by Stage
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Revenue distribution across sales stages
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Value ($)</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="stage" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                height={60}
              />
              <YAxis 
                tickFormatter={formatCurrency} 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <Tooltip 
                formatter={(value) => [formatCurrency(Number(value)), 'Value']}
                labelStyle={{ color: '#374151', fontWeight: '600' }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="url(#valueGradient)"
                radius={[4, 4, 0, 0]}
                stroke="#1D4ED8"
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Opportunity Count by Stage - Enhanced Pie Chart */}
        <div className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Opportunities by Stage
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Deal count distribution across stages
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Count</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data as any}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ stage, count, percent }: any) => 
                  (count as number) > 0 ? `${stage}: ${count} (${((percent as number) * 100).toFixed(0)}%)` : ''
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                stroke="#fff"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    className="hover:opacity-80 transition-opacity duration-200"
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [
                  `${value} opportunities`,
                  props.payload.stage
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Enhanced Stage Details Table */}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Stage Details
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Comprehensive breakdown of pipeline metrics
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Live Data</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Weighted Value
                </th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Avg Value
                </th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Conversion
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {data.map((item, index) => {
                const totalCount = data.reduce((sum, d) => sum + (typeof d.count === 'number' ? d.count : 0), 0)
                const percentage = totalCount > 0 ? ((typeof item.count === 'number' ? item.count : 0) / totalCount * 100) : 0
                
                return (
                  <tr key={item.stage} className="hover:bg-gray-50 transition-colors duration-200 group">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3 shadow-sm"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <span className="text-sm font-semibold text-gray-900">
                            {item.stage}
                          </span>
                          <div className="text-xs text-gray-500">
                            {percentage.toFixed(1)}% of total
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-900">
                          {typeof item.count === 'number' ? item.count : 0}
                        </span>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              backgroundColor: COLORS[index % COLORS.length],
                              width: `${Math.min(percentage, 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.value)}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="text-sm font-semibold text-emerald-600">
                        {formatCurrency(item.weightedValue)}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {typeof item.count === 'number' && item.count > 0 ? formatCurrency(item.value / item.count) : '$0'}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${Math.min((item.weightedValue / item.value) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {item.value > 0 ? `${((item.weightedValue / item.value) * 100).toFixed(0)}%` : '0%'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
