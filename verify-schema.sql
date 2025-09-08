-- Check what columns exist in the opportunities table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'opportunities' 
AND table_schema = 'public'
ORDER BY ordinal_position;
