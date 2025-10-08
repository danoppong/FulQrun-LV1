// src/components/dashboard/filters/MultiSelectFilter.tsx
// Multi-Select Filter Component for general purpose filtering
// Supports HCP segments, therapeutic areas, and custom filter types

'use client';

import React, { useState, useMemo } from 'react';
import { Check, Search, X, ChevronDown, Users, Stethoscope, Tag } from 'lucide-react';
import { FilterGroup, FilterOption, ActiveFilter, FilterType } from '@/lib/types/filters';

interface MultiSelectFilterProps {
  filterGroup: FilterGroup;
  activeFilter?: ActiveFilter;
  onFilterChange: (groupId: string, optionIds: string[]) => void;
  onSearchChange?: (groupId: string, term: string) => void;
  disabled?: boolean;
  compact?: boolean;
  maxVisible?: number;
  showSelectAll?: boolean;
  showClearAll?: boolean;
  sortOptions?: 'alphabetical' | 'count' | 'relevance';
  className?: string;
}

export function MultiSelectFilter({
  filterGroup,
  activeFilter,
  onFilterChange,
  onSearchChange,
  disabled = false,
  compact = false,
  maxVisible = 8,
  showSelectAll = true,
  showClearAll = true,
  sortOptions = 'alphabetical',
  className = ''
}: MultiSelectFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Get appropriate icon for filter type
  const getFilterIcon = (type: FilterType) => {
    switch (type) {
      case 'hcp_segment':
        return <Stethoscope className="h-5 w-5 text-blue-600" />;
      case 'rep_team':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'therapeutic_area':
        return <Tag className="h-5 w-5 text-blue-600" />;
      default:
        return <Tag className="h-5 w-5 text-blue-600" />;
    }
  };

  // Sort and filter options
  const processedOptions = useMemo(() => {
    let options = [...filterGroup.options];

    // Apply search filter
    if (searchTerm) {
      options = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort options
    switch (sortOptions) {
      case 'alphabetical':
        options.sort((a, b) => a.label.localeCompare(b.label));
        break;
      case 'count':
        options.sort((a, b) => (b.count || 0) - (a.count || 0));
        break;
      case 'relevance':
        // Keep original order for relevance
        break;
    }

    return options;
  }, [filterGroup.options, searchTerm, sortOptions]);

  // Get selected option IDs
  const selectedIds = activeFilter?.optionIds || [];

  // Handle option selection
  const handleOptionToggle = (optionId: string) => {
    if (disabled) return;

    const newSelectedIds = selectedIds.includes(optionId)
      ? selectedIds.filter(id => id !== optionId)
      : [...selectedIds, optionId];

    onFilterChange(filterGroup.id, newSelectedIds);
  };

  // Handle search
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    if (onSearchChange) {
      onSearchChange(filterGroup.id, term);
    }
  };

  // Clear all selections
  const handleClearAll = () => {
    onFilterChange(filterGroup.id, []);
  };

  // Select all visible options
  const handleSelectAll = () => {
    const visibleOptions = showAll ? processedOptions : processedOptions.slice(0, maxVisible);
    const allVisibleIds = visibleOptions.map(option => option.id);
    const newSelectedIds = [...new Set([...selectedIds, ...allVisibleIds])];
    onFilterChange(filterGroup.id, newSelectedIds);
  };

  // Get display text for selected items
  const getSelectedText = () => {
    if (selectedIds.length === 0) return 'None selected';
    if (selectedIds.length === 1) {
      const option = filterGroup.options.find(opt => opt.id === selectedIds[0]);
      return option?.label || 'Unknown';
    }
    return `${selectedIds.length} selected`;
  };

  // Get option display info based on type
  const getOptionDisplayInfo = (option: FilterOption) => {
    const baseInfo = {
      icon: <Check className="h-4 w-4" />,
      description: '',
      badge: option.count ? `${option.count}` : undefined
    };

    // Add type-specific information
    switch (filterGroup.type) {
      case 'hcp_segment':
        return {
          ...baseInfo,
          icon: <Stethoscope className="h-4 w-4" />,
          description: option.metadata?.specialty as string || '',
          badge: option.metadata?.tier ? `Tier ${option.metadata.tier}` : baseInfo.badge
        };
      case 'rep_team':
        return {
          ...baseInfo,
          icon: <Users className="h-4 w-4" />,
          description: option.metadata?.manager as string || '',
          badge: option.metadata?.size ? `${option.metadata.size} reps` : baseInfo.badge
        };
      case 'therapeutic_area':
        return {
          ...baseInfo,
          icon: <Tag className="h-4 w-4" />,
          description: option.metadata?.category as string || '',
        };
      default:
        return baseInfo;
    }
  };

  const visibleOptions = showAll ? processedOptions : processedOptions.slice(0, maxVisible);
  const hasMore = processedOptions.length > maxVisible;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getFilterIcon(filterGroup.type)}
          <h3 className="font-medium text-gray-900">{filterGroup.label}</h3>
          {selectedIds.length > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {selectedIds.length}
            </span>
          )}
        </div>
        
        {selectedIds.length > 0 && showClearAll && (
          <button
            onClick={handleClearAll}
            disabled={disabled}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Compact Mode - Dropdown */}
      {compact ? (
        <div className="relative">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={disabled}
            className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm text-gray-700">{getSelectedText()}</span>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          {isExpanded && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filterGroup.searchable && (
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`Search ${filterGroup.label.toLowerCase()}...`}
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="py-2">
                {visibleOptions.map(option => {
                  const isSelected = selectedIds.includes(option.id);
                  const displayInfo = getOptionDisplayInfo(option);

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionToggle(option.id)}
                      disabled={disabled || option.disabled}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <div className={`h-4 w-4 border border-gray-300 rounded flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 border-blue-600' : ''
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{option.label}</div>
                        {displayInfo.description && (
                          <div className="text-xs text-gray-500 truncate">{displayInfo.description}</div>
                        )}
                      </div>
                      {displayInfo.badge && (
                        <span className="text-xs text-gray-500">{displayInfo.badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Full Mode */
        <>
          {/* Search */}
          {filterGroup.searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${filterGroup.label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                disabled={disabled}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
          )}

          {/* Actions */}
          {processedOptions.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-3">
                {showSelectAll && (
                  <button
                    onClick={handleSelectAll}
                    disabled={disabled}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Select All{!showAll && hasMore ? ' Visible' : ''}
                  </button>
                )}
                {showClearAll && (
                  <button
                    onClick={handleClearAll}
                    disabled={disabled || selectedIds.length === 0}
                    className="text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <span className="text-gray-500">
                {processedOptions.length} {filterGroup.label.toLowerCase()}
              </span>
            </div>
          )}

          {/* Options List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {visibleOptions.map(option => {
              const isSelected = selectedIds.includes(option.id);
              const displayInfo = getOptionDisplayInfo(option);

              return (
                <div
                  key={option.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !option.disabled && handleOptionToggle(option.id)}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleOptionToggle(option.id)}
                    disabled={disabled || option.disabled}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />

                  {/* Option Icon */}
                  <div className={`${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                    {displayInfo.icon}
                  </div>

                  {/* Option Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {option.label}
                      </span>
                      {displayInfo.badge && (
                        <span className="text-xs text-gray-500 ml-2">{displayInfo.badge}</span>
                      )}
                    </div>
                    {displayInfo.description && (
                      <div className="text-sm text-gray-500 truncate mt-1">{displayInfo.description}</div>
                    )}
                  </div>
                </div>
              );
            })}

            {hasMore && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full p-3 text-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Show {processedOptions.length - maxVisible} more {filterGroup.label.toLowerCase()}
              </button>
            )}

            {processedOptions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {getFilterIcon(filterGroup.type)}
                <p className="mt-2">
                  {searchTerm 
                    ? `No ${filterGroup.label.toLowerCase()} found matching &ldquo;${searchTerm}&rdquo;`
                    : `No ${filterGroup.label.toLowerCase()} available`
                  }
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}