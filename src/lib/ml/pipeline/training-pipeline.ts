// src/lib/ml/pipeline/training-pipeline.ts
// Advanced ML Training Pipeline for Phase 2.9
// Provides automated model training, validation, and deployment capabilities

import { AuthService } from '@/lib/auth-unified';

export interface TrainingConfig {
  modelId: string;
  modelType: 'regression' | 'classification' | 'time_series' | 'ensemble';
  algorithm: 'linear_regression' | 'random_forest' | 'neural_network' | 'gradient_boosting' | 'lstm' | 'transformer';
  features: string[];
  target: string;
  validationSplit: number;
  testSplit: number;
  hyperparameters: Record<string, unknown>;
  trainingData: TrainingDataConfig;
  evaluationMetrics: string[];
  earlyStoppingConfig?: EarlyStoppingConfig;
  crossValidation?: CrossValidationConfig;
}

export interface TrainingDataConfig {
  source: 'supabase' | 'api' | 'file' | 'stream';
  query?: string;
  endpoint?: string;
  filePath?: string;
  streamConfig?: StreamConfig;
  preprocessingSteps: PreprocessingStep[];
  featureEngineering: FeatureEngineeringStep[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface StreamConfig {
  batchSize: number;
  bufferSize: number;
  timeWindow: string;
  aggregationFunction: 'mean' | 'sum' | 'count' | 'max' | 'min';
}

export interface PreprocessingStep {
  type: 'normalize' | 'standardize' | 'encode_categorical' | 'handle_missing' | 'remove_outliers' | 'feature_selection';
  config: Record<string, unknown>;
}

export interface FeatureEngineeringStep {
  type: 'polynomial' | 'interaction' | 'lag' | 'rolling_window' | 'fourier' | 'embedding';
  config: Record<string, unknown>;
}

export interface EarlyStoppingConfig {
  metric: string;
  patience: number;
  minDelta: number;
  mode: 'minimize' | 'maximize';
}

export interface CrossValidationConfig {
  folds: number;
  strategy: 'kfold' | 'stratified' | 'time_series' | 'group';
  groupColumn?: string;
}

export interface TrainingResult {
  modelId: string;
  version: string;
  status: 'training' | 'completed' | 'failed' | 'cancelled';
  accuracy: number;
  loss: number;
  metrics: Record<string, number>;
  trainingTime: number;
  epochs: number;
  bestEpoch?: number;
  featureImportance: Record<string, number>;
  crossValidationScores?: number[];
  confusionMatrix?: number[][];
  learningCurve: {
    epoch: number;
    trainLoss: number;
    valLoss: number;
    trainAccuracy: number;
    valAccuracy: number;
  }[];
  hyperparameters: Record<string, unknown>;
  modelArtifacts: {
    weightsPath: string;
    configPath: string;
    preprocessorPath: string;
    metadataPath: string;
  };
  createdAt: string;
  completedAt?: string;
  organizationId: string;
}

export interface ModelMetadata {
  id: string;
  name: string;
  description: string;
  modelType: string;
  algorithm: string;
  version: string;
  status: 'draft' | 'training' | 'trained' | 'deployed' | 'archived';
  accuracy: number;
  features: string[];
  target: string;
  trainingDataSize: number;
  lastTrainingDate: string;
  deploymentDate?: string;
  usage: {
    predictionsCount: number;
    avgLatency: number;
    errorRate: number;
  };
  tags: string[];
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export class TrainingPipeline {
  private static instance: TrainingPipeline;
  private activeTrainings = new Map<string, TrainingSession>();
  private trainingQueue: TrainingConfig[] = [];
  private maxConcurrentTrainings = 3;

  static getInstance(): TrainingPipeline {
    if (!TrainingPipeline.instance) {
      TrainingPipeline.instance = new TrainingPipeline();
    }
    return TrainingPipeline.instance;
  }

  private constructor() {
    this.startTrainingWorker();
  }

  // Start a new training session
  async startTraining(config: TrainingConfig): Promise<TrainingResult> {
    try {
      console.log(`[TrainingPipeline] Starting training for model: ${config.modelId}`);

      // Validate configuration
      this.validateTrainingConfig(config);

      // Check if training is already in progress
      if (this.activeTrainings.has(config.modelId)) {
        throw new Error(`Training already in progress for model: ${config.modelId}`);
      }

      // Create training session
      const session = new TrainingSession(config);
      this.activeTrainings.set(config.modelId, session);

      // Add to queue if at capacity
      if (this.activeTrainings.size > this.maxConcurrentTrainings) {
        this.trainingQueue.push(config);
        return this.createPendingResult(config);
      }

      // Start training
      const result = await this.executeTraining(session);
      this.activeTrainings.delete(config.modelId);

      // Process queue
      this.processTrainingQueue();

      return result;
    } catch (error) {
      console.error('[TrainingPipeline] Training failed:', error);
      this.activeTrainings.delete(config.modelId);
      throw error;
    }
  }

  // Stop training session
  async stopTraining(modelId: string): Promise<void> {
    const session = this.activeTrainings.get(modelId);
    if (session) {
      await session.stop();
      this.activeTrainings.delete(modelId);
      console.log(`[TrainingPipeline] Training stopped for model: ${modelId}`);
    }
  }

  // Get training status
  getTrainingStatus(modelId: string): TrainingResult | null {
    const session = this.activeTrainings.get(modelId);
    return session ? session.getStatus() : null;
  }

  // List all active trainings
  getActiveTrainings(): TrainingResult[] {
    return Array.from(this.activeTrainings.values()).map(session => session.getStatus());
  }

  // Execute training session
  private async executeTraining(session: TrainingSession): Promise<TrainingResult> {
    try {
      // Load and preprocess data
      await session.loadData();
      await session.preprocessData();
      await session.engineerFeatures();

      // Split data
      await session.splitData();

      // Train model
      await session.trainModel();

      // Evaluate model
      await session.evaluateModel();

      // Save model artifacts
      await session.saveModel();

      return session.getResult();
    } catch (error) {
      await session.handleError(error);
      throw error;
    }
  }

  // Validate training configuration
  private validateTrainingConfig(config: TrainingConfig): void {
    if (!config.modelId || !config.modelType || !config.algorithm) {
      throw new Error('Missing required training configuration');
    }

    if (!config.features || config.features.length === 0) {
      throw new Error('No features specified for training');
    }

    if (!config.target) {
      throw new Error('No target variable specified');
    }

    if (config.validationSplit < 0 || config.validationSplit > 1) {
      throw new Error('Validation split must be between 0 and 1');
    }

    if (config.testSplit < 0 || config.testSplit > 1) {
      throw new Error('Test split must be between 0 and 1');
    }

    if (config.validationSplit + config.testSplit >= 1) {
      throw new Error('Validation and test splits cannot exceed 1');
    }
  }

  // Create pending training result
  private createPendingResult(config: TrainingConfig): TrainingResult {
    return {
      modelId: config.modelId,
      version: '0.0.0',
      status: 'training',
      accuracy: 0,
      loss: 0,
      metrics: {},
      trainingTime: 0,
      epochs: 0,
      featureImportance: {},
      learningCurve: [],
      hyperparameters: config.hyperparameters,
      modelArtifacts: {
        weightsPath: '',
        configPath: '',
        preprocessorPath: '',
        metadataPath: ''
      },
      createdAt: new Date().toISOString(),
      organizationId: ''
    };
  }

  // Process training queue
  private processTrainingQueue(): void {
    if (this.trainingQueue.length > 0 && this.activeTrainings.size < this.maxConcurrentTrainings) {
      const nextConfig = this.trainingQueue.shift();
      if (nextConfig) {
        this.startTraining(nextConfig).catch(error => {
          console.error('[TrainingPipeline] Queued training failed:', error);
        });
      }
    }
  }

  // Start background training worker
  private startTrainingWorker(): void {
    setInterval(() => {
      this.processTrainingQueue();
      this.cleanupCompletedTrainings();
    }, 5000);
  }

  // Cleanup completed trainings
  private cleanupCompletedTrainings(): void {
    for (const [modelId, session] of this.activeTrainings) {
      const status = session.getStatus();
      if (status.status === 'completed' || status.status === 'failed') {
        this.activeTrainings.delete(modelId);
      }
    }
  }

  // Get training history
  async getTrainingHistory(modelId: string): Promise<TrainingResult[]> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user?.profile?.organization_id) {
        throw new Error('User organization not found');
      }

      // In a real implementation, this would query a database
      // For now, return mock data
      return [
        {
          modelId,
          version: '1.0.0',
          status: 'completed',
          accuracy: 0.87,
          loss: 0.23,
          metrics: {
            precision: 0.85,
            recall: 0.89,
            f1Score: 0.87,
            auc: 0.92
          },
          trainingTime: 1200,
          epochs: 50,
          bestEpoch: 42,
          featureImportance: {
            'deal_value': 0.35,
            'stage_duration': 0.28,
            'meddpicc_score': 0.22,
            'contact_frequency': 0.15
          },
          crossValidationScores: [0.86, 0.88, 0.85, 0.89, 0.87],
          learningCurve: [],
          hyperparameters: {
            learningRate: 0.001,
            batchSize: 32,
            epochs: 50,
            dropout: 0.2
          },
          modelArtifacts: {
            weightsPath: `/models/${modelId}/v1.0.0/weights.json`,
            configPath: `/models/${modelId}/v1.0.0/config.json`,
            preprocessorPath: `/models/${modelId}/v1.0.0/preprocessor.json`,
            metadataPath: `/models/${modelId}/v1.0.0/metadata.json`
          },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date(Date.now() - 85200000).toISOString(),
          organizationId: user.profile.organization_id
        }
      ];
    } catch (error) {
      console.error('[TrainingPipeline] Failed to get training history:', error);
      throw error;
    }
  }

  // Get model metadata
  async getModelMetadata(modelId: string): Promise<ModelMetadata | null> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user?.profile?.organization_id) {
        throw new Error('User organization not found');
      }

      // In a real implementation, this would query a database
      // For now, return mock data
      return {
        id: modelId,
        name: 'Deal Probability Predictor',
        description: 'Predicts the probability of closing sales opportunities',
        modelType: 'classification',
        algorithm: 'random_forest',
        version: '1.0.0',
        status: 'deployed',
        accuracy: 0.87,
        features: ['deal_value', 'stage_duration', 'meddpicc_score', 'contact_frequency'],
        target: 'deal_closed',
        trainingDataSize: 10000,
        lastTrainingDate: new Date(Date.now() - 86400000).toISOString(),
        deploymentDate: new Date(Date.now() - 3600000).toISOString(),
        usage: {
          predictionsCount: 1500,
          avgLatency: 45,
          errorRate: 0.02
        },
        tags: ['sales', 'prediction', 'opportunity'],
        organizationId: user.profile.organization_id,
        createdBy: user.id,
        createdAt: new Date(Date.now() - 604800000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      };
    } catch (error) {
      console.error('[TrainingPipeline] Failed to get model metadata:', error);
      return null;
    }
  }

  // List all models
  async listModels(): Promise<ModelMetadata[]> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user?.profile?.organization_id) {
        throw new Error('User organization not found');
      }

      // In a real implementation, this would query a database
      // For now, return mock data
      return [
        {
          id: 'deal_probability_v1',
          name: 'Deal Probability Predictor',
          description: 'Predicts the probability of closing sales opportunities',
          modelType: 'classification',
          algorithm: 'random_forest',
          version: '1.0.0',
          status: 'deployed',
          accuracy: 0.87,
          features: ['deal_value', 'stage_duration', 'meddpicc_score', 'contact_frequency'],
          target: 'deal_closed',
          trainingDataSize: 10000,
          lastTrainingDate: new Date(Date.now() - 86400000).toISOString(),
          deploymentDate: new Date(Date.now() - 3600000).toISOString(),
          usage: {
            predictionsCount: 1500,
            avgLatency: 45,
            errorRate: 0.02
          },
          tags: ['sales', 'prediction', 'opportunity'],
          organizationId: user.profile.organization_id,
          createdBy: user.id,
          createdAt: new Date(Date.now() - 604800000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'lead_scoring_v2',
          name: 'Advanced Lead Scoring',
          description: 'Multi-dimensional lead qualification and prioritization',
          modelType: 'regression',
          algorithm: 'gradient_boosting',
          version: '2.1.0',
          status: 'trained',
          accuracy: 0.92,
          features: ['company_size', 'industry', 'engagement_score', 'intent_signals'],
          target: 'lead_score',
          trainingDataSize: 25000,
          lastTrainingDate: new Date(Date.now() - 172800000).toISOString(),
          usage: {
            predictionsCount: 3200,
            avgLatency: 32,
            errorRate: 0.015
          },
          tags: ['leads', 'scoring', 'qualification'],
          organizationId: user.profile.organization_id,
          createdBy: user.id,
          createdAt: new Date(Date.now() - 1209600000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString()
        }
      ];
    } catch (error) {
      console.error('[TrainingPipeline] Failed to list models:', error);
      return [];
    }
  }
}

// Training Session Class
class TrainingSession {
  private config: TrainingConfig;
  private status: TrainingResult;
  private isRunning = false;
  private shouldStop = false;

  constructor(config: TrainingConfig) {
    this.config = config;
    this.status = this.initializeStatus();
  }

  private initializeStatus(): TrainingResult {
    return {
      modelId: this.config.modelId,
      version: '0.0.0',
      status: 'training',
      accuracy: 0,
      loss: 0,
      metrics: {},
      trainingTime: 0,
      epochs: 0,
      featureImportance: {},
      learningCurve: [],
      hyperparameters: this.config.hyperparameters,
      modelArtifacts: {
        weightsPath: '',
        configPath: '',
        preprocessorPath: '',
        metadataPath: ''
      },
      createdAt: new Date().toISOString(),
      organizationId: ''
    };
  }

  async loadData(): Promise<void> {
    console.log(`[TrainingSession] Loading data for ${this.config.modelId}`);
    // Implementation would load data based on config.trainingData
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async preprocessData(): Promise<void> {
    console.log(`[TrainingSession] Preprocessing data for ${this.config.modelId}`);
    // Implementation would apply preprocessing steps
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async engineerFeatures(): Promise<void> {
    console.log(`[TrainingSession] Engineering features for ${this.config.modelId}`);
    // Implementation would apply feature engineering steps
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  async splitData(): Promise<void> {
    console.log(`[TrainingSession] Splitting data for ${this.config.modelId}`);
    // Implementation would split data into train/val/test sets
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  async trainModel(): Promise<void> {
    console.log(`[TrainingSession] Training model ${this.config.modelId}`);
    this.isRunning = true;
    
    // Simulate training epochs
    const totalEpochs = 50;
    for (let epoch = 0; epoch < totalEpochs && !this.shouldStop; epoch++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update learning curve
      this.status.learningCurve.push({
        epoch: epoch + 1,
        trainLoss: 1.0 - (epoch / totalEpochs) * 0.8 + Math.random() * 0.1,
        valLoss: 1.0 - (epoch / totalEpochs) * 0.75 + Math.random() * 0.15,
        trainAccuracy: (epoch / totalEpochs) * 0.9 + Math.random() * 0.05,
        valAccuracy: (epoch / totalEpochs) * 0.85 + Math.random() * 0.08
      });
      
      this.status.epochs = epoch + 1;
    }
    
    this.isRunning = false;
  }

  async evaluateModel(): Promise<void> {
    console.log(`[TrainingSession] Evaluating model ${this.config.modelId}`);
    
    // Simulate model evaluation
    this.status.accuracy = 0.87 + Math.random() * 0.1;
    this.status.loss = 0.2 + Math.random() * 0.1;
    this.status.metrics = {
      precision: 0.85 + Math.random() * 0.08,
      recall: 0.88 + Math.random() * 0.06,
      f1Score: 0.86 + Math.random() * 0.07,
      auc: 0.91 + Math.random() * 0.05
    };
    
    // Generate feature importance
    this.config.features.forEach((feature, index) => {
      this.status.featureImportance[feature] = Math.random() * (1 - index * 0.1);
    });
  }

  async saveModel(): Promise<void> {
    console.log(`[TrainingSession] Saving model ${this.config.modelId}`);
    
    // Simulate saving model artifacts
    const version = '1.0.0';
    this.status.version = version;
    this.status.modelArtifacts = {
      weightsPath: `/models/${this.config.modelId}/${version}/weights.json`,
      configPath: `/models/${this.config.modelId}/${version}/config.json`,
      preprocessorPath: `/models/${this.config.modelId}/${version}/preprocessor.json`,
      metadataPath: `/models/${this.config.modelId}/${version}/metadata.json`
    };
    
    this.status.status = 'completed';
    this.status.completedAt = new Date().toISOString();
    this.status.trainingTime = Date.now() - new Date(this.status.createdAt).getTime();
  }

  async handleError(error: unknown): Promise<void> {
    console.error(`[TrainingSession] Training failed for ${this.config.modelId}:`, error);
    this.status.status = 'failed';
    this.status.completedAt = new Date().toISOString();
  }

  async stop(): Promise<void> {
    this.shouldStop = true;
    this.status.status = 'cancelled';
    this.status.completedAt = new Date().toISOString();
  }

  getStatus(): TrainingResult {
    return { ...this.status };
  }

  getResult(): TrainingResult {
    return { ...this.status };
  }
}

// Export singleton instance
export const trainingPipeline = TrainingPipeline.getInstance();