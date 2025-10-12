#!/usr/bin/env node

// Script to add region and country columns to users table
// Run this with: node run-migration.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://khwkwuefwxazewlspdvk.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtod2t3dWVmd3hhemV3bHNwZHZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcxNTgxMywiZXhwIjoyMDc0MjkxODEzfQ.0XBxZ02f2YvYs4xrRgOvyvVZ5MLeLtMRjF1rEjBwSmY'

async function runMigration() {
  console.log('🚀 Starting migration: Add region and country columns to users table...')

  // Create admin client
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  try {
    // Step 1: Add region column
    console.log('📝 Adding region column...')
    const { error: regionError } = await admin.rpc('exec', { 
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS region TEXT;` 
    })
    if (regionError) {
      console.error('❌ Error adding region column:', regionError)
    } else {
      console.log('✅ Region column added successfully')
    }

    // Step 2: Add country column  
    console.log('📝 Adding country column...')
    const { error: countryError } = await admin.rpc('exec', { 
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;` 
    })
    if (countryError) {
      console.error('❌ Error adding country column:', countryError)
    } else {
      console.log('✅ Country column added successfully')
    }

    // Step 3: Add indexes
    console.log('📝 Adding indexes...')
    const { error: indexError } = await admin.rpc('exec', { 
      sql: `
        CREATE INDEX IF NOT EXISTS idx_users_region ON users(region) WHERE region IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_users_country ON users(country) WHERE country IS NOT NULL;
      ` 
    })
    if (indexError) {
      console.error('❌ Error creating indexes:', indexError)
    } else {
      console.log('✅ Indexes created successfully')
    }

    // Step 4: Migrate data from user_profiles
    console.log('📝 Migrating existing data...')
    const { error: migrateError } = await admin.rpc('exec', { 
      sql: `
        UPDATE users 
        SET 
          region = COALESCE(users.region, up.region),
          country = COALESCE(users.country, up.country)
        FROM user_profiles up 
        WHERE users.id = up.user_id 
          AND (up.region IS NOT NULL OR up.country IS NOT NULL)
          AND (users.region IS NULL OR users.country IS NULL);
      ` 
    })
    if (migrateError) {
      console.error('❌ Error migrating data:', migrateError)
    } else {
      console.log('✅ Data migration completed successfully')
    }

    console.log('🎉 Migration completed! Region and country columns are now available in the users table.')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()