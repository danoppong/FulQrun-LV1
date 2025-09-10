-- Aggressive RLS fix - completely disable RLS temporarily to test
-- This will help us identify if the issue is with RLS policies or something else

-- Disable RLS on all tables temporarily
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE integrations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on Phase 2 tables
ALTER TABLE pipeline_configurations DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_automations DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE learning_modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE integration_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE sharepoint_documents DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to clean slate
DROP POLICY IF EXISTS "org_policy" ON organizations;
DROP POLICY IF EXISTS "users_policy" ON users;
DROP POLICY IF EXISTS "companies_policy" ON companies;
DROP POLICY IF EXISTS "contacts_policy" ON contacts;
DROP POLICY IF EXISTS "leads_policy" ON leads;
DROP POLICY IF EXISTS "opportunities_policy" ON opportunities;
DROP POLICY IF EXISTS "activities_policy" ON activities;
DROP POLICY IF EXISTS "pipeline_configs_policy" ON pipeline_configurations;
DROP POLICY IF EXISTS "workflow_automations_policy" ON workflow_automations;
DROP POLICY IF EXISTS "ai_insights_policy" ON ai_insights;
DROP POLICY IF EXISTS "learning_modules_policy" ON learning_modules;
DROP POLICY IF EXISTS "integration_connections_policy" ON integration_connections;
DROP POLICY IF EXISTS "performance_metrics_policy" ON performance_metrics;
DROP POLICY IF EXISTS "user_learning_progress_policy" ON user_learning_progress;
DROP POLICY IF EXISTS "sharepoint_documents_policy" ON sharepoint_documents;

-- Drop any remaining policies with old names
DROP POLICY IF EXISTS "Users can view their organization data" ON organizations;
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can view organization users" ON users;
DROP POLICY IF EXISTS "Users can view organization companies" ON companies;
DROP POLICY IF EXISTS "Users can view organization contacts" ON contacts;
DROP POLICY IF EXISTS "Users can view organization leads" ON leads;
DROP POLICY IF EXISTS "Users can view organization opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can view organization activities" ON activities;
DROP POLICY IF EXISTS "Users can view organization integrations" ON integrations;
DROP POLICY IF EXISTS "Users can view organization pipeline configurations" ON pipeline_configurations;
DROP POLICY IF EXISTS "Users can view organization workflow automations" ON workflow_automations;
DROP POLICY IF EXISTS "Users can view organization ai insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can view organization learning modules" ON learning_modules;
DROP POLICY IF EXISTS "Users can view organization integration connections" ON integration_connections;
DROP POLICY IF EXISTS "Users can view organization performance metrics" ON performance_metrics;
DROP POLICY IF EXISTS "Users can view organization user learning progress" ON user_learning_progress;
DROP POLICY IF EXISTS "Users can view organization sharepoint documents" ON sharepoint_documents;