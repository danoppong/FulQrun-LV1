-- Check what's in the metric_templates table
-- Run this in Supabase SQL Editor

-- 1. Check all metric templates
SELECT 
    'All templates' as check_type,
    id,
    name,
    category,
    organization_id,
    created_by,
    created_at
FROM metric_templates
ORDER BY created_at DESC;

-- 2. Check your organization
SELECT 
    'Your organization' as check_type,
    id,
    name,
    domain
FROM organizations
WHERE id = '9ed327f2-c46a-445a-952b-70addaee33b8';

-- 3. Check if templates exist for your organization
SELECT 
    'Templates for your org' as check_type,
    COUNT(*) as count
FROM metric_templates
WHERE organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8';

-- 4. Check all organizations that have templates
SELECT 
    'Orgs with templates' as check_type,
    organization_id,
    COUNT(*) as template_count
FROM metric_templates
GROUP BY organization_id;
