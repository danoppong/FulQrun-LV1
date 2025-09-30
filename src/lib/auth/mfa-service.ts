/**
 * Multi-Factor Authentication Service
 * 
 * Core service for managing multi-factor authentication flows including:
 * - Factor enrollment and verification
 * - Risk-based authentication
 * - Session management
 * - Security policy enforcement
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { RiskAssessmentEngine, AuthContext, RiskScore } from './risk-engine'
import { PasswordAuthenticationFactor } from './factors/password-factor'
import { TOTPAuthenticationFactor } from './factors/totp-factor'
import { SMSOTPFactor } from './factors/sms-otp-factor'
import { EmailOTPFactor } from './factors/email-otp-factor'
import { WebAuthnFactor } from './factors/webauthn-factor'
import { BackupCodesFactor } from './factors/backup-codes'

export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  user?: any
  session?: any
  accessToken?: string
  refreshToken?: string
  requireMFA?: boolean
  requireEnrollment?: boolean
  availableFactors?: EnrolledFactor[]
  challengeId?: string
  riskScore?: RiskScore
  message?: string
}

export interface EnrolledFactor {
  id: string
  type: FactorType
  name: string
  isPrimary: boolean
  lastUsedAt?: Date
}

export type FactorType = 'password' | 'totp' | 'sms' | 'email' | 'webauthn' | 'biometric' | 'backup_codes'

export interface FactorVerification {
  code?: string
  response?: any
}

export interface MFARequirement {
  required: boolean
  factorCount: number
  allowedFactors: FactorType[]
  enforcement: 'disabled' | 'optional' | 'required'
}

export interface MFAServiceConfig {
  supabase: SupabaseClient
  riskEngine: RiskAssessmentEngine
  defaultPolicy: {
    required: boolean
    minFactors: number
    allowedFactors: FactorType[]
  }
  maxFactorsPerUser: number
}

export class MFAService {
  private factors: {
    password: PasswordAuthenticationFactor
    totp: TOTPAuthenticationFactor
    sms: SMSOTPFactor
    email: EmailOTPFactor
    webauthn: WebAuthnFactor
    backupCodes: BackupCodesFactor
  }

  constructor(private config: MFAServiceConfig) {
    // Initialize authentication factors
    this.factors = {
      password: new PasswordAuthenticationFactor(config.supabase),
      totp: new TOTPAuthenticationFactor(config.supabase),
      sms: new SMSOTPFactor(config.supabase),
      email: new EmailOTPFactor(config.supabase),
      webauthn: new WebAuthnFactor(config.supabase),
      backupCodes: new BackupCodesFactor(config.supabase)
    }
  }

  /**
   * Main authentication flow
   * 
   * Steps:
   * 1. Primary authentication (password)
   * 2. Risk assessment
   * 3. Determine MFA requirements
   * 4. Challenge or create session
   */
  async authenticate(
    credentials: AuthCredentials, 
    context: AuthContext
  ): Promise<AuthResult> {
    try {
      // Step 1: Primary authentication
      const primaryResult = await this.factors.password.authenticate(
        credentials.email,
        credentials.password
      )

      if (!primaryResult.success) {
        await this.logAuthenticationFailure(credentials.email, context, 'invalid_credentials')
        return {
          success: false,
          message: 'Invalid email or password'
        }
      }

      // Step 2: Risk assessment
      const riskScore = await this.config.riskEngine.calculateRiskScore({
        userId: primaryResult.user.id,
        email: credentials.email,
        ...context
      })

      // Step 3: Determine MFA requirements
      const mfaRequirement = await this.determineMFARequirement(riskScore, primaryResult.user)

      if (!mfaRequirement.required) {
        // Low risk - create session directly
        const session = await this.createSession(primaryResult.user, context)
        return {
          success: true,
          user: primaryResult.user,
          session,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken
        }
      }

      // Step 4: Get enrolled factors
      const availableFactors = await this.getEnrolledFactors(primaryResult.user.id)

      if (availableFactors.length === 0) {
        // User has no MFA factors enrolled
        if (mfaRequirement.enforcement === 'required') {
          return {
            success: false,
            requireEnrollment: true,
            message: 'Multi-factor authentication enrollment required'
          }
        }
      }

      // Create MFA challenge
      const challengeId = await this.createMFAChallenge(
        primaryResult.user.id,
        context,
        mfaRequirement
      )

      return {
        success: false,
        requireMFA: true,
        availableFactors,
        challengeId,
        riskScore,
        message: 'Additional verification required'
      }

    } catch (error) {
      await this.logAuthenticationFailure(
        credentials.email, 
        context, 
        error instanceof Error ? error.message : 'unknown_error'
      )
      throw error
    }
  }

  /**
   * Verify MFA challenge
   */
  async verifyMFAChallenge(
    challengeId: string,
    factorType: FactorType,
    verification: FactorVerification,
    context: AuthContext
  ): Promise<AuthResult> {
    try {
      // Retrieve challenge
      const challenge = await this.getChallenge(challengeId)

      if (!challenge) {
        throw new Error('Invalid challenge ID')
      }

      if (new Date() > new Date(challenge.expiresAt)) {
        await this.deleteChallenge(challengeId)
        throw new Error('Challenge expired. Please try again.')
      }

      // Verify factor
      const factor = this.factors[factorType as keyof typeof this.factors]
      if (!factor) {
        throw new Error(`Unsupported factor type: ${factorType}`)
      }

      const verified = await (factor as any).verify(
        challenge.userId, 
        verification
      )

      if (!verified) {
        await this.incrementFailedMFAAttempts(challengeId)
        
        // Check if max attempts reached
        const attempts = await this.getFailedAttempts(challengeId)
        if (attempts >= 3) {
          await this.deleteChallenge(challengeId)
          throw new Error('Maximum verification attempts exceeded')
        }

        return {
          success: false,
          message: 'Verification failed. Please try again.'
        }
      }

      // Get user
      const { data: user, error } = await this.config.supabase
        .from('users')
        .select('*')
        .eq('id', challenge.userId)
        .single()

      if (error || !user) {
        throw new Error('User not found')
      }

      // Update factor last used
      await this.updateFactorLastUsed(challenge.userId, factorType)

      // Delete challenge
      await this.deleteChallenge(challengeId)

      // Create session
      const session = await this.createSession(user, context)

      // Log successful MFA verification
      await this.logMFAVerification(challenge.userId, factorType, true, context)

      return {
        success: true,
        user,
        session,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken
      }

    } catch (error) {
      await this.logMFAVerification(
        '', 
        factorType, 
        false, 
        context,
        error instanceof Error ? error.message : 'unknown'
      )
      throw error
    }
  }

  /**
   * Enroll a new authentication factor
   */
  async enrollFactor(
    userId: string, 
    factorType: FactorType, 
    enrollmentData: any
  ): Promise<any> {
    // Check enrollment limits
    const currentFactors = await this.getEnrolledFactors(userId)
    
    if (currentFactors.length >= this.config.maxFactorsPerUser) {
      throw new Error(`Maximum of ${this.config.maxFactorsPerUser} factors allowed`)
    }

    // Enroll factor
    const factor = this.factors[factorType as keyof typeof this.factors]
    if (!factor) {
      throw new Error(`Unsupported factor type: ${factorType}`)
    }

    const enrollment = await (factor as any).enroll(userId, enrollmentData)

    // Log enrollment
    await this.logFactorEnrollment(userId, factorType)

    return enrollment
  }

  /**
   * Remove an authentication factor
   */
  async removeFactor(
    userId: string, 
    factorId: string, 
    verification: FactorVerification
  ): Promise<void> {
    // Verify current session/factor before removal
    // Implementation depends on verification method
    
    // Ensure user has at least one factor remaining (if MFA is enforced)
    const factors = await this.getEnrolledFactors(userId)
    const userPolicy = await this.getUserMFAPolicy(userId)

    if (factors.length <= 1 && userPolicy?.enforcement === 'required') {
      throw new Error('Cannot remove last factor when MFA is required')
    }

    // Remove factor from database
    await this.config.supabase
      .from('user_mfa_factors')
      .delete()
      .eq('id', factorId)
      .eq('user_id', userId)

    // Log removal
    await this.logFactorRemoval(userId, factorId)
  }

  /**
   * Get user's enrolled factors
   */
  private async getEnrolledFactors(userId: string): Promise<EnrolledFactor[]> {
    const { data, error } = await this.config.supabase
      .from('user_mfa_factors')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return (data || []).map(factor => ({
      id: factor.id,
      type: factor.factor_type as FactorType,
      name: factor.factor_name || factor.factor_type,
      isPrimary: factor.is_primary || false,
      lastUsedAt: factor.last_used_at ? new Date(factor.last_used_at) : undefined
    }))
  }

  /**
   * Determine MFA requirements based on risk and policies
   */
  private async determineMFARequirement(
    riskScore: RiskScore, 
    user: any
  ): Promise<MFARequirement> {
    // Get user-specific policy
    const userPolicy = await this.getUserMFAPolicy(user.id)
    
    // Get organization policy
    const orgPolicy = user.organization_id 
      ? await this.getOrganizationMFAPolicy(user.organization_id)
      : null

    // Risk-based requirements
    const riskRequirement = riskScore.recommendation

    // Combine policies (most restrictive wins)
    const required = 
      userPolicy?.enforcement === 'required' ||
      orgPolicy?.enforcement === 'required' ||
      riskRequirement.required ||
      false

    const factorCount = Math.max(
      userPolicy?.min_factors || 1,
      orgPolicy?.min_factors || 1,
      riskRequirement.requireMultiple || 1
    )

    const allowedFactors = this.intersectFactors(
      userPolicy?.allowed_factors || this.config.defaultPolicy.allowedFactors,
      orgPolicy?.allowed_factors,
      riskRequirement.suggestedFactors
    )

    const enforcement = this.getMostRestrictiveEnforcement([
      userPolicy?.enforcement,
      orgPolicy?.enforcement
    ])

    return {
      required,
      factorCount,
      allowedFactors,
      enforcement
    }
  }

  /**
   * Create MFA challenge
   */
  private async createMFAChallenge(
    userId: string,
    context: AuthContext,
    requirement: MFARequirement
  ): Promise<string> {
    const challengeId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    await this.config.supabase
      .from('mfa_challenges')
      .insert({
        id: challengeId,
        user_id: userId,
        ip_address: context.ipAddress,
        user_agent: context.userAgent,
        expires_at: expiresAt.toISOString(),
        required_factors: requirement.factorCount,
        failed_attempts: 0
      })

    return challengeId
  }

  /**
   * Get challenge by ID
   */
  private async getChallenge(challengeId: string) {
    const { data, error } = await this.config.supabase
      .from('mfa_challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (error) return null
    return data
  }

  /**
   * Delete challenge
   */
  private async deleteChallenge(challengeId: string): Promise<void> {
    await this.config.supabase
      .from('mfa_challenges')
      .delete()
      .eq('id', challengeId)
  }

  /**
   * Create authenticated session
   */
  private async createSession(user: any, context: AuthContext) {
    // Generate tokens
    const accessToken = this.generateSecureToken()
    const refreshToken = this.generateSecureToken()

    // Create device fingerprint
    const deviceFingerprint = await this.createDeviceFingerprint(context.deviceInfo)

    // Store session
    const { data: session, error } = await this.config.supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token_hash: await this.hashToken(accessToken),
        refresh_token_hash: await this.hashToken(refreshToken),
        device_fingerprint: deviceFingerprint,
        ip_address: context.ipAddress,
        user_agent: context.userAgent,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })
      .select()
      .single()

    if (error) {
      throw new Error('Failed to create session')
    }

    return {
      ...session,
      accessToken,
      refreshToken
    }
  }

  /**
   * Helper methods
   */
  private generateSecureToken(): string {
    const buffer = new Uint8Array(32)
    crypto.getRandomValues(buffer)
    return Buffer.from(buffer).toString('base64url')
  }

  private async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(token)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return Buffer.from(hashBuffer).toString('hex')
  }

  private async createDeviceFingerprint(deviceInfo: any): Promise<string> {
    const fingerprintData = {
      userAgent: deviceInfo.userAgent,
      screenResolution: deviceInfo.screenResolution,
      timezone: deviceInfo.timezone,
      language: deviceInfo.language,
      platform: deviceInfo.platform
    }

    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(fingerprintData))
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return Buffer.from(hashBuffer).toString('hex')
  }

  private intersectFactors(
    factors1: FactorType[],
    factors2?: FactorType[],
    factors3?: string[]
  ): FactorType[] {
    let result = factors1

    if (factors2) {
      result = result.filter(f => factors2.includes(f))
    }

    if (factors3) {
      result = result.filter(f => factors3.includes(f))
    }

    return result.length > 0 ? result : factors1
  }

  private getMostRestrictiveEnforcement(
    enforcements: (string | undefined)[]
  ): 'disabled' | 'optional' | 'required' {
    if (enforcements.includes('required')) return 'required'
    if (enforcements.includes('optional')) return 'optional'
    return 'disabled'
  }

  private async getUserMFAPolicy(userId: string) {
    const { data } = await this.config.supabase
      .from('user_mfa_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    return data
  }

  private async getOrganizationMFAPolicy(organizationId: string) {
    const { data } = await this.config.supabase
      .from('mfa_policies')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    return data
  }

  private async incrementFailedMFAAttempts(challengeId: string): Promise<void> {
    await this.config.supabase.rpc('increment_mfa_attempts', {
      challenge_id: challengeId
    })
  }

  private async getFailedAttempts(challengeId: string): Promise<number> {
    const challenge = await this.getChallenge(challengeId)
    return challenge?.failed_attempts || 0
  }

  private async updateFactorLastUsed(userId: string, factorType: FactorType): Promise<void> {
    await this.config.supabase
      .from('user_mfa_factors')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('factor_type', factorType)
  }

  private async logAuthenticationFailure(
    email: string,
    context: AuthContext,
    reason: string
  ): Promise<void> {
    await this.config.supabase.from('auth_audit_log').insert({
      email,
      event_type: 'authentication_failed',
      event_data: { reason },
      ip_address: context.ipAddress,
      user_agent: context.userAgent,
      success: false
    })
  }

  private async logMFAVerification(
    userId: string,
    factorType: FactorType,
    success: boolean,
    context: AuthContext,
    failureReason?: string
  ): Promise<void> {
    await this.config.supabase.from('auth_audit_log').insert({
      user_id: userId,
      event_type: 'mfa_verification',
      event_data: { factorType, failureReason },
      ip_address: context.ipAddress,
      user_agent: context.userAgent,
      success
    })
  }

  private async logFactorEnrollment(userId: string, factorType: FactorType): Promise<void> {
    await this.config.supabase.from('auth_audit_log').insert({
      user_id: userId,
      event_type: 'mfa_factor_enrolled',
      event_data: { factorType },
      success: true
    })
  }

  private async logFactorRemoval(userId: string, factorId: string): Promise<void> {
    await this.config.supabase.from('auth_audit_log').insert({
      user_id: userId,
      event_type: 'mfa_factor_removed',
      event_data: { factorId },
      success: true
    })
  }
}
