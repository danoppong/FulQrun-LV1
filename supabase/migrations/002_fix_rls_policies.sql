-- Fix RLS policies to prevent infinite recursion
-- This migration fixes the existing RLS policies that are causing infinite recursion

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view organization users" ON users;
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can view organization companies" ON companies;
DROP POLICY IF EXISTS "Users can view organization contacts" ON contacts;
DROP POLICY IF EXISTS "Users can view organization leads" ON leads;
DROP POLICY IF EXISTS "Users can view organization opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can view organization activities" ON activities;
DROP POLICY IF EXISTS "Users can view organization integrations" ON integrations;

-- Create fixed RLS policies
-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view their own organization" ON organizations
    FOR SELECT USING (id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Users: First allow users to see their own record
CREATE POLICY "Users can view their own record" ON users
    FOR SELECT USING (id = auth.uid());

-- Then allow users to see other users in their organization
CREATE POLICY "Users can view organization users" ON users
    FOR SELECT USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Companies: Users can see companies in their organization
CREATE POLICY "Users can view organization companies" ON companies
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Contacts: Users can see contacts in their organization
CREATE POLICY "Users can view organization contacts" ON contacts
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Leads: Users can see leads in their organization
CREATE POLICY "Users can view organization leads" ON leads
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Opportunities: Users can see opportunities in their organization
CREATE POLICY "Users can view organization opportunities" ON opportunities
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Activities: Users can see activities in their organization
CREATE POLICY "Users can view organization activities" ON activities
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Integrations: Users can see integrations in their organization
CREATE POLICY "Users can view organization integrations" ON integrations
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));
