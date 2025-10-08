// src/tests/ai-insights-engine.test.ts
// Comprehensive Test Suite for Phase 2.7 AI Capabilities
// Tests AI insights generation, predictive analytics, and smart alerts

import { aiInsightEngine } from '@/lib/ai/ai-insights-engine';
import { PharmaData, AnalysisContext } from '@/lib/types/ai-insights';

describe('AI Insights Engine - Phase 2.7 Testing', () => {
  const mockPharmaData: PharmaData[] = [
    {
      date: '2024-10-01',
      territory: 'North',
      product: 'Product-A',
      trx: 1200,
      nrx: 240,
      market_share: 18.5,
      calls: 8,
      samples: 45
    },
    {
      date: '2024-10-02',
      territory: 'North',
      product: 'Product-A',
      trx: 950, // Significant drop
      nrx: 190,
      market_share: 17.2,
      calls: 6,
      samples: 38
    },
    {
      date: '2024-10-03',
      territory: 'North',
      product: 'Product-A',
      trx: 1050,
      nrx: 210,
      market_share: 17.8,
      calls: 7,
      samples: 42
    }
  ];

  const mockContext: AnalysisContext = {
    timeframe: '7_days',
    filters: {
      territories: ['North'],
      products: ['Product-A']
    },
    user_id: 'test_user_123',
    organization_id: 'test_org_456'
  };

  describe('Insight Generation', () => {
    test('should generate insights from pharmaceutical data', async () => {
      const insights = await aiInsightEngine.generateInsights(mockPharmaData, mockContext);
      
      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
      
      // Verify insight structure
      const firstInsight = insights[0];
      expect(firstInsight).toHaveProperty('id');
      expect(firstInsight).toHaveProperty('title');
      expect(firstInsight).toHaveProperty('description');
      expect(firstInsight).toHaveProperty('category');
      expect(firstInsight).toHaveProperty('severity');
      expect(firstInsight).toHaveProperty('confidence');
      expect(firstInsight).toHaveProperty('recommendations');
    });

    test('should detect performance issues in TRx data', async () => {
      const insights = await aiInsightEngine.generateInsights(mockPharmaData, mockContext);
      
      // Should detect the TRx drop from 1200 to 950
      const criticalInsights = insights.filter(insight => 
        insight.severity === 'high' || insight.severity === 'critical'
      );
      
      expect(criticalInsights.length).toBeGreaterThan(0);
      
      // Should have at least one insight related to performance
      const performanceInsights = insights.filter(insight => 
        insight.category === 'performance' || insight.category === 'anomaly'
      );
      
      expect(performanceInsights.length).toBeGreaterThan(0);
    });

    test('should generate actionable recommendations', async () => {
      const insights = await aiInsightEngine.generateInsights(mockPharmaData, mockContext);
      
      const insightsWithRecommendations = insights.filter(insight => 
        insight.recommendations.length > 0
      );
      
      expect(insightsWithRecommendations.length).toBeGreaterThan(0);
      
      const firstRecommendation = insightsWithRecommendations[0].recommendations[0];
      expect(firstRecommendation).toHaveProperty('title');
      expect(firstRecommendation).toHaveProperty('description');
      expect(firstRecommendation).toHaveProperty('expectedImpact');
    });

    test('should handle empty data gracefully', async () => {
      const insights = await aiInsightEngine.generateInsights([], mockContext);
      
      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
      // Should return empty array or basic insights for empty data
    });

    test('should include contextual metadata', async () => {
      const insights = await aiInsightEngine.generateInsights(mockPharmaData, mockContext);
      
      expect(insights.length).toBeGreaterThan(0);
      
      const firstInsight = insights[0];
      expect(firstInsight).toHaveProperty('metadata');
      expect(firstInsight.metadata).toHaveProperty('analysis_timestamp');
      expect(firstInsight.metadata).toHaveProperty('data_points');
    });
  });

  describe('Predictive Analytics', () => {
    test('should create and train predictive models', async () => {
      const modelConfig = {
        name: 'TRx Forecast Model',
        type: 'time_series' as const,
        target_metric: 'trx',
        features: ['calls', 'samples', 'market_share'],
        training_period: '90_days',
        forecast_horizon: '30_days',
        organization_id: mockContext.organization_id
      };

      const model = await aiInsightEngine.trainModel(modelConfig);
      
      expect(model).toBeDefined();
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('name');
      expect(model).toHaveProperty('type');
      expect(model).toHaveProperty('accuracy');
      expect(model).toHaveProperty('status');
      expect(model.status).toBe('trained');
    });

    test('should generate predictions from trained model', async () => {
      // First train a model
      const modelConfig = {
        name: 'Test Prediction Model',
        type: 'regression' as const,
        target_metric: 'trx',
        features: ['calls', 'samples'],
        training_period: '90_days',
        forecast_horizon: '7_days',
        organization_id: mockContext.organization_id
      };

      const model = await aiInsightEngine.trainModel(modelConfig);
      
      // Generate predictions
      const predictions = await aiInsightEngine.generatePredictions(model, mockPharmaData);
      
      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
      expect(predictions.length).toBeGreaterThan(0);
      
      const firstPrediction = predictions[0];
      expect(firstPrediction).toHaveProperty('metric');
      expect(firstPrediction).toHaveProperty('predicted_value');
      expect(firstPrediction).toHaveProperty('confidence_interval');
      expect(firstPrediction).toHaveProperty('period');
    });
  });

  describe('Smart Alerts System', () => {
    test('should create smart alerts', async () => {
      const alertConfig = {
        name: 'TRx Decline Alert',
        description: 'Alert when TRx drops significantly',
        trigger_conditions: {
          metric: 'trx',
          operator: 'decreases_by',
          threshold: 15,
          period: '24_hours'
        },
        notification_channels: ['email', 'dashboard'],
        severity: 'high' as const,
        organization_id: mockContext.organization_id
      };

      const alert = await aiInsightEngine.createAlert(alertConfig);
      
      expect(alert).toBeDefined();
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('name');
      expect(alert).toHaveProperty('status');
      expect(alert).toHaveProperty('trigger_conditions');
      expect(alert.status).toBe('active');
    });

    test('should update existing alerts', async () => {
      // Create alert first
      const alertConfig = {
        name: 'Test Alert',
        description: 'Test alert for updating',
        trigger_conditions: {
          metric: 'nrx',
          operator: 'decreases_by',
          threshold: 10,
          period: '24_hours'
        },
        notification_channels: ['email'],
        severity: 'medium' as const,
        organization_id: mockContext.organization_id
      };

      const createdAlert = await aiInsightEngine.createAlert(alertConfig);
      
      // Update the alert
      const updates = {
        severity: 'high' as const,
        trigger_conditions: {
          metric: 'nrx',
          operator: 'decreases_by',
          threshold: 20,
          period: '24_hours'
        }
      };

      const updatedAlert = await aiInsightEngine.updateAlert(createdAlert.id, updates);
      
      expect(updatedAlert.severity).toBe('high');
      expect(updatedAlert.trigger_conditions.threshold).toBe(20);
    });
  });

  describe('Territory Optimization', () => {
    test('should optimize territory performance', async () => {
      const territoryData = {
        territory_id: 'North',
        hcp_count: 150,
        target_potential: 25000,
        current_performance: 18500,
        call_frequency: 6,
        coverage_rate: 0.85,
        competition_strength: 'high' as const,
        demographics: {
          urban_percentage: 65,
          specialty_clinics: 12,
          hospital_systems: 3
        }
      };

      const optimization = await aiInsightEngine.optimizeTerritory('North', territoryData);
      
      expect(optimization).toBeDefined();
      expect(optimization).toHaveProperty('territory_id');
      expect(optimization).toHaveProperty('current_score');
      expect(optimization).toHaveProperty('potential_score');
      expect(optimization).toHaveProperty('recommendations');
      expect(optimization).toHaveProperty('resource_allocation');
      
      expect(optimization.recommendations.length).toBeGreaterThan(0);
      
      const firstRecommendation = optimization.recommendations[0];
      expect(firstRecommendation).toHaveProperty('type');
      expect(firstRecommendation).toHaveProperty('description');
      expect(firstRecommendation).toHaveProperty('impact_score');
    });

    test('should provide call planning recommendations', async () => {
      const callPlan = await aiInsightEngine.planCalls('rep_123', 'North', '30_days');
      
      expect(callPlan).toBeDefined();
      expect(callPlan).toHaveProperty('rep_id');
      expect(callPlan).toHaveProperty('territory_id');
      expect(callPlan).toHaveProperty('period');
      expect(callPlan).toHaveProperty('recommended_calls');
      expect(callPlan).toHaveProperty('priority_hcps');
      expect(callPlan).toHaveProperty('optimal_frequency');
      
      expect(callPlan.recommended_calls.length).toBeGreaterThan(0);
      
      const firstCall = callPlan.recommended_calls[0];
      expect(firstCall).toHaveProperty('hcp_id');
      expect(firstCall).toHaveProperty('priority');
      expect(firstCall).toHaveProperty('recommended_date');
      expect(firstCall).toHaveProperty('call_objective');
    });
  });

  describe('Competitive Intelligence', () => {
    test('should analyze competitive landscape', async () => {
      const competitors = ['Competitor-A', 'Competitor-B', 'Competitor-C'];
      const competitiveAnalysis = await aiInsightEngine.analyzeCompetition('Product-A', competitors);
      
      expect(competitiveAnalysis).toBeDefined();
      expect(competitiveAnalysis).toHaveProperty('product_id');
      expect(competitiveAnalysis).toHaveProperty('market_position');
      expect(competitiveAnalysis).toHaveProperty('competitor_analysis');
      expect(competitiveAnalysis).toHaveProperty('threats');
      expect(competitiveAnalysis).toHaveProperty('opportunities');
      expect(competitiveAnalysis).toHaveProperty('recommendations');
      
      expect(competitiveAnalysis.competitor_analysis.length).toBeGreaterThan(0);
      
      const firstCompetitor = competitiveAnalysis.competitor_analysis[0];
      expect(firstCompetitor).toHaveProperty('competitor_id');
      expect(firstCompetitor).toHaveProperty('market_share');
      expect(firstCompetitor).toHaveProperty('strengths');
      expect(firstCompetitor).toHaveProperty('weaknesses');
    });
  });

  describe('Model Management', () => {
    test('should evaluate model performance', async () => {
      // First create a model
      const modelConfig = {
        name: 'Evaluation Test Model',
        type: 'classification' as const,
        target_metric: 'nrx',
        features: ['calls', 'samples', 'market_share'],
        training_period: '180_days',
        forecast_horizon: '14_days',
        organization_id: mockContext.organization_id
      };

      const model = await aiInsightEngine.trainModel(modelConfig);
      
      // Evaluate the model
      const evaluation = await aiInsightEngine.evaluateModel(model.id, mockPharmaData);
      
      expect(evaluation).toBeDefined();
      expect(evaluation).toHaveProperty('model_id');
      expect(evaluation).toHaveProperty('accuracy');
      expect(evaluation).toHaveProperty('precision');
      expect(evaluation).toHaveProperty('recall');
      expect(evaluation).toHaveProperty('f1_score');
      expect(evaluation).toHaveProperty('confusion_matrix');
      expect(evaluation).toHaveProperty('feature_importance');
      
      expect(evaluation.accuracy).toBeGreaterThan(0);
      expect(evaluation.accuracy).toBeLessThanOrEqual(1);
    });

    test('should deploy trained models', async () => {
      // Create and train a model
      const modelConfig = {
        name: 'Deployment Test Model',
        type: 'time_series' as const,
        target_metric: 'trx',
        features: ['calls', 'samples'],
        training_period: '90_days',
        forecast_horizon: '7_days',
        organization_id: mockContext.organization_id
      };

      const model = await aiInsightEngine.trainModel(modelConfig);
      
      // Deploy the model
      await expect(aiInsightEngine.deployModel(model.id)).resolves.not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should work with enhanced KPI widget integration', async () => {
      // Simulate the enhanced KPI widget scenario
      const insights = await aiInsightEngine.generateInsights(mockPharmaData, mockContext);
      
      // Filter insights relevant to TRx (like the KPI widget would)
      const trxInsights = insights.filter(insight => 
        insight.description.toLowerCase().includes('trx') ||
        insight.description.toLowerCase().includes('prescription') ||
        insight.category === 'performance'
      );
      
      expect(trxInsights.length).toBeGreaterThan(0);
      
      // Verify insights have actionable information for UI display
      const insightWithActions = trxInsights.find(insight => 
        insight.actions?.primaryAction
      );
      
      if (insightWithActions) {
        expect(insightWithActions.actions?.primaryAction).toHaveProperty('label');
        expect(insightWithActions.actions?.primaryAction).toHaveProperty('action');
      }
    });

    test('should provide comprehensive pharmaceutical intelligence', async () => {
      // Test the full AI pipeline
      const insights = await aiInsightEngine.generateInsights(mockPharmaData, mockContext);
      
      // Should cover multiple categories
      const categories = new Set(insights.map(insight => insight.category));
      expect(categories.size).toBeGreaterThan(1);
      
      // Should include performance analysis
      expect(categories.has('performance')).toBe(true);
      
      // Should have varying confidence levels
      const confidenceLevels = insights.map(insight => insight.confidence);
      const minConfidence = Math.min(...confidenceLevels);
      const maxConfidence = Math.max(...confidenceLevels);
      
      expect(minConfidence).toBeGreaterThan(0);
      expect(maxConfidence).toBeLessThanOrEqual(1);
      
      // Should have actionable recommendations
      const totalRecommendations = insights.reduce((sum, insight) => 
        sum + insight.recommendations.length, 0
      );
      
      expect(totalRecommendations).toBeGreaterThan(0);
    });
  });
});

// Performance benchmarks for large datasets
describe('AI Engine Performance Benchmarks', () => {
  const largePharmaDataset: PharmaData[] = [];
  
  // Generate large dataset for performance testing
  beforeAll(() => {
    for (let i = 0; i < 500; i++) {
      largePharmaDataset.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        territory: `Territory-${i % 10}`,
        product: `Product-${String.fromCharCode(65 + (i % 5))}`,
        trx: Math.floor(Math.random() * 1000) + 500,
        nrx: Math.floor(Math.random() * 200) + 100,
        market_share: Math.random() * 30 + 5,
        calls: Math.floor(Math.random() * 10) + 3,
        samples: Math.floor(Math.random() * 50) + 20
      });
    }
  });

  test('should handle large datasets efficiently', async () => {
    const start = Date.now();
    
    const insights = await aiInsightEngine.generateInsights(largePharmaDataset, {
      timeframe: '30_days',
      filters: {},
      user_id: 'benchmark_user',
      organization_id: 'benchmark_org'
    });
    
    const processingTime = Date.now() - start;
    
    expect(insights).toBeDefined();
    expect(insights.length).toBeGreaterThan(0);
    
    // Should process 500 records in reasonable time (under 3 seconds)
    expect(processingTime).toBeLessThan(3000);
    
    console.log(`✅ Processed ${largePharmaDataset.length} records in ${processingTime}ms`);
    console.log(`✅ Generated ${insights.length} insights`);
    console.log(`✅ Performance: ${(largePharmaDataset.length / processingTime * 1000).toFixed(2)} records/second`);
  }, 10000); // 10 second timeout for large dataset
});

export {};