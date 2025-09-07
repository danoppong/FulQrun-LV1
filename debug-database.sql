-- Debug script to check what's in the database
-- Check if the user was created in the users table
SELECT id, email, full_name, role, organization_id, created_at 
FROM users 
ORDER BY created_at DESC;

-- Check if the organization was created
SELECT id, name, domain, created_at 
FROM organizations 
ORDER BY created_at DESC;

-- Check if there are any RLS policies that might be blocking access
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('users', 'organizations')
ORDER BY tablename, policyname;
