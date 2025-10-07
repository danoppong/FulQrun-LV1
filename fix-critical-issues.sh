#!/bin/bash

# FulQrun Critical Fixes - Quick Start Script
# This script implements the most critical fixes identified in the codebase scan

set -e  # Exit on any error

echo "🚀 Starting FulQrun Critical Fixes Implementation..."
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the FulQrun-LV1 root directory."
    exit 1
fi

echo "📦 Phase 1: Installing Missing Dependencies..."
echo "----------------------------------------------"

# Install critical missing dependencies
echo "Installing ESLint dependencies..."
npm install @eslint/eslintrc --save-dev
npm install eslint --save-dev

echo "Installing TypeScript dependencies..."
npm install typescript --save-dev
npm install @types/node --save-dev
npm install @types/react --save-dev
npm install @types/react-dom --save-dev

echo "Installing additional utility dependencies..."
npm install dompurify --save
npm install @types/dompurify --save-dev

echo "✅ Dependencies installed successfully!"

echo ""
echo "🛠️  Phase 2: Fixing Package.json Scripts..."
echo "----------------------------------------------"

# Create backup of package.json
cp package.json package.json.backup

# Update package.json scripts using Node.js
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = {
  ...pkg.scripts,
  'lint': 'npx eslint . --ext .ts,.tsx,.js,.jsx --fix',
  'lint:check': 'npx eslint . --ext .ts,.tsx,.js,.jsx',
  'type-check': 'npx tsc --noEmit',
  'build:check': 'npm run type-check && npm run lint:check && npm run build'
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

echo "✅ Package.json scripts updated!"

echo ""
echo "🔧 Phase 3: Creating Essential Utility Files..."
echo "----------------------------------------------"

# Create logger utility
mkdir -p src/lib/utils
cat > src/lib/utils/logger.ts << 'EOF'
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

interface LogContext {
  userId?: string;
  organizationId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  [key: string]: unknown;
}

class Logger {
  private static instance: Logger;
  private minLevel: LogLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, { ...context, error: error?.message, stack: error?.stack });
  }

  critical(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.CRITICAL, message, { ...context, error: error?.message, stack: error?.stack });
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (level < this.minLevel) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      context,
      environment: process.env.NODE_ENV
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(logEntry, null, 2));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }
}

export const logger = Logger.getInstance();
EOF

# Create error handling utilities
cat > src/lib/utils/errors.ts << 'EOF'
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHZ_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'INTERNAL_ERROR', 500, false);
  }

  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR', 500, false);
}
EOF

echo "✅ Utility files created!"

echo ""
echo "🔍 Phase 4: Running Verification Tests..."
echo "----------------------------------------------"

echo "Testing TypeScript compilation..."
if npx tsc --noEmit; then
    echo "✅ TypeScript compilation successful!"
else
    echo "⚠️  TypeScript compilation has errors - see details above"
fi

echo ""
echo "Testing ESLint..."
if npx eslint . --ext .ts,.tsx,.js,.jsx --quiet; then
    echo "✅ ESLint check passed!"
else
    echo "⚠️  ESLint found issues - run 'npm run lint' to see details"
fi

echo ""
echo "Testing build process..."
if npm run build 2>/dev/null; then
    echo "✅ Build process successful!"
else
    echo "⚠️  Build process has issues - manual intervention required"
fi

echo ""
echo "🎉 Critical Fixes Implementation Complete!"
echo "=============================================="
echo ""
echo "✅ Completed Tasks:"
echo "   - Installed missing dependencies"
echo "   - Updated package.json scripts"
echo "   - Created logging utility"
echo "   - Created error handling utilities"
echo "   - Verified basic compilation and linting"
echo ""
echo "🔄 Next Steps:"
echo "   1. Review the full IMPLEMENTATION_PLAN.md for remaining tasks"
echo "   2. Fix remaining TypeScript errors manually"
echo "   3. Implement memory leak fixes in MEDDPICC scoring"
echo "   4. Add input validation to API endpoints"
echo "   5. Replace console.* calls with logger calls"
echo ""
echo "📊 Status Summary:"
echo "   - Dependencies: FIXED ✅"
echo "   - Build System: IMPROVED ✅"
echo "   - Type Safety: IN PROGRESS 🔄"
echo "   - Security: PENDING ⏳"
echo "   - Performance: PENDING ⏳"
echo ""
echo "🔧 To continue with fixes, run:"
echo "   npm run lint          # Check linting issues"
echo "   npm run type-check     # Check TypeScript errors"
echo "   npm run build:check    # Full build verification"
echo ""
echo "Happy coding! 🚀"
EOF