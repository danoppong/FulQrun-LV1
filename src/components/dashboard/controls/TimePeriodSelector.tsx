// src/components/dashboard/controls/TimePeriodSelector.tsx
// Time Period Selector Component for dynamic date range selection
// Provides preset periods and custom date range picker for KPI analysis

'use client';

import React, { useState, useCallback } from 'react';
import { Calendar, ChevronDown, Clock, RotateCcw } from 'lucide-react';

export interface TimePeriod {
  id: string;
  label: string;
  value: string;
  days: number;
  startDate: Date;
  endDate: Date;
}

export interface CustomDateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

interface TimePeriodSelectorProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  onCustomRangeChange?: (range: CustomDateRange) => void;
  showCustomRange?: boolean;
  className?: string;
}

const PRESET_PERIODS: Omit<TimePeriod, 'startDate' | 'endDate'>[] = [
  { id: 'last_7_days', label: 'Last 7 Days', value: '7d', days: 7 },
  { id: 'last_14_days', label: 'Last 14 Days', value: '14d', days: 14 },
  { id: 'last_30_days', label: 'Last 30 Days', value: '30d', days: 30 },
  { id: 'last_60_days', label: 'Last 60 Days', value: '60d', days: 60 },
  { id: 'last_90_days', label: 'Last 90 Days', value: '90d', days: 90 },
  { id: 'last_6_months', label: 'Last 6 Months', value: '6m', days: 180 },
  { id: 'last_12_months', label: 'Last 12 Months', value: '12m', days: 365 },
  { id: 'this_month', label: 'This Month', value: 'tm', days: 30 },
  { id: 'this_quarter', label: 'This Quarter', value: 'tq', days: 90 },
  { id: 'this_year', label: 'This Year', value: 'ty', days: 365 }
];

export function TimePeriodSelector({
  selectedPeriod,
  onPeriodChange,
  onCustomRangeChange,
  showCustomRange = true,
  className = ''
}: TimePeriodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Generate date ranges for preset periods
  const generateDateRange = useCallback((days: number, id: string): { startDate: Date; endDate: Date } => {
    const endDate = new Date();
    let startDate = new Date();

    switch (id) {
      case 'this_month':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case 'this_quarter':
        const quarter = Math.floor(endDate.getMonth() / 3);
        startDate = new Date(endDate.getFullYear(), quarter * 3, 1);
        break;
      case 'this_year':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    }

    return { startDate, endDate };
  }, []);

  // Create full time periods with calculated dates
  const timePeriods: TimePeriod[] = PRESET_PERIODS.map(preset => {
    const { startDate, endDate } = generateDateRange(preset.days, preset.id);
    return {
      ...preset,
      startDate,
      endDate
    };
  });

  const handlePeriodSelect = useCallback((period: TimePeriod) => {
    onPeriodChange(period);
    setIsOpen(false);
    setShowCustomPicker(false);
  }, [onPeriodChange]);

  const handleCustomRangeApply = useCallback(() => {
    if (!customStartDate || !customEndDate) return;

    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);

    if (startDate >= endDate) {
      alert('Start date must be before end date');
      return;
    }

    const customRange: CustomDateRange = {
      startDate,
      endDate,
      label: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
    };

    // Create a custom period object
    const customPeriod: TimePeriod = {
      id: 'custom',
      label: customRange.label,
      value: 'custom',
      days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      startDate,
      endDate
    };

    onPeriodChange(customPeriod);
    if (onCustomRangeChange) {
      onCustomRangeChange(customRange);
    }

    setIsOpen(false);
    setShowCustomPicker(false);
    setCustomStartDate('');
    setCustomEndDate('');
  }, [customStartDate, customEndDate, onPeriodChange, onCustomRangeChange]);

  const handleReset = useCallback(() => {
    const defaultPeriod = timePeriods.find(p => p.id === 'last_30_days') || timePeriods[0];
    handlePeriodSelect(defaultPeriod);
  }, [timePeriods, handlePeriodSelect]);

  const formatDateRange = useCallback((startDate: Date, endDate: Date) => {
    const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Main Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-900">{selectedPeriod.label}</span>
          <span className="text-xs text-gray-500">
            ({formatDateRange(selectedPeriod.startDate, selectedPeriod.endDate)})
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 z-20 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg">
            {!showCustomPicker ? (
              <>
                {/* Quick Actions */}
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Select Period</h3>
                    <button
                      onClick={handleReset}
                      className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
                      title="Reset to Last 30 Days"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Preset Periods */}
                <div className="max-h-64 overflow-y-auto">
                  {timePeriods.map((period) => (
                    <button
                      key={period.id}
                      onClick={() => handlePeriodSelect(period)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        selectedPeriod.id === period.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{period.label}</span>
                        <span className="text-xs text-gray-500">
                          {formatDateRange(period.startDate, period.endDate)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom Range Button */}
                {showCustomRange && (
                  <div className="p-3 border-t border-gray-100">
                    <button
                      onClick={() => setShowCustomPicker(true)}
                      className="flex items-center space-x-2 w-full text-left text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Clock className="h-4 w-4" />
                      <span>Custom Date Range</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Custom Date Picker */
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Custom Date Range</h3>
                  <button
                    onClick={() => setShowCustomPicker(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Back
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      max={new Date().toISOString().split('T')[0]}
                      min={customStartDate}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={handleCustomRangeApply}
                      disabled={!customStartDate || !customEndDate}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomPicker(false);
                        setCustomStartDate('');
                        setCustomEndDate('');
                      }}
                      className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}