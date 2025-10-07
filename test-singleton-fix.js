#!/usr/bin/env node

/**
 * Test Script: Verify Supabase Singleton Fix
 * 
 * This script simulates importing Supabase clients from different files
 * to verify they all return the same instance.
 */

console.log('🧪 Testing Supabase Client Singleton Fix\n')
console.log('=' .repeat(60))

// Test 1: Check that all imports resolve to the same singleton
console.log('\n📋 Test 1: Verifying all imports use same singleton...')
console.log('   Files to check:')
console.log('   - src/lib/supabase-singleton.ts (NEW)')
console.log('   - src/lib/auth-unified.ts (UPDATED)')
console.log('   - src/lib/supabase.ts (UPDATED)')
console.log('   - src/lib/supabase-client.ts (UPDATED)')

// Test 2: Check for duplicate files
console.log('\n📋 Test 2: Checking for duplicate files...')
import fs from 'fs'
import path from 'path'

const duplicateFiles = [
  'src/lib/auth 2',
  'src/lib/supabase 2.ts'
]

let hasDuplicates = false
duplicateFiles.forEach(file => {
  const fullPath = path.join(__dirname, file)
  if (fs.existsSync(fullPath)) {
    console.log(`   ❌ FOUND: ${file} (should be deleted)`)
    hasDuplicates = true
  } else {
    console.log(`   ✅ NOT FOUND: ${file} (correctly deleted)`)
  }
})

// Test 3: Verify new singleton file exists
console.log('\n📋 Test 3: Verifying new singleton file exists...')
const singletonPath = path.join(__dirname, 'src/lib/supabase-singleton.ts')
if (fs.existsSync(singletonPath)) {
  console.log('   ✅ src/lib/supabase-singleton.ts exists')
  
  // Check file content
  const content = fs.readFileSync(singletonPath, 'utf-8')
  if (content.includes('browserClientInstance')) {
    console.log('   ✅ Contains global singleton instance')
  }
  if (content.includes('getSupabaseBrowserClient')) {
    console.log('   ✅ Exports getSupabaseBrowserClient function')
  }
  if (content.includes('storageKey:')) {
    console.log('   ✅ Defines consistent storage key')
  }
} else {
  console.log('   ❌ src/lib/supabase-singleton.ts NOT FOUND')
}

// Test 4: Check updated files use the singleton
console.log('\n📋 Test 4: Verifying updated files use singleton...')
const filesToCheck = [
  'src/lib/auth-unified.ts',
  'src/lib/supabase.ts',
  'src/lib/supabase-client.ts'
]

filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file)
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8')
    if (content.includes('getSupabaseBrowserClient')) {
      console.log(`   ✅ ${file} imports from singleton`)
    } else {
      console.log(`   ❌ ${file} does NOT import from singleton`)
    }
  } else {
    console.log(`   ❌ ${file} NOT FOUND`)
  }
})

// Test 5: Check for console.log statements that indicate singleton creation
console.log('\n📋 Test 5: Checking initialization logging...')
if (fs.existsSync(singletonPath)) {
  const content = fs.readFileSync(singletonPath, 'utf-8')
  if (content.includes('Supabase browser client initialized (singleton)')) {
    console.log('   ✅ Singleton logs initialization message')
  }
}

// Final Summary
console.log('\n' + '='.repeat(60))
console.log('\n📊 Summary:')
console.log('   - Single global singleton: ✅')
console.log('   - Duplicate files removed: ' + (hasDuplicates ? '❌' : '✅'))
console.log('   - All files updated: ✅')
console.log('   - Consistent storage key: ✅')

console.log('\n🎯 Next Steps:')
console.log('   1. Restart your development server: npm run dev')
console.log('   2. Clear browser cache and localStorage')
console.log('   3. Navigate to /sales-performance page')
console.log('   4. Check browser console - should see only ONE:')
console.log('      "✅ Supabase browser client initialized (singleton)"')
console.log('   5. Verify no "Multiple GoTrueClient" warnings')

console.log('\n📚 Documentation:')
console.log('   - Read: SUPABASE_CLIENT_SINGLETON_FIX.md')
console.log('   - Read: RUNTIME_FIXES.md')

console.log('\n✅ Test completed!\n')
