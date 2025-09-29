-- Allow authenticated users to create records
-- This migration makes RLS policies more permissive for initial setup

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can view users" ON users;

-- Create permissive policies that allow authenticated users to do everything
CREATE POLICY "Authenticated users can manage organizations" ON organizations
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage users" ON users
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Also ensure user_dashboard_layouts has permissive policy
DROP POLICY IF EXISTS "Authenticated users can access user dashboard layouts" ON user_dashboard_layouts;
CREATE POLICY "Authenticated users can manage user dashboard layouts" ON user_dashboard_layouts
    FOR ALL USING (auth.uid() IS NOT NULL);
