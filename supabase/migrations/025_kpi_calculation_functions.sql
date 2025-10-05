-- Comprehensive KPI Calculation Functions for SPM Module
-- This file contains PostgreSQL functions for calculating all 10 critical sales KPIs

-- =============================================================================
-- PERFORMANCE AND OUTCOME METRICS FUNCTIONS
-- =============================================================================

-- Function to calculate Win Rate
CREATE OR REPLACE FUNCTION calculate_win_rate(
  p_organization_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_territory_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_period_end DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_opportunities INTEGER,
  won_opportunities INTEGER,
  win_rate DECIMAL(5,2)
) AS $$
DECLARE
  total_opps INTEGER;
  won_opps INTEGER;
  win_rate_pct DECIMAL(5,2);
BEGIN
  -- Count total opportunities
  SELECT COUNT(*) INTO total_opps
  FROM opportunities
  WHERE organization_id = p_organization_id
    AND created_at::DATE BETWEEN p_period_start AND p_period_end
    AND (p_user_id IS NULL OR assigned_to = p_user_id)
    AND (p_territory_id IS NULL OR EXISTS (
      SELECT 1 FROM sales_territories st 
      WHERE st.id = p_territory_id 
      AND st.assigned_user_id = opportunities.assigned_to
    ));
  
  -- Count won opportunities
  SELECT COUNT(*) INTO won_opps
  FROM opportunities
  WHERE organization_id = p_organization_id
    AND created_at::DATE BETWEEN p_period_start AND p_period_end
    AND stage = 'closed_won'
    AND (p_user_id IS NULL OR assigned_to = p_user_id)
    AND (p_territory_id IS NULL OR EXISTS (
      SELECT 1 FROM sales_territories st 
      WHERE st.id = p_territory_id 
      AND st.assigned_user_id = opportunities.assigned_to
    ));
  
  -- Calculate win rate percentage
  IF total_opps > 0 THEN
    win_rate_pct := (won_opps::DECIMAL / total_opps::DECIMAL) * 100;
  ELSE
    win_rate_pct := 0;
  END IF;
  
  RETURN QUERY SELECT total_opps, won_opps, win_rate_pct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate Sales Revenue Growth
CREATE OR REPLACE FUNCTION calculate_revenue_growth(
  p_organization_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_territory_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_period_end DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  current_period_revenue DECIMAL(15,2),
  previous_period_revenue DECIMAL(15,2),
  growth_amount DECIMAL(15,2),
  growth_percentage DECIMAL(5,2)
) AS $$
DECLARE
  current_revenue DECIMAL(15,2);
  previous_revenue DECIMAL(15,2);
  growth_amt DECIMAL(15,2);
  growth_pct DECIMAL(5,2);
  period_length INTEGER;
BEGIN
  period_length := p_period_end - p_period_start;
  
  -- Calculate current period revenue
  SELECT COALESCE(SUM(deal_value), 0) INTO current_revenue
  FROM opportunities
  WHERE organization_id = p_organization_id
    AND stage = 'closed_won'
    AND close_date BETWEEN p_period_start AND p_period_end
    AND (p_user_id IS NULL OR assigned_to = p_user_id)
    AND (p_territory_id IS NULL OR EXISTS (
      SELECT 1 FROM sales_territories st 
      WHERE st.id = p_territory_id 
      AND st.assigned_user_id = opportunities.assigned_to
    ));
  
  -- Calculate previous period revenue
  SELECT COALESCE(SUM(deal_value), 0) INTO previous_revenue
  FROM opportunities
  WHERE organization_id = p_organization_id
    AND stage = 'closed_won'
    AND close_date BETWEEN (p_period_start - period_length) AND (p_period_start - 1)
    AND (p_user_id IS NULL OR assigned_to = p_user_id)
    AND (p_territory_id IS NULL OR EXISTS (
      SELECT 1 FROM sales_territories st 
      WHERE st.id = p_territory_id 
      AND st.assigned_user_id = opportunities.assigned_to
    ));
  
  -- Calculate growth
  growth_amt := current_revenue - previous_revenue;
  
  IF previous_revenue > 0 THEN
    growth_pct := (growth_amt / previous_revenue) * 100;
  ELSE
    growth_pct := CASE WHEN current_revenue > 0 THEN 100 ELSE 0 END;
  END IF;
  
  RETURN QUERY SELECT current_revenue, previous_revenue, growth_amt, growth_pct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate Average Deal Size
CREATE OR REPLACE FUNCTION calculate_avg_deal_size(
  p_organization_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_territory_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_period_end DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_revenue DECIMAL(15,2),
  total_deals INTEGER,
  avg_deal_size DECIMAL(15,2),
  median_deal_size DECIMAL(15,2),
  largest_deal DECIMAL(15,2),
  smallest_deal DECIMAL(15,2)
) AS $$
DECLARE
  total_rev DECIMAL(15,2);
  total_deals_count INTEGER;
  avg_size DECIMAL(15,2);
  median_size DECIMAL(15,2);
  largest DECIMAL(15,2);
  smallest DECIMAL(15,2);
BEGIN
  -- Calculate total revenue and deal count
  SELECT 
    COALESCE(SUM(deal_value), 0),
    COUNT(*)
  INTO total_rev, total_deals_count
  FROM opportunities
  WHERE organization_id = p_organization_id
    AND stage = 'closed_won'
    AND close_date BETWEEN p_period_start AND p_period_end
    AND (p_user_id IS NULL OR assigned_to = p_user_id)
    AND (p_territory_id IS NULL OR EXISTS (
      SELECT 1 FROM sales_territories st 
      WHERE st.id = p_territory_id 
      AND st.assigned_user_id = opportunities.assigned_to
    ));
  
  -- Calculate average deal size
  IF total_deals_count > 0 THEN
    avg_size := total_rev / total_deals_count;
  ELSE
    avg_size := 0;
  END IF;
  
  -- Calculate median deal size
  SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY deal_value) INTO median_size
  FROM opportunities
  WHERE organization_id = p_organization_id
    AND stage = 'closed_won'
    AND close_date BETWEEN p_period_start AND p_period_end
    AND deal_value IS NOT NULL
    AND (p_user_id IS NULL OR assigned_to = p_user_id)
    AND (p_territory_id IS NULL OR EXISTS (
      SELECT 1 FROM sales_territories st 
      WHERE st.id = p_territory_id 
      AND st.assigned_user_id = opportunities.assigned_to
    ));
  
  -- Get largest and smallest deals
  SELECT MAX(deal_value), MIN(deal_value) INTO largest, smallest
  FROM opportunities
  WHERE organization_id = p_organization_id
    AND stage = 'closed_won'
    AND close_date BETWEEN p_period_start AND p_period_end
    AND deal_value IS NOT NULL
    AND (p_user_id IS NULL OR assigned_to = p_user_id)
    AND (p_territory_id IS NULL OR EXISTS (
      SELECT 1 FROM sales_territories st 
      WHERE st.id = p_territory_id 
      AND st.assigned_user_id = opportunities.assigned_to
    ));
  
  RETURN QUERY SELECT total_rev, total_deals_count, avg_size, median_size, largest, smallest;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- EFFICIENCY AND PROCESS METRICS FUNCTIONS
-- =============================================================================

-- Function to calculate Sales Cycle Length
CREATE OR REPLACE FUNCTION calculate_sales_cycle_length(
  p_organization_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_territory_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_period_end DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_days INTEGER,
  total_deals INTEGER,
  avg_cycle_length DECIMAL(8,2),
  median_cycle_length DECIMAL(8,2),
  shortest_cycle INTEGER,
  longest_cycle INTEGER
) AS $$
DECLARE
  total_days_sum INTEGER;
  total_deals_count INTEGER;
  avg_length DECIMAL(8,2);
  median_length DECIMAL(8,2);
  shortest INTEGER;
  longest INTEGER;
BEGIN
  -- Calculate total days and deal count
  SELECT 
    COALESCE(SUM(close_date - created_at::DATE), 0),
    COUNT(*)
  INTO total_days_sum, total_deals_count
  FROM opportunities
  WHERE organization_id = p_organization_id
    AND stage = 'closed_won'
    AND close_date BETWEEN p_period_start AND p_period_end
    AND close_date IS NOT NULL
    AND (p_user_id IS NULL OR assigned_to = p_user_id)
    AND (p_territory_id IS NULL OR EXISTS (
      SELECT 1 FROM sales_territories st 
      WHERE st.id = p_territory_id 
      AND st.assigned_user_id = opportunities.assigned_to
    ));
  
  -- Calculate average cycle length
  IF total_deals_count > 0 THEN
    avg_length := total_days_sum::DECIMAL / total_deals_count;
  ELSE
    avg_length := 0;
  END IF;
  
  -- Calculate median cycle length
  SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (close_date - created_at::DATE)) INTO median_length
  FROM opportunities
  WHERE organization_id = p_organization_id
    AND stage = 'closed_won'
    AND close_date BETWEEN p_period_start AND p_period_end
    AND close_date IS NOT NULL
    AND (p_user_id IS NULL OR assigned_to = p_user_id)
    AND (p_territory_id IS NULL OR EXISTS (
      SELECT 1 FROM sales_territories st 
      WHERE st.id = p_territory_id 
      AND st.assigned_user_id = opportunities.assigned_to
    ));
  
  -- Get shortest and longest cycles
  SELECT MIN(close_date - created_at::DATE), MAX(close_date - created_at::DATE) INTO shortest, longest
  FROM opportunities
  WHERE organization_id = p_organization_id
    AND stage = 'closed_won'
    AND close_date BETWEEN p_period_start AND p_period_end
    AND close_date IS NOT NULL
    AND (p_user_id IS NULL OR assigned_to = p_user_id)
    AND (p_territory_id IS NULL OR EXISTS (
      SELECT 1 FROM sales_territories st 
      WHERE st.id = p_territory_id 
      AND st.assigned_user_id = opportunities.assigned_to
    ));
  
  RETURN QUERY SELECT total_days_sum, total_deals_count, avg_length, median_length, shortest, longest;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate Lead Conversion Rate
CREATE OR REPLACE FUNCTION calculate_lead_conversion_rate(
  p_organization_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_territory_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_period_end DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_leads INTEGER,
  qualified_opportunities INTEGER,
  conversion_rate DECIMAL(5,2)
) AS $$
DECLARE
  total_leads_count INTEGER;
  qualified_opps INTEGER;
  conversion_pct DECIMAL(5,2);
BEGIN
  -- Count total leads
  SELECT COUNT(*) INTO total_leads_count
  FROM leads
  WHERE organization_id = p_organization_id
    AND created_at::DATE BETWEEN p_period_start AND p_period_end
    AND (p_user_id IS NULL OR created_by = p_user_id);
  
  -- Count qualified opportunities (leads that became opportunities)
  SELECT COUNT(*) INTO qualified_opps
  FROM opportunities
  WHERE organization_id = p_organization_id
    AND created_at::DATE BETWEEN p_period_start AND p_period_end
    AND stage IN ('qualifying', 'proposal', 'negotiation', 'closed_won', 'closed_lost')
    AND (p_user_id IS NULL OR assigned_to = p_user_id)
    AND (p_territory_id IS NULL OR EXISTS (
      SELECT 1 FROM sales_territories st 
      WHERE st.id = p_territory_id 
      AND st.assigned_user_id = opportunities.assigned_to
    ));
  
  -- Calculate conversion rate
  IF total_leads_count > 0 THEN
    conversion_pct := (qualified_opps::DECIMAL / total_leads_count::DECIMAL) * 100;
  ELSE
    conversion_pct := 0;
  END IF;
  
  RETURN QUERY SELECT total_leads_count, qualified_opps, conversion_pct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate Customer Acquisition Cost
CREATE OR REPLACE FUNCTION calculate_cac(
  p_organization_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_territory_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_period_end DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_cost DECIMAL(15,2),
  new_customers INTEGER,
  cac DECIMAL(15,2)
) AS $$
DECLARE
  total_cost_amount DECIMAL(15,2);
  new_customers_count INTEGER;
  cac_value DECIMAL(15,2);
BEGIN
  -- Calculate total sales and marketing cost (simplified - would need actual cost tracking)
  -- This is a placeholder calculation - in practice, you'd need cost data from marketing/sales systems
  SELECT COALESCE(SUM(
    CASE 
      WHEN stage = 'closed_won' THEN deal_value * 0.1 -- Assume 10% of deal value as acquisition cost
      ELSE 0 
    END
  ), 0) INTO total_cost_amount
  FROM opportunities
  WHERE organization_id = p_organization_id
    AND close_date BETWEEN p_period_start AND p_period_end
    AND (p_user_id IS NULL OR assigned_to = p_user_id)
    AND (p_territory_id IS NULL OR EXISTS (
      SELECT 1 FROM sales_territories st 
      WHERE st.id = p_territory_id 
      AND st.assigned_user_id = opportunities.assigned_to
    ));
  
  -- Count new customers (won deals)
  SELECT COUNT(*) INTO new_customers_count
  FROM opportunities
  WHERE organization_id = p_organization_id
    AND stage = 'closed_won'
    AND close_date BETWEEN p_period_start AND p_period_end
    AND (p_user_id IS NULL OR assigned_to = p_user_id)
    AND (p_territory_id IS NULL OR EXISTS (
      SELECT 1 FROM sales_territories st 
      WHERE st.id = p_territory_id 
      AND st.assigned_user_id = opportunities.assigned_to
    ));
  
  -- Calculate CAC
  IF new_customers_count > 0 THEN
    cac_value := total_cost_amount / new_customers_count;
  ELSE
    cac_value := 0;
  END IF;
  
  RETURN QUERY SELECT total_cost_amount, new_customers_count, cac_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PERFORMANCE MANAGEMENT METRICS FUNCTIONS
-- =============================================================================

-- Function to calculate Quota Attainment
CREATE OR REPLACE FUNCTION calculate_quota_attainment(
  p_organization_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_territory_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_period_end DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  quota_target DECIMAL(15,2),
  actual_achievement DECIMAL(15,2),
  attainment_percentage DECIMAL(5,2)
) AS $$
DECLARE
  quota_target_amount DECIMAL(15,2);
  actual_achievement_amount DECIMAL(15,2);
  attainment_pct DECIMAL(5,2);
BEGIN
  -- Get quota target (from quota_plans table)
  SELECT COALESCE(SUM(target_revenue), 0) INTO quota_target_amount
  FROM quota_plans
  WHERE organization_id = p_organization_id
    AND period_start <= p_period_end
    AND period_end >= p_period_start
    AND (p_user_id IS NULL OR assigned_user_id = p_user_id)
    AND (p_territory_id IS NULL OR territory_id = p_territory_id);
  
  -- Calculate actual achievement
  SELECT COALESCE(SUM(deal_value), 0) INTO actual_achievement_amount
  FROM opportunities
  WHERE organization_id = p_organization_id
    AND stage = 'closed_won'
    AND close_date BETWEEN p_period_start AND p_period_end
    AND (p_user_id IS NULL OR assigned_to = p_user_id)
    AND (p_territory_id IS NULL OR EXISTS (
      SELECT 1 FROM sales_territories st 
      WHERE st.id = p_territory_id 
      AND st.assigned_user_id = opportunities.assigned_to
    ));
  
  -- Calculate attainment percentage
  IF quota_target_amount > 0 THEN
    attainment_pct := (actual_achievement_amount / quota_target_amount) * 100;
  ELSE
    attainment_pct := 0;
  END IF;
  
  RETURN QUERY SELECT quota_target_amount, actual_achievement_amount, attainment_pct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate Customer Lifetime Value
CREATE OR REPLACE FUNCTION calculate_clv(
  p_organization_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_territory_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_period_end DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  avg_purchase_value DECIMAL(15,2),
  purchase_frequency DECIMAL(8,2),
  customer_lifespan_months DECIMAL(8,2),
  clv DECIMAL(15,2)
) AS $$
DECLARE
  avg_purchase DECIMAL(15,2);
  frequency DECIMAL(8,2);
  lifespan DECIMAL(8,2);
  clv_value DECIMAL(15,2);
BEGIN
  -- Calculate average purchase value
  SELECT COALESCE(AVG(deal_value), 0) INTO avg_purchase
  FROM opportunities
  WHERE organization_id = p_organization_id
    AND stage = 'closed_won'
    AND close_date BETWEEN p_period_start AND p_period_end
    AND deal_value IS NOT NULL
    AND (p_user_id IS NULL OR assigned_to = p_user_id)
    AND (p_territory_id IS NULL OR EXISTS (
      SELECT 1 FROM sales_territories st 
      WHERE st.id = p_territory_id 
      AND st.assigned_user_id = opportunities.assigned_to
    ));
  
  -- Calculate purchase frequency (simplified - purchases per year)
  SELECT COALESCE(AVG(purchase_count), 0) INTO frequency
  FROM (
    SELECT company_id, COUNT(*) as purchase_count
    FROM opportunities
    WHERE organization_id = p_organization_id
      AND stage = 'closed_won'
      AND close_date BETWEEN p_period_start AND p_period_end
      AND (p_user_id IS NULL OR assigned_to = p_user_id)
      AND (p_territory_id IS NULL OR EXISTS (
        SELECT 1 FROM sales_territories st 
        WHERE st.id = p_territory_id 
        AND st.assigned_user_id = opportunities.assigned_to
      ))
    GROUP BY company_id
  ) customer_purchases;
  
  -- Calculate customer lifespan (simplified - average months between first and last purchase)
  SELECT COALESCE(AVG(months_diff), 0) INTO lifespan
  FROM (
    SELECT 
      company_id,
      EXTRACT(MONTH FROM AGE(MAX(close_date), MIN(close_date))) as months_diff
    FROM opportunities
    WHERE organization_id = p_organization_id
      AND stage = 'closed_won'
      AND close_date BETWEEN p_period_start AND p_period_end
      AND (p_user_id IS NULL OR assigned_to = p_user_id)
      AND (p_territory_id IS NULL OR EXISTS (
        SELECT 1 FROM sales_territories st 
        WHERE st.id = p_territory_id 
        AND st.assigned_user_id = opportunities.assigned_to
      ))
    GROUP BY company_id
    HAVING COUNT(*) > 1
  ) customer_lifespans;
  
  -- Calculate CLV
  clv_value := avg_purchase * frequency * (lifespan / 12);
  
  RETURN QUERY SELECT avg_purchase, frequency, lifespan, clv_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate Pipeline Coverage Ratio
CREATE OR REPLACE FUNCTION calculate_pipeline_coverage(
  p_organization_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_territory_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_period_end DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_pipeline_value DECIMAL(15,2),
  sales_quota DECIMAL(15,2),
  coverage_ratio DECIMAL(5,2)
) AS $$
DECLARE
  pipeline_value DECIMAL(15,2);
  quota_amount DECIMAL(15,2);
  coverage DECIMAL(5,2);
BEGIN
  -- Calculate total pipeline value
  SELECT COALESCE(SUM(deal_value), 0) INTO pipeline_value
  FROM opportunities
  WHERE organization_id = p_organization_id
    AND stage IN ('prospecting', 'qualifying', 'proposal', 'negotiation')
    AND close_date BETWEEN p_period_start AND p_period_end
    AND (p_user_id IS NULL OR assigned_to = p_user_id)
    AND (p_territory_id IS NULL OR EXISTS (
      SELECT 1 FROM sales_territories st 
      WHERE st.id = p_territory_id 
      AND st.assigned_user_id = opportunities.assigned_to
    ));
  
  -- Get sales quota
  SELECT COALESCE(SUM(target_revenue), 0) INTO quota_amount
  FROM quota_plans
  WHERE organization_id = p_organization_id
    AND period_start <= p_period_end
    AND period_end >= p_period_start
    AND (p_user_id IS NULL OR assigned_user_id = p_user_id)
    AND (p_territory_id IS NULL OR territory_id = p_territory_id);
  
  -- Calculate coverage ratio
  IF quota_amount > 0 THEN
    coverage := pipeline_value / quota_amount;
  ELSE
    coverage := 0;
  END IF;
  
  RETURN QUERY SELECT pipeline_value, quota_amount, coverage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate Sales Activities per Rep
CREATE OR REPLACE FUNCTION calculate_activities_per_rep(
  p_organization_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_territory_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_period_end DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_activities INTEGER,
  calls INTEGER,
  emails INTEGER,
  meetings INTEGER,
  demos INTEGER,
  presentations INTEGER,
  activities_per_day DECIMAL(8,2)
) AS $$
DECLARE
  total_acts INTEGER;
  calls_count INTEGER;
  emails_count INTEGER;
  meetings_count INTEGER;
  demos_count INTEGER;
  presentations_count INTEGER;
  acts_per_day DECIMAL(8,2);
  period_days INTEGER;
BEGIN
  period_days := p_period_end - p_period_start + 1;
  
  -- Count total activities
  SELECT COUNT(*) INTO total_acts
  FROM activities
  WHERE organization_id = p_organization_id
    AND created_at::DATE BETWEEN p_period_start AND p_period_end
    AND (p_user_id IS NULL OR assigned_to = p_user_id);
  
  -- Count activities by type
  SELECT 
    COUNT(*) FILTER (WHERE type = 'call'),
    COUNT(*) FILTER (WHERE type = 'email'),
    COUNT(*) FILTER (WHERE type = 'meeting'),
    COUNT(*) FILTER (WHERE type = 'demo'),
    COUNT(*) FILTER (WHERE type = 'presentation')
  INTO calls_count, emails_count, meetings_count, demos_count, presentations_count
  FROM activities
  WHERE organization_id = p_organization_id
    AND created_at::DATE BETWEEN p_period_start AND p_period_end
    AND (p_user_id IS NULL OR assigned_to = p_user_id);
  
  -- Calculate activities per day
  IF period_days > 0 THEN
    acts_per_day := total_acts::DECIMAL / period_days;
  ELSE
    acts_per_day := 0;
  END IF;
  
  RETURN QUERY SELECT total_acts, calls_count, emails_count, meetings_count, demos_count, presentations_count, acts_per_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- MASTER KPI CALCULATION FUNCTION
-- =============================================================================

-- Master function to calculate all KPIs at once
CREATE OR REPLACE FUNCTION calculate_all_kpis(
  p_organization_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_territory_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_period_end DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  win_rate_data RECORD;
  revenue_growth_data RECORD;
  avg_deal_size_data RECORD;
  sales_cycle_data RECORD;
  lead_conversion_data RECORD;
  cac_data RECORD;
  quota_attainment_data RECORD;
  clv_data RECORD;
  pipeline_coverage_data RECORD;
  activities_data RECORD;
BEGIN
  -- Calculate all KPIs
  SELECT * INTO win_rate_data FROM calculate_win_rate(p_organization_id, p_user_id, p_territory_id, p_period_start, p_period_end);
  SELECT * INTO revenue_growth_data FROM calculate_revenue_growth(p_organization_id, p_user_id, p_territory_id, p_period_start, p_period_end);
  SELECT * INTO avg_deal_size_data FROM calculate_avg_deal_size(p_organization_id, p_user_id, p_territory_id, p_period_start, p_period_end);
  SELECT * INTO sales_cycle_data FROM calculate_sales_cycle_length(p_organization_id, p_user_id, p_territory_id, p_period_start, p_period_end);
  SELECT * INTO lead_conversion_data FROM calculate_lead_conversion_rate(p_organization_id, p_user_id, p_territory_id, p_period_start, p_period_end);
  SELECT * INTO cac_data FROM calculate_cac(p_organization_id, p_user_id, p_territory_id, p_period_start, p_period_end);
  SELECT * INTO quota_attainment_data FROM calculate_quota_attainment(p_organization_id, p_user_id, p_territory_id, p_period_start, p_period_end);
  SELECT * INTO clv_data FROM calculate_clv(p_organization_id, p_user_id, p_territory_id, p_period_start, p_period_end);
  SELECT * INTO pipeline_coverage_data FROM calculate_pipeline_coverage(p_organization_id, p_user_id, p_territory_id, p_period_start, p_period_end);
  SELECT * INTO activities_data FROM calculate_activities_per_rep(p_organization_id, p_user_id, p_territory_id, p_period_start, p_period_end);
  
  -- Build result JSON
  result := jsonb_build_object(
    'win_rate', jsonb_build_object(
      'total_opportunities', win_rate_data.total_opportunities,
      'won_opportunities', win_rate_data.won_opportunities,
      'win_rate', win_rate_data.win_rate
    ),
    'revenue_growth', jsonb_build_object(
      'current_period_revenue', revenue_growth_data.current_period_revenue,
      'previous_period_revenue', revenue_growth_data.previous_period_revenue,
      'growth_amount', revenue_growth_data.growth_amount,
      'growth_percentage', revenue_growth_data.growth_percentage
    ),
    'avg_deal_size', jsonb_build_object(
      'total_revenue', avg_deal_size_data.total_revenue,
      'total_deals', avg_deal_size_data.total_deals,
      'avg_deal_size', avg_deal_size_data.avg_deal_size,
      'median_deal_size', avg_deal_size_data.median_deal_size,
      'largest_deal', avg_deal_size_data.largest_deal,
      'smallest_deal', avg_deal_size_data.smallest_deal
    ),
    'sales_cycle_length', jsonb_build_object(
      'total_days', sales_cycle_data.total_days,
      'total_deals', sales_cycle_data.total_deals,
      'avg_cycle_length', sales_cycle_data.avg_cycle_length,
      'median_cycle_length', sales_cycle_data.median_cycle_length,
      'shortest_cycle', sales_cycle_data.shortest_cycle,
      'longest_cycle', sales_cycle_data.longest_cycle
    ),
    'lead_conversion_rate', jsonb_build_object(
      'total_leads', lead_conversion_data.total_leads,
      'qualified_opportunities', lead_conversion_data.qualified_opportunities,
      'conversion_rate', lead_conversion_data.conversion_rate
    ),
    'cac', jsonb_build_object(
      'total_cost', cac_data.total_cost,
      'new_customers', cac_data.new_customers,
      'cac', cac_data.cac
    ),
    'quota_attainment', jsonb_build_object(
      'quota_target', quota_attainment_data.quota_target,
      'actual_achievement', quota_attainment_data.actual_achievement,
      'attainment_percentage', quota_attainment_data.attainment_percentage
    ),
    'clv', jsonb_build_object(
      'avg_purchase_value', clv_data.avg_purchase_value,
      'purchase_frequency', clv_data.purchase_frequency,
      'customer_lifespan_months', clv_data.customer_lifespan_months,
      'clv', clv_data.clv
    ),
    'pipeline_coverage', jsonb_build_object(
      'total_pipeline_value', pipeline_coverage_data.total_pipeline_value,
      'sales_quota', pipeline_coverage_data.sales_quota,
      'coverage_ratio', pipeline_coverage_data.coverage_ratio
    ),
    'activities_per_rep', jsonb_build_object(
      'total_activities', activities_data.total_activities,
      'calls', activities_data.calls,
      'emails', activities_data.emails,
      'meetings', activities_data.meetings,
      'demos', activities_data.demos,
      'presentations', activities_data.presentations,
      'activities_per_day', activities_data.activities_per_day
    ),
    'calculation_metadata', jsonb_build_object(
      'organization_id', p_organization_id,
      'user_id', p_user_id,
      'territory_id', p_territory_id,
      'period_start', p_period_start,
      'period_end', p_period_end,
      'calculated_at', NOW()
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
