'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BuilderWidget } from './types'

interface LayoutGridProps {
  widgets: BuilderWidget[]
  onChange: (widgets: BuilderWidget[]) => void
  onRemove: (id: string) => void
}

const COLS = 12
const CELL_H = 80 // px per row

export default function LayoutGrid({ widgets, onChange, onRemove }: LayoutGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dragState, setDragState] = useState<{
    id: string
    startX: number
    startY: number
    origX: number
    origY: number
  } | null>(null)
  const [resizeState, setResizeState] = useState<{
    id: string
    startX: number
    startY: number
    origW: number
    origH: number
  } | null>(null)

  const getColWidthPx = useCallback((): number => {
    const el = containerRef.current
    if (!el) return 1
    const rect = el.getBoundingClientRect()
    return rect.width / COLS
  }, [])

  const updateWidget = useCallback((id: string, patch: Partial<BuilderWidget>) => {
    onChange(widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)))
  }, [onChange, widgets])

  const setWidgets = useCallback((next: BuilderWidget[] | ((prev: BuilderWidget[]) => BuilderWidget[])) => {
    const nextArray = typeof next === 'function' ? (next as (prev: BuilderWidget[]) => BuilderWidget[])(widgets) : next
    onChange(nextArray)
  }, [onChange, widgets])

  const clamp = useCallback((val: number, min: number, max: number) => Math.max(min, Math.min(max, val)), [])

  const collides = useCallback((a: BuilderWidget, b: BuilderWidget): boolean => {
    if (a.id === b.id) return false
    const ax2 = a.x + a.w
    const ay2 = a.y + a.h
    const bx2 = b.x + b.w
    const by2 = b.y + b.h
    return !(ax2 <= b.x || bx2 <= a.x || ay2 <= b.y || by2 <= a.y)
  }, [])

  const resolveCollisions = useCallback((draft: BuilderWidget[], movingId: string): BuilderWidget[] => {
    // Try small lateral shifts, then push down until no collisions.
    const moving = draft.find((w) => w.id === movingId)
    if (!moving) return draft
    const tryPositions: Array<{ x: number; y: number }> = []
    // neighborhood scan around intended x
    for (let dx = 0; dx <= 2; dx++) {
      const left = clamp(moving.x - dx, 0, COLS - moving.w)
      const right = clamp(moving.x + dx, 0, COLS - moving.w)
      tryPositions.push({ x: left, y: moving.y })
      tryPositions.push({ x: right, y: moving.y })
    }
    for (const pos of tryPositions) {
      const test = { ...moving, ...pos }
      const hit = draft.some((w) => w.id !== movingId && collides(test, w))
      if (!hit) {
        moving.x = pos.x
        moving.y = pos.y
        return [...draft]
      }
    }
    // Fallback push-down
    for (let i = 0; i < 200; i++) {
      const hit = draft.some((w) => w.id !== movingId && collides(moving, w))
      if (!hit) break
      moving.y += 1
    }
    return [...draft]
  }, [collides, clamp])

  // Simple pack: move widgets up within their column span to close gaps
  const packLayout = useCallback((draft: BuilderWidget[]): BuilderWidget[] => {
    const sorted = [...draft].sort((a, b) => (a.x - b.x) || (a.y - b.y))
    for (const w of sorted) {
      let targetY = 0
      const blockers = sorted.filter((o) => o.id !== w.id && !(o.x + o.w <= w.x || w.x + w.w <= o.x))
      // Move up until collision
      while (targetY < w.y) {
        const test = { ...w, y: targetY }
        const hit = blockers.some((b) => collides(test, b))
        if (hit) {
          targetY += 1
        } else {
          w.y = targetY
          break
        }
      }
    }
    return [...sorted]
  }, [collides])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const colW = getColWidthPx()
    if (dragState) {
      const moving = widgets.find((w) => w.id === dragState.id)
      if (!moving) return
      const dxCols = Math.round((e.clientX - dragState.startX) / colW)
      const dyRows = Math.round((e.clientY - dragState.startY) / CELL_H)
      const nx = clamp(dragState.origX + dxCols, 0, COLS - moving.w)
      const ny = Math.max(0, dragState.origY + dyRows)
      setWidgets((prev) => {
        const next = prev.map((w) => (w.id === dragState.id ? { ...w, x: nx, y: ny } : w))
        return resolveCollisions(next, dragState.id)
      })
    } else if (resizeState) {
      const resizing = widgets.find((w) => w.id === resizeState.id)
      if (!resizing) return
      const dxCols = Math.round((e.clientX - resizeState.startX) / colW)
      const dyRows = Math.round((e.clientY - resizeState.startY) / CELL_H)
      const nw = clamp(resizeState.origW + dxCols, 1, COLS - resizing.x)
      const nh = clamp(resizeState.origH + dyRows, 1, 24)
      updateWidget(resizeState.id, { w: nw, h: nh })
    }
  }, [clamp, dragState, getColWidthPx, resolveCollisions, resizeState, setWidgets, updateWidget, widgets])

  const handleMouseUp = useCallback(() => {
    if (dragState || resizeState) {
      // After an interaction, run a quick pack to reduce gaps
      setWidgets((prev) => packLayout(prev))
      setDragState(null)
      setResizeState(null)
    }
  }, [dragState, resizeState, packLayout, setWidgets])

  useEffect(() => {
    if (!dragState && !resizeState) return
    const move = (e: MouseEvent) => handleMouseMove(e)
    const up = () => handleMouseUp()
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [dragState, resizeState, handleMouseMove, handleMouseUp])

  const handleResetLayout = useCallback(() => {
    // Simple row-by-row packing reset using current widgets order
    let cursorX = 0
    let cursorY = 0
    let rowMaxH = 1
    const next = widgets.map((w) => {
      if (cursorX + w.w > COLS) {
        // new row
        cursorX = 0
        cursorY += rowMaxH
        rowMaxH = 1
      }
      const placed: BuilderWidget = { ...w, x: cursorX, y: cursorY }
      cursorX += w.w
      rowMaxH = Math.max(rowMaxH, w.h)
      return placed
    })
    onChange(next)
  }, [onChange, widgets])

  const totalHeight = useMemo(() => Math.max(4, ...widgets.map((w) => w.y + w.h)) * CELL_H, [widgets])

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Layout</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-xs px-2 py-1 rounded bg-white border hover:bg-gray-50"
            onClick={handleResetLayout}
            aria-label="Reset layout"
          >
            Reset layout
          </button>
          <span className="text-xs text-gray-500">12-column grid</span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative border rounded-md bg-gray-50"
        style={{ height: totalHeight }}
      >
        {widgets.map((w) => (
          <div
            key={w.id}
            className="absolute rounded-md shadow-sm bg-white border hover:shadow-md transition overflow-hidden"
            style={{
              left: `${(w.x / COLS) * 100}%`,
              width: `${(w.w / COLS) * 100}%`,
              top: w.y * CELL_H,
              height: w.h * CELL_H,
            }}
          >
            <div
              className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b cursor-move select-none"
              onMouseDown={(e) => {
                e.preventDefault()
                setDragState({ id: w.id, startX: e.clientX, startY: e.clientY, origX: w.x, origY: w.y })
              }}
            >
              <div className="truncate text-sm font-medium text-gray-800">{w.title}</div>
              <div className="flex items-center gap-1">
                <button className="text-xs px-2 py-1 rounded bg-white border" onClick={() => onRemove(w.id)} aria-label="Remove">Remove</button>
              </div>
            </div>
            <div className="p-3 text-xs text-gray-600">
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-between">X
                  <input className="ml-2 w-16 border rounded px-2 py-1" type="number" min={0} max={COLS - 1} value={w.x} onChange={(e) => updateWidget(w.id, { x: Math.max(0, Math.min(COLS - 1, Number(e.target.value))) })} />
                </label>
                <label className="flex items-center justify-between">Y
                  <input className="ml-2 w-16 border rounded px-2 py-1" type="number" min={0} value={w.y} onChange={(e) => updateWidget(w.id, { y: Math.max(0, Number(e.target.value)) })} />
                </label>
                <label className="flex items-center justify-between">W
                  <input className="ml-2 w-16 border rounded px-2 py-1" type="number" min={1} max={COLS} value={w.w} onChange={(e) => updateWidget(w.id, { w: Math.max(1, Math.min(COLS, Number(e.target.value))) })} />
                </label>
                <label className="flex items-center justify-between">H
                  <input className="ml-2 w-16 border rounded px-2 py-1" type="number" min={1} max={12} value={w.h} onChange={(e) => updateWidget(w.id, { h: Math.max(1, Math.min(12, Number(e.target.value))) })} />
                </label>
              </div>
              {/* Minimal metadata editor for KPI widgets (lets user preselect productId) */}
              {w.type === 'pharma_kpi_card' && (
                <div className="mt-3 border-t pt-2">
                  <div className="mb-1 font-medium text-gray-700">KPI Settings</div>
                  <label className="flex items-center justify-between">productId
                    <input
                      className="ml-2 w-40 border rounded px-2 py-1"
                      placeholder="e.g., PROD-123"
                      value={String((w.metadata as Record<string, unknown> | undefined)?.productId ?? '')}
                      onChange={(e) => updateWidget(w.id, { metadata: { ...(w.metadata || {}), productId: e.target.value } })}
                    />
                  </label>
                    <label className="mt-2 flex items-center justify-between">territoryId
                      <input
                        className="ml-2 w-40 border rounded px-2 py-1"
                        type="text"
                        value={String((w.metadata as Record<string, unknown> | undefined)?.territoryId ?? '')}
                        onChange={(e) => updateWidget(w.id, { metadata: { ...(w.metadata || {}), territoryId: e.target.value } })}
                      />
                    </label>
                </div>
              )}
              <p className="mt-2 text-gray-500">This is a preview placeholder. In the final builder, actual widget previews will render here.</p>
            </div>
            <div
              className="absolute right-1 bottom-1 w-3 h-3 bg-gray-300 rounded cursor-se-resize"
              onMouseDown={(e) => {
                e.preventDefault()
                setResizeState({ id: w.id, startX: e.clientX, startY: e.clientY, origW: w.w, origH: w.h })
              }}
              aria-label="Resize"
              role="button"
              tabIndex={0}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
