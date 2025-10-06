-- AI Lead Management Schema Migration
-- This migration adds AI-powered lead management capabilities to FulQrun
-- Safe to run on existing databases - includes all new tables and enhancements

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- AI LEAD MANAGEMENT TABLES
-- =============================================================================

-- ICP Profiles table
CREATE TABLE IF NOT EXISTS icp_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL DEFAULT '{}',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Lead Briefs table
CREATE TABLE IF NOT EXISTS lead_briefs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_type TEXT NOT NULL CHECK (lead_type IN ('account', 'contact')),
    geography TEXT NOT NULL CHECK (geography IN ('US', 'EU', 'UK', 'APAC')),
    industry TEXT,
    revenue_band TEXT CHECK (revenue_band IN ('<$10M', '$10–50M', '$50–250M', '$250M–$1B', '>$1B')),
    employee_band TEXT CHECK (employee_band IN ('1–50', '51–200', '201–1k', '1k–5k', '>5k')),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('PUBLIC', 'PRIVATE', 'NONPROFIT', 'OTHER')),
    technographics JSONB DEFAULT '[]'::jsonb,
    installed_tools_hints JSONB DEFAULT '[]'::jsonb,
    intent_keywords JSONB DEFAULT '[]'::jsonb,
    time_horizon TEXT CHECK (time_horizon IN ('NEAR_TERM', 'MID_TERM', 'LONG_TERM')),
    notes TEXT,
    icp_profile_id UUID NOT NULL REFERENCES icp_profiles(id),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'orchestrated')),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enhanced Accounts table for AI-generated accounts
CREATE TABLE IF NOT EXISTS ai_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    legal_name TEXT NOT NULL,
    known_as TEXT,
    domain TEXT,
    registry_ids JSONB, -- { "lei": "...", "duns": "..." }
    country TEXT,
    region TEXT CHECK (region IN ('US', 'EU', 'UK', 'APAC')),
    industry_code TEXT, -- NAICS/SIC
    revenue_band TEXT CHECK (revenue_band IN ('<$10M', '$10–50M', '$50–250M', '$250M–$1B', '>$1B')),
    employee_band TEXT CHECK (employee_band IN ('1–50', '51–200', '201–1k', '1k–5k', '>5k')),
    entity_type TEXT CHECK (entity_type IN ('PUBLIC', 'PRIVATE', 'NONPROFIT', 'OTHER')),
    account_embedding vector(1536),
    provenance JSONB DEFAULT '{}'::jsonb,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enhanced Contacts table for AI-generated contacts
CREATE TABLE IF NOT EXISTS ai_contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_id UUID REFERENCES ai_accounts(id),
    full_name TEXT NOT NULL,
    title TEXT,
    seniority TEXT CHECK (seniority IN ('C-LEVEL', 'VP', 'DIR', 'IC')),
    dept TEXT,
    linkedin_url TEXT,
    email_pattern_hint TEXT,
    email_status TEXT CHECK (email_status IN ('UNVERIFIED', 'VERIFIED', 'UNKNOWN')) DEFAULT 'UNKNOWN',
    phone_hint TEXT,
    contact_embedding vector(1536),
    provenance JSONB DEFAULT '{}'::jsonb,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Lead Qualifications table (excluding MEDDICC/MEDDPICC)
CREATE TABLE IF NOT EXISTS lead_qualifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    framework TEXT NOT NULL CHECK (framework IN ('BANT', 'CHAMP', 'GPCTBA/C&I', 'SPICED', 'ANUM', 'FAINT', 'NEAT', 'PACT', 'JTBD_FIT', 'FIVE_FIT', 'ABM', 'TARGETING')),
    status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'QUALIFIED', 'DISQUALIFIED')),
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (lead_id, framework)
);

-- Framework Evidence table
CREATE TABLE IF NOT EXISTS framework_evidence (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    framework TEXT NOT NULL,
    field TEXT NOT NULL,
    value JSONB NOT NULL,
    confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
    source TEXT, -- provider/model/user
    actor_user_id UUID REFERENCES users(id),
    justification TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enhanced Lead Scores table
CREATE TABLE IF NOT EXISTS enhanced_lead_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    fit NUMERIC NOT NULL,
    intent NUMERIC NOT NULL,
    engagement NUMERIC NOT NULL,
    viability NUMERIC NOT NULL,
    recency NUMERIC NOT NULL,
    composite NUMERIC NOT NULL,
    weights JSONB NOT NULL,
    segment JSONB NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration Providers table
CREATE TABLE IF NOT EXISTS integration_providers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider TEXT NOT NULL CHECK (provider IN ('CLEARBIT', 'ZOOMINFO', 'OPPORTUNITY', 'COMPLIANCE')),
    config JSONB NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Conversion Jobs table
CREATE TABLE IF NOT EXISTS conversion_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'SUCCEEDED', 'FAILED', 'ROLLED_BACK')),
    idempotency_key TEXT NOT NULL,
    correlation_id TEXT,
    request_payload JSONB NOT NULL,
    response_payload JSONB,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (organization_id, idempotency_key)
);

-- Opportunity References table
CREATE TABLE IF NOT EXISTS opportunity_references (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    external_opportunity_id TEXT NOT NULL,
    external_account_id TEXT,
    external_contact_id TEXT,
    mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (organization_id, external_opportunity_id)
);

-- =============================================================================
-- ENHANCE EXISTING LEADS TABLE
-- =============================================================================

-- Add AI-specific fields to existing leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type TEXT CHECK (lead_type IN ('account', 'contact'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES ai_accounts(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES ai_contacts(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS geography TEXT CHECK (geography IN ('US', 'EU', 'UK', 'APAC'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS revenue_band TEXT CHECK (revenue_band IN ('<$10M', '$10–50M', '$50–250M', '$250M–$1B', '>$1B'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS employee_band TEXT CHECK (employee_band IN ('1–50', '51–200', '201–1k', '1k–5k', '>5k'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS entity_type TEXT CHECK (entity_type IN ('PUBLIC', 'PRIVATE', 'NONPROFIT', 'OTHER'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS technographics JSONB DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS installed_tools_hints JSONB DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS intent_keywords JSONB DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS time_horizon TEXT CHECK (time_horizon IN ('NEAR_TERM', 'MID_TERM', 'LONG_TERM'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS icp_profile_id UUID REFERENCES icp_profiles(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS risk_flags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compliance JSONB DEFAULT '{}'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS postprocessing JSONB DEFAULT '{}'::jsonb;

-- Update status enum to include new AI states
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
    CHECK (status IN ('new', 'contacted', 'qualified', 'unqualified', 'converted', 'DRAFT', 'GENERATED', 'ENRICHED', 'QUALIFIED', 'CONVERTED', 'REJECTED'));

-- =============================================================================
-- ENHANCE EXISTING ACTIVITIES TABLE
-- =============================================================================

-- Add AI-specific fields to existing activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS before_data JSONB;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS after_data JSONB;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS reason TEXT;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- ICP Profiles indexes
CREATE INDEX IF NOT EXISTS idx_icp_profiles_organization ON icp_profiles(organization_id) WHERE deleted_at IS NULL;

-- Lead Briefs indexes
CREATE INDEX IF NOT EXISTS idx_lead_briefs_organization ON lead_briefs(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lead_briefs_status ON lead_briefs(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lead_briefs_icp_profile ON lead_briefs(icp_profile_id) WHERE deleted_at IS NULL;

-- AI Accounts indexes
CREATE UNIQUE INDEX IF NOT EXISTS ux_ai_accounts_domain_tenant ON ai_accounts(organization_id, lower(domain)) WHERE domain IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ai_accounts_industry ON ai_accounts(organization_id, industry_code);
CREATE INDEX IF NOT EXISTS idx_ai_accounts_embedding ON ai_accounts USING ivfflat (account_embedding vector_l2_ops) WITH (lists = 100);

-- AI Contacts indexes
CREATE INDEX IF NOT EXISTS idx_ai_contacts_account ON ai_contacts(account_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_ai_contacts_linkedin_tenant ON ai_contacts(organization_id, lower(linkedin_url)) WHERE linkedin_url IS NOT NULL AND deleted_at IS NULL;

-- Lead Qualifications indexes
CREATE INDEX IF NOT EXISTS idx_lead_qualifications_lead ON lead_qualifications(lead_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lead_qualifications_framework ON lead_qualifications(framework) WHERE deleted_at IS NULL;

-- Framework Evidence indexes
CREATE INDEX IF NOT EXISTS idx_evidence_lead_framework ON framework_evidence(lead_id, framework) WHERE deleted_at IS NULL;

-- Enhanced Lead Scores indexes
CREATE UNIQUE INDEX IF NOT EXISTS ux_scores_latest ON enhanced_lead_scores(organization_id, lead_id, created_at DESC);

-- Conversion Jobs indexes
CREATE INDEX IF NOT EXISTS idx_conversion_jobs_lead ON conversion_jobs(lead_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversion_jobs_status ON conversion_jobs(status) WHERE deleted_at IS NULL;

-- Opportunity References indexes
CREATE INDEX IF NOT EXISTS idx_opportunity_references_lead ON opportunity_references(lead_id) WHERE deleted_at IS NULL;

-- Enhanced leads table indexes
CREATE INDEX IF NOT EXISTS idx_leads_tenant_status ON leads(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_account_contact ON leads(account_id, contact_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_icp_profile ON leads(icp_profile_id) WHERE deleted_at IS NULL;

-- Enhanced activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id) WHERE deleted_at IS NULL;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all new tables
ALTER TABLE icp_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_references ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES FOR TENANT ISOLATION
-- =============================================================================

-- ICP Profiles policies
CREATE POLICY tenant_isolation_icp_profiles ON icp_profiles
    USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Lead Briefs policies
CREATE POLICY tenant_isolation_lead_briefs ON lead_briefs
    USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- AI Accounts policies
CREATE POLICY tenant_isolation_ai_accounts ON ai_accounts
    USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- AI Contacts policies
CREATE POLICY tenant_isolation_ai_contacts ON ai_contacts
    USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Lead Qualifications policies
CREATE POLICY tenant_isolation_lead_qualifications ON lead_qualifications
    USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Framework Evidence policies
CREATE POLICY tenant_isolation_framework_evidence ON framework_evidence
    USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Enhanced Lead Scores policies
CREATE POLICY tenant_isolation_enhanced_lead_scores ON enhanced_lead_scores
    USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Integration Providers policies
CREATE POLICY tenant_isolation_integration_providers ON integration_providers
    USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Conversion Jobs policies
CREATE POLICY tenant_isolation_conversion_jobs ON conversion_jobs
    USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Opportunity References policies
CREATE POLICY tenant_isolation_opportunity_references ON opportunity_references
    USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================================================

-- Create or replace function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_icp_profiles_updated_at BEFORE UPDATE ON icp_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_briefs_updated_at BEFORE UPDATE ON lead_briefs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_accounts_updated_at BEFORE UPDATE ON ai_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_contacts_updated_at BEFORE UPDATE ON ai_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_qualifications_updated_at BEFORE UPDATE ON lead_qualifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_framework_evidence_updated_at BEFORE UPDATE ON framework_evidence FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_providers_updated_at BEFORE UPDATE ON integration_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversion_jobs_updated_at BEFORE UPDATE ON conversion_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opportunity_references_updated_at BEFORE UPDATE ON opportunity_references FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SEED DATA FOR TESTING
-- =============================================================================

-- Insert sample ICP profiles (only if none exist)
INSERT INTO icp_profiles (id, name, description, criteria, organization_id, created_by)
SELECT 
    uuid_generate_v4(),
    'Enterprise SaaS',
    'Large enterprise software companies',
    '{"revenue_band": ">$1B", "employee_band": ">5k", "entity_type": "PUBLIC", "industry": "Software"}',
    o.id,
    u.id
FROM organizations o
CROSS JOIN users u
WHERE u.role = 'admin' AND u.organization_id = o.id
AND NOT EXISTS (SELECT 1 FROM icp_profiles WHERE organization_id = o.id)
LIMIT 1;

-- Insert sample integration providers (only if none exist)
INSERT INTO integration_providers (provider, config, organization_id)
SELECT 
    'CLEARBIT',
    '{"api_key": "test_key", "enabled": true}',
    o.id
FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM integration_providers WHERE organization_id = o.id AND provider = 'CLEARBIT')
LIMIT 1;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE icp_profiles IS 'Ideal Customer Profile definitions for AI lead generation';
COMMENT ON TABLE lead_briefs IS 'Lead generation briefs submitted by users for AI processing';
COMMENT ON TABLE ai_accounts IS 'AI-generated account entities with enhanced firmographic data';
COMMENT ON TABLE ai_contacts IS 'AI-generated contact entities with enhanced contact data';
COMMENT ON TABLE lead_qualifications IS 'Lead qualification data using various frameworks (excluding MEDDPICC)';
COMMENT ON TABLE framework_evidence IS 'Evidence collected for qualification frameworks';
COMMENT ON TABLE enhanced_lead_scores IS 'Enhanced scoring metrics for AI-generated leads';
COMMENT ON TABLE integration_providers IS 'Configuration for external data providers';
COMMENT ON TABLE conversion_jobs IS 'Jobs tracking lead-to-opportunity conversion process';
COMMENT ON TABLE opportunity_references IS 'References linking converted leads to opportunities';

COMMENT ON COLUMN ai_accounts.account_embedding IS 'Vector embedding for semantic search and similarity matching';
COMMENT ON COLUMN ai_contacts.contact_embedding IS 'Vector embedding for semantic search and similarity matching';
COMMENT ON COLUMN lead_qualifications.framework IS 'Qualification framework used (excludes MEDDICC/MEDDPICC)';
COMMENT ON COLUMN framework_evidence.confidence IS 'Confidence score for evidence (0-1)';
COMMENT ON COLUMN enhanced_lead_scores.composite IS 'Composite score combining all metrics (0-100)';
COMMENT ON COLUMN conversion_jobs.idempotency_key IS 'Unique key to prevent duplicate conversions';
