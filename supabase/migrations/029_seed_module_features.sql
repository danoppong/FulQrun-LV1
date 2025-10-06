-- Migration 029: Seed Module Features Data
-- Initialize default module features for all organizations

-- =============================================================================
-- FUNCTION TO SEED FEATURES FOR AN ORGANIZATION
-- =============================================================================

CREATE OR REPLACE FUNCTION seed_module_features_for_org(
  p_organization_id UUID,
  p_created_by UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_inserted_count INTEGER := 0;
  v_row_count INTEGER;
BEGIN
  -- CRM Module Features
  INSERT INTO module_features (
    organization_id, module_name, feature_key, feature_name,
    is_enabled, is_beta, requires_license, depends_on,
    rollout_percentage, created_by
  ) VALUES
  (p_organization_id, 'crm', 'leads', 'Lead Management', TRUE, FALSE, 'standard', '{}', 100, p_created_by),
  (p_organization_id, 'crm', 'contacts', 'Contact Management', TRUE, FALSE, 'standard', '{}', 100, p_created_by),
  (p_organization_id, 'crm', 'companies', 'Company Management', TRUE, FALSE, 'standard', '{}', 100, p_created_by),
  (p_organization_id, 'crm', 'opportunities', 'Opportunity Tracking', TRUE, FALSE, 'standard', ARRAY['leads']::TEXT[], 100, p_created_by),
  (p_organization_id, 'crm', 'ai_scoring', 'AI Lead Scoring', FALSE, TRUE, 'enterprise', ARRAY['leads']::TEXT[], 50, p_created_by),
  (p_organization_id, 'crm', 'email_integration', 'Email Integration', TRUE, FALSE, 'professional', '{}', 100, p_created_by)
  ON CONFLICT (organization_id, module_name, feature_key) DO NOTHING;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;
  
  -- Sales Performance Module Features
  INSERT INTO module_features (
    organization_id, module_name, feature_key, feature_name,
    is_enabled, is_beta, requires_license, depends_on,
    rollout_percentage, created_by
  ) VALUES
  (p_organization_id, 'sales_performance', 'forecasting', 'Sales Forecasting', TRUE, FALSE, 'professional', '{}', 100, p_created_by),
  (p_organization_id, 'sales_performance', 'metrics', 'Performance Metrics', TRUE, FALSE, 'professional', '{}', 100, p_created_by),
  (p_organization_id, 'sales_performance', 'quotas', 'Quota Management', TRUE, FALSE, 'professional', '{}', 100, p_created_by),
  (p_organization_id, 'sales_performance', 'leaderboards', 'Team Leaderboards', TRUE, FALSE, 'standard', ARRAY['metrics']::TEXT[], 100, p_created_by),
  (p_organization_id, 'sales_performance', 'ai_forecasting', 'AI-Powered Forecasting', FALSE, TRUE, 'enterprise', ARRAY['forecasting']::TEXT[], 30, p_created_by)
  ON CONFLICT (organization_id, module_name, feature_key) DO NOTHING;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;
  
  -- KPI & Analytics Module Features
  INSERT INTO module_features (
    organization_id, module_name, feature_key, feature_name,
    is_enabled, is_beta, requires_license, depends_on,
    rollout_percentage, created_by
  ) VALUES
  (p_organization_id, 'kpi', 'dashboards', 'KPI Dashboards', TRUE, FALSE, 'standard', '{}', 100, p_created_by),
  (p_organization_id, 'kpi', 'custom_kpis', 'Custom KPI Builder', TRUE, FALSE, 'professional', '{}', 100, p_created_by),
  (p_organization_id, 'kpi', 'reports', 'Report Generation', TRUE, FALSE, 'standard', '{}', 100, p_created_by),
  (p_organization_id, 'kpi', 'analytics', 'Advanced Analytics', TRUE, FALSE, 'professional', '{}', 100, p_created_by),
  (p_organization_id, 'kpi', 'predictive', 'Predictive Analytics', FALSE, TRUE, 'enterprise', ARRAY['analytics']::TEXT[], 40, p_created_by)
  ON CONFLICT (organization_id, module_name, feature_key) DO NOTHING;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;
  
  -- Learning Platform Module Features
  INSERT INTO module_features (
    organization_id, module_name, feature_key, feature_name,
    is_enabled, is_beta, requires_license, depends_on,
    rollout_percentage, created_by
  ) VALUES
  (p_organization_id, 'learning', 'courses', 'Course Library', TRUE, FALSE, 'professional', '{}', 100, p_created_by),
  (p_organization_id, 'learning', 'certifications', 'Certifications', TRUE, FALSE, 'professional', ARRAY['courses']::TEXT[], 100, p_created_by),
  (p_organization_id, 'learning', 'assessments', 'Knowledge Assessments', TRUE, FALSE, 'professional', '{}', 100, p_created_by),
  (p_organization_id, 'learning', 'ai_coaching', 'AI Sales Coaching', FALSE, TRUE, 'enterprise', ARRAY['courses']::TEXT[], 25, p_created_by)
  ON CONFLICT (organization_id, module_name, feature_key) DO NOTHING;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;
  
  -- Integrations Module Features
  INSERT INTO module_features (
    organization_id, module_name, feature_key, feature_name,
    is_enabled, is_beta, requires_license, depends_on,
    rollout_percentage, created_by
  ) VALUES
  (p_organization_id, 'integrations', 'salesforce', 'Salesforce Integration', FALSE, FALSE, 'enterprise', '{}', 100, p_created_by),
  (p_organization_id, 'integrations', 'hubspot', 'HubSpot Integration', FALSE, FALSE, 'enterprise', '{}', 100, p_created_by),
  (p_organization_id, 'integrations', 'microsoft', 'Microsoft Dynamics', FALSE, FALSE, 'enterprise', '{}', 100, p_created_by),
  (p_organization_id, 'integrations', 'api_access', 'API Access', TRUE, FALSE, 'professional', '{}', 100, p_created_by),
  (p_organization_id, 'integrations', 'webhooks', 'Webhook Support', TRUE, FALSE, 'professional', '{}', 100, p_created_by)
  ON CONFLICT (organization_id, module_name, feature_key) DO NOTHING;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;
  
  -- AI & Automation Module Features
  INSERT INTO module_features (
    organization_id, module_name, feature_key, feature_name,
    is_enabled, is_beta, requires_license, depends_on,
    rollout_percentage, created_by
  ) VALUES
  (p_organization_id, 'ai', 'insights', 'AI Insights', FALSE, TRUE, 'enterprise', '{}', 50, p_created_by),
  (p_organization_id, 'ai', 'recommendations', 'Smart Recommendations', FALSE, TRUE, 'enterprise', '{}', 50, p_created_by),
  (p_organization_id, 'ai', 'automation', 'Workflow Automation', FALSE, TRUE, 'enterprise', '{}', 30, p_created_by),
  (p_organization_id, 'ai', 'nlp', 'Natural Language Processing', FALSE, TRUE, 'enterprise_plus', '{}', 20, p_created_by)
  ON CONFLICT (organization_id, module_name, feature_key) DO NOTHING;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;
  
  -- Mobile App Module Features
  INSERT INTO module_features (
    organization_id, module_name, feature_key, feature_name,
    is_enabled, is_beta, requires_license, depends_on,
    rollout_percentage, created_by
  ) VALUES
  (p_organization_id, 'mobile', 'ios_app', 'iOS App', TRUE, FALSE, 'professional', '{}', 100, p_created_by),
  (p_organization_id, 'mobile', 'android_app', 'Android App', TRUE, FALSE, 'professional', '{}', 100, p_created_by),
  (p_organization_id, 'mobile', 'offline_mode', 'Offline Mode', TRUE, FALSE, 'professional', '{}', 100, p_created_by),
  (p_organization_id, 'mobile', 'voice_logging', 'Voice Logging', FALSE, TRUE, 'enterprise', '{}', 40, p_created_by)
  ON CONFLICT (organization_id, module_name, feature_key) DO NOTHING;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_inserted_count := v_inserted_count + v_row_count;
  
  RETURN v_inserted_count;
END;
$$;

-- =============================================================================
-- SEED FEATURES FOR ALL EXISTING ORGANIZATIONS
-- =============================================================================

DO $$
DECLARE
  v_org RECORD;
  v_first_user_id UUID;
  v_total_inserted INTEGER := 0;
  v_org_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting module features seeding...';
  
  -- Loop through all organizations
  FOR v_org IN 
    SELECT id, name FROM organizations ORDER BY created_at
  LOOP
    -- Get the first user in the organization to use as created_by
    SELECT id INTO v_first_user_id
    FROM users
    WHERE organization_id = v_org.id
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF v_first_user_id IS NULL THEN
      RAISE NOTICE 'Skipping organization % (no users found)', v_org.name;
      CONTINUE;
    END IF;
    
    -- Seed features for this organization
    v_total_inserted := v_total_inserted + seed_module_features_for_org(v_org.id, v_first_user_id);
    v_org_count := v_org_count + 1;
    
    RAISE NOTICE 'Seeded features for organization: %', v_org.name;
  END LOOP;
  
  RAISE NOTICE 'Seeding complete! Inserted % features across % organizations', v_total_inserted, v_org_count;
END $$;

-- =============================================================================
-- CREATE TRIGGER TO AUTO-SEED FEATURES FOR NEW ORGANIZATIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_seed_features_for_new_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_first_user_id UUID;
  v_inserted_count INTEGER;
BEGIN
  -- Wait a moment for users to be created
  PERFORM pg_sleep(0.1);
  
  -- Get the first user in the new organization
  SELECT id INTO v_first_user_id
  FROM users
  WHERE organization_id = NEW.id
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF v_first_user_id IS NOT NULL THEN
    -- Seed features for the new organization
    v_inserted_count := seed_module_features_for_org(NEW.id, v_first_user_id);
    RAISE NOTICE 'Auto-seeded % features for new organization: %', v_inserted_count, NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_auto_seed_features ON organizations;
CREATE TRIGGER trigger_auto_seed_features
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_seed_features_for_new_org();

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
DECLARE
  v_feature_count INTEGER;
  v_org_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_feature_count FROM module_features;
  SELECT COUNT(DISTINCT organization_id) INTO v_org_count FROM module_features;
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Module Features Seeding Summary';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Total features created: %', v_feature_count;
  RAISE NOTICE 'Organizations with features: %', v_org_count;
  RAISE NOTICE '==========================================';
END $$;

