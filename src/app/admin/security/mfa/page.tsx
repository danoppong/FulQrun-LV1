// Administration Module - Multi-Factor Authentication Configuration
// Comprehensive MFA management and configuration

'use client';

import React, { useState, useEffect } from 'react';
import { ;
  FingerPrintIcon, 
  DevicePhoneMobileIcon, 
  KeyIcon, 
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
  ShieldCheckIcon,
  QrCodeIcon,
  CogIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client';
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface MFAConfiguration {
  globalSettings: MFAGlobalSettings;
  methods: MFAMethod[];
  policies: MFAPolicy[];
  backupCodes: BackupCodeSettings;
  enforcement: MFAEnforcement;
}

interface MFAGlobalSettings {
  enabled: boolean;
  requiredForAllUsers: boolean;
  requiredForAdmins: boolean;
  gracePeriod: number; // in days
  allowRememberDevice: boolean;
  rememberDeviceDuration: number; // in days
  maxDevicesPerUser: number;
}

interface MFAMethod {
  id: string;
  name: string;
  type: 'totp' | 'sms' | 'email' | 'push' | 'hardware' | 'biometric';
  enabled: boolean;
  priority: number;
  settings: MFAMethodSettings;
  usage: MFAUsageStats;
}

interface MFAMethodSettings {
  issuer?: string;
  algorithm?: string;
  digits?: number;
  period?: number;
  window?: number;
  smsProvider?: string;
  emailTemplate?: string;
  pushService?: string;
  hardwareType?: string;
}

interface MFAUsageStats {
  totalUsers: number;
  activeUsers: number;
  successRate: number;
  failureRate: number;
  lastUsed?: Date;
}

interface MFAPolicy {
  id: string;
  name: string;
  description?: string;
  targetUsers: PolicyTarget;
  requirements: MFARequirement[];
  exceptions: MFAException[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PolicyTarget {
  type: 'all' | 'role' | 'group' | 'individual';
  roles?: string[];
  groups?: string[];
  users?: string[];
}

interface MFARequirement {
  type: 'method' | 'combination' | 'frequency';
  methodId?: string;
  methods?: string[];
  combination?: 'any' | 'all';
  frequency?: 'every_login' | 'daily' | 'weekly' | 'monthly';
}

interface MFAException {
  type: 'ip_range' | 'location' | 'time' | 'device';
  value: string;
  description?: string;
}

interface BackupCodeSettings {
  enabled: boolean;
  generateOnSetup: boolean;
  codeLength: number;
  codeCount: number;
  expirationDays?: number;
  allowRegeneration: boolean;
}

interface MFAEnforcement {
  enforceForNewUsers: boolean;
  enforceForExistingUsers: boolean;
  enforcementDeadline?: Date;
  allowGracePeriod: boolean;
  gracePeriodDays: number;
  lockoutAfterGracePeriod: boolean;
}

interface MFAEvent {
  id: string;
  userId: string;
  userName: string;
  eventType: 'setup' | 'verify' | 'failed_verify' | 'disable' | 'enable' | 'backup_used';
  methodId: string;
  methodName: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: any;
}

interface MFAUser {
  id: string;
  name: string;
  email: string;
  role: string;
  mfaEnabled: boolean;
  methods: UserMFAMethod[];
  lastUsed?: Date;
  setupDate?: Date;
  status: 'enrolled' | 'pending' | 'exempt' | 'locked';
}

interface UserMFAMethod {
  methodId: string;
  methodName: string;
  enabled: boolean;
  setupDate: Date;
  lastUsed?: Date;
  isDefault: boolean;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const MFAGlobalSettingsSchema = z.object({
  enabled: z.boolean(),
  requiredForAllUsers: z.boolean(),
  requiredForAdmins: z.boolean(),
  gracePeriod: z.number().min(0, 'Grace period must be non-negative'),
  allowRememberDevice: z.boolean(),
  rememberDeviceDuration: z.number().min(1, 'Remember device duration must be at least 1 day'),
  maxDevicesPerUser: z.number().min(1, 'Must allow at least 1 device per user')
});

const MFAMethodSchema = z.object({
  name: z.string().min(1, 'Method name is required'),
  type: z.enum(['totp', 'sms', 'email', 'push', 'hardware', 'biometric']),
  enabled: z.boolean(),
  priority: z.number().min(1, 'Priority must be at least 1')
});

const MFAPolicySchema = z.object({
  name: z.string().min(1, 'Policy name is required'),
  description: z.string().optional(),
  isActive: z.boolean()
});

// =============================================================================
// MFA METHODS COMPONENT
// =============================================================================

function MFAMethods({ config, onUpdate }: { config: MFAConfiguration; onUpdate: (config: MFAConfiguration) => void }) {
  const [methods, setMethods] = useState<MFAMethod[]>(config.methods);
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<MFAMethod | undefined>();

  const methodTypes = [
    { 
      value: 'totp', 
      label: 'TOTP (Time-based)', 
      icon: ClockIcon, 
      color: 'bg-blue-100 text-blue-800',
      description: 'Google Authenticator, Authy, etc.'
    },
    { 
      value: 'sms', 
      label: 'SMS', 
      icon: DevicePhoneMobileIcon, 
      color: 'bg-green-100 text-green-800',
      description: 'Text message verification'
    },
    { 
      value: 'email', 
      label: 'Email', 
      icon: InformationCircleIcon, 
      color: 'bg-purple-100 text-purple-800',
      description: 'Email verification codes'
    },
    { 
      value: 'push', 
      label: 'Push Notification', 
      icon: ShieldCheckIcon, 
      color: 'bg-yellow-100 text-yellow-800',
      description: 'Mobile app push notifications'
    },
    { 
      value: 'hardware', 
      label: 'Hardware Token', 
      icon: KeyIcon, 
      color: 'bg-red-100 text-red-800',
      description: 'YubiKey, RSA tokens, etc.'
    },
    { 
      value: 'biometric', 
      label: 'Biometric', 
      icon: FingerPrintIcon, 
      color: 'bg-indigo-100 text-indigo-800',
      description: 'Fingerprint, face recognition'
    }
  ];

  const handleSaveMethod = (methodData: Partial<MFAMethod>) => {
    try {
      const validatedData = MFAMethodSchema.parse(methodData);
      
      if (editingMethod) {
        const updatedMethods = methods.map(m => 
          m.id === editingMethod.id 
            ? { ...m, ...validatedData, id: editingMethod.id }
            : m
        );
        setMethods(updatedMethods);
      } else {
        const newMethod: MFAMethod = {
          id: Date.now().toString(),
          ...validatedData,
          settings: {},
          usage: {
            totalUsers: 0,
            activeUsers: 0,
            successRate: 0,
            failureRate: 0
          }
        };
        setMethods([...methods, newMethod]);
      }
      
      setShowForm(false);
      setEditingMethod(undefined);
      
      onUpdate({
        ...config,
        methods,
        globalSettings: config.globalSettings,
        policies: config.policies,
        backupCodes: config.backupCodes,
        enforcement: config.enforcement
      });
    } catch (error) {
      console.error('Error saving MFA method:', error);
    }
  };

  const handleDeleteMethod = (methodId: string) => {
    setMethods(methods.filter(m => m.id !== methodId));
    onUpdate({
      ...config,
      methods: methods.filter(m => m.id !== methodId),
      globalSettings: config.globalSettings,
      policies: config.policies,
      backupCodes: config.backupCodes,
      enforcement: config.enforcement
    });
  };

  const handleToggleMethod = (methodId: string) => {
    const updatedMethods = methods.map(m => 
      m.id === methodId ? { ...m, enabled: !m.enabled } : m
    );
    setMethods(updatedMethods);
    onUpdate({
      ...config,
      methods: updatedMethods,
      globalSettings: config.globalSettings,
      policies: config.policies,
      backupCodes: config.backupCodes,
      enforcement: config.enforcement
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">MFA Methods</h3>
          <p className="text-sm text-gray-500">Configure available multi-factor authentication methods</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Method
        </button>
      </div>

      {/* Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {methods.map((method) => {
          const methodType = methodTypes.find(t => t.value === method.type);
          const TypeIcon = methodType?.icon || CogIcon;
          
          return (
            <div key={method.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <TypeIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-900">{method.name}</h4>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingMethod(method);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleMethod(method.id)}
                    className={method.enabled ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                  >
                    {method.enabled ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteMethod(method.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Type</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${methodType?.color}`}>
                    {methodType?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Priority</span>
                  <span className="text-xs text-gray-900">{method.priority}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Active Users</span>
                  <span className="text-xs text-gray-900">{method.usage.activeUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Success Rate</span>
                  <span className="text-xs text-gray-900">{method.usage.successRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`text-xs ${method.enabled ? 'text-green-600' : 'text-red-600'}`}>
                    {method.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Method Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingMethod ? 'Edit MFA Method' : 'Add MFA Method'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveMethod({
                  name: formData.get('name') as string,
                  type: formData.get('type') as any,
                  enabled: true,
                  priority: parseInt(formData.get('priority') as string)
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Method Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingMethod?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Method Type</label>
                  <select
                    name="type"
                    defaultValue={editingMethod?.type}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {methodTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <input
                    type="number"
                    name="priority"
                    defaultValue={editingMethod?.priority || methods.length + 1}
                    min="1"
                    max="10"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingMethod(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingMethod ? 'Update Method' : 'Add Method'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MFA POLICIES COMPONENT
// =============================================================================

function MFAPolicies({ config, onUpdate }: { config: MFAConfiguration; onUpdate: (config: MFAConfiguration) => void }) {
  const [policies, setPolicies] = useState<MFAPolicy[]>(config.policies);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<MFAPolicy | undefined>();

  const handleSavePolicy = (policyData: Partial<MFAPolicy>) => {
    try {
      const validatedData = MFAPolicySchema.parse(policyData);
      
      if (editingPolicy) {
        const updatedPolicies = policies.map(p => 
          p.id === editingPolicy.id 
            ? { ...p, ...validatedData, id: editingPolicy.id, updatedAt: new Date() }
            : p
        );
        setPolicies(updatedPolicies);
      } else {
        const newPolicy: MFAPolicy = {
          id: Date.now().toString(),
          ...validatedData,
          targetUsers: { type: 'all' },
          requirements: [],
          exceptions: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setPolicies([...policies, newPolicy]);
      }
      
      setShowForm(false);
      setEditingPolicy(undefined);
      
      onUpdate({
        ...config,
        methods: config.methods,
        globalSettings: config.globalSettings,
        policies,
        backupCodes: config.backupCodes,
        enforcement: config.enforcement
      });
    } catch (error) {
      console.error('Error saving MFA policy:', error);
    }
  };

  const handleDeletePolicy = (policyId: string) => {
    setPolicies(policies.filter(p => p.id !== policyId));
    onUpdate({
      ...config,
      methods: config.methods,
      globalSettings: config.globalSettings,
      policies: policies.filter(p => p.id !== policyId),
      backupCodes: config.backupCodes,
      enforcement: config.enforcement
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">MFA Policies</h3>
          <p className="text-sm text-gray-500">Configure MFA requirements for different user groups</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Policy
        </button>
      </div>

      {/* Policies Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirements</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exceptions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {policies.map((policy) => (
              <tr key={policy.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{policy.name}</div>
                    {policy.description && (
                      <div className="text-sm text-gray-500">{policy.description}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {policy.targetUsers.type === 'all' ? 'All Users' : 
                   policy.targetUsers.type === 'role' ? `Roles: ${policy.targetUsers.roles?.join(', ')}` :
                   policy.targetUsers.type === 'group' ? `Groups: ${policy.targetUsers.groups?.join(', ')}` :
                   `Users: ${policy.targetUsers.users?.length || 0}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {policy.requirements.length} requirements
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {policy.exceptions.length} exceptions
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    policy.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {policy.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingPolicy(policy);
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePolicy(policy.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Policy Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingPolicy ? 'Edit MFA Policy' : 'Create MFA Policy'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSavePolicy({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  isActive: true
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Policy Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingPolicy?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingPolicy?.description}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingPolicy(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingPolicy ? 'Update Policy' : 'Create Policy'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MFA USERS COMPONENT
// =============================================================================

function MFAUsers({ users }: { users: MFAUser[] }) {
  const [filteredUsers, setFilteredUsers] = useState<MFAUser[]>(users);
  const [filters, setFilters] = useState({
    status: '',
    role: '',
    mfaEnabled: ''
  });

  useEffect(() => {
    let filtered = [...users];

    if (filters.status) {
      filtered = filtered.filter(user => user.status === filters.status);
    }

    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    if (filters.mfaEnabled !== '') {
      filtered = filtered.filter(user => user.mfaEnabled === (filters.mfaEnabled === 'true'));
    }

    setFilteredUsers(filtered);
  }, [users, filters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'exempt': return 'bg-blue-100 text-blue-800';
      case 'locked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">MFA Users</h3>
          <p className="text-sm text-gray-500">Monitor MFA enrollment and usage across users</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Enrolled: <span className="font-medium text-green-600">{users.filter(u => u.mfaEnabled).length}</span>
          </div>
          <div className="text-sm text-gray-500">
            Pending: <span className="font-medium text-yellow-600">{users.filter(u => u.status === 'pending').length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Status</option>
              <option value="enrolled">Enrolled</option>
              <option value="pending">Pending</option>
              <option value="exempt">Exempt</option>
              <option value="locked">Locked</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="rep">Sales Rep</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">MFA Status</label>
            <select
              value={filters.mfaEnabled}
              onChange={(e) => setFilters({ ...filters, mfaEnabled: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All</option>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', role: '', mfaEnabled: '' })}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MFA Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Methods</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Used</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.mfaEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.mfaEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.methods.filter(m => m.enabled).length} active
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.lastUsed ? user.lastUsed.toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN MFA CONFIGURATION COMPONENT
// =============================================================================

export default function MFAConfiguration() {
  const [config, setConfig] = useState<MFAConfiguration>({
    globalSettings: {
      enabled: true,
      requiredForAllUsers: false,
      requiredForAdmins: true,
      gracePeriod: 30,
      allowRememberDevice: true,
      rememberDeviceDuration: 30,
      maxDevicesPerUser: 5
    },
    methods: [],
    policies: [],
    backupCodes: {
      enabled: true,
      generateOnSetup: true,
      codeLength: 8,
      codeCount: 10,
      expirationDays: 90,
      allowRegeneration: true
    },
    enforcement: {
      enforceForNewUsers: true,
      enforceForExistingUsers: false,
      allowGracePeriod: true,
      gracePeriodDays: 30,
      lockoutAfterGracePeriod: false
    }
  });

  const [users, setUsers] = useState<MFAUser[]>([]);
  const [activeTab, setActiveTab] = useState('methods');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock MFA methods data
      const mockMethods: MFAMethod[] = [
        {
          id: '1',
          name: 'Google Authenticator',
          type: 'totp',
          enabled: true,
          priority: 1,
          settings: {
            issuer: 'FulQrun',
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            window: 1
          },
          usage: {
            totalUsers: 45,
            activeUsers: 42,
            successRate: 98.5,
            failureRate: 1.5,
            lastUsed: new Date()
          }
        },
        {
          id: '2',
          name: 'SMS Verification',
          type: 'sms',
          enabled: true,
          priority: 2,
          settings: {
            smsProvider: 'Twilio'
          },
          usage: {
            totalUsers: 38,
            activeUsers: 35,
            successRate: 95.2,
            failureRate: 4.8,
            lastUsed: new Date()
          }
        },
        {
          id: '3',
          name: 'Email Verification',
          type: 'email',
          enabled: true,
          priority: 3,
          settings: {
            emailTemplate: 'mfa-verification'
          },
          usage: {
            totalUsers: 25,
            activeUsers: 22,
            successRate: 97.8,
            failureRate: 2.2,
            lastUsed: new Date()
          }
        }
      ];

      // Mock MFA policies data
      const mockPolicies: MFAPolicy[] = [
        {
          id: '1',
          name: 'Admin MFA Requirement',
          description: 'All admin users must use MFA',
          targetUsers: { type: 'role', roles: ['admin'] },
          requirements: [
            { type: 'method', methodId: '1' },
            { type: 'frequency', frequency: 'every_login' }
          ],
          exceptions: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Sales Team MFA',
          description: 'Sales team members must use MFA for sensitive operations',
          targetUsers: { type: 'role', roles: ['manager', 'rep'] },
          requirements: [
            { type: 'combination', methods: ['1', '2'], combination: 'any' },
            { type: 'frequency', frequency: 'daily' }
          ],
          exceptions: [
            { type: 'ip_range', value: '192.168.1.0/24', description: 'Office network' }
          ],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Mock MFA users data
      const mockUsers: MFAUser[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@acme.com',
          role: 'admin',
          mfaEnabled: true,
          methods: [
            { methodId: '1', methodName: 'Google Authenticator', enabled: true, setupDate: new Date('2024-01-15'), isDefault: true },
            { methodId: '2', methodName: 'SMS Verification', enabled: true, setupDate: new Date('2024-01-20'), isDefault: false }
          ],
          lastUsed: new Date('2024-10-01'),
          setupDate: new Date('2024-01-15'),
          status: 'enrolled'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane.smith@acme.com',
          role: 'manager',
          mfaEnabled: true,
          methods: [
            { methodId: '1', methodName: 'Google Authenticator', enabled: true, setupDate: new Date('2024-02-01'), isDefault: true }
          ],
          lastUsed: new Date('2024-09-30'),
          setupDate: new Date('2024-02-01'),
          status: 'enrolled'
        },
        {
          id: '3',
          name: 'Bob Wilson',
          email: 'bob.wilson@acme.com',
          role: 'rep',
          mfaEnabled: false,
          methods: [],
          status: 'pending'
        }
      ];
      
      setConfig({
        ...config,
        methods: mockMethods,
        policies: mockPolicies
      });
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading MFA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = (updatedConfig: MFAConfiguration) => {
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
    { id: 'methods', name: 'MFA Methods', icon: FingerPrintIcon },
    { id: 'policies', name: 'MFA Policies', icon: ShieldCheckIcon },
    { id: 'users', name: 'MFA Users', icon: UserGroupIcon },
    { id: 'settings', name: 'Global Settings', icon: CogIcon },
    { id: 'backup', name: 'Backup Codes', icon: KeyIcon }
  ];

  const enrolledUsers = users.filter(u => u.mfaEnabled).length;
  const pendingUsers = users.filter(u => u.status === 'pending').length;
  const totalUsers = users.length;
  const activeMethods = config.methods.filter(m => m.enabled).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Multi-Factor Authentication</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure MFA methods, policies, and monitor user enrollment
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <FingerPrintIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Methods</p>
              <p className="text-2xl font-semibold text-gray-900">{activeMethods}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Enrolled Users</p>
              <p className="text-2xl font-semibold text-gray-900">{enrolledUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending Users</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Enrollment Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {totalUsers > 0 ? Math.round((enrolledUsers / totalUsers) * 100) : 0}%
              </p>
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
        {activeTab === 'methods' && (
          <MFAMethods config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'policies' && (
          <MFAPolicies config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'users' && (
          <MFAUsers users={users} />
        )}
        {activeTab === 'settings' && (
          <div className="text-center py-12">
            <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Global MFA Settings</h3>
            <p className="text-gray-500">Global MFA settings configuration coming soon...</p>
          </div>
        )}
        {activeTab === 'backup' && (
          <div className="text-center py-12">
            <KeyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Backup Codes Configuration</h3>
            <p className="text-gray-500">Backup codes configuration coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
