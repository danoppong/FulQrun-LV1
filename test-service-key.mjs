import { createClient } from '@supabase/supabase-js'

// Test the service role key configuration
async function testServiceRoleKey() {
  console.log('🧪 Testing SUPABASE_SERVICE_ROLE_KEY...')
  
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  if (!serviceKey) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment')
    return false
  }
  
  if (!url) {
    console.log('❌ NEXT_PUBLIC_SUPABASE_URL not found in environment')
    return false
  }
  
  console.log('✅ Service role key found:', serviceKey.substring(0, 20) + '...')
  console.log('✅ Supabase URL found:', url)
  
  try {
    // Try to create a client with the service role key
    const adminClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
    
    // Try a simple operation that requires service role
    const { data, error } = await adminClient.auth.admin.listUsers()
    
    if (error) {
      console.log('❌ Service role key test failed:', error.message)
      return false
    }
    
    console.log('✅ Service role key is working! Found', data?.users?.length || 0, 'users')
    return true
    
  } catch (error) {
    console.log('❌ Error testing service role key:', error.message)
    return false
  }
}

// Only run the test if this file is run directly
if (process.argv[1].endsWith('test-service-key.mjs')) {
  testServiceRoleKey().then(success => {
    process.exit(success ? 0 : 1)
  })
}

export { testServiceRoleKey }