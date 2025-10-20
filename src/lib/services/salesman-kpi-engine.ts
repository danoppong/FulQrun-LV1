/**
 * Salesman Dashboard KPI Calculation Engine
 * 
 * Implements pharmaceutical sales KPI calculations with hierarchical roll-up logic.
 * Supports both individual salesman view and aggregated team view for managers.
 * 
 * @module salesman-kpi-engine
 */

import { supabase as supabaseClient } from '@/lib/supabase'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SalesmanKPIRequest {
  salesmanId: string
  organizationId: string
  periodStart: Date
  periodEnd: Date
  viewMode: 'individual' | 'rollup' // Individual salesman or team aggregation
  includeSubordinates?: boolean // For manager views
}

export interface FunnelHealthMetrics {
  overallScore: number // 0-100 weighted score
  numberOfOpportunities: number
  totalValue: number
  totalVolume: number // Rx Volume (Mock Units)
  velocityScore: number
  qualifiedVolumeScore: number
  breakdown: {
    stage: string
    count: number
    value: number
    volume: number
    avgDaysInStage: number
    velocityRatio: number
  }[]
}

export interface WinRateMetrics {
  winRate: number // Percentage
  dealsWon: number
  dealsLost: number
  totalClosed: number
  periodStart: Date
  periodEnd: Date
}

export interface RevenueGrowthMetrics {
  growthRate: number // Percentage
  currentPeriodRevenue: number
  priorPeriodRevenue: number
  absoluteChange: number
}

export interface AverageDealSizeMetrics {
  averageDealSize: number
  totalClosedValue: number
  numberOfClosedDeals: number
  median: number
  min: number
  max: number
}

export interface PerformanceVsTargetMetrics {
  performancePercentage: number // Actual / Target * 100
  actualValue: number
  targetValue: number
  variance: number
  onTrack: boolean // true if >= 95% of target
  period: 'weekly' | 'monthly' | 'annually'
}

export interface SalesmanKPIResults {
  funnelHealth: FunnelHealthMetrics
  winRate: WinRateMetrics
  revenueGrowth: RevenueGrowthMetrics
  averageDealSize: AverageDealSizeMetrics
  performanceVsTarget: {
    weekly: PerformanceVsTargetMetrics
    monthly: PerformanceVsTargetMetrics
    annually: PerformanceVsTargetMetrics
  }
  metadata: {
    salesmanId: string
    salesmanName: string
    viewMode: 'individual' | 'rollup'
    calculatedAt: Date
    periodStart: Date
    periodEnd: Date
  }
}

// Stage weighting factors for velocity calculation
const STAGE_WEIGHTS: Record<string, number> = {
  'Prospecting': 0.1,
  'Qualification': 0.15,
  'Needs Analysis': 0.2,
  'Proposal': 0.25,
  'Negotiation': 0.3,
  'Closed Won': 0,
  'Closed Lost': 0
}

// Historical average days per stage (can be replaced with actual historical data)
const HISTORICAL_AVG_DAYS: Record<string, number> = {
  'Prospecting': 14,
  'Qualification': 21,
  'Needs Analysis': 30,
  'Proposal': 28,
  'Negotiation': 21,
  'Closed Won': 0,
  'Closed Lost': 0
}

// ============================================================================
// MAIN KPI ENGINE CLASS
// ============================================================================

export class SalesmanKPIEngine {
  private supabase = supabaseClient

  /**
   * Calculate all KPIs for a salesman or team
   */
  async calculateAllKPIs(request: SalesmanKPIRequest): Promise<SalesmanKPIResults> {
    // Get salesman info
    const salesmanInfo = await this.getSalesmanInfo(request.salesmanId)
    
    // Determine which salesmen to include based on view mode
    const salesmanIds = request.viewMode === 'rollup' && request.includeSubordinates
      ? await this.getTeamSalesmanIds(request.salesmanId, request.organizationId)
      : [request.salesmanId]

    // Calculate all KPIs in parallel
    const [
      funnelHealth,
      winRate,
      revenueGrowth,
      averageDealSize,
      performanceWeekly,
      performanceMonthly,
      performanceAnnually
    ] = await Promise.all([
      this.calculateFunnelHealth(salesmanIds, request.organizationId, request.periodStart, request.periodEnd),
      this.calculateWinRate(salesmanIds, request.organizationId, request.periodStart, request.periodEnd),
      this.calculateRevenueGrowth(salesmanIds, request.organizationId, request.periodStart, request.periodEnd),
      this.calculateAverageDealSize(salesmanIds, request.organizationId, request.periodStart, request.periodEnd),
      this.calculatePerformanceVsTarget(salesmanIds, request.organizationId, 'weekly', request.periodStart, request.periodEnd),
      this.calculatePerformanceVsTarget(salesmanIds, request.organizationId, 'monthly', request.periodStart, request.periodEnd),
      this.calculatePerformanceVsTarget(salesmanIds, request.organizationId, 'annually', request.periodStart, request.periodEnd)
    ])

    return {
      funnelHealth,
      winRate,
      revenueGrowth,
      averageDealSize,
      performanceVsTarget: {
        weekly: performanceWeekly,
        monthly: performanceMonthly,
        annually: performanceAnnually
      },
      metadata: {
        salesmanId: request.salesmanId,
        salesmanName: salesmanInfo.name,
        viewMode: request.viewMode,
        calculatedAt: new Date(),
        periodStart: request.periodStart,
        periodEnd: request.periodEnd
      }
    }
  }

  // ==========================================================================
  // FUNNEL HEALTH CALCULATION
  // ==========================================================================

  /**
   * Calculate Funnel Health with weighted velocity score and volume
   * Formula: Weighted Score = (Weighted Avg Velocity Score × 0.7) + (Qualified Opp Volume Score × 0.3)
   */
  async calculateFunnelHealth(
    salesmanIds: string[],
    organizationId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<FunnelHealthMetrics> {
    // Get active opportunities for the period
    const { data: opportunities, error } = await this.supabase
      .from('opportunities')
      .select(`
        id,
        stage,
        value,
        created_at
      `)
      .in('assigned_to', salesmanIds)
      .eq('organization_id', organizationId)
      .in('stage', ['Prospecting', 'Qualification', 'Needs Analysis', 'Proposal', 'Negotiation'])
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString())

    if (error || !opportunities) {
      console.error('Error fetching opportunities:', error)
      return this.getEmptyFunnelHealth()
    }

    // Calculate stage-by-stage breakdown
    const stageBreakdown: Record<string, {
      count: number
      value: number
      volume: number
      totalDaysInStage: number
    }> = {}

    let totalValue = 0
    let totalVolume = 0
    let weightedVelocitySum = 0
    let totalWeight = 0

    type OppLite = { id: string; stage: string | null; value: number | null; created_at: string }
    ;(opportunities as unknown as OppLite[]).forEach(opp => {
      const stage = opp.stage ?? 'Prospecting'
      const value = opp.value ?? 0
      const rxVolume = 0
      
      // Calculate days in current stage using created_at as fallback
      const stageEntryDate = new Date(opp.created_at)
      const daysInStage = Math.floor((Date.now() - stageEntryDate.getTime()) / (1000 * 60 * 60 * 24))

      // Initialize stage breakdown
      if (!stageBreakdown[stage]) {
        stageBreakdown[stage] = { count: 0, value: 0, volume: 0, totalDaysInStage: 0 }
      }

      stageBreakdown[stage].count++
      stageBreakdown[stage].value += value
      stageBreakdown[stage].volume += rxVolume
      stageBreakdown[stage].totalDaysInStage += daysInStage

      totalValue += value
      totalVolume += rxVolume

      // Calculate velocity ratio for this opportunity
      const historicalAvg = HISTORICAL_AVG_DAYS[stage] || 30
      const velocityRatio = daysInStage / historicalAvg
      const stageWeight = STAGE_WEIGHTS[stage] || 0.1

      weightedVelocitySum += velocityRatio * stageWeight
      totalWeight += stageWeight
    })

    // Calculate Weighted Average Velocity Score
    const weightedAvgVelocityScore = totalWeight > 0 
      ? (weightedVelocitySum / totalWeight) * 100 
      : 0

    // Calculate Qualified Opportunity Volume Score
    // Normalize to 0-100 (assuming max qualified volume is 10,000 units)
    const qualifiedVolume = (opportunities as unknown as OppLite[])
      .filter(opp => opp.stage === 'Qualification' || opp.stage === 'Needs Analysis')
      .reduce((sum) => sum + 0, 0)
    
    const qualifiedVolumeScore = Math.min((qualifiedVolume / 10000) * 100, 100)

    // Calculate Overall Funnel Health Score
    const overallScore = (weightedAvgVelocityScore * 0.7) + (qualifiedVolumeScore * 0.3)

    // Build breakdown array
    const breakdown = Object.entries(stageBreakdown).map(([stage, data]) => ({
      stage,
      count: data.count,
      value: data.value,
      volume: data.volume,
      avgDaysInStage: data.count > 0 ? data.totalDaysInStage / data.count : 0,
      velocityRatio: data.count > 0 ? (data.totalDaysInStage / data.count) / (HISTORICAL_AVG_DAYS[stage] || 30) : 0
    }))

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      numberOfOpportunities: opportunities.length,
      totalValue,
      totalVolume,
      velocityScore: Math.round(weightedAvgVelocityScore * 100) / 100,
      qualifiedVolumeScore: Math.round(qualifiedVolumeScore * 100) / 100,
      breakdown
    }
  }

  // ==========================================================================
  // WIN RATE CALCULATION
  // ==========================================================================

  /**
   * Calculate Win Rate
   * Formula: (Number of Deals Won / Number of Deals Closed) × 100%
   */
  async calculateWinRate(
    salesmanIds: string[],
    organizationId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<WinRateMetrics> {
    const { data: closedDeals, error } = await this.supabase
      .from('opportunities')
        .select('id, stage, close_date')
      .in('assigned_to', salesmanIds)
      .eq('organization_id', organizationId)
      .in('stage', ['Closed Won', 'Closed Lost'])
  .gte('close_date', periodStart.toISOString())
  .lte('close_date', periodEnd.toISOString())

    if (error || !closedDeals) {
      console.error('Error fetching closed deals:', error)
      return {
        winRate: 0,
        dealsWon: 0,
        dealsLost: 0,
        totalClosed: 0,
        periodStart,
        periodEnd
      }
    }

    const closed = (closedDeals ?? []) as Array<{ stage: string }>
    const dealsWon = closed.filter(d => d.stage === 'Closed Won').length
    const dealsLost = closed.filter(d => d.stage === 'Closed Lost').length
    const totalClosed = closed.length

    const winRate = totalClosed > 0 ? (dealsWon / totalClosed) * 100 : 0

    return {
      winRate: Math.round(winRate * 100) / 100,
      dealsWon,
      dealsLost,
      totalClosed,
      periodStart,
      periodEnd
    }
  }

  // ==========================================================================
  // REVENUE GROWTH CALCULATION
  // ==========================================================================

  /**
   * Calculate Revenue Growth
   * Formula: ((Current Period - Prior Period) / Prior Period) × 100%
   */
  async calculateRevenueGrowth(
    salesmanIds: string[],
    organizationId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<RevenueGrowthMetrics> {
    // Calculate period duration in days
    const periodDuration = Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
    
    // Calculate prior period dates
    const priorPeriodEnd = new Date(periodStart)
    priorPeriodEnd.setDate(priorPeriodEnd.getDate() - 1)
    const priorPeriodStart = new Date(priorPeriodEnd)
    priorPeriodStart.setDate(priorPeriodStart.getDate() - periodDuration)

    // Get current period revenue
    const { data: currentDeals } = await this.supabase
      .from('opportunities')
      .select('value')
      .in('assigned_to', salesmanIds)
      .eq('organization_id', organizationId)
      .eq('stage', 'Closed Won')
  .gte('close_date', periodStart.toISOString())
  .lte('close_date', periodEnd.toISOString())

    // Get prior period revenue
    const { data: priorDeals } = await this.supabase
      .from('opportunities')
      .select('value')
      .in('assigned_to', salesmanIds)
      .eq('organization_id', organizationId)
      .eq('stage', 'Closed Won')
  .gte('close_date', priorPeriodStart.toISOString())
  .lte('close_date', priorPeriodEnd.toISOString())

    const currentDealsArr = (currentDeals ?? []) as Array<{ value: number | null }>
    const priorDealsArr = (priorDeals ?? []) as Array<{ value: number | null }>
    const currentPeriodRevenue = currentDealsArr.reduce((sum, d) => sum + (d.value ?? 0), 0)
    const priorPeriodRevenue = priorDealsArr.reduce((sum, d) => sum + (d.value ?? 0), 0)

    const growthRate = priorPeriodRevenue > 0 
      ? ((currentPeriodRevenue - priorPeriodRevenue) / priorPeriodRevenue) * 100 
      : 0

    return {
      growthRate: Math.round(growthRate * 100) / 100,
      currentPeriodRevenue,
      priorPeriodRevenue,
      absoluteChange: currentPeriodRevenue - priorPeriodRevenue
    }
  }

  // ==========================================================================
  // AVERAGE DEAL SIZE CALCULATION
  // ==========================================================================

  /**
   * Calculate Average Deal Size
   * Formula: Total Closed Deal Value / Number of Closed Deals
   */
  async calculateAverageDealSize(
    salesmanIds: string[],
    organizationId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<AverageDealSizeMetrics> {
    const { data: closedDeals, error } = await this.supabase
      .from('opportunities')
      .select('value')
      .in('assigned_to', salesmanIds)
      .eq('organization_id', organizationId)
      .eq('stage', 'Closed Won')
  .gte('close_date', periodStart.toISOString())
  .lte('close_date', periodEnd.toISOString())

    if (error || !closedDeals || closedDeals.length === 0) {
      return {
        averageDealSize: 0,
        totalClosedValue: 0,
        numberOfClosedDeals: 0,
        median: 0,
        min: 0,
        max: 0
      }
    }

  const values = ((closedDeals ?? []) as Array<{ value: number | null }>).map(d => d.value ?? 0).sort((a, b) => a - b)
    const totalClosedValue = values.reduce((sum, v) => sum + v, 0)
    const numberOfClosedDeals = values.length
    const averageDealSize = totalClosedValue / numberOfClosedDeals

    // Calculate median
    const median = numberOfClosedDeals % 2 === 0
      ? (values[numberOfClosedDeals / 2 - 1] + values[numberOfClosedDeals / 2]) / 2
      : values[Math.floor(numberOfClosedDeals / 2)]

    return {
      averageDealSize: Math.round(averageDealSize * 100) / 100,
      totalClosedValue,
      numberOfClosedDeals,
      median: Math.round(median * 100) / 100,
      min: values[0],
      max: values[values.length - 1]
    }
  }

  // ==========================================================================
  // PERFORMANCE VS TARGET CALCULATION
  // ==========================================================================

  /**
   * Calculate Performance vs Target
   * Formula: (Actual Sales Value / Target Value) × 100%
   */
  async calculatePerformanceVsTarget(
    salesmanIds: string[],
    organizationId: string,
    period: 'weekly' | 'monthly' | 'annually',
    periodStart: Date,
    periodEnd: Date
  ): Promise<PerformanceVsTargetMetrics> {
    // Get actual closed deal value
    const { data: closedDeals } = await this.supabase
      .from('opportunities')
      .select('value')
      .in('assigned_to', salesmanIds)
      .eq('organization_id', organizationId)
      .eq('stage', 'Closed Won')
  .gte('close_date', periodStart.toISOString())
  .lte('close_date', periodEnd.toISOString())

  const actualValue = ((closedDeals ?? []) as Array<{ value: number | null }>).reduce((sum, d) => sum + (d.value ?? 0), 0) || 0

    // Get target value (assuming targets are stored in a targets table)
    const { data: targets } = await this.supabase
      .from('sales_targets')
      .select('target_value')
      .in('salesman_id', salesmanIds)
      .eq('organization_id', organizationId)
      .eq('period_type', period)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString())

  const targetValue = ((targets ?? []) as Array<{ target_value: number | null }>).reduce((sum, t) => sum + (t.target_value ?? 0), 0) || 0

    // If no target set, use mock target based on historical average
    const effectiveTarget = targetValue > 0 ? targetValue : actualValue * 1.2 // 20% above current

    const performancePercentage = effectiveTarget > 0 
      ? (actualValue / effectiveTarget) * 100 
      : 0

    return {
      performancePercentage: Math.round(performancePercentage * 100) / 100,
      actualValue,
      targetValue: effectiveTarget,
      variance: actualValue - effectiveTarget,
      onTrack: performancePercentage >= 95,
      period
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Get salesman information
   */
  private async getSalesmanInfo(salesmanId: string): Promise<{ name: string; managerId?: string }> {
    // Fetch manager_id from user_profiles (does not contain full_name in some schemas)
    const { data: profileData, error: profileError } = await this.supabase
      .from('user_profiles')
      .select('manager_id')
      .eq('id', salesmanId)
      .single()

    if (profileError) {
      console.error('Error fetching salesman profile:', profileError)
    }

    // Fetch display name from users table, which reliably has full_name
    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .select('full_name')
      .eq('id', salesmanId)
      .single()

    if (userError) {
      console.error('Error fetching salesman user:', userError)
    }

    const name = (userData as unknown as { full_name?: string | null } | null)?.full_name || 'Unknown'
    const managerId = (profileData as unknown as { manager_id?: string | null } | null)?.manager_id || undefined

    return { name, managerId }
  }

  private async getTeamSalesmanIds(managerId: string, organizationId: string): Promise<string[]> {
    const teamIds: string[] = [managerId]
    
    // Get direct reports
    const { data: directReports } = await this.supabase
      .from('user_profiles')
      .select('id')
      .eq('manager_id', managerId)
      .eq('organization_id', organizationId)

    if (directReports && directReports.length > 0) {
      const reports = directReports as Array<{ id: string }>
      teamIds.push(...reports.map(r => r.id))
      
      // Recursively get subordinates of direct reports
      for (const report of reports) {
        const subTeam = await this.getTeamSalesmanIds(report.id, organizationId)
        teamIds.push(...subTeam.filter(id => !teamIds.includes(id)))
      }
    }

    return teamIds
  }

  /**
   * Get empty funnel health metrics
   */
  private getEmptyFunnelHealth(): FunnelHealthMetrics {
    return {
      overallScore: 0,
      numberOfOpportunities: 0,
      totalValue: 0,
      totalVolume: 0,
      velocityScore: 0,
      qualifiedVolumeScore: 0,
      breakdown: []
    }
  }
}

// Export singleton instance
export const salesmanKPIEngine = new SalesmanKPIEngine()
