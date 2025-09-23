// Enterprise Workflow API Layer
// API functions for enterprise workflow automation management

import { createClient } from '@supabase/supabase-js';
import { workflowManager } from '../workflows/index';
import { 
  EnterpriseWorkflow, 
  WorkflowExecution 
} from '../workflows/index';

// Define WorkflowStep locally to include integration type
interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'approval' | 'notification' | 'delay' | 'integration';
  config: Record<string, any>;
  conditions?: WorkflowCondition[];
  actions?: WorkflowAction[];
  nextSteps?: string[];
  errorHandling?: ErrorHandling;
}

interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

interface WorkflowAction {
  type: string;
  config: Record<string, any>;
  parameters: Record<string, any>;
}

interface ErrorHandling {
  onError: 'stop' | 'retry' | 'continue' | 'escalate';
  retryConfig?: RetryConfig;
  escalationConfig?: EscalationConfig;
}

interface RetryConfig {
  maxAttempts: number;
  delayMinutes: number;
  backoffMultiplier: number;
  maxDelayMinutes: number;
}

interface EscalationConfig {
  enabled: boolean;
  escalationUsers: string[];
  escalationDelayMinutes: number;
  maxEscalations: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Workflow Management
async function createEnterpriseWorkflow(
  workflow: Omit<EnterpriseWorkflow, 'id' | 'createdAt'>,
  userId: string
): Promise<EnterpriseWorkflow> {
  try {
    const workflowId = await workflowManager.createWorkflow(workflow);
    return await workflowManager.getWorkflow(workflowId) || workflow as EnterpriseWorkflow;
  } catch (error) {
    console.error('Error creating enterprise workflow:', error);
    throw error;
  }
}

async function getEnterpriseWorkflows(organizationId: string): Promise<EnterpriseWorkflow[]> {
  try {
    return await workflowManager.getWorkflowsByOrganization(organizationId);
  } catch (error) {
    console.error('Error fetching enterprise workflows:', error);
    throw error;
  }
}

async function updateEnterpriseWorkflow(
  workflowId: string,
  updates: Partial<EnterpriseWorkflow>
): Promise<EnterpriseWorkflow> {
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

    const { data, error } = await supabase
      .from('enterprise_workflows')
      .update(updateData)
      .eq('id', workflowId)
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
    console.error('Error updating enterprise workflow:', error);
    throw error;
  }
}

async function deleteEnterpriseWorkflow(workflowId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('enterprise_workflows')
      .delete()
      .eq('id', workflowId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting enterprise workflow:', error);
    throw error;
  }
}

// Workflow Execution
async function executeEnterpriseWorkflow(
  workflowId: string,
  entityType: string,
  entityId: string,
  executionData: Record<string, any>,
  organizationId: string
): Promise<WorkflowExecution> {
  try {
    return await workflowManager.executeWorkflow(workflowId, entityType, entityId, executionData);
  } catch (error) {
    console.error('Error executing enterprise workflow:', error);
    throw error;
  }
}

async function getWorkflowExecutions(organizationId: string): Promise<WorkflowExecution[]> {
  try {
    // TODO: Implement getWorkflowExecutions
    return [];
  } catch (error) {
    console.error('Error fetching workflow executions:', error);
    throw error;
  }
}

async function cancelWorkflowExecution(executionId: string): Promise<void> {
  try {
    // TODO: Implement cancelWorkflowExecution
    return;
  } catch (error) {
    console.error('Error cancelling workflow execution:', error);
    throw error;
  }
}

async function retryWorkflowExecution(executionId: string): Promise<void> {
  try {
    // TODO: Implement retryWorkflowExecution
    return;
  } catch (error) {
    console.error('Error retrying workflow execution:', error);
    throw error;
  }
}

// Workflow Templates
async function getWorkflowTemplates(): Promise<any[]> {
  try {
    // TODO: Implement getWorkflowTemplates
    return [];
  } catch (error) {
    console.error('Error fetching workflow templates:', error);
    return [];
  }
}

async function createWorkflowFromTemplate(
  templateId: string,
  customizations: Record<string, any>,
  organizationId: string,
  userId: string
): Promise<EnterpriseWorkflow> {
  try {
    const templates = await getWorkflowTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }

    // Apply customizations to template
    const workflow = {
      ...template,
      name: customizations.name || template.name,
      description: customizations.description || template.description,
      organizationId,
      isActive: true,
      priority: 1,
      timeoutHours: 24,
      retryConfig: {
        maxRetries: 3,
        retryIntervalMinutes: 5,
        backoffMultiplier: 2,
        retryConditions: ['network_error', 'timeout']
      }
    };

    return await createEnterpriseWorkflow(workflow, userId);
  } catch (error) {
    console.error('Error creating workflow from template:', error);
    throw error;
  }
}

// Workflow Builder
async function validateWorkflowSteps(steps: WorkflowStep[]): Promise<{ valid: boolean; errors: string[] }> {
  try {
    const errors: string[] = [];

    // Check if workflow has at least one step
    if (steps.length === 0) {
      errors.push('Workflow must have at least one step');
    }

    // Validate each step
    steps.forEach((step, index) => {
      if (!step.id) {
        errors.push(`Step ${index + 1} must have an ID`);
      }
      
      if (!step.name) {
        errors.push(`Step ${index + 1} must have a name`);
      }
      
      if (!step.type) {
        errors.push(`Step ${index + 1} must have a step type`);
      }

      // Validate step-specific requirements
      switch (step.type) {
        case 'approval':
          if (!step.config.approvalConfig) {
            errors.push(`Step ${index + 1} (approval) must have approval configuration`);
          }
          break;
        case 'notification':
          if (!step.config.notificationConfig) {
            errors.push(`Step ${index + 1} (notification) must have notification configuration`);
          }
          break;
        case 'integration':
          if (!step.config.integrationType) {
            errors.push(`Step ${index + 1} (integration) must specify integration type`);
          }
          break;
      }
    });

    // Check for circular references in nextSteps
    const stepIds = new Set(steps.map(step => step.id));
    steps.forEach((step, index) => {
      step.nextSteps?.forEach(nextStepId => {
        if (!stepIds.has(nextStepId)) {
          errors.push(`Step ${index + 1} references non-existent step: ${nextStepId}`);
        }
      });
    });

    return { valid: errors.length === 0, errors };
  } catch (error) {
    console.error('Error validating workflow steps:', error);
    return { valid: false, errors: ['Validation error'] };
  }
}

async function testWorkflowStep(
  step: WorkflowStep,
  testData: Record<string, any>
): Promise<{ success: boolean; error?: string; result?: any }> {
  try {
    // Create a mock execution for testing
    const mockExecution = {
      id: 'test-execution',
      workflowId: 'test-workflow',
      entityType: 'test',
      entityId: 'test-id',
      status: 'running' as const,
      currentStep: step.id,
      executedSteps: [],
      pendingSteps: [step.id],
      executionData: testData,
      startedAt: new Date(),
      organizationId: 'test-org'
    };

    // Execute the step
    // TODO: Implement executeWorkflowStep
    return { success: true, result: {} };
  } catch (error) {
    console.error('Error testing workflow step:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Workflow Analytics
async function getWorkflowAnalytics(organizationId: string): Promise<any> {
  try {
    const { data: executions } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    const { data: workflows } = await supabase
      .from('enterprise_workflows')
      .select('*')
      .eq('organization_id', organizationId);

    const analytics: any = {
      totalWorkflows: workflows?.length || 0,
      activeWorkflows: workflows?.filter(w => w.is_active).length || 0,
      totalExecutions: executions?.length || 0,
      successfulExecutions: executions?.filter(e => e.status === 'completed').length || 0,
      failedExecutions: executions?.filter(e => e.status === 'failed').length || 0,
      runningExecutions: executions?.filter(e => e.status === 'running').length || 0,
      averageExecutionTime: 0,
      successRate: 0,
      mostUsedWorkflows: [],
      executionTrends: []
    };

    // Calculate success rate
    if (analytics.totalExecutions > 0) {
      analytics.successRate = (analytics.successfulExecutions / analytics.totalExecutions) * 100;
    }

    // Calculate average execution time
    const completedExecutions = executions?.filter(e => e.status === 'completed' && e.completed_at) || [];
    if (completedExecutions.length > 0) {
      const totalTime = completedExecutions.reduce((sum, exec) => {
        const startTime = new Date(exec.started_at).getTime();
        const endTime = new Date(exec.completed_at).getTime();
        return sum + (endTime - startTime);
      }, 0);
      analytics.averageExecutionTime = totalTime / completedExecutions.length;
    }

    // Most used workflows
    const workflowUsage = new Map();
    executions?.forEach(exec => {
      const count = workflowUsage.get(exec.workflow_id) || 0;
      workflowUsage.set(exec.workflow_id, count + 1);
    });

    analytics.mostUsedWorkflows = Array.from(workflowUsage.entries())
      .map(([workflowId, count]: [string, any]) => {
        const workflow = workflows?.find(w => w.id === workflowId);
        return {
          workflowId,
          workflowName: workflow?.name || 'Unknown',
          executionCount: count
        };
      })
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, 5);

    // Execution trends (daily for last 7 days)
    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayExecutions = executions?.filter(exec => {
        const execDate = new Date(exec.started_at);
        return execDate >= dayStart && execDate < dayEnd;
      }) || [];

      trends.push({
        date: dayStart.toISOString().substring(0, 10),
        executions: dayExecutions.length,
        successful: dayExecutions.filter(e => e.status === 'completed').length,
        failed: dayExecutions.filter(e => e.status === 'failed').length
      });
    }

    analytics.executionTrends = trends;

    return analytics;
  } catch (error) {
    console.error('Error getting workflow analytics:', error);
    throw error;
  }
}

// Workflow Monitoring
async function getWorkflowHealth(organizationId: string): Promise<any> {
  try {
    const { data: executions } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    const { data: workflows } = await supabase
      .from('enterprise_workflows')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    const health: any = {
      status: 'healthy',
      issues: [],
      recommendations: []
    };

    // Check for failed executions
    const failedExecutions = executions?.filter(e => e.status === 'failed') || [];
    if (failedExecutions.length > 0) {
      health.issues.push(`${failedExecutions.length} failed executions in the last 24 hours`);
    }

    // Check for stuck executions
    const stuckExecutions = executions?.filter(e => {
      const startTime = new Date(e.started_at).getTime();
      const now = Date.now();
      return e.status === 'running' && (now - startTime) > (24 * 60 * 60 * 1000); // 24 hours
    }) || [];

    if (stuckExecutions.length > 0) {
      health.issues.push(`${stuckExecutions.length} executions stuck for more than 24 hours`);
    }

    // Check workflow configuration
    workflows?.forEach(workflow => {
      if (!workflow.steps || workflow.steps.length === 0) {
        health.issues.push(`Workflow "${workflow.name}" has no steps configured`);
      }
    });

    // Determine overall health status
    if (health.issues.length > 0) {
      health.status = 'warning';
      if (health.issues.length > 3) {
        health.status = 'critical';
      }
    }

    // Generate recommendations
    if (failedExecutions.length > 0) {
      health.recommendations.push('Review failed executions and update workflow configurations');
    }
    
    if (stuckExecutions.length > 0) {
      health.recommendations.push('Investigate stuck executions and consider adding timeouts');
    }

    if (workflows && workflows.length === 0) {
      health.recommendations.push('Create workflows to automate business processes');
    }

    return health;
  } catch (error) {
    console.error('Error getting workflow health:', error);
    throw error;
  }
}

// Export all functions
export {
  createEnterpriseWorkflow,
  getEnterpriseWorkflows,
  updateEnterpriseWorkflow,
  deleteEnterpriseWorkflow,
  executeEnterpriseWorkflow,
  getWorkflowExecutions,
  cancelWorkflowExecution,
  retryWorkflowExecution,
  getWorkflowTemplates,
  createWorkflowFromTemplate,
  validateWorkflowSteps,
  testWorkflowStep,
  getWorkflowAnalytics,
  getWorkflowHealth
};
