'use client'

import React, { useState, useEffect, useCallback, memo } from 'react'
import { performanceAPI } from '@/lib/api/performance';

interface ProblemMetricsProps {
  userId: string
  organizationId: string
  periodStart?: string
  periodEnd?: string
}

const ProblemMetrics = memo(function ProblemMetrics({ 
  userId, 
  organizationId: _organizationId, 
  periodStart, 
  periodEnd: _periodEnd 
}: ProblemMetricsProps) {
  const [metrics, setMetrics] = useState<Array<{ id: string; metric_type: string; value: number; timestamp: string; context: Record<string, unknown> }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProblemMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data, error } = await performanceAPI.getPerformanceMetrics(userId, periodStart)
      if (error) {
        throw new Error(error.message)
      }
      const problemMetrics = data?.filter(m => m.metric_type === 'problem') || []
      setMetrics(problemMetrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problem metrics')
    } finally {
      setIsLoading(false)
    }
  }, [userId, periodStart])

  useEffect(() => {
    loadProblemMetrics()
  }, [loadProblemMetrics])

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
  }

  if (error) {
    return (
      <div className="text-red-600">
        <p>{error}</p>
        <button onClick={loadProblemMetrics} className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">PROBLEM Framework Metrics</h3>
        <p className="text-sm text-gray-600 mb-6">
          PROBLEM measures problem identification and resolution effectiveness in your sales process.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-orange-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-orange-900 mb-2">Problem Identification</h4>
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {metrics.find(m => m.metricName === 'problem_identification')?.metricValue || 0}%
          </div>
          <p className="text-sm text-orange-700">Ability to identify customer problems</p>
        </div>

        <div className="bg-red-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-red-900 mb-2">Resolution Speed</h4>
          <div className="text-3xl font-bold text-red-600 mb-2">
            {metrics.find(m => m.metricName === 'resolution_speed')?.metricValue || 0}%
          </div>
          <p className="text-sm text-red-700">Speed of problem resolution</p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">Solution Effectiveness</h4>
          <div className="text-3xl font-bold text-yellow-600 mb-2">
            {metrics.find(m => m.metricName === 'solution_effectiveness')?.metricValue || 0}%
          </div>
          <p className="text-sm text-yellow-700">Effectiveness of proposed solutions</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-yellow-900 mb-3">PROBLEM Improvement Recommendations</h4>
        <ul className="space-y-2 text-sm text-yellow-800">
          <li className="flex items-start">
            <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Develop systematic problem identification techniques and frameworks
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Create standardized problem resolution processes and timelines
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Track and measure solution effectiveness and customer satisfaction
          </li>
        </ul>
      </div>
    </div>
  )
})

export { ProblemMetrics }
