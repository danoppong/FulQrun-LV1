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
import { getSupabaseClient } from '@/lib/supabase-client';
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
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock data - in real implementation, this would fetch from API
      const mockPermissions: Permission[] = [
        {
          id: '1',
          permissionKey: 'admin.organization.view',
          permissionName: 'View Organization Settings',
          permissionCategory: 'Organization Management',
          description: 'View organization settings and configuration',
          moduleName: 'admin',
          isSystemPermission: true,
          createdAt: new Date()
        },
        {
          id: '2',
          permissionKey: 'admin.organization.edit',
          permissionName: 'Edit Organization Settings',
          permissionCategory: 'Organization Management',
          description: 'Edit organization settings and configuration',
          moduleName: 'admin',
          isSystemPermission: true,
          createdAt: new Date()
        },
        {
          id: '3',
          permissionKey: 'admin.users.view',
          permissionName: 'View Users',
          permissionCategory: 'User Management',
          description: 'View user list and details',
          moduleName: 'admin',
          isSystemPermission: true,
          createdAt: new Date()
        },
        {
          id: '4',
          permissionKey: 'admin.users.create',
          permissionName: 'Create Users',
          permissionCategory: 'User Management',
          description: 'Create new users',
          moduleName: 'admin',
          isSystemPermission: true,
          createdAt: new Date()
        },
        {
          id: '5',
          permissionKey: 'admin.modules.view',
          permissionName: 'View Module Configuration',
          permissionCategory: 'Module Configuration',
          description: 'View module settings',
          moduleName: 'admin',
          isSystemPermission: true,
          createdAt: new Date()
        }
      ];

      const mockRoles: Role[] = [
        {
          id: '1',
          roleKey: 'super_admin',
          roleName: 'Super Administrator',
          description: 'Full system access with all permissions',
          isActive: true,
          isSystemRole: true,
          userCount: 1,
          permissions: mockPermissions.map(p => p.permissionKey),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          roleKey: 'admin',
          roleName: 'Administrator',
          description: 'Administrative access to most system functions',
          isActive: true,
          isSystemRole: true,
          userCount: 2,
          permissions: mockPermissions.filter(p => !p.permissionKey.includes('super')).map(p => p.permissionKey),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          roleKey: 'manager',
          roleName: 'Manager',
          description: 'Management access to team and performance data',
          isActive: true,
          isSystemRole: true,
          userCount: 5,
          permissions: ['admin.users.view', 'admin.modules.view'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '4',
          roleKey: 'sales_manager',
          roleName: 'Sales Manager',
          description: 'Custom role for sales team management',
          inheritsFrom: 'manager',
          isActive: true,
          isSystemRole: false,
          userCount: 3,
          permissions: ['admin.users.view', 'admin.modules.view'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Build permission matrix
      const matrix: PermissionMatrix = {};
      mockRoles.forEach(role => {
        matrix[role.roleKey] = {};
        mockPermissions.forEach(permission => {
          matrix[role.roleKey][permission.permissionKey] = role.permissions.includes(permission.permissionKey);
        });
      });

      setPermissions(mockPermissions);
      setRoles(mockRoles);
      setPermissionMatrix(matrix);
    } catch (error) {
      console.error('Error loading data:', error);
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
        // Update existing role
        const updatedRoles = roles.map(role => 
          role.id === editingRole.id 
            ? { ...role, ...roleData, updatedAt: new Date() }
            : role
        );
        setRoles(updatedRoles);
        
        // Update permission matrix
        const newMatrix = { ...permissionMatrix };
        permissions.forEach(permission => {
          newMatrix[roleData.roleKey][permission.permissionKey] = roleData.permissions.includes(permission.permissionKey);
        });
        setPermissionMatrix(newMatrix);
      } else {
        // Create new role
        const newRole: Role = {
          id: Date.now().toString(),
          ...roleData,
          isSystemRole: false,
          userCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setRoles([...roles, newRole]);
        
        // Add to permission matrix
        const newMatrix = { ...permissionMatrix };
        newMatrix[roleData.roleKey] = {};
        permissions.forEach(permission => {
          newMatrix[roleData.roleKey][permission.permissionKey] = roleData.permissions.includes(permission.permissionKey);
        });
        setPermissionMatrix(newMatrix);
      }
      
      setShowForm(false);
      setEditingRole(undefined);
    } catch (error) {
      console.error('Error saving role:', error);
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
      const newMatrix = { ...permissionMatrix };
      newMatrix[roleKey][permissionKey] = granted;
      setPermissionMatrix(newMatrix);
      
      // Update role permissions
      const updatedRoles = roles.map(role => {
        if (role.roleKey === roleKey) {
          const newPermissions = granted
            ? [...role.permissions, permissionKey]
            : role.permissions.filter(p => p !== permissionKey);
          return { ...role, permissions: newPermissions, updatedAt: new Date() };
        }
        return role;
      });
      setRoles(updatedRoles);
    } catch (error) {
      console.error('Error updating permission:', error);
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
      ) : (
        <PermissionMatrix
          permissions={permissions}
          roles={roles}
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
