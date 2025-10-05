// src/app/api/test-pharmaceutical-bi/route.ts
// Test endpoint for pharmaceutical BI functionality
// This endpoint tests the KPI calculations and data retrieval

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Test 1: Check if pharmaceutical tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('pharmaceutical_kpis')
      .select('count')
      .limit(1);

    if (tablesError) {
      return NextResponse.json({
        success: false,
        error: 'Pharmaceutical tables not found',
        details: tablesError.message
      });
    }

    // Test 2: Check KPI definitions
    const { data: kpis, error: kpisError } = await supabase
      .from('pharmaceutical_kpis')
      .select('*')
      .limit(5);

    if (kpisError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch KPI definitions',
        details: kpisError.message
      });
    }

    // Test 3: Check healthcare providers
    const { data: hcps, error: hcpsError } = await supabase
      .from('healthcare_providers')
      .select('*')
      .limit(5);

    if (hcpsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch healthcare providers',
        details: hcpsError.message
      });
    }

    // Test 4: Check prescription events
    const { data: prescriptions, error: prescriptionsError } = await supabase
      .from('prescription_events')
      .select('*')
      .limit(5);

    if (prescriptionsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch prescription events',
        details: prescriptionsError.message
      });
    }

    // Test 5: Check pharmaceutical calls
    const { data: calls, error: callsError } = await supabase
      .from('pharmaceutical_calls')
      .select('*')
      .limit(5);

    if (callsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch pharmaceutical calls',
        details: callsError.message
      });
    }

    // Test 6: Test KPI calculation functions
    const { data: trxResult, error: trxError } = await supabase
      .rpc('calculate_trx', {
        p_organization_id: '00000000-0000-0000-0000-000000000000', // Test with dummy ID
        p_period_start: '2024-01-01',
        p_period_end: '2024-12-31'
      });

    return NextResponse.json({
      success: true,
      message: 'Pharmaceutical BI module is working correctly',
      tests: {
        tablesExist: true,
        kpiDefinitions: kpis?.length || 0,
        healthcareProviders: hcps?.length || 0,
        prescriptionEvents: prescriptions?.length || 0,
        pharmaceuticalCalls: calls?.length || 0,
        kpiFunctions: trxError ? false : true
      },
      data: {
        kpis: kpis || [],
        hcps: hcps || [],
        prescriptions: prescriptions || [],
        calls: calls || [],
        trxCalculation: trxResult
      },
      errors: {
        trxError: trxError?.message
      }
    });

  } catch (error) {
    console.error('Pharmaceutical BI test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
