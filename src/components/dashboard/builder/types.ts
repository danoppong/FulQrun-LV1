import { WidgetType } from '@/lib/dashboard-widgets'

export interface BuilderWidget {
  id: string
  type: WidgetType
  title: string
  // grid position (12-column grid)
  x: number
  y: number
  w: number
  h: number
  // Optional widget-level metadata (e.g., selected productId for Market Share)
  metadata?: Record<string, unknown>
}

export interface BuilderLayout {
  id: string
  name: string
  widgets: BuilderWidget[]
  updatedAt: string
}
