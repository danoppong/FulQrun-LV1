-- Phase 3 Enterprise Database Schema Extensions
-- This migration adds enterprise-grade features for multi-tenancy, AI models, global features, and compliance
-- Safe to run on existing databases

-- Add enterprise fields to existing tables
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS enterprise_tier TEXT DEFAULT 'standard' CHECK (enterprise_tier IN ('standard', 'professional', 'enterprise', 'enterprise_plus'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'us-east-1';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'USD';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS compliance_level TEXT DEFAULT 'standard' CHECK (compliance_level IN ('standard', 'soc2', 'gdpr', 'hipaa', 'fedramp'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 50;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS features_enabled JSONB DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sso_provider TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sso_config JSONB DEFAULT '{}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS enterprise_role TEXT DEFAULT 'user' CHECK (enterprise_role IN ('user', 'manager', 'admin', 'super_admin'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cost_center TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_timeout_minutes INTEGER DEFAULT 480;

-- Create enterprise_audit_logs table for compliance
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

-- Create ai_models table for enterprise AI capabilities
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

-- Create enterprise_integrations table for advanced integrations
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

-- Create enterprise_workflows table for advanced workflow automation
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

-- Create enterprise_analytics table for advanced BI
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

-- Create mobile_sessions table for mobile app management
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

-- Create enterprise_learning_paths table for advanced LMS
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

-- Create enterprise_compliance_reports table
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

-- Create enterprise_api_keys table for API management
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

-- Create indexes for enterprise tables
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

-- Enable Row Level Security on enterprise tables
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'enterprise_audit_logs' AND rowsecurity = true) THEN
        ALTER TABLE enterprise_audit_logs ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_models' AND rowsecurity = true) THEN
        ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'enterprise_integrations' AND rowsecurity = true) THEN
        ALTER TABLE enterprise_integrations ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'enterprise_workflows' AND rowsecurity = true) THEN
        ALTER TABLE enterprise_workflows ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'enterprise_analytics' AND rowsecurity = true) THEN
        ALTER TABLE enterprise_analytics ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'mobile_sessions' AND rowsecurity = true) THEN
        ALTER TABLE mobile_sessions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'enterprise_learning_paths' AND rowsecurity = true) THEN
        ALTER TABLE enterprise_learning_paths ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'enterprise_compliance_reports' AND rowsecurity = true) THEN
        ALTER TABLE enterprise_compliance_reports ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'enterprise_api_keys' AND rowsecurity = true) THEN
        ALTER TABLE enterprise_api_keys ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies for enterprise tables
DO $$ 
BEGIN
    -- Enterprise audit logs policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enterprise_audit_logs' AND policyname = 'Users can view organization audit logs') THEN
        CREATE POLICY "Users can view organization audit logs" ON enterprise_audit_logs
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- AI models policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_models' AND policyname = 'Users can view organization AI models') THEN
        CREATE POLICY "Users can view organization AI models" ON ai_models
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Enterprise integrations policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enterprise_integrations' AND policyname = 'Users can view organization enterprise integrations') THEN
        CREATE POLICY "Users can view organization enterprise integrations" ON enterprise_integrations
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Enterprise workflows policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enterprise_workflows' AND policyname = 'Users can view organization enterprise workflows') THEN
        CREATE POLICY "Users can view organization enterprise workflows" ON enterprise_workflows
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Enterprise analytics policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enterprise_analytics' AND policyname = 'Users can view organization enterprise analytics') THEN
        CREATE POLICY "Users can view organization enterprise analytics" ON enterprise_analytics
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Mobile sessions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mobile_sessions' AND policyname = 'Users can view their mobile sessions') THEN
        CREATE POLICY "Users can view their mobile sessions" ON mobile_sessions
            FOR ALL USING (user_id = auth.uid() OR organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Enterprise learning paths policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enterprise_learning_paths' AND policyname = 'Users can view organization learning paths') THEN
        CREATE POLICY "Users can view organization learning paths" ON enterprise_learning_paths
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Enterprise compliance reports policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enterprise_compliance_reports' AND policyname = 'Users can view organization compliance reports') THEN
        CREATE POLICY "Users can view organization compliance reports" ON enterprise_compliance_reports
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Enterprise API keys policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enterprise_api_keys' AND policyname = 'Users can view organization API keys') THEN
        CREATE POLICY "Users can view organization API keys" ON enterprise_api_keys
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;
END $$;

-- Add updated_at triggers for enterprise tables
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_models_updated_at') THEN
        CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_enterprise_integrations_updated_at') THEN
        CREATE TRIGGER update_enterprise_integrations_updated_at BEFORE UPDATE ON enterprise_integrations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_enterprise_workflows_updated_at') THEN
        CREATE TRIGGER update_enterprise_workflows_updated_at BEFORE UPDATE ON enterprise_workflows
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_enterprise_analytics_updated_at') THEN
        CREATE TRIGGER update_enterprise_analytics_updated_at BEFORE UPDATE ON enterprise_analytics
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_mobile_sessions_updated_at') THEN
        CREATE TRIGGER update_mobile_sessions_updated_at BEFORE UPDATE ON mobile_sessions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_enterprise_learning_paths_updated_at') THEN
        CREATE TRIGGER update_enterprise_learning_paths_updated_at BEFORE UPDATE ON enterprise_learning_paths
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_enterprise_compliance_reports_updated_at') THEN
        CREATE TRIGGER update_enterprise_compliance_reports_updated_at BEFORE UPDATE ON enterprise_compliance_reports
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_enterprise_api_keys_updated_at') THEN
        CREATE TRIGGER update_enterprise_api_keys_updated_at BEFORE UPDATE ON enterprise_api_keys
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE enterprise_audit_logs IS 'Enterprise audit logging for compliance and security monitoring';
COMMENT ON TABLE ai_models IS 'AI/ML models configuration and management for enterprise features';
COMMENT ON TABLE enterprise_integrations IS 'Enterprise-grade integrations with major CRM and ERP systems';
COMMENT ON TABLE enterprise_workflows IS 'Advanced workflow automation with conditional logic and approvals';
COMMENT ON TABLE enterprise_analytics IS 'Enterprise business intelligence and analytics dashboards';
COMMENT ON TABLE mobile_sessions IS 'Mobile app session management and offline data synchronization';
COMMENT ON TABLE enterprise_learning_paths IS 'Enterprise learning management system with certification tracks';
COMMENT ON TABLE enterprise_compliance_reports IS 'Compliance reporting and audit trail management';
COMMENT ON TABLE enterprise_api_keys IS 'API key management for enterprise integrations and external access';

COMMENT ON COLUMN organizations.enterprise_tier IS 'Enterprise subscription tier (standard, professional, enterprise, enterprise_plus)';
COMMENT ON COLUMN organizations.region IS 'Deployment region for multi-region support';
COMMENT ON COLUMN organizations.currency_code IS 'Default currency for multi-currency support';
COMMENT ON COLUMN organizations.compliance_level IS 'Compliance requirements (standard, soc2, gdpr, hipaa, fedramp)';
COMMENT ON COLUMN organizations.max_users IS 'Maximum number of users allowed for this organization';
COMMENT ON COLUMN organizations.features_enabled IS 'Feature flags for enterprise capabilities';
COMMENT ON COLUMN users.enterprise_role IS 'Enterprise role hierarchy (user, manager, admin, super_admin)';
COMMENT ON COLUMN users.manager_id IS 'Manager relationship for organizational hierarchy';
COMMENT ON COLUMN users.mfa_enabled IS 'Multi-factor authentication status';
COMMENT ON COLUMN users.session_timeout_minutes IS 'Session timeout configuration for security';
