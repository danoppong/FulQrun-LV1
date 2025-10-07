-- Debug queries to check KPI definitions

-- 1. Check if any KPIs exist at all
SELECT COUNT(*) as total_kpis FROM kpi_definitions;

-- 2. Check the organization_id being used
SELECT id, name FROM organizations LIMIT 5;

-- 3. Check what organization_id the KPIs are assigned to
SELECT DISTINCT organization_id, COUNT(*) as kpi_count 
FROM kpi_definitions 
GROUP BY organization_id;

-- 4. Check if there are any active KPIs
SELECT COUNT(*) as active_kpis FROM kpi_definitions WHERE is_active = true;

-- 5. Show sample KPIs with their organization_id
SELECT kpi_name, display_name, organization_id, is_active 
FROM kpi_definitions 
ORDER BY kpi_name 
LIMIT 10;

-- 6. Test the exact query the app is using
SELECT * FROM kpi_definitions 
WHERE is_active = true 
ORDER BY display_name;
