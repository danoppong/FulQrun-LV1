-- Fix leads table company column issue
-- The application expects 'company' but the schema has 'company_name'

-- Add company column if it doesn't exist
DO $$ 
BEGIN
    -- Check if company column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'company'
    ) THEN
        -- If company_name exists, copy its data to company and drop company_name
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'leads' AND column_name = 'company_name'
        ) THEN
            -- Add company column
            ALTER TABLE leads ADD COLUMN company TEXT;
            
            -- Copy data from company_name to company
            UPDATE leads SET company = company_name WHERE company_name IS NOT NULL;
            
            -- Drop company_name column
            ALTER TABLE leads DROP COLUMN company_name;
            
            RAISE NOTICE 'Migrated company_name to company column';
        ELSE
            -- Just add company column if company_name doesn't exist
            ALTER TABLE leads ADD COLUMN company TEXT;
            RAISE NOTICE 'Added company column';
        END IF;
    ELSE
        RAISE NOTICE 'Company column already exists';
    END IF;
END $$;

-- Add index for company column for better search performance
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company);

-- Completion message
DO $$ 
BEGIN
    RAISE NOTICE 'Leads company column migration completed successfully!';
END $$;
