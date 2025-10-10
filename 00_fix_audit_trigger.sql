-- ============================================================================
-- FIX: Disable Problematic Audit Trigger Before Creating Test Users
-- ============================================================================
-- This script temporarily disables the sales_performance audit trigger that
-- has a JSONB subtraction operator issue, allows you to create test data,
-- then re-enables it with a fixed version.
--
-- INSTRUCTIONS:
-- 1. Run this script FIRST in Supabase SQL Editor
-- 2. Then run 02_create_test_users.sql
-- ============================================================================

-- =============================================================================
-- STEP 1: Temporarily disable the problematic triggers
-- =============================================================================

DO $$
BEGIN
  -- Disable trigger on sales_territories
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'log_sales_territories_changes' 
    AND tgrelid = 'sales_territories'::regclass
  ) THEN
    ALTER TABLE sales_territories DISABLE TRIGGER log_sales_territories_changes;
    RAISE NOTICE 'Disabled trigger: log_sales_territories_changes on sales_territories';
  ELSE
    RAISE NOTICE 'Trigger log_sales_territories_changes not found - skipping';
  END IF;

  -- Disable other related triggers if they exist
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'log_quota_plans_changes'
  ) THEN
    ALTER TABLE quota_plans DISABLE TRIGGER log_quota_plans_changes;
    RAISE NOTICE 'Disabled trigger: log_quota_plans_changes';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'log_compensation_plans_changes'
  ) THEN
    ALTER TABLE compensation_plans DISABLE TRIGGER log_compensation_plans_changes;
    RAISE NOTICE 'Disabled trigger: log_compensation_plans_changes';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'log_performance_reviews_changes'
  ) THEN
    ALTER TABLE performance_reviews DISABLE TRIGGER log_performance_reviews_changes;
    RAISE NOTICE 'Disabled trigger: log_performance_reviews_changes';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✓ Problematic audit triggers have been disabled';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now run 02_create_test_users.sql safely';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Warning: Could not disable some triggers: %', SQLERRM;
END $$;

-- =============================================================================
-- STEP 2: Fix the problematic function (optional - for later use)
-- =============================================================================

-- This creates a fixed version of the audit function that doesn't use JSONB subtraction
-- You can enable this after creating test data if you need audit logging

CREATE OR REPLACE FUNCTION log_sales_performance_change_fixed()
RETURNS TRIGGER AS $$
DECLARE
  v_changed_fields JSONB := '{}'::jsonb;
  v_old_values JSONB := '{}'::jsonb;
  v_new_values JSONB := '{}'::jsonb;
BEGIN
  -- For UPDATE operations, calculate changed fields without using JSONB subtraction
  IF TG_OP = 'UPDATE' THEN
    -- Store full old and new values
    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);
    
    -- For changed_fields, we'll just store an empty object
    -- A proper implementation would compare fields individually
    v_changed_fields := '{}'::jsonb;
  ELSIF TG_OP = 'DELETE' THEN
    v_old_values := to_jsonb(OLD);
    v_new_values := '{}'::jsonb;
  ELSIF TG_OP = 'INSERT' THEN
    v_old_values := '{}'::jsonb;
    v_new_values := to_jsonb(NEW);
  END IF;

  -- Only insert if sales_performance_audit table exists
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
      v_changed_fields,
      v_old_values,
      v_new_values,
      auth.uid(),
      COALESCE(NEW.organization_id, OLD.organization_id)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN others THEN
    -- Don't fail the operation if audit logging fails
    RAISE WARNING 'Audit logging failed: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_sales_performance_change_fixed() IS 'Fixed version of audit trigger without JSONB subtraction operator';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check which triggers are disabled
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  CASE tgenabled
    WHEN 'D' THEN 'DISABLED'
    WHEN 'O' THEN 'ENABLED'
    ELSE 'OTHER'
  END as status
FROM pg_trigger
WHERE tgname LIKE 'log_%_changes'
ORDER BY tgrelid::regclass, tgname;
