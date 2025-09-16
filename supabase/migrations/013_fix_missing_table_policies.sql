-- Fix RLS policies for user_profiles and user_dashboard_layouts tables
-- These tables exist but may not have proper RLS policies

-- Disable RLS temporarily on these tables
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboard_layouts DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can access their own dashboard layouts" ON user_dashboard_layouts;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view organization user profiles" ON user_profiles;

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Create simple policies that don't cause recursion
-- User profiles: Allow authenticated users to see all profiles
CREATE POLICY "Authenticated users can view user profiles" ON user_profiles
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Dashboard layouts: Allow authenticated users to see all layouts
CREATE POLICY "Authenticated users can view dashboard layouts" ON user_dashboard_layouts
    FOR ALL USING (auth.uid() IS NOT NULL);
