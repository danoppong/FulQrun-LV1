-- Simple test to create MEDDPICC configuration tables
-- This is a minimal version for testing

-- Create MEDDPICC configurations table
CREATE TABLE IF NOT EXISTS meddpicc_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    
    -- Configuration metadata
    name VARCHAR(255) NOT NULL DEFAULT 'Default MEDDPICC Configuration',
    description TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Full configuration data stored as JSONB for flexibility
    configuration_data JSONB NOT NULL,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID,
    modified_by UUID
);

-- Create configuration history table
CREATE TABLE IF NOT EXISTS meddpicc_configuration_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    configuration_id UUID,
    organization_id UUID NOT NULL,
    
    -- Change details
    change_type VARCHAR(50) NOT NULL,
    previous_version INTEGER,
    new_version INTEGER,
    changes_summary JSONB,
    
    -- Full snapshots for point-in-time recovery
    previous_configuration JSONB,
    new_configuration JSONB,
    
    -- Audit fields
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    changed_by UUID,
    change_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_meddpicc_configurations_org_active ON meddpicc_configurations(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_meddpicc_configurations_version ON meddpicc_configurations(organization_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_meddpicc_configuration_history_config ON meddpicc_configuration_history(configuration_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_meddpicc_configuration_history_org ON meddpicc_configuration_history(organization_id, changed_at DESC);

-- Enable RLS
ALTER TABLE meddpicc_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meddpicc_configuration_history ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY IF NOT EXISTS "meddpicc_config_org_access"
    ON meddpicc_configurations FOR ALL
    USING (true); -- Simplified for testing

CREATE POLICY IF NOT EXISTS "meddpicc_history_org_access"
    ON meddpicc_configuration_history FOR ALL
    USING (true); -- Simplified for testing

-- Grant permissions
GRANT ALL ON meddpicc_configurations TO authenticated;
GRANT ALL ON meddpicc_configuration_history TO authenticated;

-- Test insert
INSERT INTO meddpicc_configurations (
    organization_id,
    name,
    description,
    configuration_data
) VALUES (
    gen_random_uuid(),
    'Test MEDDPICC Configuration',
    'Test configuration for MEDDPICC admin interface',
    '{
        "projectName": "CRM Integration of the MEDDPICC & PEAK Sales Qualification Module",
        "version": "1.0",
        "framework": "MEDD(I)PICC",
        "scoring": {
            "weights": {
                "metrics": 40,
                "economicBuyer": 15,
                "decisionCriteria": 8,
                "decisionProcess": 10,
                "paperProcess": 3,
                "identifyPain": 12,
                "implicatePain": 7,
                "champion": 3,
                "competition": 2
            }
        },
        "pillars": [],
        "thresholds": {
            "lowRisk": 70,
            "mediumRisk": 50,
            "highRisk": 30
        }
    }'::JSONB
) ON CONFLICT DO NOTHING;

SELECT 'MEDDPICC configuration tables created successfully' as result;