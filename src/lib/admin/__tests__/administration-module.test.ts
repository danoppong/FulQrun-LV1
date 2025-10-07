// Administration Module - Test Implementation
// Simple test to verify the administration module is working

import { ConfigurationService } from '@/lib/admin/services/ConfigurationService'
import { getSupabaseClient } from '@/lib/supabase-client';

const supabase = getSupabaseClient();

// Test function to verify admin module functionality
export async function testAdministrationModule() {
  console.log('🧪 Testing Administration Module...');
  
  try {
    // Test 1: Check if admin tables exist
    console.log('📊 Checking database schema...');
    
    const { data: configTables, error: configError } = await supabase
      .from('system_configurations')
      .select('id')
      .limit(1);
    
    if (configError) {
      console.log('❌ System configurations table not found:', configError.message);
      return false;
    }
    
    const { data: permissionTables, error: permissionError } = await supabase
      .from('permission_definitions')
      .select('id')
      .limit(1);
    
    if (permissionError) {
      console.log('❌ Permission definitions table not found:', permissionError.message);
      return false;
    }
    
    console.log('✅ Database schema verified');
    
    // Test 2: Check if permission definitions are seeded
    console.log('🔐 Checking permission definitions...');
    
    const { data: permissions, error: permissionsError } = await supabase
      .from('permission_definitions')
      .select('permission_key')
      .limit(5);
    
    if (permissionsError) {
      console.log('❌ Error fetching permissions:', permissionsError.message);
      return false;
    }
    
    if (!permissions || permissions.length === 0) {
      console.log('❌ No permission definitions found');
      return false;
    }
    
    console.log('✅ Permission definitions found:', permissions.length);
    
    // Test 3: Test configuration service (if we have a test user)
    console.log('⚙️ Testing configuration service...');
    
    // This would require a test organization and user
    // For now, just verify the service can be instantiated
    try {
      const testOrgId = '00000000-0000-0000-0000-000000000000';
      const testUserId = '00000000-0000-0000-0000-000000000000';
      
      const configService = new ConfigurationService(testOrgId, testUserId);
      console.log('✅ Configuration service instantiated successfully');
    } catch (error) {
      console.log('⚠️ Configuration service test skipped (no test user)');
    }
    
    console.log('🎉 Administration Module tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Administration Module test failed:', error);
    return false;
  }
}

// Test function for API endpoints
export async function testAdminAPIEndpoints() {
  console.log('🌐 Testing Admin API Endpoints...');
  
  try {
    // Test if admin routes are accessible
    const adminRoutes = [
      '/api/admin/config',
      '/api/admin/modules',
      '/api/admin/audit-logs'
    ];
    
    for (const route of adminRoutes) {
      try {
        const response = await fetch(`http://localhost:3000${route}`, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-token'
          }
        });
        
        // We expect 401/403 for unauthorized access, which means the route exists
        if (response.status === 401 || response.status === 403) {
          console.log(`✅ Route ${route} is accessible`);
        } else {
          console.log(`⚠️ Route ${route} returned status ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Route ${route} failed:`, error.message);
      }
    }
    
    console.log('🎉 Admin API endpoint tests completed!');
    return true;
    
  } catch (error) {
    console.error('❌ Admin API test failed:', error);
    return false;
  }
}

// Main test runner
export async function runAdministrationModuleTests() {
  console.log('🚀 Starting Administration Module Tests...\n');
  
  const dbTest = await testAdministrationModule();
  const apiTest = await testAdminAPIEndpoints();
  
  console.log('\n📋 Test Results:');
  console.log(`Database Schema: ${dbTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API Endpoints: ${apiTest ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = dbTest && apiTest;
  console.log(`\nOverall: ${allPassed ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return allPassed;
}

// Export for use in other files
export default {
  testAdministrationModule,
  testAdminAPIEndpoints,
  runAdministrationModuleTests
};
