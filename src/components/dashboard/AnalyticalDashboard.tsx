// src/components/dashboard/AnalyticalDashboard.tsx
// Comprehensive Analytical Dashboard for Phase 2.6 Implementation
// Advanced pharmaceutical analytics with trend analysis and performance comparisons

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  RefreshCw,
  Download,
  Share,
  Users,
  Package,
  Target
} from 'lucide-react';
import { TrendAnalysisWidget } from './widgets/TrendAnalysisWidget';
import { PerformanceComparisonWidget } from './widgets/PerformanceComparisonWidget';
import { TrendDataPoint, AnalyticalInsight, ComparisonMetric } from '@/lib/types/analytics';

interface AnalyticalDashboardProps {
  organizationId: string;
  userId?: string;
  defaultFilters?: {
    dateRange?: { start: string; end: string };
    territories?: string[];
    products?: string[];
  };
}

interface DashboardFilters {
  dateRange: { start: string; end: string };
  territory: string;
  product: string;
  segment: string;
  granularity: 'daily' | 'weekly' | 'monthly';
}

interface MockData {
  trxData: TrendDataPoint[];
  nrxData: TrendDataPoint[];
  marketShareData: TrendDataPoint[];
  territoryCurrentData: number[];
  territoryPreviousData: number[];
  productCurrentData: number[];
  productPreviousData: number[];
}

export function AnalyticalDashboard({
  organizationId,
  userId: _userId,
  defaultFilters
}: AnalyticalDashboardProps) {
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: defaultFilters?.dateRange || {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    territory: 'all',
    product: 'all',
    segment: 'all',
    granularity: 'weekly'
  });

  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'comparisons' | 'insights'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [mockData, setMockData] = useState<MockData | null>(null);

  // Generate mock data for demonstration
  const generateMockData = useCallback((): MockData => {
    const days = 30;
    const baseDate = new Date(filters.dateRange.start);
    
    const trxData: TrendDataPoint[] = [];
    const nrxData: TrendDataPoint[] = [];
    const marketShareData: TrendDataPoint[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      
      // TRx data with upward trend and some volatility
      const trxBase = 1000 + (i * 10) + (Math.random() - 0.5) * 100;
      trxData.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(800, trxBase + (Math.sin(i / 7) * 50)),
        period: `day_${i}`,
        confidence: 0.85 + Math.random() * 0.1,
        anomaly: Math.random() > 0.95 // 5% chance of anomaly
      });

      // NRx data with more stable trend
      const nrxBase = 200 + (i * 2) + (Math.random() - 0.5) * 20;
      nrxData.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(150, nrxBase),
        period: `day_${i}`,
        confidence: 0.9 + Math.random() * 0.05
      });

      // Market share with seasonal pattern
      const marketShareBase = 15 + Math.sin(i / 10) * 3 + (Math.random() - 0.5) * 1;
      marketShareData.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(10, Math.min(25, marketShareBase)),
        period: `day_${i}`,
        confidence: 0.8 + Math.random() * 0.15
      });
    }

    // Territory comparison data
    const territoryCurrentData = [8500, 7200, 9100, 6800, 8900, 7500, 8200, 6900];
    const territoryPreviousData = [8000, 7500, 8600, 7200, 8100, 7800, 7900, 7100];

    // Product comparison data
    const productCurrentData = [15000, 12000, 18000, 9000, 21000, 11000];
    const productPreviousData = [14500, 13000, 16500, 10000, 19000, 12000];

    return {
      trxData,
      nrxData,
      marketShareData,
      territoryCurrentData,
      territoryPreviousData,
      productCurrentData,
      productPreviousData
    };
  }, [filters.dateRange.start]);

  // Load data
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setMockData(generateMockData());
      setIsLoading(false);
    }, 1000);
  }, [filters, generateMockData]);

  const handleFilterChange = (key: keyof DashboardFilters, value: string | { start: string; end: string }) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleInsightClick = (insight: AnalyticalInsight) => {
    console.log('Insight clicked:', insight);
    // Handle insight detail view
  };

  const handleMetricClick = (metric: ComparisonMetric) => {
    console.log('Metric clicked:', metric);
    // Handle metric drill-down
  };

  const refreshDashboard = () => {
    setMockData(generateMockData());
  };

  const exportData = () => {
    console.log('Export data');
    // Handle data export
  };

  const shareAnalysis = () => {
    console.log('Share analysis');
    // Handle sharing
  };

  if (isLoading) {
    return (
      <div className="w-full p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pharmaceutical Analytics</h1>
          <p className="text-gray-600">Advanced insights and performance analysis</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={shareAnalysis}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={refreshDashboard}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Territory</label>
              <Select value={filters.territory} onValueChange={(value) => handleFilterChange('territory', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Territories</SelectItem>
                  <SelectItem value="north">North Region</SelectItem>
                  <SelectItem value="south">South Region</SelectItem>
                  <SelectItem value="east">East Region</SelectItem>
                  <SelectItem value="west">West Region</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Product</label>
              <Select value={filters.product} onValueChange={(value) => handleFilterChange('product', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="product-a">Product A</SelectItem>
                  <SelectItem value="product-b">Product B</SelectItem>
                  <SelectItem value="product-c">Product C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Segment</label>
              <Select value={filters.segment} onValueChange={(value) => handleFilterChange('segment', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Segments</SelectItem>
                  <SelectItem value="primary">Primary Care</SelectItem>
                  <SelectItem value="specialty">Specialty</SelectItem>
                  <SelectItem value="hospital">Hospital</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Granularity</label>
              <Select value={filters.granularity} onValueChange={(value) => handleFilterChange('granularity', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard */}
      <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as typeof selectedView)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Trends</span>
          </TabsTrigger>
          <TabsTrigger value="comparisons" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Comparisons</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total TRx</p>
                    <p className="text-2xl font-bold">
                      {mockData?.trxData.reduce((sum, point) => sum + point.value, 0).toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="text-green-600">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                </div>
                <div className="mt-2">
                  <Badge className="text-green-600 bg-green-50">+12.5% vs previous period</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total NRx</p>
                    <p className="text-2xl font-bold">
                      {mockData?.nrxData.reduce((sum, point) => sum + point.value, 0).toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="text-blue-600">
                    <Users className="h-8 w-8" />
                  </div>
                </div>
                <div className="mt-2">
                  <Badge className="text-blue-600 bg-blue-50">+8.3% vs previous period</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Market Share</p>
                    <p className="text-2xl font-bold">
                      {mockData?.marketShareData[mockData.marketShareData.length - 1]?.value.toFixed(1) || '0'}%
                    </p>
                  </div>
                  <div className="text-purple-600">
                    <Package className="h-8 w-8" />
                  </div>
                </div>
                <div className="mt-2">
                  <Badge className="text-purple-600 bg-purple-50">+2.1% vs previous period</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mini Trend Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockData && (
              <>
                <TrendAnalysisWidget
                  metric="TRx"
                  title="Total Prescriptions Trend"
                  data={mockData.trxData}
                  organizationId={organizationId}
                  height={300}
                  showControls={false}
                  onInsightClick={handleInsightClick}
                />
                <TrendAnalysisWidget
                  metric="Market Share"
                  title="Market Share Evolution"
                  data={mockData.marketShareData}
                  organizationId={organizationId}
                  height={300}
                  showControls={false}
                  onInsightClick={handleInsightClick}
                />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {mockData && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <TrendAnalysisWidget
                metric="TRx"
                title="Total Prescriptions Analysis"
                data={mockData.trxData}
                organizationId={organizationId}
                height={400}
                showControls={true}
                autoRefresh={true}
                onInsightClick={handleInsightClick}
              />
              <TrendAnalysisWidget
                metric="NRx"
                title="New Prescriptions Analysis"
                data={mockData.nrxData}
                organizationId={organizationId}
                height={400}
                showControls={true}
                autoRefresh={true}
                onInsightClick={handleInsightClick}
              />
              <TrendAnalysisWidget
                metric="Market Share"
                title="Market Share Trends"
                data={mockData.marketShareData}
                organizationId={organizationId}
                height={400}
                showControls={true}
                autoRefresh={true}
                onInsightClick={handleInsightClick}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="comparisons" className="space-y-6">
          {mockData && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <PerformanceComparisonWidget
                title="Territory Performance Comparison"
                currentData={mockData.territoryCurrentData}
                previousData={mockData.territoryPreviousData}
                metric="TRx by Territory"
                comparisonType="territory"
                height={400}
                showBenchmark={true}
                onMetricClick={handleMetricClick}
              />
              <PerformanceComparisonWidget
                title="Product Performance Comparison"
                currentData={mockData.productCurrentData}
                previousData={mockData.productPreviousData}
                metric="TRx by Product"
                comparisonType="product"
                height={400}
                showBenchmark={true}
                onMetricClick={handleMetricClick}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                  <h3 className="font-semibold text-green-900">Growth Opportunity</h3>
                </div>
                <p className="text-sm text-green-800 mb-3">
                  TRx performance shows strong upward trend with 12.5% growth. Territory North leading with exceptional performance.
                </p>
                <Badge className="text-green-600 bg-green-100">High Impact</Badge>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Activity className="h-6 w-6 text-orange-600" />
                  <h3 className="font-semibold text-orange-900">Market Share Alert</h3>
                </div>
                <p className="text-sm text-orange-800 mb-3">
                  Market share volatility detected in specialty segment. Competitive pressure increasing in Q4.
                </p>
                <Badge className="text-orange-600 bg-orange-100">Action Required</Badge>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Target className="h-6 w-6 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Forecast Accuracy</h3>
                </div>
                <p className="text-sm text-blue-800 mb-3">
                  Predictive models showing 89% accuracy. NRx forecast suggests continued growth through next quarter.
                </p>
                <Badge className="text-blue-600 bg-blue-100">Informational</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}