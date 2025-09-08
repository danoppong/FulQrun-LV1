-- Add MEDDPICC fields to opportunities table if they don't exist
-- This script adds the individual MEDDPICC qualification fields

-- Add MEDDPICC fields to opportunities table
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS metrics TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS economic_buyer TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS decision_criteria TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS decision_process TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS paper_process TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS identify_pain TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS champion TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS competition TEXT;

-- Add comments to document the MEDDPICC fields
COMMENT ON COLUMN opportunities.metrics IS 'Quantify the business impact and value proposition';
COMMENT ON COLUMN opportunities.economic_buyer IS 'Identify the decision maker with budget authority';
COMMENT ON COLUMN opportunities.decision_criteria IS 'Understand the evaluation process and criteria';
COMMENT ON COLUMN opportunities.decision_process IS 'Map the approval workflow and decision timeline';
COMMENT ON COLUMN opportunities.paper_process IS 'Document requirements and procurement process';
COMMENT ON COLUMN opportunities.identify_pain IS 'Understand pain points and business challenges';
COMMENT ON COLUMN opportunities.champion IS 'Find internal advocate and supporter';
COMMENT ON COLUMN opportunities.competition IS 'Assess competitive landscape and positioning';
