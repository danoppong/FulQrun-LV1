-- Comprehensive KPI Definitions Population
-- This migration populates the kpi_definitions table with all identified KPIs
-- from the system scan including core sales, pharmaceutical, MEDDPICC, and enterprise metrics

-- =============================================================================
-- CORE SALES PERFORMANCE KPIs (10 Primary Metrics)
-- =============================================================================

-- Performance & Outcome Metrics
INSERT INTO kpi_definitions (
    organization_id,
    kpi_name,
    display_name,
    description,
    formula,
    calculation_method,
    data_sources,
    dimensions,
    thresholds,
    industry_benchmarks,
    is_active
) VALUES 
-- 1. Win Rate
(
    (SELECT id FROM organizations LIMIT 1), -- Default organization
    'win_rate',
    'Win Rate',
    'Percentage of qualified opportunities that result in closed deals',
    '(Number of deals won ÷ Total opportunities) × 100',
    'sql_function',
    ARRAY['opportunities', 'deals'],
    ARRAY['territory', 'rep', 'product', 'time'],
    '{"critical": 15, "warning": 25, "target": 35}'::jsonb,
    '{"pharmaceutical": 35, "technology": 30, "manufacturing": 25}'::jsonb,
    true
),

-- 2. Sales Revenue Growth
(
    (SELECT id FROM organizations LIMIT 1),
    'revenue_growth',
    'Sales Revenue Growth',
    'Increase in sales income over specific time periods',
    '[(Current Period Sales - Previous Period Sales) ÷ Previous Period Sales] × 100',
    'sql_function',
    ARRAY['opportunities', 'deals', 'revenue'],
    ARRAY['territory', 'rep', 'product', 'time'],
    '{"critical": 2, "warning": 8, "target": 15}'::jsonb,
    '{"excellent": 25, "good": 15, "average": 8, "below_average": 2}'::jsonb,
    true
),

-- 3. Average Deal Size
(
    (SELECT id FROM organizations LIMIT 1),
    'avg_deal_size',
    'Average Deal Size',
    'Mean revenue value of closed deals',
    'Total Revenue Generated ÷ Total Number of Won Deals',
    'sql_function',
    ARRAY['opportunities', 'deals'],
    ARRAY['territory', 'rep', 'product', 'time'],
    '{"critical": 10000, "warning": 25000, "target": 50000}'::jsonb,
    '{"industry_specific": true}'::jsonb,
    true
),

-- 4. Sales Cycle Length
(
    (SELECT id FROM organizations LIMIT 1),
    'sales_cycle_length',
    'Sales Cycle Length',
    'Average time from initial contact to deal closure',
    'Total Days from First Contact to Close ÷ Number of Deals',
    'sql_function',
    ARRAY['opportunities', 'activities'],
    ARRAY['territory', 'rep', 'product', 'time'],
    '{"critical": 90, "warning": 60, "target": 45}'::jsonb,
    '{"excellent": 45, "good": 60, "average": 90, "below_average": 120}'::jsonb,
    true
),

-- 5. Lead Conversion Rate
(
    (SELECT id FROM organizations LIMIT 1),
    'lead_conversion_rate',
    'Lead Conversion Rate',
    'Percentage of leads that convert to qualified opportunities',
    '(Number of Qualified Opportunities ÷ Total Leads) × 100',
    'sql_function',
    ARRAY['leads', 'opportunities'],
    ARRAY['territory', 'rep', 'source', 'time'],
    '{"critical": 2, "warning": 4, "target": 5}'::jsonb,
    '{"pharmaceutical": 5, "technology": 3, "manufacturing": 4}'::jsonb,
    true
),

-- 6. Customer Acquisition Cost (CAC)
(
    (SELECT id FROM organizations LIMIT 1),
    'cac',
    'Customer Acquisition Cost',
    'Total cost of acquiring a new customer',
    'Total Sales and Marketing Expenses ÷ Number of New Customers Acquired',
    'sql_function',
    ARRAY['customers', 'expenses', 'marketing'],
    ARRAY['territory', 'channel', 'time'],
    '{"critical": 1000, "warning": 500, "target": 300}'::jsonb,
    '{"cac_clv_ratio": 3}'::jsonb,
    true
),

-- 7. Quota Attainment
(
    (SELECT id FROM organizations LIMIT 1),
    'quota_attainment',
    'Quota Attainment',
    'Percentage of sales representatives meeting or exceeding targets',
    '(Number of Reps Achieving Quota ÷ Total Number of Reps) × 100',
    'sql_function',
    ARRAY['users', 'quotas', 'performance'],
    ARRAY['territory', 'rep', 'time'],
    '{"critical": 40, "warning": 60, "target": 80}'::jsonb,
    '{"high_performing": 80, "average": 60, "below_average": 40}'::jsonb,
    true
),

-- 8. Customer Lifetime Value (CLV)
(
    (SELECT id FROM organizations LIMIT 1),
    'clv',
    'Customer Lifetime Value',
    'Total revenue expected from a customer throughout the business relationship',
    'Average Purchase Value × Purchase Frequency × Customer Lifespan',
    'sql_function',
    ARRAY['customers', 'purchases', 'revenue'],
    ARRAY['territory', 'product', 'time'],
    '{"critical": 1000, "warning": 3000, "target": 5000}'::jsonb,
    '{"industry_specific": true}'::jsonb,
    true
),

-- 9. Pipeline Coverage Ratio
(
    (SELECT id FROM organizations LIMIT 1),
    'pipeline_coverage',
    'Pipeline Coverage Ratio',
    'Total value of opportunities in pipeline compared to quota',
    'Total Pipeline Value ÷ Sales Quota',
    'sql_function',
    ARRAY['opportunities', 'quotas'],
    ARRAY['territory', 'rep', 'time'],
    '{"critical": 2, "warning": 3, "target": 4}'::jsonb,
    '{"high_performing": 4, "average": 3, "below_average": 2}'::jsonb,
    true
),

-- 10. Sales Activities per Rep
(
    (SELECT id FROM organizations LIMIT 1),
    'activities_per_rep',
    'Sales Activities per Rep',
    'Volume of sales-related actions completed by representatives',
    'Total Activities ÷ Number of Reps ÷ Days in Period',
    'sql_function',
    ARRAY['activities', 'users'],
    ARRAY['territory', 'rep', 'activity_type', 'time'],
    '{"critical": 5, "warning": 10, "target": 15}'::jsonb,
    '{"top_performers": 15, "average": 10, "below_average": 5}'::jsonb,
    true
);

-- =============================================================================
-- PHARMACEUTICAL BI KPIs (8 Specialized Metrics)
-- =============================================================================

INSERT INTO kpi_definitions (
    organization_id,
    kpi_name,
    display_name,
    description,
    formula,
    calculation_method,
    data_sources,
    dimensions,
    thresholds,
    industry_benchmarks,
    is_active
) VALUES 
-- 1. TRx (Total Prescriptions)
(
    (SELECT id FROM organizations LIMIT 1),
    'trx',
    'Total Prescriptions (TRx)',
    'Total prescription volume for a product',
    'SUM(prescription_events.volume) WHERE prescription_type IN (''new'', ''refill'')',
    'sql_function',
    ARRAY['prescription_events', 'healthcare_providers'],
    ARRAY['territory', 'rep', 'product', 'hcp', 'time'],
    '{"critical": 100, "warning": 500, "target": 1000}'::jsonb,
    '{"pharmaceutical": true}'::jsonb,
    true
),

-- 2. NRx (New Prescriptions)
(
    (SELECT id FROM organizations LIMIT 1),
    'nrx',
    'New Prescriptions (NRx)',
    'New prescription volume (excluding refills)',
    'SUM(prescription_events.volume) WHERE prescription_type = ''new''',
    'sql_function',
    ARRAY['prescription_events', 'healthcare_providers'],
    ARRAY['territory', 'rep', 'product', 'hcp', 'time'],
    '{"critical": 50, "warning": 200, "target": 500}'::jsonb,
    '{"pharmaceutical": true}'::jsonb,
    true
),

-- 3. Market Share
(
    (SELECT id FROM organizations LIMIT 1),
    'market_share',
    'Market Share',
    'Product''s share of total market prescriptions',
    '(Product TRx ÷ Total Market TRx) × 100',
    'sql_function',
    ARRAY['prescription_events', 'market_data'],
    ARRAY['territory', 'product', 'time'],
    '{"critical": 5, "warning": 10, "target": 20}'::jsonb,
    '{"pharmaceutical": true}'::jsonb,
    true
),

-- 4. Growth Percentage
(
    (SELECT id FROM organizations LIMIT 1),
    'growth_percentage',
    'Growth Percentage',
    'Period-over-period prescription growth',
    '[(Current Period TRx - Previous Period TRx) ÷ Previous Period TRx] × 100',
    'sql_function',
    ARRAY['prescription_events'],
    ARRAY['territory', 'rep', 'product', 'time'],
    '{"critical": -10, "warning": 5, "target": 15}'::jsonb,
    '{"pharmaceutical": true}'::jsonb,
    true
),

-- 5. Reach
(
    (SELECT id FROM organizations LIMIT 1),
    'reach',
    'HCP Reach',
    'Number of unique HCPs contacted',
    'COUNT(DISTINCT pharmaceutical_calls.hcp_id)',
    'sql_function',
    ARRAY['pharmaceutical_calls', 'healthcare_providers'],
    ARRAY['territory', 'rep', 'time'],
    '{"critical": 50, "warning": 100, "target": 200}'::jsonb,
    '{"pharmaceutical": true}'::jsonb,
    true
),

-- 6. Frequency
(
    (SELECT id FROM organizations LIMIT 1),
    'frequency',
    'Call Frequency',
    'Average calls per HCP per period',
    'COUNT(pharmaceutical_calls.id) ÷ COUNT(DISTINCT pharmaceutical_calls.hcp_id)',
    'sql_function',
    ARRAY['pharmaceutical_calls', 'healthcare_providers'],
    ARRAY['territory', 'rep', 'hcp', 'time'],
    '{"critical": 1, "warning": 2, "target": 4}'::jsonb,
    '{"pharmaceutical": true}'::jsonb,
    true
),

-- 7. Call Effectiveness
(
    (SELECT id FROM organizations LIMIT 1),
    'call_effectiveness',
    'Call Effectiveness',
    'Impact of calls on prescription behavior',
    '(Prescriptions After Call - Prescriptions Before Call) ÷ Prescriptions Before Call',
    'sql_function',
    ARRAY['pharmaceutical_calls', 'prescription_events'],
    ARRAY['territory', 'rep', 'hcp', 'time'],
    '{"critical": 0, "warning": 10, "target": 25}'::jsonb,
    '{"pharmaceutical": true}'::jsonb,
    true
),

-- 8. Sample-to-Script Ratio
(
    (SELECT id FROM organizations LIMIT 1),
    'sample_to_script_ratio',
    'Sample-to-Script Ratio',
    'Conversion rate from samples to prescriptions',
    '(Prescriptions After Sample ÷ Samples Distributed) × 100',
    'sql_function',
    ARRAY['sample_distributions', 'prescription_events'],
    ARRAY['territory', 'rep', 'hcp', 'time'],
    '{"critical": 5, "warning": 10, "target": 20}'::jsonb,
    '{"pharmaceutical": true}'::jsonb,
    true
);

-- =============================================================================
-- MEDDPICC QUALIFICATION KPIs (9 Pillars)
-- =============================================================================

INSERT INTO kpi_definitions (
    organization_id,
    kpi_name,
    display_name,
    description,
    formula,
    calculation_method,
    data_sources,
    dimensions,
    thresholds,
    industry_benchmarks,
    is_active
) VALUES 
-- 1. Metrics
(
    (SELECT id FROM organizations LIMIT 1),
    'meddpicc_metrics',
    'MEDDPICC Metrics',
    'Revenue impact, timeline, budget allocation assessment',
    'SUM(metrics_score) ÷ COUNT(metrics_questions) × 100',
    'api_calculation',
    ARRAY['opportunities', 'meddpicc_assessments'],
    ARRAY['opportunity', 'rep', 'time'],
    '{"critical": 40, "warning": 60, "target": 80}'::jsonb,
    '{"qualification_framework": true}'::jsonb,
    true
),

-- 2. Economic Buyer
(
    (SELECT id FROM organizations LIMIT 1),
    'meddpicc_economic_buyer',
    'MEDDPICC Economic Buyer',
    'Decision-making authority and budget control assessment',
    'SUM(economic_buyer_score) ÷ COUNT(economic_buyer_questions) × 100',
    'api_calculation',
    ARRAY['opportunities', 'meddpicc_assessments'],
    ARRAY['opportunity', 'rep', 'time'],
    '{"critical": 40, "warning": 60, "target": 80}'::jsonb,
    '{"qualification_framework": true}'::jsonb,
    true
),

-- 3. Decision Criteria
(
    (SELECT id FROM organizations LIMIT 1),
    'meddpicc_decision_criteria',
    'MEDDPICC Decision Criteria',
    'Evaluation criteria and success metrics assessment',
    'SUM(decision_criteria_score) ÷ COUNT(decision_criteria_questions) × 100',
    'api_calculation',
    ARRAY['opportunities', 'meddpicc_assessments'],
    ARRAY['opportunity', 'rep', 'time'],
    '{"critical": 40, "warning": 60, "target": 80}'::jsonb,
    '{"qualification_framework": true}'::jsonb,
    true
),

-- 4. Decision Process
(
    (SELECT id FROM organizations LIMIT 1),
    'meddpicc_decision_process',
    'MEDDPICC Decision Process',
    'Steps, timeline, and approval workflow assessment',
    'SUM(decision_process_score) ÷ COUNT(decision_process_questions) × 100',
    'api_calculation',
    ARRAY['opportunities', 'meddpicc_assessments'],
    ARRAY['opportunity', 'rep', 'time'],
    '{"critical": 40, "warning": 60, "target": 80}'::jsonb,
    '{"qualification_framework": true}'::jsonb,
    true
),

-- 5. Paper Process
(
    (SELECT id FROM organizations LIMIT 1),
    'meddpicc_paper_process',
    'MEDDPICC Paper Process',
    'Documentation and approval requirements assessment',
    'SUM(paper_process_score) ÷ COUNT(paper_process_questions) × 100',
    'api_calculation',
    ARRAY['opportunities', 'meddpicc_assessments'],
    ARRAY['opportunity', 'rep', 'time'],
    '{"critical": 40, "warning": 60, "target": 80}'::jsonb,
    '{"qualification_framework": true}'::jsonb,
    true
),

-- 6. Identify Pain
(
    (SELECT id FROM organizations LIMIT 1),
    'meddpicc_identify_pain',
    'MEDDPICC Identify Pain',
    'Current challenges and pain points assessment',
    'SUM(identify_pain_score) ÷ COUNT(identify_pain_questions) × 100',
    'api_calculation',
    ARRAY['opportunities', 'meddpicc_assessments'],
    ARRAY['opportunity', 'rep', 'time'],
    '{"critical": 40, "warning": 60, "target": 80}'::jsonb,
    '{"qualification_framework": true}'::jsonb,
    true
),

-- 7. Implicate Pain
(
    (SELECT id FROM organizations LIMIT 1),
    'meddpicc_implicate_pain',
    'MEDDPICC Implicate Pain',
    'Consequences of not addressing pain assessment',
    'SUM(implicate_pain_score) ÷ COUNT(implicate_pain_questions) × 100',
    'api_calculation',
    ARRAY['opportunities', 'meddpicc_assessments'],
    ARRAY['opportunity', 'rep', 'time'],
    '{"critical": 40, "warning": 60, "target": 80}'::jsonb,
    '{"qualification_framework": true}'::jsonb,
    true
),

-- 8. Champion
(
    (SELECT id FROM organizations LIMIT 1),
    'meddpicc_champion',
    'MEDDPICC Champion',
    'Internal advocate and supporter assessment',
    'SUM(champion_score) ÷ COUNT(champion_questions) × 100',
    'api_calculation',
    ARRAY['opportunities', 'meddpicc_assessments'],
    ARRAY['opportunity', 'rep', 'time'],
    '{"critical": 40, "warning": 60, "target": 80}'::jsonb,
    '{"qualification_framework": true}'::jsonb,
    true
),

-- 9. Competition
(
    (SELECT id FROM organizations LIMIT 1),
    'meddpicc_competition',
    'MEDDPICC Competition',
    'Competitive landscape and positioning assessment',
    'SUM(competition_score) ÷ COUNT(competition_questions) × 100',
    'api_calculation',
    ARRAY['opportunities', 'meddpicc_assessments'],
    ARRAY['opportunity', 'rep', 'time'],
    '{"critical": 40, "warning": 60, "target": 80}'::jsonb,
    '{"qualification_framework": true}'::jsonb,
    true
);

-- =============================================================================
-- ENTERPRISE ANALYTICS KPIs (6 Categories)
-- =============================================================================

INSERT INTO kpi_definitions (
    organization_id,
    kpi_name,
    display_name,
    description,
    formula,
    calculation_method,
    data_sources,
    dimensions,
    thresholds,
    industry_benchmarks,
    is_active
) VALUES 
-- 1. Revenue Metrics
(
    (SELECT id FROM organizations LIMIT 1),
    'enterprise_revenue',
    'Enterprise Revenue',
    'Comprehensive revenue tracking and analysis',
    'SUM(opportunities.value) WHERE status = ''closed_won''',
    'sql_function',
    ARRAY['opportunities', 'deals', 'revenue'],
    ARRAY['territory', 'rep', 'product', 'time'],
    '{"critical": 100000, "warning": 500000, "target": 1000000}'::jsonb,
    '{"enterprise": true}'::jsonb,
    true
),

-- 2. Deals Metrics
(
    (SELECT id FROM organizations LIMIT 1),
    'enterprise_deals',
    'Enterprise Deals',
    'Deal count, value, and pipeline health analysis',
    'COUNT(opportunities.id) WHERE status IN (''prospecting'', ''qualification'', ''proposal'', ''negotiation'')',
    'sql_function',
    ARRAY['opportunities', 'deals'],
    ARRAY['territory', 'rep', 'stage', 'time'],
    '{"critical": 10, "warning": 25, "target": 50}'::jsonb,
    '{"enterprise": true}'::jsonb,
    true
),

-- 3. Conversion Metrics
(
    (SELECT id FROM organizations LIMIT 1),
    'enterprise_conversion',
    'Enterprise Conversion',
    'Lead conversion and opportunity progression analysis',
    '(Qualified Opportunities ÷ Total Leads) × 100',
    'sql_function',
    ARRAY['leads', 'opportunities'],
    ARRAY['territory', 'rep', 'source', 'time'],
    '{"critical": 5, "warning": 10, "target": 20}'::jsonb,
    '{"enterprise": true}'::jsonb,
    true
),

-- 4. Activity Metrics
(
    (SELECT id FROM organizations LIMIT 1),
    'enterprise_activity',
    'Enterprise Activity',
    'Sales activities and engagement rates analysis',
    'COUNT(activities.id) ÷ COUNT(DISTINCT users.id) ÷ Days in Period',
    'sql_function',
    ARRAY['activities', 'users'],
    ARRAY['territory', 'rep', 'activity_type', 'time'],
    '{"critical": 5, "warning": 10, "target": 15}'::jsonb,
    '{"enterprise": true}'::jsonb,
    true
),

-- 5. Performance Metrics
(
    (SELECT id FROM organizations LIMIT 1),
    'enterprise_performance',
    'Enterprise Performance',
    'Individual and team performance analysis',
    'AVG(quota_attainment_percentage)',
    'sql_function',
    ARRAY['users', 'quotas', 'performance'],
    ARRAY['territory', 'rep', 'time'],
    '{"critical": 60, "warning": 80, "target": 100}'::jsonb,
    '{"enterprise": true}'::jsonb,
    true
),

-- 6. Custom Metrics
(
    (SELECT id FROM organizations LIMIT 1),
    'enterprise_custom',
    'Enterprise Custom Metrics',
    'Organization-specific KPIs and custom calculations',
    'Custom formula based on organization requirements',
    'manual',
    ARRAY['custom_data'],
    ARRAY['custom_dimensions'],
    '{"custom": true}'::jsonb,
    '{"enterprise": true}'::jsonb,
    true
);

-- =============================================================================
-- DASHBOARD BUILDER WIDGET KPIs (16 Widget Types)
-- =============================================================================

INSERT INTO kpi_definitions (
    organization_id,
    kpi_name,
    display_name,
    description,
    formula,
    calculation_method,
    data_sources,
    dimensions,
    thresholds,
    industry_benchmarks,
    is_active
) VALUES 
-- Chart Widgets
(
    (SELECT id FROM organizations LIMIT 1),
    'chart_line',
    'Line Chart Widget',
    'Time-series data visualization with trend analysis',
    'Data points over time with trend calculation',
    'api_calculation',
    ARRAY['time_series_data'],
    ARRAY['time', 'metric'],
    '{"custom": true}'::jsonb,
    '{"visualization": true}'::jsonb,
    true
),

(
    (SELECT id FROM organizations LIMIT 1),
    'chart_bar',
    'Bar Chart Widget',
    'Comparative data visualization',
    'Data comparison across categories',
    'api_calculation',
    ARRAY['comparative_data'],
    ARRAY['category', 'metric'],
    '{"custom": true}'::jsonb,
    '{"visualization": true}'::jsonb,
    true
),

(
    (SELECT id FROM organizations LIMIT 1),
    'chart_pie',
    'Pie Chart Widget',
    'Proportional data visualization',
    'Data distribution across segments',
    'api_calculation',
    ARRAY['distribution_data'],
    ARRAY['segment', 'percentage'],
    '{"custom": true}'::jsonb,
    '{"visualization": true}'::jsonb,
    true
),

-- Data Widgets
(
    (SELECT id FROM organizations LIMIT 1),
    'data_table',
    'Data Table Widget',
    'Tabular data display with sorting and filtering',
    'Structured data presentation',
    'api_calculation',
    ARRAY['tabular_data'],
    ARRAY['columns', 'rows'],
    '{"custom": true}'::jsonb,
    '{"visualization": true}'::jsonb,
    true
),

(
    (SELECT id FROM organizations LIMIT 1),
    'data_heatmap',
    'Heatmap Widget',
    'Data density and pattern visualization',
    'Data intensity mapping',
    'api_calculation',
    ARRAY['density_data'],
    ARRAY['x_axis', 'y_axis', 'intensity'],
    '{"custom": true}'::jsonb,
    '{"visualization": true}'::jsonb,
    true
),

-- Metric Widgets
(
    (SELECT id FROM organizations LIMIT 1),
    'metric_gauge',
    'Gauge Widget',
    'Performance indicator with target visualization',
    'Current value vs target with percentage',
    'api_calculation',
    ARRAY['performance_data'],
    ARRAY['current', 'target', 'percentage'],
    '{"custom": true}'::jsonb,
    '{"visualization": true}'::jsonb,
    true
),

(
    (SELECT id FROM organizations LIMIT 1),
    'metric_counter',
    'Counter Widget',
    'Animated numerical counter display',
    'Real-time numerical updates',
    'api_calculation',
    ARRAY['numerical_data'],
    ARRAY['value', 'change'],
    '{"custom": true}'::jsonb,
    '{"visualization": true}'::jsonb,
    true
),

-- Content Widgets
(
    (SELECT id FROM organizations LIMIT 1),
    'content_text',
    'Text Widget',
    'Rich text and markdown content display',
    'Formatted text content',
    'manual',
    ARRAY['text_content'],
    ARRAY['format', 'style'],
    '{"custom": true}'::jsonb,
    '{"content": true}'::jsonb,
    true
),

(
    (SELECT id FROM organizations LIMIT 1),
    'content_image',
    'Image Widget',
    'Image and media content display',
    'Media content presentation',
    'manual',
    ARRAY['media_content'],
    ARRAY['format', 'size'],
    '{"custom": true}'::jsonb,
    '{"content": true}'::jsonb,
    true
),

(
    (SELECT id FROM organizations LIMIT 1),
    'content_map',
    'Map Widget',
    'Geographic data visualization',
    'Location-based data mapping',
    'api_calculation',
    ARRAY['geographic_data'],
    ARRAY['latitude', 'longitude', 'data'],
    '{"custom": true}'::jsonb,
    '{"visualization": true}'::jsonb,
    true
),

(
    (SELECT id FROM organizations LIMIT 1),
    'content_calendar',
    'Calendar Widget',
    'Calendar and events display',
    'Date-based event visualization',
    'api_calculation',
    ARRAY['calendar_data'],
    ARRAY['date', 'event'],
    '{"custom": true}'::jsonb,
    '{"content": true}'::jsonb,
    true
);

-- =============================================================================
-- ADDITIONAL SPECIALIZED KPIs
-- =============================================================================

INSERT INTO kpi_definitions (
    organization_id,
    kpi_name,
    display_name,
    description,
    formula,
    calculation_method,
    data_sources,
    dimensions,
    thresholds,
    industry_benchmarks,
    is_active
) VALUES 
-- Formulary Access
(
    (SELECT id FROM organizations LIMIT 1),
    'formulary_access',
    'Formulary Access',
    'Percentage of HCPs with formulary access to products',
    '(HCPs with Formulary Access ÷ Total HCPs) × 100',
    'sql_function',
    ARRAY['healthcare_providers', 'formulary_data'],
    ARRAY['territory', 'rep', 'product', 'time'],
    '{"critical": 30, "warning": 50, "target": 70}'::jsonb,
    '{"pharmaceutical": true}'::jsonb,
    true
),

-- Sample Distribution Effectiveness
(
    (SELECT id FROM organizations LIMIT 1),
    'sample_effectiveness',
    'Sample Distribution Effectiveness',
    'Impact of sample distribution on prescription behavior',
    '(Prescriptions After Sample ÷ Samples Distributed) × 100',
    'sql_function',
    ARRAY['sample_distributions', 'prescription_events'],
    ARRAY['territory', 'rep', 'hcp', 'time'],
    '{"critical": 5, "warning": 10, "target": 20}'::jsonb,
    '{"pharmaceutical": true}'::jsonb,
    true
),

-- Overall MEDDPICC Score
(
    (SELECT id FROM organizations LIMIT 1),
    'meddpicc_overall_score',
    'Overall MEDDPICC Score',
    'Comprehensive qualification score across all pillars',
    'AVG(all_pillar_scores)',
    'api_calculation',
    ARRAY['opportunities', 'meddpicc_assessments'],
    ARRAY['opportunity', 'rep', 'time'],
    '{"critical": 40, "warning": 60, "target": 80}'::jsonb,
    '{"qualification_framework": true}'::jsonb,
    true
),

-- Territory Performance Index
(
    (SELECT id FROM organizations LIMIT 1),
    'territory_performance_index',
    'Territory Performance Index',
    'Comprehensive territory performance scoring',
    'Weighted average of all territory KPIs',
    'sql_function',
    ARRAY['territories', 'performance_metrics'],
    ARRAY['territory', 'time'],
    '{"critical": 40, "warning": 60, "target": 80}'::jsonb,
    '{"territory_management": true}'::jsonb,
    true
),

-- Rep Performance Score
(
    (SELECT id FROM organizations LIMIT 1),
    'rep_performance_score',
    'Rep Performance Score',
    'Individual sales representative performance scoring',
    'Weighted average of all rep KPIs',
    'sql_function',
    ARRAY['users', 'performance_metrics'],
    ARRAY['rep', 'time'],
    '{"critical": 40, "warning": 60, "target": 80}'::jsonb,
    '{"performance_management": true}'::jsonb,
    true
);

-- =============================================================================
-- UPDATE TRIGGERS AND INDEXES
-- =============================================================================

-- Create updated_at trigger for kpi_definitions
CREATE OR REPLACE FUNCTION update_kpi_definitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kpi_definitions_updated_at
    BEFORE UPDATE ON kpi_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_kpi_definitions_updated_at();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_kpi_name ON kpi_definitions(kpi_name);
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_calculation_method ON kpi_definitions(calculation_method);
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_is_active ON kpi_definitions(is_active);

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

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
