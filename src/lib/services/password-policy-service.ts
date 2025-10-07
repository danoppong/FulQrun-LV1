// Password Policy Service
// Service for managing password policies and validation

import { z } from 'zod';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface PasswordPolicy {
  id?: string;
  policy_name: string;
  description?: string;
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_special_chars: boolean;
  max_age_days: number;
  prevent_reuse_count: number;
  complexity_score_min: number;
  max_failed_attempts: number;
  lockout_duration_minutes: number;
  is_active: boolean;
  is_default: boolean;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface PasswordValidationResult {
  is_valid: boolean;
  violations: string[];
  strength_score: number;
  strength_level: 'weak' | 'medium' | 'strong' | 'very_strong';
  policy_compliant: boolean;
}

export interface PasswordPolicyStatus {
  policy_id: string;
  policy_name: string;
  password_age_days: number;
  days_until_expiry: number;
  is_expired: boolean;
  failed_attempts: number;
  is_locked: boolean;
  lockout_until: string | null;
  last_password_change: string | null;
  violations_count: number;
}

export interface PasswordPolicyRequirements {
  has_policy: boolean;
  policy_id?: string;
  requirements?: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_special_chars: boolean;
    max_age_days: number;
    prevent_reuse_count: number;
    complexity_score_min: number;
  };
  security_settings?: {
    max_failed_attempts: number;
    lockout_duration_minutes: number;
  };
  message?: string;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

export const PasswordPolicySchema = z.object({
  policy_name: z.string().min(1, 'Policy name is required'),
  description: z.string().optional(),
  min_length: z.number().min(8).max(50),
  require_uppercase: z.boolean(),
  require_lowercase: z.boolean(),
  require_numbers: z.boolean(),
  require_special_chars: z.boolean(),
  max_age_days: z.number().min(30).max(365),
  prevent_reuse_count: z.number().min(1).max(24),
  complexity_score_min: z.number().min(1).max(10),
  max_failed_attempts: z.number().min(3).max(10),
  lockout_duration_minutes: z.number().min(5).max(60),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false)
});

export const PasswordValidationSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  email: z.string().email().optional()
});

// =============================================================================
// PASSWORD POLICY SERVICE
// =============================================================================

export class PasswordPolicyService {
  private baseUrl = '/api/password-policies';

  // =============================================================================
  // POLICY MANAGEMENT
  // =============================================================================

  /**
   * Get all password policies for the current organization
   */
  async getPolicies(): Promise<PasswordPolicy[]> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch password policies');
      }
      const data = await response.json();
      return data.policies || [];
    } catch (error) {
      console.error('Error fetching password policies:', error);
      throw error;
    }
  }

  /**
   * Get a specific password policy by ID
   */
  async getPolicy(id: string): Promise<PasswordPolicy> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch password policy');
      }
      const data = await response.json();
      return data.policy;
    } catch (error) {
      console.error('Error fetching password policy:', error);
      throw error;
    }
  }

  /**
   * Create a new password policy
   */
  async createPolicy(policy: Omit<PasswordPolicy, 'id' | 'created_at' | 'updated_at'>): Promise<PasswordPolicy> {
    try {
      const validatedData = PasswordPolicySchema.parse(policy);
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create password policy');
      }

      const data = await response.json();
      return data.policy;
    } catch (error) {
      console.error('Error creating password policy:', error);
      throw error;
    }
  }

  /**
   * Update an existing password policy
   */
  async updatePolicy(id: string, policy: Partial<PasswordPolicy>): Promise<PasswordPolicy> {
    try {
      const validatedData = PasswordPolicySchema.partial().parse(policy);
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update password policy');
      }

      const data = await response.json();
      return data.policy;
    } catch (error) {
      console.error('Error updating password policy:', error);
      throw error;
    }
  }

  /**
   * Delete a password policy
   */
  async deletePolicy(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete password policy');
      }
    } catch (error) {
      console.error('Error deleting password policy:', error);
      throw error;
    }
  }

  // =============================================================================
  // PASSWORD VALIDATION
  // =============================================================================

  /**
   * Validate a password against the current user's policy
   */
  async validatePassword(password: string, email?: string): Promise<PasswordValidationResult> {
    try {
      const validatedData = PasswordValidationSchema.parse({ password, email });
      const response = await fetch(`${this.baseUrl}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData)
      });

      if (!response.ok) {
        throw new Error('Failed to validate password');
      }

      const data = await response.json();
      return data.validation;
    } catch (error) {
      console.error('Error validating password:', error);
      throw error;
    }
  }

  /**
   * Get password policy requirements for the current user
   */
  async getRequirements(): Promise<PasswordPolicyRequirements> {
    try {
      const response = await fetch(`${this.baseUrl}/requirements`);
      if (!response.ok) {
        throw new Error('Failed to get password requirements');
      }
      const data = await response.json();
      return data.requirements;
    } catch (error) {
      console.error('Error getting password requirements:', error);
      throw error;
    }
  }

  // =============================================================================
  // PASSWORD STATUS AND MANAGEMENT
  // =============================================================================

  /**
   * Get password policy status for a user
   */
  async getStatus(userId?: string): Promise<PasswordPolicyStatus | null> {
    try {
      const url = userId ? `${this.baseUrl}/status?user_id=${userId}` : `${this.baseUrl}/status`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to get password status');
      }
      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Error getting password status:', error);
      throw error;
    }
  }

  /**
   * Force a user to change their password
   */
  async forcePasswordChange(userId: string, reason?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          reason: reason || 'admin_forced'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to force password change');
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error forcing password change:', error);
      throw error;
    }
  }

  /**
   * Unlock a user account
   */
  async unlockAccount(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unlock account');
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error unlocking account:', error);
      throw error;
    }
  }

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Calculate password complexity score
   */
  calculateComplexityScore(policy: PasswordPolicy): number {
    let score = 0;
    if (policy.min_length >= 8) score += 2;
    if (policy.min_length >= 12) score += 1;
    if (policy.require_uppercase) score += 1;
    if (policy.require_lowercase) score += 1;
    if (policy.require_numbers) score += 1;
    if (policy.require_special_chars) score += 1;
    if (policy.prevent_reuse_count >= 5) score += 1;
    if (policy.max_age_days <= 90) score += 1;
    return Math.min(score, 10);
  }

  /**
   * Get complexity level from score
   */
  getComplexityLevel(score: number): 'weak' | 'medium' | 'strong' | 'very_strong' {
    if (score >= 8) return 'very_strong';
    if (score >= 6) return 'strong';
    if (score >= 4) return 'medium';
    return 'weak';
  }

  /**
   * Format violation messages for display
   */
  formatViolationMessage(violation: string): string {
    const messages: Record<string, string> = {
      'length_insufficient': 'Password is too short',
      'missing_uppercase': 'Password must contain uppercase letters',
      'missing_lowercase': 'Password must contain lowercase letters',
      'missing_numbers': 'Password must contain numbers',
      'missing_special_chars': 'Password must contain special characters',
      'common_password': 'Password is too common',
      'email_similarity': 'Password should not contain your email',
      'reuse_violation': 'Password has been used recently',
      'age_exceeded': 'Password has expired',
      'complexity_insufficient': 'Password does not meet complexity requirements'
    };
    return messages[violation] || violation;
  }

  /**
   * Get password strength color
   */
  getStrengthColor(strength: string): string {
    const colors: Record<string, string> = {
      'weak': 'text-red-600',
      'medium': 'text-yellow-600',
      'strong': 'text-blue-600',
      'very_strong': 'text-green-600'
    };
    return colors[strength] || 'text-gray-600';
  }

  /**
   * Get password strength background color
   */
  getStrengthBgColor(strength: string): string {
    const colors: Record<string, string> = {
      'weak': 'bg-red-500',
      'medium': 'bg-yellow-500',
      'strong': 'bg-blue-500',
      'very_strong': 'bg-green-500'
    };
    return colors[strength] || 'bg-gray-500';
  }
}

// =============================================================================
// EXPORT SINGLETON INSTANCE
// =============================================================================

export const passwordPolicyService = new PasswordPolicyService();
