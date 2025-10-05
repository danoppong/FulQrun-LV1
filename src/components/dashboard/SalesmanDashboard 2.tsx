'use client'
import React, { useState, useEffect, memo, useCallback } from 'react'
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking'
import { supabase } from '@/lib/supabase'
import { 
  SalesmanKPIs, 
  SAMPLE_SALESMAN_DATA, 
  PerformanceWidget, 
  DEFAULT_SALESMAN_WIDGETS, 
  SALESMAN_WIDGET_TEMPLATES, 
  getWidgetData 
} from '@/lib/salesman-performance-data'

interface SalesmanDashboardProps {
  userId: string
  userName: string
}

const SalesmanDashboard = memo(function SalesmanDashboard({ userId, userName }: SalesmanDashboardProps) {
  const [salesmanData, _setSalesmanData] = useState<SalesmanKPIs>(SAMPLE_SALESMAN_DATA)
  const [widgets, setWidgets] = useState<PerformanceWidget[]>(DEFAULT_SALESMAN_WIDGETS)
  const [isEditMode, setIsEditMode] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly')

  // Performance tracking
  const { recordCustomMetric: _recordCustomMetric } = usePerformanceTracking({
    componentName: 'SalesmanDashboard',
    trackRenders: true,
    trackProps: true,
    props: { userId, userName }
  })
  const [storageMethod, setStorageMethod] = useState<'database' | 'localStorage' | 'unknown'>('unknown')
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncAttempt, setLastSyncAttempt] = useState<Date | null>(null)
  // Using singleton supabase client

  const loadDashboardLayout = useCallback(async () => {
    try {
      // Try to load from database first
      const { data, error } = await supabase
        .from('user_dashboard_layouts')
        .select('widgets')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" - ignore it, try localStorage
        // Also ignore 406 errors which indicate RLS issues
        if (error.code !== '42501' && !error.message.includes('406')) {
          console.warn('Dashboard layout loading error:', error)
        }
      }

      if (data?.widgets) {
        setWidgets(data.widgets)
        setStorageMethod('database')
        return
      }

      // No data in database, try localStorage
      const savedLayout = localStorage.getItem(`dashboard-layout-${userId}`)
      if (savedLayout) {
        try {
          const parsedLayout = JSON.parse(savedLayout)
          setWidgets(parsedLayout)
          setStorageMethod('localStorage')
        } catch (_parseError) {
          // Handle localStorage parse error silently
        }
      } else {
        // Use default widgets
        setWidgets(DEFAULT_SALESMAN_WIDGETS)
        setStorageMethod('localStorage')
      }
    } catch (_error) {
      // Database unavailable, using localStorage fallback
      
      // Fallback to localStorage on database error
      const savedLayout = localStorage.getItem(`dashboard-layout-${userId}`)
      if (savedLayout) {
        try {
          const parsedLayout = JSON.parse(savedLayout)
          setWidgets(parsedLayout)
          setStorageMethod('localStorage')
        } catch (_parseError) {
          // Handle localStorage parse error silently
        }
      } else {
        // Use default widgets
        setWidgets(DEFAULT_SALESMAN_WIDGETS)
        setStorageMethod('localStorage')
      }
    }
  }, [userId, supabase])

  const saveDashboardLayout = useCallback(async () => {
    try {
      // Try to save to database first
      const { error: dbError } = await supabase
        .from('user_dashboard_layouts')
        .upsert({
          user_id: userId,
          widgets: widgets
        })

      if (dbError) {
        // Ignore RLS errors (42501) and 406 errors
        if (dbError.code !== '42501' && !dbError.message.includes('406')) {
          console.warn('Dashboard layout saving error:', dbError)
        }
        throw dbError
      }

      setStorageMethod('database')
      return true
    } catch (_error) {
      // Database unavailable, using localStorage
      
      // Fallback to localStorage
      try {
        localStorage.setItem(`dashboard-layout-${userId}`, JSON.stringify(widgets))
        setStorageMethod('localStorage')
        return true
      } catch (_localStorageError) {
        // Error saving to localStorage
        return false
      }
    }
  }, [userId, widgets, supabase])

  const attemptSyncToDatabase = useCallback(async () => {
    if (isSyncing) return // Prevent concurrent sync attempts
    
    setIsSyncing(true)
    setLastSyncAttempt(new Date())
    
    try {
      // Check if we have localStorage data to sync
      const savedLayout = localStorage.getItem(`dashboard-layout-${userId}`)
      if (!savedLayout) {
        setIsSyncing(false)
        return
      }

      const parsedLayout = JSON.parse(savedLayout)
      
      // Try to save to database
      const { error: dbError } = await supabase
        .from('user_dashboard_layouts')
        .upsert({
          user_id: userId,
          widgets: parsedLayout
        })

      if (dbError) {
        // Sync attempt failed, database still unavailable
        console.warn('Dashboard layout sync error:', dbError)
        setIsSyncing(false)
        return
      }

      // Success! Update storage method and optionally clear localStorage
      setStorageMethod('database')
      
      // Optional: Remove from localStorage since it's now in database
      // localStorage.removeItem(`dashboard-layout-${userId}`)
      
      setIsSyncing(false)
    } catch (_error) {
      // Sync attempt failed
      setIsSyncing(false)
    }
  }, [isSyncing, userId, supabase])

  useEffect(() => {
    loadDashboardLayout()
  }, [loadDashboardLayout]) // Include loadDashboardLayout in dependencies

  // Auto-save when widgets change (but not on initial load)
  useEffect(() => {
    if (widgets.length > 0 && isEditMode) {
      const timeoutId = setTimeout(() => {
        saveDashboardLayout()
      }, 2000) // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId)
    }
  }, [widgets, isEditMode, saveDashboardLayout]) // Add saveDashboardLayout to dependencies

  // Auto-sync from localStorage to database when database becomes available
  useEffect(() => {
    if (storageMethod === 'localStorage' && !isSyncing) {
      const syncInterval = setInterval(async () => {
        await attemptSyncToDatabase()
      }, 30000) // Try to sync every 30 seconds

      // Also try to sync immediately if it's been a while since last attempt
      const timeSinceLastAttempt = lastSyncAttempt ? Date.now() - lastSyncAttempt.getTime() : Infinity
      if (timeSinceLastAttempt > 60000) { // If more than 1 minute since last attempt
        attemptSyncToDatabase()
      }

      return () => clearInterval(syncInterval)
    }
  }, [storageMethod, isSyncing, attemptSyncToDatabase, lastSyncAttempt])

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault()
    
    if (!draggedWidget || draggedWidget === targetWidgetId) return

    const draggedWidgetData = widgets.find(w => w.id === draggedWidget)
    const targetWidgetData = widgets.find(w => w.id === targetWidgetId)

    if (!draggedWidgetData || !targetWidgetData) return

    const newWidgets = widgets.map(widget => {
      if (widget.id === draggedWidget) {
        return { ...widget, position: targetWidgetData.position }
      }
      if (widget.id === targetWidgetId) {
        return { ...widget, position: draggedWidgetData.position }
      }
      return widget
    })

    setWidgets(newWidgets)
    setDraggedWidget(null)
  }

  const addWidget = (templateId: string) => {
    const template = SALESMAN_WIDGET_TEMPLATES[templateId]
    if (!template) return

    // Generate unique ID to avoid conflicts
    const uniqueId = `widget-${templateId}-${Date.now()}`
    
    const newWidget: PerformanceWidget = {
      ...template,
      id: uniqueId,
      position: { x: 0, y: 0, w: 3, h: 2 },
      data: {}
    }

    setWidgets([...widgets, newWidget])
  }

  const removeWidget = (widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600'
    if (percentage >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '📈'
      case 'down': return '📉'
      case 'stable': return '➡️'
    }
  }

  const renderWidget = (widget: PerformanceWidget) => {
    const data = getWidgetData(widget, salesmanData)

    switch (widget.type) {
      case 'quota':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.achieved as number)}
              </span>
              <span className="text-sm text-gray-500">
                of {formatCurrency(data.quota as number)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getPerformanceBarColor(data.percentage as number)}`}
                style={{ width: `${Math.min(data.percentage as number, 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${getPerformanceColor(data.percentage as number)}`}>
                {(data.percentage as number).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">
                {getTrendIcon(data.trend as "up" | "down" | "stable")}
              </span>
            </div>
          </div>
        )

      case 'deals':
        return (
          <div className="space-y-2">
            <div className="text-3xl font-bold text-indigo-600">
              {data.closed as number}
            </div>
            <div className="text-sm text-gray-600">
              Deals Closed
            </div>
            <div className="text-xs text-gray-500">
              {data.inPipeline as number} in pipeline
            </div>
          </div>
        )

      case 'pipeline':
        return (
          <div className="space-y-3">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(data.value as number)}
            </div>
            <div className="text-sm text-gray-600">
              Pipeline Value
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-gray-500">Deals</div>
                <div className="font-medium">{data.deals as number}</div>
              </div>
              <div>
                <div className="text-gray-500">Avg Size</div>
                <div className="font-medium">{formatCurrency(data.averageSize as number)}</div>
              </div>
            </div>
          </div>
        )

      case 'conversion':
        return (
          <div className="space-y-2">
            <div className="text-3xl font-bold text-green-600">
              {data.rate as number}%
            </div>
            <div className="text-sm text-gray-600">
              Conversion Rate
            </div>
            <div className="text-xs text-gray-500">
              {data.calls as number} calls, {data.meetings as number} meetings
            </div>
          </div>
        )

      case 'activity':
        if (widget.id.includes('calls')) {
          return (
            <div className="space-y-2">
              <div className="text-3xl font-bold text-purple-600">
                {data.calls as number}
              </div>
              <div className="text-sm text-gray-600">
                Calls Made
              </div>
            </div>
          )
        }
        if (widget.id.includes('meetings')) {
          return (
            <div className="space-y-2">
              <div className="text-3xl font-bold text-orange-600">
                {data.meetings as number}
              </div>
              <div className="text-sm text-gray-600">
                Meetings Scheduled
              </div>
            </div>
          )
        }
        if (widget.id.includes('leads')) {
          return (
            <div className="space-y-2">
              <div className="text-3xl font-bold text-teal-600">
                {data.leads as number}
              </div>
              <div className="text-sm text-gray-600">
                Leads Generated
              </div>
            </div>
          )
        }
        return null

      case 'satisfaction':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="text-3xl font-bold text-yellow-600">
                {data.score as number}
              </div>
              <div className="text-sm text-gray-500">
                / 5.0
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Customer Satisfaction
            </div>
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-lg ${
                    i < (data.rating as number) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        )

      case 'trend':
        return (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-600 mb-2">Performance Trend</div>
            <div className="space-y-2">
              {Object.entries(data).map(([period, metrics]) => {
                const metricData = metrics as { percentage: number; trend: 'up' | 'down' | 'stable' }
                return (
                  <div key={period} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 capitalize">{period}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-medium ${getPerformanceColor(metricData.percentage)}`}>
                        {metricData.percentage.toFixed(1)}%
                      </span>
                      <span className="text-xs">{getTrendIcon(metricData.trend)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 'products':
        return (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-600">Top Product</div>
            <div className="text-lg font-bold text-gray-900">
              {data.topProduct as string}
            </div>
            <div className="text-xs text-gray-500">
              {data.region as string} Region
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sales Dashboard - {userName}
              </h1>
              <p className="text-gray-600">
                Performance Overview & KPIs
                {storageMethod !== 'unknown' && (
                  <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                    storageMethod === 'database' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {storageMethod === 'database' ? '💾 Database' : '💿 Local Storage'}
                  </span>
                )}
                {isSyncing && (
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 animate-pulse">
                    🔄 Syncing...
                  </span>
                )}
              </p>
            </div>
            <div className="flex space-x-4">
              {/* Time Period Selector */}
              <div className="flex space-x-2">
                {(['weekly', 'monthly', 'quarterly', 'yearly'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedTimePeriod(period)}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      selectedTimePeriod === period
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
              
              {/* Edit Mode Toggle */}
              <button
                onClick={() => {
                  if (isEditMode) {
                    saveDashboardLayout()
                  }
                  setIsEditMode(!isEditMode)
                }}
                className={`px-4 py-2 rounded-md ${
                  isEditMode ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {isEditMode ? 'Save Layout' : 'Customize'}
              </button>
              
              {/* Manual Save Button */}
              {isEditMode && (
                <button
                  onClick={saveDashboardLayout}
                  className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                >
                  Save Now
                </button>
              )}
              
              {storageMethod === 'localStorage' && (
                <button
                  onClick={attemptSyncToDatabase}
                  disabled={isSyncing}
                  className={`px-4 py-2 rounded-md text-white ${
                    isSyncing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSyncing ? 'Syncing...' : 'Sync to Database'}
                </button>
              )}
              
              <button
                onClick={() => supabase.auth.signOut()}
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Widget Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 auto-rows-min">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className={`${
                  // Mobile: full width
                  'col-span-1 sm:col-span-2 lg:' + (
                    widget.position.w === 3 ? 'col-span-3' :
                    widget.position.w === 6 ? 'col-span-6' :
                    widget.position.w === 9 ? 'col-span-9' :
                    widget.position.w === 12 ? 'col-span-12' : 'col-span-3'
                  )
                } ${
                  widget.position.h === 2 ? 'row-span-2' :
                  widget.position.h === 3 ? 'row-span-3' :
                  widget.position.h === 4 ? 'row-span-4' : 'row-span-2'
                } ${
                  isEditMode ? 'cursor-move' : ''
                }`}
                draggable={isEditMode}
                onDragStart={(e) => handleDragStart(e, widget.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, widget.id)}
              >
                <div className="bg-white rounded-lg shadow p-4 h-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{widget.title}</h3>
                    {isEditMode && (
                      <button
                        onClick={() => removeWidget(widget.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {renderWidget(widget)}
                </div>
              </div>
            ))}
          </div>

          {/* Add Widget Panel */}
          {isEditMode && (
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Widgets</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.values(SALESMAN_WIDGET_TEMPLATES).map((template) => (
                  <button
                    key={template.id}
                    onClick={() => addWidget(template.id)}
                    className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-2xl mb-2">
                      {template.type === 'quota' ? '📊' :
                       template.type === 'deals' ? '💼' :
                       template.type === 'conversion' ? '🎯' :
                       template.type === 'activity' ? '📞' :
                       template.type === 'satisfaction' ? '⭐' :
                       template.type === 'trend' ? '📈' :
                       template.type === 'pipeline' ? '💰' :
                       template.type === 'products' ? '🏆' : '📊'}
                    </span>
                    <span className="text-sm font-medium text-gray-700 text-center">{template.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default SalesmanDashboard
