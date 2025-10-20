// src/components/dashboard/widgets/DrillDownModal.tsx
// Drill-down Modal Component for detailed KPI analytics
// Provides detailed views when clicking on KPI cards

'use client';

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Minus, Calendar, MapPin, Package } from 'lucide-react';
import { PharmaKPICardData } from '@/lib/types/dashboard';
import { DetailedAnalytics } from '../analytics/DetailedAnalytics';
import { HistoricalChart } from '../charts/HistoricalChart';
import { TrendAnalysis } from '@/components/dashboard/analytics/TrendAnalysis';
import { TimePeriodSelector, TimePeriod } from '../controls/TimePeriodSelector';
import { useTimePeriod, TimePeriodPreset } from '@/hooks/useTimePeriod';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpiData: PharmaKPICardData;
  kpiId: string;
  organizationId: string;
  productId?: string;
  territoryId?: string;
}

interface TabData {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabData[] = [
  { id: 'overview', label: 'Overview', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'historical', label: 'Historical', icon: <Calendar className="h-4 w-4" /> },
  { id: 'breakdown', label: 'Breakdown', icon: <Package className="h-4 w-4" /> },
  { id: 'territory', label: 'Territory', icon: <MapPin className="h-4 w-4" /> }
];

export function DrillDownModal({
  isOpen,
  onClose,
  kpiData,
  kpiId,
  organizationId,
  productId,
  territoryId
}: DrillDownModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [timePeriodState, timePeriodActions] = useTimePeriod('30d');
  const [loading, setLoading] = useState(false);

  // Handle time period changes
  const handleTimePeriodChange = (period: TimePeriod) => {
    setLoading(true);
    if (period.id === 'custom') {
      timePeriodActions.setCustomRange(period.startDate, period.endDate);
    } else {
      timePeriodActions.setPreset(period.value as TimePeriodPreset);
    }
    setTimeout(() => setLoading(false), 500); // Simulate data reload
  };

  // Convert time period state to TimePeriod object for selector
  const getCurrentTimePeriod = (): TimePeriod => {
    return {
      id: timePeriodState.preset,
      label: timePeriodState.timeRange.label,
      value: timePeriodState.preset,
      days: timePeriodState.timeRange.days,
      startDate: timePeriodState.timeRange.startDate,
      endDate: timePeriodState.timeRange.endDate,
    };
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getTrendIcon = () => {
    if (!kpiData.trend) return <Minus className="h-5 w-5 text-gray-500" />;
    
    switch (kpiData.trend) {
      case 'up':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatValue = (value: number): string => {
    switch (kpiData.format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'ratio':
        return value.toFixed(2);
      default:
        return value.toLocaleString();
    }
  };

  const renderTabContent = () => {
    const timeRangeProps = {
      timeRange: timePeriodState.timeRange,
      isLoading: loading,
    };

    switch (activeTab) {
      case 'overview':
        return (
          <DetailedAnalytics
            kpiData={kpiData}
            kpiId={kpiId}
            organizationId={organizationId}
            productId={productId}
            territoryId={territoryId}
            {...timeRangeProps}
          />
        );
      case 'historical':
        return (
          <HistoricalChart
            kpiId={kpiId}
            organizationId={organizationId}
            productId={productId}
            territoryId={territoryId}
            currentValue={kpiData.value}
            {...timeRangeProps}
          />
        );
      case 'breakdown':
        return (
          <TrendAnalysis
            kpiData={kpiData}
            kpiId={kpiId}
            organizationId={organizationId}
            type="breakdown"
            {...timeRangeProps}
          />
        );
      case 'territory':
        return (
          <TrendAnalysis
            kpiData={kpiData}
            kpiId={kpiId}
            organizationId={organizationId}
            type="territory"
            {...timeRangeProps}
          />
        );
      default:
        return <div>Select a tab to view details</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getTrendIcon()}
                <h2 className="text-2xl font-bold text-gray-900">
                  {kpiData.kpiName || kpiId}
                </h2>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {formatValue(kpiData.value)}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Time Period Selector */}
              <TimePeriodSelector
                selectedPeriod={getCurrentTimePeriod()}
                onPeriodChange={handleTimePeriodChange}
                showCustomRange={true}
                className="min-w-[200px]"
              />
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
          </div>

          {/* KPI Summary */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-500">Confidence</div>
                <div className="text-lg font-semibold">
                  {(kpiData.confidence * 100).toFixed(0)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Period</div>
                <div className="text-lg font-semibold">
                  {timePeriodActions.formatCurrentRange('short')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Trend</div>
                <div className="text-lg font-semibold capitalize">
                  {kpiData.trend || 'Stable'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Last Updated</div>
                <div className="text-lg font-semibold">
                  {kpiData.metadata?.calculatedAt 
                    ? new Date(kpiData.metadata.calculatedAt as string).toLocaleTimeString()
                    : 'Recent'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto max-h-[50vh]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading analytics...</span>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}