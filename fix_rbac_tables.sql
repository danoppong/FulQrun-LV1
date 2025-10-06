-- =============================================================================
-- RBAC CLEANUP AND RECREATION SCRIPT
-- Clean up existing incomplete RBAC tables and recreate them properly
-- =============================================================================

-- First, let's see what's in the existing role_permissions table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'role_permissions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Drop the existing incomplete role_permissions table
DROP TABLE IF EXISTS role_permissions CASCADE;

-- Now create the proper RBAC schema
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

-- Create role_permissions junction table (properly)
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

-- Create basic RLS policies (simplified)
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable all for authenticated users" ON roles;
    DROP POLICY IF EXISTS "Enable all for authenticated users" ON permissions;
    DROP POLICY IF EXISTS "Enable all for authenticated users" ON role_permissions;
    DROP POLICY IF EXISTS "Enable all for authenticated users" ON rbac_settings;
    
    -- Create new policies
    CREATE POLICY "Enable all for authenticated users" ON roles FOR ALL USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable all for authenticated users" ON permissions FOR ALL USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable all for authenticated users" ON role_permissions FOR ALL USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable all for authenticated users" ON rbac_settings FOR ALL USING (auth.role() = 'authenticated');
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
    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
    DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
    DROP TRIGGER IF EXISTS update_rbac_settings_updated_at ON rbac_settings;
    
    -- Create new triggers
    CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_rbac_settings_updated_at BEFORE UPDATE ON rbac_settings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Test message
DO $$
BEGIN
    RAISE NOTICE '✅ RBAC tables recreated successfully!';
    RAISE NOTICE '📊 Tables: roles, permissions, role_permissions, rbac_settings';
    RAISE NOTICE '🔍 Ready for functions and seeding';
END $$;
