// Administration Module - Authentication Management Interface
// Comprehensive authentication and security management

'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon, 
  KeyIcon, 
  UserCircleIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowUpDownIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LockClosedIcon,
  FingerPrintIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client'
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface AuthenticationConfiguration {
  passwordPolicy: PasswordPolicy;
  sessionManagement: SessionManagement;
  loginSecurity: LoginSecurity;
  accountLockout: AccountLockout;
  auditSettings: AuditSettings;
}

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // in days
  preventReuse: number; // number of previous passwords
  complexityScore: number; // minimum complexity score
}

interface SessionManagement {
  sessionTimeout: number; // in minutes
  maxConcurrentSessions: number;
  requireReauthForSensitive: boolean;
  sessionInactivityTimeout: number; // in minutes
  rememberMeDuration: number; // in days
  forceLogoutOnPasswordChange: boolean;
}

interface LoginSecurity {
  enableBruteForceProtection: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  enableGeolocationTracking: boolean;
  requireEmailVerification: boolean;
  enableSuspiciousActivityDetection: boolean;
}

interface AccountLockout {
  enableAccountLockout: boolean;
  maxFailedAttempts: number;
  lockoutDuration: number; // in minutes
  enableProgressiveLockout: boolean;
  progressiveLockoutMultiplier: number;
  maxLockoutDuration: number; // in minutes
}

interface AuditSettings {
  enableLoginAudit: boolean;
  enablePasswordChangeAudit: boolean;
  enableSessionAudit: boolean;
  enableFailedLoginAudit: boolean;
  auditRetentionDays: number;
  enableRealTimeAlerts: boolean;
}

interface SecurityEvent {
  id: string;
  userId: string;
  userName: string;
  eventType: 'login' | 'logout' | 'password_change' | 'failed_login' | 'account_locked' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
}

interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'brute_force' | 'suspicious_location' | 'multiple_failed_logins' | 'unusual_activity';
  userId?: string;
  ipAddress?: string;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
  actions: SecurityAction[];
}

interface SecurityAction {
  id: string;
  type: 'block_ip' | 'lock_account' | 'require_mfa' | 'send_notification' | 'log_event';
  parameters: Record<string, unknown>;
  executed: boolean;
  executedAt?: Date;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const PasswordPolicySchema = z.object({
  minLength: z.number().min(8, 'Minimum length must be at least 8'),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSpecialChars: z.boolean(),
  maxAge: z.number().min(30, 'Maximum age must be at least 30 days'),
  preventReuse: z.number().min(1, 'Must prevent reuse of at least 1 previous password'),
  complexityScore: z.number().min(1).max(10, 'Complexity score must be between 1-10')
});

const SessionManagementSchema = z.object({
  sessionTimeout: z.number().min(15, 'Session timeout must be at least 15 minutes'),
  maxConcurrentSessions: z.number().min(1, 'Must allow at least 1 concurrent session'),
  requireReauthForSensitive: z.boolean(),
  sessionInactivityTimeout: z.number().min(5, 'Inactivity timeout must be at least 5 minutes'),
  rememberMeDuration: z.number().min(1, 'Remember me duration must be at least 1 day'),
  forceLogoutOnPasswordChange: z.boolean()
});

// =============================================================================
// PASSWORD POLICY COMPONENT
// =============================================================================

function PasswordPolicyConfig({ config, onUpdate }: { config: AuthenticationConfiguration; onUpdate: (config: AuthenticationConfiguration) => void }) {
  const [policy, setPolicy] = useState<PasswordPolicy>(config.passwordPolicy);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [policies, setPolicies] = useState<unknown[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);

  // Load password policies from database
  useEffect(() => {
    const loadPolicies = async () => {
      try {
        const response = await fetch('/api/password-policies');
        if (response.ok) {
          const data = await response.json();
          setPolicies(data.policies || []);
          
          // Set default policy if available
          const defaultPolicy = data.policies?.find((p: unknown) => p.is_default);
          if (defaultPolicy) {
            setSelectedPolicyId(defaultPolicy.id);
            setPolicy({
              minLength: defaultPolicy.min_length,
              requireUppercase: defaultPolicy.require_uppercase,
              requireLowercase: defaultPolicy.require_lowercase,
              requireNumbers: defaultPolicy.require_numbers,
              requireSpecialChars: defaultPolicy.require_special_chars,
              maxAge: defaultPolicy.max_age_days,
              preventReuse: defaultPolicy.prevent_reuse_count,
              complexityScore: defaultPolicy.complexity_score_min
            });
          }
        } else if (response.status === 401) {
          // User not authenticated, use default policy
          console.log('User not authenticated, using default policy');
        } else if (response.status === 500) {
          // Database not ready, use mock data for now
          console.log('Database not ready, using mock password policy');
          const mockPolicy = {
            id: 'mock-policy-1',
            policy_name: 'Default Password Policy',
            description: 'Default password policy for organization',
            min_length: 8,
            require_uppercase: true,
            require_lowercase: true,
            require_numbers: true,
            require_special_chars: true,
            max_age_days: 90,
            prevent_reuse_count: 5,
            complexity_score_min: 6,
            max_failed_attempts: 5,
            lockout_duration_minutes: 15,
            is_active: true,
            is_default: true
          };
          setPolicies([mockPolicy]);
          setSelectedPolicyId(mockPolicy.id);
          setPolicy({
            minLength: mockPolicy.min_length,
            requireUppercase: mockPolicy.require_uppercase,
            requireLowercase: mockPolicy.require_lowercase,
            requireNumbers: mockPolicy.require_numbers,
            requireSpecialChars: mockPolicy.require_special_chars,
            maxAge: mockPolicy.max_age_days,
            preventReuse: mockPolicy.prevent_reuse_count,
            complexityScore: mockPolicy.complexity_score_min
          });
        } else {
          console.error('Failed to load password policies:', response.status);
        }
      } catch (error) {
        console.error('Error loading password policies:', error);
        // Use mock data on error
        const mockPolicy = {
          id: 'mock-policy-1',
          policy_name: 'Default Password Policy',
          description: 'Default password policy for organization',
          min_length: 8,
          require_uppercase: true,
          require_lowercase: true,
          require_numbers: true,
          require_special_chars: true,
          max_age_days: 90,
          prevent_reuse_count: 5,
          complexity_score_min: 6,
          max_failed_attempts: 5,
          lockout_duration_minutes: 15,
          is_active: true,
          is_default: true
        };
        setPolicies([mockPolicy]);
        setSelectedPolicyId(mockPolicy.id);
        setPolicy({
          minLength: mockPolicy.min_length,
          requireUppercase: mockPolicy.require_uppercase,
          requireLowercase: mockPolicy.require_lowercase,
          requireNumbers: mockPolicy.require_numbers,
          requireSpecialChars: mockPolicy.require_special_chars,
          maxAge: mockPolicy.max_age_days,
          preventReuse: mockPolicy.prevent_reuse_count,
          complexityScore: mockPolicy.complexity_score_min
        });
      }
    };

    loadPolicies();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const validatedData = PasswordPolicySchema.parse(policy);
      
      if (selectedPolicyId) {
        // Update existing policy
        const response = await fetch(`/api/password-policies/${selectedPolicyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            policy_name: 'Updated Password Policy',
            description: 'Updated password policy',
            min_length: validatedData.minLength,
            require_uppercase: validatedData.requireUppercase,
            require_lowercase: validatedData.requireLowercase,
            require_numbers: validatedData.requireNumbers,
            require_special_chars: validatedData.requireSpecialChars,
            max_age_days: validatedData.maxAge,
            prevent_reuse_count: validatedData.preventReuse,
            complexity_score_min: validatedData.complexityScore,
            max_failed_attempts: 5,
            lockout_duration_minutes: 15,
            is_active: true,
            is_default: true
          })
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required to save password policies');
          } else if (response.status === 500) {
            throw new Error('Database not ready. Password policy changes will be applied when database is available.');
          }
          throw new Error('Failed to update policy');
        }
      } else {
        // Create new policy
        const response = await fetch('/api/password-policies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            policy_name: 'Password Policy',
            description: 'Organization password policy',
            min_length: validatedData.minLength,
            require_uppercase: validatedData.requireUppercase,
            require_lowercase: validatedData.requireLowercase,
            require_numbers: validatedData.requireNumbers,
            require_special_chars: validatedData.requireSpecialChars,
            max_age_days: validatedData.maxAge,
            prevent_reuse_count: validatedData.preventReuse,
            complexity_score_min: validatedData.complexityScore,
            max_failed_attempts: 5,
            lockout_duration_minutes: 15,
            is_active: true,
            is_default: true
          })
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required to save password policies');
          } else if (response.status === 500) {
            throw new Error('Database not ready. Password policy changes will be applied when database is available.');
          }
          throw new Error('Failed to create policy');
        }

        const data = await response.json();
        setSelectedPolicyId(data.policy.id);
      }
      
      const updatedConfig = {
        ...config,
        passwordPolicy: validatedData
      };
      
      onUpdate(updatedConfig);
      setIsEditing(false);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: error instanceof Error ? error.message : 'Failed to save password policy' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPolicy(config.passwordPolicy);
    setIsEditing(false);
    setErrors({});
  };

  const calculateComplexityScore = () => {
    let score = 0;
    if (policy.minLength >= 8) score += 2;
    if (policy.minLength >= 12) score += 1;
    if (policy.requireUppercase) score += 1;
    if (policy.requireLowercase) score += 1;
    if (policy.requireNumbers) score += 1;
    if (policy.requireSpecialChars) score += 1;
    if (policy.preventReuse >= 5) score += 1;
    if (policy.maxAge <= 90) score += 1;
    return Math.min(score, 10);
  };

  const complexityScore = calculateComplexityScore();
  const complexityLevel = complexityScore >= 8 ? 'Strong' : complexityScore >= 6 ? 'Medium' : 'Weak';
  const complexityColor = complexityScore >= 8 ? 'text-green-600' : complexityScore >= 6 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Password Policy</h3>
          <p className="text-sm text-gray-500">Configure password requirements and security settings</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Policy
          </button>
        )}
      </div>

      {/* Complexity Score */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Password Complexity Score</h4>
            <p className="text-sm text-gray-500">Current policy strength assessment</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${complexityColor}`}>{complexityScore}/10</div>
            <div className={`text-sm font-medium ${complexityColor}`}>{complexityLevel}</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                complexityScore >= 8 ? 'bg-green-500' : 
                complexityScore >= 6 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${(complexityScore / 10) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Status Display */}
      {selectedPolicyId === 'mock-policy-1' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Development Mode</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Using mock password policy data. Database migrations will be applied when Supabase is available.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errors.general}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Minimum Length</label>
          <input
            type="number"
            value={policy.minLength}
            onChange={(e) => setPolicy({ ...policy, minLength: parseInt(e.target.value) })}
            disabled={!isEditing}
            min="8"
            max="50"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.minLength ? 'border-red-300' : ''}`}
          />
          {errors.minLength && <p className="mt-1 text-sm text-red-600">{errors.minLength}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Maximum Age (days)</label>
          <input
            type="number"
            value={policy.maxAge}
            onChange={(e) => setPolicy({ ...policy, maxAge: parseInt(e.target.value) })}
            disabled={!isEditing}
            min="30"
            max="365"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.maxAge ? 'border-red-300' : ''}`}
          />
          {errors.maxAge && <p className="mt-1 text-sm text-red-600">{errors.maxAge}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Prevent Reuse (passwords)</label>
          <input
            type="number"
            value={policy.preventReuse}
            onChange={(e) => setPolicy({ ...policy, preventReuse: parseInt(e.target.value) })}
            disabled={!isEditing}
            min="1"
            max="24"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.preventReuse ? 'border-red-300' : ''}`}
          />
          {errors.preventReuse && <p className="mt-1 text-sm text-red-600">{errors.preventReuse}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Minimum Complexity Score</label>
          <input
            type="number"
            value={policy.complexityScore}
            onChange={(e) => setPolicy({ ...policy, complexityScore: parseInt(e.target.value) })}
            disabled={!isEditing}
            min="1"
            max="10"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.complexityScore ? 'border-red-300' : ''}`}
          />
          {errors.complexityScore && <p className="mt-1 text-sm text-red-600">{errors.complexityScore}</p>}
        </div>
      </div>

      {/* Character Requirements */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Character Requirements</h4>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={policy.requireUppercase}
              onChange={(e) => setPolicy({ ...policy, requireUppercase: e.target.checked })}
              disabled={!isEditing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Require uppercase letters (A-Z)</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={policy.requireLowercase}
              onChange={(e) => setPolicy({ ...policy, requireLowercase: e.target.checked })}
              disabled={!isEditing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Require lowercase letters (a-z)</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={policy.requireNumbers}
              onChange={(e) => setPolicy({ ...policy, requireNumbers: e.target.checked })}
              disabled={!isEditing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Require numbers (0-9)</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={policy.requireSpecialChars}
              onChange={(e) => setPolicy({ ...policy, requireSpecialChars: e.target.checked })}
              disabled={!isEditing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Require special characters (!@#$%^&*)</label>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <XCircleIcon className="h-4 w-4 mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Policy'}
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SESSION MANAGEMENT COMPONENT
// =============================================================================

function SessionManagementConfig({ config, onUpdate }: { config: AuthenticationConfiguration; onUpdate: (config: AuthenticationConfiguration) => void }) {
  const [sessionConfig, setSessionConfig] = useState<SessionManagement>(config.sessionManagement);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    try {
      const validatedData = SessionManagementSchema.parse(sessionConfig);
      
      const updatedConfig = {
        ...config,
        sessionManagement: validatedData
      };
      
      onUpdate(updatedConfig);
      setIsEditing(false);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleCancel = () => {
    setSessionConfig(config.sessionManagement);
    setIsEditing(false);
    setErrors({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Session Management</h3>
          <p className="text-sm text-gray-500">Configure user session settings and security</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Settings
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
          <input
            type="number"
            value={sessionConfig.sessionTimeout}
            onChange={(e) => setSessionConfig({ ...sessionConfig, sessionTimeout: parseInt(e.target.value) })}
            disabled={!isEditing}
            min="15"
            max="1440"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.sessionTimeout ? 'border-red-300' : ''}`}
          />
          {errors.sessionTimeout && <p className="mt-1 text-sm text-red-600">{errors.sessionTimeout}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Max Concurrent Sessions</label>
          <input
            type="number"
            value={sessionConfig.maxConcurrentSessions}
            onChange={(e) => setSessionConfig({ ...sessionConfig, maxConcurrentSessions: parseInt(e.target.value) })}
            disabled={!isEditing}
            min="1"
            max="10"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.maxConcurrentSessions ? 'border-red-300' : ''}`}
          />
          {errors.maxConcurrentSessions && <p className="mt-1 text-sm text-red-600">{errors.maxConcurrentSessions}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Inactivity Timeout (minutes)</label>
          <input
            type="number"
            value={sessionConfig.sessionInactivityTimeout}
            onChange={(e) => setSessionConfig({ ...sessionConfig, sessionInactivityTimeout: parseInt(e.target.value) })}
            disabled={!isEditing}
            min="5"
            max="120"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.sessionInactivityTimeout ? 'border-red-300' : ''}`}
          />
          {errors.sessionInactivityTimeout && <p className="mt-1 text-sm text-red-600">{errors.sessionInactivityTimeout}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Remember Me Duration (days)</label>
          <input
            type="number"
            value={sessionConfig.rememberMeDuration}
            onChange={(e) => setSessionConfig({ ...sessionConfig, rememberMeDuration: parseInt(e.target.value) })}
            disabled={!isEditing}
            min="1"
            max="30"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.rememberMeDuration ? 'border-red-300' : ''}`}
          />
          {errors.rememberMeDuration && <p className="mt-1 text-sm text-red-600">{errors.rememberMeDuration}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Security Options</h4>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={sessionConfig.requireReauthForSensitive}
              onChange={(e) => setSessionConfig({ ...sessionConfig, requireReauthForSensitive: e.target.checked })}
              disabled={!isEditing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Require re-authentication for sensitive operations</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={sessionConfig.forceLogoutOnPasswordChange}
              onChange={(e) => setSessionConfig({ ...sessionConfig, forceLogoutOnPasswordChange: e.target.checked })}
              disabled={!isEditing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Force logout on password change</label>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <XCircleIcon className="h-4 w-4 mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Save Settings
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SECURITY EVENTS COMPONENT
// =============================================================================

function SecurityEvents({ events }: { events: SecurityEvent[] }) {
  const [filteredEvents, setFilteredEvents] = useState<SecurityEvent[]>(events);
  const [filters, setFilters] = useState({
    severity: '',
    eventType: '',
    resolved: ''
  });
  const [isRealData, setIsRealData] = useState(false);

  useEffect(() => {
    let filtered = [...events];

    if (filters.severity) {
      filtered = filtered.filter(event => event.severity === filters.severity);
    }

    if (filters.eventType) {
      filtered = filtered.filter(event => event.eventType === filters.eventType);
    }

    if (filters.resolved !== '') {
      filtered = filtered.filter(event => event.resolved === (filters.resolved === 'true'));
    }

    setFilteredEvents(filtered);
    
    // Detect if we're using real data (events with IDs starting with 'audit-' or 'violation-')
    const hasRealData = events.some(event => 
      event.id.startsWith('audit-') || event.id.startsWith('violation-')
    );
    setIsRealData(hasRealData);
  }, [events, filters]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'login': return UserCircleIcon;
      case 'logout': return UserCircleIcon;
      case 'password_change': return KeyIcon;
      case 'failed_login': return ExclamationTriangleIcon;
      case 'account_locked': return LockClosedIcon;
      case 'suspicious_activity': return ExclamationTriangleIcon;
      default: return InformationCircleIcon;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Security Events</h3>
          <p className="text-sm text-gray-500">Monitor authentication and security events</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Total Events:</span>
            <span className="text-sm font-medium text-gray-900">{events.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isRealData ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-xs text-gray-500">
              {isRealData ? 'Live Data' : 'Mock Data'}
            </span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Event Type</label>
            <select
              value={filters.eventType}
              onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="password_change">Password Change</option>
              <option value="failed_login">Failed Login</option>
              <option value="account_locked">Account Locked</option>
              <option value="suspicious_activity">Suspicious Activity</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.resolved}
              onChange={(e) => setFilters({ ...filters, resolved: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Status</option>
              <option value="false">Unresolved</option>
              <option value="true">Resolved</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ severity: '', eventType: '', resolved: '' })}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEvents.map((event) => {
              const EventIcon = getEventIcon(event.eventType);
              
              return (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <EventIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {event.eventType.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-500">{event.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.userName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {event.ipAddress}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.location || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.timestamp.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {event.resolved ? 'Resolved' : 'Unresolved'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// LOGIN SECURITY CONFIGURATION COMPONENT
// =============================================================================

const LoginSecurityConfig: React.FC<{
  config: AuthenticationConfiguration;
  onUpdate: (config: AuthenticationConfiguration) => void;
}> = ({ config, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginSecurity, setLoginSecurity] = useState<LoginSecurity>(config.loginSecurity);

  const LoginSecuritySchema = z.object({
    enableBruteForceProtection: z.boolean(),
    maxLoginAttempts: z.number().min(3).max(10),
    lockoutDuration: z.number().min(5).max(60),
    enableGeolocationTracking: z.boolean(),
    requireEmailVerification: z.boolean(),
    enableSuspiciousActivityDetection: z.boolean()
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const validatedData = LoginSecuritySchema.parse(loginSecurity);
      
      const updatedConfig = {
        ...config,
        loginSecurity: validatedData
      };
      
      onUpdate(updatedConfig);
      setIsEditing(false);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: 'Failed to save login security configuration' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setLoginSecurity(config.loginSecurity);
    setIsEditing(false);
    setErrors({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Login Security Configuration</h3>
          <p className="text-sm text-gray-500">Configure login security settings and protection mechanisms</p>
        </div>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <XCircleIcon className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Configuration
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errors.general}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brute Force Protection */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center mb-4">
          <ShieldCheckIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h4 className="text-lg font-medium text-gray-900">Brute Force Protection</h4>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Brute Force Protection</label>
              <p className="text-sm text-gray-500">Automatically lock accounts after multiple failed login attempts</p>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={loginSecurity.enableBruteForceProtection}
                onChange={(e) => setLoginSecurity({
                  ...loginSecurity,
                  enableBruteForceProtection: e.target.checked
                })}
                disabled={!isEditing}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
            </div>
          </div>

          {loginSecurity.enableBruteForceProtection && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Maximum Login Attempts</label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={loginSecurity.maxLoginAttempts}
                    onChange={(e) => setLoginSecurity({
                      ...loginSecurity,
                      maxLoginAttempts: parseInt(e.target.value) || 3
                    })}
                    disabled={!isEditing}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-100"
                  />
                  {errors.maxLoginAttempts && (
                    <p className="mt-1 text-sm text-red-600">{errors.maxLoginAttempts}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lockout Duration (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={loginSecurity.lockoutDuration}
                    onChange={(e) => setLoginSecurity({
                      ...loginSecurity,
                      lockoutDuration: parseInt(e.target.value) || 5
                    })}
                    disabled={!isEditing}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-100"
                  />
                  {errors.lockoutDuration && (
                    <p className="mt-1 text-sm text-red-600">{errors.lockoutDuration}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Geolocation Tracking */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center mb-4">
          <DevicePhoneMobileIcon className="h-6 w-6 text-green-600 mr-3" />
          <h4 className="text-lg font-medium text-gray-900">Geolocation Tracking</h4>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Enable Geolocation Tracking</label>
            <p className="text-sm text-gray-500">Track login locations for security monitoring and anomaly detection</p>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={loginSecurity.enableGeolocationTracking}
              onChange={(e) => setLoginSecurity({
                ...loginSecurity,
                enableGeolocationTracking: e.target.checked
              })}
              disabled={!isEditing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Email Verification */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center mb-4">
          <UserCircleIcon className="h-6 w-6 text-purple-600 mr-3" />
          <h4 className="text-lg font-medium text-gray-900">Email Verification</h4>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Require Email Verification</label>
            <p className="text-sm text-gray-500">Force users to verify their email address before accessing the system</p>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={loginSecurity.requireEmailVerification}
              onChange={(e) => setLoginSecurity({
                ...loginSecurity,
                requireEmailVerification: e.target.checked
              })}
              disabled={!isEditing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Suspicious Activity Detection */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 mr-3" />
          <h4 className="text-lg font-medium text-gray-900">Suspicious Activity Detection</h4>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Enable Suspicious Activity Detection</label>
            <p className="text-sm text-gray-500">Automatically detect and flag unusual login patterns or behaviors</p>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={loginSecurity.enableSuspiciousActivityDetection}
              onChange={(e) => setLoginSecurity({
                ...loginSecurity,
                enableSuspiciousActivityDetection: e.target.checked
              })}
              disabled={!isEditing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Security Status Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <InformationCircleIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h4 className="text-lg font-medium text-blue-900">Security Status Summary</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${loginSecurity.enableBruteForceProtection ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-700">Brute Force Protection: {loginSecurity.enableBruteForceProtection ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${loginSecurity.enableGeolocationTracking ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-700">Geolocation Tracking: {loginSecurity.enableGeolocationTracking ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${loginSecurity.requireEmailVerification ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-700">Email Verification: {loginSecurity.requireEmailVerification ? 'Required' : 'Optional'}</span>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${loginSecurity.enableSuspiciousActivityDetection ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-700">Activity Detection: {loginSecurity.enableSuspiciousActivityDetection ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN AUTHENTICATION MANAGEMENT COMPONENT
// =============================================================================

export default function AuthenticationManagement() {
  const [config, setConfig] = useState<AuthenticationConfiguration>({
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90,
      preventReuse: 5,
      complexityScore: 7
    },
    sessionManagement: {
      sessionTimeout: 480, // 8 hours
      maxConcurrentSessions: 3,
      requireReauthForSensitive: true,
      sessionInactivityTimeout: 30,
      rememberMeDuration: 7,
      forceLogoutOnPasswordChange: true
    },
    loginSecurity: {
      enableBruteForceProtection: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      enableGeolocationTracking: true,
      requireEmailVerification: true,
      enableSuspiciousActivityDetection: true
    },
    accountLockout: {
      enableAccountLockout: true,
      maxFailedAttempts: 5,
      lockoutDuration: 15,
      enableProgressiveLockout: true,
      progressiveLockoutMultiplier: 2,
      maxLockoutDuration: 60
    },
    auditSettings: {
      enableLoginAudit: true,
      enablePasswordChangeAudit: true,
      enableSessionAudit: true,
      enableFailedLoginAudit: true,
      auditRetentionDays: 365,
      enableRealTimeAlerts: true
    }
  });

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [activeTab, setActiveTab] = useState('passwordPolicy');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Try to load real security events from database
      try {
        const response = await fetch('/api/security-events');
        console.log('Security events API response:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Security events data received:', data);
          setEvents(data.events || []);
          return;
        } else if (response.status === 401) {
          console.log('Unauthorized - using mock data');
        } else {
          console.log('API error:', response.status, response.statusText);
        }
      } catch (error) {
        console.log('API not available, using mock data:', error);
      }
      
      // Fallback to mock data if API is not available
      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          userId: 'user-1',
          userName: 'john.doe@acme.com',
          eventType: 'failed_login',
          severity: 'high',
          description: 'Multiple failed login attempts detected',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: 'New York, US',
          timestamp: new Date('2024-10-01T10:30:00Z'),
          resolved: false
        },
        {
          id: '2',
          userId: 'user-2',
          userName: 'jane.smith@acme.com',
          eventType: 'login',
          severity: 'low',
          description: 'Successful login from new location',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          location: 'San Francisco, US',
          timestamp: new Date('2024-10-01T09:15:00Z'),
          resolved: true
        },
        {
          id: '3',
          userId: 'user-1',
          userName: 'john.doe@acme.com',
          eventType: 'account_locked',
          severity: 'critical',
          description: 'Account locked due to excessive failed login attempts',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: 'New York, US',
          timestamp: new Date('2024-10-01T10:35:00Z'),
          resolved: false
        },
        {
          id: '4',
          userId: 'user-3',
          userName: 'bob.wilson@acme.com',
          eventType: 'password_change',
          severity: 'medium',
          description: 'Password changed successfully',
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
          location: 'Chicago, US',
          timestamp: new Date('2024-09-30T16:45:00Z'),
          resolved: true
        },
        {
          id: '5',
          userId: 'user-4',
          userName: 'alice.johnson@acme.com',
          eventType: 'suspicious_activity',
          severity: 'high',
          description: 'Unusual login pattern detected',
          ipAddress: '203.0.113.1',
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          location: 'Unknown',
          timestamp: new Date('2024-09-30T14:20:00Z'),
          resolved: false
        }
      ];
      
      setEvents(mockEvents);
    } catch (error) {
      console.error('Error loading authentication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = (updatedConfig: AuthenticationConfiguration) => {
    setConfig(updatedConfig);
    // In real implementation, this would save to the API
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'passwordPolicy', name: 'Password Policy', icon: KeyIcon },
    { id: 'sessionManagement', name: 'Session Management', icon: ClockIcon },
    { id: 'loginSecurity', name: 'Login Security', icon: ShieldCheckIcon },
    { id: 'securityEvents', name: 'Security Events', icon: ExclamationTriangleIcon }
  ];

  const criticalEvents = events.filter(e => e.severity === 'critical' && !e.resolved).length;
  const highEvents = events.filter(e => e.severity === 'high' && !e.resolved).length;
  const totalEvents = events.length;
  const resolvedEvents = events.filter(e => e.resolved).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Authentication Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure authentication policies, session management, and monitor security events
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Critical Events</p>
              <p className="text-2xl font-semibold text-gray-900">{criticalEvents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">High Priority</p>
              <p className="text-2xl font-semibold text-gray-900">{highEvents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <InformationCircleIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Events</p>
              <p className="text-2xl font-semibold text-gray-900">{totalEvents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Resolved</p>
              <p className="text-2xl font-semibold text-gray-900">{resolvedEvents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2 inline" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 rounded-lg shadow">
        {activeTab === 'passwordPolicy' && (
          <PasswordPolicyConfig config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'sessionManagement' && (
          <SessionManagementConfig config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'loginSecurity' && (
          <LoginSecurityConfig config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'securityEvents' && (
          <SecurityEvents events={events} />
        )}
      </div>
    </div>
  );
}
