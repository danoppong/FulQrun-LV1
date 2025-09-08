-- Add missing columns to activities table
-- Run this in your Supabase SQL Editor

-- Add new columns to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled'));
ALTER TABLE activities ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));

-- Add comments to document the new fields
COMMENT ON COLUMN activities.due_date IS 'When the activity should be completed';
COMMENT ON COLUMN activities.status IS 'Current status of the activity';
COMMENT ON COLUMN activities.priority IS 'Priority level of the activity';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_priority ON activities(priority);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON activities(due_date);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
