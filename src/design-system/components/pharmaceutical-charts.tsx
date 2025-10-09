'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// Types for pharmaceutical data
interface PrescriptionData {
  month: string;
  trx: number;
  nrx: number;
  target: number;
  mlPrediction?: number;
  confidence?: number;
}

interface MarketShareData {
  product: string;
  share: number;
  previousPeriod: number;
  competitor1: number;
  competitor2: number;
  competitor3: number;
}

interface HCPEngagementData {
  hcpId: string;
  name: string;
  specialty: string;
  engagementScore: number;
  prescriptions: number;
  lastVisit: string;
  territory: string;
}

// Pharmaceutical Trend Chart with ML Predictions
export const PharmaTrendChart: React.FC<{
  data: PrescriptionData[];
  title: string;
  timeRange: '3M' | '6M' | '12M';
  showMLPrediction?: boolean;
  showTargetLine?: boolean;
  height?: number;
}> = ({ 
  data, 
  title, 
  timeRange, 
  showMLPrediction = true, 
  showTargetLine = true, 
  height = 400 
}) => {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const customTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ dataKey: string; value: number; color: string; payload?: Record<string, unknown> }>;
    label?: string | number;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`${label}`}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${entry.value?.toLocaleString()}`}
              {entry.dataKey === 'mlPrediction' && entry.payload?.confidence && (
                <span className="text-gray-500 ml-1">
                  (±{String(entry.payload.confidence)}%)
                </span>
              )}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{timeRange} Trend</span>
          {showMLPrediction && (
            <span className="px-2 py-1 bg-medical-blue-100 text-medical-blue-600 text-xs rounded-full">
              ML Forecast
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip content={customTooltip} />
          <Legend />
          
          {showTargetLine && (
            <ReferenceLine 
              y={data[0]?.target} 
              stroke="#ef4444" 
              strokeDasharray="5 5" 
              label="Target"
            />
          )}
          
          <Line
            type="monotone"
            dataKey="trx"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            name="Total Prescriptions (TRx)"
            animationDuration={isAnimating ? 2000 : 0}
          />
          
          <Line
            type="monotone"
            dataKey="nrx"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
            name="New Prescriptions (NRx)"
            animationDuration={isAnimating ? 2000 : 0}
          />
          
          {showMLPrediction && (
            <Line
              type="monotone"
              dataKey="mlPrediction"
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
              name="ML Prediction"
              animationDuration={isAnimating ? 2000 : 0}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// Market Share Competitive Analysis Chart
export const MarketShareChart: React.FC<{
  data: MarketShareData[];
  title: string;
  interactive?: boolean;
}> = ({ data, title, interactive = true }) => {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  const colors = [
    '#3b82f6', // Medical Blue
    '#10b981', // Clinical Green
    '#ef4444', // Regulatory Red
    '#8b5cf6', // Therapeutic Purple
    '#f59e0b', // Warning Orange
    '#6b7280'  // Neutral Gray
  ];

  const pieData = data.map((item, index) => ({
    name: item.product,
    value: item.share,
    color: colors[index % colors.length],
    previousPeriod: item.previousPeriod
  }));

  const customTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ payload: { name: string; value: number; previousPeriod: number } }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const change = data.value - data.previousPeriod;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Market Share: <span className="font-medium">{data.value.toFixed(1)}%</span>
          </p>
          <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Change: {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500">Current Period vs Previous</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={40}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={(_, index) => interactive && setSelectedSegment(pieData[index].name)}
                onMouseLeave={() => interactive && setSelectedSegment(null)}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={selectedSegment === entry.name ? '#374151' : 'none'}
                    strokeWidth={selectedSegment === entry.name ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip content={customTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend and Details */}
        <div className="space-y-3">
          {pieData.map((item, _index) => {
            const change = item.value - item.previousPeriod;
            return (
              <motion.div
                key={item.name}
                whileHover={{ scale: 1.02 }}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                  selectedSegment === item.name 
                    ? 'border-gray-300 bg-gray-50' 
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-gray-900">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{item.value.toFixed(1)}%</div>
                  <div className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// HCP Engagement Heatmap
export const HCPEngagementHeatmap: React.FC<{
  data: HCPEngagementData[];
  title: string;
  territory: string;
}> = ({ data, title, territory }) => {
  const [sortBy, setSortBy] = useState<'engagement' | 'prescriptions'>('engagement');

  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'engagement') {
      return b.engagementScore - a.engagementScore;
    }
    return b.prescriptions - a.prescriptions;
  });

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getEngagementLevel = (score: number) => {
    if (score >= 80) return 'High';
    if (score >= 60) return 'Medium';
    if (score >= 40) return 'Low';
    return 'Critical';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">Territory: {territory}</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setSortBy('engagement')}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              sortBy === 'engagement'
                ? 'bg-medical-blue-100 text-medical-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Sort by Engagement
          </button>
          <button
            onClick={() => setSortBy('prescriptions')}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              sortBy === 'prescriptions'
                ? 'bg-medical-blue-100 text-medical-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Sort by Rx Volume
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedData.map((hcp, index) => (
          <motion.div
            key={hcp.hcpId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getEngagementColor(hcp.engagementScore)}`} />
                <span className="text-xs font-medium text-gray-500">
                  {getEngagementLevel(hcp.engagementScore)}
                </span>
              </div>
              
              <div>
                <p className="font-medium text-gray-900">{hcp.name}</p>
                <p className="text-sm text-gray-500">{hcp.specialty}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-medium text-gray-900">
                {hcp.prescriptions.toLocaleString()} Rx
              </div>
              <div className="text-sm text-gray-500">
                Score: {hcp.engagementScore}%
              </div>
              <div className="text-xs text-gray-400">
                Last visit: {new Date(hcp.lastVisit).toLocaleDateString()}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>High (80%+)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Medium (60-79%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>Low (40-59%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Critical (&lt;40%)</span>
        </div>
      </div>
    </motion.div>
  );
};

export {
  type PrescriptionData,
  type MarketShareData,
  type HCPEngagementData
};