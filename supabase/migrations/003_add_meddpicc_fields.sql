-- Add MEDDPICC fields to opportunities table
-- This migration adds the individual MEDDPICC qualification fields

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

-- Update the meddpicc_score calculation to be based on individual fields
-- This function calculates a score based on how many MEDDPICC fields are completed
CREATE OR REPLACE FUNCTION calculate_meddpicc_score(opp_id UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    opp_record RECORD;
BEGIN
    SELECT 
        metrics, economic_buyer, decision_criteria, decision_process,
        paper_process, identify_pain, champion, competition
    INTO opp_record
    FROM opportunities 
    WHERE id = opp_id;
    
    -- Add 12.5 points for each completed field (100/8 = 12.5)
    IF opp_record.metrics IS NOT NULL AND TRIM(opp_record.metrics) != '' THEN
        score := score + 12.5;
    END IF;
    
    IF opp_record.economic_buyer IS NOT NULL AND TRIM(opp_record.economic_buyer) != '' THEN
        score := score + 12.5;
    END IF;
    
    IF opp_record.decision_criteria IS NOT NULL AND TRIM(opp_record.decision_criteria) != '' THEN
        score := score + 12.5;
    END IF;
    
    IF opp_record.decision_process IS NOT NULL AND TRIM(opp_record.decision_process) != '' THEN
        score := score + 12.5;
    END IF;
    
    IF opp_record.paper_process IS NOT NULL AND TRIM(opp_record.paper_process) != '' THEN
        score := score + 12.5;
    END IF;
    
    IF opp_record.identify_pain IS NOT NULL AND TRIM(opp_record.identify_pain) != '' THEN
        score := score + 12.5;
    END IF;
    
    IF opp_record.champion IS NOT NULL AND TRIM(opp_record.champion) != '' THEN
        score := score + 12.5;
    END IF;
    
    IF opp_record.competition IS NOT NULL AND TRIM(opp_record.competition) != '' THEN
        score := score + 12.5;
    END IF;
    
    RETURN ROUND(score);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update meddpicc_score when MEDDPICC fields change
CREATE OR REPLACE FUNCTION update_meddpicc_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.meddpicc_score := calculate_meddpicc_score(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for MEDDPICC score updates
DROP TRIGGER IF EXISTS trigger_update_meddpicc_score ON opportunities;
CREATE TRIGGER trigger_update_meddpicc_score
    BEFORE INSERT OR UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_meddpicc_score();

-- Update existing opportunities with calculated scores
UPDATE opportunities SET meddpicc_score = calculate_meddpicc_score(id);
