# Admin Dashboard Testing Guide

## 🎯 Overview

This guide helps you test the admin dashboard functionality after running the database setup scripts. The admin dashboard now allows administrators to view data from any user's perspective using the role selector.

## 📋 Prerequisites

Before testing, ensure you've run:
1. ✅ `01_complete_database_setup.sql` - Core database setup with triggers and RLS policies
2. ✅ `02_create_test_users.sql` - Sample users and opportunities for testing

## 🧪 Test Scenarios

### Test 1: Admin Login & Dashboard Access

**Steps:**
1. Login as `danoppong@gmail.com` (admin role)
2. Navigate to `/dashboard`
3. **Expected Results:**
   - Dashboard loads without errors
   - You see the **role selector dropdown** in the top-right area
   - Default view shows "Manager" or "Admin" dashboard perspective

**Verification:**
- ✅ No console errors
- ✅ No 404 errors in Network tab
- ✅ KPI cards render (may show zeros if no pharmaceutical data exists)
- ✅ Role selector dropdown is visible and clickable

---

### Test 2: Role Selector Functionality

**Steps:**
1. Click on the role selector dropdown
2. You should see options:
   - 👤 **SALESMAN** - Individual sales rep view
   - 👥 **MANAGER** - Team manager view
   - 🌍 **REGIONAL_DIRECTOR** - Multi-territory view
   - 🔑 **ADMIN** - Administrator view
   - ⚡ **SUPER_ADMIN** - Super administrator view
3. Select **SALESMAN** from dropdown
4. Wait for dashboard to reload

**Expected Results:**
- Dashboard switches to salesman perspective
- URL may update or component rerenders
- KPI cards show salesman-specific metrics
- No permission errors

**Verification:**
```
✅ Dropdown displays all role options
✅ Clicking a role triggers dashboard update
✅ No 403 Forbidden errors
✅ Dashboard content changes based on selected role
```

---

### Test 3: API Authorization

**Steps:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Switch between different roles in the dropdown
4. Monitor API requests to `/api/dashboard/salesman-kpis`

**Expected API Responses:**
- **Status Code:** 200 OK (not 404 or 403)
- **Response Body:** JSON with KPI data (or empty arrays if no data)
- **Headers:** Should include `Cache-Control: public, s-maxage=300`

**Example Good Response:**
```json
{
  "kpis": {
    "totalRevenue": 0,
    "openOpportunities": 4,
    "conversionRate": 0,
    "averageDealSize": 0
  },
  "period": "weekly",
  "viewMode": "individual"
}
```

**Verification:**
```bash
# Run this in terminal to test API directly
curl -i http://localhost:3001/api/dashboard/salesman-kpis?period=weekly&viewMode=individual
```

Expected: `HTTP/1.1 200 OK` (not 404 or 403)

---

### Test 4: Team Hierarchy View (with test users)

**Prerequisites:** Run `02_create_test_users.sql` first

**Steps:**
1. Login as admin
2. Select **MANAGER** role from dropdown
3. Enable "Include Subordinates" toggle (if available)
4. Switch to "Team Rollup" view mode (if available)

**Expected Results:**
- Should see data from all salesmen under managers
- North Region: John Smith, Jane Doe (4 opportunities)
- South Region: Mike Johnson, Sarah Williams (4 opportunities)
- Total: 8 opportunities across all salesmen

**Verification:**
```sql
-- Run this query in Supabase SQL Editor to verify data
SELECT 
  up.email,
  up.role,
  COUNT(o.id) as opportunity_count,
  SUM(o.value) as total_value
FROM user_profiles up
LEFT JOIN opportunities o ON o.assigned_to = up.id
WHERE up.organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8'
  AND up.role = 'salesman'
GROUP BY up.email, up.role;
```

Expected: 4 rows showing salesmen with their opportunity counts

---

### Test 5: RLS Policy Verification

**Steps:**
1. Open Supabase SQL Editor
2. Run the following query as your admin user:

```sql
-- This should return all user profiles (admin can see all)
SELECT 
  email,
  role,
  organization_id,
  manager_id
FROM user_profiles
WHERE organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8'
ORDER BY role, email;
```

**Expected Results:**
- Returns all users (1 admin + 2 managers + 4 salesmen = 7 users)
- No "permission denied" errors

**Verification:**
```
✅ Query returns 7 rows
✅ Shows admin user (danoppong@gmail.com)
✅ Shows 2 managers (manager.north, manager.south)
✅ Shows 4 salesmen (john.smith, jane.doe, mike.johnson, sarah.williams)
```

---

### Test 6: Auto-Sync Trigger Test

**Steps:**
1. In Supabase Authentication dashboard, create a new test user:
   - Email: `test.auto@fulqrun.test`
   - Add to `raw_user_meta_data`:
     ```json
     {
       "role": "salesman",
       "organization_id": "9ed327f2-c46a-445a-952b-70addaee33b8"
     }
     ```
2. After user is created, check user_profiles table:

```sql
SELECT * FROM user_profiles 
WHERE email = 'test.auto@fulqrun.test';
```

**Expected Results:**
- Profile automatically created with role='salesman'
- organization_id matches the metadata value
- No manual INSERT needed

**Verification:**
```
✅ Profile exists immediately after user creation
✅ Role and organization_id populated correctly
✅ Trigger is working
```

---

## 🐛 Troubleshooting

### Issue: Dashboard Shows "Organization not found"

**Solution:**
```sql
-- Verify your admin profile has organization_id
SELECT id, email, role, organization_id 
FROM user_profiles 
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';

-- If organization_id is NULL, update it:
UPDATE user_profiles 
SET organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8'
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';
```

---

### Issue: 404 Not Found on API Calls

**Check:**
1. Dev server port - may be 3001 instead of 3000
2. Browser console shows actual port being used
3. API route exists at `src/app/api/dashboard/salesman-kpis/route.ts`

**Solution:**
```bash
# Check what's running on port 3001
lsof -ti tcp:3001

# Restart dev server if needed
npm run dev
```

---

### Issue: KPI Cards Show All Zeros

**Cause:** No opportunities or sales data exists

**Solution:** Run `02_create_test_users.sql` to populate sample data

**Verification:**
```sql
SELECT COUNT(*) as opportunity_count 
FROM opportunities 
WHERE organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8';
```

Should return at least 12 (4 from initial setup + 8 from test users)

---

### Issue: "Insufficient permissions" Error

**Check:**
1. Your role in user_profiles table
2. RLS policies are correctly applied
3. API route authorization logic

**Solution:**
```sql
-- Verify role is correct
SELECT id, email, role 
FROM user_profiles 
WHERE email = 'danoppong@gmail.com';

-- Should return role='admin' or role='super_admin'

-- If wrong, update it:
UPDATE user_profiles 
SET role = 'admin'
WHERE email = 'danoppong@gmail.com';
```

---

## 🎓 Advanced Testing

### Test Performance with Large Datasets

**Create 100 test opportunities:**
```sql
-- Run this to stress-test the dashboard
DO $$
DECLARE
  v_org_id UUID := '9ed327f2-c46a-445a-952b-70addaee33b8';
  v_admin_id UUID := '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';
  i INTEGER;
BEGIN
  FOR i IN 1..100 LOOP
    INSERT INTO opportunities (
      name, stage, value, probability, close_date,
      organization_id, assigned_to, created_by
    ) VALUES (
      'Test Opportunity ' || i,
      (ARRAY['prospecting', 'qualifying', 'proposal', 'negotiation'])[floor(random() * 4 + 1)],
      (random() * 200000)::DECIMAL(15,2),
      (random() * 100)::INTEGER,
      CURRENT_DATE + (random() * 90)::INTEGER,
      v_org_id,
      v_admin_id,
      v_admin_id
    );
  END LOOP;
END $$;
```

**Expected:** Dashboard still loads in < 3 seconds

---

### Test Role Switching Speed

**Steps:**
1. Open DevTools Performance tab
2. Start recording
3. Switch between roles 5 times
4. Stop recording
5. Analyze re-render time

**Expected:** Each role switch < 500ms

---

## ✅ Success Criteria

Your admin dashboard implementation is successful when:

- [x] Admin can login without errors
- [x] Dashboard loads on first visit
- [x] Role selector dropdown appears
- [x] Can switch between all 5 roles
- [x] API returns 200 OK (not 404/403)
- [x] No console errors in browser
- [x] Test users visible in hierarchy views
- [x] RLS policies allow admin to see all data
- [x] Auto-sync trigger creates profiles for new users
- [x] KPI calculations work (when data exists)

## 📊 Performance Benchmarks

**Target Metrics:**
- Initial page load: < 2 seconds
- Role switch: < 500ms
- API response time: < 300ms
- No memory leaks after 10 role switches

## 🔗 Related Documentation

- `ADMIN_DASHBOARD_ACCESS_GRANT.md` - Technical implementation details
- `ADMIN_DASHBOARD_ACCESS_SUCCESS.md` - Implementation summary
- `MISSING_USER_PROFILES_TABLE.md` - Database setup background

## 🆘 Getting Help

If tests fail:
1. Check browser console for errors
2. Check Network tab for failed requests
3. Run SQL verification queries above
4. Review RLS policies in Supabase dashboard
5. Verify dev server is running on correct port

---

**Last Updated:** October 10, 2025  
**Version:** 1.0  
**Status:** Complete - Admin Dashboard Access Fully Functional
