// Administration Module - Organization Features & Modules Management
// Comprehensive module features management interface

'use client';

import React, { useState, useEffect } from 'react';
import {
  PuzzlePieceIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  LockClosedIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface ModuleFeature {
  id: string;
  moduleName: string;
  featureKey: string;
  featureName: string;
  isEnabled: boolean;
  isBeta: boolean;
  requiresLicense?: string;
  dependsOn: string[];
  config: Record<string, unknown>;
  rolloutPercentage: number;
  enabledForRoles: string[];
}

interface Module {
  name: string;
  displayName: string;
  description: string;
  features: ModuleFeature[];
  enabledFeatures: number;
  totalFeatures: number;
  isFullyEnabled: boolean;
}

// =============================================================================
// MODULE METADATA
// =============================================================================

const MODULE_METADATA: Record<string, { displayName: string; description: string }> = {
  crm: {
    displayName: 'CRM',
    description: 'Customer Relationship Management - Leads, contacts, and opportunities'
  },
  sales_performance: {
    displayName: 'Sales Performance',
    description: 'Sales metrics, forecasting, and performance analytics'
  },
  kpi: {
    displayName: 'KPI & Analytics',
    description: 'Key Performance Indicators and business analytics'
  },
  learning: {
    displayName: 'Learning Platform',
    description: 'Training materials, courses, and learning management'
  },
  integrations: {
    displayName: 'Integration Hub',
    description: 'Third-party integrations and API connections'
  },
  ai: {
    displayName: 'AI & Automation',
    description: 'AI-powered features and workflow automation'
  },
  mobile: {
    displayName: 'Mobile App',
    description: 'Mobile application features and capabilities'
  },
  pharmaceutical_bi: {
    displayName: 'Pharmaceutical BI',
    description: 'Pharmaceutical business intelligence and analytics'
  },
  workflows: {
    displayName: 'Workflows',
    description: 'Custom workflow automation and business processes'
  },
  analytics: {
    displayName: 'Analytics',
    description: 'Advanced analytics and reporting capabilities'
  }
};

// =============================================================================
// MODULE CARD COMPONENT
// =============================================================================

function ModuleCard({ module, onFeatureToggled }: { module: Module; onFeatureToggled: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isToggling, setIsToggling] = useState<Record<string, boolean>>({});

  const handleToggleFeature = async (featureKey: string, currentState: boolean) => {
    setIsToggling(prev => ({ ...prev, [featureKey]: true }));
    
    try {
      const response = await fetch('/api/admin/features/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          moduleName: module.name,
          featureKey,
          enabled: !currentState
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to toggle feature');
      }

      console.log(`✅ Successfully toggled ${featureKey} to ${!currentState}`);
      
      // Refresh the modules list to show updated state
      onFeatureToggled();
      
    } catch (error) {
      console.error('❌ Error toggling feature:', error);
      alert(`Error toggling feature: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsToggling(prev => ({ ...prev, [featureKey]: false }));
    }
  };

  const progressPercentage = (module.enabledFeatures / module.totalFeatures) * 100;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Module Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <PuzzlePieceIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {module.displayName}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {module.description}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 ml-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {module.enabledFeatures} / {module.totalFeatures}
              </div>
              <div className="text-xs text-gray-500">Features Active</div>
            </div>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Activation Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                progressPercentage === 100 ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Feature List (Expandable) */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="space-y-3">
            {module.features.map((feature) => (
              <div
                key={feature.id}
                className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="text-sm font-medium text-gray-900">
                      {feature.featureName}
                    </h4>
                    
                    {feature.isBeta && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        <BeakerIcon className="h-3 w-3 mr-1" />
                        Beta
                      </span>
                    )}
                    
                    {feature.requiresLicense && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        <LockClosedIcon className="h-3 w-3 mr-1" />
                        {feature.requiresLicense}
                      </span>
                    )}
                  </div>
                  
                  {feature.dependsOn.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Depends on: {feature.dependsOn.join(', ')}
                    </p>
                  )}
                  
                  {feature.rolloutPercentage < 100 && (
                    <p className="text-xs text-blue-600 mt-1">
                      Rolled out to {feature.rolloutPercentage}% of users
                    </p>
                  )}
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => handleToggleFeature(feature.featureKey, feature.isEnabled)}
                    disabled={isToggling[feature.featureKey]}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      feature.isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    } ${isToggling[feature.featureKey] ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        feature.isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN FEATURES COMPONENT
// =============================================================================

export default function OrganizationFeatures() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setLoading(true);
    
    try {
      // Try to fetch from API
      const response = await fetch('/api/admin/modules', {
        credentials: 'include', // Include cookies for authentication
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform API data into Module objects
        const modulesData: Module[] = data.modules?.map((mod: any) => ({
          name: mod.name,
          displayName: MODULE_METADATA[mod.name]?.displayName || mod.name,
          description: MODULE_METADATA[mod.name]?.description || '',
          features: mod.features || [],
          enabledFeatures: mod.enabledFeatures || 0,
          totalFeatures: mod.totalFeatures || 0,
          isFullyEnabled: mod.enabledFeatures === mod.totalFeatures
        })) || [];
        
        setModules(modulesData);
        setLoading(false);
        return; // Successfully loaded from API
      }
      
      // If API fails, fall through to mock data
      console.warn('API returned error, using mock data:', response.status);
    } catch (error) {
      console.error('Error loading modules, using mock data:', error);
    }
    
    // Fallback to mock data for development (used when API fails)
    const mockModules: Module[] = [
        {
          name: 'crm',
          displayName: MODULE_METADATA.crm.displayName,
          description: MODULE_METADATA.crm.description,
          features: [
            {
              id: '1',
              moduleName: 'crm',
              featureKey: 'leads',
              featureName: 'Lead Management',
              isEnabled: true,
              isBeta: false,
              dependsOn: [],
              config: {},
              rolloutPercentage: 100,
              enabledForRoles: []
            },
            {
              id: '2',
              moduleName: 'crm',
              featureKey: 'opportunities',
              featureName: 'Opportunity Tracking',
              isEnabled: true,
              isBeta: false,
              dependsOn: ['leads'],
              config: {},
              rolloutPercentage: 100,
              enabledForRoles: []
            },
            {
              id: '3',
              moduleName: 'crm',
              featureKey: 'ai_scoring',
              featureName: 'AI Lead Scoring',
              isEnabled: false,
              isBeta: true,
              requiresLicense: 'enterprise',
              dependsOn: ['leads'],
              config: {},
              rolloutPercentage: 50,
              enabledForRoles: []
            }
          ],
          enabledFeatures: 2,
          totalFeatures: 3,
          isFullyEnabled: false
        },
        {
          name: 'sales_performance',
          displayName: MODULE_METADATA.sales_performance.displayName,
          description: MODULE_METADATA.sales_performance.description,
          features: [
            {
              id: '4',
              moduleName: 'sales_performance',
              featureKey: 'forecasting',
              featureName: 'Sales Forecasting',
              isEnabled: true,
              isBeta: false,
              dependsOn: [],
              config: {},
              rolloutPercentage: 100,
              enabledForRoles: []
            },
            {
              id: '5',
              moduleName: 'sales_performance',
              featureKey: 'metrics',
              featureName: 'Performance Metrics',
              isEnabled: true,
              isBeta: false,
              dependsOn: [],
              config: {},
              rolloutPercentage: 100,
              enabledForRoles: []
            }
          ],
          enabledFeatures: 2,
          totalFeatures: 2,
          isFullyEnabled: true
        }
    ];
    
    setModules(mockModules);
    setLoading(false);
  };

  // Filter modules based on status and search
  const filteredModules = modules.filter(module => {
    // Status filter
    if (filterStatus === 'enabled' && !module.isFullyEnabled) return false;
    if (filterStatus === 'disabled' && module.isFullyEnabled) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        module.displayName.toLowerCase().includes(query) ||
        module.description.toLowerCase().includes(query) ||
        module.features.some(f => f.featureName.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Features & Modules</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enable and configure modules and features for your organization
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PuzzlePieceIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Modules</p>
              <p className="text-2xl font-semibold text-gray-900">{modules.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Fully Enabled</p>
              <p className="text-2xl font-semibold text-gray-900">
                {modules.filter(m => m.isFullyEnabled).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BeakerIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Beta Features</p>
              <p className="text-2xl font-semibold text-gray-900">
                {modules.reduce((sum, m) => sum + m.features.filter(f => f.isBeta).length, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Modules
          </button>
          <button
            onClick={() => setFilterStatus('enabled')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filterStatus === 'enabled'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Enabled
          </button>
          <button
            onClick={() => setFilterStatus('disabled')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filterStatus === 'disabled'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Partially Enabled
          </button>
        </div>

        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search modules and features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Module Cards */}
      <div className="space-y-4">
        {filteredModules.length > 0 ? (
          filteredModules.map((module) => (
            <ModuleCard 
              key={module.name} 
              module={module} 
              onFeatureToggled={loadModules}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No modules found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

