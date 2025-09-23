'use client'

import React, { useState, useEffect, memo, useCallback } from 'react'
import { performanceMonitor, PerformanceMetric } from '@/lib/performance-monitor'

interface PerformanceDashboardProps {
  isOpen: boolean
  onClose: () => void
}

const PerformanceDashboard = memo(function PerformanceDashboard({ 
  isOpen, 
  onClose 
}: PerformanceDashboardProps) {
  const [report, setReport] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshReport = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const performanceReport = performanceMonitor.getPerformanceReport()
      setReport(performanceReport)
    } catch (error) {
      console.error('Failed to get performance report:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      refreshReport()
    }
  }, [isOpen, refreshReport])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitor</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshReport}
              disabled={isRefreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {report && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800">Total Metrics</h3>
                  <p className="text-2xl font-bold text-blue-900">{report.summary.totalMetrics}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800">Last 5 Minutes</h3>
                  <p className="text-2xl font-bold text-green-900">{report.summary.last5Minutes}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-800">Last Hour</h3>
                  <p className="text-2xl font-bold text-purple-900">{report.summary.lastHour}</p>
                </div>
              </div>

              {/* Web Vitals */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Web Vitals</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(report.webVitals).map(([name, data]: [string, any]) => (
                    <div key={name} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700">{name}</h4>
                      <div className="mt-2 space-y-1">
                        <p className="text-lg font-bold text-gray-900">
                          {data.average ? `${data.average.toFixed(2)}ms` : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Min: {data.min ? `${data.min.toFixed(2)}ms` : 'N/A'} | 
                          Max: {data.max ? `${data.max.toFixed(2)}ms` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Component Performance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Component Performance</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Component
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Render Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Updates
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.componentPerformance.map((comp: any, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {comp.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {comp.averageRenderTime.toFixed(2)}ms
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {comp.updateCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              comp.averageRenderTime > 16 
                                ? 'bg-red-100 text-red-800' 
                                : comp.isFrequentlyUpdating
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {comp.averageRenderTime > 16 
                                ? 'Slow' 
                                : comp.isFrequentlyUpdating
                                ? 'Frequent Updates'
                                : 'Good'
                              }
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* API Performance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">API Performance</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Endpoint
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Calls
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Slowest Call
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.apiPerformance.map((api: any, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {api.endpoint}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {api.callCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {api.averageDuration.toFixed(2)}ms
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {api.slowestCall.toFixed(2)}ms
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recommendations */}
              {report.recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Recommendations</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <ul className="space-y-2">
                      {report.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-yellow-800">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
})

export { PerformanceDashboard }
