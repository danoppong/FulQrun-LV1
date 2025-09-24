import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url)
    const _organizationId = searchParams.get('organizationId')
    const _userId = searchParams.get('userId')
    const _startDate = searchParams.get('startDate')
    const _endDate = searchParams.get('endDate')

    // Return mock data for now to test the API
    const analyticsData = {
      revenue: {
        current: 250000,
        target: 1000000,
        growth: 15.2,
        forecast: 300000
      },
      opportunities: {
        total: 45,
        won: 12,
        lost: 8,
        inProgress: 25,
        conversionRate: 26.7
      },
      leads: {
        total: 120,
        qualified: 85,
        converted: 35,
        conversionRate: 29.2
      },
      activities: {
        calls: 45,
        emails: 120,
        meetings: 25,
        tasks: 60
      },
      performance: {
        avgDealSize: 20833,
        salesCycle: 45,
        winRate: 26.7,
        quota: 1000000
      }
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Analytics API error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}