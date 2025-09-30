-- Show all current policies to see which ones are extra
SELECT 
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN with_check IS NOT NULL THEN '✅ Has WITH CHECK'
        WHEN cmd IN ('INSERT', 'UPDATE') THEN '❌ Missing'
        ELSE '➖ N/A'
    END as with_check
FROM pg_policies 
WHERE tablename = 'metric_templates'
ORDER BY cmd, policyname;
