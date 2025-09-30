-- Test the metric templates API call
-- Run this in Supabase SQL Editor to verify the exact query

-- Test the simple query (what the debug API uses)
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
AND is_active = true
ORDER BY created_at DESC;

-- Check if there are any templates at all
SELECT 
    'All templates' as status,
    COUNT(*) as count
FROM metric_templates;

-- Check templates by organization
SELECT 
    'Templates by org' as status,
    organization_id,
    COUNT(*) as count
FROM metric_templates
GROUP BY organization_id;
