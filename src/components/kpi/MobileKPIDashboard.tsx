'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  XCircle,
  Menu,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface MobileKPIData {
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
  };
  sales_cycle_length?: {
    total_days: number;
    total_deals: number;
    avg_cycle_length: number;
  };
  lead_conversion_rate?: {
    total_leads: number;
    qualified_opportunities: number;
    conversion_rate: number;
  };
  quota_attainment?: {
    quota_target: number;
    actual_achievement: number;
    attainment_percentage: number;
  };
  activities_per_rep?: {
    total_activities: number;
    activities_per_day: number;
  };
}

interface MobileKPIDashboardProps {
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

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function MobileKPIDashboard({ organizationId, userId, territoryId }: MobileKPIDashboardProps) {
  const [kpiData, setKpiData] = useState<MobileKPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedKPI, setSelectedKPI] = useState('all');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'trends'>('overview');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fetchKPIData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        organizationId,
        periodStart: new Date(Date.now() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        periodEnd: new Date().toISOString().split('T')[0],
        kpiType: selectedKPI,
        includeTrends: 'true',
        includeBenchmarks: 'true',
        mobile: 'true' // Flag for mobile-optimized data
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
  }, [organizationId, userId, territoryId, selectedPeriod, selectedKPI]);

  useEffect(() => {
    fetchKPIData();
  }, [fetchKPIData]);

  type TierThresholds = { excellent: number; good: number; average: number };
  const getPerformanceTier = (value: number, thresholds?: TierThresholds) => {
    if (!thresholds) return 'average';
    
    if (value >= thresholds.excellent) return 'excellent';
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.average) return 'average';
    return 'below_average';
  };

  const formatCurrency = (value: number) => {
    // Normalize to a finite number; default to 0 to avoid rendering "$NaNK"
    const n = typeof value === 'number' ? value : Number(value);
    const v = Number.isFinite(n) ? n : 0;
    if (v >= 1_000_000) {
      return `$${(v / 1_000_000).toFixed(1)}M`;
    } else if (v >= 1_000) {
      return `$${(v / 1_000).toFixed(1)}K`;
    }
    return `$${v.toFixed(0)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
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
    <div className="space-y-4">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sales KPIs</h1>
          <p className="text-sm text-gray-600">Performance metrics</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="p-4 bg-gray-50 border-b">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">KPI Type</label>
              <Select value={selectedKPI} onValueChange={setSelectedKPI}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All KPIs</SelectItem>
                  <SelectItem value="win_rate">Win Rate</SelectItem>
                  <SelectItem value="revenue_growth">Revenue Growth</SelectItem>
                  <SelectItem value="quota_attainment">Quota Attainment</SelectItem>
                  <SelectItem value="activities_per_rep">Activities</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'overview' | 'detailed' | 'trends')}>
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                <TabsTrigger value="detailed" className="flex-1">Details</TabsTrigger>
                <TabsTrigger value="trends" className="flex-1">Trends</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}

      {/* Mobile KPI Cards */}
      {viewMode === 'overview' && (
        <div className="space-y-3 p-4">
          {/* Win Rate */}
          {kpiData.win_rate && (
            <MobileKPICard
              title="Win Rate"
              value={formatPercentage(kpiData.win_rate.win_rate)}
              subtitle={`${kpiData.win_rate.won_opportunities}/${kpiData.win_rate.total_opportunities} deals`}
              icon={<Target className="h-6 w-6" />}
              trend={kpiData.win_rate.win_rate > 25 ? 'up' : kpiData.win_rate.win_rate < 15 ? 'down' : 'neutral'}
              performanceTier={getPerformanceTier(kpiData.win_rate.win_rate)}
            />
          )}

          {/* Revenue Growth */}
          {kpiData.revenue_growth && (
            <MobileKPICard
              title="Revenue Growth"
              value={formatPercentage(kpiData.revenue_growth.growth_percentage)}
              subtitle={formatCurrency(kpiData.revenue_growth.growth_amount)}
              icon={<TrendingUp className="h-6 w-6" />}
              trend={kpiData.revenue_growth.growth_percentage > 0 ? 'up' : 'down'}
              performanceTier={getPerformanceTier(kpiData.revenue_growth.growth_percentage)}
            />
          )}

          {/* Quota Attainment */}
          {kpiData.quota_attainment && (
            <MobileKPICard
              title="Quota Attainment"
              value={formatPercentage(kpiData.quota_attainment.attainment_percentage)}
              subtitle={formatCurrency(kpiData.quota_attainment.actual_achievement)}
              icon={<BarChart3 className="h-6 w-6" />}
              trend={kpiData.quota_attainment.attainment_percentage >= 100 ? 'up' : 'down'}
              performanceTier={getPerformanceTier(kpiData.quota_attainment.attainment_percentage)}
            />
          )}

          {/* Activities per Rep */}
          {kpiData.activities_per_rep && (
            <MobileKPICard
              title="Activities/Day"
              value={`${kpiData.activities_per_rep.activities_per_day.toFixed(1)}`}
              subtitle={`${formatNumber(kpiData.activities_per_rep.total_activities)} total`}
              icon={<Activity className="h-6 w-6" />}
              trend={kpiData.activities_per_rep.activities_per_day > 15 ? 'up' : 'down'}
              performanceTier={getPerformanceTier(kpiData.activities_per_rep.activities_per_day)}
            />
          )}
        </div>
      )}

      {/* Mobile Detailed View */}
      {viewMode === 'detailed' && (
        <div className="space-y-4 p-4">
          {selectedKPI === 'all' ? (
            <div className="space-y-4">
              {/* Simplified charts for mobile */}
              {kpiData.win_rate && (
                <MobileDetailedCard
                  title="Win Rate Analysis"
                  data={kpiData.win_rate}
                  type="win_rate"
                />
              )}
              {kpiData.revenue_growth && (
                <MobileDetailedCard
                  title="Revenue Growth Analysis"
                  data={kpiData.revenue_growth}
                  type="revenue_growth"
                />
              )}
            </div>
          ) : (
            <MobileDetailedCard
              title={`${selectedKPI.replace('_', ' ').toUpperCase()} Analysis`}
              data={kpiData[selectedKPI as keyof MobileKPIData]}
              type={selectedKPI}
            />
          )}
        </div>
      )}

      {/* Mobile Trends View */}
      {viewMode === 'trends' && (
        <div className="space-y-4 p-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsLineChart data={[
                  { period: 'Week 1', value: 25 },
                  { period: 'Week 2', value: 28 },
                  { period: 'Week 3', value: 32 },
                  { period: 'Week 4', value: 35 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Mobile KPI Card Component
interface MobileKPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  performanceTier: string;
}

function MobileKPICard({ title, value, subtitle, icon, trend, performanceTier }: MobileKPICardProps) {
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
        <div className="flex items-center justify-between mb-3">
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

// Mobile Detailed Card Component
interface MobileDetailedCardProps {
  title: string;
  data: unknown;
  type: string;
}

function MobileDetailedCard({ title, data, type }: MobileDetailedCardProps) {
  const renderChart = () => {
    switch (type) {
      case 'activities_per_rep':
        const a = (data || {}) as Partial<{
          calls: number; emails: number; meetings: number; demos: number
        }>
        const activityData = [
          { name: 'Calls', value: a.calls || 0, color: CHART_COLORS[0] },
          { name: 'Emails', value: a.emails || 0, color: CHART_COLORS[1] },
          { name: 'Meetings', value: a.meetings || 0, color: CHART_COLORS[2] },
          { name: 'Demos', value: a.demos || 0, color: CHART_COLORS[3] }
        ];

        return (
          <ResponsiveContainer width="100%" height={150}>
            <RechartsPieChart>
              <Pie
                data={activityData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={5}
                dataKey="value"
              >
                {activityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-2" />
            <p>Chart not available for this KPI</p>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {renderChart()}
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(data).slice(0, 6).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600 capitalize">
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className="font-medium">
                  {typeof value === 'number' 
                    ? (key.includes('rate') || key.includes('percentage') 
                        ? `${Number(value).toFixed(1)}%` 
                        : key.includes('cost') || key.includes('value') || key.includes('size')
                        ? `$${Number(value).toLocaleString()}`
                        : Number(value).toLocaleString())
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
