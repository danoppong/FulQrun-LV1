// Performance monitoring configuration

export interface PerformanceConfig {
  enabled: boolean
  trackWebVitals: boolean
  trackComponentRenders: boolean
  trackAPICalls: boolean
  trackResourceTiming: boolean
  maxMetrics: number
  maxAPICalls: number
  alertThresholds: {
    slowRender: number // ms
    frequentRenders: number // renders per second
    slowAPI: number // ms
    largeBundle: number // bytes
  }
  reporting: {
    enabled: boolean
    endpoint?: string
    apiKey?: string
    batchSize: number
    flushInterval: number // ms
  }
}

export const defaultPerformanceConfig: PerformanceConfig = {
  enabled: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITOR === 'true',
  trackWebVitals: true,
  trackComponentRenders: true,
  trackAPICalls: true,
  trackResourceTiming: true,
  maxMetrics: 1000,
  maxAPICalls: 500,
  alertThresholds: {
    slowRender: 16, // 60fps threshold
    frequentRenders: 10, // 10 renders per second
    slowAPI: 2000, // 2 seconds
    largeBundle: 1024 * 1024 // 1MB
  },
  reporting: {
    enabled: false,
    batchSize: 50,
    flushInterval: 30000 // 30 seconds
  }
}

// Performance monitoring recommendations based on industry standards
export const performanceRecommendations = {
  webVitals: {
    FCP: { good: 1800, needsImprovement: 3000 },
    LCP: { good: 2500, needsImprovement: 4000 },
    FID: { good: 100, needsImprovement: 300 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    TTFB: { good: 800, needsImprovement: 1800 }
  },
  componentPerformance: {
    maxRenderTime: 16, // 60fps
    maxRendersPerSecond: 10,
    maxComponentLifetime: 300000 // 5 minutes
  },
  apiPerformance: {
    maxResponseTime: 2000, // 2 seconds
    maxRetryAttempts: 3,
    timeoutThreshold: 10000 // 10 seconds
  }
}

// Performance monitoring utilities
export class PerformanceConfigManager {
  private config: PerformanceConfig

  constructor(config: PerformanceConfig = defaultPerformanceConfig) {
    this.config = { ...config }
  }

  updateConfig(updates: Partial<PerformanceConfig>) {
    this.config = { ...this.config, ...updates }
  }

  getConfig(): PerformanceConfig {
    return { ...this.config }
  }

  isEnabled(): boolean {
    return this.config.enabled
  }

  shouldTrackWebVitals(): boolean {
    return this.config.enabled && this.config.trackWebVitals
  }

  shouldTrackComponentRenders(): boolean {
    return this.config.enabled && this.config.trackComponentRenders
  }

  shouldTrackAPICalls(): boolean {
    return this.config.enabled && this.config.trackAPICalls
  }

  shouldTrackResourceTiming(): boolean {
    return this.config.enabled && this.config.trackResourceTiming
  }

  getAlertThresholds() {
    return this.config.alertThresholds
  }

  isSlowRender(renderTime: number): boolean {
    return renderTime > this.config.alertThresholds.slowRender
  }

  isFrequentRendering(rendersPerSecond: number): boolean {
    return rendersPerSecond > this.config.alertThresholds.frequentRenders
  }

  isSlowAPI(responseTime: number): boolean {
    return responseTime > this.config.alertThresholds.slowAPI
  }

  isLargeBundle(size: number): boolean {
    return size > this.config.alertThresholds.largeBundle
  }
}

// Singleton instance
export const performanceConfig = new PerformanceConfigManager()
