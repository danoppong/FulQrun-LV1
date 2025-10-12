-- Migration: Add region and country columns to users table
-- This allows us to store region and country data alongside department in the users table
-- which already has proper RLS policies for admin updates

-- Add region and country columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;

-- Add index for better performance when filtering by region/country
CREATE INDEX IF NOT EXISTS idx_users_region ON users(region) WHERE region IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country) WHERE country IS NOT NULL;

-- Update any existing user profiles data to users table (optional migration)
-- This is safe to run multiple times and handles the case where user_profiles table may not exist or have different schema
DO $$
BEGIN
  -- Check if user_profiles table exists and has the expected columns
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'user_id'
  ) THEN
    -- Try to migrate data if table and columns exist
    UPDATE users 
    SET 
      region = COALESCE(users.region, up.region),
      country = COALESCE(users.country, up.country)
    FROM user_profiles up 
    WHERE users.id = up.user_id 
      AND (up.region IS NOT NULL OR up.country IS NOT NULL)
      AND (users.region IS NULL OR users.country IS NULL);
    
    RAISE NOTICE 'Data migration from user_profiles completed';
  ELSE
    RAISE NOTICE 'user_profiles table not found or missing user_id column - skipping data migration';
  END IF;
END $$;

-- Comments for documentation
COMMENT ON COLUMN users.region IS 'User region for organizational reporting';
COMMENT ON COLUMN users.country IS 'User country for organizational reporting';