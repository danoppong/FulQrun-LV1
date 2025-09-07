-- Safe RLS policy fix that handles existing policies
-- This will work even if some policies already exist

-- Drop ALL existing policies first (this is safe)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on users table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON users';
    END LOOP;
    
    -- Drop all policies on organizations table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organizations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON organizations';
    END LOOP;
    
    -- Drop all policies on companies table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'companies') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON companies';
    END LOOP;
    
    -- Drop all policies on contacts table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'contacts') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON contacts';
    END LOOP;
    
    -- Drop all policies on leads table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'leads') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON leads';
    END LOOP;
    
    -- Drop all policies on opportunities table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'opportunities') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON opportunities';
    END LOOP;
    
    -- Drop all policies on activities table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'activities') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON activities';
    END LOOP;
    
    -- Drop all policies on integrations table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'integrations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON integrations';
    END LOOP;
END $$;

-- Now create the fixed RLS policies
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
