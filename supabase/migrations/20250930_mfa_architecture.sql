-- =====================================================
-- Multi-Factor Authentication (MFA) Database Schema
-- =====================================================
-- This migration adds comprehensive MFA support including:
-- - Multiple authentication factors
-- - Risk assessment and audit logging
-- - Session management
-- - Device fingerprinting
-- - Security policies

-- =====================================================
-- 1. MFA FACTORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_mfa_factors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  factor_type TEXT NOT NULL CHECK (factor_type IN ('totp', 'sms', 'email', 'webauthn', 'biometric', 'backup_codes')),
  factor_name TEXT,
  factor_data JSONB, -- Store factor-specific data (encrypted if sensitive)
  is_primary BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, factor_type, factor_name)
);

-- =====================================================
-- 2. MFA POLICIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS mfa_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  enforcement TEXT NOT NULL DEFAULT 'optional' CHECK (enforcement IN ('disabled', 'optional', 'required')),
  allowed_factors TEXT[] DEFAULT ARRAY['totp', 'webauthn', 'email'],
  min_factors INTEGER DEFAULT 1 CHECK (min_factors >= 0 AND min_factors <= 5),
  require_for_roles TEXT[] DEFAULT ARRAY['admin'],
  grace_period_hours INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- =====================================================
-- 3. USER MFA SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_mfa_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  enforcement TEXT DEFAULT 'optional' CHECK (enforcement IN ('disabled', 'optional', 'required')),
  allowed_factors TEXT[] DEFAULT ARRAY['totp', 'webauthn', 'email', 'sms'],
  min_factors INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. MFA CHALLENGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS mfa_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL DEFAULT 'mfa_verification',
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  required_factors INTEGER DEFAULT 1,
  failed_attempts INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. BACKUP CODES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS backup_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. WEBAUTHN CREDENTIALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  public_key BYTEA NOT NULL,
  counter BIGINT DEFAULT 0,
  transports TEXT[],
  friendly_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- =====================================================
-- 7. USER SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash TEXT UNIQUE NOT NULL,
  refresh_token_hash TEXT UNIQUE NOT NULL,
  device_fingerprint TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ
);

-- =====================================================
-- 8. TRUSTED DEVICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  ip_address INET,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  trusted BOOLEAN DEFAULT FALSE,
  trusted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_fingerprint)
);

-- =====================================================
-- 9. USER LOCATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  country TEXT,
  region TEXT,
  city TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  login_count INTEGER DEFAULT 1,
  UNIQUE(user_id, ip_address)
);

-- =====================================================
-- 10. RISK ASSESSMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_factors JSONB,
  assessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 11. AUTH AUDIT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  risk_score INTEGER,
  success BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 12. FAILED LOGIN ATTEMPTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  failure_reason TEXT
);

-- =====================================================
-- 13. PASSWORD HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- MFA Factors
CREATE INDEX IF NOT EXISTS idx_mfa_factors_user ON user_mfa_factors(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_factors_type ON user_mfa_factors(user_id, factor_type);

-- MFA Challenges
CREATE INDEX IF NOT EXISTS idx_mfa_challenges_user ON mfa_challenges(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_mfa_challenges_expiry ON mfa_challenges(expires_at) WHERE completed = FALSE;

-- Backup Codes
CREATE INDEX IF NOT EXISTS idx_backup_codes_user ON backup_codes(user_id, used);

-- WebAuthn Credentials
CREATE INDEX IF NOT EXISTS idx_webauthn_user ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credential_id ON webauthn_credentials(credential_id);

-- User Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON user_sessions(expires_at) WHERE revoked = FALSE;

-- Trusted Devices
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(user_id, device_fingerprint);

-- User Locations
CREATE INDEX IF NOT EXISTS idx_user_locations_user ON user_locations(user_id, last_seen);

-- Risk Assessments
CREATE INDEX IF NOT EXISTS idx_risk_assessments_user ON risk_assessments(user_id, assessed_at);

-- Auth Audit Log
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON auth_audit_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_event ON auth_audit_log(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_email ON auth_audit_log(email, created_at);

-- Failed Login Attempts
CREATE INDEX IF NOT EXISTS idx_failed_attempts_email ON failed_login_attempts(email, attempted_at);
CREATE INDEX IF NOT EXISTS idx_failed_attempts_ip ON failed_login_attempts(ip_address, attempted_at);

-- Password History
CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id, created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_mfa_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;

-- MFA Factors: Users can view and manage their own factors
CREATE POLICY "Users can view own MFA factors"
  ON user_mfa_factors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own MFA factors"
  ON user_mfa_factors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own MFA factors"
  ON user_mfa_factors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own MFA factors"
  ON user_mfa_factors FOR DELETE
  USING (auth.uid() = user_id);

-- User MFA Settings
CREATE POLICY "Users can view own MFA settings"
  ON user_mfa_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own MFA settings"
  ON user_mfa_settings FOR ALL
  USING (auth.uid() = user_id);

-- Backup Codes
CREATE POLICY "Users can view own backup codes"
  ON backup_codes FOR SELECT
  USING (auth.uid() = user_id);

-- WebAuthn Credentials
CREATE POLICY "Users can manage own WebAuthn credentials"
  ON webauthn_credentials FOR ALL
  USING (auth.uid() = user_id);

-- User Sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can revoke own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Trusted Devices
CREATE POLICY "Users can manage own devices"
  ON trusted_devices FOR ALL
  USING (auth.uid() = user_id);

-- User Locations
CREATE POLICY "Users can view own locations"
  ON user_locations FOR SELECT
  USING (auth.uid() = user_id);

-- Auth Audit Log
CREATE POLICY "Users can view own audit logs"
  ON auth_audit_log FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to increment MFA challenge failed attempts
CREATE OR REPLACE FUNCTION increment_mfa_attempts(challenge_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE mfa_challenges
  SET failed_attempts = failed_attempts + 1
  WHERE id = challenge_id;
END;
$$;

-- Function to clean up expired challenges
CREATE OR REPLACE FUNCTION cleanup_expired_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM mfa_challenges
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_sessions
  SET revoked = TRUE, revoked_at = NOW()
  WHERE expires_at < NOW() AND revoked = FALSE;
END;
$$;

-- Function to log authentication event
CREATE OR REPLACE FUNCTION log_auth_event(
  p_user_id UUID,
  p_email TEXT,
  p_event_type TEXT,
  p_event_data JSONB,
  p_ip_address INET,
  p_user_agent TEXT,
  p_success BOOLEAN
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO auth_audit_log (
    user_id,
    email,
    event_type,
    event_data,
    ip_address,
    user_agent,
    success
  ) VALUES (
    p_user_id,
    p_email,
    p_event_type,
    p_event_data,
    p_ip_address,
    p_user_agent,
    p_success
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- =====================================================
-- SCHEDULED JOBS (Using pg_cron if available)
-- =====================================================

-- Clean up expired challenges daily
-- SELECT cron.schedule('cleanup-expired-challenges', '0 2 * * *', 'SELECT cleanup_expired_challenges()');

-- Clean up expired sessions daily
-- SELECT cron.schedule('cleanup-expired-sessions', '0 3 * * *', 'SELECT cleanup_expired_sessions()');

-- =====================================================
-- DEFAULT POLICIES
-- =====================================================

-- Insert default MFA policy for existing organizations
INSERT INTO mfa_policies (organization_id, enforcement, allowed_factors)
SELECT id, 'optional', ARRAY['totp', 'webauthn', 'email']
FROM organizations
ON CONFLICT (organization_id) DO NOTHING;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mfa_policies_updated_at
  BEFORE UPDATE ON mfa_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_mfa_settings_updated_at
  BEFORE UPDATE ON user_mfa_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE user_mfa_factors IS 'Stores user-enrolled MFA factors (TOTP, WebAuthn, etc.)';
COMMENT ON TABLE mfa_policies IS 'Organization-level MFA policies and enforcement rules';
COMMENT ON TABLE user_mfa_settings IS 'User-specific MFA preferences and settings';
COMMENT ON TABLE mfa_challenges IS 'Active MFA verification challenges';
COMMENT ON TABLE backup_codes IS 'One-time backup codes for account recovery';
COMMENT ON TABLE webauthn_credentials IS 'WebAuthn/FIDO2 credentials for hardware keys';
COMMENT ON TABLE user_sessions IS 'Active user sessions with device fingerprints';
COMMENT ON TABLE trusted_devices IS 'Recognized and trusted user devices';
COMMENT ON TABLE user_locations IS 'Historical user login locations for risk assessment';
COMMENT ON TABLE risk_assessments IS 'Risk scores for authentication attempts';
COMMENT ON TABLE auth_audit_log IS 'Comprehensive audit trail for authentication events';
COMMENT ON TABLE failed_login_attempts IS 'Failed login attempts for brute-force detection';
COMMENT ON TABLE password_history IS 'Password history to prevent reuse';

-- =====================================================
-- GRANTS (Adjust based on your security requirements)
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON user_mfa_factors TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_mfa_settings TO authenticated;
GRANT SELECT ON mfa_policies TO authenticated;
GRANT SELECT, UPDATE ON user_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trusted_devices TO authenticated;
GRANT SELECT ON user_locations TO authenticated;
GRANT SELECT ON auth_audit_log TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables were created
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'user_mfa_factors',
    'mfa_policies',
    'user_mfa_settings',
    'mfa_challenges',
    'backup_codes',
    'webauthn_credentials',
    'user_sessions',
    'trusted_devices',
    'user_locations',
    'risk_assessments',
    'auth_audit_log',
    'failed_login_attempts',
    'password_history'
  );
  
  IF table_count = 13 THEN
    RAISE NOTICE '✓ MFA architecture migration completed successfully. All 13 tables created.';
  ELSE
    RAISE WARNING '⚠ Migration incomplete. Expected 13 tables, found %', table_count;
  END IF;
END $$;

