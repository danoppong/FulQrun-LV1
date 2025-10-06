-- =============================================================================
-- RBAC DIAGNOSTIC SCRIPT
-- Check what tables exist and what might be causing the role_id error
-- =============================================================================

-- Check if organizations table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        RAISE NOTICE '✅ Organizations table exists';
    ELSE
        RAISE NOTICE '❌ Organizations table does NOT exist - this is the problem!';
    END IF;
END $$;

-- Check if roles table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
        RAISE NOTICE '✅ Roles table exists';
    ELSE
        RAISE NOTICE '❌ Roles table does NOT exist';
    END IF;
END $$;

-- Check if permissions table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
        RAISE NOTICE '✅ Permissions table exists';
    ELSE
        RAISE NOTICE '❌ Permissions table does NOT exist';
    END IF;
END $$;

-- Check if role_permissions table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions') THEN
        RAISE NOTICE '✅ Role_permissions table exists';
    ELSE
        RAISE NOTICE '❌ Role_permissions table does NOT exist';
    END IF;
END $$;

-- List all tables in public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
