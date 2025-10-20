// src/components/dashboard/widgets/PerformanceComparisonWidget.tsx
// Performance Comparison Widget for Phase 2.6 Implementation
// Advanced performance analysis with period-over-period comparisons

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  Cell
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight,
  Minus,
  AlertTriangle, 
  RefreshCw,
  Target,
  Award,
  Flag
} from 'lucide-react';
import { analyticalEngine } from '@/lib/analytics/analytical-engine';
import { PerformanceComparison, ComparisonMetric } from '@/lib/types/analytics';

interface PerformanceComparisonWidgetProps {
  title: string;
  currentData: number[];
  previousData: number[];
  metric: string;
  comparisonType: 'period' | 'territory' | 'product' | 'peer';
  benchmarkData?: number[];
  height?: number;
  showBenchmark?: boolean;
  onMetricClick?: (metric: ComparisonMetric) => void;
}

interface ComparisonConfig {
  viewType: 'absolute' | 'percentage' | 'both';
  sortBy: 'current' | 'change' | 'name';
  sortOrder: 'asc' | 'desc';
  showBenchmark: boolean;
  highlightSignificant: boolean;
}

export function PerformanceComparisonWidget({
  title,
  currentData,
  previousData,
  metric,
  comparisonType,
  benchmarkData,
  height = 400,
  showBenchmark = false,
  onMetricClick
}: PerformanceComparisonWidgetProps) {
  const [comparison, setComparison] = useState<PerformanceComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ComparisonConfig>({
    viewType: 'both',
    sortBy: 'change',
    sortOrder: 'desc',
    showBenchmark,
    highlightSignificant: true
  });
  const [selectedView, setSelectedView] = useState<'chart' | 'table' | 'insights'>('chart');

  // Calculate performance comparison
  const calculateComparison = useCallback(async () => {
    if (!currentData.length || !previousData.length) return;

    setIsLoading(true);
    setError(null);

    try {
      const performanceComparison = await analyticalEngine.comparePerformance(
        currentData,
        previousData,
        metric,
        comparisonType
      );

      setComparison(performanceComparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate comparison');
      console.error('Performance comparison error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentData, previousData, metric, comparisonType]);

  useEffect(() => {
    calculateComparison();
  }, [calculateComparison]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!comparison?.metrics) return [];

    return comparison.metrics.map((metric, index) => ({
      name: metric.name || `Item ${index + 1}`,
      current: metric.currentValue,
      previous: metric.previousValue,
      change: metric.change,
      changePercent: metric.changePercent,
      benchmark: benchmarkData?.[index] || 0,
      significance: metric.significance,
      trend: metric.trend
    }));
  }, [comparison, benchmarkData]);

  // Sort and filter data
  const sortedData = useMemo(() => {
    const data = [...chartData];
    
    data.sort((a, b) => {
      let aValue, bValue;
      
      switch (config.sortBy) {
        case 'current':
          aValue = a.current;
          bValue = b.current;
          break;
        case 'change':
          aValue = a.changePercent;
          bValue = b.changePercent;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        default:
          aValue = a.changePercent;
          bValue = b.changePercent;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return config.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      const numA = Number(aValue);
      const numB = Number(bValue);
      
      return config.sortOrder === 'asc' ? numA - numB : numB - numA;
    });

    return data;
  }, [chartData, config.sortBy, config.sortOrder]);

  // Get trend icon and color
  const getTrendIcon = (trend: string, size = 'h-4 w-4') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className={`${size} text-green-600`} />;
      case 'down':
        return <ArrowDownRight className={`${size} text-red-600`} />;
      default:
        return <Minus className={`${size} text-gray-600`} />;
    }
  };

  const getChangeColor = (changePercent: number) => {
    if (changePercent > 10) return 'text-green-600 bg-green-50';
    if (changePercent < -10) return 'text-red-600 bg-red-50';
    if (changePercent > 0) return 'text-green-500 bg-green-50';
    if (changePercent < 0) return 'text-red-500 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getBarColor = (changePercent: number, significance: string) => {
    if (config.highlightSignificant && significance === 'high') {
      return changePercent >= 0 ? '#16a34a' : '#dc2626';
    }
    if (significance === 'medium') {
      return changePercent >= 0 ? '#65a30d' : '#ea580c';
    }
    return changePercent >= 0 ? '#84cc16' : '#f97316';
  };

  const handleConfigChange = (key: keyof ComparisonConfig, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleMetricClick = (metric: ComparisonMetric) => {
    if (onMetricClick) {
      onMetricClick(metric);
    }
  };

  const refreshComparison = () => {
    calculateComparison();
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
            {comparison && (
              <Badge className={
                comparison.summary.overallTrend === 'positive' ? 'text-green-600 bg-green-50' :
                comparison.summary.overallTrend === 'negative' ? 'text-red-600 bg-red-50' :
                'text-orange-600 bg-orange-50'
              }>
                {comparison.summary.overallTrend}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshComparison}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium">View Type</label>
              <Select
                value={config.viewType}
                onValueChange={(value) => handleConfigChange('viewType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="absolute">Absolute</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Sort By</label>
              <Select
                value={config.sortBy}
                onValueChange={(value) => handleConfigChange('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Value</SelectItem>
                  <SelectItem value="change">Change %</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Order</label>
              <Select
                value={config.sortOrder}
                onValueChange={(value) => handleConfigChange('sortOrder', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as 'chart' | 'table' | 'insights')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chart">Chart View</TabsTrigger>
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="insights">
                Insights ({comparison?.summary.recommendations.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="space-y-4">
              <div style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={sortedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    {config.viewType !== 'absolute' && <YAxis yAxisId="right" orientation="right" />}
                    <Tooltip />
                    <Legend />
                    
                    {/* Current and Previous Bars */}
                    {(config.viewType === 'absolute' || config.viewType === 'both') && (
                      <>
                        <Bar yAxisId="left" dataKey="current" name="Current" fill="#3b82f6" />
                        <Bar yAxisId="left" dataKey="previous" name="Previous" fill="#94a3b8" />
                        {config.showBenchmark && benchmarkData && (
                          <Bar yAxisId="left" dataKey="benchmark" name="Benchmark" fill="#f59e0b" />
                        )}
                      </>
                    )}
                    
                    {/* Change Percentage */}
                    {(config.viewType === 'percentage' || config.viewType === 'both') && (
                      <Bar yAxisId={config.viewType === 'both' ? 'right' : 'left'} dataKey="changePercent" name="Change %">
                        {sortedData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={getBarColor(entry.changePercent, entry.significance)} 
                          />
                        ))}
                      </Bar>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="table" className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-3 text-left">Metric</th>
                      <th className="border border-gray-200 p-3 text-right">Current</th>
                      <th className="border border-gray-200 p-3 text-right">Previous</th>
                      <th className="border border-gray-200 p-3 text-right">Change</th>
                      <th className="border border-gray-200 p-3 text-right">Change %</th>
                      <th className="border border-gray-200 p-3 text-center">Trend</th>
                      <th className="border border-gray-200 p-3 text-center">Significance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison?.metrics.map((metric) => (
                      <tr 
                        key={metric.id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleMetricClick(metric)}
                      >
                        <td className="border border-gray-200 p-3 font-medium">{metric.name}</td>
                        <td className="border border-gray-200 p-3 text-right">{metric.currentValue.toLocaleString()}</td>
                        <td className="border border-gray-200 p-3 text-right">{metric.previousValue.toLocaleString()}</td>
                        <td className="border border-gray-200 p-3 text-right">
                          <span className={metric.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {metric.change >= 0 ? '+' : ''}{metric.change.toLocaleString()}
                          </span>
                        </td>
                        <td className="border border-gray-200 p-3 text-right">
                          <Badge className={getChangeColor(metric.changePercent)}>
                            {metric.changePercent >= 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="border border-gray-200 p-3 text-center">
                          {getTrendIcon(metric.trend)}
                        </td>
                        <td className="border border-gray-200 p-3 text-center">
                          <Badge 
                            variant={metric.significance === 'high' ? 'destructive' : metric.significance === 'medium' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {metric.significance}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              {comparison?.summary && (
                <div className="space-y-4">
                  {/* Key Wins */}
                  {comparison.summary.keyWins.length > 0 && (
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Award className="h-5 w-5 text-green-600" />
                          <h4 className="font-medium text-green-900">Key Wins</h4>
                        </div>
                        <ul className="space-y-1">
                          {comparison.summary.keyWins.map((win, index) => (
                            <li key={index} className="text-sm text-green-800">• {win}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Key Opportunities */}
                  {comparison.summary.keyOpportunities.length > 0 && (
                    <Card className="border-orange-200 bg-orange-50">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Flag className="h-5 w-5 text-orange-600" />
                          <h4 className="font-medium text-orange-900">Areas for Improvement</h4>
                        </div>
                        <ul className="space-y-1">
                          {comparison.summary.keyOpportunities.map((opportunity, index) => (
                            <li key={index} className="text-sm text-orange-800">• {opportunity}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommendations */}
                  {comparison.summary.recommendations.length > 0 && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          <h4 className="font-medium text-blue-900">Recommendations</h4>
                        </div>
                        <ul className="space-y-1">
                          {comparison.summary.recommendations.map((recommendation, index) => (
                            <li key={index} className="text-sm text-blue-800">• {recommendation}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {!comparison?.summary && (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No insights available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}