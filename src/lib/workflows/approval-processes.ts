// Approval Processes
// Advanced approval workflow management for enterprise workflows

import { createClient } from '@supabase/supabase-js'
import { ApprovalConfig, EscalationConfig } from './workflow-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Approval-specific types
export interface ApprovalRequest {
  id: string;
  workflowExecutionId: string;
  stepId: string;
  entityType: string;
  entityId: string;
  approvers: ApprovalUser[];
  approvalType: 'sequential' | 'parallel' | 'any';
  minApprovals: number;
  currentApprovals: number;
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: Date;
  escalationConfig: EscalationConfig;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalUser {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  department: string;
  isRequired: boolean;
  order: number;
}

export interface ApprovalResponse {
  id: string;
  approvalRequestId: string;
  userId: string;
  action: 'approve' | 'reject' | 'delegate';
  comment?: string;
  delegatedTo?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface ApprovalTemplate {
  id: string;
  name: string;
  description: string;
  entityType: string;
  approvalType: 'sequential' | 'parallel' | 'any';
  approvers: ApprovalUser[];
  minApprovals: number;
  escalationConfig: EscalationConfig;
  timeoutHours: number;
  isActive: boolean;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
}

// Approval Process Manager
export class ApprovalProcessManager {
  private approvalTemplates: Map<string, ApprovalTemplate> = new Map();

  constructor() {
    this.loadApprovalTemplates();
  }

  /**
   * Create an approval request
   */
  async createApprovalRequest(
    workflowExecutionId: string,
    stepId: string,
    entityType: string,
    entityId: string,
    approvalConfig: ApprovalConfig,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    organizationId: string
  ): Promise<ApprovalRequest> {
    try {
      const dueDate = approvalConfig.timeoutHours 
        ? new Date(Date.now() + approvalConfig.timeoutHours * 60 * 60 * 1000)
        : undefined;

      const { data, error } = await supabase
        .from('approval_requests')
        .insert({
          workflow_execution_id: workflowExecutionId,
          step_id: stepId,
          entity_type: entityType,
          entity_id: entityId,
          approvers: approvalConfig.approvers,
          approval_type: approvalConfig.approvalType,
          min_approvals: approvalConfig.minApprovals,
          current_approvals: 0,
          status: 'pending',
          priority,
          due_date: dueDate?.toISOString(),
          escalation_config: approvalConfig.escalationConfig,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) throw error;

      const approvalRequest: ApprovalRequest = {
        id: data.id,
        workflowExecutionId: data.workflow_execution_id,
        stepId: data.step_id,
        entityType: data.entity_type,
        entityId: data.entity_id,
        approvers: data.approvers,
        approvalType: data.approval_type,
        minApprovals: data.min_approvals,
        currentApprovals: data.current_approvals,
        status: data.status,
        priority: data.priority,
        dueDate: data.due_date ? new Date(data.due_date) : undefined,
        escalationConfig: data.escalation_config,
        organizationId: data.organization_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      // Send notifications to approvers
      await this.notifyApprovers(approvalRequest);

      return approvalRequest;
    } catch (error) {
      console.error('Error creating approval request:', error);
      throw error;
    }
  }

  /**
   * Process an approval response
   */
  async processApprovalResponse(
    approvalRequestId: string,
    userId: string,
    action: 'approve' | 'reject' | 'delegate',
    comment?: string,
    delegatedTo?: string
  ): Promise<void> {
    try {
      // Get approval request
      const approvalRequest = await this.getApprovalRequest(approvalRequestId);
      if (!approvalRequest) {
        throw new Error('Approval request not found');
      }

      if (approvalRequest.status !== 'pending') {
        throw new Error('Approval request is not pending');
      }

      // Check if user is authorized to approve
      const approver = approvalRequest.approvers.find(a => a.userId === userId);
      if (!approver) {
        throw new Error('User is not authorized to approve this request');
      }

      // Create approval response
      await this.createApprovalResponse(
        approvalRequestId,
        userId,
        action,
        comment,
        delegatedTo
      );

      // Update approval request
      if (action === 'approve') {
        approvalRequest.currentApprovals++;
        
        // Check if approval is complete
        if (this.isApprovalComplete(approvalRequest)) {
          approvalRequest.status = 'approved';
          await this.completeApproval(approvalRequest);
        }
      } else if (action === 'reject') {
        approvalRequest.status = 'rejected';
        await this.completeApproval(approvalRequest);
      } else if (action === 'delegate' && delegatedTo) {
        // Handle delegation
        await this.handleDelegation(approvalRequest, userId, delegatedTo);
      }

      // Update approval request in database
      await this.updateApprovalRequest(approvalRequest);

      // Send notifications
      await this.notifyApprovalUpdate(approvalRequest);

    } catch (error) {
      console.error('Error processing approval response:', error);
      throw error;
    }
  }

  /**
   * Get approval request by ID
   */
  async getApprovalRequest(approvalRequestId: string): Promise<ApprovalRequest | null> {
    try {
      const { data, error } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('id', approvalRequestId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        workflowExecutionId: data.workflow_execution_id,
        stepId: data.step_id,
        entityType: data.entity_type,
        entityId: data.entity_id,
        approvers: data.approvers,
        approvalType: data.approval_type,
        minApprovals: data.min_approvals,
        currentApprovals: data.current_approvals,
        status: data.status,
        priority: data.priority,
        dueDate: data.due_date ? new Date(data.due_date) : undefined,
        escalationConfig: data.escalation_config,
        organizationId: data.organization_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error getting approval request:', error);
      return null;
    }
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovals(
    userId: string,
    organizationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApprovalRequest[]> {
    try {
      const { data, error } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .contains('approvers', [{ userId }])
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data.map(request => ({
        id: request.id,
        workflowExecutionId: request.workflow_execution_id,
        stepId: request.step_id,
        entityType: request.entity_type,
        entityId: request.entity_id,
        approvers: request.approvers,
        approvalType: request.approval_type,
        minApprovals: request.min_approvals,
        currentApprovals: request.current_approvals,
        status: request.status,
        priority: request.priority,
        dueDate: request.due_date ? new Date(request.due_date) : undefined,
        escalationConfig: request.escalation_config,
        organizationId: request.organization_id,
        createdAt: new Date(request.created_at),
        updatedAt: new Date(request.updated_at),
      }));
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      throw error;
    }
  }

  /**
   * Create approval template
   */
  async createApprovalTemplate(
    name: string,
    description: string,
    entityType: string,
    approvalType: 'sequential' | 'parallel' | 'any',
    approvers: ApprovalUser[],
    minApprovals: number,
    escalationConfig: EscalationConfig,
    timeoutHours: number,
    organizationId: string,
    createdBy: string
  ): Promise<ApprovalTemplate> {
    try {
      const { data, error } = await supabase
        .from('approval_templates')
        .insert({
          name,
          description,
          entity_type: entityType,
          approval_type: approvalType,
          approvers,
          min_approvals: minApprovals,
          escalation_config: escalationConfig,
          timeout_hours: timeoutHours,
          is_active: true,
          organization_id: organizationId,
          created_by: createdBy,
        })
        .select()
        .single();

      if (error) throw error;

      const template: ApprovalTemplate = {
        id: data.id,
        name: data.name,
        description: data.description,
        entityType: data.entity_type,
        approvalType: data.approval_type,
        approvers: data.approvers,
        minApprovals: data.min_approvals,
        escalationConfig: data.escalation_config,
        timeoutHours: data.timeout_hours,
        isActive: data.is_active,
        organizationId: data.organization_id,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
      };

      this.approvalTemplates.set(template.id, template);
      return template;
    } catch (error) {
      console.error('Error creating approval template:', error);
      throw error;
    }
  }

  /**
   * Get approval template by ID
   */
  async getApprovalTemplate(templateId: string): Promise<ApprovalTemplate | null> {
    if (this.approvalTemplates.has(templateId)) {
      return this.approvalTemplates.get(templateId)!;
    }

    try {
      const { data, error } = await supabase
        .from('approval_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error || !data) return null;

      const template: ApprovalTemplate = {
        id: data.id,
        name: data.name,
        description: data.description,
        entityType: data.entity_type,
        approvalType: data.approval_type,
        approvers: data.approvers,
        minApprovals: data.min_approvals,
        escalationConfig: data.escalation_config,
        timeoutHours: data.timeout_hours,
        isActive: data.is_active,
        organizationId: data.organization_id,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
      };

      this.approvalTemplates.set(templateId, template);
      return template;
    } catch (error) {
      console.error('Error getting approval template:', error);
      return null;
    }
  }

  /**
   * Process expired approvals
   */
  async processExpiredApprovals(): Promise<void> {
    try {
      const { data: expiredApprovals, error } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('status', 'pending')
        .lt('due_date', new Date().toISOString());

      if (error) throw error;

      for (const approval of expiredApprovals) {
        await this.handleExpiredApproval(approval);
      }
    } catch (error) {
      console.error('Error processing expired approvals:', error);
    }
  }

  // Private methods
  private async loadApprovalTemplates(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('approval_templates')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      for (const template of data) {
        this.approvalTemplates.set(template.id, {
          id: template.id,
          name: template.name,
          description: template.description,
          entityType: template.entity_type,
          approvalType: template.approval_type,
          approvers: template.approvers,
          minApprovals: template.min_approvals,
          escalationConfig: template.escalation_config,
          timeoutHours: template.timeout_hours,
          isActive: template.is_active,
          organizationId: template.organization_id,
          createdBy: template.created_by,
          createdAt: new Date(template.created_at),
        });
      }
    } catch (error) {
      console.error('Error loading approval templates:', error);
    }
  }

  private async createApprovalResponse(
    approvalRequestId: string,
    userId: string,
    action: 'approve' | 'reject' | 'delegate',
    comment?: string,
    delegatedTo?: string
  ): Promise<void> {
    await supabase
      .from('approval_responses')
      .insert({
        approval_request_id: approvalRequestId,
        user_id: userId,
        action,
        comment,
        delegated_to: delegatedTo,
        timestamp: new Date().toISOString(),
      });
  }

  private isApprovalComplete(approvalRequest: ApprovalRequest): boolean {
    switch (approvalRequest.approvalType) {
      case 'any':
        return approvalRequest.currentApprovals >= 1;
      case 'sequential':
        return approvalRequest.currentApprovals >= approvalRequest.minApprovals;
      case 'parallel':
        return approvalRequest.currentApprovals >= approvalRequest.minApprovals;
      default:
        return false;
    }
  }

  private async completeApproval(approvalRequest: ApprovalRequest): Promise<void> {
    // Update workflow execution to continue
    await supabase
      .from('workflow_executions')
      .update({
        execution_data: {
          approval_status: approvalRequest.status,
          approval_completed_at: new Date().toISOString(),
        },
      })
      .eq('id', approvalRequest.workflowExecutionId);
  }

  private async handleDelegation(
    approvalRequest: ApprovalRequest,
    delegatorId: string,
    delegateeId: string
  ): Promise<void> {
    // Update approvers list to replace delegator with delegatee
    const updatedApprovers = approvalRequest.approvers.map(approver => {
      if (approver.userId === delegatorId) {
        return { ...approver, userId: delegateeId };
      }
      return approver;
    });

    approvalRequest.approvers = updatedApprovers;
  }

  private async updateApprovalRequest(approvalRequest: ApprovalRequest): Promise<void> {
    await supabase
      .from('approval_requests')
      .update({
        approvers: approvalRequest.approvers,
        current_approvals: approvalRequest.currentApprovals,
        status: approvalRequest.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', approvalRequest.id);
  }

  private async notifyApprovers(approvalRequest: ApprovalRequest): Promise<void> {
    // Send notifications to all approvers
    for (const approver of approvalRequest.approvers) {
      await this.sendApprovalNotification(approver, approvalRequest);
    }
  }

  private async notifyApprovalUpdate(approvalRequest: ApprovalRequest): Promise<void> {
    // Send notifications about approval status update
    console.log(`Approval ${approvalRequest.id} status updated to ${approvalRequest.status}`);
  }

  private async sendApprovalNotification(
    approver: ApprovalUser,
    _approvalRequest: ApprovalRequest
  ): Promise<void> {
    // Send email/Slack notification to approver
    console.log(`Sending approval notification to ${approver.email}`);
  }

  private async handleExpiredApproval(approval: ApprovalRequest): Promise<void> {
    // Handle expired approval based on escalation config
    if (approval.escalationConfig?.enabled) {
      await this.escalateApproval(approval);
    } else {
      // Mark as expired
      await supabase
        .from('approval_requests')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', approval.id);
    }
  }

  private async escalateApproval(approval: ApprovalRequest): Promise<void> {
    // Implement escalation logic
    console.log(`Escalating approval ${approval.id}`);
  }
}

// Singleton instance
export const approvalProcessManager = new ApprovalProcessManager();
