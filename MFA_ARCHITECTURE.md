# Multi-Factor Authentication (MFA) Architecture
## Comprehensive Security Design for FulQrun Platform

**Version:** 1.0  
**Last Updated:** September 30, 2025  
**Status:** Architecture Design

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Authentication Methods](#authentication-methods)
4. [Security Framework](#security-framework)
5. [Implementation Design](#implementation-design)
6. [Attack Prevention](#attack-prevention)
7. [Integration with Supabase](#integration-with-supabase)
8. [Technical Specifications](#technical-specifications)
9. [Deployment Strategy](#deployment-strategy)
10. [Monitoring & Compliance](#monitoring--compliance)

---

## 1. Executive Summary

### 1.1 Purpose
This document outlines a comprehensive Multi-Factor Authentication (MFA) system designed for the FulQrun platform - a high-traffic web application requiring enterprise-grade security. The architecture leverages Supabase Authentication services while implementing industry best practices for secure user authentication.

### 1.2 Key Features
- **Multi-layered Authentication**: Support for 6+ authentication methods
- **Adaptive Security**: Risk-based authentication with contextual analysis
- **Zero-Trust Architecture**: Every request verified, never trusted
- **Scalable Design**: Built to handle high-traffic loads with minimal latency
- **GDPR & SOC2 Compliant**: Privacy-first approach with comprehensive audit trails

### 1.3 Security Objectives
- **Prevent Unauthorized Access**: Multi-factor verification for all sensitive operations
- **Mitigate Common Attacks**: Protection against brute-force, replay, and phishing attacks
- **Ensure Data Privacy**: End-to-end encryption and secure credential storage
- **Maintain Availability**: High availability with graceful degradation
- **Enable Auditability**: Comprehensive logging for compliance and forensics

---

## 2. Architecture Overview

### 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Web App    │  │  Mobile App  │  │   Native Clients     │  │
│  │  (Next.js)   │  │   (React)    │  │   (Desktop/IoT)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Security Middleware (src/middleware-security.ts)        │  │
│  │  • Rate Limiting  • Request Validation  • CSRF           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MFA ORCHESTRATION LAYER                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           MFA Service (src/lib/auth/mfa-service.ts)      │  │
│  │  • Authentication Coordinator                            │  │
│  │  • Risk Assessment Engine                                │  │
│  │  • Factor Verification Manager                           │  │
│  │  • Session Management                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              AUTHENTICATION PROVIDERS LAYER                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │   Primary   │  │  Secondary  │  │   Biometric/Hardware │   │
│  │  Password   │  │  OTP (SMS/  │  │   WebAuthn/FIDO2     │   │
│  │  Supabase   │  │  Email)     │  │   Fingerprint/Face   │   │
│  └─────────────┘  └─────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE BACKEND LAYER                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Supabase Authentication Service                         │  │
│  │  • User Management  • Session Storage  • Token Refresh   │  │
│  │  • MFA Factors  • Audit Logs  • Rate Limiting           │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database (with RLS)                          │  │
│  │  • Users & Profiles  • MFA Factors  • Audit Logs         │  │
│  │  • Device Fingerprints  • Risk Scores                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES LAYER                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │   SMS    │  │  Email   │  │  Push    │  │  Threat      │   │
│  │ Provider │  │ Provider │  │Notification│ │  Intel APIs │   │
│  │ (Twilio) │  │(SendGrid)│  │  (FCM)   │  │(VirusTotal) │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Core Components

#### 2.2.1 MFA Orchestration Service
**Location:** `src/lib/auth/mfa-service.ts`

**Responsibilities:**
- Coordinate multi-factor authentication flows
- Manage authentication state and session lifecycle
- Enforce authentication policies and risk-based rules
- Handle factor enrollment and verification
- Integrate with Supabase Auth and external providers

#### 2.2.2 Factor Verification Modules
**Location:** `src/lib/auth/factors/`

**Modules:**
- `password-factor.ts` - Primary password authentication
- `otp-factor.ts` - Time-based and SMS OTP
- `email-factor.ts` - Email-based verification codes
- `webauthn-factor.ts` - Hardware security keys (FIDO2/WebAuthn)
- `biometric-factor.ts` - Fingerprint and facial recognition
- `backup-codes.ts` - Recovery codes for account access

#### 2.2.3 Risk Assessment Engine
**Location:** `src/lib/auth/risk-engine.ts`

**Capabilities:**
- Device fingerprinting and recognition
- Behavioral biometrics (typing patterns, mouse movements)
- Geolocation and IP reputation analysis
- Anomaly detection (unusual login times, locations)
- Machine learning-based risk scoring

#### 2.2.4 Session Management
**Location:** `src/lib/auth/session-manager.ts`

**Features:**
- Secure session token generation and validation
- Session rotation and refresh mechanisms
- Concurrent session management
- Device-specific session tracking
- Automatic session expiration and cleanup

---

## 3. Authentication Methods

### 3.1 Primary Authentication (Knowledge Factor)

#### 3.1.1 Password-Based Authentication

**Implementation:**
```typescript
// src/lib/auth/factors/password-factor.ts
import { createClient } from '@supabase/supabase-js'

interface PasswordAuthConfig {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  preventCommonPasswords: boolean
  passwordHistory: number
  maxAttempts: number
  lockoutDuration: number
}

class PasswordAuthenticationFactor {
  private supabase: SupabaseClient
  private config: PasswordAuthConfig
  
  async authenticate(email: string, password: string): Promise<AuthResult> {
    // 1. Validate input
    this.validateEmail(email)
    this.validatePassword(password)
    
    // 2. Check rate limiting
    await this.checkRateLimit(email)
    
    // 3. Authenticate with Supabase
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })
    
    // 4. Handle failed attempts
    if (error) {
      await this.recordFailedAttempt(email)
      throw new AuthenticationError('Invalid credentials')
    }
    
    // 5. Clear failed attempts on success
    await this.clearFailedAttempts(email)
    
    return { user: data.user, session: data.session }
  }
  
  async validatePassword(password: string): Promise<ValidationResult> {
    const errors: string[] = []
    
    // Length check
    if (password.length < this.config.minLength) {
      errors.push(`Password must be at least ${this.config.minLength} characters`)
    }
    
    // Complexity checks
    if (this.config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters')
    }
    
    if (this.config.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain numbers')
    }
    
    if (this.config.requireSpecialChars && !/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain special characters')
    }
    
    // Check against common passwords
    if (this.config.preventCommonPasswords) {
      const isCommon = await this.checkCommonPasswords(password)
      if (isCommon) {
        errors.push('Password is too common')
      }
    }
    
    return { valid: errors.length === 0, errors }
  }
}
```

**Security Features:**
- ✅ Bcrypt hashing with configurable salt rounds (default: 12)
- ✅ Password complexity enforcement
- ✅ Common password prevention (Have I Been Pwned API)
- ✅ Password history (prevent reuse of last 5 passwords)
- ✅ Rate limiting (5 attempts per 15 minutes)
- ✅ Account lockout after multiple failed attempts
- ✅ Secure password reset with time-limited tokens

**Database Schema:**
```sql
-- Password history tracking
CREATE TABLE password_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Failed login attempts tracking
CREATE TABLE failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT
);

-- Create index for performance
CREATE INDEX idx_failed_attempts_email ON failed_login_attempts(email, attempted_at);
```

### 3.2 Secondary Authentication (Possession Factors)

#### 3.2.1 Time-Based One-Time Password (TOTP)

**Implementation with Supabase:**
```typescript
// src/lib/auth/factors/totp-factor.ts
import { authenticator } from 'otplib'

class TOTPAuthenticationFactor {
  async enroll(userId: string): Promise<TOTPEnrollment> {
    // 1. Generate secret
    const secret = authenticator.generateSecret()
    
    // 2. Store in Supabase
    const { data, error } = await this.supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator App'
    })
    
    if (error) throw error
    
    // 3. Generate QR code for user
    const otpauthUrl = authenticator.keyuri(
      user.email,
      'FulQrun',
      secret
    )
    
    return {
      secret,
      qrCode: await this.generateQRCode(otpauthUrl),
      factorId: data.id
    }
  }
  
  async verify(userId: string, factorId: string, code: string): Promise<boolean> {
    // Verify with Supabase MFA
    const { data, error } = await this.supabase.auth.mfa.challengeAndVerify({
      factorId,
      code
    })
    
    return !error && data?.access_token !== undefined
  }
  
  async challenge(userId: string, factorId: string): Promise<ChallengeResponse> {
    // Initiate MFA challenge
    const { data, error } = await this.supabase.auth.mfa.challenge({
      factorId
    })
    
    if (error) throw error
    
    return {
      challengeId: data.id,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    }
  }
}
```

**Security Features:**
- ✅ 30-second time window with clock skew tolerance
- ✅ One-time code verification (codes cannot be reused)
- ✅ Secure secret storage with encryption at rest
- ✅ Support for multiple TOTP devices per user
- ✅ Backup codes for device loss scenarios

#### 3.2.2 SMS-Based OTP

**Implementation:**
```typescript
// src/lib/auth/factors/sms-otp-factor.ts
import { Twilio } from 'twilio'

class SMSOTPFactor {
  private twilioClient: Twilio
  private otpLength = 6
  private otpExpiry = 5 * 60 * 1000 // 5 minutes
  
  async sendOTP(phoneNumber: string, userId: string): Promise<void> {
    // 1. Generate secure OTP
    const otp = this.generateSecureOTP(this.otpLength)
    
    // 2. Store OTP with expiry (hashed)
    const hashedOTP = await this.hashOTP(otp)
    await this.storeOTP(userId, hashedOTP, phoneNumber)
    
    // 3. Send via Twilio
    await this.twilioClient.messages.create({
      body: `Your FulQrun verification code is: ${otp}. Valid for 5 minutes.`,
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER
    })
    
    // 4. Log for audit
    await this.logOTPSent(userId, phoneNumber)
  }
  
  async verifyOTP(userId: string, otp: string): Promise<boolean> {
    // 1. Retrieve stored OTP
    const storedData = await this.getStoredOTP(userId)
    
    // 2. Check expiry
    if (Date.now() > storedData.expiresAt) {
      await this.deleteOTP(userId)
      throw new Error('OTP expired')
    }
    
    // 3. Verify OTP (constant-time comparison)
    const isValid = await this.verifyHash(otp, storedData.hashedOTP)
    
    // 4. Delete OTP (one-time use)
    await this.deleteOTP(userId)
    
    // 5. Log verification attempt
    await this.logOTPVerification(userId, isValid)
    
    return isValid
  }
  
  private generateSecureOTP(length: number): string {
    // Use crypto.randomBytes for cryptographically secure random numbers
    const buffer = crypto.randomBytes(length)
    let otp = ''
    for (let i = 0; i < length; i++) {
      otp += (buffer[i] % 10).toString()
    }
    return otp
  }
}
```

**Security Features:**
- ✅ Cryptographically secure random OTP generation
- ✅ Short expiration time (5 minutes)
- ✅ One-time use enforcement
- ✅ Rate limiting (max 3 OTPs per 30 minutes)
- ✅ Hashed storage of OTPs
- ✅ Phone number verification and validation
- ✅ Protection against SIM swap attacks (device fingerprinting)

**Database Schema:**
```sql
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0
);

CREATE INDEX idx_otp_user_expiry ON otp_codes(user_id, expires_at);
```

#### 3.2.3 Email-Based OTP

**Implementation:**
```typescript
// src/lib/auth/factors/email-otp-factor.ts
import { createClient } from '@supabase/supabase-js'

class EmailOTPFactor {
  async sendEmailOTP(email: string, userId: string): Promise<void> {
    // Leverage Supabase's built-in email OTP
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        data: {
          purpose: 'mfa_verification',
          userId
        }
      }
    })
    
    if (error) throw error
    
    // Log for audit trail
    await this.logEmailOTPSent(userId, email)
  }
  
  async verifyEmailOTP(email: string, token: string): Promise<boolean> {
    const { data, error } = await this.supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })
    
    return !error && data.user !== null
  }
}
```

**Security Features:**
- ✅ Leverages Supabase's built-in email OTP
- ✅ Secure token generation (32-character random string)
- ✅ Time-limited validity (10 minutes)
- ✅ One-time use tokens
- ✅ Email deliverability monitoring
- ✅ Anti-phishing email templates

### 3.3 Biometric Authentication (Inherence Factors)

#### 3.3.1 WebAuthn / FIDO2 (Hardware Security Keys)

**Implementation:**
```typescript
// src/lib/auth/factors/webauthn-factor.ts
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server'

class WebAuthnFactor {
  private rpID = process.env.NEXT_PUBLIC_RP_ID || 'fulqrun.com'
  private rpName = 'FulQrun'
  private origin = process.env.NEXT_PUBLIC_APP_URL || 'https://app.fulqrun.com'
  
  async generateRegistrationOptions(userId: string, email: string) {
    // Get user's existing authenticators
    const userAuthenticators = await this.getUserAuthenticators(userId)
    
    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userID: userId,
      userName: email,
      timeout: 60000,
      attestationType: 'none',
      excludeCredentials: userAuthenticators.map(auth => ({
        id: auth.credentialID,
        type: 'public-key',
        transports: auth.transports,
      })),
      authenticatorSelection: {
        residentKey: 'discouraged',
        userVerification: 'preferred',
        authenticatorAttachment: 'cross-platform',
      },
    })
    
    // Store challenge for verification
    await this.storeChallenge(userId, options.challenge)
    
    return options
  }
  
  async verifyRegistration(userId: string, response: RegistrationResponseJSON) {
    const expectedChallenge = await this.getChallenge(userId)
    
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
    })
    
    if (verification.verified && verification.registrationInfo) {
      // Store authenticator in database
      await this.storeAuthenticator(userId, {
        credentialID: verification.registrationInfo.credentialID,
        credentialPublicKey: verification.registrationInfo.credentialPublicKey,
        counter: verification.registrationInfo.counter,
        transports: response.response.transports,
      })
    }
    
    return verification.verified
  }
  
  async generateAuthenticationOptions(userId: string) {
    const userAuthenticators = await this.getUserAuthenticators(userId)
    
    const options = await generateAuthenticationOptions({
      timeout: 60000,
      allowCredentials: userAuthenticators.map(auth => ({
        id: auth.credentialID,
        type: 'public-key',
        transports: auth.transports,
      })),
      userVerification: 'preferred',
      rpID: this.rpID,
    })
    
    await this.storeChallenge(userId, options.challenge)
    
    return options
  }
}
```

**Security Features:**
- ✅ FIDO2 / WebAuthn standard compliance
- ✅ Support for hardware security keys (YubiKey, Titan, etc.)
- ✅ Phishing-resistant authentication
- ✅ Public key cryptography (private key never leaves device)
- ✅ Attestation validation for trusted devices
- ✅ Counter-based replay attack prevention

**Database Schema:**
```sql
CREATE TABLE webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  public_key BYTEA NOT NULL,
  counter BIGINT DEFAULT 0,
  transports TEXT[],
  friendly_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_webauthn_user ON webauthn_credentials(user_id);
```

#### 3.3.2 Biometric Authentication (Platform Authenticators)

**Implementation:**
```typescript
// src/lib/auth/factors/biometric-factor.ts
class BiometricAuthFactor {
  async enrollBiometric(userId: string): Promise<BiometricEnrollment> {
    // Check if device supports biometric auth
    if (!this.isBiometricAvailable()) {
      throw new Error('Biometric authentication not available on this device')
    }
    
    // Use WebAuthn with platform authenticator
    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userID: userId,
      userName: user.email,
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Platform authenticator (Touch ID, Face ID)
        userVerification: 'required',
        residentKey: 'preferred',
      },
    })
    
    return options
  }
  
  async verifyBiometric(userId: string, response: AuthenticationResponseJSON) {
    // Verify using WebAuthn
    const verification = await this.verifyAuthentication(userId, response)
    
    if (verification.verified) {
      // Update last used timestamp
      await this.updateAuthenticatorUsage(response.id)
    }
    
    return verification.verified
  }
  
  private isBiometricAvailable(): boolean {
    // Check for WebAuthn support
    return window?.PublicKeyCredential !== undefined &&
           typeof window.PublicKeyCredential === 'function'
  }
}
```

**Security Features:**
- ✅ Native platform biometric integration (Touch ID, Face ID, Windows Hello)
- ✅ Local biometric data storage (never transmitted)
- ✅ Liveness detection to prevent spoofing
- ✅ Fallback to device PIN/pattern
- ✅ Secure Enclave / TPM integration

### 3.4 Backup & Recovery Methods

#### 3.4.1 Backup Codes

**Implementation:**
```typescript
// src/lib/auth/factors/backup-codes.ts
class BackupCodesFactor {
  private codeCount = 10
  private codeLength = 8
  
  async generateBackupCodes(userId: string): Promise<string[]> {
    const codes: string[] = []
    
    // Generate cryptographically secure backup codes
    for (let i = 0; i < this.codeCount; i++) {
      const code = this.generateSecureCode(this.codeLength)
      codes.push(code)
      
      // Store hashed version
      const hashedCode = await bcrypt.hash(code, 12)
      await this.storeBackupCode(userId, hashedCode)
    }
    
    // Log backup codes generation
    await this.logBackupCodesGenerated(userId)
    
    return codes
  }
  
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const storedCodes = await this.getBackupCodes(userId)
    
    for (const storedCode of storedCodes) {
      if (storedCode.used) continue
      
      const isValid = await bcrypt.compare(code, storedCode.hash)
      if (isValid) {
        // Mark code as used (one-time use)
        await this.markCodeAsUsed(storedCode.id)
        await this.logBackupCodeUsed(userId, storedCode.id)
        return true
      }
    }
    
    return false
  }
  
  private generateSecureCode(length: number): string {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude ambiguous chars
    let code = ''
    const randomBytes = crypto.randomBytes(length)
    
    for (let i = 0; i < length; i++) {
      code += charset[randomBytes[i] % charset.length]
    }
    
    // Format as XXXX-XXXX
    return code.slice(0, 4) + '-' + code.slice(4)
  }
}
```

**Database Schema:**
```sql
CREATE TABLE backup_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_backup_codes_user ON backup_codes(user_id, used);
```

---

## 4. Security Framework

### 4.1 Attack Prevention Mechanisms

#### 4.1.1 Brute-Force Attack Prevention

**Implementation:**
```typescript
// src/lib/auth/security/rate-limiter.ts
class RateLimiter {
  private redis: Redis // Or Supabase Edge Functions with Upstash
  
  async checkRateLimit(identifier: string, action: string): Promise<RateLimitResult> {
    const key = `ratelimit:${action}:${identifier}`
    
    // Sliding window rate limiting
    const now = Date.now()
    const windowStart = now - this.config[action].windowMs
    
    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart)
    
    // Count requests in window
    const requestCount = await this.redis.zcard(key)
    
    if (requestCount >= this.config[action].maxRequests) {
      const oldestRequest = await this.redis.zrange(key, 0, 0, 'WITHSCORES')
      const resetTime = parseInt(oldestRequest[1]) + this.config[action].windowMs
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(resetTime)
      }
    }
    
    // Add current request
    await this.redis.zadd(key, now, `${now}:${crypto.randomUUID()}`)
    await this.redis.expire(key, this.config[action].windowMs / 1000)
    
    return {
      allowed: true,
      remaining: this.config[action].maxRequests - requestCount - 1,
      resetAt: new Date(now + this.config[action].windowMs)
    }
  }
}

// Rate limit configurations
const rateLimitConfig = {
  login: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  otp: { maxRequests: 3, windowMs: 30 * 60 * 1000 },   // 3 OTPs per 30 minutes
  passwordReset: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 resets per hour
  apiRequest: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
}
```

**Security Measures:**
- ✅ Sliding window rate limiting
- ✅ IP-based and user-based rate limits
- ✅ Progressive delays (exponential backoff)
- ✅ Account lockout after repeated failures
- ✅ CAPTCHA after threshold (Google reCAPTCHA v3)
- ✅ Distributed rate limiting for scalability

#### 4.1.2 Replay Attack Prevention

**Implementation:**
```typescript
// src/lib/auth/security/replay-protection.ts
class ReplayProtection {
  async generateNonce(): Promise<string> {
    return crypto.randomBytes(32).toString('hex')
  }
  
  async validateRequest(request: AuthRequest): Promise<boolean> {
    // 1. Check timestamp (must be within 5 minutes)
    const timestamp = parseInt(request.timestamp)
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes
    
    if (Math.abs(now - timestamp) > maxAge) {
      throw new Error('Request timestamp expired')
    }
    
    // 2. Check nonce (must be unique and not used before)
    const nonceKey = `nonce:${request.nonce}`
    const nonceExists = await this.redis.exists(nonceKey)
    
    if (nonceExists) {
      throw new Error('Nonce already used (replay attack detected)')
    }
    
    // 3. Store nonce with expiration
    await this.redis.setex(nonceKey, maxAge / 1000, '1')
    
    // 4. Verify signature
    const expectedSignature = this.generateSignature(request)
    if (request.signature !== expectedSignature) {
      throw new Error('Invalid request signature')
    }
    
    return true
  }
  
  private generateSignature(request: AuthRequest): string {
    const payload = `${request.timestamp}:${request.nonce}:${request.userId}`
    return crypto
      .createHmac('sha256', process.env.AUTH_SECRET!)
      .update(payload)
      .digest('hex')
  }
}
```

**Security Measures:**
- ✅ Cryptographic nonces (one-time use tokens)
- ✅ Timestamp validation (request expiry)
- ✅ Request signing with HMAC-SHA256
- ✅ Redis-based nonce tracking
- ✅ Challenge-response protocols

#### 4.1.3 Phishing Attack Prevention

**Implementation:**
```typescript
// src/lib/auth/security/phishing-protection.ts
class PhishingProtection {
  async validateOrigin(request: Request): Promise<boolean> {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    
    // 1. Validate origin header
    if (!this.isAllowedOrigin(origin)) {
      await this.logSuspiciousActivity('invalid_origin', { origin, referer })
      return false
    }
    
    // 2. Check for CSRF token
    const csrfToken = request.headers.get('x-csrf-token')
    if (!await this.validateCSRFToken(csrfToken)) {
      return false
    }
    
    // 3. Verify SSL/TLS
    if (!request.url.startsWith('https://')) {
      return false
    }
    
    return true
  }
  
  async detectPhishingAttempt(email: string, ipAddress: string): Promise<PhishingRisk> {
    // 1. Check IP reputation
    const ipReputation = await this.checkIPReputation(ipAddress)
    
    // 2. Analyze email patterns
    const emailRisk = await this.analyzeEmailPattern(email)
    
    // 3. Check for suspicious domains
    const domainRisk = await this.checkDomainReputation(email.split('@')[1])
    
    // 4. Calculate risk score
    const riskScore = (ipReputation.score + emailRisk.score + domainRisk.score) / 3
    
    return {
      score: riskScore,
      level: this.getRiskLevel(riskScore),
      factors: {
        ipReputation,
        emailRisk,
        domainRisk
      }
    }
  }
  
  async implementWebAuthn(): Promise<void> {
    // WebAuthn prevents phishing because:
    // 1. Origin is cryptographically bound to credentials
    // 2. Credentials only work on registered domain
    // 3. No secrets to phish (public key cryptography)
  }
}
```

**Security Measures:**
- ✅ Origin validation and CORS enforcement
- ✅ CSRF token protection
- ✅ SSL/TLS enforcement with HSTS headers
- ✅ Domain binding with WebAuthn
- ✅ Email link verification (magic links with domain validation)
- ✅ Visual security indicators (verified badge, SSL certificate display)
- ✅ Anti-phishing education (security tips, warnings)

#### 4.1.4 Session Hijacking Prevention

**Implementation:**
```typescript
// src/lib/auth/session-manager.ts
class SessionManager {
  async createSession(userId: string, deviceInfo: DeviceInfo): Promise<Session> {
    // 1. Generate secure session token
    const sessionToken = this.generateSecureToken()
    const refreshToken = this.generateSecureToken()
    
    // 2. Create device fingerprint
    const deviceFingerprint = await this.createDeviceFingerprint(deviceInfo)
    
    // 3. Store session with metadata
    const session = await this.supabase.from('sessions').insert({
      user_id: userId,
      session_token: await this.hashToken(sessionToken),
      refresh_token: await this.hashToken(refreshToken),
      device_fingerprint: deviceFingerprint,
      ip_address: deviceInfo.ipAddress,
      user_agent: deviceInfo.userAgent,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      created_at: new Date()
    }).select().single()
    
    return { sessionToken, refreshToken, ...session.data }
  }
  
  async validateSession(sessionToken: string, deviceInfo: DeviceInfo): Promise<boolean> {
    // 1. Retrieve session
    const hashedToken = await this.hashToken(sessionToken)
    const session = await this.getSessionByToken(hashedToken)
    
    if (!session) return false
    
    // 2. Check expiration
    if (new Date() > new Date(session.expires_at)) {
      await this.deleteSession(session.id)
      return false
    }
    
    // 3. Verify device fingerprint
    const currentFingerprint = await this.createDeviceFingerprint(deviceInfo)
    if (currentFingerprint !== session.device_fingerprint) {
      // Potential session hijacking
      await this.logSuspiciousActivity('fingerprint_mismatch', {
        sessionId: session.id,
        expected: session.device_fingerprint,
        actual: currentFingerprint
      })
      return false
    }
    
    // 4. Check for concurrent sessions from different locations
    const suspiciousActivity = await this.detectSuspiciousActivity(session.user_id, deviceInfo)
    if (suspiciousActivity) {
      await this.requireMFARevalidation(session.user_id)
    }
    
    // 5. Rotate session token periodically
    if (this.shouldRotateSession(session)) {
      await this.rotateSession(session.id)
    }
    
    return true
  }
  
  private async createDeviceFingerprint(deviceInfo: DeviceInfo): Promise<string> {
    const fingerprintData = {
      userAgent: deviceInfo.userAgent,
      screenResolution: deviceInfo.screenResolution,
      timezone: deviceInfo.timezone,
      language: deviceInfo.language,
      platform: deviceInfo.platform,
      // Note: IP not included to handle dynamic IPs
    }
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(fingerprintData))
      .digest('hex')
  }
}
```

**Security Measures:**
- ✅ Secure session token generation (256-bit random)
- ✅ HttpOnly and Secure cookie flags
- ✅ SameSite cookie attribute (Strict mode)
- ✅ Device fingerprinting
- ✅ IP address tracking with anomaly detection
- ✅ Session rotation and automatic expiration
- ✅ Concurrent session management
- ✅ Session binding to device characteristics

**Database Schema:**
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash TEXT UNIQUE NOT NULL,
  refresh_token_hash TEXT UNIQUE NOT NULL,
  device_fingerprint TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id, expires_at);
CREATE INDEX idx_sessions_token ON user_sessions(session_token_hash);
```

### 4.2 Risk-Based Authentication

**Implementation:**
```typescript
// src/lib/auth/risk-engine.ts
class RiskAssessmentEngine {
  async calculateRiskScore(authContext: AuthContext): Promise<RiskScore> {
    const factors = await Promise.all([
      this.assessDeviceRisk(authContext.deviceInfo),
      this.assessLocationRisk(authContext.ipAddress, authContext.userId),
      this.assessBehavioralRisk(authContext.userId, authContext.timestamp),
      this.assessVelocityRisk(authContext.userId),
      this.assessThreatIntelligence(authContext.ipAddress)
    ])
    
    // Weighted risk calculation
    const weights = { device: 0.25, location: 0.25, behavioral: 0.20, velocity: 0.15, threat: 0.15 }
    const totalScore = factors.reduce((sum, factor, index) => {
      return sum + factor.score * Object.values(weights)[index]
    }, 0)
    
    return {
      score: totalScore,
      level: this.determineRiskLevel(totalScore),
      factors,
      recommendation: this.getAuthRecommendation(totalScore)
    }
  }
  
  private async assessDeviceRisk(deviceInfo: DeviceInfo): Promise<RiskFactor> {
    // New device = higher risk
    const isKnownDevice = await this.isDeviceKnown(deviceInfo)
    const deviceAge = await this.getDeviceAge(deviceInfo)
    
    let score = 50 // Base score
    
    if (!isKnownDevice) score += 30
    if (deviceAge < 7) score += 20 // Device used less than 7 days
    if (!deviceInfo.isTrusted) score += 25
    
    return { name: 'device', score: Math.min(score, 100), details: { isKnownDevice, deviceAge } }
  }
  
  private async assessLocationRisk(ipAddress: string, userId: string): Promise<RiskFactor> {
    // Get user's typical locations
    const userLocations = await this.getUserLocations(userId)
    const currentLocation = await this.getIPLocation(ipAddress)
    
    let score = 0
    
    // New country
    if (!userLocations.some(loc => loc.country === currentLocation.country)) {
      score += 40
    }
    
    // Impossible travel (too fast between locations)
    const lastLocation = await this.getLastLocation(userId)
    if (lastLocation && this.isImpossibleTravel(lastLocation, currentLocation)) {
      score += 50
    }
    
    // High-risk country
    if (this.isHighRiskCountry(currentLocation.country)) {
      score += 30
    }
    
    return { name: 'location', score: Math.min(score, 100), details: currentLocation }
  }
  
  private getAuthRecommendation(riskScore: number): MFARequirement {
    if (riskScore < 30) {
      return { required: false, suggestedFactors: [] }
    } else if (riskScore < 60) {
      return { required: true, suggestedFactors: ['totp', 'email_otp'] }
    } else {
      return { required: true, suggestedFactors: ['webauthn', 'totp', 'email_otp'], requireMultiple: 2 }
    }
  }
}
```

**Risk-Based Policies:**
- ✅ **Low Risk (0-30)**: Single-factor authentication acceptable
- ✅ **Medium Risk (30-60)**: Require one additional factor
- ✅ **High Risk (60-80)**: Require two additional factors
- ✅ **Critical Risk (80-100)**: Block and require manual verification

---

## 5. Implementation Design

### 5.1 Authentication Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                      │
└─────────────────────────────────────────────────────────────┘

1. PRIMARY AUTHENTICATION
   ├─> User enters email + password
   ├─> Client-side validation
   ├─> Rate limit check
   ├─> Supabase password authentication
   └─> Success → Proceed to step 2

2. RISK ASSESSMENT
   ├─> Collect context (IP, device, location, behavior)
   ├─> Calculate risk score
   ├─> Determine MFA requirements
   └─> Return MFA challenge

3. SECONDARY AUTHENTICATION (if required)
   ├─> Present available factors to user
   ├─> User selects factor (TOTP, SMS, Email, WebAuthn)
   ├─> Factor-specific challenge issued
   ├─> User provides verification
   └─> Verify response

4. SESSION CREATION
   ├─> Generate session tokens
   ├─> Create device fingerprint
   ├─> Store session metadata
   ├─> Set secure cookies
   └─> Return access token

5. ONGOING VALIDATION
   ├─> Monitor session activity
   ├─> Detect anomalies
   ├─> Refresh tokens periodically
   └─> Require re-authentication for sensitive actions
```

### 5.2 MFA Service Architecture

```typescript
// src/lib/auth/mfa-service.ts
import { SupabaseClient } from '@supabase/supabase-js'

interface MFAServiceConfig {
  supabase: SupabaseClient
  riskEngine: RiskAssessmentEngine
  factors: {
    password: PasswordAuthenticationFactor
    totp: TOTPAuthenticationFactor
    smsOtp: SMSOTPFactor
    emailOtp: EmailOTPFactor
    webauthn: WebAuthnFactor
    biometric: BiometricAuthFactor
    backupCodes: BackupCodesFactor
  }
}

export class MFAService {
  constructor(private config: MFAServiceConfig) {}
  
  async authenticate(credentials: AuthCredentials, context: AuthContext): Promise<AuthResult> {
    try {
      // Step 1: Primary authentication
      const primaryResult = await this.config.factors.password.authenticate(
        credentials.email,
        credentials.password
      )
      
      if (!primaryResult.success) {
        throw new AuthenticationError('Invalid credentials')
      }
      
      // Step 2: Risk assessment
      const riskScore = await this.config.riskEngine.calculateRiskScore({
        userId: primaryResult.user.id,
        ...context
      })
      
      // Step 3: Determine MFA requirements
      const mfaRequirement = this.determineMFARequirement(riskScore, primaryResult.user)
      
      if (!mfaRequirement.required) {
        // Low risk - create session directly
        return this.createSession(primaryResult.user, context)
      }
      
      // Step 4: MFA challenge
      const availableFactors = await this.getEnrolledFactors(primaryResult.user.id)
      
      if (availableFactors.length === 0) {
        // User has no MFA factors enrolled
        if (mfaRequirement.enforcement === 'required') {
          return {
            success: false,
            requireEnrollment: true,
            message: 'MFA enrollment required'
          }
        }
      }
      
      return {
        success: false,
        requireMFA: true,
        availableFactors,
        challengeId: await this.createMFAChallenge(primaryResult.user.id),
        riskScore
      }
      
    } catch (error) {
      await this.logAuthenticationFailure(credentials.email, context, error)
      throw error
    }
  }
  
  async verifyMFAChallenge(
    challengeId: string,
    factorType: FactorType,
    verification: FactorVerification,
    context: AuthContext
  ): Promise<AuthResult> {
    // Retrieve challenge
    const challenge = await this.getChallenge(challengeId)
    
    if (!challenge || challenge.expiresAt < new Date()) {
      throw new Error('Invalid or expired challenge')
    }
    
    // Verify factor
    const factor = this.config.factors[factorType]
    const verified = await factor.verify(challenge.userId, verification)
    
    if (!verified) {
      await this.incrementFailedMFAAttempts(challengeId)
      throw new Error('MFA verification failed')
    }
    
    // Get user
    const user = await this.getUser(challenge.userId)
    
    // Create session
    return this.createSession(user, context)
  }
  
  async enrollFactor(userId: string, factorType: FactorType, enrollmentData: any): Promise<EnrollmentResult> {
    const factor = this.config.factors[factorType]
    
    // Check enrollment limits
    const currentFactors = await this.getEnrolledFactors(userId)
    if (currentFactors.length >= this.config.maxFactorsPerUser) {
      throw new Error('Maximum number of factors enrolled')
    }
    
    // Enroll factor
    const enrollment = await factor.enroll(userId, enrollmentData)
    
    // Log enrollment
    await this.logFactorEnrollment(userId, factorType)
    
    return enrollment
  }
  
  async removeFactor(userId: string, factorId: string, verification: FactorVerification): Promise<void> {
    // Require MFA verification to remove a factor
    const currentSession = await this.getCurrentSession(userId)
    const verified = await this.verifyFactorForRemoval(userId, verification)
    
    if (!verified) {
      throw new Error('Verification required to remove factor')
    }
    
    // Ensure user has at least one factor remaining (if MFA is enforced)
    const factors = await this.getEnrolledFactors(userId)
    const userPolicy = await this.getUserMFAPolicy(userId)
    
    if (factors.length <= 1 && userPolicy.enforcement === 'required') {
      throw new Error('Cannot remove last factor when MFA is required')
    }
    
    // Remove factor
    await this.deleteFactorFromDatabase(factorId)
    
    // Log removal
    await this.logFactorRemoval(userId, factorId)
  }
  
  private determineMFARequirement(riskScore: RiskScore, user: User): MFARequirement {
    // Check user-specific policy
    const userPolicy = user.mfaPolicy || this.config.defaultPolicy
    
    // Check organization policy
    const orgPolicy = user.organization?.mfaPolicy
    
    // Risk-based requirements
    const riskRequirement = riskScore.recommendation
    
    // Combine policies (most restrictive wins)
    return {
      required: userPolicy.required || orgPolicy?.required || riskRequirement.required,
      factorCount: Math.max(
        userPolicy.minFactors || 1,
        orgPolicy?.minFactors || 1,
        riskRequirement.requireMultiple || 1
      ),
      allowedFactors: this.intersectFactors(
        userPolicy.allowedFactors,
        orgPolicy?.allowedFactors,
        riskRequirement.suggestedFactors
      ),
      enforcement: this.getMostRestrictiveEnforcement([userPolicy, orgPolicy])
    }
  }
  
  private async createSession(user: User, context: AuthContext): Promise<AuthResult> {
    const sessionManager = new SessionManager(this.config.supabase)
    
    const session = await sessionManager.createSession(user.id, context.deviceInfo)
    
    // Log successful authentication
    await this.logSuccessfulAuthentication(user.id, context)
    
    return {
      success: true,
      user,
      session,
      accessToken: session.sessionToken,
      refreshToken: session.refreshToken
    }
  }
}
```

### 5.3 UI/UX Components

#### 5.3.1 MFA Enrollment Flow

```typescript
// src/components/auth/MFAEnrollment.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { MFAService } from '@/lib/auth/mfa-service'

export function MFAEnrollment() {
  const [selectedFactor, setSelectedFactor] = useState<FactorType | null>(null)
  const [enrollmentStep, setEnrollmentStep] = useState<'select' | 'configure' | 'verify'>('select')
  const { user } = useAuth()
  
  const availableFactors = [
    {
      type: 'totp' as const,
      name: 'Authenticator App',
      description: 'Use Google Authenticator, Authy, or similar apps',
      icon: '📱',
      recommended: true
    },
    {
      type: 'webauthn' as const,
      name: 'Security Key',
      description: 'Use a hardware security key (YubiKey, etc.)',
      icon: '🔐',
      mostSecure: true
    },
    {
      type: 'smsOtp' as const,
      name: 'SMS Code',
      description: 'Receive codes via text message',
      icon: '💬',
      warning: 'Less secure due to SIM swap risks'
    },
    {
      type: 'emailOtp' as const,
      name: 'Email Code',
      description: 'Receive codes via email',
      icon: '📧'
    },
    {
      type: 'biometric' as const,
      name: 'Biometric',
      description: 'Use fingerprint or face recognition',
      icon: '👤',
      platformOnly: true
    }
  ]
  
  const handleEnroll = async (factorType: FactorType) => {
    setSelectedFactor(factorType)
    setEnrollmentStep('configure')
    
    // Initialize factor enrollment
    const mfaService = new MFAService(config)
    const enrollment = await mfaService.enrollFactor(user.id, factorType, {})
    
    // Show configuration UI based on factor type
    // (QR code for TOTP, phone input for SMS, etc.)
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Enhance Your Security</h2>
      <p className="text-gray-600 mb-6">
        Add an extra layer of security to your account with multi-factor authentication
      </p>
      
      <div className="grid gap-4">
        {availableFactors.map(factor => (
          <FactorCard
            key={factor.type}
            factor={factor}
            onSelect={() => handleEnroll(factor.type)}
          />
        ))}
      </div>
      
      {enrollmentStep === 'configure' && selectedFactor && (
        <FactorConfigurationModal
          factorType={selectedFactor}
          onComplete={() => setEnrollmentStep('verify')}
          onCancel={() => setEnrollmentStep('select')}
        />
      )}
    </div>
  )
}
```

#### 5.3.2 MFA Verification Flow

```typescript
// src/components/auth/MFAVerification.tsx
'use client'

export function MFAVerification({ challengeId, availableFactors, onSuccess }: Props) {
  const [selectedFactor, setSelectedFactor] = useState(availableFactors[0])
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleVerify = async () => {
    setLoading(true)
    try {
      const result = await mfaService.verifyMFAChallenge(
        challengeId,
        selectedFactor.type,
        { code: verificationCode },
        { deviceInfo: getDeviceInfo() }
      )
      
      if (result.success) {
        onSuccess(result)
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Verify Your Identity</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Choose verification method
        </label>
        <select
          value={selectedFactor.type}
          onChange={(e) => setSelectedFactor(
            availableFactors.find(f => f.type === e.target.value)!
          )}
          className="w-full p-2 border rounded"
        >
          {availableFactors.map(factor => (
            <option key={factor.type} value={factor.type}>
              {factor.name}
            </option>
          ))}
        </select>
      </div>
      
      {selectedFactor.type === 'totp' && (
        <TOTPVerificationInput
          value={verificationCode}
          onChange={setVerificationCode}
          onSubmit={handleVerify}
        />
      )}
      
      {selectedFactor.type === 'webauthn' && (
        <WebAuthnVerification
          onVerify={handleVerify}
        />
      )}
      
      {/* Other factor-specific UIs */}
      
      <div className="mt-6 text-center">
        <button
          onClick={() => {/* Show backup codes option */}}
          className="text-sm text-blue-600 hover:underline"
        >
          Use backup code instead
        </button>
      </div>
    </div>
  )
}
```

---

## 6. Attack Prevention

### 6.1 Comprehensive Threat Matrix

| Attack Type | Prevention Mechanism | Implementation |
|------------|---------------------|----------------|
| **Brute Force** | Rate limiting + Account lockout + CAPTCHA | Sliding window rate limiter, progressive delays |
| **Credential Stuffing** | Password breach detection + Device fingerprinting | Have I Been Pwned API, behavioral analysis |
| **Phishing** | WebAuthn + Domain binding + Visual indicators | FIDO2 integration, SSL validation |
| **Man-in-the-Middle** | TLS 1.3 + Certificate pinning + HSTS | Strict transport security headers |
| **Session Hijacking** | Device fingerprinting + Token rotation + Secure cookies | SHA-256 fingerprints, HttpOnly flags |
| **Replay Attacks** | Nonce validation + Timestamp checking + Request signing | HMAC signatures, Redis nonce store |
| **SIM Swap** | Multi-factor fallbacks + Device recognition | Backup authentication methods |
| **Social Engineering** | User education + Anomaly detection + Manual review | Risk scoring, support verification |
| **Password Spraying** | Distributed rate limiting + Anomaly detection | IP-based + user-based limits |
| **Token Theft** | Short-lived tokens + Refresh rotation + Secure storage | 15-minute access tokens, 7-day refresh |

### 6.2 Defense-in-Depth Strategy

```
Layer 1: Network Security
  ├─> DDoS Protection (Cloudflare/Vercel)
  ├─> WAF Rules
  └─> IP Reputation Filtering

Layer 2: Transport Security
  ├─> TLS 1.3 Enforcement
  ├─> Certificate Pinning
  └─> HSTS Headers

Layer 3: Application Security
  ├─> Input Validation (Zod schemas)
  ├─> Output Encoding
  ├─> CSRF Protection
  └─> Security Headers

Layer 4: Authentication Security
  ├─> Multi-Factor Authentication
  ├─> Risk-Based Authentication
  ├─> Behavioral Biometrics
  └─> Device Fingerprinting

Layer 5: Session Security
  ├─> Secure Token Storage
  ├─> Session Rotation
  ├─> Concurrent Session Management
  └─> Anomaly Detection

Layer 6: Data Security
  ├─> Encryption at Rest (AES-256)
  ├─> Encryption in Transit (TLS 1.3)
  ├─> RLS Policies
  └─> Data Masking

Layer 7: Monitoring & Response
  ├─> Real-time Threat Detection
  ├─> Automated Incident Response
  ├─> Security Audit Logging
  └─> Forensic Analysis
```

---

## 7. Integration with Supabase

### 7.1 Supabase MFA Configuration

```typescript
// src/lib/auth/supabase-mfa-config.ts
import { createClient } from '@supabase/supabase-js'

export const setupSupabaseMFA = async () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only
  )
  
  // Enable MFA for organization
  await supabase.auth.admin.updateUserById(userId, {
    app_metadata: {
      mfa_enabled: true,
      mfa_enforcement: 'required', // 'optional' | 'required'
      allowed_factors: ['totp', 'phone']
    }
  })
}
```

### 7.2 Database Schema Extensions

```sql
-- MFA Factors Table (extends Supabase auth.mfa_factors)
CREATE TABLE user_mfa_factors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  factor_type TEXT NOT NULL CHECK (factor_type IN ('totp', 'sms', 'email', 'webauthn', 'biometric')),
  factor_name TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ
);

-- MFA Policies Table
CREATE TABLE mfa_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  enforcement TEXT NOT NULL CHECK (enforcement IN ('disabled', 'optional', 'required')),
  allowed_factors TEXT[] DEFAULT ARRAY['totp', 'webauthn'],
  min_factors INTEGER DEFAULT 1,
  require_for_roles TEXT[] DEFAULT ARRAY['admin'],
  grace_period_hours INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Authentication Audit Log
CREATE TABLE auth_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  risk_score INTEGER,
  success BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device Registry
CREATE TABLE trusted_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT UNIQUE NOT NULL,
  device_name TEXT,
  device_type TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  trusted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk Assessment Cache
CREATE TABLE risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  risk_factors JSONB,
  assessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS Policies
ALTER TABLE user_mfa_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own MFA factors"
  ON user_mfa_factors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own devices"
  ON trusted_devices FOR ALL
  USING (auth.uid() = user_id);
```

### 7.3 Edge Functions for MFA

```typescript
// supabase/functions/mfa-challenge/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )
  
  const { factorId } = await req.json()
  
  // Create MFA challenge
  const { data, error } = await supabase.auth.mfa.challenge({ factorId })
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## 8. Technical Specifications

### 8.1 Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Primary Auth** | Supabase Auth | User authentication & session management |
| **MFA Provider** | Supabase MFA + Custom | TOTP, SMS, Email, WebAuthn |
| **Database** | PostgreSQL (Supabase) | User data, sessions, audit logs |
| **Caching** | Redis (Upstash) | Rate limiting, nonce tracking |
| **SMS Provider** | Twilio | SMS OTP delivery |
| **Email Provider** | Supabase (SendGrid) | Email OTP delivery |
| **WebAuthn** | SimpleWebAuthn | FIDO2 implementation |
| **Risk Engine** | Custom + ML | Behavioral analysis, anomaly detection |
| **Monitoring** | Supabase Analytics + Sentry | Security monitoring, error tracking |

### 8.2 Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Authentication Latency** | < 200ms | P95 response time |
| **MFA Verification** | < 500ms | P95 response time |
| **Session Validation** | < 50ms | P99 response time |
| **Throughput** | 10,000 auth/sec | Peak capacity |
| **Availability** | 99.95% | Monthly uptime |
| **Token Rotation** | < 100ms | Average time |

### 8.3 Scalability Design

```
┌─────────────────────────────────────────┐
│         LOAD BALANCER (Vercel)         │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐     ┌───────▼────────┐
│  Edge Function │     │  Edge Function │
│   Region: US   │     │   Region: EU   │
└───────┬────────┘     └───────┬────────┘
        │                       │
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │   Supabase (Multi-AZ) │
        │  ├─ PostgreSQL (RLS)  │
        │  ├─ Auth Service      │
        │  └─ Storage           │
        └───────────────────────┘
                    │
        ┌───────────▼───────────┐
        │    Redis (Upstash)    │
        │  ├─ Rate Limiting     │
        │  ├─ Nonce Store       │
        │  └─ Session Cache     │
        └───────────────────────┘
```

### 8.4 Security Certifications & Compliance

- ✅ **SOC 2 Type II** - Annual audit
- ✅ **ISO 27001** - Information security management
- ✅ **GDPR Compliant** - EU data protection
- ✅ **CCPA Compliant** - California privacy
- ✅ **HIPAA Eligible** - Healthcare data (if applicable)
- ✅ **PCI DSS** - Payment card industry (if applicable)
- ✅ **FIPS 140-2** - Cryptographic module validation

---

## 9. Deployment Strategy

### 9.1 Phased Rollout Plan

**Phase 1: Foundation (Weeks 1-2)**
- ✅ Implement password authentication enhancements
- ✅ Set up rate limiting and basic security
- ✅ Deploy session management
- ✅ Configure Supabase MFA foundation

**Phase 2: Core MFA (Weeks 3-4)**
- ✅ Implement TOTP authentication
- ✅ Add email OTP
- ✅ Deploy backup codes
- ✅ Build enrollment UI

**Phase 3: Advanced Factors (Weeks 5-6)**
- ✅ Implement WebAuthn/FIDO2
- ✅ Add SMS OTP (with proper warnings)
- ✅ Deploy biometric authentication
- ✅ Build verification UI

**Phase 4: Risk Engine (Weeks 7-8)**
- ✅ Implement device fingerprinting
- ✅ Deploy risk assessment engine
- ✅ Add behavioral biometrics
- ✅ Configure adaptive policies

**Phase 5: Testing & Optimization (Weeks 9-10)**
- ✅ Security penetration testing
- ✅ Load testing and optimization
- ✅ User acceptance testing
- ✅ Documentation and training

**Phase 6: Production Rollout (Week 11)**
- ✅ Gradual rollout (5% → 25% → 50% → 100%)
- ✅ Monitor metrics and errors
- ✅ Support and incident response
- ✅ Post-deployment review

### 9.2 Environment Configuration

```bash
# .env.production
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# MFA Configuration
MFA_ENFORCEMENT_MODE=optional  # optional | required | risk-based
MFA_ALLOWED_FACTORS=totp,webauthn,email,sms
MFA_GRACE_PERIOD_HOURS=24

# Security Keys
AUTH_SECRET=your-256-bit-secret
ENCRYPTION_KEY=your-aes-256-key
JWT_SECRET=your-jwt-secret

# External Services
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Redis (Rate Limiting)
UPSTASH_REDIS_URL=your-redis-url
UPSTASH_REDIS_TOKEN=your-redis-token

# Risk Assessment
IPQUALITYSCORE_API_KEY=your-ipqs-key
MAXMIND_LICENSE_KEY=your-maxmind-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-token
```

### 9.3 Monitoring & Alerting

```yaml
# monitoring-config.yaml
alerts:
  - name: "High Failed Login Rate"
    condition: "failed_logins > 100 in 5m"
    severity: warning
    action: notify_security_team
    
  - name: "MFA Bypass Attempt"
    condition: "mfa_required_but_skipped > 0"
    severity: critical
    action: block_user_and_alert
    
  - name: "Suspicious Activity Pattern"
    condition: "risk_score > 80"
    severity: high
    action: require_additional_verification
    
  - name: "Authentication Service Down"
    condition: "auth_success_rate < 95%"
    severity: critical
    action: page_on_call_engineer

metrics:
  - auth_attempts_total
  - auth_success_rate
  - mfa_enrollment_rate
  - mfa_verification_time_p95
  - session_creation_time_p95
  - risk_score_distribution
  - factor_usage_breakdown
```

---

## 10. Monitoring & Compliance

### 10.1 Audit Logging

```typescript
// src/lib/auth/audit-logger.ts
class AuditLogger {
  async logAuthEvent(event: AuthEvent): Promise<void> {
    await this.supabase.from('auth_audit_log').insert({
      user_id: event.userId,
      event_type: event.type,
      event_data: {
        action: event.action,
        factor_type: event.factorType,
        success: event.success,
        failure_reason: event.failureReason,
        context: {
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          device_fingerprint: event.deviceFingerprint,
          geolocation: event.geolocation
        }
      },
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      risk_score: event.riskScore,
      success: event.success,
      created_at: new Date()
    })
    
    // Real-time security monitoring
    if (event.riskScore && event.riskScore > 80) {
      await this.notifySecurityTeam(event)
    }
  }
  
  async generateComplianceReport(startDate: Date, endDate: Date): Promise<ComplianceReport> {
    const events = await this.supabase
      .from('auth_audit_log')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
    
    return {
      totalAuthAttempts: events.data?.length || 0,
      successfulAuths: events.data?.filter(e => e.success).length || 0,
      failedAuths: events.data?.filter(e => !e.success).length || 0,
      mfaUsageRate: this.calculateMFAUsageRate(events.data),
      highRiskEvents: events.data?.filter(e => e.risk_score > 70).length || 0,
      suspiciousActivities: await this.identifySuspiciousActivities(events.data)
    }
  }
}
```

### 10.2 GDPR Compliance Features

```typescript
// src/lib/auth/gdpr-compliance.ts
class GDPRCompliance {
  async exportUserData(userId: string): Promise<UserDataExport> {
    // Right to data portability
    const [user, factors, sessions, auditLogs] = await Promise.all([
      this.getUserProfile(userId),
      this.getUserMFAFactors(userId),
      this.getUserSessions(userId),
      this.getUserAuditLogs(userId)
    ])
    
    return {
      personal_data: user,
      mfa_factors: factors.map(f => ({
        type: f.factor_type,
        name: f.factor_name,
        created_at: f.created_at
      })),
      sessions: sessions.map(s => ({
        created_at: s.created_at,
        ip_address: s.ip_address,
        device: s.user_agent
      })),
      audit_trail: auditLogs
    }
  }
  
  async deleteUserData(userId: string, verification: FactorVerification): Promise<void> {
    // Right to erasure (Right to be forgotten)
    
    // 1. Verify user identity
    const verified = await this.verifyFactorForDeletion(userId, verification)
    if (!verified) {
      throw new Error('Identity verification required')
    }
    
    // 2. Soft delete user data (retain for legal compliance period)
    await this.softDeleteUser(userId)
    
    // 3. Anonymize audit logs
    await this.anonymizeAuditLogs(userId)
    
    // 4. Schedule hard deletion after retention period
    await this.scheduleHardDeletion(userId, 30) // 30 days retention
  }
  
  async consentManagement(userId: string, consents: UserConsents): Promise<void> {
    // Store user consent preferences
    await this.supabase.from('user_consents').upsert({
      user_id: userId,
      analytics_consent: consents.analytics,
      marketing_consent: consents.marketing,
      third_party_sharing: consents.thirdPartySharing,
      updated_at: new Date()
    })
  }
}
```

### 10.3 Security Incident Response

```typescript
// src/lib/auth/incident-response.ts
class IncidentResponseSystem {
  async detectAndRespond(event: SecurityEvent): Promise<ResponseAction> {
    // 1. Threat Classification
    const threatLevel = this.classifyThreat(event)
    
    // 2. Automated Response
    switch (threatLevel) {
      case 'critical':
        await this.executeCriticalResponse(event)
        break
      case 'high':
        await this.executeHighResponse(event)
        break
      case 'medium':
        await this.executeMediumResponse(event)
        break
    }
    
    // 3. Alert Security Team
    if (threatLevel === 'critical' || threatLevel === 'high') {
      await this.alertSecurityTeam(event, threatLevel)
    }
    
    // 4. Log Incident
    await this.logSecurityIncident(event, threatLevel)
    
    return { threatLevel, actions: this.getResponseActions(threatLevel) }
  }
  
  private async executeCriticalResponse(event: SecurityEvent): Promise<void> {
    // Immediate actions for critical threats
    await Promise.all([
      this.revokeAllUserSessions(event.userId),
      this.requireMFARevalidation(event.userId),
      this.blockIPAddress(event.ipAddress),
      this.notifyUser(event.userId, 'security_alert'),
      this.escalateToSecurityTeam(event)
    ])
  }
  
  private async executeHighResponse(event: SecurityEvent): Promise<void> {
    await Promise.all([
      this.requireMFAVerification(event.userId),
      this.increaseMonitoring(event.userId),
      this.flagAccount(event.userId, 'high_risk')
    ])
  }
}
```

---

## 11. Testing Strategy

### 11.1 Security Testing Checklist

```typescript
// src/__tests__/security/mfa-security.test.ts
describe('MFA Security Tests', () => {
  describe('Brute Force Protection', () => {
    it('should rate limit login attempts', async () => {
      // Attempt 6 logins in quick succession
      const attempts = Array(6).fill(null).map(() => 
        attemptLogin('user@example.com', 'wrongpassword')
      )
      
      const results = await Promise.all(attempts)
      expect(results[5]).toMatchObject({
        error: 'Too many attempts. Please try again later.'
      })
    })
    
    it('should implement progressive delays', async () => {
      const startTime = Date.now()
      
      await attemptLogin('user@example.com', 'wrong1')
      await attemptLogin('user@example.com', 'wrong2')
      await attemptLogin('user@example.com', 'wrong3')
      
      const duration = Date.now() - startTime
      expect(duration).toBeGreaterThan(3000) // Progressive delays
    })
  })
  
  describe('Replay Attack Protection', () => {
    it('should reject reused nonces', async () => {
      const nonce = await generateNonce()
      
      const firstRequest = await makeAuthRequest({ nonce })
      expect(firstRequest.success).toBe(true)
      
      const secondRequest = await makeAuthRequest({ nonce })
      expect(secondRequest.error).toContain('replay attack')
    })
    
    it('should reject expired timestamps', async () => {
      const oldTimestamp = Date.now() - 10 * 60 * 1000 // 10 minutes ago
      
      const result = await makeAuthRequest({ timestamp: oldTimestamp })
      expect(result.error).toContain('expired')
    })
  })
  
  describe('Session Security', () => {
    it('should detect device fingerprint changes', async () => {
      const session = await createSession(userId, deviceInfo1)
      
      const validationWithSameDevice = await validateSession(
        session.token, 
        deviceInfo1
      )
      expect(validationWithSameDevice).toBe(true)
      
      const validationWithDifferentDevice = await validateSession(
        session.token,
        deviceInfo2 // Different device
      )
      expect(validationWithDifferentDevice).toBe(false)
    })
  })
  
  describe('WebAuthn Security', () => {
    it('should validate origin', async () => {
      const challenge = await generateWebAuthnChallenge(userId)
      
      const response = {
        ...validResponse,
        clientDataJSON: modifyOrigin(validResponse.clientDataJSON, 'https://evil.com')
      }
      
      await expect(verifyWebAuthnResponse(response))
        .rejects.toThrow('Origin mismatch')
    })
  })
})
```

### 11.2 Penetration Testing Scenarios

1. **Credential Stuffing Attack Simulation**
2. **Phishing Campaign Simulation**
3. **Session Hijacking Attempts**
4. **MFA Bypass Techniques**
5. **Social Engineering Tests**
6. **API Abuse Scenarios**
7. **Race Condition Exploits**

---

## 12. Documentation & Training

### 12.1 User Documentation

- **Getting Started Guide**: How to set up MFA
- **Factor Comparison**: Which authentication method to choose
- **Troubleshooting**: Common issues and solutions
- **Security Best Practices**: Tips for secure account management
- **FAQ**: Frequently asked questions

### 12.2 Developer Documentation

- **API Reference**: Complete MFA API documentation
- **Integration Guide**: How to integrate MFA into your app
- **Code Examples**: Sample implementations
- **Migration Guide**: Upgrading from password-only auth
- **Security Guidelines**: Best practices for developers

### 12.3 Administrator Guide

- **Policy Configuration**: Setting up MFA policies
- **User Management**: Managing user factors
- **Monitoring Dashboard**: Understanding security metrics
- **Incident Response**: Handling security incidents
- **Compliance Reporting**: Generating audit reports

---

## 13. Future Enhancements

### 13.1 Roadmap

**Q1 2026**
- ✅ Passwordless authentication (WebAuthn-only)
- ✅ Adaptive authentication with ML models
- ✅ Behavioral biometrics improvements

**Q2 2026**
- ✅ Zero-knowledge proof integration
- ✅ Decentralized identity (DID) support
- ✅ Advanced threat intelligence integration

**Q3 2026**
- ✅ Quantum-resistant cryptography
- ✅ Continuous authentication
- ✅ Context-aware access control

### 13.2 Emerging Technologies

- **Passkeys**: FIDO2 + platform integration
- **Blockchain Identity**: Decentralized authentication
- **Homomorphic Encryption**: Privacy-preserving authentication
- **AI-Powered Risk Assessment**: Advanced anomaly detection

---

## 14. Appendices

### Appendix A: Cryptographic Standards

- **Password Hashing**: Bcrypt (cost factor: 12)
- **Token Generation**: Crypto.randomBytes (32 bytes)
- **Symmetric Encryption**: AES-256-GCM
- **Asymmetric Encryption**: RSA-4096, ECDSA P-256
- **Hashing**: SHA-256, SHA-512
- **Key Derivation**: PBKDF2, Argon2id

### Appendix B: API Endpoints

```
POST   /api/auth/login                 # Primary authentication
POST   /api/auth/mfa/enroll            # Enroll new factor
POST   /api/auth/mfa/challenge         # Request MFA challenge
POST   /api/auth/mfa/verify            # Verify MFA response
DELETE /api/auth/mfa/factors/:id       # Remove factor
GET    /api/auth/mfa/factors           # List enrolled factors
POST   /api/auth/mfa/backup-codes      # Generate backup codes
POST   /api/auth/webauthn/register     # WebAuthn registration
POST   /api/auth/webauthn/authenticate # WebAuthn authentication
GET    /api/auth/risk-assessment       # Get risk score
POST   /api/auth/sessions/revoke       # Revoke session
GET    /api/auth/audit-log             # Get audit logs
```

### Appendix C: Error Codes

| Code | Message | Resolution |
|------|---------|-----------|
| `AUTH_001` | Invalid credentials | Check email and password |
| `AUTH_002` | Account locked | Wait or contact support |
| `AUTH_003` | MFA required | Complete MFA verification |
| `AUTH_004` | Invalid MFA code | Re-enter code or request new |
| `AUTH_005` | Session expired | Re-authenticate |
| `AUTH_006` | Device not recognized | Verify via email/SMS |
| `AUTH_007` | Suspicious activity | Complete additional verification |
| `AUTH_008` | Factor enrollment failed | Try again or contact support |

---

## 15. Conclusion

This Multi-Factor Authentication architecture provides a comprehensive, secure, and scalable solution for the FulQrun platform. By leveraging Supabase's authentication services and implementing industry best practices, we achieve:

✅ **Enterprise-Grade Security**: Protection against all major attack vectors  
✅ **Excellent User Experience**: Seamless authentication with minimal friction  
✅ **Regulatory Compliance**: GDPR, SOC 2, and industry standards  
✅ **Scalability**: Built to handle high-traffic loads  
✅ **Flexibility**: Support for multiple authentication methods  
✅ **Observability**: Comprehensive monitoring and audit trails  

**Next Steps:**
1. Review and approve architecture
2. Begin Phase 1 implementation
3. Set up development environment
4. Configure Supabase MFA
5. Start security testing

---

**Document Control:**
- **Version:** 1.0
- **Author:** System Architect
- **Reviewed By:** Security Team, Engineering Lead
- **Approved By:** [Pending]
- **Next Review Date:** October 30, 2025

*This architecture is a living document and will be updated as the system evolves and new security requirements emerge.*
