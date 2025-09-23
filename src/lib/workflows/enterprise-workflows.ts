// Enterprise Workflow Automation
// Advanced workflow builder with conditional logic, approval processes, and enterprise system integration

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types for enterprise workflow automation
export interface EnterpriseWorkflow {
  id: string;
  name: string;
  description: string;
  workflowType: 'approval' | 'notification' | 'data_sync' | 'ai_trigger' | 'compliance' | 'custom';
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
  stepType: 'condition' | 'action' | 'approval' | 'notification' | 'integration' | 'delay' | 'ai_processing';
  name: string;
  description: string;
  config: Record<string, any>;
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
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  id: string;
  actionType: 'update_field' | 'create_record' | 'send_email' | 'create_task' | 'call_api' | 'execute_script';
  config: Record<string, any>;
  parameters: Record<string, any>;
}

export interface ApprovalConfig {
  approvalType: 'single' | 'multiple' | 'sequential' | 'parallel';
  approvers: string[];
  approvalCriteria: Record<string, any>;
  escalationRules: EscalationRule[];
  timeoutHours: number;
  requireAllApprovers: boolean;
}

export interface EscalationRule {
  id: string;
  triggerAfterHours: number;
  escalateTo: string[];
  notificationMessage: string;
}

export interface NotificationConfig {
  channels: ('email' | 'sms' | 'slack' | 'teams' | 'webhook')[];
  templates: Record<string, string>;
  recipients: string[];
  conditions: WorkflowCondition[];
}

export interface RetryConfig {
  maxRetries: number;
  retryIntervalMinutes: number;
  backoffMultiplier: number;
  retryConditions: string[];
}

export interface ErrorHandling {
  onError: 'stop' | 'continue' | 'retry' | 'escalate';
  errorActions: WorkflowAction[];
  escalationRecipients: string[];
  errorNotification: boolean;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  entityType: string;
  entityId: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  currentStep: string;
  executedSteps: string[];
  pendingSteps: string[];
  executionData: Record<string, any>;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
  organizationId: string;
}

// Enterprise Workflow Automation API
export class EnterpriseWorkflowAPI {
  // Workflow Management
  static async createWorkflow(
    workflow: Omit<EnterpriseWorkflow, 'id' | 'createdAt'>,
    userId: string
  ): Promise<EnterpriseWorkflow> {
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
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;

      return {
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
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  static async getWorkflows(organizationId: string): Promise<EnterpriseWorkflow[]> {
    try {
      const { data, error } = await supabase
        .from('enterprise_workflows')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

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
        createdAt: new Date(workflow.created_at)
      }));
    } catch (error) {
      console.error('Error fetching workflows:', error);
      throw error;
    }
  }

  // Workflow Execution
  static async executeWorkflow(
    workflowId: string,
    entityType: string,
    entityId: string,
    executionData: Record<string, any>,
    organizationId: string
  ): Promise<WorkflowExecution> {
    try {
      // Get workflow definition
      const { data: workflow } = await supabase
        .from('enterprise_workflows')
        .select('*')
        .eq('id', workflowId)
        .eq('organization_id', organizationId)
        .single();

      if (!workflow) throw new Error('Workflow not found');

      // Create execution record
      const executionId = crypto.randomUUID();
      const execution: WorkflowExecution = {
        id: executionId,
        workflowId,
        entityType,
        entityId,
        status: 'running',
        currentStep: workflow.steps[0]?.id || '',
        executedSteps: [],
        pendingSteps: workflow.steps.map(step => step.id),
        executionData,
        startedAt: new Date(),
        organizationId
      };

      // Store execution
      await supabase
        .from('workflow_executions')
        .insert({
          id: execution.id,
          workflow_id: execution.workflowId,
          entity_type: execution.entityType,
          entity_id: execution.entityId,
          status: execution.status,
          current_step: execution.currentStep,
          executed_steps: execution.executedSteps,
          pending_steps: execution.pendingSteps,
          execution_data: execution.executionData,
          started_at: execution.startedAt.toISOString(),
          organization_id: execution.organizationId
        });

      // Start execution asynchronously
      this.processWorkflowExecution(execution, workflow);

      return execution;
    } catch (error) {
      console.error('Error executing workflow:', error);
      throw error;
    }
  }

  private static async processWorkflowExecution(
    execution: WorkflowExecution,
    workflow: any
  ): Promise<void> {
    try {
      while (execution.status === 'running' && execution.pendingSteps.length > 0) {
        const currentStepId = execution.currentStep;
        const currentStep = workflow.steps.find((step: any) => step.id === currentStepId);
        
        if (!currentStep) {
          execution.status = 'failed';
          execution.errorMessage = 'Step not found';
          break;
        }

        // Execute step
        const stepResult = await this.executeWorkflowStep(currentStep, execution);
        
        if (stepResult.success) {
          execution.executedSteps.push(currentStepId);
          execution.pendingSteps = execution.pendingSteps.filter(id => id !== currentStepId);
          
          // Determine next step
          if (currentStep.nextSteps && currentStep.nextSteps.length > 0) {
            execution.currentStep = currentStep.nextSteps[0];
          } else if (execution.pendingSteps.length > 0) {
            execution.currentStep = execution.pendingSteps[0];
          } else {
            execution.status = 'completed';
            execution.completedAt = new Date();
          }
        } else {
          // Handle step failure
          if (currentStep.errorHandling.onError === 'stop') {
            execution.status = 'failed';
            execution.errorMessage = stepResult.error;
            break;
          } else if (currentStep.errorHandling.onError === 'retry') {
            // Implement retry logic
            const retryResult = await this.retryWorkflowStep(currentStep, execution);
            if (!retryResult.success) {
              execution.status = 'failed';
              execution.errorMessage = retryResult.error;
              break;
            }
          }
          // Continue to next step for 'continue' and 'escalate'
        }

        // Update execution record
        await supabase
          .from('workflow_executions')
          .update({
            status: execution.status,
            current_step: execution.currentStep,
            executed_steps: execution.executedSteps,
            pending_steps: execution.pendingSteps,
            execution_data: execution.executionData,
            error_message: execution.errorMessage,
            completed_at: execution.completedAt?.toISOString()
          })
          .eq('id', execution.id);
      }
    } catch (error) {
      console.error('Error processing workflow execution:', error);
      execution.status = 'failed';
      execution.errorMessage = error.message;
      
      await supabase
        .from('workflow_executions')
        .update({
          status: execution.status,
          error_message: execution.errorMessage
        })
        .eq('id', execution.id);
    }
  }

  private static async executeWorkflowStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Check conditions first
      if (step.conditions && step.conditions.length > 0) {
        const conditionsMet = await this.evaluateConditions(step.conditions, execution);
        if (!conditionsMet) {
          return { success: true, data: { skipped: true, reason: 'Conditions not met' } };
        }
      }

      // Execute step based on type
      switch (step.stepType) {
        case 'condition':
          return await this.executeConditionStep(step, execution);
        case 'action':
          return await this.executeActionStep(step, execution);
        case 'approval':
          return await this.executeApprovalStep(step, execution);
        case 'notification':
          return await this.executeNotificationStep(step, execution);
        case 'integration':
          return await this.executeIntegrationStep(step, execution);
        case 'delay':
          return await this.executeDelayStep(step, execution);
        case 'ai_processing':
          return await this.executeAIProcessingStep(step, execution);
        default:
          return { success: false, error: 'Unknown step type' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private static async evaluateConditions(
    conditions: WorkflowCondition[],
    execution: WorkflowExecution
  ): Promise<boolean> {
    let result = true;
    let logicalOperator: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const conditionResult = await this.evaluateCondition(condition, execution);
      
      if (logicalOperator === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }
      
      logicalOperator = condition.logicalOperator || 'AND';
    }

    return result;
  }

  private static async evaluateCondition(
    condition: WorkflowCondition,
    execution: WorkflowExecution
  ): Promise<boolean> {
    const fieldValue = this.getFieldValue(condition.field, execution);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'greater_than':
        return fieldValue > condition.value;
      case 'less_than':
        return fieldValue < condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'not_contains':
        return !String(fieldValue).includes(String(condition.value));
      case 'is_empty':
        return !fieldValue || fieldValue === '';
      case 'is_not_empty':
        return fieldValue && fieldValue !== '';
      default:
        return false;
    }
  }

  private static getFieldValue(field: string, execution: WorkflowExecution): any {
    // Extract field value from execution data or entity
    const fieldParts = field.split('.');
    let value = execution.executionData;
    
    for (const part of fieldParts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private static async executeConditionStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    // Condition steps are evaluated during step execution
    return { success: true, data: { evaluated: true } };
  }

  private static async executeActionStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      if (!step.actions || step.actions.length === 0) {
        return { success: true, data: { no_actions: true } };
      }

      const results = [];
      for (const action of step.actions) {
        const result = await this.executeAction(action, execution);
        results.push(result);
      }

      return { success: true, data: { actions: results } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private static async executeAction(
    action: WorkflowAction,
    execution: WorkflowExecution
  ): Promise<any> {
    switch (action.actionType) {
      case 'update_field':
        return await this.updateFieldAction(action, execution);
      case 'create_record':
        return await this.createRecordAction(action, execution);
      case 'send_email':
        return await this.sendEmailAction(action, execution);
      case 'create_task':
        return await this.createTaskAction(action, execution);
      case 'call_api':
        return await this.callAPIAction(action, execution);
      case 'execute_script':
        return await this.executeScriptAction(action, execution);
      default:
        throw new Error('Unknown action type');
    }
  }

  private static async updateFieldAction(
    action: WorkflowAction,
    execution: WorkflowExecution
  ): Promise<any> {
    const { field, value } = action.config;
    
    // Update the entity field
    const { error } = await supabase
      .from(execution.entityType)
      .update({ [field]: value })
      .eq('id', execution.entityId);

    if (error) throw error;

    // Update execution data
    execution.executionData[field] = value;

    return { action: 'update_field', field, value };
  }

  private static async createRecordAction(
    action: WorkflowAction,
    execution: WorkflowExecution
  ): Promise<any> {
    const { table, data } = action.config;
    
    const { data: record, error } = await supabase
      .from(table)
      .insert({ ...data, organization_id: execution.organizationId })
      .select()
      .single();

    if (error) throw error;

    return { action: 'create_record', table, record };
  }

  private static async sendEmailAction(
    action: WorkflowAction,
    execution: WorkflowExecution
  ): Promise<any> {
    const { to, subject, template, variables } = action.config;
    
    // In a real implementation, this would integrate with an email service
    console.log('Sending email:', { to, subject, template, variables });
    
    return { action: 'send_email', to, subject, sent: true };
  }

  private static async createTaskAction(
    action: WorkflowAction,
    execution: WorkflowExecution
  ): Promise<any> {
    const { title, description, assignedTo, dueDate } = action.config;
    
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        assigned_to: assignedTo,
        due_date: dueDate,
        organization_id: execution.organizationId,
        workflow_execution_id: execution.id
      })
      .select()
      .single();

    if (error) throw error;

    return { action: 'create_task', task };
  }

  private static async callAPIAction(
    action: WorkflowAction,
    execution: WorkflowExecution
  ): Promise<any> {
    const { url, method, headers, body } = action.config;
    
    const response = await fetch(url, {
      method: method || 'GET',
      headers: headers || {},
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();

    return { action: 'call_api', url, status: response.status, data };
  }

  private static async executeScriptAction(
    action: WorkflowAction,
    execution: WorkflowExecution
  ): Promise<any> {
    const { script, language } = action.config;
    
    // In a real implementation, this would execute the script safely
    console.log('Executing script:', { script, language });
    
    return { action: 'execute_script', result: 'executed' };
  }

  private static async executeApprovalStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const approvalConfig = step.config.approvalConfig;
      
      // Create approval request
      const { data: approval, error } = await supabase
        .from('workflow_approvals')
        .insert({
          workflow_execution_id: execution.id,
          step_id: step.id,
          approvers: approvalConfig.approvers,
          approval_type: approvalConfig.approvalType,
          timeout_hours: approvalConfig.timeoutHours,
          status: 'pending',
          organization_id: execution.organizationId
        })
        .select()
        .single();

      if (error) throw error;

      // Send notifications to approvers
      await this.sendApprovalNotifications(approval, execution);

      // Pause execution until approval
      execution.status = 'paused';

      return { success: true, data: { approval, paused: true } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private static async sendApprovalNotifications(
    approval: any,
    execution: WorkflowExecution
  ): Promise<void> {
    // Send notifications to approvers
    for (const approverId of approval.approvers) {
      // In a real implementation, this would send actual notifications
      console.log('Sending approval notification to:', approverId);
    }
  }

  private static async executeNotificationStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const notificationConfig = step.config.notificationConfig;
      
      // Send notifications through configured channels
      for (const channel of notificationConfig.channels) {
        await this.sendNotification(channel, notificationConfig, execution);
      }

      return { success: true, data: { notifications_sent: notificationConfig.channels.length } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private static async sendNotification(
    channel: string,
    config: any,
    execution: WorkflowExecution
  ): Promise<void> {
    // In a real implementation, this would send actual notifications
    console.log('Sending notification via:', channel);
  }

  private static async executeIntegrationStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const { integrationType, operation, data } = step.config;
      
      // Execute integration based on type
      switch (integrationType) {
        case 'salesforce':
          return await this.executeSalesforceIntegration(operation, data, execution);
        case 'dynamics':
          return await this.executeDynamicsIntegration(operation, data, execution);
        case 'sap':
          return await this.executeSAPIntegration(operation, data, execution);
        default:
          return { success: false, error: 'Unknown integration type' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private static async executeSalesforceIntegration(
    operation: string,
    data: any,
    execution: WorkflowExecution
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    // In a real implementation, this would integrate with Salesforce
    console.log('Executing Salesforce integration:', { operation, data });
    return { success: true, data: { integration: 'salesforce', operation } };
  }

  private static async executeDynamicsIntegration(
    operation: string,
    data: any,
    execution: WorkflowExecution
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    // In a real implementation, this would integrate with Dynamics
    console.log('Executing Dynamics integration:', { operation, data });
    return { success: true, data: { integration: 'dynamics', operation } };
  }

  private static async executeSAPIntegration(
    operation: string,
    data: any,
    execution: WorkflowExecution
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    // In a real implementation, this would integrate with SAP
    console.log('Executing SAP integration:', { operation, data });
    return { success: true, data: { integration: 'sap', operation } };
  }

  private static async executeDelayStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    const { delayMinutes } = step.config;
    
    // In a real implementation, this would pause execution for the specified time
    console.log('Delaying execution for:', delayMinutes, 'minutes');
    
    return { success: true, data: { delayed: delayMinutes } };
  }

  private static async executeAIProcessingStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const { aiModel, inputData, outputField } = step.config;
      
      // In a real implementation, this would call AI services
      console.log('Executing AI processing:', { aiModel, inputData, outputField });
      
      // Mock AI processing result
      const result = { processed: true, confidence: 0.95 };
      
      // Update execution data with AI result
      execution.executionData[outputField] = result;

      return { success: true, data: { ai_result: result } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private static async retryWorkflowStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    const retryConfig = step.errorHandling;
    // Implement retry logic based on retryConfig
    return { success: true, data: { retried: true } };
  }

  // Workflow Templates
  static async getWorkflowTemplates(): Promise<any[]> {
    return [
      {
        id: 'approval_workflow',
        name: 'Approval Workflow',
        description: 'Standard approval process with multiple approvers',
        workflowType: 'approval',
        steps: [
          {
            id: 'step1',
            stepType: 'condition',
            name: 'Check Amount',
            description: 'Check if amount exceeds threshold',
            conditions: [
              {
                id: 'cond1',
                field: 'deal_value',
                operator: 'greater_than',
                value: 100000
              }
            ],
            nextSteps: ['step2'],
            errorHandling: { onError: 'stop', errorActions: [], escalationRecipients: [], errorNotification: true },
            timeoutMinutes: 5
          },
          {
            id: 'step2',
            stepType: 'approval',
            name: 'Manager Approval',
            description: 'Require manager approval for large deals',
            config: {
              approvalConfig: {
                approvalType: 'single',
                approvers: ['manager_id'],
                timeoutHours: 24,
                requireAllApprovers: true,
                escalationRules: []
              }
            },
            nextSteps: ['step3'],
            errorHandling: { onError: 'escalate', errorActions: [], escalationRecipients: ['admin'], errorNotification: true },
            timeoutMinutes: 60
          },
          {
            id: 'step3',
            stepType: 'notification',
            name: 'Send Notification',
            description: 'Notify stakeholders of approval',
            config: {
              notificationConfig: {
                channels: ['email'],
                recipients: ['stakeholders'],
                templates: {
                  email: 'Deal approved: {{deal_name}}'
                }
              }
            },
            nextSteps: [],
            errorHandling: { onError: 'continue', errorActions: [], escalationRecipients: [], errorNotification: false },
            timeoutMinutes: 5
          }
        ],
        triggerConditions: {
          entityType: 'opportunity',
          conditions: [
            {
              field: 'stage',
              operator: 'equals',
              value: 'proposal'
            }
          ]
        }
      },
      {
        id: 'data_sync_workflow',
        name: 'Data Sync Workflow',
        description: 'Sync data with external systems',
        workflowType: 'data_sync',
        steps: [
          {
            id: 'step1',
            stepType: 'integration',
            name: 'Sync to Salesforce',
            description: 'Sync opportunity data to Salesforce',
            config: {
              integrationType: 'salesforce',
              operation: 'upsert',
              data: {
                entity: 'opportunity',
                fields: ['name', 'deal_value', 'stage', 'expected_close_date']
              }
            },
            nextSteps: ['step2'],
            errorHandling: { onError: 'retry', errorActions: [], escalationRecipients: [], errorNotification: true },
            timeoutMinutes: 10
          },
          {
            id: 'step2',
            stepType: 'integration',
            name: 'Sync to Dynamics',
            description: 'Sync opportunity data to Dynamics',
            config: {
              integrationType: 'dynamics',
              operation: 'upsert',
              data: {
                entity: 'opportunity',
                fields: ['name', 'deal_value', 'stage', 'expected_close_date']
              }
            },
            nextSteps: [],
            errorHandling: { onError: 'retry', errorActions: [], escalationRecipients: [], errorNotification: true },
            timeoutMinutes: 10
          }
        ],
        triggerConditions: {
          entityType: 'opportunity',
          conditions: [
            {
              field: 'stage',
              operator: 'equals',
              value: 'closed_won'
            }
          ]
        }
      },
      {
        id: 'ai_processing_workflow',
        name: 'AI Processing Workflow',
        description: 'AI-powered lead scoring and insights',
        workflowType: 'ai_trigger',
        steps: [
          {
            id: 'step1',
            stepType: 'ai_processing',
            name: 'Generate Lead Score',
            description: 'Use AI to score the lead',
            config: {
              aiModel: 'lead_scoring_v3',
              inputData: ['company_size', 'industry', 'source', 'engagement'],
              outputField: 'ai_score'
            },
            nextSteps: ['step2'],
            errorHandling: { onError: 'continue', errorActions: [], escalationRecipients: [], errorNotification: false },
            timeoutMinutes: 30
          },
          {
            id: 'step2',
            stepType: 'condition',
            name: 'Check Score',
            description: 'Check if score meets threshold',
            conditions: [
              {
                id: 'cond1',
                field: 'ai_score',
                operator: 'greater_than',
                value: 80
              }
            ],
            nextSteps: ['step3'],
            errorHandling: { onError: 'stop', errorActions: [], escalationRecipients: [], errorNotification: false },
            timeoutMinutes: 5
          },
          {
            id: 'step3',
            stepType: 'action',
            name: 'Create Task',
            description: 'Create follow-up task for high-scoring lead',
            actions: [
              {
                id: 'action1',
                actionType: 'create_task',
                config: {
                  title: 'Follow up with high-scoring lead',
                  description: 'Lead scored {{ai_score}} - immediate follow-up required',
                  assignedTo: '{{assigned_to}}',
                  dueDate: '{{created_at + 1 day}}'
                },
                parameters: {}
              }
            ],
            nextSteps: [],
            errorHandling: { onError: 'continue', errorActions: [], escalationRecipients: [], errorNotification: false },
            timeoutMinutes: 5
          }
        ],
        triggerConditions: {
          entityType: 'lead',
          conditions: [
            {
              field: 'status',
              operator: 'equals',
              value: 'new'
            }
          ]
        }
      }
    ];
  }

  // Workflow Execution Management
  static async getWorkflowExecutions(organizationId: string): Promise<WorkflowExecution[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('started_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return data.map(execution => ({
        id: execution.id,
        workflowId: execution.workflow_id,
        entityType: execution.entity_type,
        entityId: execution.entity_id,
        status: execution.status,
        currentStep: execution.current_step,
        executedSteps: execution.executed_steps,
        pendingSteps: execution.pending_steps,
        executionData: execution.execution_data,
        errorMessage: execution.error_message,
        startedAt: new Date(execution.started_at),
        completedAt: execution.completed_at ? new Date(execution.completed_at) : undefined,
        organizationId: execution.organization_id
      }));
    } catch (error) {
      console.error('Error fetching workflow executions:', error);
      throw error;
    }
  }

  static async cancelWorkflowExecution(executionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_executions')
        .update({ status: 'cancelled' })
        .eq('id', executionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling workflow execution:', error);
      throw error;
    }
  }

  static async retryWorkflowExecution(executionId: string): Promise<void> {
    try {
      const { data: execution } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (!execution) throw new Error('Execution not found');

      // Reset execution status
      await supabase
        .from('workflow_executions')
        .update({
          status: 'running',
          error_message: null
        })
        .eq('id', executionId);

      // Restart execution
      const { data: workflow } = await supabase
        .from('enterprise_workflows')
        .select('*')
        .eq('id', execution.workflow_id)
        .single();

      if (workflow) {
        this.processWorkflowExecution(execution, workflow);
      }
    } catch (error) {
      console.error('Error retrying workflow execution:', error);
      throw error;
    }
  }
}

export default EnterpriseWorkflowAPI;
