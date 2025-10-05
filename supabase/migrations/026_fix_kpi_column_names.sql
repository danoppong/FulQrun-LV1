-- Fix KPI calculation functions to use correct column names
-- This migration fixes the target_amount column references to use target_revenue

-- Drop and recreate the quota attainment function with correct column names
DROP FUNCTION IF EXISTS calculate_quota_attainment(UUID, UUID, UUID, DATE, DATE);

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
    AND start_date <= p_period_end
    AND end_date >= p_period_start
    AND (p_user_id IS NULL OR user_id = p_user_id)
    AND (p_territory_id IS NULL OR territory_id = p_territory_id);
  
  -- Get actual achievement (from opportunities table)
  SELECT COALESCE(SUM(COALESCE(deal_value, value)), 0) INTO actual_achievement_amount
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

-- Drop and recreate the pipeline coverage function with correct column names
DROP FUNCTION IF EXISTS calculate_pipeline_coverage(UUID, UUID, UUID, DATE, DATE);

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
  -- Get total pipeline value
  SELECT COALESCE(SUM(COALESCE(deal_value, value)), 0) INTO pipeline_value
  FROM opportunities
  WHERE organization_id = p_organization_id
    AND stage NOT IN ('closed_won', 'closed_lost')
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
    AND start_date <= p_period_end
    AND end_date >= p_period_start
    AND (p_user_id IS NULL OR user_id = p_user_id)
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
