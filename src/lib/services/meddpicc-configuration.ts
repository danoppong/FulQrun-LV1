import { AuthService } from '@/lib/auth-unified'
import { MEDDPICCConfig, MEDDPICC_CONFIG } from '@/lib/meddpicc'
import { getSupabaseBrowserClient } from '@/lib/supabase-singleton'

const supabase = getSupabaseBrowserClient()

export interface MEDDPICCConfigurationRecord {
  id: string
  organization_id: string
  name: string
  description?: string
  version: number
  is_active: boolean
  configuration_data: MEDDPICCConfig
  algorithm_settings: {
    text_scoring: {
      base_points: number
      min_length_points: number
      good_detail_points: number
      comprehensive_points: number
      very_detailed_points: number
      min_length: number
      good_detail_length: number
      comprehensive_length: number
      very_detailed_length: number
      max_keyword_bonus: number
    }
    quality_keywords: string[]
  }
  created_at: string
  updated_at: string
  created_by?: string
  modified_by?: string
}

export interface MEDDPICCConfigurationHistory {
  id: string
  configuration_id: string
  organization_id: string
  change_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE'
  previous_version?: number
  new_version?: number
  changes_summary: any
  previous_configuration?: MEDDPICCConfig
  new_configuration?: MEDDPICCConfig
  changed_at: string
  changed_by?: string
  change_reason?: string
}

export interface ConfigurationValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  totalWeight?: number
}

export class MEDDPICCConfigurationService {
  /**
   * Get the active MEDDPICC configuration for the current organization
   */
  static async getActiveConfiguration(): Promise<MEDDPICCConfig> {
    try {
      // For now, check localStorage first, then fall back to default
      const savedConfig = localStorage?.getItem('meddpicc_custom_config')
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig)
          console.log('✅ Using saved configuration from localStorage')
          return parsedConfig
        } catch (_e) {
          console.warn('Failed to parse saved configuration, using default')
        }
      }
      
      console.log('📋 Using default MEDDPICC configuration')
      return MEDDPICC_CONFIG
    } catch (error) {
      console.error('Failed to get active MEDDPICC configuration:', error)
      return MEDDPICC_CONFIG
    }
  }

  /**
   * Get configuration record with metadata
   */
  static async getConfigurationRecord(): Promise<MEDDPICCConfigurationRecord | null> {
    try {
      const user = await AuthService.getCurrentUser()
      if (!user?.organization_id) {
        return null
      }

      const { data, error } = await supabase
        .from('meddpicc_configurations')
        .select('*')
        .eq('organization_id', user.organization_id)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data as MEDDPICCConfigurationRecord
    } catch (error) {
      console.error('Failed to get configuration record:', error)
      return null
    }
  }

  /**
   * Save a new MEDDPICC configuration
   */
  static async saveConfiguration(
    config: MEDDPICCConfig, 
    options: {
      name?: string
      description?: string
      algorithmSettings?: any
    } = {}
  ): Promise<MEDDPICCConfigurationRecord> {
    try {
      // Validate configuration first
      const validation = this.validateConfiguration(config)
      if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`)
      }

      // Use API endpoint instead of direct Supabase access
      const response = await fetch('/api/admin/meddpicc-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configuration: config,
          organizationId: '1', // TODO: Get from auth context
          options
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const _result = await response.json()
      
      // Return a mock record since the API doesn't return the full record yet
      return {
        id: Date.now().toString(),
        organization_id: '1',
        name: options.name || 'Custom MEDDPICC Configuration',
        description: options.description || 'Customized MEDDPICC configuration',
        configuration_data: config,
        algorithm_settings: options.algorithmSettings || this.getDefaultAlgorithmSettings(),
        version: 1,
        is_active: true,
        created_by: 'admin',
        modified_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as MEDDPICCConfigurationRecord

    } catch (error) {
      console.error('Failed to save MEDDPICC configuration:', error)
      throw error
    }
  }

  /**
   * Validate a MEDDPICC configuration
   */
  static validateConfiguration(config: MEDDPICCConfig): ConfigurationValidation {
    const errors: string[] = []
    const warnings: string[] = []

    // Check required fields
    if (!config.projectName?.trim()) {
      errors.push('Project name is required')
    }
    if (!config.version?.trim()) {
      errors.push('Version is required')
    }
    if (!config.framework?.trim()) {
      errors.push('Framework is required')
    }

    // Validate pillars
    if (!config.pillars || config.pillars.length === 0) {
      errors.push('At least one pillar is required')
    } else {
      let totalWeight = 0
      const pillarIds = new Set<string>()

      config.pillars.forEach((pillar, index) => {
        // Check for required pillar fields
        if (!pillar.id?.trim()) {
          errors.push(`Pillar ${index + 1}: ID is required`)
        } else if (pillarIds.has(pillar.id)) {
          errors.push(`Pillar ${index + 1}: Duplicate ID "${pillar.id}"`)
        } else {
          pillarIds.add(pillar.id)
        }

        if (!pillar.displayName?.trim()) {
          errors.push(`Pillar ${index + 1}: Display name is required`)
        }

        if (pillar.weight < 0 || pillar.weight > 100) {
          errors.push(`Pillar ${index + 1}: Weight must be between 0 and 100`)
        }

        totalWeight += pillar.weight || 0

        // Validate questions
        if (!pillar.questions || pillar.questions.length === 0) {
          warnings.push(`Pillar ${index + 1} (${pillar.displayName}): No questions defined`)
        } else {
          const questionIds = new Set<string>()
          pillar.questions.forEach((question, qIndex) => {
            if (!question.id?.trim()) {
              errors.push(`Pillar ${index + 1}, Question ${qIndex + 1}: ID is required`)
            } else if (questionIds.has(question.id)) {
              errors.push(`Pillar ${index + 1}, Question ${qIndex + 1}: Duplicate ID "${question.id}"`)
            } else {
              questionIds.add(question.id)
            }

            if (!question.text?.trim()) {
              errors.push(`Pillar ${index + 1}, Question ${qIndex + 1}: Text is required`)
            }

            if (!['text', 'scale', 'multiple_choice', 'yes_no'].includes(question.type)) {
              errors.push(`Pillar ${index + 1}, Question ${qIndex + 1}: Invalid question type "${question.type}"`)
            }

            // Validate answers for scale and multiple choice questions
            if ((question.type === 'scale' || question.type === 'multiple_choice') && 
                (!question.answers || question.answers.length === 0)) {
              errors.push(`Pillar ${index + 1}, Question ${qIndex + 1}: Answers required for ${question.type} questions`)
            }
          })
        }
      })

      // Check total weights
      if (Math.abs(totalWeight - 100) > 0.1) {
        warnings.push(`Total pillar weights sum to ${totalWeight}% instead of 100%`)
      }
    }

    // Validate scoring thresholds
    if (config.scoring?.thresholds) {
      const { excellent, good, fair, poor } = config.scoring.thresholds
      
      if (excellent <= good) {
        warnings.push('Excellent threshold should be higher than good threshold')
      }
      if (good <= fair) {
        warnings.push('Good threshold should be higher than fair threshold')
      }
      if (fair <= poor) {
        warnings.push('Fair threshold should be higher than poor threshold')
      }

      [excellent, good, fair, poor].forEach((threshold, index) => {
        const names = ['excellent', 'good', 'fair', 'poor']
        if (threshold < 0 || threshold > 100) {
          errors.push(`${names[index]} threshold must be between 0 and 100`)
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalWeight: config.pillars?.reduce((sum, p) => sum + (p.weight || 0), 0)
    }
  }

  /**
   * Get configuration change history
   */
  static async getConfigurationHistory(): Promise<MEDDPICCConfigurationHistory[]> {
    try {
      const user = await AuthService.getCurrentUser()
      if (!user?.organization_id) {
        return []
      }

      const { data, error } = await supabase
        .from('meddpicc_configuration_history')
        .select(`
          *,
          changed_by_profile:user_profiles!changed_by(first_name, last_name, email)
        `)
        .eq('organization_id', user.organization_id)
        .order('changed_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as MEDDPICCConfigurationHistory[]
    } catch (error) {
      console.error('Failed to get configuration history:', error)
      return []
    }
  }

  /**
   * Reset configuration to default
   */
  static async resetToDefault(): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser()
      if (!user?.organization_id) {
        throw new Error('No organization found')
      }

      // Deactivate current configuration
      const { error } = await supabase
        .from('meddpicc_configurations')
        .update({
          is_active: false,
          modified_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', user.organization_id)
        .eq('is_active', true)

      if (error) throw error
    } catch (error) {
      console.error('Failed to reset configuration:', error)
      throw error
    }
  }

  /**
   * Clone configuration from another organization (admin only)
   */
  static async cloneConfiguration(
    sourceOrganizationId: string,
    targetOrganizationId: string
  ): Promise<MEDDPICCConfigurationRecord> {
    try {
      const user = await AuthService.getCurrentUser()
      if (!user || !user.role || !['admin', 'super_admin'].includes(user.role)) {
        throw new Error('Insufficient permissions')
      }

      // Get source configuration
      const { data: sourceConfig, error: sourceError } = await supabase
        .from('meddpicc_configurations')
        .select('*')
        .eq('organization_id', sourceOrganizationId)
        .eq('is_active', true)
        .single()

      if (sourceError) throw sourceError
      if (!sourceConfig) throw new Error('Source configuration not found')

      // Create new configuration for target organization
      const { data, error } = await supabase
        .from('meddpicc_configurations')
        .insert({
          organization_id: targetOrganizationId,
          name: `${sourceConfig.name} (Cloned)`,
          description: `Cloned from organization ${sourceOrganizationId}`,
          configuration_data: sourceConfig.configuration_data,
          algorithm_settings: sourceConfig.algorithm_settings,
          version: 1,
          is_active: true,
          created_by: user.id,
          modified_by: user.id
        })
        .select()
        .single()

      if (error) throw error
      return data as MEDDPICCConfigurationRecord
    } catch (error) {
      console.error('Failed to clone configuration:', error)
      throw error
    }
  }

  /**
   * Export configuration as JSON
   */
  static async exportConfiguration(): Promise<string> {
    try {
      const config = await this.getConfigurationRecord()
      if (!config) {
        return JSON.stringify(MEDDPICC_CONFIG, null, 2)
      }

      const exportData = {
        metadata: {
          name: config.name,
          description: config.description,
          version: config.version,
          exportedAt: new Date().toISOString(),
          exportedBy: (await AuthService.getCurrentUser())?.email
        },
        configuration: config.configuration_data,
        algorithmSettings: config.algorithm_settings
      }

      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('Failed to export configuration:', error)
      throw error
    }
  }

  /**
   * Import configuration from JSON
   */
  static async importConfiguration(
    jsonData: string,
    options: { 
      overwrite?: boolean
      name?: string
      description?: string
    } = {}
  ): Promise<MEDDPICCConfigurationRecord> {
    try {
      const importData = JSON.parse(jsonData)
      
      if (!importData.configuration) {
        throw new Error('Invalid import format: missing configuration data')
      }

      const validation = this.validateConfiguration(importData.configuration)
      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`)
      }

      return await this.saveConfiguration(importData.configuration, {
        name: options.name || importData.metadata?.name || 'Imported Configuration',
        description: options.description || importData.metadata?.description || 'Imported MEDDPICC configuration',
        algorithmSettings: importData.algorithmSettings
      })
    } catch (error) {
      console.error('Failed to import configuration:', error)
      throw error
    }
  }

  /**
   * Get default algorithm settings
   */
  private static getDefaultAlgorithmSettings() {
    return {
      text_scoring: {
        base_points: 3,
        min_length_points: 2,
        good_detail_points: 2,
        comprehensive_points: 2,
        very_detailed_points: 1,
        min_length: 3,
        good_detail_length: 10,
        comprehensive_length: 25,
        very_detailed_length: 50,
        max_keyword_bonus: 2
      },
      quality_keywords: [
        'specific', 'measurable', 'quantified', 'roi', 'impact',
        'cost', 'savings', 'efficiency', 'revenue', 'profit',
        'test', 'quality', 'improvement', 'lives', 'saved',
        'clinical', 'patient', 'outcomes', 'compliance', 'regulatory'
      ]
    }
  }

  /**
   * Recalculate all opportunity scores with new configuration
   */
  static async recalculateScores(): Promise<{ updated: number; errors: number }> {
    try {
      const user = await AuthService.getCurrentUser()
      if (!user?.organization_id) {
        throw new Error('No organization found')
      }

      // This would trigger a background job to recalculate all scores
      // For now, we'll just return a placeholder
      console.log('Triggering score recalculation for organization:', user.organization_id)
      
      return { updated: 0, errors: 0 }
    } catch (error) {
      console.error('Failed to trigger score recalculation:', error)
      throw error
    }
  }
}

export default MEDDPICCConfigurationService