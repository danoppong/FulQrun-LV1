// Base Integration Class
// Abstract base class for all enterprise integrations

import { getSupabaseClient } from '@/lib/supabase-client';

const supabase = getSupabaseClient();

// Types for enterprise integrations
export interface EnterpriseIntegration {
  id: string;
  integrationType: 'salesforce' | 'dynamics' | 'sap' | 'oracle' | 'workday' | 'hubspot' | 'pipedrive' | 'custom';
  name: string;
  config: Record<string, unknown>;
  credentials: Record<string, unknown>;
  webhookConfig: Record<string, unknown>;
  syncConfig: Record<string, unknown>;
  isActive: boolean;
  lastSyncAt?: Date;
  syncStatus: 'pending' | 'success' | 'error' | 'disabled' | 'syncing';
  errorMessage?: string;
  syncFrequencyMinutes: number;
  organizationId: string;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorMessage?: string;
  syncDuration: number;
}

export interface WebhookPayload {
  eventType: string;
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  timestamp: Date;
  organizationId: string;
}

export interface IntegrationFieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  required: boolean;
}

export interface SyncConfiguration {
  entityTypes: string[];
  fieldMappings: IntegrationFieldMapping[];
  syncDirection: 'inbound' | 'outbound' | 'bidirectional';
  conflictResolution: 'source_wins' | 'target_wins' | 'manual';
  batchSize: number;
  retryAttempts: number;
  retryDelayMs: number;
}

// Abstract base class for all integrations
export abstract class BaseIntegration {
  protected config: Record<string, unknown>;
  protected credentials: Record<string, unknown>;
  protected organizationId: string;
  protected integrationId: string;

  constructor(
    integrationId: string,
    config: Record<string, unknown>,
    credentials: Record<string, unknown>,
    organizationId: string
  ) {
    this.integrationId = integrationId;
    this.config = config;
    this.credentials = credentials;
    this.organizationId = organizationId;
  }

  // Abstract methods that must be implemented by subclasses
  abstract authenticate(): Promise<boolean>;
  abstract testConnection(): Promise<boolean>;
  abstract syncData(entityType: string, syncConfig: SyncConfiguration): Promise<SyncResult>;
  abstract getEntityData(entityType: string, entityId: string): Promise<Record<string, unknown>>;
  abstract createEntity(entityType: string, data: Record<string, unknown>): Promise<string>;
  abstract updateEntity(entityType: string, entityId: string, data: Record<string, unknown>): Promise<boolean>;
  abstract deleteEntity(entityType: string, entityId: string): Promise<boolean>;

  // Common methods available to all integrations
  protected async logSyncActivity(
    entityType: string,
    operation: 'sync_start' | 'sync_complete' | 'sync_error',
    details: Record<string, unknown>
  ): Promise<void> {
    try {
      await supabase
        .from('integration_sync_logs')
        .insert({
          integration_id: this.integrationId,
          organization_id: this.organizationId,
          entity_type: entityType,
          operation,
          details,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging sync activity:', error);
    }
  }

  protected async updateSyncStatus(
    status: 'pending' | 'success' | 'error' | 'disabled' | 'syncing',
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {
        sync_status: status,
        last_sync_at: status === 'success' ? new Date().toISOString() : undefined
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      await supabase
        .from('integration_connections')
        .update(updateData)
        .eq('id', this.integrationId)
        .eq('organization_id', this.organizationId);
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }

  protected async validateCredentials(): Promise<boolean> {
    try {
      return await this.testConnection();
    } catch (error) {
      console.error('Credential validation failed:', error);
      return false;
    }
  }

  protected async handleSyncError(error: Error, entityType: string): Promise<void> {
    const errorMessage = error.message || 'Unknown sync error';
    
    await this.updateSyncStatus('error', errorMessage);
    await this.logSyncActivity(entityType, 'sync_error', {
      error: errorMessage,
      stack: error.stack
    });
  }

  protected async transformData(
    data: Record<string, unknown>,
    fieldMappings: IntegrationFieldMapping[]
  ): Promise<Record<string, unknown>> {
    const transformedData: Record<string, unknown> = {};

    for (const mapping of fieldMappings) {
      const sourceValue = this.getNestedValue(data, mapping.sourceField);
      
      if (sourceValue !== undefined) {
        let transformedValue = sourceValue;
        
        if (mapping.transformation) {
          transformedValue = this.applyTransformation(sourceValue, mapping.transformation);
        }
        
        this.setNestedValue(transformedData, mapping.targetField, transformedValue);
      } else if (mapping.required) {
        throw new Error(`Required field ${mapping.sourceField} is missing`);
      }
    }

    return transformedData;
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private applyTransformation(value: unknown, transformation: string): unknown {
    switch (transformation) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      case 'date_iso':
        return value instanceof Date ? value.toISOString() : value;
      case 'boolean':
        return Boolean(value);
      case 'number':
        return Number(value);
      case 'string':
        return String(value);
      default:
        return value;
    }
  }

  protected async batchProcess<T>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<void>
  ): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await processor(batch);
    }
  }

  protected async retryOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
      }
    }
    
    throw lastError;
  }

  // Webhook handling methods
  public async processWebhook(payload: WebhookPayload): Promise<void> {
    try {
      await this.logSyncActivity('webhook', 'sync_start', {
        eventType: payload.eventType,
        entityType: payload.entityType,
        entityId: payload.entityId
      });

      // Process webhook based on event type
      switch (payload.eventType) {
        case 'create':
          await this.handleWebhookCreate(payload);
          break;
        case 'update':
          await this.handleWebhookUpdate(payload);
          break;
        case 'delete':
          await this.handleWebhookDelete(payload);
          break;
        default:
          console.warn(`Unknown webhook event type: ${payload.eventType}`);
      }

      await this.logSyncActivity('webhook', 'sync_complete', {
        eventType: payload.eventType,
        entityType: payload.entityType,
        entityId: payload.entityId
      });
    } catch (error) {
      await this.handleSyncError(error, 'webhook');
    }
  }

  protected abstract handleWebhookCreate(payload: WebhookPayload): Promise<void>;
  protected abstract handleWebhookUpdate(payload: WebhookPayload): Promise<void>;
  protected abstract handleWebhookDelete(payload: WebhookPayload): Promise<void>;

  // Configuration management
  public async updateConfig(newConfig: Record<string, unknown>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    await supabase
      .from('integration_connections')
      .update({ config: this.config })
      .eq('id', this.integrationId)
      .eq('organization_id', this.organizationId);
  }

  public async updateCredentials(newCredentials: Record<string, unknown>): Promise<void> {
    this.credentials = { ...this.credentials, ...newCredentials };
    
    await supabase
      .from('integration_connections')
      .update({ credentials: this.credentials })
      .eq('id', this.integrationId)
      .eq('organization_id', this.organizationId);
  }

  // Utility methods
  public getIntegrationType(): string {
    return this.config.integrationType || 'unknown';
  }

  public isActive(): boolean {
    return this.config.isActive === true;
  }

  public getSyncFrequency(): number {
    return this.config.syncFrequencyMinutes || 60;
  }
}
