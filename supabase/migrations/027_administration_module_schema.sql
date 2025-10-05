-- Administration Module Database Schema
-- This migration adds comprehensive tables for system administration and configuration management
-- Safe to run on existing databases

-- =============================================================================
-- CONFIGURATION MANAGEMENT TABLES
-- =============================================================================

-- System configuration table
CREATE TABLE IF NOT EXISTS system_configurations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    config_key TEXT NOT NULL,
    config_category TEXT NOT NULL CHECK (config_category IN (
        'organization', 'crm', 'sales_performance', 'kpi', 'learning', 
        'integrations', 'ai', 'mobile', 'security', 'workflow', 'ui'
    )),
    config_value JSONB NOT NULL DEFAULT '{}',
    data_type TEXT NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'array')),
    is_encrypted BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false, -- Can non-admin users see this?
    validation_rules JSONB DEFAULT '{}',
    description TEXT,
    default_value JSONB,
    min_value NUMERIC,
    max_value NUMERIC,
    allowed_values TEXT[],
    requires_restart BOOLEAN DEFAULT false,
    environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production', 'all')),
    version INTEGER DEFAULT 1,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, config_key, environment)
);

-- Configuration change history
CREATE TABLE IF NOT EXISTS configuration_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    configuration_id UUID NOT NULL REFERENCES system_configurations(id) ON DELETE CASCADE,
    previous_value JSONB,
    new_value JSONB,
    change_reason TEXT,
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rollback_id UUID REFERENCES configuration_history(id),
    is_rollback BOOLEAN DEFAULT false
);

-- Module feature flags
CREATE TABLE IF NOT EXISTS module_features (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    module_name TEXT NOT NULL CHECK (module_name IN (
        'crm', 'sales_performance', 'kpi', 'learning', 'integrations', 
        'ai', 'mobile', 'pharmaceutical_bi', 'workflows', 'analytics'
    )),
    feature_key TEXT NOT NULL,
    feature_name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    is_beta BOOLEAN DEFAULT false,
    requires_license TEXT, -- 'standard', 'professional', 'enterprise', 'enterprise_plus'
    depends_on TEXT[], -- Array of feature_keys this depends on
    config JSONB DEFAULT '{}',
    rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    enabled_for_roles TEXT[] DEFAULT '{}', -- Specific roles that can access
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, module_name, feature_key)
);

-- Module parameters (configurable settings per module)
CREATE TABLE IF NOT EXISTS module_parameters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    module_name TEXT NOT NULL,
    parameter_key TEXT NOT NULL,
    parameter_name TEXT NOT NULL,
    parameter_value JSONB NOT NULL,
    parameter_type TEXT NOT NULL CHECK (parameter_type IN (
        'string', 'number', 'boolean', 'json', 'array', 'select', 'multiselect'
    )),
    parameter_category TEXT, -- Group related parameters
    display_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    is_sensitive BOOLEAN DEFAULT false, -- Hide value in UI
    validation_schema JSONB DEFAULT '{}',
    help_text TEXT,
    admin_only BOOLEAN DEFAULT false,
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_until TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, module_name, parameter_key)
);

-- Role-based configuration overrides
CREATE TABLE IF NOT EXISTS role_configuration_overrides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    config_key TEXT NOT NULL,
    override_value JSONB NOT NULL,
    priority INTEGER DEFAULT 0, -- Higher priority overrides lower
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-specific configuration overrides
CREATE TABLE IF NOT EXISTS user_configuration_overrides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    config_key TEXT NOT NULL,
    override_value JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, config_key)
);

-- Admin action audit log
CREATE TABLE IF NOT EXISTS admin_action_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'config_change', 'user_create', 'user_update', 'user_delete', 
        'role_change', 'permission_change', 'module_enable', 'module_disable',
        'integration_setup', 'security_change', 'system_change'
    )),
    action_category TEXT NOT NULL,
    target_entity_type TEXT,
    target_entity_id UUID,
    action_description TEXT NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    ip_address INET,
    user_agent TEXT,
    risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configuration templates
CREATE TABLE IF NOT EXISTS configuration_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_name TEXT NOT NULL,
    description TEXT,
    template_type TEXT NOT NULL CHECK (template_type IN (
        'organization_setup', 'module_preset', 'industry_vertical', 
        'compliance_profile', 'role_permissions'
    )),
    industry TEXT, -- 'pharmaceutical', 'technology', 'financial_services', etc.
    organization_size TEXT, -- 'small', 'medium', 'enterprise'
    configuration_data JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false, -- Available to all orgs
    is_verified BOOLEAN DEFAULT false, -- Verified by FulQrun team
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PERMISSION MANAGEMENT TABLES
-- =============================================================================

-- Permission definitions
CREATE TABLE IF NOT EXISTS permission_definitions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    permission_key TEXT NOT NULL UNIQUE,
    permission_name TEXT NOT NULL,
    permission_category TEXT NOT NULL,
    description TEXT,
    module_name TEXT,
    is_system_permission BOOLEAN DEFAULT false,
    parent_permission_id UUID REFERENCES permission_definitions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role permissions mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    permission_id UUID NOT NULL REFERENCES permission_definitions(id) ON DELETE CASCADE,
    is_granted BOOLEAN DEFAULT true,
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, role_name, permission_id)
);

-- Custom user roles
CREATE TABLE IF NOT EXISTS custom_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_key TEXT NOT NULL,
    role_name TEXT NOT NULL,
    description TEXT,
    inherits_from TEXT, -- Base role to inherit permissions from
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, role_key)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- System configurations indexes
CREATE INDEX IF NOT EXISTS idx_system_configurations_org_category ON system_configurations(organization_id, config_category);
CREATE INDEX IF NOT EXISTS idx_system_configurations_key ON system_configurations(config_key);
CREATE INDEX IF NOT EXISTS idx_system_configurations_environment ON system_configurations(environment);

-- Configuration history indexes
CREATE INDEX IF NOT EXISTS idx_configuration_history_config_id ON configuration_history(configuration_id);
CREATE INDEX IF NOT EXISTS idx_configuration_history_changed_by ON configuration_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_configuration_history_changed_at ON configuration_history(changed_at);

-- Module features indexes
CREATE INDEX IF NOT EXISTS idx_module_features_org_module ON module_features(organization_id, module_name);
CREATE INDEX IF NOT EXISTS idx_module_features_enabled ON module_features(is_enabled);

-- Module parameters indexes
CREATE INDEX IF NOT EXISTS idx_module_parameters_org_module ON module_parameters(organization_id, module_name);
CREATE INDEX IF NOT EXISTS idx_module_parameters_category ON module_parameters(parameter_category);

-- Admin action logs indexes
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_org ON admin_action_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_admin_user ON admin_action_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_action_type ON admin_action_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created_at ON admin_action_logs(created_at);

-- Permission definitions indexes
CREATE INDEX IF NOT EXISTS idx_permission_definitions_category ON permission_definitions(permission_category);
CREATE INDEX IF NOT EXISTS idx_permission_definitions_module ON permission_definitions(module_name);

-- Role permissions indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_org_role ON role_permissions(organization_id, role_name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_configuration_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_configuration_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

-- System configurations policies
DROP POLICY IF EXISTS "Users can view organization configurations" ON system_configurations;
CREATE POLICY "Users can view organization configurations" ON system_configurations
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        )
    );

DROP POLICY IF EXISTS "Admins can manage organization configurations" ON system_configurations;
CREATE POLICY "Admins can manage organization configurations" ON system_configurations
    FOR ALL USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        ) AND (
            SELECT role FROM users WHERE id = auth.uid() LIMIT 1
        ) IN ('admin', 'super_admin')
    );

-- Configuration history policies
DROP POLICY IF EXISTS "Users can view organization configuration history" ON configuration_history;
CREATE POLICY "Users can view organization configuration history" ON configuration_history
    FOR SELECT USING (
        configuration_id IN (
            SELECT id FROM system_configurations 
            WHERE organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            )
        )
    );

-- Module features policies
DROP POLICY IF EXISTS "Users can view organization module features" ON module_features;
CREATE POLICY "Users can view organization module features" ON module_features
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        )
    );

DROP POLICY IF EXISTS "Admins can manage organization module features" ON module_features;
CREATE POLICY "Admins can manage organization module features" ON module_features
    FOR ALL USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        ) AND (
            SELECT role FROM users WHERE id = auth.uid() LIMIT 1
        ) IN ('admin', 'super_admin')
    );

-- Module parameters policies
DROP POLICY IF EXISTS "Users can view organization module parameters" ON module_parameters;
CREATE POLICY "Users can view organization module parameters" ON module_parameters
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        )
    );

DROP POLICY IF EXISTS "Admins can manage organization module parameters" ON module_parameters;
CREATE POLICY "Admins can manage organization module parameters" ON module_parameters
    FOR ALL USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        ) AND (
            SELECT role FROM users WHERE id = auth.uid() LIMIT 1
        ) IN ('admin', 'super_admin')
    );

-- Admin action logs policies
DROP POLICY IF EXISTS "Admins can view organization admin action logs" ON admin_action_logs;
CREATE POLICY "Admins can view organization admin action logs" ON admin_action_logs
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        ) AND (
            SELECT role FROM users WHERE id = auth.uid() LIMIT 1
        ) IN ('admin', 'super_admin')
    );

DROP POLICY IF EXISTS "System can insert admin action logs" ON admin_action_logs;
CREATE POLICY "System can insert admin action logs" ON admin_action_logs
    FOR INSERT WITH CHECK (true);

-- Permission definitions policies (public read)
DROP POLICY IF EXISTS "Anyone can view permission definitions" ON permission_definitions;
CREATE POLICY "Anyone can view permission definitions" ON permission_definitions
    FOR SELECT USING (true);

-- Role permissions policies
DROP POLICY IF EXISTS "Users can view organization role permissions" ON role_permissions;
CREATE POLICY "Users can view organization role permissions" ON role_permissions
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        )
    );

DROP POLICY IF EXISTS "Admins can manage organization role permissions" ON role_permissions;
CREATE POLICY "Admins can manage organization role permissions" ON role_permissions
    FOR ALL USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        ) AND (
            SELECT role FROM users WHERE id = auth.uid() LIMIT 1
        ) IN ('admin', 'super_admin')
    );

-- Custom roles policies
DROP POLICY IF EXISTS "Users can view organization custom roles" ON custom_roles;
CREATE POLICY "Users can view organization custom roles" ON custom_roles
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        )
    );

DROP POLICY IF EXISTS "Admins can manage organization custom roles" ON custom_roles;
CREATE POLICY "Admins can manage organization custom roles" ON custom_roles
    FOR ALL USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        ) AND (
            SELECT role FROM users WHERE id = auth.uid() LIMIT 1
        ) IN ('admin', 'super_admin')
    );

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
DROP TRIGGER IF EXISTS update_system_configurations_updated_at ON system_configurations;
CREATE TRIGGER update_system_configurations_updated_at BEFORE UPDATE ON system_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_module_features_updated_at ON module_features;
CREATE TRIGGER update_module_features_updated_at BEFORE UPDATE ON module_features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_module_parameters_updated_at ON module_parameters;
CREATE TRIGGER update_module_parameters_updated_at BEFORE UPDATE ON module_parameters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_role_configuration_overrides_updated_at ON role_configuration_overrides;
CREATE TRIGGER update_role_configuration_overrides_updated_at BEFORE UPDATE ON role_configuration_overrides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_configuration_overrides_updated_at ON user_configuration_overrides;
CREATE TRIGGER update_user_configuration_overrides_updated_at BEFORE UPDATE ON user_configuration_overrides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_configuration_templates_updated_at ON configuration_templates;
CREATE TRIGGER update_configuration_templates_updated_at BEFORE UPDATE ON configuration_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_roles_updated_at ON custom_roles;
CREATE TRIGGER update_custom_roles_updated_at BEFORE UPDATE ON custom_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- INITIAL DATA SEEDING
-- =============================================================================

-- Insert default permission definitions
INSERT INTO permission_definitions (permission_key, permission_name, permission_category, description, module_name, is_system_permission) VALUES
-- Organization Management
('admin.organization.view', 'View Organization Settings', 'Organization Management', 'View organization settings and configuration', 'admin', true),
('admin.organization.edit', 'Edit Organization Settings', 'Organization Management', 'Edit organization settings and configuration', 'admin', true),
('admin.organization.licensing', 'Manage Licensing', 'Organization Management', 'Manage organization licensing and billing', 'admin', true),

-- User Management
('admin.users.view', 'View Users', 'User Management', 'View user list and details', 'admin', true),
('admin.users.create', 'Create Users', 'User Management', 'Create new users', 'admin', true),
('admin.users.edit', 'Edit Users', 'User Management', 'Edit user information', 'admin', true),
('admin.users.delete', 'Delete Users', 'User Management', 'Delete users', 'admin', true),
('admin.users.reset_password', 'Reset Passwords', 'User Management', 'Reset user passwords', 'admin', true),

-- Role Management
('admin.roles.view', 'View Roles', 'Role Management', 'View roles and permissions', 'admin', true),
('admin.roles.create', 'Create Roles', 'Role Management', 'Create custom roles', 'admin', true),
('admin.roles.edit', 'Edit Roles', 'Role Management', 'Edit roles and permissions', 'admin', true),
('admin.roles.delete', 'Delete Roles', 'Role Management', 'Delete custom roles', 'admin', true),
('admin.permissions.manage', 'Manage Permissions', 'Role Management', 'Manage role permissions', 'admin', true),

-- Module Configuration
('admin.modules.view', 'View Module Configuration', 'Module Configuration', 'View module settings', 'admin', true),
('admin.modules.edit', 'Edit Module Configuration', 'Module Configuration', 'Edit module settings', 'admin', true),
('admin.modules.toggle', 'Enable/Disable Modules', 'Module Configuration', 'Enable or disable modules', 'admin', true),

-- Security Management
('admin.security.view', 'View Security Settings', 'Security Management', 'View security configuration', 'admin', true),
('admin.security.edit', 'Edit Security Settings', 'Security Management', 'Edit security configuration', 'admin', true),
('admin.security.mfa', 'Manage MFA', 'Security Management', 'Manage multi-factor authentication', 'admin', true),
('admin.security.sso', 'Manage SSO', 'Security Management', 'Manage single sign-on', 'admin', true),

-- System Administration
('admin.system.view', 'View System Configuration', 'System Administration', 'View system settings', 'admin', true),
('admin.system.edit', 'Edit System Configuration', 'System Administration', 'Edit system settings', 'admin', true),
('admin.system.database', 'Access Database', 'System Administration', 'Access database management', 'admin', true),
('admin.system.backups', 'Manage Backups', 'System Administration', 'Manage system backups', 'admin', true),

-- Audit & Compliance
('admin.audit.view', 'View Audit Logs', 'Audit & Compliance', 'View audit logs', 'admin', true),
('admin.audit.export', 'Export Audit Logs', 'Audit & Compliance', 'Export audit logs', 'admin', true),
('admin.compliance.manage', 'Manage Compliance', 'Audit & Compliance', 'Manage compliance settings', 'admin', true),

-- Super Admin
('admin.super_admin', 'Super Admin Access', 'Super Admin', 'Full administrative access', 'admin', true)
ON CONFLICT (permission_key) DO NOTHING;

-- =============================================================================
-- FUNCTIONS FOR CONFIGURATION MANAGEMENT
-- =============================================================================

-- Function to get configuration value with hierarchy resolution
CREATE OR REPLACE FUNCTION get_config_value(
    p_organization_id UUID,
    p_config_key TEXT,
    p_user_id UUID DEFAULT NULL,
    p_role_name TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_value JSONB;
    v_user_role TEXT;
BEGIN
    -- Get user role if user_id provided
    IF p_user_id IS NOT NULL THEN
        SELECT role INTO v_user_role FROM users WHERE id = p_user_id LIMIT 1;
    END IF;
    
    -- Use provided role or user role
    IF p_role_name IS NOT NULL THEN
        v_user_role := p_role_name;
    END IF;
    
    -- Check user-specific override first
    IF p_user_id IS NOT NULL THEN
        SELECT override_value INTO v_value
        FROM user_configuration_overrides
        WHERE user_id = p_user_id 
        AND config_key = p_config_key 
        AND is_active = true
        LIMIT 1;
        
        IF v_value IS NOT NULL THEN
            RETURN v_value;
        END IF;
    END IF;
    
    -- Check role-based override
    IF v_user_role IS NOT NULL THEN
        SELECT override_value INTO v_value
        FROM role_configuration_overrides
        WHERE organization_id = p_organization_id
        AND role_name = v_user_role
        AND config_key = p_config_key
        AND is_active = true
        ORDER BY priority DESC
        LIMIT 1;
        
        IF v_value IS NOT NULL THEN
            RETURN v_value;
        END IF;
    END IF;
    
    -- Get organization configuration
    SELECT config_value INTO v_value
    FROM system_configurations
    WHERE organization_id = p_organization_id
    AND config_key = p_config_key
    AND environment IN ('production', 'all')
    LIMIT 1;
    
    RETURN COALESCE(v_value, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log configuration changes
CREATE OR REPLACE FUNCTION log_configuration_change(
    p_configuration_id UUID,
    p_previous_value JSONB,
    p_new_value JSONB,
    p_change_reason TEXT,
    p_changed_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_history_id UUID;
BEGIN
    INSERT INTO configuration_history (
        configuration_id,
        previous_value,
        new_value,
        change_reason,
        changed_by
    ) VALUES (
        p_configuration_id,
        p_previous_value,
        p_new_value,
        p_change_reason,
        p_changed_by
    ) RETURNING id INTO v_history_id;
    
    RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check admin permissions
CREATE OR REPLACE FUNCTION has_admin_permission(
    p_user_id UUID,
    p_permission_key TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role TEXT;
    v_organization_id UUID;
    v_has_permission BOOLEAN := false;
BEGIN
    -- Get user role and organization
    SELECT role, organization_id INTO v_user_role, v_organization_id
    FROM users WHERE id = p_user_id LIMIT 1;
    
    -- Super admin has all permissions
    IF v_user_role = 'super_admin' THEN
        RETURN true;
    END IF;
    
    -- Check if user has the specific permission
    SELECT EXISTS(
        SELECT 1 FROM role_permissions rp
        JOIN permission_definitions pd ON rp.permission_id = pd.id
        WHERE rp.organization_id = v_organization_id
        AND rp.role_name = v_user_role
        AND pd.permission_key = p_permission_key
        AND rp.is_granted = true
    ) INTO v_has_permission;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE system_configurations IS 'Central configuration storage for all system settings';
COMMENT ON TABLE configuration_history IS 'Audit trail for all configuration changes';
COMMENT ON TABLE module_features IS 'Feature flags and module-specific settings';
COMMENT ON TABLE module_parameters IS 'Configurable parameters for each module';
COMMENT ON TABLE admin_action_logs IS 'Comprehensive audit log for all admin actions';
COMMENT ON TABLE permission_definitions IS 'System-wide permission definitions';
COMMENT ON TABLE role_permissions IS 'Role-based permission assignments';
COMMENT ON TABLE custom_roles IS 'Organization-specific custom roles';

COMMENT ON FUNCTION get_config_value IS 'Retrieves configuration value with user/role override hierarchy';
COMMENT ON FUNCTION log_configuration_change IS 'Logs configuration changes for audit trail';
COMMENT ON FUNCTION has_admin_permission IS 'Checks if user has specific admin permission';
