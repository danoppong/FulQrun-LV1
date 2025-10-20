// src/components/dashboard/charts/HistoricalChart.tsx
// Historical Chart Component for KPI trend visualization
// Shows historical data and trends for pharmaceutical KPIs

'use client';

import React, { useState, useEffect } from 'react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';

interface HistoricalChartProps {
  kpiId: string;
  organizationId: string;
  productId?: string;
  territoryId?: string;
  currentValue: number;
}

interface HistoricalDataPoint {
  date: string;
  value: number;
  confidence: number;
  period: string;
}

const mockHistoricalData: HistoricalDataPoint[] = [
  { date: '2024-01', value: 1250, confidence: 0.85, period: 'Jan 2024' },
  { date: '2024-02', value: 1320, confidence: 0.87, period: 'Feb 2024' },
  { date: '2024-03', value: 1180, confidence: 0.82, period: 'Mar 2024' },
  { date: '2024-04', value: 1450, confidence: 0.89, period: 'Apr 2024' },
  { date: '2024-05', value: 1520, confidence: 0.91, period: 'May 2024' },
  { date: '2024-06', value: 1480, confidence: 0.88, period: 'Jun 2024' },
  { date: '2024-07', value: 1600, confidence: 0.93, period: 'Jul 2024' },
  { date: '2024-08', value: 1580, confidence: 0.90, period: 'Aug 2024' },
  { date: '2024-09', value: 1720, confidence: 0.95, period: 'Sep 2024' },
  { date: '2024-10', value: 1650, confidence: 0.92, period: 'Oct 2024' }
];

export function HistoricalChart({
  kpiId,
  organizationId: _organizationId,
  productId: _productId,
  territoryId: _territoryId,
  currentValue
}: HistoricalChartProps) {
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('12M');

  useEffect(() => {
    fetchHistoricalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kpiId, selectedPeriod]);

  const fetchHistoricalData = async () => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For now, use mock data
    // In real implementation, this would fetch from your KPI engine
    const filteredData = mockHistoricalData.slice(-getDataPoints());
    
    // Add current value as latest data point
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentData = {
      date: currentMonth,
      value: currentValue,
      confidence: 0.95,
      period: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    };
    
    setData([...filteredData, currentData]);
    setLoading(false);
  };

  const getDataPoints = () => {
    switch (selectedPeriod) {
      case '3M': return 3;
      case '6M': return 6;
      case '12M': return 12;
      default: return 12;
    }
  };

  const calculateTrend = () => {
    if (data.length < 2) return { direction: 'stable', percentage: 0 };
    
    const recent = data.slice(-3).reduce((sum, d) => sum + d.value, 0) / 3;
    const previous = data.slice(-6, -3).reduce((sum, d) => sum + d.value, 0) / 3;
    
    if (previous === 0) return { direction: 'stable', percentage: 0 };
    
    const percentage = ((recent - previous) / previous) * 100;
    const direction = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable';
    
    return { direction, percentage: Math.abs(percentage) };
  };

  const trend = calculateTrend();

  const formatValue = (value: number) => {
    if (kpiId.includes('percentage') || kpiId.includes('share')) {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString();
  };

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: HistoricalDataPoint;
      value: number;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{data.period}</p>
          <p className="text-blue-600">
            Value: <span className="font-bold">{formatValue(data.value)}</span>
          </p>
          <p className="text-green-600">
            Confidence: <span className="font-bold">{(data.confidence * 100).toFixed(0)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold">Historical Trend</h3>
        </div>
        
        <div className="flex space-x-2">
          {['3M', '6M', '12M'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Trend Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-600">Latest Value</div>
          <div className="text-xl font-bold text-gray-900">
            {formatValue(currentValue)}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-600">Trend Direction</div>
          <div className="flex items-center justify-center space-x-2">
            {trend.direction === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
            {trend.direction === 'down' && <TrendingDown className="h-5 w-5 text-red-500" />}
            <span className={`font-bold capitalize ${
              trend.direction === 'up' ? 'text-green-600' : 
              trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trend.direction}
            </span>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-600">Change Rate</div>
          <div className={`text-xl font-bold ${
            trend.direction === 'up' ? 'text-green-600' : 
            trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
            {trend.percentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
              name="KPI Value"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Data Quality Note */}
      <div className="text-xs text-gray-500 text-center">
        Chart shows {selectedPeriod} historical data with confidence indicators. 
        Data points with lower confidence may indicate incomplete information.
      </div>
    </div>
  );
}