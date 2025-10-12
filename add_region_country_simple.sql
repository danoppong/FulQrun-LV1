-- Simple migration: Add region and country columns to users table
-- This is the minimal version that just adds the columns

-- Add region and country columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;

-- Add index for better performance when filtering by region/country
CREATE INDEX IF NOT EXISTS idx_users_region ON users(region) WHERE region IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country) WHERE country IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN users.region IS 'User region for organizational reporting';
COMMENT ON COLUMN users.country IS 'User country for organizational reporting';

-- Success message
SELECT 'Region and country columns added successfully to users table' AS result;