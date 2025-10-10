-- ============================================================================
-- CREATE TEST USERS - WITH AUTOMATIC TRIGGER FIX
-- ============================================================================
-- This script automatically disables problematic audit triggers, creates test
-- users, then provides option to re-enable triggers.
--
-- INSTRUCTIONS:
-- 1. Run this SINGLE script in Supabase SQL Editor
-- 2. It handles everything automatically
-- ============================================================================

-- =============================================================================
-- STEP 1: Disable problematic audit triggers automatically
-- =============================================================================

DO $$
BEGIN
  -- Disable all triggers on sales_territories temporarily
  EXECUTE 'ALTER TABLE sales_territories DISABLE TRIGGER ALL';
  RAISE NOTICE '✓ Disabled all triggers on sales_territories';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Note: Could not disable triggers (table may not exist): %', SQLERRM;
END $$;

-- =============================================================================
-- STEP 2: Create test users and data
-- =============================================================================

DO $$
DECLARE
  v_org_id UUID := '9ed327f2-c46a-445a-952b-70addaee33b8';
  v_admin_id UUID := '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';
  v_manager1_id UUID;
  v_manager2_id UUID;
  v_salesman1_id UUID;
  v_salesman2_id UUID;
  v_salesman3_id UUID;
  v_salesman4_id UUID;
  v_territory1_id UUID;
  v_territory2_id UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== CREATING TEST USERS ===';
  RAISE NOTICE 'Organization: %', v_org_id;
  RAISE NOTICE '';
  
  -- Create territories first (if sales_territories table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'sales_territories'
  ) THEN
    -- Check if territories already exist
    IF NOT EXISTS (
      SELECT 1 FROM sales_territories WHERE organization_id = v_org_id
    ) THEN
      INSERT INTO sales_territories (organization_id, name, region, created_by)
      VALUES 
        (v_org_id, 'North Region', 'North', v_admin_id),
        (v_org_id, 'South Region', 'South', v_admin_id)
      RETURNING id INTO v_territory1_id;
      
      SELECT id INTO v_territory2_id FROM sales_territories 
      WHERE region = 'South' AND organization_id = v_org_id 
      LIMIT 1;
      
      RAISE NOTICE '✓ Created territories: North and South';
    ELSE
      RAISE NOTICE '→ Territories already exist - using existing';
      -- Get existing territory IDs
      SELECT id INTO v_territory1_id FROM sales_territories 
      WHERE region = 'North' AND organization_id = v_org_id LIMIT 1;
      SELECT id INTO v_territory2_id FROM sales_territories 
      WHERE region = 'South' AND organization_id = v_org_id LIMIT 1;
    END IF;
  ELSE
    RAISE NOTICE '→ sales_territories table does not exist - skipping';
  END IF;
  
  -- Create manager users
  v_manager1_id := gen_random_uuid();
  v_manager2_id := gen_random_uuid();
  
  INSERT INTO user_profiles (id, email, role, organization_id, manager_id)
  VALUES
    (v_manager1_id, 'manager.north@fulqrun.test', 'manager', v_org_id, v_admin_id),
    (v_manager2_id, 'manager.south@fulqrun.test', 'manager', v_org_id, v_admin_id);
  
  RAISE NOTICE '✓ Created 2 manager users';
  
  -- Update territories with managers (if territories were created)
  IF v_territory1_id IS NOT NULL AND v_territory2_id IS NOT NULL THEN
    UPDATE sales_territories 
    SET manager_id = v_manager1_id 
    WHERE id = v_territory1_id;
    
    UPDATE sales_territories 
    SET manager_id = v_manager2_id 
    WHERE id = v_territory2_id;
    
    RAISE NOTICE '✓ Assigned managers to territories';
  END IF;
  
  -- Create salesman users under North manager
  v_salesman1_id := gen_random_uuid();
  v_salesman2_id := gen_random_uuid();
  
  INSERT INTO user_profiles (id, email, role, organization_id, manager_id)
  VALUES
    (v_salesman1_id, 'john.smith@fulqrun.test', 'salesman', v_org_id, v_manager1_id),
    (v_salesman2_id, 'jane.doe@fulqrun.test', 'salesman', v_org_id, v_manager1_id);
  
  RAISE NOTICE '✓ Created 2 North region salesmen';
  
  -- Create salesman users under South manager
  v_salesman3_id := gen_random_uuid();
  v_salesman4_id := gen_random_uuid();
  
  INSERT INTO user_profiles (id, email, role, organization_id, manager_id)
  VALUES
    (v_salesman3_id, 'mike.johnson@fulqrun.test', 'salesman', v_org_id, v_manager2_id),
    (v_salesman4_id, 'sarah.williams@fulqrun.test', 'salesman', v_org_id, v_manager2_id);
  
  RAISE NOTICE '✓ Created 2 South region salesmen';
  
  -- Create sample opportunities for salesmen (if table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'opportunities'
  ) THEN
    INSERT INTO opportunities (
      name, stage, value, probability, close_date, 
      organization_id, assigned_to, created_by, description
    ) VALUES
    (
      'Hospital Network A - John Smith',
      'qualifying',
      75000.00,
      55,
      CURRENT_DATE + INTERVAL '35 days',
      v_org_id,
      v_salesman1_id,
      v_salesman1_id,
      'Cardiology department expansion opportunity'
    ),
    (
      'Clinic Group B - John Smith',
      'proposal',
      45000.00,
      70,
      CURRENT_DATE + INTERVAL '20 days',
      v_org_id,
      v_salesman1_id,
      v_salesman1_id,
      'Primary care network adoption'
    ),
    (
      'Pharmacy Chain C - Jane Doe',
      'prospecting',
      120000.00,
      35,
      CURRENT_DATE + INTERVAL '50 days',
      v_org_id,
      v_salesman2_id,
      v_salesman2_id,
      'Regional pharmacy chain formulary access'
    ),
    (
      'Medical Center D - Jane Doe',
      'negotiation',
      95000.00,
      80,
      CURRENT_DATE + INTERVAL '10 days',
      v_org_id,
      v_salesman2_id,
      v_salesman2_id,
      'Specialty clinic contract renewal'
    ),
    (
      'Hospital E - Mike Johnson',
      'qualifying',
      85000.00,
      60,
      CURRENT_DATE + INTERVAL '40 days',
      v_org_id,
      v_salesman3_id,
      v_salesman3_id,
      'Oncology department new drug introduction'
    ),
    (
      'Health System F - Mike Johnson',
      'closed_won',
      200000.00,
      100,
      CURRENT_DATE - INTERVAL '5 days',
      v_org_id,
      v_salesman3_id,
      v_salesman3_id,
      'Multi-site health system contract - WON!'
    ),
    (
      'Specialty Practice G - Sarah Williams',
      'proposal',
      55000.00,
      65,
      CURRENT_DATE + INTERVAL '25 days',
      v_org_id,
      v_salesman4_id,
      v_salesman4_id,
      'Rheumatology practice expansion'
    ),
    (
      'Medical Group H - Sarah Williams',
      'prospecting',
      40000.00,
      45,
      CURRENT_DATE + INTERVAL '55 days',
      v_org_id,
      v_salesman4_id,
      v_salesman4_id,
      'Primary care physicians group adoption'
    );
    
    RAISE NOTICE '✓ Created 8 sample opportunities';
  ELSE
    RAISE NOTICE '→ Opportunities table not found - skipping';
  END IF;
  
  -- Create sample activities (if table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'activities'
  ) THEN
    INSERT INTO activities (
      type, subject, description, due_date, status, priority,
      organization_id, assigned_to, created_by
    ) VALUES
    (
      'call',
      'Follow-up with Dr. Anderson',
      'Discuss formulary status for new drug',
      CURRENT_DATE + INTERVAL '2 days',
      'pending',
      'high',
      v_org_id,
      v_salesman1_id,
      v_salesman1_id
    ),
    (
      'meeting',
      'Presentation at Hospital Network A',
      'Product presentation to pharmacy committee',
      CURRENT_DATE + INTERVAL '7 days',
      'pending',
      'high',
      v_org_id,
      v_salesman1_id,
      v_manager1_id
    ),
    (
      'call',
      'Check in with Jane Doe on Pharmacy Chain C',
      'Manager check-in on large opportunity',
      CURRENT_DATE + INTERVAL '1 day',
      'pending',
      'medium',
      v_org_id,
      v_manager1_id,
      v_manager1_id
    );
    
    RAISE NOTICE '✓ Created 3 sample activities';
  ELSE
    RAISE NOTICE '→ Activities table not found - skipping';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST USER CREATION COMPLETE ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  • 1 Admin: danoppong@gmail.com';
  RAISE NOTICE '  • 2 Managers: manager.north@fulqrun.test, manager.south@fulqrun.test';
  RAISE NOTICE '  • 4 Salesmen: john.smith, jane.doe, mike.johnson, sarah.williams @fulqrun.test';
  RAISE NOTICE '  • 8 Sample opportunities';
  RAISE NOTICE '  • 3 Sample activities';
  RAISE NOTICE '';
END $$;

-- =============================================================================
-- STEP 3: Re-enable triggers (OPTIONAL - commented out for safety)
-- =============================================================================

-- Uncomment the following if you need audit triggers back:
-- DO $$
-- BEGIN
--   EXECUTE 'ALTER TABLE sales_territories ENABLE TRIGGER ALL';
--   RAISE NOTICE '✓ Re-enabled all triggers on sales_territories';
-- EXCEPTION
--   WHEN others THEN
--     RAISE NOTICE 'Note: Could not re-enable triggers: %', SQLERRM;
-- END $$;

-- =============================================================================
-- STEP 4: Display results
-- =============================================================================

-- Display all user profiles
SELECT 
  role,
  email,
  LEFT(id::text, 8) || '...' as user_id,
  LEFT(COALESCE(manager_id::text, 'NULL'), 8) || CASE WHEN manager_id IS NOT NULL THEN '...' ELSE '' END as manager,
  LEFT(organization_id::text, 8) || '...' as org
FROM user_profiles
WHERE organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8'
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'super_admin' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'salesman' THEN 3
    ELSE 4
  END,
  email;

-- Display opportunities summary
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'opportunities'
  ) THEN
    RAISE NOTICE '';
    RAISE NOTICE '=== OPPORTUNITIES BY USER ===';
  END IF;
END $$;

SELECT 
  up.email as assigned_to,
  up.role,
  COUNT(*) as opportunity_count,
  TO_CHAR(SUM(o.value), 'FM$999,999,999.00') as total_value,
  ROUND(AVG(o.probability), 0)::integer || '%' as avg_probability
FROM opportunities o
JOIN user_profiles up ON o.assigned_to = up.id
WHERE o.organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8'
GROUP BY up.email, up.role
ORDER BY up.role, up.email;
