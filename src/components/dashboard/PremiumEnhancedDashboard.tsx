"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { UserRole, getUserPermissions } from '@/lib/roles'
import { DashboardWidget, WidgetType, DEFAULT_WIDGETS } from '@/lib/dashboard-widgets'
import { KPICardData, PharmaKPICardData } from '@/lib/types/dashboard'
import { useDashboard, DashboardProvider } from '@/components/dashboard/DashboardContext'
import { formatCurrencySafe, toFiniteNumber } from '@/lib/format'
import { AuthService } from '@/lib/auth-unified'
import { ArrowTrendingUpIcon, ChartBarIcon, ClockIcon, CurrencyDollarIcon, SparklesIcon, SunIcon, MoonIcon, UserGroupIcon } from '@heroicons/react/24/outline'

// Heavy, client-only charts
const PremiumLineChart = dynamic(() => import('@/components/charts/PremiumLineChart').then(m => m.PremiumLineChart), { ssr: false })
const PremiumBarChart = dynamic(() => import('@/components/charts/PremiumBarChart').then(m => m.PremiumBarChart), { ssr: false })
const PremiumDonutChart = dynamic(() => import('@/components/charts/PremiumDonutChart').then(m => m.PremiumDonutChart), { ssr: false })
const PremiumSalesmanDashboard = dynamic(() => import('@/components/dashboard/PremiumSalesmanDashboard'), { ssr: false })

interface EnhancedRoleBasedDashboardProps {
  userRole: UserRole
  userId: string
  organizationNameSSR?: string | null
  organizationId?: string | null
}

// Mock data
const generateMonthlyData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  return months.map((name, i) => ({
    name,
    revenue: 120000 + i * 15000 + Math.random() * 10000,
    target: 100000 + i * 12000,
    prescriptions: 450 + i * 50 + Math.random() * 30,
    newPrescriptions: 80 + i * 10 + Math.random() * 15,
  }))
}
const generateTeamData = () => [
  { name: 'Sarah Johnson', performance: 95, revenue: 285000, color: '#10B981' },
  { name: 'John Smith', performance: 87, revenue: 245000, color: '#3B82F6' },
  { name: 'Mike Davis', performance: 78, revenue: 198000, color: '#F59E0B' },
  { name: 'Emma Wilson', performance: 92, revenue: 267000, color: '#8B5CF6' },
  { name: 'Tom Brown', performance: 73, revenue: 182000, color: '#EF4444' },
]
const generatePipelineData = () => [
  { name: 'Prospecting', value: 420000, color: '#3B82F6' },
  { name: 'Engaging', value: 540000, color: '#F59E0B' },
  { name: 'Advancing', value: 680000, color: '#10B981' },
  { name: 'Key Decision', value: 320000, color: '#8B5CF6' },
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
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

  const monthlyData = useMemo(() => generateMonthlyData(), [])
  const teamData = useMemo(() => generateTeamData(), [])
  const pipelineData = useMemo(() => generatePipelineData(), [])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev
      if (typeof window !== 'undefined') localStorage.setItem('dashboardDarkMode', String(next))
      return next
    })
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardDarkMode')
      if (saved) setDarkMode(saved === 'true')
    }
  }, [])

  const loadDashboardLayout = useCallback(async () => { setWidgets(DEFAULT_WIDGETS) }, [])
  const saveDashboardLayout = useCallback(async (_newWidgets: DashboardWidget[]) => {}, [])

  // Load organization name (RLS-safe; use AuthService client)
  useEffect(() => {
    let isActive = true
    const loadOrg = async () => {
      try {
        if (!dashboard.organizationId) { setOrganizationName(null); return }
        const supabaseClient = AuthService.getClient()
        const { data, error } = await supabaseClient.from('organizations' as const).select('name').eq('id', dashboard.organizationId).single()
        if (!isActive) return
        if (error) { setOrganizationName(null); return }
        setOrganizationName(((data as { name?: string } | null)?.name) ?? null)
      } catch { if (isActive) setOrganizationName(null) }
    }
    if (!organizationNameSSR) void loadOrg()
    return () => { isActive = false }
  }, [dashboard.organizationId, organizationNameSSR])

  // Drilldown state and URL sync helpers
  type DrilldownType = 'kpi' | 'sales' | 'team' | 'pipeline' | 'quota'
  type DrilldownPayload = { type: DrilldownType; title: string; data?: unknown }
  const [drilldownOpen, setDrilldownOpen] = useState(false)
  const [drilldown, setDrilldown] = useState<DrilldownPayload | null>(null)
  const buildURLWithParams = useCallback((params: Record<string, string | null | undefined>) => {
    const sp = new URLSearchParams(searchParams?.toString() || '')
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') sp.delete(k)
      else sp.set(k, String(v))
    })
    return `${pathname}?${sp.toString()}`
  }, [pathname, searchParams])
  const openDrilldown = useCallback((payload: DrilldownPayload, extras?: Record<string, string | number | boolean | null | undefined>) => {
    setDrilldown(payload)
    setDrilldownOpen(true)
    try {
      const base: Record<string, string | null> = { drilldown: payload.type }
      if (extras) Object.entries(extras).forEach(([k, v]) => { base[k] = v == null ? null : String(v) })
      const url = buildURLWithParams(base)
      router.replace(url)
    } catch {}
  }, [buildURLWithParams, router])
  const closeDrilldown = useCallback(() => {
    setDrilldownOpen(false)
    setTimeout(() => setDrilldown(null), 200)
    try {
      const url = buildURLWithParams({ drilldown: null, period: null, kpiId: null, ownerId: null, region: null })
      router.replace(url)
    } catch {}
  }, [buildURLWithParams, router])

  // Close on ESC
  useEffect(() => {
    if (!drilldownOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrilldown() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drilldownOpen, closeDrilldown])

  // Initialize drilldown from URL
  useEffect(() => {
    const raw = searchParams?.get('drilldown')
    const allowed: DrilldownType[] = ['kpi', 'sales', 'team', 'pipeline', 'quota']
    const type = allowed.includes(raw as DrilldownType) ? (raw as DrilldownType) : null
    if (!type) {
      if (drilldownOpen) {
        setDrilldownOpen(false)
        setTimeout(() => setDrilldown(null), 200)
      }
      return
    }
    if (drilldownOpen && drilldown?.type === type) return
    const defaultTitles: Record<DrilldownType, string> = {
      kpi: 'KPI Details', sales: 'Sales Performance', team: 'Team Performance', pipeline: 'Pipeline Overview', quota: 'Quota Tracker'
    }
    const defaultData: Partial<Record<DrilldownType, unknown>> = { sales: monthlyData, team: teamData, pipeline: pipelineData }
    const kpiId = type === 'kpi' ? (searchParams?.get('kpiId') || '').trim() : ''
    const title = type === 'kpi' && kpiId ? `${defaultTitles[type]} — ${kpiId}` : defaultTitles[type]
    setDrilldown({ type, title, data: defaultData[type] })
    setDrilldownOpen(true)
  }, [searchParams, drilldownOpen, drilldown, monthlyData, teamData, pipelineData])

  // Nested Drilldown panel (territory-based region logic)
  const DrilldownPanel: React.FC = () => {
    const routerD = useRouter()
    const searchParamsD = useSearchParams()
    const pathnameD = usePathname()
    const orgId = dashboard.organizationId
    const drilldownType = (searchParamsD?.get('drilldown') || '') as string
    const isSalesD = drilldownType === 'sales'
    const isPipelineD = drilldownType === 'pipeline'
    const [pipelineLive, setPipelineLive] = useState<Array<{ name: string; value: number }> | null>(null)
    const [loadingLive, setLoadingLive] = useState(false)
    const [salesLive, setSalesLive] = useState<Array<{ name: string; revenue: number; target: number }> | null>(null)
    const [loadingSales, setLoadingSales] = useState(false)
    const [periodDays, setPeriodDays] = useState<number>(180)
    const [owners, setOwners] = useState<Array<{ id: string; name: string }>>([])
    const [regions, setRegions] = useState<string[]>([])

    const buildURLWithParamsD = useCallback((params: Record<string, string | null | undefined>) => {
      const sp = new URLSearchParams(searchParamsD?.toString() || '')
      Object.entries(params).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '') sp.delete(k)
        else sp.set(k, String(v))
      })
      return `${pathnameD}?${sp.toString()}`
    }, [pathnameD, searchParamsD])

    const ownerIdFilter = (searchParamsD?.get('ownerId') || '').trim()
    const regionFilter = (searchParamsD?.get('region') || '').trim()

    const clampPeriod = (n: number): 30 | 90 | 180 => {
      if (n === 30 || n === 90 || n === 180) return n
      const opts = [30, 90, 180] as const
      let nearest: 30 | 90 | 180 = 30
      let bestDiff = Infinity
      for (const v of opts) {
        const diff = Math.abs(n - v)
        if (diff < bestDiff) { bestDiff = diff; nearest = v }
      }
      return nearest
    }

    // Pipeline live
    useEffect(() => {
      if (!isPipelineD) return
      if (!orgId) return
      let cancelled = false
      const run = async () => {
        try {
          setLoadingLive(true)
          const supabaseClient = AuthService.getClient()
          let regionOwnerIds: string[] = []
          if (regionFilter) {
            const { data: terr } = await supabaseClient
              .from('sales_territories' as const)
              .select('assigned_user_id, name')
              .eq('name', regionFilter)
              .eq('organization_id', orgId)
              .limit(1000)
            if (Array.isArray(terr)) {
              regionOwnerIds = (terr as Array<{ assigned_user_id: string | null }>).
                map(t => t.assigned_user_id || '').filter(Boolean) as string[]
            }
            if (regionOwnerIds.length === 0) { if (!cancelled) setPipelineLive([]); return }
          }
          let q1 = supabaseClient
            .from('opportunities' as const)
            .select('peak_stage, deal_value')
            .eq('organization_id', orgId)
          if (ownerIdFilter) q1 = q1.eq('assigned_to', ownerIdFilter)
          if (regionFilter && regionOwnerIds.length > 0) q1 = q1.in('assigned_to', regionOwnerIds)
          const { data, error } = await q1.limit(1000)
          if (!error && Array.isArray(data)) {
            const acc = new Map<string, number>()
            for (const row of data as Array<{ peak_stage: string | null; deal_value: number | null }>) {
              const stage = (row.peak_stage || 'unknown') as string
              const val = Number(row.deal_value) || 0
              acc.set(stage, (acc.get(stage) || 0) + val)
            }
            const arr = Array.from(acc.entries()).map(([name, value]) => ({ name, value }))
            if (!cancelled) setPipelineLive(arr)
          }
        } catch {
        } finally {
          if (!cancelled) setLoadingLive(false)
        }
      }
      void run()
      return () => { cancelled = true }
    }, [isPipelineD, orgId, ownerIdFilter, regionFilter])

    // Owners + Regions options
    useEffect(() => {
      if (!(drilldownType === 'sales' || drilldownType === 'pipeline')) return
      if (!orgId) return
      let cancelled = false
      const run = async () => {
        try {
          const supabaseClient = AuthService.getClient()
          const { data: users } = await supabaseClient
            .from('user_profiles' as const)
            .select('id, full_name')
            .eq('organization_id', orgId)
            .order('full_name', { ascending: true })
            .limit(500)
          if (!cancelled && Array.isArray(users)) {
            const mapped = (users as Array<{ id: string; full_name: string | null }>).
              map(u => ({ id: u.id, name: u.full_name || u.id }))
            setOwners(mapped)
          }
          const { data: terrs } = await supabaseClient
            .from('sales_territories' as const)
            .select('name')
            .eq('organization_id', orgId)
            .limit(2000)
          if (!cancelled && Array.isArray(terrs)) {
            const setVals = new Set<string>()
            for (const row of terrs as Array<{ name: string | null }>) {
              const s = (row.name || '').trim()
              if (s) setVals.add(s)
            }
            setRegions(Array.from(setVals).sort((a, b) => a.localeCompare(b)))
          }
        } catch {}
      }
      void run()
      return () => { cancelled = true }
    }, [drilldownType, orgId])

    // Sync initial period from URL when sales opens
    useEffect(() => {
      if (!isSalesD) return
      const p = searchParamsD?.get('period')
      if (!p) return
      const n = Number(p)
      if (Number.isFinite(n)) setPeriodDays(clampPeriod(n))
    }, [isSalesD, searchParamsD])

    // Update URL when period changes
    useEffect(() => {
      if (!isSalesD) return
      try {
        const url = buildURLWithParamsD({ drilldown: 'sales', period: String(periodDays) })
        routerD.replace(url)
      } catch {}
    }, [isSalesD, periodDays, buildURLWithParamsD, routerD])

    // Sales live series
    useEffect(() => {
      if (!isSalesD) return
      if (!orgId) return
      let cancelled = false
      const run = async () => {
        try {
          setLoadingSales(true)
          const supabaseClient = AuthService.getClient()
          const start = new Date(); start.setDate(start.getDate() - periodDays)
          const startStr = start.toISOString().split('T')[0]
          let regionOwnerIds: string[] = []
          if (regionFilter) {
            const { data: terr } = await supabaseClient
              .from('sales_territories' as const)
              .select('assigned_user_id, name')
              .eq('name', regionFilter)
              .eq('organization_id', orgId)
              .limit(1000)
            if (Array.isArray(terr)) {
              regionOwnerIds = (terr as Array<{ assigned_user_id: string | null }>).
                map(t => t.assigned_user_id || '').filter(Boolean) as string[]
            }
            if (regionOwnerIds.length === 0) { if (!cancelled) setSalesLive([]); return }
          }
          let q2 = supabaseClient
            .from('opportunities' as const)
            .select('deal_value, close_date, created_at')
            .eq('organization_id', orgId)
            .gte('close_date', startStr)
          if (ownerIdFilter) q2 = q2.eq('assigned_to', ownerIdFilter)
          if (regionFilter && regionOwnerIds.length > 0) q2 = q2.in('assigned_to', regionOwnerIds)
          const { data } = await q2.limit(2000)
          if (Array.isArray(data)) {
            const labels: string[] = (() => {
              const out: string[] = []
              const end = new Date(); const startD = new Date(); startD.setDate(end.getDate() - periodDays)
              const cursor = new Date(startD.getFullYear(), startD.getMonth(), 1)
              const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)
              while (cursor <= endMonth) { out.push(cursor.toLocaleString('en-US', { month: 'short' })); cursor.setMonth(cursor.getMonth() + 1) }
              return out
            })()
            const agg = new Map<string, number>()
            for (const row of data as Array<{ deal_value: number | null; close_date: string | null; created_at: string | null }>) {
              const dateStr = row.close_date || row.created_at; if (!dateStr) continue
              const d = new Date(dateStr); if (isNaN(d.getTime())) continue
              const name = d.toLocaleString('en-US', { month: 'short' }); if (!labels.includes(name)) continue
              agg.set(name, (agg.get(name) || 0) + (Number(row.deal_value) || 0))
            }
            const targetMap = new Map<string, number>(monthlyData.map(m => [m.name, toFiniteNumber((m as { target?: number }).target, 0)]))
            const series = labels.map(name => ({ name, revenue: agg.get(name) || 0, target: targetMap.get(name) || 0 }))
            if (!cancelled) setSalesLive(series)
          }
        } catch {}
        finally { if (!cancelled) setLoadingSales(false) }
      }
      void run()
      return () => { cancelled = true }
    }, [isSalesD, orgId, periodDays, ownerIdFilter, regionFilter])

    if (!drilldown) return null
    return (
      <>
        <div
          className={`fixed inset-0 z-50 transition-opacity ${drilldownOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${darkMode ? 'bg-black/60' : 'bg-black/40'}`}
          onClick={closeDrilldown}
          aria-hidden="true"
        />
        <div
          role="dialog"
          aria-modal="true"
          className={`fixed right-0 top-0 bottom-0 w-full sm:w-[640px] md:w-[720px] lg:w-[820px] z-50 transition-transform duration-300 transform ${drilldownOpen ? 'translate-x-0' : 'translate-x-full'} ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} shadow-2xl ring-1 ${darkMode ? 'ring-gray-700' : 'ring-gray-200'}`}
        >
          <div className="p-5 border-b flex items-center justify-between sticky top-0 z-10"
               style={{ borderColor: darkMode ? '#374151' : '#E5E7EB', background: darkMode ? '#111827' : '#ffffff' }}>
            <h3 id="drilldown-title" className="text-lg font-semibold">{drilldown.title}</h3>
            <button
              onClick={closeDrilldown}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
              aria-label="Close drilldown"
              autoFocus
            >
              Close
            </button>
          </div>
          <div className="p-5 overflow-y-auto h-[calc(100%-64px)]">
            {drilldown.type === 'kpi' && (
              <div className="space-y-4">
                {(() => {
                  const d = (drilldown.data as { value?: number; trend?: string; change?: string }) || {}
                  return (
                    <>
                      <div className="text-3xl font-bold">{formatCurrencySafe(toFiniteNumber(d.value, 0), { compact: false })}</div>
                      <div className="text-sm">
                        <span className={`${d.trend === 'up' ? 'text-green-500' : d.trend === 'down' ? 'text-red-500' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{d.change || '+0%'}</span>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Last 6 months</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {monthlyData.map(m => (
                            <div key={m.name} className={`flex items-center justify-between p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                              <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{m.name}</span>
                              <span className="font-medium">{formatCurrencySafe(m.revenue)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}

            {drilldown.type === 'sales' && (
              <div className="space-y-4">
                <h4 className="font-semibold">Revenue vs Target</h4>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Period</span>
                    <select
                      value={periodDays}
                      onChange={(e) => setPeriodDays(Number(e.target.value))}
                      className={`px-2 py-1 rounded border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                    >
                      <option value={30}>Last 30 days</option>
                      <option value={90}>Last 90 days</option>
                      <option value={180}>Last 180 days</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Owner</span>
                    <select
                      value={searchParamsD?.get('ownerId') || ''}
                      onChange={(e) => {
                        const v = e.currentTarget.value
                        const url = buildURLWithParamsD({ drilldown: 'sales', period: String(periodDays), ownerId: v || null })
                        routerD.replace(url)
                      }}
                      className={`px-2 py-1 rounded border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                    >
                      <option value="">All owners</option>
                      {owners.map(o => (<option key={o.id} value={o.id}>{o.name}</option>))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Region</span>
                    <select
                      value={searchParamsD?.get('region') || ''}
                      onChange={(e) => {
                        const v = e.currentTarget.value
                        const url = buildURLWithParamsD({ drilldown: 'sales', period: String(periodDays), region: v || null })
                        routerD.replace(url)
                      }}
                      className={`px-2 py-1 rounded border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                    >
                      <option value="">All regions</option>
                      {regions.map(r => (<option key={r} value={r}>{r}</option>))}
                    </select>
                  </label>
                </div>
                {loadingSales && (<div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading live sales…</div>)}
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {(() => {
                    const labels = (() => {
                      const out: string[] = []
                      const end = new Date(); const startD = new Date(); startD.setDate(end.getDate() - periodDays)
                      const cursor = new Date(startD.getFullYear(), startD.getMonth(), 1)
                      const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)
                      while (cursor <= endMonth) { out.push(cursor.toLocaleString('en-US', { month: 'short' })); cursor.setMonth(cursor.getMonth() + 1) }
                      return out
                    })()
                    const targetMap = new Map<string, number>(monthlyData.map(m => [m.name, toFiniteNumber((m as { target?: number }).target, 0)]))
                    const fallback = labels.map(name => ({ name, revenue: 0, target: targetMap.get(name) || 0 }))
                    const rows = salesLive && salesLive.length > 0 ? salesLive : fallback
                    return rows
                  })().map((m) => {
                    const rev = m.revenue
                    const tgt = m.target
                    const name = m.name
                    const delta = toFiniteNumber(rev - tgt, 0)
                    return (
                      <div key={name} className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{name}</span>
                          <span className="font-medium">{formatCurrencySafe(rev)} / {formatCurrencySafe(tgt)}</span>
                        </div>
                        <div className={`text-xs ${delta >= 0 ? 'text-green-500' : 'text-red-500'}`}>{delta >= 0 ? '+' : ''}{formatCurrencySafe(Math.abs(delta))} vs target</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {drilldown.type === 'team' && (
              <div className="space-y-4">
                <h4 className="font-semibold">Team breakdown</h4>
                <div className="divide-y" style={{ borderColor: darkMode ? '#374151' : '#E5E7EB' }}>
                  {teamData.map(m => (
                    <div key={m.name} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-gray-500">Performance: {m.performance}%</div>
                      </div>
                      <div className="font-semibold">{formatCurrencySafe(m.revenue)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {drilldown.type === 'pipeline' && (
              <div className="space-y-4">
                <h4 className="font-semibold">Pipeline stages</h4>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Owner</span>
                    <select
                      value={searchParamsD?.get('ownerId') || ''}
                      onChange={(e) => {
                        const v = e.currentTarget.value
                        const url = buildURLWithParamsD({ drilldown: 'pipeline', ownerId: v || null })
                        routerD.replace(url)
                      }}
                      className={`px-2 py-1 rounded border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                    >
                      <option value="">All owners</option>
                      {owners.map(o => (<option key={o.id} value={o.id}>{o.name}</option>))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Region</span>
                    <select
                      value={searchParamsD?.get('region') || ''}
                      onChange={(e) => {
                        const v = e.currentTarget.value
                        const url = buildURLWithParamsD({ drilldown: 'pipeline', region: v || null })
                        routerD.replace(url)
                      }}
                      className={`px-2 py-1 rounded border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                    >
                      <option value="">All regions</option>
                      {regions.map(r => (<option key={r} value={r}>{r}</option>))}
                    </select>
                  </label>
                </div>
                {loadingLive && (<div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading live pipeline…</div>)}
                <div className="space-y-2">
                  {(() => {
                    const rows = Array.isArray(pipelineLive) && pipelineLive.length > 0 ? pipelineLive : pipelineData
                    const total = rows.reduce((s, p) => s + toFiniteNumber(p.value, 0), 0)
                    return rows.map(p => {
                      const pct = total > 0 ? Math.round((toFiniteNumber(p.value, 0) / total) * 100) : 0
                      return (
                        <div key={p.name} className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{p.name}</div>
                            <div className="text-sm">{formatCurrencySafe(p.value)} • {pct}%</div>
                          </div>
                          <div className={`mt-2 h-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <div className="h-2 rounded bg-indigo-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}

            {drilldown.type === 'quota' && (
              <div className="space-y-4">
                <h4 className="font-semibold">Quota progress</h4>
                <p className="text-sm">Breakdown of current attainment vs target with illustrative data.</p>
                <div className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Attained</span>
                    <span className="font-medium">$1.95M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Target</span>
                    <span className="font-medium">$2.5M</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  const renderPremiumKPICard = (widget: DashboardWidget) => {
    const kpiData = widget.data as KPICardData | undefined
    const value = toFiniteNumber(kpiData?.value, 0)
    const trend = kpiData?.trend === 'up' || kpiData?.trend === 'down' ? kpiData.trend : 'stable'
    const change = kpiData?.change || '+0%'
    const IconComponent = widget.title.includes('Revenue') || widget.title.includes('Value') 
      ? CurrencyDollarIcon
      : widget.title.includes('Leads') || widget.title.includes('Opportunities')
      ? UserGroupIcon
      : widget.title.includes('Rate')
      ? SparklesIcon
      : ChartBarIcon
    const dataForInference = widget.data as PharmaKPICardData | undefined
    const tInfer = (widget.title || '').toLowerCase()
    const inferredKpiId = dataForInference?.kpiId
      ? String(dataForInference.kpiId)
      : tInfer.includes('trx')
      ? 'trx'
      : tInfer.includes('nrx')
      ? 'nrx'
      : tInfer.includes('market share')
      ? 'market_share'
      : tInfer.includes('growth')
      ? 'growth'
      : tInfer.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'kpi'
    return (
      <div
        className={`group rounded-2xl border transition-all duration-500 hover:scale-[1.02] cursor-pointer ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border-gray-700/50 shadow-2xl shadow-black/50 hover:shadow-blue-900/30 hover:shadow-2xl hover:border-gray-600/50 ring-1 ring-white/5' 
          : 'bg-gradient-to-br from-white via-gray-50/50 to-white border-gray-200/80 shadow-xl shadow-gray-200/50 hover:shadow-blue-100/50 hover:shadow-2xl hover:border-blue-200/50 ring-1 ring-gray-900/5'
      }`}
        role="button"
        tabIndex={0}
        onClick={() => openDrilldown({ type: 'kpi', title: widget.title || 'KPI Details', data: { value, trend, change } }, { kpiId: inferredKpiId })}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrilldown({ type: 'kpi', title: widget.title || 'KPI Details', data: { value, trend, change } }, { kpiId: inferredKpiId }) } }}
      >
        <div className="p-6 relative overflow-hidden">
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
            darkMode 
              ? 'bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5' 
              : 'bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50'
          }`} />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className={`text-sm font-semibold mb-2 uppercase tracking-wider ${darkMode ? 'text-gray-400/90' : 'text-gray-600/90'}`}>{widget.title}</p>
              <p className={`text-4xl font-bold mb-1 tracking-tight ${darkMode ? 'text-white drop-shadow-lg' : 'text-gray-900'}`}>
                {widget.title.includes('$') || widget.title.toLowerCase().includes('value') 
                  ? formatCurrencySafe(value, { compact: true })
                  : toFiniteNumber(value, 0).toLocaleString()}
              </p>
              <div className="flex items-center mt-3">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                  trend === 'up' 
                    ? darkMode ? 'bg-green-500/10 ring-1 ring-green-500/20' : 'bg-green-50 ring-1 ring-green-200/50'
                    : trend === 'down' 
                    ? darkMode ? 'bg-red-500/10 ring-1 ring-red-500/20' : 'bg-red-50 ring-1 ring-red-200/50'
                    : darkMode ? 'bg-gray-500/10 ring-1 ring-gray-500/20' : 'bg-gray-100 ring-1 ring-gray-200/50'
                }`}>
                  <ArrowTrendingUpIcon className={`w-4 h-4 ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'} ${trend === 'down' ? 'rotate-180' : ''} transition-transform duration-300`} />
                  <span className={`text-sm font-bold ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{change}</span>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl transition-all duration-300 group-hover:scale-110 ${darkMode ? 'bg-blue-500/10 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10' : 'bg-gradient-to-br from-blue-50 to-blue-100/50 ring-1 ring-blue-200/50 shadow-md shadow-blue-200/50'}`}>
              <IconComponent className={`w-7 h-7 ${darkMode ? 'text-blue-400 drop-shadow-lg' : 'text-blue-600'}`} />
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
          <div className={`group rounded-2xl border p-6 transition-all duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border-gray-700/50 shadow-2xl shadow-black/50 hover:shadow-blue-900/20 hover:shadow-2xl ring-1 ring-white/5' : 'bg-white/95 border-gray-200/80 shadow-xl shadow-gray-200/50 hover:shadow-blue-100/30 hover:shadow-2xl ring-1 ring-gray-900/5 backdrop-blur-sm'}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white drop-shadow-lg' : 'text-gray-900'}`}>{widget.title || 'Sales Performance'}</h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Revenue vs Target - Last 6 Months</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold px-4 py-2 rounded-xl transition-all duration-300 ${darkMode ? 'text-green-400 bg-green-500/10 border border-green-500/20 ring-1 ring-green-500/20 shadow-lg shadow-green-500/10' : 'text-green-700 bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50 ring-1 ring-green-200/50 shadow-md shadow-green-200/50'}`}>+8.5% MoM</span>
                <button onClick={() => openDrilldown({ type: 'sales', title: widget.title || 'Sales Performance', data: monthlyData })} className={`text-sm font-medium px-3 py-1.5 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>View details</button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className={`${'text-center p-4 rounded-xl transition-all duration-300 hover:scale-105'} ${darkMode ? 'bg-blue-500/10 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10' : 'bg-gradient-to-br from-blue-50 to-blue-100/50 ring-1 ring-blue-200/50 shadow-md shadow-blue-200/50'}`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400 drop-shadow-lg' : 'text-blue-600'}`}>$2.4M</div>
                <div className={`text-xs font-semibold uppercase tracking-wider mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Revenue</div>
              </div>
              <div className={`${'text-center p-4 rounded-xl transition-all duration-300 hover:scale-105'} ${darkMode ? 'bg-green-500/10 ring-1 ring-green-500/20 shadow-lg shadow-green-500/10' : 'bg-gradient-to-br from-green-50 to-green-100/50 ring-1 ring-green-200/50 shadow-md shadow-green-200/50'}`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-green-400 drop-shadow-lg' : 'text-green-600'}`}>156</div>
                <div className={`text-xs font-semibold uppercase tracking-wider mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Deals Closed</div>
              </div>
              <div className={`${'text-center p-4 rounded-xl transition-all duration-300 hover:scale-105'} ${darkMode ? 'bg-purple-500/10 ring-1 ring-purple-500/20 shadow-lg shadow-purple-500/10' : 'bg-gradient-to-br from-purple-50 to-purple-100/50 ring-1 ring-purple-200/50 shadow-md shadow-purple-200/50'}`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400 drop-shadow-lg' : 'text-purple-600'}`}>$15.4K</div>
                <div className={`text-xs font-semibold uppercase tracking-wider mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Deal Size</div>
              </div>
              <div className={`${'text-center p-4 rounded-xl transition-all duration-300 hover:scale-105'} ${darkMode ? 'bg-orange-500/10 ring-1 ring-orange-500/20 shadow-lg shadow-orange-500/10' : 'bg-gradient-to-br from-orange-50 to-orange-100/50 ring-1 ring-orange-200/50 shadow-md shadow-orange-200/50'}`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-orange-400 drop-shadow-lg' : 'text-orange-600'}`}>23 days</div>
                <div className={`text-xs font-semibold uppercase tracking-wider mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Cycle</div>
              </div>
            </div>
            <PremiumLineChart data={monthlyData} dataKeys={[{ key: 'revenue', color: '#3B82F6', name: 'Revenue' }, { key: 'target', color: '#10B981', name: 'Target' }]} height={250} darkMode={darkMode} />
          </div>
        )
      case WidgetType.TEAM_PERFORMANCE:
        return (
          <div className={`group rounded-2xl border p-6 transition-all duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border-gray-700/50 shadow-2xl shadow-black/50 hover:shadow-purple-900/20 hover:shadow-2xl ring-1 ring-white/5' : 'bg-white/95 border-gray-200/80 shadow-xl shadow-gray-200/50 hover:shadow-purple-100/30 hover:shadow-2xl ring-1 ring-gray-900/5 backdrop-blur-sm'}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{widget.title || 'Team Performance'}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Individual performance metrics</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium px-3 py-1 rounded-lg ${darkMode ? 'bg-blue-900/30 text-blue-400 border border-blue-700' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>5 Members</span>
                <button onClick={() => openDrilldown({ type: 'team', title: widget.title || 'Team Performance', data: teamData })} className={`text-sm font-medium px-3 py-1.5 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>View details</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className={`${'text-center p-3 rounded-lg'} ${darkMode ? 'bg-gray-700/50' : 'bg-green-50'}`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>85%</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Performance</div>
              </div>
              <div className={`${'text-center p-3 rounded-lg'} ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>4/5</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Above Target</div>
              </div>
              <div className={`${'text-center p-3 rounded-lg'} ${darkMode ? 'bg-gray-700/50' : 'bg-purple-50'}`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>$1.18M</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Team Revenue</div>
              </div>
            </div>
            <PremiumBarChart data={teamData.map(m => ({ name: m.name, Performance: m.performance }))} dataKeys={[{ key: 'Performance', color: '#3B82F6', name: 'Performance %' }]} height={250} darkMode={darkMode} />
          </div>
        )
      case WidgetType.PIPELINE_OVERVIEW:
        return (
          <div className={`group rounded-2xl border p-6 transition-all duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border-gray-700/50 shadow-2xl shadow-black/50 hover:shadow-indigo-900/20 hover:shadow-2xl ring-1 ring-white/5' : 'bg-white/95 border-gray-200/80 shadow-xl shadow-gray-200/50 hover:shadow-indigo-100/30 hover:shadow-2xl ring-1 ring-gray-900/5 backdrop-blur-sm'}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{widget.title || 'Pipeline Overview'}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>PEAK methodology stages</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium px-3 py-1 rounded-lg ${darkMode ? 'bg-indigo-900/30 text-indigo-400 border border-indigo-700' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>PEAK</span>
                <button onClick={() => openDrilldown({ type: 'pipeline', title: widget.title || 'Pipeline Overview', data: pipelineData })} className={`text-sm font-medium px-3 py-1.5 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>View details</button>
              </div>
            </div>
            <PremiumDonutChart data={pipelineData} height={300} darkMode={darkMode} />
          </div>
        )
      case WidgetType.RECENT_ACTIVITY:
        return (
          <div className={`group rounded-2xl border p-6 transition-all duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border-gray-700/50 shadow-2xl shadow-black/50 hover:shadow-emerald-900/20 hover:shadow-2xl ring-1 ring-white/5' : 'bg-white/95 border-gray-200/80 shadow-xl shadow-gray-200/50 hover:shadow-emerald-100/30 hover:shadow-2xl ring-1 ring-gray-900/5 backdrop-blur-sm'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{widget.title || 'Recent Activity'}</h3>
              <div className={`text-sm flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><ClockIcon className="w-4 h-4" />Last 24 hours</div>
            </div>
            <div className="space-y-4">
              {[
                { icon: '💰', title: 'New opportunity created', desc: 'Pharma Corp - Enterprise Deal ($250K)', ago: '2 hours ago', color: darkMode ? 'bg-green-500/10 ring-1 ring-green-500/20 shadow-lg shadow-green-500/5' : 'bg-gradient-to-br from-green-50 to-emerald-50/50 ring-1 ring-green-200/50 shadow-md shadow-green-200/30', iconBg: darkMode ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/50' : 'bg-gradient-to-br from-green-500 to-green-600 shadow-md shadow-green-500/30' },
                { icon: '📅', title: 'Meeting scheduled', desc: 'Dr. Smith - Product demonstration', ago: '4 hours ago', color: darkMode ? 'bg-blue-500/10 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/5' : 'bg-gradient-to-br from-blue-50 to-indigo-50/50 ring-1 ring-blue-200/50 shadow-md shadow-blue-200/30', iconBg: darkMode ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50' : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/30' },
                { icon: '📦', title: 'Sample order processed', desc: '250 units shipped to Metro Hospital', ago: '6 hours ago', color: darkMode ? 'bg-purple-500/10 ring-1 ring-purple-500/20 shadow-lg shadow-purple-500/5' : 'bg-gradient-to-br from-purple-50 to-violet-50/50 ring-1 ring-purple-200/50 shadow-md shadow-purple-200/30', iconBg: darkMode ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/50' : 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-md shadow-purple-500/30' },
              ].map((a, idx) => (
                <div key={idx} className={`flex items-start space-x-4 p-4 ${a.color} rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer`}>
                  <div className={`w-12 h-12 ${a.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 ring-2 ring-white/10 transition-transform duration-300 hover:scale-110`}><span className="text-white text-xl">{a.icon}</span></div>
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
          <div className={`group rounded-2xl border p-6 transition-all duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border-gray-700/50 shadow-2xl shadow-black/50 hover:shadow-blue-900/20 hover:shadow-2xl ring-1 ring-white/5' : 'bg-white/95 border-gray-200/80 shadow-xl shadow-gray-200/50 hover:shadow-blue-100/30 hover:shadow-2xl ring-1 ring-gray-900/5 backdrop-blur-sm'}`}>
            <h3 className={`text-lg font-bold mb-6 ${darkMode ? 'text-white drop-shadow-lg' : 'text-gray-900'}`}>{widget.title || 'Quota Tracker'}</h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Current Progress</span>
                <span className={`text-sm font-bold px-3 py-1 rounded-lg ${darkMode ? 'text-blue-400 bg-blue-500/10 ring-1 ring-blue-500/20' : 'text-blue-700 bg-blue-50 ring-1 ring-blue-200/50'}`}>78%</span>
              </div>
              <div className="relative">
                <div className={`w-full rounded-full h-4 overflow-hidden ${darkMode ? 'bg-gray-700/50 ring-1 ring-gray-600/50' : 'bg-gray-200 ring-1 ring-gray-300/50'}`}>
                  <div className={`h-4 rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${darkMode ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 shadow-lg shadow-blue-500/50' : 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 shadow-md shadow-blue-500/30'}`} style={{ width: '78%' }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>
              <div className={`flex justify-between text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <span>$1.95M / $2.5M</span>
                <span>22 days left</span>
              </div>
              <div className="flex justify-end">
                <button onClick={() => openDrilldown({ type: 'quota', title: widget.title || 'Quota Tracker' })} className={`text-sm font-medium px-3 py-1.5 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>See breakdown</button>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className={`rounded-xl shadow-xl border h-32 flex items-center justify-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="text-center">
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{widget.title || 'Widget'}</p>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{`Unsupported widget type: ${widget.type}`}</p>
            </div>
          </div>
        )
    }
  }

  useEffect(() => { void loadDashboardLayout() }, [loadDashboardLayout])

  useEffect(() => {
    const run = async () => {
      if (!isAdminUser || !isViewingAdmin || publishOnce.current) return
      const orgKey = dashboard.organizationId || 'no-org'
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(`adminDefaultPublished:${orgKey}`) : null
      if (stored === 'true') { publishOnce.current = true; return }
      try {
        // Optionally seed admin templates here; noop in this refactor
        publishOnce.current = true
        if (typeof window !== 'undefined') window.localStorage.setItem(`adminDefaultPublished:${orgKey}`, 'true')
      } catch {}
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
    <>
      <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50'}`}>
        <div className={`border-b transition-all duration-500 ${darkMode ? 'bg-gray-900/95 border-gray-700/50 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-white/5' : 'bg-white/95 border-gray-200/80 backdrop-blur-xl shadow-lg shadow-gray-200/50 ring-1 ring-gray-900/5'} sticky top-0 z-50`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white drop-shadow-2xl' : 'text-gray-900'}`}>{viewRole.replace('_', ' ').toUpperCase()} Dashboard</h1>
              {dashboard.organizationId && (
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Organization: {organizationName || dashboard.organizationId}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {isAdminUser && (
                <select aria-label="Select dashboard role" className={`text-sm border rounded px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`} value={viewRole} onChange={(e) => setViewRole(e.target.value as UserRole)}>
                  {Object.values(UserRole).map((role) => (<option key={role} value={role}>{String(role).replace(/_/g, ' ').toUpperCase()}</option>))}
                </select>
              )}
              <DashboardControls darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
              {permissions.canCustomizeDashboard && viewRole === userRole && (
                <button onClick={() => { if (isEditMode) void saveDashboardLayout(widgets); setIsEditMode(!isEditMode) }} className={`group px-5 py-2.5 rounded-xl font-bold transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 hover:from-blue-500 hover:via-blue-600 hover:to-blue-500 text-white shadow-2xl shadow-blue-900/50 hover:shadow-blue-500/50 ring-1 ring-blue-400/20' : 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 hover:from-blue-500 hover:via-blue-600 hover:to-blue-500 text-white shadow-xl shadow-blue-500/50 hover:shadow-blue-600/60 ring-1 ring-blue-400/20'}`}>
                  <span className="flex items-center gap-2">{isEditMode ? '💾 Save Layout' : '✨ Customize'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-min">
            {widgets.map((widget) => (
              <div key={widget.id} className={`${widget.position.w === 12 ? 'col-span-1 md:col-span-2 lg:col-span-12' : widget.position.w === 6 ? 'col-span-1 md:col-span-1 lg:col-span-6' : 'col-span-1 md:col-span-1 lg:col-span-3'} transition-all duration-300 ${isEditMode ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`} style={{ gridRow: `span ${widget.position.h}`, minHeight: `${widget.position.h * 100}px` }}>
                {isEditMode && (
                  <div className={`flex justify-between items-center mb-3 p-3 rounded-xl transition-all duration-300 ${darkMode ? 'bg-gray-700/50 ring-1 ring-gray-600/50 shadow-lg shadow-black/20' : 'bg-gray-100 ring-1 ring-gray-200/50 shadow-md shadow-gray-200/50'}`}>
                    <button className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} hover:text-blue-500 cursor-move transition-colors duration-200 flex items-center gap-2`} title="Drag to reorder">
                      <span className="text-gray-400">⋮⋮</span> {widget.title}
                    </button>
                    <button className={`text-sm font-bold px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105 ${darkMode ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20 ring-1 ring-red-500/20' : 'text-red-600 bg-red-50 hover:bg-red-100 ring-1 ring-red-200/50'}`} onClick={() => setWidgets(widgets.filter(w => w.id !== widget.id))}>✕ Remove</button>
                  </div>
                )}
                <div className="h-full">{renderWidget(widget)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Drilldown Panel Mount */}
      <DrilldownPanel />
    </>
  )
}

export default function EnhancedRoleBasedDashboard(props: EnhancedRoleBasedDashboardProps) {
  return (
    <DashboardProvider
      initialSettings={{ autoRefresh: true, refreshInterval: 15, defaultPeriodDays: 30 }}
      initialContext={{ userId: props.userId, userRole: props.userRole, organizationId: props.organizationId ?? null }}
    >
      <DashboardContent {...props} />
    </DashboardProvider>
  )
}

