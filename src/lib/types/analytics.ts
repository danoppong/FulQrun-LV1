// src/lib/types/analytics.ts
// Advanced Analytics Types for Phase 2.6 Implementation
// Comprehensive type definitions for pharmaceutical analytical widgets

export interface TrendDataPoint {
  date: string;
  value: number;
  period: string;
  confidence?: number;
  anomaly?: boolean;
  metadata?: Record<string, string | number | boolean>;
}

export interface TrendAnalysis {
  id: string;
  metric: string;
  timeframe: string;
  data: TrendDataPoint[];
  trend: 'upward' | 'downward' | 'stable' | 'volatile';
  trendStrength: number; // 0-1
  seasonality: {
    detected: boolean;
    pattern?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    strength?: number;
  };
  forecast?: {
    enabled: boolean;
    periods: number;
    data: TrendDataPoint[];
    accuracy: number;
  };
  insights: AnalyticalInsight[];
  calculatedAt: string;
}

export interface AnalyticalInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'forecast' | 'comparison' | 'recommendation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  confidence: number;
  impact: 'positive' | 'negative' | 'neutral';
  actionRequired: boolean;
  recommendation?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface ComparisonMetric {
  id: string;
  name: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  significance: 'high' | 'medium' | 'low';
  benchmark?: {
    value: number;
    source: string;
    vsCurrentPercent: number;
  };
}

export interface PerformanceComparison {
  id: string;
  title: string;
  timeframe: string;
  comparisonType: 'period' | 'territory' | 'product' | 'peer';
  metrics: ComparisonMetric[];
  summary: {
    overallTrend: 'positive' | 'negative' | 'mixed';
    keyWins: string[];
    keyOpportunities: string[];
    recommendations: string[];
  };
  calculatedAt: string;
}

export interface ForecastConfiguration {
  metric: string;
  algorithm: 'linear' | 'exponential' | 'seasonal' | 'arima' | 'neural';
  periods: number;
  confidence: number; // 0-1
  includeSeasonal: boolean;
  includeAnomalies: boolean;
  validationSplit: number; // 0-1
}

export interface ForecastResult {
  id: string;
  configuration: ForecastConfiguration;
  historicalData: TrendDataPoint[];
  forecastData: TrendDataPoint[];
  accuracy: {
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
    r2: number; // R-squared
  };
  confidence: {
    upper: TrendDataPoint[];
    lower: TrendDataPoint[];
  };
  insights: AnalyticalInsight[];
  calculatedAt: string;
}

export interface AnalyticalWidget {
  id: string;
  type: 'trend' | 'comparison' | 'forecast' | 'heatmap' | 'correlation' | 'distribution';
  title: string;
  description?: string;
  configuration: Record<string, string | number | boolean | string[]>;
  dataSource: string;
  refreshInterval: number; // minutes
  lastUpdated: string;
  isLoading: boolean;
  error?: string;
}

export interface HeatmapData {
  id: string;
  title: string;
  dimensions: {
    x: { label: string; values: string[] };
    y: { label: string; values: string[] };
  };
  data: Array<{
    x: string;
    y: string;
    value: number;
    color: string;
    metadata?: Record<string, string | number | boolean>;
  }>;
  colorScale: {
    min: number;
    max: number;
    colors: string[];
  };
  insights: AnalyticalInsight[];
}

export interface CorrelationAnalysis {
  id: string;
  title: string;
  variables: string[];
  correlationMatrix: number[][];
  significantCorrelations: Array<{
    variable1: string;
    variable2: string;
    correlation: number;
    pValue: number;
    significance: 'high' | 'medium' | 'low';
    interpretation: string;
  }>;
  insights: AnalyticalInsight[];
}

export interface DistributionAnalysis {
  id: string;
  metric: string;
  data: number[];
  statistics: {
    mean: number;
    median: number;
    mode: number;
    standardDeviation: number;
    skewness: number;
    kurtosis: number;
    percentiles: Record<number, number>;
  };
  distribution: {
    type: 'normal' | 'skewed' | 'bimodal' | 'uniform' | 'unknown';
    confidence: number;
  };
  outliers: Array<{
    value: number;
    index: number;
    severity: 'mild' | 'extreme';
  }>;
  insights: AnalyticalInsight[];
}

export interface AnalyticalSession {
  id: string;
  userId: string;
  organizationId: string;
  widgets: AnalyticalWidget[];
  layout: {
    columns: number;
    rows: number;
    positions: Record<string, { x: number; y: number; w: number; h: number }>;
  };
  filters: {
    dateRange: { start: string; end: string };
    territories: string[];
    products: string[];
    segments: string[];
  };
  settings: {
    autoRefresh: boolean;
    refreshInterval: number;
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  createdAt: string;
  updatedAt: string;
}

// Pharmaceutical-specific analytical types
export interface PharmaAnalytics {
  trxTrends: TrendAnalysis;
  nrxTrends: TrendAnalysis;
  marketShareEvolution: TrendAnalysis;
  territoryPerformance: PerformanceComparison;
  productPerformance: PerformanceComparison;
  hcpEngagement: HeatmapData;
  callEffectiveness: CorrelationAnalysis;
  prescriptionDistribution: DistributionAnalysis;
  forecastModels: ForecastResult[];
}

export interface PharmaInsightEngine {
  generateTrendInsights: (data: TrendDataPoint[], metric: string) => AnalyticalInsight[];
  detectAnomalies: (data: TrendDataPoint[]) => TrendDataPoint[];
  generateForecasts: (config: ForecastConfiguration, data: TrendDataPoint[]) => ForecastResult;
  analyzePerformance: (current: number[], previous: number[], context: string) => PerformanceComparison;
  generateRecommendations: (analytics: PharmaAnalytics) => AnalyticalInsight[];
}

// Widget configuration schemas
export interface TrendWidgetConfig {
  metrics: string[];
  timeframe: string;
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  showForecast: boolean;
  showAnomalies: boolean;
  showTrendLine: boolean;
  compareWithPrevious: boolean;
}

export interface ComparisonWidgetConfig {
  baselineMetric: string;
  comparisonMetrics: string[];
  comparisonType: 'period' | 'territory' | 'product' | 'peer';
  timeframe: string;
  showBenchmarks: boolean;
  showPercentageChange: boolean;
}

export interface ForecastWidgetConfig {
  metric: string;
  algorithm: ForecastConfiguration['algorithm'];
  periods: number;
  confidence: number;
  showConfidenceBands: boolean;
  showAccuracyMetrics: boolean;
}

export interface HeatmapWidgetConfig {
  xDimension: string;
  yDimension: string;
  metric: string;
  aggregation: 'sum' | 'average' | 'count' | 'max' | 'min';
  colorScheme: 'red' | 'blue' | 'green' | 'viridis' | 'plasma';
  showValues: boolean;
}

export interface AnalyticalWidgetFactory {
  createTrendWidget: (config: TrendWidgetConfig) => AnalyticalWidget;
  createComparisonWidget: (config: ComparisonWidgetConfig) => AnalyticalWidget;
  createForecastWidget: (config: ForecastWidgetConfig) => AnalyticalWidget;
  createHeatmapWidget: (config: HeatmapWidgetConfig) => AnalyticalWidget;
}