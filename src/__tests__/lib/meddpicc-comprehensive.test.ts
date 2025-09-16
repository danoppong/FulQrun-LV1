import { 
  calculateMEDDPICCScore, 
  calculateMEDDPICCScoreLegacy,
  getMEDDPICCLevel, 
  getPEAKStageInfo,
  MEDDPICCResponse,
  MEDDPICC_CONFIG
} from '@/lib/meddpicc'

describe('MEDDPICC Comprehensive System', () => {
  describe('calculateMEDDPICCScore (Comprehensive)', () => {
    it('should calculate comprehensive assessment for complete responses', () => {
      const responses: MEDDPICCResponse[] = [
        { pillarId: 'metrics', questionId: 'current_cost', answer: 'High operational costs', points: 8 },
        { pillarId: 'metrics', questionId: 'expected_roi', answer: 'Good ROI expected', points: 7 },
        { pillarId: 'economicBuyer', questionId: 'budget_authority', answer: 'CFO John Smith', points: 8 },
        { pillarId: 'economicBuyer', questionId: 'meeting_status', answer: 'Multiple meetings', points: 10 }
      ]
      
      const assessment = calculateMEDDPICCScore(responses)
      
      expect(assessment.overallScore).toBeGreaterThan(0)
      expect(assessment.overallScore).toBeLessThanOrEqual(100)
      expect(assessment.qualificationLevel).toBeDefined()
      expect(assessment.pillarScores).toBeDefined()
      expect(assessment.nextActions).toBeDefined()
      expect(assessment.stageGateReadiness).toBeDefined()
    })

    it('should handle empty responses correctly', () => {
      const assessment = calculateMEDDPICCScore([])
      
      expect(assessment.overallScore).toBe(0)
      expect(assessment.qualificationLevel).toBe('Poor')
      expect(assessment.nextActions.length).toBeGreaterThan(0)
    })

    it('should calculate text responses based on length', () => {
      const responses: MEDDPICCResponse[] = [
        { pillarId: 'metrics', questionId: 'current_cost', answer: 'Short', points: undefined },
        { pillarId: 'metrics', questionId: 'expected_roi', answer: 'This is a much longer response that should get more points', points: undefined }
      ]
      
      const assessment = calculateMEDDPICCScore(responses)
      
      expect(assessment.pillarScores['metrics']).toBeGreaterThan(0)
    })

    it('should handle scale responses correctly', () => {
      const responses: MEDDPICCResponse[] = [
        { pillarId: 'champion', questionId: 'champion_influence', answer: 'Very High (C-Level)', points: 10 },
        { pillarId: 'champion', questionId: 'champion_commitment', answer: 'Fully committed', points: 10 }
      ]
      
      const assessment = calculateMEDDPICCScore(responses)
      
      expect(assessment.pillarScores['champion']).toBeGreaterThan(0)
    })
  })

  describe('getMEDDPICCLevel', () => {
    it('should return correct level for high scores', () => {
      const level = getMEDDPICCLevel(85)
      expect(level.level).toBe('Excellent')
      expect(level.color).toBe('bg-green-500')
    })

    it('should return correct level for medium scores', () => {
      const level = getMEDDPICCLevel(50)
      expect(level.level).toBe('Fair')
      expect(level.color).toBe('bg-yellow-500')
    })

    it('should return correct level for low scores', () => {
      const level = getMEDDPICCLevel(10)
      expect(level.level).toBe('Poor')
      expect(level.color).toBe('bg-red-500')
    })

    it('should handle edge cases', () => {
      const level80 = getMEDDPICCLevel(80)
      const level79 = getMEDDPICCLevel(79)
      
      expect(level80.level).toBe('Excellent')
      expect(level79.level).toBe('Good')
    })
  })

  describe('MEDDPICC Configuration', () => {
    it('should have all required pillars', () => {
      expect(MEDDPICC_CONFIG.pillars).toHaveLength(9)
      
      const pillarIds = MEDDPICC_CONFIG.pillars.map(p => p.id)
      expect(pillarIds).toContain('metrics')
      expect(pillarIds).toContain('economicBuyer')
      expect(pillarIds).toContain('decisionCriteria')
      expect(pillarIds).toContain('decisionProcess')
      expect(pillarIds).toContain('paperProcess')
      expect(pillarIds).toContain('identifyPain')
      expect(pillarIds).toContain('implicatePain')
      expect(pillarIds).toContain('champion')
      expect(pillarIds).toContain('competition')
    })

    it('should have proper scoring weights', () => {
      const weights = MEDDPICC_CONFIG.scoring.weights
      expect(weights.metrics).toBe(15)
      expect(weights.economicBuyer).toBe(20)
      expect(weights.champion).toBe(15)
    })

    it('should have proper thresholds', () => {
      const thresholds = MEDDPICC_CONFIG.scoring.thresholds
      expect(thresholds.excellent).toBe(80)
      expect(thresholds.good).toBe(60)
      expect(thresholds.fair).toBe(40)
      expect(thresholds.poor).toBe(20)
    })

    it('should have stage gate configurations', () => {
      const stageGates = MEDDPICC_CONFIG.integrations.peakPipeline.stageGates
      expect(stageGates).toHaveLength(3)
      
      expect(stageGates[0].from).toBe('Prospecting')
      expect(stageGates[0].to).toBe('Engaging')
      expect(stageGates[0].criteria).toContain('Pain identified')
    })
  })

  describe('Stage Gate Readiness', () => {
    it('should check stage gate readiness correctly', () => {
      const responses: MEDDPICCResponse[] = [
        // Pain identified - multiple questions for 50% score
        { pillarId: 'identifyPain', questionId: 'biggest_challenge', answer: 'Clear pain point', points: 8 },
        { pillarId: 'identifyPain', questionId: 'consequences', answer: 'Serious consequences', points: 8 },
        { pillarId: 'identifyPain', questionId: 'previous_attempts', answer: 'Tried solutions', points: 6 },
        
        // Champion identified - multiple questions for 50% score
        { pillarId: 'champion', questionId: 'champion_identity', answer: 'Strong champion', points: 8 },
        { pillarId: 'champion', questionId: 'champion_influence', answer: 'High influence', points: 8 },
        { pillarId: 'champion', questionId: 'champion_commitment', answer: 'Committed', points: 6 },
        
        // Budget confirmed - multiple questions for 50% score
        { pillarId: 'economicBuyer', questionId: 'budget_authority', answer: 'Budget confirmed', points: 8 },
        { pillarId: 'economicBuyer', questionId: 'influence_level', answer: 'High authority', points: 8 },
        { pillarId: 'economicBuyer', questionId: 'meeting_status', answer: 'Met multiple times', points: 8 },
        { pillarId: 'economicBuyer', questionId: 'budget_range', answer: 'Budget range confirmed', points: 6 }
      ]

      const assessment = calculateMEDDPICCScore(responses)
      
      // Should be ready for Prospecting to Engaging gate
      expect(assessment.stageGateReadiness['Prospecting_to_Engaging']).toBe(true)
    })

    it('should identify missing criteria for stage advancement', () => {
      const incompleteResponses: MEDDPICCResponse[] = [
        { pillarId: 'identifyPain', questionId: 'biggest_challenge', answer: 'Some pain', points: 3 }
      ]

      const assessment = calculateMEDDPICCScore(incompleteResponses)
      
      // Should not be ready for advancement
      expect(assessment.stageGateReadiness['Prospecting_to_Engaging']).toBe(false)
    })
  })

  describe('Legacy Compatibility', () => {
    it('should maintain backward compatibility with legacy scoring', () => {
      const legacyScore = calculateMEDDPICCScoreLegacy({
        metrics: 8,
        economic_buyer: 9,
        decision_criteria: 7,
        decision_process: 8,
        paper_process: 6,
        identify_pain: 8,
        champion: 7,
        competition: 6
      })
      
      expect(legacyScore).toBeGreaterThan(0)
      expect(legacyScore).toBeLessThanOrEqual(100)
      expect(typeof legacyScore).toBe('number')
    })
  })

  describe('PEAK Stage Info', () => {
    it('should return correct info for prospecting stage', () => {
      const info = getPEAKStageInfo('prospecting')
      expect(info.name).toBe('Prospecting')
      expect(info.description).toBe('Initial contact and qualification')
      expect(info.nextStage).toBe('engaging')
    })

    it('should return correct info for engaging stage', () => {
      const info = getPEAKStageInfo('engaging')
      expect(info.name).toBe('Engaging')
      expect(info.description).toBe('Active communication and relationship building')
      expect(info.nextStage).toBe('advancing')
    })

    it('should return correct info for advancing stage', () => {
      const info = getPEAKStageInfo('advancing')
      expect(info.name).toBe('Advancing')
      expect(info.description).toBe('Solution presentation and negotiation')
      expect(info.nextStage).toBe('key_decision')
    })

    it('should return correct info for key_decision stage', () => {
      const info = getPEAKStageInfo('key_decision')
      expect(info.name).toBe('Key Decision')
      expect(info.description).toBe('Final decision and closing')
      expect(info.nextStage).toBeUndefined()
    })

    it('should return default info for invalid stage', () => {
      const info = getPEAKStageInfo('invalid')
      expect(info.name).toBe('Prospecting')
      expect(info.description).toBe('Initial contact and qualification')
    })
  })
})
