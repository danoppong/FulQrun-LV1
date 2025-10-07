-- Fixed verification query for KPI definitions
-- This query counts KPIs by category without SQL syntax errors

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

-- Simple count query
SELECT COUNT(*) as total_kpis FROM kpi_definitions;

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
