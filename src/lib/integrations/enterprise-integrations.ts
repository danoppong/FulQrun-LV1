// Enterprise Integration Ecosystem
// Advanced integrations with Salesforce, Dynamics, SAP, Oracle, Workday, and custom APIs

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types for enterprise integrations
export interface EnterpriseIntegration {
  id: string;
  integrationType: 'salesforce' | 'dynamics' | 'sap' | 'oracle' | 'workday' | 'hubspot' | 'pipedrive' | 'custom';
  name: string;
  config: Record<string, any>;
  credentials: Record<string, any>;
  webhookConfig: Record<string, any>;
  syncConfig: Record<string, any>;
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
  data: any;
  timestamp: Date;
  organizationId: string;
}

// Base Integration Class
abstract class BaseIntegration {
  protected config: Record<string, any>;
  protected credentials: Record<string, any>;
  protected organizationId: string;

  constructor(config: Record<string, any>, credentials: Record<string, any>, organizationId: string) {
    this.config = config;
    this.credentials = credentials;
    this.organizationId = organizationId;
  }

  abstract authenticate(): Promise<boolean>;
  abstract syncData(entityType: string): Promise<SyncResult>;
  abstract createWebhook(eventType: string): Promise<string>;
  abstract deleteWebhook(webhookId: string): Promise<boolean>;
}

// Salesforce Integration
class SalesforceIntegration extends BaseIntegration {
  private accessToken?: string;
  private instanceUrl?: string;

  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: this.credentials.clientId,
          client_secret: this.credentials.clientSecret,
          username: this.credentials.username,
          password: this.credentials.password + this.credentials.securityToken,
        }),
      });

      const data = await response.json();
      if (data.access_token) {
        this.accessToken = data.access_token;
        this.instanceUrl = data.instance_url;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Salesforce authentication error:', error);
      return false;
    }
  }

  async syncData(entityType: string): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;

    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      const sfEntityMap = {
        'contacts': 'Contact',
        'companies': 'Account',
        'opportunities': 'Opportunity',
        'leads': 'Lead'
      };

      const sfEntity = sfEntityMap[entityType as keyof typeof sfEntityMap];
      if (!sfEntity) {
        throw new Error(`Unsupported entity type: ${entityType}`);
      }

      // Fetch data from Salesforce
      const sfResponse = await fetch(`${this.instanceUrl}/services/data/v58.0/query/?q=SELECT+*+FROM+${sfEntity}+LIMIT+1000`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const sfData = await sfResponse.json();
      recordsProcessed = sfData.records?.length || 0;

      // Transform and sync to FulQrun
      for (const record of sfData.records || []) {
        try {
          const transformedData = this.transformSalesforceRecord(record, entityType);
          const existingRecord = await this.findExistingRecord(entityType, record.Id);

          if (existingRecord) {
            await this.updateFulQrunRecord(entityType, existingRecord.id, transformedData);
            recordsUpdated++;
          } else {
            await this.createFulQrunRecord(entityType, transformedData);
            recordsCreated++;
          }
        } catch (error) {
          console.error(`Error syncing record ${record.Id}:`, error);
          recordsFailed++;
        }
      }

      return {
        success: true,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        syncDuration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        errorMessage: error.message,
        syncDuration: Date.now() - startTime
      };
    }
  }

  private transformSalesforceRecord(record: any, entityType: string): any {
    const baseData = {
      organization_id: this.organizationId,
      external_id: record.Id,
      external_source: 'salesforce'
    };

    switch (entityType) {
      case 'contacts':
        return {
          ...baseData,
          first_name: record.FirstName,
          last_name: record.LastName,
          email: record.Email,
          phone: record.Phone,
          title: record.Title,
          company_id: record.AccountId
        };
      case 'companies':
        return {
          ...baseData,
          name: record.Name,
          industry: record.Industry,
          size: record.NumberOfEmployees,
          website: record.Website,
          address: record.BillingAddress?.street,
          city: record.BillingAddress?.city,
          state: record.BillingAddress?.state,
          zip_code: record.BillingAddress?.postalCode,
          country: record.BillingAddress?.country
        };
      case 'opportunities':
        return {
          ...baseData,
          name: record.Name,
          deal_value: record.Amount,
          stage: this.mapSalesforceStage(record.StageName),
          probability: record.Probability,
          expected_close_date: record.CloseDate,
          company_id: record.AccountId
        };
      case 'leads':
        return {
          ...baseData,
          first_name: record.FirstName,
          last_name: record.LastName,
          email: record.Email,
          phone: record.Phone,
          company: record.Company,
          title: record.Title,
          status: this.mapSalesforceLeadStatus(record.Status)
        };
      default:
        return baseData;
    }
  }

  private mapSalesforceStage(stage: string): string {
    const stageMap = {
      'Prospecting': 'prospecting',
      'Qualification': 'qualification',
      'Needs Analysis': 'needs_analysis',
      'Value Proposition': 'value_proposition',
      'Id. Decision Makers': 'decision_makers',
      'Perception Analysis': 'perception_analysis',
      'Proposal/Price Quote': 'proposal',
      'Negotiation/Review': 'negotiation',
      'Closed Won': 'closed_won',
      'Closed Lost': 'closed_lost'
    };
    return stageMap[stage as keyof typeof stageMap] || 'prospecting';
  }

  private mapSalesforceLeadStatus(status: string): string {
    const statusMap = {
      'Open - Not Contacted': 'new',
      'Working - Contacted': 'contacted',
      'Closed - Converted': 'converted',
      'Closed - Not Converted': 'not_converted'
    };
    return statusMap[status as keyof typeof statusMap] || 'new';
  }

  async createWebhook(eventType: string): Promise<string> {
    // Salesforce webhook implementation
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/salesforce`;
    
    const response = await fetch(`${this.instanceUrl}/services/data/v58.0/sobjects/OutboundMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Name: `FulQrun_${eventType}`,
        EndpointUrl: webhookUrl,
        EventType: eventType,
        IsActive: true
      })
    });

    const data = await response.json();
    return data.id;
  }

  async deleteWebhook(webhookId: string): Promise<boolean> {
    try {
      await fetch(`${this.instanceUrl}/services/data/v58.0/sobjects/OutboundMessage/${webhookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });
      return true;
    } catch (error) {
      console.error('Error deleting Salesforce webhook:', error);
      return false;
    }
  }

  private async findExistingRecord(entityType: string, externalId: string): Promise<any> {
    const { data } = await supabase
      .from(entityType)
      .select('*')
      .eq('external_id', externalId)
      .eq('organization_id', this.organizationId)
      .single();
    return data;
  }

  private async createFulQrunRecord(entityType: string, data: any): Promise<void> {
    const { error } = await supabase
      .from(entityType)
      .insert(data);
    if (error) throw error;
  }

  private async updateFulQrunRecord(entityType: string, id: string, data: any): Promise<void> {
    const { error } = await supabase
      .from(entityType)
      .update(data)
      .eq('id', id);
    if (error) throw error;
  }
}

// Microsoft Dynamics Integration
class DynamicsIntegration extends BaseIntegration {
  private accessToken?: string;
  private baseUrl?: string;

  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`https://login.microsoftonline.com/${this.credentials.tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.credentials.clientId,
          client_secret: this.credentials.clientSecret,
          scope: 'https://org.api.crm.dynamics.com/.default',
          grant_type: 'client_credentials',
        }),
      });

      const data = await response.json();
      if (data.access_token) {
        this.accessToken = data.access_token;
        this.baseUrl = this.credentials.instanceUrl;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Dynamics authentication error:', error);
      return false;
    }
  }

  async syncData(entityType: string): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;

    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      const dynamicsEntityMap = {
        'contacts': 'contacts',
        'companies': 'accounts',
        'opportunities': 'opportunities',
        'leads': 'leads'
      };

      const dynamicsEntity = dynamicsEntityMap[entityType as keyof typeof dynamicsEntityMap];
      if (!dynamicsEntity) {
        throw new Error(`Unsupported entity type: ${entityType}`);
      }

      // Fetch data from Dynamics
      const dynamicsResponse = await fetch(`${this.baseUrl}/api/data/v9.2/${dynamicsEntity}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
        },
      });

      const dynamicsData = await dynamicsResponse.json();
      recordsProcessed = dynamicsData.value?.length || 0;

      // Transform and sync to FulQrun
      for (const record of dynamicsData.value || []) {
        try {
          const transformedData = this.transformDynamicsRecord(record, entityType);
          const existingRecord = await this.findExistingRecord(entityType, record.contactid || record.accountid || record.opportunityid || record.leadid);

          if (existingRecord) {
            await this.updateFulQrunRecord(entityType, existingRecord.id, transformedData);
            recordsUpdated++;
          } else {
            await this.createFulQrunRecord(entityType, transformedData);
            recordsCreated++;
          }
        } catch (error) {
          console.error(`Error syncing Dynamics record:`, error);
          recordsFailed++;
        }
      }

      return {
        success: true,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        syncDuration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        errorMessage: error.message,
        syncDuration: Date.now() - startTime
      };
    }
  }

  private transformDynamicsRecord(record: any, entityType: string): any {
    const baseData = {
      organization_id: this.organizationId,
      external_id: record.contactid || record.accountid || record.opportunityid || record.leadid,
      external_source: 'dynamics'
    };

    switch (entityType) {
      case 'contacts':
        return {
          ...baseData,
          first_name: record.firstname,
          last_name: record.lastname,
          email: record.emailaddress1,
          phone: record.telephone1,
          title: record.jobtitle,
          company_id: record.parentcustomerid
        };
      case 'companies':
        return {
          ...baseData,
          name: record.name,
          industry: record.industrycode,
          size: record.numberofemployees,
          website: record.websiteurl,
          address: record.address1_line1,
          city: record.address1_city,
          state: record.address1_stateorprovince,
          zip_code: record.address1_postalcode,
          country: record.address1_country
        };
      case 'opportunities':
        return {
          ...baseData,
          name: record.name,
          deal_value: record.estimatedvalue,
          stage: this.mapDynamicsStage(record.statecode),
          probability: record.closeprobability,
          expected_close_date: record.estimatedclosedate,
          company_id: record.customerid
        };
      case 'leads':
        return {
          ...baseData,
          first_name: record.firstname,
          last_name: record.lastname,
          email: record.emailaddress1,
          phone: record.telephone1,
          company: record.companyname,
          title: record.jobtitle,
          status: this.mapDynamicsLeadStatus(record.statecode)
        };
      default:
        return baseData;
    }
  }

  private mapDynamicsStage(stateCode: number): string {
    const stageMap = {
      0: 'prospecting',
      1: 'qualification',
      2: 'needs_analysis',
      3: 'value_proposition',
      4: 'decision_makers',
      5: 'perception_analysis',
      6: 'proposal',
      7: 'negotiation',
      8: 'closed_won',
      9: 'closed_lost'
    };
    return stageMap[stateCode as keyof typeof stageMap] || 'prospecting';
  }

  private mapDynamicsLeadStatus(stateCode: number): string {
    const statusMap = {
      0: 'new',
      1: 'contacted',
      2: 'converted',
      3: 'not_converted'
    };
    return statusMap[stateCode as keyof typeof statusMap] || 'new';
  }

  async createWebhook(eventType: string): Promise<string> {
    // Dynamics webhook implementation
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/dynamics`;
    
    const response = await fetch(`${this.baseUrl}/api/data/v9.2/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `FulQrun_${eventType}`,
        url: webhookUrl,
        events: [eventType],
        isActive: true
      })
    });

    const data = await response.json();
    return data.webhookid;
  }

  async deleteWebhook(webhookId: string): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/api/data/v9.2/webhooks(${webhookId})`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });
      return true;
    } catch (error) {
      console.error('Error deleting Dynamics webhook:', error);
      return false;
    }
  }

  private async findExistingRecord(entityType: string, externalId: string): Promise<any> {
    const { data } = await supabase
      .from(entityType)
      .select('*')
      .eq('external_id', externalId)
      .eq('organization_id', this.organizationId)
      .single();
    return data;
  }

  private async createFulQrunRecord(entityType: string, data: any): Promise<void> {
    const { error } = await supabase
      .from(entityType)
      .insert(data);
    if (error) throw error;
  }

  private async updateFulQrunRecord(entityType: string, id: string, data: any): Promise<void> {
    const { error } = await supabase
      .from(entityType)
      .update(data)
      .eq('id', id);
    if (error) throw error;
  }
}

// SAP Integration
class SAPIntegration extends BaseIntegration {
  private accessToken?: string;
  private baseUrl?: string;

  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.credentials.baseUrl}/sap/bc/rest/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.credentials.clientId,
          client_secret: this.credentials.clientSecret,
        }),
      });

      const data = await response.json();
      if (data.access_token) {
        this.accessToken = data.access_token;
        this.baseUrl = this.credentials.baseUrl;
        return true;
      }
      return false;
    } catch (error) {
      console.error('SAP authentication error:', error);
      return false;
    }
  }

  async syncData(entityType: string): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;

    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      const sapEntityMap = {
        'contacts': 'BusinessPartner',
        'companies': 'Customer',
        'opportunities': 'SalesDocument',
        'leads': 'Lead'
      };

      const sapEntity = sapEntityMap[entityType as keyof typeof sapEntityMap];
      if (!sapEntity) {
        throw new Error(`Unsupported entity type: ${entityType}`);
      }

      // Fetch data from SAP
      const sapResponse = await fetch(`${this.baseUrl}/sap/bc/rest/api/${sapEntity}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const sapData = await sapResponse.json();
      recordsProcessed = sapData.results?.length || 0;

      // Transform and sync to FulQrun
      for (const record of sapData.results || []) {
        try {
          const transformedData = this.transformSAPRecord(record, entityType);
          const existingRecord = await this.findExistingRecord(entityType, record.BusinessPartner || record.Customer || record.SalesDocument || record.Lead);

          if (existingRecord) {
            await this.updateFulQrunRecord(entityType, existingRecord.id, transformedData);
            recordsUpdated++;
          } else {
            await this.createFulQrunRecord(entityType, transformedData);
            recordsCreated++;
          }
        } catch (error) {
          console.error(`Error syncing SAP record:`, error);
          recordsFailed++;
        }
      }

      return {
        success: true,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        syncDuration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        errorMessage: error.message,
        syncDuration: Date.now() - startTime
      };
    }
  }

  private transformSAPRecord(record: any, entityType: string): any {
    const baseData = {
      organization_id: this.organizationId,
      external_id: record.BusinessPartner || record.Customer || record.SalesDocument || record.Lead,
      external_source: 'sap'
    };

    switch (entityType) {
      case 'contacts':
        return {
          ...baseData,
          first_name: record.FirstName,
          last_name: record.LastName,
          email: record.EmailAddress,
          phone: record.PhoneNumber,
          title: record.JobTitle,
          company_id: record.BusinessPartner
        };
      case 'companies':
        return {
          ...baseData,
          name: record.CustomerName,
          industry: record.Industry,
          size: record.EmployeeCount,
          website: record.Website,
          address: record.Address,
          city: record.City,
          state: record.State,
          zip_code: record.PostalCode,
          country: record.Country
        };
      case 'opportunities':
        return {
          ...baseData,
          name: record.SalesDocument,
          deal_value: record.NetValue,
          stage: this.mapSAPStage(record.DocumentStatus),
          probability: record.Probability,
          expected_close_date: record.RequestedDeliveryDate,
          company_id: record.SoldToParty
        };
      case 'leads':
        return {
          ...baseData,
          first_name: record.FirstName,
          last_name: record.LastName,
          email: record.EmailAddress,
          phone: record.PhoneNumber,
          company: record.CompanyName,
          title: record.JobTitle,
          status: this.mapSAPLeadStatus(record.Status)
        };
      default:
        return baseData;
    }
  }

  private mapSAPStage(status: string): string {
    const stageMap = {
      'A': 'prospecting',
      'B': 'qualification',
      'C': 'needs_analysis',
      'D': 'value_proposition',
      'E': 'decision_makers',
      'F': 'perception_analysis',
      'G': 'proposal',
      'H': 'negotiation',
      'I': 'closed_won',
      'J': 'closed_lost'
    };
    return stageMap[status as keyof typeof stageMap] || 'prospecting';
  }

  private mapSAPLeadStatus(status: string): string {
    const statusMap = {
      'NEW': 'new',
      'CONTACTED': 'contacted',
      'CONVERTED': 'converted',
      'NOT_CONVERTED': 'not_converted'
    };
    return statusMap[status as keyof typeof statusMap] || 'new';
  }

  async createWebhook(eventType: string): Promise<string> {
    // SAP webhook implementation
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/sap`;
    
    const response = await fetch(`${this.baseUrl}/sap/bc/rest/api/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `FulQrun_${eventType}`,
        url: webhookUrl,
        events: [eventType],
        isActive: true
      })
    });

    const data = await response.json();
    return data.webhookId;
  }

  async deleteWebhook(webhookId: string): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/sap/bc/rest/api/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });
      return true;
    } catch (error) {
      console.error('Error deleting SAP webhook:', error);
      return false;
    }
  }

  private async findExistingRecord(entityType: string, externalId: string): Promise<any> {
    const { data } = await supabase
      .from(entityType)
      .select('*')
      .eq('external_id', externalId)
      .eq('organization_id', this.organizationId)
      .single();
    return data;
  }

  private async createFulQrunRecord(entityType: string, data: any): Promise<void> {
    const { error } = await supabase
      .from(entityType)
      .insert(data);
    if (error) throw error;
  }

  private async updateFulQrunRecord(entityType: string, id: string, data: any): Promise<void> {
    const { error } = await supabase
      .from(entityType)
      .update(data)
      .eq('id', id);
    if (error) throw error;
  }
}

// Integration Factory
class IntegrationFactory {
  static createIntegration(
    integrationType: string,
    config: Record<string, any>,
    credentials: Record<string, any>,
    organizationId: string
  ): BaseIntegration {
    switch (integrationType) {
      case 'salesforce':
        return new SalesforceIntegration(config, credentials, organizationId);
      case 'dynamics':
        return new DynamicsIntegration(config, credentials, organizationId);
      case 'sap':
        return new SAPIntegration(config, credentials, organizationId);
      default:
        throw new Error(`Unsupported integration type: ${integrationType}`);
    }
  }
}

// Enterprise Integration API
export class EnterpriseIntegrationAPI {
  // Get all integrations for an organization
  static async getIntegrations(organizationId: string): Promise<EnterpriseIntegration[]> {
    try {
      const { data, error } = await supabase
        .from('enterprise_integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(integration => ({
        id: integration.id,
        integrationType: integration.integration_type,
        name: integration.name,
        config: integration.config,
        credentials: integration.credentials,
        webhookConfig: integration.webhook_config,
        syncConfig: integration.sync_config,
        isActive: integration.is_active,
        lastSyncAt: integration.last_sync_at ? new Date(integration.last_sync_at) : undefined,
        syncStatus: integration.sync_status,
        errorMessage: integration.error_message,
        syncFrequencyMinutes: integration.sync_frequency_minutes,
        organizationId: integration.organization_id
      }));
    } catch (error) {
      console.error('Error fetching integrations:', error);
      throw error;
    }
  }

  // Create new integration
  static async createIntegration(
    integration: Omit<EnterpriseIntegration, 'id'>,
    userId: string
  ): Promise<EnterpriseIntegration> {
    try {
      const { data, error } = await supabase
        .from('enterprise_integrations')
        .insert({
          integration_type: integration.integrationType,
          name: integration.name,
          config: integration.config,
          credentials: integration.credentials,
          webhook_config: integration.webhookConfig,
          sync_config: integration.syncConfig,
          is_active: integration.isActive,
          sync_frequency_minutes: integration.syncFrequencyMinutes,
          organization_id: integration.organizationId,
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        integrationType: data.integration_type,
        name: data.name,
        config: data.config,
        credentials: data.credentials,
        webhookConfig: data.webhook_config,
        syncConfig: data.sync_config,
        isActive: data.is_active,
        lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at) : undefined,
        syncStatus: data.sync_status,
        errorMessage: data.error_message,
        syncFrequencyMinutes: data.sync_frequency_minutes,
        organizationId: data.organization_id
      };
    } catch (error) {
      console.error('Error creating integration:', error);
      throw error;
    }
  }

  // Update integration
  static async updateIntegration(
    integrationId: string,
    updates: Partial<EnterpriseIntegration>
  ): Promise<EnterpriseIntegration> {
    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.config) updateData.config = updates.config;
      if (updates.credentials) updateData.credentials = updates.credentials;
      if (updates.webhookConfig) updateData.webhook_config = updates.webhookConfig;
      if (updates.syncConfig) updateData.sync_config = updates.syncConfig;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.syncFrequencyMinutes) updateData.sync_frequency_minutes = updates.syncFrequencyMinutes;

      const { data, error } = await supabase
        .from('enterprise_integrations')
        .update(updateData)
        .eq('id', integrationId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        integrationType: data.integration_type,
        name: data.name,
        config: data.config,
        credentials: data.credentials,
        webhookConfig: data.webhook_config,
        syncConfig: data.sync_config,
        isActive: data.is_active,
        lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at) : undefined,
        syncStatus: data.sync_status,
        errorMessage: data.error_message,
        syncFrequencyMinutes: data.sync_frequency_minutes,
        organizationId: data.organization_id
      };
    } catch (error) {
      console.error('Error updating integration:', error);
      throw error;
    }
  }

  // Delete integration
  static async deleteIntegration(integrationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('enterprise_integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting integration:', error);
      throw error;
    }
  }

  // Test integration connection
  static async testIntegration(integrationId: string): Promise<boolean> {
    try {
      const { data: integration } = await supabase
        .from('enterprise_integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (!integration) throw new Error('Integration not found');

      const integrationInstance = IntegrationFactory.createIntegration(
        integration.integration_type,
        integration.config,
        integration.credentials,
        integration.organization_id
      );

      return await integrationInstance.authenticate();
    } catch (error) {
      console.error('Error testing integration:', error);
      return false;
    }
  }

  // Sync data from integration
  static async syncIntegrationData(
    integrationId: string,
    entityType: string
  ): Promise<SyncResult> {
    try {
      const { data: integration } = await supabase
        .from('enterprise_integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (!integration) throw new Error('Integration not found');

      const integrationInstance = IntegrationFactory.createIntegration(
        integration.integration_type,
        integration.config,
        integration.credentials,
        integration.organization_id
      );

      const result = await integrationInstance.syncData(entityType);

      // Update sync status
      await supabase
        .from('enterprise_integrations')
        .update({
          last_sync_at: new Date().toISOString(),
          sync_status: result.success ? 'success' : 'error',
          error_message: result.errorMessage
        })
        .eq('id', integrationId);

      return result;
    } catch (error) {
      console.error('Error syncing integration data:', error);
      throw error;
    }
  }

  // Create webhook for integration
  static async createWebhook(
    integrationId: string,
    eventType: string
  ): Promise<string> {
    try {
      const { data: integration } = await supabase
        .from('enterprise_integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (!integration) throw new Error('Integration not found');

      const integrationInstance = IntegrationFactory.createIntegration(
        integration.integration_type,
        integration.config,
        integration.credentials,
        integration.organization_id
      );

      const webhookId = await integrationInstance.createWebhook(eventType);

      // Update webhook config
      await supabase
        .from('enterprise_integrations')
        .update({
          webhook_config: {
            ...integration.webhook_config,
            [eventType]: webhookId
          }
        })
        .eq('id', integrationId);

      return webhookId;
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw error;
    }
  }

  // Delete webhook for integration
  static async deleteWebhook(
    integrationId: string,
    eventType: string
  ): Promise<boolean> {
    try {
      const { data: integration } = await supabase
        .from('enterprise_integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (!integration) throw new Error('Integration not found');

      const integrationInstance = IntegrationFactory.createIntegration(
        integration.integration_type,
        integration.config,
        integration.credentials,
        integration.organization_id
      );

      const webhookId = integration.webhook_config?.[eventType];
      if (!webhookId) return false;

      const success = await integrationInstance.deleteWebhook(webhookId);

      if (success) {
        // Update webhook config
        const updatedWebhookConfig = { ...integration.webhook_config };
        delete updatedWebhookConfig[eventType];

        await supabase
          .from('enterprise_integrations')
          .update({
            webhook_config: updatedWebhookConfig
          })
          .eq('id', integrationId);
      }

      return success;
    } catch (error) {
      console.error('Error deleting webhook:', error);
      return false;
    }
  }

  // Process webhook payload
  static async processWebhookPayload(
    integrationType: string,
    payload: WebhookPayload
  ): Promise<void> {
    try {
      // Log webhook event
      await supabase
        .from('enterprise_audit_logs')
        .insert({
          user_id: null,
          organization_id: payload.organizationId,
          action_type: 'webhook_received',
          entity_type: payload.entityType,
          entity_id: payload.entityId,
          new_values: payload.data,
          ip_address: null,
          user_agent: 'webhook',
          session_id: null,
          risk_level: 'low',
          compliance_flags: ['webhook_event']
        });

      // Process based on integration type and event type
      switch (integrationType) {
        case 'salesforce':
          await this.processSalesforceWebhook(payload);
          break;
        case 'dynamics':
          await this.processDynamicsWebhook(payload);
          break;
        case 'sap':
          await this.processSAPWebhook(payload);
          break;
        default:
          console.warn(`Unsupported integration type: ${integrationType}`);
      }
    } catch (error) {
      console.error('Error processing webhook payload:', error);
      throw error;
    }
  }

  private static async processSalesforceWebhook(payload: WebhookPayload): Promise<void> {
    // Process Salesforce webhook data
    const { data } = payload;
    
    // Map Salesforce fields to FulQrun fields
    const mappedData = {
      organization_id: payload.organizationId,
      external_id: data.Id,
      external_source: 'salesforce',
      updated_at: new Date().toISOString()
    };

    // Update or create record based on entity type
    const { data: existingRecord } = await supabase
      .from(payload.entityType)
      .select('*')
      .eq('external_id', data.Id)
      .eq('organization_id', payload.organizationId)
      .single();

    if (existingRecord) {
      await supabase
        .from(payload.entityType)
        .update(mappedData)
        .eq('id', existingRecord.id);
    } else {
      await supabase
        .from(payload.entityType)
        .insert(mappedData);
    }
  }

  private static async processDynamicsWebhook(payload: WebhookPayload): Promise<void> {
    // Process Dynamics webhook data
    const { data } = payload;
    
    // Map Dynamics fields to FulQrun fields
    const mappedData = {
      organization_id: payload.organizationId,
      external_id: data.contactid || data.accountid || data.opportunityid || data.leadid,
      external_source: 'dynamics',
      updated_at: new Date().toISOString()
    };

    // Update or create record based on entity type
    const externalId = data.contactid || data.accountid || data.opportunityid || data.leadid;
    const { data: existingRecord } = await supabase
      .from(payload.entityType)
      .select('*')
      .eq('external_id', externalId)
      .eq('organization_id', payload.organizationId)
      .single();

    if (existingRecord) {
      await supabase
        .from(payload.entityType)
        .update(mappedData)
        .eq('id', existingRecord.id);
    } else {
      await supabase
        .from(payload.entityType)
        .insert(mappedData);
    }
  }

  private static async processSAPWebhook(payload: WebhookPayload): Promise<void> {
    // Process SAP webhook data
    const { data } = payload;
    
    // Map SAP fields to FulQrun fields
    const mappedData = {
      organization_id: payload.organizationId,
      external_id: data.BusinessPartner || data.Customer || data.SalesDocument || data.Lead,
      external_source: 'sap',
      updated_at: new Date().toISOString()
    };

    // Update or create record based on entity type
    const externalId = data.BusinessPartner || data.Customer || data.SalesDocument || data.Lead;
    const { data: existingRecord } = await supabase
      .from(payload.entityType)
      .select('*')
      .eq('external_id', externalId)
      .eq('organization_id', payload.organizationId)
      .single();

    if (existingRecord) {
      await supabase
        .from(payload.entityType)
        .update(mappedData)
        .eq('id', existingRecord.id);
    } else {
      await supabase
        .from(payload.entityType)
        .insert(mappedData);
    }
  }
}

export default EnterpriseIntegrationAPI;
