'use client'

import React, { useState, useEffect, memo } from 'react'
import { PerformanceAPI } from '@/lib/api/performance'

interface ClarityMetricsProps {
  userId: string
  organizationId: string
  periodStart?: string
  periodEnd?: string
}

const ClarityMetrics = memo(function ClarityMetrics({ 
  userId, 
  organizationId, 
  periodStart, 
  periodEnd 
}: ClarityMetricsProps) {
  const [metrics, setMetrics] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadClarityMetrics()
  }, [userId, organizationId, periodStart, periodEnd])

  const loadClarityMetrics = async () => {
    try {
      setIsLoading(true)
      const data = await PerformanceAPI.getUserMetrics(userId, periodStart, periodEnd)
      const clarityMetrics = data.filter(m => m.metricType === 'clarity')
      setMetrics(clarityMetrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clarity metrics')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600">
        <p>{error}</p>
        <button
          onClick={loadClarityMetrics}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">CLARITY Framework Metrics</h3>
        <p className="text-sm text-gray-600 mb-6">
          CLARITY measures goal clarity and communication effectiveness in your sales process.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Goal Clarity</h4>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {metrics.find(m => m.metricName === 'goal_clarity')?.metricValue || 0}%
          </div>
          <p className="text-sm text-blue-700">
            How clearly defined are your sales goals and objectives?
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-green-900 mb-2">Communication Effectiveness</h4>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {metrics.find(m => m.metricName === 'communication_effectiveness')?.metricValue || 0}%
          </div>
          <p className="text-sm text-green-700">
            How effectively do you communicate with prospects and customers?
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-purple-900 mb-2">Process Clarity</h4>
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {metrics.find(m => m.metricName === 'process_clarity')?.metricValue || 0}%
          </div>
          <p className="text-sm text-purple-700">
            How clear is your sales process to all stakeholders?
          </p>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Detailed CLARITY Metrics</h4>
        <div className="space-y-4">
          {[
            {
              name: 'Goal Setting Clarity',
              description: 'Clarity of individual and team sales goals',
              value: metrics.find(m => m.metricName === 'goal_setting_clarity')?.metricValue || 0,
              target: 80
            },
            {
              name: 'Customer Communication',
              description: 'Effectiveness of customer-facing communications',
              value: metrics.find(m => m.metricName === 'customer_communication')?.metricValue || 0,
              target: 85
            },
            {
              name: 'Internal Communication',
              description: 'Clarity of internal team communications',
              value: metrics.find(m => m.metricName === 'internal_communication')?.metricValue || 0,
              target: 80
            },
            {
              name: 'Process Documentation',
              description: 'Clarity and completeness of process documentation',
              value: metrics.find(m => m.metricName === 'process_documentation')?.metricValue || 0,
              target: 75
            },
            {
              name: 'Expectation Setting',
              description: 'Clarity in setting customer expectations',
              value: metrics.find(m => m.metricName === 'expectation_setting')?.metricValue || 0,
              target: 85
            }
          ].map((metric) => (
            <div key={metric.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h5 className="text-sm font-medium text-gray-900">{metric.name}</h5>
                <p className="text-sm text-gray-600">{metric.description}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{metric.value}%</div>
                  <div className="text-sm text-gray-500">Target: {metric.target}%</div>
                </div>
                <div className="w-24">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        metric.value >= metric.target ? 'bg-green-500' : 
                        metric.value >= metric.target * 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(metric.value, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-yellow-900 mb-3">CLARITY Improvement Recommendations</h4>
        <ul className="space-y-2 text-sm text-yellow-800">
          <li className="flex items-start">
            <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Document clear, measurable sales goals with specific timelines
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Create standardized communication templates for common scenarios
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Implement regular goal review and communication sessions
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Use visual aids and process maps to clarify complex procedures
          </li>
        </ul>
      </div>
    </div>
  )
})

export { ClarityMetrics }
