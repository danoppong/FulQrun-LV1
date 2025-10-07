-- =====================================================
-- Password Policies Database Schema
-- =====================================================
-- This migration adds comprehensive password policy enforcement including:
-- - Organization-level password policies
-- - Password history tracking
-- - Policy enforcement functions
-- - Supabase Auth integration

-- =====================================================
-- 1. PASSWORD POLICIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS password_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  description TEXT,
  
  -- Password Requirements
  min_length INTEGER NOT NULL DEFAULT 8 CHECK (min_length >= 8 AND min_length <= 50),
  require_uppercase BOOLEAN NOT NULL DEFAULT true,
  require_lowercase BOOLEAN NOT NULL DEFAULT true,
  require_numbers BOOLEAN NOT NULL DEFAULT true,
  require_special_chars BOOLEAN NOT NULL DEFAULT true,
  
  -- Password Lifecycle
  max_age_days INTEGER NOT NULL DEFAULT 90 CHECK (max_age_days >= 30 AND max_age_days <= 365),
  prevent_reuse_count INTEGER NOT NULL DEFAULT 5 CHECK (prevent_reuse_count >= 1 AND prevent_reuse_count <= 24),
  
  -- Security Settings
  complexity_score_min INTEGER NOT NULL DEFAULT 6 CHECK (complexity_score_min >= 1 AND complexity_score_min <= 10),
  max_failed_attempts INTEGER NOT NULL DEFAULT 5 CHECK (max_failed_attempts >= 3 AND max_failed_attempts <= 10),
  lockout_duration_minutes INTEGER NOT NULL DEFAULT 15 CHECK (lockout_duration_minutes >= 5 AND lockout_duration_minutes <= 60),
  
  -- Policy Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- Constraints
  UNIQUE(organization_id, policy_name)
);

-- =====================================================
-- 2. PASSWORD POLICY ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS password_policy_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES password_policies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID, -- Will add foreign key constraint later when roles table exists
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Ensure either user_id or role_id is set, but not both
  CONSTRAINT check_user_or_role CHECK (
    (user_id IS NOT NULL AND role_id IS NULL) OR 
    (user_id IS NULL AND role_id IS NOT NULL)
  )
);

-- =====================================================
-- 3. PASSWORD POLICY VIOLATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS password_policy_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES password_policies(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL CHECK (violation_type IN (
    'length_insufficient', 'missing_uppercase', 'missing_lowercase', 
    'missing_numbers', 'missing_special_chars', 'common_password',
    'email_similarity', 'reuse_violation', 'age_exceeded'
  )),
  violation_details JSONB,
  attempted_password_hash TEXT, -- Store hash for audit purposes
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. PASSWORD POLICY AUDIT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS password_policy_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES password_policies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'policy_created', 'policy_updated', 'policy_deleted', 'policy_applied',
    'password_changed', 'password_validated', 'violation_recorded'
  )),
  action_details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Password Policies
CREATE INDEX IF NOT EXISTS idx_password_policies_org ON password_policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_password_policies_active ON password_policies(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_password_policies_default ON password_policies(organization_id, is_default);

-- Partial unique index to ensure only one default policy per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_password_policies_unique_default 
ON password_policies(organization_id) 
WHERE is_default = true;

-- Policy Assignments
CREATE INDEX IF NOT EXISTS idx_policy_assignments_policy ON password_policy_assignments(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_assignments_user ON password_policy_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_assignments_role ON password_policy_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_policy_assignments_active ON password_policy_assignments(is_active);

-- Policy Violations
CREATE INDEX IF NOT EXISTS idx_policy_violations_user ON password_policy_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_policy ON password_policy_violations(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_type ON password_policy_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_policy_violations_created ON password_policy_violations(created_at);

-- Audit Log
CREATE INDEX IF NOT EXISTS idx_policy_audit_policy ON password_policy_audit_log(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_audit_user ON password_policy_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_audit_action ON password_policy_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_policy_audit_created ON password_policy_audit_log(created_at);

-- =====================================================
-- FUNCTIONS FOR PASSWORD POLICY ENFORCEMENT
-- =====================================================

-- Function to get active password policy for user
CREATE OR REPLACE FUNCTION get_user_password_policy(user_uuid UUID)
RETURNS TABLE (
  policy_id UUID,
  min_length INTEGER,
  require_uppercase BOOLEAN,
  require_lowercase BOOLEAN,
  require_numbers BOOLEAN,
  require_special_chars BOOLEAN,
  max_age_days INTEGER,
  prevent_reuse_count INTEGER,
  complexity_score_min INTEGER,
  max_failed_attempts INTEGER,
  lockout_duration_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.id,
    pp.min_length,
    pp.require_uppercase,
    pp.require_lowercase,
    pp.require_numbers,
    pp.require_special_chars,
    pp.max_age_days,
    pp.prevent_reuse_count,
    pp.complexity_score_min,
    pp.max_failed_attempts,
    pp.lockout_duration_minutes
  FROM password_policies pp
  LEFT JOIN password_policy_assignments ppa ON pp.id = ppa.policy_id
  WHERE pp.is_active = true
    AND pp.organization_id = (
      SELECT organization_id FROM users WHERE id = user_uuid
    )
    AND (
      ppa.user_id = user_uuid OR 
      pp.is_default = true
    )
    AND (ppa.expires_at IS NULL OR ppa.expires_at > NOW())
    AND (ppa.is_active = true OR ppa.is_active IS NULL)
  ORDER BY 
    CASE WHEN ppa.user_id = user_uuid THEN 1 ELSE 2 END,
    CASE WHEN pp.is_default = true THEN 2 ELSE 1 END
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate password against policy
CREATE OR REPLACE FUNCTION validate_password_against_policy(
  user_uuid UUID,
  password_text TEXT,
  email_text TEXT DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  violations TEXT[],
  strength_score INTEGER,
  strength_level TEXT
) AS $$
DECLARE
  policy_record RECORD;
  violations TEXT[] := ARRAY[]::TEXT[];
  strength_score INTEGER := 0;
  strength_level TEXT := 'weak';
BEGIN
  -- Get user's password policy
  SELECT * INTO policy_record FROM get_user_password_policy(user_uuid);
  
  IF policy_record IS NULL THEN
    RETURN QUERY SELECT true, ARRAY[]::TEXT[], 5, 'medium';
    RETURN;
  END IF;
  
  -- Check minimum length
  IF LENGTH(password_text) < policy_record.min_length THEN
    violations := violations || 'length_insufficient';
  ELSE
    strength_score := strength_score + 1;
  END IF;
  
  -- Check uppercase requirement
  IF policy_record.require_uppercase AND NOT password_text ~ '[A-Z]' THEN
    violations := violations || 'missing_uppercase';
  ELSE
    strength_score := strength_score + 1;
  END IF;
  
  -- Check lowercase requirement
  IF policy_record.require_lowercase AND NOT password_text ~ '[a-z]' THEN
    violations := violations || 'missing_lowercase';
  ELSE
    strength_score := strength_score + 1;
  END IF;
  
  -- Check numbers requirement
  IF policy_record.require_numbers AND NOT password_text ~ '[0-9]' THEN
    violations := violations || 'missing_numbers';
  ELSE
    strength_score := strength_score + 1;
  END IF;
  
  -- Check special characters requirement
  IF policy_record.require_special_chars AND NOT password_text ~ '[!@#$%^&*()_+\-=\[\]{};'':"\\|,.<>\/?]' THEN
    violations := violations || 'missing_special_chars';
  ELSE
    strength_score := strength_score + 1;
  END IF;
  
  -- Check against common passwords
  IF password_text ILIKE ANY(ARRAY[
    'password', 'Password123', '123456', 'qwerty', 'abc123',
    'password123', '12345678', '111111', '123123', 'admin',
    'letmein', 'welcome', 'monkey', '1234567890', 'Password1'
  ]) THEN
    violations := violations || 'common_password';
    strength_score := strength_score - 2;
  END IF;
  
  -- Check email similarity
  IF email_text IS NOT NULL AND password_text ILIKE '%' || SPLIT_PART(email_text, '@', 1) || '%' THEN
    violations := violations || 'email_similarity';
    strength_score := strength_score - 1;
  END IF;
  
  -- Determine strength level
  IF strength_score >= 5 THEN
    strength_level := 'very_strong';
  ELSIF strength_score >= 4 THEN
    strength_level := 'strong';
  ELSIF strength_score >= 3 THEN
    strength_level := 'medium';
  ELSE
    strength_level := 'weak';
  END IF;
  
  -- Check if password meets minimum complexity
  IF strength_score < policy_record.complexity_score_min THEN
    violations := violations || 'complexity_insufficient';
  END IF;
  
  RETURN QUERY SELECT 
    ARRAY_LENGTH(violations, 1) IS NULL OR ARRAY_LENGTH(violations, 1) = 0,
    violations,
    strength_score,
    strength_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check password reuse
CREATE OR REPLACE FUNCTION check_password_reuse(
  user_uuid UUID,
  password_hash TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  policy_record RECORD;
  reuse_count INTEGER;
BEGIN
  -- Get user's password policy
  SELECT * INTO policy_record FROM get_user_password_policy(user_uuid);
  
  IF policy_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if password hash exists in recent history
  SELECT COUNT(*) INTO reuse_count
  FROM password_history
  WHERE user_id = user_uuid
    AND password_hash = check_password_reuse.password_hash
    AND created_at > NOW() - INTERVAL '1 day' * policy_record.prevent_reuse_count;
  
  RETURN reuse_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record password policy violation
CREATE OR REPLACE FUNCTION record_password_violation(
  user_uuid UUID,
  violation_type_param TEXT,
  violation_details_param JSONB DEFAULT NULL,
  password_hash_param TEXT DEFAULT NULL,
  ip_address_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  policy_record RECORD;
  violation_id UUID;
BEGIN
  -- Get user's password policy
  SELECT * INTO policy_record FROM get_user_password_policy(user_uuid);
  
  IF policy_record IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Insert violation record
  INSERT INTO password_policy_violations (
    user_id,
    policy_id,
    violation_type,
    violation_details,
    attempted_password_hash,
    ip_address,
    user_agent
  ) VALUES (
    user_uuid,
    policy_record.policy_id,
    violation_type_param,
    violation_details_param,
    password_hash_param,
    ip_address_param,
    user_agent_param
  ) RETURNING id INTO violation_id;
  
  -- Log the violation
  INSERT INTO password_policy_audit_log (
    policy_id,
    user_id,
    action_type,
    action_details,
    ip_address,
    user_agent
  ) VALUES (
    policy_record.policy_id,
    user_uuid,
    'violation_recorded',
    jsonb_build_object(
      'violation_type', violation_type_param,
      'violation_id', violation_id
    ),
    ip_address_param,
    user_agent_param
  );
  
  RETURN violation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp for password policies
CREATE OR REPLACE FUNCTION update_password_policy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_password_policies_updated_at
  BEFORE UPDATE ON password_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_password_policy_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE password_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_policy_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_policy_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_policy_audit_log ENABLE ROW LEVEL SECURITY;

-- Password Policies - Users can view policies for their organization
CREATE POLICY "Users can view password policies for their organization" ON password_policies
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Password Policy Assignments - Users can view their own assignments
CREATE POLICY "Users can view their password policy assignments" ON password_policy_assignments
  FOR SELECT USING (user_id = auth.uid());

-- Password Policy Violations - Users can view their own violations
CREATE POLICY "Users can view their own password policy violations" ON password_policy_violations
  FOR SELECT USING (user_id = auth.uid());

-- Password Policy Audit Log - Users can view audit logs for their organization
CREATE POLICY "Users can view password policy audit logs for their organization" ON password_policy_audit_log
  FOR SELECT USING (
    policy_id IN (
      SELECT id FROM password_policies 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default password policies for existing organizations
INSERT INTO password_policies (
  organization_id,
  policy_name,
  description,
  min_length,
  require_uppercase,
  require_lowercase,
  require_numbers,
  require_special_chars,
  max_age_days,
  prevent_reuse_count,
  complexity_score_min,
  max_failed_attempts,
  lockout_duration_minutes,
  is_default,
  created_by
)
SELECT 
  id,
  'Default Password Policy',
  'Default password policy for organization',
  8,
  true,
  true,
  true,
  true,
  90,
  5,
  6,
  5,
  15,
  true,
  NULL
FROM organizations
ON CONFLICT (organization_id, policy_name) DO NOTHING;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE password_policies IS 'Organization-level password policies and enforcement rules';
COMMENT ON TABLE password_policy_assignments IS 'Assigns password policies to specific users or roles';
COMMENT ON TABLE password_policy_violations IS 'Records password policy violations for audit and security';
COMMENT ON TABLE password_policy_audit_log IS 'Audit trail for password policy changes and enforcement';

COMMENT ON FUNCTION get_user_password_policy(UUID) IS 'Returns the active password policy for a specific user';
COMMENT ON FUNCTION validate_password_against_policy(UUID, TEXT, TEXT) IS 'Validates a password against the user''s password policy';
COMMENT ON FUNCTION check_password_reuse(UUID, TEXT) IS 'Checks if a password hash has been used recently';
COMMENT ON FUNCTION record_password_violation(UUID, TEXT, JSONB, TEXT, INET, TEXT) IS 'Records a password policy violation for audit purposes';

-- =====================================================
-- POST-MIGRATION NOTES
-- =====================================================
-- After the roles table is created (from RBAC migration), run:
-- ALTER TABLE password_policy_assignments 
-- ADD CONSTRAINT fk_password_policy_assignments_role_id 
-- FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
