import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireApiAuth } from '@/lib/security/api-auth'
import { AuthService } from '@/lib/auth-unified'
import { z } from 'zod';

// Validation schema
const _ExportQuerySchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  territoryId: z.string().uuid().optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  reportType: z.enum(['executive', 'territory', 'rep', 'trends']),
  format: z.enum(['pdf', 'excel', 'csv'])
});

// GET /api/kpis/reports/export - Export reports in various formats
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
      reportType: searchParams.get('reportType'),
      format: searchParams.get('format')
    };

  const validatedParams = _ExportQuerySchema.parse(queryParams);
    
    // Set default date range if not provided
    const periodStart = validatedParams.periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const periodEnd = validatedParams.periodEnd || new Date().toISOString().split('T')[0];

    // Check if user has access to organization
    const user = await AuthService.getCurrentUserServer()
    if (!user?.profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.profile.organization_id !== validatedParams.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate report data
    const reportData = await generateReportData(supabase, validatedParams, periodStart, periodEnd);

    // Export based on format
    let exportResult;
    switch (validatedParams.format) {
      case 'csv':
        exportResult = await exportToCSV(reportData, validatedParams.reportType);
        break;
      case 'excel':
        exportResult = await exportToExcel(reportData, validatedParams.reportType);
        break;
      case 'pdf':
        exportResult = await exportToPDF(reportData, validatedParams.reportType);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    return new NextResponse(exportResult.content, {
      headers: {
        'Content-Type': exportResult.contentType,
        'Content-Disposition': `attachment; filename="${exportResult.filename}"`,
      },
    });

  } catch (error) {
    console.error('Export Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to generate report data
async function generateReportData(supabase: unknown, params: unknown, periodStart: string, periodEnd: string) {
  // Calculate all KPIs
  const { data: kpiData, error: kpiError } = await supabase.rpc('calculate_all_kpis', {
    p_organization_id: params.organizationId,
    p_user_id: params.userId || null,
    p_territory_id: params.territoryId || null,
    p_period_start: periodStart,
    p_period_end: periodEnd
  });

  if (kpiError) {
    console.error('Error calculating KPIs:', kpiError);
    throw new Error('Failed to calculate KPIs');
  }

  // Get additional data based on report type
  let additionalData = {};
  switch (params.reportType) {
    case 'executive':
      additionalData = await getExecutiveData(supabase, params, periodStart, periodEnd);
      break;
    case 'territory':
      additionalData = await getTerritoryData(supabase, params, periodStart, periodEnd);
      break;
    case 'rep':
      additionalData = await getRepData(supabase, params, periodStart, periodEnd);
      break;
    case 'trends':
      additionalData = await getTrendData(supabase, params, periodStart, periodEnd);
      break;
  }

  return {
    kpiData,
    additionalData,
    metadata: {
      organizationId: params.organizationId,
      userId: params.userId,
      territoryId: params.territoryId,
      periodStart,
      periodEnd,
      reportType: params.reportType,
      generatedAt: new Date().toISOString()
    }
  };
}

// Helper function to export to CSV
async function exportToCSV(data: unknown, reportType: string) {
  let csvContent = '';
  
  switch (reportType) {
    case 'executive':
      csvContent = generateExecutiveCSV(data);
      break;
    case 'territory':
      csvContent = generateTerritoryCSV(data);
      break;
    case 'rep':
      csvContent = generateRepCSV(data);
      break;
    case 'trends':
      csvContent = generateTrendsCSV(data);
      break;
    default:
      csvContent = generateDefaultCSV(data);
  }

  return {
    content: csvContent,
    contentType: 'text/csv',
    filename: `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`
  };
}

// Helper function to export to Excel
async function exportToExcel(data: unknown, reportType: string) {
  // For Excel export, we would use a library like 'xlsx'
  // This is a simplified implementation
  const csvContent = await exportToCSV(data, reportType);
  
  return {
    content: csvContent.content,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: `${reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`
  };
}

// Helper function to export to PDF
async function exportToPDF(data: unknown, reportType: string) {
  // For PDF export, we would use a library like 'puppeteer' or 'jsPDF'
  // This is a simplified implementation that returns HTML for now
  const htmlContent = generatePDFHTML(data, reportType);
  
  return {
    content: htmlContent,
    contentType: 'text/html',
    filename: `${reportType}-report-${new Date().toISOString().split('T')[0]}.html`
  };
}

// Helper functions to generate CSV content
function generateExecutiveCSV(data: unknown): string {
  const headers = [
    'Metric',
    'Current Value',
    'Previous Value',
    'Change %',
    'Target',
    'Performance Tier'
  ];

  const rows = [
    ['Win Rate', data.kpiData.win_rate?.win_rate || 0, '', '', '25%', ''],
    ['Revenue Growth', data.kpiData.revenue_growth?.growth_percentage || 0, '', '', '15%', ''],
    ['Average Deal Size', data.kpiData.avg_deal_size?.avg_deal_size || 0, '', '', '$150,000', ''],
    ['Sales Cycle Length', data.kpiData.sales_cycle_length?.avg_cycle_length || 0, '', '', '60 days', ''],
    ['Lead Conversion Rate', data.kpiData.lead_conversion_rate?.conversion_rate || 0, '', '', '3%', ''],
    ['Customer Acquisition Cost', data.kpiData.cac?.cac || 0, '', '', '$10,000', ''],
    ['Quota Attainment', data.kpiData.quota_attainment?.attainment_percentage || 0, '', '', '100%', ''],
    ['Customer Lifetime Value', data.kpiData.clv?.clv || 0, '', '', '$100,000', ''],
    ['Pipeline Coverage', data.kpiData.pipeline_coverage?.coverage_ratio || 0, '', '', '3x', ''],
    ['Activities per Rep', data.kpiData.activities_per_rep?.activities_per_day || 0, '', '', '15', '']
  ];

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateTerritoryCSV(data: unknown): string {
  const headers = [
    'Territory',
    'Revenue',
    'Win Rate',
    'Quota Attainment',
    'Rep Count',
    'Growth Rate'
  ];

  const rows = (data.additionalData.territories || []).map((territory: unknown) => [
    territory.name,
    territory.revenue,
    territory.win_rate,
    territory.quota_attainment,
    territory.rep_count,
    territory.growth_rate
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateRepCSV(data: unknown): string {
  const headers = [
    'Rep Name',
    'Territory',
    'Revenue',
    'Win Rate',
    'Quota Attainment',
    'Activities/Day',
    'Avg Deal Size',
    'Sales Cycle Length',
    'Performance Tier'
  ];

  const rows = (data.additionalData.reps || []).map((rep: unknown) => [
    rep.name,
    rep.territory,
    rep.revenue,
    rep.win_rate,
    rep.quota_attainment,
    rep.activities_per_day,
    rep.avg_deal_size,
    rep.sales_cycle_length,
    rep.performance_tier
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateTrendsCSV(data: unknown): string {
  const headers = [
    'Period',
    'Revenue',
    'Win Rate',
    'Quota Attainment',
    'Activities'
  ];

  const rows = (data.additionalData.trends || []).map((trend: unknown) => [
    trend.period,
    trend.revenue,
    trend.win_rate,
    trend.quota_attainment,
    trend.activities
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateDefaultCSV(data: unknown): string {
  return generateExecutiveCSV(data);
}

// Helper function to generate PDF HTML
function generatePDFHTML(data: unknown, reportType: string): string {
  const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
  const generatedAt = new Date().toLocaleString();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .metric { margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; }
        .metric-title { font-weight: bold; font-size: 16px; }
        .metric-value { font-size: 24px; color: #333; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Generated on ${generatedAt}</p>
      </div>
      
      <div class="metrics">
        <div class="metric">
          <div class="metric-title">Win Rate</div>
          <div class="metric-value">${data.kpiData.win_rate?.win_rate || 0}%</div>
        </div>
        
        <div class="metric">
          <div class="metric-title">Revenue Growth</div>
          <div class="metric-value">${data.kpiData.revenue_growth?.growth_percentage || 0}%</div>
        </div>
        
        <div class="metric">
          <div class="metric-title">Average Deal Size</div>
          <div class="metric-value">$${data.kpiData.avg_deal_size?.avg_deal_size || 0}</div>
        </div>
        
        <div class="metric">
          <div class="metric-title">Sales Cycle Length</div>
          <div class="metric-value">${data.kpiData.sales_cycle_length?.avg_cycle_length || 0} days</div>
        </div>
        
        <div class="metric">
          <div class="metric-title">Quota Attainment</div>
          <div class="metric-value">${data.kpiData.quota_attainment?.attainment_percentage || 0}%</div>
        </div>
      </div>
      
      <div class="footer">
        <p>This report was generated by FulQrun Sales Performance Management System</p>
      </div>
    </body>
    </html>
  `;
}

// Helper functions to get additional data
async function getExecutiveData(supabase: unknown, params: unknown, periodStart: string, periodEnd: string) {
  // Get top performers and key insights
  const { data: topPerformers } = await supabase
    .from('users')
    .select(`
      id,
      first_name,
      last_name,
      quota_attainment_metrics!inner(actual_achievement)
    `)
    .eq('organization_id', params.organizationId)
    .gte('quota_attainment_metrics.period_start', periodStart)
    .lte('quota_attainment_metrics.period_end', periodEnd)
    .order('quota_attainment_metrics.actual_achievement', { ascending: false })
    .limit(5);

  return {
    topPerformers: topPerformers || [],
    keyInsights: generateKeyInsights(params)
  };
}

async function getTerritoryData(supabase: unknown, params: unknown, periodStart: string, periodEnd: string) {
  const { data: territories } = await supabase
    .from('sales_territories')
    .select(`
      id,
      name,
      users!inner(
        quota_attainment_metrics!inner(actual_achievement, attainment_percentage),
        win_rate_metrics!inner(win_rate)
      )
    `)
    .eq('organization_id', params.organizationId);

  return {
    territories: (territories || []).map((territory: unknown) => ({
      name: territory.name,
      revenue: territory.users[0]?.quota_attainment_metrics[0]?.actual_achievement || 0,
      win_rate: territory.users[0]?.win_rate_metrics[0]?.win_rate || 0,
      quota_attainment: territory.users[0]?.quota_attainment_metrics[0]?.attainment_percentage || 0,
      rep_count: territory.users?.length || 0,
      growth_rate: 0
    }))
  };
}

async function getRepData(supabase: unknown, params: unknown, periodStart: string, periodEnd: string) {
  const { data: reps } = await supabase
    .from('users')
    .select(`
      id,
      first_name,
      last_name,
      sales_territories!inner(name),
      quota_attainment_metrics!inner(actual_achievement, attainment_percentage),
      win_rate_metrics!inner(win_rate),
      activities_per_rep_metrics!inner(activities_per_day)
    `)
    .eq('organization_id', params.organizationId)
    .gte('quota_attainment_metrics.period_start', periodStart)
    .lte('quota_attainment_metrics.period_end', periodEnd);

  return {
    reps: (reps || []).map((rep: unknown) => ({
      name: `${rep.first_name} ${rep.last_name}`,
      territory: rep.sales_territories[0]?.name || 'Unassigned',
      revenue: rep.quota_attainment_metrics[0]?.actual_achievement || 0,
      win_rate: rep.win_rate_metrics[0]?.win_rate || 0,
      quota_attainment: rep.quota_attainment_metrics[0]?.attainment_percentage || 0,
      activities_per_day: rep.activities_per_rep_metrics[0]?.activities_per_day || 0,
      avg_deal_size: 0,
      sales_cycle_length: 0,
      performance_tier: getPerformanceTier(rep.quota_attainment_metrics[0]?.attainment_percentage || 0)
    }))
  };
}

async function getTrendData(supabase: unknown, params: unknown, periodStart: string, periodEnd: string) {
  const { data: trends } = await supabase
    .from('kpi_calculated_values')
    .select('*')
    .eq('organization_id', params.organizationId)
    .gte('calculation_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('calculation_date', { ascending: true });

  return {
    trends: (trends || []).map((trend: unknown) => ({
      period: trend.calculation_date.split('T')[0],
      revenue: trend.calculated_value,
      win_rate: 0,
      quota_attainment: 0,
      activities: 0
    }))
  };
}

// Helper functions
function generateKeyInsights(params: unknown): string[] {
  return [
    'Performance metrics are within normal ranges',
    'Consider reviewing sales strategies for improvement',
    'Focus on activity levels and qualification processes'
  ];
}

function getPerformanceTier(value: number): string {
  if (value >= 120) return 'excellent';
  if (value >= 100) return 'good';
  if (value >= 80) return 'average';
  return 'below_average';
}
