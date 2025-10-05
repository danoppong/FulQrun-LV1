// src/components/bi/ProductPerformanceChart.tsx
// Product Performance Chart Component
// Displays product-level performance metrics and sample-to-script ratios

'use client';

import React from 'react';
import { BeakerIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface ProductPerformanceChartProps {
  productPerformance: Array<{
    productId: string;
    productName: string;
    totalVolume: number;
    newVolume: number;
    refillVolume: number;
  }>;
  sampleToScriptRatios: Array<{
    productId: string;
    productName: string;
    samples: number;
    scripts: number;
    ratio: number;
  }>;
}

export function ProductPerformanceChart({ productPerformance, sampleToScriptRatios }: ProductPerformanceChartProps) {
  // Ensure arrays are properly initialized
  const safeProductPerformance = Array.isArray(productPerformance) ? productPerformance : [];
  const safeSampleToScriptRatios = Array.isArray(sampleToScriptRatios) ? sampleToScriptRatios : [];

  return (
    <div className="space-y-6">
      {/* Product Performance Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Product Performance Overview</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <BeakerIcon className="h-5 w-5" />
            <span>{safeProductPerformance.length} Products</span>
          </div>
        </div>

        {safeProductPerformance.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No product performance data available</p>
        ) : (
          <div className="space-y-4">
            {safeProductPerformance.map((product) => (
              <div key={product.productId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-900">{product.productName}</h4>
                  <span className="text-sm text-gray-500">{product.productId}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{product.totalVolume.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Total Volume</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{product.newVolume.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">New Prescriptions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{product.refillVolume.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Refills</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sample-to-Script Ratios */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Sample-to-Script Ratios</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <DocumentTextIcon className="h-5 w-5" />
            <span>{safeSampleToScriptRatios.length} Products</span>
          </div>
        </div>

        {safeSampleToScriptRatios.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No sample distribution data available</p>
        ) : (
          <div className="space-y-4">
            {safeSampleToScriptRatios.map((item) => (
              <div key={item.productId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-900">{item.productName}</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.ratio < 10 ? 'bg-green-100 text-green-800' :
                    item.ratio < 15 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.ratio.toFixed(1)}:1
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">{item.samples.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Samples Distributed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">{item.scripts.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">New Scripts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">{item.ratio.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Ratio</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
