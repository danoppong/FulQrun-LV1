// Administration Module - Enterprise Roles Management
// Advanced role management for enterprise features

'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  KeyIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface EnterpriseRole {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  enterpriseRole: 'user' | 'manager' | 'admin' | 'super_admin';
  organizationId: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  permissions: string[];
}

interface EnterpriseRoleFormData {
  userId: string;
  enterpriseRole: 'user' | 'manager' | 'admin' | 'super_admin';
  expiresAt?: Date;
  permissions: string[];
}

interface EnterpriseRoleFilters {
  enterpriseRole?: string;
  isActive?: boolean;
  search?: string;
}

// =============================================================================
// PERMISSIONS CONFIGURATION
// =============================================================================

const ENTERPRISE_PERMISSIONS = {
  'user': [
    'enterprise.view',
    'enterprise.profile.edit'
  ],
  'manager': [
    'enterprise.view',
    'enterprise.profile.edit',
    'enterprise.users.view',
    'enterprise.reports.view',
    'enterprise.analytics.view'
  ],
  'admin': [
    'enterprise.view',
    'enterprise.profile.edit',
    'enterprise.users.view',
    'enterprise.users.edit',
    'enterprise.reports.view',
    'enterprise.reports.create',
    'enterprise.analytics.view',
    'enterprise.analytics.create',
    'enterprise.settings.view',
    'enterprise.settings.edit'
  ],
  'super_admin': [
    'enterprise.view',
    'enterprise.profile.edit',
    'enterprise.users.view',
    'enterprise.users.edit',
    'enterprise.users.delete',
    'enterprise.reports.view',
    'enterprise.reports.create',
    'enterprise.reports.delete',
    'enterprise.analytics.view',
    'enterprise.analytics.create',
    'enterprise.analytics.delete',
    'enterprise.settings.view',
    'enterprise.settings.edit',
    'enterprise.settings.delete',
    'enterprise.roles.view',
    'enterprise.roles.edit',
    'enterprise.roles.delete',
    'enterprise.audit.view',
    'enterprise.billing.view',
    'enterprise.billing.edit'
  ]
};

// =============================================================================
// ENTERPRISE ROLE TABLE COMPONENT
// =============================================================================

function EnterpriseRoleTable({ 
  roles, 
  onEdit, 
  onDelete, 
  onToggleActive 
}: {
  roles: EnterpriseRole[];
  onEdit: (role: EnterpriseRole) => void;
  onDelete: (role: EnterpriseRole) => void;
  onToggleActive: (role: EnterpriseRole) => void;
}) {
  const [sortField, setSortField] = useState<keyof EnterpriseRole>('grantedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const columns = [
    {
      key: 'userFullName' as keyof EnterpriseRole,
      label: 'User',
      sortable: true,
      render: (value: any, role: EnterpriseRole) => (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {role.userFullName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">{role.userFullName}</div>
            <div className="text-sm text-gray-500">{role.userEmail}</div>
          </div>
        </div>
      )
    },
    {
      key: 'enterpriseRole' as keyof EnterpriseRole,
      label: 'Enterprise Role',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'super_admin' ? 'bg-purple-100 text-purple-800' :
          value === 'admin' ? 'bg-red-100 text-red-800' :
          value === 'manager' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {value.replace('_', ' ').toUpperCase()}
        </span>
      )
    },
    {
      key: 'permissions' as keyof EnterpriseRole,
      label: 'Permissions',
      sortable: false,
      render: (value: string[]) => (
        <div className="text-xs text-gray-500">
          {value.length} permissions
        </div>
      )
    },
    {
      key: 'grantedAt' as keyof EnterpriseRole,
      label: 'Granted',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleDateString()
    },
    {
      key: 'expiresAt' as keyof EnterpriseRole,
      label: 'Expires',
      sortable: true,
      render: (value: Date | undefined) => value ? new Date(value).toLocaleDateString() : 'Never'
    },
    {
      key: 'isActive' as keyof EnterpriseRole,
      label: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  const handleSort = (field: keyof EnterpriseRole) => {
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
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                }`}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {column.sortable && (
                    <ArrowsUpDownIcon className="h-4 w-4" />
                  )}
                </div>
              </th>
            ))}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedRoles.map((role) => (
            <tr key={role.id} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                  {column.render 
                    ? column.render(role[column.key], role)
                    : role[column.key]
                  }
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEdit(role)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit enterprise role"
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
                    {role.isActive ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => onDelete(role)}
                    className="text-red-600 hover:text-red-900"
                    title="Remove enterprise role"
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
  );
}

// =============================================================================
// ENTERPRISE ROLE FORM COMPONENT
// =============================================================================

function EnterpriseRoleForm({ 
  role, 
  onSave, 
  onCancel,
  isOpen,
  availableUsers
}: {
  role?: EnterpriseRole;
  onSave: (roleData: EnterpriseRoleFormData) => void;
  onCancel: () => void;
  isOpen: boolean;
  availableUsers: Array<{id: string, email: string, fullName: string}>;
}) {
  const [formData, setFormData] = useState<EnterpriseRoleFormData>({
    userId: '',
    enterpriseRole: 'user',
    permissions: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (role) {
      setFormData({
        userId: role.userId,
        enterpriseRole: role.enterpriseRole,
        expiresAt: role.expiresAt,
        permissions: role.permissions
      });
    } else {
      setFormData({
        userId: '',
        enterpriseRole: 'user',
        permissions: []
      });
    }
    setErrors({});
  }, [role]);

  useEffect(() => {
    // Auto-update permissions when role changes
    const permissions = ENTERPRISE_PERMISSIONS[formData.enterpriseRole] || [];
    setFormData(prev => ({ ...prev, permissions }));
  }, [formData.enterpriseRole]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId) {
      setErrors({ userId: 'Please select a user' });
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {role ? 'Edit Enterprise Role' : 'Grant Enterprise Role'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">User</label>
              <select
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.userId ? 'border-red-300' : ''
                }`}
              >
                <option value="">Select a user...</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.email})
                  </option>
                ))}
              </select>
              {errors.userId && <p className="mt-1 text-sm text-red-600">{errors.userId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Enterprise Role</label>
              <select
                value={formData.enterpriseRole}
                onChange={(e) => setFormData({ ...formData, enterpriseRole: e.target.value as any })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Permissions</label>
              <div className="mt-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                {formData.permissions.map(permission => (
                  <div key={permission} className="text-xs text-gray-600 py-1">
                    • {permission}
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Permissions are automatically assigned based on the role level.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
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
                {role ? 'Update Role' : 'Grant Role'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN ENTERPRISE ROLES COMPONENT
// =============================================================================

export default function EnterpriseRolesManagement() {
  const [roles, setRoles] = useState<EnterpriseRole[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<EnterpriseRole[]>([]);
  const [filters, setFilters] = useState<EnterpriseRoleFilters>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<EnterpriseRole | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<EnterpriseRole | undefined>();
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, email: string, fullName: string}>>([]);

  useEffect(() => {
    loadRoles();
    loadAvailableUsers();
  }, []);

  useEffect(() => {
    filterRoles();
  }, [roles, filters]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/enterprise-roles', {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to load enterprise roles');
      }

      const data = await response.json();
      
      // Transform API data to match our EnterpriseRole interface
      const transformedRoles: EnterpriseRole[] = data.enterpriseRoles.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        userEmail: r.userEmail,
        userFullName: r.userFullName,
        enterpriseRole: r.enterpriseRole,
        organizationId: r.organizationId,
        grantedBy: r.grantedBy,
        grantedAt: new Date(r.grantedAt),
        expiresAt: r.expiresAt ? new Date(r.expiresAt) : undefined,
        isActive: r.isActive,
        permissions: r.permissions
      }));
      
      setRoles(transformedRoles);
      console.log(`✅ Loaded ${transformedRoles.length} enterprise roles from database`);
    } catch (error) {
      console.error('❌ Error loading enterprise roles:', error);
      alert(`Error loading enterprise roles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users.map((u: any) => ({
          id: u.id,
          email: u.email,
          fullName: u.fullName
        })));
      }
    } catch (error) {
      console.error('❌ Error loading available users:', error);
    }
  };

  const filterRoles = () => {
    let filtered = [...roles];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(role => 
        role.userFullName.toLowerCase().includes(searchLower) ||
        role.userEmail.toLowerCase().includes(searchLower)
      );
    }

    if (filters.enterpriseRole) {
      filtered = filtered.filter(role => role.enterpriseRole === filters.enterpriseRole);
    }

    if (filters.isActive !== undefined) {
      filtered = filtered.filter(role => role.isActive === filters.isActive);
    }

    setFilteredRoles(filtered);
  };

  const handleCreateRole = () => {
    setEditingRole(undefined);
    setShowForm(true);
  };

  const handleEditRole = (role: EnterpriseRole) => {
    setEditingRole(role);
    setShowForm(true);
  };

  const handleSaveRole = async (roleData: EnterpriseRoleFormData) => {
    try {
      if (editingRole) {
        // Update existing role
        console.log('📤 Updating enterprise role:', roleData);
        
        const response = await fetch(`/api/admin/enterprise-roles/${editingRole.userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(roleData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to update enterprise role');
        }

        console.log('✅ Enterprise role updated successfully');
      } else {
        // Create new role
        console.log('📤 Creating enterprise role:', roleData);
        
        const response = await fetch('/api/admin/enterprise-roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(roleData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to create enterprise role');
        }

        console.log('✅ Enterprise role created successfully');
      }
      
      setShowForm(false);
      setEditingRole(undefined);
      await loadRoles(); // Reload roles
    } catch (error) {
      console.error('❌ Error saving enterprise role:', error);
      alert(`Error saving enterprise role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteRole = async (role: EnterpriseRole) => {
    try {
      console.log('🗑️ Deleting enterprise role:', role.id);
      
      const response = await fetch(`/api/admin/enterprise-roles/${role.userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to delete enterprise role');
      }

      console.log('✅ Enterprise role deleted successfully');
      await loadRoles(); // Reload roles
      setShowDeleteConfirm(undefined);
    } catch (error) {
      console.error('❌ Error deleting enterprise role:', error);
      alert(`Error deleting enterprise role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleToggleActive = async (role: EnterpriseRole) => {
    try {
      console.log('🔄 Toggling enterprise role:', role.id);
      
      // For now, we'll just reload the roles since the API doesn't have a toggle endpoint yet
      // In a real implementation, you'd have a separate endpoint for this
      await loadRoles();
    } catch (error) {
      console.error('❌ Error toggling enterprise role:', error);
      alert(`Error toggling enterprise role: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          <h1 className="text-2xl font-bold text-gray-900">Enterprise Roles</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage enterprise-level permissions and access control
          </p>
        </div>
        <button
          onClick={handleCreateRole}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Grant Role
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Roles</p>
              <p className="text-2xl font-semibold text-gray-900">{roles.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
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
            <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Super Admins</p>
              <p className="text-2xl font-semibold text-gray-900">
                {roles.filter(r => r.enterpriseRole === 'super_admin').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-semibold text-gray-900">
                {roles.filter(r => r.expiresAt && new Date(r.expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <div className="mt-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search users..."
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Enterprise Role</label>
            <select
              value={filters.enterpriseRole || ''}
              onChange={(e) => setFilters({ ...filters, enterpriseRole: e.target.value || undefined })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.isActive === undefined ? '' : filters.isActive.toString()}
              onChange={(e) => {
                const value = e.target.value === '' ? undefined : e.target.value === 'true';
                setFilters({ ...filters, isActive: value });
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enterprise Roles Table */}
      <EnterpriseRoleTable
        roles={filteredRoles}
        onEdit={handleEditRole}
        onDelete={(role) => setShowDeleteConfirm(role)}
        onToggleActive={handleToggleActive}
      />

      {/* Enterprise Role Form Modal */}
      <EnterpriseRoleForm
        role={editingRole}
        onSave={handleSaveRole}
        onCancel={() => {
          setShowForm(false);
          setEditingRole(undefined);
        }}
        isOpen={showForm}
        availableUsers={availableUsers}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900">Remove Enterprise Role</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to remove the <strong>{showDeleteConfirm.enterpriseRole}</strong> role from <strong>{showDeleteConfirm.userFullName}</strong>? 
                    This action cannot be undone.
                  </p>
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
                  Remove Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
