import { OpenAIClient } from './openai-client'
import { AIInsightsAPI, AIInsightData, LeadScoringInsight, DealRiskInsight, NextActionInsight, ForecastingInsight, PerformanceInsight } from '@/lib/api/ai-insights'

export interface InsightContext {
  organizationId: string
  userId: string
  historicalData?: any[]
  benchmarks?: Record<string, number>
}

export class AIInsightsEngine {
  /**
   * Generate lead scoring insight
   */
  static async generateLeadScoring(
    leadId: string,
    leadData: any,
    context: InsightContext
  ): Promise<AIInsightData> {
    try {
      const insight = await OpenAIClient.scoreLead(leadData)
      
      const insightData: LeadScoringInsight = {
        score: insight.score,
        confidence: insight.confidence,
        factors: insight.factors,
        recommendations: insight.recommendations
      }

      return await AIInsightsAPI.createInsight({
        type: 'lead_scoring',
        entityType: 'lead',
        entityId: leadId,
        insightData,
        confidenceScore: insight.confidence,
        modelVersion: 'gpt-4-v1',
        organizationId: context.organizationId
      })
    } catch (error) {
      console.error('Lead scoring error:', error)
      throw new Error('Failed to generate lead scoring insight')
    }
  }

  /**
   * Generate deal risk assessment
   */
  static async generateDealRiskAssessment(
    opportunityId: string,
    opportunityData: any,
    context: InsightContext
  ): Promise<AIInsightData> {
    try {
      const assessment = await OpenAIClient.assessDealRisk(opportunityData)
      
      const insightData: DealRiskInsight = {
        riskScore: assessment.riskScore,
        confidence: assessment.confidence,
        riskFactors: assessment.riskFactors,
        mitigationStrategies: assessment.mitigationStrategies
      }

      return await AIInsightsAPI.createInsight({
        type: 'deal_risk',
        entityType: 'opportunity',
        entityId: opportunityId,
        insightData,
        confidenceScore: assessment.confidence,
        modelVersion: 'gpt-4-v1',
        organizationId: context.organizationId
      })
    } catch (error) {
      console.error('Deal risk assessment error:', error)
      throw new Error('Failed to generate deal risk assessment')
    }
  }

  /**
   * Generate next action recommendations
   */
  static async generateNextActions(
    opportunityId: string,
    opportunityData: any,
    context: InsightContext
  ): Promise<AIInsightData> {
    try {
      const recommendations = await OpenAIClient.getNextActions(opportunityData)
      
      const insightData: NextActionInsight = {
        actions: recommendations.actions,
        confidence: recommendations.confidence
      }

      return await AIInsightsAPI.createInsight({
        type: 'next_action',
        entityType: 'opportunity',
        entityId: opportunityId,
        insightData,
        confidenceScore: recommendations.confidence,
        modelVersion: 'gpt-4-v1',
        organizationId: context.organizationId
      })
    } catch (error) {
      console.error('Next actions error:', error)
      throw new Error('Failed to generate next action recommendations')
    }
  }

  /**
   * Generate sales forecasting
   */
  static async generateForecasting(
    organizationId: string,
    pipelineData: any,
    context: InsightContext
  ): Promise<AIInsightData> {
    try {
      const forecast = await OpenAIClient.generateForecast(pipelineData)
      
      const insightData: ForecastingInsight = {
        forecast: forecast.forecast,
        trends: forecast.trends
      }

      return await AIInsightsAPI.createInsight({
        type: 'forecasting',
        entityType: 'organization',
        entityId: organizationId,
        insightData,
        confidenceScore: forecast.forecast.confidence,
        modelVersion: 'gpt-4-v1',
        organizationId
      })
    } catch (error) {
      console.error('Forecasting error:', error)
      throw new Error('Failed to generate sales forecast')
    }
  }

  /**
   * Generate performance insights
   */
  static async generatePerformanceInsights(
    userId: string,
    performanceData: any,
    context: InsightContext
  ): Promise<AIInsightData> {
    try {
      const insights = await OpenAIClient.analyzePerformance(performanceData)
      
      const insightData: PerformanceInsight = {
        metrics: performanceData.metrics,
        recommendations: insights.recommendations,
        benchmarks: context.benchmarks || {}
      }

      return await AIInsightsAPI.createInsight({
        type: 'performance',
        entityType: 'user',
        entityId: userId,
        insightData,
        confidenceScore: 0.8, // Performance insights are typically more reliable
        modelVersion: 'gpt-4-v1',
        organizationId: context.organizationId
      })
    } catch (error) {
      console.error('Performance insights error:', error)
      throw new Error('Failed to generate performance insights')
    }
  }

  /**
   * Batch generate insights for multiple entities
   */
  static async batchGenerateInsights(
    requests: Array<{
      type: 'lead_scoring' | 'deal_risk' | 'next_action' | 'forecasting' | 'performance'
      entityId: string
      data: any
      context: InsightContext
    }>
  ): Promise<AIInsightData[]> {
    const results: AIInsightData[] = []
    const errors: Error[] = []

    // Process requests in parallel with concurrency limit
    const concurrencyLimit = 5
    const chunks = this.chunkArray(requests, concurrencyLimit)

    for (const chunk of chunks) {
      const promises = chunk.map(async (request) => {
        try {
          switch (request.type) {
            case 'lead_scoring':
              return await this.generateLeadScoring(request.entityId, request.data, request.context)
            case 'deal_risk':
              return await this.generateDealRiskAssessment(request.entityId, request.data, request.context)
            case 'next_action':
              return await this.generateNextActions(request.entityId, request.data, request.context)
            case 'forecasting':
              return await this.generateForecasting(request.context.organizationId, request.data, request.context)
            case 'performance':
              return await this.generatePerformanceInsights(request.entityId, request.data, request.context)
            default:
              throw new Error(`Unknown insight type: ${request.type}`)
          }
        } catch (error) {
          errors.push(error as Error)
          return null
        }
      })

      const chunkResults = await Promise.all(promises)
      results.push(...chunkResults.filter(Boolean) as AIInsightData[])
    }

    if (errors.length > 0) {
      console.warn(`Batch processing completed with ${errors.length} errors`)
    }

    return results
  }

  /**
   * Get insights for a specific entity
   */
  static async getEntityInsights(
    entityType: 'lead' | 'opportunity' | 'contact' | 'user' | 'organization',
    entityId: string,
    organizationId: string
  ): Promise<AIInsightData[]> {
    return await AIInsightsAPI.getInsights(entityType, entityId, organizationId)
  }

  /**
   * Get latest insight for a specific entity and type
   */
  static async getLatestInsight(
    entityType: 'lead' | 'opportunity' | 'contact' | 'user' | 'organization',
    entityId: string,
    insightType: 'lead_scoring' | 'deal_risk' | 'next_action' | 'forecasting' | 'performance',
    organizationId: string
  ): Promise<AIInsightData | null> {
    return await AIInsightsAPI.getLatestInsight(entityType, entityId, insightType)
  }

  /**
   * Refresh insights for an entity
   */
  static async refreshEntityInsights(
    entityType: 'lead' | 'opportunity' | 'contact' | 'user' | 'organization',
    entityId: string,
    entityData: any,
    context: InsightContext
  ): Promise<AIInsightData[]> {
    const results: AIInsightData[] = []

    // Generate appropriate insights based on entity type
    switch (entityType) {
      case 'lead':
        try {
          const leadScoring = await this.generateLeadScoring(entityId, entityData, context)
          results.push(leadScoring)
        } catch (error) {
          console.error('Failed to refresh lead scoring:', error)
        }
        break

      case 'opportunity':
        try {
          const [dealRisk, nextActions] = await Promise.all([
            this.generateDealRiskAssessment(entityId, entityData, context),
            this.generateNextActions(entityId, entityData, context)
          ])
          results.push(dealRisk, nextActions)
        } catch (error) {
          console.error('Failed to refresh opportunity insights:', error)
        }
        break

      case 'user':
        try {
          const performance = await this.generatePerformanceInsights(entityId, entityData, context)
          results.push(performance)
        } catch (error) {
          console.error('Failed to refresh performance insights:', error)
        }
        break

      case 'organization':
        try {
          const forecasting = await this.generateForecasting(context.organizationId, entityData, context)
          results.push(forecasting)
        } catch (error) {
          console.error('Failed to refresh forecasting:', error)
        }
        break
    }

    return results
  }

  /**
   * Clean up old insights
   */
  static async cleanupOldInsights(organizationId: string): Promise<void> {
    await AIInsightsAPI.cleanupOldInsights(organizationId)
  }

  /**
   * Get high-confidence insights
   */
  static async getHighConfidenceInsights(
    organizationId: string,
    confidenceThreshold: number = 0.7
  ): Promise<AIInsightData[]> {
    return await AIInsightsAPI.getHighConfidenceInsights(organizationId, confidenceThreshold)
  }

  /**
   * Utility function to chunk array for batch processing
   */
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * Validate insight data before processing
   */
  private static validateInsightData(type: string, data: any): boolean {
    switch (type) {
      case 'lead_scoring':
        return data && (data.firstName || data.email || data.company)
      case 'deal_risk':
        return data && (data.name || data.stage || data.dealValue)
      case 'next_action':
        return data && (data.name || data.stage)
      case 'forecasting':
        return data && (data.opportunities || data.historicalData)
      case 'performance':
        return data && data.metrics
      default:
        return false
    }
  }
}
