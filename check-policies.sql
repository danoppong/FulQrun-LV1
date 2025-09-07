-- Check current RLS policies to see what's causing the infinite recursion
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('users', 'organizations', 'companies', 'contacts', 'leads', 'opportunities', 'activities', 'integrations')
ORDER BY tablename, policyname;
