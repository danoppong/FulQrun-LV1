#!/bin/bash

# Vercel Deployment Script for FulQrun-LV1
# This script helps prepare and deploy your Next.js app to Vercel

set -e  # Exit on any error

echo "🚀 Starting Vercel deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_error "Git repository not initialized. Please run 'git init' first."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

print_status "Checking project status..."

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Please commit them first:"
    git status --short
    echo ""
    read -p "Do you want to commit all changes now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Prepare for Vercel deployment"
        print_success "Changes committed successfully"
    else
        print_error "Please commit your changes before deploying"
        exit 1
    fi
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_warning ".env.local not found. Creating template..."
    cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id_here
EOF
    print_warning "Please update .env.local with your actual values before deploying"
fi

# Run build test
print_status "Running build test..."
if npm run build; then
    print_success "Build test passed"
else
    print_error "Build test failed. Please fix the issues before deploying"
    exit 1
fi

# Check if already logged in to Vercel
if ! vercel whoami &> /dev/null; then
    print_status "Please log in to Vercel..."
    vercel login
fi

# Deploy to Vercel
print_status "Deploying to Vercel..."
if vercel --prod; then
    print_success "Deployment successful!"
    echo ""
    print_status "Next steps:"
    echo "1. Go to your Vercel dashboard"
    echo "2. Add environment variables in Settings → Environment Variables"
    echo "3. Update your Supabase project settings with the Vercel domain"
    echo "4. Test your deployed application"
    echo ""
    print_success "Your app should now be live on Vercel!"
else
    print_error "Deployment failed. Check the error messages above."
    exit 1
fi
