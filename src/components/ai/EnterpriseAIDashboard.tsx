'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChartBarIcon, 
  LightBulbIcon, 
  UserGroupIcon, 
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import {
  generateAdvancedLeadScore,
  generateDealRiskAssessment,
  generateCoachingRecommendations,
  generateSalesForecast,
  getRealTimeInsights,
  AIModelConfig,
  CoachingRecommendation,
  ForecastingData
} from '@/lib/api/enterprise-ai';

interface EnterpriseAIDashboardProps {
  organizationId: string;
  userId: string;
}

export default function EnterpriseAIDashboard({ organizationId, userId }: EnterpriseAIDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'coaching' | 'forecasting' | 'models'>('overview');
  const [insights, setInsights] = useState<Record<string, unknown>[]>([]);
  const [coachingRecommendations, setCoachingRecommendations] = useState<CoachingRecommendation[]>([]);
  const [forecastData, setForecastData] = useState<ForecastingData | null>(null);
  const [aiModels, _setAiModels] = useState<AIModelConfig[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Load real-time insights
      const insightsData = await getRealTimeInsights(organizationId);
      setInsights(insightsData);

      // Load coaching recommendations
      const coachingData = await generateCoachingRecommendations(userId, organizationId);
      setCoachingRecommendations(coachingData);

      // Load sales forecast
      const forecastData = await generateSalesForecast(organizationId, 'monthly');
      setForecastData(forecastData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, userId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleGenerateInsight = async (type: 'lead' | 'deal', entityId: string) => {
    setLoading(true);
    try {
      if (type === 'lead') {
        await generateAdvancedLeadScore(entityId, organizationId);
      } else {
        await generateDealRiskAssessment(entityId, organizationId);
      }
      await loadDashboardData();
    } catch (error) {
      console.error('Error generating insight:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'lead_scoring':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />;
      case 'deal_risk':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'coaching':
        return <UserGroupIcon className="h-5 w-5 text-blue-500" />;
      case 'forecasting':
        return <ChartBarIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <LightBulbIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'insights', name: 'AI Insights', icon: LightBulbIcon },
    { id: 'coaching', name: 'Coaching', icon: UserGroupIcon },
    { id: 'forecasting', name: 'Forecasting', icon: ArrowTrendingUpIcon },
    { id: 'models', name: 'AI Models', icon: SparklesIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-phase3-primary bg-clip-text text-transparent">Enterprise AI Intelligence</h1>
              <p className="mt-2 text-gray-600">
                Advanced AI-powered insights, coaching, and forecasting for enterprise sales operations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Refresh Insights
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'insights' | 'coaching' | 'forecasting' | 'models')}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Insights</p>
                    <p className="text-2xl font-semibold text-gray-900">{insights.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Coaching Recommendations</p>
                    <p className="text-2xl font-semibold text-gray-900">{coachingRecommendations.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Forecasted Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${forecastData?.predictions?.revenue?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <SparklesIcon className="h-8 w-8 text-indigo-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">AI Models</p>
                    <p className="text-2xl font-semibold text-gray-900">{aiModels.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Insights */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent AI Insights</h3>
              </div>
              <div className="p-6">
                {insights.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No recent insights available</p>
                ) : (
                  <div className="space-y-4">
                    {insights.slice(0, 5).map((insight) => (
                      <div key={(insight as { id: string }).id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getInsightIcon((insight as { type: string }).type)}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {(insight as { type: string }).type.replace('_', ' ').toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {(insight as { entity_type: string; entity_id: string }).entity_type}: {(insight as { entity_type: string; entity_id: string }).entity_id}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {Math.round((insight as { confidence_score: number }).confidence_score * 100)}% confidence
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date((insight as { created_at: string }).created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            {/* Insight Generation */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Generate AI Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Lead Scoring</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Generate advanced lead scores with ML-powered analysis
                  </p>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Lead ID"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      onClick={() => handleGenerateInsight('lead', 'sample-lead-id')}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Deal Risk Assessment</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Analyze deal risk with comprehensive factor evaluation
                  </p>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Opportunity ID"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      onClick={() => handleGenerateInsight('deal', 'sample-opportunity-id')}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                    >
                      Analyze
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* All Insights */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">All AI Insights</h3>
              </div>
              <div className="p-6">
                {insights.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No insights available</p>
                ) : (
                  <div className="space-y-4">
                    {insights.map((insight) => (
                      <div key={(insight as { id: string }).id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getInsightIcon((insight as { type: string }).type)}
                            <h4 className="font-medium text-gray-900">
                              {(insight as { type: string }).type.replace('_', ' ').toUpperCase()}
                            </h4>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date((insight as { created_at: string }).created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Entity: {(insight as { entity_type: string; entity_id: string }).entity_type} - {(insight as { entity_type: string; entity_id: string }).entity_id}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            Confidence: {Math.round((insight as { confidence_score: number }).confidence_score * 100)}%
                          </span>
                          <button className="text-sm text-indigo-600 hover:text-indigo-800">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'coaching' && (
          <div className="space-y-6">
            {/* Coaching Recommendations */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">AI-Powered Coaching Recommendations</h3>
              </div>
              <div className="p-6">
                {coachingRecommendations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No coaching recommendations available</p>
                ) : (
                  <div className="space-y-6">
                    {coachingRecommendations.map((recommendation) => (
                      <div key={recommendation.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{recommendation.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(recommendation.priority)}`}>
                            {recommendation.priority.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Action Items</h5>
                            <ul className="space-y-1">
                              {recommendation.actionItems.map((item, index) => (
                                <li key={index} className="text-sm text-gray-600 flex items-center">
                                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Resources</h5>
                            <ul className="space-y-1">
                              {recommendation.resources.map((resource, index) => (
                                <li key={index} className="text-sm text-gray-600">
                                  • {resource}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Expected Impact: {recommendation.expectedImpact}</span>
                          <span>Timeframe: {recommendation.timeframe}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'forecasting' && (
          <div className="space-y-6">
            {/* Sales Forecast */}
            {forecastData && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Sales Forecast</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      ${forecastData?.predictions?.revenue?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm text-gray-500">Forecasted Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {forecastData?.predictions?.deals || '0'}
                    </p>
                    <p className="text-sm text-gray-500">Expected Deals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {forecastData?.predictions?.conversionRate || '0'}%
                    </p>
                    <p className="text-sm text-gray-500">Conversion Rate</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Scenario Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-lg font-semibold text-green-800">
                        ${forecastData?.scenarios?.optimistic?.toLocaleString() || '0'}
                      </p>
                      <p className="text-sm text-green-600">Optimistic</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-lg font-semibold text-blue-800">
                        ${forecastData?.scenarios?.realistic?.toLocaleString() || '0'}
                      </p>
                      <p className="text-sm text-blue-600">Realistic</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-lg font-semibold text-red-800">
                        ${forecastData?.scenarios?.pessimistic?.toLocaleString() || '0'}
                      </p>
                      <p className="text-sm text-red-600">Pessimistic</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Key Factors</h4>
                  <div className="flex flex-wrap gap-2">
                    {forecastData?.factors?.map((factor, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {factor}
                      </span>
                    )) || []}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'models' && (
          <div className="space-y-6">
            {/* AI Models Management */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">AI Models</h3>
                <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
                  Add New Model
                </button>
              </div>

              <div className="space-y-4">
                {aiModels.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No AI models configured</p>
                ) : (
                  aiModels.map((model) => (
                    <div key={model.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{model.name}</h4>
                          <p className="text-sm text-gray-500">
                            {model.provider} • {model.modelType} • v{model.modelVersion}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            model.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {model.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <button className="text-sm text-indigo-600 hover:text-indigo-800">
                            Configure
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
