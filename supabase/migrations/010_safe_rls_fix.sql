-- Safe RLS fix that handles existing policies
-- This migration safely removes and recreates RLS policies to fix recursion

-- First, disable RLS temporarily to avoid conflicts
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE integrations DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (ignore errors if they don't exist)
DO $$ 
BEGIN
    -- Drop policies for main tables
    DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
    DROP POLICY IF EXISTS "Users can view organization users" ON users;
    DROP POLICY IF EXISTS "Users can view organization companies" ON companies;
    DROP POLICY IF EXISTS "Users can view organization contacts" ON contacts;
    DROP POLICY IF EXISTS "Users can view organization leads" ON leads;
    DROP POLICY IF EXISTS "Users can view organization opportunities" ON opportunities;
    DROP POLICY IF EXISTS "Users can view organization activities" ON activities;
    DROP POLICY IF EXISTS "Users can view organization integrations" ON integrations;
    
    -- Drop policies for Phase 2 tables (if they exist)
    DROP POLICY IF EXISTS "Users can view organization pipeline configurations" ON pipeline_configurations;
    DROP POLICY IF EXISTS "Users can view organization workflow automations" ON workflow_automations;
    DROP POLICY IF EXISTS "Users can view organization ai insights" ON ai_insights;
    DROP POLICY IF EXISTS "Users can view organization learning modules" ON learning_modules;
    DROP POLICY IF EXISTS "Users can view organization integration connections" ON integration_connections;
    DROP POLICY IF EXISTS "Users can view organization performance metrics" ON performance_metrics;
    DROP POLICY IF EXISTS "Users can view organization user learning progress" ON user_learning_progress;
    DROP POLICY IF EXISTS "Users can view organization sharepoint documents" ON sharepoint_documents;
    
    -- Drop any other potentially problematic policies
    DROP POLICY IF EXISTS "Users can view their organization data" ON organizations;
    DROP POLICY IF EXISTS "Users can view their organization users" ON users;
    DROP POLICY IF EXISTS "Users can view their organization companies" ON companies;
    DROP POLICY IF EXISTS "Users can view their organization contacts" ON contacts;
    DROP POLICY IF EXISTS "Users can view their organization leads" ON leads;
    DROP POLICY IF EXISTS "Users can view their organization opportunities" ON opportunities;
    DROP POLICY IF EXISTS "Users can view their organization activities" ON activities;
    DROP POLICY IF EXISTS "Users can view their organization integrations" ON integrations;
END $$;

-- Re-enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive RLS policies
-- These policies use auth.uid() directly instead of querying the users table

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view their own organization" ON organizations
    FOR ALL USING (id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Users: Users can see all users in their organization
CREATE POLICY "Users can view organization users" ON users
    FOR ALL USING (organization_id = (
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

-- Create policies for Phase 2 tables if they exist
DO $$ 
BEGIN
    -- Pipeline configurations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pipeline_configurations') THEN
        ALTER TABLE pipeline_configurations ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view organization pipeline configurations" ON pipeline_configurations
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Workflow automations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_automations') THEN
        ALTER TABLE workflow_automations ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view organization workflow automations" ON workflow_automations
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- AI insights
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_insights') THEN
        ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view organization ai insights" ON ai_insights
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Learning modules
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_modules') THEN
        ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view organization learning modules" ON learning_modules
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Integration connections
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integration_connections') THEN
        ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view organization integration connections" ON integration_connections
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Performance metrics
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_metrics') THEN
        ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view organization performance metrics" ON performance_metrics
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- User learning progress
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_learning_progress') THEN
        ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view organization user learning progress" ON user_learning_progress
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- SharePoint documents
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sharepoint_documents') THEN
        ALTER TABLE sharepoint_documents ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view organization sharepoint documents" ON sharepoint_documents
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;
END $$;
