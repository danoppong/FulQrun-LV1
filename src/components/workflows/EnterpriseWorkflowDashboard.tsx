'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CogIcon, 
  PlayIcon, 
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  PlusIcon,
  EyeIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { 
  getEnterpriseWorkflows,
  createEnterpriseWorkflow,
  executeEnterpriseWorkflow,
  getWorkflowExecutions,
  cancelWorkflowExecution,
  retryWorkflowExecution,
  getWorkflowTemplates,
  createWorkflowFromTemplate,
  getWorkflowAnalytics,
  getWorkflowHealth
} from '@/lib/api/enterprise-workflows';
import type {
  EnterpriseWorkflow,
  WorkflowExecution,
} from '@/lib/workflows';

// Define proper types for dashboard data
interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  workflowType: string;
  steps: WorkflowStep[];
}

interface WorkflowAnalytics {
  totalWorkflows: number;
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  runningExecutions: number;
  failedExecutions: number;
  successfulExecutions: number;
  executionTrends: Array<{
    date: string;
    successful: number;
    failed: number;
    executions: number;
  }>;
  mostUsedWorkflows: Array<{
    workflowName: string;
    executionCount: number;
  }>;
}

interface WorkflowHealth {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
}

interface WorkflowFormData {
  name: string;
  description: string;
  type: string;
}

interface EnterpriseWorkflowDashboardProps {
  organizationId: string;
  userId: string;
}

export default function EnterpriseWorkflowDashboard({ organizationId, userId }: EnterpriseWorkflowDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'executions' | 'templates' | 'analytics' | 'monitoring'>('overview');
  const [workflows, setWorkflows] = useState<EnterpriseWorkflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [analytics, setAnalytics] = useState<WorkflowAnalytics | null>(null);
  const [health, setHealth] = useState<WorkflowHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [workflowForm, setWorkflowForm] = useState<Partial<WorkflowFormData>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [organizationId, loadDashboardData]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        workflowsData,
        executionsData,
        templatesData,
        analyticsData,
        healthData
      ] = await Promise.all([
        getEnterpriseWorkflows(organizationId),
        getWorkflowExecutions(organizationId),
        getWorkflowTemplates(),
        getWorkflowAnalytics(organizationId),
        getWorkflowHealth(organizationId)
      ]);
      
      setWorkflows(workflowsData);
      setExecutions(executionsData);
      setTemplates(templatesData);
      setAnalytics(analyticsData);
      setHealth(healthData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const handleCreateWorkflow = async () => {
    try {
      setLoading(true);
      const newWorkflow = await createEnterpriseWorkflow({
        name: workflowForm.name,
        description: workflowForm.description,
        workflowType: workflowForm.type,
        triggerConditions: {},
        steps: [],
        approvalConfig: {
          approvalType: 'sequential',
          approvers: [],
          minApprovals: 1,
          timeoutHours: 24,
          escalationConfig: {
            enabled: false,
            escalationUsers: [],
            escalationDelayMinutes: 0,
            maxEscalations: 0
          }
        },
        notificationConfig: {
          channels: ['email'],
          templates: {},
          recipients: [],
          escalationConfig: {
            enabled: false,
            escalationUsers: [],
            escalationDelayMinutes: 0,
            maxEscalations: 0
          }
        },
        isActive: true,
        priority: 1,
        timeoutHours: 24,
        retryConfig: {
          maxAttempts: 3,
          delayMinutes: 5,
          backoffMultiplier: 2,
          maxDelayMinutes: 60
        },
        organizationId,
        createdBy: userId
      }, userId);
      
      setWorkflows([newWorkflow, ...workflows]);
      setShowCreateModal(false);
      setWorkflowForm({});
    } catch (error) {
      console.error('Error creating workflow:', error);
      alert('Error creating workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async () => {
    try {
      setLoading(true);
      const newWorkflow = await createWorkflowFromTemplate(
        selectedTemplate.id,
        {
          name: workflowForm.name || selectedTemplate.name,
          description: workflowForm.description || selectedTemplate.description
        },
        organizationId,
        userId
      );
      
      setWorkflows([newWorkflow, ...workflows]);
      setShowTemplateModal(false);
      setSelectedTemplate(null);
      setWorkflowForm({});
    } catch (error) {
      console.error('Error creating workflow from template:', error);
      alert('Error creating workflow from template');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      setLoading(true);
      const execution = await executeEnterpriseWorkflow(
        workflowId,
        'opportunity',
        'sample-id',
        { test: true },
        organizationId
      );
      
      alert(`Workflow execution started: ${execution.id}`);
      await loadDashboardData(); // Refresh executions
    } catch (error) {
      console.error('Error executing workflow:', error);
      alert('Error executing workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelExecution = async (executionId: string) => {
    try {
      await cancelWorkflowExecution(executionId);
      alert('Workflow execution cancelled');
      await loadDashboardData(); // Refresh executions
    } catch (error) {
      console.error('Error cancelling execution:', error);
      alert('Error cancelling execution');
    }
  };

  const handleRetryExecution = async (executionId: string) => {
    try {
      await retryWorkflowExecution(executionId);
      alert('Workflow execution retried');
      await loadDashboardData(); // Refresh executions
    } catch (error) {
      console.error('Error retrying execution:', error);
      alert('Error retrying execution');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'running':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'paused':
        return <PauseIcon className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <StopIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'workflows', name: 'Workflows', icon: CogIcon },
    { id: 'executions', name: 'Executions', icon: PlayIcon },
    { id: 'templates', name: 'Templates', icon: DocumentTextIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    { id: 'monitoring', name: 'Monitoring', icon: EyeIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enterprise Workflow Automation</h1>
              <p className="mt-2 text-gray-600">
                Advanced workflow builder with conditional logic, approval processes, and enterprise system integration
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Workflow
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Analytics Overview */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CogIcon className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Workflows</p>
                      <p className="text-2xl font-semibold text-gray-900">{analytics.totalWorkflows}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <PlayIcon className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Executions</p>
                      <p className="text-2xl font-semibold text-gray-900">{analytics.totalExecutions}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Success Rate</p>
                      <p className="text-2xl font-semibold text-gray-900">{Math.round(analytics.successRate)}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ClockIcon className="h-8 w-8 text-purple-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Avg Execution Time</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {Math.round(analytics.averageExecutionTime / 1000)}s
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Health Status */}
            {health && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Workflow Health</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(health.status)}`}>
                    {health.status.toUpperCase()}
                  </span>
                </div>
                
                {health.issues.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Issues:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {health.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {health.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {health.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Recent Executions */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Executions</h3>
              </div>
              <div className="p-6">
                {executions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No recent executions</p>
                ) : (
                  <div className="space-y-4">
                    {executions.slice(0, 5).map((execution) => (
                      <div key={execution.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(execution.status)}
                            <span className="font-medium text-gray-900">{execution.entityType}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{execution.entityId}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(execution.status)}`}>
                            {execution.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Started: {new Date(execution.startedAt).toLocaleString()}</span>
                          <span>Step: {execution.currentStepId || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workflows' && (
          <div className="space-y-6">
            {/* Workflows List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Workflows</h3>
              </div>
              <div className="p-6">
                {workflows.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No workflows created yet</p>
                ) : (
                  <div className="space-y-4">
                    {workflows.map((workflow) => (
                      <div key={workflow.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{workflow.name}</h4>
                            <p className="text-sm text-gray-500">{workflow.description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              workflow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {workflow.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {workflow.workflowType.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Steps</p>
                            <p className="text-sm text-gray-900">{workflow.steps.length}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Priority</p>
                            <p className="text-sm text-gray-900">{workflow.priority}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Timeout</p>
                            <p className="text-sm text-gray-900">{workflow.timeoutHours}h</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleExecuteWorkflow(workflow.id)}
                              disabled={loading}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                              <PlayIcon className="h-4 w-4 mr-2" />
                              Execute
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                              <EyeIcon className="h-4 w-4 mr-2" />
                              View
                            </button>
                            <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                              <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'executions' && (
          <div className="space-y-6">
            {/* Executions List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Workflow Executions</h3>
              </div>
              <div className="p-6">
                {executions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No executions available</p>
                ) : (
                  <div className="space-y-4">
                    {executions.map((execution) => (
                      <div key={execution.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(execution.status)}
                            <span className="font-medium text-gray-900">{execution.entityType}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{execution.entityId}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(execution.status)}`}>
                              {execution.status.toUpperCase()}
                            </span>
                            {execution.status === 'running' && (
                              <button
                                onClick={() => handleCancelExecution(execution.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <StopIcon className="h-4 w-4" />
                              </button>
                            )}
                            {execution.status === 'failed' && (
                              <button
                                onClick={() => handleRetryExecution(execution.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ArrowPathIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Started: {new Date(execution.startedAt).toLocaleString()}</span>
                          <span>Step: {execution.currentStepId || 'N/A'}</span>
                        </div>
                        {execution.errorMessage && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                            {execution.errorMessage}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6">
            {/* Templates */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Workflow Templates</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{template.name}</h4>
                          <p className="text-sm text-gray-500 capitalize">{template.workflowType}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                      
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500 mb-2">Steps: {template.steps.length}</p>
                        <div className="text-xs text-gray-500">
                          {template.steps.map((step, index) => (
                            <span key={index} className="mr-2">
                              {step.stepType}
                              {index < template.steps.length - 1 && ' →'}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowTemplateModal(true);
                        }}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Use Template
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Analytics */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Execution Trends</h3>
                  <div className="space-y-2">
                    {analytics.executionTrends.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{trend.date}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-green-600">{trend.successful}</span>
                          <span className="text-sm text-red-600">{trend.failed}</span>
                          <span className="text-sm text-gray-500">({trend.executions})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Most Used Workflows</h3>
                  <div className="space-y-2">
                    {analytics.mostUsedWorkflows.map((workflow, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{workflow.workflowName}</span>
                        <span className="text-sm font-medium text-gray-900">{workflow.executionCount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            {/* Monitoring */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Monitoring</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{analytics?.runningExecutions || 0}</p>
                  <p className="text-sm text-gray-500">Running Executions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{analytics?.failedExecutions || 0}</p>
                  <p className="text-sm text-gray-500">Failed Executions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{analytics?.successfulExecutions || 0}</p>
                  <p className="text-sm text-gray-500">Successful Executions</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Workflow Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Create New Workflow
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Workflow Name
                    </label>
                    <input
                      type="text"
                      value={workflowForm.name || ''}
                      onChange={(e) => setWorkflowForm({...workflowForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter workflow name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={workflowForm.description || ''}
                      onChange={(e) => setWorkflowForm({...workflowForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter workflow description"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Workflow Type
                    </label>
                    <select
                      value={workflowForm.type || ''}
                      onChange={(e) => setWorkflowForm({...workflowForm, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select workflow type</option>
                      <option value="approval">Approval</option>
                      <option value="notification">Notification</option>
                      <option value="data_sync">Data Sync</option>
                      <option value="ai_trigger">AI Trigger</option>
                      <option value="compliance">Compliance</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setWorkflowForm({});
                    }}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateWorkflow}
                    disabled={loading || !workflowForm.name || !workflowForm.type}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Workflow'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Template Modal */}
        {showTemplateModal && selectedTemplate && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Create Workflow from Template
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Workflow Name
                    </label>
                    <input
                      type="text"
                      value={workflowForm.name || selectedTemplate.name}
                      onChange={(e) => setWorkflowForm({...workflowForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter workflow name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={workflowForm.description || selectedTemplate.description}
                      onChange={(e) => setWorkflowForm({...workflowForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter workflow description"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowTemplateModal(false);
                      setSelectedTemplate(null);
                      setWorkflowForm({});
                    }}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFromTemplate}
                    disabled={loading || !workflowForm.name}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create from Template'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
