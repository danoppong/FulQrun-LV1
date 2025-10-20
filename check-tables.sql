-- Check which profile tables exist in your database
-- Run this first to find the correct table name

-- Check all tables that contain 'profile' in the name
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%profile%' 
AND table_schema = 'public';

-- Also check for 'users' table
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%user%' 
AND table_schema = 'public';

-- If you see 'profiles' instead of 'user_profiles', run this:
-- (Uncomment the lines below if the table is called 'profiles')

/*
-- Check current state
SELECT id, email, role, organization_id 
FROM profiles 
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';

-- Update with organization_id
UPDATE profiles
SET organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8'
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10'
AND organization_id IS NULL;

-- Verify the fix
SELECT id, email, role, organization_id 
FROM profiles 
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';
*/
