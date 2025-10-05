-- Sample Pharmaceutical Data for Testing
-- This script inserts sample data to test the pharmaceutical BI dashboard

-- Insert sample pharmaceutical KPIs
INSERT INTO pharmaceutical_kpis (
  organization_id,
  kpi_name,
  kpi_definition,
  formula,
  grain,
  dimensions,
  thresholds,
  owner
) VALUES 
(
  (SELECT id FROM organizations LIMIT 1),
  'TRx',
  'Total prescriptions dispensed for a product/period',
  'Sum(Rx_count)',
  ARRAY['date', 'product', 'territory', 'hcp'],
  ARRAY['territory', 'rep', 'payer', 'channel', 'specialty'],
  '{"warning": "<90% of target", "critical": "<80% of target"}',
  'Sales Ops'
),
(
  (SELECT id FROM organizations LIMIT 1),
  'NRx',
  'New prescriptions written for a product/period',
  'Sum(New_Rx_count)',
  ARRAY['date', 'product', 'territory', 'hcp'],
  ARRAY['territory', 'rep', 'payer', 'channel', 'specialty'],
  '{"warning": "<85% of target", "critical": "<75% of target"}',
  'Sales Ops'
),
(
  (SELECT id FROM organizations LIMIT 1),
  'Market Share %',
  'Product Rx volume vs. category total',
  '(TRx / Category_TRx) * 100',
  ARRAY['date', 'product', 'territory'],
  ARRAY['rep', 'payer', 'specialty'],
  '{"warning": "<15%", "critical": "<10%"}',
  'Commercial'
);

-- Insert sample healthcare providers
INSERT INTO healthcare_providers (
  organization_id,
  hcp_id,
  name,
  specialty,
  practice_id,
  practice_name,
  territory_id,
  formulary_status,
  last_interaction_date,
  total_interactions,
  last_prescription_date,
  prescription_count
) VALUES 
(
  (SELECT id FROM organizations LIMIT 1),
  'HCP001',
  'Dr. Sarah Johnson',
  'Cardiology',
  'PRAC001',
  'Heart Care Associates',
  (SELECT id FROM sales_territories LIMIT 1),
  'preferred',
  CURRENT_DATE - INTERVAL '2 days',
  15,
  CURRENT_DATE - INTERVAL '5 days',
  8
),
(
  (SELECT id FROM organizations LIMIT 1),
  'HCP002',
  'Dr. Michael Chen',
  'Oncology',
  'PRAC002',
  'Cancer Treatment Center',
  (SELECT id FROM sales_territories LIMIT 1),
  'standard',
  CURRENT_DATE - INTERVAL '1 day',
  12,
  CURRENT_DATE - INTERVAL '3 days',
  5
),
(
  (SELECT id FROM organizations LIMIT 1),
  'HCP003',
  'Dr. Emily Rodriguez',
  'Neurology',
  'PRAC003',
  'Neuro Health Clinic',
  (SELECT id FROM sales_territories LIMIT 1),
  'non_preferred',
  CURRENT_DATE - INTERVAL '7 days',
  8,
  CURRENT_DATE - INTERVAL '10 days',
  3
);

-- Insert sample prescription events
INSERT INTO prescription_events (
  organization_id,
  product_id,
  product_name,
  hcp_id,
  account_id,
  account_name,
  prescription_date,
  prescription_type,
  volume,
  territory_id,
  payer_id,
  payer_name,
  channel
) VALUES 
(
  (SELECT id FROM organizations LIMIT 1),
  'PROD001',
  'CardioMax 10mg',
  'HCP001',
  'ACC001',
  'Heart Care Associates',
  CURRENT_DATE - INTERVAL '1 day',
  'new',
  1,
  (SELECT id FROM sales_territories LIMIT 1),
  'PAYER001',
  'Blue Cross Blue Shield',
  'retail'
),
(
  (SELECT id FROM organizations LIMIT 1),
  'PROD001',
  'CardioMax 10mg',
  'HCP001',
  'ACC001',
  'Heart Care Associates',
  CURRENT_DATE - INTERVAL '2 days',
  'refill',
  1,
  (SELECT id FROM sales_territories LIMIT 1),
  'PAYER001',
  'Blue Cross Blue Shield',
  'retail'
),
(
  (SELECT id FROM organizations LIMIT 1),
  'PROD002',
  'OncoRx 25mg',
  'HCP002',
  'ACC002',
  'Cancer Treatment Center',
  CURRENT_DATE - INTERVAL '3 days',
  'new',
  1,
  (SELECT id FROM sales_territories LIMIT 1),
  'PAYER002',
  'Aetna',
  'specialty'
),
(
  (SELECT id FROM organizations LIMIT 1),
  'PROD003',
  'NeuroCalm 5mg',
  'HCP003',
  'ACC003',
  'Neuro Health Clinic',
  CURRENT_DATE - INTERVAL '5 days',
  'new',
  1,
  (SELECT id FROM sales_territories LIMIT 1),
  'PAYER003',
  'Cigna',
  'retail'
);

-- Insert sample pharmaceutical calls
INSERT INTO pharmaceutical_calls (
  organization_id,
  rep_id,
  hcp_id,
  call_date,
  duration_minutes,
  call_type,
  product_id,
  product_name,
  outcome,
  samples_distributed,
  samples_requested,
  notes,
  territory_id
) VALUES 
(
  (SELECT id FROM organizations LIMIT 1),
  (SELECT id FROM users WHERE role = 'rep' LIMIT 1),
  'HCP001',
  CURRENT_DATE - INTERVAL '2 days',
  30,
  'detailing',
  'PROD001',
  'CardioMax 10mg',
  'successful',
  5,
  3,
  'Discussed new clinical trial data. HCP showed interest in prescribing.',
  (SELECT id FROM sales_territories LIMIT 1)
),
(
  (SELECT id FROM organizations LIMIT 1),
  (SELECT id FROM users WHERE role = 'rep' LIMIT 1),
  'HCP002',
  CURRENT_DATE - INTERVAL '1 day',
  45,
  'presentation',
  'PROD002',
  'OncoRx 25mg',
  'successful',
  10,
  8,
  'Presented efficacy data. HCP requested additional samples.',
  (SELECT id FROM sales_territories LIMIT 1)
),
(
  (SELECT id FROM organizations LIMIT 1),
  (SELECT id FROM users WHERE role = 'rep' LIMIT 1),
  'HCP003',
  CURRENT_DATE - INTERVAL '7 days',
  20,
  'follow_up',
  'PROD003',
  'NeuroCalm 5mg',
  'follow_up_required',
  0,
  2,
  'HCP was busy. Scheduled follow-up call for next week.',
  (SELECT id FROM sales_territories LIMIT 1)
);

-- Insert sample distributions
INSERT INTO sample_distributions (
  organization_id,
  product_id,
  product_name,
  hcp_id,
  rep_id,
  distribution_date,
  quantity,
  territory_id,
  batch_number,
  expiration_date
) VALUES 
(
  (SELECT id FROM organizations LIMIT 1),
  'PROD001',
  'CardioMax 10mg',
  'HCP001',
  (SELECT id FROM users WHERE role = 'rep' LIMIT 1),
  CURRENT_DATE - INTERVAL '2 days',
  5,
  (SELECT id FROM sales_territories LIMIT 1),
  'BATCH001',
  CURRENT_DATE + INTERVAL '2 years'
),
(
  (SELECT id FROM organizations LIMIT 1),
  'PROD002',
  'OncoRx 25mg',
  'HCP002',
  (SELECT id FROM users WHERE role = 'rep' LIMIT 1),
  CURRENT_DATE - INTERVAL '1 day',
  10,
  (SELECT id FROM sales_territories LIMIT 1),
  'BATCH002',
  CURRENT_DATE + INTERVAL '18 months'
);

-- Insert sample formulary access
INSERT INTO formulary_access (
  organization_id,
  payer_id,
  payer_name,
  product_id,
  product_name,
  coverage_level,
  territory_id,
  effective_date,
  end_date,
  copay_amount,
  prior_authorization_required,
  step_therapy_required
) VALUES 
(
  (SELECT id FROM organizations LIMIT 1),
  'PAYER001',
  'Blue Cross Blue Shield',
  'PROD001',
  'CardioMax 10mg',
  'preferred',
  (SELECT id FROM sales_territories LIMIT 1),
  CURRENT_DATE - INTERVAL '1 year',
  NULL,
  25.00,
  false,
  false
),
(
  (SELECT id FROM organizations LIMIT 1),
  'PAYER002',
  'Aetna',
  'PROD002',
  'OncoRx 25mg',
  'standard',
  (SELECT id FROM sales_territories LIMIT 1),
  CURRENT_DATE - INTERVAL '6 months',
  NULL,
  50.00,
  true,
  false
),
(
  (SELECT id FROM organizations LIMIT 1),
  'PAYER003',
  'Cigna',
  'PROD003',
  'NeuroCalm 5mg',
  'non_preferred',
  (SELECT id FROM sales_territories LIMIT 1),
  CURRENT_DATE - INTERVAL '3 months',
  NULL,
  75.00,
  true,
  true
);

-- Insert sample data source integration
INSERT INTO data_source_integrations (
  organization_id,
  source_name,
  source_type,
  connection_config,
  refresh_interval,
  last_sync,
  sync_status
) VALUES 
(
  (SELECT id FROM organizations LIMIT 1),
  'Salesforce CRM',
  'salesforce',
  '{"apiKey": "sf_test_key", "instanceUrl": "https://test.salesforce.com"}',
  60,
  CURRENT_DATE - INTERVAL '1 hour',
  'active'
),
(
  (SELECT id FROM organizations LIMIT 1),
  'IQVIA Prescription Data',
  'iqvia',
  '{"apiKey": "iqvia_test_key", "endpoint": "https://api.iqvia.com"}',
  240,
  CURRENT_DATE - INTERVAL '4 hours',
  'active'
),
(
  (SELECT id FROM organizations LIMIT 1),
  'Snowflake Data Warehouse',
  'snowflake',
  '{"connectionString": "snowflake://test", "warehouse": "PHARMA_WH"}',
  1440,
  CURRENT_DATE - INTERVAL '1 day',
  'active'
);
