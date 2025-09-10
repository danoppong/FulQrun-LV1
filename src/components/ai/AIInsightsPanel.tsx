'use client'

import React, { useState, useEffect } from 'react'
import { AIInsightsEngine } from '@/lib/ai/insights-engine'
import { AIInsightData, LeadScoringInsight, DealRiskInsight, NextActionInsight } from '@/lib/api/ai-insights'

interface AIInsightsPanelProps {
  entityType: 'lead' | 'opportunity' | 'contact' | 'user' | 'organization'
  entityId: string
  organizationId: string
  entityData?: any
  onRefresh?: () => void
}

export function AIInsightsPanel({ 
  entityType, 
  entityId, 
  organizationId, 
  entityData,
  onRefresh 
}: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<AIInsightData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('')

  useEffect(() => {
    loadInsights()
  }, [entityType, entityId, organizationId])

  const loadInsights = async () => {
    try {
      setIsLoading(true)
      const data = await AIInsightsEngine.getEntityInsights(entityType, entityId, organizationId)
      setInsights(data)
      
      // Set active tab to first available insight type
      if (data.length > 0 && !activeTab) {
        setActiveTab(data[0].type)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI insights')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshInsights = async () => {
    if (!entityData) return

    try {
      setIsLoading(true)
      const context = {
        organizationId,
        userId: 'current-user', // This should come from auth context
      }
      
      await AIInsightsEngine.refreshEntityInsights(entityType, entityId, entityData, context)
      await loadInsights()
      onRefresh?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh insights')
    } finally {
      setIsLoading(false)
    }
  }

  const getInsightTabs = () => {
    const tabs = insights.map(insight => ({
      id: insight.type,
      label: insight.type.replace('_', ' ').toUpperCase(),
      count: 1
    }))

    return tabs
  }

  const getCurrentInsight = () => {
    return insights.find(insight => insight.type === activeTab)
  }

  const renderInsightContent = (insight: AIInsightData) => {
    switch (insight.type) {
      case 'lead_scoring':
        return <LeadScoringInsight insight={insight.insightData as LeadScoringInsight} />
      case 'deal_risk':
        return <DealRiskInsight insight={insight.insightData as DealRiskInsight} />
      case 'next_action':
        return <NextActionInsight insight={insight.insightData as NextActionInsight} />
      case 'forecasting':
        return <ForecastingInsight insight={insight.insightData as any} />
      case 'performance':
        return <PerformanceInsight insight={insight.insightData as any} />
      default:
        return <div className="text-gray-500">Unknown insight type</div>
    }
  }

  if (isLoading && insights.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="text-red-800 mb-4">{error}</div>
        <button
          onClick={loadInsights}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="mb-4">No AI insights available</p>
          {entityData && (
            <button
              onClick={handleRefreshInsights}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Generate Insights'}
            </button>
          )}
        </div>
      </div>
    )
  }

  const tabs = getInsightTabs()
  const currentInsight = getCurrentInsight()

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">AI Insights</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Confidence: {currentInsight ? Math.round((currentInsight.confidenceScore || 0) * 100) : 0}%
            </span>
            <button
              onClick={handleRefreshInsights}
              disabled={isLoading || !entityData}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              title="Refresh insights"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {currentInsight ? (
          renderInsightContent(currentInsight)
        ) : (
          <div className="text-gray-500">Select an insight type to view details</div>
        )}
      </div>
    </div>
  )
}

// Individual insight components
function LeadScoringInsight({ insight }: { insight: LeadScoringInsight }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-gray-900">Lead Score</h4>
        <div className="text-2xl font-bold text-blue-600">{insight.score}/100</div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="text-sm font-medium text-gray-700 mb-3">Scoring Factors</h5>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(insight.factors).map(([factor, score]) => (
            <div key={factor} className="flex justify-between">
              <span className="text-sm text-gray-600 capitalize">{factor.replace(/([A-Z])/g, ' $1')}</span>
              <span className="text-sm font-medium">{score}/100</span>
            </div>
          ))}
        </div>
      </div>

      {insight.recommendations.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h5>
          <ul className="space-y-1">
            {insight.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function DealRiskInsight({ insight }: { insight: DealRiskInsight }) {
  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'Critical'
    if (score >= 60) return 'High'
    if (score >= 40) return 'Medium'
    return 'Low'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-gray-900">Deal Risk Assessment</h4>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getRiskColor(insight.riskScore)}`}>
            {insight.riskScore}/100
          </div>
          <div className="text-sm text-gray-500">{getRiskLevel(insight.riskScore)} Risk</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="text-sm font-medium text-gray-700 mb-3">Risk Factors</h5>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(insight.riskFactors).map(([factor, score]) => (
            <div key={factor} className="flex justify-between">
              <span className="text-sm text-gray-600 capitalize">{factor.replace(/([A-Z])/g, ' $1')}</span>
              <span className={`text-sm font-medium ${getRiskColor(score)}`}>{score}/100</span>
            </div>
          ))}
        </div>
      </div>

      {insight.mitigationStrategies.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Mitigation Strategies</h5>
          <ul className="space-y-1">
            {insight.mitigationStrategies.map((strategy, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <svg className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {strategy}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function NextActionInsight({ insight }: { insight: NextActionInsight }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="text-md font-medium text-gray-900">Recommended Next Actions</h4>
      
      <div className="space-y-3">
        {insight.actions.map((action, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h5 className="text-sm font-medium text-gray-900">{action.action}</h5>
              <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(action.priority)}`}>
                {action.priority.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{action.reasoning}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Impact: {action.estimatedImpact}%</span>
              <span>Effort: {action.estimatedEffort} hours</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ForecastingInsight({ insight }: { insight: any }) {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-medium text-gray-900">Sales Forecast</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h5 className="text-sm font-medium text-blue-900 mb-1">Short-term (30 days)</h5>
          <div className="text-2xl font-bold text-blue-600">
            ${insight.forecast?.shortTerm?.toLocaleString() || 0}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h5 className="text-sm font-medium text-green-900 mb-1">Long-term (90 days)</h5>
          <div className="text-2xl font-bold text-green-600">
            ${insight.forecast?.longTerm?.toLocaleString() || 0}
          </div>
        </div>
      </div>

      {insight.trends && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Trends</h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Growth Rate</span>
              <span className="text-sm font-medium">{insight.trends.growth}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Seasonality</span>
              <span className="text-sm font-medium">{insight.trends.seasonality}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PerformanceInsight({ insight }: { insight: any }) {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-medium text-gray-900">Performance Analysis</h4>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="text-sm font-medium text-gray-700 mb-3">Key Metrics</h5>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(insight.metrics || {}).map(([metric, value]) => (
            <div key={metric} className="flex justify-between">
              <span className="text-sm text-gray-600 capitalize">{metric.replace(/([A-Z])/g, ' $1')}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {insight.recommendations && insight.recommendations.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h5>
          <ul className="space-y-1">
            {insight.recommendations.map((rec: string, index: number) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
