-- Fix incomplete RLS policy for users table
-- Run this directly in Supabase SQL Editor

-- Drop the incomplete policy if it exists
DROP POLICY IF EXISTS "Authenticated users can view users" ON users;

-- Create the correct policy
CREATE POLICY "Authenticated users can view users" ON users
    FOR ALL USING (auth.uid() IS NOT NULL);


