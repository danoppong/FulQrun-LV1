import { leadScoringEngine, LeadData, LeadScoringRule } from '@/lib/scoring/leadScoring'

describe('Lead Scoring Engine', () => {
  const sampleLeadData: LeadData = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    company: 'Acme Corp',
    source: 'website'
  }

  describe('calculateScore', () => {
    it('should calculate score correctly for complete lead data', () => {
      const result = leadScoringEngine.calculateScore(sampleLeadData)
      
      expect(result.totalScore).toBeGreaterThan(0)
      expect(result.maxScore).toBeGreaterThan(0)
      expect(result.percentage).toBeGreaterThan(0)
      expect(result.percentage).toBeLessThanOrEqual(100)
      expect(['hot', 'warm', 'cold']).toContain(result.category)
      expect(result.breakdown).toBeInstanceOf(Array)
      expect(result.breakdown.length).toBeGreaterThan(0)
    })

    it('should handle missing optional fields', () => {
      const incompleteData: LeadData = {
        first_name: 'Jane',
        last_name: 'Smith',
        email: null,
        phone: null,
        company: null,
        source: null
      }

      const result = leadScoringEngine.calculateScore(incompleteData)
      
      expect(result.totalScore).toBeGreaterThanOrEqual(0)
      expect(result.maxScore).toBeGreaterThan(0)
      expect(result.percentage).toBeGreaterThanOrEqual(0)
      expect(result.percentage).toBeLessThanOrEqual(100)
    })

    it('should categorize leads correctly by score', () => {
      // Test hot lead (high score)
      const hotLeadData: LeadData = {
        ...sampleLeadData,
        email: 'ceo@enterprise.com',
        company: 'Fortune 500 Company',
        source: 'referral'
      }
      
      const hotResult = leadScoringEngine.calculateScore(hotLeadData)
      expect(hotResult.category).toBe('hot')

      // Test cold lead (low score)
      const coldLeadData: LeadData = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@freemail.com',
        company: 'Small Business',
        source: 'cold_call'
      }
      
      const coldResult = leadScoringEngine.calculateScore(coldLeadData)
      expect(coldResult.category).toBe('cold')
    })

    it('should apply all scoring rules correctly', () => {
      const result = leadScoringEngine.calculateScore(sampleLeadData)
      
      // Check that each rule in breakdown has required properties
      result.breakdown.forEach(ruleResult => {
        expect(ruleResult).toHaveProperty('rule')
        expect(ruleResult).toHaveProperty('score')
        expect(ruleResult).toHaveProperty('matched')
        expect(ruleResult.rule).toHaveProperty('id')
        expect(ruleResult.rule).toHaveProperty('name')
        expect(ruleResult.rule).toHaveProperty('weight')
        expect(typeof ruleResult.score).toBe('number')
        expect(typeof ruleResult.matched).toBe('boolean')
      })
    })
  })

  describe('getDefaultRules', () => {
    it('should return array of scoring rules', () => {
      const rules = leadScoringEngine.getDefaultRules()
      
      expect(Array.isArray(rules)).toBe(true)
      expect(rules.length).toBeGreaterThan(0)
      
      rules.forEach(rule => {
        expect(rule).toHaveProperty('id')
        expect(rule).toHaveProperty('name')
        expect(rule).toHaveProperty('field')
        expect(rule).toHaveProperty('condition')
        expect(rule).toHaveProperty('weight')
        expect(rule).toHaveProperty('description')
        expect(typeof rule.weight).toBe('number')
        expect(rule.weight).toBeGreaterThan(0)
      })
    })

    it('should have unique rule IDs', () => {
      const rules = leadScoringEngine.getDefaultRules()
      const ids = rules.map(rule => rule.id)
      const uniqueIds = new Set(ids)
      
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('validateRule', () => {
    it('should validate correct rule structure', () => {
      const validRule: LeadScoringRule = {
        id: 'test-rule',
        name: 'Test Rule',
        field: 'email',
        condition: 'contains',
        value: '@enterprise.com',
        weight: 10,
        description: 'Test rule for enterprise emails'
      }

      const isValid = leadScoringEngine.validateRule(validRule)
      expect(isValid).toBe(true)
    })

    it('should reject invalid rule structure', () => {
      const invalidRule = {
        id: 'test-rule',
        // Missing required fields
        weight: 10
      }

      const isValid = leadScoringEngine.validateRule(invalidRule as LeadScoringRule)
      expect(isValid).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle empty lead data', () => {
      const emptyData: LeadData = {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        source: ''
      }

      const result = leadScoringEngine.calculateScore(emptyData)
      expect(result.totalScore).toBeGreaterThanOrEqual(0)
      expect(result.percentage).toBeGreaterThanOrEqual(0)
    })

    it('should handle special characters in data', () => {
      const specialCharData: LeadData = {
        first_name: 'José',
        last_name: 'García-López',
        email: 'josé.garcía@empresa.es',
        phone: '+34 123 456 789',
        company: 'Empresa & Asociados',
        source: 'website'
      }

      const result = leadScoringEngine.calculateScore(specialCharData)
      expect(result.totalScore).toBeGreaterThanOrEqual(0)
      expect(result.breakdown).toBeInstanceOf(Array)
    })

    it('should handle very long strings', () => {
      const longStringData: LeadData = {
        first_name: 'A'.repeat(1000),
        last_name: 'B'.repeat(1000),
        email: 'test@' + 'example.com'.repeat(100),
        phone: '1234567890'.repeat(10),
        company: 'C'.repeat(1000),
        source: 'website'
      }

      const result = leadScoringEngine.calculateScore(longStringData)
      expect(result.totalScore).toBeGreaterThanOrEqual(0)
      expect(result.breakdown).toBeInstanceOf(Array)
    })
  })
})
