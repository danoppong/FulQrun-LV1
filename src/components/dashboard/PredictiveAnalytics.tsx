// src/components/dashboard/PredictiveAnalytics.tsx
// Predictive Analytics Dashboard for Phase 2.7 Implementation
// AI-powered forecasting and scenario analysis for pharmaceutical data

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  Brain,
  Target,
  BarChart3,
  CheckCircle,
  RefreshCw,
  Download,
  Settings,
  Zap,
  Activity,
  LineChart
} from 'lucide-react';
import { PredictiveResult, PredictiveModel, PharmaData } from '@/lib/types/ai-insights';

interface PredictiveAnalyticsProps {
  organizationId: string;
  userId: string;
  timeframe?: string;
  filters?: {
    territories?: string[];
    products?: string[];
    segments?: string[];
  };
}

interface ModelPerformance {
  model_id: string;
  accuracy: number;
  precision: number;
  recall: number;
  lastUpdated: string;
  predictions: number;
}

export function PredictiveAnalytics({
  organizationId: _organizationId,
  userId: _userId,
  timeframe: _timeframe = '30_days',
  filters = {}
}: PredictiveAnalyticsProps) {
  const [predictions, setPredictions] = useState<PredictiveResult[]>([]);
  const [models, setModels] = useState<PredictiveModel[]>([]);
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('trx');
  const [_selectedModel, _setSelectedModel] = useState('trx_model_default');
  const [selectedView, setSelectedView] = useState<'predictions' | 'models' | 'scenarios' | 'performance'>('predictions');
  const [predictionHorizon, setPredictionHorizon] = useState('7_days');

  // Generate mock pharmaceutical data
  const _generateMockData = useCallback((): PharmaData[] => {
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

  // Load predictions and models
  const loadPredictiveData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Mock predictive models
      const mockModels: PredictiveModel[] = [
        {
          id: 'trx_model_default',
          name: 'TRx Forecast Model',
          type: 'time_series',
          purpose: 'forecasting',
          target_metric: 'trx',
          features: ['historical_trx', 'seasonal_trends', 'call_frequency', 'market_conditions'],
          performance: {
            accuracy: 0.87,
            precision: 0.83,
            recall: 0.89,
            f1_score: 0.86,
            rmse: 45.2,
            mape: 32.1
          },
          training_data: {
            records: 5000,
            timespan: '2 years',
            last_updated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            data_quality: 0.92
          },
          predictions: [],
          metadata: {
            algorithm_version: '1.2.0',
            training_duration: 3600,
            last_trained: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            next_training: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          }
        },
        {
          id: 'market_share_model',
          name: 'Market Share Predictor',
          type: 'ensemble',
          purpose: 'forecasting',
          target_metric: 'market_share',
          features: ['competitive_activity', 'promotional_spend', 'hcp_engagement', 'seasonal_factors'],
          performance: {
            accuracy: 0.79,
            precision: 0.76,
            recall: 0.82,
            f1_score: 0.79,
            rmse: 1.8,
            mape: 1.2
          },
          training_data: {
            records: 3500,
            timespan: '18 months',
            last_updated: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            data_quality: 0.88
          },
          predictions: [],
          metadata: {
            algorithm_version: '2.1.0',
            training_duration: 5400,
            last_trained: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            next_training: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          }
        }
      ];
      setModels(mockModels);

      // Generate mock predictions (not using AI engine for now)
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

      // Mock model performance data
      const mockPerformance: ModelPerformance[] = [
        {
          model_id: 'trx_model_default',
          accuracy: 0.87,
          precision: 0.83,
          recall: 0.89,
          lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          predictions: 156
        },
        {
          model_id: 'market_share_model',
          accuracy: 0.79,
          precision: 0.76,
          recall: 0.82,
          lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          predictions: 89
        }
      ];
      setModelPerformance(mockPerformance);

    } catch (error) {
      console.error('Error loading predictive data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPredictiveData();
  }, [loadPredictiveData]);

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'trx': return '💊';
      case 'nrx': return '🆕';
      case 'market_share': return '📊';
      case 'revenue': return '💰';
      default: return '📈';
    }
  };

  const getModelTypeIcon = (type: string) => {
    switch (type) {
      case 'time_series': return <TrendingUp className="h-4 w-4" />;
      case 'ensemble': return <BarChart3 className="h-4 w-4" />;
      case 'neural_network': return <Brain className="h-4 w-4" />;
      case 'linear_regression': return <LineChart className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'training':
        return <Badge className="bg-blue-100 text-blue-800">Training</Badge>;
      case 'deprecated':
        return <Badge className="bg-gray-100 text-gray-800">Deprecated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.85) return 'bg-green-500';
    if (accuracy >= 0.75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Predictive Analytics</h1>
            <p className="text-gray-600">AI-powered forecasting and scenario analysis</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trx">💊 TRx</SelectItem>
              <SelectItem value="nrx">🆕 NRx</SelectItem>
              <SelectItem value="market_share">📊 Market Share</SelectItem>
              <SelectItem value="revenue">💰 Revenue</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadPredictiveData} disabled={isLoading}>
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
                <p className="text-sm font-medium text-gray-600">Active Models</p>
                <p className="text-2xl font-bold">{models.filter(m => m.metadata.status === 'active').length}</p>
              </div>
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Predictions Today</p>
                <p className="text-2xl font-bold">
                  {modelPerformance.reduce((sum, p) => sum + p.predictions, 0)}
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
                <p className="text-sm font-medium text-gray-600">Avg Accuracy</p>
                <p className="text-2xl font-bold">
                  {(modelPerformance.reduce((sum, p) => sum + p.accuracy, 0) / modelPerformance.length * 100).toFixed(0)}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Confidence</p>
                <p className="text-2xl font-bold">
                  {predictions.filter(p => p.confidence_interval.confidence_level >= 0.8).length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as typeof selectedView)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictions" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Predictions</span>
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Models</span>
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Scenarios</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Forecast Results</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select value={predictionHorizon} onValueChange={setPredictionHorizon}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7_days">7 Days</SelectItem>
                      <SelectItem value="14_days">14 Days</SelectItem>
                      <SelectItem value="30_days">30 Days</SelectItem>
                      <SelectItem value="90_days">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.map((prediction) => (
                  <Card key={prediction.id} className="border-blue-200 bg-blue-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getMetricIcon(selectedMetric)}</span>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {selectedMetric.toUpperCase()} Prediction
                            </h3>
                            <p className="text-gray-600">
                              Forecast for {new Date(prediction.target_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {prediction.predicted_value.toLocaleString()}
                          </div>
                          <Badge className={getConfidenceColor(prediction.confidence_interval.confidence_level)}>
                            {(prediction.confidence_interval.confidence_level * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                      </div>

                      {/* Confidence Interval */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-600">
                            {prediction.confidence_interval.lower.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">Lower bound</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">
                            {prediction.predicted_value.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">Predicted</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-600">
                            {prediction.confidence_interval.upper.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">Upper bound</div>
                        </div>
                      </div>

                      {/* Contributing Factors */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Key Factors</h4>
                        {prediction.contributing_factors.map((factor) => (
                          <div key={factor.factor} className="flex items-center justify-between">
                            <span className="text-sm">{factor.factor}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${factor.importance * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 w-8">
                                {(factor.importance * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Scenarios */}
                      {prediction.scenarios && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-2">Scenarios</h4>
                          <div className="grid grid-cols-3 gap-2">
                            {prediction.scenarios.map((scenario) => (
                              <div key={scenario.name} className="text-center p-2 bg-white rounded">
                                <div className="text-sm font-medium">{scenario.name}</div>
                                <div className="text-lg font-bold text-blue-600">
                                  {scenario.predicted_value.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {(scenario.probability * 100).toFixed(0)}% likely
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="space-y-4">
            {models.map((model) => (
              <Card key={model.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getModelTypeIcon(model.type)}
                      <div>
                        <h3 className="font-semibold text-lg">{model.name}</h3>
                        <p className="text-gray-600">
                          {model.type} model for {model.target_metric}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(model.metadata.status)}
                      <Badge variant="outline">v{model.metadata.algorithm_version}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="text-xs text-gray-500">Accuracy</span>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={model.performance.accuracy * 100} 
                          className="flex-1"
                        />
                        <span className="text-sm font-medium">
                          {(model.performance.accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Precision</span>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={model.performance.precision * 100} 
                          className="flex-1"
                        />
                        <span className="text-sm font-medium">
                          {(model.performance.precision * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Recall</span>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={model.performance.recall * 100} 
                          className="flex-1"
                        />
                        <span className="text-sm font-medium">
                          {(model.performance.recall * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Last Trained</span>
                      <div className="text-sm font-medium">
                        {new Date(model.metadata.last_trained).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Features ({model.features.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {model.features.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    <Button size="sm" variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Performance
                    </Button>
                    <Button size="sm" variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retrain
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>What-If Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {predictions.filter(p => p.scenarios).map((prediction) => (
                  <div key={prediction.id} className="space-y-4">
                    <h3 className="font-semibold text-lg">
                      {selectedMetric.toUpperCase()} Scenarios
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {prediction.scenarios?.map((scenario) => (
                        <Card key={scenario.name} className={
                          scenario.name === 'Optimistic' ? 'border-green-200 bg-green-50' :
                          scenario.name === 'Pessimistic' ? 'border-red-200 bg-red-50' :
                          'border-blue-200 bg-blue-50'
                        }>
                          <CardContent className="p-6 text-center">
                            <div className="mb-2">
                              {scenario.name === 'Optimistic' && <TrendingUp className="h-8 w-8 mx-auto text-green-600" />}
                              {scenario.name === 'Pessimistic' && <TrendingDown className="h-8 w-8 mx-auto text-red-600" />}
                              {scenario.name === 'Expected' && <Target className="h-8 w-8 mx-auto text-blue-600" />}
                            </div>
                            <h4 className="font-semibold text-lg mb-1">{scenario.name}</h4>
                            <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                            <div className="text-2xl font-bold mb-2">
                              {scenario.predicted_value.toLocaleString()}
                            </div>
                            <Badge variant="outline">
                              {(scenario.probability * 100).toFixed(0)}% probability
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modelPerformance.map((perf) => {
              const model = models.find(m => m.id === perf.model_id);
              return (
                <Card key={perf.model_id}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {model && getModelTypeIcon(model.type)}
                      <span>{model?.name || perf.model_id}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Accuracy</span>
                          <div className="flex items-center space-x-2">
                            <Progress 
                              value={perf.accuracy * 100} 
                              className="flex-1"
                            />
                            <span className="text-sm font-bold">
                              {(perf.accuracy * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Precision</span>
                          <div className="flex items-center space-x-2">
                            <Progress 
                              value={perf.precision * 100} 
                              className="flex-1"
                            />
                            <span className="text-sm font-bold">
                              {(perf.precision * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Predictions Made</span>
                          <div className="text-lg font-bold">{perf.predictions}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Last Updated</span>
                          <div className="text-sm">
                            {new Date(perf.lastUpdated).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getAccuracyColor(perf.accuracy)}`} />
                          <span className="text-sm">
                            {perf.accuracy >= 0.85 ? 'Excellent' : 
                             perf.accuracy >= 0.75 ? 'Good' : 'Needs Improvement'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}