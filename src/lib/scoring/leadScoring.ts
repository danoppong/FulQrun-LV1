export interface LeadScoringRule {
  id: string
  name: string
  field: string
  condition: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty'
  value?: string
  weight: number
  description: string
}

export interface LeadData {
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  source?: string | null
  [key: string]: string | number | boolean | null | undefined
}

export interface LeadScore {
  totalScore: number
  maxScore: number
  percentage: number
  category: 'hot' | 'warm' | 'cold'
  breakdown: {
    rule: LeadScoringRule
    score: number
    matched: boolean
  }[]
}

// Default lead scoring rules
export const defaultLeadScoringRules: LeadScoringRule[] = [
  {
    id: 'email_present',
    name: 'Email Present',
    field: 'email',
    condition: 'is_not_empty',
    weight: 20,
    description: 'Lead has an email address'
  },
  {
    id: 'cold_call_penalty',
    name: 'Cold Call Penalty',
    field: 'source',
    condition: 'equals',
    value: 'cold_call',
    weight: 5,
    description: 'Cold-call sourced leads get minimal points'
  },
  {
    id: 'phone_present',
    name: 'Phone Present',
    field: 'phone',
    condition: 'is_not_empty',
    weight: 15,
    description: 'Lead has a phone number'
  },
  {
    id: 'company_present',
    name: 'Company Present',
    field: 'company',
    condition: 'is_not_empty',
    weight: 35,
    description: 'Lead has a company name'
  },
  {
    id: 'website_referral',
    name: 'Website Referral',
    field: 'source',
    condition: 'equals',
    value: 'website',
    weight: 15,
    description: 'Lead came from website'
  },
  {
    id: 'social_media',
    name: 'Social Media',
    field: 'source',
    condition: 'equals',
    value: 'social',
    weight: 15,
    description: 'Lead came from social media'
  },
  {
    id: 'referral',
    name: 'Referral',
    field: 'source',
    condition: 'equals',
    value: 'referral',
    weight: 40,
    description: 'Lead came from referral'
  },
  {
    id: 'trade_show',
    name: 'Trade Show',
    field: 'source',
    condition: 'equals',
    value: 'trade_show',
    weight: 20,
    description: 'Lead came from trade show'
  },
  {
    id: 'cold_outreach',
    name: 'Cold Outreach',
    field: 'source',
    condition: 'equals',
    value: 'cold_outreach',
    weight: 5,
    description: 'Lead from cold outreach'
  },
  {
    id: 'enterprise_company',
    name: 'Enterprise Company',
    field: 'company',
    condition: 'contains',
    value: 'company',
    weight: 15,
    description: 'Company appears to be enterprise (contains "inc")'
  },
  {
    id: 'tech_company',
    name: 'Technology Company',
    field: 'company',
    condition: 'contains',
    value: 'tech',
    weight: 8,
    description: 'Company appears to be in technology sector'
  }
]

export class LeadScoringEngine {
  private rules: LeadScoringRule[]

  constructor(rules: LeadScoringRule[] = defaultLeadScoringRules) {
    this.rules = rules
  }

  /**
   * Calculate lead score based on rules
   */
  calculateScore(leadData: LeadData): LeadScore {
    const breakdown = this.rules.map(rule => {
      const matched = this.evaluateRule(rule, leadData)
      const score = matched ? rule.weight : 0
      
      return {
        rule,
        score,
        matched
      }
    })

    const totalScore = breakdown.reduce((sum, item) => sum + item.score, 0)
    const maxScore = this.rules.reduce((sum, rule) => sum + rule.weight, 0)
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

    let category: 'hot' | 'warm' | 'cold'
    if (percentage >= 65) {
      category = 'hot'
    } else if (percentage >= 35) {
      category = 'warm'
    } else {
      category = 'cold'
    }

    return {
      totalScore,
      maxScore,
      percentage,
      category,
      breakdown
    }
  }

  /**
   * Evaluate a single rule against lead data
   */
  private evaluateRule(rule: LeadScoringRule, leadData: LeadData): boolean {
    const fieldValue = leadData[rule.field]
    
    switch (rule.condition) {
      case 'equals':
        return fieldValue === rule.value
      case 'contains':
        return !!(fieldValue && typeof fieldValue === 'string' && 
               fieldValue.toLowerCase().includes(rule.value?.toLowerCase() || ''))
      case 'starts_with':
        return !!(fieldValue && typeof fieldValue === 'string' && 
               fieldValue.toLowerCase().startsWith(rule.value?.toLowerCase() || ''))
      case 'ends_with':
        return !!(fieldValue && typeof fieldValue === 'string' && 
               fieldValue.toLowerCase().endsWith(rule.value?.toLowerCase() || ''))
      case 'is_empty':
        return !fieldValue || fieldValue === ''
      case 'is_not_empty':
        return !!(fieldValue && fieldValue !== '')
      default:
        return false
    }
  }

  /**
   * Get scoring rules
   */
  getRules(): LeadScoringRule[] {
    return [...this.rules]
  }

  /**
   * Return the default rules shipped with the engine
   */
  getDefaultRules(): LeadScoringRule[] {
    return [...defaultLeadScoringRules]
  }

  /**
   * Validate a rule structure
   */
  validateRule(rule: LeadScoringRule): boolean {
    if (!rule) return false
    const hasRequired = !!(rule.id && rule.name && rule.field && rule.condition !== undefined)
    const validCondition = ['equals','contains','starts_with','ends_with','is_empty','is_not_empty'].includes(rule.condition)
    const hasWeight = typeof rule.weight === 'number'
    return hasRequired && validCondition && hasWeight
  }

  /**
   * Update scoring rules
   */
  updateRules(rules: LeadScoringRule[]): void {
    this.rules = rules
  }

  /**
   * Add a new scoring rule
   */
  addRule(rule: LeadScoringRule): void {
    this.rules.push(rule)
  }

  /**
   * Remove a scoring rule
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId)
  }

  /**
   * Get category color for UI
   */
  getCategoryColor(category: 'hot' | 'warm' | 'cold'): string {
    switch (category) {
      case 'hot':
        return 'text-red-600 bg-red-100'
      case 'warm':
        return 'text-yellow-600 bg-yellow-100'
      case 'cold':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  /**
   * Get category icon for UI
   */
  getCategoryIcon(category: 'hot' | 'warm' | 'cold'): string {
    switch (category) {
      case 'hot':
        return '🔥'
      case 'warm':
        return '🌡️'
      case 'cold':
        return '❄️'
      default:
        return '📊'
    }
  }
}

// Export a default instance
export const leadScoringEngine = new LeadScoringEngine()