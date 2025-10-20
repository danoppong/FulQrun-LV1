// src/components/dashboard/comparison/ComparisonBuilder.tsx
// Comparison Builder Component for setting up comparative analytics
// Provides interface for configuring comparison parameters and datasets

'use client';

import React, { useState, useCallback } from 'react';
import { 
  Plus, 
  X, 
  Play, 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Filter,
  Users,
  MapPin,
  Package,
  Target
} from 'lucide-react';
import { 
  ComparisonConfiguration, 
  ComparisonTimeframe,
  ComparisonType
} from '@/lib/types/comparison';

interface ComparisonBuilderProps {
  onRunComparison: (config: ComparisonConfiguration) => void;
  onCancel?: () => void;
  className?: string;
}

interface DatasetBuilder {
  id: string;
  label: string;
  filters: Record<string, string[]>;
  isComplete: boolean;
}

const COMPARISON_TYPES: Array<{
  type: ComparisonType;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    type: 'side_by_side',
    label: 'Side-by-Side',
    description: 'Compare metrics across different datasets simultaneously',
    icon: <BarChart3 className="h-5 w-5" />
  },
  {
    type: 'time_series',
    label: 'Trend Analysis',
    description: 'Analyze performance trends over time periods',
    icon: <TrendingUp className="h-5 w-5" />
  }
];

const METRIC_TYPES: Array<{
  type: string;
  label: string;
  description: string;
  category: string;
}> = [
  { type: 'trx', label: 'Total Prescriptions (TRx)', description: 'Total prescription volume', category: 'Prescription' },
  { type: 'nrx', label: 'New Prescriptions (NRx)', description: 'New prescription starts', category: 'Prescription' },
  { type: 'market_share', label: 'Market Share', description: 'Share of total market', category: 'Market' },
  { type: 'hcp_engagement', label: 'HCP Engagement', description: 'Healthcare provider interactions', category: 'Engagement' },
  { type: 'call_frequency', label: 'Call Frequency', description: 'Sales call frequency', category: 'Sales Activity' },
  { type: 'sample_distribution', label: 'Sample Distribution', description: 'Product sample distribution', category: 'Sales Activity' },
  { type: 'revenue', label: 'Revenue', description: 'Total revenue generated', category: 'Financial' },
  { type: 'conversion_rate', label: 'Conversion Rate', description: 'Lead to prescription conversion', category: 'Performance' }
];

export function ComparisonBuilder({
  onRunComparison,
  onCancel,
  className = ''
}: ComparisonBuilderProps) {
  const [comparisonType, setComparisonType] = useState<ComparisonType>('side_by_side');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['trx', 'nrx']);
  const [datasets, setDatasets] = useState<DatasetBuilder[]>([
    {
      id: 'dataset-1',
      label: 'Primary Dataset',
      filters: {},
      isComplete: false
    }
  ]);
  const [timeframe, setTimeframe] = useState<ComparisonTimeframe>({
    primary: {
      label: 'Last 3 Months',
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      endDate: new Date()
    },
    granularity: 'monthly'
  });

  // Add new dataset
  const addDataset = useCallback(() => {
    const newDataset: DatasetBuilder = {
      id: `dataset-${datasets.length + 1}`,
      label: `Dataset ${datasets.length + 1}`,
      filters: {},
      isComplete: false
    };
    setDatasets(prev => [...prev, newDataset]);
  }, [datasets.length]);

  // Remove dataset
  const removeDataset = useCallback((datasetId: string) => {
    setDatasets(prev => prev.filter(d => d.id !== datasetId));
  }, []);

  // Update dataset
  const updateDataset = useCallback((datasetId: string, updates: Partial<DatasetBuilder>) => {
    setDatasets(prev => prev.map(dataset => 
      dataset.id === datasetId 
        ? { ...dataset, ...updates }
        : dataset
    ));
  }, []);

  // Update dataset filters
  const updateDatasetFilter = useCallback((datasetId: string, filterKey: string, value: string[]) => {
    setDatasets(prev => prev.map(dataset => 
      dataset.id === datasetId 
        ? { 
            ...dataset, 
            filters: { ...dataset.filters, [filterKey]: value },
            isComplete: validateDatasetFilters({ ...dataset.filters, [filterKey]: value })
          }
        : dataset
    ));
  }, []);

  // Validate dataset filters
  const validateDatasetFilters = (filters: Record<string, string[]>): boolean => {
    // At least one filter must be specified
    return Object.values(filters).some(filter => 
      Array.isArray(filter) && filter.length > 0
    );
  };

  // Toggle metric selection
  const toggleMetric = useCallback((metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  }, []);

  // Run comparison
  const handleRunComparison = useCallback(() => {
    const config: ComparisonConfiguration = {
      id: `comparison-${Date.now()}`,
      name: `${comparisonType} Comparison`,
      description: `Comparing ${selectedMetrics.join(', ')} across ${datasets.length} datasets`,
      type: comparisonType,
      datasets: datasets.map(dataset => ({
        id: dataset.id,
        label: dataset.label,
        filters: dataset.filters,
        color: getDatasetColor(dataset.id),
        timeRange: {
          startDate: timeframe.primary.startDate,
          endDate: timeframe.primary.endDate
        }
      })),
      metrics: selectedMetrics,
      timeframe,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onRunComparison(config);
  }, [comparisonType, datasets, selectedMetrics, timeframe, onRunComparison]);

  // Get dataset color
  const getDatasetColor = (datasetId: string): string => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    const index = parseInt(datasetId.split('-')[1]) - 1;
    return colors[index % colors.length];
  };

  // Check if configuration is valid
  const isConfigValid = datasets.length >= 1 && 
                       datasets.every(d => d.isComplete) && 
                       selectedMetrics.length > 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Comparison Builder</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure your comparative analysis parameters
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Cancel comparison"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Comparison Type Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900">Comparison Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMPARISON_TYPES.map(type => (
            <button
              key={type.type}
              onClick={() => setComparisonType(type.type)}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                comparisonType === type.type
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  comparisonType === type.type ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {type.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{type.label}</h4>
                  <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Metric Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900">Metrics to Compare</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {METRIC_TYPES.map(metric => (
            <button
              key={metric.type}
              onClick={() => toggleMetric(metric.type)}
              className={`p-3 border rounded-lg text-left transition-colors ${
                selectedMetrics.includes(metric.type)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{metric.label}</h4>
                  <p className="text-xs text-gray-600">{metric.category}</p>
                </div>
                {selectedMetrics.includes(metric.type) && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {selectedMetrics.length} metric{selectedMetrics.length !== 1 ? 's' : ''} selected
        </p>
      </div>

      {/* Time Period */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900">Time Period</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Last 30 Days', days: 30 },
            { label: 'Last 3 Months', days: 90 },
            { label: 'Last 6 Months', days: 180 },
            { label: 'Last Year', days: 365 }
          ].map(period => (
            <button
              key={period.label}
              onClick={() => setTimeframe({
                primary: {
                  label: period.label,
                  startDate: new Date(Date.now() - period.days * 24 * 60 * 60 * 1000),
                  endDate: new Date()
                },
                granularity: period.days <= 30 ? 'daily' : period.days <= 90 ? 'weekly' : 'monthly'
              })}
              className={`p-3 border rounded-lg text-center transition-colors ${
                timeframe.primary.label === period.label
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Calendar className="h-4 w-4 mx-auto mb-1 text-gray-500" />
              <span className="text-sm font-medium">{period.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dataset Configuration */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Datasets</h3>
          <button
            onClick={addDataset}
            className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            <span>Add Dataset</span>
          </button>
        </div>

        <div className="space-y-4">
          {datasets.map((dataset) => (
            <div key={dataset.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: getDatasetColor(dataset.id) }}
                  />
                  <input
                    type="text"
                    value={dataset.label}
                    onChange={(e) => updateDataset(dataset.id, { label: e.target.value })}
                    className="font-medium text-gray-900 bg-transparent border-none outline-none"
                    placeholder="Dataset name"
                  />
                </div>
                {datasets.length > 1 && (
                  <button
                    onClick={() => removeDataset(dataset.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                )}
              </div>

              {/* Filter Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-2">
                  <label className="flex items-center space-x-1 text-sm font-medium text-gray-700">
                    <Users className="h-3 w-3" />
                    <span>Sales Reps</span>
                  </label>
                  <select
                    multiple
                    value={dataset.filters.salesReps || []}
                    onChange={(e) => updateDatasetFilter(
                      dataset.id, 
                      'salesReps', 
                      Array.from(e.target.selectedOptions, option => option.value)
                    )}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    size={3}
                  >
                    <option value="rep1">John Smith</option>
                    <option value="rep2">Sarah Johnson</option>
                    <option value="rep3">Mike Davis</option>
                    <option value="rep4">Lisa Wilson</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-1 text-sm font-medium text-gray-700">
                    <MapPin className="h-3 w-3" />
                    <span>Territories</span>
                  </label>
                  <select
                    multiple
                    value={dataset.filters.territories || []}
                    onChange={(e) => updateDatasetFilter(
                      dataset.id, 
                      'territories', 
                      Array.from(e.target.selectedOptions, option => option.value)
                    )}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    size={3}
                  >
                    <option value="north">North Region</option>
                    <option value="south">South Region</option>
                    <option value="east">East Region</option>
                    <option value="west">West Region</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-1 text-sm font-medium text-gray-700">
                    <Package className="h-3 w-3" />
                    <span>Products</span>
                  </label>
                  <select
                    multiple
                    value={dataset.filters.products || []}
                    onChange={(e) => updateDatasetFilter(
                      dataset.id, 
                      'products', 
                      Array.from(e.target.selectedOptions, option => option.value)
                    )}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    size={3}
                  >
                    <option value="product1">Pharmalex</option>
                    <option value="product2">Medivita</option>
                    <option value="product3">Healmax</option>
                    <option value="product4">Vitacare</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-1 text-sm font-medium text-gray-700">
                    <Target className="h-3 w-3" />
                    <span>HCP Types</span>
                  </label>
                  <select
                    multiple
                    value={dataset.filters.hcpTypes || []}
                    onChange={(e) => updateDatasetFilter(
                      dataset.id, 
                      'hcpTypes', 
                      Array.from(e.target.selectedOptions, option => option.value)
                    )}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    size={3}
                  >
                    <option value="gp">General Practitioner</option>
                    <option value="specialist">Specialist</option>
                    <option value="hospital">Hospital</option>
                    <option value="clinic">Clinic</option>
                  </select>
                </div>
              </div>

              {/* Dataset Status */}
              <div className="mt-3 flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className={`text-sm ${
                  dataset.isComplete ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {dataset.isComplete 
                    ? 'Dataset configured' 
                    : 'Select at least one filter to complete dataset'
                  }
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {datasets.length} dataset{datasets.length !== 1 ? 's' : ''} • {selectedMetrics.length} metric{selectedMetrics.length !== 1 ? 's' : ''}
        </div>
        
        <div className="flex items-center space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleRunComparison}
            disabled={!isConfigValid}
            className={`flex items-center space-x-2 px-6 py-2 rounded font-medium ${
              isConfigValid
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Play className="h-4 w-4" />
            <span>Run Comparison</span>
          </button>
        </div>
      </div>
    </div>
  );
}