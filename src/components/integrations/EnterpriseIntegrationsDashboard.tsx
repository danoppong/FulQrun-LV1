'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  CogIcon, 
  ArrowPathIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  LinkIcon,
  TrashIcon,
  EyeIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import { 
  getEnterpriseIntegrations,
  createEnterpriseIntegration,
  updateEnterpriseIntegration,
  deleteEnterpriseIntegration,
  testIntegrationConnection,
  syncIntegrationData,
  getIntegrationTemplates,
  getIntegrationStatistics,
  getIntegrationHealth,
  EnterpriseIntegration
} from '@/lib/api/enterprise-integrations';

interface EnterpriseIntegrationsDashboardProps {
  organizationId: string;
  userId: string;
}

export default function EnterpriseIntegrationsDashboard({ organizationId, userId }: EnterpriseIntegrationsDashboardProps) {
  const [integrations, setIntegrations] = useState<EnterpriseIntegration[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [integrationForm, setIntegrationForm] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'integrations' | 'templates'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, [organizationId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [integrationsData, templatesData, statisticsData] = await Promise.all([
        getEnterpriseIntegrations(organizationId),
        getIntegrationTemplates(),
        getIntegrationStatistics(organizationId)
      ]);
      
      setIntegrations(integrationsData);
      setTemplates(templatesData);
      setStatistics(statisticsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntegration = async () => {
    try {
      setLoading(true);
      const newIntegration = await createEnterpriseIntegration({
        integrationType: selectedTemplate.type,
        name: integrationForm.name,
        provider: selectedTemplate.provider,
        config: integrationForm.config || {},
        credentials: integrationForm.credentials || {},
        webhookConfig: {},
        syncConfig: {},
        isActive: true,
        syncFrequencyMinutes: 60,
        syncStatus: 'never',
        organizationId,
        createdBy: userId
      }, userId);
      
      setIntegrations([...integrations, newIntegration]);
      setShowCreateModal(false);
      setIntegrationForm({});
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error creating integration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (integrationId: string) => {
    try {
      setLoading(true);
      const success = await testIntegrationConnection(integrationId);
      if (success) {
        alert('Connection test successful!');
      } else {
        alert('Connection test failed. Please check your configuration.');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('Error testing connection');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncData = async (integrationId: string, entityType: string) => {
    try {
      setLoading(true);
      const result = await syncIntegrationData(integrationId, entityType);
      alert(`Sync completed: ${result.recordsProcessed} records processed, ${result.recordsCreated} created, ${result.recordsUpdated} updated`);
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error syncing data:', error);
      alert('Error syncing data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    if (confirm('Are you sure you want to delete this integration?')) {
      try {
        setLoading(true);
        await deleteEnterpriseIntegration(integrationId);
        setIntegrations(integrations.filter(i => i.id !== integrationId));
      } catch (error) {
        console.error('Error deleting integration:', error);
        alert('Error deleting integration');
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'syncing':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'syncing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: CogIcon },
    { id: 'integrations', name: 'Integrations', icon: LinkIcon },
    { id: 'templates', name: 'Templates', icon: PlusIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enterprise Integrations</h1>
              <p className="mt-2 text-gray-600">
                Connect FulQrun with enterprise systems like Salesforce, Dynamics, SAP, and more
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
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Integration
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
            {/* Statistics */}
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <LinkIcon className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Integrations</p>
                      <p className="text-2xl font-semibold text-gray-900">{statistics.total}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Active Integrations</p>
                      <p className="text-2xl font-semibold text-gray-900">{statistics.active}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Error Status</p>
                      <p className="text-2xl font-semibold text-gray-900">{statistics.byStatus.error || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CogIcon className="h-8 w-8 text-purple-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Integration Types</p>
                      <p className="text-2xl font-semibold text-gray-900">{Object.keys(statistics.byType).length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integration Types */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Integration Types</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(Object.entries(statistics?.byType || {}) as [string, number][]).map(([type, count]) => (
                    <div key={type} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 capitalize">{type}</h4>
                          <p className="text-sm text-gray-500">{count} integration{count > 1 ? 's' : ''}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-gray-900">{count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-6">
            {/* Integrations List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Active Integrations</h3>
              </div>
              <div className="p-6">
                {integrations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No integrations configured</p>
                ) : (
                  <div className="space-y-4">
                    {integrations.map((integration) => (
                      <div key={integration.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <LinkIcon className="h-6 w-6 text-indigo-600" />
                              </div>
                            </div>
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">{integration.name}</h4>
                              <p className="text-sm text-gray-500 capitalize">{integration.integrationType}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(integration.syncStatus)}`}>
                              {integration.syncStatus}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              integration.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {integration.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Last Sync</p>
                            <p className="text-sm text-gray-900">
                              {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString() : 'Never'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Sync Frequency</p>
                            <p className="text-sm text-gray-900">{integration.syncFrequencyMinutes} minutes</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Status</p>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(integration.syncStatus)}
                              <span className="text-sm text-gray-900 capitalize">{integration.syncStatus}</span>
                            </div>
                          </div>
                        </div>

                        {integration.errorMessage && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-800">{integration.errorMessage}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleTestConnection(integration.id)}
                              disabled={loading}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                              <PlayIcon className="h-4 w-4 mr-2" />
                              Test Connection
                            </button>
                            <button
                              onClick={() => handleSyncData(integration.id, 'contacts')}
                              disabled={loading}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                              <ArrowPathIcon className="h-4 w-4 mr-2" />
                              Sync Data
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                              <EyeIcon className="h-4 w-4 mr-2" />
                              View Details
                            </button>
                            <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                              <CogIcon className="h-4 w-4 mr-2" />
                              Configure
                            </button>
                            <button
                              onClick={() => handleDeleteIntegration(integration.id)}
                              className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4 mr-2" />
                              Delete
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

        {activeTab === 'templates' && (
          <div className="space-y-6">
            {/* Integration Templates */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Available Integration Templates</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <div key={template.type} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <LinkIcon className="h-6 w-6 text-indigo-600" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{template.name}</h4>
                          <p className="text-sm text-gray-500 capitalize">{template.type}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                      
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500 mb-2">Supported Entities:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.supportedEntities.map((entity: string) => (
                            <span key={entity} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              {entity}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowCreateModal(true);
                        }}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Configure Integration
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Integration Modal */}
        {showCreateModal && selectedTemplate && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Configure {selectedTemplate.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Integration Name
                    </label>
                    <input
                      type="text"
                      value={integrationForm.name || ''}
                      onChange={(e) => setIntegrationForm({...integrationForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter integration name"
                    />
                  </div>
                  
                  {selectedTemplate.fields.map((field: any) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type={field.type}
                        value={integrationForm[field.name] || ''}
                        onChange={(e) => setIntegrationForm({
                          ...integrationForm, 
                          [field.name]: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        required={field.required}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setSelectedTemplate(null);
                      setIntegrationForm({});
                    }}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateIntegration}
                    disabled={loading || !integrationForm.name}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Integration'}
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
