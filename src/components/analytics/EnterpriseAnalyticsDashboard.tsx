'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  EyeIcon,
  PlusIcon,
  CogIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  PresentationChartLineIcon,
  TableCellsIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { 
  getAnalyticsDashboards,
  createAnalyticsDashboard,
  calculateKPIs,
  getKPITemplates,
  generateForecast,
  getRealTimeMetrics,
  executeAnalyticsQuery,
  generateExecutiveReport,
  getChartData,
  generateAnalyticsInsights,
  AnalyticsDashboard,
  KPIMetric,
  RealTimeMetric
} from '@/lib/api/enterprise-analytics';

interface EnterpriseAnalyticsDashboardProps {
  organizationId: string;
  userId: string;
}

export default function EnterpriseAnalyticsDashboard({ organizationId, userId }: EnterpriseAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'dashboards' | 'kpis' | 'forecasting' | 'realtime' | 'queries' | 'reports'>('overview');
  const [dashboards, setDashboards] = useState<AnalyticsDashboard[]>([]);
  const [kpis, setKpis] = useState<KPIMetric[]>([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetric[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDashboardModal, setShowCreateDashboardModal] = useState(false);
  const [dashboardForm, setDashboardForm] = useState<any>({});
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [organizationId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        dashboardsData,
        kpisData,
        realTimeMetricsData,
        insightsData
      ] = await Promise.all([
        getAnalyticsDashboards(organizationId),
        getKPITemplates(),
        getRealTimeMetrics(organizationId),
        generateAnalyticsInsights(organizationId)
      ]);
      
      setDashboards(dashboardsData);
      setKpis(kpisData);
      setRealTimeMetrics(realTimeMetricsData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDashboard = async () => {
    try {
      setLoading(true);
      const newDashboard = await createAnalyticsDashboard({
        dashboardName: dashboardForm.name,
        dashboardType: dashboardForm.type,
        config: {},
        kpis: kpis.filter(kpi => selectedKPIs.includes(kpi.id)),
        filters: {},
        refreshFrequencyMinutes: 15,
        isPublic: false,
        accessLevel: 'organization',
        organizationId
      }, userId);
      
      setDashboards([newDashboard, ...dashboards]);
      setShowCreateDashboardModal(false);
      setDashboardForm({});
      setSelectedKPIs([]);
    } catch (error) {
      console.error('Error creating dashboard:', error);
      alert('Error creating dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateForecast = async () => {
    try {
      setLoading(true);
      const forecast = await generateForecast(organizationId, 'revenue', 'monthly', 6);
      alert(`Forecast generated: ${forecast.predictions.length} predictions with ${Math.round(forecast.confidence * 100)}% confidence`);
    } catch (error) {
      console.error('Error generating forecast:', error);
      alert('Error generating forecast');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteQuery = async () => {
    try {
      setLoading(true);
      const query = await executeAnalyticsQuery(
        'sales_performance_by_user',
        {},
        organizationId,
        userId
      );
      alert(`Query executed in ${query.executionTime}ms`);
    } catch (error) {
      console.error('Error executing query:', error);
      alert('Error executing query');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />;
      case 'down':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-red-500 rotate-180" />;
      default:
        return <ArrowTrendingUpIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'dashboards', name: 'Dashboards', icon: PresentationChartLineIcon },
    { id: 'kpis', name: 'KPIs', icon: ArrowTrendingUpIcon },
    { id: 'forecasting', name: 'Forecasting', icon: ArrowPathIcon },
    { id: 'realtime', name: 'Real-time', icon: EyeIcon },
    { id: 'queries', name: 'Queries', icon: TableCellsIcon },
    { id: 'reports', name: 'Reports', icon: DocumentTextIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enterprise Analytics & BI</h1>
              <p className="mt-2 text-gray-600">
                Real-time dashboards, predictive forecasting, custom KPI builders, and executive reporting
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
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </button>
              <button
                onClick={() => setShowCreateDashboardModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Dashboard
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
                  onClick={() => setActiveTab(tab.id as any)}
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
            {/* KPI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpis.slice(0, 4).map((kpi) => (
                <div key={kpi.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: kpi.color + '20' }}>
                          <div className="h-4 w-4 rounded" style={{ backgroundColor: kpi.color }}></div>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">{kpi.name}</p>
                      </div>
                    </div>
                    {getTrendIcon(kpi.trend)}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatValue(kpi.currentValue, kpi.format)}
                    </p>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getTrendColor(kpi.trend)}`}>
                        {kpi.trend === 'up' ? '+' : kpi.trend === 'down' ? '-' : ''}
                        {formatValue(Math.abs(kpi.currentValue - kpi.previousValue), kpi.format)}
                      </p>
                      <p className="text-xs text-gray-500">vs previous</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Real-time Metrics */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Real-time Metrics</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {realTimeMetrics.map((metric) => (
                    <div key={metric.id} className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{metric.value.toLocaleString()}</p>
                      <p className="text-sm text-gray-500 capitalize">{metric.metricName.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Analytics Insights */}
            {insights.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Analytics Insights</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {insights.map((insight, index) => (
                      <div key={index} className={`border-l-4 p-4 rounded-r-lg ${
                        insight.type === 'positive' ? 'border-green-400 bg-green-50' :
                        insight.type === 'warning' ? 'border-yellow-400 bg-yellow-50' :
                        'border-red-400 bg-red-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{insight.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                            insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {insight.impact} impact
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                        {insight.recommendations && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-500 mb-1">Recommendations:</p>
                            <ul className="text-xs text-gray-600 list-disc list-inside">
                              {insight.recommendations.map((rec: string, i: number) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboards' && (
          <div className="space-y-6">
            {/* Dashboards List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Analytics Dashboards</h3>
              </div>
              <div className="p-6">
                {dashboards.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No dashboards created yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboards.map((dashboard) => (
                      <div key={dashboard.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900">{dashboard.dashboardName}</h4>
                            <p className="text-sm text-gray-500 capitalize">{dashboard.dashboardType.replace('_', ' ')}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              dashboard.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {dashboard.isPublic ? 'Public' : 'Private'}
                            </span>
                            <button className="text-gray-400 hover:text-gray-600">
                              <CogIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-2">KPIs: {dashboard.kpis.length}</p>
                          <p className="text-sm text-gray-500">Refresh: {dashboard.refreshFrequencyMinutes} min</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <button className="text-sm text-indigo-600 hover:text-indigo-800">
                            View Dashboard
                          </button>
                          <button className="text-sm text-gray-600 hover:text-gray-800">
                            Edit
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

        {activeTab === 'kpis' && (
          <div className="space-y-6">
            {/* KPI Templates */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">KPI Templates</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {kpis.map((kpi) => (
                    <div key={kpi.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="h-4 w-4 rounded" style={{ backgroundColor: kpi.color }}></div>
                          <h4 className="font-medium text-gray-900">{kpi.name}</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            kpi.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {kpi.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <input
                            type="checkbox"
                            checked={selectedKPIs.includes(kpi.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedKPIs([...selectedKPIs, kpi.id]);
                              } else {
                                setSelectedKPIs(selectedKPIs.filter(id => id !== kpi.id));
                              }
                            }}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{kpi.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Target: {formatValue(kpi.target, kpi.format)}</span>
                        <span>Current: {formatValue(kpi.currentValue, kpi.format)}</span>
                        <span>Unit: {kpi.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'forecasting' && (
          <div className="space-y-6">
            {/* Forecasting Tools */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Forecasting Tools</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Revenue Forecast</h4>
                  <p className="text-sm text-gray-500 mb-4">Generate 6-month revenue forecast</p>
                  <button
                    onClick={handleGenerateForecast}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'Generate Forecast'}
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Deal Forecast</h4>
                  <p className="text-sm text-gray-500 mb-4">Predict deal closure patterns</p>
                  <button
                    onClick={() => generateForecast(organizationId, 'deals', 'monthly', 3)}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Generate Deal Forecast
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'realtime' && (
          <div className="space-y-6">
            {/* Real-time Metrics */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Real-time Metrics</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {realTimeMetrics.map((metric) => (
                    <div key={metric.id} className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-3xl font-bold text-gray-900">{metric.value.toLocaleString()}</p>
                      <p className="text-sm text-gray-500 capitalize">{metric.metricName.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Last updated: {new Date(metric.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'queries' && (
          <div className="space-y-6">
            {/* Analytics Queries */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Analytics Queries</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Sales Performance</h4>
                    <p className="text-sm text-gray-500 mb-4">Analyze sales performance by user</p>
                    <button
                      onClick={handleExecuteQuery}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? 'Executing...' : 'Execute Query'}
                    </button>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Conversion Funnel</h4>
                    <p className="text-sm text-gray-500 mb-4">Analyze conversion funnel stages</p>
                    <button
                      onClick={() => executeAnalyticsQuery('conversion_funnel', {}, organizationId, userId)}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      Execute Query
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Executive Reports */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Executive Reports</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Monthly Report</h4>
                    <p className="text-sm text-gray-500 mb-4">Generate comprehensive monthly report</p>
                    <button
                      onClick={() => generateExecutiveReport(organizationId, 'monthly', new Date())}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Generate Report
                    </button>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Quarterly Report</h4>
                    <p className="text-sm text-gray-500 mb-4">Generate quarterly performance report</p>
                    <button
                      onClick={() => generateExecutiveReport(organizationId, 'quarterly', new Date())}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      Generate Report
                    </button>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Yearly Report</h4>
                    <p className="text-sm text-gray-500 mb-4">Generate annual performance report</p>
                    <button
                      onClick={() => generateExecutiveReport(organizationId, 'yearly', new Date())}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50"
                    >
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Dashboard Modal */}
        {showCreateDashboardModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Create Analytics Dashboard
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dashboard Name
                    </label>
                    <input
                      type="text"
                      value={dashboardForm.name || ''}
                      onChange={(e) => setDashboardForm({...dashboardForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter dashboard name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dashboard Type
                    </label>
                    <select
                      value={dashboardForm.type || ''}
                      onChange={(e) => setDashboardForm({...dashboardForm, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select dashboard type</option>
                      <option value="executive">Executive</option>
                      <option value="operational">Operational</option>
                      <option value="compliance">Compliance</option>
                      <option value="custom">Custom</option>
                      <option value="real_time">Real-time</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select KPIs ({selectedKPIs.length} selected)
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {kpis.map((kpi) => (
                        <label key={kpi.id} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedKPIs.includes(kpi.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedKPIs([...selectedKPIs, kpi.id]);
                              } else {
                                setSelectedKPIs(selectedKPIs.filter(id => id !== kpi.id));
                              }
                            }}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <span>{kpi.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateDashboardModal(false);
                      setDashboardForm({});
                      setSelectedKPIs([]);
                    }}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateDashboard}
                    disabled={loading || !dashboardForm.name || !dashboardForm.type || selectedKPIs.length === 0}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Dashboard'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
