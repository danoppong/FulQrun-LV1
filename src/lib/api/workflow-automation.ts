import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type WorkflowAutomation = Database['public']['Tables']['workflow_automations']['Row']
type WorkflowAutomationInsert = Database['public']['Tables']['workflow_automations']['Insert']
type WorkflowAutomationUpdate = Database['public']['Tables']['workflow_automations']['Update']

export interface WorkflowAutomationData {
  id: string
  name: string
  description: string | null
  triggerType: 'stage_change' | 'field_update' | 'time_based' | 'manual'
  triggerConditions: Record<string, any>
  actions: Record<string, any>[]
  isActive: boolean
  branchSpecific: boolean
  roleSpecific: boolean
  branchName: string | null
  roleName: string | null
  organizationId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface TriggerCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty'
  value: Record<string, unknown>
  logicalOperator?: 'AND' | 'OR'
}

export interface WorkflowAction {
  type: 'send_email' | 'create_task' | 'update_field' | 'send_notification' | 'create_activity' | 'assign_user' | 'webhook'
  config: Record<string, any>
  delay?: number // in minutes
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  entityType: string
  entityId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt: string
  completedAt: string | null
  errorMessage: string | null
  executionData: Record<string, any>
}

export class WorkflowAutomationAPI {
  /**
   * Get all workflow automations for an organization
   */
  static async getAutomations(organizationId: string): Promise<WorkflowAutomationData[]> {
    const { data, error } = await supabase
      .from('workflow_automations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch workflow automations: ${error.message}`)
    }

    return data.map(this.transformToWorkflowAutomationData)
  }

  /**
   * Get active workflow automations for a specific context
   */
  static async getActiveAutomations(
    organizationId: string,
    branchName?: string,
    roleName?: string
  ): Promise<WorkflowAutomationData[]> {
    let query = supabase
      .from('workflow_automations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    // Filter by branch and role specificity
    if (branchName) {
      query = query.or(`branch_specific.eq.false,branch_name.eq.${branchName}`)
    }

    if (roleName) {
      query = query.or(`role_specific.eq.false,role_name.eq.${roleName}`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch active workflow automations: ${error.message}`)
    }

    return data.map(this.transformToWorkflowAutomationData)
  }

  /**
   * Get a specific workflow automation by ID
   */
  static async getAutomation(id: string): Promise<WorkflowAutomationData | null> {
    const { data, error } = await supabase
      .from('workflow_automations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch workflow automation: ${error.message}`)
    }

    return this.transformToWorkflowAutomationData(data)
  }

  /**
   * Create a new workflow automation
   */
  static async createAutomation(
    automation: Omit<WorkflowAutomationData, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WorkflowAutomationData> {
    const insertData: WorkflowAutomationInsert = {
      name: automation.name,
      description: automation.description,
      trigger_type: automation.triggerType,
      trigger_conditions: automation.triggerConditions,
      actions: automation.actions,
      is_active: automation.isActive,
      branch_specific: automation.branchSpecific,
      role_specific: automation.roleSpecific,
      branch_name: automation.branchName,
      role_name: automation.roleName,
      organization_id: automation.organizationId,
      created_by: automation.createdBy,
    }

    const { data, error } = await supabase
      .from('workflow_automations')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create workflow automation: ${error.message}`)
    }

    return this.transformToWorkflowAutomationData(data)
  }

  /**
   * Update an existing workflow automation
   */
  static async updateAutomation(
    id: string,
    updates: Partial<Omit<WorkflowAutomationData, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<WorkflowAutomationData> {
    const updateData: WorkflowAutomationUpdate = {
      name: updates.name,
      description: updates.description,
      trigger_type: updates.triggerType,
      trigger_conditions: updates.triggerConditions,
      actions: updates.actions,
      is_active: updates.isActive,
      branch_specific: updates.branchSpecific,
      role_specific: updates.roleSpecific,
      branch_name: updates.branchName,
      role_name: updates.roleName,
    }

    const { data, error } = await supabase
      .from('workflow_automations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update workflow automation: ${error.message}`)
    }

    return this.transformToWorkflowAutomationData(data)
  }

  /**
   * Delete a workflow automation
   */
  static async deleteAutomation(id: string): Promise<void> {
    const { error } = await supabase
      .from('workflow_automations')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete workflow automation: ${error.message}`)
    }
  }

  /**
   * Execute a workflow automation
   */
  static async executeWorkflow(
    workflowId: string,
    entityType: string,
    entityId: string,
    triggerData: Record<string, any>
  ): Promise<WorkflowExecution> {
    const workflow = await this.getAutomation(workflowId)
    if (!workflow) {
      throw new Error('Workflow automation not found')
    }

    if (!workflow.isActive) {
      throw new Error('Workflow automation is not active')
    }

    // Check if trigger conditions are met
    const conditionsMet = this.evaluateTriggerConditions(
      workflow.triggerConditions,
      triggerData
    )

    if (!conditionsMet) {
      throw new Error('Trigger conditions not met')
    }

    // Create execution record
    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      entityType,
      entityId,
      status: 'pending',
      startedAt: new Date().toISOString(),
      completedAt: null,
      errorMessage: null,
      executionData: triggerData,
    }

    try {
      execution.status = 'running'
      
      // Execute actions
      for (const action of workflow.actions) {
        await this.executeAction(action as WorkflowAction, entityType, entityId, triggerData)
        
        // Apply delay if specified
        if (action.delay && action.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, action.delay * 60 * 1000))
        }
      }

      execution.status = 'completed'
      execution.completedAt = new Date().toISOString()
    } catch (error) {
      execution.status = 'failed'
      execution.errorMessage = error instanceof Error ? error.message : 'Unknown error'
      execution.completedAt = new Date().toISOString()
    }

    return execution
  }

  /**
   * Execute a workflow action
   */
  private static async executeAction(
    action: WorkflowAction,
    entityType: string,
    entityId: string,
    triggerData: Record<string, any>
  ): Promise<void> {
    switch (action.type) {
      case 'send_email':
        await this.executeSendEmailAction(action, entityType, entityId, triggerData)
        break
      case 'create_task':
        await this.executeCreateTaskAction(action, entityType, entityId, triggerData)
        break
      case 'update_field':
        await this.executeUpdateFieldAction(action, entityType, entityId, triggerData)
        break
      case 'send_notification':
        await this.executeSendNotificationAction(action, entityType, entityId, triggerData)
        break
      case 'create_activity':
        await this.executeCreateActivityAction(action, entityType, entityId, triggerData)
        break
      case 'assign_user':
        await this.executeAssignUserAction(action, entityType, entityId, triggerData)
        break
      case 'webhook':
        await this.executeWebhookAction(action, entityType, entityId, triggerData)
        break
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  /**
   * Evaluate trigger conditions
   */
  private static evaluateTriggerConditions(
    conditions: Record<string, any>,
    data: Record<string, any>
  ): boolean {
    // Simple condition evaluation - can be enhanced with more complex logic
    for (const [field, condition] of Object.entries(conditions)) {
      const fieldValue = this.getNestedValue(data, field)
      const { operator, value, logicalOperator = 'AND' } = condition

      const conditionMet = this.evaluateCondition(fieldValue, operator, value)
      
      if (!conditionMet && logicalOperator === 'AND') {
        return false
      }
      
      if (conditionMet && logicalOperator === 'OR') {
        return true
      }
    }

    return true
  }

  /**
   * Evaluate a single condition
   */
  private static evaluateCondition(fieldValue: unknown, operator: string, expectedValue: unknown): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue
      case 'not_equals':
        return fieldValue !== expectedValue
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(expectedValue).toLowerCase())
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(expectedValue).toLowerCase())
      case 'greater_than':
        return Number(fieldValue) > Number(expectedValue)
      case 'less_than':
        return Number(fieldValue) < Number(expectedValue)
      case 'is_empty':
        return !fieldValue || fieldValue === ''
      case 'is_not_empty':
        return fieldValue && fieldValue !== ''
      default:
        return false
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Execute send email action
   */
  private static async executeSendEmailAction(
    action: WorkflowAction,
    entityType: string,
    entityId: string,
    triggerData: Record<string, any>
  ): Promise<void> {
    // Implementation would integrate with email service
  }

  /**
   * Execute create task action
   */
  private static async executeCreateTaskAction(
    action: WorkflowAction,
    entityType: string,
    entityId: string,
    triggerData: Record<string, any>
  ): Promise<void> {
    // Implementation would create a task in the activities table
  }

  /**
   * Execute update field action
   */
  private static async executeUpdateFieldAction(
    action: WorkflowAction,
    entityType: string,
    entityId: string,
    triggerData: Record<string, any>
  ): Promise<void> {
    // Implementation would update the specified field in the entity
  }

  /**
   * Execute send notification action
   */
  private static async executeSendNotificationAction(
    action: WorkflowAction,
    entityType: string,
    entityId: string,
    triggerData: Record<string, any>
  ): Promise<void> {
    // Implementation would send notification via Slack, email, or in-app
  }

  /**
   * Execute create activity action
   */
  private static async executeCreateActivityAction(
    action: WorkflowAction,
    entityType: string,
    entityId: string,
    triggerData: Record<string, any>
  ): Promise<void> {
    // Implementation would create an activity record
  }

  /**
   * Execute assign user action
   */
  private static async executeAssignUserAction(
    action: WorkflowAction,
    entityType: string,
    entityId: string,
    triggerData: Record<string, any>
  ): Promise<void> {
    // Implementation would assign a user to the entity
  }

  /**
   * Execute webhook action
   */
  private static async executeWebhookAction(
    action: WorkflowAction,
    entityType: string,
    entityId: string,
    triggerData: Record<string, any>
  ): Promise<void> {
    // Implementation would make HTTP request to webhook URL
  }

  /**
   * Create default workflow automations for PEAK process
   */
  static async createDefaultPEAKWorkflows(
    organizationId: string,
    createdBy: string
  ): Promise<WorkflowAutomationData[]> {
    const workflows = [
      {
        name: 'Prospecting to Engaging Transition',
        description: 'Automatically move opportunity to engaging stage when champion is identified',
        triggerType: 'field_update' as const,
        triggerConditions: {
          'peak_stage': { operator: 'equals', value: 'prospecting' },
          'champion': { operator: 'is_not_empty', value: null }
        },
        actions: [
          {
            type: 'update_field' as const,
            config: { field: 'peak_stage', value: 'engaging' }
          },
          {
            type: 'create_activity' as const,
            config: { 
              type: 'task', 
              subject: 'Schedule discovery meeting with champion',
              description: 'Champion identified - schedule discovery meeting to understand pain points'
            }
          }
        ],
        branchSpecific: false,
        roleSpecific: false,
        branchName: null,
        roleName: null,
      },
      {
        name: 'Deal Risk Alert',
        description: 'Send alert when deal value is high but MEDDPICC score is low',
        triggerType: 'field_update' as const,
        triggerConditions: {
          'deal_value': { operator: 'greater_than', value: 50000 },
          'meddpicc_score': { operator: 'less_than', value: 50 }
        },
        actions: [
          {
            type: 'send_notification' as const,
            config: { 
              message: 'High-value deal with low MEDDPICC score requires attention',
              priority: 'high'
            }
          },
          {
            type: 'create_task' as const,
            config: { 
              subject: 'Review MEDDPICC criteria',
              description: 'High-value deal needs MEDDPICC improvement',
              priority: 'high'
            }
          }
        ],
        branchSpecific: false,
        roleSpecific: false,
        branchName: null,
        roleName: null,
      },
      {
        name: 'Follow-up Reminder',
        description: 'Create follow-up task when opportunity has been idle for 7 days',
        triggerType: 'time_based' as const,
        triggerConditions: {
          'last_activity': { operator: 'less_than', value: 7 } // days
        },
        actions: [
          {
            type: 'create_task' as const,
            config: { 
              subject: 'Follow up on opportunity',
              description: 'Opportunity has been idle for 7 days - time to follow up',
              priority: 'medium'
            }
          }
        ],
        branchSpecific: false,
        roleSpecific: false,
        branchName: null,
        roleName: null,
      }
    ]

    const createdWorkflows: WorkflowAutomationData[] = []
    
    for (const workflow of workflows) {
      const created = await this.createAutomation({
        ...workflow,
        isActive: true,
        organizationId,
        createdBy,
      })
      createdWorkflows.push(created)
    }

    return createdWorkflows
  }

  /**
   * Transform database row to WorkflowAutomationData
   */
  private static transformToWorkflowAutomationData(data: WorkflowAutomation): WorkflowAutomationData {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      triggerType: data.trigger_type,
      triggerConditions: data.trigger_conditions,
      actions: data.actions,
      isActive: data.is_active,
      branchSpecific: data.branch_specific,
      roleSpecific: data.role_specific,
      branchName: data.branch_name,
      roleName: data.role_name,
      organizationId: data.organization_id,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }
}
