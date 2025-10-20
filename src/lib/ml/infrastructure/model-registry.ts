// src/lib/ml/infrastructure/model-registry.ts
// Model Registry for Phase 2.9
// Provides model versioning, metadata management, and lifecycle tracking

import { AuthService } from '@/lib/auth-unified';

export interface RegisteredModel {
  id: string;
  name: string;
  description: string;
  modelType: 'regression' | 'classification' | 'time_series' | 'ensemble' | 'neural_network';
  framework: 'tensorflow' | 'scikit-learn' | 'pytorch' | 'custom';
  status: 'development' | 'staging' | 'production' | 'archived' | 'deprecated';
  currentVersion: string;
  latestVersion: string;
  tags: string[];
  metadata: ModelMetadata;
  versions: ModelVersion[];
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModelVersion {
  version: string;
  modelId: string;
  status: 'training' | 'trained' | 'validated' | 'deployed' | 'failed' | 'archived';
  metrics: ModelMetrics;
  artifacts: ModelArtifacts;
  configuration: ModelConfiguration;
  trainingInfo: TrainingInfo;
  deployment?: DeploymentInfo;
  experiments: ExperimentInfo[];
  dependencies: ModelDependency[];
  changelog: string;
  createdAt: string;
  createdBy: string;
}

export interface ModelMetadata {
  inputSchema: SchemaDefinition;
  outputSchema: SchemaDefinition;
  features: FeatureInfo[];
  target: TargetInfo;
  businessContext: BusinessContext;
  compliance: ComplianceInfo;
  performance: PerformanceRequirements;
}

export interface ModelMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  auc?: number;
  rmse?: number;
  mae?: number;
  r2Score?: number;
  confusion_matrix?: number[][];
  feature_importance?: Record<string, number>;
  cross_validation?: CrossValidationMetrics;
  custom_metrics?: Record<string, number>;
}

export interface ModelArtifacts {
  modelPath: string;
  weightsPath?: string;
  configPath: string;
  preprocessorPath?: string;
  scalerPath?: string;
  encoderPath?: string;
  metadataPath: string;
  checksum: string;
  size: number;
  format: 'json' | 'h5' | 'pb' | 'pkl' | 'onnx';
}

export interface ModelConfiguration {
  algorithm: string;
  hyperparameters: Record<string, unknown>;
  preprocessing: PreprocessingConfig[];
  feature_engineering: FeatureEngineeringConfig[];
  validation_strategy: ValidationConfig;
  training_config: Record<string, unknown>;
}

export interface TrainingInfo {
  datasetId: string;
  datasetSize: number;
  trainingDuration: number;
  epochs?: number;
  batchSize?: number;
  hardwareUsed: HardwareInfo;
  resourceConsumption: ResourceUsage;
  convergenceInfo?: ConvergenceInfo;
}

export interface DeploymentInfo {
  environment: 'development' | 'staging' | 'production';
  deploymentType: 'batch' | 'online' | 'edge' | 'hybrid';
  endpoint?: string;
  scalingConfig: ScalingConfig;
  monitoring: MonitoringConfig;
  deployedAt: string;
  deployedBy: string;
  healthStatus: 'healthy' | 'degraded' | 'failed';
  lastHealthCheck: string;
}

export interface ExperimentInfo {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  metrics: Record<string, number>;
  status: 'running' | 'completed' | 'failed' | 'aborted';
  startTime: string;
  endTime?: string;
  artifacts: string[];
}

export interface ModelDependency {
  name: string;
  version: string;
  type: 'library' | 'model' | 'dataset' | 'service';
  source: string;
  critical: boolean;
}

export interface SchemaDefinition {
  type: 'object' | 'array' | 'number' | 'string' | 'boolean';
  properties?: Record<string, SchemaDefinition>;
  items?: SchemaDefinition;
  required?: string[];
  format?: string;
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
}

export interface FeatureInfo {
  name: string;
  type: 'numerical' | 'categorical' | 'temporal' | 'text' | 'embedding';
  description: string;
  importance?: number;
  nullable: boolean;
  defaultValue?: unknown;
}

export interface TargetInfo {
  name: string;
  type: 'numerical' | 'categorical' | 'binary';
  description: string;
  classes?: string[];
  range?: [number, number];
}

export interface BusinessContext {
  useCase: string;
  businessMetric: string;
  stakeholders: string[];
  successCriteria: string[];
  constraints: string[];
  ethicalConsiderations: string[];
}

export interface ComplianceInfo {
  dataPrivacy: string[];
  regulations: string[];
  auditTrail: boolean;
  explainability: 'required' | 'optional' | 'not_required';
  biasMonitoring: boolean;
}

export interface PerformanceRequirements {
  latency: number; // milliseconds
  throughput: number; // predictions per second
  availability: number; // percentage
  accuracy: number; // minimum accuracy threshold
  memory: number; // MB
  cpu: number; // CPU cores
}

export interface CrossValidationMetrics {
  folds: number;
  strategy: string;
  scores: number[];
  mean: number;
  std: number;
}

export interface PreprocessingConfig {
  step: string;
  parameters: Record<string, unknown>;
  order: number;
}

export interface FeatureEngineeringConfig {
  transformation: string;
  parameters: Record<string, unknown>;
  features: string[];
}

export interface ValidationConfig {
  method: 'holdout' | 'k_fold' | 'time_series' | 'custom';
  parameters: Record<string, unknown>;
}

export interface HardwareInfo {
  cpuCores: number;
  memoryGB: number;
  gpuCount: number;
  gpuType?: string;
  storageGB: number;
}

export interface ResourceUsage {
  peakMemoryMB: number;
  avgCpuUsage: number;
  totalGpuHours?: number;
  networkIO: number;
  storageIO: number;
}

export interface ConvergenceInfo {
  converged: boolean;
  finalLoss: number;
  bestEpoch?: number;
  earlyStoppingReason?: string;
}

export interface ScalingConfig {
  minInstances: number;
  maxInstances: number;
  targetCpuUtilization: number;
  targetMemoryUtilization: number;
  scaleUpPolicy: ScalingPolicy;
  scaleDownPolicy: ScalingPolicy;
}

export interface ScalingPolicy {
  cooldownPeriod: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  incrementSize: number;
}

export interface MonitoringConfig {
  metricsCollection: boolean;
  loggingLevel: 'debug' | 'info' | 'warn' | 'error';
  alerting: AlertingConfig[];
  dashboardUrl?: string;
}

export interface AlertingConfig {
  metric: string;
  threshold: number;
  condition: 'above' | 'below' | 'equals';
  action: 'email' | 'slack' | 'webhook';
  recipients: string[];
}

export interface ModelRegistryQuery {
  modelType?: string;
  status?: string;
  tags?: string[];
  createdAfter?: string;
  createdBefore?: string;
  organizationId?: string;
  limit?: number;
  offset?: number;
}

export interface ModelVersionQuery {
  modelId: string;
  status?: string;
  versionRange?: {
    min: string;
    max: string;
  };
  limit?: number;
  offset?: number;
}

export class ModelRegistry {
  private static instance: ModelRegistry;
  private models = new Map<string, RegisteredModel>();
  private versions = new Map<string, ModelVersion[]>();

  static getInstance(): ModelRegistry {
    if (!ModelRegistry.instance) {
      ModelRegistry.instance = new ModelRegistry();
    }
    return ModelRegistry.instance;
  }

  private constructor() {
    this.initializeRegistry();
  }

  // Register a new model
  async registerModel(model: Omit<RegisteredModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<RegisteredModel> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user?.profile?.organization_id) {
        throw new Error('User organization not found');
      }

      const id = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const registeredModel: RegisteredModel = {
        ...model,
        id,
        organizationId: user.profile.organization_id,
        createdBy: user.id,
        createdAt: now,
        updatedAt: now
      };

      this.models.set(id, registeredModel);
      this.versions.set(id, []);

      console.log(`[ModelRegistry] Registered model: ${id}`);
      return registeredModel;
    } catch (error) {
      console.error('[ModelRegistry] Failed to register model:', error);
      throw error;
    }
  }

  // Register a new model version
  async registerVersion(modelId: string, version: Omit<ModelVersion, 'modelId' | 'createdAt' | 'createdBy'>): Promise<ModelVersion> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const model = this.models.get(modelId);
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }

      const modelVersion: ModelVersion = {
        ...version,
        modelId,
        createdAt: new Date().toISOString(),
        createdBy: user.id
      };

      const versions = this.versions.get(modelId) || [];
      
      // Check for version conflicts
      const existingVersion = versions.find(v => v.version === version.version);
      if (existingVersion) {
        throw new Error(`Version ${version.version} already exists for model ${modelId}`);
      }

      versions.push(modelVersion);
      versions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      this.versions.set(modelId, versions);

      // Update model's latest version
      model.latestVersion = version.version;
      model.updatedAt = new Date().toISOString();
      this.models.set(modelId, model);

      console.log(`[ModelRegistry] Registered version ${version.version} for model: ${modelId}`);
      return modelVersion;
    } catch (error) {
      console.error('[ModelRegistry] Failed to register version:', error);
      throw error;
    }
  }

  // Get model by ID
  async getModel(modelId: string): Promise<RegisteredModel | null> {
    try {
      const model = this.models.get(modelId);
      if (!model) {
        return null;
      }

      // Check organization access
      const user = await AuthService.getCurrentUser();
      if (user?.profile?.organization_id !== model.organizationId) {
        throw new Error('Access denied to model');
      }

      return model;
    } catch (error) {
      console.error('[ModelRegistry] Failed to get model:', error);
      return null;
    }
  }

  // Get model version
  async getModelVersion(modelId: string, version: string): Promise<ModelVersion | null> {
    try {
      const versions = this.versions.get(modelId) || [];
      const modelVersion = versions.find(v => v.version === version);
      
      if (!modelVersion) {
        return null;
      }

      // Check organization access
      const model = await this.getModel(modelId);
      if (!model) {
        return null;
      }

      return modelVersion;
    } catch (error) {
      console.error('[ModelRegistry] Failed to get model version:', error);
      return null;
    }
  }

  // List models with query
  async listModels(query: ModelRegistryQuery = {}): Promise<RegisteredModel[]> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user?.profile?.organization_id) {
        throw new Error('User organization not found');
      }

      let models = Array.from(this.models.values())
        .filter(model => model.organizationId === user.profile?.organization_id);

      // Apply filters
      if (query.modelType) {
        models = models.filter(model => model.modelType === query.modelType);
      }

      if (query.status) {
        models = models.filter(model => model.status === query.status);
      }

      if (query.tags && query.tags.length > 0) {
        models = models.filter(model => 
          query.tags!.some(tag => model.tags.includes(tag))
        );
      }

      if (query.createdAfter) {
        const afterDate = new Date(query.createdAfter);
        models = models.filter(model => new Date(model.createdAt) >= afterDate);
      }

      if (query.createdBefore) {
        const beforeDate = new Date(query.createdBefore);
        models = models.filter(model => new Date(model.createdAt) <= beforeDate);
      }

      // Sort by creation date (newest first)
      models.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 50;
      return models.slice(offset, offset + limit);
    } catch (error) {
      console.error('[ModelRegistry] Failed to list models:', error);
      return [];
    }
  }

  // List model versions
  async listModelVersions(query: ModelVersionQuery): Promise<ModelVersion[]> {
    try {
      const versions = this.versions.get(query.modelId) || [];

      let filteredVersions = [...versions];

      // Apply filters
      if (query.status) {
        filteredVersions = filteredVersions.filter(version => version.status === query.status);
      }

      if (query.versionRange) {
        filteredVersions = filteredVersions.filter(version => {
          const versionNum = this.parseVersion(version.version);
          const minVersion = this.parseVersion(query.versionRange!.min);
          const maxVersion = this.parseVersion(query.versionRange!.max);
          return versionNum >= minVersion && versionNum <= maxVersion;
        });
      }

      // Sort by version (newest first)
      filteredVersions.sort((a, b) => 
        this.parseVersion(b.version) - this.parseVersion(a.version)
      );

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 20;
      return filteredVersions.slice(offset, offset + limit);
    } catch (error) {
      console.error('[ModelRegistry] Failed to list model versions:', error);
      return [];
    }
  }

  // Update model status
  async updateModelStatus(modelId: string, status: RegisteredModel['status']): Promise<void> {
    try {
      const model = await this.getModel(modelId);
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }

      model.status = status;
      model.updatedAt = new Date().toISOString();
      this.models.set(modelId, model);

      console.log(`[ModelRegistry] Updated model ${modelId} status to: ${status}`);
    } catch (error) {
      console.error('[ModelRegistry] Failed to update model status:', error);
      throw error;
    }
  }

  // Update version status
  async updateVersionStatus(modelId: string, version: string, status: ModelVersion['status']): Promise<void> {
    try {
      const versions = this.versions.get(modelId) || [];
      const versionIndex = versions.findIndex(v => v.version === version);
      
      if (versionIndex === -1) {
        throw new Error(`Version ${version} not found for model ${modelId}`);
      }

      versions[versionIndex].status = status;
      this.versions.set(modelId, versions);

      console.log(`[ModelRegistry] Updated version ${version} status to: ${status}`);
    } catch (error) {
      console.error('[ModelRegistry] Failed to update version status:', error);
      throw error;
    }
  }

  // Promote version to production
  async promoteToProduction(modelId: string, version: string): Promise<void> {
    try {
      // Get current production version and demote it
      const versions = this.versions.get(modelId) || [];
      const currentProd = versions.find(v => v.status === 'deployed');
      if (currentProd) {
        await this.updateVersionStatus(modelId, currentProd.version, 'archived');
      }

      // Promote new version
      await this.updateVersionStatus(modelId, version, 'deployed');
      await this.updateModelStatus(modelId, 'production');

      // Update current version
      const model = await this.getModel(modelId);
      if (model) {
        model.currentVersion = version;
        this.models.set(modelId, model);
      }

      console.log(`[ModelRegistry] Promoted version ${version} to production for model: ${modelId}`);
    } catch (error) {
      console.error('[ModelRegistry] Failed to promote to production:', error);
      throw error;
    }
  }

  // Archive model
  async archiveModel(modelId: string): Promise<void> {
    try {
      await this.updateModelStatus(modelId, 'archived');
      
      // Archive all versions
      const versions = this.versions.get(modelId) || [];
      for (const version of versions) {
        if (version.status !== 'archived') {
          await this.updateVersionStatus(modelId, version.version, 'archived');
        }
      }

      console.log(`[ModelRegistry] Archived model: ${modelId}`);
    } catch (error) {
      console.error('[ModelRegistry] Failed to archive model:', error);
      throw error;
    }
  }

  // Get model lineage
  async getModelLineage(modelId: string): Promise<ModelVersion[]> {
    try {
      const versions = this.versions.get(modelId) || [];
      return versions.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    } catch (error) {
      console.error('[ModelRegistry] Failed to get model lineage:', error);
      return [];
    }
  }

  // Search models by name or description
  async searchModels(searchTerm: string): Promise<RegisteredModel[]> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user?.profile?.organization_id) {
        throw new Error('User organization not found');
      }

      const term = searchTerm.toLowerCase();
      return Array.from(this.models.values())
        .filter(model => 
          model.organizationId === user.profile?.organization_id &&
          (model.name.toLowerCase().includes(term) || 
           model.description.toLowerCase().includes(term) ||
           model.tags.some(tag => tag.toLowerCase().includes(term)))
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      console.error('[ModelRegistry] Failed to search models:', error);
      return [];
    }
  }

  // Get registry statistics
  async getRegistryStats(): Promise<Record<string, number>> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user?.profile?.organization_id) {
        throw new Error('User organization not found');
      }

      const orgModels = Array.from(this.models.values())
        .filter(model => model.organizationId === user.profile?.organization_id);

      const stats = {
        totalModels: orgModels.length,
        productionModels: orgModels.filter(m => m.status === 'production').length,
        stagingModels: orgModels.filter(m => m.status === 'staging').length,
        developmentModels: orgModels.filter(m => m.status === 'development').length,
        archivedModels: orgModels.filter(m => m.status === 'archived').length,
        totalVersions: Array.from(this.versions.values()).flat().length
      };

      return stats;
    } catch (error) {
      console.error('[ModelRegistry] Failed to get registry stats:', error);
      return {};
    }
  }

  // Private utility methods
  private parseVersion(version: string): number {
    const parts = version.split('.').map(Number);
    return parts[0] * 10000 + parts[1] * 100 + parts[2];
  }

  private initializeRegistry(): void {
    // Initialize with sample models for demonstration
    console.log('[ModelRegistry] Initializing model registry...');
    this.loadSampleModels();
  }

  private loadSampleModels(): void {
    // Sample models would be loaded here in a real implementation
    console.log('[ModelRegistry] Loading sample models...');
  }
}

// Export singleton instance
export const modelRegistry = ModelRegistry.getInstance();