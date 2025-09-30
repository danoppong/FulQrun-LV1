-- Debug the metric templates issue
-- Run this in Supabase SQL Editor

-- 1. Check if templates exist and are accessible
SELECT 
    'Templates count' as check_type,
    COUNT(*) as count
FROM metric_templates;

-- 2. Check the organization_id values
SELECT 
    'Organization IDs' as check_type,
    organization_id,
    COUNT(*) as count
FROM metric_templates
GROUP BY organization_id;

-- 3. Check if there are users with matching organization_id
SELECT 
    'Users with matching org' as check_type,
    u.organization_id,
    COUNT(*) as user_count
FROM users u
WHERE u.organization_id IN (SELECT DISTINCT organization_id FROM metric_templates)
GROUP BY u.organization_id;

-- 4. Test the exact query the API would run
SELECT 
    mt.*,
    u.id as user_id,
    u.organization_id as user_org_id,
    u.role
FROM metric_templates mt
CROSS JOIN users u
WHERE u.organization_id = mt.organization_id
LIMIT 10;

-- 5. Check RLS policies
SELECT 
    'RLS Policies' as check_type,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'metric_templates';

-- 6. Test without joins (simplified query)
SELECT 
    'Simple query test' as check_type,
    id,
    name,
    category,
    metric_type,
    unit,
    target_default,
    is_system,
    organization_id,
    created_by
FROM metric_templates
ORDER BY created_at DESC
LIMIT 5;
