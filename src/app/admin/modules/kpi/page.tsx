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
  ArrowPathIcon,
  EyeIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client'
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

  // Helper function to reload configuration
  const reloadConfiguration = async () => {
    try {
      // Load KPI definitions from database
      const { data: kpiDefinitions, error } = await supabase
        .from('kpi_definitions')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) {
        console.error('Error loading KPI definitions:', error);
        return;
      }

      // Transform database KPI definitions to component format
      const transformedDefinitions: KPIDefinition[] = (kpiDefinitions || []).map(kpi => ({
        id: kpi.id,
        name: kpi.display_name,
        description: kpi.description,
        category: mapKpiCategory(kpi.kpi_name),
        type: mapKpiType(kpi.calculation_method),
        formula: kpi.formula,
        dataSource: kpi.data_sources?.[0] || 'custom',
        dimensions: kpi.dimensions?.map(dim => ({ name: dim, type: 'string' as const })) || [],
        frequency: 'daily' as const,
        unit: getKpiUnit(kpi.kpi_name),
        isActive: kpi.is_active,
        createdAt: new Date(kpi.created_at),
        updatedAt: new Date(kpi.updated_at)
      }));

      setDefinitions(transformedDefinitions);
      onUpdate({
        ...config,
        definitions: transformedDefinitions,
        calculations: config.calculations,
        thresholds: config.thresholds,
        dashboards: config.dashboards,
        alerts: config.alerts,
        reports: config.reports
      });
    } catch (error) {
      console.error('Error reloading KPI definitions:', error);
    }
  };

  // Helper functions to map database KPI data to component format
  const mapKpiCategory = (kpiName: string): 'sales' | 'marketing' | 'customer' | 'financial' | 'operational' | 'custom' => {
    if (kpiName.includes('win_rate') || kpiName.includes('revenue') || kpiName.includes('deal') || 
        kpiName.includes('quota') || kpiName.includes('pipeline') || kpiName.includes('activities')) {
      return 'sales';
    }
    if (kpiName.includes('lead') || kpiName.includes('conversion') || kpiName.includes('cac')) {
      return 'marketing';
    }
    if (kpiName.includes('clv') || kpiName.includes('customer')) {
      return 'customer';
    }
    if (kpiName.includes('trx') || kpiName.includes('nrx') || kpiName.includes('prescription') || 
        kpiName.includes('pharmaceutical') || kpiName.includes('hcp')) {
      return 'operational';
    }
    if (kpiName.includes('meddpicc') || kpiName.includes('enterprise') || kpiName.includes('chart') || 
        kpiName.includes('data') || kpiName.includes('metric') || kpiName.includes('content')) {
      return 'custom';
    }
    return 'sales';
  };

  const mapKpiType = (calculationMethod: string): 'count' | 'sum' | 'average' | 'percentage' | 'ratio' | 'custom' => {
    if (calculationMethod === 'sql_function') {
      return 'custom';
    }
    if (calculationMethod === 'api_calculation') {
      return 'average';
    }
    return 'custom';
  };

  const getKpiUnit = (kpiName: string): string => {
    if (kpiName.includes('rate') || kpiName.includes('percentage') || kpiName.includes('growth')) {
      return '%';
    }
    if (kpiName.includes('revenue') || kpiName.includes('deal') || kpiName.includes('cac') || kpiName.includes('clv')) {
      return '$';
    }
    if (kpiName.includes('cycle') || kpiName.includes('days') || kpiName.includes('time')) {
      return 'days';
    }
    if (kpiName.includes('activities') || kpiName.includes('calls') || kpiName.includes('leads')) {
      return 'count';
    }
    return 'value';
  };

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
          <div className="flex items-center mt-1">
            <div className={`w-2 h-2 rounded-full mr-2 ${config.definitions.length > 3 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-xs text-gray-500">
              {config.definitions.length > 3 ? 'Live Data' : 'Mock Data'} - {config.definitions.length} KPIs loaded
            </span>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={reloadConfiguration}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add KPI
          </button>
        </div>
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
// DASHBOARD CONFIGURATION COMPONENT
// =============================================================================

function DashboardConfiguration({ config, onUpdate }: { config: KPIConfiguration; onUpdate: (config: KPIConfiguration) => void }) {
  const [dashboards, setDashboards] = useState<KPIDashboard[]>(config.dashboards);
  const [showForm, setShowForm] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<KPIDashboard | undefined>();
  const [draggedKPI, setDraggedKPI] = useState<string | null>(null);

  const chartTypes = [
    { value: 'line', label: 'Line Chart', icon: ArrowTrendingUpIcon },
    { value: 'bar', label: 'Bar Chart', icon: ChartBarIcon },
    { value: 'pie', label: 'Pie Chart', icon: ChartBarIcon },
    { value: 'number', label: 'Number Display', icon: CalculatorIcon },
    { value: 'gauge', label: 'Gauge Chart', icon: ChartBarIcon }
  ];

  const timeRanges = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' }
  ];

  const handleSaveDashboard = (dashboardData: Partial<KPIDashboard>) => {
    try {
      if (editingDashboard) {
        const updatedDashboards = dashboards.map(d => 
          d.id === editingDashboard.id 
            ? { ...d, ...dashboardData, id: editingDashboard.id, updatedAt: new Date() }
            : d
        );
        setDashboards(updatedDashboards);
      } else {
        const newDashboard: KPIDashboard = {
          id: Date.now().toString(),
          ...dashboardData,
          kpis: [],
          layout: { columns: 4, rows: 3, gridSize: 20 },
          isPublic: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        } as KPIDashboard;
        setDashboards([...dashboards, newDashboard]);
      }
      
      setShowForm(false);
      setEditingDashboard(undefined);
      
      onUpdate({
        ...config,
        definitions: config.definitions,
        calculations: config.calculations,
        thresholds: config.thresholds,
        dashboards,
        alerts: config.alerts,
        reports: config.reports
      });
    } catch (error) {
      console.error('Error saving dashboard:', error);
    }
  };

  const handleDeleteDashboard = (dashboardId: string) => {
    setDashboards(dashboards.filter(d => d.id !== dashboardId));
    onUpdate({
      ...config,
      definitions: config.definitions,
      calculations: config.calculations,
      thresholds: config.thresholds,
      dashboards: dashboards.filter(d => d.id !== dashboardId),
      alerts: config.alerts,
      reports: config.reports
    });
  };

  const handleAddKPIToDashboard = (dashboardId: string, kpiId: string) => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (!dashboard) return;

    const kpi = config.definitions.find(k => k.id === kpiId);
    if (!kpi) return;

    const newKPIConfig: DashboardKPI = {
      kpiId,
      position: { x: 0, y: 0, width: 2, height: 2 },
      chartType: 'number',
      timeRange: '30d'
    };

    const updatedDashboard = {
      ...dashboard,
      kpis: [...dashboard.kpis, newKPIConfig],
      updatedAt: new Date()
    };

    const updatedDashboards = dashboards.map(d => 
      d.id === dashboardId ? updatedDashboard : d
    );

    setDashboards(updatedDashboards);
    onUpdate({
      ...config,
      definitions: config.definitions,
      calculations: config.calculations,
      thresholds: config.thresholds,
      dashboards: updatedDashboards,
      alerts: config.alerts,
      reports: config.reports
    });
  };

  const handleRemoveKPIFromDashboard = (dashboardId: string, kpiId: string) => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (!dashboard) return;

    const updatedDashboard = {
      ...dashboard,
      kpis: dashboard.kpis.filter(k => k.kpiId !== kpiId),
      updatedAt: new Date()
    };

    const updatedDashboards = dashboards.map(d => 
      d.id === dashboardId ? updatedDashboard : d
    );

    setDashboards(updatedDashboards);
    onUpdate({
      ...config,
      definitions: config.definitions,
      calculations: config.calculations,
      thresholds: config.thresholds,
      dashboards: updatedDashboards,
      alerts: config.alerts,
      reports: config.reports
    });
  };

  const handleUpdateKPIConfig = (dashboardId: string, kpiId: string, updates: Partial<DashboardKPI>) => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (!dashboard) return;

    const updatedDashboard = {
      ...dashboard,
      kpis: dashboard.kpis.map(k => 
        k.kpiId === kpiId ? { ...k, ...updates } : k
      ),
      updatedAt: new Date()
    };

    const updatedDashboards = dashboards.map(d => 
      d.id === dashboardId ? updatedDashboard : d
    );

    setDashboards(updatedDashboards);
    onUpdate({
      ...config,
      definitions: config.definitions,
      calculations: config.calculations,
      thresholds: config.thresholds,
      dashboards: updatedDashboards,
      alerts: config.alerts,
      reports: config.reports
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Dashboard Configuration</h3>
          <p className="text-sm text-gray-500">Create and configure KPI dashboards with drag-and-drop layouts</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Dashboard
        </button>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboards.map((dashboard) => (
          <div key={dashboard.id} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium text-gray-900">{dashboard.name}</h4>
                {dashboard.description && (
                  <p className="text-sm text-gray-500 mt-1">{dashboard.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  dashboard.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {dashboard.isPublic ? 'Public' : 'Private'}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  dashboard.isActive ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                }`}>
                  {dashboard.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Dashboard Preview</div>
              <div 
                className="grid gap-2 p-3 bg-gray-50 rounded border"
                style={{ 
                  gridTemplateColumns: `repeat(${dashboard.layout.columns}, 1fr)`,
                  gridTemplateRows: `repeat(${dashboard.layout.rows}, 1fr)`,
                  height: '200px'
                }}
              >
                {dashboard.kpis.map((kpiConfig, index) => {
                  const kpi = config.definitions.find(k => k.id === kpiConfig.kpiId);
                  const chartType = chartTypes.find(ct => ct.value === kpiConfig.chartType);
                  const ChartIcon = chartType?.icon || ChartBarIcon;
                  
                  return (
                    <div
                      key={kpiConfig.kpiId}
                      className="bg-white border border-gray-200 rounded p-2 flex items-center justify-center"
                      style={{
                        gridColumn: `span ${kpiConfig.position.width}`,
                        gridRow: `span ${kpiConfig.position.height}`
                      }}
                    >
                      <div className="text-center">
                        <ChartIcon className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                        <div className="text-xs font-medium text-gray-900 truncate">
                          {kpi?.name || 'Unknown KPI'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {chartType?.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* KPIs List */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">KPIs ({dashboard.kpis.length})</div>
              <div className="space-y-1">
                {dashboard.kpis.map((kpiConfig) => {
                  const kpi = config.definitions.find(k => k.id === kpiConfig.kpiId);
                  const chartType = chartTypes.find(ct => ct.value === kpiConfig.chartType);
                  
                  return (
                    <div key={kpiConfig.kpiId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <ChartBarIcon className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm text-gray-900">{kpi?.name || 'Unknown KPI'}</span>
                        <span className="text-xs text-gray-500 ml-2">({chartType?.label})</span>
                      </div>
                      <button
                        onClick={() => handleRemoveKPIFromDashboard(dashboard.id, kpiConfig.kpiId)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Available KPIs */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Add KPIs</div>
              <div className="space-y-1">
                {config.definitions
                  .filter(kpi => !dashboard.kpis.some(k => k.kpiId === kpi.id))
                  .map((kpi) => (
                    <button
                      key={kpi.id}
                      onClick={() => handleAddKPIToDashboard(dashboard.id, kpi.id)}
                      className="w-full flex items-center p-2 text-left hover:bg-gray-50 rounded"
                    >
                      <PlusIcon className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm text-gray-900">{kpi.name}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditingDashboard(dashboard);
                    setShowForm(true);
                  }}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteDashboard(dashboard.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-900">
                View Dashboard
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingDashboard ? 'Edit Dashboard' : 'Create Dashboard'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveDashboard({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  isPublic: formData.get('isPublic') === 'on',
                  isActive: true
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dashboard Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingDashboard?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingDashboard?.description}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPublic"
                    defaultChecked={editingDashboard?.isPublic}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Make this dashboard public
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingDashboard(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingDashboard ? 'Update Dashboard' : 'Create Dashboard'}
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

  const loadMockConfig = () => {
    console.log('Loading mock KPI configuration...');
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
      dashboards: [
        {
          id: '1',
          name: 'Sales Performance Dashboard',
          description: 'Key sales metrics and performance indicators',
          kpis: [
            {
              kpiId: '1',
              position: { x: 0, y: 0, width: 2, height: 2 },
              chartType: 'number',
              timeRange: '30d'
            },
            {
              kpiId: '2',
              position: { x: 2, y: 0, width: 2, height: 2 },
              chartType: 'line',
              timeRange: '30d'
            }
          ],
          layout: { columns: 4, rows: 3, gridSize: 20 },
          isPublic: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      alerts: [],
      reports: []
    };
    console.log('Mock config loaded with', mockConfig.definitions.length, 'KPIs');
    setConfig(mockConfig);
    setLoading(false);
  };

  // Helper functions to map database KPI data to component format
  const mapKpiCategory = (kpiName: string): 'sales' | 'marketing' | 'customer' | 'financial' | 'operational' | 'custom' => {
    if (kpiName.includes('win_rate') || kpiName.includes('revenue') || kpiName.includes('deal') || 
        kpiName.includes('quota') || kpiName.includes('pipeline') || kpiName.includes('activities')) {
      return 'sales';
    }
    if (kpiName.includes('lead') || kpiName.includes('conversion') || kpiName.includes('cac')) {
      return 'marketing';
    }
    if (kpiName.includes('clv') || kpiName.includes('customer')) {
      return 'customer';
    }
    if (kpiName.includes('trx') || kpiName.includes('nrx') || kpiName.includes('prescription') || 
        kpiName.includes('pharmaceutical') || kpiName.includes('hcp')) {
      return 'operational';
    }
    if (kpiName.includes('meddpicc') || kpiName.includes('enterprise') || kpiName.includes('chart') || 
        kpiName.includes('data') || kpiName.includes('metric') || kpiName.includes('content')) {
      return 'custom';
    }
    return 'sales';
  };

  const mapKpiType = (calculationMethod: string): 'count' | 'sum' | 'average' | 'percentage' | 'ratio' | 'custom' => {
    if (calculationMethod === 'sql_function') {
      return 'custom';
    }
    if (calculationMethod === 'api_calculation') {
      return 'average';
    }
    return 'custom';
  };

  const getKpiUnit = (kpiName: string): string => {
    if (kpiName.includes('rate') || kpiName.includes('percentage') || kpiName.includes('growth')) {
      return '%';
    }
    if (kpiName.includes('revenue') || kpiName.includes('deal') || kpiName.includes('cac') || kpiName.includes('clv')) {
      return '$';
    }
    if (kpiName.includes('cycle') || kpiName.includes('days') || kpiName.includes('time')) {
      return 'days';
    }
    if (kpiName.includes('activities') || kpiName.includes('calls') || kpiName.includes('leads')) {
      return 'count';
    }
    return 'value';
  };

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      
      // Load KPI definitions from database
      console.log('Loading KPI definitions from database...');
      const { data: kpiDefinitions, error } = await supabase
        .from('kpi_definitions')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      console.log('Database query result:', { kpiDefinitions, error });

      if (error) {
        console.error('Error loading KPI definitions:', error);
        // Fall back to mock data if database fails
        console.log('Falling back to mock data...');
        loadMockConfig();
        return;
      }

      if (!kpiDefinitions || kpiDefinitions.length === 0) {
        console.log('No KPI definitions found in database, falling back to mock data...');
        loadMockConfig();
        return;
      }

      // Transform database KPI definitions to component format
      const transformedDefinitions: KPIDefinition[] = (kpiDefinitions || []).map(kpi => ({
        id: kpi.id,
        name: kpi.display_name,
        description: kpi.description,
        category: mapKpiCategory(kpi.kpi_name),
        type: mapKpiType(kpi.calculation_method),
        formula: kpi.formula,
        dataSource: kpi.data_sources?.[0] || 'custom',
        dimensions: kpi.dimensions?.map(dim => ({ name: dim, type: 'string' as const })) || [],
        frequency: 'daily' as const,
        unit: getKpiUnit(kpi.kpi_name),
        isActive: kpi.is_active,
        createdAt: new Date(kpi.created_at),
        updatedAt: new Date(kpi.updated_at)
      }));

      const config: KPIConfiguration = {
        definitions: transformedDefinitions,
        calculations: [],
        thresholds: [],
        dashboards: [],
        alerts: [],
        reports: []
      };
      
      console.log('Database config loaded with', transformedDefinitions.length, 'KPIs');
      setConfig(config);
    } catch (error) {
      console.error('Error loading KPI configuration:', error);
      // Fall back to mock data on any error
      loadMockConfig();
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
          <DashboardConfiguration config={config} onUpdate={handleConfigUpdate} />
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
