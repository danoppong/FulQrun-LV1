import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!organizationId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Organization ID, start date, and end date are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get historical data for forecasting
    const { data: historicalData } = await supabase
      .from('opportunities')
      .select('value, stage, created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Simple forecasting algorithm
    const currentRevenue = historicalData?.reduce((sum, opp) => sum + (opp.value || 0), 0) || 0
    const currentOpportunities = historicalData?.length || 0
    const currentLeads = 100 // This would come from leads data

    // Generate forecast for next 6 months
    const forecastData = []
    const startDateObj = new Date(startDate)
    
    for (let i = 1; i <= 6; i++) {
      const forecastDate = new Date(startDateObj)
      forecastDate.setMonth(forecastDate.getMonth() + i)
      
      // Simple linear growth forecast (20% growth per month)
      const growthFactor = Math.pow(1.2, i)
      const forecastRevenue = currentRevenue * growthFactor
      const forecastOpportunities = Math.round(currentOpportunities * growthFactor)
      const forecastLeads = Math.round(currentLeads * growthFactor)
      
      forecastData.push({
        period: forecastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: Math.round(forecastRevenue),
        opportunities: forecastOpportunities,
        leads: forecastLeads
      })
    }

    return NextResponse.json(forecastData)
  } catch (error) {
    console.error('Analytics forecast error:', error)
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    )
  }
}
