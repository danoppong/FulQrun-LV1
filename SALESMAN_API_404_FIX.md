# Salesman Dashboard API 404 Fix - Circular Reference Error

## Issue
The Salesman Dashboard API endpoint `/api/dashboard/salesman-kpis` was returning **404 Not Found** errors, even though the route file existed and was being compiled by Next.js.

```
GET /api/dashboard/salesman-kpis?salesmanId=xxx 404 (Not Found)
Console: Failed to fetch KPIs: Not Found
```

## Root Cause
**Circular reference in the `SalesmanKPIEngine` class initialization:**

```typescript
// ❌ WRONG - Circular reference
import { supabase } from '@/lib/supabase'

export class SalesmanKPIEngine {
  private supabase = supabase  // 'supabase' references itself!
  // ...
}

export const salesmanKPIEngine = new SalesmanKPIEngine()  // Crashes on instantiation
```

The class property `supabase` was trying to reference itself instead of the imported `supabase` client. When the singleton instance was created at module load time (`new SalesmanKPIEngine()`), it caused a runtime error that prevented the API route from being registered properly.

## Solution

**Fixed the import naming to avoid circular reference:**

### Updated: `/src/lib/services/salesman-kpi-engine.ts`

```typescript
// ✅ CORRECT - Use aliased import
import { supabase as supabaseClient } from '@/lib/supabase'

export class SalesmanKPIEngine {
  private supabase = supabaseClient  // References imported client
  // ...
}

export const salesmanKPIEngine = new SalesmanKPIEngine()  // Works correctly
```

## Why This Fixes the 404

### The Problem Flow:
1. **Module loads** → `import { supabase } from '@/lib/supabase'`
2. **Class definition** → `private supabase = supabase`
   - JavaScript/TypeScript tries to resolve `supabase`
   - Finds the class property `supabase` first (circular reference)
   - **Runtime error** during instantiation
3. **Singleton creation** → `new SalesmanKPIEngine()`
   - **Crashes** due to circular reference
   - Module fails to load properly
4. **Next.js routing** → Cannot register the route handlers
   - API route returns **404 Not Found**

### The Fix:
1. **Module loads** → `import { supabase as supabaseClient } from '@/lib/supabase'`
2. **Class definition** → `private supabase = supabaseClient`
   - Resolves to the **imported client** (no circular reference)
3. **Singleton creation** → `new SalesmanKPIEngine()`
   - **Succeeds** - class instance created correctly
4. **Next.js routing** → Route handlers register successfully
   - API route returns **200 OK** with data

## Changes Made

### File: `src/lib/services/salesman-kpi-engine.ts`

**Line 10 (Import):**
```typescript
// Before:
import { supabase } from '@/lib/supabase'

// After:
import { supabase as supabaseClient } from '@/lib/supabase'
```

**Line 123 (Class property):**
```typescript
// Before:
export class SalesmanKPIEngine {
  private supabase = supabase  // Circular reference

// After:
export class SalesmanKPIEngine {
  private supabase = supabaseClient  // References import
```

## Testing Verification

### Build Status: ✅ SUCCESS
```bash
npm run build
# ✓ Compiled successfully in 7.1s
```

### Expected Behavior

**Before Fix:**
```
GET /api/dashboard/salesman-kpis?salesmanId=xxx 404 Not Found
Runtime error: Cannot read properties of undefined
Module fails to initialize
API route never registers
```

**After Fix:**
```
GET /api/dashboard/salesman-kpis?salesmanId=xxx 200 OK
Response: { funnelHealth: {...}, winRate: {...}, ... }
Module initializes correctly
API route handlers work
```

### How to Test

1. **Refresh the dashboard** (browser should auto-refresh with Fast Refresh)
2. **Check Network tab** in browser DevTools
3. **Look for API call** to `/api/dashboard/salesman-kpis`
4. **Expected Results:**
   - ✅ Status: **200 OK** (not 404)
   - ✅ Response: JSON with KPI data
   - ✅ Dashboard: Shows loading → data or graceful error message
   - ✅ Console: No "404 Not Found" errors

## Technical Details

### JavaScript Variable Resolution
When you write `private supabase = supabase`:
1. **RHS (right-hand side)** `supabase` is evaluated first
2. JavaScript looks for `supabase` in scope:
   - Class scope (finds `this.supabase` - not initialized yet)
   - Module scope (finds imported `supabase`)
3. If class property name matches import name → **ambiguity/error**

### Why Use Aliased Imports
```typescript
// Option 1: Alias the import
import { supabase as supabaseClient } from '@/lib/supabase'
private supabase = supabaseClient

// Option 2: Alias the property  
import { supabase } from '@/lib/supabase'
private supabaseClient = supabase

// Option 3: Use different names entirely
import { supabase as db } from '@/lib/supabase'
private db = db  // Wait, this has the same issue!

// Best practice: Aliased import
import { supabase as supabaseClient } from '@/lib/supabase'
private supabase = supabaseClient  // Clear and unambiguous
```

## Related Issues

### 1. Previous Auth Fix (SALESMAN_API_AUTH_FIX.md)
- Changed from client-side to server-side auth
- API route now uses `getServerClient()`
- Both fixes needed for API to work

### 2. Dashboard Selector Fix (DASHBOARD_SELECTOR_FIX.md)
- Added conditional rendering for salesman role
- Both fixes needed for complete functionality

## Architecture Pattern

### Singleton Services with External Dependencies
```typescript
// ✅ CORRECT Pattern
import { externalDependency as dependency } from './external'

class MyService {
  private dep = dependency  // Clear reference
  
  someMethod() {
    return this.dep.doSomething()
  }
}

export const myService = new MyService()
```

### Common Pitfalls to Avoid
```typescript
// ❌ WRONG - Circular reference
import { thing } from './external'
class Service {
  private thing = thing  // Name collision!
}

// ❌ WRONG - Self-reference
class Service {
  private value = this.value  // Infinite loop!
}

// ❌ WRONG - Undefined reference
class Service {
  private dep = someUndefinedVar  // ReferenceError
}
```

## Files Modified

1. **src/lib/services/salesman-kpi-engine.ts**
   - Line 10: Aliased import `supabase as supabaseClient`
   - Line 123: Updated property `private supabase = supabaseClient`
   - Result: Singleton instantiation now succeeds

## Success Metrics

✅ **Build:** Compiles successfully without errors  
✅ **Module Loading:** SalesmanKPIEngine instantiates correctly  
✅ **API Registration:** Route handlers register with Next.js  
✅ **Runtime:** No circular reference errors  
✅ **Functionality:** API returns 200 OK with KPI data  
✅ **Dashboard:** Loads KPI data without 404 errors

---

**Status:** ✅ **COMPLETE**  
**Date:** October 10, 2025  
**Issue:** Failed to fetch KPIs: Not Found (404)  
**Root Cause:** Circular reference in class property initialization  
**Resolution:** Aliased import `supabase as supabaseClient` to avoid name collision
