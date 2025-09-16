import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!organizationId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Organization ID, start date, and end date are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get revenue data
    const { data: revenueData } = await supabase
      .from('opportunities')
      .select('value, stage, created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Get opportunities data
    const { data: opportunitiesData } = await supabase
      .from('opportunities')
      .select('id, stage, value, created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Get leads data
    const { data: leadsData } = await supabase
      .from('leads')
      .select('id, status, ai_score, created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Get activities data
    const { data: activitiesData } = await supabase
      .from('activities')
      .select('type, created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Calculate metrics
    const currentRevenue = revenueData?.reduce((sum: number, opp: any) => sum + (opp.value || 0), 0) || 0
    const targetRevenue = 1000000 // This would come from organization settings
    const revenueGrowth = 15.2 // This would be calculated based on previous period

    const totalOpportunities = opportunitiesData?.length || 0
    const wonOpportunities = opportunitiesData?.filter((opp: any) => opp.stage === 'closed_won').length || 0
    const lostOpportunities = opportunitiesData?.filter((opp: any) => opp.stage === 'closed_lost').length || 0
    const inProgressOpportunities = totalOpportunities - wonOpportunities - lostOpportunities
    const conversionRate = totalOpportunities > 0 ? (wonOpportunities / totalOpportunities) * 100 : 0

    const totalLeads = leadsData?.length || 0
    const qualifiedLeads = leadsData?.filter((lead: any) => lead.ai_score && lead.ai_score > 70).length || 0
    const convertedLeads = leadsData?.filter((lead: any) => lead.status === 'converted').length || 0
    const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

    const calls = activitiesData?.filter((act: any) => act.type === 'call').length || 0
    const emails = activitiesData?.filter((act: any) => act.type === 'email').length || 0
    const meetings = activitiesData?.filter((act: any) => act.type === 'meeting').length || 0
    const tasks = activitiesData?.filter((act: any) => act.type === 'task').length || 0

    const avgDealSize = wonOpportunities > 0 ? currentRevenue / wonOpportunities : 0
    const salesCycle = 45 // This would be calculated based on actual data
    const winRate = conversionRate
    const quota = targetRevenue

    const analyticsData = {
      revenue: {
        current: currentRevenue,
        target: targetRevenue,
        growth: revenueGrowth,
        forecast: currentRevenue * 1.2 // Simple forecast
      },
      opportunities: {
        total: totalOpportunities,
        won: wonOpportunities,
        lost: lostOpportunities,
        inProgress: inProgressOpportunities,
        conversionRate: conversionRate
      },
      leads: {
        total: totalLeads,
        qualified: qualifiedLeads,
        converted: convertedLeads,
        conversionRate: leadConversionRate
      },
      activities: {
        calls,
        emails,
        meetings,
        tasks
      },
      performance: {
        avgDealSize,
        salesCycle,
        winRate,
        quota
      }
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
