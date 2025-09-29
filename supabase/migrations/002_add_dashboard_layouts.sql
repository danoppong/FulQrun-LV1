-- Add user_dashboard_layouts table
-- This migration adds the missing user_dashboard_layouts table that was causing 404 errors

-- User dashboard layouts table
CREATE TABLE IF NOT EXISTS user_dashboard_layouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    widgets JSONB NOT NULL DEFAULT '[]',
    layout_config JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_dashboard_layouts_user_id ON user_dashboard_layouts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_layouts_organization_id ON user_dashboard_layouts(organization_id);

-- Enable RLS
ALTER TABLE user_dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_dashboard_layouts' 
        AND policyname = 'Authenticated users can access user dashboard layouts'
    ) THEN
        CREATE POLICY "Authenticated users can access user dashboard layouts" ON user_dashboard_layouts
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- Add updated_at trigger (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_dashboard_layouts_updated_at'
    ) THEN
        CREATE TRIGGER update_user_dashboard_layouts_updated_at 
            BEFORE UPDATE ON user_dashboard_layouts
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add table comment
COMMENT ON TABLE user_dashboard_layouts IS 'User-specific dashboard widget layouts and configurations';

-- Completion message
DO $$ 
BEGIN
    RAISE NOTICE 'User dashboard layouts table migration completed successfully!';
END $$;
