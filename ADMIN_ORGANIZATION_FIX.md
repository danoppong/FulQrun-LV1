# Admin Organization Fix

## Issue

The admin user (ID: `4cfd1cdb-9b10-4482-82c3-7c502b9ace10`) is missing the `organization_id` in the `user_profiles` table, causing API calls to return **404 "Organization not found"**.

## Error Details

```
GET http://localhost:3001/api/dashboard/salesman-kpis?... 404 (Not Found)
KPI API Error: 404 {"error":"Organization not found"}
```

The API route checks for `organization_id` and returns 404 if it's null:

```typescript
if (!profile?.organization_id) {
  return NextResponse.json(
    { error: 'Organization not found' },
    { status: 404 }
  )
}
```

## Root Cause

The `user_profiles` table has a row for the admin user but the `organization_id` column is NULL. The dashboard context shows the organization ID exists:

```
Dashboard context initialized: {
  userId: '4cfd1cdb-9b10-4482-82c3-7c502b9ace10', 
  organizationId: '9ed327f2-c46a-445a-952b-70addaee33b8', 
  role: 'admin'
}
```

But this organization_id is not properly saved in the `user_profiles` table in Supabase.

## Solution

### Option 1: Run SQL Script (Recommended)

Run the provided SQL script in your Supabase SQL Editor:

```bash
# The script is in: fix-admin-organization.sql
```

Or manually run this SQL:

```sql
-- Update admin user with organization_id
UPDATE user_profiles
SET organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8'
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';

-- Verify
SELECT id, email, role, organization_id 
FROM user_profiles 
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';
```

### Option 2: Use Supabase Dashboard

1. Go to your Supabase dashboard
2. Navigate to **Table Editor** → **user_profiles**
3. Find the row with `id = 4cfd1cdb-9b10-4482-82c3-7c502b9ace10`
4. Edit the `organization_id` column
5. Set it to: `9ed327f2-c46a-445a-952b-70addaee33b8`
6. Save changes

### Option 3: Create Missing Organization

If the organization doesn't exist in the database, create it:

```sql
-- Insert organization if it doesn't exist
INSERT INTO organizations (id, name, created_at, updated_at)
VALUES (
  '9ed327f2-c46a-445a-952b-70addaee33b8',
  'Default Organization',  -- Change this to your org name
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Then update user profile
UPDATE user_profiles
SET organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8'
WHERE id = '4cfd1cdb-9b10-4482-82c3-7c502b9ace10';
```

## Additional Note: Port 3001

The dev server is running on **port 3001** (not 3000) because port 3000 is already in use:

```
⚠ Port 3000 is in use by process 33281, using available port 3001 instead.
```

This is normal behavior and not an error. The browser correctly makes API calls to port 3001.

## Testing After Fix

1. Run the SQL update
2. Hard refresh the browser (`Cmd+Shift+R` or `Ctrl+Shift+R`)
3. Navigate to `/dashboard`
4. Select "SALESMAN" from the role dropdown
5. The API should now return **200 OK** instead of 404
6. KPI cards should display data (or zeros if no sales data exists)

## Expected Result

After fixing the organization_id:

```
GET /api/dashboard/salesman-kpis?... 200 OK
```

Response:
```json
{
  "salesmanId": "4cfd1cdb-9b10-4482-82c3-7c502b9ace10",
  "organizationId": "9ed327f2-c46a-445a-952b-70addaee33b8",
  "funnelHealth": { ... },
  "winRate": { ... },
  ...
}
```

## Prevention

To prevent this issue in the future, ensure:

1. **User Registration**: When creating users, always set `organization_id`
2. **RLS Policies**: Verify RLS policies allow reading organization_id
3. **Seed Data**: Use proper seed scripts that include organization relationships
4. **Validation**: Add database constraints to ensure organization_id is not null for active users

---

**Status:** Database update required  
**Impact:** High - Blocks admin access to salesman dashboard  
**Urgency:** Immediate - Simple SQL update resolves issue  
