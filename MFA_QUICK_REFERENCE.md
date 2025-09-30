# MFA Quick Reference Guide

**🚀 Fast access to common MFA operations and configurations**

---

## 📁 File Structure

```
/Users/daniel/Documents/GitHub/FulQrun-LV1/
├── MFA_ARCHITECTURE.md                    # Comprehensive architecture document
├── MFA_IMPLEMENTATION_GUIDE.md            # Step-by-step implementation
├── MFA_QUICK_REFERENCE.md                 # This file
│
├── src/lib/auth/
│   ├── mfa-service.ts                     # Core MFA orchestration
│   ├── risk-engine.ts                     # Risk assessment engine
│   └── factors/
│       ├── password-factor.ts             # Password authentication
│       ├── totp-factor.ts                 # TOTP/Authenticator apps
│       ├── sms-otp-factor.ts              # SMS verification
│       ├── email-otp-factor.ts            # Email verification
│       ├── webauthn-factor.ts             # Hardware security keys
│       └── backup-codes.ts                # Recovery codes
│
├── supabase/migrations/
│   └── 20250930_mfa_architecture.sql      # Database schema
│
└── src/components/auth/
    ├── MFAEnrollment.tsx                  # Enrollment UI
    └── MFAVerification.tsx                # Verification UI
```

---

## ⚡ Quick Commands

### Setup
```bash
# Install dependencies
npm install @supabase/supabase-js otplib qrcode @simplewebauthn/server twilio

# Run migration
npx supabase db push

# Start dev server
npm run dev
```

### Testing
```bash
# Run all tests
npm test

# Run MFA tests
npm run test:mfa

# Run security tests
npm run test:security
```

### Database
```bash
# Apply migrations
npx supabase db push

# Reset database
npx supabase db reset

# View database
npx supabase db studio
```

---

## 🔐 Supported Authentication Factors

| Factor | Security Level | Setup Time | User-Friendly | Recommended |
|--------|---------------|------------|---------------|-------------|
| **Password** | ⭐⭐⭐ | Instant | ⭐⭐⭐⭐⭐ | Primary |
| **TOTP** | ⭐⭐⭐⭐ | 2 minutes | ⭐⭐⭐⭐ | ✅ Yes |
| **WebAuthn** | ⭐⭐⭐⭐⭐ | 1 minute | ⭐⭐⭐⭐⭐ | ✅ Yes |
| **SMS OTP** | ⭐⭐⭐ | 30 seconds | ⭐⭐⭐⭐⭐ | ⚠️ Conditional |
| **Email OTP** | ⭐⭐⭐ | 1 minute | ⭐⭐⭐⭐ | For recovery |
| **Biometric** | ⭐⭐⭐⭐ | 1 minute | ⭐⭐⭐⭐⭐ | Platform-dependent |

---

## 🎯 Common Operations

### Enroll User in TOTP

```typescript
import { MFAService } from '@/lib/auth/mfa-service'

const mfaService = new MFAService(config)

const enrollment = await mfaService.enrollFactor(
  userId,
  'totp',
  { email: user.email }
)

// Returns: { factorId, secret, qrCode, otpauthUrl }
```

### Verify MFA Challenge

```typescript
const result = await mfaService.verifyMFAChallenge(
  challengeId,
  'totp',
  { code: '123456' },
  context
)

if (result.success) {
  // User authenticated
  console.log('Access token:', result.accessToken)
}
```

### Calculate Risk Score

```typescript
import { RiskAssessmentEngine } from '@/lib/auth/risk-engine'

const riskEngine = new RiskAssessmentEngine(supabase)

const riskScore = await riskEngine.calculateRiskScore({
  userId,
  email,
  ipAddress: '1.2.3.4',
  userAgent: 'Mozilla/5.0...',
  deviceInfo: { /* ... */ },
  timestamp: Date.now()
})

console.log('Risk level:', riskScore.level) // low | medium | high | critical
```

### Check MFA Requirement

```typescript
const requirement = await mfaService.determineMFARequirement(
  riskScore,
  user
)

if (requirement.required) {
  // Require MFA
  console.log('Required factors:', requirement.factorCount)
  console.log('Allowed methods:', requirement.allowedFactors)
}
```

---

## 📊 Risk Levels & Actions

| Risk Score | Level | Required Action | Factors |
|-----------|-------|-----------------|---------|
| 0-29 | Low | Optional MFA | None required |
| 30-59 | Medium | MFA Required | 1 factor |
| 60-79 | High | Strong MFA | 1-2 factors (WebAuthn/TOTP) |
| 80-100 | Critical | Multi-Factor + Review | 2+ factors + manual review |

---

## 🔧 Configuration

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Optional
MFA_ENFORCEMENT_MODE=optional           # disabled | optional | required
MFA_ALLOWED_FACTORS=totp,webauthn      # Comma-separated
MFA_MAX_FACTORS_PER_USER=5             # Maximum factors per user
```

### MFA Policy Configuration

```typescript
// Organization-level policy
const policy = {
  enforcement: 'required',              // disabled | optional | required
  allowed_factors: ['totp', 'webauthn'], // Allowed methods
  min_factors: 2,                       // Minimum factors required
  require_for_roles: ['admin'],         // Roles requiring MFA
  grace_period_hours: 24                // Grace period for new users
}
```

---

## 🛡️ Security Best Practices

### ✅ DO
- ✅ Use WebAuthn/TOTP as primary MFA methods
- ✅ Implement rate limiting on all auth endpoints
- ✅ Log all authentication events
- ✅ Encrypt sensitive factor data at rest
- ✅ Use HTTPS in production
- ✅ Implement session rotation
- ✅ Provide backup codes for recovery

### ❌ DON'T
- ❌ Store TOTP secrets in plain text
- ❌ Allow unlimited authentication attempts
- ❌ Skip risk assessment for high-value accounts
- ❌ Use SMS as the only MFA method
- ❌ Ignore failed authentication alerts
- ❌ Allow password reuse
- ❌ Expose detailed error messages to users

---

## 📈 Monitoring Queries

### Failed Login Attempts (Last Hour)

```sql
SELECT email, COUNT(*) as attempts, array_agg(ip_address) as ips
FROM failed_login_attempts
WHERE attempted_at > NOW() - INTERVAL '1 hour'
GROUP BY email
HAVING COUNT(*) > 5
ORDER BY attempts DESC;
```

### MFA Enrollment Rate

```sql
SELECT 
  COUNT(DISTINCT CASE WHEN mfa_enrolled THEN user_id END)::FLOAT / 
  COUNT(DISTINCT user_id) * 100 as enrollment_rate_percent
FROM (
  SELECT u.id as user_id, 
         EXISTS(SELECT 1 FROM user_mfa_factors WHERE user_id = u.id) as mfa_enrolled
  FROM auth.users u
) stats;
```

### High-Risk Authentication Attempts

```sql
SELECT *
FROM risk_assessments
WHERE risk_score > 70
  AND assessed_at > NOW() - INTERVAL '24 hours'
ORDER BY risk_score DESC;
```

### Active Sessions by User

```sql
SELECT user_id, COUNT(*) as active_sessions
FROM user_sessions
WHERE expires_at > NOW() AND revoked = FALSE
GROUP BY user_id
ORDER BY active_sessions DESC;
```

---

## 🚨 Common Alerts

### Critical: Multiple Failed MFA Attempts

```sql
-- Alert if user fails MFA 5+ times in 30 minutes
SELECT user_id, COUNT(*) as failed_attempts
FROM auth_audit_log
WHERE event_type = 'mfa_verification'
  AND success = FALSE
  AND created_at > NOW() - INTERVAL '30 minutes'
GROUP BY user_id
HAVING COUNT(*) >= 5;
```

### Warning: Impossible Travel Detected

```sql
-- Alert on logins from different countries within 2 hours
SELECT DISTINCT ON (user_id) 
  user_id,
  country,
  created_at
FROM user_locations
WHERE created_at > NOW() - INTERVAL '2 hours'
GROUP BY user_id
HAVING COUNT(DISTINCT country) > 1;
```

---

## 🔍 Debugging

### Enable Debug Logging

```typescript
// In your MFA service
const DEBUG = process.env.DEBUG === 'true'

if (DEBUG) {
  console.log('[MFA] Risk score:', riskScore)
  console.log('[MFA] Required factors:', requirement)
  console.log('[MFA] Available factors:', availableFactors)
}
```

### Test TOTP Code Generation

```typescript
import { authenticator } from 'otplib'

const secret = 'JBSWY3DPEHPK3PXP' // Test secret
const token = authenticator.generate(secret)
console.log('Current TOTP:', token)

// Verify
const isValid = authenticator.verify({ token, secret })
console.log('Valid:', isValid)
```

### Check Database Connection

```bash
# Test Supabase connection
npx supabase db ping

# View active connections
npx supabase db query "SELECT count(*) FROM pg_stat_activity;"
```

---

## 📞 Support Contacts

| Issue | Contact | Response Time |
|-------|---------|---------------|
| **Critical Security** | security@fulqrun.com | < 1 hour |
| **MFA Not Working** | support@fulqrun.com | < 4 hours |
| **Feature Request** | GitHub Issues | 1-2 days |
| **General Questions** | docs@fulqrun.com | 1 day |

---

## 🔗 Quick Links

- **Architecture**: [MFA_ARCHITECTURE.md](./MFA_ARCHITECTURE.md)
- **Implementation**: [MFA_IMPLEMENTATION_GUIDE.md](./MFA_IMPLEMENTATION_GUIDE.md)
- **Security Policy**: [SECURITY.md](./SECURITY.md)
- **Supabase Docs**: https://supabase.com/docs/guides/auth
- **WebAuthn Guide**: https://webauthn.guide/
- **OWASP MFA**: https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html

---

## 📋 Deployment Checklist

Before deploying MFA to production:

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Rate limiting configured
- [ ] Monitoring alerts set up
- [ ] Security audit completed
- [ ] Load testing passed
- [ ] User documentation prepared
- [ ] Support team trained
- [ ] Rollback plan ready
- [ ] Backup codes generated for admin accounts
- [ ] Incident response plan updated

---

**Quick Reference v1.0 - Last Updated: September 30, 2025**

*For detailed information, refer to [MFA_ARCHITECTURE.md](./MFA_ARCHITECTURE.md)*

