-- Fix missing columns in existing tables
-- This migration adds missing columns that might not exist in the current database

-- Add assigned_to column to leads table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'assigned_to'
    ) THEN
        ALTER TABLE leads ADD COLUMN assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add missing indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Ensure user_dashboard_layouts table has all required columns
DO $$ 
BEGIN
    -- Add widgets column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_dashboard_layouts' AND column_name = 'widgets'
    ) THEN
        ALTER TABLE user_dashboard_layouts ADD COLUMN widgets JSONB NOT NULL DEFAULT '[]';
    END IF;
    
    -- Add layout_config column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_dashboard_layouts' AND column_name = 'layout_config'
    ) THEN
        ALTER TABLE user_dashboard_layouts ADD COLUMN layout_config JSONB DEFAULT '{}';
    END IF;
    
    -- Add is_default column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_dashboard_layouts' AND column_name = 'is_default'
    ) THEN
        ALTER TABLE user_dashboard_layouts ADD COLUMN is_default BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Ensure RLS is enabled and policy exists for user_dashboard_layouts
DO $$ 
BEGIN
    -- Enable RLS if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'user_dashboard_layouts' AND relrowsecurity = true
    ) THEN
        ALTER TABLE user_dashboard_layouts ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Create policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_dashboard_layouts' 
        AND policyname = 'Authenticated users can access user dashboard layouts'
    ) THEN
        CREATE POLICY "Authenticated users can access user dashboard layouts" ON user_dashboard_layouts
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- Completion message
DO $$ 
BEGIN
    RAISE NOTICE 'Missing columns migration completed successfully!';
END $$;
