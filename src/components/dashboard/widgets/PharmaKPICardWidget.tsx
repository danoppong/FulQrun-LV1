// src/components/dashboard/widgets/PharmaKPICardWidget.tsx
// Pharmaceutical KPI Card Widget Component
// Displays pharmaceutical-specific KPIs in dashboard format

'use client';

import React from 'react';
import { DashboardWidget } from '@/lib/dashboard-widgets'
import { PharmaKPICardData } from '@/lib/types/dashboard'
import { KPICard } from '@/components/bi/KPICard';

interface PharmaKPICardWidgetProps {
  widget: DashboardWidget;
  data: PharmaKPICardData;
}

export function PharmaKPICardWidget({ widget, data }: PharmaKPICardWidgetProps) {
  const getKPIColor = (kpiId: string, value: number): string => {
    // Define color schemes based on KPI type and value
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
      case 'call_effectiveness':
        return value > 2 ? 'text-green-600' : value > 1.5 ? 'text-yellow-600' : 'text-red-600';
      case 'sample_to_script_ratio':
        return value < 10 ? 'text-green-600' : value < 15 ? 'text-yellow-600' : 'text-red-600';
      case 'formulary_access':
        return value > 80 ? 'text-green-600' : value > 60 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <KPICard
      title={data.kpiName}
      value={data.value}
      trend={data.trend}
      color={getKPIColor(data.kpiId, data.value)}
      confidence={data.confidence}
      metadata={data.metadata}
      format={data.format}
    />
  );
}
