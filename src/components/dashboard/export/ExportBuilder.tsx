// src/components/dashboard/export/ExportBuilder.tsx
// Export Builder Component for configuring pharmaceutical dashboard exports
// Provides interface for creating custom reports and scheduled exports

'use client';

import React, { useState, useCallback } from 'react';
import { 
  Download, 
  Calendar, 
  Mail,
  X,
  Plus,
  Check
} from 'lucide-react';
import { 
  ExportConfiguration, 
  ExportFormat, 
  ReportType 
} from '@/lib/types/export';

interface ExportBuilderProps {
  onExport: (config: ExportConfiguration) => void;
  onCancel?: () => void;
  className?: string;
}

const EXPORT_FORMATS: Array<{
  format: ExportFormat;
  label: string;
  description: string;
  icon: string;
  fileSize: string;
}> = [
  {
    format: 'pdf',
    label: 'PDF Report',
    description: 'Professional report with charts and tables',
    icon: '📄',
    fileSize: '~2-5 MB'
  },
  {
    format: 'excel',
    label: 'Excel Workbook',
    description: 'Spreadsheet with multiple sheets and data',
    icon: '📊',
    fileSize: '~1-3 MB'
  },
  {
    format: 'csv',
    label: 'CSV Data',
    description: 'Raw data for analysis and import',
    icon: '📋',
    fileSize: '~100-500 KB'
  },
  {
    format: 'json',
    label: 'JSON Export',
    description: 'Structured data for API integration',
    icon: '🔗',
    fileSize: '~200-800 KB'
  },
  {
    format: 'powerpoint',
    label: 'PowerPoint',
    description: 'Presentation-ready slides',
    icon: '📊',
    fileSize: '~3-8 MB'
  },
  {
    format: 'png',
    label: 'PNG Image',
    description: 'High-quality dashboard screenshot',
    icon: '🖼️',
    fileSize: '~1-2 MB'
  }
];

const REPORT_TYPES: Array<{
  type: ReportType;
  label: string;
  description: string;
  duration: string;
}> = [
  {
    type: 'executive_summary',
    label: 'Executive Summary',
    description: 'High-level KPI overview for leadership',
    duration: '~2 min'
  },
  {
    type: 'detailed_analysis',
    label: 'Detailed Analysis',
    description: 'Comprehensive performance analysis',
    duration: '~5 min'
  },
  {
    type: 'comparison_report',
    label: 'Comparison Report',
    description: 'Territory and product comparisons',
    duration: '~3 min'
  },
  {
    type: 'trend_analysis',
    label: 'Trend Analysis',
    description: 'Time-series performance trends',
    duration: '~4 min'
  },
  {
    type: 'territory_performance',
    label: 'Territory Performance',
    description: 'Regional performance breakdown',
    duration: '~3 min'
  },
  {
    type: 'product_analysis',
    label: 'Product Analysis',
    description: 'Product portfolio insights',
    duration: '~4 min'
  }
];

const PHARMACEUTICAL_METRICS = [
  { id: 'trx', label: 'Total Prescriptions (TRx)', category: 'Prescription' },
  { id: 'nrx', label: 'New Prescriptions (NRx)', category: 'Prescription' },
  { id: 'market_share', label: 'Market Share', category: 'Market' },
  { id: 'hcp_engagement', label: 'HCP Engagement', category: 'Engagement' },
  { id: 'call_frequency', label: 'Call Frequency', category: 'Sales Activity' },
  { id: 'sample_distribution', label: 'Sample Distribution', category: 'Sales Activity' },
  { id: 'revenue', label: 'Revenue', category: 'Financial' },
  { id: 'conversion_rate', label: 'Conversion Rate', category: 'Performance' }
];

export function ExportBuilder({ onExport, onCancel, className = '' }: ExportBuilderProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('executive_summary');
  const [exportName, setExportName] = useState('');
  const [description, setDescription] = useState('');
  
  // Time range configuration
  const [timeRange, setTimeRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    label: 'Last 30 Days'
  });

  // Filter configuration
  const [filters, setFilters] = useState({
    territories: [] as string[],
    products: [] as string[],
    salesReps: [] as string[],
    hcpTypes: [] as string[],
    metrics: ['trx', 'nrx', 'market_share'] as string[]
  });

  // Layout options
  const [layout, setLayout] = useState({
    orientation: 'portrait' as 'portrait' | 'landscape',
    pageSize: 'a4' as 'a4' | 'letter' | 'legal' | 'tabloid',
    includeCharts: true,
    includeTables: true,
    includeInsights: true,
    includeBenchmarks: false,
    headerText: '',
    footerText: ''
  });

  // Scheduling options
  const [scheduling, setScheduling] = useState({
    enabled: false,
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'quarterly',
    dayOfWeek: 1,
    time: '09:00',
    recipients: [] as string[],
    subject: '',
    message: ''
  });

  const [newRecipient, setNewRecipient] = useState('');

  // Handle metric toggle
  const toggleMetric = useCallback((metricId: string) => {
    setFilters(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter(m => m !== metricId)
        : [...prev.metrics, metricId]
    }));
  }, []);

  // Add recipient
  const addRecipient = useCallback(() => {
    if (newRecipient.trim() && newRecipient.includes('@')) {
      setScheduling(prev => ({
        ...prev,
        recipients: [...prev.recipients, newRecipient.trim()]
      }));
      setNewRecipient('');
    }
  }, [newRecipient]);

  // Remove recipient
  const removeRecipient = useCallback((email: string) => {
    setScheduling(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  }, []);

  // Handle export
  const handleExport = useCallback(() => {
    const config: ExportConfiguration = {
      id: `export-${Date.now()}`,
      name: exportName || `${selectedReportType.replace('_', ' ')} Report`,
      description,
      format: selectedFormat,
      reportType: selectedReportType,
      timeRange,
      filters,
      layout,
      schedule: scheduling.enabled ? {
        enabled: true,
        frequency: scheduling.frequency,
        dayOfWeek: scheduling.dayOfWeek,
        time: scheduling.time,
        recipients: scheduling.recipients,
        subject: scheduling.subject || `Automated ${selectedReportType.replace('_', ' ')} Report`,
        message: scheduling.message
      } : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user' // In real implementation, get from auth context
    };

    onExport(config);
  }, [
    exportName, description, selectedFormat, selectedReportType, 
    timeRange, filters, layout, scheduling, onExport
  ]);

  // Validation
  const isValid = exportName.trim().length > 0 && 
                  filters.metrics.length > 0 && 
                  (!scheduling.enabled || scheduling.recipients.length > 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Export Configuration</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create custom pharmaceutical dashboard reports
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Cancel export"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Report Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Name *
            </label>
            <input
              type="text"
              value={exportName}
              onChange={(e) => setExportName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter report name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description"
            />
          </div>
        </div>
      </div>

      {/* Export Format Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900">Export Format</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {EXPORT_FORMATS.map(format => (
            <button
              key={format.format}
              onClick={() => setSelectedFormat(format.format)}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedFormat === format.format
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{format.icon}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{format.label}</h4>
                  <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{format.fileSize}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900">Report Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {REPORT_TYPES.map(report => (
            <button
              key={report.type}
              onClick={() => setSelectedReportType(report.type)}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedReportType === report.type
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{report.label}</h4>
                  <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {report.duration}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Range */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900">Time Period</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Last 7 Days', days: 7 },
            { label: 'Last 30 Days', days: 30 },
            { label: 'Last 3 Months', days: 90 },
            { label: 'Last Year', days: 365 }
          ].map(period => (
            <button
              key={period.label}
              onClick={() => setTimeRange({
                startDate: new Date(Date.now() - period.days * 24 * 60 * 60 * 1000),
                endDate: new Date(),
                label: period.label
              })}
              className={`p-3 border rounded-lg text-center transition-colors ${
                timeRange.label === period.label
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

      {/* Metrics Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900">Metrics to Include</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PHARMACEUTICAL_METRICS.map(metric => (
            <button
              key={metric.id}
              onClick={() => toggleMetric(metric.id)}
              className={`p-3 border rounded-lg text-left transition-colors ${
                filters.metrics.includes(metric.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{metric.label}</h4>
                  <p className="text-xs text-gray-600">{metric.category}</p>
                </div>
                {filters.metrics.includes(metric.id) && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {filters.metrics.length} metric{filters.metrics.length !== 1 ? 's' : ''} selected
        </p>
      </div>

      {/* Layout Options */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900">Layout Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page Orientation
              </label>
              <div className="flex space-x-3">
                <button
                  onClick={() => setLayout(prev => ({ ...prev, orientation: 'portrait' }))}
                  className={`px-3 py-2 border rounded-lg ${
                    layout.orientation === 'portrait' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  Portrait
                </button>
                <button
                  onClick={() => setLayout(prev => ({ ...prev, orientation: 'landscape' }))}
                  className={`px-3 py-2 border rounded-lg ${
                    layout.orientation === 'landscape' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page Size
              </label>
              <select
                value={layout.pageSize}
                onChange={(e) => setLayout(prev => ({ 
                  ...prev, 
                  pageSize: e.target.value as 'a4' | 'letter' | 'legal' | 'tabloid'
                }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
                <option value="tabloid">Tabloid</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Include Components</label>
            <div className="space-y-2">
              {[
                { key: 'includeCharts', label: 'Charts & Visualizations' },
                { key: 'includeTables', label: 'Data Tables' },
                { key: 'includeInsights', label: 'AI Insights' },
                { key: 'includeBenchmarks', label: 'Benchmark Comparisons' }
              ].map(option => (
                <label key={option.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={layout[option.key as keyof typeof layout] as boolean}
                    onChange={(e) => setLayout(prev => ({
                      ...prev,
                      [option.key]: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scheduling Options */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="enable-scheduling"
            checked={scheduling.enabled}
            onChange={(e) => setScheduling(prev => ({ ...prev, enabled: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="enable-scheduling" className="text-lg font-medium text-gray-900">
            Schedule Automatic Reports
          </label>
        </div>

        {scheduling.enabled && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={scheduling.frequency}
                  onChange={(e) => setScheduling(prev => ({ 
                    ...prev, 
                    frequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'quarterly'
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={scheduling.time}
                  onChange={(e) => setScheduling(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {scheduling.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={scheduling.dayOfWeek}
                    onChange={(e) => setScheduling(prev => ({ 
                      ...prev, 
                      dayOfWeek: parseInt(e.target.value)
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                    <option value={0}>Sunday</option>
                  </select>
                </div>
              )}
            </div>

            {/* Recipients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Recipients
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="email"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                  onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                />
                <button
                  onClick={addRecipient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {scheduling.recipients.length > 0 && (
                <div className="space-y-1">
                  {scheduling.recipients.map(email => (
                    <div key={email} className="flex items-center justify-between bg-white border border-gray-200 rounded px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{email}</span>
                      </div>
                      <button
                        onClick={() => removeRecipient(email)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {selectedFormat.toUpperCase()} • {selectedReportType.replace('_', ' ')} • {filters.metrics.length} metrics
        </div>
        
        <div className="flex items-center space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleExport}
            disabled={!isValid}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium ${
              isValid
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>{scheduling.enabled ? 'Schedule Export' : 'Generate Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}