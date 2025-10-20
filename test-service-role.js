// Test script to verify service role key functionality
import fetch from 'node-fetch';

async function testServiceRole() {
  console.log('🧪 Testing Service Role Key functionality...');
  
  try {
    // Test the migration endpoint first (it requires service role)
    console.log('1. Testing migration endpoint...');
    const migrationResponse = await fetch('http://localhost:3000/api/admin/migrate-organization-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const migrationResult = await migrationResponse.text();
    console.log(`Migration response (${migrationResponse.status}):`, migrationResult);
    
    if (migrationResponse.status === 200) {
      console.log('✅ Service role key is working - migration endpoint accessible');
    } else if (migrationResponse.status === 500 && migrationResult.includes('Service role key not configured')) {
      console.log('❌ Service role key is NOT working - key not configured');
    } else {
      console.log('⚠️ Service role key status unclear - unexpected response');
    }
    
  } catch (error) {
    console.error('❌ Error testing service role:', error.message);
  }
}

testServiceRole();