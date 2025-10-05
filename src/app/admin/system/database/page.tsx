// Administration Module - Database Management Interface
// Comprehensive database administration and management

'use client';

import React, { useState, useEffect } from 'react';
import { 
  CircleStackIcon, 
  ServerIcon, 
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
  ChartBarIcon,
  CogIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client';
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface DatabaseConfiguration {
  connections: DatabaseConnection[];
  schemas: DatabaseSchema[];
  tables: DatabaseTable[];
  indexes: DatabaseIndex[];
  queries: SavedQuery[];
  migrations: DatabaseMigration[];
}

interface DatabaseConnection {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'redis';
  host: string;
  port: number;
  database: string;
  username: string;
  status: 'connected' | 'disconnected' | 'error';
  lastConnected?: Date;
  errorMessage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DatabaseSchema {
  id: string;
  name: string;
  connectionId: string;
  description?: string;
  tables: string[];
  views: string[];
  functions: string[];
  procedures: string[];
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

interface DatabaseTable {
  id: string;
  name: string;
  schemaId: string;
  connectionId: string;
  columns: TableColumn[];
  indexes: string[];
  constraints: TableConstraint[];
  rowCount: number;
  size: number;
  lastModified: Date;
  createdAt: Date;
}

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignKeyTable?: string;
  foreignKeyColumn?: string;
}

interface TableConstraint {
  name: string;
  type: 'primary_key' | 'foreign_key' | 'unique' | 'check';
  columns: string[];
  definition?: string;
}

interface DatabaseIndex {
  id: string;
  name: string;
  tableId: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist' | 'spgist';
  unique: boolean;
  size: number;
  usage: IndexUsage;
  createdAt: Date;
}

interface IndexUsage {
  scans: number;
  tuplesRead: number;
  tuplesFetched: number;
  lastUsed?: Date;
}

interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  sql: string;
  connectionId: string;
  schemaId?: string;
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DatabaseMigration {
  id: string;
  name: string;
  version: string;
  description?: string;
  sql: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  executedAt?: Date;
  rollbackSql?: string;
  errorMessage?: string;
  createdAt: Date;
}

interface DatabasePerformance {
  connectionId: string;
  activeConnections: number;
  maxConnections: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  queryCount: number;
  averageQueryTime: number;
  slowQueries: number;
  locks: number;
  deadlocks: number;
  timestamp: Date;
}

interface DatabaseBackup {
  id: string;
  name: string;
  connectionId: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'pending' | 'running' | 'completed' | 'failed';
  size?: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  retentionDays: number;
  location: string;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const DatabaseConnectionSchema = z.object({
  name: z.string().min(1, 'Connection name is required'),
  type: z.enum(['postgresql', 'mysql', 'sqlite', 'mongodb', 'redis']),
  host: z.string().min(1, 'Host is required'),
  port: z.number().min(1).max(65535, 'Port must be between 1-65535'),
  database: z.string().min(1, 'Database name is required'),
  username: z.string().min(1, 'Username is required')
});

const SavedQuerySchema = z.object({
  name: z.string().min(1, 'Query name is required'),
  description: z.string().optional(),
  sql: z.string().min(1, 'SQL query is required'),
  connectionId: z.string().min(1, 'Connection is required'),
  isPublic: z.boolean()
});

// =============================================================================
// DATABASE CONNECTIONS COMPONENT
// =============================================================================

function DatabaseConnections({ config, onUpdate }: { config: DatabaseConfiguration; onUpdate: (config: DatabaseConfiguration) => void }) {
  const [connections, setConnections] = useState<DatabaseConnection[]>(config.connections);
  const [showForm, setShowForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState<DatabaseConnection | undefined>();

  const dbTypes = [
    { value: 'postgresql', label: 'PostgreSQL', icon: CircleStackIcon, color: 'bg-blue-100 text-blue-800' },
    { value: 'mysql', label: 'MySQL', icon: CircleStackIcon, color: 'bg-orange-100 text-orange-800' },
    { value: 'sqlite', label: 'SQLite', icon: CircleStackIcon, color: 'bg-green-100 text-green-800' },
    { value: 'mongodb', label: 'MongoDB', icon: CircleStackIcon, color: 'bg-green-100 text-green-800' },
    { value: 'redis', label: 'Redis', icon: CircleStackIcon, color: 'bg-red-100 text-red-800' }
  ];

  const statuses = [
    { value: 'connected', label: 'Connected', color: 'bg-green-100 text-green-800' },
    { value: 'disconnected', label: 'Disconnected', color: 'bg-gray-100 text-gray-800' },
    { value: 'error', label: 'Error', color: 'bg-red-100 text-red-800' }
  ];

  const handleSaveConnection = (connectionData: Partial<DatabaseConnection>) => {
    try {
      const validatedData = DatabaseConnectionSchema.parse(connectionData);
      
      if (editingConnection) {
        const updatedConnections = connections.map(c => 
          c.id === editingConnection.id 
            ? { ...c, ...validatedData, id: editingConnection.id, updatedAt: new Date() }
            : c
        );
        setConnections(updatedConnections);
      } else {
        const newConnection: DatabaseConnection = {
          id: Date.now().toString(),
          ...validatedData,
          status: 'disconnected',
          isActive: true,
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
        schemas: config.schemas,
        tables: config.tables,
        indexes: config.indexes,
        queries: config.queries,
        migrations: config.migrations
      });
    } catch (error) {
      console.error('Error saving database connection:', error);
    }
  };

  const handleDeleteConnection = (connectionId: string) => {
    setConnections(connections.filter(c => c.id !== connectionId));
    onUpdate({
      ...config,
      connections: connections.filter(c => c.id !== connectionId),
      schemas: config.schemas,
      tables: config.tables,
      indexes: config.indexes,
      queries: config.queries,
      migrations: config.migrations
    });
  };

  const handleTestConnection = (connectionId: string) => {
    // In real implementation, this would test the database connection
    console.log('Testing database connection:', connectionId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Database Connections</h3>
          <p className="text-sm text-gray-500">Manage database connections and configurations</p>
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
          const dbType = dbTypes.find(t => t.value === connection.type);
          const status = statuses.find(s => s.value === connection.status);
          const TypeIcon = dbType?.icon || CircleStackIcon;
          
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
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${dbType?.color}`}>
                    {dbType?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Host</span>
                  <span className="text-xs text-gray-900 font-mono">{connection.host}:{connection.port}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Database</span>
                  <span className="text-xs text-gray-900">{connection.database}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status?.color}`}>
                    {status?.label}
                  </span>
                </div>
                {connection.lastConnected && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Last Connected</span>
                    <span className="text-xs text-gray-900">
                      {connection.lastConnected.toLocaleDateString()}
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
                {editingConnection ? 'Edit Database Connection' : 'Create Database Connection'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveConnection({
                  name: formData.get('name') as string,
                  type: formData.get('type') as any,
                  host: formData.get('host') as string,
                  port: parseInt(formData.get('port') as string),
                  database: formData.get('database') as string,
                  username: formData.get('username') as string
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
                    <label className="block text-sm font-medium text-gray-700">Database Type</label>
                    <select
                      name="type"
                      defaultValue={editingConnection?.type}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {dbTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Host</label>
                    <input
                      type="text"
                      name="host"
                      defaultValue={editingConnection?.host}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Port</label>
                    <input
                      type="number"
                      name="port"
                      defaultValue={editingConnection?.port}
                      min="1"
                      max="65535"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Database Name</label>
                    <input
                      type="text"
                      name="database"
                      defaultValue={editingConnection?.database}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      name="username"
                      defaultValue={editingConnection?.username}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Security Note</h4>
                  <p className="text-sm text-yellow-700">
                    Password will be stored securely and encrypted. After creating the connection, 
                    you'll be able to test the connection and configure additional settings.
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
// SAVED QUERIES COMPONENT
// =============================================================================

function SavedQueries({ config, onUpdate }: { config: DatabaseConfiguration; onUpdate: (config: DatabaseConfiguration) => void }) {
  const [queries, setQueries] = useState<SavedQuery[]>(config.queries);
  const [showForm, setShowForm] = useState(false);
  const [editingQuery, setEditingQuery] = useState<SavedQuery | undefined>();

  const handleSaveQuery = (queryData: Partial<SavedQuery>) => {
    try {
      const validatedData = SavedQuerySchema.parse(queryData);
      
      if (editingQuery) {
        const updatedQueries = queries.map(q => 
          q.id === editingQuery.id 
            ? { ...q, ...validatedData, id: editingQuery.id, updatedAt: new Date() }
            : q
        );
        setQueries(updatedQueries);
      } else {
        const newQuery: SavedQuery = {
          id: Date.now().toString(),
          ...validatedData,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setQueries([...queries, newQuery]);
      }
      
      setShowForm(false);
      setEditingQuery(undefined);
      
      onUpdate({
        ...config,
        connections: config.connections,
        schemas: config.schemas,
        tables: config.tables,
        indexes: config.indexes,
        queries,
        migrations: config.migrations
      });
    } catch (error) {
      console.error('Error saving query:', error);
    }
  };

  const handleDeleteQuery = (queryId: string) => {
    setQueries(queries.filter(q => q.id !== queryId));
    onUpdate({
      ...config,
      connections: config.connections,
      schemas: config.schemas,
      tables: config.tables,
      indexes: config.indexes,
      queries: queries.filter(q => q.id !== queryId),
      migrations: config.migrations
    });
  };

  const handleExecuteQuery = (queryId: string) => {
    // In real implementation, this would execute the query
    console.log('Executing query:', queryId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Saved Queries</h3>
          <p className="text-sm text-gray-500">Manage and execute saved SQL queries</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Query
        </button>
      </div>

      {/* Queries Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connection</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visibility</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {queries.map((query) => {
              const connection = config.connections.find(c => c.id === query.connectionId);
              
              return (
                <tr key={query.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{query.name}</div>
                    <div className="text-sm text-gray-500">
                      {query.sql.length > 50 ? `${query.sql.substring(0, 50)}...` : query.sql}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {connection?.name || 'Unknown Connection'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {query.description || 'No description'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {query.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      query.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {query.isPublic ? 'Public' : 'Private'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleExecuteQuery(query.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Execute query"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingQuery(query);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuery(query.id)}
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

      {/* Query Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingQuery ? 'Edit Saved Query' : 'Create Saved Query'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveQuery({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  sql: formData.get('sql') as string,
                  connectionId: formData.get('connectionId') as string,
                  isPublic: formData.get('isPublic') === 'on'
                });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Query Name</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingQuery?.name}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Connection</label>
                    <select
                      name="connectionId"
                      defaultValue={editingQuery?.connectionId}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {config.connections.map(connection => (
                        <option key={connection.id} value={connection.id}>{connection.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingQuery?.description}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">SQL Query</label>
                  <textarea
                    name="sql"
                    defaultValue={editingQuery?.sql}
                    rows={8}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                    placeholder="SELECT * FROM table_name WHERE condition;"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPublic"
                    defaultChecked={editingQuery?.isPublic}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Make this query public</label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingQuery(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingQuery ? 'Update Query' : 'Create Query'}
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
// MAIN DATABASE MANAGEMENT COMPONENT
// =============================================================================

export default function DatabaseManagement() {
  const [config, setConfig] = useState<DatabaseConfiguration>({
    connections: [],
    schemas: [],
    tables: [],
    indexes: [],
    queries: [],
    migrations: []
  });

  const [performance, setPerformance] = useState<DatabasePerformance[]>([]);
  const [activeTab, setActiveTab] = useState('connections');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock database connections data
      const mockConnections: DatabaseConnection[] = [
        {
          id: '1',
          name: 'Primary PostgreSQL',
          type: 'postgresql',
          host: 'localhost',
          port: 5432,
          database: 'fulqrun_prod',
          username: 'fulqrun_user',
          status: 'connected',
          lastConnected: new Date('2024-10-01'),
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '2',
          name: 'Analytics Database',
          type: 'postgresql',
          host: 'analytics-db.company.com',
          port: 5432,
          database: 'analytics',
          username: 'analytics_user',
          status: 'connected',
          lastConnected: new Date('2024-10-01'),
          isActive: true,
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '3',
          name: 'Redis Cache',
          type: 'redis',
          host: 'redis.company.com',
          port: 6379,
          database: '0',
          username: 'redis_user',
          status: 'error',
          errorMessage: 'Connection timeout',
          isActive: true,
          createdAt: new Date('2024-03-01'),
          updatedAt: new Date('2024-09-30')
        }
      ];

      // Mock saved queries data
      const mockQueries: SavedQuery[] = [
        {
          id: '1',
          name: 'User Activity Report',
          description: 'Generate report of user activity for the last 30 days',
          sql: 'SELECT u.email, COUNT(a.id) as activity_count FROM users u LEFT JOIN activities a ON u.id = a.user_id WHERE a.created_at >= NOW() - INTERVAL \'30 days\' GROUP BY u.id, u.email ORDER BY activity_count DESC;',
          connectionId: '1',
          tags: ['report', 'users', 'activity'],
          isPublic: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '2',
          name: 'Sales Performance Query',
          description: 'Query to analyze sales performance metrics',
          sql: 'SELECT DATE_TRUNC(\'month\', created_at) as month, COUNT(*) as opportunities, SUM(value) as total_value FROM opportunities WHERE status = \'closed_won\' GROUP BY month ORDER BY month;',
          connectionId: '1',
          tags: ['sales', 'performance', 'metrics'],
          isPublic: false,
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '3',
          name: 'Database Size Check',
          description: 'Check database size and table statistics',
          sql: 'SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||\'.\'||tablename)) as size FROM pg_tables WHERE schemaname = \'public\' ORDER BY pg_total_relation_size(schemaname||\'.\'||tablename) DESC;',
          connectionId: '1',
          tags: ['maintenance', 'size', 'statistics'],
          isPublic: true,
          createdAt: new Date('2024-03-01'),
          updatedAt: new Date('2024-09-30')
        }
      ];

      // Mock performance data
      const mockPerformance: DatabasePerformance[] = [
        {
          connectionId: '1',
          activeConnections: 15,
          maxConnections: 100,
          cpuUsage: 45.2,
          memoryUsage: 67.8,
          diskUsage: 23.4,
          queryCount: 1250,
          averageQueryTime: 0.15,
          slowQueries: 12,
          locks: 3,
          deadlocks: 0,
          timestamp: new Date()
        },
        {
          connectionId: '2',
          activeConnections: 8,
          maxConnections: 50,
          cpuUsage: 23.1,
          memoryUsage: 45.6,
          diskUsage: 12.8,
          queryCount: 890,
          averageQueryTime: 0.08,
          slowQueries: 5,
          locks: 1,
          deadlocks: 0,
          timestamp: new Date()
        }
      ];
      
      setConfig({
        ...config,
        connections: mockConnections,
        queries: mockQueries
      });
      setPerformance(mockPerformance);
    } catch (error) {
      console.error('Error loading database data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = (updatedConfig: DatabaseConfiguration) => {
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
    { id: 'connections', name: 'Connections', icon: CircleStackIcon },
    { id: 'schemas', name: 'Schemas', icon: ServerIcon },
    { id: 'tables', name: 'Tables', icon: ChartBarIcon },
    { id: 'queries', name: 'Saved Queries', icon: DocumentTextIcon },
    { id: 'migrations', name: 'Migrations', icon: ArrowPathIcon },
    { id: 'performance', name: 'Performance', icon: CogIcon }
  ];

  const activeConnections = config.connections.filter(c => c.status === 'connected').length;
  const totalConnections = config.connections.length;
  const totalQueries = config.queries.length;
  const publicQueries = config.queries.filter(q => q.isPublic).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Database Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage database connections, schemas, queries, and monitor performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CircleStackIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Connections</p>
              <p className="text-2xl font-semibold text-gray-900">{activeConnections}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ServerIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Connections</p>
              <p className="text-2xl font-semibold text-gray-900">{totalConnections}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Saved Queries</p>
              <p className="text-2xl font-semibold text-gray-900">{totalQueries}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <EyeIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Public Queries</p>
              <p className="text-2xl font-semibold text-gray-900">{publicQueries}</p>
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
          <DatabaseConnections config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'schemas' && (
          <div className="text-center py-12">
            <ServerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Database Schemas</h3>
            <p className="text-gray-500">Schema management interface coming soon...</p>
          </div>
        )}
        {activeTab === 'tables' && (
          <div className="text-center py-12">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Database Tables</h3>
            <p className="text-gray-500">Table management interface coming soon...</p>
          </div>
        )}
        {activeTab === 'queries' && (
          <SavedQueries config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'migrations' && (
          <div className="text-center py-12">
            <ArrowPathIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Database Migrations</h3>
            <p className="text-gray-500">Migration management interface coming soon...</p>
          </div>
        )}
        {activeTab === 'performance' && (
          <div className="text-center py-12">
            <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Monitoring</h3>
            <p className="text-gray-500">Performance monitoring interface coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
