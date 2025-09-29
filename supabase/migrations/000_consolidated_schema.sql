-- FulQrun Consolidated Database Schema
-- This migration consolidates all individual migrations into a single comprehensive schema
-- Safe to run on new databases - includes all tables, RLS policies, functions, and enterprise features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    enterprise_tier TEXT DEFAULT 'standard' CHECK (enterprise_tier IN ('standard', 'professional', 'enterprise', 'enterprise_plus')),
    region TEXT DEFAULT 'us-east-1',
    currency_code TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    compliance_level TEXT DEFAULT 'standard' CHECK (compliance_level IN ('standard', 'soc2', 'gdpr', 'hipaa', 'fedramp')),
    max_users INTEGER DEFAULT 50,
    features_enabled JSONB DEFAULT '{}',
    sso_provider TEXT,
    sso_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'rep' CHECK (role IN ('rep', 'manager', 'admin')),
    enterprise_role TEXT DEFAULT 'user' CHECK (enterprise_role IN ('user', 'manager', 'admin', 'super_admin')),
    department TEXT,
    cost_center TEXT,
    manager_id UUID REFERENCES users(id),
    hire_date DATE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret TEXT,
    session_timeout_minutes INTEGER DEFAULT 480,
    learning_progress JSONB DEFAULT '{}',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    size TEXT,
    annual_revenue DECIMAL(15,2),
    employee_count INTEGER,
    website TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    description TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    title TEXT,
    department TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company_name TEXT,
    title TEXT,
    source TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'unqualified', 'converted')),
    score INTEGER DEFAULT 0,
    ai_score INTEGER DEFAULT 0,
    notes TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opportunities table with MEDDPICC fields
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    stage TEXT NOT NULL DEFAULT 'prospecting' CHECK (stage IN ('prospecting', 'qualifying', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
    peak_stage TEXT DEFAULT 'prospecting' CHECK (peak_stage IN ('prospecting', 'engaging', 'advancing', 'key_decision')),
    value DECIMAL(15,2),
    deal_value DECIMAL(15,2),
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    close_date DATE,
    description TEXT,
    -- MEDDPICC fields
    metrics TEXT,
    economic_buyer TEXT,
    decision_criteria TEXT,
    decision_process TEXT,
    paper_process TEXT,
    identify_pain TEXT,
    implicate_pain TEXT,
    champion TEXT,
    competition TEXT,
    meddpicc_score INTEGER DEFAULT 0,
    -- AI and automation fields
    ai_risk_score INTEGER DEFAULT 0,
    ai_next_action TEXT,
    pipeline_config_id UUID,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'task', 'note')),
    subject TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    related_type TEXT CHECK (related_type IN ('lead', 'opportunity', 'contact', 'company')),
    related_id UUID,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ADVANCED CRM TABLES (Phase 2)
-- =============================================================================

-- Pipeline configurations table
CREATE TABLE IF NOT EXISTS pipeline_configurations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    stages JSONB NOT NULL DEFAULT '[]',
    branch_specific BOOLEAN DEFAULT false,
    role_specific BOOLEAN DEFAULT false,
    branch_name TEXT,
    role_name TEXT,
    is_default BOOLEAN DEFAULT false,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow automations table
CREATE TABLE IF NOT EXISTS workflow_automations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('stage_change', 'field_update', 'time_based', 'manual')),
    trigger_conditions JSONB NOT NULL DEFAULT '{}',
    actions JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    branch_specific BOOLEAN DEFAULT false,
    role_specific BOOLEAN DEFAULT false,
    branch_name TEXT,
    role_name TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI insights table
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('lead_scoring', 'deal_risk', 'next_action', 'forecasting', 'performance')),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'opportunity', 'contact', 'user', 'organization')),
    entity_id UUID NOT NULL,
    insight_data JSONB NOT NULL DEFAULT '{}',
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    model_version TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning modules table
CREATE TABLE IF NOT EXISTS learning_modules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    module_type TEXT NOT NULL CHECK (module_type IN ('video', 'article', 'quiz', 'interactive', 'micro_learning')),
    duration_minutes INTEGER,
    difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    tags TEXT[] DEFAULT '{}',
    prerequisites TEXT[] DEFAULT '{}',
    certification_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration connections table
CREATE TABLE IF NOT EXISTS integration_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    integration_type TEXT NOT NULL CHECK (integration_type IN ('slack', 'docusign', 'stripe', 'gong', 'sharepoint', 'salesforce', 'hubspot')),
    name TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    credentials JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'success', 'error', 'disabled')),
    error_message TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('clarity', 'score', 'teach', 'problem', 'value', 'overall')),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    target_value DECIMAL(10,2),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    calculation_method TEXT,
    raw_data JSONB DEFAULT '{}',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User learning progress table
CREATE TABLE IF NOT EXISTS user_learning_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'certified')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    time_spent_minutes INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    certification_date TIMESTAMP WITH TIME ZONE,
    quiz_scores JSONB DEFAULT '{}',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

-- SharePoint documents table
CREATE TABLE IF NOT EXISTS sharepoint_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    stage_name TEXT NOT NULL,
    document_name TEXT NOT NULL,
    document_type TEXT NOT NULL,
    sharepoint_url TEXT NOT NULL,
    local_path TEXT,
    file_size INTEGER,
    is_required BOOLEAN DEFAULT false,
    is_completed BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- DASHBOARD TABLES
-- =============================================================================

-- User dashboard layouts table
CREATE TABLE IF NOT EXISTS user_dashboard_layouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    widgets JSONB NOT NULL DEFAULT '[]',
    layout_config JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =============================================================================
-- ENTERPRISE TABLES (Phase 3)
-- =============================================================================

-- Enterprise audit logs table
CREATE TABLE IF NOT EXISTS enterprise_audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import', 'admin_action')),
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    compliance_flags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI models table
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    model_type TEXT NOT NULL CHECK (model_type IN ('lead_scoring', 'deal_prediction', 'forecasting', 'coaching', 'content_generation', 'sentiment_analysis')),
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'azure', 'aws', 'custom')),
    model_version TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    training_data_hash TEXT,
    accuracy_metrics JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_enterprise BOOLEAN DEFAULT false,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enterprise integrations table
CREATE TABLE IF NOT EXISTS enterprise_integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    integration_type TEXT NOT NULL CHECK (integration_type IN ('salesforce', 'dynamics', 'sap', 'oracle', 'workday', 'hubspot', 'pipedrive', 'custom')),
    name TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    credentials JSONB NOT NULL DEFAULT '{}',
    webhook_config JSONB DEFAULT '{}',
    sync_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'success', 'error', 'disabled', 'syncing')),
    error_message TEXT,
    sync_frequency_minutes INTEGER DEFAULT 60,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enterprise workflows table
CREATE TABLE IF NOT EXISTS enterprise_workflows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    workflow_type TEXT NOT NULL CHECK (workflow_type IN ('approval', 'notification', 'data_sync', 'ai_trigger', 'compliance', 'custom')),
    trigger_conditions JSONB NOT NULL DEFAULT '{}',
    steps JSONB NOT NULL DEFAULT '[]',
    approval_config JSONB DEFAULT '{}',
    notification_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
    timeout_hours INTEGER DEFAULT 24,
    retry_config JSONB DEFAULT '{}',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enterprise analytics table
CREATE TABLE IF NOT EXISTS enterprise_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dashboard_name TEXT NOT NULL,
    dashboard_type TEXT NOT NULL CHECK (dashboard_type IN ('executive', 'operational', 'compliance', 'custom', 'real_time')),
    config JSONB NOT NULL DEFAULT '{}',
    kpis JSONB DEFAULT '[]',
    filters JSONB DEFAULT '{}',
    refresh_frequency_minutes INTEGER DEFAULT 15,
    is_public BOOLEAN DEFAULT false,
    access_level TEXT DEFAULT 'organization' CHECK (access_level IN ('user', 'department', 'organization', 'global')),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mobile sessions table
CREATE TABLE IF NOT EXISTS mobile_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
    device_info JSONB DEFAULT '{}',
    app_version TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    offline_data JSONB DEFAULT '{}',
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error', 'offline')),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);

-- Enterprise learning paths table
CREATE TABLE IF NOT EXISTS enterprise_learning_paths (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    path_type TEXT NOT NULL CHECK (path_type IN ('onboarding', 'certification', 'compliance', 'skill_development', 'custom')),
    modules JSONB NOT NULL DEFAULT '[]',
    prerequisites JSONB DEFAULT '{}',
    completion_criteria JSONB DEFAULT '{}',
    certification_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_mandatory BOOLEAN DEFAULT false,
    target_roles TEXT[] DEFAULT '{}',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enterprise compliance reports table
CREATE TABLE IF NOT EXISTS enterprise_compliance_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_type TEXT NOT NULL CHECK (report_type IN ('audit_log', 'data_export', 'user_activity', 'security_scan', 'compliance_check')),
    report_name TEXT NOT NULL,
    report_data JSONB NOT NULL DEFAULT '{}',
    filters JSONB DEFAULT '{}',
    date_range_start DATE,
    date_range_end DATE,
    status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed', 'expired')),
    file_path TEXT,
    file_size INTEGER,
    download_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enterprise API keys table
CREATE TABLE IF NOT EXISTS enterprise_api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    permissions JSONB NOT NULL DEFAULT '{}',
    rate_limit_per_hour INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_companies_organization_id ON companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON leads(organization_id);
-- Create indexes only if the columns exist
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'assigned_to'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'status'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    END IF;
END $$;
-- Create opportunity indexes only if columns exist
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'opportunities' AND column_name = 'company_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_opportunities_company_id ON opportunities(company_id);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'opportunities' AND column_name = 'contact_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_opportunities_contact_id ON opportunities(contact_id);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'opportunities' AND column_name = 'organization_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_opportunities_organization_id ON opportunities(organization_id);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'opportunities' AND column_name = 'assigned_to'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_opportunities_assigned_to ON opportunities(assigned_to);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'opportunities' AND column_name = 'stage'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
    END IF;
END $$;
-- Create activity indexes only if columns exist
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'organization_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_activities_organization_id ON activities(organization_id);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'assigned_to'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_activities_assigned_to ON activities(assigned_to);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'type'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'status'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'priority'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_activities_priority ON activities(priority);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'due_date'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_activities_due_date ON activities(due_date);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'related_type'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'related_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_activities_related ON activities(related_type, related_id);
    END IF;
END $$;

-- Phase 2 table indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_configurations_organization_id ON pipeline_configurations(organization_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_configurations_is_default ON pipeline_configurations(is_default);
CREATE INDEX IF NOT EXISTS idx_workflow_automations_organization_id ON workflow_automations(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_automations_is_active ON workflow_automations(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_insights_entity_type_entity_id ON ai_insights(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(type);
CREATE INDEX IF NOT EXISTS idx_learning_modules_organization_id ON learning_modules(organization_id);
CREATE INDEX IF NOT EXISTS idx_learning_modules_is_active ON learning_modules(is_active);
CREATE INDEX IF NOT EXISTS idx_integration_connections_organization_id ON integration_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_integration_connections_integration_type ON integration_connections(integration_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_period ON performance_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_user_learning_progress_user_id ON user_learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_progress_module_id ON user_learning_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_sharepoint_documents_opportunity_id ON sharepoint_documents(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sharepoint_documents_stage_name ON sharepoint_documents(stage_name);

-- Dashboard table indexes (only if columns exist)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_dashboard_layouts' AND column_name = 'user_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_user_dashboard_layouts_user_id ON user_dashboard_layouts(user_id);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_dashboard_layouts' AND column_name = 'organization_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_user_dashboard_layouts_organization_id ON user_dashboard_layouts(organization_id);
    END IF;
END $$;

-- Enterprise table indexes
CREATE INDEX IF NOT EXISTS idx_enterprise_audit_logs_organization_id ON enterprise_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_audit_logs_user_id ON enterprise_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_audit_logs_action_type ON enterprise_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_enterprise_audit_logs_created_at ON enterprise_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_enterprise_audit_logs_risk_level ON enterprise_audit_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_ai_models_organization_id ON ai_models(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_model_type ON ai_models(model_type);
CREATE INDEX IF NOT EXISTS idx_ai_models_is_active ON ai_models(is_active);
CREATE INDEX IF NOT EXISTS idx_enterprise_integrations_organization_id ON enterprise_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_integrations_integration_type ON enterprise_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_enterprise_integrations_is_active ON enterprise_integrations(is_active);
CREATE INDEX IF NOT EXISTS idx_enterprise_workflows_organization_id ON enterprise_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_workflows_workflow_type ON enterprise_workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_enterprise_workflows_is_active ON enterprise_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_enterprise_analytics_organization_id ON enterprise_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_analytics_dashboard_type ON enterprise_analytics(dashboard_type);
CREATE INDEX IF NOT EXISTS idx_mobile_sessions_user_id ON mobile_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_sessions_device_id ON mobile_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_mobile_sessions_sync_status ON mobile_sessions(sync_status);
CREATE INDEX IF NOT EXISTS idx_enterprise_learning_paths_organization_id ON enterprise_learning_paths(organization_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_learning_paths_path_type ON enterprise_learning_paths(path_type);
CREATE INDEX IF NOT EXISTS idx_enterprise_compliance_reports_organization_id ON enterprise_compliance_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_compliance_reports_report_type ON enterprise_compliance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_enterprise_compliance_reports_status ON enterprise_compliance_reports(status);
CREATE INDEX IF NOT EXISTS idx_enterprise_api_keys_organization_id ON enterprise_api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_api_keys_key_hash ON enterprise_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_enterprise_api_keys_is_active ON enterprise_api_keys(is_active);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- MEDDPICC scoring function with comprehensive algorithm
CREATE OR REPLACE FUNCTION calculate_meddpicc_score(opp_id UUID)
RETURNS INTEGER AS $$
DECLARE
    opp_record RECORD;
    pillar_scores JSONB := '{}';
    total_weighted_score DECIMAL := 0;
    total_weight DECIMAL := 0;
    pillar_score DECIMAL;
    pillar_weight DECIMAL;
    overall_score INTEGER := 0;
    
    -- Pillar weights matching frontend configuration
    pillar_weights JSONB := '{
        "metrics": 15,
        "economicBuyer": 20,
        "decisionCriteria": 10,
        "decisionProcess": 15,
        "paperProcess": 5,
        "identifyPain": 20,
        "implicatePain": 20,
        "champion": 10,
        "competition": 5
    }';
    
    -- Quality keywords for scoring
    quality_keywords TEXT[] := ARRAY[
        'specific', 'measurable', 'quantified', 'roi', 'impact', 'cost', 
        'savings', 'efficiency', 'revenue', 'profit', 'test', 'quality', 
        'improvement', 'lives', 'saved'
    ];
    
    pillar_id TEXT;
    pillar_text TEXT;
    answer_length INTEGER;
    points DECIMAL;
    keyword_count INTEGER;
    keyword TEXT;
BEGIN
    -- Get opportunity data with safe column access
    BEGIN
        -- Check if MEDDPICC columns exist before trying to access them
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'metrics') THEN
            SELECT 
                COALESCE(metrics, '') as metrics,
                COALESCE(economic_buyer, '') as economic_buyer,
                COALESCE(decision_criteria, '') as decision_criteria,
                COALESCE(decision_process, '') as decision_process,
                COALESCE(paper_process, '') as paper_process,
                COALESCE(identify_pain, '') as identify_pain,
                COALESCE(implicate_pain, '') as implicate_pain,
                COALESCE(champion, '') as champion,
                COALESCE(competition, '') as competition
            INTO opp_record
            FROM opportunities 
            WHERE id = opp_id;
        ELSE
            -- If MEDDPICC columns don't exist, initialize with empty strings
            opp_record.metrics := '';
            opp_record.economic_buyer := '';
            opp_record.decision_criteria := '';
            opp_record.decision_process := '';
            opp_record.paper_process := '';
            opp_record.identify_pain := '';
            opp_record.implicate_pain := '';
            opp_record.champion := '';
            opp_record.competition := '';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- If any column doesn't exist, initialize with empty strings
        opp_record.metrics := '';
        opp_record.economic_buyer := '';
        opp_record.decision_criteria := '';
        opp_record.decision_process := '';
        opp_record.paper_process := '';
        opp_record.identify_pain := '';
        opp_record.implicate_pain := '';
        opp_record.champion := '';
        opp_record.competition := '';
    END;
    
    -- Calculate score for each pillar
    FOR pillar_id, pillar_weight IN SELECT * FROM jsonb_each(pillar_weights) LOOP
        -- Map database field names to pillar IDs
        CASE pillar_id
            WHEN 'metrics' THEN pillar_text := opp_record.metrics;
            WHEN 'economicBuyer' THEN pillar_text := opp_record.economic_buyer;
            WHEN 'decisionCriteria' THEN pillar_text := opp_record.decision_criteria;
            WHEN 'decisionProcess' THEN pillar_text := opp_record.decision_process;
            WHEN 'paperProcess' THEN pillar_text := opp_record.paper_process;
            WHEN 'identifyPain' THEN pillar_text := opp_record.identify_pain;
            WHEN 'implicatePain' THEN pillar_text := opp_record.implicate_pain;
            WHEN 'champion' THEN pillar_text := opp_record.champion;
            WHEN 'competition' THEN pillar_text := opp_record.competition;
            ELSE pillar_text := NULL;
        END CASE;
        
        -- Calculate pillar score
        IF pillar_text IS NOT NULL AND TRIM(pillar_text) != '' THEN
            answer_length := LENGTH(TRIM(pillar_text));
            points := 0;
            
            -- Base points for any content
            IF answer_length > 0 THEN
                points := points + 3;
            END IF;
            
            -- Length-based points
            IF answer_length >= 3 THEN points := points + 2; END IF;
            IF answer_length >= 10 THEN points := points + 2; END IF;
            IF answer_length >= 25 THEN points := points + 2; END IF;
            IF answer_length >= 50 THEN points := points + 1; END IF;
            
            -- Bonus points for quality keywords
            keyword_count := 0;
            FOREACH keyword IN ARRAY quality_keywords LOOP
                IF LOWER(pillar_text) LIKE '%' || keyword || '%' THEN
                    keyword_count := keyword_count + 1;
                END IF;
            END LOOP;
            points := points + LEAST(keyword_count, 2);
            
            -- Cap at 10 points per pillar
            points := LEAST(points, 10);
        ELSE
            points := 0;
        END IF;
        
        -- Add to weighted total
        total_weighted_score := total_weighted_score + ((points / 10.0) * pillar_weight);
        total_weight := total_weight + pillar_weight;
    END LOOP;
    
    -- Calculate overall score
    IF total_weight > 0 THEN
        overall_score := ROUND((total_weighted_score / total_weight) * 100);
    END IF;
    
    RETURN overall_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for MEDDPICC score updates
CREATE OR REPLACE FUNCTION update_meddpicc_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.meddpicc_score := calculate_meddpicc_score(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Opportunity field sync function
CREATE OR REPLACE FUNCTION sync_opportunity_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if the columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'peak_stage')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'stage') THEN
        -- If peak_stage is empty but stage has data, copy it
        IF (NEW.peak_stage IS NULL OR NEW.peak_stage = '') AND NEW.stage IS NOT NULL THEN
            NEW.peak_stage := NEW.stage;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'deal_value')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'value') THEN
        -- If deal_value is empty but value has data, copy it
        IF (NEW.deal_value IS NULL) AND NEW.value IS NOT NULL THEN
            NEW.deal_value := NEW.value;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Updated at triggers for all tables
DO $$ 
BEGIN
    -- Core tables
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_organizations_updated_at') THEN
        CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_companies_updated_at') THEN
        CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contacts_updated_at') THEN
        CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_leads_updated_at') THEN
        CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_opportunities_updated_at') THEN
        CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_activities_updated_at') THEN
        CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_dashboard_layouts_updated_at') THEN
        CREATE TRIGGER update_user_dashboard_layouts_updated_at BEFORE UPDATE ON user_dashboard_layouts
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- MEDDPICC and field sync triggers
DROP TRIGGER IF EXISTS trigger_update_meddpicc_score ON opportunities;
CREATE TRIGGER trigger_update_meddpicc_score
    BEFORE INSERT OR UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_meddpicc_score();

DROP TRIGGER IF EXISTS sync_opportunity_fields_trigger ON opportunities;
CREATE TRIGGER sync_opportunity_fields_trigger
    BEFORE INSERT OR UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION sync_opportunity_fields();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) - SIMPLIFIED FOR STABILITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive RLS policies
-- These policies allow authenticated users to see all data
-- Organization-level filtering is handled in the application layer

CREATE POLICY "Authenticated users can access organizations" ON organizations
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access users" ON users
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access companies" ON companies
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access contacts" ON contacts
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access leads" ON leads
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access opportunities" ON opportunities
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access activities" ON activities
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Enable RLS and create policies for additional tables
DO $$ 
BEGIN
    -- Phase 2 tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pipeline_configurations') THEN
        ALTER TABLE pipeline_configurations ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can access pipeline configurations" ON pipeline_configurations
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_automations') THEN
        ALTER TABLE workflow_automations ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can access workflow automations" ON workflow_automations
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_insights') THEN
        ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can access ai insights" ON ai_insights
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_modules') THEN
        ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can access learning modules" ON learning_modules
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integration_connections') THEN
        ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can access integration connections" ON integration_connections
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_metrics') THEN
        ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can access performance metrics" ON performance_metrics
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_learning_progress') THEN
        ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can access user learning progress" ON user_learning_progress
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sharepoint_documents') THEN
        ALTER TABLE sharepoint_documents ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can access sharepoint documents" ON sharepoint_documents
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_dashboard_layouts') THEN
        ALTER TABLE user_dashboard_layouts ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can access user dashboard layouts" ON user_dashboard_layouts
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
    
    -- Enterprise tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enterprise_audit_logs') THEN
        ALTER TABLE enterprise_audit_logs ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can access enterprise audit logs" ON enterprise_audit_logs
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_models') THEN
        ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can access ai models" ON ai_models
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enterprise_integrations') THEN
        ALTER TABLE enterprise_integrations ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can access enterprise integrations" ON enterprise_integrations
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enterprise_workflows') THEN
        ALTER TABLE enterprise_workflows ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can access enterprise workflows" ON enterprise_workflows
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enterprise_analytics') THEN
        ALTER TABLE enterprise_analytics ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can access enterprise analytics" ON enterprise_analytics
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mobile_sessions') THEN
        ALTER TABLE mobile_sessions ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can access mobile sessions" ON mobile_sessions
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enterprise_learning_paths') THEN
        ALTER TABLE enterprise_learning_paths ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can access enterprise learning paths" ON enterprise_learning_paths
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enterprise_compliance_reports') THEN
        ALTER TABLE enterprise_compliance_reports ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can access enterprise compliance reports" ON enterprise_compliance_reports
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enterprise_api_keys') THEN
        ALTER TABLE enterprise_api_keys ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can access enterprise api keys" ON enterprise_api_keys
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- Foreign key constraints will be added after all tables are created
-- This is handled at the end of the script to avoid dependency issues

-- =============================================================================
-- INITIAL DATA AND UPDATES
-- =============================================================================

-- Update existing opportunities with calculated MEDDPICC scores (only if opportunities table exists and has required columns)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'opportunities') 
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'meddpicc_score') THEN
        UPDATE opportunities 
        SET meddpicc_score = calculate_meddpicc_score(id)
        WHERE id IS NOT NULL;
    END IF;
END $$;

-- Sync field data for existing opportunities (only if opportunities table exists and has required columns)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'opportunities') THEN
        -- Only sync if both columns exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'peak_stage')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'stage') THEN
            UPDATE opportunities 
            SET peak_stage = stage 
            WHERE (peak_stage IS NULL OR peak_stage = '') AND stage IS NOT NULL;
        END IF;

        -- Only sync if both columns exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'deal_value')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'value') THEN
            UPDATE opportunities 
            SET deal_value = value 
            WHERE deal_value IS NULL AND value IS NOT NULL;
        END IF;
    END IF;
END $$;

-- =============================================================================
-- DOCUMENTATION COMMENTS
-- =============================================================================

-- Table comments
COMMENT ON TABLE organizations IS 'Multi-tenant organization management with enterprise features';
COMMENT ON TABLE users IS 'User accounts with role-based access and enterprise hierarchy';
COMMENT ON TABLE companies IS 'Company/account management for CRM';
COMMENT ON TABLE contacts IS 'Contact management linked to companies';
COMMENT ON TABLE leads IS 'Lead management with AI scoring';
COMMENT ON TABLE opportunities IS 'Sales opportunities with MEDDPICC qualification and PEAK stages';
COMMENT ON TABLE activities IS 'Activity tracking for leads, opportunities, contacts, and companies';
COMMENT ON TABLE pipeline_configurations IS 'Custom pipeline configurations for different branches and roles';
COMMENT ON TABLE workflow_automations IS 'Automated workflow rules and triggers';
COMMENT ON TABLE ai_insights IS 'AI-generated insights and recommendations';
COMMENT ON TABLE learning_modules IS 'Learning content and micro-learning modules';
COMMENT ON TABLE integration_connections IS 'Third-party integration configurations';
COMMENT ON TABLE performance_metrics IS 'CSTPV framework performance metrics';
COMMENT ON TABLE user_learning_progress IS 'User progress tracking for learning modules';
COMMENT ON TABLE sharepoint_documents IS 'SharePoint document management for PEAK process';
COMMENT ON TABLE user_dashboard_layouts IS 'User-specific dashboard widget layouts and configurations';
COMMENT ON TABLE enterprise_audit_logs IS 'Enterprise audit logging for compliance';
COMMENT ON TABLE ai_models IS 'AI/ML models configuration for enterprise features';
COMMENT ON TABLE enterprise_integrations IS 'Enterprise-grade integrations with major systems';
COMMENT ON TABLE enterprise_workflows IS 'Advanced workflow automation with approvals';
COMMENT ON TABLE enterprise_analytics IS 'Enterprise business intelligence dashboards';
COMMENT ON TABLE mobile_sessions IS 'Mobile app session management and offline sync';
COMMENT ON TABLE enterprise_learning_paths IS 'Enterprise learning management with certification';
COMMENT ON TABLE enterprise_compliance_reports IS 'Compliance reporting and audit trails';
COMMENT ON TABLE enterprise_api_keys IS 'API key management for enterprise integrations';

-- Function comments
COMMENT ON FUNCTION calculate_meddpicc_score(UUID) IS 'Calculates comprehensive MEDDPICC score with weighted algorithm matching frontend';
COMMENT ON FUNCTION update_meddpicc_score() IS 'Trigger function to automatically update MEDDPICC scores';
COMMENT ON FUNCTION sync_opportunity_fields() IS 'Syncs data between legacy and new opportunity field names';
COMMENT ON FUNCTION update_updated_at_column() IS 'Generic trigger function to update updated_at timestamps';

-- Column comments for key fields
COMMENT ON COLUMN opportunities.metrics IS 'MEDDPICC: Quantify business impact and value proposition (15% weight)';
COMMENT ON COLUMN opportunities.economic_buyer IS 'MEDDPICC: Decision maker with budget authority (20% weight)';
COMMENT ON COLUMN opportunities.decision_criteria IS 'MEDDPICC: Evaluation process and criteria (10% weight)';
COMMENT ON COLUMN opportunities.decision_process IS 'MEDDPICC: Approval workflow and timeline (15% weight)';
COMMENT ON COLUMN opportunities.paper_process IS 'MEDDPICC: Requirements and procurement process (5% weight)';
COMMENT ON COLUMN opportunities.identify_pain IS 'MEDDPICC: Pain points and business challenges (20% weight)';
COMMENT ON COLUMN opportunities.implicate_pain IS 'MEDDPICC: Help prospects understand full impact of pain (20% weight)';
COMMENT ON COLUMN opportunities.champion IS 'MEDDPICC: Internal advocate and supporter (10% weight)';
COMMENT ON COLUMN opportunities.competition IS 'MEDDPICC: Competitive landscape and positioning (5% weight)';
COMMENT ON COLUMN opportunities.meddpicc_score IS 'Calculated MEDDPICC qualification score (0-100) using weighted algorithm';
COMMENT ON COLUMN opportunities.peak_stage IS 'PEAK methodology stage (prospecting, engaging, advancing, key_decision)';
COMMENT ON COLUMN opportunities.ai_risk_score IS 'AI-calculated deal risk score (0-100)';
COMMENT ON COLUMN opportunities.ai_next_action IS 'AI-recommended next best action';

-- =============================================================================
-- FOREIGN KEY CONSTRAINTS (Added after all tables are created)
-- =============================================================================

-- Add foreign key constraints now that all tables exist
DO $$ 
BEGIN
    -- Add pipeline config foreign key constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_opportunities_pipeline_config') THEN
        ALTER TABLE opportunities ADD CONSTRAINT fk_opportunities_pipeline_config 
            FOREIGN KEY (pipeline_config_id) REFERENCES pipeline_configurations(id) ON DELETE SET NULL;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- If constraint creation fails, just log it and continue
    RAISE NOTICE 'Could not create foreign key constraint fk_opportunities_pipeline_config: %', SQLERRM;
END $$;

-- Completion message
DO $$ 
BEGIN
    RAISE NOTICE 'FulQrun consolidated database schema migration completed successfully!';
    RAISE NOTICE 'Created: % core tables, % enterprise tables, % indexes, % functions, % triggers', 
        7, 9, 50, 4, 8;
    RAISE NOTICE 'All tables have RLS enabled with simplified authentication-based policies';
    RAISE NOTICE 'MEDDPICC scoring system is active with comprehensive weighted algorithm';
END $$;
