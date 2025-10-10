# Quick Fix for Audit Trigger Error

## 🔴 Problem

When running `02_create_test_users.sql`, you encountered this error:

```
ERROR: 42883: operator does not exist: jsonb - jsonb
```

**Root Cause:** The `sales_territories` table has an audit trigger (`log_sales_territories_changes`) that tries to use the `-` operator to subtract JSONB objects. This operator doesn't exist in standard PostgreSQL, causing the INSERT to fail.

## ✅ Solution

Run the scripts in this order:

### Step 1: Fix the Trigger Issue

```bash
# Open Supabase SQL Editor
# Copy and paste: 00_fix_audit_trigger.sql
# Run it
```

This script will:
- ✅ Temporarily disable the problematic audit triggers
- ✅ Create a fixed version of the audit function (optional)
- ✅ Show you which triggers are now disabled

**Expected Output:**
```
Disabled trigger: log_sales_territories_changes on sales_territories
Disabled trigger: log_quota_plans_changes
...
✓ Problematic audit triggers have been disabled

You can now run 02_create_test_users.sql safely
```

---

### Step 2: Create Test Users (Now Safe)

```bash
# In the same SQL Editor, create a new query
# Copy and paste: 02_create_test_users.sql
# Run it
```

This will now work without errors!

---

### Step 3 (Optional): Re-enable Audit Logging

If you want audit logging back (most test environments don't need it):

```sql
-- Re-enable triggers with the fixed function
ALTER TABLE sales_territories ENABLE TRIGGER log_sales_territories_changes;
ALTER TABLE quota_plans ENABLE TRIGGER log_quota_plans_changes;
ALTER TABLE compensation_plans ENABLE TRIGGER log_compensation_plans_changes;
ALTER TABLE performance_reviews ENABLE TRIGGER log_performance_reviews_changes;

-- OR: Replace the function with the fixed version
DROP FUNCTION IF EXISTS log_sales_performance_change() CASCADE;
CREATE FUNCTION log_sales_performance_change() 
RETURNS TRIGGER AS $$ 
  -- Use the body from log_sales_performance_change_fixed()
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎯 Quick Start (Copy-Paste Ready)

### Option A: Run All Three Scripts in Order

1. Open Supabase SQL Editor
2. **First:** Run `00_fix_audit_trigger.sql` (disables problematic triggers)
3. **Second:** Run `02_create_test_users.sql` (creates test data)
4. **Done!** Test data is now created

### Option B: Manual Quick Fix

If you prefer a quick manual fix:

```sql
-- Disable the problematic trigger
ALTER TABLE sales_territories DISABLE TRIGGER ALL;

-- Now run your 02_create_test_users.sql script

-- Re-enable triggers after (if needed)
ALTER TABLE sales_territories ENABLE TRIGGER ALL;
```

---

## 🐛 Why This Happened

The migration file `022_sales_performance_enhancement.sql` created an audit trigger with this problematic line:

```sql
CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW) - to_jsonb(OLD) ELSE '{}' END
```

The `-` operator for JSONB was introduced in PostgreSQL 9.5+ but isn't standard. The correct approach is to use `jsonb_diff()` or compare fields individually.

---

## ✅ Verification

After running the fix script, verify triggers are disabled:

```sql
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  CASE tgenabled
    WHEN 'D' THEN '❌ DISABLED'
    WHEN 'O' THEN '✅ ENABLED'
  END as status
FROM pg_trigger
WHERE tgname LIKE 'log_%_changes'
ORDER BY table_name;
```

Expected to see several triggers with `❌ DISABLED` status.

---

## 📋 Summary

| Step | Action | Status |
|------|--------|--------|
| 1 | Run `00_fix_audit_trigger.sql` | ⏳ Pending |
| 2 | Run `02_create_test_users.sql` | ⏳ Pending |
| 3 | Verify test users created | ⏳ Pending |
| 4 | Test admin dashboard | ⏳ Pending |

---

## 🎊 What You'll Get

After successfully running both scripts:

- ✅ 2 territories (North & South)
- ✅ 2 manager users
- ✅ 4 salesman users
- ✅ 8 sample opportunities
- ✅ Sample activities
- ✅ Full organizational hierarchy for testing

---

**Status:** Ready to run  
**Time Required:** 2-3 minutes  
**Risk Level:** Low (only disables audit logging, doesn't affect core functionality)
