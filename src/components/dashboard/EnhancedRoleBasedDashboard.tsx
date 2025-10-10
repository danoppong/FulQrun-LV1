'use client'

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { UserRole, getUserPermissions } from '@/lib/roles'
import { DashboardWidget, WidgetType, DEFAULT_WIDGETS } from '@/lib/dashboard-widgets'
import { KPICard } from '@/components/bi/KPICard'
import { KPICardData, PharmaKPICardData } from '@/lib/types/dashboard'
import { supabase } from '@/lib/supabase'
import { useDashboard, DashboardProvider } from '@/components/dashboard/DashboardContext'

interface EnhancedRoleBasedDashboardProps {
  userRole: UserRole
  userId: string
  organizationNameSSR?: string | null
}

function DashboardControls() {
  const dashboard = useDashboard()
  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={dashboard.autoRefresh}
          onChange={(e) => dashboard.updateSettings({ autoRefresh: e.target.checked })}
        />
        Auto refresh
      </label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">Interval</span>
        <select
          value={dashboard.refreshInterval}
          onChange={(e) => dashboard.updateSettings({ refreshInterval: Number(e.target.value) })}
          className="text-sm border border-gray-300 rounded px-2 py-1"
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
  // Actual user's role
  const [userRole] = useState<UserRole>(initialUserRole)
  // View role selector (admin/super_admin can change this)
  const [viewRole, setViewRole] = useState<UserRole>(initialUserRole)
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => DEFAULT_WIDGETS)
  const [isEditMode, setIsEditMode] = useState(false)
  const [organizationName, setOrganizationName] = useState<string | null>(organizationNameSSR ?? null)
  const permissions = useMemo(() => getUserPermissions(userRole), [userRole])
  const publishOnce = useRef(false)

  const isAdminUser = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN
  const isViewingAdmin = viewRole === UserRole.ADMIN || viewRole === UserRole.SUPER_ADMIN

  const loadDashboardLayout = useCallback(async () => {
    // Fetch admin overlay shape only when viewing a non-admin role
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
      } catch {}
    }

    const roleBaseWidgets: DashboardWidget[] = DEFAULT_WIDGETS

    // Personal layout for the current user (note: not role-scoped). We still overlay admin geometry if viewing a non-admin role.
    try {
      const res = await fetch('/api/dashboard/layouts', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        if (json?.exists && Array.isArray(json.layout)) {
          type BuilderItem = { id: string; type: WidgetType; title: string; x: number; y: number; w: number; h: number; metadata?: Record<string, unknown> }
          let mapped: DashboardWidget[] = (json.layout as BuilderItem[]).map((w) => {
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
                metadata: { ...existingMeta, ...w.metadata },
              } as PharmaKPICardData
            }
            return {
              id: w.id,
              type: existing?.type || w.type,
              title: existing?.title || w.title,
              position: { x: w.x, y: w.y, w: w.w, h: w.h },
              data: nextData,
            }
          })
          if (adminLayout) {
            mapped = mapped.map((bw, idx) => {
              const src = adminLayout![idx]
              return src ? { ...bw, position: { x: src.x, y: src.y, w: src.w, h: src.h } } : bw
            })
          }
          setWidgets(mapped)
          return
        }
      }
    } catch {}

    // Role default template (based on viewRole)
    try {
      const roleParam = String(viewRole || '').toLowerCase()
      const tRes = await fetch(`/api/dashboard/templates${roleParam ? `?role=${encodeURIComponent(roleParam)}` : ''}`, { cache: 'no-store' })
      if (tRes.ok) {
        const tJson = await tRes.json()
        const tpl = Array.isArray(tJson?.data) ? tJson.data[0] : undefined
        const layout = tpl?.layout_json as Array<{ id: string; type: WidgetType; title: string; x: number; y: number; w: number; h: number; metadata?: Record<string, unknown> }>
        if (Array.isArray(layout)) {
          let mapped: DashboardWidget[] = layout.map((w) => {
            const existing = roleBaseWidgets.find((ex) => ex.id === w.id)
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
                metadata: { ...existingMeta, ...(w.metadata || {}) },
              } as PharmaKPICardData
            }
            return {
              id: w.id,
              type: existing?.type || w.type,
              title: existing?.title || w.title,
              position: { x: w.x, y: w.y, w: w.w, h: w.h },
              data: nextData,
            }
          })
          if (adminLayout) {
            mapped = mapped.map((bw, idx) => {
              const src = adminLayout![idx]
              return src ? { ...bw, position: { x: src.x, y: src.y, w: src.w, h: src.h } } : bw
            })
          }
          setWidgets(mapped)
          return
        }
      }
    } catch {}

    // Overlay admin shape onto base widgets
    if (adminLayout && roleBaseWidgets.length) {
      const remapped = roleBaseWidgets.map((bw, idx) => {
        const src = adminLayout![idx]
        return src ? { ...bw, position: { x: src.x, y: src.y, w: src.w, h: src.h } } : bw
      })
      setWidgets(remapped)
      return
    }

    setWidgets(roleBaseWidgets.length ? roleBaseWidgets : DEFAULT_WIDGETS)
  }, [viewRole, isViewingAdmin])

  const saveDashboardLayout = useCallback(async (newWidgets: DashboardWidget[]) => {
    try {
      const payload = {
        name: 'My Dashboard',
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
      await fetch('/api/dashboard/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch {}
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

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case WidgetType.KPI_CARD: {
        const kpiData = widget.data as KPICardData | undefined
        return (
          <div className="bg-white p-6 rounded-lg shadow border">
            <KPICard
              title={widget.title}
              value={typeof kpiData?.value === 'number' ? kpiData.value : parseInt(String(kpiData?.value || 0))}
              trend={kpiData?.trend === 'up' || kpiData?.trend === 'down' ? kpiData.trend : 'stable'}
              color="blue"
              confidence={85}
              format={widget.title.includes('$') || widget.title.includes('Value') ? 'currency' : 'number'}
              clickable={false}
            />
          </div>
        )
      }
      case WidgetType.SALES_CHART: {
        return (
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title || 'Sales Performance'}</h3>
              <span className="text-sm text-green-700 bg-green-50 border border-green-100 rounded px-2 py-1">+8.5% MoM</span>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">$2.4M</div>
                <div className="text-sm text-gray-500">Total Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">156</div>
                <div className="text-sm text-gray-500">Deals Closed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">$15.4K</div>
                <div className="text-sm text-gray-500">Avg Deal Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">23 days</div>
                <div className="text-sm text-gray-500">Avg Cycle</div>
              </div>
            </div>
            <div className="h-24 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg flex items-end justify-between px-4 py-2">
              {[60, 75, 45, 85, 70, 90, 66, 72, 58, 87, 93, 80].map((h, i) => (
                <div key={i} className={`w-3 rounded-t ${i > 9 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        )
      }
      case WidgetType.TEAM_PERFORMANCE: {
        return (
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title || 'Team Performance'}</h3>
              <span className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-1">12 Members</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">85%</div>
                <div className="text-sm text-gray-500">Avg Performance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">9/12</div>
                <div className="text-sm text-gray-500">Above Target</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">$1.8M</div>
                <div className="text-sm text-gray-500">Team Revenue</div>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Sarah Johnson', pct: 95, color: 'bg-green-500', text: 'text-green-600' },
                { name: 'John Smith', pct: 87, color: 'bg-blue-500', text: 'text-blue-600' },
                { name: 'Mike Davis', pct: 78, color: 'bg-orange-500', text: 'text-orange-600' },
              ].map((m) => (
                <div key={m.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{m.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className={`${m.color} h-2 rounded-full`} style={{ width: `${m.pct}%` }} />
                    </div>
                    <span className={`text-sm font-medium ${m.text}`}>{m.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }
      case WidgetType.PIPELINE_OVERVIEW: {
        return (
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title || 'Pipeline Overview'}</h3>
              <span className="text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-2 py-1">PEAK</span>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <div className="text-2xl font-bold text-blue-600">$1.96M</div>
                <div className="text-sm text-gray-500">Total Pipeline</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">23.4%</div>
                <div className="text-sm text-gray-500">Conversion Rate</div>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Prospecting', count: 12, value: '$420K', pct: '21%', bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-900' },
                { label: 'Engaging', count: 8, value: '$540K', pct: '28%', bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-900' },
                { label: 'Advancing', count: 5, value: '$680K', pct: '35%', bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-900' },
                { label: 'Key Decision', count: 3, value: '$320K', pct: '16%', bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-900' },
              ].map((s) => (
                <div key={s.label} className={`flex items-center justify-between p-3 ${s.bg} rounded-lg border-l-4 ${s.border}`}>
                  <div>
                    <div className={`font-medium ${s.text}`}>{s.label}</div>
                    <div className={`text-sm ${s.text.replace('900','600')}`}>{s.count} opportunities</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${s.text.replace('900','700')}`}>{s.value}</div>
                    <div className={`text-xs ${s.text.replace('900','500')}`}>{s.pct} of pipeline</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }
      case WidgetType.RECENT_ACTIVITY: {
        return (
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title || 'Recent Activity'}</h3>
              <div className="text-sm text-gray-500">Last 24 hours</div>
            </div>
            <div className="space-y-4">
              {[
                { badge: '$', title: 'New opportunity created', desc: 'Pharma Corp - Enterprise Deal ($250K)', ago: '2 hours ago', color: 'bg-green-500', wrap: 'bg-green-50' },
                { badge: '📅', title: 'Meeting scheduled', desc: 'Dr. Smith - Product demonstration', ago: '4 hours ago', color: 'bg-blue-500', wrap: 'bg-blue-50' },
                { badge: '📦', title: 'Sample order processed', desc: '250 units shipped to Metro Hospital', ago: '6 hours ago', color: 'bg-purple-500', wrap: 'bg-purple-50' },
              ].map((a) => (
                <div key={a.title} className={`flex items-start space-x-3 p-3 ${a.wrap} rounded-lg`}>
                  <div className={`w-8 h-8 ${a.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-bold">{a.badge}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{a.title}</div>
                    <div className="text-sm text-gray-600">{a.desc}</div>
                    <div className="text-xs text-gray-400">{a.ago}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }
      case WidgetType.QUOTA_TRACKER: {
        return (
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{widget.title || 'Quota Tracker'}</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current Progress</span>
                <span className="text-sm font-medium">78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>$1.95M / $2.5M</span>
                <span>22 days left</span>
              </div>
            </div>
          </div>
        )
      }
      case WidgetType.PHARMA_KPI_CARD: {
        const kpi = (widget.data as PharmaKPICardData) || { kpiId: 'trx', kpiName: widget.title, value: 0, confidence: 0.9, trend: 'stable', format: 'number', metadata: {} }
        return (
          <div className="bg-white p-6 rounded-lg shadow border">
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
          <div className="bg-white p-6 rounded-lg shadow border h-32 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600">{widget.title || 'Widget'}</p>
              <p className="text-sm text-gray-400">{`Unsupported widget type: ${widget.type}`}</p>
            </div>
          </div>
        )
    }
  }

  useEffect(() => { void loadDashboardLayout() }, [loadDashboardLayout])

  // Admin-only: ensure Admin layout is published as default once per session/org
  useEffect(() => {
    const run = async () => {
      if (!isAdminUser) return
      if (!isViewingAdmin) return // only publish while viewing Admin
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{viewRole.replace('_', ' ').toUpperCase()} Dashboard</h1>
            {dashboard.organizationId && (
              <p className="text-sm text-gray-500">Organization: {organizationName || dashboard.organizationId}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Admin-only role selector to preview any role's dashboard */}
            {isAdminUser && (
              <select
                aria-label="Select dashboard role"
                className="text-sm border border-gray-300 rounded px-2 py-1"
                value={viewRole}
                onChange={(e) => setViewRole(e.target.value as UserRole)}
              >
                {Object.values(UserRole).map((role) => (
                  <option key={role} value={role}>{String(role).replace(/_/g, ' ').toUpperCase()}</option>
                ))}
              </select>
            )}
            <DashboardControls />
            {permissions.canCustomizeDashboard && viewRole === userRole && (
              <button
                onClick={() => { if (isEditMode) void saveDashboardLayout(widgets); setIsEditMode(!isEditMode) }}
                className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                {isEditMode ? 'Save Layout' : 'Customize'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 auto-rows-min">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className={`${widget.position.w === 12 ? 'col-span-1 lg:col-span-12' : `col-span-1 lg:col-span-${widget.position.w}`} bg-white rounded-xl shadow border p-4`}
              style={{ gridRow: `span ${widget.position.h}`, minHeight: `${widget.position.h * 100}px` }}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{widget.title}</h3>
                {isEditMode && (
                  <button className="text-red-600 text-sm">Remove</button>
                )}
              </div>
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