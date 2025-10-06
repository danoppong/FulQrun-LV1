-- Apply comprehensive permissions directly
-- This script seeds comprehensive permissions covering all modules and functions

-- =============================================================================
-- DASHBOARD PERMISSIONS
-- =============================================================================

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'dashboard.view',
    'View Dashboard',
    'Dashboard',
    'Access to main dashboard',
    'Dashboard',
    true
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'dashboard.view'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'dashboard.analytics',
    'View Analytics',
    'Dashboard',
    'Access to dashboard analytics',
    'Dashboard',
    true
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'dashboard.analytics'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'dashboard.customize',
    'Customize Dashboard',
    'Dashboard',
    'Customize dashboard widgets',
    'Dashboard',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'dashboard.customize'
);

-- =============================================================================
-- ACCOUNT MANAGEMENT PERMISSIONS
-- =============================================================================

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'companies.view',
    'View Companies',
    'Account Management',
    'View company records',
    'Account',
    true
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'companies.view'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'companies.create',
    'Create Companies',
    'Account Management',
    'Create new company records',
    'Account',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'companies.create'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'companies.edit',
    'Edit Companies',
    'Account Management',
    'Edit existing company records',
    'Account',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'companies.edit'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'companies.delete',
    'Delete Companies',
    'Account Management',
    'Delete company records',
    'Account',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'companies.delete'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'contacts.view',
    'View Contacts',
    'Account Management',
    'View contact records',
    'Account',
    true
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'contacts.view'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'contacts.create',
    'Create Contacts',
    'Account Management',
    'Create new contact records',
    'Account',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'contacts.create'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'contacts.edit',
    'Edit Contacts',
    'Account Management',
    'Edit existing contact records',
    'Account',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'contacts.edit'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'contacts.delete',
    'Delete Contacts',
    'Account Management',
    'Delete contact records',
    'Account',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'contacts.delete'
);

-- =============================================================================
-- LEAD MANAGEMENT PERMISSIONS
-- =============================================================================

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'leads.view',
    'View Leads',
    'Lead Management',
    'View lead records',
    'Leads',
    true
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'leads.view'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'leads.create',
    'Create Leads',
    'Lead Management',
    'Create new lead records',
    'Leads',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'leads.create'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'leads.edit',
    'Edit Leads',
    'Lead Management',
    'Edit existing lead records',
    'Leads',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'leads.edit'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'leads.delete',
    'Delete Leads',
    'Lead Management',
    'Delete lead records',
    'Leads',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'leads.delete'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'leads.qualify',
    'Qualify Leads',
    'Lead Management',
    'Qualify and score leads',
    'Leads',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'leads.qualify'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'leads.score',
    'Score Leads',
    'Lead Management',
    'Access lead scoring system',
    'Leads',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'leads.score'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'leads.convert',
    'Convert Leads',
    'Lead Management',
    'Convert leads to opportunities',
    'Leads',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'leads.convert'
);

-- =============================================================================
-- OPPORTUNITY MANAGEMENT PERMISSIONS
-- =============================================================================

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'opportunities.view',
    'View Opportunities',
    'Opportunity Management',
    'View opportunity records',
    'Opportunity',
    true
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'opportunities.view'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'opportunities.create',
    'Create Opportunities',
    'Opportunity Management',
    'Create new opportunity records',
    'Opportunity',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'opportunities.create'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'opportunities.edit',
    'Edit Opportunities',
    'Opportunity Management',
    'Edit existing opportunity records',
    'Opportunity',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'opportunities.edit'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'opportunities.delete',
    'Delete Opportunities',
    'Opportunity Management',
    'Delete opportunity records',
    'Opportunity',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'opportunities.delete'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'opportunities.meddpicc',
    'MEDDPICC Access',
    'Opportunity Management',
    'Access MEDDPICC qualification',
    'Opportunity',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'opportunities.meddpicc'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'opportunities.peak',
    'PEAK Pipeline Access',
    'Opportunity Management',
    'Access PEAK pipeline',
    'Opportunity',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'opportunities.peak'
);

-- =============================================================================
-- ADMINISTRATION PERMISSIONS
-- =============================================================================

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'admin.dashboard.view',
    'View Admin Dashboard',
    'Administration',
    'View admin dashboard',
    'Administration',
    true
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'admin.dashboard.view'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'admin.users.view',
    'View Users',
    'Administration',
    'View user management',
    'Administration',
    true
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'admin.users.view'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'admin.users.create',
    'Create Users',
    'Administration',
    'Create new users',
    'Administration',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'admin.users.create'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'admin.users.edit',
    'Edit Users',
    'Administration',
    'Edit existing users',
    'Administration',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'admin.users.edit'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'admin.users.delete',
    'Delete Users',
    'Administration',
    'Delete users',
    'Administration',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'admin.users.delete'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'admin.rbac.view',
    'View RBAC',
    'Administration',
    'View role-based access control',
    'Administration',
    true
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'admin.rbac.view'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'admin.rbac.roles',
    'Manage RBAC Roles',
    'Administration',
    'Manage RBAC roles',
    'Administration',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'admin.rbac.roles'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'admin.rbac.permissions',
    'Manage RBAC Permissions',
    'Administration',
    'Manage RBAC permissions',
    'Administration',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'admin.rbac.permissions'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'admin.rbac.assign',
    'Assign RBAC Roles',
    'Administration',
    'Assign RBAC roles to users',
    'Administration',
    false
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'admin.rbac.assign'
);

-- =============================================================================
-- SYSTEM PERMISSIONS
-- =============================================================================

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'profile.view',
    'View Profile',
    'System',
    'View own profile',
    'System',
    true
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'profile.view'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'profile.edit',
    'Edit Profile',
    'System',
    'Edit own profile',
    'System',
    true
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'profile.edit'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'settings.view',
    'View Settings',
    'System',
    'View personal settings',
    'System',
    true
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'settings.view'
);

INSERT INTO permissions (organization_id, permission_key, permission_name, permission_category, description, module_name, is_system_permission)
SELECT 
    o.id,
    'settings.edit',
    'Edit Settings',
    'System',
    'Edit personal settings',
    'System',
    true
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p 
    WHERE p.organization_id = o.id AND p.permission_key = 'settings.edit'
);

-- =============================================================================
-- CREATE DEFAULT ROLES
-- =============================================================================

INSERT INTO roles (organization_id, role_key, role_name, description, is_active, is_system_role)
SELECT 
    o.id,
    'rep',
    'Sales Representative',
    'Basic sales representative role with limited permissions',
    true,
    true
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM roles r 
    WHERE r.organization_id = o.id AND r.role_key = 'rep'
);

INSERT INTO roles (organization_id, role_key, role_name, description, is_active, is_system_role)
SELECT 
    o.id,
    'manager',
    'Sales Manager',
    'Sales manager role with team management permissions',
    true,
    true
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM roles r 
    WHERE r.organization_id = o.id AND r.role_key = 'manager'
);

INSERT INTO roles (organization_id, role_key, role_name, description, is_active, is_system_role)
SELECT 
    o.id,
    'admin',
    'Administrator',
    'Administrator role with organization management permissions',
    true,
    true
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM roles r 
    WHERE r.organization_id = o.id AND r.role_key = 'admin'
);

INSERT INTO roles (organization_id, role_key, role_name, description, is_active, is_system_role)
SELECT 
    o.id,
    'super_admin',
    'Super Administrator',
    'Super administrator role with full system access',
    true,
    true
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM roles r 
    WHERE r.organization_id = o.id AND r.role_key = 'super_admin'
);
