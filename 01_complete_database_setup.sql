-- ============================================================================
-- COMPLETE DATABASE SETUP FOR ADMIN DASHBOARD ACCESS
-- ============================================================================
-- This script completes the database setup with all necessary tables and
-- triggers for proper admin dashboard functionality with the FulQrun platform.
--
-- INSTRUCTIONS:
-- 1. Run this in your Supabase SQL Editor
-- 2. Verify no errors appear
-- 3. Run the verification queries at the end
-- ============================================================================

-- =============================================================================
-- SECTION 1: USER PROFILE AUTO-SYNC TRIGGER (RECOMMENDED)
-- =============================================================================
-- This ensures new users automatically get a profile entry when they sign up

-- Function to sync new users to user_profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles when a new user is created in auth.users
  INSERT INTO public.user_profiles (id, email, role, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'salesman'),
    (NEW.raw_user_meta_data->>'organization_id')::uuid
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile when new user signs up';

-- =============================================================================
-- SECTION 2: ENHANCED RLS POLICIES FOR ADMIN ACCESS
-- =============================================================================

-- Drop existing admin policy if it exists and recreate with better logic
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

CREATE POLICY "Admins can view all profiles" 
ON public.user_profiles 
FOR SELECT 
USING (
  -- Users can view their own profile OR
  auth.uid() = id OR
  -- Admins can view all profiles
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Admin update policy
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;

CREATE POLICY "Admins can update all profiles" 
ON public.user_profiles 
FOR UPDATE 
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Admin insert policy (for creating new users)
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;

CREATE POLICY "Admins can insert profiles" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- =============================================================================
-- SECTION 3: CREATE SALES_TERRITORIES TABLE (if missing)
-- =============================================================================

-- Check if sales_territories table exists, if not create it
-- Note: This matches the schema from migration 019_sales_performance_module.sql
CREATE TABLE IF NOT EXISTS sales_territories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  region TEXT,
  zip_codes TEXT[],
  industry_codes TEXT[],
  revenue_tier_min DECIMAL(15,2),
  revenue_tier_max DECIMAL(15,2),
  assigned_user_id UUID, -- References users or user_profiles depending on your auth setup
  manager_id UUID, -- References users or user_profiles
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID, -- Will be your admin user ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_sales_territories_org_id ON sales_territories(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_territories_assigned_user ON sales_territories(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_sales_territories_manager ON sales_territories(manager_id);
CREATE INDEX IF NOT EXISTS idx_sales_territories_region ON sales_territories(region);

-- Enable RLS
ALTER TABLE sales_territories ENABLE ROW LEVEL SECURITY;

-- RLS policies for territories (safe with IF NOT EXISTS check)
DO $$
BEGIN
  -- Drop and recreate policy to ensure correct logic
  DROP POLICY IF EXISTS "Users can view territories in their org" ON sales_territories;
  
  CREATE POLICY "Users can view territories in their org" 
  ON sales_territories 
  FOR SELECT 
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_profiles 
      WHERE id = auth.uid()
    )
  );
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Note: Could not create territory RLS policy - may already exist or table structure different';
END $$;

-- =============================================================================
-- SECTION 4: CREATE SAMPLE OPPORTUNITIES DATA
-- =============================================================================

-- Add sample opportunities for testing (using your organization)
DO $$
DECLARE
  v_org_id UUID := '9ed327f2-c46a-445a-952b-70addaee33b8';
  v_admin_id UUID := '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';
  v_opportunities_count INTEGER;
BEGIN
  -- Check if opportunities table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'opportunities'
  ) THEN
    -- Count existing opportunities for this org
    SELECT COUNT(*) INTO v_opportunities_count 
    FROM opportunities 
    WHERE organization_id = v_org_id;
    
    -- Only insert if no opportunities exist yet
    IF v_opportunities_count = 0 THEN
    
    INSERT INTO opportunities (
      name, 
      stage, 
      value, 
      probability, 
      close_date, 
      organization_id, 
      assigned_to, 
      created_by,
      description
    ) VALUES
    (
      'Hospital ABC - New Drug Launch',
      'qualifying',
      150000.00,
      60,
      CURRENT_DATE + INTERVAL '45 days',
      v_org_id,
      v_admin_id,
      v_admin_id,
      'Major hospital network considering our new cardiovascular drug'
    ),
    (
      'Pharmacy Chain XYZ - Formulary Addition',
      'proposal',
      250000.00,
      75,
      CURRENT_DATE + INTERVAL '30 days',
      v_org_id,
      v_admin_id,
      v_admin_id,
      'National pharmacy chain formulary access opportunity'
    ),
    (
      'Dr. Smith Practice - Specialty Adoption',
      'prospecting',
      50000.00,
      40,
      CURRENT_DATE + INTERVAL '60 days',
      v_org_id,
      v_admin_id,
      v_admin_id,
      'Key opinion leader adoption for diabetes medication'
    ),
    (
      'Regional Health System - Contract Renewal',
      'negotiation',
      500000.00,
      85,
      CURRENT_DATE + INTERVAL '15 days',
      v_org_id,
      v_admin_id,
      v_admin_id,
      'Multi-year contract renewal with major health system'
    );
    
    RAISE NOTICE 'Created 4 sample opportunities successfully';
    ELSE
      RAISE NOTICE 'Organization already has % opportunities - skipping sample data creation', v_opportunities_count;
    END IF;
  ELSE
    RAISE NOTICE 'Opportunities table does not exist - skipping sample data (this is optional)';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not create sample opportunities: %', SQLERRM;
END $$;

-- =============================================================================
-- SECTION 5: UPDATE EXISTING ADMIN PROFILE
-- =============================================================================

-- Ensure your admin profile has complete information
UPDATE user_profiles
SET 
  email = 'danoppong@gmail.com',
  role = 'admin',
  organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8',
  updated_at = NOW()
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';

-- =============================================================================
-- SECTION 6: CREATE HELPER FUNCTIONS
-- =============================================================================

-- Function to check user's effective role (including admin override)
CREATE OR REPLACE FUNCTION public.get_effective_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM user_profiles
  WHERE id = user_id;
  
  RETURN COALESCE(v_role, 'salesman');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE id = user_id 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SECTION 7: VERIFICATION QUERIES
-- =============================================================================

-- Verify the setup
DO $$
BEGIN
  RAISE NOTICE '=== DATABASE SETUP VERIFICATION ===';
  RAISE NOTICE '';
  
  -- Check tables exist
  RAISE NOTICE '1. Checking required tables...';
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    RAISE NOTICE '   ✓ user_profiles table exists';
  ELSE
    RAISE NOTICE '   ✗ user_profiles table MISSING';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_territories') THEN
    RAISE NOTICE '   ✓ sales_territories table exists';
  ELSE
    RAISE NOTICE '   ✗ sales_territories table MISSING';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'opportunities') THEN
    RAISE NOTICE '   ✓ opportunities table exists';
  ELSE
    RAISE NOTICE '   ✗ opportunities table MISSING (optional)';
  END IF;
  
  -- Check trigger exists
  RAISE NOTICE '';
  RAISE NOTICE '2. Checking triggers...';
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    RAISE NOTICE '   ✓ User auto-sync trigger exists';
  ELSE
    RAISE NOTICE '   ✗ User auto-sync trigger MISSING';
  END IF;
  
  -- Check admin profile
  RAISE NOTICE '';
  RAISE NOTICE '3. Checking admin profile...';
  IF EXISTS (SELECT 1 FROM user_profiles WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10') THEN
    RAISE NOTICE '   ✓ Admin profile exists';
  ELSE
    RAISE NOTICE '   ✗ Admin profile MISSING';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== SETUP COMPLETE ===';
END $$;

-- Display current admin profile
SELECT 
  id,
  email,
  role,
  organization_id,
  created_at
FROM user_profiles
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';
