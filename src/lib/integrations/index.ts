// Enterprise Integrations - Main Export File
// Centralized exports for all integration modules

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

import type { BaseIntegration } from './base-integration';
import { SalesforceIntegration } from './salesforce-integration';

// Base integration classes and types
export type {
  BaseIntegration,
  EnterpriseIntegration,
  SyncResult,
  WebhookPayload,
  IntegrationFieldMapping,
  SyncConfiguration,
} from './base-integration';

// Salesforce integration
export { SalesforceIntegration } from './salesforce-integration';

// Webhook management
export type {
  WebhookManager,
  webhookManager,
  WebhookConfig,
  WebhookDelivery,
} from './webhook-manager';

// Integration factory for creating integration instances
export class IntegrationFactory {
  static createIntegration(
    integrationType: string,
    integrationId: string,
    config: Record<string, any>,
    credentials: Record<string, any>,
    organizationId: string
  ): BaseIntegration {
    switch (integrationType) {
      case 'salesforce':
        return new SalesforceIntegration(integrationId, config, credentials, organizationId);
      // Add other integration types as they are implemented
      // case 'dynamics':
      //   return new DynamicsIntegration(integrationId, config, credentials, organizationId);
      // case 'sap':
      //   return new SAPIntegration(integrationId, config, credentials, organizationId);
      // case 'oracle':
      //   return new OracleIntegration(integrationId, config, credentials, organizationId);
      // case 'workday':
      //   return new WorkdayIntegration(integrationId, config, credentials, organizationId);
      default:
        throw new Error(`Unsupported integration type: ${integrationType}`);
    }
  }
}

// Integration management utilities
export class IntegrationManager {
  private integrations: Map<string, BaseIntegration> = new Map();

  async loadIntegration(integrationId: string): Promise<BaseIntegration | null> {
    try {
      const { data, error } = await supabase
        .from('integration_connections')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (error || !data) return null;

      const integration = IntegrationFactory.createIntegration(
        data.integration_type,
        data.id,
        data.config,
        data.credentials,
        data.organization_id
      );

      this.integrations.set(integrationId, integration);
      return integration;
    } catch (error) {
      console.error('Error loading integration:', error);
      return null;
    }
  }

  async getIntegration(integrationId: string): Promise<BaseIntegration | null> {
    if (this.integrations.has(integrationId)) {
      return this.integrations.get(integrationId)!;
    }

    return await this.loadIntegration(integrationId);
  }

  async syncAllIntegrations(organizationId: string): Promise<void> {
    try {
      const { data: integrations, error } = await supabase
        .from('integration_connections')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      if (error) throw error;

      for (const integrationData of integrations) {
        try {
          const integration = await this.getIntegration(integrationData.id);
          if (integration) {
            // Perform sync based on integration configuration
            await this.performSync(integration, integrationData);
          }
        } catch (error) {
          console.error(`Error syncing integration ${integrationData.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error syncing all integrations:', error);
    }
  }

  private async performSync(integration: BaseIntegration, config: Record<string, unknown>): Promise<void> {
    try {
      // Test connection first
      const isConnected = await integration.testConnection();
      if (!isConnected) {
        throw new Error('Integration connection failed');
      }

      // Get sync configuration
      const syncConfig = config.syncConfig || {};
      
      // Sync each configured entity type
      for (const entityType of syncConfig.entityTypes || []) {
        await integration.syncData(entityType, syncConfig);
      }
    } catch (error) {
      console.error('Error performing sync:', error);
      throw error;
    }
  }

  async testIntegration(integrationId: string): Promise<boolean> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) return false;

      return await integration.testConnection();
    } catch (error) {
      console.error('Error testing integration:', error);
      return false;
    }
  }

  async authenticateIntegration(integrationId: string): Promise<boolean> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) return false;

      return await integration.authenticate();
    } catch (error) {
      console.error('Error authenticating integration:', error);
      return false;
    }
  }
}

// Singleton instance
export const integrationManager = new IntegrationManager();
