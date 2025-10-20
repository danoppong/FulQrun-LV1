// src/components/dashboard/filters/ProductFilter.tsx
// Product Filter Component for pharmaceutical product selection
// Supports product categories, therapeutic areas, and priority filtering

'use client';

import React, { useState, useMemo } from 'react';
import { Package, Search, X, Filter, Star, Calendar, AlertCircle } from 'lucide-react';
import { ProductFilterGroup, ProductFilter as ProductFilterType, ActiveFilter } from '@/lib/types/filters';

interface ProductFilterProps {
  filterGroup: ProductFilterGroup;
  activeFilter?: ActiveFilter;
  onFilterChange: (groupId: string, optionIds: string[]) => void;
  onSearchChange?: (groupId: string, term: string) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

interface ProductCategory {
  id: string;
  label: string;
  products: ProductFilterType[];
  expanded: boolean;
}

export function ProductFilter({
  filterGroup,
  activeFilter,
  onFilterChange,
  onSearchChange,
  disabled = false,
  compact = false,
  className = ''
}: ProductFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTherapeuticArea, setSelectedTherapeuticArea] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Group products by category
  const productsByCategory = useMemo(() => {
    const categories = filterGroup.categories || [];
    const products = filterGroup.options;
    
    const categoryMap: Record<string, ProductCategory> = {};
    
    // Initialize categories
    categories.forEach(category => {
      categoryMap[category.id] = {
        id: category.id,
        label: category.label,
        products: [],
        expanded: true
      };
    });

    // Add "All Products" category
    categoryMap.all = {
      id: 'all',
      label: 'All Products',
      products: [],
      expanded: true
    };

    // Categorize products
    products.forEach(product => {
      const categoryId = product.categoryId || 'uncategorized';
      if (!categoryMap[categoryId]) {
        categoryMap[categoryId] = {
          id: categoryId,
          label: 'Uncategorized',
          products: [],
          expanded: true
        };
      }
      categoryMap[categoryId].products.push(product);
      categoryMap.all.products.push(product);
    });

    return Object.values(categoryMap).filter(category => category.products.length > 0);
  }, [filterGroup.categories, filterGroup.options]);

  // Filter products based on current filters
  const filteredProducts = useMemo(() => {
    let products = selectedCategory === 'all' 
      ? filterGroup.options 
      : productsByCategory.find(cat => cat.id === selectedCategory)?.products || [];

    // Apply search filter
    if (searchTerm) {
      products = products.filter(product => 
        product.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.therapeuticArea?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply therapeutic area filter
    if (selectedTherapeuticArea !== 'all') {
      products = products.filter(product => product.therapeuticArea === selectedTherapeuticArea);
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      products = products.filter(product => product.status === selectedStatus);
    }

    // Apply priority filter
    if (selectedPriority !== 'all') {
      products = products.filter(product => product.priority === selectedPriority);
    }

    return products;
  }, [filterGroup.options, productsByCategory, selectedCategory, searchTerm, selectedTherapeuticArea, selectedStatus, selectedPriority]);

  // Get unique therapeutic areas
  const therapeuticAreas = useMemo(() => {
    const areas = new Set<string>();
    filterGroup.options.forEach(product => {
      if (product.therapeuticArea) {
        areas.add(product.therapeuticArea);
      }
    });
    return Array.from(areas).sort();
  }, [filterGroup.options]);

  // Get selected product IDs
  const selectedIds = activeFilter?.optionIds || [];

  // Handle product selection
  const handleProductToggle = (productId: string) => {
    if (disabled) return;

    const newSelectedIds = selectedIds.includes(productId)
      ? selectedIds.filter(id => id !== productId)
      : [...selectedIds, productId];

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

  // Select all visible products
  const handleSelectAll = () => {
    const allVisibleIds = filteredProducts.map(product => product.id);
    const newSelectedIds = [...new Set([...selectedIds, ...allVisibleIds])];
    onFilterChange(filterGroup.id, newSelectedIds);
  };

  // Select products by category
  const handleSelectCategory = (categoryId: string) => {
    const category = productsByCategory.find(cat => cat.id === categoryId);
    if (!category) return;

    const categoryProductIds = category.products.map(product => product.id);
    const newSelectedIds = [...new Set([...selectedIds, ...categoryProductIds])];
    onFilterChange(filterGroup.id, newSelectedIds);
  };

  // Get product status icon and color
  const getProductStatusDisplay = (product: ProductFilterType) => {
    switch (product.status) {
      case 'active':
        return { icon: <Star className="h-3 w-3" />, color: 'text-green-600', bg: 'bg-green-100' };
      case 'pipeline':
        return { icon: <Calendar className="h-3 w-3" />, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'discontinued':
        return { icon: <AlertCircle className="h-3 w-3" />, color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { icon: <Package className="h-3 w-3" />, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  // Get priority display
  const getPriorityDisplay = (priority?: string) => {
    switch (priority) {
      case 'high':
        return { color: 'text-red-600', bg: 'bg-red-100', label: 'High' };
      case 'medium':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Medium' };
      case 'low':
        return { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Low' };
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">{filterGroup.label}</h3>
          {selectedIds.length > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {selectedIds.length} selected
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Filter className="h-4 w-4" />
          </button>
          
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
      </div>

      {/* Search */}
      {filterGroup.searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            disabled={disabled}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={disabled}
              className="w-full text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {productsByCategory.filter(cat => cat.id !== 'all').map(category => (
                <option key={category.id} value={category.id}>
                  {category.label} ({category.products.length})
                </option>
              ))}
            </select>
          </div>

          {/* Therapeutic Area Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Therapeutic Area</label>
            <select
              value={selectedTherapeuticArea}
              onChange={(e) => setSelectedTherapeuticArea(e.target.value)}
              disabled={disabled}
              className="w-full text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Areas</option>
              {therapeuticAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={disabled}
              className="w-full text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pipeline">Pipeline</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              disabled={disabled}
              className="w-full text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>
      )}

      {/* Actions */}
      {!compact && filteredProducts.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSelectAll}
              disabled={disabled}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Select All Visible
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
            {filteredProducts.length} products
          </span>
        </div>
      )}

      {/* Product List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredProducts.map(product => {
          const isSelected = selectedIds.includes(product.id);
          const statusDisplay = getProductStatusDisplay(product);
          const priorityDisplay = getPriorityDisplay(product.priority);

          return (
            <div
              key={product.id}
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleProductToggle(product.id)}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleProductToggle(product.id)}
                disabled={disabled}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Product Icon and Status */}
              <div className={`p-2 rounded-lg ${statusDisplay.bg}`}>
                <div className={statusDisplay.color}>
                  {statusDisplay.icon}
                </div>
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {product.label}
                  </h4>
                  {priorityDisplay && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityDisplay.bg} ${priorityDisplay.color}`}>
                      {priorityDisplay.label}
                    </span>
                  )}
                </div>
                
                {!compact && (
                  <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                    {product.therapeuticArea && (
                      <span>{product.therapeuticArea}</span>
                    )}
                    {product.launchDate && (
                      <span>Launched {new Date(product.launchDate).getFullYear()}</span>
                    )}
                    {product.status && (
                      <span className="capitalize">{product.status}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Product Count/Metadata */}
              {product.count !== undefined && (
                <div className="text-sm text-gray-500">
                  {product.count} records
                </div>
              )}
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>
              {searchTerm 
                ? `No products found matching &ldquo;${searchTerm}&rdquo;`
                : 'No products available'
              }
            </p>
          </div>
        )}
      </div>

      {/* Category Quick Select */}
      {!compact && productsByCategory.length > 2 && (
        <div className="border-t pt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Quick Select by Category</div>
          <div className="flex flex-wrap gap-2">
            {productsByCategory
              .filter(category => category.id !== 'all')
              .map(category => (
                <button
                  key={category.id}
                  onClick={() => handleSelectCategory(category.id)}
                  disabled={disabled}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                >
                  {category.label} ({category.products.length})
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}