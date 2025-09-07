-- Debug authentication issues
-- Check if we have any users in the auth.users table
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if we have corresponding records in our users table
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.organization_id,
  o.name as organization_name
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
ORDER BY u.created_at DESC 
LIMIT 5;
