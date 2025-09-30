# Multi-Factor Authentication Implementation Guide

**Version:** 1.0  
**Date:** September 30, 2025  
**For:** FulQrun Development Team

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Core Implementation](#core-implementation)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## 1. Quick Start

### Installation

```bash
# 1. Navigate to project directory
cd /Users/daniel/Documents/GitHub/FulQrun-LV1

# 2. Install dependencies
npm install @supabase/supabase-js otplib qrcode @simplewebauthn/server @simplewebauthn/browser twilio

# 3. Install dev dependencies
npm install --save-dev @types/qrcode

# 4. Run database migration
npx supabase db push supabase/migrations/20250930_mfa_architecture.sql

# 5. Verify setup
npm run test:mfa
```

---

## 2. Prerequisites

### Required Services

✅ **Supabase Project**
- URL: `https://your-project.supabase.co`
- Anon Key: From Supabase dashboard
- Service Role Key: From Supabase dashboard

✅ **Twilio Account** (for SMS OTP)
- Account SID
- Auth Token
- Phone Number

✅ **Email Service** (Supabase handles this by default)

✅ **Redis/Upstash** (for rate limiting)
- Redis URL
- Redis Token

### Required npm Packages

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "otplib": "^12.0.1",
    "qrcode": "^1.5.3",
    "@simplewebauthn/server": "^9.0.0",
    "@simplewebauthn/browser": "^9.0.0",
    "twilio": "^4.20.0",
    "bcrypt": "^5.1.1"
  }
}
```

---

## 3. Database Setup

### Step 1: Run Migration

```bash
# Using Supabase CLI
npx supabase db push

# Or manually via Supabase Dashboard
# Copy contents of supabase/migrations/20250930_mfa_architecture.sql
# Paste into SQL Editor and run
```

### Step 2: Verify Tables

```sql
-- Check if all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%mfa%' 
   OR table_name LIKE '%session%'
   OR table_name LIKE '%auth%'
ORDER BY table_name;
```

Expected output should include:
- `user_mfa_factors`
- `mfa_policies`
- `user_mfa_settings`
- `mfa_challenges`
- `backup_codes`
- `webauthn_credentials`
- `user_sessions`
- `trusted_devices`
- `auth_audit_log`
- And more...

### Step 3: Configure RLS Policies

RLS policies are automatically created by the migration. Verify with:

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

---

## 4. Environment Configuration

### Create/Update `.env.local`

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# MFA Configuration
MFA_ENFORCEMENT_MODE=optional
MFA_ALLOWED_FACTORS=totp,webauthn,email,sms
MFA_GRACE_PERIOD_HOURS=24
MFA_MAX_FACTORS_PER_USER=5

# Security Keys
AUTH_SECRET=your-256-bit-random-secret
ENCRYPTION_KEY=your-aes-256-encryption-key
JWT_SECRET=your-jwt-secret

# Twilio (SMS OTP)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Redis (Rate Limiting)
UPSTASH_REDIS_URL=https://your-redis.upstash.io
UPSTASH_REDIS_TOKEN=your-redis-token

# WebAuthn
NEXT_PUBLIC_RP_ID=fulqrun.com
NEXT_PUBLIC_RP_NAME=FulQrun
NEXT_PUBLIC_APP_URL=https://app.fulqrun.com

# Risk Assessment (Optional)
IPQUALITYSCORE_API_KEY=your-ipqs-key
MAXMIND_LICENSE_KEY=your-maxmind-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### Generate Secrets

```bash
# Generate secure random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 5. Core Implementation

### Step 1: Create Factor Implementations

#### TOTP Factor

```typescript
// src/lib/auth/factors/totp-factor.ts
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import { SupabaseClient } from '@supabase/supabase-js'

export class TOTPAuthenticationFactor {
  constructor(private supabase: SupabaseClient) {}

  async enroll(userId: string, data: { email: string }) {
    // Generate secret
    const secret = authenticator.generateSecret()
    
    // Create OTP auth URL
    const otpauthUrl = authenticator.keyuri(
      data.email,
      'FulQrun',
      secret
    )
    
    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)
    
    // Store in database (encrypted)
    const { data: factor, error } = await this.supabase
      .from('user_mfa_factors')
      .insert({
        user_id: userId,
        factor_type: 'totp',
        factor_name: 'Authenticator App',
        factor_data: { secret } // Should be encrypted in production
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      factorId: factor.id,
      secret,
      qrCode: qrCodeDataUrl,
      otpauthUrl
    }
  }
  
  async verify(userId: string, verification: { code: string }) {
    // Get user's TOTP factor
    const { data: factor } = await this.supabase
      .from('user_mfa_factors')
      .select('factor_data')
      .eq('user_id', userId)
      .eq('factor_type', 'totp')
      .single()
    
    if (!factor) return false
    
    const secret = factor.factor_data.secret
    
    // Verify code
    const isValid = authenticator.verify({
      token: verification.code,
      secret
    })
    
    return isValid
  }
}
```

### Step 2: Create API Routes

#### Enrollment API

```typescript
// src/app/api/auth/mfa/enroll/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { MFAService } from '@/lib/auth/mfa-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse request
    const { factorType, enrollmentData } = await request.json()
    
    // Initialize MFA service
    const mfaService = new MFAService({
      supabase,
      // ... config
    })
    
    // Enroll factor
    const enrollment = await mfaService.enrollFactor(
      user.id,
      factorType,
      enrollmentData
    )
    
    return NextResponse.json({
      success: true,
      enrollment
    })
    
  } catch (error) {
    console.error('Enrollment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Enrollment failed' },
      { status: 500 }
    )
  }
}
```

#### Verification API

```typescript
// src/app/api/auth/mfa/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { MFAService } from '@/lib/auth/mfa-service'

export async function POST(request: NextRequest) {
  try {
    const { challengeId, factorType, verification } = await request.json()
    
    // Get context
    const context = {
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
      deviceInfo: {
        userAgent: request.headers.get('user-agent') || '',
        // ... other device info
      },
      timestamp: Date.now()
    }
    
    const mfaService = new MFAService(/* config */)
    
    const result = await mfaService.verifyMFAChallenge(
      challengeId,
      factorType,
      verification,
      context
    )
    
    if (result.success) {
      // Set session cookies
      const response = NextResponse.json(result)
      response.cookies.set('session_token', result.accessToken!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 24 hours
      })
      return response
    }
    
    return NextResponse.json(result, { status: 400 })
    
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    )
  }
}
```

### Step 3: Create UI Components

#### MFA Enrollment Component

```typescript
// src/components/auth/MFAEnrollment.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'

export function MFAEnrollment() {
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  
  const handleEnrollTOTP = async () => {
    const response = await fetch('/api/auth/mfa/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        factorType: 'totp',
        enrollmentData: { email: user.email }
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      setQrCode(data.enrollment.qrCode)
      setSecret(data.enrollment.secret)
    }
  }
  
  const handleVerifyEnrollment = async () => {
    // Verify the enrollment with a test code
    const response = await fetch('/api/auth/mfa/verify-enrollment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        factorId: enrollmentData.factorId,
        code: verificationCode
      })
    })
    
    if (response.ok) {
      alert('MFA enrolled successfully!')
      // Redirect to dashboard
    }
  }
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Set Up Two-Factor Authentication</h2>
      
      {!qrCode ? (
        <div>
          <p className="mb-4">
            Enhance your account security by adding two-factor authentication.
          </p>
          <button
            onClick={handleEnrollTOTP}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Set Up Authenticator App
          </button>
        </div>
      ) : (
        <div>
          <p className="mb-4">
            Scan this QR code with your authenticator app:
          </p>
          <div className="flex justify-center mb-4">
            <Image src={qrCode} alt="QR Code" width={200} height={200} />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Or enter this secret manually: <code className="bg-gray-100 px-2 py-1">{secret}</code>
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Enter verification code:
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="000000"
              maxLength={6}
            />
          </div>
          
          <button
            onClick={handleVerifyEnrollment}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            disabled={verificationCode.length !== 6}
          >
            Verify and Enable
          </button>
        </div>
      )}
    </div>
  )
}
```

#### MFA Verification Component

```typescript
// src/components/auth/MFAVerification.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MFAVerificationProps {
  challengeId: string
  availableFactors: Array<{ type: string; name: string }>
}

export function MFAVerification({ challengeId, availableFactors }: MFAVerificationProps) {
  const router = useRouter()
  const [selectedFactor, setSelectedFactor] = useState(availableFactors[0]?.type)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleVerify = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          factorType: selectedFactor,
          verification: { code }
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        router.push('/dashboard')
      } else {
        setError(data.message || 'Verification failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Verify Your Identity</h2>
      
      {availableFactors.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Choose verification method:
          </label>
          <select
            value={selectedFactor}
            onChange={(e) => setSelectedFactor(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {availableFactors.map(factor => (
              <option key={factor.type} value={factor.type}>
                {factor.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Enter verification code:
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className="w-full border rounded px-3 py-2 text-center text-2xl tracking-widest"
          placeholder="000000"
          maxLength={6}
          autoFocus
        />
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <button
        onClick={handleVerify}
        disabled={code.length !== 6 || loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Verifying...' : 'Verify'}
      </button>
      
      <div className="mt-4 text-center">
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={() => {/* Show backup code option */}}
        >
          Use backup code instead
        </button>
      </div>
    </div>
  )
}
```

### Step 4: Update Login Flow

```typescript
// src/app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MFAVerification } from '@/components/auth/MFAVerification'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaRequired, setMfaRequired] = useState(false)
  const [challengeData, setChallengeData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (data.success) {
        router.push('/dashboard')
      } else if (data.requireMFA) {
        setMfaRequired(true)
        setChallengeData({
          challengeId: data.challengeId,
          availableFactors: data.availableFactors
        })
      } else if (data.requireEnrollment) {
        router.push('/auth/mfa/enroll')
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  if (mfaRequired && challengeData) {
    return (
      <MFAVerification
        challengeId={challengeData.challengeId}
        availableFactors={challengeData.availableFactors}
      />
    )
  }
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Sign In</h1>
      
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
```

---

## 6. Testing

### Unit Tests

```typescript
// src/__tests__/mfa-service.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals'
import { MFAService } from '@/lib/auth/mfa-service'

describe('MFAService', () => {
  let mfaService: MFAService
  
  beforeEach(() => {
    // Initialize service with test config
    mfaService = new MFAService({
      // ... test config
    })
  })
  
  describe('Factor Enrollment', () => {
    it('should enroll TOTP factor', async () => {
      const enrollment = await mfaService.enrollFactor(
        'test-user-id',
        'totp',
        { email: 'test@example.com' }
      )
      
      expect(enrollment).toHaveProperty('secret')
      expect(enrollment).toHaveProperty('qrCode')
    })
    
    it('should enforce max factors limit', async () => {
      // Test implementation
    })
  })
  
  describe('Factor Verification', () => {
    it('should verify valid TOTP code', async () => {
      // Test implementation
    })
    
    it('should reject invalid TOTP code', async () => {
      // Test implementation
    })
  })
})
```

### Integration Tests

```bash
# Run all MFA tests
npm run test:mfa

# Run specific test file
npm test src/__tests__/mfa-service.test.ts
```

---

## 7. Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies tested
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Backup and rollback plan ready

### Deployment Steps

```bash
# 1. Build application
npm run build

# 2. Run production database migrations
npx supabase db push --db-url $PRODUCTION_DATABASE_URL

# 3. Deploy to Vercel
vercel --prod

# 4. Verify deployment
curl https://app.fulqrun.com/api/health

# 5. Monitor logs
vercel logs --prod
```

### Post-Deployment

1. **Monitor Authentication Metrics**
   - Login success rate
   - MFA enrollment rate
   - MFA verification time
   - Failed authentication attempts

2. **Check Error Logs**
   - Review Sentry for errors
   - Check Supabase logs
   - Monitor Vercel logs

3. **User Communication**
   - Announce MFA availability
   - Provide setup guides
   - Offer support channels

---

## 8. Troubleshooting

### Common Issues

#### Issue: TOTP codes not verifying

**Solution:**
```typescript
// Check time sync
// TOTP requires accurate system time
// Allow for clock skew:
authenticator.verify({
  token: code,
  secret,
  window: 2 // Allow 2 time steps (60 seconds)
})
```

#### Issue: Rate limiting blocking legitimate users

**Solution:**
```typescript
// Adjust rate limits in config
const rateLimitConfig = {
  login: { maxRequests: 10, windowMs: 15 * 60 * 1000 }
}
```

#### Issue: Session not persisting

**Solution:**
```typescript
// Check cookie settings
response.cookies.set('session_token', token, {
  httpOnly: true,
  secure: true, // Must be true in production
  sameSite: 'lax', // Try 'lax' instead of 'strict'
  maxAge: 60 * 60 * 24
})
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=mfa:* npm run dev

# Check Supabase connection
npx supabase status

# Test API endpoints
curl -X POST http://localhost:3000/api/auth/mfa/enroll \
  -H "Content-Type: application/json" \
  -d '{"factorType":"totp","enrollmentData":{"email":"test@example.com"}}'
```

---

## 9. Support & Resources

### Documentation
- [MFA Architecture](./MFA_ARCHITECTURE.md)
- [Security Best Practices](./SECURITY.md)
- [API Reference](./API_REFERENCE.md)

### External Resources
- [Supabase MFA Docs](https://supabase.com/docs/guides/auth/auth-mfa)
- [WebAuthn Guide](https://webauthn.guide/)
- [OWASP Authentication Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

### Getting Help
- **GitHub Issues**: [Create an issue](https://github.com/your-org/fulqrun/issues)
- **Team Chat**: #security-team channel
- **Email**: security@fulqrun.com

---

**Implementation Guide Version 1.0 - Last Updated: September 30, 2025**

