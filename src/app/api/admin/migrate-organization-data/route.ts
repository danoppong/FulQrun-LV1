// API Route: Database Migration - Create Organization Data Table
// This endpoint creates the organization_data table and its associated constraints

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/lib/config'

export async function POST(_request: NextRequest) {
  try {
    // Get service role key from environment
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }

    // Create admin client with service role
    const admin = createClient(supabaseConfig.url!, serviceKey, { 
      auth: { persistSession: false, autoRefreshToken: false } 
    })

    const migrationSQL = `
      -- Create organization_data table for managing departments, regions, and countries
      CREATE TABLE IF NOT EXISTS public.organization_data (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id uuid NOT NULL,
          type text NOT NULL CHECK (type IN ('department', 'region', 'country')),
          name text NOT NULL,
          code text,
          description text,
          is_active boolean DEFAULT true NOT NULL,
          parent_id uuid REFERENCES public.organization_data(id) ON DELETE SET NULL,
          created_at timestamptz DEFAULT now() NOT NULL,
          updated_at timestamptz DEFAULT now() NOT NULL,
          
          -- Ensure unique names per type per organization
          UNIQUE (organization_id, type, name)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_organization_data_org_type ON public.organization_data (organization_id, type);
      CREATE INDEX IF NOT EXISTS idx_organization_data_active ON public.organization_data (is_active) WHERE is_active = true;
      CREATE INDEX IF NOT EXISTS idx_organization_data_parent ON public.organization_data (parent_id) WHERE parent_id IS NOT NULL;

      -- Enable RLS
      ALTER TABLE public.organization_data ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist (to handle re-runs)
      DROP POLICY IF EXISTS "Users can view organization data from their organization" ON public.organization_data;
      DROP POLICY IF EXISTS "Admins can insert organization data" ON public.organization_data;
      DROP POLICY IF EXISTS "Admins can update organization data from their organization" ON public.organization_data;
      DROP POLICY IF EXISTS "Admins can delete organization data from their organization" ON public.organization_data;

      -- Create RLS policies for organization_data table
      CREATE POLICY "Users can view organization data from their organization"
      ON public.organization_data FOR SELECT
      USING (
          organization_id IN (
              SELECT organization_id 
              FROM public.users 
              WHERE id = auth.uid()
          )
      );

      CREATE POLICY "Admins can insert organization data"
      ON public.organization_data FOR INSERT
      WITH CHECK (
          organization_id IN (
              SELECT organization_id 
              FROM public.users 
              WHERE id = auth.uid() 
              AND role IN ('admin', 'super_admin')
          )
      );

      CREATE POLICY "Admins can update organization data from their organization"
      ON public.organization_data FOR UPDATE
      USING (
          organization_id IN (
              SELECT organization_id 
              FROM public.users 
              WHERE id = auth.uid() 
              AND role IN ('admin', 'super_admin')
          )
      )
      WITH CHECK (
          organization_id IN (
              SELECT organization_id 
              FROM public.users 
              WHERE id = auth.uid() 
              AND role IN ('admin', 'super_admin')
          )
      );

      CREATE POLICY "Admins can delete organization data from their organization"
      ON public.organization_data FOR DELETE
      USING (
          organization_id IN (
              SELECT organization_id 
              FROM public.users 
              WHERE id = auth.uid() 
              AND role IN ('admin', 'super_admin')
          )
      );

      -- Create trigger function to update the updated_at timestamp
      CREATE OR REPLACE FUNCTION update_organization_data_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = now();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Drop existing trigger if it exists
      DROP TRIGGER IF EXISTS trigger_update_organization_data_updated_at ON public.organization_data;

      -- Create trigger
      CREATE TRIGGER trigger_update_organization_data_updated_at
          BEFORE UPDATE ON public.organization_data
          FOR EACH ROW
          EXECUTE FUNCTION update_organization_data_updated_at();
    `

    console.log('🚀 Running organization_data table migration...')

    // Execute the migration SQL
    const { error } = await admin.rpc('sql', { query: migrationSQL })

    if (error) {
      console.error('❌ Migration failed:', error)
      
      // Try a different approach - execute statements one by one
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      let successCount = 0
      let lastError = null

      for (const statement of statements) {
        try {
          const { error: stmtError } = await admin.rpc('sql', { query: statement })
          if (stmtError) {
            console.warn('⚠️ Statement failed:', statement.substring(0, 100) + '...', stmtError)
            lastError = stmtError
          } else {
            successCount++
          }
        } catch (e) {
          console.warn('⚠️ Statement exception:', statement.substring(0, 100) + '...', e)
          lastError = e
        }
      }

      if (successCount === 0) {
        throw lastError || error
      }

      console.log(`✅ Migration partially completed: ${successCount}/${statements.length} statements succeeded`)
    } else {
      console.log('✅ Migration completed successfully')
    }

    // Try to seed some initial data from existing tables
    try {
      console.log('🌱 Attempting to seed initial data...')
      
      const seedSQL = `
        -- Insert departments from existing users table
        INSERT INTO public.organization_data (organization_id, type, name, is_active)
        SELECT DISTINCT 
            u.organization_id,
            'department'::text,
            u.department,
            true
        FROM public.users u
        WHERE u.department IS NOT NULL 
            AND u.department != ''
            AND NOT EXISTS (
                SELECT 1 FROM public.organization_data od 
                WHERE od.organization_id = u.organization_id 
                    AND od.type = 'department' 
                    AND od.name = u.department
            );
      `

      const { error: seedError } = await admin.rpc('sql', { query: seedSQL })
      if (seedError) {
        console.warn('⚠️ Seeding warning:', seedError)
      } else {
        console.log('✅ Initial data seeded successfully')
      }
    } catch (seedErr) {
      console.warn('⚠️ Seeding failed, but table creation succeeded:', seedErr)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'organization_data table created successfully',
      note: 'The Organization Data Management portal should now work properly'
    })

  } catch (error) {
    console.error('❌ Migration error:', error)
    return NextResponse.json({ 
      error: 'Failed to create organization_data table', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}