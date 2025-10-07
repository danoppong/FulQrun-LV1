-- Check what organization ID your app is using

-- 1. Check all organizations
SELECT id, name, created_at FROM organizations ORDER BY created_at;

-- 2. Check what organization the current user belongs to
SELECT 
    u.id as user_id,
    u.email,
    u.organization_id,
    o.name as organization_name
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
ORDER BY u.created_at
LIMIT 10;

-- 3. Check if there are any KPIs for other organizations
SELECT 
    organization_id,
    COUNT(*) as kpi_count,
    array_agg(kpi_name ORDER BY kpi_name) as kpi_names
FROM kpi_definitions 
GROUP BY organization_id;
