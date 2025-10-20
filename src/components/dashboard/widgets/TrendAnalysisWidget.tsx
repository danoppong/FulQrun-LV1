// src/components/dashboard/widgets/TrendAnalysisWidget.tsx
// Advanced Trend Analysis Widget for Phase 2.6 Implementation
// Comprehensive trend visualization with forecasting and anomaly detection

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  RefreshCw, 
  Zap,
  Target
} from 'lucide-react';
import { analyticalEngine } from '@/lib/analytics/analytical-engine';
import { TrendAnalysis, TrendDataPoint, AnalyticalInsight } from '@/lib/types/analytics';

interface TrendAnalysisWidgetProps {
  metric: string;
  title: string;
  data: TrendDataPoint[];
  organizationId?: string;
  height?: number;
  showControls?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onInsightClick?: (insight: AnalyticalInsight) => void;
}

interface TrendConfig {
  showForecast: boolean;
  showAnomalies: boolean;
  showTrendLine: boolean;
  showConfidenceBands: boolean;
  forecastPeriods: number;
  granularity: 'daily' | 'weekly' | 'monthly';
  algorithm: 'linear' | 'exponential' | 'seasonal';
}

export function TrendAnalysisWidget({
  metric,
  title,
  data: initialData,
  organizationId: _organizationId,
  height = 400,
  showControls = true,
  autoRefresh = false,
  refreshInterval = 15,
  onInsightClick
}: TrendAnalysisWidgetProps) {
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<TrendConfig>({
    showForecast: true,
    showAnomalies: true,
    showTrendLine: true,
    showConfidenceBands: true,
    forecastPeriods: 7,
    granularity: 'daily',
    algorithm: 'linear'
  });
  const [selectedView, setSelectedView] = useState<'chart' | 'insights' | 'forecast'>('chart');

  // Calculate trend analysis
  const calculateTrendAnalysis = useCallback(async () => {
    if (!initialData.length) return;

    setIsLoading(true);
    setError(null);

    try {
      const analysis = await analyticalEngine.analyzeTrend(initialData, metric, {
        detectSeasonality: true,
        detectAnomalies: config.showAnomalies,
        generateForecast: config.showForecast,
        forecastPeriods: config.forecastPeriods
      });

      setTrendAnalysis(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze trend');
      console.error('Trend analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [initialData, metric, config.showAnomalies, config.showForecast, config.forecastPeriods]);

  // Auto-refresh effect
  useEffect(() => {
    calculateTrendAnalysis();

    if (autoRefresh) {
      const interval = setInterval(calculateTrendAnalysis, refreshInterval * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [calculateTrendAnalysis, autoRefresh, refreshInterval]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!trendAnalysis) return [];

    const historicalData = trendAnalysis.data.map(point => ({
      date: new Date(point.date).toLocaleDateString(),
      actual: point.value,
      anomaly: point.anomaly,
      confidence: point.confidence || 1
    }));

    if (config.showForecast && trendAnalysis.forecast?.data) {
      const forecastData = trendAnalysis.forecast.data.map(point => ({
        date: new Date(point.date).toLocaleDateString(),
        forecast: point.value,
        confidence: point.confidence || 0.8,
        upper: point.value * 1.2,
        lower: point.value * 0.8
      }));

      return [...historicalData, ...forecastData];
    }

    return historicalData;
  }, [trendAnalysis, config.showForecast]);

  // Get trend direction icon and color
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'upward':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'downward':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'volatile':
        return <Activity className="h-4 w-4 text-orange-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'upward':
        return 'text-green-600 bg-green-50';
      case 'downward':
        return 'text-red-600 bg-red-50';
      case 'volatile':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleConfigChange = (key: keyof TrendConfig, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleInsightClick = (insight: AnalyticalInsight) => {
    if (onInsightClick) {
      onInsightClick(insight);
    }
  };

  const refreshAnalysis = () => {
    calculateTrendAnalysis();
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32 text-red-600">
            <AlertTriangle className="h-8 w-8 mr-2" />
            <span>Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {trendAnalysis && (
              <div className="flex items-center space-x-2">
                {getTrendIcon(trendAnalysis.trend)}
                <Badge className={getTrendColor(trendAnalysis.trend)}>
                  {trendAnalysis.trend} ({(trendAnalysis.trendStrength * 100).toFixed(1)}%)
                </Badge>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {trendAnalysis?.seasonality.detected && (
              <Badge variant="outline" className="text-blue-600">
                <Zap className="h-3 w-3 mr-1" />
                {trendAnalysis.seasonality.pattern}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAnalysis}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as 'chart' | 'insights' | 'forecast')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chart">Chart View</TabsTrigger>
            <TabsTrigger value="insights">
              Insights ({trendAnalysis?.insights.length || 0})
            </TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-4">
            {showControls && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.showForecast}
                    onCheckedChange={(checked) => handleConfigChange('showForecast', checked)}
                  />
                  <Label className="text-sm">Forecast</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.showAnomalies}
                    onCheckedChange={(checked) => handleConfigChange('showAnomalies', checked)}
                  />
                  <Label className="text-sm">Anomalies</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.showTrendLine}
                    onCheckedChange={(checked) => handleConfigChange('showTrendLine', checked)}
                  />
                  <Label className="text-sm">Trend Line</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.showConfidenceBands}
                    onCheckedChange={(checked) => handleConfigChange('showConfidenceBands', checked)}
                  />
                  <Label className="text-sm">Confidence</Label>
                </div>
              </div>
            )}

            <div style={{ height }}>
              <ResponsiveContainer width="100%" height="100%">
                {config.showConfidenceBands && config.showForecast ? (
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    
                    {/* Confidence bands */}
                    <Area
                      dataKey="upper"
                      stackId="confidence"
                      stroke="none"
                      fill="#3b82f6"
                      fillOpacity={0.1}
                      name="Upper Confidence"
                    />
                    <Area
                      dataKey="lower"
                      stackId="confidence"
                      stroke="none"
                      fill="#ffffff"
                      fillOpacity={1}
                      name="Lower Confidence"
                    />
                    
                    {/* Actual data line */}
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#1f2937"
                      strokeWidth={2}
                      dot={{ fill: '#1f2937', r: 4 }}
                      name="Actual"
                    />
                    
                    {/* Forecast line */}
                    {config.showForecast && (
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#3b82f6', r: 4 }}
                        name="Forecast"
                      />
                    )}
                  </AreaChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    
                    {/* Actual data line */}
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#1f2937"
                      strokeWidth={2}
                      dot={config.showAnomalies}
                      name="Actual"
                    />
                    
                    {/* Forecast line */}
                    {config.showForecast && (
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#3b82f6', r: 4 }}
                        name="Forecast"
                      />
                    )}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            {trendAnalysis?.insights.map((insight) => (
              <Card 
                key={insight.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  insight.severity === 'high' ? 'border-red-200 bg-red-50' :
                  insight.severity === 'medium' ? 'border-orange-200 bg-orange-50' :
                  'border-blue-200 bg-blue-50'
                }`}
                onClick={() => handleInsightClick(insight)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge 
                          variant={insight.severity === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {insight.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {(insight.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                      {insight.recommendation && (
                        <p className="text-sm text-blue-600 italic">
                          💡 {insight.recommendation}
                        </p>
                      )}
                    </div>
                    {insight.actionRequired && (
                      <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {!trendAnalysis?.insights.length && (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No insights available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="forecast" className="space-y-4">
            {trendAnalysis?.forecast ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {trendAnalysis.forecast.periods}
                      </div>
                      <div className="text-sm text-gray-600">Forecast Periods</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(trendAnalysis.forecast.accuracy * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Accuracy</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {trendAnalysis.forecast.data[trendAnalysis.forecast.data.length - 1]?.value.toFixed(0) || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Final Forecast</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Forecast Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Forecast Periods</Label>
                      <Select
                        value={config.forecastPeriods.toString()}
                        onValueChange={(value) => handleConfigChange('forecastPeriods', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Algorithm</Label>
                      <Select
                        value={config.algorithm}
                        onValueChange={(value) => handleConfigChange('algorithm', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear">Linear</SelectItem>
                          <SelectItem value="exponential">Exponential</SelectItem>
                          <SelectItem value="seasonal">Seasonal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Enable forecasting to see predictions</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => handleConfigChange('showForecast', true)}
                >
                  Enable Forecasting
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}