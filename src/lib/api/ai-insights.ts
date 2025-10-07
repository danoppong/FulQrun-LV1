import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase';

type AIInsight = Database['public']['Tables']['ai_insights']['Row']
type AIInsightInsert = Database['public']['Tables']['ai_insights']['Insert']
type AIInsightUpdate = Database['public']['Tables']['ai_insights']['Update']

export interface LeadScoringInsight {
  score: number
  confidence: number
  factors: {
    source: number
    companySize: number
    industry: number
    engagement: number
    demographics: number
  }
  recommendations: string[]
}

export interface DealRiskInsight {
  riskScore: number
  confidence: number
  riskFactors: {
    stage: number
    meddpiccScore: number
    timeline: number
    value: number
    competition: number
  }
  mitigationStrategies: string[]
}

export interface NextActionInsight {
  actions: Array<{
    action: string
    priority: 'high' | 'medium' | 'low'
    reasoning: string
    estimatedImpact: number
  }>
  confidence: number
}

export interface ForecastingInsight {
  forecast: {
    shortTerm: number
    longTerm: number
    confidence: number
  }
  trends: {
    growth: number
    seasonality: number
    marketFactors: string[]
  }
}

export interface PerformanceInsight {
  metrics: {
    clarity: number
    score: number
    teach: number
    problem: number
    value: number
    overall: number
  }
  recommendations: string[]
  benchmarks: {
    industry: number
    organization: number
    personal: number
  }
}

export type InsightData = 
  | LeadScoringInsight 
  | DealRiskInsight 
  | NextActionInsight 
  | ForecastingInsight 
  | PerformanceInsight

export interface AIInsightData {
  id: string
  type: 'lead_scoring' | 'deal_risk' | 'next_action' | 'forecasting' | 'performance'
  entityType: 'lead' | 'opportunity' | 'contact' | 'user' | 'organization'
  entityId: string
  insightData: InsightData
  confidenceScore: number | null
  modelVersion: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
}

export class AIInsightsAPI {
  /**
   * Get insights for a specific entity
   */
  static async getInsights(
    entityType: 'lead' | 'opportunity' | 'contact' | 'user' | 'organization',
    entityId: string,
    insightType?: 'lead_scoring' | 'deal_risk' | 'next_action' | 'forecasting' | 'performance'
  ): Promise<AIInsightData[]> {
    let query = supabase
      .from('ai_insights')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    if (insightType) {
      query = query.eq('type', insightType)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch AI insights: ${error.message}`)
    }

    return data.map(this.transformToAIInsightData)
  }

  /**
   * Get latest insight for a specific entity and type
   */
  static async getLatestInsight(
    entityType: 'lead' | 'opportunity' | 'contact' | 'user' | 'organization',
    entityId: string,
    insightType: 'lead_scoring' | 'deal_risk' | 'next_action' | 'forecasting' | 'performance'
  ): Promise<AIInsightData | null> {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('type', insightType)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch latest AI insight: ${error.message}`)
    }

    return this.transformToAIInsightData(data)
  }

  /**
   * Create a new AI insight
   */
  static async createInsight(
    insight: Omit<AIInsightData, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AIInsightData> {
    const insertData: AIInsightInsert = {
      type: insight.type,
      entity_type: insight.entityType,
      entity_id: insight.entityId,
      insight_data: insight.insightData,
      confidence_score: insight.confidenceScore,
      model_version: insight.modelVersion,
      organization_id: insight.organizationId,
    }

    const { data, error } = await supabase
      .from('ai_insights')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create AI insight: ${error.message}`)
    }

    return this.transformToAIInsightData(data)
  }

  /**
   * Update an existing AI insight
   */
  static async updateInsight(
    id: string,
    updates: Partial<Omit<AIInsightData, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<AIInsightData> {
    const updateData: AIInsightUpdate = {
      insight_data: updates.insightData,
      confidence_score: updates.confidenceScore,
      model_version: updates.modelVersion,
    }

    const { data, error } = await supabase
      .from('ai_insights')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update AI insight: ${error.message}`)
    }

    return this.transformToAIInsightData(data)
  }

  /**
   * Delete an AI insight
   */
  static async deleteInsight(id: string): Promise<void> {
    const { error } = await supabase
      .from('ai_insights')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete AI insight: ${error.message}`)
    }
  }

  /**
   * Get insights by organization and type
   */
  static async getInsightsByOrganization(
    organizationId: string,
    insightType?: 'lead_scoring' | 'deal_risk' | 'next_action' | 'forecasting' | 'performance'
  ): Promise<AIInsightData[]> {
    let query = supabase
      .from('ai_insights')
      .select('*')
      .eq('organization_id', organizationId)

    if (insightType) {
      query = query.eq('type', insightType)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch AI insights: ${error.message}`)
    }

    return data.map(this.transformToAIInsightData)
  }

  /**
   * Get insights with confidence above threshold
   */
  static async getHighConfidenceInsights(
    organizationId: string,
    confidenceThreshold: number = 0.7
  ): Promise<AIInsightData[]> {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('confidence_score', confidenceThreshold)
      .order('confidence_score', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch high confidence AI insights: ${error.message}`)
    }

    return data.map(this.transformToAIInsightData)
  }

  /**
   * Clean up old insights (keep only latest per entity/type)
   */
  static async cleanupOldInsights(organizationId: string): Promise<void> {
    // This would typically be done with a more complex query
    // For now, we'll implement a simple cleanup that removes insights older than 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { error } = await supabase
      .from('ai_insights')
      .delete()
      .eq('organization_id', organizationId)
      .lt('created_at', thirtyDaysAgo.toISOString())

    if (error) {
      throw new Error(`Failed to cleanup old AI insights: ${error.message}`)
    }
  }

  /**
   * Transform database row to AIInsightData
   */
  private static transformToAIInsightData(data: AIInsight): AIInsightData {
    return {
      id: data.id,
      type: data.type,
      entityType: data.entity_type,
      entityId: data.entity_id,
      insightData: data.insight_data as InsightData,
      confidenceScore: data.confidence_score,
      modelVersion: data.model_version,
      organizationId: data.organization_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }
}
