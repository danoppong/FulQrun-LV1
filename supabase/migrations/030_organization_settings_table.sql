-- Migration 030: Organization Settings Table
-- Create table to store organization-specific settings as JSON

-- =============================================================================
-- CREATE ORGANIZATION_SETTINGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one settings record per organization
  CONSTRAINT organization_settings_org_unique UNIQUE (organization_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_organization_settings_org_id ON organization_settings(organization_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own organization's settings
CREATE POLICY "Users can view their organization settings"
  ON organization_settings
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Policy: Admins can update their organization's settings
CREATE POLICY "Admins can update their organization settings"
  ON organization_settings
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can insert their organization's settings
CREATE POLICY "Admins can insert their organization settings"
  ON organization_settings
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_organization_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER organization_settings_updated_at
  BEFORE UPDATE ON organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_settings_updated_at();

-- =============================================================================
-- SEED DEFAULT SETTINGS FOR EXISTING ORGANIZATIONS
-- =============================================================================

INSERT INTO organization_settings (organization_id, settings)
SELECT 
  id as organization_id,
  jsonb_build_object(
    'basic', jsonb_build_object(
      'domain', '',
      'timezone', 'UTC',
      'currency', 'USD',
      'dateFormat', 'MM/DD/YYYY',
      'timeFormat', '12',
      'fiscalYearStart', '01-01',
      'language', 'en',
      'region', 'US'
    ),
    'licensing', jsonb_build_object(
      'tier', 'standard',
      'maxUsers', 50,
      'maxStorage', 100,
      'modules', '[]'::jsonb,
      'expiresAt', (NOW() + INTERVAL '1 year')::text,
      'isTrialActive', false,
      'trialEndsAt', (NOW() + INTERVAL '30 days')::text
    ),
    'features', jsonb_build_object(
      'enabledModules', '[]'::jsonb,
      'betaFeatures', '[]'::jsonb,
      'experimentalFeatures', '[]'::jsonb,
      'disabledFeatures', '[]'::jsonb
    ),
    'compliance', jsonb_build_object(
      'complianceLevel', 'standard',
      'dataResidency', 'US',
      'retentionPolicyDays', 365,
      'enableAuditLogging', true,
      'enableDataEncryption', false,
      'gdprCompliant', false,
      'hipaaCompliant', false
    ),
    'branding', jsonb_build_object(
      'logoUrl', '',
      'faviconUrl', '',
      'primaryColor', '#3B82F6',
      'secondaryColor', '#10B981',
      'customCSS', '',
      'emailHeaderLogo', '',
      'emailFooterText', ''
    )
  ) as settings
FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM organization_settings 
  WHERE organization_settings.organization_id = organizations.id
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE organization_settings IS 'Stores organization-specific configuration settings as JSON';
COMMENT ON COLUMN organization_settings.settings IS 'JSONB column containing all organization settings including basic, licensing, features, compliance, and branding';

