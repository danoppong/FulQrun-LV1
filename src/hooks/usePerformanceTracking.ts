'use client'

import { useEffect, useRef, useCallback } from 'react'
import { performanceMonitor } from '@/lib/performance-monitor'

interface UsePerformanceTrackingOptions {
  componentName: string
  trackRenders?: boolean
  trackProps?: boolean
  props?: Record<string, any>
}

export function usePerformanceTracking({
  componentName,
  trackRenders = true,
  trackProps = false,
  props
}: UsePerformanceTrackingOptions) {
  const renderCount = useRef(0)
  const mountTime = useRef<number | null>(null)
  const lastRenderTime = useRef<number | null>(null)

  // Track component mount
  useEffect(() => {
    mountTime.current = performance.now()
    renderCount.current = 0
    
    return () => {
      // Component unmount - could track total lifetime here
      if (mountTime.current) {
        const lifetime = performance.now() - mountTime.current
        performanceMonitor.recordMetric({
          name: 'Component Lifetime',
          value: lifetime,
          timestamp: Date.now(),
          context: componentName
        })
      }
    }
  }, [componentName])

  // Track renders
  useEffect(() => {
    if (!trackRenders) return

    const now = performance.now()
    renderCount.current += 1

    if (lastRenderTime.current) {
      const timeSinceLastRender = now - lastRenderTime.current
      
      // Track render frequency
      performanceMonitor.recordMetric({
        name: 'Render Frequency',
        value: timeSinceLastRender,
        timestamp: now,
        context: componentName
      })

      // Alert on rapid re-renders
      if (timeSinceLastRender < 100 && renderCount.current > 1) {
        console.warn(`Component ${componentName} is re-rendering rapidly (${timeSinceLastRender.toFixed(2)}ms since last render)`)
      }
    }

    lastRenderTime.current = now

    // Track component render performance
    performanceMonitor.recordComponentRender(componentName, 0, trackProps ? props : undefined)
  })

  // Track prop changes
  useEffect(() => {
    if (!trackProps || !props) return

    const propKeys = Object.keys(props)
    const propValues = Object.values(props)
    
    performanceMonitor.recordMetric({
      name: 'Props Changed',
      value: propKeys.length,
      timestamp: Date.now(),
      context: componentName,
      metadata: {
        propKeys,
        propValues: propValues.map(v => typeof v)
      }
    })
  }, [componentName, props, trackProps])

  const recordCustomMetric = useCallback((name: string, value: number, metadata?: Record<string, any>) => {
    performanceMonitor.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      context: componentName,
      metadata
    })
  }, [componentName])

  const recordAPICall = useCallback(async (endpoint: string, method: string, apiCall: () => Promise<Response>) => {
    const startTime = performance.now()
    
    try {
      const response = await apiCall()
      const endTime = performance.now()
      const duration = endTime - startTime
      
      performanceMonitor.recordAPICall(
        endpoint,
        method,
        duration,
        response.status,
        response.headers.get('content-length') ? parseInt(response.headers.get('content-length')!) : undefined
      )
      
      return response
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      performanceMonitor.recordAPICall(
        endpoint,
        method,
        duration,
        0 // Error status
      )
      
      throw error
    }
  }, [])

  return {
    recordCustomMetric,
    recordAPICall,
    renderCount: renderCount.current,
    mountTime: mountTime.current
  }
}
