// Administration Module - Integration Hub Configuration
// Comprehensive integration hub configuration management

'use client';

import React, { useState, useEffect } from 'react';
import {
  CogIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  ClockIcon,
  CloudIcon,
  ServerIcon,
  KeyIcon,
  ArrowPathIcon,
  UserGroupIcon,
  EnvelopeIcon,
  CalendarIcon,
  PhoneIcon,
  ShareIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client'
import { z } from 'zod';

const _supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

// JSON-safe value used across mapping defaults and API responses
type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

interface IntegrationConfiguration {
  connections: IntegrationConnection[];
  syncRules: SyncRule[];
  mappings: DataMapping[];
  webhooks: WebhookConfiguration[];
  apis: APIConfiguration[];
  schedules: SyncSchedule[];
}

interface IntegrationConnection {
  id: string;
  name: string;
  type: 'crm' | 'email' | 'calendar' | 'phone' | 'social' | 'analytics' | 'erp' | 'custom';
  provider: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  credentials: ConnectionCredentials;
  settings: ConnectionSettings;
  lastSync?: Date;
  errorMessage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ConnectionCredentials {
  apiKey?: string;
  secretKey?: string;
  username?: string;
  password?: string;
  token?: string;
  refreshToken?: string;
  endpoint?: string;
  customFields?: Record<string, string>;
}

interface ConnectionSettings {
  syncFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'manual';
  syncDirection: 'import' | 'export' | 'bidirectional';
  batchSize: number;
  retryAttempts: number;
  timeout: number;
  filters?: Record<string, unknown>;
  customSettings?: Record<string, unknown>;
}

interface SyncRule {
  id: string;
  name: string;
  connectionId: string;
  sourceObject: string;
  targetObject: string;
  mapping: FieldMapping[];
  conditions: SyncCondition[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  defaultValue?: JSONValue;
  isRequired: boolean;
}

interface SyncCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: unknown;
}

interface DataMapping {
  id: string;
  name: string;
  sourceSystem: string;
  targetSystem: string;
  mappings: FieldMapping[];
  transformations: DataTransformation[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DataTransformation {
  field: string;
  type: 'format' | 'calculate' | 'lookup' | 'conditional';
  formula?: string;
  lookupTable?: string;
  conditions?: Record<string, JSONValue> | Array<Record<string, JSONValue>>;
}

interface WebhookConfiguration {
  id: string;
  name: string;
  url: string;
  events: string[];
  headers: Record<string, string>;
  authentication: WebhookAuth;
  isActive: boolean;
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface WebhookAuth {
  type: 'none' | 'basic' | 'bearer' | 'api_key';
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  apiKeyHeader?: string;
}

interface APIConfiguration {
  id: string;
  name: string;
  description?: string;
  baseUrl: string;
  authentication: APIAuth;
  endpoints: APIEndpoint[];
  rateLimits: RateLimit;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface APIAuth {
  type: 'none' | 'basic' | 'bearer' | 'api_key' | 'oauth2';
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  clientId?: string;
  clientSecret?: string;
  scope?: string;
}

interface APIEndpoint {
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description?: string;
  parameters?: APIParameter[];
  response?: JSONValue;
}

interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  defaultValue?: JSONValue;
}

interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
}

interface SyncSchedule {
  id: string;
  name: string;
  connectionId: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  cronExpression?: string;
  timezone: string;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const IntegrationConnectionSchema = z.object({
  name: z.string().min(1, 'Connection name is required'),
  type: z.enum(['crm', 'email', 'calendar', 'phone', 'social', 'analytics', 'erp', 'custom']),
  provider: z.string().min(1, 'Provider is required'),
  status: z.enum(['active', 'inactive', 'error', 'pending']),
  isActive: z.boolean()
});

const SyncRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  connectionId: z.string().min(1, 'Connection is required'),
  sourceObject: z.string().min(1, 'Source object is required'),
  targetObject: z.string().min(1, 'Target object is required'),
  isActive: z.boolean()
});

const DataMappingSchema = z.object({
  name: z.string().min(1, 'Mapping name is required'),
  sourceSystem: z.string().min(1, 'Source system is required'),
  targetSystem: z.string().min(1, 'Target system is required'),
  isActive: z.boolean()
});

const _WebhookConfigurationSchema = z.object({
  name: z.string().min(1, 'Webhook name is required'),
  url: z.string().url('Must be a valid URL'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  isActive: z.boolean()
});

// =============================================================================
// INTEGRATION CONNECTIONS COMPONENT
// =============================================================================

function IntegrationConnections({ config, onUpdate }: { config: IntegrationConfiguration; onUpdate: (config: IntegrationConfiguration) => void }) {
  const [connections, setConnections] = useState<IntegrationConnection[]>(config.connections);
  const [showForm, setShowForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState<IntegrationConnection | undefined>();

  const types = [
    { value: 'crm', label: 'CRM', icon: UserGroupIcon, color: 'bg-blue-100 text-blue-800' },
    { value: 'email', label: 'Email', icon: EnvelopeIcon, color: 'bg-green-100 text-green-800' },
    { value: 'calendar', label: 'Calendar', icon: CalendarIcon, color: 'bg-purple-100 text-purple-800' },
    { value: 'phone', label: 'Phone', icon: PhoneIcon, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'social', label: 'Social Media', icon: ShareIcon, color: 'bg-pink-100 text-pink-800' },
    { value: 'analytics', label: 'Analytics', icon: ChartBarIcon, color: 'bg-indigo-100 text-indigo-800' },
    { value: 'erp', label: 'ERP', icon: ServerIcon, color: 'bg-gray-100 text-gray-800' },
    { value: 'custom', label: 'Custom', icon: CogIcon, color: 'bg-orange-100 text-orange-800' }
  ];

  const providers = [
    'Salesforce', 'HubSpot', 'Pipedrive', 'Zoho CRM', 'Microsoft Dynamics',
    'Gmail', 'Outlook', 'Mailchimp', 'SendGrid', 'Constant Contact',
    'Google Calendar', 'Outlook Calendar', 'Apple Calendar',
    'Twilio', 'RingCentral', 'Vonage',
    'Facebook', 'LinkedIn', 'Twitter', 'Instagram',
    'Google Analytics', 'Adobe Analytics', 'Mixpanel',
    'SAP', 'Oracle', 'NetSuite', 'QuickBooks',
    'Monday.com', 'Asana', 'Jira', 'Trello'
  ];

  const statuses = [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
    { value: 'error', label: 'Error', color: 'bg-red-100 text-red-800' },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' }
  ];

  const handleSaveConnection = (connectionData: Partial<IntegrationConnection>) => {
    try {
      const validatedData = IntegrationConnectionSchema.parse(connectionData);
      
      if (editingConnection) {
        const updatedConnections = connections.map(c => 
          c.id === editingConnection.id 
            ? { ...c, ...validatedData, id: editingConnection.id, updatedAt: new Date() }
            : c
        );
        setConnections(updatedConnections);
      } else {
        const newConnection: IntegrationConnection = {
          id: Date.now().toString(),
          ...validatedData,
          credentials: {},
          settings: {
            syncFrequency: 'daily',
            syncDirection: 'bidirectional',
            batchSize: 100,
            retryAttempts: 3,
            timeout: 30
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setConnections([...connections, newConnection]);
      }
      
      setShowForm(false);
      setEditingConnection(undefined);
      
      onUpdate({
        ...config,
        connections,
        syncRules: config.syncRules,
        mappings: config.mappings,
        webhooks: config.webhooks,
        apis: config.apis,
        schedules: config.schedules
      });
    } catch (error) {
      console.error('Error saving connection:', error);
    }
  };

  const handleDeleteConnection = (connectionId: string) => {
    setConnections(connections.filter(c => c.id !== connectionId));
    onUpdate({
      ...config,
      connections: connections.filter(c => c.id !== connectionId),
      syncRules: config.syncRules,
      mappings: config.mappings,
      webhooks: config.webhooks,
      apis: config.apis,
      schedules: config.schedules
    });
  };

  const handleToggleConnection = (connectionId: string) => {
    const updatedConnections = connections.map(c => 
      c.id === connectionId ? { ...c, isActive: !c.isActive, updatedAt: new Date() } : c
    );
    setConnections(updatedConnections);
    onUpdate({
      ...config,
      connections: updatedConnections,
      syncRules: config.syncRules,
      mappings: config.mappings,
      webhooks: config.webhooks,
      apis: config.apis,
      schedules: config.schedules
    });
  };

  const handleTestConnection = (connectionId: string) => {
    // In real implementation, this would test the connection
    console.log('Testing connection:', connectionId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Integration Connections</h3>
          <p className="text-sm text-gray-500">Manage external system connections and credentials</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Connection
        </button>
      </div>

      {/* Connections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connections.map((connection) => {
          const type = types.find(t => t.value === connection.type);
          const status = statuses.find(s => s.value === connection.status);
          const TypeIcon = type?.icon || CogIcon;
          
          return (
            <div key={connection.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <TypeIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-900">{connection.name}</h4>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleTestConnection(connection.id)}
                    className="text-green-600 hover:text-green-900"
                    title="Test connection"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingConnection(connection);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleConnection(connection.id)}
                    className={connection.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                  >
                    {connection.isActive ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteConnection(connection.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Type</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${type?.color}`}>
                    {type?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Provider</span>
                  <span className="text-xs text-gray-900">{connection.provider}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status?.color}`}>
                    {status?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Sync Frequency</span>
                  <span className="text-xs text-gray-900">{connection.settings.syncFrequency}</span>
                </div>
                {connection.lastSync && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Last Sync</span>
                    <span className="text-xs text-gray-900">
                      {new Date(connection.lastSync).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {connection.errorMessage && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {connection.errorMessage}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connection Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingConnection ? 'Edit Integration Connection' : 'Create Integration Connection'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveConnection({
                  name: formData.get('name') as string,
                  type: formData.get('type') as unknown,
                  provider: formData.get('provider') as string,
                  status: 'pending',
                  isActive: true
                });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Connection Name</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingConnection?.name}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      name="type"
                      defaultValue={editingConnection?.type}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {types.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Provider</label>
                  <select
                    name="provider"
                    defaultValue={editingConnection?.provider}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {providers.map(provider => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-yellow-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Connection Settings</h4>
                  <p className="text-sm text-yellow-700">
                    After creating the connection, you&apos;ll be able to configure authentication credentials, 
                    sync settings, and field mappings.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingConnection(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingConnection ? 'Update Connection' : 'Create Connection'}
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
// SYNC RULES COMPONENT
// =============================================================================

function SyncRules({ config, onUpdate }: { config: IntegrationConfiguration; onUpdate: (config: IntegrationConfiguration) => void }) {
  const [syncRules, setSyncRules] = useState<SyncRule[]>(config.syncRules);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<SyncRule | undefined>();

  const handleSaveRule = (ruleData: Partial<SyncRule>) => {
    try {
      const validatedData = SyncRuleSchema.parse(ruleData);
      
      if (editingRule) {
        const updatedRules = syncRules.map(r => 
          r.id === editingRule.id 
            ? { ...r, ...validatedData, id: editingRule.id, updatedAt: new Date() }
            : r
        );
        setSyncRules(updatedRules);
      } else {
        const newRule: SyncRule = {
          id: Date.now().toString(),
          ...validatedData,
          mapping: [],
          conditions: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setSyncRules([...syncRules, newRule]);
      }
      
      setShowForm(false);
      setEditingRule(undefined);
      
      onUpdate({
        ...config,
        connections: config.connections,
        syncRules,
        mappings: config.mappings,
        webhooks: config.webhooks,
        apis: config.apis,
        schedules: config.schedules
      });
    } catch (error) {
      console.error('Error saving sync rule:', error);
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    setSyncRules(syncRules.filter(r => r.id !== ruleId));
    onUpdate({
      ...config,
      connections: config.connections,
      syncRules: syncRules.filter(r => r.id !== ruleId),
      mappings: config.mappings,
      webhooks: config.webhooks,
      apis: config.apis,
      schedules: config.schedules
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Sync Rules</h3>
          <p className="text-sm text-gray-500">Configure data synchronization rules between systems</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Sync Rule
        </button>
      </div>

      {/* Sync Rules Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connection</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Object</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Object</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mappings</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {syncRules.map((rule) => {
              const connection = config.connections.find(c => c.id === rule.connectionId);
              
              return (
                <tr key={rule.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {rule.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {connection?.name || 'Unknown Connection'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rule.sourceObject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rule.targetObject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rule.mapping.length} mappings
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      rule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rule Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRule ? 'Edit Sync Rule' : 'Create Sync Rule'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveRule({
                  name: formData.get('name') as string,
                  connectionId: formData.get('connectionId') as string,
                  sourceObject: formData.get('sourceObject') as string,
                  targetObject: formData.get('targetObject') as string,
                  isActive: true
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rule Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingRule?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Connection</label>
                  <select
                    name="connectionId"
                    defaultValue={editingRule?.connectionId}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {config.connections.map(connection => (
                      <option key={connection.id} value={connection.id}>{connection.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Source Object</label>
                    <input
                      type="text"
                      name="sourceObject"
                      defaultValue={editingRule?.sourceObject}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Target Object</label>
                    <input
                      type="text"
                      name="targetObject"
                      defaultValue={editingRule?.targetObject}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingRule(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingRule ? 'Update Rule' : 'Create Rule'}
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
// DATA MAPPINGS COMPONENT
// =============================================================================

function DataMappings({ config, onUpdate }: { config: IntegrationConfiguration; onUpdate: (config: IntegrationConfiguration) => void }) {
  const [mappings, setMappings] = useState<DataMapping[]>(config.mappings);
  const [showForm, setShowForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState<DataMapping | undefined>();
  const [showFieldMappingModal, setShowFieldMappingModal] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<DataMapping | null>(null);

  const handleSaveMapping = (mappingData: Partial<DataMapping>) => {
    try {
      const validatedData = DataMappingSchema.parse(mappingData);
      
      if (editingMapping) {
        const updatedMappings = mappings.map(m => 
          m.id === editingMapping.id 
            ? { ...m, ...validatedData, id: editingMapping.id, updatedAt: new Date() }
            : m
        );
        setMappings(updatedMappings);
      } else {
        const newMapping: DataMapping = {
          id: Date.now().toString(),
          ...validatedData,
          mappings: [],
          transformations: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setMappings([...mappings, newMapping]);
      }
      
      setShowForm(false);
      setEditingMapping(undefined);
      
      onUpdate({
        ...config,
        mappings: editingMapping 
          ? mappings.map(m => m.id === editingMapping.id ? { ...m, ...validatedData, updatedAt: new Date() } : m)
          : [...mappings, {
              id: Date.now().toString(),
              ...validatedData,
              mappings: [],
              transformations: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }]
      });
    } catch (error) {
      console.error('Error saving data mapping:', error);
    }
  };

  const handleDeleteMapping = (mappingId: string) => {
    setMappings(mappings.filter(m => m.id !== mappingId));
    onUpdate({
      ...config,
      mappings: mappings.filter(m => m.id !== mappingId)
    });
  };

  const handleToggleActive = (mappingId: string) => {
    const updatedMappings = mappings.map(m =>
      m.id === mappingId ? { ...m, isActive: !m.isActive, updatedAt: new Date() } : m
    );
    setMappings(updatedMappings);
    onUpdate({
      ...config,
      mappings: updatedMappings
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Data Mappings</h3>
          <p className="text-sm text-gray-500">Configure field mappings and data transformations between systems</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Data Mapping
        </button>
      </div>

      {mappings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Mappings</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first data mapping configuration</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Data Mapping
          </button>
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mapping Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source System</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target System</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fields</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transformations</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mappings.map((mapping) => (
                <tr key={mapping.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {mapping.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {mapping.sourceSystem}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {mapping.targetSystem}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {mapping.mappings.length} fields
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {mapping.transformations.length} transforms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(mapping.id)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                        mapping.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {mapping.isActive ? (
                        <>
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedMapping(mapping);
                          setShowFieldMappingModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-900"
                        title="Configure field mappings"
                      >
                        <CogIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingMapping(mapping);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit mapping"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMapping(mapping.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete mapping"
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
      )}

      {/* Mapping Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingMapping ? 'Edit Data Mapping' : 'Create Data Mapping'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveMapping({
                  name: formData.get('name') as string,
                  sourceSystem: formData.get('sourceSystem') as string,
                  targetSystem: formData.get('targetSystem') as string,
                  isActive: formData.get('isActive') === 'on'
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mapping Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingMapping?.name}
                    required
                    placeholder="e.g., Salesforce to FulQrun Opportunity Mapping"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Source System</label>
                    <input
                      type="text"
                      name="sourceSystem"
                      defaultValue={editingMapping?.sourceSystem}
                      required
                      placeholder="e.g., Salesforce"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Target System</label>
                    <input
                      type="text"
                      name="targetSystem"
                      defaultValue={editingMapping?.targetSystem}
                      required
                      placeholder="e.g., FulQrun CRM"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    defaultChecked={editingMapping?.isActive ?? true}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Activate mapping immediately
                  </label>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Field Mapping Configuration</h4>
                  <p className="text-sm text-blue-700">
                    After creating the mapping, you&apos;ll be able to configure individual field mappings, 
                    data transformations, and validation rules.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingMapping(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingMapping ? 'Update Mapping' : 'Create Mapping'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Field Mapping Configuration Modal */}
      {showFieldMappingModal && selectedMapping && (
        <FieldMappingConfiguration
          mapping={selectedMapping}
          onClose={() => {
            setShowFieldMappingModal(false);
            setSelectedMapping(null);
          }}
          onSave={(updatedMapping) => {
            const updatedMappings = mappings.map(m =>
              m.id === updatedMapping.id ? updatedMapping : m
            );
            setMappings(updatedMappings);
            onUpdate({ ...config, mappings: updatedMappings });
            setShowFieldMappingModal(false);
            setSelectedMapping(null);
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// FIELD MAPPING CONFIGURATION COMPONENT
// =============================================================================

function FieldMappingConfiguration({
  mapping,
  onClose,
  onSave
}: {
  mapping: DataMapping;
  onClose: () => void;
  onSave: (mapping: DataMapping) => void;
}) {
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>(mapping.mappings);
  const [transformations, _setTransformations] = useState<DataTransformation[]>(mapping.transformations);
  const [showAddField, setShowAddField] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);

  const handleAddFieldMapping = (fieldMapping: FieldMapping) => {
    if (editingFieldIndex !== null) {
      const updated = [...fieldMappings];
      updated[editingFieldIndex] = fieldMapping;
      setFieldMappings(updated);
      setEditingFieldIndex(null);
    } else {
      setFieldMappings([...fieldMappings, fieldMapping]);
    }
    setShowAddField(false);
  };

  const handleDeleteFieldMapping = (index: number) => {
    setFieldMappings(fieldMappings.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const updatedMapping: DataMapping = {
      ...mapping,
      mappings: fieldMappings,
      transformations,
      updatedAt: new Date()
    };
    onSave(updatedMapping);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-[90%] max-w-5xl shadow-lg rounded-md bg-white mb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Field Mapping Configuration</h3>
            <p className="text-sm text-gray-600 mt-1">
              {mapping.name} - {mapping.sourceSystem} → {mapping.targetSystem}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Field Mappings Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Field Mappings</h4>
              <button
                onClick={() => {
                  setShowAddField(true);
                  setEditingFieldIndex(null);
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Field Mapping
              </button>
            </div>

            {fieldMappings.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <DocumentTextIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No field mappings configured</p>
                <p className="text-sm text-gray-500">Add field mappings to define how data is transferred</p>
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Field</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Field</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transformation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fieldMappings.map((field, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{field.sourceField}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{field.targetField}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {field.transformation ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              {field.transformation}
                            </span>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {field.defaultValue !== undefined ? (
                            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{String(field.defaultValue)}</code>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {field.isRequired ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingFieldIndex(index);
                                setShowAddField(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit field"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFieldMapping(index)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete field"
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
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{fieldMappings.length}</div>
              <div className="text-sm text-blue-800">Total Field Mappings</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {fieldMappings.filter(f => f.transformation).length}
              </div>
              <div className="text-sm text-purple-800">With Transformations</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {fieldMappings.filter(f => f.isRequired).length}
              </div>
              <div className="text-sm text-green-800">Required Fields</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Save Configuration
          </button>
        </div>

        {/* Add/Edit Field Modal */}
        {showAddField && (
          <div className="absolute inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                {editingFieldIndex !== null ? 'Edit Field Mapping' : 'Add Field Mapping'}
              </h4>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const fieldMapping: FieldMapping = {
                    sourceField: formData.get('sourceField') as string,
                    targetField: formData.get('targetField') as string,
                    transformation: (formData.get('transformation') as string) || undefined,
                    defaultValue: (formData.get('defaultValue') as string) || undefined,
                    isRequired: formData.get('isRequired') === 'on'
                  };
                  handleAddFieldMapping(fieldMapping);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">Source Field</label>
                  <input
                    type="text"
                    name="sourceField"
                    defaultValue={editingFieldIndex !== null ? fieldMappings[editingFieldIndex].sourceField : ''}
                    required
                    placeholder="e.g., account_name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Field</label>
                  <input
                    type="text"
                    name="targetField"
                    defaultValue={editingFieldIndex !== null ? fieldMappings[editingFieldIndex].targetField : ''}
                    required
                    placeholder="e.g., company_name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Transformation (optional)</label>
                  <select
                    name="transformation"
                    defaultValue={editingFieldIndex !== null ? fieldMappings[editingFieldIndex].transformation : ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">None</option>
                    <option value="uppercase">Uppercase</option>
                    <option value="lowercase">Lowercase</option>
                    <option value="trim">Trim Whitespace</option>
                    <option value="date_format">Format Date</option>
                    <option value="currency_format">Format Currency</option>
                    <option value="phone_format">Format Phone</option>
                    <option value="email_normalize">Normalize Email</option>
                    <option value="custom">Custom Function</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Default Value (optional)</label>
                  <input
                    type="text"
                    name="defaultValue"
                    defaultValue={editingFieldIndex !== null ? String(fieldMappings[editingFieldIndex].defaultValue || '') : ''}
                    placeholder="e.g., N/A or 0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isRequired"
                    id="isRequired"
                    defaultChecked={editingFieldIndex !== null ? fieldMappings[editingFieldIndex].isRequired : false}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isRequired" className="ml-2 block text-sm text-gray-700">
                    Required field (must have value)
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddField(false);
                      setEditingFieldIndex(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingFieldIndex !== null ? 'Update Field' : 'Add Field'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN INTEGRATION CONFIGURATION COMPONENT
// =============================================================================

export default function IntegrationConfiguration() {
  const [config, setConfig] = useState<IntegrationConfiguration>({
    connections: [],
    syncRules: [],
    mappings: [],
    webhooks: [],
    apis: [],
    schedules: []
  });

  const [activeTab, setActiveTab] = useState('connections');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      
      // Mock configuration data
      const mockConfig: IntegrationConfiguration = {
        connections: [
          {
            id: '1',
            name: 'Salesforce CRM',
            type: 'crm',
            provider: 'Salesforce',
            status: 'active',
            credentials: {},
            settings: {
              syncFrequency: 'daily',
              syncDirection: 'bidirectional',
              batchSize: 100,
              retryAttempts: 3,
              timeout: 30
            },
            lastSync: new Date('2024-10-01'),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '2',
            name: 'Gmail Integration',
            type: 'email',
            provider: 'Gmail',
            status: 'active',
            credentials: {},
            settings: {
              syncFrequency: 'real_time',
              syncDirection: 'import',
              batchSize: 50,
              retryAttempts: 3,
              timeout: 30
            },
            lastSync: new Date('2024-10-01'),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '3',
            name: 'Monday.com Workspace',
            type: 'crm',
            provider: 'Monday.com',
            status: 'active',
            credentials: {},
            settings: {
              syncFrequency: 'hourly',
              syncDirection: 'bidirectional',
              batchSize: 100,
              retryAttempts: 3,
              timeout: 60
            },
            lastSync: new Date('2024-10-15'),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        syncRules: [
          {
            id: '1',
            name: 'Lead Sync',
            connectionId: '1',
            sourceObject: 'Lead',
            targetObject: 'Contact',
            mapping: [],
            conditions: [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        mappings: [],
        webhooks: [],
        apis: [],
        schedules: []
      };
      
      setConfig(mockConfig);
    } catch (error) {
      console.error('Error loading integration configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = (updatedConfig: IntegrationConfiguration) => {
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
    { id: 'connections', name: 'Connections', icon: CloudIcon },
    { id: 'syncRules', name: 'Sync Rules', icon: ArrowPathIcon },
    { id: 'mappings', name: 'Data Mappings', icon: DocumentTextIcon },
    { id: 'webhooks', name: 'Webhooks', icon: ServerIcon },
    { id: 'apis', name: 'API Configuration', icon: KeyIcon },
    { id: 'schedules', name: 'Schedules', icon: ClockIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integration Hub Configuration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure external system integrations, data synchronization, and API connections
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CloudIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Connections</p>
              <p className="text-2xl font-semibold text-gray-900">{config.connections.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ArrowPathIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Sync Rules</p>
              <p className="text-2xl font-semibold text-gray-900">{config.syncRules.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ServerIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Webhooks</p>
              <p className="text-2xl font-semibold text-gray-900">{config.webhooks.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <KeyIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">APIs</p>
              <p className="text-2xl font-semibold text-gray-900">{config.apis.length}</p>
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
        {activeTab === 'connections' && (
          <IntegrationConnections config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'syncRules' && (
          <SyncRules config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'mappings' && (
          <DataMappings config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'webhooks' && (
          <div className="text-center py-12">
            <ServerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Webhook Configuration</h3>
            <p className="text-gray-500">Webhook configuration coming soon...</p>
          </div>
        )}
        {activeTab === 'apis' && (
          <div className="text-center py-12">
            <KeyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">API Configuration</h3>
            <p className="text-gray-500">API configuration coming soon...</p>
          </div>
        )}
        {activeTab === 'schedules' && (
          <div className="text-center py-12">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Schedule Configuration</h3>
            <p className="text-gray-500">Schedule configuration coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
