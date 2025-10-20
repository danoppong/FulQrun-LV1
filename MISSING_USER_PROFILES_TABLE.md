# Missing user_profiles Table - Critical Fix

## Issue

The `user_profiles` table doesn't exist in your Supabase database, causing this error:

```
ERROR: 42P01: relation "user_profiles" does not exist
```

However, your application code expects this table to exist and queries it extensively.

## Root Cause

The Supabase migrations haven't been run, or the table was never created. Your code references `user_profiles` but Supabase may be using:
1. The `auth.users` table (built-in Supabase auth)
2. A `profiles` table in the public schema
3. No profile table at all

## Quick Fix Options

### Option 1: Check auth.users Table (Try This First)

Your user data might be in the `auth.users` table. Run this:

```sql
-- Check if user exists in auth.users
SELECT id, email, raw_user_meta_data
FROM auth.users 
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';

-- Update metadata with organization_id
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || 
  '{"organization_id": "9ed327f2-c46a-445a-952b-70addaee33b8", "role": "admin"}'::jsonb
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';
```

### Option 2: Create user_profiles Table

If the table truly doesn't exist, create it:

```sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'salesman',
  organization_id UUID,
  manager_id UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Insert admin user profile
INSERT INTO public.user_profiles (id, email, role, organization_id)
VALUES (
  '4cfd1cdb-9b10-4482-82c3-7c502b9ace10',
  'danoppong@gmail.com',
  'admin',
  '9ed327f2-c46a-445a-952b-70addaee33b8'
)
ON CONFLICT (id) DO UPDATE 
SET 
  organization_id = EXCLUDED.organization_id,
  role = EXCLUDED.role;
```

### Option 3: Run All Migrations

Navigate to your Supabase dashboard and run the migration file:

```bash
# File: supabase/migrations/002_role_based_dashboard.sql
```

This will create the `user_profiles` table with all necessary columns and policies.

## Recommended Approach

1. **First, check what tables exist:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name LIKE '%profile%';
   ```

2. **Then, check auth.users:**
   ```sql
   SELECT id, email, raw_user_meta_data
   FROM auth.users
   LIMIT 5;
   ```

3. **If you see your user in auth.users**, update the metadata (Option 1)

4. **If no profiles table exists**, create it (Option 2)

5. **Best long-term solution**: Run the migration file (Option 3)

## Alternative: Update Application Code

If you want to use Supabase's built-in `auth.users` table instead, you could update the application code, but this is more complex and not recommended.

## After Fixing

Once you've created the table or updated the user data, verify with:

```sql
-- Should return one row with organization_id
SELECT id, email, role, organization_id 
FROM public.user_profiles 
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';
```

Or if using auth.users:

```sql
SELECT id, email, 
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'organization_id' as organization_id
FROM auth.users 
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';
```

## Why This Happened

The migrations in `supabase/migrations/` haven't been applied to your Supabase project. You need to either:
- Run them manually via SQL Editor
- Use Supabase CLI: `supabase db push`
- Apply them through the Supabase dashboard

---

**Priority:** CRITICAL  
**Impact:** Application cannot function without user_profiles table  
**Solution Time:** 2-5 minutes (just run the SQL)  
