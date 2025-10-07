#!/bin/bash

# =============================================================================
# Apply Migration 036 - Populate KPI Definitions
# =============================================================================
# This script helps you apply the comprehensive KPI definitions to your Supabase database
# =============================================================================

echo "📊 Applying Migration 036: Populate KPI Definitions"
echo "=================================================="
echo ""

# Copy migration to clipboard
cat supabase/migrations/036_populate_kpi_definitions.sql | pbcopy

echo "✅ KPI Definitions SQL copied to clipboard!"
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
echo "   ✓ Core Sales KPIs (10 metrics) inserted"
echo "   ✓ Pharmaceutical KPIs (8 metrics) inserted"
echo "   ✓ MEDDPICC KPIs (9 metrics) inserted"
echo "   ✓ Enterprise Analytics KPIs (6 metrics) inserted"
echo "   ✓ Dashboard Widget KPIs (16 metrics) inserted"
echo "   ✓ Additional Specialized KPIs (5 metrics) inserted"
echo ""
echo "6. Verify by running the verification query at the end"
echo ""
echo "=================================================="
echo "🔍 Migration File: supabase/migrations/036_populate_kpi_definitions.sql"
echo ""
echo "📊 Total KPIs to be added: 54+ comprehensive metrics"
echo ""

# Also create a verification script
echo "🔍 Creating verification script..."
cat > verify-kpi-definitions.sql << 'EOF'
-- Verification Query for KPI Definitions
-- Run this after applying the migration to verify all KPIs were added

-- Count total KPIs by category
SELECT 
    CASE 
        WHEN kpi_name IN ('win_rate', 'revenue_growth', 'avg_deal_size', 'sales_cycle_length', 'lead_conversion_rate', 'cac', 'quota_attainment', 'clv', 'pipeline_coverage', 'activities_per_rep') THEN 'Core Sales KPIs'
        WHEN kpi_name IN ('trx', 'nrx', 'market_share', 'growth_percentage', 'reach', 'frequency', 'call_effectiveness', 'sample_to_script_ratio', 'formulary_access', 'sample_effectiveness') THEN 'Pharmaceutical KPIs'
        WHEN kpi_name LIKE 'meddpicc_%' THEN 'MEDDPICC KPIs'
        WHEN kpi_name LIKE 'enterprise_%' THEN 'Enterprise Analytics KPIs'
        WHEN kpi_name LIKE 'chart_%' OR kpi_name LIKE 'data_%' OR kpi_name LIKE 'metric_%' OR kpi_name LIKE 'content_%' THEN 'Dashboard Widget KPIs'
        ELSE 'Other KPIs'
    END as category,
    COUNT(*) as count
FROM kpi_definitions 
GROUP BY 
    CASE 
        WHEN kpi_name IN ('win_rate', 'revenue_growth', 'avg_deal_size', 'sales_cycle_length', 'lead_conversion_rate', 'cac', 'quota_attainment', 'clv', 'pipeline_coverage', 'activities_per_rep') THEN 'Core Sales KPIs'
        WHEN kpi_name IN ('trx', 'nrx', 'market_share', 'growth_percentage', 'reach', 'frequency', 'call_effectiveness', 'sample_to_script_ratio', 'formulary_access', 'sample_effectiveness') THEN 'Pharmaceutical KPIs'
        WHEN kpi_name LIKE 'meddpicc_%' THEN 'MEDDPICC KPIs'
        WHEN kpi_name LIKE 'enterprise_%' THEN 'Enterprise Analytics KPIs'
        WHEN kpi_name LIKE 'chart_%' OR kpi_name LIKE 'data_%' OR kpi_name LIKE 'metric_%' OR kpi_name LIKE 'content_%' THEN 'Dashboard Widget KPIs'
        ELSE 'Other KPIs'
    END
ORDER BY count DESC;

-- Show sample KPI definitions
SELECT 
    kpi_name,
    display_name,
    description,
    calculation_method,
    array_length(data_sources, 1) as data_source_count,
    array_length(dimensions, 1) as dimension_count,
    is_active
FROM kpi_definitions 
ORDER BY kpi_name
LIMIT 10;
EOF

echo "✅ Verification script created: verify-kpi-definitions.sql"
echo ""
echo "🎯 Expected Results:"
echo "   - Core Sales KPIs: 10 metrics"
echo "   - Pharmaceutical KPIs: 8 metrics"  
echo "   - MEDDPICC KPIs: 9 metrics"
echo "   - Enterprise Analytics KPIs: 6 metrics"
echo "   - Dashboard Widget KPIs: 16 metrics"
echo "   - Additional Specialized KPIs: 5 metrics"
echo "   - Total: 54+ comprehensive KPIs"
echo ""
echo "🚀 Ready to apply! The migration is in your clipboard."
