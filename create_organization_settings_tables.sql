-- Create organization_data table for managing departments, regions, and countries
-- This table provides centralized management of organizational reference data

-- Create organization_data table
CREATE TABLE IF NOT EXISTS public.organization_data (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('department', 'region', 'country')),
    name text NOT NULL,
    code text,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    parent_id uuid REFERENCES public.organization_data(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    
    -- Ensure unique names per type per organization
    UNIQUE (organization_id, type, name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_data_org_type ON public.organization_data (organization_id, type);
CREATE INDEX IF NOT EXISTS idx_organization_data_active ON public.organization_data (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_organization_data_parent ON public.organization_data (parent_id) WHERE parent_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.organization_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organization_data table
-- Allow users to see data from their organization only
CREATE POLICY "Users can view organization data from their organization"
ON public.organization_data FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.users 
        WHERE id = auth.uid()
    )
);

-- Allow admins to insert organization data
CREATE POLICY "Admins can insert organization data"
ON public.organization_data FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Allow admins to update organization data from their organization
CREATE POLICY "Admins can update organization data from their organization"
ON public.organization_data FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Allow admins to delete organization data from their organization
CREATE POLICY "Admins can delete organization data from their organization"
ON public.organization_data FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_organization_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_organization_data_updated_at
    BEFORE UPDATE ON public.organization_data
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_data_updated_at();

-- Insert some sample data for existing organizations (optional)
-- This will help populate the table with data extracted from existing user tables
-- Run this only if you want to seed initial data

-- Note: This seed data section should be customized based on your existing data
-- Uncomment and modify as needed:

/*
-- Example: Insert departments from existing users table
INSERT INTO public.organization_data (organization_id, type, name, is_active)
SELECT DISTINCT 
    u.organization_id,
    'department'::text,
    u.department,
    true
FROM public.users u
WHERE u.department IS NOT NULL 
    AND u.department != ''
    AND NOT EXISTS (
        SELECT 1 FROM public.organization_data od 
        WHERE od.organization_id = u.organization_id 
            AND od.type = 'department' 
            AND od.name = u.department
    );

-- Example: Insert regions from existing user_profiles table
INSERT INTO public.organization_data (organization_id, type, name, is_active)
SELECT DISTINCT 
    up.organization_id,
    'region'::text,
    COALESCE(up.region, up.territory_name, up.territory),
    true
FROM public.user_profiles up
WHERE COALESCE(up.region, up.territory_name, up.territory) IS NOT NULL 
    AND COALESCE(up.region, up.territory_name, up.territory) != ''
    AND NOT EXISTS (
        SELECT 1 FROM public.organization_data od 
        WHERE od.organization_id = up.organization_id 
            AND od.type = 'region' 
            AND od.name = COALESCE(up.region, up.territory_name, up.territory)
    );

-- Example: Insert countries from existing user_profiles table
INSERT INTO public.organization_data (organization_id, type, name, is_active)
SELECT DISTINCT 
    up.organization_id,
    'country'::text,
    up.country,
    true
FROM public.user_profiles up
WHERE up.country IS NOT NULL 
    AND up.country != ''
    AND NOT EXISTS (
        SELECT 1 FROM public.organization_data od 
        WHERE od.organization_id = up.organization_id 
            AND od.type = 'country' 
            AND od.name = up.country
    );
*/

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_data TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.organization_data IS 'Centralized storage for organizational reference data like departments, regions, and countries';
COMMENT ON COLUMN public.organization_data.type IS 'Type of organizational data: department, region, or country';
COMMENT ON COLUMN public.organization_data.parent_id IS 'Optional parent reference for hierarchical organization structures';
COMMENT ON COLUMN public.organization_data.code IS 'Optional short code or abbreviation for the item';