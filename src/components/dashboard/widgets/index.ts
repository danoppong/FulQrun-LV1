// src/components/dashboard/widgets/index.ts
// Phase 2.6 Analytical Widgets Export Index
// Comprehensive export of all advanced analytical widgets

export { TrendAnalysisWidget } from './TrendAnalysisWidget';
export { PerformanceComparisonWidget } from './PerformanceComparisonWidget';

// Re-export existing widgets for convenience
export { PharmaKPICardWidget } from './PharmaKPICardWidget';

// Export types for external use
export type { 
  TrendAnalysis, 
  TrendDataPoint, 
  AnalyticalInsight,
  PerformanceComparison,
  ComparisonMetric,
  ForecastResult,
  AnalyticalWidget,
  HeatmapData,
  CorrelationAnalysis,
  DistributionAnalysis
} from '../../../lib/types/analytics';

// Export analytical engine
export { analyticalEngine } from '../../../lib/analytics/analytical-engine';