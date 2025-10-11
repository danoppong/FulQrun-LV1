import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireApiAuth } from '@/lib/security/api-auth'
import { AuthService } from '@/lib/auth-unified'
import { z } from 'zod';
// types imported in submodules if needed

type Supa = ReturnType<typeof createServerClient>
interface ReportParams {
  organizationId: string
  userId?: string | null
  territoryId?: string | null
  reportType?: 'executive' | 'territory' | 'rep' | 'trends'
}

interface KPIData {
  win_rate?: { win_rate?: number }
  revenue_growth?: { current_period_revenue?: number; growth_percentage?: number }
  quota_attainment?: { attainment_percentage?: number }
  sales_cycle_length?: { avg_cycle_length?: number }
  activities_per_rep?: { activities_per_day?: number }
  [key: string]: unknown
}

// Validation schemas
const ReportQuerySchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  territoryId: z.string().uuid().optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  reportType: z.enum(['executive', 'territory', 'rep', 'trends']).optional()
});
type ReportQueryType = z.infer<typeof ReportQuerySchema>

// Note: export schema unused in this route; keep definitions in export subroute

// GET /api/kpis/reports - Generate comprehensive reports
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if (!auth.ok) return auth.response
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryParams = {
      organizationId: searchParams.get('organizationId'),
      userId: searchParams.get('userId'),
      territoryId: searchParams.get('territoryId'),
      periodStart: searchParams.get('periodStart'),
      periodEnd: searchParams.get('periodEnd'),
      reportType: searchParams.get('reportType') || 'executive'
    };

  const validatedParams: ReportQueryType = ReportQuerySchema.parse(queryParams);
    
    // Set default date range if not provided
    const periodStart = validatedParams.periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const periodEnd = validatedParams.periodEnd || new Date().toISOString().split('T')[0];

    // Check if user has access to organization
    const user = await AuthService.getCurrentUserServer()
    if (!user?.profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.profile.organization_id !== validatedParams.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate report data based on type
    let reportData;
    const paramsForReport: ReportParams = {
      organizationId: validatedParams.organizationId,
      userId: validatedParams.userId ?? null,
      territoryId: validatedParams.territoryId ?? null,
      reportType: validatedParams.reportType,
    }

    switch (validatedParams.reportType) {
      case 'executive':
        reportData = await generateExecutiveReport(supabase, paramsForReport, periodStart, periodEnd);
        break;
      case 'territory':
        reportData = await generateTerritoryReport(supabase, paramsForReport, periodStart, periodEnd);
        break;
      case 'rep':
        reportData = await generateRepReport(supabase, paramsForReport, periodStart, periodEnd);
        break;
      case 'trends':
        reportData = await generateTrendReport(supabase, paramsForReport, periodStart, periodEnd);
        break;
      default:
        reportData = await generateExecutiveReport(supabase, paramsForReport, periodStart, periodEnd);
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      metadata: {
        organizationId: validatedParams.organizationId,
        userId: validatedParams.userId,
        territoryId: validatedParams.territoryId,
        periodStart,
        periodEnd,
        reportType: validatedParams.reportType,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Report Generation Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to generate executive report
async function generateExecutiveReport(supabase: Supa, params: ReportParams, periodStart: string, periodEnd: string) {
  // Calculate all KPIs for executive summary
  // @ts-expect-error Supabase client rpc typing varies; cast to unknown for runtime call
  const rpcRes = await (supabase as unknown).rpc('calculate_all_kpis', {
    p_organization_id: params.organizationId,
    p_user_id: params.userId || null,
    p_territory_id: params.territoryId || null,
    p_period_start: periodStart,
    p_period_end: periodEnd
  });
  const kpiData = rpcRes.data as KPIData | null
  const kpiError = rpcRes.error as unknown

  if (kpiError) {
    console.error('Error calculating KPIs:', kpiError);
    throw new Error('Failed to calculate KPIs');
  }

  // Get top performers
  const { data: topPerformers, error: performersError } = await supabase
    .from('users')
    .select(`
      id,
      first_name,
      last_name,
      quota_attainment_metrics!inner(
        actual_achievement,
        attainment_percentage
      )
    `)
    .eq('organization_id', params.organizationId)
    .gte('quota_attainment_metrics.period_start', periodStart)
    .lte('quota_attainment_metrics.period_end', periodEnd)
    .order('quota_attainment_metrics.actual_achievement', { ascending: false })
    .limit(5);

  if (performersError) {
    console.error('Error fetching top performers:', performersError);
  }

  // Generate key insights
  const keyInsights = generateKeyInsights(kpiData ?? {});

  return {
    executive_summary: {
      total_revenue: kpiData.revenue_growth?.current_period_revenue || 0,
      revenue_growth: kpiData.revenue_growth?.growth_percentage || 0,
      win_rate: kpiData.win_rate?.win_rate || 0,
      quota_attainment: kpiData.quota_attainment?.attainment_percentage || 0,
      top_performers: (topPerformers || []).map((performer: { first_name: string; last_name: string; quota_attainment_metrics?: Array<{ actual_achievement?: number }> }) => ({
        name: `${performer.first_name} ${performer.last_name}`,
        revenue: performer.quota_attainment_metrics?.[0]?.actual_achievement || 0,
        win_rate: 0 // Would need additional calculation
      })),
        key_insights: keyInsights
    },
    territory_performance: await getTerritoryPerformance(supabase, params, periodStart, periodEnd),
    rep_scorecards: await getRepScorecards(supabase, params, periodStart, periodEnd),
    trend_analysis: await getTrendAnalysis(supabase, params, periodStart, periodEnd),
    kpi_breakdown: await getKPIBreakdown(supabase, params, periodStart, periodEnd)
  };
}

// Helper function to generate territory report
async function generateTerritoryReport(supabase: Supa, params: ReportParams, periodStart: string, periodEnd: string) {
  const territoryPerformance = await getTerritoryPerformance(supabase, params, periodStart, periodEnd);
  
  return {
    territory_performance: territoryPerformance,
    territory_comparison: await getTerritoryComparison(supabase, params, periodStart, periodEnd),
    territory_trends: await getTerritoryTrends(supabase, params, periodStart, periodEnd)
  };
}

// Helper function to generate rep report
async function generateRepReport(supabase: Supa, params: ReportParams, periodStart: string, periodEnd: string) {
  const repScorecards = await getRepScorecards(supabase, params, periodStart, periodEnd);
  
  return {
    rep_scorecards: repScorecards,
    rep_ranking: await getRepRanking(supabase, params, periodStart, periodEnd),
    rep_activities: await getRepActivities(supabase, params, periodStart, periodEnd)
  };
}

// Helper function to generate trend report
async function generateTrendReport(supabase: Supa, params: ReportParams, periodStart: string, periodEnd: string) {
  const trendAnalysis = await getTrendAnalysis(supabase, params, periodStart, periodEnd);
  
  return {
    trend_analysis: trendAnalysis,
    seasonal_patterns: await getSeasonalPatterns(supabase, params, periodStart, periodEnd),
    forecast_data: await getForecastData(supabase, params, periodStart, periodEnd)
  };
}

// Helper function to get territory performance
async function getTerritoryPerformance(supabase: Supa, params: ReportParams, periodStart: string, periodEnd: string) {
  const { data, error } = await supabase
    .from('sales_territories')
    .select(`
      id,
      name,
      assigned_user_id,
      users!inner(
        quota_attainment_metrics!inner(
          actual_achievement,
          attainment_percentage,
          quota_target
        ),
        win_rate_metrics!inner(
          win_rate,
          won_opportunities,
          total_opportunities
        )
      )
    `)
    .eq('organization_id', params.organizationId)
    .gte('quota_attainment_metrics.period_start', periodStart)
    .lte('quota_attainment_metrics.period_end', periodEnd);

  if (error) {
    console.error('Error fetching territory performance:', error);
    return [];
  }

  type Territory = { name: string; users?: Array<{ quota_attainment_metrics?: Array<{ actual_achievement?: number; attainment_percentage?: number }>; win_rate_metrics?: Array<{ win_rate?: number }> }> }
  return (data || []).map((territory: Territory) => ({
    territory_name: territory.name,
    revenue: territory.users?.[0]?.quota_attainment_metrics?.[0]?.actual_achievement || 0,
    win_rate: territory.users?.[0]?.win_rate_metrics?.[0]?.win_rate || 0,
    quota_attainment: territory.users?.[0]?.quota_attainment_metrics?.[0]?.attainment_percentage || 0,
    rep_count: territory.users?.length || 0,
    growth_rate: 0 // Would need historical comparison
  }));
}

// Helper function to get rep scorecards
async function getRepScorecards(supabase: Supa, params: ReportParams, periodStart: string, periodEnd: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      first_name,
      last_name,
      sales_territories!inner(name),
      quota_attainment_metrics!inner(
        actual_achievement,
        attainment_percentage,
        quota_target
      ),
      win_rate_metrics!inner(
        win_rate,
        won_opportunities,
        total_opportunities
      ),
      avg_deal_size_metrics!inner(
        avg_deal_size,
        total_deals
      ),
      sales_cycle_metrics!inner(
        avg_cycle_length
      ),
      activities_per_rep_metrics!inner(
        activities_per_day,
        total_activities
      )
    `)
    .eq('organization_id', params.organizationId)
    .gte('quota_attainment_metrics.period_start', periodStart)
    .lte('quota_attainment_metrics.period_end', periodEnd);

  if (error) {
    console.error('Error fetching rep scorecards:', error);
    return [];
  }

  type Rep = {
    first_name: string
    last_name: string
    sales_territories?: Array<{ name: string }>
    quota_attainment_metrics?: Array<{ actual_achievement?: number; attainment_percentage?: number }>
    win_rate_metrics?: Array<{ win_rate?: number }>
    avg_deal_size_metrics?: Array<{ avg_deal_size?: number }>
    sales_cycle_metrics?: Array<{ avg_cycle_length?: number }>
    activities_per_rep_metrics?: Array<{ activities_per_day?: number }>
  }
  return (data || []).map((rep: Rep) => ({
    rep_name: `${rep.first_name} ${rep.last_name}`,
    territory: rep.sales_territories?.[0]?.name || 'Unassigned',
    revenue: rep.quota_attainment_metrics?.[0]?.actual_achievement || 0,
    win_rate: rep.win_rate_metrics?.[0]?.win_rate || 0,
    quota_attainment: rep.quota_attainment_metrics?.[0]?.attainment_percentage || 0,
    activities_per_day: rep.activities_per_rep_metrics?.[0]?.activities_per_day || 0,
    avg_deal_size: rep.avg_deal_size_metrics?.[0]?.avg_deal_size || 0,
    sales_cycle_length: rep.sales_cycle_metrics?.[0]?.avg_cycle_length || 0,
    performance_tier: getPerformanceTier(rep.quota_attainment_metrics?.[0]?.attainment_percentage || 0)
  }));
}

// Helper function to get trend analysis
async function getTrendAnalysis(supabase: Supa, params: ReportParams, _periodStart: string, _periodEnd: string) {
  // Get historical data for trend analysis
  const { data, error } = await supabase
    .from('kpi_calculated_values')
    .select('*')
    .eq('organization_id', params.organizationId)
    .gte('calculation_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('calculation_date', { ascending: true });

  if (error) {
    console.error('Error fetching trend analysis:', error);
    return [];
  }

  // Group by period and calculate averages
  interface TrendItem { calculation_date: string; calculated_value: number }
  interface AccItem { period: string; revenue: number; win_rate: number; quota_attainment: number; activities: number; count: number }
  const groupedData = (data || []).reduce((acc: Record<string, AccItem>, item: TrendItem) => {
    const period = item.calculation_date.split('T')[0];
    if (!acc[period]) {
      acc[period] = {
        period,
        revenue: 0,
        win_rate: 0,
        quota_attainment: 0,
        activities: 0,
        count: 0
      };
    }
    acc[period].revenue += item.calculated_value;
    acc[period].count += 1;
    return acc;
  }, {});

  return Object.values(groupedData).map((item: AccItem) => ({
    period: item.period,
    revenue: item.revenue / item.count,
    win_rate: 0, // Would need specific KPI filtering
    quota_attainment: 0, // Would need specific KPI filtering
    activities: 0 // Would need specific KPI filtering
  }));
}

// Helper function to get KPI breakdown
async function getKPIBreakdown(supabase: Supa, params: ReportParams, periodStart: string, periodEnd: string) {
  const kpiNames = [
    'win_rate',
    'revenue_growth',
    'avg_deal_size',
    'sales_cycle_length',
    'lead_conversion_rate',
    'cac',
    'quota_attainment',
    'clv',
    'pipeline_coverage',
    'activities_per_rep'
  ];

  const breakdown = [];

  for (const kpiName of kpiNames) {
  // @ts-expect-error Supabase client rpc typing varies per function
    const { data, error } = await (supabase as unknown).rpc(`calculate_${kpiName}`, {
      p_organization_id: params.organizationId,
      p_user_id: params.userId || null,
      p_territory_id: params.territoryId || null,
      p_period_start: periodStart,
      p_period_end: periodEnd
    });

    if (!error && data) {
      const value = extractKPIValue(data, kpiName);
      breakdown.push({
        kpi_name: kpiName,
        current_value: value,
        target_value: getTargetValue(kpiName),
        performance_tier: getPerformanceTier(value),
        trend: 'stable' // Would need historical comparison
      });
    }
  }

  return breakdown;
}

// Helper function to generate key insights
function generateKeyInsights(kpiData: KPIData): string[] {
  const insights = [];

  if (kpiData?.win_rate?.win_rate && kpiData.win_rate.win_rate > 25) {
    insights.push('Win rate is above industry average, indicating strong sales effectiveness');
  } else if (kpiData?.win_rate?.win_rate && kpiData.win_rate.win_rate < 15) {
    insights.push('Win rate is below industry average, consider improving qualification process');
  }

  if (kpiData?.revenue_growth?.growth_percentage && kpiData.revenue_growth.growth_percentage > 20) {
    insights.push('Strong revenue growth indicates healthy business expansion');
  } else if (kpiData?.revenue_growth?.growth_percentage && kpiData.revenue_growth.growth_percentage < 5) {
    insights.push('Revenue growth is slow, consider reviewing sales strategies');
  }

  if (kpiData?.quota_attainment?.attainment_percentage && kpiData.quota_attainment.attainment_percentage > 100) {
    insights.push('Team is exceeding quota targets, consider increasing goals for next period');
  } else if (kpiData?.quota_attainment?.attainment_percentage && kpiData.quota_attainment.attainment_percentage < 80) {
    insights.push('Quota attainment is below target, additional support may be needed');
  }

  if (kpiData?.sales_cycle_length?.avg_cycle_length && kpiData.sales_cycle_length.avg_cycle_length > 90) {
    insights.push('Sales cycle is longer than optimal, focus on qualification and acceleration');
  }

  if (kpiData?.activities_per_rep?.activities_per_day && kpiData.activities_per_rep.activities_per_day < 10) {
    insights.push('Activity levels are low, consider implementing activity tracking and coaching');
  }

  return insights.length > 0 ? insights : ['Performance metrics are within normal ranges'];
}

// Helper function to get performance tier
function getPerformanceTier(value: number): string {
  if (value >= 120) return 'excellent';
  if (value >= 100) return 'good';
  if (value >= 80) return 'average';
  return 'below_average';
}

// Helper function to extract KPI value
function extractKPIValue(data: unknown, kpiName: string): number {
  switch (kpiName) {
    case 'win_rate':
      // @ts-expect-error loose typing for RPC results
      return data?.win_rate || 0;
    case 'revenue_growth':
      // @ts-expect-error loose typing for RPC results
      return data?.growth_percentage || 0;
    case 'avg_deal_size':
      // @ts-expect-error loose typing for RPC results
      return data?.avg_deal_size || 0;
    case 'sales_cycle_length':
      // @ts-expect-error loose typing for RPC results
      return data?.avg_cycle_length || 0;
    case 'lead_conversion_rate':
      // @ts-expect-error loose typing for RPC results
      return data?.conversion_rate || 0;
    case 'cac':
      // @ts-expect-error loose typing for RPC results
      return data?.cac || 0;
    case 'quota_attainment':
      // @ts-expect-error loose typing for RPC results
      return data?.attainment_percentage || 0;
    case 'clv':
      // @ts-expect-error loose typing for RPC results
      return data?.clv || 0;
    case 'pipeline_coverage':
      // @ts-expect-error loose typing for RPC results
      return data?.coverage_ratio || 0;
    case 'activities_per_rep':
      // @ts-expect-error loose typing for RPC results
      return data?.activities_per_day || 0;
    default:
      return 0;
  }
}

// Helper function to get target value
function getTargetValue(kpiName: string): number {
  const targets: Record<string, number> = {
    win_rate: 25,
    revenue_growth: 15,
    avg_deal_size: 150000,
    sales_cycle_length: 60,
    lead_conversion_rate: 3,
    cac: 10000,
    quota_attainment: 100,
    clv: 100000,
    pipeline_coverage: 3,
    activities_per_rep: 15
  };
  return targets[kpiName] || 0;
}

// Additional helper functions for other report types
async function getTerritoryComparison(_supabase: unknown, _params: unknown, _periodStart: string, _periodEnd: string) {
  // Implementation for territory comparison
  return [];
}

async function getTerritoryTrends(_supabase: unknown, _params: unknown, _periodStart: string, _periodEnd: string) {
  // Implementation for territory trends
  return [];
}

async function getRepRanking(_supabase: unknown, _params: unknown, _periodStart: string, _periodEnd: string) {
  // Implementation for rep ranking
  return [];
}

async function getRepActivities(_supabase: unknown, _params: unknown, _periodStart: string, _periodEnd: string) {
  // Implementation for rep activities
  return [];
}

async function getSeasonalPatterns(_supabase: unknown, _params: unknown, _periodStart: string, _periodEnd: string) {
  // Implementation for seasonal patterns
  return [];
}

async function getForecastData(_supabase: unknown, _params: unknown, _periodStart: string, _periodEnd: string) {
  // Implementation for forecast data
  return [];
}
