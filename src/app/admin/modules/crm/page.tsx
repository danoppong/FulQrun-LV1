// Administration Module - CRM Configuration Interface
// Comprehensive CRM module configuration management

'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  ChartBarIcon, 
  CogIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowUpDownIcon,
  EyeIcon,
  DocumentTextIcon,
  StarIcon,
  TagIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client';
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface CRMConfiguration {
  leadScoring: {
    enabled: boolean;
    rules: LeadScoringRule[];
    thresholds: {
      hot: number;
      warm: number;
      cold: number;
    };
    autoAssign: boolean;
    assignmentRules: AssignmentRule[];
  };
  pipeline: {
    stages: PipelineStage[];
    defaultStage: string;
    autoAdvance: boolean;
    stageGates: StageGate[];
  };
  meddpicc: {
    enabled: boolean;
    weights: MEDDPICCWeights;
    questions: MEDDPICCQuestion[];
    thresholds: MEDDPICCThresholds;
  };
  automation: {
    workflows: WorkflowRule[];
    triggers: TriggerRule[];
    notifications: NotificationRule[];
  };
  customFields: {
    leadFields: CustomField[];
    contactFields: CustomField[];
    opportunityFields: CustomField[];
  };
}

interface LeadScoringRule {
  id: string;
  name: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_list';
  value: any;
  score: number;
  isActive: boolean;
}

interface AssignmentRule {
  id: string;
  name: string;
  conditions: AssignmentCondition[];
  assignTo: string;
  priority: number;
}

interface AssignmentCondition {
  field: string;
  operator: string;
  value: any;
}

interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number;
  color: string;
  isActive: boolean;
  requirements: string[];
}

interface StageGate {
  id: string;
  stageId: string;
  name: string;
  requirements: GateRequirement[];
  isRequired: boolean;
}

interface GateRequirement {
  type: 'field' | 'document' | 'approval';
  field?: string;
  value?: any;
  approver?: string;
}

interface MEDDPICCWeights {
  metrics: number;
  economicBuyer: number;
  decisionCriteria: number;
  decisionProcess: number;
  paperProcess: number;
  identifyPain: number;
  champion: number;
  competition: number;
}

interface MEDDPICCQuestion {
  id: string;
  pillar: keyof MEDDPICCWeights;
  question: string;
  type: 'text' | 'number' | 'select' | 'multiselect';
  options?: string[];
  weight: number;
}

interface MEDDPICCThresholds {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

interface WorkflowRule {
  id: string;
  name: string;
  trigger: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
}

interface WorkflowCondition {
  field: string;
  operator: string;
  value: any;
}

interface WorkflowAction {
  type: 'email' | 'task' | 'stage_change' | 'assignment' | 'notification';
  config: any;
}

interface TriggerRule {
  id: string;
  name: string;
  event: string;
  conditions: TriggerCondition[];
  actions: TriggerAction[];
  isActive: boolean;
}

interface TriggerCondition {
  field: string;
  operator: string;
  value: any;
}

interface TriggerAction {
  type: string;
  config: any;
}

interface NotificationRule {
  id: string;
  name: string;
  event: string;
  recipients: string[];
  template: string;
  channels: string[];
  isActive: boolean;
}

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'multiselect' | 'textarea';
  required: boolean;
  options?: string[];
  defaultValue?: any;
  validation?: string;
  isActive: boolean;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const LeadScoringRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  field: z.string().min(1, 'Field is required'),
  operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'in_list']),
  value: z.any(),
  score: z.number().min(0, 'Score must be positive'),
  isActive: z.boolean()
});

const PipelineStageSchema = z.object({
  name: z.string().min(1, 'Stage name is required'),
  order: z.number().min(0, 'Order must be positive'),
  probability: z.number().min(0).max(100, 'Probability must be between 0-100'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  isActive: z.boolean(),
  requirements: z.array(z.string())
});

// =============================================================================
// LEAD SCORING CONFIGURATION COMPONENT
// =============================================================================

function LeadScoringConfig({ config, onUpdate }: { config: CRMConfiguration; onUpdate: (config: CRMConfiguration) => void }) {
  const [rules, setRules] = useState<LeadScoringRule[]>(config.leadScoring.rules);
  const [thresholds, setThresholds] = useState(config.leadScoring.thresholds);
  const [autoAssign, setAutoAssign] = useState(config.leadScoring.autoAssign);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<LeadScoringRule | undefined>();

  const fields = [
    { value: 'company_size', label: 'Company Size' },
    { value: 'industry', label: 'Industry' },
    { value: 'job_title', label: 'Job Title' },
    { value: 'email_domain', label: 'Email Domain' },
    { value: 'phone_number', label: 'Phone Number' },
    { value: 'website', label: 'Website' },
    { value: 'budget', label: 'Budget' },
    { value: 'timeline', label: 'Timeline' }
  ];

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'in_list', label: 'In List' }
  ];

  const handleSaveRule = (ruleData: Partial<LeadScoringRule>) => {
    try {
      const validatedData = LeadScoringRuleSchema.parse(ruleData);
      
      if (editingRule) {
        const updatedRules = rules.map(r => 
          r.id === editingRule.id 
            ? { ...r, ...validatedData, id: editingRule.id }
            : r
        );
        setRules(updatedRules);
      } else {
        const newRule: LeadScoringRule = {
          id: Date.now().toString(),
          ...validatedData,
          isActive: true
        };
        setRules([...rules, newRule]);
      }
      
      setShowRuleForm(false);
      setEditingRule(undefined);
      
      // Update parent configuration
      onUpdate({
        ...config,
        leadScoring: {
          ...config.leadScoring,
          rules,
          thresholds,
          autoAssign
        }
      });
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
    onUpdate({
      ...config,
      leadScoring: {
        ...config.leadScoring,
        rules: rules.filter(r => r.id !== ruleId),
        thresholds,
        autoAssign
      }
    });
  };

  const handleToggleRule = (ruleId: string) => {
    const updatedRules = rules.map(r => 
      r.id === ruleId ? { ...r, isActive: !r.isActive } : r
    );
    setRules(updatedRules);
    onUpdate({
      ...config,
      leadScoring: {
        ...config.leadScoring,
        rules: updatedRules,
        thresholds,
        autoAssign
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Lead Scoring Configuration</h3>
          <p className="text-sm text-gray-500">Configure automated lead scoring rules and thresholds</p>
        </div>
        <button
          onClick={() => setShowRuleForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Rule
        </button>
      </div>

      {/* Scoring Thresholds */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Scoring Thresholds</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Hot Lead</label>
            <input
              type="number"
              value={thresholds.hot}
              onChange={(e) => {
                const newThresholds = { ...thresholds, hot: parseInt(e.target.value) };
                setThresholds(newThresholds);
                onUpdate({
                  ...config,
                  leadScoring: { ...config.leadScoring, rules, thresholds: newThresholds, autoAssign }
                });
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Warm Lead</label>
            <input
              type="number"
              value={thresholds.warm}
              onChange={(e) => {
                const newThresholds = { ...thresholds, warm: parseInt(e.target.value) };
                setThresholds(newThresholds);
                onUpdate({
                  ...config,
                  leadScoring: { ...config.leadScoring, rules, thresholds: newThresholds, autoAssign }
                });
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cold Lead</label>
            <input
              type="number"
              value={thresholds.cold}
              onChange={(e) => {
                const newThresholds = { ...thresholds, cold: parseInt(e.target.value) };
                setThresholds(newThresholds);
                onUpdate({
                  ...config,
                  leadScoring: { ...config.leadScoring, rules, thresholds: newThresholds, autoAssign }
                });
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Auto Assignment */}
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={autoAssign}
          onChange={(e) => {
            setAutoAssign(e.target.checked);
            onUpdate({
              ...config,
              leadScoring: { ...config.leadScoring, rules, thresholds, autoAssign: e.target.checked }
            });
          }}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-2 text-sm text-gray-700">Enable automatic lead assignment</label>
      </div>

      {/* Scoring Rules */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {rule.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {fields.find(f => f.value === rule.field)?.label || rule.field}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {operators.find(op => op.value === rule.operator)?.label} {JSON.stringify(rule.value)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {rule.score}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    rule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingRule(rule);
                        setShowRuleForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className={rule.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                    >
                      {rule.isActive ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
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

      {/* Rule Form Modal */}
      {showRuleForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRule ? 'Edit Scoring Rule' : 'Create Scoring Rule'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveRule({
                  name: formData.get('name') as string,
                  field: formData.get('field') as string,
                  operator: formData.get('operator') as any,
                  value: formData.get('value') as string,
                  score: parseInt(formData.get('score') as string),
                  isActive: true
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rule Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingRule?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Field</label>
                  <select
                    name="field"
                    defaultValue={editingRule?.field}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {fields.map(field => (
                      <option key={field.value} value={field.value}>{field.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Operator</label>
                  <select
                    name="operator"
                    defaultValue={editingRule?.operator}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {operators.map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Value</label>
                  <input
                    type="text"
                    name="value"
                    defaultValue={editingRule?.value}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Score</label>
                  <input
                    type="number"
                    name="score"
                    defaultValue={editingRule?.score}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRuleForm(false);
                      setEditingRule(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingRule ? 'Update Rule' : 'Create Rule'}
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
// PIPELINE CONFIGURATION COMPONENT
// =============================================================================

function PipelineConfig({ config, onUpdate }: { config: CRMConfiguration; onUpdate: (config: CRMConfiguration) => void }) {
  const [stages, setStages] = useState<PipelineStage[]>(config.pipeline.stages);
  const [defaultStage, setDefaultStage] = useState(config.pipeline.defaultStage);
  const [autoAdvance, setAutoAdvance] = useState(config.pipeline.autoAdvance);
  const [showStageForm, setShowStageForm] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | undefined>();

  const handleSaveStage = (stageData: Partial<PipelineStage>) => {
    try {
      const validatedData = PipelineStageSchema.parse(stageData);
      
      if (editingStage) {
        const updatedStages = stages.map(s => 
          s.id === editingStage.id 
            ? { ...s, ...validatedData, id: editingStage.id }
            : s
        );
        setStages(updatedStages);
      } else {
        const newStage: PipelineStage = {
          id: Date.now().toString(),
          ...validatedData,
          isActive: true,
          requirements: []
        };
        setStages([...stages, newStage]);
      }
      
      setShowStageForm(false);
      setEditingStage(undefined);
      
      onUpdate({
        ...config,
        pipeline: {
          ...config.pipeline,
          stages,
          defaultStage,
          autoAdvance
        }
      });
    } catch (error) {
      console.error('Error saving stage:', error);
    }
  };

  const handleDeleteStage = (stageId: string) => {
    setStages(stages.filter(s => s.id !== stageId));
    onUpdate({
      ...config,
      pipeline: {
        ...config.pipeline,
        stages: stages.filter(s => s.id !== stageId),
        defaultStage,
        autoAdvance
      }
    });
  };

  const handleReorderStages = (fromIndex: number, toIndex: number) => {
    const newStages = [...stages];
    const [movedStage] = newStages.splice(fromIndex, 1);
    newStages.splice(toIndex, 0, movedStage);
    
    // Update order numbers
    const updatedStages = newStages.map((stage, index) => ({
      ...stage,
      order: index
    }));
    
    setStages(updatedStages);
    onUpdate({
      ...config,
      pipeline: {
        ...config.pipeline,
        stages: updatedStages,
        defaultStage,
        autoAdvance
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Sales Pipeline Configuration</h3>
          <p className="text-sm text-gray-500">Configure sales stages and progression rules</p>
        </div>
        <button
          onClick={() => setShowStageForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Stage
        </button>
      </div>

      {/* Pipeline Settings */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Pipeline Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Default Stage</label>
            <select
              value={defaultStage}
              onChange={(e) => {
                setDefaultStage(e.target.value);
                onUpdate({
                  ...config,
                  pipeline: { ...config.pipeline, stages, defaultStage: e.target.value, autoAdvance }
                });
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {stages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => {
                setAutoAdvance(e.target.checked);
                onUpdate({
                  ...config,
                  pipeline: { ...config.pipeline, stages, defaultStage, autoAdvance: e.target.checked }
                });
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Enable automatic stage advancement</label>
          </div>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="space-y-3">
        {stages
          .sort((a, b) => a.order - b.order)
          .map((stage, index) => (
            <div key={stage.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  ></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{stage.name}</div>
                    <div className="text-sm text-gray-500">{stage.probability}% probability</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    stage.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {stage.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => {
                      setEditingStage(stage);
                      setShowStageForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteStage(stage.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Stage Form Modal */}
      {showStageForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingStage ? 'Edit Pipeline Stage' : 'Create Pipeline Stage'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveStage({
                  name: formData.get('name') as string,
                  order: stages.length,
                  probability: parseInt(formData.get('probability') as string),
                  color: formData.get('color') as string,
                  isActive: true,
                  requirements: []
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stage Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingStage?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Probability (%)</label>
                  <input
                    type="number"
                    name="probability"
                    defaultValue={editingStage?.probability}
                    min="0"
                    max="100"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Color</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="color"
                      name="color"
                      defaultValue={editingStage?.color || '#3B82F6'}
                      className="h-10 w-16 rounded border-gray-300"
                    />
                    <input
                      type="text"
                      name="color"
                      defaultValue={editingStage?.color || '#3B82F6'}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStageForm(false);
                      setEditingStage(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingStage ? 'Update Stage' : 'Create Stage'}
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
// MAIN CRM CONFIGURATION COMPONENT
// =============================================================================

export default function CRMConfiguration() {
  const [config, setConfig] = useState<CRMConfiguration>({
    leadScoring: {
      enabled: true,
      rules: [],
      thresholds: { hot: 80, warm: 50, cold: 20 },
      autoAssign: false,
      assignmentRules: []
    },
    pipeline: {
      stages: [],
      defaultStage: '',
      autoAdvance: false,
      stageGates: []
    },
    meddpicc: {
      enabled: true,
      weights: {
        metrics: 20,
        economicBuyer: 15,
        decisionCriteria: 15,
        decisionProcess: 15,
        paperProcess: 10,
        identifyPain: 10,
        champion: 10,
        competition: 5
      },
      questions: [],
      thresholds: {
        excellent: 80,
        good: 60,
        fair: 40,
        poor: 20
      }
    },
    automation: {
      workflows: [],
      triggers: [],
      notifications: []
    },
    customFields: {
      leadFields: [],
      contactFields: [],
      opportunityFields: []
    }
  });

  const [activeTab, setActiveTab] = useState('leadScoring');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      
      // Mock configuration data
      const mockConfig: CRMConfiguration = {
        leadScoring: {
          enabled: true,
          rules: [
            {
              id: '1',
              name: 'Enterprise Company Size',
              field: 'company_size',
              operator: 'greater_than',
              value: 1000,
              score: 20,
              isActive: true
            },
            {
              id: '2',
              name: 'Tech Industry',
              field: 'industry',
              operator: 'equals',
              value: 'Technology',
              score: 15,
              isActive: true
            }
          ],
          thresholds: { hot: 80, warm: 50, cold: 20 },
          autoAssign: true,
          assignmentRules: []
        },
        pipeline: {
          stages: [
            {
              id: '1',
              name: 'Lead',
              order: 0,
              probability: 10,
              color: '#6B7280',
              isActive: true,
              requirements: []
            },
            {
              id: '2',
              name: 'Qualified',
              order: 1,
              probability: 25,
              color: '#3B82F6',
              isActive: true,
              requirements: []
            },
            {
              id: '3',
              name: 'Proposal',
              order: 2,
              probability: 50,
              color: '#F59E0B',
              isActive: true,
              requirements: []
            },
            {
              id: '4',
              name: 'Negotiation',
              order: 3,
              probability: 75,
              color: '#EF4444',
              isActive: true,
              requirements: []
            },
            {
              id: '5',
              name: 'Closed Won',
              order: 4,
              probability: 100,
              color: '#10B981',
              isActive: true,
              requirements: []
            }
          ],
          defaultStage: '1',
          autoAdvance: true,
          stageGates: []
        },
        meddpicc: {
          enabled: true,
          weights: {
            metrics: 20,
            economicBuyer: 15,
            decisionCriteria: 15,
            decisionProcess: 15,
            paperProcess: 10,
            identifyPain: 10,
            champion: 10,
            competition: 5
          },
          questions: [],
          thresholds: {
            excellent: 80,
            good: 60,
            fair: 40,
            poor: 20
          }
        },
        automation: {
          workflows: [],
          triggers: [],
          notifications: []
        },
        customFields: {
          leadFields: [],
          contactFields: [],
          opportunityFields: []
        }
      };
      
      setConfig(mockConfig);
    } catch (error) {
      console.error('Error loading CRM configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = (updatedConfig: CRMConfiguration) => {
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
    { id: 'leadScoring', name: 'Lead Scoring', icon: StarIcon },
    { id: 'pipeline', name: 'Sales Pipeline', icon: ChartBarIcon },
    { id: 'meddpicc', name: 'MEDDPICC', icon: DocumentTextIcon },
    { id: 'automation', name: 'Automation', icon: CogIcon },
    { id: 'customFields', name: 'Custom Fields', icon: TagIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CRM Configuration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure CRM module settings, lead scoring, pipeline stages, and automation rules
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <StarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Scoring Rules</p>
              <p className="text-2xl font-semibold text-gray-900">{config.leadScoring.rules.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pipeline Stages</p>
              <p className="text-2xl font-semibold text-gray-900">{config.pipeline.stages.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CogIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Workflows</p>
              <p className="text-2xl font-semibold text-gray-900">{config.automation.workflows.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <TagIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Custom Fields</p>
              <p className="text-2xl font-semibold text-gray-900">
                {config.customFields.leadFields.length + 
                 config.customFields.contactFields.length + 
                 config.customFields.opportunityFields.length}
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
        {activeTab === 'leadScoring' && (
          <LeadScoringConfig config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'pipeline' && (
          <PipelineConfig config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'meddpicc' && (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">MEDDPICC Configuration</h3>
            <p className="text-gray-500">MEDDPICC configuration interface coming soon...</p>
          </div>
        )}
        {activeTab === 'automation' && (
          <div className="text-center py-12">
            <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Automation Configuration</h3>
            <p className="text-gray-500">Workflow automation configuration coming soon...</p>
          </div>
        )}
        {activeTab === 'customFields' && (
          <div className="text-center py-12">
            <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Custom Fields Configuration</h3>
            <p className="text-gray-500">Custom fields configuration coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
