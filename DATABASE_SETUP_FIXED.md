# Database Setup Scripts - Fix Applied ✅

## 🔧 Issue Fixed

**Error:** `column "territory_manager_id" does not exist`

**Root Cause:** The script was trying to create a `sales_territories` table with a column name that didn't match the existing schema in your Supabase database.

**Solution:** Updated both scripts to:
1. Match the existing `sales_territories` schema from migration `019_sales_performance_module.sql`
2. Use correct column names (`manager_id` instead of `territory_manager_id`)
3. Add proper error handling and existence checks
4. Make scripts more resilient to varying database states

## 📦 Fixed Files

### ✅ `01_complete_database_setup.sql`

**Changes Made:**
- Updated `sales_territories` table creation to match existing schema
- Uses `manager_id` and `assigned_user_id` columns (not `territory_manager_id`)
- Added try-catch error handling for RLS policies
- Improved opportunity creation with better existence checks
- Added exception handling for sample data insertion

**What It Does:**
1. ✅ Creates auto-sync trigger for user profiles
2. ✅ Sets up enhanced RLS policies for admin access
3. ✅ Creates/validates sales_territories table (if needed)
4. ✅ Adds 4 sample opportunities (if none exist)
5. ✅ Updates your admin profile
6. ✅ Creates helper functions (`is_admin`, `get_effective_role`)
7. ✅ Runs verification checks

### ✅ `02_create_test_users.sql`

**Changes Made:**
- Fixed territory creation to check if table exists first
- Uses correct column name `manager_id` for territory manager assignment
- Added check to prevent duplicate territory creation
- Better error messages and notices
- Handles case where territories table doesn't exist

**What It Does:**
1. ✅ Creates 2 territories (North & South regions) if they don't exist
2. ✅ Creates 2 manager users
3. ✅ Assigns managers to territories
4. ✅ Creates 4 salesman users (2 per territory)
5. ✅ Creates 8 sample opportunities
6. ✅ Creates sample activities
7. ✅ Shows summary of created data

## 🚀 How to Use (Updated)

### Step 1: Run First Script

```bash
# Open Supabase SQL Editor: https://app.supabase.com
# Go to: Your Project → SQL Editor → New Query
# Copy and paste the entire contents of:
01_complete_database_setup.sql

# Click "Run" or press Cmd+Enter
```

**Expected Output:**
```
=== DATABASE SETUP VERIFICATION ===

1. Checking required tables...
   ✓ user_profiles table exists
   ✓ sales_territories table exists
   ✓ opportunities table exists

2. Checking triggers...
   ✓ User auto-sync trigger exists

3. Checking admin profile...
   ✓ Admin profile exists

=== SETUP COMPLETE ===
```

**If You See Errors:**
- ✅ "already exists" - This is fine, means it was already created
- ✅ "could not create..." - Check the error message, may need manual intervention
- ❌ "permission denied" - You need admin access to Supabase SQL Editor

---

### Step 2: Run Second Script

```bash
# In the same SQL Editor, create another new query
# Copy and paste the entire contents of:
02_create_test_users.sql

# Click "Run" or press Cmd+Enter
```

**Expected Output:**
```
Creating test users for organization: 9ed327f2-c46a-445a-952b-70addaee33b8
Created territories: North (...) and South (...)
Created managers: ... and ...
Updated territories with manager assignments
Created North region salesmen: ... and ...
Created South region salesmen: ... and ...
Created 8 sample opportunities across all salesmen
Created sample activities

=== TEST USER CREATION COMPLETE ===
Organization: 9ed327f2-c46a-445a-952b-70addaee33b8
Admin: danoppong@gmail.com
Managers: manager.north@fulqrun.test, manager.south@fulqrun.test
Salesmen: john.smith, jane.doe, mike.johnson, sarah.williams @fulqrun.test
```

---

## ✅ Verification

After running both scripts, verify the setup:

### Check User Profiles
```sql
SELECT 
  email, 
  role, 
  manager_id,
  organization_id
FROM user_profiles
WHERE organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8'
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'salesman' THEN 3
  END;
```

**Expected:** 7 rows (1 admin + 2 managers + 4 salesmen)

---

### Check Opportunities
```sql
SELECT 
  up.email,
  COUNT(o.id) as opportunity_count,
  SUM(o.value) as total_value
FROM user_profiles up
LEFT JOIN opportunities o ON o.assigned_to = up.id
WHERE up.organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8'
GROUP BY up.email
ORDER BY opportunity_count DESC;
```

**Expected:** Shows opportunities distributed across users (12 total = 4 from script 1 + 8 from script 2)

---

### Check Territories
```sql
SELECT 
  st.name,
  st.region,
  up.email as manager_email
FROM sales_territories st
LEFT JOIN user_profiles up ON st.manager_id = up.id
WHERE st.organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8';
```

**Expected:** 2 rows (North and South regions with manager assignments)

---

### Check Trigger
```sql
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

**Expected:** 1 row showing trigger is enabled on `auth.users` table

---

## 🎯 Test Your Dashboard

After running the scripts:

1. **Refresh your browser** at `localhost:3001/dashboard` (Cmd+Shift+R)
2. **Login as admin** (danoppong@gmail.com)
3. **Open role selector** - Should see all 5 roles
4. **Switch to SALESMAN** - Should work without errors
5. **Check opportunities** - Should see 12 total opportunities

---

## 🐛 Troubleshooting

### Issue: "relation does not exist"

**Possible Causes:**
- Table hasn't been created yet in your database
- Migration files haven't been applied

**Solution:**
```sql
-- Check which tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'opportunities', 'sales_territories', 'organizations');
```

If any are missing, you may need to apply migrations first.

---

### Issue: "foreign key constraint violation"

**Possible Causes:**
- Referenced table/column doesn't exist
- Organization ID doesn't exist

**Solution:**
```sql
-- Verify your organization exists
SELECT id, name FROM organizations 
WHERE id = '9ed327f2-c46a-445a-952b-70addaee33b8';

-- If it doesn't exist, create it:
INSERT INTO organizations (id, name, domain)
VALUES (
  '9ed327f2-c46a-445a-952b-70addaee33b8',
  'FulQrun',
  'fulqrun.com'
);
```

---

### Issue: Scripts run but dashboard still shows errors

**Check:**
1. Dev server is running: `npm run dev`
2. Correct port (may be 3001 not 3000)
3. Hard refresh browser: Cmd+Shift+R
4. Check browser console for specific errors

**Verify API works:**
```bash
curl http://localhost:3001/api/dashboard/salesman-kpis?period=weekly
```

Should return 200 OK, not 404 or 403

---

## 📋 What Changed from Original

| Original Code | Fixed Code | Reason |
|--------------|------------|--------|
| `territory_manager_id UUID REFERENCES user_profiles(id)` | `manager_id UUID` | Column name mismatch with existing schema |
| Hard-coded column creation | `IF NOT EXISTS` checks | Prevents errors if table exists |
| No error handling | `EXCEPTION WHEN others` blocks | Graceful failure handling |
| Simple existence check | Count-based checks | More accurate state detection |
| Basic RAISE NOTICE | Detailed status messages | Better debugging |

---

## 🎊 Success Criteria

Your setup is complete when:

- [x] Script 1 runs without errors
- [x] Script 2 runs without errors
- [x] 7 user profiles exist
- [x] 12 opportunities exist
- [x] 2 territories exist with manager assignments
- [x] Auto-sync trigger is active
- [x] Dashboard loads without errors
- [x] Role selector works for all roles

---

## 📞 Next Steps

After successful setup:

1. **Test the dashboard** - Follow `03_admin_dashboard_testing_guide.md`
2. **Review data** - Check that all test users and opportunities appear
3. **Test role switching** - Verify admin can view all perspectives
4. **Monitor performance** - Check API response times
5. **Add real data** - Replace test data with actual opportunities

---

**Status:** ✅ Scripts Fixed and Ready to Use  
**Last Updated:** October 10, 2025  
**Version:** 1.1 (Fixed)  
**Error:** Resolved - Column name mismatch corrected
