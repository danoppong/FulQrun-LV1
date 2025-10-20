// src/lib/analytics/analytical-engine.ts
// Advanced Analytics Engine for Phase 2.6 Implementation
// Comprehensive analytical capabilities for pharmaceutical dashboard widgets

import { 
  TrendAnalysis, 
  TrendDataPoint, 
  AnalyticalInsight, 
  PerformanceComparison,
  ComparisonMetric,
  ForecastResult,
  ForecastConfiguration
} from '@/lib/types/analytics';

export class AnalyticalEngine {
  private static instance: AnalyticalEngine;
  private cache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map();

  static getInstance(): AnalyticalEngine {
    if (!AnalyticalEngine.instance) {
      AnalyticalEngine.instance = new AnalyticalEngine();
    }
    return AnalyticalEngine.instance;
  }

  private constructor() {}

  // Cache management
  private setCacheData<T>(key: string, data: T, ttl: number = 300000): void { // 5 min default TTL
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

  // Trend Analysis Methods
  async analyzeTrend(
    data: TrendDataPoint[], 
    metric: string, 
    options: {
      detectSeasonality?: boolean;
      detectAnomalies?: boolean;
      generateForecast?: boolean;
      forecastPeriods?: number;
    } = {}
  ): Promise<TrendAnalysis> {
    const cacheKey = `trend_${metric}_${JSON.stringify(options)}_${data.length}`;
    const cached = this.getCacheData<TrendAnalysis>(cacheKey);
    if (cached) return cached;

    const trend = this.calculateTrend(data);
    const seasonality = options.detectSeasonality ? this.detectSeasonality(data) : { detected: false };
    const anomalies = options.detectAnomalies ? this.detectAnomalies(data) : [];
    const insights = this.generateTrendInsights(data, metric, trend, anomalies);

    let forecast;
    if (options.generateForecast && options.forecastPeriods) {
      const forecastConfig: ForecastConfiguration = {
        metric,
        algorithm: 'linear',
        periods: options.forecastPeriods,
        confidence: 0.95,
        includeSeasonal: seasonality.detected,
        includeAnomalies: false,
        validationSplit: 0.2
      };
      forecast = await this.generateForecast(forecastConfig, data);
    }

    const analysis: TrendAnalysis = {
      id: `trend_${metric}_${Date.now()}`,
      metric,
      timeframe: this.calculateTimeframe(data),
      data: options.detectAnomalies ? this.markAnomalies(data, anomalies) : data,
      trend: trend.direction,
      trendStrength: trend.strength,
      seasonality,
      forecast: forecast ? {
        enabled: true,
        periods: options.forecastPeriods || 0,
        data: forecast.forecastData,
        accuracy: forecast.accuracy.r2
      } : undefined,
      insights,
      calculatedAt: new Date().toISOString()
    };

    this.setCacheData(cacheKey, analysis);
    return analysis;
  }

  private calculateTrend(data: TrendDataPoint[]): { 
    direction: 'upward' | 'downward' | 'stable' | 'volatile'; 
    strength: number 
  } {
    if (data.length < 2) return { direction: 'stable', strength: 0 };

    // Linear regression to determine trend
    const n = data.length;
    const xValues = data.map((_, i) => i);
    const yValues = data.map(d => d.value);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared for strength
    const yMean = sumY / n;
    const ssRes = yValues.reduce((sum, y, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);

    // Calculate volatility
    const changes = [];
    for (let i = 1; i < data.length; i++) {
      changes.push((data[i].value - data[i-1].value) / data[i-1].value);
    }
    const volatility = this.calculateStandardDeviation(changes);

    // Determine direction and strength
    let direction: 'upward' | 'downward' | 'stable' | 'volatile';
    if (volatility > 0.3) {
      direction = 'volatile';
    } else if (Math.abs(slope) < 0.1) {
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'upward';
    } else {
      direction = 'downward';
    }

    return {
      direction,
      strength: Math.abs(rSquared)
    };
  }

  private detectSeasonality(data: TrendDataPoint[]): {
    detected: boolean;
    pattern?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    strength?: number;
  } {
    if (data.length < 12) return { detected: false };

    // Simple seasonality detection using autocorrelation
    const values = data.map(d => d.value);
    const periods = [7, 30, 90, 365]; // weekly, monthly, quarterly, yearly
    const patterns = ['weekly', 'monthly', 'quarterly', 'yearly'] as const;
    
    let maxCorrelation = 0;
    let detectedPattern: typeof patterns[number] | undefined;

    for (let i = 0; i < periods.length; i++) {
      const period = periods[i];
      if (data.length < period * 2) continue;

      const correlation = this.calculateAutocorrelation(values, period);
      if (correlation > maxCorrelation && correlation > 0.3) {
        maxCorrelation = correlation;
        detectedPattern = patterns[i];
      }
    }

    return {
      detected: maxCorrelation > 0.3,
      pattern: detectedPattern,
      strength: maxCorrelation
    };
  }

  private detectAnomalies(data: TrendDataPoint[]): number[] {
    if (data.length < 10) return [];

    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = this.calculateStandardDeviation(values);
    
    const anomalies: number[] = [];
    const threshold = 2.5; // Z-score threshold

    values.forEach((value, index) => {
      const zScore = Math.abs((value - mean) / stdDev);
      if (zScore > threshold) {
        anomalies.push(index);
      }
    });

    return anomalies;
  }

  private generateTrendInsights(
    data: TrendDataPoint[], 
    metric: string, 
    trend: { direction: string; strength: number },
    anomalies: number[]
  ): AnalyticalInsight[] {
    const insights: AnalyticalInsight[] = [];

    // Trend insight
    if (trend.strength > 0.7) {
      insights.push({
        id: `trend_${Date.now()}`,
        type: 'trend',
        severity: trend.direction === 'upward' ? 'low' : trend.direction === 'downward' ? 'high' : 'medium',
        title: `Strong ${trend.direction} trend detected`,
        description: `${metric} shows a ${trend.direction} trend with ${(trend.strength * 100).toFixed(1)}% confidence`,
        confidence: trend.strength,
        impact: trend.direction === 'upward' ? 'positive' : trend.direction === 'downward' ? 'negative' : 'neutral',
        actionRequired: trend.direction === 'downward' && trend.strength > 0.8,
        recommendation: trend.direction === 'downward' ? 
          `Consider investigating factors contributing to the declining ${metric}` : 
          `Monitor to maintain positive ${metric} trajectory`
      });
    }

    // Anomaly insights
    if (anomalies.length > 0) {
      insights.push({
        id: `anomaly_${Date.now()}`,
        type: 'anomaly',
        severity: anomalies.length > data.length * 0.1 ? 'high' : 'medium',
        title: `${anomalies.length} anomalies detected`,
        description: `Unusual ${metric} values detected at ${anomalies.length} data points`,
        confidence: 0.85,
        impact: 'neutral',
        actionRequired: anomalies.length > data.length * 0.1,
        recommendation: 'Review data quality and investigate potential causes for anomalous values'
      });
    }

    return insights;
  }

  // Performance Comparison Methods
  async comparePerformance(
    currentData: number[],
    previousData: number[],
    metric: string,
    comparisonType: 'period' | 'territory' | 'product' | 'peer'
  ): Promise<PerformanceComparison> {
    const cacheKey = `comparison_${metric}_${comparisonType}_${currentData.length}_${previousData.length}`;
    const cached = this.getCacheData<PerformanceComparison>(cacheKey);
    if (cached) return cached;

    const currentSum = currentData.reduce((a, b) => a + b, 0);
    const previousSum = previousData.reduce((a, b) => a + b, 0);
    const change = currentSum - previousSum;
    const changePercent = previousSum !== 0 ? (change / previousSum) * 100 : 0;

    const metrics: ComparisonMetric[] = [{
      id: `metric_${Date.now()}`,
      name: metric,
      currentValue: currentSum,
      previousValue: previousSum,
      change,
      changePercent,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      significance: Math.abs(changePercent) > 20 ? 'high' : Math.abs(changePercent) > 10 ? 'medium' : 'low'
    }];

    const comparison: PerformanceComparison = {
      id: `comparison_${Date.now()}`,
      title: `${metric} Performance Comparison`,
      timeframe: 'Current vs Previous Period',
      comparisonType,
      metrics,
      summary: {
        overallTrend: changePercent > 5 ? 'positive' : changePercent < -5 ? 'negative' : 'mixed',
        keyWins: changePercent > 10 ? [`${metric} increased by ${changePercent.toFixed(1)}%`] : [],
        keyOpportunities: changePercent < -10 ? [`${metric} declined by ${Math.abs(changePercent).toFixed(1)}%`] : [],
        recommendations: this.generateComparisonRecommendations(changePercent, metric)
      },
      calculatedAt: new Date().toISOString()
    };

    this.setCacheData(cacheKey, comparison);
    return comparison;
  }

  private generateComparisonRecommendations(changePercent: number, metric: string): string[] {
    const recommendations: string[] = [];

    if (changePercent < -20) {
      recommendations.push(`Urgent attention required for ${metric} - significant decline detected`);
      recommendations.push('Conduct root cause analysis to identify contributing factors');
      recommendations.push('Implement immediate corrective actions');
    } else if (changePercent < -10) {
      recommendations.push(`Monitor ${metric} closely - declining trend observed`);
      recommendations.push('Review strategies and tactics to reverse negative trend');
    } else if (changePercent > 20) {
      recommendations.push(`Excellent performance in ${metric} - analyze success factors`);
      recommendations.push('Document best practices for replication');
    } else if (changePercent > 10) {
      recommendations.push(`Strong performance in ${metric} - maintain current strategies`);
    }

    return recommendations;
  }

  // Forecasting Methods
  async generateForecast(
    config: ForecastConfiguration,
    historicalData: TrendDataPoint[]
  ): Promise<ForecastResult> {
    const cacheKey = `forecast_${config.metric}_${config.algorithm}_${config.periods}`;
    const cached = this.getCacheData<ForecastResult>(cacheKey);
    if (cached) return cached;

    // Simple linear forecasting implementation
    const values = historicalData.map(d => d.value);
    const n = values.length;
    
    // Calculate trend
    const xValues = values.map((_, i) => i);
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecast points
    const forecastData: TrendDataPoint[] = [];
    const lastDate = new Date(historicalData[historicalData.length - 1].date);
    
    for (let i = 1; i <= config.periods; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);
      
      const forecastValue = slope * (n + i - 1) + intercept;
      forecastData.push({
        date: forecastDate.toISOString().split('T')[0],
        value: Math.max(0, forecastValue), // Ensure non-negative
        period: `forecast_${i}`,
        confidence: Math.max(0.5, config.confidence - (i * 0.1)) // Decreasing confidence
      });
    }

    // Calculate accuracy metrics (simplified)
    const yMean = sumY / n;
    const ssRes = values.reduce((sum, y, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const ssTot = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const r2 = 1 - (ssRes / ssTot);

    const result: ForecastResult = {
      id: `forecast_${Date.now()}`,
      configuration: config,
      historicalData,
      forecastData,
      accuracy: {
        mape: 0.15, // Mock value
        rmse: Math.sqrt(ssRes / n),
        r2: Math.max(0, r2)
      },
      confidence: {
        upper: forecastData.map(d => ({ ...d, value: d.value * 1.2 })),
        lower: forecastData.map(d => ({ ...d, value: d.value * 0.8 }))
      },
      insights: [{
        id: `forecast_insight_${Date.now()}`,
        type: 'forecast',
        severity: 'medium',
        title: 'Forecast Generated',
        description: `${config.periods}-period forecast generated with ${(r2 * 100).toFixed(1)}% accuracy`,
        confidence: r2,
        impact: 'neutral',
        actionRequired: false,
        recommendation: 'Monitor actual values against forecast and adjust model as needed'
      }],
      calculatedAt: new Date().toISOString()
    };

    this.setCacheData(cacheKey, result);
    return result;
  }

  // Utility Methods
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  private calculateAutocorrelation(values: number[], lag: number): number {
    if (values.length < lag * 2) return 0;

    const n = values.length - lag;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }

    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }

    return denominator !== 0 ? numerator / denominator : 0;
  }

  private calculateTimeframe(data: TrendDataPoint[]): string {
    if (data.length === 0) return 'No data';
    
    const firstDate = new Date(data[0].date);
    const lastDate = new Date(data[data.length - 1].date);
    const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) return 'Weekly';
    if (diffDays <= 31) return 'Monthly';
    if (diffDays <= 92) return 'Quarterly';
    if (diffDays <= 366) return 'Yearly';
    return 'Multi-year';
  }

  private markAnomalies(data: TrendDataPoint[], anomalies: number[]): TrendDataPoint[] {
    return data.map((point, index) => ({
      ...point,
      anomaly: anomalies.includes(index)
    }));
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const analyticalEngine = AnalyticalEngine.getInstance();