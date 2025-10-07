// Salesforce Integration
// Enterprise Salesforce CRM integration with advanced features

import { createClient } from '@supabase/supabase-js'
import { BaseIntegration, SyncResult, SyncConfiguration, WebhookPayload } from './base-integration';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class SalesforceIntegration extends BaseIntegration {
  private accessToken?: string;
  private instanceUrl?: string;

  constructor(
    integrationId: string,
    config: Record<string, unknown>,
    credentials: Record<string, unknown>,
    organizationId: string
  ) {
    super(integrationId, config, credentials, organizationId);
  }

  async authenticate(): Promise<boolean> {
    try {
      const { clientId, clientSecret, username, password, securityToken } = this.credentials;
      
      if (!clientId || !clientSecret || !username || !password) {
        throw new Error('Missing required Salesforce credentials');
      }

      const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: clientId,
          client_secret: clientSecret,
          username: username,
          password: password + securityToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Salesforce authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.instanceUrl = data.instance_url;

      return true;
    } catch (error) {
      console.error('Salesforce authentication error:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.accessToken || !this.instanceUrl) {
        await this.authenticate();
      }

      const response = await fetch(`${this.instanceUrl}/services/data/v58.0/sobjects/`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Salesforce connection test failed:', error);
      return false;
    }
  }

  async syncData(entityType: string, syncConfig: SyncConfiguration): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;

    try {
      await this.logSyncActivity(entityType, 'sync_start', { syncConfig });

      // Get Salesforce data
      const salesforceData = await this.getSalesforceData(entityType);
      
      // Transform and sync data
      for (const record of salesforceData) {
        try {
          const transformedData = await this.transformData(record, syncConfig.fieldMappings);
          
          // Check if record exists in FulQrun
          const existingRecord = await this.findExistingRecord(entityType, transformedData);
          
          if (existingRecord) {
            await this.updateFulQrunRecord(entityType, existingRecord.id, transformedData);
            recordsUpdated++;
          } else {
            await this.createFulQrunRecord(entityType, transformedData);
            recordsCreated++;
          }
          
          recordsProcessed++;
        } catch (error) {
          console.error(`Error processing ${entityType} record:`, error);
          recordsFailed++;
        }
      }

      const syncDuration = Date.now() - startTime;
      const result: SyncResult = {
        success: recordsFailed === 0,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        syncDuration
      };

      await this.updateSyncStatus('success');
      await this.logSyncActivity(entityType, 'sync_complete', result);

      return result;
    } catch (error) {
      await this.handleSyncError(error, entityType);
      return {
        success: false,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        errorMessage: (error as Error).message,
        syncDuration: Date.now() - startTime
      };
    }
  }

  async getEntityData(entityType: string, entityId: string): Promise<Record<string, unknown>> {
    try {
      const sobjectName = this.getSalesforceObjectName(entityType);
      const response = await fetch(
        `${this.instanceUrl}/services/data/v58.0/sobjects/${sobjectName}/${entityId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ${entityType} data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${entityType} data:`, error);
      throw error;
    }
  }

  async createEntity(entityType: string, data: Record<string, unknown>): Promise<string> {
    try {
      const sobjectName = this.getSalesforceObjectName(entityType);
      const response = await fetch(
        `${this.instanceUrl}/services/data/v58.0/sobjects/${sobjectName}/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create ${entityType}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error(`Error creating ${entityType}:`, error);
      throw error;
    }
  }

  async updateEntity(entityType: string, entityId: string, data: Record<string, unknown>): Promise<boolean> {
    try {
      const sobjectName = this.getSalesforceObjectName(entityType);
      const response = await fetch(
        `${this.instanceUrl}/services/data/v58.0/sobjects/${sobjectName}/${entityId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      return response.ok;
    } catch (error) {
      console.error(`Error updating ${entityType}:`, error);
      return false;
    }
  }

  async deleteEntity(entityType: string, entityId: string): Promise<boolean> {
    try {
      const sobjectName = this.getSalesforceObjectName(entityType);
      const response = await fetch(
        `${this.instanceUrl}/services/data/v58.0/sobjects/${sobjectName}/${entityId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error(`Error deleting ${entityType}:`, error);
      return false;
    }
  }

  protected async handleWebhookCreate(payload: WebhookPayload): Promise<void> {
    // Handle Salesforce webhook create events
    const transformedData = await this.transformWebhookData(payload);
    await this.createFulQrunRecord(payload.entityType, transformedData);
  }

  protected async handleWebhookUpdate(payload: WebhookPayload): Promise<void> {
    // Handle Salesforce webhook update events
    const transformedData = await this.transformWebhookData(payload);
    const existingRecord = await this.findExistingRecord(payload.entityType, transformedData);
    
    if (existingRecord) {
      await this.updateFulQrunRecord(payload.entityType, existingRecord.id, transformedData);
    }
  }

  protected async handleWebhookDelete(payload: WebhookPayload): Promise<void> {
    // Handle Salesforce webhook delete events
    const existingRecord = await this.findExistingRecord(payload.entityType, { externalId: payload.entityId });
    
    if (existingRecord) {
      await this.deleteFulQrunRecord(payload.entityType, existingRecord.id);
    }
  }

  // Private helper methods
  private async getSalesforceData(entityType: string): Promise<Array<Record<string, unknown>>> {
    const sobjectName = this.getSalesforceObjectName(entityType);
    const query = this.buildSalesforceQuery(sobjectName);
    
    const response = await fetch(
      `${this.instanceUrl}/services/data/v58.0/query/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to query Salesforce: ${response.statusText}`);
    }

    const result = await response.json();
    return result.records || [];
  }

  private getSalesforceObjectName(entityType: string): string {
    const objectMapping: Record<string, string> = {
      'contact': 'Contact',
      'lead': 'Lead',
      'opportunity': 'Opportunity',
      'account': 'Account',
      'user': 'User',
    };

    return objectMapping[entityType] || entityType;
  }

  private buildSalesforceQuery(sobjectName: string): string {
    const fields = this.getSalesforceFields(sobjectName);
    return `SELECT ${fields.join(', ')} FROM ${sobjectName} WHERE LastModifiedDate >= LAST_N_DAYS:1`;
  }

  private getSalesforceFields(sobjectName: string): string[] {
    const fieldMapping: Record<string, string[]> = {
      'Contact': ['Id', 'FirstName', 'LastName', 'Email', 'Phone', 'AccountId', 'CreatedDate', 'LastModifiedDate'],
      'Lead': ['Id', 'FirstName', 'LastName', 'Email', 'Phone', 'Company', 'Status', 'CreatedDate', 'LastModifiedDate'],
      'Opportunity': ['Id', 'Name', 'Amount', 'StageName', 'CloseDate', 'AccountId', 'CreatedDate', 'LastModifiedDate'],
      'Account': ['Id', 'Name', 'Industry', 'Type', 'Phone', 'Website', 'CreatedDate', 'LastModifiedDate'],
      'User': ['Id', 'FirstName', 'LastName', 'Email', 'Username', 'IsActive', 'CreatedDate', 'LastModifiedDate'],
    };

    return fieldMapping[sobjectName] || ['Id', 'Name', 'CreatedDate', 'LastModifiedDate'];
  }

  private async transformWebhookData(payload: WebhookPayload): Promise<Record<string, unknown>> {
    // Transform Salesforce webhook data to FulQrun format
    const data = payload.data;
    
    return {
      externalId: data.Id,
      name: data.Name || `${data.FirstName || ''} ${data.LastName || ''}`.trim(),
      email: data.Email,
      phone: data.Phone,
      company: data.AccountId || data.Company,
      status: data.Status || data.StageName,
      amount: data.Amount,
      closeDate: data.CloseDate,
      industry: data.Industry,
      type: data.Type,
      website: data.Website,
      isActive: data.IsActive !== false,
      createdAt: data.CreatedDate,
      updatedAt: data.LastModifiedDate,
    };
  }

  private async findExistingRecord(entityType: string, data: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    // Find existing record in FulQrun by external ID
    const { data: record } = await supabase
      .from(this.getFulQrunTableName(entityType))
      .select('*')
      .eq('external_id', data.externalId)
      .eq('organization_id', this.organizationId)
      .single();

    return record;
  }

  private async createFulQrunRecord(entityType: string, data: Record<string, unknown>): Promise<void> {
    const tableName = this.getFulQrunTableName(entityType);
    
    await supabase
      .from(tableName)
      .insert({
        ...data,
        organization_id: this.organizationId,
        integration_id: this.integrationId,
      });
  }

  private async updateFulQrunRecord(entityType: string, recordId: string, data: Record<string, unknown>): Promise<void> {
    const tableName = this.getFulQrunTableName(entityType);
    
    await supabase
      .from(tableName)
      .update(data)
      .eq('id', recordId)
      .eq('organization_id', this.organizationId);
  }

  private async deleteFulQrunRecord(entityType: string, recordId: string): Promise<void> {
    const tableName = this.getFulQrunTableName(entityType);
    
    await supabase
      .from(tableName)
      .delete()
      .eq('id', recordId)
      .eq('organization_id', this.organizationId);
  }

  private getFulQrunTableName(entityType: string): string {
    const tableMapping: Record<string, string> = {
      'contact': 'contacts',
      'lead': 'leads',
      'opportunity': 'opportunities',
      'account': 'companies',
      'user': 'users',
    };

    return tableMapping[entityType] || entityType;
  }
}
