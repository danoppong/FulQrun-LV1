-- Add audit columns to qualification_framework_settings table if they don't exist

-- Add created_by column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qualification_framework_settings' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE qualification_framework_settings 
        ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
END $$;

-- Add updated_by column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qualification_framework_settings' 
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE qualification_framework_settings 
        ADD COLUMN updated_by UUID REFERENCES users(id);
    END IF;
END $$;

-- Add created_at column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qualification_framework_settings' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE qualification_framework_settings 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add updated_at column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qualification_framework_settings' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE qualification_framework_settings 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

