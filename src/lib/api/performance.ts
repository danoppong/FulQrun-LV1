import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type PerformanceMetric = Database['public']['Tables']['performance_metrics']['Row']
type PerformanceMetricInsert = Database['public']['Tables']['performance_metrics']['Insert']
type PerformanceMetricUpdate = Database['public']['Tables']['performance_metrics']['Update']

export interface PerformanceMetricData {
  id: string
  userId: string
  metricType: 'clarity' | 'score' | 'teach' | 'problem' | 'value' | 'overall'
  metricName: string
  metricValue: number
  targetValue: number | null
  periodStart: string
  periodEnd: string
  calculationMethod: string | null
  rawData: Record<string, unknown>
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface CSTPVScore {
  clarity: number
  score: number
  teach: number
  problem: number
  value: number
  overall: number
}

export interface PerformancePeriod {
  start: string
  end: string
  label: string
}

export interface PerformanceTrend {
  metric: string
  current: number
  previous: number
  change: number
  changePercentage: number
  trend: 'up' | 'down' | 'stable'
}

export interface PerformanceBenchmark {
  metric: string
  userValue: number
  teamAverage: number
  organizationAverage: number
  industryAverage: number
  percentile: number
}

export class PerformanceAPI {
  /**
   * Get performance metrics for a user
   */
  static async getUserMetrics(
    userId: string,
    periodStart?: string,
    periodEnd?: string
  ): Promise<PerformanceMetricData[]> {
    let query = supabase
      .from('performance_metrics')
      .select('*')
      .eq('user_id', userId)

    if (periodStart) {
      query = query.gte('period_start', periodStart)
    }

    if (periodEnd) {
      query = query.lte('period_end', periodEnd)
    }

    const { data, error } = await query.order('period_start', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch user performance metrics: ${error.message}`)
    }

    return data.map(this.transformToPerformanceMetricData)
  }

  /**
   * Get CSTPV scores for a user
   */
  static async getCSTPVScores(
    userId: string,
    periodStart?: string,
    periodEnd?: string
  ): Promise<CSTPVScore> {
    const metrics = await this.getUserMetrics(userId, periodStart, periodEnd)
    
    const scores: CSTPVScore = {
      clarity: 0,
      score: 0,
      teach: 0,
      problem: 0,
      value: 0,
      overall: 0,
    }

    // Calculate average scores for each CSTPV component
    const metricTypes = ['clarity', 'score', 'teach', 'problem', 'value'] as const
    
    for (const type of metricTypes) {
      const typeMetrics = metrics.filter(m => m.metricType === type)
      if (typeMetrics.length > 0) {
        scores[type] = typeMetrics.reduce((sum, m) => sum + m.metricValue, 0) / typeMetrics.length
      }
    }

    // Calculate overall score
    scores.overall = Object.values(scores).reduce((sum, score) => sum + score, 0) / 5

    return scores
  }

  /**
   * Get performance trends for a user
   */
  static async getPerformanceTrends(
    userId: string,
    metricType?: 'clarity' | 'score' | 'teach' | 'problem' | 'value' | 'overall'
  ): Promise<PerformanceTrend[]> {
    const metrics = await this.getUserMetrics(userId)
    
    // Group metrics by type and calculate trends
    const trends: PerformanceTrend[] = []
    const metricTypes = metricType ? [metricType] : ['clarity', 'score', 'teach', 'problem', 'value', 'overall']
    
    for (const type of metricTypes) {
      const typeMetrics = metrics.filter(m => m.metricType === type)
      if (typeMetrics.length >= 2) {
        const sorted = typeMetrics.sort((a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime())
        const current = sorted[sorted.length - 1]
        const previous = sorted[sorted.length - 2]
        
        const change = current.metricValue - previous.metricValue
        const changePercentage = previous.metricValue !== 0 ? (change / previous.metricValue) * 100 : 0
        
        trends.push({
          metric: type,
          current: current.metricValue,
          previous: previous.metricValue,
          change,
          changePercentage: Math.round(changePercentage * 100) / 100,
          trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        })
      }
    }

    return trends
  }

  /**
   * Get performance benchmarks for a user
   */
  static async getPerformanceBenchmarks(
    userId: string,
    organizationId: string
  ): Promise<PerformanceBenchmark[]> {
    // Get user's current metrics
    const userMetrics = await this.getUserMetrics(userId)
    const currentPeriod = this.getCurrentPeriod()
    
    const currentMetrics = userMetrics.filter(m => 
      m.periodStart === currentPeriod.start && m.periodEnd === currentPeriod.end
    )

    // Get team and organization averages
    const teamMetrics = await this.getTeamMetrics(organizationId, currentPeriod.start, currentPeriod.end)
    const orgMetrics = await this.getOrganizationMetrics(organizationId, currentPeriod.start, currentPeriod.end)

    const benchmarks: PerformanceBenchmark[] = []

    for (const userMetric of currentMetrics) {
      const teamAverage = teamMetrics
        .filter(m => m.metricType === userMetric.metricType)
        .reduce((sum, m) => sum + m.metricValue, 0) / teamMetrics.length || 0

      const orgAverage = orgMetrics
        .filter(m => m.metricType === userMetric.metricType)
        .reduce((sum, m) => sum + m.metricValue, 0) / orgMetrics.length || 0

      // Mock industry average (would come from external data)
      const industryAverage = this.getIndustryAverage(userMetric.metricType)

      // Calculate percentile
      const allValues = teamMetrics
        .filter(m => m.metricType === userMetric.metricType)
        .map(m => m.metricValue)
        .sort((a, b) => a - b)

      const percentile = allValues.length > 0 
        ? (allValues.filter(v => v <= userMetric.metricValue).length / allValues.length) * 100
        : 50

      benchmarks.push({
        metric: userMetric.metricType,
        userValue: userMetric.metricValue,
        teamAverage,
        organizationAverage: orgAverage,
        industryAverage,
        percentile: Math.round(percentile * 100) / 100,
      })
    }

    return benchmarks
  }

  /**
   * Create or update a performance metric
   */
  static async upsertMetric(
    metric: Omit<PerformanceMetricData, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PerformanceMetricData> {
    // Check if metric already exists
    const { data: existing } = await supabase
      .from('performance_metrics')
      .select('id')
      .eq('user_id', metric.userId)
      .eq('metric_type', metric.metricType)
      .eq('metric_name', metric.metricName)
      .eq('period_start', metric.periodStart)
      .eq('period_end', metric.periodEnd)
      .single()

    if (existing) {
      // Update existing metric
      return this.updateMetric(existing.id, metric)
    } else {
      // Create new metric
      return this.createMetric(metric)
    }
  }

  /**
   * Create a new performance metric
   */
  static async createMetric(
    metric: Omit<PerformanceMetricData, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PerformanceMetricData> {
    const insertData: PerformanceMetricInsert = {
      user_id: metric.userId,
      metric_type: metric.metricType,
      metric_name: metric.metricName,
      metric_value: metric.metricValue,
      target_value: metric.targetValue,
      period_start: metric.periodStart,
      period_end: metric.periodEnd,
      calculation_method: metric.calculationMethod,
      raw_data: metric.rawData,
      organization_id: metric.organizationId,
    }

    const { data, error } = await supabase
      .from('performance_metrics')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create performance metric: ${error.message}`)
    }

    return this.transformToPerformanceMetricData(data)
  }

  /**
   * Update an existing performance metric
   */
  static async updateMetric(
    id: string,
    updates: Partial<Omit<PerformanceMetricData, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<PerformanceMetricData> {
    const updateData: PerformanceMetricUpdate = {
      metric_value: updates.metricValue,
      target_value: updates.targetValue,
      calculation_method: updates.calculationMethod,
      raw_data: updates.rawData,
    }

    const { data, error } = await supabase
      .from('performance_metrics')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update performance metric: ${error.message}`)
    }

    return this.transformToPerformanceMetricData(data)
  }

  /**
   * Calculate CSTPV scores from raw data
   */
  static calculateCSTPVScores(rawData: {
    opportunities: any[]
    activities: any[]
    deals: any[]
    training: any[]
    customerSatisfaction: any[]
  }): CSTPVScore {
    // CLARITY: Goal clarity and communication effectiveness
    const clarity = this.calculateClarityScore(rawData.opportunities, rawData.activities)
    
    // SCORE: Performance against targets and quotas
    const score = this.calculateScoreMetric(rawData.deals, rawData.opportunities)
    
    // TEACH: Knowledge transfer and training effectiveness
    const teach = this.calculateTeachScore(rawData.training, rawData.activities)
    
    // PROBLEM: Problem resolution metrics
    const problem = this.calculateProblemScore(rawData.activities, rawData.opportunities)
    
    // VALUE: Value creation and customer satisfaction
    const value = this.calculateValueScore(rawData.customerSatisfaction, rawData.deals)
    
    // Overall score
    const overall = (clarity + score + teach + problem + value) / 5

    return {
      clarity: Math.round(clarity * 100) / 100,
      score: Math.round(score * 100) / 100,
      teach: Math.round(teach * 100) / 100,
      problem: Math.round(problem * 100) / 100,
      value: Math.round(value * 100) / 100,
      overall: Math.round(overall * 100) / 100,
    }
  }

  /**
   * Get team metrics for benchmarking
   */
  private static async getTeamMetrics(
    organizationId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<PerformanceMetricData[]> {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)

    if (error) {
      // If table doesn't exist or database not configured, return empty array
      if (error.message.includes('relation "performance_metrics" does not exist') || 
          error.message.includes('Database not configured') ||
          error.message.includes('invalid input syntax for type uuid')) {
        return []
      }
      throw new Error(`Failed to fetch team metrics: ${error.message}`)
    }

    return data?.map(this.transformToPerformanceMetricData) || []
  }

  /**
   * Get organization metrics for benchmarking
   */
  private static async getOrganizationMetrics(
    organizationId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<PerformanceMetricData[]> {
    // For now, return team metrics as organization metrics
    // In a real implementation, this might aggregate data from multiple teams
    return this.getTeamMetrics(organizationId, periodStart, periodEnd)
  }

  /**
   * Get industry average for a metric type
   */
  private static getIndustryAverage(metricType: string): number {
    // Mock industry averages - in real implementation, this would come from external data
    const industryAverages: Record<string, number> = {
      clarity: 75,
      score: 80,
      teach: 70,
      problem: 65,
      value: 85,
      overall: 75,
    }

    return industryAverages[metricType] || 75
  }

  /**
   * Get current period (current month)
   */
  private static getCurrentPeriod(): PerformancePeriod {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    }
  }

  /**
   * Calculate clarity score
   */
  private static calculateClarityScore(opportunities: any[], activities: any[]): number {
    // Simple calculation based on opportunity completeness and activity quality
    const totalOpportunities = opportunities.length
    const completeOpportunities = opportunities.filter(opp => 
      opp.meddpicc_score && opp.meddpicc_score > 70
    ).length
    
    const totalActivities = activities.length
    const qualityActivities = activities.filter(act => 
      act.type === 'meeting' || act.type === 'call'
    ).length
    
    const clarityScore = totalOpportunities > 0 
      ? (completeOpportunities / totalOpportunities) * 50 + (qualityActivities / Math.max(totalActivities, 1)) * 50
      : 0
    
    return Math.min(clarityScore, 100)
  }

  /**
   * Calculate score metric
   */
  private static calculateScoreMetric(deals: any[], opportunities: any[]): number {
    const totalValue = opportunities.reduce((sum, opp) => sum + (opp.deal_value || 0), 0)
    const closedValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0)
    
    return totalValue > 0 ? (closedValue / totalValue) * 100 : 0
  }

  /**
   * Calculate teach score
   */
  private static calculateTeachScore(training: any[], activities: any[]): number {
    const trainingHours = training.reduce((sum, t) => sum + (t.hours || 0), 0)
    const knowledgeSharingActivities = activities.filter(act => 
      act.type === 'meeting' && act.description?.toLowerCase().includes('training')
    ).length
    
    return Math.min(trainingHours * 10 + knowledgeSharingActivities * 5, 100)
  }

  /**
   * Calculate problem score
   */
  private static calculateProblemScore(activities: any[], opportunities: any[]): number {
    const problemResolutionActivities = activities.filter(act => 
      act.description?.toLowerCase().includes('problem') || 
      act.description?.toLowerCase().includes('issue')
    ).length
    
    const resolvedOpportunities = opportunities.filter(opp => 
      opp.peak_stage === 'key_decision' || opp.peak_stage === 'advancing'
    ).length
    
    return Math.min(problemResolutionActivities * 10 + resolvedOpportunities * 5, 100)
  }

  /**
   * Calculate value score
   */
  private static calculateValueScore(customerSatisfaction: any[], deals: any[]): number {
    const avgSatisfaction = customerSatisfaction.length > 0
      ? customerSatisfaction.reduce((sum, cs) => sum + (cs.rating || 0), 0) / customerSatisfaction.length
      : 0
    
    const dealValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0)
    
    return Math.min(avgSatisfaction * 0.6 + Math.min(dealValue / 10000, 100) * 0.4, 100)
  }

  /**
   * Transform database row to PerformanceMetricData
   */
  private static transformToPerformanceMetricData(data: PerformanceMetric): PerformanceMetricData {
    return {
      id: data.id,
      userId: data.user_id,
      metricType: data.metric_type,
      metricName: data.metric_name,
      metricValue: data.metric_value,
      targetValue: data.target_value,
      periodStart: data.period_start,
      periodEnd: data.period_end,
      calculationMethod: data.calculation_method,
      rawData: data.raw_data,
      organizationId: data.organization_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }
}
