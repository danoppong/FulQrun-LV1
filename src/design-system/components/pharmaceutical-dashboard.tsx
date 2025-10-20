'use client';

import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PharmaceuticalCard } from './pharmaceutical-card';

// Dashboard Layout Component
export const PharmaceuticalDashboard: React.FC<{
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
}> = ({ title, subtitle, children, loading = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="pharmaceutical-dashboard min-h-screen bg-gradient-to-br from-medical-blue-50 to-clinical-green-50 p-4 md:p-6 lg:p-8"
    >
      {/* Header */}
      {(title || subtitle) && (
        <motion.div 
          className="dashboard-header mb-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {title && (
            <h1 className="text-3xl md:text-4xl font-bold text-medical-blue-900 mb-2">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-medical-blue-600 text-lg">
              {subtitle}
            </p>
          )}
        </motion.div>
      )}

      {/* Content Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <DashboardSkeleton />
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="dashboard-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// KPI Dashboard Widget
export const KPIDashboardWidget: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
  description?: string;
  icon?: React.ReactNode;
  pharmaceutical?: boolean;
}> = ({ title, value, change, trend = 'stable', description, icon, pharmaceutical = true }) => {
  const trendColors = {
    up: 'text-therapeutic-green-600',
    down: 'text-regulatory-red-600',
    stable: 'text-medical-blue-600'
  };

  const bgColors = {
    up: 'bg-therapeutic-green-50',
    down: 'bg-regulatory-red-50',
    stable: 'bg-medical-blue-50'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className={`kpi-widget p-6 bg-white rounded-xl shadow-lg border border-gray-100 ${pharmaceutical ? 'pharmaceutical-gradient' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {change && (
              <span className={`text-sm font-medium ${trendColors[trend]}`}>
                {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {change}
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${bgColors[trend]}`}>
            {icon}
          </div>
        )}
      </div>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </motion.div>
  );
};

// Real-time Chart Container
export const PharmaceuticalChart: React.FC<{
  title: string;
  children: React.ReactNode;
  height?: string;
  fullWidth?: boolean;
  loading?: boolean;
}> = ({ title, children, height = '400px', fullWidth = false, loading = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`pharmaceutical-chart bg-white rounded-xl shadow-lg border border-gray-100 p-6 ${
        fullWidth ? 'col-span-full' : ''
      }`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div style={{ height }} className="relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-blue-600"></div>
          </div>
        ) : (
          <Suspense fallback={<ChartSkeleton />}>
            {children}
          </Suspense>
        )}
      </div>
    </motion.div>
  );
};

// Territory Performance Widget
export const TerritoryPerformanceWidget: React.FC<{
  territories: Array<{
    id: string;
    name: string;
    performance: number;
    target: number;
    change: number;
  }>;
}> = ({ territories }) => {
  return (
    <PharmaceuticalCard
      title="Territory Performance"
      className="col-span-full lg:col-span-2"
    >
      <div className="space-y-4">
        {territories.map((territory, index) => (
          <motion.div
            key={territory.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{territory.name}</h4>
              <div className="flex items-center gap-4 mt-2">
                <div className="text-sm text-gray-600">
                  Performance: <span className="font-medium">{territory.performance}%</span>
                </div>
                <div className="text-sm text-gray-600">
                  Target: <span className="font-medium">{territory.target}%</span>
                </div>
              </div>
            </div>
            <div className={`text-sm font-medium ${
              territory.change >= 0 ? 'text-therapeutic-green-600' : 'text-regulatory-red-600'
            }`}>
              {territory.change >= 0 ? '+' : ''}{territory.change}%
            </div>
          </motion.div>
        ))}
      </div>
    </PharmaceuticalCard>
  );
};

// Dashboard Skeleton Loader
const DashboardSkeleton: React.FC = () => {
  return (
    <div className="dashboard-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Chart Skeleton Loader
const ChartSkeleton: React.FC = () => {
  return (
    <div className="absolute inset-0 animate-pulse">
      <div className="h-full bg-gray-200 rounded"></div>
    </div>
  );
};

// Quick Actions Panel
export const QuickActionsPanel: React.FC<{
  actions: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    pharmaceutical?: boolean;
  }>;
}> = ({ actions }) => {
  return (
    <PharmaceuticalCard title="Quick Actions" className="pharmaceutical-actions">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action) => (
          <motion.button
            key={action.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.onClick}
            className={`flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 ${
              action.pharmaceutical 
                ? 'border-medical-blue-200 bg-medical-blue-50 hover:bg-medical-blue-100 text-medical-blue-700'
                : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            {action.icon}
            <span className="font-medium">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </PharmaceuticalCard>
  );
};

export {
  DashboardSkeleton,
  ChartSkeleton
};