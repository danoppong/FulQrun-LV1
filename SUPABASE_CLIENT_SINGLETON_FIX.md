# Supabase Client Singleton Fix

## Problem

**Warning in Console:**
```
Multiple GoTrueClient instances detected in the same browser context. 
It is not an error, but this should be avoided as it may produce 
undefined behavior when used concurrently under the same storage key.
```

## Root Cause

The application had multiple files creating independent Supabase client singleton instances:

1. `src/lib/auth-unified.ts` - Created its own singleton
2. `src/lib/supabase.ts` - Created its own singleton  
3. `src/lib/supabase-client.ts` - Created its own singleton
4. `src/lib/auth 2` - Duplicate auth file (deleted)
5. `src/lib/supabase 2.ts` - Duplicate supabase file (deleted)

Each singleton created its own GoTrueClient instance, leading to multiple auth clients in the same browser context, which can cause:
- Session conflicts
- Race conditions in auth state
- Inconsistent authentication behavior
- Unexpected logouts or auth errors

## Solution

### 1. Created Global Singleton (`src/lib/supabase-singleton.ts`)

A new centralized file that manages a **single** global Supabase client instance:

```typescript
// src/lib/supabase-singleton.ts
let browserClientInstance: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (browserClientInstance) {
    return browserClientInstance
  }
  
  browserClientInstance = createClient<Database>(...)
  return browserClientInstance
}
```

Key features:
- ✅ Single global singleton for browser/client-side
- ✅ Consistent storage key (`fulqrun-auth`)
- ✅ Proper error handling and fallbacks
- ✅ Support for server-side clients (not singleton)
- ✅ Mock client for unconfigured environments

### 2. Updated All Client Files

**`src/lib/auth-unified.ts`**
```typescript
// Before: Created its own singleton
private static clientInstance: ReturnType<typeof createClient> | null = null

// After: Uses global singleton
static getClient() {
  return getSupabaseBrowserClient()
}
```

**`src/lib/supabase.ts`**
```typescript
// Before: Created its own singleton
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

// After: Re-exports global singleton
export const supabase = getSupabaseBrowserClient()
```

**`src/lib/supabase-client.ts`**
```typescript
// Before: Created its own singleton
let globalClient: ReturnType<typeof createBrowserClient> | null = null

// After: Delegates to global singleton
export function getSupabaseClient() {
  return getSupabaseBrowserClient()
}
```

### 3. Removed Duplicate Files

Deleted duplicate files that were creating additional instances:
- ❌ `src/lib/auth 2` (deleted)
- ❌ `src/lib/supabase 2.ts` (deleted)

## Benefits

✅ **Single GoTrueClient Instance** - Only one auth client per browser context  
✅ **Consistent Auth State** - All components share the same auth state  
✅ **No Warning Messages** - Clean console, no more GoTrueClient warnings  
✅ **Better Performance** - Less memory usage, fewer auth listeners  
✅ **Backward Compatible** - All existing imports still work  
✅ **Easier Debugging** - Single source of truth for auth state  

## Migration Guide

### For New Code

Use the new singleton directly:

```typescript
import { getSupabaseBrowserClient } from '@/lib/supabase-singleton'

const supabase = getSupabaseBrowserClient()
const { data } = await supabase.from('users').select('*')
```

### For Existing Code

**No changes needed!** All existing imports work:

```typescript
// These all use the same singleton now:
import { supabase } from '@/lib/supabase'
import { getSupabaseClient } from '@/lib/supabase-client'
import { AuthService } from '@/lib/auth-unified'

const client1 = supabase
const client2 = getSupabaseClient()
const client3 = AuthService.getClient()

// client1 === client2 === client3 ✅
```

### Server-Side Code

For API routes and server components, use the server client:

```typescript
import { createSupabaseServerClient } from '@/lib/supabase-singleton'
import { cookies } from 'next/headers'

// In API route or server component
const cookieStore = cookies()
const supabase = createSupabaseServerClient({
  get: (name) => cookieStore.get(name),
  set: (name, value, options) => cookieStore.set({ name, value, ...options }),
  remove: (name, options) => cookieStore.set({ name, value: '', ...options })
})
```

Or use the AuthService helper:

```typescript
import { AuthService } from '@/lib/auth-unified'

// Automatically handles server context
const supabase = AuthService.getServerClient()
```

## Testing

### Verify Single Instance

Open browser console and check:

```javascript
// Should only see ONE initialization message
// "✅ Supabase browser client initialized (singleton)"
```

### Verify No Warnings

Navigate through the app, especially:
- Login/logout flows
- Sales Performance page
- Any page using auth

**Expected:** No "Multiple GoTrueClient instances" warnings

### Verify Auth Works

- ✅ Login works
- ✅ Logout works  
- ✅ Session persists across page reloads
- ✅ Protected routes work correctly
- ✅ API calls include auth headers

## Technical Details

### Storage Key

All auth state is now stored under a consistent key:

```typescript
{
  auth: {
    storageKey: 'fulqrun-auth',  // Consistent across all instances
    ...
  }
}
```

### Client vs Server

- **Browser Client**: Single global singleton, lives for entire browser session
- **Server Client**: Created per-request, uses cookies for auth context

### Reset Functionality

For testing or after logout:

```typescript
import { resetSupabaseBrowserClient } from '@/lib/supabase-singleton'

// Force create a new client (e.g., after logout)
resetSupabaseBrowserClient()
```

## Files Modified

### Created
- ✅ `src/lib/supabase-singleton.ts` - Global singleton implementation

### Modified
- ✅ `src/lib/auth-unified.ts` - Now uses global singleton
- ✅ `src/lib/supabase.ts` - Re-exports global singleton
- ✅ `src/lib/supabase-client.ts` - Delegates to global singleton

### Deleted
- ❌ `src/lib/auth 2` - Duplicate file
- ❌ `src/lib/supabase 2.ts` - Duplicate file

## Troubleshooting

### Still Seeing Multiple Instance Warnings?

1. Clear browser cache and localStorage:
   ```javascript
   localStorage.clear()
   location.reload()
   ```

2. Check for direct `createClient` imports:
   ```bash
   # Search for problematic imports
   grep -r "import.*createClient.*@supabase" src/
   ```

3. Restart development server:
   ```bash
   npm run dev
   ```

### Auth Not Working?

1. Check browser console for initialization message
2. Verify Supabase environment variables are set
3. Check localStorage for auth tokens:
   ```javascript
   localStorage.getItem('fulqrun-auth.access-token')
   ```

### Session Lost on Reload?

1. Verify cookies are enabled in browser
2. Check `persistSession: true` in client config
3. Verify storage is working:
   ```javascript
   window.localStorage // Should not be null/undefined
   ```

## Related Issues

- [Runtime Issues Fixed](./RUNTIME_FIXES.md)
- [Database Relationship Fixes](./fix-runtime-issues.sql)

---

**Status:** ✅ Fixed and Tested  
**Date:** September 30, 2025  
**Impact:** All client-side Supabase usage  
**Breaking Changes:** None (backward compatible)
