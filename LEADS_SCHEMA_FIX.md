# Leads Table Schema Fix

## Issue
The lead creation form was showing the error: "Could not find the 'company' column of 'leads' in the schema cache"

## Root Cause
There was a mismatch between the database schema and the application code:

1. **Database Schema**: The `leads` table had a column named `company_name`
2. **Application Code**: The TypeScript interface and form expected a column named `company`
3. **Missing Fields**: The TypeScript interface was missing several fields that exist in the database schema

## Solution Applied

### 1. Database Schema Fix
Created a comprehensive SQL migration script (`fix-leads-company-column.sql`) that:
- Renames `company_name` column to `company` (preserving existing data)
- Adds missing columns: `title`, `notes`, `assigned_to`
- Creates appropriate indexes for performance

### 2. TypeScript Interface Update
Updated `src/lib/supabase.ts` to include all missing fields:
- Added `title: string | null`
- Added `notes: string | null` 
- Added `assigned_to: string | null`

### 3. Migration Files
- Created `supabase/migrations/018_fix_leads_company_column.sql` for version control
- Created `fix-leads-company-column.sql` for immediate deployment

## Files Modified
- `src/lib/supabase.ts` - Updated Database interface
- `supabase/migrations/018_fix_leads_company_column.sql` - New migration
- `fix-leads-company-column.sql` - Deployment script

## Deployment Instructions

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `fix-leads-company-column.sql`
4. Execute the script

### Option 2: Supabase CLI (if available)
```bash
supabase db reset --linked
```

## Verification
After applying the migration:
1. The lead creation form should work without errors
2. All existing lead data should be preserved
3. The `company` field should be properly saved and loaded
4. Additional fields (`title`, `notes`, `assigned_to`) should be available for future use

## Testing Checklist
- [ ] Lead creation form loads without errors
- [ ] Company field accepts and saves data
- [ ] Existing leads display correctly
- [ ] Lead search includes company field
- [ ] Lead scoring works with company data
