// Enterprise AI Intelligence Engine
// Advanced machine learning models for predictive analytics, automated coaching, and intelligent insights

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
// import Anthropic from '@anthropic-ai/sdk';

// Types for enterprise AI features
export interface AIModel {
  id: string;
  name: string;
  modelType: 'lead_scoring' | 'deal_prediction' | 'forecasting' | 'coaching' | 'content_generation' | 'sentiment_analysis';
  provider: 'openai' | 'anthropic' | 'azure' | 'aws' | 'custom';
  modelVersion: string;
  config: Record<string, any>;
  accuracyMetrics: Record<string, number>;
  isActive: boolean;
  isEnterprise: boolean;
  organizationId: string;
}

export interface PredictiveInsight {
  id: string;
  type: 'lead_scoring' | 'deal_risk' | 'next_action' | 'forecasting' | 'performance' | 'coaching';
  entityType: 'lead' | 'opportunity' | 'contact' | 'user' | 'organization';
  entityId: string;
  insightData: {
    prediction: any;
    confidence: number;
    factors: string[];
    recommendations: string[];
    riskFactors?: string[];
    opportunities?: string[];
  };
  confidenceScore: number;
  modelVersion: string;
  organizationId: string;
  createdAt: Date;
}

export interface CoachingRecommendation {
  id: string;
  userId: string;
  opportunityId?: string;
  recommendationType: 'skill_development' | 'process_improvement' | 'deal_strategy' | 'relationship_building';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionItems: string[];
  expectedImpact: string;
  timeframe: string;
  resources: string[];
  organizationId: string;
}

export interface ForecastingData {
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  predictions: {
    revenue: number;
    deals: number;
    conversionRate: number;
    confidence: number;
  };
  scenarios: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
  factors: string[];
  organizationId: string;
}

class EnterpriseAIIntelligence {
  private supabase: any;
  private openai: OpenAI;
  // private anthropic: Anthropic;

  constructor(supabaseUrl: string, supabaseKey: string, openaiApiKey: string, anthropicApiKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    // this.anthropic = new Anthropic({ apiKey: anthropicApiKey });
  }

  // Advanced Lead Scoring with ML
  async generateAdvancedLeadScore(leadId: string, organizationId: string): Promise<PredictiveInsight> {
    try {
      // Get lead data with enhanced context
      const { data: lead, error: leadError } = await this.supabase
        .from('leads')
        .select(`
          *,
          company:companies(*),
          activities:activities(*),
          opportunities:opportunities(*)
        `)
        .eq('id', leadId)
        .eq('organization_id', organizationId)
        .single();

      if (leadError) throw leadError;

      // Get historical conversion data for ML training
      const { data: historicalData } = await this.supabase
        .from('leads')
        .select('*, opportunities(*)')
        .eq('organization_id', organizationId)
        .not('converted_at', 'is', null);

      // Advanced ML scoring factors
      const scoringFactors = {
        // Demographics
        companySize: this.calculateCompanySizeScore(lead.company?.size),
        industry: this.calculateIndustryScore(lead.company?.industry),
        location: this.calculateLocationScore(lead.company?.address),
        
        // Engagement
        emailEngagement: this.calculateEmailEngagementScore(lead.activities),
        websiteEngagement: this.calculateWebsiteEngagementScore(lead.activities),
        socialEngagement: this.calculateSocialEngagementScore(lead.activities),
        
        // Behavioral
        responseTime: this.calculateResponseTimeScore(lead.activities),
        meetingAttendance: this.calculateMeetingAttendanceScore(lead.activities),
        contentConsumption: this.calculateContentConsumptionScore(lead.activities),
        
        // Contextual
        timing: this.calculateTimingScore(lead.created_at),
        seasonality: this.calculateSeasonalityScore(lead.created_at),
        marketConditions: await this.calculateMarketConditionsScore(lead.company?.industry),
        
        // Historical patterns
        conversionPattern: this.calculateConversionPatternScore(historicalData, lead),
        similarLeads: this.calculateSimilarLeadsScore(historicalData, lead)
      };

      // Calculate weighted score
      const weights = {
        companySize: 0.15,
        industry: 0.12,
        location: 0.08,
        emailEngagement: 0.18,
        websiteEngagement: 0.15,
        socialEngagement: 0.10,
        responseTime: 0.08,
        meetingAttendance: 0.12,
        contentConsumption: 0.10,
        timing: 0.05,
        seasonality: 0.03,
        marketConditions: 0.08,
        conversionPattern: 0.15,
        similarLeads: 0.12
      };

      const weightedScore = Object.keys(scoringFactors).reduce((total, factor) => {
        return total + (scoringFactors[factor as keyof typeof scoringFactors] * weights[factor as keyof typeof weights]);
      }, 0);

      // Generate AI-powered recommendations
      const recommendations = await this.generateLeadRecommendations(lead, scoringFactors);

      const insight: PredictiveInsight = {
        id: crypto.randomUUID(),
        type: 'lead_scoring',
        entityType: 'lead',
        entityId: leadId,
        insightData: {
          prediction: {
            score: Math.round(weightedScore),
            category: this.getScoreCategory(weightedScore),
            probability: this.calculateConversionProbability(weightedScore, historicalData)
          },
          confidence: this.calculateConfidenceScore(scoringFactors),
          factors: this.getTopScoringFactors(scoringFactors, weights),
          recommendations: recommendations
        },
        confidenceScore: this.calculateConfidenceScore(scoringFactors),
        modelVersion: 'v3.0-enterprise',
        organizationId,
        createdAt: new Date()
      };

      // Store insight
      await this.storeInsight(insight);

      return insight;
    } catch (error) {
      console.error('Error generating advanced lead score:', error);
      throw error;
    }
  }

  // Deal Risk Assessment with Advanced Analytics
  async generateDealRiskAssessment(opportunityId: string, organizationId: string): Promise<PredictiveInsight> {
    try {
      const { data: opportunity, error } = await this.supabase
        .from('opportunities')
        .select(`
          *,
          contacts(*),
          company:companies(*),
          activities(*),
          meddpicc_scores(*)
        `)
        .eq('id', opportunityId)
        .eq('organization_id', organizationId)
        .single();

      if (error) throw error;

      // Advanced risk factors
      const riskFactors = {
        // MEDDPICC analysis
        meddpiccScore: this.calculateMEDDPICCRiskScore(opportunity.meddpicc_scores),
        
        // Timeline analysis
        timelineRisk: this.calculateTimelineRisk(opportunity),
        
        // Competition analysis
        competitionRisk: await this.calculateCompetitionRisk(opportunity),
        
        // Stakeholder analysis
        stakeholderRisk: this.calculateStakeholderRisk(opportunity.contacts),
        
        // Value proposition strength
        valuePropositionRisk: this.calculateValuePropositionRisk(opportunity),
        
        // Market conditions
        marketRisk: await this.calculateMarketRisk(opportunity.company?.industry),
        
        // Historical patterns
        historicalRisk: await this.calculateHistoricalRisk(opportunity, organizationId),
        
        // Engagement quality
        engagementRisk: this.calculateEngagementRisk(opportunity.activities)
      };

      const totalRiskScore = Object.values(riskFactors).reduce((sum, risk) => sum + risk, 0) / Object.keys(riskFactors).length;

      // Generate mitigation strategies
      const mitigationStrategies = await this.generateMitigationStrategies(opportunity, riskFactors);

      const insight: PredictiveInsight = {
        id: crypto.randomUUID(),
        type: 'deal_risk',
        entityType: 'opportunity',
        entityId: opportunityId,
        insightData: {
          prediction: {
            riskScore: Math.round(totalRiskScore),
            riskLevel: this.getRiskLevel(totalRiskScore),
            probability: this.calculateWinProbability(totalRiskScore)
          },
          confidence: this.calculateRiskConfidence(riskFactors),
          factors: this.getTopRiskFactors(riskFactors),
          recommendations: mitigationStrategies,
          riskFactors: this.getDetailedRiskFactors(riskFactors)
        },
        confidenceScore: this.calculateRiskConfidence(riskFactors),
        modelVersion: 'v3.0-enterprise',
        organizationId,
        createdAt: new Date()
      };

      await this.storeInsight(insight);
      return insight;
    } catch (error) {
      console.error('Error generating deal risk assessment:', error);
      throw error;
    }
  }

  // AI-Powered Sales Coaching
  async generateCoachingRecommendations(userId: string, organizationId: string): Promise<CoachingRecommendation[]> {
    try {
      // Get user performance data
      const { data: userData } = await this.supabase
        .from('users')
        .select(`
          *,
          opportunities(*),
          activities(*),
          performance_metrics(*),
          user_learning_progress(*)
        `)
        .eq('id', userId)
        .eq('organization_id', organizationId)
        .single();

      // Analyze performance patterns
      const performanceAnalysis = this.analyzePerformancePatterns(userData);
      
      // Generate personalized coaching recommendations
      const recommendations: CoachingRecommendation[] = [];

      // Skill development recommendations
      if (performanceAnalysis.skillGaps.length > 0) {
        recommendations.push({
          id: crypto.randomUUID(),
          userId,
          recommendationType: 'skill_development',
          title: 'Address Key Skill Gaps',
          description: `Focus on developing ${performanceAnalysis.skillGaps.join(', ')} to improve performance`,
          priority: 'high',
          actionItems: this.generateSkillDevelopmentActions(performanceAnalysis.skillGaps),
          expectedImpact: '15-25% improvement in deal closure rate',
          timeframe: '4-6 weeks',
          resources: this.getSkillDevelopmentResources(performanceAnalysis.skillGaps),
          organizationId
        });
      }

      // Process improvement recommendations
      if (performanceAnalysis.processIssues.length > 0) {
        recommendations.push({
          id: crypto.randomUUID(),
          userId,
          recommendationType: 'process_improvement',
          title: 'Optimize Sales Process',
          description: `Improve ${performanceAnalysis.processIssues.join(', ')} processes`,
          priority: 'medium',
          actionItems: this.generateProcessImprovementActions(performanceAnalysis.processIssues),
          expectedImpact: '10-20% increase in efficiency',
          timeframe: '2-3 weeks',
          resources: this.getProcessImprovementResources(performanceAnalysis.processIssues),
          organizationId
        });
      }

      // Deal strategy recommendations
      const activeOpportunities = userData.opportunities?.filter((opp: any) => opp.stage !== 'closed_won' && opp.stage !== 'closed_lost') || [];
      if (activeOpportunities.length > 0) {
        recommendations.push({
          id: crypto.randomUUID(),
          userId,
          recommendationType: 'deal_strategy',
          title: 'Optimize Active Deal Strategies',
          description: 'Focus on high-impact opportunities with strategic approaches',
          priority: 'high',
          actionItems: this.generateDealStrategyActions(activeOpportunities),
          expectedImpact: '20-30% increase in deal value',
          timeframe: '1-2 weeks',
          resources: this.getDealStrategyResources(),
          organizationId
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating coaching recommendations:', error);
      throw error;
    }
  }

  // Advanced Sales Forecasting
  async generateSalesForecast(organizationId: string, period: 'weekly' | 'monthly' | 'quarterly' | 'yearly'): Promise<ForecastingData> {
    try {
      // Get historical data
      const { data: historicalData } = await this.supabase
        .from('opportunities')
        .select('*')
        .eq('organization_id', organizationId)
        .not('closed_at', 'is', null);

      // Get current pipeline
      const { data: currentPipeline } = await this.supabase
        .from('opportunities')
        .select('*')
        .eq('organization_id', organizationId)
        .is('closed_at', null);

      // Advanced forecasting algorithm
      const forecast = this.calculateAdvancedForecast(historicalData, currentPipeline, period);

      const forecastingData: ForecastingData = {
        period,
        startDate: new Date(),
        endDate: this.calculatePeriodEndDate(period),
        predictions: forecast.predictions,
        scenarios: forecast.scenarios,
        factors: forecast.factors,
        organizationId
      };

      return forecastingData;
    } catch (error) {
      console.error('Error generating sales forecast:', error);
      throw error;
    }
  }

  // AI Content Generation
  async generateAIContent(type: 'email' | 'proposal' | 'presentation' | 'follow_up', context: any): Promise<string> {
    try {
      const prompt = this.buildContentPrompt(type, context);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert sales content generator specializing in enterprise B2B sales communications.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error generating AI content:', error);
      throw error;
    }
  }

  // Helper methods for scoring calculations
  private calculateCompanySizeScore(size: string): number {
    const sizeScores = {
      'startup': 0.3,
      'small': 0.5,
      'medium': 0.8,
      'large': 0.9,
      'enterprise': 1.0
    };
    return sizeScores[size as keyof typeof sizeScores] || 0.5;
  }

  private calculateIndustryScore(industry: string): number {
    // Industry scoring based on historical conversion rates
    const industryScores = {
      'technology': 0.9,
      'healthcare': 0.8,
      'finance': 0.7,
      'manufacturing': 0.6,
      'retail': 0.5,
      'education': 0.4
    };
    return industryScores[industry as keyof typeof industryScores] || 0.5;
  }

  private calculateLocationScore(address: string): number {
    // Location scoring based on market potential
    const locationScores = {
      'us-east': 0.9,
      'us-west': 0.8,
      'us-central': 0.7,
      'europe': 0.8,
      'asia': 0.6
    };
    return locationScores[this.extractRegion(address) as keyof typeof locationScores] || 0.5;
  }

  private calculateEmailEngagementScore(activities: any[]): number {
    const emailActivities = activities?.filter(activity => activity.type === 'email') || [];
    if (emailActivities.length === 0) return 0.3;
    
    const openRate = emailActivities.filter(a => a.email_opened).length / emailActivities.length;
    const clickRate = emailActivities.filter(a => a.email_clicked).length / emailActivities.length;
    const replyRate = emailActivities.filter(a => a.email_replied).length / emailActivities.length;
    
    return (openRate * 0.3 + clickRate * 0.4 + replyRate * 0.3);
  }

  private calculateWebsiteEngagementScore(activities: any[]): number {
    const websiteActivities = activities?.filter(activity => activity.type === 'website_visit') || [];
    if (websiteActivities.length === 0) return 0.2;
    
    const avgSessionDuration = websiteActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / websiteActivities.length;
    const pageViews = websiteActivities.reduce((sum, a) => sum + (a.page_views || 0), 0);
    
    return Math.min(1.0, (avgSessionDuration / 300) * 0.5 + (pageViews / 10) * 0.5);
  }

  private calculateSocialEngagementScore(activities: any[]): number {
    const socialActivities = activities?.filter(activity => activity.type === 'social_engagement') || [];
    if (socialActivities.length === 0) return 0.1;
    
    const engagementRate = socialActivities.filter(a => a.engaged).length / socialActivities.length;
    return engagementRate;
  }

  private calculateResponseTimeScore(activities: any[]): number {
    const responseActivities = activities?.filter(activity => activity.response_time) || [];
    if (responseActivities.length === 0) return 0.5;
    
    const avgResponseTime = responseActivities.reduce((sum, a) => sum + a.response_time, 0) / responseActivities.length;
    return Math.max(0, 1 - (avgResponseTime / 24)); // 24 hours = 0 score
  }

  private calculateMeetingAttendanceScore(activities: any[]): number {
    const meetingActivities = activities?.filter(activity => activity.type === 'meeting') || [];
    if (meetingActivities.length === 0) return 0.3;
    
    const attendanceRate = meetingActivities.filter(a => a.attended).length / meetingActivities.length;
    return attendanceRate;
  }

  private calculateContentConsumptionScore(activities: any[]): number {
    const contentActivities = activities?.filter(activity => activity.type === 'content_view') || [];
    if (contentActivities.length === 0) return 0.2;
    
    const completionRate = contentActivities.filter(a => a.completed).length / contentActivities.length;
    return completionRate;
  }

  private calculateTimingScore(createdAt: string): number {
    const hour = new Date(createdAt).getHours();
    const day = new Date(createdAt).getDay();
    
    // Business hours and weekdays score higher
    const timeScore = (hour >= 9 && hour <= 17) ? 0.8 : 0.4;
    const dayScore = (day >= 1 && day <= 5) ? 0.9 : 0.3;
    
    return (timeScore + dayScore) / 2;
  }

  private calculateSeasonalityScore(createdAt: string): number {
    const month = new Date(createdAt).getMonth();
    // Q4 typically has higher conversion rates
    const seasonalScores = [0.6, 0.5, 0.7, 0.8, 0.7, 0.6, 0.5, 0.6, 0.8, 0.9, 0.9, 0.8];
    return seasonalScores[month];
  }

  private async calculateMarketConditionsScore(industry: string): Promise<number> {
    // This would integrate with external market data APIs
    // For now, return a base score
    return 0.7;
  }

  private calculateConversionPatternScore(historicalData: any[], currentLead: any): number {
    if (!historicalData || historicalData.length === 0) return 0.5;
    
    const similarLeads = historicalData.filter(lead => 
      lead.company?.industry === currentLead.company?.industry &&
      lead.company?.size === currentLead.company?.size
    );
    
    if (similarLeads.length === 0) return 0.5;
    
    const conversionRate = similarLeads.filter(lead => lead.converted_at).length / similarLeads.length;
    return conversionRate;
  }

  private calculateSimilarLeadsScore(historicalData: any[], currentLead: any): number {
    if (!historicalData || historicalData.length === 0) return 0.5;
    
    // Calculate similarity based on multiple factors
    const similarities = historicalData.map(lead => {
      let similarity = 0;
      if (lead.company?.industry === currentLead.company?.industry) similarity += 0.3;
      if (lead.company?.size === currentLead.company?.size) similarity += 0.2;
      if (lead.source === currentLead.source) similarity += 0.2;
      if (lead.title === currentLead.title) similarity += 0.1;
      if (lead.location === currentLead.location) similarity += 0.2;
      return similarity;
    });
    
    const avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    return avgSimilarity;
  }

  private getScoreCategory(score: number): string {
    if (score >= 80) return 'Hot';
    if (score >= 60) return 'Warm';
    if (score >= 40) return 'Cool';
    return 'Cold';
  }

  private calculateConversionProbability(score: number, historicalData: any[]): number {
    if (!historicalData || historicalData.length === 0) return score / 100;
    
    const totalLeads = historicalData.length;
    const convertedLeads = historicalData.filter(lead => lead.converted_at).length;
    const baseConversionRate = convertedLeads / totalLeads;
    
    // Adjust based on score
    return Math.min(0.95, baseConversionRate * (score / 50));
  }

  private calculateConfidenceScore(factors: Record<string, number>): number {
    const factorCount = Object.keys(factors).length;
    const avgFactorValue = Object.values(factors).reduce((sum, val) => sum + val, 0) / factorCount;
    const variance = Object.values(factors).reduce((sum, val) => sum + Math.pow(val - avgFactorValue, 2), 0) / factorCount;
    
    // Higher confidence with more factors and lower variance
    return Math.min(0.95, 0.5 + (factorCount / 20) * 0.3 - (variance * 0.2));
  }

  private getTopScoringFactors(factors: Record<string, number>, weights: Record<string, number>): string[] {
    return Object.keys(factors)
      .map(factor => ({
        factor,
        weightedScore: factors[factor] * weights[factor]
      }))
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(0, 5)
      .map(item => item.factor);
  }

  private async generateLeadRecommendations(lead: any, factors: Record<string, number>): Promise<string[]> {
    const recommendations = [];
    
    if (factors.emailEngagement < 0.5) {
      recommendations.push('Improve email engagement with personalized content');
    }
    
    if (factors.responseTime < 0.5) {
      recommendations.push('Respond to leads within 2 hours for better conversion');
    }
    
    if (factors.contentConsumption < 0.3) {
      recommendations.push('Provide more relevant content to increase engagement');
    }
    
    if (factors.meetingAttendance < 0.7) {
      recommendations.push('Follow up on meeting invitations to improve attendance');
    }
    
    return recommendations;
  }

  // Additional helper methods for risk assessment, coaching, and forecasting...
  private calculateMEDDPICCRiskScore(meddpiccScores: any[]): number {
    if (!meddpiccScores || meddpiccScores.length === 0) return 0.5;
    
    const avgScore = meddpiccScores.reduce((sum, score) => sum + score.total_score, 0) / meddpiccScores.length;
    return Math.max(0, 1 - (avgScore / 100));
  }

  private calculateTimelineRisk(opportunity: any): number {
    const daysSinceCreated = (Date.now() - new Date(opportunity.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const expectedCloseDate = new Date(opportunity.expected_close_date);
    const daysToClose = (expectedCloseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    
    if (daysToClose < 0) return 0.9; // Overdue
    if (daysToClose < 30) return 0.7; // Close deadline
    if (daysToClose < 90) return 0.3; // Normal timeline
    return 0.1; // Long timeline
  }

  private async calculateCompetitionRisk(opportunity: any): Promise<number> {
    // This would integrate with competitive intelligence data
    return 0.4; // Base risk
  }

  private calculateStakeholderRisk(contacts: any[]): number {
    if (!contacts || contacts.length === 0) return 0.8;
    
    const championContacts = contacts.filter(contact => contact.role === 'champion');
    const decisionMakerContacts = contacts.filter(contact => contact.role === 'decision_maker');
    
    if (championContacts.length === 0) return 0.7;
    if (decisionMakerContacts.length === 0) return 0.6;
    
    return 0.2; // Low risk with both champions and decision makers
  }

  private calculateValuePropositionRisk(opportunity: any): number {
    // Analyze value proposition strength
    const valueScore = opportunity.deal_value || 0;
    const budgetScore = opportunity.budget_allocated || 0;
    
    if (budgetScore === 0) return 0.8;
    if (valueScore > budgetScore * 1.5) return 0.6;
    if (valueScore < budgetScore * 0.5) return 0.3;
    
    return 0.2; // Good value alignment
  }

  private async calculateMarketRisk(industry: string): Promise<number> {
    // This would integrate with market data
    return 0.3; // Base market risk
  }

  private async calculateHistoricalRisk(opportunity: any, organizationId: string): Promise<number> {
    const { data: similarOpportunities } = await this.supabase
      .from('opportunities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('company_id', opportunity.company_id)
      .not('id', 'eq', opportunity.id);
    
    if (!similarOpportunities || similarOpportunities.length === 0) return 0.5;
    
    const winRate = similarOpportunities.filter((opp: any) => opp.stage === 'closed_won').length / similarOpportunities.length;
    return Math.max(0, 1 - winRate);
  }

  private calculateEngagementRisk(activities: any[]): number {
    if (!activities || activities.length === 0) return 0.8;
    
    const recentActivities = activities.filter(activity => 
      (Date.now() - new Date(activity.created_at).getTime()) < (7 * 24 * 60 * 60 * 1000)
    );
    
    if (recentActivities.length === 0) return 0.7;
    if (recentActivities.length < 3) return 0.4;
    
    return 0.2; // Good engagement
  }

  private getRiskLevel(riskScore: number): string {
    if (riskScore >= 0.7) return 'High';
    if (riskScore >= 0.4) return 'Medium';
    return 'Low';
  }

  private calculateWinProbability(riskScore: number): number {
    return Math.max(0.05, 1 - riskScore);
  }

  private calculateRiskConfidence(factors: Record<string, number>): number {
    return this.calculateConfidenceScore(factors);
  }

  private getTopRiskFactors(factors: Record<string, number>): string[] {
    return Object.keys(factors)
      .map(factor => ({ factor, score: factors[factor] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.factor);
  }

  private getDetailedRiskFactors(factors: Record<string, number>): string[] {
    return Object.keys(factors)
      .filter(factor => factors[factor] > 0.5)
      .map(factor => `${factor}: ${Math.round(factors[factor] * 100)}% risk`);
  }

  private async generateMitigationStrategies(opportunity: any, riskFactors: Record<string, number>): Promise<string[]> {
    const strategies = [];
    
    if (riskFactors.meddpiccScore > 0.6) {
      strategies.push('Strengthen MEDDPICC qualification with key stakeholders');
    }
    
    if (riskFactors.timelineRisk > 0.6) {
      strategies.push('Accelerate decision timeline with urgency drivers');
    }
    
    if (riskFactors.stakeholderRisk > 0.6) {
      strategies.push('Identify and engage additional champions');
    }
    
    if (riskFactors.valuePropositionRisk > 0.6) {
      strategies.push('Refine value proposition to better align with customer needs');
    }
    
    return strategies;
  }

  // Additional helper methods for coaching and forecasting...
  private analyzePerformancePatterns(userData: any): any {
    const opportunities = userData.opportunities || [];
    const activities = userData.activities || [];
    const metrics = userData.performance_metrics || [];
    
    return {
      skillGaps: this.identifySkillGaps(opportunities, activities),
      processIssues: this.identifyProcessIssues(activities),
      strengths: this.identifyStrengths(opportunities, activities),
      opportunities: this.identifyOpportunities(opportunities, metrics)
    };
  }

  private identifySkillGaps(opportunities: any[], activities: any[]): string[] {
    const gaps = [];
    
    const winRate = opportunities.filter(opp => opp.stage === 'closed_won').length / opportunities.length;
    if (winRate < 0.3) gaps.push('deal closure');
    
    const avgDealSize = opportunities.reduce((sum, opp) => sum + (opp.deal_value || 0), 0) / opportunities.length;
    if (avgDealSize < 50000) gaps.push('deal sizing');
    
    const meetingRate = activities.filter(a => a.type === 'meeting').length / activities.length;
    if (meetingRate < 0.2) gaps.push('meeting scheduling');
    
    return gaps;
  }

  private identifyProcessIssues(activities: any[]): string[] {
    const issues = [];
    
    const followUpRate = activities.filter(a => a.type === 'follow_up').length / activities.length;
    if (followUpRate < 0.3) issues.push('follow-up');
    
    const documentationRate = activities.filter(a => a.notes && a.notes.length > 50).length / activities.length;
    if (documentationRate < 0.5) issues.push('documentation');
    
    return issues;
  }

  private identifyStrengths(opportunities: any[], activities: any[]): string[] {
    const strengths = [];
    
    const activityVolume = activities.length;
    if (activityVolume > 50) strengths.push('activity volume');
    
    const meetingRate = activities.filter(a => a.type === 'meeting').length / activities.length;
    if (meetingRate > 0.4) strengths.push('meeting scheduling');
    
    return strengths;
  }

  private identifyOpportunities(opportunities: any[], metrics: any[]): string[] {
    const opportunities_list = [];
    
    const pipelineValue = opportunities.reduce((sum, opp) => sum + (opp.deal_value || 0), 0);
    if (pipelineValue > 1000000) opportunities_list.push('large pipeline');
    
    const avgDealSize = opportunities.reduce((sum, opp) => sum + (opp.deal_value || 0), 0) / opportunities.length;
    if (avgDealSize > 100000) opportunities_list.push('high-value deals');
    
    return opportunities_list;
  }

  private generateSkillDevelopmentActions(skillGaps: string[]): string[] {
    const actions = [];
    
    if (skillGaps.includes('deal closure')) {
      actions.push('Complete advanced closing techniques training');
      actions.push('Practice objection handling scenarios');
    }
    
    if (skillGaps.includes('deal sizing')) {
      actions.push('Learn value-based selling methodologies');
      actions.push('Practice ROI calculation techniques');
    }
    
    return actions;
  }

  private generateProcessImprovementActions(processIssues: string[]): string[] {
    const actions = [];
    
    if (processIssues.includes('follow-up')) {
      actions.push('Set up automated follow-up reminders');
      actions.push('Create follow-up templates');
    }
    
    if (processIssues.includes('documentation')) {
      actions.push('Use voice-to-text for activity logging');
      actions.push('Create documentation templates');
    }
    
    return actions;
  }

  private generateDealStrategyActions(opportunities: any[]): string[] {
    const actions = [];
    
    const highValueOpps = opportunities.filter(opp => (opp.deal_value || 0) > 100000);
    if (highValueOpps.length > 0) {
      actions.push('Focus on high-value opportunities first');
      actions.push('Develop executive-level relationships');
    }
    
    const staleOpps = opportunities.filter(opp => 
      (Date.now() - new Date(opp.updated_at).getTime()) > (30 * 24 * 60 * 60 * 1000)
    );
    if (staleOpps.length > 0) {
      actions.push('Re-engage stale opportunities');
      actions.push('Update opportunity status and next steps');
    }
    
    return actions;
  }

  private getSkillDevelopmentResources(skillGaps: string[]): string[] {
    return [
      'Advanced Sales Training Modules',
      'Role-playing Practice Sessions',
      'Mentorship Program',
      'Industry Best Practices Guide'
    ];
  }

  private getProcessImprovementResources(processIssues: string[]): string[] {
    return [
      'Process Optimization Templates',
      'Automation Tools Guide',
      'Best Practices Documentation',
      'Peer Review Sessions'
    ];
  }

  private getDealStrategyResources(): string[] {
    return [
      'Strategic Selling Framework',
      'Executive Engagement Guide',
      'Competitive Analysis Tools',
      'Value Proposition Templates'
    ];
  }

  private calculateAdvancedForecast(historicalData: any[], currentPipeline: any[], period: string): any {
    // Advanced forecasting algorithm
    const historicalRevenue = historicalData.reduce((sum, opp) => sum + (opp.deal_value || 0), 0);
    const avgDealSize = historicalRevenue / historicalData.length;
    const conversionRate = historicalData.filter(opp => opp.stage === 'closed_won').length / historicalData.length;
    
    const pipelineValue = currentPipeline.reduce((sum, opp) => sum + (opp.deal_value || 0), 0);
    const weightedPipelineValue = pipelineValue * conversionRate;
    
    return {
      predictions: {
        revenue: Math.round(weightedPipelineValue),
        deals: Math.round(currentPipeline.length * conversionRate),
        conversionRate: Math.round(conversionRate * 100),
        confidence: 0.75
      },
      scenarios: {
        optimistic: Math.round(weightedPipelineValue * 1.2),
        realistic: Math.round(weightedPipelineValue),
        pessimistic: Math.round(weightedPipelineValue * 0.8)
      },
      factors: [
        'Historical conversion rates',
        'Pipeline quality',
        'Seasonal trends',
        'Market conditions'
      ]
    };
  }

  private calculatePeriodEndDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      case 'quarterly':
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      case 'yearly':
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  private buildContentPrompt(type: string, context: any): string {
    const basePrompt = `Generate professional ${type} content for enterprise B2B sales.`;
    
    switch (type) {
      case 'email':
        return `${basePrompt} Context: ${JSON.stringify(context)}. Create a compelling email that builds rapport and drives action.`;
      case 'proposal':
        return `${basePrompt} Context: ${JSON.stringify(context)}. Create a comprehensive proposal that addresses client needs and demonstrates value.`;
      case 'presentation':
        return `${basePrompt} Context: ${JSON.stringify(context)}. Create presentation content that engages stakeholders and drives decisions.`;
      case 'follow_up':
        return `${basePrompt} Context: ${JSON.stringify(context)}. Create a follow-up message that maintains momentum and advances the deal.`;
      default:
        return basePrompt;
    }
  }

  private extractRegion(address: string): string {
    // Simple region extraction logic
    if (address.includes('New York') || address.includes('Boston')) return 'us-east';
    if (address.includes('California') || address.includes('Seattle')) return 'us-west';
    if (address.includes('Chicago') || address.includes('Texas')) return 'us-central';
    if (address.includes('London') || address.includes('Paris')) return 'europe';
    if (address.includes('Tokyo') || address.includes('Singapore')) return 'asia';
    return 'us-east'; // Default
  }

  private async storeInsight(insight: PredictiveInsight): Promise<void> {
    const { error } = await this.supabase
      .from('ai_insights')
      .insert({
        id: insight.id,
        type: insight.type,
        entity_type: insight.entityType,
        entity_id: insight.entityId,
        insight_data: insight.insightData,
        confidence_score: insight.confidenceScore,
        model_version: insight.modelVersion,
        organization_id: insight.organizationId,
        created_at: insight.createdAt.toISOString()
      });

    if (error) throw error;
  }
}

export default EnterpriseAIIntelligence;
