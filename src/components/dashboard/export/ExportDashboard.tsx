// src/components/dashboard/export/ExportDashboard.tsx
// Export Dashboard Component for managing pharmaceutical dashboard exports
// Provides interface for creating, scheduling, and managing exports

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Download, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Calendar,
  FileText,
  Trash2,
  Eye,
  Share2
} from 'lucide-react';
import { ExportBuilder } from './ExportBuilder';
import { ExportEngine } from '@/lib/export/export-engine';
import { 
  ExportConfiguration, 
  ExportResult, 
  ExportFormat 
} from '@/lib/types/export';

interface ExportDashboardProps {
  className?: string;
}

interface ExportSession {
  id: string;
  config: ExportConfiguration;
  result?: ExportResult;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  createdAt: Date;
}

interface ExportMetrics {
  totalExports: number;
  exportsByFormat: Record<ExportFormat, number>;
  successRate: number;
  averageGenerationTime: number;
}

export function ExportDashboard({ className = '' }: ExportDashboardProps) {
  const [isBuilding, setIsBuilding] = useState(false);
  const [sessions, setSessions] = useState<ExportSession[]>([]);
  const [metrics, setMetrics] = useState<ExportMetrics | null>(null);

  // Load export metrics on mount
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const engine = ExportEngine.getInstance();
        const data = await engine.getExportMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to load export metrics:', error);
      }
    };

    loadMetrics();
  }, []);

  // Handle new export
  const handleExport = useCallback(async (config: ExportConfiguration) => {
    const session: ExportSession = {
      id: `session-${Date.now()}`,
      config,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };

    setSessions(prev => [session, ...prev]);
    setIsBuilding(false);

    // Start export process
    try {
      const engine = ExportEngine.getInstance();
      
      // Update session status
      setSessions(prev => prev.map(s => 
        s.id === session.id 
          ? { ...s, status: 'processing', progress: 10 }
          : s
      ));

      const result = await engine.generateExport(config);
      
      setSessions(prev => prev.map(s => 
        s.id === session.id 
          ? { 
              ...s, 
              result, 
              status: result.status === 'completed' ? 'completed' : 'failed',
              progress: 100 
            }
          : s
      ));

    } catch (error) {
      setSessions(prev => prev.map(s => 
        s.id === session.id 
          ? { ...s, status: 'failed', progress: 0 }
          : s
      ));
      console.error('Export failed:', error);
    }
  }, []);

  // Handle download
  const handleDownload = useCallback((session: ExportSession) => {
    if (session.result?.downloadUrl) {
      const link = document.createElement('a');
      link.href = session.result.downloadUrl;
      link.download = session.result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Update download count
      setSessions(prev => prev.map(s => 
        s.id === session.id && s.result
          ? { ...s, result: { ...s.result, downloadCount: s.result.downloadCount + 1 } }
          : s
      ));
    }
  }, []);

  // Delete session
  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  // Clear all sessions
  const clearSessions = useCallback(() => {
    setSessions([]);
  }, []);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get format icon
  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'pdf': return '📄';
      case 'excel': return '📊';
      case 'csv': return '📋';
      case 'json': return '🔗';
      case 'powerpoint': return '📊';
      case 'png': return '🖼️';
      case 'svg': return '🎨';
      default: return '📄';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export & Reporting</h1>
          <p className="text-gray-600 mt-1">
            Generate and schedule pharmaceutical dashboard reports
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Clear Sessions */}
          {sessions.length > 0 && (
            <button
              onClick={clearSessions}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              title="Clear all exports"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}

          {/* New Export */}
          {!isBuilding && (
            <button
              onClick={() => setIsBuilding(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>New Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Export Metrics */}
      {metrics && !isBuilding && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Download className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Total Exports</span>
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold text-gray-900">
                {metrics.totalExports?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Success Rate</span>
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold text-gray-900">
                {((metrics.successRate || 0) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Avg. Time</span>
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold text-gray-900">
                {(metrics.averageGenerationTime || 0).toFixed(1)}s
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Most Popular</span>
            </div>
            <div className="mt-1">
              <span className="text-sm font-semibold text-gray-900">
                {Object.entries(metrics.exportsByFormat || {})
                  .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0]?.toUpperCase() || 'PDF'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Export Builder */}
      {isBuilding && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <ExportBuilder
            onExport={handleExport}
            onCancel={() => setIsBuilding(false)}
          />
        </div>
      )}

      {/* Export Sessions */}
      {sessions.length > 0 && !isBuilding && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Exports</h2>
            <span className="text-sm text-gray-600">
              {sessions.length} export{sessions.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            {sessions.map(session => (
              <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Format Icon */}
                    <div className="text-2xl">
                      {getFormatIcon(session.config.format)}
                    </div>

                    {/* Export Details */}
                    <div>
                      <h3 className="font-medium text-gray-900">{session.config.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>{session.config.format.toUpperCase()}</span>
                        <span>•</span>
                        <span>{session.config.reportType.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{session.createdAt.toLocaleDateString()}</span>
                        {session.result?.fileSize && (
                          <>
                            <span>•</span>
                            <span>{formatFileSize(session.result.fileSize)}</span>
                          </>
                        )}
                      </div>
                      {session.config.description && (
                        <p className="text-sm text-gray-600 mt-1">{session.config.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center space-x-3">
                    {/* Status */}
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {session.status === 'processing' ? (
                          <div className="flex items-center space-x-1">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>Processing</span>
                          </div>
                        ) : session.status === 'completed' ? (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Completed</span>
                          </div>
                        ) : session.status === 'failed' ? (
                          <div className="flex items-center space-x-1">
                            <XCircle className="h-3 w-3" />
                            <span>Failed</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Pending</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {session.status === 'completed' && session.result && (
                        <>
                          <button
                            onClick={() => handleDownload(session)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Download export"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                            title="Preview export"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                            title="Share export"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete export"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {session.status === 'processing' && session.progress !== undefined && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${session.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {session.progress}% complete
                    </p>
                  </div>
                )}

                {/* Export Summary */}
                {session.result && session.status === 'completed' && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Charts:</span>
                        <span className="ml-1 font-medium">{session.result.summary.chartCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tables:</span>
                        <span className="ml-1 font-medium">{session.result.summary.tableCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Data Points:</span>
                        <span className="ml-1 font-medium">{session.result.summary.dataPoints.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Downloads:</span>
                        <span className="ml-1 font-medium">{session.result.downloadCount}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scheduled Export Info */}
                {session.config.schedule?.enabled && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800 font-medium">
                        Scheduled: {session.config.schedule.frequency} at {session.config.schedule.time}
                      </span>
                    </div>
                    <div className="text-sm text-blue-700 mt-1">
                      Recipients: {session.config.schedule.recipients.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {sessions.length === 0 && !isBuilding && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Download className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Exports Yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first pharmaceutical dashboard export to generate reports, 
            schedule automated deliveries, and share insights with your team.
          </p>
          <button
            onClick={() => setIsBuilding(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
          >
            <Plus className="h-5 w-5" />
            <span>Create Your First Export</span>
          </button>
        </div>
      )}
    </div>
  );
}