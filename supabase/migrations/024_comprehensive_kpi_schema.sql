-- Comprehensive KPI Implementation Schema for SPM Module
-- This migration adds tables and functions for all 10 critical sales KPIs

-- =============================================================================
-- KPI DEFINITIONS AND CONFIGURATION
-- =============================================================================

-- KPI definitions table for configurable metrics
CREATE TABLE IF NOT EXISTS kpi_definitions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    kpi_name TEXT NOT NULL, -- win_rate, revenue_growth, avg_deal_size, etc.
    display_name TEXT NOT NULL,
    description TEXT NOT NULL,
    formula TEXT NOT NULL,
    calculation_method TEXT NOT NULL CHECK (calculation_method IN ('sql_function', 'api_calculation', 'manual')),
    data_sources TEXT[] NOT NULL, -- ['opportunities', 'activities', 'leads']
    dimensions TEXT[] NOT NULL, -- ['territory', 'rep', 'product', 'time']
    thresholds JSONB DEFAULT '{}', -- Warning and critical thresholds
    industry_benchmarks JSONB DEFAULT '{}', -- Industry-specific benchmarks
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, kpi_name)
);

-- =============================================================================
-- KPI CALCULATED VALUES CACHE
-- =============================================================================

-- KPI calculated values cache for performance optimization
CREATE TABLE IF NOT EXISTS kpi_calculated_values (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    kpi_id UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    calculated_value DECIMAL(15,4) NOT NULL,
    previous_value DECIMAL(15,4),
    change_percentage DECIMAL(5,2),
    calculation_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    filters JSONB DEFAULT '{}', -- Applied filters (territory, rep, product, etc.)
    metadata JSONB DEFAULT '{}', -- Additional calculation metadata
    confidence_score DECIMAL(5,4) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, kpi_id, calculation_date, period_start, period_end, filters)
);

-- =============================================================================
-- PERFORMANCE AND OUTCOME METRICS TABLES
-- =============================================================================

-- Win Rate tracking table
CREATE TABLE IF NOT EXISTS win_rate_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    territory_id UUID REFERENCES sales_territories(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_opportunities INTEGER NOT NULL DEFAULT 0,
    won_opportunities INTEGER NOT NULL DEFAULT 0,
    win_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    industry_benchmark DECIMAL(5,2),
    performance_tier TEXT CHECK (performance_tier IN ('excellent', 'good', 'average', 'below_average')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue Growth tracking table
CREATE TABLE IF NOT EXISTS revenue_growth_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    territory_id UUID REFERENCES sales_territories(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    current_period_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    previous_period_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    growth_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    growth_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    target_growth_percentage DECIMAL(5,2),
    performance_tier TEXT CHECK (performance_tier IN ('excellent', 'good', 'average', 'below_average')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Average Deal Size tracking table
CREATE TABLE IF NOT EXISTS avg_deal_size_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    territory_id UUID REFERENCES sales_territories(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_deals INTEGER NOT NULL DEFAULT 0,
    avg_deal_size DECIMAL(15,2) NOT NULL DEFAULT 0,
    median_deal_size DECIMAL(15,2),
    largest_deal DECIMAL(15,2),
    smallest_deal DECIMAL(15,2),
    target_avg_deal_size DECIMAL(15,2),
    performance_tier TEXT CHECK (performance_tier IN ('excellent', 'good', 'average', 'below_average')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- EFFICIENCY AND PROCESS METRICS TABLES
-- =============================================================================

-- Sales Cycle Length tracking table
CREATE TABLE IF NOT EXISTS sales_cycle_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    territory_id UUID REFERENCES sales_territories(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_days INTEGER NOT NULL DEFAULT 0,
    total_deals INTEGER NOT NULL DEFAULT 0,
    avg_cycle_length DECIMAL(8,2) NOT NULL DEFAULT 0,
    median_cycle_length DECIMAL(8,2),
    shortest_cycle INTEGER,
    longest_cycle INTEGER,
    target_cycle_length INTEGER,
    performance_tier TEXT CHECK (performance_tier IN ('excellent', 'good', 'average', 'below_average')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Conversion Rate tracking table
CREATE TABLE IF NOT EXISTS lead_conversion_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    territory_id UUID REFERENCES sales_territories(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_leads INTEGER NOT NULL DEFAULT 0,
    qualified_opportunities INTEGER NOT NULL DEFAULT 0,
    conversion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    industry_benchmark DECIMAL(5,2),
    performance_tier TEXT CHECK (performance_tier IN ('excellent', 'good', 'average', 'below_average')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Acquisition Cost tracking table
CREATE TABLE IF NOT EXISTS cac_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    territory_id UUID REFERENCES sales_territories(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_sales_marketing_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
    new_customers_acquired INTEGER NOT NULL DEFAULT 0,
    cac DECIMAL(15,2) NOT NULL DEFAULT 0,
    clv DECIMAL(15,2),
    cac_clv_ratio DECIMAL(5,2),
    target_cac DECIMAL(15,2),
    performance_tier TEXT CHECK (performance_tier IN ('excellent', 'good', 'average', 'below_average')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PERFORMANCE MANAGEMENT METRICS TABLES
-- =============================================================================

-- Quota Attainment tracking table
CREATE TABLE IF NOT EXISTS quota_attainment_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    territory_id UUID REFERENCES sales_territories(id) ON DELETE SET NULL,
    quota_plan_id UUID REFERENCES quota_plans(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    quota_target DECIMAL(15,2) NOT NULL DEFAULT 0,
    actual_achievement DECIMAL(15,2) NOT NULL DEFAULT 0,
    attainment_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    performance_tier TEXT CHECK (performance_tier IN ('excellent', 'good', 'average', 'below_average')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Lifetime Value tracking table
CREATE TABLE IF NOT EXISTS clv_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    territory_id UUID REFERENCES sales_territories(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    avg_purchase_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    purchase_frequency DECIMAL(8,2) NOT NULL DEFAULT 0,
    customer_lifespan_months DECIMAL(8,2) NOT NULL DEFAULT 0,
    clv DECIMAL(15,2) NOT NULL DEFAULT 0,
    target_clv DECIMAL(15,2),
    performance_tier TEXT CHECK (performance_tier IN ('excellent', 'good', 'average', 'below_average')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pipeline Coverage Ratio tracking table
CREATE TABLE IF NOT EXISTS pipeline_coverage_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    territory_id UUID REFERENCES sales_territories(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_pipeline_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    sales_quota DECIMAL(15,2) NOT NULL DEFAULT 0,
    coverage_ratio DECIMAL(5,2) NOT NULL DEFAULT 0,
    target_coverage_ratio DECIMAL(5,2),
    performance_tier TEXT CHECK (performance_tier IN ('excellent', 'good', 'average', 'below_average')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales Activities per Rep tracking table
CREATE TABLE IF NOT EXISTS activities_per_rep_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    territory_id UUID REFERENCES sales_territories(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_activities INTEGER NOT NULL DEFAULT 0,
    calls INTEGER NOT NULL DEFAULT 0,
    emails INTEGER NOT NULL DEFAULT 0,
    meetings INTEGER NOT NULL DEFAULT 0,
    demos INTEGER NOT NULL DEFAULT 0,
    presentations INTEGER NOT NULL DEFAULT 0,
    activities_per_day DECIMAL(8,2) NOT NULL DEFAULT 0,
    target_activities_per_day DECIMAL(8,2),
    performance_tier TEXT CHECK (performance_tier IN ('excellent', 'good', 'average', 'below_average')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- KPI definitions indexes
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_org ON kpi_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_name ON kpi_definitions(kpi_name);

-- KPI calculated values indexes
CREATE INDEX IF NOT EXISTS idx_kpi_calculated_values_org_kpi ON kpi_calculated_values(organization_id, kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_calculated_values_date ON kpi_calculated_values(calculation_date);
CREATE INDEX IF NOT EXISTS idx_kpi_calculated_values_period ON kpi_calculated_values(period_start, period_end);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_win_rate_metrics_org_period ON win_rate_metrics(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_win_rate_metrics_user ON win_rate_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_win_rate_metrics_territory ON win_rate_metrics(territory_id);

CREATE INDEX IF NOT EXISTS idx_revenue_growth_metrics_org_period ON revenue_growth_metrics(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_revenue_growth_metrics_user ON revenue_growth_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_avg_deal_size_metrics_org_period ON avg_deal_size_metrics(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_avg_deal_size_metrics_user ON avg_deal_size_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_sales_cycle_metrics_org_period ON sales_cycle_metrics(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_sales_cycle_metrics_user ON sales_cycle_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_lead_conversion_metrics_org_period ON lead_conversion_metrics(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_lead_conversion_metrics_user ON lead_conversion_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_cac_metrics_org_period ON cac_metrics(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_cac_metrics_user ON cac_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_quota_attainment_metrics_org_period ON quota_attainment_metrics(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_quota_attainment_metrics_user ON quota_attainment_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_clv_metrics_org_period ON clv_metrics(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_clv_metrics_user ON clv_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_pipeline_coverage_metrics_org_period ON pipeline_coverage_metrics(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_pipeline_coverage_metrics_user ON pipeline_coverage_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_activities_per_rep_metrics_org_period ON activities_per_rep_metrics(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_activities_per_rep_metrics_user ON activities_per_rep_metrics(user_id);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_calculated_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_rate_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_growth_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE avg_deal_size_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_cycle_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_conversion_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cac_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_attainment_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clv_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_coverage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities_per_rep_metrics ENABLE ROW LEVEL SECURITY;

-- KPI definitions policies
DROP POLICY IF EXISTS "Users can view KPI definitions in their organization" ON kpi_definitions;
CREATE POLICY "Users can view KPI definitions in their organization" ON kpi_definitions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage KPI definitions" ON kpi_definitions;
CREATE POLICY "Admins can manage KPI definitions" ON kpi_definitions
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      SELECT role FROM users WHERE id = auth.uid()
    ) IN ('admin', 'manager')
  );

-- KPI calculated values policies
DROP POLICY IF EXISTS "Users can view KPI values for their organization" ON kpi_calculated_values;
CREATE POLICY "Users can view KPI values for their organization" ON kpi_calculated_values
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Performance metrics policies (similar pattern for all metrics tables)
DROP POLICY IF EXISTS "Users can view win rate metrics for their organization" ON win_rate_metrics;
CREATE POLICY "Users can view win rate metrics for their organization" ON win_rate_metrics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      user_id = auth.uid() OR
      territory_id IN (
        SELECT id FROM sales_territories 
        WHERE assigned_user_id = auth.uid() OR manager_id = auth.uid()
      ) OR (
        SELECT role FROM users WHERE id = auth.uid()
      ) IN ('admin', 'manager')
    )
  );

-- Similar policies for other metrics tables...
DROP POLICY IF EXISTS "Users can view revenue growth metrics for their organization" ON revenue_growth_metrics;
CREATE POLICY "Users can view revenue growth metrics for their organization" ON revenue_growth_metrics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      user_id = auth.uid() OR
      territory_id IN (
        SELECT id FROM sales_territories 
        WHERE assigned_user_id = auth.uid() OR manager_id = auth.uid()
      ) OR (
        SELECT role FROM users WHERE id = auth.uid()
      ) IN ('admin', 'manager')
    )
  );

-- Add policies for all other metrics tables
DROP POLICY IF EXISTS "Users can view avg deal size metrics for their organization" ON avg_deal_size_metrics;
CREATE POLICY "Users can view avg deal size metrics for their organization" ON avg_deal_size_metrics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      user_id = auth.uid() OR
      territory_id IN (
        SELECT id FROM sales_territories 
        WHERE assigned_user_id = auth.uid() OR manager_id = auth.uid()
      ) OR (
        SELECT role FROM users WHERE id = auth.uid()
      ) IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can view sales cycle metrics for their organization" ON sales_cycle_metrics;
CREATE POLICY "Users can view sales cycle metrics for their organization" ON sales_cycle_metrics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      user_id = auth.uid() OR
      territory_id IN (
        SELECT id FROM sales_territories 
        WHERE assigned_user_id = auth.uid() OR manager_id = auth.uid()
      ) OR (
        SELECT role FROM users WHERE id = auth.uid()
      ) IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can view lead conversion metrics for their organization" ON lead_conversion_metrics;
CREATE POLICY "Users can view lead conversion metrics for their organization" ON lead_conversion_metrics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      user_id = auth.uid() OR
      territory_id IN (
        SELECT id FROM sales_territories 
        WHERE assigned_user_id = auth.uid() OR manager_id = auth.uid()
      ) OR (
        SELECT role FROM users WHERE id = auth.uid()
      ) IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can view CAC metrics for their organization" ON cac_metrics;
CREATE POLICY "Users can view CAC metrics for their organization" ON cac_metrics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      user_id = auth.uid() OR
      territory_id IN (
        SELECT id FROM sales_territories 
        WHERE assigned_user_id = auth.uid() OR manager_id = auth.uid()
      ) OR (
        SELECT role FROM users WHERE id = auth.uid()
      ) IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can view quota attainment metrics for their organization" ON quota_attainment_metrics;
CREATE POLICY "Users can view quota attainment metrics for their organization" ON quota_attainment_metrics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      user_id = auth.uid() OR
      territory_id IN (
        SELECT id FROM sales_territories 
        WHERE assigned_user_id = auth.uid() OR manager_id = auth.uid()
      ) OR (
        SELECT role FROM users WHERE id = auth.uid()
      ) IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can view CLV metrics for their organization" ON clv_metrics;
CREATE POLICY "Users can view CLV metrics for their organization" ON clv_metrics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      user_id = auth.uid() OR
      territory_id IN (
        SELECT id FROM sales_territories 
        WHERE assigned_user_id = auth.uid() OR manager_id = auth.uid()
      ) OR (
        SELECT role FROM users WHERE id = auth.uid()
      ) IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can view pipeline coverage metrics for their organization" ON pipeline_coverage_metrics;
CREATE POLICY "Users can view pipeline coverage metrics for their organization" ON pipeline_coverage_metrics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      user_id = auth.uid() OR
      territory_id IN (
        SELECT id FROM sales_territories 
        WHERE assigned_user_id = auth.uid() OR manager_id = auth.uid()
      ) OR (
        SELECT role FROM users WHERE id = auth.uid()
      ) IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can view activities per rep metrics for their organization" ON activities_per_rep_metrics;
CREATE POLICY "Users can view activities per rep metrics for their organization" ON activities_per_rep_metrics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      user_id = auth.uid() OR
      territory_id IN (
        SELECT id FROM sales_territories 
        WHERE assigned_user_id = auth.uid() OR manager_id = auth.uid()
      ) OR (
        SELECT role FROM users WHERE id = auth.uid()
      ) IN ('admin', 'manager')
    )
  );

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all metrics tables (drop existing first to avoid conflicts)
DROP TRIGGER IF EXISTS trigger_kpi_definitions_updated_at ON kpi_definitions;
CREATE TRIGGER trigger_kpi_definitions_updated_at
  BEFORE UPDATE ON kpi_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_win_rate_metrics_updated_at ON win_rate_metrics;
CREATE TRIGGER trigger_win_rate_metrics_updated_at
  BEFORE UPDATE ON win_rate_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_revenue_growth_metrics_updated_at ON revenue_growth_metrics;
CREATE TRIGGER trigger_revenue_growth_metrics_updated_at
  BEFORE UPDATE ON revenue_growth_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_avg_deal_size_metrics_updated_at ON avg_deal_size_metrics;
CREATE TRIGGER trigger_avg_deal_size_metrics_updated_at
  BEFORE UPDATE ON avg_deal_size_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_sales_cycle_metrics_updated_at ON sales_cycle_metrics;
CREATE TRIGGER trigger_sales_cycle_metrics_updated_at
  BEFORE UPDATE ON sales_cycle_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_lead_conversion_metrics_updated_at ON lead_conversion_metrics;
CREATE TRIGGER trigger_lead_conversion_metrics_updated_at
  BEFORE UPDATE ON lead_conversion_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_cac_metrics_updated_at ON cac_metrics;
CREATE TRIGGER trigger_cac_metrics_updated_at
  BEFORE UPDATE ON cac_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_quota_attainment_metrics_updated_at ON quota_attainment_metrics;
CREATE TRIGGER trigger_quota_attainment_metrics_updated_at
  BEFORE UPDATE ON quota_attainment_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_clv_metrics_updated_at ON clv_metrics;
CREATE TRIGGER trigger_clv_metrics_updated_at
  BEFORE UPDATE ON clv_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_pipeline_coverage_metrics_updated_at ON pipeline_coverage_metrics;
CREATE TRIGGER trigger_pipeline_coverage_metrics_updated_at
  BEFORE UPDATE ON pipeline_coverage_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_activities_per_rep_metrics_updated_at ON activities_per_rep_metrics;
CREATE TRIGGER trigger_activities_per_rep_metrics_updated_at
  BEFORE UPDATE ON activities_per_rep_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
