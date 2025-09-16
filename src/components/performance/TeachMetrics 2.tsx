'use client'

import React, { useState, useEffect } from 'react'
import { PerformanceAPI } from '@/lib/api/performance'

interface TeachMetricsProps {
  userId: string
  organizationId: string
  periodStart?: string
  periodEnd?: string
}

export function TeachMetrics({ 
  userId, 
  organizationId, 
  periodStart, 
  periodEnd 
}: TeachMetricsProps) {
  const [metrics, setMetrics] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTeachMetrics()
  }, [userId, organizationId, periodStart, periodEnd])

  const loadTeachMetrics = async () => {
    try {
      setIsLoading(true)
      // Mock data - in real implementation, this would call the API
      const data = [
        {
          id: '1',
          metricType: 'teach',
          value: 90,
          timestamp: new Date().toISOString(),
          metadata: { source: 'call_analysis' }
        },
        {
          id: '2',
          metricType: 'teach',
          value: 87,
          timestamp: new Date().toISOString(),
          metadata: { source: 'email_analysis' }
        }
      ]
      const teachMetrics = data.filter(m => m.metricType === 'teach')
      setMetrics(teachMetrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teach metrics')
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
        <button onClick={loadTeachMetrics} className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">TEACH Framework Metrics</h3>
        <p className="text-sm text-gray-600 mb-6">
          TEACH measures knowledge transfer and training effectiveness in your sales process.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-purple-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-purple-900 mb-2">Knowledge Transfer</h4>
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {metrics.find(m => m.metricName === 'knowledge_transfer')?.metricValue || 0}%
          </div>
          <p className="text-sm text-purple-700">Effectiveness of knowledge sharing</p>
        </div>

        <div className="bg-indigo-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-indigo-900 mb-2">Training Completion</h4>
          <div className="text-3xl font-bold text-indigo-600 mb-2">
            {metrics.find(m => m.metricName === 'training_completion')?.metricValue || 0}%
          </div>
          <p className="text-sm text-indigo-700">Training program completion rate</p>
        </div>

        <div className="bg-pink-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-pink-900 mb-2">Skill Development</h4>
          <div className="text-3xl font-bold text-pink-600 mb-2">
            {metrics.find(m => m.metricName === 'skill_development')?.metricValue || 0}%
          </div>
          <p className="text-sm text-pink-700">Skill improvement measurement</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-yellow-900 mb-3">TEACH Improvement Recommendations</h4>
        <ul className="space-y-2 text-sm text-yellow-800">
          <li className="flex items-start">
            <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Implement regular knowledge sharing sessions and mentoring
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Create structured training programs with clear objectives
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Measure and track skill development progress regularly
          </li>
        </ul>
      </div>
    </div>
  )
}
