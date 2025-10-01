-- Sales Performance Module Enhancement
-- This migration enhances the sales performance module with:
-- - Hierarchical target planning
-- - Enhanced scenario planning capabilities
-- - Improved audit trails
-- - Territory fairness calculations
-- - Product/SKU level tracking

-- =============================================================================
-- ENHANCED TABLES
-- =============================================================================

-- Add hierarchical planning fields to quota_plans
ALTER TABLE quota_plans ADD COLUMN IF NOT EXISTS parent_plan_id UUID REFERENCES quota_plans(id) ON DELETE CASCADE;
ALTER TABLE quota_plans ADD COLUMN IF NOT EXISTS planning_method TEXT CHECK (planning_method IN ('top_down', 'bottom_up', 'middle_out', 'direct'));
ALTER TABLE quota_plans ADD COLUMN IF NOT EXISTS planning_level TEXT CHECK (planning_level IN ('executive', 'director', 'manager', 'team', 'individual'));
ALTER TABLE quota_plans ADD COLUMN IF NOT EXISTS is_reconciled BOOLEAN DEFAULT false;
ALTER TABLE quota_plans ADD COLUMN IF NOT EXISTS reconciliation_notes TEXT;
ALTER TABLE quota_plans ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE quota_plans ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE quota_plans ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add fairness index to territories
ALTER TABLE sales_territories ADD COLUMN IF NOT EXISTS fairness_index DECIMAL(5,4);
ALTER TABLE sales_territories ADD COLUMN IF NOT EXISTS territory_value DECIMAL(15,2);
ALTER TABLE sales_territories ADD COLUMN IF NOT EXISTS account_count INTEGER DEFAULT 0;
ALTER TABLE sales_territories ADD COLUMN IF NOT EXISTS opportunity_count INTEGER DEFAULT 0;
ALTER TABLE sales_territories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add product/SKU tracking fields to performance metrics
ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS product_category TEXT;
ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS performance_date DATE;
ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS daily_revenue DECIMAL(15,2) DEFAULT 0;
ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS expected_commission DECIMAL(15,2) DEFAULT 0;

-- Enhance scenario plans with more detailed tracking
ALTER TABLE scenario_plans ADD COLUMN IF NOT EXISTS coverage_ratio DECIMAL(5,4);
ALTER TABLE scenario_plans ADD COLUMN IF NOT EXISTS expected_attainment DECIMAL(5,4);
ALTER TABLE scenario_plans ADD COLUMN IF NOT EXISTS optimality_score DECIMAL(5,4);
ALTER TABLE scenario_plans ADD COLUMN IF NOT EXISTS simulation_results JSONB DEFAULT '{}';
ALTER TABLE scenario_plans ADD COLUMN IF NOT EXISTS is_rolled_out BOOLEAN DEFAULT false;
ALTER TABLE scenario_plans ADD COLUMN IF NOT EXISTS rolled_out_at TIMESTAMP WITH TIME ZONE;

-- =============================================================================
-- NEW TABLES
-- =============================================================================

-- Territory accounts mapping
CREATE TABLE IF NOT EXISTS territory_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    territory_id UUID NOT NULL REFERENCES sales_territories(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL, -- External CRM account ID
    account_name TEXT,
    account_revenue DECIMAL(15,2),
    account_tier TEXT,
    assigned_date DATE DEFAULT CURRENT_DATE,
    assignment_reason TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily performance tracking for granular visibility
CREATE TABLE IF NOT EXISTS daily_performance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    performance_date DATE NOT NULL,
    territory_id UUID REFERENCES sales_territories(id) ON DELETE SET NULL,
    quota_plan_id UUID REFERENCES quota_plans(id) ON DELETE SET NULL,
    daily_revenue DECIMAL(15,2) DEFAULT 0,
    daily_deals INTEGER DEFAULT 0,
    daily_activities INTEGER DEFAULT 0,
    expected_commission DECIMAL(15,2) DEFAULT 0,
    ytd_revenue DECIMAL(15,2) DEFAULT 0,
    ytd_quota_attainment DECIMAL(5,4) DEFAULT 0,
    run_rate_projection DECIMAL(15,2) DEFAULT 0,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, performance_date, organization_id)
);

-- Product performance tracking
CREATE TABLE IF NOT EXISTS product_performance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_category TEXT NOT NULL,
    product_name TEXT NOT NULL,
    sku TEXT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    units_sold INTEGER DEFAULT 0,
    revenue DECIMAL(15,2) DEFAULT 0,
    commission_earned DECIMAL(15,2) DEFAULT 0,
    target_revenue DECIMAL(15,2),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer performance tracking
CREATE TABLE IF NOT EXISTS customer_performance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL,
    customer_name TEXT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    revenue DECIMAL(15,2) DEFAULT 0,
    deals_closed INTEGER DEFAULT 0,
    activities_count INTEGER DEFAULT 0,
    last_interaction_date DATE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logging for coaching and analysis
CREATE TABLE IF NOT EXISTS sales_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'demo', 'meeting', 'email', 'presentation', 'proposal')),
    activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
    customer_id TEXT,
    opportunity_id TEXT,
    duration_minutes INTEGER,
    outcome TEXT CHECK (outcome IN ('successful', 'unsuccessful', 'follow_up_required', 'no_response')),
    notes TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commission adjustments for spiffs, clawbacks, etc.
CREATE TABLE IF NOT EXISTS commission_adjustments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    commission_calculation_id UUID NOT NULL REFERENCES commission_calculations(id) ON DELETE CASCADE,
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('spiff', 'clawback', 'bonus', 'correction', 'dispute_resolution')),
    amount DECIMAL(15,2) NOT NULL,
    reason TEXT NOT NULL,
    justification TEXT NOT NULL,
    adjusted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for all compensation and quota changes
CREATE TABLE IF NOT EXISTS sales_performance_audit (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('territory', 'quota_plan', 'compensation_plan', 'commission', 'scenario')),
    entity_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'approve', 'reject')),
    changed_fields JSONB DEFAULT '{}',
    old_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    change_reason TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payroll export tracking
CREATE TABLE IF NOT EXISTS payroll_exports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    export_name TEXT NOT NULL,
    export_type TEXT CHECK (export_type IN ('csv', 'json', 'api')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_commissions DECIMAL(15,2) DEFAULT 0,
    total_employees INTEGER DEFAULT 0,
    export_data JSONB,
    exported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    export_status TEXT DEFAULT 'pending' CHECK (export_status IN ('pending', 'completed', 'failed')),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR NEW TABLES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_territory_accounts_territory ON territory_accounts(territory_id);
CREATE INDEX IF NOT EXISTS idx_territory_accounts_org ON territory_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_performance_user_date ON daily_performance(user_id, performance_date);
CREATE INDEX IF NOT EXISTS idx_daily_performance_org ON daily_performance(organization_id);
CREATE INDEX IF NOT EXISTS idx_product_performance_user ON product_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_product_performance_period ON product_performance(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_customer_performance_user ON customer_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_performance_customer ON customer_performance(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_user ON sales_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_date ON sales_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_commission_adjustments_calculation ON commission_adjustments(commission_calculation_id);
CREATE INDEX IF NOT EXISTS idx_sales_performance_audit_entity ON sales_performance_audit(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sales_performance_audit_date ON sales_performance_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_payroll_exports_org ON payroll_exports(organization_id);
CREATE INDEX IF NOT EXISTS idx_payroll_exports_period ON payroll_exports(period_start, period_end);

-- =============================================================================
-- RLS POLICIES FOR NEW TABLES
-- =============================================================================

ALTER TABLE territory_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_performance_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_exports ENABLE ROW LEVEL SECURITY;

-- Territory accounts policies
CREATE POLICY "Users can view organization territory accounts" ON territory_accounts
    FOR SELECT USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Managers can manage territory accounts" ON territory_accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = territory_accounts.organization_id
        )
    );

-- Daily performance policies
CREATE POLICY "Users can view their own daily performance" ON daily_performance
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin')
        AND organization_id = daily_performance.organization_id
    ));

CREATE POLICY "System can insert daily performance" ON daily_performance
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = daily_performance.organization_id
        )
    );

-- Product performance policies
CREATE POLICY "Users can view their own product performance" ON product_performance
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin')
        AND organization_id = product_performance.organization_id
    ));

-- Customer performance policies
CREATE POLICY "Users can view their own customer performance" ON customer_performance
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin')
        AND organization_id = customer_performance.organization_id
    ));

-- Sales activities policies
CREATE POLICY "Users can manage their own activities" ON sales_activities
    FOR ALL USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin')
        AND organization_id = sales_activities.organization_id
    ));

-- Commission adjustments policies
CREATE POLICY "Users can view organization commission adjustments" ON commission_adjustments
    FOR SELECT USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Managers can manage commission adjustments" ON commission_adjustments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = commission_adjustments.organization_id
        )
    );

-- Audit log policies (read-only)
CREATE POLICY "Users can view organization audit logs" ON sales_performance_audit
    FOR SELECT USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Payroll exports policies
CREATE POLICY "Managers can view payroll exports" ON payroll_exports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = payroll_exports.organization_id
        )
    );

CREATE POLICY "Managers can create payroll exports" ON payroll_exports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
            AND organization_id = payroll_exports.organization_id
        )
    );

-- =============================================================================
-- ENHANCED FUNCTIONS
-- =============================================================================

-- Function to calculate territory fairness index
CREATE OR REPLACE FUNCTION calculate_territory_fairness(
    p_territory_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    v_avg_revenue DECIMAL;
    v_avg_accounts INTEGER;
    v_territory_revenue DECIMAL;
    v_territory_accounts INTEGER;
    v_fairness_score DECIMAL;
BEGIN
    -- Get organization averages
    SELECT AVG(territory_value), AVG(account_count) 
    INTO v_avg_revenue, v_avg_accounts
    FROM sales_territories 
    WHERE organization_id = (
        SELECT organization_id FROM sales_territories WHERE id = p_territory_id
    ) AND is_active = true;
    
    -- Get territory specifics
    SELECT territory_value, account_count
    INTO v_territory_revenue, v_territory_accounts
    FROM sales_territories WHERE id = p_territory_id;
    
    -- Calculate fairness (0-1 scale, 1 = perfectly fair)
    -- Formula: 1 - (abs(territory_value - avg_value) / avg_value)
    IF v_avg_revenue > 0 AND v_avg_accounts > 0 THEN
        v_fairness_score := 1 - (
            (ABS(v_territory_revenue - v_avg_revenue) / v_avg_revenue * 0.6) +
            (ABS(v_territory_accounts - v_avg_accounts) / v_avg_accounts * 0.4)
        );
        RETURN GREATEST(0, LEAST(1, v_fairness_score));
    END IF;
    
    RETURN 0.5; -- Default middle score if no data
END;
$$ LANGUAGE plpgsql;

-- Function to calculate expected commission based on current run-rate
CREATE OR REPLACE FUNCTION calculate_expected_commission(
    p_user_id UUID,
    p_quota_plan_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    v_ytd_revenue DECIMAL;
    v_target_revenue DECIMAL;
    v_commission_rate DECIMAL;
    v_days_elapsed INTEGER;
    v_total_days INTEGER;
    v_projected_revenue DECIMAL;
    v_expected_commission DECIMAL;
BEGIN
    -- Get YTD revenue
    SELECT COALESCE(SUM(daily_revenue), 0)
    INTO v_ytd_revenue
    FROM daily_performance
    WHERE user_id = p_user_id 
    AND quota_plan_id = p_quota_plan_id;
    
    -- Get target and commission rate
    SELECT qp.target_revenue, cp.commission_rate
    INTO v_target_revenue, v_commission_rate
    FROM quota_plans qp
    LEFT JOIN compensation_plans cp ON cp.user_id = qp.user_id
    WHERE qp.id = p_quota_plan_id;
    
    -- Calculate projection
    SELECT 
        EXTRACT(DAY FROM CURRENT_DATE - start_date),
        EXTRACT(DAY FROM end_date - start_date)
    INTO v_days_elapsed, v_total_days
    FROM quota_plans WHERE id = p_quota_plan_id;
    
    IF v_days_elapsed > 0 THEN
        v_projected_revenue := (v_ytd_revenue / v_days_elapsed) * v_total_days;
        v_expected_commission := v_projected_revenue * COALESCE(v_commission_rate, 0.05);
        RETURN v_expected_commission;
    END IF;
    
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION log_sales_performance_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO sales_performance_audit (
        entity_type,
        entity_id,
        action,
        changed_fields,
        old_values,
        new_values,
        changed_by,
        organization_id
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'create'
            WHEN TG_OP = 'UPDATE' THEN 'update'
            WHEN TG_OP = 'DELETE' THEN 'delete'
        END,
        CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW) - to_jsonb(OLD) ELSE '{}' END,
        CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE '{}' END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE '{}' END,
        auth.uid(),
        COALESCE(NEW.organization_id, OLD.organization_id)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- AUDIT TRIGGERS
-- =============================================================================

CREATE TRIGGER audit_quota_plans_changes
    AFTER INSERT OR UPDATE OR DELETE ON quota_plans
    FOR EACH ROW EXECUTE FUNCTION log_sales_performance_change();

CREATE TRIGGER audit_compensation_plans_changes
    AFTER INSERT OR UPDATE OR DELETE ON compensation_plans
    FOR EACH ROW EXECUTE FUNCTION log_sales_performance_change();

CREATE TRIGGER audit_sales_territories_changes
    AFTER INSERT OR UPDATE OR DELETE ON sales_territories
    FOR EACH ROW EXECUTE FUNCTION log_sales_performance_change();

CREATE TRIGGER audit_commission_calculations_changes
    AFTER INSERT OR UPDATE OR DELETE ON commission_calculations
    FOR EACH ROW EXECUTE FUNCTION log_sales_performance_change();

-- =============================================================================
-- UPDATED_AT TRIGGERS FOR NEW TABLES
-- =============================================================================

CREATE TRIGGER update_territory_accounts_updated_at 
    BEFORE UPDATE ON territory_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_performance_updated_at 
    BEFORE UPDATE ON daily_performance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_performance_updated_at 
    BEFORE UPDATE ON product_performance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_performance_updated_at 
    BEFORE UPDATE ON customer_performance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Sales Performance Module Enhancement completed successfully!';
    RAISE NOTICE 'New tables: territory_accounts, daily_performance, product_performance, customer_performance, sales_activities, commission_adjustments, sales_performance_audit, payroll_exports';
    RAISE NOTICE 'Enhanced tables: quota_plans (hierarchical planning), sales_territories (fairness index), performance_metrics (product/SKU tracking), scenario_plans (advanced metrics)';
    RAISE NOTICE 'New functions: calculate_territory_fairness, calculate_expected_commission, log_sales_performance_change';
END $$;

