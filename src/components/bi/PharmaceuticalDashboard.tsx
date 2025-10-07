// src/components/bi/PharmaceuticalDashboard.tsx
// Main Pharmaceutical BI Dashboard Component
// Provides comprehensive KPI visualization and analytics for pharmaceutical sales

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  MapIcon,
  BeakerIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { KPICard } from './KPICard'
import { TerritoryPerformanceChart } from './TerritoryPerformanceChart'
import { ProductPerformanceChart } from './ProductPerformanceChart'
import { RecentActivityFeed } from './RecentActivityFeed'
import { HCPEngagementWidget } from './HCPEngagementWidget'
import { SampleDistributionWidget } from './SampleDistributionWidget'
import { FormularyAccessWidget } from './FormularyAccessWidget'
import { ConversationalAnalytics } from './ConversationalAnalytics';

interface PharmaceuticalDashboardProps {
  organizationId: string;
  userId: string;
  role: 'rep' | 'manager' | 'admin';
}

interface DashboardData {
  summary: {
    totalKPIs: number;
    periodStart: string;
    periodEnd: string;
    territoryId?: string;
    productId?: string;
  };
  kpis: Record<string, {
    name: string;
    value: number;
    confidence: number;
    calculatedAt: string;
    metadata: Record<string, unknown>;
  }>;
  hcpEngagement: {
    totalHCPs: number;
    engagedHCPs: number;
    engagementRate: number;
    avgInteractions: number;
  };
  recentPrescriptions: unknown[];
  recentCalls: unknown[];
  territoryPerformance: Array<{
    territory: unknown;
    kpis: unknown[];
  }>;
  productPerformance: Array<{
    productId: string;
    productName: string;
    totalVolume: number;
    newVolume: number;
    refillVolume: number;
  }>;
  sampleDistribution: Array<{
    productId: string;
    productName: string;
    totalSamples: number;
  }>;
  sampleToScriptRatios: Array<{
    productId: string;
    productName: string;
    samples: number;
    scripts: number;
    ratio: number;
  }>;
  formularyAccess: Array<{
    productId: string;
    productName: string;
    totalPayers: number;
    favorablePayers: number;
    coverageBreakdown: Record<string, number>;
  }>;
  userRole: string;
  userTerritories: string[];
}

export default function PharmaceuticalDashboard({ 
  organizationId, 
  userId, 
  role 
}: PharmaceuticalDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'territory' | 'products' | 'hcps' | 'samples' | 'formulary' | 'analytics'>('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodStart, setPeriodStart] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTerritory, setSelectedTerritory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        organizationId,
        periodStart,
        periodEnd
      });
      
      if (selectedTerritory) {
        params.append('territoryId', selectedTerritory);
      }
      
      if (selectedProduct) {
        params.append('productId', selectedProduct);
      }

      const response = await fetch(`/api/bi/dashboard?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load dashboard data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Dashboard data loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, periodStart, periodEnd, selectedTerritory, selectedProduct]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getKPITrend = (kpiId: string, currentValue: number): 'up' | 'down' | 'stable' => {
    // This would typically compare with previous period
    // For now, return stable as placeholder
    return 'stable';
  };

  const getKPIColor = (kpiId: string, value: number): string => {
    // Define color schemes based on KPI type and value
    switch (kpiId) {
      case 'trx':
      case 'nrx':
        return value > 1000 ? 'text-green-600' : value > 500 ? 'text-yellow-600' : 'text-red-600';
      case 'market_share':
        return value > 15 ? 'text-green-600' : value > 10 ? 'text-yellow-600' : 'text-red-600';
      case 'growth':
        return value > 10 ? 'text-green-600' : value > 0 ? 'text-yellow-600' : 'text-red-600';
      case 'reach':
        return value > 80 ? 'text-green-600' : value > 60 ? 'text-yellow-600' : 'text-red-600';
      case 'frequency':
        return value > 3 ? 'text-green-600' : value > 2 ? 'text-yellow-600' : 'text-red-600';
      case 'call_effectiveness':
        return value > 2 ? 'text-green-600' : value > 1.5 ? 'text-yellow-600' : 'text-red-600';
      case 'sample_to_script_ratio':
        return value < 10 ? 'text-green-600' : value < 15 ? 'text-yellow-600' : 'text-red-600';
      case 'formulary_access':
        return value > 80 ? 'text-green-600' : value > 60 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'territory', name: 'Territory Performance', icon: MapIcon },
    { id: 'products', name: 'Product Performance', icon: BeakerIcon },
    { id: 'hcps', name: 'HCP Engagement', icon: UserGroupIcon },
    { id: 'samples', name: 'Sample Distribution', icon: DocumentTextIcon },
    { id: 'formulary', name: 'Formulary Access', icon: CheckCircleIcon },
    { id: 'analytics', name: 'AI Analytics', icon: SparklesIcon }
  ];

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ClockIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading pharmaceutical dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-phase3-primary bg-clip-text text-transparent">
                Pharmaceutical Sales Intelligence
              </h1>
              <p className="mt-2 text-gray-600">
                Comprehensive KPI analytics and insights for pharmaceutical sales operations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Period Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Period:</label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              {/* Refresh Button */}
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
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Refresh Data
                  </>
                )}
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
                  onClick={() => setActiveTab(tab.id as unknown)}
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
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(dashboardData.kpis).map(([kpiId, kpi]) => (
                <KPICard
                  key={kpiId}
                  title={kpi.name}
                  value={kpi.value}
                  trend={getKPITrend(kpiId, kpi.value)}
                  color={getKPIColor(kpiId, kpi.value)}
                  confidence={kpi.confidence}
                  metadata={kpi.metadata}
                />
              ))}
            </div>

            {/* HCP Engagement Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">HCP Engagement Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{dashboardData.hcpEngagement?.totalHCPs || 0}</p>
                  <p className="text-sm text-gray-500">Total HCPs</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{dashboardData.hcpEngagement?.engagedHCPs || 0}</p>
                  <p className="text-sm text-gray-500">Engaged HCPs</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {(dashboardData.hcpEngagement?.engagementRate || 0).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">Engagement Rate</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivityFeed
                title="Recent Prescriptions"
                activities={dashboardData.recentPrescriptions || []}
                type="prescriptions"
              />
              <RecentActivityFeed
                title="Recent Calls"
                activities={dashboardData.recentCalls || []}
                type="calls"
              />
            </div>
          </div>
        )}

        {activeTab === 'territory' && dashboardData && (
          <TerritoryPerformanceChart
            territoryPerformance={dashboardData.territoryPerformance || []}
            userRole={role}
          />
        )}

        {activeTab === 'products' && dashboardData && (
          <ProductPerformanceChart
            productPerformance={dashboardData.productPerformance || []}
            sampleToScriptRatios={dashboardData.sampleToScriptRatios || []}
          />
        )}

        {activeTab === 'hcps' && dashboardData && (
          <HCPEngagementWidget
            hcpEngagement={dashboardData.hcpEngagement || {}}
            recentCalls={dashboardData.recentCalls || []}
          />
        )}

        {activeTab === 'samples' && dashboardData && (
          <SampleDistributionWidget
            sampleDistribution={dashboardData.sampleDistribution || {}}
            sampleToScriptRatios={dashboardData.sampleDistribution || {}}
          />
        )}

        {activeTab === 'formulary' && dashboardData && (
          <FormularyAccessWidget
            formularyAccess={dashboardData.formularyAccess || {}}
          />
        )}

        {activeTab === 'analytics' && (
          <div className="h-[600px]">
            <ConversationalAnalytics
              organizationId={organizationId}
              userId={userId}
              userRole={role}
            />
          </div>
        )}
      </div>
    </div>
  );
}
