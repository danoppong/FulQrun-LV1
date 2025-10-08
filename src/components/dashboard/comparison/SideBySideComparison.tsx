// src/components/dashboard/comparison/SideBySideComparison.tsx
// Side-by-Side Comparison Component for pharmaceutical analytics
// Provides visual comparison of different filter combinations or time periods

'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  Award, 
  AlertTriangle,
  BarChart3,
  Eye,
  Download
} from 'lucide-react';
import { 
  ComparisonDatasetResult, 
  ComparisonMetric, 
  BenchmarkConfiguration 
} from '@/lib/types/comparison';

interface SideBySideComparisonProps {
  datasets: ComparisonDatasetResult[];
  metrics: string[];
  benchmarks?: BenchmarkConfiguration[];
  showBenchmarks?: boolean;
  onDatasetSelect?: (datasetId: string) => void;
  onExport?: () => void;
  className?: string;
}

interface MetricCardProps {
  metric: ComparisonMetric;
  datasetColor: string;
  benchmark?: number;
  showBenchmark: boolean;
  rank?: number;
  isHighlighted?: boolean;
}

function MetricCard({ 
  metric, 
  datasetColor, 
  benchmark, 
  showBenchmark, 
  rank,
  isHighlighted = false 
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatValue = (value: number): string => {
    switch (metric.format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'ratio':
        return value.toFixed(2);
      default:
        return value.toLocaleString();
    }
  };

  const formatChange = (change: number, changePercent: number): string => {
    const sign = change >= 0 ? '+' : '';
    const changeText = metric.format === 'percentage' 
      ? `${sign}${change.toFixed(1)}pp`
      : `${sign}${changePercent.toFixed(1)}%`;
    return changeText;
  };

  const getBenchmarkStatus = (): { icon: React.ReactNode; color: string; text: string } | null => {
    if (!showBenchmark || !benchmark) return null;
    
    const deviation = ((metric.value - benchmark) / benchmark) * 100;
    
    if (Math.abs(deviation) < 5) {
      return {
        icon: <Target className="h-3 w-3" />,
        color: 'text-green-600',
        text: 'On target'
      };
    } else if (deviation > 5) {
      return {
        icon: <Award className="h-3 w-3" />,
        color: 'text-blue-600',
        text: `+${deviation.toFixed(1)}% vs benchmark`
      };
    } else {
      return {
        icon: <AlertTriangle className="h-3 w-3" />,
        color: 'text-red-600',
        text: `${deviation.toFixed(1)}% vs benchmark`
      };
    }
  };

  const benchmarkStatus = getBenchmarkStatus();

  return (
    <div className={`bg-white border rounded-lg p-4 transition-all ${
      isHighlighted ? 'ring-2 ring-blue-500 shadow-lg' : 'border-gray-200 hover:shadow-md'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: datasetColor }}
          />
          <h4 className="font-medium text-gray-900 text-sm">{metric.name}</h4>
        </div>
        {rank && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <BarChart3 className="h-3 w-3" />
            <span>#{rank}</span>
          </div>
        )}
      </div>

      {/* Main Value */}
      <div className="mb-3">
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {formatValue(metric.value)}
          {metric.unit && <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>}
        </div>
        
        {/* Change Indicator */}
        <div className="flex items-center space-x-2">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${
            metric.trend === 'up' ? 'text-green-600' : 
            metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {formatChange(metric.change, metric.changePercent)}
          </span>
          {metric.previousValue && (
            <span className="text-xs text-gray-500">
              vs {formatValue(metric.previousValue)}
            </span>
          )}
        </div>
      </div>

      {/* Benchmark Comparison */}
      {benchmarkStatus && (
        <div className={`flex items-center space-x-1 text-xs ${benchmarkStatus.color} mb-2`}>
          {benchmarkStatus.icon}
          <span>{benchmarkStatus.text}</span>
        </div>
      )}

      {/* Confidence */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Confidence: {(metric.confidence * 100).toFixed(0)}%</span>
        <div className="w-16 bg-gray-200 rounded-full h-1">
          <div 
            className="bg-blue-500 h-1 rounded-full" 
            style={{ width: `${metric.confidence * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function SideBySideComparison({
  datasets,
  metrics,
  benchmarks = [],
  showBenchmarks = false,
  onDatasetSelect,
  onExport,
  className = ''
}: SideBySideComparisonProps) {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>(metrics[0] || '');

  // Filter datasets and metrics
  const filteredDatasets = datasets.filter(dataset => 
    dataset.metrics.some(metric => metrics.includes(metric.id))
  );

  const availableMetrics = metrics.filter(metricId =>
    datasets.some(dataset => dataset.metrics.some(metric => metric.id === metricId))
  );

  // Handle dataset selection
  const handleDatasetSelect = (datasetId: string) => {
    setSelectedDatasetId(datasetId === selectedDatasetId ? null : datasetId);
    if (onDatasetSelect) {
      onDatasetSelect(datasetId);
    }
  };

  // Get benchmark for specific metric
  const getBenchmarkForMetric = (metricId: string): number | undefined => {
    return benchmarks.find(b => b.name.toLowerCase().includes(metricId.replace('_', ' ')))?.value;
  };

  // Get best performing dataset for each metric
  const getBestPerformingDataset = (metricId: string): string | null => {
    let bestValue = -Infinity;
    let bestDatasetId: string | null = null;

    filteredDatasets.forEach(dataset => {
      const metric = dataset.metrics.find(m => m.id === metricId);
      if (metric && metric.value > bestValue) {
        bestValue = metric.value;
        bestDatasetId = dataset.datasetId;
      }
    });

    return bestDatasetId;
  };

  if (filteredDatasets.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">No datasets available for comparison with the selected metrics.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Side-by-Side Comparison</h3>
          <p className="text-sm text-gray-600">
            Comparing {filteredDatasets.length} dataset{filteredDatasets.length > 1 ? 's' : ''} across {availableMetrics.length} metric{availableMetrics.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Metric Selector */}
          {availableMetrics.length > 1 && (
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Metrics</option>
              {availableMetrics.map(metricId => {
                const metric = datasets[0]?.metrics.find(m => m.id === metricId);
                return (
                  <option key={metricId} value={metricId}>
                    {metric?.name || metricId}
                  </option>
                );
              })}
            </select>
          )}

          {/* Export Button */}
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Dataset Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDatasets.map(dataset => {
          const isSelected = selectedDatasetId === dataset.datasetId;
          
          return (
            <div
              key={dataset.datasetId}
              className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'border-gray-200 hover:shadow-md'
              }`}
              onClick={() => handleDatasetSelect(dataset.datasetId)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: dataset.color }}
                  />
                  <h4 className="font-medium text-gray-900">{dataset.label}</h4>
                </div>
                {isSelected && <Eye className="h-4 w-4 text-blue-500" />}
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Rank:</span>
                  <span className="font-medium">#{dataset.performance.rank}</span>
                </div>
                <div className="flex justify-between">
                  <span>Percentile:</span>
                  <span className="font-medium">{dataset.performance.percentile}th</span>
                </div>
                <div className="flex justify-between">
                  <span>vs Baseline:</span>
                  <span className={`font-medium ${
                    dataset.performance.vsBaseline > 0 ? 'text-green-600' : 
                    dataset.performance.vsBaseline < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {dataset.performance.vsBaseline > 0 ? '+' : ''}{dataset.performance.vsBaseline.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Metrics Comparison */}
      <div className="space-y-6">
        {availableMetrics
          .filter(metricId => !selectedMetric || metricId === selectedMetric)
          .map(metricId => {
            const bestDatasetId = getBestPerformingDataset(metricId);
            const benchmark = getBenchmarkForMetric(metricId);

            return (
              <div key={metricId} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    {datasets[0]?.metrics.find(m => m.id === metricId)?.name || metricId}
                  </h4>
                  {benchmark && showBenchmarks && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Target className="h-4 w-4" />
                      <span>Benchmark: {benchmark.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredDatasets.map(dataset => {
                    const metric = dataset.metrics.find(m => m.id === metricId);
                    if (!metric) return null;

                    const isHighlighted = bestDatasetId === dataset.datasetId || 
                                        selectedDatasetId === dataset.datasetId;

                    return (
                      <MetricCard
                        key={`${dataset.datasetId}-${metricId}`}
                        metric={metric}
                        datasetColor={dataset.color}
                        benchmark={benchmark}
                        showBenchmark={showBenchmarks}
                        rank={dataset.performance.rank}
                        isHighlighted={isHighlighted}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* Summary Statistics */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Comparison Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Total Datasets</div>
            <div className="font-semibold text-gray-900">{filteredDatasets.length}</div>
          </div>
          <div>
            <div className="text-gray-600">Metrics Compared</div>
            <div className="font-semibold text-gray-900">{availableMetrics.length}</div>
          </div>
          <div>
            <div className="text-gray-600">Best Performer</div>
            <div className="font-semibold text-gray-900">
              {filteredDatasets.find(d => d.performance.rank === 1)?.label || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Avg Performance</div>
            <div className="font-semibold text-gray-900">
              {(filteredDatasets.reduce((sum, d) => sum + d.performance.percentile, 0) / filteredDatasets.length).toFixed(0)}th percentile
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}