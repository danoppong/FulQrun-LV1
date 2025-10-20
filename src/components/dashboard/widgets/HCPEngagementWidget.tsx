// src/components/dashboard/widgets/HCPEngagementWidget.tsx
// HCP Engagement Widget Component
// Shows HCP engagement metrics for dashboard

'use client';

import React from 'react';
import { DashboardWidget } from '@/lib/dashboard-widgets'
import { HCPEngagementData } from '@/lib/types/dashboard'
import { UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface HCPEngagementWidgetProps {
  widget: DashboardWidget;
  data: HCPEngagementData;
}

export function HCPEngagementWidget({ widget, data }: HCPEngagementWidgetProps) {
  const engagementRatePct = Math.round(data.engagementRate * 100);
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{widget.title}</h3>
        <UserGroupIcon className="h-5 w-5 text-gray-400" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">{data.totalHCPs.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total HCPs</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-green-600">{data.engagedHCPs.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Engaged</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-blue-600">{engagementRatePct}%</p>
          <p className="text-sm text-gray-500">Engagement</p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Average Interactions</h4>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <ChartBarIcon className="h-4 w-4 mr-1" />
            Per HCP
          </div>
          <div className="text-gray-900 font-medium">{data.avgInteractions.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
}