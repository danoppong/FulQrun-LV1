'use client';

import React from 'react';

interface RecentActivityFeedProps {
  title: string;
  activities: any[];
  type: 'prescriptions' | 'calls';
}

export function RecentActivityFeed({ title, activities, type }: RecentActivityFeedProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <div className="p-6">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent {type} available</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-900">Activity {index + 1}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}