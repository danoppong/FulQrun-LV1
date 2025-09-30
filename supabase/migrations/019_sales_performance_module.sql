-- Sales Performance Module Database Schema
-- This migration adds comprehensive tables for sales performance management
-- including quotas, territories, compensation plans, and performance tracking

-- =============================================================================
-- SALES PERFORMANCE CORE TABLES
-- =============================================================================

-- Sales territories table
CREATE TABLE IF NOT EXISTS sales_territories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    region TEXT,
    zip_codes TEXT[],
    industry_codes TEXT[],
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
    plan_type TEXT NOT NULL CHECK (plan_type IN ('annual', 'quarterly', 'monthly', 'custom')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    target_deals INTEGER DEFAULT 0,
    target_activities INTEGER DEFAULT 0,
    territory_id UUID REFERENCES sales_territories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
    plan_type TEXT NOT NULL CHECK (plan_type IN ('commission_only', 'salary_plus_commission', 'bonus_based', 'hybrid')),
    base_salary DECIMAL(15,2) DEFAULT 0,
    commission_rate DECIMAL(5,4) DEFAULT 0, -- Percentage as decimal (0.05 = 5%)
    commission_cap DECIMAL(15,2),
    bonus_thresholds JSONB DEFAULT '{}', -- Banded bonus structure
    product_weightings JSONB DEFAULT '{}', -- Product-specific commission rates
    territory_id UUID REFERENCES sales_territories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    territory_id UUID REFERENCES sales_territories(id) ON DELETE SET NULL,
    quota_plan_id UUID REFERENCES quota_plans(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    revenue_actual DECIMAL(15,2) DEFAULT 0,
    revenue_target DECIMAL(15,2) DEFAULT 0,
    deals_closed INTEGER DEFAULT 0,
    deals_target INTEGER DEFAULT 0,
    activities_completed INTEGER DEFAULT 0,
    activities_target INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    pipeline_coverage DECIMAL(5,4) DEFAULT 0,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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
    base_salary DECIMAL(15,2) DEFAULT 0,
    commission_earned DECIMAL(15,2) DEFAULT 0,
    bonus_earned DECIMAL(15,2) DEFAULT 0,
    total_compensation DECIMAL(15,2) DEFAULT 0,
    quota_attainment DECIMAL(5,4) DEFAULT 0,
    commission_rate_applied DECIMAL(5,4) DEFAULT 0,
    adjustments JSONB DEFAULT '{}', -- Manual adjustments, spiffs, clawbacks
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'disputed')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    payroll_exported BOOLEAN DEFAULT false,
    payroll_export_date TIMESTAMP WITH TIME ZONE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Territory assignments history table
CREATE TABLE IF NOT EXISTS territory_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    territory_id UUID NOT NULL REFERENCES sales_territories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignment_date DATE NOT NULL,
    unassignment_date DATE,
    reason TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance alerts table
CREATE TABLE IF NOT EXISTS performance_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('quota_at_risk', 'quota_exceeded', 'low_activity', 'high_performance', 'commission_dispute')),
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    threshold_value DECIMAL(15,2),
    actual_value DECIMAL(15,2),
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scenario planning table
CREATE TABLE IF NOT EXISTS scenario_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    scenario_type TEXT NOT NULL CHECK (scenario_type IN ('quota_adjustment', 'territory_redesign', 'compensation_change', 'what_if')),
    base_scenario_id UUID REFERENCES scenario_plans(id) ON DELETE SET NULL,
    assumptions JSONB DEFAULT '{}',
    quota_changes JSONB DEFAULT '{}',
    territory_changes JSONB DEFAULT '{}',
    compensation_changes JSONB DEFAULT '{}',
    impact_analysis JSONB DEFAULT '{}',
    budget_variance DECIMAL(15,2) DEFAULT 0,
    fairness_score DECIMAL(5,4) DEFAULT 0,
    is_active BOOLEAN DEFAULT false,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gamification and recognition table
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

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Territory indexes
CREATE INDEX IF NOT EXISTS idx_sales_territories_org ON sales_territories(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_territories_user ON sales_territories(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_sales_territories_manager ON sales_territories(manager_id);

-- Quota plan indexes
CREATE INDEX IF NOT EXISTS idx_quota_plans_org ON quota_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_quota_plans_user ON quota_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_quota_plans_territory ON quota_plans(territory_id);
CREATE INDEX IF NOT EXISTS idx_quota_plans_dates ON quota_plans(start_date, end_date);

-- Compensation plan indexes
CREATE INDEX IF NOT EXISTS idx_compensation_plans_org ON compensation_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_compensation_plans_user ON compensation_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_compensation_plans_territory ON compensation_plans(territory_id);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_org ON performance_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_period ON performance_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_territory ON performance_metrics(territory_id);

-- Commission calculations indexes
CREATE INDEX IF NOT EXISTS idx_commission_calculations_org ON commission_calculations(organization_id);
CREATE INDEX IF NOT EXISTS idx_commission_calculations_user ON commission_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_calculations_period ON commission_calculations(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_commission_calculations_status ON commission_calculations(status);

-- Territory assignments indexes
CREATE INDEX IF NOT EXISTS idx_territory_assignments_org ON territory_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_territory_assignments_territory ON territory_assignments(territory_id);
CREATE INDEX IF NOT EXISTS idx_territory_assignments_user ON territory_assignments(user_id);

-- Performance alerts indexes
CREATE INDEX IF NOT EXISTS idx_performance_alerts_org ON performance_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_user ON performance_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_manager ON performance_alerts(manager_id);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_resolved ON performance_alerts(is_resolved);

-- Scenario plans indexes
CREATE INDEX IF NOT EXISTS idx_scenario_plans_org ON scenario_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_scenario_plans_active ON scenario_plans(is_active);

-- Sales recognition indexes
CREATE INDEX IF NOT EXISTS idx_sales_recognition_org ON sales_recognition(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_recognition_user ON sales_recognition(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_recognition_type ON sales_recognition(recognition_type);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE sales_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE compensation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE territory_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_recognition ENABLE ROW LEVEL SECURITY;

-- Sales territories policies
CREATE POLICY "Users can view organization territories" ON sales_territories
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Managers can manage territories" ON sales_territories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = sales_territories.organization_id
        )
    );

-- Quota plans policies
CREATE POLICY "Users can view organization quota plans" ON quota_plans
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Users can view their own quota plans" ON quota_plans
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers can manage quota plans" ON quota_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = quota_plans.organization_id
        )
    );

-- Compensation plans policies
CREATE POLICY "Users can view organization compensation plans" ON compensation_plans
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Users can view their own compensation plans" ON compensation_plans
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers can manage compensation plans" ON compensation_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = compensation_plans.organization_id
        )
    );

-- Performance metrics policies
CREATE POLICY "Users can view organization performance metrics" ON performance_metrics
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Users can view their own performance metrics" ON performance_metrics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers can manage performance metrics" ON performance_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = performance_metrics.organization_id
        )
    );

-- Commission calculations policies
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

-- Territory assignments policies
CREATE POLICY "Users can view organization territory assignments" ON territory_assignments
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Managers can manage territory assignments" ON territory_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = territory_assignments.organization_id
        )
    );

-- Performance alerts policies
CREATE POLICY "Users can view organization performance alerts" ON performance_alerts
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Users can view their own performance alerts" ON performance_alerts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers can manage performance alerts" ON performance_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = performance_alerts.organization_id
        )
    );

-- Scenario plans policies
CREATE POLICY "Users can view organization scenario plans" ON scenario_plans
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Managers can manage scenario plans" ON scenario_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = scenario_plans.organization_id
        )
    );

-- Sales recognition policies
CREATE POLICY "Users can view organization sales recognition" ON sales_recognition
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Users can view their own sales recognition" ON sales_recognition
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers can manage sales recognition" ON sales_recognition
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = sales_recognition.organization_id
        )
    );

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_sales_territories_updated_at BEFORE UPDATE ON sales_territories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quota_plans_updated_at BEFORE UPDATE ON quota_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compensation_plans_updated_at BEFORE UPDATE ON compensation_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_metrics_updated_at BEFORE UPDATE ON performance_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commission_calculations_updated_at BEFORE UPDATE ON commission_calculations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scenario_plans_updated_at BEFORE UPDATE ON scenario_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate quota attainment
CREATE OR REPLACE FUNCTION calculate_quota_attainment(
    actual_revenue DECIMAL,
    target_revenue DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    IF target_revenue = 0 THEN
        RETURN 0;
    END IF;
    RETURN LEAST(actual_revenue / target_revenue, 5.0); -- Cap at 500%
END;
$$ LANGUAGE plpgsql;

-- Function to calculate commission based on plan
CREATE OR REPLACE FUNCTION calculate_commission(
    revenue DECIMAL,
    commission_rate DECIMAL,
    quota_attainment DECIMAL,
    bonus_thresholds JSONB DEFAULT '{}'
) RETURNS DECIMAL AS $$
DECLARE
    base_commission DECIMAL;
    bonus_multiplier DECIMAL := 1.0;
    threshold_key TEXT;
    threshold_value DECIMAL;
BEGIN
    -- Calculate base commission
    base_commission := revenue * commission_rate;
    
    -- Apply bonus multipliers based on quota attainment
    FOR threshold_key, threshold_value IN SELECT * FROM jsonb_each_text(bonus_thresholds)
    LOOP
        IF quota_attainment >= threshold_value::DECIMAL THEN
            bonus_multiplier := GREATEST(bonus_multiplier, threshold_key::DECIMAL);
        END IF;
    END LOOP;
    
    RETURN base_commission * bonus_multiplier;
END;
$$ LANGUAGE plpgsql;

-- Function to generate performance alerts
CREATE OR REPLACE FUNCTION generate_performance_alerts()
RETURNS TRIGGER AS $$
DECLARE
    user_org_id UUID;
    user_manager_id UUID;
BEGIN
    -- Get user's organization and manager
    SELECT organization_id, manager_id INTO user_org_id, user_manager_id
    FROM users WHERE id = NEW.user_id;
    
    -- Check for quota at risk (below 50% by mid-period)
    IF NEW.period_end - NEW.period_start > INTERVAL '15 days' AND 
       NEW.revenue_actual < (NEW.revenue_target * 0.5) THEN
        INSERT INTO performance_alerts (
            user_id, manager_id, alert_type, severity, title, message,
            threshold_value, actual_value, organization_id
        ) VALUES (
            NEW.user_id, user_manager_id, 'quota_at_risk', 'high',
            'Quota At Risk', 
            'Current performance indicates risk of missing quota target',
            NEW.revenue_target * 0.5, NEW.revenue_actual, user_org_id
        );
    END IF;
    
    -- Check for quota exceeded (above 120%)
    IF NEW.revenue_actual > (NEW.revenue_target * 1.2) THEN
        INSERT INTO performance_alerts (
            user_id, manager_id, alert_type, severity, title, message,
            threshold_value, actual_value, organization_id
        ) VALUES (
            NEW.user_id, user_manager_id, 'quota_exceeded', 'low',
            'Quota Exceeded', 
            'Congratulations! You have exceeded your quota target',
            NEW.revenue_target * 1.2, NEW.revenue_actual, user_org_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate performance alerts
CREATE TRIGGER trigger_generate_performance_alerts
    AFTER INSERT OR UPDATE ON performance_metrics
    FOR EACH ROW EXECUTE FUNCTION generate_performance_alerts();

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Sales Performance Module database schema created successfully!';
    RAISE NOTICE 'Tables created: sales_territories, quota_plans, compensation_plans, performance_metrics, commission_calculations, territory_assignments, performance_alerts, scenario_plans, sales_recognition';
    RAISE NOTICE 'Indexes, RLS policies, functions, and triggers configured';
END $$;
