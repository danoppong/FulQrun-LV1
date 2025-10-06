-- =============================================================================
-- MINIMAL RBAC TEST - Just create the tables first
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

-- Test message
DO $$
BEGIN
    RAISE NOTICE '✅ RBAC tables created successfully!';
    RAISE NOTICE '📊 Tables: roles, permissions, role_permissions, rbac_settings';
    RAISE NOTICE '🔍 You can now run the full script with functions and seeding';
END $$;
