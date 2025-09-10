import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type IntegrationConnection = Database['public']['Tables']['integration_connections']['Row']
type IntegrationConnectionInsert = Database['public']['Tables']['integration_connections']['Insert']
type IntegrationConnectionUpdate = Database['public']['Tables']['integration_connections']['Update']

export interface IntegrationConnectionData {
  id: string
  integrationType: 'slack' | 'docusign' | 'stripe' | 'gong' | 'sharepoint' | 'salesforce' | 'hubspot'
  name: string
  config: Record<string, any>
  credentials: Record<string, any>
  isActive: boolean
  lastSyncAt: string | null
  syncStatus: 'pending' | 'success' | 'error' | 'disabled'
  errorMessage: string | null
  organizationId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface IntegrationCapabilities {
  canSyncContacts: boolean
  canSyncOpportunities: boolean
  canSyncActivities: boolean
  canSendNotifications: boolean
  canCreateDocuments: boolean
  canProcessPayments: boolean
  canRecordCalls: boolean
  canManageFiles: boolean
}

export interface SyncResult {
  success: boolean
  recordsProcessed: number
  recordsCreated: number
  recordsUpdated: number
  recordsFailed: number
  errorMessage?: string
  lastSyncAt: string
}

export class IntegrationsAPI {
  /**
   * Get all integration connections for an organization
   */
  static async getConnections(organizationId: string): Promise<IntegrationConnectionData[]> {
    const { data, error } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch integration connections: ${error.message}`)
    }

    return data.map(this.transformToIntegrationConnectionData)
  }

  /**
   * Get a specific integration connection by ID
   */
  static async getConnection(id: string): Promise<IntegrationConnectionData | null> {
    const { data, error } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch integration connection: ${error.message}`)
    }

    return this.transformToIntegrationConnectionData(data)
  }

  /**
   * Get connections by integration type
   */
  static async getConnectionsByType(
    organizationId: string,
    integrationType: 'slack' | 'docusign' | 'stripe' | 'gong' | 'sharepoint' | 'salesforce' | 'hubspot'
  ): Promise<IntegrationConnectionData[]> {
    const { data, error } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('integration_type', integrationType)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch integration connections: ${error.message}`)
    }

    return data.map(this.transformToIntegrationConnectionData)
  }

  /**
   * Create a new integration connection
   */
  static async createConnection(
    connection: Omit<IntegrationConnectionData, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<IntegrationConnectionData> {
    const insertData: IntegrationConnectionInsert = {
      integration_type: connection.integrationType,
      name: connection.name,
      config: connection.config,
      credentials: connection.credentials,
      is_active: connection.isActive,
      last_sync_at: connection.lastSyncAt,
      sync_status: connection.syncStatus,
      error_message: connection.errorMessage,
      organization_id: connection.organizationId,
      created_by: connection.createdBy,
    }

    const { data, error } = await supabase
      .from('integration_connections')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create integration connection: ${error.message}`)
    }

    return this.transformToIntegrationConnectionData(data)
  }

  /**
   * Update an existing integration connection
   */
  static async updateConnection(
    id: string,
    updates: Partial<Omit<IntegrationConnectionData, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<IntegrationConnectionData> {
    const updateData: IntegrationConnectionUpdate = {
      name: updates.name,
      config: updates.config,
      credentials: updates.credentials,
      is_active: updates.isActive,
      last_sync_at: updates.lastSyncAt,
      sync_status: updates.syncStatus,
      error_message: updates.errorMessage,
    }

    const { data, error } = await supabase
      .from('integration_connections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update integration connection: ${error.message}`)
    }

    return this.transformToIntegrationConnectionData(data)
  }

  /**
   * Delete an integration connection
   */
  static async deleteConnection(id: string): Promise<void> {
    const { error } = await supabase
      .from('integration_connections')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete integration connection: ${error.message}`)
    }
  }

  /**
   * Test integration connection
   */
  static async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const connection = await this.getConnection(id)
    if (!connection) {
      throw new Error('Integration connection not found')
    }

    try {
      // Test connection based on integration type
      const testResult = await this.performConnectionTest(connection)
      
      // Update connection status
      await this.updateConnection(id, {
        syncStatus: testResult.success ? 'success' : 'error',
        errorMessage: testResult.success ? null : testResult.message,
        lastSyncAt: new Date().toISOString(),
      })

      return testResult
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      await this.updateConnection(id, {
        syncStatus: 'error',
        errorMessage,
      })

      return { success: false, message: errorMessage }
    }
  }

  /**
   * Sync data with integration
   */
  static async syncData(
    id: string,
    syncType: 'contacts' | 'opportunities' | 'activities' | 'all'
  ): Promise<SyncResult> {
    const connection = await this.getConnection(id)
    if (!connection) {
      throw new Error('Integration connection not found')
    }

    if (!connection.isActive) {
      throw new Error('Integration connection is not active')
    }

    try {
      const syncResult = await this.performDataSync(connection, syncType)
      
      // Update connection with sync results
      await this.updateConnection(id, {
        lastSyncAt: syncResult.lastSyncAt,
        syncStatus: syncResult.success ? 'success' : 'error',
        errorMessage: syncResult.success ? null : syncResult.errorMessage,
      })

      return syncResult
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      await this.updateConnection(id, {
        syncStatus: 'error',
        errorMessage,
      })

      return {
        success: false,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsFailed: 0,
        errorMessage,
        lastSyncAt: new Date().toISOString(),
      }
    }
  }

  /**
   * Get integration capabilities
   */
  static getIntegrationCapabilities(
    integrationType: 'slack' | 'docusign' | 'stripe' | 'gong' | 'sharepoint' | 'salesforce' | 'hubspot'
  ): IntegrationCapabilities {
    const capabilities: Record<string, IntegrationCapabilities> = {
      slack: {
        canSyncContacts: false,
        canSyncOpportunities: false,
        canSyncActivities: true,
        canSendNotifications: true,
        canCreateDocuments: false,
        canProcessPayments: false,
        canRecordCalls: false,
        canManageFiles: false,
      },
      docusign: {
        canSyncContacts: false,
        canSyncOpportunities: false,
        canSyncActivities: true,
        canSendNotifications: false,
        canCreateDocuments: true,
        canProcessPayments: false,
        canRecordCalls: false,
        canManageFiles: false,
      },
      stripe: {
        canSyncContacts: true,
        canSyncOpportunities: false,
        canSyncActivities: false,
        canSendNotifications: false,
        canCreateDocuments: false,
        canProcessPayments: true,
        canRecordCalls: false,
        canManageFiles: false,
      },
      gong: {
        canSyncContacts: false,
        canSyncOpportunities: false,
        canSyncActivities: true,
        canSendNotifications: false,
        canCreateDocuments: false,
        canProcessPayments: false,
        canRecordCalls: true,
        canManageFiles: false,
      },
      sharepoint: {
        canSyncContacts: false,
        canSyncOpportunities: false,
        canSyncActivities: false,
        canSendNotifications: false,
        canCreateDocuments: false,
        canProcessPayments: false,
        canRecordCalls: false,
        canManageFiles: true,
      },
      salesforce: {
        canSyncContacts: true,
        canSyncOpportunities: true,
        canSyncActivities: true,
        canSendNotifications: false,
        canCreateDocuments: false,
        canProcessPayments: false,
        canRecordCalls: false,
        canManageFiles: false,
      },
      hubspot: {
        canSyncContacts: true,
        canSyncOpportunities: true,
        canSyncActivities: true,
        canSendNotifications: false,
        canCreateDocuments: false,
        canProcessPayments: false,
        canRecordCalls: false,
        canManageFiles: false,
      },
    }

    return capabilities[integrationType] || {
      canSyncContacts: false,
      canSyncOpportunities: false,
      canSyncActivities: false,
      canSendNotifications: false,
      canCreateDocuments: false,
      canProcessPayments: false,
      canRecordCalls: false,
      canManageFiles: false,
    }
  }

  /**
   * Get OAuth URL for integration
   */
  static getOAuthUrl(
    integrationType: 'slack' | 'docusign' | 'stripe' | 'gong' | 'sharepoint' | 'salesforce' | 'hubspot',
    organizationId: string,
    redirectUri: string
  ): string {
    const oauthConfigs: Record<string, { clientId: string; scope: string; authUrl: string }> = {
      slack: {
        clientId: process.env.SLACK_CLIENT_ID || '',
        scope: 'channels:read,chat:write,users:read',
        authUrl: 'https://slack.com/oauth/v2/authorize',
      },
      docusign: {
        clientId: process.env.DOCUSIGN_CLIENT_ID || '',
        scope: 'signature',
        authUrl: 'https://account.docusign.com/oauth/auth',
      },
      stripe: {
        clientId: process.env.STRIPE_CLIENT_ID || '',
        scope: 'read_write',
        authUrl: 'https://connect.stripe.com/oauth/authorize',
      },
      gong: {
        clientId: process.env.GONG_CLIENT_ID || '',
        scope: 'read',
        authUrl: 'https://app.gong.io/oauth/authorize',
      },
      sharepoint: {
        clientId: process.env.SHAREPOINT_CLIENT_ID || '',
        scope: 'Files.ReadWrite.All,Sites.ReadWrite.All',
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      },
      salesforce: {
        clientId: process.env.SALESFORCE_CLIENT_ID || '',
        scope: 'api,refresh_token',
        authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
      },
      hubspot: {
        clientId: process.env.HUBSPOT_CLIENT_ID || '',
        scope: 'crm.objects.contacts.read,crm.objects.deals.read',
        authUrl: 'https://app.hubspot.com/oauth/authorize',
      },
    }

    const config = oauthConfigs[integrationType]
    if (!config) {
      throw new Error(`OAuth configuration not found for ${integrationType}`)
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      scope: config.scope,
      response_type: 'code',
      redirect_uri: redirectUri,
      state: `${integrationType}-${organizationId}`,
    })

    return `${config.authUrl}?${params.toString()}`
  }

  /**
   * Handle OAuth callback
   */
  static async handleOAuthCallback(
    integrationType: string,
    code: string,
    state: string,
    organizationId: string,
    createdBy: string
  ): Promise<IntegrationConnectionData> {
    // Parse state to verify integration type and organization
    const [type, orgId] = state.split('-')
    if (type !== integrationType || orgId !== organizationId) {
      throw new Error('Invalid OAuth state')
    }

    // Exchange code for access token (implementation depends on integration)
    const tokenData = await this.exchangeCodeForToken(integrationType, code)
    
    // Create integration connection
    return this.createConnection({
      integrationType: integrationType as any,
      name: `${integrationType.charAt(0).toUpperCase() + integrationType.slice(1)} Integration`,
      config: tokenData.config || {},
      credentials: tokenData.credentials || {},
      isActive: true,
      lastSyncAt: null,
      syncStatus: 'pending',
      errorMessage: null,
      organizationId,
      createdBy,
    })
  }

  /**
   * Perform connection test (placeholder implementation)
   */
  private static async performConnectionTest(connection: IntegrationConnectionData): Promise<{ success: boolean; message: string }> {
    // This would contain actual integration-specific test logic
    // For now, return a mock success response
    return {
      success: true,
      message: 'Connection test successful',
    }
  }

  /**
   * Perform data sync (placeholder implementation)
   */
  private static async performDataSync(
    connection: IntegrationConnectionData,
    syncType: 'contacts' | 'opportunities' | 'activities' | 'all'
  ): Promise<SyncResult> {
    // This would contain actual integration-specific sync logic
    // For now, return a mock sync result
    return {
      success: true,
      recordsProcessed: 10,
      recordsCreated: 5,
      recordsUpdated: 3,
      recordsFailed: 2,
      lastSyncAt: new Date().toISOString(),
    }
  }

  /**
   * Exchange OAuth code for access token (placeholder implementation)
   */
  private static async exchangeCodeForToken(
    integrationType: string,
    code: string
  ): Promise<{ config: Record<string, any>; credentials: Record<string, any> }> {
    // This would contain actual OAuth token exchange logic
    // For now, return mock data
    return {
      config: {},
      credentials: {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_at: Date.now() + 3600000, // 1 hour from now
      },
    }
  }

  /**
   * Transform database row to IntegrationConnectionData
   */
  private static transformToIntegrationConnectionData(data: IntegrationConnection): IntegrationConnectionData {
    return {
      id: data.id,
      integrationType: data.integration_type,
      name: data.name,
      config: data.config,
      credentials: data.credentials,
      isActive: data.is_active,
      lastSyncAt: data.last_sync_at,
      syncStatus: data.sync_status,
      errorMessage: data.error_message,
      organizationId: data.organization_id,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }
}
