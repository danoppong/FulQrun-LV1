// Administration Module - Custom Fields Management
// Comprehensive custom fields and form customization

'use client';

import React, { useState, useEffect } from 'react';
import {
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
  CloudIcon,
  CircleStackIcon,
  CogIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ServerIcon,
  ShieldCheckIcon,
  BellIcon,
  UserIcon,
  TagIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client'
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface CustomFieldsConfiguration {
  fields: CustomField[];
  fieldGroups: FieldGroup[];
  fieldSets: FieldSet[];
  validations: FieldValidation[];
  dependencies: FieldDependency[];
}

interface CustomField {
  id: string;
  name: string;
  label: string;
  description?: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'datetime' | 'boolean' | 'select' | 'multiselect' | 'textarea' | 'file' | 'url' | 'currency' | 'percentage';
  entityType: 'lead' | 'contact' | 'company' | 'opportunity' | 'activity' | 'user' | 'organization';
  isRequired: boolean;
  isUnique: boolean;
  isSearchable: boolean;
  isVisible: boolean;
  defaultValue?: any;
  options?: FieldOption[];
  validation: FieldValidationRule[];
  displayOrder: number;
  fieldGroupId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FieldGroup {
  id: string;
  name: string;
  description?: string;
  entityType: string;
  displayOrder: number;
  isCollapsible: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FieldSet {
  id: string;
  name: string;
  description?: string;
  entityType: string;
  fields: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FieldOption {
  value: string;
  label: string;
  description?: string;
  isDefault?: boolean;
  color?: string;
}

interface FieldValidationRule {
  type: 'required' | 'min_length' | 'max_length' | 'min_value' | 'max_value' | 'pattern' | 'custom';
  value?: any;
  message: string;
  isActive: boolean;
}

interface FieldValidation {
  id: string;
  fieldId: string;
  rules: FieldValidationRule[];
  isActive: boolean;
}

interface FieldDependency {
  id: string;
  sourceFieldId: string;
  targetFieldId: string;
  condition: DependencyCondition;
  action: DependencyAction;
  isActive: boolean;
}

interface DependencyCondition {
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value?: any;
}

interface DependencyAction {
  type: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'optional' | 'set_value' | 'clear_value';
  value?: any;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CustomFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  label: z.string().min(1, 'Field label is required'),
  description: z.string().optional(),
  type: z.enum(['text', 'number', 'email', 'phone', 'date', 'datetime', 'boolean', 'select', 'multiselect', 'textarea', 'file', 'url', 'currency', 'percentage']),
  entityType: z.enum(['lead', 'contact', 'company', 'opportunity', 'activity', 'user', 'organization']),
  isRequired: z.boolean(),
  isUnique: z.boolean(),
  isSearchable: z.boolean(),
  isVisible: z.boolean(),
  isActive: z.boolean()
});

const FieldGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  entityType: z.string().min(1, 'Entity type is required'),
  isCollapsible: z.boolean(),
  isActive: z.boolean()
});

// =============================================================================
// CUSTOM FIELDS COMPONENT
// =============================================================================

function CustomFields({ config, onUpdate }: { config: CustomFieldsConfiguration; onUpdate: (config: CustomFieldsConfiguration) => void }) {
  const [fields, setFields] = useState<CustomField[]>(config.fields);
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | undefined>();

  const fieldTypes = [
    { value: 'text', label: 'Text', icon: DocumentTextIcon, description: 'Single line text input' },
    { value: 'number', label: 'Number', icon: AdjustmentsHorizontalIcon, description: 'Numeric input' },
    { value: 'email', label: 'Email', icon: UserIcon, description: 'Email address input' },
    { value: 'phone', label: 'Phone', icon: UserIcon, description: 'Phone number input' },
    { value: 'date', label: 'Date', icon: ClockIcon, description: 'Date picker' },
    { value: 'datetime', label: 'Date & Time', icon: ClockIcon, description: 'Date and time picker' },
    { value: 'boolean', label: 'Boolean', icon: CheckCircleIcon, description: 'True/false checkbox' },
    { value: 'select', label: 'Select', icon: Squares2X2Icon, description: 'Single selection dropdown' },
    { value: 'multiselect', label: 'Multi-Select', icon: Squares2X2Icon, description: 'Multiple selection dropdown' },
    { value: 'textarea', label: 'Text Area', icon: DocumentTextIcon, description: 'Multi-line text input' },
    { value: 'file', label: 'File', icon: DocumentTextIcon, description: 'File upload' },
    { value: 'url', label: 'URL', icon: CloudIcon, description: 'URL input' },
    { value: 'currency', label: 'Currency', icon: AdjustmentsHorizontalIcon, description: 'Currency input' },
    { value: 'percentage', label: 'Percentage', icon: AdjustmentsHorizontalIcon, description: 'Percentage input' }
  ];

  const entityTypes = [
    { value: 'lead', label: 'Lead', color: 'bg-blue-100 text-blue-800' },
    { value: 'contact', label: 'Contact', color: 'bg-green-100 text-green-800' },
    { value: 'company', label: 'Company', color: 'bg-purple-100 text-purple-800' },
    { value: 'opportunity', label: 'Opportunity', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'activity', label: 'Activity', color: 'bg-red-100 text-red-800' },
    { value: 'user', label: 'User', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'organization', label: 'Organization', color: 'bg-gray-100 text-gray-800' }
  ];

  const handleSaveField = (fieldData: Partial<CustomField>) => {
    try {
      const validatedData = CustomFieldSchema.parse(fieldData);
      
      if (editingField) {
        const updatedFields = fields.map(f => 
          f.id === editingField.id 
            ? { ...f, ...validatedData, id: editingField.id, updatedAt: new Date() }
            : f
        );
        setFields(updatedFields);
      } else {
        const newField: CustomField = {
          id: Date.now().toString(),
          ...validatedData,
          validation: [],
          displayOrder: fields.length + 1,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setFields([...fields, newField]);
      }
      
      setShowForm(false);
      setEditingField(undefined);
      
      onUpdate({
        ...config,
        fields,
        fieldGroups: config.fieldGroups,
        fieldSets: config.fieldSets,
        validations: config.validations,
        dependencies: config.dependencies
      });
    } catch (error) {
      console.error('Error saving custom field:', error);
    }
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
    onUpdate({
      ...config,
      fields: fields.filter(f => f.id !== fieldId),
      fieldGroups: config.fieldGroups,
      fieldSets: config.fieldSets,
      validations: config.validations,
      dependencies: config.dependencies
    });
  };

  const handleToggleField = (fieldId: string) => {
    const updatedFields = fields.map(f => 
      f.id === fieldId ? { ...f, isActive: !f.isActive, updatedAt: new Date() } : f
    );
    setFields(updatedFields);
    onUpdate({
      ...config,
      fields: updatedFields,
      fieldGroups: config.fieldGroups,
      fieldSets: config.fieldSets,
      validations: config.validations,
      dependencies: config.dependencies
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Custom Fields</h3>
          <p className="text-sm text-gray-500">Create and manage custom fields for different entities</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Field
        </button>
      </div>

      {/* Fields Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Properties</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fields.map((field) => {
              const fieldType = fieldTypes.find(t => t.value === field.type);
              const entityType = entityTypes.find(e => e.value === field.entityType);
              const TypeIcon = fieldType?.icon || DocumentTextIcon;
              
              return (
                <tr key={field.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TypeIcon className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{field.label}</div>
                        <div className="text-sm text-gray-500">{field.name}</div>
                        {field.description && (
                          <div className="text-xs text-gray-400">{field.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {fieldType?.label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${entityType?.color}`}>
                      {entityType?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {field.isRequired && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Required
                        </span>
                      )}
                      {field.isUnique && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Unique
                        </span>
                      )}
                      {field.isSearchable && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Searchable
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {field.displayOrder}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      field.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {field.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleField(field.id)}
                        className={field.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                        title={field.isActive ? "Deactivate field" : "Activate field"}
                      >
                        {field.isActive ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingField(field);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteField(field.id)}
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

      {/* Field Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingField ? 'Edit Custom Field' : 'Create Custom Field'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveField({
                  name: formData.get('name') as string,
                  label: formData.get('label') as string,
                  description: formData.get('description') as string,
                  type: formData.get('type') as any,
                  entityType: formData.get('entityType') as any,
                  isRequired: formData.get('isRequired') === 'on',
                  isUnique: formData.get('isUnique') === 'on',
                  isSearchable: formData.get('isSearchable') === 'on',
                  isVisible: formData.get('isVisible') === 'on',
                  isActive: true
                });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Field Name</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingField?.name}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Field Label</label>
                    <input
                      type="text"
                      name="label"
                      defaultValue={editingField?.label}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingField?.description}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Field Type</label>
                    <select
                      name="type"
                      defaultValue={editingField?.type}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {fieldTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Entity Type</label>
                    <select
                      name="entityType"
                      defaultValue={editingField?.entityType}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {entityTypes.map(entity => (
                        <option key={entity.value} value={entity.value}>{entity.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isRequired"
                      defaultChecked={editingField?.isRequired}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Required field</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isUnique"
                      defaultChecked={editingField?.isUnique}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Unique value</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isSearchable"
                      defaultChecked={editingField?.isSearchable}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Searchable</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isVisible"
                      defaultChecked={editingField?.isVisible}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Visible in forms</label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingField(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingField ? 'Update Field' : 'Create Field'}
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
// FIELD GROUPS COMPONENT
// =============================================================================

function FieldGroups({ config, onUpdate }: { config: CustomFieldsConfiguration; onUpdate: (config: CustomFieldsConfiguration) => void }) {
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>(config.fieldGroups);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FieldGroup | undefined>();

  const entityTypes = [
    { value: 'lead', label: 'Lead', color: 'bg-blue-100 text-blue-800' },
    { value: 'contact', label: 'Contact', color: 'bg-green-100 text-green-800' },
    { value: 'company', label: 'Company', color: 'bg-purple-100 text-purple-800' },
    { value: 'opportunity', label: 'Opportunity', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'activity', label: 'Activity', color: 'bg-red-100 text-red-800' },
    { value: 'user', label: 'User', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'organization', label: 'Organization', color: 'bg-gray-100 text-gray-800' }
  ];

  const handleSaveGroup = (groupData: Partial<FieldGroup>) => {
    try {
      const validatedData = FieldGroupSchema.parse(groupData);
      
      if (editingGroup) {
        const updatedGroups = fieldGroups.map(g => 
          g.id === editingGroup.id 
            ? { ...g, ...validatedData, id: editingGroup.id, updatedAt: new Date() }
            : g
        );
        setFieldGroups(updatedGroups);
      } else {
        const newGroup: FieldGroup = {
          id: Date.now().toString(),
          ...validatedData,
          displayOrder: fieldGroups.length + 1,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setFieldGroups([...fieldGroups, newGroup]);
      }
      
      setShowForm(false);
      setEditingGroup(undefined);
      
      onUpdate({
        ...config,
        fields: config.fields,
        fieldGroups,
        fieldSets: config.fieldSets,
        validations: config.validations,
        dependencies: config.dependencies
      });
    } catch (error) {
      console.error('Error saving field group:', error);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    setFieldGroups(fieldGroups.filter(g => g.id !== groupId));
    onUpdate({
      ...config,
      fields: config.fields,
      fieldGroups: fieldGroups.filter(g => g.id !== groupId),
      fieldSets: config.fieldSets,
      validations: config.validations,
      dependencies: config.dependencies
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Field Groups</h3>
          <p className="text-sm text-gray-500">Organize fields into logical groups</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Group
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fieldGroups.map((group) => {
          const entityType = entityTypes.find(e => e.value === group.entityType);
          const groupFields = config.fields.filter(f => f.fieldGroupId === group.id);
          
          return (
            <div key={group.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{group.name}</h4>
                  {group.description && (
                    <p className="text-xs text-gray-500 mt-1">{group.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingGroup(group);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Entity Type</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${entityType?.color}`}>
                    {entityType?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Fields</span>
                  <span className="text-xs text-gray-900">{groupFields.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Collapsible</span>
                  <span className={`text-xs ${group.isCollapsible ? 'text-green-600' : 'text-gray-600'}`}>
                    {group.isCollapsible ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`text-xs ${group.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {group.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Group Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingGroup ? 'Edit Field Group' : 'Create Field Group'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveGroup({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  entityType: formData.get('entityType') as string,
                  isCollapsible: formData.get('isCollapsible') === 'on',
                  isActive: true
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Group Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingGroup?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingGroup?.description}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Entity Type</label>
                  <select
                    name="entityType"
                    defaultValue={editingGroup?.entityType}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {entityTypes.map(entity => (
                      <option key={entity.value} value={entity.value}>{entity.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isCollapsible"
                    defaultChecked={editingGroup?.isCollapsible}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Collapsible group</label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingGroup(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingGroup ? 'Update Group' : 'Create Group'}
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
// MAIN CUSTOM FIELDS COMPONENT
// =============================================================================

export default function CustomFieldsManagement() {
  const [config, setConfig] = useState<CustomFieldsConfiguration>({
    fields: [],
    fieldGroups: [],
    fieldSets: [],
    validations: [],
    dependencies: []
  });

  const [activeTab, setActiveTab] = useState('fields');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock custom fields data
      const mockFields: CustomField[] = [
        {
          id: '1',
          name: 'industry',
          label: 'Industry',
          description: 'Primary industry of the company',
          type: 'select',
          entityType: 'company',
          isRequired: false,
          isUnique: false,
          isSearchable: true,
          isVisible: true,
          options: [
            { value: 'technology', label: 'Technology', isDefault: false },
            { value: 'healthcare', label: 'Healthcare', isDefault: false },
            { value: 'finance', label: 'Finance', isDefault: false },
            { value: 'manufacturing', label: 'Manufacturing', isDefault: false }
          ],
          validation: [],
          displayOrder: 1,
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '2',
          name: 'annual_revenue',
          label: 'Annual Revenue',
          description: 'Company annual revenue',
          type: 'currency',
          entityType: 'company',
          isRequired: false,
          isUnique: false,
          isSearchable: true,
          isVisible: true,
          validation: [],
          displayOrder: 2,
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '3',
          name: 'lead_source',
          label: 'Lead Source',
          description: 'How the lead was acquired',
          type: 'select',
          entityType: 'lead',
          isRequired: true,
          isUnique: false,
          isSearchable: true,
          isVisible: true,
          options: [
            { value: 'website', label: 'Website', isDefault: false },
            { value: 'referral', label: 'Referral', isDefault: false },
            { value: 'cold_call', label: 'Cold Call', isDefault: false },
            { value: 'email', label: 'Email Campaign', isDefault: false }
          ],
          validation: [],
          displayOrder: 1,
          isActive: true,
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-09-30')
        }
      ];

      // Mock field groups data
      const mockFieldGroups: FieldGroup[] = [
        {
          id: '1',
          name: 'Company Information',
          description: 'Basic company details and information',
          entityType: 'company',
          displayOrder: 1,
          isCollapsible: true,
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '2',
          name: 'Lead Details',
          description: 'Additional lead information and preferences',
          entityType: 'lead',
          displayOrder: 1,
          isCollapsible: false,
          isActive: true,
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-09-30')
        }
      ];
      
      setConfig({
        ...config,
        fields: mockFields,
        fieldGroups: mockFieldGroups
      });
    } catch (error) {
      console.error('Error loading custom fields data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = (updatedConfig: CustomFieldsConfiguration) => {
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
    { id: 'fields', name: 'Custom Fields', icon: TagIcon },
    { id: 'groups', name: 'Field Groups', icon: Squares2X2Icon },
    { id: 'sets', name: 'Field Sets', icon: DocumentTextIcon },
    { id: 'validations', name: 'Validations', icon: ShieldCheckIcon },
    { id: 'dependencies', name: 'Dependencies', icon: ArrowPathIcon }
  ];

  const activeFields = config.fields.filter(f => f.isActive).length;
  const totalFields = config.fields.length;
  const activeGroups = config.fieldGroups.filter(g => g.isActive).length;
  const totalGroups = config.fieldGroups.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Custom Fields Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create and manage custom fields, groups, and form customizations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <TagIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Fields</p>
              <p className="text-2xl font-semibold text-gray-900">{activeFields}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Fields</p>
              <p className="text-2xl font-semibold text-gray-900">{totalFields}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Squares2X2Icon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Field Groups</p>
              <p className="text-2xl font-semibold text-gray-900">{activeGroups}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Validations</p>
              <p className="text-2xl font-semibold text-gray-900">{config.validations.length}</p>
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
        {activeTab === 'fields' && (
          <CustomFields config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'groups' && (
          <FieldGroups config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'sets' && (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Field Sets</h3>
            <p className="text-gray-500">Field sets management coming soon...</p>
          </div>
        )}
        {activeTab === 'validations' && (
          <div className="text-center py-12">
            <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Field Validations</h3>
            <p className="text-gray-500">Validation rules management coming soon...</p>
          </div>
        )}
        {activeTab === 'dependencies' && (
          <div className="text-center py-12">
            <ArrowPathIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Field Dependencies</h3>
            <p className="text-gray-500">Field dependency management coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
