-- =============================================================================
-- COMPLETE FIX: Metric Templates RLS Policies
-- =============================================================================
-- This script completely fixes the RLS policies for metric_templates
-- Run this in your Supabase SQL Editor
--
-- The issue: The existing "FOR ALL" policies don't have proper WITH CHECK clauses
-- for INSERT operations, causing 42501 (insufficient_privilege) errors
-- =============================================================================

-- Step 1: Drop all existing policies for metric_templates
DROP POLICY IF EXISTS "Users can view organization metric templates" ON metric_templates;
DROP POLICY IF EXISTS "Managers can manage metric templates" ON metric_templates;
DROP POLICY IF EXISTS "Authenticated users can create metric templates" ON metric_templates;

-- Step 2: Create specific policies for each operation
-- This ensures proper separation and clear WITH CHECK clauses

-- SELECT Policy: All authenticated users can view their organization's templates
CREATE POLICY "metric_templates_select_policy" ON metric_templates
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL AND
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        )
    );

-- INSERT Policy: All authenticated users can create templates for their organization
CREATE POLICY "metric_templates_insert_policy" ON metric_templates
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        ) AND
        created_by = auth.uid()
    );

-- UPDATE Policy: Managers/admins can update templates in their organization
CREATE POLICY "metric_templates_update_policy" ON metric_templates
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL AND
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        ) AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
        )
    )
    WITH CHECK (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        )
    );

-- DELETE Policy: Managers/admins can delete templates in their organization
CREATE POLICY "metric_templates_delete_policy" ON metric_templates
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL AND
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        ) AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
        )
    );

-- Step 3: Also fix custom_metric_fields policies (same issue)
DROP POLICY IF EXISTS "Users can view organization custom metric fields" ON custom_metric_fields;
DROP POLICY IF EXISTS "Managers can manage custom metric fields" ON custom_metric_fields;

-- SELECT Policy for custom_metric_fields
CREATE POLICY "custom_metric_fields_select_policy" ON custom_metric_fields
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL AND
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        )
    );

-- INSERT Policy for custom_metric_fields
CREATE POLICY "custom_metric_fields_insert_policy" ON custom_metric_fields
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        )
    );

-- UPDATE Policy for custom_metric_fields
CREATE POLICY "custom_metric_fields_update_policy" ON custom_metric_fields
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL AND
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        ) AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
        )
    )
    WITH CHECK (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        )
    );

-- DELETE Policy for custom_metric_fields
CREATE POLICY "custom_metric_fields_delete_policy" ON custom_metric_fields
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL AND
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        ) AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
        )
    );

-- =============================================================================
-- Verification Queries
-- =============================================================================

-- Verify metric_templates policies
SELECT 
    'Metric Templates Policies' as table_name,
    policyname, 
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN '✅ Has USING'
        ELSE '❌ No USING'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN '✅ Has WITH CHECK'
        WHEN cmd IN ('INSERT', 'UPDATE') THEN '⚠️  Missing WITH CHECK'
        ELSE '➖ Not applicable'
    END as with_check_clause
FROM pg_policies 
WHERE tablename = 'metric_templates' 
ORDER BY cmd, policyname;

-- Verify custom_metric_fields policies
SELECT 
    'Custom Metric Fields Policies' as table_name,
    policyname, 
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN '✅ Has USING'
        ELSE '❌ No USING'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN '✅ Has WITH CHECK'
        WHEN cmd IN ('INSERT', 'UPDATE') THEN '⚠️  Missing WITH CHECK'
        ELSE '➖ Not applicable'
    END as with_check_clause
FROM pg_policies 
WHERE tablename = 'custom_metric_fields' 
ORDER BY cmd, policyname;

-- Test insert permissions (this should now work)
SELECT 
    'Test Insert Permission' as test,
    auth.uid() as current_user,
    (SELECT organization_id FROM users WHERE id = auth.uid()) as user_org_id,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ Authenticated'
        ELSE '❌ Not authenticated'
    END as auth_status;
