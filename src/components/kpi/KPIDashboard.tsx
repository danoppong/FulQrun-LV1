'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ;
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  Clock, 
  Users, 
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';

interface KPIData {
  win_rate?: {
    total_opportunities: number;
    won_opportunities: number;
    win_rate: number;
  };
  revenue_growth?: {
    current_period_revenue: number;
    previous_period_revenue: number;
    growth_amount: number;
    growth_percentage: number;
  };
  avg_deal_size?: {
    total_revenue: number;
    total_deals: number;
    avg_deal_size: number;
    median_deal_size: number;
    largest_deal: number;
    smallest_deal: number;
  };
  sales_cycle_length?: {
    total_days: number;
    total_deals: number;
    avg_cycle_length: number;
    median_cycle_length: number;
    shortest_cycle: number;
    longest_cycle: number;
  };
  lead_conversion_rate?: {
    total_leads: number;
    qualified_opportunities: number;
    conversion_rate: number;
  };
  cac?: {
    total_cost: number;
    new_customers: number;
    cac: number;
  };
  quota_attainment?: {
    quota_target: number;
    actual_achievement: number;
    attainment_percentage: number;
  };
  clv?: {
    avg_purchase_value: number;
    purchase_frequency: number;
    customer_lifespan_months: number;
    clv: number;
  };
  pipeline_coverage?: {
    total_pipeline_value: number;
    sales_quota: number;
    coverage_ratio: number;
  };
  activities_per_rep?: {
    total_activities: number;
    calls: number;
    emails: number;
    meetings: number;
    demos: number;
    presentations: number;
    activities_per_day: number;
  };
  trends?: unknown[];
  benchmarks?: any;
}

interface KPIDashboardProps {
  organizationId: string;
  userId?: string;
  territoryId?: string;
}

const KPI_COLORS = {
  excellent: 'bg-green-100 text-green-800 border-green-200',
  good: 'bg-blue-100 text-blue-800 border-blue-200',
  average: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  below_average: 'bg-red-100 text-red-800 border-red-200'
};

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export function KPIDashboard({ organizationId, userId, territoryId }: KPIDashboardProps) {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedKPI, setSelectedKPI] = useState('all');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'trends'>('overview');

  useEffect(() => {
    fetchKPIData();
  }, [organizationId, userId, territoryId, selectedPeriod, selectedKPI]);

  const fetchKPIData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        organizationId,
        periodStart: new Date(Date.now() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        periodEnd: new Date().toISOString().split('T')[0],
        kpiType: selectedKPI,
        includeTrends: 'true',
        includeBenchmarks: 'true'
      });

      if (userId) params.append('userId', userId);
      if (territoryId) params.append('territoryId', territoryId);

      const response = await fetch(`/api/kpis?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch KPI data');
      }

      setKpiData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceTier = (value: number, thresholds: any) => {
    if (!thresholds) return 'average';
    
    if (value >= thresholds.excellent) return 'excellent';
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.average) return 'average';
    return 'below_average';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

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
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchKPIData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!kpiData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No KPI data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Performance KPIs</h1>
          <p className="text-gray-600">Comprehensive performance metrics and analytics</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
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

          <Select value={selectedKPI} onValueChange={setSelectedKPI}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All KPIs</SelectItem>
              <SelectItem value="win_rate">Win Rate</SelectItem>
              <SelectItem value="revenue_growth">Revenue Growth</SelectItem>
              <SelectItem value="avg_deal_size">Avg Deal Size</SelectItem>
              <SelectItem value="sales_cycle_length">Sales Cycle</SelectItem>
              <SelectItem value="lead_conversion_rate">Lead Conversion</SelectItem>
              <SelectItem value="cac">CAC</SelectItem>
              <SelectItem value="quota_attainment">Quota Attainment</SelectItem>
              <SelectItem value="clv">CLV</SelectItem>
              <SelectItem value="pipeline_coverage">Pipeline Coverage</SelectItem>
              <SelectItem value="activities_per_rep">Activities</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* KPI Cards */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Win Rate */}
          {kpiData.win_rate && (
            <KPICard
              title="Win Rate"
              value={formatPercentage(kpiData.win_rate.win_rate)}
              subtitle={`${kpiData.win_rate.won_opportunities}/${kpiData.win_rate.total_opportunities} deals`}
              icon={<Target className="h-5 w-5" />}
              trend={kpiData.win_rate.win_rate > 25 ? 'up' : kpiData.win_rate.win_rate < 15 ? 'down' : 'neutral'}
              performanceTier={getPerformanceTier(kpiData.win_rate.win_rate, kpiData.benchmarks?.win_rate?.thresholds)}
            />
          )}

          {/* Revenue Growth */}
          {kpiData.revenue_growth && (
            <KPICard
              title="Revenue Growth"
              value={formatPercentage(kpiData.revenue_growth.growth_percentage)}
              subtitle={formatCurrency(kpiData.revenue_growth.growth_amount)}
              icon={<TrendingUp className="h-5 w-5" />}
              trend={kpiData.revenue_growth.growth_percentage > 0 ? 'up' : 'down'}
              performanceTier={getPerformanceTier(kpiData.revenue_growth.growth_percentage, kpiData.benchmarks?.revenue_growth?.thresholds)}
            />
          )}

          {/* Average Deal Size */}
          {kpiData.avg_deal_size && (
            <KPICard
              title="Avg Deal Size"
              value={formatCurrency(kpiData.avg_deal_size.avg_deal_size)}
              subtitle={`${formatNumber(kpiData.avg_deal_size.total_deals)} deals`}
              icon={<DollarSign className="h-5 w-5" />}
              trend="neutral"
              performanceTier={getPerformanceTier(kpiData.avg_deal_size.avg_deal_size, kpiData.benchmarks?.avg_deal_size?.thresholds)}
            />
          )}

          {/* Sales Cycle Length */}
          {kpiData.sales_cycle_length && (
            <KPICard
              title="Sales Cycle"
              value={`${kpiData.sales_cycle_length.avg_cycle_length.toFixed(0)} days`}
              subtitle={`${formatNumber(kpiData.sales_cycle_length.total_deals)} deals`}
              icon={<Clock className="h-5 w-5" />}
              trend={kpiData.sales_cycle_length.avg_cycle_length < 30 ? 'up' : 'down'}
              performanceTier={getPerformanceTier(kpiData.sales_cycle_length.avg_cycle_length, kpiData.benchmarks?.sales_cycle_length?.thresholds)}
            />
          )}

          {/* Lead Conversion Rate */}
          {kpiData.lead_conversion_rate && (
            <KPICard
              title="Lead Conversion"
              value={formatPercentage(kpiData.lead_conversion_rate.conversion_rate)}
              subtitle={`${kpiData.lead_conversion_rate.qualified_opportunities}/${kpiData.lead_conversion_rate.total_leads} leads`}
              icon={<Users className="h-5 w-5" />}
              trend={kpiData.lead_conversion_rate.conversion_rate > 3 ? 'up' : 'down'}
              performanceTier={getPerformanceTier(kpiData.lead_conversion_rate.conversion_rate, kpiData.benchmarks?.lead_conversion_rate?.thresholds)}
            />
          )}

          {/* CAC */}
          {kpiData.cac && (
            <KPICard
              title="Customer Acquisition Cost"
              value={formatCurrency(kpiData.cac.cac)}
              subtitle={`${formatNumber(kpiData.cac.new_customers)} customers`}
              icon={<Activity className="h-5 w-5" />}
              trend="neutral"
              performanceTier={getPerformanceTier(kpiData.cac.cac, kpiData.benchmarks?.cac?.thresholds)}
            />
          )}

          {/* Quota Attainment */}
          {kpiData.quota_attainment && (
            <KPICard
              title="Quota Attainment"
              value={formatPercentage(kpiData.quota_attainment.attainment_percentage)}
              subtitle={formatCurrency(kpiData.quota_attainment.actual_achievement)}
              icon={<BarChart3 className="h-5 w-5" />}
              trend={kpiData.quota_attainment.attainment_percentage >= 100 ? 'up' : 'down'}
              performanceTier={getPerformanceTier(kpiData.quota_attainment.attainment_percentage, kpiData.benchmarks?.quota_attainment?.thresholds)}
            />
          )}

          {/* CLV */}
          {kpiData.clv && (
            <KPICard
              title="Customer Lifetime Value"
              value={formatCurrency(kpiData.clv.clv)}
              subtitle={`${kpiData.clv.purchase_frequency.toFixed(1)}x frequency`}
              icon={<PieChart className="h-5 w-5" />}
              trend="neutral"
              performanceTier={getPerformanceTier(kpiData.clv.clv, kpiData.benchmarks?.clv?.thresholds)}
            />
          )}

          {/* Pipeline Coverage */}
          {kpiData.pipeline_coverage && (
            <KPICard
              title="Pipeline Coverage"
              value={`${kpiData.pipeline_coverage.coverage_ratio.toFixed(1)}x`}
              subtitle={formatCurrency(kpiData.pipeline_coverage.total_pipeline_value)}
              icon={<LineChart className="h-5 w-5" />}
              trend={kpiData.pipeline_coverage.coverage_ratio >= 3 ? 'up' : 'down'}
              performanceTier={getPerformanceTier(kpiData.pipeline_coverage.coverage_ratio, kpiData.benchmarks?.pipeline_coverage?.thresholds)}
            />
          )}

          {/* Activities per Rep */}
          {kpiData.activities_per_rep && (
            <KPICard
              title="Activities per Rep"
              value={`${kpiData.activities_per_rep.activities_per_day.toFixed(1)}/day`}
              subtitle={`${formatNumber(kpiData.activities_per_rep.total_activities)} total`}
              icon={<Activity className="h-5 w-5" />}
              trend={kpiData.activities_per_rep.activities_per_day > 15 ? 'up' : 'down'}
              performanceTier={getPerformanceTier(kpiData.activities_per_rep.activities_per_day, kpiData.benchmarks?.activities_per_rep?.thresholds)}
            />
          )}
        </div>
      )}

      {/* Detailed View */}
      {viewMode === 'detailed' && (
        <div className="space-y-6">
          {selectedKPI === 'all' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Detailed charts for each KPI */}
              {kpiData.win_rate && (
                <DetailedKPICard
                  title="Win Rate Analysis"
                  data={kpiData.win_rate}
                  type="win_rate"
                />
              )}
              {kpiData.revenue_growth && (
                <DetailedKPICard
                  title="Revenue Growth Analysis"
                  data={kpiData.revenue_growth}
                  type="revenue_growth"
                />
              )}
              {kpiData.avg_deal_size && (
                <DetailedKPICard
                  title="Deal Size Analysis"
                  data={kpiData.avg_deal_size}
                  type="avg_deal_size"
                />
              )}
              {kpiData.activities_per_rep && (
                <DetailedKPICard
                  title="Activities Breakdown"
                  data={kpiData.activities_per_rep}
                  type="activities_per_rep"
                />
              )}
            </div>
          ) : (
            <DetailedKPICard
              title={`${selectedKPI.replace('_', ' ').toUpperCase()} Analysis`}
              data={kpiData[selectedKPI as keyof KPIData]}
              type={selectedKPI}
            />
          )}
        </div>
      )}

      {/* Trends View */}
      {viewMode === 'trends' && kpiData.trends && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>KPI Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsLineChart data={kpiData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="calculation_date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="calculated_value" stroke="#3B82F6" strokeWidth={2} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  performanceTier: string;
}

function KPICard({ title, value, subtitle, icon, trend, performanceTier }: KPICardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const getPerformanceIcon = () => {
    switch (performanceTier) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'below_average':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            {getPerformanceIcon()}
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>

        <div className="mt-3">
          <Badge className={KPI_COLORS[performanceTier as keyof typeof KPI_COLORS]}>
            {performanceTier.replace('_', ' ')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// Detailed KPI Card Component
interface DetailedKPICardProps {
  title: string;
  data: any;
  type: string;
}

function DetailedKPICard({ title, data, type }: DetailedKPICardProps) {
  const renderChart = () => {
    switch (type) {
      case 'activities_per_rep':
        const activityData = [
          { name: 'Calls', value: data.calls, color: CHART_COLORS[0] },
          { name: 'Emails', value: data.emails, color: CHART_COLORS[1] },
          { name: 'Meetings', value: data.meetings, color: CHART_COLORS[2] },
          { name: 'Demos', value: data.demos, color: CHART_COLORS[3] },
          { name: 'Presentations', value: data.presentations, color: CHART_COLORS[4] }
        ];

        return (
          <ResponsiveContainer width="100%" height={200}>
            <RechartsPieChart>
              <RechartsPieChart
                data={activityData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {activityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </RechartsPieChart>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      case 'avg_deal_size':
        const dealData = [
          { name: 'Average', value: data.avg_deal_size },
          { name: 'Median', value: data.median_deal_size },
          { name: 'Largest', value: data.largest_deal },
          { name: 'Smallest', value: data.smallest_deal }
        ];

        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dealData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            Chart not available for this KPI type
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {renderChart()}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600 capitalize">
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className="font-medium">
                  {typeof value === 'number' 
                    ? (key.includes('rate') || key.includes('percentage') 
                        ? formatPercentage(value) 
                        : key.includes('cost') || key.includes('value') || key.includes('size')
                        ? formatCurrency(value)
                        : formatNumber(value))
                    : String(value)
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
