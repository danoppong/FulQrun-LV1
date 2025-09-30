-- Insert metric templates for your organization
-- Run this in Supabase SQL Editor

-- Insert the 5 default metric templates for your organization
INSERT INTO metric_templates (name, description, category, metric_type, unit, target_default, is_system, organization_id, created_by)
VALUES 
    (
        'Monthly Revenue',
        'Total revenue generated in a month',
        'revenue',
        'currency',
        'USD',
        100000,
        true,
        '9ed327f2-c46a-445a-952b-70addaee33b8',
        '4cfd1cdb-9b10-4482-82c3-7c502b9ace10'
    ),
    (
        'Deals Closed',
        'Number of deals closed in a period',
        'deals',
        'count',
        'deals',
        10,
        true,
        '9ed327f2-c46a-445a-952b-70addaee33b8',
        '4cfd1cdb-9b10-4482-82c3-7c502b9ace10'
    ),
    (
        'Sales Activities',
        'Number of sales activities completed',
        'activities',
        'count',
        'activities',
        50,
        true,
        '9ed327f2-c46a-445a-952b-70addaee33b8',
        '4cfd1cdb-9b10-4482-82c3-7c502b9ace10'
    ),
    (
        'Conversion Rate',
        'Percentage of leads converted to opportunities',
        'conversion',
        'percentage',
        '%',
        25,
        true,
        '9ed327f2-c46a-445a-952b-70addaee33b8',
        '4cfd1cdb-9b10-4482-82c3-7c502b9ace10'
    ),
    (
        'Customer Satisfaction Score',
        'Average customer satisfaction rating',
        'customer',
        'score',
        'points',
        4.5,
        true,
        '9ed327f2-c46a-445a-952b-70addaee33b8',
        '4cfd1cdb-9b10-4482-82c3-7c502b9ace10'
    )
ON CONFLICT DO NOTHING;

-- Verify the templates were inserted
SELECT 
    'Templates inserted' as status,
    COUNT(*) as count
FROM metric_templates
WHERE organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8';

-- Show the inserted templates
SELECT 
    name,
    category,
    metric_type,
    unit,
    target_default,
    is_system,
    created_at
FROM metric_templates
WHERE organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8'
ORDER BY created_at DESC;
