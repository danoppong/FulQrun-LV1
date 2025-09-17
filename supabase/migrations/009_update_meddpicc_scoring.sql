-- Update MEDDPICC scoring function to use the new weighted algorithm
-- This migration replaces the simple field counting with the sophisticated scoring algorithm

-- Drop the existing function and trigger
DROP TRIGGER IF EXISTS trigger_update_meddpicc_score ON opportunities;
DROP FUNCTION IF EXISTS calculate_meddpicc_score(UUID);
DROP FUNCTION IF EXISTS update_meddpicc_score();

-- Create the new MEDDPICC scoring function with weighted algorithm
CREATE OR REPLACE FUNCTION calculate_meddpicc_score(opp_id UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    opp_record RECORD;
    pillar_scores JSONB := '{}';
    total_weighted_score DECIMAL := 0;
    total_weight DECIMAL := 0;
    pillar_weight DECIMAL;
    pillar_score DECIMAL;
    pillar_id TEXT;
    pillar_data JSONB;
BEGIN
    -- Get the opportunity data
    SELECT 
        metrics, economic_buyer, decision_criteria, decision_process,
        paper_process, identify_pain, champion, competition
    INTO opp_record
    FROM opportunities 
    WHERE id = opp_id;
    
    -- Define pillar weights (matching the new algorithm)
    -- Metrics: 15%, Economic Buyer: 20%, Decision Criteria: 10%, Decision Process: 15%
    -- Paper Process: 5%, Identify Pain: 20%, Champion: 10%, Competition: 5%
    
    -- Calculate Metrics pillar score
    IF opp_record.metrics IS NOT NULL AND TRIM(opp_record.metrics) != '' THEN
        pillar_score := calculate_pillar_score(opp_record.metrics);
        pillar_scores := pillar_scores || jsonb_build_object('metrics', pillar_score);
        total_weighted_score := total_weighted_score + (pillar_score * 15);
        total_weight := total_weight + 15;
    ELSE
        total_weight := total_weight + 15;
    END IF;
    
    -- Calculate Economic Buyer pillar score
    IF opp_record.economic_buyer IS NOT NULL AND TRIM(opp_record.economic_buyer) != '' THEN
        pillar_score := calculate_pillar_score(opp_record.economic_buyer);
        pillar_scores := pillar_scores || jsonb_build_object('economicBuyer', pillar_score);
        total_weighted_score := total_weighted_score + (pillar_score * 20);
        total_weight := total_weight + 20;
    ELSE
        total_weight := total_weight + 20;
    END IF;
    
    -- Calculate Decision Criteria pillar score
    IF opp_record.decision_criteria IS NOT NULL AND TRIM(opp_record.decision_criteria) != '' THEN
        pillar_score := calculate_pillar_score(opp_record.decision_criteria);
        pillar_scores := pillar_scores || jsonb_build_object('decisionCriteria', pillar_score);
        total_weighted_score := total_weighted_score + (pillar_score * 10);
        total_weight := total_weight + 10;
    ELSE
        total_weight := total_weight + 10;
    END IF;
    
    -- Calculate Decision Process pillar score
    IF opp_record.decision_process IS NOT NULL AND TRIM(opp_record.decision_process) != '' THEN
        pillar_score := calculate_pillar_score(opp_record.decision_process);
        pillar_scores := pillar_scores || jsonb_build_object('decisionProcess', pillar_score);
        total_weighted_score := total_weighted_score + (pillar_score * 15);
        total_weight := total_weight + 15;
    ELSE
        total_weight := total_weight + 15;
    END IF;
    
    -- Calculate Paper Process pillar score
    IF opp_record.paper_process IS NOT NULL AND TRIM(opp_record.paper_process) != '' THEN
        pillar_score := calculate_pillar_score(opp_record.paper_process);
        pillar_scores := pillar_scores || jsonb_build_object('paperProcess', pillar_score);
        total_weighted_score := total_weighted_score + (pillar_score * 5);
        total_weight := total_weight + 5;
    ELSE
        total_weight := total_weight + 5;
    END IF;
    
    -- Calculate Identify Pain pillar score
    IF opp_record.identify_pain IS NOT NULL AND TRIM(opp_record.identify_pain) != '' THEN
        pillar_score := calculate_pillar_score(opp_record.identify_pain);
        pillar_scores := pillar_scores || jsonb_build_object('identifyPain', pillar_score);
        total_weighted_score := total_weighted_score + (pillar_score * 20);
        total_weight := total_weight + 20;
    ELSE
        total_weight := total_weight + 20;
    END IF;
    
    -- Calculate Champion pillar score
    IF opp_record.champion IS NOT NULL AND TRIM(opp_record.champion) != '' THEN
        pillar_score := calculate_pillar_score(opp_record.champion);
        pillar_scores := pillar_scores || jsonb_build_object('champion', pillar_score);
        total_weighted_score := total_weighted_score + (pillar_score * 10);
        total_weight := total_weight + 10;
    ELSE
        total_weight := total_weight + 10;
    END IF;
    
    -- Calculate Competition pillar score
    IF opp_record.competition IS NOT NULL AND TRIM(opp_record.competition) != '' THEN
        pillar_score := calculate_pillar_score(opp_record.competition);
        pillar_scores := pillar_scores || jsonb_build_object('competition', pillar_score);
        total_weighted_score := total_weighted_score + (pillar_score * 5);
        total_weight := total_weight + 5;
    ELSE
        total_weight := total_weight + 5;
    END IF;
    
    -- Calculate final weighted score
    IF total_weight > 0 THEN
        score := ROUND((total_weighted_score / total_weight) * 100);
    END IF;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Helper function to calculate individual pillar scores
CREATE OR REPLACE FUNCTION calculate_pillar_score(pillar_text TEXT)
RETURNS DECIMAL AS $$
DECLARE
    points DECIMAL := 0;
    text_length INTEGER;
    keyword_count INTEGER;
    quality_keywords TEXT[] := ARRAY['specific', 'measurable', 'quantified', 'roi', 'impact', 'cost', 'savings', 'efficiency', 'revenue', 'profit', 'test', 'quality', 'improvement', 'lives', 'saved'];
    keyword TEXT;
BEGIN
    text_length := LENGTH(TRIM(pillar_text));
    
    -- More generous scoring for any non-empty response
    IF text_length > 0 THEN
        points := points + 3;  -- Any content gets base points
    END IF;
    
    IF text_length >= 3 THEN
        points := points + 2;  -- Minimum meaningful content
    END IF;
    
    IF text_length >= 10 THEN
        points := points + 2;  -- Good detail
    END IF;
    
    IF text_length >= 25 THEN
        points := points + 2;  -- Comprehensive
    END IF;
    
    IF text_length >= 50 THEN
        points := points + 1;  -- Very detailed
    END IF;
    
    -- Bonus points for quality keywords
    keyword_count := 0;
    FOREACH keyword IN ARRAY quality_keywords LOOP
        IF LOWER(pillar_text) LIKE '%' || keyword || '%' THEN
            keyword_count := keyword_count + 1;
        END IF;
    END LOOP;
    
    points := points + LEAST(keyword_count, 2);  -- Max 2 bonus points
    
    -- Cap at 10 points per question and convert to percentage
    RETURN LEAST(points, 10) * 10;  -- Convert to 0-100 scale
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to automatically update meddpicc_score
CREATE OR REPLACE FUNCTION update_meddpicc_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.meddpicc_score := calculate_meddpicc_score(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for MEDDPICC score updates
CREATE TRIGGER trigger_update_meddpicc_score
    BEFORE INSERT OR UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_meddpicc_score();

-- Update existing opportunities with new calculated scores
UPDATE opportunities 
SET meddpicc_score = calculate_meddpicc_score(id)
WHERE id IS NOT NULL;
