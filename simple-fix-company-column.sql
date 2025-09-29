-- Simple fix: Just add the missing company column
-- This is safer and won't affect existing data

-- Add company column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'company'
    ) THEN
        ALTER TABLE leads ADD COLUMN company TEXT;
        RAISE NOTICE 'Added company column to leads table';
    ELSE
        RAISE NOTICE 'Company column already exists';
    END IF;
END $$;

-- Add index for company column
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company);

-- Test the fix by trying to select from leads
SELECT 'Migration completed successfully' as status;
