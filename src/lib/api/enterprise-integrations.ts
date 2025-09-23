// Enterprise Integrations API Layer
// API functions for enterprise integration management

import { createClient } from '@supabase/supabase-js';
import EnterpriseIntegrationAPI, { EnterpriseIntegration, SyncResult } from './enterprise-integrations';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get all enterprise integrations
export async function getEnterpriseIntegrations(organizationId: string): Promise<EnterpriseIntegration[]> {
  try {
    return await EnterpriseIntegrationAPI.getIntegrations(organizationId);
  } catch (error) {
    console.error('Error fetching enterprise integrations:', error);
    throw error;
  }
}

// Create new enterprise integration
export async function createEnterpriseIntegration(
  integration: Omit<EnterpriseIntegration, 'id'>,
  userId: string
): Promise<EnterpriseIntegration> {
  try {
    return await EnterpriseIntegrationAPI.createIntegration(integration, userId);
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
    return await EnterpriseIntegrationAPI.updateIntegration(integrationId, updates);
  } catch (error) {
    console.error('Error updating enterprise integration:', error);
    throw error;
  }
}

// Delete enterprise integration
export async function deleteEnterpriseIntegration(integrationId: string): Promise<void> {
  try {
    await EnterpriseIntegrationAPI.deleteIntegration(integrationId);
  } catch (error) {
    console.error('Error deleting enterprise integration:', error);
    throw error;
  }
}

// Test integration connection
export async function testIntegrationConnection(integrationId: string): Promise<boolean> {
  try {
    return await EnterpriseIntegrationAPI.testIntegration(integrationId);
  } catch (error) {
    console.error('Error testing integration connection:', error);
    return false;
  }
}

// Sync integration data
export async function syncIntegrationData(
  integrationId: string,
  entityType: string
): Promise<SyncResult> {
  try {
    return await EnterpriseIntegrationAPI.syncIntegrationData(integrationId, entityType);
  } catch (error) {
    console.error('Error syncing integration data:', error);
    throw error;
  }
}

// Create webhook for integration
export async function createIntegrationWebhook(
  integrationId: string,
  eventType: string
): Promise<string> {
  try {
    return await EnterpriseIntegrationAPI.createWebhook(integrationId, eventType);
  } catch (error) {
    console.error('Error creating integration webhook:', error);
    throw error;
  }
}

// Delete webhook for integration
export async function deleteIntegrationWebhook(
  integrationId: string,
  eventType: string
): Promise<boolean> {
  try {
    return await EnterpriseIntegrationAPI.deleteWebhook(integrationId, eventType);
  } catch (error) {
    console.error('Error deleting integration webhook:', error);
    return false;
  }
}

// Process webhook payload
export async function processWebhookPayload(
  integrationType: string,
  payload: any
): Promise<void> {
  try {
    await EnterpriseIntegrationAPI.processWebhookPayload(integrationType, payload);
  } catch (error) {
    console.error('Error processing webhook payload:', error);
    throw error;
  }
}

// Get integration sync history
export async function getIntegrationSyncHistory(integrationId: string) {
  try {
    const { data, error } = await supabase
      .from('enterprise_integrations')
      .select('last_sync_at, sync_status, error_message')
      .eq('id', integrationId)
      .single();

    if (error) throw error;

    return {
      lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at) : null,
      syncStatus: data.sync_status,
      errorMessage: data.error_message
    };
  } catch (error) {
    console.error('Error fetching integration sync history:', error);
    throw error;
  }
}

// Get integration statistics
export async function getIntegrationStatistics(organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('enterprise_integrations')
      .select('integration_type, sync_status, is_active')
      .eq('organization_id', organizationId);

    if (error) throw error;

    const stats = {
      total: data.length,
      active: data.filter(i => i.is_active).length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>
    };

    data.forEach(integration => {
      stats.byType[integration.integration_type] = (stats.byType[integration.integration_type] || 0) + 1;
      stats.byStatus[integration.sync_status] = (stats.byStatus[integration.sync_status] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error fetching integration statistics:', error);
    throw error;
  }
}

// Batch sync multiple integrations
export async function batchSyncIntegrations(
  integrationIds: string[],
  entityType: string
): Promise<SyncResult[]> {
  try {
    const results = [];
    
    for (const integrationId of integrationIds) {
      try {
        const result = await syncIntegrationData(integrationId, entityType);
        results.push({ integrationId, success: true, result });
      } catch (error) {
        results.push({ 
          integrationId, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error batch syncing integrations:', error);
    throw error;
  }
}

// Get integration templates
export async function getIntegrationTemplates() {
  return [
    {
      type: 'salesforce',
      name: 'Salesforce CRM',
      description: 'Sync contacts, accounts, opportunities, and leads from Salesforce',
      icon: 'salesforce',
      fields: [
        { name: 'clientId', label: 'Client ID', type: 'text', required: true },
        { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
        { name: 'username', label: 'Username', type: 'text', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true },
        { name: 'securityToken', label: 'Security Token', type: 'password', required: true }
      ],
      supportedEntities: ['contacts', 'companies', 'opportunities', 'leads']
    },
    {
      type: 'dynamics',
      name: 'Microsoft Dynamics 365',
      description: 'Sync data from Microsoft Dynamics 365 CRM',
      icon: 'dynamics',
      fields: [
        { name: 'clientId', label: 'Client ID', type: 'text', required: true },
        { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
        { name: 'tenantId', label: 'Tenant ID', type: 'text', required: true },
        { name: 'instanceUrl', label: 'Instance URL', type: 'url', required: true }
      ],
      supportedEntities: ['contacts', 'companies', 'opportunities', 'leads']
    },
    {
      type: 'sap',
      name: 'SAP Business One',
      description: 'Integrate with SAP Business One for enterprise data',
      icon: 'sap',
      fields: [
        { name: 'clientId', label: 'Client ID', type: 'text', required: true },
        { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
        { name: 'baseUrl', label: 'Base URL', type: 'url', required: true }
      ],
      supportedEntities: ['contacts', 'companies', 'opportunities', 'leads']
    },
    {
      type: 'oracle',
      name: 'Oracle CX Cloud',
      description: 'Sync data from Oracle CX Cloud platform',
      icon: 'oracle',
      fields: [
        { name: 'clientId', label: 'Client ID', type: 'text', required: true },
        { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
        { name: 'instanceUrl', label: 'Instance URL', type: 'url', required: true }
      ],
      supportedEntities: ['contacts', 'companies', 'opportunities', 'leads']
    },
    {
      type: 'workday',
      name: 'Workday',
      description: 'Integrate with Workday for HR and financial data',
      icon: 'workday',
      fields: [
        { name: 'clientId', label: 'Client ID', type: 'text', required: true },
        { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
        { name: 'tenantId', label: 'Tenant ID', type: 'text', required: true },
        { name: 'baseUrl', label: 'Base URL', type: 'url', required: true }
      ],
      supportedEntities: ['contacts', 'companies']
    },
    {
      type: 'hubspot',
      name: 'HubSpot',
      description: 'Sync contacts, companies, and deals from HubSpot',
      icon: 'hubspot',
      fields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true },
        { name: 'portalId', label: 'Portal ID', type: 'text', required: true }
      ],
      supportedEntities: ['contacts', 'companies', 'opportunities', 'leads']
    },
    {
      type: 'pipedrive',
      name: 'Pipedrive',
      description: 'Sync contacts, organizations, and deals from Pipedrive',
      icon: 'pipedrive',
      fields: [
        { name: 'apiToken', label: 'API Token', type: 'password', required: true },
        { name: 'companyDomain', label: 'Company Domain', type: 'text', required: true }
      ],
      supportedEntities: ['contacts', 'companies', 'opportunities', 'leads']
    },
    {
      type: 'custom',
      name: 'Custom API',
      description: 'Connect to custom APIs with flexible configuration',
      icon: 'custom',
      fields: [
        { name: 'baseUrl', label: 'Base URL', type: 'url', required: true },
        { name: 'apiKey', label: 'API Key', type: 'password', required: false },
        { name: 'username', label: 'Username', type: 'text', required: false },
        { name: 'password', label: 'Password', type: 'password', required: false },
        { name: 'authType', label: 'Authentication Type', type: 'select', required: true, options: ['api_key', 'basic', 'bearer', 'oauth2'] }
      ],
      supportedEntities: ['contacts', 'companies', 'opportunities', 'leads']
    }
  ];
}

// Validate integration configuration
export async function validateIntegrationConfig(
  integrationType: string,
  config: Record<string, any>
): Promise<{ valid: boolean; errors: string[] }> {
  try {
    const templates = await getIntegrationTemplates();
    const template = templates.find(t => t.type === integrationType);
    
    if (!template) {
      return { valid: false, errors: ['Invalid integration type'] };
    }

    const errors: string[] = [];
    
    template.fields.forEach(field => {
      if (field.required && !config[field.name]) {
        errors.push(`${field.label} is required`);
      }
      
      if (field.type === 'url' && config[field.name]) {
        try {
          new URL(config[field.name]);
        } catch {
          errors.push(`${field.label} must be a valid URL`);
        }
      }
    });

    return { valid: errors.length === 0, errors };
  } catch (error) {
    console.error('Error validating integration config:', error);
    return { valid: false, errors: ['Validation error'] };
  }
}

// Get integration health status
export async function getIntegrationHealth(integrationId: string) {
  try {
    const { data: integration } = await supabase
      .from('enterprise_integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (!integration) {
      return { status: 'not_found', message: 'Integration not found' };
    }

    const now = new Date();
    const lastSync = integration.last_sync_at ? new Date(integration.last_sync_at) : null;
    const syncFrequency = integration.sync_frequency_minutes || 60;
    
    let status = 'healthy';
    let message = 'Integration is working properly';

    if (!integration.is_active) {
      status = 'disabled';
      message = 'Integration is disabled';
    } else if (integration.sync_status === 'error') {
      status = 'error';
      message = integration.error_message || 'Sync error occurred';
    } else if (lastSync && (now.getTime() - lastSync.getTime()) > (syncFrequency * 60 * 1000 * 2)) {
      status = 'warning';
      message = 'Integration has not synced recently';
    }

    return {
      status,
      message,
      lastSync,
      syncFrequency,
      isActive: integration.is_active,
      syncStatus: integration.sync_status
    };
  } catch (error) {
    console.error('Error getting integration health:', error);
    return { status: 'error', message: 'Unable to check integration health' };
  }
}

// Export all functions
export {
  EnterpriseIntegrationAPI
};
