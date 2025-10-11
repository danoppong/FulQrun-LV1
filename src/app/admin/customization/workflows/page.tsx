// Administration Module - Workflow Builder Interface
// Visual workflow automation builder

'use client';

import React, { useState, useEffect } from 'react';
import {
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
  DocumentTextIcon,
  ServerIcon,
  ShieldCheckIcon,
  BellIcon,
  UserIcon,
  TagIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  RectangleStackIcon,
  CursorArrowRaysIcon,
  PaintBrushIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowRightIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client'
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface WorkflowBuilderConfiguration {
  workflows: Workflow[];
  templates: WorkflowTemplate[];
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  category: 'lead_management' | 'sales_process' | 'customer_service' | 'marketing' | 'notifications' | 'data_processing' | 'custom';
  status: 'draft' | 'active' | 'paused' | 'archived';
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  settings: WorkflowSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowTrigger {
  id: string;
  type: 'event' | 'schedule' | 'webhook' | 'manual' | 'api';
  name: string;
  description?: string;
  configuration: TriggerConfiguration;
  isActive: boolean;
}

interface TriggerConfiguration {
  eventType?: string;
  entityType?: string;
  conditions?: TriggerCondition[];
  schedule?: ScheduleConfiguration;
  webhookUrl?: string;
  apiEndpoint?: string;
}

interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: unknown;
}

interface ScheduleConfiguration {
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  time: string;
  timezone: string;
  cronExpression?: string;
}

interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'delay' | 'webhook' | 'email' | 'notification' | 'data_update' | 'custom';
  action?: WorkflowAction;
  condition?: WorkflowCondition;
  delay?: DelayConfiguration;
  position: StepPosition;
  connections: StepConnection[];
  isActive: boolean;
}

interface StepPosition {
  x: number;
  y: number;
}

interface StepConnection {
  fromStepId: string;
  toStepId: string;
  condition?: string;
  label?: string;
}

interface WorkflowAction {
  id: string;
  name: string;
  type: 'email' | 'notification' | 'data_update' | 'webhook' | 'api_call' | 'file_operation' | 'custom';
  description?: string;
  configuration: ActionConfiguration;
  isActive: boolean;
}

interface ActionConfiguration {
  emailTemplate?: string;
  recipients?: string[];
  dataFields?: Record<string, unknown>;
  webhookUrl?: string;
  apiEndpoint?: string;
  filePath?: string;
  customScript?: string;
}

interface WorkflowCondition {
  id: string;
  name: string;
  description?: string;
  type: 'field_comparison' | 'data_lookup' | 'custom_script';
  configuration: ConditionConfiguration;
  isActive: boolean;
}

interface ConditionConfiguration {
  field?: string;
  operator?: string;
  value?: unknown;
  lookupTable?: string;
  lookupField?: string;
  customScript?: string;
}

interface DelayConfiguration {
  duration: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
  reason?: string;
}

interface WorkflowSettings {
  maxExecutions: number;
  timeoutMinutes: number;
  retryAttempts: number;
  retryDelay: number;
  errorHandling: 'stop' | 'continue' | 'retry';
  notifications: NotificationSettings;
}

interface NotificationSettings {
  onSuccess: boolean;
  onFailure: boolean;
  onTimeout: boolean;
  recipients: string[];
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const WorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  category: z.enum(['lead_management', 'sales_process', 'customer_service', 'marketing', 'notifications', 'data_processing', 'custom']),
  status: z.enum(['draft', 'active', 'paused', 'archived']),
  isActive: z.boolean()
});

const WorkflowTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  isActive: z.boolean()
});

// =============================================================================
// WORKFLOW BUILDER COMPONENT
// =============================================================================

function WorkflowBuilder({ config, onUpdate }: { config: WorkflowBuilderConfiguration; onUpdate: (config: WorkflowBuilderConfiguration) => void }) {
  const [workflows, setWorkflows] = useState<Workflow[]>(config.workflows);
  const [showForm, setShowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | undefined>();

  const categories = [
    { value: 'lead_management', label: 'Lead Management', color: 'bg-blue-100 text-blue-800' },
    { value: 'sales_process', label: 'Sales Process', color: 'bg-green-100 text-green-800' },
    { value: 'customer_service', label: 'Customer Service', color: 'bg-purple-100 text-purple-800' },
    { value: 'marketing', label: 'Marketing', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'notifications', label: 'Notifications', color: 'bg-red-100 text-red-800' },
    { value: 'data_processing', label: 'Data Processing', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'custom', label: 'Custom', color: 'bg-gray-100 text-gray-800' }
  ];

  const statuses = [
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'paused', label: 'Paused', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'archived', label: 'Archived', color: 'bg-red-100 text-red-800' }
  ];

  const handleSaveWorkflow = (workflowData: Partial<Workflow>) => {
    try {
      const validatedData = WorkflowSchema.parse(workflowData);
      
      if (editingWorkflow) {
        const updatedWorkflows = workflows.map(w => 
          w.id === editingWorkflow.id 
            ? { ...w, ...validatedData, id: editingWorkflow.id, updatedAt: new Date() }
            : w
        );
        setWorkflows(updatedWorkflows);
      } else {
        const newWorkflow: Workflow = {
          id: Date.now().toString(),
          ...validatedData,
          trigger: {
            id: '1',
            type: 'event',
            name: 'Default Trigger',
            configuration: {}
          },
          steps: [],
          settings: {
            maxExecutions: 1000,
            timeoutMinutes: 30,
            retryAttempts: 3,
            retryDelay: 5,
            errorHandling: 'stop',
            notifications: {
              onSuccess: false,
              onFailure: true,
              onTimeout: true,
              recipients: []
            }
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setWorkflows([...workflows, newWorkflow]);
      }
      
      setShowForm(false);
      setEditingWorkflow(undefined);
      
      onUpdate({
        ...config,
        workflows,
        templates: config.templates,
        triggers: config.triggers,
        actions: config.actions,
        conditions: config.conditions
      });
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    setWorkflows(workflows.filter(w => w.id !== workflowId));
    onUpdate({
      ...config,
      workflows: workflows.filter(w => w.id !== workflowId),
      templates: config.templates,
      triggers: config.triggers,
      actions: config.actions,
      conditions: config.conditions
    });
  };

  const handleToggleWorkflow = (workflowId: string) => {
    const updatedWorkflows = workflows.map(w => 
      w.id === workflowId ? { ...w, isActive: !w.isActive, updatedAt: new Date() } : w
    );
    setWorkflows(updatedWorkflows);
    onUpdate({
      ...config,
      workflows: updatedWorkflows,
      templates: config.templates,
      triggers: config.triggers,
      actions: config.actions,
      conditions: config.conditions
    });
  };

  const handleStatusChange = (workflowId: string, newStatus: string) => {
    const updatedWorkflows = workflows.map(w => 
      w.id === workflowId ? { ...w, status: newStatus as unknown, updatedAt: new Date() } : w
    );
    setWorkflows(updatedWorkflows);
    onUpdate({
      ...config,
      workflows: updatedWorkflows,
      templates: config.templates,
      triggers: config.triggers,
      actions: config.actions,
      conditions: config.conditions
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Workflow Builder</h3>
          <p className="text-sm text-gray-500">Create and manage automated workflows</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Workflow
        </button>
      </div>

      {/* Workflows Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workflow Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trigger</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Steps</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {workflows.map((workflow) => {
              const category = categories.find(c => c.value === workflow.category);
              const status = statuses.find(s => s.value === workflow.status);
              
              return (
                <tr key={workflow.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{workflow.name}</div>
                      {workflow.description && (
                        <div className="text-sm text-gray-500">{workflow.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category?.color}`}>
                      {category?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status?.color}`}>
                      {status?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {workflow.trigger.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {workflow.steps.length} steps
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStatusChange(workflow.id, workflow.status === 'active' ? 'paused' : 'active')}
                        className={workflow.status === 'active' ? "text-yellow-600 hover:text-yellow-900" : "text-green-600 hover:text-green-900"}
                        title={workflow.status === 'active' ? "Pause workflow" : "Activate workflow"}
                      >
                        {workflow.status === 'active' ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingWorkflow(workflow);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteWorkflow(workflow.id)}
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

      {/* Workflow Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingWorkflow ? 'Edit Workflow' : 'Create Workflow'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveWorkflow({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  category: formData.get('category') as unknown,
                  status: formData.get('status') as unknown,
                  isActive: formData.get('isActive') === 'on'
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Workflow Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingWorkflow?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingWorkflow?.description}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      name="category"
                      defaultValue={editingWorkflow?.category}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      name="status"
                      defaultValue={editingWorkflow?.status}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {statuses.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={editingWorkflow?.isActive}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Active workflow</label>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Workflow Builder</h4>
                  <p className="text-sm text-blue-700">
                    After creating the workflow, you&apos;ll be able to use the visual workflow builder to add triggers, 
                    steps, conditions, and actions.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingWorkflow(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingWorkflow ? 'Update Workflow' : 'Create Workflow'}
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
// WORKFLOW TEMPLATES COMPONENT
// =============================================================================

function WorkflowTemplates({ config, onUpdate }: { config: WorkflowBuilderConfiguration; onUpdate: (config: WorkflowBuilderConfiguration) => void }) {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>(config.templates);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | undefined>();

  const categories = [
    { value: 'lead_management', label: 'Lead Management', color: 'bg-blue-100 text-blue-800' },
    { value: 'sales_process', label: 'Sales Process', color: 'bg-green-100 text-green-800' },
    { value: 'customer_service', label: 'Customer Service', color: 'bg-purple-100 text-purple-800' },
    { value: 'marketing', label: 'Marketing', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'notifications', label: 'Notifications', color: 'bg-red-100 text-red-800' },
    { value: 'data_processing', label: 'Data Processing', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'custom', label: 'Custom', color: 'bg-gray-100 text-gray-800' }
  ];

  const handleSaveTemplate = (templateData: Partial<WorkflowTemplate>) => {
    try {
      const validatedData = WorkflowTemplateSchema.parse(templateData);
      
      if (editingTemplate) {
        const updatedTemplates = templates.map(t => 
          t.id === editingTemplate.id 
            ? { ...t, ...validatedData, id: editingTemplate.id, updatedAt: new Date() }
            : t
        );
        setTemplates(updatedTemplates);
      } else {
        const newTemplate: WorkflowTemplate = {
          id: Date.now().toString(),
          ...validatedData,
          trigger: {
            id: '1',
            type: 'event',
            name: 'Default Trigger',
            configuration: {}
          },
          steps: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setTemplates([...templates, newTemplate]);
      }
      
      setShowForm(false);
      setEditingTemplate(undefined);
      
      onUpdate({
        ...config,
        workflows: config.workflows,
        templates,
        triggers: config.triggers,
        actions: config.actions,
        conditions: config.conditions
      });
    } catch (error) {
      console.error('Error saving workflow template:', error);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    onUpdate({
      ...config,
      workflows: config.workflows,
      templates: templates.filter(t => t.id !== templateId),
      triggers: config.triggers,
      actions: config.actions,
      conditions: config.conditions
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Workflow Templates</h3>
          <p className="text-sm text-gray-500">Pre-built workflow templates for common automation scenarios</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const category = categories.find(c => c.value === template.category);
          
          return (
            <div key={template.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                  {template.description && (
                    <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingTemplate(template);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Category</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${category?.color}`}>
                    {category?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Steps</span>
                  <span className="text-xs text-gray-900">{template.steps.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`text-xs ${template.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTemplate ? 'Edit Workflow Template' : 'Create Workflow Template'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveTemplate({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  category: formData.get('category') as string,
                  isActive: true
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Template Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingTemplate?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingTemplate?.description}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    name="category"
                    defaultValue={editingTemplate?.category}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingTemplate(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingTemplate ? 'Update Template' : 'Create Template'}
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
// MAIN WORKFLOW BUILDER COMPONENT
// =============================================================================

export default function WorkflowBuilderManagement() {
  const [config, setConfig] = useState<WorkflowBuilderConfiguration>({
    workflows: [],
    templates: [],
    triggers: [],
    actions: [],
    conditions: []
  });

  const [activeTab, setActiveTab] = useState('workflows');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock workflows data
      const mockWorkflows: Workflow[] = [
        {
          id: '1',
          name: 'Lead Qualification Workflow',
          description: 'Automatically qualify leads based on criteria',
          category: 'lead_management',
          status: 'active',
          trigger: {
            id: '1',
            type: 'event',
            name: 'New Lead Created',
            configuration: {
              eventType: 'lead_created',
              entityType: 'lead'
            }
          },
          steps: [],
          settings: {
            maxExecutions: 1000,
            timeoutMinutes: 30,
            retryAttempts: 3,
            retryDelay: 5,
            errorHandling: 'stop',
            notifications: {
              onSuccess: false,
              onFailure: true,
              onTimeout: true,
              recipients: ['admin@company.com']
            }
          },
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '2',
          name: 'Follow-up Email Sequence',
          description: 'Send follow-up emails to new contacts',
          category: 'marketing',
          status: 'paused',
          trigger: {
            id: '2',
            type: 'event',
            name: 'Contact Created',
            configuration: {
              eventType: 'contact_created',
              entityType: 'contact'
            }
          },
          steps: [],
          settings: {
            maxExecutions: 500,
            timeoutMinutes: 15,
            retryAttempts: 2,
            retryDelay: 10,
            errorHandling: 'continue',
            notifications: {
              onSuccess: false,
              onFailure: true,
              onTimeout: false,
              recipients: []
            }
          },
          isActive: true,
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-09-30')
        }
      ];

      // Mock templates data
      const mockTemplates: WorkflowTemplate[] = [
        {
          id: '1',
          name: 'Lead Nurturing Template',
          description: 'Template for nurturing new leads',
          category: 'lead_management',
          trigger: {
            id: '1',
            type: 'event',
            name: 'New Lead',
            configuration: {}
          },
          steps: [],
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '2',
          name: 'Customer Onboarding Template',
          description: 'Template for customer onboarding process',
          category: 'customer_service',
          trigger: {
            id: '2',
            type: 'event',
            name: 'Customer Signed Up',
            configuration: {}
          },
          steps: [],
          isActive: true,
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-09-30')
        }
      ];
      
      setConfig({
        ...config,
        workflows: mockWorkflows,
        templates: mockTemplates
      });
    } catch (error) {
      console.error('Error loading workflow builder data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = (updatedConfig: WorkflowBuilderConfiguration) => {
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
    { id: 'workflows', name: 'Workflows', icon: ArrowPathIcon },
    { id: 'templates', name: 'Templates', icon: DocumentTextIcon },
    { id: 'triggers', name: 'Triggers', icon: PlayIcon },
    { id: 'actions', name: 'Actions', icon: CogIcon },
    { id: 'conditions', name: 'Conditions', icon: ShieldCheckIcon }
  ];

  const activeWorkflows = config.workflows.filter(w => w.isActive).length;
  const totalWorkflows = config.workflows.length;
  const activeTemplates = config.templates.filter(t => t.isActive).length;
  const totalTemplates = config.templates.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workflow Builder</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create and manage automated workflows with visual builder
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ArrowPathIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Workflows</p>
              <p className="text-2xl font-semibold text-gray-900">{activeWorkflows}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Workflows</p>
              <p className="text-2xl font-semibold text-gray-900">{totalWorkflows}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Templates</p>
              <p className="text-2xl font-semibold text-gray-900">{activeTemplates}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <PlayIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Triggers</p>
              <p className="text-2xl font-semibold text-gray-900">{config.triggers.length}</p>
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
        {activeTab === 'workflows' && (
          <WorkflowBuilder config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'templates' && (
          <WorkflowTemplates config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'triggers' && (
          <div className="text-center py-12">
            <PlayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Workflow Triggers</h3>
            <p className="text-gray-500">Trigger management coming soon...</p>
          </div>
        )}
        {activeTab === 'actions' && (
          <div className="text-center py-12">
            <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Workflow Actions</h3>
            <p className="text-gray-500">Action management coming soon...</p>
          </div>
        )}
        {activeTab === 'conditions' && (
          <div className="text-center py-12">
            <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Workflow Conditions</h3>
            <p className="text-gray-500">Condition management coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
