import { AIInsightsEngine, InsightContext } from './insights-engine'

export interface DealRiskFactors {
  stage: number
  meddpiccScore: number
  timeline: number
  value: number
  competition: number
  engagement: number
  decisionMaker: number
  budget: number
}

export interface DealRiskWeights {
  stage: number
  meddpiccScore: number
  timeline: number
  value: number
  competition: number
  engagement: number
  decisionMaker: number
  budget: number
}

export interface OpportunityData {
  id: string
  name: string
  stage: string
  meddpiccScore: number
  dealValue: number
  probability: number
  closeDate: string
  createdAt: string
  updatedAt: string
  lastActivityAt?: string
  activities?: Array<{
    id: string
    type: string
    description: string
    createdAt: string
    userId: string
  }>
  contacts?: Array<{
    id: string
    name: string
    email: string
    role: string
    influence: number
  }>
  competition?: string
  budget?: number
  decisionMaker?: string
  economicBuyer?: string
  champion?: string
  decisionProcess?: string
  decisionCriteria?: string
  paperProcess?: string
  identifyPain?: string
  metrics?: string
}

export class DealRiskEngine {
  private static readonly DEFAULT_WEIGHTS: DealRiskWeights = {
    stage: 0.20,
    meddpiccScore: 0.25,
    timeline: 0.15,
    value: 0.10,
    competition: 0.10,
    engagement: 0.10,
    decisionMaker: 0.05,
    budget: 0.05
  }

  /**
   * Calculate deal risk using rule-based algorithm
   */
  static calculateRuleBasedRisk(opportunityData: OpportunityData): {
    riskScore: number
    factors: DealRiskFactors
    confidence: number
    mitigationStrategies: string[]
  } {
    const factors = this.calculateRiskFactors(opportunityData)
    const weights = this.DEFAULT_WEIGHTS

    // Calculate weighted risk score (higher = more risk)
    const riskScore = Math.round(
      factors.stage * weights.stage +
      factors.meddpiccScore * weights.meddpiccScore +
      factors.timeline * weights.timeline +
      factors.value * weights.value +
      factors.competition * weights.competition +
      factors.engagement * weights.engagement +
      factors.decisionMaker * weights.decisionMaker +
      factors.budget * weights.budget
    )

    const confidence = this.calculateConfidence(opportunityData)
    const mitigationStrategies = this.getMitigationStrategies(factors, opportunityData)

    return {
      riskScore: Math.min(Math.max(riskScore, 0), 100),
      factors,
      confidence,
      mitigationStrategies
    }
  }

  /**
   * Calculate deal risk using AI-enhanced algorithm
   */
  static async calculateAIRisk(
    opportunityData: OpportunityData,
    context: InsightContext
  ): Promise<{
    riskScore: number
    factors: DealRiskFactors
    confidence: number
    mitigationStrategies: string[]
  }> {
    try {
      const insight = await AIInsightsEngine.generateDealRiskAssessment(
        opportunityData.id,
        opportunityData,
        context
      )
      const insightData = insight.insightData as {
        riskScore: number
        riskFactors: Record<string, number>
        mitigationStrategies: string[]
        confidence: number
      }

      return {
        riskScore: insightData.riskScore || 0,
        factors: insightData.riskFactors || {},
        confidence: insightData.confidence || 0.5,
        mitigationStrategies: insightData.mitigationStrategies || []
      }
    } catch (_error) {
      const ruleBased = this.calculateRuleBasedRisk(opportunityData)
      return {
        ...ruleBased,
        mitigationStrategies: [...ruleBased.mitigationStrategies, 'AI assessment unavailable, using rule-based calculation']
      }
    }
  }

  /**
   * Calculate individual risk factors
   */
  private static calculateRiskFactors(opportunityData: OpportunityData): DealRiskFactors {
    return {
      stage: this.calculateStageRisk(opportunityData.stage),
      meddpiccScore: this.calculateMEDDPICCRisk(opportunityData.meddpiccScore),
      timeline: this.calculateTimelineRisk(opportunityData),
      value: this.calculateValueRisk(opportunityData.dealValue),
      competition: this.calculateCompetitionRisk(opportunityData.competition),
      engagement: this.calculateEngagementRisk(opportunityData),
      decisionMaker: this.calculateDecisionMakerRisk(opportunityData),
      budget: this.calculateBudgetRisk(opportunityData.budget, opportunityData.dealValue)
    }
  }

  /**
   * Calculate stage risk (0-100, higher = more risk)
   */
  private static calculateStageRisk(stage: string): number {
    const stageRisks: Record<string, number> = {
      'prospecting': 80,
      'engaging': 60,
      'advancing': 40,
      'key_decision': 20,
      'proposal': 30,
      'negotiation': 25,
      'closed_won': 0,
      'closed_lost': 100
    }

    return stageRisks[stage?.toLowerCase()] || 70
  }

  /**
   * Calculate MEDDPICC risk (0-100, higher = more risk)
   */
  private static calculateMEDDPICCRisk(meddpiccScore: number): number {
    if (meddpiccScore >= 80) return 10
    if (meddpiccScore >= 60) return 30
    if (meddpiccScore >= 40) return 50
    if (meddpiccScore >= 20) return 70
    return 90
  }

  /**
   * Calculate timeline risk (0-100, higher = more risk)
   */
  private static calculateTimelineRisk(opportunityData: OpportunityData): number {
    const now = new Date()
    const closeDate = new Date(opportunityData.closeDate)
    const createdAt = new Date(opportunityData.createdAt)
    
    const daysToClose = Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const daysInPipeline = Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

    // Risk based on time to close
    let risk = 50
    if (daysToClose < 0) risk = 100 // Past due
    else if (daysToClose < 7) risk = 80 // Very close deadline
    else if (daysToClose < 30) risk = 60 // Close deadline
    else if (daysToClose < 90) risk = 40 // Reasonable timeline
    else risk = 60 // Too far out

    // Risk based on time in pipeline
    if (daysInPipeline > 180) risk += 20 // Stale opportunity
    else if (daysInPipeline > 90) risk += 10 // Getting stale

    return Math.min(risk, 100)
  }

  /**
   * Calculate value risk (0-100, higher = more risk)
   */
  private static calculateValueRisk(dealValue: number): number {
    if (!dealValue) return 80 // Unknown value is risky

    // Very large deals are riskier
    if (dealValue > 1000000) return 70
    if (dealValue > 500000) return 50
    if (dealValue > 100000) return 30
    if (dealValue > 50000) return 20
    if (dealValue > 10000) return 15
    return 10
  }

  /**
   * Calculate competition risk (0-100, higher = more risk)
   */
  private static calculateCompetitionRisk(competition?: string): number {
    if (!competition) return 60 // Unknown competition

    const competitionRisks: Record<string, number> = {
      'none': 10,
      'low': 30,
      'medium': 50,
      'high': 80,
      'intense': 90
    }

    return competitionRisks[competition.toLowerCase()] || 50
  }

  /**
   * Calculate engagement risk (0-100, higher = more risk)
   */
  private static calculateEngagementRisk(opportunityData: OpportunityData): number {
    const activities = opportunityData.activities || []
    const contacts = opportunityData.contacts || []
    const lastActivityAt = opportunityData.lastActivityAt

    let risk = 50 // Base risk

    // Low activity
    if (activities.length < 3) risk += 20
    else if (activities.length < 5) risk += 10

    // Low contact engagement
    if (contacts.length < 2) risk += 15
    else if (contacts.length < 4) risk += 5

    // Stale activity
    if (lastActivityAt) {
      const lastActivity = new Date(lastActivityAt)
      const daysSinceActivity = Math.ceil((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceActivity > 30) risk += 30
      else if (daysSinceActivity > 14) risk += 20
      else if (daysSinceActivity > 7) risk += 10
    } else {
      risk += 25 // No recent activity
    }

    return Math.min(risk, 100)
  }

  /**
   * Calculate decision maker risk (0-100, higher = more risk)
   */
  private static calculateDecisionMakerRisk(opportunityData: OpportunityData): number {
    let risk = 80 // High risk by default

    if (opportunityData.economicBuyer) risk -= 30
    if (opportunityData.champion) risk -= 20
    if (opportunityData.decisionMaker) risk -= 15
    if (opportunityData.decisionProcess) risk -= 10
    if (opportunityData.decisionCriteria) risk -= 10

    return Math.max(risk, 0)
  }

  /**
   * Calculate budget risk (0-100, higher = more risk)
   */
  private static calculateBudgetRisk(budget?: number, dealValue?: number): number {
    if (!budget || !dealValue) return 70 // Unknown budget

    const budgetRatio = dealValue / budget

    if (budgetRatio > 1.2) return 80 // Over budget
    if (budgetRatio > 1.0) return 60 // At budget limit
    if (budgetRatio > 0.8) return 30 // Within budget
    if (budgetRatio > 0.5) return 20 // Well within budget
    return 10 // Very affordable
  }

  /**
   * Calculate confidence based on data completeness
   */
  private static calculateConfidence(opportunityData: OpportunityData): number {
    let completeness = 0
    const totalFields = 10

    if (opportunityData.name) completeness++
    if (opportunityData.stage) completeness++
    if (opportunityData.meddpiccScore > 0) completeness++
    if (opportunityData.dealValue > 0) completeness++
    if (opportunityData.closeDate) completeness++
    if (opportunityData.economicBuyer) completeness++
    if (opportunityData.champion) completeness++
    if (opportunityData.decisionProcess) completeness++
    if (opportunityData.competition) completeness++
    if (opportunityData.budget) completeness++

    return completeness / totalFields
  }

  /**
   * Get mitigation strategies based on risk factors
   */
  private static getMitigationStrategies(
    factors: DealRiskFactors,
    opportunityData: OpportunityData
  ): string[] {
    const strategies: string[] = []

    if (factors.stage > 60) {
      strategies.push('Focus on advancing to next stage with specific action plan')
    }

    if (factors.meddpiccScore > 60) {
      strategies.push('Improve MEDDPICC score by addressing missing criteria')
    }

    if (factors.timeline > 70) {
      strategies.push('Accelerate timeline or adjust close date expectations')
    }

    if (factors.value > 60) {
      strategies.push('Break down large deal into smaller phases or reduce scope')
    }

    if (factors.competition > 60) {
      strategies.push('Strengthen competitive differentiation and value proposition')
    }

    if (factors.engagement > 60) {
      strategies.push('Increase stakeholder engagement and activity frequency')
    }

    if (factors.decisionMaker > 60) {
      strategies.push('Identify and engage with economic buyer and decision makers')
    }

    if (factors.budget > 60) {
      strategies.push('Verify budget availability and adjust pricing if needed')
    }

    // Add specific strategies based on opportunity data
    if (opportunityData.stage === 'prospecting' && factors.meddpiccScore > 50) {
      strategies.push('Move to engaging stage and schedule discovery meeting')
    }

    if (opportunityData.dealValue > 500000 && factors.engagement < 40) {
      strategies.push('Increase executive involvement for high-value opportunity')
    }

    if (!opportunityData.champion && factors.decisionMaker > 70) {
      strategies.push('Identify and develop internal champion')
    }

    return strategies
  }

  /**
   * Get risk level description
   */
  static getRiskLevel(riskScore: number): {
    level: 'low' | 'medium' | 'high' | 'critical'
    color: string
    description: string
  } {
    if (riskScore >= 80) {
      return {
        level: 'critical',
        color: 'red',
        description: 'Critical risk - immediate attention required'
      }
    } else if (riskScore >= 60) {
      return {
        level: 'high',
        color: 'orange',
        description: 'High risk - needs focused attention'
      }
    } else if (riskScore >= 40) {
      return {
        level: 'medium',
        color: 'yellow',
        description: 'Medium risk - monitor closely'
      }
    } else {
      return {
        level: 'low',
        color: 'green',
        description: 'Low risk - good progress'
      }
    }
  }

  /**
   * Update opportunity risk score in database
   */
  static async updateOpportunityRisk(
    _opportunityId: string,
    _riskScore: number,
    _factors: DealRiskFactors,
    _confidence: number
  ): Promise<void> {
    // This would typically update the opportunity record in the database
  }

  /**
   * Batch assess multiple opportunities
   */
  static async batchAssessRisks(
    opportunities: OpportunityData[],
    context: InsightContext,
    useAI: boolean = true
  ): Promise<Array<{
    opportunityId: string
    riskScore: number
    factors: DealRiskFactors
    confidence: number
    mitigationStrategies: string[]
    riskLevel: ReturnType<typeof DealRiskEngine.getRiskLevel>
  }>> {
    const results = []

    for (const opportunity of opportunities) {
      try {
        let riskResult

        if (useAI) {
          const aiResult = await this.calculateAIRisk(opportunity, context)
          riskResult = {
            opportunityId: opportunity.id,
            riskScore: aiResult.riskScore,
            factors: aiResult.factors,
            confidence: aiResult.confidence,
            mitigationStrategies: aiResult.mitigationStrategies,
            riskLevel: this.getRiskLevel(aiResult.riskScore)
          }
        } else {
          const ruleResult = this.calculateRuleBasedRisk(opportunity)
          riskResult = {
            opportunityId: opportunity.id,
            riskScore: ruleResult.riskScore,
            factors: ruleResult.factors,
            confidence: ruleResult.confidence,
            mitigationStrategies: ruleResult.mitigationStrategies,
            riskLevel: this.getRiskLevel(ruleResult.riskScore)
          }
        }

        results.push(riskResult)
      } catch (_error) {
        // Add fallback assessment
        const fallback = this.calculateRuleBasedRisk(opportunity)
        results.push({
          opportunityId: opportunity.id,
          riskScore: fallback.riskScore,
          factors: fallback.factors,
          confidence: fallback.confidence * 0.5,
          mitigationStrategies: [...fallback.mitigationStrategies, 'Risk assessment may be less accurate due to processing error'],
          riskLevel: this.getRiskLevel(fallback.riskScore)
        })
      }
    }

    return results
  }
}
