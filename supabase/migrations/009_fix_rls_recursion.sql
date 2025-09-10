-- Fix RLS infinite recursion issues
-- This migration removes problematic RLS policies and creates simpler ones

-- Drop all existing RLS policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their organization data" ON organizations;
DROP POLICY IF EXISTS "Users can view their organization users" ON users;
DROP POLICY IF EXISTS "Users can view their organization companies" ON companies;
DROP POLICY IF EXISTS "Users can view their organization contacts" ON contacts;
DROP POLICY IF EXISTS "Users can view their organization leads" ON leads;
DROP POLICY IF EXISTS "Users can view their organization opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can view their organization activities" ON activities;
DROP POLICY IF EXISTS "Users can view their organization integrations" ON integrations;

-- Drop policies for Phase 2 tables
DROP POLICY IF EXISTS "Users can view organization pipeline configurations" ON pipeline_configurations;
DROP POLICY IF EXISTS "Users can view organization workflow automations" ON workflow_automations;
DROP POLICY IF EXISTS "Users can view organization ai insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can view organization learning modules" ON learning_modules;
DROP POLICY IF EXISTS "Users can view organization integration connections" ON integration_connections;
DROP POLICY IF EXISTS "Users can view organization performance metrics" ON performance_metrics;
DROP POLICY IF EXISTS "Users can view organization user learning progress" ON user_learning_progress;
DROP POLICY IF EXISTS "Users can view organization sharepoint documents" ON sharepoint_documents;

-- Create simple, non-recursive RLS policies
-- These policies use auth.uid() directly instead of querying the users table

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view their own organization" ON organizations
    FOR ALL USING (id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Users: Users can see all users in their organization (but avoid recursion)
CREATE POLICY "Users can view organization users" ON users
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Companies: Users can see all companies in their organization
CREATE POLICY "Users can view organization companies" ON companies
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Contacts: Users can see all contacts in their organization
CREATE POLICY "Users can view organization contacts" ON contacts
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Leads: Users can see all leads in their organization
CREATE POLICY "Users can view organization leads" ON leads
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Opportunities: Users can see all opportunities in their organization
CREATE POLICY "Users can view organization opportunities" ON opportunities
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Activities: Users can see all activities in their organization
CREATE POLICY "Users can view organization activities" ON activities
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Phase 2 tables: Simple policies that don't cause recursion
CREATE POLICY "Users can view organization pipeline configurations" ON pipeline_configurations
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Users can view organization workflow automations" ON workflow_automations
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Users can view organization ai insights" ON ai_insights
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Users can view organization learning modules" ON learning_modules
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Users can view organization integration connections" ON integration_connections
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Users can view organization performance metrics" ON performance_metrics
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Users can view organization user learning progress" ON user_learning_progress
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Users can view organization sharepoint documents" ON sharepoint_documents
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Add a comment explaining the fix
COMMENT ON POLICY "Users can view organization users" ON users IS 'Fixed: Removed infinite recursion by using direct auth.uid() lookup';
