#!/bin/bash

# MFA Setup Verification Script
# Checks if all prerequisites are met for MFA implementation

echo "🔍 FulQrun MFA Setup Verification"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $2"
        ((FAILED++))
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $2"
        ((FAILED++))
    fi
}

# Function to check if npm package is installed
check_package() {
    if npm list "$1" --depth=0 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $2 installed"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $2 not installed"
        ((FAILED++))
    fi
}

# Function to check environment variable
check_env() {
    if grep -q "^$1=" .env.local 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $2 configured"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} $2 not configured (optional)"
        ((WARNINGS++))
    fi
}

echo "📚 1. Documentation Files"
echo "------------------------"
check_file "MFA_ARCHITECTURE.md" "Architecture documentation"
check_file "MFA_IMPLEMENTATION_GUIDE.md" "Implementation guide"
check_file "MFA_QUICK_REFERENCE.md" "Quick reference"
check_file "MFA_IMPLEMENTATION_STATUS.md" "Implementation status"
echo ""

echo "🗄️  2. Database Migration"
echo "------------------------"
check_file "supabase/migrations/20250930_mfa_architecture.sql" "MFA migration file"
echo ""

echo "🔐 3. Authentication Factor Implementations"
echo "-------------------------------------------"
check_file "src/lib/auth/mfa-service.ts" "MFA Service"
check_file "src/lib/auth/risk-engine.ts" "Risk Engine"
check_file "src/lib/auth/factors/totp-factor.ts" "TOTP Factor"
check_file "src/lib/auth/factors/password-factor.ts" "Password Factor"
check_file "src/lib/auth/factors/backup-codes.ts" "Backup Codes"
check_file "src/lib/auth/factors/email-otp-factor.ts" "Email OTP"
check_file "src/lib/auth/factors/sms-otp-factor.ts" "SMS OTP"
check_file "src/lib/auth/factors/webauthn-factor.ts" "WebAuthn"
echo ""

echo "📦 4. NPM Packages"
echo "-----------------"
check_package "otplib" "otplib"
check_package "qrcode" "qrcode"
check_package "@simplewebauthn/server" "@simplewebauthn/server"
check_package "@simplewebauthn/browser" "@simplewebauthn/browser"
check_package "bcrypt" "bcrypt"
echo ""

echo "🔧 5. Environment Configuration (Optional)"
echo "------------------------------------------"
check_env "MFA_ENFORCEMENT_MODE" "MFA enforcement mode"
check_env "TWILIO_ACCOUNT_SID" "Twilio credentials"
check_env "NEXT_PUBLIC_RP_ID" "WebAuthn RP ID"
check_env "AUTH_SECRET" "Auth secret"
echo ""

echo "📊 Summary"
echo "=========="
echo -e "${GREEN}Passed:${NC} $PASSED"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed:${NC} $FAILED"
fi
if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
fi
echo ""

# Overall status
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ MFA Setup Ready!${NC}"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Apply database migration via Supabase Dashboard"
    echo "2. Configure environment variables in .env.local"
    echo "3. Create API routes (see MFA_IMPLEMENTATION_GUIDE.md)"
    echo "4. Build UI components"
    echo ""
    echo "Run: cat supabase/migrations/20250930_mfa_architecture.sql | pbcopy"
    echo "Then paste into: https://app.supabase.com/project/YOUR_PROJECT/sql"
else
    echo -e "${RED}✗ Setup Incomplete${NC}"
    echo ""
    echo "Please address the failed checks above."
    echo "Refer to MFA_IMPLEMENTATION_GUIDE.md for details."
fi

exit 0
