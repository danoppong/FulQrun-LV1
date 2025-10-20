-- Fix Admin User Organization
-- This script ensures the admin user has the correct organization_id

-- OPTION 1: If your table is called 'profiles' (most likely)
-- Uncomment this section if you use 'profiles' table:

-- Check current state
SELECT id, email, raw_user_meta_data->>'role' as role, raw_user_meta_data->>'organization_id' as organization_id 
FROM auth.users 
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';

-- Update user metadata with organization_id
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || 
  '{"organization_id": "9ed327f2-c46a-445a-952b-70addaee33b8"}'::jsonb
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';

-- Verify the fix
SELECT id, email, raw_user_meta_data->>'role' as role, raw_user_meta_data->>'organization_id' as organization_id 
FROM auth.users 
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';


-- OPTION 2: If you have a 'profiles' table in public schema:
-- (Run this if Option 1 doesn't work)

/*
UPDATE profiles
SET organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8'
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';

SELECT id, email, role, organization_id 
FROM profiles 
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';
*/


-- OPTION 3: If you need to create the user_profiles table first:
-- (Only run if the table truly doesn't exist)

/*
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'salesman',
  organization_id UUID REFERENCES public.organizations(id),
  manager_id UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.user_profiles (id, email, role, organization_id)
VALUES (
  '4cfd1cdb-9b10-4482-82c3-7c502b9ace10',
  'danoppong@gmail.com',
  'admin',
  '9ed327f2-c46a-445a-952b-70addaee33b8'
)
ON CONFLICT (id) DO UPDATE 
SET organization_id = EXCLUDED.organization_id;
*/
