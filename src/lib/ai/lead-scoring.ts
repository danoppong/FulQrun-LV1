import { AIInsightsEngine, InsightContext } from './insights-engine'

export interface LeadScoringFactors {
  source: number
  companySize: number
  industry: number
  engagement: number
  demographics: number
  behavior: number
  timing: number
}

export interface LeadScoringWeights {
  source: number
  companySize: number
  industry: number
  engagement: number
  demographics: number
  behavior: number
  timing: number
}

export interface LeadData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company: string
  source: string
  industry?: string
  companySize?: string
  title?: string
  location?: string
  website?: string
  engagement?: any[]
  activities?: any[]
  createdAt: string
  updatedAt: string
}

export class LeadScoringEngine {
  private static readonly DEFAULT_WEIGHTS: LeadScoringWeights = {
    source: 0.25,
    companySize: 0.20,
    industry: 0.15,
    engagement: 0.20,
    demographics: 0.10,
    behavior: 0.05,
    timing: 0.05
  }

  /**
   * Calculate lead score using rule-based algorithm
   */
  static calculateRuleBasedScore(leadData: LeadData): {
    score: number
    factors: LeadScoringFactors
    confidence: number
  } {
    const factors = this.calculateFactors(leadData)
    const weights = this.DEFAULT_WEIGHTS

    // Calculate weighted score
    const score = Math.round(
      factors.source * weights.source +
      factors.companySize * weights.companySize +
      factors.industry * weights.industry +
      factors.engagement * weights.engagement +
      factors.demographics * weights.demographics +
      factors.behavior * weights.behavior +
      factors.timing * weights.timing
    )

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(leadData)

    return {
      score: Math.min(Math.max(score, 0), 100),
      factors,
      confidence
    }
  }

  /**
   * Calculate lead score using AI-enhanced algorithm
   */
  static async calculateAIScore(
    leadData: LeadData,
    context: InsightContext
  ): Promise<{
    score: number
    factors: LeadScoringFactors
    confidence: number
    recommendations: string[]
  }> {
    try {
      const insight = await AIInsightsEngine.generateLeadScoring(leadData.id, leadData, context)
      const insightData = insight.insightData as any

      return {
        score: insightData.score || 0,
        factors: insightData.factors || {},
        confidence: insightData.confidence || 0.5,
        recommendations: insightData.recommendations || []
      }
    } catch (error) {
      const ruleBased = this.calculateRuleBasedScore(leadData)
      return {
        ...ruleBased,
        recommendations: ['AI scoring unavailable, using rule-based calculation']
      }
    }
  }

  /**
   * Calculate individual scoring factors
   */
  private static calculateFactors(leadData: LeadData): LeadScoringFactors {
    return {
      source: this.calculateSourceScore(leadData.source),
      companySize: this.calculateCompanySizeScore(leadData.companySize),
      industry: this.calculateIndustryScore(leadData.industry),
      engagement: this.calculateEngagementScore(leadData.engagement || []),
      demographics: this.calculateDemographicsScore(leadData),
      behavior: this.calculateBehaviorScore(leadData),
      timing: this.calculateTimingScore(leadData)
    }
  }

  /**
   * Calculate source score (0-100)
   */
  private static calculateSourceScore(source: string): number {
    const sourceScores: Record<string, number> = {
      'referral': 90,
      'website': 80,
      'social_media': 75,
      'email_campaign': 70,
      'cold_call': 60,
      'trade_show': 85,
      'partner': 80,
      'advertisement': 65,
      'other': 50,
      'unknown': 30
    }

    return sourceScores[source?.toLowerCase()] || 50
  }

  /**
   * Calculate company size score (0-100)
   */
  private static calculateCompanySizeScore(companySize?: string): number {
    if (!companySize) return 50

    const sizeScores: Record<string, number> = {
      'startup': 40,
      'small': 60,
      'medium': 80,
      'large': 90,
      'enterprise': 95
    }

    return sizeScores[companySize.toLowerCase()] || 50
  }

  /**
   * Calculate industry score (0-100)
   */
  private static calculateIndustryScore(industry?: string): number {
    if (!industry) return 50

    // High-value industries
    const highValueIndustries = [
      'technology', 'software', 'saas', 'fintech', 'healthcare',
      'pharmaceuticals', 'consulting', 'legal', 'finance', 'insurance'
    ]

    // Medium-value industries
    const mediumValueIndustries = [
      'manufacturing', 'retail', 'education', 'real_estate',
      'construction', 'automotive', 'energy', 'telecommunications'
    ]

    const industryLower = industry.toLowerCase()

    if (highValueIndustries.some(ind => industryLower.includes(ind))) {
      return 85
    } else if (mediumValueIndustries.some(ind => industryLower.includes(ind))) {
      return 70
    } else {
      return 60
    }
  }

  /**
   * Calculate engagement score (0-100)
   */
  private static calculateEngagementScore(engagement: any[]): number {
    if (!engagement || engagement.length === 0) return 20

    let score = 20 // Base score

    // Email opens
    const emailOpens = engagement.filter(e => e.type === 'email_open').length
    score += Math.min(emailOpens * 5, 20)

    // Website visits
    const websiteVisits = engagement.filter(e => e.type === 'website_visit').length
    score += Math.min(websiteVisits * 3, 15)

    // Downloads
    const downloads = engagement.filter(e => e.type === 'download').length
    score += Math.min(downloads * 10, 20)

    // Demo requests
    const demos = engagement.filter(e => e.type === 'demo_request').length
    score += Math.min(demos * 15, 25)

    return Math.min(score, 100)
  }

  /**
   * Calculate demographics score (0-100)
   */
  private static calculateDemographicsScore(leadData: LeadData): number {
    let score = 50 // Base score

    // Email quality
    if (leadData.email) {
      const emailDomain = leadData.email.split('@')[1]
      if (emailDomain && !emailDomain.includes('gmail') && !emailDomain.includes('yahoo')) {
        score += 10 // Business email
      }
    }

    // Title/role
    if (leadData.title) {
      const title = leadData.title.toLowerCase()
      if (title.includes('ceo') || title.includes('president') || title.includes('founder')) {
        score += 15
      } else if (title.includes('vp') || title.includes('director') || title.includes('manager')) {
        score += 10
      } else if (title.includes('decision') || title.includes('purchasing')) {
        score += 12
      }
    }

    // Company website
    if (leadData.website) {
      score += 5
    }

    return Math.min(score, 100)
  }

  /**
   * Calculate behavior score (0-100)
   */
  private static calculateBehaviorScore(leadData: LeadData): number {
    let score = 50 // Base score

    // Response time to initial contact
    if (leadData.activities && leadData.activities.length > 0) {
      const firstActivity = leadData.activities[0]
      const responseTime = this.calculateResponseTime(leadData.createdAt, firstActivity.createdAt)
      
      if (responseTime < 24) { // Within 24 hours
        score += 20
      } else if (responseTime < 72) { // Within 3 days
        score += 10
      }
    }

    // Multiple touchpoints
    if (leadData.activities && leadData.activities.length > 3) {
      score += 15
    }

    return Math.min(score, 100)
  }

  /**
   * Calculate timing score (0-100)
   */
  private static calculateTimingScore(leadData: LeadData): number {
    const now = new Date()
    const createdAt = new Date(leadData.createdAt)
    const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

    // Fresh leads score higher
    if (daysSinceCreation <= 1) return 90
    if (daysSinceCreation <= 7) return 80
    if (daysSinceCreation <= 30) return 70
    if (daysSinceCreation <= 90) return 50
    return 30
  }

  /**
   * Calculate confidence based on data completeness
   */
  private static calculateConfidence(leadData: LeadData): number {
    let completeness = 0
    const totalFields = 8

    if (leadData.firstName) completeness++
    if (leadData.lastName) completeness++
    if (leadData.email) completeness++
    if (leadData.company) completeness++
    if (leadData.phone) completeness++
    if (leadData.industry) completeness++
    if (leadData.companySize) completeness++
    if (leadData.title) completeness++

    return completeness / totalFields
  }

  /**
   * Calculate response time in hours
   */
  private static calculateResponseTime(createdAt: string, firstActivityAt: string): number {
    const created = new Date(createdAt)
    const firstActivity = new Date(firstActivityAt)
    return (firstActivity.getTime() - created.getTime()) / (1000 * 60 * 60)
  }

  /**
   * Get scoring recommendations based on factors
   */
  static getScoringRecommendations(factors: LeadScoringFactors): string[] {
    const recommendations: string[] = []

    if (factors.source < 60) {
      recommendations.push('Focus on higher-quality lead sources like referrals and trade shows')
    }

    if (factors.companySize < 60) {
      recommendations.push('Target larger companies or adjust scoring for smaller companies')
    }

    if (factors.industry < 60) {
      recommendations.push('Consider if this industry aligns with your ideal customer profile')
    }

    if (factors.engagement < 40) {
      recommendations.push('Increase engagement through targeted content and follow-up')
    }

    if (factors.demographics < 60) {
      recommendations.push('Gather more demographic information to improve scoring accuracy')
    }

    if (factors.behavior < 50) {
      recommendations.push('Encourage faster response times and multiple touchpoints')
    }

    if (factors.timing < 50) {
      recommendations.push('Focus on fresher leads or adjust timing expectations')
    }

    return recommendations
  }

  /**
   * Update lead score in database
   */
  static async updateLeadScore(
    leadId: string,
    score: number,
    factors: LeadScoringFactors,
    confidence: number
  ): Promise<void> {
    // This would typically update the lead record in the database
    // Implementation depends on your data access layer
  }

  /**
   * Batch score multiple leads
   */
  static async batchScoreLeads(
    leads: LeadData[],
    context: InsightContext,
    useAI: boolean = true
  ): Promise<Array<{
    leadId: string
    score: number
    factors: LeadScoringFactors
    confidence: number
    recommendations: string[]
  }>> {
    const results = []

    for (const lead of leads) {
      try {
        let scoringResult

        if (useAI) {
          const aiResult = await this.calculateAIScore(lead, context)
          scoringResult = {
            leadId: lead.id,
            score: aiResult.score,
            factors: aiResult.factors,
            confidence: aiResult.confidence,
            recommendations: aiResult.recommendations
          }
        } else {
          const ruleResult = this.calculateRuleBasedScore(lead)
          scoringResult = {
            leadId: lead.id,
            score: ruleResult.score,
            factors: ruleResult.factors,
            confidence: ruleResult.confidence,
            recommendations: this.getScoringRecommendations(ruleResult.factors)
          }
        }

        results.push(scoringResult)
      } catch (error) {
        // Add fallback scoring
        const fallback = this.calculateRuleBasedScore(lead)
        results.push({
          leadId: lead.id,
          score: fallback.score,
          factors: fallback.factors,
          confidence: fallback.confidence * 0.5, // Lower confidence for fallback
          recommendations: ['Scoring may be less accurate due to processing error']
        })
      }
    }

    return results
  }
}
