// src/components/dashboard/AIInsightsDashboard.tsx
// AI-Powered Insights Dashboard for Phase 2.7 Implementation
// Intelligent pharmaceutical insights with recommendations and alerts

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Lightbulb,
  Bell,
  Settings,
  RefreshCw,
  CheckCircle,
  ArrowRight,
  Star,
  Eye,
  BarChart3
} from 'lucide-react';
import { aiInsightEngine } from '@/lib/ai/ai-insights-engine';
import { 
  AIInsight, 
  SmartAlert, 
  PredictiveResult,
  PharmaData,
  AnalysisContext
} from '@/lib/types/ai-insights';

interface AIInsightsDashboardProps {
  organizationId: string;
  userId: string;
  timeframe?: string;
  filters?: {
    territories?: string[];
    products?: string[];
    segments?: string[];
  };
}

interface InsightFilters {
  categories: string[];
  severity: string[];
  types: string[];
  acknowledged: 'all' | 'acknowledged' | 'unacknowledged';
}

export function AIInsightsDashboard({
  organizationId,
  userId,
  timeframe = '30_days',
  filters = {}
}: AIInsightsDashboardProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [predictions, setPredictions] = useState<PredictiveResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedView, setSelectedView] = useState<'insights' | 'alerts' | 'predictions' | 'settings'>('insights');
  const [insightFilters, setInsightFilters] = useState<InsightFilters>({
    categories: ['all'],
    severity: ['all'],
    types: ['all'],
    acknowledged: 'unacknowledged'
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5); // minutes

  // Generate mock pharmaceutical data for demonstration
  const generateMockData = useCallback((): PharmaData[] => {
    const data: PharmaData[] = [];
    const days = 30;
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - days);

    for (let i = 0; i < days; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        territory: filters.territories?.[0] || 'North',
        product: filters.products?.[0] || 'Product-A',
        trx: 1000 + (i * 15) + (Math.random() - 0.5) * 200,
        nrx: 200 + (i * 3) + (Math.random() - 0.5) * 40,
        market_share: 15 + Math.sin(i / 7) * 2 + (Math.random() - 0.5) * 1,
        calls: Math.floor(Math.random() * 10) + 5,
        samples: Math.floor(Math.random() * 50) + 20
      });
    }

    return data;
  }, [filters]);

  // Load AI insights
  const loadInsights = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const mockData = generateMockData();
      const context: AnalysisContext = {
        timeframe,
        filters,
        user_id: userId,
        organization_id: organizationId
      };

      const generatedInsights = await aiInsightEngine.generateInsights(mockData, context);
      setInsights(generatedInsights);

      // Generate mock alerts
      const mockAlerts: SmartAlert[] = [
        {
          id: 'alert_trx_decline_001',
          name: 'TRx Decline Alert',
          description: 'Alert when TRx drops below threshold',
          trigger: {
            metric: 'trx',
            condition: 'less_than',
            threshold: 950,
            timeframe: 'daily'
          },
          filters: {},
          notification: {
            channels: ['dashboard', 'email'],
            recipients: [userId],
            template: 'trx_decline_alert',
            frequency: 'immediate'
          },
          actions: {
            suggested_actions: [
              {
                id: 'investigate_decline',
                type: 'navigate',
                label: 'Investigate Decline',
                target: { type: 'dashboard', value: '/phase-26-analytics' }
              }
            ]
          },
          status: 'active',
          history: [],
          metadata: {
            created_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            priority: 1,
            tags: ['performance', 'trx']
          }
        }
      ];
      setAlerts(mockAlerts);

      // Generate mock predictions
      const mockPredictions: PredictiveResult[] = [
        {
          id: 'pred_trx_001',
          model_id: 'trx_model_default',
          prediction_date: new Date().toISOString(),
          target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          predicted_value: 1150,
          confidence_interval: {
            lower: 1050,
            upper: 1250,
            confidence_level: 0.85
          },
          contributing_factors: [
            { factor: 'Historical Trend', impact: 0.6, importance: 0.8 },
            { factor: 'Seasonal Pattern', impact: 0.2, importance: 0.6 },
            { factor: 'Market Conditions', impact: 0.2, importance: 0.7 }
          ],
          scenarios: [
            { name: 'Optimistic', description: 'Best case scenario', probability: 0.2, predicted_value: 1200 },
            { name: 'Expected', description: 'Most likely outcome', probability: 0.6, predicted_value: 1150 },
            { name: 'Pessimistic', description: 'Conservative estimate', probability: 0.2, predicted_value: 1100 }
          ]
        }
      ];
      setPredictions(mockPredictions);

    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setIsLoading(false);
    }
  }, [generateMockData, timeframe, filters, userId, organizationId]);

  // Auto-refresh effect
  useEffect(() => {
    loadInsights();

    if (autoRefresh) {
      const interval = setInterval(loadInsights, refreshInterval * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [loadInsights, autoRefresh, refreshInterval]);

  // Filter insights based on current filters
  const filteredInsights = insights.filter(insight => {
    if (insightFilters.categories.includes('all') || insightFilters.categories.includes(insight.category)) {
      if (insightFilters.severity.includes('all') || insightFilters.severity.includes(insight.severity)) {
        if (insightFilters.types.includes('all') || insightFilters.types.includes(insight.type)) {
          if (insightFilters.acknowledged === 'all') return true;
          if (insightFilters.acknowledged === 'acknowledged') return insight.actions.acknowledged;
          if (insightFilters.acknowledged === 'unacknowledged') return !insight.actions.acknowledged;
        }
      }
    }
    return false;
  });

  const handleInsightAction = (insight: AIInsight, action: { type: string; label: string; target: { type: string; value: string } }) => {
    console.log('Executing insight action:', { insight: insight.id, action });
    // Handle insight action execution
  };

  const handleAcknowledgeInsight = async (insightId: string) => {
    setInsights(prev => prev.map(insight => 
      insight.id === insightId 
        ? { 
            ...insight, 
            actions: { 
              ...insight.actions, 
              acknowledged: true, 
              acknowledgedBy: userId,
              acknowledgedAt: new Date().toISOString()
            }
          }
        : insight
    ));
  };

  const handleFilterChange = (filterType: keyof InsightFilters, value: string | string[]) => {
    setInsightFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="h-5 w-5" />;
      case 'prediction': return <TrendingUp className="h-5 w-5" />;
      case 'recommendation': return <Lightbulb className="h-5 w-5" />;
      case 'opportunity': return <Target className="h-5 w-5" />;
      case 'risk': return <AlertTriangle className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getInsightColor = (severity: string, type: string) => {
    if (severity === 'critical') return 'border-red-500 bg-red-50';
    if (severity === 'high') return 'border-orange-500 bg-orange-50';
    if (severity === 'medium') return 'border-yellow-500 bg-yellow-50';
    if (type === 'opportunity') return 'border-green-500 bg-green-50';
    return 'border-blue-500 bg-blue-50';
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
            <p className="text-gray-600">Intelligent pharmaceutical analytics and recommendations</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <span className="text-sm text-gray-600">Auto-refresh</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadInsights} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Insights</p>
                <p className="text-2xl font-bold">{filteredInsights.length}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold">
                  {filteredInsights.filter(i => i.priority <= 2).length}
                </p>
              </div>
              <Star className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Opportunities</p>
                <p className="text-2xl font-bold">
                  {filteredInsights.filter(i => i.type === 'opportunity').length}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold">{alerts.filter(a => a.status === 'active').length}</p>
              </div>
              <Bell className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as typeof selectedView)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Insights</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Smart Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Predictions</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <Select 
                    value={insightFilters.categories[0]} 
                    onValueChange={(value) => handleFilterChange('categories', [value])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="territory">Territory</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="market">Market</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Severity</label>
                  <Select 
                    value={insightFilters.severity[0]} 
                    onValueChange={(value) => handleFilterChange('severity', [value])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Type</label>
                  <Select 
                    value={insightFilters.types[0]} 
                    onValueChange={(value) => handleFilterChange('types', [value])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="alert">Alerts</SelectItem>
                      <SelectItem value="prediction">Predictions</SelectItem>
                      <SelectItem value="recommendation">Recommendations</SelectItem>
                      <SelectItem value="opportunity">Opportunities</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <Select 
                    value={insightFilters.acknowledged} 
                    onValueChange={(value) => handleFilterChange('acknowledged', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="unacknowledged">Unacknowledged</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insights List */}
          <div className="space-y-4">
            {filteredInsights.map((insight) => (
              <Card 
                key={insight.id} 
                className={`transition-all hover:shadow-md ${getInsightColor(insight.severity, insight.type)}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex items-center space-x-2">
                        {getInsightIcon(insight.type)}
                        <Badge className={getSeverityBadgeColor(insight.severity)}>
                          {insight.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Priority {insight.priority}
                        </Badge>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-lg">{insight.title}</h3>
                          {insight.actions.acknowledged && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{insight.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <span className="text-xs text-gray-500">Confidence</span>
                            <div className="text-sm font-medium">
                              {(insight.confidence * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Impact</span>
                            <div className={`text-sm font-medium ${
                              insight.impact === 'positive' ? 'text-green-600' :
                              insight.impact === 'negative' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {insight.impact}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Urgency</span>
                            <div className="text-sm font-medium">{insight.urgency}</div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Category</span>
                            <div className="text-sm font-medium">{insight.category}</div>
                          </div>
                        </div>

                        {/* Recommendations */}
                        {insight.recommendations.length > 0 && (
                          <div className="bg-blue-50 p-4 rounded-lg mb-4">
                            <h4 className="font-medium text-blue-900 mb-2">
                              💡 Recommendations
                            </h4>
                            {insight.recommendations.map((rec, index) => (
                              <div key={rec.id} className="mb-2 last:mb-0">
                                <div className="text-sm font-medium text-blue-800">
                                  {index + 1}. {rec.title}
                                </div>
                                <div className="text-sm text-blue-700">
                                  {rec.description}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      {insight.actions.primaryAction && (
                        <Button
                          size="sm"
                          onClick={() => handleInsightAction(insight, insight.actions.primaryAction)}
                        >
                          {insight.actions.primaryAction.label}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                      
                      {!insight.actions.acknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcknowledgeInsight(insight.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Acknowledge
                        </Button>
                      )}
                      
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredInsights.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No insights found</h3>
                  <p className="text-gray-600">
                    {isLoading ? 'Loading insights...' : 'No insights match the current filters.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className="border-orange-200 bg-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-6 w-6 text-orange-600" />
                      <div>
                        <h3 className="font-semibold text-lg">{alert.name}</h3>
                        <p className="text-gray-600">{alert.description}</p>
                      </div>
                    </div>
                    <Badge className={
                      alert.status === 'active' ? 'bg-green-100 text-green-800' :
                      alert.status === 'triggered' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {alert.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="text-xs text-gray-500">Metric</span>
                      <div className="text-sm font-medium">{alert.trigger.metric}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Condition</span>
                      <div className="text-sm font-medium">{alert.trigger.condition}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Threshold</span>
                      <div className="text-sm font-medium">{alert.trigger.threshold}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Frequency</span>
                      <div className="text-sm font-medium">{alert.notification.frequency}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    <Button size="sm" variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <Card key={prediction.id} className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-lg">TRx Prediction</h3>
                        <p className="text-gray-600">
                          Predicted for {new Date(prediction.target_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {prediction.predicted_value.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {(prediction.confidence_interval.confidence_level * 100).toFixed(0)}% confidence
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {prediction.confidence_interval.lower.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Lower bound</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {prediction.predicted_value.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Predicted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {prediction.confidence_interval.upper.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Upper bound</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Contributing Factors</h4>
                    {prediction.contributing_factors.map((factor) => (
                      <div key={factor.factor} className="flex items-center justify-between">
                        <span className="text-sm">{factor.factor}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${factor.importance * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">
                            {(factor.importance * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Insights Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Auto-refresh Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enable auto-refresh</span>
                    <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Refresh interval (minutes)</label>
                    <Select 
                      value={refreshInterval.toString()} 
                      onValueChange={(value) => setRefreshInterval(parseInt(value))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 minute</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Notification Preferences</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email notifications</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dashboard notifications</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">High priority alerts only</span>
                    <Switch />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">AI Model Preferences</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Advanced predictions</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Anomaly detection</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Opportunity identification</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}