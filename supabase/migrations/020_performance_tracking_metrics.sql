-- Performance Tracking Metric System Enhancement
-- This migration adds customizable metric templates and tracking capabilities

-- =============================================================================
-- METRIC TEMPLATES AND CUSTOM FIELDS
-- =============================================================================

-- Metric templates table for predefined metric types
CREATE TABLE IF NOT EXISTS metric_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('revenue', 'deals', 'activities', 'conversion', 'customer', 'product', 'custom')),
    metric_type TEXT NOT NULL CHECK (metric_type IN ('count', 'percentage', 'currency', 'duration', 'score', 'ratio')),
    unit TEXT, -- e.g., 'USD', 'calls', 'hours', '%'
    target_default DECIMAL(15,4),
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false, -- System templates vs custom
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom metric fields for flexible tracking
CREATE TABLE IF NOT EXISTS custom_metric_fields (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    metric_template_id UUID NOT NULL REFERENCES metric_templates(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'select')),
    field_options JSONB DEFAULT '{}', -- For select fields
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced performance metrics with custom fields
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
    custom_fields JSONB DEFAULT '{}', -- Store custom field values
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metric goals and targets
CREATE TABLE IF NOT EXISTS metric_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    metric_template_id UUID NOT NULL REFERENCES metric_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    territory_id UUID REFERENCES sales_territories(id) ON DELETE CASCADE,
    goal_period TEXT NOT NULL CHECK (goal_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    target_value DECIMAL(15,4) NOT NULL,
    stretch_target DECIMAL(15,4), -- Optional stretch goal
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metric dashboards configuration
CREATE TABLE IF NOT EXISTS metric_dashboards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for shared dashboards
    is_shared BOOLEAN DEFAULT false,
    dashboard_config JSONB NOT NULL DEFAULT '{}', -- Chart configurations, layout, etc.
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dashboard metric assignments
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
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Metric templates indexes
CREATE INDEX IF NOT EXISTS idx_metric_templates_org ON metric_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_metric_templates_category ON metric_templates(category);
CREATE INDEX IF NOT EXISTS idx_metric_templates_active ON metric_templates(is_active);

-- Custom metric fields indexes
CREATE INDEX IF NOT EXISTS idx_custom_metric_fields_template ON custom_metric_fields(metric_template_id);
CREATE INDEX IF NOT EXISTS idx_custom_metric_fields_org ON custom_metric_fields(organization_id);

-- Enhanced performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_performance_metrics_org ON enhanced_performance_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_performance_metrics_user ON enhanced_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_performance_metrics_template ON enhanced_performance_metrics(metric_template_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_performance_metrics_period ON enhanced_performance_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_enhanced_performance_metrics_status ON enhanced_performance_metrics(status);

-- Metric goals indexes
CREATE INDEX IF NOT EXISTS idx_metric_goals_org ON metric_goals(organization_id);
CREATE INDEX IF NOT EXISTS idx_metric_goals_user ON metric_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_metric_goals_template ON metric_goals(metric_template_id);
CREATE INDEX IF NOT EXISTS idx_metric_goals_period ON metric_goals(goal_period);
CREATE INDEX IF NOT EXISTS idx_metric_goals_active ON metric_goals(is_active);

-- Dashboard indexes
CREATE INDEX IF NOT EXISTS idx_metric_dashboards_org ON metric_dashboards(organization_id);
CREATE INDEX IF NOT EXISTS idx_metric_dashboards_user ON metric_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_metric_dashboards_shared ON metric_dashboards(is_shared);

-- Dashboard metrics indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_dashboard ON dashboard_metrics(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_template ON dashboard_metrics(metric_template_id);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE metric_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_metric_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- Metric templates policies
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

-- Custom metric fields policies
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

-- Enhanced performance metrics policies
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

-- Metric goals policies
CREATE POLICY "Users can view organization metric goals" ON metric_goals
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Users can view their own metric goals" ON metric_goals
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers can manage metric goals" ON metric_goals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = metric_goals.organization_id
        )
    );

-- Dashboard policies
CREATE POLICY "Users can view organization dashboards" ON metric_dashboards
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Users can view their own dashboards" ON metric_dashboards
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own dashboards" ON metric_dashboards
    FOR ALL USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = metric_dashboards.organization_id
        )
    );

-- Dashboard metrics policies
CREATE POLICY "Users can view dashboard metrics" ON dashboard_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM metric_dashboards 
            WHERE id = dashboard_metrics.dashboard_id 
            AND organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
            )
        )
    );

CREATE POLICY "Users can manage dashboard metrics" ON dashboard_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM metric_dashboards 
            WHERE id = dashboard_metrics.dashboard_id 
            AND (
                user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('manager', 'admin')
                    AND organization_id = metric_dashboards.organization_id
                )
            )
        )
    );

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Add updated_at triggers
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
    RETURN LEAST(actual_value / target_value, 10.0); -- Cap at 1000%
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
LIMIT 1;

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
LIMIT 1;

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
LIMIT 1;

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
LIMIT 1;

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
LIMIT 1;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Performance Tracking Metric System enhancement completed successfully!';
    RAISE NOTICE 'Tables created: metric_templates, custom_metric_fields, enhanced_performance_metrics, metric_goals, metric_dashboards, dashboard_metrics';
    RAISE NOTICE 'Default metric templates inserted for common sales metrics';
    RAISE NOTICE 'Indexes, RLS policies, functions, and triggers configured';
END $$;
