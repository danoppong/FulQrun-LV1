// src/components/bi/TerritoryPerformanceChart.tsx
// Territory Performance Chart Component
// Displays territory-level KPI performance with charts and comparisons

'use client';

import React from 'react';
import { MapIcon, UserGroupIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface TerritoryPerformanceChartProps {
  territoryPerformance: Array<{
    territory: unknown;
    kpis: unknown[];
  }>;
  userRole: 'rep' | 'manager' | 'admin';
}

export function TerritoryPerformanceChart({ territoryPerformance, userRole }: TerritoryPerformanceChartProps) {
  // Ensure territoryPerformance is an array
  const safeTerritoryPerformance = Array.isArray(territoryPerformance) ? territoryPerformance : [];
  
  const getKPIColor = (kpiId: string, value: number): string => {
    switch (kpiId) {
      case 'trx':
      case 'nrx':
        return value > 1000 ? 'text-green-600' : value > 500 ? 'text-yellow-600' : 'text-red-600';
      case 'market_share':
        return value > 15 ? 'text-green-600' : value > 10 ? 'text-yellow-600' : 'text-red-600';
      case 'growth':
        return value > 10 ? 'text-green-600' : value > 0 ? 'text-yellow-600' : 'text-red-600';
      case 'reach':
        return value > 80 ? 'text-green-600' : value > 60 ? 'text-yellow-600' : 'text-red-600';
      case 'frequency':
        return value > 3 ? 'text-green-600' : value > 2 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatKPIValue = (kpiId: string, value: number): string => {
    // Ensure value is a valid number
    const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    
    switch (kpiId) {
      case 'market_share':
      case 'growth':
      case 'reach':
        return `${safeValue.toFixed(1)}%`;
      case 'frequency':
      case 'call_effectiveness':
      case 'sample_to_script_ratio':
        return safeValue.toFixed(2);
      default:
        return safeValue.toLocaleString();
    }
  };

  const getKPIName = (kpiId: string): string => {
    const kpiNames: Record<string, string> = {
      'trx': 'TRx',
      'nrx': 'NRx',
      'market_share': 'Market Share',
      'growth': 'Growth %',
      'reach': 'Reach %',
      'frequency': 'Frequency',
      'call_effectiveness': 'Call Effectiveness',
      'sample_to_script_ratio': 'Sample-to-Script Ratio',
      'formulary_access': 'Formulary Access %'
    };
    return kpiNames[kpiId] || kpiId;
  };

  return (
    <div className="space-y-6">
      {/* Territory Performance Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Territory Performance Overview</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <MapIcon className="h-5 w-5" />
            <span>{safeTerritoryPerformance.length} Territories</span>
          </div>
        </div>

        {safeTerritoryPerformance.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No territory performance data available</p>
        ) : (
          <div className="space-y-6">
            {safeTerritoryPerformance.map(({ territory, kpis }, index) => (
              <div key={territory.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{territory.name}</h4>
                    <p className="text-sm text-gray-500">{territory.region}</p>
                  </div>
                  <div className="text-right">
                    {territory.assigned_user && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Rep:</span> {territory.assigned_user.full_name}
                      </div>
                    )}
                    {territory.manager && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Manager:</span> {territory.manager.full_name}
                      </div>
                    )}
                  </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {kpis.map((kpi) => (
                    <div key={kpi.kpiId} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-gray-900">{getKPIName(kpi.kpiId)}</h5>
                        <span className={`text-xs font-medium ${getKPIColor(kpi.kpiId, kpi.value)}`}>
                          {(kpi.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className={`text-xl font-bold ${getKPIColor(kpi.kpiId, kpi.value)}`}>
                        {formatKPIValue(kpi.kpiId, kpi.value)}
                      </p>
                      {kpi.metadata && (
                        <div className="mt-2 text-xs text-gray-500">
                          {kpi.metadata.totalHCPs && (
                            <div>HCPs: {kpi.metadata.totalHCPs}</div>
                          )}
                          {kpi.metadata.engagedHCPs && (
                            <div>Engaged: {kpi.metadata.engagedHCPs}</div>
                          )}
                          {kpi.metadata.totalCalls && (
                            <div>Calls: {kpi.metadata.totalCalls}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Territory Comparison Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Territory Comparison</h3>
        
        {safeTerritoryPerformance.length > 1 ? (
          <div className="space-y-4">
            {/* TRx Comparison */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Total Prescriptions (TRx)</h4>
              <div className="space-y-2">
                {territoryPerformance
                  .map(({ territory, kpis }) => ({
                    territory,
                    trx: kpis.find(kpi => kpi.kpiId === 'trx')?.value || 0
                  }))
                  .sort((a, b) => b.trx - a.trx)
                  .map(({ territory, trx }, index) => (
                    <div key={territory.id} className="flex items-center space-x-4">
                      <div className="w-8 text-sm font-medium text-gray-600">#{index + 1}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{territory.name}</span>
                          <span className="text-sm text-gray-600">{trx.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{
                              width: `${(trx / Math.max(...safeTerritoryPerformance.map(tp => 
                                tp.kpis.find(kpi => kpi.kpiId === 'trx')?.value || 0
                              ))) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Growth Comparison */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Growth %</h4>
              <div className="space-y-2">
                {territoryPerformance
                  .map(({ territory, kpis }) => ({
                    territory,
                    growth: kpis.find(kpi => kpi.kpiId === 'growth')?.value || 0
                  }))
                  .sort((a, b) => b.growth - a.growth)
                  .map(({ territory, growth }, index) => (
                    <div key={territory.id} className="flex items-center space-x-4">
                      <div className="w-8 text-sm font-medium text-gray-600">#{index + 1}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{territory.name}</span>
                          <span className={`text-sm font-medium ${getKPIColor('growth', growth)}`}>
                            {growth.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${growth >= 0 ? 'bg-green-600' : 'bg-red-600'}`}
                            style={{
                              width: `${Math.min(Math.abs(growth) * 5, 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Need multiple territories to show comparison</p>
        )}
      </div>
    </div>
  );
}
