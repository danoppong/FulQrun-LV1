// Enterprise Integrations API Layer
// API functions for enterprise integration management

import { getSupabaseClient } from '@/lib/supabase-client';

const supabase = getSupabaseClient();

// Types
export interface EnterpriseIntegration {
  id: string;
  name: string;
  integrationType: 'crm' | 'erp' | 'marketing' | 'analytics' | 'communication' | 'custom';
  provider: string;
  config: Record<string, any>;
  credentials: Record<string, any>;
  webhookConfig: Record<string, any>;
  syncConfig: Record<string, any>;
  isActive: boolean;
  lastSyncAt?: Date;
  syncStatus: 'success' | 'error' | 'pending' | 'syncing' | 'never';
  syncFrequencyMinutes: number;
  errorMessage?: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  errors: string[];
  duration: number;
  timestamp: Date;
}

// Get all enterprise integrations
export async function getEnterpriseIntegrations(organizationId: string): Promise<EnterpriseIntegration[]> {
  try {
    const { data, error } = await supabase
      .from('enterprise_integrations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Map database fields to interface
    return (data || []).map(integration => ({
      id: integration.id,
      name: integration.name,
      integrationType: integration.type,
      provider: integration.provider,
      config: integration.config || {},
      credentials: integration.credentials || {},
      webhookConfig: integration.webhook_config || {},
      syncConfig: integration.sync_config || {},
      isActive: integration.is_active,
      lastSyncAt: integration.last_sync ? new Date(integration.last_sync) : undefined,
      syncStatus: integration.sync_status || 'never',
      syncFrequencyMinutes: integration.sync_frequency_minutes || 60,
      errorMessage: integration.error_message,
      organizationId: integration.organization_id,
      createdBy: integration.created_by,
      createdAt: new Date(integration.created_at),
      updatedAt: new Date(integration.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching enterprise integrations:', error);
    throw error;
  }
}

// Create new enterprise integration
export async function createEnterpriseIntegration(
  integration: Omit<EnterpriseIntegration, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<EnterpriseIntegration> {
  try {
    const { data, error } = await supabase
      .from('enterprise_integrations')
      .insert({
        name: integration.name,
        type: integration.integrationType,
        provider: integration.provider,
        config: integration.config,
        credentials: integration.credentials,
        webhook_config: integration.webhookConfig,
        sync_config: integration.syncConfig,
        is_active: integration.isActive,
        sync_status: integration.syncStatus,
        sync_frequency_minutes: integration.syncFrequencyMinutes,
        organization_id: integration.organizationId,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating enterprise integration:', error);
    throw error;
  }
}

// Update enterprise integration
export async function updateEnterpriseIntegration(
  integrationId: string,
  updates: Partial<EnterpriseIntegration>
): Promise<EnterpriseIntegration> {
  try {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.integrationType) updateData.type = updates.integrationType;
    if (updates.provider) updateData.provider = updates.provider;
    if (updates.config) updateData.config = updates.config;
    if (updates.credentials) updateData.credentials = updates.credentials;
    if (updates.webhookConfig) updateData.webhook_config = updates.webhookConfig;
    if (updates.syncConfig) updateData.sync_config = updates.syncConfig;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.syncStatus) updateData.sync_status = updates.syncStatus;
    if (updates.syncFrequencyMinutes) updateData.sync_frequency_minutes = updates.syncFrequencyMinutes;
    if (updates.lastSyncAt) updateData.last_sync = updates.lastSyncAt;
    if (updates.errorMessage) updateData.error_message = updates.errorMessage;

    const { data, error } = await supabase
      .from('enterprise_integrations')
      .update(updateData)
      .eq('id', integrationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating enterprise integration:', error);
    throw error;
  }
}

// Delete enterprise integration
export async function deleteEnterpriseIntegration(integrationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('enterprise_integrations')
      .delete()
      .eq('id', integrationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting enterprise integration:', error);
    throw error;
  }
}

// Test integration connection
export async function testIntegrationConnection(integrationId: string): Promise<boolean> {
  try {
    // Mock connection test for now
    return Math.random() > 0.2; // 80% success rate
  } catch (error) {
    console.error('Error testing integration connection:', error);
    return false;
  }
}

// Sync integration data
export async function syncIntegrationData(integrationId: string, entityType: string): Promise<SyncResult> {
  try {
    const startTime = Date.now();
    
    // Mock sync process
    const recordsProcessed = Math.floor(Math.random() * 1000) + 100;
    const recordsCreated = Math.floor(recordsProcessed * 0.3);
    const recordsUpdated = Math.floor(recordsProcessed * 0.7);
    const errors: string[] = [];
    const success = Math.random() > 0.1; // 90% success rate
    
    if (!success) {
      errors.push('Connection timeout');
      errors.push('Invalid credentials');
    }

    const result: SyncResult = {
      success,
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      errors,
      duration: Date.now() - startTime,
      timestamp: new Date()
    };

    // Update integration sync status
    await updateEnterpriseIntegration(integrationId, {
      lastSyncAt: new Date(),
      syncStatus: success ? 'success' : 'error'
    });

    return result;
  } catch (error) {
    console.error('Error syncing integration data:', error);
    throw error;
  }
}

// Get integration sync history
export async function getIntegrationSyncHistory(integrationId: string): Promise<SyncResult[]> {
  try {
    const { data, error } = await supabase
      .from('integration_sync_history')
      .select('*')
      .eq('integration_id', integrationId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching integration sync history:', error);
    return [];
  }
}

// Get available integration providers
export async function getAvailableProviders(): Promise<string[]> {
  try {
    // Mock provider list
    return [
      'Salesforce',
      'HubSpot',
      'Microsoft Dynamics',
      'SAP',
      'Oracle',
      'Zendesk',
      'Slack',
      'Microsoft Teams',
      'Google Workspace',
      'AWS',
      'Azure',
      'Custom API'
    ];
  } catch (error) {
    console.error('Error fetching available providers:', error);
    return [];
  }
}

// Get integration templates
export async function getIntegrationTemplates(): Promise<any[]> {
  try {
    // Mock templates
    return [
      {
        id: 'salesforce-crm',
        name: 'Salesforce CRM',
        type: 'crm',
        provider: 'Salesforce',
        description: 'Sync contacts, leads, and opportunities',
        configTemplate: {
          apiUrl: 'https://your-instance.salesforce.com',
          apiKey: 'your-api-key',
          syncFields: ['contacts', 'leads', 'opportunities']
        },
        fields: [
          { name: 'apiUrl', label: 'API URL', type: 'url', required: true },
          { name: 'apiKey', label: 'API Key', type: 'password', required: true }
        ],
        supportedEntities: ['contacts', 'leads', 'opportunities']
      },
      {
        id: 'hubspot-marketing',
        name: 'HubSpot Marketing',
        type: 'marketing',
        provider: 'HubSpot',
        description: 'Sync marketing campaigns and contacts',
        configTemplate: {
          apiUrl: 'https://api.hubapi.com',
          apiKey: 'your-hubspot-key',
          syncFields: ['contacts', 'companies', 'deals']
        },
        fields: [
          { name: 'apiUrl', label: 'API URL', type: 'url', required: true },
          { name: 'apiKey', label: 'API Key', type: 'password', required: true }
        ],
        supportedEntities: ['contacts', 'companies', 'deals']
      }
    ];
  } catch (error) {
    console.error('Error fetching integration templates:', error);
    return [];
  }
}

// Get integration statistics
export async function getIntegrationStatistics(organizationId: string): Promise<any> {
  try {
    const { data: integrations, error } = await supabase
      .from('enterprise_integrations')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) throw error;

    const total = integrations?.length || 0;
    const active = integrations?.filter(i => i.is_active).length || 0;
    
    const byStatus = integrations?.reduce((acc, integration) => {
      const status = integration.sync_status || 'never';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const byType = integrations?.reduce((acc, integration) => {
      const type = integration.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      total,
      active,
      byStatus,
      byType
    };
  } catch (error) {
    console.error('Error fetching integration statistics:', error);
    return {
      total: 0,
      active: 0,
      byStatus: {},
      byType: {}
    };
  }
}

// Get integration health
export async function getIntegrationHealth(organizationId: string): Promise<any> {
  try {
    const { data: integrations, error } = await supabase
      .from('enterprise_integrations')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) throw error;

    const health = {
      healthy: 0,
      warning: 0,
      error: 0,
      lastSync: null as Date | null
    };

    integrations?.forEach(integration => {
      if (integration.sync_status === 'success') {
        health.healthy++;
      } else if (integration.sync_status === 'error') {
        health.error++;
      } else {
        health.warning++;
      }

      if (integration.last_sync && (!health.lastSync || new Date(integration.last_sync) > health.lastSync)) {
        health.lastSync = new Date(integration.last_sync);
      }
    });

    return health;
  } catch (error) {
    console.error('Error fetching integration health:', error);
    return {
      healthy: 0,
      warning: 0,
      error: 0,
      lastSync: null
    };
  }
}

// Enterprise Integration API Class
export class EnterpriseIntegrationAPI {
  static async getIntegrations(organizationId: string): Promise<EnterpriseIntegration[]> {
    return getEnterpriseIntegrations(organizationId);
  }

  static async createIntegration(
    integration: Omit<EnterpriseIntegration, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<EnterpriseIntegration> {
    return createEnterpriseIntegration(integration, userId);
  }

  static async updateIntegration(
    integrationId: string,
    updates: Partial<EnterpriseIntegration>
  ): Promise<EnterpriseIntegration> {
    return updateEnterpriseIntegration(integrationId, updates);
  }

  static async deleteIntegration(integrationId: string): Promise<void> {
    return deleteEnterpriseIntegration(integrationId);
  }

  static async testConnection(integrationId: string): Promise<boolean> {
    return testIntegrationConnection(integrationId);
  }

  static async syncData(integrationId: string): Promise<SyncResult> {
    return syncIntegrationData(integrationId);
  }

  static async getSyncHistory(integrationId: string): Promise<SyncResult[]> {
    return getIntegrationSyncHistory(integrationId);
  }

  static async getAvailableProviders(): Promise<string[]> {
    return getAvailableProviders();
  }

  static async getTemplates(): Promise<any[]> {
    return getIntegrationTemplates();
  }
}

export default EnterpriseIntegrationAPI