// Administration Module - Maintenance Mode Management
// Comprehensive maintenance mode and system management

'use client';

import React, { useState, useEffect } from 'react';
import {
  CogIcon, 
  ExclamationTriangleIcon, 
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
  InformationCircleIcon,
  LockClosedIcon,
  KeyIcon,
  UserGroupIcon,
  CloudIcon,
  DatabaseIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ServerIcon,
  ShieldCheckIcon,
  BellIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client'
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface MaintenanceConfiguration {
  mode: MaintenanceMode;
  schedules: MaintenanceSchedule[];
  announcements: MaintenanceAnnouncement[];
  tasks: MaintenanceTask[];
  logs: MaintenanceLog[];
}

interface MaintenanceMode {
  enabled: boolean;
  type: 'full' | 'partial' | 'scheduled';
  message: string;
  allowedUsers: string[];
  allowedRoles: string[];
  allowedIPs: string[];
  startTime?: Date;
  endTime?: Date;
  estimatedDuration?: number; // in minutes
  reason: string;
  contactInfo: string;
}

interface MaintenanceSchedule {
  id: string;
  name: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'full' | 'partial';
  recurring: boolean;
  recurrencePattern?: RecurrencePattern;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  timezone: string;
}

interface MaintenanceAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetAudience: 'all' | 'users' | 'admins' | 'specific';
  targetUsers?: string[];
  targetRoles?: string[];
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MaintenanceTask {
  id: string;
  name: string;
  description?: string;
  type: 'database' | 'server' | 'application' | 'security' | 'custom';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  assignedTo?: string;
  startTime?: Date;
  endTime?: Date;
  dependencies: string[];
  steps: TaskStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskStep {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  output?: string;
  errorMessage?: string;
}

interface MaintenanceLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'maintenance' | 'announcement' | 'task' | 'system';
  message: string;
  details?: unknown;
  userId?: string;
  taskId?: string;
  scheduleId?: string;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const MaintenanceScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  description: z.string().optional(),
  startTime: z.date(),
  endTime: z.date(),
  type: z.enum(['full', 'partial']),
  recurring: z.boolean(),
  isActive: z.boolean()
});

const MaintenanceAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['info', 'warning', 'error', 'success']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  targetAudience: z.enum(['all', 'users', 'admins', 'specific']),
  isActive: z.boolean()
});

const MaintenanceTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  type: z.enum(['database', 'server', 'application', 'security', 'custom']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  estimatedDuration: z.number().min(1, 'Duration must be at least 1 minute'),
  isActive: z.boolean()
});

// =============================================================================
// MAINTENANCE MODE COMPONENT
// =============================================================================

function MaintenanceModeControl({ config, onUpdate }: { config: MaintenanceConfiguration; onUpdate: (config: MaintenanceConfiguration) => void }) {
  const [mode, setMode] = useState<MaintenanceMode>(config.mode);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveMode = () => {
    const updatedConfig = {
      ...config,
      mode
    };
    onUpdate(updatedConfig);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setMode(config.mode);
    setIsEditing(false);
  };

  const handleToggleMode = () => {
    setMode({
      ...mode,
      enabled: !mode.enabled
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Maintenance Mode</h3>
          <p className="text-sm text-gray-500">Control system maintenance mode and access</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleMode}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
              mode.enabled 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {mode.enabled ? (
              <>
                <XCircleIcon className="h-4 w-4 mr-2" />
                Disable Maintenance Mode
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Enable Maintenance Mode
              </>
            )}
          </button>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Configure
            </button>
          )}
        </div>
      </div>

      {/* Maintenance Mode Status */}
      <div className={`p-4 rounded-lg border-2 ${
        mode.enabled 
          ? 'bg-red-50 border-red-200' 
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${
            mode.enabled ? 'text-red-600' : 'text-green-600'
          }`}>
            {mode.enabled ? (
              <ExclamationTriangleIcon className="h-8 w-8" />
            ) : (
              <CheckCircleIcon className="h-8 w-8" />
            )}
          </div>
          <div className="ml-3">
            <h4 className={`text-lg font-medium ${
              mode.enabled ? 'text-red-800' : 'text-green-800'
            }`}>
              {mode.enabled ? 'Maintenance Mode Active' : 'System Operational'}
            </h4>
            <p className={`text-sm ${
              mode.enabled ? 'text-red-700' : 'text-green-700'
            }`}>
              {mode.enabled 
                ? 'System is currently in maintenance mode. Limited access is available.'
                : 'System is running normally. All services are available.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Maintenance Mode Configuration */}
      {isEditing && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Maintenance Mode Configuration</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Maintenance Type</label>
              <select
                value={mode.type}
                onChange={(e) => setMode({ ...mode, type: e.target.value as unknown })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="full">Full Maintenance (Complete shutdown)</option>
                <option value="partial">Partial Maintenance (Limited functionality)</option>
                <option value="scheduled">Scheduled Maintenance (Time-based)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Maintenance Message</label>
              <textarea
                value={mode.message}
                onChange={(e) => setMode({ ...mode, message: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter maintenance message for users..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Reason for Maintenance</label>
              <input
                type="text"
                value={mode.reason}
                onChange={(e) => setMode({ ...mode, reason: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., Database optimization, Security updates"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Information</label>
              <input
                type="text"
                value={mode.contactInfo}
                onChange={(e) => setMode({ ...mode, contactInfo: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., admin@company.com, +1-555-0123"
              />
            </div>

            {mode.type === 'scheduled' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="datetime-local"
                    value={mode.startTime ? mode.startTime.toISOString().slice(0, 16) : ''}
                    onChange={(e) => setMode({ ...mode, startTime: new Date(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="datetime-local"
                    value={mode.endTime ? mode.endTime.toISOString().slice(0, 16) : ''}
                    onChange={(e) => setMode({ ...mode, endTime: new Date(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Estimated Duration (minutes)</label>
              <input
                type="number"
                value={mode.estimatedDuration || ''}
                onChange={(e) => setMode({ ...mode, estimatedDuration: parseInt(e.target.value) })}
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveMode}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAINTENANCE SCHEDULES COMPONENT
// =============================================================================

function MaintenanceSchedules({ config, onUpdate }: { config: MaintenanceConfiguration; onUpdate: (config: MaintenanceConfiguration) => void }) {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>(config.schedules);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | undefined>();

  const types = [
    { value: 'full', label: 'Full Maintenance', description: 'Complete system shutdown' },
    { value: 'partial', label: 'Partial Maintenance', description: 'Limited functionality available' }
  ];

  const handleSaveSchedule = (scheduleData: Partial<MaintenanceSchedule>) => {
    try {
      const validatedData = MaintenanceScheduleSchema.parse(scheduleData);
      
      if (editingSchedule) {
        const updatedSchedules = schedules.map(s => 
          s.id === editingSchedule.id 
            ? { ...s, ...validatedData, id: editingSchedule.id, updatedAt: new Date() }
            : s
        );
        setSchedules(updatedSchedules);
      } else {
        const newSchedule: MaintenanceSchedule = {
          id: Date.now().toString(),
          ...validatedData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setSchedules([...schedules, newSchedule]);
      }
      
      setShowForm(false);
      setEditingSchedule(undefined);
      
      onUpdate({
        ...config,
        mode: config.mode,
        schedules,
        announcements: config.announcements,
        tasks: config.tasks,
        logs: config.logs
      });
    } catch (error) {
      console.error('Error saving maintenance schedule:', error);
    }
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    setSchedules(schedules.filter(s => s.id !== scheduleId));
    onUpdate({
      ...config,
      mode: config.mode,
      schedules: schedules.filter(s => s.id !== scheduleId),
      announcements: config.announcements,
      tasks: config.tasks,
      logs: config.logs
    });
  };

  const handleToggleSchedule = (scheduleId: string) => {
    const updatedSchedules = schedules.map(s => 
      s.id === scheduleId ? { ...s, isActive: !s.isActive, updatedAt: new Date() } : s
    );
    setSchedules(updatedSchedules);
    onUpdate({
      ...config,
      mode: config.mode,
      schedules: updatedSchedules,
      announcements: config.announcements,
      tasks: config.tasks,
      logs: config.logs
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Maintenance Schedules</h3>
          <p className="text-sm text-gray-500">Schedule planned maintenance windows</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Schedule
        </button>
      </div>

      {/* Schedules Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurring</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedules.map((schedule) => (
              <tr key={schedule.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{schedule.name}</div>
                    {schedule.description && (
                      <div className="text-sm text-gray-500">{schedule.description}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {schedule.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {schedule.startTime.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {schedule.endTime.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {schedule.recurring ? 'Yes' : 'No'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    schedule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {schedule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleSchedule(schedule.id)}
                      className={schedule.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                      title={schedule.isActive ? "Deactivate schedule" : "Activate schedule"}
                    >
                      {schedule.isActive ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingSchedule(schedule);
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="text-red-600 hover:text-red-900"
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

      {/* Schedule Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingSchedule ? 'Edit Maintenance Schedule' : 'Create Maintenance Schedule'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveSchedule({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  type: formData.get('type') as unknown,
                  startTime: new Date(formData.get('startTime') as string),
                  endTime: new Date(formData.get('endTime') as string),
                  recurring: formData.get('recurring') === 'on',
                  isActive: true
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Schedule Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingSchedule?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingSchedule?.description}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Maintenance Type</label>
                  <select
                    name="type"
                    defaultValue={editingSchedule?.type}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {types.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      defaultValue={editingSchedule?.startTime ? editingSchedule.startTime.toISOString().slice(0, 16) : ''}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                    <input
                      type="datetime-local"
                      name="endTime"
                      defaultValue={editingSchedule?.endTime ? editingSchedule.endTime.toISOString().slice(0, 16) : ''}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="recurring"
                    defaultChecked={editingSchedule?.recurring}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Recurring schedule</label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingSchedule(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
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
// MAIN MAINTENANCE MODE COMPONENT
// =============================================================================

export default function MaintenanceModeManagement() {
  const [config, setConfig] = useState<MaintenanceConfiguration>({
    mode: {
      enabled: false,
      type: 'full',
      message: 'System is currently under maintenance. We apologize for any inconvenience.',
      allowedUsers: [],
      allowedRoles: ['admin'],
      allowedIPs: [],
      reason: '',
      contactInfo: ''
    },
    schedules: [],
    announcements: [],
    tasks: [],
    logs: []
  });

  const [activeTab, setActiveTab] = useState('mode');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock maintenance schedules data
      const mockSchedules: MaintenanceSchedule[] = [
        {
          id: '1',
          name: 'Weekly Database Maintenance',
          description: 'Regular database optimization and cleanup',
          startTime: new Date('2024-10-06T02:00:00Z'),
          endTime: new Date('2024-10-06T04:00:00Z'),
          type: 'partial',
          recurring: true,
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '2',
          name: 'Monthly Security Updates',
          description: 'Apply security patches and updates',
          startTime: new Date('2024-10-15T01:00:00Z'),
          endTime: new Date('2024-10-15T03:00:00Z'),
          type: 'full',
          recurring: true,
          isActive: true,
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '3',
          name: 'Emergency Maintenance',
          description: 'Critical system updates',
          startTime: new Date('2024-10-02T00:00:00Z'),
          endTime: new Date('2024-10-02T02:00:00Z'),
          type: 'full',
          recurring: false,
          isActive: false,
          createdAt: new Date('2024-09-30'),
          updatedAt: new Date('2024-09-30')
        }
      ];
      
      setConfig({
        ...config,
        schedules: mockSchedules
      });
    } catch (error) {
      console.error('Error loading maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = (updatedConfig: MaintenanceConfiguration) => {
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
    { id: 'mode', name: 'Maintenance Mode', icon: CogIcon },
    { id: 'schedules', name: 'Schedules', icon: ClockIcon },
    { id: 'announcements', name: 'Announcements', icon: BellIcon },
    { id: 'tasks', name: 'Maintenance Tasks', icon: ArrowPathIcon },
    { id: 'logs', name: 'Maintenance Logs', icon: DocumentTextIcon }
  ];

  const activeSchedules = config.schedules.filter(s => s.isActive).length;
  const totalSchedules = config.schedules.length;
  const upcomingSchedules = config.schedules.filter(s => s.startTime > new Date()).length;
  const activeAnnouncements = config.announcements.filter(a => a.isActive).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Mode Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Control maintenance mode, schedule maintenance windows, and manage system announcements
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CogIcon className={`h-8 w-8 ${config.mode.enabled ? 'text-red-600' : 'text-green-600'}`} />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Maintenance Mode</p>
              <p className="text-2xl font-semibold text-gray-900">
                {config.mode.enabled ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Schedules</p>
              <p className="text-2xl font-semibold text-gray-900">{activeSchedules}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <p className="text-2xl font-semibold text-gray-900">{upcomingSchedules}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <BellIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Announcements</p>
              <p className="text-2xl font-semibold text-gray-900">{activeAnnouncements}</p>
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
        {activeTab === 'mode' && (
          <MaintenanceModeControl config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'schedules' && (
          <MaintenanceSchedules config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'announcements' && (
          <div className="text-center py-12">
            <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Maintenance Announcements</h3>
            <p className="text-gray-500">Announcement management interface coming soon...</p>
          </div>
        )}
        {activeTab === 'tasks' && (
          <div className="text-center py-12">
            <ArrowPathIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Maintenance Tasks</h3>
            <p className="text-gray-500">Task management interface coming soon...</p>
          </div>
        )}
        {activeTab === 'logs' && (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Maintenance Logs</h3>
            <p className="text-gray-500">Log viewer interface coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
