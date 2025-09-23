// Enterprise Integrations API Layer
// API functions for enterprise integration management

import { getSupabaseClient } from '@/lib/supabase-client';

const supabase = getSupabaseClient();

// Types
export interface EnterpriseIntegration {
  id: string;
  name: string;
  type: 'crm' | 'erp' | 'marketing' | 'analytics' | 'communication' | 'custom';
  provider: string;
  config: Record<string, any>;
  isActive: boolean;
  lastSync?: Date;
  syncStatus: 'success' | 'error' | 'pending' | 'never';
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
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
    return data || [];
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
        type: integration.type,
        provider: integration.provider,
        config: integration.config,
        is_active: integration.isActive,
        sync_status: integration.syncStatus,
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
    if (updates.type) updateData.type = updates.type;
    if (updates.provider) updateData.provider = updates.provider;
    if (updates.config) updateData.config = updates.config;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.syncStatus) updateData.sync_status = updates.syncStatus;

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
export async function syncIntegrationData(integrationId: string): Promise<SyncResult> {
  try {
    const startTime = Date.now();
    
    // Mock sync process
    const recordsProcessed = Math.floor(Math.random() * 1000) + 100;
    const errors: string[] = [];
    const success = Math.random() > 0.1; // 90% success rate
    
    if (!success) {
      errors.push('Connection timeout');
      errors.push('Invalid credentials');
    }

    const result: SyncResult = {
      success,
      recordsProcessed,
      errors,
      duration: Date.now() - startTime,
      timestamp: new Date()
    };

    // Update integration sync status
    await updateEnterpriseIntegration(integrationId, {
      lastSync: new Date(),
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
        }
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
        }
      }
    ];
  } catch (error) {
    console.error('Error fetching integration templates:', error);
    return [];
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