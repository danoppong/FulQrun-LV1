// src/components/dashboard/analytics/TrendAnalysis.tsx
// Trend Analysis Component for KPI breakdown and territory analysis
// Provides detailed breakdown analysis for pharmaceutical KPIs

'use client';

import React, { useState, useEffect } from 'react';
import { PharmaKPICardData } from '@/lib/types/dashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapPin, Package, Users, TrendingUp } from 'lucide-react';

interface TrendAnalysisProps {
  kpiData: PharmaKPICardData;
  kpiId: string;
  organizationId: string;
  type: 'breakdown' | 'territory';
}

interface BreakdownData {
  name: string;
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  [key: string]: string | number; // Index signature for Recharts compatibility
}

interface TerritoryData {
  territory: string;
  value: number;
  target: number;
  achievement: number;
  rep: string;
}

const mockBreakdownData: BreakdownData[] = [
  { name: 'Primary Care', value: 850, percentage: 42, trend: 'up' },
  { name: 'Specialists', value: 620, percentage: 31, trend: 'stable' },
  { name: 'Hospitals', value: 380, percentage: 19, trend: 'down' },
  { name: 'Other', value: 150, percentage: 8, trend: 'stable' }
];

const mockTerritoryData: TerritoryData[] = [
  { territory: 'North Region', value: 1250, target: 1200, achievement: 104, rep: 'Sarah Johnson' },
  { territory: 'South Region', value: 980, target: 1100, achievement: 89, rep: 'Michael Chen' },
  { territory: 'East Region', value: 1450, target: 1300, achievement: 112, rep: 'Emily Davis' },
  { territory: 'West Region', value: 1120, target: 1150, achievement: 97, rep: 'David Wilson' },
  { territory: 'Central Region', value: 890, target: 950, achievement: 94, rep: 'Lisa Brown' }
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function TrendAnalysis({
  kpiData: _kpiData,
  kpiId,
  organizationId: _organizationId,
  type
}: TrendAnalysisProps) {
  const [loading, setLoading] = useState(true);
  const [breakdownData, setBreakdownData] = useState<BreakdownData[]>([]);
  const [territoryData, setTerritoryData] = useState<TerritoryData[]>([]);

  useEffect(() => {
    fetchAnalysisData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kpiId, type]);

  const fetchAnalysisData = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (type === 'breakdown') {
      setBreakdownData(mockBreakdownData);
    } else {
      setTerritoryData(mockTerritoryData);
    }
    
    setLoading(false);
  };

  const formatValue = (value: number) => {
    if (kpiId.includes('percentage') || kpiId.includes('share')) {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString();
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <div className="h-4 w-4 bg-gray-300 rounded-full" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAchievementColor = (achievement: number) => {
    if (achievement >= 100) return 'text-green-600 bg-green-50';
    if (achievement >= 90) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      name: string;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-blue-600">
            Value: <span className="font-bold">{formatValue(payload[0].value)}</span>
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

  if (type === 'breakdown') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold">Performance Breakdown</h3>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {breakdownData.map((item, _index) => (
            <div key={item.name} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                {getTrendIcon(item.trend)}
              </div>
              <div className="text-xl font-bold text-gray-900">
                {formatValue(item.value)}
              </div>
              <div className="text-sm text-gray-600">
                {item.percentage}% of total
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="text-lg font-semibold mb-4">Value Distribution</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={formatValue} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="text-lg font-semibold mb-4">Percentage Share</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatValue(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-semibold">Detailed Breakdown</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {breakdownData.map((item) => (
                  <tr key={item.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatValue(item.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.percentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className={`flex items-center space-x-1 ${getTrendColor(item.trend)}`}>
                        {getTrendIcon(item.trend)}
                        <span className="capitalize">{item.trend}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Territory Analysis
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <MapPin className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-semibold">Territory Performance</h3>
      </div>

      {/* Territory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {territoryData.map((territory) => (
          <div key={territory.territory} className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">{territory.territory}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAchievementColor(territory.achievement)}`}>
                {territory.achievement}%
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Actual:</span>
                <span className="font-medium">{formatValue(territory.value)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Target:</span>
                <span className="font-medium">{formatValue(territory.target)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                <span>{territory.rep}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    territory.achievement >= 100 ? 'bg-green-500' :
                    territory.achievement >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(territory.achievement, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Territory Bar Chart */}
      <div className="bg-white p-6 rounded-lg border">
        <h4 className="text-lg font-semibold mb-4">Territory Comparison</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={territoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="territory" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={formatValue} />
              <Tooltip 
                formatter={(value, name) => [formatValue(value as number), name]}
                labelFormatter={(label) => `Territory: ${label}`}
              />
              <Bar dataKey="value" name="Actual" fill="#3B82F6" />
              <Bar dataKey="target" name="Target" fill="#E5E7EB" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}