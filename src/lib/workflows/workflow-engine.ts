// Workflow Engine Core
// Core workflow execution engine for enterprise workflow automation

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Core workflow types
export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty';
  value: string | number | boolean;
}

export interface EnterpriseWorkflow {
  id: string;
  name: string;
  description: string;
  workflowType: 'approval' | 'notification' | 'data-processing' | 'integration' | 'custom';
  triggerConditions: Record<string, TriggerCondition>;
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
  stepType: 'condition' | 'action' | 'approval' | 'notification' | 'integration' | 'delay' | 'ai_processing';
  name: string;
  description: string;
  config: Record<string, string | number | boolean>;
  conditions?: WorkflowCondition[];
  actions?: WorkflowAction[];
  nextSteps: string[];
  errorHandling: ErrorHandling;
  timeoutMinutes: number;
}

export interface WorkflowCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty';
  value: string | number | boolean;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  id: string;
  actionType: 'create' | 'update' | 'delete' | 'send_email' | 'send_slack' | 'create_task' | 'assign_user' | 'call_api';
  config: Record<string, string | number | boolean>;
  parameters: Record<string, string | number | boolean>;
}

export interface ApprovalConfig {
  approvers: string[];
  approvalType: 'sequential' | 'parallel' | 'any';
  minApprovals: number;
  escalationConfig: EscalationConfig;
  timeoutHours: number;
}

export interface NotificationConfig {
  channels: ('email' | 'slack' | 'teams' | 'sms')[];
  templates: Record<string, string>;
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
  onError: 'stop' | 'continue' | 'retry' | 'escalate';
  escalationUsers: string[];
  notificationChannels: string[];
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
  executionData: Record<string, string | number | boolean>;
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
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  result?: Record<string, string | number | boolean>;
}

// Core Workflow Engine
export class WorkflowEngine {
  private workflows: Map<string, EnterpriseWorkflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();

  constructor() {
    this.loadWorkflows();
  }

  /**
   * Execute a workflow for a given entity
   */
  async executeWorkflow(
    workflowId: string,
    entityType: string,
    entityId: string,
    triggerData: Record<string, string | number | boolean>
  ): Promise<WorkflowExecution> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      if (!workflow.isActive) {
        throw new Error(`Workflow ${workflowId} is not active`);
      }

      // Check trigger conditions
      if (!this.evaluateTriggerConditions(workflow.triggerConditions, triggerData)) {
        throw new Error('Trigger conditions not met');
      }

      // Create execution
      const execution = await this.createExecution(workflowId, entityType, entityId, triggerData);
      this.executions.set(execution.id, execution);

      // Start execution
      await this.startExecution(execution);

      return execution;
    } catch (error) {
      console.error('Error executing workflow:', error);
      throw error;
    }
  }

  /**
   * Resume a paused workflow execution
   */
  async resumeExecution(executionId: string): Promise<void> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }

      if (execution.status !== 'paused') {
        throw new Error(`Execution ${executionId} is not paused`);
      }

      execution.status = 'running';
      await this.updateExecution(execution);
      await this.continueExecution(execution);
    } catch (error) {
      console.error('Error resuming execution:', error);
      throw error;
    }
  }

  /**
   * Cancel a workflow execution
   */
  async cancelExecution(executionId: string, reason?: string): Promise<void> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }

      execution.status = 'cancelled';
      execution.completedAt = new Date();
      if (reason) {
        execution.errorMessage = reason;
      }

      await this.updateExecution(execution);
    } catch (error) {
      console.error('Error cancelling execution:', error);
      throw error;
    }
  }

  /**
   * Get workflow execution status
   */
  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (error) return null;

      return {
        id: data.id,
        workflowId: data.workflow_id,
        entityType: data.entity_type,
        entityId: data.entity_id,
        status: data.status,
        currentStepId: data.current_step_id,
        executionData: data.execution_data,
        startedAt: new Date(data.started_at),
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        errorMessage: data.error_message,
        organizationId: data.organization_id,
      };
    } catch (error) {
      console.error('Error getting execution status:', error);
      return null;
    }
  }

  /**
   * Get all executions for a workflow
   */
  async getWorkflowExecutions(
    workflowId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<WorkflowExecution[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data.map(execution => ({
        id: execution.id,
        workflowId: execution.workflow_id,
        entityType: execution.entity_type,
        entityId: execution.entity_id,
        status: execution.status,
        currentStepId: execution.current_step_id,
        executionData: execution.execution_data,
        startedAt: new Date(execution.started_at),
        completedAt: execution.completed_at ? new Date(execution.completed_at) : undefined,
        errorMessage: execution.error_message,
        organizationId: execution.organization_id,
      }));
    } catch (error) {
      console.error('Error getting workflow executions:', error);
      throw error;
    }
  }

  // Private methods
  private async loadWorkflows(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('enterprise_workflows')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      for (const workflow of data) {
        this.workflows.set(workflow.id, {
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
        });
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  }

  private async getWorkflow(workflowId: string): Promise<EnterpriseWorkflow | null> {
    if (this.workflows.has(workflowId)) {
      return this.workflows.get(workflowId)!;
    }

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
      console.error('Error getting workflow:', error);
      return null;
    }
  }

  private evaluateTriggerConditions(
    conditions: Record<string, TriggerCondition>,
    data: Record<string, string | number | boolean>
  ): boolean {
    // Evaluate trigger conditions against the provided data
    for (const [field, expectedValue] of Object.entries(conditions)) {
      const actualValue = this.getNestedValue(data, field);
      if (actualValue !== expectedValue) {
        return false;
      }
    }
    return true;
  }

  private async createExecution(
    workflowId: string,
    entityType: string,
    entityId: string,
    triggerData: Record<string, string | number | boolean>
  ): Promise<WorkflowExecution> {
    const { data, error } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflowId,
        entity_type: entityType,
        entity_id: entityId,
        status: 'running',
        execution_data: triggerData,
        started_at: new Date().toISOString(),
        organization_id: triggerData.organizationId,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      workflowId: data.workflow_id,
      entityType: data.entity_type,
      entityId: data.entity_id,
      status: data.status,
      currentStepId: data.current_step_id,
      executionData: data.execution_data,
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      errorMessage: data.error_message,
      organizationId: data.organization_id,
    };
  }

  private async startExecution(execution: WorkflowExecution): Promise<void> {
    try {
      const workflow = await this.getWorkflow(execution.workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Find the first step
      const firstStep = workflow.steps.find(step => 
        !workflow.steps.some(otherStep => otherStep.nextSteps.includes(step.id))
      );

      if (firstStep) {
        execution.currentStepId = firstStep.id;
        await this.updateExecution(execution);
        await this.executeStep(execution, firstStep);
      } else {
        // No steps found, mark as completed
        execution.status = 'completed';
        execution.completedAt = new Date();
        await this.updateExecution(execution);
      }
    } catch (error) {
      execution.status = 'failed';
      execution.errorMessage = (error as Error).message;
      execution.completedAt = new Date();
      await this.updateExecution(execution);
      throw error;
    }
  }

  private async continueExecution(execution: WorkflowExecution): Promise<void> {
    try {
      if (!execution.currentStepId) {
        execution.status = 'completed';
        execution.completedAt = new Date();
        await this.updateExecution(execution);
        return;
      }

      const workflow = await this.getWorkflow(execution.workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const currentStep = workflow.steps.find(step => step.id === execution.currentStepId);
      if (!currentStep) {
        throw new Error('Current step not found');
      }

      await this.executeStep(execution, currentStep);
    } catch (error) {
      execution.status = 'failed';
      execution.errorMessage = (error as Error).message;
      execution.completedAt = new Date();
      await this.updateExecution(execution);
      throw error;
    }
  }

  private async executeStep(execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    try {
      // Create step execution record
      const stepExecution = await this.createStepExecution(execution.id, step.id);

      // Evaluate conditions if any
      if (step.conditions && step.conditions.length > 0) {
        const conditionsMet = this.evaluateStepConditions(step.conditions, execution.executionData);
        if (!conditionsMet) {
          await this.updateStepExecution(stepExecution.id, 'skipped');
          await this.moveToNextStep(execution, step);
          return;
        }
      }

      // Execute step based on type
      switch (step.stepType) {
        case 'condition':
          await this.executeConditionStep(execution, step);
          break;
        case 'action':
          await this.executeActionStep(execution, step);
          break;
        case 'approval':
          await this.executeApprovalStep(execution, step);
          break;
        case 'notification':
          await this.executeNotificationStep(execution, step);
          break;
        case 'integration':
          await this.executeIntegrationStep(execution, step);
          break;
        case 'delay':
          await this.executeDelayStep(execution, step);
          break;
        case 'ai_processing':
          await this.executeAIProcessingStep(execution, step);
          break;
        default:
          throw new Error(`Unknown step type: ${step.stepType}`);
      }

      await this.updateStepExecution(stepExecution.id, 'completed');
      await this.moveToNextStep(execution, step);
    } catch (error) {
      console.error(`Error executing step ${step.id}:`, error);
      
      // Handle error based on step configuration
      switch (step.errorHandling.onError) {
        case 'stop':
          execution.status = 'failed';
          execution.errorMessage = (error as Error).message;
          execution.completedAt = new Date();
          await this.updateExecution(execution);
          break;
        case 'continue':
          await this.moveToNextStep(execution, step);
          break;
        case 'retry':
          await this.retryStep(execution, step);
          break;
        case 'escalate':
          await this.escalateStep(execution, step, error);
          break;
      }
    }
  }

  private evaluateStepConditions(
    conditions: WorkflowCondition[],
    data: Record<string, string | number | boolean>
  ): boolean {
    let result = true;
    let logicalOperator: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const fieldValue = this.getNestedValue(data, condition.field);
      let conditionResult = false;

      switch (condition.operator) {
        case 'equals':
          conditionResult = fieldValue === condition.value;
          break;
        case 'not_equals':
          conditionResult = fieldValue !== condition.value;
          break;
        case 'greater_than':
          conditionResult = fieldValue > condition.value;
          break;
        case 'less_than':
          conditionResult = fieldValue < condition.value;
          break;
        case 'contains':
          conditionResult = String(fieldValue).includes(String(condition.value));
          break;
        case 'not_contains':
          conditionResult = !String(fieldValue).includes(String(condition.value));
          break;
        case 'is_empty':
          conditionResult = !fieldValue || fieldValue === '';
          break;
        case 'is_not_empty':
          conditionResult = fieldValue && fieldValue !== '';
          break;
      }

      if (condition.logicalOperator) {
        logicalOperator = condition.logicalOperator;
      }

      if (logicalOperator === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }
    }

    return result;
  }

  private async moveToNextStep(execution: WorkflowExecution, currentStep: WorkflowStep): Promise<void> {
    if (currentStep.nextSteps.length === 0) {
      // No next steps, workflow is complete
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.currentStepId = undefined;
      await this.updateExecution(execution);
      return;
    }

    // Move to the first next step
    execution.currentStepId = currentStep.nextSteps[0];
    await this.updateExecution(execution);

    // Continue execution
    await this.continueExecution(execution);
  }

  private async createStepExecution(executionId: string, stepId: string): Promise<WorkflowStepExecution> {
    const { data, error } = await supabase
      .from('workflow_step_executions')
      .insert({
        execution_id: executionId,
        step_id: stepId,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      executionId: data.execution_id,
      stepId: data.step_id,
      status: data.status,
      startedAt: data.started_at ? new Date(data.started_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      errorMessage: data.error_message,
      result: data.result,
    };
  }

  private async updateStepExecution(stepExecutionId: string, status: string, result?: Record<string, string | number | boolean>): Promise<void> {
    const updateData: Record<string, string | number | boolean | undefined> = {
      status,
      completed_at: status === 'completed' || status === 'failed' || status === 'skipped' 
        ? new Date().toISOString() 
        : undefined,
    };

    if (result) {
      updateData.result = result;
    }

    await supabase
      .from('workflow_step_executions')
      .update(updateData)
      .eq('id', stepExecutionId);
  }

  private async updateExecution(execution: WorkflowExecution): Promise<void> {
    await supabase
      .from('workflow_executions')
      .update({
        status: execution.status,
        current_step_id: execution.currentStepId,
        execution_data: execution.executionData,
        completed_at: execution.completedAt?.toISOString(),
        error_message: execution.errorMessage,
      })
      .eq('id', execution.id);
  }

  private getNestedValue(obj: Record<string, string | number | boolean>, path: string): string | number | boolean | undefined {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Step execution methods (to be implemented by specific step handlers)
  private async executeConditionStep(execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    // Condition step execution logic
    console.log(`Executing condition step: ${step.name}`);
  }

  private async executeActionStep(execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    // Action step execution logic
    console.log(`Executing action step: ${step.name}`);
  }

  private async executeApprovalStep(execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    // Approval step execution logic
    console.log(`Executing approval step: ${step.name}`);
  }

  private async executeNotificationStep(execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    // Notification step execution logic
    console.log(`Executing notification step: ${step.name}`);
  }

  private async executeIntegrationStep(execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    // Integration step execution logic
    console.log(`Executing integration step: ${step.name}`);
  }

  private async executeDelayStep(execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    // Delay step execution logic
    console.log(`Executing delay step: ${step.name}`);
  }

  private async executeAIProcessingStep(execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    // AI processing step execution logic
    console.log(`Executing AI processing step: ${step.name}`);
  }

  private async retryStep(execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    // Retry step logic
    console.log(`Retrying step: ${step.name}`);
  }

  private async escalateStep(execution: WorkflowExecution, step: WorkflowStep, error: Error): Promise<void> {
    // Escalate step logic
    console.log(`Escalating step: ${step.name}`, error);
  }
}

// Singleton instance
export const workflowEngine = new WorkflowEngine();
