// src/app/api/bi/conversational-analytics/route.ts
// Conversational Analytics API endpoint
// Handles natural language queries and returns AI-powered insights

import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-unified'
import { ConversationalAnalyticsEngine } from '@/lib/bi/conversational-analytics'

export const dynamic = 'force-dynamic';

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
    const { query, organizationId, userId, sessionId, userRole = 'rep' } = body;

    if (!query || !organizationId) {
      return NextResponse.json(
        { error: 'Query and organizationId are required' },
        { status: 400 }
      );
    }

    // Create conversation context
    const context: ConversationContext = {
      userId: userId || 'test-user',
      organizationId,
      sessionId: sessionId || `session-${Date.now()}`,
      previousQueries: [],
      userRole: userRole as 'rep' | 'manager' | 'admin',
      preferences: {
        defaultPeriod: 'last month',
        favoriteKPIs: ['trx', 'nrx', 'market_share'],
        territories: []
      }
    };

    // Parse the query
    const intent = conversationalAnalytics.parseQuery(query, context);

    // Get dashboard data (using mock data for now)
    const dashboardData = {
      kpis: {
        trx: { value: 1250, trend: 'up', confidence: 0.95 },
        nrx: { value: 320, trend: 'stable', confidence: 0.90 },
        market_share: { value: 12.5, trend: 'up', confidence: 0.85 },
        growth: { value: 8.2, trend: 'up', confidence: 0.80 },
        reach: { value: 75, trend: 'down', confidence: 0.75 },
        frequency: { value: 2.8, trend: 'stable', confidence: 0.70 },
        call_effectiveness: { value: 1.6, trend: 'down', confidence: 0.65 },
        sample_to_script_ratio: { value: 8.5, trend: 'up', confidence: 0.60 },
        formulary_access: { value: 68, trend: 'stable', confidence: 0.55 }
      },
      recentPrescriptions: [
        { id: 1, product: 'Product A', hcp: 'Dr. Smith', date: '2024-01-15', type: 'new', volume: 25 },
        { id: 2, product: 'Product B', hcp: 'Dr. Johnson', date: '2024-01-14', type: 'refill', volume: 15 }
      ],
      recentCalls: [
        { id: 1, hcp: 'Dr. Smith', product: 'Product A', date: '2024-01-15', duration: 30, outcome: 'positive' },
        { id: 2, hcp: 'Dr. Johnson', product: 'Product B', date: '2024-01-14', duration: 25, outcome: 'neutral' }
      ],
      territoryPerformance: [
        { territory: 'North', kpis: [{ name: 'trx', value: 450 }] },
        { territory: 'South', kpis: [{ name: 'trx', value: 380 }] },
        { territory: 'East', kpis: [{ name: 'trx', value: 420 }] }
      ],
      productPerformance: [
        { product: 'Product A', kpis: [{ name: 'trx', value: 750 }] },
        { product: 'Product B', kpis: [{ name: 'trx', value: 500 }] }
      ],
      hcpEngagement: {
        totalHCPs: 150,
        engagedHCPs: 120,
        engagementRate: 80,
        topSpecialties: [
          { specialty: 'Cardiology', count: 25 },
          { specialty: 'Oncology', count: 20 },
          { specialty: 'Neurology', count: 18 }
        ]
      },
      sampleDistribution: {
        totalSamples: 850,
        totalScripts: 100,
        ratio: 8.5,
        topProducts: [
          { product: 'Product A', samples: 500 },
          { product: 'Product B', samples: 350 }
        ]
      },
      formularyAccess: {
        totalAccounts: 200,
        favorableAccounts: 136,
        accessRate: 68,
        topPayers: [
          { payer: 'Blue Cross', count: 45 },
          { payer: 'Aetna', count: 38 },
          { payer: 'Cigna', count: 32 }
        ]
      }
    };

    // Generate analytics response
    const analyticsResponse = await conversationalAnalytics.generateResponse(intent, context, dashboardData);

    // Generate natural language response
    const naturalResponse = conversationalAnalytics.generateNaturalLanguageResponse(analyticsResponse);

    // Return comprehensive response
    const response = {
      success: true,
      query: query,
      intent: intent,
      analytics: analyticsResponse,
      naturalResponse: naturalResponse,
      timestamp: new Date().toISOString(),
      sessionId: context.sessionId
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Conversational Analytics API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process conversational query',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'OrganizationId is required' },
        { status: 400 }
      );
    }

    // Return example queries and capabilities
    const capabilities = {
      supportedQueries: [
        'What is my TRx performance?',
        'Show me trends for new prescriptions',
        'Compare territory performance',
        'What are the anomalies in my data?',
        'Give me recommendations for improvement',
        'Forecast next quarter performance',
        'How is my market share trending?',
        'What is my HCP engagement rate?',
        'Show me sample distribution effectiveness',
        'Compare product performance'
      ],
      supportedKPIs: [
        'TRx (Total Prescriptions)',
        'NRx (New Prescriptions)',
        'Market Share',
        'Growth Rate',
        'HCP Reach',
        'Call Frequency',
        'Call Effectiveness',
        'Sample-to-Script Ratio',
        'Formulary Access'
      ],
      supportedIntents: [
        'KPI Analysis',
        'Trend Analysis',
        'Performance Comparison',
        'Forecasting',
        'Anomaly Detection',
        'Recommendations',
        'General Overview'
      ],
      exampleContext: {
        userRole: 'rep',
        territories: ['North', 'South', 'East', 'West'],
        products: ['Product A', 'Product B', 'Product C'],
        timeframes: ['last week', 'last month', 'last quarter', 'this year']
      }
    };

    return NextResponse.json({
      success: true,
      capabilities,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Conversational Analytics GET API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get capabilities',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
