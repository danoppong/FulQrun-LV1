import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/validation'

export const dynamic = 'force-dynamic'

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const xri = req.headers.get('x-real-ip')?.trim()
  return xff || xri || '127.0.0.1'
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    if (!checkRateLimit(ip, 60, 60_000)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // Small jitter to avoid thundering herd
    await new Promise((r) => setTimeout(r, 50))
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

    return NextResponse.json(analyticsData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}