-- Safe Sales Performance Schema Application
-- This script safely applies the schema without conflicts

-- =============================================================================
-- CREATE TABLES (IF NOT EXISTS)
-- =============================================================================

-- Sales territories table
CREATE TABLE IF NOT EXISTS sales_territories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    region TEXT,
    zip_codes TEXT[] DEFAULT '{}',
    industry_codes TEXT[] DEFAULT '{}',
    revenue_tier_min DECIMAL(15,2),
    revenue_tier_max DECIMAL(15,2),
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quota plans table
CREATE TABLE IF NOT EXISTS quota_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('annual', 'quarterly', 'monthly')),
    target_revenue DECIMAL(15,2) NOT NULL,
    target_deals INTEGER,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    territory_id UUID REFERENCES sales_territories(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compensation plans table
CREATE TABLE IF NOT EXISTS compensation_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('commission', 'salary', 'hybrid')),
    base_salary DECIMAL(15,2),
    commission_rate DECIMAL(5,4),
    bonus_structure JSONB DEFAULT '{}',
    quota_threshold DECIMAL(15,2),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('revenue', 'deals', 'activities', 'quota_attainment')),
    metric_value DECIMAL(15,2) NOT NULL,
    target_value DECIMAL(15,2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    territory_id UUID REFERENCES sales_territories(id) ON DELETE SET NULL,
    quota_plan_id UUID REFERENCES quota_plans(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commission calculations table
CREATE TABLE IF NOT EXISTS commission_calculations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    compensation_plan_id UUID NOT NULL REFERENCES compensation_plans(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    base_amount DECIMAL(15,2) NOT NULL,
    commission_amount DECIMAL(15,2) NOT NULL,
    bonus_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'disputed')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Territory assignments table
CREATE TABLE IF NOT EXISTS territory_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    territory_id UUID NOT NULL REFERENCES sales_territories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance alerts table
CREATE TABLE IF NOT EXISTS performance_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('quota_miss', 'quota_exceed', 'activity_low', 'performance_drop')),
    message TEXT NOT NULL,
    threshold_value DECIMAL(15,2),
    current_value DECIMAL(15,2),
    is_read BOOLEAN DEFAULT false,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scenario plans table
CREATE TABLE IF NOT EXISTS scenario_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    scenario_type TEXT NOT NULL CHECK (scenario_type IN ('quota_adjustment', 'territory_redesign', 'compensation_change')),
    parameters JSONB NOT NULL DEFAULT '{}',
    results JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales recognition table
CREATE TABLE IF NOT EXISTS sales_recognition (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recognition_type TEXT NOT NULL CHECK (recognition_type IN ('milestone', 'achievement', 'leaderboard', 'award')),
    title TEXT NOT NULL,
    description TEXT,
    metric_type TEXT CHECK (metric_type IN ('revenue', 'deals', 'activities', 'quota_attainment')),
    metric_value DECIMAL(15,2),
    period_start DATE,
    period_end DATE,
    badge_icon TEXT,
    points_awarded INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    awarded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Performance Tracking Tables
CREATE TABLE IF NOT EXISTS metric_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('revenue', 'deals', 'activities', 'conversion', 'customer', 'product', 'custom')),
    metric_type TEXT NOT NULL CHECK (metric_type IN ('count', 'percentage', 'currency', 'duration', 'score', 'ratio')),
    unit TEXT,
    target_default DECIMAL(15,4),
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_metric_fields (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    metric_template_id UUID NOT NULL REFERENCES metric_templates(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'select')),
    field_options JSONB DEFAULT '{}',
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enhanced_performance_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    metric_template_id UUID NOT NULL REFERENCES metric_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    territory_id UUID REFERENCES sales_territories(id) ON DELETE SET NULL,
    quota_plan_id UUID REFERENCES quota_plans(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    actual_value DECIMAL(15,4) NOT NULL,
    target_value DECIMAL(15,4) NOT NULL,
    custom_fields JSONB DEFAULT '{}',
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metric_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    metric_template_id UUID NOT NULL REFERENCES metric_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    territory_id UUID REFERENCES sales_territories(id) ON DELETE CASCADE,
    goal_period TEXT NOT NULL CHECK (goal_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    target_value DECIMAL(15,4) NOT NULL,
    stretch_target DECIMAL(15,4),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metric_dashboards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_shared BOOLEAN DEFAULT false,
    dashboard_config JSONB NOT NULL DEFAULT '{}',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dashboard_id UUID NOT NULL REFERENCES metric_dashboards(id) ON DELETE CASCADE,
    metric_template_id UUID NOT NULL REFERENCES metric_templates(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    chart_type TEXT DEFAULT 'line' CHECK (chart_type IN ('line', 'bar', 'pie', 'area', 'gauge', 'table')),
    chart_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- CREATE INDEXES (IF NOT EXISTS)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_sales_territories_org ON sales_territories(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_territories_user ON sales_territories(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_quota_plans_org ON quota_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_quota_plans_user ON quota_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_compensation_plans_org ON compensation_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_org ON performance_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_calculations_org ON commission_calculations(organization_id);
CREATE INDEX IF NOT EXISTS idx_commission_calculations_user ON commission_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_territory_assignments_territory ON territory_assignments(territory_id);
CREATE INDEX IF NOT EXISTS idx_territory_assignments_user ON territory_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_org ON performance_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_user ON performance_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_scenario_plans_org ON scenario_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_recognition_org ON sales_recognition(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_recognition_user ON sales_recognition(user_id);
CREATE INDEX IF NOT EXISTS idx_metric_templates_org ON metric_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_metric_templates_category ON metric_templates(category);
CREATE INDEX IF NOT EXISTS idx_metric_templates_active ON metric_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_metric_fields_template ON custom_metric_fields(metric_template_id);
CREATE INDEX IF NOT EXISTS idx_custom_metric_fields_org ON custom_metric_fields(organization_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_performance_metrics_org ON enhanced_performance_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_performance_metrics_user ON enhanced_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_performance_metrics_template ON enhanced_performance_metrics(metric_template_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_performance_metrics_period ON enhanced_performance_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_enhanced_performance_metrics_status ON enhanced_performance_metrics(status);
CREATE INDEX IF NOT EXISTS idx_metric_goals_org ON metric_goals(organization_id);
CREATE INDEX IF NOT EXISTS idx_metric_goals_user ON metric_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_metric_goals_template ON metric_goals(metric_template_id);
CREATE INDEX IF NOT EXISTS idx_metric_goals_period ON metric_goals(goal_period);
CREATE INDEX IF NOT EXISTS idx_metric_goals_active ON metric_goals(is_active);
CREATE INDEX IF NOT EXISTS idx_metric_dashboards_org ON metric_dashboards(organization_id);
CREATE INDEX IF NOT EXISTS idx_metric_dashboards_user ON metric_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_metric_dashboards_shared ON metric_dashboards(is_shared);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_dashboard ON dashboard_metrics(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_template ON dashboard_metrics(metric_template_id);

-- =============================================================================
-- ENABLE RLS (IF NOT ALREADY ENABLED)
-- =============================================================================

ALTER TABLE sales_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE compensation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE territory_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_recognition ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_metric_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- CREATE POLICIES (IF NOT EXISTS)
-- =============================================================================

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
    -- Drop policies for sales_territories
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales_territories' AND policyname = 'Users can view organization sales territories') THEN
        DROP POLICY "Users can view organization sales territories" ON sales_territories;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales_territories' AND policyname = 'Managers can manage sales territories') THEN
        DROP POLICY "Managers can manage sales territories" ON sales_territories;
    END IF;
    
    -- Drop policies for quota_plans
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quota_plans' AND policyname = 'Users can view organization quota plans') THEN
        DROP POLICY "Users can view organization quota plans" ON quota_plans;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quota_plans' AND policyname = 'Managers can manage quota plans') THEN
        DROP POLICY "Managers can manage quota plans" ON quota_plans;
    END IF;
    
    -- Drop policies for compensation_plans
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'compensation_plans' AND policyname = 'Users can view organization compensation plans') THEN
        DROP POLICY "Users can view organization compensation plans" ON compensation_plans;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'compensation_plans' AND policyname = 'Managers can manage compensation plans') THEN
        DROP POLICY "Managers can manage compensation plans" ON compensation_plans;
    END IF;
    
    -- Drop policies for performance_metrics
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'performance_metrics' AND policyname = 'Users can view organization performance metrics') THEN
        DROP POLICY "Users can view organization performance metrics" ON performance_metrics;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'performance_metrics' AND policyname = 'Users can view their own performance metrics') THEN
        DROP POLICY "Users can view their own performance metrics" ON performance_metrics;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'performance_metrics' AND policyname = 'Users can manage their own performance metrics') THEN
        DROP POLICY "Users can manage their own performance metrics" ON performance_metrics;
    END IF;
    
    -- Drop policies for commission_calculations
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'commission_calculations' AND policyname = 'Users can view organization commission calculations') THEN
        DROP POLICY "Users can view organization commission calculations" ON commission_calculations;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'commission_calculations' AND policyname = 'Users can view their own commission calculations') THEN
        DROP POLICY "Users can view their own commission calculations" ON commission_calculations;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'commission_calculations' AND policyname = 'Managers can manage commission calculations') THEN
        DROP POLICY "Managers can manage commission calculations" ON commission_calculations;
    END IF;
    
    -- Drop policies for metric_templates
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'metric_templates' AND policyname = 'Users can view organization metric templates') THEN
        DROP POLICY "Users can view organization metric templates" ON metric_templates;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'metric_templates' AND policyname = 'Managers can manage metric templates') THEN
        DROP POLICY "Managers can manage metric templates" ON metric_templates;
    END IF;
    
    -- Drop policies for custom_metric_fields
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custom_metric_fields' AND policyname = 'Users can view organization custom metric fields') THEN
        DROP POLICY "Users can view organization custom metric fields" ON custom_metric_fields;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custom_metric_fields' AND policyname = 'Managers can manage custom metric fields') THEN
        DROP POLICY "Managers can manage custom metric fields" ON custom_metric_fields;
    END IF;
    
    -- Drop policies for enhanced_performance_metrics
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enhanced_performance_metrics' AND policyname = 'Users can view organization enhanced performance metrics') THEN
        DROP POLICY "Users can view organization enhanced performance metrics" ON enhanced_performance_metrics;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enhanced_performance_metrics' AND policyname = 'Users can view their own enhanced performance metrics') THEN
        DROP POLICY "Users can view their own enhanced performance metrics" ON enhanced_performance_metrics;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enhanced_performance_metrics' AND policyname = 'Users can manage their own enhanced performance metrics') THEN
        DROP POLICY "Users can manage their own enhanced performance metrics" ON enhanced_performance_metrics;
    END IF;
END $$;

-- Create policies
CREATE POLICY "Users can view organization sales territories" ON sales_territories
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Managers can manage sales territories" ON sales_territories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = sales_territories.organization_id
        )
    );

CREATE POLICY "Users can view organization quota plans" ON quota_plans
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Managers can manage quota plans" ON quota_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = quota_plans.organization_id
        )
    );

CREATE POLICY "Users can view organization compensation plans" ON compensation_plans
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Managers can manage compensation plans" ON compensation_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = compensation_plans.organization_id
        )
    );

CREATE POLICY "Users can view organization performance metrics" ON performance_metrics
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Users can view their own performance metrics" ON performance_metrics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own performance metrics" ON performance_metrics
    FOR ALL USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = performance_metrics.organization_id
        )
    );

CREATE POLICY "Users can view organization commission calculations" ON commission_calculations
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Users can view their own commission calculations" ON commission_calculations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers can manage commission calculations" ON commission_calculations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = commission_calculations.organization_id
        )
    );

CREATE POLICY "Users can view organization metric templates" ON metric_templates
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Managers can manage metric templates" ON metric_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = metric_templates.organization_id
        )
    );

CREATE POLICY "Users can view organization custom metric fields" ON custom_metric_fields
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Managers can manage custom metric fields" ON custom_metric_fields
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = custom_metric_fields.organization_id
        )
    );

CREATE POLICY "Users can view organization enhanced performance metrics" ON enhanced_performance_metrics
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Users can view their own enhanced performance metrics" ON enhanced_performance_metrics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own enhanced performance metrics" ON enhanced_performance_metrics
    FOR ALL USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = enhanced_performance_metrics.organization_id
        )
    );

-- =============================================================================
-- CREATE FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers (drop first if they exist)
DROP TRIGGER IF EXISTS update_sales_territories_updated_at ON sales_territories;
DROP TRIGGER IF EXISTS update_quota_plans_updated_at ON quota_plans;
DROP TRIGGER IF EXISTS update_compensation_plans_updated_at ON compensation_plans;
DROP TRIGGER IF EXISTS update_performance_metrics_updated_at ON performance_metrics;
DROP TRIGGER IF EXISTS update_commission_calculations_updated_at ON commission_calculations;
DROP TRIGGER IF EXISTS update_scenario_plans_updated_at ON scenario_plans;
DROP TRIGGER IF EXISTS update_metric_templates_updated_at ON metric_templates;
DROP TRIGGER IF EXISTS update_enhanced_performance_metrics_updated_at ON enhanced_performance_metrics;
DROP TRIGGER IF EXISTS update_metric_goals_updated_at ON metric_goals;
DROP TRIGGER IF EXISTS update_metric_dashboards_updated_at ON metric_dashboards;

CREATE TRIGGER update_sales_territories_updated_at BEFORE UPDATE ON sales_territories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quota_plans_updated_at BEFORE UPDATE ON quota_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compensation_plans_updated_at BEFORE UPDATE ON compensation_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_metrics_updated_at BEFORE UPDATE ON performance_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commission_calculations_updated_at BEFORE UPDATE ON commission_calculations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scenario_plans_updated_at BEFORE UPDATE ON scenario_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_metric_templates_updated_at BEFORE UPDATE ON metric_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enhanced_performance_metrics_updated_at BEFORE UPDATE ON enhanced_performance_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_metric_goals_updated_at BEFORE UPDATE ON metric_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_metric_dashboards_updated_at BEFORE UPDATE ON metric_dashboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate metric attainment
CREATE OR REPLACE FUNCTION calculate_metric_attainment(
    actual_value DECIMAL,
    target_value DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    IF target_value = 0 THEN
        RETURN 0;
    END IF;
    RETURN LEAST(actual_value / target_value, 10.0);
END;
$$ LANGUAGE plpgsql;

-- Function to get metric trend
CREATE OR REPLACE FUNCTION get_metric_trend(
    current_value DECIMAL,
    previous_value DECIMAL
) RETURNS TEXT AS $$
BEGIN
    IF previous_value = 0 THEN
        RETURN 'new';
    END IF;
    
    IF current_value > previous_value THEN
        RETURN 'up';
    ELSIF current_value < previous_value THEN
        RETURN 'down';
    ELSE
        RETURN 'stable';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INSERT DEFAULT METRIC TEMPLATES
-- =============================================================================

-- Insert default system metric templates
INSERT INTO metric_templates (name, description, category, metric_type, unit, target_default, is_system, organization_id, created_by)
SELECT 
    'Monthly Revenue',
    'Total revenue generated in a month',
    'revenue',
    'currency',
    'USD',
    100000,
    true,
    o.id,
    u.id
FROM organizations o
CROSS JOIN users u
WHERE u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO metric_templates (name, description, category, metric_type, unit, target_default, is_system, organization_id, created_by)
SELECT 
    'Deals Closed',
    'Number of deals closed in a period',
    'deals',
    'count',
    'deals',
    10,
    true,
    o.id,
    u.id
FROM organizations o
CROSS JOIN users u
WHERE u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO metric_templates (name, description, category, metric_type, unit, target_default, is_system, organization_id, created_by)
SELECT 
    'Sales Activities',
    'Number of sales activities completed',
    'activities',
    'count',
    'activities',
    50,
    true,
    o.id,
    u.id
FROM organizations o
CROSS JOIN users u
WHERE u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO metric_templates (name, description, category, metric_type, unit, target_default, is_system, organization_id, created_by)
SELECT 
    'Conversion Rate',
    'Percentage of leads converted to opportunities',
    'conversion',
    'percentage',
    '%',
    25,
    true,
    o.id,
    u.id
FROM organizations o
CROSS JOIN users u
WHERE u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO metric_templates (name, description, category, metric_type, unit, target_default, is_system, organization_id, created_by)
SELECT 
    'Customer Satisfaction Score',
    'Average customer satisfaction rating',
    'customer',
    'score',
    'points',
    4.5,
    true,
    o.id,
    u.id
FROM organizations o
CROSS JOIN users u
WHERE u.role = 'admin'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check that tables were created
SELECT 'Tables created successfully' as status, count(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'sales_territories', 'quota_plans', 'compensation_plans', 'performance_metrics',
    'commission_calculations', 'territory_assignments', 'performance_alerts',
    'scenario_plans', 'sales_recognition', 'metric_templates', 'custom_metric_fields',
    'enhanced_performance_metrics', 'metric_goals', 'metric_dashboards', 'dashboard_metrics'
);

-- Check that metric templates were inserted
SELECT 'Metric templates inserted' as status, count(*) as template_count
FROM metric_templates;

-- Show the inserted templates
SELECT name, category, metric_type, unit, target_default, is_system 
FROM metric_templates 
ORDER BY created_at;
