/**
 * SMS OTP Authentication Factor
 * 
 * Sends one-time verification codes via SMS using Twilio
 * Note: SMS is less secure due to SIM swap attacks - use with caution
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface SMSOTPVerification {
  code: string
}

export class SMSOTPFactor {
  private readonly otpLength = 6
  private readonly otpExpiry = 5 * 60 * 1000 // 5 minutes
  private readonly maxAttemptsPerHour = 3

  constructor(private supabase: SupabaseClient) {}

  /**
   * Send OTP via SMS (Twilio integration)
   */
  async sendOTP(phoneNumber: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check rate limiting
      const canSend = await this.checkRateLimit(userId)
      if (!canSend) {
        return {
          success: false,
          message: 'Too many OTP requests. Please try again later.'
        }
      }

      // Generate OTP
      const otp = this.generateSecureOTP()

      // Store OTP hash
      const hashedOTP = await this.hashOTP(otp)
      await this.storeOTP(userId, hashedOTP, phoneNumber)

      // TODO: Send via Twilio
      // import twilio from 'twilio'(
      //   process.env.TWILIO_ACCOUNT_SID,
      //   process.env.TWILIO_AUTH_TOKEN
      // )
      // await twilio.messages.create({
      //   body: `Your FulQrun verification code is: ${otp}. Valid for 5 minutes.`,
      //   to: phoneNumber,
      //   from: process.env.TWILIO_PHONE_NUMBER
      // })

      console.log(`SMS OTP (dev mode): ${otp}`) // For development

      await this.logOTPSent(userId, phoneNumber)

      return {
        success: true,
        message: 'Verification code sent via SMS'
      }
    } catch (error) {
      console.error('SMS OTP send error:', error)
      return {
        success: false,
        message: 'Failed to send verification code'
      }
    }
  }

  /**
   * Verify SMS OTP
   */
  async verify(userId: string, verification: SMSOTPVerification): Promise<boolean> {
    try {
      const storedData = await this.getStoredOTP(userId)

      if (!storedData) return false

      // Check expiry
      if (Date.now() > new Date(storedData.expires_at).getTime()) {
        await this.deleteOTP(userId)
        return false
      }

      // Verify OTP
      const isValid = await this.verifyHash(verification.code, storedData.otp_hash)

      // Delete OTP (one-time use)
      await this.deleteOTP(userId)

      if (isValid) {
        await this.logOTPVerification(userId, true)
      }

      return isValid
    } catch (error) {
      console.error('SMS OTP verification error:', error)
      return false
    }
  }

  private generateSecureOTP(): string {
    const buffer = new Uint8Array(this.otpLength)
    crypto.getRandomValues(buffer)
    let otp = ''
    for (let i = 0; i < this.otpLength; i++) {
      otp += (buffer[i] % 10).toString()
    }
    return otp
  }

  private async hashOTP(otp: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(otp)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return Buffer.from(hashBuffer).toString('hex')
  }

  private async verifyHash(otp: string, hash: string): Promise<boolean> {
    const otpHash = await this.hashOTP(otp)
    return otpHash === hash
  }

  private async storeOTP(userId: string, hashedOTP: string, phoneNumber: string): Promise<void> {
    const expiresAt = new Date(Date.now() + this.otpExpiry)
    
    // Note: You'll need to create an otp_codes table or use existing structure
    // This is a placeholder implementation
    await this.supabase.from('auth_audit_log').insert({
      user_id: userId,
      event_type: 'sms_otp_generated',
      event_data: {
        otp_hash: hashedOTP,
        phone: phoneNumber,
        expires_at: expiresAt.toISOString()
      }
    })
  }

  private async getStoredOTP(userId: string): Promise<unknown> {
    // Placeholder - implement proper OTP storage/retrieval
    const { data } = await this.supabase
      .from('auth_audit_log')
      .select('event_data')
      .eq('user_id', userId)
      .eq('event_type', 'sms_otp_generated')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return data?.event_data
  }

  private async deleteOTP(userId: string): Promise<void> {
    // Placeholder
    console.log('OTP deleted for user:', userId)
  }

  private async checkRateLimit(userId: string): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const { count } = await this.supabase
      .from('auth_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_type', 'sms_otp_sent')
      .gte('created_at', oneHourAgo.toISOString())

    return (count || 0) < this.maxAttemptsPerHour
  }

  private async logOTPSent(userId: string, phoneNumber: string): Promise<void> {
    await this.supabase.from('auth_audit_log').insert({
      user_id: userId,
      event_type: 'sms_otp_sent',
      event_data: { phone: phoneNumber },
      success: true
    })
  }

  private async logOTPVerification(userId: string, success: boolean): Promise<void> {
    await this.supabase.from('auth_audit_log').insert({
      user_id: userId,
      event_type: 'sms_otp_verified',
      event_data: { success },
      success
    })
  }
}
