// src/lib/comparison/comparison-engine.ts
// Comparison Analytics Engine for pharmaceutical dashboard
// Handles data processing, statistical analysis, and insight generation

import { 
  ComparisonConfiguration, 
  ComparisonResult, 
  ComparisonDatasetResult, 
  ComparisonMetric, 
  ComparisonInsight,
  ComparisonSummary,
  TimeSeriesPoint,
  BenchmarkConfiguration,
  ComparisonDataset,
  ComparisonTimeframe,
  PerformanceComparison
} from '@/lib/types/comparison';

export class ComparisonEngine {
  private static instance: ComparisonEngine;

  public static getInstance(): ComparisonEngine {
    if (!ComparisonEngine.instance) {
      ComparisonEngine.instance = new ComparisonEngine();
    }
    return ComparisonEngine.instance;
  }

  /**
   * Execute a comparison configuration and generate results
   */
  async executeComparison(config: ComparisonConfiguration): Promise<ComparisonResult> {
    const datasets = await Promise.all(
      config.datasets.map(dataset => this.processDataset(dataset, config))
    );

    const summary = this.generateSummary(datasets);
    const insights = this.generateInsights(datasets, config);

    return {
      configurationId: config.id,
      datasets,
      summary,
      insights,
      generatedAt: new Date()
    };
  }

  /**
   * Process individual dataset for comparison
   */
  private async processDataset(
    dataset: ComparisonDataset, 
    config: ComparisonConfiguration
  ): Promise<ComparisonDatasetResult> {
    // Simulate data fetching based on filters and timeframe
    const metrics = await this.calculateMetrics(dataset, config.metrics);
    const timeSeries = config.type === 'time_series' 
      ? await this.generateTimeSeries(dataset, config.timeframe)
      : undefined;

    // Calculate performance rankings
    const performance = this.calculatePerformance(metrics, config.benchmarks || []);

    return {
      datasetId: dataset.id,
      label: dataset.label,
      color: dataset.color,
      metrics,
      timeSeries,
      performance
    };
  }

  /**
   * Calculate metrics for a dataset
   */
  private async calculateMetrics(
    dataset: ComparisonDataset, 
    metricNames: string[]
  ): Promise<ComparisonMetric[]> {
    const metrics: ComparisonMetric[] = [];

    for (const metricName of metricNames) {
      const metric = await this.calculateSingleMetric(dataset, metricName);
      metrics.push(metric);
    }

    return metrics;
  }

  /**
   * Calculate a single metric with trend analysis
   */
  private async calculateSingleMetric(
    dataset: ComparisonDataset, 
    metricName: string
  ): Promise<ComparisonMetric> {
    // Simulate metric calculation based on dataset filters
    const baseValue = this.getBaseMetricValue(metricName);
    const filterMultiplier = this.calculateFilterMultiplier(dataset.filters);
    const randomVariation = 0.8 + Math.random() * 0.4; // ±20% variation
    
    const value = Math.round(baseValue * filterMultiplier * randomVariation);
    const previousValue = Math.round(value * (0.9 + Math.random() * 0.2)); // Previous period
    
    const change = value - previousValue;
    const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(changePercent) > 2) {
      trend = changePercent > 0 ? 'up' : 'down';
    }

    return {
      id: metricName,
      name: this.getMetricDisplayName(metricName),
      value,
      previousValue,
      change,
      changePercent,
      trend,
      confidence: 0.85 + Math.random() * 0.15, // 85-100% confidence
      format: this.getMetricFormat(metricName),
      unit: this.getMetricUnit(metricName)
    };
  }

  /**
   * Generate time series data for trend analysis
   */
  private async generateTimeSeries(
    dataset: ComparisonDataset,
    timeframe: ComparisonTimeframe
  ): Promise<TimeSeriesPoint[]> {
    const points: TimeSeriesPoint[] = [];
    const startDate = new Date(timeframe.primary.startDate);
    const endDate = new Date(timeframe.primary.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate points based on granularity
    const granularityDays = this.getGranularityDays(timeframe.granularity);
    const pointCount = Math.ceil(daysDiff / granularityDays);
    
    let baseValue = 1000 + Math.random() * 500; // Starting baseline
    const trendFactor = -0.02 + Math.random() * 0.04; // Random trend
    
    for (let i = 0; i < pointCount; i++) {
      const pointDate = new Date(startDate.getTime() + i * granularityDays * 24 * 60 * 60 * 1000);
      
      // Add trend and random variation
      baseValue = baseValue * (1 + trendFactor + (Math.random() - 0.5) * 0.1);
      
      points.push({
        date: pointDate,
        value: Math.round(baseValue),
        confidence: 0.8 + Math.random() * 0.2
      });
    }

    return points;
  }

  /**
   * Calculate performance metrics and rankings
   */
  private calculatePerformance(
    metrics: ComparisonMetric[], 
    benchmarks: BenchmarkConfiguration[]
  ) {
    // Simple performance calculation for demo
    const primaryMetric = metrics[0];
    const rank = Math.floor(Math.random() * 10) + 1;
    const percentile = Math.round((10 - rank) * 10 + Math.random() * 10);
    
    return {
      rank,
      percentile,
      vsBaseline: primaryMetric?.changePercent || 0,
      vsBenchmark: benchmarks.length > 0 
        ? ((primaryMetric?.value || 0) - benchmarks[0].value) / benchmarks[0].value * 100
        : undefined
    };
  }

  /**
   * Generate comparison summary
   */
  private generateSummary(datasets: ComparisonDatasetResult[]): ComparisonSummary {
    if (datasets.length === 0) {
      return {
        totalDatasets: 0,
        bestPerforming: { datasetId: '', metric: '', value: 0 },
        worstPerforming: { datasetId: '', metric: '', value: 0 },
        averageChange: 0,
        volatility: 0
      };
    }

    // Find best and worst performing datasets
    let bestPerforming = { datasetId: '', metric: '', value: -Infinity };
    let worstPerforming = { datasetId: '', metric: '', value: Infinity };
    let totalChange = 0;
    const changeValues: number[] = [];

    datasets.forEach(dataset => {
      dataset.metrics.forEach(metric => {
        if (metric.value > bestPerforming.value) {
          bestPerforming = {
            datasetId: dataset.datasetId,
            metric: metric.name,
            value: metric.value
          };
        }
        if (metric.value < worstPerforming.value) {
          worstPerforming = {
            datasetId: dataset.datasetId,
            metric: metric.name,
            value: metric.value
          };
        }
        totalChange += metric.changePercent;
        changeValues.push(metric.changePercent);
      });
    });

    const averageChange = totalChange / (datasets.length * datasets[0]?.metrics.length || 1);
    const volatility = this.calculateVolatility(changeValues);

    return {
      totalDatasets: datasets.length,
      bestPerforming,
      worstPerforming,
      averageChange,
      volatility,
      correlation: datasets.length > 1 ? Math.random() * 0.6 + 0.2 : undefined
    };
  }

  /**
   * Generate insights from comparison data
   */
  private generateInsights(
    datasets: ComparisonDatasetResult[], 
    config: ComparisonConfiguration
  ): ComparisonInsight[] {
    const insights: ComparisonInsight[] = [];

    // Performance gap insight
    if (datasets.length > 1) {
      const performanceGap = this.detectPerformanceGap(datasets);
      if (performanceGap) {
        insights.push(performanceGap);
      }
    }

    // Trend reversal insight
    const trendReversal = this.detectTrendReversal(datasets);
    if (trendReversal) {
      insights.push(trendReversal);
    }

    // Benchmark deviation insight
    const benchmarkDeviation = this.detectBenchmarkDeviation(datasets, config.benchmarks || []);
    if (benchmarkDeviation) {
      insights.push(benchmarkDeviation);
    }

    return insights;
  }

  /**
   * Detect significant performance gaps between datasets
   */
  private detectPerformanceGap(datasets: ComparisonDatasetResult[]): ComparisonInsight | null {
    const primaryMetrics = datasets.map(d => d.metrics[0]?.value || 0);
    const maxValue = Math.max(...primaryMetrics);
    const minValue = Math.min(...primaryMetrics);
    const gap = ((maxValue - minValue) / maxValue) * 100;

    if (gap > 25) { // Significant gap threshold
      const bestDataset = datasets.find(d => d.metrics[0]?.value === maxValue);
      const worstDataset = datasets.find(d => d.metrics[0]?.value === minValue);

      return {
        type: 'performance_gap',
        severity: gap > 50 ? 'high' : 'medium',
        title: 'Significant Performance Gap Detected',
        description: `${gap.toFixed(1)}% performance difference between best (${bestDataset?.label}) and worst (${worstDataset?.label}) performing segments.`,
        datasetIds: [bestDataset?.datasetId || '', worstDataset?.datasetId || ''],
        metrics: [datasets[0]?.metrics[0]?.name || ''],
        confidence: 0.9,
        actionable: true,
        recommendations: [
          'Analyze top-performing segment strategies',
          'Implement best practices in underperforming areas',
          'Consider resource reallocation'
        ]
      };
    }

    return null;
  }

  /**
   * Detect trend reversals in dataset performance
   */
  private detectTrendReversal(datasets: ComparisonDatasetResult[]): ComparisonInsight | null {
    const reversalDatasets = datasets.filter(dataset => {
      const metric = dataset.metrics[0];
      return metric && Math.abs(metric.changePercent) > 15 && metric.trend !== 'stable';
    });

    if (reversalDatasets.length > 0) {
      const isPositive = reversalDatasets[0].metrics[0].trend === 'up';
      
      return {
        type: 'trend_reversal',
        severity: 'medium',
        title: `${isPositive ? 'Positive' : 'Negative'} Trend Reversal Detected`,
        description: `${reversalDatasets.length} segment(s) showing ${isPositive ? 'improvement' : 'decline'} with ${Math.abs(reversalDatasets[0].metrics[0].changePercent).toFixed(1)}% change.`,
        datasetIds: reversalDatasets.map(d => d.datasetId),
        metrics: [reversalDatasets[0].metrics[0].name],
        confidence: 0.85,
        actionable: true,
        recommendations: isPositive 
          ? ['Capitalize on positive momentum', 'Scale successful initiatives']
          : ['Investigate root causes', 'Implement corrective measures']
      };
    }

    return null;
  }

  /**
   * Detect deviations from benchmarks
   */
  private detectBenchmarkDeviation(
    datasets: ComparisonDatasetResult[], 
    benchmarks: BenchmarkConfiguration[]
  ): ComparisonInsight | null {
    if (benchmarks.length === 0) return null;

    const deviatingDatasets = datasets.filter(dataset => {
      const performance = dataset.performance.vsBenchmark;
      return performance !== undefined && Math.abs(performance) > 20;
    });

    if (deviatingDatasets.length > 0) {
      const avgDeviation = deviatingDatasets.reduce(
        (sum, d) => sum + Math.abs(d.performance.vsBenchmark || 0), 0
      ) / deviatingDatasets.length;

      return {
        type: 'benchmark_deviation',
        severity: avgDeviation > 40 ? 'high' : 'medium',
        title: 'Benchmark Deviation Alert',
        description: `${deviatingDatasets.length} segment(s) deviating from benchmark by average of ${avgDeviation.toFixed(1)}%.`,
        datasetIds: deviatingDatasets.map(d => d.datasetId),
        metrics: ['Primary Metric'],
        confidence: 0.8,
        actionable: true,
        recommendations: [
          'Review benchmark alignment',
          'Adjust targets or strategies',
          'Investigate market conditions'
        ]
      };
    }

    return null;
  }

  // Helper methods
  private getBaseMetricValue(metricName: string): number {
    const metricBases: Record<string, number> = {
      'total_prescriptions': 5000,
      'new_prescriptions': 1200,
      'market_share': 25,
      'revenue': 750000,
      'call_frequency': 2.5,
      'hcp_engagement': 65
    };
    return metricBases[metricName] || 1000;
  }

  private calculateFilterMultiplier(filters: Record<string, string[]>): number {
    let multiplier = 1;
    
    // Adjust based on filter complexity
    Object.values(filters).forEach(filterValues => {
      if (filterValues.length > 0) {
        multiplier *= (0.8 + filterValues.length * 0.1); // More filters = higher/lower values
      }
    });

    return Math.min(multiplier, 2); // Cap at 2x
  }

  private getMetricDisplayName(metricName: string): string {
    const displayNames: Record<string, string> = {
      'total_prescriptions': 'Total Prescriptions',
      'new_prescriptions': 'New Prescriptions',
      'market_share': 'Market Share',
      'revenue': 'Revenue',
      'call_frequency': 'Call Frequency',
      'hcp_engagement': 'HCP Engagement'
    };
    return displayNames[metricName] || metricName.replace('_', ' ');
  }

  private getMetricFormat(metricName: string): 'number' | 'percentage' | 'currency' | 'ratio' {
    const formats: Record<string, 'number' | 'percentage' | 'currency' | 'ratio'> = {
      'total_prescriptions': 'number',
      'new_prescriptions': 'number',
      'market_share': 'percentage',
      'revenue': 'currency',
      'call_frequency': 'ratio',
      'hcp_engagement': 'percentage'
    };
    return formats[metricName] || 'number';
  }

  private getMetricUnit(metricName: string): string | undefined {
    const units: Record<string, string> = {
      'call_frequency': 'per month',
      'revenue': 'USD'
    };
    return units[metricName];
  }

  private getGranularityDays(granularity: string): number {
    switch (granularity) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30;
      case 'quarterly': return 90;
      default: return 7;
    }
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Create performance comparison between datasets
   */
  createPerformanceComparison(datasets: ComparisonDatasetResult[]): PerformanceComparison | null {
    if (datasets.length < 2) return null;

    const baseline = datasets.find(d => d.datasetId.includes('baseline')) || datasets[0];
    const comparisons = datasets.filter(d => d.datasetId !== baseline.datasetId);

    return {
      baselineDataset: baseline,
      comparisonDatasets: comparisons,
      relativePerfomance: comparisons.map(dataset => ({
        datasetId: dataset.datasetId,
        metrics: dataset.metrics.map(metric => {
          const baselineMetric = baseline.metrics.find(m => m.id === metric.id);
          const relativeChange = baselineMetric 
            ? ((metric.value - baselineMetric.value) / baselineMetric.value) * 100
            : 0;
          
          return {
            metricId: metric.id,
            relativeChange,
            statisticalSignificance: 0.8 + Math.random() * 0.2, // Mock significance
            pValue: Math.random() * 0.1 // Mock p-value
          };
        })
      }))
    };
  }
}