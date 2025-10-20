'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PharmaceuticalCard } from '../../design-system/components/pharmaceutical-card';
import { useRealTimeDashboard, type MLInsight } from '../../lib/store/dashboard-store';

// Executive Summary Widget
const ExecutiveSummaryWidget: React.FC<{
  timeRange: '1M' | '3M' | '6M' | '12M';
  onTimeRangeChange: (range: '1M' | '3M' | '6M' | '12M') => void;
}> = ({ timeRange, onTimeRangeChange }) => {
  const { kpis, insights, isRealTimeActive, timeSinceLastUpdate } = useRealTimeDashboard('current-user');

  // Calculate summary metrics
  const totalRevenue = kpis.reduce((sum, kpi) => sum + (kpi.value * 150), 0); // Assuming $150 per prescription
  const targetAchievement = kpis.length > 0 
    ? (kpis.reduce((sum, kpi) => sum + (kpi.value / kpi.target), 0) / kpis.length) * 100 
    : 0;
  const criticalInsights = insights.filter(insight => insight.impact === 'high' && insight.actionRequired).length;

  const formatTimeSince = (ms: number | null): string => {
    if (!ms) return 'Never';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <PharmaceuticalCard 
      title="Executive Summary"
      className="col-span-full"
    >
      <div className="space-y-6">
        {/* Header with real-time status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['1M', '3M', '6M', '12M'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => onTimeRangeChange(range)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    timeRange === range
                      ? 'bg-white text-medical-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          
          {/* Real-time status indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isRealTimeActive ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {isRealTimeActive ? 'Live' : 'Offline'} • {formatTimeSince(timeSinceLastUpdate)}
            </span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-6 bg-gradient-to-br from-medical-blue-50 to-medical-blue-100 rounded-xl"
          >
            <div className="text-3xl font-bold text-medical-blue-600">
              ${totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-medical-blue-500 mt-1">Total Revenue</div>
            <div className="text-xs text-gray-500 mt-2">{timeRange} Performance</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center p-6 bg-gradient-to-br from-clinical-green-50 to-clinical-green-100 rounded-xl"
          >
            <div className="text-3xl font-bold text-clinical-green-600">
              {targetAchievement.toFixed(1)}%
            </div>
            <div className="text-sm text-clinical-green-500 mt-1">Target Achievement</div>
            <div className="text-xs text-gray-500 mt-2">Across All KPIs</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-6 bg-gradient-to-br from-therapeutic-purple-50 to-therapeutic-purple-100 rounded-xl"
          >
            <div className="text-3xl font-bold text-therapeutic-purple-600">
              {criticalInsights}
            </div>
            <div className="text-sm text-therapeutic-purple-500 mt-1">Critical Insights</div>
            <div className="text-xs text-gray-500 mt-2">Requiring Action</div>
          </motion.div>
        </div>

        {/* Recent Critical Insights */}
        {criticalInsights > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Critical Insights Requiring Action</h4>
            <div className="space-y-3">
              {insights
                .filter(insight => insight.impact === 'high' && insight.actionRequired)
                .slice(0, 3)
                .map((insight) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start space-x-3 p-3 bg-regulatory-red-50 rounded-lg border-l-4 border-regulatory-red-400"
                  >
                    <div className="flex-shrink-0 w-2 h-2 bg-regulatory-red-500 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Confidence: {(insight.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        )}
      </div>
    </PharmaceuticalCard>
  );
};

// Live KPI Cards with Real-time Updates
const LiveKPIGrid: React.FC<{
  maxCards?: number;
}> = ({ maxCards = 6 }) => {
  const { kpis, isRealTimeActive } = useRealTimeDashboard('current-user');
  const [animatingKPIs, setAnimatingKPIs] = useState<Set<string>>(new Set());

  // Animate KPI updates
  useEffect(() => {
    kpis.forEach(kpi => {
      if (kpi.lastUpdated && Date.now() - kpi.lastUpdated.getTime() < 1000) {
        setAnimatingKPIs(prev => new Set(prev).add(kpi.id));
        setTimeout(() => {
          setAnimatingKPIs(prev => {
            const next = new Set(prev);
            next.delete(kpi.id);
            return next;
          });
        }, 2000);
      }
    });
  }, [kpis]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '→';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {kpis.slice(0, maxCards).map((kpi) => (
          <motion.div
            key={kpi.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: animatingKPIs.has(kpi.id) ? 1.05 : 1,
              boxShadow: animatingKPIs.has(kpi.id) 
                ? '0 10px 25px -3px rgba(59, 130, 246, 0.3)' 
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 relative overflow-hidden"
          >
            {/* Real-time pulse indicator */}
            {isRealTimeActive && (
              <motion.div
                className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}

            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-600 mb-1">{kpi.name}</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {kpi.value.toLocaleString()}
                  </span>
                  <span className={`text-sm font-medium ${getTrendColor(kpi.trend)}`}>
                    {getTrendIcon(kpi.trend)} {Math.abs(kpi.change).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Progress to Target */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Progress to Target</span>
                <span className="font-medium">
                  {((kpi.value / kpi.target) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-medical-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <div className="text-xs text-gray-500">
                Target: {kpi.target.toLocaleString()}
              </div>
            </div>

            {/* Last Updated */}
            <div className="mt-4 text-xs text-gray-400">
              Updated: {kpi.lastUpdated.toLocaleTimeString()}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// ML Insights Panel
const MLInsightsPanel: React.FC<{
  maxInsights?: number;
}> = ({ maxInsights = 5 }) => {
  const { insights } = useRealTimeDashboard('current-user');

  const getInsightIcon = (type: MLInsight['type']) => {
    switch (type) {
      case 'prediction': return '🔮';
      case 'anomaly': return '⚠️';
      case 'recommendation': return '💡';
      default: return '📊';
    }
  };

  const getImpactColor = (impact: MLInsight['impact']) => {
    switch (impact) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <PharmaceuticalCard 
      title="AI Insights & Recommendations"
      className="h-fit"
    >
      <div className="space-y-4">
        <AnimatePresence>
          {insights.slice(0, maxInsights).map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border-2 ${getImpactColor(insight.impact)}`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-lg">{getInsightIcon(insight.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {insight.title}
                    </h4>
                    {insight.actionRequired && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                        Action Required
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">
                    {insight.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Confidence: {(insight.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-gray-500">
                      {insight.createdAt.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {insights.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🤖</div>
            <p className="text-sm">No insights available</p>
            <p className="text-xs text-gray-400 mt-1">AI analysis will appear here</p>
          </div>
        )}
      </div>
    </PharmaceuticalCard>
  );
};

export {
  ExecutiveSummaryWidget,
  LiveKPIGrid,
  MLInsightsPanel
};