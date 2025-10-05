// src/components/bi/SampleDistributionWidget.tsx
// Sample Distribution Widget Component
// Displays sample distribution metrics and ROI analysis

'use client';

import React from 'react';
import { DocumentTextIcon, BeakerIcon } from '@heroicons/react/24/outline';

interface SampleDistributionWidgetProps {
  sampleDistribution: Array<{
    productId: string;
    productName: string;
    totalSamples: number;
  }>;
  sampleToScriptRatios: Array<{
    productId: string;
    productName: string;
    samples: number;
    scripts: number;
    ratio: number;
  }>;
}

export function SampleDistributionWidget({ sampleDistribution, sampleToScriptRatios }: SampleDistributionWidgetProps) {
  // Ensure arrays are properly initialized
  const safeSampleDistribution = Array.isArray(sampleDistribution) ? sampleDistribution : [];
  const safeSampleToScriptRatios = Array.isArray(sampleToScriptRatios) ? sampleToScriptRatios : [];
  
  const totalSamples = safeSampleDistribution.reduce((sum, item) => sum + item.totalSamples, 0);
  const totalScripts = safeSampleToScriptRatios.reduce((sum, item) => sum + item.scripts, 0);
  const overallRatio = totalScripts > 0 ? totalSamples / totalScripts : 0;

  return (
    <div className="space-y-6">
      {/* Sample Distribution Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Sample Distribution Overview</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <BeakerIcon className="h-5 w-5" />
            <span>{safeSampleDistribution.length} Products</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{totalSamples.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Samples</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{totalScripts.toLocaleString()}</p>
            <p className="text-sm text-gray-500">New Scripts</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{overallRatio.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Overall Ratio</p>
          </div>
        </div>

        {safeSampleDistribution.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No sample distribution data available</p>
        ) : (
          <div className="space-y-3">
            {safeSampleDistribution.map((item) => (
              <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-500">{item.productId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{item.totalSamples.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Samples</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sample-to-Script Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Sample-to-Script Analysis</h3>
        
        {safeSampleToScriptRatios.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No sample-to-script data available</p>
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
                    {item.ratio.toFixed(1)}:1 Ratio
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">{item.samples.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Samples</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">{item.scripts.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Scripts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">
                      {item.scripts > 0 ? ((item.samples / item.scripts) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-sm text-gray-500">Efficiency</p>
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
