-- Test inserting data directly to see if RLS is working
-- First, let's try to insert an organization
INSERT INTO organizations (name) 
VALUES ('Test Organization Direct Insert')
RETURNING *;

-- Then try to insert a user (you'll need to replace the UUID with a real one)
-- For now, let's just check if we can select from the tables
SELECT 'organizations' as table_name, count(*) as record_count FROM organizations
UNION ALL
SELECT 'users' as table_name, count(*) as record_count FROM users;
