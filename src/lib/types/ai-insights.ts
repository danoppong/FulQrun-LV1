// src/lib/types/ai-insights.ts
// AI-Powered Insights Types for Phase 2.7 Implementation
// Comprehensive type definitions for intelligent pharmaceutical analytics

export interface AIInsight {
  id: string;
  type: 'alert' | 'prediction' | 'recommendation' | 'opportunity' | 'risk' | 'trend';
  category: 'performance' | 'territory' | 'product' | 'hcp' | 'market' | 'competitive';
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: 1 | 2 | 3 | 4 | 5; // 1 = highest, 5 = lowest
  
  title: string;
  description: string;
  summary: string;
  
  confidence: number; // 0-1
  impact: 'positive' | 'negative' | 'neutral';
  urgency: 'immediate' | 'soon' | 'planned' | 'monitor';
  
  data: {
    metric: string;
    currentValue: number;
    expectedValue?: number;
    threshold?: number;
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    timeframe: string;
  };
  
  context: {
    territory?: string;
    product?: string;
    hcp?: string;
    segment?: string;
    timeperiod: string;
  };
  
  recommendations: AIRecommendation[];
  relatedInsights: string[]; // insight IDs
  
  metadata: {
    algorithm: string;
    dataSource: string[];
    generatedAt: string;
    expiresAt?: string;
    version: string;
  };
  
  actions: {
    primaryAction?: AIAction;
    secondaryActions?: AIAction[];
    dismissible: boolean;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: string;
  };
}

export interface AIRecommendation {
  id: string;
  type: 'action' | 'strategy' | 'tactical' | 'investigation';
  title: string;
  description: string;
  
  expectedImpact: {
    metric: string;
    estimatedChange: number;
    timeframe: string;
    confidence: number;
  };
  
  effort: 'low' | 'medium' | 'high';
  timeline: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  
  prerequisites?: string[];
  resources?: string[];
  risks?: string[];
  
  success_metrics: string[];
  implementation_steps: string[];
}

export interface AIAction {
  id: string;
  type: 'navigate' | 'filter' | 'export' | 'schedule' | 'alert' | 'external';
  label: string;
  description?: string;
  
  target: {
    type: 'dashboard' | 'report' | 'url' | 'function';
    value: string;
    parameters?: Record<string, string | number | boolean>;
  };
  
  icon?: string;
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline';
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'linear_regression' | 'time_series' | 'neural_network' | 'ensemble' | 'statistical';
  purpose: 'forecasting' | 'classification' | 'anomaly_detection' | 'optimization';
  
  target_metric: string;
  features: string[];
  
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
  };
  
  training_data: {
    records: number;
    timespan: string;
    last_updated: string;
    data_quality: number; // 0-1
  };
  
  predictions: PredictiveResult[];
  
  metadata: {
    algorithm_version: string;
    training_duration: number;
    last_trained: string;
    next_training: string;
    status: 'active' | 'training' | 'deprecated' | 'error';
  };
}

export interface PredictiveResult {
  id: string;
  model_id: string;
  prediction_date: string;
  target_date: string;
  
  predicted_value: number;
  confidence_interval: {
    lower: number;
    upper: number;
    confidence_level: number; // e.g., 0.95 for 95%
  };
  
  contributing_factors: Array<{
    factor: string;
    impact: number; // -1 to 1
    importance: number; // 0-1
  }>;
  
  scenarios: Array<{
    name: string;
    description: string;
    probability: number;
    predicted_value: number;
  }>;
}

export interface SmartAlert {
  id: string;
  name: string;
  description: string;
  
  trigger: {
    metric: string;
    condition: 'greater_than' | 'less_than' | 'equals' | 'percentage_change' | 'trend_change' | 'anomaly';
    threshold: number;
    timeframe: string;
    consecutive_periods?: number;
  };
  
  filters: {
    territories?: string[];
    products?: string[];
    segments?: string[];
    hcps?: string[];
  };
  
  notification: {
    channels: ('dashboard' | 'email' | 'sms' | 'slack' | 'webhook')[];
    recipients: string[];
    template: string;
    frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  };
  
  actions: {
    auto_actions?: AIAction[];
    suggested_actions: AIAction[];
  };
  
  status: 'active' | 'paused' | 'triggered' | 'resolved';
  
  history: Array<{
    triggered_at: string;
    value: number;
    threshold: number;
    resolved_at?: string;
    acknowledged_by?: string;
  }>;
  
  metadata: {
    created_by: string;
    created_at: string;
    updated_at: string;
    priority: number;
    tags: string[];
  };
}

export interface TerritoryOptimization {
  id: string;
  territory_id: string;
  
  current_performance: {
    trx: number;
    nrx: number;
    market_share: number;
    hcp_coverage: number;
    call_frequency: number;
  };
  
  optimization_opportunities: Array<{
    type: 'coverage' | 'frequency' | 'targeting' | 'messaging' | 'timing';
    description: string;
    potential_impact: {
      metric: string;
      estimated_lift: number;
      confidence: number;
    };
    implementation_effort: 'low' | 'medium' | 'high';
    timeline: string;
  }>;
  
  hcp_prioritization: Array<{
    hcp_id: string;
    name: string;
    priority_score: number;
    rationale: string;
    recommended_frequency: number;
    recommended_messaging: string[];
    potential_value: number;
  }>;
  
  resource_allocation: {
    current_allocation: Record<string, number>;
    recommended_allocation: Record<string, number>;
    reallocation_impact: Record<string, number>;
  };
  
  competitive_intelligence: {
    competitive_pressure: number; // 0-1
    share_at_risk: number;
    competitor_activities: string[];
    defensive_strategies: string[];
  };
}

export interface CallPlanning {
  id: string;
  rep_id: string;
  territory_id: string;
  planning_period: string;
  
  hcp_schedule: Array<{
    hcp_id: string;
    name: string;
    specialty: string;
    priority: number;
    
    scheduled_visits: Array<{
      date: string;
      time: string;
      duration: number;
      objective: string;
      materials: string[];
      follow_up_required: boolean;
    }>;
    
    visit_history: {
      last_visit: string;
      total_visits: number;
      average_frequency: number;
      engagement_score: number;
    };
    
    preferences: {
      preferred_days: string[];
      preferred_times: string[];
      communication_style: string;
      interests: string[];
    };
  }>;
  
  route_optimization: {
    daily_routes: Array<{
      date: string;
      visits: Array<{
        hcp_id: string;
        estimated_travel_time: number;
        visit_duration: number;
        location: { lat: number; lng: number };
      }>;
      total_drive_time: number;
      efficiency_score: number;
    }>;
  };
  
  goal_tracking: {
    period_goals: Record<string, number>;
    current_progress: Record<string, number>;
    projected_achievement: Record<string, number>;
  };
}

export interface CompetitiveIntelligence {
  id: string;
  competitor: string;
  product: string;
  
  market_movements: Array<{
    date: string;
    type: 'launch' | 'promotion' | 'price_change' | 'indication_expansion' | 'patent_expiry';
    description: string;
    impact_assessment: {
      our_products_affected: string[];
      estimated_impact: number; // -1 to 1
      timeframe: string;
    };
  }>;
  
  share_analysis: {
    competitor_share: number;
    our_share: number;
    trend: 'gaining' | 'losing' | 'stable';
    key_segments: Array<{
      segment: string;
      competitor_strength: number; // 0-1
      our_opportunity: number; // 0-1
    }>;
  };
  
  strategic_responses: Array<{
    scenario: string;
    recommended_actions: string[];
    resource_requirements: string[];
    success_probability: number;
    timeline: string;
  }>;
}

export interface AIInsightEngine {
  generateInsights: (data: PharmaData[], context: AnalysisContext) => Promise<AIInsight[]>;
  generatePredictions: (model: PredictiveModel, data: PharmaData[]) => Promise<PredictiveResult[]>;
  optimizeTerritory: (territoryId: string, data: TerritoryData) => Promise<TerritoryOptimization>;
  planCalls: (repId: string, territoryId: string, period: string) => Promise<CallPlanning>;
  analyzeCompetition: (productId: string, competitors: string[]) => Promise<CompetitiveIntelligence>;
  
  // Alert management
  createAlert: (alert: Omit<SmartAlert, 'id' | 'metadata'>) => Promise<SmartAlert>;
  updateAlert: (id: string, updates: Partial<SmartAlert>) => Promise<SmartAlert>;
  triggerAlert: (alertId: string, data: AlertTriggerData) => Promise<void>;
  
  // Model management
  trainModel: (config: ModelTrainingConfig) => Promise<PredictiveModel>;
  evaluateModel: (modelId: string, testData: PharmaData[]) => Promise<ModelEvaluation>;
  deployModel: (modelId: string) => Promise<void>;
}

// Supporting data types for the AI engine
export interface PharmaData {
  date: string;
  territory?: string;
  product?: string;
  hcp?: string;
  trx?: number;
  nrx?: number;
  market_share?: number;
  calls?: number;
  samples?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface AnalysisContext {
  timeframe: string;
  filters: {
    territories?: string[];
    products?: string[];
    segments?: string[];
  };
  user_id: string;
  organization_id: string;
}

export interface TerritoryData {
  territory_id: string;
  performance_metrics: Record<string, number>;
  hcp_data: Array<{
    hcp_id: string;
    specialty: string;
    potential: number;
    current_share: number;
  }>;
  competitive_data: Record<string, number>;
}

export interface AlertTriggerData {
  metric: string;
  value: number;
  threshold: number;
  context: Record<string, string | number>;
}

export interface ModelTrainingConfig {
  model_type: PredictiveModel['type'];
  target_metric: string;
  features: string[];
  training_period: string;
  validation_split: number;
  hyperparameters?: Record<string, string | number>;
}

export interface ModelEvaluation {
  model_id: string;
  performance_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    mape: number;
    rmse: number;
  };
  feature_importance: Array<{
    feature: string;
    importance: number;
  }>;
  validation_results: {
    predictions: number[];
    actuals: number[];
    residuals: number[];
  };
}

// Pharmaceutical-specific AI insight types
export interface PharmaAIInsights {
  prescriptionAnomalies: AIInsight[];
  marketShareAlerts: AIInsight[];
  hcpEngagementOpportunities: AIInsight[];
  territoryOptimizations: AIInsight[];
  competitiveThreats: AIInsight[];
  launchReadiness: AIInsight[];
  formularyAccess: AIInsight[];
  samplingEffectiveness: AIInsight[];
}

export interface AIInsightConfig {
  enabledCategories: string[];
  severityThresholds: Record<string, number>;
  notificationSettings: {
    channels: string[];
    frequency: string;
    quiet_hours: { start: string; end: string };
  };
  autoActions: {
    enabled: boolean;
    requireApproval: boolean;
    maxImpact: number;
  };
}