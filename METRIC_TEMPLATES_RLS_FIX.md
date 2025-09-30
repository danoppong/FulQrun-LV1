# Metric Templates RLS Fix - Migration 021

**Date**: September 30, 2025  
**Status**: ✅ Ready to Apply  
**Migration**: `021_fix_metric_templates_rls.sql`

## Problem Summary

Users were getting a **403 Forbidden** error when trying to create metric templates:

```
Error: Permission denied: Unable to create metric template due to database security policies
POST /api/sales-performance/metric-templates 403 (Forbidden)
```

### Root Cause

The RLS (Row Level Security) policies for `metric_templates` and `custom_metric_fields` were using `FOR ALL` syntax without proper `WITH CHECK` clauses. PostgreSQL requires:

- **USING clause**: Controls which rows can be selected/accessed  
- **WITH CHECK clause**: Validates data being inserted/updated

The existing policies only had USING clauses, causing INSERT operations to fail with error code `42501` (insufficient_privilege).

## Solution

Migration 021 replaces the problematic policies with operation-specific policies:

### For `metric_templates`:
- ✅ `metric_templates_select_policy` - All users can view org templates
- ✅ `metric_templates_insert_policy` - All users can create templates (with proper WITH CHECK)
- ✅ `metric_templates_update_policy` - Managers/admins can update (with WITH CHECK)
- ✅ `metric_templates_delete_policy` - Managers/admins can delete

### For `custom_metric_fields`:
- ✅ `custom_metric_fields_select_policy` - All users can view org fields
- ✅ `custom_metric_fields_insert_policy` - All users can create fields (with proper WITH CHECK)
- ✅ `custom_metric_fields_update_policy` - Managers/admins can update (with WITH CHECK)
- ✅ `custom_metric_fields_delete_policy` - Managers/admins can delete

## How to Apply

### Quick Method (Recommended)

```bash
./apply-rls-fix-021.sh
```

This will:
1. Copy the migration SQL to your clipboard
2. Show you step-by-step instructions

### Manual Method

1. **Copy migration to clipboard**:
   ```bash
   cat supabase/migrations/021_fix_metric_templates_rls.sql | pbcopy
   ```

2. **Open Supabase Dashboard**:
   - Go to https://app.supabase.com
   - Navigate to your project

3. **Open SQL Editor**:
   - Click on "SQL Editor" in the left sidebar
   - Create a new query

4. **Paste and Run**:
   - Paste the migration (Cmd+V)
   - Click "Run" button

5. **Verify**:
   - You should see success messages for each policy created
   - No error messages should appear

## Expected Results

After applying this migration:

✅ **Users CAN**:
- Create metric templates for their organization
- View all metric templates in their organization
- Create custom metric fields

✅ **Managers/Admins CAN**:
- Do everything users can do
- Update existing metric templates
- Delete metric templates
- Manage custom metric fields

❌ **Users CANNOT**:
- Create templates for other organizations
- Update/delete templates (unless manager/admin)
- Access templates from other organizations

## Testing

After applying the migration:

1. **Refresh your application**: 
   ```
   http://localhost:3000
   ```

2. **Try creating a metric template**:
   - Go to Sales Performance page
   - Click "Add Metric Template"
   - Fill in the form and submit
   - Should succeed without 403 error

3. **Check browser console**:
   - Should show: `✅ Metric template created successfully`
   - No 403 Forbidden errors

## Files Created/Modified

### New Files:
- ✅ `supabase/migrations/021_fix_metric_templates_rls.sql` - Migration file
- ✅ `apply-rls-fix-021.sh` - Helper script
- ✅ `METRIC_TEMPLATES_RLS_FIX.md` - This documentation

### Reference Files (not needed if using migration):
- `fix-metric-templates-rls.sql` - Original quick fix
- `fix-metric-templates-rls-complete.sql` - Complete fix with verification

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Drop the new policies
DROP POLICY IF EXISTS "metric_templates_select_policy" ON metric_templates;
DROP POLICY IF EXISTS "metric_templates_insert_policy" ON metric_templates;
DROP POLICY IF EXISTS "metric_templates_update_policy" ON metric_templates;
DROP POLICY IF EXISTS "metric_templates_delete_policy" ON metric_templates;

DROP POLICY IF EXISTS "custom_metric_fields_select_policy" ON custom_metric_fields;
DROP POLICY IF EXISTS "custom_metric_fields_insert_policy" ON custom_metric_fields;
DROP POLICY IF EXISTS "custom_metric_fields_update_policy" ON custom_metric_fields;
DROP POLICY IF EXISTS "custom_metric_fields_delete_policy" ON custom_metric_fields;

-- Recreate old policies (from migration 020)
-- (see supabase/migrations/020_performance_tracking_metrics.sql)
```

## Related Issues

This fix resolves:
- ❌ 403 Forbidden errors when creating metric templates
- ❌ PostgreSQL error 42501 (insufficient_privilege)
- ❌ Missing WITH CHECK clauses in RLS policies
- ❌ Same issue for custom_metric_fields table

## Next Steps

1. ✅ Apply migration 021
2. ✅ Test metric template creation
3. ✅ Verify no 403 errors
4. ✅ Confirm manager/admin permissions work correctly
5. ✅ Continue with normal development

---

**Need Help?** Check the error logs in:
- Browser console (F12)
- Supabase logs (Dashboard → Logs)
- Application logs (`npm run dev` output)
