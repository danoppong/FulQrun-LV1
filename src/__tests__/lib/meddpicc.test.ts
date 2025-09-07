import { 
  calculateMEDDPICCScore, 
  getMEDDPICCLevel, 
  getPEAKStageInfo,
  MEDDPICCData 
} from '@/lib/meddpicc'

describe('MEDDPICC Scoring', () => {
  const completeMEDDPICCData: MEDDPICCData = {
    metrics: 'Reduce operational costs by 30%',
    economic_buyer: 'CFO John Smith',
    decision_criteria: 'ROI, implementation time, vendor support',
    decision_process: 'CFO approval required, board review',
    paper_process: 'Contract review by legal team',
    identify_pain: 'Current system causing 20% efficiency loss',
    champion: 'IT Director Sarah Johnson',
    competition: 'Salesforce, HubSpot'
  }

  const incompleteMEDDPICCData: MEDDPICCData = {
    metrics: 'Reduce costs',
    economic_buyer: '',
    decision_criteria: '',
    decision_process: '',
    paper_process: '',
    identify_pain: '',
    champion: '',
    competition: ''
  }

  describe('calculateMEDDPICCScore', () => {
    it('should calculate score for complete MEDDPICC data', () => {
      const score = calculateMEDDPICCScore(completeMEDDPICCData)
      
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
      expect(typeof score).toBe('number')
    })

    it('should calculate score for incomplete MEDDPICC data', () => {
      const score = calculateMEDDPICCScore(incompleteMEDDPICCData)
      
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
      expect(typeof score).toBe('number')
    })

    it('should return 0 for empty MEDDPICC data', () => {
      const emptyData: MEDDPICCData = {
        metrics: '',
        economic_buyer: '',
        decision_criteria: '',
        decision_process: '',
        paper_process: '',
        identify_pain: '',
        champion: '',
        competition: ''
      }

      const score = calculateMEDDPICCScore(emptyData)
      expect(score).toBe(0)
    })

    it('should handle null values correctly', () => {
      const nullData: MEDDPICCData = {
        metrics: null,
        economic_buyer: null,
        decision_criteria: null,
        decision_process: null,
        paper_process: null,
        identify_pain: null,
        champion: null,
        competition: null
      }

      const score = calculateMEDDPICCScore(nullData)
      expect(score).toBe(0)
    })

    it('should give higher scores for more detailed responses', () => {
      const detailedData: MEDDPICCData = {
        metrics: 'Reduce operational costs by 30% ($500K annually) and improve efficiency by 25%',
        economic_buyer: 'CFO John Smith (john.smith@company.com, +1-555-123-4567)',
        decision_criteria: 'ROI > 200%, implementation < 6 months, vendor support 24/7',
        decision_process: 'CFO approval → Board review → Legal contract review → Implementation',
        paper_process: 'Contract review by legal team, security audit, compliance check',
        identify_pain: 'Current system causing 20% efficiency loss, $200K in manual work annually',
        champion: 'IT Director Sarah Johnson (sarah.johnson@company.com) - strong advocate',
        competition: 'Salesforce (expensive), HubSpot (limited features), Custom solution (risky)'
      }

      const detailedScore = calculateMEDDPICCScore(detailedData)
      const basicScore = calculateMEDDPICCScore(completeMEDDPICCData)
      
      expect(detailedScore).toBeGreaterThan(basicScore)
    })
  })

  describe('getMEDDPICCLevel', () => {
    it('should return correct level for high scores', () => {
      expect(getMEDDPICCLevel(85)).toBe('High')
      expect(getMEDDPICCLevel(90)).toBe('High')
      expect(getMEDDPICCLevel(100)).toBe('High')
    })

    it('should return correct level for medium scores', () => {
      expect(getMEDDPICCLevel(50)).toBe('Medium')
      expect(getMEDDPICCLevel(60)).toBe('Medium')
      expect(getMEDDPICCLevel(70)).toBe('Medium')
    })

    it('should return correct level for low scores', () => {
      expect(getMEDDPICCLevel(10)).toBe('Low')
      expect(getMEDDPICCLevel(30)).toBe('Low')
      expect(getMEDDPICCLevel(40)).toBe('Low')
    })

    it('should handle edge cases', () => {
      expect(getMEDDPICCLevel(0)).toBe('Low')
      expect(getMEDDPICCLevel(80)).toBe('High')
      expect(getMEDDPICCLevel(79)).toBe('Medium')
    })
  })

  describe('getPEAKStageInfo', () => {
    it('should return correct info for prospecting stage', () => {
      const info = getPEAKStageInfo('prospecting')
      
      expect(info.name).toBe('Prospecting')
      expect(info.description).toBe('Initial contact and qualification')
      expect(info.color).toBe('bg-blue-500')
      expect(info.nextStage).toBe('engaging')
    })

    it('should return correct info for engaging stage', () => {
      const info = getPEAKStageInfo('engaging')
      
      expect(info.name).toBe('Engaging')
      expect(info.description).toBe('Active communication and relationship building')
      expect(info.color).toBe('bg-yellow-500')
      expect(info.nextStage).toBe('advancing')
    })

    it('should return correct info for advancing stage', () => {
      const info = getPEAKStageInfo('advancing')
      
      expect(info.name).toBe('Advancing')
      expect(info.description).toBe('Solution presentation and negotiation')
      expect(info.color).toBe('bg-orange-500')
      expect(info.nextStage).toBe('key_decision')
    })

    it('should return correct info for key_decision stage', () => {
      const info = getPEAKStageInfo('key_decision')
      
      expect(info.name).toBe('Key Decision')
      expect(info.description).toBe('Final decision and closing')
      expect(info.color).toBe('bg-green-500')
      expect(info.nextStage).toBeUndefined()
    })

    it('should return default info for invalid stage', () => {
      const info = getPEAKStageInfo('invalid_stage')
      
      expect(info.name).toBe('Prospecting')
      expect(info.description).toBe('Initial contact and qualification')
      expect(info.color).toBe('bg-blue-500')
      expect(info.nextStage).toBe('engaging')
    })
  })

  describe('edge cases', () => {
    it('should handle very long text inputs', () => {
      const longTextData: MEDDPICCData = {
        metrics: 'A'.repeat(1000),
        economic_buyer: 'B'.repeat(1000),
        decision_criteria: 'C'.repeat(1000),
        decision_process: 'D'.repeat(1000),
        paper_process: 'E'.repeat(1000),
        identify_pain: 'F'.repeat(1000),
        champion: 'G'.repeat(1000),
        competition: 'H'.repeat(1000)
      }

      const score = calculateMEDDPICCScore(longTextData)
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should handle special characters', () => {
      const specialCharData: MEDDPICCData = {
        metrics: 'Reduce costs by 30% & improve efficiency',
        economic_buyer: 'José García-López (CFO)',
        decision_criteria: 'ROI > 200%, implementation < 6 months',
        decision_process: 'CFO → Board → Legal → Implementation',
        paper_process: 'Contract review, security audit, compliance',
        identify_pain: 'Current system causing 20% efficiency loss',
        champion: 'IT Director Sarah Johnson (sarah@company.com)',
        competition: 'Salesforce, HubSpot, Custom solution'
      }

      const score = calculateMEDDPICCScore(specialCharData)
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })
})
