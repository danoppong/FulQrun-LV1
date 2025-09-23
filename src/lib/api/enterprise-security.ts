// Enterprise Security API Layer
// API functions for enterprise security, compliance, and audit management

import { createClient } from '@supabase/supabase-js';
import EnterpriseSecurityAPI, { 
  AuditLogEntry, 
  ComplianceReport, 
  SecurityPolicy, 
  RBACPermission, 
  DataPrivacyRequest 
} from './enterprise-security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Audit Logging
export async function logAuditEvent(event: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<void> {
  try {
    await EnterpriseSecurityAPI.logAuditEvent(event);
  } catch (error) {
    console.error('Error logging audit event:', error);
    throw error;
  }
}

export async function getAuditLogs(
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
    return await EnterpriseSecurityAPI.getAuditLogs(organizationId, filters);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}

// Compliance Reporting
export async function generateComplianceReport(
  reportType: ComplianceReport['reportType'],
  reportName: string,
  filters: any,
  organizationId: string,
  userId: string
): Promise<ComplianceReport> {
  try {
    return await EnterpriseSecurityAPI.generateComplianceReport(
      reportType,
      reportName,
      filters,
      organizationId,
      userId
    );
  } catch (error) {
    console.error('Error generating compliance report:', error);
    throw error;
  }
}

export async function getComplianceReports(organizationId: string): Promise<ComplianceReport[]> {
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

export async function downloadComplianceReport(reportId: string): Promise<Blob> {
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
export async function createSecurityPolicy(
  policy: Omit<SecurityPolicy, 'id' | 'createdAt'>,
  userId: string
): Promise<SecurityPolicy> {
  try {
    return await EnterpriseSecurityAPI.createSecurityPolicy(policy, userId);
  } catch (error) {
    console.error('Error creating security policy:', error);
    throw error;
  }
}

export async function getSecurityPolicies(organizationId: string): Promise<SecurityPolicy[]> {
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

export async function updateSecurityPolicy(
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

export async function deleteSecurityPolicy(policyId: string): Promise<void> {
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
export async function createRBACPermission(permission: Omit<RBACPermission, 'id'>): Promise<RBACPermission> {
  try {
    return await EnterpriseSecurityAPI.createRBACPermission(permission);
  } catch (error) {
    console.error('Error creating RBAC permission:', error);
    throw error;
  }
}

export async function getRBACPermissions(organizationId: string): Promise<RBACPermission[]> {
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

export async function checkPermission(
  userId: string,
  resource: string,
  action: string,
  organizationId: string
): Promise<boolean> {
  try {
    return await EnterpriseSecurityAPI.checkPermission(userId, resource, action, organizationId);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

export async function getUserPermissions(userId: string, organizationId: string): Promise<RBACPermission[]> {
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
export async function createDataPrivacyRequest(
  request: Omit<DataPrivacyRequest, 'id' | 'createdAt'>
): Promise<DataPrivacyRequest> {
  try {
    return await EnterpriseSecurityAPI.createDataPrivacyRequest(request);
  } catch (error) {
    console.error('Error creating data privacy request:', error);
    throw error;
  }
}

export async function getDataPrivacyRequests(organizationId: string): Promise<DataPrivacyRequest[]> {
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

export async function processDataPrivacyRequest(
  requestId: string,
  responseData: any
): Promise<void> {
  try {
    await EnterpriseSecurityAPI.processDataPrivacyRequest(requestId, responseData);
  } catch (error) {
    console.error('Error processing data privacy request:', error);
    throw error;
  }
}

// Security Monitoring
export async function detectAnomalies(organizationId: string): Promise<any[]> {
  try {
    return await EnterpriseSecurityAPI.detectAnomalies(organizationId);
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    return [];
  }
}

export async function getSecurityMetrics(organizationId: string): Promise<any> {
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
export async function getComplianceStatus(organizationId: string): Promise<any> {
  try {
    return await EnterpriseSecurityAPI.getComplianceStatus(organizationId);
  } catch (error) {
    console.error('Error getting compliance status:', error);
    throw error;
  }
}

// Data Encryption
export async function encryptSensitiveData(data: any): Promise<string> {
  try {
    return await EnterpriseSecurityAPI.encryptSensitiveData(data);
  } catch (error) {
    console.error('Error encrypting sensitive data:', error);
    throw error;
  }
}

export async function decryptSensitiveData(encryptedData: string): Promise<any> {
  try {
    return await EnterpriseSecurityAPI.decryptSensitiveData(encryptedData);
  } catch (error) {
    console.error('Error decrypting sensitive data:', error);
    throw error;
  }
}

// Security Alerts
export async function createSecurityAlert(
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

export async function getSecurityAlerts(organizationId: string): Promise<any[]> {
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
  EnterpriseSecurityAPI
};
