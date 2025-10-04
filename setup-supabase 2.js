#!/usr/bin/env node

import readline from 'readline';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 FulQrun Supabase Setup');
console.log('========================\n');

console.log('Please enter your Supabase credentials:');
console.log('(You can find these in your Supabase project dashboard → Settings → API)\n');

rl.question('Enter your Supabase Project URL (https://your-project.supabase.co): ', (url) => {
  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    console.log('❌ Invalid URL format. Please make sure it starts with https:// and contains .supabase.co');
    rl.close();
    return;
  }

  rl.question('Enter your Supabase Anon Key (starts with eyJ...): ', (key) => {
    if (!key.startsWith('eyJ')) {
      console.log('❌ Invalid key format. Please make sure it starts with eyJ');
      rl.close();
      return;
    }

    // Create .env.local content
    const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${key}

# Microsoft Graph Configuration (for future integration)
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=your_microsoft_tenant_id

# QuickBooks Configuration (for future integration)
QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
QUICKBOOKS_CLIENT_SECRET=your_quickbooks_client_secret`;

    // Write to .env.local
    const envPath = path.join(__dirname, '.env.local');
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ .env.local file created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of supabase/migrations/001_initial_schema.sql');
    console.log('4. Click "Run" to execute the migration');
    console.log('5. Restart your development server: npm run dev');
    console.log('\n🎉 Your FulQrun app will then be fully functional!');

    rl.close();
  });
});
