// src/lib/ml/models/lead-scoring.ts
// Lead Scoring Models for Phase 2.9
// Intelligent lead qualification and scoring using AI

import { inferenceEngine, type PredictionRequest } from '../infrastructure/inference-engine';

export interface LeadScoringInput {
  organizationId: string;
  leadId: string;
  leadData: LeadData;
  companyData: CompanyData;
  contactData: ContactData;
  engagementData: EngagementData;
  contextData?: ContextData;
  scoringModel?: 'default' | 'pharmaceutical' | 'custom';
}

export interface LeadData {
  source: string;
  campaign: string;
  referralType: string;
  qualification: string;
  budget: number;
  timeline: string;
  painPoints: string[];
  requirements: string[];
  decisionProcess: string;
}

export interface CompanyData {
  name: string;
  industry: string;
  size: number;
  revenue: number;
  location: string;
  therapeuticAreas: string[];
  currentSolutions: string[];
  competitorUsage: string[];
  marketPosition: string;
}

export interface ContactData {
  title: string;
  department: string;
  seniority: string;
  influence: number;
  responsiveness: number;
  previousInteractions: number;
  socialPresence: number;
  networkConnections: number;
}

export interface EngagementData {
  emailOpens: number;
  emailClicks: number;
  websiteVisits: number;
  contentDownloads: number;
  webinarAttendance: number;
  callParticipation: number;
  responseRate: number;
  engagementScore: number;
}

export interface ContextData {
  seasonality: number;
  marketTrends: Record<string, number>;
  competitorActivity: number;
  economicIndicators: Record<string, number>;
  industryGrowth: number;
  regulatoryChanges: string[];
}

export interface LeadScoringOutput {
  leadId: string;
  overallScore: number;
  scoreBreakdown: ScoreBreakdown;
  qualification: QualificationLevel;
  priority: Priority;
  insights: LeadInsight[];
  recommendations: LeadRecommendation[];
  nextBestActions: NextBestAction[];
  confidence: number;
  metadata: LeadScoringMetadata;
}

export interface ScoreBreakdown {
  fitScore: number;
  intentScore: number;
  engagementScore: number;
  timelinessScore: number;
  budgetScore: number;
  authorityScore: number;
  needScore: number;
  competitiveScore: number;
}

export interface QualificationLevel {
  level: 'hot' | 'warm' | 'cold' | 'unqualified';
  probability: number;
  reasoning: string[];
  meddpicMatch: MEDDPICCAlignment;
}

export interface MEDDPICCAlignment {
  metrics: number;
  economicBuyer: number;
  decisionCriteria: number;
  decisionProcess: number;
  paperProcess: number;
  identifyPain: number;
  champion: number;
  competition: number;
  overallAlignment: number;
}

export interface Priority {
  level: 'high' | 'medium' | 'low';
  urgency: number;
  impact: number;
  effort: number;
  riskLevel: number;
}

export interface LeadInsight {
  type: 'opportunity' | 'risk' | 'timing' | 'competitive' | 'behavioral';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  evidence: string[];
}

export interface LeadRecommendation {
  id: string;
  type: 'outreach' | 'nurturing' | 'qualification' | 'disqualification';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  expectedImpact: number;
  timeframe: string;
  resources: string[];
}

export interface NextBestAction {
  action: string;
  description: string;
  channel: string;
  timing: string;
  personalization: string;
  expectedOutcome: string;
  success_probability: number;
}

export interface LeadScoringMetadata {
  modelVersion: string;
  scoringDate: string;
  dataQuality: number;
  featureImportance: Record<string, number>;
  benchmarkComparison: BenchmarkComparison;
  historicalTrends: HistoricalTrend[];
}

export interface BenchmarkComparison {
  industryAverage: number;
  companyAverage: number;
  percentile: number;
  similarLeads: number;
}

export interface HistoricalTrend {
  date: string;
  score: number;
  conversionRate: number;
}

export class LeadScoringEngine {
  private static instance: LeadScoringEngine;
  
  static getInstance(): LeadScoringEngine {
    if (!LeadScoringEngine.instance) {
      LeadScoringEngine.instance = new LeadScoringEngine();
    }
    return LeadScoringEngine.instance;
  }

  // Score a single lead
  async scoreLead(input: LeadScoringInput): Promise<LeadScoringOutput> {
    try {
      console.log(`[LeadScoringEngine] Scoring lead: ${input.leadId}`);

      // Prepare prediction request
      const predictionRequest: PredictionRequest = {
        modelId: this.getModelId(input.scoringModel),
        inputs: {
          organizationId: input.organizationId,
          leadData: input.leadData,
          companyData: input.companyData,
          contactData: input.contactData,
          engagementData: input.engagementData,
          contextData: input.contextData,
          // Derived features
          companyFit: this.calculateCompanyFit(input.companyData),
          contactInfluence: this.calculateContactInfluence(input.contactData),
          engagementTrend: this.calculateEngagementTrend(input.engagementData),
          timelinessScore: this.calculateTimelinessScore(input.leadData),
          budgetAlignment: this.calculateBudgetAlignment(input.leadData, input.companyData)
        },
        extractFeatures: true,
        entityId: input.leadId,
        entityType: 'lead',
        featureSet: 'lead_scoring'
      };

      // Make prediction
      const prediction = await inferenceEngine.predict(predictionRequest);

      // Process prediction results
      return this.processLeadScoringPrediction(prediction, input);

    } catch (error) {
      console.error('[LeadScoringEngine] Lead scoring failed:', error);
      throw new Error(`Lead scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Score multiple leads
  async scoreLeads(inputs: LeadScoringInput[]): Promise<LeadScoringOutput[]> {
    try {
      console.log(`[LeadScoringEngine] Scoring ${inputs.length} leads`);

      const scores = await Promise.all(
        inputs.map(input => this.scoreLead(input))
      );

      // Sort by overall score
      return scores.sort((a, b) => b.overallScore - a.overallScore);

    } catch (error) {
      console.error('[LeadScoringEngine] Batch lead scoring failed:', error);
      throw new Error(`Batch lead scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Score pharmaceutical leads with specific criteria
  async scorePharmaceuticalLead(input: LeadScoringInput): Promise<LeadScoringOutput> {
    try {
      const enhancedInput = {
        ...input,
        scoringModel: 'pharmaceutical' as const
      };

      // Add pharmaceutical-specific features
      const pharmaRequest: PredictionRequest = {
        modelId: 'pharmaceutical_lead_scoring_v1',
        inputs: {
          ...enhancedInput,
          therapeuticAreaFit: this.calculateTherapeuticAreaFit(input.companyData),
          prescriptionVolume: await this.estimatePrescriptionVolume(input.companyData),
          hcpInfluence: await this.calculateHCPInfluence(input.contactData),
          competitiveThreats: this.assessCompetitiveThreats(input.companyData),
          regulatoryRisk: this.assessRegulatoryRisk(input.companyData, input.contextData),
          marketAccess: this.assessMarketAccess(input.companyData)
        },
        extractFeatures: true,
        entityId: input.leadId,
        entityType: 'lead',
        featureSet: 'pharmaceutical_lead_scoring'
      };

      const prediction = await inferenceEngine.predict(pharmaRequest);
      return this.processPharmaceuticalLeadScoring(prediction, enhancedInput);

    } catch (error) {
      console.error('[LeadScoringEngine] Pharmaceutical lead scoring failed:', error);
      throw new Error(`Pharmaceutical lead scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get lead scoring trends
  async getLeadScoringTrends(organizationId: string, timeframe: string): Promise<HistoricalTrend[]> {
    try {
      // Mock historical trends data
      const trends: HistoricalTrend[] = [];
      const days = timeframe === 'month' ? 30 : timeframe === 'quarter' ? 90 : 7;
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        trends.push({
          date: date.toISOString(),
          score: 65 + Math.random() * 30, // Random score between 65-95
          conversionRate: 0.15 + Math.random() * 0.1 // Random conversion 15-25%
        });
      }

      return trends;

    } catch (error) {
      console.error('[LeadScoringEngine] Failed to get scoring trends:', error);
      throw new Error(`Failed to get scoring trends: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Validate scoring model performance
  async validateModelPerformance(_organizationId: string): Promise<Record<string, number>> {
    try {
      // Mock model performance metrics
      return {
        accuracy: 0.87,
        precision: 0.82,
        recall: 0.79,
        f1Score: 0.80,
        auc: 0.91,
        conversionPredictionAccuracy: 0.85
      };

    } catch (error) {
      console.error('[LeadScoringEngine] Model validation failed:', error);
      throw new Error(`Model validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private methods

  private getModelId(scoringModel?: string): string {
    const modelMap = {
      'default': 'lead_scoring_default_v1',
      'pharmaceutical': 'pharmaceutical_lead_scoring_v1',
      'custom': 'lead_scoring_custom_v1'
    };
    return modelMap[scoringModel as keyof typeof modelMap] || modelMap.default;
  }

  private calculateCompanyFit(companyData: CompanyData): number {
    let fit = 0;
    
    // Industry alignment
    const targetIndustries = ['healthcare', 'pharmaceuticals', 'biotech', 'medical devices'];
    if (targetIndustries.includes(companyData.industry.toLowerCase())) {
      fit += 30;
    }

    // Company size
    if (companyData.size >= 1000) {
      fit += 25;
    } else if (companyData.size >= 500) {
      fit += 15;
    } else if (companyData.size >= 100) {
      fit += 10;
    }

    // Revenue
    if (companyData.revenue >= 100000000) { // $100M+
      fit += 25;
    } else if (companyData.revenue >= 50000000) { // $50M+
      fit += 15;
    } else if (companyData.revenue >= 10000000) { // $10M+
      fit += 10;
    }

    // Therapeutic areas alignment
    if (companyData.therapeuticAreas && companyData.therapeuticAreas.length > 0) {
      fit += Math.min(20, companyData.therapeuticAreas.length * 5);
    }

    return Math.min(100, fit);
  }

  private calculateContactInfluence(contactData: ContactData): number {
    let influence = 0;
    
    // Title/seniority weight
    const seniorityScore = contactData.seniority === 'executive' ? 40 :
                          contactData.seniority === 'senior' ? 30 :
                          contactData.seniority === 'mid' ? 20 : 10;
    influence += seniorityScore;

    // Department relevance
    const relevantDepts = ['medical', 'clinical', 'regulatory', 'commercial', 'marketing'];
    if (relevantDepts.some(dept => contactData.department.toLowerCase().includes(dept))) {
      influence += 25;
    }

    // Direct influence score
    influence += contactData.influence;

    // Responsiveness
    influence += contactData.responsiveness * 0.2;

    // Network connections
    influence += Math.min(15, contactData.networkConnections * 0.1);

    return Math.min(100, influence);
  }

  private calculateEngagementTrend(engagementData: EngagementData): number {
    // Weighted engagement score
    const weights = {
      emailOpens: 0.1,
      emailClicks: 0.15,
      websiteVisits: 0.2,
      contentDownloads: 0.25,
      webinarAttendance: 0.3,
      callParticipation: 0.4,
      responseRate: 0.5
    };

    let score = 0;
    score += engagementData.emailOpens * weights.emailOpens;
    score += engagementData.emailClicks * weights.emailClicks;
    score += engagementData.websiteVisits * weights.websiteVisits;
    score += engagementData.contentDownloads * weights.contentDownloads;
    score += engagementData.webinarAttendance * weights.webinarAttendance;
    score += engagementData.callParticipation * weights.callParticipation;
    score += engagementData.responseRate * weights.responseRate * 20;

    return Math.min(100, score);
  }

  private calculateTimelinessScore(leadData: LeadData): number {
    const timelineMap: Record<string, number> = {
      'immediate': 100,
      'within_3_months': 80,
      'within_6_months': 60,
      'within_year': 40,
      'beyond_year': 20,
      'undefined': 10
    };

    return timelineMap[leadData.timeline] || 10;
  }

  private calculateBudgetAlignment(leadData: LeadData, companyData: CompanyData): number {
    if (!leadData.budget || leadData.budget <= 0) {
      return 20; // Low score for undefined budget
    }

    // Budget as percentage of company revenue
    const budgetRatio = leadData.budget / companyData.revenue;
    
    if (budgetRatio >= 0.001) { // 0.1% of revenue or more
      return 100;
    } else if (budgetRatio >= 0.0005) { // 0.05% of revenue
      return 80;
    } else if (budgetRatio >= 0.0001) { // 0.01% of revenue
      return 60;
    } else {
      return 40;
    }
  }

  private calculateTherapeuticAreaFit(companyData: CompanyData): number {
    const targetAreas = ['cardiology', 'oncology', 'neurology', 'diabetes', 'immunology'];
    const matches = companyData.therapeuticAreas.filter(area => 
      targetAreas.some(target => area.toLowerCase().includes(target))
    );
    
    return Math.min(100, matches.length * 25);
  }

  private async estimatePrescriptionVolume(companyData: CompanyData): Promise<number> {
    // Mock prescription volume estimation
    const baseVolume = companyData.size * 10; // Base volume based on company size
    const industryMultiplier = companyData.industry.toLowerCase().includes('pharma') ? 2.0 : 1.0;
    
    return baseVolume * industryMultiplier;
  }

  private async calculateHCPInfluence(contactData: ContactData): Promise<number> {
    // Mock HCP influence calculation
    let influence = contactData.influence;
    
    // Boost for medical professionals
    if (['md', 'phd', 'pharmd'].some(degree => contactData.title.toLowerCase().includes(degree))) {
      influence += 20;
    }
    
    // Key opinion leader indicators
    if (contactData.socialPresence > 1000 || contactData.networkConnections > 500) {
      influence += 15;
    }
    
    return Math.min(100, influence);
  }

  private assessCompetitiveThreats(companyData: CompanyData): number {
    const competitorCount = companyData.competitorUsage.length;
    
    if (competitorCount === 0) {
      return 100; // No competitive threats
    } else if (competitorCount <= 2) {
      return 80; // Low competitive pressure
    } else if (competitorCount <= 4) {
      return 60; // Medium competitive pressure
    } else {
      return 40; // High competitive pressure
    }
  }

  private assessRegulatoryRisk(companyData: CompanyData, contextData?: ContextData): number {
    let riskScore = 80; // Base low risk
    
    // Reduce score based on regulatory changes
    if (contextData?.regulatoryChanges && contextData.regulatoryChanges.length > 0) {
      riskScore -= contextData.regulatoryChanges.length * 10;
    }
    
    // Industry-specific risk
    if (companyData.industry.toLowerCase().includes('biotech')) {
      riskScore -= 10; // Higher regulatory risk for biotech
    }
    
    return Math.max(0, riskScore);
  }

  private assessMarketAccess(companyData: CompanyData): number {
    // Mock market access assessment
    let access = 70; // Base market access
    
    // Company size impact
    if (companyData.size >= 1000) {
      access += 20;
    } else if (companyData.size >= 500) {
      access += 10;
    }
    
    // Market position impact
    if (companyData.marketPosition === 'leader') {
      access += 10;
    } else if (companyData.marketPosition === 'challenger') {
      access += 5;
    }
    
    return Math.min(100, access);
  }

  private async processLeadScoringPrediction(prediction: { prediction: unknown; confidence?: number; version: string; explainability?: Array<{ feature: string; importance: number }> }, input: LeadScoringInput): Promise<LeadScoringOutput> {
    const scoringData = prediction.prediction as Record<string, unknown>;
    const overallScore = typeof scoringData.overall_score === 'number' ? scoringData.overall_score : 75;

    // Generate score breakdown
    const scoreBreakdown: ScoreBreakdown = {
      fitScore: this.calculateCompanyFit(input.companyData),
      intentScore: this.calculateTimelinessScore(input.leadData),
      engagementScore: this.calculateEngagementTrend(input.engagementData),
      timelinessScore: this.calculateTimelinessScore(input.leadData),
      budgetScore: this.calculateBudgetAlignment(input.leadData, input.companyData),
      authorityScore: this.calculateContactInfluence(input.contactData),
      needScore: input.leadData.painPoints.length * 20,
      competitiveScore: this.assessCompetitiveThreats(input.companyData)
    };

    // Determine qualification level
    const qualification = this.determineQualification(overallScore, scoreBreakdown);

    // Determine priority
    const priority = this.determinePriority(overallScore, scoreBreakdown);

    // Generate insights
    const insights = this.generateLeadInsights(scoreBreakdown, input);

    // Generate recommendations
    const recommendations = this.generateLeadRecommendations(qualification, insights, input);

    // Generate next best actions
    const nextBestActions = this.generateNextBestActions(qualification, scoreBreakdown, input);

    return {
      leadId: input.leadId,
      overallScore,
      scoreBreakdown,
      qualification,
      priority,
      insights,
      recommendations,
      nextBestActions,
      confidence: prediction.confidence || 0.85,
      metadata: {
        modelVersion: prediction.version,
        scoringDate: new Date().toISOString(),
        dataQuality: this.assessDataQuality(input),
        featureImportance: prediction.explainability?.reduce((acc, exp) => {
          acc[exp.feature] = exp.importance;
          return acc;
        }, {} as Record<string, number>) || {},
        benchmarkComparison: await this.getBenchmarkComparison(overallScore, input.organizationId),
        historicalTrends: await this.getLeadScoringTrends(input.organizationId, 'month')
      }
    };
  }

  private async processPharmaceuticalLeadScoring(prediction: { prediction: unknown; confidence?: number; version: string }, input: LeadScoringInput): Promise<LeadScoringOutput> {
    // Enhanced processing for pharmaceutical leads
    return this.processLeadScoringPrediction(prediction, input);
  }

  private determineQualification(overallScore: number, scoreBreakdown: ScoreBreakdown): QualificationLevel {
    let level: 'hot' | 'warm' | 'cold' | 'unqualified';
    let probability: number;

    if (overallScore >= 80) {
      level = 'hot';
      probability = 0.85;
    } else if (overallScore >= 60) {
      level = 'warm';
      probability = 0.65;
    } else if (overallScore >= 40) {
      level = 'cold';
      probability = 0.35;
    } else {
      level = 'unqualified';
      probability = 0.15;
    }

    const reasoning: string[] = [];
    if (scoreBreakdown.fitScore >= 80) reasoning.push('Excellent company fit');
    if (scoreBreakdown.intentScore >= 80) reasoning.push('Strong buying intent');
    if (scoreBreakdown.authorityScore >= 70) reasoning.push('Contact has decision authority');
    if (scoreBreakdown.budgetScore >= 70) reasoning.push('Adequate budget available');

    return {
      level,
      probability,
      reasoning,
      meddpicMatch: this.calculateMEDDPICCAlignment(scoreBreakdown)
    };
  }

  private calculateMEDDPICCAlignment(scoreBreakdown: ScoreBreakdown): MEDDPICCAlignment {
    return {
      metrics: scoreBreakdown.needScore,
      economicBuyer: scoreBreakdown.authorityScore,
      decisionCriteria: scoreBreakdown.fitScore,
      decisionProcess: scoreBreakdown.timelinessScore,
      paperProcess: scoreBreakdown.budgetScore,
      identifyPain: scoreBreakdown.needScore,
      champion: scoreBreakdown.engagementScore,
      competition: scoreBreakdown.competitiveScore,
      overallAlignment: (scoreBreakdown.fitScore + scoreBreakdown.authorityScore + scoreBreakdown.needScore) / 3
    };
  }

  private determinePriority(overallScore: number, scoreBreakdown: ScoreBreakdown): Priority {
    const urgency = scoreBreakdown.timelinessScore;
    const impact = (scoreBreakdown.fitScore + scoreBreakdown.budgetScore) / 2;
    const effort = 100 - scoreBreakdown.engagementScore; // Less engagement = more effort needed
    const riskLevel = 100 - scoreBreakdown.competitiveScore;

    let level: 'high' | 'medium' | 'low';
    if (overallScore >= 75 && urgency >= 70) {
      level = 'high';
    } else if (overallScore >= 50 && urgency >= 50) {
      level = 'medium';
    } else {
      level = 'low';
    }

    return {
      level,
      urgency,
      impact,
      effort,
      riskLevel
    };
  }

  private generateLeadInsights(scoreBreakdown: ScoreBreakdown, input: LeadScoringInput): LeadInsight[] {
    const insights: LeadInsight[] = [];

    // High fit opportunity
    if (scoreBreakdown.fitScore >= 80) {
      insights.push({
        type: 'opportunity',
        title: 'Excellent Company Fit',
        description: 'This lead represents an ideal customer profile match',
        impact: 'high',
        confidence: 0.9,
        actionable: true,
        evidence: ['Industry alignment', 'Company size match', 'Therapeutic area relevance']
      });
    }

    // Low engagement risk
    if (scoreBreakdown.engagementScore < 40) {
      insights.push({
        type: 'risk',
        title: 'Low Engagement Level',
        description: 'Lead shows minimal engagement with content and communications',
        impact: 'medium',
        confidence: 0.8,
        actionable: true,
        evidence: ['Low email open rates', 'Minimal website activity', 'Poor response rates']
      });
    }

    // Budget concerns
    if (scoreBreakdown.budgetScore < 50) {
      insights.push({
        type: 'risk',
        title: 'Budget Uncertainty',
        description: 'Limited or unclear budget information available',
        impact: 'medium',
        confidence: 0.7,
        actionable: true,
        evidence: ['No budget disclosed', 'Small budget relative to company size']
      });
    }

    // Competitive threats
    if (scoreBreakdown.competitiveScore < 60) {
      insights.push({
        type: 'competitive',
        title: 'High Competitive Pressure',
        description: 'Multiple competitors are already engaged with this prospect',
        impact: 'high',
        confidence: 0.85,
        actionable: true,
        evidence: [`${input.companyData.competitorUsage.length} competitors identified`]
      });
    }

    return insights;
  }

  private generateLeadRecommendations(qualification: QualificationLevel, insights: LeadInsight[], _input: LeadScoringInput): LeadRecommendation[] {
    const recommendations: LeadRecommendation[] = [];

    if (qualification.level === 'hot') {
      recommendations.push({
        id: `rec_${Date.now()}_hot_lead`,
        type: 'outreach',
        title: 'Immediate Sales Outreach',
        description: 'Schedule discovery call within 24 hours',
        priority: 'high',
        effort: 'medium',
        expectedImpact: 0.8,
        timeframe: '24_hours',
        resources: ['Sales Executive', 'Solution Engineer']
      });
    } else if (qualification.level === 'warm') {
      recommendations.push({
        id: `rec_${Date.now()}_warm_lead`,
        type: 'nurturing',
        title: 'Nurturing Campaign',
        description: 'Enroll in targeted nurturing sequence',
        priority: 'medium',
        effort: 'low',
        expectedImpact: 0.6,
        timeframe: '1_week',
        resources: ['Marketing Automation', 'Inside Sales']
      });
    }

    // Address specific insights
    const lowEngagementInsight = insights.find(i => i.title.includes('Low Engagement'));
    if (lowEngagementInsight) {
      recommendations.push({
        id: `rec_${Date.now()}_engagement`,
        type: 'outreach',
        title: 'Re-engagement Campaign',
        description: 'Multi-channel re-engagement approach',
        priority: 'medium',
        effort: 'medium',
        expectedImpact: 0.4,
        timeframe: '2_weeks',
        resources: ['Marketing', 'Sales Development']
      });
    }

    return recommendations;
  }

  private generateNextBestActions(qualification: QualificationLevel, scoreBreakdown: ScoreBreakdown, _input: LeadScoringInput): NextBestAction[] {
    const actions: NextBestAction[] = [];

    if (qualification.level === 'hot') {
      actions.push({
        action: 'schedule_discovery_call',
        description: 'Schedule a comprehensive discovery call to understand needs',
        channel: 'phone',
        timing: 'within_24_hours',
        personalization: 'Reference specific pain points mentioned',
        expectedOutcome: 'Qualified opportunity creation',
        success_probability: 0.75
      });

      actions.push({
        action: 'send_case_study',
        description: 'Share relevant customer success story',
        channel: 'email',
        timing: 'immediately',
        personalization: 'Industry-specific case study',
        expectedOutcome: 'Increased engagement and credibility',
        success_probability: 0.65
      });
    } else if (qualification.level === 'warm') {
      actions.push({
        action: 'nurture_sequence',
        description: 'Enroll in educational content sequence',
        channel: 'email',
        timing: 'weekly',
        personalization: 'Role-based content',
        expectedOutcome: 'Progression to hot status',
        success_probability: 0.45
      });
    }

    // Low engagement actions
    if (scoreBreakdown.engagementScore < 40) {
      actions.push({
        action: 'multi_channel_outreach',
        description: 'Reach out via phone and LinkedIn',
        channel: 'multi',
        timing: 'this_week',
        personalization: 'Reference recent company news',
        expectedOutcome: 'Renewed engagement',
        success_probability: 0.35
      });
    }

    return actions;
  }

  private assessDataQuality(input: LeadScoringInput): number {
    let quality = 0;
    const totalFields = 20; // Approximate total important fields

    // Check data completeness
    if (input.leadData.source) quality++;
    if (input.leadData.budget > 0) quality++;
    if (input.leadData.timeline) quality++;
    if (input.leadData.painPoints.length > 0) quality++;
    
    if (input.companyData.name) quality++;
    if (input.companyData.industry) quality++;
    if (input.companyData.size > 0) quality++;
    if (input.companyData.revenue > 0) quality++;
    
    if (input.contactData.title) quality++;
    if (input.contactData.department) quality++;
    if (input.contactData.seniority) quality++;
    
    if (input.engagementData.emailOpens >= 0) quality++;
    if (input.engagementData.websiteVisits >= 0) quality++;
    if (input.engagementData.responseRate >= 0) quality++;

    return (quality / totalFields) * 100;
  }

  private async getBenchmarkComparison(score: number, _organizationId: string): Promise<BenchmarkComparison> {
    // Mock benchmark comparison
    return {
      industryAverage: 65,
      companyAverage: 72,
      percentile: score > 80 ? 95 : score > 60 ? 75 : score > 40 ? 50 : 25,
      similarLeads: Math.floor(Math.random() * 100) + 50
    };
  }
}

// Export singleton instance
export const leadScoringEngine = LeadScoringEngine.getInstance();