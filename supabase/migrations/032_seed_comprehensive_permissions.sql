-- =============================================================================
-- COMPREHENSIVE PERMISSIONS SEEDING
-- =============================================================================
-- This migration seeds comprehensive permissions covering all modules and functions
-- in the FulQrun application.

-- =============================================================================
-- HELPER FUNCTION TO SEED PERMISSIONS FOR ORGANIZATION
-- =============================================================================

CREATE OR REPLACE FUNCTION seed_comprehensive_permissions_for_org(p_organization_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inserted_count INTEGER := 0;
    v_row_count INTEGER;
BEGIN
    -- =============================================================================
    -- DASHBOARD PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'dashboard.view', 'View Dashboard', 'Dashboard', 'Access to main dashboard', 'Dashboard', true),
        (p_organization_id, 'dashboard.analytics', 'View Analytics', 'Dashboard', 'Access to dashboard analytics', 'Dashboard', true),
        (p_organization_id, 'dashboard.customize', 'Customize Dashboard', 'Dashboard', 'Customize dashboard widgets', 'Dashboard', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- ACCOUNT MANAGEMENT PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        -- Companies
        (p_organization_id, 'companies.view', 'View Companies', 'Account Management', 'View company records', 'Account', true),
        (p_organization_id, 'companies.create', 'Create Companies', 'Account Management', 'Create new company records', 'Account', false),
        (p_organization_id, 'companies.edit', 'Edit Companies', 'Account Management', 'Edit existing company records', 'Account', false),
        (p_organization_id, 'companies.delete', 'Delete Companies', 'Account Management', 'Delete company records', 'Account', false),
        (p_organization_id, 'companies.export', 'Export Companies', 'Account Management', 'Export company data', 'Account', false),
        
        -- Contacts
        (p_organization_id, 'contacts.view', 'View Contacts', 'Account Management', 'View contact records', 'Account', true),
        (p_organization_id, 'contacts.create', 'Create Contacts', 'Account Management', 'Create new contact records', 'Account', false),
        (p_organization_id, 'contacts.edit', 'Edit Contacts', 'Account Management', 'Edit existing contact records', 'Account', false),
        (p_organization_id, 'contacts.delete', 'Delete Contacts', 'Account Management', 'Delete contact records', 'Account', false),
        (p_organization_id, 'contacts.export', 'Export Contacts', 'Account Management', 'Export contact data', 'Account', false),
        
        -- Partners
        (p_organization_id, 'partners.view', 'View Partners', 'Account Management', 'View partner records', 'Account', true),
        (p_organization_id, 'partners.create', 'Create Partners', 'Account Management', 'Create new partner records', 'Account', false),
        (p_organization_id, 'partners.edit', 'Edit Partners', 'Account Management', 'Edit existing partner records', 'Account', false),
        (p_organization_id, 'partners.delete', 'Delete Partners', 'Account Management', 'Delete partner records', 'Account', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- LEAD MANAGEMENT PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        -- Lead Listing
        (p_organization_id, 'leads.view', 'View Leads', 'Lead Management', 'View lead records', 'Leads', true),
        (p_organization_id, 'leads.create', 'Create Leads', 'Lead Management', 'Create new lead records', 'Leads', false),
        (p_organization_id, 'leads.edit', 'Edit Leads', 'Lead Management', 'Edit existing lead records', 'Leads', false),
        (p_organization_id, 'leads.delete', 'Delete Leads', 'Lead Management', 'Delete lead records', 'Leads', false),
        (p_organization_id, 'leads.assign', 'Assign Leads', 'Lead Management', 'Assign leads to team members', 'Leads', false),
        
        -- Lead Qualification
        (p_organization_id, 'leads.qualify', 'Qualify Leads', 'Lead Management', 'Qualify and score leads', 'Leads', false),
        (p_organization_id, 'leads.score', 'Score Leads', 'Lead Management', 'Access lead scoring system', 'Leads', false),
        
        -- Lead Progression
        (p_organization_id, 'leads.progress', 'Progress Leads', 'Lead Management', 'Move leads through stages', 'Leads', false),
        (p_organization_id, 'leads.convert', 'Convert Leads', 'Lead Management', 'Convert leads to opportunities', 'Leads', false),
        
        -- Lead Analytics
        (p_organization_id, 'leads.analytics', 'Lead Analytics', 'Lead Management', 'Access lead analytics', 'Leads', false),
        (p_organization_id, 'leads.reports', 'Lead Reports', 'Lead Management', 'Generate lead reports', 'Leads', false),
        (p_organization_id, 'leads.export', 'Export Leads', 'Lead Management', 'Export lead data', 'Leads', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- OPPORTUNITY MANAGEMENT PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        -- Opportunity Listing
        (p_organization_id, 'opportunities.view', 'View Opportunities', 'Opportunity Management', 'View opportunity records', 'Opportunity', true),
        (p_organization_id, 'opportunities.create', 'Create Opportunities', 'Opportunity Management', 'Create new opportunity records', 'Opportunity', false),
        (p_organization_id, 'opportunities.edit', 'Edit Opportunities', 'Opportunity Management', 'Edit existing opportunity records', 'Opportunity', false),
        (p_organization_id, 'opportunities.delete', 'Delete Opportunities', 'Opportunity Management', 'Delete opportunity records', 'Opportunity', false),
        (p_organization_id, 'opportunities.assign', 'Assign Opportunities', 'Opportunity Management', 'Assign opportunities to team members', 'Opportunity', false),
        
        -- MEDDPICC
        (p_organization_id, 'opportunities.meddpicc', 'MEDDPICC Access', 'Opportunity Management', 'Access MEDDPICC qualification', 'Opportunity', false),
        (p_organization_id, 'opportunities.meddpicc.edit', 'Edit MEDDPICC', 'Opportunity Management', 'Edit MEDDPICC scores', 'Opportunity', false),
        
        -- PEAK Pipeline
        (p_organization_id, 'opportunities.peak', 'PEAK Pipeline Access', 'Opportunity Management', 'Access PEAK pipeline', 'Opportunity', false),
        (p_organization_id, 'opportunities.peak.edit', 'Edit PEAK Pipeline', 'Opportunity Management', 'Edit PEAK pipeline stages', 'Opportunity', false),
        
        -- Opportunity Analytics
        (p_organization_id, 'opportunities.analytics', 'Opportunity Analytics', 'Opportunity Management', 'Access opportunity analytics', 'Opportunity', false),
        (p_organization_id, 'opportunities.reports', 'Opportunity Reports', 'Opportunity Management', 'Generate opportunity reports', 'Opportunity', false),
        (p_organization_id, 'opportunities.export', 'Export Opportunities', 'Opportunity Management', 'Export opportunity data', 'Opportunity', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- SALES PERFORMANCE MANAGEMENT PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        -- Sales Performance
        (p_organization_id, 'spm.view', 'View SPM', 'Sales Performance', 'View sales performance data', 'SPM', true),
        (p_organization_id, 'spm.edit', 'Edit SPM', 'Sales Performance', 'Edit sales performance data', 'SPM', false),
        
        -- Target/Quota Management
        (p_organization_id, 'quotas.view', 'View Quotas', 'Sales Performance', 'View quota and target data', 'SPM', true),
        (p_organization_id, 'quotas.create', 'Create Quotas', 'Sales Performance', 'Create new quotas', 'SPM', false),
        (p_organization_id, 'quotas.edit', 'Edit Quotas', 'Sales Performance', 'Edit existing quotas', 'SPM', false),
        (p_organization_id, 'quotas.delete', 'Delete Quotas', 'Sales Performance', 'Delete quotas', 'SPM', false),
        
        -- Performance KPIs
        (p_organization_id, 'kpis.view', 'View KPIs', 'Sales Performance', 'View performance KPIs', 'SPM', true),
        (p_organization_id, 'kpis.create', 'Create KPIs', 'Sales Performance', 'Create new KPIs', 'SPM', false),
        (p_organization_id, 'kpis.edit', 'Edit KPIs', 'Sales Performance', 'Edit existing KPIs', 'SPM', false),
        (p_organization_id, 'kpis.delete', 'Delete KPIs', 'Sales Performance', 'Delete KPIs', 'SPM', false),
        
        -- Performance Analytics
        (p_organization_id, 'performance.analytics', 'Performance Analytics', 'Sales Performance', 'Access performance analytics', 'SPM', false),
        (p_organization_id, 'performance.reports', 'Performance Reports', 'Sales Performance', 'Generate performance reports', 'SPM', false),
        (p_organization_id, 'performance.export', 'Export Performance', 'Sales Performance', 'Export performance data', 'SPM', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- BUSINESS INTELLIGENCE PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        -- Reports
        (p_organization_id, 'bi.reports.view', 'View BI Reports', 'Business Intelligence', 'View business intelligence reports', 'Business Intelligence', true),
        (p_organization_id, 'bi.reports.create', 'Create BI Reports', 'Business Intelligence', 'Create new BI reports', 'Business Intelligence', false),
        (p_organization_id, 'bi.reports.edit', 'Edit BI Reports', 'Business Intelligence', 'Edit existing BI reports', 'Business Intelligence', false),
        (p_organization_id, 'bi.reports.delete', 'Delete BI Reports', 'Business Intelligence', 'Delete BI reports', 'Business Intelligence', false),
        
        -- AI Insights
        (p_organization_id, 'bi.ai.view', 'View AI Insights', 'Business Intelligence', 'View AI-powered insights', 'Business Intelligence', true),
        (p_organization_id, 'bi.ai.configure', 'Configure AI Insights', 'Business Intelligence', 'Configure AI insight parameters', 'Business Intelligence', false),
        
        -- Pharmaceutical BI
        (p_organization_id, 'bi.pharma.view', 'View Pharma BI', 'Business Intelligence', 'View pharmaceutical BI data', 'Business Intelligence', true),
        (p_organization_id, 'bi.pharma.edit', 'Edit Pharma BI', 'Business Intelligence', 'Edit pharmaceutical BI data', 'Business Intelligence', false),
        
        -- Analytics
        (p_organization_id, 'bi.analytics.view', 'View Analytics', 'Business Intelligence', 'View analytics dashboards', 'Business Intelligence', true),
        (p_organization_id, 'bi.analytics.create', 'Create Analytics', 'Business Intelligence', 'Create new analytics', 'Business Intelligence', false),
        (p_organization_id, 'bi.analytics.edit', 'Edit Analytics', 'Business Intelligence', 'Edit existing analytics', 'Business Intelligence', false),
        (p_organization_id, 'bi.analytics.export', 'Export Analytics', 'Business Intelligence', 'Export analytics data', 'Business Intelligence', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- ENTERPRISE AI PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'enterprise.ai.view', 'View Enterprise AI', 'Enterprise AI', 'View enterprise AI features', 'Enterprise AI', true),
        (p_organization_id, 'enterprise.ai.configure', 'Configure Enterprise AI', 'Enterprise AI', 'Configure enterprise AI settings', 'Enterprise AI', false),
        (p_organization_id, 'enterprise.ai.models', 'Manage AI Models', 'Enterprise AI', 'Manage AI models and algorithms', 'Enterprise AI', false),
        (p_organization_id, 'enterprise.ai.training', 'AI Model Training', 'Enterprise AI', 'Train and retrain AI models', 'Enterprise AI', false),
        (p_organization_id, 'enterprise.ai.predictions', 'AI Predictions', 'Enterprise AI', 'Access AI predictions and forecasts', 'Enterprise AI', false),
        (p_organization_id, 'enterprise.ai.coaching', 'AI Coaching', 'Enterprise AI', 'Access AI-powered sales coaching', 'Enterprise AI', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- ENTERPRISE ANALYTICS PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'enterprise.analytics.view', 'View Enterprise Analytics', 'Enterprise Analytics', 'View enterprise analytics', 'Enterprise Analytics', true),
        (p_organization_id, 'enterprise.analytics.configure', 'Configure Enterprise Analytics', 'Enterprise Analytics', 'Configure enterprise analytics', 'Enterprise Analytics', false),
        (p_organization_id, 'enterprise.analytics.dashboards', 'Manage Dashboards', 'Enterprise Analytics', 'Create and manage dashboards', 'Enterprise Analytics', false),
        (p_organization_id, 'enterprise.analytics.kpis', 'Manage Enterprise KPIs', 'Enterprise Analytics', 'Create and manage enterprise KPIs', 'Enterprise Analytics', false),
        (p_organization_id, 'enterprise.analytics.forecasting', 'Forecasting', 'Enterprise Analytics', 'Access forecasting features', 'Enterprise Analytics', false),
        (p_organization_id, 'enterprise.analytics.nlp', 'Natural Language Query', 'Enterprise Analytics', 'Use natural language querying', 'Enterprise Analytics', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- INTEGRATIONS PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        -- Integration Hub
        (p_organization_id, 'integrations.view', 'View Integrations', 'Integrations', 'View integration hub', 'Integrations', true),
        (p_organization_id, 'integrations.create', 'Create Integrations', 'Integrations', 'Create new integrations', 'Integrations', false),
        (p_organization_id, 'integrations.edit', 'Edit Integrations', 'Integrations', 'Edit existing integrations', 'Integrations', false),
        (p_organization_id, 'integrations.delete', 'Delete Integrations', 'Integrations', 'Delete integrations', 'Integrations', false),
        (p_organization_id, 'integrations.configure', 'Configure Integrations', 'Integrations', 'Configure integration settings', 'Integrations', false),
        
        -- Enterprise Integrations
        (p_organization_id, 'enterprise.integrations.view', 'View Enterprise Integrations', 'Integrations', 'View enterprise integrations', 'Integrations', true),
        (p_organization_id, 'enterprise.integrations.manage', 'Manage Enterprise Integrations', 'Integrations', 'Manage enterprise integrations', 'Integrations', false),
        (p_organization_id, 'enterprise.integrations.api', 'API Management', 'Integrations', 'Manage API connections', 'Integrations', false),
        (p_organization_id, 'enterprise.integrations.webhooks', 'Webhook Management', 'Integrations', 'Manage webhook configurations', 'Integrations', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- ENTERPRISE SECURITY PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'enterprise.security.view', 'View Enterprise Security', 'Enterprise Security', 'View enterprise security features', 'Enterprise Security', true),
        (p_organization_id, 'enterprise.security.configure', 'Configure Enterprise Security', 'Enterprise Security', 'Configure security settings', 'Enterprise Security', false),
        (p_organization_id, 'enterprise.security.compliance', 'Compliance Management', 'Enterprise Security', 'Manage compliance features', 'Enterprise Security', false),
        (p_organization_id, 'enterprise.security.audit', 'Audit Logging', 'Enterprise Security', 'Access audit logs', 'Enterprise Security', false),
        (p_organization_id, 'enterprise.security.sso', 'SSO Management', 'Enterprise Security', 'Manage SSO configurations', 'Enterprise Security', false),
        (p_organization_id, 'enterprise.security.rbac', 'RBAC Management', 'Enterprise Security', 'Manage role-based access control', 'Enterprise Security', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- ENTERPRISE WORKFLOWS PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'enterprise.workflows.view', 'View Enterprise Workflows', 'Enterprise Workflows', 'View enterprise workflows', 'Enterprise Workflows', true),
        (p_organization_id, 'enterprise.workflows.create', 'Create Workflows', 'Enterprise Workflows', 'Create new workflows', 'Enterprise Workflows', false),
        (p_organization_id, 'enterprise.workflows.edit', 'Edit Workflows', 'Enterprise Workflows', 'Edit existing workflows', 'Enterprise Workflows', false),
        (p_organization_id, 'enterprise.workflows.delete', 'Delete Workflows', 'Enterprise Workflows', 'Delete workflows', 'Enterprise Workflows', false),
        (p_organization_id, 'enterprise.workflows.automation', 'Workflow Automation', 'Enterprise Workflows', 'Configure workflow automation', 'Enterprise Workflows', false),
        (p_organization_id, 'enterprise.workflows.approvals', 'Approval Management', 'Enterprise Workflows', 'Manage approval processes', 'Enterprise Workflows', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- MOBILE APP PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'mobile.view', 'View Mobile App', 'Mobile App', 'View mobile app features', 'Mobile App', true),
        (p_organization_id, 'mobile.configure', 'Configure Mobile App', 'Mobile App', 'Configure mobile app settings', 'Mobile App', false),
        (p_organization_id, 'mobile.offline', 'Offline Mode', 'Mobile App', 'Access offline mode features', 'Mobile App', false),
        (p_organization_id, 'mobile.voice', 'Voice Logging', 'Mobile App', 'Use voice-to-text logging', 'Mobile App', false),
        (p_organization_id, 'mobile.mdm', 'MDM Integration', 'Mobile App', 'Manage mobile device management', 'Mobile App', false),
        (p_organization_id, 'mobile.push', 'Push Notifications', 'Mobile App', 'Configure push notifications', 'Mobile App', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- LEARNING PLATFORM PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        (p_organization_id, 'learning.view', 'View Learning Platform', 'Learning Platform', 'View learning platform', 'Learning Platform', true),
        (p_organization_id, 'learning.courses.view', 'View Courses', 'Learning Platform', 'View available courses', 'Learning Platform', true),
        (p_organization_id, 'learning.courses.create', 'Create Courses', 'Learning Platform', 'Create new courses', 'Learning Platform', false),
        (p_organization_id, 'learning.courses.edit', 'Edit Courses', 'Learning Platform', 'Edit existing courses', 'Learning Platform', false),
        (p_organization_id, 'learning.courses.delete', 'Delete Courses', 'Learning Platform', 'Delete courses', 'Learning Platform', false),
        (p_organization_id, 'learning.certifications', 'Certifications', 'Learning Platform', 'Manage certifications', 'Learning Platform', false),
        (p_organization_id, 'learning.assessments', 'Assessments', 'Learning Platform', 'Manage assessments', 'Learning Platform', false),
        (p_organization_id, 'learning.progress', 'Learning Progress', 'Learning Platform', 'View learning progress', 'Learning Platform', false),
        (p_organization_id, 'learning.reports', 'Learning Reports', 'Learning Platform', 'Generate learning reports', 'Learning Platform', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- ADMINISTRATION PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        -- Admin Dashboard
        (p_organization_id, 'admin.dashboard.view', 'View Admin Dashboard', 'Administration', 'View admin dashboard', 'Administration', true),
        
        -- Organization Settings
        (p_organization_id, 'admin.organization.view', 'View Organization Settings', 'Administration', 'View organization settings', 'Administration', true),
        (p_organization_id, 'admin.organization.edit', 'Edit Organization Settings', 'Administration', 'Edit organization settings', 'Administration', false),
        (p_organization_id, 'admin.organization.features', 'Manage Organization Features', 'Administration', 'Manage organization features', 'Administration', false),
        (p_organization_id, 'admin.organization.compliance', 'Manage Compliance', 'Administration', 'Manage compliance settings', 'Administration', false),
        (p_organization_id, 'admin.organization.branding', 'Manage Branding', 'Administration', 'Manage branding settings', 'Administration', false),
        
        -- User Management
        (p_organization_id, 'admin.users.view', 'View Users', 'Administration', 'View user management', 'Administration', true),
        (p_organization_id, 'admin.users.create', 'Create Users', 'Administration', 'Create new users', 'Administration', false),
        (p_organization_id, 'admin.users.edit', 'Edit Users', 'Administration', 'Edit existing users', 'Administration', false),
        (p_organization_id, 'admin.users.delete', 'Delete Users', 'Administration', 'Delete users', 'Administration', false),
        (p_organization_id, 'admin.users.roles', 'Manage User Roles', 'Administration', 'Manage user roles', 'Administration', false),
        
        -- Enterprise Roles
        (p_organization_id, 'admin.enterprise.roles.view', 'View Enterprise Roles', 'Administration', 'View enterprise roles', 'Administration', true),
        (p_organization_id, 'admin.enterprise.roles.create', 'Create Enterprise Roles', 'Administration', 'Create enterprise roles', 'Administration', false),
        (p_organization_id, 'admin.enterprise.roles.edit', 'Edit Enterprise Roles', 'Administration', 'Edit enterprise roles', 'Administration', false),
        (p_organization_id, 'admin.enterprise.roles.delete', 'Delete Enterprise Roles', 'Administration', 'Delete enterprise roles', 'Administration', false),
        
        -- Module Configuration
        (p_organization_id, 'admin.modules.view', 'View Module Configuration', 'Administration', 'View module configuration', 'Administration', true),
        (p_organization_id, 'admin.modules.configure', 'Configure Modules', 'Administration', 'Configure modules', 'Administration', false),
        
        -- Security & Compliance
        (p_organization_id, 'admin.security.view', 'View Security Settings', 'Administration', 'View security settings', 'Administration', true),
        (p_organization_id, 'admin.security.configure', 'Configure Security', 'Administration', 'Configure security settings', 'Administration', false),
        (p_organization_id, 'admin.security.authentication', 'Manage Authentication', 'Administration', 'Manage authentication settings', 'Administration', false),
        
        -- System Administration
        (p_organization_id, 'admin.system.view', 'View System Administration', 'Administration', 'View system administration', 'Administration', true),
        (p_organization_id, 'admin.system.database', 'Database Management', 'Administration', 'Manage database settings', 'Administration', false),
        (p_organization_id, 'admin.system.backup', 'Backup Management', 'Administration', 'Manage backups', 'Administration', false),
        (p_organization_id, 'admin.system.maintenance', 'System Maintenance', 'Administration', 'Perform system maintenance', 'Administration', false),
        
        -- Customization
        (p_organization_id, 'admin.customization.view', 'View Customization', 'Administration', 'View customization options', 'Administration', true),
        (p_organization_id, 'admin.customization.fields', 'Manage Custom Fields', 'Administration', 'Manage custom fields', 'Administration', false),
        (p_organization_id, 'admin.customization.workflows', 'Manage Custom Workflows', 'Administration', 'Manage custom workflows', 'Administration', false),
        
        -- RBAC Management
        (p_organization_id, 'admin.rbac.view', 'View RBAC', 'Administration', 'View role-based access control', 'Administration', true),
        (p_organization_id, 'admin.rbac.roles', 'Manage RBAC Roles', 'Administration', 'Manage RBAC roles', 'Administration', false),
        (p_organization_id, 'admin.rbac.permissions', 'Manage RBAC Permissions', 'Administration', 'Manage RBAC permissions', 'Administration', false),
        (p_organization_id, 'admin.rbac.assign', 'Assign RBAC Roles', 'Administration', 'Assign RBAC roles to users', 'Administration', false)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    -- =============================================================================
    -- SYSTEM PERMISSIONS
    -- =============================================================================
    
    INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
    VALUES 
        -- Profile Management
        (p_organization_id, 'profile.view', 'View Profile', 'System', 'View own profile', 'System', true),
        (p_organization_id, 'profile.edit', 'Edit Profile', 'System', 'Edit own profile', 'System', true),
        
        -- Settings
        (p_organization_id, 'settings.view', 'View Settings', 'System', 'View personal settings', 'System', true),
        (p_organization_id, 'settings.edit', 'Edit Settings', 'System', 'Edit personal settings', 'System', true),
        
        -- Notifications
        (p_organization_id, 'notifications.view', 'View Notifications', 'System', 'View notifications', 'System', true),
        (p_organization_id, 'notifications.configure', 'Configure Notifications', 'System', 'Configure notification preferences', 'System', true),
        
        -- Help & Support
        (p_organization_id, 'help.view', 'View Help', 'System', 'View help documentation', 'System', true),
        (p_organization_id, 'support.contact', 'Contact Support', 'System', 'Contact support team', 'System', true)
    ON CONFLICT (organization_id, permission_key) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;

    RETURN v_inserted_count;
END;
$$;

-- =============================================================================
-- SEED PERMISSIONS FOR ALL EXISTING ORGANIZATIONS
-- =============================================================================

DO $$
DECLARE
    org_record RECORD;
    total_inserted INTEGER := 0;
    org_inserted INTEGER;
BEGIN
    -- Loop through all organizations and seed permissions
    FOR org_record IN 
        SELECT id FROM organizations 
        WHERE id IS NOT NULL
    LOOP
        SELECT seed_comprehensive_permissions_for_org(org_record.id) INTO org_inserted;
        total_inserted := total_inserted + org_inserted;
        
        RAISE NOTICE 'Seeded % permissions for organization %', org_inserted, org_record.id;
    END LOOP;
    
    RAISE NOTICE 'Total permissions seeded: %', total_inserted;
END $$;

-- =============================================================================
-- CREATE DEFAULT ROLES WITH PERMISSIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION create_default_roles_for_org(p_organization_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inserted_count INTEGER := 0;
    v_row_count INTEGER;
    v_rep_role_id UUID;
    v_manager_role_id UUID;
    v_admin_role_id UUID;
    v_super_admin_role_id UUID;
BEGIN
    -- Create Rep Role
    INSERT INTO roles (organization_id, role_key, role_name, description, is_active, is_system_role)
    VALUES (p_organization_id, 'rep', 'Sales Representative', 'Basic sales representative role with limited permissions', true, true)
    ON CONFLICT (organization_id, role_key) DO NOTHING
    RETURNING id INTO v_rep_role_id;
    
    -- Create Manager Role
    INSERT INTO roles (organization_id, role_key, role_name, description, is_active, is_system_role)
    VALUES (p_organization_id, 'manager', 'Sales Manager', 'Sales manager role with team management permissions', true, true)
    ON CONFLICT (organization_id, role_key) DO NOTHING
    RETURNING id INTO v_manager_role_id;
    
    -- Create Admin Role
    INSERT INTO roles (organization_id, role_key, role_name, description, is_active, is_system_role)
    VALUES (p_organization_id, 'admin', 'Administrator', 'Administrator role with organization management permissions', true, true)
    ON CONFLICT (organization_id, role_key) DO NOTHING
    RETURNING id INTO v_admin_role_id;
    
    -- Create Super Admin Role
    INSERT INTO roles (organization_id, role_key, role_name, description, is_active, is_system_role)
    VALUES (p_organization_id, 'super_admin', 'Super Administrator', 'Super administrator role with full system access', true, true)
    ON CONFLICT (organization_id, role_key) DO NOTHING
    RETURNING id INTO v_super_admin_role_id;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted_count := v_inserted_count + v_row_count;
    
    -- Assign permissions to roles (this would be done through the UI in practice)
    -- For now, we'll create basic permission assignments
    
    RETURN v_inserted_count;
END;
$$;

-- Create default roles for all organizations
DO $$
DECLARE
    org_record RECORD;
    total_inserted INTEGER := 0;
    org_inserted INTEGER;
BEGIN
    FOR org_record IN 
        SELECT id FROM organizations 
        WHERE id IS NOT NULL
    LOOP
        SELECT create_default_roles_for_org(org_record.id) INTO org_inserted;
        total_inserted := total_inserted + org_inserted;
        
        RAISE NOTICE 'Created % default roles for organization %', org_inserted, org_record.id;
    END LOOP;
    
    RAISE NOTICE 'Total default roles created: %', total_inserted;
END $$;

-- =============================================================================
-- CLEANUP
-- =============================================================================

DROP FUNCTION IF EXISTS seed_comprehensive_permissions_for_org(UUID);
DROP FUNCTION IF EXISTS create_default_roles_for_org(UUID);
