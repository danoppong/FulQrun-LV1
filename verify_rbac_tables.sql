-- =============================================================================
-- RBAC VERIFICATION SCRIPT
-- Verify that the RBAC tables were created correctly
-- =============================================================================

-- Check if all RBAC tables exist and show their structure
DO $$
BEGIN
    -- Check roles table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
        RAISE NOTICE '✅ Roles table exists';
    ELSE
        RAISE NOTICE '❌ Roles table does NOT exist';
    END IF;

    -- Check permissions table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
        RAISE NOTICE '✅ Permissions table exists';
    ELSE
        RAISE NOTICE '❌ Permissions table does NOT exist';
    END IF;

    -- Check role_permissions table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions') THEN
        RAISE NOTICE '✅ Role_permissions table exists';
    ELSE
        RAISE NOTICE '❌ Role_permissions table does NOT exist';
    END IF;

    -- Check rbac_settings table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_settings') THEN
        RAISE NOTICE '✅ RBAC_settings table exists';
    ELSE
        RAISE NOTICE '❌ RBAC_settings table does NOT exist';
    END IF;
END $$;

-- Show the structure of the new role_permissions table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'role_permissions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show the structure of the roles table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'roles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show the structure of the permissions table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'permissions' 
AND table_schema = 'public'
ORDER BY ordinal_position;
