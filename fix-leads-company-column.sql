-- Comprehensive fix for leads table schema issues
-- Run this in Supabase SQL Editor to fix all leads table issues

-- Fix company column issue and add missing columns
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
    
    -- Add title column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'title'
    ) THEN
        ALTER TABLE leads ADD COLUMN title TEXT;
        RAISE NOTICE 'Added title column';
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'notes'
    ) THEN
        ALTER TABLE leads ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column';
    END IF;
    
    -- Add assigned_to column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'assigned_to'
    ) THEN
        ALTER TABLE leads ADD COLUMN assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added assigned_to column';
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company);
CREATE INDEX IF NOT EXISTS idx_leads_title ON leads(title);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);

-- Completion message
DO $$ 
BEGIN
    RAISE NOTICE 'Leads table schema migration completed successfully!';
    RAISE NOTICE 'Fixed company column and added missing fields: title, notes, assigned_to';
END $$;
