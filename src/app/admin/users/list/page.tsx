// Administration Module - User Management Interface
// Comprehensive user management with CRUD operations
// API usage notes:
// - GET /api/admin/users?limit={n}&offset={n}&search={q}&includeRegions=true
//   returns { users: User[], totalCount?: number }
// - We use server-side search and pagination. Client filters (role/department/status)
//   are applied locally on the current page for responsiveness.

'use client';

import React, { useState, useEffect } from 'react';
import {
  UsersIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { z } from 'zod';
import UserSelect from '@/components/common/UserSelect';


// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string; // dynamic role key from roles API
  enterpriseRole?: 'user' | 'manager' | 'admin' | 'super_admin';
  organizationId: string;
  lastLoginAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  department?: string;
  managerId?: string;
  permissions: string[];
  region?: string | null;
  country?: string | null;
}

interface UserFormData {
  email: string;
  fullName: string;
  role: string; // dynamic role key from roles API
  isActive: boolean;
  department?: string;
  managerId?: string;
  region?: string | null;
  country?: string | null;
  permissions: string[];
}

interface UserFilters {
  role?: string;
  isActive?: boolean;
  department?: string;
  search?: string;
}

interface UserTableColumn {
  key: keyof User;
  label: string;
  sortable: boolean;
  render?: (value: unknown, user: User) => React.ReactNode;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UserFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.string().min(1, 'Role is required'),
  isActive: z.boolean(),
  department: z.string().optional(),
  managerId: z.string().optional(),
  region: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  permissions: z.array(z.string())
});

// =============================================================================
// USER TABLE COMPONENT
// =============================================================================

function UserTable({ 
  users, 
  onEdit, 
  onDelete, 
  onToggleActive,
  onResetPassword 
}: {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleActive: (user: User) => void;
  onResetPassword: (user: User) => void;
}) {
  const [sortField, setSortField] = useState<keyof User>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const formatDateValue = (value: unknown, fallback = 'Never'): string => {
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) return d.toLocaleDateString();
    }
    return fallback;
  };

  const columns: UserTableColumn[] = [
    {
      key: 'fullName',
      label: 'Name',
      sortable: true,
      render: (value, user) => (
        <div className="flex items-start">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-gray-700">
              {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
            {/* Mobile actions */}
            <div className="mt-2 flex items-center space-x-3 md:hidden">
              <button
                onClick={() => onEdit(user)}
                className="text-blue-600 hover:text-blue-900"
                title="Edit user"
                aria-label="Edit user"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onResetPassword(user)}
                className="text-yellow-600 hover:text-yellow-900"
                title="Reset password"
                aria-label="Reset password"
              >
                <KeyIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onToggleActive(user)}
                className={user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                title={user.isActive ? 'Deactivate user' : 'Activate user'}
                aria-label={user.isActive ? 'Deactivate user' : 'Activate user'}
              >
                {user.isActive ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
              <button
                onClick={() => onDelete(user)}
                className="text-red-600 hover:text-red-900"
                title="Delete user"
                aria-label="Delete user"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value, user) => {
        const v = String(value ?? '');
        return (
        <div className="space-y-1">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            v === 'admin' ? 'bg-red-100 text-red-800' :
            v === 'manager' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {v.replace('_', ' ').toUpperCase()}
          </span>
          {user.enterpriseRole && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.enterpriseRole === 'super_admin' ? 'bg-purple-100 text-purple-800' :
              user.enterpriseRole === 'admin' ? 'bg-red-100 text-red-800' :
              user.enterpriseRole === 'manager' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {user.enterpriseRole.replace('_', ' ').toUpperCase()} (Enterprise)
            </span>
          )}
        </div>
        );
      }
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      render: (value) => (typeof value === 'string' && value.trim() !== '' ? value : '-')
    },
    {
      key: 'region',
      label: 'Region',
      sortable: false,
      render: (_value, user) => user.region || '-'
    },
    {
      key: 'country',
      label: 'Country',
      sortable: false,
      render: (_value, user) => user.country || '-'
    },
    {
      key: 'lastLoginAt',
      label: 'Last Login',
      sortable: true,
      render: (value) => formatDateValue(value, 'Never')
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const active = Boolean(value);
        return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {active ? 'Active' : 'Inactive'}
        </span>
        );
      }
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => formatDateValue(value, '-')
    }
  ];

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getColVisibilityClass = (key: keyof User) => {
    const hideOnSmall: Array<keyof User> = ['department', 'region', 'country', 'createdAt', 'lastLoginAt'];
    return hideOnSmall.includes(key) ? 'hidden md:table-cell' : '';
  };

  return (
    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                } ${getColVisibilityClass(column.key)}`}
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 z-10 bg-gray-50">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedUsers.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column.key} className={`px-6 py-4 whitespace-nowrap ${getColVisibilityClass(column.key)}`}>
                  {column.render 
                    ? column.render(user[column.key], user)
                    : <span>{String(user[column.key])}</span>
                  }
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEdit(user)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit user"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onResetPassword(user)}
                    className="text-yellow-600 hover:text-yellow-900"
                    title="Reset password"
                  >
                    <KeyIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onToggleActive(user)}
                    className={user.isActive 
                      ? "text-red-600 hover:text-red-900" 
                      : "text-green-600 hover:text-green-900"
                    }
                    title={user.isActive ? "Deactivate user" : "Activate user"}
                  >
                    {user.isActive ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => onDelete(user)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete user"
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
// USER FILTERS COMPONENT
// =============================================================================

function UserFilters({ 
  filters, 
  onFiltersChange 
}: {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
}) {
  const [roleOptions, setRoleOptions] = useState<Array<{ value: string; label: string }>>([
    { value: '', label: 'All Roles' }
  ])
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/roles', { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        type RoleRow = { role_key: string; role_name: string }
        const opts = Array.isArray(data.roles)
          ? (data.roles as RoleRow[]).map((r) => ({ value: r.role_key, label: r.role_name }))
          : []
        setRoleOptions([{ value: '', label: 'All Roles' }, ...opts])
      } catch {}
    })()
  }, [])

  const departments = [
    { value: '', label: 'All Departments' },
    { value: 'sales', label: 'Sales' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'support', label: 'Support' },
    { value: 'management', label: 'Management' }
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Search</label>
          <div className="mt-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              placeholder="Search users..."
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select
            value={filters.role || ''}
            onChange={(e) => onFiltersChange({ ...filters, role: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {roleOptions.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <select
            value={filters.department || ''}
            onChange={(e) => onFiltersChange({ ...filters, department: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {departments.map(dept => (
              <option key={dept.value} value={dept.value}>{dept.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={filters.isActive === undefined ? '' : filters.isActive.toString()}
            onChange={(e) => {
              const value = e.target.value === '' ? undefined : e.target.value === 'true';
              onFiltersChange({ ...filters, isActive: value });
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
  );
}

// =============================================================================
// USER FORM COMPONENT
// =============================================================================

function UserForm({ 
  user, 
  onSave, 
  onCancel,
  isOpen 
}: {
  user?: User;
  onSave: (userData: UserFormData) => void;
  onCancel: () => void;
  isOpen: boolean;
}) {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    fullName: '',
    role: 'rep',
    isActive: true,
    department: '',
    managerId: '',
    region: null,
    country: null,
    permissions: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<{ departments: string[]; regions: string[]; countries: string[] }>({ departments: [], regions: [], countries: [] });
  const [_loadingOptions, setLoadingOptions] = useState(false);
  const [roleOptions, setRoleOptions] = useState<Array<{ value: string; label: string }>>([])

  useEffect(() => {
    // Load dropdown options
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const res = await fetch('/api/admin/users/options', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setOptions({
            departments: Array.isArray(data.departments) ? data.departments : [],
            regions: Array.isArray(data.regions) ? data.regions : [],
            countries: Array.isArray(data.countries) ? data.countries : [],
          });
        }
        // Load roles as well
        try {
          const rr = await fetch('/api/admin/roles', { credentials: 'include' })
          if (rr.ok) {
            const payload = await rr.json()
            type RoleRow = { role_key: string; role_name: string }
            const opts = Array.isArray(payload.roles) ? (payload.roles as RoleRow[]).map((r) => ({ value: r.role_key, label: r.role_name })) : []
            setRoleOptions(opts)
          }
        } catch {}
      } finally {
        setLoadingOptions(false);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        department: user.department || '',
        managerId: user.managerId || '',
        region: user.region ?? null,
        country: user.country ?? null,
        permissions: user.permissions
      });
    } else {
      setFormData({
        email: '',
        fullName: '',
        role: 'rep',
        isActive: true,
        department: '',
        managerId: '',
        region: null,
        country: null,
        permissions: []
      });
    }
    setErrors({});
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
  const validatedData = UserFormSchema.parse(formData) as unknown as UserFormData;
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
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {user ? 'Edit User' : 'Create New User'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.email ? 'border-red-300' : ''
                }`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Manager</label>
              <UserSelect
                value={formData.managerId || ''}
                onChange={(v) => setFormData({ ...formData, managerId: v || '' })}
                allowEmpty
                emptyLabel="No manager"
                placeholder="Search users"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.fullName ? 'border-red-300' : ''
                }`}
              />
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {roleOptions.length > 0 ? (
                  roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))
                ) : (
                  <>
                    <option value="rep">Sales Rep</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <select
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value || '' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select department</option>
                {options.departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Region</label>
              <select
                value={formData.region || ''}
                onChange={(e) => setFormData({ ...formData, region: e.target.value || null })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select region</option>
                {options.regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <select
                value={formData.country || ''}
                onChange={(e) => setFormData({ ...formData, country: e.target.value || null })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select country</option>
                {options.countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Active User</label>
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
                {user ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN USER MANAGEMENT COMPONENT
// =============================================================================

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<UserFilters>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<User | undefined>();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search before triggering server request
  const [debouncedSearch, setDebouncedSearch] = useState<string | undefined>(undefined);
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(filters.search || undefined), 300);
    return () => clearTimeout(handle);
  }, [filters.search]);

  useEffect(() => {
    // Reset to first page when search changes
    setPage(0);
  }, [debouncedSearch]);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch]);

  type ApiUserRow = {
    id: string;
    email: string;
    fullName?: string;
    role?: 'rep' | 'manager' | 'admin' | 'super_admin' | string;
    enterpriseRole?: 'user' | 'manager' | 'admin' | 'super_admin';
    organizationId: string;
    lastLoginAt?: string | null;
    isActive?: boolean;
    createdAt: string;
    updatedAt: string;
    department?: string | null;
    managerId?: string | null;
    region?: string | null;
    country?: string | null;
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const limit = pageSize; // we now rely on totalCount for pagination
      const offset = page * pageSize;
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('offset', String(offset));
  if (debouncedSearch) params.set('search', debouncedSearch);
  params.set('includeRegions', 'true');
  if (filters.role) params.set('role', filters.role);
  if (filters.department) params.set('department', filters.department);
    if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to load users');
      }

  const data: { users?: ApiUserRow[]; totalCount?: number } = await response.json();

      // Transform API data to match our User interface
  const rawUsers: ApiUserRow[] = Array.isArray(data.users) ? data.users : [];
    setTotalCount(typeof data.totalCount === 'number' ? data.totalCount : undefined);
    const total = typeof data.totalCount === 'number' ? data.totalCount : undefined;
    const nextPageExists = typeof total === 'number' ? (offset + rawUsers.length) < total : rawUsers.length === pageSize;
    setHasNextPage(nextPageExists);
    const pageUsers = rawUsers;

  const transformedUsers: User[] = pageUsers.map((u: ApiUserRow) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName || '',
        role: (u.role as User['role']) || 'rep',
        enterpriseRole: u.enterpriseRole,
        organizationId: u.organizationId,
        lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : undefined,
        isActive: u.isActive !== false,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
        department: u.department ?? undefined,
        managerId: (u.managerId ?? undefined) || undefined,
        region: u.region ?? null,
        country: u.country ?? null,
        permissions: [] // We'll handle permissions later with RBAC
      }));
      
      setUsers(transformedUsers);
      console.log(`✅ Loaded ${transformedUsers.length} users from database`);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      alert(`Error loading users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users; // All filtering is now server-side (search/role/department/isActive)

  const handleCreateUser = () => {
    setEditingUser(undefined);
    setShowForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleSaveUser = async (userData: UserFormData) => {
    try {
      // Normalize optional fields: treat empty strings as null
      type ApiUserFormData = Omit<UserFormData, 'managerId' | 'region' | 'country'> & {
        managerId?: string | null;
        region?: string | null;
        country?: string | null;
      }
      const toNull = (v: string | null | undefined): string | null | undefined =>
        typeof v === 'string' && v.trim() === '' ? null : v
      const sanitized: ApiUserFormData = {
        ...userData,
        managerId: toNull(userData.managerId),
        region: toNull(userData.region ?? undefined) ?? null,
        country: toNull(userData.country ?? undefined) ?? null,
      }
      if (editingUser) {
        // Update existing user
        console.log('📤 Sending update request:', sanitized);
        
        const response = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(sanitized)
        });

        console.log('📥 Update response status:', response.status);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
            console.error('❌ Error response:', errorData);
          } catch (_err) {
            // Response might not be JSON
            const text = await response.text();
            console.error('❌ Non-JSON error response:', text);
            throw new Error(`Failed to update user: ${response.statusText} - ${text}`);
          }
          throw new Error((errorData && (errorData.details || errorData.error)) || 'Failed to update user');
        }

        console.log('✅ User updated successfully');
        await loadUsers(); // Reload users to get updated data
      } else {
        // Create new user
        console.log('📤 Sending create request:', sanitized);
        
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(sanitized)
        });

        console.log('📥 Create response status:', response.status);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
            console.error('❌ Error response:', errorData);
          } catch (_err) {
            // Response might not be JSON
            const text = await response.text();
            console.error('❌ Non-JSON error response:', text);
            throw new Error(`Failed to create user: ${response.statusText} - ${text}`);
          }
          throw new Error((errorData && (errorData.details || errorData.error)) || 'Failed to create user');
        }

        console.log('✅ User created successfully');
        await loadUsers(); // Reload users to get new user
      }
      
      setShowForm(false);
      setEditingUser(undefined);
    } catch (error) {
      console.error('❌ Error saving user:', error);
      alert(`Error saving user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to delete user');
      }

      console.log('✅ User deleted successfully');
      await loadUsers(); // Reload users to reflect deletion
      setShowDeleteConfirm(undefined);
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      alert(`Error deleting user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const newStatus = !user.isActive;
      
      const response = await fetch(`/api/admin/users/${user.id}/toggle-active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to toggle user status');
      }

      console.log(`✅ User status toggled to ${newStatus ? 'active' : 'inactive'}`);
      await loadUsers(); // Reload users to reflect status change
    } catch (error) {
      console.error('❌ Error toggling user status:', error);
      alert(`Error toggling user status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleResetPassword = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        let msg = 'Failed to reset password';
        try {
          const errorData = await response.json();
          if (errorData && (errorData.details || errorData.error)) {
            msg = errorData.details || errorData.error;
          }
        } catch {
          // non-JSON response
          const text = await response.text();
          if (text && text.length < 500) msg = text;
        }
        throw new Error(msg);
      }

      const data = await response.json();
      console.log('✅ Password reset email sent');
      alert(data.message || `Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error('❌ Error resetting password:', error);
      alert(`Error resetting password: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage users, roles, and permissions
          </p>
        </div>
        <button
          onClick={handleCreateUser}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <UserPlusIcon className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{typeof totalCount === 'number' ? totalCount : users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => u.isActive).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Admins</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Recent Logins</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => u.lastLoginAt && new Date(u.lastLoginAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <UserFilters 
        filters={filters} 
        onFiltersChange={(f) => {
          setFilters(f);
          // When changing filters, keep server-side search but reset to first page
          setPage(0);
        }} 
      />

      {/* User Table */}
      <UserTable
        users={filteredUsers}
        onEdit={handleEditUser}
        onDelete={(user) => setShowDeleteConfirm(user)}
        onToggleActive={handleToggleActive}
        onResetPassword={handleResetPassword}
      />

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Page {page + 1}
          {typeof totalCount === 'number' && totalCount >= 0 && (
            <span className="ml-2 text-gray-500">of {Math.max(1, Math.ceil(totalCount / pageSize))}</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="px-3 py-1 text-sm rounded border disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            aria-label="Previous page"
          >
            Prev
          </button>
          <button
            className="px-3 py-1 text-sm rounded border disabled:opacity-50"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNextPage || loading}
            aria-label="Next page"
          >
            Next
          </button>
          <select
            className="ml-3 px-2 py-1 text-sm border rounded"
            value={pageSize}
            onChange={(e) => {
              const next = Number(e.target.value) || 20;
              setPageSize(next);
              setPage(0);
            }}
            aria-label="Rows per page"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
        </div>
      </div>

      {/* User Form Modal */}
      <UserForm
        user={editingUser}
        onSave={handleSaveUser}
        onCancel={() => {
          setShowForm(false);
          setEditingUser(undefined);
        }}
        isOpen={showForm}
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
                <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete <strong>{showDeleteConfirm.fullName}</strong>? 
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
                  onClick={() => handleDeleteUser(showDeleteConfirm)}
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
