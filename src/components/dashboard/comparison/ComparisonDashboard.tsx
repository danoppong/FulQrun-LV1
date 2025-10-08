// src/components/dashboard/comparison/ComparisonDashboard.tsx
// Main Comparison Dashboard Component for comparative analytics
// Orchestrates comparison builder, results display, and export functionality

'use client';

import React, { useState, useCallback } from 'react';
import { 
  BarChart3, 
  Plus, 
  Settings,
  Filter,
  TrendingUp,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { ComparisonBuilder } from './ComparisonBuilder';
import { SideBySideComparison } from './SideBySideComparison';
import { TrendComparison } from './TrendComparison';
import { ComparisonEngine } from '@/lib/comparison/comparison-engine';
import { 
  ComparisonConfiguration, 
  ComparisonResult
} from '@/lib/types/comparison';

interface ComparisonDashboardProps {
  className?: string;
}

interface ComparisonSession {
  id: string;
  config: ComparisonConfiguration;
  result: ComparisonResult;
  createdAt: Date;
}

export function ComparisonDashboard({ className = '' }: ComparisonDashboardProps) {
  const [isBuilding, setIsBuilding] = useState(false);
  const [sessions, setSessions] = useState<ComparisonSession[]>([]);
  const [activeSession, setActiveSession] = useState<ComparisonSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle new comparison
  const handleRunComparison = useCallback(async (config: ComparisonConfiguration) => {
    setIsLoading(true);
    try {
      // Execute comparison using the engine
      const engine = ComparisonEngine.getInstance();
      const result = await engine.executeComparison(config);
      
      const session: ComparisonSession = {
        id: `session-${Date.now()}`,
        config,
        result,
        createdAt: new Date()
      };

      setSessions(prev => [session, ...prev]);
      setActiveSession(session);
      setIsBuilding(false);
    } catch (error) {
      console.error('Comparison execution failed:', error);
      // Handle error - could show notification
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle export
  const handleExport = useCallback((session: ComparisonSession) => {
    const exportData = {
      configuration: session.config,
      results: session.result,
      exportedAt: new Date().toISOString(),
      metadata: {
        sessionId: session.id,
        comparisonType: session.config.type,
        datasetCount: session.config.datasets.length,
        metricCount: session.config.metrics.length
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comparison-${session.config.name}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Handle time range change for trend analysis
  const handleTimeRangeChange = useCallback((range: { start: Date; end: Date }) => {
    if (activeSession) {
      const updatedConfig: ComparisonConfiguration = {
        ...activeSession.config,
        timeframe: {
          ...activeSession.config.timeframe,
          primary: {
            ...activeSession.config.timeframe.primary,
            startDate: range.start,
            endDate: range.end
          }
        }
      };
      handleRunComparison(updatedConfig);
    }
  }, [activeSession, handleRunComparison]);

  // Clear all sessions
  const clearSessions = useCallback(() => {
    setSessions([]);
    setActiveSession(null);
  }, []);

  // Render comparison results based on type
  const renderComparisonResults = () => {
    if (!activeSession) return null;

    const { config, result } = activeSession;

    switch (config.type) {
      case 'side_by_side':
      case 'benchmark':
      case 'cohort':
        return (
          <SideBySideComparison
            datasets={result.datasets}
            metrics={config.metrics}
            onExport={() => handleExport(activeSession)}
            className="mt-6"
          />
        );

      case 'time_series':
      case 'seasonal':
        return (
          <TrendComparison
            timeSeries={result.datasets.map(dataset => ({
              datasetId: dataset.datasetId,
              label: dataset.label,
              color: dataset.color || '#3b82f6',
              data: dataset.timeSeries || []
            }))}
            timeframe={config.timeframe}
            onTimeRangeChange={handleTimeRangeChange}
            onExport={() => handleExport(activeSession)}
            className="mt-6"
          />
        );

      default:
        return (
          <div className="mt-6 p-6 border border-gray-200 rounded-lg text-center">
            <p className="text-gray-600">Comparison type not yet supported</p>
          </div>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comparative Analytics</h1>
          <p className="text-gray-600 mt-1">
            Compare performance across territories, products, and time periods
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Session History */}
          {sessions.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={clearSessions}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                title="Clear all sessions"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* New Comparison */}
          {!isBuilding && (
            <button
              onClick={() => setIsBuilding(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>New Comparison</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Running comparison analysis...</span>
          </div>
        </div>
      )}

      {/* Comparison Builder */}
      {isBuilding && !isLoading && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <ComparisonBuilder
            onRunComparison={handleRunComparison}
            onCancel={() => setIsBuilding(false)}
          />
        </div>
      )}

      {/* Session History Tabs */}
      {sessions.length > 0 && !isBuilding && (
        <div className="border-b border-gray-200">
          <div className="flex space-x-1 overflow-x-auto">
            {sessions.map(session => (
              <button
                key={session.id}
                onClick={() => setActiveSession(session)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg whitespace-nowrap ${
                  activeSession?.id === session.id
                    ? 'bg-blue-50 border-b-2 border-blue-500 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {session.config.type === 'side_by_side' ? (
                  <BarChart3 className="h-4 w-4" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{session.config.name}</span>
                <span className="text-xs text-gray-500">
                  {session.createdAt.toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {!isBuilding && !isLoading && renderComparisonResults()}

      {/* Empty State */}
      {sessions.length === 0 && !isBuilding && !isLoading && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Comparisons Yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start comparing performance across different territories, products, or time periods 
            to gain valuable insights into your pharmaceutical operations.
          </p>
          <button
            onClick={() => setIsBuilding(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
          >
            <Plus className="h-5 w-5" />
            <span>Create Your First Comparison</span>
          </button>
        </div>
      )}

      {/* Quick Stats */}
      {activeSession && !isBuilding && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Datasets</span>
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold text-gray-900">
                {activeSession.config.datasets.length}
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Metrics</span>
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold text-gray-900">
                {activeSession.config.metrics.length}
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Time Period</span>
            </div>
            <div className="mt-1">
              <span className="text-sm font-semibold text-gray-900">
                {activeSession.config.timeframe.primary.label}
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Type</span>
            </div>
            <div className="mt-1">
              <span className="text-sm font-semibold text-gray-900 capitalize">
                {activeSession.config.type.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}