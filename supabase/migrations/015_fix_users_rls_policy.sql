-- Fix incomplete RLS policy for users table
-- This fixes the 406 error when querying the users table
-- Migration: 015_fix_users_rls_policy

-- Drop the incomplete policy if it exists
DROP POLICY IF EXISTS "Authenticated users can view users" ON users;

-- Create the correct policy
CREATE POLICY "Authenticated users can view users" ON users
    FOR ALL USING (auth.uid() IS NOT NULL);
