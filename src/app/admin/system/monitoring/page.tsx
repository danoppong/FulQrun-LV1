// Administration Module - System Monitoring Dashboard
// Comprehensive system monitoring and health checks

'use client';

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon, 
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
  CircleStackIcon,
  CogIcon,
  ArrowPathIcon,
  SignalIcon,
  CpuChipIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client'
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface SystemMonitoringConfiguration {
  metrics: SystemMetric[];
  alerts: SystemAlert[];
  dashboards: MonitoringDashboard[];
  healthChecks: HealthCheck[];
  logs: SystemLog[];
}

interface SystemMetric {
  id: string;
  name: string;
  description?: string;
  category: 'cpu' | 'memory' | 'disk' | 'network' | 'database' | 'application' | 'custom';
  type: 'gauge' | 'counter' | 'histogram' | 'summary';
  unit: string;
  value: number;
  threshold: MetricThreshold;
  isActive: boolean;
  lastUpdated: Date;
}

interface MetricThreshold {
  warning: number;
  critical: number;
  min?: number;
  max?: number;
}

interface SystemAlert {
  id: string;
  name: string;
  description?: string;
  metricId: string;
  condition: AlertCondition;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notifications: AlertNotification[];
  lastTriggered?: Date;
  createdAt: Date;
}

interface AlertCondition {
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'between';
  value: number;
  maxValue?: number;
  duration?: number; // in seconds
}

interface AlertNotification {
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'teams';
  recipients: string[];
  template?: string;
}

interface MonitoringDashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  isPublic: boolean;
  refreshInterval: number; // in seconds
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardWidget {
  id: string;
  type: 'chart' | 'gauge' | 'table' | 'text' | 'metric';
  title: string;
  metricIds: string[];
  position: WidgetPosition;
  size: WidgetSize;
  config: WidgetConfig;
}

interface WidgetPosition {
  x: number;
  y: number;
}

interface WidgetSize {
  width: number;
  height: number;
}

interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  timeRange?: string;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  colors?: string[];
}

interface DashboardLayout {
  columns: number;
  rows: number;
  gridSize: number;
}

interface HealthCheck {
  id: string;
  name: string;
  description?: string;
  type: 'http' | 'tcp' | 'database' | 'custom';
  target: string;
  interval: number; // in seconds
  timeout: number; // in seconds
  expectedStatus?: number;
  expectedResponse?: string;
  isActive: boolean;
  lastCheck?: Date;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  errorMessage?: string;
}

interface SystemLog {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  source: string;
  message: string;
  details?: any;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

interface SystemPerformance {
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    cached: number;
    swap: {
      total: number;
      used: number;
      free: number;
    };
  };
  disk: {
    total: number;
    used: number;
    free: number;
    readOps: number;
    writeOps: number;
    readBytes: number;
    writeBytes: number;
  };
  network: {
    interfaces: NetworkInterface[];
    connections: number;
    packetsIn: number;
    packetsOut: number;
    bytesIn: number;
    bytesOut: number;
  };
  database: {
    connections: number;
    queries: number;
    slowQueries: number;
    locks: number;
    deadlocks: number;
  };
}

interface NetworkInterface {
  name: string;
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  errors: number;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const SystemMetricSchema = z.object({
  name: z.string().min(1, 'Metric name is required'),
  description: z.string().optional(),
  category: z.enum(['cpu', 'memory', 'disk', 'network', 'database', 'application', 'custom']),
  type: z.enum(['gauge', 'counter', 'histogram', 'summary']),
  unit: z.string().min(1, 'Unit is required'),
  isActive: z.boolean()
});

const HealthCheckSchema = z.object({
  name: z.string().min(1, 'Health check name is required'),
  description: z.string().optional(),
  type: z.enum(['http', 'tcp', 'database', 'custom']),
  target: z.string().min(1, 'Target is required'),
  interval: z.number().min(30, 'Interval must be at least 30 seconds'),
  timeout: z.number().min(1, 'Timeout must be at least 1 second'),
  isActive: z.boolean()
});

// =============================================================================
// SYSTEM METRICS COMPONENT
// =============================================================================

function SystemMetrics({ config, onUpdate }: { config: SystemMonitoringConfiguration; onUpdate: (config: SystemMonitoringConfiguration) => void }) {
  const [metrics, setMetrics] = useState<SystemMetric[]>(config.metrics);
  const [showForm, setShowForm] = useState(false);
  const [editingMetric, setEditingMetric] = useState<SystemMetric | undefined>();

  const categories = [
    { value: 'cpu', label: 'CPU', icon: CpuChipIcon, color: 'bg-blue-100 text-blue-800' },
    { value: 'memory', label: 'Memory', icon: CircleStackIcon, color: 'bg-green-100 text-green-800' },
    { value: 'disk', label: 'Disk', icon: CircleStackIcon, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'network', label: 'Network', icon: SignalIcon, color: 'bg-purple-100 text-purple-800' },
    { value: 'database', label: 'Database', icon: CircleStackIcon, color: 'bg-indigo-100 text-indigo-800' },
    { value: 'application', label: 'Application', icon: CogIcon, color: 'bg-pink-100 text-pink-800' },
    { value: 'custom', label: 'Custom', icon: ChartBarIcon, color: 'bg-gray-100 text-gray-800' }
  ];

  const types = [
    { value: 'gauge', label: 'Gauge', description: 'Current value at a point in time' },
    { value: 'counter', label: 'Counter', description: 'Cumulative value that only increases' },
    { value: 'histogram', label: 'Histogram', description: 'Distribution of values in buckets' },
    { value: 'summary', label: 'Summary', description: 'Quantiles and count of observations' }
  ];

  const handleSaveMetric = (metricData: Partial<SystemMetric>) => {
    try {
      const validatedData = SystemMetricSchema.parse(metricData);
      
      if (editingMetric) {
        const updatedMetrics = metrics.map(m => 
          m.id === editingMetric.id 
            ? { ...m, ...validatedData, id: editingMetric.id, lastUpdated: new Date() }
            : m
        );
        setMetrics(updatedMetrics);
      } else {
        const newMetric: SystemMetric = {
          id: Date.now().toString(),
          ...validatedData,
          value: 0,
          threshold: {
            warning: 80,
            critical: 95
          },
          lastUpdated: new Date()
        };
        setMetrics([...metrics, newMetric]);
      }
      
      setShowForm(false);
      setEditingMetric(undefined);
      
      onUpdate({
        ...config,
        metrics,
        alerts: config.alerts,
        dashboards: config.dashboards,
        healthChecks: config.healthChecks,
        logs: config.logs
      });
    } catch (error) {
      console.error('Error saving system metric:', error);
    }
  };

  const handleDeleteMetric = (metricId: string) => {
    setMetrics(metrics.filter(m => m.id !== metricId));
    onUpdate({
      ...config,
      metrics: metrics.filter(m => m.id !== metricId),
      alerts: config.alerts,
      dashboards: config.dashboards,
      healthChecks: config.healthChecks,
      logs: config.logs
    });
  };

  const getMetricStatus = (metric: SystemMetric) => {
    if (metric.value >= metric.threshold.critical) return 'critical';
    if (metric.value >= metric.threshold.warning) return 'warning';
    return 'healthy';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'healthy': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">System Metrics</h3>
          <p className="text-sm text-gray-500">Monitor system performance and resource usage</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Metric
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const category = categories.find(c => c.value === metric.category);
          const status = getMetricStatus(metric);
          const TypeIcon = category?.icon || ChartBarIcon;
          
          return (
            <div key={metric.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <TypeIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-900">{metric.name}</h4>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingMetric(metric);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMetric(metric.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Current Value</span>
                  <span className="text-sm font-medium text-gray-900">
                    {metric.value.toFixed(2)} {metric.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Category</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${category?.color}`}>
                    {category?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Thresholds</span>
                  <span className="text-xs text-gray-900">
                    W: {metric.threshold.warning} | C: {metric.threshold.critical}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Last Updated</span>
                  <span className="text-xs text-gray-900">
                    {metric.lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Metric Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingMetric ? 'Edit System Metric' : 'Add System Metric'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveMetric({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  category: formData.get('category') as 'cpu' | 'memory' | 'disk' | 'network' | 'database' | 'application' | 'custom',
                  type: formData.get('type') as 'gauge' | 'counter' | 'histogram' | 'summary',
                  unit: formData.get('unit') as string,
                  isActive: true
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Metric Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingMetric?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingMetric?.description}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      name="category"
                      defaultValue={editingMetric?.category}
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
                      name="type"
                      defaultValue={editingMetric?.type}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {types.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <input
                    type="text"
                    name="unit"
                    defaultValue={editingMetric?.unit}
                    placeholder="e.g., %, MB, requests/sec"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingMetric(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingMetric ? 'Update Metric' : 'Add Metric'}
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
// HEALTH CHECKS COMPONENT
// =============================================================================

function HealthChecks({ config, onUpdate }: { config: SystemMonitoringConfiguration; onUpdate: (config: SystemMonitoringConfiguration) => void }) {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>(config.healthChecks);
  const [showForm, setShowForm] = useState(false);
  const [editingCheck, setEditingCheck] = useState<HealthCheck | undefined>();

  const types = [
    { value: 'http', label: 'HTTP', description: 'Check HTTP endpoint availability' },
    { value: 'tcp', label: 'TCP', description: 'Check TCP port connectivity' },
    { value: 'database', label: 'Database', description: 'Check database connectivity' },
    { value: 'custom', label: 'Custom', description: 'Custom health check script' }
  ];

  const handleSaveHealthCheck = (checkData: Partial<HealthCheck>) => {
    try {
      const validatedData = HealthCheckSchema.parse(checkData);
      
      if (editingCheck) {
        const updatedChecks = healthChecks.map(c => 
          c.id === editingCheck.id 
            ? { ...c, ...validatedData, id: editingCheck.id }
            : c
        );
        setHealthChecks(updatedChecks);
      } else {
        const newCheck: HealthCheck = {
          id: Date.now().toString(),
          ...validatedData,
          status: 'unknown',
          lastCheck: undefined
        };
        setHealthChecks([...healthChecks, newCheck]);
      }
      
      setShowForm(false);
      setEditingCheck(undefined);
      
      onUpdate({
        ...config,
        metrics: config.metrics,
        alerts: config.alerts,
        dashboards: config.dashboards,
        healthChecks,
        logs: config.logs
      });
    } catch (error) {
      console.error('Error saving health check:', error);
    }
  };

  const handleDeleteHealthCheck = (checkId: string) => {
    setHealthChecks(healthChecks.filter(c => c.id !== checkId));
    onUpdate({
      ...config,
      metrics: config.metrics,
      alerts: config.alerts,
      dashboards: config.dashboards,
      healthChecks: healthChecks.filter(c => c.id !== checkId),
      logs: config.logs
    });
  };

  const handleRunHealthCheck = (checkId: string) => {
    // In real implementation, this would run the health check
    console.log('Running health check:', checkId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'unhealthy': return 'bg-red-100 text-red-800';
      case 'unknown': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Health Checks</h3>
          <p className="text-sm text-gray-500">Monitor system health and service availability</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Health Check
        </button>
      </div>

      {/* Health Checks Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Check</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {healthChecks.map((check) => (
              <tr key={check.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{check.name}</div>
                    {check.description && (
                      <div className="text-sm text-gray-500">{check.description}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {check.type.toUpperCase()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {check.target}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                    {check.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {check.lastCheck ? check.lastCheck.toLocaleString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {check.responseTime ? `${check.responseTime}ms` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRunHealthCheck(check.id)}
                      className="text-green-600 hover:text-green-900"
                      title="Run health check"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingCheck(check);
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteHealthCheck(check.id)}
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

      {/* Health Check Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCheck ? 'Edit Health Check' : 'Add Health Check'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveHealthCheck({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  type: formData.get('type') as 'http' | 'tcp' | 'database' | 'custom',
                  target: formData.get('target') as string,
                  interval: parseInt(formData.get('interval') as string),
                  timeout: parseInt(formData.get('timeout') as string),
                  isActive: true
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingCheck?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingCheck?.description}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    name="type"
                    defaultValue={editingCheck?.type}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {types.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Target</label>
                  <input
                    type="text"
                    name="target"
                    defaultValue={editingCheck?.target}
                    placeholder="e.g., https://api.example.com/health"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Interval (seconds)</label>
                    <input
                      type="number"
                      name="interval"
                      defaultValue={editingCheck?.interval || 60}
                      min="30"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Timeout (seconds)</label>
                    <input
                      type="number"
                      name="timeout"
                      defaultValue={editingCheck?.timeout || 10}
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCheck(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingCheck ? 'Update Check' : 'Add Check'}
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
// MAIN SYSTEM MONITORING COMPONENT
// =============================================================================

export default function SystemMonitoring() {
  const [config, setConfig] = useState<SystemMonitoringConfiguration>({
    metrics: [],
    alerts: [],
    dashboards: [],
    healthChecks: [],
    logs: []
  });

  const [performance, setPerformance] = useState<SystemPerformance | null>(null);
  const [activeTab, setActiveTab] = useState('metrics');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock system metrics data
      const mockMetrics: SystemMetric[] = [
        {
          id: '1',
          name: 'CPU Usage',
          description: 'Current CPU utilization percentage',
          category: 'cpu',
          type: 'gauge',
          unit: '%',
          value: 45.2,
          threshold: { warning: 80, critical: 95 },
          isActive: true,
          lastUpdated: new Date()
        },
        {
          id: '2',
          name: 'Memory Usage',
          description: 'Current memory utilization percentage',
          category: 'memory',
          type: 'gauge',
          unit: '%',
          value: 67.8,
          threshold: { warning: 85, critical: 95 },
          isActive: true,
          lastUpdated: new Date()
        },
        {
          id: '3',
          name: 'Disk Usage',
          description: 'Current disk utilization percentage',
          category: 'disk',
          type: 'gauge',
          unit: '%',
          value: 23.4,
          threshold: { warning: 80, critical: 90 },
          isActive: true,
          lastUpdated: new Date()
        },
        {
          id: '4',
          name: 'Database Connections',
          description: 'Number of active database connections',
          category: 'database',
          type: 'gauge',
          unit: 'connections',
          value: 15,
          threshold: { warning: 80, critical: 95 },
          isActive: true,
          lastUpdated: new Date()
        }
      ];

      // Mock health checks data
      const mockHealthChecks: HealthCheck[] = [
        {
          id: '1',
          name: 'API Health Check',
          description: 'Check API endpoint availability',
          type: 'http',
          target: 'https://api.fulqrun.com/health',
          interval: 60,
          timeout: 10,
          isActive: true,
          status: 'healthy',
          lastCheck: new Date('2024-10-01T10:30:00Z'),
          responseTime: 45
        },
        {
          id: '2',
          name: 'Database Health Check',
          description: 'Check database connectivity',
          type: 'database',
          target: 'postgresql://localhost:5432/fulqrun',
          interval: 30,
          timeout: 5,
          isActive: true,
          status: 'healthy',
          lastCheck: new Date('2024-10-01T10:29:30Z'),
          responseTime: 12
        },
        {
          id: '3',
          name: 'Redis Health Check',
          description: 'Check Redis cache connectivity',
          type: 'tcp',
          target: 'redis.company.com:6379',
          interval: 60,
          timeout: 5,
          isActive: true,
          status: 'unhealthy',
          lastCheck: new Date('2024-10-01T10:25:00Z'),
          responseTime: undefined,
          errorMessage: 'Connection timeout'
        }
      ];

      // Mock system performance data
      const mockPerformance: SystemPerformance = {
        timestamp: new Date(),
        cpu: {
          usage: 45.2,
          cores: 8,
          loadAverage: [1.2, 1.5, 1.8]
        },
        memory: {
          total: 16384, // MB
          used: 11120,
          free: 5264,
          cached: 2048,
          swap: {
            total: 4096,
            used: 0,
            free: 4096
          }
        },
        disk: {
          total: 1000000, // MB
          used: 234000,
          free: 766000,
          readOps: 1250,
          writeOps: 890,
          readBytes: 15600000,
          writeBytes: 8900000
        },
        network: {
          interfaces: [
            {
              name: 'eth0',
              bytesIn: 1250000000,
              bytesOut: 890000000,
              packetsIn: 1250000,
              packetsOut: 890000,
              errors: 0
            }
          ],
          connections: 45,
          packetsIn: 1250000,
          packetsOut: 890000,
          bytesIn: 1250000000,
          bytesOut: 890000000
        },
        database: {
          connections: 15,
          queries: 1250,
          slowQueries: 12,
          locks: 3,
          deadlocks: 0
        }
      };
      
      setConfig({
        ...config,
        metrics: mockMetrics,
        healthChecks: mockHealthChecks
      });
      setPerformance(mockPerformance);
    } catch (error) {
      console.error('Error loading system monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = (updatedConfig: SystemMonitoringConfiguration) => {
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
    { id: 'metrics', name: 'System Metrics', icon: ChartBarIcon },
    { id: 'healthChecks', name: 'Health Checks', icon: CheckCircleIcon },
    { id: 'alerts', name: 'Alerts', icon: ExclamationTriangleIcon },
    { id: 'dashboards', name: 'Dashboards', icon: EyeIcon },
    { id: 'logs', name: 'System Logs', icon: DocumentTextIcon },
    { id: 'performance', name: 'Performance', icon: CogIcon }
  ];

  const activeMetrics = config.metrics.filter(m => m.isActive).length;
  const totalMetrics = config.metrics.length;
  const healthyChecks = config.healthChecks.filter(c => c.status === 'healthy').length;
  const totalChecks = config.healthChecks.length;
  const criticalAlerts = config.alerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor system performance, health checks, and system metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Metrics</p>
              <p className="text-2xl font-semibold text-gray-900">{activeMetrics}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Healthy Checks</p>
              <p className="text-2xl font-semibold text-gray-900">{healthyChecks}/{totalChecks}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Critical Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">{criticalAlerts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CpuChipIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">CPU Usage</p>
              <p className="text-2xl font-semibold text-gray-900">
                {performance ? `${performance.cpu.usage.toFixed(1)}%` : 'N/A'}
              </p>
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
        {activeTab === 'metrics' && (
          <SystemMetrics config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'healthChecks' && (
          <HealthChecks config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'alerts' && (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">System Alerts</h3>
            <p className="text-gray-500">Alert management interface coming soon...</p>
          </div>
        )}
        {activeTab === 'dashboards' && (
          <div className="text-center py-12">
            <EyeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Monitoring Dashboards</h3>
            <p className="text-gray-500">Dashboard management interface coming soon...</p>
          </div>
        )}
        {activeTab === 'logs' && (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">System Logs</h3>
            <p className="text-gray-500">Log viewer interface coming soon...</p>
          </div>
        )}
        {activeTab === 'performance' && (
          <div className="text-center py-12">
            <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Analytics</h3>
            <p className="text-gray-500">Performance analytics interface coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
