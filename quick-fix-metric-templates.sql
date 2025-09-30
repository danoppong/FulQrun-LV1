-- Quick fix: Add default metric templates
-- Run this in Supabase SQL Editor

-- First, ensure we have the metric_templates table
CREATE TABLE IF NOT EXISTS metric_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('revenue', 'deals', 'activities', 'conversion', 'customer', 'product', 'custom')),
    metric_type TEXT NOT NULL CHECK (metric_type IN ('count', 'percentage', 'currency', 'duration', 'score', 'ratio')),
    unit TEXT,
    target_default DECIMAL(15,4),
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE metric_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can view organization metric templates" ON metric_templates
    FOR ALL USING (organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1
    ));

-- Insert default metric templates for all organizations
INSERT INTO metric_templates (name, description, category, metric_type, unit, target_default, is_system, organization_id, created_by)
SELECT 
    'Monthly Revenue',
    'Total revenue generated in a month',
    'revenue',
    'currency',
    'USD',
    100000,
    true,
    o.id,
    u.id
FROM organizations o
CROSS JOIN users u
WHERE u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO metric_templates (name, description, category, metric_type, unit, target_default, is_system, organization_id, created_by)
SELECT 
    'Deals Closed',
    'Number of deals closed in a period',
    'deals',
    'count',
    'deals',
    10,
    true,
    o.id,
    u.id
FROM organizations o
CROSS JOIN users u
WHERE u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO metric_templates (name, description, category, metric_type, unit, target_default, is_system, organization_id, created_by)
SELECT 
    'Sales Activities',
    'Number of sales activities completed',
    'activities',
    'count',
    'activities',
    50,
    true,
    o.id,
    u.id
FROM organizations o
CROSS JOIN users u
WHERE u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO metric_templates (name, description, category, metric_type, unit, target_default, is_system, organization_id, created_by)
SELECT 
    'Conversion Rate',
    'Percentage of leads converted to opportunities',
    'conversion',
    'percentage',
    '%',
    25,
    true,
    o.id,
    u.id
FROM organizations o
CROSS JOIN users u
WHERE u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO metric_templates (name, description, category, metric_type, unit, target_default, is_system, organization_id, created_by)
SELECT 
    'Customer Satisfaction Score',
    'Average customer satisfaction rating',
    'customer',
    'score',
    'points',
    4.5,
    true,
    o.id,
    u.id
FROM organizations o
CROSS JOIN users u
WHERE u.role = 'admin'
ON CONFLICT DO NOTHING;

-- Verify templates were created
SELECT name, category, metric_type, unit, target_default FROM metric_templates ORDER BY created_at;
