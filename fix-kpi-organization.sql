-- Fix KPI organization assignment
-- This will update all KPIs to use the correct organization ID

-- First, let's see what organizations exist and which one your app should use
SELECT id, name, created_at FROM organizations ORDER BY created_at;

-- Check what organization the current user belongs to
SELECT 
    u.id as user_id,
    u.email,
    u.organization_id,
    o.name as organization_name
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
ORDER BY u.created_at
LIMIT 5;

-- If you need to update KPIs to a different organization, use this:
-- Replace 'YOUR_ACTUAL_ORG_ID' with the correct organization ID from above
-- UPDATE kpi_definitions 
-- SET organization_id = 'YOUR_ACTUAL_ORG_ID'
-- WHERE organization_id = '00000000-0000-0000-0000-000000000001';

-- Alternative: Create KPIs for all organizations (if you want them available everywhere)
-- INSERT INTO kpi_definitions (
--     organization_id,
--     kpi_name,
--     display_name,
--     description,
--     formula,
--     calculation_method,
--     data_sources,
--     dimensions,
--     thresholds,
--     industry_benchmarks,
--     is_active
-- )
-- SELECT 
--     o.id as organization_id,
--     kd.kpi_name,
--     kd.display_name,
--     kd.description,
--     kd.formula,
--     kd.calculation_method,
--     kd.data_sources,
--     kd.dimensions,
--     kd.thresholds,
--     kd.industry_benchmarks,
--     kd.is_active
-- FROM kpi_definitions kd
-- CROSS JOIN organizations o
-- WHERE kd.organization_id = '00000000-0000-0000-0000-000000000001'
-- AND o.id != '00000000-0000-0000-0000-000000000001'
-- ON CONFLICT (organization_id, kpi_name) DO NOTHING;
