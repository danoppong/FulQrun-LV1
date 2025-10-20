-- Create MEDDPICC configuration management tables
-- This migration supports dynamic MEDDPICC configuration with full CRUD capability

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS meddpicc_configuration_history CASCADE;
DROP TABLE IF EXISTS meddpicc_configurations CASCADE;

-- Main MEDDPICC configurations table
CREATE TABLE meddpicc_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Configuration metadata
    name VARCHAR(255) NOT NULL DEFAULT 'Default MEDDPICC Configuration',
    description TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Full configuration data stored as JSONB for flexibility
    configuration_data JSONB NOT NULL,
    
    -- Algorithm settings
    algorithm_settings JSONB DEFAULT '{
        "text_scoring": {
            "base_points": 3,
            "min_length_points": 2,
            "good_detail_points": 2,
            "comprehensive_points": 2,
            "very_detailed_points": 1,
            "min_length": 3,
            "good_detail_length": 10,
            "comprehensive_length": 25,
            "very_detailed_length": 50,
            "max_keyword_bonus": 2
        },
        "quality_keywords": [
            "specific", "measurable", "quantified", "roi", "impact", 
            "cost", "savings", "efficiency", "revenue", "profit", 
            "test", "quality", "improvement", "lives", "saved",
            "clinical", "patient", "outcomes", "compliance", "regulatory"
        ]
    }'::JSONB,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES users(id),
    modified_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT unique_active_config_per_org UNIQUE (organization_id, is_active)
);

-- Configuration change history table
CREATE TABLE meddpicc_configuration_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    configuration_id UUID NOT NULL REFERENCES meddpicc_configurations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Change details
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'DEACTIVATE')),
    previous_version INTEGER,
    new_version INTEGER,
    changes_summary JSONB, -- Summary of what changed
    
    -- Full snapshots for point-in-time recovery
    previous_configuration JSONB,
    new_configuration JSONB,
    
    -- Audit fields
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    changed_by UUID REFERENCES users(id),
    change_reason TEXT,
    
    -- Performance indexes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_meddpicc_configurations_org_active ON meddpicc_configurations(organization_id, is_active);
CREATE INDEX idx_meddpicc_configurations_version ON meddpicc_configurations(organization_id, version DESC);
CREATE INDEX idx_meddpicc_configuration_history_config ON meddpicc_configuration_history(configuration_id, changed_at DESC);
CREATE INDEX idx_meddpicc_configuration_history_org ON meddpicc_configuration_history(organization_id, changed_at DESC);

-- Add triggers for automatic timestamping
CREATE OR REPLACE FUNCTION update_meddpicc_configuration_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meddpicc_configurations_timestamp
    BEFORE UPDATE ON meddpicc_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_meddpicc_configuration_timestamp();

-- Add trigger for configuration history tracking
CREATE OR REPLACE FUNCTION track_meddpicc_configuration_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert history record
    INSERT INTO meddpicc_configuration_history (
        configuration_id,
        organization_id,
        change_type,
        previous_version,
        new_version,
        previous_configuration,
        new_configuration,
        changed_by,
        changes_summary
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.organization_id, OLD.organization_id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'CREATE'
            WHEN TG_OP = 'UPDATE' THEN 'UPDATE'
            WHEN TG_OP = 'DELETE' THEN 'DELETE'
        END,
        CASE WHEN TG_OP != 'INSERT' THEN OLD.version END,
        CASE WHEN TG_OP != 'DELETE' THEN NEW.version END,
        CASE WHEN TG_OP != 'INSERT' THEN OLD.configuration_data END,
        CASE WHEN TG_OP != 'DELETE' THEN NEW.configuration_data END,
        CASE WHEN TG_OP != 'DELETE' THEN NEW.modified_by ELSE OLD.modified_by END,
        CASE 
            WHEN TG_OP = 'INSERT' THEN '{"action": "created"}'::JSONB
            WHEN TG_OP = 'DELETE' THEN '{"action": "deleted"}'::JSONB
            WHEN TG_OP = 'UPDATE' THEN 
                JSONB_BUILD_OBJECT(
                    'action', 'updated',
                    'version_changed', OLD.version != NEW.version,
                    'config_changed', OLD.configuration_data != NEW.configuration_data,
                    'status_changed', OLD.is_active != NEW.is_active
                )
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_meddpicc_configuration_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON meddpicc_configurations
    FOR EACH ROW
    EXECUTE FUNCTION track_meddpicc_configuration_changes();

-- Add Row Level Security (RLS)
ALTER TABLE meddpicc_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meddpicc_configuration_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meddpicc_configurations
CREATE POLICY "Users can view their organization's MEDDPICC configurations"
    ON meddpicc_configurations FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Admins can manage their organization's MEDDPICC configurations"
    ON meddpicc_configurations FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin') LIMIT 1
    ));

-- RLS Policies for meddpicc_configuration_history
CREATE POLICY "Users can view their organization's MEDDPICC configuration history"
    ON meddpicc_configuration_history FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

CREATE POLICY "Admins can view all history for their organization"
    ON meddpicc_configuration_history FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin') LIMIT 1
    ));

-- Create function to get active MEDDPICC configuration for an organization
CREATE OR REPLACE FUNCTION get_active_meddpicc_config(org_id UUID)
RETURNS JSONB AS $$
DECLARE
    config_data JSONB;
BEGIN
    SELECT configuration_data INTO config_data
    FROM meddpicc_configurations
    WHERE organization_id = org_id 
    AND is_active = true
    ORDER BY version DESC
    LIMIT 1;
    
    -- Return default configuration if none found
    IF config_data IS NULL THEN
        RETURN '{
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
                },
                "thresholds": {
                    "excellent": 80,
                    "good": 60,
                    "fair": 40,
                    "poor": 20
                }
            },
            "isDefault": true
        }'::JSONB;
    END IF;
    
    RETURN config_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate MEDDPICC configuration
CREATE OR REPLACE FUNCTION validate_meddpicc_configuration(config JSONB)
RETURNS JSONB AS $$
DECLARE
    validation_result JSONB;
    total_weight NUMERIC := 0;
    pillar JSONB;
    errors TEXT[] := ARRAY[]::TEXT[];
    warnings TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check required top-level fields
    IF config->>'projectName' IS NULL OR config->>'projectName' = '' THEN
        errors := array_append(errors, 'Project name is required');
    END IF;
    
    IF config->>'version' IS NULL OR config->>'version' = '' THEN
        errors := array_append(errors, 'Version is required');
    END IF;
    
    IF config->>'framework' IS NULL OR config->>'framework' = '' THEN
        errors := array_append(errors, 'Framework is required');
    END IF;
    
    -- Check pillars exist
    IF config->'pillars' IS NULL OR JSONB_ARRAY_LENGTH(config->'pillars') = 0 THEN
        errors := array_append(errors, 'At least one pillar is required');
    ELSE
        -- Validate each pillar
        FOR pillar IN SELECT * FROM JSONB_ARRAY_ELEMENTS(config->'pillars')
        LOOP
            IF pillar->>'id' IS NULL OR pillar->>'id' = '' THEN
                errors := array_append(errors, 'Pillar ID is required');
            END IF;
            
            IF pillar->>'displayName' IS NULL OR pillar->>'displayName' = '' THEN
                errors := array_append(errors, 'Pillar display name is required');
            END IF;
            
            IF (pillar->>'weight')::NUMERIC < 0 OR (pillar->>'weight')::NUMERIC > 100 THEN
                errors := array_append(errors, 'Pillar weight must be between 0 and 100');
            END IF;
            
            total_weight := total_weight + (pillar->>'weight')::NUMERIC;
        END LOOP;
    END IF;
    
    -- Check total weights
    IF ABS(total_weight - 100) > 0.1 THEN
        warnings := array_append(warnings, FORMAT('Total weights sum to %s%% instead of 100%%', total_weight));
    END IF;
    
    -- Build validation result
    validation_result := JSONB_BUILD_OBJECT(
        'isValid', ARRAY_LENGTH(errors, 1) IS NULL OR ARRAY_LENGTH(errors, 1) = 0,
        'errors', TO_JSONB(errors),
        'warnings', TO_JSONB(warnings),
        'totalWeight', total_weight
    );
    
    RETURN validation_result;
END;
$$ LANGUAGE plpgsql;

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON meddpicc_configurations TO authenticated;
GRANT SELECT, INSERT ON meddpicc_configuration_history TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add helpful comments
COMMENT ON TABLE meddpicc_configurations IS 'Stores customizable MEDDPICC configurations for organizations';
COMMENT ON TABLE meddpicc_configuration_history IS 'Tracks all changes to MEDDPICC configurations for audit and rollback';
COMMENT ON FUNCTION get_active_meddpicc_config(UUID) IS 'Returns the active MEDDPICC configuration for an organization or default if none exists';
COMMENT ON FUNCTION validate_meddpicc_configuration(JSONB) IS 'Validates a MEDDPICC configuration structure and returns validation results';

-- Create sample data for the first organization (if exists)
DO $$
DECLARE
    first_org_id UUID;
    admin_user_id UUID;
    config_exists BOOLEAN;
BEGIN
    -- Get first organization and admin user
    SELECT id INTO first_org_id FROM organizations ORDER BY created_at LIMIT 1;
    SELECT id INTO admin_user_id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1;
    
    IF first_org_id IS NOT NULL THEN
        -- Check if configuration already exists
        SELECT EXISTS(
            SELECT 1 FROM meddpicc_configurations 
            WHERE organization_id = first_org_id AND is_active = true
        ) INTO config_exists;
        
        -- Only insert if no active configuration exists
        IF NOT config_exists THEN
            INSERT INTO meddpicc_configurations (
                organization_id,
                name,
                description,
                configuration_data,
                created_by,
                modified_by
            ) VALUES (
                first_org_id,
                'Default Pharmaceutical MEDDPICC Configuration',
                'Standard MEDDPICC configuration optimized for pharmaceutical sales',
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
                        },
                        "thresholds": {
                            "excellent": 80,
                            "good": 60,
                            "fair": 40,
                            "poor": 20
                        }
                    },
                    "pillars": [
                        {
                            "id": "metrics",
                            "displayName": "Metrics",
                            "description": "Quantify the business impact and ROI",
                            "weight": 40,
                            "icon": "📊",
                            "color": "bg-blue-100 text-blue-800",
                            "questions": [
                                {
                                    "id": "current_cost",
                                    "text": "What is the current cost of the problem?",
                                    "tooltip": "Quantify the financial impact of the current situation",
                                    "type": "text",
                                    "required": true
                                },
                                {
                                    "id": "expected_roi",
                                    "text": "What is the expected ROI from solving this problem?",
                                    "tooltip": "Calculate the return on investment",
                                    "type": "text",
                                    "required": true
                                }
                            ]
                        }
                    ],
                    "litmusTest": {
                        "displayName": "Final Qualification Gate",
                        "questions": [
                            {
                                "id": "budget_confirmed",
                                "text": "Is the budget confirmed and approved?",
                                "type": "yes_no",
                                "required": true,
                                "answers": [
                                    {"text": "Yes", "points": 10},
                                    {"text": "No", "points": 0}
                                ]
                            }
                        ]
                    },
                    "integrations": {
                        "peakPipeline": {
                            "stageGates": [
                                {
                                    "from": "Discovery",
                                    "to": "Advancing",
                                    "criteria": ["Economic buyer engaged", "Decision criteria established"]
                                }
                            ]
                        },
                        "crmOpportunity": {
                            "componentTarget": "Opportunity.PageLayout.MainColumn",
                            "headerFields": ["MEDDPICC Score", "Qualification Status"]
                        }
                    },
                    "admin": {
                        "configurableElements": ["questions.text", "questions.tooltip", "answers.text", "answers.points", "scoring.weights"]
                    }
                }'::JSONB,
                admin_user_id,
                admin_user_id
            );
        END IF;
    END IF;
END $$;