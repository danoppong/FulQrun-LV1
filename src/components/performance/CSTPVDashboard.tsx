'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { PerformanceAPI as _PerformanceAPI } from '@/lib/api/performance'

interface CSTPVScore {
  clarity: number
  score: number
  teach: number
  problem: number
  prospect: number
  value: number
  overall: number
}

interface PerformanceTrend {
  metric: string
  direction: 'up' | 'down' | 'stable'
  change: number
  period: string
}

interface PerformanceBenchmark {
  metric: string
  userValue: number
  teamAverage: number
  industryAverage: number
}
import { ClarityMetrics } from './ClarityMetrics'
import { ScoreMetrics } from './ScoreMetrics'
import { TeachMetrics } from './TeachMetrics'
import { ProblemMetrics } from './ProblemMetrics'
import { ValueMetrics } from './ValueMetrics';

interface CSTPVDashboardProps {
  userId: string
  organizationId: string
  periodStart?: string
  periodEnd?: string
}

export function CSTPVDashboard({ 
  userId, 
  organizationId, 
  periodStart, 
  periodEnd 
}: CSTPVDashboardProps) {
  const [cstpvScores, setCstpvScores] = useState<CSTPVScore | null>(null)
  const [trends, setTrends] = useState<PerformanceTrend[]>([])
  const [benchmarks, setBenchmarks] = useState<PerformanceBenchmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'clarity' | 'score' | 'teach' | 'problem' | 'value'>('overview')

  const loadPerformanceData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Mock data - in real implementation, this would call the API
      const scores: CSTPVScore = {
        clarity: 85,
        score: 78,
        teach: 92,
        problem: 88,
        prospect: 88,
        value: 81,
        overall: 85
      }
      
      const performanceTrends: PerformanceTrend[] = [
        { metric: 'clarity', direction: 'up', change: 5, period: 'last_week' },
        { metric: 'score', direction: 'stable', change: 0, period: 'last_month' }
      ]
      
      const performanceBenchmarks: PerformanceBenchmark[] = [
        { metric: 'clarity', userValue: 85, teamAverage: 78, industryAverage: 72 },
        { metric: 'score', userValue: 78, teamAverage: 82, industryAverage: 75 }
      ]

      setCstpvScores(scores)
      setTrends(performanceTrends)
      setBenchmarks(performanceBenchmarks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPerformanceData()
  }, [loadPerformanceData])

  const getScoreColor = useCallback((score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }, [])

  const getScoreBgColor = useCallback((score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    if (score >= 40) return 'bg-orange-100'
    return 'bg-red-100'
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div className="text-red-800 mb-4">{error}</div>
        <button
          onClick={loadPerformanceData}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!cstpvScores) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p>No performance data available for the selected period.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">CSTPV Performance Dashboard</h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Period: {periodStart ? new Date(periodStart).toLocaleDateString() : 'Current Month'} - {periodEnd ? new Date(periodEnd).toLocaleDateString() : 'Current Month'}
            </div>
            <button
              onClick={loadPerformanceData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* CSTPV Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {[
            { key: 'clarity', label: 'CLARITY', score: cstpvScores.clarity },
            { key: 'score', label: 'SCORE', score: cstpvScores.score },
            { key: 'teach', label: 'TEACH', score: cstpvScores.teach },
            { key: 'problem', label: 'PROBLEM', score: cstpvScores.problem },
            { key: 'value', label: 'VALUE', score: cstpvScores.value }
          ].map(({ key, label, score }) => (
            <div
              key={key}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                activeTab === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(key as string)}
            >
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                  {Math.round(score)}
                </div>
                <div className="text-sm text-gray-600 mt-1">{label}</div>
                <div className={`text-xs px-2 py-1 rounded-full mt-2 ${getScoreBgColor(score)} ${getScoreColor(score)}`}>
                  {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Improvement'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Score */}
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            Overall CSTPV Score: {Math.round(cstpvScores.overall)}
          </div>
          <div className={`text-lg px-4 py-2 rounded-full inline-block ${getScoreBgColor(cstpvScores.overall)} ${getScoreColor(cstpvScores.overall)}`}>
            {cstpvScores.overall >= 80 ? 'Outstanding Performance' : 
             cstpvScores.overall >= 60 ? 'Good Performance' : 
             cstpvScores.overall >= 40 ? 'Average Performance' : 'Needs Improvement'}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'clarity', label: 'CLARITY' },
              { id: 'score', label: 'SCORE' },
              { id: 'teach', label: 'TEACH' },
              { id: 'problem', label: 'PROBLEM' },
              { id: 'value', label: 'VALUE' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as string)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab 
              cstpvScores={cstpvScores}
              trends={trends}
              benchmarks={benchmarks}
            />
          )}
          {activeTab === 'clarity' && (
            <ClarityMetrics 
              userId={userId}
              organizationId={organizationId}
              periodStart={periodStart}
              periodEnd={periodEnd}
            />
          )}
          {activeTab === 'score' && (
            <ScoreMetrics 
              userId={userId}
              organizationId={organizationId}
              periodStart={periodStart}
              periodEnd={periodEnd}
            />
          )}
          {activeTab === 'teach' && (
            <TeachMetrics 
              userId={userId}
              organizationId={organizationId}
              periodStart={periodStart}
              periodEnd={periodEnd}
            />
          )}
          {activeTab === 'problem' && (
            <ProblemMetrics 
              userId={userId}
              organizationId={organizationId}
              periodStart={periodStart}
              periodEnd={periodEnd}
            />
          )}
          {activeTab === 'value' && (
            <ValueMetrics 
              userId={userId}
              organizationId={organizationId}
              periodStart={periodStart}
              periodEnd={periodEnd}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ 
  cstpvScores, 
  trends, 
  benchmarks 
}: { 
  cstpvScores: CSTPVScore
  trends: PerformanceTrend[]
  benchmarks: PerformanceBenchmark[]
}) {
  return (
    <div className="space-y-6">
      {/* Performance Trends */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trends.map((trend) => (
            <div key={trend.metric} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900 capitalize">{trend.metric}</h4>
                <span className={`text-sm font-medium ${
                  trend.direction === 'up' ? 'text-green-600' : 
                  trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {trend.change > 0 ? '+' : ''}{trend.change}%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{trend.change}</div>
              <div className="text-sm text-gray-500">
                Period: {trend.period} ({trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'})
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benchmarks */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Benchmarks</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-4">
            {benchmarks.map((benchmark) => (
              <div key={benchmark.metric} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 capitalize">{benchmark.metric}</span>
                    <span className="text-sm text-gray-500">Benchmark</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(benchmark.userValue / 100) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>You: {benchmark.userValue}</span>
                    <span>Team: {benchmark.teamAverage}</span>
                    <span>Org: {benchmark.teamAverage}</span>
                    <span>Industry: {benchmark.industryAverage}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSTPV Breakdown */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">CSTPV Framework Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">CLARITY</span>
              <span className="text-lg font-bold text-blue-600">{Math.round(cstpvScores.clarity)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-900">SCORE</span>
              <span className="text-lg font-bold text-green-600">{Math.round(cstpvScores.score)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-900">TEACH</span>
              <span className="text-lg font-bold text-purple-600">{Math.round(cstpvScores.teach)}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-orange-900">PROBLEM</span>
              <span className="text-lg font-bold text-orange-600">{Math.round(cstpvScores.problem)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-yellow-900">VALUE</span>
              <span className="text-lg font-bold text-yellow-600">{Math.round(cstpvScores.value)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-gray-300">
              <span className="text-sm font-medium text-gray-900">OVERALL</span>
              <span className="text-lg font-bold text-gray-900">{Math.round(cstpvScores.overall)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
