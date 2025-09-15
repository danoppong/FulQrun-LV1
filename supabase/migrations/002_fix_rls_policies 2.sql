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

-- Create fixed RLS policies using DO blocks
DO $$ 
BEGIN
    -- Organizations: Users can only see their own organization
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Users can view their own organization') THEN
        CREATE POLICY "Users can view their own organization" ON organizations
            FOR SELECT USING (id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Users: Users can see all users in their organization
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view organization users') THEN
        CREATE POLICY "Users can view organization users" ON users
            FOR SELECT USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Companies: Users can see all companies in their organization
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Users can view organization companies') THEN
        CREATE POLICY "Users can view organization companies" ON companies
            FOR SELECT USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Contacts: Users can see all contacts in their organization
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Users can view organization contacts') THEN
        CREATE POLICY "Users can view organization contacts" ON contacts
            FOR SELECT USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Leads: Users can see all leads in their organization
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can view organization leads') THEN
        CREATE POLICY "Users can view organization leads" ON leads
            FOR SELECT USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Opportunities: Users can see all opportunities in their organization
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'opportunities' AND policyname = 'Users can view organization opportunities') THEN
        CREATE POLICY "Users can view organization opportunities" ON opportunities
            FOR SELECT USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Activities: Users can see all activities in their organization
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Users can view organization activities') THEN
        CREATE POLICY "Users can view organization activities" ON activities
            FOR SELECT USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;
END $$;

-- Add INSERT, UPDATE, DELETE policies for all tables
DO $$ 
BEGIN
    -- Organizations policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Users can insert organization data') THEN
        CREATE POLICY "Users can insert organization data" ON organizations
            FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Users can update organization data') THEN
        CREATE POLICY "Users can update organization data" ON organizations
            FOR UPDATE USING (id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Users can delete organization data') THEN
        CREATE POLICY "Users can delete organization data" ON organizations
            FOR DELETE USING (id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Users policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert users') THEN
        CREATE POLICY "Users can insert users" ON users
            FOR INSERT WITH CHECK (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update users') THEN
        CREATE POLICY "Users can update users" ON users
            FOR UPDATE USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can delete users') THEN
        CREATE POLICY "Users can delete users" ON users
            FOR DELETE USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Companies policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Users can insert companies') THEN
        CREATE POLICY "Users can insert companies" ON companies
            FOR INSERT WITH CHECK (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Users can update companies') THEN
        CREATE POLICY "Users can update companies" ON companies
            FOR UPDATE USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Users can delete companies') THEN
        CREATE POLICY "Users can delete companies" ON companies
            FOR DELETE USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Contacts policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Users can insert contacts') THEN
        CREATE POLICY "Users can insert contacts" ON contacts
            FOR INSERT WITH CHECK (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Users can update contacts') THEN
        CREATE POLICY "Users can update contacts" ON contacts
            FOR UPDATE USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Users can delete contacts') THEN
        CREATE POLICY "Users can delete contacts" ON contacts
            FOR DELETE USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Leads policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can insert leads') THEN
        CREATE POLICY "Users can insert leads" ON leads
            FOR INSERT WITH CHECK (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can update leads') THEN
        CREATE POLICY "Users can update leads" ON leads
            FOR UPDATE USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can delete leads') THEN
        CREATE POLICY "Users can delete leads" ON leads
            FOR DELETE USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Opportunities policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'opportunities' AND policyname = 'Users can insert opportunities') THEN
        CREATE POLICY "Users can insert opportunities" ON opportunities
            FOR INSERT WITH CHECK (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'opportunities' AND policyname = 'Users can update opportunities') THEN
        CREATE POLICY "Users can update opportunities" ON opportunities
            FOR UPDATE USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'opportunities' AND policyname = 'Users can delete opportunities') THEN
        CREATE POLICY "Users can delete opportunities" ON opportunities
            FOR DELETE USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Activities policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Users can insert activities') THEN
        CREATE POLICY "Users can insert activities" ON activities
            FOR INSERT WITH CHECK (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Users can update activities') THEN
        CREATE POLICY "Users can update activities" ON activities
            FOR UPDATE USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Users can delete activities') THEN
        CREATE POLICY "Users can delete activities" ON activities
            FOR DELETE USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;
END $$;
