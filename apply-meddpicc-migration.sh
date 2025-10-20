#!/bin/bash

# MEDDPICC Database Migration Script
# Run this script when Docker/Supabase local environment is available

echo "🚀 Applying MEDDPICC Configuration Management Migration..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    echo ""
    echo "📋 Manual Steps:"
    echo "   1. Start Docker Desktop"
    echo "   2. Run: npx supabase start"
    echo "   3. Run: npx supabase db push"
    echo "   4. Navigate to: http://localhost:3008/admin/modules/meddpicc"
    echo ""
    echo "� Alternative: Apply migration directly to remote database"
    echo "   Use Supabase dashboard SQL editor to run:"
    echo "   📄 supabase/migrations/045_meddpicc_configuration_management.sql"
    exit 1
fi

# Check if Supabase CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ NPX/Node.js not found. Please install Node.js first."
    exit 1
fi

# Apply the migration
echo "📦 Applying migration 045_meddpicc_configuration_management.sql..."

# Try to apply with Supabase CLI
if npx supabase db push; then
    echo "✅ MEDDPICC configuration migration applied successfully!"
    echo ""
    echo "🎯 The following features are now available:"
    echo "   • Dynamic MEDDPICC pillar configuration"
    echo "   • Question management with real-time validation"
    echo "   • Weight distribution controls (totaling 100%)"
    echo "   • Algorithm threshold configuration"
    echo "   • Configuration import/export"
    echo "   • Audit trail and version history"
    echo ""
    echo "🔗 Access the admin interface at: http://localhost:3008/admin/modules/meddpicc"
    echo ""
    echo "🧪 Test the API:"
    echo "   GET  http://localhost:3008/api/admin/meddpicc-config"
    echo "   PUT  http://localhost:3008/api/admin/meddpicc-config"
    echo "   POST http://localhost:3008/api/admin/meddpicc-config"
else
    echo "❌ Migration failed. Trying alternative approach..."
    echo ""
    echo "🔧 Manual Database Setup:"
    echo "   1. Open your Supabase dashboard"
    echo "   2. Go to SQL Editor"
    echo "   3. Run the migration file: 045_meddpicc_configuration_management.sql"
    echo ""
    echo "📄 Migration file location:"
    echo "   $(pwd)/supabase/migrations/045_meddpicc_configuration_management.sql"
    echo ""
    echo "💻 Frontend is ready and functional:"
    echo "   • Admin interface: http://localhost:3008/admin/modules/meddpicc"
    echo "   • Uses default configuration until database is connected"
    exit 1
fi