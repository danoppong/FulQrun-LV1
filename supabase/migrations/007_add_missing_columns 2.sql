-- Add missing columns to existing tables
-- This migration adds columns that might be missing from the existing database

-- Add assigned_to column to leads table if it doesn't exist
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add score column to leads table if it doesn't exist
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;

-- Add notes column to leads table if it doesn't exist
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add assigned_to column to opportunities table if it doesn't exist
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add assigned_to column to activities table if it doesn't exist
ALTER TABLE activities ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add created_by column to activities table if it doesn't exist
ALTER TABLE activities ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE CASCADE;

-- Add related_type and related_id columns to activities table if they don't exist
ALTER TABLE activities ADD COLUMN IF NOT EXISTS related_type TEXT CHECK (related_type IN ('lead', 'opportunity', 'contact', 'company'));
ALTER TABLE activities ADD COLUMN IF NOT EXISTS related_id UUID;

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_assigned_to ON opportunities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_activities_assigned_to ON activities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_related ON activities(related_type, related_id);
