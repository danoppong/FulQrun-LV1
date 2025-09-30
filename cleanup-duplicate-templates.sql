-- Clean up duplicate metric templates
-- This script removes duplicates and keeps only unique templates

-- First, let's see what we have
SELECT 
    name, 
    category, 
    metric_type, 
    unit, 
    target_default, 
    is_system,
    COUNT(*) as duplicate_count
FROM metric_templates 
GROUP BY name, category, metric_type, unit, target_default, is_system
ORDER BY name, duplicate_count DESC;

-- Create a temporary table with unique templates
CREATE TEMP TABLE unique_templates AS
SELECT DISTINCT ON (name, category, metric_type, unit, target_default, is_system)
    id,
    name,
    description,
    category,
    metric_type,
    unit,
    target_default,
    is_active,
    is_system,
    organization_id,
    created_by,
    created_at,
    updated_at
FROM metric_templates
ORDER BY name, category, metric_type, unit, target_default, is_system, created_at;

-- Delete all existing templates
DELETE FROM metric_templates;

-- Re-insert only the unique templates
INSERT INTO metric_templates (
    id, name, description, category, metric_type, unit, target_default, 
    is_active, is_system, organization_id, created_by, created_at, updated_at
)
SELECT 
    id, name, description, category, metric_type, unit, target_default, 
    is_active, is_system, organization_id, created_by, created_at, updated_at
FROM unique_templates;

-- Verify the cleanup
SELECT 
    'After cleanup' as status,
    COUNT(*) as total_templates,
    COUNT(DISTINCT name) as unique_names
FROM metric_templates;

-- Show the final unique templates
SELECT 
    name, 
    category, 
    metric_type, 
    unit, 
    target_default, 
    is_system,
    created_at
FROM metric_templates 
ORDER BY name;
