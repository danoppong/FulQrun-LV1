/**
 * TOTP (Time-based One-Time Password) Authentication Factor
 * 
 * Implements authenticator app-based MFA using TOTP standard (RFC 6238)
 * Compatible with Google Authenticator, Authy, Microsoft Authenticator, etc.
 */

import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import { SupabaseClient } from '@supabase/supabase-js'

export interface TOTPEnrollment {
  factorId: string
  secret: string
  qrCode: string
  otpauthUrl: string
  backupCodes: string[]
}

export interface TOTPVerification {
  code: string
}

export class TOTPAuthenticationFactor {
  constructor(private supabase: SupabaseClient) {
    // Configure otplib
    authenticator.options = {
      window: 1, // Allow 30 seconds before/after for clock skew
      step: 30,  // 30 second time step
      digits: 6  // 6-digit codes
    }
  }

  /**
   * Enroll user in TOTP authentication
   */
  async enroll(userId: string, data: { email: string }): Promise<TOTPEnrollment> {
    try {
      // Generate secret
      const secret = authenticator.generateSecret(32)
      
      // Create OTP auth URL
      const otpauthUrl = authenticator.keyuri(
        data.email,
        'FulQrun',
        secret
      )
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      // Store in database (in production, encrypt the secret)
      const { data: factor, error } = await this.supabase
        .from('user_mfa_factors')
        .insert({
          user_id: userId,
          factor_type: 'totp',
          factor_name: 'Authenticator App',
          factor_data: { 
            secret: this.encryptSecret(secret), // Should be encrypted
            algorithm: 'SHA1',
            digits: 6,
            period: 30
          }
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Generate backup codes
      const backupCodes = await this.generateBackupCodes(userId)
      
      // Log enrollment
      await this.logEnrollment(userId, factor.id)
      
      return {
        factorId: factor.id,
        secret,
        qrCode: qrCodeDataUrl,
        otpauthUrl,
        backupCodes
      }
    } catch (error) {
      console.error('TOTP enrollment error:', error)
      throw new Error('Failed to enroll TOTP factor')
    }
  }

  /**
   * Verify TOTP code
   */
  async verify(userId: string, verification: TOTPVerification): Promise<boolean> {
    try {
      // Get user's TOTP factor
      const { data: factor, error } = await this.supabase
        .from('user_mfa_factors')
        .select('factor_data, id')
        .eq('user_id', userId)
        .eq('factor_type', 'totp')
        .single()
      
      if (error || !factor) {
        console.error('TOTP factor not found:', error)
        return false
      }
      
      // Decrypt secret
      const secret = this.decryptSecret(factor.factor_data.secret)
      
      // Verify code
      const isValid = authenticator.verify({
        token: verification.code,
        secret
      })
      
      if (isValid) {
        // Update last used timestamp
        await this.updateLastUsed(factor.id)
        
        // Mark as verified if first time
        await this.markAsVerified(factor.id)
      }
      
      return isValid
    } catch (error) {
      console.error('TOTP verification error:', error)
      return false
    }
  }

  /**
   * Generate current TOTP code (for testing/display)
   */
  generateCode(secret: string): string {
    return authenticator.generate(secret)
  }

  /**
   * Validate TOTP secret format
   */
  isValidSecret(secret: string): boolean {
    try {
      return authenticator.check(authenticator.generate(secret), secret)
    } catch {
      return false
    }
  }

  /**
   * Generate backup codes for recovery
   */
  private async generateBackupCodes(userId: string): Promise<string[]> {
    const codes: string[] = []
    const codeCount = 10
    
    for (let i = 0; i < codeCount; i++) {
      // Generate 8-character backup code
      const code = this.generateBackupCode()
      codes.push(code)
      
      // Store hashed version
      await this.supabase.from('backup_codes').insert({
        user_id: userId,
        code_hash: await this.hashCode(code)
      })
    }
    
    return codes
  }

  /**
   * Generate single backup code
   */
  private generateBackupCode(): string {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude ambiguous chars
    let code = ''
    const randomBytes = new Uint8Array(8)
    crypto.getRandomValues(randomBytes)
    
    for (let i = 0; i < 8; i++) {
      code += charset[randomBytes[i] % charset.length]
    }
    
    // Format as XXXX-XXXX
    return `${code.slice(0, 4)}-${code.slice(4)}`
  }

  /**
   * Simple encryption (in production, use proper encryption)
   */
  private encryptSecret(secret: string): string {
    // TODO: Implement proper encryption with a key from env
    // For now, just base64 encode (NOT SECURE for production)
    return Buffer.from(secret).toString('base64')
  }

  /**
   * Simple decryption (in production, use proper decryption)
   */
  private decryptSecret(encryptedSecret: string): string {
    // TODO: Implement proper decryption
    // For now, just base64 decode
    return Buffer.from(encryptedSecret, 'base64').toString('utf-8')
  }

  /**
   * Hash backup code for storage
   */
  private async hashCode(code: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(code)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return Buffer.from(hashBuffer).toString('hex')
  }

  /**
   * Update factor last used timestamp
   */
  private async updateLastUsed(factorId: string): Promise<void> {
    await this.supabase
      .from('user_mfa_factors')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', factorId)
  }

  /**
   * Mark factor as verified
   */
  private async markAsVerified(factorId: string): Promise<void> {
    const { data } = await this.supabase
      .from('user_mfa_factors')
      .select('verified_at')
      .eq('id', factorId)
      .single()
    
    if (data && !data.verified_at) {
      await this.supabase
        .from('user_mfa_factors')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', factorId)
    }
  }

  /**
   * Log enrollment event
   */
  private async logEnrollment(userId: string, factorId: string): Promise<void> {
    await this.supabase.from('auth_audit_log').insert({
      user_id: userId,
      event_type: 'mfa_factor_enrolled',
      event_data: { 
        factor_type: 'totp',
        factor_id: factorId
      },
      success: true
    })
  }
}
