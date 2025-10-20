#!/usr/bin/env node

// Script to add region and country columns to users table
// Run this with: node run-migration.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

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