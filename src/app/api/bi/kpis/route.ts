// src/app/api/bi/kpis/route.ts
// Pharmaceutical KPI API endpoints
// Handles KPI calculations, definitions, and cached values

import { NextRequest, NextResponse } from 'next/server'
import { KPIEngine } from '@/lib/bi/kpi-engine'

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
    const organizationId = searchParams.get('organizationId') || '00000000-0000-0000-0000-000000000000';
    const kpiId = searchParams.get('kpiId');
    const productId = searchParams.get('productId');
    const territoryId = searchParams.get('territoryId');
    const repId = searchParams.get('repId');
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');
    const useCache = searchParams.get('useCache') === 'true';

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Period start and end dates are required' },
        { status: 400 }
      );
    }

    const params = {
      organizationId,
      productId: productId || undefined,
      territoryId: territoryId || undefined,
      repId: repId || undefined,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd)
    };

    let result;

    if (kpiId) {
      // Calculate specific KPI
      if (useCache) {
        result = await kpiEngine.getCachedKPI(kpiId, params);
      } else {
        result = await kpiEngine.calculateSpecificKPI(kpiId, params);
      }
    } else {
      // Calculate all KPIs
      result = await kpiEngine.calculateAllKPIs(params);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Pharmaceutical KPI API error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate KPIs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // For now, skip authentication to allow testing
    // TODO: Re-enable authentication once user session is properly set up
    /*
    const user = await AuthService.getCurrentUserServer();
    if (!user?.profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    */

    const body = await request.json();
    const { kpiId, params, forceRecalculate = false } = body;

    if (!kpiId || !params) {
      return NextResponse.json(
        { error: 'KPI ID and parameters are required' },
        { status: 400 }
      );
    }

    let result;
    if (forceRecalculate) {
      result = await kpiEngine.calculateSpecificKPI(kpiId, params);
    } else {
      result = await kpiEngine.getCachedKPI(kpiId, params);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Pharmaceutical KPI POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate KPI' },
      { status: 500 }
    );
  }
}