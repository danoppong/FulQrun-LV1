-- =============================================================================
-- GRANT ADMIN ACCESS TO ALL DASHBOARDS
-- Script to ensure admin users have comprehensive dashboard access
-- =============================================================================

-- Add comprehensive dashboard permissions for all organizations
DO $$
DECLARE
    org_record RECORD;
    admin_role_id UUID;
    super_admin_role_id UUID;
    permission_record RECORD;
BEGIN
    RAISE NOTICE 'Starting admin dashboard access grant process...';
    
    -- Process each organization
    FOR org_record IN SELECT id, name FROM organizations LOOP
        RAISE NOTICE 'Processing organization: % (%)', org_record.name, org_record.id;
        
        -- Get admin role ID for this organization
        SELECT id INTO admin_role_id 
        FROM roles 
        WHERE organization_id = org_record.id 
        AND role_key = 'admin' 
        LIMIT 1;
        
        -- Get super admin role ID for this organization
        SELECT id INTO super_admin_role_id 
        FROM roles 
        WHERE organization_id = org_record.id 
        AND role_key = 'super_admin' 
        LIMIT 1;
        
        IF admin_role_id IS NULL THEN
            RAISE NOTICE 'No admin role found for organization %', org_record.id;
            CONTINUE;
        END IF;
        
        RAISE NOTICE 'Found admin role: %', admin_role_id;
        IF super_admin_role_id IS NOT NULL THEN
            RAISE NOTICE 'Found super admin role: %', super_admin_role_id;
        END IF;
        
        -- Add comprehensive dashboard permissions if they don't exist
        INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
        VALUES 
            -- Core Dashboard Permissions
            (org_record.id, 'dashboard.view_all', 'View All Dashboards', 'Dashboard', 'Access to all dashboard types', 'Dashboard', true),
            (org_record.id, 'dashboard.admin_access', 'Admin Dashboard Access', 'Dashboard', 'Full administrative dashboard access', 'Dashboard', true),
            (org_record.id, 'dashboard.executive_access', 'Executive Dashboard Access', 'Dashboard', 'Access to executive-level dashboards', 'Dashboard', true),
            (org_record.id, 'dashboard.analytics_advanced', 'Advanced Analytics Dashboard', 'Dashboard', 'Access to advanced analytics dashboards', 'Dashboard', true),
            (org_record.id, 'dashboard.pharmaceutical_bi', 'Pharmaceutical BI Dashboard', 'Dashboard', 'Access to pharmaceutical business intelligence dashboards', 'Dashboard', true),
            (org_record.id, 'dashboard.real_time', 'Real-Time Dashboard Access', 'Dashboard', 'Access to real-time dashboard features', 'Dashboard', true),
            (org_record.id, 'dashboard.predictive_analytics', 'Predictive Analytics Dashboard', 'Dashboard', 'Access to AI/ML predictive dashboards', 'Dashboard', true),
            (org_record.id, 'dashboard.team_performance', 'Team Performance Dashboard', 'Dashboard', 'Access to team performance dashboards', 'Dashboard', true),
            (org_record.id, 'dashboard.sales_performance', 'Sales Performance Dashboard', 'Dashboard', 'Access to sales performance dashboards', 'Dashboard', true),
            (org_record.id, 'dashboard.kpi_management', 'KPI Management Dashboard', 'Dashboard', 'Access to KPI management dashboards', 'Dashboard', true),
            
            -- Pharmaceutical-Specific Dashboard Permissions
            (org_record.id, 'pharma.dashboard.territory', 'Territory Performance Dashboard', 'Pharmaceutical', 'Territory-specific pharmaceutical dashboards', 'Pharmaceutical', true),
            (org_record.id, 'pharma.dashboard.product', 'Product Performance Dashboard', 'Pharmaceutical', 'Product-specific pharmaceutical dashboards', 'Pharmaceutical', true),
            (org_record.id, 'pharma.dashboard.hcp', 'HCP Engagement Dashboard', 'Pharmaceutical', 'Healthcare provider engagement dashboards', 'Pharmaceutical', true),
            (org_record.id, 'pharma.dashboard.market_share', 'Market Share Dashboard', 'Pharmaceutical', 'Market share analysis dashboards', 'Pharmaceutical', true),
            (org_record.id, 'pharma.dashboard.trx_analysis', 'TRx/NRx Analysis Dashboard', 'Pharmaceutical', 'Prescription analysis dashboards', 'Pharmaceutical', true),
            
            -- Business Intelligence Dashboard Permissions
            (org_record.id, 'bi.dashboard.executive', 'Executive BI Dashboard', 'Business Intelligence', 'Executive business intelligence dashboards', 'BI', true),
            (org_record.id, 'bi.dashboard.operational', 'Operational BI Dashboard', 'Business Intelligence', 'Operational business intelligence dashboards', 'BI', true),
            (org_record.id, 'bi.dashboard.financial', 'Financial BI Dashboard', 'Business Intelligence', 'Financial business intelligence dashboards', 'BI', true),
            (org_record.id, 'bi.dashboard.competitive', 'Competitive Analysis Dashboard', 'Business Intelligence', 'Competitive analysis dashboards', 'BI', true),
            (org_record.id, 'bi.dashboard.forecasting', 'Forecasting Dashboard', 'Business Intelligence', 'Sales and market forecasting dashboards', 'BI', true)
        ON CONFLICT (organization_id, permission_key) DO NOTHING;
        
        -- Grant ALL dashboard permissions to admin role
        FOR permission_record IN 
            SELECT p.id, p.permission_key
            FROM permissions p
            WHERE p.organization_id = org_record.id 
            AND (
                p.permission_key LIKE 'dashboard.%' OR
                p.permission_key LIKE 'pharma.dashboard.%' OR
                p.permission_key LIKE 'bi.dashboard.%' OR
                p.permission_key LIKE 'analytics.%' OR
                p.permission_key LIKE 'admin.%' OR
                p.permission_key = 'pharmaceutical_bi.view' OR
                p.permission_key = 'executive_dashboard.view' OR
                p.permission_key = 'enhanced_dashboard.view'
            )
        LOOP
            -- Grant to admin role
            INSERT INTO role_permissions (role_id, permission_id, organization_id)
            VALUES (admin_role_id, permission_record.id, org_record.id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
            
            -- Grant to super admin role if it exists
            IF super_admin_role_id IS NOT NULL THEN
                INSERT INTO role_permissions (role_id, permission_id, organization_id)
                VALUES (super_admin_role_id, permission_record.id, org_record.id)
                ON CONFLICT (role_id, permission_id) DO NOTHING;
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Completed dashboard access grants for organization %', org_record.name;
    END LOOP;
    
    RAISE NOTICE 'Admin dashboard access grant process completed successfully!';
END $$;

-- =============================================================================
-- UPDATE DASHBOARD POLICIES TO ENSURE ADMIN ACCESS
-- =============================================================================

-- Update existing dashboard-related policies to ensure admin access
DO $$
BEGIN
    -- Update metric dashboards policy
    DROP POLICY IF EXISTS "Admins can access all dashboards" ON metric_dashboards;
    CREATE POLICY "Admins can access all dashboards" ON metric_dashboards
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users u
                JOIN roles r ON u.role::text = r.role_key
                WHERE u.id = auth.uid() 
                AND r.organization_id = metric_dashboards.organization_id
                AND r.role_key IN ('admin', 'super_admin')
            )
        );
    
    -- Update dashboard metrics policy
    DROP POLICY IF EXISTS "Admins can access all dashboard metrics" ON dashboard_metrics;
    CREATE POLICY "Admins can access all dashboard metrics" ON dashboard_metrics
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users u
                JOIN roles r ON u.role::text = r.role_key
                JOIN metric_dashboards md ON md.id = dashboard_metrics.dashboard_id
                WHERE u.id = auth.uid() 
                AND r.organization_id = md.organization_id
                AND r.role_key IN ('admin', 'super_admin')
            )
        );
    
    -- Update user dashboard layouts policy
    DROP POLICY IF EXISTS "Admins can manage all dashboard layouts" ON user_dashboard_layouts;
    CREATE POLICY "Admins can manage all dashboard layouts" ON user_dashboard_layouts
        FOR ALL USING (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.id = auth.uid() 
                AND u.role IN ('admin', 'super_admin')
            )
        );
        
    RAISE NOTICE 'Dashboard policies updated successfully!';
END $$;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify admin dashboard permissions
SELECT 
    o.name AS organization_name,
    r.role_name,
    COUNT(rp.permission_id) AS dashboard_permissions_count,
    ARRAY_AGG(p.permission_key ORDER BY p.permission_key) AS permissions
FROM organizations o
JOIN roles r ON r.organization_id = o.id
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.role_key IN ('admin', 'super_admin')
AND (
    p.permission_key LIKE 'dashboard.%' OR
    p.permission_key LIKE 'pharma.dashboard.%' OR
    p.permission_key LIKE 'bi.dashboard.%' OR
    p.permission_key LIKE 'analytics.%'
)
GROUP BY o.id, o.name, r.id, r.role_name
ORDER BY o.name, r.role_name;

RAISE NOTICE '=============================================================================';
RAISE NOTICE 'ADMIN DASHBOARD ACCESS CONFIGURATION COMPLETED';
RAISE NOTICE '=============================================================================';
RAISE NOTICE 'Summary:';
RAISE NOTICE '- Added comprehensive dashboard permissions for all organizations';
RAISE NOTICE '- Granted admin and super_admin roles access to ALL dashboard types';
RAISE NOTICE '- Updated database policies to ensure admin access';
RAISE NOTICE '- Admin users now have access to:';
RAISE NOTICE '  * Core Dashboard permissions (view, customize, analytics)';
RAISE NOTICE '  * Executive Dashboard access';
RAISE NOTICE '  * Pharmaceutical BI Dashboard access';
RAISE NOTICE '  * Real-time Dashboard features';
RAISE NOTICE '  * Predictive Analytics Dashboard';
RAISE NOTICE '  * All territory, product, and HCP dashboards';
RAISE NOTICE '  * Business Intelligence dashboards';
RAISE NOTICE '  * Advanced analytics and forecasting';
RAISE NOTICE '=============================================================================';