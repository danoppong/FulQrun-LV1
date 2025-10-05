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
  EyeIcon,
  EyeSlashIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LockClosedIcon,
  FingerPrintIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client';
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
  parameters: Record<string, any>;
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

  const handleSave = async () => {
    try {
      const validatedData = PasswordPolicySchema.parse(policy);
      
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
      }
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
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Save Policy
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
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Total Events:</span>
          <span className="text-sm font-medium text-gray-900">{events.length}</span>
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
      
      // Mock security events data
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
          <div className="text-center py-12">
            <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Login Security Configuration</h3>
            <p className="text-gray-500">Login security settings configuration coming soon...</p>
          </div>
        )}
        {activeTab === 'securityEvents' && (
          <SecurityEvents events={events} />
        )}
      </div>
    </div>
  );
}
