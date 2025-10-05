// src/components/dashboard/widgets/TerritoryPerformanceWidget.tsx
// Territory Performance Widget Component
// Compact version of territory performance for dashboard

'use client';

import React from 'react';
import { DashboardWidget } from '@/lib/dashboard-widgets';
import { TerritoryPerformanceData } from '@/lib/types/dashboard';
import { MapIcon } from '@heroicons/react/24/outline';

interface TerritoryPerformanceWidgetProps {
  widget: DashboardWidget;
  data: TerritoryPerformanceData;
}

interface TerritorySummaryCardProps {
  territory: {
    id: string;
    name: string;
    kpis: Array<{
      kpiId: string;
      kpiName: string;
      value: number;
      confidence: number;
      trend: 'up' | 'down' | 'stable';
      format: 'number' | 'percentage' | 'currency' | 'ratio';
    }>;
  };
}

function TerritorySummaryCard({ territory }: TerritorySummaryCardProps) {
  const formatValue = (value: number, format: string): string => {
    switch (format) {
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

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900">{territory.name}</h4>
        <MapIcon className="h-4 w-4 text-gray-400" />
      </div>
      
      <div className="space-y-1">
        {territory.kpis.slice(0, 3).map((kpi) => (
          <div key={kpi.kpiId} className="flex items-center justify-between text-xs">
            <span className="text-gray-600 truncate">{kpi.kpiName}</span>
            <div className="flex items-center space-x-1">
              <span className="font-medium">{formatValue(kpi.value, kpi.format)}</span>
              <span className={`${getTrendColor(kpi.trend)}`}>
                {kpi.trend === 'up' ? '↗' : kpi.trend === 'down' ? '↘' : '→'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TerritoryPerformanceWidget({ widget, data }: TerritoryPerformanceWidgetProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{widget.title}</h3>
        <MapIcon className="h-5 w-5 text-gray-400" />
      </div>
      
      {data.territories.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No territory performance data available</p>
      ) : (
        <div className="space-y-3">
          {data.territories.slice(0, 4).map((territory) => (
            <TerritorySummaryCard key={territory.id} territory={territory} />
          ))}
          {data.territories.length > 4 && (
            <p className="text-xs text-gray-500 text-center">
              +{data.territories.length - 4} more territories
            </p>
          )}
        </div>
      )}
    </div>
  );
}
