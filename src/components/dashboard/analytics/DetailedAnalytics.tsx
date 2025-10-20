// src/components/dashboard/analytics/DetailedAnalytics.tsx
// Detailed Analytics Component for KPI drill-down views
// Provides comprehensive analytics and insights for individual KPIs

'use client';

import React, { useState, useEffect } from 'react';
import { PharmaKPICardData } from '@/lib/types/dashboard';
import { AlertTriangle, CheckCircle, Info, Target, TrendingUp, Users, Calendar } from 'lucide-react';

interface DetailedAnalyticsProps {
  kpiData: PharmaKPICardData;
  kpiId: string;
  organizationId: string;
  productId?: string;
  territoryId?: string;
}

interface AnalyticsInsight {
  type: 'success' | 'warning' | 'info' | 'target';
  icon: React.ReactNode;
  title: string;
  description: string;
  value?: string;
}

export function DetailedAnalytics({
  kpiData,
  kpiId,
  organizationId: _organizationId,
  productId: _productId,
  territoryId: _territoryId
}: DetailedAnalyticsProps) {
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const generateInsights = async () => {
    setLoading(true);
    
    // Generate insights based on KPI data
    const generatedInsights: AnalyticsInsight[] = [];

    // Performance insights
    if (kpiData.confidence > 0.9) {
      generatedInsights.push({
        type: 'success',
        icon: <CheckCircle className="h-5 w-5" />,
        title: 'High Data Quality',
        description: 'This KPI has excellent data confidence and reliability.',
        value: `${(kpiData.confidence * 100).toFixed(0)}% confidence`
      });
    } else if (kpiData.confidence < 0.7) {
      generatedInsights.push({
        type: 'warning',
        icon: <AlertTriangle className="h-5 w-5" />,
        title: 'Data Quality Concern',
        description: 'This KPI has lower confidence due to data limitations.',
        value: `${(kpiData.confidence * 100).toFixed(0)}% confidence`
      });
    }

    // Trend insights
    if (kpiData.trend === 'up') {
      generatedInsights.push({
        type: 'success',
        icon: <TrendingUp className="h-5 w-5" />,
        title: 'Positive Trend',
        description: 'This metric is showing upward movement.',
        value: kpiData.metadata?.trendPercentage ? `+${kpiData.metadata.trendPercentage}%` : undefined
      });
    } else if (kpiData.trend === 'down') {
      generatedInsights.push({
        type: 'warning',
        icon: <AlertTriangle className="h-5 w-5" />,
        title: 'Declining Performance',
        description: 'This metric is showing downward movement.',
        value: kpiData.metadata?.trendPercentage ? `${kpiData.metadata.trendPercentage}%` : undefined
      });
    }

    // KPI-specific insights
    switch (kpiId) {
      case 'trx_total':
        if (kpiData.value > 1000) {
          generatedInsights.push({
            type: 'target',
            icon: <Target className="h-5 w-5" />,
            title: 'Strong Prescription Volume',
            description: 'Total prescriptions are above industry benchmarks.',
            value: `${kpiData.value.toLocaleString()} scripts`
          });
        }
        break;
      
      case 'market_share':
        if (kpiData.value > 15) {
          generatedInsights.push({
            type: 'success',
            icon: <Target className="h-5 w-5" />,
            title: 'Market Leadership',
            description: 'Market share indicates strong competitive position.',
            value: `${kpiData.value.toFixed(1)}% share`
          });
        }
        break;
      
      case 'call_effectiveness':
        if (kpiData.value > 75) {
          generatedInsights.push({
            type: 'success',
            icon: <Users className="h-5 w-5" />,
            title: 'Effective HCP Engagement',
            description: 'Sales calls are achieving good effectiveness scores.',
            value: `${kpiData.value.toFixed(0)}% effective`
          });
        }
        break;
    }

    // Period insights
    if (kpiData.metadata?.periodStart && kpiData.metadata?.periodEnd) {
      const startDate = new Date(kpiData.metadata.periodStart as string);
      const endDate = new Date(kpiData.metadata.periodEnd as string);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      generatedInsights.push({
        type: 'info',
        icon: <Calendar className="h-5 w-5" />,
        title: 'Analysis Period',
        description: `Data covers ${daysDiff} days of activity.`,
        value: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
      });
    }

    setInsights(generatedInsights);
    setLoading(false);
  };

  useEffect(() => {
    generateInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kpiData, kpiId]);

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'target':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getInsightIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      case 'target':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">Current Value</div>
          <div className="text-2xl font-bold text-blue-900">
            {kpiData.format === 'percentage' 
              ? `${kpiData.value.toFixed(1)}%`
              : kpiData.value.toLocaleString()
            }
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="text-sm text-green-600 font-medium">Data Quality</div>
          <div className="text-2xl font-bold text-green-900">
            {(kpiData.confidence * 100).toFixed(0)}%
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="text-sm text-purple-600 font-medium">Trend Status</div>
          <div className="text-2xl font-bold text-purple-900 capitalize">
            {kpiData.trend || 'Stable'}
          </div>
        </div>
      </div>

      {/* Generated Insights */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 ${getInsightIconColor(insight.type)}`}>
                  {insight.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{insight.title}</h4>
                    {insight.value && (
                      <span className="text-sm font-medium opacity-75">
                        {insight.value}
                      </span>
                    )}
                  </div>
                  <p className="text-sm opacity-75 mt-1">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Context */}
      {kpiData.metadata && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Context</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {Object.entries(kpiData.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="font-medium">
                    {typeof value === 'string' && (value.includes('T') || value.includes('-'))
                      ? new Date(value).toLocaleDateString()
                      : String(value)
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900">Next Actions</h4>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                {kpiData.trend === 'down' && (
                  <li>• Investigate factors contributing to the decline</li>
                )}
                {kpiData.confidence < 0.8 && (
                  <li>• Review data sources for completeness and accuracy</li>
                )}
                {kpiId === 'trx_total' && kpiData.value < 500 && (
                  <li>• Consider increased promotional activities</li>
                )}
                {kpiId === 'call_effectiveness' && kpiData.value < 70 && (
                  <li>• Review call messaging and targeting strategies</li>
                )}
                <li>• Monitor this metric closely over the next period</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}