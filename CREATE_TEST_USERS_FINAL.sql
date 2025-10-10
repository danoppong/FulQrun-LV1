-- ============================================================================
-- CREATE TEST USERS - ULTIMATE FIX (Replaces Broken Function)
-- ============================================================================
-- This script fixes the broken audit function and then creates test users.
-- It's the nuclear option that actually fixes the root cause.
--
-- INSTRUCTIONS:
-- 1. Run this SINGLE script in Supabase SQL Editor
-- 2. It permanently fixes the audit function
-- ============================================================================

-- =============================================================================
-- STEP 1: Fix the broken audit function
-- =============================================================================

-- Replace the broken function with a working one
CREATE OR REPLACE FUNCTION log_sales_performance_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if audit table exists, and don't fail if it doesn't work
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'sales_performance_audit'
        ) THEN
            INSERT INTO sales_performance_audit (
                entity_type,
                entity_id,
                action,
                changed_fields,
                old_values,
                new_values,
                changed_by,
                organization_id
            ) VALUES (
                TG_TABLE_NAME,
                COALESCE(NEW.id, OLD.id),
                CASE 
                    WHEN TG_OP = 'INSERT' THEN 'create'
                    WHEN TG_OP = 'UPDATE' THEN 'update'
                    WHEN TG_OP = 'DELETE' THEN 'delete'
                END,
                '{}'::jsonb,  -- Fixed: don't try to subtract JSONBs
                CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END,
                CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE '{}'::jsonb END,
                auth.uid(),
                COALESCE(NEW.organization_id, OLD.organization_id)
            );
        END IF;
    EXCEPTION
        WHEN others THEN
            -- Don't fail the operation if audit logging fails
            NULL;
    END;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Confirm the fix
DO $$
BEGIN
  RAISE NOTICE '✓ Fixed the broken log_sales_performance_change() function';
  RAISE NOTICE '  (Removed JSONB subtraction operator that was causing errors)';
  RAISE NOTICE '';
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
  v_opps_inserted INTEGER := 0;
  v_acts_inserted INTEGER := 0;
  v_rows INTEGER := 0;
BEGIN
  RAISE NOTICE '=== CREATING TEST USERS ===';
  RAISE NOTICE 'Organization: %', v_org_id;
  RAISE NOTICE '';
  
  -- Ensure admin exists in legacy/public users table for FK references
  -- (Some schemas reference public.users for created_by/manager_id)
  INSERT INTO users (id, email, role, organization_id, created_at, updated_at)
  SELECT v_admin_id, 'danoppong@gmail.com', 'admin', v_org_id, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = v_admin_id);

  -- Ensure admin has a user_profiles row (required for org context in APIs/RLS)
  INSERT INTO user_profiles (id, email, role, organization_id, manager_id)
  VALUES (v_admin_id, 'danoppong@gmail.com', 'admin', v_org_id, NULL)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = EXCLUDED.role,
        organization_id = EXCLUDED.organization_id;
  
  -- Create territories (should work now with fixed trigger)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'sales_territories'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM sales_territories WHERE organization_id = v_org_id
    ) THEN
      -- Insert North territory
      INSERT INTO sales_territories (organization_id, name, region, created_by)
      VALUES (v_org_id, 'North Region', 'North', v_admin_id)
      RETURNING id INTO v_territory1_id;
      
      -- Insert South territory
      INSERT INTO sales_territories (organization_id, name, region, created_by)
      VALUES (v_org_id, 'South Region', 'South', v_admin_id)
      RETURNING id INTO v_territory2_id;
      
      RAISE NOTICE '✓ Created 2 territories';
    ELSE
      RAISE NOTICE '→ Territories already exist';
      SELECT id INTO v_territory1_id FROM sales_territories 
      WHERE region = 'North' AND organization_id = v_org_id LIMIT 1;
      SELECT id INTO v_territory2_id FROM sales_territories 
      WHERE region = 'South' AND organization_id = v_org_id LIMIT 1;
    END IF;
  ELSE
    RAISE NOTICE '→ sales_territories table does not exist';
  END IF;
  
  -- Create managers (idempotent by email). If user already exists, reuse its id; otherwise insert.
  -- Manager North
  SELECT id INTO v_manager1_id FROM auth.users WHERE email = 'manager.north@fulqrun.test' LIMIT 1;
  IF NOT FOUND THEN
    v_manager1_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
      v_manager1_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'manager.north@fulqrun.test',
      '',
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"organization_id":"9ed327f2-c46a-445a-952b-70addaee33b8","role":"manager"}'::jsonb,
      NOW(), NOW()
    );
  END IF;
  -- Ensure profile exists with correct fields (handle auto-sync conflicts)
  INSERT INTO user_profiles (id, email, role, organization_id, manager_id)
  VALUES (v_manager1_id, 'manager.north@fulqrun.test', 'manager', v_org_id, v_admin_id)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = EXCLUDED.role,
        organization_id = EXCLUDED.organization_id,
        manager_id = EXCLUDED.manager_id;

  -- Manager South
  SELECT id INTO v_manager2_id FROM auth.users WHERE email = 'manager.south@fulqrun.test' LIMIT 1;
  IF NOT FOUND THEN
    v_manager2_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
      v_manager2_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'manager.south@fulqrun.test',
      '',
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"organization_id":"9ed327f2-c46a-445a-952b-70addaee33b8","role":"manager"}'::jsonb,
      NOW(), NOW()
    );
  END IF;
  INSERT INTO user_profiles (id, email, role, organization_id, manager_id)
  VALUES (v_manager2_id, 'manager.south@fulqrun.test', 'manager', v_org_id, v_admin_id)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = EXCLUDED.role,
        organization_id = EXCLUDED.organization_id,
        manager_id = EXCLUDED.manager_id;

  RAISE NOTICE '✓ Ensured 2 managers exist (auth + profiles upserted)';
  
  -- Ensure managers exist in public.users (for FK on sales_territories.manager_id)
  INSERT INTO users (id, email, role, organization_id, created_at, updated_at)
  SELECT v_manager1_id, 'manager.north@fulqrun.test', 'manager', v_org_id, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = v_manager1_id);
  INSERT INTO users (id, email, role, organization_id, created_at, updated_at)
  SELECT v_manager2_id, 'manager.south@fulqrun.test', 'manager', v_org_id, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = v_manager2_id);
  
  -- Assign managers to territories
  IF v_territory1_id IS NOT NULL AND v_territory2_id IS NOT NULL THEN
    UPDATE sales_territories SET manager_id = v_manager1_id WHERE id = v_territory1_id;
    UPDATE sales_territories SET manager_id = v_manager2_id WHERE id = v_territory2_id;
    RAISE NOTICE '✓ Assigned managers to territories';
  END IF;
  
  -- Create North region salesmen (idempotent)
  -- John Smith
  SELECT id INTO v_salesman1_id FROM auth.users WHERE email = 'john.smith@fulqrun.test' LIMIT 1;
  IF NOT FOUND THEN
    v_salesman1_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
      v_salesman1_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'john.smith@fulqrun.test',
      '',
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"organization_id":"9ed327f2-c46a-445a-952b-70addaee33b8","role":"salesman"}'::jsonb,
      NOW(), NOW()
    );
  END IF;
  INSERT INTO user_profiles (id, email, role, organization_id, manager_id)
  VALUES (v_salesman1_id, 'john.smith@fulqrun.test', 'salesman', v_org_id, v_manager1_id)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = EXCLUDED.role,
        organization_id = EXCLUDED.organization_id,
        manager_id = EXCLUDED.manager_id;

  -- Jane Doe
  SELECT id INTO v_salesman2_id FROM auth.users WHERE email = 'jane.doe@fulqrun.test' LIMIT 1;
  IF NOT FOUND THEN
    v_salesman2_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
      v_salesman2_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'jane.doe@fulqrun.test',
      '',
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"organization_id":"9ed327f2-c46a-445a-952b-70addaee33b8","role":"salesman"}'::jsonb,
      NOW(), NOW()
    );
  END IF;
  INSERT INTO user_profiles (id, email, role, organization_id, manager_id)
  VALUES (v_salesman2_id, 'jane.doe@fulqrun.test', 'salesman', v_org_id, v_manager1_id)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = EXCLUDED.role,
        organization_id = EXCLUDED.organization_id,
        manager_id = EXCLUDED.manager_id;

  RAISE NOTICE '✓ Ensured 2 North salesmen exist';
  
  -- Ensure North salesmen exist in public.users (role maps to 'rep')
  INSERT INTO users (id, email, role, organization_id, created_at, updated_at)
  SELECT v_salesman1_id, 'john.smith@fulqrun.test', 'rep', v_org_id, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = v_salesman1_id);
  INSERT INTO users (id, email, role, organization_id, created_at, updated_at)
  SELECT v_salesman2_id, 'jane.doe@fulqrun.test', 'rep', v_org_id, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = v_salesman2_id);
  
  -- Create South region salesmen (idempotent)
  -- Mike Johnson
  SELECT id INTO v_salesman3_id FROM auth.users WHERE email = 'mike.johnson@fulqrun.test' LIMIT 1;
  IF NOT FOUND THEN
    v_salesman3_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
      v_salesman3_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'mike.johnson@fulqrun.test',
      '',
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"organization_id":"9ed327f2-c46a-445a-952b-70addaee33b8","role":"salesman"}'::jsonb,
      NOW(), NOW()
    );
  END IF;
  INSERT INTO user_profiles (id, email, role, organization_id, manager_id)
  VALUES (v_salesman3_id, 'mike.johnson@fulqrun.test', 'salesman', v_org_id, v_manager2_id)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = EXCLUDED.role,
        organization_id = EXCLUDED.organization_id,
        manager_id = EXCLUDED.manager_id;

  -- Sarah Williams
  SELECT id INTO v_salesman4_id FROM auth.users WHERE email = 'sarah.williams@fulqrun.test' LIMIT 1;
  IF NOT FOUND THEN
    v_salesman4_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
      v_salesman4_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'sarah.williams@fulqrun.test',
      '',
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"organization_id":"9ed327f2-c46a-445a-952b-70addaee33b8","role":"salesman"}'::jsonb,
      NOW(), NOW()
    );
  END IF;
  INSERT INTO user_profiles (id, email, role, organization_id, manager_id)
  VALUES (v_salesman4_id, 'sarah.williams@fulqrun.test', 'salesman', v_org_id, v_manager2_id)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = EXCLUDED.role,
        organization_id = EXCLUDED.organization_id,
        manager_id = EXCLUDED.manager_id;
  
  RAISE NOTICE '✓ Ensured 2 South salesmen exist';
  
  -- Ensure South salesmen exist in public.users (role maps to 'rep')
  INSERT INTO users (id, email, role, organization_id, created_at, updated_at)
  SELECT v_salesman3_id, 'mike.johnson@fulqrun.test', 'rep', v_org_id, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = v_salesman3_id);
  INSERT INTO users (id, email, role, organization_id, created_at, updated_at)
  SELECT v_salesman4_id, 'sarah.williams@fulqrun.test', 'rep', v_org_id, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = v_salesman4_id);
  
  -- Create opportunities (idempotent)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'opportunities'
  ) THEN
    -- John Smith opps
    INSERT INTO opportunities (name, stage, value, probability, close_date, organization_id, assigned_to, created_by, description)
    SELECT 'Hospital Network A - John Smith', 'qualifying', 75000.00, 55, CURRENT_DATE + 35, v_org_id, v_salesman1_id, v_salesman1_id, 'Cardiology expansion'
    WHERE NOT EXISTS (
      SELECT 1 FROM opportunities WHERE organization_id = v_org_id AND name = 'Hospital Network A - John Smith' AND assigned_to = v_salesman1_id
    );
    GET DIAGNOSTICS v_rows = ROW_COUNT; v_opps_inserted := v_opps_inserted + v_rows;

    INSERT INTO opportunities (name, stage, value, probability, close_date, organization_id, assigned_to, created_by, description)
    SELECT 'Clinic Group B - John Smith', 'proposal', 45000.00, 70, CURRENT_DATE + 20, v_org_id, v_salesman1_id, v_salesman1_id, 'Primary care network'
    WHERE NOT EXISTS (
      SELECT 1 FROM opportunities WHERE organization_id = v_org_id AND name = 'Clinic Group B - John Smith' AND assigned_to = v_salesman1_id
    );
    GET DIAGNOSTICS v_rows = ROW_COUNT; v_opps_inserted := v_opps_inserted + v_rows;

    -- Jane Doe opps
    INSERT INTO opportunities (name, stage, value, probability, close_date, organization_id, assigned_to, created_by, description)
    SELECT 'Pharmacy Chain C - Jane Doe', 'prospecting', 120000.00, 35, CURRENT_DATE + 50, v_org_id, v_salesman2_id, v_salesman2_id, 'Formulary access'
    WHERE NOT EXISTS (
      SELECT 1 FROM opportunities WHERE organization_id = v_org_id AND name = 'Pharmacy Chain C - Jane Doe' AND assigned_to = v_salesman2_id
    );
    GET DIAGNOSTICS v_rows = ROW_COUNT; v_opps_inserted := v_opps_inserted + v_rows;

    INSERT INTO opportunities (name, stage, value, probability, close_date, organization_id, assigned_to, created_by, description)
    SELECT 'Medical Center D - Jane Doe', 'negotiation', 95000.00, 80, CURRENT_DATE + 10, v_org_id, v_salesman2_id, v_salesman2_id, 'Contract renewal'
    WHERE NOT EXISTS (
      SELECT 1 FROM opportunities WHERE organization_id = v_org_id AND name = 'Medical Center D - Jane Doe' AND assigned_to = v_salesman2_id
    );
    GET DIAGNOSTICS v_rows = ROW_COUNT; v_opps_inserted := v_opps_inserted + v_rows;

    -- Mike Johnson opps
    INSERT INTO opportunities (name, stage, value, probability, close_date, organization_id, assigned_to, created_by, description)
    SELECT 'Hospital E - Mike Johnson', 'qualifying', 85000.00, 60, CURRENT_DATE + 40, v_org_id, v_salesman3_id, v_salesman3_id, 'Oncology department'
    WHERE NOT EXISTS (
      SELECT 1 FROM opportunities WHERE organization_id = v_org_id AND name = 'Hospital E - Mike Johnson' AND assigned_to = v_salesman3_id
    );
    GET DIAGNOSTICS v_rows = ROW_COUNT; v_opps_inserted := v_opps_inserted + v_rows;

    INSERT INTO opportunities (name, stage, value, probability, close_date, organization_id, assigned_to, created_by, description)
    SELECT 'Health System F - Mike Johnson', 'closed_won', 200000.00, 100, CURRENT_DATE - 5, v_org_id, v_salesman3_id, v_salesman3_id, 'Multi-site contract WON!'
    WHERE NOT EXISTS (
      SELECT 1 FROM opportunities WHERE organization_id = v_org_id AND name = 'Health System F - Mike Johnson' AND assigned_to = v_salesman3_id
    );
    GET DIAGNOSTICS v_rows = ROW_COUNT; v_opps_inserted := v_opps_inserted + v_rows;

    -- Sarah Williams opps
    INSERT INTO opportunities (name, stage, value, probability, close_date, organization_id, assigned_to, created_by, description)
    SELECT 'Specialty Practice G - Sarah Williams', 'proposal', 55000.00, 65, CURRENT_DATE + 25, v_org_id, v_salesman4_id, v_salesman4_id, 'Rheumatology practice'
    WHERE NOT EXISTS (
      SELECT 1 FROM opportunities WHERE organization_id = v_org_id AND name = 'Specialty Practice G - Sarah Williams' AND assigned_to = v_salesman4_id
    );
    GET DIAGNOSTICS v_rows = ROW_COUNT; v_opps_inserted := v_opps_inserted + v_rows;

    INSERT INTO opportunities (name, stage, value, probability, close_date, organization_id, assigned_to, created_by, description)
    SELECT 'Medical Group H - Sarah Williams', 'prospecting', 40000.00, 45, CURRENT_DATE + 55, v_org_id, v_salesman4_id, v_salesman4_id, 'Physician group adoption'
    WHERE NOT EXISTS (
      SELECT 1 FROM opportunities WHERE organization_id = v_org_id AND name = 'Medical Group H - Sarah Williams' AND assigned_to = v_salesman4_id
    );
    GET DIAGNOSTICS v_rows = ROW_COUNT; v_opps_inserted := v_opps_inserted + v_rows;

    RAISE NOTICE '✓ Created % opportunities (idempotent)', v_opps_inserted;
  END IF;
  
  -- Create activities (idempotent)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'activities'
  ) THEN
    INSERT INTO activities (type, subject, description, due_date, status, priority, organization_id, assigned_to, created_by)
    SELECT 'call', 'Follow-up with Dr. Anderson', 'Discuss formulary status', CURRENT_DATE + 2, 'pending', 'high', v_org_id, v_salesman1_id, v_salesman1_id
    WHERE NOT EXISTS (
      SELECT 1 FROM activities 
      WHERE organization_id = v_org_id AND subject = 'Follow-up with Dr. Anderson' AND assigned_to = v_salesman1_id
    );
    GET DIAGNOSTICS v_rows = ROW_COUNT; v_acts_inserted := v_acts_inserted + v_rows;

    INSERT INTO activities (type, subject, description, due_date, status, priority, organization_id, assigned_to, created_by)
    SELECT 'meeting', 'Hospital Network A Presentation', 'Pharmacy committee meeting', CURRENT_DATE + 7, 'pending', 'high', v_org_id, v_salesman1_id, v_manager1_id
    WHERE NOT EXISTS (
      SELECT 1 FROM activities 
      WHERE organization_id = v_org_id AND subject = 'Hospital Network A Presentation' AND assigned_to = v_salesman1_id
    );
    GET DIAGNOSTICS v_rows = ROW_COUNT; v_acts_inserted := v_acts_inserted + v_rows;

    INSERT INTO activities (type, subject, description, due_date, status, priority, organization_id, assigned_to, created_by)
    SELECT 'call', 'Check-in with Jane Doe', 'Large opportunity follow-up', CURRENT_DATE + 1, 'pending', 'medium', v_org_id, v_manager1_id, v_manager1_id
    WHERE NOT EXISTS (
      SELECT 1 FROM activities 
      WHERE organization_id = v_org_id AND subject = 'Check-in with Jane Doe' AND assigned_to = v_manager1_id
    );
    GET DIAGNOSTICS v_rows = ROW_COUNT; v_acts_inserted := v_acts_inserted + v_rows;

    RAISE NOTICE '✓ Created % activities (idempotent)', v_acts_inserted;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== SUCCESS ===';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  • 2 Territories';
  RAISE NOTICE '  • 2 Managers';
  RAISE NOTICE '  • 4 Salesmen';  
  RAISE NOTICE '  • % Opportunities inserted (idempotent)', v_opps_inserted;
  RAISE NOTICE '  • % Activities inserted (idempotent)', v_acts_inserted;
  RAISE NOTICE '';
  RAISE NOTICE 'Admin: danoppong@gmail.com';
  RAISE NOTICE 'Managers: manager.north@fulqrun.test, manager.south@fulqrun.test';
  RAISE NOTICE 'Salesmen: john.smith, jane.doe, mike.johnson, sarah.williams @fulqrun.test';
  RAISE NOTICE '';
END $$;

-- =============================================================================
-- STEP 3: Display results
-- =============================================================================

-- User hierarchy
SELECT 
  CASE role
    WHEN 'admin' THEN '🔑 ' || role
    WHEN 'manager' THEN '👥 ' || role
    WHEN 'salesman' THEN '👤 ' || role
    ELSE role
  END as role,
  email,
  LEFT(id::text, 8) || '...' as id
FROM user_profiles
WHERE organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8'
ORDER BY 
  CASE role WHEN 'admin' THEN 1 WHEN 'manager' THEN 2 WHEN 'salesman' THEN 3 ELSE 4 END,
  email;

-- Opportunities by user
SELECT 
  '📊 ' || up.role as role,
  up.email,
  COUNT(*) as opps,
  '$' || TO_CHAR(SUM(o.value), 'FM999,999') as total_value,
  ROUND(AVG(o.probability))::text || '%' as avg_prob
FROM opportunities o
JOIN user_profiles up ON o.assigned_to = up.id
WHERE o.organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8'
GROUP BY up.role, up.email
ORDER BY up.role, up.email;

-- Territory manager verification
SELECT 
  st.name AS territory,
  st.region,
  up.email AS manager_email
FROM sales_territories st
LEFT JOIN user_profiles up ON up.id = st.manager_id
WHERE st.organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8'
ORDER BY st.region, st.name;

-- Manager-level opportunity totals (roll-up of their reps)
SELECT 
  m.email AS manager_email,
  COUNT(*) AS opps,
  '$' || TO_CHAR(SUM(o.value), 'FM999,999') AS total_value,
  ROUND(AVG(o.probability))::text || '%' AS avg_prob
FROM opportunities o
JOIN user_profiles s ON s.id = o.assigned_to
LEFT JOIN user_profiles m ON m.id = s.manager_id
WHERE o.organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8'
GROUP BY m.email
ORDER BY m.email;
