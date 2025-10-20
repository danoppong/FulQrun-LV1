// src/components/dashboard/comparison/TrendComparison.tsx
// Trend Comparison Component for time-series analytics
// Visualizes performance trends across different datasets over time

'use client';

import React, { useState, useMemo } from 'react';
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
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Eye,
  EyeOff,
  Download,
  Settings
} from 'lucide-react';
import { 
  ComparisonTimeframe, 
  TimeSeriesPoint 
} from '@/lib/types/comparison';

interface TrendComparisonProps {
  timeSeries: Array<{
    datasetId: string;
    label: string;
    color: string;
    data: TimeSeriesPoint[];
  }>;
  timeframe: ComparisonTimeframe;
  onTimeRangeChange?: (range: { start: Date; end: Date }) => void;
  onExport?: () => void;
  className?: string;
}

interface ChartDataPoint {
  date: string;
  dateObj: Date;
  [key: string]: string | number | Date;
}

interface DatasetVisibility {
  [datasetId: string]: boolean;
}

export function TrendComparison({
  timeSeries,
  timeframe,
  onTimeRangeChange,
  onExport,
  className = ''
}: TrendComparisonProps) {
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  const [showConfidence, setShowConfidence] = useState(false);
  const [datasetVisibility, setDatasetVisibility] = useState<DatasetVisibility>(
    timeSeries.reduce((acc, series) => ({ ...acc, [series.datasetId]: true }), {})
  );
  const [selectedTimeRange, setSelectedTimeRange] = useState<{start: Date; end: Date} | null>(null);

  // Process time series data for chart
  const chartData = useMemo(() => {
    if (timeSeries.length === 0) return [];

    // Get all unique dates across all series
    const allDates = new Set<string>();
    timeSeries.forEach(series => {
      series.data.forEach(point => {
        allDates.add(point.date.toISOString().split('T')[0]);
      });
    });

    // Sort dates
    const sortedDates = Array.from(allDates).sort();

    // Create chart data points
    return sortedDates.map(dateStr => {
      const dateObj = new Date(dateStr);
      const dataPoint: ChartDataPoint = {
        date: dateObj.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: timeframe.primary.endDate.getFullYear() !== timeframe.primary.startDate.getFullYear() ? 'numeric' : undefined
        }),
        dateObj
      };

      // Add data for each visible dataset
      timeSeries.forEach(series => {
        if (datasetVisibility[series.datasetId]) {
          const point = series.data.find(p => 
            p.date.toISOString().split('T')[0] === dateStr
          );
          dataPoint[series.datasetId] = point?.value || null;
          
          if (showConfidence && point?.confidence) {
            dataPoint[`${series.datasetId}_confidence`] = point.confidence;
          }
        }
      });

      return dataPoint;
    });
  }, [timeSeries, datasetVisibility, showConfidence, timeframe]);

  // Calculate trend statistics
  const trendStats = useMemo(() => {
    return timeSeries.map(series => {
      if (series.data.length < 2) {
        return {
          datasetId: series.datasetId,
          label: series.label,
          trend: 'stable' as const,
          change: 0,
          changePercent: 0,
          volatility: 0
        };
      }

      const firstValue = series.data[0].value;
      const lastValue = series.data[series.data.length - 1].value;
      const change = lastValue - firstValue;
      const changePercent = firstValue !== 0 ? (change / firstValue) * 100 : 0;

      // Calculate volatility (standard deviation of percentage changes)
      const percentageChanges = [];
      for (let i = 1; i < series.data.length; i++) {
        const prevValue = series.data[i - 1].value;
        const currentValue = series.data[i].value;
        if (prevValue !== 0) {
          percentageChanges.push(((currentValue - prevValue) / prevValue) * 100);
        }
      }

      const mean = percentageChanges.reduce((sum, val) => sum + val, 0) / percentageChanges.length;
      const variance = percentageChanges.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / percentageChanges.length;
      const volatility = Math.sqrt(variance);

      return {
        datasetId: series.datasetId,
        label: series.label,
        trend: Math.abs(changePercent) > 2 ? (changePercent > 0 ? 'up' : 'down') : 'stable' as const,
        change,
        changePercent,
        volatility
      };
    });
  }, [timeSeries]);

  // Handle dataset visibility toggle
  const toggleDatasetVisibility = (datasetId: string) => {
    setDatasetVisibility(prev => ({
      ...prev,
      [datasetId]: !prev[datasetId]
    }));
  };

  // Handle time range selection on chart
  const handleTimeRangeSelect = (data: { activeLabel?: string; activePayload?: Array<{ payload?: { dateObj?: Date } }> }) => {
    if (data && data.activeLabel && onTimeRangeChange) {
      const selectedDate = new Date(data.activePayload?.[0]?.payload?.dateObj || Date.now());
      if (selectedTimeRange) {
        // Complete range selection
        const start = selectedDate < selectedTimeRange.start ? selectedDate : selectedTimeRange.start;
        const end = selectedDate > selectedTimeRange.start ? selectedDate : selectedTimeRange.start;
        onTimeRangeChange({ start, end });
        setSelectedTimeRange(null);
      } else {
        // Start range selection
        setSelectedTimeRange({ start: selectedDate, end: selectedDate });
      }
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { 
    active?: boolean; 
    payload?: Array<{ value: number | string; color: string; name: string; dataKey: string }>; 
    label?: string 
  }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index: number) => {
            return (
              <div key={index} className="flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-700">{entry.name}</span>
                </div>
                <span className="font-medium text-gray-900">
                  {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const visibleSeries = timeSeries.filter(series => datasetVisibility[series.datasetId]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Trend Comparison</h3>
          <p className="text-sm text-gray-600">
            {timeframe.primary.label} • {visibleSeries.length} of {timeSeries.length} datasets visible
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Chart Type Toggle */}
          <div className="flex border border-gray-300 rounded">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 text-sm ${
                chartType === 'line' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 text-sm ${
                chartType === 'area' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Area
            </button>
          </div>

          {/* Settings */}
          <button
            onClick={() => setShowConfidence(!showConfidence)}
            className={`p-2 border border-gray-300 rounded hover:bg-gray-50 ${
              showConfidence ? 'bg-blue-50 border-blue-300' : ''
            }`}
            title="Toggle confidence intervals"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Export */}
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Dataset Legend & Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
        {timeSeries.map(series => {
          const isVisible = datasetVisibility[series.datasetId];
          const stats = trendStats.find(s => s.datasetId === series.datasetId);

          return (
            <div key={series.datasetId} className="flex items-center space-x-3">
              <button
                onClick={() => toggleDatasetVisibility(series.datasetId)}
                className="flex items-center space-x-2 hover:bg-white rounded px-2 py-1 transition-colors"
              >
                {isVisible ? (
                  <Eye className="h-4 w-4 text-gray-500" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                )}
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: isVisible ? series.color : '#e5e7eb' }}
                />
                <span className={`text-sm font-medium ${isVisible ? 'text-gray-900' : 'text-gray-500'}`}>
                  {series.label}
                </span>
              </button>

              {stats && isVisible && (
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  {stats.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : stats.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  ) : (
                    <BarChart3 className="h-3 w-3 text-gray-500" />
                  )}
                  <span className={`font-medium ${
                    stats.trend === 'up' ? 'text-green-600' : 
                    stats.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stats.changePercent > 0 ? '+' : ''}{stats.changePercent.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'area' ? (
            <AreaChart data={chartData} onClick={handleTimeRangeSelect}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {visibleSeries.map((series) => (
                <Area
                  key={series.datasetId}
                  type="monotone"
                  dataKey={series.datasetId}
                  name={series.label}
                  stackId={1}
                  stroke={series.color}
                  fill={series.color}
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={chartData} onClick={handleTimeRangeSelect}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {visibleSeries.map(series => (
                <Line
                  key={series.datasetId}
                  type="monotone"
                  dataKey={series.datasetId}
                  name={series.label}
                  stroke={series.color}
                  strokeWidth={2}
                  dot={{ fill: series.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: series.color, strokeWidth: 2 }}
                />
              ))}

              {/* Reference lines for benchmarks could be added here */}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Trend Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trendStats
          .filter(stat => datasetVisibility[stat.datasetId])
          .map(stat => (
            <div key={stat.datasetId} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{stat.label}</h4>
                {stat.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : stat.trend === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <BarChart3 className="h-4 w-4 text-gray-500" />
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Change:</span>
                  <span className={`font-medium ${
                    stat.changePercent > 0 ? 'text-green-600' : 
                    stat.changePercent < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.changePercent > 0 ? '+' : ''}{stat.changePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Volatility:</span>
                  <span className="font-medium text-gray-900">
                    {stat.volatility.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trend:</span>
                  <span className={`font-medium capitalize ${
                    stat.trend === 'up' ? 'text-green-600' : 
                    stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.trend}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Time Range Selection Hint */}
      {selectedTimeRange && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              Click another point to select a time range for detailed analysis
            </span>
          </div>
        </div>
      )}
    </div>
  );
}