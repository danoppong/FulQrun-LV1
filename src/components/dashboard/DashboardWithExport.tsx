// src/components/dashboard/DashboardWithExport.tsx
// Enhanced Dashboard with Export Integration
// Combines Phase 2.1-2.4 features with Phase 2.5 export capabilities

'use client';

import React, { useState } from 'react';
import { 
  Download, 
  BarChart3, 
  TrendingUp, 
  Filter,
  Settings
} from 'lucide-react';
import { FilteredDashboard } from './FilteredDashboard';
import { ComparisonDashboard } from './comparison/ComparisonDashboard';
import { ExportDashboard } from './export/ExportDashboard';

type DashboardView = 'analytics' | 'comparison' | 'export';

export function DashboardWithExport() {
  const [activeView, setActiveView] = useState<DashboardView>('analytics');

  const navigationItems = [
    {
      id: 'analytics' as DashboardView,
      label: 'Analytics Dashboard',
      description: 'KPI monitoring with filters and drill-downs',
      icon: <BarChart3 className="h-5 w-5" />,
      features: ['Phase 2.1: Drill-down Modals', 'Phase 2.2: Time Selectors', 'Phase 2.3: Territory/Product Filters']
    },
    {
      id: 'comparison' as DashboardView,
      label: 'Comparative Analytics',
      description: 'Side-by-side comparisons and trend analysis',
      icon: <TrendingUp className="h-5 w-5" />,
      features: ['Phase 2.4: Side-by-side Comparisons', 'Trend Analysis', 'Statistical Insights']
    },
    {
      id: 'export' as DashboardView,
      label: 'Export & Reporting',
      description: 'Generate reports and schedule automated exports',
      icon: <Download className="h-5 w-5" />,
      features: ['Phase 2.5: Custom Reports', 'Scheduled Exports', 'Multiple Formats']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                FulQrun Pharmaceutical Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Enhanced with Phase 2.1-2.5 Features
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Settings className="h-4 w-4" />
                <span>All Phases Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigationItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeView === item.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                {navigationItems.find(item => item.id === activeView)?.label}
              </h3>
              <p className="text-sm text-blue-600">
                {navigationItems.find(item => item.id === activeView)?.description}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {navigationItems
                .find(item => item.id === activeView)
                ?.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-1 text-xs text-blue-700">
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    <span>{feature}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Filter className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Analytics Dashboard with Enhanced Filtering
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                Comprehensive pharmaceutical KPI monitoring with territory/product filters, 
                time period selection, and interactive drill-down capabilities.
              </p>
              <FilteredDashboard />
            </div>
          </div>
        )}

        {activeView === 'comparison' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Comparative Analytics Engine
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                Advanced side-by-side comparisons, trend analysis, and statistical insights 
                for pharmaceutical performance evaluation across territories and products.
              </p>
              <ComparisonDashboard />
            </div>
          </div>
        )}

        {activeView === 'export' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Download className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Export & Reporting System
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                Generate custom pharmaceutical reports, schedule automated exports, 
                and share insights across multiple formats including PDF, Excel, and PowerPoint.
              </p>
              <ExportDashboard />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              FulQrun Pharmaceutical Dashboard • Enhanced Analytics Platform
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Phase 2.1-2.5 Complete</span>
              <span>•</span>
              <span>Enterprise Ready</span>
              <span>•</span>
              <span>TypeScript</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}