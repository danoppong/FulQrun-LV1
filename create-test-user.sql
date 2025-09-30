-- Create a test user for the application
-- Run this in Supabase SQL Editor

-- First, make sure we have the organization
INSERT INTO organizations (id, name, domain)
VALUES (
    '9ed327f2-c46a-445a-952b-70addaee33b8',
    'LivFul',
    'livful.local'
)
ON CONFLICT (id) DO NOTHING;

-- Create a test user (if it doesn't exist)
INSERT INTO users (id, email, full_name, role, organization_id)
VALUES (
    '4cfd1cdb-9b10-4482-82c3-7c502b9ace10',
    'danoppong@gmail.com',
    'Daniel Oppong',
    'admin',
    '9ed327f2-c46a-445a-952b-70addaee33b8'
)
ON CONFLICT (id) DO NOTHING;

-- Verify the user exists
SELECT 
    'User created' as status,
    id,
    email,
    full_name,
    role,
    organization_id
FROM users
WHERE email = 'danoppong@gmail.com';

-- Check if metric templates exist for this organization
SELECT 
    'Metric templates' as status,
    COUNT(*) as count
FROM metric_templates
WHERE organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8';
