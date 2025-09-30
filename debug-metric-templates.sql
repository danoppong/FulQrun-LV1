-- Test query to verify metric templates are accessible
-- Run this in Supabase SQL Editor to check if templates are properly accessible

-- Check if templates exist
SELECT 
    'Templates exist' as status,
    COUNT(*) as count
FROM metric_templates;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'metric_templates';

-- Test the RLS policy by checking what a user would see
-- (This simulates what the API would see)
SELECT 
    mt.*,
    u.organization_id as user_org_id
FROM metric_templates mt
CROSS JOIN users u
WHERE u.role = 'admin'
LIMIT 5;

-- Check if there are any users with admin role
SELECT 
    'Admin users' as status,
    COUNT(*) as count
FROM users 
WHERE role = 'admin';
