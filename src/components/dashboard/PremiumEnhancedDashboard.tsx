'use client'

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { UserRole, getUserPermissions } from '@/lib/roles'
import { DashboardWidget, WidgetType, DEFAULT_WIDGETS } from '@/lib/dashboard-widgets'
import { KPICard } from '@/components/bi/KPICard'
import { KPICardData, PharmaKPICardData } from '@/lib/types/dashboard'
import { supabase } from '@/lib/supabase'
import { useDashboard, DashboardProvider } from '@/components/dashboard/DashboardContext'
import { PremiumLineChart } from '@/components/charts/PremiumLineChart'
import { PremiumBarChart } from '@/components/charts/PremiumBarChart'
import { PremiumDonutChart } from '@/components/charts/PremiumDonutChart'
import PremiumSalesmanDashboard from '@/components/dashboard/PremiumSalesmanDashboard'
import { 
  ChartBarIcon, 
  SparklesIcon, 
  ArrowTrendingUpIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline'

interface EnhancedRoleBasedDashboardProps {
  userRole: UserRole
  userId: string
  organizationNameSSR?: string | null
}

// Mock data for charts
const generateMonthlyData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  return months.map((name, i) => ({
    name,
    revenue: 120000 + i * 15000 + Math.random() * 10000,
    target: 100000 + i * 12000,
    prescriptions: 450 + i * 50 + Math.random() * 30,
    newPrescriptions: 80 + i * 10 + Math.random() * 15
  }))
}

const generateTeamData = () => [
  { name: 'Sarah Johnson', performance: 95, revenue: 285000, color: '#10B981' },
  { name: 'John Smith', performance: 87, revenue: 245000, color: '#3B82F6' },
  { name: 'Mike Davis', performance: 78, revenue: 198000, color: '#F59E0B' },
  { name: 'Emma Wilson', performance: 92, revenue: 267000, color: '#8B5CF6' },
  { name: 'Tom Brown', performance: 73, revenue: 182000, color: '#EF4444' }
]

const generatePipelineData = () => [
  { name: 'Prospecting', value: 420000, color: '#3B82F6' },
  { name: 'Engaging', value: 540000, color: '#F59E0B' },
  { name: 'Advancing', value: 680000, color: '#10B981' },
  { name: 'Key Decision', value: 320000, color: '#8B5CF6' }
]

function DashboardControls({ darkMode, toggleDarkMode }: { darkMode: boolean; toggleDarkMode: () => void }) {
  const dashboard = useDashboard()
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleDarkMode}
        className={`p-2 rounded-lg transition-colors ${
          darkMode 
            ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        aria-label="Toggle dark mode"
      >
        {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
      </button>
      <label className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        <input
          type="checkbox"
          checked={dashboard.autoRefresh}
          onChange={(e) => dashboard.updateSettings({ autoRefresh: e.target.checked })}
          className="rounded"
        />
        Auto refresh
      </label>
      <div className="flex items-center gap-2">
        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Interval</span>
        <select
          value={dashboard.refreshInterval}
          onChange={(e) => dashboard.updateSettings({ refreshInterval: Number(e.target.value) })}
          className={`text-sm border rounded px-2 py-1 ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-200' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value={5}>5 min</option>
          <option value={15}>15 min</option>
          <option value={30}>30 min</option>
          <option value={60}>1 hour</option>
        </select>
      </div>
    </div>
  )
}

function DashboardContent({ userRole: initialUserRole, userId: _userId, organizationNameSSR }: EnhancedRoleBasedDashboardProps) {
  const dashboard = useDashboard()
  const [userRole] = useState<UserRole>(initialUserRole)
  const [viewRole, setViewRole] = useState<UserRole>(initialUserRole)
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => DEFAULT_WIDGETS)
  const [isEditMode, setIsEditMode] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [organizationName, setOrganizationName] = useState<string | null>(organizationNameSSR ?? null)
  const permissions = useMemo(() => getUserPermissions(userRole), [userRole])
  const publishOnce = useRef(false)

  const isAdminUser = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN
  const isViewingAdmin = viewRole === UserRole.ADMIN || viewRole === UserRole.SUPER_ADMIN

  // Generate mock data
  const monthlyData = useMemo(() => generateMonthlyData(), [])
  const teamData = useMemo(() => generateTeamData(), [])
  const pipelineData = useMemo(() => generatePipelineData(), [])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboardDarkMode', (!darkMode).toString())
    }
  }, [darkMode])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardDarkMode')
      if (saved) setDarkMode(saved === 'true')
    }
  }, [])

  const loadDashboardLayout = useCallback(async () => {
    let adminLayout: Array<{ x: number; y: number; w: number; h: number }> | null = null
    if (!isViewingAdmin) {
      try {
        const res = await fetch('/api/dashboard/templates?role=admin', { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          const tpl = Array.isArray(json?.data) ? json.data[0] : undefined
          const layout = tpl?.layout_json as Array<{ x: number; y: number; w: number; h: number }>
          if (Array.isArray(layout) && layout.length) adminLayout = layout
        }
      } catch {
        // ignore
      }
    }

    const roleBaseWidgets: DashboardWidget[] = DEFAULT_WIDGETS

    try {
      const res = await fetch('/api/dashboard/layouts', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        if (json?.exists && Array.isArray(json.layout)) {
          type BuilderItem = { id: string; type: WidgetType; title: string; x: number; y: number; w: number; h: number; metadata?: Record<string, unknown> }
          const mapped: DashboardWidget[] = (json.layout as BuilderItem[]).map((w) => {
            const existing = roleBaseWidgets.find(ex => ex.id === w.id)
            let nextData = existing?.data
            if (existing?.type === WidgetType.PHARMA_KPI_CARD && w.metadata) {
              const existingPharma = existing.data as PharmaKPICardData | undefined
              const existingMeta = existingPharma?.metadata || {}
              nextData = {
                ...(existingPharma || {
                  kpiId: 'trx',
                  kpiName: existing?.title || w.title,
                  value: 0,
                  confidence: 0,
                  trend: 'stable' as const,
                  format: 'number' as const,
                  metadata: {},
                }),
                metadata: { ...existingMeta, ...w.metadata }
              }
            }
            return {
              id: w.id,
              type: w.type,
              title: w.title,
              position: adminLayout && adminLayout[0] ? (adminLayout.find((_, i) => i === (json.layout as BuilderItem[]).indexOf(w)) || { x: w.x, y: w.y, w: w.w, h: w.h }) : { x: w.x, y: w.y, w: w.w, h: w.h },
              data: nextData,
              config: existing?.config
            }
          })
          setWidgets(mapped)
          return
        }
      }
    } catch {
      // ignore
    }

    try {
      const res = await fetch(`/api/dashboard/templates?role=${viewRole}`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        if (Array.isArray(json?.data) && json.data.length > 0) {
          type TplItem = { id: string; type: WidgetType; title: string; x: number; y: number; w: number; h: number; metadata?: Record<string, unknown> }
          const tpl = json.data[0]
          const layout = tpl?.layout_json as TplItem[]
          if (Array.isArray(layout)) {
            const loaded: DashboardWidget[] = layout.map((w: TplItem) => {
              const base = roleBaseWidgets.find(b => b.id === w.id)
              return {
                id: w.id,
                type: w.type,
                title: w.title,
                position: { x: w.x, y: w.y, w: w.w, h: w.h },
                data: base?.data,
                config: base?.config
              }
            })
            setWidgets(loaded)
            return
          }
        }
      }
    } catch {
      // ignore
    }

    if (adminLayout && Array.isArray(adminLayout) && adminLayout.length > 0) {
      const overlayed = roleBaseWidgets.map((w, i) => ({
        ...w,
        position: adminLayout[i] || w.position
      }))
      setWidgets(overlayed)
    } else {
      setWidgets(roleBaseWidgets)
    }
  }, [isViewingAdmin, viewRole])

  const saveDashboardLayout = useCallback(async (newWidgets: DashboardWidget[]) => {
    const payload = {
      layout: newWidgets.map(w => ({
        id: w.id,
        type: w.type,
        title: w.title,
        x: w.position.x,
        y: w.position.y,
        w: w.position.w,
        h: w.position.h,
        ...(w.data && typeof w.data === 'object' && (w.data as { metadata?: Record<string, unknown> }).metadata
          ? { metadata: (w.data as { metadata?: Record<string, unknown> }).metadata as Record<string, unknown> }
          : {})
      }))
    }
    try {
      await fetch('/api/dashboard/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    let isActive = true
    const loadOrg = async () => {
      try {
        if (!dashboard.organizationId) {
          setOrganizationName(null)
          return
        }
        const { data, error } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', dashboard.organizationId)
          .single()
        if (!isActive) return
        if (error) {
          setOrganizationName(null)
          return
        }
        setOrganizationName((data as { name?: string } | null)?.name ?? null)
      } catch {
        if (isActive) setOrganizationName(null)
      }
    }
    if (!organizationNameSSR) void loadOrg()
    return () => { isActive = false }
  }, [dashboard.organizationId, organizationNameSSR])

  const renderPremiumKPICard = (widget: DashboardWidget) => {
    const kpiData = widget.data as KPICardData | undefined
    const value = typeof kpiData?.value === 'number' ? kpiData.value : parseInt(String(kpiData?.value || 0))
    const trend = kpiData?.trend === 'up' || kpiData?.trend === 'down' ? kpiData.trend : 'stable'
    const change = kpiData?.change || '+0%'
    
    const IconComponent = widget.title.includes('Revenue') || widget.title.includes('Value') 
      ? CurrencyDollarIcon
      : widget.title.includes('Leads') || widget.title.includes('Opportunities')
      ? UserGroupIcon
      : widget.title.includes('Rate')
      ? SparklesIcon
      : ChartBarIcon

    return (
      <div className={`group rounded-2xl border transition-all duration-500 hover:scale-[1.02] ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border-gray-700/50 shadow-2xl shadow-black/50 hover:shadow-blue-900/30 hover:shadow-2xl hover:border-gray-600/50 ring-1 ring-white/5' 
          : 'bg-gradient-to-br from-white via-gray-50/50 to-white border-gray-200/80 shadow-xl shadow-gray-200/50 hover:shadow-blue-100/50 hover:shadow-2xl hover:border-blue-200/50 ring-1 ring-gray-900/5'
      }`}>
        <div className="p-6 relative overflow-hidden">
          {/* Subtle background glow effect */}
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
            darkMode 
              ? 'bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5' 
              : 'bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50'
          }`} />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className={`text-sm font-semibold mb-2 uppercase tracking-wider ${
                darkMode ? 'text-gray-400/90' : 'text-gray-600/90'
              }`}>
                {widget.title}
              </p>
              <p className={`text-4xl font-bold mb-1 tracking-tight ${
                darkMode ? 'text-white drop-shadow-lg' : 'text-gray-900'
              }`}>
                {widget.title.includes('$') || widget.title.includes('Value') 
                  ? `$${(value / 1000).toFixed(1)}K`
                  : value.toLocaleString()}
              </p>
              <div className="flex items-center mt-3">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                  trend === 'up' 
                    ? darkMode ? 'bg-green-500/10 ring-1 ring-green-500/20' : 'bg-green-50 ring-1 ring-green-200/50'
                    : trend === 'down' 
                    ? darkMode ? 'bg-red-500/10 ring-1 ring-red-500/20' : 'bg-red-50 ring-1 ring-red-200/50'
                    : darkMode ? 'bg-gray-500/10 ring-1 ring-gray-500/20' : 'bg-gray-100 ring-1 ring-gray-200/50'
                }`}>
                  <ArrowTrendingUpIcon 
                    className={`w-4 h-4 ${
                      trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'
                    } ${trend === 'down' ? 'rotate-180' : ''} transition-transform duration-300`}
                  />
                  <span className={`text-sm font-bold ${
                    trend === 'up' 
                      ? 'text-green-500' 
                      : trend === 'down' 
                      ? 'text-red-500' 
                      : darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {change}
                  </span>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl transition-all duration-300 group-hover:scale-110 ${
              darkMode 
                ? 'bg-blue-500/10 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10' 
                : 'bg-gradient-to-br from-blue-50 to-blue-100/50 ring-1 ring-blue-200/50 shadow-md shadow-blue-200/50'
            }`}>
              <IconComponent className={`w-7 h-7 ${
                darkMode ? 'text-blue-400 drop-shadow-lg' : 'text-blue-600'
              }`} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case WidgetType.KPI_CARD:
        return renderPremiumKPICard(widget)

      case WidgetType.SALES_CHART:
        return (
          <div className={`group rounded-2xl border p-6 transition-all duration-500 ${
            darkMode 
              ? 'bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border-gray-700/50 shadow-2xl shadow-black/50 hover:shadow-blue-900/20 hover:shadow-2xl ring-1 ring-white/5' 
              : 'bg-white/95 border-gray-200/80 shadow-xl shadow-gray-200/50 hover:shadow-blue-100/30 hover:shadow-2xl ring-1 ring-gray-900/5 backdrop-blur-sm'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white drop-shadow-lg' : 'text-gray-900'}`}>
                  {widget.title || 'Sales Performance'}
                </h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Revenue vs Target - Last 6 Months
                </p>
              </div>
              <span className={`text-sm font-bold px-4 py-2 rounded-xl transition-all duration-300 ${
                darkMode 
                  ? 'text-green-400 bg-green-500/10 border border-green-500/20 ring-1 ring-green-500/20 shadow-lg shadow-green-500/10' 
                  : 'text-green-700 bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50 ring-1 ring-green-200/50 shadow-md shadow-green-200/50'
              }`}>
                +8.5% MoM
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className={`text-center p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                darkMode 
                  ? 'bg-blue-500/10 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10' 
                  : 'bg-gradient-to-br from-blue-50 to-blue-100/50 ring-1 ring-blue-200/50 shadow-md shadow-blue-200/50'
              }`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400 drop-shadow-lg' : 'text-blue-600'}`}>
                  $2.4M
                </div>
                <div className={`text-xs font-semibold uppercase tracking-wider mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Revenue</div>
              </div>
              <div className={`text-center p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                darkMode 
                  ? 'bg-green-500/10 ring-1 ring-green-500/20 shadow-lg shadow-green-500/10' 
                  : 'bg-gradient-to-br from-green-50 to-green-100/50 ring-1 ring-green-200/50 shadow-md shadow-green-200/50'
              }`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-green-400 drop-shadow-lg' : 'text-green-600'}`}>
                  156
                </div>
                <div className={`text-xs font-semibold uppercase tracking-wider mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Deals Closed</div>
              </div>
              <div className={`text-center p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                darkMode 
                  ? 'bg-purple-500/10 ring-1 ring-purple-500/20 shadow-lg shadow-purple-500/10' 
                  : 'bg-gradient-to-br from-purple-50 to-purple-100/50 ring-1 ring-purple-200/50 shadow-md shadow-purple-200/50'
              }`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400 drop-shadow-lg' : 'text-purple-600'}`}>
                  $15.4K
                </div>
                <div className={`text-xs font-semibold uppercase tracking-wider mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Deal Size</div>
              </div>
              <div className={`text-center p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                darkMode 
                  ? 'bg-orange-500/10 ring-1 ring-orange-500/20 shadow-lg shadow-orange-500/10' 
                  : 'bg-gradient-to-br from-orange-50 to-orange-100/50 ring-1 ring-orange-200/50 shadow-md shadow-orange-200/50'
              }`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-orange-400 drop-shadow-lg' : 'text-orange-600'}`}>
                  23 days
                </div>
                <div className={`text-xs font-semibold uppercase tracking-wider mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Cycle</div>
              </div>
            </div>
            <PremiumLineChart
              data={monthlyData}
              dataKeys={[
                { key: 'revenue', color: '#3B82F6', name: 'Revenue' },
                { key: 'target', color: '#10B981', name: 'Target' }
              ]}
              height={250}
              darkMode={darkMode}
            />
          </div>
        )

      case WidgetType.TEAM_PERFORMANCE:
        return (
          <div className={`group rounded-2xl border p-6 transition-all duration-500 ${
            darkMode 
              ? 'bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border-gray-700/50 shadow-2xl shadow-black/50 hover:shadow-purple-900/20 hover:shadow-2xl ring-1 ring-white/5' 
              : 'bg-white/95 border-gray-200/80 shadow-xl shadow-gray-200/50 hover:shadow-purple-100/30 hover:shadow-2xl ring-1 ring-gray-900/5 backdrop-blur-sm'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {widget.title || 'Team Performance'}
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Individual performance metrics
                </p>
              </div>
              <span className={`text-sm font-medium px-3 py-1 rounded-lg ${
                darkMode 
                  ? 'bg-blue-900/30 text-blue-400 border border-blue-700' 
                  : 'bg-blue-50 text-blue-700 border border-blue-100'
              }`}>
                5 Members
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-green-50'}`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  85%
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Performance</div>
              </div>
              <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  4/5
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Above Target</div>
              </div>
              <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-purple-50'}`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  $1.18M
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Team Revenue</div>
              </div>
            </div>
            <PremiumBarChart
              data={teamData.map(m => ({ name: m.name, Performance: m.performance }))}
              dataKeys={[{ key: 'Performance', color: '#3B82F6', name: 'Performance %' }]}
              height={250}
              darkMode={darkMode}
            />
          </div>
        )

      case WidgetType.PIPELINE_OVERVIEW:
        return (
          <div className={`group rounded-2xl border p-6 transition-all duration-500 ${
            darkMode 
              ? 'bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border-gray-700/50 shadow-2xl shadow-black/50 hover:shadow-indigo-900/20 hover:shadow-2xl ring-1 ring-white/5' 
              : 'bg-white/95 border-gray-200/80 shadow-xl shadow-gray-200/50 hover:shadow-indigo-100/30 hover:shadow-2xl ring-1 ring-gray-900/5 backdrop-blur-sm'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {widget.title || 'Pipeline Overview'}
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  PEAK methodology stages
                </p>
              </div>
              <span className={`text-sm font-medium px-3 py-1 rounded-lg ${
                darkMode 
                  ? 'bg-indigo-900/30 text-indigo-400 border border-indigo-700' 
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
              }`}>
                PEAK
              </span>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className={`p-5 rounded-xl transition-all duration-300 hover:scale-105 ${
                darkMode 
                  ? 'bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10' 
                  : 'bg-gradient-to-br from-blue-50 via-purple-50/50 to-indigo-50 ring-1 ring-blue-200/50 shadow-md shadow-blue-200/50'
              }`}>
                <div className={`text-3xl font-bold mb-1 ${darkMode ? 'text-blue-400 drop-shadow-lg' : 'text-blue-600'}`}>
                  $1.96M
                </div>
                <div className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Pipeline</div>
              </div>
              <div className={`p-5 rounded-xl transition-all duration-300 hover:scale-105 ${
                darkMode 
                  ? 'bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 ring-1 ring-green-500/20 shadow-lg shadow-green-500/10' 
                  : 'bg-gradient-to-br from-green-50 via-emerald-50/50 to-teal-50 ring-1 ring-green-200/50 shadow-md shadow-green-200/50'
              }`}>
                <div className={`text-3xl font-bold mb-1 ${darkMode ? 'text-green-400 drop-shadow-lg' : 'text-green-600'}`}>
                  23.4%
                </div>
                <div className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Conversion Rate</div>
              </div>
            </div>
            <PremiumDonutChart
              data={pipelineData}
              height={300}
              darkMode={darkMode}
            />
          </div>
        )

      case WidgetType.RECENT_ACTIVITY:
        return (
          <div className={`group rounded-2xl border p-6 transition-all duration-500 ${
            darkMode 
              ? 'bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border-gray-700/50 shadow-2xl shadow-black/50 hover:shadow-emerald-900/20 hover:shadow-2xl ring-1 ring-white/5' 
              : 'bg-white/95 border-gray-200/80 shadow-xl shadow-gray-200/50 hover:shadow-emerald-100/30 hover:shadow-2xl ring-1 ring-gray-900/5 backdrop-blur-sm'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {widget.title || 'Recent Activity'}
              </h3>
              <div className={`text-sm flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <ClockIcon className="w-4 h-4" />
                Last 24 hours
              </div>
            </div>
            <div className="space-y-4">
              {[
                { icon: '💰', title: 'New opportunity created', desc: 'Pharma Corp - Enterprise Deal ($250K)', ago: '2 hours ago', 
                  color: darkMode ? 'bg-green-500/10 ring-1 ring-green-500/20 shadow-lg shadow-green-500/5' : 'bg-gradient-to-br from-green-50 to-emerald-50/50 ring-1 ring-green-200/50 shadow-md shadow-green-200/30', 
                  iconBg: darkMode ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/50' : 'bg-gradient-to-br from-green-500 to-green-600 shadow-md shadow-green-500/30' },
                { icon: '📅', title: 'Meeting scheduled', desc: 'Dr. Smith - Product demonstration', ago: '4 hours ago', 
                  color: darkMode ? 'bg-blue-500/10 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/5' : 'bg-gradient-to-br from-blue-50 to-indigo-50/50 ring-1 ring-blue-200/50 shadow-md shadow-blue-200/30', 
                  iconBg: darkMode ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50' : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/30' },
                { icon: '📦', title: 'Sample order processed', desc: '250 units shipped to Metro Hospital', ago: '6 hours ago', 
                  color: darkMode ? 'bg-purple-500/10 ring-1 ring-purple-500/20 shadow-lg shadow-purple-500/5' : 'bg-gradient-to-br from-purple-50 to-violet-50/50 ring-1 ring-purple-200/50 shadow-md shadow-purple-200/30', 
                  iconBg: darkMode ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/50' : 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-md shadow-purple-500/30' },
              ].map((a, idx) => (
                <div key={idx} className={`flex items-start space-x-4 p-4 ${a.color} rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer`}>
                  <div className={`w-12 h-12 ${a.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 ring-2 ring-white/10 transition-transform duration-300 hover:scale-110`}>
                    <span className="text-white text-xl">{a.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold text-sm mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{a.title}</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{a.desc}</div>
                    <div className={`text-xs font-medium mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{a.ago}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case WidgetType.QUOTA_TRACKER:
        return (
          <div className={`group rounded-2xl border p-6 transition-all duration-500 ${
            darkMode 
              ? 'bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border-gray-700/50 shadow-2xl shadow-black/50 hover:shadow-blue-900/20 hover:shadow-2xl ring-1 ring-white/5' 
              : 'bg-white/95 border-gray-200/80 shadow-xl shadow-gray-200/50 hover:shadow-blue-100/30 hover:shadow-2xl ring-1 ring-gray-900/5 backdrop-blur-sm'
          }`}>
            <h3 className={`text-lg font-bold mb-6 ${darkMode ? 'text-white drop-shadow-lg' : 'text-gray-900'}`}>
              {widget.title || 'Quota Tracker'}
            </h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Current Progress</span>
                <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
                  darkMode 
                    ? 'text-blue-400 bg-blue-500/10 ring-1 ring-blue-500/20' 
                    : 'text-blue-700 bg-blue-50 ring-1 ring-blue-200/50'
                }`}>78%</span>
              </div>
              <div className="relative">
                <div className={`w-full rounded-full h-4 overflow-hidden ${
                  darkMode ? 'bg-gray-700/50 ring-1 ring-gray-600/50' : 'bg-gray-200 ring-1 ring-gray-300/50'
                }`}>
                  <div 
                    className={`h-4 rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${
                      darkMode 
                        ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 shadow-lg shadow-blue-500/50' 
                        : 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 shadow-md shadow-blue-500/30'
                    }`}
                    style={{ width: '78%' }}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>
              <div className={`flex justify-between text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <span>$1.95M / $2.5M</span>
                <span>22 days left</span>
              </div>
            </div>
          </div>
        )

      case WidgetType.PHARMA_KPI_CARD: {
        const kpi = (widget.data as PharmaKPICardData) || { 
          kpiId: 'trx', 
          kpiName: widget.title, 
          value: 0, 
          confidence: 0.9, 
          trend: 'stable', 
          format: 'number', 
          metadata: {} 
        }
        return (
          <div className={`group rounded-2xl border p-6 transition-all duration-500 hover:scale-[1.02] ${
            darkMode 
              ? 'bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border-violet-500/30 shadow-2xl shadow-violet-900/30 hover:shadow-violet-500/30 hover:shadow-2xl ring-1 ring-violet-500/20' 
              : 'bg-gradient-to-br from-violet-50 via-purple-50/50 to-fuchsia-50 border-violet-200/80 shadow-xl shadow-violet-200/50 hover:shadow-violet-300/50 hover:shadow-2xl ring-1 ring-violet-200/50'
          }`}>
            <KPICard
              title={kpi.kpiName || widget.title}
              value={typeof kpi.value === 'number' ? kpi.value : 0}
              trend={kpi.trend === 'up' || kpi.trend === 'down' ? kpi.trend : 'stable'}
              color="violet"
              confidence={Math.round((Number(kpi.confidence) || 0.9) * 100)}
              format={kpi.format || 'number'}
              clickable={false}
            />
          </div>
        )
      }

      default:
        return (
          <div className={`rounded-xl shadow-xl border h-32 flex items-center justify-center ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="text-center">
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{widget.title || 'Widget'}</p>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {`Unsupported widget type: ${widget.type}`}
              </p>
            </div>
          </div>
        )
    }
  }

  useEffect(() => { void loadDashboardLayout() }, [loadDashboardLayout])

  useEffect(() => {
    const run = async () => {
      if (!isAdminUser) return
      if (!isViewingAdmin) return
      if (publishOnce.current) return
      const orgKey = dashboard.organizationId || 'no-org'
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(`adminDefaultPublished:${orgKey}`) : null
      if (stored === 'true') {
        publishOnce.current = true
        return
      }
      try {
        const res = await fetch('/api/dashboard/templates?role=admin', { cache: 'no-store' })
        let shouldPublish = true
        if (res.ok) {
          const json = await res.json()
          const list = Array.isArray(json?.data) ? json.data as Array<{ id: string; is_default?: boolean }> : []
          if (list.some(t => t.is_default)) shouldPublish = false
        }
        if (shouldPublish) {
          const layoutPayload = widgets.map(w => ({
            id: w.id,
            type: w.type,
            title: w.title,
            x: w.position.x,
            y: w.position.y,
            w: w.position.w,
            h: w.position.h,
            ...(w.data && typeof w.data === 'object' && (w.data as { metadata?: Record<string, unknown> }).metadata
              ? { metadata: (w.data as { metadata?: Record<string, unknown> }).metadata as Record<string, unknown> }
              : {})
          }))
          await fetch('/api/dashboard/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'admin', name: 'Admin Default', layout: layoutPayload, isDefault: true })
          })
        }
        publishOnce.current = true
        if (typeof window !== 'undefined') window.localStorage.setItem(`adminDefaultPublished:${orgKey}`, 'true')
      } catch {
        // ignore
      }
    }
    void run()
  }, [isAdminUser, isViewingAdmin, widgets, dashboard.organizationId])

  // If viewing as SALESMAN role, render the PremiumSalesmanDashboard instead
  if (viewRole === UserRole.SALESMAN) {
    return (
      <PremiumSalesmanDashboard
        userId={_userId}
        userRole={viewRole}
        organizationId={dashboard.organizationId || ''}
        darkMode={darkMode}
      />
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50'
    }`}>
      <div className={`border-b transition-all duration-500 ${
        darkMode 
          ? 'bg-gray-900/95 border-gray-700/50 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-white/5' 
          : 'bg-white/95 border-gray-200/80 backdrop-blur-xl shadow-lg shadow-gray-200/50 ring-1 ring-gray-900/5'
      } sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold mb-1 ${
              darkMode ? 'text-white drop-shadow-2xl' : 'text-gray-900'
            }`}>
              {viewRole.replace('_', ' ').toUpperCase()} Dashboard
            </h1>
            {dashboard.organizationId && (
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Organization: {organizationName || dashboard.organizationId}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isAdminUser && (
              <select
                aria-label="Select dashboard role"
                className={`text-sm border rounded px-3 py-2 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-200' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                value={viewRole}
                onChange={(e) => setViewRole(e.target.value as UserRole)}
              >
                {Object.values(UserRole).map((role) => (
                  <option key={role} value={role}>{String(role).replace(/_/g, ' ').toUpperCase()}</option>
                ))}
              </select>
            )}
            <DashboardControls darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            {permissions.canCustomizeDashboard && viewRole === userRole && (
              <button
                onClick={() => { if (isEditMode) void saveDashboardLayout(widgets); setIsEditMode(!isEditMode) }}
                className={`group px-5 py-2.5 rounded-xl font-bold transition-all duration-300 hover:scale-105 ${
                  darkMode
                    ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 hover:from-blue-500 hover:via-blue-600 hover:to-blue-500 text-white shadow-2xl shadow-blue-900/50 hover:shadow-blue-500/50 ring-1 ring-blue-400/20'
                    : 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 hover:from-blue-500 hover:via-blue-600 hover:to-blue-500 text-white shadow-xl shadow-blue-500/50 hover:shadow-blue-600/60 ring-1 ring-blue-400/20'
                }`}
              >
                <span className="flex items-center gap-2">
                  {isEditMode ? '💾 Save Layout' : '✨ Customize'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-min">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className={`${
                widget.position.w === 12 
                  ? 'col-span-1 md:col-span-2 lg:col-span-12' 
                  : widget.position.w === 6
                  ? 'col-span-1 md:col-span-1 lg:col-span-6'
                  : 'col-span-1 md:col-span-1 lg:col-span-3'
              } transition-all duration-300 ${isEditMode ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
              style={{ 
                gridRow: `span ${widget.position.h}`, 
                minHeight: `${widget.position.h * 100}px` 
              }}
            >
              {isEditMode && (
                <div className={`flex justify-between items-center mb-3 p-3 rounded-xl transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gray-700/50 ring-1 ring-gray-600/50 shadow-lg shadow-black/20' 
                    : 'bg-gray-100 ring-1 ring-gray-200/50 shadow-md shadow-gray-200/50'
                }`}>
                  <button 
                    className={`text-sm font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    } hover:text-blue-500 cursor-move transition-colors duration-200 flex items-center gap-2`}
                    title="Drag to reorder"
                  >
                    <span className="text-gray-400">⋮⋮</span> {widget.title}
                  </button>
                  <button 
                    className={`text-sm font-bold px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105 ${
                      darkMode 
                        ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20 ring-1 ring-red-500/20' 
                        : 'text-red-600 bg-red-50 hover:bg-red-100 ring-1 ring-red-200/50'
                    }`}
                    onClick={() => setWidgets(widgets.filter(w => w.id !== widget.id))}
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
              <div className="h-full">{renderWidget(widget)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function EnhancedRoleBasedDashboard(props: EnhancedRoleBasedDashboardProps) {
  return (
    <DashboardProvider initialSettings={{ autoRefresh: true, refreshInterval: 15, defaultPeriodDays: 30 }}>
      <DashboardContent {...props} />
    </DashboardProvider>
  )
}
