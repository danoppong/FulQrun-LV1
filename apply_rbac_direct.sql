-- Apply RBAC migration directly
-- This script applies only the RBAC comprehensive schema

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

-- Create user_roles table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roles_organization_id ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_role_key ON roles(role_key);
CREATE INDEX IF NOT EXISTS idx_permissions_organization_id ON permissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_permissions_permission_key ON permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_settings_organization_id ON rbac_settings(organization_id);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create triggers for updated_at
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

-- Create utility functions
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

-- Seed basic permissions for existing organizations
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM organizations LOOP
    -- Insert basic admin permissions
    INSERT INTO permissions (permission_key, permission_name, permission_category, description, module_name, organization_id) VALUES
    ('admin.organization.view', 'View Organization Settings', 'Organization Management', 'View organization settings and configuration', 'admin', org_record.id),
    ('admin.organization.edit', 'Edit Organization Settings', 'Organization Management', 'Edit organization settings and configuration', 'admin', org_record.id),
    ('admin.users.view', 'View Users', 'User Management', 'View user list and details', 'admin', org_record.id),
    ('admin.users.create', 'Create Users', 'User Management', 'Create new user accounts', 'admin', org_record.id),
    ('admin.users.edit', 'Edit Users', 'User Management', 'Edit user information and settings', 'admin', org_record.id),
    ('admin.users.delete', 'Delete Users', 'User Management', 'Delete user accounts', 'admin', org_record.id),
    ('admin.roles.view', 'View Roles', 'Role Management', 'View roles and their permissions', 'admin', org_record.id),
    ('admin.roles.create', 'Create Roles', 'Role Management', 'Create new custom roles', 'admin', org_record.id),
    ('admin.roles.edit', 'Edit Roles', 'Role Management', 'Edit role properties and permissions', 'admin', org_record.id),
    ('admin.permissions.view', 'View Permissions', 'Role Management', 'View available permissions', 'admin', org_record.id),
    ('admin.permissions.create', 'Create Permissions', 'Role Management', 'Create new custom permissions', 'admin', org_record.id)
    ON CONFLICT (permission_key) DO NOTHING;
    
    -- Insert basic roles
    INSERT INTO roles (role_key, role_name, description, is_system_role, organization_id) VALUES
    ('super_admin', 'Super Administrator', 'Full system access with all permissions', true, org_record.id),
    ('admin', 'Administrator', 'Administrative access to most system functions', true, org_record.id),
    ('manager', 'Manager', 'Management access to team and performance data', true, org_record.id),
    ('rep', 'Sales Representative', 'Basic access to sales and CRM functions', true, org_record.id)
    ON CONFLICT (role_key) DO NOTHING;
    
    -- Create default RBAC settings
    INSERT INTO rbac_settings (organization_id) VALUES (org_record.id)
    ON CONFLICT (organization_id) DO NOTHING;
  END LOOP;
END $$;

-- Assign roles to existing users based on their enterprise_role
INSERT INTO user_roles (user_id, role_id)
SELECT 
  u.id,
  r.id
FROM users u
JOIN roles r ON r.role_key = 'super_admin' AND r.organization_id = u.organization_id
WHERE u.enterprise_role = 'super_admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 
  u.id,
  r.id
FROM users u
JOIN roles r ON r.role_key = 'admin' AND r.organization_id = u.organization_id
WHERE u.enterprise_role = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 
  u.id,
  r.id
FROM users u
JOIN roles r ON r.role_key = 'manager' AND r.organization_id = u.organization_id
WHERE u.enterprise_role = 'manager'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 
  u.id,
  r.id
FROM users u
JOIN roles r ON r.role_key = 'rep' AND r.organization_id = u.organization_id
WHERE u.enterprise_role = 'user'
ON CONFLICT (user_id, role_id) DO NOTHING;
