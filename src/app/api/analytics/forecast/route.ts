import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache for 5 minutes

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url)
    const _organizationId = searchParams.get('organizationId')
    const _startDate = searchParams.get('startDate')
    const _endDate = searchParams.get('endDate')

    // Add a small delay to prevent resource exhaustion
    await new Promise(resolve => setTimeout(resolve, 100))

    // Return mock forecast data with more realistic current dates
    const currentYear = new Date().getFullYear()
    const forecastData = [
      {
        period: `Q1 ${currentYear}`,
        revenue: 250000,
        deals: 12,
        confidence: 0.85
      },
      {
        period: `Q2 ${currentYear}`,
        revenue: 300000,
        deals: 15,
        confidence: 0.78
      },
      {
        period: `Q3 ${currentYear}`,
        revenue: 350000,
        deals: 18,
        confidence: 0.72
      },
      {
        period: `Q4 ${currentYear}`,
        revenue: 400000,
        deals: 20,
        confidence: 0.68
      }
    ]

    return NextResponse.json(forecastData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Forecast API error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch forecast data' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache'
        }
      }
    )
  }
}