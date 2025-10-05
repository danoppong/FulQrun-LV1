// src/components/dashboard/widgets/SampleDistributionWidget.tsx
// Sample Distribution Widget Component
// Compact version of sample distribution for dashboard

'use client';

import React from 'react';
import { DashboardWidget } from '@/lib/dashboard-widgets';
import { SampleDistributionData } from '@/lib/types/dashboard';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface SampleDistributionWidgetProps {
  widget: DashboardWidget;
  data: SampleDistributionData;
}

export function SampleDistributionWidget({ widget, data }: SampleDistributionWidgetProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{widget.title}</h3>
        <DocumentTextIcon className="h-5 w-5 text-gray-400" />
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">{data.totalSamples.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Samples</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-green-600">{data.totalScripts.toLocaleString()}</p>
          <p className="text-sm text-gray-500">New Scripts</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-blue-600">{data.ratio.toFixed(2)}</p>
          <p className="text-sm text-gray-500">Ratio</p>
        </div>
      </div>
      
      {/* Top Products */}
      {data.topProducts.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Top Products</h4>
          <div className="space-y-2">
            {data.topProducts.slice(0, 3).map((product) => (
              <div key={product.productId} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate">{product.productName}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-900">{product.samples.toLocaleString()}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-green-600">{product.scripts.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
