// src/lib/ml/pipeline/feature-pipeline.ts
// Advanced Feature Engineering Pipeline for Phase 2.9
// Provides automated feature extraction, transformation, and engineering capabilities

import { AuthService } from '@/lib/auth-unified';

export interface FeatureDefinition {
  name: string;
  type: 'numerical' | 'categorical' | 'temporal' | 'text' | 'embedding';
  source: string;
  transformation?: FeatureTransformation;
  aggregation?: AggregationConfig;
  validation?: FeatureValidation;
  description: string;
  tags: string[];
  isTarget?: boolean;
  importance?: number;
}

export interface FeatureTransformation {
  type: 'normalize' | 'standardize' | 'log' | 'sqrt' | 'polynomial' | 'binning' | 'encoding' | 'embedding';
  parameters: Record<string, unknown>;
  customFunction?: string;
}

export interface AggregationConfig {
  groupBy: string[];
  window?: {
    size: number;
    unit: 'hours' | 'days' | 'weeks' | 'months';
  };
  functions: AggregationFunction[];
}

export interface AggregationFunction {
  name: 'sum' | 'mean' | 'count' | 'max' | 'min' | 'std' | 'median' | 'percentile';
  parameters?: Record<string, unknown>;
}

export interface FeatureValidation {
  required: boolean;
  minValue?: number;
  maxValue?: number;
  allowedValues?: unknown[];
  pattern?: string;
  customValidation?: string;
}

export interface FeatureSet {
  id: string;
  name: string;
  description: string;
  features: FeatureDefinition[];
  version: string;
  status: 'draft' | 'active' | 'deprecated';
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureStore {
  features: Map<string, FeatureValue>;
  metadata: Map<string, FeatureMetadata>;
  lastUpdated: string;
}

export interface FeatureValue {
  name: string;
  value: unknown;
  timestamp: string;
  source: string;
  version: string;
}

export interface FeatureMetadata {
  name: string;
  type: string;
  description: string;
  schema: Record<string, unknown>;
  statistics: FeatureStatistics;
  quality: FeatureQuality;
}

export interface FeatureStatistics {
  count: number;
  nullCount: number;
  uniqueCount: number;
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  distribution?: Record<string, number>;
}

export interface FeatureQuality {
  completeness: number;
  validity: number;
  consistency: number;
  accuracy: number;
  freshness: number;
  issues: string[];
}

export interface FeatureExtractionConfig {
  entityId: string;
  entityType: 'opportunity' | 'lead' | 'contact' | 'company' | 'activity';
  featureSet: string;
  timeRange?: {
    startDate: string;
    endDate: string;
  };
  includeHistorical: boolean;
  realTime: boolean;
}

export interface FeatureExtractionResult {
  entityId: string;
  features: Record<string, unknown>;
  extractedAt: string;
  quality: FeatureQuality;
  warnings: string[];
  errors: string[];
}

export class FeaturePipeline {
  private static instance: FeaturePipeline;
  private featureStore: FeatureStore;
  private featureSets = new Map<string, FeatureSet>();
  private computationCache = new Map<string, FeatureExtractionResult>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  static getInstance(): FeaturePipeline {
    if (!FeaturePipeline.instance) {
      FeaturePipeline.instance = new FeaturePipeline();
    }
    return FeaturePipeline.instance;
  }

  private constructor() {
    this.featureStore = {
      features: new Map(),
      metadata: new Map(),
      lastUpdated: new Date().toISOString()
    };
    this.initializeDefaultFeatureSets();
    this.startBackgroundProcessing();
  }

  // Extract features for an entity
  async extractFeatures(config: FeatureExtractionConfig): Promise<FeatureExtractionResult> {
    try {
      console.log(`[FeaturePipeline] Extracting features for ${config.entityType}:${config.entityId}`);

      // Check cache first
      const cacheKey = this.getCacheKey(config);
      const cached = this.computationCache.get(cacheKey);
      if (cached && this.isCacheValid(cached)) {
        console.log(`[FeaturePipeline] Returning cached features for ${config.entityId}`);
        return cached;
      }

      // Get feature set
      const featureSet = this.featureSets.get(config.featureSet);
      if (!featureSet) {
        throw new Error(`Feature set not found: ${config.featureSet}`);
      }

      // Extract raw data
      const rawData = await this.extractRawData(config);

      // Process features
      const features: Record<string, unknown> = {};
      const warnings: string[] = [];
      const errors: string[] = [];

      for (const featureDef of featureSet.features) {
        try {
          const value = await this.computeFeature(featureDef, rawData, config);
          features[featureDef.name] = value;
        } catch (error) {
          console.error(`[FeaturePipeline] Failed to compute feature ${featureDef.name}:`, error);
          errors.push(`Failed to compute ${featureDef.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Calculate quality metrics
      const quality = this.calculateFeatureQuality(features, featureSet.features);

      // Create result
      const result: FeatureExtractionResult = {
        entityId: config.entityId,
        features,
        extractedAt: new Date().toISOString(),
        quality,
        warnings,
        errors
      };

      // Cache result
      this.computationCache.set(cacheKey, result);

      // Update feature store
      this.updateFeatureStore(result);

      return result;
    } catch (error) {
      console.error('[FeaturePipeline] Feature extraction failed:', error);
      throw error;
    }
  }

  // Compute individual feature
  private async computeFeature(
    featureDef: FeatureDefinition,
    rawData: Record<string, unknown>,
    config: FeatureExtractionConfig
  ): Promise<unknown> {
    try {
      // Get source value
      let value = this.getSourceValue(featureDef.source, rawData);

      // Apply transformations
      if (featureDef.transformation) {
        value = await this.applyTransformation(value, featureDef.transformation);
      }

      // Apply aggregations
      if (featureDef.aggregation) {
        value = await this.applyAggregation(value, featureDef.aggregation, config);
      }

      // Validate feature
      if (featureDef.validation) {
        this.validateFeature(value, featureDef.validation);
      }

      return value;
    } catch (error) {
      console.error(`[FeaturePipeline] Feature computation failed for ${featureDef.name}:`, error);
      throw error;
    }
  }

  // Apply feature transformation
  private async applyTransformation(value: unknown, transformation: FeatureTransformation): Promise<unknown> {
    switch (transformation.type) {
      case 'normalize':
        return this.normalizeValue(value, transformation.parameters);
      case 'standardize':
        return this.standardizeValue(value, transformation.parameters);
      case 'log':
        return Math.log(Number(value) + 1);
      case 'sqrt':
        return Math.sqrt(Number(value));
      case 'polynomial':
        return this.polynomialTransform(value, transformation.parameters);
      case 'binning':
        return this.binValue(value, transformation.parameters);
      case 'encoding':
        return this.encodeValue(value, transformation.parameters);
      case 'embedding':
        return await this.generateEmbedding(value, transformation.parameters);
      default:
        return value;
    }
  }

  // Apply aggregation
  private async applyAggregation(
    value: unknown,
    aggregation: AggregationConfig,
    config: FeatureExtractionConfig
  ): Promise<unknown> {
    try {
      // Get historical data for aggregation
      const historicalData = await this.getHistoricalData(config, aggregation);

      // Apply each aggregation function
      const results: Record<string, unknown> = {};
      
      for (const func of aggregation.functions) {
        switch (func.name) {
          case 'sum':
            results[func.name] = this.aggregateSum(historicalData);
            break;
          case 'mean':
            results[func.name] = this.aggregateMean(historicalData);
            break;
          case 'count':
            results[func.name] = this.aggregateCount(historicalData);
            break;
          case 'max':
            results[func.name] = this.aggregateMax(historicalData);
            break;
          case 'min':
            results[func.name] = this.aggregateMin(historicalData);
            break;
          case 'std':
            results[func.name] = this.aggregateStd(historicalData);
            break;
          case 'median':
            results[func.name] = this.aggregateMedian(historicalData);
            break;
          case 'percentile':
            results[func.name] = this.aggregatePercentile(historicalData, func.parameters);
            break;
        }
      }

      return aggregation.functions.length === 1 ? 
        Object.values(results)[0] : results;
    } catch (error) {
      console.error('[FeaturePipeline] Aggregation failed:', error);
      return value;
    }
  }

  // Extract raw data for entity
  private async extractRawData(config: FeatureExtractionConfig): Promise<Record<string, unknown>> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user?.profile?.organization_id) {
        throw new Error('User organization not found');
      }

      // Mock data extraction based on entity type
      switch (config.entityType) {
        case 'opportunity':
          return this.getOpportunityData(config.entityId);
        case 'lead':
          return this.getLeadData(config.entityId);
        case 'contact':
          return this.getContactData(config.entityId);
        case 'company':
          return this.getCompanyData(config.entityId);
        case 'activity':
          return this.getActivityData(config.entityId);
        default:
          throw new Error(`Unsupported entity type: ${config.entityType}`);
      }
    } catch (error) {
      console.error('[FeaturePipeline] Raw data extraction failed:', error);
      throw error;
    }
  }

  // Mock data getters (in real implementation, these would query the database)
  private getOpportunityData(opportunityId: string): Record<string, unknown> {
    return {
      id: opportunityId,
      deal_value: 150000,
      stage: 'negotiation',
      created_at: '2024-01-15T10:00:00Z',
      last_activity: '2024-03-10T14:30:00Z',
      meddpicc_score: 85,
      contact_count: 5,
      activity_count: 12,
      days_in_stage: 15,
      days_since_last_activity: 2,
      industry: 'healthcare',
      company_size: 'enterprise',
      decision_maker_engaged: true,
      champion_identified: true,
      economic_buyer_access: true,
      competition_present: false,
      budget_confirmed: true,
      timeline_established: true
    };
  }

  private getLeadData(leadId: string): Record<string, unknown> {
    return {
      id: leadId,
      company_name: 'Acme Corp',
      industry: 'technology',
      company_size: 'mid-market',
      title: 'VP Sales',
      seniority: 'executive',
      email_opens: 8,
      email_clicks: 3,
      website_visits: 15,
      content_downloads: 2,
      webinar_attended: true,
      demo_requested: false,
      intent_score: 72,
      fit_score: 85,
      engagement_score: 68,
      source: 'linkedin',
      created_at: '2024-02-20T09:15:00Z',
      last_engagement: '2024-03-08T16:45:00Z'
    };
  }

  private getContactData(contactId: string): Record<string, unknown> {
    return {
      id: contactId,
      title: 'CTO',
      seniority: 'c-level',
      department: 'technology',
      phone: '+1-555-0123',
      email: 'cto@example.com',
      linkedin_connections: 2500,
      response_rate: 0.75,
      meeting_acceptance_rate: 0.85,
      email_engagement: 0.65,
      last_contact: '2024-03-05T11:20:00Z',
      contact_frequency: 'weekly',
      preferred_channel: 'email',
      timezone: 'EST'
    };
  }

  private getCompanyData(companyId: string): Record<string, unknown> {
    return {
      id: companyId,
      name: 'TechCorp Inc',
      industry: 'software',
      employee_count: 1200,
      annual_revenue: 50000000,
      founded_year: 2010,
      headquarters: 'San Francisco, CA',
      website_traffic: 'high',
      technology_stack: ['salesforce', 'hubspot', 'slack'],
      funding_stage: 'series_c',
      growth_rate: 0.25,
      market_cap: 150000000,
      competition_level: 'medium',
      decision_making_process: 'committee'
    };
  }

  private getActivityData(activityId: string): Record<string, unknown> {
    return {
      id: activityId,
      type: 'call',
      duration: 45,
      outcome: 'positive',
      next_steps: 'demo_scheduled',
      sentiment: 'positive',
      engagement_level: 'high',
      decision_maker_present: true,
      budget_discussed: true,
      timeline_discussed: true,
      competitors_mentioned: false,
      objections_raised: 1,
      questions_asked: 8,
      follow_up_required: true
    };
  }

  // Utility functions for transformations
  private normalizeValue(value: unknown, parameters: Record<string, unknown>): number {
    const num = Number(value);
    const min = Number(parameters.min) || 0;
    const max = Number(parameters.max) || 1;
    return (num - min) / (max - min);
  }

  private standardizeValue(value: unknown, parameters: Record<string, unknown>): number {
    const num = Number(value);
    const mean = Number(parameters.mean) || 0;
    const std = Number(parameters.std) || 1;
    return (num - mean) / std;
  }

  private polynomialTransform(value: unknown, parameters: Record<string, unknown>): number {
    const num = Number(value);
    const degree = Number(parameters.degree) || 2;
    return Math.pow(num, degree);
  }

  private binValue(value: unknown, parameters: Record<string, unknown>): string {
    const num = Number(value);
    const bins = parameters.bins as number[] || [0, 0.5, 1];
    
    for (let i = 0; i < bins.length - 1; i++) {
      if (num >= bins[i] && num < bins[i + 1]) {
        return `bin_${i}`;
      }
    }
    return `bin_${bins.length - 1}`;
  }

  private encodeValue(value: unknown, parameters: Record<string, unknown>): unknown {
    const encoding = parameters.encoding as string || 'one_hot';
    
    if (encoding === 'one_hot') {
      const categories = parameters.categories as string[] || [];
      const result: Record<string, number> = {};
      categories.forEach(cat => {
        result[`${cat}_encoded`] = value === cat ? 1 : 0;
      });
      return result;
    }
    
    if (encoding === 'label') {
      const mapping = parameters.mapping as Record<string, number> || {};
      return mapping[String(value)] || 0;
    }
    
    return value;
  }

  private async generateEmbedding(value: unknown, parameters: Record<string, unknown>): Promise<number[]> {
    // Mock embedding generation
    const dimension = Number(parameters.dimension) || 128;
    return Array.from({ length: dimension }, () => Math.random() - 0.5);
  }

  // Aggregation functions
  private aggregateSum(data: unknown[]): number {
    return data.reduce<number>((sum, val) => sum + Number(val), 0);
  }

  private aggregateMean(data: unknown[]): number {
    return data.length > 0 ? this.aggregateSum(data) / data.length : 0;
  }

  private aggregateCount(data: unknown[]): number {
    return data.length;
  }

  private aggregateMax(data: unknown[]): number {
    return Math.max(...data.map(val => Number(val)));
  }

  private aggregateMin(data: unknown[]): number {
    return Math.min(...data.map(val => Number(val)));
  }

  private aggregateStd(data: unknown[]): number {
    const mean = this.aggregateMean(data);
    const varianceSum = data.reduce((sum: number, val) => {
      return sum + Math.pow(Number(val) - mean, 2);
    }, 0);
    const variance = Number(varianceSum) / data.length;
    return Math.sqrt(variance);
  }

  private aggregateMedian(data: unknown[]): number {
    const sorted = data.map(val => Number(val)).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private aggregatePercentile(data: unknown[], parameters?: Record<string, unknown>): number {
    const percentile = Number(parameters?.percentile) || 50;
    const sorted = data.map(val => Number(val)).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  // Utility functions
  private getSourceValue(source: string, data: Record<string, unknown>): unknown {
    const parts = source.split('.');
    let value: unknown = data;
    
    for (const part of parts) {
      value = (value as Record<string, unknown>)?.[part];
      if (value === undefined) break;
    }
    
    return value;
  }

  private validateFeature(value: unknown, validation: FeatureValidation): void {
    if (validation.required && (value === null || value === undefined)) {
      throw new Error('Required feature is missing');
    }

    if (typeof value === 'number') {
      if (validation.minValue !== undefined && value < validation.minValue) {
        throw new Error(`Value ${value} is below minimum ${validation.minValue}`);
      }
      if (validation.maxValue !== undefined && value > validation.maxValue) {
        throw new Error(`Value ${value} is above maximum ${validation.maxValue}`);
      }
    }

    if (validation.allowedValues && !validation.allowedValues.includes(value)) {
      throw new Error(`Value ${value} is not in allowed values`);
    }

    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        throw new Error(`Value ${value} does not match pattern ${validation.pattern}`);
      }
    }
  }

  private calculateFeatureQuality(features: Record<string, unknown>, definitions: FeatureDefinition[]): FeatureQuality {
    const totalFeatures = definitions.length;
    const extractedFeatures = Object.keys(features).length;
    const nullFeatures = Object.values(features).filter(val => val === null || val === undefined).length;

    return {
      completeness: extractedFeatures / totalFeatures,
      validity: (extractedFeatures - nullFeatures) / extractedFeatures || 0,
      consistency: 1.0, // Mock value
      accuracy: 0.95, // Mock value
      freshness: 1.0, // Mock value
      issues: nullFeatures > 0 ? [`${nullFeatures} features have null values`] : []
    };
  }

  private async getHistoricalData(_config: FeatureExtractionConfig, _aggregation: AggregationConfig): Promise<unknown[]> {
    // Mock historical data - in real implementation, this would query the database
    return Array.from({ length: 30 }, (_, _i) => Math.random() * 100);
  }

  private getCacheKey(config: FeatureExtractionConfig): string {
    return `${config.entityType}_${config.entityId}_${config.featureSet}`;
  }

  private isCacheValid(result: FeatureExtractionResult): boolean {
    const age = Date.now() - new Date(result.extractedAt).getTime();
    return age < this.cacheExpiry;
  }

  private updateFeatureStore(result: FeatureExtractionResult): void {
    Object.entries(result.features).forEach(([name, value]) => {
      this.featureStore.features.set(name, {
        name,
        value,
        timestamp: result.extractedAt,
        source: 'pipeline',
        version: '1.0.0'
      });
    });
    this.featureStore.lastUpdated = new Date().toISOString();
  }

  private initializeDefaultFeatureSets(): void {
    // Initialize default feature sets for different entity types
    this.featureSets.set('opportunity_features', {
      id: 'opportunity_features',
      name: 'Opportunity Feature Set',
      description: 'Standard features for opportunity analysis',
      features: [
        {
          name: 'deal_value_normalized',
          type: 'numerical',
          source: 'deal_value',
          transformation: {
            type: 'normalize',
            parameters: { min: 0, max: 1000000 }
          },
          description: 'Normalized deal value',
          tags: ['financial', 'deal']
        },
        {
          name: 'stage_duration_days',
          type: 'numerical',
          source: 'days_in_stage',
          description: 'Number of days in current stage',
          tags: ['temporal', 'stage']
        },
        {
          name: 'meddpicc_score_scaled',
          type: 'numerical',
          source: 'meddpicc_score',
          transformation: {
            type: 'standardize',
            parameters: { mean: 50, std: 20 }
          },
          description: 'Standardized MEDDPICC score',
          tags: ['qualification', 'scoring']
        }
      ],
      version: '1.0.0',
      status: 'active',
      organizationId: '',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  private startBackgroundProcessing(): void {
    // Background processing for feature updates
    setInterval(() => {
      this.cleanupCache();
      this.updateFeatureStatistics();
    }, 60000); // Every minute
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, result] of this.computationCache) {
      const age = now - new Date(result.extractedAt).getTime();
      if (age > this.cacheExpiry) {
        this.computationCache.delete(key);
      }
    }
  }

  private updateFeatureStatistics(): void {
    // Update feature statistics in background
    console.log('[FeaturePipeline] Updating feature statistics...');
  }

  // Public API methods
  async getFeatureSet(id: string): Promise<FeatureSet | null> {
    return this.featureSets.get(id) || null;
  }

  async listFeatureSets(): Promise<FeatureSet[]> {
    return Array.from(this.featureSets.values());
  }

  async createFeatureSet(featureSet: Omit<FeatureSet, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeatureSet> {
    const id = `fs_${Date.now()}`;
    const newFeatureSet: FeatureSet = {
      ...featureSet,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.featureSets.set(id, newFeatureSet);
    return newFeatureSet;
  }

  getFeatureStore(): FeatureStore {
    return { ...this.featureStore };
  }
}

// Export singleton instance
export const featurePipeline = FeaturePipeline.getInstance();