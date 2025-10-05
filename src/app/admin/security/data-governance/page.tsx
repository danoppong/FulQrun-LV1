// Administration Module - Data Governance Management
// Comprehensive data governance and compliance management

'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  DocumentTextIcon, 
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
  KeyIcon,
  UserGroupIcon,
  CircleStackIcon,
  CloudIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client';
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface DataGovernanceConfiguration {
  policies: DataPolicy[];
  classifications: DataClassification[];
  retentionRules: RetentionRule[];
  accessControls: AccessControl[];
  complianceFrameworks: ComplianceFramework[];
  dataInventory: DataAsset[];
}

interface DataPolicy {
  id: string;
  name: string;
  description?: string;
  category: 'privacy' | 'security' | 'retention' | 'access' | 'quality' | 'compliance';
  scope: PolicyScope;
  rules: PolicyRule[];
  enforcement: PolicyEnforcement;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PolicyScope {
  type: 'all' | 'table' | 'field' | 'user' | 'role';
  targets: string[];
}

interface PolicyRule {
  id: string;
  condition: string;
  action: 'allow' | 'deny' | 'encrypt' | 'mask' | 'audit' | 'notify';
  parameters?: Record<string, any>;
}

interface PolicyEnforcement {
  mode: 'enforce' | 'audit' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  notifications: string[];
}

interface DataClassification {
  id: string;
  name: string;
  level: 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';
  description?: string;
  color: string;
  handlingInstructions: string[];
  isActive: boolean;
}

interface RetentionRule {
  id: string;
  name: string;
  description?: string;
  dataTypes: string[];
  retentionPeriod: number; // in days
  action: 'delete' | 'archive' | 'anonymize' | 'review';
  conditions: RetentionCondition[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RetentionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

interface AccessControl {
  id: string;
  name: string;
  description?: string;
  resource: string;
  permissions: Permission[];
  users: string[];
  roles: string[];
  conditions: AccessCondition[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Permission {
  action: 'read' | 'write' | 'delete' | 'export' | 'share';
  granted: boolean;
  conditions?: string[];
}

interface AccessCondition {
  field: string;
  operator: string;
  value: any;
}

interface ComplianceFramework {
  id: string;
  name: string;
  type: 'gdpr' | 'ccpa' | 'hipaa' | 'sox' | 'pci_dss' | 'iso27001' | 'custom';
  description?: string;
  requirements: ComplianceRequirement[];
  controls: ComplianceControl[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_assessed';
}

interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  requirementId: string;
  implementation: string;
  status: 'implemented' | 'partial' | 'not_implemented';
  evidence: string[];
}

interface DataAsset {
  id: string;
  name: string;
  type: 'database' | 'table' | 'field' | 'file' | 'api';
  location: string;
  classification: string;
  owner: string;
  steward: string;
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  lastAccessed?: Date;
  lastModified?: Date;
  size?: number;
  recordCount?: number;
}

interface DataGovernanceEvent {
  id: string;
  userId: string;
  userName: string;
  eventType: 'access' | 'modification' | 'deletion' | 'export' | 'policy_violation' | 'compliance_check';
  resource: string;
  action: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details?: any;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const DataPolicySchema = z.object({
  name: z.string().min(1, 'Policy name is required'),
  description: z.string().optional(),
  category: z.enum(['privacy', 'security', 'retention', 'access', 'quality', 'compliance']),
  isActive: z.boolean()
});

const DataClassificationSchema = z.object({
  name: z.string().min(1, 'Classification name is required'),
  level: z.enum(['public', 'internal', 'confidential', 'restricted', 'top_secret']),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  isActive: z.boolean()
});

const RetentionRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  description: z.string().optional(),
  retentionPeriod: z.number().min(1, 'Retention period must be at least 1 day'),
  action: z.enum(['delete', 'archive', 'anonymize', 'review']),
  isActive: z.boolean()
});

// =============================================================================
// DATA POLICIES COMPONENT
// =============================================================================

function DataPolicies({ config, onUpdate }: { config: DataGovernanceConfiguration; onUpdate: (config: DataGovernanceConfiguration) => void }) {
  const [policies, setPolicies] = useState<DataPolicy[]>(config.policies);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<DataPolicy | undefined>();

  const categories = [
    { value: 'privacy', label: 'Privacy', color: 'bg-blue-100 text-blue-800' },
    { value: 'security', label: 'Security', color: 'bg-red-100 text-red-800' },
    { value: 'retention', label: 'Retention', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'access', label: 'Access', color: 'bg-green-100 text-green-800' },
    { value: 'quality', label: 'Quality', color: 'bg-purple-100 text-purple-800' },
    { value: 'compliance', label: 'Compliance', color: 'bg-indigo-100 text-indigo-800' }
  ];

  const enforcementModes = [
    { value: 'enforce', label: 'Enforce', color: 'bg-red-100 text-red-800' },
    { value: 'audit', label: 'Audit Only', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'warning', label: 'Warning', color: 'bg-blue-100 text-blue-800' }
  ];

  const handleSavePolicy = (policyData: Partial<DataPolicy>) => {
    try {
      const validatedData = DataPolicySchema.parse(policyData);
      
      if (editingPolicy) {
        const updatedPolicies = policies.map(p => 
          p.id === editingPolicy.id 
            ? { ...p, ...validatedData, id: editingPolicy.id, updatedAt: new Date() }
            : p
        );
        setPolicies(updatedPolicies);
      } else {
        const newPolicy: DataPolicy = {
          id: Date.now().toString(),
          ...validatedData,
          scope: { type: 'all', targets: [] },
          rules: [],
          enforcement: {
            mode: 'audit',
            severity: 'medium',
            notifications: []
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setPolicies([...policies, newPolicy]);
      }
      
      setShowForm(false);
      setEditingPolicy(undefined);
      
      onUpdate({
        ...config,
        policies,
        classifications: config.classifications,
        retentionRules: config.retentionRules,
        accessControls: config.accessControls,
        complianceFrameworks: config.complianceFrameworks,
        dataInventory: config.dataInventory
      });
    } catch (error) {
      console.error('Error saving data policy:', error);
    }
  };

  const handleDeletePolicy = (policyId: string) => {
    setPolicies(policies.filter(p => p.id !== policyId));
    onUpdate({
      ...config,
      policies: policies.filter(p => p.id !== policyId),
      classifications: config.classifications,
      retentionRules: config.retentionRules,
      accessControls: config.accessControls,
      complianceFrameworks: config.complianceFrameworks,
      dataInventory: config.dataInventory
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Data Policies</h3>
          <p className="text-sm text-gray-500">Define data governance policies and rules</p>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enforcement</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rules</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {policies.map((policy) => {
              const category = categories.find(c => c.value === policy.category);
              const enforcement = enforcementModes.find(e => e.value === policy.enforcement.mode);
              
              return (
                <tr key={policy.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{policy.name}</div>
                      {policy.description && (
                        <div className="text-sm text-gray-500">{policy.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category?.color}`}>
                      {category?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {policy.scope.type === 'all' ? 'All Data' : 
                     policy.scope.type === 'table' ? `Tables: ${policy.scope.targets.length}` :
                     policy.scope.type === 'field' ? `Fields: ${policy.scope.targets.length}` :
                     policy.scope.type === 'user' ? `Users: ${policy.scope.targets.length}` :
                     `Roles: ${policy.scope.targets.length}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${enforcement?.color}`}>
                      {enforcement?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {policy.rules.length} rules
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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Policy Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingPolicy ? 'Edit Data Policy' : 'Create Data Policy'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSavePolicy({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  category: formData.get('category') as any,
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

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    name="category"
                    defaultValue={editingPolicy?.category}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
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
// DATA CLASSIFICATIONS COMPONENT
// =============================================================================

function DataClassifications({ config, onUpdate }: { config: DataGovernanceConfiguration; onUpdate: (config: DataGovernanceConfiguration) => void }) {
  const [classifications, setClassifications] = useState<DataClassification[]>(config.classifications);
  const [showForm, setShowForm] = useState(false);
  const [editingClassification, setEditingClassification] = useState<DataClassification | undefined>();

  const levels = [
    { value: 'public', label: 'Public', color: '#10B981', description: 'Information that can be freely shared' },
    { value: 'internal', label: 'Internal', color: '#3B82F6', description: 'Information for internal use only' },
    { value: 'confidential', label: 'Confidential', color: '#F59E0B', description: 'Sensitive information requiring protection' },
    { value: 'restricted', label: 'Restricted', color: '#EF4444', description: 'Highly sensitive information with strict controls' },
    { value: 'top_secret', label: 'Top Secret', color: '#7C2D12', description: 'Highest level of sensitivity' }
  ];

  const handleSaveClassification = (classificationData: Partial<DataClassification>) => {
    try {
      const validatedData = DataClassificationSchema.parse(classificationData);
      
      if (editingClassification) {
        const updatedClassifications = classifications.map(c => 
          c.id === editingClassification.id 
            ? { ...c, ...validatedData, id: editingClassification.id }
            : c
        );
        setClassifications(updatedClassifications);
      } else {
        const newClassification: DataClassification = {
          id: Date.now().toString(),
          ...validatedData,
          handlingInstructions: [],
          isActive: true
        };
        setClassifications([...classifications, newClassification]);
      }
      
      setShowForm(false);
      setEditingClassification(undefined);
      
      onUpdate({
        ...config,
        policies: config.policies,
        classifications,
        retentionRules: config.retentionRules,
        accessControls: config.accessControls,
        complianceFrameworks: config.complianceFrameworks,
        dataInventory: config.dataInventory
      });
    } catch (error) {
      console.error('Error saving data classification:', error);
    }
  };

  const handleDeleteClassification = (classificationId: string) => {
    setClassifications(classifications.filter(c => c.id !== classificationId));
    onUpdate({
      ...config,
      policies: config.policies,
      classifications: classifications.filter(c => c.id !== classificationId),
      retentionRules: config.retentionRules,
      accessControls: config.accessControls,
      complianceFrameworks: config.complianceFrameworks,
      dataInventory: config.dataInventory
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Data Classifications</h3>
          <p className="text-sm text-gray-500">Define data sensitivity levels and handling instructions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Classification
        </button>
      </div>

      {/* Classifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classifications.map((classification) => {
          const level = levels.find(l => l.value === classification.level);
          
          return (
            <div key={classification.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: classification.color }}
                  ></div>
                  <h4 className="text-sm font-medium text-gray-900">{classification.name}</h4>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingClassification(classification);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClassification(classification.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Level</span>
                  <span 
                    className="text-xs font-medium px-2 py-1 rounded"
                    style={{ backgroundColor: classification.color, color: 'white' }}
                  >
                    {level?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Instructions</span>
                  <span className="text-xs text-gray-900">{classification.handlingInstructions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`text-xs ${classification.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {classification.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {classification.description && (
                  <div className="text-xs text-gray-500 mt-2">
                    {classification.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Classification Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingClassification ? 'Edit Data Classification' : 'Create Data Classification'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const selectedLevel = levels.find(l => l.value === formData.get('level'));
                handleSaveClassification({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  level: formData.get('level') as any,
                  color: selectedLevel?.color || '#3B82F6',
                  isActive: true
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Classification Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingClassification?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingClassification?.description}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Sensitivity Level</label>
                  <select
                    name="level"
                    defaultValue={editingClassification?.level}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {levels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingClassification(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingClassification ? 'Update Classification' : 'Create Classification'}
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
// MAIN DATA GOVERNANCE COMPONENT
// =============================================================================

export default function DataGovernanceManagement() {
  const [config, setConfig] = useState<DataGovernanceConfiguration>({
    policies: [],
    classifications: [],
    retentionRules: [],
    accessControls: [],
    complianceFrameworks: [],
    dataInventory: []
  });

  const [events, setEvents] = useState<DataGovernanceEvent[]>([]);
  const [activeTab, setActiveTab] = useState('policies');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock data policies
      const mockPolicies: DataPolicy[] = [
        {
          id: '1',
          name: 'Customer Data Privacy Policy',
          description: 'Policy for handling customer personal information',
          category: 'privacy',
          scope: { type: 'table', targets: ['customers', 'contacts', 'leads'] },
          rules: [
            { id: '1', condition: 'user_role != admin', action: 'mask', parameters: { field: 'email' } }
          ],
          enforcement: {
            mode: 'enforce',
            severity: 'high',
            notifications: ['admin@acme.com']
          },
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '2',
          name: 'Data Retention Policy',
          description: 'Automatic data retention and deletion rules',
          category: 'retention',
          scope: { type: 'all', targets: [] },
          rules: [
            { id: '2', condition: 'created_date < now() - 7 years', action: 'delete' }
          ],
          enforcement: {
            mode: 'audit',
            severity: 'medium',
            notifications: ['data-governance@acme.com']
          },
          isActive: true,
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-09-30')
        }
      ];

      // Mock data classifications
      const mockClassifications: DataClassification[] = [
        {
          id: '1',
          name: 'Public Information',
          level: 'public',
          description: 'Information that can be freely shared',
          color: '#10B981',
          handlingInstructions: ['Can be shared publicly', 'No restrictions'],
          isActive: true
        },
        {
          id: '2',
          name: 'Internal Use Only',
          level: 'internal',
          description: 'Information for internal company use only',
          color: '#3B82F6',
          handlingInstructions: ['Internal use only', 'Do not share externally'],
          isActive: true
        },
        {
          id: '3',
          name: 'Confidential Data',
          level: 'confidential',
          description: 'Sensitive information requiring protection',
          color: '#F59E0B',
          handlingInstructions: ['Requires authorization', 'Encrypt in transit', 'Limit access'],
          isActive: true
        },
        {
          id: '4',
          name: 'Restricted Information',
          level: 'restricted',
          description: 'Highly sensitive information with strict controls',
          color: '#EF4444',
          handlingInstructions: ['Strict access controls', 'Audit all access', 'Encrypt at rest'],
          isActive: true
        }
      ];

      // Mock governance events
      const mockEvents: DataGovernanceEvent[] = [
        {
          id: '1',
          userId: 'user-1',
          userName: 'john.doe@acme.com',
          eventType: 'access',
          resource: 'customers table',
          action: 'SELECT',
          success: true,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: new Date('2024-10-01T10:30:00Z')
        },
        {
          id: '2',
          userId: 'user-2',
          userName: 'jane.smith@acme.com',
          eventType: 'policy_violation',
          resource: 'contacts table',
          action: 'EXPORT',
          success: false,
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          timestamp: new Date('2024-10-01T09:15:00Z'),
          details: { policy: 'Customer Data Privacy Policy', violation: 'Unauthorized export' }
        }
      ];
      
      setConfig({
        ...config,
        policies: mockPolicies,
        classifications: mockClassifications
      });
      setEvents(mockEvents);
    } catch (error) {
      console.error('Error loading data governance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = (updatedConfig: DataGovernanceConfiguration) => {
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
    { id: 'policies', name: 'Data Policies', icon: DocumentTextIcon },
    { id: 'classifications', name: 'Data Classifications', icon: ShieldCheckIcon },
    { id: 'retention', name: 'Retention Rules', icon: ClockIcon },
    { id: 'access', name: 'Access Controls', icon: LockClosedIcon },
    { id: 'compliance', name: 'Compliance', icon: CheckCircleIcon },
    { id: 'inventory', name: 'Data Inventory', icon: CircleStackIcon },
    { id: 'events', name: 'Governance Events', icon: ExclamationTriangleIcon }
  ];

  const activePolicies = config.policies.filter(p => p.isActive).length;
  const totalPolicies = config.policies.length;
  const activeClassifications = config.classifications.filter(c => c.isActive).length;
  const policyViolations = events.filter(e => e.eventType === 'policy_violation').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Governance</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage data policies, classifications, retention rules, and compliance frameworks
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Policies</p>
              <p className="text-2xl font-semibold text-gray-900">{activePolicies}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Classifications</p>
              <p className="text-2xl font-semibold text-gray-900">{activeClassifications}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Retention Rules</p>
              <p className="text-2xl font-semibold text-gray-900">{config.retentionRules.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Policy Violations</p>
              <p className="text-2xl font-semibold text-gray-900">{policyViolations}</p>
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
        {activeTab === 'policies' && (
          <DataPolicies config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'classifications' && (
          <DataClassifications config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'retention' && (
          <div className="text-center py-12">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Retention Rules Configuration</h3>
            <p className="text-gray-500">Data retention rules configuration coming soon...</p>
          </div>
        )}
        {activeTab === 'access' && (
          <div className="text-center py-12">
            <LockClosedIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Controls Configuration</h3>
            <p className="text-gray-500">Access controls configuration coming soon...</p>
          </div>
        )}
        {activeTab === 'compliance' && (
          <div className="text-center py-12">
            <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Compliance Frameworks</h3>
            <p className="text-gray-500">Compliance frameworks configuration coming soon...</p>
          </div>
        )}
        {activeTab === 'inventory' && (
          <div className="text-center py-12">
            <CircleStackIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Data Inventory Management</h3>
            <p className="text-gray-500">Data inventory management coming soon...</p>
          </div>
        )}
        {activeTab === 'events' && (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Governance Events Monitoring</h3>
            <p className="text-gray-500">Governance events monitoring coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
