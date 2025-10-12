-- Add region and country columns to users table
-- Migration: Add region and country support to users table

-- Add region column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS region TEXT;

-- Add country column to users table  
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;

-- Add index for better performance when filtering by region
CREATE INDEX IF NOT EXISTS idx_users_region ON users(region) WHERE region IS NOT NULL;

-- Add index for better performance when filtering by country
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country) WHERE country IS NOT NULL;

-- Update any existing user profiles data to users table (optional migration)
-- This safely migrates data from user_profiles if it exists
UPDATE users 
SET 
  region = COALESCE(users.region, up.region),
  country = COALESCE(users.country, up.country)
FROM user_profiles up 
WHERE users.id = up.user_id 
  AND (up.region IS NOT NULL OR up.country IS NOT NULL)
  AND (users.region IS NULL OR users.country IS NULL);

-- Add comment to document the change
COMMENT ON COLUMN users.region IS 'User region for organization management';
COMMENT ON COLUMN users.country IS 'User country for organization management';