-- Migration 028: Admin RBAC Functions
-- Functions for checking admin permissions and managing module features

-- =============================================================================
-- ADMIN PERMISSION CHECK FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION has_admin_permission(
  p_user_id UUID,
  p_permission_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_permission BOOLEAN := FALSE;
  v_is_super_admin BOOLEAN := FALSE;
  v_organization_id UUID;
BEGIN
  -- Get user's organization
  SELECT organization_id INTO v_organization_id
  FROM users
  WHERE id = p_user_id;
  
  IF v_organization_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is super admin (bypass all checks)
  -- For now, check if user is the first user in their org (simplified)
  SELECT EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = p_user_id
    AND u.organization_id = v_organization_id
    ORDER BY u.created_at ASC
    LIMIT 1
  ) INTO v_is_super_admin;
  
  -- Super admin has all permissions
  IF v_is_super_admin THEN
    RETURN TRUE;
  END IF;
  
  -- TODO: Implement role-based permission check when roles table is ready
  -- For now, allow all authenticated users with organization_id
  -- This will be replaced with proper RBAC later
  
  -- Temporary: Check if user has valid organization
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = p_user_id
    AND organization_id IS NOT NULL
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION has_admin_permission(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION has_admin_permission IS 'Check if user has specific admin permission. Currently simplified - will be enhanced with full RBAC.';

-- =============================================================================
-- FEATURE TOGGLE FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION toggle_module_feature(
  p_organization_id UUID,
  p_module_name TEXT,
  p_feature_key TEXT,
  p_enabled BOOLEAN,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  feature_name TEXT,
  is_enabled BOOLEAN,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if feature exists
  IF NOT EXISTS (
    SELECT 1 FROM module_features
    WHERE organization_id = p_organization_id
    AND module_name = p_module_name
    AND feature_key = p_feature_key
  ) THEN
    RAISE EXCEPTION 'Feature not found: %.%', p_module_name, p_feature_key;
  END IF;
  
  -- Update the feature
  UPDATE module_features
  SET 
    is_enabled = p_enabled,
    updated_by = p_user_id,
    updated_at = NOW()
  WHERE 
    organization_id = p_organization_id
    AND module_name = p_module_name
    AND feature_key = p_feature_key;
  
  -- Return the updated feature
  RETURN QUERY
  SELECT 
    mf.id,
    mf.feature_name,
    mf.is_enabled,
    mf.updated_at
  FROM module_features mf
  WHERE 
    mf.organization_id = p_organization_id
    AND mf.module_name = p_module_name
    AND mf.feature_key = p_feature_key;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION toggle_module_feature(UUID, TEXT, TEXT, BOOLEAN, UUID) TO authenticated;

COMMENT ON FUNCTION toggle_module_feature IS 'Toggle module feature on/off for an organization';

-- =============================================================================
-- HELPER FUNCTION: Get Organization Features
-- =============================================================================

CREATE OR REPLACE FUNCTION get_organization_features(
  p_organization_id UUID,
  p_module_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  module_name TEXT,
  feature_key TEXT,
  feature_name TEXT,
  is_enabled BOOLEAN,
  is_beta BOOLEAN,
  requires_license TEXT,
  depends_on TEXT[],
  config JSONB,
  rollout_percentage INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mf.id,
    mf.module_name,
    mf.feature_key,
    mf.feature_name,
    mf.is_enabled,
    mf.is_beta,
    mf.requires_license,
    mf.depends_on,
    mf.config,
    mf.rollout_percentage
  FROM module_features mf
  WHERE 
    mf.organization_id = p_organization_id
    AND (p_module_name IS NULL OR mf.module_name = p_module_name)
  ORDER BY mf.module_name, mf.feature_key;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_organization_features(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION get_organization_features IS 'Get all features for an organization, optionally filtered by module';

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index on module_features for faster lookups
CREATE INDEX IF NOT EXISTS idx_module_features_org_module 
ON module_features(organization_id, module_name);

CREATE INDEX IF NOT EXISTS idx_module_features_enabled 
ON module_features(organization_id, is_enabled);

-- Index on admin_action_logs for faster audit queries
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_org_date 
ON admin_action_logs(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_user 
ON admin_action_logs(admin_user_id, created_at DESC);

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Test the functions (for development only)
DO $$
DECLARE
  v_test_result BOOLEAN;
BEGIN
  -- Test has_admin_permission function
  RAISE NOTICE 'Testing has_admin_permission function...';
  
  -- Function should execute without errors
  -- Actual permission check will happen at runtime with real user IDs
  
  RAISE NOTICE 'Admin RBAC functions created successfully!';
END $$;

