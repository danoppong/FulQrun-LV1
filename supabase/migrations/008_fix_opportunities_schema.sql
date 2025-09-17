-- Fix opportunities table schema inconsistencies
-- This migration ensures all fields are properly defined and consistent

-- First, let's check what fields exist and add missing ones
-- Add missing fields that might be causing data persistence issues

-- Add peak_stage field if it doesn't exist (some schemas use 'stage' instead)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS peak_stage TEXT DEFAULT 'prospecting' 
    CHECK (peak_stage IN ('prospecting', 'engaging', 'advancing', 'key_decision'));

-- Add deal_value field if it doesn't exist (some schemas use 'value' instead)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS deal_value DECIMAL(15,2);

-- Add description field if it doesn't exist
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS description TEXT;

-- Ensure all MEDDPICC fields exist
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS metrics TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS economic_buyer TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS decision_criteria TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS decision_process TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS paper_process TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS identify_pain TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS champion TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS competition TEXT;

-- Add meddpicc_score field if it doesn't exist
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS meddpicc_score INTEGER DEFAULT 0;

-- Add AI-related fields if they don't exist
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS ai_risk_score INTEGER DEFAULT 0;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS ai_next_action TEXT;

-- Add pipeline config field if it doesn't exist
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS pipeline_config_id UUID;

-- Ensure probability field exists with proper constraints
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS probability INTEGER DEFAULT 0 
    CHECK (probability >= 0 AND probability <= 100);

-- Ensure close_date field exists
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS close_date DATE;

-- Add assigned_to field if it doesn't exist
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create a function to sync data between old and new field names
CREATE OR REPLACE FUNCTION sync_opportunity_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- If peak_stage is empty but stage has data, copy it
    IF (NEW.peak_stage IS NULL OR NEW.peak_stage = '') AND NEW.stage IS NOT NULL THEN
        NEW.peak_stage := NEW.stage;
    END IF;
    
    -- If deal_value is empty but value has data, copy it
    IF (NEW.deal_value IS NULL) AND NEW.value IS NOT NULL THEN
        NEW.deal_value := NEW.value;
    END IF;
    
    -- Calculate MEDDPICC score if it's not set
    IF NEW.meddpicc_score IS NULL OR NEW.meddpicc_score = 0 THEN
        NEW.meddpicc_score := calculate_meddpicc_score(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync fields
DROP TRIGGER IF EXISTS sync_opportunity_fields_trigger ON opportunities;
CREATE TRIGGER sync_opportunity_fields_trigger
    BEFORE INSERT OR UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION sync_opportunity_fields();

-- Update existing records to sync data
UPDATE opportunities 
SET peak_stage = stage 
WHERE (peak_stage IS NULL OR peak_stage = '') AND stage IS NOT NULL;

UPDATE opportunities 
SET deal_value = value 
WHERE deal_value IS NULL AND value IS NOT NULL;

-- Update MEDDPICC scores for existing records
UPDATE opportunities 
SET meddpicc_score = calculate_meddpicc_score(id)
WHERE meddpicc_score = 0 OR meddpicc_score IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN opportunities.peak_stage IS 'PEAK methodology stage (prospecting, engaging, advancing, key_decision)';
COMMENT ON COLUMN opportunities.deal_value IS 'Monetary value of the opportunity';
COMMENT ON COLUMN opportunities.deal_value IS 'Monetary value of the opportunity';
COMMENT ON COLUMN opportunities.description IS 'Detailed description of the opportunity';
COMMENT ON COLUMN opportunities.metrics IS 'MEDDPICC: Quantify the business impact and value proposition';
COMMENT ON COLUMN opportunities.economic_buyer IS 'MEDDPICC: Identify the decision maker with budget authority';
COMMENT ON COLUMN opportunities.decision_criteria IS 'MEDDPICC: Understand the evaluation process and criteria';
COMMENT ON COLUMN opportunities.decision_process IS 'MEDDPICC: Map the approval workflow and decision timeline';
COMMENT ON COLUMN opportunities.paper_process IS 'MEDDPICC: Document requirements and procurement process';
COMMENT ON COLUMN opportunities.identify_pain IS 'MEDDPICC: Understand pain points and business challenges';
COMMENT ON COLUMN opportunities.champion IS 'MEDDPICC: Find internal advocate and supporter';
COMMENT ON COLUMN opportunities.competition IS 'MEDDPICC: Assess competitive landscape and positioning';
COMMENT ON COLUMN opportunities.meddpicc_score IS 'Calculated MEDDPICC qualification score (0-100)';
COMMENT ON COLUMN opportunities.ai_risk_score IS 'AI-calculated deal risk score (0-100)';
COMMENT ON COLUMN opportunities.ai_next_action IS 'AI-recommended next best action';
COMMENT ON COLUMN opportunities.pipeline_config_id IS 'Reference to custom pipeline configuration';
COMMENT ON COLUMN opportunities.assigned_to IS 'User assigned to this opportunity';
