-- Debug why INSERT is still failing
-- Run this in Supabase SQL Editor to understand the issue

-- 1. Check what user context we have
SELECT 
    'Current Auth Context' as check_type,
    auth.uid() as current_user_id,
    (SELECT id FROM users WHERE id = auth.uid()) as user_exists,
    (SELECT organization_id FROM users WHERE id = auth.uid()) as user_org_id,
    (SELECT role FROM users WHERE id = auth.uid()) as user_role;

-- 2. Check the INSERT policy conditions
SELECT 
    'INSERT Policy Check' as check_type,
    policyname,
    with_check as policy_condition
FROM pg_policies 
WHERE tablename = 'metric_templates' 
AND cmd = 'INSERT';

-- 3. Try to understand which condition is failing
-- Test if we can see the organization
SELECT 
    'Can Access Org?' as test,
    CASE 
        WHEN auth.uid() IS NULL THEN '❌ No auth.uid()'
        WHEN (SELECT organization_id FROM users WHERE id = auth.uid()) IS NULL THEN '❌ User has no org_id'
        ELSE '✅ User has org_id: ' || (SELECT organization_id::text FROM users WHERE id = auth.uid())
    END as result;

-- 4. Check if RLS is actually enabled
SELECT 
    'RLS Status' as check_type,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables 
WHERE tablename = 'metric_templates';
