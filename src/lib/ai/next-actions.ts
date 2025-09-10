import { AIInsightsEngine, InsightContext } from './insights-engine'

export interface NextAction {
  action: string
  priority: 'high' | 'medium' | 'low'
  reasoning: string
  estimatedImpact: number
  estimatedEffort: number
  dueDate?: string
  assignee?: string
  category: 'research' | 'outreach' | 'meeting' | 'proposal' | 'follow_up' | 'documentation' | 'internal'
}

export interface OpportunityContext {
  id: string
  name: string
  stage: string
  meddpiccScore: number
  dealValue: number
  probability: number
  closeDate: string
  createdAt: string
  lastActivityAt?: string
  activities: any[]
  contacts: any[]
  company?: string
  industry?: string
  competition?: string
  economicBuyer?: string
  champion?: string
  decisionProcess?: string
  decisionCriteria?: string
  paperProcess?: string
  identifyPain?: string
  metrics?: string
}

export class NextActionsEngine {
  private static readonly ACTION_TEMPLATES: Record<string, NextAction[]> = {
    'prospecting': [
      {
        action: 'Research company and key stakeholders',
        priority: 'high',
        reasoning: 'Understanding the company and decision makers is crucial for prospecting',
        estimatedImpact: 80,
        estimatedEffort: 2,
        category: 'research'
      },
      {
        action: 'Send personalized cold outreach email',
        priority: 'high',
        reasoning: 'Initial contact to establish relationship and gauge interest',
        estimatedImpact: 70,
        estimatedEffort: 1,
        category: 'outreach'
      },
      {
        action: 'Connect on LinkedIn with key contacts',
        priority: 'medium',
        reasoning: 'Build professional network and increase visibility',
        estimatedImpact: 50,
        estimatedEffort: 1,
        category: 'outreach'
      }
    ],
    'engaging': [
      {
        action: 'Schedule discovery call with champion',
        priority: 'high',
        reasoning: 'Discovery call is essential to understand pain points and requirements',
        estimatedImpact: 90,
        estimatedEffort: 1,
        category: 'meeting'
      },
      {
        action: 'Send relevant case study or whitepaper',
        priority: 'medium',
        reasoning: 'Provide value and demonstrate expertise',
        estimatedImpact: 60,
        estimatedEffort: 1,
        category: 'outreach'
      },
      {
        action: 'Identify economic buyer and decision criteria',
        priority: 'high',
        reasoning: 'Critical for MEDDPICC scoring and deal progression',
        estimatedImpact: 85,
        estimatedEffort: 2,
        category: 'research'
      }
    ],
    'advancing': [
      {
        action: 'Schedule demo or presentation',
        priority: 'high',
        reasoning: 'Demonstrate solution capabilities and value proposition',
        estimatedImpact: 85,
        estimatedEffort: 2,
        category: 'meeting'
      },
      {
        action: 'Prepare formal proposal',
        priority: 'high',
        reasoning: 'Formal proposal moves deal closer to decision',
        estimatedImpact: 80,
        estimatedEffort: 4,
        category: 'proposal'
      },
      {
        action: 'Engage with economic buyer',
        priority: 'high',
        reasoning: 'Economic buyer approval is critical for deal closure',
        estimatedImpact: 90,
        estimatedEffort: 2,
        category: 'meeting'
      }
    ],
    'key_decision': [
      {
        action: 'Schedule final presentation to decision committee',
        priority: 'high',
        reasoning: 'Final presentation to secure decision and close deal',
        estimatedImpact: 95,
        estimatedEffort: 3,
        category: 'meeting'
      },
      {
        action: 'Address any remaining objections',
        priority: 'high',
        reasoning: 'Resolve final concerns before decision',
        estimatedImpact: 85,
        estimatedEffort: 2,
        category: 'follow_up'
      },
      {
        action: 'Prepare contract and legal documentation',
        priority: 'medium',
        reasoning: 'Ensure smooth transition to contract phase',
        estimatedImpact: 70,
        estimatedEffort: 3,
        category: 'documentation'
      }
    ]
  }

  /**
   * Generate next actions using rule-based algorithm
   */
  static generateRuleBasedActions(opportunityContext: OpportunityContext): NextAction[] {
    const actions: NextAction[] = []
    const stage = opportunityContext.stage.toLowerCase()

    // Get base actions for stage
    const stageActions = this.ACTION_TEMPLATES[stage] || []
    actions.push(...stageActions)

    // Add contextual actions based on opportunity data
    const contextualActions = this.generateContextualActions(opportunityContext)
    actions.push(...contextualActions)

    // Add urgency-based actions
    const urgencyActions = this.generateUrgencyActions(opportunityContext)
    actions.push(...urgencyActions)

    // Sort by priority and impact
    return this.prioritizeActions(actions)
  }

  /**
   * Generate next actions using AI-enhanced algorithm
   */
  static async generateAIActions(
    opportunityContext: OpportunityContext,
    context: InsightContext
  ): Promise<NextAction[]> {
    try {
      const insight = await AIInsightsEngine.generateNextActions(
        opportunityContext.id,
        opportunityContext,
        context
      )
      const insightData = insight.insightData as any

      // Convert AI response to NextAction format
      const aiActions: NextAction[] = (insightData.actions || []).map((action: any) => ({
        action: action.action || '',
        priority: action.priority || 'medium',
        reasoning: action.reasoning || '',
        estimatedImpact: action.estimatedImpact || 50,
        estimatedEffort: this.estimateEffort(action.action || ''),
        category: this.categorizeAction(action.action || ''),
        dueDate: this.calculateDueDate(opportunityContext, action.priority)
      }))

      // Merge with rule-based actions for comprehensive coverage
      const ruleBasedActions = this.generateRuleBasedActions(opportunityContext)
      const mergedActions = this.mergeActions(aiActions, ruleBasedActions)

      return this.prioritizeActions(mergedActions)
    } catch (error) {
      console.error('AI next actions failed, falling back to rule-based:', error)
      return this.generateRuleBasedActions(opportunityContext)
    }
  }

  /**
   * Generate contextual actions based on opportunity data
   */
  private static generateContextualActions(opportunityContext: OpportunityContext): NextAction[] {
    const actions: NextAction[] = []

    // MEDDPICC-based actions
    if (opportunityContext.meddpiccScore < 50) {
      actions.push({
        action: 'Improve MEDDPICC score by addressing missing criteria',
        priority: 'high',
        reasoning: 'Low MEDDPICC score indicates missing critical information',
        estimatedImpact: 80,
        estimatedEffort: 3,
        category: 'research'
      })
    }

    // Economic buyer actions
    if (!opportunityContext.economicBuyer) {
      actions.push({
        action: 'Identify and engage with economic buyer',
        priority: 'high',
        reasoning: 'Economic buyer approval is required for deal closure',
        estimatedImpact: 90,
        estimatedEffort: 2,
        category: 'research'
      })
    }

    // Champion actions
    if (!opportunityContext.champion) {
      actions.push({
        action: 'Develop internal champion within organization',
        priority: 'medium',
        reasoning: 'Internal champion helps navigate decision process',
        estimatedImpact: 70,
        estimatedEffort: 3,
        category: 'outreach'
      })
    }

    // Decision process actions
    if (!opportunityContext.decisionProcess) {
      actions.push({
        action: 'Map out decision process and timeline',
        priority: 'medium',
        reasoning: 'Understanding decision process helps manage expectations',
        estimatedImpact: 60,
        estimatedEffort: 2,
        category: 'research'
      })
    }

    // Competition actions
    if (opportunityContext.competition) {
      actions.push({
        action: 'Prepare competitive differentiation strategy',
        priority: 'medium',
        reasoning: 'Competition requires strong differentiation',
        estimatedImpact: 65,
        estimatedEffort: 2,
        category: 'internal'
      })
    }

    return actions
  }

  /**
   * Generate urgency-based actions
   */
  private static generateUrgencyActions(opportunityContext: OpportunityContext): NextAction[] {
    const actions: NextAction[] = []
    const now = new Date()
    const closeDate = new Date(opportunityContext.closeDate)
    const daysToClose = Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Urgent actions based on timeline
    if (daysToClose < 7) {
      actions.push({
        action: 'Accelerate decision process and follow up daily',
        priority: 'high',
        reasoning: 'Close date is approaching rapidly',
        estimatedImpact: 90,
        estimatedEffort: 1,
        category: 'follow_up'
      })
    } else if (daysToClose < 30) {
      actions.push({
        action: 'Increase activity frequency and stakeholder engagement',
        priority: 'medium',
        reasoning: 'Close date is approaching, need to maintain momentum',
        estimatedImpact: 70,
        estimatedEffort: 1,
        category: 'follow_up'
      })
    }

    // Stale opportunity actions
    const lastActivityAt = opportunityContext.lastActivityAt
    if (lastActivityAt) {
      const lastActivity = new Date(lastActivityAt)
      const daysSinceActivity = Math.ceil((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceActivity > 14) {
        actions.push({
          action: 'Re-engage with immediate follow-up call or email',
          priority: 'high',
          reasoning: 'Opportunity has been inactive for too long',
          estimatedImpact: 75,
          estimatedEffort: 1,
          category: 'follow_up'
        })
      }
    }

    return actions
  }

  /**
   * Prioritize actions by priority and impact
   */
  private static prioritizeActions(actions: NextAction[]): NextAction[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    
    return actions
      .sort((a, b) => {
        // First by priority
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        
        // Then by impact
        return b.estimatedImpact - a.estimatedImpact
      })
      .slice(0, 5) // Limit to top 5 actions
  }

  /**
   * Merge AI and rule-based actions
   */
  private static mergeActions(aiActions: NextAction[], ruleActions: NextAction[]): NextAction[] {
    const merged = [...ruleActions]
    
    // Add unique AI actions that don't overlap with rule-based
    for (const aiAction of aiActions) {
      const isDuplicate = ruleActions.some(ruleAction => 
        this.actionsAreSimilar(aiAction.action, ruleAction.action)
      )
      
      if (!isDuplicate) {
        merged.push(aiAction)
      }
    }
    
    return merged
  }

  /**
   * Check if two actions are similar
   */
  private static actionsAreSimilar(action1: string, action2: string): boolean {
    const words1 = action1.toLowerCase().split(' ')
    const words2 = action2.toLowerCase().split(' ')
    
    // Check for significant word overlap
    const commonWords = words1.filter(word => words2.includes(word))
    return commonWords.length >= Math.min(words1.length, words2.length) * 0.6
  }

  /**
   * Estimate effort for an action
   */
  private static estimateEffort(action: string): number {
    const actionLower = action.toLowerCase()
    
    if (actionLower.includes('research') || actionLower.includes('prepare') || actionLower.includes('documentation')) {
      return 3
    } else if (actionLower.includes('meeting') || actionLower.includes('presentation') || actionLower.includes('demo')) {
      return 2
    } else if (actionLower.includes('email') || actionLower.includes('call') || actionLower.includes('follow')) {
      return 1
    } else {
      return 2
    }
  }

  /**
   * Categorize action based on content
   */
  private static categorizeAction(action: string): NextAction['category'] {
    const actionLower = action.toLowerCase()
    
    if (actionLower.includes('research') || actionLower.includes('identify') || actionLower.includes('map')) {
      return 'research'
    } else if (actionLower.includes('email') || actionLower.includes('outreach') || actionLower.includes('connect')) {
      return 'outreach'
    } else if (actionLower.includes('meeting') || actionLower.includes('call') || actionLower.includes('demo') || actionLower.includes('presentation')) {
      return 'meeting'
    } else if (actionLower.includes('proposal') || actionLower.includes('quote') || actionLower.includes('pricing')) {
      return 'proposal'
    } else if (actionLower.includes('follow') || actionLower.includes('check') || actionLower.includes('update')) {
      return 'follow_up'
    } else if (actionLower.includes('document') || actionLower.includes('contract') || actionLower.includes('legal')) {
      return 'documentation'
    } else {
      return 'internal'
    }
  }

  /**
   * Calculate due date for action
   */
  private static calculateDueDate(opportunityContext: OpportunityContext, priority: string): string {
    const now = new Date()
    const daysToAdd = priority === 'high' ? 1 : priority === 'medium' ? 3 : 7
    
    const dueDate = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000))
    return dueDate.toISOString().split('T')[0]
  }

  /**
   * Get action recommendations based on opportunity stage
   */
  static getStageRecommendations(stage: string): string[] {
    const recommendations: Record<string, string[]> = {
      'prospecting': [
        'Focus on building initial relationships',
        'Research company and key stakeholders thoroughly',
        'Send personalized, value-driven outreach'
      ],
      'engaging': [
        'Schedule discovery meetings to understand pain points',
        'Identify decision makers and economic buyers',
        'Provide relevant content and case studies'
      ],
      'advancing': [
        'Demonstrate solution capabilities through demos',
        'Engage with economic buyers and decision makers',
        'Prepare formal proposals and pricing'
      ],
      'key_decision': [
        'Schedule final presentations to decision committees',
        'Address any remaining objections',
        'Prepare for contract and legal discussions'
      ]
    }

    return recommendations[stage.toLowerCase()] || []
  }

  /**
   * Update opportunity with next actions
   */
  static async updateOpportunityActions(
    opportunityId: string,
    actions: NextAction[]
  ): Promise<void> {
    // This would typically update the opportunity record in the database
    console.log(`Updating opportunity ${opportunityId} with ${actions.length} next actions`)
  }

  /**
   * Batch generate actions for multiple opportunities
   */
  static async batchGenerateActions(
    opportunities: OpportunityContext[],
    context: InsightContext,
    useAI: boolean = true
  ): Promise<Array<{
    opportunityId: string
    actions: NextAction[]
  }>> {
    const results = []

    for (const opportunity of opportunities) {
      try {
        let actions: NextAction[]

        if (useAI) {
          actions = await this.generateAIActions(opportunity, context)
        } else {
          actions = this.generateRuleBasedActions(opportunity)
        }

        results.push({
          opportunityId: opportunity.id,
          actions
        })
      } catch (error) {
        console.error(`Failed to generate actions for opportunity ${opportunity.id}:`, error)
        // Add fallback actions
        const fallbackActions = this.generateRuleBasedActions(opportunity)
        results.push({
          opportunityId: opportunity.id,
          actions: fallbackActions
        })
      }
    }

    return results
  }
}
