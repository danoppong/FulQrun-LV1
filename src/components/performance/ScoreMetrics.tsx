'use client'

import React, { useState, useEffect, memo } from 'react'
import { performanceAPI } from '@/lib/api/performance'

interface ScoreMetricsProps {
  userId: string
  organizationId: string
  periodStart?: string
  periodEnd?: string
}

const ScoreMetrics = memo(function ScoreMetrics({ 
  userId, 
  organizationId, 
  periodStart, 
  periodEnd 
}: ScoreMetricsProps) {
  const [metrics, setMetrics] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadScoreMetrics()
  }, [userId, organizationId, periodStart, periodEnd])

  const loadScoreMetrics = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await performanceAPI.getPerformanceMetrics(userId, periodStart)
      if (error) {
        throw new Error(error.message)
      }
      const scoreMetrics = data?.filter(m => m.metric_type === 'score') || []
      setMetrics(scoreMetrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load score metrics')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
  }

  if (error) {
    return (
      <div className="text-red-600">
        <p>{error}</p>
        <button onClick={loadScoreMetrics} className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">SCORE Framework Metrics</h3>
        <p className="text-sm text-gray-600 mb-6">
          SCORE measures performance against targets and quotas in your sales activities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-green-900 mb-2">Quota Achievement</h4>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {metrics.find(m => m.metricName === 'quota_achievement')?.metricValue || 0}%
          </div>
          <p className="text-sm text-green-700">Percentage of quota achieved</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Revenue Target</h4>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {metrics.find(m => m.metricName === 'revenue_target')?.metricValue || 0}%
          </div>
          <p className="text-sm text-blue-700">Revenue target achievement</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-purple-900 mb-2">Activity Score</h4>
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {metrics.find(m => m.metricName === 'activity_score')?.metricValue || 0}%
          </div>
          <p className="text-sm text-purple-700">Sales activity performance</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-yellow-900 mb-3">SCORE Improvement Recommendations</h4>
        <ul className="space-y-2 text-sm text-yellow-800">
          <li className="flex items-start">
            <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Set realistic, achievable targets with clear milestones
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Track daily and weekly progress against targets
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Focus on high-value activities that drive results
          </li>
        </ul>
      </div>
    </div>
  )
})

export { ScoreMetrics }
