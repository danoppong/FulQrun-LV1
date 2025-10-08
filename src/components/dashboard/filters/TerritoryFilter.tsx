// src/components/dashboard/filters/TerritoryFilter.tsx
// Territory Filter Component for pharmaceutical sales territory selection
// Supports hierarchical territory structure with regions and individual territories

'use client';

import React, { useState, useMemo } from 'react';
import { MapPin, ChevronDown, ChevronRight, Search, Users, X } from 'lucide-react';
import { TerritoryFilterGroup, TerritoryFilter as TerritoryFilterType, ActiveFilter } from '@/lib/types/filters';

interface TerritoryFilterProps {
  filterGroup: TerritoryFilterGroup;
  activeFilter?: ActiveFilter;
  onFilterChange: (groupId: string, optionIds: string[]) => void;
  onSearchChange?: (groupId: string, term: string) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

interface TerritoryNode {
  territory: TerritoryFilterType;
  children: TerritoryNode[];
  level: number;
  expanded: boolean;
}

export function TerritoryFilter({
  filterGroup,
  activeFilter,
  onFilterChange,
  onSearchChange,
  disabled = false,
  compact = false,
  className = ''
}: TerritoryFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  // Build hierarchical territory structure
  const territoryTree = useMemo(() => {
    const regions = filterGroup.regions || [];
    const territories = filterGroup.options;
    
    const tree: TerritoryNode[] = [];
    
    // Group territories by region
    const territoryByRegion = territories.reduce((acc, territory) => {
      const regionId = territory.regionId || 'unassigned';
      if (!acc[regionId]) acc[regionId] = [];
      acc[regionId].push(territory);
      return acc;
    }, {} as Record<string, TerritoryFilterType[]>);

    // Build tree structure
    regions.forEach(region => {
      const regionTerritories = territoryByRegion[region.id] || [];
      const regionNode: TerritoryNode = {
        territory: {
          ...region,
          regionId: region.id,
          repCount: regionTerritories.reduce((sum, t) => sum + (t.repCount || 0), 0)
        } as TerritoryFilterType,
        children: regionTerritories.map(territory => ({
          territory,
          children: [],
          level: 1,
          expanded: false
        })),
        level: 0,
        expanded: expandedNodes.has(region.id)
      };
      tree.push(regionNode);
    });

    // Add unassigned territories
    const unassignedTerritories = territoryByRegion.unassigned || [];
    if (unassignedTerritories.length > 0) {
      unassignedTerritories.forEach(territory => {
        tree.push({
          territory,
          children: [],
          level: 0,
          expanded: false
        });
      });
    }

    return tree;
  }, [filterGroup.regions, filterGroup.options, expandedNodes]);

  // Filter territories based on search term
  const filteredTree = useMemo(() => {
    if (!searchTerm) return territoryTree;

    const filterNode = (node: TerritoryNode): TerritoryNode | null => {
      const matchesSearch = node.territory.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           node.territory.value.toLowerCase().includes(searchTerm.toLowerCase());

      const filteredChildren = node.children
        .map(child => filterNode(child))
        .filter(Boolean) as TerritoryNode[];

      if (matchesSearch || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
          expanded: true // Auto-expand when searching
        };
      }

      return null;
    };

    return territoryTree
      .map(node => filterNode(node))
      .filter(Boolean) as TerritoryNode[];
  }, [territoryTree, searchTerm]);

  // Get selected territory IDs
  const selectedIds = activeFilter?.optionIds || [];

  // Handle territory selection
  const handleTerritoryToggle = (territoryId: string, isRegion: boolean = false) => {
    if (disabled) return;

    let newSelectedIds: string[];

    if (isRegion) {
      // Toggle all territories in region
      const regionNode = territoryTree.find(node => node.territory.id === territoryId);
      if (!regionNode) return;

      const regionTerritoryIds = regionNode.children.map(child => child.territory.id);
      const allSelected = regionTerritoryIds.every(id => selectedIds.includes(id));

      if (allSelected) {
        // Deselect all in region
        newSelectedIds = selectedIds.filter(id => !regionTerritoryIds.includes(id));
      } else {
        // Select all in region
        const newIds = regionTerritoryIds.filter(id => !selectedIds.includes(id));
        newSelectedIds = [...selectedIds, ...newIds];
      }
    } else {
      // Toggle individual territory
      if (selectedIds.includes(territoryId)) {
        newSelectedIds = selectedIds.filter(id => id !== territoryId);
      } else {
        newSelectedIds = [...selectedIds, territoryId];
      }
    }

    onFilterChange(filterGroup.id, newSelectedIds);
  };

  // Handle node expansion
  const handleNodeToggle = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
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

  // Select all visible territories
  const handleSelectAll = () => {
    const allVisibleIds = filteredTree.flatMap(node => 
      [node.territory.id, ...node.children.map(child => child.territory.id)]
    );
    onFilterChange(filterGroup.id, allVisibleIds);
  };

  // Render territory node
  const renderTerritoryNode = (node: TerritoryNode) => {
    const isSelected = selectedIds.includes(node.territory.id);
    const hasChildren = node.children.length > 0;
    const isExpanded = node.expanded || searchTerm.length > 0;
    
    // Check if all children are selected (for regions)
    const allChildrenSelected = hasChildren && 
      node.children.every(child => selectedIds.includes(child.territory.id));
    const someChildrenSelected = hasChildren && 
      node.children.some(child => selectedIds.includes(child.territory.id));

    return (
      <div key={node.territory.id} className="space-y-1">
        <div 
          className={`flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
            node.level === 0 ? 'font-medium' : ''
          } ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
          style={{ paddingLeft: `${(node.level + 1) * 12}px` }}
        >
          {/* Expansion arrow for regions */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNodeToggle(node.territory.id);
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}

          {/* Selection checkbox */}
          <div className="relative">
            <input
              type="checkbox"
              checked={isSelected || allChildrenSelected}
              ref={(el) => {
                if (el) el.indeterminate = someChildrenSelected && !allChildrenSelected;
              }}
              onChange={() => handleTerritoryToggle(node.territory.id, hasChildren)}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>

          {/* Territory icon */}
          <MapPin className={`h-4 w-4 ${node.level === 0 ? 'text-blue-600' : 'text-gray-500'}`} />

          {/* Territory label and info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={`truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                {node.territory.label}
              </span>
              {!compact && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {node.territory.repCount && (
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{node.territory.repCount}</span>
                    </div>
                  )}
                  {node.territory.coverage && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      node.territory.coverage === 'urban' ? 'bg-blue-100 text-blue-800' :
                      node.territory.coverage === 'rural' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {node.territory.coverage}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Children territories */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children.map(child => renderTerritoryNode(child))}
          </div>
        )}
      </div>
    );
  };

  const visibleTerritories = showAll ? filteredTree : filteredTree.slice(0, 10);
  const hasMore = filteredTree.length > 10;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">{filterGroup.label}</h3>
          {selectedIds.length > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {selectedIds.length} selected
            </span>
          )}
        </div>
        
        {selectedIds.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={disabled}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search */}
      {filterGroup.searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search territories..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            disabled={disabled}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>
      )}

      {/* Actions */}
      {!compact && filteredTree.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSelectAll}
              disabled={disabled}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={handleClearAll}
              disabled={disabled || selectedIds.length === 0}
              className="text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              Clear All
            </button>
          </div>
          <span className="text-gray-500">
            {filteredTree.length} territories
          </span>
        </div>
      )}

      {/* Territory List */}
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {visibleTerritories.map(node => renderTerritoryNode(node))}
        
        {hasMore && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full p-2 text-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Show {filteredTree.length - 10} more territories
          </button>
        )}
        
        {filteredTree.length === 0 && searchTerm && (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No territories found matching &ldquo;{searchTerm}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  );
}