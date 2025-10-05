// src/components/dashboard/widgets/ProductPerformanceWidget.tsx
// Product Performance Widget Component
// Compact version of product performance for dashboard

'use client';

import React from 'react';
import { DashboardWidget } from '@/lib/dashboard-widgets';
import { ProductPerformanceData } from '@/lib/types/dashboard';
import { BeakerIcon } from '@heroicons/react/24/outline';

interface ProductPerformanceWidgetProps {
  widget: DashboardWidget;
  data: ProductPerformanceData;
}

interface ProductSummaryCardProps {
  product: {
    id: string;
    name: string;
    totalVolume: number;
    newVolume: number;
    refillVolume: number;
  };
}

function ProductSummaryCard({ product }: ProductSummaryCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
        <BeakerIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <p className="font-medium text-gray-900">{product.totalVolume.toLocaleString()}</p>
          <p className="text-gray-500">Total</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-green-600">{product.newVolume.toLocaleString()}</p>
          <p className="text-gray-500">New</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-blue-600">{product.refillVolume.toLocaleString()}</p>
          <p className="text-gray-500">Refill</p>
        </div>
      </div>
    </div>
  );
}

export function ProductPerformanceWidget({ widget, data }: ProductPerformanceWidgetProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{widget.title}</h3>
        <BeakerIcon className="h-5 w-5 text-gray-400" />
      </div>
      
      {data.products.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No product performance data available</p>
      ) : (
        <div className="space-y-3">
          {data.products.slice(0, 3).map((product) => (
            <ProductSummaryCard key={product.id} product={product} />
          ))}
          {data.products.length > 3 && (
            <p className="text-xs text-gray-500 text-center">
              +{data.products.length - 3} more products
            </p>
          )}
        </div>
      )}
    </div>
  );
}
