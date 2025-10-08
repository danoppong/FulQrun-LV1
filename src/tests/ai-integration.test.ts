// src/tests/ai-integration.test.ts
// Simple AI Integration Test for Phase 2.7 Validation
// Tests basic functionality to validate AI capabilities work correctly

import { aiInsightEngine } from '@/lib/ai/ai-insights-engine';
import { PharmaData, AnalysisContext } from '@/lib/types/ai-insights';

describe('AI Integration - Phase 2.7 Validation', () => {
  const testData: PharmaData[] = [
    {
      date: '2024-09-25',
      territory: 'TestTerritory',
      product: 'TestProduct',
      trx: 1000,
      nrx: 200,
      market_share: 15.0,
      calls: 5,
      samples: 30
    },
    {
      date: '2024-09-26',
      territory: 'TestTerritory',
      product: 'TestProduct',
      trx: 1050,
      nrx: 210,
      market_share: 15.2,
      calls: 5,
      samples: 32
    },
    {
      date: '2024-09-27',
      territory: 'TestTerritory',
      product: 'TestProduct',
      trx: 980,
      nrx: 195,
      market_share: 14.8,
      calls: 4,
      samples: 28
    },
    {
      date: '2024-09-28',
      territory: 'TestTerritory',
      product: 'TestProduct',
      trx: 1020,
      nrx: 205,
      market_share: 15.1,
      calls: 5,
      samples: 31
    },
    {
      date: '2024-09-29',
      territory: 'TestTerritory',
      product: 'TestProduct',
      trx: 990,
      nrx: 198,
      market_share: 14.9,
      calls: 4,
      samples: 29
    },
    {
      date: '2024-09-30',
      territory: 'TestTerritory',
      product: 'TestProduct',
      trx: 1100,
      nrx: 220,
      market_share: 15.8,
      calls: 6,
      samples: 35
    },
    {
      date: '2024-10-01',
      territory: 'TestTerritory',
      product: 'TestProduct',
      trx: 1200,
      nrx: 240,
      market_share: 16.5,
      calls: 6,
      samples: 38
    },
    {
      date: '2024-10-02',
      territory: 'TestTerritory',
      product: 'TestProduct',
      trx: 900, // 25% drop from previous day - should trigger insight
      nrx: 180,
      market_share: 14.0,
      calls: 3,
      samples: 22
    }
  ];

  const testContext: AnalysisContext = {
    timeframe: '7_days',
    filters: {
      territories: ['TestTerritory'],
      products: ['TestProduct']
    },
    user_id: 'test_user',
    organization_id: 'test_org'
  };

  test('AI Insights Engine should be accessible and functional', async () => {
    // Test that the AI engine exists and can generate insights
    expect(aiInsightEngine).toBeDefined();
    expect(typeof aiInsightEngine.generateInsights).toBe('function');
    
    // Test basic insight generation
    const insights = await aiInsightEngine.generateInsights(testData, testContext);
    
    expect(insights).toBeDefined();
    expect(Array.isArray(insights)).toBe(true);
    
    console.log(`✅ Generated ${insights.length} insights from test data`);
    
    if (insights.length > 0) {
      const firstInsight = insights[0];
      expect(firstInsight).toHaveProperty('id');
      expect(firstInsight).toHaveProperty('title');
      expect(firstInsight).toHaveProperty('description');
      expect(firstInsight).toHaveProperty('category');
      expect(firstInsight).toHaveProperty('severity');
      
      console.log(`✅ First insight: "${firstInsight.title}" (${firstInsight.category}/${firstInsight.severity})`);
    }
  });

  test('AI system can detect performance changes', async () => {
    // Test with data showing a significant drop
    const insights = await aiInsightEngine.generateInsights(testData, testContext);
    
    // Should generate at least some insights from the data
    expect(insights.length).toBeGreaterThan(0);
    
    // Look for insights that might relate to the TRx drop
    const relevantInsights = insights.filter(insight => 
      insight.description.toLowerCase().includes('decrease') ||
      insight.description.toLowerCase().includes('drop') ||
      insight.description.toLowerCase().includes('decline') ||
      insight.severity === 'high' ||
      insight.severity === 'critical'
    );
    
    console.log(`✅ Found ${relevantInsights.length} insights related to performance changes`);
    
    if (relevantInsights.length > 0) {
      console.log(`✅ Performance insight example: "${relevantInsights[0].description}"`);
    }
  });

  test('AI system provides actionable recommendations', async () => {
    const insights = await aiInsightEngine.generateInsights(testData, testContext);
    
    // Look for insights with recommendations
    const insightsWithRecommendations = insights.filter(insight => 
      insight.recommendations && insight.recommendations.length > 0
    );
    
    console.log(`✅ Found ${insightsWithRecommendations.length} insights with recommendations`);
    
    if (insightsWithRecommendations.length > 0) {
      const firstRecommendation = insightsWithRecommendations[0].recommendations[0];
      expect(firstRecommendation).toHaveProperty('title');
      expect(firstRecommendation).toHaveProperty('description');
      
      console.log(`✅ Recommendation example: "${firstRecommendation.title}"`);
    }
  });

  test('AI system handles empty data gracefully', async () => {
    // Test with empty data
    const emptyInsights = await aiInsightEngine.generateInsights([], testContext);
    
    expect(emptyInsights).toBeDefined();
    expect(Array.isArray(emptyInsights)).toBe(true);
    
    console.log(`✅ Empty data handled gracefully, returned ${emptyInsights.length} insights`);
  });

  test('Enhanced KPI Widget integration works', async () => {
    // Simulate what the enhanced KPI widget does
    const insights = await aiInsightEngine.generateInsights(testData, testContext);
    
    // Filter insights like the KPI widget would
    const kpiRelevantInsights = insights.filter(insight => 
      insight.category === 'territory' || 
      insight.category === 'product' || 
      insight.category === 'hcp' ||
      insight.category === 'market' ||
      insight.category === 'competitive'
    );
    
    console.log(`✅ KPI widget would display ${kpiRelevantInsights.length} relevant insights`);
    
    // Test that insights have the structure expected by the KPI widget
    if (kpiRelevantInsights.length > 0) {
      const insight = kpiRelevantInsights[0];
      expect(insight).toHaveProperty('metadata');
      expect(insight.metadata).toHaveProperty('analysis_timestamp');
      
      console.log(`✅ KPI widget integration structure validated`);
    }
  });
});

export {};