-- Apply Sales Performance Module Migrations
-- This script applies the Sales Performance Module schema changes

-- First, let's apply the main Sales Performance Module (019)
\i supabase/migrations/019_sales_performance_module.sql

-- Then apply the Performance Tracking Metrics enhancement (020)
\i supabase/migrations/020_performance_tracking_metrics.sql

-- Verify the tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%sales%' 
OR table_name LIKE '%metric%'
ORDER BY table_name;
