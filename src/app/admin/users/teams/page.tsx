// Administration Module - Team Hierarchy Management
// Comprehensive team hierarchy management with organizational structure

'use client';

import React, { useState, useEffect } from 'react';
import { ;
  UsersIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ArrowDownIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client';
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface TeamMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  department: string;
  managerId?: string;
  directReports: string[];
  isActive: boolean;
  hireDate: Date;
  position: string;
  level: number;
  avatar?: string;
}

interface TeamHierarchy {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  children: TeamHierarchy[];
  members: TeamMember[];
  managerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TeamFormData {
  name: string;
  description?: string;
  parentId?: string;
  managerId?: string;
}

interface TeamFilters {
  department?: string;
  role?: string;
  isActive?: boolean;
  search?: string;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const TeamFormSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional()
});

// =============================================================================
// TEAM HIERARCHY TREE COMPONENT
// =============================================================================

function TeamHierarchyTree({ 
  hierarchy, 
  onEditTeam, 
  onDeleteTeam, 
  onViewMembers,
  onEditMember,
  onMoveMember 
}: {
  hierarchy: TeamHierarchy[];
  onEditTeam: (team: TeamHierarchy) => void;
  onDeleteTeam: (team: TeamHierarchy) => void;
  onViewMembers: (team: TeamHierarchy) => void;
  onEditMember: (member: TeamMember) => void;
  onMoveMember: (member: TeamMember) => void;
}) {
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  const toggleTeamExpansion = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const renderTeam = (team: TeamHierarchy, level: number = 0) => {
    const isExpanded = expandedTeams.has(team.id);
    const hasChildren = team.children.length > 0;
    const hasMembers = team.members.length > 0;

    return (
      <div key={team.id} className="ml-4">
        <div className={`flex items-center p-3 rounded-lg border ${
          level === 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center flex-1">
            {hasChildren && (
              <button
                onClick={() => toggleTeamExpansion(team.id)}
                className="mr-2 p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>
            )}
            
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <div className="font-medium text-gray-900">{team.name}</div>
                {team.description && (
                  <div className="text-sm text-gray-500">{team.description}</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {team.members.length} member{team.members.length !== 1 ? 's' : ''}
            </span>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onViewMembers(team)}
                className="p-1 text-blue-600 hover:text-blue-800"
                title="View members"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEditTeam(team)}
                className="p-1 text-green-600 hover:text-green-800"
                title="Edit team"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDeleteTeam(team)}
                className="p-1 text-red-600 hover:text-red-800"
                title="Delete team"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="ml-6 mt-2 space-y-2">
            {/* Team Members */}
            {hasMembers && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-700 mb-2">Team Members:</div>
                {team.members.map(member => (
                  <div key={member.id} className="flex items-center p-2 bg-white rounded border">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-gray-700">
                        {member.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{member.userName}</div>
                      <div className="text-xs text-gray-500">{member.position} • {member.role}</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEditMember(member)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Edit member"
                      >
                        <PencilIcon className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onMoveMember(member)}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Move member"
                      >
                        <ArrowRightIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Child Teams */}
            {team.children.map(childTeam => renderTeam(childTeam, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {hierarchy.map(team => renderTeam(team))}
    </div>
  );
}

// =============================================================================
// TEAM MEMBERS TABLE COMPONENT
// =============================================================================

function TeamMembersTable({ 
  members, 
  onEdit, 
  onMove, 
  onToggleActive 
}: {
  members: TeamMember[];
  onEdit: (member: TeamMember) => void;
  onMove: (member: TeamMember) => void;
  onToggleActive: (member: TeamMember) => void;
}) {
  const [sortField, setSortField] = useState<keyof TeamMember>('userName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof TeamMember) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
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
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('userName')}
            >
              <div className="flex items-center space-x-1">
                <span>Name</span>
                <ArrowsUpDownIcon className="h-4 w-4" />
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('position')}
            >
              <div className="flex items-center space-x-1">
                <span>Position</span>
                <ArrowsUpDownIcon className="h-4 w-4" />
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('department')}
            >
              <div className="flex items-center space-x-1">
                <span>Department</span>
                <ArrowsUpDownIcon className="h-4 w-4" />
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('role')}
            >
              <div className="flex items-center space-x-1">
                <span>Role</span>
                <ArrowsUpDownIcon className="h-4 w-4" />
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('level')}
            >
              <div className="flex items-center space-x-1">
                <span>Level</span>
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
          {sortedMembers.map((member) => (
            <tr key={member.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {member.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{member.userName}</div>
                    <div className="text-sm text-gray-500">{member.userEmail}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {member.position}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {member.department}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  member.role === 'admin' ? 'bg-red-100 text-red-800' :
                  member.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {member.role}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                Level {member.level}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  member.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEdit(member)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit member"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onMove(member)}
                    className="text-green-600 hover:text-green-900"
                    title="Move member"
                  >
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onToggleActive(member)}
                    className={member.isActive 
                      ? "text-red-600 hover:text-red-900" 
                      : "text-green-600 hover:text-green-900"
                    }
                    title={member.isActive ? "Deactivate member" : "Activate member"}
                  >
                    {member.isActive ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
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
// TEAM FILTERS COMPONENT
// =============================================================================

function TeamFilters({ 
  filters, 
  onFiltersChange 
}: {
  filters: TeamFilters;
  onFiltersChange: (filters: TeamFilters) => void;
}) {
  const departments = [
    { value: '', label: 'All Departments' },
    { value: 'sales', label: 'Sales' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'support', label: 'Support' },
    { value: 'management', label: 'Management' },
    { value: 'engineering', label: 'Engineering' }
  ];

  const roles = [
    { value: '', label: 'All Roles' },
    { value: 'rep', label: 'Sales Rep' },
    { value: 'manager', label: 'Manager' },
    { value: 'admin', label: 'Admin' },
    { value: 'super_admin', label: 'Super Admin' }
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
              placeholder="Search team members..."
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
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
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select
            value={filters.role || ''}
            onChange={(e) => onFiltersChange({ ...filters, role: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {roles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
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
// TEAM FORM COMPONENT
// =============================================================================

function TeamForm({ 
  team, 
  teams,
  onSave, 
  onCancel,
  isOpen 
}: {
  team?: TeamHierarchy;
  teams: TeamHierarchy[];
  onSave: (teamData: TeamFormData) => void;
  onCancel: () => void;
  isOpen: boolean;
}) {
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
    parentId: '',
    managerId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description || '',
        parentId: team.parentId || '',
        managerId: team.managerId || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        parentId: '',
        managerId: ''
      });
    }
    setErrors({});
  }, [team]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = TeamFormSchema.parse(formData);
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
            {team ? 'Edit Team' : 'Create New Team'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Team Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.name ? 'border-red-300' : ''
                }`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Parent Team</label>
              <select
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">No parent team</option>
                {teams.filter(t => t.id !== team?.id).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Team Manager</label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">No manager assigned</option>
                {/* In real implementation, this would be populated with users */}
                <option value="user-1">John Doe</option>
                <option value="user-2">Jane Smith</option>
              </select>
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
                {team ? 'Update Team' : 'Create Team'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN TEAM HIERARCHY COMPONENT
// =============================================================================

export default function TeamHierarchyManagement() {
  const [hierarchy, setHierarchy] = useState<TeamHierarchy[]>([]);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [filters, setFilters] = useState<TeamFilters>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamHierarchy | undefined>();
  const [showMembers, setShowMembers] = useState<TeamHierarchy | undefined>();
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'members'>('hierarchy');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [allMembers, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock team hierarchy data
      const mockHierarchy: TeamHierarchy[] = [
        {
          id: 'team-1',
          name: 'Sales Department',
          description: 'Main sales organization',
          children: [
            {
              id: 'team-2',
              name: 'Enterprise Sales',
              description: 'Large enterprise accounts',
              parentId: 'team-1',
              children: [],
              members: [],
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'team-3',
              name: 'SMB Sales',
              description: 'Small and medium business accounts',
              parentId: 'team-1',
              children: [],
              members: [],
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          members: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'team-4',
          name: 'Marketing Department',
          description: 'Marketing and lead generation',
          children: [],
          members: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockMembers: TeamMember[] = [
        {
          id: 'member-1',
          userId: 'user-1',
          userName: 'John Doe',
          userEmail: 'john.doe@acme.com',
          role: 'manager',
          department: 'sales',
          managerId: undefined,
          directReports: ['member-2', 'member-3'],
          isActive: true,
          hireDate: new Date('2023-01-15'),
          position: 'Sales Director',
          level: 1
        },
        {
          id: 'member-2',
          userId: 'user-2',
          userName: 'Jane Smith',
          userEmail: 'jane.smith@acme.com',
          role: 'manager',
          department: 'sales',
          managerId: 'member-1',
          directReports: ['member-4'],
          isActive: true,
          hireDate: new Date('2023-03-20'),
          position: 'Enterprise Sales Manager',
          level: 2
        },
        {
          id: 'member-3',
          userId: 'user-3',
          userName: 'Bob Wilson',
          userEmail: 'bob.wilson@acme.com',
          role: 'manager',
          department: 'sales',
          managerId: 'member-1',
          directReports: ['member-5'],
          isActive: true,
          hireDate: new Date('2023-04-10'),
          position: 'SMB Sales Manager',
          level: 2
        },
        {
          id: 'member-4',
          userId: 'user-4',
          userName: 'Alice Johnson',
          userEmail: 'alice.johnson@acme.com',
          role: 'rep',
          department: 'sales',
          managerId: 'member-2',
          directReports: [],
          isActive: true,
          hireDate: new Date('2023-06-01'),
          position: 'Enterprise Sales Rep',
          level: 3
        },
        {
          id: 'member-5',
          userId: 'user-5',
          userName: 'Charlie Brown',
          userEmail: 'charlie.brown@acme.com',
          role: 'rep',
          department: 'sales',
          managerId: 'member-3',
          directReports: [],
          isActive: false,
          hireDate: new Date('2023-07-15'),
          position: 'SMB Sales Rep',
          level: 3
        }
      ];

      setHierarchy(mockHierarchy);
      setAllMembers(mockMembers);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = [...allMembers];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(member => 
        member.userName.toLowerCase().includes(searchLower) ||
        member.userEmail.toLowerCase().includes(searchLower) ||
        member.position.toLowerCase().includes(searchLower)
      );
    }

    if (filters.department) {
      filtered = filtered.filter(member => member.department === filters.department);
    }

    if (filters.role) {
      filtered = filtered.filter(member => member.role === filters.role);
    }

    if (filters.isActive !== undefined) {
      filtered = filtered.filter(member => member.isActive === filters.isActive);
    }

    setFilteredMembers(filtered);
  };

  const handleCreateTeam = () => {
    setEditingTeam(undefined);
    setShowForm(true);
  };

  const handleEditTeam = (team: TeamHierarchy) => {
    setEditingTeam(team);
    setShowForm(true);
  };

  const handleSaveTeam = async (teamData: TeamFormData) => {
    try {
      if (editingTeam) {
        // Update existing team
        const updatedHierarchy = hierarchy.map(team => 
          team.id === editingTeam.id 
            ? { ...team, ...teamData, updatedAt: new Date() }
            : team
        );
        setHierarchy(updatedHierarchy);
      } else {
        // Create new team
        const newTeam: TeamHierarchy = {
          id: Date.now().toString(),
          ...teamData,
          children: [],
          members: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setHierarchy([...hierarchy, newTeam]);
      }
      
      setShowForm(false);
      setEditingTeam(undefined);
    } catch (error) {
      console.error('Error saving team:', error);
    }
  };

  const handleDeleteTeam = async (team: TeamHierarchy) => {
    try {
      setHierarchy(hierarchy.filter(t => t.id !== team.id));
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const handleViewMembers = (team: TeamHierarchy) => {
    setShowMembers(team);
    setActiveTab('members');
  };

  const handleEditMember = (member: TeamMember) => {
    // In real implementation, this would open a member edit form
    console.log('Edit member:', member);
  };

  const handleMoveMember = (member: TeamMember) => {
    // In real implementation, this would open a team selection dialog
    console.log('Move member:', member);
  };

  const handleToggleActive = async (member: TeamMember) => {
    try {
      const updatedMembers = allMembers.map(m => 
        m.id === member.id 
          ? { ...m, isActive: !m.isActive }
          : m
      );
      setAllMembers(updatedMembers);
    } catch (error) {
      console.error('Error toggling member status:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Team Hierarchy Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage organizational structure and team members
          </p>
        </div>
        <button
          onClick={handleCreateTeam}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Team
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Teams</p>
              <p className="text-2xl font-semibold text-gray-900">{hierarchy.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Members</p>
              <p className="text-2xl font-semibold text-gray-900">{allMembers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Members</p>
              <p className="text-2xl font-semibold text-gray-900">
                {allMembers.filter(m => m.isActive).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg. Team Size</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(allMembers.length / hierarchy.length)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'hierarchy'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Team Hierarchy
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'members'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Members
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'hierarchy' ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <TeamHierarchyTree
            hierarchy={hierarchy}
            onEditTeam={handleEditTeam}
            onDeleteTeam={handleDeleteTeam}
            onViewMembers={handleViewMembers}
            onEditMember={handleEditMember}
            onMoveMember={handleMoveMember}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <TeamFilters 
            filters={filters} 
            onFiltersChange={setFilters} 
          />
          
          <TeamMembersTable
            members={filteredMembers}
            onEdit={handleEditMember}
            onMove={handleMoveMember}
            onToggleActive={handleToggleActive}
          />
        </div>
      )}

      {/* Team Form Modal */}
      <TeamForm
        team={editingTeam}
        teams={hierarchy}
        onSave={handleSaveTeam}
        onCancel={() => {
          setShowForm(false);
          setEditingTeam(undefined);
        }}
        isOpen={showForm}
      />
    </div>
  );
}
