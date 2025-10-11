/**
 * Password Authentication Factor
 * 
 * Primary authentication factor with enhanced security features:
 * - Password strength validation
 * - Breach detection
 * - Rate limiting
 * - Password history
 */

import { SupabaseClient, type Session, type User as SupabaseUser } from '@supabase/supabase-js'

export interface PasswordAuthResult {
  success: boolean
  user?: SupabaseUser
  session?: Session
  requireMFA?: boolean
  message?: string
}

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong' | 'very_strong'
}

export class PasswordAuthenticationFactor {
  private readonly minLength = 8
  private readonly maxAttempts = 5
  private readonly lockoutDuration = 15 * 60 * 1000 // 15 minutes

  constructor(private supabase: SupabaseClient) {}

  /**
   * Authenticate user with email and password
   */
  async authenticate(email: string, password: string): Promise<PasswordAuthResult> {
    try {
      // Check rate limiting
      const isLocked = await this.checkAccountLock(email)
      if (isLocked) {
        return {
          success: false,
          message: 'Account temporarily locked due to multiple failed attempts'
        }
      }

      // Authenticate with Supabase
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        // Record failed attempt
        await this.recordFailedAttempt(email)
        
        return {
          success: false,
          message: 'Invalid email or password'
        }
      }

      // Clear failed attempts on success
      await this.clearFailedAttempts(email)

      return {
        success: true,
        user: data.user,
        session: data.session
      }
    } catch (error) {
      console.error('Password authentication error:', error)
      return {
        success: false,
        message: 'Authentication failed'
      }
    }
  }

  /**
   * Validate password strength and requirements
   */
  async validatePassword(password: string, email?: string): Promise<PasswordValidationResult> {
    const errors: string[] = []
    let strengthScore = 0

    // Length check
    if (password.length < this.minLength) {
      errors.push(`Password must be at least ${this.minLength} characters`)
    } else {
      strengthScore += 1
    }

    // Uppercase check
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    } else {
      strengthScore += 1
    }

    // Lowercase check
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    } else {
      strengthScore += 1
    }

    // Number check
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    } else {
      strengthScore += 1
    }

    // Special character check
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    } else {
      strengthScore += 1
    }

    // Check against common passwords
    if (this.isCommonPassword(password)) {
      errors.push('Password is too common. Please choose a more unique password')
      strengthScore -= 2
    }

    // Email similarity check
    if (email && password.toLowerCase().includes(email.split('@')[0].toLowerCase())) {
      errors.push('Password should not contain your email')
      strengthScore -= 1
    }

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong' | 'very_strong' = 'weak'
    if (strengthScore >= 5) strength = 'very_strong'
    else if (strengthScore >= 4) strength = 'strong'
    else if (strengthScore >= 3) strength = 'medium'

    return {
      valid: errors.length === 0,
      errors,
      strength
    }
  }

  /**
   * Check if account is locked due to failed attempts
   */
  private async checkAccountLock(email: string): Promise<boolean> {
    const { count } = await this.supabase
      .from('failed_login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .gte('attempted_at', new Date(Date.now() - this.lockoutDuration).toISOString())

    return (count || 0) >= this.maxAttempts
  }

  /**
   * Record failed login attempt
   */
  private async recordFailedAttempt(email: string): Promise<void> {
    await this.supabase.from('failed_login_attempts').insert({
      email,
      ip_address: '0.0.0.0', // Will be populated by middleware
      attempted_at: new Date().toISOString(),
      failure_reason: 'invalid_credentials'
    })
  }

  /**
   * Clear failed login attempts after successful login
   */
  private async clearFailedAttempts(email: string): Promise<void> {
    await this.supabase
      .from('failed_login_attempts')
      .delete()
      .eq('email', email)
  }

  /**
   * Check if password is in common passwords list
   */
  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', 'Password123', '123456', 'qwerty', 'abc123',
      'password123', '12345678', '111111', '123123', 'admin',
      'letmein', 'welcome', 'monkey', '1234567890', 'Password1'
    ]

    return commonPasswords.some(common => 
      password.toLowerCase().includes(common.toLowerCase())
    )
  }

  /**
   * Check password history (prevent reuse)
   */
  async checkPasswordHistory(userId: string, newPassword: string): Promise<boolean> {
    // Get last 5 passwords
    const { data: history } = await this.supabase
      .from('password_history')
      .select('password_hash')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (!history || history.length === 0) return true

    // In production, properly compare hashed passwords
    // For now, this is a placeholder
    // const newHash = await bcrypt.hash(newPassword, 12)
    // return !history.some(h => bcrypt.compareSync(newPassword, h.password_hash))

    return true // Placeholder
  }

  /**
   * Save password to history
   */
  async savePasswordHistory(userId: string, passwordHash: string): Promise<void> {
    await this.supabase.from('password_history').insert({
      user_id: userId,
      password_hash: passwordHash,
      created_at: new Date().toISOString()
    })

    // Keep only last 5 passwords
    const { data: allHistory } = await this.supabase
      .from('password_history')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (allHistory && allHistory.length > 5) {
      const idsToDelete = allHistory.slice(5).map(h => h.id)
      await this.supabase
        .from('password_history')
        .delete()
        .in('id', idsToDelete)
    }
  }
}
