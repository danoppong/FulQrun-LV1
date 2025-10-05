// Administration Module - KPI Configuration Interface
// Comprehensive KPI module configuration management

'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  CalculatorIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowUpDownIcon,
  EyeIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client';
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface KPIConfiguration {
  definitions: KPIDefinition[];
  calculations: KPICalculation[];
  thresholds: KPIThreshold[];
  dashboards: KPIDashboard[];
  alerts: KPIAlert[];
  reports: KPIReport[];
}

interface KPIDefinition {
  id: string;
  name: string;
  description?: string;
  category: 'sales' | 'marketing' | 'customer' | 'financial' | 'operational' | 'custom';
  type: 'count' | 'sum' | 'average' | 'percentage' | 'ratio' | 'custom';
  formula: string;
  dataSource: string;
  dimensions: KPIDimension[];
  frequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  unit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface KPIDimension {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  values?: string[];
}

interface KPICalculation {
  id: string;
  kpiId: string;
  period: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercentage?: number;
  calculatedAt: Date;
  metadata?: any;
}

interface KPIThreshold {
  id: string;
  kpiId: string;
  level: 'critical' | 'warning' | 'info' | 'success';
  operator: 'greater_than' | 'less_than' | 'equals' | 'between';
  value: number;
  maxValue?: number;
  color: string;
  isActive: boolean;
}

interface KPIDashboard {
  id: string;
  name: string;
  description?: string;
  kpis: DashboardKPI[];
  layout: DashboardLayout;
  isPublic: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardKPI {
  kpiId: string;
  position: { x: number; y: number; width: number; height: number };
  chartType: 'line' | 'bar' | 'pie' | 'number' | 'gauge';
  timeRange: string;
  filters?: any;
}

interface DashboardLayout {
  columns: number;
  rows: number;
  gridSize: number;
}

interface KPIAlert {
  id: string;
  kpiId: string;
  name: string;
  condition: AlertCondition;
  recipients: string[];
  channels: string[];
  isActive: boolean;
  lastTriggered?: Date;
}

interface AlertCondition {
  operator: string;
  value: number;
  duration?: number;
}

interface KPIReport {
  id: string;
  name: string;
  description?: string;
  kpis: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  schedule?: string;
  recipients: string[];
  isActive: boolean;
  lastGenerated?: Date;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const KPIDefinitionSchema = z.object({
  name: z.string().min(1, 'KPI name is required'),
  description: z.string().optional(),
  category: z.enum(['sales', 'marketing', 'customer', 'financial', 'operational', 'custom']),
  type: z.enum(['count', 'sum', 'average', 'percentage', 'ratio', 'custom']),
  formula: z.string().min(1, 'Formula is required'),
  dataSource: z.string().min(1, 'Data source is required'),
  frequency: z.enum(['real_time', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly']),
  unit: z.string().min(1, 'Unit is required'),
  isActive: z.boolean()
});

const KPIThresholdSchema = z.object({
  kpiId: z.string().min(1, 'KPI is required'),
  level: z.enum(['critical', 'warning', 'info', 'success']),
  operator: z.enum(['greater_than', 'less_than', 'equals', 'between']),
  value: z.number(),
  maxValue: z.number().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  isActive: z.boolean()
});

// =============================================================================
// KPI DEFINITIONS COMPONENT
// =============================================================================

function KPIDefinitions({ config, onUpdate }: { config: KPIConfiguration; onUpdate: (config: KPIConfiguration) => void }) {
  const [definitions, setDefinitions] = useState<KPIDefinition[]>(config.definitions);
  const [showForm, setShowForm] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPIDefinition | undefined>();

  const categories = [
    { value: 'sales', label: 'Sales', color: 'bg-blue-100 text-blue-800' },
    { value: 'marketing', label: 'Marketing', color: 'bg-green-100 text-green-800' },
    { value: 'customer', label: 'Customer', color: 'bg-purple-100 text-purple-800' },
    { value: 'financial', label: 'Financial', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'operational', label: 'Operational', color: 'bg-red-100 text-red-800' },
    { value: 'custom', label: 'Custom', color: 'bg-gray-100 text-gray-800' }
  ];

  const types = [
    { value: 'count', label: 'Count', icon: CalculatorIcon },
    { value: 'sum', label: 'Sum', icon: ArrowTrendingUpIcon },
    { value: 'average', label: 'Average', icon: MinusIcon },
    { value: 'percentage', label: 'Percentage', icon: ChartBarIcon },
    { value: 'ratio', label: 'Ratio', icon: ArrowTrendingDownIcon },
    { value: 'custom', label: 'Custom', icon: DocumentTextIcon }
  ];

  const frequencies = [
    { value: 'real_time', label: 'Real-time' },
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' }
  ];

  const dataSources = [
    { value: 'leads', label: 'Leads' },
    { value: 'opportunities', label: 'Opportunities' },
    { value: 'activities', label: 'Activities' },
    { value: 'users', label: 'Users' },
    { value: 'custom', label: 'Custom Query' }
  ];

  const handleSaveKPI = (kpiData: Partial<KPIDefinition>) => {
    try {
      const validatedData = KPIDefinitionSchema.parse(kpiData);
      
      if (editingKPI) {
        const updatedDefinitions = definitions.map(k => 
          k.id === editingKPI.id 
            ? { ...k, ...validatedData, id: editingKPI.id, updatedAt: new Date() }
            : k
        );
        setDefinitions(updatedDefinitions);
      } else {
        const newKPI: KPIDefinition = {
          id: Date.now().toString(),
          ...validatedData,
          dimensions: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setDefinitions([...definitions, newKPI]);
      }
      
      setShowForm(false);
      setEditingKPI(undefined);
      
      onUpdate({
        ...config,
        definitions,
        calculations: config.calculations,
        thresholds: config.thresholds,
        dashboards: config.dashboards,
        alerts: config.alerts,
        reports: config.reports
      });
    } catch (error) {
      console.error('Error saving KPI:', error);
    }
  };

  const handleDeleteKPI = (kpiId: string) => {
    setDefinitions(definitions.filter(k => k.id !== kpiId));
    onUpdate({
      ...config,
      definitions: definitions.filter(k => k.id !== kpiId),
      calculations: config.calculations,
      thresholds: config.thresholds,
      dashboards: config.dashboards,
      alerts: config.alerts,
      reports: config.reports
    });
  };

  const handleToggleKPI = (kpiId: string) => {
    const updatedDefinitions = definitions.map(k => 
      k.id === kpiId ? { ...k, isActive: !k.isActive, updatedAt: new Date() } : k
    );
    setDefinitions(updatedDefinitions);
    onUpdate({
      ...config,
      definitions: updatedDefinitions,
      calculations: config.calculations,
      thresholds: config.thresholds,
      dashboards: config.dashboards,
      alerts: config.alerts,
      reports: config.reports
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">KPI Definitions</h3>
          <p className="text-sm text-gray-500">Define and configure key performance indicators</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add KPI
        </button>
      </div>

      {/* KPI Definitions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {definitions.map((kpi) => {
          const category = categories.find(c => c.value === kpi.category);
          const type = types.find(t => t.value === kpi.type);
          const TypeIcon = type?.icon || DocumentTextIcon;
          
          return (
            <div key={kpi.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <TypeIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-900">{kpi.name}</h4>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingKPI(kpi);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleKPI(kpi.id)}
                    className={kpi.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                  >
                    {kpi.isActive ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteKPI(kpi.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {kpi.description && (
                <p className="text-sm text-gray-500 mb-3">{kpi.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Category</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${category?.color}`}>
                    {category?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Type</span>
                  <span className="text-xs text-gray-900">{type?.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Frequency</span>
                  <span className="text-xs text-gray-900">{frequencies.find(f => f.value === kpi.frequency)?.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Unit</span>
                  <span className="text-xs text-gray-900">{kpi.unit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`text-xs ${kpi.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* KPI Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingKPI ? 'Edit KPI Definition' : 'Create KPI Definition'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveKPI({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  category: formData.get('category') as any,
                  type: formData.get('type') as any,
                  formula: formData.get('formula') as string,
                  dataSource: formData.get('dataSource') as string,
                  frequency: formData.get('frequency') as any,
                  unit: formData.get('unit') as string,
                  isActive: true
                });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">KPI Name</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingKPI?.name}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      name="category"
                      defaultValue={editingKPI?.category}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingKPI?.description}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      name="type"
                      defaultValue={editingKPI?.type}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {types.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Source</label>
                    <select
                      name="dataSource"
                      defaultValue={editingKPI?.dataSource}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {dataSources.map(source => (
                        <option key={source.value} value={source.value}>{source.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Formula</label>
                  <textarea
                    name="formula"
                    defaultValue={editingKPI?.formula}
                    rows={3}
                    placeholder="e.g., COUNT(leads) WHERE status = 'qualified'"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <select
                      name="frequency"
                      defaultValue={editingKPI?.frequency}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {frequencies.map(freq => (
                        <option key={freq.value} value={freq.value}>{freq.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit</label>
                    <input
                      type="text"
                      name="unit"
                      defaultValue={editingKPI?.unit}
                      placeholder="e.g., $, %, count, hours"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingKPI(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingKPI ? 'Update KPI' : 'Create KPI'}
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
// KPI THRESHOLDS COMPONENT
// =============================================================================

function KPIThresholds({ config, onUpdate }: { config: KPIConfiguration; onUpdate: (config: KPIConfiguration) => void }) {
  const [thresholds, setThresholds] = useState<KPIThreshold[]>(config.thresholds);
  const [showForm, setShowForm] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<KPIThreshold | undefined>();

  const levels = [
    { value: 'critical', label: 'Critical', color: '#EF4444' },
    { value: 'warning', label: 'Warning', color: '#F59E0B' },
    { value: 'info', label: 'Info', color: '#3B82F6' },
    { value: 'success', label: 'Success', color: '#10B981' }
  ];

  const operators = [
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'equals', label: 'Equals' },
    { value: 'between', label: 'Between' }
  ];

  const handleSaveThreshold = (thresholdData: Partial<KPIThreshold>) => {
    try {
      const validatedData = KPIThresholdSchema.parse(thresholdData);
      
      if (editingThreshold) {
        const updatedThresholds = thresholds.map(t => 
          t.id === editingThreshold.id 
            ? { ...t, ...validatedData, id: editingThreshold.id }
            : t
        );
        setThresholds(updatedThresholds);
      } else {
        const newThreshold: KPIThreshold = {
          id: Date.now().toString(),
          ...validatedData,
          isActive: true
        };
        setThresholds([...thresholds, newThreshold]);
      }
      
      setShowForm(false);
      setEditingThreshold(undefined);
      
      onUpdate({
        ...config,
        definitions: config.definitions,
        calculations: config.calculations,
        thresholds,
        dashboards: config.dashboards,
        alerts: config.alerts,
        reports: config.reports
      });
    } catch (error) {
      console.error('Error saving threshold:', error);
    }
  };

  const handleDeleteThreshold = (thresholdId: string) => {
    setThresholds(thresholds.filter(t => t.id !== thresholdId));
    onUpdate({
      ...config,
      definitions: config.definitions,
      calculations: config.calculations,
      thresholds: thresholds.filter(t => t.id !== thresholdId),
      dashboards: config.dashboards,
      alerts: config.alerts,
      reports: config.reports
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">KPI Thresholds</h3>
          <p className="text-sm text-gray-500">Configure performance thresholds and alert levels</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Threshold
        </button>
      </div>

      {/* Thresholds Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KPI</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {thresholds.map((threshold) => {
              const kpi = config.definitions.find(k => k.id === threshold.kpiId);
              const level = levels.find(l => l.value === threshold.level);
              
              return (
                <tr key={threshold.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {kpi?.name || 'Unknown KPI'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: threshold.color }}
                    >
                      {level?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {operators.find(op => op.value === threshold.operator)?.label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {threshold.operator === 'between' 
                      ? `${threshold.value} - ${threshold.maxValue}`
                      : threshold.value
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      threshold.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {threshold.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingThreshold(threshold);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteThreshold(threshold.id)}
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

      {/* Threshold Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingThreshold ? 'Edit Threshold' : 'Create Threshold'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveThreshold({
                  kpiId: formData.get('kpiId') as string,
                  level: formData.get('level') as any,
                  operator: formData.get('operator') as any,
                  value: parseFloat(formData.get('value') as string),
                  maxValue: formData.get('maxValue') ? parseFloat(formData.get('maxValue') as string) : undefined,
                  color: formData.get('color') as string,
                  isActive: true
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">KPI</label>
                  <select
                    name="kpiId"
                    defaultValue={editingThreshold?.kpiId}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {config.definitions.map(kpi => (
                      <option key={kpi.id} value={kpi.id}>{kpi.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Level</label>
                    <select
                      name="level"
                      defaultValue={editingThreshold?.level}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {levels.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Operator</label>
                    <select
                      name="operator"
                      defaultValue={editingThreshold?.operator}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {operators.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Value</label>
                    <input
                      type="number"
                      name="value"
                      defaultValue={editingThreshold?.value}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Value (if between)</label>
                    <input
                      type="number"
                      name="maxValue"
                      defaultValue={editingThreshold?.maxValue}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Color</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="color"
                      name="color"
                      defaultValue={editingThreshold?.color || '#EF4444'}
                      className="h-10 w-16 rounded border-gray-300"
                    />
                    <input
                      type="text"
                      name="color"
                      defaultValue={editingThreshold?.color || '#EF4444'}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingThreshold(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingThreshold ? 'Update Threshold' : 'Create Threshold'}
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
// MAIN KPI CONFIGURATION COMPONENT
// =============================================================================

export default function KPIConfiguration() {
  const [config, setConfig] = useState<KPIConfiguration>({
    definitions: [],
    calculations: [],
    thresholds: [],
    dashboards: [],
    alerts: [],
    reports: []
  });

  const [activeTab, setActiveTab] = useState('definitions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      
      // Mock configuration data
      const mockConfig: KPIConfiguration = {
        definitions: [
          {
            id: '1',
            name: 'Lead Conversion Rate',
            description: 'Percentage of leads that convert to opportunities',
            category: 'sales',
            type: 'percentage',
            formula: '(COUNT(opportunities) / COUNT(leads)) * 100',
            dataSource: 'leads',
            dimensions: [],
            frequency: 'daily',
            unit: '%',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '2',
            name: 'Average Deal Size',
            description: 'Average value of closed won opportunities',
            category: 'sales',
            type: 'average',
            formula: 'AVG(opportunities.value) WHERE status = "closed_won"',
            dataSource: 'opportunities',
            dimensions: [],
            frequency: 'monthly',
            unit: '$',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '3',
            name: 'Sales Velocity',
            description: 'Average time from lead to closed won',
            category: 'sales',
            type: 'average',
            formula: 'AVG(DATEDIFF(closed_date, created_date))',
            dataSource: 'opportunities',
            dimensions: [],
            frequency: 'weekly',
            unit: 'days',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        calculations: [],
        thresholds: [
          {
            id: '1',
            kpiId: '1',
            level: 'critical',
            operator: 'less_than',
            value: 10,
            color: '#EF4444',
            isActive: true
          },
          {
            id: '2',
            kpiId: '1',
            level: 'warning',
            operator: 'less_than',
            value: 20,
            color: '#F59E0B',
            isActive: true
          },
          {
            id: '3',
            kpiId: '2',
            level: 'success',
            operator: 'greater_than',
            value: 50000,
            color: '#10B981',
            isActive: true
          }
        ],
        dashboards: [],
        alerts: [],
        reports: []
      };
      
      setConfig(mockConfig);
    } catch (error) {
      console.error('Error loading KPI configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = (updatedConfig: KPIConfiguration) => {
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
    { id: 'definitions', name: 'KPI Definitions', icon: DocumentTextIcon },
    { id: 'thresholds', name: 'Thresholds', icon: ChartBarIcon },
    { id: 'dashboards', name: 'Dashboards', icon: EyeIcon },
    { id: 'alerts', name: 'Alerts', icon: ClockIcon },
    { id: 'reports', name: 'Reports', icon: DocumentTextIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KPI Configuration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Define key performance indicators, thresholds, dashboards, and reporting
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">KPI Definitions</p>
              <p className="text-2xl font-semibold text-gray-900">{config.definitions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Thresholds</p>
              <p className="text-2xl font-semibold text-gray-900">{config.thresholds.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <EyeIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Dashboards</p>
              <p className="text-2xl font-semibold text-gray-900">{config.dashboards.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">{config.alerts.length}</p>
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
        {activeTab === 'definitions' && (
          <KPIDefinitions config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'thresholds' && (
          <KPIThresholds config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'dashboards' && (
          <div className="text-center py-12">
            <EyeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Dashboard Configuration</h3>
            <p className="text-gray-500">KPI dashboard configuration coming soon...</p>
          </div>
        )}
        {activeTab === 'alerts' && (
          <div className="text-center py-12">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Alert Configuration</h3>
            <p className="text-gray-500">KPI alert configuration coming soon...</p>
          </div>
        )}
        {activeTab === 'reports' && (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Report Configuration</h3>
            <p className="text-gray-500">KPI report configuration coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
