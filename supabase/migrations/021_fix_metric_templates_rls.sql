-- =============================================================================
-- Migration 021: Fix Metric Templates RLS Policies
-- =============================================================================
-- Created: 2025-09-30
-- Purpose: Fix RLS policies for metric_templates and custom_metric_fields
--          to properly support INSERT operations with WITH CHECK clauses
--
-- Issue: The existing "FOR ALL" policies don't have proper WITH CHECK clauses
--        for INSERT operations, causing 42501 (insufficient_privilege) errors
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
