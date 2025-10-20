// src/lib/ml/models/intelligent-recommendations.ts
// Intelligent Recommendations Engine for Phase 2.9
// AI-powered next best actions, territory optimization, and resource allocation

import { inferenceEngine, type PredictionRequest } from '../infrastructure/inference-engine';

export interface RecommendationRequest {
  organizationId: string;
  userId: string;
  context: RecommendationContext;
  preferences?: UserPreferences;
  constraints?: RecommendationConstraints;
  recommendationType: RecommendationType;
}

export interface RecommendationContext {
  currentActivities: Activity[];
  opportunities: Opportunity[];
  performance: PerformanceMetrics;
  territory: TerritoryData;
  calendar: CalendarData;
  goals: Goal[];
  resources: AvailableResources;
}

export interface UserPreferences {
  preferredChannels: string[];
  workingHours: TimeRange;
  communicationStyle: string;
  priorities: string[];
  riskTolerance: 'low' | 'medium' | 'high';
}

export interface RecommendationConstraints {
  timeLimit: number; // hours available
  budgetLimit: number;
  travelRestrictions: string[];
  complianceRequirements: string[];
  resourceLimitations: string[];
}

export type RecommendationType = 
  | 'next_best_action'
  | 'territory_optimization'
  | 'resource_allocation'
  | 'call_planning'
  | 'content_recommendation'
  | 'timing_optimization';

export interface Activity {
  id: string;
  type: string;
  status: string;
  priority: string;
  dueDate: string;
  estimatedDuration: number;
  completionRate: number;
  outcome?: string;
}

export interface Opportunity {
  id: string;
  stage: string;
  value: number;
  probability: number;
  closeDate: string;
  lastActivity: string;
  meddpicScore: number;
  riskLevel: string;
}

export interface PerformanceMetrics {
  trx: number;
  nrx: number;
  revenue: number;
  callsMade: number;
  callsPlanned: number;
  attainment: number;
  efficiency: number;
}

export interface TerritoryData {
  id: string;
  size: number;
  hcpCount: number;
  coverage: number;
  potential: number;
  competition: number;
  accessibility: number;
}

export interface CalendarData {
  availability: TimeSlot[];
  blockedTimes: TimeSlot[];
  preferredTimes: TimeSlot[];
  travelTime: Record<string, number>;
}

export interface TimeSlot {
  start: string;
  end: string;
  location?: string;
  type?: string;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface Goal {
  id: string;
  type: string;
  target: number;
  current: number;
  deadline: string;
  priority: string;
}

export interface AvailableResources {
  budget: number;
  samples: Record<string, number>;
  marketing_materials: string[];
  support_team: string[];
  technologies: string[];
}

export interface RecommendationOutput {
  recommendations: Recommendation[];
  insights: RecommendationInsight[];
  prioritization: PrioritizationMatrix;
  implementation: ImplementationPlan;
  expectedOutcomes: ExpectedOutcome[];
  confidence: number;
  metadata: RecommendationMetadata;
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: number; // 0-100
  confidence: number; // 0-1
  timeframe: string;
  category: string;
  action: ActionDetails;
  rationale: string[];
  alternatives: Alternative[];
}

export interface ActionDetails {
  steps: ActionStep[];
  resources: string[];
  timeline: string;
  dependencies: string[];
  success_criteria: string[];
  risks: string[];
}

export interface ActionStep {
  order: number;
  description: string;
  duration: number;
  required: boolean;
  dependencies: string[];
}

export interface Alternative {
  id: string;
  title: string;
  description: string;
  effort: string;
  impact: number;
  rationale: string;
}

export interface RecommendationInsight {
  type: 'pattern' | 'opportunity' | 'risk' | 'efficiency' | 'trend';
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
  actionable: boolean;
  impact: 'high' | 'medium' | 'low';
}

export interface PrioritizationMatrix {
  quadrants: {
    high_impact_low_effort: string[];
    high_impact_high_effort: string[];
    low_impact_low_effort: string[];
    low_impact_high_effort: string[];
  };
  scoring: PriorityScore[];
}

export interface PriorityScore {
  recommendationId: string;
  totalScore: number;
  impactScore: number;
  effortScore: number;
  urgencyScore: number;
  feasibilityScore: number;
}

export interface ImplementationPlan {
  phases: ImplementationPhase[];
  timeline: string;
  resources: ResourceAllocation[];
  milestones: Milestone[];
  risks: RiskAssessment[];
}

export interface ImplementationPhase {
  phase: number;
  name: string;
  duration: string;
  recommendations: string[];
  prerequisites: string[];
  deliverables: string[];
}

export interface ResourceAllocation {
  resource: string;
  allocation: number;
  timeframe: string;
  justification: string;
}

export interface Milestone {
  name: string;
  date: string;
  criteria: string[];
  dependencies: string[];
}

export interface RiskAssessment {
  risk: string;
  probability: number;
  impact: number;
  mitigation: string;
  owner: string;
}

export interface ExpectedOutcome {
  metric: string;
  baseline: number;
  target: number;
  improvement: number;
  timeframe: string;
  confidence: number;
}

export interface RecommendationMetadata {
  modelVersion: string;
  generatedAt: string;
  dataQuality: number;
  featureImportance: Record<string, number>;
  benchmarkComparison: Record<string, number>;
  refreshDate: string;
}

export class IntelligentRecommendationsEngine {
  private static instance: IntelligentRecommendationsEngine;
  
  static getInstance(): IntelligentRecommendationsEngine {
    if (!IntelligentRecommendationsEngine.instance) {
      IntelligentRecommendationsEngine.instance = new IntelligentRecommendationsEngine();
    }
    return IntelligentRecommendationsEngine.instance;
  }

  // Generate recommendations
  async generateRecommendations(request: RecommendationRequest): Promise<RecommendationOutput> {
    try {
      console.log(`[IntelligentRecommendationsEngine] Generating ${request.recommendationType} recommendations`);

      // Prepare prediction request
      const predictionRequest: PredictionRequest = {
        modelId: this.getModelId(request.recommendationType),
        inputs: {
          organizationId: request.organizationId,
          userId: request.userId,
          context: request.context,
          preferences: request.preferences,
          constraints: request.constraints,
          // Derived features
          performance_velocity: this.calculatePerformanceVelocity(request.context.performance),
          opportunity_health: this.calculateOpportunityHealth(request.context.opportunities),
          territory_efficiency: this.calculateTerritoryEfficiency(request.context.territory),
          goal_alignment: this.calculateGoalAlignment(request.context.goals, request.context.performance),
          resource_utilization: this.calculateResourceUtilization(request.context.resources),
          time_optimization: this.calculateTimeOptimization(request.context.calendar, request.context.currentActivities)
        },
        extractFeatures: true,
        entityId: request.userId,
        entityType: 'activity',
        featureSet: 'recommendations'
      };

      // Make prediction
      const prediction = await inferenceEngine.predict(predictionRequest);

      // Process prediction results
      return this.processRecommendationPrediction(prediction, request);

    } catch (error) {
      console.error('[IntelligentRecommendationsEngine] Recommendation generation failed:', error);
      throw new Error(`Recommendation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate next best actions
  async generateNextBestActions(request: RecommendationRequest): Promise<RecommendationOutput> {
    const enhancedRequest = {
      ...request,
      recommendationType: 'next_best_action' as const
    };

    return this.generateRecommendations(enhancedRequest);
  }

  // Optimize territory coverage
  async optimizeTerritory(request: RecommendationRequest): Promise<RecommendationOutput> {
    const enhancedRequest = {
      ...request,
      recommendationType: 'territory_optimization' as const
    };

    const territoryRequest: PredictionRequest = {
      modelId: 'territory_optimization_v1',
      inputs: {
        ...enhancedRequest,
        territory_analytics: await this.analyzeTerritoryData(request.context.territory),
        hcp_segmentation: await this.segmentHCPs(request.context.territory),
        call_frequency_analysis: this.analyzeCallFrequency(request.context.currentActivities),
        coverage_gaps: await this.identifyCoverageGaps(request.context.territory)
      },
      extractFeatures: true,
      entityId: request.context.territory.id,
      entityType: 'opportunity',
      featureSet: 'territory_optimization'
    };

    const prediction = await inferenceEngine.predict(territoryRequest);
    return this.processTerritoryOptimization(prediction, enhancedRequest);
  }

  // Optimize resource allocation
  async optimizeResourceAllocation(request: RecommendationRequest): Promise<RecommendationOutput> {
    const enhancedRequest = {
      ...request,
      recommendationType: 'resource_allocation' as const
    };

    const resourceRequest: PredictionRequest = {
      modelId: 'resource_allocation_v1',
      inputs: {
        ...enhancedRequest,
        resource_efficiency: this.calculateResourceEfficiency(request.context.resources),
        demand_forecast: await this.forecastResourceDemand(request.context),
        roi_analysis: this.calculateResourceROI(request.context.resources, request.context.performance),
        allocation_constraints: request.constraints
      },
      extractFeatures: true,
      entityId: request.userId,
      entityType: 'activity',
      featureSet: 'resource_allocation'
    };

    const prediction = await inferenceEngine.predict(resourceRequest);
    return this.processResourceAllocation(prediction, enhancedRequest);
  }

  // Optimize call planning
  async optimizeCallPlanning(request: RecommendationRequest): Promise<RecommendationOutput> {
    const enhancedRequest = {
      ...request,
      recommendationType: 'call_planning' as const
    };

    const callPlanningRequest: PredictionRequest = {
      modelId: 'call_planning_optimization_v1',
      inputs: {
        ...enhancedRequest,
        hcp_preferences: await this.getHCPPreferences(request.context.territory),
        optimal_timing: this.calculateOptimalCallTiming(request.context.calendar),
        call_objectives: this.determineCallObjectives(request.context.opportunities),
        content_recommendations: await this.recommendCallContent(request.context.opportunities)
      },
      extractFeatures: true,
      entityId: request.userId,
      entityType: 'activity',
      featureSet: 'call_planning'
    };

    const prediction = await inferenceEngine.predict(callPlanningRequest);
    return this.processCallPlanningOptimization(prediction, enhancedRequest);
  }

  // Get content recommendations
  async getContentRecommendations(request: RecommendationRequest): Promise<RecommendationOutput> {
    const enhancedRequest = {
      ...request,
      recommendationType: 'content_recommendation' as const
    };

    const contentRequest: PredictionRequest = {
      modelId: 'content_recommendation_v1',
      inputs: {
        ...enhancedRequest,
        audience_analysis: await this.analyzeAudience(request.context.opportunities),
        content_performance: await this.getContentPerformance(request.organizationId),
        engagement_patterns: this.analyzeEngagementPatterns(request.context.currentActivities),
        therapeutic_relevance: await this.assessTherapeuticRelevance(request.context.opportunities)
      },
      extractFeatures: true,
      entityId: request.userId,
      entityType: 'activity',
      featureSet: 'content_recommendation'
    };

    const prediction = await inferenceEngine.predict(contentRequest);
    return this.processContentRecommendations(prediction, enhancedRequest);
  }

  // Private methods

  private getModelId(recommendationType: RecommendationType): string {
    const modelMap: Record<RecommendationType, string> = {
      'next_best_action': 'next_best_action_v1',
      'territory_optimization': 'territory_optimization_v1',
      'resource_allocation': 'resource_allocation_v1',
      'call_planning': 'call_planning_v1',
      'content_recommendation': 'content_recommendation_v1',
      'timing_optimization': 'timing_optimization_v1'
    };
    return modelMap[recommendationType];
  }

  private calculatePerformanceVelocity(performance: PerformanceMetrics): number {
    // Calculate performance trend velocity
    const efficiency = performance.efficiency || 0;
    const attainment = performance.attainment || 0;
    return (efficiency + attainment) / 2;
  }

  private calculateOpportunityHealth(opportunities: Opportunity[]): number {
    if (opportunities.length === 0) return 0;

    const totalValue = opportunities.reduce((sum, opp) => sum + (opp.value * opp.probability), 0);
    const avgProbability = opportunities.reduce((sum, opp) => sum + opp.probability, 0) / opportunities.length;
    const avgMeddpicScore = opportunities.reduce((sum, opp) => sum + opp.meddpicScore, 0) / opportunities.length;

    return (totalValue / 1000000) * avgProbability * (avgMeddpicScore / 100); // Normalized health score
  }

  private calculateTerritoryEfficiency(territory: TerritoryData): number {
    const coverageWeight = 0.3;
    const potentialWeight = 0.4;
    const competitionWeight = 0.2;
    const accessibilityWeight = 0.1;

    return (
      territory.coverage * coverageWeight +
      territory.potential * potentialWeight +
      (100 - territory.competition) * competitionWeight +
      territory.accessibility * accessibilityWeight
    );
  }

  private calculateGoalAlignment(goals: Goal[], _performance: PerformanceMetrics): number {
    if (goals.length === 0) return 100;

    let totalAlignment = 0;
    for (const goal of goals) {
      const progress = goal.current / goal.target;
      const alignment = Math.min(100, progress * 100);
      totalAlignment += alignment;
    }

    return totalAlignment / goals.length;
  }

  private calculateResourceUtilization(resources: AvailableResources): number {
    // Mock resource utilization calculation
    const budgetUtilization = Math.min(100, (resources.budget / 100000) * 100); // Assume $100k baseline
    const sampleUtilization = Object.values(resources.samples).reduce((sum, count) => sum + count, 0) / 1000 * 100;
    const materialUtilization = resources.marketing_materials.length * 10;
    
    return Math.min(100, (budgetUtilization + sampleUtilization + materialUtilization) / 3);
  }

  private calculateTimeOptimization(calendar: CalendarData, activities: Activity[]): number {
    const availableHours = calendar.availability.length * 8; // Assume 8-hour slots
    const plannedHours = activities.reduce((sum, activity) => sum + activity.estimatedDuration, 0);
    
    if (availableHours === 0) return 0;
    return Math.min(100, (plannedHours / availableHours) * 100);
  }

  private async analyzeTerritoryData(_territory: TerritoryData): Promise<Record<string, number>> {
    // Mock territory analysis
    return {
      high_value_hcps: 45,
      underutilized_areas: 23,
      travel_efficiency: 78,
      coverage_optimization_potential: 32
    };
  }

  private async segmentHCPs(_territory: TerritoryData): Promise<Record<string, unknown>> {
    // Mock HCP segmentation
    return {
      tier_1_hcps: 15,
      tier_2_hcps: 30,
      tier_3_hcps: 55,
      new_hcps: 12,
      high_potential: 18
    };
  }

  private analyzeCallFrequency(activities: Activity[]): Record<string, number> {
    const callActivities = activities.filter(a => a.type.includes('call'));
    return {
      current_frequency: callActivities.length,
      recommended_frequency: Math.max(callActivities.length * 1.2, 8),
      efficiency_score: callActivities.reduce((sum, a) => sum + a.completionRate, 0) / callActivities.length || 0
    };
  }

  private async identifyCoverageGaps(_territory: TerritoryData): Promise<string[]> {
    // Mock coverage gap identification
    return [
      'North region under-covered',
      'Tier 1 HCPs need more frequent visits',
      'New HCP onboarding opportunities'
    ];
  }

  private calculateResourceEfficiency(resources: AvailableResources): Record<string, number> {
    return {
      budget_efficiency: Math.min(100, resources.budget / 50000), // $50k baseline
      sample_efficiency: Object.values(resources.samples).reduce((sum, count) => sum + count, 0) / 100,
      material_utilization: resources.marketing_materials.length * 5
    };
  }

  private async forecastResourceDemand(_context: RecommendationContext): Promise<Record<string, number>> {
    // Mock resource demand forecast
    return {
      budget_demand: 75000,
      sample_demand: 500,
      material_demand: 20,
      support_demand: 0.5
    };
  }

  private calculateResourceROI(resources: AvailableResources, performance: PerformanceMetrics): Record<string, number> {
    const budgetROI = performance.revenue / (resources.budget || 1);
    return {
      budget_roi: budgetROI,
      sample_roi: performance.trx / (Object.values(resources.samples).reduce((sum, count) => sum + count, 0) || 1),
      material_roi: performance.callsMade / (resources.marketing_materials.length || 1)
    };
  }

  private async getHCPPreferences(_territory: TerritoryData): Promise<Record<string, unknown>> {
    // Mock HCP preferences
    return {
      preferred_contact_time: 'morning',
      preferred_channel: 'in_person',
      content_preferences: ['clinical_data', 'case_studies'],
      meeting_duration: 30
    };
  }

  private calculateOptimalCallTiming(_calendar: CalendarData): Record<string, unknown> {
    // Mock optimal timing calculation
    return {
      best_days: ['Tuesday', 'Wednesday', 'Thursday'],
      best_times: ['9-11am', '2-4pm'],
      avoid_times: ['Monday morning', 'Friday afternoon'],
      travel_optimization: 'cluster_by_location'
    };
  }

  private determineCallObjectives(opportunities: Opportunity[]): string[] {
    const objectives: string[] = [];
    
    for (const opp of opportunities) {
      if (opp.stage === 'discovery') {
        objectives.push('needs_assessment');
      } else if (opp.stage === 'qualification') {
        objectives.push('meddpicc_validation');
      } else if (opp.stage === 'proposal') {
        objectives.push('objection_handling');
      }
    }
    
    return [...new Set(objectives)]; // Remove duplicates
  }

  private async recommendCallContent(opportunities: Opportunity[]): Promise<string[]> {
    const content: string[] = [];
    
    for (const opp of opportunities) {
      if (opp.meddpicScore < 60) {
        content.push('qualification_framework');
      }
      if (opp.riskLevel === 'high') {
        content.push('risk_mitigation_strategies');
      }
      if (opp.stage === 'proposal') {
        content.push('roi_calculator');
      }
    }
    
    return [...new Set(content)];
  }

  private async analyzeAudience(_opportunities: Opportunity[]): Promise<Record<string, unknown>> {
    // Mock audience analysis
    return {
      primary_personas: ['medical_director', 'clinical_coordinator'],
      therapeutic_areas: ['cardiology', 'diabetes'],
      seniority_levels: ['senior', 'executive'],
      decision_influence: 'high'
    };
  }

  private async getContentPerformance(_organizationId: string): Promise<Record<string, number>> {
    // Mock content performance
    return {
      case_studies: 85,
      clinical_data: 92,
      roi_calculators: 78,
      product_demos: 88,
      testimonials: 82
    };
  }

  private analyzeEngagementPatterns(activities: Activity[]): Record<string, number> {
    const engagementActivities = activities.filter(a => a.type.includes('engagement'));
    return {
      avg_engagement_duration: engagementActivities.reduce((sum, a) => sum + a.estimatedDuration, 0) / engagementActivities.length || 0,
      engagement_frequency: engagementActivities.length,
      success_rate: engagementActivities.reduce((sum, a) => sum + a.completionRate, 0) / engagementActivities.length || 0
    };
  }

  private async assessTherapeuticRelevance(_opportunities: Opportunity[]): Promise<Record<string, number>> {
    // Mock therapeutic relevance assessment
    return {
      cardiology_relevance: 90,
      diabetes_relevance: 85,
      oncology_relevance: 70,
      neurology_relevance: 60
    };
  }

  private async processRecommendationPrediction(prediction: { prediction: unknown; confidence?: number; version: string; explainability?: Array<{ feature: string; importance: number }> }, request: RecommendationRequest): Promise<RecommendationOutput> {
    const recommendationData = prediction.prediction as Record<string, unknown>;

    // Generate recommendations based on type
    const recommendations = await this.generateRecommendationsByType(request.recommendationType, recommendationData, request);

    // Generate insights
    const insights = this.generateRecommendationInsights(recommendationData, request.context);

    // Create prioritization matrix
    const prioritization = this.createPrioritizationMatrix(recommendations);

    // Create implementation plan
    const implementation = this.createImplementationPlan(recommendations, request);

    // Calculate expected outcomes
    const expectedOutcomes = this.calculateExpectedOutcomes(recommendations, request);

    return {
      recommendations,
      insights,
      prioritization,
      implementation,
      expectedOutcomes,
      confidence: prediction.confidence || 0.8,
      metadata: {
        modelVersion: prediction.version,
        generatedAt: new Date().toISOString(),
        dataQuality: this.assessDataQuality(request),
        featureImportance: prediction.explainability?.reduce((acc, exp) => {
          acc[exp.feature] = exp.importance;
          return acc;
        }, {} as Record<string, number>) || {},
        benchmarkComparison: {
          industry_average: 65,
          company_average: 72,
          peer_comparison: 78
        },
        refreshDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }
    };
  }

  private async processTerritoryOptimization(prediction: { prediction: unknown; confidence?: number; version: string }, request: RecommendationRequest): Promise<RecommendationOutput> {
    // Process territory-specific recommendations
    return this.processRecommendationPrediction(prediction, request);
  }

  private async processResourceAllocation(prediction: { prediction: unknown; confidence?: number; version: string }, request: RecommendationRequest): Promise<RecommendationOutput> {
    // Process resource allocation-specific recommendations
    return this.processRecommendationPrediction(prediction, request);
  }

  private async processCallPlanningOptimization(prediction: { prediction: unknown; confidence?: number; version: string }, request: RecommendationRequest): Promise<RecommendationOutput> {
    // Process call planning-specific recommendations
    return this.processRecommendationPrediction(prediction, request);
  }

  private async processContentRecommendations(prediction: { prediction: unknown; confidence?: number; version: string }, request: RecommendationRequest): Promise<RecommendationOutput> {
    // Process content recommendation-specific recommendations
    return this.processRecommendationPrediction(prediction, request);
  }

  private async generateRecommendationsByType(type: RecommendationType, _data: Record<string, unknown>, _request: RecommendationRequest): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    switch (type) {
      case 'next_best_action':
        recommendations.push({
          id: `nba_${Date.now()}_1`,
          type: 'next_best_action',
          title: 'Schedule High-Priority HCP Visit',
          description: 'Visit Dr. Smith to advance cardiovascular opportunity',
          priority: 'high',
          effort: 'medium',
          impact: 85,
          confidence: 0.9,
          timeframe: 'this_week',
          category: 'sales_activity',
          action: {
            steps: [
              { order: 1, description: 'Schedule appointment', duration: 0.5, required: true, dependencies: [] },
              { order: 2, description: 'Prepare clinical materials', duration: 1, required: true, dependencies: ['step_1'] },
              { order: 3, description: 'Conduct visit', duration: 1, required: true, dependencies: ['step_2'] },
              { order: 4, description: 'Follow up with summary', duration: 0.5, required: true, dependencies: ['step_3'] }
            ],
            resources: ['Clinical materials', 'Product samples'],
            timeline: '3_days',
            dependencies: ['HCP availability'],
            success_criteria: ['Meeting scheduled', 'Needs identified', 'Next steps agreed'],
            risks: ['HCP cancellation', 'Competing priorities']
          },
          rationale: ['High opportunity value', 'Strong relationship', 'Optimal timing'],
          alternatives: [{
            id: 'alt_1',
            title: 'Virtual consultation',
            description: 'Schedule video call instead of in-person visit',
            effort: 'low',
            impact: 70,
            rationale: 'Lower effort but potentially less effective'
          }]
        });
        break;

      case 'territory_optimization':
        recommendations.push({
          id: `terr_${Date.now()}_1`,
          type: 'territory_optimization',
          title: 'Optimize North Region Coverage',
          description: 'Increase visit frequency in high-potential northern area',
          priority: 'high',
          effort: 'high',
          impact: 75,
          confidence: 0.85,
          timeframe: '2_weeks',
          category: 'territory_management',
          action: {
            steps: [
              { order: 1, description: 'Analyze HCP priority tiers', duration: 2, required: true, dependencies: [] },
              { order: 2, description: 'Optimize travel routes', duration: 1, required: true, dependencies: ['step_1'] },
              { order: 3, description: 'Schedule additional visits', duration: 4, required: true, dependencies: ['step_2'] },
              { order: 4, description: 'Monitor coverage metrics', duration: 1, required: false, dependencies: ['step_3'] }
            ],
            resources: ['Territory mapping tools', 'Travel budget'],
            timeline: '2_weeks',
            dependencies: ['Budget approval'],
            success_criteria: ['Coverage increase', 'Efficiency improvement'],
            risks: ['Travel constraints', 'HCP availability']
          },
          rationale: ['Coverage gap identified', 'High ROI potential', 'Competitive advantage'],
          alternatives: []
        });
        break;

      case 'resource_allocation':
        recommendations.push({
          id: `res_${Date.now()}_1`,
          type: 'resource_allocation',
          title: 'Reallocate Sample Budget',
          description: 'Shift sample allocation to high-performing products',
          priority: 'medium',
          effort: 'low',
          impact: 60,
          confidence: 0.8,
          timeframe: '1_week',
          category: 'resource_management',
          action: {
            steps: [
              { order: 1, description: 'Analyze sample utilization', duration: 1, required: true, dependencies: [] },
              { order: 2, description: 'Identify reallocation opportunities', duration: 1, required: true, dependencies: ['step_1'] },
              { order: 3, description: 'Request sample transfers', duration: 0.5, required: true, dependencies: ['step_2'] },
              { order: 4, description: 'Update inventory tracking', duration: 0.5, required: true, dependencies: ['step_3'] }
            ],
            resources: ['Sample inventory', 'Budget approval'],
            timeline: '1_week',
            dependencies: ['Management approval'],
            success_criteria: ['Improved utilization', 'Better ROI'],
            risks: ['Supply constraints', 'Regulatory requirements']
          },
          rationale: ['Under-utilization identified', 'Performance data supports change'],
          alternatives: []
        });
        break;

      default:
        // Generic recommendations for other types
        break;
    }

    return recommendations;
  }

  private generateRecommendationInsights(_data: Record<string, unknown>, request: RecommendationContext): RecommendationInsight[] {
    const insights: RecommendationInsight[] = [];

    // Performance pattern analysis
    if (request.performance.attainment < 80) {
      insights.push({
        type: 'opportunity',
        title: 'Performance Gap Opportunity',
        description: 'Current attainment below target, focus on high-impact activities',
        evidence: [`${request.performance.attainment}% attainment vs 100% target`],
        confidence: 0.9,
        actionable: true,
        impact: 'high'
      });
    }

    // Territory efficiency insight
    const avgCoverage = request.territory.coverage;
    if (avgCoverage < 70) {
      insights.push({
        type: 'efficiency',
        title: 'Territory Coverage Optimization',
        description: 'Territory coverage below optimal levels',
        evidence: [`${avgCoverage}% coverage`, 'Identified high-potential uncovered areas'],
        confidence: 0.85,
        actionable: true,
        impact: 'medium'
      });
    }

    // Opportunity health trend
    const highValueOpps = request.opportunities.filter(o => o.value > 100000).length;
    if (highValueOpps > 0) {
      insights.push({
        type: 'trend',
        title: 'High-Value Opportunity Focus',
        description: 'Multiple high-value opportunities require attention',
        evidence: [`${highValueOpps} opportunities > $100k`, 'Average deal size increasing'],
        confidence: 0.8,
        actionable: true,
        impact: 'high'
      });
    }

    return insights;
  }

  private createPrioritizationMatrix(recommendations: Recommendation[]): PrioritizationMatrix {
    const quadrants = {
      high_impact_low_effort: [] as string[],
      high_impact_high_effort: [] as string[],
      low_impact_low_effort: [] as string[],
      low_impact_high_effort: [] as string[]
    };

    const scoring: PriorityScore[] = [];

    for (const rec of recommendations) {
      const impactScore = rec.impact;
      const effortScore = rec.effort === 'low' ? 25 : rec.effort === 'medium' ? 50 : 75;
      const urgencyScore = rec.priority === 'critical' ? 100 : rec.priority === 'high' ? 75 : rec.priority === 'medium' ? 50 : 25;
      const feasibilityScore = rec.confidence * 100;

      const totalScore = (impactScore * 0.4) + ((100 - effortScore) * 0.3) + (urgencyScore * 0.2) + (feasibilityScore * 0.1);

      scoring.push({
        recommendationId: rec.id,
        totalScore,
        impactScore,
        effortScore,
        urgencyScore,
        feasibilityScore
      });

      // Categorize into quadrants
      if (impactScore >= 70 && effortScore <= 50) {
        quadrants.high_impact_low_effort.push(rec.id);
      } else if (impactScore >= 70 && effortScore > 50) {
        quadrants.high_impact_high_effort.push(rec.id);
      } else if (impactScore < 70 && effortScore <= 50) {
        quadrants.low_impact_low_effort.push(rec.id);
      } else {
        quadrants.low_impact_high_effort.push(rec.id);
      }
    }

    return { quadrants, scoring };
  }

  private createImplementationPlan(recommendations: Recommendation[], _request: RecommendationRequest): ImplementationPlan {
    // Sort recommendations by priority and effort
    const sortedRecs = recommendations.sort((a, b) => {
      const aPriority = a.priority === 'critical' ? 4 : a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1;
      const bPriority = b.priority === 'critical' ? 4 : b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1;
      return bPriority - aPriority;
    });

    const phases: ImplementationPhase[] = [
      {
        phase: 1,
        name: 'Quick Wins',
        duration: '1_week',
        recommendations: sortedRecs.filter(r => r.effort === 'low').map(r => r.id),
        prerequisites: [],
        deliverables: ['Immediate impact actions completed']
      },
      {
        phase: 2,
        name: 'Medium Impact',
        duration: '2_weeks',
        recommendations: sortedRecs.filter(r => r.effort === 'medium').map(r => r.id),
        prerequisites: ['Phase 1 completion'],
        deliverables: ['Process improvements implemented']
      },
      {
        phase: 3,
        name: 'Strategic Initiatives',
        duration: '4_weeks',
        recommendations: sortedRecs.filter(r => r.effort === 'high').map(r => r.id),
        prerequisites: ['Phase 2 completion', 'Resource allocation'],
        deliverables: ['Long-term optimization complete']
      }
    ];

    const resources: ResourceAllocation[] = [
      {
        resource: 'Time',
        allocation: 20, // hours per week
        timeframe: '4_weeks',
        justification: 'Implementation effort'
      },
      {
        resource: 'Budget',
        allocation: 10000, // dollars
        timeframe: '4_weeks',
        justification: 'Resource and tool costs'
      }
    ];

    const milestones: Milestone[] = [
      {
        name: 'Quick wins completed',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        criteria: ['All low-effort recommendations implemented'],
        dependencies: []
      },
      {
        name: 'Mid-term goals achieved',
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        criteria: ['Performance improvement visible'],
        dependencies: ['Quick wins completed']
      }
    ];

    const risks: RiskAssessment[] = [
      {
        risk: 'Resource constraints',
        probability: 0.3,
        impact: 0.6,
        mitigation: 'Prioritize high-impact, low-effort actions',
        owner: 'Sales Manager'
      },
      {
        risk: 'Implementation resistance',
        probability: 0.2,
        impact: 0.4,
        mitigation: 'Clear communication and training',
        owner: 'Change Management'
      }
    ];

    return {
      phases,
      timeline: '4_weeks',
      resources,
      milestones,
      risks
    };
  }

  private calculateExpectedOutcomes(recommendations: Recommendation[], request: RecommendationRequest): ExpectedOutcome[] {
    const outcomes: ExpectedOutcome[] = [];

    // Calculate expected improvements based on recommendations
    const totalImpact = recommendations.reduce((sum, rec) => sum + rec.impact, 0) / recommendations.length;
    
    outcomes.push({
      metric: 'TRx Growth',
      baseline: request.context.performance.trx,
      target: request.context.performance.trx * (1 + totalImpact / 200), // Conservative estimate
      improvement: totalImpact / 2,
      timeframe: '3_months',
      confidence: 0.8
    });

    outcomes.push({
      metric: 'Territory Coverage',
      baseline: request.context.territory.coverage,
      target: Math.min(100, request.context.territory.coverage * 1.15),
      improvement: 15,
      timeframe: '2_months',
      confidence: 0.85
    });

    outcomes.push({
      metric: 'Sales Efficiency',
      baseline: request.context.performance.efficiency,
      target: Math.min(100, request.context.performance.efficiency * 1.2),
      improvement: 20,
      timeframe: '6_weeks',
      confidence: 0.75
    });

    return outcomes;
  }

  private assessDataQuality(request: RecommendationRequest): number {
    let quality = 0;
    const totalChecks = 10;

    // Check data completeness
    if (request.context.currentActivities.length > 0) quality++;
    if (request.context.opportunities.length > 0) quality++;
    if (request.context.performance.trx > 0) quality++;
    if (request.context.territory.id) quality++;
    if (request.context.goals.length > 0) quality++;
    if (request.context.calendar.availability.length > 0) quality++;
    if (request.preferences) quality++;
    if (request.constraints) quality++;
    if (request.context.resources.budget > 0) quality++;
    if (request.userId) quality++;

    return (quality / totalChecks) * 100;
  }
}

// Export singleton instance
export const intelligentRecommendationsEngine = IntelligentRecommendationsEngine.getInstance();