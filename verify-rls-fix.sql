-- =============================================================================
-- Verify Migration 021 Applied Successfully
-- =============================================================================
-- Run this in Supabase SQL Editor AFTER applying migration 021
-- This will confirm all policies are correctly in place
-- =============================================================================

-- Check metric_templates policies
SELECT 
    '✅ Metric Templates Policies' as check_name,
    policyname, 
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN '✅ Has USING'
        ELSE '❌ No USING'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN '✅ Has WITH CHECK'
        WHEN cmd IN ('INSERT', 'UPDATE') THEN '❌ Missing WITH CHECK'
        ELSE '➖ N/A'
    END as with_check_clause
FROM pg_policies 
WHERE tablename = 'metric_templates' 
ORDER BY cmd, policyname;

-- Check custom_metric_fields policies
SELECT 
    '✅ Custom Metric Fields Policies' as check_name,
    policyname, 
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN '✅ Has USING'
        ELSE '❌ No USING'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN '✅ Has WITH CHECK'
        WHEN cmd IN ('INSERT', 'UPDATE') THEN '❌ Missing WITH CHECK'
        ELSE '➖ N/A'
    END as with_check_clause
FROM pg_policies 
WHERE tablename = 'custom_metric_fields' 
ORDER BY cmd, policyname;

-- Test that you can see policies
SELECT 
    '✅ Policy Summary' as check_name,
    COUNT(*) FILTER (WHERE tablename = 'metric_templates') as metric_templates_policies,
    COUNT(*) FILTER (WHERE tablename = 'custom_metric_fields') as custom_fields_policies
FROM pg_policies 
WHERE tablename IN ('metric_templates', 'custom_metric_fields');

-- Expected result:
-- ✅ metric_templates should have 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- ✅ custom_metric_fields should have 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- ✅ All INSERT and UPDATE policies should have WITH CHECK clauses
