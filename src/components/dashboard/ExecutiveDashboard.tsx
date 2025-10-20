'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PharmaceuticalDashboard } from '../../design-system/components/pharmaceutical-dashboard';
import { PharmaTrendChart, MarketShareChart, HCPEngagementHeatmap } from '../../design-system/components/pharmaceutical-charts';
import { ExecutiveSummaryWidget, LiveKPIGrid, MLInsightsPanel } from './real-time-widgets';
import { useRealTimeDashboard, generateMockKPIs, generateMockInsights } from '../../lib/store/dashboard-store';

// Executive Dashboard Component
const ExecutiveDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '12M'>('3M');
  const { setCurrentUser, bulkUpdateKPIs, insights } = useRealTimeDashboard('exec-user');

  // Mock data for demonstration
  const mockPrescriptionData = [
    { month: 'Jan', trx: 1200, nrx: 180, target: 1300, mlPrediction: 1350, confidence: 15 },
    { month: 'Feb', trx: 1250, nrx: 190, target: 1300, mlPrediction: 1400, confidence: 12 },
    { month: 'Mar', trx: 1180, nrx: 175, target: 1300, mlPrediction: 1320, confidence: 18 },
    { month: 'Apr', trx: 1320, nrx: 200, target: 1300, mlPrediction: 1450, confidence: 10 },
    { month: 'May', trx: 1380, nrx: 210, target: 1300, mlPrediction: 1500, confidence: 8 },
    { month: 'Jun', trx: 1420, nrx: 215, target: 1300, mlPrediction: 1520, confidence: 12 }
  ];

  const mockMarketShareData = [
    { product: 'Product A', share: 23.5, previousPeriod: 22.1, competitor1: 18.2, competitor2: 15.8, competitor3: 12.4 },
    { product: 'Product B', share: 18.7, previousPeriod: 19.2, competitor1: 16.5, competitor2: 14.3, competitor3: 11.8 },
    { product: 'Product C', share: 15.2, previousPeriod: 14.8, competitor1: 13.9, competitor2: 12.1, competitor3: 10.5 },
    { product: 'Competitors', share: 42.6, previousPeriod: 43.9, competitor1: 20.2, competitor2: 15.8, competitor3: 6.6 }
  ];

  const mockHCPData = [
    { hcpId: '1', name: 'Dr. Sarah Johnson', specialty: 'Cardiology', engagementScore: 85, prescriptions: 245, lastVisit: '2024-10-07', territory: 'North' },
    { hcpId: '2', name: 'Dr. Michael Chen', specialty: 'Internal Medicine', engagementScore: 92, prescriptions: 312, lastVisit: '2024-10-06', territory: 'South' },
    { hcpId: '3', name: 'Dr. Emily Rodriguez', specialty: 'Family Medicine', engagementScore: 78, prescriptions: 189, lastVisit: '2024-10-05', territory: 'East' },
    { hcpId: '4', name: 'Dr. James Wilson', specialty: 'Cardiology', engagementScore: 65, prescriptions: 156, lastVisit: '2024-10-04', territory: 'West' },
    { hcpId: '5', name: 'Dr. Lisa Thompson', specialty: 'Endocrinology', engagementScore: 88, prescriptions: 278, lastVisit: '2024-10-03', territory: 'Central' }
  ];

  // Initialize mock data
  useEffect(() => {
    // Set current user
    setCurrentUser({
      id: 'exec-user',
      role: 'admin',
      territories: ['north', 'south', 'east', 'west', 'central']
    });

    // Load mock KPIs
    const mockKPIs = generateMockKPIs();
    bulkUpdateKPIs(mockKPIs);

    // Load mock insights if none exist
    if (insights.length === 0) {
      const mockInsights = generateMockInsights();
      mockInsights.forEach(_insight => {
        // Note: addInsight would be called here in real implementation
      });
    }
  }, [setCurrentUser, bulkUpdateKPIs, insights.length]);

  return (
    <PharmaceuticalDashboard
      title="Executive Dashboard"
      subtitle="Comprehensive pharmaceutical sales performance and insights"
      loading={false}
    >
      {/* Executive Summary - Full Width */}
      <div className="col-span-full">
        <ExecutiveSummaryWidget 
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      </div>

      {/* KPI Grid - Full Width */}
      <div className="col-span-full">
        <LiveKPIGrid maxCards={6} />
      </div>

      {/* Charts Row */}
      <div className="col-span-full lg:col-span-2">
        <PharmaTrendChart
          data={mockPrescriptionData}
          title="Prescription Trends with ML Forecasting"
          timeRange="6M"
          showMLPrediction={true}
          showTargetLine={true}
          height={400}
        />
      </div>

      <div className="col-span-full lg:col-span-2">
        <MarketShareChart
          data={mockMarketShareData}
          title="Market Share Analysis"
          interactive={true}
        />
      </div>

      {/* HCP Engagement and ML Insights */}
      <div className="col-span-full lg:col-span-2">
        <HCPEngagementHeatmap
          data={mockHCPData}
          title="HCP Engagement Performance"
          territory="All Territories"
        />
      </div>

      <div className="col-span-full lg:col-span-2">
        <MLInsightsPanel maxInsights={5} />
      </div>

      {/* Territory Performance Overview */}
      <div className="col-span-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Territory Performance Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {['North', 'South', 'East', 'West', 'Central'].map((territory, index) => {
              const performance = 85 + Math.random() * 30; // Mock performance
              const target = 100;
              const achievement = (performance / target) * 100;
              
              return (
                <motion.div
                  key={territory}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg"
                >
                  <h4 className="font-medium text-gray-900 mb-2">{territory}</h4>
                  <div className="text-2xl font-bold text-medical-blue-600 mb-1">
                    {achievement.toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-500">
                    {performance.toFixed(0)}/{target}
                  </div>
                  
                  {/* Progress Ring */}
                  <div className="mt-3 flex justify-center">
                    <div className="relative w-12 h-12">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-gray-200"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-medical-blue-600"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray={`${achievement}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </PharmaceuticalDashboard>
  );
};

export default ExecutiveDashboard;