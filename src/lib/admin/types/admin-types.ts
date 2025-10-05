// Administration Module - Type Definitions
// Centralized type definitions for the admin module

// =============================================================================
// CORE ADMIN TYPES
// =============================================================================

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId: string;
  lastLoginAt?: Date;
  isActive: boolean;
  permissions: string[];
}

export type UserRole = 
  | 'rep' 
  | 'manager' 
  | 'admin' 
  | 'super_admin';

export type AdminPermission = 
  // Organization Management
  | 'admin.organization.view'
  | 'admin.organization.edit'
  | 'admin.organization.licensing'
  
  // User Management
  | 'admin.users.view'
  | 'admin.users.create'
  | 'admin.users.edit'
  | 'admin.users.delete'
  | 'admin.users.reset_password'
  
  // Role Management
  | 'admin.roles.view'
  | 'admin.roles.create'
  | 'admin.roles.edit'
  | 'admin.roles.delete'
  | 'admin.permissions.manage'
  
  // Module Configuration
  | 'admin.modules.view'
  | 'admin.modules.edit'
  | 'admin.modules.toggle'
  
  // Security Management
  | 'admin.security.view'
  | 'admin.security.edit'
  | 'admin.security.mfa'
  | 'admin.security.sso'
  
  // System Administration
  | 'admin.system.view'
  | 'admin.system.edit'
  | 'admin.system.database'
  | 'admin.system.backups'
  
  // Audit & Compliance
  | 'admin.audit.view'
  | 'admin.audit.export'
  | 'admin.compliance.manage'
  
  // Super Admin
  | 'admin.super_admin';

// =============================================================================
// CONFIGURATION TYPES
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

// =============================================================================
// MODULE TYPES
// =============================================================================

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

export interface ModuleConfiguration {
  name: ModuleName;
  features: ModuleFeature[];
  parameters: ModuleParameter[];
  isEnabled: boolean;
  enabledFeatures: number;
  totalFeatures: number;
}

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

// =============================================================================
// AUDIT TYPES
// =============================================================================

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

// =============================================================================
// PERMISSION TYPES
// =============================================================================

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

export interface PermissionMatrix {
  roles: string[];
  permissions: PermissionDefinition[];
  rolePermissions: Record<string, string[]>;
}

// =============================================================================
// ORGANIZATION TYPES
// =============================================================================

export interface OrganizationSettings {
  basic: {
    name: string;
    domain: string;
    timezone: string;
    currency: string;
    dateFormat: string;
    timeFormat: string;
    fiscalYearStart: string;
    language: string;
    region: string;
  };
  licensing: {
    tier: LicenseTier;
    maxUsers: number;
    maxStorage: number;
    modules: string[];
    expiresAt: Date;
    isTrialActive: boolean;
    trialEndsAt: Date;
  };
  features: {
    enabledModules: ModuleName[];
    betaFeatures: string[];
    experimentalFeatures: string[];
    disabledFeatures: string[];
  };
  compliance: {
    complianceLevel: 'standard' | 'soc2' | 'gdpr' | 'hipaa' | 'fedramp';
    dataResidency: string;
    retentionPolicyDays: number;
    enableAuditLogging: boolean;
    enableDataEncryption: boolean;
    gdprCompliant: boolean;
    hipaaCompliant: boolean;
  };
  branding: {
    logoUrl: string;
    faviconUrl: string;
    primaryColor: string;
    secondaryColor: string;
    customCSS: string;
    emailHeaderLogo: string;
    emailFooterText: string;
  };
}

// =============================================================================
// TEMPLATE TYPES
// =============================================================================

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

export type TemplateType = 
  | 'organization_setup' 
  | 'module_preset' 
  | 'industry_vertical' 
  | 'compliance_profile' 
  | 'role_permissions';

// =============================================================================
// DASHBOARD TYPES
// =============================================================================

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  lastChecked: Date;
}

export interface SystemMetrics {
  activeUsers: number;
  totalUsers: number;
  databaseConnections: number;
  apiResponseTime: number;
  storageUsed: number;
  storageLimit: number;
  integrationsActive: number;
  integrationsTotal: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  user: string;
  riskLevel: RiskLevel;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ConfigApiResponse extends ApiResponse<SystemConfiguration> {
  config?: SystemConfiguration;
}

export interface ModuleApiResponse extends ApiResponse<ModuleConfiguration> {
  module?: ModuleConfiguration;
}

export interface AuditLogApiResponse extends ApiResponse<AdminActionLog[]> {
  logs?: AdminActionLog[];
}

// =============================================================================
// FORM TYPES
// =============================================================================

export interface ConfigFormData {
  configKey: string;
  value: unknown;
  category: ConfigCategory;
  dataType: ConfigDataType;
  description?: string;
  isPublic?: boolean;
  requiresRestart?: boolean;
  validationRules?: ValidationRule[];
  reason?: string;
}

export interface ModuleFormData {
  moduleName: ModuleName;
  parameters: ModuleParameterFormData[];
  features: ModuleFeatureFormData[];
}

export interface ModuleParameterFormData {
  parameterKey: string;
  value: unknown;
  parameterName?: string;
  parameterType?: ParameterType;
  parameterCategory?: string;
  helpText?: string;
  adminOnly?: boolean;
  reason?: string;
}

export interface ModuleFeatureFormData {
  featureKey: string;
  isEnabled: boolean;
  reason?: string;
}

export interface UserFormData {
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  permissions: string[];
}

export interface RoleFormData {
  roleKey: string;
  roleName: string;
  description?: string;
  inheritsFrom?: string;
  permissions: string[];
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ConfigValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom' | 'enum';
  value?: unknown;
  message: string;
  customValidator?: (value: unknown) => boolean;
}

// =============================================================================
// EXPORT UTILITY TYPES
// =============================================================================

export type AdminModuleConfig = {
  [K in ModuleName]: ModuleConfiguration;
};

export type ConfigValue = 
  | string 
  | number 
  | boolean 
  | Record<string, unknown> 
  | unknown[];

export type ConfigKey = `${ConfigCategory}.${string}`;

export type AdminActionContext = {
  userId: string;
  organizationId: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
};
