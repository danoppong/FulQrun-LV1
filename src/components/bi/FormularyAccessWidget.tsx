// src/components/bi/FormularyAccessWidget.tsx
// Formulary Access Widget Component
// Displays formulary access metrics and payer coverage analysis

'use client';

import React from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface FormularyAccessWidgetProps {
  formularyAccess: Array<{
    productId: string;
    productName: string;
    totalPayers: number;
    favorablePayers: number;
    coverageBreakdown: Record<string, number>;
  }>;
}

export function FormularyAccessWidget({ formularyAccess }: FormularyAccessWidgetProps) {
  // Ensure array is properly initialized
  const safeFormularyAccess = Array.isArray(formularyAccess) ? formularyAccess : [];
  
  const totalPayers = safeFormularyAccess.reduce((sum, item) => sum + item.totalPayers, 0);
  const totalFavorable = safeFormularyAccess.reduce((sum, item) => sum + item.favorablePayers, 0);
  const overallAccessRate = totalPayers > 0 ? (totalFavorable / totalPayers) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Formulary Access Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Formulary Access Overview</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <CheckCircleIcon className="h-5 w-5" />
            <span>{safeFormularyAccess.length} Products</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{totalPayers.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Payers</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{totalFavorable.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Favorable Access</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{overallAccessRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-500">Access Rate</p>
          </div>
        </div>

        {safeFormularyAccess.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No formulary access data available</p>
        ) : (
          <div className="space-y-4">
            {safeFormularyAccess.map((item) => {
              const accessRate = item.totalPayers > 0 ? (item.favorablePayers / item.totalPayers) * 100 : 0;
              
              return (
                <div key={item.productId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-900">{item.productName}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      accessRate >= 80 ? 'bg-green-100 text-green-800' :
                      accessRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {accessRate.toFixed(1)}% Access
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Coverage Breakdown</p>
                      <div className="space-y-1">
                        {Object.entries(item.coverageBreakdown).map(([level, count]) => (
                          <div key={level} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              {level === 'preferred' && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                              {level === 'standard' && <CheckCircleIcon className="h-4 w-4 text-blue-500" />}
                              {level === 'non_preferred' && <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />}
                              {level === 'not_covered' && <XCircleIcon className="h-4 w-4 text-red-500" />}
                              <span className="capitalize">{level.replace('_', ' ')}</span>
                            </div>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{item.favorablePayers}</p>
                      <p className="text-sm text-gray-500">Favorable Payers</p>
                      <p className="text-xs text-gray-400">out of {item.totalPayers} total</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
