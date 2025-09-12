'use client'

import React from 'react'

// Performance monitoring utilities for tracking and optimizing application performance

export interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  context?: string
  metadata?: Record<string, any>
}

export interface ComponentPerformanceData {
  componentName: string
  renderTime: number
  mountTime: number
  updateCount: number
  lastUpdate: number
  props?: Record<string, any>
}

export interface APIPerformanceData {
  endpoint: string
  method: string
  duration: number
  status: number
  timestamp: number
  size?: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private componentData: Map<string, ComponentPerformanceData> = new Map()
  private apiData: APIPerformanceData[] = []
  private observers: PerformanceObserver[] = []
  private isEnabled: boolean = true

  constructor() {
    this.initializeObservers()
    this.setupWebVitals()
  }

  private initializeObservers() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    // Observe navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.recordNavigationTiming(entry as PerformanceNavigationTiming)
          }
        }
      })
      navObserver.observe({ entryTypes: ['navigation'] })
      this.observers.push(navObserver)
    } catch (error) {
      console.warn('Navigation timing observer not supported:', error)
    }

    // Observe paint timing
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint') {
            this.recordPaintTiming(entry as PerformancePaintTiming)
          }
        }
      })
      paintObserver.observe({ entryTypes: ['paint'] })
      this.observers.push(paintObserver)
    } catch (error) {
      console.warn('Paint timing observer not supported:', error)
    }

    // Observe resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.recordResourceTiming(entry as PerformanceResourceTiming)
          }
        }
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.push(resourceObserver)
    } catch (error) {
      console.warn('Resource timing observer not supported:', error)
    }
  }

  private setupWebVitals() {
    if (typeof window === 'undefined') return

    // First Contentful Paint
    this.measureWebVital('FCP', () => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              resolve(entry.startTime)
              observer.disconnect()
            }
          }
        })
        observer.observe({ entryTypes: ['paint'] })
      })
    })

    // Largest Contentful Paint
    this.measureWebVital('LCP', () => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve(lastEntry.startTime)
        })
        observer.observe({ entryTypes: ['largest-contentful-paint'] })
      })
    })

    // First Input Delay
    this.measureWebVital('FID', () => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            resolve(entry.processingStart - entry.startTime)
          }
        })
        observer.observe({ entryTypes: ['first-input'] })
      })
    })

    // Cumulative Layout Shift
    this.measureWebVital('CLS', () => {
      return new Promise((resolve) => {
        let clsValue = 0
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          resolve(clsValue)
        })
        observer.observe({ entryTypes: ['layout-shift'] })
      })
    })
  }

  private async measureWebVital(name: string, measureFn: () => Promise<number>) {
    try {
      const value = await measureFn()
      this.recordMetric({
        name,
        value,
        timestamp: Date.now(),
        context: 'web-vitals'
      })
    } catch (error) {
      console.warn(`Failed to measure ${name}:`, error)
    }
  }

  private recordNavigationTiming(entry: PerformanceNavigationTiming) {
    const metrics = [
      { name: 'DNS Lookup', value: entry.domainLookupEnd - entry.domainLookupStart },
      { name: 'TCP Connection', value: entry.connectEnd - entry.connectStart },
      { name: 'TLS Handshake', value: entry.secureConnectionStart ? entry.connectEnd - entry.secureConnectionStart : 0 },
      { name: 'Request', value: entry.responseStart - entry.requestStart },
      { name: 'Response', value: entry.responseEnd - entry.responseStart },
      { name: 'DOM Processing', value: entry.domContentLoadedEventEnd - entry.responseEnd },
      { name: 'Load Complete', value: entry.loadEventEnd - entry.loadEventStart }
    ]

    metrics.forEach(metric => {
      if (metric.value > 0) {
        this.recordMetric({
          ...metric,
          timestamp: Date.now(),
          context: 'navigation'
        })
      }
    })
  }

  private recordPaintTiming(entry: PerformancePaintTiming) {
    this.recordMetric({
      name: entry.name,
      value: entry.startTime,
      timestamp: Date.now(),
      context: 'paint'
    })
  }

  private recordResourceTiming(entry: PerformanceResourceTiming) {
    // Only track API calls and important resources
    if (entry.name.includes('/api/') || entry.name.includes('.js') || entry.name.includes('.css')) {
      this.recordMetric({
        name: 'Resource Load',
        value: entry.duration,
        timestamp: Date.now(),
        context: 'resource',
        metadata: {
          url: entry.name,
          size: entry.transferSize,
          type: entry.initiatorType
        }
      })
    }
  }

  public recordMetric(metric: PerformanceMetric) {
    if (!this.isEnabled) return

    this.metrics.push(metric)
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Send to analytics if available
    this.sendToAnalytics(metric)
  }

  public recordComponentRender(componentName: string, renderTime: number, props?: Record<string, any>) {
    const existing = this.componentData.get(componentName)
    const now = Date.now()

    if (existing) {
      existing.renderTime = renderTime
      existing.updateCount += 1
      existing.lastUpdate = now
      existing.props = props
    } else {
      this.componentData.set(componentName, {
        componentName,
        renderTime,
        mountTime: renderTime,
        updateCount: 1,
        lastUpdate: now,
        props
      })
    }

    // Alert if component is rendering too frequently
    if (existing && existing.updateCount > 10 && (now - existing.lastUpdate) < 1000) {
      console.warn(`Component ${componentName} is re-rendering frequently (${existing.updateCount} times)`)
    }
  }

  public recordAPICall(endpoint: string, method: string, duration: number, status: number, size?: number) {
    const apiData: APIPerformanceData = {
      endpoint,
      method,
      duration,
      status,
      timestamp: Date.now(),
      size
    }

    this.apiData.push(apiData)

    // Keep only last 500 API calls
    if (this.apiData.length > 500) {
      this.apiData = this.apiData.slice(-500)
    }

    // Alert on slow API calls
    if (duration > 5000) {
      console.warn(`Slow API call detected: ${method} ${endpoint} took ${duration}ms`)
    }
  }

  public getPerformanceReport() {
    const now = Date.now()
    const last5Minutes = this.metrics.filter(m => now - m.timestamp < 5 * 60 * 1000)
    const lastHour = this.metrics.filter(m => now - m.timestamp < 60 * 60 * 1000)

    return {
      summary: {
        totalMetrics: this.metrics.length,
        last5Minutes: last5Minutes.length,
        lastHour: lastHour.length
      },
      webVitals: this.getWebVitalsReport(),
      componentPerformance: this.getComponentPerformanceReport(),
      apiPerformance: this.getAPIPerformanceReport(),
      recommendations: this.getPerformanceRecommendations()
    }
  }

  private getWebVitalsReport() {
    const webVitals = this.metrics.filter(m => m.context === 'web-vitals')
    const report: Record<string, any> = {}

    webVitals.forEach(metric => {
      if (!report[metric.name]) {
        report[metric.name] = []
      }
      report[metric.name].push(metric.value)
    })

    // Calculate averages
    Object.keys(report).forEach(key => {
      const values = report[key]
      report[key] = {
        values,
        average: values.reduce((a: number, b: number) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      }
    })

    return report
  }

  private getComponentPerformanceReport() {
    const components = Array.from(this.componentData.values())
    
    return components.map(comp => ({
      name: comp.componentName,
      averageRenderTime: comp.renderTime,
      updateCount: comp.updateCount,
      lastUpdate: comp.lastUpdate,
      isFrequentlyUpdating: comp.updateCount > 10
    }))
  }

  private getAPIPerformanceReport() {
    const now = Date.now()
    const recentCalls = this.apiData.filter(api => now - api.timestamp < 60 * 60 * 1000)
    
    const byEndpoint = recentCalls.reduce((acc, api) => {
      if (!acc[api.endpoint]) {
        acc[api.endpoint] = []
      }
      acc[api.endpoint].push(api.duration)
      return acc
    }, {} as Record<string, number[]>)

    return Object.keys(byEndpoint).map(endpoint => ({
      endpoint,
      callCount: byEndpoint[endpoint].length,
      averageDuration: byEndpoint[endpoint].reduce((a, b) => a + b, 0) / byEndpoint[endpoint].length,
      slowestCall: Math.max(...byEndpoint[endpoint])
    }))
  }

  private getPerformanceRecommendations() {
    const recommendations: string[] = []
    const report = this.getPerformanceReport()

    // Check Web Vitals
    const fcp = report.webVitals.FCP?.average
    if (fcp && fcp > 2000) {
      recommendations.push('First Contentful Paint is slow (>2s). Consider optimizing critical rendering path.')
    }

    const lcp = report.webVitals.LCP?.average
    if (lcp && lcp > 4000) {
      recommendations.push('Largest Contentful Paint is slow (>4s). Consider optimizing images and critical resources.')
    }

    const cls = report.webVitals.CLS?.average
    if (cls && cls > 0.1) {
      recommendations.push('Cumulative Layout Shift is high (>0.1). Consider fixing layout shifts.')
    }

    // Check component performance
    const slowComponents = report.componentPerformance.filter(comp => comp.averageRenderTime > 16)
    if (slowComponents.length > 0) {
      recommendations.push(`Components with slow render times: ${slowComponents.map(c => c.name).join(', ')}`)
    }

    const frequentUpdaters = report.componentPerformance.filter(comp => comp.isFrequentlyUpdating)
    if (frequentUpdaters.length > 0) {
      recommendations.push(`Components updating frequently: ${frequentUpdaters.map(c => c.name).join(', ')}`)
    }

    // Check API performance
    const slowAPIs = report.apiPerformance.filter(api => api.averageDuration > 2000)
    if (slowAPIs.length > 0) {
      recommendations.push(`Slow API endpoints: ${slowAPIs.map(api => api.endpoint).join(', ')}`)
    }

    return recommendations
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_context: metric.context
      })
    }
  }

  public enable() {
    this.isEnabled = true
  }

  public disable() {
    this.isEnabled = false
  }

  public cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.metrics = []
    this.componentData.clear()
    this.apiData = []
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// React hook for component performance tracking
export function usePerformanceTracking(componentName: string, props?: Record<string, any>) {
  const startTime = performance.now()

  React.useEffect(() => {
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    performanceMonitor.recordComponentRender(componentName, renderTime, props)
  })

  return {
    recordRender: (renderTime: number) => {
      performanceMonitor.recordComponentRender(componentName, renderTime, props)
    }
  }
}

// Higher-order component for automatic performance tracking
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown'
    const { recordRender } = usePerformanceTracking(name, props as Record<string, any>)
    
    const startTime = performance.now()
    
    React.useEffect(() => {
      const endTime = performance.now()
      recordRender(endTime - startTime)
    })

    return React.createElement(Component, props)
  }

  WrappedComponent.displayName = `withPerformanceTracking(${componentName || Component.displayName || Component.name})`
  
  return WrappedComponent
}

// API performance tracking wrapper
export function trackAPICall(endpoint: string, method: string) {
  return async (apiCall: () => Promise<Response>) => {
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
  }
}
