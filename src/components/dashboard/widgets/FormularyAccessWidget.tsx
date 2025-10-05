// src/components/dashboard/widgets/FormularyAccessWidget.tsx
// Formulary Access Widget Component
// Compact version of formulary access for dashboard

'use client';

import React from 'react';
import { DashboardWidget } from '@/lib/dashboard-widgets';
import { FormularyAccessData } from '@/lib/types/dashboard';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface FormularyAccessWidgetProps {
  widget: DashboardWidget;
  data: FormularyAccessData;
}

export function FormularyAccessWidget({ widget, data }: FormularyAccessWidgetProps) {
  const getCoverageIcon = (coverage: string) => {
    switch (coverage) {
      case 'preferred':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'standard':
        return <CheckCircleIcon className="h-4 w-4 text-blue-500" />;
      case 'non_preferred':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'not_covered':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircleIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCoverageColor = (coverage: string): string => {
    switch (coverage) {
      case 'preferred':
        return 'text-green-600';
      case 'standard':
        return 'text-blue-600';
      case 'non_preferred':
        return 'text-yellow-600';
      case 'not_covered':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{widget.title}</h3>
        <CheckCircleIcon className="h-5 w-5 text-gray-400" />
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">{data.totalAccounts.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Accounts</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-green-600">{data.favorableAccounts.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Favorable</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-blue-600">{data.accessRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-500">Access Rate</p>
        </div>
      </div>
      
      {/* Access Rate Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Access Rate</span>
          <span>{data.accessRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(data.accessRate, 100)}%` }}
          ></div>
        </div>
      </div>
      
      {/* Top Payers */}
      {data.topPayers.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Top Payers</h4>
          <div className="space-y-2">
            {data.topPayers.slice(0, 3).map((payer) => (
              <div key={payer.payerId} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  {getCoverageIcon(payer.coverage)}
                  <span className="text-gray-600 truncate">{payer.payerName}</span>
                </div>
                <span className={`font-medium ${getCoverageColor(payer.coverage)}`}>
                  {payer.coverage.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
