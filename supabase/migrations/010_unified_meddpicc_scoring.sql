-- Unified MEDDPICC Scoring Migration
-- This migration updates the database function to use the new comprehensive scoring algorithm

-- Drop the old simple scoring function
DROP FUNCTION IF EXISTS calculate_meddpicc_score(UUID);

-- Create a new comprehensive MEDDPICC scoring function
-- This function uses the same algorithm as the frontend for consistency
CREATE OR REPLACE FUNCTION calculate_meddpicc_score(opp_id UUID)
RETURNS INTEGER AS $$
DECLARE
    opp_record RECORD;
    pillar_scores JSONB := '{}';
    total_weighted_score DECIMAL := 0;
    total_weight DECIMAL := 0;
    pillar_score DECIMAL;
    pillar_weight DECIMAL;
    overall_score INTEGER := 0;
    
    -- Pillar weights matching the frontend configuration
    pillar_weights JSONB := '{
        "metrics": 15,
        "economicBuyer": 20,
        "decisionCriteria": 10,
        "decisionProcess": 15,
        "paperProcess": 5,
        "identifyPain": 20,
        "implicatePain": 20,
        "champion": 10,
        "competition": 5
    }';
    
    -- Quality keywords for scoring
    quality_keywords TEXT[] := ARRAY[
        'specific', 'measurable', 'quantified', 'roi', 'impact', 'cost', 
        'savings', 'efficiency', 'revenue', 'profit', 'test', 'quality', 
        'improvement', 'lives', 'saved'
    ];
    
    pillar_id TEXT;
    pillar_text TEXT;
    answer_length INTEGER;
    points DECIMAL;
    keyword_count INTEGER;
    keyword TEXT;
BEGIN
    -- Get opportunity data
    SELECT 
        metrics, economic_buyer, decision_criteria, decision_process,
        paper_process, identify_pain, champion, competition
    INTO opp_record
    FROM opportunities 
    WHERE id = opp_id;
    
    -- Calculate score for each pillar
    FOR pillar_id, pillar_weight IN SELECT * FROM jsonb_each(pillar_weights) LOOP
        -- Map database field names to pillar IDs
        CASE pillar_id
            WHEN 'metrics' THEN pillar_text := opp_record.metrics;
            WHEN 'economicBuyer' THEN pillar_text := opp_record.economic_buyer;
            WHEN 'decisionCriteria' THEN pillar_text := opp_record.decision_criteria;
            WHEN 'decisionProcess' THEN pillar_text := opp_record.decision_process;
            WHEN 'paperProcess' THEN pillar_text := opp_record.paper_process;
            WHEN 'identifyPain' THEN pillar_text := opp_record.identify_pain;
            WHEN 'champion' THEN pillar_text := opp_record.champion;
            WHEN 'competition' THEN pillar_text := opp_record.competition;
            ELSE pillar_text := NULL;
        END CASE;
        
        -- Calculate pillar score
        IF pillar_text IS NOT NULL AND TRIM(pillar_text) != '' THEN
            answer_length := LENGTH(TRIM(pillar_text));
            points := 0;
            
            -- Base points for any content
            IF answer_length > 0 THEN
                points := points + 3;
            END IF;
            
            -- Length-based points
            IF answer_length >= 3 THEN
                points := points + 2;
            END IF;
            IF answer_length >= 10 THEN
                points := points + 2;
            END IF;
            IF answer_length >= 25 THEN
                points := points + 2;
            END IF;
            IF answer_length >= 50 THEN
                points := points + 1;
            END IF;
            
            -- Bonus points for quality keywords
            keyword_count := 0;
            FOREACH keyword IN ARRAY quality_keywords LOOP
                IF LOWER(pillar_text) LIKE '%' || keyword || '%' THEN
                    keyword_count := keyword_count + 1;
                END IF;
            END LOOP;
            points := points + LEAST(keyword_count, 2);
            
            -- Cap at 10 points per pillar
            points := LEAST(points, 10);
        ELSE
            points := 0;
        END IF;
        
        -- Store pillar score (as percentage)
        pillar_scores := pillar_scores || jsonb_build_object(pillar_id, ROUND((points / 10.0) * 100));
        
        -- Add to weighted total
        total_weighted_score := total_weighted_score + ((points / 10.0) * pillar_weight);
        total_weight := total_weight + pillar_weight;
    END LOOP;
    
    -- Calculate overall score
    IF total_weight > 0 THEN
        overall_score := ROUND((total_weighted_score / total_weight) * 100);
    END IF;
    
    RETURN overall_score;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger function to use the new scoring
CREATE OR REPLACE FUNCTION update_meddpicc_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.meddpicc_score := calculate_meddpicc_score(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS trigger_update_meddpicc_score ON opportunities;
CREATE TRIGGER trigger_update_meddpicc_score
    BEFORE INSERT OR UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_meddpicc_score();

-- Update existing opportunities with the new scoring algorithm
UPDATE opportunities 
SET meddpicc_score = calculate_meddpicc_score(id)
WHERE id IS NOT NULL;

-- Add a comment to document the new function
COMMENT ON FUNCTION calculate_meddpicc_score(UUID) IS 'Calculates MEDDPICC score using comprehensive algorithm matching frontend implementation';
