#!/bin/bash

# FulQrun Production Deployment Script
# This script handles the complete deployment process

set -e

echo "🚀 Starting FulQrun Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        print_error "NEXT_PUBLIC_SUPABASE_URL is not set"
        exit 1
    fi
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        print_error "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"
        exit 1
    fi
    
    print_status "Environment variables validated ✓"
}

# Run pre-deployment checks
pre_deployment_checks() {
    print_status "Running pre-deployment checks..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the project root?"
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_warning "Node.js version 18+ is recommended. Current: $(node -v)"
    fi
    
    print_status "Pre-deployment checks passed ✓"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci --production=false
    print_status "Dependencies installed ✓"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    npm test -- --coverage --watchAll=false
    print_status "Tests passed ✓"
}

# Run linting
run_linting() {
    print_status "Running linting..."
    npm run lint
    print_status "Linting passed ✓"
}

# Build the application
build_application() {
    print_status "Building application..."
    npm run build
    print_status "Application built successfully ✓"
}

# Deploy to Vercel (if Vercel CLI is available)
deploy_vercel() {
    if command -v vercel &> /dev/null; then
        print_status "Deploying to Vercel..."
        vercel --prod
        print_status "Deployed to Vercel ✓"
    else
        print_warning "Vercel CLI not found. Skipping Vercel deployment."
        print_status "To deploy to Vercel, install the CLI: npm i -g vercel"
    fi
}

# Main deployment function
main() {
    echo "=========================================="
    echo "  FulQrun Production Deployment Script"
    echo "=========================================="
    
    check_env_vars
    pre_deployment_checks
    install_dependencies
    run_tests
    run_linting
    build_application
    
    # Ask user for deployment target
    echo ""
    echo "Select deployment target:"
    echo "1) Vercel"
    echo "2) Docker"
    echo "3) Manual (build only)"
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1)
            deploy_vercel
            ;;
        2)
            print_status "Building Docker image..."
            docker build -t fulqrun:latest .
            print_status "Docker image built ✓"
            print_status "To run: docker run -p 3000:3000 fulqrun:latest"
            ;;
        3)
            print_status "Build completed. Ready for manual deployment."
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    echo ""
    print_status "🎉 Deployment completed successfully!"
    echo "=========================================="
}

# Run main function
main "$@"
