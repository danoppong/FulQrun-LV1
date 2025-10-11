/**
 * WebAuthn/FIDO2 Authentication Factor
 * 
 * Implements hardware security key authentication
 * Most secure MFA method - phishing resistant
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface WebAuthnEnrollment {
  factorId: string
  publicKey: string
  credentialId: string
}

export class WebAuthnFactor {
  private readonly rpID = process.env.NEXT_PUBLIC_RP_ID || 'fulqrun.com'
  private readonly rpName = 'FulQrun'
  private readonly origin = process.env.NEXT_PUBLIC_APP_URL || 'https://app.fulqrun.com'

  constructor(private supabase: SupabaseClient) {}

  /**
   * Enroll WebAuthn credential (to be implemented with @simplewebauthn/server)
   */
  async enroll(_userId: string, _data: { email: string }): Promise<WebAuthnEnrollment> {
    // TODO: Implement with @simplewebauthn/server
    // 
    // const { generateRegistrationOptions } = require('@simplewebauthn/server')
    // 
    // const options = await generateRegistrationOptions({
    //   rpName: this.rpName,
    //   rpID: this.rpID,
    //   userID: userId,
    //   userName: data.email,
    //   timeout: 60000,
    //   attestationType: 'none',
    //   authenticatorSelection: {
    //     authenticatorAttachment: 'cross-platform',
    //     userVerification: 'preferred',
    //     residentKey: 'discouraged'
    //   }
    // })
    //
    // Store challenge and return options

    throw new Error('WebAuthn enrollment not yet implemented')
  }

  /**
   * Verify WebAuthn credential (to be implemented)
   */
  async verify(_userId: string, _verification: unknown): Promise<boolean> {
    // TODO: Implement with @simplewebauthn/server
    // 
    // const { verifyAuthenticationResponse } = require('@simplewebauthn/server')
    // 
    // Get stored credential and verify

    throw new Error('WebAuthn verification not yet implemented')
  }

  /**
   * Get user's WebAuthn credentials
   */
  async getCredentials(userId: string) {
    const { data } = await this.supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return data || []
  }

  /**
   * Remove WebAuthn credential
   */
  async removeCredential(userId: string, credentialId: string): Promise<void> {
    await this.supabase
      .from('webauthn_credentials')
      .delete()
      .eq('user_id', userId)
      .eq('credential_id', credentialId)
  }
}
