-- Fix authentication and organization issues
-- Run this in Supabase SQL Editor

-- 1. Check current users and their organization_id
SELECT 
    'Current users' as check_type,
    id,
    email,
    full_name,
    role,
    organization_id,
    created_at
FROM users
ORDER BY created_at DESC;

-- 2. Check organizations
SELECT 
    'Organizations' as check_type,
    id,
    name,
    domain,
    created_at
FROM organizations
ORDER BY created_at DESC;

-- 3. Check if there are any users without organization_id
SELECT 
    'Users without org' as check_type,
    COUNT(*) as count
FROM users
WHERE organization_id IS NULL;

-- 4. Create a default organization if none exists
INSERT INTO organizations (id, name, domain)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Default Organization',
    'default.local'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Update any users without organization_id
UPDATE users 
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- 6. Verify the fix
SELECT 
    'After fix' as check_type,
    u.id,
    u.email,
    u.role,
    u.organization_id,
    o.name as org_name
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
ORDER BY u.created_at DESC;
