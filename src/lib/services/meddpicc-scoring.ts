/**
 * Unified MEDDPICC Scoring Service
 * 
 * This service provides a single source of truth for MEDDPICC scoring across the application.
 * It ensures consistent scoring regardless of where the score is calculated or displayed.
 */

import { MEDDPICC_CONFIG, MEDDPICCResponse, MEDDPICCAssessment, calculateMEDDPICCScore } from '@/lib/meddpicc'
import { opportunityAPI } from '@/lib/api/opportunities'

export interface MEDDPICCScoreResult {
  score: number
  qualificationLevel: string
  pillarScores: Record<string, number>
  lastCalculated: Date
  source: 'database' | 'calculated'
}

export class MEDDPICCScoringService {
  private scoreCache: Map<string, MEDDPICCScoreResult> = new Map()

  constructor() {}

  /**
   * Get MEDDPICC score for an opportunity
   * This is the single source of truth for all MEDDPICC scores
   */
  async getOpportunityScore(opportunityId: string, opportunity?: Record<string, unknown>): Promise<MEDDPICCScoreResult> {
    try {
      // Check if we have a cached score that's recent (within 5 minutes)
      const cached = this.scoreCache.get(opportunityId)
      if (cached && this.isScoreRecent(cached.lastCalculated)) {
        return cached
      }

      let opportunityData = opportunity

      // Only fetch opportunity data if not provided
      if (!opportunityData) {
        const opportunityResult = await opportunityAPI.getOpportunity(opportunityId)
        
        if (!opportunityResult.data) {
          throw new Error('Opportunity not found')
        }
        opportunityData = opportunityResult.data
      }

      // Calculate the score using our unified algorithm
      const scoreResult = await this.calculateScoreFromOpportunity(opportunityData)
      
      // Cache the result
      this.scoreCache.set(opportunityId, scoreResult)
      
      return scoreResult
    } catch (error) {
      console.error('Error getting MEDDPICC score:', error)
      return {
        score: 0,
        qualificationLevel: 'poor',
        pillarScores: {},
        lastCalculated: new Date(),
        source: 'calculated'
      }
    }
  }

  /**
   * Calculate MEDDPICC score from opportunity data
   * This uses the same algorithm across all components
   */
  private async calculateScoreFromOpportunity(opportunity: Record<string, unknown>): Promise<MEDDPICCScoreResult> {
    const responses = this.convertOpportunityToResponses(opportunity)
    const assessment = calculateMEDDPICCScore(responses)
    
    return {
      score: assessment.overallScore,
      qualificationLevel: assessment.qualificationLevel,
      pillarScores: assessment.pillarScores,
      lastCalculated: new Date(),
      source: 'calculated'
    }
  }

  /**
   * Convert opportunity data to MEDDPICC responses
   * This ensures consistent data parsing across all components
   */
  private convertOpportunityToResponses(opportunity: Record<string, unknown>): MEDDPICCResponse[] {
    const responses: MEDDPICCResponse[] = []
    
    // Safety check for MEDDPICC_CONFIG
    if (!MEDDPICC_CONFIG || !MEDDPICC_CONFIG.pillars) {
      console.warn('MEDDPICC_CONFIG not available for response conversion')
      return responses
    }

    // Convert opportunity MEDDPICC data to responses format
    const pillarMap: Record<string, string> = {
      'metrics': 'metrics',
      'economic_buyer': 'economicBuyer', 
      'decision_criteria': 'decisionCriteria',
      'decision_process': 'decisionProcess',
      'paper_process': 'paperProcess',
      'identify_pain': 'identifyPain',
      'implicate_pain': 'implicatePain',
      'champion': 'champion',
      'competition': 'competition'
    }
    
    // Parse each pillar's text into individual responses
    Object.entries(pillarMap).forEach(([dbField, pillarId]) => {
      const pillarText = opportunity[dbField] as string
      if (pillarText && pillarText.trim().length > 0) {
        // Find the pillar in the config
        const pillar = MEDDPICC_CONFIG.pillars.find(p => p.id === pillarId)
        if (pillar && pillar.questions.length > 0) {
          // Use the first question's ID from the config
          const firstQuestion = pillar.questions[0]
          responses.push({
            pillarId,
            questionId: firstQuestion.id, // Use actual question ID from config
            answer: pillarText.trim(),
            points: 0
          })
        }
      }
    })
    
    return responses
  }

  /**
   * Update MEDDPICC score in the database
   * This should be called whenever MEDDPICC data changes
   */
  async updateOpportunityScore(opportunityId: string, assessment: MEDDPICCAssessment): Promise<void> {
    try {
      // Update the database with the calculated score
      await opportunityAPI.updateOpportunity(opportunityId, {
        meddpicc_score: assessment.overallScore
      })

      // Update our cache
      const scoreResult: MEDDPICCScoreResult = {
        score: assessment.overallScore,
        qualificationLevel: assessment.qualificationLevel,
        pillarScores: assessment.pillarScores,
        lastCalculated: new Date(),
        source: 'database'
      }
      
      this.scoreCache.set(opportunityId, scoreResult)
      
      console.log(`Updated MEDDPICC score for opportunity ${opportunityId}: ${assessment.overallScore}%`)
    } catch (error) {
      console.error('Error updating MEDDPICC score:', error)
    }
  }

  /**
   * Invalidate cached score for an opportunity
   * This forces a recalculation on the next request
   */
  invalidateScore(opportunityId: string): void {
    this.scoreCache.delete(opportunityId)
  }


  /**
   * Check if a cached score is recent enough to use
   */
  private isScoreRecent(lastCalculated: Date): boolean {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return lastCalculated > fiveMinutesAgo
  }

  /**
   * Get score from database (if available) or calculate it
   * This provides a fallback mechanism
   */
  async getScoreWithFallback(opportunityId: string, opportunity?: Record<string, unknown>): Promise<MEDDPICCScoreResult> {
    try {
      // If we have opportunity data, try to get the stored score first
      if (opportunity && opportunity.meddpicc_score !== null && opportunity.meddpicc_score !== undefined) {
        return {
          score: opportunity.meddpicc_score,
          qualificationLevel: this.getQualificationLevel(opportunity.meddpicc_score),
          pillarScores: {}, // We don't store pillar scores in the database
          lastCalculated: new Date(),
          source: 'database'
        }
      }

      // Fallback to calculation
      return await this.getOpportunityScore(opportunityId)
    } catch (error) {
      console.error('Error getting score with fallback:', error)
      return {
        score: 0,
        qualificationLevel: 'poor',
        pillarScores: {},
        lastCalculated: new Date(),
        source: 'calculated'
      }
    }
  }

  /**
   * Get qualification level from score
   */
  private getQualificationLevel(score: number): string {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    if (score >= 40) return 'fair'
    return 'poor'
  }
}

// Export instance
export const meddpiccScoringService = new MEDDPICCScoringService()
