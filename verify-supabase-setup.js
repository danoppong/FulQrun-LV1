#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying FulQrun Supabase Setup...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('Please create .env.local with your Supabase credentials.');
  console.log('Copy env.production.example to .env.local and fill in your values.');
  process.exit(1);
}

// Read environment variables
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

envLines.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1];
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1];
  }
});

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials in .env.local!');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
  process.exit(1);
}

if (supabaseUrl.includes('your-project-id') || supabaseKey.includes('your_supabase_anon_key')) {
  console.log('❌ Please replace placeholder values in .env.local with your actual Supabase credentials!');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log(`📍 Supabase URL: ${supabaseUrl}`);

// Test Supabase connection
try {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔄 Testing Supabase connection...');
  
  // Test basic connection
  supabase.from('organizations').select('count').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Supabase connection failed:');
        console.log(`   Error: ${error.message}`);
        console.log('\n📋 Possible issues:');
        console.log('   1. Database schema not set up - run the migration files');
        console.log('   2. Incorrect credentials in .env.local');
        console.log('   3. Supabase project not active');
        process.exit(1);
      } else {
        console.log('✅ Supabase connection successful!');
        console.log('✅ Database schema appears to be set up correctly');
        console.log('\n🎉 FulQrun is ready to use!');
        console.log('\n📋 Next steps:');
        console.log('   1. Run: npm run dev');
        console.log('   2. Open: http://localhost:3000');
        console.log('   3. Create your first organization and user account');
      }
    })
    .catch(err => {
      console.log('❌ Connection test failed:', err.message);
      process.exit(1);
    });
    
} catch (err) {
  console.log('❌ Failed to create Supabase client:', err.message);
  process.exit(1);
}
