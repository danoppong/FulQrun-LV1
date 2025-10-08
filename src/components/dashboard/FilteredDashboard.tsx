// src/components/dashboard/FilteredDashboard.tsx
// Example integration of FilterPanel with existing dashboard components
// Shows how to connect filters with KPI widgets and drill-down analytics

'use client';

import React from 'react';
import { FilterProvider } from '@/contexts/FilterContext';
import { TimePeriodProvider } from '@/contexts/TimePeriodContext';
import { FilterPanel } from './filters/FilterPanel';
import { TimePeriodSelector } from './controls/TimePeriodSelector';
import { useActiveFilters, useFilterQueryParams } from '@/contexts/FilterContext';
import { useCurrentTimeRange } from '@/contexts/TimePeriodContext';
import { 
  FilterGroup, 
  TerritoryFilterGroup, 
  ProductFilterGroup 
} from '@/lib/types/filters';

// Sample filter groups configuration
const sampleFilterGroups: FilterGroup[] = [
  {
    id: 'territories',
    label: 'Territories',
    type: 'territory',
    options: [
      { id: 'territory-1', label: 'Northeast Region', value: 'northeast', regionId: 'region-1', repCount: 15, coverage: 'urban' },
      { id: 'territory-2', label: 'Southeast Region', value: 'southeast', regionId: 'region-1', repCount: 12, coverage: 'mixed' },
      { id: 'territory-3', label: 'West Coast', value: 'westcoast', regionId: 'region-2', repCount: 20, coverage: 'urban' },
      { id: 'territory-4', label: 'Midwest', value: 'midwest', regionId: 'region-2', repCount: 8, coverage: 'rural' },
    ],
    multiSelect: true,
    searchable: true,
    hierarchical: true,
    regions: [
      { id: 'region-1', label: 'Eastern Division', value: 'eastern' },
      { id: 'region-2', label: 'Western Division', value: 'western' },
    ],
  } as TerritoryFilterGroup,
  
  {
    id: 'products',
    label: 'Products',
    type: 'product',
    options: [
      { 
        id: 'product-1', 
        label: 'CardioMax Pro', 
        value: 'cardiomax-pro',
        categoryId: 'cardiology',
        therapeuticArea: 'Cardiovascular',
        status: 'active',
        priority: 'high',
        launchDate: new Date('2023-01-15'),
        count: 1250
      },
      { 
        id: 'product-2', 
        label: 'DiabetesCare Plus', 
        value: 'diabetescare-plus',
        categoryId: 'endocrinology',
        therapeuticArea: 'Endocrinology',
        status: 'active',
        priority: 'high',
        launchDate: new Date('2022-06-01'),
        count: 890
      },
      { 
        id: 'product-3', 
        label: 'NeuroPlex', 
        value: 'neuroplex',
        categoryId: 'neurology',
        therapeuticArea: 'Neurology',
        status: 'pipeline',
        priority: 'medium',
        count: 340
      },
    ],
    multiSelect: true,
    searchable: true,
    categories: [
      { id: 'cardiology', label: 'Cardiology', value: 'cardiology' },
      { id: 'endocrinology', label: 'Endocrinology', value: 'endocrinology' },
      { id: 'neurology', label: 'Neurology', value: 'neurology' },
    ],
    therapeuticAreas: [
      { id: 'cardiovascular', label: 'Cardiovascular', value: 'cardiovascular' },
      { id: 'endocrinology-ta', label: 'Endocrinology', value: 'endocrinology' },
      { id: 'neurology-ta', label: 'Neurology', value: 'neurology' },
    ],
  } as ProductFilterGroup,
  
  {
    id: 'hcp_segments',
    label: 'HCP Segments',
    type: 'hcp_segment',
    options: [
      { 
        id: 'hcp-1', 
        label: 'Primary Care Physicians', 
        value: 'pcp',
        metadata: { specialty: 'Family Medicine', tier: 'tier1', prescriptionVolume: 'high' },
        count: 2500
      },
      { 
        id: 'hcp-2', 
        label: 'Cardiologists', 
        value: 'cardio',
        metadata: { specialty: 'Cardiology', tier: 'tier1', prescriptionVolume: 'medium' },
        count: 450
      },
      { 
        id: 'hcp-3', 
        label: 'Endocrinologists', 
        value: 'endo',
        metadata: { specialty: 'Endocrinology', tier: 'tier2', prescriptionVolume: 'medium' },
        count: 200
      },
    ],
    multiSelect: true,
    searchable: true,
  },
  
  {
    id: 'rep_teams',
    label: 'Rep Teams',
    type: 'rep_team',
    options: [
      { 
        id: 'team-1', 
        label: 'Alpha Team', 
        value: 'alpha',
        metadata: { manager: 'Sarah Johnson', size: 8 },
        count: 8
      },
      { 
        id: 'team-2', 
        label: 'Beta Team', 
        value: 'beta',
        metadata: { manager: 'Mike Chen', size: 12 },
        count: 12
      },
      { 
        id: 'team-3', 
        label: 'Gamma Team', 
        value: 'gamma',
        metadata: { manager: 'Lisa Rodriguez', size: 6 },
        count: 6
      },
    ],
    multiSelect: true,
    searchable: true,
  },
];

// Component that displays current filter state
function FilteredContentExample() {
  const activeFilters = useActiveFilters();
  const filterParams = useFilterQueryParams();
  const timeRange = useCurrentTimeRange();

  return (
    <div className="space-y-6">
      {/* Filter Status Display */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Current Filter State</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters</h4>
            {activeFilters.length > 0 ? (
              <div className="space-y-1">
                {activeFilters.map(filter => (
                  <div key={filter.groupId} className="text-sm text-gray-600">
                    <span className="font-medium capitalize">{filter.type.replace('_', ' ')}:</span>{' '}
                    {filter.optionIds.length} selected
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No filters applied</p>
            )}
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Time Period</h4>
            <p className="text-sm text-gray-600">
              {timeRange.label} ({timeRange.days} days)
            </p>
            <p className="text-xs text-gray-500">
              {timeRange.startDate.toLocaleDateString()} - {timeRange.endDate.toLocaleDateString()}
            </p>
          </div>
        </div>
        
        {Object.keys(filterParams).length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Query Parameters</h4>
            <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-x-auto">
              {JSON.stringify(filterParams, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Sample KPI Cards (would be replaced with actual KPI widgets) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900">Total Prescriptions</h4>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {activeFilters.length > 0 ? '12,450' : '45,230'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {activeFilters.length > 0 ? 'Filtered' : 'All territories'}
          </p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900">Market Share</h4>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {activeFilters.length > 0 ? '28.5%' : '24.2%'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {activeFilters.length > 0 ? 'Filtered view' : 'Overall'}
          </p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900">Active HCPs</h4>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {activeFilters.length > 0 ? '2,340' : '8,750'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {activeFilters.length > 0 ? 'Matching filters' : 'Total database'}
          </p>
        </div>
      </div>
    </div>
  );
}

// Main component with providers
export function FilteredDashboard() {
  return (
    <FilterProvider filterGroups={sampleFilterGroups}>
      <TimePeriodProvider initialPreset="30d">
        <div className="min-h-screen bg-gray-100">
          <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Enhanced Dashboard with Filters
              </h1>
              <p className="text-gray-600">
                Phase 2.3 implementation - Territory and Product filtering capabilities
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filter Panel - Left Sidebar */}
              <div className="lg:col-span-1">
                <div className="space-y-4">
                  {/* Time Period Selector */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Time Period</h3>
                    <TimePeriodSelector
                      selectedPeriod={{
                        id: '30d',
                        label: 'Last 30 Days',
                        value: '30d',
                        days: 30,
                        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        endDate: new Date()
                      }}
                      onPeriodChange={(period) => console.log('Period changed:', period)}
                      showCustomRange={true}
                    />
                  </div>
                  
                  {/* Filter Panel */}
                  <FilterPanel
                    showPresets={true}
                    showExportImport={true}
                    onFiltersChange={(count) => console.log('Active filters:', count)}
                  />
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                <FilteredContentExample />
              </div>
            </div>
          </div>
        </div>
      </TimePeriodProvider>
    </FilterProvider>
  );
}