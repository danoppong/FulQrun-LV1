-- =============================================================================
-- SAFE Migration 021: Fix Metric Templates RLS Policies
-- =============================================================================
-- This version is safe to run multiple times - it will work even if policies exist
-- =============================================================================

-- Step 1: Drop ALL possible policies (won't error if they don't exist)
DROP POLICY IF EXISTS "Users can view organization metric templates" ON metric_templates;
DROP POLICY IF EXISTS "Managers can manage metric templates" ON metric_templates;
DROP POLICY IF EXISTS "Authenticated users can create metric templates" ON metric_templates;
DROP POLICY IF EXISTS "metric_templates_select_policy" ON metric_templates;
DROP POLICY IF EXISTS "metric_templates_insert_policy" ON metric_templates;
DROP POLICY IF EXISTS "metric_templates_update_policy" ON metric_templates;
DROP POLICY IF EXISTS "metric_templates_delete_policy" ON metric_templates;

DROP POLICY IF EXISTS "Users can view organization custom metric fields" ON custom_metric_fields;
DROP POLICY IF EXISTS "Managers can manage custom metric fields" ON custom_metric_fields;
DROP POLICY IF EXISTS "custom_metric_fields_select_policy" ON custom_metric_fields;
DROP POLICY IF EXISTS "custom_metric_fields_insert_policy" ON custom_metric_fields;
DROP POLICY IF EXISTS "custom_metric_fields_update_policy" ON custom_metric_fields;
DROP POLICY IF EXISTS "custom_metric_fields_delete_policy" ON custom_metric_fields;

-- Step 2: Create the correct policies fresh

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

-- Verification
SELECT 
    '✅ MIGRATION COMPLETE' as status,
    COUNT(*) FILTER (WHERE tablename = 'metric_templates') as metric_templates_policies,
    COUNT(*) FILTER (WHERE tablename = 'custom_metric_fields') as custom_fields_policies
FROM pg_policies 
WHERE tablename IN ('metric_templates', 'custom_metric_fields');
