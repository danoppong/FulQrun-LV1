-- Fix the INSERT policy for metric_templates
-- This adds the missing WITH CHECK clause that was causing the 42501 error

DROP POLICY IF EXISTS "Authenticated users can create metric templates" ON metric_templates;

CREATE POLICY "Authenticated users can create metric templates" ON metric_templates
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
        ) AND
        created_by = auth.uid()
    );

-- Verify the policy was created correctly
SELECT 
    schemaname,
    tablename, 
    policyname, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'metric_templates' 
AND cmd = 'INSERT';