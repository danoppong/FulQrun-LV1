// Administration Module - Configuration Service
// Core service for managing system configurations with hierarchy resolution

import { getSupabaseClient } from '@/lib/supabase-client';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface SystemConfiguration {
  id: string;
  organizationId: string;
  configKey: string;
  configCategory: ConfigCategory;
  configValue: unknown;
  dataType: ConfigDataType;
  isEncrypted: boolean;
  isPublic: boolean;
  validationRules: ValidationRule[];
  description?: string;
  defaultValue?: unknown;
  minValue?: number;
  maxValue?: number;
  allowedValues?: string[];
  requiresRestart: boolean;
  environment: Environment;
  version: number;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigurationHistory {
  id: string;
  configurationId: string;
  previousValue?: unknown;
  newValue?: unknown;
  changeReason?: string;
  changedBy: string;
  changedAt: Date;
  rollbackId?: string;
  isRollback: boolean;
}

export interface ModuleFeature {
  id: string;
  organizationId: string;
  moduleName: ModuleName;
  featureKey: string;
  featureName: string;
  isEnabled: boolean;
  isBeta: boolean;
  requiresLicense?: LicenseTier;
  dependsOn: string[];
  config: Record<string, unknown>;
  rolloutPercentage: number;
  enabledForRoles: string[];
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModuleParameter {
  id: string;
  organizationId: string;
  moduleName: ModuleName;
  parameterKey: string;
  parameterName: string;
  parameterValue: unknown;
  parameterType: ParameterType;
  parameterCategory?: string;
  displayOrder: number;
  isRequired: boolean;
  isSensitive: boolean;
  validationSchema: Record<string, unknown>;
  helpText?: string;
  adminOnly: boolean;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminActionLog {
  id: string;
  organizationId: string;
  adminUserId: string;
  actionType: AdminActionType;
  actionCategory: string;
  targetEntityType?: string;
  targetEntityId?: string;
  actionDescription: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
}

export interface PermissionDefinition {
  id: string;
  permissionKey: string;
  permissionName: string;
  permissionCategory: string;
  description?: string;
  moduleName?: string;
  isSystemPermission: boolean;
  parentPermissionId?: string;
  createdAt: Date;
}

export interface RolePermission {
  id: string;
  organizationId: string;
  roleName: string;
  permissionId: string;
  isGranted: boolean;
  grantedBy?: string;
  grantedAt: Date;
}

export interface CustomRole {
  id: string;
  organizationId: string;
  roleKey: string;
  roleName: string;
  description?: string;
  inheritsFrom?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
}

export interface ConfigChangeRequest {
  configKey: string;
  newValue: unknown;
  reason: string;
  requiresApproval?: boolean;
}

export interface ConfigurationTemplate {
  id: string;
  templateName: string;
  description?: string;
  templateType: TemplateType;
  industry?: string;
  organizationSize?: string;
  configurationData: Record<string, unknown>;
  isPublic: boolean;
  isVerified: boolean;
  createdBy?: string;
  organizationId?: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Enums
export type ConfigCategory = 
  | 'organization' 
  | 'crm' 
  | 'sales_performance' 
  | 'kpi' 
  | 'learning' 
  | 'integrations' 
  | 'ai' 
  | 'mobile' 
  | 'security' 
  | 'workflow' 
  | 'ui';

export type ConfigDataType = 'string' | 'number' | 'boolean' | 'json' | 'array';

export type Environment = 'development' | 'staging' | 'production' | 'all';

export type ModuleName = 
  | 'crm' 
  | 'sales_performance' 
  | 'kpi' 
  | 'learning' 
  | 'integrations' 
  | 'ai' 
  | 'mobile' 
  | 'pharmaceutical_bi' 
  | 'workflows' 
  | 'analytics';

export type LicenseTier = 'standard' | 'professional' | 'enterprise' | 'enterprise_plus';

export type ParameterType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'json' 
  | 'array' 
  | 'select' 
  | 'multiselect';

export type AdminActionType = 
  | 'config_change' 
  | 'user_create' 
  | 'user_update' 
  | 'user_delete' 
  | 'role_change' 
  | 'permission_change' 
  | 'module_enable' 
  | 'module_disable' 
  | 'integration_setup' 
  | 'security_change' 
  | 'system_change';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type TemplateType = 
  | 'organization_setup' 
  | 'module_preset' 
  | 'industry_vertical' 
  | 'compliance_profile' 
  | 'role_permissions';

// =============================================================================
// CONFIGURATION SERVICE CLASS
// =============================================================================

export class ConfigurationService {
  private organizationId: string;
  private userId: string;

  constructor(organizationId: string, userId: string) {
    this.organizationId = organizationId;
    this.userId = userId;
  }

  // =============================================================================
  // CONFIGURATION MANAGEMENT
  // =============================================================================

  /**
   * Get configuration value with hierarchy resolution
   * Priority: User Override > Role Override > Organization Config > Default
   */
  async getConfigValue(
    configKey: string,
    userId?: string,
    roleName?: string
  ): Promise<unknown> {
    try {
      const { data, error } = await supabase.rpc('get_config_value', {
        p_organization_id: this.organizationId,
        p_config_key: configKey,
        p_user_id: userId || null,
        p_role_name: roleName || null
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting config value:', error);
      throw error;
    }
  }

  /**
   * Set configuration value
   */
  async setConfigValue(
    configKey: string,
    value: unknown,
    category: ConfigCategory,
    dataType: ConfigDataType,
    options: {
      description?: string;
      isPublic?: boolean;
      requiresRestart?: boolean;
      validationRules?: ValidationRule[];
      reason?: string;
    } = {}
  ): Promise<SystemConfiguration> {
    try {
      // Check if configuration exists
      const { data: existing } = await supabase
        .from('system_configurations')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('config_key', configKey)
        .eq('environment', 'production')
        .single();

      let configId: string;
      let previousValue: unknown;

      if (existing) {
        configId = existing.id;
        previousValue = existing.config_value;
        
        // Update existing configuration
        const { data, error } = await supabase
          .from('system_configurations')
          .update({
            config_value: value,
            updated_by: this.userId,
            version: existing.version + 1,
            ...options
          })
          .eq('id', configId)
          .select()
          .single();

        if (error) throw error;

        // Log the change
        await this.logConfigurationChange(
          configId,
          previousValue,
          value,
          options.reason || 'Configuration updated'
        );

        return this.mapSystemConfiguration(data);
      } else {
        // Create new configuration
        const { data, error } = await supabase
          .from('system_configurations')
          .insert({
            organization_id: this.organizationId,
            config_key: configKey,
            config_category: category,
            config_value: value,
            data_type: dataType,
            created_by: this.userId,
            ...options
          })
          .select()
          .single();

        if (error) throw error;
        configId = data.id;

        // Log the change
        await this.logConfigurationChange(
          configId,
          null,
          value,
          options.reason || 'Configuration created'
        );

        return this.mapSystemConfiguration(data);
      }
    } catch (error) {
      console.error('Error setting config value:', error);
      throw error;
    }
  }

  /**
   * Get all configurations for a category
   */
  async getConfigurationsByCategory(
    category: ConfigCategory,
    environment: Environment = 'production'
  ): Promise<SystemConfiguration[]> {
    try {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('config_category', category)
        .eq('environment', environment)
        .order('config_key');

      if (error) throw error;
      return data.map(this.mapSystemConfiguration);
    } catch (error) {
      console.error('Error getting configurations by category:', error);
      throw error;
    }
  }

  /**
   * Get configuration history
   */
  async getConfigurationHistory(
    configKey: string,
    limit: number = 50
  ): Promise<ConfigurationHistory[]> {
    try {
      const { data, error } = await supabase
        .from('configuration_history')
        .select(`
          *,
          system_configurations!inner(config_key)
        `)
        .eq('system_configurations.organization_id', this.organizationId)
        .eq('system_configurations.config_key', configKey)
        .order('changed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data.map(this.mapConfigurationHistory);
    } catch (error) {
      console.error('Error getting configuration history:', error);
      throw error;
    }
  }

  /**
   * Rollback configuration to previous version
   */
  async rollbackConfiguration(
    configKey: string,
    historyId: string
  ): Promise<SystemConfiguration> {
    try {
      // Get the history record
      const { data: history, error: historyError } = await supabase
        .from('configuration_history')
        .select('*')
        .eq('id', historyId)
        .single();

      if (historyError) throw historyError;

      // Get the configuration
      const { data: config, error: configError } = await supabase
        .from('system_configurations')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('config_key', configKey)
        .eq('environment', 'production')
        .single();

      if (configError) throw configError;

      // Update configuration with previous value
      const { data, error } = await supabase
        .from('system_configurations')
        .update({
          config_value: history.previous_value,
          updated_by: this.userId,
          version: config.version + 1
        })
        .eq('id', config.id)
        .select()
        .single();

      if (error) throw error;

      // Log the rollback
      await this.logConfigurationChange(
        config.id,
        config.config_value,
        history.previous_value,
        `Rollback to version ${history.changed_at}`
      );

      return this.mapSystemConfiguration(data);
    } catch (error) {
      console.error('Error rolling back configuration:', error);
      throw error;
    }
  }

  // =============================================================================
  // MODULE FEATURE MANAGEMENT
  // =============================================================================

  /**
   * Get module features
   */
  async getModuleFeatures(moduleName?: ModuleName): Promise<ModuleFeature[]> {
    try {
      let query = supabase
        .from('module_features')
        .select('*')
        .eq('organization_id', this.organizationId);

      if (moduleName) {
        query = query.eq('module_name', moduleName);
      }

      const { data, error } = await query.order('module_name', { ascending: true });

      if (error) throw error;
      return data.map(this.mapModuleFeature);
    } catch (error) {
      console.error('Error getting module features:', error);
      throw error;
    }
  }

  /**
   * Enable/disable module feature
   */
  async toggleModuleFeature(
    moduleName: ModuleName,
    featureKey: string,
    enabled: boolean,
    reason?: string
  ): Promise<ModuleFeature> {
    try {
      const { data, error } = await supabase
        .from('module_features')
        .update({
          is_enabled: enabled,
          updated_by: this.userId
        })
        .eq('organization_id', this.organizationId)
        .eq('module_name', moduleName)
        .eq('feature_key', featureKey)
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await this.logAdminAction({
        actionType: enabled ? 'module_enable' : 'module_disable',
        actionCategory: 'module_management',
        actionDescription: `${enabled ? 'Enabled' : 'Disabled'} feature ${featureKey} in module ${moduleName}`,
        newState: { moduleName, featureKey, enabled },
        riskLevel: 'low'
      });

      return this.mapModuleFeature(data);
    } catch (error) {
      console.error('Error toggling module feature:', error);
      throw error;
    }
  }

  // =============================================================================
  // MODULE PARAMETER MANAGEMENT
  // =============================================================================

  /**
   * Get module parameters
   */
  async getModuleParameters(moduleName: ModuleName): Promise<ModuleParameter[]> {
    try {
      const { data, error } = await supabase
        .from('module_parameters')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('module_name', moduleName)
        .order('parameter_category', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data.map(this.mapModuleParameter);
    } catch (error) {
      console.error('Error getting module parameters:', error);
      throw error;
    }
  }

  /**
   * Set module parameter
   */
  async setModuleParameter(
    moduleName: ModuleName,
    parameterKey: string,
    value: unknown,
    options: {
      parameterName?: string;
      parameterType?: ParameterType;
      parameterCategory?: string;
      helpText?: string;
      adminOnly?: boolean;
      reason?: string;
    } = {}
  ): Promise<ModuleParameter> {
    try {
      // Check if parameter exists
      const { data: existing } = await supabase
        .from('module_parameters')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('module_name', moduleName)
        .eq('parameter_key', parameterKey)
        .single();

      if (existing) {
        // Update existing parameter
        const { data, error } = await supabase
          .from('module_parameters')
          .update({
            parameter_value: value,
            updated_by: this.userId,
            ...options
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;

        // Log the change
        await this.logAdminAction({
          actionType: 'config_change',
          actionCategory: 'module_parameters',
          actionDescription: `Updated parameter ${parameterKey} in module ${moduleName}`,
          previousState: { parameterKey, oldValue: existing.parameter_value },
          newState: { parameterKey, newValue: value },
          riskLevel: 'low'
        });

        return this.mapModuleParameter(data);
      } else {
        // Create new parameter
        const { data, error } = await supabase
          .from('module_parameters')
          .insert({
            organization_id: this.organizationId,
            module_name: moduleName,
            parameter_key: parameterKey,
            parameter_value: value,
            created_by: this.userId,
            ...options
          })
          .select()
          .single();

        if (error) throw error;

        // Log the change
        await this.logAdminAction({
          actionType: 'config_change',
          actionCategory: 'module_parameters',
          actionDescription: `Created parameter ${parameterKey} in module ${moduleName}`,
          newState: { parameterKey, value },
          riskLevel: 'low'
        });

        return this.mapModuleParameter(data);
      }
    } catch (error) {
      console.error('Error setting module parameter:', error);
      throw error;
    }
  }

  // =============================================================================
  // PERMISSION MANAGEMENT
  // =============================================================================

  /**
   * Check if user has admin permission
   */
  async hasAdminPermission(permissionKey: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('has_admin_permission', {
        p_user_id: this.userId,
        p_permission_key: permissionKey
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking admin permission:', error);
      return false;
    }
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          permission_definitions!inner(permission_key)
        `)
        .eq('organization_id', this.organizationId)
        .eq('role_name', (await this.getUserRole()))
        .eq('is_granted', true);

      if (error) throw error;
      return data.map(item => item.permission_definitions.permission_key);
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * Get all permission definitions
   */
  async getPermissionDefinitions(): Promise<PermissionDefinition[]> {
    try {
      const { data, error } = await supabase
        .from('permission_definitions')
        .select('*')
        .order('permission_category', { ascending: true })
        .order('permission_name', { ascending: true });

      if (error) throw error;
      return data.map(this.mapPermissionDefinition);
    } catch (error) {
      console.error('Error getting permission definitions:', error);
      throw error;
    }
  }

  // =============================================================================
  // AUDIT LOGGING
  // =============================================================================

  /**
   * Log configuration change
   */
  private async logConfigurationChange(
    configurationId: string,
    previousValue: unknown,
    newValue: unknown,
    reason: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('log_configuration_change', {
        p_configuration_id: configurationId,
        p_previous_value: previousValue,
        p_new_value: newValue,
        p_change_reason: reason,
        p_changed_by: this.userId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging configuration change:', error);
      throw error;
    }
  }

  /**
   * Log admin action
   */
  async logAdminAction(action: {
    actionType: AdminActionType;
    actionCategory: string;
    actionDescription: string;
    targetEntityType?: string;
    targetEntityId?: string;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
    riskLevel?: RiskLevel;
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('admin_action_logs')
        .insert({
          organization_id: this.organizationId,
          admin_user_id: this.userId,
          action_type: action.actionType,
          action_category: action.actionCategory,
          action_description: action.actionDescription,
          target_entity_type: action.targetEntityType,
          target_entity_id: action.targetEntityId,
          previous_state: action.previousState,
          new_state: action.newState,
          risk_level: action.riskLevel || 'low'
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error logging admin action:', error);
      throw error;
    }
  }

  /**
   * Get admin action logs
   */
  async getAdminActionLogs(
    filters: {
      actionType?: AdminActionType;
      riskLevel?: RiskLevel;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<AdminActionLog[]> {
    try {
      let query = supabase
        .from('admin_action_logs')
        .select('*')
        .eq('organization_id', this.organizationId);

      if (filters.actionType) {
        query = query.eq('action_type', filters.actionType);
      }

      if (filters.riskLevel) {
        query = query.eq('risk_level', filters.riskLevel);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      query = query.order('created_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data.map(this.mapAdminActionLog);
    } catch (error) {
      console.error('Error getting admin action logs:', error);
      throw error;
    }
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Get user role
   */
  private async getUserRole(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', this.userId)
        .single();

      if (error) throw error;
      return data.role;
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'rep';
    }
  }

  // =============================================================================
  // MAPPING METHODS
  // =============================================================================

  private mapSystemConfiguration(data: any): SystemConfiguration {
    return {
      id: data.id,
      organizationId: data.organization_id,
      configKey: data.config_key,
      configCategory: data.config_category,
      configValue: data.config_value,
      dataType: data.data_type,
      isEncrypted: data.is_encrypted,
      isPublic: data.is_public,
      validationRules: data.validation_rules || [],
      description: data.description,
      defaultValue: data.default_value,
      minValue: data.min_value,
      maxValue: data.max_value,
      allowedValues: data.allowed_values,
      requiresRestart: data.requires_restart,
      environment: data.environment,
      version: data.version,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapConfigurationHistory(data: any): ConfigurationHistory {
    return {
      id: data.id,
      configurationId: data.configuration_id,
      previousValue: data.previous_value,
      newValue: data.new_value,
      changeReason: data.change_reason,
      changedBy: data.changed_by,
      changedAt: new Date(data.changed_at),
      rollbackId: data.rollback_id,
      isRollback: data.is_rollback
    };
  }

  private mapModuleFeature(data: any): ModuleFeature {
    return {
      id: data.id,
      organizationId: data.organization_id,
      moduleName: data.module_name,
      featureKey: data.feature_key,
      featureName: data.feature_name,
      isEnabled: data.is_enabled,
      isBeta: data.is_beta,
      requiresLicense: data.requires_license,
      dependsOn: data.depends_on || [],
      config: data.config || {},
      rolloutPercentage: data.rollout_percentage,
      enabledForRoles: data.enabled_for_roles || [],
      createdBy: data.created_by,
      updatedBy: data.updated_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapModuleParameter(data: any): ModuleParameter {
    return {
      id: data.id,
      organizationId: data.organization_id,
      moduleName: data.module_name,
      parameterKey: data.parameter_key,
      parameterName: data.parameter_name,
      parameterValue: data.parameter_value,
      parameterType: data.parameter_type,
      parameterCategory: data.parameter_category,
      displayOrder: data.display_order,
      isRequired: data.is_required,
      isSensitive: data.is_sensitive,
      validationSchema: data.validation_schema || {},
      helpText: data.help_text,
      adminOnly: data.admin_only,
      effectiveFrom: new Date(data.effective_from),
      effectiveUntil: data.effective_until ? new Date(data.effective_until) : undefined,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapAdminActionLog(data: any): AdminActionLog {
    return {
      id: data.id,
      organizationId: data.organization_id,
      adminUserId: data.admin_user_id,
      actionType: data.action_type,
      actionCategory: data.action_category,
      targetEntityType: data.target_entity_type,
      targetEntityId: data.target_entity_id,
      actionDescription: data.action_description,
      previousState: data.previous_state,
      newState: data.new_state,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      riskLevel: data.risk_level,
      requiresApproval: data.requires_approval,
      approvedBy: data.approved_by,
      approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
      createdAt: new Date(data.created_at)
    };
  }

  private mapPermissionDefinition(data: any): PermissionDefinition {
    return {
      id: data.id,
      permissionKey: data.permission_key,
      permissionName: data.permission_name,
      permissionCategory: data.permission_category,
      description: data.description,
      moduleName: data.module_name,
      isSystemPermission: data.is_system_permission,
      parentPermissionId: data.parent_permission_id,
      createdAt: new Date(data.created_at)
    };
  }
}

// =============================================================================
// EXPORTED UTILITY FUNCTIONS
// =============================================================================

/**
 * Create configuration service instance
 */
export function createConfigurationService(organizationId: string, userId: string): ConfigurationService {
  return new ConfigurationService(organizationId, userId);
}

/**
 * Get configuration value (convenience function)
 */
export async function getConfigValue(
  organizationId: string,
  userId: string,
  configKey: string
): Promise<unknown> {
  const service = createConfigurationService(organizationId, userId);
  return service.getConfigValue(configKey);
}

/**
 * Check admin permission (convenience function)
 */
export async function hasAdminPermission(
  userId: string,
  permissionKey: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('has_admin_permission', {
      p_user_id: userId,
      p_permission_key: permissionKey
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error checking admin permission:', error);
    return false;
  }
}
