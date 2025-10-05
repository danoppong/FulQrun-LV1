-- Administration Module - Initial Configuration Migration
-- This script populates initial configurations for the administration module
-- Safe to run on existing databases

-- =============================================================================
-- CREATE SYSTEM USER FOR MIGRATIONS
-- =============================================================================

-- Create a default organization for system user if it doesn't exist
INSERT INTO organizations (
    id,
    name,
    created_at,
    updated_at
)
SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid,
    'System Organization',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM organizations WHERE id = '00000000-0000-0000-0000-000000000000'::uuid
);

-- Create a system user for migrations if it doesn't exist
INSERT INTO users (
    id,
    email,
    full_name,
    role,
    organization_id,
    created_at,
    updated_at
)
SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    'system@fulqrun.com',
    'System User',
    'admin',
    '00000000-0000-0000-0000-000000000000'::uuid,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
);

-- =============================================================================
-- INITIAL MODULE FEATURES
-- =============================================================================

-- Insert default module features for each organization
INSERT INTO module_features (
    organization_id,
    module_name,
    feature_key,
    feature_name,
    is_enabled,
    is_beta,
    requires_license,
    depends_on,
    config,
    rollout_percentage,
    enabled_for_roles,
    created_by
)
SELECT 
    o.id as organization_id,
    'crm' as module_name,
    'lead_scoring' as feature_key,
    'Lead Scoring' as feature_name,
    true as is_enabled,
    false as is_beta,
    'standard' as requires_license,
    '{}' as depends_on,
    '{"algorithm": "weighted", "thresholds": {"hot": 80, "warm": 60, "cool": 40}}' as config,
    100 as rollout_percentage,
    '{"rep", "manager", "admin"}' as enabled_for_roles,
    COALESCE(
        (SELECT id FROM users WHERE role = 'admin' AND organization_id = o.id LIMIT 1),
        (SELECT id FROM users WHERE organization_id = o.id LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ) as created_by
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM module_features 
    WHERE organization_id = o.id 
    AND module_name = 'crm' 
    AND feature_key = 'lead_scoring'
);

-- CRM MEDDPICC Feature
INSERT INTO module_features (
    organization_id,
    module_name,
    feature_key,
    feature_name,
    is_enabled,
    is_beta,
    requires_license,
    depends_on,
    config,
    rollout_percentage,
    enabled_for_roles,
    created_by
)
SELECT 
    o.id as organization_id,
    'crm' as module_name,
    'meddpicc' as feature_key,
    'MEDDPICC Qualification' as feature_name,
    true as is_enabled,
    false as is_beta,
    'standard' as requires_license,
    '{"lead_scoring"}' as depends_on,
    '{"weights": {"metrics": 15, "economicBuyer": 20, "decisionCriteria": 10, "decisionProcess": 15, "paperProcess": 5, "identifyPain": 20, "implicatePain": 20, "champion": 10, "competition": 5}}' as config,
    100 as rollout_percentage,
    '{"rep", "manager", "admin"}' as enabled_for_roles,
    COALESCE(
        (SELECT id FROM users WHERE role = 'admin' AND organization_id = o.id LIMIT 1),
        (SELECT id FROM users WHERE organization_id = o.id LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ) as created_by
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM module_features 
    WHERE organization_id = o.id 
    AND module_name = 'crm' 
    AND feature_key = 'meddpicc'
);

-- Sales Performance Module Features
INSERT INTO module_features (
    organization_id,
    module_name,
    feature_key,
    feature_name,
    is_enabled,
    is_beta,
    requires_license,
    depends_on,
    config,
    rollout_percentage,
    enabled_for_roles,
    created_by
)
SELECT 
    o.id as organization_id,
    'sales_performance' as module_name,
    'territory_management' as feature_key,
    'Territory Management' as feature_name,
    true as is_enabled,
    false as is_beta,
    'professional' as requires_license,
    '{}' as depends_on,
    '{"allowOverlapping": false, "requireApproval": true}' as config,
    100 as rollout_percentage,
    '{"manager", "admin"}' as enabled_for_roles,
    COALESCE(
        (SELECT id FROM users WHERE role = 'admin' AND organization_id = o.id LIMIT 1),
        (SELECT id FROM users WHERE organization_id = o.id LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ) as created_by
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM module_features 
    WHERE organization_id = o.id 
    AND module_name = 'sales_performance' 
    AND feature_key = 'territory_management'
);

-- KPI Module Features
INSERT INTO module_features (
    organization_id,
    module_name,
    feature_key,
    feature_name,
    is_enabled,
    is_beta,
    requires_license,
    depends_on,
    config,
    rollout_percentage,
    enabled_for_roles,
    created_by
)
SELECT 
    o.id as organization_id,
    'kpi' as module_name,
    'dashboard_analytics' as feature_key,
    'Dashboard Analytics' as feature_name,
    true as is_enabled,
    false as is_beta,
    'standard' as requires_license,
    '{}' as depends_on,
    '{"refreshInterval": 300, "maxKPIs": 10}' as config,
    100 as rollout_percentage,
    '{"rep", "manager", "admin"}' as enabled_for_roles,
    COALESCE(
        (SELECT id FROM users WHERE role = 'admin' AND organization_id = o.id LIMIT 1),
        (SELECT id FROM users WHERE organization_id = o.id LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ) as created_by
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM module_features 
    WHERE organization_id = o.id 
    AND module_name = 'kpi' 
    AND feature_key = 'dashboard_analytics'
);

-- Learning Platform Features
INSERT INTO module_features (
    organization_id,
    module_name,
    feature_key,
    feature_name,
    is_enabled,
    is_beta,
    requires_license,
    depends_on,
    config,
    rollout_percentage,
    enabled_for_roles,
    created_by
)
SELECT 
    o.id as organization_id,
    'learning' as module_name,
    'compliance_training' as feature_key,
    'Compliance Training' as feature_name,
    true as is_enabled,
    false as is_beta,
    'enterprise' as requires_license,
    '{}' as depends_on,
    '{"enforceDeadlines": true, "sendReminders": true, "reminderDays": [7, 3, 1]}' as config,
    100 as rollout_percentage,
    '{"rep", "manager", "admin"}' as enabled_for_roles,
    COALESCE(
        (SELECT id FROM users WHERE role = 'admin' AND organization_id = o.id LIMIT 1),
        (SELECT id FROM users WHERE organization_id = o.id LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ) as created_by
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM module_features 
    WHERE organization_id = o.id 
    AND module_name = 'learning' 
    AND feature_key = 'compliance_training'
);

-- AI Module Features
INSERT INTO module_features (
    organization_id,
    module_name,
    feature_key,
    feature_name,
    is_enabled,
    is_beta,
    requires_license,
    depends_on,
    config,
    rollout_percentage,
    enabled_for_roles,
    created_by
)
SELECT 
    o.id as organization_id,
    'ai' as module_name,
    'lead_scoring_ai' as feature_key,
    'AI Lead Scoring' as feature_name,
    false as is_enabled,
    true as is_beta,
    'enterprise' as requires_license,
    '{"lead_scoring"}' as depends_on,
    '{"modelVersion": "v1.0", "confidenceThreshold": 0.8}' as config,
    50 as rollout_percentage,
    '{"admin"}' as enabled_for_roles,
    COALESCE(
        (SELECT id FROM users WHERE role = 'admin' AND organization_id = o.id LIMIT 1),
        (SELECT id FROM users WHERE organization_id = o.id LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ) as created_by
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM module_features 
    WHERE organization_id = o.id 
    AND module_name = 'ai' 
    AND feature_key = 'lead_scoring_ai'
);

-- =============================================================================
-- INITIAL MODULE PARAMETERS
-- =============================================================================

-- CRM Module Parameters
INSERT INTO module_parameters (
    organization_id,
    module_name,
    parameter_key,
    parameter_name,
    parameter_value,
    parameter_type,
    parameter_category,
    display_order,
    is_required,
    is_sensitive,
    validation_schema,
    help_text,
    admin_only,
    created_by
)
SELECT 
    o.id as organization_id,
    'crm' as module_name,
    'auto_assign_leads' as parameter_key,
    'Auto Assign Leads' as parameter_name,
    'false'::jsonb as parameter_value,
    'boolean' as parameter_type,
    'Automation' as parameter_category,
    1 as display_order,
    false as is_required,
    false as is_sensitive,
    '{}' as validation_schema,
    'Automatically assign new leads to available sales reps' as help_text,
    true as admin_only,
    COALESCE(
        (SELECT id FROM users WHERE role = 'admin' AND organization_id = o.id LIMIT 1),
        (SELECT id FROM users WHERE organization_id = o.id LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ) as created_by
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM module_parameters 
    WHERE organization_id = o.id 
    AND module_name = 'crm' 
    AND parameter_key = 'auto_assign_leads'
);

-- Lead Scoring Parameters
INSERT INTO module_parameters (
    organization_id,
    module_name,
    parameter_key,
    parameter_name,
    parameter_value,
    parameter_type,
    parameter_category,
    display_order,
    is_required,
    is_sensitive,
    validation_schema,
    help_text,
    admin_only,
    created_by
)
SELECT 
    o.id as organization_id,
    'crm' as module_name,
    'lead_scoring_thresholds' as parameter_key,
    'Lead Scoring Thresholds' as parameter_name,
    '{"hot": 80, "warm": 60, "cool": 40, "cold": 20}' as parameter_value,
    'json' as parameter_type,
    'Scoring' as parameter_category,
    2 as display_order,
    true as is_required,
    false as is_sensitive,
    '{"type": "object", "properties": {"hot": {"type": "number", "minimum": 0, "maximum": 100}, "warm": {"type": "number", "minimum": 0, "maximum": 100}, "cool": {"type": "number", "minimum": 0, "maximum": 100}, "cold": {"type": "number", "minimum": 0, "maximum": 100}}}' as validation_schema,
    'Define score thresholds for lead qualification levels' as help_text,
    true as admin_only,
    COALESCE(
        (SELECT id FROM users WHERE role = 'admin' AND organization_id = o.id LIMIT 1),
        (SELECT id FROM users WHERE organization_id = o.id LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ) as created_by
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM module_parameters 
    WHERE organization_id = o.id 
    AND module_name = 'crm' 
    AND parameter_key = 'lead_scoring_thresholds'
);

-- MEDDPICC Parameters
INSERT INTO module_parameters (
    organization_id,
    module_name,
    parameter_key,
    parameter_name,
    parameter_value,
    parameter_type,
    parameter_category,
    display_order,
    is_required,
    is_sensitive,
    validation_schema,
    help_text,
    admin_only,
    created_by
)
SELECT 
    o.id as organization_id,
    'crm' as module_name,
    'meddpicc_weights' as parameter_key,
    'MEDDPICC Weights' as parameter_name,
    '{"metrics": 15, "economicBuyer": 20, "decisionCriteria": 10, "decisionProcess": 15, "paperProcess": 5, "identifyPain": 20, "implicatePain": 20, "champion": 10, "competition": 5}' as parameter_value,
    'json' as parameter_type,
    'MEDDPICC' as parameter_category,
    3 as display_order,
    true as is_required,
    false as is_sensitive,
    '{"type": "object", "properties": {"metrics": {"type": "number", "minimum": 0, "maximum": 100}, "economicBuyer": {"type": "number", "minimum": 0, "maximum": 100}, "decisionCriteria": {"type": "number", "minimum": 0, "maximum": 100}, "decisionProcess": {"type": "number", "minimum": 0, "maximum": 100}, "paperProcess": {"type": "number", "minimum": 0, "maximum": 100}, "identifyPain": {"type": "number", "minimum": 0, "maximum": 100}, "implicatePain": {"type": "number", "minimum": 0, "maximum": 100}, "champion": {"type": "number", "minimum": 0, "maximum": 100}, "competition": {"type": "number", "minimum": 0, "maximum": 100}}}' as validation_schema,
    'Configure the relative importance of each MEDDPICC pillar' as help_text,
    true as admin_only,
    COALESCE(
        (SELECT id FROM users WHERE role = 'admin' AND organization_id = o.id LIMIT 1),
        (SELECT id FROM users WHERE organization_id = o.id LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ) as created_by
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM module_parameters 
    WHERE organization_id = o.id 
    AND module_name = 'crm' 
    AND parameter_key = 'meddpicc_weights'
);

-- Sales Performance Parameters
INSERT INTO module_parameters (
    organization_id,
    module_name,
    parameter_key,
    parameter_name,
    parameter_value,
    parameter_type,
    parameter_category,
    display_order,
    is_required,
    is_sensitive,
    validation_schema,
    help_text,
    admin_only,
    created_by
)
SELECT 
    o.id as organization_id,
    'sales_performance' as module_name,
    'quota_planning_method' as parameter_key,
    'Quota Planning Method' as parameter_name,
    '"top_down"'::jsonb as parameter_value,
    'select' as parameter_type,
    'Planning' as parameter_category,
    1 as display_order,
    true as is_required,
    false as is_sensitive,
    '{"enum": ["top_down", "bottom_up", "middle_out", "direct"]}' as validation_schema,
    'Choose the method for quota planning and allocation' as help_text,
    true as admin_only,
    COALESCE(
        (SELECT id FROM users WHERE role = 'admin' AND organization_id = o.id LIMIT 1),
        (SELECT id FROM users WHERE organization_id = o.id LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ) as created_by
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM module_parameters 
    WHERE organization_id = o.id 
    AND module_name = 'sales_performance' 
    AND parameter_key = 'quota_planning_method'
);

-- KPI Parameters
INSERT INTO module_parameters (
    organization_id,
    module_name,
    parameter_key,
    parameter_name,
    parameter_value,
    parameter_type,
    parameter_category,
    display_order,
    is_required,
    is_sensitive,
    validation_schema,
    help_text,
    admin_only,
    created_by
)
SELECT 
    o.id as organization_id,
    'kpi' as module_name,
    'calculation_frequency' as parameter_key,
    'KPI Calculation Frequency' as parameter_name,
    '"daily"'::jsonb as parameter_value,
    'select' as parameter_type,
    'Performance' as parameter_category,
    1 as display_order,
    true as is_required,
    false as is_sensitive,
    '{"enum": ["realtime", "hourly", "daily", "weekly"]}' as validation_schema,
    'How often to recalculate KPI values' as help_text,
    true as admin_only,
    COALESCE(
        (SELECT id FROM users WHERE role = 'admin' AND organization_id = o.id LIMIT 1),
        (SELECT id FROM users WHERE organization_id = o.id LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ) as created_by
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM module_parameters 
    WHERE organization_id = o.id 
    AND module_name = 'kpi' 
    AND parameter_key = 'calculation_frequency'
);

-- =============================================================================
-- INITIAL SYSTEM CONFIGURATIONS
-- =============================================================================

-- Organization Settings
INSERT INTO system_configurations (
    organization_id,
    config_key,
    config_category,
    config_value,
    data_type,
    is_public,
    description,
    created_by
)
SELECT 
    o.id as organization_id,
    'organization.timezone' as config_key,
    'organization' as config_category,
    '"UTC"'::jsonb as config_value,
    'string' as data_type,
    true as is_public,
    'Default timezone for the organization' as description,
    COALESCE(
        (SELECT id FROM users WHERE role = 'admin' AND organization_id = o.id LIMIT 1),
        (SELECT id FROM users WHERE organization_id = o.id LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ) as created_by
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM system_configurations 
    WHERE organization_id = o.id 
    AND config_key = 'organization.timezone'
);

-- Currency Settings
INSERT INTO system_configurations (
    organization_id,
    config_key,
    config_category,
    config_value,
    data_type,
    is_public,
    description,
    created_by
)
SELECT 
    o.id as organization_id,
    'organization.currency' as config_key,
    'organization' as config_category,
    '"USD"'::jsonb as config_value,
    'string' as data_type,
    true as is_public,
    'Default currency for the organization' as description,
    COALESCE(
        (SELECT id FROM users WHERE role = 'admin' AND organization_id = o.id LIMIT 1),
        (SELECT id FROM users WHERE organization_id = o.id LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ) as created_by
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM system_configurations 
    WHERE organization_id = o.id 
    AND config_key = 'organization.currency'
);

-- Security Settings
INSERT INTO system_configurations (
    organization_id,
    config_key,
    config_category,
    config_value,
    data_type,
    is_public,
    description,
    created_by
)
SELECT 
    o.id as organization_id,
    'security.session_timeout' as config_key,
    'security' as config_category,
    '480'::jsonb as config_value,
    'number' as data_type,
    false as is_public,
    'Session timeout in minutes' as description,
    COALESCE(
        (SELECT id FROM users WHERE role = 'admin' AND organization_id = o.id LIMIT 1),
        (SELECT id FROM users WHERE organization_id = o.id LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ) as created_by
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM system_configurations 
    WHERE organization_id = o.id 
    AND config_key = 'security.session_timeout'
);

-- UI Settings
INSERT INTO system_configurations (
    organization_id,
    config_key,
    config_category,
    config_value,
    data_type,
    is_public,
    description,
    created_by
)
SELECT 
    o.id as organization_id,
    'ui.default_theme' as config_key,
    'ui' as config_category,
    '"light"'::jsonb as config_value,
    'string' as data_type,
    true as is_public,
    'Default theme for the application' as description,
    COALESCE(
        (SELECT id FROM users WHERE role = 'admin' AND organization_id = o.id LIMIT 1),
        (SELECT id FROM users WHERE organization_id = o.id LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ) as created_by
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM system_configurations 
    WHERE organization_id = o.id 
    AND config_key = 'ui.default_theme'
);

-- =============================================================================
-- ROLE PERMISSIONS SETUP
-- =============================================================================

-- Grant admin permissions to admin users
INSERT INTO role_permissions (
    organization_id,
    role_name,
    permission_id,
    is_granted,
    granted_by
)
SELECT 
    o.id as organization_id,
    'admin' as role_name,
    pd.id as permission_id,
    true as is_granted,
    COALESCE(
        (SELECT id FROM users WHERE role = 'admin' AND organization_id = o.id LIMIT 1),
        (SELECT id FROM users WHERE organization_id = o.id LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ) as granted_by
FROM organizations o
CROSS JOIN permission_definitions pd
WHERE pd.permission_key LIKE 'admin.%'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE organization_id = o.id 
    AND role_name = 'admin' 
    AND permission_id = pd.id
);

-- Grant basic permissions to managers
INSERT INTO role_permissions (
    organization_id,
    role_name,
    permission_id,
    is_granted,
    granted_by
)
SELECT 
    o.id as organization_id,
    'manager' as role_name,
    pd.id as permission_id,
    CASE 
        WHEN pd.permission_key IN ('admin.modules.view', 'admin.users.view', 'admin.audit.view') THEN true
        ELSE false
    END as is_granted,
    COALESCE(
        (SELECT id FROM users WHERE role = 'admin' AND organization_id = o.id LIMIT 1),
        (SELECT id FROM users WHERE organization_id = o.id LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
    ) as granted_by
FROM organizations o
CROSS JOIN permission_definitions pd
WHERE pd.permission_key LIKE 'admin.%'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE organization_id = o.id 
    AND role_name = 'manager' 
    AND permission_id = pd.id
);

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Administration Module initial configuration completed successfully!';
    RAISE NOTICE 'Created module features, parameters, and system configurations for all organizations.';
    RAISE NOTICE 'Set up role-based permissions for admin and manager roles.';
END $$;
