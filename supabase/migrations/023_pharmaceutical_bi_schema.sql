-- Pharmaceutical Business Intelligence Module Database Schema
-- This migration adds comprehensive tables for pharmaceutical sales KPI analytics
-- including HCP management, prescription tracking, call analytics, and formulary access

-- =============================================================================
-- PHARMACEUTICAL KPI DEFINITIONS
-- =============================================================================

-- Pharmaceutical-specific KPI definitions table
CREATE TABLE IF NOT EXISTS pharmaceutical_kpis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    kpi_name TEXT NOT NULL, -- TRx, NRx, Market Share, Growth %, Reach, Frequency, etc.
    kpi_definition TEXT NOT NULL,
    formula TEXT NOT NULL,
    grain TEXT[] NOT NULL, -- [date, product, territory, hcp]
    dimensions TEXT[] NOT NULL, -- [territory, rep, payer, channel, specialty]
    thresholds JSONB DEFAULT '{}', -- Warning and critical thresholds
    owner TEXT NOT NULL, -- Sales Ops, Commercial, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, kpi_name)
);

-- =============================================================================
-- HEALTHCARE PROVIDER (HCP) MANAGEMENT
-- =============================================================================

-- Healthcare Provider management table
CREATE TABLE IF NOT EXISTS healthcare_providers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hcp_id TEXT NOT NULL, -- External HCP identifier (NPI, DEA, etc.)
    name TEXT NOT NULL,
    specialty TEXT,
    practice_id TEXT,
    practice_name TEXT,
    territory_id UUID REFERENCES sales_territories(id),
    formulary_status TEXT CHECK (formulary_status IN ('preferred', 'standard', 'non_preferred', 'not_covered')),
    last_interaction_date DATE,
    total_interactions INTEGER DEFAULT 0,
    last_prescription_date DATE,
    prescription_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, hcp_id)
);

-- =============================================================================
-- PRESCRIPTION EVENTS TRACKING
-- =============================================================================

-- Prescription events tracking table
CREATE TABLE IF NOT EXISTS prescription_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT,
    hcp_id TEXT NOT NULL,
    account_id TEXT, -- Hospital/clinic/pharmacy ID
    account_name TEXT,
    prescription_date DATE NOT NULL,
    prescription_type TEXT CHECK (prescription_type IN ('new', 'refill')) NOT NULL,
    volume INTEGER NOT NULL DEFAULT 1,
    territory_id UUID REFERENCES sales_territories(id),
    payer_id TEXT, -- Insurance/payer information
    payer_name TEXT,
    channel TEXT CHECK (channel IN ('retail', 'mail_order', 'specialty', 'hospital')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PHARMACEUTICAL CALL ACTIVITY TRACKING
-- =============================================================================

-- Pharmaceutical call activity tracking table
CREATE TABLE IF NOT EXISTS pharmaceutical_calls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    rep_id UUID NOT NULL REFERENCES users(id),
    hcp_id TEXT NOT NULL,
    call_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    call_type TEXT CHECK (call_type IN ('detailing', 'sampling', 'follow_up', 'presentation', 'lunch_meeting')) NOT NULL,
    product_id TEXT,
    product_name TEXT,
    outcome TEXT CHECK (outcome IN ('successful', 'unsuccessful', 'follow_up_required', 'no_response')) NOT NULL,
    samples_distributed INTEGER DEFAULT 0,
    samples_requested INTEGER DEFAULT 0,
    notes TEXT,
    territory_id UUID REFERENCES sales_territories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- SAMPLE DISTRIBUTION TRACKING
-- =============================================================================

-- Sample distribution tracking table
CREATE TABLE IF NOT EXISTS sample_distributions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    hcp_id TEXT NOT NULL,
    rep_id UUID NOT NULL REFERENCES users(id),
    distribution_date DATE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    territory_id UUID REFERENCES sales_territories(id),
    batch_number TEXT,
    expiration_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- FORMULARY ACCESS TRACKING
-- =============================================================================

-- Formulary access tracking table
CREATE TABLE IF NOT EXISTS formulary_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    payer_id TEXT NOT NULL,
    payer_name TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    coverage_level TEXT CHECK (coverage_level IN ('preferred', 'standard', 'non_preferred', 'not_covered')) NOT NULL,
    territory_id UUID REFERENCES sales_territories(id),
    effective_date DATE NOT NULL,
    end_date DATE,
    copay_amount DECIMAL(10,2),
    prior_authorization_required BOOLEAN DEFAULT false,
    step_therapy_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- KPI CALCULATED VALUES CACHE
-- =============================================================================

-- KPI calculated values cache for performance
CREATE TABLE IF NOT EXISTS kpi_calculated_values (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    kpi_id UUID NOT NULL REFERENCES pharmaceutical_kpis(id) ON DELETE CASCADE,
    calculated_value DECIMAL(15,4) NOT NULL,
    confidence_score DECIMAL(5,4) DEFAULT 1.0,
    calculation_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    filters JSONB DEFAULT '{}', -- Applied filters (territory, product, etc.)
    metadata JSONB DEFAULT '{}', -- Additional calculation metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, kpi_id, calculation_date, period_start, period_end, filters)
);

-- =============================================================================
-- DATA SOURCE INTEGRATIONS
-- =============================================================================

-- Data source integration configuration
CREATE TABLE IF NOT EXISTS data_source_integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_name TEXT NOT NULL, -- Salesforce, IQVIA, Snowflake, etc.
    source_type TEXT CHECK (source_type IN ('salesforce', 'iqvia', 'snowflake', 'redshift', 'bigquery', 'csv', 'api')) NOT NULL,
    connection_config JSONB NOT NULL, -- Encrypted connection details
    refresh_interval INTEGER DEFAULT 60, -- Minutes
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_status TEXT CHECK (sync_status IN ('active', 'inactive', 'error', 'syncing')) DEFAULT 'inactive',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- AUDIT TRAIL FOR COMPLIANCE
-- =============================================================================

-- Enhanced audit trail for pharmaceutical data access
CREATE TABLE IF NOT EXISTS pharmaceutical_audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    action TEXT NOT NULL, -- view, create, update, delete, export
    resource_type TEXT NOT NULL, -- hcp, prescription, call, kpi, etc.
    resource_id TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    additional_data JSONB DEFAULT '{}'
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Healthcare providers indexes
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_org_territory ON healthcare_providers(organization_id, territory_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_specialty ON healthcare_providers(specialty);
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_hcp_id ON healthcare_providers(hcp_id);

-- Prescription events indexes
CREATE INDEX IF NOT EXISTS idx_prescription_events_org_date ON prescription_events(organization_id, prescription_date);
CREATE INDEX IF NOT EXISTS idx_prescription_events_product ON prescription_events(product_id);
CREATE INDEX IF NOT EXISTS idx_prescription_events_hcp ON prescription_events(hcp_id);
CREATE INDEX IF NOT EXISTS idx_prescription_events_territory ON prescription_events(territory_id);

-- Pharmaceutical calls indexes
CREATE INDEX IF NOT EXISTS idx_pharmaceutical_calls_org_date ON pharmaceutical_calls(organization_id, call_date);
CREATE INDEX IF NOT EXISTS idx_pharmaceutical_calls_rep ON pharmaceutical_calls(rep_id);
CREATE INDEX IF NOT EXISTS idx_pharmaceutical_calls_hcp ON pharmaceutical_calls(hcp_id);
CREATE INDEX IF NOT EXISTS idx_pharmaceutical_calls_type ON pharmaceutical_calls(call_type);

-- Sample distributions indexes
CREATE INDEX IF NOT EXISTS idx_sample_distributions_org_date ON sample_distributions(organization_id, distribution_date);
CREATE INDEX IF NOT EXISTS idx_sample_distributions_product ON sample_distributions(product_id);
CREATE INDEX IF NOT EXISTS idx_sample_distributions_hcp ON sample_distributions(hcp_id);

-- Formulary access indexes
CREATE INDEX IF NOT EXISTS idx_formulary_access_org ON formulary_access(organization_id);
CREATE INDEX IF NOT EXISTS idx_formulary_access_payer ON formulary_access(payer_id);
CREATE INDEX IF NOT EXISTS idx_formulary_access_product ON formulary_access(product_id);

-- KPI calculated values indexes
CREATE INDEX IF NOT EXISTS idx_kpi_calculated_values_org_kpi ON kpi_calculated_values(organization_id, kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_calculated_values_date ON kpi_calculated_values(calculation_date);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE pharmaceutical_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmaceutical_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulary_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_calculated_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_source_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmaceutical_audit_logs ENABLE ROW LEVEL SECURITY;

-- Pharmaceutical KPIs policies
CREATE POLICY "Users can view KPIs in their organization" ON pharmaceutical_kpis
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage KPIs" ON pharmaceutical_kpis
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      SELECT role FROM users WHERE id = auth.uid()
    ) IN ('admin', 'manager')
  );

-- Healthcare providers policies
CREATE POLICY "Users can view HCPs in their territory" ON healthcare_providers
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      territory_id IN (
        SELECT id FROM sales_territories 
        WHERE assigned_user_id = auth.uid() OR manager_id = auth.uid()
      ) OR (
        SELECT role FROM users WHERE id = auth.uid()
      ) IN ('admin', 'manager')
    )
  );

-- Prescription events policies
CREATE POLICY "Users can view prescription events for their territory" ON prescription_events
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      territory_id IN (
        SELECT id FROM sales_territories 
        WHERE assigned_user_id = auth.uid() OR manager_id = auth.uid()
      ) OR (
        SELECT role FROM users WHERE id = auth.uid()
      ) IN ('admin', 'manager')
    )
  );

-- Pharmaceutical calls policies
CREATE POLICY "Users can view calls for their territory" ON pharmaceutical_calls
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      rep_id = auth.uid() OR
      territory_id IN (
        SELECT id FROM sales_territories 
        WHERE assigned_user_id = auth.uid() OR manager_id = auth.uid()
      ) OR (
        SELECT role FROM users WHERE id = auth.uid()
      ) IN ('admin', 'manager')
    )
  );

-- Sample distributions policies
CREATE POLICY "Users can view sample distributions for their territory" ON sample_distributions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      rep_id = auth.uid() OR
      territory_id IN (
        SELECT id FROM sales_territories 
        WHERE assigned_user_id = auth.uid() OR manager_id = auth.uid()
      ) OR (
        SELECT role FROM users WHERE id = auth.uid()
      ) IN ('admin', 'manager')
    )
  );

-- Formulary access policies
CREATE POLICY "Users can view formulary access for their organization" ON formulary_access
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- KPI calculated values policies
CREATE POLICY "Users can view KPI values for their organization" ON kpi_calculated_values
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Data source integrations policies
CREATE POLICY "Admins can manage data source integrations" ON data_source_integrations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      SELECT role FROM users WHERE id = auth.uid()
    ) IN ('admin', 'manager')
  );

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs" ON pharmaceutical_audit_logs
  FOR SELECT USING (
    user_id = auth.uid() OR (
      SELECT role FROM users WHERE id = auth.uid()
    ) IN ('admin', 'manager')
  );

-- =============================================================================
-- FUNCTIONS FOR KPI CALCULATIONS
-- =============================================================================

-- Function to calculate TRx (Total Prescriptions)
CREATE OR REPLACE FUNCTION calculate_trx(
  p_organization_id UUID,
  p_product_id TEXT DEFAULT NULL,
  p_territory_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_period_end DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(15,4) AS $$
DECLARE
  trx_count DECIMAL(15,4);
BEGIN
  SELECT COALESCE(SUM(volume), 0) INTO trx_count
  FROM prescription_events
  WHERE organization_id = p_organization_id
    AND prescription_date BETWEEN p_period_start AND p_period_end
    AND (p_product_id IS NULL OR product_id = p_product_id)
    AND (p_territory_id IS NULL OR territory_id = p_territory_id);
  
  RETURN trx_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate NRx (New Prescriptions)
CREATE OR REPLACE FUNCTION calculate_nrx(
  p_organization_id UUID,
  p_product_id TEXT DEFAULT NULL,
  p_territory_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_period_end DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(15,4) AS $$
DECLARE
  nrx_count DECIMAL(15,4);
BEGIN
  SELECT COALESCE(SUM(volume), 0) INTO nrx_count
  FROM prescription_events
  WHERE organization_id = p_organization_id
    AND prescription_date BETWEEN p_period_start AND p_period_end
    AND prescription_type = 'new'
    AND (p_product_id IS NULL OR product_id = p_product_id)
    AND (p_territory_id IS NULL OR territory_id = p_territory_id);
  
  RETURN nrx_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate Market Share
CREATE OR REPLACE FUNCTION calculate_market_share(
  p_organization_id UUID,
  p_product_id TEXT,
  p_territory_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_period_end DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(5,4) AS $$
DECLARE
  product_trx DECIMAL(15,4);
  category_trx DECIMAL(15,4);
  market_share DECIMAL(5,4);
BEGIN
  -- Get product TRx
  SELECT calculate_trx(p_organization_id, p_product_id, p_territory_id, p_period_start, p_period_end) INTO product_trx;
  
  -- Get category TRx (all products in same category)
  SELECT COALESCE(SUM(volume), 0) INTO category_trx
  FROM prescription_events
  WHERE organization_id = p_organization_id
    AND prescription_date BETWEEN p_period_start AND p_period_end
    AND (p_territory_id IS NULL OR territory_id = p_territory_id);
  
  -- Calculate market share
  IF category_trx > 0 THEN
    market_share := (product_trx / category_trx) * 100;
  ELSE
    market_share := 0;
  END IF;
  
  RETURN market_share;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate Call Effectiveness Index
CREATE OR REPLACE FUNCTION calculate_call_effectiveness(
  p_organization_id UUID,
  p_rep_id UUID DEFAULT NULL,
  p_territory_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_period_end DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(5,4) AS $$
DECLARE
  total_calls INTEGER;
  nrx_after_calls DECIMAL(15,4);
  effectiveness DECIMAL(5,4);
BEGIN
  -- Count total calls
  SELECT COUNT(*) INTO total_calls
  FROM pharmaceutical_calls
  WHERE organization_id = p_organization_id
    AND call_date BETWEEN p_period_start AND p_period_end
    AND (p_rep_id IS NULL OR rep_id = p_rep_id)
    AND (p_territory_id IS NULL OR territory_id = p_territory_id);
  
  -- Calculate NRx after calls (simplified - would need more complex logic in practice)
  SELECT COALESCE(SUM(volume), 0) INTO nrx_after_calls
  FROM prescription_events pe
  JOIN pharmaceutical_calls pc ON pe.hcp_id = pc.hcp_id
  WHERE pe.organization_id = p_organization_id
    AND pe.prescription_date BETWEEN p_period_start AND p_period_end
    AND pe.prescription_type = 'new'
    AND pc.call_date BETWEEN p_period_start AND p_period_end
    AND (p_rep_id IS NULL OR pc.rep_id = p_rep_id)
    AND (p_territory_id IS NULL OR pc.territory_id = p_territory_id);
  
  -- Calculate effectiveness
  IF total_calls > 0 THEN
    effectiveness := nrx_after_calls / total_calls;
  ELSE
    effectiveness := 0;
  END IF;
  
  RETURN effectiveness;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Trigger to update HCP interaction counts
CREATE OR REPLACE FUNCTION update_hcp_interaction_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE healthcare_providers
  SET 
    last_interaction_date = NEW.call_date::DATE,
    total_interactions = total_interactions + 1,
    updated_at = NOW()
  WHERE organization_id = NEW.organization_id
    AND hcp_id = NEW.hcp_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_hcp_interaction_count
  AFTER INSERT ON pharmaceutical_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_hcp_interaction_count();

-- Trigger to update HCP prescription counts
CREATE OR REPLACE FUNCTION update_hcp_prescription_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE healthcare_providers
  SET 
    last_prescription_date = NEW.prescription_date,
    prescription_count = prescription_count + NEW.volume,
    updated_at = NOW()
  WHERE organization_id = NEW.organization_id
    AND hcp_id = NEW.hcp_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_hcp_prescription_count
  AFTER INSERT ON prescription_events
  FOR EACH ROW
  EXECUTE FUNCTION update_hcp_prescription_count();

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pharmaceutical_kpis_updated_at
  BEFORE UPDATE ON pharmaceutical_kpis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_healthcare_providers_updated_at
  BEFORE UPDATE ON healthcare_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_formulary_access_updated_at
  BEFORE UPDATE ON formulary_access
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_data_source_integrations_updated_at
  BEFORE UPDATE ON data_source_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
