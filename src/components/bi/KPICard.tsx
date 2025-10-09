// src/components/bi/KPICard.tsx
// KPI Card Component for displaying pharmaceutical KPIs
// Shows KPI values with trends, confidence scores, and metadata

'use client';

import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline';

interface KPICardProps {
  title: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
  confidence: number;
  metadata?: Record<string, unknown>;
  format?: 'number' | 'percentage' | 'currency' | 'ratio';
  precision?: number;
  onClick?: () => void;
  clickable?: boolean;
}

export function KPICard({
  title,
  value,
  trend,
  color,
  confidence,
  metadata = {},
  format = 'number',
  precision = 0,
  onClick,
  clickable = false
}: KPICardProps) {
  const formatValue = (val: number): string => {
    switch (format) {
      case 'percentage':
        return `${val.toFixed(precision)}%`;
      case 'currency':
        return `$${val.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })}`;
      case 'ratio':
        return val.toFixed(precision);
      case 'number':
      default:
        return val.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision });
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
      case 'stable':
      default:
        return <MinusIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
      default:
        return 'text-gray-600';
    }
  };

  const getConfidenceColor = () => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800';
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow p-6 transition-shadow ${
        clickable ? 'hover:shadow-lg cursor-pointer hover:bg-gray-50' : 'hover:shadow-md'
      }`}
      onClick={clickable ? onClick : undefined}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 truncate">{title}</h3>
        <div className="flex items-center space-x-2">
          {getTrendIcon()}
          <span className={`text-xs font-medium ${getTrendColor()}`}>
            {trend === 'up' ? '+' : trend === 'down' ? '-' : '='}
          </span>
        </div>
      </div>
      
      <div className="flex items-baseline justify-between">
        <div>
          <p className={`text-2xl font-bold ${color}`}>
            {formatValue(value)}
          </p>
          {metadata.periodStart && metadata.periodEnd && (
            <p className="text-xs text-gray-500 mt-1">
              {new Date(metadata.periodStart as string | number | Date).toLocaleDateString()} - {new Date(metadata.periodEnd as string | number | Date).toLocaleDateString()}
            </p>
          )}
        </div>
        
        <div className="text-right">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor()}`}>
            {(confidence * 100).toFixed(0)}% confidence
          </span>
        </div>
      </div>

      {/* Additional metadata */}
      {Object.keys(metadata).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            {metadata.productId && (
              <div>
                <span className="font-medium">Product:</span> {String(metadata.productId)}
              </div>
            )}
            {metadata.territoryId && (
              <div>
                <span className="font-medium">Territory:</span> {String(metadata.territoryId)}
              </div>
            )}
            {metadata.totalHCPs && (
              <div>
                <span className="font-medium">Total HCPs:</span> {Number(metadata.totalHCPs)}
              </div>
            )}
            {metadata.engagedHCPs && (
              <div>
                <span className="font-medium">Engaged:</span> {Number(metadata.engagedHCPs)}
              </div>
            )}
            {metadata.totalCalls && (
              <div>
                <span className="font-medium">Total Calls:</span> {Number(metadata.totalCalls)}
              </div>
            )}
            {metadata.uniqueHCPs && (
              <div>
                <span className="font-medium">Unique HCPs:</span> {Number(metadata.uniqueHCPs)}
              </div>
            )}
            {metadata.totalSamples && (
              <div>
                <span className="font-medium">Samples:</span> {Number(metadata.totalSamples)}
              </div>
            )}
            {metadata.nrx && (
              <div>
                <span className="font-medium">NRx:</span> {Number(metadata.nrx)}
              </div>
            )}
            {metadata.totalAccounts && (
              <div>
                <span className="font-medium">Accounts:</span> {Number(metadata.totalAccounts)}
              </div>
            )}
            {metadata.favorableAccounts && (
              <div>
                <span className="font-medium">Favorable:</span> {Number(metadata.favorableAccounts)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
