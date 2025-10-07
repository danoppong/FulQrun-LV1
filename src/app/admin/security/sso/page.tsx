// Administration Module - SSO Configuration Interface
// Comprehensive Single Sign-On management

'use client';

import React, { useState, useEffect } from 'react';
import { ;
  ShieldCheckIcon, 
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
  LockClosedIcon,
  FingerPrintIcon,
  DevicePhoneMobileIcon,
  CloudIcon,
  ServerIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client';
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface SSOConfiguration {
  providers: SSOProvider[];
  settings: SSOSettings;
  mappings: AttributeMapping[];
  policies: SSOPolicy[];
}

interface SSOProvider {
  id: string;
  name: string;
  type: 'saml' | 'oauth2' | 'oidc' | 'ldap' | 'azure_ad' | 'google' | 'okta';
  enabled: boolean;
  configuration: ProviderConfiguration;
  metadata: ProviderMetadata;
  createdAt: Date;
  updatedAt: Date;
}

interface ProviderConfiguration {
  entityId?: string;
  ssoUrl?: string;
  sloUrl?: string;
  certificate?: string;
  clientId?: string;
  clientSecret?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  scope?: string[];
  customSettings?: Record<string, any>;
}

interface ProviderMetadata {
  displayName: string;
  description?: string;
  logo?: string;
  color?: string;
  documentationUrl?: string;
}

interface SSOSettings {
  enableSSO: boolean;
  allowLocalLogin: boolean;
  defaultProvider?: string;
  sessionTimeout: number;
  enableJustInTimeProvisioning: boolean;
  enableAttributeMapping: boolean;
  enableRoleMapping: boolean;
}

interface AttributeMapping {
  id: string;
  providerId: string;
  externalAttribute: string;
  internalAttribute: string;
  transformation?: string;
  isRequired: boolean;
}

interface SSOPolicy {
  id: string;
  name: string;
  description?: string;
  targetUsers: PolicyTarget;
  providers: string[];
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

interface SSOEvent {
  id: string;
  userId: string;
  userName: string;
  providerId: string;
  providerName: string;
  eventType: 'login' | 'logout' | 'provision' | 'error';
  success: boolean;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  errorMessage?: string;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const SSOProviderSchema = z.object({
  name: z.string().min(1, 'Provider name is required'),
  type: z.enum(['saml', 'oauth2', 'oidc', 'ldap', 'azure_ad', 'google', 'okta']),
  enabled: z.boolean()
});

const SSOSettingsSchema = z.object({
  enableSSO: z.boolean(),
  allowLocalLogin: z.boolean(),
  sessionTimeout: z.number().min(15, 'Session timeout must be at least 15 minutes'),
  enableJustInTimeProvisioning: z.boolean(),
  enableAttributeMapping: z.boolean(),
  enableRoleMapping: z.boolean()
});

// =============================================================================
// SSO PROVIDERS COMPONENT
// =============================================================================

function SSOProviders({ config, onUpdate }: { config: SSOConfiguration; onUpdate: (config: SSOConfiguration) => void }) {
  const [providers, setProviders] = useState<SSOProvider[]>(config.providers);
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<SSOProvider | undefined>();

  const providerTypes = [
    { 
      value: 'saml', 
      label: 'SAML 2.0', 
      icon: ShieldCheckIcon, 
      color: 'bg-blue-100 text-blue-800',
      description: 'Security Assertion Markup Language'
    },
    { 
      value: 'oauth2', 
      label: 'OAuth 2.0', 
      icon: KeyIcon, 
      color: 'bg-green-100 text-green-800',
      description: 'Open Authorization Protocol'
    },
    { 
      value: 'oidc', 
      label: 'OpenID Connect', 
      icon: FingerPrintIcon, 
      color: 'bg-purple-100 text-purple-800',
      description: 'Identity layer on top of OAuth 2.0'
    },
    { 
      value: 'azure_ad', 
      label: 'Azure Active Directory', 
      icon: CloudIcon, 
      color: 'bg-blue-100 text-blue-800',
      description: 'Microsoft Azure AD'
    },
    { 
      value: 'google', 
      label: 'Google Workspace', 
      icon: CloudIcon, 
      color: 'bg-red-100 text-red-800',
      description: 'Google Identity Platform'
    },
    { 
      value: 'okta', 
      label: 'Okta', 
      icon: ServerIcon, 
      color: 'bg-gray-100 text-gray-800',
      description: 'Okta Identity Cloud'
    }
  ];

  const handleSaveProvider = (providerData: Partial<SSOProvider>) => {
    try {
      const validatedData = SSOProviderSchema.parse(providerData);
      
      if (editingProvider) {
        const updatedProviders = providers.map(p => 
          p.id === editingProvider.id 
            ? { ...p, ...validatedData, id: editingProvider.id, updatedAt: new Date() }
            : p
        );
        setProviders(updatedProviders);
      } else {
        const newProvider: SSOProvider = {
          id: Date.now().toString(),
          ...validatedData,
          configuration: {},
          metadata: {
            displayName: validatedData.name || '',
            description: providerTypes.find(t => t.value === validatedData.type)?.description
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setProviders([...providers, newProvider]);
      }
      
      setShowForm(false);
      setEditingProvider(undefined);
      
      onUpdate({
        ...config,
        providers,
        settings: config.settings,
        mappings: config.mappings,
        policies: config.policies
      });
    } catch (error) {
      console.error('Error saving SSO provider:', error);
    }
  };

  const handleDeleteProvider = (providerId: string) => {
    setProviders(providers.filter(p => p.id !== providerId));
    onUpdate({
      ...config,
      providers: providers.filter(p => p.id !== providerId),
      settings: config.settings,
      mappings: config.mappings,
      policies: config.policies
    });
  };

  const handleToggleProvider = (providerId: string) => {
    const updatedProviders = providers.map(p => 
      p.id === providerId ? { ...p, enabled: !p.enabled, updatedAt: new Date() } : p
    );
    setProviders(updatedProviders);
    onUpdate({
      ...config,
      providers: updatedProviders,
      settings: config.settings,
      mappings: config.mappings,
      policies: config.policies
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">SSO Providers</h3>
          <p className="text-sm text-gray-500">Configure identity providers for single sign-on</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Provider
        </button>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider) => {
          const providerType = providerTypes.find(t => t.value === provider.type);
          const TypeIcon = providerType?.icon || ShieldCheckIcon;
          
          return (
            <div key={provider.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <TypeIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-900">{provider.name}</h4>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingProvider(provider);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleProvider(provider.id)}
                    className={provider.enabled ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                  >
                    {provider.enabled ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteProvider(provider.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Type</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${providerType?.color}`}>
                    {providerType?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`text-xs ${provider.enabled ? 'text-green-600' : 'text-red-600'}`}>
                    {provider.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Created</span>
                  <span className="text-xs text-gray-900">
                    {provider.createdAt.toLocaleDateString()}
                  </span>
                </div>
                {provider.metadata.description && (
                  <div className="text-xs text-gray-500 mt-2">
                    {provider.metadata.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Provider Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingProvider ? 'Edit SSO Provider' : 'Add SSO Provider'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveProvider({
                  name: formData.get('name') as string,
                  type: formData.get('type') as any,
                  enabled: true
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Provider Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingProvider?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Provider Type</label>
                  <select
                    name="type"
                    defaultValue={editingProvider?.type}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {providerTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-yellow-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Configuration Required</h4>
                  <p className="text-sm text-yellow-700">
                    After creating the provider, you'll need to configure authentication endpoints, 
                    certificates, and other provider-specific settings.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingProvider(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingProvider ? 'Update Provider' : 'Add Provider'}
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
// SSO SETTINGS COMPONENT
// =============================================================================

function SSOSettings({ config, onUpdate }: { config: SSOConfiguration; onUpdate: (config: SSOConfiguration) => void }) {
  const [settings, setSettings] = useState<SSOSettings>(config.settings);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    try {
      const validatedData = SSOSettingsSchema.parse(settings);
      
      const updatedConfig = {
        ...config,
        settings: validatedData
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
    setSettings(config.settings);
    setIsEditing(false);
    setErrors({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">SSO Settings</h3>
          <p className="text-sm text-gray-500">Configure global SSO behavior and policies</p>
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

      {/* SSO Status */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">SSO Status</h4>
            <p className="text-sm text-gray-500">Current SSO configuration status</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${settings.enableSSO ? 'text-green-600' : 'text-red-600'}`}>
              {settings.enableSSO ? 'Enabled' : 'Disabled'}
            </div>
            <div className="text-sm text-gray-500">
              {settings.enableSSO ? 'SSO is active' : 'SSO is inactive'}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
          <input
            type="number"
            value={settings.sessionTimeout}
            onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
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
          <label className="block text-sm font-medium text-gray-700">Default Provider</label>
          <select
            value={settings.defaultProvider || ''}
            onChange={(e) => setSettings({ ...settings, defaultProvider: e.target.value || undefined })}
            disabled={!isEditing}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            }`}
          >
            <option value="">None (User Choice)</option>
            {config.providers.map(provider => (
              <option key={provider.id} value={provider.id}>{provider.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">SSO Options</h4>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.enableSSO}
              onChange={(e) => setSettings({ ...settings, enableSSO: e.target.checked })}
              disabled={!isEditing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Enable SSO</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.allowLocalLogin}
              onChange={(e) => setSettings({ ...settings, allowLocalLogin: e.target.checked })}
              disabled={!isEditing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Allow local login (username/password)</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.enableJustInTimeProvisioning}
              onChange={(e) => setSettings({ ...settings, enableJustInTimeProvisioning: e.target.checked })}
              disabled={!isEditing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Enable Just-In-Time user provisioning</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.enableAttributeMapping}
              onChange={(e) => setSettings({ ...settings, enableAttributeMapping: e.target.checked })}
              disabled={!isEditing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Enable attribute mapping</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.enableRoleMapping}
              onChange={(e) => setSettings({ ...settings, enableRoleMapping: e.target.checked })}
              disabled={!isEditing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Enable role mapping</label>
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
// MAIN SSO CONFIGURATION COMPONENT
// =============================================================================

export default function SSOConfiguration() {
  const [config, setConfig] = useState<SSOConfiguration>({
    providers: [],
    settings: {
      enableSSO: false,
      allowLocalLogin: true,
      sessionTimeout: 480,
      enableJustInTimeProvisioning: true,
      enableAttributeMapping: true,
      enableRoleMapping: true
    },
    mappings: [],
    policies: []
  });

  const [events, setEvents] = useState<SSOEvent[]>([]);
  const [activeTab, setActiveTab] = useState('providers');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock SSO providers data
      const mockProviders: SSOProvider[] = [
        {
          id: '1',
          name: 'Azure Active Directory',
          type: 'azure_ad',
          enabled: true,
          configuration: {
            clientId: 'azure-client-id',
            clientSecret: '***',
            authorizationUrl: 'https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize',
            tokenUrl: 'https://login.microsoftonline.com/tenant/oauth2/v2.0/token',
            scope: ['openid', 'profile', 'email']
          },
          metadata: {
            displayName: 'Azure Active Directory',
            description: 'Microsoft Azure Active Directory SSO',
            color: '#0078d4'
          },
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '2',
          name: 'Google Workspace',
          type: 'google',
          enabled: true,
          configuration: {
            clientId: 'google-client-id',
            clientSecret: '***',
            authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            scope: ['openid', 'profile', 'email']
          },
          metadata: {
            displayName: 'Google Workspace',
            description: 'Google Identity Platform SSO',
            color: '#4285f4'
          },
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '3',
          name: 'Okta',
          type: 'okta',
          enabled: false,
          configuration: {
            entityId: 'okta-entity-id',
            ssoUrl: 'https://company.okta.com/app/fulqrun/sso/saml',
            certificate: '***'
          },
          metadata: {
            displayName: 'Okta',
            description: 'Okta Identity Cloud SSO',
            color: '#007dc1'
          },
          createdAt: new Date('2024-03-01'),
          updatedAt: new Date('2024-09-30')
        }
      ];

      // Mock SSO events data
      const mockEvents: SSOEvent[] = [
        {
          id: '1',
          userId: 'user-1',
          userName: 'john.doe@acme.com',
          providerId: '1',
          providerName: 'Azure Active Directory',
          eventType: 'login',
          success: true,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: new Date('2024-10-01T10:30:00Z')
        },
        {
          id: '2',
          userId: 'user-2',
          userName: 'jane.smith@acme.com',
          providerId: '2',
          providerName: 'Google Workspace',
          eventType: 'login',
          success: true,
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          timestamp: new Date('2024-10-01T09:15:00Z')
        },
        {
          id: '3',
          userId: 'user-3',
          userName: 'bob.wilson@acme.com',
          providerId: '1',
          providerName: 'Azure Active Directory',
          eventType: 'error',
          success: false,
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
          timestamp: new Date('2024-09-30T16:45:00Z'),
          errorMessage: 'Invalid certificate'
        }
      ];
      
      setConfig({
        ...config,
        providers: mockProviders
      });
      setEvents(mockEvents);
    } catch (error) {
      console.error('Error loading SSO data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = (updatedConfig: SSOConfiguration) => {
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
    { id: 'providers', name: 'SSO Providers', icon: ShieldCheckIcon },
    { id: 'settings', name: 'SSO Settings', icon: CogIcon },
    { id: 'mappings', name: 'Attribute Mappings', icon: KeyIcon },
    { id: 'policies', name: 'SSO Policies', icon: LockClosedIcon },
    { id: 'events', name: 'SSO Events', icon: ClockIcon }
  ];

  const activeProviders = config.providers.filter(p => p.enabled).length;
  const totalProviders = config.providers.length;
  const successfulLogins = events.filter(e => e.success).length;
  const failedLogins = events.filter(e => !e.success).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Single Sign-On Configuration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure identity providers, SSO settings, and monitor authentication events
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Providers</p>
              <p className="text-2xl font-semibold text-gray-900">{activeProviders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ServerIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Providers</p>
              <p className="text-2xl font-semibold text-gray-900">{totalProviders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Successful Logins</p>
              <p className="text-2xl font-semibold text-gray-900">{successfulLogins}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Failed Logins</p>
              <p className="text-2xl font-semibold text-gray-900">{failedLogins}</p>
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
        {activeTab === 'providers' && (
          <SSOProviders config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'settings' && (
          <SSOSettings config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'mappings' && (
          <div className="text-center py-12">
            <KeyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Attribute Mappings Configuration</h3>
            <p className="text-gray-500">Attribute mapping configuration coming soon...</p>
          </div>
        )}
        {activeTab === 'policies' && (
          <div className="text-center py-12">
            <LockClosedIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">SSO Policies Configuration</h3>
            <p className="text-gray-500">SSO policies configuration coming soon...</p>
          </div>
        )}
        {activeTab === 'events' && (
          <div className="text-center py-12">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">SSO Events Monitoring</h3>
            <p className="text-gray-500">SSO events monitoring coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
