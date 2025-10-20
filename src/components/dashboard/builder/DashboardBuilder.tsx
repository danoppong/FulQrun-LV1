'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import WidgetPalette from './WidgetPalette'
import LayoutGrid from './LayoutGrid'
import { BuilderLayout, BuilderWidget } from './types'
import { WidgetType, WIDGET_TEMPLATES } from '@/lib/dashboard-widgets'

const STORAGE_KEY = 'custom_dashboard_layout_v1'

function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export default function DashboardBuilder() {
  const [layoutName, setLayoutName] = useState('My Dashboard')
  const [widgets, setWidgets] = useState<BuilderWidget[]>([])
  const [status, setStatus] = useState<string>('')
  const [publishAsDefault, setPublishAsDefault] = useState<boolean>(false)
  const saveTimerRef = useRef<number | null>(null)
  const isSavingRef = useRef(false)

  // Load from API, fallback to localStorage if API unavailable
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/dashboard/layouts', { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          if (json?.exists && Array.isArray(json.layout)) {
            setLayoutName(json.name || 'My Dashboard')
            setWidgets(json.layout)
            return
          }
        }
      } catch (_e) {
        // ignore and try local
      }
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const saved: BuilderLayout = JSON.parse(raw)
          setLayoutName(saved.name)
          setWidgets(saved.widgets)
        }
      } catch (_e) {
        // no-op
      }
    }
    load()
  }, [])

  const handleAdd = (type: WidgetType) => {
    const t = WIDGET_TEMPLATES[type]
    const w = t?.defaultSize?.w ?? 3
    const h = t?.defaultSize?.h ?? 2
    const id = randomId(type)
    const y = widgets.length ? Math.max(...widgets.map(i => i.y + i.h)) + 1 : 0
    // Pre-seed metadata container for KPI widgets to persist selections (e.g., productId)
    const metadata = type === WidgetType.PHARMA_KPI_CARD ? {} as Record<string, unknown> : undefined
    setWidgets(prev => [...prev, { id, type, title: t?.name ?? type, x: 0, y, w, h, metadata }])
  }

  const handleRemove = (id: string) => setWidgets(prev => prev.filter(w => w.id !== id))

  const performSave = useCallback(async (name: string, ws: BuilderWidget[], silent = false) => {
    if (isSavingRef.current) return
    isSavingRef.current = true
    try {
      const res = await fetch('/api/dashboard/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, layout: ws })
      })
      if (!res.ok) throw new Error('Save failed')
      if (!silent) setStatus('Layout saved')
    } catch (_e) {
      // fallback local
      const payload: BuilderLayout = {
        id: randomId('layout'),
        name,
        widgets: ws,
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      if (!silent) setStatus('Layout saved locally')
    } finally {
      isSavingRef.current = false
      if (!silent) setTimeout(() => setStatus(''), 2000)
    }
  }, [])

  const handleSave = useCallback(async () => {
    await performSave(layoutName, widgets)
  }, [performSave, layoutName, widgets])

  const handleClear = () => {
    setWidgets([])
    setStatus('Layout cleared')
    setTimeout(() => setStatus(''), 2000)
  }

  // Autosave on changes (debounced)
  useEffect(() => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = window.setTimeout(() => {
      void performSave(layoutName, widgets, true)
      setStatus('Autosaved')
      window.setTimeout(() => setStatus(''), 1500)
    }, 1000)
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
    }
  }, [layoutName, widgets, performSave])

  const handlePublish = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: undefined, name: layoutName, layout: widgets, isDefault: publishAsDefault })
      })
      if (!res.ok) throw new Error('Publish failed')
      setStatus(publishAsDefault ? 'Published as default' : 'Published for role')
    } catch (_e) {
      setStatus('Publish failed')
    } finally {
      setTimeout(() => setStatus(''), 2000)
    }
  }, [layoutName, widgets, publishAsDefault])

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white border rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Layout Name</label>
          <input value={layoutName} onChange={(e) => setLayoutName(e.target.value)} className="px-3 py-2 border rounded-md text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 mr-2">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={publishAsDefault}
              onChange={(e) => setPublishAsDefault(e.target.checked)}
            />
            Publish as default for my role
          </label>
          <button onClick={handleSave} className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">Save</button>
          <button onClick={handlePublish} className="px-3 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700">Publish</button>
          <button onClick={handleClear} className="px-3 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">Clear</button>
          {status && <span className="ml-2 text-sm text-green-600">{status}</span>}
        </div>
      </div>

      <WidgetPalette onAdd={handleAdd} />

      <LayoutGrid widgets={widgets} onChange={setWidgets} onRemove={handleRemove} />
    </div>
  )
}
