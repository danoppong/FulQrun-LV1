// Administration Module - Role and Permission Management
// Comprehensive role and permission management interface

'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  KeyIcon,
  UsersIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client'
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface Permission {
  id: string;
  permissionKey: string;
  permissionName: string;
  permissionCategory: string;
  description?: string;
  moduleName?: string;
  isSystemPermission: boolean;
  parentPermissionId?: string;
  createdAt: Date;
}

interface Role {
  id: string;
  roleKey: string;
  roleName: string;
  description?: string;
  inheritsFrom?: string;
  isActive: boolean;
  isSystemRole: boolean;
  userCount: number;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface RoleFormData {
  roleKey: string;
  roleName: string;
  description?: string;
  inheritsFrom?: string;
  permissions: string[];
}

interface PermissionMatrix {
  [roleKey: string]: {
    [permissionKey: string]: boolean;
  };
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const RoleFormSchema = z.object({
  roleKey: z.string().min(1, 'Role key is required').regex(/^[a-z_]+$/, 'Role key must contain only lowercase letters and underscores'),
  roleName: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  inheritsFrom: z.string().optional(),
  permissions: z.array(z.string())
});

// =============================================================================
// PERMISSION MATRIX COMPONENT
// =============================================================================

function PermissionMatrix({ 
  permissions, 
  roles, 
  matrix, 
  onPermissionChange 
}: {
  permissions: Permission[];
  roles: Role[];
  matrix: PermissionMatrix;
  onPermissionChange: (roleKey: string, permissionKey: string, granted: boolean) => void;
}) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const categories = Array.from(new Set(permissions.map(p => p.permissionCategory)));

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Organization Management':
        return '🏢';
      case 'User Management':
        return '👥';
      case 'Role Management':
        return '🔑';
      case 'Module Configuration':
        return '⚙️';
      case 'Security Management':
        return '🛡️';
      case 'System Administration':
        return '🖥️';
      case 'Audit & Compliance':
        return '📋';
      default:
        return '📁';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Permission Matrix</h3>
        <p className="text-sm text-gray-500">Configure permissions for each role</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Permission
              </th>
              {roles.map(role => (
                <th key={role.roleKey} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex flex-col items-center">
                    <span>{role.roleName}</span>
                    <span className="text-xs text-gray-400">({role.userCount} users)</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map(category => (
              <React.Fragment key={category}>
                <tr className="bg-gray-50">
                  <td 
                    className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{getCategoryIcon(category)}</span>
                      <span className="text-sm font-medium text-gray-900">{category}</span>
                      <ArrowsUpDownIcon className="h-4 w-4 ml-2 text-gray-400" />
                    </div>
                  </td>
                  {roles.map(role => (
                    <td key={role.roleKey} className="px-6 py-3 text-center">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={permissions
                            .filter(p => p.permissionCategory === category)
                            .every(p => matrix[role.roleKey]?.[p.permissionKey])
                          }
                          onChange={(e) => {
                            permissions
                              .filter(p => p.permissionCategory === category)
                              .forEach(p => onPermissionChange(role.roleKey, p.permissionKey, e.target.checked));
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </td>
                  ))}
                </tr>
                {expandedCategories.has(category) && permissions
                  .filter(p => p.permissionCategory === category)
                  .map(permission => (
                    <tr key={permission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 pl-12">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {permission.permissionName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {permission.permissionKey}
                          </div>
                          {permission.description && (
                            <div className="text-xs text-gray-400 mt-1">
                              {permission.description}
                            </div>
                          )}
                        </div>
                      </td>
                      {roles.map(role => (
                        <td key={role.roleKey} className="px-6 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={matrix[role.roleKey]?.[permission.permissionKey] || false}
                            onChange={(e) => onPermissionChange(role.roleKey, permission.permissionKey, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                }
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// ROLE LIST COMPONENT
// =============================================================================

function RoleList({ 
  roles, 
  onEdit, 
  onDelete, 
  onToggleActive 
}: {
  roles: Role[];
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  onToggleActive: (role: Role) => void;
}) {
  const [sortField, setSortField] = useState<keyof Role>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Role) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRoles = [...roles].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Roles</h3>
        <p className="text-sm text-gray-500">Manage user roles and their permissions</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('roleName')}
              >
                <div className="flex items-center space-x-1">
                  <span>Role Name</span>
                  <ArrowsUpDownIcon className="h-4 w-4" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('userCount')}
              >
                <div className="flex items-center space-x-1">
                  <span>Users</span>
                  <ArrowsUpDownIcon className="h-4 w-4" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('isActive')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  <ArrowsUpDownIcon className="h-4 w-4" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedRoles.map(role => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <KeyIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {role.roleName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {role.roleKey}
                        {role.isSystemRole && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            System
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {role.description || '-'}
                  </div>
                  {role.inheritsFrom && (
                    <div className="text-sm text-gray-500">
                      Inherits from: {role.inheritsFrom}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <UsersIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-900">{role.userCount}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    role.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {role.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(role)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit role"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onToggleActive(role)}
                      className={role.isActive 
                        ? "text-red-600 hover:text-red-900" 
                        : "text-green-600 hover:text-green-900"
                      }
                      title={role.isActive ? "Deactivate role" : "Activate role"}
                    >
                      {role.isActive ? <XMarkIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
                    </button>
                    {!role.isSystemRole && (
                      <button
                        onClick={() => onDelete(role)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete role"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
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
// ROLE FORM COMPONENT
// =============================================================================

function RoleForm({ 
  role, 
  permissions,
  roles,
  onSave, 
  onCancel,
  isOpen 
}: {
  role?: Role;
  permissions: Permission[];
  roles: Role[];
  onSave: (roleData: RoleFormData) => void;
  onCancel: () => void;
  isOpen: boolean;
}) {
  const [formData, setFormData] = useState<RoleFormData>({
    roleKey: '',
    roleName: '',
    description: '',
    inheritsFrom: '',
    permissions: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (role) {
      setFormData({
        roleKey: role.roleKey,
        roleName: role.roleName,
        description: role.description || '',
        inheritsFrom: role.inheritsFrom || '',
        permissions: role.permissions
      });
    } else {
      setFormData({
        roleKey: '',
        roleName: '',
        description: '',
        inheritsFrom: '',
        permissions: []
      });
    }
    setErrors({});
  }, [role]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = RoleFormSchema.parse(formData);
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

  const togglePermission = (permissionKey: string) => {
    const newPermissions = formData.permissions.includes(permissionKey)
      ? formData.permissions.filter(p => p !== permissionKey)
      : [...formData.permissions, permissionKey];
    
    setFormData({ ...formData, permissions: newPermissions });
  };

  const toggleCategory = (category: string) => {
    const categoryPermissions = permissions
      .filter(p => p.permissionCategory === category)
      .map(p => p.permissionKey);
    
    const allSelected = categoryPermissions.every(p => formData.permissions.includes(p));
    
    if (allSelected) {
      // Remove all permissions in this category
      setFormData({
        ...formData,
        permissions: formData.permissions.filter(p => !categoryPermissions.includes(p))
      });
    } else {
      // Add all permissions in this category
      const newPermissions = [...new Set([...formData.permissions, ...categoryPermissions])];
      setFormData({ ...formData, permissions: newPermissions });
    }
  };

  if (!isOpen) return null;

  const categories = Array.from(new Set(permissions.map(p => p.permissionCategory)));

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {role ? 'Edit Role' : 'Create New Role'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role Key</label>
                <input
                  type="text"
                  value={formData.roleKey}
                  onChange={(e) => setFormData({ ...formData, roleKey: e.target.value })}
                  disabled={role?.isSystemRole}
                  placeholder="sales_manager"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.roleKey ? 'border-red-300' : ''
                  } ${role?.isSystemRole ? 'bg-gray-50' : ''}`}
                />
                {errors.roleKey && <p className="mt-1 text-sm text-red-600">{errors.roleKey}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Role Name</label>
                <input
                  type="text"
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  placeholder="Sales Manager"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.roleName ? 'border-red-300' : ''
                  }`}
                />
                {errors.roleName && <p className="mt-1 text-sm text-red-600">{errors.roleName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe the role's responsibilities..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Inherits From</label>
              <select
                value={formData.inheritsFrom}
                onChange={(e) => setFormData({ ...formData, inheritsFrom: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">No inheritance</option>
                {roles.filter(r => r.roleKey !== formData.roleKey).map(role => (
                  <option key={role.roleKey} value={role.roleKey}>
                    {role.roleName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
              <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-4">
                {categories.map(category => {
                  const categoryPermissions = permissions.filter(p => p.permissionCategory === category);
                  const selectedCount = categoryPermissions.filter(p => formData.permissions.includes(p.permissionKey)).length;
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedCount === categoryPermissions.length}
                            onChange={() => toggleCategory(category)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 text-sm font-medium text-gray-900">
                            {category} ({selectedCount}/{categoryPermissions.length})
                          </label>
                        </div>
                      </div>
                      <div className="ml-6 space-y-1">
                        {categoryPermissions.map(permission => (
                          <div key={permission.id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.permissionKey)}
                              onChange={() => togglePermission(permission.permissionKey)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 text-sm text-gray-700">
                              {permission.permissionName}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
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
                {role ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PERMISSION MANAGEMENT COMPONENT
// =============================================================================

function PermissionManagement({ 
  permissions, 
  onPermissionCreated 
}: {
  permissions: Permission[];
  onPermissionCreated: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    permissionKey: '',
    permissionName: '',
    permissionCategory: '',
    description: '',
    moduleName: '',
    parentPermissionId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const categories = Array.from(new Set(permissions.map(p => p.permissionCategory)));
  const modules = Array.from(new Set(permissions.map(p => p.moduleName)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          permissionKey: formData.permissionKey,
          permissionName: formData.permissionName,
          permissionCategory: formData.permissionCategory,
          description: formData.description || null,
          moduleName: formData.moduleName,
          parentPermissionId: formData.parentPermissionId || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create permission');
      }

      console.log('✅ Permission created successfully');
      alert(`Permission "${formData.permissionName}" created successfully!`);
      
      // Reset form and reload data
      setFormData({
        permissionKey: '',
        permissionName: '',
        permissionCategory: '',
        description: '',
        moduleName: '',
        parentPermissionId: ''
      });
      setShowForm(false);
      onPermissionCreated();
    } catch (error) {
      console.error('❌ Error creating permission:', error);
      alert(`Error creating permission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Permission Management</h3>
            <p className="text-sm text-gray-500">Create and manage custom permissions</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Permission
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Total Permissions</div>
            <div className="text-2xl font-semibold text-gray-900">{permissions.length}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Categories</div>
            <div className="text-2xl font-semibold text-gray-900">{categories.length}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Modules</div>
            <div className="text-2xl font-semibold text-gray-900">{modules.length}</div>
          </div>
        </div>

        {/* Permission Categories Overview */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Permission Categories</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map(category => {
              const categoryPermissions = permissions.filter(p => p.permissionCategory === category);
              return (
                <div key={category} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-900">{category}</div>
                  <div className="text-xs text-gray-500">{categoryPermissions.length} permissions</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Permission Creation Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Permission</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Permission Key</label>
                    <input
                      type="text"
                      value={formData.permissionKey}
                      onChange={(e) => setFormData({ ...formData, permissionKey: e.target.value })}
                      placeholder="module.action.resource"
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                        errors.permissionKey ? 'border-red-300' : ''
                      }`}
                      required
                    />
                    {errors.permissionKey && <p className="mt-1 text-sm text-red-600">{errors.permissionKey}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Permission Name</label>
                    <input
                      type="text"
                      value={formData.permissionName}
                      onChange={(e) => setFormData({ ...formData, permissionName: e.target.value })}
                      placeholder="Action Resource"
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                        errors.permissionName ? 'border-red-300' : ''
                      }`}
                      required
                    />
                    {errors.permissionName && <p className="mt-1 text-sm text-red-600">{errors.permissionName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={formData.permissionCategory}
                      onChange={(e) => setFormData({ ...formData, permissionCategory: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Module</label>
                    <select
                      value={formData.moduleName}
                      onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    >
                      <option value="">Select Module</option>
                      {modules.map(module => (
                        <option key={module} value={module}>{module}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Describe what this permission allows..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Permission'}
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

function RBACConfiguration({ 
  roles, 
  permissions, 
  matrix, 
  onPermissionChange 
}: {
  roles: Role[];
  permissions: Permission[];
  matrix: PermissionMatrix;
  onPermissionChange: (roleKey: string, permissionKey: string, granted: boolean) => void;
}) {
  const [rbacSettings, setRbacSettings] = useState({
    enableRbac: true,
    strictMode: false,
    auditLogging: true,
    sessionTimeout: 30,
    maxFailedAttempts: 5,
    lockoutDuration: 15
  });

  const [testUser, setTestUser] = useState('');
  const [testPermission, setTestPermission] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [loadingTest, setLoadingTest] = useState(false);

  // Load RBAC settings on component mount
  useEffect(() => {
    loadRbacSettings();
  }, []);

  const loadRbacSettings = async () => {
    try {
      setLoadingSettings(true);
      
      const response = await fetch('/api/admin/rbac/settings', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setRbacSettings({
          enableRbac: data.settings.enableRbac,
          strictMode: data.settings.strictMode,
          auditLogging: data.settings.auditLogging,
          sessionTimeout: data.settings.sessionTimeoutMinutes,
          maxFailedAttempts: data.settings.maxFailedAttempts,
          lockoutDuration: data.settings.lockoutDurationMinutes
        });
      }
    } catch (error) {
      console.error('Error loading RBAC settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleRbacSettingChange = async (key: string, value: any) => {
    const newSettings = { ...rbacSettings, [key]: value };
    setRbacSettings(newSettings);

    try {
      const response = await fetch('/api/admin/rbac/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          enableRbac: newSettings.enableRbac,
          strictMode: newSettings.strictMode,
          auditLogging: newSettings.auditLogging,
          sessionTimeoutMinutes: newSettings.sessionTimeout,
          maxFailedAttempts: newSettings.maxFailedAttempts,
          lockoutDurationMinutes: newSettings.lockoutDuration
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to update RBAC settings');
      }

      console.log('✅ RBAC settings updated successfully');
    } catch (error) {
      console.error('❌ Error updating RBAC settings:', error);
      alert(`Error updating RBAC settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Revert the change
      setRbacSettings(rbacSettings);
    }
  };

  const testPermissionAccess = async () => {
    if (!testUser || !testPermission) {
      alert('Please enter both user and permission to test');
      return;
    }

    try {
      setLoadingTest(true);
      
      const response = await fetch('/api/admin/rbac/test-permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          testUserId: testUser,
          permissionKey: testPermission
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to test permission');
      }

      const data = await response.json();
      setTestResult(data.result);
      
      console.log('✅ Permission test completed:', data.result);
    } catch (error) {
      console.error('❌ Error testing permission:', error);
      alert(`Error testing permission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingTest(false);
    }
  };

  const rbacPolicies = [
    {
      id: '1',
      name: 'Admin Access Policy',
      description: 'Controls access to administrative functions',
      roles: ['admin', 'super_admin'],
      permissions: ['admin.*'],
      isActive: true
    },
    {
      id: '2',
      name: 'User Management Policy',
      description: 'Controls user management operations',
      roles: ['admin', 'manager'],
      permissions: ['admin.users.*'],
      isActive: true
    },
    {
      id: '3',
      name: 'Organization Settings Policy',
      description: 'Controls organization configuration access',
      roles: ['admin'],
      permissions: ['admin.organization.*'],
      isActive: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* RBAC Status */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">RBAC Status</h3>
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${rbacSettings.enableRbac ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-gray-700">
              {rbacSettings.enableRbac ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Active Roles</div>
            <div className="text-2xl font-semibold text-gray-900">{roles.filter(r => r.isActive).length}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Total Permissions</div>
            <div className="text-2xl font-semibold text-gray-900">{permissions.length}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500">RBAC Policies</div>
            <div className="text-2xl font-semibold text-gray-900">{rbacPolicies.length}</div>
          </div>
        </div>
      </div>

      {/* RBAC Settings */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">RBAC Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Enable RBAC</label>
              <input
                type="checkbox"
                checked={rbacSettings.enableRbac}
                onChange={(e) => handleRbacSettingChange('enableRbac', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Strict Mode</label>
              <input
                type="checkbox"
                checked={rbacSettings.strictMode}
                onChange={(e) => handleRbacSettingChange('strictMode', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Audit Logging</label>
              <input
                type="checkbox"
                checked={rbacSettings.auditLogging}
                onChange={(e) => handleRbacSettingChange('auditLogging', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
              <input
                type="number"
                value={rbacSettings.sessionTimeout}
                onChange={(e) => handleRbacSettingChange('sessionTimeout', parseInt(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Failed Attempts</label>
              <input
                type="number"
                value={rbacSettings.maxFailedAttempts}
                onChange={(e) => handleRbacSettingChange('maxFailedAttempts', parseInt(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lockout Duration (minutes)</label>
              <input
                type="number"
                value={rbacSettings.lockoutDuration}
                onChange={(e) => handleRbacSettingChange('lockoutDuration', parseInt(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Save RBAC Settings
          </button>
        </div>
      </div>

      {/* RBAC Policies */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">RBAC Policies</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <PlusIcon className="h-4 w-4 mr-2 inline" />
            Add Policy
          </button>
        </div>
        
        <div className="space-y-4">
          {rbacPolicies.map((policy) => (
            <div key={policy.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{policy.name}</h4>
                  <p className="text-sm text-gray-500">{policy.description}</p>
                  <div className="mt-2 flex items-center space-x-4">
                    <span className="text-xs text-gray-500">
                      Roles: {policy.roles.join(', ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      Permissions: {policy.permissions.join(', ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    policy.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {policy.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button className="text-blue-600 hover:text-blue-900">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permission Testing */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Permission Testing</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test User</label>
            <input
              type="text"
              value={testUser}
              onChange={(e) => setTestUser(e.target.value)}
              placeholder="Enter user email or ID"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Permission</label>
            <input
              type="text"
              value={testPermission}
              onChange={(e) => setTestPermission(e.target.value)}
              placeholder="Enter permission key"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
        
        <button
          onClick={testPermissionAccess}
          disabled={loadingTest}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingTest ? 'Testing...' : 'Test Permission Access'}
        </button>
        
        {testResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Test Result</h4>
            <div className="text-sm text-gray-600">
              <p><strong>User:</strong> {testResult.user}</p>
              <p><strong>Permission:</strong> {testResult.permission}</p>
              <p><strong>Access:</strong> 
                <span className={`ml-1 ${testResult.hasAccess ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult.hasAccess ? 'Granted' : 'Denied'}
                </span>
              </p>
              <p><strong>Reason:</strong> {testResult.reason}</p>
              <p><strong>Timestamp:</strong> {new Date(testResult.timestamp).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* RBAC Audit Log */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent RBAC Activity</h3>
        
        <div className="space-y-3">
          {[
            { action: 'Permission Check', user: 'danoppong@gmail.com', permission: 'admin.users.view', result: 'Granted', timestamp: '2 minutes ago' },
            { action: 'Role Assignment', user: 'admin@example.com', role: 'manager', result: 'Success', timestamp: '15 minutes ago' },
            { action: 'Permission Denied', user: 'user@example.com', permission: 'admin.settings.edit', result: 'Denied', timestamp: '1 hour ago' },
            { action: 'RBAC Settings Update', user: 'danoppong@gmail.com', setting: 'strictMode', result: 'Updated', timestamp: '2 hours ago' }
          ].map((log, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`h-2 w-2 rounded-full ${
                  log.result === 'Granted' || log.result === 'Success' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{log.action}</p>
                  <p className="text-xs text-gray-500">{log.user} • {log.permission || log.role || log.setting}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs font-medium ${
                  log.result === 'Granted' || log.result === 'Success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {log.result}
                </p>
                <p className="text-xs text-gray-500">{log.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN ROLE MANAGEMENT COMPONENT
// =============================================================================

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Role | undefined>();
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'rbac'>('roles');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch roles and permissions from API
      const [rolesResponse, permissionsResponse] = await Promise.all([
        fetch('/api/admin/roles', { credentials: 'include' }),
        fetch('/api/admin/permissions', { credentials: 'include' })
      ]);

      if (!rolesResponse.ok) {
        const errorData = await rolesResponse.json();
        throw new Error(errorData.details || 'Failed to load roles');
      }

      if (!permissionsResponse.ok) {
        const errorData = await permissionsResponse.json();
        throw new Error(errorData.details || 'Failed to load permissions');
      }

      const rolesData = await rolesResponse.json();
      const permissionsData = await permissionsResponse.json();

      // Transform API data to match our interfaces
      const transformedRoles: Role[] = rolesData.roles.map((r: unknown) => ({
        id: r.id,
        roleKey: r.role_key,
        roleName: r.role_name,
        description: r.description,
        inheritsFrom: r.inherits_from,
        isActive: r.is_active,
        isSystemRole: r.is_system_role,
        userCount: r.userCount || 0,
        permissions: [], // Will be loaded separately
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at)
      }));

      const transformedPermissions: Permission[] = permissionsData.permissions.map((p: unknown) => ({
        id: p.id,
        permissionKey: p.permission_key,
        permissionName: p.permission_name,
        permissionCategory: p.permission_category,
        description: p.description,
        moduleName: p.module_name,
        isSystemPermission: p.is_system_permission,
        parentPermissionId: p.parent_permission_id,
        createdAt: new Date(p.created_at)
      }));

      // Load permissions for each role
      const rolesWithPermissions = await Promise.all(
        transformedRoles.map(async (role) => {
          try {
            const rolePermissionsResponse = await fetch(`/api/admin/roles/${role.id}/permissions`, {
              credentials: 'include'
            });
            
            if (rolePermissionsResponse.ok) {
              const rolePermissionsData = await rolePermissionsResponse.json();
              const rolePermissionKeys = rolePermissionsData.permissions.map((p: unknown) => p.permission_key);
              return { ...role, permissions: rolePermissionKeys };
            }
          } catch (error) {
            console.error(`Error loading permissions for role ${role.roleName}:`, error);
          }
          return { ...role, permissions: [] };
        })
      );

      // Build permission matrix
      const matrix: PermissionMatrix = {};
      rolesWithPermissions.forEach(role => {
        matrix[role.roleKey] = {};
        transformedPermissions.forEach(permission => {
          matrix[role.roleKey][permission.permissionKey] = role.permissions.includes(permission.permissionKey);
        });
      });

      setPermissions(transformedPermissions);
      setRoles(rolesWithPermissions);
      setPermissionMatrix(matrix);
      
      console.log(`✅ Loaded ${transformedRoles.length} roles and ${transformedPermissions.length} permissions from database`);
    } catch (error) {
      console.error('❌ Error loading data:', error);
      alert(`Error loading data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = () => {
    setEditingRole(undefined);
    setShowForm(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setShowForm(true);
  };

  const handleSaveRole = async (roleData: RoleFormData) => {
    try {
      if (editingRole) {
        // Update existing role - implement PUT endpoint
        console.log('✏️ Updating role:', editingRole.id);
        // TODO: Implement PUT /api/admin/roles/[id] endpoint
        alert('Role update functionality will be implemented with the PUT endpoint');
      } else {
        // Create new role
        console.log('➕ Creating new role:', roleData);
        
        const response = await fetch('/api/admin/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(roleData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to create role');
        }

        const data = await response.json();
        
        // Reload data to get the new role with all details
        await loadData();
        
        console.log('✅ Role created successfully:', data.role.roleName);
        alert(`Role "${data.role.roleName}" created successfully!`);
      }
      
      setShowForm(false);
      setEditingRole(undefined);
    } catch (error) {
      console.error('❌ Error saving role:', error);
      alert(`Error saving role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    try {
      setRoles(roles.filter(r => r.id !== role.id));
      
      // Remove from permission matrix
      const newMatrix = { ...permissionMatrix };
      delete newMatrix[role.roleKey];
      setPermissionMatrix(newMatrix);
      
      setShowDeleteConfirm(undefined);
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  const handleToggleActive = async (role: Role) => {
    try {
      const updatedRoles = roles.map(r => 
        r.id === role.id 
          ? { ...r, isActive: !r.isActive, updatedAt: new Date() }
          : r
      );
      setRoles(updatedRoles);
    } catch (error) {
      console.error('Error toggling role status:', error);
    }
  };

  const handlePermissionChange = async (roleKey: string, permissionKey: string, granted: boolean) => {
    try {
      console.log('🔄 Updating permission:', { roleKey, permissionKey, granted });
      
      // Find the role ID
      const role = roles.find(r => r.roleKey === roleKey);
      if (!role) {
        throw new Error('Role not found');
      }

      // Update permission matrix optimistically
      const newMatrix = { ...permissionMatrix };
      newMatrix[roleKey][permissionKey] = granted;
      setPermissionMatrix(newMatrix);
      
      // Update role permissions optimistically
      const updatedRoles = roles.map(r => {
        if (r.roleKey === roleKey) {
          const newPermissions = granted
            ? [...r.permissions, permissionKey]
            : r.permissions.filter(p => p !== permissionKey);
          return { ...r, permissions: newPermissions, updatedAt: new Date() };
        }
        return r;
      });
      setRoles(updatedRoles);

      // Update permissions via API
      const response = await fetch(`/api/admin/roles/${role.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ permissions: updatedRoles.find(r => r.roleKey === roleKey)?.permissions || [] })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to update role permissions');
      }

      console.log('✅ Permission updated successfully:', { roleKey, permissionKey, granted });
    } catch (error) {
      console.error('❌ Error updating permission:', error);
      
      // Revert optimistic updates on error
      await loadData();
      
      alert(`Error updating permission: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          <h1 className="text-2xl font-bold text-gray-900">Role & Permission Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user roles and configure permissions
          </p>
        </div>
        <button
          onClick={handleCreateRole}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Role
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Roles</p>
              <p className="text-2xl font-semibold text-gray-900">{roles.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <KeyIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Roles</p>
              <p className="text-2xl font-semibold text-gray-900">
                {roles.filter(r => r.isActive).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Permissions</p>
              <p className="text-2xl font-semibold text-gray-900">{permissions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Roles
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'permissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Permission Matrix
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rbac'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            RBAC Configuration
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'roles' ? (
        <RoleList
          roles={roles}
          onEdit={handleEditRole}
          onDelete={(role) => setShowDeleteConfirm(role)}
          onToggleActive={handleToggleActive}
        />
      ) : activeTab === 'permissions' ? (
        <div className="space-y-6">
          <PermissionMatrix
            permissions={permissions}
            roles={roles}
            matrix={permissionMatrix}
            onPermissionChange={handlePermissionChange}
          />
          <PermissionManagement permissions={permissions} onPermissionCreated={loadData} />
        </div>
      ) : (
        <RBACConfiguration
          roles={roles}
          permissions={permissions}
          matrix={permissionMatrix}
          onPermissionChange={handlePermissionChange}
        />
      )}

      {/* Role Form Modal */}
      <RoleForm
        role={editingRole}
        permissions={permissions}
        roles={roles}
        onSave={handleSaveRole}
        onCancel={() => {
          setShowForm(false);
          setEditingRole(undefined);
        }}
        isOpen={showForm}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900">Delete Role</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete the role <strong>{showDeleteConfirm.roleName}</strong>? 
                    This action cannot be undone.
                  </p>
                  {showDeleteConfirm.userCount > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                      <div className="flex">
                        <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            This role is assigned to {showDeleteConfirm.userCount} user(s). 
                            They will need to be reassigned to another role.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(undefined)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteRole(showDeleteConfirm)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
