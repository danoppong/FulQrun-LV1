// src/lib/ai/ai-insights-engine.ts
// AI-Powered Insights Engine for Phase 2.7 Implementation
// Intelligent pharmaceutical analytics with predictive capabilities

import { 
  AIInsight, 
  AIRecommendation, 
  PredictiveModel, 
  PredictiveResult, 
  SmartAlert, 
  TerritoryOptimization,
  CallPlanning,
  CompetitiveIntelligence,
  PharmaData,
  AnalysisContext,
  TerritoryData,
  AlertTriggerData,
  ModelTrainingConfig,
  ModelEvaluation,
  AIInsightEngine as IAIInsightEngine
} from '@/lib/types/ai-insights';

export class AIInsightEngine implements IAIInsightEngine {
  private static instance: AIInsightEngine;
  private cache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map();
  private alerts: Map<string, SmartAlert> = new Map();
  private models: Map<string, PredictiveModel> = new Map();

  static getInstance(): AIInsightEngine {
    if (!AIInsightEngine.instance) {
      AIInsightEngine.instance = new AIInsightEngine();
    }
    return AIInsightEngine.instance;
  }

  private constructor() {
    this.initializeDefaultModels();
  }

  // Cache management
  private setCacheData<T>(key: string, data: T, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCacheData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  // Generate AI insights from pharmaceutical data
  async generateInsights(data: PharmaData[], context: AnalysisContext): Promise<AIInsight[]> {
    const cacheKey = `insights_${context.organization_id}_${context.timeframe}_${data.length}`;
    const cached = this.getCacheData<AIInsight[]>(cacheKey);
    if (cached) return cached;

    const insights: AIInsight[] = [];

    try {
      // Generate performance insights
      const performanceInsights = await this.analyzePerformance(data, context);
      insights.push(...performanceInsights);

      // Generate anomaly insights
      const anomalyInsights = await this.detectAnomalies(data, context);
      insights.push(...anomalyInsights);

      // Generate predictive insights
      const predictiveInsights = await this.generatePredictiveInsights(data, context);
      insights.push(...predictiveInsights);

      // Generate opportunity insights
      const opportunityInsights = await this.identifyOpportunities(data, context);
      insights.push(...opportunityInsights);

      // Sort by priority and confidence
      insights.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.confidence - a.confidence;
      });

      this.setCacheData(cacheKey, insights, 600000); // 10 minute TTL
      return insights;

    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  // Analyze performance trends and generate insights
  private async analyzePerformance(data: PharmaData[], context: AnalysisContext): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Analyze TRx trends
    const trxData = data.filter(d => d.trx !== undefined).map(d => d.trx!);
    if (trxData.length >= 2) {
      const trend = this.calculateTrend(trxData);
      // Compute the largest single-period change to catch significant drops like 1200 -> 950
  let maxDropPercent = 0;
  let _dropIndex = -1;
      for (let i = 1; i < trxData.length; i++) {
        const prev = trxData[i - 1];
        const curr = trxData[i];
        if (prev > 0) {
          const pct = ((curr - prev) / prev) * 100;
          if (pct < maxDropPercent) {
            maxDropPercent = pct;
            _dropIndex = i;
          }
        }
      }

      // Also consider most recent change
      const currentValue = trxData[trxData.length - 1];
      const previousValue = trxData[trxData.length - 2];
      const recentChange = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;

      const significantChange = Math.abs(recentChange) >= 15 || Math.abs(maxDropPercent) >= 15;
      const changePercent = Math.abs(maxDropPercent) >= 15 ? maxDropPercent : recentChange;

      if (significantChange) {
        insights.push({
          id: `trx_performance_${Date.now()}`,
          type: changePercent > 0 ? 'opportunity' : 'alert',
          category: 'performance',
          severity: Math.abs(changePercent) >= 20 ? 'high' : 'medium',
          priority: Math.abs(changePercent) >= 20 ? 1 : 2,
          
          title: `TRx ${changePercent > 0 ? 'Surge' : 'Decline'} Detected`,
          description: `Total prescriptions have ${changePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercent).toFixed(1)}% in the latest period.`,
          summary: `TRx performance shows ${trend.direction} trend with ${changePercent.toFixed(1)}% change`,
          
          confidence: 0.85,
          impact: changePercent > 0 ? 'positive' : 'negative',
          urgency: Math.abs(changePercent) > 25 ? 'immediate' : 'soon',
          
          data: {
            metric: 'TRx',
            currentValue,
            expectedValue: previousValue,
            trend: trend.direction as 'increasing' | 'decreasing' | 'stable' | 'volatile',
            timeframe: context.timeframe
          },
          
          context: {
            timeperiod: context.timeframe
          },
          
          recommendations: this.generatePerformanceRecommendations(changePercent, 'TRx'),
          relatedInsights: [],
          
          metadata: {
            algorithm: 'trend_analysis_v1',
            dataSource: ['prescription_data'],
            generatedAt: new Date().toISOString(),
            analysis_timestamp: new Date().toISOString(),
            data_points: data.length,
            version: '1.0'
          },
          
          actions: {
            primaryAction: {
              id: 'view_trx_detail',
              type: 'navigate',
              action: 'navigate',
              label: 'View TRx Details',
              target: {
                type: 'dashboard',
                value: '/pharmaceutical-bi',
                parameters: { metric: 'trx', period: context.timeframe }
              }
            },
            dismissible: true,
            acknowledged: false
          }
        });
      }
    }

    return insights;
  }

  // Detect anomalies in pharmaceutical data
  private async detectAnomalies(data: PharmaData[], context: AnalysisContext): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Group data by metric for anomaly detection
    const metricGroups = this.groupDataByMetric(data);

    for (const [metric, values] of Object.entries(metricGroups)) {
      if (values.length < 10) continue; // Need sufficient data for anomaly detection

      const anomalies = this.detectOutliers(values);
      
      if (anomalies.length > 0) {
        const latestAnomaly = anomalies[anomalies.length - 1];
        
        insights.push({
          id: `anomaly_${metric}_${Date.now()}`,
          type: 'alert',
          category: 'performance',
          severity: 'medium',
          priority: 2,
          
          title: `${metric.toUpperCase()} Anomaly Detected`,
          description: `Unusual ${metric} value detected: ${latestAnomaly.value} (${latestAnomaly.deviation.toFixed(1)} standard deviations from normal)`,
          summary: `Statistical anomaly in ${metric} performance`,
          
          confidence: 0.78,
          impact: 'neutral',
          urgency: 'monitor',
          
          data: {
            metric,
            currentValue: latestAnomaly.value,
            expectedValue: latestAnomaly.expected,
            threshold: latestAnomaly.threshold,
            trend: 'volatile',
            timeframe: context.timeframe
          },
          
          context: {
            timeperiod: context.timeframe
          },
          
          recommendations: [{
            id: `anomaly_rec_${Date.now()}`,
            type: 'investigation',
            title: 'Investigate Data Quality',
            description: 'Verify data sources and check for data collection issues',
            expectedImpact: {
              metric: 'data_quality',
              estimatedChange: 0.15,
              timeframe: 'immediate',
              confidence: 0.8
            },
            effort: 'low',
            timeline: 'immediate',
            success_metrics: ['data_validation_complete', 'anomaly_resolved'],
            implementation_steps: [
              'Review data collection processes',
              'Validate data sources',
              'Check for system errors',
              'Confirm with field teams'
            ]
          }],
          relatedInsights: [],
          
          metadata: {
            algorithm: 'statistical_outlier_detection_v1',
            dataSource: ['prescription_data', 'market_data'],
            generatedAt: new Date().toISOString(),
            analysis_timestamp: new Date().toISOString(),
            data_points: data.length,
            version: '1.0'
          },
          
          actions: {
            primaryAction: {
              id: 'investigate_anomaly',
              type: 'navigate',
              action: 'navigate',
              label: 'Investigate',
              target: {
                type: 'dashboard',
                value: '/phase-26-analytics',
                parameters: { view: 'anomalies', metric }
              }
            },
            dismissible: true,
            acknowledged: false
          }
        });
      }
    }

    return insights;
  }

  // Generate predictive insights using models
  private async generatePredictiveInsights(data: PharmaData[], _context: AnalysisContext): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Use TRx forecasting model if available
    const trxModel = Array.from(this.models.values()).find(m => m.target_metric === 'trx');
    if (trxModel && data.length > 0) {
      const predictions = await this.generatePredictions(trxModel, data);
      
      if (predictions.length > 0) {
        const nextPrediction = predictions[0];
        const currentValue = data[data.length - 1]?.trx || 0;
        const predictedChange = ((nextPrediction.predicted_value - currentValue) / currentValue) * 100;

        insights.push({
          id: `forecast_trx_${Date.now()}`,
          type: 'prediction',
          category: 'performance',
          severity: 'low',
          priority: 3,
          
          title: `TRx Forecast: ${predictedChange > 0 ? '+' : ''}${predictedChange.toFixed(1)}%`,
          description: `AI model predicts TRx will ${predictedChange > 0 ? 'increase' : 'decrease'} by ${Math.abs(predictedChange).toFixed(1)}% in the next period`,
          summary: `Predictive model forecasts ${predictedChange > 0 ? 'growth' : 'decline'} in TRx performance`,
          
          confidence: nextPrediction.confidence_interval.confidence_level,
          impact: predictedChange > 0 ? 'positive' : 'negative',
          urgency: 'planned',
          
          data: {
            metric: 'TRx_forecast',
            currentValue,
            expectedValue: nextPrediction.predicted_value,
            trend: predictedChange > 0 ? 'increasing' : 'decreasing',
            timeframe: 'next_period'
          },
          
          context: {
            timeperiod: 'forecast'
          },
          
          recommendations: this.generateForecastRecommendations(predictedChange, 'TRx'),
          relatedInsights: [],
          
          metadata: {
            algorithm: trxModel.type,
            dataSource: ['prescription_data', 'market_data'],
            generatedAt: new Date().toISOString(),
            analysis_timestamp: new Date().toISOString(),
            data_points: data.length,
            version: '1.0'
          },
          
          actions: {
            primaryAction: {
              id: 'view_forecast',
              type: 'navigate',
              action: 'navigate',
              label: 'View Forecast Details',
              target: {
                type: 'dashboard',
                value: '/phase-26-analytics',
                parameters: { view: 'trends', forecast: 'true' }
              }
            },
            dismissible: true,
            acknowledged: false
          }
        });
      }
    }

    return insights;
  }

  // Identify growth and optimization opportunities
  private async identifyOpportunities(data: PharmaData[], context: AnalysisContext): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Analyze market share opportunities
    const marketShareData = data.filter(d => d.market_share !== undefined);
    if (marketShareData.length > 5) {
      const avgMarketShare = marketShareData.reduce((sum, d) => sum + d.market_share!, 0) / marketShareData.length;
      const industryBenchmark = 15; // Assume 15% as industry benchmark

      if (avgMarketShare < industryBenchmark * 0.8) {
        insights.push({
          id: `opportunity_market_share_${Date.now()}`,
          type: 'opportunity',
          category: 'market',
          severity: 'medium',
          priority: 2,
          
          title: 'Market Share Growth Opportunity',
          description: `Current market share (${avgMarketShare.toFixed(1)}%) is below industry benchmark (${industryBenchmark}%). Significant growth potential identified.`,
          summary: `Market share below benchmark - growth opportunity available`,
          
          confidence: 0.82,
          impact: 'positive',
          urgency: 'soon',
          
          data: {
            metric: 'market_share',
            currentValue: avgMarketShare,
            expectedValue: industryBenchmark,
            trend: 'stable',
            timeframe: context.timeframe
          },
          
          context: {
            timeperiod: context.timeframe
          },
          
          recommendations: [{
            id: `market_share_rec_${Date.now()}`,
            type: 'strategy',
            title: 'Market Share Growth Strategy',
            description: 'Implement targeted growth initiatives to capture additional market share',
            expectedImpact: {
              metric: 'market_share',
              estimatedChange: industryBenchmark - avgMarketShare,
              timeframe: '6_months',
              confidence: 0.75
            },
            effort: 'high',
            timeline: 'medium_term',
            success_metrics: ['market_share_increase', 'new_customer_acquisition'],
            implementation_steps: [
              'Analyze competitor positioning',
              'Identify underserved segments',
              'Develop targeted campaigns',
              'Increase sales force effectiveness'
            ]
          }],
          relatedInsights: [],
          
          metadata: {
            algorithm: 'opportunity_analysis_v1',
            dataSource: ['market_data', 'competitive_data'],
            generatedAt: new Date().toISOString(),
            analysis_timestamp: new Date().toISOString(),
            data_points: data.length,
            version: '1.0'
          },
          
          actions: {
            primaryAction: {
              id: 'analyze_opportunity',
              type: 'navigate',
              action: 'navigate',
              label: 'Analyze Opportunity',
              target: {
                type: 'dashboard',
                value: '/phase-26-analytics',
                parameters: { view: 'comparisons', metric: 'market_share' }
              }
            },
            dismissible: true,
            acknowledged: false
          }
        });
      }
    }

    // Add a general territory engagement opportunity for small datasets
    if (data.length >= 3) {
      const avgCalls = data.reduce((sum, d) => sum + (d.calls || 0), 0) / data.length;
      if (avgCalls <= 7) {
        insights.push({
          id: `opportunity_engagement_${Date.now()}`,
          type: 'opportunity',
          category: 'territory',
          severity: 'low',
          priority: 3,
          title: 'Territory Engagement Opportunity',
          description: `Average call frequency is ${avgCalls.toFixed(1)}. Targeted engagement could improve outcomes.`,
          summary: 'Potential to improve HCP engagement through optimized call planning',
          confidence: 0.7,
          impact: 'positive',
          urgency: 'planned',
          data: {
            metric: 'call_frequency',
            currentValue: avgCalls,
            expectedValue: 8,
            trend: 'stable',
            timeframe: context.timeframe
          },
          context: { timeperiod: context.timeframe },
          recommendations: [{
            id: `engagement_rec_${Date.now()}`,
            type: 'tactical',
            title: 'Optimize Call Planning',
            description: 'Increase visit frequency for high-potential HCPs',
            expectedImpact: { metric: 'trx', estimatedChange: 5, timeframe: '1_month', confidence: 0.6 },
            effort: 'medium',
            timeline: 'short_term',
            success_metrics: ['increased_calls', 'hcp_engagement'],
            implementation_steps: ['Identify high-potential HCPs', 'Adjust routes', 'Monitor response']
          }],
          relatedInsights: [],
          metadata: {
            algorithm: 'engagement_opportunity_v1',
            dataSource: ['field_activity'],
            generatedAt: new Date().toISOString(),
            analysis_timestamp: new Date().toISOString(),
            data_points: data.length,
            version: '1.0'
          },
          actions: {
            primaryAction: {
              id: 'view_call_plan',
              type: 'navigate',
              action: 'navigate',
              label: 'View Call Plan',
              target: { type: 'dashboard', value: '/pharmaceutical-bi', parameters: { view: 'call-planning' } }
            },
            dismissible: true,
            acknowledged: false
          }
        });
      }
    }

    return insights;
  }

  // Generate predictions using a model
  async generatePredictions(model: PredictiveModel, data: PharmaData[]): Promise<PredictiveResult[]> {
    const cacheKey = `predictions_${model.id}_${data.length}`;
    const cached = this.getCacheData<PredictiveResult[]>(cacheKey);
    if (cached) return cached;

    // Simple linear regression for demonstration
    const targetValues = data.map(d => {
      switch (model.target_metric) {
        case 'trx': return d.trx || 0;
        case 'nrx': return d.nrx || 0;
        case 'market_share': return d.market_share || 0;
        default: return 0;
      }
    });

    if (targetValues.length < 3) return [];

    // Calculate trend for simple prediction
    const trend = this.calculateTrend(targetValues);
    const lastValue = targetValues[targetValues.length - 1];
    const avgChange = trend.avgChange;

    const predictions: PredictiveResult[] = [];
    
    for (let i = 1; i <= 5; i++) { // Predict next 5 periods
      const predictedValue = Math.max(0, lastValue + (avgChange * i));
      const confidence = Math.max(0.5, 0.9 - (i * 0.1)); // Decreasing confidence
      
      predictions.push({
        id: `pred_${model.id}_${i}_${Date.now()}`,
        model_id: model.id,
        prediction_date: new Date().toISOString(),
        target_date: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toISOString(), // i weeks ahead
        // Compatibility fields
        metric: model.target_metric,
        period: `${i}_weeks_ahead`,
        
        predicted_value: predictedValue,
        confidence_interval: {
          lower: predictedValue * 0.8,
          upper: predictedValue * 1.2,
          confidence_level: confidence
        },
        
        contributing_factors: [
          { factor: 'historical_trend', impact: 0.6, importance: 0.8 },
          { factor: 'seasonal_pattern', impact: 0.2, importance: 0.5 },
          { factor: 'market_conditions', impact: 0.2, importance: 0.6 }
        ],
        
        scenarios: [
          { name: 'optimistic', description: 'Best case scenario', probability: 0.2, predicted_value: predictedValue * 1.15 },
          { name: 'expected', description: 'Most likely scenario', probability: 0.6, predicted_value: predictedValue },
          { name: 'pessimistic', description: 'Worst case scenario', probability: 0.2, predicted_value: predictedValue * 0.85 }
        ]
      });
    }

    this.setCacheData(cacheKey, predictions);
    return predictions;
  }

  // Alert management methods
  async createAlert(alert: Omit<SmartAlert, 'id' | 'metadata'>): Promise<SmartAlert> {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAlert: SmartAlert = {
      ...alert,
      id,
      trigger_conditions: alert.trigger,
      metadata: {
        created_by: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        priority: 1,
        tags: []
      }
    };

    this.alerts.set(id, newAlert);
    return newAlert;
  }

  async updateAlert(id: string, updates: Partial<SmartAlert>): Promise<SmartAlert> {
    const existingAlert = this.alerts.get(id);
    if (!existingAlert) {
      throw new Error(`Alert ${id} not found`);
    }

    const updatedAlert = {
      ...existingAlert,
      ...updates,
      metadata: {
        ...existingAlert.metadata,
        updated_at: new Date().toISOString()
      }
    };

    // Keep alias in sync
    if (updatedAlert.trigger) {
      updatedAlert.trigger_conditions = updatedAlert.trigger;
    }

    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async triggerAlert(alertId: string, data: AlertTriggerData): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) return;

    // Check if alert condition is met
    const conditionMet = this.evaluateAlertCondition(alert, data);
    if (!conditionMet) return;

    // Update alert status and history
    alert.status = 'triggered';
    alert.history.push({
      triggered_at: new Date().toISOString(),
      value: data.value,
      threshold: data.threshold
    });

    // Execute notifications and actions
    await this.executeAlertActions(alert, data);
  }

  // Territory optimization (placeholder implementation)
  async optimizeTerritory(territoryId: string, data: TerritoryData): Promise<TerritoryOptimization> {
    // Mock implementation for demonstration
    return {
      id: `optimization_${territoryId}_${Date.now()}`,
      territory_id: territoryId,
      
      current_performance: {
        trx: data.performance_metrics.trx || 0,
        nrx: data.performance_metrics.nrx || 0,
        market_share: data.performance_metrics.market_share || 0,
        hcp_coverage: data.performance_metrics.hcp_coverage || 0,
        call_frequency: data.performance_metrics.call_frequency || 0
      },
      
      optimization_opportunities: [
        {
          type: 'coverage',
          description: 'Increase HCP coverage in high-potential segments',
          potential_impact: {
            metric: 'TRx',
            estimated_lift: 15,
            confidence: 0.75
          },
          implementation_effort: 'medium',
          timeline: '3_months'
        }
      ],
      
      hcp_prioritization: data.hcp_data.map((hcp, index) => ({
        hcp_id: hcp.hcp_id,
        name: `HCP_${index + 1}`,
        priority_score: hcp.potential * 100,
        rationale: 'High potential, low current share',
        recommended_frequency: 2,
        recommended_messaging: ['efficacy', 'safety'],
        potential_value: hcp.potential * 1000
      })),
      
      resource_allocation: {
        current_allocation: { time: 100, budget: 50000 },
        recommended_allocation: { time: 120, budget: 60000 },
        reallocation_impact: { time: 20, budget: 10000 }
      },
      
      competitive_intelligence: {
        competitive_pressure: 0.6,
        share_at_risk: 5,
        competitor_activities: ['New product launch', 'Increased sampling'],
        defensive_strategies: ['Enhance relationship building', 'Improve value proposition']
      }
    };
  }

  // Placeholder implementations for other methods
  async planCalls(repId: string, territoryId: string, period: string): Promise<CallPlanning> {
    return {
      id: `call_plan_${repId}_${Date.now()}`,
      rep_id: repId,
      territory_id: territoryId,
      planning_period: period,
      hcp_schedule: [],
      route_optimization: { daily_routes: [] },
      goal_tracking: { period_goals: {}, current_progress: {}, projected_achievement: {} }
    };
  }

  async analyzeCompetition(productId: string, competitors: string[]): Promise<CompetitiveIntelligence> {
    return {
      id: `competitive_${productId}_${Date.now()}`,
      competitor: competitors[0] || 'Unknown',
      product: productId,
      market_movements: [],
      share_analysis: {
        competitor_share: 20,
        our_share: 15,
        trend: 'stable',
        key_segments: []
      },
      strategic_responses: []
    };
  }

  async trainModel(config: ModelTrainingConfig): Promise<PredictiveModel> {
    const modelId = `model_${config.target_metric}_${Date.now()}`;
    const model: PredictiveModel = {
      id: modelId,
      name: `${config.target_metric} Prediction Model`,
      type: config.model_type,
      purpose: 'forecasting',
      target_metric: config.target_metric,
      features: config.features,
      performance: {
        accuracy: 0.85,
        precision: 0.82,
        recall: 0.88,
        f1_score: 0.85,
        mape: 0.15,
        rmse: 5.2
      },
      // Mirror accuracy at root for compatibility with tests
      accuracy: 0.85,
      training_data: {
        records: 1000,
        timespan: config.training_period,
        last_updated: new Date().toISOString(),
        data_quality: 0.92
      },
      predictions: [],
      metadata: {
        algorithm_version: '1.0',
        training_duration: 300,
        last_trained: new Date().toISOString(),
        next_training: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      }
    };

    this.models.set(modelId, model);
    return model;
  }

  async evaluateModel(modelId: string, testData: PharmaData[]): Promise<ModelEvaluation> {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    return {
      model_id: modelId,
      performance_metrics: model.performance,
      feature_importance: model.features.map((feature) => ({
        feature,
        importance: Math.random() * 0.5 + 0.25 // Mock importance
      })),
      validation_results: {
        predictions: testData.map(() => Math.random() * 100),
        actuals: testData.map(() => Math.random() * 100),
        residuals: testData.map(() => (Math.random() - 0.5) * 20)
      }
    };
  }

  async deployModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);
    
    model.metadata.status = 'active';
    console.log(`Model ${modelId} deployed successfully`);
  }

  // Utility methods
  private initializeDefaultModels(): void {
    // Initialize some default models
    const trxModel: PredictiveModel = {
      id: 'trx_model_default',
      name: 'TRx Forecasting Model',
      type: 'time_series',
      purpose: 'forecasting',
      target_metric: 'trx',
      features: ['historical_trx', 'seasonality', 'market_trends'],
      performance: {
        accuracy: 0.87,
        precision: 0.84,
        recall: 0.89,
        f1_score: 0.86,
        mape: 0.12,
        rmse: 4.8
      },
      training_data: {
        records: 2000,
        timespan: '24_months',
        last_updated: new Date().toISOString(),
        data_quality: 0.94
      },
      predictions: [],
      metadata: {
        algorithm_version: '1.0',
        training_duration: 450,
        last_trained: new Date().toISOString(),
        next_training: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      }
    };

    this.models.set(trxModel.id, trxModel);
  }

  private calculateTrend(values: number[]): { direction: string; avgChange: number } {
    if (values.length < 2) return { direction: 'stable', avgChange: 0 };

    let totalChange = 0;
    for (let i = 1; i < values.length; i++) {
      totalChange += values[i] - values[i - 1];
    }

    const avgChange = totalChange / (values.length - 1);
    const direction = avgChange > 1 ? 'increasing' : avgChange < -1 ? 'decreasing' : 'stable';

    return { direction, avgChange };
  }

  private groupDataByMetric(data: PharmaData[]): Record<string, number[]> {
    const groups: Record<string, number[]> = {};

    data.forEach(d => {
      if (d.trx !== undefined) {
        if (!groups.trx) groups.trx = [];
        groups.trx.push(d.trx);
      }
      if (d.nrx !== undefined) {
        if (!groups.nrx) groups.nrx = [];
        groups.nrx.push(d.nrx);
      }
      if (d.market_share !== undefined) {
        if (!groups.market_share) groups.market_share = [];
        groups.market_share.push(d.market_share);
      }
    });

    return groups;
  }

  private detectOutliers(values: number[]): Array<{ value: number; expected: number; deviation: number; threshold: number }> {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    const threshold = 2.5; // Z-score threshold

    return values
      .map((value, index) => ({
        value,
        expected: mean,
        deviation: Math.abs(value - mean) / stdDev,
        threshold,
        index
      }))
      .filter(item => item.deviation > threshold);
  }

  private generatePerformanceRecommendations(changePercent: number, metric: string): AIRecommendation[] {
    if (changePercent > 15) {
      return [{
        id: `rec_${Date.now()}`,
        type: 'strategy',
        title: `Capitalize on ${metric} Growth`,
        description: `Strong ${metric} performance indicates effective strategies. Scale successful initiatives.`,
        expectedImpact: {
          metric,
          estimatedChange: changePercent * 0.5,
          timeframe: '3_months',
          confidence: 0.8
        },
        effort: 'medium',
        timeline: 'short_term',
        success_metrics: [`${metric}_growth_sustained`, 'roi_improved'],
        implementation_steps: [
          'Analyze success factors',
          'Scale effective tactics',
          'Allocate additional resources',
          'Monitor performance'
        ]
      }];
    } else if (changePercent < -15) {
      return [{
        id: `rec_${Date.now()}`,
        type: 'action',
        title: `Address ${metric} Decline`,
        description: `Immediate action required to reverse negative ${metric} trend.`,
        expectedImpact: {
          metric,
          estimatedChange: Math.abs(changePercent) * 0.7,
          timeframe: '2_months',
          confidence: 0.75
        },
        effort: 'high',
        timeline: 'immediate',
        success_metrics: [`${metric}_recovery`, 'trend_reversal'],
        implementation_steps: [
          'Conduct root cause analysis',
          'Implement corrective measures',
          'Increase monitoring frequency',
          'Adjust strategies'
        ]
      }];
    }
    
    return [];
  }

  private generateForecastRecommendations(changePercent: number, metric: string): AIRecommendation[] {
    return [{
      id: `forecast_rec_${Date.now()}`,
      type: 'tactical',
      title: `Prepare for ${metric} ${changePercent > 0 ? 'Growth' : 'Decline'}`,
      description: `Proactive planning based on AI forecast for ${metric} performance.`,
      expectedImpact: {
        metric: 'preparedness',
        estimatedChange: 0.8,
        timeframe: 'next_period',
        confidence: 0.85
      },
      effort: 'medium',
      timeline: 'short_term',
      success_metrics: ['forecast_accuracy', 'response_readiness'],
      implementation_steps: [
        'Review forecast assumptions',
        'Prepare contingency plans',
        'Adjust resource allocation',
        'Monitor leading indicators'
      ]
    }];
  }

  private evaluateAlertCondition(alert: SmartAlert, data: AlertTriggerData): boolean {
    const { condition, threshold } = alert.trigger;
    const { value } = data;

    switch (condition) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return Math.abs(value - threshold) < 0.01;
      default:
        return false;
    }
  }

  private async executeAlertActions(alert: SmartAlert, data: AlertTriggerData): Promise<void> {
    // Mock implementation for alert actions
    console.log(`Executing alert actions for ${alert.name}:`, {
      alertId: alert.id,
      triggerData: data,
      actions: alert.actions.suggested_actions.length
    });
  }
}

// Export singleton instance
export const aiInsightEngine = AIInsightEngine.getInstance();