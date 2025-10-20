// src/lib/types/export.ts
// Type definitions for export and reporting functionality
// Supports multiple export formats and automated report generation

export type ExportFormat = 
  | 'pdf'           // PDF reports with charts and tables
  | 'excel'         // Excel workbooks with multiple sheets
  | 'csv'           // CSV data files
  | 'json'          // JSON data export
  | 'powerpoint'    // PowerPoint presentations
  | 'png'           // PNG image exports
  | 'svg';          // SVG vector graphics

export type ReportType = 
  | 'executive_summary'    // High-level KPI overview
  | 'detailed_analysis'    // Comprehensive data analysis
  | 'comparison_report'    // Comparative analytics results
  | 'trend_analysis'       // Time-series trend reports
  | 'territory_performance' // Territory-specific reports
  | 'product_analysis'     // Product performance reports
  | 'sales_activity'       // Sales activity summaries
  | 'hcp_engagement'       // HCP interaction reports
  | 'custom';              // User-defined reports

export interface ExportConfiguration {
  id: string;
  name: string;
  description?: string;
  format: ExportFormat;
  reportType: ReportType;
  
  // Data selection
  timeRange: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
  
  filters: {
    territories?: string[];
    products?: string[];
    salesReps?: string[];
    hcpTypes?: string[];
    metrics?: string[];
  };
  
  // Layout options
  layout: {
    orientation: 'portrait' | 'landscape';
    pageSize: 'a4' | 'letter' | 'legal' | 'tabloid';
    includeCharts: boolean;
    includeTables: boolean;
    includeInsights: boolean;
    includeBenchmarks: boolean;
    logoUrl?: string;
    headerText?: string;
    footerText?: string;
  };
  
  // Scheduling
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    time: string; // HH:MM format
    recipients: string[];
    subject?: string;
    message?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ExportResult {
  id: string;
  configurationId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: ExportFormat;
  fileName: string;
  fileSize?: number;
  downloadUrl?: string;
  error?: string;
  
  // Metadata
  generatedAt: Date;
  expiresAt?: Date;
  downloadCount: number;
  
  // Content summary
  summary: {
    totalPages?: number;
    chartCount: number;
    tableCount: number;
    dataPoints: number;
    timeRange: {
      startDate: Date;
      endDate: Date;
    };
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  reportType: ReportType;
  isDefault: boolean;
  
  // Template structure
  sections: ReportSection[];
  
  // Styling
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    fontSize: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ReportSection {
  id: string;
  type: 'title' | 'summary' | 'chart' | 'table' | 'insights' | 'text' | 'spacer';
  title?: string;
  order: number;
  
  // Configuration based on type
  config: {
    // For chart sections
    chartType?: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
    metrics?: string[];
    groupBy?: string;
    
    // For table sections
    columns?: TableColumn[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    maxRows?: number;
    
    // For text sections
    content?: string;
    
    // For summary sections
    kpis?: string[];
    comparisonPeriod?: boolean;
    
    // Common styling
    height?: number;
    backgroundColor?: string;
    borderColor?: string;
  };
}

export interface TableColumn {
  key: string;
  title: string;
  type: 'text' | 'number' | 'percentage' | 'currency' | 'date';
  format?: string;
  width?: number;
  alignment?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface ChartExportOptions {
  width: number;
  height: number;
  backgroundColor: string;
  format: 'png' | 'svg' | 'pdf';
  quality?: number; // 0-100 for PNG
  dpi?: number;
}

export interface ScheduledReport {
  id: string;
  configurationId: string;
  lastRun?: Date;
  nextRun: Date;
  status: 'active' | 'paused' | 'failed';
  runCount: number;
  failureCount: number;
  lastError?: string;
  
  // Recipients and delivery
  recipients: ReportRecipient[];
  deliveryMethod: 'email' | 'ftp' | 'api' | 'storage';
  deliveryConfig: Record<string, string>;
}

export interface ReportRecipient {
  email: string;
  name?: string;
  role?: string;
  preferences: {
    format: ExportFormat[];
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    timezone: string;
  };
}

export interface ExportMetrics {
  totalExports: number;
  exportsByFormat: Record<ExportFormat, number>;
  exportsByType: Record<ReportType, number>;
  averageFileSize: number;
  averageGenerationTime: number;
  successRate: number;
  popularTemplates: string[];
  peakExportHours: number[];
}

// Export utility functions
export interface ExportUtils {
  generateFileName(config: ExportConfiguration): string;
  validateConfiguration(config: ExportConfiguration): { isValid: boolean; errors: string[] };
  estimateFileSize(config: ExportConfiguration): number;
  formatFileSize(bytes: number): string;
  getExportIcon(format: ExportFormat): string;
  getMimeType(format: ExportFormat): string;
}

// Progress tracking for long exports
export interface ExportProgress {
  exportId: string;
  status: 'initializing' | 'collecting_data' | 'generating_charts' | 'formatting' | 'finalizing';
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining?: number; // seconds
  startTime: Date;
  warnings?: string[];
}

// Batch export for multiple configurations
export interface BatchExportRequest {
  id: string;
  name: string;
  configurations: string[]; // Configuration IDs
  format: ExportFormat;
  combineFiles: boolean;
  
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results: ExportResult[];
  
  createdAt: Date;
  createdBy: string;
}