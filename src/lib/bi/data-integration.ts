// src/lib/bi/data-integration.ts
// Data Integration Service for Pharmaceutical BI Module
// Handles integration with external data sources like Salesforce, IQVIA, Snowflake, etc.

import { getSupabaseBrowserClient } from '@/lib/supabase-singleton';

export interface DataSourceConfig {
  id: string;
  name: string;
  type: 'salesforce' | 'iqvia' | 'snowflake' | 'redshift' | 'bigquery' | 'csv' | 'api';
  connectionString?: string;
  apiKey?: string;
  refreshInterval: number; // minutes
  lastSync?: Date;
  status: 'active' | 'inactive' | 'error' | 'syncing';
  errorMessage?: string;
}

export interface DataMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  required: boolean;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: string[];
  duration: number; // milliseconds
}

export interface PrescriptionData {
  productId: string;
  productName: string;
  hcpId: string;
  accountId?: string;
  prescriptionDate: Date;
  prescriptionType: 'new' | 'refill';
  volume: number;
  territoryId?: string;
  payerId?: string;
  payerName?: string;
  channel: 'retail' | 'mail_order' | 'specialty' | 'hospital';
}

export interface HCPData {
  hcpId: string;
  name: string;
  specialty?: string;
  practiceId?: string;
  practiceName?: string;
  territoryId?: string;
  formularyStatus?: 'preferred' | 'standard' | 'non_preferred' | 'not_covered';
}

export interface CallData {
  repId: string;
  hcpId: string;
  callDate: Date;
  durationMinutes?: number;
  callType: 'detailing' | 'sampling' | 'follow_up' | 'presentation' | 'lunch_meeting';
  productId?: string;
  productName?: string;
  outcome: 'successful' | 'unsuccessful' | 'follow_up_required' | 'no_response';
  samplesDistributed?: number;
  samplesRequested?: number;
  notes?: string;
  territoryId?: string;
}

export class DataIntegrationService {
  private supabase = getSupabaseBrowserClient();

  /**
   * Sync Salesforce CRM data
   */
  async syncSalesforceData(organizationId: string, config: DataSourceConfig): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsProcessed = 0;
    let recordsInserted = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;

    try {
      // Update sync status
      await this.updateSyncStatus(config.id, 'syncing');

      // Sync contacts/companies (HCPs)
      const hcpResult = await this.syncSalesforceHCPs(organizationId, config);
      recordsProcessed += hcpResult.recordsProcessed;
      recordsInserted += hcpResult.recordsInserted;
      recordsUpdated += hcpResult.recordsUpdated;
      recordsSkipped += hcpResult.recordsSkipped;
      errors.push(...hcpResult.errors);

      // Sync opportunities (prescription events)
      const prescriptionResult = await this.syncSalesforcePrescriptions(organizationId, config);
      recordsProcessed += prescriptionResult.recordsProcessed;
      recordsInserted += prescriptionResult.recordsInserted;
      recordsUpdated += prescriptionResult.recordsUpdated;
      recordsSkipped += prescriptionResult.recordsSkipped;
      errors.push(...prescriptionResult.errors);

      // Sync activities (calls)
      const callResult = await this.syncSalesforceCalls(organizationId, config);
      recordsProcessed += callResult.recordsProcessed;
      recordsInserted += callResult.recordsInserted;
      recordsUpdated += callResult.recordsUpdated;
      recordsSkipped += callResult.recordsSkipped;
      errors.push(...callResult.errors);

      // Update last sync time
      await this.updateLastSync(config.id, new Date());
      await this.updateSyncStatus(config.id, 'active');

    } catch (error) {
      errors.push(`Salesforce sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await this.updateSyncStatus(config.id, 'error', errors[errors.length - 1]);
    }

    return {
      success: errors.length === 0,
      recordsProcessed,
      recordsInserted,
      recordsUpdated,
      recordsSkipped,
      errors,
      duration: Date.now() - startTime
    };
  }

  /**
   * Sync IQVIA prescription data
   */
  async syncIQVIAData(organizationId: string, config: DataSourceConfig): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsProcessed = 0;
    let recordsInserted = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;

    try {
      await this.updateSyncStatus(config.id, 'syncing');

      // Mock IQVIA API call - in real implementation, this would call IQVIA API
      const iqviaData = await this.fetchIQVIAPrescriptionData(config);
      
      for (const prescription of iqviaData) {
        recordsProcessed++;
        
        try {
          // Check if prescription already exists
          const { data: existing } = await this.supabase
            .from('prescription_events')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('product_id', prescription.productId)
            .eq('hcp_id', prescription.hcpId)
            .eq('prescription_date', prescription.prescriptionDate.toISOString().split('T')[0])
            .single();

          if (existing) {
            // Update existing record
            await this.supabase
              .from('prescription_events')
              .update({
                volume: prescription.volume,
                payer_id: prescription.payerId,
                payer_name: prescription.payerName,
                channel: prescription.channel
              })
              .eq('id', existing.id);
            recordsUpdated++;
          } else {
            // Insert new record
            await this.supabase
              .from('prescription_events')
              .insert({
                organization_id: organizationId,
                product_id: prescription.productId,
                product_name: prescription.productName,
                hcp_id: prescription.hcpId,
                account_id: prescription.accountId,
                prescription_date: prescription.prescriptionDate.toISOString().split('T')[0],
                prescription_type: prescription.prescriptionType,
                volume: prescription.volume,
                territory_id: prescription.territoryId,
                payer_id: prescription.payerId,
                payer_name: prescription.payerName,
                channel: prescription.channel
              });
            recordsInserted++;
          }
        } catch (error) {
          recordsSkipped++;
          errors.push(`Failed to process prescription ${prescription.productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      await this.updateLastSync(config.id, new Date());
      await this.updateSyncStatus(config.id, 'active');

    } catch (error) {
      errors.push(`IQVIA sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await this.updateSyncStatus(config.id, 'error', errors[errors.length - 1]);
    }

    return {
      success: errors.length === 0,
      recordsProcessed,
      recordsInserted,
      recordsUpdated,
      recordsSkipped,
      errors,
      duration: Date.now() - startTime
    };
  }

  /**
   * Sync Snowflake data warehouse data
   */
  async syncSnowflakeData(organizationId: string, config: DataSourceConfig): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsProcessed = 0;
    let recordsInserted = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;

    try {
      await this.updateSyncStatus(config.id, 'syncing');

      // Mock Snowflake query - in real implementation, this would connect to Snowflake
      const snowflakeData = await this.fetchSnowflakeData(config);
      
      // Process aggregated KPI data from Snowflake
      for (const kpiData of snowflakeData) {
        recordsProcessed++;
        
        try {
          await this.supabase
            .from('kpi_calculated_values')
            .upsert({
              organization_id: organizationId,
              kpi_id: kpiData.kpiId,
              calculated_value: kpiData.value,
              confidence_score: kpiData.confidence,
              calculation_date: kpiData.calculationDate.toISOString().split('T')[0],
              period_start: kpiData.periodStart.toISOString().split('T')[0],
              period_end: kpiData.periodEnd.toISOString().split('T')[0],
              filters: kpiData.filters,
              metadata: kpiData.metadata
            });
          recordsInserted++;
        } catch (error) {
          recordsSkipped++;
          errors.push(`Failed to process KPI data ${kpiData.kpiId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      await this.updateLastSync(config.id, new Date());
      await this.updateSyncStatus(config.id, 'active');

    } catch (error) {
      errors.push(`Snowflake sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await this.updateSyncStatus(config.id, 'error', errors[errors.length - 1]);
    }

    return {
      success: errors.length === 0,
      recordsProcessed,
      recordsInserted,
      recordsUpdated,
      recordsSkipped,
      errors,
      duration: Date.now() - startTime
    };
  }

  /**
   * Process CSV data upload
   */
  async processCSVUpload(
    organizationId: string,
    file: File,
    mapping: DataMapping[],
    dataType: 'prescriptions' | 'hcps' | 'calls' | 'samples'
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsProcessed = 0;
    let recordsInserted = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;

    try {
      // Parse CSV file
      const csvData = await this.parseCSVFile(file);
      
      for (const row of csvData) {
        recordsProcessed++;
        
        try {
          // Map CSV fields to database fields
          const mappedData = this.mapCSVRow(row, mapping);
          
          // Insert/update based on data type
          switch (dataType) {
            case 'prescriptions':
              await this.processPrescriptionData(organizationId, mappedData);
              break;
            case 'hcps':
              await this.processHCPData(organizationId, mappedData);
              break;
            case 'calls':
              await this.processCallData(organizationId, mappedData);
              break;
            case 'samples':
              await this.processSampleData(organizationId, mappedData);
              break;
          }
          recordsInserted++;
        } catch (error) {
          recordsSkipped++;
          errors.push(`Failed to process row ${recordsProcessed}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

    } catch (error) {
      errors.push(`CSV processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      success: errors.length === 0,
      recordsProcessed,
      recordsInserted,
      recordsUpdated,
      recordsSkipped,
      errors,
      duration: Date.now() - startTime
    };
  }

  /**
   * Get data source configurations for an organization
   */
  async getDataSourceConfigs(organizationId: string): Promise<DataSourceConfig[]> {
    const { data, error } = await this.supabase
      .from('data_source_integrations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('source_name');

    if (error) {
      throw new Error(`Failed to fetch data source configs: ${error.message}`);
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.source_name,
      type: row.source_type,
      connectionString: row.connection_config?.connectionString,
      apiKey: row.connection_config?.apiKey,
      refreshInterval: row.refresh_interval,
      lastSync: row.last_sync ? new Date(row.last_sync) : undefined,
      status: row.sync_status,
      errorMessage: row.error_message
    }));
  }

  /**
   * Create or update data source configuration
   */
  async saveDataSourceConfig(organizationId: string, config: Omit<DataSourceConfig, 'id'>): Promise<string> {
    const { data, error } = await this.supabase
      .from('data_source_integrations')
      .upsert({
        organization_id: organizationId,
        source_name: config.name,
        source_type: config.type,
        connection_config: {
          connectionString: config.connectionString,
          apiKey: config.apiKey
        },
        refresh_interval: config.refreshInterval,
        sync_status: config.status
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save data source config: ${error.message}`);
    }

    return data.id;
  }

  // Private helper methods

  private async updateSyncStatus(configId: string, status: string, errorMessage?: string): Promise<void> {
    await this.supabase
      .from('data_source_integrations')
      .update({
        sync_status: status,
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', configId);
  }

  private async updateLastSync(configId: string, lastSync: Date): Promise<void> {
    await this.supabase
      .from('data_source_integrations')
      .update({
        last_sync: lastSync.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', configId);
  }

  private async syncSalesforceHCPs(organizationId: string, config: DataSourceConfig): Promise<SyncResult> {
    // Mock Salesforce HCP sync - in real implementation, this would call Salesforce API
    return {
      success: true,
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: [],
      duration: 0
    };
  }

  private async syncSalesforcePrescriptions(organizationId: string, config: DataSourceConfig): Promise<SyncResult> {
    // Mock Salesforce prescription sync
    return {
      success: true,
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: [],
      duration: 0
    };
  }

  private async syncSalesforceCalls(organizationId: string, config: DataSourceConfig): Promise<SyncResult> {
    // Mock Salesforce call sync
    return {
      success: true,
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: [],
      duration: 0
    };
  }

  private async fetchIQVIAPrescriptionData(config: DataSourceConfig): Promise<PrescriptionData[]> {
    // Mock IQVIA data - in real implementation, this would call IQVIA API
    return [
      {
        productId: 'PROD001',
        productName: 'Sample Drug A',
        hcpId: 'HCP001',
        accountId: 'ACC001',
        prescriptionDate: new Date(),
        prescriptionType: 'new',
        volume: 1,
        territoryId: 'TERR001',
        payerId: 'PAYER001',
        payerName: 'Sample Insurance',
        channel: 'retail'
      }
    ];
  }

  private async fetchSnowflakeData(config: DataSourceConfig): Promise<any[]> {
    // Mock Snowflake data - in real implementation, this would query Snowflake
    return [
      {
        kpiId: 'trx',
        value: 1000,
        confidence: 0.95,
        calculationDate: new Date(),
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        filters: {},
        metadata: { source: 'snowflake' }
      }
    ];
  }

  private async parseCSVFile(file: File): Promise<Record<string, any>[]> {
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      return row;
    });
  }

  private mapCSVRow(row: Record<string, any>, mapping: DataMapping[]): Record<string, any> {
    const mappedData: Record<string, any> = {};
    
    mapping.forEach(map => {
      const value = row[map.sourceField];
      if (value !== undefined) {
        mappedData[map.targetField] = map.transformation 
          ? this.applyTransformation(value, map.transformation)
          : value;
      }
    });
    
    return mappedData;
  }

  private applyTransformation(...args: unknown[]): unknown {
    // Apply data transformations (e.g., date parsing, number conversion, etc.)
    switch (transformation) {
      case 'to_date':
        return new Date(value);
      case 'to_number':
        return parseFloat(value);
      case 'to_uppercase':
        return value.toString().toUpperCase();
      default:
        return value;
    }
  }

  private async processPrescriptionData(organizationId: string, data: Record<string, any>): Promise<void> {
    await this.supabase
      .from('prescription_events')
      .insert({
        organization_id: organizationId,
        product_id: data.productId,
        product_name: data.productName,
        hcp_id: data.hcpId,
        account_id: data.accountId,
        prescription_date: data.prescriptionDate,
        prescription_type: data.prescriptionType,
        volume: data.volume,
        territory_id: data.territoryId,
        payer_id: data.payerId,
        payer_name: data.payerName,
        channel: data.channel
      });
  }

  private async processHCPData(organizationId: string, data: Record<string, any>): Promise<void> {
    await this.supabase
      .from('healthcare_providers')
      .upsert({
        organization_id: organizationId,
        hcp_id: data.hcpId,
        name: data.name,
        specialty: data.specialty,
        practice_id: data.practiceId,
        practice_name: data.practiceName,
        territory_id: data.territoryId,
        formulary_status: data.formularyStatus
      });
  }

  private async processCallData(organizationId: string, data: Record<string, any>): Promise<void> {
    await this.supabase
      .from('pharmaceutical_calls')
      .insert({
        organization_id: organizationId,
        rep_id: data.repId,
        hcp_id: data.hcpId,
        call_date: data.callDate,
        duration_minutes: data.durationMinutes,
        call_type: data.callType,
        product_id: data.productId,
        product_name: data.productName,
        outcome: data.outcome,
        samples_distributed: data.samplesDistributed,
        samples_requested: data.samplesRequested,
        notes: data.notes,
        territory_id: data.territoryId
      });
  }

  private async processSampleData(organizationId: string, data: Record<string, any>): Promise<void> {
    await this.supabase
      .from('sample_distributions')
      .insert({
        organization_id: organizationId,
        product_id: data.productId,
        product_name: data.productName,
        hcp_id: data.hcpId,
        rep_id: data.repId,
        distribution_date: data.distributionDate,
        quantity: data.quantity,
        territory_id: data.territoryId,
        batch_number: data.batchNumber,
        expiration_date: data.expirationDate
      });
  }
}

// Export singleton instance
export const dataIntegrationService = new DataIntegrationService();
