# CRITICAL FIX: Server Client Authentication Issue

**Date**: September 30, 2025  
**Status**: ✅ FIXED  
**Severity**: CRITICAL - Affected all API routes using createServerClient()

## Problem Summary

Users were getting **403 Forbidden** errors when trying to create metric templates, even after applying correct RLS policies.

### Initial Diagnosis (Incorrect)
❌ We initially thought it was an RLS policy issue (missing WITH CHECK clauses)  
❌ We created migration 021 to fix the policies  
❌ Policies were fixed but 403 error persisted  

### Root Cause (Actual Bug)
🐛 **The `createServerClient()` function was returning a BROWSER client instead of a proper SERVER client!**

**File**: `/src/lib/supabase.ts`

**Bug** (line 14-16):
```typescript
export function createServerClient() {
  return getSupabaseBrowserClient()  // ❌ WRONG!
}
```

### Why This Caused 403 Errors

1. **API routes** call `createServerClient()` to access the database
2. **Browser client** doesn't have access to server-side cookies
3. **Without cookies**, the client can't authenticate the user
4. **RLS policies** check `auth.uid()` to verify user identity
5. **With no auth context**, `auth.uid()` returns `NULL`
6. **RLS policy fails** because it requires a valid user
7. **INSERT is rejected** with error code `42501` (insufficient privilege)
8. **API returns 403** Forbidden

### The Fix

**File**: `/src/lib/supabase.ts`

**Before**:
```typescript
export function createServerClient() {
  return getSupabaseBrowserClient()  // ❌ No auth context
}
```

**After**:
```typescript
import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerClient() {
  const cookieStore = cookies()  // ✅ Get server cookies
  
  return createSSRClient<Database>(
    supabaseConfig.url!,
    supabaseConfig.anonKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Cookie setting might fail in some contexts
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Cookie removal might fail in some contexts
          }
        },
      },
    }
  )  // ✅ Proper SSR client with auth context
}
```

## Impact

### Before Fix
❌ All API routes using `createServerClient()` had no auth context  
❌ RLS policies always failed for INSERT/UPDATE operations  
❌ Users couldn't create any records via API  
❌ 403 Forbidden errors everywhere  

### After Fix
✅ API routes properly authenticate users via cookies  
✅ `auth.uid()` returns the actual user ID in RLS policies  
✅ RLS policies work correctly  
✅ Users can create/update records via API  
✅ No more 403 Forbidden errors  

## Files Changed

### Critical Fix
- ✅ `src/lib/supabase.ts` - Fixed createServerClient() to use proper SSR client

### Migration (Still Useful)
- ✅ `supabase/migrations/021_fix_metric_templates_rls.sql` - Improved RLS policies
- ✅ `apply-migration-021-safe.sql` - Safe migration script

### Documentation
- ✅ `CRITICAL_FIX_SERVER_CLIENT.md` - This file
- ✅ `METRIC_TEMPLATES_RLS_FIX.md` - RLS policy documentation
- ✅ `QUICK_FIX_GUIDE.md` - Quick fix guide

## How to Verify

### 1. Check Server Logs
When you make an API request, the server should now have auth context:
```bash
# In the API route
console.log('User:', user)  // Should show user data
console.log('Org:', user.profile.organization_id)  // Should show org ID
```

### 2. Test in Browser
```javascript
// Try creating a metric template
const response = await fetch('/api/sales-performance/metric-templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Metric',
    category: 'revenue',
    metric_type: 'currency'
  })
})

// Should return 200 OK, not 403
console.log(response.status)  // ✅ 200
```

### 3. Check Database
```sql
-- In Supabase SQL Editor
SELECT * FROM metric_templates 
ORDER BY created_at DESC 
LIMIT 5;

-- Should show newly created templates
```

## Lessons Learned

1. **Always verify auth context** in server-side API routes
2. **Browser clients ≠ Server clients** - they have different contexts
3. **RLS policies are only as good as the auth context** they receive
4. **403 errors can be caused by missing auth**, not just wrong policies
5. **Test the full request chain**, not just individual components

## Related Issues

This bug likely affected:
- ✅ Metric template creation
- ✅ Custom metric field creation  
- ✅ Any API route using `createServerClient()`
- ✅ All INSERT/UPDATE operations requiring auth

## Prevention

To prevent this in the future:

1. **Never use browser client on server**:
   ```typescript
   // ❌ DON'T DO THIS in API routes
   import { supabase } from '@/lib/supabase'
   
   // ✅ DO THIS instead
   import { createServerClient } from '@/lib/supabase'
   const supabase = createServerClient()
   ```

2. **Always test auth context**:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser()
   console.log('Auth context:', user)  // Should show user data
   ```

3. **Monitor 403 errors** - they often indicate auth issues, not just permissions

## Next Steps

1. ✅ Restart dev server (`npm run dev`)
2. ✅ Test metric template creation
3. ✅ Verify no 403 errors
4. ✅ Push to production
5. ✅ Monitor for any related issues

---

**Status**: ✅ RESOLVED  
**Commits**:
- `26e5d09` - Fix server client authentication
- `d4d1f4f` - Add migration 021 for RLS policies
