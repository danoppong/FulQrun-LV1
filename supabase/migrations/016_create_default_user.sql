-- Migration to create default user and organization
-- This fixes the 406 errors by creating the missing user record

-- Temporarily disable RLS to allow data insertion
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Create default organization
INSERT INTO organizations (id, name, domain, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Default Organization',
    'livful.com',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create user record for doppong@livful.com
INSERT INTO users (id, email, first_name, last_name, role, organization_id, created_at, updated_at)
VALUES (
    'f707003d-7d2b-40a9-97ae-63b51d14d056',
    'doppong@livful.com',
    'Daniel',
    'Oppong',
    'admin',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies that allow authenticated users
CREATE POLICY IF NOT EXISTS "Authenticated users can view organizations" ON organizations
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Authenticated users can view users" ON users
    FOR ALL USING (auth.uid() IS NOT NULL);
