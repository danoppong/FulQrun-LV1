// Administration Module - Configuration Editor
// Advanced configuration editor with validation and version control

'use client';

import React, { useState, useEffect } from 'react';
import { ;
  CogIcon, 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  DocumentIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Bars3Icon,
  CodeBracketIcon,
  DocumentDuplicateIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { ConfigurationService } from '@/lib/admin/services/ConfigurationService';
import { getSupabaseClient } from '@/lib/supabase-client';
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface ConfigurationItem {
  id: string;
  configKey: string;
  configValue: any;
  configType: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  moduleName: string;
  category: string;
  isRequired: boolean;
  defaultValue: any;
  validationRules?: string;
  isSensitive: boolean;
  lastModifiedBy: string;
  lastModifiedAt: Date;
  version: number;
}

interface ConfigurationHistory {
  id: string;
  configId: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  changedAt: Date;
  changeReason?: string;
  version: number;
}

interface ConfigurationFormData {
  configKey: string;
  configValue: any;
  description?: string;
  moduleName: string;
  category: string;
  isRequired: boolean;
  defaultValue: any;
  validationRules?: string;
  isSensitive: boolean;
}

interface ConfigurationFilters {
  moduleName?: string;
  category?: string;
  configType?: string;
  isRequired?: boolean;
  isSensitive?: boolean;
  search?: string;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ConfigurationFormSchema = z.object({
  configKey: z.string().min(1, 'Configuration key is required'),
  configValue: z.any(),
  description: z.string().optional(),
  moduleName: z.string().min(1, 'Module name is required'),
  category: z.string().min(1, 'Category is required'),
  isRequired: z.boolean(),
  defaultValue: z.any(),
  validationRules: z.string().optional(),
  isSensitive: z.boolean()
});

// =============================================================================
// CONFIGURATION VALUE EDITOR COMPONENT
// =============================================================================

function ConfigurationValueEditor({ 
  config, 
  value, 
  onChange 
}: {
  config: ConfigurationItem;
  value: any;
  onChange: (value: any) => void;
}) {
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleJsonChange = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      setJsonError(null);
      onChange(parsed);
    } catch (error) {
      setJsonError('Invalid JSON format');
    }
  };

  const renderEditor = () => {
    switch (config.configType) {
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => onChange(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              {value ? 'Enabled' : 'Disabled'}
            </label>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        );

      case 'string':
        return config.isSensitive ? (
          <input
            type="password"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="••••••••"
          />
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        );

      case 'object':
      case 'array':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {config.configType === 'object' ? 'JSON Object' : 'JSON Array'}
              </label>
              <button
                type="button"
                onClick={() => setIsJsonMode(!isJsonMode)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {isJsonMode ? 'Form Mode' : 'JSON Mode'}
              </button>
            </div>
            
            {isJsonMode ? (
              <div>
                <textarea
                  value={JSON.stringify(value, null, 2)}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  rows={8}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono ${
                    jsonError ? 'border-red-300' : ''
                  }`}
                />
                {jsonError && (
                  <p className="mt-1 text-sm text-red-600">{jsonError}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {config.configType === 'object' && typeof value === 'object' && value !== null ? (
                  Object.entries(value).map(([key, val]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={key}
                        disabled
                        className="flex-1 rounded-md border-gray-300 shadow-sm bg-gray-50 sm:text-sm"
                      />
                      <span className="text-gray-500">:</span>
                      <input
                        type="text"
                        value={String(val)}
                        onChange={(e) => {
                          const newValue = { ...value };
                          newValue[key] = e.target.value;
                          onChange(newValue);
                        }}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">
                    {config.configType === 'array' ? 'Array editing not implemented' : 'Object editing not implemented'}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {renderEditor()}
      {config.defaultValue !== undefined && (
        <div className="text-xs text-gray-500">
          Default: {JSON.stringify(config.defaultValue)}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CONFIGURATION TABLE COMPONENT
// =============================================================================

function ConfigurationTable({ 
  configurations, 
  onEdit, 
  onViewHistory,
  onResetToDefault 
}: {
  configurations: ConfigurationItem[];
  onEdit: (config: ConfigurationItem) => void;
  onViewHistory: (config: ConfigurationItem) => void;
  onResetToDefault: (config: ConfigurationItem) => void;
}) {
  const [sortField, setSortField] = useState<keyof ConfigurationItem>('configKey');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof ConfigurationItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedConfigurations = [...configurations].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string': return 'bg-blue-100 text-blue-800';
      case 'number': return 'bg-green-100 text-green-800';
      case 'boolean': return 'bg-yellow-100 text-yellow-800';
      case 'object': return 'bg-purple-100 text-purple-800';
      case 'array': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('configKey')}
            >
              <div className="flex items-center space-x-1">
                <span>Configuration Key</span>
                <Bars3Icon className="h-4 w-4" />
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('configType')}
            >
              <div className="flex items-center space-x-1">
                <span>Type</span>
                <Bars3Icon className="h-4 w-4" />
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('moduleName')}
            >
              <div className="flex items-center space-x-1">
                <span>Module</span>
                <Bars3Icon className="h-4 w-4" />
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('category')}
            >
              <div className="flex items-center space-x-1">
                <span>Category</span>
                <Bars3Icon className="h-4 w-4" />
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Current Value
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedConfigurations.map((config) => (
            <tr key={config.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {config.configKey}
                  </div>
                  {config.description && (
                    <div className="text-sm text-gray-500">
                      {config.description}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(config.configType)}`}>
                  {config.configType}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {config.moduleName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {config.category}
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 max-w-xs truncate">
                  {config.isSensitive ? '••••••••' : JSON.stringify(config.configValue)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  {config.isRequired && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Required
                    </span>
                  )}
                  {config.isSensitive && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Sensitive
                    </span>
                  )}
                  {config.configValue !== config.defaultValue && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Modified
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEdit(config)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit configuration"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onViewHistory(config)}
                    className="text-green-600 hover:text-green-900"
                    title="View history"
                  >
                    <ClockIcon className="h-4 w-4" />
                  </button>
                  {config.configValue !== config.defaultValue && (
                    <button
                      onClick={() => onResetToDefault(config)}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="Reset to default"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// CONFIGURATION FILTERS COMPONENT
// =============================================================================

function ConfigurationFilters({ 
  filters, 
  onFiltersChange 
}: {
  filters: ConfigurationFilters;
  onFiltersChange: (filters: ConfigurationFilters) => void;
}) {
  const modules = [
    { value: '', label: 'All Modules' },
    { value: 'admin', label: 'Administration' },
    { value: 'crm', label: 'CRM' },
    { value: 'sales_performance', label: 'Sales Performance' },
    { value: 'kpi', label: 'KPI' },
    { value: 'learning', label: 'Learning' },
    { value: 'integrations', label: 'Integrations' }
  ];

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'security', label: 'Security' },
    { value: 'performance', label: 'Performance' },
    { value: 'ui', label: 'User Interface' },
    { value: 'integration', label: 'Integration' }
  ];

  const types = [
    { value: '', label: 'All Types' },
    { value: 'string', label: 'String' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'object', label: 'Object' },
    { value: 'array', label: 'Array' }
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Search</label>
          <div className="mt-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              placeholder="Search configurations..."
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Module</label>
          <select
            value={filters.moduleName || ''}
            onChange={(e) => onFiltersChange({ ...filters, moduleName: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {modules.map(module => (
              <option key={module.value} value={module.value}>{module.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            value={filters.category || ''}
            onChange={(e) => onFiltersChange({ ...filters, category: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            value={filters.configType || ''}
            onChange={(e) => onFiltersChange({ ...filters, configType: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {types.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Required</label>
          <select
            value={filters.isRequired === undefined ? '' : filters.isRequired.toString()}
            onChange={(e) => {
              const value = e.target.value === '' ? undefined : e.target.value === 'true';
              onFiltersChange({ ...filters, isRequired: value });
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All</option>
            <option value="true">Required</option>
            <option value="false">Optional</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Sensitive</label>
          <select
            value={filters.isSensitive === undefined ? '' : filters.isSensitive.toString()}
            onChange={(e) => {
              const value = e.target.value === '' ? undefined : e.target.value === 'true';
              onFiltersChange({ ...filters, isSensitive: value });
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All</option>
            <option value="true">Sensitive</option>
            <option value="false">Not Sensitive</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CONFIGURATION EDITOR MODAL COMPONENT
// =============================================================================

function ConfigurationEditorModal({ 
  config, 
  onSave, 
  onCancel,
  isOpen 
}: {
  config?: ConfigurationItem;
  onSave: (configData: ConfigurationFormData) => void;
  onCancel: () => void;
  isOpen: boolean;
}) {
  const [formData, setFormData] = useState<ConfigurationFormData>({
    configKey: '',
    configValue: '',
    description: '',
    moduleName: '',
    category: '',
    isRequired: false,
    defaultValue: '',
    validationRules: '',
    isSensitive: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (config) {
      setFormData({
        configKey: config.configKey,
        configValue: config.configValue,
        description: config.description || '',
        moduleName: config.moduleName,
        category: config.category,
        isRequired: config.isRequired,
        defaultValue: config.defaultValue,
        validationRules: config.validationRules || '',
        isSensitive: config.isSensitive
      });
    } else {
      setFormData({
        configKey: '',
        configValue: '',
        description: '',
        moduleName: '',
        category: '',
        isRequired: false,
        defaultValue: '',
        validationRules: '',
        isSensitive: false
      });
    }
    setErrors({});
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = ConfigurationFormSchema.parse(formData);
      onSave(validatedData);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {config ? 'Edit Configuration' : 'Create Configuration'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Configuration Key</label>
                <input
                  type="text"
                  value={formData.configKey}
                  onChange={(e) => setFormData({ ...formData, configKey: e.target.value })}
                  disabled={!!config}
                  placeholder="module.setting.key"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.configKey ? 'border-red-300' : ''
                  } ${config ? 'bg-gray-50' : ''}`}
                />
                {errors.configKey && <p className="mt-1 text-sm text-red-600">{errors.configKey}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Module Name</label>
                <input
                  type="text"
                  value={formData.moduleName}
                  onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
                  placeholder="admin"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.moduleName ? 'border-red-300' : ''
                  }`}
                />
                {errors.moduleName && <p className="mt-1 text-sm text-red-600">{errors.moduleName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="general"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.category ? 'border-red-300' : ''
                  }`}
                />
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Default Value</label>
                <input
                  type="text"
                  value={formData.defaultValue}
                  onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                  placeholder="default value"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe what this configuration does..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Current Value</label>
              <ConfigurationValueEditor
                config={{
                  ...config!,
                  configType: typeof formData.configValue === 'boolean' ? 'boolean' :
                             typeof formData.configValue === 'number' ? 'number' :
                             Array.isArray(formData.configValue) ? 'array' :
                             typeof formData.configValue === 'object' ? 'object' : 'string',
                  isSensitive: formData.isSensitive,
                  defaultValue: formData.defaultValue
                }}
                value={formData.configValue}
                onChange={(value) => setFormData({ ...formData, configValue: value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Validation Rules</label>
              <textarea
                value={formData.validationRules}
                onChange={(e) => setFormData({ ...formData, validationRules: e.target.value })}
                rows={2}
                placeholder="JSON schema validation rules..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
              />
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isRequired}
                  onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Required Configuration</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isSensitive}
                  onChange={(e) => setFormData({ ...formData, isSensitive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Sensitive Data</label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <DocumentIcon className="h-4 w-4 mr-2 inline" />
                {config ? 'Update Configuration' : 'Create Configuration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN CONFIGURATION EDITOR COMPONENT
// =============================================================================

export default function ConfigurationEditor() {
  const [configurations, setConfigurations] = useState<ConfigurationItem[]>([]);
  const [filteredConfigurations, setFilteredConfigurations] = useState<ConfigurationItem[]>([]);
  const [filters, setFilters] = useState<ConfigurationFilters>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConfigurationItem | undefined>();
  const [showHistory, setShowHistory] = useState<ConfigurationItem | undefined>();

  useEffect(() => {
    loadConfigurations();
  }, []);

  useEffect(() => {
    filterConfigurations();
  }, [configurations, filters]);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      
      // Mock configuration data - in real implementation, this would fetch from API
      const mockConfigurations: ConfigurationItem[] = [
        {
          id: '1',
          configKey: 'admin.organization.name',
          configValue: 'Acme Corporation',
          configType: 'string',
          description: 'Organization name displayed throughout the system',
          moduleName: 'admin',
          category: 'general',
          isRequired: true,
          defaultValue: '',
          isSensitive: false,
          lastModifiedBy: 'admin@acme.com',
          lastModifiedAt: new Date('2024-10-01'),
          version: 1
        },
        {
          id: '2',
          configKey: 'admin.security.session_timeout',
          configValue: 30,
          configType: 'number',
          description: 'Session timeout in minutes',
          moduleName: 'admin',
          category: 'security',
          isRequired: true,
          defaultValue: 15,
          isSensitive: false,
          lastModifiedBy: 'admin@acme.com',
          lastModifiedAt: new Date('2024-09-28'),
          version: 2
        },
        {
          id: '3',
          configKey: 'admin.features.beta_enabled',
          configValue: true,
          configType: 'boolean',
          description: 'Enable beta features for testing',
          moduleName: 'admin',
          category: 'general',
          isRequired: false,
          defaultValue: false,
          isSensitive: false,
          lastModifiedBy: 'admin@acme.com',
          lastModifiedAt: new Date('2024-09-25'),
          version: 1
        },
        {
          id: '4',
          configKey: 'crm.lead_scoring.rules',
          configValue: {
            email_score: 10,
            phone_score: 15,
            company_size_score: 20
          },
          configType: 'object',
          description: 'Lead scoring rules configuration',
          moduleName: 'crm',
          category: 'performance',
          isRequired: true,
          defaultValue: {},
          isSensitive: false,
          lastModifiedBy: 'admin@acme.com',
          lastModifiedAt: new Date('2024-09-20'),
          version: 3
        },
        {
          id: '5',
          configKey: 'admin.integrations.api_key',
          configValue: 'sk-1234567890abcdef',
          configType: 'string',
          description: 'API key for external integrations',
          moduleName: 'admin',
          category: 'integration',
          isRequired: true,
          defaultValue: '',
          isSensitive: true,
          lastModifiedBy: 'admin@acme.com',
          lastModifiedAt: new Date('2024-09-15'),
          version: 1
        }
      ];
      
      setConfigurations(mockConfigurations);
    } catch (error) {
      console.error('Error loading configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterConfigurations = () => {
    let filtered = [...configurations];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(config => 
        config.configKey.toLowerCase().includes(searchLower) ||
        config.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.moduleName) {
      filtered = filtered.filter(config => config.moduleName === filters.moduleName);
    }

    if (filters.category) {
      filtered = filtered.filter(config => config.category === filters.category);
    }

    if (filters.configType) {
      filtered = filtered.filter(config => config.configType === filters.configType);
    }

    if (filters.isRequired !== undefined) {
      filtered = filtered.filter(config => config.isRequired === filters.isRequired);
    }

    if (filters.isSensitive !== undefined) {
      filtered = filtered.filter(config => config.isSensitive === filters.isSensitive);
    }

    setFilteredConfigurations(filtered);
  };

  const handleCreateConfig = () => {
    setEditingConfig(undefined);
    setShowForm(true);
  };

  const handleEditConfig = (config: ConfigurationItem) => {
    setEditingConfig(config);
    setShowForm(true);
  };

  const handleSaveConfig = async (configData: ConfigurationFormData) => {
    try {
      if (editingConfig) {
        // Update existing configuration
        const updatedConfigurations = configurations.map(config => 
          config.id === editingConfig.id 
            ? { 
                ...config, 
                ...configData, 
                lastModifiedBy: 'admin@acme.com',
                lastModifiedAt: new Date(),
                version: config.version + 1
              }
            : config
        );
        setConfigurations(updatedConfigurations);
      } else {
        // Create new configuration
        const newConfig: ConfigurationItem = {
          id: Date.now().toString(),
          ...configData,
          lastModifiedBy: 'admin@acme.com',
          lastModifiedAt: new Date(),
          version: 1
        };
        setConfigurations([...configurations, newConfig]);
      }
      
      setShowForm(false);
      setEditingConfig(undefined);
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };

  const handleViewHistory = (config: ConfigurationItem) => {
    setShowHistory(config);
  };

  const handleResetToDefault = async (config: ConfigurationItem) => {
    try {
      const updatedConfigurations = configurations.map(c => 
        c.id === config.id 
          ? { 
              ...c, 
              configValue: c.defaultValue,
              lastModifiedBy: 'admin@acme.com',
              lastModifiedAt: new Date(),
              version: c.version + 1
            }
          : c
      );
      setConfigurations(updatedConfigurations);
    } catch (error) {
      console.error('Error resetting configuration:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuration Editor</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage system configurations and settings
          </p>
        </div>
        <button
          onClick={handleCreateConfig}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Configuration
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CogIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Configurations</p>
              <p className="text-2xl font-semibold text-gray-900">{configurations.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Required</p>
              <p className="text-2xl font-semibold text-gray-900">
                {configurations.filter(c => c.isRequired).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <InformationCircleIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Sensitive</p>
              <p className="text-2xl font-semibold text-gray-900">
                {configurations.filter(c => c.isSensitive).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Modified</p>
              <p className="text-2xl font-semibold text-gray-900">
                {configurations.filter(c => c.configValue !== c.defaultValue).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <ConfigurationFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
      />

      {/* Configuration Table */}
      <ConfigurationTable
        configurations={filteredConfigurations}
        onEdit={handleEditConfig}
        onViewHistory={handleViewHistory}
        onResetToDefault={handleResetToDefault}
      />

      {/* Configuration Editor Modal */}
      <ConfigurationEditorModal
        config={editingConfig}
        onSave={handleSaveConfig}
        onCancel={() => {
          setShowForm(false);
          setEditingConfig(undefined);
        }}
        isOpen={showForm}
      />

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Configuration History: {showHistory.configKey}
                </h3>
                <button
                  onClick={() => setShowHistory(undefined)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Current Configuration</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Value:</span> {JSON.stringify(showHistory.configValue)}
                    </div>
                    <div>
                      <span className="font-medium">Last Modified:</span> {showHistory.lastModifiedAt.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Modified By:</span> {showHistory.lastModifiedBy}
                    </div>
                    <div>
                      <span className="font-medium">Version:</span> {showHistory.version}
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  <p>Configuration history would be displayed here in a real implementation.</p>
                  <p>This would include all previous values, who changed them, when, and why.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
