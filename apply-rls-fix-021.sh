#!/bin/bash

# =============================================================================
# Apply Migration 021 - Fix Metric Templates RLS
# =============================================================================
# This script helps you apply the RLS fix to your Supabase database
# =============================================================================

echo "🔧 Applying Migration 021: Fix Metric Templates RLS Policies"
echo "============================================================="
echo ""

# Copy migration to clipboard
cat supabase/migrations/021_fix_metric_templates_rls.sql | pbcopy

echo "✅ Migration SQL copied to clipboard!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Open Supabase Dashboard:"
echo "   https://app.supabase.com"
echo ""
echo "2. Go to SQL Editor (left sidebar)"
echo ""
echo "3. Create a new query and paste (Cmd+V) the migration"
echo ""
echo "4. Click 'Run' to apply the migration"
echo ""
echo "5. You should see success messages confirming:"
echo "   ✓ Policies dropped"
echo "   ✓ New policies created"
echo ""
echo "6. Test by refreshing your app - the 403 error should be gone!"
echo ""
echo "============================================================="
echo "🔍 Migration File: supabase/migrations/021_fix_metric_templates_rls.sql"
echo ""
