// Administration Module - Enhanced Audit Log Viewer
// Comprehensive audit log viewer with filtering, search, and analysis

'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardDocumentListIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ArrowsUpDownIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  moduleName: string;
  organizationId: string;
  sessionId?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

interface AuditLogFilters {
  userId?: string;
  action?: string;
  resourceType?: string;
  riskLevel?: string;
  moduleName?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

interface AuditLogStats {
  totalEntries: number;
  entriesToday: number;
  entriesThisWeek: number;
  entriesThisMonth: number;
  highRiskEntries: number;
  criticalRiskEntries: number;
  uniqueUsers: number;
  uniqueActions: number;
}

// =============================================================================
// AUDIT LOG STATS COMPONENT
// =============================================================================

function AuditLogStats({ stats }: { stats: AuditLogStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Total Entries</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalEntries.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <CalendarIcon className="h-8 w-8 text-green-600" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Today</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.entriesToday}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">High Risk</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.highRiskEntries}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <InformationCircleIcon className="h-8 w-8 text-red-600" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Critical Risk</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.criticalRiskEntries}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// AUDIT LOG FILTERS COMPONENT
// =============================================================================

function AuditLogFilters({ 
  filters, 
  onFiltersChange 
}: {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
}) {
  const actions = [
    { value: '', label: 'All Actions' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'view', label: 'View' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'export', label: 'Export' },
    { value: 'import', label: 'Import' },
    { value: 'configure', label: 'Configure' }
  ];

  const resourceTypes = [
    { value: '', label: 'All Resources' },
    { value: 'user', label: 'User' },
    { value: 'role', label: 'Role' },
    { value: 'configuration', label: 'Configuration' },
    { value: 'organization', label: 'Organization' },
    { value: 'module', label: 'Module' },
    { value: 'permission', label: 'Permission' },
    { value: 'audit_log', label: 'Audit Log' }
  ];

  const riskLevels = [
    { value: '', label: 'All Risk Levels' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  const modules = [
    { value: '', label: 'All Modules' },
    { value: 'admin', label: 'Administration' },
    { value: 'crm', label: 'CRM' },
    { value: 'sales_performance', label: 'Sales Performance' },
    { value: 'kpi', label: 'KPI' },
    { value: 'learning', label: 'Learning' },
    { value: 'integrations', label: 'Integrations' }
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
              placeholder="Search logs..."
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Action</label>
          <select
            value={filters.action || ''}
            onChange={(e) => onFiltersChange({ ...filters, action: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {actions.map(action => (
              <option key={action.value} value={action.value}>{action.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Resource Type</label>
          <select
            value={filters.resourceType || ''}
            onChange={(e) => onFiltersChange({ ...filters, resourceType: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {resourceTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Risk Level</label>
          <select
            value={filters.riskLevel || ''}
            onChange={(e) => onFiltersChange({ ...filters, riskLevel: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {riskLevels.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
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
          <label className="block text-sm font-medium text-gray-700">Date Range</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || undefined })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// AUDIT LOG DETAILS COMPONENT
// =============================================================================

function AuditLogDetails({ 
  entry, 
  isOpen, 
  onClose 
}: {
  entry: AuditLogEntry;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'view': return '👁️';
      case 'login': return '🔐';
      case 'logout': return '🚪';
      case 'export': return '📤';
      case 'import': return '📥';
      case 'configure': return '⚙️';
      default: return '📝';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Audit Log Details
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Action:</span> 
                  <span className="ml-2">{getActionIcon(entry.action)} {entry.action}</span>
                </div>
                <div>
                  <span className="font-medium">Resource:</span> 
                  <span className="ml-2">{entry.resourceType} {entry.resourceId ? `(${entry.resourceId})` : ''}</span>
                </div>
                <div>
                  <span className="font-medium">Risk Level:</span> 
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(entry.riskLevel)}`}>
                    {entry.riskLevel}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Module:</span> 
                  <span className="ml-2">{entry.moduleName}</span>
                </div>
                <div>
                  <span className="font-medium">Timestamp:</span> 
                  <span className="ml-2">{entry.timestamp.toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-medium">Session ID:</span> 
                  <span className="ml-2 font-mono text-xs">{entry.sessionId || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-3">User Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> 
                  <span className="ml-2">{entry.userName}</span>
                </div>
                <div>
                  <span className="font-medium">Email:</span> 
                  <span className="ml-2">{entry.userEmail}</span>
                </div>
                <div>
                  <span className="font-medium">User ID:</span> 
                  <span className="ml-2 font-mono text-xs">{entry.userId}</span>
                </div>
              </div>
            </div>

            {/* Technical Information */}
            <div className="bg-yellow-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Technical Information</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">IP Address:</span> 
                  <span className="ml-2 font-mono">{entry.ipAddress}</span>
                </div>
                <div>
                  <span className="font-medium">User Agent:</span> 
                  <span className="ml-2 text-xs break-all">{entry.userAgent}</span>
                </div>
              </div>
            </div>

            {/* Changes */}
            {entry.changes && entry.changes.length > 0 && (
              <div className="bg-green-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Changes Made</h4>
                <div className="space-y-2">
                  {entry.changes.map((change, index) => (
                    <div key={index} className="text-sm border-l-4 border-green-400 pl-3">
                      <div className="font-medium">{change.field}</div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <span className="text-red-600">Old:</span> 
                          <span className="ml-1 font-mono text-xs">{JSON.stringify(change.oldValue)}</span>
                        </div>
                        <div>
                          <span className="text-green-600">New:</span> 
                          <span className="ml-1 font-mono text-xs">{JSON.stringify(change.newValue)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Details */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Additional Details</h4>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(entry.details, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// AUDIT LOG TABLE COMPONENT
// =============================================================================

function AuditLogTable({ 
  entries, 
  onViewDetails 
}: {
  entries: AuditLogEntry[];
  onViewDetails: (entry: AuditLogEntry) => void;
}) {
  const [sortField, setSortField] = useState<keyof AuditLogEntry>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleSort = (field: keyof AuditLogEntry) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleRowExpansion = (entryId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedRows(newExpanded);
  };

  const sortedEntries = [...entries].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'view': return '👁️';
      case 'login': return '🔐';
      case 'logout': return '🚪';
      case 'export': return '📤';
      case 'import': return '📥';
      case 'configure': return '⚙️';
      default: return '📝';
    }
  };

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('timestamp')}
            >
              <div className="flex items-center space-x-1">
                <span>Timestamp</span>
                <ArrowsUpDownIcon className="h-4 w-4" />
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('userName')}
            >
              <div className="flex items-center space-x-1">
                <span>User</span>
                <ArrowsUpDownIcon className="h-4 w-4" />
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('resourceType')}
            >
              <div className="flex items-center space-x-1">
                <span>Resource</span>
                <ArrowsUpDownIcon className="h-4 w-4" />
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('riskLevel')}
            >
              <div className="flex items-center space-x-1">
                <span>Risk</span>
                <ArrowsUpDownIcon className="h-4 w-4" />
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('moduleName')}
            >
              <div className="flex items-center space-x-1">
                <span>Module</span>
                <ArrowsUpDownIcon className="h-4 w-4" />
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedEntries.map((entry) => (
            <React.Fragment key={entry.id}>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{getActionIcon(entry.action)}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {entry.action}
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.resourceName || entry.resourceType}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div>{entry.timestamp.toLocaleDateString()}</div>
                    <div className="text-gray-500">{entry.timestamp.toLocaleTimeString()}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.userName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.userEmail}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div>{entry.resourceType}</div>
                    {entry.resourceId && (
                      <div className="text-gray-500 font-mono text-xs">
                        {entry.resourceId}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(entry.riskLevel)}`}>
                    {entry.riskLevel}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.moduleName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewDetails(entry)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleRowExpansion(entry.id)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Expand row"
                    >
                      {expandedRows.has(entry.id) ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
              {expandedRows.has(entry.id) && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 bg-gray-50">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">IP Address:</span> 
                        <span className="ml-2 font-mono">{entry.ipAddress}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Session ID:</span> 
                        <span className="ml-2 font-mono text-xs">{entry.sessionId || 'N/A'}</span>
                      </div>
                      {entry.changes && entry.changes.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Changes:</span>
                          <div className="mt-1 space-y-1">
                            {entry.changes.map((change, index) => (
                              <div key={index} className="text-xs bg-white p-2 rounded border">
                                <span className="font-medium">{change.field}:</span>
                                <span className="text-red-600 ml-1">{JSON.stringify(change.oldValue)}</span>
                                <span className="mx-1">→</span>
                                <span className="text-green-600">{JSON.stringify(change.newValue)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// MAIN AUDIT LOG VIEWER COMPONENT
// =============================================================================

export default function AuditLogViewer() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<AuditLogEntry[]>([]);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [stats, setStats] = useState<AuditLogStats>({
    totalEntries: 0,
    entriesToday: 0,
    entriesThisWeek: 0,
    entriesThisMonth: 0,
    highRiskEntries: 0,
    criticalRiskEntries: 0,
    uniqueUsers: 0,
    uniqueActions: 0
  });
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState<AuditLogEntry | undefined>();

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    filterEntries();
    calculateStats();
  }, [entries, filters]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      
      // Mock audit log data - in real implementation, this would fetch from API
      const mockEntries: AuditLogEntry[] = [
        {
          id: '1',
          userId: 'user-1',
          userEmail: 'admin@acme.com',
          userName: 'John Doe',
          action: 'create',
          resourceType: 'user',
          resourceId: 'user-123',
          resourceName: 'Jane Smith',
          details: { department: 'Sales', role: 'manager' },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: new Date('2024-10-01T10:30:00Z'),
          riskLevel: 'medium',
          moduleName: 'admin',
          organizationId: 'org-1',
          sessionId: 'sess-abc123',
          changes: []
        },
        {
          id: '2',
          userId: 'user-2',
          userEmail: 'manager@acme.com',
          userName: 'Jane Smith',
          action: 'update',
          resourceType: 'configuration',
          resourceId: 'config-456',
          resourceName: 'Lead Scoring Rules',
          details: { module: 'crm', category: 'scoring' },
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          timestamp: new Date('2024-10-01T09:15:00Z'),
          riskLevel: 'high',
          moduleName: 'crm',
          organizationId: 'org-1',
          sessionId: 'sess-def456',
          changes: [
            { field: 'email_score', oldValue: 5, newValue: 10 },
            { field: 'phone_score', oldValue: 10, newValue: 15 }
          ]
        },
        {
          id: '3',
          userId: 'user-1',
          userEmail: 'admin@acme.com',
          userName: 'John Doe',
          action: 'delete',
          resourceType: 'role',
          resourceId: 'role-789',
          resourceName: 'Custom Role',
          details: { permissions: ['view', 'edit'] },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: new Date('2024-09-30T16:45:00Z'),
          riskLevel: 'critical',
          moduleName: 'admin',
          organizationId: 'org-1',
          sessionId: 'sess-ghi789',
          changes: []
        },
        {
          id: '4',
          userId: 'user-3',
          userEmail: 'rep@acme.com',
          userName: 'Bob Wilson',
          action: 'login',
          resourceType: 'session',
          details: { method: 'password', mfa: false },
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
          timestamp: new Date('2024-10-01T08:00:00Z'),
          riskLevel: 'low',
          moduleName: 'admin',
          organizationId: 'org-1',
          sessionId: 'sess-jkl012',
          changes: []
        },
        {
          id: '5',
          userId: 'user-2',
          userEmail: 'manager@acme.com',
          userName: 'Jane Smith',
          action: 'export',
          resourceType: 'audit_log',
          details: { format: 'csv', dateRange: '2024-09-01 to 2024-09-30' },
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          timestamp: new Date('2024-09-30T14:20:00Z'),
          riskLevel: 'high',
          moduleName: 'admin',
          organizationId: 'org-1',
          sessionId: 'sess-mno345',
          changes: []
        }
      ];
      
      setEntries(mockEntries);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = [...entries];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.action.toLowerCase().includes(searchLower) ||
        entry.userName.toLowerCase().includes(searchLower) ||
        entry.userEmail.toLowerCase().includes(searchLower) ||
        entry.resourceType.toLowerCase().includes(searchLower) ||
        entry.resourceName?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.action) {
      filtered = filtered.filter(entry => entry.action === filters.action);
    }

    if (filters.resourceType) {
      filtered = filtered.filter(entry => entry.resourceType === filters.resourceType);
    }

    if (filters.riskLevel) {
      filtered = filtered.filter(entry => entry.riskLevel === filters.riskLevel);
    }

    if (filters.moduleName) {
      filtered = filtered.filter(entry => entry.moduleName === filters.moduleName);
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(entry => entry.timestamp >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(entry => entry.timestamp <= toDate);
    }

    setFilteredEntries(filtered);
  };

  const calculateStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newStats: AuditLogStats = {
      totalEntries: entries.length,
      entriesToday: entries.filter(e => e.timestamp >= today).length,
      entriesThisWeek: entries.filter(e => e.timestamp >= weekAgo).length,
      entriesThisMonth: entries.filter(e => e.timestamp >= monthAgo).length,
      highRiskEntries: entries.filter(e => e.riskLevel === 'high').length,
      criticalRiskEntries: entries.filter(e => e.riskLevel === 'critical').length,
      uniqueUsers: new Set(entries.map(e => e.userId)).size,
      uniqueActions: new Set(entries.map(e => e.action)).size
    };

    setStats(newStats);
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log Viewer</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor and analyze system activity and security events
        </p>
      </div>

      {/* Stats */}
      <AuditLogStats stats={stats} />

      {/* Filters */}
      <AuditLogFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
      />

      {/* Audit Log Table */}
      <AuditLogTable
        entries={filteredEntries}
        onViewDetails={setShowDetails}
      />

      {/* Details Modal */}
      <AuditLogDetails
        entry={showDetails!}
        isOpen={!!showDetails}
        onClose={() => setShowDetails(undefined)}
      />
    </div>
  );
}
