import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type PipelineConfiguration = Database['public']['Tables']['pipeline_configurations']['Row']
type PipelineConfigurationInsert = Database['public']['Tables']['pipeline_configurations']['Insert']
type PipelineConfigurationUpdate = Database['public']['Tables']['pipeline_configurations']['Update']

export interface PipelineStage {
  id: string
  name: string
  color: string
  order: number
  probability: number
  isActive: boolean
  requirements: string[]
  transitions: string[]
}

export interface PipelineConfigData {
  id: string
  name: string
  description: string | null
  stages: PipelineStage[]
  branchSpecific: boolean
  roleSpecific: boolean
  branchName: string | null
  roleName: string | null
  isDefault: boolean
  organizationId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export class PipelineConfigAPI {
  /**
   * Get all pipeline configurations for an organization
   */
  static async getConfigurations(organizationId: string): Promise<PipelineConfigData[]> {
    const { data, error } = await supabase
      .from('pipeline_configurations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      // If table doesn't exist or database not configured, return empty array
      if (error.message.includes('relation "pipeline_configurations" does not exist') || 
          error.message.includes('Database not configured')) {
        return []
      }
      throw new Error(`Failed to fetch pipeline configurations: ${error.message}`)
    }

    return data?.map(this.transformToPipelineConfigData) || []
  }

  /**
   * Get a specific pipeline configuration by ID
   */
  static async getConfiguration(id: string): Promise<PipelineConfigData | null> {
    const { data, error } = await supabase
      .from('pipeline_configurations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116' || 
          error.message.includes('relation "pipeline_configurations" does not exist') ||
          error.message.includes('Database not configured')) {
        return null
      }
      throw new Error(`Failed to fetch pipeline configuration: ${error.message}`)
    }

    return this.transformToPipelineConfigData(data)
  }

  /**
   * Get default pipeline configuration for an organization
   */
  static async getDefaultConfiguration(organizationId: string): Promise<PipelineConfigData | null> {
    const { data, error } = await supabase
      .from('pipeline_configurations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_default', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116' || 
          error.message.includes('relation "pipeline_configurations" does not exist') ||
          error.message.includes('Database not configured')) {
        return null
      }
      throw new Error(`Failed to fetch default pipeline configuration: ${error.message}`)
    }

    return this.transformToPipelineConfigData(data)
  }

  /**
   * Create a new pipeline configuration
   */
  static async createConfiguration(
    config: Omit<PipelineConfigData, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PipelineConfigData> {
    const insertData: PipelineConfigurationInsert = {
      name: config.name,
      description: config.description,
      stages: config.stages,
      branch_specific: config.branchSpecific,
      role_specific: config.roleSpecific,
      branch_name: config.branchName,
      role_name: config.roleName,
      is_default: config.isDefault,
      organization_id: config.organizationId,
      created_by: config.createdBy,
    }

    const { data, error } = await supabase
      .from('pipeline_configurations')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create pipeline configuration: ${error.message}`)
    }

    return this.transformToPipelineConfigData(data)
  }

  /**
   * Update an existing pipeline configuration
   */
  static async updateConfiguration(
    id: string,
    updates: Partial<Omit<PipelineConfigData, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<PipelineConfigData> {
    const updateData: PipelineConfigurationUpdate = {
      name: updates.name,
      description: updates.description,
      stages: updates.stages,
      branch_specific: updates.branchSpecific,
      role_specific: updates.roleSpecific,
      branch_name: updates.branchName,
      role_name: updates.roleName,
      is_default: updates.isDefault,
    }

    const { data, error } = await supabase
      .from('pipeline_configurations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update pipeline configuration: ${error.message}`)
    }

    return this.transformToPipelineConfigData(data)
  }

  /**
   * Delete a pipeline configuration
   */
  static async deleteConfiguration(id: string): Promise<void> {
    const { error } = await supabase
      .from('pipeline_configurations')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete pipeline configuration: ${error.message}`)
    }
  }

  /**
   * Set a pipeline configuration as default
   */
  static async setAsDefault(id: string, organizationId: string): Promise<void> {
    // First, unset all other default configurations
    await supabase
      .from('pipeline_configurations')
      .update({ is_default: false })
      .eq('organization_id', organizationId)

    // Then set the specified configuration as default
    const { error } = await supabase
      .from('pipeline_configurations')
      .update({ is_default: true })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to set pipeline configuration as default: ${error.message}`)
    }
  }

  /**
   * Get pipeline configurations by branch and role
   */
  static async getConfigurationsByBranchAndRole(
    organizationId: string,
    branchName?: string,
    roleName?: string
  ): Promise<PipelineConfigData[]> {
    let query = supabase
      .from('pipeline_configurations')
      .select('*')
      .eq('organization_id', organizationId)

    if (branchName) {
      query = query.or(`branch_specific.eq.false,branch_name.eq.${branchName}`)
    }

    if (roleName) {
      query = query.or(`role_specific.eq.false,role_name.eq.${roleName}`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch pipeline configurations: ${error.message}`)
    }

    return data.map(this.transformToPipelineConfigData)
  }

  /**
   * Create default PEAK pipeline configuration
   */
  static async createDefaultPEAKPipeline(
    organizationId: string,
    createdBy: string
  ): Promise<PipelineConfigData> {
    const defaultStages: PipelineStage[] = [
      {
        id: 'prospecting',
        name: 'Prospecting',
        color: '#3B82F6',
        order: 1,
        probability: 10,
        isActive: true,
        requirements: ['Initial contact made', 'Pain identified'],
        transitions: ['engaging']
      },
      {
        id: 'engaging',
        name: 'Engaging',
        color: '#8B5CF6',
        order: 2,
        probability: 25,
        isActive: true,
        requirements: ['Champion identified', 'Decision criteria established'],
        transitions: ['advancing', 'prospecting']
      },
      {
        id: 'advancing',
        name: 'Advancing',
        color: '#F59E0B',
        order: 3,
        probability: 50,
        isActive: true,
        requirements: ['Economic buyer engaged', 'Decision process mapped'],
        transitions: ['key_decision', 'engaging']
      },
      {
        id: 'key_decision',
        name: 'Key Decision',
        color: '#10B981',
        order: 4,
        probability: 75,
        isActive: true,
        requirements: ['Paper process completed', 'Competition neutralized'],
        transitions: ['closed_won', 'closed_lost', 'advancing']
      }
    ]

    return this.createConfiguration({
      name: 'Default PEAK Pipeline',
      description: 'Standard PEAK methodology pipeline configuration',
      stages: defaultStages,
      branchSpecific: false,
      roleSpecific: false,
      branchName: null,
      roleName: null,
      isDefault: true,
      organizationId,
      createdBy
    })
  }

  /**
   * Transform database row to PipelineConfigData
   */
  private static transformToPipelineConfigData(data: PipelineConfiguration): PipelineConfigData {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      stages: data.stages as PipelineStage[],
      branchSpecific: data.branch_specific,
      roleSpecific: data.role_specific,
      branchName: data.branch_name,
      roleName: data.role_name,
      isDefault: data.is_default,
      organizationId: data.organization_id,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }
}
