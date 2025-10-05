import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface AIResponse {
  content: string
  confidence: number
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface AIInsightRequest {
  type: 'lead_scoring' | 'deal_risk' | 'next_action' | 'forecasting' | 'performance'
  data: Record<string, unknown>
  context?: Record<string, unknown>
}

export class OpenAIClient {
  /**
   * Generate AI insights based on request type and data
   */
  static async generateInsight(request: AIInsightRequest): Promise<AIResponse> {
    const prompt = this.buildPrompt(request)
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request.type)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      })

      const content = response.choices[0]?.message?.content || ''
      const confidence = this.calculateConfidence(content, response.choices[0]?.finish_reason)

      return {
        content,
        confidence,
        usage: response.usage
      }
    } catch (_error) {
      throw new Error('Failed to generate AI insight')
    }
  }

  /**
   * Generate lead scoring insight
   */
  static async scoreLead(leadData: {
    firstName: string
    lastName: string
    email: string
    company: string
    source: string
    industry?: string
    companySize?: string
    engagement?: Array<{
      id: string
      type: string
      timestamp: string
      value: number
    }>
  }): Promise<{
    score: number
    confidence: number
    factors: Record<string, number>
    recommendations: string[]
  }> {
    const _prompt = `Analyze this lead and provide a score from 0-100:

Lead Information:
- Name: ${leadData.firstName} ${leadData.lastName}
- Email: ${leadData.email}
- Company: ${leadData.company}
- Source: ${leadData.source}
- Industry: ${leadData.industry || 'Unknown'}
- Company Size: ${leadData.companySize || 'Unknown'}
- Engagement: ${leadData.engagement?.length || 0} activities

Please provide:
1. Overall score (0-100)
2. Confidence level (0-1)
3. Factor scores for: source, company_size, industry, engagement, demographics
4. Top 3 recommendations to improve lead quality

Respond in JSON format.`

    const response = await this.generateInsight({
      type: 'lead_scoring',
      data: leadData
    })

    try {
      const parsed = JSON.parse(response.content)
      return {
        score: parsed.score || 0,
        confidence: parsed.confidence || 0.5,
        factors: parsed.factors || {},
        recommendations: parsed.recommendations || []
      }
    } catch {
      // Fallback parsing if JSON is malformed
      return {
        score: 50,
        confidence: 0.3,
        factors: {},
        recommendations: ['Review lead data quality']
      }
    }
  }

  /**
   * Generate deal risk assessment
   */
  static async assessDealRisk(opportunityData: {
    name: string
    stage: string
    meddpiccScore: number
    dealValue: number
    probability: number
    closeDate: string
    daysInStage: number
    lastActivity: string
  }): Promise<{
    riskScore: number
    confidence: number
    riskFactors: Record<string, number>
    mitigationStrategies: string[]
  }> {
    const _prompt = `Assess the risk level of this sales opportunity:

Opportunity Information:
- Name: ${opportunityData.name}
- Stage: ${opportunityData.stage}
- MEDDPICC Score: ${opportunityData.meddpiccScore}/100
- Deal Value: $${opportunityData.dealValue?.toLocaleString() || 'Unknown'}
- Probability: ${opportunityData.probability}%
- Close Date: ${opportunityData.closeDate}
- Days in Current Stage: ${opportunityData.daysInStage}
- Last Activity: ${opportunityData.lastActivity}

Please provide:
1. Risk score (0-100, where 100 is highest risk)
2. Confidence level (0-1)
3. Risk factor scores for: stage, meddpicc, timeline, value, competition
4. Top 3 mitigation strategies

Respond in JSON format.`

    const response = await this.generateInsight({
      type: 'deal_risk',
      data: opportunityData
    })

    try {
      const parsed = JSON.parse(response.content)
      return {
        riskScore: parsed.riskScore || 50,
        confidence: parsed.confidence || 0.5,
        riskFactors: parsed.riskFactors || {},
        mitigationStrategies: parsed.mitigationStrategies || []
      }
    } catch {
      return {
        riskScore: 50,
        confidence: 0.3,
        riskFactors: {},
        mitigationStrategies: ['Review opportunity details']
      }
    }
  }

  /**
   * Generate next best action recommendations
   */
  static async getNextActions(opportunityData: {
    name: string
    stage: string
    meddpiccScore: number
    lastActivity: string
    activities: Array<{
      id: string
      type: string
      description: string
      createdAt: string
      userId: string
    }>
    contacts: Array<{
      id: string
      name: string
      email: string
      role: string
      influence: number
    }>
  }): Promise<{
    actions: Array<{
      action: string
      priority: 'high' | 'medium' | 'low'
      reasoning: string
      estimatedImpact: number
    }>
    confidence: number
  }> {
    const _prompt = `Recommend the next best actions for this sales opportunity:

Opportunity Information:
- Name: ${opportunityData.name}
- Stage: ${opportunityData.stage}
- MEDDPICC Score: ${opportunityData.meddpiccScore}/100
- Last Activity: ${opportunityData.lastActivity}
- Recent Activities: ${opportunityData.activities?.length || 0} activities
- Contacts: ${opportunityData.contacts?.length || 0} contacts

Please provide:
1. Top 3-5 next actions with priority levels
2. Reasoning for each action
3. Estimated impact score (0-100)
4. Overall confidence level (0-1)

Respond in JSON format.`

    const response = await this.generateInsight({
      type: 'next_action',
      data: opportunityData
    })

    try {
      const parsed = JSON.parse(response.content)
      return {
        actions: parsed.actions || [],
        confidence: parsed.confidence || 0.5
      }
    } catch {
      return {
        actions: [{
          action: 'Schedule follow-up call',
          priority: 'medium' as const,
          reasoning: 'Continue relationship building',
          estimatedImpact: 50
        }],
        confidence: 0.3
      }
    }
  }

  /**
   * Generate sales forecasting insight
   */
  static async generateForecast(pipelineData: {
    opportunities: Array<{
      id: string
      name: string
      stage: string
      value: number
      probability: number
      closeDate: string
    }>
    historicalData: Array<{
      id: string
      type: string
      timestamp: string
      value: number
      context: Record<string, unknown>
    }>
    timeRange: string
  }): Promise<{
    forecast: {
      shortTerm: number
      longTerm: number
      confidence: number
    }
    trends: {
      growth: number
      seasonality: number
      marketFactors: string[]
    }
  }> {
    const _prompt = `Generate sales forecast based on this pipeline data:

Pipeline Data:
- Active Opportunities: ${pipelineData.opportunities?.length || 0}
- Historical Data Points: ${pipelineData.historicalData?.length || 0}
- Time Range: ${pipelineData.timeRange}

Please provide:
1. Short-term forecast (next 30 days)
2. Long-term forecast (next 90 days)
3. Confidence level (0-1)
4. Growth trend percentage
5. Seasonality factor
6. Key market factors affecting forecast

Respond in JSON format.`

    const response = await this.generateInsight({
      type: 'forecasting',
      data: pipelineData
    })

    try {
      const parsed = JSON.parse(response.content)
      return {
        forecast: parsed.forecast || { shortTerm: 0, longTerm: 0, confidence: 0.5 },
        trends: parsed.trends || { growth: 0, seasonality: 0, marketFactors: [] }
      }
    } catch {
      return {
        forecast: { shortTerm: 0, longTerm: 0, confidence: 0.3 },
        trends: { growth: 0, seasonality: 0, marketFactors: [] }
      }
    }
  }

  /**
   * Generate performance insights
   */
  static async analyzePerformance(performanceData: {
    metrics: Record<string, number>
    period: string
    benchmarks: Record<string, number>
  }): Promise<{
    insights: string[]
    recommendations: string[]
    strengths: string[]
    weaknesses: string[]
  }> {
    const _prompt = `Analyze this sales performance data:

Performance Metrics:
${Object.entries(performanceData.metrics).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Period: ${performanceData.period}

Benchmarks:
${Object.entries(performanceData.benchmarks).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Please provide:
1. Key insights about performance
2. Actionable recommendations
3. Top 3 strengths
4. Top 3 areas for improvement

Respond in JSON format.`

    const response = await this.generateInsight({
      type: 'performance',
      data: performanceData
    })

    try {
      const parsed = JSON.parse(response.content)
      return {
        insights: parsed.insights || [],
        recommendations: parsed.recommendations || [],
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || []
      }
    } catch {
      return {
        insights: ['Performance data needs review'],
        recommendations: ['Focus on key metrics'],
        strengths: [],
        weaknesses: ['Data quality']
      }
    }
  }

  /**
   * Build prompt based on request type
   */
  private static buildPrompt(request: AIInsightRequest): string {
    const basePrompt = `Analyze the following data and provide insights:`
    const dataString = JSON.stringify(request.data, null, 2)
    const contextString = request.context ? JSON.stringify(request.context, null, 2) : ''
    
    return `${basePrompt}\n\nData:\n${dataString}\n\nContext:\n${contextString}`
  }

  /**
   * Get system prompt based on insight type
   */
  private static getSystemPrompt(type: string): string {
    const prompts = {
      lead_scoring: 'You are a sales expert specializing in lead qualification. Analyze lead data and provide scoring insights with specific recommendations.',
      deal_risk: 'You are a sales risk analyst. Assess deal risk factors and provide mitigation strategies for sales opportunities.',
      next_action: 'You are a sales coach. Recommend specific next actions to advance sales opportunities based on current context.',
      forecasting: 'You are a sales forecasting expert. Analyze pipeline data and provide accurate revenue predictions with trend analysis.',
      performance: 'You are a sales performance analyst. Review metrics and provide actionable insights for improvement.'
    }

    return prompts[type as keyof typeof prompts] || 'You are a sales expert providing data-driven insights.'
  }

  /**
   * Calculate confidence score based on response quality
   */
  private static calculateConfidence(content: string, finishReason?: string): number {
    let confidence = 0.5 // Base confidence

    // Adjust based on content length and quality
    if (content.length > 200) confidence += 0.2
    if (content.includes('JSON') || content.includes('{')) confidence += 0.1
    if (finishReason === 'stop') confidence += 0.2

    // Cap at 1.0
    return Math.min(confidence, 1.0)
  }
}
