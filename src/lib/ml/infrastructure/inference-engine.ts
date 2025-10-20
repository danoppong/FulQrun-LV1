// src/lib/ml/infrastructure/inference-engine.ts
// Inference Engine for Phase 2.9
// Provides real-time ML model predictions with caching and monitoring

import { featurePipeline, type FeatureExtractionConfig } from '../pipeline/feature-pipeline';
import { modelRegistry, type RegisteredModel } from './model-registry';

export interface PredictionRequest {
  modelId: string;
  version?: string;
  inputs: Record<string, unknown>;
  entityId?: string;
  entityType?: 'opportunity' | 'lead' | 'contact' | 'company' | 'activity';
  extractFeatures?: boolean;
  featureSet?: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
}

export interface PredictionResponse {
  requestId: string;
  modelId: string;
  version: string;
  prediction: unknown;
  confidence?: number;
  probability?: number[];
  explainability?: FeatureExplanation[];
  processingTime: number;
  timestamp: string;
  metadata: PredictionMetadata;
  warnings?: string[];
  errors?: string[];
}

export interface FeatureExplanation {
  feature: string;
  importance: number;
  contribution: number;
  value: unknown;
}

export interface PredictionMetadata {
  inputCount: number;
  featureCount: number;
  cacheHit: boolean;
  modelLoadTime?: number;
  featureExtractionTime?: number;
  inferenceTime: number;
  postProcessingTime?: number;
}

export interface BatchPredictionRequest {
  modelId: string;
  version?: string;
  inputs: Record<string, unknown>[];
  batchSize?: number;
  parallel?: boolean;
  metadata?: Record<string, unknown>;
}

export interface BatchPredictionResponse {
  batchId: string;
  modelId: string;
  version: string;
  predictions: PredictionResponse[];
  batchMetadata: BatchMetadata;
  status: 'processing' | 'completed' | 'partial' | 'failed';
  completedAt?: string;
}

export interface BatchMetadata {
  totalRequests: number;
  successfulPredictions: number;
  failedPredictions: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
  batchSize: number;
}

export interface ModelPredictionStats {
  modelId: string;
  version: string;
  totalPredictions: number;
  successfulPredictions: number;
  failedPredictions: number;
  averageLatency: number;
  averageConfidence: number;
  lastPredictionAt: string;
  errorRate: number;
}

export interface InferenceConfig {
  cacheEnabled: boolean;
  cacheTTL: number; // seconds
  maxBatchSize: number;
  timeoutMs: number;
  retryAttempts: number;
  enableExplainability: boolean;
  enableMonitoring: boolean;
  parallelism: number;
}

export interface CachedPrediction {
  inputHash: string;
  prediction: PredictionResponse;
  cachedAt: string;
  expiresAt: string;
  hitCount: number;
}

export class InferenceEngine {
  private static instance: InferenceEngine;
  private config: InferenceConfig;
  private predictionCache = new Map<string, CachedPrediction>();
  private loadedModels = new Map<string, LoadedModel>();
  private predictionStats = new Map<string, ModelPredictionStats>();
  private batchJobs = new Map<string, BatchPredictionResponse>();

  static getInstance(config?: Partial<InferenceConfig>): InferenceEngine {
    if (!InferenceEngine.instance) {
      InferenceEngine.instance = new InferenceEngine(config);
    }
    return InferenceEngine.instance;
  }

  private constructor(config: Partial<InferenceConfig> = {}) {
    this.config = {
      cacheEnabled: config.cacheEnabled ?? true,
      cacheTTL: config.cacheTTL ?? 300, // 5 minutes
      maxBatchSize: config.maxBatchSize ?? 100,
      timeoutMs: config.timeoutMs ?? 30000, // 30 seconds
      retryAttempts: config.retryAttempts ?? 3,
      enableExplainability: config.enableExplainability ?? true,
      enableMonitoring: config.enableMonitoring ?? true,
      parallelism: config.parallelism ?? 4,
      ...config
    };

    this.startCleanupWorker();
  }

  // Make a single prediction
  async predict(request: PredictionRequest): Promise<PredictionResponse> {
    const startTime = Date.now();
    const requestId = request.requestId || this.generateRequestId();

    try {
      console.log(`[InferenceEngine] Processing prediction request: ${requestId}`);

      // Validate request
      this.validatePredictionRequest(request);

      // Check cache first
      if (this.config.cacheEnabled) {
        const cached = this.getCachedPrediction(request);
        if (cached) {
          console.log(`[InferenceEngine] Cache hit for request: ${requestId}`);
          return {
            ...cached.prediction,
            requestId,
            metadata: {
              ...cached.prediction.metadata,
              cacheHit: true
            }
          };
        }
      }

      // Extract features if needed
      let inputs = request.inputs;
      let featureExtractionTime = 0;

      if (request.extractFeatures && request.entityId && request.entityType && request.featureSet) {
        const featureStart = Date.now();
        const featureConfig: FeatureExtractionConfig = {
          entityId: request.entityId,
          entityType: request.entityType,
          featureSet: request.featureSet,
          includeHistorical: true,
          realTime: true
        };

        const features = await featurePipeline.extractFeatures(featureConfig);
        inputs = { ...inputs, ...features.features };
        featureExtractionTime = Date.now() - featureStart;
      }

      // Load model
      const modelLoadStart = Date.now();
      const model = await this.loadModel(request.modelId, request.version);
      const modelLoadTime = Date.now() - modelLoadStart;

      // Make prediction
      const inferenceStart = Date.now();
      const result = await this.runInference(model, inputs);
      const inferenceTime = Date.now() - inferenceStart;

      // Post-process results
      const postProcessStart = Date.now();
      const prediction = await this.postProcessPrediction(result, model, inputs);
      const postProcessingTime = Date.now() - postProcessStart;

      // Generate explainability
      let explainability: FeatureExplanation[] | undefined;
      if (this.config.enableExplainability) {
        explainability = await this.generateExplainability(model, inputs, prediction);
      }

      // Create response
      const response: PredictionResponse = {
        requestId,
        modelId: request.modelId,
        version: model.getVersion(),
        prediction: prediction.value,
        confidence: prediction.confidence,
        probability: prediction.probability,
        explainability,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        metadata: {
          inputCount: Object.keys(inputs).length,
          featureCount: Object.keys(inputs).length,
          cacheHit: false,
          modelLoadTime,
          featureExtractionTime: featureExtractionTime > 0 ? featureExtractionTime : undefined,
          inferenceTime,
          postProcessingTime
        },
        warnings: prediction.warnings,
        errors: prediction.errors
      };

      // Cache the result
      if (this.config.cacheEnabled) {
        this.cachePrediction(request, response);
      }

      // Update statistics
      if (this.config.enableMonitoring) {
        this.updatePredictionStats(response);
      }

      console.log(`[InferenceEngine] Prediction completed: ${requestId} in ${response.processingTime}ms`);
      return response;

    } catch (error) {
      console.error(`[InferenceEngine] Prediction failed: ${requestId}:`, error);
      
      // Create error response
      return {
        requestId,
        modelId: request.modelId,
        version: request.version || 'unknown',
        prediction: null,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        metadata: {
          inputCount: Object.keys(request.inputs).length,
          featureCount: 0,
          cacheHit: false,
          inferenceTime: 0
        },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // Make batch predictions
  async predictBatch(request: BatchPredictionRequest): Promise<BatchPredictionResponse> {
    const batchId = this.generateBatchId();
    const startTime = Date.now();

    try {
      console.log(`[InferenceEngine] Processing batch prediction: ${batchId}`);

      // Validate batch request
      this.validateBatchRequest(request);

      // Initialize batch response
      const batchResponse: BatchPredictionResponse = {
        batchId,
        modelId: request.modelId,
        version: request.version || 'latest',
        predictions: [],
        batchMetadata: {
          totalRequests: request.inputs.length,
          successfulPredictions: 0,
          failedPredictions: 0,
          averageProcessingTime: 0,
          totalProcessingTime: 0,
          batchSize: request.batchSize || request.inputs.length
        },
        status: 'processing'
      };

      this.batchJobs.set(batchId, batchResponse);

      // Process in batches
      const batchSize = Math.min(request.batchSize || this.config.maxBatchSize, request.inputs.length);
      const batches = this.chunkArray(request.inputs, batchSize);
      
      for (const batch of batches) {
        const batchPredictions = request.parallel 
          ? await this.processBatchParallel(request.modelId, request.version, batch)
          : await this.processBatchSequential(request.modelId, request.version, batch);

        batchResponse.predictions.push(...batchPredictions);
        
        // Update statistics
        batchPredictions.forEach(pred => {
          if (pred.errors && pred.errors.length > 0) {
            batchResponse.batchMetadata.failedPredictions++;
          } else {
            batchResponse.batchMetadata.successfulPredictions++;
          }
        });
      }

      // Finalize batch
      const totalTime = Date.now() - startTime;
      batchResponse.batchMetadata.totalProcessingTime = totalTime;
      batchResponse.batchMetadata.averageProcessingTime = 
        totalTime / batchResponse.predictions.length;
      batchResponse.status = 'completed';
      batchResponse.completedAt = new Date().toISOString();

      this.batchJobs.set(batchId, batchResponse);

      console.log(`[InferenceEngine] Batch prediction completed: ${batchId}`);
      return batchResponse;

    } catch (error) {
      console.error(`[InferenceEngine] Batch prediction failed: ${batchId}:`, error);
      
      const batchResponse = this.batchJobs.get(batchId);
      if (batchResponse) {
        batchResponse.status = 'failed';
        this.batchJobs.set(batchId, batchResponse);
      }
      
      throw error;
    }
  }

  // Get prediction statistics
  async getPredictionStats(modelId: string): Promise<ModelPredictionStats | null> {
    return this.predictionStats.get(modelId) || null;
  }

  // Get batch job status
  async getBatchStatus(batchId: string): Promise<BatchPredictionResponse | null> {
    return this.batchJobs.get(batchId) || null;
  }

  // Get cache statistics
  getCacheStats(): Record<string, number> {
    const now = Date.now();
    const validEntries = Array.from(this.predictionCache.values())
      .filter(entry => new Date(entry.expiresAt).getTime() > now);

    return {
      totalEntries: this.predictionCache.size,
      validEntries: validEntries.length,
      totalHits: validEntries.reduce((sum, entry) => sum + entry.hitCount, 0),
      hitRate: validEntries.length > 0 ? 
        validEntries.reduce((sum, entry) => sum + entry.hitCount, 0) / validEntries.length : 0
    };
  }

  // Private methods

  private validatePredictionRequest(request: PredictionRequest): void {
    if (!request.modelId) {
      throw new Error('Model ID is required');
    }

    if (!request.inputs || Object.keys(request.inputs).length === 0) {
      throw new Error('Inputs are required');
    }

    if (request.extractFeatures && (!request.entityId || !request.entityType || !request.featureSet)) {
      throw new Error('Entity ID, type, and feature set are required for feature extraction');
    }
  }

  private validateBatchRequest(request: BatchPredictionRequest): void {
    if (!request.modelId) {
      throw new Error('Model ID is required');
    }

    if (!request.inputs || request.inputs.length === 0) {
      throw new Error('Batch inputs are required');
    }

    if (request.inputs.length > this.config.maxBatchSize) {
      throw new Error(`Batch size exceeds maximum: ${this.config.maxBatchSize}`);
    }
  }

  private async loadModel(modelId: string, version?: string): Promise<LoadedModel> {
    const cacheKey = `${modelId}_${version || 'latest'}`;
    
    // Check if model is already loaded
    const cached = this.loadedModels.get(cacheKey);
    if (cached && cached.isValid()) {
      return cached;
    }

    // Load model from registry
    const model = await modelRegistry.getModel(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    const targetVersion = version || model.latestVersion;
    const modelVersion = await modelRegistry.getModelVersion(modelId, targetVersion);
    if (!modelVersion) {
      throw new Error(`Model version not found: ${modelId}@${targetVersion}`);
    }

    // Create loaded model instance
    const loadedModel = new LoadedModel(model, modelVersion as ModelVersion);
    await loadedModel.initialize();

    this.loadedModels.set(cacheKey, loadedModel);
    return loadedModel;
  }

  private async runInference(model: LoadedModel, inputs: Record<string, unknown>): Promise<InferenceResult> {
    try {
      // Preprocess inputs
      const processedInputs = await model.preprocessInputs(inputs);

      // Run model inference
      const rawOutput = await model.predict(processedInputs);

      // Postprocess outputs
      const result = await model.postprocessOutputs(rawOutput);

      return {
        value: result.prediction,
        confidence: result.confidence,
        probability: result.probability,
        warnings: result.warnings,
        errors: result.errors
      };
    } catch (error) {
      console.error('[InferenceEngine] Inference failed:', error);
      throw error;
    }
  }

  private async postProcessPrediction(result: InferenceResult, model: LoadedModel, _inputs: Record<string, unknown>): Promise<InferenceResult> {
    // Apply business rules and validation
    const processedResult = { ...result };

    // Validate prediction bounds
    if (typeof result.value === 'number') {
      const metadata = model.getMetadata();
      const target = metadata.target as { type?: string; range?: number[] };
      if (target && target.type === 'numerical' && target.range) {
        const [min, max] = target.range;
        if (result.value < min || result.value > max) {
          processedResult.warnings = [
            ...(processedResult.warnings || []),
            `Prediction ${result.value} is outside expected range [${min}, ${max}]`
          ];
        }
      }
    }

    // Add confidence thresholds
    if (result.confidence !== undefined && result.confidence < 0.5) {
      processedResult.warnings = [
        ...(processedResult.warnings || []),
        `Low confidence prediction: ${result.confidence}`
      ];
    }

    return processedResult;
  }

  private async generateExplainability(model: LoadedModel, inputs: Record<string, unknown>, prediction: InferenceResult): Promise<FeatureExplanation[]> {
    try {
      // Simple feature importance-based explanation
      const metadata = model.getMetadata();
      const explanations: FeatureExplanation[] = [];

      const features = metadata.features as { name: string; importance?: number }[] || [];
      for (const feature of features) {
        if (inputs[feature.name] !== undefined) {
          explanations.push({
            feature: feature.name,
            importance: feature.importance || 0,
            contribution: this.calculateFeatureContribution(feature, inputs[feature.name], prediction),
            value: inputs[feature.name]
          });
        }
      }

      // Sort by importance
      explanations.sort((a, b) => b.importance - a.importance);
      
      return explanations.slice(0, 10); // Top 10 features
    } catch (error) {
      console.error('[InferenceEngine] Explainability generation failed:', error);
      return [];
    }
  }

  private calculateFeatureContribution(feature: { name: string; importance?: number }, value: unknown, prediction: InferenceResult): number {
    // Simple mock contribution calculation
    const normalizedValue = typeof value === 'number' ? value / 100 : 0.5;
    const importance = feature.importance || 0;
    return normalizedValue * importance * (typeof prediction.value === 'number' ? prediction.value : 1);
  }

  private getCachedPrediction(request: PredictionRequest): CachedPrediction | null {
    const hash = this.hashInputs(request.inputs);
    const cached = this.predictionCache.get(hash);

    if (cached && new Date(cached.expiresAt).getTime() > Date.now()) {
      cached.hitCount++;
      return cached;
    }

    return null;
  }

  private cachePrediction(request: PredictionRequest, response: PredictionResponse): void {
    const hash = this.hashInputs(request.inputs);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.cacheTTL * 1000);

    this.predictionCache.set(hash, {
      inputHash: hash,
      prediction: response,
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      hitCount: 0
    });
  }

  private updatePredictionStats(response: PredictionResponse): void {
    const key = `${response.modelId}_${response.version}`;
    const existing = this.predictionStats.get(key);

    if (existing) {
      existing.totalPredictions++;
      if (response.errors && response.errors.length > 0) {
        existing.failedPredictions++;
      } else {
        existing.successfulPredictions++;
      }
      existing.averageLatency = (existing.averageLatency + response.processingTime) / 2;
      if (response.confidence) {
        existing.averageConfidence = (existing.averageConfidence + response.confidence) / 2;
      }
      existing.lastPredictionAt = response.timestamp;
      existing.errorRate = existing.failedPredictions / existing.totalPredictions;
    } else {
      this.predictionStats.set(key, {
        modelId: response.modelId,
        version: response.version,
        totalPredictions: 1,
        successfulPredictions: response.errors && response.errors.length > 0 ? 0 : 1,
        failedPredictions: response.errors && response.errors.length > 0 ? 1 : 0,
        averageLatency: response.processingTime,
        averageConfidence: response.confidence || 0,
        lastPredictionAt: response.timestamp,
        errorRate: response.errors && response.errors.length > 0 ? 1 : 0
      });
    }
  }

  private async processBatchParallel(modelId: string, version: string | undefined, inputs: Record<string, unknown>[]): Promise<PredictionResponse[]> {
    const promises = inputs.map(input => 
      this.predict({
        modelId,
        version,
        inputs: input
      })
    );

    return Promise.all(promises);
  }

  private async processBatchSequential(modelId: string, version: string | undefined, inputs: Record<string, unknown>[]): Promise<PredictionResponse[]> {
    const results: PredictionResponse[] = [];
    
    for (const input of inputs) {
      const result = await this.predict({
        modelId,
        version,
        inputs: input
      });
      results.push(result);
    }

    return results;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private hashInputs(inputs: Record<string, unknown>): string {
    // Simple hash function for caching
    const str = JSON.stringify(inputs, Object.keys(inputs).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startCleanupWorker(): void {
    setInterval(() => {
      this.cleanupCache();
      this.cleanupBatchJobs();
    }, 60000); // Every minute
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [hash, cached] of this.predictionCache) {
      if (new Date(cached.expiresAt).getTime() <= now) {
        this.predictionCache.delete(hash);
      }
    }
  }

  private cleanupBatchJobs(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    for (const [batchId, job] of this.batchJobs) {
      if (job.completedAt && new Date(job.completedAt).getTime() < cutoff) {
        this.batchJobs.delete(batchId);
      }
    }
  }
}

// Supporting classes and interfaces

interface InferenceResult {
  value: unknown;
  confidence?: number;
  probability?: number[];
  warnings?: string[];
  errors?: string[];
}

interface ModelVersion {
  version: string;
  metadata?: Record<string, unknown>;
}

interface PredictionOutput {
  prediction: unknown;
  confidence?: number;
  probability?: number[];
  warnings?: string[];
  errors?: string[];
}

class LoadedModel {
  private model: RegisteredModel;
  private version: ModelVersion;
  private loadedAt: Date;

  constructor(model: RegisteredModel, version: ModelVersion) {
    this.model = model;
    this.version = version;
    this.loadedAt = new Date();
  }

  async initialize(): Promise<void> {
    // Mock model initialization
    console.log(`[LoadedModel] Initializing model ${this.model.id}@${this.version.version}`);
  }

  isValid(): boolean {
    const maxAge = 30 * 60 * 1000; // 30 minutes
    return Date.now() - this.loadedAt.getTime() < maxAge;
  }

  getVersion(): string {
    return this.version.version;
  }

  async preprocessInputs(inputs: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Mock preprocessing
    return { ...inputs };
  }

  async predict(_inputs: Record<string, unknown>): Promise<PredictionOutput> {
    // Mock prediction
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 40));
    
    if (this.model.modelType === 'classification') {
      return {
        prediction: Math.random() > 0.5 ? 1 : 0,
        confidence: 0.7 + Math.random() * 0.3,
        probability: [0.3 + Math.random() * 0.4, 0.3 + Math.random() * 0.4]
      };
    } else {
      return {
        prediction: Math.random() * 100,
        confidence: 0.8 + Math.random() * 0.2
      };
    }
  }

  async postprocessOutputs(outputs: PredictionOutput): Promise<PredictionOutput> {
    // Mock postprocessing
    return outputs;
  }

  getMetadata(): Record<string, unknown> {
    return (this.model.metadata as unknown as Record<string, unknown>) || {};
  }
}

// Export singleton instance
export const inferenceEngine = InferenceEngine.getInstance();