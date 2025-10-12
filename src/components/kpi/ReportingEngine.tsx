'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { formatCurrencySafe } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText, 
  Download, 
  
  TrendingUp,
  BarChart3,
  Target,
  DollarSign
} from 'lucide-react';
import {
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  
} from 'recharts';

interface ReportData {
  executive_summary: {
    total_revenue: number;
    revenue_growth: number;
    win_rate: number;
    quota_attainment: number;
    top_performers: Array<{
      name: string;
      revenue: number;
      win_rate: number;
    }>;
    key_insights: string[];
  };
  territory_performance: Array<{
    territory_name: string;
    revenue: number;
    win_rate: number;
    quota_attainment: number;
    rep_count: number;
    growth_rate: number;
  }>;
  rep_scorecards: Array<{
    rep_name: string;
    territory: string;
    revenue: number;
    win_rate: number;
    quota_attainment: number;
    activities_per_day: number;
    avg_deal_size: number;
    sales_cycle_length: number;
    performance_tier: string;
  }>;
  trend_analysis: Array<{
    period: string;
    revenue: number;
    win_rate: number;
    quota_attainment: number;
    activities: number;
  }>;
  kpi_breakdown: Array<{
    kpi_name: string;
    current_value: number;
    target_value: number;
    performance_tier: string;
    trend: 'up' | 'down' | 'stable';
  }>;
}

interface ReportingEngineProps {
  organizationId: string;
  userId?: string;
  territoryId?: string;
}

// Note: Chart color constants can be added here if needed

export function ReportingEngine({ organizationId, userId, territoryId }: ReportingEngineProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedReportType, setSelectedReportType] = useState('executive');
  const [reportFormat, setReportFormat] = useState('pdf');

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        organizationId,
        periodStart: new Date(Date.now() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        periodEnd: new Date().toISOString().split('T')[0],
        reportType: selectedReportType
      });

      if (userId) params.append('userId', userId);
      if (territoryId) params.append('territoryId', territoryId);

      const response = await fetch(`/api/kpis/reports?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch report data');
      }

      setReportData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [organizationId, userId, territoryId, selectedPeriod, selectedReportType]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const exportReport = async (format: string) => {
    try {
      const params = new URLSearchParams({
        organizationId,
        periodStart: new Date(Date.now() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        periodEnd: new Date().toISOString().split('T')[0],
        reportType: selectedReportType,
        format
      });

      if (userId) params.append('userId', userId);
      if (territoryId) params.append('territoryId', territoryId);

      const response = await fetch(`/api/kpis/reports/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReportType}-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatCurrency = (value: number) => formatCurrencySafe(value);

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchReportData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No report data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI Reports</h1>
          <p className="text-gray-600">Comprehensive performance reports and analytics</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={reportFormat} onValueChange={setReportFormat}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => exportReport(reportFormat)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={selectedReportType} onValueChange={setSelectedReportType} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="executive">Executive Summary</TabsTrigger>
          <TabsTrigger value="territory">Territory Performance</TabsTrigger>
          <TabsTrigger value="rep">Rep Scorecards</TabsTrigger>
          <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
        </TabsList>

        {/* Executive Summary */}
        <TabsContent value="executive" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(reportData.executive_summary.total_revenue)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Revenue Growth</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPercentage(reportData.executive_summary.revenue_growth)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Win Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPercentage(reportData.executive_summary.win_rate)}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Quota Attainment</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPercentage(reportData.executive_summary.quota_attainment)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.executive_summary.top_performers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{performer.name}</h4>
                        <p className="text-sm text-gray-600">Win Rate: {formatPercentage(performer.win_rate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(performer.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reportData.executive_summary.key_insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <p className="text-sm text-blue-800">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Territory Performance */}
        <TabsContent value="territory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Territory Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportData.territory_performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="territory_name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportData.territory_performance.map((territory, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{territory.territory_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Revenue</span>
                    <span className="font-medium">{formatCurrency(territory.revenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Win Rate</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {formatPercentage(territory.win_rate)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Quota Attainment</span>
                    <Badge className="bg-green-100 text-green-800">
                      {formatPercentage(territory.quota_attainment)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Growth Rate</span>
                    <Badge className={territory.growth_rate > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {formatPercentage(territory.growth_rate)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Reps</span>
                    <span className="font-medium">{territory.rep_count}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Rep Scorecards */}
        <TabsContent value="rep" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rep Performance Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: 'Excellent', value: reportData.rep_scorecards.filter(r => r.performance_tier === 'excellent').length },
                      { name: 'Good', value: reportData.rep_scorecards.filter(r => r.performance_tier === 'good').length },
                      { name: 'Average', value: reportData.rep_scorecards.filter(r => r.performance_tier === 'average').length },
                      { name: 'Below Average', value: reportData.rep_scorecards.filter(r => r.performance_tier === 'below_average').length }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      { name: 'Excellent', value: 0, color: '#10B981' },
                      { name: 'Good', value: 0, color: '#3B82F6' },
                      { name: 'Average', value: 0, color: '#F59E0B' },
                      { name: 'Below Average', value: 0, color: '#EF4444' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {reportData.rep_scorecards.map((rep, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-lg">{rep.rep_name}</h3>
                      <p className="text-sm text-gray-600">{rep.territory}</p>
                    </div>
                    <Badge className={
                      rep.performance_tier === 'excellent' ? 'bg-green-100 text-green-800' :
                      rep.performance_tier === 'good' ? 'bg-blue-100 text-blue-800' :
                      rep.performance_tier === 'average' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {rep.performance_tier.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Revenue</p>
                      <p className="font-medium">{formatCurrency(rep.revenue)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Win Rate</p>
                      <p className="font-medium">{formatPercentage(rep.win_rate)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Quota Attainment</p>
                      <p className="font-medium">{formatPercentage(rep.quota_attainment)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Activities/Day</p>
                      <p className="font-medium">{rep.activities_per_day.toFixed(1)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trend Analysis */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={reportData.trend_analysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="win_rate" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="quota_attainment" stroke="#F59E0B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>KPI Performance Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.kpi_breakdown.map((kpi, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{kpi.kpi_name.replace('_', ' ').toUpperCase()}</h4>
                        <p className="text-sm text-gray-600">
                          Current: {formatNumber(kpi.current_value)} | Target: {formatNumber(kpi.target_value)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          kpi.performance_tier === 'excellent' ? 'bg-green-100 text-green-800' :
                          kpi.performance_tier === 'good' ? 'bg-blue-100 text-blue-800' :
                          kpi.performance_tier === 'average' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {kpi.performance_tier.replace('_', ' ')}
                        </Badge>
                        {kpi.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {kpi.trend === 'down' && <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />}
                        {kpi.trend === 'stable' && <div className="w-4 h-4 bg-gray-400 rounded-full" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={reportData.trend_analysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="activities" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
