// Enterprise Analytics API Layer
// API functions for advanced analytics and business intelligence

import { createClient } from '@supabase/supabase-js';
import EnterpriseAnalyticsAPI, { 
  AnalyticsDashboard, 
  KPIMetric, 
  ForecastingModel, 
  AnalyticsQuery, 
  RealTimeMetric 
} from './enterprise-analytics';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Dashboard Management
export async function createAnalyticsDashboard(
  dashboard: Omit<AnalyticsDashboard, 'id' | 'createdAt'>,
  userId: string
): Promise<AnalyticsDashboard> {
  try {
    return await EnterpriseAnalyticsAPI.createDashboard(dashboard, userId);
  } catch (error) {
    console.error('Error creating analytics dashboard:', error);
    throw error;
  }
}

export async function getAnalyticsDashboards(organizationId: string): Promise<AnalyticsDashboard[]> {
  try {
    return await EnterpriseAnalyticsAPI.getDashboards(organizationId);
  } catch (error) {
    console.error('Error fetching analytics dashboards:', error);
    throw error;
  }
}

export async function updateAnalyticsDashboard(
  dashboardId: string,
  updates: Partial<AnalyticsDashboard>
): Promise<AnalyticsDashboard> {
  try {
    const updateData: any = {};
    if (updates.dashboardName) updateData.dashboard_name = updates.dashboardName;
    if (updates.dashboardType) updateData.dashboard_type = updates.dashboardType;
    if (updates.config) updateData.config = updates.config;
    if (updates.kpis) updateData.kpis = updates.kpis;
    if (updates.filters) updateData.filters = updates.filters;
    if (updates.refreshFrequencyMinutes) updateData.refresh_frequency_minutes = updates.refreshFrequencyMinutes;
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
    if (updates.accessLevel) updateData.access_level = updates.accessLevel;

    const { data, error } = await supabase
      .from('enterprise_analytics')
      .update(updateData)
      .eq('id', dashboardId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      dashboardName: data.dashboard_name,
      dashboardType: data.dashboard_type,
      config: data.config,
      kpis: data.kpis,
      filters: data.filters,
      refreshFrequencyMinutes: data.refresh_frequency_minutes,
      isPublic: data.is_public,
      accessLevel: data.access_level,
      organizationId: data.organization_id,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at)
    };
  } catch (error) {
    console.error('Error updating analytics dashboard:', error);
    throw error;
  }
}

export async function deleteAnalyticsDashboard(dashboardId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('enterprise_analytics')
      .delete()
      .eq('id', dashboardId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting analytics dashboard:', error);
    throw error;
  }
}

// KPI Management
export async function calculateKPIs(organizationId: string, kpiIds: string[]): Promise<KPIMetric[]> {
  try {
    return await EnterpriseAnalyticsAPI.calculateKPIs(organizationId, kpiIds);
  } catch (error) {
    console.error('Error calculating KPIs:', error);
    throw error;
  }
}

export async function getKPITemplates(): Promise<KPIMetric[]> {
  return [
    {
      id: 'revenue_monthly',
      name: 'Monthly Revenue',
      description: 'Total revenue closed this month',
      metricType: 'revenue',
      calculation: 'SUM(opportunities.deal_value WHERE stage = closed_won AND closed_at >= start_of_month)',
      target: 100000,
      currentValue: 0,
      previousValue: 0,
      trend: 'stable',
      unit: 'USD',
      format: 'currency',
      color: '#10B981',
      isActive: true
    },
    {
      id: 'deals_monthly',
      name: 'Monthly Deals',
      description: 'Number of deals closed this month',
      metricType: 'deals',
      calculation: 'COUNT(opportunities WHERE stage = closed_won AND closed_at >= start_of_month)',
      target: 20,
      currentValue: 0,
      previousValue: 0,
      trend: 'stable',
      unit: 'deals',
      format: 'number',
      color: '#3B82F6',
      isActive: true
    },
    {
      id: 'conversion_rate',
      name: 'Conversion Rate',
      description: 'Percentage of opportunities that convert to closed won',
      metricType: 'conversion',
      calculation: 'COUNT(closed_won) / COUNT(all_opportunities) * 100',
      target: 25,
      currentValue: 0,
      previousValue: 0,
      trend: 'stable',
      unit: '%',
      format: 'percentage',
      color: '#8B5CF6',
      isActive: true
    },
    {
      id: 'activity_weekly',
      name: 'Weekly Activity',
      description: 'Number of activities logged this week',
      metricType: 'activity',
      calculation: 'COUNT(activities WHERE created_at >= start_of_week)',
      target: 100,
      currentValue: 0,
      previousValue: 0,
      trend: 'stable',
      unit: 'activities',
      format: 'number',
      color: '#F59E0B',
      isActive: true
    },
    {
      id: 'performance_score',
      name: 'Performance Score',
      description: 'Average performance score across all users',
      metricType: 'performance',
      calculation: 'AVG(performance_metrics.metric_value WHERE metric_type = overall)',
      target: 80,
      currentValue: 0,
      previousValue: 0,
      trend: 'stable',
      unit: 'score',
      format: 'number',
      color: '#EF4444',
      isActive: true
    }
  ];
}

// Forecasting
export async function generateForecast(
  organizationId: string,
  forecastType: 'revenue' | 'deals' | 'conversion' | 'churn',
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly',
  horizon: number
): Promise<any> {
  try {
    return await EnterpriseAnalyticsAPI.generateForecast(organizationId, forecastType, period, horizon);
  } catch (error) {
    console.error('Error generating forecast:', error);
    throw error;
  }
}

export async function getForecastingModels(organizationId: string): Promise<ForecastingModel[]> {
  try {
    const { data, error } = await supabase
      .from('forecasting_models')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(model => ({
      id: model.id,
      name: model.name,
      modelType: model.model_type,
      algorithm: model.algorithm,
      config: model.config,
      accuracy: model.accuracy,
      lastTrained: new Date(model.last_trained),
      isActive: model.is_active,
      organizationId: model.organization_id
    }));
  } catch (error) {
    console.error('Error fetching forecasting models:', error);
    return [];
  }
}

// Real-time Analytics
export async function getRealTimeMetrics(organizationId: string): Promise<RealTimeMetric[]> {
  try {
    return await EnterpriseAnalyticsAPI.getRealTimeMetrics(organizationId);
  } catch (error) {
    console.error('Error getting real-time metrics:', error);
    return [];
  }
}

export async function subscribeToRealTimeMetrics(
  organizationId: string,
  callback: (metrics: RealTimeMetric[]) => void
): Promise<() => void> {
  try {
    const subscription = supabase
      .channel('real-time-metrics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activities',
        filter: `organization_id=eq.${organizationId}`
      }, async () => {
        const metrics = await getRealTimeMetrics(organizationId);
        callback(metrics);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error('Error subscribing to real-time metrics:', error);
    return () => {};
  }
}

// Custom Analytics Queries
export async function executeAnalyticsQuery(
  query: string,
  parameters: Record<string, any>,
  organizationId: string,
  userId: string
): Promise<AnalyticsQuery> {
  try {
    return await EnterpriseAnalyticsAPI.executeAnalyticsQuery(query, parameters, organizationId, userId);
  } catch (error) {
    console.error('Error executing analytics query:', error);
    throw error;
  }
}

export async function getAnalyticsQueries(organizationId: string): Promise<AnalyticsQuery[]> {
  try {
    const { data, error } = await supabase
      .from('analytics_queries')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return data.map(query => ({
      id: query.id,
      name: query.name,
      query: query.query,
      parameters: query.parameters,
      result: query.result,
      executionTime: query.execution_time,
      cached: query.cached,
      organizationId: query.organization_id,
      createdBy: query.created_by,
      createdAt: new Date(query.created_at)
    }));
  } catch (error) {
    console.error('Error fetching analytics queries:', error);
    return [];
  }
}

// Executive Reporting
export async function generateExecutiveReport(
  organizationId: string,
  reportType: 'monthly' | 'quarterly' | 'yearly',
  period: Date
): Promise<any> {
  try {
    return await EnterpriseAnalyticsAPI.generateExecutiveReport(organizationId, reportType, period);
  } catch (error) {
    console.error('Error generating executive report:', error);
    throw error;
  }
}

// Data Visualization
export async function getChartData(
  organizationId: string,
  chartType: 'line' | 'bar' | 'pie' | 'scatter' | 'area',
  dataSource: string,
  filters: Record<string, any>
): Promise<any> {
  try {
    let data: any[] = [];

    switch (dataSource) {
      case 'revenue_trend':
        data = await getRevenueTrendData(organizationId, filters);
        break;
      case 'deals_by_stage':
        data = await getDealsByStageData(organizationId, filters);
        break;
      case 'conversion_funnel':
        data = await getConversionFunnelData(organizationId, filters);
        break;
      case 'activity_timeline':
        data = await getActivityTimelineData(organizationId, filters);
        break;
      case 'performance_distribution':
        data = await getPerformanceDistributionData(organizationId, filters);
        break;
      default:
        data = [];
    }

    return {
      chartType,
      dataSource,
      data,
      filters,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting chart data:', error);
    throw error;
  }
}

async function getRevenueTrendData(organizationId: string, filters: any): Promise<any[]> {
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('deal_value, closed_at')
    .eq('organization_id', organizationId)
    .eq('stage', 'closed_won')
    .order('closed_at', { ascending: true });

  // Group by month
  const monthlyData = new Map();
  opportunities?.forEach(opp => {
    const month = new Date(opp.closed_at).toISOString().substring(0, 7);
    const currentValue = monthlyData.get(month) || 0;
    monthlyData.set(month, currentValue + (opp.deal_value || 0));
  });

  return Array.from(monthlyData.entries()).map(([month, revenue]) => ({
    month,
    revenue
  }));
}

async function getDealsByStageData(organizationId: string, filters: any): Promise<any[]> {
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('stage')
    .eq('organization_id', organizationId);

  const stageCounts = new Map();
  opportunities?.forEach(opp => {
    const currentCount = stageCounts.get(opp.stage) || 0;
    stageCounts.set(opp.stage, currentCount + 1);
  });

  return Array.from(stageCounts.entries()).map(([stage, count]) => ({
    stage,
    count
  }));
}

async function getConversionFunnelData(organizationId: string, filters: any): Promise<any[]> {
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('stage')
    .eq('organization_id', organizationId);

  const stages = [
    'prospecting',
    'qualification',
    'needs_analysis',
    'value_proposition',
    'decision_makers',
    'perception_analysis',
    'proposal',
    'negotiation',
    'closed_won'
  ];

  const stageCounts = new Map();
  opportunities?.forEach(opp => {
    const currentCount = stageCounts.get(opp.stage) || 0;
    stageCounts.set(opp.stage, currentCount + 1);
  });

  return stages.map(stage => ({
    stage,
    count: stageCounts.get(stage) || 0
  }));
}

async function getActivityTimelineData(organizationId: string, filters: any): Promise<any[]> {
  const { data: activities } = await supabase
    .from('activities')
    .select('created_at, type')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  // Group by day
  const dailyData = new Map();
  activities?.forEach(activity => {
    const day = new Date(activity.created_at).toISOString().substring(0, 10);
    const currentCount = dailyData.get(day) || 0;
    dailyData.set(day, currentCount + 1);
  });

  return Array.from(dailyData.entries()).map(([day, count]) => ({
    day,
    count
  }));
}

async function getPerformanceDistributionData(organizationId: string, filters: any): Promise<any[]> {
  const { data: performanceMetrics } = await supabase
    .from('performance_metrics')
    .select('metric_value, user_id')
    .eq('organization_id', organizationId)
    .eq('metric_type', 'overall');

  const userPerformance = new Map();
  performanceMetrics?.forEach(metric => {
    const currentValue = userPerformance.get(metric.user_id) || 0;
    userPerformance.set(metric.user_id, currentValue + metric.metric_value);
  });

  return Array.from(userPerformance.entries()).map(([userId, score]) => ({
    userId,
    score
  }));
}

// Analytics Insights
export async function generateAnalyticsInsights(organizationId: string): Promise<any[]> {
  try {
    const insights = [];

    // Get current metrics
    const revenueMetrics = await EnterpriseAnalyticsAPI.calculateRevenueMetrics(organizationId);
    const dealsMetrics = await EnterpriseAnalyticsAPI.calculateDealsMetrics(organizationId);
    const conversionMetrics = await EnterpriseAnalyticsAPI.calculateConversionMetrics(organizationId);

    // Generate insights based on metrics
    if (revenueMetrics.current > revenueMetrics.previous * 1.2) {
      insights.push({
        type: 'positive',
        title: 'Revenue Growth',
        description: `Revenue increased by ${((revenueMetrics.current - revenueMetrics.previous) / revenueMetrics.previous * 100).toFixed(1)}% compared to the previous period`,
        impact: 'high',
        actionable: true,
        recommendations: ['Continue current strategies', 'Scale successful initiatives']
      });
    }

    if (conversionMetrics.current < 15) {
      insights.push({
        type: 'warning',
        title: 'Low Conversion Rate',
        description: `Conversion rate is ${conversionMetrics.current.toFixed(1)}%, which is below industry average`,
        impact: 'high',
        actionable: true,
        recommendations: ['Improve lead qualification', 'Enhance sales training', 'Review sales process']
      });
    }

    if (dealsMetrics.current > dealsMetrics.previous * 1.5) {
      insights.push({
        type: 'positive',
        title: 'Deal Volume Increase',
        description: `Deal volume increased by ${((dealsMetrics.current - dealsMetrics.previous) / dealsMetrics.previous * 100).toFixed(1)}%`,
        impact: 'medium',
        actionable: true,
        recommendations: ['Maintain momentum', 'Ensure quality standards']
      });
    }

    return insights;
  } catch (error) {
    console.error('Error generating analytics insights:', error);
    return [];
  }
}

// Export all functions
export {
  EnterpriseAnalyticsAPI
};
