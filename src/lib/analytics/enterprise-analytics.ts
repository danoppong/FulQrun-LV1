// Enterprise Analytics & Business Intelligence
// Real-time dashboards, predictive forecasting, custom KPI builders, executive reporting suites

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types for enterprise analytics
export interface AnalyticsDashboard {
  id: string;
  dashboardName: string;
  dashboardType: 'executive' | 'operational' | 'compliance' | 'custom' | 'real_time';
  config: Record<string, any>;
  kpis: KPIMetric[];
  filters: Record<string, any>;
  refreshFrequencyMinutes: number;
  isPublic: boolean;
  accessLevel: 'user' | 'department' | 'organization' | 'global';
  organizationId: string;
  createdBy: string;
  createdAt: Date;
}

export interface KPIMetric {
  id: string;
  name: string;
  description: string;
  metricType: 'revenue' | 'deals' | 'conversion' | 'activity' | 'performance' | 'custom';
  calculation: string;
  target: number;
  currentValue: number;
  previousValue: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  format: 'number' | 'percentage' | 'currency' | 'duration';
  color: string;
  isActive: boolean;
}

export interface ForecastingModel {
  id: string;
  name: string;
  modelType: 'revenue' | 'deals' | 'conversion' | 'churn' | 'custom';
  algorithm: 'linear_regression' | 'time_series' | 'machine_learning' | 'custom';
  config: Record<string, any>;
  accuracy: number;
  lastTrained: Date;
  isActive: boolean;
  organizationId: string;
}

export interface AnalyticsQuery {
  id: string;
  name: string;
  query: string;
  parameters: Record<string, unknown>;
  result: Record<string, unknown>;
  executionTime: number;
  cached: boolean;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
}

export interface RealTimeMetric {
  id: string;
  metricName: string;
  value: number;
  timestamp: Date;
  metadata: Record<string, any>;
  organizationId: string;
}

// Enterprise Analytics API
export class EnterpriseAnalyticsAPI {
  // Dashboard Management
  static async createDashboard(
    dashboard: Omit<AnalyticsDashboard, 'id' | 'createdAt'>,
    userId: string
  ): Promise<AnalyticsDashboard> {
    try {
      const { data, error } = await supabase
        .from('enterprise_analytics')
        .insert({
          dashboard_name: dashboard.dashboardName,
          dashboard_type: dashboard.dashboardType,
          config: dashboard.config,
          kpis: dashboard.kpis,
          filters: dashboard.filters,
          refresh_frequency_minutes: dashboard.refreshFrequencyMinutes,
          is_public: dashboard.isPublic,
          access_level: dashboard.accessLevel,
          organization_id: dashboard.organizationId,
          created_by: userId
        })
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
      console.error('Error creating analytics dashboard:', error);
      throw error;
    }
  }

  static async getDashboards(organizationId: string): Promise<AnalyticsDashboard[]> {
    try {
      const { data, error } = await supabase
        .from('enterprise_analytics')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(dashboard => ({
        id: dashboard.id,
        dashboardName: dashboard.dashboard_name,
        dashboardType: dashboard.dashboard_type,
        config: dashboard.config,
        kpis: dashboard.kpis,
        filters: dashboard.filters,
        refreshFrequencyMinutes: dashboard.refresh_frequency_minutes,
        isPublic: dashboard.is_public,
        accessLevel: dashboard.access_level,
        organizationId: dashboard.organization_id,
        createdBy: dashboard.created_by,
        createdAt: new Date(dashboard.created_at)
      }));
    } catch (error) {
      console.error('Error fetching analytics dashboards:', error);
      throw error;
    }
  }

  // KPI Management
  static async calculateKPIs(organizationId: string, kpiIds: string[]): Promise<KPIMetric[]> {
    try {
      const kpis: KPIMetric[] = [];

      for (const kpiId of kpiIds) {
        const kpi = await this.calculateKPIMetric(kpiId, organizationId);
        if (kpi) kpis.push(kpi);
      }

      return kpis;
    } catch (error) {
      console.error('Error calculating KPIs:', error);
      throw error;
    }
  }

  private static async calculateKPIMetric(kpiId: string, organizationId: string): Promise<KPIMetric | null> {
    try {
      // Get KPI definition from dashboard configs
      const { data: dashboards } = await supabase
        .from('enterprise_analytics')
        .select('kpis')
        .eq('organization_id', organizationId);

      let kpiDefinition: Record<string, unknown> | null = null;
      dashboards?.forEach(dashboard => {
        const kpi = dashboard.kpis.find((k: { id: string }) => k.id === kpiId);
        if (kpi) kpiDefinition = kpi;
      });

      if (!kpiDefinition) return null;

      // Calculate current value based on metric type
      let currentValue = 0;
      let previousValue = 0;

      switch (kpiDefinition.metricType) {
        case 'revenue':
          const revenueData = await this.calculateRevenueMetrics(organizationId);
          currentValue = revenueData.current;
          previousValue = revenueData.previous;
          break;
        case 'deals':
          const dealsData = await this.calculateDealsMetrics(organizationId);
          currentValue = dealsData.current;
          previousValue = dealsData.previous;
          break;
        case 'conversion':
          const conversionData = await this.calculateConversionMetrics(organizationId);
          currentValue = conversionData.current;
          previousValue = conversionData.previous;
          break;
        case 'activity':
          const activityData = await this.calculateActivityMetrics(organizationId);
          currentValue = activityData.current;
          previousValue = activityData.previous;
          break;
        case 'performance':
          const performanceData = await this.calculatePerformanceMetrics(organizationId);
          currentValue = performanceData.current;
          previousValue = performanceData.previous;
          break;
        default:
          currentValue = 0;
          previousValue = 0;
      }

      // Calculate trend
      const trend = currentValue > previousValue ? 'up' : 
                   currentValue < previousValue ? 'down' : 'stable';

      return {
        ...kpiDefinition,
        currentValue,
        previousValue,
        trend
      };
    } catch (error) {
      console.error('Error calculating KPI metric:', error);
      return null;
    }
  }

  private static async calculateRevenueMetrics(organizationId: string): Promise<{current: number, previous: number}> {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const { data: currentRevenue } = await supabase
      .from('opportunities')
      .select('deal_value')
      .eq('organization_id', organizationId)
      .eq('stage', 'closed_won')
      .gte('closed_at', currentMonth.toISOString());

    const { data: previousRevenue } = await supabase
      .from('opportunities')
      .select('deal_value')
      .eq('organization_id', organizationId)
      .eq('stage', 'closed_won')
      .gte('closed_at', previousMonth.toISOString())
      .lt('closed_at', currentMonth.toISOString());

    return {
      current: currentRevenue?.reduce((sum, opp) => sum + (opp.deal_value || 0), 0) || 0,
      previous: previousRevenue?.reduce((sum, opp) => sum + (opp.deal_value || 0), 0) || 0
    };
  }

  private static async calculateDealsMetrics(organizationId: string): Promise<{current: number, previous: number}> {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const { data: currentDeals } = await supabase
      .from('opportunities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('stage', 'closed_won')
      .gte('closed_at', currentMonth.toISOString());

    const { data: previousDeals } = await supabase
      .from('opportunities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('stage', 'closed_won')
      .gte('closed_at', previousMonth.toISOString())
      .lt('closed_at', currentMonth.toISOString());

    return {
      current: currentDeals?.length || 0,
      previous: previousDeals?.length || 0
    };
  }

  private static async calculateConversionMetrics(organizationId: string): Promise<{current: number, previous: number}> {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Current month conversion rate
    const { data: currentWon } = await supabase
      .from('opportunities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('stage', 'closed_won')
      .gte('closed_at', currentMonth.toISOString());

    const { data: currentTotal } = await supabase
      .from('opportunities')
      .select('id')
      .eq('organization_id', organizationId)
      .gte('created_at', currentMonth.toISOString());

    // Previous month conversion rate
    const { data: previousWon } = await supabase
      .from('opportunities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('stage', 'closed_won')
      .gte('closed_at', previousMonth.toISOString())
      .lt('closed_at', currentMonth.toISOString());

    const { data: previousTotal } = await supabase
      .from('opportunities')
      .select('id')
      .eq('organization_id', organizationId)
      .gte('created_at', previousMonth.toISOString())
      .lt('created_at', currentMonth.toISOString());

    const currentRate = currentTotal?.length ? (currentWon?.length || 0) / currentTotal.length * 100 : 0;
    const previousRate = previousTotal?.length ? (previousWon?.length || 0) / previousTotal.length * 100 : 0;

    return {
      current: currentRate,
      previous: previousRate
    };
  }

  private static async calculateActivityMetrics(organizationId: string): Promise<{current: number, previous: number}> {
    const now = new Date();
    const currentWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const { data: currentActivities } = await supabase
      .from('activities')
      .select('id')
      .eq('organization_id', organizationId)
      .gte('created_at', currentWeek.toISOString());

    const { data: previousActivities } = await supabase
      .from('activities')
      .select('id')
      .eq('organization_id', organizationId)
      .gte('created_at', previousWeek.toISOString())
      .lt('created_at', currentWeek.toISOString());

    return {
      current: currentActivities?.length || 0,
      previous: previousActivities?.length || 0
    };
  }

  private static async calculatePerformanceMetrics(organizationId: string): Promise<{current: number, previous: number}> {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const { data: currentMetrics } = await supabase
      .from('performance_metrics')
      .select('metric_value')
      .eq('organization_id', organizationId)
      .eq('metric_type', 'overall')
      .gte('period_start', currentMonth.toISOString());

    const { data: previousMetrics } = await supabase
      .from('performance_metrics')
      .select('metric_value')
      .eq('organization_id', organizationId)
      .eq('metric_type', 'overall')
      .gte('period_start', previousMonth.toISOString())
      .lt('period_start', currentMonth.toISOString());

    const currentAvg = currentMetrics?.length ? 
      currentMetrics.reduce((sum, metric) => sum + metric.metric_value, 0) / currentMetrics.length : 0;
    
    const previousAvg = previousMetrics?.length ? 
      previousMetrics.reduce((sum, metric) => sum + metric.metric_value, 0) / previousMetrics.length : 0;

    return {
      current: currentAvg,
      previous: previousAvg
    };
  }

  // Forecasting
  static async generateForecast(
    organizationId: string,
    forecastType: 'revenue' | 'deals' | 'conversion' | 'churn',
    period: 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    horizon: number
  ): Promise<any> {
    try {
      // Get historical data
      const historicalData = await this.getHistoricalData(organizationId, forecastType, period);
      
      // Apply forecasting algorithm
      const forecast = await this.applyForecastingAlgorithm(historicalData, horizon, period);
      
      return {
        forecastType,
        period,
        horizon,
        historicalData,
        predictions: forecast.predictions,
        confidence: forecast.confidence,
        accuracy: forecast.accuracy,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating forecast:', error);
      throw error;
    }
  }

  private static async getHistoricalData(
    organizationId: string,
    forecastType: string,
    period: string
  ): Promise<any[]> {
    const endDate = new Date();
    const startDate = new Date();
    
    // Set start date based on period
    switch (period) {
      case 'weekly':
        startDate.setDate(endDate.getDate() - 12 * 7); // 12 weeks
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 12); // 12 months
        break;
      case 'quarterly':
        startDate.setMonth(endDate.getMonth() - 12); // 4 quarters
        break;
      case 'yearly':
        startDate.setFullYear(endDate.getFullYear() - 5); // 5 years
        break;
    }

    switch (forecastType) {
      case 'revenue':
        const { data: revenueData } = await supabase
          .from('opportunities')
          .select('deal_value, closed_at')
          .eq('organization_id', organizationId)
          .eq('stage', 'closed_won')
          .gte('closed_at', startDate.toISOString())
          .lte('closed_at', endDate.toISOString());
        
        return revenueData || [];
      
      case 'deals':
        const { data: dealsData } = await supabase
          .from('opportunities')
          .select('id, closed_at')
          .eq('organization_id', organizationId)
          .eq('stage', 'closed_won')
          .gte('closed_at', startDate.toISOString())
          .lte('closed_at', endDate.toISOString());
        
        return dealsData || [];
      
      case 'conversion':
        const { data: conversionData } = await supabase
          .from('opportunities')
          .select('id, created_at, closed_at, stage')
          .eq('organization_id', organizationId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        
        return conversionData || [];
      
      default:
        return [];
    }
  }

  private static async applyForecastingAlgorithm(
    historicalData: Array<{
      id: string
      type: string
      timestamp: string
      value: number
      context: Record<string, unknown>
    }>,
    horizon: number,
    period: string
  ): Promise<Record<string, unknown>> {
    // Simple linear regression forecasting
    const dataPoints = historicalData.length;
    if (dataPoints < 2) {
      return {
        predictions: [],
        confidence: 0,
        accuracy: 0
      };
    }

    // Calculate trend
    const x = Array.from({ length: dataPoints }, (_, i) => i);
    const y = historicalData.map((_, i) => historicalData[i].deal_value || 1);
    
    const n = dataPoints;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate predictions
    const predictions = [];
    for (let i = 0; i < horizon; i++) {
      const futureX = dataPoints + i;
      const prediction = slope * futureX + intercept;
      predictions.push({
        period: i + 1,
        value: Math.max(0, prediction), // Ensure non-negative
        confidence: Math.max(0.5, 1 - (i * 0.1)) // Decreasing confidence over time
      });
    }
    
    // Calculate accuracy (simplified)
    const recentData = y.slice(-Math.min(5, dataPoints));
    const recentPredictions = predictions.slice(0, Math.min(5, predictions.length));
    const accuracy = this.calculateAccuracy(recentData, recentPredictions);
    
    return {
      predictions,
      confidence: 0.8, // Base confidence
      accuracy
    };
  }

  private static calculateAccuracy(actual: number[], predicted: Array<{ value: number }>): number {
    if (actual.length === 0 || predicted.length === 0) return 0;
    
    let totalError = 0;
    const minLength = Math.min(actual.length, predicted.length);
    
    for (let i = 0; i < minLength; i++) {
      const error = Math.abs(actual[i] - predicted[i].value);
      totalError += error / Math.max(actual[i], 1); // Normalize by actual value
    }
    
    return Math.max(0, 1 - (totalError / minLength));
  }

  // Real-time Analytics
  static async getRealTimeMetrics(organizationId: string): Promise<RealTimeMetric[]> {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Get real-time metrics from various sources
      const metrics: RealTimeMetric[] = [];

      // Active users
      const { data: activeUsers } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', organizationId)
        .gte('last_login_at', fiveMinutesAgo.toISOString());

      metrics.push({
        id: crypto.randomUUID(),
        metricName: 'active_users',
        value: activeUsers?.length || 0,
        timestamp: now,
        metadata: { source: 'users' },
        organizationId
      });

      // Recent activities
      const { data: recentActivities } = await supabase
        .from('activities')
        .select('id')
        .eq('organization_id', organizationId)
        .gte('created_at', fiveMinutesAgo.toISOString());

      metrics.push({
        id: crypto.randomUUID(),
        metricName: 'recent_activities',
        value: recentActivities?.length || 0,
        timestamp: now,
        metadata: { source: 'activities' },
        organizationId
      });

      // Pipeline value
      const { data: pipelineValue } = await supabase
        .from('opportunities')
        .select('deal_value')
        .eq('organization_id', organizationId)
        .not('stage', 'in', ['closed_won', 'closed_lost']);

      const totalPipelineValue = pipelineValue?.reduce((sum, opp) => sum + (opp.deal_value || 0), 0) || 0;

      metrics.push({
        id: crypto.randomUUID(),
        metricName: 'pipeline_value',
        value: totalPipelineValue,
        timestamp: now,
        metadata: { source: 'opportunities' },
        organizationId
      });

      return metrics;
    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      return [];
    }
  }

  // Custom Analytics Queries
  static async executeAnalyticsQuery(
    query: string,
    parameters: Record<string, any>,
    organizationId: string,
    userId: string
  ): Promise<AnalyticsQuery> {
    try {
      const startTime = Date.now();
      
      // Execute query (simplified - in real implementation, this would be more sophisticated)
      let result: Record<string, unknown> = {};
      
      if (query.includes('SELECT')) {
        // Parse and execute SQL-like query
        result = await this.executeSQLQuery(query, parameters, organizationId);
      } else {
        // Execute custom analytics function
        result = await this.executeCustomAnalytics(query, parameters, organizationId);
      }
      
      const executionTime = Date.now() - startTime;
      
      // Store query result
      const { data, error } = await supabase
        .from('analytics_queries')
        .insert({
          name: `Query ${Date.now()}`,
          query,
          parameters,
          result,
          execution_time: executionTime,
          cached: false,
          organization_id: organizationId,
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        query: data.query,
        parameters: data.parameters,
        result: data.result,
        executionTime: data.execution_time,
        cached: data.cached,
        organizationId: data.organization_id,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error executing analytics query:', error);
      throw error;
    }
  }

  private static async executeSQLQuery(
    query: string,
    parameters: Record<string, any>,
    organizationId: string
  ): Promise<any> {
    // Simplified SQL query execution
    // In a real implementation, this would parse SQL and execute against Supabase
    
    if (query.includes('opportunities')) {
      const { data } = await supabase
        .from('opportunities')
        .select('*')
        .eq('organization_id', organizationId);
      return data;
    }
    
    if (query.includes('contacts')) {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', organizationId);
      return data;
    }
    
    return [];
  }

  private static async executeCustomAnalytics(
    query: string,
    parameters: Record<string, any>,
    organizationId: string
  ): Promise<any> {
    // Execute custom analytics functions
    switch (query) {
      case 'sales_performance_by_user':
        return await this.getSalesPerformanceByUser(organizationId, parameters);
      case 'conversion_funnel':
        return await this.getConversionFunnel(organizationId, parameters);
      case 'customer_lifetime_value':
        return await this.getCustomerLifetimeValue(organizationId, parameters);
      default:
        return {};
    }
  }

  private static async getSalesPerformanceByUser(organizationId: string, parameters: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data: users } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('organization_id', organizationId);

    const performance = [];
    
    for (const user of users || []) {
      const { data: opportunities } = await supabase
        .from('opportunities')
        .select('deal_value, stage')
        .eq('organization_id', organizationId)
        .eq('assigned_to', user.id);

      const wonDeals = opportunities?.filter(opp => opp.stage === 'closed_won') || [];
      const totalRevenue = wonDeals.reduce((sum, opp) => sum + (opp.deal_value || 0), 0);
      
      performance.push({
        userId: user.id,
        userName: `${user.first_name} ${user.last_name}`,
        totalDeals: opportunities?.length || 0,
        wonDeals: wonDeals.length,
        totalRevenue,
        conversionRate: opportunities?.length ? (wonDeals.length / opportunities.length) * 100 : 0
      });
    }
    
    return performance;
  }

  private static async getConversionFunnel(organizationId: string, parameters: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('stage')
      .eq('organization_id', organizationId);

    const funnel = {
      prospecting: 0,
      qualification: 0,
      needs_analysis: 0,
      value_proposition: 0,
      decision_makers: 0,
      perception_analysis: 0,
      proposal: 0,
      negotiation: 0,
      closed_won: 0,
      closed_lost: 0
    };

    opportunities?.forEach(opp => {
      if (funnel.hasOwnProperty(opp.stage)) {
        funnel[opp.stage as keyof typeof funnel]++;
      }
    });

    return funnel;
  }

  private static async getCustomerLifetimeValue(organizationId: string, parameters: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('deal_value, company_id, closed_at')
      .eq('organization_id', organizationId)
      .eq('stage', 'closed_won');

    const customerValue = new Map();
    
    opportunities?.forEach(opp => {
      if (opp.company_id) {
        const currentValue = customerValue.get(opp.company_id) || 0;
        customerValue.set(opp.company_id, currentValue + (opp.deal_value || 0));
      }
    });

    return Array.from(customerValue.entries()).map(([companyId, value]) => ({
      companyId,
      lifetimeValue: value
    }));
  }

  // Executive Reporting
  static async generateExecutiveReport(
    organizationId: string,
    reportType: 'monthly' | 'quarterly' | 'yearly',
    period: Date
  ): Promise<any> {
    try {
      const report = {
        reportType,
        period: period.toISOString(),
        generatedAt: new Date().toISOString(),
        summary: {},
        metrics: {},
        insights: [] as string[],
        recommendations: [] as string[]
      };

      // Generate summary metrics
      const revenueMetrics = await this.calculateRevenueMetrics(organizationId);
      const dealsMetrics = await this.calculateDealsMetrics(organizationId);
      const conversionMetrics = await this.calculateConversionMetrics(organizationId);

      report.summary = {
        totalRevenue: revenueMetrics.current,
        totalDeals: dealsMetrics.current,
        conversionRate: conversionMetrics.current,
        revenueGrowth: ((revenueMetrics.current - revenueMetrics.previous) / revenueMetrics.previous) * 100,
        dealsGrowth: ((dealsMetrics.current - dealsMetrics.previous) / dealsMetrics.previous) * 100
      };

      // Generate detailed metrics
      report.metrics = {
        revenue: revenueMetrics,
        deals: dealsMetrics,
        conversion: conversionMetrics,
        performance: await this.calculatePerformanceMetrics(organizationId),
        activity: await this.calculateActivityMetrics(organizationId)
      };

      // Generate insights
      report.insights = await this.generateInsights(organizationId, report.metrics);

      // Generate recommendations
      report.recommendations = await this.generateRecommendations(organizationId, report.metrics);

      return report;
    } catch (error) {
      console.error('Error generating executive report:', error);
      throw error;
    }
  }

  private static async generateInsights(organizationId: string, metrics: any): Promise<string[]> {
    const insights = [];

    if (metrics.revenue.current > metrics.revenue.previous) {
      insights.push(`Revenue increased by ${((metrics.revenue.current - metrics.revenue.previous) / metrics.revenue.previous * 100).toFixed(1)}% compared to the previous period`);
    }

    if (metrics.conversion.current > metrics.conversion.previous) {
      insights.push(`Conversion rate improved by ${(metrics.conversion.current - metrics.conversion.previous).toFixed(1)} percentage points`);
    }

    if (metrics.activity.current > metrics.activity.previous) {
      insights.push(`Activity levels increased by ${((metrics.activity.current - metrics.activity.previous) / metrics.activity.previous * 100).toFixed(1)}%`);
    }

    return insights;
  }

  private static async generateRecommendations(organizationId: string, metrics: any): Promise<string[]> {
    const recommendations = [];

    if (metrics.conversion.current < 20) {
      recommendations.push('Focus on improving lead qualification processes to increase conversion rates');
    }

    if (metrics.activity.current < metrics.activity.previous) {
      recommendations.push('Increase sales activity and engagement to drive more opportunities');
    }

    if (metrics.performance.current < 70) {
      recommendations.push('Implement additional training and coaching programs to improve team performance');
    }

    return recommendations;
  }
}

export default EnterpriseAnalyticsAPI;
