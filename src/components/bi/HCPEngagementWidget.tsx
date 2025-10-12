// src/components/bi/HCPEngagementWidget.tsx
// HCP Engagement Widget Component
// Displays HCP engagement metrics and recent call activity

'use client';

import React from 'react';
import { UserGroupIcon, PhoneIcon } from '@heroicons/react/24/outline';

interface HCPEngagementWidgetProps {
  hcpEngagement: {
    totalHCPs: number;
    engagedHCPs: number;
    engagementRate: number;
    avgInteractions: number;
  };
  recentCalls: unknown[];
}

export function HCPEngagementWidget({ hcpEngagement, recentCalls }: HCPEngagementWidgetProps) {
  // Ensure safe access to hcpEngagement properties with defaults
  const safeHcpEngagement = {
    totalHCPs: hcpEngagement?.totalHCPs || 0,
    engagedHCPs: hcpEngagement?.engagedHCPs || 0,
    engagementRate: hcpEngagement?.engagementRate || 0,
    avgInteractions: hcpEngagement?.avgInteractions || 0
  };
  
  // Ensure recentCalls is an array
  const safeRecentCalls = Array.isArray(recentCalls) ? recentCalls : [];

  return (
    <div className="space-y-6">
      {/* HCP Engagement Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">HCP Engagement Summary</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <UserGroupIcon className="h-5 w-5" />
            <span>{safeHcpEngagement.totalHCPs} Total HCPs</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{safeHcpEngagement.totalHCPs}</p>
            <p className="text-sm text-gray-500">Total HCPs</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{safeHcpEngagement.engagedHCPs}</p>
            <p className="text-sm text-gray-500">Engaged HCPs</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{safeHcpEngagement.engagementRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-500">Engagement Rate</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{safeHcpEngagement.avgInteractions.toFixed(1)}</p>
            <p className="text-sm text-gray-500">Avg Interactions</p>
          </div>
        </div>
      </div>

      {/* Recent Call Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Recent Call Activity</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <PhoneIcon className="h-5 w-5" />
            <span>{safeRecentCalls.length} Recent Calls</span>
          </div>
        </div>

        {safeRecentCalls.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent call activity</p>
        ) : (
          <div className="space-y-3">
            {safeRecentCalls.slice(0, 10).map((call, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <PhoneIcon className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">HCP: {call.hcp_id}</p>
                    <p className="text-sm text-gray-500">
                      {call.product_name || 'General Call'} • {call.call_type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {call.outcome?.replace('_', ' ') || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(call.call_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
