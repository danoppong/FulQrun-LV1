-- Test the metric templates API query
-- Run this in Supabase SQL Editor to verify the exact query the API will run

-- Test the exact query the API uses
SELECT 
    mt.*,
    u.id as user_id,
    u.organization_id as user_org_id,
    u.role
FROM metric_templates mt
CROSS JOIN users u
WHERE u.organization_id = mt.organization_id
AND u.email = 'danoppong@gmail.com'
ORDER BY mt.created_at DESC;

-- Also test the simple query (what the debug API uses)
SELECT 
    id,
    name,
    description,
    category,
    metric_type,
    unit,
    target_default,
    is_system,
    organization_id,
    created_by,
    created_at
FROM metric_templates
WHERE organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8'
ORDER BY created_at DESC;
