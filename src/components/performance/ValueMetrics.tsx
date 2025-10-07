'use client'

import React, { useState, useEffect, memo, useCallback } from 'react'
import { performanceAPI } from '@/lib/api/performance';

interface ValueMetricsProps {
  userId: string
  organizationId: string
  periodStart?: string
  periodEnd?: string
}

const ValueMetrics = memo(function ValueMetrics({ 
  userId, 
  organizationId: _organizationId, 
  periodStart, 
  periodEnd: _periodEnd 
}: ValueMetricsProps) {
  const [metrics, setMetrics] = useState<Array<{
    id: string
    metric_type: string
    value: number
    timestamp: string
    context: Record<string, unknown>
  }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadValueMetrics()
  }, [loadValueMetrics])

  const loadValueMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data, error } = await performanceAPI.getPerformanceMetrics(userId, periodStart)
      if (error) {
        throw new Error(error.message)
      }
      const valueMetrics = data?.filter(m => m.metric_type === 'value') || []
      setMetrics(valueMetrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load value metrics')
    } finally {
      setIsLoading(false)
    }
  }, [userId, periodStart])

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
  }

  if (error) {
    return (
      <div className="text-red-600">
        <p>{error}</p>
        <button onClick={loadValueMetrics} className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">VALUE Framework Metrics</h3>
        <p className="text-sm text-gray-600 mb-6">
          VALUE measures value creation and customer satisfaction in your sales process.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-yellow-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">Value Creation</h4>
          <div className="text-3xl font-bold text-yellow-600 mb-2">
            {metrics.find(m => m.metricName === 'value_creation')?.metricValue || 0}%
          </div>
          <p className="text-sm text-yellow-700">Ability to create customer value</p>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-green-900 mb-2">Customer Satisfaction</h4>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {metrics.find(m => m.metricName === 'customer_satisfaction')?.metricValue || 0}%
          </div>
          <p className="text-sm text-green-700">Customer satisfaction scores</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-blue-900 mb-2">ROI Delivery</h4>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {metrics.find(m => m.metricName === 'roi_delivery')?.metricValue || 0}%
          </div>
          <p className="text-sm text-blue-700">Return on investment delivery</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-yellow-900 mb-3">VALUE Improvement Recommendations</h4>
        <ul className="space-y-2 text-sm text-yellow-800">
          <li className="flex items-start">
            <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Focus on understanding and quantifying customer value propositions
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Implement regular customer satisfaction surveys and feedback loops
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Track and measure ROI delivery and value realization
          </li>
        </ul>
      </div>
    </div>
  )
})

export { ValueMetrics }
