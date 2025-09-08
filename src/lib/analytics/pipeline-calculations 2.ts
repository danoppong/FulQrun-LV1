// Analytics calculation functions for pipeline data
// This module contains business logic for calculating pipeline metrics

export interface PipelineMetrics {
  totalValue: number
  weightedValue: number
  opportunityCount: number
  averageDealSize: number
  conversionRate: number
  stageDistribution: {
    [stage: string]: {
      count: number
      value: number
      weightedValue: number
      percentage: number
    }
  }
}

export interface OpportunityData {
  id: string
  peak_stage: 'prospecting' | 'engaging' | 'advancing' | 'key_decision'
  deal_value: number | null
  probability: number | null
  created_at: string
  updated_at: string
}

export interface LeadMetrics {
  totalLeads: number
  convertedLeads: number
  conversionRate: number
  averageScore: number
  scoreDistribution: {
    hot: number
    warm: number
    cold: number
  }
}

export interface LeadData {
  id: string
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'
  score: number
  created_at: string
}

export class PipelineAnalytics {
  /**
   * Calculate comprehensive pipeline metrics
   */
  static calculatePipelineMetrics(opportunities: OpportunityData[]): PipelineMetrics {
    const totalValue = opportunities.reduce((sum, opp) => sum + (opp.deal_value || 0), 0)
    const weightedValue = opportunities.reduce((sum, opp) => {
      const value = opp.deal_value || 0
      const probability = opp.probability || 0
      return sum + (value * (probability / 100))
    }, 0)
    
    const opportunityCount = opportunities.length
    const averageDealSize = opportunityCount > 0 ? totalValue / opportunityCount : 0
    
    // Calculate stage distribution
    const stageDistribution: { [stage: string]: { count: number; value: number; weightedValue: number; percentage: number } } = {}
    const stages = ['prospecting', 'engaging', 'advancing', 'key_decision']
    
    stages.forEach(stage => {
      const stageOpportunities = opportunities.filter(opp => opp.peak_stage === stage)
      const stageValue = stageOpportunities.reduce((sum, opp) => sum + (opp.deal_value || 0), 0)
      const stageWeightedValue = stageOpportunities.reduce((sum, opp) => {
        const value = opp.deal_value || 0
        const probability = opp.probability || 0
        return sum + (value * (probability / 100))
      }, 0)
      
      stageDistribution[stage] = {
        count: stageOpportunities.length,
        value: stageValue,
        weightedValue: stageWeightedValue,
        percentage: opportunityCount > 0 ? (stageOpportunities.length / opportunityCount) * 100 : 0
      }
    })
    
    // Calculate conversion rate (simplified - would need historical data)
    const conversionRate = 0 // This would be calculated from historical data
    
    return {
      totalValue,
      weightedValue,
      opportunityCount,
      averageDealSize,
      conversionRate,
      stageDistribution
    }
  }

  /**
   * Calculate lead metrics
   */
  static calculateLeadMetrics(leads: LeadData[]): LeadMetrics {
    const totalLeads = leads.length
    const convertedLeads = leads.filter(lead => lead.status === 'converted').length
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
    
    const averageScore = totalLeads > 0 
      ? leads.reduce((sum, lead) => sum + lead.score, 0) / totalLeads 
      : 0
    
    // Categorize leads by score
    const scoreDistribution = {
      hot: leads.filter(lead => lead.score >= 70).length,
      warm: leads.filter(lead => lead.score >= 40 && lead.score < 70).length,
      cold: leads.filter(lead => lead.score < 40).length
    }
    
    return {
      totalLeads,
      convertedLeads,
      conversionRate,
      averageScore,
      scoreDistribution
    }
  }

  /**
   * Calculate revenue forecast based on pipeline
   */
  static calculateRevenueForecast(
    opportunities: OpportunityData[],
    months: number = 12
  ): {
    monthlyForecast: { month: string; value: number }[]
    totalForecast: number
    confidence: number
  } {
    const monthlyForecast: { month: string; value: number }[] = []
    const currentDate = new Date()
    
    // Group opportunities by expected close date
    const opportunitiesByMonth: { [key: string]: OpportunityData[] } = {}
    
    opportunities.forEach(opp => {
      if (opp.deal_value && opp.probability) {
        const closeDate = new Date(opp.created_at) // Simplified - would use actual close_date
        const monthKey = `${closeDate.getFullYear()}-${String(closeDate.getMonth() + 1).padStart(2, '0')}`
        
        if (!opportunitiesByMonth[monthKey]) {
          opportunitiesByMonth[monthKey] = []
        }
        opportunitiesByMonth[monthKey].push(opp)
      }
    })
    
    // Calculate forecast for each month
    for (let i = 0; i < months; i++) {
      const forecastDate = new Date(currentDate)
      forecastDate.setMonth(currentDate.getMonth() + i)
      const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`
      
      const monthOpportunities = opportunitiesByMonth[monthKey] || []
      const monthValue = monthOpportunities.reduce((sum, opp) => {
        const value = opp.deal_value || 0
        const probability = opp.probability || 0
        return sum + (value * (probability / 100))
      }, 0)
      
      monthlyForecast.push({
        month: forecastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        value: monthValue
      })
    }
    
    const totalForecast = monthlyForecast.reduce((sum, month) => sum + month.value, 0)
    
    // Calculate confidence based on pipeline stage distribution
    const advancedStages = opportunities.filter(opp => 
      opp.peak_stage === 'advancing' || opp.peak_stage === 'key_decision'
    ).length
    const confidence = opportunities.length > 0 ? (advancedStages / opportunities.length) * 100 : 0
    
    return {
      monthlyForecast,
      totalForecast,
      confidence
    }
  }

  /**
   * Calculate conversion rates by stage
   */
  static calculateStageConversionRates(opportunities: OpportunityData[]): {
    [stage: string]: {
      count: number
      conversionRate: number
      averageTime: number
    }
  } {
    const stages = ['prospecting', 'engaging', 'advancing', 'key_decision']
    const result: { [stage: string]: { count: number; value: number; weightedValue: number; percentage: number } } = {}
    
    stages.forEach((stage, index) => {
      const stageOpportunities = opportunities.filter(opp => opp.peak_stage === stage)
      const nextStage = stages[index + 1]
      
      if (nextStage) {
        // Calculate how many opportunities moved to next stage
        // This is simplified - would need historical data
        const conversionRate = 0 // Would be calculated from historical progression data
        const averageTime = 0 // Would be calculated from stage transition times
        
        result[stage] = {
          count: stageOpportunities.length,
          conversionRate,
          averageTime
        }
      } else {
        // Final stage
        result[stage] = {
          count: stageOpportunities.length,
          conversionRate: 100, // All opportunities in final stage are "converted"
          averageTime: 0
        }
      }
    })
    
    return result
  }

  /**
   * Calculate team performance metrics
   */
  static calculateTeamPerformance(
    opportunities: OpportunityData[],
    userIds: string[]
  ): {
    [userId: string]: {
      opportunityCount: number
      totalValue: number
      weightedValue: number
      averageDealSize: number
      winRate: number
    }
  } {
    const result: { [userId: string]: { totalValue: number; weightedValue: number; opportunityCount: number; averageDealSize: number } } = {}
    
    userIds.forEach(userId => {
      const userOpportunities = opportunities.filter(opp => 
        // This would need a created_by field in the data
        true // Simplified for MVP
      )
      
      const totalValue = userOpportunities.reduce((sum, opp) => sum + (opp.deal_value || 0), 0)
      const weightedValue = userOpportunities.reduce((sum, opp) => {
        const value = opp.deal_value || 0
        const probability = opp.probability || 0
        return sum + (value * (probability / 100))
      }, 0)
      
      result[userId] = {
        opportunityCount: userOpportunities.length,
        totalValue,
        weightedValue,
        averageDealSize: userOpportunities.length > 0 ? totalValue / userOpportunities.length : 0,
        winRate: 0 // Would be calculated from historical data
      }
    })
    
    return result
  }
}

// Export utility functions
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`
}

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value)
}

