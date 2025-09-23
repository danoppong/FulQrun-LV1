import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Return mock forecast data
    const forecastData = [
      {
        period: 'Q1 2024',
        revenue: 250000,
        deals: 12,
        confidence: 0.85
      },
      {
        period: 'Q2 2024',
        revenue: 300000,
        deals: 15,
        confidence: 0.78
      },
      {
        period: 'Q3 2024',
        revenue: 350000,
        deals: 18,
        confidence: 0.72
      },
      {
        period: 'Q4 2024',
        revenue: 400000,
        deals: 20,
        confidence: 0.68
      }
    ]

    return NextResponse.json(forecastData)
  } catch (error) {
    console.error('Forecast API error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch forecast data' },
      { status: 500 }
    )
  }
}