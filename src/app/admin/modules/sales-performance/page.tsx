// Administration Module - Sales Performance Configuration
// Comprehensive sales performance module configuration management

'use client';

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon, 
  TrophyIcon, 
  CurrencyDollarIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowUpDownIcon,
  MapIcon,
  UserGroupIcon,
  CalendarIcon,
  PresentationChartBarIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client'
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface SalesPerformanceConfiguration {
  territories: {
    regions: TerritoryRegion[];
    assignments: TerritoryAssignment[];
    rules: TerritoryRule[];
  };
  quotas: {
    plans: QuotaPlan[];
    periods: QuotaPeriod[];
    calculations: QuotaCalculation[];
  };
  compensation: {
    plans: CompensationPlan[];
    structures: CompensationStructure[];
    calculations: CommissionCalculation[];
  };
  targets: {
    goals: SalesGoal[];
    metrics: PerformanceMetric[];
    thresholds: PerformanceThreshold[];
  };
}

interface TerritoryRegion {
  id: string;
  name: string;
  description?: string;
  boundaries: TerritoryBoundary[];
  managerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TerritoryBoundary {
  type: 'state' | 'zipcode' | 'city' | 'custom';
  values: string[];
}

interface TerritoryAssignment {
  id: string;
  territoryId: string;
  userId: string;
  role: 'primary' | 'secondary' | 'backup';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

interface TerritoryRule {
  id: string;
  name: string;
  conditions: TerritoryCondition[];
  assignment: TerritoryAssignmentRule;
  priority: number;
  isActive: boolean;
}

interface TerritoryCondition {
  field: string;
  operator: string;
  value: any;
}

interface TerritoryAssignmentRule {
  assignTo: string;
  role: string;
}

interface QuotaPlan {
  id: string;
  name: string;
  description?: string;
  type: 'revenue' | 'units' | 'activities' | 'mixed';
  targets: QuotaTarget[];
  period: QuotaPeriod;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface QuotaTarget {
  metric: string;
  target: number;
  weight: number;
}

interface QuotaPeriod {
  id: string;
  name: string;
  type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

interface QuotaCalculation {
  id: string;
  planId: string;
  userId: string;
  period: QuotaPeriod;
  actual: number;
  target: number;
  percentage: number;
  status: 'met' | 'exceeded' | 'missed';
  calculatedAt: Date;
}

interface CompensationPlan {
  id: string;
  name: string;
  description?: string;
  type: 'commission' | 'salary' | 'hybrid';
  structure: CompensationStructure;
  tiers: CompensationTier[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CompensationStructure {
  id: string;
  name: string;
  components: CompensationComponent[];
  calculations: CompensationCalculation[];
}

interface CompensationComponent {
  type: 'base_salary' | 'commission' | 'bonus' | 'override';
  name: string;
  calculation: string;
  weight: number;
}

interface CompensationTier {
  id: string;
  name: string;
  minValue: number;
  maxValue: number;
  rate: number;
  type: 'percentage' | 'fixed';
}

interface CommissionCalculation {
  id: string;
  userId: string;
  period: QuotaPeriod;
  revenue: number;
  commission: number;
  rate: number;
  adjustments: CommissionAdjustment[];
  totalCommission: number;
  calculatedAt: Date;
}

interface CommissionAdjustment {
  type: 'bonus' | 'penalty' | 'override';
  amount: number;
  reason: string;
}

interface SalesGoal {
  id: string;
  name: string;
  description?: string;
  type: 'revenue' | 'units' | 'activities' | 'custom';
  target: number;
  current: number;
  period: QuotaPeriod;
  assignees: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PerformanceMetric {
  id: string;
  name: string;
  description?: string;
  type: 'kpi' | 'leading' | 'lagging';
  calculation: string;
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  isActive: boolean;
}

interface PerformanceThreshold {
  id: string;
  metricId: string;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  minValue: number;
  maxValue: number;
  color: string;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const TerritoryRegionSchema = z.object({
  name: z.string().min(1, 'Territory name is required'),
  description: z.string().optional(),
  boundaries: z.array(z.object({
    type: z.enum(['state', 'zipcode', 'city', 'custom']),
    values: z.array(z.string())
  })),
  managerId: z.string().optional(),
  isActive: z.boolean()
});

const QuotaPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().optional(),
  type: z.enum(['revenue', 'units', 'activities', 'mixed']),
  targets: z.array(z.object({
    metric: z.string(),
    target: z.number().min(0),
    weight: z.number().min(0).max(1)
  })),
  isActive: z.boolean()
});

const CompensationPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().optional(),
  type: z.enum(['commission', 'salary', 'hybrid']),
  isActive: z.boolean()
});

// =============================================================================
// TERRITORY MANAGEMENT COMPONENT
// =============================================================================

function TerritoryManagement({ config, onUpdate }: { config: SalesPerformanceConfiguration; onUpdate: (config: SalesPerformanceConfiguration) => void }) {
  const [regions, setRegions] = useState<TerritoryRegion[]>(config.territories.regions);
  const [assignments, setAssignments] = useState<TerritoryAssignment[]>(config.territories.assignments);
  const [showRegionForm, setShowRegionForm] = useState(false);
  const [editingRegion, setEditingRegion] = useState<TerritoryRegion | undefined>();

  const handleSaveRegion = (regionData: Partial<TerritoryRegion>) => {
    try {
      const validatedData = TerritoryRegionSchema.parse(regionData);
      
      if (editingRegion) {
        const updatedRegions = regions.map(r => 
          r.id === editingRegion.id 
            ? { ...r, ...validatedData, id: editingRegion.id, updatedAt: new Date() }
            : r
        );
        setRegions(updatedRegions);
      } else {
        const newRegion: TerritoryRegion = {
          id: Date.now().toString(),
          ...validatedData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setRegions([...regions, newRegion]);
      }
      
      setShowRegionForm(false);
      setEditingRegion(undefined);
      
      onUpdate({
        ...config,
        territories: {
          ...config.territories,
          regions,
          assignments,
          rules: config.territories.rules
        }
      });
    } catch (error) {
      console.error('Error saving territory:', error);
    }
  };

  const handleDeleteRegion = (regionId: string) => {
    setRegions(regions.filter(r => r.id !== regionId));
    onUpdate({
      ...config,
      territories: {
        ...config.territories,
        regions: regions.filter(r => r.id !== regionId),
        assignments,
        rules: config.territories.rules
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Territory Management</h3>
          <p className="text-sm text-gray-500">Configure sales territories and regional assignments</p>
        </div>
        <button
          onClick={() => setShowRegionForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Territory
        </button>
      </div>

      {/* Territory Regions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regions.map((region) => (
          <div key={region.id} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <MapIcon className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="text-sm font-medium text-gray-900">{region.name}</h4>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    setEditingRegion(region);
                    setShowRegionForm(true);
                  }}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteRegion(region.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {region.description && (
              <p className="text-sm text-gray-500 mb-2">{region.description}</p>
            )}
            
            <div className="space-y-1">
              <div className="text-xs text-gray-500">
                Boundaries: {region.boundaries.length} defined
              </div>
              <div className="text-xs text-gray-500">
                Assignments: {assignments.filter(a => a.territoryId === region.id).length}
              </div>
              <div className="text-xs text-gray-500">
                Status: <span className={region.isActive ? 'text-green-600' : 'text-red-600'}>
                  {region.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Region Form Modal */}
      {showRegionForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRegion ? 'Edit Territory' : 'Create Territory'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveRegion({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  boundaries: [{ type: 'state', values: [] }],
                  isActive: true
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Territory Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingRegion?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingRegion?.description}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegionForm(false);
                      setEditingRegion(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingRegion ? 'Update Territory' : 'Create Territory'}
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
// QUOTA MANAGEMENT COMPONENT
// =============================================================================

function QuotaManagement({ config, onUpdate }: { config: SalesPerformanceConfiguration; onUpdate: (config: SalesPerformanceConfiguration) => void }) {
  const [plans, setPlans] = useState<QuotaPlan[]>(config.quotas.plans);
  const [periods, setPeriods] = useState<QuotaPeriod[]>(config.quotas.periods);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<QuotaPlan | undefined>();

  const handleSavePlan = (planData: Partial<QuotaPlan>) => {
    try {
      const validatedData = QuotaPlanSchema.parse(planData);
      
      if (editingPlan) {
        const updatedPlans = plans.map(p => 
          p.id === editingPlan.id 
            ? { ...p, ...validatedData, id: editingPlan.id, updatedAt: new Date() }
            : p
        );
        setPlans(updatedPlans);
      } else {
        const newPlan: QuotaPlan = {
          id: Date.now().toString(),
          ...validatedData,
          period: periods[0] || {} as QuotaPeriod,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setPlans([...plans, newPlan]);
      }
      
      setShowPlanForm(false);
      setEditingPlan(undefined);
      
      onUpdate({
        ...config,
        quotas: {
          ...config.quotas,
          plans,
          periods,
          calculations: config.quotas.calculations
        }
      });
    } catch (error) {
      console.error('Error saving quota plan:', error);
    }
  };

  const handleDeletePlan = (planId: string) => {
    setPlans(plans.filter(p => p.id !== planId));
    onUpdate({
      ...config,
      quotas: {
        ...config.quotas,
        plans: plans.filter(p => p.id !== planId),
        periods,
        calculations: config.quotas.calculations
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Quota Management</h3>
          <p className="text-sm text-gray-500">Configure sales quotas and performance targets</p>
        </div>
        <button
          onClick={() => setShowPlanForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Quota Plan
        </button>
      </div>

      {/* Quota Plans */}
      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <PresentationChartBarIcon className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{plan.name}</h4>
                  <p className="text-sm text-gray-500">{plan.type} quota plan</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  plan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => {
                    setEditingPlan(plan);
                    setShowPlanForm(true);
                  }}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {plan.description && (
              <p className="text-sm text-gray-500 mb-3">{plan.description}</p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plan.targets.map((target, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded">
                  <div className="text-sm font-medium text-gray-900">{target.metric}</div>
                  <div className="text-sm text-gray-500">Target: {target.target.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Weight: {target.weight * 100}%</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Plan Form Modal */}
      {showPlanForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingPlan ? 'Edit Quota Plan' : 'Create Quota Plan'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSavePlan({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  type: formData.get('type') as any,
                  targets: [],
                  isActive: true
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingPlan?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingPlan?.description}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan Type</label>
                  <select
                    name="type"
                    defaultValue={editingPlan?.type}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="revenue">Revenue</option>
                    <option value="units">Units</option>
                    <option value="activities">Activities</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlanForm(false);
                      setEditingPlan(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
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
// COMPENSATION MANAGEMENT COMPONENT
// =============================================================================

function CompensationManagement({ config, onUpdate }: { config: SalesPerformanceConfiguration; onUpdate: (config: SalesPerformanceConfiguration) => void }) {
  const [plans, setPlans] = useState<CompensationPlan[]>(config.compensation.plans);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CompensationPlan | undefined>();

  const handleSavePlan = (planData: Partial<CompensationPlan>) => {
    try {
      const validatedData = CompensationPlanSchema.parse(planData);
      
      if (editingPlan) {
        const updatedPlans = plans.map(p => 
          p.id === editingPlan.id 
            ? { ...p, ...validatedData, id: editingPlan.id, updatedAt: new Date() }
            : p
        );
        setPlans(updatedPlans);
      } else {
        const newPlan: CompensationPlan = {
          id: Date.now().toString(),
          ...validatedData,
          structure: {} as CompensationStructure,
          tiers: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setPlans([...plans, newPlan]);
      }
      
      setShowPlanForm(false);
      setEditingPlan(undefined);
      
      onUpdate({
        ...config,
        compensation: {
          ...config.compensation,
          plans,
          structures: config.compensation.structures,
          calculations: config.compensation.calculations
        }
      });
    } catch (error) {
      console.error('Error saving compensation plan:', error);
    }
  };

  const handleDeletePlan = (planId: string) => {
    setPlans(plans.filter(p => p.id !== planId));
    onUpdate({
      ...config,
      compensation: {
        ...config.compensation,
        plans: plans.filter(p => p.id !== planId),
        structures: config.compensation.structures,
        calculations: config.compensation.calculations
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Compensation Management</h3>
          <p className="text-sm text-gray-500">Configure compensation plans and commission structures</p>
        </div>
        <button
          onClick={() => setShowPlanForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Compensation Plan
        </button>
      </div>

      {/* Compensation Plans */}
      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{plan.name}</h4>
                  <p className="text-sm text-gray-500">{plan.type} compensation plan</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  plan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => {
                    setEditingPlan(plan);
                    setShowPlanForm(true);
                  }}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {plan.description && (
              <p className="text-sm text-gray-500 mb-3">{plan.description}</p>
            )}
            
            <div className="text-sm text-gray-500">
              Tiers: {plan.tiers.length} | Components: {plan.structure.components?.length || 0}
            </div>
          </div>
        ))}
      </div>

      {/* Plan Form Modal */}
      {showPlanForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingPlan ? 'Edit Compensation Plan' : 'Create Compensation Plan'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSavePlan({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  type: formData.get('type') as any,
                  isActive: true
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingPlan?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingPlan?.description}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan Type</label>
                  <select
                    name="type"
                    defaultValue={editingPlan?.type}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="commission">Commission Only</option>
                    <option value="salary">Salary Only</option>
                    <option value="hybrid">Hybrid (Salary + Commission)</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlanForm(false);
                      setEditingPlan(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
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
// MAIN SALES PERFORMANCE CONFIGURATION COMPONENT
// =============================================================================

export default function SalesPerformanceConfiguration() {
  const [config, setConfig] = useState<SalesPerformanceConfiguration>({
    territories: {
      regions: [],
      assignments: [],
      rules: []
    },
    quotas: {
      plans: [],
      periods: [],
      calculations: []
    },
    compensation: {
      plans: [],
      structures: [],
      calculations: []
    },
    targets: {
      goals: [],
      metrics: [],
      thresholds: []
    }
  });

  const [activeTab, setActiveTab] = useState('territories');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      
      // Mock configuration data
      const mockConfig: SalesPerformanceConfiguration = {
        territories: {
          regions: [
            {
              id: '1',
              name: 'West Coast',
              description: 'California, Oregon, Washington',
              boundaries: [
                { type: 'state', values: ['CA', 'OR', 'WA'] }
              ],
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: '2',
              name: 'East Coast',
              description: 'New York, New Jersey, Connecticut',
              boundaries: [
                { type: 'state', values: ['NY', 'NJ', 'CT'] }
              ],
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          assignments: [],
          rules: []
        },
        quotas: {
          plans: [
            {
              id: '1',
              name: 'Q1 Revenue Target',
              description: 'First quarter revenue targets',
              type: 'revenue',
              targets: [
                { metric: 'Revenue', target: 1000000, weight: 1.0 }
              ],
              period: {} as QuotaPeriod,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          periods: [],
          calculations: []
        },
        compensation: {
          plans: [
            {
              id: '1',
              name: 'Standard Commission',
              description: 'Standard commission structure for sales reps',
              type: 'commission',
              structure: {} as CompensationStructure,
              tiers: [],
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          structures: [],
          calculations: []
        },
        targets: {
          goals: [],
          metrics: [],
          thresholds: []
        }
      };
      
      setConfig(mockConfig);
    } catch (error) {
      console.error('Error loading sales performance configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = (updatedConfig: SalesPerformanceConfiguration) => {
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
    { id: 'territories', name: 'Territories', icon: MapIcon },
    { id: 'quotas', name: 'Quotas', icon: PresentationChartBarIcon },
    { id: 'compensation', name: 'Compensation', icon: CurrencyDollarIcon },
    { id: 'targets', name: 'Goals & Targets', icon: TrophyIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Performance Configuration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure territories, quotas, compensation plans, and performance targets
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <MapIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Territories</p>
              <p className="text-2xl font-semibold text-gray-900">{config.territories.regions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <PresentationChartBarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Quota Plans</p>
              <p className="text-2xl font-semibold text-gray-900">{config.quotas.plans.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Compensation Plans</p>
              <p className="text-2xl font-semibold text-gray-900">{config.compensation.plans.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <TrophyIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Sales Goals</p>
              <p className="text-2xl font-semibold text-gray-900">{config.targets.goals.length}</p>
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
        {activeTab === 'territories' && (
          <TerritoryManagement config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'quotas' && (
          <QuotaManagement config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'compensation' && (
          <CompensationManagement config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'targets' && (
          <div className="text-center py-12">
            <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Goals & Targets Configuration</h3>
            <p className="text-gray-500">Sales goals and performance targets configuration coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
