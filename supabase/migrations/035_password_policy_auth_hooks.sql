-- =====================================================
-- Supabase Auth Hooks for Password Policy Enforcement
-- =====================================================
-- This migration adds Supabase Auth hooks to enforce password policies
-- at the database level during authentication and password changes

-- =====================================================
-- 1. PASSWORD VALIDATION HOOK FUNCTION
-- =====================================================

-- Function to validate password during signup/password change
CREATE OR REPLACE FUNCTION public.validate_password_policy()
RETURNS TRIGGER AS $$
DECLARE
  validation_result RECORD;
  violation_id UUID;
  violation_type TEXT;
BEGIN
  -- Only validate for password changes, not for other auth operations
  IF TG_OP = 'UPDATE' AND OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password THEN
    -- Validate password against policy
    SELECT * INTO validation_result 
    FROM validate_password_against_policy(
      NEW.id, 
      NEW.raw_user_meta_data->>'password_text',
      NEW.email
    );
    
    -- If password is invalid, record violations and prevent the change
    IF NOT validation_result.is_valid THEN
      -- Record each violation
      FOREACH violation_type IN ARRAY validation_result.violations
      LOOP
        PERFORM record_password_violation(
          NEW.id,
          violation_type,
          jsonb_build_object(
            'strength_score', validation_result.strength_score,
            'strength_level', validation_result.strength_level,
            'policy_requirements', 'Password does not meet organization policy requirements'
          ),
          NEW.encrypted_password,
          NEW.raw_user_meta_data->>'ip_address',
          NEW.raw_user_meta_data->>'user_agent'
        );
      END LOOP;
      
      -- Raise exception to prevent password change
      RAISE EXCEPTION 'Password does not meet policy requirements: %', 
        array_to_string(validation_result.violations, ', ');
    END IF;
    
    -- Check for password reuse
    IF check_password_reuse(NEW.id, NEW.encrypted_password) THEN
      PERFORM record_password_violation(
        NEW.id,
        'reuse_violation',
        jsonb_build_object(
          'message', 'Password has been used recently and cannot be reused'
        ),
        NEW.encrypted_password,
        NEW.raw_user_meta_data->>'ip_address',
        NEW.raw_user_meta_data->>'user_agent'
      );
      
      RAISE EXCEPTION 'Password has been used recently and cannot be reused';
    END IF;
    
    -- Record successful password change in history
    INSERT INTO password_history (user_id, password_hash)
    VALUES (NEW.id, NEW.encrypted_password);
    
    -- Log successful password change
    INSERT INTO password_policy_audit_log (
      policy_id,
      user_id,
      action_type,
      action_details,
      ip_address,
      user_agent
    )
    SELECT 
      pp.id,
      NEW.id,
      'password_changed',
      jsonb_build_object(
        'strength_score', validation_result.strength_score,
        'strength_level', validation_result.strength_level,
        'policy_compliant', true
      ),
      NEW.raw_user_meta_data->>'ip_address',
      NEW.raw_user_meta_data->>'user_agent'
    FROM password_policies pp
    WHERE pp.organization_id = (
      SELECT organization_id FROM users WHERE id = NEW.id
    )
    AND pp.is_active = true
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. PASSWORD AGE CHECK FUNCTION
-- =====================================================

-- Function to check password age and force change if expired
CREATE OR REPLACE FUNCTION public.check_password_age()
RETURNS TRIGGER AS $$
DECLARE
  policy_record RECORD;
  password_age_days INTEGER;
BEGIN
  -- Get user's password policy
  SELECT * INTO policy_record FROM get_user_password_policy(NEW.id);
  
  IF policy_record IS NOT NULL THEN
    -- Calculate password age
    SELECT EXTRACT(DAYS FROM NOW() - created_at)::INTEGER INTO password_age_days
    FROM password_history
    WHERE user_id = NEW.id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If password is older than policy allows, mark user as needing password change
    IF password_age_days > policy_record.max_age_days THEN
      -- Update user metadata to indicate password change required
      NEW.raw_user_meta_data := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
          'password_change_required', true,
          'password_expired_at', NOW(),
          'password_age_days', password_age_days
        );
      
      -- Log password expiration
      INSERT INTO password_policy_audit_log (
        policy_id,
        user_id,
        action_type,
        action_details
      ) VALUES (
        policy_record.policy_id,
        NEW.id,
        'password_expired',
        jsonb_build_object(
          'age_days', password_age_days,
          'max_age_days', policy_record.max_age_days
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. FAILED LOGIN ATTEMPT TRACKING
-- =====================================================

-- Function to track failed login attempts and implement lockout
CREATE OR REPLACE FUNCTION public.track_failed_login()
RETURNS TRIGGER AS $$
DECLARE
  policy_record RECORD;
  failed_count INTEGER;
  lockout_until TIMESTAMPTZ;
BEGIN
  -- Only process failed login attempts
  IF NEW.last_sign_in_at IS NULL AND OLD.last_sign_in_at IS NULL THEN
    -- Get user's password policy
    SELECT * INTO policy_record FROM get_user_password_policy(NEW.id);
    
    IF policy_record IS NOT NULL THEN
      -- Count recent failed attempts
      SELECT COUNT(*) INTO failed_count
      FROM failed_login_attempts
      WHERE email = NEW.email
        AND attempted_at > NOW() - INTERVAL '1 hour';
      
      -- If max attempts exceeded, implement lockout
      IF failed_count >= policy_record.max_failed_attempts THEN
        lockout_until := NOW() + INTERVAL '1 minute' * policy_record.lockout_duration_minutes;
        
        -- Update user metadata with lockout information
        NEW.raw_user_meta_data := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || 
          jsonb_build_object(
            'account_locked', true,
            'lockout_until', lockout_until,
            'failed_attempts', failed_count
          );
        
        -- Log account lockout
        INSERT INTO password_policy_audit_log (
          policy_id,
          user_id,
          action_type,
          action_details
        ) VALUES (
          policy_record.policy_id,
          NEW.id,
          'account_locked',
          jsonb_build_object(
            'failed_attempts', failed_count,
            'lockout_until', lockout_until,
            'lockout_duration_minutes', policy_record.lockout_duration_minutes
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. AUTH INTEGRATION FUNCTIONS (No Triggers - Manual Integration)
-- =====================================================
-- Note: Triggers on auth.users require elevated permissions.
-- These functions can be called manually from application code
-- or integrated via Supabase Edge Functions with proper permissions.

-- =====================================================
-- 5. PASSWORD POLICY ENFORCEMENT FUNCTIONS
-- =====================================================

-- Function to get password policy status for a user
CREATE OR REPLACE FUNCTION get_password_policy_status(user_uuid UUID)
RETURNS TABLE (
  policy_id UUID,
  policy_name TEXT,
  password_age_days INTEGER,
  days_until_expiry INTEGER,
  is_expired BOOLEAN,
  failed_attempts INTEGER,
  is_locked BOOLEAN,
  lockout_until TIMESTAMPTZ,
  last_password_change TIMESTAMPTZ,
  violations_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH policy_info AS (
    SELECT * FROM get_user_password_policy(user_uuid)
  ),
  password_info AS (
    SELECT 
      EXTRACT(DAYS FROM NOW() - created_at)::INTEGER as age_days,
      created_at as last_change
    FROM password_history
    WHERE user_id = user_uuid
    ORDER BY created_at DESC
    LIMIT 1
  ),
  failed_attempts_info AS (
    SELECT COUNT(*)::INTEGER as attempts
    FROM failed_login_attempts
    WHERE email = (SELECT email FROM auth.users WHERE id = user_uuid)
      AND attempted_at > NOW() - INTERVAL '1 hour'
  ),
  violations_info AS (
    SELECT COUNT(*)::INTEGER as violations
    FROM password_policy_violations
    WHERE user_id = user_uuid
      AND created_at > NOW() - INTERVAL '30 days'
  )
  SELECT 
    pi.policy_id,
    pp.policy_name,
    COALESCE(pw.age_days, 0),
    CASE 
      WHEN pi.max_age_days IS NOT NULL THEN pi.max_age_days - COALESCE(pw.age_days, 0)
      ELSE NULL
    END,
    CASE 
      WHEN pi.max_age_days IS NOT NULL AND pw.age_days > pi.max_age_days THEN true
      ELSE false
    END,
    COALESCE(fa.attempts, 0),
    CASE 
      WHEN fa.attempts >= pi.max_failed_attempts THEN true
      ELSE false
    END,
    CASE 
      WHEN fa.attempts >= pi.max_failed_attempts 
      THEN NOW() + INTERVAL '1 minute' * pi.lockout_duration_minutes
      ELSE NULL
    END,
    pw.last_change,
    COALESCE(vi.violations, 0)
  FROM policy_info pi
  LEFT JOIN password_policies pp ON pi.policy_id = pp.id
  LEFT JOIN password_info pw ON true
  LEFT JOIN failed_attempts_info fa ON true
  LEFT JOIN violations_info vi ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to force password change for user
CREATE OR REPLACE FUNCTION force_password_change(user_uuid UUID, reason TEXT DEFAULT 'policy_requirement')
RETURNS BOOLEAN AS $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Get user's password policy
  SELECT * INTO policy_record FROM get_user_password_policy(user_uuid);
  
  IF policy_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update user metadata to require password change
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'password_change_required', true,
      'password_change_reason', reason,
      'password_change_required_at', NOW()
    )
  WHERE id = user_uuid;
  
  -- Log the forced password change requirement
  INSERT INTO password_policy_audit_log (
    policy_id,
    user_id,
    action_type,
    action_details
  ) VALUES (
    policy_record.policy_id,
    user_uuid,
    'password_change_forced',
    jsonb_build_object(
      'reason', reason,
      'forced_at', NOW()
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlock user account
CREATE OR REPLACE FUNCTION unlock_user_account(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Get user's password policy
  SELECT * INTO policy_record FROM get_user_password_policy(user_uuid);
  
  IF policy_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Clear lockout from user metadata
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data - 'account_locked' - 'lockout_until' - 'failed_attempts'
  WHERE id = user_uuid;
  
  -- Clear failed login attempts
  DELETE FROM failed_login_attempts
  WHERE email = (SELECT email FROM auth.users WHERE id = user_uuid);
  
  -- Log the unlock action
  INSERT INTO password_policy_audit_log (
    policy_id,
    user_id,
    action_type,
    action_details
  ) VALUES (
    policy_record.policy_id,
    user_uuid,
    'account_unlocked',
    jsonb_build_object(
      'unlocked_at', NOW(),
      'unlocked_by', 'system'
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. HELPER FUNCTIONS FOR API INTEGRATION
-- =====================================================

-- Function to validate password without changing it (for API use)
CREATE OR REPLACE FUNCTION api_validate_password(
  user_uuid UUID,
  password_text TEXT,
  email_text TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  validation_result RECORD;
  result JSONB;
  violation_type TEXT;
BEGIN
  -- Validate password against policy
  SELECT * INTO validation_result 
  FROM validate_password_against_policy(user_uuid, password_text, email_text);
  
  -- Build result JSON
  result := jsonb_build_object(
    'is_valid', validation_result.is_valid,
    'violations', validation_result.violations,
    'strength_score', validation_result.strength_score,
    'strength_level', validation_result.strength_level,
    'policy_compliant', validation_result.is_valid
  );
  
  -- If password is invalid, record violations (but don't prevent the operation)
  IF NOT validation_result.is_valid THEN
    FOREACH violation_type IN ARRAY validation_result.violations
    LOOP
      PERFORM record_password_violation(
        user_uuid,
        violation_type,
        jsonb_build_object(
          'strength_score', validation_result.strength_score,
          'strength_level', validation_result.strength_level,
          'validation_context', 'api_validation'
        ),
        NULL, -- Don't store password hash for API validation
        NULL, -- IP address not available in this context
        NULL  -- User agent not available in this context
      );
    END LOOP;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get password policy requirements for display
CREATE OR REPLACE FUNCTION get_password_policy_requirements(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  policy_record RECORD;
  result JSONB;
BEGIN
  -- Get user's password policy
  SELECT * INTO policy_record FROM get_user_password_policy(user_uuid);
  
  IF policy_record IS NULL THEN
    RETURN jsonb_build_object(
      'has_policy', false,
      'message', 'No password policy configured'
    );
  END IF;
  
  -- Build requirements JSON
  result := jsonb_build_object(
    'has_policy', true,
    'policy_id', policy_record.policy_id,
    'requirements', jsonb_build_object(
      'min_length', policy_record.min_length,
      'require_uppercase', policy_record.require_uppercase,
      'require_lowercase', policy_record.require_lowercase,
      'require_numbers', policy_record.require_numbers,
      'require_special_chars', policy_record.require_special_chars,
      'max_age_days', policy_record.max_age_days,
      'prevent_reuse_count', policy_record.prevent_reuse_count,
      'complexity_score_min', policy_record.complexity_score_min
    ),
    'security_settings', jsonb_build_object(
      'max_failed_attempts', policy_record.max_failed_attempts,
      'lockout_duration_minutes', policy_record.lockout_duration_minutes
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_password_policy(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_password_against_policy(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_password_reuse(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_password_violation(UUID, TEXT, JSONB, TEXT, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_password_policy_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION force_password_change(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_user_account(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION api_validate_password(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_password_policy_requirements(UUID) TO authenticated;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION public.validate_password_policy() IS 'Validates passwords against organization policies during auth operations';
COMMENT ON FUNCTION public.check_password_age() IS 'Checks password age and marks expired passwords for change';
COMMENT ON FUNCTION public.track_failed_login() IS 'Tracks failed login attempts and implements account lockout';
COMMENT ON FUNCTION get_password_policy_status(UUID) IS 'Returns comprehensive password policy status for a user';
COMMENT ON FUNCTION force_password_change(UUID, TEXT) IS 'Forces a user to change their password';
COMMENT ON FUNCTION unlock_user_account(UUID) IS 'Unlocks a locked user account';
COMMENT ON FUNCTION api_validate_password(UUID, TEXT, TEXT) IS 'API function to validate passwords without enforcement';
COMMENT ON FUNCTION get_password_policy_requirements(UUID) IS 'Returns password policy requirements for display to users';

-- =====================================================
-- INTEGRATION NOTES
-- =====================================================
-- To integrate password policy enforcement with Supabase Auth:
-- 
-- 1. Use Supabase Edge Functions with elevated permissions to create triggers
-- 2. Call validation functions from your application code before auth operations
-- 3. Use the API functions (api_validate_password, get_password_policy_status) 
--    for real-time validation in your frontend
-- 4. Implement password change workflows using force_password_change()
-- 5. Monitor violations using password_policy_violations table
--
-- Example Edge Function trigger creation (requires elevated permissions):
-- CREATE TRIGGER password_policy_validation_trigger
--   BEFORE INSERT OR UPDATE ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.validate_password_policy();
