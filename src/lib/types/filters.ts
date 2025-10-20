// src/lib/types/filters.ts
// Type definitions for dashboard filtering system
// Supports territory, product, HCP, and custom filter types

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
  metadata?: Record<string, string | number | boolean>;
  disabled?: boolean;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: FilterType;
  options: FilterOption[];
  multiSelect: boolean;
  searchable: boolean;
  collapsed?: boolean;
}

export type FilterType = 
  | 'territory' 
  | 'product' 
  | 'hcp_segment' 
  | 'therapeutic_area'
  | 'rep_team'
  | 'custom';

export interface ActiveFilter {
  groupId: string;
  optionIds: string[];
  type: FilterType;
  operator: 'AND' | 'OR';
}

export interface FilterState {
  activeFilters: ActiveFilter[];
  searchTerms: Record<string, string>;
  isLoading: boolean;
  lastUpdated: Date | null;
}

export interface FilterContextValue {
  state: FilterState;
  actions: FilterActions;
  filterGroups: FilterGroup[];
}

export interface FilterActions {
  // Filter management
  addFilter: (groupId: string, optionId: string) => void;
  removeFilter: (groupId: string, optionId: string) => void;
  clearFilter: (groupId: string) => void;
  clearAllFilters: () => void;
  
  // Multi-select operations
  setFilterOptions: (groupId: string, optionIds: string[]) => void;
  toggleFilterOption: (groupId: string, optionId: string) => void;
  
  // Search functionality
  setSearchTerm: (groupId: string, term: string) => void;
  clearSearchTerm: (groupId: string) => void;
  
  // Filter group operations
  setFilterOperator: (groupId: string, operator: 'AND' | 'OR') => void;
  collapseFilterGroup: (groupId: string, collapsed: boolean) => void;
  
  // Bulk operations
  applyFilterPreset: (preset: FilterPreset) => void;
  exportFilters: () => FilterExport;
  importFilters: (filters: FilterExport) => void;
}

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: ActiveFilter[];
  createdAt: Date;
  userId?: string;
  organizationId: string;
}

export interface FilterExport {
  version: string;
  timestamp: Date;
  filters: ActiveFilter[];
  metadata?: Record<string, string | number | boolean>;
}

// Territory-specific filter types
export interface TerritoryFilter extends FilterOption {
  regionId?: string;
  managerId?: string;
  repCount?: number;
  coverage?: 'urban' | 'rural' | 'mixed';
}

export interface TerritoryFilterGroup extends FilterGroup {
  type: 'territory';
  options: TerritoryFilter[];
  hierarchical: boolean;
  regions?: FilterOption[];
}

// Product-specific filter types
export interface ProductFilter extends FilterOption {
  categoryId?: string;
  therapeuticArea?: string;
  launchDate?: Date;
  status?: 'active' | 'discontinued' | 'pipeline';
  priority?: 'high' | 'medium' | 'low';
}

export interface ProductFilterGroup extends FilterGroup {
  type: 'product';
  options: ProductFilter[];
  categories?: FilterOption[];
  therapeuticAreas?: FilterOption[];
}

// HCP Segment filter types
export interface HCPSegmentFilter extends FilterOption {
  specialty?: string;
  tier?: 'tier1' | 'tier2' | 'tier3';
  prescriptionVolume?: 'high' | 'medium' | 'low';
  influence?: number;
}

export interface HCPSegmentFilterGroup extends FilterGroup {
  type: 'hcp_segment';
  options: HCPSegmentFilter[];
  specialties?: FilterOption[];
  tiers?: FilterOption[];
}

// Filter validation and utility types
export interface FilterValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FilterQueryParams {
  territories?: string[];
  products?: string[];
  hcpSegments?: string[];
  therapeuticAreas?: string[];
  repTeams?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

// Filter performance and analytics
export interface FilterAnalytics {
  mostUsedFilters: Array<{
    groupId: string;
    optionId: string;
    usageCount: number;
  }>;
  averageFiltersPerSession: number;
  filterApplicationTime: number;
  popularCombinations: Array<{
    filters: ActiveFilter[];
    usageCount: number;
  }>;
}

// Filter UI component props
export interface FilterComponentProps {
  filterGroup: FilterGroup;
  activeFilter?: ActiveFilter;
  onFilterChange: (groupId: string, optionIds: string[]) => void;
  onSearchChange?: (groupId: string, term: string) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

// Multi-select filter component props
export interface MultiSelectFilterProps extends FilterComponentProps {
  maxVisible?: number;
  showSelectAll?: boolean;
  showClearAll?: boolean;
  sortOptions?: 'alphabetical' | 'count' | 'relevance';
}

// Hierarchical filter component props (for territories)
export interface HierarchicalFilterProps extends FilterComponentProps {
  showHierarchy: boolean;
  expandAll?: boolean;
  maxDepth?: number;
  indentSize?: number;
}