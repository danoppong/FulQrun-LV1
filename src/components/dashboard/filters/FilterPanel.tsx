// src/components/dashboard/filters/FilterPanel.tsx
// Unified Filter Panel Component that orchestrates all filter types
// Provides a comprehensive filtering interface for the dashboard

'use client';

import React, { useState } from 'react';
import { Filter, X, RotateCcw, Download, Upload, Bookmark, ChevronDown, ChevronUp } from 'lucide-react';
import { useFilterContext, useFilterStats } from '@/contexts/FilterContext';
import { TerritoryFilter } from './TerritoryFilter';
import { ProductFilter } from './ProductFilter';
import { MultiSelectFilter } from './MultiSelectFilter';
import { 
  TerritoryFilterGroup, 
  ProductFilterGroup, 
  FilterGroup,
  FilterPreset 
} from '@/lib/types/filters';

interface FilterPanelProps {
  className?: string;
  compact?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  showPresets?: boolean;
  showExportImport?: boolean;
  onFiltersChange?: (activeFilters: number) => void;
}

export function FilterPanel({
  className = '',
  compact = false,
  collapsible = true,
  defaultCollapsed = false,
  showPresets = true,
  showExportImport = false,
  onFiltersChange
}: FilterPanelProps) {
  const { state, actions, filterGroups } = useFilterContext();
  const filterStats = useFilterStats();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Sample filter presets (would come from API in real implementation)
  const [filterPresets] = useState<FilterPreset[]>([
    {
      id: 'high-priority-products',
      name: 'High Priority Products',
      description: 'Focus on tier 1 products in major territories',
      filters: [],
      createdAt: new Date(),
      organizationId: 'org-1',
    },
    {
      id: 'urban-territories',
      name: 'Urban Territories',
      description: 'Metropolitan areas with high HCP density',
      filters: [],
      createdAt: new Date(),
      organizationId: 'org-1',
    },
  ]);

  // Notify parent of filter changes
  React.useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filterStats.totalFilters);
    }
  }, [filterStats.totalFilters, onFiltersChange]);

  // Handle filter change for any filter group
  const handleFilterChange = (groupId: string, optionIds: string[]) => {
    actions.setFilterOptions(groupId, optionIds);
  };

  // Handle search change for any filter group
  const handleSearchChange = (groupId: string, term: string) => {
    if (term) {
      actions.setSearchTerm(groupId, term);
    } else {
      actions.clearSearchTerm(groupId);
    }
  };

  // Save current filters as a preset
  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name: presetName,
      filters: state.activeFilters,
      createdAt: new Date(),
      organizationId: 'org-1', // Would come from auth context
    };

    // In real implementation, would save to API
    console.log('Saving preset:', newPreset);
    
    setPresetName('');
    setShowPresetModal(false);
  };

  // Export filters to JSON
  const handleExportFilters = () => {
    const exportData = actions.exportFilters();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-filters-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import filters from JSON
  const handleImportFilters = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        actions.importFilters(importData);
      } catch (error) {
        console.error('Failed to import filters:', error);
        // In real implementation, would show user-friendly error
      }
    };
    reader.readAsText(file);
  };

  // Render individual filter component based on type
  const renderFilterComponent = (filterGroup: FilterGroup) => {
    const activeFilter = state.activeFilters.find(f => f.groupId === filterGroup.id);

    switch (filterGroup.type) {
      case 'territory':
        return (
          <TerritoryFilter
            key={filterGroup.id}
            filterGroup={filterGroup as TerritoryFilterGroup}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            compact={compact}
          />
        );

      case 'product':
        return (
          <ProductFilter
            key={filterGroup.id}
            filterGroup={filterGroup as ProductFilterGroup}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            compact={compact}
          />
        );

      case 'hcp_segment':
      case 'therapeutic_area':
      case 'rep_team':
      case 'custom':
        return (
          <MultiSelectFilter
            key={filterGroup.id}
            filterGroup={filterGroup}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            compact={compact}
            maxVisible={compact ? 5 : 8}
            showSelectAll={!compact}
            showClearAll={!compact}
          />
        );

      default:
        return null;
    }
  };

  if (collapsible && isCollapsed) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-900">Filters</span>
            {filterStats.totalFilters > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {filterStats.totalFilters} active
              </span>
            )}
          </div>
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Filters</h2>
          {filterStats.totalFilters > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {filterStats.totalFilters} active
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Clear All Filters */}
          {filterStats.totalFilters > 0 && (
            <button
              onClick={actions.clearAllFilters}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear all filters"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}

          {/* Export/Import */}
          {showExportImport && filterStats.totalFilters > 0 && (
            <>
              <button
                onClick={handleExportFilters}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Export filters"
              >
                <Download className="h-4 w-4" />
              </button>
              <label className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer" title="Import filters">
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFilters}
                  className="hidden"
                />
              </label>
            </>
          )}

          {/* Save Preset */}
          {showPresets && filterStats.totalFilters > 0 && (
            <button
              onClick={() => setShowPresetModal(true)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Save as preset"
            >
              <Bookmark className="h-4 w-4" />
            </button>
          )}

          {/* Collapse */}
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Presets */}
      {showPresets && filterPresets.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">Quick Filters</div>
          <div className="flex flex-wrap gap-2">
            {filterPresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => actions.applyFilterPreset(preset)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                title={preset.description}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Groups */}
      <div className="p-4 space-y-6">
        {filterGroups.map(filterGroup => renderFilterComponent(filterGroup))}
        
        {filterGroups.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No filters available</p>
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {filterStats.totalFilters > 0 && !compact && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm font-medium text-gray-700 mb-2">Active Filters Summary</div>
          <div className="space-y-1">
            {Object.entries(filterStats.filtersByType).map(([type, count]) => (
              <div key={type} className="flex justify-between text-sm text-gray-600">
                <span className="capitalize">{type.replace('_', ' ')}</span>
                <span>{count} filter{count > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
          {filterStats.lastUpdated && (
            <div className="text-xs text-gray-500 mt-2">
              Last updated: {filterStats.lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {/* Save Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowPresetModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Save Filter Preset</h3>
                <button
                  onClick={() => setShowPresetModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="preset-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Preset Name
                  </label>
                  <input
                    id="preset-name"
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Enter preset name..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="text-sm text-gray-600">
                  This will save your current filter selection ({filterStats.totalFilters} filters) as a reusable preset.
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowPresetModal(false)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePreset}
                    disabled={!presetName.trim()}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Save Preset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}