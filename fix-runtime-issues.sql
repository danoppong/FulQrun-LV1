-- =============================================================================
-- FIX RUNTIME ISSUES - Database Relationships and Authentication
-- =============================================================================
-- This script fixes the runtime issues with enhanced metrics API and authentication
-- Run this in Supabase SQL Editor

-- =============================================================================
-- 1. VERIFY AND FIX USER AUTHENTICATION
-- =============================================================================

-- Check current users and their organization_id
SELECT 
    'Current Users Status' as check_type,
    id,
    email,
    full_name,
    role,
    organization_id,
    CASE 
        WHEN organization_id IS NULL THEN '❌ Missing Org ID'
        ELSE '✅ Has Org ID'
    END as status
FROM users
ORDER BY created_at DESC;

-- Create default organization if it doesn't exist
INSERT INTO organizations (id, name, domain)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Default Organization',
    'default.local'
)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, domain = EXCLUDED.domain;

-- Update any users without organization_id
UPDATE users 
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- =============================================================================
-- 2. VERIFY FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- Check foreign key constraints on enhanced_performance_metrics
SELECT
    'Foreign Key Constraints' as check_type,
    conname as constraint_name,
    conrelid::regclass as table_name,
    a.attname as column_name,
    confrelid::regclass as foreign_table_name,
    af.attname as foreign_column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.conrelid = 'enhanced_performance_metrics'::regclass
AND c.contype = 'f'
ORDER BY conname;

-- =============================================================================
-- 3. CHECK METRIC TEMPLATES
-- =============================================================================

-- Verify metric templates exist
SELECT 
    'Metric Templates Status' as check_type,
    COUNT(*) as total_templates,
    COUNT(*) FILTER (WHERE is_active = true) as active_templates,
    COUNT(*) FILTER (WHERE is_system = true) as system_templates,
    COUNT(DISTINCT organization_id) as organizations_with_templates
FROM metric_templates;

-- Show all metric templates
SELECT 
    'Available Templates' as info,
    id,
    name,
    category,
    metric_type,
    unit,
    is_active,
    is_system,
    organization_id
FROM metric_templates
ORDER BY organization_id, category, name;

-- =============================================================================
-- 4. CHECK RLS POLICIES
-- =============================================================================

-- Show RLS policies for enhanced_performance_metrics
SELECT 
    'RLS Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'enhanced_performance_metrics'
ORDER BY policyname;

-- =============================================================================
-- 5. VERIFY DATA ACCESS
-- =============================================================================

-- Check if there are any enhanced_performance_metrics
SELECT 
    'Enhanced Performance Metrics' as check_type,
    COUNT(*) as total_metrics,
    COUNT(DISTINCT organization_id) as organizations,
    COUNT(DISTINCT user_id) as users_with_metrics,
    COUNT(DISTINCT metric_template_id) as templates_used
FROM enhanced_performance_metrics;

-- Show sample metrics with all relationships
SELECT 
    'Sample Metrics' as info,
    epm.id,
    epm.organization_id,
    u.email as user_email,
    mt.name as metric_name,
    epm.actual_value,
    epm.target_value,
    epm.period_start,
    epm.period_end,
    cu.email as created_by_email
FROM enhanced_performance_metrics epm
LEFT JOIN users u ON epm.user_id = u.id
LEFT JOIN metric_templates mt ON epm.metric_template_id = mt.id
LEFT JOIN users cu ON epm.created_by = cu.id
ORDER BY epm.created_at DESC
LIMIT 5;

-- =============================================================================
-- 6. CREATE SAMPLE DATA FOR TESTING (IF NEEDED)
-- =============================================================================

-- Insert sample metric template if none exist for an organization
DO $$
DECLARE
    v_org_id UUID;
    v_user_id UUID;
    v_template_id UUID;
BEGIN
    -- Get first organization and user
    SELECT id INTO v_org_id FROM organizations ORDER BY created_at LIMIT 1;
    SELECT id INTO v_user_id FROM users WHERE organization_id = v_org_id ORDER BY created_at LIMIT 1;
    
    IF v_org_id IS NOT NULL AND v_user_id IS NOT NULL THEN
        -- Check if template exists
        SELECT id INTO v_template_id 
        FROM metric_templates 
        WHERE organization_id = v_org_id 
        AND name = 'Monthly Revenue'
        LIMIT 1;
        
        -- Create template if it doesn't exist
        IF v_template_id IS NULL THEN
            INSERT INTO metric_templates (
                name, 
                description, 
                category, 
                metric_type, 
                unit, 
                target_default, 
                is_active,
                is_system,
                organization_id, 
                created_by
            ) VALUES (
                'Monthly Revenue',
                'Total revenue generated in a month',
                'revenue',
                'currency',
                'USD',
                100000,
                true,
                false,
                v_org_id,
                v_user_id
            ) RETURNING id INTO v_template_id;
            
            RAISE NOTICE 'Created sample metric template: %', v_template_id;
        END IF;
        
        -- Check if sample metrics exist
        IF NOT EXISTS (
            SELECT 1 FROM enhanced_performance_metrics 
            WHERE organization_id = v_org_id
        ) THEN
            -- Create sample metric
            INSERT INTO enhanced_performance_metrics (
                metric_template_id,
                user_id,
                period_start,
                period_end,
                actual_value,
                target_value,
                organization_id,
                created_by
            ) VALUES (
                v_template_id,
                v_user_id,
                DATE_TRUNC('month', CURRENT_DATE),
                DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day',
                75000,
                100000,
                v_org_id,
                v_user_id
            );
            
            RAISE NOTICE 'Created sample metric for testing';
        END IF;
    END IF;
END $$;

-- =============================================================================
-- 7. FINAL VERIFICATION
-- =============================================================================

-- Summary of fixes applied
SELECT 
    'Fix Summary' as report,
    (SELECT COUNT(*) FROM users WHERE organization_id IS NOT NULL) as users_with_org,
    (SELECT COUNT(*) FROM metric_templates WHERE is_active = true) as active_templates,
    (SELECT COUNT(*) FROM enhanced_performance_metrics) as total_metrics,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'enhanced_performance_metrics') as rls_policies;

-- Test query that the API will run (simulating auth.uid())
-- Replace 'YOUR_USER_ID' with an actual user ID to test
/*
DO $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
BEGIN
    -- Get a test user
    SELECT id, organization_id INTO v_user_id, v_org_id 
    FROM users 
    WHERE organization_id IS NOT NULL 
    LIMIT 1;
    
    RAISE NOTICE 'Test user: %, Org: %', v_user_id, v_org_id;
    
    -- This simulates what the API query does
    PERFORM * FROM enhanced_performance_metrics
    WHERE organization_id = v_org_id;
    
    RAISE NOTICE 'Query executed successfully';
END $$;
*/

SELECT '✅ Runtime fixes completed successfully' as status;
