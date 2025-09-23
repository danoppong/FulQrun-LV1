// Enterprise Security API Layer
// API functions for enterprise security, compliance, and audit management

import { createClient } from '@supabase/supabase-js';
import { 
  AuditLogEntry, 
  ComplianceReport, 
  SecurityPolicy, 
  RBACPermission, 
  DataPrivacyRequest 
} from '../security/enterprise-security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Audit Logging
async function logAuditEvent(event: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<void> {
  try {
    const { error } = await supabase
      .from('enterprise_audit_logs')
      .insert({
        user_id: event.userId,
        organization_id: event.organizationId,
        action_type: event.actionType,
        entity_type: event.entityType,
        entity_id: event.entityId,
        old_values: event.oldValues,
        new_values: event.newValues,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        session_id: event.sessionId,
        risk_level: event.riskLevel,
        compliance_flags: event.complianceFlags,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error logging audit event:', error);
    throw error;
  }
}

async function getAuditLogs(
  organizationId: string,
  filters: {
    userId?: string;
    actionType?: string;
    entityType?: string;
    riskLevel?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  } = {}
): Promise<AuditLogEntry[]> {
  try {
    let query = supabase
      .from('enterprise_audit_logs')
      .select('*')
      .eq('organization_id', organizationId);

    if (filters.userId) query = query.eq('user_id', filters.userId);
    if (filters.actionType) query = query.eq('action_type', filters.actionType);
    if (filters.entityType) query = query.eq('entity_type', filters.entityType);
    if (filters.riskLevel) query = query.eq('risk_level', filters.riskLevel);
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom.toISOString());
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo.toISOString());

    query = query.order('created_at', { ascending: false });

    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

    const { data, error } = await query;

    if (error) throw error;

    return data.map(log => ({
      id: log.id,
      userId: log.user_id,
      organizationId: log.organization_id,
      actionType: log.action_type,
      entityType: log.entity_type,
      entityId: log.entity_id,
      oldValues: log.old_values,
      newValues: log.new_values,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      sessionId: log.session_id,
      riskLevel: log.risk_level,
      complianceFlags: log.compliance_flags,
      createdAt: new Date(log.created_at)
    }));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}

// Compliance Reporting
async function generateComplianceReport(
  reportType: ComplianceReport['reportType'],
  reportName: string,
  filters: any,
  organizationId: string,
  userId: string
): Promise<ComplianceReport> {
  try {
    const reportData = {
      reportType,
      reportName,
      filters,
      generatedAt: new Date().toISOString(),
      organizationId
    };

    const { data, error } = await supabase
      .from('enterprise_compliance_reports')
      .insert({
        report_type: reportType,
        report_name: reportName,
        report_data: reportData,
        filters: filters,
        status: 'generating',
        organization_id: organizationId,
        created_by: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      reportType: data.report_type,
      reportName: data.report_name,
      reportData: data.report_data,
      filters: data.filters,
      dateRangeStart: data.date_range_start ? new Date(data.date_range_start) : undefined,
      dateRangeEnd: data.date_range_end ? new Date(data.date_range_end) : undefined,
      status: data.status,
      filePath: data.file_path,
      fileSize: data.file_size,
      downloadCount: data.download_count,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      organizationId: data.organization_id,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at)
    };
  } catch (error) {
    console.error('Error generating compliance report:', error);
    throw error;
  }
}

async function getComplianceReports(organizationId: string): Promise<ComplianceReport[]> {
  try {
    const { data, error } = await supabase
      .from('enterprise_compliance_reports')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(report => ({
      id: report.id,
      reportType: report.report_type,
      reportName: report.report_name,
      reportData: report.report_data,
      filters: report.filters,
      dateRangeStart: report.date_range_start ? new Date(report.date_range_start) : undefined,
      dateRangeEnd: report.date_range_end ? new Date(report.date_range_end) : undefined,
      status: report.status,
      filePath: report.file_path,
      fileSize: report.file_size,
      downloadCount: report.download_count,
      expiresAt: report.expires_at ? new Date(report.expires_at) : undefined,
      organizationId: report.organization_id,
      createdBy: report.created_by,
      createdAt: new Date(report.created_at)
    }));
  } catch (error) {
    console.error('Error fetching compliance reports:', error);
    throw error;
  }
}

async function downloadComplianceReport(reportId: string): Promise<Blob> {
  try {
    const { data: report } = await supabase
      .from('enterprise_compliance_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (!report) throw new Error('Report not found');

    // Increment download count
    await supabase
      .from('enterprise_compliance_reports')
      .update({ download_count: report.download_count + 1 })
      .eq('id', reportId);

    // Create downloadable blob
    const reportContent = JSON.stringify(report.report_data, null, 2);
    return new Blob([reportContent], { type: 'application/json' });
  } catch (error) {
    console.error('Error downloading compliance report:', error);
    throw error;
  }
}

// Security Policies
async function createSecurityPolicy(
  policy: Omit<SecurityPolicy, 'id' | 'createdAt'>,
  userId: string
): Promise<SecurityPolicy> {
  try {
    const { data, error } = await supabase
      .from('security_policies')
      .insert({
        name: policy.name,
        description: policy.description,
        policy_type: policy.policyType,
        rules: policy.rules,
        is_active: policy.isActive,
        organization_id: policy.organizationId,
        created_by: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      policyType: data.policy_type,
      rules: data.rules,
      isActive: data.is_active,
      organizationId: data.organization_id,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at)
    };
  } catch (error) {
    console.error('Error creating security policy:', error);
    throw error;
  }
}

async function getSecurityPolicies(organizationId: string): Promise<SecurityPolicy[]> {
  try {
    const { data, error } = await supabase
      .from('security_policies')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(policy => ({
      id: policy.id,
      name: policy.name,
      description: policy.description,
      policyType: policy.policy_type,
      rules: policy.rules,
      isActive: policy.is_active,
      organizationId: policy.organization_id,
      createdBy: policy.created_by,
      createdAt: new Date(policy.created_at)
    }));
  } catch (error) {
    console.error('Error fetching security policies:', error);
    throw error;
  }
}

async function updateSecurityPolicy(
  policyId: string,
  updates: Partial<SecurityPolicy>
): Promise<SecurityPolicy> {
  try {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.description) updateData.description = updates.description;
    if (updates.rules) updateData.rules = updates.rules;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('security_policies')
      .update(updateData)
      .eq('id', policyId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      policyType: data.policy_type,
      rules: data.rules,
      isActive: data.is_active,
      organizationId: data.organization_id,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at)
    };
  } catch (error) {
    console.error('Error updating security policy:', error);
    throw error;
  }
}

async function deleteSecurityPolicy(policyId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('security_policies')
      .delete()
      .eq('id', policyId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting security policy:', error);
    throw error;
  }
}

// RBAC Permissions
async function createRBACPermission(permission: Omit<RBACPermission, 'id'>): Promise<RBACPermission> {
  try {
    const { data, error } = await supabase
      .from('rbac_permissions')
      .insert({
        role: permission.role,
        resource: permission.resource,
        action: permission.action,
        conditions: permission.conditions,
        organization_id: permission.organizationId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      role: data.role,
      resource: data.resource,
      action: data.action,
      conditions: data.conditions,
      organizationId: data.organization_id
    };
  } catch (error) {
    console.error('Error creating RBAC permission:', error);
    throw error;
  }
}

async function getRBACPermissions(organizationId: string): Promise<RBACPermission[]> {
  try {
    const { data, error } = await supabase
      .from('rbac_permissions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('role', { ascending: true });

    if (error) throw error;

    return data.map(permission => ({
      id: permission.id,
      role: permission.role,
      resource: permission.resource,
      action: permission.action,
      conditions: permission.conditions,
      organizationId: permission.organization_id
    }));
  } catch (error) {
    console.error('Error fetching RBAC permissions:', error);
    throw error;
  }
}

async function checkPermission(
  userId: string,
  resource: string,
  action: string,
  organizationId: string
): Promise<boolean> {
  try {
    // Get user's role
    const { data: user } = await supabase
      .from('users')
      .select('enterprise_role')
      .eq('id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (!user) return false;

    // Check if permission exists for the role
    const { data, error } = await supabase
      .from('rbac_permissions')
      .select('*')
      .eq('role', user.enterprise_role)
      .eq('resource', resource)
      .eq('action', action)
      .eq('organization_id', organizationId)
      .single();

    if (error) return false;
    return !!data;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

async function getUserPermissions(userId: string, organizationId: string): Promise<RBACPermission[]> {
  try {
    // Get user's role
    const { data: user } = await supabase
      .from('users')
      .select('enterprise_role')
      .eq('id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (!user) return [];

    // Get permissions for the role
    const { data, error } = await supabase
      .from('rbac_permissions')
      .select('*')
      .eq('role', user.enterprise_role)
      .eq('organization_id', organizationId);

    if (error) throw error;

    return data.map(permission => ({
      id: permission.id,
      role: permission.role,
      resource: permission.resource,
      action: permission.action,
      conditions: permission.conditions,
      organizationId: permission.organization_id
    }));
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
}

// Data Privacy Requests
async function createDataPrivacyRequest(
  request: Omit<DataPrivacyRequest, 'id' | 'createdAt'>
): Promise<DataPrivacyRequest> {
  try {
    const { data, error } = await supabase
      .from('data_privacy_requests')
      .insert({
        request_type: request.requestType,
        requester_email: request.requesterEmail,
        requester_name: request.requesterName,
        entity_type: request.entityType,
        entity_id: request.entityId,
        status: request.status,
        request_data: request.requestData,
        response_data: request.responseData,
        organization_id: request.organizationId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      requestType: data.request_type,
      requesterEmail: data.requester_email,
      requesterName: data.requester_name,
      entityType: data.entity_type,
      entityId: data.entity_id,
      status: data.status,
      requestData: data.request_data,
      responseData: data.response_data,
      organizationId: data.organization_id,
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined
    };
  } catch (error) {
    console.error('Error creating data privacy request:', error);
    throw error;
  }
}

async function getDataPrivacyRequests(organizationId: string): Promise<DataPrivacyRequest[]> {
  try {
    const { data, error } = await supabase
      .from('data_privacy_requests')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(request => ({
      id: request.id,
      requestType: request.request_type,
      requesterEmail: request.requester_email,
      requesterName: request.requester_name,
      entityType: request.entity_type,
      entityId: request.entity_id,
      status: request.status,
      requestData: request.request_data,
      responseData: request.response_data,
      organizationId: request.organization_id,
      createdAt: new Date(request.created_at),
      completedAt: request.completed_at ? new Date(request.completed_at) : undefined
    }));
  } catch (error) {
    console.error('Error fetching data privacy requests:', error);
    throw error;
  }
}

async function processDataPrivacyRequest(
  requestId: string,
  responseData: any
): Promise<void> {
  try {
    const { error } = await supabase
      .from('data_privacy_requests')
      .update({
        response_data: responseData,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) throw error;
  } catch (error) {
    console.error('Error processing data privacy request:', error);
    throw error;
  }
}

// Security Monitoring
async function detectAnomalies(organizationId: string): Promise<any[]> {
  try {
    // Simple anomaly detection based on audit logs
    const { data: auditLogs } = await supabase
      .from('enterprise_audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    const anomalies = [];
    
    // Check for unusual login patterns
    const loginCounts = {};
    auditLogs?.forEach(log => {
      if (log.action_type === 'login') {
        loginCounts[log.user_id] = (loginCounts[log.user_id] || 0) + 1;
      }
    });

    Object.entries(loginCounts).forEach(([userId, count]) => {
      if (count > 10) { // More than 10 logins in 24 hours
        anomalies.push({
          type: 'unusual_login_activity',
          userId,
          count,
          severity: 'medium',
          description: `User ${userId} has ${count} login attempts in the last 24 hours`
        });
      }
    });

    return anomalies;
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    return [];
  }
}

async function getSecurityMetrics(organizationId: string): Promise<any> {
  try {
    const { data: auditLogs } = await supabase
      .from('enterprise_audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('organization_id', organizationId);

    const { data: policies } = await supabase
      .from('security_policies')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    return {
      totalAuditEvents: auditLogs?.length || 0,
      highRiskEvents: auditLogs?.filter(log => log.risk_level === 'high').length || 0,
      criticalEvents: auditLogs?.filter(log => log.risk_level === 'critical').length || 0,
      totalUsers: users?.length || 0,
      mfaEnabledUsers: users?.filter(user => user.mfa_enabled).length || 0,
      activePolicies: policies?.length || 0,
      mfaAdoptionRate: users ? (users.filter(user => user.mfa_enabled).length / users.length) * 100 : 0,
      averageSessionTimeout: users ? users.reduce((sum, user) => sum + (user.session_timeout_minutes || 480), 0) / users.length : 480
    };
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    throw error;
  }
}

// Compliance Status
async function getComplianceStatus(organizationId: string): Promise<any> {
  try {
    const { data: policies } = await supabase
      .from('security_policies')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('organization_id', organizationId);

    const { data: auditLogs } = await supabase
      .from('enterprise_audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    return {
      totalPolicies: policies?.length || 0,
      activePolicies: policies?.filter(p => p.is_active).length || 0,
      totalUsers: users?.length || 0,
      mfaEnabledUsers: users?.filter(u => u.mfa_enabled).length || 0,
      auditEventsLast30Days: auditLogs?.length || 0,
      complianceScore: Math.min(100, ((policies?.length || 0) * 20 + (users?.filter(u => u.mfa_enabled).length || 0) * 10)),
      lastAuditDate: auditLogs?.[0]?.created_at ? new Date(auditLogs[0].created_at) : null
    };
  } catch (error) {
    console.error('Error getting compliance status:', error);
    throw error;
  }
}

// Data Encryption
async function encryptSensitiveData(data: any): Promise<string> {
  try {
    // Simple base64 encoding for demo purposes
    // In production, use proper encryption libraries
    return btoa(JSON.stringify(data));
  } catch (error) {
    console.error('Error encrypting sensitive data:', error);
    throw error;
  }
}

async function decryptSensitiveData(encryptedData: string): Promise<any> {
  try {
    // Simple base64 decoding for demo purposes
    // In production, use proper decryption libraries
    return JSON.parse(atob(encryptedData));
  } catch (error) {
    console.error('Error decrypting sensitive data:', error);
    throw error;
  }
}

// Security Alerts
async function createSecurityAlert(
  alert: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    userId?: string;
    organizationId: string;
  }
): Promise<void> {
  try {
    await supabase
      .from('security_alerts')
      .insert({
        alert_type: alert.type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        user_id: alert.userId,
        organization_id: alert.organizationId,
        status: 'active',
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error creating security alert:', error);
    throw error;
  }
}

async function getSecurityAlerts(organizationId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('security_alerts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    return [];
  }
}

// Export all functions
export {
  logAuditEvent,
  getAuditLogs,
  generateComplianceReport,
  getComplianceReports,
  downloadComplianceReport,
  createSecurityPolicy,
  getSecurityPolicies,
  updateSecurityPolicy,
  deleteSecurityPolicy,
  createRBACPermission,
  getRBACPermissions,
  checkPermission,
  getUserPermissions,
  createDataPrivacyRequest,
  getDataPrivacyRequests,
  processDataPrivacyRequest,
  detectAnomalies,
  getSecurityMetrics,
  getComplianceStatus,
  encryptSensitiveData,
  decryptSensitiveData,
  createSecurityAlert,
  getSecurityAlerts
};
