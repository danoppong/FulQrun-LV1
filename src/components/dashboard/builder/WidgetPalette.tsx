'use client'

import React from 'react'
import { WidgetType, WIDGET_TEMPLATES } from '@/lib/dashboard-widgets'

interface WidgetPaletteProps {
  onAdd: (type: WidgetType) => void
}

const order: WidgetType[] = [
  WidgetType.KPI_CARD,
  WidgetType.SALES_CHART,
  WidgetType.PIPELINE_OVERVIEW,
  WidgetType.TEAM_PERFORMANCE,
  WidgetType.PHARMA_KPI_CARD,
  WidgetType.TERRITORY_PERFORMANCE,
  WidgetType.PRODUCT_PERFORMANCE,
  WidgetType.HCP_ENGAGEMENT,
  WidgetType.SAMPLE_DISTRIBUTION,
  WidgetType.FORMULARY_ACCESS,
  WidgetType.RECENT_ACTIVITY,
  WidgetType.MEDDPICC_SCORING,
  WidgetType.QUOTA_TRACKER,
]

export default function WidgetPalette({ onAdd }: WidgetPaletteProps) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Widget Library</h3>
        <span className="text-xs text-gray-500">Drag or click to add</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {order.map((type) => {
          const t = WIDGET_TEMPLATES[type]
          if (!t) return null
          return (
            <button
              key={type}
              onClick={() => onAdd(type)}
              className="group text-left border rounded-lg p-3 hover:border-blue-500 hover:shadow-sm transition flex items-start space-x-2"
            >
              <span className="text-lg" aria-hidden>{t.icon ?? '🧩'}</span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-700">{t.name}</div>
                <div className="text-xs text-gray-500 line-clamp-2">{t.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
