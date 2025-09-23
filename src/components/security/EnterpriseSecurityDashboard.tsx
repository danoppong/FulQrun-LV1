'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  DocumentTextIcon,
  UserGroupIcon,
  LockClosedIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  CogIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { 
  getAuditLogs,
  generateComplianceReport,
  getComplianceReports,
  downloadComplianceReport,
  getSecurityPolicies,
  getRBACPermissions,
  getDataPrivacyRequests,
  detectAnomalies,
  getSecurityMetrics,
  getComplianceStatus,
  getSecurityAlerts,
  AuditLogEntry,
  ComplianceReport,
  SecurityPolicy,
  RBACPermission,
  DataPrivacyRequest
} from '@/lib/api/enterprise-security';

interface EnterpriseSecurityDashboardProps {
  organizationId: string;
  userId: string;
}

export default function EnterpriseSecurityDashboard({ organizationId, userId }: EnterpriseSecurityDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'compliance' | 'policies' | 'privacy' | 'alerts'>('overview');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([]);
  const [rbacPermissions, setRbacPermissions] = useState<RBACPermission[]>([]);
  const [privacyRequests, setPrivacyRequests] = useState<DataPrivacyRequest[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<any>(null);
  const [complianceStatus, setComplianceStatus] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateReportModal, setShowCreateReportModal] = useState(false);
  const [reportForm, setReportForm] = useState<any>({});

  useEffect(() => {
    loadDashboardData();
  }, [organizationId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        auditLogsData,
        complianceReportsData,
        securityPoliciesData,
        rbacPermissionsData,
        privacyRequestsData,
        securityAlertsData,
        securityMetricsData,
        complianceStatusData,
        anomaliesData
      ] = await Promise.all([
        getAuditLogs(organizationId, { limit: 50 }),
        getComplianceReports(organizationId),
        getSecurityPolicies(organizationId),
        getRBACPermissions(organizationId),
        getDataPrivacyRequests(organizationId),
        getSecurityAlerts(organizationId),
        getSecurityMetrics(organizationId),
        getComplianceStatus(organizationId),
        detectAnomalies(organizationId)
      ]);
      
      setAuditLogs(auditLogsData);
      setComplianceReports(complianceReportsData);
      setSecurityPolicies(securityPoliciesData);
      setRbacPermissions(rbacPermissionsData);
      setPrivacyRequests(privacyRequestsData);
      setSecurityAlerts(securityAlertsData);
      setSecurityMetrics(securityMetricsData);
      setComplianceStatus(complianceStatusData);
      setAnomalies(anomaliesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const report = await generateComplianceReport(
        reportForm.reportType,
        reportForm.reportName,
        reportForm.filters || {},
        organizationId,
        userId
      );
      
      setComplianceReports([report, ...complianceReports]);
      setShowCreateReportModal(false);
      setReportForm({});
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      const blob = await downloadComplianceReport(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${reportId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report');
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'audit', name: 'Audit Logs', icon: EyeIcon },
    { id: 'compliance', name: 'Compliance', icon: ShieldCheckIcon },
    { id: 'policies', name: 'Policies', icon: LockClosedIcon },
    { id: 'privacy', name: 'Privacy', icon: UserGroupIcon },
    { id: 'alerts', name: 'Alerts', icon: ExclamationTriangleIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enterprise Security & Compliance</h1>
              <p className="mt-2 text-gray-600">
                SOC 2 Type II compliance, GDPR/CCPA data privacy controls, and advanced security monitoring
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
                onClick={() => setShowCreateReportModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Generate Report
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
            {/* Security Metrics */}
            {securityMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <EyeIcon className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Audit Events</p>
                      <p className="text-2xl font-semibold text-gray-900">{securityMetrics.totalAuditEvents}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">High Risk Events</p>
                      <p className="text-2xl font-semibold text-gray-900">{securityMetrics.highRiskEvents}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <LockClosedIcon className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">MFA Adoption</p>
                      <p className="text-2xl font-semibold text-gray-900">{Math.round(securityMetrics.mfaAdoptionRate)}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ShieldCheckIcon className="h-8 w-8 text-purple-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Active Policies</p>
                      <p className="text-2xl font-semibold text-gray-900">{securityMetrics.activePolicies}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Compliance Status */}
            {complianceStatus && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-500">Overall Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        complianceStatus.status === 'compliant' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {complianceStatus.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-500">Compliance Level</span>
                      <span className="text-sm text-gray-900 capitalize">{complianceStatus.complianceLevel}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-500">MFA Adoption Rate</span>
                      <span className="text-sm text-gray-900">{Math.round(complianceStatus.mfaAdoptionRate)}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-500">Data Encryption</span>
                      <span className="text-sm text-gray-900">{complianceStatus.encryptionStatus}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-500">Access Control</span>
                      <span className="text-sm text-gray-900">{complianceStatus.accessControlCompliance ? 'Compliant' : 'Non-compliant'}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-500">Audit Logging</span>
                      <span className="text-sm text-gray-900">{complianceStatus.auditLoggingCompliance ? 'Compliant' : 'Non-compliant'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Anomalies */}
            {anomalies.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Security Anomalies Detected</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {anomalies.map((anomaly, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{anomaly.type.replace('_', ' ').toUpperCase()}</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(anomaly.severity)}`}>
                            {anomaly.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{anomaly.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-6">
            {/* Audit Logs */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Audit Logs</h3>
              </div>
              <div className="p-6">
                {auditLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No audit logs available</p>
                ) : (
                  <div className="space-y-4">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{log.actionType.toUpperCase()}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{log.entityType}</span>
                            {log.entityId && (
                              <>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">{log.entityId}</span>
                              </>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(log.riskLevel)}`}>
                            {log.riskLevel.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>User: {log.userId || 'System'}</span>
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        {log.ipAddress && (
                          <div className="text-sm text-gray-500 mt-1">
                            IP: {log.ipAddress}
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

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            {/* Compliance Reports */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Compliance Reports</h3>
              </div>
              <div className="p-6">
                {complianceReports.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No compliance reports available</p>
                ) : (
                  <div className="space-y-4">
                    {complianceReports.map((report) => (
                      <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{report.reportName}</h4>
                            <p className="text-sm text-gray-500 capitalize">{report.reportType.replace('_', ' ')}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                              {report.status.toUpperCase()}
                            </span>
                            {report.status === 'completed' && (
                              <button
                                onClick={() => handleDownloadReport(report.id)}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                                Download
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Created: {new Date(report.createdAt).toLocaleDateString()}</span>
                          <span>Downloads: {report.downloadCount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="space-y-6">
            {/* Security Policies */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Security Policies</h3>
              </div>
              <div className="p-6">
                {securityPolicies.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No security policies configured</p>
                ) : (
                  <div className="space-y-4">
                    {securityPolicies.map((policy) => (
                      <div key={policy.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{policy.name}</h4>
                            <p className="text-sm text-gray-500">{policy.description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              policy.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {policy.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                              <CogIcon className="h-4 w-4 mr-2" />
                              Configure
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Type: {policy.policyType.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            {/* Data Privacy Requests */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Data Privacy Requests</h3>
              </div>
              <div className="p-6">
                {privacyRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No privacy requests available</p>
                ) : (
                  <div className="space-y-4">
                    {privacyRequests.map((request) => (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{request.requesterEmail}</h4>
                            <p className="text-sm text-gray-500 capitalize">{request.requestType.replace('_', ' ')}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                            {request.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Entity: {request.entityType}</span>
                          <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-6">
            {/* Security Alerts */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Security Alerts</h3>
              </div>
              <div className="p-6">
                {securityAlerts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No security alerts</p>
                ) : (
                  <div className="space-y-4">
                    {securityAlerts.map((alert) => (
                      <div key={alert.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{alert.title}</h4>
                            <p className="text-sm text-gray-500">{alert.description}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Type: {alert.alert_type}</span>
                          <span>{new Date(alert.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Report Modal */}
        {showCreateReportModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Generate Compliance Report
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Report Name
                    </label>
                    <input
                      type="text"
                      value={reportForm.reportName || ''}
                      onChange={(e) => setReportForm({...reportForm, reportName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter report name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Report Type
                    </label>
                    <select
                      value={reportForm.reportType || ''}
                      onChange={(e) => setReportForm({...reportForm, reportType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select report type</option>
                      <option value="audit_log">Audit Log</option>
                      <option value="data_export">Data Export</option>
                      <option value="user_activity">User Activity</option>
                      <option value="security_scan">Security Scan</option>
                      <option value="compliance_check">Compliance Check</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateReportModal(false);
                      setReportForm({});
                    }}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateReport}
                    disabled={loading || !reportForm.reportName || !reportForm.reportType}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'Generate Report'}
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
