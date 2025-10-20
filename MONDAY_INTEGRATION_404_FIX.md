# Monday.com Integration 404 Error Resolution

## Problem

After implementing the Monday.com GraphQL integration with all API routes and UI components, the routes were **compiling successfully** but returning **404 errors** at runtime:

```
✓ Compiled /api/integrations/monday/connection in 375ms (2517 modules)
GET /api/integrations/monday/connection 404 in 879ms
```

This affected all Monday.com API routes:
- `/api/integrations/monday/connection` (GET, POST, DELETE)
- `/api/integrations/monday/boards` (GET, POST)
- `/api/integrations/monday/items` (GET, POST, PUT, DELETE)
- `/api/integrations/monday/webhook` (POST, DELETE)

## Root Cause

**Next.js 15.5.4 dynamic routing requirements:**

Next.js 15 introduced stricter requirements for API routes that use:
- Async server-side operations (`AuthService.getServerClient()`)
- Dynamic request handling (authentication, rate limiting)
- Database queries with RLS policies

Without explicit runtime configuration, Next.js attempts to statically optimize these routes during build time, which causes them to fail at runtime with 404 errors despite successful compilation.

## Solution

Added **runtime configuration exports** to all Monday.com API route files:

```typescript
// Force Node.js runtime (not Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

### Files Modified

1. `src/app/api/integrations/monday/connection/route.ts`
2. `src/app/api/integrations/monday/boards/route.ts`
3. `src/app/api/integrations/monday/items/route.ts`
4. `src/app/api/integrations/monday/webhook/route.ts`

### Why This Fixes the Issue

- **`runtime = 'nodejs'`**: Forces the route to run in Node.js runtime instead of Edge runtime. This is required for:
  - Complex authentication logic (`AuthService.getServerClient()`)
  - Supabase client operations with RLS
  - Full Node.js API access (not available in Edge)

- **`dynamic = 'force-dynamic'`**: Prevents static optimization and forces dynamic rendering. This ensures:
  - Routes are evaluated at request time, not build time
  - Authentication context is available
  - Request-specific data (headers, cookies) can be accessed
  - RLS policies are properly enforced

## Next.js 15 Best Practices

For any API route that uses:
- Authentication (`AuthService`, Supabase `auth.getUser()`)
- Request headers/cookies for auth
- Database queries with RLS
- Rate limiting per IP
- Any request-specific logic

**Always include:**

```typescript
export const runtime = 'nodejs';     // Use Node.js runtime
export const dynamic = 'force-dynamic'; // Force dynamic rendering
```

## Testing

After applying this fix and restarting the dev server:

1. Clear .next cache: `rm -rf .next`
2. Restart server: `npm run dev`
3. Test endpoints:
   - `GET /api/integrations/monday/connection` should return 401 (auth required) or 200 (if authenticated)
   - No more 404 errors

## Related Documentation

- [Next.js 15 Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [Runtime Options](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)
- [Dynamic Rendering](https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-rendering)

## Date
October 15, 2025
