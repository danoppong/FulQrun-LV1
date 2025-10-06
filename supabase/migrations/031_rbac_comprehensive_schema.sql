-- =============================================================================
-- COMPREHENSIVE RBAC SCHEMA FOR ROLES AND PERMISSIONS
-- =============================================================================

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key TEXT NOT NULL UNIQUE,
  role_name TEXT NOT NULL,
  description TEXT,
  inherits_from TEXT REFERENCES roles(role_key),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key TEXT NOT NULL UNIQUE,
  permission_name TEXT NOT NULL,
  permission_category TEXT NOT NULL,
  description TEXT,
  module_name TEXT NOT NULL,
  is_system_permission BOOLEAN NOT NULL DEFAULT true,
  parent_permission_id UUID REFERENCES permissions(id),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES users(id),
  UNIQUE(role_id, permission_id)
);

-- Create user_roles table (extends existing users table)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, role_id)
);

-- Create rbac_settings table
CREATE TABLE IF NOT EXISTS rbac_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  enable_rbac BOOLEAN NOT NULL DEFAULT true,
  strict_mode BOOLEAN NOT NULL DEFAULT false,
  audit_logging BOOLEAN NOT NULL DEFAULT true,
  session_timeout_minutes INTEGER NOT NULL DEFAULT 30,
  max_failed_attempts INTEGER NOT NULL DEFAULT 5,
  lockout_duration_minutes INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Create rbac_policies table
CREATE TABLE IF NOT EXISTS rbac_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL,
  description TEXT,
  roles TEXT[] NOT NULL,
  permissions TEXT[] NOT NULL,
  conditions JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Create rbac_audit_log table
CREATE TABLE IF NOT EXISTS rbac_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  permission_key TEXT,
  result TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Roles indexes
CREATE INDEX IF NOT EXISTS idx_roles_organization_id ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_role_key ON roles(role_key);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);

-- Permissions indexes
CREATE INDEX IF NOT EXISTS idx_permissions_organization_id ON permissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_permissions_permission_key ON permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_permissions_module_name ON permissions(module_name);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(permission_category);

-- Role permissions indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active);

-- RBAC settings indexes
CREATE INDEX IF NOT EXISTS idx_rbac_settings_organization_id ON rbac_settings(organization_id);

-- RBAC policies indexes
CREATE INDEX IF NOT EXISTS idx_rbac_policies_organization_id ON rbac_policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_rbac_policies_is_active ON rbac_policies(is_active);

-- RBAC audit log indexes
CREATE INDEX IF NOT EXISTS idx_rbac_audit_log_user_id ON rbac_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_log_organization_id ON rbac_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_log_created_at ON rbac_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_log_action ON rbac_audit_log(action);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_audit_log ENABLE ROW LEVEL SECURITY;

-- Roles policies
CREATE POLICY "Users can view roles in their organization" ON roles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage roles in their organization" ON roles
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Permissions policies
CREATE POLICY "Users can view permissions in their organization" ON permissions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage permissions in their organization" ON permissions
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Role permissions policies
CREATE POLICY "Users can view role permissions in their organization" ON role_permissions
  FOR SELECT USING (
    role_id IN (
      SELECT id FROM roles WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage role permissions in their organization" ON role_permissions
  FOR ALL USING (
    role_id IN (
      SELECT id FROM roles WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
      )
    )
  );

-- User roles policies
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (
    user_id = auth.uid() OR
    user_id IN (
      SELECT id FROM users WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
      )
    )
  );

CREATE POLICY "Admins can manage user roles in their organization" ON user_roles
  FOR ALL USING (
    user_id IN (
      SELECT id FROM users WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
      )
    )
  );

-- RBAC settings policies
CREATE POLICY "Admins can view RBAC settings in their organization" ON rbac_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage RBAC settings in their organization" ON rbac_settings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- RBAC policies policies
CREATE POLICY "Users can view RBAC policies in their organization" ON rbac_policies
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage RBAC policies in their organization" ON rbac_policies
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- RBAC audit log policies
CREATE POLICY "Admins can view audit logs in their organization" ON rbac_audit_log
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rbac_settings_updated_at BEFORE UPDATE ON rbac_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rbac_policies_updated_at BEFORE UPDATE ON rbac_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMPREHENSIVE PERMISSION SEEDING FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION seed_comprehensive_permissions(p_organization_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted_count INTEGER := 0;
  v_row_count INTEGER;
BEGIN
  -- Organization Management Permissions
  INSERT INTO permissions (permission_key, permission_name, permission_category, description, module_name, organization_id) VALUES
  ('admin.organization.view', 'View Organization Settings', 'Organization Management', 'View organization settings and configuration', 'admin', p_organization_id),
  ('admin.organization.edit', 'Edit Organization Settings', 'Organization Management', 'Edit organization settings and configuration', 'admin', p_organization_id),
  ('admin.organization.delete', 'Delete Organization', 'Organization Management', 'Delete organization and all data', 'admin', p_organization_id),
  ('admin.organization.billing.view', 'View Billing Information', 'Organization Management', 'View billing and subscription details', 'admin', p_organization_id),
  ('admin.organization.billing.edit', 'Manage Billing', 'Organization Management', 'Manage billing and subscription settings', 'admin', p_organization_id),
  ('admin.organization.features.view', 'View Feature Toggles', 'Organization Management', 'View module feature toggles', 'admin', p_organization_id),
  ('admin.organization.features.edit', 'Manage Feature Toggles', 'Organization Management', 'Enable/disable module features', 'admin', p_organization_id),
  ('admin.organization.compliance.view', 'View Compliance Settings', 'Organization Management', 'View compliance and regulatory settings', 'admin', p_organization_id),
  ('admin.organization.compliance.edit', 'Manage Compliance Settings', 'Organization Management', 'Configure compliance and regulatory settings', 'admin', p_organization_id),
  ('admin.organization.branding.view', 'View Branding Settings', 'Organization Management', 'View organization branding and customization', 'admin', p_organization_id),
  ('admin.organization.branding.edit', 'Manage Branding Settings', 'Organization Management', 'Configure organization branding and customization', 'admin', p_organization_id)
  ON CONFLICT (permission_key) DO NOTHING;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;

  -- User Management Permissions
  INSERT INTO permissions (permission_key, permission_name, permission_category, description, module_name, organization_id) VALUES
  ('admin.users.view', 'View Users', 'User Management', 'View user list and details', 'admin', p_organization_id),
  ('admin.users.create', 'Create Users', 'User Management', 'Create new user accounts', 'admin', p_organization_id),
  ('admin.users.edit', 'Edit Users', 'User Management', 'Edit user information and settings', 'admin', p_organization_id),
  ('admin.users.delete', 'Delete Users', 'User Management', 'Delete user accounts', 'admin', p_organization_id),
  ('admin.users.activate', 'Activate/Deactivate Users', 'User Management', 'Activate or deactivate user accounts', 'admin', p_organization_id),
  ('admin.users.reset_password', 'Reset User Passwords', 'User Management', 'Reset user passwords', 'admin', p_organization_id),
  ('admin.users.enterprise_roles.view', 'View Enterprise Roles', 'User Management', 'View enterprise role assignments', 'admin', p_organization_id),
  ('admin.users.enterprise_roles.grant', 'Grant Enterprise Roles', 'User Management', 'Grant enterprise roles to users', 'admin', p_organization_id),
  ('admin.users.enterprise_roles.revoke', 'Revoke Enterprise Roles', 'User Management', 'Revoke enterprise roles from users', 'admin', p_organization_id),
  ('admin.users.teams.view', 'View Teams', 'User Management', 'View team structures and memberships', 'admin', p_organization_id),
  ('admin.users.teams.manage', 'Manage Teams', 'User Management', 'Create and manage team structures', 'admin', p_organization_id)
  ON CONFLICT (permission_key) DO NOTHING;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;

  -- Role Management Permissions
  INSERT INTO permissions (permission_key, permission_name, permission_category, description, module_name, organization_id) VALUES
  ('admin.roles.view', 'View Roles', 'Role Management', 'View roles and their permissions', 'admin', p_organization_id),
  ('admin.roles.create', 'Create Roles', 'Role Management', 'Create new custom roles', 'admin', p_organization_id),
  ('admin.roles.edit', 'Edit Roles', 'Role Management', 'Edit role properties and permissions', 'admin', p_organization_id),
  ('admin.roles.delete', 'Delete Roles', 'Role Management', 'Delete custom roles', 'admin', p_organization_id),
  ('admin.permissions.view', 'View Permissions', 'Role Management', 'View available permissions', 'admin', p_organization_id),
  ('admin.permissions.create', 'Create Permissions', 'Role Management', 'Create new custom permissions', 'admin', p_organization_id),
  ('admin.permissions.edit', 'Edit Permissions', 'Role Management', 'Edit permission properties', 'admin', p_organization_id),
  ('admin.permissions.delete', 'Delete Permissions', 'Role Management', 'Delete custom permissions', 'admin', p_organization_id),
  ('admin.rbac.view', 'View RBAC Configuration', 'Role Management', 'View RBAC settings and policies', 'admin', p_organization_id),
  ('admin.rbac.edit', 'Manage RBAC Configuration', 'Role Management', 'Configure RBAC settings and policies', 'admin', p_organization_id)
  ON CONFLICT (permission_key) DO NOTHING;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;

  -- Module Configuration Permissions
  INSERT INTO permissions (permission_key, permission_name, permission_category, description, module_name, organization_id) VALUES
  ('admin.modules.view', 'View Module Configuration', 'Module Configuration', 'View module settings and configuration', 'admin', p_organization_id),
  ('admin.modules.edit', 'Edit Module Configuration', 'Module Configuration', 'Configure module settings', 'admin', p_organization_id),
  ('admin.modules.crm.view', 'View CRM Configuration', 'Module Configuration', 'View CRM module settings', 'crm', p_organization_id),
  ('admin.modules.crm.edit', 'Edit CRM Configuration', 'Module Configuration', 'Configure CRM module settings', 'crm', p_organization_id),
  ('admin.modules.sales.view', 'View Sales Configuration', 'Module Configuration', 'View sales module settings', 'sales', p_organization_id),
  ('admin.modules.sales.edit', 'Edit Sales Configuration', 'Module Configuration', 'Configure sales module settings', 'sales', p_organization_id),
  ('admin.modules.marketing.view', 'View Marketing Configuration', 'Module Configuration', 'View marketing module settings', 'marketing', p_organization_id),
  ('admin.modules.marketing.edit', 'Edit Marketing Configuration', 'Module Configuration', 'Configure marketing module settings', 'marketing', p_organization_id),
  ('admin.modules.analytics.view', 'View Analytics Configuration', 'Module Configuration', 'View analytics module settings', 'analytics', p_organization_id),
  ('admin.modules.analytics.edit', 'Edit Analytics Configuration', 'Module Configuration', 'Configure analytics module settings', 'analytics', p_organization_id)
  ON CONFLICT (permission_key) DO NOTHING;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;

  -- Security Management Permissions
  INSERT INTO permissions (permission_key, permission_name, permission_category, description, module_name, organization_id) VALUES
  ('admin.security.view', 'View Security Settings', 'Security Management', 'View security configuration', 'admin', p_organization_id),
  ('admin.security.edit', 'Edit Security Settings', 'Security Management', 'Configure security settings', 'admin', p_organization_id),
  ('admin.security.authentication.view', 'View Authentication Settings', 'Security Management', 'View authentication configuration', 'admin', p_organization_id),
  ('admin.security.authentication.edit', 'Edit Authentication Settings', 'Security Management', 'Configure authentication settings', 'admin', p_organization_id),
  ('admin.security.mfa.view', 'View MFA Settings', 'Security Management', 'View multi-factor authentication settings', 'admin', p_organization_id),
  ('admin.security.mfa.edit', 'Edit MFA Settings', 'Security Management', 'Configure multi-factor authentication', 'admin', p_organization_id),
  ('admin.security.sessions.view', 'View Active Sessions', 'Security Management', 'View user active sessions', 'admin', p_organization_id),
  ('admin.security.sessions.manage', 'Manage Sessions', 'Security Management', 'Terminate user sessions', 'admin', p_organization_id),
  ('admin.security.audit.view', 'View Security Audit Logs', 'Security Management', 'View security-related audit logs', 'admin', p_organization_id)
  ON CONFLICT (permission_key) DO NOTHING;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;

  -- System Administration Permissions
  INSERT INTO permissions (permission_key, permission_name, permission_category, description, module_name, organization_id) VALUES
  ('admin.system.view', 'View System Information', 'System Administration', 'View system status and information', 'admin', p_organization_id),
  ('admin.system.database.view', 'View Database Status', 'System Administration', 'View database status and metrics', 'admin', p_organization_id),
  ('admin.system.database.manage', 'Manage Database', 'System Administration', 'Perform database maintenance tasks', 'admin', p_organization_id),
  ('admin.system.backups.view', 'View Backup Status', 'System Administration', 'View backup status and history', 'admin', p_organization_id),
  ('admin.system.backups.manage', 'Manage Backups', 'System Administration', 'Create and restore backups', 'admin', p_organization_id),
  ('admin.system.logs.view', 'View System Logs', 'System Administration', 'View system and application logs', 'admin', p_organization_id),
  ('admin.system.maintenance.view', 'View Maintenance Mode', 'System Administration', 'View maintenance mode status', 'admin', p_organization_id),
  ('admin.system.maintenance.manage', 'Manage Maintenance Mode', 'System Administration', 'Enable/disable maintenance mode', 'admin', p_organization_id)
  ON CONFLICT (permission_key) DO NOTHING;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;

  -- Audit & Compliance Permissions
  INSERT INTO permissions (permission_key, permission_name, permission_category, description, module_name, organization_id) VALUES
  ('admin.audit.view', 'View Audit Logs', 'Audit & Compliance', 'View system audit logs', 'admin', p_organization_id),
  ('admin.audit.export', 'Export Audit Logs', 'Audit & Compliance', 'Export audit logs for compliance', 'admin', p_organization_id),
  ('admin.compliance.view', 'View Compliance Reports', 'Audit & Compliance', 'View compliance reports and status', 'admin', p_organization_id),
  ('admin.compliance.manage', 'Manage Compliance', 'Audit & Compliance', 'Configure compliance settings', 'admin', p_organization_id),
  ('admin.data_privacy.view', 'View Data Privacy Settings', 'Audit & Compliance', 'View data privacy and GDPR settings', 'admin', p_organization_id),
  ('admin.data_privacy.manage', 'Manage Data Privacy', 'Audit & Compliance', 'Configure data privacy settings', 'admin', p_organization_id)
  ON CONFLICT (permission_key) DO NOTHING;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;

  -- CRM Module Permissions
  INSERT INTO permissions (permission_key, permission_name, permission_category, description, module_name, organization_id) VALUES
  ('crm.leads.view', 'View Leads', 'CRM Management', 'View leads and prospects', 'crm', p_organization_id),
  ('crm.leads.create', 'Create Leads', 'CRM Management', 'Create new leads', 'crm', p_organization_id),
  ('crm.leads.edit', 'Edit Leads', 'CRM Management', 'Edit lead information', 'crm', p_organization_id),
  ('crm.leads.delete', 'Delete Leads', 'CRM Management', 'Delete leads', 'crm', p_organization_id),
  ('crm.contacts.view', 'View Contacts', 'CRM Management', 'View contacts and customer information', 'crm', p_organization_id),
  ('crm.contacts.create', 'Create Contacts', 'CRM Management', 'Create new contacts', 'crm', p_organization_id),
  ('crm.contacts.edit', 'Edit Contacts', 'CRM Management', 'Edit contact information', 'crm', p_organization_id),
  ('crm.contacts.delete', 'Delete Contacts', 'CRM Management', 'Delete contacts', 'crm', p_organization_id),
  ('crm.opportunities.view', 'View Opportunities', 'CRM Management', 'View sales opportunities', 'crm', p_organization_id),
  ('crm.opportunities.create', 'Create Opportunities', 'CRM Management', 'Create new opportunities', 'crm', p_organization_id),
  ('crm.opportunities.edit', 'Edit Opportunities', 'CRM Management', 'Edit opportunity information', 'crm', p_organization_id),
  ('crm.opportunities.delete', 'Delete Opportunities', 'CRM Management', 'Delete opportunities', 'crm', p_organization_id),
  ('crm.accounts.view', 'View Accounts', 'CRM Management', 'View customer accounts', 'crm', p_organization_id),
  ('crm.accounts.create', 'Create Accounts', 'CRM Management', 'Create new accounts', 'crm', p_organization_id),
  ('crm.accounts.edit', 'Edit Accounts', 'CRM Management', 'Edit account information', 'crm', p_organization_id),
  ('crm.accounts.delete', 'Delete Accounts', 'CRM Management', 'Delete accounts', 'crm', p_organization_id)
  ON CONFLICT (permission_key) DO NOTHING;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;

  -- Sales Module Permissions
  INSERT INTO permissions (permission_key, permission_name, permission_category, description, module_name, organization_id) VALUES
  ('sales.pipeline.view', 'View Sales Pipeline', 'Sales Management', 'View sales pipeline and stages', 'sales', p_organization_id),
  ('sales.pipeline.edit', 'Edit Sales Pipeline', 'Sales Management', 'Edit pipeline stages and configuration', 'sales', p_organization_id),
  ('sales.forecasting.view', 'View Sales Forecasts', 'Sales Management', 'View sales forecasts and projections', 'sales', p_organization_id),
  ('sales.forecasting.edit', 'Edit Sales Forecasts', 'Sales Management', 'Create and edit sales forecasts', 'sales', p_organization_id),
  ('sales.reports.view', 'View Sales Reports', 'Sales Management', 'View sales reports and analytics', 'sales', p_organization_id),
  ('sales.reports.export', 'Export Sales Reports', 'Sales Management', 'Export sales reports', 'sales', p_organization_id),
  ('sales.quotes.view', 'View Quotes', 'Sales Management', 'View sales quotes', 'sales', p_organization_id),
  ('sales.quotes.create', 'Create Quotes', 'Sales Management', 'Create new sales quotes', 'sales', p_organization_id),
  ('sales.quotes.edit', 'Edit Quotes', 'Sales Management', 'Edit sales quotes', 'sales', p_organization_id),
  ('sales.quotes.delete', 'Delete Quotes', 'Sales Management', 'Delete sales quotes', 'sales', p_organization_id)
  ON CONFLICT (permission_key) DO NOTHING;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;

  -- Marketing Module Permissions
  INSERT INTO permissions (permission_key, permission_name, permission_category, description, module_name, organization_id) VALUES
  ('marketing.campaigns.view', 'View Marketing Campaigns', 'Marketing Management', 'View marketing campaigns', 'marketing', p_organization_id),
  ('marketing.campaigns.create', 'Create Marketing Campaigns', 'Marketing Management', 'Create new marketing campaigns', 'marketing', p_organization_id),
  ('marketing.campaigns.edit', 'Edit Marketing Campaigns', 'Marketing Management', 'Edit marketing campaigns', 'marketing', p_organization_id),
  ('marketing.campaigns.delete', 'Delete Marketing Campaigns', 'Marketing Management', 'Delete marketing campaigns', 'marketing', p_organization_id),
  ('marketing.email.view', 'View Email Marketing', 'Marketing Management', 'View email marketing campaigns', 'marketing', p_organization_id),
  ('marketing.email.create', 'Create Email Campaigns', 'Marketing Management', 'Create email marketing campaigns', 'marketing', p_organization_id),
  ('marketing.email.edit', 'Edit Email Campaigns', 'Marketing Management', 'Edit email marketing campaigns', 'marketing', p_organization_id),
  ('marketing.email.delete', 'Delete Email Campaigns', 'Marketing Management', 'Delete email marketing campaigns', 'marketing', p_organization_id),
  ('marketing.analytics.view', 'View Marketing Analytics', 'Marketing Management', 'View marketing analytics and metrics', 'marketing', p_organization_id)
  ON CONFLICT (permission_key) DO NOTHING;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;

  -- Analytics Module Permissions
  INSERT INTO permissions (permission_key, permission_name, permission_category, description, module_name, organization_id) VALUES
  ('analytics.dashboard.view', 'View Analytics Dashboard', 'Analytics Management', 'View analytics dashboard', 'analytics', p_organization_id),
  ('analytics.reports.view', 'View Analytics Reports', 'Analytics Management', 'View analytics reports', 'analytics', p_organization_id),
  ('analytics.reports.create', 'Create Analytics Reports', 'Analytics Management', 'Create custom analytics reports', 'analytics', p_organization_id),
  ('analytics.reports.edit', 'Edit Analytics Reports', 'Analytics Management', 'Edit analytics reports', 'analytics', p_organization_id),
  ('analytics.reports.delete', 'Delete Analytics Reports', 'Analytics Management', 'Delete analytics reports', 'analytics', p_organization_id),
  ('analytics.data.view', 'View Raw Data', 'Analytics Management', 'View raw analytics data', 'analytics', p_organization_id),
  ('analytics.data.export', 'Export Analytics Data', 'Analytics Management', 'Export analytics data', 'analytics', p_organization_id)
  ON CONFLICT (permission_key) DO NOTHING;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;

  RETURN v_inserted_count;
END;
$$;

-- =============================================================================
-- DEFAULT ROLES SEEDING FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION seed_default_roles(p_organization_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted_count INTEGER := 0;
  v_row_count INTEGER;
  v_super_admin_role_id UUID;
  v_admin_role_id UUID;
  v_manager_role_id UUID;
  v_rep_role_id UUID;
BEGIN
  -- Create Super Admin role
  INSERT INTO roles (role_key, role_name, description, is_system_role, organization_id) VALUES
  ('super_admin', 'Super Administrator', 'Full system access with all permissions', true, p_organization_id)
  ON CONFLICT (role_key) DO NOTHING
  RETURNING id INTO v_super_admin_role_id;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;

  -- Create Admin role
  INSERT INTO roles (role_key, role_name, description, is_system_role, organization_id) VALUES
  ('admin', 'Administrator', 'Administrative access to most system functions', true, p_organization_id)
  ON CONFLICT (role_key) DO NOTHING
  RETURNING id INTO v_admin_role_id;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;

  -- Create Manager role
  INSERT INTO roles (role_key, role_name, description, is_system_role, organization_id) VALUES
  ('manager', 'Manager', 'Management access to team and performance data', true, p_organization_id)
  ON CONFLICT (role_key) DO NOTHING
  RETURNING id INTO v_manager_role_id;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;

  -- Create Rep role
  INSERT INTO roles (role_key, role_name, description, is_system_role, organization_id) VALUES
  ('rep', 'Sales Representative', 'Basic access to sales and CRM functions', true, p_organization_id)
  ON CONFLICT (role_key) DO NOTHING
  RETURNING id INTO v_rep_role_id;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;

  -- Assign permissions to roles
  -- Super Admin gets all permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_super_admin_role_id, id FROM permissions WHERE organization_id = p_organization_id
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Admin gets most permissions (excluding super admin specific ones)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_admin_role_id, id FROM permissions 
  WHERE organization_id = p_organization_id 
  AND permission_key NOT LIKE '%super%'
  AND permission_key NOT LIKE '%system%'
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Manager gets management and viewing permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_manager_role_id, id FROM permissions 
  WHERE organization_id = p_organization_id 
  AND (permission_key LIKE '%.view' OR permission_key LIKE '%management%' OR permission_key LIKE '%reports%')
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Rep gets basic CRM and sales permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_rep_role_id, id FROM permissions 
  WHERE organization_id = p_organization_id 
  AND (permission_key LIKE 'crm.%' OR permission_key LIKE 'sales.%')
  AND permission_key NOT LIKE '%.delete'
  AND permission_key NOT LIKE '%admin%'
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  RETURN v_inserted_count;
END;
$$;

-- =============================================================================
-- RBAC UTILITY FUNCTIONS
-- =============================================================================

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_permission_key TEXT,
  p_organization_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_permission BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
    AND ur.is_active = TRUE
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    AND p.permission_key = p_permission_key
    AND p.organization_id = p_organization_id
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID,
  p_organization_id UUID
)
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
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.permission_key,
    p.permission_name,
    p.permission_category,
    p.module_name
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = p_user_id
  AND ur.is_active = TRUE
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  AND p.organization_id = p_organization_id
  ORDER BY p.permission_category, p.permission_name;
END;
$$;

-- Function to get user roles
CREATE OR REPLACE FUNCTION get_user_roles(
  p_user_id UUID,
  p_organization_id UUID
)
RETURNS TABLE (
  role_key TEXT,
  role_name TEXT,
  description TEXT,
  is_system_role BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    r.role_key,
    r.role_name,
    r.description,
    r.is_system_role
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
  AND ur.is_active = TRUE
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  AND r.organization_id = p_organization_id
  ORDER BY r.role_name;
END;
$$;

-- =============================================================================
-- SEED DATA FOR EXISTING ORGANIZATIONS
-- =============================================================================

-- Seed permissions and roles for existing organizations
DO $$
DECLARE
  org_record RECORD;
  permissions_count INTEGER;
  roles_count INTEGER;
BEGIN
  FOR org_record IN SELECT id FROM organizations LOOP
    -- Seed permissions
    SELECT seed_comprehensive_permissions(org_record.id) INTO permissions_count;
    
    -- Seed roles
    SELECT seed_default_roles(org_record.id) INTO roles_count;
    
    -- Create default RBAC settings
    INSERT INTO rbac_settings (organization_id) VALUES (org_record.id)
    ON CONFLICT (organization_id) DO NOTHING;
    
    RAISE NOTICE 'Seeded % permissions and % roles for organization %', 
      permissions_count, roles_count, org_record.id;
  END LOOP;
END $$;

-- =============================================================================
-- GRANT SUPER ADMIN ROLE TO EXISTING SUPER ADMIN USERS
-- =============================================================================

-- Assign super_admin role to users with super_admin enterprise_role
INSERT INTO user_roles (user_id, role_id)
SELECT 
  u.id,
  r.id
FROM users u
JOIN roles r ON r.role_key = 'super_admin' AND r.organization_id = u.organization_id
WHERE u.enterprise_role = 'super_admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Assign admin role to users with admin enterprise_role
INSERT INTO user_roles (user_id, role_id)
SELECT 
  u.id,
  r.id
FROM users u
JOIN roles r ON r.role_key = 'admin' AND r.organization_id = u.organization_id
WHERE u.enterprise_role = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Assign manager role to users with manager enterprise_role
INSERT INTO user_roles (user_id, role_id)
SELECT 
  u.id,
  r.id
FROM users u
JOIN roles r ON r.role_key = 'manager' AND r.organization_id = u.organization_id
WHERE u.enterprise_role = 'manager'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Assign rep role to users with user enterprise_role
INSERT INTO user_roles (user_id, role_id)
SELECT 
  u.id,
  r.id
FROM users u
JOIN roles r ON r.role_key = 'rep' AND r.organization_id = u.organization_id
WHERE u.enterprise_role = 'user'
ON CONFLICT (user_id, role_id) DO NOTHING;
