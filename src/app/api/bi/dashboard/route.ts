// src/app/api/bi/dashboard/route.ts
// Pharmaceutical BI Dashboard API
// Provides comprehensive dashboard data with role-based filtering

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // For now, skip authentication to allow testing
    // TODO: Re-enable authentication once user session is properly set up
    /*
    const user = await AuthService.getCurrentUserServer();
    if (!user?.profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    */

  const { searchParams } = new URL(request.url);
  const _organizationId = searchParams.get('organizationId') || '00000000-0000-0000-0000-000000000000';
  const _periodStart = searchParams.get('periodStart') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const _periodEnd = searchParams.get('periodEnd') || new Date().toISOString().split('T')[0];
  const _territoryId = searchParams.get('territoryId');
  const _productId = searchParams.get('productId');

  // Note: Avoid creating a server client here to prevent async cookies() issues in Next.js 15
  // If/when real data is needed, use AuthService.getServerClient() which correctly awaits cookies()

    // For testing, return mock data structure
    const mockDashboardData = {
      kpis: {
        trx: { value: 0, trend: 'stable', confidence: 0.95 },
        nrx: { value: 0, trend: 'stable', confidence: 0.90 },
        market_share: { value: 0, trend: 'stable', confidence: 0.85 },
        growth: { value: 0, trend: 'stable', confidence: 0.80 },
        reach: { value: 0, trend: 'stable', confidence: 0.75 },
        frequency: { value: 0, trend: 'stable', confidence: 0.70 },
        call_effectiveness: { value: 0, trend: 'stable', confidence: 0.65 },
        sample_to_script_ratio: { value: 0, trend: 'stable', confidence: 0.60 },
        formulary_access: { value: 0, trend: 'stable', confidence: 0.55 }
      },
      recentPrescriptions: [],
      recentCalls: [],
      territoryPerformance: [],
      productPerformance: [],
      hcpEngagement: {
        totalHCPs: 0,
        engagedHCPs: 0,
        engagementRate: 0,
        topSpecialties: []
      },
      sampleDistribution: {
        totalSamples: 0,
        totalScripts: 0,
        ratio: 0,
        topProducts: []
      },
      formularyAccess: {
        totalAccounts: 0,
        favorableAccounts: 0,
        accessRate: 0,
        topPayers: []
      },
      summary: {
        totalTRx: 0,
        totalNRx: 0,
        averageMarketShare: 0,
        averageGrowth: 0,
        totalCalls: 0,
        totalSamples: 0
      }
    };

    return NextResponse.json(mockDashboardData);

  } catch (error) {
    console.error('Pharmaceutical BI Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}