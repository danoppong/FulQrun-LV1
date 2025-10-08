// src/lib/types/comparison.ts
// Type definitions for comparative analytics and benchmarking
// Supports side-by-side comparisons, trend analysis, and performance benchmarks

export interface ComparisonConfiguration {
  id: string;
  name: string;
  description?: string;
  type: ComparisonType;
  datasets: ComparisonDataset[];
  timeframe: ComparisonTimeframe;
  metrics: string[];
  benchmarks?: BenchmarkConfiguration[];
  createdAt: Date;
  updatedAt: Date;
}

export type ComparisonType = 
  | 'side_by_side'     // Compare different filter combinations at same time
  | 'time_series'      // Compare same filters across different time periods
  | 'benchmark'        // Compare against industry/regional benchmarks
  | 'cohort'           // Compare different product/territory cohorts
  | 'seasonal';        // Compare seasonal patterns

export interface ComparisonDataset {
  id: string;
  label: string;
  color: string;
  filters: Record<string, string[]>;
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
  metadata?: Record<string, string | number | boolean>;
  isBaseline?: boolean;
}

export interface ComparisonTimeframe {
  primary: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
  comparison?: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface BenchmarkConfiguration {
  id: string;
  name: string;
  type: BenchmarkType;
  value: number;
  source: string;
  description?: string;
  isTarget?: boolean;
}

export type BenchmarkType = 
  | 'industry_average'
  | 'regional_average'
  | 'company_target'
  | 'historical_best'
  | 'competitor_performance';

export interface ComparisonMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  benchmark?: number;
  format: 'number' | 'percentage' | 'currency' | 'ratio';
  unit?: string;
}

export interface ComparisonResult {
  configurationId: string;
  datasets: ComparisonDatasetResult[];
  summary: ComparisonSummary;
  insights: ComparisonInsight[];
  generatedAt: Date;
}

export interface ComparisonDatasetResult {
  datasetId: string;
  label: string;
  color: string;
  metrics: ComparisonMetric[];
  timeSeries?: TimeSeriesPoint[];
  performance: {
    rank: number;
    percentile: number;
    vsBaseline: number;
    vsBenchmark?: number;
  };
}

export interface TimeSeriesPoint {
  date: Date;
  value: number;
  confidence?: number;
  metadata?: Record<string, string | number>;
}

export interface ComparisonSummary {
  totalDatasets: number;
  bestPerforming: {
    datasetId: string;
    metric: string;
    value: number;
  };
  worstPerforming: {
    datasetId: string;
    metric: string;
    value: number;
  };
  averageChange: number;
  volatility: number;
  correlation?: number;
}

export interface ComparisonInsight {
  type: InsightType;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  datasetIds: string[];
  metrics: string[];
  confidence: number;
  actionable: boolean;
  recommendations?: string[];
}

export type InsightType = 
  | 'performance_gap'
  | 'trend_reversal'
  | 'benchmark_deviation'
  | 'seasonal_pattern'
  | 'correlation_anomaly'
  | 'growth_opportunity'
  | 'risk_indicator';

export interface ComparisonVisualization {
  type: VisualizationType;
  title: string;
  data: ComparisonDatasetResult[];
  configuration: {
    showBenchmarks: boolean;
    showTrends: boolean;
    highlightBest: boolean;
    groupByMetric: boolean;
    timeGranularity?: 'daily' | 'weekly' | 'monthly';
  };
}

export type VisualizationType = 
  | 'bar_chart'
  | 'line_chart'
  | 'area_chart'
  | 'scatter_plot'
  | 'heatmap'
  | 'waterfall'
  | 'radar_chart';

// Filter comparison utilities
export interface FilterComparisonTemplate {
  id: string;
  name: string;
  description: string;
  filterSets: Array<{
    label: string;
    filters: Record<string, string[]>;
    color: string;
  }>;
  suggestedMetrics: string[];
  category: 'territory' | 'product' | 'hcp' | 'time' | 'mixed';
}

// Performance comparison interfaces
export interface PerformanceComparison {
  baselineDataset: ComparisonDatasetResult;
  comparisonDatasets: ComparisonDatasetResult[];
  relativePerfomance: Array<{
    datasetId: string;
    metrics: Array<{
      metricId: string;
      relativeChange: number;
      statisticalSignificance: number;
      pValue?: number;
    }>;
  }>;
}

// Cohort analysis interfaces
export interface CohortAnalysis {
  cohortDefinition: {
    groupBy: 'launch_date' | 'territory_size' | 'hcp_tier' | 'product_category';
    timeWindow: number; // days
    minCohortSize: number;
  };
  cohorts: Array<{
    id: string;
    label: string;
    size: number;
    startDate: Date;
    metrics: ComparisonMetric[];
    retention?: number[];
    lifecycle?: CohortLifecycleStage[];
  }>;
}

export interface CohortLifecycleStage {
  stage: string;
  timeFromStart: number; // days
  averageValue: number;
  participantCount: number;
  dropoffRate?: number;
}

// Export and sharing interfaces
export interface ComparisonExport {
  version: string;
  configuration: ComparisonConfiguration;
  results: ComparisonResult;
  visualizations: ComparisonVisualization[];
  exportedAt: Date;
  exportFormat: 'json' | 'csv' | 'excel' | 'pdf';
}

// Component props interfaces
export interface ComparisonBuilderProps {
  onConfigurationChange: (config: ComparisonConfiguration) => void;
  availableFilters: Record<string, string[]>;
  availableMetrics: string[];
  defaultTimeframe?: ComparisonTimeframe;
  templates?: FilterComparisonTemplate[];
}

export interface ComparisonViewerProps {
  configuration: ComparisonConfiguration;
  results: ComparisonResult;
  onConfigurationUpdate?: (config: ComparisonConfiguration) => void;
  onExport?: (format: 'json' | 'csv' | 'excel' | 'pdf') => void;
  interactive?: boolean;
}

export interface SideBySideComparisonProps {
  datasets: ComparisonDatasetResult[];
  metrics: string[];
  showBenchmarks?: boolean;
  onDatasetSelect?: (datasetId: string) => void;
  className?: string;
}

export interface TrendComparisonProps {
  timeSeries: Array<{
    datasetId: string;
    label: string;
    color: string;
    data: TimeSeriesPoint[];
  }>;
  timeframe: ComparisonTimeframe;
  onTimeRangeChange?: (range: { start: Date; end: Date }) => void;
  className?: string;
}