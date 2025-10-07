-- Fix RLS policy for qualification_framework_settings to use lowercase roles
-- This migration updates the existing policy to use lowercase role names

-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can modify framework settings for their organization" ON qualification_framework_settings;

-- Create the corrected policy with lowercase roles
CREATE POLICY "Admins can modify framework settings for their organization" ON qualification_framework_settings
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
        )
    );
