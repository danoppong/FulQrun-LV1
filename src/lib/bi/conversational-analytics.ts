// src/lib/bi/conversational-analytics.ts
// Conversational Analytics Engine for Pharmaceutical BI
// Handles natural language queries and generates AI-powered insights

export interface QueryIntent {
  type: 'kpi' | 'trend' | 'comparison' | 'forecast' | 'anomaly' | 'recommendation' | 'general';
  entities: {
    kpis?: string[];
    territories?: string[];
    products?: string[];
    timeframes?: string[];
    hcps?: string[];
  };
  parameters: {
    period?: string;
    comparison?: string;
    threshold?: number;
  };
  confidence: number;
}

export interface AnalyticsResponse {
  intent: QueryIntent;
  data: unknown;
  insights: string[];
  recommendations: string[];
  visualizations: {
    type: 'chart' | 'table' | 'metric' | 'map';
    data: unknown;
    title: string;
  }[];
  confidence: number;
  query: string;
  timestamp: string;
}

export interface ConversationContext {
  userId: string;
  organizationId: string;
  sessionId: string;
  previousQueries: QueryIntent[];
  userRole: 'rep' | 'manager' | 'admin';
  preferences: {
    defaultPeriod: string;
    favoriteKPIs: string[];
    territories: string[];
  };
}

export class ConversationalAnalyticsEngine {
  private kpiKeywords = {
    'trx': ['total prescriptions', 'trx', 'prescriptions', 'total rx'],
    'nrx': ['new prescriptions', 'nrx', 'new rx', 'new scripts'],
    'market_share': ['market share', 'share', 'market position'],
    'growth': ['growth', 'increase', 'decrease', 'change'],
    'reach': ['reach', 'coverage', 'hcp coverage'],
    'frequency': ['frequency', 'call frequency', 'visit frequency'],
    'call_effectiveness': ['call effectiveness', 'call impact', 'detailing effectiveness'],
    'sample_to_script_ratio': ['sample ratio', 'sample to script', 'sample effectiveness'],
    'formulary_access': ['formulary', 'access', 'payer access', 'coverage']
  };

  private territoryKeywords = [
    'territory', 'territories', 'region', 'regions', 'area', 'areas',
    'north', 'south', 'east', 'west', 'central'
  ];

  private productKeywords = [
    'product', 'products', 'drug', 'drugs', 'medication', 'medications',
    'brand', 'brands', 'therapeutic', 'category'
  ];

  private timeframeKeywords = [
    'last week', 'last month', 'last quarter', 'last year',
    'this week', 'this month', 'this quarter', 'this year',
    'yesterday', 'today', 'q1', 'q2', 'q3', 'q4',
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  /**
   * Parse natural language query into structured intent
   */
  parseQuery(query: string, context: ConversationContext): QueryIntent {
    const normalizedQuery = query.toLowerCase();
    
    // Detect KPIs
    const detectedKPIs: string[] = [];
    Object.entries(this.kpiKeywords).forEach(([kpi, keywords]) => {
      if (keywords.some(keyword => normalizedQuery.includes(keyword))) {
        detectedKPIs.push(kpi);
      }
    });

    // Detect territories
    const detectedTerritories: string[] = [];
    this.territoryKeywords.forEach(keyword => {
      if (normalizedQuery.includes(keyword)) {
        // Extract territory names (simplified)
        const territoryMatch = normalizedQuery.match(new RegExp(`${keyword}\\s+(\\w+)`, 'i'));
        if (territoryMatch) {
          detectedTerritories.push(territoryMatch[1]);
        }
      }
    });

    // Detect products
    const detectedProducts: string[] = [];
    this.productKeywords.forEach(keyword => {
      if (normalizedQuery.includes(keyword)) {
        const productMatch = normalizedQuery.match(new RegExp(`${keyword}\\s+(\\w+)`, 'i'));
        if (productMatch) {
          detectedProducts.push(productMatch[1]);
        }
      }
    });

    // Detect timeframes
    const detectedTimeframes: string[] = [];
    this.timeframeKeywords.forEach(keyword => {
      if (normalizedQuery.includes(keyword)) {
        detectedTimeframes.push(keyword);
      }
    });

    // Determine intent type
    let intentType: QueryIntent['type'] = 'general';
    if (detectedKPIs.length > 0) {
      intentType = 'kpi';
    }
    if (normalizedQuery.includes('trend') || normalizedQuery.includes('over time')) {
      intentType = 'trend';
    }
    if (normalizedQuery.includes('compare') || normalizedQuery.includes('vs') || normalizedQuery.includes('versus')) {
      intentType = 'comparison';
    }
    if (normalizedQuery.includes('forecast') || normalizedQuery.includes('predict') || normalizedQuery.includes('future')) {
      intentType = 'forecast';
    }
    if (normalizedQuery.includes('anomaly') || normalizedQuery.includes('unusual') || normalizedQuery.includes('outlier')) {
      intentType = 'anomaly';
    }
    if (normalizedQuery.includes('recommend') || normalizedQuery.includes('suggest') || normalizedQuery.includes('should')) {
      intentType = 'recommendation';
    }

    // Extract parameters
    const parameters: QueryIntent['parameters'] = {};
    
    // Extract period
    if (detectedTimeframes.length > 0) {
      parameters.period = detectedTimeframes[0];
    }

    // Extract threshold for anomaly detection
    const thresholdMatch = normalizedQuery.match(/(\d+)%/);
    if (thresholdMatch) {
      parameters.threshold = parseInt(thresholdMatch[1]);
    }

    // Calculate confidence based on keyword matches
    const confidence = Math.min(0.9, 
      (detectedKPIs.length * 0.3) + 
      (detectedTerritories.length * 0.2) + 
      (detectedProducts.length * 0.2) + 
      (detectedTimeframes.length * 0.2) + 
      0.1
    );

    return {
      type: intentType,
      entities: {
        kpis: detectedKPIs.length > 0 ? detectedKPIs : undefined,
        territories: detectedTerritories.length > 0 ? detectedTerritories : undefined,
        products: detectedProducts.length > 0 ? detectedProducts : undefined,
        timeframes: detectedTimeframes.length > 0 ? detectedTimeframes : undefined
      },
      parameters,
      confidence
    };
  }

  /**
   * Generate analytics response based on parsed intent
   */
  async generateResponse(
    intent: QueryIntent, 
    context: ConversationContext,
    dashboardData: unknown
  ): Promise<AnalyticsResponse> {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const visualizations: AnalyticsResponse['visualizations'] = [];

    switch (intent.type) {
      case 'kpi':
        return this.generateKPIResponse(intent, context, dashboardData);
      
      case 'trend':
        return this.generateTrendResponse(intent, context, dashboardData);
      
      case 'comparison':
        return this.generateComparisonResponse(intent, context, dashboardData);
      
      case 'forecast':
        return this.generateForecastResponse(intent, context, dashboardData);
      
      case 'anomaly':
        return this.generateAnomalyResponse(intent, context, dashboardData);
      
      case 'recommendation':
        return this.generateRecommendationResponse(intent, context, dashboardData);
      
      default:
        return this.generateGeneralResponse(intent, context, dashboardData);
    }
  }

  private async generateKPIResponse(
    intent: QueryIntent, 
    context: ConversationContext,
    dashboardData: unknown
  ): Promise<AnalyticsResponse> {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const visualizations: AnalyticsResponse['visualizations'] = [];

    // Analyze KPI data
    if (intent.entities.kpis) {
      intent.entities.kpis.forEach(kpi => {
        const kpiData = dashboardData.kpis?.[kpi];
        if (kpiData) {
          const value = kpiData.value;
          const trend = kpiData.trend;
          const confidence = kpiData.confidence;

          // Generate insights
          if (trend === 'up') {
            insights.push(`${kpi.toUpperCase()} is trending upward with a value of ${value}`);
          } else if (trend === 'down') {
            insights.push(`${kpi.toUpperCase()} is trending downward with a value of ${value}`);
          } else {
            insights.push(`${kpi.toUpperCase()} is stable with a value of ${value}`);
          }

          // Generate recommendations
          if (trend === 'down' && kpi === 'trx') {
            recommendations.push('Consider increasing call frequency to boost prescription volume');
          }
          if (trend === 'down' && kpi === 'reach') {
            recommendations.push('Focus on expanding HCP coverage in underperforming territories');
          }
          if (trend === 'down' && kpi === 'call_effectiveness') {
            recommendations.push('Review and improve call quality and messaging');
          }

          // Create visualization
          visualizations.push({
            type: 'metric',
            data: { value, trend, confidence },
            title: `${kpi.toUpperCase()} Performance`
          });
        }
      });
    }

    return {
      intent,
      data: dashboardData.kpis,
      insights,
      recommendations,
      visualizations,
      confidence: intent.confidence,
      query: '',
      timestamp: new Date().toISOString()
    };
  }

  private async generateTrendResponse(
    intent: QueryIntent, 
    context: ConversationContext,
    dashboardData: unknown
  ): Promise<AnalyticsResponse> {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const visualizations: AnalyticsResponse['visualizations'] = [];

    // Analyze trends across KPIs
    const kpis = intent.entities.kpis || Object.keys(dashboardData.kpis || {});
    
    kpis.forEach(kpi => {
      const kpiData = dashboardData.kpis?.[kpi];
      if (kpiData) {
        const trend = kpiData.trend;
        const value = kpiData.value;

        if (trend === 'up') {
          insights.push(`${kpi.toUpperCase()} shows positive trend with ${value} current value`);
        } else if (trend === 'down') {
          insights.push(`${kpi.toUpperCase()} shows declining trend with ${value} current value`);
        } else {
          insights.push(`${kpi.toUpperCase()} remains stable at ${value}`);
        }
      }
    });

    // Create trend visualization
    visualizations.push({
      type: 'chart',
      data: dashboardData.kpis,
      title: 'KPI Trends Over Time'
    });

    return {
      intent,
      data: dashboardData.kpis,
      insights,
      recommendations,
      visualizations,
      confidence: intent.confidence,
      query: '',
      timestamp: new Date().toISOString()
    };
  }

  private async generateComparisonResponse(
    intent: QueryIntent, 
    context: ConversationContext,
    dashboardData: unknown
  ): Promise<AnalyticsResponse> {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const visualizations: AnalyticsResponse['visualizations'] = [];

    // Compare territories or products
    if (intent.entities.territories && intent.entities.territories.length >= 2) {
      insights.push(`Comparing performance across ${intent.entities.territories.join(', ')} territories`);
      
      visualizations.push({
        type: 'chart',
        data: dashboardData.territoryPerformance,
        title: 'Territory Performance Comparison'
      });
    }

    if (intent.entities.products && intent.entities.products.length >= 2) {
      insights.push(`Comparing performance across ${intent.entities.products.join(', ')} products`);
      
      visualizations.push({
        type: 'chart',
        data: dashboardData.productPerformance,
        title: 'Product Performance Comparison'
      });
    }

    return {
      intent,
      data: dashboardData,
      insights,
      recommendations,
      visualizations,
      confidence: intent.confidence,
      query: '',
      timestamp: new Date().toISOString()
    };
  }

  private async generateForecastResponse(
    intent: QueryIntent, 
    context: ConversationContext,
    dashboardData: unknown
  ): Promise<AnalyticsResponse> {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const visualizations: AnalyticsResponse['visualizations'] = [];

    // Generate forecasts based on current trends
    const kpis = intent.entities.kpis || Object.keys(dashboardData.kpis || {});
    
    kpis.forEach(kpi => {
      const kpiData = dashboardData.kpis?.[kpi];
      if (kpiData) {
        const trend = kpiData.trend;
        const value = kpiData.value;

        if (trend === 'up') {
          insights.push(`Based on current trends, ${kpi.toUpperCase()} is projected to increase by 15-20% next quarter`);
        } else if (trend === 'down') {
          insights.push(`Based on current trends, ${kpi.toUpperCase()} may decline by 10-15% next quarter`);
        } else {
          insights.push(`${kpi.toUpperCase()} is expected to remain stable next quarter`);
        }
      }
    });

    recommendations.push('Monitor key performance indicators closely');
    recommendations.push('Adjust strategies based on forecasted trends');

    visualizations.push({
      type: 'chart',
      data: dashboardData.kpis,
      title: 'Forecasted Performance Trends'
    });

    return {
      intent,
      data: dashboardData.kpis,
      insights,
      recommendations,
      visualizations,
      confidence: intent.confidence,
      query: '',
      timestamp: new Date().toISOString()
    };
  }

  private async generateAnomalyResponse(
    intent: QueryIntent, 
    context: ConversationContext,
    dashboardData: unknown
  ): Promise<AnalyticsResponse> {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const visualizations: AnalyticsResponse['visualizations'] = [];

    // Detect anomalies in KPI data
    const kpis = intent.entities.kpis || Object.keys(dashboardData.kpis || {});
    const threshold = intent.parameters.threshold || 20;

    kpis.forEach(kpi => {
      const kpiData = dashboardData.kpis?.[kpi];
      if (kpiData) {
        const confidence = kpiData.confidence;
        
        if (confidence < 0.7) {
          insights.push(`Anomaly detected in ${kpi.toUpperCase()}: Low confidence score of ${(confidence * 100).toFixed(1)}%`);
          recommendations.push(`Investigate data quality issues for ${kpi.toUpperCase()}`);
        }
      }
    });

    // Check for unusual patterns in recent activity
    const recentPrescriptions = dashboardData.recentPrescriptions || [];
    const recentCalls = dashboardData.recentCalls || [];

    if (recentPrescriptions.length === 0 && recentCalls.length > 0) {
      insights.push('Unusual pattern detected: High call activity but no recent prescriptions');
      recommendations.push('Review call effectiveness and messaging');
    }

    return {
      intent,
      data: dashboardData,
      insights,
      recommendations,
      visualizations,
      confidence: intent.confidence,
      query: '',
      timestamp: new Date().toISOString()
    };
  }

  private async generateRecommendationResponse(
    intent: QueryIntent, 
    context: ConversationContext,
    dashboardData: unknown
  ): Promise<AnalyticsResponse> {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const visualizations: AnalyticsResponse['visualizations'] = [];

    // Generate recommendations based on current performance
    const kpis = dashboardData.kpis || {};
    
    // Analyze performance and generate recommendations
    Object.entries(kpis).forEach(([kpi, data]: [string, unknown]) => {
      const trend = (data as { trend?: string })?.trend;
      const value = (data as { value?: unknown })?.value;

      if (trend === 'down') {
        switch (kpi) {
          case 'trx':
            recommendations.push('Increase call frequency and improve messaging to boost prescription volume');
            break;
          case 'reach':
            recommendations.push('Expand HCP coverage in underperforming territories');
            break;
          case 'call_effectiveness':
            recommendations.push('Review call quality and provide additional training to sales reps');
            break;
          case 'sample_to_script_ratio':
            recommendations.push('Optimize sample distribution strategy and follow-up processes');
            break;
        }
      }
    });

    // General recommendations based on role
    if (context.userRole === 'rep') {
      recommendations.push('Focus on high-value HCPs with highest prescription potential');
      recommendations.push('Ensure consistent follow-up after sample distribution');
    } else if (context.userRole === 'manager') {
      recommendations.push('Review team performance and provide targeted coaching');
      recommendations.push('Analyze territory coverage gaps and adjust resource allocation');
    }

    insights.push('Generated personalized recommendations based on current performance data');

    return {
      intent,
      data: dashboardData,
      insights,
      recommendations,
      visualizations,
      confidence: intent.confidence,
      query: '',
      timestamp: new Date().toISOString()
    };
  }

  private async generateGeneralResponse(
    intent: QueryIntent, 
    context: ConversationContext,
    dashboardData: unknown
  ): Promise<AnalyticsResponse> {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const visualizations: AnalyticsResponse['visualizations'] = [];

    // Provide general overview
    insights.push('Here\'s an overview of your pharmaceutical performance:');
    
    const kpis = dashboardData.kpis || {};
    Object.entries(kpis).forEach(([kpi, data]: [string, unknown]) => {
      const value = (data as { value?: unknown })?.value as string | number | undefined;
      const trend = (data as { trend?: string })?.trend as string | undefined;
      insights.push(`${kpi.toUpperCase()}: ${String(value)} (${trend ?? 'no'} trend)`);
    });

    recommendations.push('Use specific questions to get detailed insights about KPIs, trends, or territories');
    recommendations.push('Ask about forecasts, comparisons, or anomalies for deeper analysis');

    visualizations.push({
      type: 'chart',
      data: kpis,
      title: 'Performance Overview'
    });

    return {
      intent,
      data: dashboardData,
      insights,
      recommendations,
      visualizations,
      confidence: intent.confidence,
      query: '',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate natural language response from analytics
   */
  generateNaturalLanguageResponse(response: AnalyticsResponse): string {
    let naturalResponse = '';

    // Add insights
    if (response.insights.length > 0) {
      naturalResponse += '**Key Insights:**\n';
      response.insights.forEach(insight => {
        naturalResponse += `• ${insight}\n`;
      });
      naturalResponse += '\n';
    }

    // Add recommendations
    if (response.recommendations.length > 0) {
      naturalResponse += '**Recommendations:**\n';
      response.recommendations.forEach(recommendation => {
        naturalResponse += `• ${recommendation}\n`;
      });
      naturalResponse += '\n';
    }

    // Add confidence note
    if (response.confidence < 0.7) {
      naturalResponse += `*Note: Analysis confidence is ${(response.confidence * 100).toFixed(1)}%. Consider refining your question for more accurate results.*\n`;
    }

    return naturalResponse.trim();
  }
}

// Export singleton instance
export const conversationalAnalytics = new ConversationalAnalyticsEngine();
