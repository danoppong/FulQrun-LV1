-- =============================================================================
-- COMPLETE RBAC IMPLEMENTATION
-- This script applies the RBAC schema and seeds comprehensive permissions
-- =============================================================================

-- =============================================================================
-- RBAC SCHEMA CREATION
-- =============================================================================

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_key TEXT NOT NULL,
    role_name TEXT NOT NULL,
    description TEXT,
    inherits_from UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, role_key)
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL,
    permission_name TEXT NOT NULL,
    permission_category TEXT NOT NULL,
    description TEXT,
    module_name TEXT NOT NULL,
    is_system_permission BOOLEAN DEFAULT false,
    parent_permission_id UUID REFERENCES permissions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, permission_key)
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- Create rbac_settings table
CREATE TABLE IF NOT EXISTS rbac_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_roles_organization_id ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_role_key ON roles(organization_id, role_key);
CREATE INDEX IF NOT EXISTS idx_permissions_organization_id ON permissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_permissions_permission_key ON permissions(organization_id, permission_key);
CREATE INDEX IF NOT EXISTS idx_permissions_module_name ON permissions(module_name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_rbac_settings_organization_id ON rbac_settings(organization_id);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
    -- Roles policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'Users can view roles in their organization') THEN
        CREATE POLICY "Users can view roles in their organization" ON roles
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Permissions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'permissions' AND policyname = 'Users can view permissions in their organization') THEN
        CREATE POLICY "Users can view permissions in their organization" ON permissions
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Role permissions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'role_permissions' AND policyname = 'Users can view role permissions in their organization') THEN
        CREATE POLICY "Users can view role permissions in their organization" ON role_permissions
            FOR ALL USING (role_id IN (
                SELECT r.id FROM roles r WHERE r.organization_id = (
                    SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
                )
            ));
    END IF;

    -- RBAC settings policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rbac_settings' AND policyname = 'Users can view rbac settings in their organization') THEN
        CREATE POLICY "Users can view rbac settings in their organization" ON rbac_settings
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;
END $$;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
    -- Roles trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_roles_updated_at') THEN
        CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Permissions trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_permissions_updated_at') THEN
        CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- RBAC settings trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_rbac_settings_updated_at') THEN
        CREATE TRIGGER update_rbac_settings_updated_at BEFORE UPDATE ON rbac_settings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =============================================================================
-- RBAC FUNCTIONS
-- =============================================================================

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(
    p_user_id UUID,
    p_permission_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_organization_id UUID;
    v_user_role TEXT;
    v_has_permission BOOLEAN := false;
BEGIN
    -- Get user's organization and role
    SELECT organization_id, role INTO v_organization_id, v_user_role
    FROM users
    WHERE id = p_user_id;
    
    IF v_organization_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if user has the permission through their role
    SELECT EXISTS(
        SELECT 1
        FROM role_permissions rp
        JOIN roles r ON rp.role_id = r.id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE r.organization_id = v_organization_id
        AND r.role_key = v_user_role
        AND p.permission_key = p_permission_key
        AND r.is_active = true
        AND p.is_system_permission = true
    ) INTO v_has_permission;
    
    RETURN v_has_permission;
END;
$$;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (
    permission_key TEXT,
    permission_name TEXT,
    permission_category TEXT,
    module_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_role TEXT;
BEGIN
    -- Get user's role
    SELECT role INTO v_user_role
    FROM users
    WHERE id = p_user_id;
    
    RETURN QUERY
    SELECT DISTINCT
        p.permission_key,
        p.permission_name,
        p.permission_category,
        p.module_name
    FROM role_permissions rp
    JOIN roles r ON rp.role_id = r.id
    JOIN permissions p ON rp.permission_id = p.id
    JOIN users u ON u.id = p_user_id
    WHERE r.organization_id = u.organization_id
    AND r.role_key = v_user_role
    AND r.is_active = true
    AND p.is_system_permission = true;
END;
$$;

-- =============================================================================
-- COMPREHENSIVE PERMISSIONS SEEDING
-- =============================================================================

-- Function to seed comprehensive permissions for an organization
CREATE OR REPLACE FUNCTION seed_comprehensive_permissions_for_org(p_organization_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inserted_count INTEGER := 0;
    v_row_count INTEGER;
BEGIN
    -- =============================================================================
    -- DASHBOARD PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'dashboard.view', 'View Dashboard', 'Dashboard', 'Access to main dashboard', 'Dashboard', true),
        (p_organization_id, 'dashboard.analytics', 'View Analytics', 'Dashboard', 'Access to dashboard analytics', 'Dashboard', true),
        (p_organization_id, 'dashboard.customize', 'Customize Dashboard', 'Dashboard', 'Customize dashboard widgets', 'Dashboard', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- ACCOUNT MANAGEMENT PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'accounts.view', 'View Accounts', 'Account Management', 'View account information', 'Account Management', true),
        (p_organization_id, 'accounts.create', 'Create Accounts', 'Account Management', 'Create new accounts', 'Account Management', true),
        (p_organization_id, 'accounts.edit', 'Edit Accounts', 'Account Management', 'Edit account information', 'Account Management', true),
        (p_organization_id, 'accounts.delete', 'Delete Accounts', 'Account Management', 'Delete accounts', 'Account Management', true),
        (p_organization_id, 'accounts.export', 'Export Accounts', 'Account Management', 'Export account data', 'Account Management', false),
        (p_organization_id, 'accounts.import', 'Import Accounts', 'Account Management', 'Import account data', 'Account Management', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- LEAD MANAGEMENT PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'leads.view', 'View Leads', 'Lead Management', 'View lead information', 'Lead Management', true),
        (p_organization_id, 'leads.create', 'Create Leads', 'Lead Management', 'Create new leads', 'Lead Management', true),
        (p_organization_id, 'leads.edit', 'Edit Leads', 'Lead Management', 'Edit lead information', 'Lead Management', true),
        (p_organization_id, 'leads.delete', 'Delete Leads', 'Lead Management', 'Delete leads', 'Lead Management', true),
        (p_organization_id, 'leads.assign', 'Assign Leads', 'Lead Management', 'Assign leads to users', 'Lead Management', true),
        (p_organization_id, 'leads.qualify', 'Qualify Leads', 'Lead Management', 'Qualify/unqualify leads', 'Lead Management', true),
        (p_organization_id, 'leads.convert', 'Convert Leads', 'Lead Management', 'Convert leads to opportunities', 'Lead Management', true),
        (p_organization_id, 'leads.export', 'Export Leads', 'Lead Management', 'Export lead data', 'Lead Management', false),
        (p_organization_id, 'leads.import', 'Import Leads', 'Lead Management', 'Import lead data', 'Lead Management', false),
        (p_organization_id, 'leads.bulk_edit', 'Bulk Edit Leads', 'Lead Management', 'Bulk edit multiple leads', 'Lead Management', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- OPPORTUNITY MANAGEMENT PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'opportunities.view', 'View Opportunities', 'Opportunity Management', 'View opportunity information', 'Opportunity Management', true),
        (p_organization_id, 'opportunities.create', 'Create Opportunities', 'Opportunity Management', 'Create new opportunities', 'Opportunity Management', true),
        (p_organization_id, 'opportunities.edit', 'Edit Opportunities', 'Opportunity Management', 'Edit opportunity information', 'Opportunity Management', true),
        (p_organization_id, 'opportunities.delete', 'Delete Opportunities', 'Opportunity Management', 'Delete opportunities', 'Opportunity Management', true),
        (p_organization_id, 'opportunities.assign', 'Assign Opportunities', 'Opportunity Management', 'Assign opportunities to users', 'Opportunity Management', true),
        (p_organization_id, 'opportunities.close', 'Close Opportunities', 'Opportunity Management', 'Close won/lost opportunities', 'Opportunity Management', true),
        (p_organization_id, 'opportunities.forecast', 'Forecast Opportunities', 'Opportunity Management', 'Create and manage forecasts', 'Opportunity Management', true),
        (p_organization_id, 'opportunities.export', 'Export Opportunities', 'Opportunity Management', 'Export opportunity data', 'Opportunity Management', false),
        (p_organization_id, 'opportunities.import', 'Import Opportunities', 'Opportunity Management', 'Import opportunity data', 'Opportunity Management', false),
        (p_organization_id, 'opportunities.bulk_edit', 'Bulk Edit Opportunities', 'Opportunity Management', 'Bulk edit multiple opportunities', 'Opportunity Management', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- SALES PERFORMANCE PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'sales.view_performance', 'View Sales Performance', 'Sales Performance', 'View sales performance metrics', 'Sales Performance', true),
        (p_organization_id, 'sales.view_team_performance', 'View Team Performance', 'Sales Performance', 'View team performance metrics', 'Sales Performance', true),
        (p_organization_id, 'sales.view_individual_performance', 'View Individual Performance', 'Sales Performance', 'View individual performance metrics', 'Sales Performance', true),
        (p_organization_id, 'sales.manage_quotas', 'Manage Quotas', 'Sales Performance', 'Set and manage sales quotas', 'Sales Performance', true),
        (p_organization_id, 'sales.manage_targets', 'Manage Targets', 'Sales Performance', 'Set and manage sales targets', 'Sales Performance', true),
        (p_organization_id, 'sales.export_performance', 'Export Performance Data', 'Sales Performance', 'Export performance reports', 'Sales Performance', false),
        (p_organization_id, 'sales.import_performance', 'Import Performance Data', 'Sales Performance', 'Import performance data', 'Sales Performance', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- BUSINESS INTELLIGENCE PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'bi.view_reports', 'View BI Reports', 'Business Intelligence', 'View business intelligence reports', 'Business Intelligence', true),
        (p_organization_id, 'bi.create_reports', 'Create BI Reports', 'Business Intelligence', 'Create custom BI reports', 'Business Intelligence', true),
        (p_organization_id, 'bi.edit_reports', 'Edit BI Reports', 'Business Intelligence', 'Edit existing BI reports', 'Business Intelligence', true),
        (p_organization_id, 'bi.delete_reports', 'Delete BI Reports', 'Business Intelligence', 'Delete BI reports', 'Business Intelligence', true),
        (p_organization_id, 'bi.share_reports', 'Share BI Reports', 'Business Intelligence', 'Share reports with other users', 'Business Intelligence', true),
        (p_organization_id, 'bi.export_reports', 'Export BI Reports', 'Business Intelligence', 'Export reports to various formats', 'Business Intelligence', false),
        (p_organization_id, 'bi.schedule_reports', 'Schedule BI Reports', 'Business Intelligence', 'Schedule automated report generation', 'Business Intelligence', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- ENTERPRISE AI PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'ai.view_insights', 'View AI Insights', 'Enterprise AI', 'View AI-generated insights', 'Enterprise AI', true),
        (p_organization_id, 'ai.create_insights', 'Create AI Insights', 'Enterprise AI', 'Generate new AI insights', 'Enterprise AI', true),
        (p_organization_id, 'ai.manage_models', 'Manage AI Models', 'Enterprise AI', 'Manage AI model configurations', 'Enterprise AI', true),
        (p_organization_id, 'ai.train_models', 'Train AI Models', 'Enterprise AI', 'Train and retrain AI models', 'Enterprise AI', true),
        (p_organization_id, 'ai.export_insights', 'Export AI Insights', 'Enterprise AI', 'Export AI insights and data', 'Enterprise AI', false),
        (p_organization_id, 'ai.schedule_insights', 'Schedule AI Insights', 'Enterprise AI', 'Schedule automated AI insight generation', 'Enterprise AI', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- ENTERPRISE ANALYTICS PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'analytics.view_dashboard', 'View Analytics Dashboard', 'Enterprise Analytics', 'View analytics dashboard', 'Enterprise Analytics', true),
        (p_organization_id, 'analytics.create_dashboard', 'Create Analytics Dashboard', 'Enterprise Analytics', 'Create custom analytics dashboards', 'Enterprise Analytics', true),
        (p_organization_id, 'analytics.edit_dashboard', 'Edit Analytics Dashboard', 'Enterprise Analytics', 'Edit analytics dashboards', 'Enterprise Analytics', true),
        (p_organization_id, 'analytics.delete_dashboard', 'Delete Analytics Dashboard', 'Enterprise Analytics', 'Delete analytics dashboards', 'Enterprise Analytics', true),
        (p_organization_id, 'analytics.share_dashboard', 'Share Analytics Dashboard', 'Enterprise Analytics', 'Share analytics dashboards', 'Enterprise Analytics', true),
        (p_organization_id, 'analytics.export_dashboard', 'Export Analytics Dashboard', 'Enterprise Analytics', 'Export analytics dashboards', 'Enterprise Analytics', false),
        (p_organization_id, 'analytics.schedule_dashboard', 'Schedule Analytics Dashboard', 'Enterprise Analytics', 'Schedule automated dashboard updates', 'Enterprise Analytics', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- INTEGRATIONS PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'integrations.view', 'View Integrations', 'Integrations', 'View integration configurations', 'Integrations', true),
        (p_organization_id, 'integrations.create', 'Create Integrations', 'Integrations', 'Create new integrations', 'Integrations', true),
        (p_organization_id, 'integrations.edit', 'Edit Integrations', 'Integrations', 'Edit integration configurations', 'Integrations', true),
        (p_organization_id, 'integrations.delete', 'Delete Integrations', 'Integrations', 'Delete integrations', 'Integrations', true),
        (p_organization_id, 'integrations.test', 'Test Integrations', 'Integrations', 'Test integration connections', 'Integrations', true),
        (p_organization_id, 'integrations.sync', 'Sync Integrations', 'Integrations', 'Manually trigger integration sync', 'Integrations', false),
        (p_organization_id, 'integrations.logs', 'View Integration Logs', 'Integrations', 'View integration logs and errors', 'Integrations', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- ENTERPRISE SECURITY PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'security.view_settings', 'View Security Settings', 'Enterprise Security', 'View security configurations', 'Enterprise Security', true),
        (p_organization_id, 'security.edit_settings', 'Edit Security Settings', 'Enterprise Security', 'Edit security configurations', 'Enterprise Security', true),
        (p_organization_id, 'security.manage_users', 'Manage Security Users', 'Enterprise Security', 'Manage user security settings', 'Enterprise Security', true),
        (p_organization_id, 'security.view_audit_logs', 'View Audit Logs', 'Enterprise Security', 'View security audit logs', 'Enterprise Security', true),
        (p_organization_id, 'security.manage_permissions', 'Manage Security Permissions', 'Enterprise Security', 'Manage security permissions', 'Enterprise Security', true),
        (p_organization_id, 'security.export_logs', 'Export Security Logs', 'Enterprise Security', 'Export security audit logs', 'Enterprise Security', false),
        (p_organization_id, 'security.schedule_reports', 'Schedule Security Reports', 'Enterprise Security', 'Schedule automated security reports', 'Enterprise Security', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- ENTERPRISE WORKFLOWS PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'workflows.view', 'View Workflows', 'Enterprise Workflows', 'View workflow configurations', 'Enterprise Workflows', true),
        (p_organization_id, 'workflows.create', 'Create Workflows', 'Enterprise Workflows', 'Create new workflows', 'Enterprise Workflows', true),
        (p_organization_id, 'workflows.edit', 'Edit Workflows', 'Enterprise Workflows', 'Edit workflow configurations', 'Enterprise Workflows', true),
        (p_organization_id, 'workflows.delete', 'Delete Workflows', 'Enterprise Workflows', 'Delete workflows', 'Enterprise Workflows', true),
        (p_organization_id, 'workflows.execute', 'Execute Workflows', 'Enterprise Workflows', 'Execute workflow instances', 'Enterprise Workflows', true),
        (p_organization_id, 'workflows.monitor', 'Monitor Workflows', 'Enterprise Workflows', 'Monitor workflow execution', 'Enterprise Workflows', true),
        (p_organization_id, 'workflows.export', 'Export Workflows', 'Enterprise Workflows', 'Export workflow configurations', 'Enterprise Workflows', false),
        (p_organization_id, 'workflows.import', 'Import Workflows', 'Enterprise Workflows', 'Import workflow configurations', 'Enterprise Workflows', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- MOBILE APP PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'mobile.view_app', 'View Mobile App', 'Mobile App', 'Access mobile application', 'Mobile App', true),
        (p_organization_id, 'mobile.sync_data', 'Sync Mobile Data', 'Mobile App', 'Sync data with mobile app', 'Mobile App', true),
        (p_organization_id, 'mobile.offline_access', 'Offline Access', 'Mobile App', 'Access offline functionality', 'Mobile App', true),
        (p_organization_id, 'mobile.push_notifications', 'Push Notifications', 'Mobile App', 'Receive push notifications', 'Mobile App', true),
        (p_organization_id, 'mobile.location_tracking', 'Location Tracking', 'Mobile App', 'Use location tracking features', 'Mobile App', false),
        (p_organization_id, 'mobile.camera_access', 'Camera Access', 'Mobile App', 'Use camera features', 'Mobile App', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- LEARNING PLATFORM PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'learning.view_courses', 'View Courses', 'Learning Platform', 'View available courses', 'Learning Platform', true),
        (p_organization_id, 'learning.take_courses', 'Take Courses', 'Learning Platform', 'Enroll and take courses', 'Learning Platform', true),
        (p_organization_id, 'learning.create_courses', 'Create Courses', 'Learning Platform', 'Create new courses', 'Learning Platform', true),
        (p_organization_id, 'learning.edit_courses', 'Edit Courses', 'Learning Platform', 'Edit existing courses', 'Learning Platform', true),
        (p_organization_id, 'learning.delete_courses', 'Delete Courses', 'Learning Platform', 'Delete courses', 'Learning Platform', true),
        (p_organization_id, 'learning.manage_enrollments', 'Manage Enrollments', 'Learning Platform', 'Manage course enrollments', 'Learning Platform', true),
        (p_organization_id, 'learning.view_progress', 'View Progress', 'Learning Platform', 'View learning progress', 'Learning Platform', true),
        (p_organization_id, 'learning.export_progress', 'Export Progress', 'Learning Platform', 'Export learning progress', 'Learning Platform', false),
        (p_organization_id, 'learning.certificates', 'Manage Certificates', 'Learning Platform', 'Manage course certificates', 'Learning Platform', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- ADMINISTRATION PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'admin.view_dashboard', 'View Admin Dashboard', 'Administration', 'View administration dashboard', 'Administration', true),
        (p_organization_id, 'admin.manage_users', 'Manage Users', 'Administration', 'Manage user accounts and permissions', 'Administration', true),
        (p_organization_id, 'admin.manage_roles', 'Manage Roles', 'Administration', 'Manage user roles and permissions', 'Administration', true),
        (p_organization_id, 'admin.manage_organization', 'Manage Organization', 'Administration', 'Manage organization settings', 'Administration', true),
        (p_organization_id, 'admin.manage_modules', 'Manage Modules', 'Administration', 'Manage module configurations', 'Administration', true),
        (p_organization_id, 'admin.view_system_logs', 'View System Logs', 'Administration', 'View system logs and errors', 'Administration', true),
        (p_organization_id, 'admin.manage_integrations', 'Manage Integrations', 'Administration', 'Manage system integrations', 'Administration', true),
        (p_organization_id, 'admin.export_data', 'Export System Data', 'Administration', 'Export system data', 'Administration', false),
        (p_organization_id, 'admin.import_data', 'Import System Data', 'Administration', 'Import system data', 'Administration', false),
        (p_organization_id, 'admin.system_maintenance', 'System Maintenance', 'Administration', 'Perform system maintenance tasks', 'Administration', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- SYSTEM PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'system.view_status', 'View System Status', 'System', 'View system status and health', 'System', true),
        (p_organization_id, 'system.manage_backups', 'Manage Backups', 'System', 'Manage system backups', 'System', true),
        (p_organization_id, 'system.manage_updates', 'Manage Updates', 'System', 'Manage system updates', 'System', true),
        (p_organization_id, 'system.view_metrics', 'View System Metrics', 'System', 'View system performance metrics', 'System', true),
        (p_organization_id, 'system.manage_config', 'Manage System Config', 'System', 'Manage system configuration', 'System', true),
        (p_organization_id, 'system.restart_services', 'Restart Services', 'System', 'Restart system services', 'System', false),
        (p_organization_id, 'system.view_logs', 'View System Logs', 'System', 'View system logs', 'System', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    RETURN v_inserted_count;
END;
$$;

-- Function to create default roles for an organization
CREATE OR REPLACE FUNCTION create_default_roles_for_org(p_organization_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inserted_count INTEGER := 0;
    v_row_count INTEGER;
    v_rep_role_id UUID;
    v_manager_role_id UUID;
    v_admin_role_id UUID;
    v_super_admin_role_id UUID;
BEGIN
    -- Create Rep role
    INSERT INTO roles (organization_id, role_key, role_name, description, is_active, is_system_role)
    VALUES (p_organization_id, 'rep', 'Rep', 'Basic sales representative role', true, true)
    ON CONFLICT (organization_id, role_key) DO NOTHING
    RETURNING id INTO v_rep_role_id;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- Create Manager role
    INSERT INTO roles (organization_id, role_key, role_name, description, is_active, is_system_role)
    VALUES (p_organization_id, 'manager', 'Manager', 'Sales manager role with team oversight', true, true)
    ON CONFLICT (organization_id, role_key) DO NOTHING
    RETURNING id INTO v_manager_role_id;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- Create Admin role
    INSERT INTO roles (organization_id, role_key, role_name, description, is_active, is_system_role)
    VALUES (p_organization_id, 'admin', 'Admin', 'Administrator role with full access', true, true)
    ON CONFLICT (organization_id, role_key) DO NOTHING
    RETURNING id INTO v_admin_role_id;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- Create Super Admin role
    INSERT INTO roles (organization_id, role_key, role_name, description, is_active, is_system_role)
    VALUES (p_organization_id, 'super_admin', 'Super Admin', 'Super administrator with system-wide access', true, true)
    ON CONFLICT (organization_id, role_key) DO NOTHING
    RETURNING id INTO v_super_admin_role_id;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- Get role IDs if they weren't returned (already existed)
    IF v_rep_role_id IS NULL THEN
        SELECT id INTO v_rep_role_id FROM roles WHERE organization_id = p_organization_id AND role_key = 'rep';
    END IF;
    
    IF v_manager_role_id IS NULL THEN
        SELECT id INTO v_manager_role_id FROM roles WHERE organization_id = p_organization_id AND role_key = 'manager';
    END IF;
    
    IF v_admin_role_id IS NULL THEN
        SELECT id INTO v_admin_role_id FROM roles WHERE organization_id = p_organization_id AND role_key = 'admin';
    END IF;
    
    IF v_super_admin_role_id IS NULL THEN
        SELECT id INTO v_super_admin_role_id FROM roles WHERE organization_id = p_organization_id AND role_key = 'super_admin';
    END IF;

    -- Assign permissions to Rep role
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_rep_role_id, p.id
    FROM permissions p
    WHERE p.organization_id = p_organization_id
    AND p.permission_key IN (
        'dashboard.view',
        'leads.view', 'leads.create', 'leads.edit', 'leads.assign', 'leads.qualify', 'leads.convert',
        'opportunities.view', 'opportunities.create', 'opportunities.edit', 'opportunities.assign', 'opportunities.close',
        'sales.view_individual_performance',
        'mobile.view_app', 'mobile.sync_data', 'mobile.offline_access', 'mobile.push_notifications',
        'learning.view_courses', 'learning.take_courses', 'learning.view_progress'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Assign permissions to Manager role (includes all Rep permissions plus team management)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_manager_role_id, p.id
    FROM permissions p
    WHERE p.organization_id = p_organization_id
    AND p.permission_key IN (
        'dashboard.view', 'dashboard.analytics',
        'leads.view', 'leads.create', 'leads.edit', 'leads.delete', 'leads.assign', 'leads.qualify', 'leads.convert', 'leads.export', 'leads.bulk_edit',
        'opportunities.view', 'opportunities.create', 'opportunities.edit', 'opportunities.delete', 'opportunities.assign', 'opportunities.close', 'opportunities.forecast', 'opportunities.export', 'opportunities.bulk_edit',
        'sales.view_performance', 'sales.view_team_performance', 'sales.view_individual_performance', 'sales.manage_quotas', 'sales.manage_targets', 'sales.export_performance',
        'bi.view_reports', 'bi.create_reports', 'bi.edit_reports', 'bi.share_reports',
        'mobile.view_app', 'mobile.sync_data', 'mobile.offline_access', 'mobile.push_notifications',
        'learning.view_courses', 'learning.take_courses', 'learning.create_courses', 'learning.edit_courses', 'learning.manage_enrollments', 'learning.view_progress'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Assign permissions to Admin role (includes all Manager permissions plus administration)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_admin_role_id, p.id
    FROM permissions p
    WHERE p.organization_id = p_organization_id
    AND p.permission_key IN (
        'dashboard.view', 'dashboard.analytics', 'dashboard.customize',
        'accounts.view', 'accounts.create', 'accounts.edit', 'accounts.delete', 'accounts.export', 'accounts.import',
        'leads.view', 'leads.create', 'leads.edit', 'leads.delete', 'leads.assign', 'leads.qualify', 'leads.convert', 'leads.export', 'leads.import', 'leads.bulk_edit',
        'opportunities.view', 'opportunities.create', 'opportunities.edit', 'opportunities.delete', 'opportunities.assign', 'opportunities.close', 'opportunities.forecast', 'opportunities.export', 'opportunities.import', 'opportunities.bulk_edit',
        'sales.view_performance', 'sales.view_team_performance', 'sales.view_individual_performance', 'sales.manage_quotas', 'sales.manage_targets', 'sales.export_performance', 'sales.import_performance',
        'bi.view_reports', 'bi.create_reports', 'bi.edit_reports', 'bi.delete_reports', 'bi.share_reports', 'bi.export_reports', 'bi.schedule_reports',
        'ai.view_insights', 'ai.create_insights', 'ai.export_insights', 'ai.schedule_insights',
        'analytics.view_dashboard', 'analytics.create_dashboard', 'analytics.edit_dashboard', 'analytics.share_dashboard', 'analytics.export_dashboard', 'analytics.schedule_dashboard',
        'integrations.view', 'integrations.create', 'integrations.edit', 'integrations.delete', 'integrations.test', 'integrations.sync', 'integrations.logs',
        'security.view_settings', 'security.edit_settings', 'security.manage_users', 'security.view_audit_logs', 'security.manage_permissions', 'security.export_logs', 'security.schedule_reports',
        'workflows.view', 'workflows.create', 'workflows.edit', 'workflows.delete', 'workflows.execute', 'workflows.monitor', 'workflows.export', 'workflows.import',
        'mobile.view_app', 'mobile.sync_data', 'mobile.offline_access', 'mobile.push_notifications', 'mobile.location_tracking', 'mobile.camera_access',
        'learning.view_courses', 'learning.take_courses', 'learning.create_courses', 'learning.edit_courses', 'learning.delete_courses', 'learning.manage_enrollments', 'learning.view_progress', 'learning.export_progress', 'learning.certificates',
        'admin.view_dashboard', 'admin.manage_users', 'admin.manage_roles', 'admin.manage_organization', 'admin.manage_modules', 'admin.view_system_logs', 'admin.manage_integrations', 'admin.export_data', 'admin.import_data',
        'system.view_status', 'system.manage_backups', 'system.manage_updates', 'system.view_metrics', 'system.manage_config', 'system.view_logs'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Assign ALL permissions to Super Admin role
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_super_admin_role_id, p.id
    FROM permissions p
    WHERE p.organization_id = p_organization_id
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    RETURN v_inserted_count;
END;
$$;

-- =============================================================================
-- SEED DATA FOR EXISTING ORGANIZATIONS
-- =============================================================================

-- Seed permissions and roles for all existing organizations
DO $$
DECLARE
    org_record RECORD;
    permissions_count INTEGER;
    roles_count INTEGER;
BEGIN
    FOR org_record IN SELECT id, name FROM organizations LOOP
        RAISE NOTICE 'Seeding RBAC for organization: % (%)', org_record.name, org_record.id;
        
        -- Seed permissions
        SELECT seed_comprehensive_permissions_for_org(org_record.id) INTO permissions_count;
        RAISE NOTICE '  - Inserted % permissions', permissions_count;
        
        -- Create default roles
        SELECT create_default_roles_for_org(org_record.id) INTO roles_count;
        RAISE NOTICE '  - Created % roles', roles_count;
    END LOOP;
END $$;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RBAC implementation completed successfully!';
    RAISE NOTICE '📊 Tables created: roles, permissions, role_permissions, rbac_settings';
    RAISE NOTICE '🔧 Functions created: has_permission, get_user_permissions, seed_comprehensive_permissions_for_org, create_default_roles_for_org';
    RAISE NOTICE '🛡️ RLS policies and triggers configured';
    RAISE NOTICE '🌱 Permissions and roles seeded for all organizations';
END $$;
