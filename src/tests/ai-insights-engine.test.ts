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
        insight.category === 'performance'
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
      const modelConfig: import('@/lib/types/ai-insights').ModelTrainingConfig = {
        model_type: 'time_series',
        target_metric: 'trx',
        features: ['calls', 'samples', 'market_share'],
        training_period: '90_days',
        validation_split: 0.2
      };

      const model = await aiInsightEngine.trainModel(modelConfig);
      
      expect(model).toBeDefined();
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('name');
      expect(model).toHaveProperty('type');
      expect(model).toHaveProperty('accuracy');
  expect(model).toHaveProperty('metadata');
  expect(model.metadata.status).toBeDefined();
    });

    test('should generate predictions from trained model', async () => {
      // First train a model
      const modelConfig: import('@/lib/types/ai-insights').ModelTrainingConfig = {
        model_type: 'linear_regression',
        target_metric: 'trx',
        features: ['calls', 'samples'],
        training_period: '90_days',
        validation_split: 0.2
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
        id: 'tmp',
        name: 'TRx Decline Alert',
        description: 'Alert when TRx drops significantly',
        trigger: {
          metric: 'trx',
          condition: 'percentage_change' as import('@/lib/types/ai-insights').SmartAlert['trigger']['condition'],
          threshold: 15,
          timeframe: '24_hours'
        },
        filters: {},
        notification: {
          channels: ['email', 'dashboard'] as ('dashboard' | 'email' | 'sms' | 'slack' | 'webhook')[],
          recipients: [],
          template: 'default',
          frequency: 'immediate' as import('@/lib/types/ai-insights').SmartAlert['notification']['frequency']
        },
        actions: { suggested_actions: [] },
        status: 'active' as import('@/lib/types/ai-insights').SmartAlert['status'],
        history: [],
        metadata: { created_by: 'test', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), priority: 1, tags: [] }
      };

  const { id: _tmp, metadata: _md, ...createInput } = alertConfig;
  const alert = await aiInsightEngine.createAlert(createInput);
      
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
        id: 'tmp2',
        name: 'Test Alert',
        description: 'Test alert for updating',
        trigger: {
          metric: 'nrx',
          condition: 'percentage_change' as import('@/lib/types/ai-insights').SmartAlert['trigger']['condition'],
          threshold: 10,
          timeframe: '24_hours'
        },
        filters: {},
  notification: { channels: ['email'] as ('dashboard' | 'email' | 'sms' | 'slack' | 'webhook')[], recipients: [], template: 'default', frequency: 'immediate' as import('@/lib/types/ai-insights').SmartAlert['notification']['frequency'] },
        actions: { suggested_actions: [] },
        status: 'active' as import('@/lib/types/ai-insights').SmartAlert['status'],
        history: [],
        metadata: { created_by: 'test', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), priority: 1, tags: [] }
      };

  const { id: _tmp2, metadata: _md2, ...createInput2 } = alertConfig;
  const createdAlert = await aiInsightEngine.createAlert(createInput2);
      
      // Update the alert
      const updates: Partial<import('@/lib/types/ai-insights').SmartAlert> = {
        status: 'triggered',
        trigger: { metric: 'nrx', condition: 'percentage_change', threshold: 20, timeframe: '24_hours' }
      };

      const updatedAlert = await aiInsightEngine.updateAlert(createdAlert.id, updates);
      
  expect(updatedAlert.status).toBe('triggered');
  expect(updatedAlert.trigger.threshold).toBe(20);
    });
  });

  describe('Territory Optimization', () => {
    test('should optimize territory performance', async () => {
      const territoryData = {
        territory_id: 'North',
        performance_metrics: { trx: 18500, nrx: 3500, market_share: 18, hcp_coverage: 0.7, call_frequency: 6 },
        hcp_data: [],
        competitive_data: {}
      };

      const optimization = await aiInsightEngine.optimizeTerritory('North', territoryData);
      
  expect(optimization).toBeDefined();
  expect(optimization).toHaveProperty('territory_id');
  expect(optimization).toHaveProperty('current_performance');
  expect(optimization).toHaveProperty('optimization_opportunities');
  expect(optimization).toHaveProperty('resource_allocation');
      
  expect(optimization.optimization_opportunities.length).toBeGreaterThan(0);
      
  const firstRecommendation = optimization.optimization_opportunities[0];
  expect(firstRecommendation).toHaveProperty('type');
  expect(firstRecommendation).toHaveProperty('description');
  expect(firstRecommendation).toHaveProperty('potential_impact');
    });

    test('should provide call planning recommendations', async () => {
      const callPlan = await aiInsightEngine.planCalls('rep_123', 'North', '30_days');
      
  expect(callPlan).toBeDefined();
  expect(callPlan).toHaveProperty('rep_id');
  expect(callPlan).toHaveProperty('territory_id');
  expect(callPlan).toHaveProperty('planning_period');
  expect(callPlan).toHaveProperty('hcp_schedule');
  expect(callPlan).toHaveProperty('route_optimization');
    });
  });

  describe('Competitive Intelligence', () => {
    test('should analyze competitive landscape', async () => {
      const competitors = ['Competitor-A', 'Competitor-B', 'Competitor-C'];
      const competitiveAnalysis = await aiInsightEngine.analyzeCompetition('Product-A', competitors);
      
  expect(competitiveAnalysis).toBeDefined();
  expect(competitiveAnalysis).toHaveProperty('product');
  expect(competitiveAnalysis).toHaveProperty('share_analysis');
  expect(competitiveAnalysis).toHaveProperty('market_movements');
  expect(competitiveAnalysis).toHaveProperty('strategic_responses');
    });
  });

  describe('Model Management', () => {
    test('should evaluate model performance', async () => {
      // First create a model
      const modelConfig: import('@/lib/types/ai-insights').ModelTrainingConfig = {
        model_type: 'neural_network',
        target_metric: 'nrx',
        features: ['calls', 'samples', 'market_share'],
        training_period: '180_days',
        validation_split: 0.2
      };

      const model = await aiInsightEngine.trainModel(modelConfig);
      
      // Evaluate the model
      const evaluation = await aiInsightEngine.evaluateModel(model.id, mockPharmaData);
      
      expect(evaluation).toBeDefined();
      expect(evaluation).toHaveProperty('model_id');
  expect(evaluation).toHaveProperty('performance_metrics');
  expect(evaluation).toHaveProperty('feature_importance');
  expect(evaluation).toHaveProperty('validation_results');
      
  expect(evaluation.performance_metrics.accuracy).toBeGreaterThan(0);
  expect(evaluation.performance_metrics.accuracy).toBeLessThanOrEqual(1);
    });

    test('should deploy trained models', async () => {
      // Create and train a model
      const modelConfig: import('@/lib/types/ai-insights').ModelTrainingConfig = {
        model_type: 'time_series',
        target_metric: 'trx',
        features: ['calls', 'samples'],
        training_period: '90_days',
        validation_split: 0.2
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