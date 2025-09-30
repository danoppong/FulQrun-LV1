/**
 * Backup Codes Authentication Factor
 * 
 * One-time use recovery codes for account access when primary
 * MFA methods are unavailable
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface BackupCodesGeneration {
  codes: string[]
  count: number
  expiresAt?: Date
}

export class BackupCodesFactor {
  private readonly codeCount = 10
  private readonly codeLength = 8

  constructor(private supabase: SupabaseClient) {}

  /**
   * Generate new backup codes for user
   */
  async generate(userId: string): Promise<BackupCodesGeneration> {
    const codes: string[] = []

    try {
      // Revoke existing unused codes
      await this.revokeExistingCodes(userId)

      // Generate new codes
      for (let i = 0; i < this.codeCount; i++) {
        const code = this.generateSecureCode()
        codes.push(code)

        // Store hashed version
        const hashedCode = await this.hashCode(code)
        await this.supabase.from('backup_codes').insert({
          user_id: userId,
          code_hash: hashedCode,
          used: false,
          created_at: new Date().toISOString()
        })
      }

      // Log generation
      await this.logBackupCodesGenerated(userId, this.codeCount)

      return {
        codes,
        count: this.codeCount,
        expiresAt: undefined // Optional: add expiration
      }
    } catch (error) {
      console.error('Backup codes generation error:', error)
      throw new Error('Failed to generate backup codes')
    }
  }

  /**
   * Verify and consume backup code
   */
  async verify(userId: string, code: string): Promise<boolean> {
    try {
      // Clean up input
      const cleanCode = code.replace(/[-\s]/g, '').toUpperCase()

      // Get all unused codes for user
      const { data: storedCodes, error } = await this.supabase
        .from('backup_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('used', false)
        .order('created_at', { ascending: false })

      if (error || !storedCodes || storedCodes.length === 0) {
        return false
      }

      // Try to match against stored codes
      for (const storedCode of storedCodes) {
        const isValid = await this.verifyHash(cleanCode, storedCode.code_hash)
        
        if (isValid) {
          // Mark code as used (one-time use only)
          await this.markCodeAsUsed(storedCode.id)
          
          // Log usage
          await this.logBackupCodeUsed(userId, storedCode.id)

          // Warn if running low on codes
          const remainingCodes = storedCodes.length - 1
          if (remainingCodes <= 2) {
            await this.warnLowBackupCodes(userId, remainingCodes)
          }

          return true
        }
      }

      return false
    } catch (error) {
      console.error('Backup code verification error:', error)
      return false
    }
  }

  /**
   * Check remaining backup codes count
   */
  async getRemainingCount(userId: string): Promise<number> {
    const { count } = await this.supabase
      .from('backup_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('used', false)

    return count || 0
  }

  /**
   * Get backup codes status
   */
  async getStatus(userId: string) {
    const { data: codes } = await this.supabase
      .from('backup_codes')
      .select('used, created_at, used_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    const total = codes?.length || 0
    const used = codes?.filter(c => c.used).length || 0
    const remaining = total - used

    return {
      total,
      used,
      remaining,
      lastGenerated: codes?.[0]?.created_at
    }
  }

  /**
   * Regenerate backup codes (revoke old, create new)
   */
  async regenerate(userId: string): Promise<BackupCodesGeneration> {
    // This is the same as generate, which already revokes existing
    return this.generate(userId)
  }

  /**
   * Generate cryptographically secure backup code
   */
  private generateSecureCode(): string {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude ambiguous chars (0, O, I, 1, L)
    let code = ''
    const randomBytes = new Uint8Array(this.codeLength)
    crypto.getRandomValues(randomBytes)

    for (let i = 0; i < this.codeLength; i++) {
      code += charset[randomBytes[i] % charset.length]
    }

    // Format as XXXX-XXXX for readability
    return `${code.slice(0, 4)}-${code.slice(4)}`
  }

  /**
   * Hash backup code for secure storage
   */
  private async hashCode(code: string): Promise<string> {
    // Remove formatting for consistent hashing
    const cleanCode = code.replace(/[-\s]/g, '')
    
    const encoder = new TextEncoder()
    const data = encoder.encode(cleanCode)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return Buffer.from(hashBuffer).toString('hex')
  }

  /**
   * Verify code against hash (constant-time comparison)
   */
  private async verifyHash(code: string, hash: string): Promise<boolean> {
    const codeHash = await this.hashCode(code)
    
    // Constant-time comparison to prevent timing attacks
    if (codeHash.length !== hash.length) return false
    
    let result = 0
    for (let i = 0; i < codeHash.length; i++) {
      result |= codeHash.charCodeAt(i) ^ hash.charCodeAt(i)
    }
    
    return result === 0
  }

  /**
   * Mark backup code as used
   */
  private async markCodeAsUsed(codeId: string): Promise<void> {
    await this.supabase
      .from('backup_codes')
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', codeId)
  }

  /**
   * Revoke all unused codes for user
   */
  private async revokeExistingCodes(userId: string): Promise<void> {
    await this.supabase
      .from('backup_codes')
      .delete()
      .eq('user_id', userId)
      .eq('used', false)
  }

  /**
   * Warn user about low backup codes
   */
  private async warnLowBackupCodes(userId: string, remaining: number): Promise<void> {
    await this.supabase.from('auth_audit_log').insert({
      user_id: userId,
      event_type: 'backup_codes_low',
      event_data: {
        remaining,
        message: `Only ${remaining} backup codes remaining. Consider regenerating.`
      },
      success: true
    })

    // In production, also send email/notification
    console.warn(`User ${userId} has only ${remaining} backup codes remaining`)
  }

  /**
   * Log backup codes generation
   */
  private async logBackupCodesGenerated(userId: string, count: number): Promise<void> {
    await this.supabase.from('auth_audit_log').insert({
      user_id: userId,
      event_type: 'backup_codes_generated',
      event_data: { count },
      success: true
    })
  }

  /**
   * Log backup code usage
   */
  private async logBackupCodeUsed(userId: string, codeId: string): Promise<void> {
    await this.supabase.from('auth_audit_log').insert({
      user_id: userId,
      event_type: 'backup_code_used',
      event_data: { code_id: codeId },
      success: true
    })
  }
}
