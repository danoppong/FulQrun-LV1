// Enterprise Workflows - Main Export File
// Centralized exports for all workflow modules

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define interfaces locally to avoid import issues
export interface EnterpriseWorkflow {
  id: string;
  name: string;
  description: string;
  workflowType: 'approval' | 'notification' | 'data-processing' | 'integration' | 'custom';
  triggerConditions: Record<string, any>;
  steps: WorkflowStep[];
  approvalConfig: ApprovalConfig;
  notificationConfig: NotificationConfig;
  isActive: boolean;
  priority: number;
  timeoutHours: number;
  retryConfig: RetryConfig;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'approval' | 'notification' | 'delay';
  config: Record<string, any>;
  conditions?: WorkflowCondition[];
  actions?: WorkflowAction[];
  nextSteps?: string[];
  errorHandling?: ErrorHandling;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: string;
  config: Record<string, any>;
  parameters: Record<string, any>;
}

export interface ApprovalConfig {
  approvalType: 'sequential' | 'parallel' | 'any';
  approvers: string[];
  minApprovals: number;
  escalationConfig: EscalationConfig;
  timeoutHours: number;
}

export interface NotificationConfig {
  channels: string[];
  templates: Record<string, any>;
  recipients: string[];
  escalationConfig: EscalationConfig;
}

export interface RetryConfig {
  maxAttempts: number;
  delayMinutes: number;
  backoffMultiplier: number;
  maxDelayMinutes: number;
}

export interface ErrorHandling {
  onError: 'stop' | 'retry' | 'continue' | 'escalate';
  retryConfig?: RetryConfig;
  escalationConfig?: EscalationConfig;
}

export interface EscalationConfig {
  enabled: boolean;
  escalationUsers: string[];
  escalationDelayMinutes: number;
  maxEscalations: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  entityType: string;
  entityId: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  currentStepId?: string;
  executionData: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  organizationId: string;
}

export interface WorkflowStepExecution {
  id: string;
  executionId: string;
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  inputData: Record<string, any>;
  outputData?: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface ApprovalRequest {
  id: string;
  workflowExecutionId: string;
  stepId: string;
  approvers: ApprovalUser[];
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestedAt: Date;
  completedAt?: Date;
  comments?: string;
}

export interface ApprovalUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  response?: 'approved' | 'rejected';
  respondedAt?: Date;
  comments?: string;
}

export interface ApprovalResponse {
  requestId: string;
  userId: string;
  response: 'approved' | 'rejected';
  comments?: string;
  respondedAt: Date;
}

export interface ApprovalTemplate {
  id: string;
  name: string;
  description: string;
  approvers: string[];
  approvalType: 'sequential' | 'parallel' | 'any';
  timeoutHours: number;
  organizationId: string;
}

// Core workflow engine
export {
  WorkflowEngine,
  workflowEngine,
} from './workflow-engine';

// Import workflowEngine for use in WorkflowManager
import { workflowEngine } from './workflow-engine';

// Approval processes
export {
  ApprovalProcessManager,
  approvalProcessManager,
} from './approval-processes';

// Workflow factory for creating workflow instances
export class WorkflowFactory {
  static createWorkflow(
    workflowType: string,
    config: Record<string, any>
  ): EnterpriseWorkflow {
    const baseWorkflow: EnterpriseWorkflow = {
      id: config.id || '',
      name: config.name || '',
      description: config.description || '',
      workflowType: workflowType as any,
      triggerConditions: config.triggerConditions || {},
      steps: config.steps || [],
      approvalConfig: config.approvalConfig || {
        approvers: [],
        approvalType: 'sequential',
        minApprovals: 1,
        escalationConfig: { enabled: false, escalationUsers: [], escalationDelayMinutes: 0, maxEscalations: 0 },
        timeoutHours: 24,
      },
      notificationConfig: config.notificationConfig || {
        channels: [],
        templates: {},
        recipients: [],
        escalationConfig: { enabled: false, escalationUsers: [], escalationDelayMinutes: 0, maxEscalations: 0 },
      },
      isActive: config.isActive !== false,
      priority: config.priority || 1,
      timeoutHours: config.timeoutHours || 24,
      retryConfig: config.retryConfig || {
        maxAttempts: 3,
        delayMinutes: 5,
        backoffMultiplier: 2,
        maxDelayMinutes: 60,
      },
      organizationId: config.organizationId || '',
      createdBy: config.createdBy || '',
      createdAt: new Date(),
    };

    return baseWorkflow;
  }
}

// Workflow management utilities
export class WorkflowManager {
  private workflows: Map<string, EnterpriseWorkflow> = new Map();

  async loadWorkflow(workflowId: string): Promise<EnterpriseWorkflow | null> {
    try {
      const { data, error } = await supabase
        .from('enterprise_workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error || !data) return null;

      const workflow: EnterpriseWorkflow = {
        id: data.id,
        name: data.name,
        description: data.description,
        workflowType: data.workflow_type,
        triggerConditions: data.trigger_conditions,
        steps: data.steps,
        approvalConfig: data.approval_config,
        notificationConfig: data.notification_config,
        isActive: data.is_active,
        priority: data.priority,
        timeoutHours: data.timeout_hours,
        retryConfig: data.retry_config,
        organizationId: data.organization_id,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
      };

      this.workflows.set(workflowId, workflow);
      return workflow;
    } catch (error) {
      console.error('Error loading workflow:', error);
      return null;
    }
  }

  async getWorkflow(workflowId: string): Promise<EnterpriseWorkflow | null> {
    if (this.workflows.has(workflowId)) {
      return this.workflows.get(workflowId)!;
    }

    return await this.loadWorkflow(workflowId);
  }

  async createWorkflow(workflow: Omit<EnterpriseWorkflow, 'id' | 'createdAt'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('enterprise_workflows')
        .insert({
          name: workflow.name,
          description: workflow.description,
          workflow_type: workflow.workflowType,
          trigger_conditions: workflow.triggerConditions,
          steps: workflow.steps,
          approval_config: workflow.approvalConfig,
          notification_config: workflow.notificationConfig,
          is_active: workflow.isActive,
          priority: workflow.priority,
          timeout_hours: workflow.timeoutHours,
          retry_config: workflow.retryConfig,
          organization_id: workflow.organizationId,
          created_by: workflow.createdBy,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local cache
      this.workflows.set(data.id, {
        ...workflow,
        id: data.id,
        createdAt: new Date(data.created_at),
      });

      return data.id;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  async updateWorkflow(workflowId: string, updates: Partial<EnterpriseWorkflow>): Promise<void> {
    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.workflowType) updateData.workflow_type = updates.workflowType;
      if (updates.triggerConditions) updateData.trigger_conditions = updates.triggerConditions;
      if (updates.steps) updateData.steps = updates.steps;
      if (updates.approvalConfig) updateData.approval_config = updates.approvalConfig;
      if (updates.notificationConfig) updateData.notification_config = updates.notificationConfig;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.timeoutHours) updateData.timeout_hours = updates.timeoutHours;
      if (updates.retryConfig) updateData.retry_config = updates.retryConfig;

      const { error } = await supabase
        .from('enterprise_workflows')
        .update(updateData)
        .eq('id', workflowId);

      if (error) throw error;

      // Update local cache
      const existingWorkflow = this.workflows.get(workflowId);
      if (existingWorkflow) {
        this.workflows.set(workflowId, { ...existingWorkflow, ...updates });
      }
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('enterprise_workflows')
        .delete()
        .eq('id', workflowId);

      if (error) throw error;

      // Remove from local cache
      this.workflows.delete(workflowId);
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  }

  async getWorkflowsByOrganization(
    organizationId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<EnterpriseWorkflow[]> {
    try {
      const { data, error } = await supabase
        .from('enterprise_workflows')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        workflowType: workflow.workflow_type,
        triggerConditions: workflow.trigger_conditions,
        steps: workflow.steps,
        approvalConfig: workflow.approval_config,
        notificationConfig: workflow.notification_config,
        isActive: workflow.is_active,
        priority: workflow.priority,
        timeoutHours: workflow.timeout_hours,
        retryConfig: workflow.retry_config,
        organizationId: workflow.organization_id,
        createdBy: workflow.created_by,
        createdAt: new Date(workflow.created_at),
      }));
    } catch (error) {
      console.error('Error getting workflows by organization:', error);
      throw error;
    }
  }

  async executeWorkflow(
    workflowId: string,
    entityType: string,
    entityId: string,
    triggerData: Record<string, any>
  ): Promise<WorkflowExecution> {
    return await workflowEngine.executeWorkflow(workflowId, entityType, entityId, triggerData);
  }

  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    return await workflowEngine.getExecutionStatus(executionId);
  }

  async resumeExecution(executionId: string): Promise<void> {
    return await workflowEngine.resumeExecution(executionId);
  }

  async cancelExecution(executionId: string, reason?: string): Promise<void> {
    return await workflowEngine.cancelExecution(executionId, reason);
  }
}

// Singleton instance
export const workflowManager = new WorkflowManager();
