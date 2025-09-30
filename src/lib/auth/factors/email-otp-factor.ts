/**
 * Email OTP Authentication Factor
 * 
 * Sends one-time verification codes via email
 * Uses Supabase's built-in email OTP functionality
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface EmailOTPVerification {
  code: string
}

export class EmailOTPFactor {
  private readonly otpExpiry = 10 * 60 * 1000 // 10 minutes
  private readonly maxAttemptsPerHour = 3

  constructor(private supabase: SupabaseClient) {}

  /**
   * Send OTP via email
   */
  async sendOTP(email: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check rate limiting
      const canSend = await this.checkRateLimit(userId)
      if (!canSend) {
        return {
          success: false,
          message: 'Too many OTP requests. Please try again later.'
        }
      }

      // Send OTP using Supabase
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

      if (error) {
        console.error('Email OTP send error:', error)
        return {
          success: false,
          message: 'Failed to send verification code'
        }
      }

      // Log OTP sent
      await this.logOTPSent(userId, email)

      return {
        success: true,
        message: 'Verification code sent to your email'
      }
    } catch (error) {
      console.error('Email OTP error:', error)
      return {
        success: false,
        message: 'An error occurred'
      }
    }
  }

  /**
   * Verify email OTP code
   */
  async verify(email: string, verification: EmailOTPVerification): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.auth.verifyOtp({
        email,
        token: verification.code,
        type: 'email'
      })

      if (error) {
        console.error('Email OTP verification error:', error)
        return false
      }

      return data.user !== null
    } catch (error) {
      console.error('Email OTP verification error:', error)
      return false
    }
  }

  /**
   * Check rate limiting for OTP sends
   */
  private async checkRateLimit(userId: string): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const { count } = await this.supabase
      .from('auth_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_type', 'email_otp_sent')
      .gte('created_at', oneHourAgo.toISOString())

    return (count || 0) < this.maxAttemptsPerHour
  }

  /**
   * Log OTP sent event
   */
  private async logOTPSent(userId: string, email: string): Promise<void> {
    await this.supabase.from('auth_audit_log').insert({
      user_id: userId,
      event_type: 'email_otp_sent',
      event_data: { 
        email,
        expires_in_minutes: 10
      },
      success: true
    })
  }
}
