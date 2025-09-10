-- Phase 2 Database Schema Extensions (Fixed)
-- This migration adds all Phase 2 tables and fields for advanced CRM functionality
-- Uses IF NOT EXISTS to prevent conflicts with existing tables

-- Add new fields to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS learning_progress JSONB DEFAULT '{}';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS pipeline_config_id UUID;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS ai_risk_score INTEGER DEFAULT 0;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS ai_next_action TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score INTEGER DEFAULT 0;

-- Create pipeline_configurations table
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

-- Create workflow_automations table
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

-- Create ai_insights table
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

-- Create learning_modules table
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

-- Create integration_connections table
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

-- Create performance_metrics table
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

-- Create user_learning_progress table
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

-- Create sharepoint_documents table
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

-- Create indexes for better performance (only if they don't exist)
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

-- Enable Row Level Security on new tables (only if not already enabled)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'pipeline_configurations' AND rowsecurity = true) THEN
        ALTER TABLE pipeline_configurations ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'workflow_automations' AND rowsecurity = true) THEN
        ALTER TABLE workflow_automations ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_insights' AND rowsecurity = true) THEN
        ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'learning_modules' AND rowsecurity = true) THEN
        ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'integration_connections' AND rowsecurity = true) THEN
        ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'performance_metrics' AND rowsecurity = true) THEN
        ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_learning_progress' AND rowsecurity = true) THEN
        ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'sharepoint_documents' AND rowsecurity = true) THEN
        ALTER TABLE sharepoint_documents ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies for new tables (only if they don't exist)
DO $$ 
BEGIN
    -- Pipeline configurations policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pipeline_configurations' AND policyname = 'Users can view organization pipeline configurations') THEN
        CREATE POLICY "Users can view organization pipeline configurations" ON pipeline_configurations
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Workflow automations policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workflow_automations' AND policyname = 'Users can view organization workflow automations') THEN
        CREATE POLICY "Users can view organization workflow automations" ON workflow_automations
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- AI insights policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_insights' AND policyname = 'Users can view organization AI insights') THEN
        CREATE POLICY "Users can view organization AI insights" ON ai_insights
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Learning modules policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'learning_modules' AND policyname = 'Users can view organization learning modules') THEN
        CREATE POLICY "Users can view organization learning modules" ON learning_modules
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Integration connections policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'integration_connections' AND policyname = 'Users can view organization integration connections') THEN
        CREATE POLICY "Users can view organization integration connections" ON integration_connections
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- Performance metrics policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'performance_metrics' AND policyname = 'Users can view organization performance metrics') THEN
        CREATE POLICY "Users can view organization performance metrics" ON performance_metrics
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- User learning progress policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_learning_progress' AND policyname = 'Users can view organization learning progress') THEN
        CREATE POLICY "Users can view organization learning progress" ON user_learning_progress
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;

    -- SharePoint documents policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sharepoint_documents' AND policyname = 'Users can view organization SharePoint documents') THEN
        CREATE POLICY "Users can view organization SharePoint documents" ON sharepoint_documents
            FOR ALL USING (organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            ));
    END IF;
END $$;

-- Add updated_at triggers for new tables (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_pipeline_configurations_updated_at') THEN
        CREATE TRIGGER update_pipeline_configurations_updated_at BEFORE UPDATE ON pipeline_configurations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_workflow_automations_updated_at') THEN
        CREATE TRIGGER update_workflow_automations_updated_at BEFORE UPDATE ON workflow_automations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_insights_updated_at') THEN
        CREATE TRIGGER update_ai_insights_updated_at BEFORE UPDATE ON ai_insights
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_learning_modules_updated_at') THEN
        CREATE TRIGGER update_learning_modules_updated_at BEFORE UPDATE ON learning_modules
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_integration_connections_updated_at') THEN
        CREATE TRIGGER update_integration_connections_updated_at BEFORE UPDATE ON integration_connections
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_performance_metrics_updated_at') THEN
        CREATE TRIGGER update_performance_metrics_updated_at BEFORE UPDATE ON performance_metrics
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_learning_progress_updated_at') THEN
        CREATE TRIGGER update_user_learning_progress_updated_at BEFORE UPDATE ON user_learning_progress
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sharepoint_documents_updated_at') THEN
        CREATE TRIGGER update_sharepoint_documents_updated_at BEFORE UPDATE ON sharepoint_documents
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add foreign key constraint for opportunities.pipeline_config_id (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_opportunities_pipeline_config') THEN
        ALTER TABLE opportunities ADD CONSTRAINT fk_opportunities_pipeline_config 
            FOREIGN KEY (pipeline_config_id) REFERENCES pipeline_configurations(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE pipeline_configurations IS 'Custom pipeline stage configurations for different branches and roles';
COMMENT ON TABLE workflow_automations IS 'Automated workflow rules and triggers for CRM processes';
COMMENT ON TABLE ai_insights IS 'AI-generated insights and recommendations for leads, opportunities, and users';
COMMENT ON TABLE learning_modules IS 'Learning content and micro-learning modules for skill development';
COMMENT ON TABLE integration_connections IS 'Third-party integration configurations and credentials';
COMMENT ON TABLE performance_metrics IS 'CSTPV framework performance metrics and KPIs';
COMMENT ON TABLE user_learning_progress IS 'User progress tracking for learning modules and certifications';
COMMENT ON TABLE sharepoint_documents IS 'SharePoint document management for PEAK process stages';

COMMENT ON COLUMN users.learning_progress IS 'User learning progress and certification data';
COMMENT ON COLUMN opportunities.pipeline_config_id IS 'Reference to custom pipeline configuration';
COMMENT ON COLUMN opportunities.ai_risk_score IS 'AI-calculated deal risk score (0-100)';
COMMENT ON COLUMN opportunities.ai_next_action IS 'AI-recommended next best action';
COMMENT ON COLUMN leads.ai_score IS 'AI-calculated lead score (0-100)';
